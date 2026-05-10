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
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateSearchQuery, SearchQueryResponse } from "./services/gemini";

const UI_STRINGS = {
  mix: {
    appTitle: "AI_RETRIEVAL_X",
    appSubtitle: "Intelligence Query Framework",
    engineStatus: "Engine Status",
    operational: "Operational",
    inputLabel: "User Query Intent",
    inputPlaceholder: "请详细描述您的检索需求 / Describe your search intent in detail ...",
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
    historyButton: "HISTORY",
    configTitle: "系统配置 Configuration",
    apiKeyLabel: "Gemini API Key",
    apiKeyPlaceholder: "输入您的 API Key (为空使用默认)",
    modelLabel: "底层模型 Model",
    saveConfig: "SAVE / 保存",
    closeConfig: "CLOSE / 关闭",
    dbTypesLabel: "DB Source",
    langPrefLabel: "Lang Pref"
  },
  zh: {
    appTitle: "AI 检索力",
    appSubtitle: "智慧检索式生成专家",
    engineStatus: "引擎状态",
    operational: "运行中",
    inputLabel: "用户检索意图",
    inputPlaceholder: "请详细描述您的检索需求，例如：关于柔性屏幕在极寒环境下的耐久性测试标准研究...",
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
    historyButton: "历史",
    configTitle: "系统配置",
    apiKeyLabel: "API 密钥",
    apiKeyPlaceholder: "输入您的 API 密钥 (为空使用默认)",
    modelLabel: "底层大模型",
    saveConfig: "保存",
    closeConfig: "关闭",
    dbTypesLabel: "目标数据库",
    langPrefLabel: "语种偏好"
  },
  en: {
    appTitle: "AI_RETRIEVAL_X",
    appSubtitle: "Intelligence Query Framework",
    engineStatus: "Engine Status",
    operational: "Operational",
    inputLabel: "User Query Intent",
    inputPlaceholder: "Describe your search intent in detail, e.g., durability testing standards for flexible screens in extreme cold...",
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
    historyButton: "HISTORY",
    configTitle: "Configuration",
    apiKeyLabel: "API Key",
    apiKeyPlaceholder: "Enter your API Key (leave empty for default)",
    modelLabel: "Underlying Model",
    saveConfig: "Save",
    closeConfig: "Close",
    dbTypesLabel: "DB Source",
    langPrefLabel: "Lang Pref"
  }
};

const MODELS = [
  "gemini-3.1-pro-preview",
  "gemini-3-flash-preview",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-pro-exp-02-05",
  "gemini-2.0-flash"
];

const DB_TYPES = [
  "通用搜索引擎 (Baidu/Bing)",
  "CNKI 知网 (中文学术)",
  "万方数据 (中文学术)",
  "维普资讯 (中文学术)",
  "ScienceDirect/Wiley (外文学术)",
  "PubMed (生物医药)",
  "CNIPA / Espacenet (专利检索)",
  "国家法律/标准/统计局 (政务数据)",
  "百度学术 / PubScholar"
];

interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  dbType: string;
  langPref: string;
  result: SearchQueryResponse;
}

