export type ExtractionModeType = 1 | 2;

export interface DocumentMediaInput {
  data: string;
  mimeType: string;
}

export type DocumentInput = string | DocumentMediaInput;

export interface ExtractionRequest {
  schema: Record<string, any>;
  document?: DocumentInput;
  storagePath?: string;
  storageUrl?: string;
  documentType?: string;
  userId?: string;
  apiKey?: string;
  extractionMode?: ExtractionModeType;
}

export interface ExtractionResponse {
  status: 'success' | 'error';
  extractionId: string;
  extractionMode: ExtractionModeType;
  creditsUsed: number;
  creditsRemaining: number;
  executionTimeMs: number;
  timestamp: number;
  data?: Record<string, any>;
  error?: string;
}

export interface AuthVerificationResult {
  userId: string;
  apiKeyId?: string;
  keyName?: string;
  creditsRemaining: number;
  tier: string;
}
