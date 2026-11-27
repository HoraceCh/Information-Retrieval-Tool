/**
 * Academic spell checker for search query construction.
 *
 * Detects common English & Chinese academic spelling errors (plus bounded
 * Damerau-Levenshtein fuzzy matches against a curated academic vocabulary)
 * while protecting Boolean operators, field tags, acronyms, wildcard stems,
 * and valid British/American spelling variants.
 */

export interface SpellIssue {
  id: string;
  word: string;
  start: number;
  end: number;
  suggestions: string[];
  category: "academic_en" | "academic_zh" | "fuzzy_en";
  domain: string;
  reasonZh: string;
  reasonEn: string;
  confidence: "high" | "medium";
}

export interface SpellCheckOptions {
  ignoredWords?: Iterable<string>;
  skipBooleanSyntax?: boolean;
}

interface TypoEntry {
  suggestions: string[];
  domain: string;
  reasonZh?: string;
  reasonEn?: string;
}

const DOMAIN_GENERAL = "通用学术 / General";
const DOMAIN_AI_CS = "AI与计算机 / CS & AI";
const DOMAIN_MED_BIO = "医学与生物 / Medicine & Bio";
const DOMAIN_ENG_MAT = "理工与材料 / Sci & Eng";
const DOMAIN_SOC_ECON = "社科与经管 / Social & Econ";

/**
 * Curated dictionary of common English academic spelling errors.
 * Keys are strictly lowercase. Valid US/UK variants are NEVER included here.
 */
