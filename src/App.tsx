/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Copy, 
  Check, 
  RotateCcw, 
  Database, 
  Lightbulb,
  Sparkles,
  Info,
  BookOpen,
  Settings,
  Languages,
  X,
  History,
  Clock,
  ChevronDown,
  Globe,
  Settings2,
  Server,
  BarChart2,
  Key,
  ExternalLink,
  Download,
  WifiOff,
  Star,
  Sun,
  Moon,
  Layers,
  Maximize2,
  Minimize2,
  WrapText,
  AlignLeft,
  TrendingUp,
  GitCommit,
  ShieldAlert,
  CheckCircle2,
  Wrench,
  Cpu,
  Zap
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { generateSearchQuery, SearchQueryResponse, ProviderConfig, testConnection } from "./services/gemini";
import { SearchTemplate, SearchTemplateConstraint, RefinementTrajectoryItem } from "./types";
import { DEFAULT_SEARCH_TEMPLATES } from "./data/searchTemplates";
import { TemplateLibrary } from "./components/TemplateLibrary";
import OptimizationTrajectoryViewer from "./components/OptimizationTrajectoryViewer";
import OfficialWhitelist, { DEFAULT_LINKS, LinkItem, DEFAULT_CATEGORIES, extractKeywords, scoreLink } from "./components/OfficialWhitelist";
import OfflineDownloader from "./components/OfflineDownloader";
import FeedbackAnalytics, { UserFeedback } from "./components/FeedbackAnalytics";
import VisualQueryTree from "./components/VisualQueryTree";
import HighlightedBooleanQuery from "./components/HighlightedBooleanQuery";
import SyntaxValidationAlert from "./components/SyntaxValidationAlert";
import { validateBooleanQuery } from "./utils/booleanSyntaxValidator";
import { AudioTranscriber } from "./components/AudioTranscriber";
import { ComparisonKeywordChart } from "./components/ComparisonKeywordChart";
import { PerformanceMetricsPanel } from "./components/PerformanceMetricsPanel";
import ProjectOverview from "./components/ProjectOverview";

const UI_STRINGS = {
  mix: {
    appTitle: "AI_RETRIEVAL_X",
    appSubtitle: "Intelligence Query Framework",
    engineStatus: "Engine Status",
    operational: "Operational",
    inputLabel: "User Query Intent",
    inputPlaceholder: "请详细描述您的检索需求（支持多行批量输入并行生成）\nDescribe your search intent in detail (supports multi-line batch generation)...",
    reset: "重置",
    generate: "GENERATE_QUERY",
    waitingInput: "Waiting for input...",
    formulaTitle: "Search Formula",
    processedWith: "PROCESSED_WITH_GEMINI_AI // CONFIDENCE: HIGH",
    copyCode: "COPY_TO_CLIPBOARD",
    copied: "COPIED",
    semanticMap: "Semantic Map",
    topicExpansion: "Topic Expansion Engine",
    coreKeyword: "CORE_KEYWORD",
    insightTitle: "Logic Insight",
    insightDesc: "分析用户的检索语境，提取其中的学术主轴，并利用大规模语义语言模型针对性地补充相关领域的高频同义词与术语，以极大地提升检索覆盖面。",
    recallBoost: "RECALL_BOOST: GAIN_ENHANCED",
    sysOpt: "SYSTEM_RESOURCES_OPTIMIZED",
    processing: "PROCESSING...",
    genComplete: "GEN_COMPLETE",
    waitInit: "WAIT_INIT",
    settings: "SETTINGS",
    historyTitle: "检索历史 History",
    noHistory: "No history found / 暂无记录",
    clearHistory: "CLEAR / 清空",
    confirmClearHistory: "Are you sure you want to clear all history? / 确定要清空所有历史记录吗？",
    historyButton: "HISTORY",
    configTitle: "系统配置 Configuration",
    providerLabel: "模型提供商 Provider",
    addProvider: "+ 新增 Custom Provider",
    providerName: "提供商名称 Provider Name",
    authTypeLabel: "鉴权方式 Auth Type",
    customHeaderLabel: "Header 名称 (可选)",
    deleteProvider: "DELETE / 删除",
    modelsListLabel: "支持的模型 (逗号分隔)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "输入您的 API Key (为空使用默认)",
    modelLabel: "底层模型 Model",
    baseUrlLabel: "Base URL (可选)",
    baseUrlPlaceholder: "自定义 API 端点，如: https://api.deepseek.com",
    testConnectionBtn: "TEST CONNECTION / 测试连接",
    testSuccess: "Connection Successful / 连接成功",
    testFailed: "Connection Failed / 连接失败",
    testing: "Testing... / 测试中...",
    saveConfig: "SAVE / 保存",
    closeConfig: "CLOSE / 关闭",
    dbTypesLabel: "DB Source",
    langPrefLabel: "Lang Pref",
    statsTitle: "Usage Statistics / 使用统计",
    statsButton: "STATS",
    statsQueries: "Queries / 查询量",
    statsSuccess: "Success Rate / 成功率",
    statsTokens: "Tokens Used / 消耗Token",
    statsNoData: "No usage data available / 暂无使用数据",
    directSearch: "DIRECT_SEARCH / 一键检索",
    operatorStyleLabel: "Operator Style / 算符风格",
    operatorStyleStandard: "Standard / 标准 OR 词 (A OR B)",
    operatorStyleSpace: "Space / 空格代替 OR (A B)"
  },
  zh: {
    appTitle: "AI 检索力",
    appSubtitle: "智慧检索式生成专家",
    engineStatus: "引擎状态",
    operational: "运行中",
    inputLabel: "用户检索意图",
    inputPlaceholder: "请详细描述您的检索需求（支持多行输入进行并行批量生成），例如：\n区块链在金融领域的应用\n人工智能在医疗领域的应用...",
    reset: "重置",
    generate: "生成检索式",
    waitingInput: "等待输入...",
    formulaTitle: "检索公式",
    processedWith: "大模型处理完毕 // 高置信度",
    copyCode: "复制结果",
    copied: "已复制",
    semanticMap: "语义映射网",
    topicExpansion: "主题扩展引擎",
    coreKeyword: "核心关键词",
    insightTitle: "逻辑洞察",
    insightDesc: "分析用户的检索语境，提取其中的学术主轴，并利用大规模语义语言模型针对性地补充相关领域的高频同义词与术语，以极大地提升检索覆盖面。",
    recallBoost: "召回率显著增强",
    sysOpt: "系统资源已优化",
    processing: "处理中...",
    genComplete: "生成完成",
    waitInit: "等待初始化",
    settings: "设置",
    historyTitle: "检索历史",
    noHistory: "暂无记录",
    clearHistory: "清空",
    confirmClearHistory: "确定要清空所有历史记录吗？",
    historyButton: "历史",
    configTitle: "系统配置",
    providerLabel: "模型提供商",
    addProvider: "+ 新增自定义提供商",
    providerName: "提供商名称",
    authTypeLabel: "鉴权方式",
    customHeaderLabel: "自定义 Header (可选)",
    deleteProvider: "删除提供商",
    modelsListLabel: "支持的模型 (用逗号分隔)",
    apiKeyLabel: "API 密钥",
    apiKeyPlaceholder: "输入您的 API 密钥 (为空使用默认)",
    modelLabel: "底层大模型",
    baseUrlLabel: "基础 URL (可选)",
    baseUrlPlaceholder: "例如: https://api.deepseek.com",
    testConnectionBtn: "测试连接",
    testSuccess: "连接成功",
    testFailed: "连接失败",
    testing: "测试中...",
    saveConfig: "保存",
    closeConfig: "关闭",
    dbTypesLabel: "目标数据库",
    langPrefLabel: "语种偏好",
    statsTitle: "使用统计",
    statsButton: "统计",
    statsQueries: "查询次数",
    statsSuccess: "成功率",
    statsTokens: "Token 消耗",
    statsNoData: "暂无使用数据",
    directSearch: "一键检索",
    operatorStyleLabel: "检索逻辑算符风格",
    operatorStyleStandard: "标准 OR 词连接 (e.g. A OR B)",
    operatorStyleSpace: "空格代替 OR 连接 (e.g. A B)"
  },
  en: {
    appTitle: "AI_RETRIEVAL_X",
    appSubtitle: "Intelligence Query Framework",
    engineStatus: "Engine Status",
    operational: "Operational",
    inputLabel: "User Query Intent",
    inputPlaceholder: "Describe your search intent in detail (supports multi-line batch generation), e.g.,\ndurability testing standards for flexible screens in extreme cold\nblockchain risk management in supply chain finance...",
    reset: "Reset",
    generate: "GENERATE QUERY",
    waitingInput: "Waiting for input...",
    formulaTitle: "Search Formula",
    processedWith: "PROCESSED BY AI // CONFIDENCE: HIGH",
    copyCode: "COPY TO CLIPBOARD",
    copied: "COPIED",
    semanticMap: "Semantic Map",
    topicExpansion: "Topic Expansion Engine",
    coreKeyword: "CORE KEYWORD",
    insightTitle: "Logic Insight",
    insightDesc: "Analyzes user context, extracts academic pivot points, and supplements high-frequency synonyms via LLMs to enhance recall.",
    recallBoost: "RECALL GAIN: ENHANCED",
    sysOpt: "SYSTEM OPTIMIZED",
    processing: "PROCESSING...",
    genComplete: "COMPLETE",
    waitInit: "IDLE",
    settings: "SETTINGS",
    historyTitle: "Search History",
    noHistory: "No history found",
    clearHistory: "Clear",
    confirmClearHistory: "Are you sure you want to clear all history?",
    historyButton: "HISTORY",
    configTitle: "Configuration",
    providerLabel: "Model Provider",
    addProvider: "+ Add Custom Provider",
    providerName: "Provider Name",
    authTypeLabel: "Auth Type",
    customHeaderLabel: "Header Name (Optional)",
    deleteProvider: "Delete Provider",
    modelsListLabel: "Supported Models (Comma separated)",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "Enter your API Key (leave empty for default)",
    modelLabel: "Underlying Model",
    baseUrlLabel: "Base URL (Optional)",
    baseUrlPlaceholder: "e.g., https://api.deepseek.com",
    testConnectionBtn: "TEST CONNECTION",
    testSuccess: "Connection Successful",
    testFailed: "Connection Failed",
    testing: "Testing...",
    saveConfig: "Save",
    closeConfig: "Close",
    dbTypesLabel: "DB Source",
    langPrefLabel: "Lang Pref",
    statsTitle: "Usage Statistics",
    statsButton: "STATS",
    statsQueries: "Queries",
    statsSuccess: "Success Rate",
    statsTokens: "Tokens Used",
    statsNoData: "No usage data available",
    directSearch: "DIRECT SEARCH",
    operatorStyleLabel: "Search Logic Operator Style",
    operatorStyleStandard: "Standard (e.g. A OR B)",
    operatorStyleSpace: "Space as OR (e.g. A B)"
  }
};

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    isGemini: true,
    endpoint: "default",
    authType: 'Bearer',
    apiKey: "",
    models: "gemini-3.5-flash,gemini-3.1-pro-preview,gemini-3-flash-preview,gemini-3.1-flash-lite,gemini-pro-latest,gemini-flash-latest,gemini-flash-lite-latest"
  },
  {
    id: "deepseek",
    name: "DeepSeek 官方",
    isGemini: false,
    endpoint: "https://api.deepseek.com",
    authType: 'Bearer',
    apiKey: "",
    models: "deepseek-chat,deepseek-reasoner,deepseek-v4-flash,deepseek-v4-pro"
  },
  {
    id: "siliconflow",
    name: "硅基流动 (SiliconFlow)",
    isGemini: false,
    endpoint: "https://api.siliconflow.cn/v1",
    authType: 'Bearer',
    apiKey: "",
    models: "deepseek-ai/DeepSeek-V3,deepseek-ai/DeepSeek-R1,Qwen/Qwen2.5-72B-Instruct,THUDM/glm-4-9b-chat"
  },
  {
    id: "moonshot",
    name: "月之暗面 (Kimi / Moonshot)",
    isGemini: false,
    endpoint: "https://api.moonshot.cn/v1",
    authType: 'Bearer',
    apiKey: "",
    models: "moonshot-v1-8k,moonshot-v1-32k,moonshot-v1-128k"
  },
  {
    id: "zhipu",
    name: "智谱清言 (Zhipu GLM)",
    isGemini: false,
    endpoint: "https://open.bigmodel.cn/api/paas/v4",
    authType: 'Bearer',
    apiKey: "",
    models: "glm-4-flash,glm-4-plus,glm-4,glm-4-long"
  },
  {
    id: "dashscope",
    name: "通义千问 (DashScope / Qwen)",
    isGemini: false,
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    authType: 'Bearer',
    apiKey: "",
    models: "qwen-max,qwen-plus,qwen-turbo,qwen-coder-plus"
  },
  {
    id: "openai",
    name: "OpenAI 官方",
    isGemini: false,
    endpoint: "https://api.openai.com/v1",
    authType: 'Bearer',
    apiKey: "",
    models: "gpt-4o,gpt-4o-mini,o1,o3-mini"
  },
  {
    id: "openrouter",
    name: "OpenRouter 聚合平台",
    isGemini: false,
    endpoint: "https://openrouter.ai/api/v1",
    authType: 'Bearer',
    apiKey: "",
    models: "anthropic/claude-3.5-sonnet,google/gemini-2.5-pro,meta-llama/llama-3.3-70b-instruct,deepseek/deepseek-r1"
  }
];

const DB_TYPES = [
  "自动智能匹配 (Auto Match Engine)",
  "CNKI 知网 (中文学术)",
  "万方数据 (中文学术)",
  "维普资讯 (中文学术)",
  "Web of Science核心合集 (SCI-E/SSCI/CPCI-S)",
  "Ei Compendex (工程文摘)",
  "Scopus (综合文摘)",
  "ScienceDirect (Elsevier)",
  "Springer Nature Link",
  "EBSCO (ASP/BSP)",
  "PQDT (博硕士论文)",
  "IEEE Xplore",
  "CNIPA (中国专利)",
  "壹专利 (中文专利)",
  "Espacenet / USPTO (外文专利)",
  "国家标准全文公开系统",
  "百度学术 / PubScholar",
  "通用搜索引擎 (Baidu/Bing)"
];

interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  dbType: string;
  langPref: string;
  result: SearchQueryResponse;
}

export interface ModelUsageStats {
  queries: number;
  successes: number;
  failures: number;
  totalTokens: number;
}

export type UsageStatsRegistry = Record<string, Record<string, ModelUsageStats>>; // providerId -> model -> stats

// Custom local query Cache for instant local performance
const getLocalCache = (line: string, dbType: string, langPref: string, model: string, providerId: string, operatorStyle: string, templateId?: string | null) => {
  try {
    const cacheStr = localStorage.getItem("ai_retrieval_v2_cache");
    if (!cacheStr) return null;
    const cache = JSON.parse(cacheStr);
    const tplKey = templateId || "default";
    const key = `${providerId}_${model}_${dbType}_${langPref}_${operatorStyle}_${tplKey}_${line.trim()}`;
    const item = cache[key];
    if (item && Date.now() - item.timestamp < 3600000 * 24) { // Valid for 24 hours
      return item.result;
    }
  } catch (e) {}
  return null;
};

