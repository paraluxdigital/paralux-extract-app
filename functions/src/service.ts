import 'dotenv/config';
import { InMemorySessionService, Runner, LlmAgent } from '@google/adk';
import { getStorage } from 'firebase-admin/storage';
import { buildZodSchema } from './zodHelper.js';
import { authenticateAndDeductCredits } from './auth.js';
import type { ExtractionRequest, ExtractionResponse, DocumentInput } from './types.js';

const sessionService = new InMemorySessionService();
const appName = 'paralux-extract-app';

// Mode mappings to high-speed frontier vision models
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
      throw new Error(`File not found at storage path: ${storagePath}`);
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
          text: `Document Category: ${documentType}\nPlease analyze the attached ${mimeType} document carefully and extract all fields strictly conforming to the output schema.`,
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
    throw new Error('No document content provided. Provide either "document" or "storagePath".');
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

export async function processDocumentExtraction(
  reqPayload: ExtractionRequest
): Promise<ExtractionResponse> {
  const startTime = Date.now();
  const extractionId = 'px_' + Math.random().toString(36).substring(2, 11);
  const extractionMode = reqPayload.extractionMode === 2 ? 2 : 1;
  const documentType = reqPayload.documentType || 'general';

  // 1. Build and validate Zod Schema
  const zodSchema = buildZodSchema(reqPayload.schema);

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

  // 4. Authenticate & Deduct Credits atomically
  const authResult = await authenticateAndDeductCredits(
    reqPayload.apiKey,
    reqPayload.userId,
    creditsCost,
    extractionId,
    documentType,
    extractionMode
  );

  // 5. Execute Structured Inference with Google ADK Agent
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
5. You MUST output valid, clean JSON matching the target schema. Do not include markdown code block formatting (e.g. do not wrap in \`\`\`json).`,
    outputSchema: zodSchema as any,
    disallowTransferToParent: true,
    disallowTransferToPeers: true,
  });

  const sessionId = `extract-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  await sessionService.createSession({ appName, userId: authResult.userId, sessionId });
  const runner = new Runner({ appName, agent, sessionService });

  const events = runner.runAsync({
    userId: authResult.userId,
    sessionId,
    newMessage: { role: 'user', parts: resolvedDoc.parts },
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

  // Parse output JSON
  let extractedData: any;
  try {
    extractedData = JSON.parse(extractJson(rawTextOutput));
  } catch (parseErr) {
    console.warn('Document extraction output JSON parse fallback:', parseErr);
    extractedData = rawTextOutput;
  }

  const executionTimeMs = Date.now() - startTime;

  return {
    status: 'success',
    extractionId,
    extractionMode,
    creditsUsed: creditsCost,
    creditsRemaining: authResult.creditsRemaining,
    executionTimeMs,
    timestamp: Date.now(),
    data: extractedData,
  };
}
