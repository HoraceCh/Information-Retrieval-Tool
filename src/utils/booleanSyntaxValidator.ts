/**
 * Structural Boolean-query validator.
 *
 * This checks expression structure only. It does not certify a live database's
 * complete grammar, field availability, truncation/proximity limits or recall.
 */
export interface SyntaxErrorItem {
  id: string;
  type:
    | "UNMATCHED_PAREN"
    | "UNCLOSED_QUOTE"
    | "FULLWIDTH_CHAR"
    | "DANGLING_OPERATOR"
    | "CONSECUTIVE_OPERATORS"
    | "EMPTY_PAREN"
    | "MISSING_OPERATOR"
    | "MISSING_FIELD_VALUE";
  severity: "error" | "warning";
  title: string;
  message: string;
  snippet?: string;
  fixSuggestion?: string;
}
export interface ValidationOptions {
  database?: string;
  operatorStyle?: "OR" | "Space";
  isFieldSpecific?: boolean;
}
export interface ValidationResult {
  isValid: boolean;
  errors: SyntaxErrorItem[];
  warnings: SyntaxErrorItem[];
  stats: {
    openParens: number;
    closeParens: number;
    doubleQuotes: number;
    phraseCount: number;
    hasFullwidth: boolean;
  };
  fixedQuery?: string;
}
type TokenType = "TERM" | "PHRASE" | "FIELD" | "LPAREN" | "RPAREN" | "OPERATOR";
interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
  positional?: boolean;
}
type DatabaseSyntaxKind =
  | "portable" | "chinese" | "pubscholar" | "web" | "springer"
  | "wos" | "ei" | "scopus" | "ebsco" | "pqdt" | "ieee"
  | "cnipa" | "yizhuanli" | "patent" | "unknown";
