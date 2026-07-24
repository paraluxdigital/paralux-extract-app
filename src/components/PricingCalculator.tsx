import React, { useState, useMemo } from 'react';

export interface PlanTier {
  id: string;
  name: string;
  priceMonthly: number;
  includedCredits: number;
  features: string[];
  popular?: boolean;
}

export const CLIENT_PLANS: PlanTier[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    priceMonthly: 20,
    includedCredits: 1000,
    features: [
      '1,000 Document Credits / mo',
      '1 Credit = Up to 5 pages per doc',
      'PDF, PNG, JPG, WebP, MD, TXT support',
      'Visual Zod Schema Builder',
      'REST API & Webhooks',
    ],
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    priceMonthly: 50,
    includedCredits: 5000,
    popular: true,
    features: [
      '5,000 Document Credits / mo',
      '1 Credit = Up to 5 pages per doc',
      'Multimodal PDF & High-Res Scanning',
      'Priority Gemini 3.6 Flash access',
      'Unlimited Visual Schemas in Firestore',
      'Priority 24/7 Email Support',
    ],
  },
  {
    id: 'scale',
    name: 'Scale Plan',
    priceMonthly: 200,
    includedCredits: 25000,
    features: [
      '25,000 Document Credits / mo',
      '1 Credit = Up to 5 pages per doc',
      'High Throughput Concurrent Execution',
      'Whitelabel Portal Support',
      'Priority 1-hr Support SLA',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Volume',
    priceMonthly: 500,
    includedCredits: 50000,
    features: [
      '50,000 Document Credits / mo',
      '1 Credit = Up to 5 pages per doc',
      'Custom SLA & Unlimited Rate Limits',
      'Custom Model Tuning & Schemas',
      'Dedicated Account Manager',
    ],
  },
];

export const PricingCalculator: React.FC = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('growth');

  const selectedPlan = useMemo(() => {
    return CLIENT_PLANS.find((p) => p.id === selectedPlanId) || CLIENT_PLANS[1];
  }, [selectedPlanId]);

  return (
    <section id="pricing" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-semibold font-mono text-blue-400 uppercase tracking-widest px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 inline-block mb-3">
          Fixed Subscription Plans
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Fixed Monthly Client Pricing ($20, $50, $200, $500)
        </h2>
        <p className="text-slate-400 text-sm sm:text-base">
          Predictable flat-rate monthly plans. 1 Document Credit = Up to 5 Pages.
        </p>
      </div>

      {/* Subscription Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {CLIENT_PLANS.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlanId(plan.id)}
            className={`p-6 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative ${
              plan.popular || selectedPlanId === plan.id
                ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 right-6 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-600 text-white shadow-sm">
                Most Popular
              </span>
            )}

            <div>
              <h3 className="text-base font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-black text-white font-mono">${plan.priceMonthly}</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-300 mb-6 font-medium">
                Includes <strong>{plan.includedCredits.toLocaleString()}</strong> Document Credits
              </p>

              <ul className="space-y-2.5 mb-8 text-xs text-slate-300">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-blue-400">check_circle</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setSelectedPlanId(plan.id)}
              className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedPlanId === plan.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-base">check</span>
              <span>{selectedPlanId === plan.id ? 'Selected Plan' : 'Select Plan'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Selected Plan Summary Banner */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <span className="material-symbols-outlined text-xl">verified</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Selected Subscription</span>
            <span className="text-lg font-extrabold text-white">{selectedPlan.name} ({selectedPlan.includedCredits.toLocaleString()} Credits)</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium block">Flat Fixed Price</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">${selectedPlan.priceMonthly} / mo</span>
          </div>
        </div>
      </div>

    </section>
  );
};
