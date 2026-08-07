# AI_RETRIEVAL_X (AI 检索力)

> **Intelligence Query Framework / 智慧检索式生成与学术词汇扩充专家**

[English](#english) | [中文](#中文)

---

<a id="english"></a>
## English

**AI_RETRIEVAL_X** is an AI-powered intelligence query generation and topic expansion framework designed to bridge natural language search intent with complex, database-specific Boolean retrieval rules. By leveraging state-of-the-art Large Language Models (LLMs)—including Google Gemini, DeepSeek, SiliconFlow, Kimi Moonshot, Zhipu GLM, Qwen, OpenAI, and OpenRouter—it converts everyday search requests into precision-crafted Boolean formulas for top academic databases and search engines.

---

### 🌐 Quick Access & Online Experience

You can experience the app directly in your web browser with **zero installation required**!

- **Web App / Live Access**: Access the web application directly in your browser.
- **Client-Side Security**: All API keys are configured and encrypted in your browser (`⚙️ Settings` panel at the bottom right) and sent directly to model providers. No server-side storage or tracking is used.

---

### 🎯 Key Highlights & Features

- **💡 Multi-Model & Provider Adaptability**: Presets for **Google Gemini, DeepSeek, SiliconFlow, Kimi (Moonshot), Zhipu GLM, Qwen (DashScope), OpenAI, and OpenRouter**, plus support for custom OpenAI-compatible endpoints.
- **🧠 Natural Language Intent Translation**: Simply describe your research topic in natural language (Chinese or English). AI extracts core concepts and builds strict Boolean queries with correct operators (`AND`, `OR`, `NOT`, proximity operators).
- **🎓 Database-Specific Syntax Adaptations**: Tailored rules for major databases:
  - **CNKI (知网)**: Formats standard fields (e.g. `SU = (A + B) AND TKA = C`).
  - **Web of Science / PubMed / Scopus / ScienceDirect**: Follows exact proximity and field syntax.
  - **Patent Search (CNIPA & 壹专利)**: Supports space-as-OR logic disjunction for CNIPA and standard Boolean rules for 壹专利.
- **🌳 Visual Query Tree & Real-Time Syntax Highlighting**: Color-coded syntax highlighting for operators, field tags, and quotes, paired with an interactive operator tree view for structural validation.
- **🚀 Smart Jump URLs**: One-click direct search jump links (`?kw=...` or `?q=...`) to execute formulas instantly on Baidu Academic, CNKI, or Bing.
- **🌐 Topic Expansion & Bilingual Synonym Engine**: Automatically enriches queries with domain synonyms and technical terminology across English, Chinese, or Bilingual modes.
- **⚡ Progressive Parallel Generation**: Process multiple search lines concurrently with real-time progress indicators and error boundaries.
- **📊 Usage Statistics & Local History**: Monitor token usage, success rates, and restore from 50 local query history snapshots.

---

### 🔑 How API Keys Work

AI_RETRIEVAL_X is designed as a privacy-first, client-driven web application. Users bring their own API Keys:
1. Click the **`⚙️ Settings`** button in the bottom right corner of the web interface.
2. Select your preferred provider (e.g., Gemini, DeepSeek, SiliconFlow, OpenAI).
3. Paste your API Key and click **Test Connection** or save.

---

### 🚀 Running Locally & Deployment

#### 1. One-Click Automated Launcher (Easiest)
Unzip the source package and double-click the setup launcher:
- **Windows**: Double-click `Windows一键自动部署配置并运行.bat`
- **macOS / Linux**: Run `chmod +x Mac-Linux一键自动部署配置并运行.sh && ./Mac-Linux一键自动部署配置并运行.sh`

#### 2. Manual Setup
```bash
# Clone or unzip the repo, then install dependencies
npm install

# Start development server
npm run dev
```

#### 3. GitHub Pages Deployment
This repository includes a built-in `.github/workflows/deploy.yml` workflow. Pushing to `main` will automatically build and publish static files to GitHub Pages (select *Source: GitHub Actions* under `Settings > Pages`).

---

### 📄 License

Licensed under the [GNU General Public License v3.0](LICENSE).

---

<a id="中文"></a>
## 中文

**AI_RETRIEVAL_X (AI 检索力)** 是一款前沿的智慧检索式生成与学术词汇扩充框架。旨在打破自然语言与复杂布尔逻辑检索系统之间的壁垒，借助于 Google Gemini、DeepSeek、硅基流动 (SiliconFlow)、月之暗面 (Kimi)、智谱 GLM、通义千问 (Qwen)、OpenAI 及 OpenRouter 等主流大语言模型的强大推理能力，将日常自然语言需求精准翻译为学术数据库和搜索引擎认可的高精布尔表达式。

---

### 🌐 在线体验与免部署访问

用户无需繁琐安装，即可直接通过网页端体验全部功能：

- **网页端直接使用**：直接在浏览器打开即可开始生成专业检索式。
- **隐私安全的 API 配置**：本应用为纯前端驱动/云端直连模式，所有 API Key 均存储在您本地浏览器（通过右下角 `⚙️ Settings` 设置菜单配置），直接与模型厂商交互，绝不上报或存储至第三方服务器。

---

### 🎯 核心功能与特色

- **💡 全主流大模型厂商适配**：预设集成 **Google Gemini、DeepSeek 官方、硅基流动 (SiliconFlow)、月之暗面 (Kimi)、智谱 GLM、通义千问 (DashScope)、OpenAI 官方以及 OpenRouter 聚合平台**，并支持自定义 OpenAI 兼容接口。
- **🧠 自然语言智能解析**：只需输入常规文本描述，系统自动提取核心概念模块，构建严谨的逻辑关系 (`AND`, `OR`, `NOT` 及位置算符)。
- **🎓 深度适配各大数据库语法**：
  - **知网 (CNKI)**：严格使用标准的字段限定代码（如 `SU = ('概念A' + '概念B') AND TKA = '概念C'`）。
  - **Web of Science / PubMed / Scopus / ScienceDirect**：精准匹配各自领域的规范逻辑符及字段标签。
  - **专利数据库双轨适配**：区分中国专利局 CNIPA（空格代表逻辑或 OR）与 壹专利（标准 Boolean 大写逻辑），彻底解决语法冲突。
- **🌳 语法高亮与布尔逻辑树**：实时彩色高亮逻辑算符、字段标签与限定引用，同步渲染交互式逻辑节点树，直观校验复杂公式结构。
- **🚀 检索一键直达 (Smart Jump)**：自动匹配生成带有真实搜索参数的直达 URL，一键在 CNKI、百度学术、Google Scholar 等平台拉起结果。
- **🌐 主题扩充与中英双语同义词**：结合 AI 知识库自动补齐高频同义词与相关专业术语，支持仅中文、仅英文或中英双语混合模式。
- **⚡ 渐进式并行生成与错误防崩盾**：支持多行需求一键并行解析，配有实时进度指示器与异常隔离保护。
- **📊 用量统计与本地历史快照**：内置 Token 用量与成功率统计面板，自动保存最近 50 条检索历史。

---

### 🔑 如何配置 API 密钥

AI_RETRIEVAL_X 采用**用户自行配置 API Key** 模式：
1. 打开网页后，点击右下角的 **`⚙️ Settings (设置)`** 按钮。
2. 在提供商下拉列表中选择您拥有的 API 厂商（如 DeepSeek、硅基流动、Gemini 等）。
3. 填入您获取的 API Key，点击“测试连接”验证无误后即可开始使用。

---

### 🚀 本地运行与部署

#### 1. 一键脚本启动（适合零基础用户）
解压源代码后直接运行自启脚本：
- **Windows 用户**：双击运行 `Windows一键自动部署配置并运行.bat`
- **macOS / Linux 用户**：终端运行 `chmod +x Mac-Linux一键自动部署配置并运行.sh && ./Mac-Linux一键自动部署配置并运行.sh`

#### 2. 手动开发模式
```bash
# 安装项目依赖
npm install

# 启动本地开发服务 (http://localhost:3000)
npm run dev
```

#### 3. GitHub Pages 一键部署
项目内置 `.github/workflows/deploy.yml` 脚本。将代码推送到 GitHub 仓库主分支后，在仓库 `Settings > Pages` 中选择 *Source: GitHub Actions* 即可全自动构建上线。

---

### 📄 开源协议 (License)

本项目遵循 [GNU General Public License v3.0 (GPL-3.0)](LICENSE) 开源协议。
