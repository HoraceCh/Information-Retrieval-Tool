#!/usr/bin/env python3
"""Evaluate a running local Whisper service using a private, user-owned audio manifest."""
from __future__ import annotations

import argparse
import json
import re
import statistics
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

ALLOWED_AUDIO_TYPES = {
    "audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/x-wav",
    "audio/mpeg", "audio/flac", "audio/aac", "audio/3gpp",
}


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    return " ".join(re.findall(r"[\w]+", value, flags=re.UNICODE))


def normalize_characters(value: str) -> str:
    """NFKC + casefold, remove whitespace; retain punctuation for transparent CER."""
    value = unicodedata.normalize("NFKC", value).casefold()
    return "".join(character for character in value if not character.isspace())


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


def character_error_rate(reference: str, hypothesis: str) -> float:
    ref_chars, hyp_chars = list(normalize_characters(reference)), list(normalize_characters(hypothesis))
    if not ref_chars:
        raise ValueError("Reference transcript must contain at least one non-whitespace character.")
    return edit_distance(ref_chars, hyp_chars) / len(ref_chars)


def load_manifest(path: Path) -> list[dict]:
    items = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(items, list) or not items:
        raise ValueError("Manifest must be a non-empty JSON array.")
    for index, item in enumerate(items):
        if not isinstance(item, dict) or not isinstance(item.get("audio"), str) or not item.get("reference"):
            raise ValueError(f"Manifest item {index} must include audio and reference.")
        if not item.get("duration_seconds") or float(item["duration_seconds"]) <= 0:
            raise ValueError(f"Manifest item {index} needs positive duration_seconds.")
        content_type = item.get("content_type", "audio/wav").split(";", 1)[0].strip().lower()
        if content_type not in ALLOWED_AUDIO_TYPES:
            raise ValueError(f"Manifest item {index} has unsupported content_type: {content_type}")
        language = item.get("language", "auto")
        if not isinstance(language, str) or (language != "auto" and not re.fullmatch(r"[a-z]{2,3}", language.lower())):
            raise ValueError(f"Manifest item {index} has invalid language.")
    return items


def resolve_audio_path(root: Path, relative_path: str) -> Path:
    resolved_root = root.resolve()
    audio_path = (resolved_root / relative_path).resolve()
    if not audio_path.is_relative_to(resolved_root):
        raise ValueError("Audio paths must stay inside the manifest directory.")
    if not audio_path.is_file():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    return audio_path


def transcribe(base_url: str, item: dict, root: Path, timeout: float) -> str:
    audio_path = resolve_audio_path(root, item["audio"])
    boundary = "----AI_RETRIEVAL_X_BENCHMARK_BOUNDARY"
    audio_bytes = audio_path.read_bytes()
    content_type = item.get("content_type", "audio/wav").split(";", 1)[0].strip().lower()
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
    parser.add_argument("--model-size", default="unknown")
    parser.add_argument("--device", default="unknown")
    parser.add_argument("--compute-type", default="unknown")
    parser.add_argument("--hardware", default="not recorded")
    args = parser.parse_args()

    manifest = load_manifest(args.manifest)
    rows, total_ref_words, total_word_errors = [], 0, 0
    total_ref_chars, total_char_errors = 0, 0
    for index, item in enumerate(manifest, start=1):
        started = time.perf_counter()
        hypothesis = transcribe(args.base_url, item, args.manifest.resolve().parent, args.timeout)
        elapsed = time.perf_counter() - started
        reference_tokens = normalize_text(item["reference"]).split()
        word_errors = edit_distance(reference_tokens, normalize_text(hypothesis).split()) if reference_tokens else 0
        reference_chars = list(normalize_characters(item["reference"]))
        character_errors = edit_distance(reference_chars, list(normalize_characters(hypothesis))) if reference_chars else 0
        duration = float(item["duration_seconds"])
        row = {
            "audio": item["audio"], "language": item.get("language", "auto"),
            "reference": item["reference"], "hypothesis": hypothesis,
            "wer": word_errors / len(reference_tokens) if reference_tokens else None,
            "cer": character_errors / len(reference_chars) if reference_chars else None,
            "latency_seconds": round(elapsed, 3), "audio_duration_seconds": duration,
            "real_time_factor": round(elapsed / duration, 3),
        }
        rows.append(row)
        total_ref_words += len(reference_tokens)
        total_word_errors += word_errors
        total_ref_chars += len(reference_chars)
        total_char_errors += character_errors
        print(f"[{index}/{len(manifest)}] {item['audio']}: WER={row['wer']}, CER={row['cer']:.3f}, latency={elapsed:.2f}s, RTF={row['real_time_factor']:.3f}")

    report = {
        "service": args.base_url,
        "configuration": {
            "model_size": args.model_size, "device": args.device,
            "compute_type": args.compute_type, "hardware": args.hardware,
        },
        "sample_count": len(rows),
        "aggregate_wer": total_word_errors / total_ref_words if total_ref_words else None,
        "aggregate_cer": total_char_errors / total_ref_chars if total_ref_chars else None,
        "median_latency_seconds": statistics.median(row["latency_seconds"] for row in rows),
        "median_real_time_factor": statistics.median(row["real_time_factor"] for row in rows),
        "results": rows,
        "notes": [
            "WER uses NFKC/casefolded word tokens and is most useful for whitespace-separated languages.",
            "CER uses NFKC/casefolded Unicode code points with whitespace removed; punctuation is retained.",
            "Latency includes upload and service inference. Compare cold-start and warm runs separately.",
            "Record the same corpus, model, device, compute type, and hardware when comparing configurations.",
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
