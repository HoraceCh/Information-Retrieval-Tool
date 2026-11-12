/**
 * Structural Boolean-query validator.
 *
 * This validates expression structure, not whether a live database accepts every
 * field code, truncation mark, proximity operator, or product-specific limit.
 * Database-native syntax always needs to be checked against the selected platform.
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
    | "MISSING_OPERATOR";
  severity: "error" | "warning";
  title: string;
  message: string;
  snippet?: string;
  fixSuggestion?: string;
}

export interface ValidationOptions {
  database?: string;
  operatorStyle?: "OR" | "Space";
  /** True when validating the database-native fieldSpecificQuery. */
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
    hasFullwidth: boolean;
  };
  /** Only safe punctuation normalization is offered; logical operators are never rewritten. */
  fixedQuery?: string;
}

type TokenType = "TERM" | "PHRASE" | "FIELD" | "LPAREN" | "RPAREN" | "OPERATOR";

interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

interface TokenizeOptions {
  plusAsOr: boolean;
  pipeAsOr: boolean;
}

function isEscaped(value: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function isBoundary(value: string | undefined): boolean {
  return value === undefined || /\s|[()=]/.test(value) || value === '"' || value === "'";
}

function tokenize(
  query: string,
  options: TokenizeOptions,
  errors: SyntaxErrorItem[]
): { tokens: Token[]; openParens: number; closeParens: number; doubleQuotes: number } {
  const tokens: Token[] = [];
  const stack: number[] = [];
  let closeParens = 0;
  let openParens = 0;
  let doubleQuotes = 0;
  let index = 0;

  const push = (type: TokenType, value: string, start: number, end: number) => {
    tokens.push({ type, value, start, end });
  };

  while (index < query.length) {
    const char = query[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    const fieldMatch = query.slice(index).match(/^[A-Za-z][A-Za-z0-9_-]*\s*=/);
    if (fieldMatch) {
      push("FIELD", fieldMatch[0], index, index + fieldMatch[0].length);
      index += fieldMatch[0].length;
      continue;
    }

    if (char === "(" || char === "（") {
      openParens += 1;
      stack.push(index);
      push("LPAREN", char, index, index + 1);
      index += 1;
      continue;
    }

    if (char === ")" || char === "）") {
      closeParens += 1;
      if (stack.length === 0) {
        errors.push({
          id: "unmatched-close-" + index,
          type: "UNMATCHED_PAREN",
          severity: "error",
          title: "存在多余的右括号 (Unmatched Closing Parenthesis)",
          message: "检测到右括号在对应左括号之前出现。",
          snippet: char,
          fixSuggestion: "检查并移除多余的右括号。"
        });
      } else {
        stack.pop();
      }
      push("RPAREN", char, index, index + 1);
      index += 1;
      continue;
    }

    const quotePairs: Record<string, string> = {
      '"': '"',
      "'": "'",
      "“": "”",
      "‘": "’"
    };
    const isSingleQuote = char === "'" || char === "‘";
    const singleQuoteAtBoundary = isBoundary(query[index - 1]);
    const startsPhrase = Boolean(quotePairs[char]) && (!isSingleQuote || singleQuoteAtBoundary);

    if (startsPhrase) {
      const closingQuote = quotePairs[char];
      const start = index;
      index += 1;
      let closed = false;

      while (index < query.length) {
        if (query[index] === closingQuote && !isEscaped(query, index)) {
          closed = true;
          index += 1;
          break;
        }
        index += 1;
      }

      if (char === '"') doubleQuotes += closed ? 2 : 1;
      if (char === "“") doubleQuotes += closed ? 2 : 1;

      push("PHRASE", query.slice(start, index), start, index);
      if (!closed) {
        errors.push({
          id: "unclosed-quote-" + start,
          type: "UNCLOSED_QUOTE",
          severity: "error",
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
        id: "unexpected-closing-quote-" + index,
        type: "UNCLOSED_QUOTE",
        severity: "error",
        title: "引号方向或配对错误 (Unexpected Closing Quote)",
        message: "检测到没有对应起始引号的弯引号。",
        snippet: char,
        fixSuggestion: "检查并配对使用起止引号。"
      });
      index += 1;
      continue;
    }

    if (options.plusAsOr && char === "+" && isBoundary(query[index - 1]) && isBoundary(query[index + 1])) {
      push("OPERATOR", "+", index, index + 1);
      index += 1;
      continue;
    }

    if (options.pipeAsOr && char === "|" && isBoundary(query[index - 1]) && isBoundary(query[index + 1])) {
      push("OPERATOR", "|", index, index + 1);
      index += 1;
      continue;
    }

    const start = index;
    while (index < query.length) {
      const current = query[index];
      if (/\s|[()（）"“”]/.test(current)) break;
      if ((current === "'" || current === "‘") && isBoundary(query[index - 1])) break;
      if (options.plusAsOr && current === "+" && isBoundary(query[index - 1]) && isBoundary(query[index + 1])) break;
      if (options.pipeAsOr && current === "|" && isBoundary(query[index - 1]) && isBoundary(query[index + 1])) break;
      index += 1;
    }

    if (index === start) {
      index += 1;
      continue;
    }

    const value = query.slice(start, index);
    const upper = value.toUpperCase();
    const isPositionalOperator = /^(NEAR|ONEAR|W|PRE|N)\s*\/\s*\d+$/i.test(value) ||
      /^(SAME|ADJ|WITH|XOR)$/i.test(value);

    if (upper === "AND" || upper === "OR" || upper === "NOT" || isPositionalOperator) {
      push("OPERATOR", upper, start, index);
    } else {
      push("TERM", value, start, index);
    }
  }

  if (stack.length > 0) {
    errors.push({
      id: "unmatched-open",
      type: "UNMATCHED_PAREN",
      severity: "error",
      title: "存在未闭合的左括号 (Unmatched Opening Parenthesis)",
      message: "检测到 " + stack.length + " 个尚未闭合的左括号。",
      snippet: "(",
      fixSuggestion: "检查括号嵌套位置；不要仅在末尾补括号来掩盖逻辑错误。"
    });
  }

  return { tokens, openParens, closeParens, doubleQuotes };
}

function isPrimaryStart(token: Token | undefined): boolean {
  return Boolean(token && (
    token.type === "TERM" ||
    token.type === "PHRASE" ||
    token.type === "LPAREN" ||
    (token.type === "OPERATOR" && token.value === "NOT")
  ));
}

function isBinaryOperator(token: Token | undefined): boolean {
  return Boolean(token && token.type === "OPERATOR" && token.value !== "NOT");
}

function operatorPrecedence(value: string): number {
  if (value === "OR" || value === "+" || value === "|") return 1;
  return 2;
}

export function validateBooleanQuery(query: string, options: ValidationOptions = {}): ValidationResult {
  const errors: SyntaxErrorItem[] = [];
  const warnings: SyntaxErrorItem[] = [];
  const raw = (query || "").trim();

  if (!raw) {
    return {
      isValid: true,
      errors,
      warnings,
      stats: { openParens: 0, closeParens: 0, doubleQuotes: 0, hasFullwidth: false }
    };
  }

  const fullwidthMatches: string[] = [];
  if (/[（）]/.test(raw)) fullwidthMatches.push("全角中文括号");
  if (/[“”]/.test(raw)) fullwidthMatches.push("全角中文双引号");
  if (/[‘’]/.test(raw)) fullwidthMatches.push("全角中文单引号");
  if (/：/.test(raw)) fullwidthMatches.push("全角中文冒号");
  if (/\u3000/.test(raw)) fullwidthMatches.push("全角空格");

  if (fullwidthMatches.length > 0) {
    errors.push({
      id: "fullwidth-chars",
      type: "FULLWIDTH_CHAR",
      severity: "error",
      title: "检测到全角标点 (Full-width Punctuation)",
      message: "检测到 " + fullwidthMatches.join("、") + "。部分数据库要求使用半角语法符号；请核对目标数据库的输入规则。",
      fixSuggestion: "可以先规范化标点，但仍需人工确认检索式结构和数据库语法。"
    });
  }

  const database = options.database || "";
  const isFieldSpecific = options.isFieldSpecific === true;
  const isCnkiFieldQuery = isFieldSpecific && /CNKI|知网/i.test(database);
  const isCnipaFieldQuery = isFieldSpecific && /CNIPA/i.test(database);
  const isPubScholarFieldQuery = isFieldSpecific && /PubScholar|百度学术/i.test(database);
  const implicitOperator = isCnipaFieldQuery
    ? "OR"
    : (!isFieldSpecific && options.operatorStyle === "Space" ? "OR" : undefined);

  const scanned = tokenize(raw, {
    plusAsOr: isCnkiFieldQuery,
    pipeAsOr: isPubScholarFieldQuery
  }, errors);

  const tokens = scanned.tokens.filter(token => token.type !== "FIELD");
  let index = 0;
  let expressionHasOperand = false;

  const addDanglingError = (token: Token, title: string, message: string) => {
    errors.push({
      id: "dangling-" + token.start,
      type: "DANGLING_OPERATOR",
      severity: "error",
      title,
      message,
      snippet: token.value,
      fixSuggestion: "请人工补充缺失的检索词或调整算符位置。"
    });
  };

  const parsePrimary = (): boolean => {
    const token = tokens[index];
    if (!token) return false;

    if (token.type === "TERM" || token.type === "PHRASE") {
      index += 1;
      expressionHasOperand = true;
      return true;
    }

    if (token.type === "LPAREN") {
      const openToken = token;
      index += 1;

      if (tokens[index]?.type === "RPAREN") {
        warnings.push({
          id: "empty-paren-" + openToken.start,
          type: "EMPTY_PAREN",
          severity: "warning",
          title: "存在空括号 (Empty Parentheses)",
          message: "检测到不包含检索词的空括号组。",
          snippet: "()",
          fixSuggestion: "请确认是否应删除该空组；不要自动删除后继续检索。"
        });
        index += 1;
        return false;
      }

      parseExpression(0);
      if (tokens[index]?.type === "RPAREN") index += 1;
      return true;
    }

    if (token.type === "OPERATOR" && token.value !== "NOT") {
      addDanglingError(
        token,
        "算符缺少左侧检索项 (Leading Operator)",
        "表达式不能以二元逻辑或位置算符开始。"
      );
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
        addDanglingError(token, "NOT 缺少检索项 (Dangling NOT)", "NOT 后面必须跟随一个检索词或括号组。");
        return false;
      }
      return parseUnary();
    }
    return parsePrimary();
  };

  const parseExpression = (minimumPrecedence: number): boolean => {
    let hasLeft = parseUnary();

    while (index < tokens.length) {
      const next = tokens[index];
      if (!next || next.type === "RPAREN") break;

      let operator: string | undefined;
      let precedence = 0;
      let implicit = false;

      if (isBinaryOperator(next)) {
        operator = next.value;
        precedence = operatorPrecedence(operator);
      } else if (isPrimaryStart(next)) {
        implicit = true;
        operator = implicitOperator || "AND";
        precedence = operatorPrecedence(operator);

        if (!implicitOperator) {
          warnings.push({
            id: "missing-operator-" + next.start,
            type: "MISSING_OPERATOR",
            severity: "warning",
            title: "相邻检索项之间缺少显式算符 (Missing Operator)",
            message: "检测到相邻检索项或括号组。不同数据库对空格的默认含义可能不同。",
            snippet: next.value,
            fixSuggestion: "请根据目标数据库明确补充 AND、OR，或确认该数据库是否允许空格作为逻辑连接。"
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
            id: "consecutive-operators-" + (firstOperator?.start ?? next.start),
            type: "CONSECUTIVE_OPERATORS",
            severity: "error",
            title: "连续逻辑算符冲突 (Consecutive Operators)",
            message: "连续算符之间缺少检索项，无法确定逻辑关系。",
            snippet: firstOperator?.value + " " + tokens[index]?.value,
            fixSuggestion: "请人工确认此处应保留哪个算符；系统不会擅自替换逻辑关系。"
          });
          while (isBinaryOperator(tokens[index])) index += 1;
        }

        if (!isPrimaryStart(tokens[index])) {
          addDanglingError(
            next,
            "算符缺少右侧检索项 (Trailing Operator)",
            "该算符后面没有可连接的检索词或括号组。"
          );
          break;
        }
      }

      const hasRight = parseExpression(precedence + 1);
      hasLeft = hasLeft || hasRight;
    }

    return hasLeft;
  };

  if (tokens.length > 0) {
    parseExpression(0);
    while (index < tokens.length) {
      if (tokens[index].type === "RPAREN") {
        index += 1;
      } else {
        index += 1;
      }
    }
  } else {
    errors.push({
      id: "missing-search-terms",
      type: "DANGLING_OPERATOR",
      severity: "error",
      title: "没有可解析的检索词 (No Search Terms)",
      message: "检索式只包含字段标签或标点，没有可供检索的词项。",
      fixSuggestion: "请检查字段代码后是否提供了检索词。"
    });
  }

  const fixedQuery = fullwidthMatches.length > 0 ? autoFixBooleanQuery(raw) : undefined;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      openParens: scanned.openParens,
      closeParens: scanned.closeParens,
      doubleQuotes: scanned.doubleQuotes,
      hasFullwidth: fullwidthMatches.length > 0
    },
    fixedQuery: fixedQuery && fixedQuery !== raw ? fixedQuery : undefined
  };
}

/**
 * Conservative normalization only. Never removes, inserts, or rewrites
 * Boolean operators, terms, quotation boundaries, or grouping structure.
 */
export function autoFixBooleanQuery(raw: string): string {
  return raw
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/：/g, ":")
    .replace(/\u3000/g, " ");
}
