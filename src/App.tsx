/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  Copy, 
  Check, 
  RotateCcw, 
  Database, 
  Lightbulb,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateSearchQuery, SearchQueryResponse } from "./services/gemini";

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

export default function App() {
  const [input, setInput] = useState("");
  const [dbType, setDbType] = useState(DB_TYPES[0]);
  const [langPref, setLangPref] = useState("双语混合 (Bilingual)");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchQueryResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMapped, setShowMapped] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setShowMapped(true);
    try {
      const resp = await generateSearchQuery(input, dbType, langPref);
      setResult(resp);
    } catch (err: any) {
      setError(err.message || "生成检索式时出错");
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
              AI_RETRIEVAL_X <span className="text-cyan-500 text-[10px] font-mono ml-2 opacity-70">v2.4.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Intelligence Query Framework</p>
          </div>
        </div>
        
        <div className="hidden md:flex gap-4 items-center">
          <div className="text-right">
            <span className="text-[9px] text-slate-500 uppercase block leading-none mb-1">Engine Status</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Operational
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
            <label className="text-[11px] text-cyan-400/80 mb-3 uppercase font-bold tracking-[0.2em]">User Query Intent</label>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="请详细描述您的检索需求，例如：关于柔性屏幕在极寒环境下的耐久性测试标准研究..."
              className="flex-1 bg-transparent border-none outline-none resize-none text-xl text-slate-200 placeholder:text-slate-700 leading-relaxed font-medium"
            />

            <div className="mt-4 flex flex-wrap justify-between items-center pt-4 border-t border-white/5 gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-cyan-500/50" />
                  <select
                    value={dbType}
                    onChange={(e) => setDbType(e.target.value)}
                    className="bg-transparent border-none text-xs font-mono text-slate-400 focus:ring-0 cursor-pointer hover:text-cyan-400 transition-colors uppercase tracking-widest p-0 pl-1"
                  >
                    {DB_TYPES.map(type => (
                      <option key={type} value={type} className="bg-[#05070A]">{type}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-cyan-500/50" />
                  <select
                    value={langPref}
                    onChange={(e) => setLangPref(e.target.value)}
                    className="bg-transparent border-none text-xs font-mono text-slate-400 focus:ring-0 cursor-pointer hover:text-cyan-400 transition-colors uppercase tracking-widest p-0 pl-1"
                  >
                    <option value="双语混合 (Bilingual)" className="bg-[#05070A]">双语混合 (Bilingual)</option>
                    <option value="仅中文 (Chinese Only)" className="bg-[#05070A]">仅中文 (CN Only)</option>
                    <option value="仅英文 (English Only)" className="bg-[#05070A]">仅英文 (EN Only)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {input && (
                  <button 
                    onClick={reset}
                    className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    title="重置"
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
                      GENERATE_QUERY
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
                <label className="text-[11px] text-cyan-400/80 uppercase font-bold tracking-[0.2em]">Search Formula</label>
                {result && (
                  <div className="flex bg-black/40 rounded-lg p-1 border border-cyan-500/20">
                    <button
                      onClick={() => setShowMapped(false)}
                      className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-all ${
                        !showMapped ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Basic Web
                    </button>
                    <button
                      onClick={() => setShowMapped(true)}
                      className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded transition-all ${
                        showMapped ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Schema-Mapped
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
                    <Check size={10} className="text-emerald-500" /> PROCESSED_WITH_GEMINI_AI // CONFIDENCE: HIGH
                  </span>
                  <button 
                    onClick={() => handleCopy(showMapped ? result.fieldSpecificQuery : result.booleanQuery)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-black tracking-widest flex items-center gap-1.5 transition-all"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? "COPIED" : "COPY_TO_CLIPBOARD"}
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
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Semantic Map</h3>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Topic Expansion Engine</p>
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
                        <span className="text-[10px] font-mono text-cyan-400 opacity-70">#0{idx + 1} CORE_KEYWORD</span>
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
                     <p className="mt-4 text-[10px] font-mono tracking-tighter uppercase">Waiting for input...</p>
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
                <Lightbulb size={12} className="text-orange-400" /> Logic Insight
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-4">
                {result ? result.explanation : "分析用户的检索语境，提取其中的学术主轴，并利用大规模语义语言模型针对性地补充相关领域的高频同义词与术语，以极大地提升检索覆盖面。"}
              </p>
            </div>

            <div className="relative z-10 border-t border-white/5 pt-3">
               <div className="flex justify-between items-end">
                  <div className="text-[10px] font-mono text-cyan-400/70 uppercase">RECALL_BOOST: <span className="font-bold">GAIN_ENHANCED</span></div>
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
            SYSTEM_RESOURCES_OPTIMIZED
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono tracking-tighter">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">MODEL_LOGS</span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">API_METRICS</span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">DB_STATUS: OK</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter">
          CTX_ID: {loading ? "PROCESSING..." : (result ? "GEN_COMPLETE" : "WAIT_INIT")} // BUILD_HASH: 0x55F2A
        </div>
      </footer>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-12 left-1/2 z-50 px-6 py-3 bg-red-500/10 border border-red-500/50 backdrop-blur-md rounded-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
          >
            <Info className="text-red-400" size={18} />
            <span className="text-sm font-bold text-red-200">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-red-400/50 hover:text-red-400 font-black text-xs uppercase tracking-widest underline underline-offset-4">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
