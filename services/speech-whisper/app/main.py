from __future__ import annotations
import base64
import asyncio, logging, os, re, tempfile, threading, time
from importlib.metadata import version
from pathlib import Path
from urllib.parse import urlencode
import httpx
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger("speech-api")
def positive_int_env(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
        return value if value > 0 else default
    except (TypeError, ValueError):
        return default

MAX_AUDIO_BYTES = positive_int_env("MAX_AUDIO_BYTES", 20 * 1024 * 1024)
MAX_CONCURRENT_TEXT_REQUESTS = positive_int_env("MAX_CONCURRENT_TEXT_REQUESTS", 2)
MAX_CONCURRENT_REQUESTS = positive_int_env("MAX_CONCURRENT_REQUESTS", 1)
UPLOAD_TIMEOUT_SECONDS = positive_int_env("UPLOAD_TIMEOUT_SECONDS", 30)
MAX_CONCURRENT_INFERENCES = positive_int_env("MAX_CONCURRENT_INFERENCES", 1)
MODEL_REVISION = os.getenv("WHISPER_MODEL_REVISION") or None
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small")
MODEL_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
MODEL_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
MODEL_DOWNLOAD_ROOT = os.getenv("WHISPER_DOWNLOAD_ROOT", "/models")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_TRANSCRIPTION_MODEL = os.getenv("GEMINI_TRANSCRIPTION_MODEL", "gemini-2.5-flash")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_TRANSCRIPTION_MODEL = os.getenv("OPENAI_TRANSCRIPTION_MODEL", "whisper-1")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
DEEPGRAM_MODEL = os.getenv("DEEPGRAM_MODEL", "nova-3")
UPSTREAM_TIMEOUT_SECONDS = positive_int_env("SPEECH_UPSTREAM_TIMEOUT_SECONDS", 90)
DEFAULT_ORIGINS = "https://horacech.github.io,http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173"
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("SPEECH_ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",") if o.strip()]
AUDIO_SUFFIXES = {"audio/webm":".webm","audio/mp4":".mp4","audio/ogg":".ogg","audio/wav":".wav","audio/x-wav":".wav","audio/mpeg":".mp3","audio/flac":".flac","audio/aac":".aac","audio/3gpp":".3gp"}
class SpeechRequestLimits:
    """Bound uploads before multipart parsing and cap all provider work, including cloud spend."""
    def __init__(self, app):
        self.app = app
        self.slots = threading.BoundedSemaphore(MAX_CONCURRENT_REQUESTS)
        self.text_slots = threading.BoundedSemaphore(MAX_CONCURRENT_TEXT_REQUESTS)

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST" or not scope["path"].startswith(("/api/speech/", "/api/ai/")):
            return await self.app(scope, receive, send)
        slots = self.text_slots if scope["path"].startswith("/api/ai/") else self.slots
        if not slots.acquire(blocking=False):
            return await JSONResponse({"detail": "Speech service is busy. Try again shortly."}, 429, headers={"Retry-After": "3"})(scope, receive, send)
        try:
            # Includes a bounded allowance for multipart headers and language fields.
            limit = 131072 if scope["path"].startswith("/api/ai/") else MAX_AUDIO_BYTES + 65536
            chunks, size = [], 0
            async with asyncio.timeout(UPLOAD_TIMEOUT_SECONDS):
                while True:
                    message = await receive()
                    if message["type"] == "http.disconnect":
                        return
                    data = message.get("body", b"")
                    size += len(data)
                    if size > limit:
                        return await JSONResponse({"detail": "Upload exceeds the request size limit."}, 413)(scope, receive, send)
                    chunks.append(data)
                    if not message.get("more_body", False):
                        break
            body = b"".join(chunks)
            del chunks
            sent = False
            async def replay():
                nonlocal sent
                if not sent:
                    sent = True
                    return {"type": "http.request", "body": body, "more_body": False}
                return await receive()
            await self.app(scope, replay, send)
        except TimeoutError:
            await JSONResponse({"detail": "Audio upload timed out."}, 408)(scope, receive, send)
        finally:
            slots.release()

app = FastAPI(title="AI_RETRIEVAL_X Speech API", version="1.1.0", docs_url=None, redoc_url=None)
app.add_middleware(SpeechRequestLimits)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=False, allow_methods=["GET","POST","OPTIONS"], allow_headers=["Accept","Content-Type"])

@app.middleware("http")
async def enforce_allowed_browser_origin(request: Request, call_next):
    # CORS controls response visibility, not whether a cross-origin form POST is sent.
    # Reject disallowed browser origins before they can trigger inference or cloud spend.
    origin = request.headers.get("origin")
    if request.method == "POST" and origin and origin not in ALLOWED_ORIGINS:
        return JSONResponse(status_code=403, content={"detail": "Browser origin is not allowed."})
    return await call_next(request)
_model = None
_model_load_seconds = None
_model_acquisition_seconds = None
_model_initialization_seconds = None
_model_artifact_bytes = None
_model_revision = None
_model_lock = threading.Lock()
_inference_slots = threading.BoundedSemaphore(MAX_CONCURRENT_INFERENCES)

def get_whisper_model():
    global _model, _model_load_seconds, _model_acquisition_seconds, _model_initialization_seconds, _model_artifact_bytes, _model_revision
    if _model is None:
        with _model_lock:
            if _model is None:
                from faster_whisper import WhisperModel
                if MODEL_DEVICE == "cuda":
                    import ctranslate2
                    if ctranslate2.get_cuda_device_count() < 1:
                        raise RuntimeError("CUDA device is unavailable; check NVIDIA Container Toolkit and driver.")
                started = time.perf_counter()
                if Path(MODEL_SIZE).is_dir():
                    model_path = Path(MODEL_SIZE)
                else:
                    from faster_whisper.utils import download_model
                    if MODEL_DOWNLOAD_ROOT:
                        Path(MODEL_DOWNLOAD_ROOT).mkdir(parents=True, exist_ok=True)
                    model_path = Path(download_model(MODEL_SIZE, cache_dir=MODEL_DOWNLOAD_ROOT or None, revision=MODEL_REVISION))
                acquired = time.perf_counter()
                # stat follows the snapshot's cached symlinks; count model files, not the entire cache.
                artifact_bytes = sum(path.stat().st_size for path in model_path.rglob("*") if path.is_file())
                loaded = WhisperModel(str(model_path), device=MODEL_DEVICE, compute_type=MODEL_COMPUTE_TYPE)
                finished = time.perf_counter()
                _model_load_seconds = finished - acquired
                _model_acquisition_seconds = acquired - started
                _model_initialization_seconds = finished - started
                _model_artifact_bytes = artifact_bytes
                _model_revision = model_path.name if model_path.parent.name == "snapshots" else MODEL_REVISION
                _model = loaded
    return _model

def transcribe_file(file_path: str, language: str) -> str:
    segments,_ = get_whisper_model().transcribe(file_path,language=None if language=="auto" else language,vad_filter=True)
    return " ".join(s.text.strip() for s in segments if s.text.strip()).strip()

def validate_language(language: str) -> str:
    language = language.strip().lower()
    if language!="auto" and not re.fullmatch(r"[a-z]{2,3}",language):
        raise HTTPException(status_code=422,detail="Language must be 'auto' or a 2–3 letter language code.")
    return language

async def read_audio(file: UploadFile) -> tuple[bytes,str]:
    content_type=(file.content_type or "").split(";",1)[0].strip().lower()
    if content_type not in AUDIO_SUFFIXES:
        await file.close()
        raise HTTPException(status_code=415,detail="Unsupported audio type. Use WebM, MP4, Ogg, WAV, MP3, FLAC, or AAC.")
    try:
        data=await file.read(MAX_AUDIO_BYTES+1)
        if not data: raise HTTPException(status_code=400,detail="The uploaded audio file is empty.")
        if len(data)>MAX_AUDIO_BYTES: raise HTTPException(status_code=413,detail=f"Audio exceeds the {MAX_AUDIO_BYTES}-byte upload limit.")
        return data,content_type
    finally:
        await file.close()

async def forward_gemini(data: bytes, content_type: str, language: str) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini speech provider is not configured on this service.")
    # Fixed upstream host; model is service configuration, never a browser-supplied URL.
    if not re.fullmatch(r"[a-zA-Z0-9._-]+", GEMINI_TRANSCRIPTION_MODEL):
        raise HTTPException(status_code=503, detail="Gemini speech model configuration is invalid.")
    prompt = "Transcribe this audio verbatim. Output only the transcription without commentary."
    if language != "auto": prompt += " The language code is " + language + "."
    try:
        async with httpx.AsyncClient(timeout=UPSTREAM_TIMEOUT_SECONDS) as client:
            response = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_TRANSCRIPTION_MODEL + ":generateContent",
                headers={"x-goog-api-key": GEMINI_API_KEY},
                json={"contents": [{"parts": [{"inline_data": {"mime_type": content_type, "data": base64.b64encode(data).decode("ascii")}}, {"text": prompt}]}]},
            )
        response.raise_for_status()
        payload = response.json()
        candidates = payload.get("candidates", [])
        parts = candidates[0]["content"]["parts"]
        transcript = " ".join(part["text"].strip() for part in parts if isinstance(part.get("text"), str)).strip()
        if not transcript: raise ValueError("empty transcript")
        return transcript
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Gemini speech request timed out.") from None
    except (httpx.HTTPError, ValueError, KeyError, TypeError, IndexError, AttributeError):
        logger.warning("Gemini upstream request failed")
        raise HTTPException(status_code=502, detail="Gemini speech provider returned an invalid result or rejected the request.") from None

