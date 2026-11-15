# Speech Provider Architecture

AI_RETRIEVAL_X separates speech recognition from the LLM provider used to generate search strategies.

## Provider choices

- **Gemini**: existing direct Gemini transcription adapter; uses the Gemini key already configured in app settings.
- **OpenAI**: provider adapter contract for an OpenAI transcription proxy.
- **Deepgram**: provider adapter contract for a Deepgram transcription proxy.
- **Whisper local service**: adapter contract for a user-operated local Whisper HTTP service. This is not an in-browser Whisper runtime yet.

## Secure proxy contract

Set `VITE_SPEECH_PROXY_URL` at build time to a trusted HTTPS endpoint (or a local development endpoint). The app sends multipart form data with `file` and `language=auto` to one of:

- `POST /api/speech/openai/transcriptions`
- `POST /api/speech/deepgram/transcriptions`
- `POST /api/speech/whisper/transcriptions`

Each endpoint returns JSON: `{ "text": "recognized words" }`. The proxy owns provider authentication, request-size limits, MIME validation, rate limiting, and transcript normalization. Never put OpenAI or Deepgram secret keys in Vite environment variables or browser localStorage: Vite variables are embedded in public client assets.

The Whisper endpoint should forward audio to a locally managed Whisper runtime and should not expose a remote provider key. The static GitHub Pages deployment does not host this proxy or launch a local model; the proxy must be hosted separately and reachable from the browser. A localhost Whisper service is useful during local development, while production users need an HTTPS-reachable proxy or a future per-user endpoint setting. Selecting a proxy-backed provider without configuring the endpoint shows an actionable error rather than silently falling back to Gemini.

## Validation

Run `npm run test:speech` for provider registry, routing, proxy URL, and transcript normalization tests. Run `npm run lint && npm run build` for type and production checks.
