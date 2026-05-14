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

### How to Run Locally (Beginner Friendly Guide)

If you have downloaded/exported this project to your local machine as a ZIP file, follow these detailed steps to get it running—even if you have zero coding experience!

**Step 1: Install Required Software**
1. Download and install **Node.js** from [nodejs.org](https://nodejs.org/) (We recommend the "LTS" version). This provides the necessary environment to run the application.
2. Download and install a code editor like **Visual Studio Code (VS Code)** from [code.visualstudio.com](https://code.visualstudio.com/). It makes managing files and commands much easier.

**Step 2: Prepare the Project Files**
1. Find the `.zip` file you downloaded and **extract/unzip** it completely into a new folder on your computer.
2. Open **VS Code**.
3. In VS Code, click on `File` > `Open Folder...` and select the folder where you just extracted the project files.

**Step 3: Open the Terminal**
1. Inside VS Code, look at the top menu bar and click `Terminal` > `New Terminal`. 
2. A small window will pop up at the bottom of the screen. This is where you will type commands.

**Step 4: Install Dependencies (Packages)**
In the terminal window, type the following command and press Enter:
```bash
npm install
```
*(Wait a minute or two. The system is downloading the necessary building blocks for the app to work. You'll see a folder named `node_modules` appear.)*

**Step 5: Configure Environment Variables (.env)**
1. In the project folder, locate the file named `.env.example`.
2. Duplicate this file and rename the copy to `.env`.
3. Open `.env` in VS Code and fill in the required environment variables (e.g., `GEMINI_API_KEY=your_gemini_api_key`), or you can configure keys directly in the application's UI settings later.

**Step 6: Start the Application**
Once the installation is complete, type this command and press Enter:
```bash
npm run dev
```
*(This commands starts the local server. You will see some text appear indicating the server is ready).*

**Step 7: Open in Your Browser**
1. The terminal will display a local web address, usually looking like `http://localhost:3000` or `http://localhost:5173`.
2. Hold down the `Ctrl` key (or `Cmd` on Mac) and click that link, OR copy and paste it into Chrome/Edge/Safari.
3. The application should now be running directly on your computer!

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

### 本地运行详细图文指南 (零基础小白向)

如果您从 AI Studio 导出了此项目的 ZIP 压缩包，并希望在自己的个人电脑上运行，请遵循以下保姆级别步骤——即使您完全没有编程经验也能轻而易举地搞定！

**第 1 步：安装必备的运行环境**
1. 去官网下载并安装 **Node.js** ([nodejs.org](https://nodejs.org/))。建议下载写着 "LTS (长期维护版)" 的版本。一路点击“下一步”默认安装即可。这是运行本软件的环境依赖基石。
2. （强烈建议）去官网下载并安装代码编辑器 **Visual Studio Code (简称 VS Code)** ([code.visualstudio.com](https://code.visualstudio.com/))，这会极大简化接下来的操作。

**第 2 步：解压并打开项目文件**
1. 找到您刚刚下载的 `.zip` 压缩包，一定要**将其完全解压**到一个普通的文件夹中（切勿直接在压缩包里双击打开）。
2. 打开安装好的 **VS Code** 软件。
3. 点击 VS Code 左上角的 `文件 (File)` -> `打开文件夹 (Open Folder...)`，选中您刚刚解压出来的那个文件夹。

**第 3 步：打开终端（命令行）**
1. 在 VS Code 的顶部菜单栏中，点击 `终端 (Terminal)` -> `新建终端 (New Terminal)`。
2. 此时在软件的底部会弹出一个代码输入框，这就相当于一个“指挥中心”。

**第 4 步：安装项目依赖（下载所需的积木）**
在底部的终端光标处，输入以下代码并按下回车键 (Enter)：
```bash
npm install
```
*(请耐心等待一两分钟。电脑会自动连网为您下载程序运行需要的各种开源组件。界面上出现一堆滚动的文字和进度条是正常现象。)*

**第 5 步：配置环境变量 (.env)**
1. 在项目文件夹中，找到名为 `.env.example` 的文件。
2. 复制该文件，并将复制出的新文件重命名为 `.env`（注意前面有个点）。
3. 在 VS Code 中打开 `.env` 文件，填入所需的环境变量（例如 `GEMINI_API_KEY=您的Gemini密钥`）。您也可以选择跳过此步，直接在网页界面的设置中填写密钥。

**第 6 步：启动项目服务**
当上述命令跑完，并且底部重新出现等待输入的闪烁光标后，继续输入以下代码并按回车键：
```bash
npm run dev
```
*(这条命令会把软件服务在你本地电脑正式跑起来。)*

**第 7 步：在浏览器中开始使用**
1. 稍等几秒钟，当你在终端里看到类似 `http://localhost:3000` 或 `http://localhost:5173` 的链接时，说明启动成功了。
2. 按住键盘上的 `Ctrl` 键 (苹果 Mac 电脑按 `Cmd` 键) 的同时，用鼠标左键点击那个链接；或者直接把它长按复制，粘贴到你的浏览器（如 Chrome, Edge）地址栏并回车。
3. **恭喜！** 您现在已经成功在本地掌握并运行这套强大的 AI 检索系统了！

> **提示**：如果您在本地运行本项目，请先点击页面底部的 `⚙️ (Settings)`，并在对应模型提供商处填入您的专属 API 密钥激活生成服务。如果您是在 AI Studio 预览环境中体验，默认的 Gemini 模型已自动配置环境密钥，可直接使用（如需使用 DeepSeek 等第三方模型仍需自行填入 Key）。