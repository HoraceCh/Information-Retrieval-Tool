# AI_RETRIEVAL_X (AI 检索力)

> **Intelligence Query Framework / 智慧检索式生成与学术词汇扩充专家**

[English](#english) | [中文](#中文)

---

<a id="english"></a>
## English

**AI_RETRIEVAL_X** is an intelligent query generation and semantic topic expansion framework designed for researchers, academics, librarians, and information specialists. It bridges everyday natural language research intents with complex, database-specific Boolean retrieval rules.

Powered by state-of-the-art Large Language Models (LLMs)—including Google Gemini, DeepSeek, SiliconFlow, Kimi Moonshot, Zhipu GLM, Qwen, OpenAI, and OpenRouter—it translates research concepts into high-precision, syntactically valid Boolean formulas tailored for top academic databases and patent search engines.

---

### 🌐 Instant Web Access (Zero Installation)

**Experience the tool directly in your browser without any installation, downloads, or deployment:**

- ⚡ **Direct Web Experience**: Open the web application and begin generating Boolean search queries immediately.
- 🔒 **Privacy-First & Client-Side Security**: All API keys and preferences are stored exclusively in your browser's encrypted local storage (`⚙️ Settings` in the bottom navigation). Requests communicate directly with model providers with zero third-party logging or data collection.

---

### 🎯 Key Features

- **🎙️ Voice-to-Text Audio Input (`gemini-3.5-transcribe`)**: Speak your research intentions naturally. Powered by Google's dedicated `gemini-3.5-transcribe` multimodal audio model, speech is transcribed in real-time into query input with waveform audio visualization and recording timers.
- **📊 Recharts Keyword Coverage Visualizer**: In side-by-side Comparison Mode, an embedded interactive Recharts chart contrasts Model A and Model B across core keyword count, Chinese/English synonym depth, formula token density, and shared vs. unique vocabulary.
- **🌓 Dark & High-Contrast Light Theme**: Easily toggle between the immersive cyber dark theme and a high-contrast daylight theme in the top system bar, optimized for varying lighting conditions and accessibility.
- **📱 Multi-Device Responsive Interface**: Fully adaptive responsive layout providing seamless productivity across ultra-wide monitors, laptops, tablets, and smartphones.
- **💡 Multi-Model & Multi-Provider Ecosystem**: Native presets for **Google Gemini, DeepSeek, SiliconFlow, Kimi (Moonshot), Zhipu GLM, Qwen (DashScope), OpenAI, and OpenRouter**, plus custom OpenAI-compatible endpoints.
- **🧠 Natural Language Intent Translation**: Simply describe research questions in everyday language. The engine extracts core conceptual facets and builds Boolean queries with precise operators (`AND`, `OR`, `NOT`, proximity/adjacency operators).
- **🎓 Database-Specific Syntax Tailoring**:
  - **CNKI (中国知网)**: Formats standard fields (e.g. `SU = (A + B) AND TKA = C`).
  - **Web of Science / PubMed / Scopus / IEEE / ScienceDirect**: Adheres strictly to respective proximity, phrase quoting, and field codes.
  - **Patent Search Dual-Track**: Supports space-as-OR logic for CNIPA and standard uppercase Boolean rules for 壹专利.
- **🌳 Interactive Syntax Highlighting & Query Tree**: Real-time color-coded syntax highlighting (AND/OR/NOT/Fields/Quotes) and interactive query tree visualization for structural validation.
- **🚀 Smart Jump URLs**: One-click direct search links to execute generated queries instantly on Baidu Academic, CNKI, Bing, and more.
- **📚 Official Whitelist Quick Lookup**: Rapid built-in directory of verified academic database portals, proxy guides, and literature access shortcuts.
- **📊 Usage Analytics & Local History**: Monitor token consumption, latency, and success rates with automatic local backup of your last 50 queries.

---

### 🔑 How to Configure API Keys

AI_RETRIEVAL_X operates on a privacy-respecting **Bring-Your-Own-Key (BYOK)** model:
1. Click the **`⚙️ Settings`** icon in the bottom system bar.
2. Select your preferred provider (e.g., Gemini, DeepSeek, SiliconFlow, OpenAI).
3. Enter your API Key and click **Test Connection** or Save.

---

### 💻 Local Run (Optional for Developers)

For users who wish to run or customize the project locally:

```bash
# Clone the repository and install dependencies
git clone https://github.com/your-username/AI_RETRIEVAL_X.git
cd AI_RETRIEVAL_X
npm install

# Start local development server (runs on port 3000)
npm run dev
```

You can also double-click the included one-click launcher scripts:
- **Windows**: `Windows一键自动部署配置并运行.bat`
- **macOS / Linux**: `./Mac-Linux一键自动部署配置并运行.sh`

---

### 📄 License

Licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).

---

<a id="中文"></a>
## 中文

**AI_RETRIEVAL_X (AI 检索力)** 是一款专为科研人员、高校师生、图书馆员及情报分析师打造的智慧检索式生成与学术词汇扩充框架。