const ACADEMIC_EN_TYPOS: Record<string, TypoEntry> = {
  // General academic & research methodology
  acheive: { suggestions: ["achieve"], domain: DOMAIN_GENERAL },
  achive: { suggestions: ["achieve"], domain: DOMAIN_GENERAL },
  achievment: { suggestions: ["achievement"], domain: DOMAIN_GENERAL },
  accomodate: { suggestions: ["accommodate"], domain: DOMAIN_GENERAL },
  acuracy: { suggestions: ["accuracy"], domain: DOMAIN_GENERAL },
  acurracy: { suggestions: ["accuracy"], domain: DOMAIN_GENERAL },
  analaysis: { suggestions: ["analysis"], domain: DOMAIN_GENERAL },
  analsis: { suggestions: ["analysis"], domain: DOMAIN_GENERAL },
  analysys: { suggestions: ["analysis"], domain: DOMAIN_GENERAL },
  analize: { suggestions: ["analyze", "analyse"], domain: DOMAIN_GENERAL },
  anaylze: { suggestions: ["analyze"], domain: DOMAIN_GENERAL },
  apropriate: { suggestions: ["appropriate"], domain: DOMAIN_GENERAL },
  aproximate: { suggestions: ["approximate"], domain: DOMAIN_GENERAL },
  assesment: { suggestions: ["assessment"], domain: DOMAIN_GENERAL },
  asessment: { suggestions: ["assessment"], domain: DOMAIN_GENERAL },
  assymetry: { suggestions: ["asymmetry"], domain: DOMAIN_GENERAL },
  asymetry: { suggestions: ["asymmetry"], domain: DOMAIN_GENERAL },
  biblography: { suggestions: ["bibliography"], domain: DOMAIN_GENERAL },
  bibliogaphy: { suggestions: ["bibliography"], domain: DOMAIN_GENERAL },
  calibraton: { suggestions: ["calibration"], domain: DOMAIN_GENERAL },
  catagory: { suggestions: ["category"], domain: DOMAIN_GENERAL },
  categroy: { suggestions: ["category"], domain: DOMAIN_GENERAL },
  charateristic: { suggestions: ["characteristic"], domain: DOMAIN_GENERAL },
  characterstic: { suggestions: ["characteristic"], domain: DOMAIN_GENERAL },
  classificaton: { suggestions: ["classification"], domain: DOMAIN_GENERAL },
  clasification: { suggestions: ["classification"], domain: DOMAIN_GENERAL },
  coefficent: { suggestions: ["coefficient"], domain: DOMAIN_GENERAL },
  coeficient: { suggestions: ["coefficient"], domain: DOMAIN_GENERAL },
  comparision: { suggestions: ["comparison"], domain: DOMAIN_GENERAL },
  comparsion: { suggestions: ["comparison"], domain: DOMAIN_GENERAL },
  computatonal: { suggestions: ["computational"], domain: DOMAIN_GENERAL },
  computaional: { suggestions: ["computational"], domain: DOMAIN_GENERAL },
  conclussion: { suggestions: ["conclusion"], domain: DOMAIN_GENERAL },
  conclsion: { suggestions: ["conclusion"], domain: DOMAIN_GENERAL },
  correlaton: { suggestions: ["correlation"], domain: DOMAIN_GENERAL },
  corelation: { suggestions: ["correlation"], domain: DOMAIN_GENERAL },
  critera: { suggestions: ["criteria"], domain: DOMAIN_GENERAL },
  definately: { suggestions: ["definitely"], domain: DOMAIN_GENERAL },
  definitly: { suggestions: ["definitely"], domain: DOMAIN_GENERAL },
  dependancy: { suggestions: ["dependency"], domain: DOMAIN_GENERAL },
  dimenson: { suggestions: ["dimension"], domain: DOMAIN_GENERAL },
  dimention: { suggestions: ["dimension"], domain: DOMAIN_GENERAL },
  distribuiton: { suggestions: ["distribution"], domain: DOMAIN_GENERAL },
  distrbution: { suggestions: ["distribution"], domain: DOMAIN_GENERAL },
  efficency: { suggestions: ["efficiency"], domain: DOMAIN_GENERAL },
  effciency: { suggestions: ["efficiency"], domain: DOMAIN_GENERAL },
  empiracal: { suggestions: ["empirical"], domain: DOMAIN_GENERAL },
  emperical: { suggestions: ["empirical"], domain: DOMAIN_GENERAL },
  enviroment: { suggestions: ["environment"], domain: DOMAIN_GENERAL },
  enviornment: { suggestions: ["environment"], domain: DOMAIN_GENERAL },
  enviromental: { suggestions: ["environmental"], domain: DOMAIN_GENERAL },
  equilibruim: { suggestions: ["equilibrium"], domain: DOMAIN_GENERAL },
  estimaton: { suggestions: ["estimation"], domain: DOMAIN_GENERAL },
  evaluaton: { suggestions: ["evaluation"], domain: DOMAIN_GENERAL },
  evalution: { suggestions: ["evaluation"], domain: DOMAIN_GENERAL },
  experment: { suggestions: ["experiment"], domain: DOMAIN_GENERAL },
  expreiment: { suggestions: ["experiment"], domain: DOMAIN_GENERAL },
  experimant: { suggestions: ["experiment"], domain: DOMAIN_GENERAL },
  expermental: { suggestions: ["experimental"], domain: DOMAIN_GENERAL },
  experimentel: { suggestions: ["experimental"], domain: DOMAIN_GENERAL },
  feautre: { suggestions: ["feature"], domain: DOMAIN_GENERAL },
  feture: { suggestions: ["feature"], domain: DOMAIN_GENERAL },
  frequancy: { suggestions: ["frequency"], domain: DOMAIN_GENERAL },
  frequecy: { suggestions: ["frequency"], domain: DOMAIN_GENERAL },
  generlization: { suggestions: ["generalization"], domain: DOMAIN_GENERAL },
  generalizaton: { suggestions: ["generalization"], domain: DOMAIN_GENERAL },
  heirarchy: { suggestions: ["hierarchy"], domain: DOMAIN_GENERAL },
  hierachy: { suggestions: ["hierarchy"], domain: DOMAIN_GENERAL },
  heterogenous: { suggestions: ["heterogeneous"], domain: DOMAIN_GENERAL },
  heterogenious: { suggestions: ["heterogeneous"], domain: DOMAIN_GENERAL },
  homogenous: { suggestions: ["homogeneous"], domain: DOMAIN_GENERAL },
  hypotheis: { suggestions: ["hypothesis"], domain: DOMAIN_GENERAL },
  hyphothesis: { suggestions: ["hypothesis"], domain: DOMAIN_GENERAL },
  hypotesis: { suggestions: ["hypothesis"], domain: DOMAIN_GENERAL },
  identificaton: { suggestions: ["identification"], domain: DOMAIN_GENERAL },
  implementaton: { suggestions: ["implementation"], domain: DOMAIN_GENERAL },
  independant: { suggestions: ["independent"], domain: DOMAIN_GENERAL },
  independet: { suggestions: ["independent"], domain: DOMAIN_GENERAL },
  inferance: { suggestions: ["inference"], domain: DOMAIN_GENERAL },
  intepretation: { suggestions: ["interpretation"], domain: DOMAIN_GENERAL },
  interpretaton: { suggestions: ["interpretation"], domain: DOMAIN_GENERAL },
  iteraton: { suggestions: ["iteration"], domain: DOMAIN_GENERAL },
  literture: { suggestions: ["literature"], domain: DOMAIN_GENERAL },
  litrature: { suggestions: ["literature"], domain: DOMAIN_GENERAL },
  literautre: { suggestions: ["literature"], domain: DOMAIN_GENERAL },
  longtitudinal: { suggestions: ["longitudinal"], domain: DOMAIN_GENERAL },
  longitudnal: { suggestions: ["longitudinal"], domain: DOMAIN_GENERAL },
  maintenence: { suggestions: ["maintenance"], domain: DOMAIN_GENERAL },
  maintainance: { suggestions: ["maintenance"], domain: DOMAIN_GENERAL },
  mathemtical: { suggestions: ["mathematical"], domain: DOMAIN_GENERAL },
  mathmatical: { suggestions: ["mathematical"], domain: DOMAIN_GENERAL },
  measurment: { suggestions: ["measurement"], domain: DOMAIN_GENERAL },
  mesurement: { suggestions: ["measurement"], domain: DOMAIN_GENERAL },
  mechansim: { suggestions: ["mechanism"], domain: DOMAIN_GENERAL },
  mecanism: { suggestions: ["mechanism"], domain: DOMAIN_GENERAL },
  methodolgy: { suggestions: ["methodology"], domain: DOMAIN_GENERAL },
  methdology: { suggestions: ["methodology"], domain: DOMAIN_GENERAL },
  modle: { suggestions: ["model"], domain: DOMAIN_GENERAL },
  mutivariate: { suggestions: ["multivariate"], domain: DOMAIN_GENERAL },
  multivaraite: { suggestions: ["multivariate"], domain: DOMAIN_GENERAL },
  occurence: { suggestions: ["occurrence"], domain: DOMAIN_GENERAL },
  occurrance: { suggestions: ["occurrence"], domain: DOMAIN_GENERAL },
  occured: { suggestions: ["occurred"], domain: DOMAIN_GENERAL },
  optimizaton: { suggestions: ["optimization"], domain: DOMAIN_GENERAL },
  optmization: { suggestions: ["optimization"], domain: DOMAIN_GENERAL },
  paramter: { suggestions: ["parameter"], domain: DOMAIN_GENERAL },
  paramater: { suggestions: ["parameter"], domain: DOMAIN_GENERAL },
  parmeter: { suggestions: ["parameter"], domain: DOMAIN_GENERAL },
  paramters: { suggestions: ["parameters"], domain: DOMAIN_GENERAL },
  perfromance: { suggestions: ["performance"], domain: DOMAIN_GENERAL },
  perfomance: { suggestions: ["performance"], domain: DOMAIN_GENERAL },
  performace: { suggestions: ["performance"], domain: DOMAIN_GENERAL },
  phenomenom: { suggestions: ["phenomenon"], domain: DOMAIN_GENERAL },
  phenomina: { suggestions: ["phenomena"], domain: DOMAIN_GENERAL },
  prediciton: { suggestions: ["prediction"], domain: DOMAIN_GENERAL },
  predicton: { suggestions: ["prediction"], domain: DOMAIN_GENERAL },
  preduction: { suggestions: ["prediction"], domain: DOMAIN_GENERAL },
  prevalance: { suggestions: ["prevalence"], domain: DOMAIN_GENERAL },
  prevelance: { suggestions: ["prevalence"], domain: DOMAIN_GENERAL },
  probabilty: { suggestions: ["probability"], domain: DOMAIN_GENERAL },
  probablity: { suggestions: ["probability"], domain: DOMAIN_GENERAL },
  proceduer: { suggestions: ["procedure"], domain: DOMAIN_GENERAL },
  prodecure: { suggestions: ["procedure"], domain: DOMAIN_GENERAL },
  propgation: { suggestions: ["propagation"], domain: DOMAIN_GENERAL },
  qualitatve: { suggestions: ["qualitative"], domain: DOMAIN_GENERAL },
  quantitatve: { suggestions: ["quantitative"], domain: DOMAIN_GENERAL },
  quantative: { suggestions: ["quantitative"], domain: DOMAIN_GENERAL },
  questionaire: { suggestions: ["questionnaire"], domain: DOMAIN_GENERAL },
  questionnare: { suggestions: ["questionnaire"], domain: DOMAIN_GENERAL },
  randomzed: { suggestions: ["randomized"], domain: DOMAIN_GENERAL },
  reccomend: { suggestions: ["recommend"], domain: DOMAIN_GENERAL },
  recomend: { suggestions: ["recommend"], domain: DOMAIN_GENERAL },
  recogniton: { suggestions: ["recognition"], domain: DOMAIN_GENERAL },
  recogntion: { suggestions: ["recognition"], domain: DOMAIN_GENERAL },
  referance: { suggestions: ["reference"], domain: DOMAIN_GENERAL },
  refrence: { suggestions: ["reference"], domain: DOMAIN_GENERAL },
  regresion: { suggestions: ["regression"], domain: DOMAIN_GENERAL },
  regrssion: { suggestions: ["regression"], domain: DOMAIN_GENERAL },
  relavent: { suggestions: ["relevant"], domain: DOMAIN_GENERAL },
  relevent: { suggestions: ["relevant"], domain: DOMAIN_GENERAL },
  reliabilty: { suggestions: ["reliability"], domain: DOMAIN_GENERAL },
  reliablity: { suggestions: ["reliability"], domain: DOMAIN_GENERAL },
  reproducibilty: { suggestions: ["reproducibility"], domain: DOMAIN_GENERAL },
  reserach: { suggestions: ["research"], domain: DOMAIN_GENERAL },
  resarch: { suggestions: ["research"], domain: DOMAIN_GENERAL },
  reseach: { suggestions: ["research"], domain: DOMAIN_GENERAL },
  retreival: { suggestions: ["retrieval"], domain: DOMAIN_GENERAL },
  retrival: { suggestions: ["retrieval"], domain: DOMAIN_GENERAL },
  retieval: { suggestions: ["retrieval"], domain: DOMAIN_GENERAL },
  robustnes: { suggestions: ["robustness"], domain: DOMAIN_GENERAL },
  sensitivty: { suggestions: ["sensitivity"], domain: DOMAIN_GENERAL },
  sensitvity: { suggestions: ["sensitivity"], domain: DOMAIN_GENERAL },
  seperate: { suggestions: ["separate"], domain: DOMAIN_GENERAL },
  seperated: { suggestions: ["separated"], domain: DOMAIN_GENERAL },
  signficant: { suggestions: ["significant"], domain: DOMAIN_GENERAL },
  signifcant: { suggestions: ["significant"], domain: DOMAIN_GENERAL },
  siginificant: { suggestions: ["significant"], domain: DOMAIN_GENERAL },
  similarty: { suggestions: ["similarity"], domain: DOMAIN_GENERAL },
  similiarity: { suggestions: ["similarity"], domain: DOMAIN_GENERAL },
  simulaton: { suggestions: ["simulation"], domain: DOMAIN_GENERAL },
  simualtion: { suggestions: ["simulation"], domain: DOMAIN_GENERAL },
  specifcity: { suggestions: ["specificity"], domain: DOMAIN_GENERAL },
  specificty: { suggestions: ["specificity"], domain: DOMAIN_GENERAL },
  statisical: { suggestions: ["statistical"], domain: DOMAIN_GENERAL },
  statistcal: { suggestions: ["statistical"], domain: DOMAIN_GENERAL },
  statstical: { suggestions: ["statistical"], domain: DOMAIN_GENERAL },
  stratagy: { suggestions: ["strategy"], domain: DOMAIN_GENERAL },
  stategy: { suggestions: ["strategy"], domain: DOMAIN_GENERAL },
  structrual: { suggestions: ["structural"], domain: DOMAIN_GENERAL },
  strutural: { suggestions: ["structural"], domain: DOMAIN_GENERAL },
  sustainabilty: { suggestions: ["sustainability"], domain: DOMAIN_GENERAL },
  sustainablity: { suggestions: ["sustainability"], domain: DOMAIN_GENERAL },
  symetric: { suggestions: ["symmetric"], domain: DOMAIN_GENERAL },
  symetrical: { suggestions: ["symmetrical"], domain: DOMAIN_GENERAL },
  synthisis: { suggestions: ["synthesis"], domain: DOMAIN_GENERAL },
  syntheis: { suggestions: ["synthesis"], domain: DOMAIN_GENERAL },
  systemtic: { suggestions: ["systematic"], domain: DOMAIN_GENERAL },
  systmatic: { suggestions: ["systematic"], domain: DOMAIN_GENERAL },
  techinque: { suggestions: ["technique"], domain: DOMAIN_GENERAL },
  techniqe: { suggestions: ["technique"], domain: DOMAIN_GENERAL },
  tecnique: { suggestions: ["technique"], domain: DOMAIN_GENERAL },
  temprature: { suggestions: ["temperature"], domain: DOMAIN_GENERAL },
  temperture: { suggestions: ["temperature"], domain: DOMAIN_GENERAL },
  theoritical: { suggestions: ["theoretical"], domain: DOMAIN_GENERAL },
  theorectical: { suggestions: ["theoretical"], domain: DOMAIN_GENERAL },
  threshhold: { suggestions: ["threshold"], domain: DOMAIN_GENERAL },
  treshold: { suggestions: ["threshold"], domain: DOMAIN_GENERAL },
  validaton: { suggestions: ["validation"], domain: DOMAIN_GENERAL },
  valdiation: { suggestions: ["validation"], domain: DOMAIN_GENERAL },
  varible: { suggestions: ["variable"], domain: DOMAIN_GENERAL },
  varaible: { suggestions: ["variable"], domain: DOMAIN_GENERAL },
  visualizaton: { suggestions: ["visualization"], domain: DOMAIN_GENERAL },

  // CS / AI / Machine Learning
  algoritm: { suggestions: ["algorithm"], domain: DOMAIN_AI_CS },
  algorthm: { suggestions: ["algorithm"], domain: DOMAIN_AI_CS },
  algorithem: { suggestions: ["algorithm"], domain: DOMAIN_AI_CS },
  algorythm: { suggestions: ["algorithm"], domain: DOMAIN_AI_CS },
  algoritms: { suggestions: ["algorithms"], domain: DOMAIN_AI_CS },
  algorthms: { suggestions: ["algorithms"], domain: DOMAIN_AI_CS },
  artifical: { suggestions: ["artificial"], domain: DOMAIN_AI_CS },
  artficial: { suggestions: ["artificial"], domain: DOMAIN_AI_CS },
  inteligence: { suggestions: ["intelligence"], domain: DOMAIN_AI_CS },
  intellegence: { suggestions: ["intelligence"], domain: DOMAIN_AI_CS },
  machnie: { suggestions: ["machine"], domain: DOMAIN_AI_CS },
  mahcine: { suggestions: ["machine"], domain: DOMAIN_AI_CS },
  lerning: { suggestions: ["learning"], domain: DOMAIN_AI_CS },
  laerning: { suggestions: ["learning"], domain: DOMAIN_AI_CS },
  learnig: { suggestions: ["learning"], domain: DOMAIN_AI_CS },
  nueral: { suggestions: ["neural"], domain: DOMAIN_AI_CS },
  neurel: { suggestions: ["neural"], domain: DOMAIN_AI_CS },
  nural: { suggestions: ["neural"], domain: DOMAIN_AI_CS },
  netwrok: { suggestions: ["network"], domain: DOMAIN_AI_CS },
  netowrk: { suggestions: ["network"], domain: DOMAIN_AI_CS },
  netwroks: { suggestions: ["networks"], domain: DOMAIN_AI_CS },
  transfromer: { suggestions: ["transformer"], domain: DOMAIN_AI_CS },
  tranformer: { suggestions: ["transformer"], domain: DOMAIN_AI_CS },
  atention: { suggestions: ["attention"], domain: DOMAIN_AI_CS },
  attenton: { suggestions: ["attention"], domain: DOMAIN_AI_CS },
  embdedding: { suggestions: ["embedding"], domain: DOMAIN_AI_CS },
  embeding: { suggestions: ["embedding"], domain: DOMAIN_AI_CS },
  convolutonal: { suggestions: ["convolutional"], domain: DOMAIN_AI_CS },
  convolusional: { suggestions: ["convolutional"], domain: DOMAIN_AI_CS },
  reinforcment: { suggestions: ["reinforcement"], domain: DOMAIN_AI_CS },
  renforcement: { suggestions: ["reinforcement"], domain: DOMAIN_AI_CS },
  federatd: { suggestions: ["federated"], domain: DOMAIN_AI_CS },
  generatve: { suggestions: ["generative"], domain: DOMAIN_AI_CS },
  genertive: { suggestions: ["generative"], domain: DOMAIN_AI_CS },
  difusion: { suggestions: ["diffusion"], domain: DOMAIN_AI_CS },
  diffuson: { suggestions: ["diffusion"], domain: DOMAIN_AI_CS },
  tokenizaton: { suggestions: ["tokenization"], domain: DOMAIN_AI_CS },
  hallucinaton: { suggestions: ["hallucination"], domain: DOMAIN_AI_CS },
  halucination: { suggestions: ["hallucination"], domain: DOMAIN_AI_CS },
  multimodle: { suggestions: ["multimodal"], domain: DOMAIN_AI_CS },
  mutimodal: { suggestions: ["multimodal"], domain: DOMAIN_AI_CS },
  quantizaton: { suggestions: ["quantization"], domain: DOMAIN_AI_CS },
  distilaton: { suggestions: ["distillation"], domain: DOMAIN_AI_CS },
  distillaton: { suggestions: ["distillation"], domain: DOMAIN_AI_CS },
  finetunning: { suggestions: ["fine-tuning"], domain: DOMAIN_AI_CS },
  hyperparamter: { suggestions: ["hyperparameter"], domain: DOMAIN_AI_CS },
  overfiting: { suggestions: ["overfitting"], domain: DOMAIN_AI_CS },
  overftting: { suggestions: ["overfitting"], domain: DOMAIN_AI_CS },
  regularizaton: { suggestions: ["regularization"], domain: DOMAIN_AI_CS },
  backpropogation: { suggestions: ["backpropagation"], domain: DOMAIN_AI_CS },
  backpropagaton: { suggestions: ["backpropagation"], domain: DOMAIN_AI_CS },
  autogressive: { suggestions: ["autoregressive"], domain: DOMAIN_AI_CS },
  autoregresive: { suggestions: ["autoregressive"], domain: DOMAIN_AI_CS },
  sematic: { suggestions: ["semantic"], domain: DOMAIN_AI_CS },
  sematnic: { suggestions: ["semantic"], domain: DOMAIN_AI_CS },
  syntatic: { suggestions: ["syntactic"], domain: DOMAIN_AI_CS },
  ontolgy: { suggestions: ["ontology"], domain: DOMAIN_AI_CS },
  ontolgoy: { suggestions: ["ontology"], domain: DOMAIN_AI_CS },
  knowlege: { suggestions: ["knowledge"], domain: DOMAIN_AI_CS },
  konwledge: { suggestions: ["knowledge"], domain: DOMAIN_AI_CS },
  grapgh: { suggestions: ["graph"], domain: DOMAIN_AI_CS },
  clusterng: { suggestions: ["clustering"], domain: DOMAIN_AI_CS },
  clusering: { suggestions: ["clustering"], domain: DOMAIN_AI_CS },
  anomoly: { suggestions: ["anomaly"], domain: DOMAIN_AI_CS },
  anamoly: { suggestions: ["anomaly"], domain: DOMAIN_AI_CS },
  cybersecurty: { suggestions: ["cybersecurity"], domain: DOMAIN_AI_CS },
  cryptogaphy: { suggestions: ["cryptography"], domain: DOMAIN_AI_CS },
  blockchian: { suggestions: ["blockchain"], domain: DOMAIN_AI_CS },
  quantun: { suggestions: ["quantum"], domain: DOMAIN_AI_CS },
  quatum: { suggestions: ["quantum"], domain: DOMAIN_AI_CS },
  computng: { suggestions: ["computing"], domain: DOMAIN_AI_CS },
  robotcs: { suggestions: ["robotics"], domain: DOMAIN_AI_CS },
  autonomus: { suggestions: ["autonomous"], domain: DOMAIN_AI_CS },
  autonmous: { suggestions: ["autonomous"], domain: DOMAIN_AI_CS },
  segmentaton: { suggestions: ["segmentation"], domain: DOMAIN_AI_CS },
  detecton: { suggestions: ["detection"], domain: DOMAIN_AI_CS },
  localizaton: { suggestions: ["localization"], domain: DOMAIN_AI_CS },
  supervisd: { suggestions: ["supervised"], domain: DOMAIN_AI_CS },
  supervied: { suggestions: ["supervised"], domain: DOMAIN_AI_CS },
  unsupervisd: { suggestions: ["unsupervised"], domain: DOMAIN_AI_CS },
  contrastve: { suggestions: ["contrastive"], domain: DOMAIN_AI_CS },
  explainabilty: { suggestions: ["explainability"], domain: DOMAIN_AI_CS },
  explanability: { suggestions: ["explainability"], domain: DOMAIN_AI_CS },
  interpretabilty: { suggestions: ["interpretability"], domain: DOMAIN_AI_CS },
  benchmrk: { suggestions: ["benchmark"], domain: DOMAIN_AI_CS },
  architecure: { suggestions: ["architecture"], domain: DOMAIN_AI_CS },
  archtecture: { suggestions: ["architecture"], domain: DOMAIN_AI_CS },
  infrastucture: { suggestions: ["infrastructure"], domain: DOMAIN_AI_CS },
  parallell: { suggestions: ["parallel"], domain: DOMAIN_AI_CS },
  distibuted: { suggestions: ["distributed"], domain: DOMAIN_AI_CS },
  latancy: { suggestions: ["latency"], domain: DOMAIN_AI_CS },
  througput: { suggestions: ["throughput"], domain: DOMAIN_AI_CS },
  throughtput: { suggestions: ["throughput"], domain: DOMAIN_AI_CS },

  // Medicine / Biology / Healthcare
  alzhimer: { suggestions: ["Alzheimer"], domain: DOMAIN_MED_BIO },
  alzhiemer: { suggestions: ["Alzheimer"], domain: DOMAIN_MED_BIO },
  alzheimr: { suggestions: ["Alzheimer"], domain: DOMAIN_MED_BIO },
  diabeties: { suggestions: ["diabetes"], domain: DOMAIN_MED_BIO },
  diabtes: { suggestions: ["diabetes"], domain: DOMAIN_MED_BIO },
  diabetis: { suggestions: ["diabetes"], domain: DOMAIN_MED_BIO },
  retinopahy: { suggestions: ["retinopathy"], domain: DOMAIN_MED_BIO },
  retinopthy: { suggestions: ["retinopathy"], domain: DOMAIN_MED_BIO },
  carcinmoa: { suggestions: ["carcinoma"], domain: DOMAIN_MED_BIO },
  carinoma: { suggestions: ["carcinoma"], domain: DOMAIN_MED_BIO },
  oncolgy: { suggestions: ["oncology"], domain: DOMAIN_MED_BIO },
  oncoloy: { suggestions: ["oncology"], domain: DOMAIN_MED_BIO },
  immunolgy: { suggestions: ["immunology"], domain: DOMAIN_MED_BIO },
  imunology: { suggestions: ["immunology"], domain: DOMAIN_MED_BIO },
  immunothrapy: { suggestions: ["immunotherapy"], domain: DOMAIN_MED_BIO },
  immunotherpy: { suggestions: ["immunotherapy"], domain: DOMAIN_MED_BIO },
  inflamaton: { suggestions: ["inflammation"], domain: DOMAIN_MED_BIO },
  inflamation: { suggestions: ["inflammation"], domain: DOMAIN_MED_BIO },
  inflamatory: { suggestions: ["inflammatory"], domain: DOMAIN_MED_BIO },
  cardiovasclar: { suggestions: ["cardiovascular"], domain: DOMAIN_MED_BIO },
  cardiovscular: { suggestions: ["cardiovascular"], domain: DOMAIN_MED_BIO },
  hypertenson: { suggestions: ["hypertension"], domain: DOMAIN_MED_BIO },
  hypertention: { suggestions: ["hypertension"], domain: DOMAIN_MED_BIO },
  atherosclrosis: { suggestions: ["atherosclerosis"], domain: DOMAIN_MED_BIO },
  atherosclerois: { suggestions: ["atherosclerosis"], domain: DOMAIN_MED_BIO },
  neurodegeneratve: { suggestions: ["neurodegenerative"], domain: DOMAIN_MED_BIO },
  schizophernia: { suggestions: ["schizophrenia"], domain: DOMAIN_MED_BIO },
  schizoprenia: { suggestions: ["schizophrenia"], domain: DOMAIN_MED_BIO },
  depresion: { suggestions: ["depression"], domain: DOMAIN_MED_BIO },
  depresson: { suggestions: ["depression"], domain: DOMAIN_MED_BIO },
  parkison: { suggestions: ["Parkinson"], domain: DOMAIN_MED_BIO },
  epidemology: { suggestions: ["epidemiology"], domain: DOMAIN_MED_BIO },
  epidemiolgy: { suggestions: ["epidemiology"], domain: DOMAIN_MED_BIO },
  patholgy: { suggestions: ["pathology"], domain: DOMAIN_MED_BIO },
  patholoy: { suggestions: ["pathology"], domain: DOMAIN_MED_BIO },
  pharmacolgy: { suggestions: ["pharmacology"], domain: DOMAIN_MED_BIO },
  theraputic: { suggestions: ["therapeutic"], domain: DOMAIN_MED_BIO },
  therapeuthic: { suggestions: ["therapeutic"], domain: DOMAIN_MED_BIO },
  biomarkr: { suggestions: ["biomarker"], domain: DOMAIN_MED_BIO },
  biomaker: { suggestions: ["biomarker"], domain: DOMAIN_MED_BIO },
  genomcs: { suggestions: ["genomics"], domain: DOMAIN_MED_BIO },
  geonomics: { suggestions: ["genomics"], domain: DOMAIN_MED_BIO },
  proteomcs: { suggestions: ["proteomics"], domain: DOMAIN_MED_BIO },
  transcriptomcs: { suggestions: ["transcriptomics"], domain: DOMAIN_MED_BIO },
  metabolomcs: { suggestions: ["metabolomics"], domain: DOMAIN_MED_BIO },
  bioinformatcs: { suggestions: ["bioinformatics"], domain: DOMAIN_MED_BIO },
  microbome: { suggestions: ["microbiome"], domain: DOMAIN_MED_BIO },
  microbime: { suggestions: ["microbiome"], domain: DOMAIN_MED_BIO },
  mitocondria: { suggestions: ["mitochondria"], domain: DOMAIN_MED_BIO },
  mitochondia: { suggestions: ["mitochondria"], domain: DOMAIN_MED_BIO },
  apoptoiss: { suggestions: ["apoptosis"], domain: DOMAIN_MED_BIO },
  apopotosis: { suggestions: ["apoptosis"], domain: DOMAIN_MED_BIO },
  angiogensis: { suggestions: ["angiogenesis"], domain: DOMAIN_MED_BIO },
  metastsis: { suggestions: ["metastasis"], domain: DOMAIN_MED_BIO },
  metastais: { suggestions: ["metastasis"], domain: DOMAIN_MED_BIO },
  chemotherpy: { suggestions: ["chemotherapy"], domain: DOMAIN_MED_BIO },
  radiotherpy: { suggestions: ["radiotherapy"], domain: DOMAIN_MED_BIO },
  radiolgy: { suggestions: ["radiology"], domain: DOMAIN_MED_BIO },
  tomogaphy: { suggestions: ["tomography"], domain: DOMAIN_MED_BIO },
  tomograpy: { suggestions: ["tomography"], domain: DOMAIN_MED_BIO },
  ultrasond: { suggestions: ["ultrasound"], domain: DOMAIN_MED_BIO },
  hemorhage: { suggestions: ["hemorrhage"], domain: DOMAIN_MED_BIO },
  diarhea: { suggestions: ["diarrhea"], domain: DOMAIN_MED_BIO },
  pnuemonia: { suggestions: ["pneumonia"], domain: DOMAIN_MED_BIO },
  pneumona: { suggestions: ["pneumonia"], domain: DOMAIN_MED_BIO },
  asthama: { suggestions: ["asthma"], domain: DOMAIN_MED_BIO },
  anestesia: { suggestions: ["anesthesia"], domain: DOMAIN_MED_BIO },
  syndrom: { suggestions: ["syndrome"], domain: DOMAIN_MED_BIO },
  syndorme: { suggestions: ["syndrome"], domain: DOMAIN_MED_BIO },
  sympton: { suggestions: ["symptom"], domain: DOMAIN_MED_BIO },
  symtom: { suggestions: ["symptom"], domain: DOMAIN_MED_BIO },
  prognsis: { suggestions: ["prognosis"], domain: DOMAIN_MED_BIO },
  prognosys: { suggestions: ["prognosis"], domain: DOMAIN_MED_BIO },
  diagnoisis: { suggestions: ["diagnosis"], domain: DOMAIN_MED_BIO },
  diagnossis: { suggestions: ["diagnosis"], domain: DOMAIN_MED_BIO },
  diagnositc: { suggestions: ["diagnostic"], domain: DOMAIN_MED_BIO },
  diagostic: { suggestions: ["diagnostic"], domain: DOMAIN_MED_BIO },
  treatement: { suggestions: ["treatment"], domain: DOMAIN_MED_BIO },
  tratment: { suggestions: ["treatment"], domain: DOMAIN_MED_BIO },
  clinial: { suggestions: ["clinical"], domain: DOMAIN_MED_BIO },
  clincal: { suggestions: ["clinical"], domain: DOMAIN_MED_BIO },
  patinet: { suggestions: ["patient"], domain: DOMAIN_MED_BIO },
  pateint: { suggestions: ["patient"], domain: DOMAIN_MED_BIO },
  mortalilty: { suggestions: ["mortality"], domain: DOMAIN_MED_BIO },
  mortalty: { suggestions: ["mortality"], domain: DOMAIN_MED_BIO },
  morbidty: { suggestions: ["morbidity"], domain: DOMAIN_MED_BIO },
  vacine: { suggestions: ["vaccine"], domain: DOMAIN_MED_BIO },
  vaccin: { suggestions: ["vaccine"], domain: DOMAIN_MED_BIO },
  antiboitic: { suggestions: ["antibiotic"], domain: DOMAIN_MED_BIO },
  antibotic: { suggestions: ["antibiotic"], domain: DOMAIN_MED_BIO },
  resistence: { suggestions: ["resistance"], domain: DOMAIN_MED_BIO },
  resistnce: { suggestions: ["resistance"], domain: DOMAIN_MED_BIO },
  reaceptor: { suggestions: ["receptor"], domain: DOMAIN_MED_BIO },
  recptor: { suggestions: ["receptor"], domain: DOMAIN_MED_BIO },
  protien: { suggestions: ["protein"], domain: DOMAIN_MED_BIO },
  protiens: { suggestions: ["proteins"], domain: DOMAIN_MED_BIO },
  enzime: { suggestions: ["enzyme"], domain: DOMAIN_MED_BIO },
  ensyme: { suggestions: ["enzyme"], domain: DOMAIN_MED_BIO },
  chromosme: { suggestions: ["chromosome"], domain: DOMAIN_MED_BIO },
  mutaton: { suggestions: ["mutation"], domain: DOMAIN_MED_BIO },
  sequencng: { suggestions: ["sequencing"], domain: DOMAIN_MED_BIO },
  epigenetcs: { suggestions: ["epigenetics"], domain: DOMAIN_MED_BIO },
  cytokne: { suggestions: ["cytokine"], domain: DOMAIN_MED_BIO },
  antbody: { suggestions: ["antibody"], domain: DOMAIN_MED_BIO },
  homeostsis: { suggestions: ["homeostasis"], domain: DOMAIN_MED_BIO },
  neuroplasticty: { suggestions: ["neuroplasticity"], domain: DOMAIN_MED_BIO },
  ophthalmogy: { suggestions: ["ophthalmology"], domain: DOMAIN_MED_BIO },
  opthalmolgy: { suggestions: ["ophthalmology"], domain: DOMAIN_MED_BIO },
  opthalmology: { suggestions: ["ophthalmology"], domain: DOMAIN_MED_BIO },
  dermatolgy: { suggestions: ["dermatology"], domain: DOMAIN_MED_BIO },
  gastroenterolgy: { suggestions: ["gastroenterology"], domain: DOMAIN_MED_BIO },
  endocrinolgy: { suggestions: ["endocrinology"], domain: DOMAIN_MED_BIO },
  psychiaty: { suggestions: ["psychiatry"], domain: DOMAIN_MED_BIO },
  pediatrcs: { suggestions: ["pediatrics"], domain: DOMAIN_MED_BIO },
  orthopedcs: { suggestions: ["orthopedics"], domain: DOMAIN_MED_BIO },

  // Physics / Chemistry / Materials / Engineering / Environment
  graphen: { suggestions: ["graphene"], domain: DOMAIN_ENG_MAT },
  grapheen: { suggestions: ["graphene"], domain: DOMAIN_ENG_MAT },
  perovskte: { suggestions: ["perovskite"], domain: DOMAIN_ENG_MAT },
  pervoskite: { suggestions: ["perovskite"], domain: DOMAIN_ENG_MAT },
  nanomatrial: { suggestions: ["nanomaterial"], domain: DOMAIN_ENG_MAT },
  nanomaterail: { suggestions: ["nanomaterial"], domain: DOMAIN_ENG_MAT },
  nanopartcle: { suggestions: ["nanoparticle"], domain: DOMAIN_ENG_MAT },
  nanoparticel: { suggestions: ["nanoparticle"], domain: DOMAIN_ENG_MAT },
  cataylst: { suggestions: ["catalyst"], domain: DOMAIN_ENG_MAT },
  catalist: { suggestions: ["catalyst"], domain: DOMAIN_ENG_MAT },
  photocatalysys: { suggestions: ["photocatalysis"], domain: DOMAIN_ENG_MAT },
  electrochemcal: { suggestions: ["electrochemical"], domain: DOMAIN_ENG_MAT },
  thermodynamcs: { suggestions: ["thermodynamics"], domain: DOMAIN_ENG_MAT },
  aerodynamcs: { suggestions: ["aerodynamics"], domain: DOMAIN_ENG_MAT },
  hydrodynamcs: { suggestions: ["hydrodynamics"], domain: DOMAIN_ENG_MAT },
  spectrosopy: { suggestions: ["spectroscopy"], domain: DOMAIN_ENG_MAT },
  spectrscopy: { suggestions: ["spectroscopy"], domain: DOMAIN_ENG_MAT },
  microscpy: { suggestions: ["microscopy"], domain: DOMAIN_ENG_MAT },
  micoscopy: { suggestions: ["microscopy"], domain: DOMAIN_ENG_MAT },
  diffracton: { suggestions: ["diffraction"], domain: DOMAIN_ENG_MAT },
  flourescence: { suggestions: ["fluorescence"], domain: DOMAIN_ENG_MAT },
  fluoresence: { suggestions: ["fluorescence"], domain: DOMAIN_ENG_MAT },
  luminesence: { suggestions: ["luminescence"], domain: DOMAIN_ENG_MAT },
  semiconductr: { suggestions: ["semiconductor"], domain: DOMAIN_ENG_MAT },
  superconductr: { suggestions: ["superconductor"], domain: DOMAIN_ENG_MAT },
  photovoltac: { suggestions: ["photovoltaic"], domain: DOMAIN_ENG_MAT },
  lithum: { suggestions: ["lithium"], domain: DOMAIN_ENG_MAT },
  litium: { suggestions: ["lithium"], domain: DOMAIN_ENG_MAT },
  electrolyt: { suggestions: ["electrolyte"], domain: DOMAIN_ENG_MAT },
  polyemer: { suggestions: ["polymer"], domain: DOMAIN_ENG_MAT },
  polmer: { suggestions: ["polymer"], domain: DOMAIN_ENG_MAT },
  compostie: { suggestions: ["composite"], domain: DOMAIN_ENG_MAT },
  cristalline: { suggestions: ["crystalline"], domain: DOMAIN_ENG_MAT },
  crystaline: { suggestions: ["crystalline"], domain: DOMAIN_ENG_MAT },
  amorpous: { suggestions: ["amorphous"], domain: DOMAIN_ENG_MAT },
  adsorbtion: { suggestions: ["adsorption"], domain: DOMAIN_ENG_MAT },
  absorbtion: { suggestions: ["absorption"], domain: DOMAIN_ENG_MAT },
  desorbtion: { suggestions: ["desorption"], domain: DOMAIN_ENG_MAT },
  oxdation: { suggestions: ["oxidation"], domain: DOMAIN_ENG_MAT },
  oxidaton: { suggestions: ["oxidation"], domain: DOMAIN_ENG_MAT },
  corosion: { suggestions: ["corrosion"], domain: DOMAIN_ENG_MAT },
  corrossion: { suggestions: ["corrosion"], domain: DOMAIN_ENG_MAT },
  viscocity: { suggestions: ["viscosity"], domain: DOMAIN_ENG_MAT },
  elasticty: { suggestions: ["elasticity"], domain: DOMAIN_ENG_MAT },
  conductivty: { suggestions: ["conductivity"], domain: DOMAIN_ENG_MAT },
  permeabilty: { suggestions: ["permeability"], domain: DOMAIN_ENG_MAT },
  durabilty: { suggestions: ["durability"], domain: DOMAIN_ENG_MAT },
  biodegradble: { suggestions: ["biodegradable"], domain: DOMAIN_ENG_MAT },
  microplastcs: { suggestions: ["microplastics"], domain: DOMAIN_ENG_MAT },
  decarbonizaton: { suggestions: ["decarbonization"], domain: DOMAIN_ENG_MAT },
  sequestraton: { suggestions: ["sequestration"], domain: DOMAIN_ENG_MAT },
  biodiversty: { suggestions: ["biodiversity"], domain: DOMAIN_ENG_MAT },
  ecosytem: { suggestions: ["ecosystem"], domain: DOMAIN_ENG_MAT },
  climatolgy: { suggestions: ["climatology"], domain: DOMAIN_ENG_MAT },
  meteorolgy: { suggestions: ["meteorology"], domain: DOMAIN_ENG_MAT },
  seismolgy: { suggestions: ["seismology"], domain: DOMAIN_ENG_MAT },
  astronmy: { suggestions: ["astronomy"], domain: DOMAIN_ENG_MAT },
  relativty: { suggestions: ["relativity"], domain: DOMAIN_ENG_MAT },
  entanglment: { suggestions: ["entanglement"], domain: DOMAIN_ENG_MAT },

  // Social Sciences / Economics / Finance / Education / Management
  economcs: { suggestions: ["economics"], domain: DOMAIN_SOC_ECON },
  macroeconomcs: { suggestions: ["macroeconomics"], domain: DOMAIN_SOC_ECON },
  microeconomcs: { suggestions: ["microeconomics"], domain: DOMAIN_SOC_ECON },
  econometrcs: { suggestions: ["econometrics"], domain: DOMAIN_SOC_ECON },
  finanical: { suggestions: ["financial"], domain: DOMAIN_SOC_ECON },
  finacial: { suggestions: ["financial"], domain: DOMAIN_SOC_ECON },
  governace: { suggestions: ["governance"], domain: DOMAIN_SOC_ECON },
  goverance: { suggestions: ["governance"], domain: DOMAIN_SOC_ECON },
  entreprenuer: { suggestions: ["entrepreneur"], domain: DOMAIN_SOC_ECON },
  entrepeneur: { suggestions: ["entrepreneur"], domain: DOMAIN_SOC_ECON },
  entreprenuership: { suggestions: ["entrepreneurship"], domain: DOMAIN_SOC_ECON },
  inovation: { suggestions: ["innovation"], domain: DOMAIN_SOC_ECON },
  innovaton: { suggestions: ["innovation"], domain: DOMAIN_SOC_ECON },
  organzation: { suggestions: ["organization"], domain: DOMAIN_SOC_ECON },
  organisaton: { suggestions: ["organisation", "organization"], domain: DOMAIN_SOC_ECON },
  managment: { suggestions: ["management"], domain: DOMAIN_SOC_ECON },
  mangement: { suggestions: ["management"], domain: DOMAIN_SOC_ECON },
  leaderhsip: { suggestions: ["leadership"], domain: DOMAIN_SOC_ECON },
  behavorial: { suggestions: ["behavioral"], domain: DOMAIN_SOC_ECON },
  behavourial: { suggestions: ["behavioural", "behavioral"], domain: DOMAIN_SOC_ECON },
  psycology: { suggestions: ["psychology"], domain: DOMAIN_SOC_ECON },
  pyschology: { suggestions: ["psychology"], domain: DOMAIN_SOC_ECON },
  sociolgy: { suggestions: ["sociology"], domain: DOMAIN_SOC_ECON },
  anthropolgy: { suggestions: ["anthropology"], domain: DOMAIN_SOC_ECON },
  pedagoy: { suggestions: ["pedagogy"], domain: DOMAIN_SOC_ECON },
  pedagody: { suggestions: ["pedagogy"], domain: DOMAIN_SOC_ECON },
  curiculum: { suggestions: ["curriculum"], domain: DOMAIN_SOC_ECON },
  curriculm: { suggestions: ["curriculum"], domain: DOMAIN_SOC_ECON },
  engagment: { suggestions: ["engagement"], domain: DOMAIN_SOC_ECON },
  motivaton: { suggestions: ["motivation"], domain: DOMAIN_SOC_ECON },
  cognitve: { suggestions: ["cognitive"], domain: DOMAIN_SOC_ECON },
  congitive: { suggestions: ["cognitive"], domain: DOMAIN_SOC_ECON },
  metacogniton: { suggestions: ["metacognition"], domain: DOMAIN_SOC_ECON },
  demographc: { suggestions: ["demographic"], domain: DOMAIN_SOC_ECON },
  socioeconomc: { suggestions: ["socioeconomic"], domain: DOMAIN_SOC_ECON },
  inequalty: { suggestions: ["inequality"], domain: DOMAIN_SOC_ECON },
  urbanizaton: { suggestions: ["urbanization"], domain: DOMAIN_SOC_ECON },
  globalizaton: { suggestions: ["globalization"], domain: DOMAIN_SOC_ECON },
  regulatry: { suggestions: ["regulatory"], domain: DOMAIN_SOC_ECON },
  stakeholdr: { suggestions: ["stakeholder"], domain: DOMAIN_SOC_ECON },
  logistcs: { suggestions: ["logistics"], domain: DOMAIN_SOC_ECON }
};

