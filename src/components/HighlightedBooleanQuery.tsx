import React, { useMemo } from "react";

interface HighlightedBooleanQueryProps {
  query: string;
  className?: string;
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
    | "PUNCT"
    | "WHITESPACE"
    | "TERM";
  text: string;
}

export function tokenizeBooleanQuery(queryStr: string): Token[] {
  if (!queryStr) return [];

  const masterRegex = new RegExp(
    [
      // 1. Quoted strings: "..." or '...'
      `(?<STRING>"[^"\\\\]*(?:\\\\.[^"\\\\]*)*"|'[^'\\\\]*(?:\\\\.[^'\\]*)*')`,
      // 2. Field brackets (e.g. [Mesh], [tiab], [Title/Abstract], [tw], [mh])
      `(?<FIELD_BRACKET>\\[[^\\]]+\\])`,
      // 3. Known Field Prefix functions / tags: TITLE-ABS-KEY, TI=, AB=, TS=, KY=, ALL=, MH:, TW:, etc.
      `(?<FIELD_PREFIX>\\b(?:TITLE-ABS-KEY|TITLE-ABS|AUTH|AFFIL|KEY|DOI|PUBYEAR|AFFILCOUNTRY|DOCTYPE|INDEXTERMS|TIAB|TI|AB|TS|KY|ALL|MH|TW)(?=\\s*\\(|\\s*=|\\s*:))`,
      // 4. Combined Operators (AND NOT, OR NOT)
      `(?<OP_AND_NOT>\\b(?:AND\\s+NOT|OR\\s+NOT)\\b)`,
      // 5. Individual Operators (AND, OR, NOT)
      `(?<OP_AND>\\bAND\\b)`,
      `(?<OP_OR>\\bOR\\b)`,
      `(?<OP_NOT>\\bNOT\\b)`,
      // 6. Proximity / Distance operators (NEAR, NEAR/n, ADJ, ADJ/n, WITHIN, WITHIN/n, SAME, ONEAR, PRE/n, W/n)
      `(?<OP_PROX>\\b(?:NEAR(?:\\/\\d+|\\d+)?|ADJ(?:\\/\\d+|\\d+)?|WITHIN(?:\\/\\d+|\\d+)?|SAME|ONEAR|PRE(?:\\/\\d+|\\d+)?|W\\/\\d+)\\b)`,
      // 7. Parentheses
      `(?<PAREN>[\\(\\)])`,
      // 8. Punctuation (=, :)
      `(?<PUNCT>[=:])`,
      // 9. Whitespace
      `(?<WHITESPACE>\\s+)`,
      // 10. Default terms
      `(?<TERM>[^\\s\\(\\)\\[\\]"':=]+)`
    ].join("|"),
    "gi"
  );

  const tokens: Token[] = [];
  let match: RegExpExecArray | null;

  while ((match = masterRegex.exec(queryStr)) !== null) {
    const groups = match.groups;
    if (!groups) continue;

    if (groups.STRING !== undefined) {
      tokens.push({ type: "STRING", text: match[0] });
    } else if (groups.FIELD_BRACKET !== undefined) {
      tokens.push({ type: "FIELD_BRACKET", text: match[0] });
    } else if (groups.FIELD_PREFIX !== undefined) {
      tokens.push({ type: "FIELD_PREFIX", text: match[0] });
    } else if (groups.OP_AND_NOT !== undefined) {
      tokens.push({ type: "OP_AND_NOT", text: match[0] });
    } else if (groups.OP_AND !== undefined) {
      tokens.push({ type: "OP_AND", text: match[0] });
    } else if (groups.OP_OR !== undefined) {
      tokens.push({ type: "OP_OR", text: match[0] });
    } else if (groups.OP_NOT !== undefined) {
      tokens.push({ type: "OP_NOT", text: match[0] });
    } else if (groups.OP_PROX !== undefined) {
      tokens.push({ type: "OP_PROX", text: match[0] });
    } else if (groups.PAREN !== undefined) {
      tokens.push({ type: "PAREN", text: match[0] });
    } else if (groups.PUNCT !== undefined) {
      tokens.push({ type: "PUNCT", text: match[0] });
    } else if (groups.WHITESPACE !== undefined) {
      tokens.push({ type: "WHITESPACE", text: match[0] });
    } else if (groups.TERM !== undefined) {
      tokens.push({ type: "TERM", text: match[0] });
    }
  }

  return tokens;
}

export default function HighlightedBooleanQuery({
  query,
  className = ""
}: HighlightedBooleanQueryProps) {
  const tokens = useMemo(() => tokenizeBooleanQuery(query), [query]);

  if (!query) return null;

  return (
    <span className={`inline font-mono leading-relaxed select-all ${className}`}>
      {tokens.map((token, idx) => {
        switch (token.type) {
          case "OP_AND":
            return (
              <span
                key={idx}
                className="text-amber-300 font-extrabold tracking-wide uppercase drop-shadow-[0_0_6px_rgba(252,211,77,0.3)]"
                title="AND 逻辑与运算符"
              >
                {token.text}
              </span>
            );
          case "OP_OR":
            return (
              <span
                key={idx}
                className="text-cyan-300 font-extrabold tracking-wide uppercase drop-shadow-[0_0_6px_rgba(103,232,249,0.3)]"
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
                className="text-rose-400 font-extrabold tracking-wide uppercase drop-shadow-[0_0_6px_rgba(251,113,133,0.3)]"
                title="NOT / AND NOT 逻辑非运算符"
              >
                {token.text}
              </span>
            );
          case "OP_PROX":
            return (
              <span
                key={idx}
                className="text-fuchsia-300 font-extrabold tracking-wide uppercase drop-shadow-[0_0_6px_rgba(240,171,252,0.3)]"
                title="位置/距离算符 (Proximity Operator)"
              >
                {token.text}
              </span>
            );
          case "FIELD_PREFIX":
            return (
              <span
                key={idx}
                className="text-violet-300 font-bold bg-violet-950/60 px-1 py-0.5 rounded border border-violet-500/30 text-[11px] font-mono inline-block mx-0.5"
                title="数据库检索字段标识"
              >
                {token.text}
              </span>
            );
          case "FIELD_BRACKET":
            return (
              <span
                key={idx}
                className="text-indigo-300 font-semibold bg-indigo-950/50 px-1 py-0.2 rounded border border-indigo-500/30 text-[11px] font-mono inline-block mx-0.5"
                title="PubMed / 主题词检索标签"
              >
                {token.text}
              </span>
            );
          case "STRING":
            return (
              <span key={idx} className="text-emerald-300 font-medium">
                {token.text}
              </span>
            );
          case "PAREN":
            return (
              <span key={idx} className="text-sky-300/90 font-bold">
                {token.text}
              </span>
            );
          case "PUNCT":
            return (
              <span key={idx} className="text-slate-400 font-bold">
                {token.text}
              </span>
            );
          case "WHITESPACE":
            return <React.Fragment key={idx}>{token.text}</React.Fragment>;
          case "TERM":
          default:
            return (
              <span key={idx} className="text-slate-100">
                {token.text}
              </span>
            );
        }
      })}
    </span>
  );
}
