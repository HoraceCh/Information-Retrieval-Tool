#!/usr/bin/env python3
"""Evaluate the running local Whisper HTTP service against a user-owned audio manifest."""
from __future__ import annotations
import argparse, json, re, statistics, sys, time, unicodedata, urllib.error, urllib.request
from pathlib import Path

def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    return " ".join(re.findall(r"[\w]+", value, flags=re.UNICODE))

def edit_distance(left: list[str], right: list[str]) -> int:
    previous = list(range(len(right) + 1))
    for i, token in enumerate(left, start=1):
        current = [i]
        for j, other in enumerate(right, start=1):
            current.append(min(current[-1] + 1, previous[j] + 1, previous[j - 1] + (token != other)))
        previous = current
    return previous[-1]

def error_rate(reference: str, hypothesis: str) -> float:
    ref_tokens, hyp_tokens = normalize_text(reference).split(), normalize_text(hypothesis).split()
    if not ref_tokens:
        raise ValueError("Reference transcript must contain at least one token.")
    return edit_distance(ref_tokens, hyp_tokens) / len(ref_tokens)

def load_manifest(path: Path) -> list[dict]:
    items = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(items, list) or not items:
        raise ValueError("Manifest must be a non-empty JSON array.")
    for index, item in enumerate(items):
        if not isinstance(item, dict) or not item.get("audio") or not item.get("reference"):
            raise ValueError(f"Manifest item {index} must include audio and reference.")
        if not item.get("duration_seconds") or float(item["duration_seconds"]) <= 0:
            raise ValueError(f"Manifest item {index} needs positive duration_seconds.")
    return items

def transcribe(base_url: str, item: dict, root: Path, timeout: float) -> str:
    audio_path = (root / item["audio"]).resolve()
    if not audio_path.is_file():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    boundary = "----AI_RETRIEVAL_X_BENCHMARK_BOUNDARY"
    audio_bytes = audio_path.read_bytes()
    content_type = item.get("content_type", "application/octet-stream")
    body = (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"language\"\r\n\r\n"
        f"{item.get('language', 'auto')}\r\n--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"file\"; filename=\"{audio_path.name}\"\r\n"
        f"Content-Type: {content_type}\r\n\r\n"
    ).encode() + audio_bytes + f"\r\n--{boundary}--\r\n".encode()
    request = urllib.request.Request(
        base_url.rstrip("/") + "/api/speech/whisper/transcriptions",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        payload = json.loads(response.read().decode("utf-8"))
    transcript = payload.get("text")
    if not isinstance(transcript, str):
        raise ValueError("Service response did not contain a text string.")
    return transcript

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--timeout", type=float, default=300)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    manifest = load_manifest(args.manifest)
    rows, total_ref_words, total_errors = [], 0, 0
    for index, item in enumerate(manifest, start=1):
        started = time.perf_counter()
        hypothesis = transcribe(args.base_url, item, args.manifest.resolve().parent, args.timeout)
        elapsed = time.perf_counter() - started
        reference_tokens = normalize_text(item["reference"]).split()
        errors = edit_distance(reference_tokens, normalize_text(hypothesis).split())
        duration = float(item["duration_seconds"])
        row = {
            "audio": item["audio"], "language": item.get("language", "auto"),
            "reference": item["reference"], "hypothesis": hypothesis,
            "wer": errors / len(reference_tokens) if reference_tokens else None,
            "latency_seconds": round(elapsed, 3), "audio_duration_seconds": duration,
            "real_time_factor": round(elapsed / duration, 3),
        }
        rows.append(row)
        total_ref_words += len(reference_tokens)
        total_errors += errors
        print(f"[{index}/{len(manifest)}] {item['audio']}: WER={row['wer']:.3f}, latency={elapsed:.2f}s, RTF={row['real_time_factor']:.3f}")
    report = {
        "service": args.base_url, "sample_count": len(rows),
        "aggregate_wer": total_errors / total_ref_words if total_ref_words else None,
        "median_latency_seconds": statistics.median(row["latency_seconds"] for row in rows),
        "median_real_time_factor": statistics.median(row["real_time_factor"] for row in rows),
        "results": rows,
        "notes": [
            "WER uses whitespace-tokenized normalized text and is best interpreted for word-separated languages.",
            "For Chinese, manually inspect output or use a separately validated CER implementation.",
            "Latency includes upload and service inference; compare cold-start and warm runs separately.",
        ],
    }
    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, FileNotFoundError, urllib.error.URLError, TimeoutError) as error:
        print(f"Evaluation failed: {error}", file=sys.stderr)
        raise SystemExit(2)
