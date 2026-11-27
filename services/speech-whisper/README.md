# AI_RETRIEVAL_X Local Whisper Service

A loopback-only FastAPI service exposing the speech-provider endpoint expected by the web application.

## Quick start

From the repository root, create your local configuration and start the service:

    cp .env.example .env
    docker compose -f docker-compose.speech.yml up --build

Edit `.env` to change the model, device, port, upload limit, allowed browser origins, or optional cloud-provider credentials. The `.env` file is ignored by Git; never commit it.

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
- SPEECH_ALLOWED_ORIGINS: comma-separated exact browser origins.
- MAX_CONCURRENT_INFERENCES: simultaneous local model inferences; defaults to 1 and rejects excess requests with HTTP 429.
- SPEECH_PORT: host loopback port; defaults to 8000.

The container port binds to host loopback only. The API checks browser `Origin` on POST requests as well as applying CORS; requests without an Origin header remain available for local command-line diagnostics. CORS and Origin checks are not authentication. Do not expose this service to a network or the public internet without an authenticated HTTPS gateway, rate limiting, and an explicit origin allowlist.

## Real-model evaluation

CI deliberately mocks inference to avoid downloading weights. Prepare a private audio corpus with exact reference transcripts. Copy evaluation/manifest.example.json to evaluation/manifest.json, put the referenced WAV files in that directory, and replace the example text and durations with ground truth. Do not commit private recordings or sensitive transcripts.

From services/speech-whisper:

    python -m pip install -r requirements-test.txt
    python scripts/evaluate_whisper.py --manifest evaluation/manifest.json --dataset-version private-corpus-v1 --base-url http://127.0.0.1:8000 --model-size small --device cpu --compute-type int8 --hardware "CPU model / RAM" --output evaluation/results.json

The report includes WER, CER, latency, and real-time factor. WER is most useful for whitespace-separated languages. CER is calculated over NFKC/casefolded Unicode code points after removing whitespace; punctuation is retained. Review both metric definitions before comparing results. Compare cold-start and warm runs separately; do not include first-time model download in steady-state latency.

For reproducible comparisons, keep the same audio corpus, language settings, model, device, compute type, and hardware. Record the hardware details in the report. The example manifest is a template, not a test corpus.

## Tests

    python -m pip install -r requirements-test.txt
    python -m pytest -q tests

Unit/API tests mock inference and do not download model weights.


## Optional cloud speech providers

The service can proxy OpenAI and Deepgram while keeping provider API keys on the server process.

Set OPENAI_API_KEY and/or DEEPGRAM_API_KEY in the service environment. Optional settings: OPENAI_TRANSCRIPTION_MODEL (default whisper-1), DEEPGRAM_MODEL (default nova-3), and SPEECH_UPSTREAM_TIMEOUT_SECONDS (default 90).

For Docker Compose, supply credentials through an untracked local .env file or deployment secret manager. Never commit keys or put them in Vite variables/browser storage.

Endpoints:
- POST /api/speech/openai/transcriptions
- POST /api/speech/deepgram/transcriptions

Both accept multipart file and language fields and return a JSON text field. language=auto uses provider-side automatic language detection; explicit language codes are forwarded.

These proxy endpoints do not implement user authentication or per-user quotas. Keep the service loopback-only for local use. Any shared/remote deployment must add authentication, rate limiting, abuse controls, HTTPS, and secret management before enabling cloud providers.


## CPU/GPU validation and benchmark guide

See [the CPU/GPU runtime guide](../../docs/WHISPER_GPU.md) for the independent GPU Compose file, pinned CUDA compatibility evidence, preflight, fixed bilingual recording prompts, hash-based corpus freezing, cold/warm benchmark methodology, sampled resource metrics, and stop/cleanup commands. GPU runtime is not implied by a healthy CPU service.

All speech uploads now have a pre-multipart request limit (audio limit plus 64 KiB multipart overhead), a 30-second upload deadline, and a global non-waiting request concurrency limit (default one, including cloud requests). MAX_AUDIO_BYTES still applies to the actual file. MAX_CONCURRENT_REQUESTS and UPLOAD_TIMEOUT_SECONDS configure these boundaries. Local model concurrency retains its own MAX_CONCURRENT_INFERENCES bound. Cancellation stops browser waiting; it does not guarantee stopping already running model inference or upstream billing.

Gemini also supports the trusted server proxy at `/api/speech/gemini/transcriptions`. Set GEMINI_API_KEY only in the server environment; GEMINI_TRANSCRIPTION_MODEL defaults to gemini-2.5-flash. When a service URL is configured, the Gemini speech adapter uses it and never falls back after a proxy error. Without a service URL, legacy direct Gemini BYOK remains available. That compatibility mode uses a browser-accessible key, so it does **not** meet a strict server-only secret-storage policy. Prefer the proxy for speech; existing text-generation BYOK is a separate legacy boundary.
