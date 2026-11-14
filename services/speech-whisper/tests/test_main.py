from pathlib import Path

from fastapi.testclient import TestClient

from app import main

client = TestClient(main.app)


def test_health_does_not_load_model():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["model_loaded"] is False


def test_transcription_returns_text_and_applies_cors(monkeypatch):
    observed = {}

    def fake_transcribe(file_path, language):
        observed["bytes"] = Path(file_path).read_bytes()
        observed["language"] = language
        return "robotics research"

    monkeypatch.setattr(main, "transcribe_file", fake_transcribe)
    response = client.post(
        "/api/speech/whisper/transcriptions",
        files={"file": ("voice.webm", b"fake-webm-audio", "audio/webm;codecs=opus")},
        data={"language": "auto"},
        headers={"Origin": "https://horacech.github.io"},
    )
    assert response.status_code == 200
    assert response.json() == {"text": "robotics research"}
    assert observed == {"bytes": b"fake-webm-audio", "language": "auto"}
    assert response.headers["access-control-allow-origin"] == "https://horacech.github.io"


def test_explicit_language_is_forwarded(monkeypatch):
    observed = {}
    def fake_transcribe(_path, language):
        observed["language"] = language
        return "你好"
    monkeypatch.setattr(main, "transcribe_file", fake_transcribe)
    response = client.post(
        "/api/speech/whisper/transcriptions",
        files={"file": ("voice.wav", b"audio", "audio/wav")},
        data={"language": "zh"},
    )
    assert response.status_code == 200
    assert observed["language"] == "zh"


def test_empty_audio_is_rejected():
    response = client.post(
        "/api/speech/whisper/transcriptions",
        files={"file": ("empty.webm", b"", "audio/webm")},
    )
    assert response.status_code == 400


def test_unsupported_mime_type_is_rejected():
    response = client.post(
        "/api/speech/whisper/transcriptions",
        files={"file": ("payload.txt", b"not audio", "text/plain")},
    )
    assert response.status_code == 415


def test_oversized_audio_is_rejected(monkeypatch):
    monkeypatch.setattr(main, "MAX_AUDIO_BYTES", 4)
    response = client.post(
        "/api/speech/whisper/transcriptions",
        files={"file": ("large.webm", b"12345", "audio/webm")},
    )
    assert response.status_code == 413


def test_invalid_language_is_rejected():
    response = client.post(
        "/api/speech/whisper/transcriptions",
        files={"file": ("voice.webm", b"audio", "audio/webm")},
        data={"language": "not-a-language"},
    )
    assert response.status_code == 422


def test_inference_error_is_sanitized(monkeypatch):
    def fail(_path, _language):
        raise RuntimeError("internal model path should not leak")
    monkeypatch.setattr(main, "transcribe_file", fail)
    response = client.post(
        "/api/speech/whisper/transcriptions",
        files={"file": ("voice.webm", b"audio", "audio/webm")},
    )
    assert response.status_code == 502
    assert "internal model path" not in response.text
