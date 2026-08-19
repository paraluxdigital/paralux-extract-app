import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { db } from '../index.js';
import { processDocumentExtraction } from '../service.js';
import type { QueueJob } from '../types.js';

/**
 * Event-Driven Queue Auto-Resume Trigger:
 * Fires whenever a user's credit balance increases (via PAYG pack purchase or subscription renewal/upgrade).
 * Automatically drains queued jobs in FIFO order, processes extractions, and delivers results to client webhooks.
 */
export const onCreditTopupResumeQueue = onDocumentUpdated(
  {
    document: 'users/{userId}',
    memory: '1GiB',
    timeoutSeconds: 300,
  },
  async (event) => {
    const beforeData = event.data?.before.data() || {};
    const afterData = event.data?.after.data() || {};
    const userId = event.params.userId;

    const beforeCredits = typeof beforeData.creditsRemaining === 'number' ? beforeData.creditsRemaining : 0;
    const afterCredits = typeof afterData.creditsRemaining === 'number' ? afterData.creditsRemaining : 0;

    // Only trigger if credits increased
    if (afterCredits <= beforeCredits) {
      return;
    }

    console.log(`[QUEUE TRIGGER] Credit increase detected for user ${userId}: ${beforeCredits} -> ${afterCredits} credits. Draining paused queue...`);

    // Fetch paused jobs in FIFO order
    const pausedJobsSnap = await db
      .collection('extraction_queue')
      .where('userId', '==', userId)
      .where('status', '==', 'paused_insufficient_credits')
      .orderBy('createdAt', 'asc')
      .limit(50)
      .get();

    if (pausedJobsSnap.empty) {
      console.log(`[QUEUE TRIGGER] No paused jobs in queue for user ${userId}.`);
      return;
    }

    console.log(`[QUEUE TRIGGER] Found ${pausedJobsSnap.size} paused job(s) for user ${userId}. Resuming execution...`);

    for (const jobDoc of pausedJobsSnap.docs) {
      const job = jobDoc.data() as QueueJob;

      // Re-read current balance
      const currentUserDoc = await db.collection('users').doc(userId).get();
      const currentBalance = currentUserDoc.data()?.creditsRemaining || 0;

      if (currentBalance < job.creditsRequired) {
        console.log(`[QUEUE TRIGGER] Balance exhausted (${currentBalance} credits left, job ${job.jobId} requires ${job.creditsRequired}). Halting queue drain.`);
        break;
      }

      // Mark job processing
      await jobDoc.ref.update({
        status: 'processing',
        updatedAt: Date.now(),
      });

      try {
        const extractionResult = await processDocumentExtraction({
          jobId: job.jobId,
          userId: job.userId,
          schema: job.schema,
          document: job.document,
          storagePath: job.storagePath,
          storageUrl: job.storageUrl,
          documentType: job.documentType,
          extractionMode: job.extractionMode,
          webhookUrl: job.webhookUrl,
        });

        await jobDoc.ref.update({
          status: 'completed',
          result: extractionResult.data || {},
          updatedAt: Date.now(),
        });

        console.log(`[QUEUE TRIGGER] Successfully processed and resumed queued job ${job.jobId}.`);
      } catch (jobErr: any) {
        console.error(`[QUEUE TRIGGER] Failed to process queued job ${job.jobId}:`, jobErr);
        await jobDoc.ref.update({
          status: 'failed',
          error: jobErr.message || 'Auto-resume extraction failed',
          updatedAt: Date.now(),
        });
      }
    }
  }
);
