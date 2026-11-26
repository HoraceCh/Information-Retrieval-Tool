from pathlib import Path
import threading
import httpx
from fastapi.testclient import TestClient
from app import main
client=TestClient(main.app)

def test_health_does_not_load_model():
    r=client.get("/healthz")
    assert r.status_code==200 and r.json()["model_loaded"] is False

def test_whisper_transcription_and_cors(monkeypatch):
    seen={}
    def fake(path,language):
        seen["bytes"]=Path(path).read_bytes(); seen["language"]=language
        return "robotics research"
    monkeypatch.setattr(main,"transcribe_file",fake)
    r=client.post("/api/speech/whisper/transcriptions",files={"file":("voice.webm",b"audio","audio/webm;codecs=opus")},data={"language":"auto"},headers={"Origin":"https://horacech.github.io"})
    assert r.status_code==200 and r.json()=={"text":"robotics research"}
    assert seen=={"bytes":b"audio","language":"auto"}
    assert r.headers["access-control-allow-origin"]=="https://horacech.github.io"

def test_disallowed_browser_origin_is_rejected_before_processing(monkeypatch):
    monkeypatch.setattr(main,"transcribe_file",lambda *_: (_ for _ in ()).throw(AssertionError("must not run")))
    r=client.post("/api/speech/whisper/transcriptions",files={"file":("a.webm",b"audio","audio/webm")},headers={"Origin":"https://evil.example"})
    assert r.status_code==403 and "not allowed" in r.json()["detail"]

def test_local_whisper_rejects_overlapping_inference(monkeypatch):
    slots=threading.BoundedSemaphore(1)
    monkeypatch.setattr(main,"_inference_slots",slots)
    assert slots.acquire(blocking=False)
    try:
        r=client.post("/api/speech/whisper/transcriptions",files={"file":("a.webm",b"audio","audio/webm")})
        assert r.status_code==429
        assert r.headers["retry-after"]=="3"
    finally:
        slots.release()

def test_whisper_explicit_language(monkeypatch):
    seen={}
    monkeypatch.setattr(main,"transcribe_file",lambda _p,l: seen.setdefault("language",l) or "你好")
    r=client.post("/api/speech/whisper/transcriptions",files={"file":("a.wav",b"audio","audio/wav")},data={"language":"zh"})
    assert r.status_code==200 and seen["language"]=="zh"

def test_empty_audio_rejected():
    assert client.post("/api/speech/whisper/transcriptions",files={"file":("a.webm",b"","audio/webm")}).status_code==400

def test_unsupported_mime_rejected():
    assert client.post("/api/speech/whisper/transcriptions",files={"file":("a.txt",b"text","text/plain")}).status_code==415

def test_oversized_audio_rejected(monkeypatch):
    monkeypatch.setattr(main,"MAX_AUDIO_BYTES",4)
    assert client.post("/api/speech/whisper/transcriptions",files={"file":("a.webm",b"12345","audio/webm")}).status_code==413

def test_invalid_language_rejected():
    assert client.post("/api/speech/whisper/transcriptions",files={"file":("a.webm",b"x","audio/webm")},data={"language":"not-valid"}).status_code==422

def test_whisper_errors_sanitized(monkeypatch):
    monkeypatch.setattr(main,"transcribe_file",lambda *_: (_ for _ in ()).throw(RuntimeError("private path")))
    r=client.post("/api/speech/whisper/transcriptions",files={"file":("a.webm",b"x","audio/webm")})
    assert r.status_code==502 and "private path" not in r.text

def install_fake_client(monkeypatch, fake_post):
    class FakeClient:
        def __init__(self,**_): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*_): pass
        async def post(self,url,**kwargs): return await fake_post(url,**kwargs)
    monkeypatch.setattr(main.httpx,"AsyncClient",FakeClient)

