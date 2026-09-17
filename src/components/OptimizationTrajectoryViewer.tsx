import React, { useState, useMemo } from 'react';
import { 
  GitCommit, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  Database, 
  Cpu, 
  Copy, 
  Check, 
  Trash2, 
  Download, 
  Search, 
  ArrowRight, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  RefreshCw, 
  ExternalLink,
  MessageSquare,
  Star,
  FileText
} from 'lucide-react';
import { RefinementTrajectoryItem } from '../types';
import HighlightedBooleanQuery from './HighlightedBooleanQuery';

interface OptimizationTrajectoryViewerProps {
  trajectories: RefinementTrajectoryItem[];
  onClearAll: () => void;
  onDeleteOne: (id: string) => void;
  onApplyTrajectory?: (item: RefinementTrajectoryItem) => void;
  onLoadSample?: () => void;
  uiLang?: string;
}

export default function OptimizationTrajectoryViewer({
  trajectories,
  onClearAll,
  onDeleteOne,
  onApplyTrajectory,
  onLoadSample,
  uiLang = 'zh'
}: OptimizationTrajectoryViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDbType, setSelectedDbType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Record<string, boolean>>({});
  const [viewModes, setViewModes] = useState<Record<string, 'split' | 'before' | 'after'>>({});

  const isZh = uiLang === 'zh' || uiLang === 'mix';

  // Available DB types for filter
  const dbTypesList = useMemo(() => {
    const set = new Set<string>();
    trajectories.forEach(t => {
      if (t.dbType) set.add(t.dbType);
    });
    return Array.from(set);
  }, [trajectories]);

  // Filtered trajectories
  const filteredTrajectories = useMemo(() => {
    return trajectories.filter(item => {
      const matchSearch = !searchTerm.trim() || 
        item.inputLine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.feedbackWritten.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.after.booleanQuery.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.feedbackTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDb = selectedDbType === 'all' || item.dbType === selectedDbType;

      return matchSearch && matchDb;
    });
  }, [trajectories, searchTerm, selectedDbType]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Copy markdown report for an item
  const handleCopyReport = (item: RefinementTrajectoryItem) => {
    const dateStr = new Date(item.timestamp).toLocaleString();
    const report = `### AI 检索式优化轨迹报告
- **时间**: ${dateStr}
- **主题/检索需求**: ${item.inputLine}
- **目标数据库**: ${item.dbType}
- **采用大模型**: ${item.modelName}
${item.templateName ? `- **约束框架模板**: ${item.templateName}` : ''}
- **用户反馈评分**: ${item.rating} / 5 星
- **纠偏痛点标签**: ${item.feedbackTags.join(', ') || '无'}
- **用户指导意见**: ${item.feedbackWritten || '模型算符结构重构'}

#### 【优化前检索式】
\`\`\`
${item.before.booleanQuery}
\`\`\`

#### 【AI 双向重构后检索式】
\`\`\`
${item.after.booleanQuery}
\`\`\`

#### 【AI 逻辑修正推导日志】
${item.after.explanation || item.after.reasoning || '基于用户对算符权重及同义词边界的反馈，完成布尔嵌套逻辑重组。'}
`;
    handleCopy(report, `report-${item.id}`);
  };

  // Export all as JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trajectories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ai_retrieval_optimization_trajectories_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const toggleReasoning = (id: string) => {
    setExpandedReasoningIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setItemViewMode = (id: string, mode: 'split' | 'before' | 'after') => {
    setViewModes(prev => ({ ...prev, [id]: mode }));
  };

  return (
    <div className="flex flex-col gap-6 text-slate-200">
      {/* Top Banner & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-xl border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-cyan-400" />
            <h3 className="text-sm font-black text-cyan-300 uppercase tracking-widest">
              {isZh ? "AI 优化轨迹查看器" : "AI Optimization Trajectory Viewer"}
            </h3>
            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold rounded-full border border-cyan-500/25">
              {trajectories.length} {isZh ? "次迭代记录" : "Logs"}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isZh 
              ? "自动捕获您在主界面点击【🤖 AI 双向重构】前后的检索式对比、用户反馈痛点及模型推导演进，清晰追溯逻辑修正轨迹。"
              : "Logs all before/after Boolean formula diffs, feedback pain points, and reasoning trails triggered by AI Bi-directional Refinement."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {trajectories.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-lg border border-white/10 transition-all cursor-pointer"
                title={isZh ? "导出全部轨迹为 JSON 文件" : "Export all logs as JSON"}
              >
                <Download size={13} />
                <span>{isZh ? "导出日志" : "Export"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(isZh ? "确定要清空全部 AI 优化轨迹记录吗？" : "Clear all optimization trajectory logs?")) {
                    onClearAll();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                title={isZh ? "清空所有记录" : "Clear logs"}
              >
                <Trash2 size={13} />
                <span>{isZh ? "清空记录" : "Clear"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search size={14} className="text-slate-500 ml-1 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isZh ? "搜索检索需求、反馈痛点或算式关键词..." : "Search queries, feedback tags, or keywords..."}
            className="w-full bg-transparent border-none text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none font-sans"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-slate-500 hover:text-slate-300 text-xs font-bold px-1.5 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {dbTypesList.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">
              {isZh ? "数据库筛选:" : "Database:"}
            </span>
            <select
              value={selectedDbType}
              onChange={(e) => setSelectedDbType(e.target.value)}
              className="bg-black/50 border border-white/10 text-xs text-cyan-300 rounded-lg px-2.5 py-1 font-mono cursor-pointer focus:outline-none"
            >
              <option value="all">{isZh ? "全部数据库平台" : "All Databases"}</option>
              {dbTypesList.map(db => (
                <option key={db} value={db}>{db}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Trajectories Feed */}
      {filteredTrajectories.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-8 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <GitCommit size={24} />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="text-sm font-bold text-slate-300">
              {searchTerm ? (isZh ? "未找到符合搜索条件的优化轨迹" : "No matching trajectory logs found") : (isZh ? "暂无 AI 优化轨迹记录" : "No Optimization Trajectories Yet")}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isZh 
                ? "当您在主界面生成检索式后，若评分较低或需要微调，点击下方评分区域的【🤖 AI 双向重构】并输入优化诉求，系统将在此沉淀检索式的逻辑演进与修正轨迹。"
                : "When you use the AI Bi-directional Refinement tool on the main screen, iterative logic evolution logs will be stored here."}
            </p>
          </div>
          {onLoadSample && !searchTerm && (
            <button
              type="button"
              onClick={onLoadSample}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <Sparkles size={14} className="text-cyan-400" />
              <span>{isZh ? "加载示例优化轨迹（体验效果）" : "Load Demo Trajectory"}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTrajectories.map((item, index) => {
            const mode = viewModes[item.id] || 'split';
            const isExpandedReasoning = !!expandedReasoningIds[item.id];
            const dateStr = new Date(item.timestamp).toLocaleString();

            return (
              <div 
                key={item.id}
                className="bg-slate-900/60 rounded-2xl border border-white/10 hover:border-cyan-500/30 p-5 flex flex-col gap-4 shadow-xl transition-all relative group"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-3.5">
                  <div className="space-y-1.5 flex-1 min-w-[240px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400/90 font-bold">
                        <Clock size={12} />
                        {dateStr}
                      </span>
                      <span className="text-[10px] text-slate-500">#{filteredTrajectories.length - index}</span>
                      <span className="px-2 py-0.5 bg-black/40 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold rounded">
                        {item.dbType}
                      </span>
                      <span className="px-2 py-0.5 bg-black/40 border border-purple-500/20 text-purple-300 text-[10px] font-mono rounded">
                        {item.modelName}
                      </span>
                      {item.templateName && (
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono rounded flex items-center gap-1">
                          <Layers size={10} />
                          {item.templateName}
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-slate-400 text-xs font-mono select-none">主题需求:</span>
                      <span className="text-cyan-200">“{item.inputLine}”</span>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-2 shrink-0">
                    {onApplyTrajectory && (
                      <button
                        type="button"
                        onClick={() => onApplyTrajectory(item)}
                        className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title={isZh ? "将此优化后的检索式还原至当前主工作区" : "Apply this query to workspace"}
                      >
                        <RefreshCw size={11} />
                        <span>{isZh ? "复用此算式" : "Apply"}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyReport(item)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                      title={isZh ? "复制完整优化审计报告" : "Copy full report"}
                    >
                      {copiedId === `report-${item.id}` ? <Check size={11} className="text-emerald-400" /> : <FileText size={11} />}
                      <span>{copiedId === `report-${item.id}` ? (isZh ? "已复制" : "Copied") : (isZh ? "报告" : "Report")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteOne(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title={isZh ? "删除此记录" : "Delete record"}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* User feedback pain points trigger block */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1">
                        <MessageSquare size={12} />
                        {isZh ? "触发重构的用户反馈 / Feedback Trigger:" : "Trigger Feedback:"}
                      </span>
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={12} 
                            className={star <= item.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-slate-300 italic">
                      “{item.feedbackWritten || (isZh ? "根据用户对布尔逻辑算符与召回边界的反馈进行重组" : "Restructured logic according to operator weighting feedback")}”
                    </div>
                  </div>

                  {item.feedbackTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      {item.feedbackTags.map((tag, tIdx) => (
                        <span 
                          key={tIdx}
                          className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-md font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* View Switcher Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setItemViewMode(item.id, 'split')}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                        mode === 'split' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isZh ? "并排对比" : "Side-by-Side"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemViewMode(item.id, 'before')}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                        mode === 'before' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isZh ? "仅看优化前" : "Before Only"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemViewMode(item.id, 'after')}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                        mode === 'after' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isZh ? "仅看修正后" : "After Only"}
                    </button>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
                    {isZh ? "语法高亮：橙色=AND，青色=OR，红色=NOT" : "Syntax: Orange=AND, Cyan=OR, Rose=NOT"}
                  </div>
                </div>

                {/* Diff Area */}
                <div className={`grid gap-4 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* BEFORE CARD */}
                  {(mode === 'split' || mode === 'before') && (
                    <div className="bg-black/35 rounded-xl border border-rose-500/20 p-4 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                          <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 font-mono">
                            {isZh ? "优化前检索式 (Before)" : "BEFORE REFINEMENT"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.before.booleanQuery, `before-${item.id}`)}
                          className="text-slate-400 hover:text-white p-1 bg-white/5 rounded border border-white/5 transition-all cursor-pointer"
                          title="Copy before query"
                        >
                          {copiedId === `before-${item.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>

                      <div className="formula-code-box font-mono text-xs text-rose-100/90 leading-relaxed rounded-xl p-3.5 border border-rose-500/20 max-h-[220px] overflow-y-auto custom-scrollbar select-all whitespace-pre-wrap break-words">
                        <HighlightedBooleanQuery query={item.before.booleanQuery} />
                      </div>

                      {item.before.explanation && (
                        <p className="text-[11px] text-slate-400 italic">
                          <span className="font-bold text-slate-500 mr-1 font-mono">ORIGINAL STRATEGY:</span>
                          {item.before.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* AFTER CARD */}
                  {(mode === 'split' || mode === 'after') && (
                    <div className="bg-black/35 [.theme-light_&]:bg-sky-50/50 rounded-xl border border-cyan-500/30 [.theme-light_&]:border-sky-200 p-4 flex flex-col gap-2.5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 font-mono">
                            {isZh ? "AI 双向重构后检索式 (After)" : "AFTER AI REFINEMENT"}
                          </span>
                          <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 text-[9px] rounded font-mono font-bold">
                            ✓ 纠偏完成
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.after.booleanQuery, `after-${item.id}`)}
                          className="text-cyan-300 hover:text-cyan-100 p-1 bg-cyan-950/40 rounded border border-cyan-500/25 transition-all cursor-pointer"
                          title="Copy after query"
                        >
                          {copiedId === `after-${item.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>

                      <div className="formula-code-box font-mono text-xs text-cyan-100 leading-relaxed rounded-xl p-3.5 border border-cyan-500/20 max-h-[220px] overflow-y-auto custom-scrollbar select-all whitespace-pre-wrap break-words">
                        <HighlightedBooleanQuery query={item.after.booleanQuery} />
                      </div>

                      {item.after.explanation && (
                        <p className="text-[11px] text-slate-300 italic">
                          <span className="font-bold text-cyan-400 mr-1 font-mono">OPTIMIZED STRATEGY:</span>
                          {item.after.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Revision Reasoning & Logic Evolution Path */}
                {(item.after.reasoning || item.after.explanation) && (
                  <div className="bg-cyan-950/20 rounded-xl border border-cyan-500/20 p-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-widest text-cyan-300 font-mono flex items-center gap-1.5">
                        <Sparkles size={13} className="text-cyan-400" />
                        {isZh ? "AI 逻辑推导与修正演进日志 (Reasoning Log):" : "AI Reasoning & Logic Revision Path:"}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleReasoning(item.id)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-200 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{isExpandedReasoning ? (isZh ? "收起日志" : "Less") : (isZh ? "展开完整推导" : "Expand")}</span>
                        {isExpandedReasoning ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>

                    <p className={`text-xs text-cyan-100/80 leading-relaxed italic ${isExpandedReasoning ? '' : 'line-clamp-3'} overflow-y-auto custom-scrollbar`}>
                      {item.after.reasoning || item.after.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
