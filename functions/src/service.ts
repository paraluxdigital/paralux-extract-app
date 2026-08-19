import 'dotenv/config';
import { InMemorySessionService, Runner, LlmAgent } from '@google/adk';
import { getStorage } from 'firebase-admin/storage';
import { buildZodSchema } from './zodHelper.js';
import { verifyAuthAndReserveQuota, commitCreditDeduction } from './auth.js';
import type { ExtractionRequest, ExtractionResponse, DocumentInput } from './types.js';

const sessionService = new InMemorySessionService();
const appName = 'paralux-extract-app';

// Mode mappings to high-speed vision models
const MODE_MODELS: Record<number, string> = {
  1: 'gemini-2.5-flash',
  2: 'gemini-2.5-flash',
};

interface ResolvedDocument {
  parts: any[];
  mimeType: string;
  pageCount: number;
}

function estimatePageCountFromBuffer(buffer: Buffer, mimeType: string): number {
  if (mimeType === 'application/pdf') {
    try {
      const text = buffer.toString('binary');
      const matches = text.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
      if (matches && matches[1]) {
        const count = parseInt(matches[1], 10);
        if (count > 0 && count < 1000) return count;
      }
    } catch {
      // fallback
    }
  }
  return 1;
}

function extractJson(text: string): string {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return text;
}

async function resolveDocumentContent(
  input?: DocumentInput,
  storagePath?: string,
  documentType: string = 'general'
): Promise<ResolvedDocument> {
  // 1. Direct Cloud Storage download
  if (storagePath) {
    const bucket = getStorage().bucket();
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();

    if (!exists) {
      const err: any = new Error(`File not found at storage path: ${storagePath}`);
      err.statusCode = 400;
      err.code = 'MISSING_DOCUMENT';
      throw err;
    }

    const [metadata] = await file.getMetadata();
    const mimeType = metadata.contentType || 'application/pdf';
    const [fileBuffer] = await file.download();
    const pageCount = estimatePageCountFromBuffer(fileBuffer, mimeType);
    const base64Data = fileBuffer.toString('base64');

    return {
      mimeType,
      pageCount,
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        {
          text: `Document Category: ${documentType}\nPlease analyze the attached ${mimeType} document carefully and extract all fields strictly conforming to the requested output schema.`,
        },
      ],
    };
  }

  // 2. Inline string or media object
  let rawData = '';
  let mimeType = 'text/plain';

  if (typeof input === 'string') {
    rawData = input;
    if (rawData.startsWith('data:')) {
      const match = rawData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        rawData = match[2];
      }
    }
  } else if (typeof input === 'object' && input !== null) {
    rawData = input.data || '';
    mimeType = input.mimeType || 'text/plain';
    if (rawData.startsWith('data:')) {
      const match = rawData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        rawData = match[2];
      }
    }
  }

  if (!rawData) {
    const err: any = new Error('No document content provided. Provide either "document" or "storagePath".');
    err.statusCode = 400;
    err.code = 'MISSING_DOCUMENT';
    throw err;
  }

  const isBinary =
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf';

  if (isBinary) {
    let cleanBase64 = rawData;
    if (cleanBase64.includes(';base64,')) {
      cleanBase64 = cleanBase64.split(';base64,')[1];
    }
    cleanBase64 = cleanBase64.replace(/\s/g, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const pageCount = estimatePageCountFromBuffer(buffer, mimeType);

    return {
      mimeType,
      pageCount,
      parts: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: `Document Category: ${documentType}\nPlease analyze the attached ${mimeType} document carefully and extract all fields strictly conforming to the requested schema.`,
        },
      ],
    };
  }

  // Raw text
  const estimatedPages = Math.max(1, Math.ceil(rawData.length / 3000));
  return {
    mimeType: 'text/plain',
    pageCount: estimatedPages,
    parts: [
      {
        text: `Document Category: ${documentType}\n\nDocument Text Content:\n"""\n${rawData}\n"""`,
      },
    ],
  };
}

/**
 * Runs agent extraction with internal retry for transient provider errors.
 */