def test_openai_proxy_uses_server_key(monkeypatch):
    monkeypatch.setattr(main,"OPENAI_API_KEY","server-secret")
    seen={}
    async def fake(url,**kw):
        seen.update(url=url,**kw)
        return httpx.Response(200,json={"text":"OpenAI transcript"},request=httpx.Request("POST",url))
    install_fake_client(monkeypatch,fake)
    r=client.post("/api/speech/openai/transcriptions",files={"file":("a.webm",b"audio","audio/webm")},data={"language":"en"})
    assert r.status_code==200 and r.json()=={"text":"OpenAI transcript"}
    assert seen["headers"]["Authorization"]=="Bearer server-secret"
    assert seen["data"]=={"model":"whisper-1","language":"en","response_format":"json"}
    assert seen["files"]["file"][1]==b"audio"

def test_openai_missing_key_returns_503(monkeypatch):
    monkeypatch.setattr(main,"OPENAI_API_KEY","")
    assert client.post("/api/speech/openai/transcriptions",files={"file":("a.wav",b"x","audio/wav")}).status_code==503

def test_deepgram_proxy_auto_detect(monkeypatch):
    monkeypatch.setattr(main,"DEEPGRAM_API_KEY","deepgram-secret")
    seen={}
    async def fake(url,**kw):
        seen.update(url=url,**kw)
        return httpx.Response(200,json={"results":{"channels":[{"alternatives":[{"transcript":"Deepgram transcript"}]}]}},request=httpx.Request("POST",url))
    install_fake_client(monkeypatch,fake)
    r=client.post("/api/speech/deepgram/transcriptions",files={"file":("a.webm",b"audio","audio/webm")})
    assert r.status_code==200 and r.json()=={"text":"Deepgram transcript"}
    assert seen["headers"]["Authorization"]=="Token deepgram-secret"
    assert "detect_language=true" in seen["url"] and seen["content"]==b"audio"

def test_deepgram_explicit_language(monkeypatch):
    monkeypatch.setattr(main,"DEEPGRAM_API_KEY","deepgram-secret")
    async def fake(url,**kw):
        assert "language=zh" in url
        return httpx.Response(200,json={"results":{"channels":[{"alternatives":[{"transcript":"你好"}]}]}},request=httpx.Request("POST",url))
    install_fake_client(monkeypatch,fake)
    r=client.post("/api/speech/deepgram/transcriptions",files={"file":("a.wav",b"x","audio/wav")},data={"language":"zh"})
    assert r.status_code==200 and r.json()=={"text":"你好"}

def test_openai_timeout_sanitized(monkeypatch):
    monkeypatch.setattr(main,"OPENAI_API_KEY","secret")
    async def fake(*_a,**_k): raise httpx.TimeoutException("private")
    install_fake_client(monkeypatch,fake)
    r=client.post("/api/speech/openai/transcriptions",files={"file":("a.wav",b"x","audio/wav")})
    assert r.status_code==504 and "private" not in r.text


def test_deepgram_malformed_payload_is_sanitized(monkeypatch):
    monkeypatch.setattr(main,"DEEPGRAM_API_KEY","deepgram-secret")
    async def fake(url,**kw):
        return httpx.Response(200,json={"results":"unexpected"},request=httpx.Request("POST",url))
    install_fake_client(monkeypatch,fake)
    r=client.post("/api/speech/deepgram/transcriptions",files={"file":("a.wav",b"x","audio/wav")})
    assert r.status_code==502
    assert "unexpected" not in r.text


def test_request_limit_applies_before_multipart_parser(monkeypatch):
    monkeypatch.setattr(main, "MAX_AUDIO_BYTES", 4)
    response = client.post("/api/speech/whisper/transcriptions", content=b"x" * 65541,
                           headers={"Content-Type": "multipart/form-data; boundary=broken"})
    assert response.status_code == 413


def test_cloud_requests_share_global_busy_limit(monkeypatch):
    # Locate the real middleware instance; hold its global slot before sending.
    middleware = main.app.middleware_stack
    while not isinstance(middleware, main.SpeechRequestLimits):
        middleware = middleware.app
    assert middleware.slots.acquire(blocking=False)
    try:
        response = client.post("/api/speech/openai/transcriptions", files={"file": ("a.wav", b"audio", "audio/wav")})
        assert response.status_code == 429 and response.headers["retry-after"] == "3"
    finally:
        middleware.slots.release()


