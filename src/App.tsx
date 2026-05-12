/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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
  ExternalLink
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { generateSearchQuery, SearchQueryResponse, ProviderConfig, testConnection } from "./services/gemini";

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
    directSearch: "DIRECT_SEARCH / 一键检索"
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
    directSearch: "一键检索"
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
    directSearch: "DIRECT SEARCH"
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
    models: "gemini-3.1-pro-preview,gemini-3-flash-preview,gemini-2.5-pro,gemini-2.5-flash,gemini-2.0-pro-exp-02-05,gemini-2.0-flash"
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    isGemini: false,
    endpoint: "https://api.deepseek.com",
    authType: 'Bearer',
    apiKey: "",
    models: "deepseek-chat,deepseek-reasoner"
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
  "CNIPA / 壹专利 (中文专利)",
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

export default function App() {
  const [input, setInput] = useState("");
  const [dbType, setDbType] = useState(DB_TYPES[0]);
  const [langPref, setLangPref] = useState("双语混合 (Bilingual)");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(SearchQueryResponse & { _inputLine: string })[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const result = results[activeIndex] || null;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<{ title: string; details: string } | null>(null);
  const [showMapped, setShowMapped] = useState(false);

  const { t, i18n } = useTranslation();
  const uiLang = i18n.language;
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const [providers, setProviders] = useState<ProviderConfig[]>(DEFAULT_PROVIDERS);
  const [activeProviderId, setActiveProviderId] = useState<string>("gemini");
  const [activeModel, setActiveModel] = useState<string>("gemini-3-flash-preview");

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

  const handleTestConnection = async () => {
    setTestConnStatus('testing');
    setTestConnMessage(t('testing'));
    try {
      const provider = providers.find(p => p.id === activeProviderId);
      if (!provider) throw new Error("Provider not found");
      await testConnection(provider, activeModel);
      setTestConnStatus('success');
      setTestConnMessage(t('testSuccess'));
    } catch (e: any) {
      setTestConnStatus('error');
      setTestConnMessage(`${t('testFailed')}: ${e.message}`);
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
    const savedProviders = localStorage.getItem("ai_retrieval_providers");
    if (savedProviders) {
      try {
        const parsed = JSON.parse(savedProviders);
        if (Array.isArray(parsed)) setProviders(parsed);
      } catch (e) {}
    }
    const savedActiveProv = localStorage.getItem("ai_retrieval_active_prov");
    if (savedActiveProv) setActiveProviderId(savedActiveProv);
    const savedActiveMod = localStorage.getItem("ai_retrieval_active_mod");
    if (savedActiveMod) setActiveModel(savedActiveMod);
    const savedUsageStats = localStorage.getItem("ai_retrieval_usage_stats");
    if (savedUsageStats) {
      try { setUsageStats(JSON.parse(savedUsageStats)); } catch(e) {}
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
    saveActiveModel("gemini-3-flash-preview");
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
    setResults([]);
    setActiveIndex(0);
    try {
      const provider = providers.find(p => p.id === activeProviderId);
      
      let totalTokens = 0;
      let totalSuccesses = 0;
      let totalFailures = 0;
      
      const newItems: HistoryItem[] = [];

      const resps = await Promise.all(
        lines.map(async (line, idx) => {
          try {
            const resp = await generateSearchQuery(line, dbType, langPref, activeModel, provider);
            totalTokens += (resp._usage?.totalTokens || 0);
            totalSuccesses++;
            newItems.push({
              id: Date.now().toString() + idx,
              timestamp: Date.now() + idx,
              input: line,
              dbType,
              langPref,
              result: resp
            });
            return { ...resp, _inputLine: line };
          } catch (e: any) {
            totalFailures++;
            console.error(e);
            return null;
          }
        })
      );
      
      const successfulResps = resps.filter(r => r !== null) as (SearchQueryResponse & { _inputLine: string })[];
      
      if (successfulResps.length > 0) {
        setResults(successfulResps);
        saveHistory([...newItems, ...history].slice(0, 50));
      } else {
        throw new Error(JSON.stringify({ title: "Task Failed", details: "All parallel tasks failed to generate." }));
      }
      
      // Update Usage Stats
      const provId = provider ? provider.id : activeProviderId;
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
            successes: currentModStats.successes + totalSuccesses,
            failures: currentModStats.failures + totalFailures,
            totalTokens: currentModStats.totalTokens + totalTokens
          }
        }
      };
      saveUsageStats(updatedStats);
      
    } catch (err: any) {
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

  const restoreHistory = (item: HistoryItem) => {
    setInput(item.input);
    setDbType(item.dbType);
    setLangPref(item.langPref);
    setResults([{ ...item.result, _inputLine: item.input }]);
    setActiveIndex(0);
    setIsHistoryOpen(false);
    setError(null);
  };

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
          <div className="hidden sm:block text-right">
            <span className="text-[9px] text-slate-500 uppercase block leading-none mb-1">{t('engineStatus')}</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> {t('operational')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex gap-6 p-6 overflow-hidden min-h-0 container mx-auto max-w-[1440px]">
        
        {/* Left Column: Input & Formula Result */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Input Block */}
          <section className="flex-1 bg-slate-900/40 rounded-2xl border border-white/5 p-6 flex flex-col relative group transition-all hover:border-white/10 shadow-lg">
            <div className="absolute top-4 right-4 text-[10px] text-slate-500 font-mono tracking-tighter opacity-50">INPUT_NATURAL_LANGUAGE</div>
            <label className="text-[11px] text-cyan-400/80 mb-3 uppercase font-bold tracking-[0.2em]">{t('inputLabel')}</label>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('inputPlaceholder')}
              className="flex-1 bg-transparent border-none outline-none resize-none text-xl text-slate-200 placeholder:text-slate-700 leading-relaxed font-medium"
            />

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
              </div>

              <div className="flex items-center gap-3">
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
                {result && Array.isArray(result.suggestedUrls) && result.suggestedUrls.map((urlItem, i) => (
                  <a
                    key={i}
                    href={urlItem.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-6 py-3 bg-emerald-600/20 text-emerald-400 font-bold rounded-xl border border-emerald-500/30 transition-all flex items-center gap-2 ${loading ? 'opacity-30 pointer-events-none' : 'hover:bg-emerald-600/30'}`}
                  >
                    {urlItem.name || t('directSearch')}
                    <ExternalLink size={18} />
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* Batch Task Selector */}
          {results.length > 1 && (
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
              {results.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                    activeIndex === idx 
                      ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                      : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="opacity-50 mr-1">T{idx + 1}:</span>
                  {r._inputLine.length > 15 ? r._inputLine.substring(0, 15) + '...' : r._inputLine}
                </button>
              ))}
            </div>
          )}

          {/* Formula Output Block */}
          <div className={`flex flex-col flex-1 min-h-[300px] rounded-2xl border transition-all duration-700 relative overflow-hidden shadow-inner ${
            result ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-slate-900/20 border-white/5 grayscale pointer-events-none'
          }`}>
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.1),transparent_70%)]"
                />
              )}
            </AnimatePresence>
            
            <div className="p-6 h-full flex flex-col relative z-10">
              <div className="flex justify-between items-start mb-4">
                <label className="text-[11px] text-cyan-400/80 uppercase font-bold tracking-[0.2em]">{t('formulaTitle')}</label>
                {result && (
                  <div className="flex bg-black/40 rounded-lg p-1 border border-cyan-500/20">
                    <button
                      onClick={() => setShowMapped(false)}
                      className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-all ${
                        !showMapped ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {t('basicWeb')}
                    </button>
                    <button
                      onClick={() => setShowMapped(true)}
                      className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-all ${
                        showMapped ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {t('schemaMapped')}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="font-mono text-cyan-100 text-base leading-relaxed overflow-y-auto custom-scrollbar select-all flex-shrink-0 min-h-[80px] p-4 bg-black/20 rounded-lg border border-cyan-500/10">
                  {result ? (showMapped ? result.fieldSpecificQuery : result.booleanQuery) : "Formula will appear here..."}
                </div>

                {result && showMapped && Array.isArray(result.schemaMapping) && result.schemaMapping.length > 0 && (
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

              {result && (
                <div className="mt-4 pt-3 border-t border-cyan-500/20 flex justify-between items-center">
                  <span className="text-[10px] text-cyan-500/60 font-mono italic flex items-center gap-2">
                    <Check size={10} className="text-emerald-500" /> {t('processedWith')}
                  </span>
                  <button 
                    onClick={() => handleCopy(showMapped ? result.fieldSpecificQuery : result.booleanQuery)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-black tracking-widest flex items-center gap-1.5 transition-all"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? t('copied') : t('copyCode')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Semantics & Explanation */}
        <aside className="w-80 flex flex-col gap-6 overflow-hidden">
          {/* Keywords panel */}
          <div className="flex-1 bg-slate-900/60 rounded-2xl border border-white/5 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-3 bg-cyan-500 rounded-full"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">{t('semanticMap')}</h3>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{t('topicExpansion')}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {result && Array.isArray(result.keywords) && result.keywords.length > 0 ? (
                  result.keywords.map((group, idx) => (
                    <motion.div
                      key={group.original}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 group hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-mono text-cyan-400 opacity-70">#0{idx + 1} {t('coreKeyword')}</span>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
                      </div>
                      <p className="text-sm font-black text-white mb-3 uppercase tracking-tight">{group.original}</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-[9px] font-mono text-slate-600 uppercase">ZH:</span>
                        {Array.isArray(group.zhSynonyms) && group.zhSynonyms.map((syn, sIdx) => (
                          <span 
                            key={`zh-${sIdx}`}
                            className="text-[10px] font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300 hover:text-cyan-400 transition-colors"
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[9px] font-mono text-slate-600 uppercase">EN:</span>
                        {Array.isArray(group.enSynonyms) && group.enSynonyms.map((syn, sIdx) => (
                          <span 
                            key={`en-${sIdx}`}
                            className="text-[10px] font-medium bg-cyan-950/30 border border-cyan-500/20 px-2 py-0.5 rounded text-cyan-200 italic hover:text-cyan-100 transition-colors"
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-10 py-12">
                     <Search size={40} />
                     <p className="mt-4 text-[10px] font-mono tracking-tighter uppercase">{t('waitingInput')}</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Strategy / Stats block */}
          <div className="h-44 bg-slate-900/60 rounded-2xl border border-white/5 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles size={80} />
            </div>
            
            <div className="relative z-10">
              <span className="text-[10px] text-slate-500 uppercase font-black block mb-2 tracking-widest flex items-center gap-2">
                <Lightbulb size={12} className="text-orange-400" /> {t('insightTitle')}
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-4">
                {result ? result.explanation : t('insightDesc')}
              </p>
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

              <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50 custom-scrollbar">
                {Object.keys(usageStats).length === 0 ? (
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
                        onChange={(e) => updateActiveProvider({ models: e.target.value })}
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
    </div>
  );
}
