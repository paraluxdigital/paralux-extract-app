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
  webhookUrl?: string;
  queueIfInsufficient?: boolean;
  jobId?: string;
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
  code?: string;
}

export interface AuthVerificationResult {
  userId: string;
  apiKeyId?: string;
  keyName?: string;
  creditsRemaining: number;
  tier: string;
}

export type QueueJobStatus =
  | 'queued'
  | 'paused_insufficient_credits'
  | 'processing'
  | 'completed'
  | 'failed';

export interface QueueJob {
  jobId: string;
  userId: string;
  apiKeyId?: string;
  status: QueueJobStatus;
  schema: Record<string, any>;
  document?: DocumentInput;
  storagePath?: string;
  storageUrl?: string;
  documentType: string;
  extractionMode: ExtractionModeType;
  creditsRequired: number;
  webhookUrl?: string;
  result?: Record<string, any>;
  error?: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export type ErrorCode =
  | 'INVALID_SCHEMA'
  | 'MISSING_DOCUMENT'
  | 'INVALID_API_KEY'
  | 'INSUFFICIENT_CREDITS'
  | 'DOCUMENT_UNPARSEABLE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_EXTRACTION_ERROR';

export interface StructuredApiError {
  status: 'error';
  code: ErrorCode;
  error: string;
  creditsRequired?: number;
  creditsAvailable?: number;
  topupUrl?: string;
  jobId?: string;
}