def test_gpu_missing_device_gives_explicit_diagnostic(monkeypatch):
    # No actual CUDA library or model is used by this unit test.
    import sys
    from types import SimpleNamespace
    monkeypatch.setattr(main, "_model", None)
    monkeypatch.setattr(main, "MODEL_DEVICE", "cuda")
    monkeypatch.setitem(sys.modules, "faster_whisper", SimpleNamespace(WhisperModel=lambda *_a, **_k: None))
    monkeypatch.setitem(sys.modules, "ctranslate2", SimpleNamespace(get_cuda_device_count=lambda: 0))
    import pytest
    with pytest.raises(RuntimeError, match="CUDA device is unavailable"):
        main.get_whisper_model()


def test_gemini_proxy_keeps_key_server_side(monkeypatch):
    monkeypatch.setattr(main, "GEMINI_API_KEY", "test-only-key")
    async def fake(url, **kwargs):
        assert url.startswith("https://generativelanguage.googleapis.com/")
        assert kwargs["headers"] == {"x-goog-api-key": "test-only-key", "Content-Type": "application/json"}
        return httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": "你好 robotics"}]}}]}, request=httpx.Request("POST", url))
    install_fake_client(monkeypatch, fake)
    r=client.post("/api/speech/gemini/transcriptions", files={"file": ("a.wav", b"audio", "audio/wav")})
    assert r.status_code == 200 and r.json() == {"text": "你好 robotics"}
    assert "test-only-key" not in r.text


def test_gemini_proxy_missing_key_is_explicit(monkeypatch):
    monkeypatch.setattr(main, "GEMINI_API_KEY", "")
    assert client.post("/api/speech/gemini/transcriptions", files={"file": ("a.wav", b"audio", "audio/wav")}).status_code == 503


def test_gpu_readiness_fails_without_device(monkeypatch):
    import sys
    from types import SimpleNamespace
    monkeypatch.setattr(main, "MODEL_DEVICE", "cuda")
    monkeypatch.setitem(sys.modules, "ctranslate2", SimpleNamespace(get_cuda_device_count=lambda: 0))
    r=client.get("/readyz")
    assert r.status_code == 503 and "passthrough" in r.json()["detail"]


def test_model_acquisition_size_revision_and_load_metrics(monkeypatch, tmp_path):
    import sys
    from types import SimpleNamespace
    snapshot=tmp_path / "snapshots" / ("a" * 40)
    snapshot.mkdir(parents=True)
    (snapshot / "model.bin").write_bytes(b"weights")
    (snapshot / "config.json").write_bytes(b"{}")
    seen={}
    loaded=object()
    def download(model, **kwargs):
        seen.update(model=model, **kwargs)
        return str(snapshot)
    def construct(path, **kwargs):
        assert path == str(snapshot) and kwargs == {"device":"cpu", "compute_type":"int8"}
        return loaded
    monkeypatch.setitem(sys.modules, "faster_whisper", SimpleNamespace(WhisperModel=construct))
    monkeypatch.setitem(sys.modules, "faster_whisper.utils", SimpleNamespace(download_model=download))
    for name in ("_model", "_model_load_seconds", "_model_acquisition_seconds", "_model_initialization_seconds", "_model_artifact_bytes", "_model_revision"):
        monkeypatch.setattr(main, name, None)
    monkeypatch.setattr(main, "MODEL_DEVICE", "cpu")
    monkeypatch.setattr(main, "MODEL_COMPUTE_TYPE", "int8")
    monkeypatch.setattr(main, "MODEL_DOWNLOAD_ROOT", str(tmp_path))
    monkeypatch.setattr(main, "MODEL_REVISION", "a" * 40)
    times=iter([10., 12., 15.])
    monkeypatch.setattr(main.time, "perf_counter", lambda: next(times))
    assert main.get_whisper_model() is loaded
    assert main.get_whisper_model() is loaded  # Cached model does not acquire/load again.
    assert seen["revision"] == "a" * 40
    assert main._model_artifact_bytes == 9
    assert main._model_revision == "a" * 40
    assert main._model_acquisition_seconds == 2
    assert main._model_load_seconds == 3
    assert main._model_initialization_seconds == 5
