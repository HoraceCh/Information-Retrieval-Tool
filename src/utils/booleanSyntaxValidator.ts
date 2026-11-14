/**
 * Real-time Boolean Search Query Syntax Validator
 * Detects common academic retrieval syntax errors:
 * - Unmatched parentheses (depth & count)
 * - Unclosed phrase quotes (" or ')
 * - Full-width Chinese punctuation (（, ）, “, ”, ：) which cause query failure in databases
 * - Dangling operators (leading, trailing, or adjacent to brackets: e.g. AND ), ( AND)
 * - Consecutive conflicting operators (AND AND, OR OR, OR AND)
 * - Empty parentheses ()
 * - Missing operators between adjacent clauses ( ) ( or "A" "B" )
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
  fixedQuery?: string;
}

export function validateBooleanQuery(query: string): ValidationResult {
  const errors: SyntaxErrorItem[] = [];
  const warnings: SyntaxErrorItem[] = [];

  if (!query || !query.trim()) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      stats: { openParens: 0, closeParens: 0, doubleQuotes: 0, hasFullwidth: false }
    };
  }

  const raw = query.trim();

  // 1. Check for Full-Width Chinese Symbols (Critical Database Syntax Error)
  const fullwidthMatches: string[] = [];
  if (/[（）]/.test(raw)) fullwidthMatches.push("全角中文括号 '（' 或 '）'");
  if (/[“”]/.test(raw)) fullwidthMatches.push("全角中文双引号 '“' 或 '”'");
  if (/[‘’]/.test(raw)) fullwidthMatches.push("全角中文单引号 '‘' 或 '’'");
  if (/：/.test(raw)) fullwidthMatches.push("全角中文冒号 '：'");
  if (/\u3000/.test(raw)) fullwidthMatches.push("全角空格 (Full-width space)");

  if (fullwidthMatches.length > 0) {
    errors.push({
      id: "fullwidth-chars",
      type: "FULLWIDTH_CHAR",
      severity: "error",
      title: "全角中文字符警示 (Full-width Characters)",
      message: `检测到 ${fullwidthMatches.join("、")}。WOS、PubMed、Scopus 等学术数据库会直接报语法错误或无法解析。`,
      fixSuggestion: "转换为标准英文半角符号 ( ) \" \" :"
    });
  }

  // Normalize string for logical token evaluation (without replacing user string)
  // 2. Parentheses Matching and Nesting Depth Check
  let openCount = 0;
  let closeCount = 0;
  let prematureClose = false;
  let inDoubleQuote = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"' && (i === 0 || raw[i - 1] !== '\\')) {
      inDoubleQuote = !inDoubleQuote;
    }
    // Only count parentheses outside string quotes
    if (!inDoubleQuote) {
      if (ch === '(' || ch === '（') {
        openCount++;
      } else if (ch === ')' || ch === '）') {
        closeCount++;
        if (closeCount > openCount) {
          prematureClose = true;
        }
      }
    }
  }

  if (openCount !== closeCount || prematureClose) {
    const diff = Math.abs(openCount - closeCount);
    let msg = "";
    if (openCount > closeCount) {
      msg = `左括号 '(' (${openCount}个) 多于右括号 ')' (${closeCount}个)，缺失 ${diff} 个闭合右括号。`;
    } else if (closeCount > openCount) {
      msg = `右括号 ')' (${closeCount}个) 多于左括号 '(' (${openCount}个)，多出 ${diff} 个未匹配的右括号。`;
    } else if (prematureClose) {
      msg = `右括号在对应左括号出现前提前闭合，导致括号嵌套顺序错乱。`;
    }

    errors.push({
      id: "unmatched-paren",
      type: "UNMATCHED_PAREN",
      severity: "error",
      title: "括号不匹配 (Unmatched Parentheses)",
      message: msg,
      fixSuggestion: openCount > closeCount ? `在末尾补全 ${diff} 个 ')' 括号` : "检查并移除多余闭合括号"
    });
  }

  // 3. Phrase Double Quotes Balance
  let quoteCount = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '"' && (i === 0 || raw[i - 1] !== '\\')) {
      quoteCount++;
    }
  }
  if (quoteCount % 2 !== 0) {
    errors.push({
      id: "unclosed-quote",
      type: "UNCLOSED_QUOTE",
      severity: "error",
      title: "短语双引号未闭合 (Unclosed Quotes)",
      message: `检测到奇数个双引号 (共 ${quoteCount} 个)，存在未闭合的精确检索词组。`,
      fixSuggestion: "在词组末尾补齐双引号 '\"'"
    });
  }

  // 4. Empty Parentheses
  if (/\(\s*\)/.test(raw)) {
    warnings.push({
      id: "empty-paren",
      type: "EMPTY_PAREN",
      severity: "warning",
      title: "存在空括号 () (Empty Parentheses)",
      message: "检测到不包含任何检索词的空括号 '()'，这会导致部分数据库解析异常。",
      fixSuggestion: "删除空括号 '()'"
    });
  }

  // 5. Dangling Operators
  // Leading Operator
  const leadingOpMatch = raw.match(/^\s*(AND|OR|NOT)\b/i);
  if (leadingOpMatch) {
    errors.push({
      id: "leading-op",
      type: "DANGLING_OPERATOR",
      severity: "error",
      title: "首部悬空算符 (Leading Operator)",
      message: `检索式开头不能以逻辑算符 '${leadingOpMatch[1].toUpperCase()}' 起始。`,
      snippet: leadingOpMatch[0],
      fixSuggestion: `删除开头的 '${leadingOpMatch[1].toUpperCase()}'`
    });
  }

  // Trailing Operator
  const trailingOpMatch = raw.match(/\b(AND|OR|NOT)\s*$/i);
  if (trailingOpMatch) {
    errors.push({
      id: "trailing-op",
      type: "DANGLING_OPERATOR",
      severity: "error",
      title: "末尾悬空算符 (Trailing Operator)",
      message: `检索式末尾缺少连接的操作数，悬空算符 '${trailingOpMatch[1].toUpperCase()}' 将导致检索中断。`,
      snippet: trailingOpMatch[0],
      fixSuggestion: `删除末尾悬空的 '${trailingOpMatch[1].toUpperCase()}' 或补充后置检索词`
    });
  }

  // Operator immediately before closing parenthesis: e.g. (AI AND )
  const opBeforeCloseMatch = raw.match(/\b(AND|OR|NOT)\s*[\)）]/i);
  if (opBeforeCloseMatch) {
    errors.push({
      id: "op-before-close",
      type: "DANGLING_OPERATOR",
      severity: "error",
      title: "括号内悬空算符 (Operator Before Close)",
      message: `括号闭合前存在未连接词项的算符 '${opBeforeCloseMatch[0]}'。`,
      snippet: opBeforeCloseMatch[0],
      fixSuggestion: "移除括号前多余的逻辑运算符"
    });
  }

  // Operator immediately after opening parenthesis: e.g. ( AND AI)
  const opAfterOpenMatch = raw.match(/[\(（]\s*(AND|OR)\b/i);
  if (opAfterOpenMatch) {
    errors.push({
      id: "op-after-open",
      type: "DANGLING_OPERATOR",
      severity: "error",
      title: "括号内起始悬空算符 (Operator After Open)",
      message: `括号开启后不能直接跟随二元算符 '${opAfterOpenMatch[0]}'。`,
      snippet: opAfterOpenMatch[0],
      fixSuggestion: "移除开括号后紧跟的算符"
    });
  }

  // 6. Consecutive Duplicate/Conflicting Operators
  const consecutiveMatch = raw.match(/\b(AND|OR)\s+(AND|OR)\b/i);
  if (consecutiveMatch) {
    errors.push({
      id: "consecutive-ops",
      type: "CONSECUTIVE_OPERATORS",
      severity: "error",
      title: "连续逻辑算符冲突 (Consecutive Operators)",
      message: `检测到连续紧邻的逻辑算符 '${consecutiveMatch[0].toUpperCase()}'，缺乏中间检索词项。`,
      snippet: consecutiveMatch[0],
      fixSuggestion: `精简为单个逻辑算符 '${consecutiveMatch[1].toUpperCase()}'`
    });
  }

  const consecutiveNotMatch = raw.match(/\bNOT\s+(AND|OR|NOT)\b/i);
  if (consecutiveNotMatch) {
    errors.push({
      id: "consecutive-not",
      type: "CONSECUTIVE_OPERATORS",
      severity: "error",
      title: "非法算符连用 (Invalid NOT combination)",
      message: `检测到非法连用算符 '${consecutiveNotMatch[0].toUpperCase()}'。`,
      snippet: consecutiveNotMatch[0]
    });
  }

  // 7. Missing Operators between Adjacent Parentheses Clauses: e.g. (A OR B) (C OR D)
  const adjacentParensMatch = raw.match(/[\)）]\s*[\(（]/);
  if (adjacentParensMatch) {
    warnings.push({
      id: "missing-op-parens",
      type: "MISSING_OPERATOR",
      severity: "warning",
      title: "括号组间疑似缺失逻辑算符 (Missing Operator Between Clauses)",
      message: "检测到两个独立的括号组 ') (' 直接相邻，未显式声明 AND 或 OR 算符。多数数据库会报语法错误或默认解析行为不一致。",
      snippet: ") (",
      fixSuggestion: "在括号组之间补充 'AND' 明确组配关系"
    });
  }

  // 8. Missing Operators between Adjacent Quoted Phrases: e.g. "word1" "word2"
  const adjacentQuotesMatch = raw.match(/"\s+"/);
  if (adjacentQuotesMatch) {
    warnings.push({
      id: "missing-op-quotes",
      type: "MISSING_OPERATOR",
      severity: "warning",
      title: "双引号词组间缺少逻辑算符 (Missing Operator Between Phrases)",
      message: "两个被双引号括起的检索词组紧挨着，中间未指定 AND / OR 算符。",
      snippet: '" "',
      fixSuggestion: '在词组间补充明确的 AND 或 OR'
    });
  }

  const isValid = errors.length === 0;

  // Generate fixed query if fixable
  let fixedQuery: string | undefined = undefined;
  if (!isValid || warnings.length > 0) {
    fixedQuery = autoFixBooleanQuery(raw, {
      hasFullwidth: fullwidthMatches.length > 0,
      openCount,
      closeCount,
      quoteCount
    });
  }

  return {
    isValid,
    errors,
    warnings,
    stats: {
      openParens: openCount,
      closeParens: closeCount,
      doubleQuotes: quoteCount,
      hasFullwidth: fullwidthMatches.length > 0
    },
    fixedQuery: fixedQuery !== raw ? fixedQuery : undefined
  };
}

/**
 * Intelligent Auto-Fix Helper
 * Automatically corrects full-width chars, trims dangling operators, merges duplicates, and balances quotes/parens.
 */
