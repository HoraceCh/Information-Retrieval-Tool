import json
from pathlib import Path
import pytest
from scripts.evaluate_whisper import error_rate, load_manifest, normalize_text

def test_normalize_text_uses_unicode_compatibility_and_casefold():
    assert normalize_text("  ＲＯＢＯＴics   LAB ") == "robotics lab"

def test_error_rate_exact_and_substitution():
    assert error_rate("robotics research", "Robotics research") == 0
    assert error_rate("robotics research", "robotics design") == 0.5

def test_error_rate_rejects_empty_reference():
    with pytest.raises(ValueError, match="at least one token"):
        error_rate(" ", "anything")

def test_manifest_requires_duration(tmp_path: Path):
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps([{"audio": "a.wav", "reference": "hello"}]), encoding="utf-8")
    with pytest.raises(ValueError, match="duration_seconds"):
        load_manifest(manifest)

def test_manifest_loads_valid_entries(tmp_path: Path):
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps([{"audio": "a.wav", "reference": "hello world", "duration_seconds": 1.2}]), encoding="utf-8")
    assert load_manifest(manifest)[0]["reference"] == "hello world"
