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

export type ExtractionModeType = 1 | 2;

export interface ExtractionModeConfig {
  mode: ExtractionModeType;
  name: string;
  badge: string;
  model: string;
  modelPricing: {
    inputPerMillion: number;
    outputPerMillion: number;
  };
  creditsCost: number;
  description: string;
  recommendedFor: string[];
}

export const EXTRACTION_MODES: ExtractionModeConfig[] = [
  {
    mode: 1,
    name: 'Standard Extraction',
    badge: '1 CREDIT / 5 PAGES',
    model: 'Gemini 3.5 Flash Lite',
    modelPricing: {
      inputPerMillion: 0.30,
      outputPerMillion: 2.50,
    },
    creditsCost: 1,
    description: 'High-speed, cost-optimized extraction powered by Gemini 3.5 Flash Lite. 1 credit per 1-5 pages.',
    recommendedFor: ['Invoices & Billing Statements', 'Retail & POS Receipts', 'Simple Application Forms', 'Standard Text Documents'],
  },
  {
    mode: 2,
    name: 'Advanced Multimodal',
    badge: '2 CREDITS / 5 PAGES',
    model: 'Gemini 3.7 Flash',
    modelPricing: {
      inputPerMillion: 0.75,
      outputPerMillion: 3.50,
    },
    creditsCost: 2,
    description: 'Frontier multimodal engine powered by Gemini 3.7 Flash with deep visual parsing for complex contracts and dense tables.',
    recommendedFor: ['Multi-page Complex Contracts', 'Dense Financial Tables & Spreadsheets', 'Scanned / Low-Res / Skewed Documents', 'Resumes & Custom Technical Docs'],
  },
];

export interface ExtractionApiResponse {
  status: 'success' | 'error';
  data?: any;
  extractionId?: string;
  modelUsed?: string;
  creditsUsed?: number;
  creditsRemaining?: number;
  executionTimeMs?: number;
  timestamp?: number;
  error?: string;
}

export interface UploadedFile {
  data: string;
  mimeType: string;
  fileName: string;
  isBase64: boolean;
  fileSize?: number;
  detectedPages?: number;
  storagePath?: string;
  downloadUrl?: string;
}

export interface StorageUploadResult {
  storagePath: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

