# AI 检索力 | AI Retrieval Tool

> 面向科研学习与学术信息检索的 AI 检索式构建工具。将自然语言研究问题转化为可检查、可编辑，并参考目标数据库语法的布尔检索策略。

<p align="center">
  <a href="https://horacech.github.io/Information-Retrieval-Tool/"><strong>在线体验 Live Demo</strong></a>
  ·
  <a href="docs/USER_GUIDE.md">使用指南</a>
  ·
  <a href="docs/DEVELOPMENT.md">开发者文档</a>
  ·
  <a href="LICENSE">GPL-3.0 License</a>
</p>

<p align="center">
  <a href="https://github.com/HoraceCh/Information-Retrieval-Tool">GitHub Repository</a>
  ·
  <a href="https://github.com/HoraceCh/Information-Retrieval-Tool/issues">反馈问题 / Report an issue</a>
</p>

---

## 项目简介

**AI 检索力（AI Retrieval Tool）** 是一个面向科研人员、高校师生和信息检索学习者的 AI 辅助检索式构建工具。

研究者通常需要先把一个自然语言研究问题拆解成概念组，再扩展同义词、确定概念之间的逻辑关系，最后按照不同学术数据库的字段代码和检索语法组织表达式。本项目希望降低这段工作流的门槛：

1. 理解自然语言研究意图，提取核心概念与限制条件。
2. 扩展中英文关键词、同义词和相关专业术语。
3. 结合目标数据库的字段代码和语法提示组织布尔逻辑与字段限定。
4. 提供结构可视化、语法提示和人工修订入口。
5. 复制检索式并跳转到相应数据库执行检索。

**重要说明：本项目是检索策略与检索式构建工具，不是学术数据库、文献爬虫或全文下载器。** 实际检索结果由目标数据库提供，生成的检索式应由研究者检查并根据数据库官方语法调整。

## 核心功能

| 功能 | 说明 |
|---|---|
| 自然语言意图解析 | 从研究问题中提取主题、对象、方法、场景和限制条件 |
| 中英文关键词扩展 | 生成核心词、中文同义词、英文术语与缩写 |
| 数据库语法提示 | 按所选数据库提示布尔算符、字段代码、短语和位置算符；最终语法需在平台核对 |
| 可信服务接入 | 公共模式通过可信服务端调用 Gemini 等已配置文本模型；浏览器不接收或保存供应商密钥 |
| 服务地址配置 | 配置实现项目协议的可信服务地址；地址本身不可包含令牌或密码 |
| 双模型对比 | 并列比较不同模型生成的关键词和检索式 |
| 检索式结构检查与可视化 | 检查括号、引号、算符连接与可疑缺项，并展示关键词关系和布尔逻辑树；不代表数据库已接受该语法 |
| 离线官方网址速查 | 导出单文件 HTML，离线搜索内置数据库/专利网址目录；访问外部网站仍需网络 |
| 检索模板库 | 使用或管理不同学科和研究任务的检索框架 |
| 独立语音引擎选择 | Gemini、OpenAI、Deepgram、Local Whisper 均通过可信服务端；适配器不代表托管服务已就绪 |
| 官方网址速查 | 快速访问内置的学术数据库、专利与标准平台入口 |
| 本地历史与统计 | 在当前浏览器保存历史记录、调用统计和优化轨迹 |

## 检索式结构检查的边界

应用会提示括号、引号、悬空算符、连续算符、字段值缺失和可疑的相邻检索项。通过检查只表示基础结构未发现错误，不代表字段代码、截词/位置算符或目标数据库的实时语法一定兼容。自动规范化仅处理全角语法标点，不会自动补写或改写 AND / OR / NOT。

## 离线官方网址速查

应用可导出独立的单文件 HTML，离线搜索内置学术数据库、专利和标准平台网址目录，并保存自定义网址与文件名记录。文件名记录不会复制文件内容；对应文件需与导出的 HTML 放在同一文件夹。它是便携式网址速查目录，不是完整的离线 AI 检索引擎：AI 检索式生成和打开外部数据库仍需网络。

## 专题指南 / Search Guides

这些专题页提供独立、可直接访问的检索知识内容：