export function autoFixBooleanQuery(
  raw: string,
  hint?: {
    hasFullwidth?: boolean;
    openCount?: number;
    closeCount?: number;
    quoteCount?: number;
  }
): string {
  let fixed = raw;

  // 1. Replace Chinese full-width characters
  fixed = fixed
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/：/g, ":")
    .replace(/\u3000/g, " ");

  // 2. Clean empty parentheses ()
  fixed = fixed.replace(/\(\s*\)/g, "");

  // 3. Clean duplicate consecutive operators
  fixed = fixed.replace(/\b(AND)\s+(AND)\b/gi, "AND");
  fixed = fixed.replace(/\b(OR)\s+(OR)\b/gi, "OR");
  fixed = fixed.replace(/\b(AND)\s+(OR)\b/gi, "AND");
  fixed = fixed.replace(/\b(OR)\s+(AND)\b/gi, "AND");
  fixed = fixed.replace(/\b(NOT)\s+(NOT)\b/gi, "");

  // 4. Clean operators immediately before closing parenthesis: e.g. " AND )" -> " )"
  fixed = fixed.replace(/\s*\b(AND|OR|NOT)\s*\)/gi, ")");

  // 5. Clean operators immediately after opening parenthesis: e.g. "( AND " -> "( "
  fixed = fixed.replace(/\(\s*\b(AND|OR)\s+/gi, "(");

  // 6. Clean leading operators: e.g. "^AND "
  fixed = fixed.replace(/^\s*(AND|OR|NOT)\s+/i, "");

  // 7. Clean trailing operators: e.g. " AND$"
  fixed = fixed.replace(/\s+(AND|OR|NOT)\s*$/i, "");

  // 8. Auto-insert missing AND between adjacent clauses: ") (" -> ") AND ("
  fixed = fixed.replace(/\)\s*\(/g, ") AND (");

  // 9. Auto-balance double quotes if odd
  let quotes = 0;
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i] === '"') quotes++;
  }
  if (quotes % 2 !== 0) {
    fixed = fixed + '"';
  }

  // 10. Auto-balance parentheses
  let open = 0;
  let close = 0;
  for (let i = 0; i < fixed.length; i++) {
    if (fixed[i] === '(') open++;
    if (fixed[i] === ')') close++;
  }

  if (open > close) {
    fixed = fixed + ")".repeat(open - close);
  }

  // Tidy multiple spaces
  fixed = fixed.replace(/[ \t]+/g, " ").trim();

  return fixed;
}
