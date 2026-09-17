import { SearchTemplate } from '../types';

export const DEFAULT_SEARCH_TEMPLATES: SearchTemplate[] = [
  {
    id: 'preset-topic-constraint-field',
    name: '主题 + 限制 + 字段 (Topic + Constraint + Field)',
    category: '通用学术',
    description: '经典通用检索三层分面架构。先构建核心主题概念，再结合群体/时间/地域/条件等限制，最终映射至目标数据库字段限定。',
    framework: '(核心主题词 OR 主题同义词) AND (限制条件 OR 约束范围) AND (目标字段限定代码)',
    constraintPrompt: `要求将检索式结构清晰划分为三个核心逻辑小面：
1. 核心研究主题 (Topic)：聚焦核心研究对象与机理，并提供同义词、近义词与学术英文扩展；
2. 研究范围与限制约束 (Constraint)：限定特定的研究群体、材料体系、条件参数、应用场景或排除无关维度；
3. 目标数据库字段代码限定 (Field)：在字段检索式中，按目标数据库语法精确限定字段代码（如 SU=主题, TS=Topic, TI=Title 等）。
各小面内部同义词使用 OR 扩展，小面之间强制使用 AND 逻辑组配。`,
    isPreset: true,
    tags: ['经典框架', '通用学术', '分面检索']
  },
  {
    id: 'preset-pico',
    name: 'PICO 循证医学框架 (Patient, Intervention, Comparison, Outcome)',
    category: '循证医学',
    description: '临床医学、系统评价与 Meta 分析金标准。严密拆解研究对象/患者(P)、干预措施(I)、对照方案(C)和结局指标(O)。',
    framework: '(Patient/Population) AND (Intervention) AND (Comparison - 可选) AND (Outcome)',
    constraintPrompt: `严格遵循循证医学与系统综述的标准 PICO 框架拆解检索要素：
- P (Patient/Population)：研究对象、目标人群或疾病/表型（含疾病全称、缩写与 MeSH 词）；
- I (Intervention)：干预手段、治疗药物、诊疗技术或手术方案；
- C (Comparison)：对照组或常规方案（若用户检索意图未明确指定对照，该分面可合理省略）；
- O (Outcome)：预期结局、生物标志物、疗效指标或不良反应。
每个要素内部使用 OR 连接同义词与相关专业术语，要素之间使用 AND 连接。`,
    isPreset: true,
    tags: ['医学', 'PubMed', '系统评价', '临床试验']
  },
  {
    id: 'preset-problem-method-app',
    name: '问题 + 方法 + 场景 (Problem + Method + Application)',
    category: '工科与计算机',
    description: '计算机、人工智能、通信、电子及工程交叉学科经典。清晰区隔科学问题、核心算法/模型与落地应用场景，大幅降低跨领域误检率。',
    framework: '(核心科学问题/目标) AND (关键算法/技术路线/模型) AND (落地应用领域/载体)',
    constraintPrompt: `结构必须清晰分解为三大技术要素：
1. 核心科学问题或研究目标 (Problem)：待解决的技术瓶颈、物理现象或系统缺陷；
2. 关键算法或技术方案 (Method)：采用的核心理论、模型架构、算法名称、工艺制程（含全称与缩写）；
3. 落地应用领域或技术载体 (Application)：具体的落地场景、终端平台或实验载体。
各要素间使用 AND 组配，方法与应用严禁混杂在同一括号层级内。`,
    isPreset: true,
    tags: ['人工智能', 'IEEE', '计算机', '算法工程']
  },
  {
    id: 'preset-patent-triad',
    name: '专利三要素 (Problem + Feature + Effect)',
    category: '知识产权与专利',
    description: '知识产权、专利查新与侵权规避分析标准范式。适用于 CNIPA、壹专利、IncoPat、Derwent 等专利检索系统。',
    framework: '(发明目的/技术问题) AND (核心结构/工艺特征/组分) AND (技术效果/性能提升)',
    constraintPrompt: `遵循专利查新与侵权分析的标准三要素范式构建检索式：
1. 技术问题/发明目的：发明所要克服的缺陷或所属领域；
2. 必要技术特征：实现发明的核心结构、机械部件、化学组分、配方或关键流程步骤；
3. 有益效果/功能指标：发明所取得的技术效果、性能提升或参数表征。
针对特征词广泛提取上下位概念、行业通称及替代方案，避免漏检。`,
    isPreset: true,
    tags: ['专利查新', 'CNIPA', '壹专利', '防侵权检索']
  },
  {
    id: 'preset-broad-recall',
    name: '高召回宽泛摸底 (Broad Recall Priority)',
    category: '查全摸底',
    description: '查全率优先 (Recall Priority)。广泛收录上位词、别名、通称及缩写，适合前期文献全景调研与学科综述。',
    framework: '(核心词 OR 上位词 OR 学术别名 OR 英文缩写 OR 英文全称)',
    constraintPrompt: `最大化召回率 (High Recall Priority)：
以用户核心主题为中心，极尽可能扩充上下位词、学术别名、行业通称、英文缩写与全称。
精简或取消次要的限制性 AND 过滤条件，确保文献检索不漏检，覆盖最广泛的相关文献。`,
    isPreset: true,
    tags: ['查全优先', '前期调研', '文献综述']
  },
  {
    id: 'preset-precision-focus',
    name: '高精准专指标注 (Precision Focus Priority)',
    category: '精准定位',
    description: '查准率优先 (Precision Priority)。聚焦核心专指创新术语，并严格锁定在篇名(TI)或关键词(KY)，剔除全文噪音。',
    framework: '(专指核心术语) AND (特征关键词) [严格限定在篇名TI或关键词KY]',
    constraintPrompt: `最大化查准率 (High Precision Priority)：
提取最专指的创新术语与关键短语，严格剔除模糊宽泛的上位词。
在字段检索式中优先限定为标题(TI)、关键词(KY)或摘要(AB)，严禁使用模糊的全文检索，以极高准确度筛选顶级标杆成果。`,
    isPreset: true,
    tags: ['查准优先', '高精度', 'Top成果定位']
  }
];
