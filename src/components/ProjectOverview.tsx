import {
  ArrowRight,
  BookOpen,
  Code2,
  Database,
  ExternalLink,
  Github,
  KeyRound,
  Layers,
  Mic,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProjectOverviewProps {
  onStart: () => void;
  onOpenWhitelist: () => void;
}

const REPO_URL = "https://github.com/HoraceCh/Information-Retrieval-Tool";
const SITE_URL = "https://horacech.github.io/Information-Retrieval-Tool/";

export default function ProjectOverview({
  onStart,
  onOpenWhitelist,
}: ProjectOverviewProps) {
  const { i18n } = useTranslation();
  const copy = (zh: string, en: string) =>
    i18n.language === "en" ? en : i18n.language === "zh" ? zh : zh + " / " + en;

  const features = [
    {
      icon: Search,
      title: copy("自然语言理解", "Natural-language intent"),
      description: copy(
        "从研究问题中提取核心概念、研究对象与限制条件，扩展中英文同义词。",
        "Extracts concepts, research subjects and constraints, then expands Chinese and English terms."
      ),
    },
    {
      icon: Database,
      title: copy("数据库语法适配", "Database-aware syntax"),
      description: copy(
        "根据目标数据库组织布尔逻辑、字段代码、短语和位置算符。",
        "Shapes Boolean logic, field codes, phrases and proximity operators for the selected database."
      ),
    },
    {
      icon: Layers,
      title: copy("多模型与模板", "Models and templates"),
      description: copy(
        "接入多家模型服务商，支持自定义 OpenAI 兼容接口、双模型对比和检索框架模板。",
        "Connects multiple model providers and custom OpenAI-compatible endpoints, with comparison and reusable templates."
      ),
    },
    {
      icon: Network,
      title: copy("结构检查与可视化", "Structure and validation"),
      description: copy(
        "通过关键词关系、布尔逻辑树和基础结构检查辅助复核；检查通过不代表数据库语法已获认证。",
        "Review strategies with keyword relationships, Boolean trees and conservative structural checks; a pass does not certify database compatibility."
      ),
    },
    {
      icon: Mic,
      title: copy("语音输入与快捷检索", "Voice and quick access"),
      description: copy(
        "可口述研究意图，并从官方数据库入口快速打开目标平台。",
        "Dictate a research intent and jump to official database portals."
      ),
    },
    {
      icon: KeyRound,
      title: copy("个人 API 配置", "Bring your own API key"),
      description: copy(
        "由使用者自行配置模型 API Key；模型调用从浏览器直接发送至所选服务商。",
        "Configure your own provider credentials; requests are sent from the browser to the selected provider."
      ),
    },
  ];

  const keywordGroups = [
    {
      title: copy("产品定位与检索工具", "Product category and discovery"),
      description: copy(
        "帮助研究者从自然语言研究问题出发，构建可编辑、可复核的学术数据库检索策略。",
        "A research assistant for turning natural-language questions into editable and reviewable academic database search strategies."
      ),
      href: "#project-intro",
      terms: [
        "AI 检索力",
        "AI Retrieval Tool",
        "AI 学术检索工具",
        "AI 辅助文献检索策略",
        "Academic Search Strategy Builder",
        "AI Search Query Generator",
        "Research Information Retrieval",
        "Literature Search Assistant",
      ],
    },
    {
      title: copy("检索策略与布尔语法", "Search strategy and Boolean syntax"),
      description: copy(
        "聚焦关键词发现、概念扩展、布尔逻辑组织与数据库字段表达。",
        "Focuses on keyword discovery, concept expansion, Boolean logic and database field syntax."
      ),
      href: "#capabilities",
      terms: [
        "学术检索式生成",
        "布尔检索式生成器",
        "Boolean Search",
        "Boolean Query Builder",
        "Literature Search Query Generator",
        "关键词扩展 / Keyword Expansion",
        "同义词扩展 / Synonym Expansion",
        "AND · OR · NOT",
        "数据库字段检索 / Field Codes",
        "位置算符 / Proximity Operators",
        "PICO 检索框架",
        "检索逻辑树 / Query Logic Tree",
      ],
    },
    {
      title: copy("产品功能与技术特征", "Product features and technical capabilities"),
      description: copy(
        "对应应用中实际提供的模型接入、模板、比较、结构检查、可视化和语音输入能力。",
        "Reflects implemented model access, templates, comparison, structural query checks, visualization and voice-input capabilities."
      ),
      href: "#model-access",
      terms: [
        "多模型接入 / Multi-model Support",
        "双模型对比 / Dual-model Comparison",
        "BYOK · Bring Your Own Key",
        "OpenAI-compatible API",
        "自定义模型服务商",
        "检索模板库 / Search Templates",
        "语音转文字 / Voice Transcription",
        "检索式结构检查 / Query Validation",
        "基础布尔结构检查 / Boolean Structure Check",
        "关键词关系可视化",
        "本地历史记录 / Local Search History",
      ],
    },
    {
      title: copy("学术数据库与信息平台", "Academic databases and information platforms"),
      description: copy(
        "展示项目内置检索语法提示或快捷入口涉及的平台；实际语法请以各平台官方文档为准。",
        "Platforms covered by built-in syntax guidance or quick links; always verify current syntax in official database documentation."
      ),
      href: "#database-coverage",
      terms: [
        "中国知网 / CNKI",
        "万方数据 / Wanfang Data",
        "维普 / VIP",
        "Web of Science",
        "Scopus",
        "EI Compendex",
        "IEEE Xplore",
        "ScienceDirect",
        "Springer Nature Link",
        "EBSCO",
        "CNIPA",
        "Espacenet",
      ],
    },
    {
      title: copy("科研应用场景", "Research use cases"),
      description: copy(
        "适用于科研选题、工程技术调研、文献综述准备和专利技术检索策略构建。",
        "Useful for research scoping, engineering literature surveys, literature-review preparation and patent search strategy development."
      ),
      href: "#workflow",
      terms: [
        "科研文献调研 / Research Literature Review",
        "工程技术调研 / Engineering Research",
        "系统综述检索准备 / Systematic Review Search Planning",
        "专利检索策略 / Patent Search Strategy",
        "高校科研训练 / Academic Research Training",
        "信息素养 / Information Literacy",
      ],
    },
  ];

  const steps = [
    copy("描述研究问题", "Describe the research question"),
    copy("选择数据库、模型与检索模板", "Choose a database, model and template"),
    copy("生成并检查检索式", "Generate and review the query"),
    copy("复制检索式并前往数据库执行", "Copy the query and run it in the database"),
  ];

  const databaseGroups = [
    {
      title: copy("中文学术数据库", "Chinese academic databases"),
      items: ["CNKI 知网", "万方数据", "维普资讯"],
    },
    {
      title: copy("国际学术数据库", "International research databases"),
      items: [
        "Web of Science",
        "Ei Compendex",
        "Scopus",
        "ScienceDirect",
        "Springer Nature Link",
        "EBSCO",
        "PQDT",
        "IEEE Xplore",
      ],
    },
    {
      title: copy("专利与标准", "Patents and standards"),
      items: ["CNIPA", "壹专利", "Espacenet / USPTO", "国家标准全文公开系统"],
    },
    {
      title: copy("学术发现与通用搜索", "Academic discovery and web search"),
      items: ["百度学术 / PubScholar", "Baidu / Bing"],
    },
  ];

  const resources = [
    {
      icon: Github,
      title: "GitHub Repository",
      description: copy("源代码、版本记录与问题反馈", "Source code, releases and issue tracking"),
      href: REPO_URL,
    },
    {
      icon: BookOpen,
      title: copy("使用指南", "User Guide"),
      description: copy("从 API 配置到检索式生成的操作说明", "Provider setup and end-to-end usage instructions"),
      href: REPO_URL + "/blob/main/docs/USER_GUIDE.md",
    },
    {
      icon: Code2,
      title: copy("开发者文档", "Developer Guide"),
      description: copy("技术栈、目录结构、开发与部署流程", "Technology stack, project structure and deployment"),
      href: REPO_URL + "/blob/main/docs/DEVELOPMENT.md",
    },
    {
      icon: ShieldCheck,
      title: copy("隐私与安全说明", "Privacy and Security"),
      description: copy("了解 API Key 存储方式和数据流向", "Understand credential storage and request data flow"),
      href: SITE_URL + "?tab=about#privacy-and-security",
    },
  ];

  const cardClass =
    "rounded-2xl border border-white/10 bg-slate-900/45 p-5 shadow-sm [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white";
  const headingClass = "text-white [.theme-light_&]:text-slate-900";
  const bodyClass = "text-sm leading-7 text-slate-300 [.theme-light_&]:text-slate-600";

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-8 overflow-y-auto px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      <section id="project-intro" aria-labelledby="project-overview-title" className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 via-slate-900/80 to-indigo-500/15 p-6 sm:p-9 lg:p-12 [.theme-light_&]:border-cyan-200 [.theme-light_&]:from-cyan-50 [.theme-light_&]:via-white [.theme-light_&]:to-indigo-50">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-cyan-300 [.theme-light_&]:text-cyan-800">
              <Sparkles size={13} />
              {copy("AI 辅助学术信息检索", "AI-assisted academic information retrieval")}
            </div>
            <h2 id="project-overview-title" className={"text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl " + headingClass}>
              AI 检索力
              <span className="mt-2 block text-xl font-semibold text-cyan-300 sm:text-2xl [.theme-light_&]:text-cyan-700">
                AI Retrieval Tool
              </span>
            </h2>
            <p className={"mt-5 max-w-2xl text-base leading-8 sm:text-lg " + bodyClass}>
              {copy(
                "把自然语言研究问题，转化为适配学术数据库的检索策略。帮助你梳理概念、扩展关键词、组织布尔逻辑，并检查检索式结构。",
                "Turn a natural-language research question into a database-aware search strategy. Organize concepts, expand keywords, build Boolean logic and review query structure."
              )}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
              >
                <Sparkles size={16} />
                {copy("开始生成检索式", "Start building a query")}
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={onOpenWhitelist}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 [.theme-light_&]:border-slate-300 [.theme-light_&]:bg-white [.theme-light_&]:text-slate-700"
              >
                <Database size={16} />
                {copy("浏览数据库入口", "Browse database portals")}
              </button>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:text-cyan-300 [.theme-light_&]:text-slate-600"
              >
                <Github size={16} />
                GitHub
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-2xl backdrop-blur [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white/80">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Search workflow</span>
              <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">4 steps</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-slate-50">
                <div className="mb-1 text-[10px] text-slate-500">01 / RESEARCH INTENT</div>
                <div className="text-slate-200 [.theme-light_&]:text-slate-700">“Robotics for photovoltaic panel cleaning”</div>
              </div>
              <div className="flex justify-center text-cyan-400">↓</div>
              <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-3">
                <div className="mb-1 text-[10px] text-cyan-300">02 / CONCEPT EXPANSION</div>
                <div className="text-slate-200 [.theme-light_&]:text-slate-700">robotics · cleaning · photovoltaic</div>
              </div>
              <div className="flex justify-center text-cyan-400">↓</div>
              <div className="rounded-xl border border-indigo-400/25 bg-indigo-400/10 p-3">
                <div className="mb-1 text-[10px] text-indigo-300">03 / BOOLEAN STRATEGY</div>
                <div className="break-words text-slate-200 [.theme-light_&]:text-slate-700">
                  (robot* OR cleaning robot*) AND (photovoltaic OR solar panel*)
                </div>
              </div>
              <div className="flex justify-center text-cyan-400">↓</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-slate-50">
                <div className="mb-1 text-[10px] text-slate-500">04 / DATABASE SEARCH</div>
                <div className="text-slate-200 [.theme-light_&]:text-slate-700">Review · Copy · Search</div>
              </div>
            </div>
            <p className="mt-4 text-[10px] leading-5 text-slate-500">
              {copy(
                "示意流程，仅用于说明产品工作方式；示例检索式不是经过数据库验证的结果。",
                "Illustrative workflow only; the sample query is not a database-validated result."
              )}
            </p>
          </div>
        </div>
      </section>

      <section id="capabilities" aria-labelledby="capabilities-title" className="space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Capabilities</p>
          <h3 id="capabilities-title" className={"mt-1 text-xl font-bold " + headingClass}>{copy("核心能力", "What the tool helps you do")}</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className={cardClass}>
                <div className="mb-4 inline-flex rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-cyan-400">
                  <Icon size={19} />
                </div>
                <h4 className={"mb-2 font-bold " + headingClass}>{feature.title}</h4>
                <p className={bodyClass}>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="keyword-index" aria-labelledby="keyword-index-title" className={cardClass}>
        <div className="mb-5 max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Search & Discovery Index</p>
          <h3 id="keyword-index-title" className={"mt-1 text-xl font-bold " + headingClass}>
            {copy("关键词与特征词索引", "Keyword and feature index")}
          </h3>
          <p className={"mt-2 " + bodyClass}>
            {copy(
              "按产品定位、检索方法、功能特征、数据库平台和科研场景整理常用主题词，帮助研究者快速判断工具是否适合自己的任务，也让项目的核心主题表达更加清晰。",
              "Explore the tool by product category, search methods, implemented features, database coverage and research use cases."
            )}
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            {copy(
              "索引词描述的是本项目实际定位与功能，不代表本工具直接提供论文全文、自动抓取数据库内容，或保证每个数据库的检索语法始终完全兼容。",
              "These terms describe the product's scope and implemented capabilities. The app does not crawl databases, provide full-text papers or guarantee permanent compatibility with every database syntax."
            )}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {keywordGroups.map((group) => (
            <article
              key={group.title}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-4 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-slate-50"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h4 className={"text-sm font-bold " + headingClass}>{group.title}</h4>
                <a
                  href={group.href}
                  aria-label={copy("跳转到相关功能", "Jump to related section")}
                  className="shrink-0 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
              <p className="mb-3 text-xs leading-5 text-slate-400 [.theme-light_&]:text-slate-600">{group.description}</p>
              <div className="flex flex-wrap gap-1.5" aria-label={group.title}>
                {group.terms.map((term) => (
                  <a
                    key={term}
                    href={group.href}
                    className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.06] px-2 py-1 text-[10px] leading-4 text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-500/10 [.theme-light_&]:text-cyan-800"
                  >
                    {term}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>


      <section id="learning-guides" aria-labelledby="learning-guides-title" className="space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Research Guides</p>
          <h3 id="learning-guides-title" className={"mt-1 text-xl font-bold " + headingClass}>
            {copy("检索知识专题", "Explore search guides")}
          </h3>
          <p className={"mt-2 max-w-3xl " + bodyClass}>
            {copy(
              "从具体问题出发，了解学术文献检索、布尔逻辑和关键词扩展。每篇专题都提供方法说明、示例和使用边界。",
              "Practical guides to academic literature search, Boolean logic and keyword expansion, with examples and clear limitations."
            )}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Academic Literature Search",
              subtitle: copy("学术文献检索工作流", "From research question to a reproducible strategy"),
              description: copy("学习如何拆分研究问题、建立概念组、选择数据库并迭代检索。", "Build a reviewable search workflow from a research question."),
              href: "https://horacech.github.io/Information-Retrieval-Tool/guides/academic-literature-search/",
            },
            {
              title: "Boolean Search",
              subtitle: copy("布尔检索式构建", "AND · OR · NOT · Parentheses"),
              description: copy("理解布尔算符、括号、短语检索、截词和字段限定。", "Understand Boolean operators and database-dependent query syntax."),
              href: "https://horacech.github.io/Information-Retrieval-Tool/guides/boolean-search/",
            },
            {
              title: "Keyword Expansion",
              subtitle: copy("关键词与同义词扩展", "Synonyms · Variants · Terminology"),
              description: copy("建立中英文关键词、缩写、词形变体与专业术语集合。", "Expand concepts into useful, reviewable search terms."),
              href: "https://horacech.github.io/Information-Retrieval-Tool/guides/keyword-expansion/",
            },
          ].map((guide) => (
            <article key={guide.title} className={cardClass}>
              <div className="mb-3 inline-flex rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-cyan-400">
                <BookOpen size={18} />
              </div>
              <h4 className={"mb-1 font-bold " + headingClass}>{guide.title}</h4>
              <p className="mb-2 text-xs font-semibold text-cyan-400">{guide.subtitle}</p>
              <p className={bodyClass}>{guide.description}</p>
              <a href={guide.href} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300">
                {copy("阅读专题", "Read guide")} <ArrowRight size={13} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={cardClass}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">How it works</p>
          <h3 className={"mb-5 mt-1 text-xl font-bold " + headingClass}>{copy("四步完成一次检索", "A four-step workflow")}</h3>
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 font-mono text-xs font-bold text-cyan-400">
                  0{index + 1}
                </span>
                <span className={"pt-0.5 text-sm font-medium " + headingClass}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div id="database-coverage" className={cardClass}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Database coverage</p>
          <h3 className={"mb-4 mt-1 text-xl font-bold " + headingClass}>{copy("内置适配目标", "Built-in database targets")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {databaseGroups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-2 text-xs font-bold text-slate-300 [.theme-light_&]:text-slate-700">{group.title}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-slate-50 [.theme-light_&]:text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-5 text-slate-500">
            {copy(
              "语法适配基于项目内置规则与提示。不同数据库的功能、字段和语法可能变化，正式检索前请核对平台官方帮助。",
              "Syntax guidance is based on built-in rules. Database syntax and field support can change; verify queries against each platform's official documentation."
            )}
          </p>
        </div>
      </section>

      <section id="model-access" className="grid gap-3 lg:grid-cols-2">
        <div className={cardClass}>
          <div className="mb-3 flex items-center gap-2 text-cyan-400">
            <KeyRound size={18} />
            <h3 className={"font-bold " + headingClass}>{copy("模型接入方式", "Model access")}</h3>
          </div>
          <p className={bodyClass}>
            {copy(
              "项目采用 BYOK（Bring Your Own Key）方式。首次使用时，在设置中选择模型服务商，填写自己的 API Key，测试连接后即可使用。支持 Gemini、DeepSeek、SiliconFlow、Kimi、智谱 GLM、通义千问、OpenAI、OpenRouter 及自定义兼容接口。",
              "The app uses a Bring Your Own Key model. Choose a provider in Settings, enter your API key and test the connection. Supported presets include Gemini, DeepSeek, SiliconFlow, Kimi, Zhipu GLM, Qwen, OpenAI and OpenRouter, plus compatible custom endpoints."
            )}
          </p>
          <p className="mt-3 text-xs leading-6 text-amber-300/90 [.theme-light_&]:text-amber-700">
            {copy(
              "语音转文字功能使用 Gemini，需要单独配置可用的 Gemini API Key。",
              "Voice transcription uses Gemini and requires a valid Gemini API key."
            )}
          </p>
        </div>

        <div id="privacy-and-security" className={cardClass}>
          <div className="mb-3 flex items-center gap-2 text-emerald-400">
            <ShieldCheck size={18} />
            <h3 className={"font-bold " + headingClass}>{copy("隐私与数据说明", "Privacy and data flow")}</h3>
          </div>
          <p className={bodyClass}>
            {copy(
              "当前版本是静态前端应用，不提供自建模型代理服务。API Key 与部分偏好设置保存在当前浏览器的 localStorage 中；这不是加密保险库。检索意图、语音内容和 API 请求会发送给你选择的模型服务商，并受其数据政策约束。",
              "This version is a static client-side app with no self-hosted model proxy. API keys and some preferences are stored in this browser's localStorage, which is not an encrypted vault. Search prompts, audio and API requests are sent to the provider you select and are subject to that provider's data policies."
            )}
          </p>
          <p className="mt-3 text-xs leading-6 text-emerald-300/90 [.theme-light_&]:text-emerald-700">
            {copy(
              "请勿在公共设备保存密钥，也不要输入不适合发送给模型服务商的敏感资料。",
              "Do not save keys on shared devices or submit sensitive material that should not be sent to a model provider."
            )}
          </p>
        </div>
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Project resources</p>
            <h3 className={"mt-1 text-xl font-bold " + headingClass}>{copy("项目文档与资源", "Documentation and resources")}</h3>
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
          >
            {copy("打开 GitHub 仓库", "Open GitHub repository")}
            <ExternalLink size={13} />
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <a
                key={resource.title}
                href={resource.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-slate-50"
              >
                <div className="mb-3 flex items-center justify-between text-cyan-400">
                  <Icon size={18} />
                  <ExternalLink size={13} className="opacity-50 transition group-hover:opacity-100" />
                </div>
                <h4 className={"mb-1 text-sm font-bold " + headingClass}>{resource.title}</h4>
                <p className="text-xs leading-5 text-slate-400 [.theme-light_&]:text-slate-600">{resource.description}</p>
              </a>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-2 border-t border-white/10 py-4 text-center text-[11px] leading-5 text-slate-500 [.theme-light_&]:border-slate-200">
        <p>
          {copy(
            "AI 检索力用于辅助构建检索策略，不代替研究者判断，也不直接提供数据库检索结果或全文。",
            "AI Retrieval Tool assists with search-strategy construction; it does not replace researcher judgment or provide database results or full text."
          )}
        </p>
        <p>
          <a href={SITE_URL} className="hover:text-cyan-400">Live App</a>
          {" · "}
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-cyan-400">Open Source</a>
          {" · "}
          <a href={REPO_URL + "/blob/main/LICENSE"} target="_blank" rel="noreferrer" className="hover:text-cyan-400">GPL-3.0</a>
        </p>
      </div>
    </main>
  );
}
