# AI_RETRIEVAL_X — Release Candidate Engineering Handoff

Current PR #16 results are in the [public release candidate follow-up](PUBLIC_RC.md). The original evidence below records the earlier PR #14/#15 evaluation.

Release status: **BLOCKED**. The engineering changes and review evidence are available in two independent Draft PRs. No PR was merged, marked ready or deployed.

- [PR #14 — Speech Runtime](https://github.com/HoraceCh/Information-Retrieval-Tool/pull/14), reviewed head `268d0cb`.
- [PR #15 — UI/UX Refinement](https://github.com/HoraceCh/Information-Retrieval-Tool/pull/15), UI source through `421c456`, checked instrumentation through `5e66583`; this handoff's commit adds evidence/documentation.
- main remains `57739e1beefa455c6c233f9f7a31cef8be1583b3` in the final repository check. Both working branches include that main and have zero main-only commits. PR14 safely merged main instead of rewriting its history.
- Hardware acceptance was explicitly changed by the user to the available environment. Actual CPU deployment was checked on cloud Linux / Intel Xeon Platinum 8573C / 3 vCPUs / about 9.7 GiB RAM. No Windows/WSL/RTX desktop test is claimed. GPU inference is an independently unverified optional path under the revised acceptance scope.

## Gates

| Gate | Status | Evidence and limits |
|---|---|---|
| G0 baseline | PASS WITH WARNINGS | [Live baseline](G0-BASELINE.md); production access blocked, local verification authorized |
| G1 speech review | PASS WITH WARNINGS | [PR14 review](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/docs/qa/TRACK_A_REVIEW.md), final-head CI passed; legacy browser BYOK remains an explicit boundary |
| G1.5 visual audit | PASS WITH WARNINGS | [Audit/register](UI-SCREENSHOT-AUDIT.md), [58 original screenshots](BEFORE_AFTER.md); two Before Whitelist images withheld for privacy, production capture blocked |
| G2 runtime | PASS WITH WARNINGS | Actual hardened CPU container, CPU/GPU image builds and GPU shared-library probes passed; no real GPU device/inference |
| G3 actual model evaluation | BLOCKED | Real small/cpu/int8 initialization attempted; model host returned 403. No bilingual inference, WER/CER or cold/warm/RTF measurements invented. |
| G4 actual Provider E2E | BLOCKED | Gemini/OpenAI/Deepgram server credentials absent; local weights unavailable. Twelve browser Mock checks are separate evidence. |
| G5 documentation / SEO | PASS WITH WARNINGS | README/User/Developer/Overview/metadata aligned; [G5 record](G5-DOCUMENTATION-SEO-REVIEW.md), static guide/link/SEO checks passed |
| G6 release integration | BLOCKED | Local combined engineering/visual regression passed; real model, live provider/query generation and branded-browser/HTTPS-loopback checks still missing |

## Deliverable index

| # | Deliverable | Evidence |
|---|---|---|
| 1 | Repository baseline | [G0](G0-BASELINE.md) |
| 2 | PR14 full engineering review | [Track A review](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/docs/qa/TRACK_A_REVIEW.md) |
| 3 | CPU/GPU Docker runtime | [CPU Compose](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/docker-compose.speech.yml), [GPU Compose](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/docker-compose.speech.gpu.yml) |
| 4 | GPU environment diagnostic | [check_gpu.py](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/services/speech-whisper/scripts/check_gpu.py) |
| 5 | Benchmark harness / frozen corpus specification | [Evaluation tools](https://github.com/HoraceCh/Information-Retrieval-Tool/tree/feat/local-whisper-runtime/services/speech-whisper/evaluation), [harness](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/services/speech-whisper/scripts/evaluate_whisper.py) |
| 6 | Chinese/English actual model performance report | [Explicit BLOCKED report with null measurements](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/docs/qa/WHISPER_BENCHMARK_STATUS.json); prompts are a recording specification, not a completed audio corpus |
| 7 | Four Provider E2E report | [Actual-service status](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/docs/qa/PROVIDER_E2E.md), [Mock browser evidence](evidence/integration-speech-mock.json) |
| 8–9 | Screenshot audit / P0-P1-P2 register | [Audit](UI-SCREENSHOT-AUDIT.md) |
| 10 | Design token specification | [Tokens](../DESIGN_TOKENS.md) |
| 11 | Light/dark repairs | PR15 implementation and [Before/After](BEFORE_AFTER.md) |
| 12–13 | Responsive / Accessibility reports | [QA report](ACCESSIBILITY-RESPONSIVE-QA.md), [combined DOM/axe result](evidence/integration-ui.json) |
| 14 | Before/After originals | [Screenshot index and hashes](BEFORE_AFTER.md) |
| 15 | Updated README | [README](../../README.md) |
| 16 | Updated User Guide | [Guide](../USER_GUIDE.md) |
| 17 | Updated Developer Guide | [Development](../DEVELOPMENT.md), [speech/GPU guide](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/docs/WHISPER_GPU.md) |
| 18 | Updated ProjectOverview | [Component](../../src/components/ProjectOverview.tsx) |
| 19 | SEO metadata | [index.html](../../index.html), [metadata.json](../../metadata.json), [sitemap](../../public/sitemap.xml); static crawler/guide validation passed |
| 20 | GitHub About / Topics audit | [G5 record](G5-DOCUMENTATION-SEO-REVIEW.md); read-only review, no metadata mutation claimed |
| 21–22 | Final PR reviews | [PR15 review](PR15-FINAL-REVIEW.md), PR14 review and screenshot/QA reports; both remain Draft |
| 23 | Full CI record | [CI](CI-RECORD.md), final PR checks, [Python image dependency audit](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/docs/qa/PYTHON_DEPENDENCY_AUDIT.md); model/upstream inference remains mocked in CI |
| 24 | RC acceptance checklist | Gates and remaining release conditions below — BLOCKED for release |
| 25 | Unresolved issues / risks | [Risk register](REMAINING_RISKS.md) |

## Final review and integration conditions

The complete source diffs, independent commit history and overlapping paths were reviewed against main. No tests were deleted or standards reduced. GitHub PR reviews, inline comments and conversation comments were re-queried for #14 and #15 and returned zero at final review; absence of comments is not reviewer approval. Main synchronization and CI are recorded above.

The local combined branch passed type/build, Node/Python, query-structure, rendered result/keyword editing, database navigation, offline export/search/security, theme/responsive, keyboard and synthetic speech checks. Fixture history restoration does not establish that a live LLM generated a correct query; database structure checks do not certify a database's execution semantics. Live query generation/keyword expansion needs configured model credentials as well.

When eventually integrating, retain all workflow jobs and browser scripts while resolving overlapping CI hunks. Keep speech and UI commits individually reviewable. Before release, obtain real model/corpus evidence and actual configured provider results, perform the remaining browser/device checks, decide the retained BYOK security boundary, verify final-head CI, and request explicit production authorization. Passing CI alone does not make this RC ready.

The combined review snapshot is available on the `integration/rc-review` branch. Its push runs all CI gates, including both workstreams, and does not trigger the main-only production deployment. This provides a reviewable workflow-conflict resolution while keeping #14 and #15 independent Draft PRs.
