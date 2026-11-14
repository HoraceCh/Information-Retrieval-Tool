# 开发者文档 | Development Guide

## 1. 技术架构

当前项目是部署在 GitHub Pages 上的静态单页应用（SPA）。

- **UI**：React 19 + TypeScript
- **Build tool**：Vite 6
- **Styling**：Tailwind CSS 4
- **Animation**：Motion
- **Visualization**：Recharts + D3
- **Internationalization**：i18next + react-i18next
- **Model integration**：Google GenAI SDK 与 OpenAI-compatible HTTP APIs
- **Hosting**：GitHub Pages

模型请求从浏览器直接发送到所选服务商。当前仓库没有提供自建的 API 代理后端。

## 2. 本地开发

环境要求：Node.js 20+、npm。

~~~bash
git clone https://github.com/HoraceCh/Information-Retrieval-Tool.git
cd Information-Retrieval-Tool
npm install
npm run dev
~~~

Vite 默认监听 localhost:3000。

常用命令：

~~~bash
npm run dev      # Development server
npm run lint     # TypeScript type check (tsc --noEmit)
npm run build    # Production build
npm run preview  # Preview dist/
npm run test:validator  # Boolean-query structural regression tests
npm run test:security   # Storage recovery and security regression tests
~~~

## 3. 代码目录

~~~text
src/
├── components/
│   ├── AudioTranscriber.tsx
│   ├── ComparisonKeywordChart.tsx
│   ├── FeedbackAnalytics.tsx
│   ├── OfficialWhitelist.tsx
│   ├── ProjectOverview.tsx
│   ├── TemplateLibrary.tsx
│   ├── VisualQueryTree.tsx
│   └── ...                 # Other UI modules
├── data/
│   └── searchTemplates.ts  # Built-in search templates
├── services/
│   └── gemini.ts           # Gemini and OpenAI-compatible model requests
├── utils/
│   ├── booleanSyntaxValidator.ts
│   └── pinyinMatcher.ts
├── App.tsx                 # Main workspace, navigation and application state
├── i18n.ts                 # Translation resources
├── main.tsx                # React bootstrap
└── types.ts                # Shared TypeScript types
~~~

## 4. 应用数据与 API 请求

### Provider configuration

Provider configuration, including API keys, is persisted in the current browser's localStorage under ai_retrieval_providers. Other local state includes preferences, history, templates, usage statistics, cache and refinement trajectories.

localStorage is not encrypted by this application. Treat browser storage as sensitive and do not use shared devices for personal API credentials.

### Model requests

- Gemini requests use the Google GenAI SDK in the browser.
- Other providers use direct HTTP requests to their configured OpenAI-compatible endpoint.
- Audio transcription uses Gemini.
- Request contents and credentials are sent to the selected provider. Review that provider's data policy and billing terms.

**Never inject private provider keys into a public Vite build.** Vite define replacements and client-exposed environment variables are compiled into browser assets and must be treated as public. GitHub Pages deployment therefore does not require a model API key secret.

If the project later needs centrally managed credentials, rate limiting, shared accounts or server-side access control, introduce a separately secured backend/proxy rather than embedding a secret in the static frontend.

## 5. GitHub Pages deployment

Workflow: .github/workflows/deploy.yml

The workflow:

1. Checks out the repository.
2. Sets up Node.js.
3. Installs dependencies with `npm ci` and validates types and SEO guides before building.
4. Runs npm run build.
5. Uploads dist/ to GitHub Pages.
6. Deploys the Pages artifact.

Pushes to main trigger deployment. The Vite base: './' setting supports deployment under the repository subpath.

No provider API key is required at build time. Users configure their own keys in the application.

## 6. Contribution workflow

1. Create a feature branch from main.
2. Keep changes focused and avoid committing secrets or local .env files.
3. Run npm run lint and npm run build.
4. Open a pull request with a summary, screenshots for UI changes and verification notes.
5. Merge only after reviewing the diff and deployment implications.

## 7. Static research guide pages

Standalone, crawlable topic guides live under `public/guides/<slug>/index.html` and are copied directly into the Vite build output. They intentionally use static HTML rather than relying on the React SPA route so that each page has its own title, description, canonical URL, visible article content and structured data in the initial HTML response.

Current guide pages:

- `/guides/academic-literature-search/`
- `/guides/boolean-search/`
- `/guides/keyword-expansion/`

When adding or editing a guide:

1. Keep the article genuinely useful and distinct; do not create near-duplicate keyword landing pages.
2. Verify all examples and clearly label generic query syntax as illustrative where database behavior differs.
3. Add a canonical URL, concise meta description, Open Graph/Twitter metadata and appropriate `TechArticle` JSON-LD.
4. Link related guides and the main app using the GitHub Pages repository subpath.
5. Update `public/sitemap.xml` and the guide links in `ProjectOverview.tsx` and `README.md`.
6. Run `npm run lint` and `npm run build`, then verify the built HTML files under `dist/guides/`.

## 8. Search discoverability and SEO

The public GitHub Pages app includes a small SEO baseline:

