# CI and Local Verification Record

Results are tied to immutable revisions. Successful mocked or readiness checks are not real inference evidence.

| Revision / scope | Run | Result / meaning |
|---|---|---|
| main `57739e1` | [43670418315](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43670418315) | PASS baseline CI |
| main Pages `57739e1` | [43670418339](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43670418339) | PASS existing deployment; no deployment triggered by this work |
| original PR14 `bf3dc13` | [43666416329](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43666416329) | PASS original CI, inference mocked |
| runtime `70995dc` | [43785143877](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43785143877) | FAIL browser installation: Ubuntu latest moved to unsupported 26.04. Python 3.11/3.12 and CPU container jobs passed. |
| runtime `91e3511` | [43785589274](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43785589274) | PASS after pinning supported Ubuntu 24.04; no tests weakened |
| runtime `a135a65` | [43985293281](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43985293281), [43985281776](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43985281776) | PASS including Python matrix, CPU image/readiness and synthetic-microphone Mock regression |
| runtime `268d0cb` | [43990327964](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43990327964), [43990319135](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43990319135) | PASS patched image build tools and strict resolved Python dependency audit, in addition to all prior runtime checks |
| UI `9f45c4a` | [43785563579](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43785563579) | FAIL: query-tree language type mismatch and rendered contrast; repaired in later independent commits |
| UI `7285662` | [43986212592](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43986212592) | PASS including keyword editing and excluded-state checks |
| UI `421c456` | [43987972932](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43987972932) | FAIL: offline migration test initialization overwrote its own fixture on reload; fixture lifetime corrected without changing assertions |
| UI `ef0ede9` | [43988385452](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43988385452) | PASS privacy migration and warning-only states |
| UI `5e66583` | [43988698587](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43988698587) | PASS full-page capture-origin correction; all 30 UI states and keyboard checks |
| UI `421c456` | [43990733702](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43990733702) | PASS final application source, 30 states, hosted/offline migration and keyboard checks |

Superseded runs were cancelled by the existing workflow concurrency policy. Cancellation is not a successful test result. The final documentation/evidence commit triggers CI again; inspect the PR head's checks before accepting any merge.

## Local combined branch

Local `integration/rc-review` combines PR14 `268d0cb` with UI implementation `421c456` and QA instrumentation through `5e66583`. It was not pushed to main, merged on GitHub or deployed. Overlapping workflow hunks were resolved by preserving the runtime push condition, Ubuntu 24.04 browser runner, all four browser scripts (existing smoke, UI/axe, keyboard, synthetic speech), full artifact upload, Python matrix and CPU container job.

- TypeScript / production build / bundle budget / static guides: PASS.
- Node: validator 28, security/recovery/migration 9, speech 23 = **60** tests, existing assertions retained.
- Python runtime/benchmark metrics: **37** tests, inference/upstream responses mocked.
- Standalone UI and combined preview: **30 states each**, zero axe violations, zero overflow and zero page errors. Repeated incomplete checks remain separate evidence.
- Keyboard: **7** checks passed. Root-font 200% is explicitly distinct from OS/browser zoom certification.
- Speech browser: **12** aggregate checks passed with actual MediaRecorder plus synthetic microphone and intercepted Mock proxy; no real upstream availability claim.
- Offline export: generated HTML runs, filters injected markup/unsafe URLs, searches/clears results, and migrates the old synthetic credential-like label fixture. Hosted whitelist migration also has a browser assertion.
- npm audit: **0** known vulnerabilities in the captured audit. [Python image audit](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/docs/qa/PYTHON_DEPENDENCY_AUDIT.md) separately verified CPU 44/GPU 48 packages with zero known advisories after pip/setuptools repair; it is not inferred from npm and is not an OS/CUDA audit.

One local speech run timed out waiting for a recorder control; its screenshot showed an active recording. The identical timeout/assertion configuration passed the next run. Initial failure evidence was retained privately, and successful [retry evidence](evidence/integration-speech-mock.json) records the incident and asset hashes. The cause is unconfirmed; it is not silently removed or claimed fixed. No third repeat or relaxed threshold was used.

## Combined remote CI

The review branch [integration/rc-review](https://github.com/HoraceCh/Information-Retrieval-Tool/tree/integration/rc-review) enables the same full check matrix on its own pushes. [Branch Actions](https://github.com/HoraceCh/Information-Retrieval-Tool/actions?query=branch%3Aintegration%2Frc-review) provide the immutable final run IDs. It is an integration review snapshot, not a merged release or deployment.

The first combined remote run [43992977250](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43992977250) failed the browser job while Python 3.11/3.12 and CPU build/readiness/audit passed. Axe's reported targets were the exiting Query History dialog (nearly transparent text), although the harness had advanced to the result state. The harness now requires that named dialog to be detached after each history restoration before auditing the destination. No contrast rule, threshold or target is excluded; a dialog that fails to close still times out. This synchronizes the intended stable state and does not claim assistive-technology certification of every animation frame.
