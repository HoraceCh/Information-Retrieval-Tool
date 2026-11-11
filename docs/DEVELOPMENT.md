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
3. Installs dependencies with npm ci.
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

## 7. Known boundaries

- Query generation is model-assisted and may contain incorrect terms or syntax.
- Built-in database rules are guidance, not a guarantee of compatibility with every current database feature.
- The app does not crawl databases, fetch papers or host full text.
- API key storage is browser-local and not encrypted by the app.
- Provider availability, billing, quotas and data retention are controlled by each provider.

---

See also: [User Guide](USER_GUIDE.md) · [Project README](../README.md) · [Live App](https://horacech.github.io/Information-Retrieval-Tool/)
