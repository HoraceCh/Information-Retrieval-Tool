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
  ExternalLink,
  Download,
  WifiOff,
  Star
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { generateSearchQuery, SearchQueryResponse, ProviderConfig, testConnection } from "./services/gemini";
import OfficialWhitelist, { DEFAULT_LINKS, LinkItem, DEFAULT_CATEGORIES, extractKeywords, scoreLink } from "./components/OfficialWhitelist";
import OfflineDownloader from "./components/OfflineDownloader";
import FeedbackAnalytics, { UserFeedback } from "./components/FeedbackAnalytics";
import VisualQueryTree from "./components/VisualQueryTree";
import HighlightedBooleanQuery from "./components/HighlightedBooleanQuery";

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
    name: "DeepSeek",
    isGemini: false,
    endpoint: "https://api.deepseek.com",
    authType: 'Bearer',
    apiKey: "",
    models: "deepseek-v4-flash,deepseek-v4-pro"
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
const getLocalCache = (line: string, dbType: string, langPref: string, model: string, providerId: string, operatorStyle: string) => {
  try {
    const cacheStr = localStorage.getItem("ai_retrieval_v2_cache");
    if (!cacheStr) return null;
    const cache = JSON.parse(cacheStr);
    const key = `${providerId}_${model}_${dbType}_${langPref}_${operatorStyle}_${line.trim()}`;
    const item = cache[key];
    if (item && Date.now() - item.timestamp < 3600000 * 24) { // Valid for 24 hours
      return item.result;
    }
  } catch (e) {}
  return null;
};

