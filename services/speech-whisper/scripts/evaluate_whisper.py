#!/usr/bin/env python3
"""Evaluate a running local Whisper service using a private, user-owned audio manifest."""
from __future__ import annotations

import argparse
import hashlib
import math
import platform
import subprocess
import threading
from datetime import datetime, timezone
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
        if not isinstance(item, dict) or not isinstance(item.get("audio"), str) or not isinstance(item.get("reference"), str) or not item["reference"].strip():
            raise ValueError(f"Manifest item {index} must include audio and reference.")
        if not item.get("duration_seconds") or not math.isfinite(float(item["duration_seconds"])) or float(item["duration_seconds"]) <= 0:
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
    if item.get("sha256") and hashlib.sha256(audio_bytes).hexdigest() != item["sha256"]:
        raise ValueError("Audio SHA256 does not match frozen manifest: " + item["audio"])
    content_type = item.get("content_type", "audio/wav").split(";", 1)[0].strip().lower()
    body = (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"language\"\r\n\r\n"
        f"{item.get('language', 'auto')}\r\n--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"file\"; filename=\"recording\"\r\n"
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


def read_health(base_url: str) -> dict:
    with urllib.request.urlopen(base_url.rstrip("/") + "/healthz", timeout=10) as response:
        payload = json.loads(response.read())
    if not isinstance(payload, dict): raise ValueError("Health response must be an object.")
    return payload


class ResourceSampler:
    """Optional local process CPU/RSS and device-wide GPU memory, sampled every 100ms."""
    def __init__(self, service_pid=None):
        self.done = threading.Event()
        self.gpu_memory_mib, self.cpu_percent, self.rss_bytes = [], [], []
        self.process = None
        if service_pid is not None:
            import psutil
            self.process = psutil.Process(service_pid)
            self.process.cpu_percent()
        self.worker = threading.Thread(target=self.sample, daemon=True)

    def sample(self):
        while not self.done.is_set():
            if self.process:
                self.cpu_percent.append(self.process.cpu_percent())
                self.rss_bytes.append(self.process.memory_info().rss)
            try:
                result = subprocess.run(["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"], capture_output=True, text=True, timeout=2)
                if result.returncode == 0:
                    self.gpu_memory_mib.append(sum(float(line) for line in result.stdout.splitlines()))
            except (OSError, ValueError, subprocess.TimeoutExpired): pass
            self.done.wait(0.1)

    def start(self): self.worker.start()
    def stop(self):
        self.done.set(); self.worker.join(timeout=3)
        return {"gpu_device_memory_peak_mib": max(self.gpu_memory_mib, default=None),
                "service_cpu_percent_mean": statistics.mean(self.cpu_percent) if self.cpu_percent else None,
                "service_rss_peak_bytes": max(self.rss_bytes, default=None),
                "sampling_interval_seconds": 0.1,
                "scope": "GPU sums all visible devices and other processes; CPU/RSS requires --service-pid on this host. Null means unavailable, never zero usage."}


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
    parser.add_argument("--dataset-version", required=True)
    parser.add_argument("--warm-runs", type=int, default=2)
    parser.add_argument("--require-cold", action="store_true", help="Fail if model is already loaded before the first request")
    parser.add_argument("--service-pid", type=int, help="Optional local Python service PID for psutil CPU/RSS sampling")
    parser.add_argument("--model-cache", type=Path, help="Local model cache directory for byte count (not network download traffic)")
    args = parser.parse_args()
    if args.warm_runs < 1: raise ValueError("warm-runs must be at least 1.")
    health_before = read_health(args.base_url)
    if args.require_cold and health_before.get("model_loaded") is not False:
        raise ValueError("Cold run requires a fresh service with model_loaded=false.")
    manifest = load_manifest(args.manifest)
    sampler = ResourceSampler(args.service_pid)
    sampler.start()
    rows, total_ref_words, total_word_errors = [], 0, 0
    total_ref_chars, total_char_errors = 0, 0
    for index, item in enumerate(manifest * (args.warm_runs + 1), start=1):
        started = time.perf_counter()
        hypothesis = transcribe(args.base_url, item, args.manifest.resolve().parent, args.timeout)
        elapsed = time.perf_counter() - started
        reference_tokens = normalize_text(item["reference"]).split()
        word_errors = edit_distance(reference_tokens, normalize_text(hypothesis).split()) if reference_tokens else 0
        reference_chars = list(normalize_characters(item["reference"]))
        character_errors = edit_distance(reference_chars, list(normalize_characters(hypothesis))) if reference_chars else 0
        duration = float(item["duration_seconds"])
        row = {
            "pass": (index - 1) // len(manifest),
            "phase": "cold-first-request" if index == 1 and health_before.get("model_loaded") is False else "warm",
            "sha256": hashlib.sha256(resolve_audio_path(args.manifest.parent, item["audio"]).read_bytes()).hexdigest(),
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
        print(f"[{index}/{len(manifest) * (args.warm_runs + 1)}] {item['audio']}: WER={row['wer']}, CER={row['cer']:.3f}, latency={elapsed:.2f}s, RTF={row['real_time_factor']:.3f}")

    resources = sampler.stop()
    health_after = read_health(args.base_url)
    warm_rows = [row for row in rows if row["phase"] == "warm"]
    cache_bytes = sum(p.stat().st_size for p in args.model_cache.rglob("*") if p.is_file() and not p.is_symlink()) if args.model_cache else None
    report = {
        "status": "PASS WITH WARNINGS" if resources["service_cpu_percent_mean"] is None or resources["gpu_device_memory_peak_mib"] is None else "PASS",
        "recorded_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset": {"version": args.dataset_version, "manifest_sha256": hashlib.sha256(args.manifest.read_bytes()).hexdigest()},
        "environment": {"platform": platform.platform(), "python": platform.python_version(), "hardware": args.hardware},
        "service_health_before": health_before, "service_health_after": health_after,
        "resources": resources, "model_cache_bytes": cache_bytes,
        "model_download_bytes": None,
        "model_artifact_bytes": health_after.get("model_artifact_bytes"),
        "model_revision": health_after.get("model_revision"),
        "model_acquisition_seconds": health_after.get("model_acquisition_seconds"),
        "model_initialization_seconds": health_after.get("model_initialization_seconds"),
        "model_load_seconds": health_after.get("model_load_seconds"),
        "cold_start_latency_seconds": rows[0]["latency_seconds"] if rows[0]["phase"] == "cold-first-request" else None,
        "warm_median_latency_seconds": statistics.median(row["latency_seconds"] for row in warm_rows) if warm_rows else None,
        "service": args.base_url,
        "configuration": {
            "model_size": health_after.get("model", args.model_size), "device": health_after.get("device", args.device),
            "compute_type": health_after.get("compute_type", args.compute_type), "hardware": args.hardware,
        },
        "sample_count": len(manifest), "request_count": len(rows),
        "aggregate_wer": total_word_errors / total_ref_words if total_ref_words else None,
        "aggregate_cer": total_char_errors / total_ref_chars if total_ref_chars else None,
        "median_latency_seconds": statistics.median(row["latency_seconds"] for row in rows),
        "median_real_time_factor": statistics.median(row["real_time_factor"] for row in rows),
        "results": rows,
        "notes": [
            "model_artifact_bytes is the acquired model snapshot file size, including cache hits; it is not network traffic. model_download_bytes remains null unless separately measured.",
            "model_acquisition_seconds includes download or cache lookup; model_load_seconds is construction after acquisition; initialization includes both.",
            "Cold first request includes lazy model loading and possibly download; pre-cache weights for load-only comparison.",
            "Only compare reports with identical manifest and audio hashes; separate results by language and recording condition.",
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
