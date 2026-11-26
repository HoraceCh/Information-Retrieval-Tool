#!/usr/bin/env python3
"""Generate explicitly synthetic bilingual benchmark audio; never a human accuracy corpus.

Install the optional requirements-corpus.txt and ffmpeg. Keep the generated WAVs,
manifest.json and provenance.json together. Hashes freeze the actual artifacts;
pinned software does not promise identical audio across operating systems.
"""
from __future__ import annotations

import argparse
import array
import ctypes
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
import platform
import random
import subprocess
import sys
import wave


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def add_noise(pcm: bytes, snr_db: float, seed: int) -> bytes:
    samples = array.array("h")
    samples.frombytes(pcm)
    if sys.byteorder != "little":
        samples.byteswap()
    rms = math.sqrt(sum(value * value for value in samples) / max(1, len(samples)))
    noise_rms = rms / (10 ** (snr_db / 20))
    rng = random.Random(seed)
    result = array.array("h", (max(-32768, min(32767, round(value + rng.gauss(0, noise_rms)))) for value in samples))
    if sys.byteorder != "little":
        result.byteswap()
    return result.tobytes()


def synthesize(prompts_path: Path, output: Path) -> dict:
    import espeakng_loader

    output.mkdir(parents=True, exist_ok=True)
    prompts = json.loads(prompts_path.read_text(encoding="utf-8"))
    library = espeakng_loader.load_library()
    if library is None:
        raise RuntimeError("The optional eSpeak NG library could not be loaded.")
    library.espeak_Initialize.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_char_p, ctypes.c_int]
    library.espeak_Initialize.restype = ctypes.c_int
    # AUDIO_OUTPUT_SYNCHRONOUS: retrieve PCM in process; never play through a device.
    rate = library.espeak_Initialize(2, 0, espeakng_loader.get_data_path().encode(), 0)
    if rate <= 0:
        raise RuntimeError("eSpeak NG initialization failed.")
    library.espeak_Info.restype = ctypes.c_char_p
    library.espeak_SetVoiceByName.argtypes = [ctypes.c_char_p]
    library.espeak_Synth.argtypes = [ctypes.c_void_p, ctypes.c_size_t, ctypes.c_uint, ctypes.c_int, ctypes.c_uint, ctypes.c_uint, ctypes.c_void_p, ctypes.c_void_p]
    callback_type = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
    chunks: list[bytes] = []

    @callback_type
    def callback(samples, count, _events):
        if samples and count:
            chunks.append(ctypes.string_at(samples, count * 2))
        return 0

    library.espeak_SetSynthCallback(callback)
    # espeakRATE=1; fixed speed, not user-specific voice cloning.
    library.espeak_SetParameter(1, 155, 0)
    rows = []
    for index, prompt in enumerate(prompts):
        voice = "cmn" if prompt["language"] == "zh" else "en-us"
        if library.espeak_SetVoiceByName(voice.encode()) != 0:
            raise RuntimeError(f"Requested synthetic voice is unavailable: {voice}")
        chunks.clear()
        encoded = prompt["reference"].encode("utf-8")
        if library.espeak_Synth(encoded, len(encoded) + 1, 0, 1, 0, 1, None, None) != 0:
            raise RuntimeError(f"Synthesis failed for {prompt['id']}")
        library.espeak_Synchronize()
        raw = b"".join(chunks)
        if not raw:
            raise RuntimeError(f"Synthesis returned empty PCM for {prompt['id']}")
        transforms = [f"espeak-ng:{voice}:rate155", "resample:16000Hz:mono:pcm_s16le"]
        if prompt["condition"] == "background-noise":
            raw = add_noise(raw, snr_db=15, seed=20261126 + index)
            transforms.append(f"white-noise:SNR15dB:seed{20261126 + index}")
        filters = []
        if prompt["condition"] == "low-quality":
            filters = ["-af", "highpass=f=250,lowpass=f=1800,aresample=8000,aresample=16000"]
            transforms.append("bandlimit:250-1800Hz:resample8000-then16000Hz")
        target = output / f"{prompt['id']}.wav"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", "pipe:0", *filters, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-map_metadata", "-1", str(target)], input=raw, check=True)
        with wave.open(str(target), "rb") as recording:
            duration = recording.getnframes() / recording.getframerate()
        rows.append({**prompt, "audio": target.name, "duration_seconds": duration, "content_type": "audio/wav", "sha256": sha256(target), "source_kind": "synthetic-espeak-ng", "transforms": transforms})
    library.espeak_Terminate()
    manifest = output / "manifest.json"
    manifest.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    data_root = Path(espeakng_loader.get_data_path())
    data_digest = hashlib.sha256()
    for path in sorted(data_root.rglob("*")):
        if path.is_file():
            data_digest.update(path.relative_to(data_root).as_posix().encode())
            data_digest.update(bytes.fromhex(sha256(path)))
    provenance = {
        "dataset_version": "synthetic-espeak-ng-corpus-v1",
        "source_kind": "synthetic-espeak-ng",
        "purpose": "Reproducible smoke/benchmark plumbing; not representative human speech recognition accuracy.",
        "prompts_sha256": sha256(prompts_path),
        "manifest_sha256": sha256(manifest),
        "generator_sha256": sha256(Path(__file__)),
        "software": {"python": platform.python_version(), "platform": platform.platform(), "espeakng_loader": importlib.metadata.version("espeakng-loader"), "espeak_ng": library.espeak_Info(None).decode(), "ffmpeg": subprocess.check_output(["ffmpeg", "-version"], text=True).splitlines()[0]},
        "library_sha256": sha256(Path(espeakng_loader.get_library_path())),
        "voice_data_tree_sha256": data_digest.hexdigest(),
        "sample_count": len(rows),
        "languages": {language: {"sample_count": sum(row["language"] == language for row in rows), "duration_seconds": round(sum(row["duration_seconds"] for row in rows if row["language"] == language), 4)} for language in ("zh", "en")},
        "total_audio_bytes": sum((output / row["audio"]).stat().st_size for row in rows),
        "limitations": ["Single synthetic voice per language; not a human-recorded evaluation dataset.", "Synthetic mixed-language pronunciation and noise do not establish real-world accuracy.", "Compare models only on identical manifest/audio hashes and identical metric normalization.", "Pinned software versions do not guarantee cross-platform byte identity; use the frozen hashes to identify an actual corpus.", "Chinese WER is not linguistically segmented; use CER as the primary Chinese quality indicator."]
    }
    (output / "provenance.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return provenance


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prompts", type=Path, default=Path(__file__).resolve().parents[1] / "evaluation/corpus-v1.prompts.json")
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(synthesize(args.prompts, args.output), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
