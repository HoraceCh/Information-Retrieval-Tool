import React, { useMemo } from "react";
import { SpellCheck2, Sparkles, AlertTriangle } from "lucide-react";
import { SpellIssue } from "../utils/academicSpellChecker";
import SpellCheckToken from "./SpellCheckToken";

interface SpellCheckInputBarProps {
  text: string;
  issues: SpellIssue[];
  onApplySuggestion: (issue: SpellIssue, replacement: string) => void;
  onApplyAll: () => void;
  onIgnoreWord: (word: string) => void;
  uiLang?: string;
}

export default function SpellCheckInputBar({
  text,
  issues,
  onApplySuggestion,
  onApplyAll,
  onIgnoreWord,
  uiLang = "zh"
}: SpellCheckInputBarProps) {
  const isEn = uiLang === "en";

  const segments = useMemo(() => {
    if (!text || issues.length === 0) return [];
    const sorted = [...issues].sort((a, b) => a.start - b.start);
    const result: Array<
      | { kind: "text"; content: string; key: string }
      | { kind: "issue"; issue: SpellIssue; key: string }
    > = [];
    let cursor = 0;

    for (const issue of sorted) {
      if (issue.start < cursor || issue.end > text.length) continue;
      if (issue.start > cursor) {
        result.push({
          kind: "text",
          content: text.slice(cursor, issue.start),
          key: `txt-${cursor}`
        });
      }
      result.push({
        kind: "issue",
        issue,
        key: issue.id
      });
      cursor = issue.end;
    }

    if (cursor < text.length) {
      result.push({
        kind: "text",
        content: text.slice(cursor),
        key: `txt-${cursor}`
      });
    }

    return result;
  }, [text, issues]);

  if (!text || issues.length === 0) return null;

  return (
    <div
      role="region"
      aria-label={isEn ? "Academic spelling checker" : "学术拼写检查提示"}
      className="ui-spell-bar mt-2.5 rounded-xl border p-3 flex flex-col gap-2 transition-all"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold font-mono text-status-warning">
            <SpellCheck2 size={14} className="shrink-0" />
            <span>
              {isEn
                ? `Academic Spell Check: ${issues.length} possible ${issues.length === 1 ? "typo" : "typos"}`
                : `学术拼写检查：发现 ${issues.length} 处疑似拼写错误`}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-content-muted">
            <AlertTriangle size={10} className="text-status-warning shrink-0" />
            <span>
              {isEn
                ? "Hover or click highlighted terms to apply suggestions and prevent recall loss"
                : "悬停或点击高亮词查看正确拼写建议，防止检索召回失败"}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onApplyAll}
          className="ui-spell-fixall-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer border shrink-0"
        >
          <Sparkles size={11} className="shrink-0" />
          <span>{isEn ? "Fix All Spelling" : "一键全部修正"}</span>
        </button>
      </div>

      {/* Interactive highlighted text preview */}
      <div className="ui-spell-preview rounded-lg border px-3 py-2 text-xs sm:text-sm leading-relaxed font-normal max-h-[120px] overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words">
        {segments.map((seg) =>
          seg.kind === "text" ? (
            <React.Fragment key={seg.key}>{seg.content}</React.Fragment>
          ) : (
            <SpellCheckToken
              key={seg.key}
              issue={seg.issue}
              onApplySuggestion={onApplySuggestion}
              onIgnore={onIgnoreWord}
              uiLang={uiLang}
            />
          )
        )}
      </div>
    </div>
  );
}
