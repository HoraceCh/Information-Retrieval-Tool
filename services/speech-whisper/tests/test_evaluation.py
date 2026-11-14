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