本工具旨在打破自然语言与复杂学术数据库布尔逻辑规则之间的壁垒，借助于 Google Gemini、DeepSeek、硅基流动 (SiliconFlow)、月之暗面 (Kimi)、智谱 GLM、通义千问 (Qwen)、OpenAI 及 OpenRouter 等主流大语言模型的推理能力，将日常自然语言需求精准转换为学术数据库和专利系统认可的高精布尔检索式。

---

### 🌐 免安装、即开即用（网页端直接体验）

**您无需配置任何本地环境或经历繁琐部署，直接在浏览器中打开网页即可完整体验全部功能：**

- ⚡ **纯网页即时体验**：输入网址即可直接在浏览器内进行智能检索式生成、双模型对比与同义词扩展。
- 🔒 **隐私安全保障 (BYOK 模式)**：纯前端驱动与云端直连模式，所有 API 密钥和偏好设置均保存在您本地浏览器的加密缓存中（通过右下角 `⚙️ 设置` 配置），直接与模型厂商官方通信，绝不上报或存储至任何第三方服务器。

---

### 🎯 核心功能与技术特色

- **🎙️ 麦克风语音转文字 (基于 gemini-3.5-transcribe)**：支持直接口述检索意图。集成 Google 专用高精音频大模型 `gemini-3.5-transcribe`，配有动态声波音量可视化、录音计时与防短录保护，一键快速将口述内容转写填入检索框。
- **📊 核心词覆盖 Recharts 可视化对比图**：开启双模型比对模式时，结果面板内嵌微型 Recharts 图表，直观量化对比两个模型在核心概念数、中英同义词扩展深度、检索式词量密度及共同词 vs 独有词覆盖率。
- **🌓 沉浸深色 / 高对比度浅色双主题一键切换**：顶部系统栏内置主题切换开关，支持在沉浸科技深色主题与高对比度浅色主题之间无缝切换，适配不同光照环境与视觉偏好。
- **📱 多设备屏幕自适应与响应式优化**：针对超宽台式屏、笔记本电脑、平板以及手机屏幕进行了系统级响应式布局优化，无论横屏还是竖屏均可舒适操作。
- **💡 主流大模型全生态兼容**：预设集成 **Google Gemini、DeepSeek 官方、硅基流动 (SiliconFlow)、月之暗面 (Kimi)、智谱 GLM、通义千问 (DashScope)、OpenAI 官方以及 OpenRouter 聚合平台**，并支持自定义 OpenAI 兼容接口。
- **🧠 自然语言智能语义解析**：输入科研主题或问题描述，AI 自动切分主题概念小面，构建严密的布尔逻辑关系 (`AND`, `OR`, `NOT` 及位置邻近算符)。
- **🎓 深度适配各大数据库语法规范**：
  - **中国知网 (CNKI)**：严格使用规范字段限定（如 `SU = ('概念A' + '概念B') AND TKA = '概念C'`）。
  - **Web of Science / PubMed / Scopus / IEEE / ScienceDirect**：精准匹配对应数据库的邻近算符、精确短语双引号及特定字段标识。
  - **专利检索双轨制适配**：区分中国专利局 CNIPA（空格代表逻辑或 OR）与 壹专利（标准大写 Boolean 算符），彻底避免检索语法歧义。
- **🌳 语法高亮与交互式布尔逻辑树**：实时彩色高亮逻辑算符、字段标签与限定词组，同步渲染交互式逻辑树节点，直观校验复杂公式嵌套结构。
- **🚀 检索一键直达 (Smart Jump)**：自动生成带有真实检索参数的直达链接，一键在百度学术、CNKI、Google Scholar 等学术平台调起检索结果。
- **📚 官方学术白名单与网址速查**：内置权威学术数据库直达导航、代理与校园网访问指引，提供纯净快捷的学术检索通道。
- **📊 Token 用量统计与本地历史快照**：内置调用量与成功率分析看板，自动持久化存储最近 50 条检索历史记录，支持一键复用与回溯。

---

### 🔑 如何配置 API 密钥

AI_RETRIEVAL_X 采用**用户自行配置密钥 (BYOK)** 模式：
1. 打开网页后，点击右下角的 **`⚙️ Settings (设置)`** 按钮。
2. 在提供商下拉列表中选择您使用的模型服务商（如 DeepSeek、硅基流动、Gemini、OpenAI 等）。
3. 填入您的 API Key，点击“测试连接”验证通过后即可永久保存并开始使用。

---

### 💻 本地运行（开发者可选）

如需在本地进行二次开发或定制修改：

```bash
# 克隆代码仓库并安装依赖
git clone https://github.com/your-username/AI_RETRIEVAL_X.git
cd AI_RETRIEVAL_X
npm install

# 启动本地开发服务器 (默认端口 3000)
npm run dev
```

也可以直接运行项目根目录下的免配启动脚本：
- **Windows 用户**：双击 `Windows一键自动部署配置并运行.bat`
- **macOS / Linux 用户**：执行 `./Mac-Linux一键自动部署配置并运行.sh`

---

### 📄 开源协议 (License)

本项目遵循 [GNU General Public License v3.0 (GPL-3.0)](LICENSE) 开源协议。

