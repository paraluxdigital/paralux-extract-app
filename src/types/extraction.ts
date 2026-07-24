export interface ArrayItemProperty {
  key: string;
  type: 'string' | 'number' | 'boolean';
  description?: string;
}

export interface SchemaField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  itemsType?: 'string' | 'number' | 'object';
  itemProperties?: ArrayItemProperty[];
  description: string;
  required: boolean;
}

export interface ExtractionUsageMetrics {
  promptTokens: number;
  candidatesTokens: number;
  thoughtsTokens: number;
  totalTokens: number;
  executionTimeMs: number;
  model: string;
  providerCostUsd: number;
  clientPriceUsd: number;
  timestamp: number;
}

export interface ExtractionApiResponse {
  status: 'success' | 'error';
  data?: any;
  usage?: ExtractionUsageMetrics;
  extractionId?: string;
  error?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  inputRate: number; // per 1,000,000 tokens
  outputRate: number; // per 1,000,000 tokens
  inputRateText: string;
  outputRateText: string;
  isDefault?: boolean;
}

export interface UploadedFile {
  data: string;
  mimeType: string;
  fileName: string;
  isBase64: boolean;
}