async def forward_openai(data: bytes, content_type: str, language: str) -> str:
    if not OPENAI_API_KEY: raise HTTPException(status_code=503,detail="OpenAI speech provider is not configured on this service.")
    fields={"model":OPENAI_TRANSCRIPTION_MODEL}
    if language!="auto": fields["language"]=language
    try:
        async with httpx.AsyncClient(timeout=UPSTREAM_TIMEOUT_SECONDS) as client:
            response=await client.post("https://api.openai.com/v1/audio/transcriptions",headers={"Authorization":f"Bearer {OPENAI_API_KEY}"},data=fields,files={"file":("recording"+AUDIO_SUFFIXES[content_type],data,content_type)})
        response.raise_for_status()
        payload=response.json()
        transcript=payload.get("text") if isinstance(payload,dict) else None
        if not isinstance(transcript,str) or not transcript.strip(): raise HTTPException(status_code=502,detail="OpenAI returned an empty or invalid transcription.")
        return transcript.strip()
    except HTTPException: raise
    except httpx.TimeoutException: raise HTTPException(status_code=504,detail="OpenAI speech request timed out.") from None
    except httpx.HTTPStatusError as error:
        logger.warning("OpenAI upstream returned HTTP %s",error.response.status_code)
        raise HTTPException(status_code=502,detail="OpenAI speech provider rejected the transcription request.") from None
    except (httpx.HTTPError,ValueError,KeyError,TypeError,AttributeError):
        logger.warning("OpenAI upstream request failed")
        raise HTTPException(status_code=502,detail="OpenAI speech provider request failed.") from None

