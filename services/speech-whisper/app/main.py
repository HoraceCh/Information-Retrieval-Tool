from __future__ import annotations
import logging, os, re, tempfile, threading
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
MAX_CONCURRENT_INFERENCES = positive_int_env("MAX_CONCURRENT_INFERENCES", 1)
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small")
MODEL_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
MODEL_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
MODEL_DOWNLOAD_ROOT = os.getenv("WHISPER_DOWNLOAD_ROOT", "/models")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_TRANSCRIPTION_MODEL = os.getenv("OPENAI_TRANSCRIPTION_MODEL", "whisper-1")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
DEEPGRAM_MODEL = os.getenv("DEEPGRAM_MODEL", "nova-3")
UPSTREAM_TIMEOUT_SECONDS = positive_int_env("SPEECH_UPSTREAM_TIMEOUT_SECONDS", 90)
DEFAULT_ORIGINS = "https://horacech.github.io,http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173"
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("SPEECH_ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",") if o.strip()]
AUDIO_SUFFIXES = {"audio/webm":".webm","audio/mp4":".mp4","audio/ogg":".ogg","audio/wav":".wav","audio/x-wav":".wav","audio/mpeg":".mp3","audio/flac":".flac","audio/aac":".aac","audio/3gpp":".3gp"}
app = FastAPI(title="AI_RETRIEVAL_X Speech API", version="1.1.0", docs_url=None, redoc_url=None)
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
_model_lock = threading.Lock()
_inference_slots = threading.BoundedSemaphore(MAX_CONCURRENT_INFERENCES)

def get_whisper_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from faster_whisper import WhisperModel
                kwargs = {"device":MODEL_DEVICE,"compute_type":MODEL_COMPUTE_TYPE}
                if MODEL_DOWNLOAD_ROOT:
                    Path(MODEL_DOWNLOAD_ROOT).mkdir(parents=True,exist_ok=True)
                    kwargs["download_root"] = MODEL_DOWNLOAD_ROOT
                _model = WhisperModel(MODEL_SIZE,**kwargs)
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
    except (httpx.HTTPError,ValueError,KeyError):
        logger.exception("OpenAI upstream request failed")
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
        logger.exception("Deepgram upstream request failed")
        raise HTTPException(status_code=502,detail="Deepgram speech provider request failed.") from None

@app.get("/healthz")
async def healthz():
    return {"status":"ok","model_loaded":_model is not None,"model":MODEL_SIZE,"device":MODEL_DEVICE,"compute_type":MODEL_COMPUTE_TYPE,"max_concurrent_inferences":MAX_CONCURRENT_INFERENCES,"providers":{"whisper-local":True,"openai":bool(OPENAI_API_KEY),"deepgram":bool(DEEPGRAM_API_KEY)}}

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
        logger.exception("Local Whisper transcription failed")
        raise HTTPException(status_code=502,detail="Local speech recognition failed. Check the Whisper model setup and audio format.") from None
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
