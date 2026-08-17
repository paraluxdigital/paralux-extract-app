import crypto from 'node:crypto';
import { db } from './index.js';
import { FieldValue } from 'firebase-admin/firestore';
import type { AuthVerificationResult } from './types.js';

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key.trim()).digest('hex');
}

/**
 * Validates the API key or authenticated user ID and atomically deducts the required credits.
 */
export async function authenticateAndDeductCredits(
  apiKey?: string,
  providedUserId?: string,
  requiredCredits: number = 1,
  extractionId: string = '',
  documentType: string = 'general',
  extractionMode: number = 1
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

  // If completely anonymous and no user ID provided
  if (targetUserId === 'anonymous' || targetUserId === 'web_sandbox_user') {
    return {
      userId: targetUserId,
      creditsRemaining: 50,
      tier: 'free',
    };
  }

  // 2. Atomic Credit Check & Deduction in Firestore
  const userRef = db.collection('users').doc(targetUserId);

  const updatedBalance = await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      // Auto-provision initial profile with 50 credits if first time
      const initialProfile = {
        uid: targetUserId,
        email: '',
        displayName: 'Developer',
        tier: 'free',
        creditsRemaining: 50 - requiredCredits,
        creditsTotalAllocated: 50,
        totalExtractionsCount: 1,
        monthlyExtractionsCount: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      transaction.set(userRef, initialProfile);
      return initialProfile.creditsRemaining;
    }

    const userData = userDoc.data() || {};
    const currentCredits = typeof userData.creditsRemaining === 'number' ? userData.creditsRemaining : 50;

    if (currentCredits < requiredCredits) {
      const err: any = new Error(
        `Insufficient credits. This request requires ${requiredCredits} ${
          requiredCredits === 1 ? 'credit' : 'credits'
        }, but your account has ${currentCredits}.`
      );
      err.statusCode = 402;
      throw err;
    }

    const newCredits = Math.max(0, currentCredits - requiredCredits);

    transaction.update(userRef, {
      creditsRemaining: newCredits,
      totalExtractionsCount: FieldValue.increment(1),
      monthlyExtractionsCount: FieldValue.increment(1),
      updatedAt: Date.now(),
    });

    return newCredits;
  });

  // 3. Write usage log asynchronously
  if (extractionId) {
    db.collection('usage_logs').doc(extractionId).set({
      extractionId,
      userId: targetUserId,
      apiKeyId: apiKeyId || null,
      documentType,
      extractionMode,
      creditsDeducted: requiredCredits,
      timestamp: Date.now(),
      status: 'success',
    }).catch(e => console.warn('Failed to record usage log:', e));
  }

  return {
    userId: targetUserId,
    apiKeyId,
    keyName,
    creditsRemaining: updatedBalance,
    tier: 'active',
  };
}
