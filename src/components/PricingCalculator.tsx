import React, { useState, useMemo } from 'react';
import { CREDIT_PACKS, type CreditPack } from '../types/auth';
import { CreditTopupModal } from './CreditTopupModal';

export interface PlanTier {
  id: string;
  name: string;
  priceMonthly: number;
  includedCredits: number;
  costPerDoc: number;
  features: string[];
  popular?: boolean;
}

const CLIENT_PLANS: PlanTier[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    priceMonthly: 20,
    includedCredits: 1000,
    costPerDoc: 0.020,
    features: [
      '1,000 Document Credits / mo',
      'Mode 1 (Standard) & Mode 2 (Advanced Multimodal)',
      '1 Credit = Up to 5 pages per doc',
      'PDF, PNG, JPG, WebP, MD, TXT support',
      '24h Ephemeral Storage ($0 storage fee)',
      'REST API & Instant Webhooks',
    ],
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    priceMonthly: 50,
    includedCredits: 5000,
    costPerDoc: 0.010,
    popular: true,
    features: [
      '5,000 Document Credits / mo',
      '1 Credit = Up to 5 pages per doc',
      'Multimodal PDF & High-Res Document Vision',
      'Priority Mode 1 & Mode 2 Access',
      'Unlimited Schemas in Firestore',
      '24h Ephemeral Storage ($0 storage fee)',
      'Priority 24/7 Support SLA',
    ],
  },
  {
    id: 'scale',
    name: 'Scale Plan',
    priceMonthly: 200,
    includedCredits: 25000,
    costPerDoc: 0.008,
    features: [
      '25,000 Document Credits / mo',
      '1 Credit = Up to 5 pages per doc',
      'High-Throughput Concurrent Queues',
      'Whitelabel Webhook Endpoints',
      'Dedicated Slack / Discord Channel',
      'Custom Model Tuning Support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Volume',
    priceMonthly: 500,
    includedCredits: 50000,
    costPerDoc: 0.005,
    features: [
      '50,000+ Document Credits / mo',
      '1 Credit = Up to 5 pages per doc',
      'Unlimited Rate Limits & Custom SLA',
      'Custom Vision & OCR Tuning',
      'Dedicated Account Engineer',
      'On-Premise / Private VPC Deploy Option',
    ],
  },
];