interface TokenizeOptions {
  syntaxKind: DatabaseSyntaxKind;
}
interface TokenizeResult {
  tokens: Token[];
  openParens: number;
  closeParens: number;
  doubleQuotes: number;
  phraseCount: number;
}
const FIELD_LABEL_PATTERN = /[\p{L}][\p{L}\p{N}_（）()/-]*\s*=/gu;
function isEscaped(value: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) slashCount += 1;
  return slashCount % 2 === 1;
}
function isBoundary(value: string | undefined): boolean {
  return value === undefined || (/\s|[()（）=]/u.test(value) ||
    value === '"' || value === "'" || value === "+" || value === "|");
}
function getDatabaseSyntaxKind(database: string, isFieldSpecific: boolean): DatabaseSyntaxKind {
  if (!isFieldSpecific) return "portable";
  if (/CNKI|知网|维普|VIP/i.test(database)) return "chinese";
  if (/PubScholar|百度学术/i.test(database)) return "pubscholar";
  if (/通用搜索引擎|Baidu\/Bing/i.test(database)) return "web";
  if (/Springer/i.test(database)) return "springer";
  if (/Web of Science/i.test(database)) return "wos";
  if (/Ei Compendex/i.test(database)) return "ei";
  if (/Scopus/i.test(database)) return "scopus";
  if (/EBSCO/i.test(database)) return "ebsco";
  if (/PQDT/i.test(database)) return "pqdt";
  if (/IEEE Xplore/i.test(database)) return "ieee";
  if (/CNIPA|中国专利/i.test(database)) return "cnipa";
  if (/壹专利/i.test(database)) return "yizhuanli";
  if (/Espacenet|USPTO/i.test(database)) return "patent";
  return "unknown";
}
function getSymbolOperator(query: string, index: number, kind: DatabaseSyntaxKind): string | null {
  const char = query[index];
  const before = query[index - 1];
  const after = query[index + 1];
  if (kind === "pubscholar" && char === "|") return "OR";
  if (kind === "chinese" && char === "+" && isBoundary(before) && isBoundary(after)) return "OR";
  if (kind === "chinese" && char === "*" && isBoundary(before) && isBoundary(after)) return "AND";
  if ((kind === "chinese" || kind === "pubscholar" || kind === "web") && char === "-" && isBoundary(before)) return "NOT";
  if (kind === "springer" && char === "&" && isBoundary(before) && isBoundary(after)) return "AND";
  return null;
}
function isPositionalOperator(value: string, kind: DatabaseSyntaxKind): boolean {
  switch (kind) {
    case "wos": return /^(?:NEAR\/\d+|SAME)$/i.test(value);
    case "ei": return /^(?:NEAR|ONEAR)\/\d+$/i.test(value);
    case "scopus": return /^(?:W|PRE)\/\d+$/i.test(value);
    case "ebsco": return /^(?:N|W)\/\d+$/i.test(value);
    case "pqdt": return /^(?:NEAR|PRE)\/\d+$/i.test(value);
    case "ieee": return /^(?:NEAR|ONEAR)\/\d+$/i.test(value);
    case "cnipa":
      return /^(?:=)?\d*(?:D|W)$/i.test(value) || /^(?:F|P|S|NOTF|NOTP|NOTS)$/i.test(value);
    case "yizhuanli": return /^\d+[NW]$/i.test(value);
    case "patent": return /^(?:ADJ|NEAR|WITH|SAME|XOR)$/i.test(value);
    default: return false;
  }
}
function findFullwidthSyntaxPunctuation(query: string): string[] {
  const found = new Set<string>();
  const quotePairs: Record<string, string> = { '"': '"', "'": "'", "“": "”", "‘": "’" };
  let quoteClose: string | null = null;
  let index = 0;
  while (index < query.length) {
    const char = query[index];
    if (quoteClose) {
      if (char === quoteClose && !isEscaped(query, index)) quoteClose = null;
      index += 1;
      continue;
    }
    const fieldMatch = query.slice(index).match(/^[\p{L}][\p{L}\p{N}_（）()/-]*\s*=/u);
    if (fieldMatch) {
      index += fieldMatch[0].length;
      continue;
    }
    const isSingleQuote = char === "'" || char === "‘";
    const startsQuote = Boolean(quotePairs[char]) &&
      (!isSingleQuote || isBoundary(query[index - 1])) && !isEscaped(query, index);
    if (startsQuote) {
      if (char === "“") found.add("全角中文双引号");
      if (char === "‘") found.add("全角中文单引号");
      quoteClose = quotePairs[char];
      index += 1;
      continue;
    }
    if (char === "”") found.add("全角中文双引号");
    if (char === "’" && isBoundary(query[index - 1])) found.add("全角中文单引号");
    if (char === "（" || char === "）") found.add("全角中文括号");
    if (char === "：") found.add("全角中文冒号");
    if (char === "\u3000") found.add("全角空格");
    index += 1;
  }
  return [...found];
}
function tokenize(query: string, options: TokenizeOptions, errors: SyntaxErrorItem[]): TokenizeResult {
  const tokens: Token[] = [];
  const parenStack: number[] = [];
  let openParens = 0;
  let closeParens = 0;
  let doubleQuotes = 0;
  let phraseCount = 0;
  let index = 0;
  const push = (type: TokenType, value: string, start: number, end: number, positional = false) =>
    tokens.push({ type, value, start, end, ...(positional ? { positional: true } : {}) });

  while (index < query.length) {
    const char = query[index];
    if (/\s/u.test(char)) {
      index += 1;
      continue;
    }

    // Parentheses inside localized labels such as 申请人所在国（省）= belong to the field name.
    const fieldMatch = query.slice(index).match(/^[\p{L}][\p{L}\p{N}_（）()/-]*\s*=/u);
    if (fieldMatch) {
      push("FIELD", fieldMatch[0], index, index + fieldMatch[0].length);
      index += fieldMatch[0].length;
      continue;
    }

    if (char === "(" || char === "（") {
      openParens += 1;
      parenStack.push(index);
      push("LPAREN", char, index, index + 1);
      index += 1;
      continue;
    }
    if (char === ")" || char === "）") {
      closeParens += 1;
      if (parenStack.length === 0) {
        errors.push({
          id: "unmatched-close-" + index, type: "UNMATCHED_PAREN", severity: "error",
          title: "存在多余的右括号 (Unmatched Closing Parenthesis)",
          message: "检测到右括号在对应左括号之前出现。", snippet: char,
          fixSuggestion: "检查并移除多余的右括号。"
        });
      } else parenStack.pop();
      push("RPAREN", char, index, index + 1);
      index += 1;
      continue;
    }

    const quotePairs: Record<string,string> = { '"':'"', "'":"'", "“":"”", "‘":"’" };
    const isSingleQuote = char === "'" || char === "‘";
    const startsPhrase = Boolean(quotePairs[char]) && (!isSingleQuote || isBoundary(query[index - 1]));
    if (startsPhrase) {
      const closingQuote = quotePairs[char];
      const start = index;
      index += 1;
      let closed = false;
      while (index < query.length) {
        if (query[index] === closingQuote && !isEscaped(query,index)) {
          closed = true;
          index += 1;
          break;
        }
        index += 1;
      }
      if (char === '"' || char === "“") doubleQuotes += closed ? 2 : 1;
      if (closed) phraseCount += 1;
      push("PHRASE",query.slice(start,index),start,index);
      if (!closed) {
        errors.push({
          id: "unclosed-quote-" + start, type: "UNCLOSED_QUOTE", severity: "error",
          title: "短语引号未闭合 (Unclosed Phrase Quote)",
          message: "检测到未闭合的短语引号，后续内容可能被错误地视为同一个词组。",
          snippet: query.slice(start),
          fixSuggestion: "检查短语起止引号；请人工确认后再补齐，不要自动改变词组边界。"
        });
      }
      continue;
    }
    if (char === "”" || char === "’") {
      errors.push({
        id: "unexpected-closing-quote-" + index, type: "UNCLOSED_QUOTE", severity: "error",
        title: "引号方向或配对错误 (Unexpected Closing Quote)",
        message: "检测到没有对应起始引号的弯引号。", snippet: char,
        fixSuggestion: "检查并配对使用起止引号。"
      });
      index += 1;
      continue;
    }
    const symbolOperator = getSymbolOperator(query, index, options.syntaxKind);
    if (symbolOperator) {
      push("OPERATOR", symbolOperator, index, index + 1);
      index += 1;
      continue;
    }

    const start = index;
    while (index < query.length) {
      const current = query[index];
      if (/\s|[()（）"“”]/u.test(current)) break;
      if ((current === "'" || current === "‘") && isBoundary(query[index - 1])) break;
      if (getSymbolOperator(query, index, options.syntaxKind)) break;
      index += 1;
    }
    if (index === start) {
      index += 1;
      continue;
    }
    const value = query.slice(start,index);
    const upper = value.toUpperCase();
    const positionalOperator = isPositionalOperator(value, options.syntaxKind);
    if (upper === "AND" || upper === "OR" || upper === "NOT" || positionalOperator) {
      push("OPERATOR", upper, start, index, positionalOperator);
    } else push("TERM", value, start, index);
  }

  // Bare words such as SAME, WITH and XOR can also be ordinary search terms.
  // Treat them as positional operators only when both operands are present.
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex += 1) {
    const token = tokens[tokenIndex];
    if (!token.positional || /\d/.test(token.value)) continue;
    const left = tokens[tokenIndex - 1];
    const right = tokens[tokenIndex + 1];
    const canEndExpression = Boolean(left && ["TERM", "PHRASE", "RPAREN"].includes(left.type));
    const canStartExpression = Boolean(right && ["TERM", "PHRASE", "FIELD", "LPAREN"].includes(right.type));
    if (!canEndExpression || !canStartExpression) {
      token.type = "TERM";
      delete token.positional;
    }
  }

  if (parenStack.length > 0) {
    errors.push({
      id: "unmatched-open", type: "UNMATCHED_PAREN", severity: "error",
      title: "存在未闭合的左括号 (Unmatched Opening Parenthesis)",
      message: "检测到 " + parenStack.length + " 个尚未闭合的左括号。",
      snippet: "(", fixSuggestion: "检查括号嵌套位置；不要仅在末尾补括号来掩盖逻辑错误。"
    });
  }
  return { tokens, openParens, closeParens, doubleQuotes, phraseCount };
}
function isPrimaryStart(token: Token | undefined): boolean {
  return Boolean(token && (
    token.type === "TERM" || token.type === "PHRASE" || token.type === "FIELD" || token.type === "LPAREN" ||
    (token.type === "OPERATOR" && token.value === "NOT")
  ));
}
function isBinaryOperator(token: Token | undefined): boolean {
  return Boolean(token && token.type === "OPERATOR" && token.value !== "NOT");
}
function operatorPrecedence(value: string): number {
  return value === "OR" || value === "+" || value === "|" || value === "XOR" ? 1 : 2;
}

export function validateBooleanQuery(query: string, options: ValidationOptions = {}): ValidationResult {
  const errors: SyntaxErrorItem[] = [];
  const warnings: SyntaxErrorItem[] = [];
  const raw = (query || "").trim();
  if (!raw) {
    return { isValid:true, errors, warnings, stats:{openParens:0,closeParens:0,doubleQuotes:0,phraseCount:0,hasFullwidth:false} };
  }

  // Ignore punctuation inside quoted search phrases and localized field labels.
  const fullwidthMatches = findFullwidthSyntaxPunctuation(raw);

  const database = options.database || "";
  const isFieldSpecific = options.isFieldSpecific === true;
  const syntaxKind = getDatabaseSyntaxKind(database, isFieldSpecific);
  const scanned = tokenize(raw, { syntaxKind }, errors);
  const tokens = scanned.tokens;
  const implicitBehavior = !isFieldSpecific
    ? { operator: options.operatorStyle === "Space" ? "OR" : "AND", warn: options.operatorStyle !== "Space" }
    : syntaxKind === "pubscholar" || syntaxKind === "web"
      ? { operator: "AND", warn: false }
      : syntaxKind === "patent"
        // USPTO and Espacenet do not share one reliable whitespace default.
        // Keep the likely USPTO precedence, but ask users to verify the selected mode.
        ? { operator: "OR", warn: true }
        : { operator: "AND", warn: true };
  let index = 0;

  const addDanglingError = (token:Token,title:string,message:string) => errors.push({
    id:"dangling-"+token.start, type:"DANGLING_OPERATOR", severity:"error", title, message,
    snippet:token.value, fixSuggestion:"请人工补充缺失的检索词或调整算符位置。"
  });

  const parsePrimary = (): boolean => {
    const token = tokens[index];
    if (!token) return false;
    if (token.type === "FIELD") {
      index += 1;
      if (!isPrimaryStart(tokens[index]) || tokens[index]?.type === "FIELD") {
        errors.push({
          id:"missing-field-value-"+token.start, type:"MISSING_FIELD_VALUE", severity:"error",
          title:"字段限定缺少检索内容 (Missing Field Value)",
          message:"字段标签后没有可解析的检索词或括号表达式。",
          snippet:token.value, fixSuggestion:"请在字段限定符后补充检索内容，并核对目标数据库的字段写法。"
        });
        return false;
      }
      return parseUnary();
    }
    if (token.type === "TERM" || token.type === "PHRASE") {
      index += 1;
      return true;
    }
    if (token.type === "LPAREN") {
      const openToken = token;
      index += 1;
      if (tokens[index]?.type === "RPAREN") {
        warnings.push({
          id:"empty-paren-"+openToken.start, type:"EMPTY_PAREN", severity:"warning",
          title:"存在空括号 (Empty Parentheses)",
          message:"检测到不包含检索词的空括号组。", snippet:"()",
          fixSuggestion:"请确认是否应删除该空组；不要自动删除后继续检索。"
        });
        index += 1;
        return false;
      }
      const hasExpression = parseExpression(0);
      if (tokens[index]?.type === "RPAREN") index += 1;
      return hasExpression;
    }
    if (token.type === "OPERATOR" && token.value !== "NOT") {
      addDanglingError(token,"算符缺少左侧检索项 (Leading Operator)","表达式不能以二元逻辑或位置算符开始。");
      index += 1;
      return parseUnary();
    }
    return false;
  };

  const parseUnary = (): boolean => {
    const token = tokens[index];
    if (token?.type === "OPERATOR" && token.value === "NOT") {
      index += 1;
      if (!isPrimaryStart(tokens[index])) {
        addDanglingError(token,"NOT 缺少检索项 (Dangling NOT)","NOT 后面必须跟随一个检索词或括号组。");
        return false;
      }
      return parseUnary();
    }
    return parsePrimary();
  };

  const parseExpression = (minimumPrecedence:number): boolean => {
    let hasLeft = parseUnary();
    while (index < tokens.length) {
      const next = tokens[index];
      if (!next || next.type === "RPAREN") break;
      let precedence:number;
      let implicit = false;
      if (isBinaryOperator(next)) {
        precedence = operatorPrecedence(next.value);
      } else if (isPrimaryStart(next)) {
        implicit = true;
        precedence = operatorPrecedence(implicitBehavior.operator);
        if (implicitBehavior.warn) {
          warnings.push({
            id:"missing-operator-"+next.start, type:"MISSING_OPERATOR", severity:"warning",
            title:"相邻检索项之间缺少显式算符 (Missing Operator)",
            message:"检测到相邻检索项、字段或括号组。数据库对空格的默认含义因检索入口而异，不能据此推断为 OR。",
            snippet:next.value, fixSuggestion:"请根据目标数据库当前检索模式明确补充 AND 或 OR。"
          });
        }
      } else {
        index += 1;
        continue;
      }
      if (precedence < minimumPrecedence) break;
      if (!implicit) index += 1;
      if (!isPrimaryStart(tokens[index])) {
        if (isBinaryOperator(tokens[index])) {
          const firstOperator = tokens[index - 1];
          errors.push({
            id:"consecutive-operators-"+(firstOperator?.start ?? next.start),
            type:"CONSECUTIVE_OPERATORS", severity:"error",
            title:"连续逻辑算符冲突 (Consecutive Operators)",
            message:"连续算符之间缺少检索项，无法确定逻辑关系。",
            snippet:(firstOperator?.value || next.value)+" "+(tokens[index]?.value || ""),
            fixSuggestion:"请人工确认此处应保留哪个算符；系统不会擅自替换逻辑关系。"
          });
          while (isBinaryOperator(tokens[index])) index += 1;
        }
        if (!isPrimaryStart(tokens[index])) {
          addDanglingError(next,"算符缺少右侧检索项 (Trailing Operator)","该算符后面没有可连接的检索词或括号组。");
          break;
        }
      }
      const hasRight = parseExpression(precedence+1);
      hasLeft = hasLeft || hasRight;
    }
    return hasLeft;
  };

  if (tokens.length > 0) {
    parseExpression(0);
    while (index < tokens.length) index += 1;
  }
  if (!tokens.some(token => token.type === "TERM" || token.type === "PHRASE")) {
    errors.push({
      id:"missing-search-terms", type:"DANGLING_OPERATOR", severity:"error",
      title:"没有可解析的检索词 (No Search Terms)",
      message:"检索式只包含字段标签或标点，没有可供检索的词项。",
      fixSuggestion:"请检查字段代码后是否提供了检索词。"
    });
  }

  const fixedQuery = fullwidthMatches.length > 0 ? autoFixBooleanQuery(raw) : undefined;
  return {
    isValid:errors.length === 0,
    errors,
    warnings,
    stats:{
      openParens:scanned.openParens,
      closeParens:scanned.closeParens,
      doubleQuotes:scanned.doubleQuotes,
      phraseCount:scanned.phraseCount,
      hasFullwidth:fullwidthMatches.length > 0
    },
    fixedQuery:fixedQuery && fixedQuery !== raw ? fixedQuery : undefined
  };
}

/** Normalize syntax punctuation only; preserve quoted content and localized field labels. */
export function autoFixBooleanQuery(raw:string):string {
  const quotePairs: Record<string, string> = { '"': '"', "'": "'", "“": "”", "‘": "’" };
  let output = "";
  let quoteClose: string | null = null;
  let index = 0;
  while (index < raw.length) {
    const char = raw[index];
    if (quoteClose) {
      if (char === quoteClose && !isEscaped(raw, index)) {
        output += quoteClose === "”" ? '"' : quoteClose === "’" ? "'" : char;
        quoteClose = null;
      } else output += char;
      index += 1;
      continue;
    }
    const fieldMatch = raw.slice(index).match(/^[\p{L}][\p{L}\p{N}_（）()/-]*\s*=/u);
    if (fieldMatch) {
      output += fieldMatch[0];
      index += fieldMatch[0].length;
      continue;
    }
    const isSingleQuote = char === "'" || char === "‘";
    const startsQuote = Boolean(quotePairs[char]) &&
      (!isSingleQuote || isBoundary(raw[index - 1])) && !isEscaped(raw, index);
    if (startsQuote) {
      output += char === "“" ? '"' : char === "‘" ? "'" : char;
      quoteClose = quotePairs[char];
      index += 1;
      continue;
    }
    if (char === "”" || char === "’") {
      output += char;
      index += 1;
      continue;
    }
    output += char === "（" ? "("
      : char === "）" ? ")"
      : char === "：" ? ":"
      : char === "\u3000" ? " "
      : char;
    index += 1;
  }
  return output;
}