/**
 * Common Chinese academic spelling / confused-character errors.
 * Ordered longest-first at scan time to avoid partial overlap collisions.
 */
const ACADEMIC_ZH_TYPOS: Record<string, TypoEntry> = {
  "大语言模行": { suggestions: ["大语言模型"], domain: DOMAIN_AI_CS },
  "多莫态": { suggestions: ["多模态"], domain: DOMAIN_AI_CS },
  "神经网路": { suggestions: ["神经网络"], domain: DOMAIN_AI_CS },
  "深度学系": { suggestions: ["深度学习"], domain: DOMAIN_AI_CS },
  "强化学系": { suggestions: ["强化学习"], domain: DOMAIN_AI_CS },
  "迁移学系": { suggestions: ["迁移学习"], domain: DOMAIN_AI_CS },
  "联帮学习": { suggestions: ["联邦学习"], domain: DOMAIN_AI_CS },
  "知识图普": { suggestions: ["知识图谱"], domain: DOMAIN_AI_CS },
  "算法优话": { suggestions: ["算法优化"], domain: DOMAIN_AI_CS },
  "检索引琴": { suggestions: ["检索引擎"], domain: DOMAIN_AI_CS },
  "区块连": { suggestions: ["区块链"], domain: DOMAIN_AI_CS },
  "量子计祘": { suggestions: ["量子计算"], domain: DOMAIN_AI_CS },
  "图像分害": { suggestions: ["图像分割"], domain: DOMAIN_AI_CS },
  "召回律": { suggestions: ["召回率"], domain: DOMAIN_GENERAL },
  "准确律": { suggestions: ["准确率"], domain: DOMAIN_GENERAL },
  "文献综诉": { suggestions: ["文献综述"], domain: DOMAIN_GENERAL },
  "综诉": { suggestions: ["综述"], domain: DOMAIN_GENERAL },
  "荟翠分析": { suggestions: ["荟萃分析"], domain: DOMAIN_GENERAL },
  "实政研究": { suggestions: ["实证研究"], domain: DOMAIN_GENERAL },
  "回归分折": { suggestions: ["回归分析"], domain: DOMAIN_GENERAL },
  "聚累分析": { suggestions: ["聚类分析"], domain: DOMAIN_GENERAL },
  "统记学": { suggestions: ["统计学"], domain: DOMAIN_GENERAL },
  "随机对照实险": { suggestions: ["随机对照实验", "随机对照试验"], domain: DOMAIN_MED_BIO },
  "实险": { suggestions: ["实验"], domain: DOMAIN_GENERAL },
  "阀值": { suggestions: ["阈值"], domain: DOMAIN_GENERAL, reasonZh: "学术规范用词应为「阈值」，误写为「阀值」易导致漏检", reasonEn: "Standard academic Chinese uses 阈值 (threshold) rather than 阀值" },
  "显箸": { suggestions: ["显著"], domain: DOMAIN_GENERAL },
  "拟和": { suggestions: ["拟合"], domain: DOMAIN_GENERAL },
  "视网膜病便": { suggestions: ["视网膜病变"], domain: DOMAIN_MED_BIO },
  "糖尿并": { suggestions: ["糖尿病"], domain: DOMAIN_MED_BIO },
  "动脉粥样硬话": { suggestions: ["动脉粥样硬化"], domain: DOMAIN_MED_BIO },
  "代谢综合症": { suggestions: ["代谢综合征"], domain: DOMAIN_MED_BIO, reasonZh: "医学规范术语应为「代谢综合征」，避免使用「综合症」导致漏检", reasonEn: "Standard medical terminology uses 综合征 (syndrome)" },
  "阿茨海默": { suggestions: ["阿尔茨海默"], domain: DOMAIN_MED_BIO },
  "帕金森并": { suggestions: ["帕金森病"], domain: DOMAIN_MED_BIO },
  "冠心并": { suggestions: ["冠心病"], domain: DOMAIN_MED_BIO },
  "高血亚": { suggestions: ["高血压"], domain: DOMAIN_MED_BIO },
  "免役治疗": { suggestions: ["免疫治疗"], domain: DOMAIN_MED_BIO },
  "免役": { suggestions: ["免疫"], domain: DOMAIN_MED_BIO },
  "肿留": { suggestions: ["肿瘤"], domain: DOMAIN_MED_BIO },
  "抗生数": { suggestions: ["抗生素"], domain: DOMAIN_MED_BIO },
  "炎正": { suggestions: ["炎症"], domain: DOMAIN_MED_BIO },
  "基因表答": { suggestions: ["基因表达"], domain: DOMAIN_MED_BIO },
  "蛋白值": { suggestions: ["蛋白质"], domain: DOMAIN_MED_BIO },
  "细胞凋王": { suggestions: ["细胞凋亡"], domain: DOMAIN_MED_BIO },
  "氧化应机": { suggestions: ["氧化应激"], domain: DOMAIN_MED_BIO },
  "肠道菌裙": { suggestions: ["肠道菌群"], domain: DOMAIN_MED_BIO },
  "循正医学": { suggestions: ["循证医学"], domain: DOMAIN_MED_BIO },
  "临川": { suggestions: ["临床"], domain: DOMAIN_MED_BIO },
  "纳米材科": { suggestions: ["纳米材料"], domain: DOMAIN_ENG_MAT },
  "石墨希": { suggestions: ["石墨烯"], domain: DOMAIN_ENG_MAT },
  "钙钛扩": { suggestions: ["钙钛矿"], domain: DOMAIN_ENG_MAT },
  "催话剂": { suggestions: ["催化剂"], domain: DOMAIN_ENG_MAT },
  "催化计": { suggestions: ["催化剂"], domain: DOMAIN_ENG_MAT },
  "锂离子电驰": { suggestions: ["锂离子电池"], domain: DOMAIN_ENG_MAT },
  "氢燃科": { suggestions: ["氢燃料"], domain: DOMAIN_ENG_MAT },
  "碳捕及": { suggestions: ["碳捕集"], domain: DOMAIN_ENG_MAT },
  "光合做用": { suggestions: ["光合作用"], domain: DOMAIN_ENG_MAT },
  "传惑器": { suggestions: ["传感器"], domain: DOMAIN_ENG_MAT }
};

