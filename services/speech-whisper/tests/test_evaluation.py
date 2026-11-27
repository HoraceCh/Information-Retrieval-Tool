import json
from pathlib import Path
import pytest
from scripts.evaluate_whisper import (
    character_error_rate, error_rate, load_manifest, normalize_characters,
    normalize_text, resolve_audio_path,
)

def test_normalize_text_uses_unicode_compatibility_and_casefold():
    assert normalize_text("  ＲＯＢＯＴics   LAB ") == "robotics lab"

def test_error_rate_exact_and_substitution():
    assert error_rate("robotics research", "Robotics research") == 0
    assert error_rate("robotics research", "robotics design") == 0.5

def test_cer_works_for_chinese_and_ignores_whitespace():
    assert normalize_characters("你好 世界") == "你好世界"
    assert character_error_rate("你好世界", "你好世间") == 0.25

def test_cer_retains_punctuation():
    assert character_error_rate("你好。", "你好！") == pytest.approx(1 / 3)

def test_cer_rejects_empty_reference():
    with pytest.raises(ValueError, match="non-whitespace"):
        character_error_rate("  ", "anything")

def test_error_rate_rejects_empty_reference():
    with pytest.raises(ValueError, match="at least one token"):
        error_rate(" ", "anything")

def test_manifest_requires_duration(tmp_path: Path):
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps([{"audio": "a.wav", "reference": "hello"}]), encoding="utf-8")
    with pytest.raises(ValueError, match="duration_seconds"):
        load_manifest(manifest)

def test_manifest_rejects_unsupported_mime(tmp_path: Path):
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps([{"audio":"a.wav","reference":"hello","duration_seconds":1,"content_type":"text/plain"}]), encoding="utf-8")
    with pytest.raises(ValueError, match="unsupported content_type"):
        load_manifest(manifest)

def test_manifest_loads_valid_entries(tmp_path: Path):
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps([{"audio":"a.wav","reference":"hello world","duration_seconds":1.2}]), encoding="utf-8")
    assert load_manifest(manifest)[0]["reference"] == "hello world"

def test_audio_path_must_remain_inside_manifest_directory(tmp_path: Path):
    with pytest.raises(ValueError, match="inside the manifest directory"):
        resolve_audio_path(tmp_path, "../secret.wav")

def test_audio_path_resolves_existing_file(tmp_path: Path):
    audio = tmp_path / "sample.wav"
    audio.write_bytes(b"audio")
    assert resolve_audio_path(tmp_path, "sample.wav") == audio.resolve()


def test_manifest_rejects_infinite_duration(tmp_path):
    manifest=tmp_path / "manifest.json"
    manifest.write_text(json.dumps([{"audio":"a.wav","reference":"hello","duration_seconds":float("inf")}]))
    with pytest.raises(ValueError, match="duration_seconds"):
        load_manifest(manifest)


def test_audio_manifest_hash_checked_before_request(tmp_path):
    from scripts.evaluate_whisper import transcribe
    (tmp_path / "a.wav").write_bytes(b"changed recording")
    with pytest.raises(ValueError, match="SHA256"):
        transcribe("http://127.0.0.1:1", {"audio":"a.wav", "sha256":"wrong"}, tmp_path, 1)


def test_report_preserves_measured_service_artifact_and_loading_metrics(monkeypatch, tmp_path):
    import sys
    from scripts import evaluate_whisper as evaluation
    audio=tmp_path / "sample.wav"
    audio.write_bytes(b"audio-fixture")
    manifest=tmp_path / "manifest.json"
    manifest.write_text(json.dumps([{"audio":"sample.wav","reference":"hello","duration_seconds":1}]))
    output=tmp_path / "report.json"
    measured={"model_loaded":True,"model":"small","device":"cpu","compute_type":"int8","model_artifact_bytes":123,"model_revision":"abc123","model_acquisition_seconds":2.0,"model_load_seconds":3.0,"model_initialization_seconds":5.0}
    health=iter([{"model_loaded":False},measured])
    monkeypatch.setattr(evaluation,"read_health",lambda _url: next(health))
    monkeypatch.setattr(evaluation,"transcribe",lambda *_a: "hello")
    class Sampler:
        def __init__(self,*_a): pass
        def start(self): pass
        def stop(self): return {"service_cpu_percent_mean":None,"gpu_device_memory_peak_mib":None}
    monkeypatch.setattr(evaluation,"ResourceSampler",Sampler)
    monkeypatch.setattr(sys,"argv",["evaluate_whisper","--manifest",str(manifest),"--dataset-version","test-only","--output",str(output)])
    assert evaluation.main()==0
    report=json.loads(output.read_text())
    assert report["request_count"]==3 and report["sample_count"]==1
    assert report["model_artifact_bytes"]==123
    assert report["model_acquisition_seconds"]==2.0
    assert report["model_load_seconds"]==3.0
    assert report["model_initialization_seconds"]==5.0
    assert report["model_revision"]=="abc123"
    assert report["model_download_bytes"] is None  # Artifact bytes are never asserted to be network traffic.
