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
  _appliedTemplate?: string;
  _inputLine?: string;
  _isLoading?: boolean;
  _isError?: boolean;
  _fromCache?: boolean;
  _compareResult?: SearchQueryResponse & {
    modelName: string;
    providerId: string;
  };
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

export interface SearchTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  framework: string;
  constraintPrompt: string;
  isPreset?: boolean;
  tags?: string[];
}

export interface SearchTemplateConstraint {
  id?: string;
  name: string;
  framework: string;
  constraintPrompt: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  dbType: string;
  langPref: string;
  result: SearchQueryResponse;
}

export interface RefinementTrajectoryItem {
  id: string;
  timestamp: number;
  inputLine: string;
  dbType: string;
  langPref: string;
  modelName: string;
  providerId: string;
  templateName?: string;
  // Feedback context
  rating: number;
  feedbackTags: string[];
  feedbackWritten: string;
  // Logic states
  before: {
    booleanQuery: string;
    fieldSpecificQuery?: string;
    explanation?: string;
    keywords?: KeywordGroup[];
  };
  after: {
    booleanQuery: string;
    fieldSpecificQuery?: string;
    explanation?: string;
    keywords?: KeywordGroup[];
    reasoning?: string;
  };
  diffSummary?: string;
}

export interface ModelUsageStats {
  queries: number;
  successes: number;
  failures: number;
  totalTokens: number;
}

export type UsageStatsRegistry = Record<string, Record<string, ModelUsageStats>>;