export const PricingCalculator: React.FC = () => {
  const [pricingMode, setPricingMode] = useState<'subscription' | 'payg'>('subscription');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('growth');
  const [monthlyVolume, setMonthlyVolume] = useState<number>(5000);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupToast, setTopupToast] = useState<string | null>(null);

  // Human data entry cost baseline (~$1.25 per doc: manual inspection, transcription, verification)
  const HUMAN_ENTRY_COST_PER_DOC = 1.25;

  // Auto-recommend tier based on volume
  const recommendedTier = useMemo(() => {
    if (monthlyVolume <= 1000) return CLIENT_PLANS[0];
    if (monthlyVolume <= 5000) return CLIENT_PLANS[1];
    if (monthlyVolume <= 25000) return CLIENT_PLANS[2];
    return CLIENT_PLANS[3];
  }, [monthlyVolume]);

  const selectedPlan = useMemo(() => {
    return CLIENT_PLANS.find((p) => p.id === selectedPlanId) || CLIENT_PLANS[1];
  }, [selectedPlanId]);

  // Financial Calculations
  const humanMonthlyCost = useMemo(() => {
    return monthlyVolume * HUMAN_ENTRY_COST_PER_DOC;
  }, [monthlyVolume]);

  const paraluxMonthlyCost = useMemo(() => {
    const basePrice = recommendedTier.priceMonthly;
    if (billingCycle === 'annual') {
      return basePrice * 0.8; // 20% discount on annual
    }
    return basePrice;
  }, [recommendedTier, billingCycle]);

  const monthlySavings = useMemo(() => {
    return Math.max(0, humanMonthlyCost - paraluxMonthlyCost);
  }, [humanMonthlyCost, paraluxMonthlyCost]);

  const savingsPercentage = useMemo(() => {
    if (humanMonthlyCost === 0) return 0;
    return ((monthlySavings / humanMonthlyCost) * 100).toFixed(1);
  }, [humanMonthlyCost, monthlySavings]);

  const hoursSavedPerMonth = useMemo(() => {
    // Approx 4 minutes manual entry per document vs 1.5 seconds automated extraction
    return Math.round((monthlyVolume * 4) / 60);
  }, [monthlyVolume]);

  const handleTopupSuccess = (creditsAdded: number) => {
    setTopupToast(`Successfully added ${creditsAdded.toLocaleString()} credits to your account!`);
    setTimeout(() => setTopupToast(null), 4000);
  };

  return (
    <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#4a5568]/60 relative">
      
      {/* Toast Notification */}
      {topupToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2f9e44] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{topupToast}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dd6b20]/15 border border-[#dd6b20]/30 text-[#dd6b20] text-xs font-mono font-bold uppercase tracking-widest mb-3">
          <span className="material-symbols-outlined text-sm">payments</span>
          <span>Flexible Billing & ROI</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-black text-[#f7fafc] tracking-tight mb-3">
          Choose Subscription or Pay-Per-Use
        </h2>
        <p className="text-[#a0aec0] text-sm sm:text-base">
          Scale effortlessly with flat predictable monthly tiers or top up credits as you go with zero recurring commitment.
        </p>

        {/* Pricing Model Tab Selector (Subscription vs Pay-As-You-Go) */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-[#202734] border border-[#4a5568] mt-6 shadow-inner">
          <button
            onClick={() => setPricingMode('subscription')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              pricingMode === 'subscription'
                ? 'bg-[#dd6b20] text-white shadow-md'
                : 'text-[#a0aec0] hover:text-[#f7fafc]'
            }`}
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            <span>Monthly Subscriptions</span>
          </button>

          <button
            onClick={() => setPricingMode('payg')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              pricingMode === 'payg'
                ? 'bg-[#dd6b20] text-white shadow-md'
                : 'text-[#a0aec0] hover:text-[#f7fafc]'
            }`}
          >
            <span className="material-symbols-outlined text-base">bolt</span>
            <span>Pay-As-You-Go (Credits)</span>
            <span className="text-[10px] bg-[#2f9e44]/20 text-[#2f9e44] font-mono px-2 py-0.5 rounded-full border border-[#2f9e44]/30">
              No Contract
            </span>
          </button>
        </div>

        {/* Monthly vs Annual Toggle (Only for Subscriptions) */}
        {pricingMode === 'subscription' && (
          <div className="flex items-center justify-center gap-3 mt-5">
            <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-[#f7fafc]' : 'text-[#a0aec0]'}`}>
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-12 h-6 rounded-full bg-[#202734] border border-[#4a5568] p-0.5 transition-colors cursor-pointer"
              aria-label="Toggle annual billing discount"
            >
              <div
                className={`size-4.5 rounded-full bg-[#dd6b20] transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              ></div>
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold ${billingCycle === 'annual' ? 'text-[#f7fafc]' : 'text-[#a0aec0]'}`}>
                Annual Billing
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#2f9e44]/15 text-[#2f9e44] border border-[#2f9e44]/30">
                Save 20%
              </span>
            </div>
          </div>
        )}
      </div>

      {pricingMode === 'subscription' ? (
        <>
          {/* Interactive Volume & ROI Simulator Card */}
          <div className="bg-[#2d3748] p-6 sm:p-8 rounded-3xl mb-14 border border-[#4a5568] shadow-lg">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              
              {/* Left: Volume Slider */}
              <div className="flex-1 w-full flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#dd6b20] uppercase tracking-wider block font-mono">
                      Interactive Volume Simulator
                    </span>
                    <h3 className="text-xl font-bold font-display text-[#f7fafc] mt-0.5">How many documents do you process monthly?</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-[#f7fafc] font-mono">
                      {monthlyVolume.toLocaleString()}
                    </span>
                    <span className="text-xs text-[#a0aec0] block">docs / month</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="flex flex-col gap-2">
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={monthlyVolume}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMonthlyVolume(val);
                      if (val <= 1000) setSelectedPlanId('starter');
                      else if (val <= 5000) setSelectedPlanId('growth');
                      else if (val <= 25000) setSelectedPlanId('scale');
                      else setSelectedPlanId('enterprise');
                    }}
                    className="w-full h-2.5 bg-[#1a202c] rounded-lg appearance-none cursor-pointer accent-[#dd6b20] border border-[#4a5568]"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-[#a0aec0]">
                    <span>500 docs</span>
                    <span>5,000 docs</span>
                    <span>25,000 docs</span>
                    <span>50,000+ docs</span>
                  </div>
                </div>

                {/* Recommended Tier Pill */}
                <div className="flex items-center gap-2 bg-[#202734] p-3 rounded-xl border border-[#4a5568] self-start">
                  <span className="material-symbols-outlined text-[#dd6b20] text-sm">recommend</span>
                  <span className="text-xs text-[#a0aec0]">
                    Optimal Plan: <strong className="text-[#f7fafc] font-bold">{recommendedTier.name}</strong> ({recommendedTier.includedCredits.toLocaleString()} Credits for <span className="text-[#dd6b20] font-mono font-bold">${recommendedTier.priceMonthly}/mo</span>)
                  </span>
                </div>
              </div>

              {/* Right: Calculated Real-time Savings Breakdown */}
              <div className="w-full lg:w-80 shrink-0 bg-[#202734] p-5 rounded-2xl border border-[#4a5568] flex flex-col gap-4 shadow-inner">
                <span className="text-[11px] font-bold text-[#a0aec0] uppercase tracking-widest font-mono">
                  Estimated Monthly ROI
                </span>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#a0aec0]">Manual Human Entry (~$1.25/doc):</span>
                    <span className="font-mono text-[#a0aec0] line-through">${humanMonthlyCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#dd6b20] font-medium">Paralux Digital Extract:</span>
                    <span className="font-mono font-bold text-[#f7fafc]">${paraluxMonthlyCost}/mo</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#4a5568] flex flex-col">
                  <span className="text-xs font-bold text-[#2f9e44] uppercase tracking-wider">Your Monthly Savings</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-[#2f9e44] font-mono">
                      ${monthlySavings.toLocaleString()}
                    </span>
                    <span className="text-xs text-[#2f9e44] font-bold font-mono">({savingsPercentage}%)</span>
                  </div>
                  <span className="text-[11px] text-[#a0aec0] mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#dd6b20]">schedule</span>
                    Reclaims ~{hoursSavedPerMonth} staff hours every month
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Subscription Plan Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {CLIENT_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const displayPrice = billingCycle === 'annual' ? Math.round(plan.priceMonthly * 0.8) : plan.priceMonthly;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-6 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#202734] border-[#dd6b20] shadow-xl ring-1 ring-[#dd6b20]'
                      : 'bg-[#2d3748] border-[#4a5568] hover:border-[#718096]'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 right-6 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-[#dd6b20] text-white shadow-sm border border-[#dd6b20]">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <h3 className="text-base font-bold font-display text-[#f7fafc] mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-black text-[#f7fafc] font-mono">${displayPrice}</span>
                      <span className="text-xs text-[#a0aec0]">/ month</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-mono text-[#dd6b20] font-semibold px-2 py-0.5 rounded bg-[#dd6b20]/15 border border-[#dd6b20]/30">
                        ~${plan.costPerDoc.toFixed(3)} / doc
                      </span>
                      {billingCycle === 'annual' && (
                        <span className="text-[10px] text-[#2f9e44] font-medium font-mono">Billed annually</span>
                      )}
                    </div>

                    <p className="text-xs text-[#a0aec0] mb-6 font-medium">
                      Includes <strong className="text-[#f7fafc]">{plan.includedCredits.toLocaleString()}</strong> Document Credits
                    </p>

                    <ul className="space-y-2.5 mb-8 text-xs text-[#f7fafc]">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-sm text-[#dd6b20] shrink-0 mt-0.5">check_circle</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#dd6b20] text-white shadow-sm border border-[#dd6b20]'
                        : 'bg-[#1a202c] text-[#f7fafc] hover:bg-[#202734] border border-[#4a5568]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{isSelected ? 'check' : 'touch_app'}</span>
                    <span>{isSelected ? 'Selected Plan' : 'Select Plan'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Selected Plan Summary Banner */}
          <div className="bg-[#2d3748] p-6 rounded-2xl border border-[#4a5568] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-xl bg-[#dd6b20]/15 border border-[#dd6b20]/30 flex items-center justify-center text-[#dd6b20] shadow-sm">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#a0aec0] uppercase tracking-wider block font-mono">
                  Selected Subscription Tier
                </span>
                <span className="text-lg font-extrabold text-[#f7fafc]">
                  {selectedPlan.name} ({selectedPlan.includedCredits.toLocaleString()} Included Monthly Credits)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-[#a0aec0] font-medium block">
                  {billingCycle === 'annual' ? 'Annual Discounted Rate' : 'Flat Monthly Rate'}
                </span>
                <span className="text-2xl font-black text-[#2f9e44] font-mono">
                  ${billingCycle === 'annual' ? Math.round(selectedPlan.priceMonthly * 0.8) : selectedPlan.priceMonthly} / mo
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Pay-As-You-Go (PAYG) Section */
        <div className="flex flex-col gap-10">
          
          {/* PAYG Overview Card */}
          <div className="bg-[#2d3748] p-6 sm:p-8 rounded-3xl border border-[#4a5568] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#dd6b20] text-2xl">token</span>
                <h3 className="text-xl font-bold font-display text-[#f7fafc]">Prepaid On-Demand Credits</h3>
              </div>
              <p className="text-xs sm:text-sm text-[#a0aec0] max-w-2xl leading-relaxed">
                Perfect for developers, prototyping, or spiky quarterly batch extractions. Purchase credits when you need them. No recurring monthly commitments, no hidden charges, and credits never expire.
              </p>
            </div>

            <button
              onClick={() => setIsTopupModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#dd6b20]/25 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">bolt</span>
              <span>Top Up Credits Now</span>
            </button>
          </div>

          {/* PAYG Packs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CREDIT_PACKS.map((pack: CreditPack) => (
              <div
                key={pack.id}
                className={`p-6 rounded-3xl border flex flex-col justify-between transition-all relative ${
                  pack.popular
                    ? 'bg-[#202734] border-[#dd6b20] shadow-xl ring-1 ring-[#dd6b20]'
                    : 'bg-[#2d3748] border-[#4a5568] hover:border-[#718096]'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 right-6 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-[#dd6b20] text-white shadow-sm border border-[#dd6b20]">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold font-display text-[#f7fafc] mb-1">{pack.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl sm:text-4xl font-black text-[#f7fafc] font-mono">${pack.priceUsd}</span>
                    <span className="text-xs text-[#a0aec0]">one-time purchase</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#dd6b20]/15 border border-[#dd6b20]/30 text-[#dd6b20] text-xs font-mono font-bold mb-5">
                    <span>${pack.pricePerCredit.toFixed(3)} / credit</span>
                  </div>

                  <div className="bg-[#1a202c] p-3 rounded-xl border border-[#4a5568] flex items-center justify-between mb-6">
                    <span className="text-xs text-[#a0aec0]">Total Allocation</span>
                    <span className="text-sm font-bold font-mono text-[#f7fafc]">
                      ⚡ {pack.credits.toLocaleString()} Credits
                    </span>
                  </div>

                  <ul className="space-y-2.5 mb-8 text-xs text-[#f7fafc]">
                    {pack.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm text-[#dd6b20] shrink-0 mt-0.5">check_circle</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setIsTopupModalOpen(true)}
                  className="w-full py-3.5 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">shopping_cart</span>
                  <span>Buy {pack.credits.toLocaleString()} Credits</span>
                </button>
              </div>
            ))}
          </div>

          {/* Model Consumption & Zero-Storage-Fee Guarantee */}
          <div className="bg-[#202734] p-6 rounded-2xl border border-[#4a5568] grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#dd6b20] uppercase font-mono">Mode 1: Standard Extraction</span>
              <p className="text-xs text-[#a0aec0]">
                High-speed extraction at <strong>1 credit per 1-5 pages</strong>. Optimized for invoices, receipts, and standard forms.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#dd6b20] uppercase font-mono">Mode 2: Advanced Multimodal</span>
              <p className="text-xs text-[#a0aec0]">
                Deep visual parsing at <strong>2 credits per 1-5 pages</strong>. Ideal for complex contracts, dense financial tables, and low-res scans.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#2f9e44] uppercase font-mono">24-Hour Ephemeral Storage</span>
              <p className="text-xs text-[#a0aec0]">
                Documents are purged automatically after 24h via GCS lifecycle rules. <strong>$0.00 storage overhead</strong> on your account.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Credit Topup Modal */}
      <CreditTopupModal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        onSuccess={handleTopupSuccess}
      />

    </section>
  );
};