const SORTED_ZH_TYPO_KEYS = Object.keys(ACADEMIC_ZH_TYPOS).sort((a, b) => b.length - a.length);

/**
 * Canonical academic vocabulary for bounded fuzzy matching AND valid-word whitelisting.
 * Includes both American and British valid spellings so regional variants are never flagged.
 */
const CANONICAL_ACADEMIC_WORDS: string[] = [
  // General research & statistics
  "abstract", "academic", "accommodate", "accuracy", "accurate", "achieve", "achievement",
  "acquisition", "adaptation", "adaptive", "aggregation", "allocation", "alternative",
  "ambiguity", "analysis", "analytical", "analyze", "analyse", "annotation", "application",
  "approach", "appropriate", "approximate", "approximation", "assessment", "association",
  "assumption", "asymmetry", "attribute", "augmentation", "authentic", "automatic",
  "automation", "availability", "baseline", "bayesian", "behavior", "behaviour", "behavioral",
  "behavioural", "benchmark", "bibliography", "bilingual", "boolean", "boundary", "calibration",
  "capability", "capacity", "categorical", "category", "causality", "causal", "characteristic",
  "characterization", "characterisation", "citation", "classification", "classifier", "clinical",
  "cluster", "clustering", "coefficient", "cognition", "cognitive", "coherence", "cohort",
  "collaboration", "collaborative", "collection", "combination", "comparative", "comparison",
  "compatibility", "complexity", "component", "comprehensive", "computation", "computational",
  "concept", "conceptual", "conclusion", "conditional", "confidence", "configuration",
  "consistency", "consistent", "constraint", "construction", "contemporary", "contextual",
  "continuous", "contribution", "control", "convergence", "correlation", "covariance",
  "coverage", "criteria", "criterion", "critical", "cross-sectional", "dataset", "decision",
  "decomposition", "definition", "definitely", "degradation", "demographic", "demonstration",
  "dependency", "dependent", "deployment", "derivation", "descriptive", "detection",
  "determinant", "determination", "deterministic", "development", "deviation", "diagnostic",
  "differential", "dimension", "dimensional", "dimensionality", "discovery", "discrete",
  "discrimination", "discussion", "distribution", "divergence", "diversity", "document",
  "documentation", "domain", "dynamic", "dynamics", "effectiveness", "efficacy", "efficiency",
  "efficient", "empirical", "encoding", "enhancement", "enterprise", "entropy", "environment",
  "environmental", "equilibrium", "equivalence", "error", "estimation", "estimator", "ethical",
  "ethics", "evaluation", "evidence", "evolution", "evolutionary", "examination", "execution",
  "experiment", "experimental", "explainability", "explanation", "exploration", "exploratory",
  "exponential", "expression", "extension", "extraction", "factor", "feasibility", "feature",
  "feedback", "filtering", "flexibility", "flexible", "forecasting", "formulation", "foundation",
  "framework", "frequency", "function", "functional", "fundamental", "generalization",
  "generalisation", "generation", "generative", "geometric", "geometry", "gradient", "granularity",
  "graphical", "grounding", "guidance", "guideline", "heterogeneity", "heterogeneous",
  "heuristic", "hierarchical", "hierarchy", "histogram", "historical", "homogeneity",
  "homogeneous", "hybrid", "hypothesis", "identification", "identity", "illustration",
  "implementation", "implication", "improvement", "incidence", "inclusion", "independent",
  "indicator", "inference", "information", "infrastructure", "initialization", "initialisation",
  "innovation", "innovative", "inspection", "instability", "integration", "integrity",
  "intellectual", "intelligence", "intelligent", "intensity", "interaction", "interactive",
  "interdisciplinary", "interface", "interference", "intermediate", "interpretation",
  "interpretability", "intervention", "interview", "introduction", "invariance", "invariant",
  "investigation", "iteration", "iterative", "journal", "judgment", "judgement", "kernel",
  "keyword", "knowledge", "laboratory", "landscape", "language", "latency", "latent",
  "learning", "leverage", "likelihood", "limitation", "linear", "linguistic", "literature",
  "localization", "localisation", "logarithmic", "logical", "logistics", "longitudinal",
  "machine", "magnitude", "maintenance", "management", "manipulation", "mapping", "marginal",
  "mathematical", "mathematics", "matrix", "maximum", "measurement", "mechanism", "mediation",
  "methodology", "metric", "migration", "minimization", "minimisation", "minimum", "mitigation",
  "mobility", "modality", "model", "modeling", "modelling", "modification", "modulation",
  "monitoring", "monte", "motivation", "multidimensional", "multidisciplinary", "multilingual",
  "multimodal", "multiple", "multivariate", "narrative", "natural", "navigation", "negative",
  "neighborhood", "neighbourhood", "network", "networking", "neutral", "nonlinear", "normal",
  "normalization", "normalisation", "notation", "novelty", "numerical", "objective",
  "observation", "observational", "occurrence", "occurred", "ontology", "operation",
  "operational", "operator", "optimal", "optimization", "optimisation", "ordinal",
  "organization", "organisation", "organizational", "organisational", "orientation", "original",
  "orthogonal", "outcome", "outlier", "output", "overall", "overview", "paradigm", "parallel",
  "parameter", "parameters", "parametric", "partial", "participant", "participation",
  "partition", "pattern", "pedagogy", "perception", "percentile", "performance", "periodic",
  "permeability", "persistence", "perspective", "perturbation", "phenomena", "phenomenon",
  "philosophy", "pipeline", "planning", "platform", "policy", "polynomial", "population",
  "portfolio", "positive", "posterior", "potential", "practical", "practice", "practise",
  "precision", "prediction", "predictive", "predictor", "preference", "preliminary",
  "prevalence", "prevention", "primary", "principal", "principle", "prioritization",
  "probability", "probabilistic", "problem", "procedure", "process", "processing", "production",
  "productivity", "profile", "programming", "projection", "propagation", "property",
  "proportion", "proposal", "protocol", "prototype", "provenance", "proximity", "publication",
  "qualitative", "quality", "quantification", "quantitative", "quantity", "quantum", "query",
  "questionnaire", "random", "randomization", "randomisation", "randomized", "randomised",
  "ranking", "rational", "reaction", "reasoning", "recall", "recognition", "recommendation",
  "reconstruction", "recovery", "recruitment", "recurrent", "recursive", "reduction",
  "redundancy", "reference", "refinement", "reflection", "regional", "regression", "regular",
  "regularization", "regularisation", "regulation", "regulatory", "reinforcement", "relation",
  "relational", "relationship", "relative", "relevance", "relevant", "reliability", "reliable",
  "replication", "representation", "reproducibility", "reproducible", "requirement", "research",
  "researcher", "residual", "resilience", "resolution", "resource", "response", "retrieval",
  "retrospective", "review", "robust", "robustness", "routing", "sample", "sampling",
  "scalability", "scalable", "scenario", "scheduling", "schema", "scientific", "screening",
  "search", "searching", "secondary", "security", "segmentation", "selection", "selective",
  "semantic", "semantics", "sensitivity", "sensor", "separate", "separated", "separation",
  "sequence", "sequencing", "sequential", "service", "significance", "significant", "similarity",
  "simulation", "simultaneous", "singular", "situation", "skepticism", "scepticism", "software",
  "solution", "source", "spatial", "spatiotemporal", "specialization", "specialisation",
  "specific", "specification", "specificity", "spectral", "spectrum", "stability", "standard",
  "standardization", "standardisation", "state", "static", "stationary", "statistic",
  "statistical", "statistics", "stochastic", "storage", "strategic", "strategy", "stratification",
  "streaming", "strength", "structural", "structure", "student", "study", "subjective",
  "submission", "substitution", "substrate", "summary", "summarization", "summarisation",
  "supervised", "supervision", "supplement", "supplementary", "supply", "support", "surface",
  "surveillance", "survey", "survival", "sustainability", "sustainable", "symbolic", "symmetric",
  "symmetrical", "symmetry", "synchronization", "synchronisation", "synergy", "syntactic",
  "syntax", "synthesis", "synthesize", "synthesise", "synthetic", "system", "systematic",
  "systemic", "taxonomy", "technical", "technique", "technological", "technology", "temperature",
  "template", "temporal", "tensor", "terminology", "testing", "textual", "theorem",
  "theoretical", "theory", "thermal", "threshold", "throughput", "timeline", "token",
  "tokenization", "tokenisation", "tolerance", "topology", "trajectory", "transaction",
  "transcription", "transfer", "transformation", "transformer", "transition", "translation",
  "transmission", "transparency", "transparent", "transport", "transportation", "treatment",
  "triangulation", "uncertainty", "underlying", "understanding", "uniform", "universal",
  "unsupervised", "usability", "utilization", "utilisation", "validation", "validity",
  "variability", "variable", "variance", "variant", "variation", "vector", "verification",
  "version", "vertical", "virtual", "visibility", "vision", "visual", "visualization",
  "visualisation", "vocabulary", "volatility", "volume", "vulnerability", "weighting",
  "workflow", "workload",

  // CS / AI specific
  "algorithm", "algorithms", "algorithmic", "anomaly", "architecture", "artificial",
  "attention", "autoencoder", "autonomous", "autoregressive", "backpropagation", "bandwidth",
  "blockchain", "chatbot", "cloud", "compiler", "compression", "computing", "concurrency",
  "convolutional", "cryptography", "cybersecurity", "database", "debugging", "decoder",
  "denoising", "diffusion", "digital", "distillation", "distributed", "embedding", "embeddings",
  "encoder", "encryption", "ensemble", "federated", "fine-tuning", "finetuning", "firmware",
  "forecast", "graph", "hallucination", "hardware", "hyperparameter", "hyperparameters",
  "indexing", "interface", "internet", "interpretable", "latency", "layer", "layers",
  "llm", "llms", "malware", "memory", "metadata", "microservice", "microservices", "middleware",
  "multitask", "neural", "neuron", "neurons", "overfitting", "parallelism", "perceptron",
  "personalization", "personalisation", "phishing", "pixel", "pretraining", "privacy",
  "prompt", "prompting", "pruning", "quantization", "quantisation", "rag", "recommender",
  "robotics", "robot", "robots", "runtime", "scalable", "self-supervised", "semi-supervised",
  "sentiment", "server", "serverless", "simulation", "sparse", "speech", "summarizer",
  "telemetry", "tokenizer", "transformer", "transformers", "underfitting", "unstructured",
  "vision", "wearable", "wireless", "zero-shot", "few-shot",

  // Medicine / Biology / Healthcare
  "adipose", "adolescent", "adverse", "aetiology", "etiology", "aging", "ageing", "allergy",
  "alzheimer", "alzheimers", "anaesthesia", "anesthesia", "anatomy", "anemia", "anaemia",
  "angiogenesis", "antibiotic", "antibiotics", "antibody", "antibodies", "antigen", "anxiety",
  "apoptosis", "arrhythmia", "arterial", "arthritis", "asthma", "atherosclerosis", "autism",
  "autoimmune", "bacteria", "bacterial", "benign", "biochemical", "biochemistry",
  "biocompatible", "bioinformatics", "biological", "biology", "biomarker", "biomarkers",
  "biomechanical", "biomedical", "biopsy", "biosensor", "biotechnology", "blood", "bone",
  "brain", "breast", "cancer", "cardiac", "cardiology", "cardiovascular", "carcinoma",
  "cellular", "cerebral", "chemotherapy", "chronic", "circulation", "circulatory", "cirrhosis",
  "clinic", "clinical", "clinician", "coagulation", "cognition", "colorectal", "comorbidity",
  "congenital", "coronary", "cortex", "cortical", "covid", "crispr", "cytokine", "cytokines",
  "cytoplasm", "dementia", "dental", "depression", "dermatology", "diabetes", "diabetic",
  "diagnose", "diagnosis", "diagnoses", "diagnostic", "diagnostics", "dialysis", "diarrhea",
  "diarrhoea", "dietary", "digestive", "disease", "diseases", "disorder", "disorders",
  "dosage", "drug", "drugs", "echocardiography", "edema", "oedema", "electrocardiogram",
  "electroencephalography", "embryonic", "endocrine", "endocrinology", "endoscopy",
  "endothelial", "enzyme", "enzymes", "epidemic", "epidemiology", "epidemiological",
  "epigenetic", "epigenetics", "epilepsy", "epithelial", "erythrocyte", "esophagus",
  "oesophagus", "extracellular", "fatigue", "fetal", "foetal", "fibrosis", "fracture",
  "fundus", "gastric", "gastroenterology", "gastrointestinal", "gene", "genes", "genetic",
  "genetics", "genome", "genomic", "genomics", "geriatric", "glaucoma", "glioma", "glucose",
  "gut", "gynecology", "gynaecology", "hematology", "haematology", "hemoglobin", "haemoglobin",
  "hemorrhage", "haemorrhage", "hepatic", "hepatitis", "hereditary", "histology",
  "histopathology", "homeostasis", "hormone", "hormonal", "hospital", "hypertension",
  "hypoxia", "imaging", "immune", "immunity", "immunization", "immunisation", "immunology",
  "immunotherapy", "implant", "incontinence", "infarction", "infection", "infectious",
  "inflammation", "inflammatory", "influenza", "inhalation", "inhibition", "inhibitor",
  "injection", "injury", "insomnia", "insulin", "intensive", "intestinal", "intracellular",
  "intravenous", "ischemia", "ischaemia", "ischemic", "ischaemic", "kidney", "kinase",
  "lesion", "leukemia", "leukaemia", "leukocyte", "ligand", "lipid", "liver", "lung",
  "lymphoma", "macrophage", "macular", "malignancy", "malignant", "mammography", "maternal",
  "medical", "medication", "medicine", "melanoma", "membrane", "mental", "metabolic",
  "metabolism", "metabolite", "metabolomics", "metastasis", "metastatic", "microbe",
  "microbial", "microbiology", "microbiome", "microbiota", "microglia", "microorganism",
  "migraine", "mitochondria", "mitochondrial", "molecular", "morbidity", "morphology",
  "mortality", "mucosa", "mucosal", "muscle", "musculoskeletal", "mutation", "mutations",
  "myocardial", "neonatal", "neoplasm", "nephrology", "nervous", "neurobiology",
  "neurodegeneration", "neurodegenerative", "neuroimaging", "neurological", "neurology",
  "neuromuscular", "neuronal", "neuropathy", "neuroplasticity", "neuroscience",
  "neurotransmitter", "nutrition", "nutritional", "obesity", "obstetrics", "ocular",
  "oncology", "ophthalmology", "optical", "oral", "organ", "orthopedic", "orthopaedic",
  "orthopedics", "orthopaedics", "osteoarthritis", "osteoporosis", "otolaryngology", "ovarian",
  "oxidative", "oxygen", "paediatric", "pediatric", "paediatrics", "pediatrics", "palliative",
  "pancreatic", "pandemic", "parasite", "parkinson", "parkinsons", "pathogen", "pathogenesis",
  "pathological", "pathology", "patient", "patients", "peptide", "perfusion", "perinatal",
  "periodontal", "peripheral", "pharmaceutical", "pharmacokinetics", "pharmacology", "pharmacy",
  "phenotype", "phenotypic", "physiological", "physiology", "placebo", "placenta", "plasma",
  "platelet", "pneumonia", "polymerase", "polymorphism", "postoperative", "preclinical",
  "pregnancy", "prenatal", "prescription", "preventive", "prognosis", "prognostic",
  "proliferation", "prostate", "prosthesis", "protein", "proteins", "proteomics", "psychiatric",
  "psychiatry", "psychological", "psychology", "psychotherapy", "pulmonary", "radiograph",
  "radiography", "radiology", "radiotherapy", "receptor", "receptors", "regeneration",
  "regenerative", "rehabilitation", "remission", "renal", "reproductive", "resistance",
  "respiratory", "retina", "retinal", "retinopathy", "rheumatoid", "sarcoma", "schizophrenia",
  "sclerosis", "screening", "seizure", "sepsis", "serum", "skeletal", "skin", "sleep",
  "spinal", "stem", "stenosis", "steroid", "stroke", "subcutaneous", "surgery", "surgical",
  "symptom", "symptoms", "synapse", "synaptic", "syndrome", "systemic", "tachycardia",
  "telemedicine", "therapeutic", "therapeutics", "therapy", "thoracic", "thrombosis",
  "thyroid", "tissue", "tomography", "toxicity", "toxicology", "transcriptome",
  "transcriptomics", "transplantation", "trauma", "traumatic", "tuberculosis", "tumor",
  "tumour", "tumors", "tumours", "ulcer", "ultrasound", "urology", "vaccination", "vaccine",
  "vaccines", "vascular", "venous", "ventilation", "ventricular", "viral", "virology", "virus",
  "vitamin", "wound",

  // Physics / Chemistry / Materials / Engineering / Environment
  "absorption", "acoustic", "actuator", "adhesion", "adsorption", "aerodynamic", "aerodynamics",
  "aerosol", "aerospace", "agricultural", "agriculture", "alloy", "alloys", "aluminum",
  "aluminium", "ambient", "amorphous", "amplitude", "anode", "antenna", "aqueous", "astronomy",
  "astrophysics", "atmosphere", "atmospheric", "atomic", "battery", "batteries", "biodegradable",
  "biodiversity", "biofuel", "biomass", "biopolymer", "capacitor", "carbon", "catalysis",
  "catalyst", "catalytic", "cathode", "ceramic", "ceramics", "chemical", "chemistry",
  "chromatography", "circuit", "climate", "climatology", "coating", "coatings", "colloid",
  "combustion", "composite", "composites", "compression", "concrete", "condensation",
  "conduction", "conductivity", "conductor", "conservation", "contamination", "convection",
  "cooling", "copper", "corrosion", "crystal", "crystalline", "crystallization", "current",
  "decarbonization", "decarbonisation", "deformation", "deposition", "desalination",
  "desorption", "dielectric", "diffraction", "dispersion", "dissipation", "distillation",
  "durability", "durable", "earthquake", "ecological", "ecology", "ecosystem", "elastic",
  "elasticity", "electric", "electrical", "electricity", "electrocatalysis", "electrochemical",
  "electrochemistry", "electrode", "electrolysis", "electrolyte", "electromagnetic", "electron",
  "electronic", "electronics", "electrostatic", "emission", "emissions", "energy", "engine",
  "engineering", "entanglement", "enthalpy", "erosion", "evaporation", "excitation", "fabric",
  "fabrication", "fatigue", "ferroelectric", "ferromagnetic", "fiber", "fibre", "filtration",
  "flexible", "fluid", "fluorescence", "fluorescent", "flux", "fossil", "fracture", "friction",
  "fuel", "geochemical", "geological", "geology", "geophysics", "geothermal", "glacier",
  "graphene", "gravitational", "gravity", "greenhouse", "groundwater", "harvesting", "heat",
  "heating", "humidity", "hydraulic", "hydrocarbon", "hydrodynamic", "hydrodynamics",
  "hydrogel", "hydrogen", "hydrology", "hydrolysis", "hydrophobic", "hydrothermal", "ignition",
  "impedance", "industrial", "infrared", "insulation", "interfacial", "interferometry", "ionic",
  "ionization", "irradiation", "isotope", "kinetic", "kinetics", "laminar", "laser", "lattice",
  "lithium", "lubrication", "luminescence", "magnetic", "magnetism", "manufacturing", "marine",
  "material", "materials", "mechanical", "mechanics", "membrane", "metal", "metallic",
  "metallurgy", "meteorology", "methane", "microelectronic", "microfluidic", "microplastics",
  "microscopy", "microstructure", "microwave", "mineral", "mining", "moisture", "molecule",
  "momentum", "nanocomposite", "nanofiber", "nanofibre", "nanomaterial", "nanomaterials",
  "nanoparticle", "nanoparticles", "nanoscale", "nanostructure", "nanotechnology", "nanotube",
  "nitrate", "nitrogen", "nuclear", "ocean", "oceanography", "optoelectronic", "orbital",
  "organic", "oscillation", "osmosis", "oxidation", "oxide", "ozone", "particle", "particles",
  "pavement", "perovskite", "pesticide", "petrochemical", "petroleum", "phase", "phonon",
  "phosphorus", "photocatalysis", "photocatalyst", "photochemical", "photodetector",
  "photoelectric", "photoluminescence", "photon", "photonic", "photonics", "photosynthesis",
  "photovoltaic", "photovoltaics", "physical", "physics", "piezoelectric", "planetary",
  "plasma", "plastic", "plasticity", "plastics", "platinum", "pollutant", "pollution",
  "polymer", "polymeric", "polymerization", "polymers", "porosity", "porous", "powder",
  "power", "precipitation", "pressure", "propulsion", "proton", "pyrolysis", "radiation",
  "radioactive", "reactant", "reactor", "recycling", "redox", "reflection", "refraction",
  "refrigeration", "relativity", "renewable", "reservoir", "resistor", "resonance", "rheology",
  "robotic", "roughness", "salinity", "satellite", "scattering", "sediment", "seismic",
  "seismology", "semiconductor", "semiconductors", "sequestration", "shear", "silica",
  "silicon", "sintering", "smart", "soil", "solar", "solid", "solubility", "solvent",
  "sorption", "spectroscopy", "spintronics", "sputtering", "steel", "stiffness", "strain",
  "stress", "substrate", "sulfate", "sulphate", "sulfur", "sulphur", "supercapacitor",
  "superconducting", "superconductivity", "superconductor", "surface", "surfactant",
  "suspension", "tensile", "thermal", "thermoelectric", "thermodynamic", "thermodynamics",
  "titanium", "topological", "torque", "transducer", "transistor", "tribology", "turbine",
  "turbulence", "turbulent", "ultrasonic", "ultraviolet", "vacuum", "vapor", "vapour",
  "velocity", "vibration", "viscoelastic", "viscosity", "voltage", "wastewater", "water",
  "watershed", "wavelength", "weather", "weathering", "welding", "wetting", "wildfire", "wind",
  "zeolite",

  // Social Sciences / Economics / Finance / Education / Management
  "accounting", "adolescence", "advertising", "affective", "anthropology", "audit", "auditing",
  "banking", "behavioral", "behavioural", "bilingualism", "branding", "budget", "bureaucracy",
  "business", "capital", "capitalism", "career", "citizenship", "classroom", "commercial",
  "commodity", "communication", "community", "competition", "competitive", "compliance",
  "conflict", "consumer", "consumption", "corporate", "corruption", "counseling", "counselling",
  "credit", "crime", "criminal", "crisis", "cultural", "culture", "currency", "curriculum",
  "customer", "democracy", "democratic", "demography", "derivative", "diplomacy", "disability",
  "discourse", "diversity", "ecological", "econometric", "econometrics", "economic", "economics",
  "economy", "education", "educational", "election", "emotion", "emotional", "empathy",
  "employee", "employment", "empowerment", "engagement", "entrepreneur", "entrepreneurial",
  "entrepreneurship", "equity", "ethical", "ethnicity", "ethnography", "exchange", "executive",
  "export", "family", "finance", "financial", "fiscal", "forecast", "foreign", "gender",
  "geopolitics", "global", "globalization", "globalisation", "governance", "government",
  "growth", "happiness", "healthcare", "heritage", "household", "housing", "humanities",
  "identity", "ideology", "immigration", "import", "incentive", "income", "inequality",
  "inflation", "informal", "institution", "institutional", "instruction", "instructional",
  "insurance", "intellectual", "international", "investment", "investor", "journalism",
  "justice", "labor", "labour", "leadership", "learner", "legislation", "legitimacy",
  "liability", "literacy", "macroeconomic", "macroeconomics", "manager", "managerial",
  "market", "marketing", "media", "mental", "merger", "metacognition", "microeconomic",
  "microeconomics", "microfinance", "migration", "monetary", "monopoly", "moral", "morality",
  "mortgage", "multicultural", "multinational", "municipal", "negotiation", "neighborhood",
  "neighbourhood", "nonprofit", "normative", "occupational", "online", "organizational",
  "organisational", "outsourcing", "ownership", "parenting", "parliament", "partnership",
  "patent", "pedagogical", "pedagogy", "pension", "personality", "personnel", "philanthropy",
  "policymaking", "political", "politics", "poverty", "pricing", "privatization", "procurement",
  "product", "profession", "professional", "profit", "profitability", "property", "prosperity",
  "public", "purchasing", "racial", "reading", "real-estate", "recession", "reform",
  "regulation", "religion", "religious", "remittance", "reputation", "retail", "retirement",
  "revenue", "rhetoric", "rights", "risk", "rural", "safety", "salary", "satisfaction",
  "saving", "savings", "school", "schooling", "security", "service", "shareholder", "social",
  "socialization", "society", "socioeconomic", "sociology", "sovereignty", "stakeholder",
  "startup", "stock", "strategic", "stress", "student", "subsidy", "supply", "tariff",
  "taxation", "teacher", "teaching", "teamwork", "telecommuting", "tourism", "trade",
  "training", "transaction", "transparency", "trust", "turnover", "undergraduate",
  "unemployment", "university", "urban", "urbanization", "urbanisation", "valuation",
  "venture", "violence", "vocational", "voting", "wages", "welfare", "wellbeing", "workforce",
  "workplace", "writing", "youth"
];

