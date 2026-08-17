export type PlanTierType = 'free' | 'starter' | 'growth' | 'scale' | 'enterprise' | 'payg';

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  pricePerCredit: number;
  popular?: boolean;
  features: string[];
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack_500',
    name: 'Starter Pack',
    credits: 500,
    priceUsd: 15,
    pricePerCredit: 0.030,
    features: [
      '500 Document Credits',
      'Never Expire • Prepaid',
      'Mode 1 (Standard Extraction)',
      'Mode 2 (Advanced Multimodal)',
      'Direct REST API Access',
    ],
  },
  {
    id: 'pack_1000',
    name: 'Standard Pack',
    credits: 1000,
    priceUsd: 25,
    pricePerCredit: 0.025,
    popular: true,
    features: [
      '1,000 Document Credits',
      'Never Expire • Prepaid',
      'Priority Advanced Multimodal Mode',
      'Auto-Refill Option Available',
      'Developer Webhook Integration',
    ],
  },
  {
    id: 'pack_3000',
    name: 'Power Pack',
    credits: 3000,
    priceUsd: 60,
    pricePerCredit: 0.020,
    features: [
      '3,000 Document Credits',
      'Never Expire • Prepaid',
      'Lowest Pay-Per-Use Rate ($0.020/cr)',
      'Priority High-Throughput Queues',
      'Email & Slack Support SLA',
    ],
  },
];

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
