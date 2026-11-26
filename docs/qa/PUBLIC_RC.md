# Public release candidate follow-up

The public release remains **BLOCKED** pending live commercial speech acceptance and final release authorization. Draft PR #16 combines the work reviewed in #14 and #15 with the server-only model changes. The public frontend can be distributed as static assets. Model and speech operations require a separately configured trusted service.

| Gate | Status | Current evidence |
| --- | --- | --- |
| G0 | PASS WITH WARNINGS | PRs #14, #15 and #16 are open drafts. PR #16 targets main at `57739e1`. Production Pages verification was waived for the local pass. |
| G1 | PASS | Text generation, expansion and speech all use the trusted service. Browser SDK removed. Legacy credentials are purged on upgrade and model preferences are preserved. CI covers the API contract and installed audio decoder. |
| G1.5 | PASS WITH WARNINGS | Local dual-theme and responsive regression covered 30 states. Keyboard and forced-colors checks provide additional evidence. |
| G2 | PASS WITH WARNINGS | The non-root CPU container returned real Chinese and English transcriptions. GPU inference remains unverified on this CPU-only host. |
| G3 | PASS WITH WARNINGS | Real CPU inference was measured over a frozen bilingual synthetic corpus. The small-model run completed 42 requests across 14 samples. Synthetic and limited human speech tests support runtime verification and a preliminary quality comparison. |
| G4 | BLOCKED | Chrome and Edge completed recording, upload, real CPU transcription and query insertion for both languages using WAV-backed microphones. Gemini, OpenAI and Deepgram live speech require configured service-side credentials. The physical microphone and deployed Pages-to-loopback path remain outside the local test. |
| G5 | PASS WITH WARNINGS | README, guides, app overview and metadata describe the static frontend, trusted services, and database query checks. |
| G6 | BLOCKED | The mandatory commercial-provider live checks are pending. Reviewer sign-off and production authorization remain separate. |

## Evidence

- [Draft integration PR #16](https://github.com/HoraceCh/Information-Retrieval-Tool/pull/16)
- [CI for the initial integration PR head](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/45820070511)
- [Chrome and Edge real Whisper browser runs](evidence/public-rc-whisper-browser.json)
- [Licensed human-speech diagnostic](HUMAN_SPEECH_DIAGNOSTIC_2026-11-26.md)
- [Browser settings migration, forced colors and permission recovery](evidence/server-ui-targeted/README.md)
- [Actual responses with cloud providers unconfigured](evidence/public-rc-unconfigured-providers.json)
- [Trusted service configuration](../DEVELOPMENT.md)
- [Earlier gate and PR evidence](RELEASE_CANDIDATE.md)

The faster-whisper 1.2.1 decoder passed a removed keyword to PyAV 19.0.2 and returned HTTP 502 with a real WAV. Both container builds now share a PyAV 18.1.1 pin. Container CI decodes a generated WAV with the installed libraries, without downloading weights.

The default Whisper model remains small. Local CPU testing used separately distributed Rhasspy int8 archives and a tokenizer derived from the pinned OpenAI multilingual rank table. All 14 synthetic reference strings produced identical token IDs and decoded text when checked against OpenAI's tiktoken rank table. The release branch contains no model weights or provider credentials. The tiny model demonstrated a working browser path but showed substantial Chinese errors. Keep it out of default quality claims.

## Live text generation

The browser submitted a real synthesis request to a loopback trusted text service, which authenticated to llama.cpp over HTTPS. Qwen3 0.6B returned structured JSON and the UI rendered the query and keyword group. It did not use explicit Boolean operators or meaningful database fields for the Auto Match request. A second run selected Web of Science and received `TS=Web of Science topic`, which failed the check for relevance to the requested robotics topic. An earlier attempt with Qwen2.5 3B exceeded the browser request deadline on the shared CPU. The result verifies the browser-to-model path and leaves the quality and response time of the intended hosted provider open. Qwen3 0.6B is a development smoke-test model in this report. [Captured result and validator output](evidence/public-rc-local-text.json)
