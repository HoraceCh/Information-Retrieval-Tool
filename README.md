# AI_RETRIEVAL_X (AI 检索力)

**Intelligence Query Framework / 智慧检索式生成专家**

[English](#english) | [中文](#中文)

---

<a id="english"></a>
## English

AI_RETRIEVAL_X is a powerful tool designed to help users generate professional search formulas for various academic and general databases using natural language. It leverages large language models (like Gemini and DeepSeek) to analyze search intent, expand topics, and map semantic concepts.

### Features
- **Natural Language to Search Formula**: Describe your search intent in plain text, and get a highly optimized boolean query.
- **Multiple Database Support**: Tailored schemas for Baidu/Bing, CNKI, Web of Science, PubMed, Google Scholar, and more.
- **Topic Expansion Engine**: Automatically extracts core keywords and generates high-frequency synonyms via LLMs to enhance recall rate.
- **Model Flexibility**: Supports multiple Gemini models and Custom OpenAI-compatible endpoints (like DeepSeek).
- **Search History**: Easily access and re-run your previous queries.
- **Bilingual Support**: Generates queries and synonyms in Chinese, English, or both.

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
4. **Open in Browser**: The terminal will show a local URL (usually `http://localhost:5173` or `http://localhost:3000`). Open this link in your browser.

> **Note**: To use the AI features, you will need to input your own API Key (Gemini or DeepSeek) in the "Settings" menu of the application.

---

<a id="中文"></a>
## 中文

AI_RETRIEVAL_X (AI 检索力) 是一个强大的辅助工具，旨在帮助用户通过自然语言为各种学术和通用数据库生成专业的检索式。它利用大型语言模型（如 Gemini 和 DeepSeek）来分析检索意图、扩展主题并进行语义概念映射。

### 核心功能
- **自然语言转检索式**：用大白话描述您的检索需求，即可获得高度优化的布尔逻辑检索式。
- **多数据库支持**：为百度/必应浏览器、知网 (CNKI)、Web of Science、PubMed、谷歌学术等数据库提供定制化映射。
- **主题扩展引擎**：自动提取核心关键词，并通过大模型生成高频同义词，显著提升检索召回率。
- **灵活的模型选择**：支持多种 Gemini 模型和自定义的兼容 OpenAI 格式的端点（如 DeepSeek）。
- **历史记录**：随时查看、调出并重新运行您过去的检索记录。
- **多语种支持**：支持生成中文、英文或双语混合的同义词和检索式。

### 本地运行指南

如果您将此项目下载/另存到了本地，请按照以下步骤运行：

1. **环境准备**：请确保您的电脑上已安装 [Node.js](https://nodejs.org/)。
2. **安装依赖**：在项目文件夹下打开终端（命令行），运行以下命令安装所需依赖库：
   ```bash
   npm install
   ```
3. **启动开发服务器**：
   ```bash
   npm run dev
   ```
4. **在浏览器中打开**：终端会显示一个本地访问地址（通常是 `http://localhost:5173` 或 `http://localhost:3000`）。在浏览器中打开该链接即可使用。

> **提示**：为了正常使用 AI 生成功能，您需要在应用的“设置 (Settings)”界面中填入您自己的 API Key (Gemini 或 DeepSeek 均可)。
