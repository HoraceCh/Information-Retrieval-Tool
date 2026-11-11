# AI 检索力 | AI Retrieval Tool

> 面向科研学习与学术信息检索的 AI 检索式构建工具。将自然语言研究问题转化为可检查、可编辑、适配目标数据库的布尔检索策略。

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
3. 根据目标数据库组织布尔逻辑与字段限定。
4. 提供结构可视化、语法提示和人工修订入口。
5. 复制检索式并跳转到相应数据库执行检索。

**重要说明：本项目是检索策略与检索式构建工具，不是学术数据库、文献爬虫或全文下载器。** 实际检索结果由目标数据库提供，生成的检索式应由研究者检查并根据数据库官方语法调整。

## 核心功能

| 功能 | 说明 |
|---|---|
| 自然语言意图解析 | 从研究问题中提取主题、对象、方法、场景和限制条件 |
| 中英文关键词扩展 | 生成核心词、中文同义词、英文术语与缩写 |
| 数据库语法适配 | 按所选数据库组织布尔算符、字段代码、短语和位置算符 |
| 多模型接入 | 预设 Gemini、DeepSeek、SiliconFlow、Kimi、Zhipu GLM、Qwen、OpenAI、OpenRouter |
| 自定义模型接口 | 支持自定义 OpenAI-compatible API endpoint |
| 双模型对比 | 并列比较不同模型生成的关键词和检索式 |
| 逻辑结构可视化 | 展示关键词关系、布尔逻辑树与语法提示 |
| 检索模板库 | 使用或管理不同学科和研究任务的检索框架 |
| 语音输入 | 通过 Gemini 语音转写输入研究意图 |
| 官方网址速查 | 快速访问内置的学术数据库、专利与标准平台入口 |
| 本地历史与统计 | 在当前浏览器保存历史记录、调用统计和优化轨迹 |

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
- **功能特征**：多模型接入、双模型对比、BYOK、OpenAI-compatible API、检索模板库、逻辑树可视化、语音转写、字段语法提示。
- **数据库生态**：CNKI、Wanfang Data、VIP、Web of Science、Scopus、EI Compendex、IEEE Xplore、ScienceDirect、Springer Nature Link、EBSCO、CNIPA、Espacenet。
- **科研场景**：科研文献调研、工程技术调研、系统综述检索准备、专利检索策略、信息素养训练。

这些关键词用于准确描述项目，不代表应用会自动抓取上述数据库的文献或提供全文，也不代表对所有平台语法的完整覆盖。

**建议的 GitHub repository topics：** `academic-search`、`information-retrieval`、`boolean-search`、`literature-review`、`search-query-generator`、`research-tools`、`keyword-expansion`、`ai-tools`、`react`、`typescript`。

## 支持的检索目标

项目内置了以下目标平台的语法提示或适配规则：

- **中文学术数据库**：中国知网（CNKI）、万方数据、维普资讯。
- **国际学术数据库**：Web of Science、Ei Compendex、Scopus、ScienceDirect、Springer Nature Link、EBSCO、PQDT、IEEE Xplore。
- **专利与标准**：CNIPA、壹专利、Espacenet / USPTO、国家标准全文公开系统。
- **学术发现与通用搜索**：百度学术 / PubScholar、Baidu / Bing。

数据库平台的语法和字段支持可能发生变化。内置规则用于辅助生成，不代表对每个平台当前全部检索能力的完整覆盖；正式检索前请核对平台官方帮助文档。

## 快速开始

### 在线使用

打开 [AI 检索力在线应用](https://horacech.github.io/Information-Retrieval-Tool/)：

1. 打开右上方的 **设置**，选择模型服务商与模型。
2. 填入自己的 API Key，点击 **测试连接**，确认可用后保存。
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
~~~

更多配置与操作细节见 [使用指南](docs/USER_GUIDE.md) 和 [开发者文档](docs/DEVELOPMENT.md)。

## 模型配置与 API Key

项目采用 **BYOK（Bring Your Own Key）** 模式：使用者自行向模型服务商申请 API Key，并在应用的设置面板中配置。

支持的预设服务商包括 Google Gemini、DeepSeek、SiliconFlow、Moonshot / Kimi、Zhipu GLM、Alibaba DashScope / Qwen、OpenAI 和 OpenRouter，也可以配置兼容 OpenAI API 格式的自定义服务。

模型服务商可能按调用量收费，具体价格、速率限制和可用模型以服务商公布的信息为准。语音转写功能使用 Gemini，需要单独配置可用的 Gemini API Key。

## 隐私与安全

当前部署是 **静态前端应用**，模型请求由浏览器直接发送给使用者选择的模型服务商；项目没有自建的模型代理后端。

- API Key 和部分用户配置保存在当前浏览器的 localStorage 中。
- localStorage 不是加密保险库。拥有当前浏览器本地访问权限的用户或恶意注入的脚本可能读取其中的数据。
- 检索意图、语音内容和 API 请求会发送到所选模型服务商，并受该服务商的数据处理、日志和隐私政策约束。
- 不要在公共或共享设备上保存个人 API Key；不要提交不适合发送给模型服务商的敏感资料。
- GitHub Pages 的公开前端构建不需要注入模型 API Key。请勿通过 Vite 的 define、公开构建变量或提交源码的方式把密钥打包进浏览器资源。

如需移除本地保存的密钥，请在应用设置中清除相应配置，或清除该站点在浏览器中的本地网站数据。

## 技术栈

- **Frontend**：React 19、TypeScript、Vite 6
- **Styling**：Tailwind CSS 4
- **Motion & Visualization**：Motion、Recharts、D3
- **Internationalization**：i18next、react-i18next
- **Model integration**：Google GenAI SDK、OpenAI-compatible HTTP APIs
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

**AI Retrieval Tool** helps researchers turn natural-language research topics into database-aware Boolean search strategies. It expands keywords, adapts query syntax to selected academic databases, compares model outputs, visualizes query structure and provides quick access to official database portals.

The app is a client-side tool, not a literature database. Users bring their own model API keys; requests are sent directly from the browser to the selected provider. Keys are stored in browser localStorage, which is not encrypted by the app. Please review the provider's data policy and avoid entering sensitive information.

- [Open the live app](https://horacech.github.io/Information-Retrieval-Tool/)
- [User guide](docs/USER_GUIDE.md)
- [Developer guide](docs/DEVELOPMENT.md)

## License

本项目采用 [GNU General Public License v3.0](LICENSE)（GPL-3.0）。
