import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export interface SearchQueryResponse {
  keywords: KeywordGroup[];
  booleanQuery: string;
  fieldSpecificQuery: string;
  schemaMapping: FieldMapping[];
  explanation: string;
}

const DB_SCHEMAS: Record<string, string> = {
  "通用搜索引擎 (Baidu/Bing)": "无固定特殊字段，支持双引号精确匹配，空格表示AND。减号表示NOT（如 -无关词），支持高级指令如 site:, filetype:, intitle:, inurl: 等。要求：生成通用的关键字组合即可。",
  "CNKI 知网 (中文学术)": "支持中文高级检索式（逻辑符为 * + - ，分别对应 AND OR NOT）。核心字段代码：SU=主题, TI=篇名, KY=关键词, AB=摘要, AU=作者, AF=作者单位。必须严格使用这些代码。示例：SU=('人工智能' + 'AI') * TI='交通'",
  "万方数据 (中文学术)": "支持高级布尔检索（逻辑符为 * + -）。核心检索字段：主题、题名、关键词、摘要、作者。示例：主题:(人工智能 + AI) * 题名:(应用)",
  "维普资讯 (中文学术)": "支持高级检索逻辑（可用 AND OR NOT）。核心检索字段：M=题名或关键词, T=题名, K=关键词, R=文摘, A=作者。示例：M=(人工智能 OR AI) AND T=(算法)",
  "ScienceDirect/Wiley (外文学术)": "英文布尔检索。支持 ALL, TITLE-ABSTR-KEY (标题摘要关键词), TITLE, AUTHORS。必须全部生成英文查询式！包含双引号的精确匹配。逻辑符必须大写 (AND, OR, NOT)。",
  "PubMed (生物医药)": "支持严格的标签化字段检索。常用标签：[TIAB] (标题/摘要检索), [MH] (MeSH医学主旨词检索), [AU] (作者)。生成的检索式必须全英文。示例：(cancer[TIAB] OR tumor[TIAB]) AND treatment[MH]",
  "CNIPA / Espacenet (专利检索)": "用于专利和商标查询。核心字段：TI (发明名称), AB (摘要), CL (权利要求), PA (申请人), IN (发明人), IPC (分类号)。可以使用截词符如 * ?。示例：TI=(折叠屏 OR 柔性屏) AND AB=(耐久性)",
  "国家法律/标准/统计局 (政务数据)": "偏向全文普通布尔检索，或使用特定的分类表。主要字段：标题(Title)、全文(FullText)、发文机关(Agency)、指标名称(Indicator)。可以简单使用带括号的 AND/OR。",
  "百度学术 / PubScholar": "通用学术平台，支持 intitle: (限制标题), author: (限制作者), 以及双引号精确匹配。用空格表示AND，| 表示OR，-表示排除。"
};

export async function generateSearchQuery(input: string, targetDatabase: string = "通用搜索引擎 (Baidu/Bing)", languagePref: string = "双语混合"): Promise<SearchQueryResponse> {
  const schemaInfo = DB_SCHEMAS[targetDatabase] || DB_SCHEMAS["通用搜索引擎 (Baidu/Bing)"];
  
  const prompt = `
你是一位专业的检索专家，正在辅助学生准备“AI+信息素养”大赛。
用户的自然语言需求是： "${input}"
目标数据库平台： "${targetDatabase}"
该数据库的字段架构参考： "${schemaInfo}"
检索语种偏好： "${languagePref}" （在生成最终检索式时，请根据此偏好决定是否仅使用中文同义词、仅英文同义词，或中英混合以提高召回率。外文数据库请默认优先全英文。）

任务：
1. 识别核心：从需求中识别出 2-4 个核心主轴关键词。
2. 双语同义词扩展：为每个关键词分别深度挖掘 3-5 个中文同义词/上下位词，以及 3-5 个精确的英文专业术语/同义词。无论偏好如何，此处必须同时返回中英双语的同义词表，以供参考。
3. 基础布尔检索式：结合语种偏好"${languagePref}"构建基础检索式。规则：同组词用 OR (或当地系统语法) 连接加括号，不同组用 AND (或当地系统语法) 连接。
4. 架构映射与高级检索式 (Schema-Mapped Query)：基于提供的数据库字段架构，将检索意图映射到特定字段，生成高级精准的检索式（fieldSpecificQuery）。同样需要考虑语种偏好。
5. 必须提供基于 schema 映射的理由，重点解释双语词汇和字段选用的策略。

请严格按 JSON 格式返回，结构如下：
{
  "keywords": [
    {
      "original": "关键词1",
      "zhSynonyms": ["中文同义词1", "中文同义词2", ...],
      "enSynonyms": ["EnglishSynonym1", "EnglishSynonym2", ...]
    }
  ],
  "booleanQuery": "基础的布尔检索式，不带字段限定",
  "fieldSpecificQuery": "使用数据库特定字段架构的高级检索式",
  "schemaMapping": [
    {
      "field": "例如 SU 或 TIAB",
      "mappedConcept": "对应搜索的概念（如：性能指标）",
      "reason": "为什么映射到这个字段的说明"
    }
  ],
  "explanation": "检索策略与架构选择的整体说明"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
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
            explanation: { type: Type.STRING }
          },
          required: ["keywords", "booleanQuery", "fieldSpecificQuery", "schemaMapping", "explanation"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as SearchQueryResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("检索式生成失败，请检查网络连接或 API 配置。");
  }
}