const setLocalCache = (line: string, dbType: string, langPref: string, model: string, providerId: string, operatorStyle: string, templateId: string | null | undefined, result: any) => {
  try {
    const cacheStr = localStorage.getItem("ai_retrieval_v2_cache") || "{}";
    const cache = JSON.parse(cacheStr);
    const tplKey = templateId || "default";
    const key = `${providerId}_${model}_${dbType}_${langPref}_${operatorStyle}_${tplKey}_${line.trim()}`;
    cache[key] = {
      timestamp: Date.now(),
      result
    };
    const keys = Object.keys(cache);
    if (keys.length > 200) { // Max 200 entries to maintain normal local storage size
      delete cache[keys[0]];
    }
    localStorage.setItem("ai_retrieval_v2_cache", JSON.stringify(cache));
  } catch (e) {}
};

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('ai_retrieval_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });

  useEffect(() => {
    try {
      if (theme === 'light') {
        document.documentElement.classList.add('theme-light');
        document.documentElement.classList.remove('theme-dark');
      } else {
        document.documentElement.classList.remove('theme-light');
        document.documentElement.classList.add('theme-dark');
      }
      localStorage.setItem('ai_retrieval_theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<'ai' | 'whitelist' | 'about'>(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    return requestedTab === 'about' ? 'about' : requestedTab === 'whitelist' ? 'whitelist' : 'ai';
  });
  useEffect(() => {
    if (activeTab !== 'about') return;
    const anchorId = decodeURIComponent(window.location.hash.slice(1));
    if (!['keyword-index', 'privacy-and-security'].includes(anchorId)) return;
    requestAnimationFrame(() => document.getElementById(anchorId)?.scrollIntoView({ block: 'start' }));
  }, [activeTab]);
  const [showInstallerModal, setShowInstallerModal] = useState(false);
  const [dbType, setDbType] = useState(DB_TYPES[0]);
  const [operatorStyle, setOperatorStyle] = useState<"OR" | "Space">("OR");
  const [langPref, setLangPref] = useState("双语混合 (Bilingual)");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(SearchQueryResponse & { 
    _inputLine: string; 
    _isLoading?: boolean; 
    _isError?: boolean;
    _fromCache?: boolean;
    _compareResult?: SearchQueryResponse & { 
      _isLoading?: boolean; 
      _isError?: boolean;
      _fromCache?: boolean;
      modelName?: string; 
      providerId?: string; 
    };
  })[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const result = results[activeIndex] || null;

  // Custom keyword selectors and reconstructed query states
  const [semanticActiveModel, setSemanticActiveModel] = useState<'A' | 'B'>('A');
  const [selectedWords, setSelectedWords] = useState<Record<string, boolean>>({});

  const isWordSelected = (isModelB: boolean, groupIdx: number, word: string) => {
    const key = `${activeIndex}:${isModelB ? 'B' : 'A'}:${groupIdx}:${word}`;
    return selectedWords[key] !== false;
  };

  const toggleWordSelection = (isModelB: boolean, groupIdx: number, word: string) => {
    const key = `${activeIndex}:${isModelB ? 'B' : 'A'}:${groupIdx}:${word}`;
    setSelectedWords(prev => ({
      ...prev,
      [key]: !isWordSelected(isModelB, groupIdx, word)
    }));
  };

  const isGroupSelected = (isModelB: boolean, groupIdx: number, group: any) => {
    if (!group) return false;
    const allTerms = Array.from(new Set([
      group.original,
      ...(Array.isArray(group.zhSynonyms) ? group.zhSynonyms : []),
      ...(Array.isArray(group.enSynonyms) ? group.enSynonyms : [])
    ])).filter(Boolean) as string[];

    return allTerms.some(term => isWordSelected(isModelB, groupIdx, term));
  };

  const toggleGroupSelection = (isModelB: boolean, groupIdx: number, group: any) => {
    if (!group) return;
    const allTerms = Array.from(new Set([
      group.original,
      ...(Array.isArray(group.zhSynonyms) ? group.zhSynonyms : []),
      ...(Array.isArray(group.enSynonyms) ? group.enSynonyms : [])
    ])).filter(Boolean) as string[];

    const anyActive = allTerms.some(term => isWordSelected(isModelB, groupIdx, term));
    
    setSelectedWords(prev => {
      const next = { ...prev };
      allTerms.forEach(term => {
        const key = `${activeIndex}:${isModelB ? 'B' : 'A'}:${groupIdx}:${term}`;
        next[key] = !anyActive;
      });
      return next;
    });
  };

  const getEffectiveQueries = (mResp: any, isModelB: boolean) => {
    if (!mResp || !Array.isArray(mResp.keywords) || mResp._isError) {
      return {
        booleanQuery: mResp?.booleanQuery || "",
        fieldSpecificQuery: mResp?.fieldSpecificQuery || "",
        isCustomized: false
      };
    }

    let isCustomized = false;
    const groupsSelectedWords: string[][] = [];

    mResp.keywords.forEach((group: any, groupIdx: number) => {
      const allTerms = Array.from(new Set([
        group.original,
        ...(Array.isArray(group.zhSynonyms) ? group.zhSynonyms : []),
        ...(Array.isArray(group.enSynonyms) ? group.enSynonyms : [])
      ])).filter(Boolean) as string[];

      const activeTerms: string[] = [];
      allTerms.forEach((term) => {
        const selected = isWordSelected(isModelB, groupIdx, term);
        if (selected) {
          activeTerms.push(term);
        } else {
          isCustomized = true;
        }
      });
      groupsSelectedWords.push(activeTerms);
    });

    if (!isCustomized) {
      return {
        booleanQuery: mResp.booleanQuery,
        fieldSpecificQuery: mResp.fieldSpecificQuery,
        isCustomized: false
      };
    }

    // Reconstruct booleanQuery
    const isSpace = operatorStyle === "Space";
    const booleanParts = groupsSelectedWords
      .filter(terms => terms.length > 0)
      .map(terms => {
        if (terms.length === 1) return terms[0];
        if (isSpace) {
          return `(${terms.join(" ")})`;
        } else {
          return `(${terms.join(" OR ")})`;
        }
      });

    const reconstructedBoolean = booleanParts.join(isSpace ? " " : " AND ");

    // Reconstruct fieldSpecificQuery
    let reconstructedFieldSpecific = "";
    if (Array.isArray(mResp.schemaMapping) && mResp.schemaMapping.length > 0) {
      const isCnki = dbType.includes("CNKI");
      const isWanfang = dbType.includes("万方");
      const isVip = dbType.includes("维普");
      const isChineseDb = isCnki || isWanfang || isVip;

      const mappingParts = mResp.schemaMapping.map((map: any) => {
        const groupIdx = mResp.keywords.findIndex((g: any) => g.original === map.mappedConcept);
        if (groupIdx === -1) return null;

        const terms = groupsSelectedWords[groupIdx];
        if (!terms || terms.length === 0) return null;

        if (isCnki) {
          const inner = terms.map(t => `'${t}'`).join(" + ");
          return terms.length === 1 ? `${map.field} = ${inner}` : `${map.field} = (${inner})`;
        } else if (isChineseDb) {
          const inner = terms.join(" OR ");
          return terms.length === 1 ? `${map.field} = ${inner}` : `${map.field} = (${inner})`;
        } else {
          const inner = isSpace ? terms.join(" ") : terms.join(" OR ");
          return terms.length === 1 ? `${map.field}=${inner}` : `${map.field}=(${inner})`;
        }
      }).filter(Boolean);

      if (mappingParts.length > 0) {
        reconstructedFieldSpecific = mappingParts.join(isSpace ? " " : " AND ");
      } else {
        reconstructedFieldSpecific = reconstructedBoolean;
      }
    } else {
      reconstructedFieldSpecific = reconstructedBoolean;
    }

    return {
      booleanQuery: reconstructedBoolean || "无选定词 (No words selected)",
      fieldSpecificQuery: reconstructedFieldSpecific || "无选定词 (No words selected)",
      isCustomized: true
    };
  };

  const handleResetWords = () => {
    setSelectedWords(prev => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${activeIndex}:`)) {
          delete next[key];
        }
      });
      return next;
    });
  };

  const effectiveA = useMemo(() => getEffectiveQueries(result, false), [result, selectedWords, activeIndex, operatorStyle, dbType]);

  const [copied, setCopied] = useState(false);
  const [jumpDbName, setJumpDbName] = useState<string | null>(null);
  const [error, setError] = useState<{ title: string; details: string } | null>(null);
  const [showMapped, setShowMapped] = useState(false);
  const [isQuickWhitelistOpen, setIsQuickWhitelistOpen] = useState(false);
  const [quickSearchKw, setQuickSearchKw] = useState("");
  const [isFormulaExpanded, setIsFormulaExpanded] = useState(false);
  const [isWrapFormula, setIsWrapFormula] = useState(true);
  const [formulaFontSize, setFormulaFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [expandedCardStrategies, setExpandedCardStrategies] = useState<Record<string, boolean>>({});
  const [expandedReasoning, setExpandedReasoning] = useState(false);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);

  // Current active Boolean search query in single-model display
  const activeFormulaQuery = useMemo(() => {
    if (!result) return "";
    return showMapped 
      ? (effectiveA.fieldSpecificQuery || effectiveA.booleanQuery) 
      : effectiveA.booleanQuery;
  }, [result, showMapped, effectiveA]);

  // Real-time syntax validation status
  const syntaxValidation = useMemo(() => {
    if (!result || result._isLoading || !activeFormulaQuery) return null;
    return validateBooleanQuery(activeFormulaQuery, { database: dbType, operatorStyle, isFieldSpecific: showMapped });
  }, [result, activeFormulaQuery]);

  // Handle applying automatic syntax fix for primary query
  const handleApplySyntaxFix = (fixedQuery: string) => {
    if (!result) return;
    setResults(prev => {
      const next = [...prev];
      const cur = next[activeIndex];
      if (cur) {
        next[activeIndex] = {
          ...cur,
          booleanQuery: showMapped ? cur.booleanQuery : fixedQuery,
          fieldSpecificQuery: showMapped ? fixedQuery : cur.fieldSpecificQuery
        };
      }
      return next;
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to inject a syntax error sample to verify real-time alert UI
  const handleInjectSampleSyntaxError = () => {
    if (!result) return;
    setResults(prev => {
      const next = [...prev];
      const cur = next[activeIndex];
      if (cur) {
        const corrupted = `（${cur.booleanQuery.trim()} AND ） AND "未闭合短语`;
        next[activeIndex] = {
          ...cur,
          booleanQuery: corrupted,
          fieldSpecificQuery: corrupted
        };
      }
      return next;
    });
  };

  const [screenHeight, setScreenHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const quickSearchKeywords = useMemo(() => {
    const kwTrimmed = quickSearchKw.trim().toLowerCase();
    if (!kwTrimmed) return [];
    return extractKeywords(kwTrimmed);
  }, [quickSearchKw]);

  const quickSearchFilteredLinks = useMemo(() => {
    const kwTrimmed = quickSearchKw.trim();
    if (!kwTrimmed) return DEFAULT_LINKS;
    
    const kws = quickSearchKeywords;
    if (kws.length === 0) {
      return DEFAULT_LINKS.filter(l => 
        l.name.toLowerCase().includes(kwTrimmed.toLowerCase()) ||
        l.url.toLowerCase().includes(kwTrimmed.toLowerCase())
      );
    }
    
    return DEFAULT_LINKS
      .map(link => ({ link, score: scoreLink(link, kws) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.link);
  }, [quickSearchKw, quickSearchKeywords]);

  const { t, i18n } = useTranslation();
  const uiLang = i18n.language;
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'api' | 'templates' | 'trajectories'>('api');

  // AI Optimization Trajectories state
  const [trajectories, setTrajectories] = useState<RefinementTrajectoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("retrieval_ai_trajectories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const saveTrajectoriesLocally = (items: RefinementTrajectoryItem[]) => {
    setTrajectories(items);
    try {
      localStorage.setItem("retrieval_ai_trajectories", JSON.stringify(items.slice(0, 50)));
    } catch (e) {
      console.warn("Failed to persist trajectories", e);
    }
  };

  const handleLoadSampleTrajectory = () => {
    const sample: RefinementTrajectoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now() - 3600000,
      inputLine: "大语言模型在多模态医疗影像诊断中的应用与评估",
      dbType: "Web of Science (WOS)",
      langPref: "双语混合 (Bilingual)",
      modelName: activeModel || "gemini-2.5-flash",
      providerId: activeProviderId || "google-gemini",
      templateName: "主题 + 限制 + 字段",
      rating: 2,
      feedbackTags: ["漏掉同义词", "算符优先级混乱", "限定字段过宽"],
      feedbackWritten: "初始检索式漏掉了视觉语言模型(VLM)与多模态大模型(MLLM)的高频专业缩写，未限定TS主题字段，导致查全率与查准率受限。",
      before: {
        booleanQuery: "大语言模型 AND 医疗影像 AND 诊断 AND 评估",
        explanation: "基于初步自然语言需求提取核心主题词，但缺乏领域缩写与学术库专属字段标识。"
      },
      after: {
        booleanQuery: 'TS=(("large language model*" OR "LLM" OR "multimodal LLM" OR "MLLM" OR "vision-language model*" OR "VLM" OR "多模态大模型" OR "大语言模型") AND ("medical imag*" OR "radiolog*" OR "CT" OR "MRI" OR "ultrasound" OR "医疗影像" OR "医学图像") AND ("diagnos*" OR "detection" OR "segmentation" OR "诊断" OR "检测") AND ("evaluat*" OR "benchmark*" OR "validation" OR "评估" OR "基准评测"))',
        explanation: "扩展了多模态大模型的专用同义词与缩写簇（MLLM, VLM），补全放射影像细分术语（CT, MRI, ultrasound, radiolog*），并使用 WOS 规范的主题字段标签 TS= 进行四维嵌套布尔组配，极大提升了学术查全率与查准率。",
        reasoning: "【AI 双向重构路径】\n1. 词表扩展：补齐多模态前沿文献中高频出现的 'VLM'、'MLLM'、'vision-language model*'；\n2. 算符嵌套：将宽泛的单层 AND 拆分为四个独立的同义词 OR 集合，并以外层 AND 交叉约束；\n3. 字段适配：注入 WOS 主题检索 TS=() 规范语法，防止检索范围溢出到作者或出版物名称。"
      }
    };
    saveTrajectoriesLocally([sample, ...trajectories]);
  };

  const handleApplyTrajectory = (item: RefinementTrajectoryItem) => {
    setInput(item.inputLine);
    setDbType(item.dbType);
    setLangPref(item.langPref);
    setResults([{
      keywords: item.after.keywords || [],
      booleanQuery: item.after.booleanQuery,
      fieldSpecificQuery: item.after.fieldSpecificQuery || item.after.booleanQuery,
      schemaMapping: [],
      explanation: item.after.explanation || '',
      _reasoning: item.after.reasoning,
      _inputLine: item.inputLine,
      _appliedTemplate: item.templateName
    }]);
    setActiveIndex(0);
    setIsConfigOpen(false);
    setFeedbackNotice(uiLang === 'zh' || i18n.language === 'mix' ? "✓ 已成功将优化轨迹中的检索式应用至工作区！" : "✓ Applied trajectory query to workspace!");
  };

  // Search Formula Template Library state
  const [templates, setTemplates] = useState<SearchTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("ai_retrieval_templates");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_SEARCH_TEMPLATES;
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem("ai_retrieval_active_template_id");
      if (saved !== null) {
        return saved === "" || saved === "none" ? null : saved;
      }
    } catch (e) {}
    return "preset-topic-constraint-field";
  });

  const handleSaveTemplates = (newTemplates: SearchTemplate[]) => {
    setTemplates(newTemplates);
    try {
      localStorage.setItem("ai_retrieval_templates", JSON.stringify(newTemplates));
    } catch (e) {}
  };

  const handleSelectTemplate = (templateId: string | null) => {
    setActiveTemplateId(templateId);
    try {
      localStorage.setItem("ai_retrieval_active_template_id", templateId || "none");
    } catch (e) {}
  };

  const activeTemplate = useMemo(() => {
    if (!activeTemplateId) return null;
    return templates.find(t => t.id === activeTemplateId) || null;
  }, [templates, activeTemplateId]);

  const activeTemplateConstraint = useMemo((): SearchTemplateConstraint | null => {
    if (!activeTemplate) return null;
    return {
      id: activeTemplate.id,
      name: activeTemplate.name,
      framework: activeTemplate.framework,
      constraintPrompt: activeTemplate.constraintPrompt
    };
  }, [activeTemplate]);

  const [tourStep, setTourStep] = useState<number | null>(null);
  const [tourBounds, setTourBounds] = useState<{ top: number; left: number; width: number; height: number; } | null>(null);

  const TOUR_DEMO_RESULT: SearchQueryResponse = {
    booleanQuery: '("Diabetic Retinopathy" OR "糖尿病视网膜病变" OR "糖网") AND ("Artificial Intelligence" OR "人工智能" OR "Deep Learning" OR "深度学习") AND ("Screening" OR "筛查" OR "Diagnosis" OR "诊断")',
    fieldSpecificQuery: 'SU = ("Diabetic Retinopathy" + "糖尿病视网膜病变" + "糖网") AND SU = ("Artificial Intelligence" + "人工智能" + "Deep Learning" + "深度学习") AND SU = ("Screening" + "筛查" + "Diagnosis" + "诊断")',
    keywords: [
      {
        original: "Diabetic Retinopathy",
        zhSynonyms: ["糖尿病视网膜病变", "糖网", "糖尿病眼病"],
        enSynonyms: ["Diabetic Retinopathy", "DR", "Diabetic Eye Disease"]
      },
      {
        original: "Artificial Intelligence",
        zhSynonyms: ["人工智能", "机器学习", "深度学习", "卷积神经网络"],
        enSynonyms: ["Artificial Intelligence", "AI", "Machine Learning", "Deep Learning", "CNN"]
      },
      {
        original: "Screening",
        zhSynonyms: ["筛查", "早期诊断", "影像检测"],
        enSynonyms: ["Screening", "Early Detection", "Diagnosis", "Image Analysis"]
      }
    ],
    schemaMapping: [
      {
        field: "Title/Abstract",
        mappedConcept: "Diabetic Retinopathy",
        reason: "Core medical condition to filter literature strictly based on patient cohort."
      },
      {
        field: "Keywords",
        mappedConcept: "Artificial Intelligence",
        reason: "Core methodological approach detailing the tech stack utilized in screening."
      },
      {
        field: "Subject/Title",
        mappedConcept: "Screening",
        reason: "Clinical objective describing the actual application environment."
      }
    ],
    explanation: "This query incorporates essential medical vocabularies (Diabetic Retinopathy, DR) combined with technical methodologies (AI, Deep Learning) and clinical tasks (Screening) ensuring high recall and precision on both PubMed and CNKI standards.",
    suggestedUrls: [
      { name: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/" },
      { name: "CNKI 知网学术", url: "https://kns.cnki.net/kns8s/" }
    ],
    _usage: {
      promptTokens: 412,
      completionTokens: 320,
      totalTokens: 732
    },
    _reasoning: "First-stage clinical classification linked with high-level computing methodologies."
  };

  const startTour = () => {
    setIsQuickWhitelistOpen(false);
    setIsConfigOpen(false);
    setIsHistoryOpen(false);
    setActiveTab('ai');
    
    setTimeout(() => {
      setResults([TOUR_DEMO_RESULT]);
      setActiveIndex(0);
      setTourStep(0);
    }, 100);
  };

  const exitTour = () => {
    setTourStep(null);
    localStorage.setItem("visited-guided-search-v1.0", "true");
  };

  useEffect(() => {
    if (tourStep === null) {
      setTourBounds(null);
      return;
    }

    const STEPS_TARGETS = [
      "guided-input-panel",
      "guided-config-panel",
      "guided-output-panel",
      "guided-refinement-panel",
      "guided-feedback-panel"
    ];

    const targetId = STEPS_TARGETS[tourStep];
    const updateBoundsForTour = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        const rect = el.getBoundingClientRect();
        setTourBounds({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      } else {
        setTourBounds(null);
      }
    };

    const scrollTimer = setTimeout(updateBoundsForTour, 250);
    const intervalTimer = setInterval(updateBoundsForTour, 600);
    window.addEventListener('resize', updateBoundsForTour);
    window.addEventListener('scroll', updateBoundsForTour, true);

    return () => {
      clearTimeout(scrollTimer);
      clearInterval(intervalTimer);
      window.removeEventListener('resize', updateBoundsForTour);
      window.removeEventListener('scroll', updateBoundsForTour, true);
    };
  }, [tourStep]);

  useEffect(() => {
    const visited = localStorage.getItem("visited-guided-search-v1.0");
    if (!visited) {
      const initTourTimer = setTimeout(() => {
        startTour();
      }, 1500);
      return () => clearTimeout(initTourTimer);
    }
  }, []);

  const TOUR_STEPS = useMemo(() => [
    {
      targetId: "guided-input-panel",
      title: uiLang === 'zh' || i18n.language === 'mix' ? "第一步：输入学术主题 / 语音口述意图" : "Step 1: Enter Academic Topic / Voice Input",
      desc: uiLang === 'zh' || i18n.language === 'mix'
        ? "在这里直接输入以自然语言描述的学术课题。支持键盘文本输入，也支持点击【语音输入】(基于专用 gemini-3.5-transcribe 语音大模型) 通过麦克风直接口述需求，系统将精准识别并生成最优布尔检索式！"
        : "Type your academic research topic in natural language, or click 'Voice Input' (powered by model gemini-3.5-transcribe) to dictate your search intent via microphone!"
    },
    {
      targetId: "guided-config-panel",
      title: uiLang === 'zh' || i18n.language === 'mix' ? "第二步：选择模型厂商与 API Key 配置指引" : "Step 2: Model Providers & API Key Setup Guide",
      desc: uiLang === 'zh' || i18n.language === 'mix'
        ? "💡 密钥配置指引：点击右下角【⚙️ 设置】按钮，您可以配置属于您的大模型 API Key。已预设支持 Google Gemini、DeepSeek、硅基流动 (SiliconFlow)、月之暗面 (Kimi)、智谱 GLM、通义千问 (DashScope)、OpenAI 及 OpenRouter 等厂商，也可添加自定义 OpenAI 兼容接口！在此开启【对比模式】还可以同时评测两个大模型双端生成效果。"
        : "💡 API Key Setup Guide: Click the [⚙️ Settings] button in the bottom right corner to set up your API Key. Presets include Google Gemini, DeepSeek, SiliconFlow, Kimi Moonshot, Zhipu GLM, Qwen DashScope, OpenAI, OpenRouter, or any OpenAI-compatible custom endpoint! Turn on 'Comparison Mode' to evaluate two models side-by-side."
    },
    {
      targetId: "guided-output-panel",
      title: uiLang === 'zh' || i18n.language === 'mix' ? "第三步：公式自动构建与快捷入站检索" : "Step 3: Built Formula & Direct Whitelist Redirect",
      desc: uiLang === 'zh' || i18n.language === 'mix'
        ? "生成的标准布尔算式高亮展示。点击底部的数据库绿色/蓝色快捷按钮，系统会自动拷贝此公式并直接打开目标官方官网检索入口，您在新页面直接按 Ctrl+V 粘贴即可完成查找！"
        : "High-contrast logic trees and field queries generated live. Click any targeted green/blue database whitelist shortcut buttons: we will copy the compiled string and instantly resolve to their official query page, so a quick Ctrl+V does the work!"
    },
    {
      targetId: "guided-refinement-panel",
      title: uiLang === 'zh' || i18n.language === 'mix' ? "第四步：语义关联词云与动态筛选重构" : "Step 4: Semantic Synonyms & Micro-Refinement",
      desc: uiLang === 'zh' || i18n.language === 'mix'
        ? "右侧查阅 AI 为您检索词多维扩展的中英文同义词列表。您可以【手动点击】任何关联词条来在此检索式中排除或重新包含它，整个布尔检索式随之全自动 0.1秒极速完成动态重构！"
        : "Check dynamic synonym mappings on the right sidebar. Click individual terms or 'Clear All / Select All' to instantly add or remove concepts from your formula on the fly!"
    },
    {
      targetId: "guided-feedback-panel",
      title: uiLang === 'zh' || i18n.language === 'mix' ? "第五步：意图主观反馈与 AI 极速二轮纠偏" : "Step 5: Logging Feedback & Double-Tuning AI",
      desc: uiLang === 'zh' || i18n.language === 'mix'
        ? "如结果仍不完美，给算式评分、勾选痛点标签或写下期望改进细节（例如：'排除xx概念'），点击【🤖 AI 双向重构】。大模型将依据二轮纠偏规则重新校准检索权重，生成定制检索式！"
        : "If the formula is not perfect, log ratings and choose details (e.g. 'add year constraint' or 'exclude clinical trial'), then click '🤖 AI Double-Tuning' to trigger deep refinement NLU weight optimization!"
    }
  ], [uiLang]);
  
  const [providers, setProviders] = useState<ProviderConfig[]>(DEFAULT_PROVIDERS);
  const [activeProviderId, setActiveProviderId] = useState<string>("gemini");
  const [activeModel, setActiveModel] = useState<string>("gemini-3.5-flash");

  const geminiApiKey = useMemo(() => {
    const geminiProv = providers.find(p => p.id === 'gemini' || p.isGemini);
    return geminiProv?.apiKey || "";
  }, [providers]);

  const saveOperatorStyle = (style: "OR" | "Space") => {
    setOperatorStyle(style);
    localStorage.setItem("ai_retrieval_operator_style", style);
  };

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [usageStats, setUsageStats] = useState<UsageStatsRegistry>({});
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const [testConnStatus, setTestConnStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testConnMessage, setTestConnMessage] = useState<string>('');

  useEffect(() => {
    setTestConnStatus('idle');
    setTestConnMessage('');
  }, [activeProviderId, activeModel, providers, isConfigOpen]);

  useEffect(() => {
    if (jumpDbName) {
      const timer = setTimeout(() => {
        setJumpDbName(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [jumpDbName]);

  const [isCompareMode, setIsCompareMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("ai_retrieval_compare_mode") === "true";
    } catch (_) {
      return false;
    }
  });

  const [compareProviderId, setCompareProviderId] = useState<string>(() => {
    try {
      return localStorage.getItem("ai_retrieval_compare_provider") || "deepseek";
    } catch (_) {
      return "deepseek";
    }
  });

  const [compareModel, setCompareModel] = useState<string>(() => {
    try {
      return localStorage.getItem("ai_retrieval_compare_model") || "deepseek-v4-flash";
    } catch (_) {
      return "deepseek-v4-flash";
    }
  });

  const [copyTarget, setCopyTarget] = useState<'A' | 'B' | null>(null);

  const saveCompareMode = (val: boolean) => {
    setIsCompareMode(val);
    localStorage.setItem("ai_retrieval_compare_mode", String(val));
  };

  const saveCompareProviderId = (val: string) => {
    setCompareProviderId(val);
    localStorage.setItem("ai_retrieval_compare_provider", val);
  };

  const saveCompareModel = (val: string) => {
    setCompareModel(val);
    localStorage.setItem("ai_retrieval_compare_model", val);
  };

  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>(() => {
    try {
      const stored = localStorage.getItem("ai_retrieval_feedbacks_v2");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const saveFeedbacksLocally = (newFeedbacks: UserFeedback[]) => {
    setFeedbacks(newFeedbacks);
    localStorage.setItem("ai_retrieval_feedbacks_v2", JSON.stringify(newFeedbacks));
  };

  // Feedback form state per active generated index
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackWritten, setFeedbackWritten] = useState<string>("");
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
  const [isRefiningAI, setIsRefiningAI] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [statsSubTab, setStatsSubTab] = useState<'traffic' | 'feedback'>('traffic');

  // Reset form when index or query input changes
  useEffect(() => {
    setFeedbackRating(0);
    setFeedbackWritten("");
    setFeedbackTags([]);
    setFeedbackNotice(null);
  }, [activeIndex, result?._inputLine]);

  const handleFeedbackSubmitOnly = () => {
    if (!result) return;
    if (feedbackRating === 0) {
      setFeedbackNotice(uiLang === 'zh' || i18n.language === 'mix' ? "请点击星标评分 (1-5)" : "Please select a rating (1-5 stars)");
      return;
    }

    const newFeedbackItem: UserFeedback = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      queryText: result._inputLine,
      providerId: activeProviderId,
      modelName: activeModel,
      dbType,
      rating: feedbackRating,
      tags: feedbackTags,
      writtenFeedback: feedbackWritten.trim(),
      optimized: false
    };

    const updatedFeedbacks = [newFeedbackItem, ...feedbacks];
    saveFeedbacksLocally(updatedFeedbacks);

    setFeedbackNotice(uiLang === 'zh' || i18n.language === 'mix' ? "✓ 反馈已收集！这将用于持续校准底层 NLU 算符及词汇体系。" : "✓ Feedback logged! This will help adjust query operator weights.");
    setFeedbackRating(0);
    setFeedbackWritten("");
    setFeedbackTags([]);
  };

  const handleFeedbackRefine = async () => {
    if (!result || isRefiningAI) return;
    
    // Capture before state for trajectory log
    const beforeBooleanQuery = result.booleanQuery;
    const beforeFieldQuery = result.fieldSpecificQuery;
    const beforeExplanation = result.explanation;
    const beforeKeywords = result.keywords;

    // Fallback if empty feedback submitted
    const finalFeedbackText = `[Tags: ${feedbackTags.join(', ')}] ${feedbackWritten.trim()}`;
    if (!feedbackWritten.trim() && feedbackTags.length === 0) {
      setFeedbackNotice(uiLang === 'zh' || i18n.language === 'mix' ? "请叙述要修正的核心痛点或圈选纠偏标签，以启发 AI 算符重构。" : "Please suggest corrective criteria or tap filter tags to initialize AI optimizer.");
      return;
    }

    setIsRefiningAI(true);
    setFeedbackNotice(null);

    // Swap results item loader
    setResults(current => {
      const next = [...current];
      next[activeIndex] = {
        ...next[activeIndex],
        _isLoading: true,
        booleanQuery: uiLang === 'zh' || i18n.language === 'mix' ? "正在读取反馈意图，对布尔嵌套算符进行逻辑精减纠偏..." : "Processing feedback guidelines, adjusting nested Boolean operators...",
        fieldSpecificQuery: uiLang === 'zh' || i18n.language === 'mix' ? "正在依据反馈对特定数据库数据库模式字段进行重构..." : "Customizing query fields based on feedback..."
      };
      return next;
    });

    try {
      const provider = providers.find(p => p.id === activeProviderId);
      const resp = await generateSearchQuery(
        result._inputLine,
        dbType,
        langPref,
        activeModel,
        provider,
        operatorStyle,
        finalFeedbackText,
        activeTemplateConstraint
      );

      const finalResp = { ...resp, _inputLine: result._inputLine, _isLoading: false };

      setResults(current => {
        const next = [...current];
        next[activeIndex] = finalResp;
        return next;
      });

      // Save AI optimization trajectory
      const newTrajectoryItem: RefinementTrajectoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        inputLine: result._inputLine || input,
        dbType,
        langPref,
        modelName: activeModel,
        providerId: activeProviderId,
        templateName: activeTemplateConstraint?.name || undefined,
        rating: feedbackRating || 2,
        feedbackTags: [...feedbackTags],
        feedbackWritten: feedbackWritten.trim(),
        before: {
          booleanQuery: beforeBooleanQuery,
          fieldSpecificQuery: beforeFieldQuery,
          explanation: beforeExplanation,
          keywords: beforeKeywords
        },
        after: {
          booleanQuery: finalResp.booleanQuery,
          fieldSpecificQuery: finalResp.fieldSpecificQuery,
          explanation: finalResp.explanation,
          keywords: finalResp.keywords,
          reasoning: finalResp._reasoning
        }
      };
      saveTrajectoriesLocally([newTrajectoryItem, ...trajectories]);

      // Log feedback metrics loop
      const feedbackItem: UserFeedback = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        queryText: result._inputLine,
        providerId: activeProviderId,
        modelName: activeModel,
        dbType,
        rating: feedbackRating || 2, // Assume low evaluation triggered correction
        tags: [...feedbackTags, uiLang === 'zh' || i18n.language === 'mix' ? "AI 拟合双向重构" : "AI Re-optimized"],
        writtenFeedback: feedbackWritten.trim() || (uiLang === 'zh' || i18n.language === 'mix' ? "模型算符重排" : "Structured operators adjustment"),
        optimized: true
      };

      const updatedFeedbacks = [feedbackItem, ...feedbacks];
      saveFeedbacksLocally(updatedFeedbacks);

      setFeedbackNotice(uiLang === 'zh' || i18n.language === 'mix' ? "✨ 检索算式已重构完毕！已记录至【AI 优化轨迹查看器】。" : "✨ Query restructured successfully! Logged to Optimization Trajectory Viewer.");
      setFeedbackRating(0);
      setFeedbackWritten("");
      setFeedbackTags([]);

    } catch (e: any) {
      console.error(e);
      let errMsg = "AI correction failed.";
      try {
        const parsed = JSON.parse(e.message);
        errMsg = parsed.details || parsed.title || errMsg;
      } catch (_) {
        errMsg = e.message || errMsg;
      }

      setResults(current => {
        const next = [...current];
        next[activeIndex] = {
          ...result,
          _isLoading: false,
          explanation: `${uiLang === 'zh' || i18n.language === 'mix' ? '二次精炼失败/Error' : 'AI optimization failed'}: ${errMsg}`
        };
        return next;
      });

      setFeedbackNotice(uiLang === 'zh' || i18n.language === 'mix' ? `⚠️ 拟合精炼失败: ${errMsg}` : `⚠️ Refine failed: ${errMsg}`);
    } finally {
      setIsRefiningAI(false);
    }
  };

  const [debouncedInput, setDebouncedInput] = useState(input);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInput(input);
    }, 200);
    return () => clearTimeout(handler);
  }, [input]);

  const matchingWhitelistLinks = useMemo(() => {
    // 1. Extract database keywords from dbType (if selected and not auto match)
    let dbKws: string[] = [];
    if (dbType && dbType !== "自动智能匹配 (Auto Match Engine)") {
      dbKws = extractKeywords(dbType);
    }
    
    // 2. Extract database keywords from user's current conversational input sentence!
    const inputKws = extractKeywords(debouncedInput);
    
    // 3. Combine keywords
    const combinedKws = Array.from(new Set([...inputKws, ...dbKws]));
    if (combinedKws.length === 0) return [];
    
    // 4. Score all whitelist items and pick the top 4
    return DEFAULT_LINKS
      .map(link => ({ link, score: scoreLink(link, combinedKws) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(x => x.link);
  }, [dbType, debouncedInput]);

  const handleTestConnection = async () => {
    setTestConnStatus('testing');
    setTestConnMessage(t('testing'));
    try {
      const provider = providers.find(p => p.id === activeProviderId);
      if (!provider) throw new Error("Provider not found");
      await testConnection(provider, activeModel);
      setTestConnStatus('success');
      setTestConnMessage(t('testSuccess'));
      setConsecutiveFailures(0);
    } catch (e: any) {
      setTestConnStatus('error');
      setTestConnMessage(`${t('testFailed')}: ${e.message}`);
      setConsecutiveFailures(prev => prev + 1);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("ai_retrieval_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      } catch (e) {}
    }
    let providersToUse = DEFAULT_PROVIDERS;
    const savedProviders = localStorage.getItem("ai_retrieval_providers");
    if (savedProviders) {
      try {
        const parsed = JSON.parse(savedProviders);
        if (Array.isArray(parsed)) {
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const missingDefaults = DEFAULT_PROVIDERS.filter(dp => !existingIds.has(dp.id));
          providersToUse = [
            ...parsed.map((p: any) => {
              const defaultProv = DEFAULT_PROVIDERS.find(dp => dp.id === p.id);
              if (defaultProv) {
                return { 
                  ...p, 
                  models: defaultProv.models, 
                  endpoint: (p.endpoint && p.endpoint !== "default") ? p.endpoint : defaultProv.endpoint 
                };
              }
              return p;
            }),
            ...missingDefaults
          ];
          setProviders(providersToUse);
        }
      } catch (e) {}
    }
    
    let activeProvIdToUse = "gemini";
    const savedActiveProv = localStorage.getItem("ai_retrieval_active_prov");
    if (savedActiveProv) {
        setActiveProviderId(savedActiveProv);
        activeProvIdToUse = savedActiveProv;
    }
    
    const savedActiveMod = localStorage.getItem("ai_retrieval_active_mod");
    const activeProviderObj = providersToUse.find(p => p.id === activeProvIdToUse) || providersToUse[0];
    const availableModelsForProv = activeProviderObj ? activeProviderObj.models.split(',').map(m => m.trim()).filter(Boolean) : [];
    
    if (savedActiveMod && availableModelsForProv.includes(savedActiveMod)) {
      setActiveModel(savedActiveMod);
    } else if (availableModelsForProv.length > 0) {
      setActiveModel(availableModelsForProv[0]);
    }
    const savedUsageStats = localStorage.getItem("ai_retrieval_usage_stats");
    if (savedUsageStats) {
      try { setUsageStats(JSON.parse(savedUsageStats)); } catch(e) {}
    }
    const savedOperatorStyle = localStorage.getItem("ai_retrieval_operator_style");
    if (savedOperatorStyle === "Space") {
      setOperatorStyle("Space");
    } else {
      setOperatorStyle("OR");
    }
  }, []);

  const saveUsageStats = (newStats: UsageStatsRegistry) => {
    setUsageStats(newStats);
    localStorage.setItem("ai_retrieval_usage_stats", JSON.stringify(newStats));
  };

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("ai_retrieval_history", JSON.stringify(items));
  };

  const saveProviders = (newProviders: ProviderConfig[]) => {
    setProviders(newProviders);
    localStorage.setItem("ai_retrieval_providers", JSON.stringify(newProviders));
  };
  const saveActiveProviderId = (id: string) => {
    setActiveProviderId(id);
    localStorage.setItem("ai_retrieval_active_prov", id);
  };
  const saveActiveModel = (model: string) => {
    setActiveModel(model);
    localStorage.setItem("ai_retrieval_active_mod", model);
  };

  const handleCreateProvider = () => {
    const newId = `custom-${Date.now()}`;
    const newProvider: ProviderConfig = {
      id: newId,
      name: "New Provider",
      isGemini: false,
      endpoint: "https://api.openai.com/v1",
      authType: 'Bearer',
      apiKey: "",
      models: "gpt-3.5-turbo,gpt-4"
    };
    saveProviders([...providers, newProvider]);
    saveActiveProviderId(newId);
    saveActiveModel("gpt-3.5-turbo");
  };

  const handleDeleteProvider = (id: string) => {
    const newProviders = providers.filter(p => p.id !== id);
    saveProviders(newProviders);
    saveActiveProviderId("gemini");
    saveActiveModel("gemini-3.5-flash");
  };

  const updateActiveProvider = (updates: Partial<ProviderConfig>) => {
    const newProviders = providers.map(p => 
      p.id === activeProviderId ? { ...p, ...updates } : p
    );
    saveProviders(newProviders);
  };

  const activeProvider = providers.find(p => p.id === activeProviderId) || providers[0];
  const availableModels = activeProvider.models.split(',').map(m => m.trim()).filter(Boolean);

  const handleGenerate = async () => {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setLoading(true);
    setError(null);
    setShowMapped(true);
    
    // Initialize results with high-fidelity loading overlays immediately
    const initialResults = lines.map(line => ({
      _inputLine: line,
      _isLoading: true,
      keywords: [],
      booleanQuery: isCompareMode ? "Model A 正在生成布尔逻辑式... (AI processing Model A standard Boolean query...)" : "正在智能解析生成布尔逻辑式... (AI processing standard Boolean query...)",
      fieldSpecificQuery: isCompareMode ? "Model A 正在生成字段检索式..." : "正在根据数据库字段Schema生成专业检索式... (AI processing Field Specific query...)",
      schemaMapping: [],
      explanation: isCompareMode ? "正在调用大模型 A 检索策略..." : "正在调用模型智能分析同义词并匹配高级检索策略...",
      suggestedUrls: [],
      _compareResult: isCompareMode ? {
        keywords: [],
        booleanQuery: "Model B 正在生成布尔逻辑式... (AI processing Model B standard Boolean query...)",
        fieldSpecificQuery: "Model B 正在生成字段检索式...",
        schemaMapping: [],
        explanation: "正在调用大模型 B 检索策略...",
        suggestedUrls: [],
        _isLoading: true
      } : undefined
    }));
    setResults(initialResults);
    setActiveIndex(0);

    try {
      const providerA = providers.find(p => p.id === activeProviderId);
      const providerB = providers.find(p => p.id === compareProviderId);
      
      let totalTokensA = 0;
      let totalTokensB = 0;
      let totalSuccessesA = 0;
      let totalSuccessesB = 0;
      let totalFailuresA = 0;
      let totalFailuresB = 0;
      
      const newItems: HistoryItem[] = [];

      // Concurrently run all requests but resolve them dynamically to the UI!
      const promises = lines.map(async (line, idx) => {
        let respA: any = null;
        let respB: any = null;

        // Model A runner
        try {
          const cachedResultA = getLocalCache(line, dbType, langPref, activeModel, activeProviderId, operatorStyle, activeTemplateId);
          if (cachedResultA) {
            respA = { 
              ...cachedResultA, 
              _fromCache: true, 
              _latencyMs: 0,
              _modelUsed: activeModel,
              _providerUsed: providerA?.name || "Local Cache"
            };
          } else {
            respA = await generateSearchQuery(line, dbType, langPref, activeModel, providerA, operatorStyle, undefined, activeTemplateConstraint);
            setLocalCache(line, dbType, langPref, activeModel, activeProviderId, operatorStyle, activeTemplateId, respA);
          }
          totalTokensA += (respA._usage?.totalTokens || 0);
          totalSuccessesA++;
        } catch (e: any) {
          totalFailuresA++;
          console.error("Model A failed for line:", line, e);
          let errMsgA = "An error occurred during query generation (Model A).";
          try {
            const parsed = JSON.parse(e.message);
            errMsgA = parsed.details || parsed.title || errMsgA;
          } catch (_) {
            errMsgA = e.message || errMsgA;
          }
          respA = {
            _isError: true,
            keywords: [],
            booleanQuery: "生成失败 / Generation Failed (Model A)",
            fieldSpecificQuery: "生成失败 / Generation Failed (Model A)",
            schemaMapping: [],
            explanation: errMsgA,
            suggestedUrls: []
          };
        }

        // Model B runner if in compare mode
        if (isCompareMode) {
          try {
            const cachedResultB = getLocalCache(line, dbType, langPref, compareModel, compareProviderId, operatorStyle, activeTemplateId);
            if (cachedResultB) {
              respB = { 
                ...cachedResultB, 
                _fromCache: true, 
                _latencyMs: 0,
                modelName: compareModel,
                _modelUsed: compareModel,
                _providerUsed: providerB?.name || "Local Cache"
              };
            } else {
              respB = await generateSearchQuery(line, dbType, langPref, compareModel, providerB, operatorStyle, undefined, activeTemplateConstraint);
              setLocalCache(line, dbType, langPref, compareModel, compareProviderId, operatorStyle, activeTemplateId, respB);
            }
            totalTokensB += (respB._usage?.totalTokens || 0);
            totalSuccessesB++;
          } catch (e: any) {
            totalFailuresB++;
            console.error("Model B failed for line:", line, e);
            let errMsgB = "An error occurred during query generation (Model B).";
            try {
              const parsed = JSON.parse(e.message);
              errMsgB = parsed.details || parsed.title || errMsgB;
            } catch (_) {
              errMsgB = e.message || errMsgB;
            }
            respB = {
              _isError: true,
              keywords: [],
              booleanQuery: "生成失败 / Generation Failed (Model B)",
              fieldSpecificQuery: "生成失败 / Generation Failed (Model B)",
              schemaMapping: [],
              explanation: errMsgB,
              suggestedUrls: []
            };
          }
        }

        const finalResp = { 
          ...respA, 
          _inputLine: line, 
          _isLoading: false,
          _compareResult: isCompareMode && respB ? {
            ...respB,
            modelName: compareModel,
            providerId: compareProviderId,
            _isLoading: false
          } : undefined
        };
        
        // Progressive UI update - immediately injects into results as soon as resolved!
        setResults(current => {
          const next = [...current];
          next[idx] = finalResp;
          return next;
        });

        const historyItem: HistoryItem = {
          id: (Date.now() + idx).toString(),
          timestamp: Date.now() + idx,
          input: line,
          dbType,
          langPref,
          result: finalResp
        };

        newItems.push(historyItem);
        return finalResp;
      });

      const resps = await Promise.all(promises);
      
      if (resps.some(r => r !== null && (!r._isError || (r._compareResult && !r._compareResult._isError)))) {
        saveHistory([...newItems, ...history].slice(0, 50));
        setConsecutiveFailures(0);
      } else {
        throw new Error(JSON.stringify({ title: "任务生成失败 / Generation Failed", details: "大模型异步解析出错，请检查接口配置与网络连接。 (Model processing failed, check your configurations.)" }));
      }
      
      // Update Usage Stats
      let updatedStats = { ...usageStats };

      // Update for Model A
      const provA = activeProviderId;
      const modA = activeModel;
      if (!updatedStats[provA]) updatedStats[provA] = {};
      const currentModAStats = updatedStats[provA][modA] || { queries: 0, successes: 0, failures: 0, totalTokens: 0 };
      updatedStats[provA][modA] = {
        ...currentModAStats,
        queries: currentModAStats.queries + lines.length,
        successes: currentModAStats.successes + totalSuccessesA,
        failures: currentModAStats.failures + totalFailuresA,
        totalTokens: currentModAStats.totalTokens + totalTokensA
      };

      // Update for Model B if compare mode
      if (isCompareMode) {
        const provB = compareProviderId;
        const modB = compareModel;
        if (!updatedStats[provB]) updatedStats[provB] = {};
        const currentModBStats = updatedStats[provB][modB] || { queries: 0, successes: 0, failures: 0, totalTokens: 0 };
        updatedStats[provB][modB] = {
          ...currentModBStats,
          queries: currentModBStats.queries + lines.length,
          successes: currentModBStats.successes + totalSuccessesB,
          failures: currentModBStats.failures + totalFailuresB,
          totalTokens: currentModBStats.totalTokens + totalTokensB
        };
      }
      
      saveUsageStats(updatedStats);
      
    } catch (err: any) {
      setConsecutiveFailures(prev => prev + 1);
      // Update Usage Stats for ALL failure (edge case)
      const provId = activeProviderId;
      const modName = activeModel;
      const currentProvStats = usageStats[provId] || {};
      const currentModStats = currentProvStats[modName] || { queries: 0, successes: 0, failures: 0, totalTokens: 0 };
      
      const updatedStats = {
        ...usageStats,
        [provId]: {
          ...currentProvStats,
          [modName]: {
            ...currentModStats,
            queries: currentModStats.queries + lines.length,
            failures: currentModStats.failures + lines.length,
          }
        }
      };
      saveUsageStats(updatedStats);
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed);
      } catch (e) {
        setError({
          title: "Execution Error",
          details: err.message || "An unexpected error occurred during query generation."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setInput("");
    setResults([]);
    setActiveIndex(0);
    setError(null);
  };

  const renderCompareCard = (
    title: string, 
    mResp: any, 
    modelName: string, 
    isLoading: boolean, 
    isModelA: boolean
  ) => {
    const isErr = mResp?._isError;
    const isCached = mResp?._fromCache;
    const hasMapping = mResp && !isLoading && showMapped && Array.isArray(mResp.schemaMapping) && mResp.schemaMapping.length > 0;
    
    // Use user-selected keywords logic dynamically
    const effQueries = getEffectiveQueries(mResp, !isModelA);
    const queryStr = mResp ? (showMapped ? (effQueries.fieldSpecificQuery || effQueries.booleanQuery) : effQueries.booleanQuery) : "";

    // Real-time syntax validation for compare card
    const cardValidation = (queryStr && !isLoading && !isErr) ? validateBooleanQuery(queryStr, { database: dbType, operatorStyle, isFieldSpecific: showMapped }) : null;

    const handleApplyCompareFix = (fixedQuery: string) => {
      setResults(prev => {
        const next = [...prev];
        const cur = next[activeIndex];
        if (!cur) return next;

        if (isModelA) {
          next[activeIndex] = {
            ...cur,
            booleanQuery: showMapped ? cur.booleanQuery : fixedQuery,
            fieldSpecificQuery: showMapped ? fixedQuery : cur.fieldSpecificQuery
          };
        } else if (cur._compareResult) {
          next[activeIndex] = {
            ...cur,
            _compareResult: {
              ...cur._compareResult,
              booleanQuery: showMapped ? cur._compareResult.booleanQuery : fixedQuery,
              fieldSpecificQuery: showMapped ? fixedQuery : cur._compareResult.fieldSpecificQuery
            }
          };
        }
        return next;
      });
      setCopied(true);
      setCopyTarget(isModelA ? 'A' : 'B');
      setTimeout(() => {
        setCopied(false);
        setCopyTarget(null);
      }, 2000);
    };

    const cardCopied = copied && copyTarget === (isModelA ? 'A' : 'B');

    const handleCardCopy = () => {
      if (!queryStr) return;
      navigator.clipboard.writeText(queryStr);
      setCopied(true);
      setCopyTarget(isModelA ? 'A' : 'B');
      setTimeout(() => {
        setCopied(false);
        setCopyTarget(null);
      }, 2000);
    };

    const isStrategyExpanded = !!expandedCardStrategies[isModelA ? 'A' : 'B'];

    return (
      <div 
        style={{
          minHeight: screenHeight < 700 ? '250px' : screenHeight < 800 ? '300px' : '350px'
        }}
        className={`flex flex-col border rounded-2xl p-4 sm:p-5 relative flex-1 text-left min-w-0 transition-all ${
          isModelA 
            ? 'border-cyan-500/20 bg-cyan-950/10 hover:border-cyan-500/30 [.theme-light_&]:bg-sky-50/60 [.theme-light_&]:border-sky-200' 
            : 'border-purple-500/20 bg-purple-950/10 hover:border-purple-500/30 [.theme-light_&]:bg-purple-50/60 [.theme-light_&]:border-purple-200'
        }`}
      >
        {/* Card Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isModelA ? 'bg-cyan-400' : 'bg-purple-400'} animate-pulse`}></span>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isModelA ? 'text-cyan-300' : 'text-purple-300'}`}>
              {title}
            </span>
            <span className="text-[10px] text-slate-400 font-mono" title={modelName}>
              ({modelName})
            </span>
          </div>

          <div className="flex gap-1.5 shrink-0 items-center">
            {effQueries.isCustomized && (
              <span className={`inline-flex items-center px-1.5 py-0.5 border text-[8px] rounded-md font-bold uppercase tracking-widest font-mono select-none ${
                isModelA 
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                  : "bg-purple-500/10 border-purple-500/30 text-purple-400"
              }`}>
                🎯 {uiLang === 'zh' || i18n.language === 'mix' ? "自定义" : "SELECTIVE"}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWords(prev => {
                      const next = { ...prev };
                      Object.keys(next).forEach((key) => {
                        if (key.startsWith(`${activeIndex}:${isModelA ? 'A' : 'B'}:`)) {
                          delete next[key];
                        }
                      });
                      return next;
                    });
                  }}
                  className="ml-1 text-[8px] hover:underline hover:text-white transition-all cursor-pointer font-extrabold focus:outline-none"
                  title="Reset selections for this model"
                >
                  ✖
                </button>
              </span>
            )}
            {isCached && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] rounded-md font-bold uppercase tracking-widest font-mono animate-fade-in shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                ⚡️ CACHED
              </span>
            )}
            {mResp?._latencyMs !== undefined && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-[8px] rounded-md font-bold font-mono">
                ⚡ {mResp._fromCache ? '0ms' : `${mResp._latencyMs}ms`}
              </span>
            )}
            {mResp?._usage?.totalTokens && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-white/5 border border-white/10 text-slate-400 text-[8px] rounded-md font-bold font-mono">
                {mResp._usage.totalTokens} Tokens
              </span>
            )}
            {mResp?._appliedTemplate && (
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[8px] rounded-md font-bold uppercase tracking-wider font-mono cursor-pointer hover:bg-amber-500/20 transition-colors"
                onClick={() => {
                  setSettingsTab('templates');
                  setIsConfigOpen(true);
                }}
                title={`逻辑框架约束: ${mResp._appliedTemplate} (点击打开检索式模板库)`}
              >
                📐 {mResp._appliedTemplate}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex-1 flex flex-col justify-center items-center py-8 text-slate-500 text-xs gap-3">
            <div className="w-5 h-5 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
            <span className="font-mono animate-pulse uppercase tracking-widest text-[10px]">
              {uiLang === 'zh' || i18n.language === 'mix' ? "大模型并行求解中..." : "SOLVING DYNAMIC RETRIEVAL..."}
            </span>
          </div>
        ) : isErr || !mResp ? (
          <div className="flex-1 overflow-y-auto p-3 bg-red-500/5 rounded-lg border border-red-500/20 text-xs text-red-400 font-mono">
            {mResp?.explanation || "Generation failed."}
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Query Formula Code box */}
            <div className="flex-1 flex flex-col relative" style={{ minHeight: '110px' }}>
              <div 
                style={{
                  minHeight: '110px',
                  maxHeight: '260px'
                }}
                className={`formula-code-box font-mono text-xs leading-relaxed tracking-normal overflow-y-auto custom-scrollbar select-all flex-1 p-3.5 sm:p-4 rounded-xl border whitespace-pre-wrap break-words transition-all ${
                  cardValidation && !cardValidation.isValid
                    ? 'border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.2)] ring-1 ring-rose-500/30'
                    : 'border-white/10 [.theme-light_&]:border-slate-300'
                }`}
              >
                <HighlightedBooleanQuery query={queryStr} />
              </div>
              
              {/* Copy Overlay Button */}
              <button 
                onClick={handleCardCopy}
                className="absolute right-2 text-slate-400 hover:text-white bottom-2 p-1.5 bg-slate-800/80 hover:bg-slate-750 border border-white/10 rounded-lg transition-all cursor-pointer shadow"
                title="Copy code"
              >
                {cardCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>

            {/* Real-time Syntax Validation for Compare Card */}
            {cardValidation && (
              <SyntaxValidationAlert
                validation={cardValidation}
                onApplyFix={handleApplyCompareFix}
                uiLang={uiLang}
                className="my-0.5"
              />
            )}

            {/* Visual Query Tree */}
            {mResp.keywords && mResp.keywords.length > 0 && (
              <VisualQueryTree
                keywords={mResp.keywords}
                isModelB={!isModelA}
                activeIndex={activeIndex}
                selectedWords={selectedWords}
                onToggleWord={(isB, gIdx, word) => toggleWordSelection(isB, gIdx, word)}
                operatorStyle={operatorStyle}
                uiLang={uiLang as "zh" | "mix"}
              />
            )}

            {/* Explanation strategy */}
            {mResp.explanation && (
              <div className="bg-black/25 rounded-lg p-2.5 border border-white/5 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase select-none font-mono">
                    STRATEGY / 检索逻辑策略:
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedCardStrategies(prev => ({ ...prev, [isModelA ? 'A' : 'B']: !prev[isModelA ? 'A' : 'B'] }))}
                    className="text-[9px] text-cyan-400 hover:text-cyan-300 font-medium hover:underline cursor-pointer"
                  >
                    {isStrategyExpanded ? (uiLang === 'zh' || i18n.language === 'mix' ? "收起" : "Less") : (uiLang === 'zh' || i18n.language === 'mix' ? "展开全部" : "More")}
                  </button>
                </div>
                <p className={`text-[11px] text-slate-300 leading-relaxed italic ${isStrategyExpanded ? '' : 'line-clamp-2'}`} title={mResp.explanation}>
                  {mResp.explanation}
                </p>
              </div>
            )}

            {/* Field Mappings */}
            {hasMapping && (
              <div className="flex flex-col gap-1.5 mt-1 border-t border-white/5 pt-2 custom-scrollbar overflow-y-auto max-h-[220px]">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Field mappings / 字段对应映射:</span>
                <div className="space-y-1.5">
                  {mResp.schemaMapping.map((map: any, i: number) => (
                    <div key={i} className="flex flex-wrap items-start gap-1.5 text-[10px] bg-white/5 px-2.5 py-1.5 rounded">
                      <span className="text-[9px] text-emerald-400 font-mono bg-emerald-400/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">[{map.field}]</span>
                      <span className="text-slate-200 font-medium shrink-0">"{map.mappedConcept}"</span>
                      <span className="text-slate-400 text-[9px] flex-1 break-words">({map.reason})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Links inside the card */}
            {Array.isArray(mResp.suggestedUrls) && mResp.suggestedUrls.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1 border-t border-white/5 pt-2 shrink-0">
                {mResp.suggestedUrls.map((urlItem: any, i: number) => (
                  <a
                    key={i}
                    href={urlItem.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      navigator.clipboard.writeText(queryStr);
                      setCopied(true);
                      setCopyTarget(isModelA ? 'A' : 'B');
                      setTimeout(() => {
                        setCopied(false);
                        setCopyTarget(null);
                      }, 2000);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/25 rounded-md text-[10px] uppercase font-black tracking-widest transition-all"
                  >
                    <span>{urlItem.name || "GO"}</span>
                    <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const restoreHistory = (item: HistoryItem) => {
    setInput(item.input);
    setDbType(item.dbType);
    setLangPref(item.langPref);
    setResults([{ ...item.result, _inputLine: item.input }]);
    setActiveIndex(0);
    setIsHistoryOpen(false);
    setError(null);
  };

  const isOfflineMode = !isOnline || consecutiveFailures >= 2;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 overflow-x-hidden ${theme === 'light' ? 'theme-light bg-[#f8fafc] text-slate-900' : 'bg-[#05070A] text-slate-100'}`}>
      {/* Header Section */}
      <header className="flex items-center justify-between border-b border-white/10 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 shrink-0 bg-[#05070A]/80 backdrop-blur-sm z-50 gap-2 sm:gap-4 transition-colors relative">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-xl font-bold tracking-tight text-white uppercase flex items-center flex-wrap gap-1 sm:gap-1.5 truncate">
              <span className="truncate">{t('appTitle')}</span>
              <span className="text-cyan-500 text-[9px] sm:text-[10px] font-mono opacity-70 shrink-0">v2.4.0</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest leading-none hidden xs:block truncate">
              {t('appSubtitle')}
            </p>
          </div>
        </div>
        
        {/* Right Section Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 justify-end shrink-0">
          {/* Global Offline/Failure Banner Action (Visible on large screens) */}
          {isOfflineMode && (
            <div className="hidden lg:flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl text-red-400 animate-fade-in shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <WifiOff size={13} className="animate-pulse shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-red-300 leading-tight">
                  {!isOnline ? "已断开外网连接" : "API 连续连接失败"}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('whitelist')}
                className="text-[9px] bg-red-500/20 hover:bg-red-500/35 text-white px-2 py-0.5 rounded border border-red-500/40 transition-all font-black uppercase cursor-pointer"
              >
                速查 ➜
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* DESKTOP HEADER ACTIONS (md:flex, hidden on small screens) */}
          {/* ========================================================= */}
          <div className="hidden md:flex items-center gap-2 lg:gap-2.5">
            {/* Multi-language Dropdown */}
            <div 
              className="flex items-center gap-1.5 bg-slate-800/40 hover:bg-slate-700/60 px-2.5 py-1.5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer relative group shrink-0"
              onClick={(e) => {
                e.currentTarget.querySelector('.dropdown-menu')?.classList.toggle('hidden');
                e.currentTarget.querySelector('.dropdown-menu')?.classList.toggle('opacity-0');
                e.currentTarget.querySelector('.dropdown-menu')?.classList.toggle('-translate-y-2');
              }}
              tabIndex={0}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  e.currentTarget.querySelector('.dropdown-menu')?.classList.add('hidden', 'opacity-0', '-translate-y-2');
                }
              }}
            >
              <Languages size={13} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <div className="text-xs font-bold text-slate-300 group-hover:text-white pr-4 select-none relative z-10 pointer-events-none">
                {uiLang === 'mix' ? '中文/EN' : uiLang === 'zh' ? '简体中文' : 'English'}
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                <ChevronDown size={11} className="text-cyan-400" />
              </div>

              {/* Custom Dropdown Menu */}
              <div className="dropdown-menu hidden opacity-0 -translate-y-2 transition-all duration-200 absolute top-full right-0 mt-2.5 bg-[#0a0f18] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] min-w-full w-max">
                <div className="flex flex-col py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      i18n.changeLanguage("mix");
                      e.currentTarget.closest('.dropdown-menu')?.classList.add('hidden', 'opacity-0', '-translate-y-2');
                    }}
                    className={`px-3.5 py-2 text-xs font-bold text-left transition-colors flex items-center justify-between ${uiLang === 'mix' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    中文/EN (Mix)
                    {uiLang === 'mix' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-3"></span>}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      i18n.changeLanguage("zh");
                      e.currentTarget.closest('.dropdown-menu')?.classList.add('hidden', 'opacity-0', '-translate-y-2');
                    }}
                    className={`px-3.5 py-2 text-xs font-bold text-left transition-colors flex items-center justify-between ${uiLang === 'zh' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    简体中文
                    {uiLang === 'zh' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-3"></span>}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      i18n.changeLanguage("en");
                      e.currentTarget.closest('.dropdown-menu')?.classList.add('hidden', 'opacity-0', '-translate-y-2');
                    }}
                    className={`px-3.5 py-2 text-xs font-bold text-left transition-colors flex items-center justify-between ${uiLang === 'en' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    English
                    {uiLang === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-3"></span>}
                  </button>
                </div>
              </div>
            </div>

            {/* Guided Search Walkthrough Button */}
            <button
              onClick={startTour}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/25 hover:border-cyan-500/45 rounded-xl transition-all cursor-pointer relative group shrink-0"
              title="交互式检索学步引导 (Interactive Search Walkthrough)"
            >
              <Sparkles size={13} className="text-cyan-400 animate-pulse" />
              <span className="text-xs font-extrabold tracking-wider uppercase font-mono">
                {uiLang === 'zh' || i18n.language === 'mix' ? "新手引导" : "Tour"}
              </span>
            </button>

            {/* Quick Help/Offline Installer Corner Button */}
            <button
              onClick={() => setShowInstallerModal(true)}
              className="p-2 bg-slate-800/40 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all relative group flex items-center justify-center shrink-0 cursor-pointer"
              title="一键离线安装与本地部署说明 (Offline & Installer)"
            >
              <Info size={14} />
            </button>

            {/* Direct Settings Entry Point (Formerly missing from Header!) */}
            <button
              onClick={() => {
                setSettingsTab('models');
                setIsConfigOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/40 hover:bg-slate-700/60 text-slate-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all cursor-pointer shrink-0 font-mono text-xs font-bold"
              title="大模型API配置、检索模板管理与AI优化轨迹"
            >
              <Settings size={13} className="text-cyan-400" />
              <span className="hidden lg:inline">{t('settings')}</span>
            </button>

            {/* Direct History Entry Point */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/40 hover:bg-slate-700/60 text-slate-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all cursor-pointer shrink-0 font-mono text-xs font-bold"
              title="查看历史检索式生成记录"
            >
              <History size={13} className="text-cyan-400" />
              <span className="hidden xl:inline">{t('historyButton')}</span>
            </button>

            {/* Top System Information Bar, Performance Metrics & Theme Switcher */}
            <div className="flex items-center gap-2 bg-slate-800/40 border border-white/10 px-2.5 py-1.5 rounded-xl shrink-0">
              {/* Real-time Performance Metrics Panel */}
              <PerformanceMetricsPanel
                result={results[activeIndex] || null}
                loading={loading}
                activeModel={activeModel}
                activeProviderName={activeProvider.name}
                isCompareMode={isCompareMode}
                compareModel={compareModel}
                uiLang={uiLang}
                onOpenSettings={() => {
                  setSettingsTab('models');
                  setIsConfigOpen(true);
                }}
              />

              <div className="h-3.5 w-px bg-white/10 hidden sm:block"></div>

              <button
                type="button"
                onClick={toggleTheme}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none border ${
                  theme === 'light'
                    ? 'bg-amber-500/20 text-amber-800 border-amber-500/40 hover:bg-amber-500/30 shadow-sm'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25'
                }`}
                title={
                  theme === 'dark'
                    ? (uiLang === 'zh' || i18n.language === 'mix' ? "切换至高对比度浅色主题" : "Switch to Light Theme")
                    : (uiLang === 'zh' || i18n.language === 'mix' ? "切换至深色科技主题" : "Switch to Dark Theme")
                }
              >
                {theme === 'light' ? (
                  <>
                    <Sun size={13} className="text-amber-600" />
                    <span className="text-[10px] font-mono">{uiLang === 'zh' || i18n.language === 'mix' ? "浅色" : "Light"}</span>
                  </>
                ) : (
                  <>
                    <Moon size={13} className="text-cyan-300" />
                    <span className="text-[10px] font-mono">{uiLang === 'zh' || i18n.language === 'mix' ? "深色" : "Dark"}</span>
                  </>
                )}
              </button>

              <div className="h-3.5 w-px bg-white/10 hidden xl:block"></div>

              {/* Service & Engine Status */}
              <div className="text-right hidden xl:block">
                {isOfflineMode ? (
                  <span className="text-[10px] text-rose-500 flex items-center gap-1 font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>{!isOnline ? "离线" : "阻断"}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{t('operational')}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MOBILE / SMALL SCREEN STREAMLINED SYSTEM MENU (md:hidden)                  */}
          {/* Merges Multi-language, Theme switch, Settings & History into a single hub  */}
          {/* ========================================================================= */}
          <div className="flex md:hidden items-center gap-1.5 relative">
            {/* Quick History Button on Mobile for Fast Access */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 bg-slate-850/70 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 border border-white/10 rounded-xl transition-all cursor-pointer"
              title="历史检索记录"
              aria-label="History"
            >
              <History size={15} className="text-cyan-400" />
            </button>

            {/* Quick Tour Button on Mobile */}
            <button
              onClick={startTour}
              className="p-2 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-cyan-400 border border-cyan-500/25 rounded-xl transition-all cursor-pointer"
              title="新手引导"
              aria-label="Tour"
            >
              <Sparkles size={15} />
            </button>

            {/* Streamlined System Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSystemMenuOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer font-mono font-bold text-xs select-none ${
                isSystemMenuOpen
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-850/80 hover:bg-slate-700/80 text-slate-200 border-white/10 hover:border-cyan-500/30'
              }`}
              aria-label="System Settings Menu"
              aria-expanded={isSystemMenuOpen}
            >
              {theme === 'light' ? (
                <Sun size={13} className="text-amber-500" />
              ) : (
                <Moon size={13} className="text-cyan-400" />
              )}
              <span className="text-[11px] uppercase tracking-wider">
                {uiLang === 'mix' ? '系统' : uiLang === 'zh' ? '设置' : 'Menu'}
              </span>
              <ChevronDown 
                size={11} 
                className={`transition-transform duration-200 text-cyan-400 ${isSystemMenuOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Backdrop for closing system menu */}
            {isSystemMenuOpen && (
              <div 
                className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-[2px]" 
                onClick={() => setIsSystemMenuOpen(false)}
              />
            )}

            {/* Streamlined System Menu Popover */}
            {isSystemMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#0a0f18] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden z-[130] animate-in fade-in slide-in-from-top-2 duration-150 p-3 flex flex-col gap-3 font-sans">
                {/* Header within popover */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Settings size={14} className="text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {uiLang === 'zh' || i18n.language === 'mix' ? "系统偏好与设置" : "Preferences & Setup"}
                    </span>
                  </div>
                  {/* Status Indicator inside menu */}
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isOfflineMode 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOfflineMode ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                    {isOfflineMode ? "离线状态" : t('operational')}
                  </span>
                </div>

                {/* Section 1: Appearance Theme Switcher */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                    {uiLang === 'zh' || i18n.language === 'mix' ? "🎨 主题外观 (Theme)" : "🎨 Appearance"}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        if (theme !== 'dark') toggleTheme();
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        theme === 'dark'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <Moon size={13} className={theme === 'dark' ? 'text-cyan-400' : 'text-slate-500'} />
                      <span>{uiLang === 'zh' || i18n.language === 'mix' ? "深色科技" : "Dark"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (theme !== 'light') toggleTheme();
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        theme === 'light'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                          : 'text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <Sun size={13} className={theme === 'light' ? 'text-amber-400' : 'text-slate-500'} />
                      <span>{uiLang === 'zh' || i18n.language === 'mix' ? "浅色高亮" : "Light"}</span>
                    </button>
                  </div>
                </div>

                {/* Section 2: Interface Language Selection */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                    {uiLang === 'zh' || i18n.language === 'mix' ? "🌐 界面语言 (Language)" : "🌐 Language"}
                  </span>
                  <div className="flex flex-col gap-1 bg-black/40 rounded-xl p-1 border border-white/5">
                    {[
                      { code: 'mix', label: '中文/EN (Mix 双语混合)' },
                      { code: 'zh', label: '简体中文 (Chinese)' },
                      { code: 'en', label: 'English (US)' }
                    ].map(item => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          i18n.changeLanguage(item.code);
                        }}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                          uiLang === item.code
                            ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        {uiLang === item.code && (
                          <Check size={13} className="text-cyan-400 font-bold" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section: Real-time Performance Metrics Overview */}
                <div className="flex flex-col gap-1.5 pt-1 border-t border-white/10">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span>⚡ 实时性能指标 (Metrics)</span>
                    {results[activeIndex] && (
                      <span className="text-[9px] text-cyan-400 font-mono">
                        {results[activeIndex]._fromCache ? '0ms 缓存' : `${results[activeIndex]._latencyMs || 0}ms`}
                      </span>
                    )}
                  </span>
                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px]">生效模型:</span>
                      <span className="text-white font-mono font-bold text-[11px]">{results[activeIndex]?._modelUsed || activeModel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px]">响应耗时 / Tokens:</span>
                      <span className="text-cyan-300 font-mono font-bold text-[11px]">
                        {results[activeIndex] ? (
                          results[activeIndex]._fromCache 
                            ? "0ms · 0 消耗" 
                            : `${results[activeIndex]._latencyMs || 0}ms · ${results[activeIndex]._usage?.totalTokens || 0} tok`
                        ) : "尚未生成"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Core Functional Hub & Tools */}
                <div className="flex flex-col gap-1 pt-1 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsTab('models');
                      setIsConfigOpen(true);
                      setIsSystemMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors text-left"
                  >
                    <Settings size={14} className="text-cyan-400 shrink-0" />
                    <div className="flex flex-col">
                      <span>{t('settings')} / API配置</span>
                      <span className="text-[9px] text-slate-400 font-normal">模型提供商、自定义API与模板库</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsHistoryOpen(true);
                      setIsSystemMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors text-left"
                  >
                    <History size={14} className="text-cyan-400 shrink-0" />
                    <div className="flex flex-col">
                      <span>{t('historyButton')}</span>
                      <span className="text-[9px] text-slate-400 font-normal">浏览与恢复近期生成的布尔检索式</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowInstallerModal(true);
                      setIsSystemMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors text-left"
                  >
                    <Info size={14} className="text-cyan-400 shrink-0" />
                    <div className="flex flex-col">
                      <span>离线安装与本地部署</span>
                      <span className="text-[9px] text-slate-400 font-normal">单文件离线生成与离线运行指引</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Interface Tab Selector */}
      <div className="flex border-b border-white/10 bg-[#05070A]/95 px-3 sm:px-6 lg:px-8 py-2.5 gap-2 sm:gap-3 shrink-0 justify-start items-center z-40 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-all rounded-lg flex items-center gap-2 border shrink-0 cursor-pointer ${
            activeTab === 'ai' 
              ? 'text-cyan-400 bg-cyan-950/25 border-cyan-500/30' 
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
          }`}
        >
          <Sparkles size={14} className={activeTab === 'ai' ? 'text-cyan-400' : 'text-slate-400'} />
          <span>AI 智能检索式生成 (AI Query Builder)</span>
        </button>
        <button
          onClick={() => setActiveTab('whitelist')}
          className={`px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-all rounded-lg flex items-center gap-2 border shrink-0 cursor-pointer ${
            activeTab === 'whitelist' 
              ? 'text-cyan-400 bg-cyan-950/25 border-cyan-500/30' 
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
          }`}
        >
          <Globe size={14} className={activeTab === 'whitelist' ? 'text-cyan-400' : 'text-slate-400'} />
          <span>官方网址速查 (Official Whitelist)</span>
        </button>
        <button
          onClick={() => setActiveTab('about')}
          aria-current={activeTab === 'about' ? 'page' : undefined}
          className={`px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-all rounded-lg flex items-center gap-2 border shrink-0 cursor-pointer ${
            activeTab === 'about'
              ? 'text-cyan-400 bg-cyan-950/25 border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
          }`}
        >
          <BookOpen size={14} className={activeTab === 'about' ? 'text-cyan-400' : 'text-slate-400'} />
          <span>{uiLang === 'en' ? 'About' : uiLang === 'zh' ? '项目介绍' : '项目介绍 / About'}</span>
        </button>
      </div>

      {activeTab === 'ai' ? (
        <main className="flex-1 flex flex-col xl:flex-row gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6 min-h-0 overflow-y-auto container mx-auto max-w-[1680px]">
        
        {/* Left Column: Input & Formula Result */}
        <div className="flex-1 flex flex-col gap-4 sm:gap-6 min-w-0">
          {/* Input Block */}
          <section id="guided-input-panel" className="bg-slate-900/40 rounded-2xl border border-white/5 p-4 sm:p-6 flex flex-col relative group transition-all hover:border-white/10 shadow-sm shrink-0">
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-[11px] text-cyan-400 uppercase font-bold tracking-[0.15em] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                {t('inputLabel')}
              </label>
              <div className="flex items-center gap-3">
                <AudioTranscriber
                  geminiKey={geminiApiKey}
                  onTranscribe={(transcribedText) => {
                    setInput((prev) => prev ? `${prev} ${transcribedText}` : transcribedText);
                  }}
                  uiLang={uiLang}
                  disabled={loading}
                />
                <span className="text-[10px] text-slate-500 font-mono tracking-tighter opacity-60 hidden sm:inline">INPUT_NATURAL_LANGUAGE</span>
              </div>
            </div>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('inputPlaceholder')}
              className="flex-1 bg-transparent border-none outline-none resize-none text-base sm:text-lg md:text-xl text-slate-100 placeholder:text-slate-600 leading-relaxed font-normal custom-scrollbar overflow-y-auto min-h-[56px]"
            />

            {/* Comparison Mode Configuration Bar */}
            <div id="guided-config-panel" className="flex flex-wrap items-center gap-3 mt-2 py-2 px-1 border-t border-white/5">
              {/* Checkbox Toggle Button */}
              <button
                type="button"
                onClick={() => saveCompareMode(!isCompareMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold leading-none cursor-pointer select-none ${
                  isCompareMode 
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20" 
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-300 hover:bg-white/10"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isCompareMode ? "border-purple-400 bg-purple-500" : "border-slate-500"}`}>
                  {isCompareMode && <Check size={11} className="text-white font-extrabold stroke-[3px]" />}
                </div>
                <span>{uiLang === 'zh' || i18n.language === 'mix' ? "📊 对比模式" : "📊 Comparison Mode"}</span>
              </button>

              {/* Model Selectors */}
              <div className="flex items-center gap-3 flex-wrap text-xs">
                {/* Model A Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {uiLang === 'zh' || i18n.language === 'mix' ? "大模型 A:" : "Model A:"}
                  </span>
                  <select
                    value={`${activeProviderId}:${activeModel}`}
                    onChange={(e) => {
                      const [provId, modName] = e.target.value.split(':');
                      saveActiveProviderId(provId);
                      saveActiveModel(modName);
                    }}
                    className="bg-black/50 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs text-sky-400 focus:outline-none focus:border-cyan-500/50 cursor-pointer font-mono font-semibold"
                  >
                    {providers.map(p => {
                      const mods = p.models.split(',').map(m => m.trim()).filter(Boolean);
                      return mods.map(m => (
                        <option key={`${p.id}:${m}`} value={`${p.id}:${m}`} className="bg-[#05070A]">
                          {p.name} · {m}
                        </option>
                      ));
                    })}
                  </select>
                </div>

                {isCompareMode && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="font-extrabold text-purple-400 text-xs select-none">VS</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {uiLang === 'zh' || i18n.language === 'mix' ? "大模型 B:" : "Model B:"}
                    </span>
                    <select
                      value={`${compareProviderId}:${compareModel}`}
                      onChange={(e) => {
                        const [provId, modName] = e.target.value.split(':');
                        saveCompareProviderId(provId);
                        saveCompareModel(modName);
                      }}
                      className="bg-black/50 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs text-purple-400 focus:outline-none focus:border-purple-500/50 cursor-pointer font-mono font-semibold"
                    >
                      {providers.map(p => {
                        const mods = p.models.split(',').map(m => m.trim()).filter(Boolean);
                        return mods.map(m => (
                          <option key={`${p.id}:${m}`} value={`${p.id}:${m}`} className="bg-[#05070A]">
                            {p.name} · {m}
                          </option>
                        ));
                      })}
                    </select>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-between items-center pt-4 border-t border-white/5 gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Database Selector Pill */}
                <div 
                  className="flex items-center gap-2 bg-black/30 border border-white/10 hover:border-cyan-500/30 rounded-xl px-3 py-1.5 transition-all" 
                  title={`目标数据库平台: ${dbType}`}
                >
                  <Database size={14} className="text-cyan-400 shrink-0" />
                  <select
                    value={dbType}
                    onChange={(e) => setDbType(e.target.value)}
                    className="bg-transparent border-none text-xs font-mono text-slate-300 focus:ring-0 cursor-pointer hover:text-cyan-300 transition-colors uppercase tracking-wider p-0 pr-1 max-w-[260px] truncate"
                  >
                    {DB_TYPES.map(type => (
                      <option key={type} value={type} className="bg-[#05070A] text-slate-200">{type}</option>
                    ))}
                  </select>
                </div>

                {/* Language Preference Pill */}
                <div 
                  className="flex items-center gap-2 bg-black/30 border border-white/10 hover:border-cyan-500/30 rounded-xl px-3 py-1.5 transition-all" 
                  title={`语言偏好: ${langPref}`}
                >
                  <Languages size={14} className="text-cyan-400 shrink-0" />
                  <select
                    value={langPref}
                    onChange={(e) => setLangPref(e.target.value)}
                    className="bg-transparent border-none text-xs font-mono text-slate-300 focus:ring-0 cursor-pointer hover:text-cyan-300 transition-colors uppercase tracking-wider p-0 pr-1"
                  >
                    <option value="双语混合 (Bilingual)" className="bg-[#05070A] text-slate-200">Bilingual (双语混合)</option>
                    <option value="仅中文 (Chinese Only)" className="bg-[#05070A] text-slate-200">ZH Only (仅中文)</option>
                    <option value="仅英文 (English Only)" className="bg-[#05070A] text-slate-200">EN Only (仅英文)</option>
                  </select>
                </div>

                {/* Template Selector Pill */}
                <div 
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all border ${
                    activeTemplateId 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'bg-black/30 border-white/10 hover:border-cyan-500/30'
                  }`}
                  title="检索式逻辑框架模板约束 / Search Formula Framework Template"
                >
                  <Layers size={14} className={activeTemplateId ? "text-amber-400 shrink-0" : "text-cyan-400/70 shrink-0"} />
                  <select
                    value={activeTemplateId || ""}
                    onChange={(e) => handleSelectTemplate(e.target.value ? e.target.value : null)}
                    className={`bg-transparent border-none text-xs font-mono focus:ring-0 cursor-pointer transition-colors uppercase tracking-wider p-0 pr-1 max-w-[240px] sm:max-w-[300px] truncate ${
                      activeTemplateId ? 'text-amber-300 font-bold' : 'text-slate-300 hover:text-cyan-300'
                    }`}
                  >
                    <option value="" className="bg-[#05070A] text-slate-200">框架: 智能组配 (自由)</option>
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.id} className="bg-[#05070A] text-slate-200">
                        框架: {tpl.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsTab('templates');
                      setIsConfigOpen(true);
                    }}
                    title="打开检索式模板库管理面板"
                    className="text-[10px] text-cyan-400 hover:text-cyan-200 bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 px-1.5 py-0.5 rounded cursor-pointer font-bold transition-all ml-0.5"
                  >
                    模板库
                  </button>
                </div>

                {/* Official Whitelist Quick Access */}
                <button
                  type="button"
                  onClick={() => {
                    setQuickSearchKw(input.trim());
                    setIsQuickWhitelistOpen(true);
                  }}
                  className="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-400 hover:text-cyan-300 text-[10px] font-bold rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex items-center gap-1.5 uppercase tracking-widest cursor-pointer shrink-0"
                  title="速查官方白名单数据库"
                >
                  <Globe size={12} className="text-cyan-400" />
                  <span>官方网址速查</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {input && (
                  <button 
                    onClick={reset}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10 rounded-xl flex items-center gap-2 text-xs font-bold cursor-pointer"
                    title={t('reset')}
                  >
                    <RotateCcw size={14} />
                    <span>{t('reset')}</span>
                  </button>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-cyan-500/20 active:scale-[0.98] flex items-center gap-2 group/btn disabled:opacity-30 disabled:shadow-none cursor-pointer text-sm"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{result ? (uiLang === 'zh' || i18n.language === 'mix' ? "重新生成检索式" : "REGENERATE_QUERY") : t('generate')}</span>
                      <Search size={16} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active Template Constraint Banner */}
            {activeTemplate && (
              <div className="mt-3 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0">
                    逻辑框架约束
                  </span>
                  <span className="font-semibold text-amber-300 truncate">
                    {activeTemplate.name}
                  </span>
                  <span className="text-[11px] text-amber-400/70 font-mono hidden md:inline truncate">
                    {activeTemplate.framework}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsTab('templates');
                      setIsConfigOpen(true);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer"
                  >
                    配置 / 切换
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate(null)}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-white/10 transition-colors"
                    title="清除模板约束"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Batch Task Selector */}
          {results.length > 1 && (
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 shrink-0">
              {results.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                    activeIndex === idx 
                      ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                      : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                  }`}
                  title={r._inputLine}
                >
                  {r._isLoading && <div className="w-2.5 h-2.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin shrink-0" />}
                  <span className="opacity-50">T{idx + 1}:</span>
                  <span className="max-w-[280px] truncate">{r._inputLine.length > 32 ? r._inputLine.substring(0, 32) + '...' : r._inputLine}</span>
                </button>
              ))}
            </div>
          )}

          {/* Formula Output Block */}
          <div 
            id="guided-output-panel" 
            style={{ 
              minHeight: screenHeight < 700 ? '220px' : screenHeight < 800 ? '260px' : '300px'
            }}
            className={`flex flex-col flex-1 rounded-2xl border transition-all duration-700 relative shadow-inner ${
              result ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-slate-900/20 border-white/5 grayscale pointer-events-none'
            }`}
          >
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.1),transparent_70%)]"
                />
              )}
            </AnimatePresence>
            
            <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col min-h-0 relative z-10 font-sans">
              <div className="flex flex-wrap justify-between items-center mb-3.5 gap-2.5">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-cyan-400/80 uppercase font-bold tracking-[0.2em]">
                    {isCompareMode ? (uiLang === 'zh' || i18n.language === 'mix' ? "大模型双语语义比对诊断" : "AI MODEL COMPARISON DIAGNOSIS") : t('formulaTitle')}
                  </label>
                  {result && (result._fromCache || result._compareResult?._fromCache) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] rounded-full font-bold uppercase tracking-widest animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                      <Sparkles size={11} className="text-emerald-400" /> ⚡️ {uiLang === 'zh' || i18n.language === 'mix' ? '缓存加速' : 'CACHE ACTIVE'}
                    </span>
                  )}
                  {result && !result._isLoading && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/25" title="端到端请求响应耗时">
                      <Zap size={10} className="text-cyan-400" />
                      {result._fromCache ? '0ms' : `${result._latencyMs || 0}ms`}
                    </span>
                  )}
                </div>
                {result && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Display Modes Toolbar */}
                    <div className="flex items-center gap-1.5 bg-black/40 rounded-lg p-1 border border-cyan-500/20">
                      {/* Line wrap toggle */}
                      <button
                        type="button"
                        onClick={() => setIsWrapFormula(!isWrapFormula)}
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded flex items-center gap-1 transition-all cursor-pointer ${
                          isWrapFormula ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={isWrapFormula ? "切换为单行横向滚动模式（方便整行复制）" : "切换为自动折行模式（方便分行阅读）"}
                      >
                        {isWrapFormula ? <WrapText size={11} /> : <AlignLeft size={11} />}
                        <span className="hidden sm:inline">{isWrapFormula ? "折行" : "单行"}</span>
                      </button>

                      {/* Font size adjustments */}
                      <div className="flex items-center border-l border-white/10 pl-1.5 text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => setFormulaFontSize('sm')}
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${formulaFontSize === 'sm' ? 'text-cyan-300 font-bold bg-white/10' : 'text-slate-400 hover:text-white'}`}
                          title="小号字体"
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormulaFontSize('base')}
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${formulaFontSize === 'base' ? 'text-cyan-300 font-bold bg-white/10' : 'text-slate-400 hover:text-white'}`}
                          title="标准字体"
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormulaFontSize('lg')}
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${formulaFontSize === 'lg' ? 'text-cyan-300 font-bold bg-white/10' : 'text-slate-400 hover:text-white'}`}
                          title="大号字体"
                        >
                          A+
                        </button>
                      </div>

                      {/* Full View Expand */}
                      <button
                        type="button"
                        onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded flex items-center gap-1 border-l border-white/10 pl-1.5 transition-all cursor-pointer ${
                          isFormulaExpanded ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={isFormulaExpanded ? "收起全览" : "展开完整显示（解除高度限制）"}
                      >
                        {isFormulaExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                        <span className="hidden sm:inline">{isFormulaExpanded ? "收起" : "全览"}</span>
                      </button>
                    </div>

                    {/* Basic / Mapped toggle */}
                    <div className="flex bg-black/40 rounded-lg p-1 border border-cyan-500/20">
                      <button
                        onClick={() => setShowMapped(false)}
                        className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-all cursor-pointer ${
                          !showMapped ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {t('basicWeb')}
                      </button>
                      <button
                        onClick={() => setShowMapped(true)}
                        className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-all cursor-pointer ${
                          showMapped ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {t('schemaMapped')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Syntax Highlight Legend & Real-time Validation Status */}
              {result && !result._isLoading && (
                <div className="syntax-legend-bar flex flex-wrap items-center justify-between gap-2.5 text-[10px] font-mono select-none mb-3 px-3 py-2 bg-black/30 rounded-xl border border-cyan-500/10 transition-colors">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-slate-400 [.theme-light_&]:text-slate-600 font-bold mr-0.5">🎨 {uiLang === 'zh' || i18n.language === 'mix' ? "语法图例:" : "Syntax Legend:"}</span>
                    <span className="legend-and inline-flex items-center gap-1 text-amber-300 [.theme-light_&]:text-amber-800 font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 [.theme-light_&]:bg-amber-600"></span>AND</span>
                    <span className="legend-or inline-flex items-center gap-1 text-cyan-300 [.theme-light_&]:text-sky-700 font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 [.theme-light_&]:bg-sky-600"></span>OR</span>
                    <span className="legend-not inline-flex items-center gap-1 text-rose-400 [.theme-light_&]:text-red-700 font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 [.theme-light_&]:bg-red-600"></span>NOT</span>
                    <span className="legend-prox inline-flex items-center gap-1 text-fuchsia-300 [.theme-light_&]:text-fuchsia-800 font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 [.theme-light_&]:bg-fuchsia-600"></span>NEAR/ADJ</span>
                    <span className="legend-field inline-flex items-center gap-1 text-violet-300 [.theme-light_&]:text-purple-900 font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 [.theme-light_&]:bg-purple-600"></span>{uiLang === 'zh' || i18n.language === 'mix' ? "字段标签" : "Fields"}</span>
                    <span className="legend-phrase inline-flex items-center gap-1 text-emerald-300 [.theme-light_&]:text-green-800 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 [.theme-light_&]:bg-green-600"></span>{uiLang === 'zh' || i18n.language === 'mix' ? '"精确词组"' : '"Phrases"'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Real-time Syntax Validation Indicator */}
                    {syntaxValidation && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono ${
                        syntaxValidation.isValid
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                      }`}>
                        {syntaxValidation.isValid ? (
                          <>
                            <CheckCircle2 size={11} className="text-emerald-400" />
                            <span>{uiLang === 'zh' || i18n.language === 'mix' ? "实时语法验证通过" : "Syntax Valid"}</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={11} className="text-rose-400" />
                            <span>{uiLang === 'zh' || i18n.language === 'mix' ? `语法警示 (${syntaxValidation.errors.length}处错误)` : `Syntax Alert (${syntaxValidation.errors.length})`}</span>
                          </>
                        )}
                      </span>
                    )}

                    {/* Quick test button */}
                    <button
                      type="button"
                      onClick={handleInjectSampleSyntaxError}
                      className="text-[9px] text-slate-500 hover:text-amber-300 transition-colors font-mono cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5"
                      title={uiLang === 'zh' || i18n.language === 'mix' ? "注入全角字符/悬空算符示例，快速检验红色高亮提示与一键修复" : "Test error detection & auto-fix"}
                    >
                      <Wrench size={10} />
                      <span>{uiLang === 'zh' || i18n.language === 'mix' ? "测试检测" : "Test Check"}</span>
                    </button>
                  </div>
                </div>
              )}
              
              {!result ? (
                <div className="flex-1 flex flex-col justify-center items-center text-slate-600 text-xs gap-3">
                  <span className="font-mono tracking-widest uppercase">
                    {uiLang === 'zh' || i18n.language === 'mix' ? "请在上方输入自然语言检索式并生成" : "No formulas generated yet"}
                  </span>
                </div>
              ) : isCompareMode ? (
                /* COMPARISON MODE SIDE BY SIDE CARDS */
                <div className="flex-1 flex flex-col gap-3 min-h-0 mb-2">
                  {/* Recharts Core Keyword Coverage Comparison Chart */}
                  <ComparisonKeywordChart
                    modelAResult={result}
                    modelBResult={result._compareResult}
                    modelAName={activeModel}
                    modelBName={compareModel}
                    uiLang={uiLang}
                    theme={theme}
                  />

                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                    {renderCompareCard(
                      uiLang === 'zh' || i18n.language === 'mix' ? "大模型 A (主流模型)" : "Model A (Active)", 
                      result, 
                      activeModel, 
                      result._isLoading ?? false, 
                      true
                    )}
                    {renderCompareCard(
                      uiLang === 'zh' || i18n.language === 'mix' ? "大模型 B (比对模型)" : "Model B (Comparison)", 
                      result._compareResult, 
                      compareModel, 
                      result._compareResult?._isLoading ?? (result._isLoading ?? false), 
                      false
                    )}
                  </div>
                </div>
              ) : (
                /* ORIGINAL SINGLE MODEL DISPLAY VIEWPORT */
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                  <div className="flex flex-col gap-3 w-full shrink-0">
                    {effectiveA.isCustomized && (
                      <div className="flex justify-between items-center bg-cyan-950/40 border border-cyan-500/20 px-3 py-1.5 rounded-lg text-[10px] text-cyan-300 font-mono tracking-wide animate-fade-in mb-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={11} className="text-cyan-400 animate-pulse" />
                          <span>{uiLang === 'zh' || i18n.language === 'mix' ? "已应用选定的关键词组合（实时构建）" : "Active keyword selections applied (live reconstructed)"}</span>
                        </div>
                        <button 
                          onClick={handleResetWords}
                          className="text-cyan-400 font-bold hover:text-cyan-200 underline cursor-pointer focus:outline-none"
                        >
                          {uiLang === 'zh' || i18n.language === 'mix' ? "重置所有选择" : "Reset choices"}
                        </button>
                      </div>
                    )}
                    <div 
                      style={{
                        minHeight: '130px',
                        maxHeight: isFormulaExpanded ? 'none' : (screenHeight < 700 ? '220px' : screenHeight < 850 ? '320px' : '420px'),
                        height: isFormulaExpanded ? 'auto' : undefined
                      }}
                      className={`formula-code-box font-mono ${
                        formulaFontSize === 'sm' ? 'text-xs' : formulaFontSize === 'lg' ? 'text-base md:text-lg' : 'text-sm md:text-base'
                      } leading-relaxed tracking-normal overflow-y-auto custom-scrollbar select-all p-4 sm:p-5 rounded-xl border ${
                        syntaxValidation && !syntaxValidation.isValid
                          ? 'border-rose-500/70 shadow-[0_0_16px_rgba(244,63,94,0.2)] ring-1 ring-rose-500/40'
                          : 'border-cyan-500/20 shadow-inner'
                      } w-full block transition-all ${
                        isWrapFormula ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
                      } ${result?._isLoading ? 'animate-pulse text-cyan-500/50' : ''}`}
                    >
                      {result ? (
                        <HighlightedBooleanQuery
                          query={showMapped ? (effectiveA.fieldSpecificQuery || effectiveA.booleanQuery) : effectiveA.booleanQuery}
                        />
                      ) : (
                        "Formula will appear here..."
                      )}
                    </div>

                    {/* 实时语法验证警示与自动纠错提示 (醒目红色波浪/线条与修复指引) */}
                    {result && !result._isLoading && syntaxValidation && (
                      <SyntaxValidationAlert
                        validation={syntaxValidation}
                        onApplyFix={handleApplySyntaxFix}
                        uiLang={uiLang}
                        className="mt-1"
                      />
                    )}

                    {!result?._isLoading && result?.keywords && (
                      <VisualQueryTree
                        keywords={result.keywords}
                        isModelB={false}
                        activeIndex={activeIndex}
                        selectedWords={selectedWords}
                        onToggleWord={(isB, gIdx, word) => toggleWordSelection(isB, gIdx, word)}
                        operatorStyle={operatorStyle}
                        uiLang={uiLang as "zh" | "mix"}
                      />
                    )}

                    {result && result._isLoading && (
                      <div className="flex-1 overflow-y-auto custom-scrollbar mt-2 space-y-2">
                        <h4 className="text-[10px] text-cyan-400/50 font-mono tracking-widest uppercase mb-3 animate-pulse">正在提取概念并映射数据库字段格式 (Mapping custom DB fields)...</h4>
                        {[1, 2].map((i) => (
                          <div key={i} className="h-10 bg-white/5 border border-white/5 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    )}

                    {result && !result._isLoading && showMapped && Array.isArray(result.schemaMapping) && result.schemaMapping.length > 0 && (
                      <div className="flex-1 overflow-y-auto custom-scrollbar mt-2">
                        <h4 className="text-[10px] text-cyan-400/70 font-mono tracking-widest uppercase mb-3">Field Mapping Logic</h4>
                        <div className="space-y-2">
                          {result.schemaMapping.map((map, i) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-2 bg-white/5 border border-white/5 p-3 rounded-lg text-sm">
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-400/10 px-1.5 py-0.5 rounded">[{map.field}]</span>
                              </div>
                              <div className="flex-1 text-slate-300 text-xs">
                                <span className="text-cyan-200 font-medium">"{map.mappedConcept}"</span> - <span className="opacity-70">{map.reason}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {result && !result._isLoading && (
                    <div className="mt-4 pt-3 border-t border-cyan-500/15 [.theme-light_&]:border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 w-full shrink-0">
                      <span className="text-[10px] text-cyan-500/60 font-mono italic flex items-center gap-2 shrink-0">
                        <Check size={10} className="text-emerald-500" /> {t('processedWith')}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 max-w-full lg:justify-end justify-start">
                        <button 
                          onClick={() => handleCopy(showMapped ? (effectiveA.fieldSpecificQuery || effectiveA.booleanQuery) : effectiveA.booleanQuery)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-black tracking-widest flex items-center gap-1.5 transition-all mr-2"
                        >
                          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          {copied ? t('copied') : t('copyCode')}
                        </button>
                        
                        {Array.isArray(result.suggestedUrls) && result.suggestedUrls.map((urlItem, i) => (
                          <a
                            key={i}
                            href={urlItem.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              const queryToCopy = effectiveA.fieldSpecificQuery || effectiveA.booleanQuery;
                              
                              // Clipboard copy
                              if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(queryToCopy);
                              } else {
                                const textarea = document.createElement('textarea');
                                textarea.style.position = 'fixed';
                                textarea.style.opacity = '0';
                                textarea.value = queryToCopy;
                                document.body.appendChild(textarea);
                                textarea.select();
                                try {
                                  document.execCommand('copy');
                                } catch (err) {}
                                document.body.removeChild(textarea);
                              }
                              
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                              setJumpDbName(urlItem.name || "数据库 (Database)");
                            }}
                            className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1.5 hover:bg-emerald-600/30 uppercase tracking-widest animate-fade-in"
                          >
                            {urlItem.name || t('directSearch')}
                            <ExternalLink size={12} />
                          </a>
                        ))}

                        {/* Matched official whitelist database shortcuts */}
                        {matchingWhitelistLinks.map((wlItem, wlIdx) => (
                          <button
                            key={`matched-wl-${wlIdx}`}
                            onClick={() => {
                              const queryToCopy = showMapped ? (effectiveA.fieldSpecificQuery || effectiveA.booleanQuery) : effectiveA.booleanQuery;
                              
                              // Clipboard copy
                              if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(queryToCopy);
                              } else {
                                const textarea = document.createElement('textarea');
                                textarea.style.position = 'fixed';
                                textarea.style.opacity = '0';
                                textarea.value = queryToCopy;
                                document.body.appendChild(textarea);
                                textarea.select();
                                try {
                                  document.execCommand('copy');
                                } catch (err) {}
                                document.body.removeChild(textarea);
                              }
                              
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                              setJumpDbName(wlItem.name);
                              window.open(wlItem.url, '_blank');
                            }}
                            className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 text-[10px] font-bold rounded-lg border border-cyan-500/30 transition-all flex items-center gap-1.5 hover:bg-cyan-600/30 uppercase tracking-widest animate-fade-in cursor-pointer"
                            title={`官方白名单: ${wlItem.name}`}
                          >
                            <span>{wlItem.name}</span>
                            <Globe size={11} className="text-cyan-400" />
                            <ExternalLink size={11} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optional Inline Rating / Feedback module (Moved inside scrollable viewport so they continuous scroll together) */}
                  {result && !result._isLoading && (
                    <div id="guided-feedback-panel" className="mt-4 pt-4 border-t border-cyan-500/15 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                          <span className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-300">
                            {uiLang === 'zh' || i18n.language === 'mix' ? '检索意图评测与纠偏建议' : 'QUERY RELEVANCE RATING & BIAS ADVISOR'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 mr-1.5">
                            {uiLang === 'zh' || i18n.language === 'mix' ? '主观关联度评价:' : 'Relevance Score:'}
                          </span>
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => setFeedbackRating(starVal)}
                              className="p-0.5 hover:scale-125 transition-transform cursor-pointer"
                              title={`${starVal} ★`}
                            >
                              <Star 
                                size={14} 
                                fill={starVal <= feedbackRating ? "#22d3ee" : "transparent"} 
                                className={starVal <= feedbackRating ? "text-cyan-400 font-bold" : "text-slate-600 hover:text-cyan-400/60"} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Feedback Form Subtitle / Dynamic Checklist */}
                      {feedbackRating > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col gap-2.5 bg-black/30 border border-cyan-500/10 p-3 rounded-xl"
                        >
                          {/* Checklists */}
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 text-left">
                              {uiLang === 'zh' || i18n.language === 'mix' ? '选择细节诊断标签(可选):' : 'Select quick tags (Optional):'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(feedbackRating >= 4 
                                ? (uiLang === 'zh' || i18n.language === 'mix' ? ["准确度高", "同义词丰富", "算符逻辑正确", "字段映射合理"] : ["Accurate", "Rich Synonyms", "Correct Logic", "Perfect Fields"])
                                : (uiLang === 'zh' || i18n.language === 'mix' ? ["缺失关键同义词", "逻辑算符有误", "范围过大/噪音多", "检索语种不符", "缺少核心概念"] : ["Missing Synonyms", "Operator Error", "Too Broad", "Wrong Language", "Missing Core"])
                              ).map((tagStr) => {
                                const isSelected = feedbackTags.includes(tagStr);
                                return (
                                  <button
                                    key={tagStr}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setFeedbackTags(prev => prev.filter(t => t !== tagStr));
                                      } else {
                                        setFeedbackTags(prev => [...prev, tagStr]);
                                      }
                                    }}
                                    className={`text-[10px] px-2.5 py-0.5 rounded transition-all font-bold border cursor-pointer select-none ${
                                      isSelected 
                                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/45 shadow-[0_0_8px_rgba(6,182,212,0.15)]' 
                                        : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                                    }`}
                                  >
                                    {tagStr}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Custom Written comments */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] uppercase font-bold text-slate-400">
                                {uiLang === 'zh' || i18n.language === 'mix' ? '具体修正意见与期望补充的同义词/算符逻辑 (可选):' : 'Custom correction intent / expected synonyms (Optional):'}
                              </label>
                              {feedbackRating <= 3 && (
                                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest animate-pulse leading-none select-none">
                                  🤖 支持 AI 意见拟合优化
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                value={feedbackWritten}
                                onChange={(e) => setFeedbackWritten(e.target.value)}
                                placeholder={
                                  feedbackRating >= 4 
                                    ? (uiLang === 'zh' || i18n.language === 'mix' ? "有何改进点？例如：'添加某些特定词汇'..." : "Any detail tips? e.g., 'Add specific close synonym'...") 
                                    : (uiLang === 'zh' || i18n.language === 'mix' ? "请说明具体问题，例如: '缺失xxx近义词且逻辑与应该为或'..." : "Describe query issues, e.g., 'missing synonym xxx' or 'operators nesting wrong'...")
                                }
                                className="flex-1 bg-black/45 border border-white/10 rounded-lg text-xs px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-[#06b6d4]"
                              />

                              <button
                                type="button"
                                onClick={handleFeedbackSubmitOnly}
                                className="bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all whitespace-nowrap active:scale-95 cursor-pointer"
                              >
                                {uiLang === 'zh' || i18n.language === 'mix' ? "提交评分" : "LOG FEEDBACK"}
                              </button>
                              
                              {feedbackRating <= 3 && (
                                <button
                                  type="button"
                                  onClick={handleFeedbackRefine}
                                  disabled={isRefiningAI}
                                  className="bg-purple-600 hover:bg-purple-550 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)] hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-purple-500/40 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all whitespace-nowrap active:scale-95 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                                >
                                  {isRefiningAI ? (
                                    <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-0.5" />
                                  ) : (
                                    "🤖 AI 双向重构"
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Feedback Action Alert Notification */}
                      {feedbackNotice && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-[11px] font-bold text-cyan-300 py-1.5 bg-cyan-950/40 rounded-lg border border-cyan-500/25 px-3 flex flex-wrap items-center justify-between gap-2 font-mono text-left"
                        >
                          <span>{feedbackNotice}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSettingsTab('trajectories');
                              setIsConfigOpen(true);
                            }}
                            className="text-[10px] text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer shrink-0 ml-auto flex items-center gap-1"
                          >
                            <TrendingUp size={11} />
                            <span>{uiLang === 'zh' || i18n.language === 'mix' ? "查看优化轨迹与修正日志 →" : "View Trajectory Log →"}</span>
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Semantics & Explanation */}
        <aside className="w-full xl:w-96 2xl:w-[420px] flex flex-col gap-4 sm:gap-6 shrink-0">
          {/* Keywords panel */}
          <div id="guided-refinement-panel" className="flex-1 bg-slate-900/60 rounded-2xl border border-white/5 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-3 bg-cyan-500 rounded-full"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">{t('semanticMap')}</h3>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{t('topicExpansion')}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {isCompareMode && result && result._compareResult && (
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 mb-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSemanticActiveModel('A')}
                    className={`flex-1 text-[9px] uppercase font-black tracking-wider py-1.5 rounded transition-all cursor-pointer ${
                      semanticActiveModel === 'A' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Model A {uiLang === 'zh' || i18n.language === 'mix' ? "词表" : "Terms"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSemanticActiveModel('B')}
                    className={`flex-1 text-[9px] uppercase font-black tracking-wider py-1.5 rounded transition-all cursor-pointer ${
                      semanticActiveModel === 'B' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Model B {uiLang === 'zh' || i18n.language === 'mix' ? "词表" : "Terms"}
                  </button>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {result && result._isLoading ? (
                  // Nice skeleton cards during active progressive streaming
                  [1, 2, 3].map((skeletonIdx) => (
                    <div 
                      key={`skeleton-${skeletonIdx}`}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-white/10 rounded w-1/4" />
                        <div className="w-2 h-2 rounded-full bg-cyan-500/30" />
                      </div>
                      <div className="h-5 bg-white/10 rounded w-3/4" />
                      <div className="space-y-2">
                        <div className="h-4 bg-white/5 rounded w-5/6" />
                        <div className="h-4 bg-white/5 rounded w-4/6" />
                      </div>
                    </div>
                  ))
                ) : (
                  (() => {
                    const activeSemanticResponse = (isCompareMode && semanticActiveModel === 'B') ? result?._compareResult : result;
                    const isSemanticB = isCompareMode && semanticActiveModel === 'B';

                    if (activeSemanticResponse && Array.isArray(activeSemanticResponse.keywords) && activeSemanticResponse.keywords.length > 0) {
                      return (
                        <div className="space-y-4">
                          {activeSemanticResponse.keywords.map((group, idx) => (
                            <motion.div
                              key={group.original}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="p-4 rounded-xl bg-white/5 border border-white/10 group hover:border-cyan-500/30 transition-all text-left animate-fade-in"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <span className={`text-[10px] font-mono opacity-100 ${isSemanticB ? 'text-purple-400' : 'text-cyan-400'}`}>#0{idx + 1} {t('coreKeyword')}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleGroupSelection(isSemanticB, idx, group)}
                                  className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase transition-all cursor-pointer ${
                                    isGroupSelected(isSemanticB, idx, group)
                                      ? (isSemanticB ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30")
                                      : "bg-slate-800/40 text-slate-500 border border-transparent"
                                  }`}
                                  title={uiLang === 'zh' || i18n.language === 'mix' ? "切换整组词的选定状态" : "Toggle all terms in group"}
                                >
                                  {isGroupSelected(isSemanticB, idx, group)
                                    ? (uiLang === 'zh' || i18n.language === 'mix' ? "取消整组" : "CLEAR ALL")
                                    : (uiLang === 'zh' || i18n.language === 'mix' ? "选择整组" : "SELECT ALL")
                                  }
                                </button>
                              </div>
                              
                              <div className="flex items-center gap-1.5 mb-3 select-none">
                                <button
                                  type="button"
                                  onClick={() => toggleWordSelection(isSemanticB, idx, group.original)}
                                  className={`p-1.5 rounded-lg flex items-center justify-between flex-1 transition-all border text-left cursor-pointer ${
                                    isWordSelected(isSemanticB, idx, group.original)
                                      ? (isSemanticB ? "bg-purple-950/45 border-purple-500/50 text-white font-bold" : "bg-cyan-950/45 border-cyan-500/50 text-white font-bold")
                                      : "opacity-40 line-through border-transparent text-slate-500 bg-black/10"
                                  }`}
                                >
                                  <span className="text-xs uppercase tracking-tight truncate font-sans font-medium">{group.original}</span>
                                  <span className="text-[9px] font-mono opacity-80 uppercase shrink-0">
                                    {isWordSelected(isSemanticB, idx, group.original) ? "✓" : "✖"}
                                  </span>
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-1.5 mb-2.5 items-center select-none">
                                <span className="text-[9px] font-mono text-slate-600 uppercase w-5 shrink-0 text-left">ZH:</span>
                                <div className="flex-1 flex flex-wrap gap-1">
                                  {Array.isArray(group.zhSynonyms) && group.zhSynonyms.length > 0 ? (
                                    group.zhSynonyms.map((syn, sIdx) => {
                                      const active = isWordSelected(isSemanticB, idx, syn);
                                      return (
                                        <button
                                          type="button"
                                          key={`zh-${sIdx}`}
                                          onClick={() => toggleWordSelection(isSemanticB, idx, syn)}
                                          className={`text-[10px] font-medium px-2 py-0.5 rounded transition-all flex items-center gap-1 border cursor-pointer ${
                                            active
                                              ? (isSemanticB ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-cyan-500/15 border-cyan-500/40 text-cyan-300")
                                              : "bg-black/15 border-transparent text-slate-500 opacity-40 line-through"
                                          }`}
                                        >
                                          {syn}
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <span className="text-[10px] text-slate-600 italic">None</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1.5 items-center select-none">
                                <span className="text-[9px] font-mono text-slate-600 uppercase w-5 shrink-0 text-left">EN:</span>
                                <div className="flex-1 flex flex-wrap gap-1">
                                  {Array.isArray(group.enSynonyms) && group.enSynonyms.length > 0 ? (
                                    group.enSynonyms.map((syn, sIdx) => {
                                      const active = isWordSelected(isSemanticB, idx, syn);
                                      return (
                                        <button
                                          type="button"
                                          key={`en-${sIdx}`}
                                          onClick={() => toggleWordSelection(isSemanticB, idx, syn)}
                                          className={`text-[10px] font-medium px-2 py-0.5 rounded transition-all flex items-center gap-1 border cursor-pointer italic ${
                                            active
                                              ? (isSemanticB ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-cyan-500/15 border-cyan-500/40 text-cyan-300")
                                              : "bg-black/15 border-transparent text-slate-500 opacity-40 line-through"
                                          }`}
                                        >
                                          {syn}
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <span className="text-[10px] text-slate-600 italic">None</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          
                          <p className="text-[9px] text-slate-500 mt-2 hover:text-slate-400 transition-colors uppercase font-mono tracking-tighter leading-normal select-none">
                            💡 {uiLang === 'zh' || i18n.language === 'mix' ? "提示：点击词条可在此检索式中排除或重新包含该关联词" : "Tip: click terms to exclude or include them in final query formula"}
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex flex-col items-center justify-center h-full opacity-10 py-12 select-none">
                          <Search size={40} />
                          <p className="mt-4 text-[10px] font-mono tracking-tighter uppercase">{t('waitingInput')}</p>
                        </div>
                      );
                    }
                  })()
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Reasoning / Strategy / Stats block */}
          <div className="flex-shrink-0 bg-slate-900/60 rounded-2xl border border-white/5 p-6 flex flex-col gap-4 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles size={80} />
            </div>
            
            <div className="relative z-10">
              <span className="text-[10px] text-slate-500 uppercase font-black block mb-2 tracking-widest flex items-center gap-2">
                <Lightbulb size={12} className="text-orange-400" /> {t('insightTitle')}
              </span>
              
              <div className="space-y-4">
                {result && result._isLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/10 rounded w-5/6" />
                    <div className="h-3 bg-white/10 rounded w-4/6" />
                  </div>
                ) : (
                  <>
                    {result?._reasoning && (
                      <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-cyan-400 uppercase font-black tracking-widest flex items-center gap-1">
                            <Sparkles size={11} className="text-cyan-400" /> Reasoning Path / 推理路径
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedReasoning(!expandedReasoning)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer hover:underline"
                          >
                            {expandedReasoning ? (uiLang === 'zh' || i18n.language === 'mix' ? "收起" : "Less") : (uiLang === 'zh' || i18n.language === 'mix' ? "展开全部" : "Expand")}
                          </button>
                        </div>
                        <p className={`text-[11px] text-cyan-100/70 leading-relaxed italic ${expandedReasoning ? '' : 'line-clamp-6'} overflow-y-auto custom-scrollbar max-h-56`}>
                          {result._reasoning}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      {result ? result.explanation : t('insightDesc')}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="relative z-10 border-t border-white/5 pt-3">
               <div className="flex justify-between items-end">
                  <div className="text-[10px] font-mono text-cyan-400/70 uppercase"><span className="font-bold">{t('recallBoost')}</span></div>
                  <div className="h-4 flex items-end gap-1">
                    {[0.2, 0.4, 0.7, 0.5, 0.9, 1.0].map((h, i) => (
                      <div key={i} className="w-1 bg-cyan-500/40 rounded-t-sm" style={{ height: `${h * 100}%` }}></div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </aside>
      </main>
      ) : activeTab === 'whitelist' ? (
        <main className="flex-1 flex flex-col gap-6 p-3 sm:p-6 overflow-y-auto min-h-0 container mx-auto max-w-[1680px]">
          <OfficialWhitelist />
        </main>
      ) : (
        <ProjectOverview
          onStart={() => setActiveTab('ai')}
          onOpenWhitelist={() => setActiveTab('whitelist')}
        />
      )}

      {/* Footer System Bar */}
      <footer className="shrink-0 min-h-10 border-t border-white/5 flex flex-wrap items-center justify-between px-4 sm:px-8 py-2 sm:py-0 bg-[#05070A] gap-2 text-center sm:text-left transition-colors">
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            {t('sysOpt')}
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-[10px] text-slate-500 font-mono tracking-tighter flex-wrap">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors flex items-center" onClick={() => setIsHistoryOpen(true)}>
              <History size={12} className="mr-1" /> {t('historyButton')}
            </span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors flex items-center" onClick={() => setIsConfigOpen(true)}>
              <Settings size={12} className="mr-1" /> {t('settings')}
            </span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors flex items-center" onClick={() => setIsStatsOpen(true)}>
              <BarChart2 size={12} className="mr-1" /> {t('statsButton')}
            </span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors flex items-center" onClick={() => setActiveTab('about')}>
              <BookOpen size={12} className="mr-1" /> {uiLang === 'en' ? 'About' : '项目介绍'}
            </span>
            <a href="https://github.com/HoraceCh/Information-Retrieval-Tool#readme" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">README</a>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors hidden sm:inline">DB_STATUS: OK</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter hidden md:block">
          CTX_ID: {loading ? t('processing') : (result ? t('genComplete') : t('waitInit'))} // BUILD_HASH: 0x55F2A
        </div>
      </footer>

      {/* Usage Stats Modal */}
      <AnimatePresence>
        {isStatsOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <BarChart2 size={16} className="text-cyan-400" />
                  {t('statsTitle')}
                </h3>
                <button onClick={() => setIsStatsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Sub-tab selection indicator */}
              <div className="px-6 py-0 border-b border-white/5 bg-slate-900/40 flex justify-start shrink-0 select-none gap-4">
                <button
                  type="button"
                  onClick={() => setStatsSubTab('traffic')}
                  className={`text-[11px] font-bold uppercase tracking-widest py-2.5 border-b-2 transition-all cursor-pointer ${
                    statsSubTab === 'traffic' ? 'text-cyan-300 border-cyan-500' : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  {uiLang === 'zh' || i18n.language === 'mix' ? '大模型吞吐统计 / Tokens' : 'Token Usage'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatsSubTab('feedback')}
                  className={`text-[11px] font-bold uppercase tracking-widest py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    statsSubTab === 'feedback' ? 'text-cyan-300 border-cyan-500' : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  {uiLang === 'zh' || i18n.language === 'mix' ? '主观评测与纠偏反馈' : 'Feedback Analytics'}
                  {feedbacks.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 text-[9px] rounded-full scale-90 font-black">
                      {feedbacks.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50 custom-scrollbar">
                {statsSubTab === 'feedback' ? (
                  <FeedbackAnalytics 
                    feedbacks={feedbacks}
                    onClearAll={() => {
                      if (window.confirm(uiLang === 'zh' || i18n.language === 'mix' ? "确定要清空所有的纠偏反馈分析数据吗？" : "Are you sure you want to delete all feedback logs?")) {
                        saveFeedbacksLocally([]);
                      }
                    }}
                    onDeleteOne={(id) => {
                      saveFeedbacksLocally(feedbacks.filter(f => f.id !== id));
                    }}
                    lang={uiLang}
                  />
                ) : Object.keys(usageStats).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-500 opacity-50">
                    <BarChart2 size={48} className="mb-4" />
                    <p className="text-sm uppercase tracking-widest font-bold">{t('statsNoData')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {Object.entries(usageStats).map(([provId, models]) => {
                      const relatedProvider = providers.find(p => p.id === provId);
                      const providerName = relatedProvider ? relatedProvider.name : provId;
                      return (
                        <div key={provId} className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                          <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                            {relatedProvider?.isGemini ? <Globe size={14} className="text-emerald-400"/> : <Server size={14} className="text-amber-400"/>}
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{providerName}</h4>
                          </div>
                          <div className="p-4 flex flex-col gap-4">
                            {Object.entries(models).map(([model, stats]) => (
                              <div key={model} className="flex flex-col gap-2">
                                <div className="text-sm font-mono text-cyan-400 font-bold">{model}</div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('statsQueries')}</div>
                                    <div className="text-xl font-mono text-white">{stats.queries}</div>
                                  </div>
                                  <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('statsSuccess')}</div>
                                    <div className="text-xl font-mono text-emerald-400">
                                      {stats.queries > 0 ? Math.round((stats.successes / stats.queries) * 100) : 0}%
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-0.5">
                                      {stats.successes} succ / {stats.failures} fail
                                    </div>
                                  </div>
                                  <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('statsTokens')}</div>
                                    <div className="text-xl font-mono text-cyan-200">{stats.totalTokens.toLocaleString()}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config Modal */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl xl:max-w-5xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Settings size={16} className="text-cyan-400" />
                  {t('configTitle')}
                </h3>
                <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Settings Sub-Tabs */}
              <div className="px-6 py-0 border-b border-white/5 bg-slate-900/40 flex justify-start shrink-0 select-none gap-4">
                <button
                  type="button"
                  onClick={() => setSettingsTab('api')}
                  className={`text-[11px] font-bold uppercase tracking-widest py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    settingsTab === 'api' ? 'text-cyan-300 border-cyan-500' : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  <Key size={13} />
                  <span>{t('apiTab')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('templates')}
                  className={`text-[11px] font-bold uppercase tracking-widest py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    settingsTab === 'templates' ? 'text-amber-300 border-amber-500' : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  <Layers size={13} />
                  <span>{t('templateTab')}</span>
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] rounded-full scale-90 font-black">
                    {templates.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('trajectories')}
                  className={`text-[11px] font-bold uppercase tracking-widest py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    settingsTab === 'trajectories' ? 'text-cyan-300 border-cyan-500' : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  <TrendingUp size={13} />
                  <span>{uiLang === 'zh' || i18n.language === 'mix' ? "AI 优化轨迹查看器" : "Optimization Trajectories"}</span>
                  {trajectories.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 text-[9px] rounded-full scale-90 font-black">
                      {trajectories.length}
                    </span>
                  )}
                </button>
              </div>

              {settingsTab === 'templates' ? (
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900/50">
                  <TemplateLibrary
                    templates={templates}
                    activeTemplateId={activeTemplateId}
                    onSaveTemplates={handleSaveTemplates}
                    onSelectTemplate={handleSelectTemplate}
                  />
                </div>
              ) : settingsTab === 'trajectories' ? (
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900/50">
                  <OptimizationTrajectoryViewer
                    trajectories={trajectories}
                    onClearAll={() => saveTrajectoriesLocally([])}
                    onDeleteOne={(id) => saveTrajectoriesLocally(trajectories.filter(t => t.id !== id))}
                    onApplyTrajectory={handleApplyTrajectory}
                    onLoadSample={handleLoadSampleTrajectory}
                    uiLang={uiLang}
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                
                {/* User API Key Guidance Banner */}
                <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3.5 text-xs text-cyan-200/90 leading-relaxed flex gap-3 items-start shadow-inner">
                  <Key size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-cyan-300">🔑 API Key 指引 / Key Configuration Guide</div>
                    <div>
                      {uiLang === 'zh' || i18n.language === 'mix'
                        ? "本网站在部署至 GitHub Pages 或独立部署后，由使用者自行配置 API Key。请在下方选择目标模型厂商，粘贴您在对应平台申请的 API Key（密钥加密储存在您本地浏览器中，绝不上传第三方服务器）。"
                        : "When using this app, users provide their own API Keys. Select a provider below and enter your Key (stored locally in your browser)."
                      }
                    </div>
                  </div>
                </div>

                {/* Active Provider Selection */}
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">{t('providerLabel')}</label>
                  <div className="flex gap-2">
                    <div 
                      className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 hover:border-cyan-500/50 transition-colors cursor-pointer relative group"
                      onClick={(e) => {
                        e.currentTarget.querySelector('.provider-dropdown')?.classList.toggle('hidden');
                        e.currentTarget.querySelector('.provider-dropdown')?.classList.toggle('opacity-0');
                        e.currentTarget.querySelector('.provider-dropdown')?.classList.toggle('-translate-y-2');
                      }}
                      tabIndex={0}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          e.currentTarget.querySelector('.provider-dropdown')?.classList.add('hidden', 'opacity-0', '-translate-y-2');
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 h-full">
                        {activeProviderId === 'gemini' || activeProviderId === 'deepseek' ? (
                          <Globe size={14} className="text-emerald-400" />
                        ) : (
                          <Server size={14} className="text-amber-400" />
                        )}
                        <span className="text-sm text-cyan-100 font-mono flex-1 select-none pointer-events-none">
                          {activeProvider?.name || 'Select Provider'}
                        </span>
                        <ChevronDown size={14} className="text-slate-500" />
                      </div>

                      {/* Provider Dropdown List */}
                      <div className="provider-dropdown hidden opacity-0 -translate-y-2 transition-all duration-200 absolute top-full left-0 right-0 mt-2 bg-[#0a0f18] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="flex flex-col py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {providers.map(p => (
                            <button
                              key={p.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                saveActiveProviderId(p.id);
                                const mods = p.models.split(',').filter(Boolean);
                                if (mods.length > 0) saveActiveModel(mods[0].trim());
                                e.currentTarget.closest('.provider-dropdown')?.classList.add('hidden', 'opacity-0', '-translate-y-2');
                              }}
                              className={`px-4 py-3 text-sm font-mono text-left transition-colors flex items-center justify-between ${activeProviderId === p.id ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                            >
                              <div className="flex items-center gap-3">
                                {p.id === 'gemini' || p.id === 'deepseek' ? (
                                  <Globe size={14} className={activeProviderId === p.id ? "text-emerald-400" : "text-emerald-400/50"} />
                                ) : (
                                  <Server size={14} className={activeProviderId === p.id ? "text-amber-400" : "text-amber-400/50"} />
                                )}
                                <span>{p.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {p.id === 'gemini' || p.id === 'deepseek' ? (
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/50 bg-emerald-400/10 px-1.5 py-0.5 rounded">Default</span>
                                ) : (
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/50 bg-amber-400/10 px-1.5 py-0.5 rounded">Custom</span>
                                )}
                                {activeProviderId === p.id && <Check size={14} className="text-cyan-400" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={handleCreateProvider}
                      className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      <Settings2 size={14} />
                      {t('addProvider')}
                    </button>
                  </div>
                </div>

                {/* API Key */}
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">{t('apiKeyLabel')}</label>
                  <input
                    type="password"
                    value={activeProvider.apiKey}
                    onChange={(e) => updateActiveProvider({ apiKey: e.target.value })}
                    placeholder={t('apiKeyPlaceholder')}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">
                    If left empty for Gemini, the system default key will be used. User keys are saved locally.
                  </p>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">{t('modelLabel')}</label>
                  <select
                    value={activeModel}
                    onChange={(e) => saveActiveModel(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono appearance-none"
                  >
                    {availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Operator Style Selection */}
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">{t('operatorStyleLabel')}</label>
                  <select
                    value={operatorStyle}
                    onChange={(e) => saveOperatorStyle(e.target.value as "OR" | "Space")}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none"
                  >
                    <option value="OR">{t('operatorStyleStandard')}</option>
                    <option value="Space">{t('operatorStyleSpace')}</option>
                  </select>
                </div>

                {/* Custom Provider Advanced Fields */}
                {activeProvider.id !== 'gemini' && activeProvider.id !== 'deepseek' && (
                  <div className="p-4 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-950/10 flex flex-col gap-4 mt-2">
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">{t('providerName')}</label>
                      <input
                        type="text"
                        value={activeProvider.name}
                        onChange={(e) => updateActiveProvider({ name: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-cyan-100 font-mono focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">API Endpoint Base URL</label>
                      <input
                        type="text"
                        value={activeProvider.endpoint}
                        onChange={(e) => updateActiveProvider({ endpoint: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-cyan-100 font-mono focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">{t('authTypeLabel')}</label>
                        <select
                          value={activeProvider.authType}
                          onChange={(e) => updateActiveProvider({ authType: e.target.value as any })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-cyan-100 font-mono focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="Bearer">Bearer Token</option>
                          <option value="Header">Custom Header</option>
                        </select>
                      </div>
                      {activeProvider.authType === 'Header' && (
                        <div className="flex-1">
                          <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">{t('customHeaderLabel')}</label>
                          <input
                            type="text"
                            value={activeProvider.authHeaderName || ""}
                            onChange={(e) => updateActiveProvider({ authHeaderName: e.target.value })}
                            placeholder="e.g. x-api-key"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-cyan-100 font-mono focus:outline-none focus:border-cyan-500/50"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">{t('modelsListLabel')}</label>
                      <input
                        type="text"
                        value={activeProvider.models}
                        onChange={(e) => {
                          const newModelsStr = e.target.value;
                          updateActiveProvider({ models: newModelsStr });
                          const newModelsList = newModelsStr.split(',').map(m => m.trim()).filter(Boolean);
                          if (!newModelsList.includes(activeModel)) {
                            saveActiveModel(newModelsList.length > 0 ? newModelsList[0] : "");
                          }
                        }}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-cyan-100 font-mono focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                    <div className="pt-2">
                       <button 
                         onClick={() => handleDeleteProvider(activeProvider.id)}
                         className="text-xs uppercase font-bold tracking-widest text-red-400 hover:text-red-300 transition-colors"
                       >
                         {t('deleteProvider')}
                       </button>
                    </div>
                  </div>
                )}
              </div>
              )}

              <div className="shrink-0 px-6 py-4 border-t border-white/5 bg-black/20 flex items-center justify-between z-10">
                {settingsTab === 'templates' ? (
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block"></span>
                    {activeTemplate ? (
                      <span>已启用: <strong className="text-amber-300 font-mono">{activeTemplate.name}</strong></span>
                    ) : (
                      <span>未指定特定模板 (智能组配模式)</span>
                    )}
                  </div>
                ) : settingsTab === 'trajectories' ? (
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
                    <span>
                      {uiLang === 'zh' || i18n.language === 'mix' 
                        ? <>已沉淀 <strong className="text-cyan-300 font-mono">{trajectories.length}</strong> 条 AI 双向重构演进轨迹日志</>
                        : <>Recorded <strong className="text-cyan-300 font-mono">{trajectories.length}</strong> AI refinement trajectory logs</>}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleTestConnection}
                      disabled={testConnStatus === 'testing'}
                      className="px-4 py-2 rounded-lg text-xs font-bold border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors uppercase tracking-widest disabled:opacity-50"
                    >
                      {t('testConnectionBtn')}
                    </button>
                    {testConnStatus !== 'idle' && (
                      <span className={`text-xs ${testConnStatus === 'success' ? 'text-emerald-400' : testConnStatus === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
                        {testConnMessage}
                      </span>
                    )}
                  </div>
                )}
                <button 
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(8,145,178,0.2)] cursor-pointer"
                >
                  {t('saveConfig')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} className="text-cyan-400" />
                  {t('historyTitle')}
                </h3>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button 
                      onClick={() => {
                        if (window.confirm(t('confirmClearHistory') || "Are you sure you want to clear all history? / 确定要清空所有历史记录吗？")) {
                          saveHistory([]);
                        }
                      }}
                      className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-all text-red-400 hover:bg-red-500/10"
                    >
                      {t('clearHistory')}
                    </button>
                  )}
                  <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 opacity-30">
                    <History size={32} className="mb-3" />
                    <span className="text-xs uppercase font-mono tracking-widest">{t('noHistory')}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item, idx) => (
                      <div 
                        key={item.id} 
                        onClick={() => restoreHistory(item)}
                        className="bg-black/30 border border-white/5 rounded-xl p-4 cursor-pointer hover:border-cyan-500/30 hover:bg-white/5 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] text-cyan-500 opacity-70 font-mono tracking-tighter">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                          <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-400 uppercase tracking-widest border border-white/5 truncate max-w-[150px]">
                            {item.dbType}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 font-medium mb-3 line-clamp-2">
                          {item.input}
                        </p>
                        <div className="bg-black/40 border border-white/5 p-2 rounded-lg">
                          <p className="text-xs font-mono text-cyan-200/80 truncate">
                            {item.result.fieldSpecificQuery || item.result.booleanQuery}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-12 left-1/2 z-50 px-6 py-4 bg-red-950/80 border border-red-500/50 backdrop-blur-xl rounded-2xl flex flex-col gap-2 shadow-[0_0_40px_rgba(239,68,68,0.3)] w-[90%] max-w-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="text-red-400" size={18} />
                <span className="text-sm font-bold text-red-200">{error.title}</span>
              </div>
              <button 
                onClick={() => setError(null)} 
                className="text-red-400/50 hover:text-red-400 p-1 transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[11px] font-mono text-red-300/80 leading-relaxed pt-1 break-words">
              {error.details}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Whitelist Look-up Modal */}
      <AnimatePresence>
        {isQuickWhitelistOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl relative flex flex-col h-[85vh]"
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Globe size={16} className="text-cyan-400" />
                    官方白名单合规网址速查
                  </h3>
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider mt-1">
                    {result ? "关联检索：点击任意链接将自动复制当前检索式并直达合规平台" : "点击链接一键直达官方白名单合规检索平台"}
                  </span>
                </div>
                <button 
                  onClick={() => setIsQuickWhitelistOpen(false)} 
                  className="text-slate-400 hover:text-white transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-slate-950/40">
                <OfficialWhitelist 
                  isInModal={true}
                  initialSearchKw={quickSearchKw}
                  onSelectLink={(wlItem) => {
                    const queryToCopy = result ? (showMapped ? (effectiveA.fieldSpecificQuery || effectiveA.booleanQuery) : effectiveA.booleanQuery) : null;
                    
                    if (queryToCopy) {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(queryToCopy);
                      } else {
                        const textarea = document.createElement('textarea');
                        textarea.style.position = 'fixed';
                        textarea.style.opacity = '0';
                        textarea.value = queryToCopy;
                        document.body.appendChild(textarea);
                        textarea.select();
                        try {
                          document.execCommand('copy');
                        } catch (err) {}
                        document.body.removeChild(textarea);
                      }
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                      setJumpDbName(wlItem.name);
                    }
                    window.open(wlItem.url, '_blank');
                    setIsQuickWhitelistOpen(false); // Close quick dialog
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Non-blocking database redirection toast and manual fallback */}
      <AnimatePresence>
        {jumpDbName && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed bottom-6 right-6 z-[200] w-96 bg-slate-950/95 border border-cyan-500/40 backdrop-blur-xl rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.15)] flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 shrink-0 animate-pulse">
                  <Check size={12} className="text-emerald-400" />
                </div>
                <h4 className="text-xs font-black text-white tracking-widest uppercase">
                  检索式已自动复制 / COPIED!
                </h4>
              </div>
              <button 
                onClick={() => setJumpDbName(null)}
                className="text-slate-500 hover:text-white transition-colors"
                id="close-jump-toast"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-slate-200">
                正在为您在新窗口中启动 <span className="text-cyan-400 font-bold underline">{jumpDbName}</span> 进行检索。
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                如新标签页未弹出，说明被您的浏览器拦截。请点击下方“手动前往”链接直接进入。入站后直接按 <span className="text-cyan-400 font-mono font-bold">Ctrl+V</span> (或 Cmd+V) 粘贴您的专属检索式即可！
              </p>
            </div>
 
            <div className="flex justify-between items-center bg-black/50 p-2.5 rounded-lg border border-white/5 gap-2 overflow-hidden">
              <span className="text-[9px] font-mono text-slate-500 uppercase shrink-0">CLIPBOARD:</span>
              <span className="text-[10px] font-mono text-cyan-300 truncate select-all">
                {result ? (showMapped ? (effectiveA.fieldSpecificQuery || effectiveA.booleanQuery) : effectiveA.booleanQuery) : ""}
              </span>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setJumpDbName(null)}
                className="px-3 py-1.5 rounded-lg text-[10px] text-slate-400 hover:text-white font-bold tracking-wider hover:bg-white/5 transition-all uppercase"
                id="dismiss-jump-toast"
              >
                我知道了 (OK)
              </button>
              <a
                href={
                  (result && result.suggestedUrls && result.suggestedUrls.find(u => u.name === jumpDbName)?.url) ||
                  DEFAULT_LINKS.find(u => u.name === jumpDbName)?.url ||
                  (result && result.suggestedUrls && result.suggestedUrls[0]?.url) ||
                  '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-bold rounded-lg text-[10px] tracking-widest transition-all border border-emerald-500/30 flex items-center gap-1.5 uppercase"
                onClick={() => setJumpDbName(null)}
              >
                手动前往 (GO)
                <ExternalLink size={11} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Downloader / Installer Modal */}
      <AnimatePresence>
        {showInstallerModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-6xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)] relative flex flex-col h-[85vh] max-h-[85vh]"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
                <div className="flex items-center gap-2">
                  <Download size={16} className="text-cyan-400 animate-pulse" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    一键本地部署与全离线便携包生成 (Offline & Installer)
                  </h3>
                </div>
                <button 
                  onClick={() => setShowInstallerModal(false)} 
                  className="text-slate-400 hover:text-white transition-colors p-1.5 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[#05070a]/95">
                <OfflineDownloader />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guided Search spotlight mask and popup card */}
      {tourStep !== null && (
        <div className="fixed inset-0 z-[990] pointer-events-none select-none">
          <svg className="absolute inset-0 w-full h-full pointer-events-auto">
            <defs>
              <mask id="tour-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {tourBounds && (
                  <rect
                    x={tourBounds.left - 6}
                    y={tourBounds.top - 6}
                    width={tourBounds.width + 12}
                    height={tourBounds.height + 12}
                    rx={12}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="#020617"
              fillOpacity={0.78}
              mask="url(#tour-spotlight-mask)"
            />
          </svg>

          {/* Animated breathing highlight border overlay around the cutout bounds */}
          {tourBounds && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                boxShadow: [
                  "0 0 15px rgba(34,211,238,0.3)",
                  "0 0 35px rgba(34,211,238,0.65)",
                  "0 0 15px rgba(34,211,238,0.3)"
                ],
                borderColor: [
                  "rgba(34,211,238,0.45)",
                  "rgba(168,85,247,0.78)",
                  "rgba(34,211,238,0.45)"
                ]
              }}
              exit={{ opacity: 0 }}
              className="fixed border-2 rounded-2xl pointer-events-none z-[995] transition-all duration-300"
              style={{
                top: tourBounds.top - 8,
                left: tourBounds.left - 8,
                width: tourBounds.width + 16,
                height: tourBounds.height + 16,
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>
      )}

      {tourStep !== null && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            className="fixed z-[1000] w-96 bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-xl flex flex-col gap-4 text-left pointer-events-auto"
            style={(() => {
              if (!tourBounds) {
                return {
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                };
              }
              
              const tooltipWidth = 384; 
              const tooltipHeight = 250;
              const margin = 20;
              const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
              const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
              
              let top = tourBounds.top + tourBounds.height + margin;
              let left = tourBounds.left + tourBounds.width / 2 - tooltipWidth / 2;
              
              if (left < margin) left = margin;
              if (left + tooltipWidth > screenWidth - margin) {
                left = screenWidth - tooltipWidth - margin;
              }
              
              if (top + tooltipHeight > screenHeight - margin) {
                top = tourBounds.top - tooltipHeight - margin;
              }
              if (top < margin) {
                top = Math.max(margin, tourBounds.top + tourBounds.height / 2 - tooltipHeight / 2);
                if (tourBounds.left > tooltipWidth + margin) {
                  left = tourBounds.left - tooltipWidth - margin;
                } else {
                  left = tourBounds.left + tourBounds.width + margin;
                }
              }
              
              return {
                top: `${top}px`,
                left: `${left}px`,
              };
            })()}
          >
            {/* Step header */}
            <div className="flex justify-between items-center bg-black/20 -mx-5 -mt-5 px-5 py-3 border-b border-white/5 rounded-t-2xl select-none">
              <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400 font-mono">
                Guided Walkthrough ({tourStep + 1} / 5)
              </span>
              <button
                onClick={exitTour}
                className="text-slate-500 hover:text-white transition-colors p-1"
                title="Exit Tour"
              >
                <X size={14} />
              </button>
            </div>

            {/* Step body */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-white leading-tight uppercase flex items-center gap-2 select-none">
                <span className="w-1.5 h-3 bg-cyan-500 rounded-full shrink-0"></span>
                {TOUR_STEPS[tourStep].title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {TOUR_STEPS[tourStep].desc}
              </p>
            </div>

            {/* Progress dots & Actions */}
            <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-3 select-none">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    onClick={() => setTourStep(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      tourStep === i ? 'w-4 bg-cyan-400' : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {tourStep > 0 && (
                  <button
                    onClick={() => setTourStep(tourStep - 1)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg text-[10px] tracking-wider uppercase transition-all border border-white/5 cursor-pointer"
                  >
                    {uiLang === 'zh' || i18n.language === 'mix' ? "上一步" : "Prev"}
                  </button>
                )}
                
                {tourStep < 4 ? (
                  <button
                    onClick={() => setTourStep(tourStep + 1)}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-lg text-[10px] tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1 group cursor-pointer"
                  >
                    {uiLang === 'zh' || i18n.language === 'mix' ? "下一步" : "Next"}
                    <span className="translate-x-0 group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                ) : (
                  <button
                    onClick={exitTour}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[10px] tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                  >
                    {uiLang === 'zh' || i18n.language === 'mix' ? "完成探索" : "Finish"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
