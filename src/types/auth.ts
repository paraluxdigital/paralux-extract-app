export type PlanTierType = 'free' | 'starter' | 'growth' | 'scale' | 'enterprise';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  tier: PlanTierType;
  creditsRemaining: number;
  creditsTotalAllocated: number;
  totalExtractionsCount: number;
  monthlyExtractionsCount: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApiKeyItem {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  environment: 'test' | 'live';
  status: 'active' | 'revoked';
  rateLimitRpm: number;
  createdAt: number;
  lastUsedAt: number | null;
  revokedAt?: number | null;
}

export interface CreatedKeySecret {
  id: string;
  name: string;
  rawKey: string;
  keyPrefix: string;
  environment: 'test' | 'live';
  createdAt: number;
}

export interface UsageLogItem {
  id: string;
  userId: string;
  apiKeyId?: string;
  model: string;
  promptTokens: number;
  candidatesTokens: number;
  thoughtsTokens: number;
  totalTokens: number;
  executionTimeMs: number;
  providerCostUsd: number;
  clientPriceUsd: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  timestamp: number;
}
