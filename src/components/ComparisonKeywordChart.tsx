import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";
import { BarChart2, ChevronDown, ChevronUp, Layers, Split, Sparkles, HelpCircle } from "lucide-react";
import { SearchQueryResponse, KeywordGroup } from "../services/gemini";

interface ComparisonKeywordChartProps {
  modelAResult?: SearchQueryResponse & { _isLoading?: boolean; _isError?: boolean };
  modelBResult?: SearchQueryResponse & { _isLoading?: boolean; _isError?: boolean };
  modelAName?: string;
  modelBName?: string;
  uiLang?: string;
  theme?: "dark" | "light";
}

// Stop words and Boolean operators to ignore when analyzing query term coverage
const OPERATOR_STOP_WORDS = new Set([
  "AND", "OR", "NOT", "NEAR", "ONEAR", "SAME", "ADJ", "W", "PRE",
  "SU", "TI", "AB", "KY", "TKA", "CLC", "AU", "AF", "TS", "TOPIC", "TITLE",
  "AND NOT", "WITHIN"
]);

function extractWordsFromQuery(queryStr?: string): Set<string> {
  if (!queryStr) return new Set();
  // Strip special symbols, keep words/characters
  const tokens = queryStr
    .replace(/[()+=*?${}\[\]"':;\/\\,]/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !OPERATOR_STOP_WORDS.has(t.toUpperCase()));
  return new Set(tokens.map(t => t.toLowerCase()));
}

function extractModelVocab(keywords?: KeywordGroup[]): {
  allWords: Set<string>;
  zhCount: number;
  enCount: number;
  conceptCount: number;
  perConcept: { name: string; count: number; words: string[] }[];
} {
  if (!keywords || !Array.isArray(keywords)) {
    return { allWords: new Set(), zhCount: 0, enCount: 0, conceptCount: 0, perConcept: [] };
  }

  const allWords = new Set<string>();
  let zhCount = 0;
  let enCount = 0;
  const perConcept: { name: string; count: number; words: string[] }[] = [];

  keywords.forEach((group, idx) => {
    const conceptWords: string[] = [];
    if (group.original) {
      allWords.add(group.original.toLowerCase());
      conceptWords.push(group.original);
    }
    if (Array.isArray(group.zhSynonyms)) {
      group.zhSynonyms.forEach(w => {
        if (w) {
          allWords.add(w.toLowerCase());
          conceptWords.push(w);
          zhCount++;
        }
      });
    }
    if (Array.isArray(group.enSynonyms)) {
      group.enSynonyms.forEach(w => {
        if (w) {
          allWords.add(w.toLowerCase());
          conceptWords.push(w);
          enCount++;
        }
      });
    }
    perConcept.push({
      name: group.original || `概念 ${idx + 1}`,
      count: conceptWords.length,
      words: conceptWords,
    });
  });

  return {
    allWords,
    zhCount,
    enCount,
    conceptCount: keywords.length,
    perConcept,
  };
}

export const ComparisonKeywordChart: React.FC<ComparisonKeywordChartProps> = ({
  modelAResult,
  modelBResult,
  modelAName = "Model A",
  modelBName = "Model B",
  uiLang = "mix",
  theme = "dark",
}) => {
  const [chartView, setChartView] = useState<"dimensions" | "concepts">("dimensions");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const isZh = uiLang === "zh" || uiLang === "mix";
  const isLight = theme === "light";

  // Compute vocabulary sets and metrics
  const analysis = useMemo(() => {
    const vocabA = extractModelVocab(modelAResult?.keywords);
    const vocabB = extractModelVocab(modelBResult?.keywords);

    const queryWordsA = extractWordsFromQuery(
      modelAResult?.fieldSpecificQuery || modelAResult?.booleanQuery
    );
    const queryWordsB = extractWordsFromQuery(
      modelBResult?.fieldSpecificQuery || modelBResult?.booleanQuery
    );

    // Intersection & Differences
    const sharedWords: string[] = [];
    const uniqueA: string[] = [];
    const uniqueB: string[] = [];

    vocabA.allWords.forEach(w => {
      if (vocabB.allWords.has(w)) {
        sharedWords.push(w);
      } else {
        uniqueA.push(w);
      }
    });

    vocabB.allWords.forEach(w => {
      if (!vocabA.allWords.has(w)) {
        uniqueB.push(w);
      }
    });

    const unionCount = vocabA.allWords.size + vocabB.allWords.size - sharedWords.length;
    const jaccardSim = unionCount > 0 ? Math.round((sharedWords.length / unionCount) * 100) : 0;

    // Dimension Data for BarChart
    const dimensionData = [
      {
        metric: isZh ? "核心概念" : "Core Concepts",
        modelA: vocabA.conceptCount,
        modelB: vocabB.conceptCount,
      },
      {
        metric: isZh ? "中文拓展词" : "ZH Synonyms",
        modelA: vocabA.zhCount,
        modelB: vocabB.zhCount,
      },
      {
        metric: isZh ? "英文拓展词" : "EN Synonyms",
        modelA: vocabA.enCount,
        modelB: vocabB.enCount,
      },
      {
        metric: isZh ? "检索式词量" : "Query Terms",
        modelA: queryWordsA.size,
        modelB: queryWordsB.size,
      },
      {
        metric: isZh ? "总词汇覆盖" : "Total Vocab",
        modelA: vocabA.allWords.size,
        modelB: vocabB.allWords.size,
      },
    ];

    // Concept Breakdown Data
    const maxConcepts = Math.max(vocabA.perConcept.length, vocabB.perConcept.length);
    const conceptData: {
      concept: string;
      modelA: number;
      modelB: number;
      nameA: string;
      nameB: string;
    }[] = [];

    for (let i = 0; i < maxConcepts; i++) {
      const cA = vocabA.perConcept[i];
      const cB = vocabB.perConcept[i];
      const label = cA?.name || cB?.name || `C${i + 1}`;
      const shortLabel = label.length > 8 ? label.slice(0, 7) + "…" : label;

      conceptData.push({
        concept: shortLabel,
        modelA: cA?.count || 0,
        modelB: cB?.count || 0,
        nameA: cA?.name || "-",
        nameB: cB?.name || "-",
      });
    }

    return {
      vocabA,
      vocabB,
      sharedCount: sharedWords.length,
      uniqueACount: uniqueA.length,
      uniqueBCount: uniqueB.length,
      jaccardSim,
      dimensionData,
      conceptData,
      totalTermsA: vocabA.allWords.size,
      totalTermsB: vocabB.allWords.size,
    };
  }, [modelAResult, modelBResult, isZh]);

  // If both models are still loading without any keywords yet, don't show blank chart
  const hasData = analysis.vocabA.conceptCount > 0 || analysis.vocabB.conceptCount > 0;
  if (!hasData) {
    return null;
  }

  const shortNameA = modelAName.length > 14 ? modelAName.slice(0, 12) + "…" : modelAName;
  const shortNameB = modelBName.length > 14 ? modelBName.slice(0, 12) + "…" : modelBName;

  return (
    <div className="w-full bg-slate-900/60 border border-cyan-500/20 rounded-xl p-3 mb-3 shadow-md backdrop-blur-sm select-none transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-cyan-400" />
          <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider font-mono">
            {isZh ? "关键词覆盖差异可视化 (Recharts)" : "KEYWORD COVERAGE ANALYSIS (RECHARTS)"}
          </span>

          {/* Quick Overlap Tag */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300"
            title={
              isZh
                ? `两模型词汇相似重合度: ${analysis.jaccardSim}%, 共同词汇: ${analysis.sharedCount}`
                : `Vocabulary Jaccard similarity: ${analysis.jaccardSim}%, Shared: ${analysis.sharedCount}`
            }
          >
            <Sparkles size={10} className="text-amber-400" />
            {isZh ? `重合度 ${analysis.jaccardSim}%` : `Overlap ${analysis.jaccardSim}%`}
          </span>
        </div>

        {/* View Toggle & Collapse Button */}
        <div className="flex items-center gap-1.5">
          {!isCollapsed && (
            <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setChartView("dimensions")}
                className={`text-[9px] uppercase font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                  chartView === "dimensions"
                    ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={isZh ? "对比核心概念、同义词量、检索式词量等维度" : "Compare key metric dimensions"}
              >
                {isZh ? "维度对比" : "Metrics"}
              </button>
              <button
                type="button"
                onClick={() => setChartView("concepts")}
                className={`text-[9px] uppercase font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                  chartView === "concepts"
                    ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={isZh ? "对比每个概念提取出的词汇拓展量" : "Compare vocabulary per concept"}
              >
                {isZh ? "各概念覆盖" : "Concepts"}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(prev => !prev)}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title={isCollapsed ? (isZh ? "展开图表" : "Expand chart") : (isZh ? "收起图表" : "Collapse chart")}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Main Chart Body */}
      {!isCollapsed && (
        <div className="mt-2.5 flex flex-col gap-2 animate-fade-in">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-[10px] font-mono">
            <div className="bg-black/30 border border-cyan-500/15 rounded-lg px-2 py-1 flex flex-col">
              <span className="text-[9px] text-slate-400">{isZh ? "Model A 总词" : "Model A Vocab"}</span>
              <span className="text-cyan-300 font-bold text-xs">{analysis.totalTermsA}</span>
            </div>
            <div className="bg-black/30 border border-purple-500/15 rounded-lg px-2 py-1 flex flex-col">
              <span className="text-[9px] text-slate-400">{isZh ? "Model B 总词" : "Model B Vocab"}</span>
              <span className="text-purple-300 font-bold text-xs">{analysis.totalTermsB}</span>
            </div>
            <div className="bg-black/30 border border-white/5 rounded-lg px-2 py-1 flex flex-col">
              <span className="text-[9px] text-slate-400">{isZh ? "共同覆盖词" : "Shared Terms"}</span>
              <span className="text-emerald-400 font-bold text-xs">{analysis.sharedCount}</span>
            </div>
            <div className="bg-black/30 border border-cyan-500/10 rounded-lg px-2 py-1 flex flex-col">
              <span className="text-[9px] text-slate-400">{isZh ? "A 独有扩展" : "Unique to A"}</span>
              <span className="text-cyan-400/90 font-bold text-xs">+{analysis.uniqueACount}</span>
            </div>
            <div className="bg-black/30 border border-purple-500/10 rounded-lg px-2 py-1 flex flex-col">
              <span className="text-[9px] text-slate-400">{isZh ? "B 独有扩展" : "Unique to B"}</span>
              <span className="text-purple-400/90 font-bold text-xs">+{analysis.uniqueBCount}</span>
            </div>
          </div>

          {/* Recharts Chart Container */}
          <div className="w-full h-36 bg-black/25 rounded-lg border border-white/5 pt-2 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === "dimensions" ? (
                <BarChart
                  data={analysis.dimensionData}
                  margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                  barGap={4}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)"} 
                    vertical={false} 
                  />
                  <XAxis
                    dataKey="metric"
                    tick={{ fill: isLight ? "#334155" : "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                    axisLine={{ stroke: isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: isLight ? "#64748b" : "#64748b", fontSize: 9, fontFamily: "monospace" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? "#ffffff" : "rgba(15, 23, 42, 0.95)",
                      borderColor: isLight ? "#38bdf8" : "rgba(6, 182, 212, 0.3)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: isLight ? "#0f172a" : "#e2e8f0",
                      boxShadow: isLight ? "0 4px 16px rgba(0,0,0,0.1)" : "0 4px 20px rgba(0,0,0,0.5)",
                    }}
                    cursor={{ fill: isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.03)" }}
                    formatter={(val: any, name: any) => [
                      `${val} ${isZh ? "个词" : "words"}`,
                      name === "modelA" ? `Model A (${shortNameA})` : `Model B (${shortNameB})`,
                    ]}
                  />
                  <Bar
                    dataKey="modelA"
                    name="modelA"
                    fill={isLight ? "#0284c7" : "#06b6d4"}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                  <Bar
                    dataKey="modelB"
                    name="modelB"
                    fill={isLight ? "#9333ea" : "#a855f7"}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              ) : (
                <BarChart
                  data={analysis.conceptData}
                  margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                  barGap={4}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)"} 
                    vertical={false} 
                  />
                  <XAxis
                    dataKey="concept"
                    tick={{ fill: isLight ? "#334155" : "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                    axisLine={{ stroke: isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: isLight ? "#64748b" : "#64748b", fontSize: 9, fontFamily: "monospace" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? "#ffffff" : "rgba(15, 23, 42, 0.95)",
                      borderColor: isLight ? "#c084fc" : "rgba(168, 85, 247, 0.3)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: isLight ? "#0f172a" : "#e2e8f0",
                      boxShadow: isLight ? "0 4px 16px rgba(0,0,0,0.1)" : "0 4px 20px rgba(0,0,0,0.5)",
                    }}
                    cursor={{ fill: isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.03)" }}
                    formatter={(val: any, name: any) => [
                      `${val} ${isZh ? "个词汇扩展" : "expanded terms"}`,
                      name === "modelA" ? `Model A (${shortNameA})` : `Model B (${shortNameB})`,
                    ]}
                  />
                  <Bar
                    dataKey="modelA"
                    name="modelA"
                    fill={isLight ? "#0284c7" : "#06b6d4"}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                  <Bar
                    dataKey="modelB"
                    name="modelB"
                    fill={isLight ? "#9333ea" : "#a855f7"}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span>
                <span className="text-cyan-300 font-bold">Model A:</span>
                <span className="truncate max-w-[120px]">{shortNameA}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-400"></span>
                <span className="text-purple-300 font-bold">Model B:</span>
                <span className="truncate max-w-[120px]">{shortNameB}</span>
              </span>
            </div>
            <span className="text-[9px] text-slate-500 hidden sm:inline">
              {chartView === "dimensions"
                ? (isZh ? "核心概念 / 扩展同义词 / 检索式词量多维横向对比" : "Multi-metric coverage breakdown")
                : (isZh ? "各概念词组扩展深度对比" : "Vocabulary expansion depth per concept")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
