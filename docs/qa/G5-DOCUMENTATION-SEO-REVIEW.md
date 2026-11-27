# G5 documentation and SEO consistency review

Review date: 2026-11-16 (Asia/Shanghai). Baseline: `57739e1beefa455c6c233f9f7a31cef8be1583b3`.

Status: **PASS WITH WARNINGS** for the documentation scope below. This is not a runtime or release sign-off.

## Findings and changes

- README, User Guide, Developer Guide and ProjectOverview still described speech as Gemini-only after PR #13 added four selectable adapters. Updated them to distinguish Gemini direct BYOK from OpenAI, Deepgram and local Whisper proxy integration points, and to state that adapters are not live-service verification.
- Existing text-model and Gemini browser-local credential storage remains explicit. Documentation does not claim that legacy keys have moved server-side. OpenAI/Deepgram speech secrets must stay on the separately configured trusted server.
- Documented microphone use, provider selection, recording cancellation, transcription review, common service errors and browser-local network restrictions. Chrome/Edge actual hardware and permission acceptance remain independent runtime gates.
- Added theme instructions and preserved the offline export distinction: a searchable URL directory and filename records, not an offline model, paper index or embedded file collection.
- Added architecture/proxy/testing and real-model benchmark requirements to the Developer Guide. Runtime deployment instructions link to Draft PR #14 and its branch, explicitly marked not on main. This avoids a UI-only merge falsely advertising the runtime as released or introducing links to missing files.
- Updated app metadata, visible product copy, Open Graph, Twitter description and SoftwareApplication JSON-LD consistently around query generation, conservative structural checks, speech adapters and database navigation. No paper crawling/full-text claim was added. Updated the root sitemap lastmod; guide dates remain unchanged because guide content was not changed.

## GitHub About and topics (read-only live check)

Source: `GET https://api.github.com/repos/HoraceCh/Information-Retrieval-Tool`, queried during this review.

- Homepage: `https://horacech.github.io/Information-Retrieval-Tool/` — matches canonical, OG URL, sitemap and README.
- Description: “AI-powered academic literature search assistant. Generate Boolean search queries and expand keywords from natural language for more effective scholarly database searching. 一个检索式生成工具，通过对用户输入的自然语言进行分析，生成检索式，辅助用户能够以最快的速度从所需的数据库中找到所需答案。”
- Topics: `academic-research`, `academic-search`, `ai-assisted-research`, `boolean-search`, `database-search`, `generative-ai`, `information-retrieval`, `keyword-expansion`, `literature-review`, `literature-search`, `natural-language-processing`, `query-builder`, `research-tools`, `search-query`, `search-strategy`.
- Verdict: current metadata describes the core product without claiming a hosted paper database. Suggested revised description for a later reviewed metadata edit: “AI-assisted academic search strategy builder: bilingual keyword expansion, Boolean query generation and structural checks, independent speech adapters, and database URL navigation. No paper crawling or full-text hosting.” Existing topics are accurate; `speech-recognition` can be added once the runtime release is verified. No remote metadata was changed.

## Validation

- `npm run lint`: PASS.
- `npm run validate:guides`: PASS (3 static guides, anchors, metadata, JSON-LD and sitemap).
- `npm run build`: PASS.
- `npm run validate:bundle`: PASS (9 JS chunks, each under the existing 500 KiB budget).
- `git diff --check`: PASS.
- All 11 relative Markdown links in README/User Guide/Developer Guide resolve in this worktree.
- App JSON-LD parses; canonical and OG URL match the public base; structured-data version matches package version; sitemap parses as XML; robots references the correct sitemap.

## Remaining release boundaries

- Runtime deployment and GPU compatibility details are owned by PR #14. Its branch links are intentionally development references and may evolve before merge.
- No real provider credentials, microphone recordings, local GPU, Docker inference or live model accuracy was validated by this documentation task.
- Existing browser-local text/Gemini keys are a known security limitation, not remedied by documentation.
- Crawler indexing, search ranking and external database availability cannot be inferred from local metadata validation.
- Do not mark G2/G3/G4/G6 PASS from these checks. Final G5 sign-off should recheck runtime-specific docs after integrating the speech and UI branches.