async function executeInferenceWithRetry(
  agent: LlmAgent,
  userId: string,
  parts: any[],
  maxRetries: number = 2
): Promise<string> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const sessionId = `extract-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await sessionService.createSession({ appName, userId, sessionId });
      const runner = new Runner({ appName, agent, sessionService });

      const events = runner.runAsync({
        userId,
        sessionId,
        newMessage: { role: 'user', parts },
      });

      let rawTextOutput = '';

      for await (const event of events) {
        if (event.content?.parts) {
          for (const part of event.content.parts) {
            if (part.text) {
              rawTextOutput += part.text;
            }
          }
        }
      }

      if (rawTextOutput.trim()) {
        return rawTextOutput;
      }
      throw new Error('Empty extraction output returned from model');
    } catch (err: any) {
      lastError = err;
      console.warn(`Extraction inference attempt ${attempt + 1}/${maxRetries + 1} failed:`, err?.message);
      if (attempt < maxRetries) {
        const backoffMs = (attempt + 1) * 800;
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }

  const failureErr: any = new Error(lastError?.message || 'Document extraction failed after retries.');
  failureErr.statusCode = 500;
  failureErr.code = 'INTERNAL_EXTRACTION_ERROR';
  throw failureErr;
}

export async function processDocumentExtraction(
  reqPayload: ExtractionRequest
): Promise<ExtractionResponse> {
  const startTime = Date.now();
  const extractionId = reqPayload.jobId || 'px_' + Math.random().toString(36).substring(2, 11);
  const extractionMode = reqPayload.extractionMode === 2 ? 2 : 1;
  const documentType = reqPayload.documentType || 'general';

  // 1. Build and validate Zod Schema
  let zodSchema: any;
  try {
    zodSchema = buildZodSchema(reqPayload.schema);
  } catch (schemaErr: any) {
    const err: any = new Error(schemaErr.message || 'Invalid schema format');
    err.statusCode = 400;
    err.code = 'INVALID_SCHEMA';
    throw err;
  }

  // 2. Resolve document contents
  const resolvedDoc = await resolveDocumentContent(
    reqPayload.document,
    reqPayload.storagePath,
    documentType
  );

  // 3. Compute credit cost: Mode 1 = 1 credit/5pg, Mode 2 = 2 credits/5pg
  const pages = Math.max(1, resolvedDoc.pageCount);
  const creditMultiplier = Math.ceil(pages / 5);
  const creditsCost = (extractionMode === 1 ? 1 : 2) * creditMultiplier;

  // 4. Phase 1: Verify Auth & Quota Reservation (Throws 401 / 402 if invalid/insufficient)
  const authResult = await verifyAuthAndReserveQuota(
    reqPayload.apiKey,
    reqPayload.userId,
    creditsCost
  );

  // 5. Execute Structured Inference with retry mechanism
  const modelName = MODE_MODELS[extractionMode] || 'gemini-2.5-flash';

  const agent = new LlmAgent({
    name: 'document_extractor',
    model: modelName,
    description: 'Extracts structured data from documents based on user defined schema.',
    instruction: `You are Paralux Extract AI, a world-class intelligent Document Analysis and Data Extraction Engine.
Analyze the provided document (PDF, image, or text) with high precision and extract typed JSON data strictly adhering to the user's requested schema.

Guidelines:
1. Extract exact, truthful values directly from the document without hallucination.
2. For dates, standardize to ISO-8601 (YYYY-MM-DD) whenever possible.
3. For numeric currency values, return pure numbers without currency symbols (e.g. 1500.50 instead of "$1,500.50").
4. If an optional field is absent from the document, set it to null or omit it.
5. You MUST output valid, clean JSON matching the target schema. Do not include markdown code block formatting.`,
    outputSchema: zodSchema as any,
    disallowTransferToParent: true,
    disallowTransferToPeers: true,
  });

  const rawTextOutput = await executeInferenceWithRetry(
    agent,
    authResult.userId,
    resolvedDoc.parts
  );

  // 6. Parse and validate output JSON
  let extractedData: any;
  try {
    extractedData = JSON.parse(extractJson(rawTextOutput));
  } catch (parseErr) {
    console.warn('Document extraction output JSON parse fallback:', parseErr);
    extractedData = rawTextOutput;
  }

  // 7. Phase 2: Commit Credit Deduction AFTER successful inference (Zero-Charge Guarantee)
  const remainingCredits = await commitCreditDeduction(
    authResult.userId,
    creditsCost,
    extractionId,
    documentType,
    extractionMode,
    authResult.apiKeyId
  );

  const executionTimeMs = Date.now() - startTime;

  const resultResponse: ExtractionResponse = {
    status: 'success',
    extractionId,
    extractionMode,
    creditsUsed: creditsCost,
    creditsRemaining: remainingCredits,
    executionTimeMs,
    timestamp: Date.now(),
    data: extractedData,
  };

  // 8. If webhookUrl is provided, dispatch payload asynchronously
  if (reqPayload.webhookUrl) {
    dispatchWebhookResult(reqPayload.webhookUrl, resultResponse).catch((wErr) =>
      console.warn(`Webhook dispatch error for ${reqPayload.webhookUrl}:`, wErr)
    );
  }

  return resultResponse;
}

async function dispatchWebhookResult(webhookUrl: string, payload: ExtractionResponse): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'extraction.completed',
      ...payload,
    }),
  });
}