async def forward_deepgram(data: bytes, content_type: str, language: str) -> str:
    if not DEEPGRAM_API_KEY: raise HTTPException(status_code=503,detail="Deepgram speech provider is not configured on this service.")
    params={"model":DEEPGRAM_MODEL,"smart_format":"true"}
    if language=="auto": params["detect_language"]="true"
    else: params["language"]=language
    try:
        async with httpx.AsyncClient(timeout=UPSTREAM_TIMEOUT_SECONDS) as client:
            response=await client.post("https://api.deepgram.com/v1/listen?"+urlencode(params),headers={"Authorization":f"Token {DEEPGRAM_API_KEY}","Content-Type":content_type},content=data)
        response.raise_for_status()
        payload=response.json()
        results=payload.get("results") if isinstance(payload,dict) else None
        channels=results.get("channels") if isinstance(results,dict) else None
        first_channel=channels[0] if isinstance(channels,list) and channels else None
        alternatives=first_channel.get("alternatives") if isinstance(first_channel,dict) else None
        first_alternative=alternatives[0] if isinstance(alternatives,list) and alternatives else None
        transcript=first_alternative.get("transcript") if isinstance(first_alternative,dict) else None
        if not isinstance(transcript,str) or not transcript.strip(): raise HTTPException(status_code=502,detail="Deepgram returned an empty or invalid transcription.")
        return transcript.strip()
    except HTTPException: raise
    except httpx.TimeoutException: raise HTTPException(status_code=504,detail="Deepgram speech request timed out.") from None
    except httpx.HTTPStatusError as error:
        logger.warning("Deepgram upstream returned HTTP %s",error.response.status_code)
        raise HTTPException(status_code=502,detail="Deepgram speech provider rejected the transcription request.") from None
    except (httpx.HTTPError,ValueError,KeyError,IndexError,TypeError,AttributeError):
        logger.warning("Deepgram upstream request failed")
        raise HTTPException(status_code=502,detail="Deepgram speech provider request failed.") from None