/**
 * Common non-academic English words so fuzzy matching never flags ordinary prose
 * typed in natural-language search intent sentences.
 */
const COMMON_ENGLISH_WHITELIST: string[] = [
  "about", "above", "across", "action", "active", "actual", "actually", "adding", "addition",
  "additional", "address", "advanced", "affect", "affected", "affecting", "after", "again",
  "against", "agency", "already", "always", "among", "amount", "animal", "animals", "annual",
  "another", "answer", "anyone", "anything", "appear", "applied", "applies", "applying",
  "areas", "around", "article", "articles", "aspect", "aspects", "assess", "assessed",
  "assessing", "assist", "assisted", "assisting", "associated", "assume", "assumed", "author",
  "authors", "available", "average", "avoid", "based", "basic", "become", "becomes", "before",
  "begin", "beginning", "behind", "being", "belief", "believe", "below", "benefit", "benefits",
  "better", "between", "beyond", "bigger", "billion", "bottom", "branch", "bridge", "brief",
  "bring", "broad", "broader", "broken", "build", "building", "built", "called", "calling",
  "cannot", "capital", "capture", "captured", "capturing", "career", "careful", "carried",
  "carry", "cases", "cause", "caused", "causes", "causing", "center", "centers", "centre",
  "central", "century", "certain", "certainly", "chain", "challenge", "challenges", "challenging",
  "chance", "change", "changed", "changes", "changing", "channel", "chapter", "charge", "check",
  "checked", "checking", "child", "children", "choice", "choose", "chosen", "cities", "citizen",
  "claim", "claims", "class", "classes", "classic", "clean", "clear", "clearly", "close",
  "closed", "closely", "closer", "closest", "coding", "collect", "collected", "collecting",
  "color", "colour", "colors", "colours", "column", "combine", "combined", "combining", "comes",
  "coming", "common", "commonly", "compare", "compared", "comparing", "complete", "completed",
  "completely", "complex", "concern", "concerned", "concerning", "concerns", "conclude",
  "concluded", "condition", "conditions", "conduct", "conducted", "conducting", "confirm",
  "confirmed", "connect", "connected", "connecting", "connection", "consider", "considered",
  "considering", "consist", "consisted", "consisting", "consists", "constant", "construct",
  "constructed", "contain", "contained", "containing", "contains", "content", "contents",
  "context", "continue", "continued", "continuing", "contrast", "contribute", "contributed",
  "controls", "controlled", "controlling", "convert", "converted", "correct", "corrected",
  "could", "count", "counted", "counter", "countries", "country", "couple", "course", "court",
  "cover", "covered", "covering", "create", "created", "creates", "creating", "creation",
  "creative", "cross", "current", "currently", "custom", "cycle", "daily", "damage", "danger",
  "darker", "databases", "datasets", "dated", "dates", "dealing", "death", "debate", "decade",
  "decades", "decide", "decided", "decline", "decrease", "decreased", "decreasing", "deeper",
  "deeply", "default", "defect", "defects", "defend", "defense", "defence", "define", "defined",
  "defines", "defining", "degree", "degrees", "delay", "delayed", "delete", "deliver",
  "delivered", "delivery", "demand", "demands", "demonstrate", "demonstrated", "density",
  "depend", "depending", "depends", "depth", "derive", "derived", "describe", "described",
  "describes", "describing", "design", "designed", "designing", "designs", "desire", "desired",
  "despite", "detail", "detailed", "details", "detect", "detected", "detecting", "detector",
  "determine", "determined", "determining", "develop", "developed", "developer", "developing",
  "device", "devices", "differ", "difference", "differences", "different", "differently",
  "difficult", "difficulty", "direct", "directed", "direction", "directions", "directly",
  "director", "discover", "discovered", "discuss", "discussed", "discussing", "display",
  "displayed", "distance", "distinct", "distinguish", "distribute", "divide", "divided",
  "division", "doctor", "doctors", "doing", "domestic", "dominant", "double", "doubt", "down",
  "draft", "drawn", "driven", "driver", "drivers", "driving", "dropped", "during", "earlier",
  "early", "earth", "easier", "easily", "eastern", "eating", "economic", "editor", "effect",
  "effective", "effectively", "effects", "effort", "efforts", "eight", "either", "elderly",
  "element", "elements", "elevated", "eliminate", "elsewhere", "emerge", "emerged", "emergence",
  "emerging", "emphasis", "emphasize", "employ", "employed", "enable", "enabled", "enables",
  "enabling", "encounter", "encourage", "encouraged", "ended", "ending", "endurance", "enforce",
  "engage", "engaged", "enhance", "enhanced", "enhancing", "enough", "ensure", "ensured",
  "ensuring", "enter", "entered", "entering", "entire", "entirely", "entity", "entities",
  "entry", "equal", "equally", "equation", "equations", "equipment", "equivalent", "especially",
  "essential", "essentially", "establish", "established", "establishing", "estimate", "estimated",
  "estimates", "estimating", "evaluate", "evaluated", "evaluating", "event", "events",
  "eventually", "every", "everyone", "everything", "evident", "evolve", "evolved", "evolving",
  "exact", "exactly", "examine", "examined", "examines", "examining", "example", "examples",
  "exceed", "exceeded", "excellent", "except", "exception", "excess", "excessive", "exclude",
  "excluded", "excluding", "exclusion", "exclusive", "execute", "executed", "exercise", "exhibit",
  "exhibited", "exist", "existed", "existence", "existing", "exists", "expand", "expanded",
  "expanding", "expansion", "expect", "expected", "expecting", "expense", "expensive",
  "experience", "experienced", "experiences", "experiments", "expert", "experts", "explain",
  "explained", "explaining", "explains", "explicit", "explicitly", "exploit", "explore",
  "explored", "exploring", "expose", "exposed", "exposure", "express", "expressed", "extend",
  "extended", "extending", "extensive", "extent", "external", "extra", "extract", "extracted",
  "extracting", "extreme", "extremely", "facing", "facility", "factors", "factory", "failed",
  "failing", "failure", "failures", "fairly", "falling", "familiar", "famous", "faster",
  "fastest", "father", "favor", "favour", "favorable", "favourable", "featured", "features",
  "federal", "feeling", "female", "fewer", "field", "fields", "fifth", "fifty", "fight",
  "figure", "figures", "files", "filled", "filter", "filtered", "final", "finally", "finding",
  "findings", "first", "fitted", "fitting", "fixed", "flavor", "flavour", "flight", "floating",
  "floor", "flows", "focus", "focused", "focussed", "focuses", "focusing", "follow", "followed",
  "following", "follows", "force", "forced", "forces", "forest", "forever", "forget", "formal",
  "format", "formed", "former", "forming", "forms", "formula", "formulas", "formulae", "forth",
  "forty", "forward", "found", "founded", "fourth", "frame", "frames", "freedom", "freely",
  "frequent", "frequently", "fresh", "friend", "friends", "front", "frozen", "fruit", "fully",
  "functions", "funded", "funding", "funds", "further", "furthermore", "future", "gained",
  "gaining", "gains", "garden", "gather", "gathered", "general", "generally", "generate",
  "generated", "generates", "generating", "gentle", "getting", "given", "gives", "giving",
  "glass", "globally", "goals", "going", "golden", "goods", "govern", "grade", "grades",
  "gradual", "gradually", "grain", "grand", "grant", "granted", "grants", "great", "greater",
  "greatest", "greatly", "green", "ground", "grounds", "group", "grouped", "groups", "growing",
  "grown", "guarantee", "guard", "guess", "guide", "guided", "guides", "habits", "hands",
  "handle", "handled", "handling", "happen", "happened", "happening", "happens", "harder",
  "hardly", "harmful", "having", "hazard", "hazards", "headed", "header", "heading", "health",
  "healthy", "heard", "hearing", "heart", "heavy", "heavily", "height", "helped", "helpful",
  "helping", "helps", "hence", "hidden", "higher", "highest", "highlight", "highlighted",
  "highly", "history", "holding", "holds", "homes", "honest", "hoped", "horizon", "horizontal",
  "hours", "house", "houses", "however", "human", "humans", "hundred", "hundreds", "ideal",
  "ideas", "identical", "identify", "identified", "identifies", "identifying", "ignore",
  "ignored", "ignoring", "illness", "illustrate", "illustrated", "image", "images", "imagine",
  "immediate", "immediately", "impact", "impacted", "impacts", "implement", "implemented",
  "implementing", "imply", "implied", "implies", "importance", "important", "importantly",
  "impose", "imposed", "impossible", "improve", "improved", "improves", "improving", "inability",
  "inadequate", "include", "included", "includes", "including", "increase", "increased",
  "increases", "increasing", "increasingly", "indeed", "independently", "index", "indexed",
  "indicate", "indicated", "indicates", "indicating", "indication", "indicators", "indirect",
  "individual", "individuals", "induce", "induced", "inducing", "industry", "industries",
  "infant", "infants", "infer", "inferred", "influence", "influenced", "influences", "inform",
  "informed", "initial", "initially", "initiate", "initiated", "initiative", "inner", "input",
  "inputs", "inquiry", "inside", "insight", "insights", "install", "installed", "instance",
  "instances", "instant", "instead", "instrument", "instruments", "insufficient", "intact",
  "intake", "integrate", "integrated", "integrating", "intend", "intended", "intense",
  "intent", "intention", "interact", "interacted", "interacting", "interest", "interested",
  "interesting", "interests", "internal", "interpret", "interpreted", "interpreting",
  "interval", "intervals", "intervene", "introduce", "introduced", "introducing", "invalid",
  "invasive", "invent", "inventory", "inverse", "invest", "investigate", "investigated",
  "investigating", "involve", "involved", "involvement", "involves", "involving", "island",
  "isolate", "isolated", "isolation", "issue", "issued", "issues", "items", "itself", "joined",
  "joining", "joint", "jointly", "journey", "judge", "judged", "keeping", "keeps", "killed",
  "kinds", "known", "knows", "label", "labeled", "labelled", "labeling", "labelling", "labels",
  "lacked", "lacking", "lacks", "large", "largely", "larger", "largest", "lasted", "lasting",
  "later", "latest", "latter", "launch", "launched", "layer", "layered", "leader", "leaders",
  "leading", "leads", "learn", "learned", "learnt", "least", "leave", "leaves", "leaving",
  "lecture", "legal", "length", "lengths", "lesser", "letter", "letters", "level", "levels",
  "library", "libraries", "license", "licence", "lifetime", "light", "lighting", "lightly",
  "likely", "limit", "limited", "limiting", "limits", "lines", "linked", "linking", "links",
  "liquid", "listed", "listen", "listing", "lists", "little", "lived", "lives", "living",
  "loaded", "loading", "loads", "local", "locally", "locate", "located", "location", "locations",
  "locked", "logic", "longer", "longest", "looked", "looking", "looks", "loops", "loose",
  "losing", "losses", "lower", "lowered", "lowest", "machines", "mainly", "maintain", "maintained",
  "maintaining", "major", "majority", "maker", "makers", "makes", "making", "males", "manage",
  "managed", "managing", "manner", "manual", "manually", "mapped", "margin", "margins", "marked",
  "marker", "markers", "markets", "marks", "married", "masses", "massive", "master", "match",
  "matched", "matches", "matching", "matter", "matters", "mature", "maybe", "meaning",
  "meaningful", "means", "meant", "measure", "measured", "measures", "measuring", "mechanisms",
  "median", "medium", "meeting", "meets", "member", "members", "mention", "mentioned", "merely",
  "merge", "merged", "merit", "message", "messages", "method", "methods", "metrics", "micro",
  "middle", "might", "mildly", "miles", "military", "million", "millions", "minds", "minimal",
  "minimize", "minimise", "minimized", "minor", "minority", "minus", "minute", "minutes",
  "mirror", "missed", "missing", "mission", "mistake", "mixed", "mixture", "mobile", "modal",
  "models", "moderate", "moderately", "modern", "modes", "modify", "modified", "modifying",
  "module", "modules", "moment", "moments", "money", "monitor", "monitored", "month", "monthly",
  "months", "moreover", "morning", "mostly", "mother", "motion", "motor", "mount", "mounted",
  "moved", "movement", "movements", "moves", "moving", "multi", "mutual", "namely", "names",
  "narrow", "nation", "national", "nations", "native", "nature", "nearby", "nearly", "necessarily",
  "necessary", "needed", "needs", "negatively", "neglect", "neither", "nested", "networks",
  "never", "newer", "newest", "newly", "night", "noise", "noisy", "nominal", "non-linear",
  "normal", "normally", "north", "northern", "notable", "notably", "noted", "notes", "nothing",
  "notice", "noticed", "notion", "novel", "nowhere", "number", "numbers", "numerous", "object",
  "objectives", "objects", "observe", "observed", "observer", "observing", "obtain", "obtained",
  "obtaining", "obvious", "obviously", "occasion", "occasional", "occupy", "occur", "occurring",
  "occurs", "offer", "offered", "offering", "offers", "office", "officer", "official", "offset",
  "often", "older", "oldest", "omitted", "ongoing", "opened", "opening", "opens", "operate",
  "operated", "operating", "operations", "operators", "opinion", "opinions", "opponent",
  "opportunity", "opportunities", "oppose", "opposed", "opposite", "option", "optional",
  "options", "order", "ordered", "ordering", "orders", "ordinary", "origin", "originally",
  "origins", "other", "others", "otherwise", "ought", "outcomes", "outdoor", "outer", "outline",
  "outlined", "outputs", "outside", "outward", "overcome", "overlap", "overlapping", "overlook",
  "overlooked", "owned", "owner", "owners", "package", "packages", "pages", "paired", "pairs",
  "panel", "panels", "paper", "papers", "parallel", "parent", "parents", "parks", "partially",
  "participate", "participated", "particular", "particularly", "parties", "parts", "party",
  "passed", "passing", "passive", "patch", "paths", "pathway", "pathways", "patterns", "pause",
  "paying", "payment", "peace", "peaks", "peers", "penalty", "pending", "people", "perceive",
  "perceived", "percent", "percentage", "perfect", "perfectly", "perform", "performed",
  "performing", "performs", "perhaps", "period", "periods", "permanent", "permission", "permit",
  "permitted", "persist", "persistent", "person", "personal", "personally", "persons", "phase",
  "phases", "phone", "photo", "phrase", "phrases", "picked", "picture", "piece", "pieces",
  "pilot", "place", "placed", "placement", "places", "placing", "plain", "plane", "planet",
  "planned", "plans", "plant", "plants", "plate", "plates", "platforms", "played", "player",
  "playing", "plays", "please", "plenty", "plots", "plotted", "plugin", "plural", "point",
  "pointed", "pointing", "points", "polar", "police", "policies", "pooled", "poorer", "poorly",
  "popular", "portable", "portion", "portions", "posed", "position", "positioned", "positions",
  "positively", "possess", "possible", "possibly", "posted", "posture", "potentially", "pounds",
  "powered", "powerful", "practical", "practically", "practices", "preceding", "precise",
  "precisely", "predict", "predicted", "predicting", "predictions", "predicts", "prefer",
  "preferred", "prefix", "prepare", "prepared", "preparing", "presence", "present", "presented",
  "presenting", "presents", "preserve", "preserved", "preserving", "press", "pressed",
  "presumably", "pretty", "prevail", "prevent", "prevented", "preventing", "previous",
  "previously", "price", "prices", "primarily", "prime", "primitive", "principles", "print",
  "printed", "prior", "priority", "private", "probably", "probe", "problems", "procedures",
  "proceed", "proceeded", "proceedings", "processes", "processed", "produce", "produced",
  "producer", "produces", "producing", "products", "profiles", "profits", "program", "programme",
  "programs", "progress", "progressive", "project", "projected", "projects", "prominent",
  "promise", "promising", "promote", "promoted", "promoting", "promotion", "proof", "proper",
  "properly", "properties", "propose", "proposed", "proposes", "proposing", "prospect",
  "prospective", "protect", "protected", "protecting", "protection", "protective", "protocols",
  "prove", "proved", "proven", "provide", "provided", "provider", "providers", "provides",
  "providing", "province", "provision", "proxy", "publicly", "publish", "published", "publisher",
  "publishing", "pulled", "pulse", "purchase", "purchased", "purely", "purpose", "purposes",
  "pursue", "pursued", "pushed", "pushing", "putting", "qualify", "qualified", "qualities",
  "quantify", "quantified", "quarter", "queries", "querying", "question", "questions", "queue",
  "quick", "quickly", "quiet", "quite", "quote", "quoted", "quotes", "radial", "radio", "radius",
  "raise", "raised", "raises", "raising", "randomly", "range", "ranged", "ranges", "ranging",
  "ranked", "ranks", "rapid", "rapidly", "rarely", "rated", "rates", "rather", "rating",
  "ratings", "ratio", "ratios", "reach", "reached", "reaches", "reaching", "react", "reacted",
  "reactions", "reader", "readers", "readily", "ready", "reality", "realize", "realise",
  "realized", "realised", "really", "reason", "reasonable", "reasonably", "reasons", "receive",
  "received", "receiver", "receives", "receiving", "recent", "recently", "recognize", "recognise",
  "recognized", "recognised", "recognizing", "recommend", "recommended", "recommending",
  "record", "recorded", "recording", "records", "recover", "recovered", "recreate", "reduce",
  "reduced", "reduces", "reducing", "refer", "referred", "referring", "refers", "references",
  "refine", "refined", "reflect", "reflected", "reflecting", "reflects", "regard", "regarded",
  "regarding", "regardless", "regime", "region", "regions", "register", "registered",
  "registration", "regularly", "regulate", "regulated", "regulating", "reject", "rejected",
  "rejection", "relate", "related", "relates", "relating", "relations", "relationships",
  "relatively", "relax", "release", "released", "releasing", "reliable", "reliably", "reliance",
  "relief", "rely", "relying", "remain", "remained", "remaining", "remains", "remark",
  "remarkable", "remedy", "remember", "remind", "remote", "remotely", "removal", "remove",
  "removed", "removing", "render", "rendered", "rendering", "repair", "repeat", "repeated",
  "repeatedly", "replace", "replaced", "replacement", "replacing", "replay", "replicated",
  "reply", "report", "reported", "reporting", "reports", "represent", "represented",
  "representing", "represents", "reproduce", "reproduced", "request", "requested", "requests",
  "require", "required", "requirements", "requires", "requiring", "rescue", "researched",
  "researchers", "resemble", "reserve", "reserved", "reset", "reside", "resident", "residents",
  "resist", "resistant", "resolve", "resolved", "resolving", "resources", "respect",
  "respective", "respectively", "respond", "responded", "respondent", "respondents", "responding",
  "responses", "responsibility", "responsible", "restore", "restored", "restrict", "restricted",
  "restriction", "restrictions", "result", "resulted", "resulting", "results", "resume",
  "retain", "retained", "retaining", "retention", "retrieve", "retrieved", "retrieving",
  "return", "returned", "returning", "returns", "reveal", "revealed", "revealing", "reveals",
  "reverse", "reversed", "reviewed", "reviewer", "reviewers", "reviewing", "reviews", "revise",
  "revised", "revision", "reward", "rewards", "right", "rigid", "rigorous", "rising", "risks",
  "risky", "river", "rivers", "roads", "robustly", "roles", "rooms", "roots", "rotate",
  "rotation", "rough", "roughly", "round", "rounded", "rounds", "route", "routes", "routine",
  "ruled", "rules", "ruling", "runner", "running", "safely", "samples", "satisfied", "satisfy",
  "saved", "saving", "saying", "scale", "scaled", "scales", "scaling", "scanned", "scanner",
  "scanning", "scarce", "scatter", "scattered", "scenarios", "scene", "scenes", "schedule",
  "scheduled", "scheme", "schemes", "scholar", "scholarly", "scholars", "schools", "science",
  "sciences", "scientist", "scientists", "scope", "score", "scored", "scores", "scoring",
  "screen", "screened", "screens", "script", "scripts", "searched", "searches", "season",
  "seasonal", "seasons", "second", "secondly", "seconds", "secret", "section", "sections",
  "sector", "sectors", "secure", "secured", "seeing", "seeking", "seeks", "seemed", "seems",
  "segment", "segments", "select", "selected", "selecting", "self", "selling", "sells",
  "sending", "sends", "senior", "sense", "sensed", "senses", "sensing", "sensitive", "sensors",
  "sentence", "sentences", "separately", "sequences", "series", "serious", "seriously", "serve",
  "served", "servers", "serves", "services", "serving", "session", "sessions", "setting",
  "settings", "settle", "settled", "seven", "several", "severe", "severely", "severity",
  "sexual", "shadow", "shallow", "shape", "shaped", "shapes", "share", "shared", "shares",
  "sharing", "sharp", "sharply", "sheet", "sheets", "shell", "shift", "shifted", "shifting",
  "shifts", "shock", "short", "shortage", "shorter", "shortly", "should", "shoulder", "showed",
  "showing", "shown", "shows", "shrink", "sided", "sides", "sight", "signal", "signals",
  "signature", "signed", "significantly", "signs", "silent", "silver", "similar", "similarly",
  "simple", "simpler", "simplest", "simplify", "simplified", "simply", "simulate", "simulated",
  "simulating", "simulations", "simultaneously", "since", "single", "sites", "situated",
  "situations", "sixty", "sized", "sizes", "skill", "skills", "sleep", "slice", "slices",
  "slide", "slight", "slightly", "slope", "slower", "slowly", "small", "smaller", "smallest",
  "smoke", "smoking", "smooth", "smoothed", "smoothing", "smoothly", "snapshot", "socially",
  "societies", "solid", "solids", "solve", "solved", "solver", "solving", "solutions", "someone",
  "something", "sometimes", "somewhat", "somewhere", "sound", "sounds", "sources", "south",
  "southern", "space", "spaces", "spacing", "spanning", "spans", "spark", "spatial", "speak",
  "speaker", "speaking", "special", "specialist", "specialized", "specialised", "species",
  "specifically", "specified", "specify", "specifying", "specimen", "specimens", "speed",
  "speeds", "spend", "spending", "spent", "sphere", "spherical", "spike", "split", "splitting",
  "spoken", "sponsor", "spontaneous", "sport", "sports", "spots", "spread", "spreading",
  "spring", "square", "squared", "stable", "stack", "stacked", "staff", "stage", "stages",
  "stake", "stand", "standards", "standing", "stands", "start", "started", "starting", "starts",
  "stated", "statement", "statements", "states", "stating", "station", "stations", "statistically",
  "status", "stayed", "staying", "steady", "steep", "steps", "stick", "still", "stimulate",
  "stimulated", "stimulation", "stimuli", "stimulus", "stock", "stocks", "stone", "stood",
  "stopped", "stopping", "stops", "store", "stored", "stores", "storing", "storm", "story",
  "straight", "strange", "strategies", "stream", "streams", "street", "strengthen", "stressed",
  "stresses", "stretch", "strict", "strictly", "strike", "string", "strings", "strip", "strong",
  "stronger", "strongest", "strongly", "structured", "structures", "struggle", "students",
  "studied", "studies", "studying", "style", "styles", "subject", "subjects", "submit",
  "submitted", "subsequent", "subsequently", "subset", "subsets", "substance", "substances",
  "substantial", "substantially", "subtle", "succeed", "succeeded", "success", "successful",
  "successfully", "successive", "sudden", "suddenly", "suffer", "suffered", "suffering",
  "sufficient", "sufficiently", "suffix", "sugar", "suggest", "suggested", "suggesting",
  "suggestion", "suggestions", "suggests", "suitable", "suited", "suite", "summarize",
  "summarise", "summarized", "summarised", "summer", "super", "superior", "supplied", "supplier",
  "suppliers", "supplies", "supported", "supporting", "supports", "suppose", "supposed",
  "suppress", "suppressed", "suppression", "surely", "surfaces", "surge", "surplus", "surprise",
  "surprising", "surround", "surrounded", "surrounding", "surveys", "survive", "survived",
  "surviving", "suspect", "suspected", "suspend", "suspended", "sustain", "sustained",
  "swelling", "switch", "switched", "switching", "symbol", "symbols", "synthetic", "systems",
  "table", "tables", "tackle", "tackling", "tagged", "tailored", "taken", "takes", "taking",
  "talent", "talked", "talking", "target", "targeted", "targeting", "targets", "tasks", "taste",
  "taught", "taxes", "teach", "teachers", "teams", "techniques", "technologies", "telling",
  "tells", "temperatures", "templates", "temporary", "tended", "tendency", "tends", "tension",
  "terms", "terrain", "tested", "tests", "texts", "thank", "their", "theirs", "theme", "themes",
  "themselves", "theories", "therapies", "there", "thereby", "therefore", "therein", "these",
  "thesis", "thick", "thickness", "thing", "things", "think", "thinking", "third", "thirty",
  "thorough", "thoroughly", "those", "though", "thought", "thoughts", "thousand", "thousands",
  "thread", "threads", "threat", "threats", "three", "thresholds", "through", "throughout",
  "throw", "thrown", "tight", "tightly", "timed", "timely", "timer", "times", "timing",
  "tissues", "title", "titles", "today", "together", "tokens", "tolerate", "tomorrow", "tonal",
  "tones", "tools", "topic", "topics", "total", "totally", "touch", "touched", "tough", "toward",
  "towards", "tower", "towns", "toxic", "trace", "traced", "traces", "tracing", "track",
  "tracked", "tracking", "tracks", "trade", "trading", "tradition", "traditional", "traditionally",
  "traffic", "trail", "train", "trained", "trainer", "trains", "trait", "traits", "transfer",
  "transferred", "transform", "transformed", "transforming", "transient", "translate",
  "translated", "translating", "transmit", "transmitted", "trap", "trapped", "travel", "traveled",
  "travelled", "treat", "treated", "treating", "treatments", "trees", "trend", "trends", "trial",
  "trials", "triangle", "trick", "tried", "tries", "trigger", "triggered", "triggering",
  "triggers", "triple", "tropical", "trouble", "truly", "trusted", "trustworthy", "truth",
  "trying", "tubes", "tuned", "tuning", "tunnel", "turned", "turning", "turns", "twelve",
  "twenty", "twice", "typed", "types", "typical", "typically", "ultimate", "ultimately",
  "unable", "unaware", "uncertain", "unclear", "under", "undergo", "undergoing", "underlie",
  "underneath", "understand", "understood", "undertake", "undertaken", "unequal", "unexpected",
  "unfair", "unfortunate", "unhealthy", "unified", "uniformly", "union", "unique", "uniquely",
  "united", "units", "unity", "universally", "universities", "unknown", "unless", "unlike",
  "unlikely", "unlimited", "unlock", "unnecessary", "unprecedented", "unpredictable",
  "unrelated", "unreliable", "unsafe", "unseen", "unstable", "unsuccessful", "until", "unusual",
  "update", "updated", "updates", "updating", "upgrade", "upload", "upper", "upset", "upstream",
  "uptake", "upward", "urgent", "usage", "useful", "usefulness", "useless", "users", "using",
  "usual", "usually", "utility", "utilize", "utilise", "utilized", "utilised", "valid",
  "validate", "validated", "validating", "valuable", "value", "valued", "values", "variables",
  "varied", "varies", "variety", "various", "varying", "vectors", "vehicle", "vehicles",
  "vendor", "verify", "verified", "verifying", "versus", "versions", "vessel", "vessels",
  "viable", "victim", "victims", "video", "videos", "viewed", "viewer", "viewing", "views",
  "village", "violate", "violation", "virtually", "viruses", "visible", "visit", "visited",
  "visits", "visually", "vital", "voice", "voices", "volatile", "volumes", "voluntary",
  "volunteer", "volunteers", "voted", "voter", "voters", "vulnerable", "waited", "waiting",
  "walked", "walking", "walls", "wanted", "wanting", "wants", "warmer", "warming", "warned",
  "warning", "warnings", "warrant", "warranted", "washed", "waste", "wastes", "watch", "watched",
  "watching", "waters", "waves", "weaker", "weakness", "wealth", "weapon", "weapons", "wearing",
  "weekly", "weeks", "weigh", "weighed", "weight", "weighted", "weights", "welcome", "western",
  "whatever", "wheel", "wheels", "whenever", "where", "whereas", "whereby", "wherein", "wherever",
  "whether", "which", "while", "white", "whoever", "whole", "wholly", "whose", "widely", "wider",
  "widespread", "width", "willing", "willingness", "window", "windows", "winds", "winner",
  "winter", "wired", "wires", "wisdom", "within", "without", "witness", "woman", "women",
  "wonder", "wooden", "woods", "words", "worked", "worker", "workers", "working", "works",
  "workshop", "world", "worlds", "worldwide", "worried", "worry", "worse", "worst", "worth",
  "worthy", "would", "wounds", "wrapped", "write", "writer", "writers", "writes", "written",
  "wrong", "wrote", "years", "yellow", "yield", "yielded", "yielding", "yields", "young",
  "younger", "zones"
];

