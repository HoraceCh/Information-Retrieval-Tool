# AI_RETRIEVAL_X Local Whisper Service

A loopback-only FastAPI service exposing the speech-provider endpoint expected by the web application.

## Quick start

From the repository root:

    docker compose -f docker-compose.speech.yml up --build

The first transcription downloads the configured faster-whisper model. Model weights persist in the whisper-model-cache Docker volume. The default model is small, CPU / int8.

Select Whisper 本地服务 in the web app and set Speech Service URL to http://127.0.0.1:8000.

Check readiness at http://127.0.0.1:8000/healthz. Model loading is lazy and occurs on the first transcription.

## Run without Docker

Python 3.11+:

    cd services/speech-whisper
    python -m venv .venv
    # Activate the environment, then:
    python -m pip install -r requirements.txt
    uvicorn app.main:app --host 127.0.0.1 --port 8000

## Configuration

- WHISPER_MODEL_SIZE: small by default; faster-whisper model size.
- WHISPER_DEVICE: cpu by default; cuda requires a compatible NVIDIA container runtime and CUDA-enabled CTranslate2.
- WHISPER_COMPUTE_TYPE: int8 by default.
- WHISPER_DOWNLOAD_ROOT: /models by default.
- MAX_AUDIO_BYTES: 20 MiB by default.
- SPEECH_ALLOWED_ORIGINS: comma-separated exact CORS origins.

The container port binds to host loopback only. CORS is not authentication. Do not expose this service to a network or the public internet without an authenticated HTTPS gateway, rate limiting, and an explicit origin allowlist.

## Real-model evaluation

CI deliberately mocks inference to avoid downloading model weights. To evaluate real transcription quality and latency, start the service and prepare a private audio corpus with exact reference transcripts.

Copy evaluation/manifest.example.json to evaluation/manifest.json, place the referenced WAV files in that directory, and replace the example reference transcripts and durations with ground truth. Do not commit private recordings or sensitive transcripts.

From services/speech-whisper:

    python -m pip install -r requirements-test.txt
    python scripts/evaluate_whisper.py --manifest evaluation/manifest.json --base-url http://127.0.0.1:8000 --output evaluation/results.json

The script reports aggregate whitespace-token WER, per-file WER, latency, and real-time factor. WER is not a suitable standalone Chinese metric; inspect Chinese transcripts manually or use a separately validated CER implementation. Compare cold-start and warm-run latency separately. First-time model download should not be included in steady-state latency.

For reproducible comparisons, keep the same audio set, language setting, model, device, compute type, and service host. Record hardware details alongside results. The example manifest is a template, not a test corpus.

## Tests

    python -m pip install -r requirements-test.txt
    python -m pytest -q tests

Unit/API tests mock inference and do not download model weights.