@app.get("/healthz")
async def healthz():
    packages = {}
    for package in ("faster-whisper", "ctranslate2"):
        try: packages[package] = version(package)
        except Exception: packages[package] = "not installed"
    return {"versions":packages,"model_load_seconds":_model_load_seconds,"model_acquisition_seconds":_model_acquisition_seconds,"model_initialization_seconds":_model_initialization_seconds,"model_artifact_bytes":_model_artifact_bytes,"model_revision":_model_revision,"max_concurrent_requests":MAX_CONCURRENT_REQUESTS,"status":"ok","model_loaded":_model is not None,"model":MODEL_SIZE,"device":MODEL_DEVICE,"compute_type":MODEL_COMPUTE_TYPE,"max_concurrent_inferences":MAX_CONCURRENT_INFERENCES,"providers":{"gemini":bool(GEMINI_API_KEY),"whisper-local":True,"openai":bool(OPENAI_API_KEY),"deepgram":bool(DEEPGRAM_API_KEY)}}

@app.post("/api/speech/whisper/transcriptions")
async def transcribe_whisper(file: UploadFile=File(...),language: str=Form("auto")):
    language=validate_language(language)
    data,content_type=await read_audio(file)
    if not _inference_slots.acquire(blocking=False):
        raise HTTPException(status_code=429,detail="The local Whisper service is busy. Try again in a moment.",headers={"Retry-After":"3"})
    try:
        with tempfile.NamedTemporaryFile(prefix="speech-",suffix=AUDIO_SUFFIXES[content_type]) as temp:
            temp.write(data); temp.flush()
            transcript=await run_in_threadpool(transcribe_file,temp.name,language)
        return {"text":transcript}
    except HTTPException:
        raise
    except Exception:
        logger.warning("Local Whisper transcription failed; device=%s", MODEL_DEVICE)
        raise HTTPException(status_code=502,detail="Local speech recognition failed. Check GPU passthrough and CUDA libraries if using cuda, or the model setup and audio format.") from None
    finally:
        _inference_slots.release()

@app.post("/api/speech/openai/transcriptions")
async def transcribe_openai(file: UploadFile=File(...),language: str=Form("auto")):
    language=validate_language(language)
    data,content_type=await read_audio(file)
    return {"text":await forward_openai(data,content_type,language)}

@app.post("/api/speech/deepgram/transcriptions")
async def transcribe_deepgram(file: UploadFile=File(...),language: str=Form("auto")):
    language=validate_language(language)
    data,content_type=await read_audio(file)
    return {"text":await forward_deepgram(data,content_type,language)}

@app.post("/api/speech/gemini/transcriptions")
async def transcribe_gemini(file: UploadFile=File(...), language: str=Form("auto")):
    language=validate_language(language)
    data,content_type=await read_audio(file)
    return {"text":await forward_gemini(data,content_type,language)}

@app.get("/readyz")
async def readyz():
    # Checks runtime support without downloading weights; transcription remains a separate gate.
    try:
        import ctranslate2
        if MODEL_DEVICE == "cuda" and ctranslate2.get_cuda_device_count() < 1:
            raise RuntimeError("GPU unavailable")
        supported = ctranslate2.get_supported_compute_types(MODEL_DEVICE)
        if MODEL_COMPUTE_TYPE not in supported:
            raise RuntimeError("Compute type unavailable")
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unavailable", "detail": "Speech runtime is unavailable. Check device passthrough, CUDA libraries and compute type."})
    return {"status": "ready", "model_loaded": _model is not None, "note": "Runtime probe only; real transcription has not been verified by this endpoint."}


from .text_api import router as text_router
app.include_router(text_router)
