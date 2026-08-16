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
  creditsCost: number;
  description: string;
  recommendedFor: string[];
}

export const EXTRACTION_MODES: ExtractionModeConfig[] = [
  {
    mode: 1,
    name: 'Standard Extraction',
    badge: '1 CREDIT / DOC',
    creditsCost: 1,
    description: 'High-speed, low-latency extraction for standard documents, receipts, and invoices.',
    recommendedFor: ['Invoices & Billing Statements', 'Retail & POS Receipts', 'Simple Application Forms', 'Standard Text Documents'],
  },
  {
    mode: 2,
    name: 'Advanced Multimodal',
    badge: '2 CREDITS / DOC',
    creditsCost: 2,
    description: 'Frontier multimodal engine with deep visual layout parsing for complex or low-quality documents.',
    recommendedFor: ['Multi-page Complex Contracts', 'Dense Financial Tables & Spreadsheets', 'Scanned / Low-Res / Skewed Documents', 'Resumes & Custom Technical Docs'],
  },
];

export interface ExtractionApiResponse {
  status: 'success' | 'error';
  data?: any;
  extractionId?: string;
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
}