const VALID_WORD_SET: Set<string> = new Set([
  ...CANONICAL_ACADEMIC_WORDS.map(w => w.toLowerCase()),
  ...COMMON_ENGLISH_WHITELIST.map(w => w.toLowerCase())
]);

const FUZZY_CANDIDATE_WORDS: string[] = Array.from(
  new Set(CANONICAL_ACADEMIC_WORDS.filter(w => w.length >= 6 && /^[a-z]+$/.test(w)))
);

const FUZZY_BY_LENGTH = new Map<number, string[]>();
for (const word of FUZZY_CANDIDATE_WORDS) {
  const bucket = FUZZY_BY_LENGTH.get(word.length);
  if (bucket) {
    bucket.push(word);
  } else {
    FUZZY_BY_LENGTH.set(word.length, [word]);
  }
}

const BOOLEAN_AND_FIELD_KEYWORDS = new Set([
  "and", "or", "not", "near", "onear", "adj", "same", "with", "within", "pre", "xor",
  "ti", "ab", "ts", "tiab", "ky", "su", "au", "af", "all", "mh", "tw", "mesh", "doi",
  "pmid", "issn", "isbn", "pubyear", "doctype", "affil", "affilcountry", "indexterms",
  "auth", "key", "title", "abs", "notf", "notp", "nots"
]);

