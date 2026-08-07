import { GoogleGenAI, Type } from "@google/genai";

function getGeminiClient(key?: string): GoogleGenAI {
  const apiKey = key || (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) || "";
  if (!apiKey) {
    throw new Error(JSON.stringify({
      title: "Missing Gemini API Key",
      details: "未配置 Gemini API Key。请在页面右下角设置 ⚙️ Settings 中填入您的密钥。(Gemini API Key is missing. Please configure it in Settings.)"
    }));
  }
  return new GoogleGenAI({ apiKey });
}

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

export interface SearchQueryResponse {
  keywords: KeywordGroup[];
  booleanQuery: string;
  fieldSpecificQuery: string;
  schemaMapping: FieldMapping[];
  explanation: string;
  suggestedUrls?: { name: string; url: string; }[];
  _usage?: TokenUsage;
  _reasoning?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  isGemini: boolean;
  endpoint: string;
  authType: 'Bearer' | 'Header';
  authHeaderName?: string;
  apiKey: string;
  models: string;
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
  "CNIPA (中国专利)": "CNIPA高级检索：空格表示逻辑或(OR)，不支持 AND 等通用逻辑词。检索时通过空格进行同义词扩展。主要字段：TI=发明名称, AB=摘要, CL=权利要求, PA=申请人, IN=发明人, IPC=分类号。",
  "壹专利 (中文专利)": "壹专利支持 AND / OR / NOT 逻辑算符。优先级：() > N/W > NOT > AND > OR。精确词组需使用 \"\" 英文半角双引号。位置算符：nN (无序邻近), nW (有序邻近)。截词符：* (0-多个) 和 ? (单字)。主要字段：TI=标题, AB=摘要, CL=权利要求书, PA=申请人, IN=发明人, IPC=分类号。",
  "Espacenet / USPTO (外文专利)": "USPTO: 支持 AND, OR, NOT, XOR, 空格表OR。通配符 ?, $, *。位置: ADJ, NEAR, WITH, SAME。命令语法: 检索式.检索字段 (如 (face AND recogni*).BSUM )。Espacenet：Any, All, Proximity。",
  "国家标准全文公开系统": "支持状态检索 (现行、作废、未生效)。分类法：ICS与CCS。主要检索字段：标准号、关键词等。",
  "百度学术 / PubScholar": "通用平台，支持 intitle: (限制标题), author: (限制作者), 双引号精确匹配。空格表AND，|表OR，-表排除。",
  "通用搜索引擎 (Baidu/Bing)": "支持双引号精确匹配，空格表示AND。减号表示NOT（如 -无关词），支持指令如 site:, filetype:, intitle:, inurl: 等。"
};

