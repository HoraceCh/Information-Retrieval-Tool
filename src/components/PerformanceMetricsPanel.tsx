import React, { useState, useRef, useEffect } from 'react';
import { Zap, Cpu, Gauge, Clock, ChevronDown, Sparkles, Trophy, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { SearchQueryResponse } from '../services/gemini';

interface PerformanceMetricsPanelProps {
  result?: SearchQueryResponse | null;
  loading?: boolean;
  activeModel: string;
  activeProviderName: string;
  isCompareMode?: boolean;
  compareModel?: string;
  uiLang?: string;
  onOpenSettings?: () => void;
}

export const PerformanceMetricsPanel: React.FC<PerformanceMetricsPanelProps> = ({
  result,
  loading = false,
  activeModel,
  activeProviderName,
  isCompareMode = false,
  compareModel,
  uiLang = 'zh',
  onOpenSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Extract metrics from primary result
  const latency = result?._latencyMs;
  const isFromCache = result?._fromCache;
  const usage = result?._usage;
  const promptTokens = usage?.promptTokens ?? 0;
  const completionTokens = usage?.completionTokens ?? 0;
  const totalTokens = usage?.totalTokens ?? 0;

  // Comparison metrics if applicable
  const compareResult = result?._compareResult;
  const compareLatency = compareResult?._latencyMs;
  const compareUsage = compareResult?._usage;
  const compareTotalTokens = compareUsage?.totalTokens ?? 0;

  // Concept count for token efficiency ratio
  const keywordCount = result?.keywords?.length || 1;
  const tokensPerConcept = totalTokens > 0 ? (totalTokens / Math.max(1, keywordCount)).toFixed(1) : '0';

  // Format latency display string
  const formatLatency = (ms?: number) => {
    if (ms === undefined || ms === null) return '--';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Color theme based on latency
  const getLatencyColor = (ms?: number, fromCache?: boolean) => {
    if (fromCache) return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    if (!ms) return 'text-slate-400 bg-slate-800/40 border-white/5';
    if (ms < 1500) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (ms < 3500) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
  };

  // Model recommendation analysis
  const getModelRecommendation = () => {
    if (isFromCache) {
      return {
        tag: "毫秒极速直出",
        title: "本地智能缓存命中",
        text: "当前检索式已复用本地高可信缓存，耗时接近 0ms，无需消耗 API 配额，体验最佳。",
        badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40"
      };
    }
    if (isCompareMode && compareResult) {
      const isAFaster = (latency || 99999) < (compareLatency || 99999);
      const isALessTokens = totalTokens <= compareTotalTokens;
      if (isAFaster && isALessTokens) {
        return {
          tag: "综合能效最优",
          title: `Model A (${activeModel}) 胜出`,
          text: `在当前提示词下，Model A 响应快 ${(compareLatency! - latency!)}ms 且节省 ${Math.max(0, compareTotalTokens - totalTokens)} tokens，建议设定为主力模型。`,
          badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
        };
      } else if (!isAFaster && !isALessTokens) {
        return {
          tag: "综合能效最优",
          title: `Model B (${compareModel || 'Model B'}) 胜出`,
          text: `Model B 速度更快且 Token 更加精简，适合高频检索任务。可在设置中切换为主选模型。`,
          badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40"
        };
      } else {
        return {
          tag: "速度与深度权衡",
          title: "双模型各具优势",
          text: `Model A 与 Model B 在耗时与词量扩展深度各有侧重，建议根据学科专属性和检索词召回广度灵活挑选。`,
          badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40"
        };
      }
    }
    if (latency && latency < 1800 && totalTokens < 500) {
      return {
        tag: "高效敏捷",
        title: "高性价比推荐",
        text: `当前 ${activeModel} 响应时延低于 1.8s，Token 控制紧凑，是文献信息素养比赛和日常查准的最优模型选择。`,
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      };
    }
    if (activeModel.includes('reasoner') || activeModel.includes('r1') || (latency && latency >= 3500)) {
      return {
        tag: "深度思考",
        title: "重度推理模型",
        text: "当前模型执行了完整的思维链探索，产出的同义词关联更深。若需要秒级流畅体验，建议切换至 Flash 或 V3 系列模型。",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40"
      };
    }
    return {
      tag: "标准表现",
      title: "检索性能稳定",
      text: "当前模型响应与词元产出处于均衡状态，可满足大多数专业数据库检索需求。",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
    };
  };

  const rec = getModelRecommendation();

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button in System Info Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-mono transition-all cursor-pointer select-none group ${
          isOpen
            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
            : result && !loading
              ? 'bg-slate-800/60 hover:bg-slate-700/60 border-white/10 hover:border-cyan-500/40 text-slate-200'
              : 'bg-slate-800/40 hover:bg-slate-800/70 border-white/5 text-slate-400'
        }`}
        title="点击展开查看模型响应耗时 (Latency)、Token 吞吐及最优模型推荐"
        aria-label="Performance Metrics Panel"
      >
        <div className="flex items-center gap-1">
          <Zap 
            size={13} 
            className={`${
              loading 
                ? 'text-amber-400 animate-spin' 
                : result 
                  ? 'text-cyan-400 group-hover:scale-110 transition-transform' 
                  : 'text-slate-500'
            }`} 
          />
          <span className="font-bold text-[11px] uppercase tracking-wider hidden sm:inline">
            {uiLang === 'zh' || uiLang === 'mix' ? "性能指标" : "Metrics"}
          </span>
        </div>

        {/* Dynamic Metric Badges */}
        {loading ? (
          <span className="text-[10px] text-amber-400 font-bold animate-pulse flex items-center gap-1">
            测速中...
          </span>
        ) : result ? (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            {/* Latency Pill */}
            <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono leading-none ${getLatencyColor(latency, isFromCache)}`}>
              {isFromCache ? '0ms 缓存' : formatLatency(latency)}
            </span>

            {/* Tokens Pill */}
            <span className="text-slate-400 text-[10px] font-mono hidden md:inline">
              <span className="text-slate-300 font-bold">{totalTokens}</span> tok
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">待命</span>
        )}

        <ChevronDown 
          size={11} 
          className={`transition-transform duration-200 text-slate-400 group-hover:text-cyan-400 ${isOpen ? 'rotate-180 text-cyan-300' : ''}`} 
        />
      </button>

      {/* Floating Detailed Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-80 sm:w-96 bg-[#0a0f18] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden z-[150] animate-in fade-in slide-in-from-top-2 duration-150 p-3.5 flex flex-col gap-3 font-sans text-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40 text-cyan-300">
                <Gauge size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>实时性能与效率指标</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono">LIVE</span>
                </h4>
                <p className="text-[9px] text-slate-400">衡量响应延迟、词元吞吐及模型成本效益</p>
              </div>
            </div>
            
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${rec.badgeColor}`}>
              {rec.tag}
            </span>
          </div>

          {/* If no result generated yet */}
          {!result && (
            <div className="py-6 px-4 text-center flex flex-col items-center justify-center gap-2 bg-black/20 rounded-xl border border-white/5">
              <Clock size={24} className="text-slate-600 animate-pulse" />
              <p className="text-xs text-slate-400 font-medium">尚未生成检索式</p>
              <p className="text-[10px] text-slate-500">点击主界面【生成布尔检索式】后，此处将即时记录往返耗时 (Latency) 与 Token 消耗效率。</p>
            </div>
          )}

          {/* Results Analysis */}
          {result && (
            <>
              {/* Primary 3-Metric Cards Grid */}
              <div className="grid grid-cols-3 gap-2">
                {/* Metric 1: Latency */}
                <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Zap size={11} className="text-cyan-400" />
                      响应耗时
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-white tracking-tight">
                    {isFromCache ? (
                      <span className="text-sky-400">~0<span className="text-xs font-normal ml-0.5">ms</span></span>
                    ) : (
                      formatLatency(latency)
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 leading-none">
                    {isFromCache ? "命中本地高速缓存" : (latency && latency < 1500) ? "⚡ 极速响应" : (latency && latency < 3500) ? "🟢 标准耗时" : "🧠 深度思考"}
                  </span>
                </div>

                {/* Metric 2: Total Tokens */}
                <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Cpu size={11} className="text-purple-400" />
                      Token 总耗
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-white tracking-tight">
                    {totalTokens}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">tok</span>
                  </div>
                  <span className="text-[9px] text-slate-500 leading-none">
                    入: {promptTokens} | 出: {completionTokens}
                  </span>
                </div>

                {/* Metric 3: Token Efficiency Ratio */}
                <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-400" />
                      概念能效比
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-white tracking-tight">
                    {tokensPerConcept}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">/概念</span>
                  </div>
                  <span className="text-[9px] text-slate-500 leading-none">
                    产出 {keywordCount} 组学术概念
                  </span>
                </div>
              </div>

              {/* Active Model Snapshot */}
              <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block leading-none mb-0.5">当前模型与提供商</span>
                    <span className="font-bold text-white font-mono text-xs">{result._modelUsed || activeModel}</span>
                  </div>
                </div>
                <span className="text-[10px] text-cyan-300 font-medium px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                  {result._providerUsed || activeProviderName}
                </span>
              </div>

              {/* Compare Mode Comparison Matrix (If Dual Models Active) */}
              {isCompareMode && compareResult && (
                <div className="p-2.5 bg-purple-950/20 border border-purple-500/20 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                      <Trophy size={11} className="text-purple-400" />
                      双模型横向对决数据 (A/B Benchmark)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-black/40 rounded-lg border border-white/5 flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400">Model A ({activeModel})</span>
                      <div className="font-bold text-cyan-300">
                        {formatLatency(latency)} · {totalTokens} tok
                      </div>
                    </div>

                    <div className="p-2 bg-black/40 rounded-lg border border-white/5 flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400">Model B ({compareModel || 'Model B'})</span>
                      <div className="font-bold text-purple-300">
                        {formatLatency(compareLatency)} · {compareTotalTokens} tok
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Optimal Model Guidance */}
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <ShieldCheck size={13} className="text-amber-400 shrink-0" />
                  <span>{rec.title}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {rec.text}
                </p>
              </div>
            </>
          )}

          {/* Quick Footer Action to Settings */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
            <span className="text-slate-500 text-[10px] flex items-center gap-1">
              <HelpCircle size={11} />
              数据基于实时请求计算
            </span>
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>配置与切换模型</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
