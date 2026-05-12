# AI_RETRIEVAL_X (AI 检索力)

**Intelligence Query Framework / 智慧检索式生成专家**

[English](#english) | [中文](#中文)

---

<a id="english"></a>
## English

**AI_RETRIEVAL_X** is an advanced intelligence query framework designed to bridge the gap between natural language and complex boolean retrieval systems. By leveraging the reasoning capabilities of state-of-the-art Large Language Models (LLMs) such as Gemini and DeepSeek, it translates your everyday search intent into highly optimized, professional search queries tailored for various academic databases and general search engines.

Whether you are preparing for academic research, systematic literature reviews, or simply trying to find specific industry reports, AI_RETRIEVAL_X handles the heavy lifting of keyword extraction, synonym expansion, logic assembly, and syntax adaptation.

### Target Audience
- **Researchers & Academics**: Quickly build complex Boolean queries for CNKI, Web of Science, PubMed, Ei Compendex, etc.
- **Students**: Aids in information literacy exactly when you hit a wall finding references for papers or assignments.
- **Corporate Intelligence**: Formulate deep search formulas to track competitors, patents, and technical standards.

### Core Features

- **Natural Language Parsing**: Just describe what you're looking for in plain English or Chinese. The AI will translate your intent into strict Boolean operators (`AND`, `OR`, `NOT`).
- **Auto Match Engine**: Unsure which database to use? The auto-match engine will intelligently choose the best database/platform for your topic and assemble the query and exact syntax accordingly.
- **Batch Processing & Parallel Execution**: Input multiple lines of text to generate queries simultaneously. The system executes LLM tasks in parallel, saving substantial time for batch topic processing.
- **Smart Jump URLs**: Automatically generates direct click-through URLs (`?kw=...` or `?q=...`) to immediately execute the created query on platforms like Baidu Academic, CNKI, or Bing.
- **Topic Expansion Engine**: Automatically extracts core concepts, mapping them to field-specific schemas (e.g., `SU=` vs `TI=`), and enriches them with high-frequency synonyms to maximize recall (sensitivity) and precision.
- **Bilingual Capabilities**: Generate synonyms and formulas in Chinese-only, English-only, or Bilingual modes based on your target database.
- **Model Flexibility & Stats**: Switch seamlessly between official Gemini APIs and custom OpenAI-compatible API endpoints (like DeepSeek). Gain insights into your token consumption and query success rates via the **Usage Statistics** panel.
- **History Tracking**: Automatically saves the last 50 queries locally, offering one-click restoration of historical searches.

### How to Run Locally

If you have downloaded/exported this project to your local machine, follow these steps to run it:

1. **Prerequisites**: Make sure you have [Node.js](https://nodejs.org/) installed on your computer.
2. **Install Dependencies**: Open a terminal in the project folder and run:
   ```bash
   npm install
   ```
3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
4. **Open in Browser**: The terminal will show a local URL (usually `http://localhost:3000`). Open this link in your browser.

> **Note**: If you are running this app locally, you must input your own API Key (Gemini or DeepSeek) in the "Settings" menu (⚙️) located at the bottom of the page to use the AI features. (In the AI Studio preview environment, default Gemini models work out-of-the-box).

---

<a id="中文"></a>
## 中文

**AI_RETRIEVAL_X (AI 检索力)** 是一款前沿的智慧检索式生成框架，致力于打破自然语言与复杂布尔逻辑检索系统之间的壁垒。借助于最先进的大语言模型（如 Gemini 和 DeepSeek）强大的推理能力，它能将您日常的大白话检索意图，精准翻译为适用于各大核心学术数据库及通用搜索引擎的专业优化检索式。

无论您是要进行学术研究、系统性文献综述（Systematic Review），还是寻找特定的行业研报，AI_RETRIEVAL_X 都能自动帮您完成“提取核心主旨 -> 扩充高质量同义词 -> 拼装布尔逻辑 -> 适配特定平台语法规则”的繁重任务。

### 靶向受众
- **科研工作者及学者**：为 CNKI 知网、Web of Science、Ei Compendex 等平台快速构建能够发表系统性综述级别的复杂布尔检索式。
- **高校学生**：“AI + 信息素养”赛事利器，更是搞定期刊论文与毕业设计查阅资料的得力助手。
- **企业情报与专利人员**：制定深度检索策略，精准追踪竞品动态、核心专利及技术标准。

### 核心功能与亮点

- **自然语言无缝解析**：只需用您最习惯的语言描述需求，AI 将为您处理严谨的布尔逻辑（`*`, `+`, `-`, `AND`, `OR`, `NOT`）。
- **智能自动匹配引擎**：不知道该去哪个库检索？自动智能匹配引擎会根据您的研究课题，自动预测并选择最合适的数据库/平台，并遵循该平台的语法生成表达式。
- **多任务并行处理 (Batch Processing)**：支持多行输入，一键并行触发多个检索任务的生成。底层采用并发控制，大幅减少批量主题处理时的等待时间。
- **一键直达跳转 (Smart Jump URLs)**：AI 动态猜想并生成带有真实 URL 参数（如 `?kw=` 或 `?q=`）的检索直达链接，极大简化了“复制黏贴”流程，直接点击即可一键发起真实引擎检索。
- **学术级主题扩充引擎**：自动识别并抽离核心概念模块，精准映射至各数据库的字段代码（例如 知网的 `SU=` 与 `TI=`），利用大模型庞大的知识库补齐高频同义词与相关学术词汇，大幅提升检索的**查全率 (Recall)**与**查准率 (Precision)**。
- **多语种无缝切换**：可根据需求强制引擎仅使用中文词、仅使用英文词，或中英双语混合。完美应对外文专利库（纯英文）或国内中文刊物检索。
- **无缝接入多模型与可视化统计**：支持内置 Gemini 官方 API 及任意兼容 OpenAI 格式的第三方接口（例如 DeepSeek）。内置“Usage Statistics (使用统计)” 面板，实时追踪 Token 消耗量、查询次数与成功率。
- **云端历史快照**：自动在本地保存最近 50 条检索快照，一键提取历史复杂的查询式及灵感。

### 本地运行指南

如果您将此项目下载/另存到了本地，请按照以下步骤运行：

1. **环境准备**：请确保您的电脑上已安装 [Node.js](https://nodejs.org/) (建议 Node 18+)。
2. **安装依赖**：在项目文件夹下打开终端（命令行），运行以下命令安装所需依赖库：
   ```bash
   npm install
   ```
3. **启动开发服务器**：
   ```bash
   npm run dev
   ```
4. **在浏览器中浏览**：终端会显示一个本地访问地址（通常是 `http://localhost:3000`）。在浏览器中打开该链接即可使用。

> **提示**：如果您在本地运行本项目，请先点击页面底部的 `⚙️ (Settings)`，并在对应模型提供商处填入您的专属 API 密钥激活生成服务。如果您是在 AI Studio 预览环境中体验，默认的 Gemini 模型已自动配置环境密钥，可直接使用（如需使用 DeepSeek 等第三方模型仍需自行填入 Key）。