export async function testConnection(provider: ProviderConfig, modelName: string): Promise<boolean> {
  try {
    const isGeminiSDK = provider.isGemini;
    if (!isGeminiSDK) {
      const apiKey = provider.apiKey;
      if (!apiKey) throw new Error("Missing API Key");

      let endpoint = "https://api.deepseek.com/chat/completions";
      if (provider.endpoint && provider.endpoint !== "default") {
        endpoint = provider.endpoint.replace(/\/$/, '') + (provider.endpoint.endsWith('/chat/completions') ? "" : "/chat/completions");
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (provider.authType === 'Header' && provider.authHeaderName) {
        headers[provider.authHeaderName] = apiKey;
      } else {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const requestBody = {
        model: modelName,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 1
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }
      return true;
    } else {
      const geminiKey = provider.apiKey || "";
      const currentAi = getGeminiClient(geminiKey);
      const response = await currentAi.models.generateContent({
        model: modelName || "gemini-3.5-flash",
        contents: "Hi",
        config: { maxOutputTokens: 1 }
      });
      return !!response.text;
    }
  } catch (error) {
    throw error;
  }
}

export async function generateSearchQuery(
  input: string, 
  targetDatabase: string = "通用搜索引擎 (Baidu/Bing)", 
  languagePref: string = "双语混合",
  modelName: string = "gemini-3.5-flash",
  provider?: ProviderConfig,
  operatorStyle: "OR" | "Space" = "OR",
  feedback?: string
): Promise<SearchQueryResponse> {
  const targetDB = targetDatabase === "自动智能匹配 (Auto Match Engine)" ? "请根据用户的检索词自动判断最合适的一个目标学术数据库或搜索引擎（例如：CNKI、Web of Science、PubMed、专利数据库等），并在解释中说明为何选择该库。" : targetDatabase;
  const schemaInfo = targetDatabase === "自动智能匹配 (Auto Match Engine)" ? "请自行匹配该目标数据库的常用检索语法与字段代码。" : (DB_SCHEMAS[targetDatabase] || DB_SCHEMAS["通用搜索引擎 (Baidu/Bing)"]);
  
  const operatorInstruct = operatorStyle === "Space" 
    ? "Strictly use Space (single whitespace character) instead of 'OR' to connect synonyms/alternative terms in booleanQuery and fieldSpecificQuery. For example, use '(A B)' instead of '(A OR B)'. No 'OR' word should appear as logical disjunction."
    : "Strictly use standard 'OR' operator to connect synonyms/alternative terms in booleanQuery and fieldSpecificQuery. For example, use '(A OR B)' instead of '(A B)'.";
  
  const systemPrompt = `You are a professional search query generator. Build optimized search strings for the target DB. Output STRICTLY as JSON.\nConstraint style: ${operatorInstruct}`;
  
  let userPrompt = `
Query: "${input}"
Target DB: "${targetDB}"
DB Schema: "${schemaInfo}"
Lang Pref: "${languagePref}"
Search Operator Style: "${operatorStyle === "Space" ? "Use Space as OR (e.g. '(A B)')" : "Use Standard 'OR' (e.g. '(A OR B)')"}"

Tasks:
1. Extract 2-3 core concepts.
2. Provide 1-3 CN and EN synonyms per concept.
3. Build 'booleanQuery': OR within concepts, AND across concepts. Match Lang Pref AND strictly obey the Search Operator Style (${operatorStyle}).
4. Build 'fieldSpecificQuery' applying DB Schema fields AND strictly obey the Search Operator Style (${operatorStyle}).
5. Provide a 1-sentence 'explanation'.
6. Provide 1-3 'suggestedUrls'. 
`;

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

  try {
    let resultText = "";
    let usageInfo: TokenUsage | undefined;
    let reasoningContent: string | undefined;

    const isGeminiSDK = provider ? provider.isGemini : !modelName.startsWith("deepseek");

    if (!isGeminiSDK) {
      // OpenAI compatible API (DeepSeek, Custom, etc.)
      const apiKey = provider?.apiKey || "";
      if (!apiKey) {
        throw new Error(JSON.stringify({
          title: "Missing API Key",
          details: "该模型提供商未配置 API Key。 (API Key is missing for this provider in Settings.)"
        }));
      }

      const isReasoner = modelName.includes("reasoner") || modelName.includes("r1") || modelName.includes("v4-pro");
      const requestBody: any = {
        model: modelName,
        messages: isReasoner ? [
          { role: "user", content: `${systemPrompt}\n\n${userPrompt}` }
        ] : [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: isReasoner ? 8192 : 4096
      };
      
      // DeepSeek models might have different support for response_format
      if (!isReasoner) {
        requestBody.response_format = { type: "json_object" };
      }

      let endpoint = "https://api.deepseek.com/chat/completions";
      if (provider?.endpoint && provider.endpoint !== "default") {
        const base = provider.endpoint.replace(/\/$/, '');
        endpoint = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (provider?.authType === 'Header' && provider.authHeaderName) {
        headers[provider.authHeaderName] = apiKey;
      } else {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;
      resultText = message?.content || "{}";
      reasoningContent = message?.reasoning_content;

      if (data.usage) {
        usageInfo = {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0
        };
      }
      
      // Better JSON extraction from markdown
      const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (jsonMatch) {
        resultText = jsonMatch[1].trim();
      } else if (resultText.includes("\`\`\`")) {
        resultText = resultText.replace(/\`\`\`(json)?/gi, "").trim();
      }
    } else {
      // Gemini API
      const geminiKey = provider?.apiKey || "";
      const currentAi = getGeminiClient(geminiKey);
      const response = await currentAi.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              keywords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    zhSynonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
                    enSynonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["original", "zhSynonyms", "enSynonyms"]
                }
              },
              booleanQuery: { type: Type.STRING },
              fieldSpecificQuery: { type: Type.STRING },
              schemaMapping: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    field: { type: Type.STRING },
                    mappedConcept: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["field", "mappedConcept", "reason"]
                }
              },
              explanation: { type: Type.STRING },
              suggestedUrls: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ["name", "url"]
                }
              }
            },
            required: ["keywords", "booleanQuery", "fieldSpecificQuery", "schemaMapping", "explanation", "suggestedUrls"]
          }
        }
      });
      resultText = response.text || "{}";
      if (response.usageMetadata) {
        usageInfo = {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          completionTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0
        };
      }
    }

    const result = JSON.parse(resultText);
    if (usageInfo) {
      result._usage = usageInfo;
    }
    if (reasoningContent) {
      result._reasoning = reasoningContent;
    }
    return result as SearchQueryResponse;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Check if it's already our structured JSON error format
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.title && parsed.details) {
        throw error; // Re-throw the original error directly
      }
    } catch (_) {}

    let title = "检索式生成失败 / Query Generation Failed";
    let details = "请检查网络连接或 API 配置。 (Please check your network connection or API configuration.)";
    
    if (error.status === 401 || error.message?.includes("API key not valid")) {
      details = "提供的 API Key 无效或未授权。请在设置(Settings)中查验。(The provided API Key is invalid or unauthorized. Please verify it in Settings.)";
    } else if (error.status === 429 || error.message?.includes("quota")) {
      details = "API 请求配额超限，请稍后再试或更换 API Key。(API request quota exceeded. Please try again later or use a different API Key.)";
    } else if (error.status === 503 || error.message?.includes("overloaded")) {
      details = "模型服务当前不可用或过载，请稍后再试或更换 model。(The service is currently unavailable or overloaded. Please try again later or switch models.)";
    } else if (error.message?.includes("fetch failed") || error.message?.includes("Failed to fetch")) {
      details = "网络请求失败，请检查您的 network 连接。(Network request failed. Please check your internet connection.)";
    } else {
      details = `内部错误/Internal Error: ${error.message || "Unknown error"}`;
    }
    
    throw new Error(JSON.stringify({ title, details }));
  }
}