/**
 * Optimal String Alignment (Damerau-Levenshtein) distance with early exit threshold.
 */
function damerauLevenshtein(a: string, b: string, maxDist: number): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > maxDist) return maxDist + 1;
  if (a === b) return 0;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    let rowMin = maxDist + 1;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, dp[i - 2][j - 2] + 1);
      }
      dp[i][j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > maxDist) return maxDist + 1;
  }

  return dp[m][n];
}

function preserveCasing(original: string, suggestion: string): string {
  if (!original || !suggestion) return suggestion;
  // Preserve proper noun capitalization in suggestion (e.g. Alzheimer, Parkinson)
  if (suggestion[0] === suggestion[0].toUpperCase() && suggestion[0] !== suggestion[0].toLowerCase()) {
    if (original === original.toUpperCase() && /[A-Z]/.test(original)) {
      return suggestion.toUpperCase();
    }
    return suggestion;
  }
  if (original === original.toUpperCase() && /[A-Z]/.test(original)) {
    return suggestion.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase() && original.slice(1) === original.slice(1).toLowerCase()) {
    return suggestion[0].toUpperCase() + suggestion.slice(1);
  }
  return suggestion;
}

function isLikelyAcronymOrCode(token: string): boolean {
  // All-caps short words like LLM, CRISPR, fMRI, COVID, IoT, etc.
  if (token.length <= 6 && token === token.toUpperCase() && /^[A-Z]+$/.test(token)) {
    return true;
  }
  // Mixed-case domain codes like fMRI, mRNA, pH, LoRA, ChatGPT, DeepSeek, PyTorch, TensorFlow
  const upperCount = (token.match(/[A-Z]/g) || []).length;
  if (upperCount >= 2 && token !== token.toUpperCase()) {
    return true;
  }
  if (upperCount === 1 && token[0] !== token[0].toUpperCase()) {
    return true;
  }
  return false;
}

