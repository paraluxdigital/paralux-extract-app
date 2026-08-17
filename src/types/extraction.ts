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
    badge: '1 CREDIT / 5 PAGES',
    creditsCost: 1,
    description: 'High-speed, cost-optimized extraction for standard documents, receipts, and invoices. 1 credit per 1-5 pages.',
    recommendedFor: ['Invoices & Billing Statements', 'Retail & POS Receipts', 'Simple Application Forms', 'Standard Text Documents'],
  },
  {
    mode: 2,
    name: 'Advanced Multimodal',
    badge: '2 CREDITS / 5 PAGES',
    creditsCost: 2,
    description: 'Deep visual layout parsing for complex contracts, dense tables, and low-res scans. 2 credits per 1-5 pages.',
    recommendedFor: ['Multi-page Complex Contracts', 'Dense Financial Tables & Spreadsheets', 'Scanned / Low-Res / Skewed Documents', 'Resumes & Custom Technical Docs'],
  },
];

export interface ExtractionApiResponse {
  status: 'success' | 'error';
  data?: any;
  extractionId?: string;
  extractionMode?: ExtractionModeType;
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

