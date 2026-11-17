# G0 Repository Baseline — 2026-11-16

Status: **PASS WITH WARNINGS**. GitHub metadata was queried in this run; production visual availability is BLOCKED by the environment network policy. No production deployment was triggered.

## Immutable baseline

- Repository: HoraceCh/Information-Retrieval-Tool
- main: `57739e1beefa455c6c233f9f7a31cef8be1583b3`
- PR #13: merged 2026-11-15, merge commit equals current main.
- PR #14: OPEN / DRAFT / base `main`, head `bf3dc1399abfd0b26427d9d8694f4845c2d6d2ef`, mergeable at query time.
- PR #14 compared with main: 16 ahead, 1 behind. The missing commit is main's PR13 merge commit. Runtime contains the merged provider foundation but lacks this merge ancestry. Safe merge of main is required; no force rewrite.
- Open PRs: only #14. Open issues: none returned by live repository search.
- All 15 remote branch names and SHAs were queried; historical feature/fix branches remain untouched. Active work uses separate speech and UI branches/worktrees.
- Existing workspace: clean `work` branch at main before work began. No AGENTS.md found in the checkout/workspace search.

## GitHub Actions and Pages

| Scope | Run | SHA | Result |
|---|---|---|---|
| main CI | [43670418315](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43670418315) | 57739e1 | success |
| main Pages | [43670418339](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43670418339) | 57739e1 | success |
| PR14 CI | [43666416329](https://github.com/HoraceCh/Information-Retrieval-Tool/actions/runs/43666416329) | bf3dc13 | success |

The Pages run is deployment evidence, not evidence that its current rendered page was visually verified. GitHub connector disallowed the deployments collection endpoint. Production URL returned CONNECT 403 in curl and ERR_TUNNEL_CONNECTION_FAILED in Chromium; no production screenshot was accepted. User directed continuing local verification without waiting for cloud networking.

## Existing checks and fresh local verification

Fresh checks at baseline main passed: TypeScript, production build, 500 KiB/chunk budget, static guide/anchor/metadata/JSON-LD/sitemap validation; 28 validator tests, 6 scoped storage/inline JSON security tests, 7 speech registry/routing tests. Fresh npm audit reports **0 vulnerabilities** (345 dependencies including optional/dev).

CI uses Node 20, Python 3.12 on main. Browser smoke runs only on PR events and covers overview/navigation, 390px overflow, guide routes and exported offline HTML injection filtering. It does not validate all themes, interaction states, real cloud speech, real model inference, real microphones or local GPU. PR14 adds mocked Python API and benchmark-metric tests; those are not real model validation.

## Initial unresolved risks

1. Gemini/text BYOK configuration persists user keys in browser localStorage; do not claim all keys are server-only. OpenAI/Deepgram speech require a trusted backend.
2. PR14 contains runtime implementation, but Docker/GPU/real inference still require direct validation.
3. No Docker executable, NVIDIA runtime or cloud-provider credentials have been established in this workspace.
4. Current production rendering inaccessible; local built baseline screenshots captured anew under the screenshot audit.
5. UI screenshots show mobile speech controls wrapping vertically/model select overflow and low-contrast light-theme accents/settings information. Fixes tracked separately from PR14.
6. Successful existing CI does not satisfy G2–G4 or G6 release gates.
