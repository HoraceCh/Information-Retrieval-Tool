#!/usr/bin/env python3
"""Freeze user-recorded WAV files and fixed prompts into a benchmark manifest."""
import argparse
import hashlib
import json
import wave
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--prompts", type=Path, default=Path(__file__).resolve().parents[1] / "evaluation/corpus-v1.prompts.json")
parser.add_argument("--recordings", required=True, type=Path)
parser.add_argument("--output", type=Path)
args = parser.parse_args()
rows = []
for prompt in json.loads(args.prompts.read_text(encoding="utf-8")):
    audio = args.recordings / (prompt["id"] + ".wav")
    with wave.open(str(audio), "rb") as recording:
        duration = recording.getnframes() / recording.getframerate()
    rows.append({**prompt, "audio": audio.name, "duration_seconds": duration, "content_type": "audio/wav", "sha256": hashlib.sha256(audio.read_bytes()).hexdigest()})
output = args.output or args.recordings / "manifest.json"
if output.resolve().parent != args.recordings.resolve():
    raise ValueError("Manifest must be stored beside the recordings.")
output.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Frozen {len(rows)} recordings: {output}")