export default function App() {
  const [input, setInput] = useState("");
  const [dbType, setDbType] = useState(DB_TYPES[0]);
  const [langPref, setLangPref] = useState("双语混合 (Bilingual)");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchQueryResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<{ title: string; details: string } | null>(null);
  const [showMapped, setShowMapped] = useState(false);

  const [uiLang, setUiLang] = useState<"mix" | "zh" | "en">("mix");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const t = UI_STRINGS[uiLang];

  useEffect(() => {
    const saved = localStorage.getItem("ai_retrieval_history");
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("ai_retrieval_history", JSON.stringify(items));
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setShowMapped(true);
    try {
      const resp = await generateSearchQuery(input, dbType, langPref, apiKey, selectedModel);
      setResult(resp);
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        input,
        dbType,
        langPref,
        result: resp
      };
      saveHistory([newItem, ...history].slice(0, 50));
    } catch (err: any) {
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
    setResult(null);
    setError(null);
  };

  const restoreHistory = (item: HistoryItem) => {
    setInput(item.input);
    setDbType(item.dbType);
    setLangPref(item.langPref);
    setResult(item.result);
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
              {t.appTitle} <span className="text-cyan-500 text-[10px] font-mono ml-2 opacity-70">v2.4.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">{t.appSubtitle}</p>
          </div>
        </div>
        
        <div className="hidden md:flex gap-6 items-center">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setUiLang("zh")}
              className={`p-1.5 rounded transition-all text-xs font-bold ${uiLang === "zh" ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="中文"
            >
              中
            </button>
            <button
              onClick={() => setUiLang("mix")}
              className={`p-1.5 rounded transition-all text-xs font-bold ${uiLang === "mix" ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="双语 / Bilingual"
            >
              Mix
            </button>
            <button
              onClick={() => setUiLang("en")}
              className={`p-1.5 rounded transition-all text-xs font-bold ${uiLang === "en" ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="English"
            >
              EN
            </button>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-500 uppercase block leading-none mb-1">{t.engineStatus}</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> {t.operational}
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
            <label className="text-[11px] text-cyan-400/80 mb-3 uppercase font-bold tracking-[0.2em]">{t.inputLabel}</label>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              className="flex-1 bg-transparent border-none outline-none resize-none text-xl text-slate-200 placeholder:text-slate-700 leading-relaxed font-medium"
            />

            <div className="mt-4 flex flex-wrap justify-between items-center pt-4 border-t border-white/5 gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2" title={t.dbTypesLabel}>
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

                <div className="flex items-center gap-2" title={t.langPrefLabel}>
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
                    title={t.reset}
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
                      {t.generate}
                      <Search size={18} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

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
                <label className="text-[11px] text-cyan-400/80 uppercase font-bold tracking-[0.2em]">{t.formulaTitle}</label>
                {result && (
                  <div className="flex bg-black/40 rounded-lg p-1 border border-cyan-500/20">
                    <button
                      onClick={() => setShowMapped(false)}
                      className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-all ${
                        !showMapped ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {t.basicWeb}
                    </button>
                    <button
                      onClick={() => setShowMapped(true)}
                      className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-all ${
                        showMapped ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {t.schemaMapped}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="font-mono text-cyan-100 text-base leading-relaxed overflow-y-auto custom-scrollbar select-all flex-shrink-0 min-h-[80px] p-4 bg-black/20 rounded-lg border border-cyan-500/10">
                  {result ? (showMapped ? result.fieldSpecificQuery : result.booleanQuery) : "Formula will appear here..."}
                </div>

                {result && showMapped && result.schemaMapping && result.schemaMapping.length > 0 && (
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
                    <Check size={10} className="text-emerald-500" /> {t.processedWith}
                  </span>
                  <button 
                    onClick={() => handleCopy(showMapped ? result.fieldSpecificQuery : result.booleanQuery)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-black tracking-widest flex items-center gap-1.5 transition-all"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? t.copied : t.copyCode}
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
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">{t.semanticMap}</h3>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{t.topicExpansion}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {result ? (
                  result.keywords.map((group, idx) => (
                    <motion.div
                      key={group.original}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 group hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-mono text-cyan-400 opacity-70">#0{idx + 1} {t.coreKeyword}</span>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
                      </div>
                      <p className="text-sm font-black text-white mb-3 uppercase tracking-tight">{group.original}</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-[9px] font-mono text-slate-600 uppercase">ZH:</span>
                        {group.zhSynonyms?.map((syn, sIdx) => (
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
                        {group.enSynonyms?.map((syn, sIdx) => (
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
                     <p className="mt-4 text-[10px] font-mono tracking-tighter uppercase">{t.waitingInput}</p>
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
                <Lightbulb size={12} className="text-orange-400" /> {t.insightTitle}
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-4">
                {result ? result.explanation : t.insightDesc}
              </p>
            </div>

            <div className="relative z-10 border-t border-white/5 pt-3">
               <div className="flex justify-between items-end">
                  <div className="text-[10px] font-mono text-cyan-400/70 uppercase"><span className="font-bold">{t.recallBoost}</span></div>
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
            {t.sysOpt}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono tracking-tighter">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors flex items-center" onClick={() => setIsHistoryOpen(true)}>
              <History size={12} className="mr-1" /> {t.historyButton}
            </span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors flex items-center" onClick={() => setIsConfigOpen(true)}>
              <Settings size={12} className="mr-1" /> {t.settings}
            </span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">MODEL_LOGS</span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">API_METRICS</span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">DB_STATUS: OK</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter">
          CTX_ID: {loading ? t.processing : (result ? t.genComplete : t.waitInit)} // BUILD_HASH: 0x55F2A
        </div>
      </footer>

      {/* Config Modal */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Settings size={16} className="text-cyan-400" />
                  {t.configTitle}
                </h3>
                <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-5">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">{t.apiKeyLabel}</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={t.apiKeyPlaceholder}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">
                    If left empty, the system default key will be used.
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">{t.modelLabel}</label>
                  <div className="relative">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono appearance-none"
                    >
                      {MODELS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                <button 
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest"
                >
                  {t.closeConfig}
                </button>
                <button 
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(8,145,178,0.2)]"
                >
                  {t.saveConfig}
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
                  {t.historyTitle}
                </h3>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button 
                      onClick={() => saveHistory([])}
                      className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-all text-red-400 hover:bg-red-500/10"
                    >
                      {t.clearHistory}
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
                    <span className="text-xs uppercase font-mono tracking-widest">{t.noHistory}</span>
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
