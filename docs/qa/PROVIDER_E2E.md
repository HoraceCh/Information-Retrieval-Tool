# Four-provider E2E acceptance record

Evidence: 2026-11-16; regression record updated 2026-11-17. Status: **BLOCKED**. This record distinguishes actual negative service probes and mocked integration tests from successful provider transcription.

| Acceptance item | Gemini | OpenAI | Deepgram | Local Whisper |
| --- | --- | --- | --- | --- |
| Server route / negative configuration response | Actual 503: no server key | Actual 503: no server key | Actual 503: no server key | Actual readiness 200; model load error 502 |
| Chinese actual transcription | BLOCKED | BLOCKED | BLOCKED | BLOCKED: weights host 403 |
| English actual transcription | BLOCKED | BLOCKED | BLOCKED | BLOCKED: weights host 403 |
| Timeout / cancellation contract | Mock service/SDK tests | Mock service test | Mock service test | Mock service test |
| Recovery after network error | Mock browser service test | Mock browser service test | Same shared adapter | Same shared adapter |
| Chrome/Edge microphone E2E | Not verified | Not verified | Not verified | Not verified |
| Hosted HTTPS page to loopback browser behavior | Not verified | Not verified | Not verified | Not verified |

Actual probes ran against the non-root CPU container over host loopback. Cloud-provider endpoints returned a sanitized 503 when server credentials were absent. No configured live upstream transcription was performed. The Whisper load attempt was real but weights could not be retrieved due model-host egress 403, so no WER/CER or valid speech result exists.

The 23 Node speech tests and 37 Python tests verify mocked provider contracts, JSON handling, upload rejection, server-key injection, timeouts/cancellation, no implicit fallback and error recovery. They do not satisfy the actual-service rows above. Browser smoke tests check application navigation/provider persistence; they do not replace microphone permission, audio capture or real provider acceptance.

Preferred Gemini speech uses the configured trusted service URL; missing server key returns 503 without trying direct BYOK. An empty URL intentionally retains legacy browser BYOK and is labelled in the UI. OpenAI/Deepgram always require a trusted server. All services remain loopback-only unless an authenticated HTTPS gateway and rate/abuse controls are added.


Chromium browser integration now has a repeatable CI script, `scripts/speech-browser-qa.mjs`, exercising actual browser MediaRecorder with a synthetic microphone and mocked proxy responses. Twelve aggregate checks cover each provider route/result insertion, persistence, recording/request cancellation, invalid JSON, network loss, unavailable/timeout response mapping and repeated recordings. This is **mocked browser integration**, not successful real provider E2E. The parent combined-build run passed all twelve checks; real hardware microphone permissions, Edge, and hosted HTTPS-to-loopback permission behavior remain unverified. The UI/runtime branch CI at head 91e3511 passed [43785589274](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43785589274) and [43785583983](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43785583983); new follow-up commits require their own final-head CI.
