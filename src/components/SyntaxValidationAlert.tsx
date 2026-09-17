import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Wrench,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ShieldAlert,
  Info
} from "lucide-react";
import { ValidationResult } from "../utils/booleanSyntaxValidator";

interface SyntaxValidationAlertProps {
  validation: ValidationResult;
  onApplyFix?: (fixedQuery: string) => void;
  uiLang?: string;
  className?: string;
}

export default function SyntaxValidationAlert({
  validation,
  onApplyFix,
  uiLang = "zh",
  className = ""
}: SyntaxValidationAlertProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedFix, setCopiedFix] = useState(false);

  const isZh = uiLang === "zh" || uiLang === "mix";
  const { isValid, errors, warnings, stats, fixedQuery } = validation;

  const totalIssues = errors.length + warnings.length;

  const handleCopyFix = () => {
    if (!fixedQuery) return;
    navigator.clipboard.writeText(fixedQuery);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  // If valid with zero warnings, show a sleek positive reassurance banner or pill
  if (isValid && warnings.length === 0) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {/* Subtle green assurance line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500/10 via-emerald-500/40 to-emerald-500/10 rounded-full" />
        
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-emerald-950/20 rounded-lg border border-emerald-500/20 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>{isZh ? "实时语法验证通过" : "Real-time Syntax Validated"}</span>
            <span className="text-[10px] text-emerald-500/80 font-normal">
              ({isZh ? "括号闭合平衡、算符结构无冲突" : "Balanced parens & valid operators"})
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>
              {isZh ? "括号:" : "Parens:"} <strong className="text-emerald-300 font-bold">{stats.openParens}/{stats.closeParens}</strong>
            </span>
            <span>•</span>
            <span>
              {isZh ? "短语词组:" : "Phrases:"} <strong className="text-emerald-300 font-bold">{Math.floor(stats.doubleQuotes / 2)}</strong>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 醒目的红色线条高亮提示 (Eye-catching red warning line with pulsing glow) */}
      <div className="relative w-full">
        <div 
          className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.7)] animate-pulse"
        />
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2.5 py-0.2 bg-rose-600 text-white font-black font-mono text-[9px] uppercase tracking-widest rounded-full shadow-md flex items-center gap-1">
          <ShieldAlert size={10} />
          <span>{isZh ? "语法错误警示" : "SYNTAX ALERT"}</span>
        </div>
      </div>

      {/* Warning & Error Details Card */}
      <div className="bg-gradient-to-br from-rose-950/40 to-black/60 rounded-xl border border-rose-500/40 p-3.5 shadow-[0_0_20px_rgba(244,63,94,0.12)] flex flex-col gap-3">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-rose-500/20 text-rose-400">
              <AlertTriangle size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-rose-300 font-mono tracking-wide">
                  {isZh ? "实时语法验证：检测到语法缺陷" : "Real-time Syntax Alert"}
                </h4>
                <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 font-mono font-black text-[10px] rounded border border-rose-500/30">
                  {errors.length} {isZh ? "项错误" : "errors"}
                  {warnings.length > 0 && ` + ${warnings.length} ${isZh ? "项预警" : "warnings"}`}
                </span>
              </div>
              <p className="text-[10px] text-rose-200/70">
                {isZh
                  ? "明显的布尔语法错误可能导致学术数据库返回 0 篇结果或报错拒绝检索。"
                  : "Syntax errors will cause academic database engines to reject query or return 0 results."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fixedQuery && onApplyFix && (
              <button
                type="button"
                onClick={() => onApplyFix(fixedQuery)}
                className="px-3 py-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded-lg shadow-[0_0_10px_rgba(244,63,94,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
                title={isZh ? "一键修复全角字符、配平括号与清理悬空算符" : "Auto-fix syntax defects"}
              >
                <Wrench size={12} />
                <span>{isZh ? "一键自动修复" : "Auto-Fix"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
              title={isExpanded ? "收起详情" : "展开详情"}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Detailed List */}
        {isExpanded && (
          <div className="space-y-2">
            {errors.map((err) => (
              <div
                key={err.id}
                className="bg-black/40 rounded-lg p-2.5 border border-rose-500/30 flex items-start gap-2.5 text-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-rose-300 font-mono text-[11px]">
                      {err.title}
                    </span>
                    {err.snippet && (
                      <code className="px-1.5 py-0.2 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-[10px] font-mono rounded">
                        {err.snippet}
                      </code>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {err.message}
                  </p>
                  {err.fixSuggestion && (
                    <p className="text-[10px] text-amber-300/90 font-mono flex items-center gap-1">
                      <Sparkles size={10} className="text-amber-400" />
                      <span>{isZh ? "建议修复:" : "Suggestion:"} {err.fixSuggestion}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}

            {warnings.map((warn) => (
              <div
                key={warn.id}
                className="bg-black/40 rounded-lg p-2.5 border border-amber-500/30 flex items-start gap-2.5 text-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-amber-300 font-mono text-[11px]">
                      {warn.title}
                    </span>
                    {warn.snippet && (
                      <code className="px-1.5 py-0.2 bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[10px] font-mono rounded">
                        {warn.snippet}
                      </code>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {warn.message}
                  </p>
                  {warn.fixSuggestion && (
                    <p className="text-[10px] text-amber-300/80 font-mono flex items-center gap-1">
                      <Sparkles size={10} className="text-amber-400" />
                      <span>{isZh ? "建议:" : "Tip:"} {warn.fixSuggestion}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Auto-fixed preview section */}
            {fixedQuery && (
              <div className="mt-2 pt-2 border-t border-rose-500/20 flex flex-col gap-1.5 bg-black/30 p-2.5 rounded-lg border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    {isZh ? "推荐自动修正方案 (Auto-Corrected Preview):" : "Proposed Correction:"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyFix}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      {copiedFix ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                      <span>{copiedFix ? (isZh ? "已复制" : "Copied") : (isZh ? "复制修正式" : "Copy")}</span>
                    </button>
                    {onApplyFix && (
                      <button
                        type="button"
                        onClick={() => onApplyFix(fixedQuery)}
                        className="text-[10px] text-cyan-300 hover:text-cyan-200 font-bold underline cursor-pointer"
                      >
                        {isZh ? "立即应用" : "Apply"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-emerald-200/90 bg-black/50 p-2 rounded border border-white/5 break-words whitespace-pre-wrap select-all">
                  {fixedQuery}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