- [Academic Literature Search：学术文献检索工作流](https://horacech.github.io/Information-Retrieval-Tool/guides/academic-literature-search/)
- [Boolean Search：布尔检索式构建](https://horacech.github.io/Information-Retrieval-Tool/guides/boolean-search/)
- [Keyword Expansion：中英文关键词与同义词扩展](https://horacech.github.io/Information-Retrieval-Tool/guides/keyword-expansion/)

专题内容用于解释检索方法和示例；数据库语法可能随平台变化，正式检索前请核对官方文档。

## 关键词索引与项目特征词

为了便于研究者、开发者和开源项目目录理解本项目，下面按真实功能整理了中英文主题词：

- **产品定位**：AI 检索力、AI Retrieval Tool、AI academic search assistant、Academic Search Strategy Builder、Research Information Retrieval。
- **检索方法**：学术检索式生成、文献检索策略、Boolean Search、Boolean Query Builder、AND / OR / NOT、database-specific search syntax。
- **关键词处理**：中英文关键词扩展、同义词扩展、专业术语发现、Keyword Expansion、Synonym Expansion。
- **功能特征**：可信服务端接入、模型对比、服务地址配置、检索模板库、逻辑树可视化、语音转写、字段语法提示。
- **数据库生态**：CNKI、Wanfang Data、VIP、Web of Science、Scopus、EI Compendex、IEEE Xplore、ScienceDirect、Springer Nature Link、EBSCO、CNIPA、Espacenet。
- **科研场景**：科研文献调研、工程技术调研、系统综述检索准备、专利检索策略、信息素养训练。

这些关键词用于准确描述项目，不代表应用会自动抓取上述数据库的文献或提供全文，也不代表对所有平台语法的完整覆盖。

**建议在现有 GitHub repository topics 基础上补充：** `search-query-generator`、`ai-tools`、`react`、`typescript`。

## 支持的检索目标

项目内置了以下目标平台的语法提示或适配规则：

- **中文学术数据库**：中国知网（CNKI）、万方数据、维普资讯。
- **国际学术数据库**：Web of Science、Ei Compendex、Scopus、ScienceDirect、Springer Nature Link、EBSCO、PQDT、IEEE Xplore。
- **专利与标准**：CNIPA、壹专利、Espacenet / USPTO、国家标准全文公开系统。
- **学术发现与通用搜索**：百度学术 / PubScholar、Baidu / Bing。

数据库平台的语法和字段支持可能发生变化。内置规则用于辅助生成，不代表对每个平台当前全部检索能力的完整覆盖；正式检索前请核对平台官方帮助文档。

## 快速开始

### 在线使用

RC 使用流程如下；[线上应用](https://horacech.github.io/Information-Retrieval-Tool/) 可能仍是先前版本，只有授权发布后才会采用该流程：

1. 由服务维护者先部署可信服务，并在服务端配置 Gemini 密钥。GitHub Pages 本身不提供该服务。
2. 打开 **设置**，填入可信服务地址并选择模型，测试连接后保存；不要在页面填写供应商密钥。
3. 在检索工作区输入研究主题，选择目标数据库、语种和检索模板。
4. 点击生成，检查关键词扩展、布尔检索式、字段检索式和语法提示。
5. 根据研究需要手动修订，复制检索式，前往目标数据库执行检索。

首次使用可点击 **新手引导** 查看交互式操作流程。**项目介绍** 页面也提供功能概览、使用流程和文档入口。

### 本地运行

环境要求：Node.js 20 或更高版本，npm。

~~~bash
git clone https://github.com/HoraceCh/Information-Retrieval-Tool.git
cd Information-Retrieval-Tool
npm install
npm run dev
~~~

Vite 开发服务器默认运行在 localhost:3000。

常用命令：

~~~bash
npm run dev      # 启动开发服务器
npm run lint     # TypeScript 类型检查
npm run build    # 构建生产版本
npm run preview  # 本地预览生产构建
npm run test:validator  # 布尔检索式结构回归测试
npm run test:security   # 存储恢复与安全回归测试
npm run test:speech     # 语音适配器与路由测试
~~~

更多配置与操作细节见 [使用指南](docs/USER_GUIDE.md) 和 [开发者文档](docs/DEVELOPMENT.md)。

## 模型服务配置与凭据边界

当前 Release Candidate 的公共模式只通过可信服务端调用文本生成和模型配置接口。服务端预设 Gemini、DeepSeek、SiliconFlow、Moonshot、Zhipu、DashScope、OpenAI、OpenRouter，只有配置凭据且允许的模型可用。用户配置的是服务地址与模型名称，供应商 API Key 只放在服务端环境中。地址不可含用户密码、查询令牌或片段。此 RC 尚未授权生产部署，线上版本的行为请以实际页面为准。

模型服务商可能按调用量收费。服务维护者负责账户额度、鉴权、限流和隐私政策；不要把有密钥的推理服务直接暴露到公网。

### 语音识别与本地 Whisper

语音引擎与检索式生成模型独立选择，并在当前浏览器记住选择。Gemini、OpenAI、Deepgram 和 Local Whisper 均要求自行运行并配置可信服务端。所有供应商凭据只保存在该服务端，不放在 Vite 变量或 localStorage；未配置或服务失败时明确报错，没有浏览器密钥直连或隐式引擎回退。详见 [Speech Provider 架构与代理协议](docs/SPEECH_PROVIDERS.md)。

本仓库的 RC 包含独立 CPU/GPU 配置。CPU 默认 small / int8 / 单路并发；GPU 使用独立 Docker 配置。部署命令、WSL2 / NVIDIA 检查与真实模型 benchmark 见 [runtime README](services/speech-whisper/README.md) 和 [GPU 指南](docs/WHISPER_GPU.md)。GitHub Pages 不会自动安装、下载或启动 Whisper。CI 的模拟推理不代表真实模型、GPU 或四个服务已经验收。PR 状态和验收证据见本轮审查报告，不据此推断已合并或发布。

<a id="privacy-and-security"></a>

## 隐私与安全

RC 前端是 **静态应用**，文本和语音请求只发送到用户明确配置的可信服务，由服务端联系供应商；GitHub Pages 不托管代理或 Whisper 模型。

- 浏览器只持久化非敏感的服务地址、模型与偏好；不接受、保存或向服务发送供应商 API Key。
- 旧版本可能曾把供应商密钥放入 localStorage。升级需清理旧凭据；若浏览器阻止存储访问，不能据此声称清理成功，应按页面提示处理站点数据。备份和旧导出不在页面清理范围内，曾暴露的密钥应在供应商处撤销。
- localStorage 不是加密保险库，历史检索问题也可能含个人信息。共享设备上请清理本应用数据。
- 检索意图和录音发送到所配置的可信服务，并受实际服务与上游供应商的数据政策约束。Local Whisper 的模型在服务所在机器推理；首次下载模型仍需网络。
- 未认证的本地 API 必须保持 loopback 绑定；CORS / Origin 检查不是身份认证。远程服务必须由维护者提供认证 HTTPS 网关、限流和滥用保护。
- 不要将个人供应商密钥注入 GitHub Actions、Vite 构建、公开仓库、镜像或日志。服务地址不能包含秘密。

## 技术栈

- **Frontend**：React 19、TypeScript、Vite 6
- **Styling**：Tailwind CSS 4
- **Motion & Visualization**：Motion、Recharts、D3
- **Internationalization**：i18next、react-i18next
- **Model integration**：可信服务端 HTTP 协议与服务端供应商 API
- **Deployment**：GitHub Pages + GitHub Actions

## 项目结构

~~~text
.
├── .github/workflows/       # GitHub Pages deployment workflow
├── docs/
│   ├── USER_GUIDE.md        # End-user guide
│   └── DEVELOPMENT.md       # Architecture and development notes
├── src/
│   ├── components/          # UI modules and visualizations
│   ├── data/                # Built-in search templates
│   ├── services/             # Model-provider requests
│   ├── utils/                # Query validation and matching helpers
│   ├── App.tsx               # Main application and workspace state
│   ├── i18n.ts               # Interface language resources
│   └── main.tsx              # React entry point
├── index.html
├── package.json
└── vite.config.ts
~~~

## English

**AI Retrieval Tool** is an assistant with a static frontend and separately configured trusted server that helps researchers turn natural-language topics into academic search strategies. It expands Chinese and English keywords, drafts portable Boolean queries and database-specific syntax, compares model outputs, and checks basic query structure. A successful structural check does not certify compatibility with a database's complete or current grammar.

The standalone HTML export provides an offline-searchable directory of academic database, patent and standards URLs. Custom file entries store filenames only; the corresponding files must sit beside the exported HTML. Opening external sites and generating AI queries still require a network connection. The app does not crawl databases or host papers.

The public RC sends configured text providers and model discovery and all four speech engines through a separately configured trusted server. Provider keys stay on that server; the frontend accepts only a non-secret service URL and model selection. It has no browser-key fallback. Older releases may have stored keys locally; migration cleanup must report storage failures, and previously exposed keys should be revoked at the provider. GitHub Pages hosts no inference service. Adapters and mocked CI do not establish real-service, model or GPU readiness. This RC does not change production until an authorized deployment.

- [Open the live app](https://horacech.github.io/Information-Retrieval-Tool/)
- [User guide](docs/USER_GUIDE.md)
- [Developer guide](docs/DEVELOPMENT.md)

## License

本项目采用 [GNU General Public License v3.0](LICENSE)（GPL-3.0）。