function findFuzzyAcademicSuggestions(lowerWord: string): string[] {
  const len = lowerWord.length;
  if (len < 6) return [];

  const maxDist = len >= 9 ? 2 : 1;
  const scored: { word: string; dist: number; firstMatch: boolean }[] = [];

  for (let candLen = len - 1; candLen <= len + 1; candLen++) {
    const bucket = FUZZY_BY_LENGTH.get(candLen);
    if (!bucket) continue;
    for (const candidate of bucket) {
      const firstMatch = candidate[0] === lowerWord[0];
      // For distance-2 matches on long words, require matching first character and last or second character
      if (maxDist === 2 && !firstMatch) continue;
      if (maxDist === 1 && !firstMatch && candidate[1] !== lowerWord[1] && candidate[candidate.length - 1] !== lowerWord[len - 1]) {
        continue;
      }

      const dist = damerauLevenshtein(lowerWord, candidate, maxDist);
      if (dist > 0 && dist <= maxDist) {
        // Extra guard for dist=2: require strong prefix/suffix similarity so unrelated words don't match
        if (dist === 2) {
          const sameEnd = candidate[candidate.length - 1] === lowerWord[len - 1];
          const prefix2 = candidate.slice(0, 2) === lowerWord.slice(0, 2);
          if (!sameEnd && !prefix2) continue;
        }
        scored.push({ word: candidate, dist, firstMatch });
      }
    }
  }

  if (scored.length === 0) return [];

  scored.sort((a, b) => {
    if (a.dist !== b.dist) return a.dist - b.dist;
    if (a.firstMatch !== b.firstMatch) return a.firstMatch ? -1 : 1;
    return Math.abs(a.word.length - len) - Math.abs(b.word.length - len);
  });

  // Only keep top distance tier so distance-2 noise doesn't dilute an exact distance-1 hit
  const bestDist = scored[0].dist;
  return scored
    .filter(item => item.dist === bestDist)
    .slice(0, 3)
    .map(item => item.word);
}

/**
 * Checks whether a character index is inside a database field prefix (e.g., `TITLE-ABS-KEY(` or `TS=`)
 * or a bracketed field tag (e.g., `[MeSH]`, `[tiab]`).
 */
function buildProtectedRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  // Bracket tags like [MeSH Terms], [tiab], [Title/Abstract]
  const bracketRegex = /\[[^\]]+\]/g;
  let m: RegExpExecArray | null;
  while ((m = bracketRegex.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  // Field prefixes followed by `=`, `:`, or `(` like TITLE-ABS-KEY(, TI=, TS=
  const fieldPrefixRegex = /\b(?:TITLE-ABS-KEY|TITLE-ABS|AUTH|AFFIL|KEY|DOI|PUBYEAR|AFFILCOUNTRY|DOCTYPE|INDEXTERMS|TIAB|TI|AB|TS|KY|ALL|MH|TW|SU)\s*(?=[=(:])/gi;
  while ((m = fieldPrefixRegex.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  // URLs or DOIs
  const urlRegex = /https?:\/\/\S+|10\.\d{4,9}\/\S+/gi;
  while ((m = urlRegex.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}

function isInsideRanges(start: number, end: number, ranges: Array<[number, number]>): boolean {
  for (const [rStart, rEnd] of ranges) {
    if (start < rEnd && end > rStart) return true;
  }
  return false;
}

/**
 * Run academic spell checking on free-form search intent or Boolean query strings.
 */
export function checkAcademicSpelling(text: string, options: SpellCheckOptions = {}): SpellIssue[] {
  if (!text || !text.trim()) return [];

  const skipBooleanSyntax = options.skipBooleanSyntax !== false;
  const ignoredSet = new Set<string>();
  if (options.ignoredWords) {
    for (const w of options.ignoredWords) {
      if (w) ignoredSet.add(w.toLowerCase());
    }
  }

  const protectedRanges = skipBooleanSyntax ? buildProtectedRanges(text) : [];
  const issues: SpellIssue[] = [];
  const occupiedRanges: Array<[number, number]> = [];

  // 1. Scan Chinese academic typos (longest match first, no overlaps)
  if (/[\u4e00-\u9fff]/.test(text)) {
    for (const typo of SORTED_ZH_TYPO_KEYS) {
      if (ignoredSet.has(typo)) continue;
      let searchFrom = 0;
      while (searchFrom < text.length) {
        const idx = text.indexOf(typo, searchFrom);
        if (idx === -1) break;
        const end = idx + typo.length;
        searchFrom = end;

        if (isInsideRanges(idx, end, protectedRanges) || isInsideRanges(idx, end, occupiedRanges)) {
          continue;
        }

        const entry = ACADEMIC_ZH_TYPOS[typo];
        occupiedRanges.push([idx, end]);
        issues.push({
          id: `zh-${idx}-${typo}`,
          word: typo,
          start: idx,
          end,
          suggestions: entry.suggestions,
          category: "academic_zh",
          domain: entry.domain,
          reasonZh: entry.reasonZh || "常见中文学术错别字，可能导致文献检索漏检或召回失败",
          reasonEn: entry.reasonEn || "Common Chinese academic typo — may reduce search recall",
          confidence: "high"
        });
      }
    }
  }

  // 2. Scan English words (including adjacent wildcard markers to safely skip truncation stems)
  const enWordRegex = /[A-Za-z]+(?:[*?][A-Za-z*?]*|-[A-Za-z]+)*/g;
  let match: RegExpExecArray | null;
  while ((match = enWordRegex.exec(text)) !== null) {
    const rawToken = match[0];
    const tokenStart = match.index;
    const tokenEnd = tokenStart + rawToken.length;

    if (isInsideRanges(tokenStart, tokenEnd, protectedRanges)) continue;

    // Skip wildcard/truncation stems like comput*, analy*, behav?r
    if (skipBooleanSyntax && /[*?]/.test(rawToken)) continue;

    // Check full hyphenated token first (e.g., "meta-analaysis"), otherwise check individual sub-words
    const subParts: Array<{ word: string; start: number; end: number }> = [];
    if (rawToken.includes("-")) {
      const fullLower = rawToken.toLowerCase();
      if (ACADEMIC_EN_TYPOS[fullLower] || VALID_WORD_SET.has(fullLower)) {
        subParts.push({ word: rawToken, start: tokenStart, end: tokenEnd });
      } else {
        let cursor = tokenStart;
        for (const piece of rawToken.split("-")) {
          if (piece.length > 0) {
            subParts.push({ word: piece, start: cursor, end: cursor + piece.length });
          }
          cursor += piece.length + 1;
        }
      }
    } else {
      subParts.push({ word: rawToken, start: tokenStart, end: tokenEnd });
    }

    for (const part of subParts) {
      const { word, start, end } = part;
      const lower = word.toLowerCase();

      if (word.length < 4) continue;
      if (ignoredSet.has(lower)) continue;
      if (skipBooleanSyntax && BOOLEAN_AND_FIELD_KEYWORDS.has(lower)) continue;

      // Exact curated academic typo match (highest precision, even if uppercase)
      const exactEntry = ACADEMIC_EN_TYPOS[lower];
      if (exactEntry) {
        const casedSuggestions = exactEntry.suggestions.map(s => preserveCasing(word, s));
        issues.push({
          id: `en-${start}-${lower}`,
          word,
          start,
          end,
          suggestions: casedSuggestions,
          category: "academic_en",
          domain: exactEntry.domain,
          reasonZh: exactEntry.reasonZh || "常见学术英文拼写错误，可能导致目标数据库检索召回失败",
          reasonEn: exactEntry.reasonEn || "Common academic spelling error — may cause missed records or zero recall",
          confidence: "high"
        });
        continue;
      }

      // Skip known valid words & acronyms/codes before fuzzy checking
      if (VALID_WORD_SET.has(lower)) continue;
      if (isLikelyAcronymOrCode(word)) continue;

      // Also skip simple regular plural/past/gerund of a valid academic word
      if (
        (lower.endsWith("s") && VALID_WORD_SET.has(lower.slice(0, -1))) ||
        (lower.endsWith("es") && VALID_WORD_SET.has(lower.slice(0, -2))) ||
        (lower.endsWith("ed") && VALID_WORD_SET.has(lower.slice(0, -2))) ||
        (lower.endsWith("d") && VALID_WORD_SET.has(lower.slice(0, -1))) ||
        (lower.endsWith("ing") && (VALID_WORD_SET.has(lower.slice(0, -3)) || VALID_WORD_SET.has(lower.slice(0, -3) + "e"))) ||
        (lower.endsWith("ies") && VALID_WORD_SET.has(lower.slice(0, -3) + "y")) ||
        (lower.endsWith("ly") && VALID_WORD_SET.has(lower.slice(0, -2)))
      ) {
        continue;
      }

      const fuzzySuggestions = findFuzzyAcademicSuggestions(lower);
      if (fuzzySuggestions.length > 0) {
        const casedSuggestions = fuzzySuggestions.map(s => preserveCasing(word, s));
        issues.push({
          id: `fuzzy-${start}-${lower}`,
          word,
          start,
          end,
          suggestions: casedSuggestions,
          category: "fuzzy_en",
          domain: DOMAIN_GENERAL,
          reasonZh: "疑似学术术语拼写偏差，请核对拼写以防检索召回率下降",
          reasonEn: "Possible academic term misspelling — verify to prevent recall loss",
          confidence: "medium"
        });
      }
    }
  }

  issues.sort((a, b) => a.start - b.start);
  return issues;
}

/**
 * Convenience helper for checking a single keyword chip or synonym term.
 */
export function checkKeywordTerm(term: string, options: SpellCheckOptions = {}): SpellIssue[] {
  return checkAcademicSpelling(term, { ...options, skipBooleanSyntax: true });
}

/**
 * Apply a single spelling correction at exact [start, end] offsets.
 */
export function applySpellCorrection(text: string, issue: SpellIssue, replacement: string): string {
  if (!text || issue.start < 0 || issue.end > text.length || issue.start > issue.end) {
    return text;
  }
  // Guard against stale offsets by verifying substring still matches
  if (text.slice(issue.start, issue.end) !== issue.word) {
    return replaceWordOccurrence(text, issue.word, replacement);
  }
  return text.slice(0, issue.start) + replacement + text.slice(issue.end);
}

/**
 * Apply the top suggestion for all detected spelling issues safely from end to start.
 */
export function applyAllSpellCorrections(text: string, issues: SpellIssue[]): string {
  if (!text || !issues || issues.length === 0) return text;
  const sortedDesc = [...issues].sort((a, b) => b.start - a.start);
  let result = text;
  for (const issue of sortedDesc) {
    const topSuggestion = issue.suggestions[0];
    if (!topSuggestion) continue;
    if (result.slice(issue.start, issue.end) === issue.word) {
      result = result.slice(0, issue.start) + topSuggestion + result.slice(issue.end);
    }
  }
  return result;
}

/**
 * Replace all whole-word occurrences of a misspelled term in a query string.
 */
export function replaceWordOccurrence(text: string, originalWord: string, replacement: string): string {
  if (!text || !originalWord || originalWord === replacement) return text;
  const escaped = originalWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (/^[A-Za-z-]+$/.test(originalWord)) {
    const regex = new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`, "g");
    return text.replace(regex, replacement);
  }
  return text.split(originalWord).join(replacement);
}
