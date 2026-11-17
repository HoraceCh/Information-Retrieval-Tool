# Python dependency audit and packaging-tool fix

Auditor: **pip-audit 2.10.1**, isolated in `/workspace/work/audit-venv`. Source: PyPI vulnerability API, accessed successfully. Inventories came from actual installed distribution metadata; GPU metadata was read from the built image without GPU passthrough or an additional model/library download. Full versions, advisory IDs, fixes and image IDs are in [PYTHON_DEPENDENCY_AUDIT.json](PYTHON_DEPENDENCY_AUDIT.json).

| Audited environment | Packages | Raw records | Unique package/advisory pairs | Affected packages |
| --- | ---: | ---: | ---: | --- |
| Cloud CPU venv, runtime + test dependencies, before | 46 | 12 | 6 | pip 25.0.1 |
| CPU image before | 44 | 15 | 8 | pip 24.0; setuptools 79.0.1 |
| GPU image before | 48 | 15 | 8 | pip 24.0; setuptools 79.0.1 |
| Rebuilt CPU image after | 44 | 0 | 0 | None known |
| Rebuilt GPU image after | 48 | 0 | 0 | None known |

PyPI returned duplicate advisory records, so raw counts and deduplicated counts are both shown. Pip findings included CVE-2025-8869, CVE-2026-1703, CVE-2026-3219, CVE-2026-6357, CVE-2026-8643 and CVE-2026-13346. Setuptools findings were CVE-2026-59890 and GHSA-xmj3-9gf7-h52w. These concern package installation/build operations; detecting a vulnerable package does not establish exploitability through the speech upload API.

Both Dockerfiles now install **pip 26.3** and **setuptools 84.2.1** before runtime requirements. These versions were first checked against the database, then actual rebuilt image inventories were audited again. No advisory was ignored, and neither tool was excluded from the after audit. The cloud runtime venv was left unchanged; its old pip findings remain in the before record. Audit tooling and its own upgraded installer are isolated.

CPU and GPU images were rebuilt with TLS verification enabled, using the already documented session-only BuildKit CA secret. The rebuilt CPU container passed `/readyz` and `/healthz` with UID/GID 10001, read-only root, dropped capabilities and loopback publishing. `model_loaded=false`; this is deployment readiness, not real-model transcription. GPU inference remains BLOCKED because the cloud has no NVIDIA device.

The CPU image CI job now audits its actual resolved metadata using the same pinned auditor and uploads inventory/results. Fully pinned inventories use `--no-deps --disable-pip` so the audit queries package advisories without resolving or downloading runtime dependencies. This check fails on findings or collection errors. Final-head CI still needs to finish after the independent patch is pushed.

This is a Python package advisory audit, not an OS image vulnerability scan or a claim of comprehensive security. It is distinct from npm audit and cannot be inferred from a clean npm result. Real-model and live-provider gates remain BLOCKED for their previously documented reasons.
