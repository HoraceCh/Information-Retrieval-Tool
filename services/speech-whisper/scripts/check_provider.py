"""Submit one frozen Mandarin and one English recording to an explicitly selected speech provider."""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit

from evaluate_whisper import PROVIDER_ROUTES, character_error_rate, error_rate, load_manifest, transcribe


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--provider", choices=PROVIDER_ROUTES, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--timeout", type=int, default=120)
    args = parser.parse_args()
    url = urlsplit(args.base_url)
    if (not url.hostname or url.username or url.password or url.query or url.fragment
        or not (url.scheme == "https" or (url.scheme == "http" and url.hostname in ("127.0.0.1", "localhost", "::1")))):
        parser.error("Use a trusted HTTPS service URL or HTTP loopback, without embedded credentials.")
    items = load_manifest(args.manifest)
    probes = []
    for language in ("zh", "en"):
        item = next((row for row in items if row.get("language") == language), None)
        if not item or not item.get("sha256"):
            parser.error(f"A frozen {language} recording with SHA-256 is required.")
        probes.append(item)
    results = []
    for item in probes:
        row = {"language": item["language"], "audio_sha256": item["sha256"]}
        try:
            transcript = transcribe(args.base_url, item, args.manifest.parent, args.timeout, args.provider)
            row.update(transcribed=True, wer=error_rate(item["reference"], transcript),
                       cer=character_error_rate(item["reference"], transcript))
        except HTTPError as exc:
            row.update(transcribed=False, http_status=exc.code)
        except (URLError, TimeoutError, ValueError, OSError, AttributeError) as exc:
            row.update(transcribed=False, error=type(exc).__name__)
        results.append(row)
    print(json.dumps({"provider": args.provider, "manifest_sha256": hashlib.sha256(args.manifest.read_bytes()).hexdigest(),
                      "recordings": results}, indent=2))
    return 0 if all(row["transcribed"] for row in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
