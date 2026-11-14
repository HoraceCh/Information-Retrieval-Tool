from __future__ import annotations

import logging
import os
import re
import tempfile
import threading
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger("speech-whisper")


def positive_int_env(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
        return value if value > 0 else default
    except (TypeError, ValueError):
        return default


MAX_AUDIO_BYTES = positive_int_env("MAX_AUDIO_BYTES", 20 * 1024 * 1024)
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small")
MODEL_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
MODEL_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
MODEL_DOWNLOAD_ROOT = os.getenv("WHISPER_DOWNLOAD_ROOT", "/models")

DEFAULT_ORIGINS = (
    "https://horacech.github.io,"
    "http://localhost:3000,http://127.0.0.1:3000,"
    "http://localhost:4173,http://127.0.0.1:4173"
)
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("SPEECH_ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]
AUDIO_SUFFIXES = {
    "audio/webm": ".webm",
    "audio/mp4": ".mp4",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/mpeg": ".mp3",
    "audio/flac": ".flac",
    "audio/aac": ".aac",
    "audio/3gpp": ".3gp",
}

app = FastAPI(title="AI_RETRIEVAL_X Local Whisper API", version="1.0.0", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Accept", "Content-Type"],
)

_model = None
_model_lock = threading.Lock()


def get_whisper_model():
    """Load once, on first transcription; importing the API never downloads model weights."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from faster_whisper import WhisperModel

                kwargs = {"device": MODEL_DEVICE, "compute_type": MODEL_COMPUTE_TYPE}
                if MODEL_DOWNLOAD_ROOT:
                    Path(MODEL_DOWNLOAD_ROOT).mkdir(parents=True, exist_ok=True)
                    kwargs["download_root"] = MODEL_DOWNLOAD_ROOT
                _model = WhisperModel(MODEL_SIZE, **kwargs)
    return _model


def transcribe_file(file_path: str, language: str) -> str:
    model = get_whisper_model()
    segments, _info = model.transcribe(
        file_path,
        language=None if language == "auto" else language,
        vad_filter=True,
    )
    return " ".join(segment.text.strip() for segment in segments if segment.text.strip()).strip()


@app.get("/healthz")
async def healthz():
    return {
        "status": "ok",
        "model_loaded": _model is not None,
        "model": MODEL_SIZE,
        "device": MODEL_DEVICE,
        "compute_type": MODEL_COMPUTE_TYPE,
    }


@app.post("/api/speech/whisper/transcriptions")
async def transcribe(file: UploadFile = File(...), language: str = Form("auto")):
    language = language.strip().lower()
    if language != "auto" and not re.fullmatch(r"[a-z]{2,3}", language):
        raise HTTPException(status_code=422, detail="Language must be 'auto' or a 2–3 letter language code.")

    content_type = (file.content_type or "").split(";", 1)[0].strip().lower()
    suffix = AUDIO_SUFFIXES.get(content_type)
    if not suffix:
        await file.close()
        raise HTTPException(status_code=415, detail="Unsupported audio type. Use WebM, MP4, Ogg, WAV, MP3, FLAC, or AAC.")

    try:
        audio_bytes = await file.read(MAX_AUDIO_BYTES + 1)
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="The uploaded audio file is empty.")
        if len(audio_bytes) > MAX_AUDIO_BYTES:
            raise HTTPException(status_code=413, detail=f"Audio exceeds the {MAX_AUDIO_BYTES}-byte upload limit.")

        with tempfile.NamedTemporaryFile(prefix="speech-", suffix=suffix) as temporary_audio:
            temporary_audio.write(audio_bytes)
            temporary_audio.flush()
            transcript = await run_in_threadpool(transcribe_file, temporary_audio.name, language)
        return {"text": transcript}
    except HTTPException:
        raise
    except Exception:
        logger.exception("Local Whisper transcription failed")
        raise HTTPException(
            status_code=502,
            detail="Local speech recognition failed. Check the Whisper model setup and audio format.",
        ) from None
    finally:
        await file.close()
