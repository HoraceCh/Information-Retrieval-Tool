import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, EyeOff, Sparkles } from "lucide-react";
import { SpellIssue } from "../utils/academicSpellChecker";

interface SpellCheckTokenProps {
  key?: string | number;
  issue: SpellIssue;
  onApplySuggestion?: (issue: SpellIssue, replacement: string) => void;
  onIgnore?: (word: string) => void;
  uiLang?: string;
  className?: string;
  children?: React.ReactNode;
}

interface TooltipCoords {
  top: number;
  left: number;
  placement: "top" | "bottom";
}

export default function SpellCheckToken({
  issue,
  onApplySuggestion,
  onIgnore,
  uiLang = "zh",
  className = "",
  children
}: SpellCheckTokenProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const isEn = uiLang === "en";

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 280;
    const estimatedHeight = 148;
    const margin = 10;

    const spaceAbove = rect.top;
    const placement: "top" | "bottom" =
      spaceAbove >= estimatedHeight + margin ? "top" : "bottom";

    const rawLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const clampedLeft = Math.max(
      margin,
      Math.min(rawLeft, window.innerWidth - tooltipWidth - margin)
    );
    const top = placement === "top" ? rect.top - 8 : rect.bottom + 8;

    setCoords({ top, left: clampedLeft, placement });
  }, []);

  const openTooltip = useCallback(() => {
    clearCloseTimer();
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 180);
  }, []);

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => updatePosition();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen, updatePosition]);

  const handleSelectSuggestion = (e: React.MouseEvent, suggestion: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    onApplySuggestion?.(issue, suggestion);
  };

  const handleIgnoreWord = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    onIgnore?.(issue.word);
  };

  const nativeTitle = isEn
    ? `Possible academic misspelling: "${issue.word}" -> ${issue.suggestions.join(" / ")}`
    : `疑似学术拼写错误: "${issue.word}" → 建议: ${issue.suggestions.join(" / ")}`;

  const tooltipNode =
    isOpen && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: "280px",
              transform: coords.placement === "top" ? "translateY(-100%)" : "translateY(0)",
              zIndex: 9999
            }}
            className="ui-spell-tooltip rounded-xl border p-3 shadow-2xl text-left font-sans select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-status-warning">
                <AlertTriangle size={12} className="shrink-0" />
                <span>{isEn ? "Academic Spelling Alert" : "疑似学术拼写错误"}</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-content-muted truncate max-w-[115px]">
                {issue.domain.split(" / ")[isEn ? 1 : 0] || issue.domain}
              </span>
            </div>

            {/* Original word & Recall Warning */}
            <p className="text-[11px] text-content-secondary leading-snug mb-2">
              <span className="font-mono line-through text-status-error font-semibold mr-1.5">
                {issue.word}
              </span>
              <span className="text-[10px] text-content-muted">
                {isEn ? issue.reasonEn : issue.reasonZh}
              </span>
            </p>

            {/* Suggestions */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-content-muted flex items-center gap-1">
                <Sparkles size={10} className="text-status-success" />
                {isEn ? "Suggested correction:" : "建议正确拼写（点击替换）:"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {issue.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={(e) => handleSelectSuggestion(e, suggestion)}
                    className="ui-spell-suggestion-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border"
                  >
                    <Check size={11} className="shrink-0" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            {onIgnore && (
              <div className="mt-2 pt-2 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={handleIgnoreWord}
                  className="inline-flex items-center gap-1 text-[10px] text-content-muted hover:text-content transition-colors cursor-pointer px-1.5 py-0.5 rounded"
                >
                  <EyeOff size={10} />
                  <span>{isEn ? "Ignore this term" : "忽略此词"}</span>
                </button>
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        role="button"
        aria-label={nativeTitle}
        aria-expanded={isOpen}
        title={nativeTitle}
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleClose}
        onFocus={openTooltip}
        onBlur={scheduleClose}
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            setIsOpen(false);
          } else {
            openTooltip();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            if (isOpen && issue.suggestions[0] && onApplySuggestion) {
              setIsOpen(false);
              onApplySuggestion(issue, issue.suggestions[0]);
            } else {
              openTooltip();
            }
          }
        }}
        className={`ui-spell-error inline rounded px-0.5 cursor-help transition-colors ${className}`}
      >
        {children ?? issue.word}
      </span>
      {tooltipNode}
    </>
  );
}
