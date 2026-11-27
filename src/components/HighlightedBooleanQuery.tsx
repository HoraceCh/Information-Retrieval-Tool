import React, { useMemo } from "react";
import { checkAcademicSpelling, SpellIssue } from "../utils/academicSpellChecker";
import SpellCheckToken from "./SpellCheckToken";

interface HighlightedBooleanQueryProps {
  query: string;
  className?: string;
  spellCheck?: boolean;
  ignoredWords?: Iterable<string>;
  onApplySpellFix?: (issue: SpellIssue, replacement: string) => void;
  onIgnoreSpellWord?: (word: string) => void;
  uiLang?: string;
}

interface Token {
  type:
    | "OP_AND_NOT"
    | "OP_AND"
    | "OP_OR"
    | "OP_NOT"
    | "OP_PROX"
    | "FIELD_BRACKET"
    | "FIELD_PREFIX"
    | "STRING"
    | "PAREN"
    | "FULLWIDTH"
    | "PUNCT"
    | "WHITESPACE"
    | "TERM";
  text: string;
  start: number;
  end: number;
}

export function tokenizeBooleanQuery(queryStr: string): Token[] {
  if (!queryStr) return [];

  try {
    const masterRegex =
      /(?<STRING>"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')|(?<FULLWIDTH>[（）“”‘’：])|(?<FIELD_BRACKET>\[[^\]]+\])|(?<FIELD_PREFIX>\b(?:TITLE-ABS-KEY|TITLE-ABS|AUTH|AFFIL|KEY|DOI|PUBYEAR|AFFILCOUNTRY|DOCTYPE|INDEXTERMS|TIAB|TI|AB|TS|KY|ALL|MH|TW)(?=\s*\(|\s*=|\s*:))|(?<OP_AND_NOT>\b(?:AND\s+NOT|OR\s+NOT)\b)|(?<OP_AND>\bAND\b)|(?<OP_OR>\bOR\b)|(?<OP_NOT>\bNOT\b)|(?<OP_PROX>\b(?:NEAR(?:\/\d+|\d+)?|ADJ(?:\/\d+|\d+)?|WITHIN(?:\/\d+|\d+)?|SAME|ONEAR|PRE(?:\/\d+|\d+)?|W\/\d+)\b)|(?<PAREN>[\(\)])|(?<PUNCT>[=:])|(?<WHITESPACE>\s+)|(?<TERM>[^\s\(\)\[\]"':=（）“”‘’]+)/gi;

    const tokens: Token[] = [];
    let match: RegExpExecArray | null;

    while ((match = masterRegex.exec(queryStr)) !== null) {
      const groups = match.groups;
      if (!groups) continue;

      const start = match.index;
      const end = start + match[0].length;

      if (groups.STRING !== undefined) {
        tokens.push({ type: "STRING", text: match[0], start, end });
      } else if (groups.FULLWIDTH !== undefined) {
        tokens.push({ type: "FULLWIDTH", text: match[0], start, end });
      } else if (groups.FIELD_BRACKET !== undefined) {
        tokens.push({ type: "FIELD_BRACKET", text: match[0], start, end });
      } else if (groups.FIELD_PREFIX !== undefined) {
        tokens.push({ type: "FIELD_PREFIX", text: match[0], start, end });
      } else if (groups.OP_AND_NOT !== undefined) {
        tokens.push({ type: "OP_AND_NOT", text: match[0], start, end });
      } else if (groups.OP_AND !== undefined) {
        tokens.push({ type: "OP_AND", text: match[0], start, end });
      } else if (groups.OP_OR !== undefined) {
        tokens.push({ type: "OP_OR", text: match[0], start, end });
      } else if (groups.OP_NOT !== undefined) {
        tokens.push({ type: "OP_NOT", text: match[0], start, end });
      } else if (groups.OP_PROX !== undefined) {
        tokens.push({ type: "OP_PROX", text: match[0], start, end });
      } else if (groups.PAREN !== undefined) {
        tokens.push({ type: "PAREN", text: match[0], start, end });
      } else if (groups.PUNCT !== undefined) {
        tokens.push({ type: "PUNCT", text: match[0], start, end });
      } else if (groups.WHITESPACE !== undefined) {
        tokens.push({ type: "WHITESPACE", text: match[0], start, end });
      } else if (groups.TERM !== undefined) {
        tokens.push({ type: "TERM", text: match[0], start, end });
      }
    }

    return tokens;
  } catch (e) {
    console.error("Unable to highlight the current query.");
    return [{ type: "TERM", text: queryStr, start: 0, end: queryStr.length }];
  }
}

function renderWithSpellHighlights(
  token: Token,
  tokenIssues: SpellIssue[],
  onApplySpellFix?: (issue: SpellIssue, replacement: string) => void,
  onIgnoreSpellWord?: (word: string) => void,
  uiLang?: string
): React.ReactNode {
  if (tokenIssues.length === 0) return token.text;

  const nodes: React.ReactNode[] = [];
  let cursor = token.start;

  for (const issue of tokenIssues) {
    if (issue.start < cursor || issue.end > token.end) continue;
    if (issue.start > cursor) {
      nodes.push(
        <React.Fragment key={`seg-${cursor}`}>
          {token.text.slice(cursor - token.start, issue.start - token.start)}
        </React.Fragment>
      );
    }
    nodes.push(
      <SpellCheckToken
        key={issue.id}
        issue={issue}
        onApplySuggestion={onApplySpellFix}
        onIgnore={onIgnoreSpellWord}
        uiLang={uiLang}
      />
    );
    cursor = issue.end;
  }

  if (cursor < token.end) {
    nodes.push(
      <React.Fragment key={`seg-${cursor}`}>
        {token.text.slice(cursor - token.start)}
      </React.Fragment>
    );
  }

  return nodes;
}

export default function HighlightedBooleanQuery({
  query,
  className = "",
  spellCheck = true,
  ignoredWords,
  onApplySpellFix,
  onIgnoreSpellWord,
  uiLang = "zh"
}: HighlightedBooleanQueryProps) {
  const tokens = useMemo(() => tokenizeBooleanQuery(query), [query]);

  const tokenSpellMap = useMemo(() => {
    const map = new Map<number, SpellIssue[]>();
    if (!spellCheck || !query) return map;

    tokens.forEach((token, idx) => {
      if (token.type !== "TERM" && token.type !== "STRING") return;
      const localIssues = checkAcademicSpelling(token.text, {
        ignoredWords,
        skipBooleanSyntax: true
      });
      if (localIssues.length > 0) {
        const globalIssues = localIssues.map((issue) => ({
          ...issue,
          id: `${issue.id}-tok-${idx}`,
          start: token.start + issue.start,
          end: token.start + issue.end
        }));
        map.set(idx, globalIssues);
      }
    });

    return map;
  }, [tokens, query, spellCheck, ignoredWords]);

  if (!query) return null;

  return (
    <span className={`inline font-mono leading-relaxed select-all ${className}`}>
      {tokens.map((token, idx) => {
        switch (token.type) {
          case "OP_AND":
            return (
              <span
                key={idx}
                className="syntax-token-and text-amber-300 [.theme-light_&]:text-amber-800 font-extrabold tracking-wide uppercase drop-shadow-[0_0_6px_rgba(252,211,77,0.25)] [.theme-light_&]:drop-shadow-none"
                title="AND 逻辑与运算符"
              >
                {token.text}
              </span>
            );
          case "OP_OR":
            return (
              <span
                key={idx}
                className="syntax-token-or text-cyan-300 [.theme-light_&]:text-sky-700 font-extrabold tracking-wide uppercase drop-shadow-[0_0_6px_rgba(103,232,249,0.25)] [.theme-light_&]:drop-shadow-none"
                title="OR 逻辑或运算符"
              >
                {token.text}
              </span>
            );
          case "OP_NOT":
          case "OP_AND_NOT":
            return (
              <span
                key={idx}
                className="syntax-token-not text-rose-400 [.theme-light_&]:text-red-700 font-extrabold tracking-wide uppercase drop-shadow-[0_0_6px_rgba(251,113,133,0.25)] [.theme-light_&]:drop-shadow-none"
                title="NOT / AND NOT 逻辑非运算符"
              >
                {token.text}
              </span>
            );
          case "OP_PROX":
            return (
              <span
                key={idx}
                className="syntax-token-prox text-fuchsia-300 [.theme-light_&]:text-fuchsia-800 font-extrabold tracking-wide uppercase drop-shadow-[0_0_6px_rgba(240,171,252,0.25)] [.theme-light_&]:drop-shadow-none"
                title="位置/距离算符 (Proximity Operator)"
              >
                {token.text}
              </span>
            );
          case "FIELD_PREFIX":
            return (
              <span
                key={idx}
                className="syntax-token-prefix text-violet-300 [.theme-light_&]:text-purple-900 font-bold bg-violet-950/60 [.theme-light_&]:bg-purple-100 px-1 py-0.5 rounded border border-violet-500/30 [.theme-light_&]:border-purple-300 text-[11px] font-mono inline-block mx-0.5"
                title="数据库检索字段标识"
              >
                {token.text}
              </span>
            );
          case "FIELD_BRACKET":
            return (
              <span
                key={idx}
                className="syntax-token-bracket text-indigo-300 [.theme-light_&]:text-indigo-900 font-semibold bg-indigo-950/50 [.theme-light_&]:bg-indigo-100 px-1 py-0.5 rounded border border-indigo-500/30 [.theme-light_&]:border-indigo-300 text-[11px] font-mono inline-block mx-0.5"
                title="PubMed / 主题词检索标签"
              >
                {token.text}
              </span>
            );
          case "STRING": {
            const issues = tokenSpellMap.get(idx) || [];
            return (
              <span key={idx} className="syntax-token-string text-emerald-300 [.theme-light_&]:text-green-800 font-semibold">
                {renderWithSpellHighlights(token, issues, onApplySpellFix, onIgnoreSpellWord, uiLang)}
              </span>
            );
          }
          case "FULLWIDTH":
            return (
              <span
                key={idx}
                className="syntax-token-fullwidth text-rose-400 [.theme-light_&]:text-red-700 bg-rose-500/20 [.theme-light_&]:bg-red-100 px-0.5 rounded border border-rose-500/40 [.theme-light_&]:border-red-300 underline decoration-wavy decoration-rose-500 font-black cursor-help"
                title={`全角字符 '${token.text}'，学术数据库会报错，需改为英文半角`}
              >
                {token.text}
              </span>
            );
          case "PAREN":
            return (
              <span key={idx} className="syntax-token-paren text-sky-300/90 [.theme-light_&]:text-slate-800 font-bold">
                {token.text}
              </span>
            );
          case "PUNCT":
            return (
              <span key={idx} className="syntax-token-punct text-slate-400 [.theme-light_&]:text-slate-600 font-bold">
                {token.text}
              </span>
            );
          case "WHITESPACE":
            return <React.Fragment key={idx}>{token.text}</React.Fragment>;
          case "TERM":
          default: {
            const issues = tokenSpellMap.get(idx) || [];
            return (
              <span key={idx} className="syntax-token-term text-slate-100 [.theme-light_&]:text-slate-900 font-medium">
                {renderWithSpellHighlights(token, issues, onApplySpellFix, onIgnoreSpellWord, uiLang)}
              </span>
            );
          }
        }
      })}
    </span>
  );
}
