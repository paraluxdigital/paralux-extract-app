import crypto from 'node:crypto';
import { db } from './index.js';
import { FieldValue } from 'firebase-admin/firestore';
import type { AuthVerificationResult, TokenUsageMetrics, UsageLogRecord } from './types.js';

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
    let keyDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    const keyQuery = await db
      .collection('api_keys')
      .where('hashedKey', '==', hashed)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!keyQuery.empty) {
      keyDoc = keyQuery.docs[0];
    } else {
      const fallbackQuery = await db
        .collection('api_keys')
        .where('keyHash', '==', hashed)
        .where('status', '==', 'active')
        .limit(1)
        .get();
      if (!fallbackQuery.empty) {
        keyDoc = fallbackQuery.docs[0];
      }
    }

    if (!keyDoc) {
      const err: any = new Error('Invalid or revoked API key.');
      err.statusCode = 401;
      err.code = 'INVALID_API_KEY';
      throw err;
    }

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
      totalTokensConsumed: 0,
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
 * Phase 2: Commits the credit deduction AFTER successful extraction and records complete token telemetry.
 * Guarantees Zero-Charge on Failure.
 */
export async function commitCreditDeduction(
  userId: string,
  creditsCost: number,
  extractionId: string,
  documentType: string = 'general',
  extractionMode: number = 1,
  apiKeyId?: string,
  tokenUsage?: TokenUsageMetrics,
  executionTimeMs?: number,
  modelName?: string
): Promise<number> {
  const isSandboxUser = userId === 'anonymous' || userId === 'web_sandbox_user';
  let updatedBalance = 50;

  if (!isSandboxUser) {
    const userRef = db.collection('users').doc(userId);

    updatedBalance = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) return 0;

      const userData = userDoc.data() || {};
      const currentCredits = typeof userData.creditsRemaining === 'number' ? userData.creditsRemaining : 50;
      const newBalance = Math.max(0, currentCredits - creditsCost);

      const updates: Record<string, any> = {
        creditsRemaining: newBalance,
        totalExtractionsCount: FieldValue.increment(1),
        monthlyExtractionsCount: FieldValue.increment(1),
        updatedAt: Date.now(),
      };

      if (tokenUsage) {
        updates.totalTokensConsumed = FieldValue.increment(tokenUsage.totalTokens || 0);
        updates.promptTokensTotal = FieldValue.increment(tokenUsage.promptTokens || 0);
        updates.candidatesTokensTotal = FieldValue.increment(tokenUsage.candidatesTokens || 0);
      }

      transaction.update(userRef, updates);

      return newBalance;
    });
  } else {
    updatedBalance = Math.max(0, 50 - creditsCost);
  }

  // Write comprehensive telemetry to /usage_logs
  if (extractionId) {
    const logRecord: UsageLogRecord = {
      extractionId,
      userId,
      apiKeyId: apiKeyId || null,
      documentType,
      extractionMode: extractionMode === 2 ? 2 : 1,
      model: modelName || `mode-${extractionMode}`,
      promptTokens: tokenUsage?.promptTokens || 0,
      candidatesTokens: tokenUsage?.candidatesTokens || 0,
      totalTokens: tokenUsage?.totalTokens || 0,
      thoughtsTokens: tokenUsage?.thoughtsTokens || 0,
      cachedContentTokens: tokenUsage?.cachedContentTokens || 0,
      creditsDeducted: creditsCost,
      executionTimeMs: executionTimeMs || 0,
      timestamp: Date.now(),
      status: 'success',
    };

    try {
      await db.collection('usage_logs').doc(extractionId).set(logRecord);
      console.log(`[TELEMETRY] Successfully saved usage log ${extractionId} for user ${userId} (${logRecord.totalTokens} tokens).`);
    } catch (e) {
      console.error(`[TELEMETRY ERROR] Failed to save usage log ${extractionId}:`, e);
    }
  }

  if (!isSandboxUser) {
    checkAndTriggerLowBalanceAlert(userId, updatedBalance).catch(e =>
      console.warn('Low balance alert check error:', e)
    );
  }

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
