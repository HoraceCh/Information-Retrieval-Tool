# Commercial speech API contract acceptance

Checked: 2026-11-26. Scope: official API manuals and realistic local protocol tests, as authorized without commercial API credentials. Result: **PASS WITH WARNINGS** for this scope. No authenticated commercial call or recognition-quality claim is made.

## Official sources and verified contract

### Gemini

- [Generating content API reference](https://ai.google.dev/api/generate-content): the existing `POST /v1beta/models/{model}:generateContent` method remains documented for audio content. The adapter keeps that interface; the newer audio guide's Interactions examples do not justify an unrelated migration.
- [Audio understanding](https://ai.google.dev/gemini-api/docs/audio): inline requests have a 20 MB total limit. The adapter now counts base64 expansion plus the JSON/prompt envelope before sending. It rejects oversized input with 413 rather than uploading a 20 MiB recording that expands past the upstream limit. Larger-file Files API support is outside this adapter.

The server uses `x-goog-api-key`, canonical `inlineData` / `mimeType` JSON fields, and base64 audio. MP4 audio MIME is normalized to the M4A container alias without re-encoding. Returned thought parts are excluded; incomplete, blocked or non-STOP candidates are rejected instead of presenting a partial transcription as complete.

### OpenAI

- [Create transcription](https://platform.openai.com/docs/api-reference/audio/createTranscription): multipart file/model parameters, extension-bearing filenames, bearer authentication, ISO-639-1 language hints, JSON `text` responses, and diarization chunking requirements.
- [File transcription guide](https://platform.openai.com/docs/guides/speech-to-text): the compatibility endpoint's file cap is 25 MB.

The adapter explicitly requests JSON, omits `language` for auto detection, validates explicit two-letter language codes, and rejects unsupported raw AAC/3GPP locally. The shared 20 MiB upload default is stricter than the upstream file cap. Operators selecting `gpt-4o-transcribe-diarize` also send `chunking_strategy=auto`, covering recordings over thirty seconds.

At review time the official guide marks the existing Whisper/GPT-4o transcription compatibility models for shutdown on **2027-02-26** and documents `gpt-transcribe` as a current alternative. The existing `whisper-1` default is retained for compatibility; the adapter never silently changes an operator's model. Operators should plan an explicit model-setting migration before the announced retirement and recheck the official notice.

### Deepgram

- [Pre-recorded audio API](https://developers.deepgram.com/reference/speech-to-text/listen-pre-recorded): `/v1/listen`, Token authentication, raw binary request bodies, and nested channel/alternative transcripts.
- [Language detection](https://developers.deepgram.com/docs/language-detection): `detect_language=true` identifies a dominant language; explicit language requests omit that switch.
- [Models and languages](https://developers.deepgram.com/docs/models-languages-overview): current Nova-3 documentation includes Chinese and English support.

The existing raw-audio transport and response extraction conform to these contracts. Automatic dominant-language detection is not a guarantee of mixed-language code-switching quality. Deepgram documents provider-internal model selection when the detected language is unavailable for the chosen model; this behavior is distinct from an application-level provider fallback and is disclosed here.

## Fixes and local evidence

`tests/test_commercial_speech_contracts.py` contains **42 parameterized contract cases**. They use the actual httpx request encoder with a local MockTransport, not a replacement fake client that bypasses serialization. A valid generated PCM WAV fixture is sent through the application's real multipart upload boundary. Returned Chinese/English transcripts are fixed test fixtures, not model outputs from that WAV.

The cases inspect outgoing host/path/authentication and verify Gemini base64 JSON, OpenAI multipart boundaries/file bytes/metadata, Deepgram binary bytes/query parameters, Chinese/English fixture normalization, auto-language handling and diarization options. They also exercise malformed JSON, network errors, elapsed upstream timeout exceptions, missing/incomplete Gemini candidates and thought filtering.

For all three adapters, 400/422 map to sanitized 422, 401/403 to server-configuration 503, 413/415 preserve upload/format failures, and 429 preserves rate limiting. Safe numeric Retry-After values are propagated for retryable responses; upstream response bodies and keys are never reflected. 503/504 retain availability/timeout classification. There are no automatic retries, provider switches or duplicate billable requests.

Tests passed with `/tmp/rc-api/bin/python -m pytest -q services/speech-whisper/tests`: **99 total Python cases passed**, including the 42 commercial contract cases and existing runtime/text tests. The earlier Gemini success fixture was updated to include the documented completed-candidate `finishReason=STOP`; no test was removed or disabled.

## Evidence limits

No real key was required, collected or written into these tests. The local fixtures prove request construction, parsing, limits and failure behavior; they do not establish account entitlements, current model availability, billing, production network reachability or speech recognition accuracy. Those live-service properties were outside this user-approved acceptance scope and are not represented as passing.

The manuals were accessed with the connected web retrieval tool. Direct shell requests to the documentation domains were denied by this cloud's egress policy; no bypass was used. Source links above point to official provider documentation, including their current canonical redirects.
