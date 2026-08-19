import crypto from 'node:crypto';
import { db } from './index.js';
import { FieldValue } from 'firebase-admin/firestore';
import type { AuthVerificationResult } from './types.js';

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key.trim()).digest('hex');
}

/**
 * Phase 1: Validates API Key & checks quota availability WITHOUT deducting credits yet.
 * Returns user details or throws a 401 / 402 error.
 */
export async function verifyAuthAndReserveQuota(
  apiKey?: string,
  providedUserId?: string,
  requiredCredits: number = 1
): Promise<AuthVerificationResult> {
  let targetUserId = providedUserId || 'anonymous';
  let apiKeyId: string | undefined;
  let keyName: string | undefined;

  // 1. Validate Secret API Key if provided
  if (apiKey) {
    const hashed = hashApiKey(apiKey);
    const keyQuery = await db
      .collection('api_keys')
      .where('keyHash', '==', hashed)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (keyQuery.empty) {
      const err: any = new Error('Invalid or revoked API key.');
      err.statusCode = 401;
      err.code = 'INVALID_API_KEY';
      throw err;
    }

    const keyDoc = keyQuery.docs[0];
    const keyData = keyDoc.data();
    apiKeyId = keyDoc.id;
    keyName = keyData.name || 'Secret Key';
    targetUserId = keyData.userId || targetUserId;

    // Async update lastUsedAt and totalCalls on the key
    keyDoc.ref.update({
      lastUsedAt: Date.now(),
      totalCalls: FieldValue.increment(1),
    }).catch(e => console.warn('Failed to update API key lastUsedAt:', e));
  }

  // If anonymous sandbox user
  if (targetUserId === 'anonymous' || targetUserId === 'web_sandbox_user') {
    return {
      userId: targetUserId,
      creditsRemaining: 50,
      tier: 'free',
    };
  }

  // 2. Read User Profile from Firestore to check quota
  const userRef = db.collection('users').doc(targetUserId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    // Auto-provision initial profile with 50 credits if first time
    const initialProfile = {
      uid: targetUserId,
      email: '',
      displayName: 'Developer',
      tier: 'free',
      creditsRemaining: 50,
      creditsTotalAllocated: 50,
      totalExtractionsCount: 0,
      monthlyExtractionsCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await userRef.set(initialProfile);
    return {
      userId: targetUserId,
      apiKeyId,
      keyName,
      creditsRemaining: 50,
      tier: 'free',
    };
  }

  const userData = userDoc.data() || {};
  const currentCredits = typeof userData.creditsRemaining === 'number' ? userData.creditsRemaining : 50;

  if (currentCredits < requiredCredits) {
    const err: any = new Error(
      `Insufficient credit balance. This extraction requires ${requiredCredits} ${
        requiredCredits === 1 ? 'credit' : 'credits'
      }, but your account has ${currentCredits}.`
    );
    err.statusCode = 402;
    err.code = 'INSUFFICIENT_CREDITS';
    err.creditsRequired = requiredCredits;
    err.creditsAvailable = currentCredits;
    err.topupUrl = 'https://extract.paralux.digital/pricing';
    throw err;
  }

  return {
    userId: targetUserId,
    apiKeyId,
    keyName,
    creditsRemaining: currentCredits,
    tier: userData.tier || 'free',
  };
}

/**
 * Phase 2: Commits the credit deduction AFTER successful extraction.
 * Guarantees Zero-Charge on Failure.
 */
export async function commitCreditDeduction(
  userId: string,
  creditsCost: number,
  extractionId: string,
  documentType: string = 'general',
  extractionMode: number = 1,
  apiKeyId?: string
): Promise<number> {
  if (userId === 'anonymous' || userId === 'web_sandbox_user') {
    return Math.max(0, 50 - creditsCost);
  }

  const userRef = db.collection('users').doc(userId);

  const updatedBalance = await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) return 0;

    const userData = userDoc.data() || {};
    const currentCredits = typeof userData.creditsRemaining === 'number' ? userData.creditsRemaining : 50;
    const newBalance = Math.max(0, currentCredits - creditsCost);

    transaction.update(userRef, {
      creditsRemaining: newBalance,
      totalExtractionsCount: FieldValue.increment(1),
      monthlyExtractionsCount: FieldValue.increment(1),
      updatedAt: Date.now(),
    });

    return newBalance;
  });

  // Write usage log
  if (extractionId) {
    db.collection('usage_logs').doc(extractionId).set({
      extractionId,
      userId,
      apiKeyId: apiKeyId || null,
      documentType,
      extractionMode,
      creditsDeducted: creditsCost,
      timestamp: Date.now(),
      status: 'success',
    }).catch(e => console.warn('Failed to record usage log:', e));
  }

  // Check low balance alert trigger
  checkAndTriggerLowBalanceAlert(userId, updatedBalance).catch(e =>
    console.warn('Low balance alert check error:', e)
  );

  return updatedBalance;
}

/**
 * Checks if user's remaining balance has breached their alert threshold and dispatches alert if needed.
 */
async function checkAndTriggerLowBalanceAlert(userId: string, currentBalance: number): Promise<void> {
  if (userId === 'anonymous' || userId === 'web_sandbox_user') return;

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return;

  const userData = userDoc.data() || {};
  const alertThreshold = typeof userData.alertThreshold === 'number' ? userData.alertThreshold : 50;
  const lastAlertSentAt = userData.lastLowBalanceAlertSentAt || 0;

  // Only alert if balance is at or below threshold and haven't alerted in the past 24 hours
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  if (currentBalance <= alertThreshold && Date.now() - lastAlertSentAt > TWENTY_FOUR_HOURS_MS) {
    console.log(`[ALERT] Low credit balance detected for user ${userId}: ${currentBalance} credits remaining (threshold: ${alertThreshold}).`);

    await userRef.update({
      lastLowBalanceAlertSentAt: Date.now(),
    });

    // If user configured a webhook alert URL, dispatch POST notification
    if (userData.webhookAlertUrl) {
      try {
        await fetch(userData.webhookAlertUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'balance.low',
            userId,
            creditsRemaining: currentBalance,
            alertThreshold,
            timestamp: Date.now(),
            topupUrl: 'https://extract.paralux.digital/pricing',
          }),
        });
      } catch (webhookErr) {
        console.warn(`Failed to dispatch low-balance webhook for ${userId}:`, webhookErr);
      }
    }
  }
}
