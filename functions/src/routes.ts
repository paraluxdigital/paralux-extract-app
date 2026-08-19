import { Router } from 'express';
import { processDocumentExtraction } from './service.js';
import { db } from './index.js';
import type { QueueJob } from './types.js';

const router = Router();

// Health Check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'paralux-extract-engine',
    timestamp: Date.now(),
  });
});

// Job Status Poll Endpoint
router.get('/jobs/:jobId', async (req, res) => {
  const { jobId } = req.params;
  try {
    const jobDoc = await db.collection('extraction_queue').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({
        status: 'error',
        code: 'JOB_NOT_FOUND',
        error: `Job with ID '${jobId}' not found.`,
      });
    }

    const jobData = jobDoc.data() as QueueJob;
    return res.status(200).json({
      status: 'success',
      jobId,
      jobStatus: jobData.status,
      creditsRequired: jobData.creditsRequired,
      documentType: jobData.documentType,
      createdAt: jobData.createdAt,
      updatedAt: jobData.updatedAt,
      result: jobData.result || null,
      error: jobData.error || null,
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      error: err.message || 'Failed to retrieve job status.',
    });
  }
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
    webhookUrl,
    queueIfInsufficient,
  } = req.body || {};

  // 1. Mandatory Schema Validation
  if (!schema || typeof schema !== 'object' || Array.isArray(schema) || Object.keys(schema).length === 0) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_SCHEMA',
      error: 'Missing or invalid "schema" parameter in request body. A valid JSON schema object is required.',
    });
  }

  // 2. Mandatory Document Validation
  if (!document && !storagePath && !storageUrl) {
    return res.status(400).json({
      status: 'error',
      code: 'MISSING_DOCUMENT',
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
      webhookUrl,
      queueIfInsufficient,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    const statusCode = err?.statusCode || 500;
    const errorCode = err?.code || 'INTERNAL_EXTRACTION_ERROR';

    // If insufficient credits and client requested queueing (or provided webhook for async ingest)
    if (statusCode === 402 && (queueIfInsufficient || webhookUrl)) {
      const jobId = 'job_' + Math.random().toString(36).substring(2, 11);
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

      const queueRecord: QueueJob = {
        jobId,
        userId: activeUserId || 'anonymous',
        status: 'paused_insufficient_credits',
        schema,
        document,
        storagePath,
        storageUrl,
        documentType: documentType || 'general',
        extractionMode: extractionMode === 2 ? 2 : 1,
        creditsRequired: err.creditsRequired || 1,
        webhookUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + TWENTY_FOUR_HOURS_MS,
      };

      await db.collection('extraction_queue').doc(jobId).set(queueRecord);

      return res.status(202).json({
        status: 'queued',
        jobId,
        jobStatus: 'paused_insufficient_credits',
        message:
          'Job registered and held in queue. Extraction will automatically process as soon as credits are added to your account.',
        creditsRequired: err.creditsRequired || 1,
        creditsAvailable: err.creditsAvailable || 0,
        pollUrl: `/api/jobs/${jobId}`,
        topupUrl: 'https://extract.paralux.digital/pricing',
      });
    }

    console.error('Extraction handler error:', err);
    return res.status(statusCode).json({
      status: 'error',
      code: errorCode,
      error: err?.message || 'An internal error occurred during document extraction.',
      creditsRequired: err?.creditsRequired,
      creditsAvailable: err?.creditsAvailable,
      topupUrl: err?.topupUrl,
    });
  }
});

export default router;
