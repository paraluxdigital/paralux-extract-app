import { Router } from 'express';
import { processDocumentExtraction } from './service.js';

const router = Router();

// Health Check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'paralux-extract-engine',
    timestamp: Date.now(),
  });
});

// Main Document Extraction Endpoint
router.post(['/extract', '/'], async (req, res) => {
  const {
    schema,
    document,
    storagePath,
    storageUrl,
    documentType,
    userId,
    apiKey: bodyApiKey,
    extractionMode,
  } = req.body || {};

  // 1. Mandatory Schema Validation
  if (!schema || typeof schema !== 'object' || Array.isArray(schema) || Object.keys(schema).length === 0) {
    return res.status(400).json({
      status: 'error',
      error: 'Missing or invalid "schema" parameter in request body. A valid JSON schema object is required.',
    });
  }

  // 2. Mandatory Document Validation (either inline document or storagePath required)
  if (!document && !storagePath && !storageUrl) {
    return res.status(400).json({
      status: 'error',
      error: 'Missing document input. Provide either "document" or "storagePath".',
    });
  }

  // Extract API key from headers or payload
  const headerApiKey = req.headers['x-api-key'] || req.headers['authorization'];
  const apiKey = bodyApiKey || (typeof headerApiKey === 'string' ? headerApiKey.replace(/^Bearer\s+/i, '') : undefined);
  const activeUserId = userId || (typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'] : undefined);

  try {
    const result = await processDocumentExtraction({
      schema,
      document,
      storagePath,
      storageUrl,
      documentType,
      userId: activeUserId,
      apiKey,
      extractionMode: extractionMode === 2 ? 2 : 1,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Extraction handler error:', err);
    const statusCode = err?.statusCode || 500;
    return res.status(statusCode).json({
      status: 'error',
      error: err?.message || 'An internal error occurred during document extraction.',
    });
  }
});

export default router;