- Keep the HTML title, meta description, canonical URL and Open Graph metadata accurate and aligned with the product's real scope.
- Keep the JSON-LD `SoftwareApplication` data consistent with implemented features and supported languages.
- Maintain the visible keyword index in `ProjectOverview.tsx`; use descriptive, user-facing terms rather than repeating keywords unnaturally.
- The Vite `public/sitemap.xml` is copied to the deployed site. If the site is submitted to Google Search Console or Bing Webmaster Tools, submit the sitemap URL: `https://horacech.github.io/Information-Retrieval-Tool/sitemap.xml`.
- Search engines may need time to crawl and render a client-side React application. Metadata and structured data improve interpretation but do not guarantee indexing or ranking.
- Suggested GitHub repository topics are documented in the README. Apply them in the repository's About settings when repository metadata editing is available.

When features, database coverage or the product's deployment URL change, update the overview page, README, metadata and JSON-LD together. Never claim that the app retrieves full-text papers or supports a database syntax feature unless the implementation has been verified.

## Dependency security, bundle size and browser QA

The repository uses npm as the authoritative installation workflow. Keep
`package-lock.json` synchronized with `package.json` and use `npm ci`
for repeatable CI and production builds. Audit advisories must not be ignored
merely because a build succeeds.

- `npm run audit:report` prints the current advisory inventory and dependency paths.
- `npm audit --audit-level=high` is enforced by both PR CI and Pages deployment.
- `npm run validate:bundle` checks the actual production `dist/assets/*.js` files
  against a maximum of 500 KiB per JavaScript chunk. This is a per-file budget,
  **not** a claim about total initial transfer size or runtime performance.
- React, i18n, D3, Recharts, Motion, icons, pinyin and the Gemini SDK have separate
  Vite vendor chunks to improve browser caching and reduce main-chunk parsing.
- PR CI additionally runs Chromium against the built `vite preview` site:
  About navigation, guide pages, table-of-contents anchors, mobile layout
  overflow and uncaught browser exceptions. It uploads desktop/mobile screenshots
  as an Actions artifact. No real model API keys are used.
- Browser smoke tests do not replace manual model-provider testing, accessibility
  audits or multi-browser QA. Verify provider connections using a disposable
  scoped API key when performing integration testing.

In November 2026, the original npm audit identified 13 advisories (including
one Critical issue in an unused Express dependency path). Unused Express-related
packages were removed and the lockfile was rebuilt using versions compatible with
the declared major version ranges. The remediation build reported **0 npm audit
vulnerabilities**. Future audit output may change as advisories are published.

## 9. Known boundaries

- Query generation is model-assisted and may contain incorrect terms or syntax.
- Built-in database rules are guidance, not a guarantee of compatibility with every current database feature.
- The app does not crawl databases, fetch papers or host full text.
- API key storage is browser-local and not encrypted by the app.
- Provider availability, billing, quotas and data retention are controlled by each provider.

---

See also: [User Guide](USER_GUIDE.md) · [Project README](../README.md) · [Live App](https://horacech.github.io/Information-Retrieval-Tool/)


## Security and recovery notes

- Error recovery removes only this application's namespaced localStorage/sessionStorage keys, including the legacy `suYangFinalV6_react` whitelist key; it never clears all browser storage.
- API keys are stored in browser localStorage without application-level encryption. Browser-side model requests send credentials directly to the selected provider.
- Exported offline HTML treats locally added names, URLs and filenames as untrusted input. Persisted URLs are validated as HTTP/HTTPS, dynamic labels use DOM text nodes, and unsafe filenames are ignored.
- File entries store filenames only; the actual documents are not embedded or uploaded and must be placed beside the exported HTML.


## 10. Retrieval-query structural validation

`src/utils/booleanSyntaxValidator.ts` is a conservative structural checker, not a complete parser for every database grammar.

- Tokenizes quoted phrases, field labels, parentheses, Boolean operators and selected proximity operators.
- Detects unmatched parentheses, unclosed quotes, leading/trailing or consecutive operators, empty groups, missing field values and ambiguous adjacency.
- Counts single-quoted and double-quoted phrases. Parentheses inside localized field labels such as `申请人所在国（省）=` are not grouping punctuation.
- Receives database, portable operator preference and field-specific mode; all are included in React memo dependencies.
- Automatic normalization is limited to full-width punctuation. It never rewrites Boolean operators, search terms or grouping.
- Passing means only that no covered structural error was found. It does not certify field-code validity, full database grammar, proximity/truncation semantics or recall.

Portable `booleanQuery` follows the selected operator preference. Database-native `fieldSpecificQuery` follows the target platform and search mode; global whitespace preferences must not override native syntax.

Run `npm run test:validator` and `npm run test:security`. The validator suite uses the existing TypeScript compiler and adds no runtime dependency.

### Offline URL reference export

The offline export packages the built-in database/standards/patent URL directory and pinyin search metadata into a standalone HTML file. Directory lookup works offline; external website access and model generation still require network. Custom file entries store filenames only, so the corresponding files must be placed beside the exported HTML. Inline JSON must continue to use the dedicated safe serializer.
