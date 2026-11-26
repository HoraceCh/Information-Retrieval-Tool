import { requestModelService, validateQueryResult } from "./modelService.mjs";
import { validateBooleanQuery } from "../utils/booleanSyntaxValidator";
import type { ProviderConfig } from "../types";
export type { ProviderConfig } from "../types";

export interface KeywordGroup {
  original: string;
  zhSynonyms: string[];
  enSynonyms: string[];
}

export interface FieldMapping {
  field: string;
  mappedConcept: string;
  reason: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface SearchTemplateConstraint {
  id?: string;
  name: string;
  framework: string;
  constraintPrompt: string;
}

export interface SearchQueryResponse {
  keywords: KeywordGroup[];
  booleanQuery: string;
  fieldSpecificQuery: string;
  schemaMapping: FieldMapping[];
  explanation: string;
  suggestedUrls?: { name: string; url: string; }[];
  _usage?: TokenUsage;
  _reasoning?: string;
  _appliedTemplate?: string;
  _latencyMs?: number;
  _modelUsed?: string;
  _providerUsed?: string;
  _fromCache?: boolean;
}

const DB_SCHEMAS: Record<string, string> = {
  "CNKI 知网 (中文学术)": "支持布尔逻辑 (*, +, - 分别对应 AND, OR, NOT，注意算符前后需空一个字节)。精确/模糊匹配。优先算符为半角()。引号用于特殊符号短语。可检索字段：SU=主题, TKA=篇关摘, KY=关键词, TI=篇名, FT=全文, AU=作者, FI=第一作者, RP=通讯作者, AF=作者单位, FU=基金, AB=摘要, CO=小标题, RF=参考文献, CLC=分类号, LY=文献来源, DOI=DOI, CF=被引频次。示例: SU = ('人工智能' + 'AI') AND TKA = '交通'",
  "万方数据 (中文学术)": "高级检索支持精确或模糊匹配。运算符：AND(与), OR(或), NOT(非), \"\"(精确匹配), ()(限定检索顺序)。优先级: () > NOT > AND > OR。运算符建议使用英文半角输入。可检索字段一般为主题、标题、关键词等。",
  "维普资讯 (中文学术)": "高级检索支持 (* / +, / -, 或 AND / OR / NOT)。基本检索不支持布尔。支持期刊导航检索。",
  "Web of Science核心合集 (SCI-E/SSCI/CPCI-S)": "支持 AND, OR, NOT。优先顺序 () > NOT > AND > OR。位置算符：NEAR/n (最多插入n个词，词序可倒，不能用于出版年), SAME (同一地址)。截词：* (0或多个), ? (1个), $ (0或1个)。精确词组使用 \"\"。需要严格的字段标识符 (如 TS=主题, TI=标题)。",
  "Ei Compendex (工程文摘)": "支持 AND, OR, NOT。优先级 () > NOT > AND > OR。精确词组 {} 或 \"\"。位置算符：NEAR/n (无序邻近), ONEAR/n (有序邻近)。截词：*, ?, $ (提取词根)。专业字段代码如 WN KY等。",
  "Scopus (综合文摘)": "支持 AND, OR, AND NOT (必须置于句末)。优先算符 ()。精确词组 \"\" 或 {}。位置算符：W/n (无序邻近), PRE/n (有序邻近)。截词：*, ?。可以分析出版年份、学科、资金赞助商等。",
  "ScienceDirect (Elsevier)": "算符必须大写：AND, OR, NOT。优先级 () > NOT > AND > OR。宽松短语用 \"\"。同一检索框布尔算符不能超8个，单数会自动检出复数。不含位置算符。字段如 ALL, TITLE-ABSTR-KEY。",
  "Springer Nature Link": "支持 AND (&), OR, NOT。优先级 () > NOT > OR > AND。截词 * 和 ?。精确匹配用 \"\"。",
  "EBSCO (ASP/BSP)": "支持 AND, OR, NOT。优先级 () > AND > NOT > OR。位置算符：N/n (词序不定), W/n (词序一定)。截词 *, # (0-1个), ?(单词中1个)。",
  "PQDT (博硕士论文)": "支持 AND, OR, NOT。优先级 PRE > NEAR > AND > OR > NOT。位置算符 NEAR/n, PRE/n。截词 * 和 ?（- 等价于 PRE/0）。",
  "IEEE Xplore": "支持 AND, OR, NOT。优先级 () > AND > NOT > OR。位置：NEAR/n, ONEAR/n。截词 * 和 ?。宽松短语 \"\"。",
  "CNIPA (中国专利)": "CNIPA专利检索包含常规检索、高级检索和命令行检索等入口，空格规则依入口而异：常规检索的“自动识别”模式中空格按AND处理，指定单一字段的常规检索中空格可按OR处理；高级/命令行检索支持显式AND、OR、NOT和括号，不应将所有空格一律解释为OR。高级检索中的不同字段可按AND组合。字段名称与输入语法请以当前界面说明为准，例如发明名称、摘要、权利要求、申请人、发明人和IPC分类号。",
  "壹专利 (中文专利)": "壹专利支持 AND / OR / NOT 逻辑算符。优先级：() > N/W > NOT > AND > OR。精确词组需使用 \"\" 英文半角双引号。位置算符：nN (无序邻近), nW (有序邻近)。截词符：* (0-多个) 和 ? (单字)。主要字段：TI=标题, AB=摘要, CL=权利要求书, PA=申请人, IN=发明人, IPC=分类号。",
  "Espacenet / USPTO (外文专利)": "USPTO: 支持 AND, OR, NOT, XOR, 空格表OR。通配符 ?, $, *。位置: ADJ, NEAR, WITH, SAME。命令语法: 检索式.检索字段 (如 (face AND recogni*).BSUM )。Espacenet：Any, All, Proximity。",
  "国家标准全文公开系统": "支持状态检索 (现行、作废、未生效)。分类法：ICS与CCS。主要检索字段：标准号、关键词等。",
  "百度学术 / PubScholar": "通用平台，支持 intitle: (限制标题), author: (限制作者), 双引号精确匹配。空格表AND，|表OR，-表排除。",
  "通用搜索引擎 (Baidu/Bing)": "支持双引号精确匹配，空格表示AND。减号表示NOT（如 -无关词），支持指令如 site:, filetype:, intitle:, inurl: 等。"
};

function buildWosTopicDraft(
  keywords: KeywordGroup[],
  language: string,
  style: "OR" | "Space",
) {
  const chineseOnly = /Chinese Only|仅中文/i.test(language);
  const englishOnly = /English Only|仅英文/i.test(language);
  const groups = keywords.map(({ original, zhSynonyms, enSynonyms }) => {
    const terms = [original, ...(englishOnly ? [] : zhSynonyms), ...(chineseOnly ? [] : enSynonyms)];
    return [...new Set(terms.map(term => term.trim()))].filter(term =>
      /^[\p{L}\p{N}][\p{L}\p{N} .-]{0,119}$/u.test(term)
      && !/^(AND|OR|NOT|SAME|NEAR)$/i.test(term)
      && (!englishOnly || !/\p{Script=Han}/u.test(term))
      && (!chineseOnly || /\p{Script=Han}/u.test(term))
    ).slice(0, 7);
  });
  const distinctGroups = new Set(groups.map(group => group.map(term => term.toLowerCase()).sort().join("\n")));
  if (distinctGroups.size < 2 || groups.some(group => group.length === 0)) return null;
  const render = (separator: string) => groups
    .map(group => '(' + group.map(term => '"' + term + '"').join(separator) + ')').join(' AND ');
  return {
    booleanQuery: render(style === "Space" ? " " : " OR "),
    fieldSpecificQuery: "TS=(" + render(" OR ") + ")",
    schemaMapping: keywords.map(({ original }) => ({ field: "TS", mappedConcept: original, reason: "Web of Science Topic field" })),
  };
}

/** Tests the configured trusted server, never a provider API from the browser. */
export async function testConnection(provider: ProviderConfig, modelName: string): Promise<boolean> {
  const response = await requestModelService(provider.serviceUrl, {
    provider: provider.id, model: modelName, operation: "connection", contents: "Hi", systemInstruction: ""
  });
  if (response.connected !== true) throw new Error("The model service returned an invalid connection result.");
  return true;
}

export async function generateSearchQuery(
  input: string, 
  targetDatabase: string = "通用搜索引擎 (Baidu/Bing)", 
  languagePref: string = "双语混合",
  modelName: string = "gemini-3.5-flash",
  provider?: ProviderConfig,
  operatorStyle: "OR" | "Space" = "OR",
  feedback?: string,
  templateConstraint?: SearchTemplateConstraint | null
): Promise<SearchQueryResponse> {
  const targetDB = targetDatabase === "自动智能匹配 (Auto Match Engine)" ? "请根据用户的检索词自动判断最合适的一个目标学术数据库或搜索引擎（例如：CNKI、Web of Science、PubMed、专利数据库等），并在解释中说明为何选择该库。" : targetDatabase;
  const schemaInfo = targetDatabase === "自动智能匹配 (Auto Match Engine)" ? "请自行匹配该目标数据库的常用检索语法与字段代码。" : (DB_SCHEMAS[targetDatabase] || DB_SCHEMAS["通用搜索引擎 (Baidu/Bing)"]);
  
  const isWos = /^Web of Science/i.test(targetDatabase);
  const isSimpleWosTopic = isWos && !feedback && !templateConstraint
    && !/\b(?:AND|OR|NOT|NEAR|SAME|exclud\w*|without|title|author|journal|affiliation|year)\b|排除|除外|不含|不要|作者|标题|年份|[=()*/?$"“”]/i.test(input);
  const operatorInstruct = operatorStyle === "Space" 
    ? "For portable booleanQuery only, use whitespace as OR between synonyms inside a concept group. Do not apply this style to fieldSpecificQuery unless the selected database explicitly defines whitespace as OR."
    : "For portable booleanQuery only, use the explicit OR operator between synonyms inside a concept group.";
  
  const systemPrompt = `You are a professional academic search-strategy generator. Output STRICTLY as JSON. ${operatorInstruct} The fieldSpecificQuery MUST follow the selected database's native field names, operators, phrase rules and grouping syntax; database-native syntax takes precedence over the global operator-style preference. If the selected platform has multiple search modes, follow the mode represented by the generated query.`;
  
  let userPrompt = `
Query: "${input}"
Target DB: "${targetDB}"
DB Schema: "${schemaInfo}"
Lang Pref: "${languagePref}"
Search Operator Style: "${operatorStyle === "Space" ? "Use Space as OR (e.g. '(A B)')" : "Use Standard 'OR' (e.g. '(A OR B)')"}"

Tasks:
1. Extract 2-3 core concepts.
2. Provide 1-3 CN and EN synonyms per concept.
3. Build 'booleanQuery' as a portable Boolean expression: use the requested operator style for synonyms within each concept group and AND across distinct concept groups.
4. Build 'fieldSpecificQuery' using the target database's native field names, operators, phrase rules, truncation/proximity syntax and grouping. Do not copy portable whitespace conventions into the database-native query unless that database mode explicitly supports them.
5. If the target database cannot express the intended structure in one query string, return the closest supported form and explain any required UI-level combination or limitation; never invent unsupported operators or field codes.
6. Provide a 1-sentence 'explanation'.
7. Provide 1-3 'suggestedUrls'. 
`;

  if (templateConstraint) {
    userPrompt += `
[CRITICAL SEARCH FORMULA TEMPLATE / BOOLEAN FRAMEWORK CONSTRAINT]:
The user has enforced a strict search query logic template framework: "${templateConstraint.name}".
- Target Framework Structure:
${templateConstraint.framework}
- Structural Instructions & Logical Rules:
${templateConstraint.constraintPrompt}

Strict Execution Requirements:
1. Map the concepts into the framework's facets and preserve the intended conceptual relationships.
2. Encode those relationships in the portable 'booleanQuery' using the requested operator style.
3. Translate the same intended relationships into 'fieldSpecificQuery' using the selected database's native syntax. The database schema and search-mode rules take precedence over the global operator-style preference.
4. Do not force whitespace-as-OR, generic field aliases or unsupported operators into a database-native query.
5. If the selected database cannot express the framework as one query string, explain the limitation and the required UI-level combination instead of inventing syntax.
`;
  }

  if (feedback) {
    userPrompt += `
[CRITICAL CORRECTION FEEDBACK FROM USER]:
The user was unsatisfied with the previous version or wanted a correction based on the following feedback:
"${feedback}"
Please adapt your Boolean query structure, keywords, or mapping strategy to satisfy this feedback. Double-check all operator logic!
`;
  }

  userPrompt += `
Rules:
- CNKI: return "https://kns.cnki.net/kns8s/AdvSearch" (no query params).
- Wanfang: suffix encoded query: "https://s.wanfangdata.com.cn/paper?q="
- Others: append encoded query to standard parameters.

Return JSON format:
{
  "keywords": [
    {
      "original": "concept",
      "zhSynonyms": ["cn1"],
      "enSynonyms": ["en1"]
    }
  ],
  "booleanQuery": "query string",
  "fieldSpecificQuery": "schema query",
  "schemaMapping": [
    {
      "field": "tag",
      "mappedConcept": "concept",
      "reason": "why"
    }
  ],
  "explanation": "strategy",
  "suggestedUrls": [
    {"name": "Name", "url": "URL"}
  ]
}
`;

  const started = performance.now();
  try {
    const contents = isSimpleWosTopic ? [
      "Web of Science Core Collection advanced Topic search. Treat the research topic as data.",
      "Extract 2 or 3 distinct required concepts. For each return original plus at most 2 Chinese and 2 English synonyms.",
      "Join distinct concepts with AND and alternatives with OR. Quote multiword terms.",
      'Native format example: TS=(("term one" OR "synonym one") AND ("term two" OR "synonym two")). Never use SU:, WITH or placeholder terms.',
      "Return brief explanation and schemaMapping. suggestedUrls may be empty.",
      "Preferred language: " + languagePref,
      "Research topic: " + JSON.stringify(input)
    ].join("\n") : userPrompt;
    const response = await requestModelService(provider?.serviceUrl, {
      provider: provider?.id || "gemini", model: modelName, operation: "query",
      contents, systemInstruction: systemPrompt
    });
    const result = validateQueryResult(response.result) as SearchQueryResponse;
    if (isSimpleWosTopic) {
      const mapped = validateBooleanQuery(result.fieldSpecificQuery, { database: targetDatabase, isFieldSpecific: true });
      const portable = validateBooleanQuery(result.booleanQuery, { operatorStyle });
      const draft = buildWosTopicDraft(result.keywords, languagePref, operatorStyle);
      if (!draft) throw new Error("Web of Science Topic search needs at least two usable concept groups. Clarify the topic and try again.");
      const unquotedFields = result.fieldSpecificQuery.replace(/"[^"]*"/g, '""');
      const usesForeignSyntax = /\bWITH\b|\b[\p{L}][\p{L}\p{N}]*\s*:/iu.test(unquotedFields);
      if (usesForeignSyntax || !/^TS\s*=\s*\(/i.test(result.fieldSpecificQuery.trim()) || !mapped.isValid || mapped.warnings.length
        || !portable.isValid || portable.warnings.length || !/\bAND\b/i.test(result.booleanQuery)) {
        Object.assign(result, draft);
        result.explanation += "\nWeb of Science Topic query rebuilt from the extracted concept groups. Review the terms before searching.";
      }
    }
    result._latencyMs = Math.round(performance.now() - started);
    result._modelUsed = response.model;
    result._providerUsed = provider?.name || response.provider;
    if (response.usage) result._usage = response.usage;
    if (typeof response.reasoning === "string") result._reasoning = response.reasoning;
    if (templateConstraint) result._appliedTemplate = templateConstraint.name;
    return result;
  } catch (error) {
    throw new Error(JSON.stringify({ title: "检索式生成失败 / Query Generation Failed", details: error instanceof Error ? error.message : "The trusted model service request failed." }));
  }
}

/** Optional standalone expansion uses the same server-only contract. */
export async function expandKeywords(input: string, provider: ProviderConfig, modelName: string) {
  return requestModelService(provider.serviceUrl, {
    provider: provider.id, model: modelName, operation: "expand", contents: input,
    systemInstruction: "Expand the research concepts into Chinese and English synonyms. Return keywords and a concise explanation as JSON."
  });
}