const setLocalCache = (line: string, dbType: string, langPref: string, model: string, providerId: string, operatorStyle: string, result: any) => {
  try {
    const cacheStr = localStorage.getItem("ai_retrieval_v2_cache") || "{}";
    const cache = JSON.parse(cacheStr);
    const key = `${providerId}_${model}_${dbType}_${langPref}_${operatorStyle}_${line.trim()}`;
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
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<'ai' | 'whitelist'>('ai');
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
      title: uiLang === 'zh' || i18n.language === 'mix' ? "第一步：输入学术主题 / 检索意图" : "Step 1: Enter Academic Topic / Search Intent",
      desc: uiLang === 'zh' || i18n.language === 'mix'
        ? "在这里直接输入以人类自然语言描述的学术课题、科学探究。系统能够精准识别核心概念与逻辑因果并转化为最优布尔检索式。"
        : "Type your academic research topic in standard, everyday natural language. The analyzer engine will map core concepts and operators automatically."
    },
    {
      targetId: "guided-config-panel",
      title: uiLang === 'zh' || i18n.language === 'mix' ? "第二步：数据库字段映射与模型偏好" : "Step 2: Database Schema & Comparing Models",
      desc: uiLang === 'zh' || i18n.language === 'mix'
        ? "配置目标引文数据库（如 CNKI、PubMed）。系统将按各库特定规则映射限定词标记（如 SU、MH）。在此开启【对比模式】还可以同时评测两个大模型，实现双端语法比对诊断！"
        : "Select major citation databases (such as CNKI, PubMed, IEEE) to map logic query fields. Turn on 'Comparison Mode' to see results from Model A and Model B side-by-side!"
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
        finalFeedbackText
      );

      const finalResp = { ...resp, _inputLine: result._inputLine, _isLoading: false };

      setResults(current => {
        const next = [...current];
        next[activeIndex] = finalResp;
        return next;
      });

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

      setFeedbackNotice(uiLang === 'zh' || i18n.language === 'mix' ? "✨ 检索算式已重构完毕！" : "✨ Query restructured successfully!");
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
          providersToUse = parsed.map((p: any) => {
            if (p.id === "gemini") {
              const defaultGemini = DEFAULT_PROVIDERS.find(dp => dp.id === "gemini");
              return { ...p, models: defaultGemini ? defaultGemini.models : p.models };
            }
            return p;
          });
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
          const cachedResultA = getLocalCache(line, dbType, langPref, activeModel, activeProviderId, operatorStyle);
          if (cachedResultA) {
            respA = { ...cachedResultA, _fromCache: true };
          } else {
            respA = await generateSearchQuery(line, dbType, langPref, activeModel, providerA, operatorStyle);
            setLocalCache(line, dbType, langPref, activeModel, activeProviderId, operatorStyle, respA);
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
            const cachedResultB = getLocalCache(line, dbType, langPref, compareModel, compareProviderId, operatorStyle);
            if (cachedResultB) {
              respB = { ...cachedResultB, _fromCache: true };
            } else {
              respB = await generateSearchQuery(line, dbType, langPref, compareModel, providerB, operatorStyle);
              setLocalCache(line, dbType, langPref, compareModel, compareProviderId, operatorStyle, respB);
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

    return (
      <div 
        style={{
          minHeight: screenHeight < 700 ? '250px' : screenHeight < 800 ? '300px' : '350px'
        }}
        className={`flex flex-col bg-slate-900/30 border rounded-xl p-4 overflow-hidden relative flex-1 text-left ${
          isModelA ? 'border-cyan-500/15 hover:border-cyan-500/25 bg-cyan-950/5' : 'border-purple-500/15 hover:border-purple-500/25 bg-purple-950/5'
        }`}
      >
        {/* Card Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isModelA ? 'bg-cyan-400' : 'bg-purple-400'} animate-pulse`}></span>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isModelA ? 'text-cyan-300' : 'text-purple-300'}`}>
              {title}
            </span>
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]" title={modelName}>
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
            {mResp?._usage?.totalTokens && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-white/5 border border-white/10 text-slate-400 text-[8px] rounded-md font-bold font-mono">
                {mResp._usage.totalTokens} Tokens
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
            <div className="flex-1 flex flex-col relative" style={{ minHeight: screenHeight < 700 ? '90px' : '130px' }}>
              <div 
                style={{
                  height: screenHeight < 700 ? '90px' : screenHeight < 800 ? '110px' : '140px',
                  minHeight: '80px'
                }}
                className="font-mono text-cyan-100 text-xs leading-relaxed overflow-y-auto custom-scrollbar select-all flex-1 p-3 bg-black/45 rounded-lg border border-white/5"
              >
                <HighlightedBooleanQuery query={queryStr} />
              </div>
              
              {/* Copy Overlay Button */}
              <button 
                onClick={handleCardCopy}
                className="absolute right-2 text-slate-400 hover:text-white bottom-2 p-1.5 bg-slate-800/80 hover:bg-slate-750 border border-white/10 rounded-lg transition-all cursor-pointer"
                title="Copy code"
              >
                {cardCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>

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
              <p className="text-[11px] text-slate-400 italic line-clamp-2" title={mResp.explanation}>
                <span className="text-[9px] font-bold text-slate-500 uppercase mr-1 select-none font-mono">STRATEGY:</span> 
                {mResp.explanation}
              </p>
            )}

            {/* Field Mappings */}
            {hasMapping && (
              <div className="flex flex-col gap-1.5 mt-1 border-t border-white/5 pt-2 custom-scrollbar overflow-y-auto max-h-[100px] sm:max-h-[120px]">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Field mappings:</span>
                <div className="space-y-1">
                  {mResp.schemaMapping.map((map: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] bg-white/5 px-2 py-1 rounded">
                      <span className="text-[8px] text-emerald-400 font-mono bg-emerald-400/5 border border-emerald-500/10 px-1 py-0.2 rounded shrink-0">[{map.field}]</span>
                      <span className="text-slate-300 font-medium truncate max-w-[100px]">"{map.mappedConcept}"</span>
                      <span className="text-slate-500 text-[9px] truncate flex-1 block">({map.reason})</span>
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
    <div className="min-h-screen h-screen flex flex-col bg-[#05070A] text-slate-100 font-sans overflow-hidden">
      {/* Header Section */}
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-4 shrink-0 bg-[#05070A]/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase flex items-center">
              {t('appTitle')} <span className="text-cyan-500 text-[10px] font-mono ml-2 opacity-70">v2.4.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">{t('appSubtitle')}</p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <div 
            className="flex items-center gap-2 bg-slate-800/40 hover:bg-slate-700/60 px-3 py-1.5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer relative group"
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
            <Languages size={14} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <div className="text-xs font-bold text-slate-300 group-hover:text-white pr-5 select-none relative z-10 pointer-events-none">
              {uiLang === 'mix' ? '中文/EN (Mix)' : uiLang === 'zh' ? '简体中文' : 'English'}
            </div>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
              <ChevronDown size={12} className="text-cyan-400" />
            </div>

            {/* Custom Dropdown Menu */}
            <div className="dropdown-menu hidden opacity-0 -translate-y-2 transition-all duration-200 absolute top-full right-0 mt-3 bg-[#0a0f18] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] min-w-full w-max">
              <div className="flex flex-col py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    i18n.changeLanguage("mix");
                    e.currentTarget.closest('.dropdown-menu')?.classList.add('hidden', 'opacity-0', '-translate-y-2');
                  }}
                  className={`px-4 py-2.5 text-xs font-bold text-left transition-colors flex items-center justify-between ${uiLang === 'mix' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
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
                  className={`px-4 py-2.5 text-xs font-bold text-left transition-colors flex items-center justify-between ${uiLang === 'zh' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
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
                  className={`px-4 py-2.5 text-xs font-bold text-left transition-colors flex items-center justify-between ${uiLang === 'en' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  English
                  {uiLang === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-3"></span>}
                </button>
              </div>
            </div>
          </div>

          {/* Global Offline/Failure Banner Action */}
          {isOfflineMode && (
            <div className="hidden md:flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-3.5 py-1.5 rounded-xl text-red-400 animate-fade-in shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <WifiOff size={14} className="animate-pulse shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-red-300 leading-tight">
                  {!isOnline ? "已断开外网连接" : "API 连续连接失败"} (Offline Mode Active)
                </span>
                <span className="text-[9px] text-rose-400/80 leading-none">
                  推荐切换至【官方网址速查】进行无流离线工作
                </span>
              </div>
              <button
                onClick={() => setActiveTab('whitelist')}
                className="text-[10px] bg-red-500/20 hover:bg-red-500/35 text-white px-2.5 py-1 rounded border border-red-500/40 transition-all font-black select-none uppercase cursor-pointer flex items-center gap-1 shrink-0 hover:scale-105 active:scale-95"
              >
                立即切换 ➜
              </button>
            </div>
          )}

          {/* Guided Search Walkthrough Button */}
          <button
            onClick={startTour}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/25 hover:border-cyan-500/45 rounded-xl transition-all cursor-pointer relative group shrink-0"
            title="交互式检索学步引导 (Interactive Search Walkthrough)"
          >
            <Sparkles size={13} className="text-cyan-400 animate-pulse" />
            <span className="text-xs font-extrabold tracking-wider uppercase font-mono">
              {uiLang === 'zh' || i18n.language === 'mix' ? "新手引导" : "Tour 👋"}
            </span>
            <span className="absolute top-full mt-2.5 right-0 bg-[#0a0f18] border border-white/10 text-slate-200 text-[10px] px-2.5 py-1 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[110]">
              💡 {uiLang === 'zh' || i18n.language === 'mix' ? "检索学步车：3分钟掌握智能公式生成与校准" : "Onboarding: Learn to generate & refine boolean query"}
            </span>
          </button>

          {/* Quick Help/Offline Installer Corner Button */}
          <button
            onClick={() => setShowInstallerModal(true)}
            className="p-2.5 bg-slate-850/60 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all relative group flex items-center justify-center shrink-0 cursor-pointer"
            title="一键离线安装与本地部署说明 (Offline & Installer)"
          >
            <Info size={15} className="animate-pulse" />
            <span className="absolute top-full mt-2.5 right-0 bg-[#0a0f18] border border-white/10 text-slate-200 text-[10px] px-2 py-1 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[110]">
              💡 离线版生成与极速安装包 (Offline & Install)
            </span>
          </button>

          <div className="hidden sm:block text-right">
            <span className="text-[9px] text-slate-500 uppercase block leading-none mb-1">
              {isOfflineMode ? "服务状态 (Service)" : t('engineStatus')}
            </span>
            {isOfflineMode ? (
              <span className="text-xs text-rose-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                {!isOnline ? "离线形态 (Offline)" : "服务阻断 (Blocked)"}
              </span>
            ) : (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> {t('operational')}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Interface Tab Selector */}
      <div className="flex border-b border-white/5 bg-[#05070A]/90 px-8 py-2 gap-4 shrink-0 justify-start items-center z-40">
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 text-xs font-black tracking-widest uppercase transition-all rounded-lg flex items-center gap-2 border ${
            activeTab === 'ai' 
              ? 'text-cyan-400 bg-cyan-950/20 border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-white/5'
          }`}
        >
          <Sparkles size={14} className={activeTab === 'ai' ? 'text-cyan-400' : 'text-slate-500'} />
          AI 智能检索式生成 (AI Query Builder)
        </button>
        <button
          onClick={() => setActiveTab('whitelist')}
          className={`px-4 py-2 text-xs font-black tracking-widest uppercase transition-all rounded-lg flex items-center gap-2 border ${
            activeTab === 'whitelist' 
              ? 'text-cyan-400 bg-cyan-950/20 border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-white/5'
          }`}
        >
          <Globe size={14} className={activeTab === 'whitelist' ? 'text-cyan-400' : 'text-slate-500'} />
          官方网址速查 (Official Whitelist)
        </button>
      </div>

      {activeTab === 'ai' ? (
        <main className="flex-1 flex gap-6 p-6 overflow-hidden min-h-0 container mx-auto max-w-[1440px]">
        
        {/* Left Column: Input & Formula Result */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Input Block */}
          <section id="guided-input-panel" className="flex-1 max-h-[290px] bg-slate-900/40 rounded-2xl border border-white/5 p-6 flex flex-col relative group transition-all hover:border-white/10 shadow-lg select-none">
            <div className="absolute top-4 right-4 text-[10px] text-slate-500 font-mono tracking-tighter opacity-50">INPUT_NATURAL_LANGUAGE</div>
            <label className="text-[11px] text-cyan-400/80 mb-2 uppercase font-bold tracking-[0.2em]">{t('inputLabel')}</label>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('inputPlaceholder')}
              className="flex-1 bg-transparent border-none outline-none resize-none text-xl text-slate-200 placeholder:text-slate-700 leading-relaxed font-medium custom-scrollbar overflow-y-auto min-h-[50px]"
            />

            {/* Comparison Mode Configuration Bar */}
            <div id="guided-config-panel" className="flex flex-wrap items-center gap-4 mt-2 py-2 px-1 border-t border-white/5">
              {/* Checkbox Toggle Button */}
              <button
                type="button"
                onClick={() => saveCompareMode(!isCompareMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold leading-none cursor-pointer select-none ${
                  isCompareMode 
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)] hover:bg-purple-500/20" 
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-300 hover:bg-white/10"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isCompareMode ? "border-purple-400 bg-purple-500" : "border-slate-500"}`}>
                  {isCompareMode && <Check size={11} className="text-white font-extrabold stroke-[3px]" />}
                </div>
                <span>{uiLang === 'zh' || i18n.language === 'mix' ? "📊 对比模式" : "📊 Comparison Mode"}</span>
              </button>

              {/* Model Selectors */}
              <div className="flex items-center gap-4 flex-wrap text-xs">
                {/* Model A Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
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
                          {p.name.substring(0, 10)} - {m}
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
                    <span className="text-[10px] uppercase font-bold text-slate-500">
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
                            {p.name.substring(0, 10)} - {m}
                          </option>
                        ));
                      })}
                    </select>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-between items-center pt-4 border-t border-white/5 gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2" title={t('dbTypesLabel')}>
                  <Database size={16} className="text-cyan-500/50" />
                  <select
                    value={dbType}
                    onChange={(e) => setDbType(e.target.value)}
                    className="bg-transparent border-none text-xs font-mono text-slate-400 focus:ring-0 cursor-pointer hover:text-cyan-400 transition-colors uppercase tracking-widest p-0 pl-1 max-w-[200px] truncate"
                  >
                    {DB_TYPES.map(type => (
                      <option key={type} value={type} className="bg-[#05070A]">{type}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2" title={t('langPrefLabel')}>
                  <Languages size={16} className="text-cyan-500/50" />
                  <select
                    value={langPref}
                    onChange={(e) => setLangPref(e.target.value)}
                    className="bg-transparent border-none text-xs font-mono text-slate-400 focus:ring-0 cursor-pointer hover:text-cyan-400 transition-colors uppercase tracking-widest p-0 pl-1"
                  >
                    <option value="双语混合 (Bilingual)" className="bg-[#05070A]">Bilingual</option>
                    <option value="仅中文 (Chinese Only)" className="bg-[#05070A]">ZH Only</option>
                    <option value="仅英文 (English Only)" className="bg-[#05070A]">EN Only</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuickSearchKw(input.trim());
                    setIsQuickWhitelistOpen(true);
                  }}
                  className="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-400 hover:text-cyan-300 text-[10px] font-black rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex items-center gap-1.5 uppercase tracking-widest cursor-pointer ml-3 shrink-0"
                  title="速查官方白名单数据库"
                >
                  <Globe size={12} className="text-cyan-400" />
                  <span>官方网址速查</span>
                </button>
              </div>

              <div className="flex items-center gap-3 overflow-hidden min-h-[46px]">
                <AnimatePresence mode="wait">
                  {!result ? (
                    <motion.div
                      key="generate-btn"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3"
                    >
                      {input && (
                        <button 
                          onClick={reset}
                          className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                          title={t('reset')}
                        >
                          <RotateCcw size={18} />
                        </button>
                      )}
                      <button
                        onClick={handleGenerate}
                        disabled={loading || !input.trim()}
                        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] flex items-center gap-2 group/btn disabled:opacity-30 disabled:shadow-none"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            {t('generate')}
                            <Search size={18} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="regenerate-btn"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <button 
                        onClick={reset}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest border border-white/5 rounded-lg hover:bg-white/5"
                      >
                        <RotateCcw size={14} /> {t('reset')}
                      </button>
                      {loading && <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin ml-2" />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
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
                >
                  {r._isLoading && <div className="w-2.5 h-2.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin shrink-0" />}
                  <span className="opacity-50">T{idx + 1}:</span>
                  <span>{r._inputLine.length > 15 ? r._inputLine.substring(0, 15) + '...' : r._inputLine}</span>
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
            className={`flex flex-col flex-1 rounded-2xl border transition-all duration-700 relative overflow-hidden shadow-inner ${
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
            
            <div className="p-4 md:p-5 flex-1 flex flex-col min-h-0 relative z-10 font-sans">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-cyan-400/80 uppercase font-bold tracking-[0.2em]">
                    {isCompareMode ? (uiLang === 'zh' || i18n.language === 'mix' ? "大模型双语语义比对诊断" : "AI MODEL COMPARISON DIAGNOSIS") : t('formulaTitle')}
                  </label>
                  {result && (result._fromCache || result._compareResult?._fromCache) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] rounded-full font-bold uppercase tracking-widest animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                      <Sparkles size={11} className="text-emerald-400" /> ⚡️ {uiLang === 'zh' || i18n.language === 'mix' ? '缓存加速' : 'CACHE ACTIVE'}
                    </span>
                  )}
                </div>
                {result && (
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
                )}
              </div>
              
              {/* Syntax Highlight Legend */}
              {result && !result._isLoading && (
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono select-none mb-2.5 px-2.5 py-1 bg-black/30 rounded-lg border border-cyan-500/10">
                  <span className="text-slate-400 font-bold mr-1">🎨 {uiLang === 'zh' || i18n.language === 'mix' ? "语法高亮图例:" : "Syntax Legend:"}</span>
                  <span className="inline-flex items-center gap-1 text-amber-300 font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>AND</span>
                  <span className="inline-flex items-center gap-1 text-cyan-300 font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>OR</span>
                  <span className="inline-flex items-center gap-1 text-rose-400 font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>NOT</span>
                  <span className="inline-flex items-center gap-1 text-fuchsia-300 font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></span>NEAR/ADJ</span>
                  <span className="inline-flex items-center gap-1 text-violet-300 font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>{uiLang === 'zh' || i18n.language === 'mix' ? "字段标签" : "Fields"}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-300 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{uiLang === 'zh' || i18n.language === 'mix' ? '"精确词组"' : '"Phrases"'}</span>
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
                <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 mb-2">
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-y-auto custom-scrollbar">
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
                        height: feedbackRating > 0
                          ? (screenHeight < 700 ? '90px' : '110px')
                          : (screenHeight < 700 ? '110px' : screenHeight < 850 ? '140px' : '170px'),
                        minHeight: '80px'
                      }}
                      className={`font-mono text-cyan-100 text-sm md:text-base leading-relaxed overflow-y-auto custom-scrollbar select-all p-4 bg-black/25 rounded-lg border border-cyan-500/15 w-full block ${result?._isLoading ? 'animate-pulse text-cyan-500/50' : ''}`}
                    >
                      {result ? (
                        <HighlightedBooleanQuery
                          query={showMapped ? (effectiveA.fieldSpecificQuery || effectiveA.booleanQuery) : effectiveA.booleanQuery}
                        />
                      ) : (
                        "Formula will appear here..."
                      )}
                    </div>

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
                    <div className="mt-3.5 pt-2.5 border-t border-cyan-500/15 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 w-full shrink-0">
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
                          className="text-[11px] font-bold text-center text-cyan-400 py-1 bg-cyan-950/20 rounded border border-cyan-500/10 px-3 block font-mono text-left"
                        >
                          {feedbackNotice}
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
        <aside className="w-80 flex flex-col gap-6 overflow-hidden">
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
                        <span className="text-[9px] text-cyan-400 uppercase font-black block mb-2 tracking-widest">Reasoning Path</span>
                        <p className="text-[10px] text-cyan-100/60 leading-relaxed italic line-clamp-6 overflow-y-auto custom-scrollbar max-h-32">
                          {result._reasoning}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
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
      ) : (
        <main className="flex-1 flex gap-6 p-6 overflow-hidden min-h-0 container mx-auto max-w-[1440px]">
          <OfficialWhitelist />
        </main>
      )}

      {/* Footer System Bar */}
      <footer className="shrink-0 h-10 border-t border-white/5 flex items-center justify-between px-8 bg-[#05070A]">
        <div className="flex gap-8">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            {t('sysOpt')}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono tracking-tighter">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors flex items-center" onClick={() => setIsHistoryOpen(true)}>
              <History size={12} className="mr-1" /> {t('historyButton')}
            </span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors flex items-center" onClick={() => setIsConfigOpen(true)}>
              <Settings size={12} className="mr-1" /> {t('settings')}
            </span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors flex items-center" onClick={() => setIsStatsOpen(true)}>
              <BarChart2 size={12} className="mr-1" /> {t('statsButton')}
            </span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">DB_STATUS: OK</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter">
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
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Settings size={16} className="text-cyan-400" />
                  {t('configTitle')}
                </h3>
                <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                
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

              <div className="shrink-0 px-6 py-4 border-t border-white/5 bg-black/20 flex items-center justify-between z-10">
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
                <button 
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(8,145,178,0.2)]"
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
