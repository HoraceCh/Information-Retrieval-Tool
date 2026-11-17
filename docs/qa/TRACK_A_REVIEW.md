# Track A — PR #14 engineering and runtime review

Evidence captured 2026-11-16; acceptance scope and CI record updated 2026-11-17. Repository: `HoraceCh/Information-Retrieval-Tool`.

## Immutable baseline and branch history

- Main reviewed: `57739e1beefa455c6c233f9f7a31cef8be1583b3` (PR #13 merged).
- Original PR #14: `bf3dc1399abfd0b26427d9d8694f4845c2d6d2ef`; base metadata was main, but Git history was **1 main-only / 16 PR-only commits**.
- Safely merged main with merge commit `a7aa4d9` without rewriting prior history or conflicts. No main push, PR merge, ready transition or production deployment.
- Reviewed the complete original 28-file diff and the runtime/provider supporting paths. This is an engineering review including security checks, not a claim of a completed Codex Security repository scan.

## Review findings and changes

| Priority | Finding | Resolution / residual boundary |
| --- | --- | --- |
| P1 | File size limit ran after multipart parsing, permitting unbounded parser input before validation. | Added a pre-parser total request cap (file limit + 64 KiB multipart overhead), 30-second upload deadline, and bounded request slots. Exact file-byte limit remains. |
| P1 | OpenAI/Deepgram requests could overlap without the local model's concurrency protection. | Global non-waiting concurrency limit covers uploads and every provider. Busy requests get 429 + Retry-After. |
| P1 | Gemini speech only supported direct browser BYOK. | Added server-keyed Gemini proxy and preferred routing when a service URL is present. Failure never falls back to direct Gemini. URL input and mode notice are available independently of the UI PR. Legacy direct BYOK is explicitly identified. |
| P1 | Docker ran as root. New non-root image initially failed under this checkout's restrictive file permissions. | Both images run as UID/GID 10001; COPY assigns application ownership. Actual CPU container startup verified after fixing the discovered permission error. Read-only root, bounded tmpfs, capability drop and no-new-privileges applied. |
| P2 | Older cancelled transcription could clear a newer request's loading state. | Only the current AbortController may clear its loading state. |
| P2 | Gemini did not share the proxy request timeout envelope. | All providers now use the same cancellation/timeout controller; SDK AbortSignal remains supported. |
| P2 | GPU settings could contaminate CPU defaults; no concrete GPU image existed. | Standalone GPU image/Compose and model volume, pinned library evidence, device/compute readiness probe and GPU diagnostic script. No CPU fallback on GPU failure. |
| P2 | Benchmark lacked frozen input identity, cold/warm rounds, actual service metadata and resource provenance. | Added fixed bilingual prompt specification, WAV manifest freezer, hashes, repeated runs, health/version metadata and optional sampled CPU/RSS/device-wide GPU memory. Unavailable metrics are null. |

Provider IDs remain `gemini`, `openai`, `deepgram`, `whisper-local`. The proxy contract is multipart `file` + `language`, JSON `{ "text": "..." }`; all four server endpoints use the same contract. Endpoint URLs reject credentials, query tokens/fragments, non-HTTP protocols and remote plaintext HTTP. Provider/URL persistence does not store server API keys. Error responses avoid internal paths, provider response bodies and secret values.

Declared MIME is checked, but it is not file-content attestation. Whisper decoding rejects invalid media. Server request limits, loopback binding and lack of authentication are separate controls: CORS/Origin checks are **not authentication**. Local requests without Origin remain available for diagnostics. Never expose this service directly to a LAN/public network. Remote hosting requires authenticated HTTPS, rate limits, quotas and abuse controls.

## Verification performed

- Python API/benchmark tests: **37 passed**, model/upstream inference mocked. No model quality claim follows.
- Node speech tests: **23 passed**, including actual browser service routing, no fallback, invalid JSON, timeout, caller cancellation and recovery; network responses mocked.
- Existing security helpers: **6 passed**. Boolean validator: **28 passed**.
- TypeScript, production build, guide/SEO validation and bundle budget passed locally.
- Python 3.11 and 3.12 test jobs plus CPU Docker build/readiness job added to CI; the main branch's existing checks are retained. PR #14 remains Draft. Head `91e3511` passed both [run 43785589274](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43785589274) and [run 43785583983](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43785583983). The earlier Ubuntu 26.04 / Playwright 1.56.1 package-install incompatibility was repaired by pinning the browser runner to supported Ubuntu 24.04; no assertions were weakened. Subsequent model-metric and browser-regression commits must also pass final-head CI before integration approval.
- Local `npm ci` encountered package tarball integrity failures in this cloud environment. Type/build checks reused the existing installed workspace dependencies; that is not described as a successful clean install. GitHub CI remains the clean-install gate.

## Actual CPU/GPU container evidence

Environment: cloud Linux x86-64, Intel Xeon Platinum 8573C, 3 vCPUs, approximately 9.7 GiB RAM; host Python 3.12.14, container Python 3.11.18. This is cloud hardware, not a Windows/WSL/NVIDIA desktop validation.

| Check | Result | Evidence |
| --- | --- | --- |
| CPU and GPU Compose schema | PASS | Both `docker compose ... config --quiet` commands exited 0. |
| CPU image build | PASS WITH WARNINGS | Image built with Python 3.11 and pinned model libraries. Inner pip needed the cloud session's CA mounted as a BuildKit secret in a temporary Dockerfile. TLS verification remained enabled; CA was not committed or baked into layers. |
| CPU hardened container startup | PASS | UID/GID `10001:10001`, read-only root, dropped `ALL` capabilities, `127.0.0.1:18000 -> 8000`, model volume and tmpfs. |
| CPU liveness / runtime readiness | PASS | `/healthz` and `/readyz` returned 200; small/cpu/int8, faster-whisper 1.2.1, CT2 4.9.0. `model_loaded=false` is explicitly reported. |
| Real CPU small model load | BLOCKED | Native `WhisperModel('small', device='cpu', compute_type='int8')` attempted, failed with `ProxyError: 403 Forbidden` from model-host egress in 1.31 seconds. Direct model config request also received 403. |
| CPU HTTP model-load failure behavior | PASS | An actual upload to the container returned sanitized 502, without internal path/exception disclosure. A one-second silent WAV was only a load/error probe, not speech quality evidence. |
| GPU image build | PASS WITH WARNINGS | Pinned GPU image built using the same session-only CA secret. |
| GPU libraries | PASS | `ctypes.CDLL` loaded libcublas.so.12, libcudart.so.12, libcurand.so.10 and libcudnn.so.9 inside the image. |
| GPU passthrough / inference | BLOCKED | CT2 device_count=0; `docker run --gpus all` failed: no known GPU vendor found. No NVIDIA device or GPU performance is claimed. |

The normal Dockerfile's initial package install correctly rejected an untrusted certificate chain in this managed nested container. The documented secure session CA mount resolved that environment trust issue without `--trusted-host`, disabling TLS, or changing project trust defaults.

## Gate record

| Gate | Status | Remaining evidence |
| --- | --- | --- |
| G1 Speech code review | PASS WITH WARNINGS | Engineering review and validated-head CI passed; legacy browser BYOK prevents a strict all-app server-only-key claim. Follow-up commit CI and combined review remain release checks. |
| G2 current-hardware CPU deployment | PASS WITH WARNINGS | The user authorized acceptance on available hardware. Actual hardened CPU deployment/readiness passed. This does not imply real model transcription. |
| Optional GPU inference capability | BLOCKED | GPU image/library probes completed; actual GPU device/inference unavailable. A particular Windows/WSL/RTX machine is not a mandatory release prerequisite under the revised scope. |
| G3 real-model evaluation | BLOCKED | Model host returns 403; no downloaded weights or bilingual model inference. See WHISPER_BENCHMARK_STATUS.json. |
| G4 provider E2E | BLOCKED | No configured cloud API keys; Whisper weights blocked. See PROVIDER_E2E.md. |

Strict server-only key storage is still not true for the entire application: legacy direct Gemini speech BYOK and existing text-generation BYOK remain browser accessible. Preferred speech proxy mode keeps all cloud speech keys server-side; legacy mode is visibly labelled. A future decision to remove all browser BYOK would affect text-generation architecture and is not silently represented as completed here.

## Remaining requirements and optional capability limits

1. Permit authorized model-host access or supply a locally cached, provenance-recorded model; then execute the same frozen Chinese/English recordings on small/medium/optional large-v3.
2. Keep GPU inference explicitly BLOCKED until available NVIDIA hardware is tested; a successful image build or library load is insufficient. This is an optional capability under the user-approved current-hardware acceptance scope.
3. Configure trusted server API credentials for Gemini/OpenAI/Deepgram and perform actual Chinese/English service E2E; never publish keys in client assets or logs.
4. Verify Chrome and Edge microphone permissions/record-stop-cancel/repeated sessions, including GitHub Pages HTTPS to loopback local-network browser behavior.
5. Complete final-head CI and combined UI/runtime review before changing PR readiness. Do not merge or deploy automatically.


## Follow-up metric completeness

Model acquisition now resolves a concrete snapshot before construction, reports its artifact byte size and revision, and separates download/cache lookup time, local load time and total initialization time. WHISPER_MODEL_REVISION optionally pins an immutable snapshot. The benchmark exports these measured service fields; acquisition failures leave them null. Model artifact size is explicitly distinguished from unmeasured network traffic, whose field remains null. Two new mocked unit/contract tests verify these semantics; they are not performance measurements.

## Browser integration evidence

`scripts/speech-browser-qa.mjs` is a repeatable Chromium integration regression using the actual MediaRecorder with a synthetic microphone and a mocked trusted proxy. It checks all four provider routes, multipart audio, insertion into the query, persistence, recording/request cancellation, invalid JSON, network loss, 503/504 mapping and repeated recovery. It is added to the existing browser CI job and uploads evidence. The upstream 504 test is error mapping, not a claim of an elapsed client timeout; elapsed client timeout is separately covered in Node tests. The main smoke suite also passed on the PR #14 production preview using installed Chromium. The parent integration run completed all twelve aggregate speech checks on the combined UI/runtime build. None of this substitutes for real provider/model acceptance or real microphone/Edge/local-network permission testing.
