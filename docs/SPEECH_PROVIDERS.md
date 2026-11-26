# Speech Provider Architecture

AI_RETRIEVAL_X separates speech recognition from the LLM provider used to generate search strategies.

## Provider choices

- **Gemini**: uses the trusted speech service with a server-only Gemini key. Missing service configuration fails explicitly; there is no direct browser adapter or legacy-key fallback in the public RC.
- **OpenAI**: cloud transcription adapter contract; requires a separately operated trusted proxy.
- **Deepgram**: cloud transcription adapter contract; requires a separately operated trusted proxy.
- **Whisper local service**: a user-operated FastAPI service running faster-whisper. Model inference runs on the machine hosting the service, not in the browser.

## Configure a speech service

Select an engine in the voice input control and enter its base URL in Service URL. The URL is saved in this browser local storage; it is an endpoint address, not a provider secret. Clearing the field restores the build-time VITE_SPEECH_PROXY_URL fallback.

The browser sends multipart form data containing file and language=auto to one of:

- POST /api/speech/gemini/transcriptions

- POST /api/speech/openai/transcriptions
- POST /api/speech/deepgram/transcriptions
- POST /api/speech/whisper/transcriptions

Each endpoint returns JSON with a text field. All four engines require an explicit service URL (or the configured public build-time endpoint). Never put any provider API key in Vite environment variables, browser storage, query parameters or frontend settings. An endpoint URL is public configuration, not authorization.

## Run the local Whisper service

Requirements: Docker Desktop or Python 3.11+. The default configuration uses the small multilingual model on CPU with int8 quantization. Model weights download on first transcription and are cached in a Docker volume.

From the repository root:

    cp .env.example .env
    docker compose -f docker-compose.speech.yml up --build

Edit the untracked `.env` file to override model, device, compute type, port, upload limit, allowed origins, or optional cloud-provider credentials. Never commit `.env`.

The service binds to 127.0.0.1:8000 on the host. In the web app, select Whisper 本地服务 and set Service URL to:

    http://127.0.0.1:8000

Health check: http://127.0.0.1:8000/healthz. It reports model configuration and whether the model has loaded. The model loads lazily on the first transcription request.

For local Vite development, .env.local may contain VITE_SPEECH_PROXY_URL=http://127.0.0.1:8000; restart Vite after changing it.

### Optional model tuning

- WHISPER_MODEL_SIZE: tiny, base, small, medium, or large-v3, according to memory, speed, and accuracy needs.
- WHISPER_DEVICE: cpu by default; cuda requires a compatible NVIDIA container runtime and CUDA-enabled CTranslate2.
- WHISPER_COMPUTE_TYPE: int8 by default; compatible GPUs commonly use float16.
- MAX_AUDIO_BYTES: 20 MiB by default.
- SPEECH_ALLOWED_ORIGINS: comma-separated exact browser origins.
- MAX_CONCURRENT_INFERENCES: local model concurrency; defaults to 1 and rejects overlapping inference with HTTP 429.
- SPEECH_PORT: host loopback port; defaults to 8000.

The first model download requires network access. Keep the model-cache volume to avoid downloading it again.

## Security and deployment boundary

- Docker Compose binds the host port to loopback (127.0.0.1), not the LAN.
- CORS is restricted to configured origins, and POST requests carrying a browser Origin header are checked against the same allowlist. CORS and Origin checks are not authentication.
- The service enforces an upload limit, checks declared audio MIME types, uses generated temporary filenames, serializes local inference by default, and returns sanitized inference errors.
- Do not expose this unauthenticated local service directly to the public internet or LAN. A remote deployment needs HTTPS, authentication, rate limiting, and an explicit origin allowlist at a trusted gateway.
- A public static GitHub Pages site cannot host Python inference. A hosted HTTPS page connecting to a local service may trigger local-network permissions or be blocked by mixed-content/organizational policies. Validate the actual Chrome/Edge path; do not disable browser security protections to bypass a block.

## Validation

Run npm run test:speech for browser-side provider routing and URL validation. Run:

    python -m pip install -r services/speech-whisper/requirements-test.txt
    python -m pytest -q services/speech-whisper/tests

The API tests mock model inference and do not download weights. Run npm run lint && npm run build for TypeScript and production checks.


## Cloud proxy configuration

The bundled FastAPI service implements OpenAI and Deepgram endpoint contracts. Configure credentials only in the service process environment: OPENAI_API_KEY and DEEPGRAM_API_KEY. Model settings are OPENAI_TRANSCRIPTION_MODEL (whisper-1 by default) and DEEPGRAM_MODEL (nova-3 by default). SPEECH_UPSTREAM_TIMEOUT_SECONDS defaults to 90.

The browser sends only audio and a language hint to the configured service URL. The proxy adds provider authorization server-side and returns a normalized JSON text response. Health status reports whether each provider is configured, never its secret.

Do not expose this unauthenticated service beyond loopback. Shared remote hosting requires user authentication, rate limiting, abuse controls, HTTPS, and secret management before provider keys are enabled.


## GPU and reproducible evaluation

See [CPU/GPU runtime and local validation](WHISPER_GPU.md). The GPU configuration is standalone (`docker-compose.speech.gpu.yml`) and does not modify CPU dependencies. A fixed prompt specification is provided; actual audio must be recorded/frozen and hashed before formal performance evaluation. No WER/CER claim follows from mocked tests.

Gemini speech uses server-only `GEMINI_API_KEY` and `GEMINI_TRANSCRIPTION_MODEL` (default `gemini-2.5-flash`). OpenAI/Deepgram keys also remain server-side. A Gemini proxy failure never causes a browser-key retry. Clearing a user endpoint only restores a configured build-time endpoint; with neither configured, transcription fails. Text generation and model discovery also use the trusted service in this public RC. No frontend supplier-key compatibility entry point is provided.

Older releases may have stored browser keys. Upgrade cleanup must not silently treat inaccessible storage as a successful credential purge; report the failure and direct users to browser site-data management. Old backups remain outside the page cleanup scope. Revoke any provider keys that were exposed.
