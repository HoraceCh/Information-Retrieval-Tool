import React, { useState, useMemo } from "react";
import { 
  BarChart2, 
  Star, 
  Trash2, 
  Download, 
  Search, 
  MessageSquare, 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown,
  X,
  PlusCircle,
  Database,
  Cpu,
  RefreshCw
} from "lucide-react";

export interface UserFeedback {
  id: string;
  timestamp: number;
  queryText: string;
  providerId: string;
  modelName: string;
  dbType: string;
  rating: number; // 1-5 rating
  tags: string[]; // selected tag filters
  writtenFeedback: string;
  optimized?: boolean;
}

interface FeedbackAnalyticsProps {
  feedbacks: UserFeedback[];
  onClearAll: () => void;
  onDeleteOne: (id: string) => void;
  lang: string;
}

export default function FeedbackAnalytics({ feedbacks, onClearAll, onDeleteOne, lang }: FeedbackAnalyticsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  const isZh = lang === "zh" || lang === "mix";

  // Compute stats
  const stats = useMemo(() => {
    if (feedbacks.length === 0) return null;

    let sumRating = 0;
    const ratingDist = [0, 0, 0, 0, 0]; // 1 to 5 star frequency
    const tagFrequency: Record<string, number> = {};
    let optimizedCount = 0;

    feedbacks.forEach(f => {
      sumRating += f.rating;
      const index = Math.max(1, Math.min(5, Math.round(f.rating))) - 1;
      ratingDist[index]++;
      
      f.tags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });

      if (f.optimized) {
        optimizedCount++;
      }
    });

    const averageRating = sumRating / feedbacks.length;

    // Convert tagFrequency to sorted list
    const sortedTags = Object.entries(tagFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      averageRating,
      ratingDist,
      sortedTags,
      optimizedCount,
      total: feedbacks.length
    };
  }, [feedbacks]);

  // Filter feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const matchesSearch = 
        f.queryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.writtenFeedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.dbType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.modelName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRating = ratingFilter === "all" || Math.round(f.rating) === ratingFilter;

      return matchesSearch && matchesRating;
    });
  }, [feedbacks, searchTerm, ratingFilter]);

  const handleExportData = () => {
    if (feedbacks.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(feedbacks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ai_retrieval_user_feedback_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col gap-6 text-slate-200">
      {feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 rounded-2xl border border-white/5 bg-slate-900/20 text-center">
          <MessageSquare size={48} className="text-slate-600 mb-3 animate-pulse" />
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-1">
            {isZh ? "暂无收集到的反馈" : "No collected feedback yet"}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm">
            {isZh 
              ? "在检索式生成结果下方对检索质量进行评分/提供纠偏建议，反馈与纠偏历史将在本处汇总分析。" 
              : "Rate search query outputs or write adjustment advice on results to gather feedback metrics dynamic analyses here."}
          </p>
        </div>
      ) : (
        <>
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Average Score */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                {isZh ? "平均关联得分" : "AVG Relevance Rating"}
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-mono font-black text-cyan-400">
                  {stats?.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
              <div className="flex gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    size={11} 
                    fill={s <= Math.round(stats?.averageRating || 0) ? "#22d3ee" : "transparent"} 
                    className={s <= Math.round(stats?.averageRating || 0) ? "text-cyan-400" : "text-slate-600"} 
                  />
                ))}
              </div>
            </div>

            {/* Total Collected */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                {isZh ? "收集反馈样本" : "FEEDBACK VOLUME"}
              </span>
              <span className="text-3xl font-mono font-black text-white mt-1">
                {stats?.total}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-2 block">
                {isZh ? "✓ 实时缓存数据" : "✓ Active Local Logs"}
              </span>
            </div>

            {/* AI Optimization Hits */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                {isZh ? "AI 意见拟合优化" : "AI RE-OPTIMIZATIONS"}
              </span>
              <span className="text-3xl font-mono font-black text-purple-400 mt-1">
                {stats?.optimizedCount}
              </span>
              <span className="text-[10px] text-slate-400 mt-2 block">
                {isZh ? "用户闭环微调次数" : "Closed-loop micro-adjustments"}
              </span>
            </div>

            {/* Rating Distribution Meter */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-1.5 justify-center">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats?.ratingDist[stars - 1] || 0;
                const percent = stats?.total ? (count / stats.total) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-[10px]">
                    <span className="font-mono text-slate-400 w-3">{stars}★</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          stars >= 4 ? "bg-cyan-500" : stars === 3 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="font-mono text-slate-500 w-5 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Common Tags Bar Distribution */}
          {stats && stats.sortedTags.length > 0 && (
            <div className="bg-black/40 border border-white/5 rounded-xl p-5">
              <h4 className="text-[10px] uppercase font-extrabold tracking-[0.2em] text-slate-400 mb-3 block">
                {isZh ? "反馈标签词频偏置 (Top Feedback Concerns & Praises)" : "COMMON ISSUES & PRAISES DISTRIBUTION"}
              </h4>
              <div className="flex flex-wrap gap-2">
                {stats.sortedTags.map((tag) => {
                  const isNegative = [
                    "缺失关键同义词", "逻辑算符有误", "范围过大", "检索语种不符",
                    "Missing Keys", "Operator Logic Error", "Too Broad", "Wrong Language",
                    "缺少核心概念", "翻译词汇不当", "字段推荐偏差", "Missing Core Concepts", "Bad Translations", "Inaccurate Fields"
                  ].some(neg => tag.name.includes(neg));
                  
                  return (
                    <div 
                      key={tag.name} 
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold flex items-center gap-2 ${
                        isNegative 
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                          : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      <span>{tag.name}</span>
                      <span className="px-1 py-0.5 rounded bg-black/40 text-[9px] font-black font-mono">
                        {tag.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feedback list actions */}
          <div className="bg-black/30 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-white/[0.02] border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Search Panel */}
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isZh ? "搜索反馈意图/建议..." : "Search queries / advice..."}
                  className="w-full bg-black/40 border border-white/10 pl-9 pr-3 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filtering Controls & Export */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">{isZh ? "全部评分" : "All ratings"}</option>
                  <option value="5">5 ★</option>
                  <option value="4">4 ★</option>
                  <option value="3">3 ★</option>
                  <option value="2">2 ★</option>
                  <option value="1">1 ★</option>
                </select>

                <button 
                  onClick={handleExportData}
                  className="h-8 shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold px-3 transition-all flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <Download size={13} />
                  <span>{isZh ? "导出数据" : "EXPORT"}</span>
                </button>

                <button 
                  onClick={onClearAll}
                  className="h-8 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-xl text-xs font-bold px-2.5 transition-all text-center flex items-center justify-center gap-1"
                  title={isZh ? "清除所有反馈记录" : "Clear all logs"}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* List items */}
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
              {filteredFeedbacks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {isZh ? "没有匹配当前过滤器的反馈记录" : "No feedback matching criteria."}
                </div>
              ) : (
                filteredFeedbacks.map((f) => (
                  <div key={f.id} className="p-4 hover:bg-white/[0.01] transition-all flex flex-col gap-2 relative group text-left">
                    <button 
                      onClick={() => onDeleteOne(f.id)}
                      className="absolute right-4 top-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-1 rounded hover:bg-red-500/10"
                      title="删除此条"
                    >
                      <X size={12} />
                    </button>

                    {/* Metadata Header */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-mono text-cyan-400/80 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10 font-bold">
                        {f.dbType || "Default DB"}
                      </span>
                      <span className="flex items-center gap-0.5 text-slate-400 bg-white/5 px-2 py-0.5 rounded font-mono">
                        <Cpu size={10} className="text-slate-500" />
                        {f.modelName}
                      </span>
                      {f.optimized && (
                        <span className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[9px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 animate-pulse">
                          <RefreshCw size={8} /> {isZh ? "意见拟合优化" : "AI OPTIMIZED"}
                        </span>
                      )}
                      <span className="ml-auto font-mono text-slate-600">
                        {new Date(f.timestamp).toLocaleString(isZh ? 'zh-CN' : 'en-US', {hour12:false})}
                      </span>
                    </div>

                    {/* User Intent & Generated Output */}
                    <div className="text-xs">
                      <div className="text-slate-400 font-bold mb-0.5 flex gap-1 items-start">
                        <span className="text-[10px] bg-slate-800 text-slate-500 px-1 py-0.5 rounded leading-none shrink-0 font-mono mt-0.5">INTENT</span>
                        <span className="italic">"{f.queryText}"</span>
                      </div>
                    </div>

                    {/* Feedback Rating/Tags & Comments */}
                    <div className="bg-black/25 flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border border-white/[0.03] gap-2">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star 
                              key={st} 
                              size={10} 
                              fill={st <= f.rating ? "#eab308" : "transparent"} 
                              className={st <= f.rating ? "text-yellow-500" : "text-slate-700"}
                            />
                          ))}
                        </div>
                        {f.writtenFeedback && (
                          <p className="text-xs text-slate-300 font-medium font-sans flex items-start gap-1">
                            <span className="text-[10px] uppercase font-bold text-cyan-400 shrink-0 select-none">[Feedback]</span>
                            <span>{f.writtenFeedback}</span>
                          </p>
                        )}
                      </div>

                      {/* Display Tags */}
                      {f.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {f.tags.map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded border border-white/5 text-slate-400 font-bold max-w-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
