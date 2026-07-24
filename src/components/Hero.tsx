import React from 'react';

interface HeroProps {
  onStartTesting: () => void;
  onViewPricing: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartTesting, onViewPricing }) => {
  return (
    <section className="relative pt-32 pb-16 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900/90 to-[#090d16]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium uppercase tracking-wider mb-6">
          <span className="material-symbols-outlined text-sm text-blue-400">verified</span>
          <span>Disruptive Enterprise Document AI SaaS Platform</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15] mb-6">
          Automate Document Data Extraction Starting at <span className="text-blue-400">$20 / Month</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
          Extract validated, structured JSON data from invoices, receipts, contracts, and PDFs with 99.9% accuracy. Plans starting at <strong className="text-white">$20/mo for 1,000 documents</strong>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <button
            onClick={onStartTesting}
            className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">terminal</span>
            <span>Test Live Sandbox</span>
          </button>

          <button
            onClick={onViewPricing}
            className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs uppercase tracking-wider border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-slate-400">payments</span>
            <span>View Subscription Plans ($20, $50, $200, $500)</span>
          </button>
        </div>

        {/* Client Pricing Plan Tier Highlights ($20, $50, $200, $500) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          
          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 flex items-center gap-3">
            <div className="size-9 rounded bg-slate-800/80 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
              <span className="material-symbols-outlined text-lg">bolt</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Starter Plan</span>
              <span className="text-[11px] text-slate-400">$20/mo (1,000 docs)</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 flex items-center gap-3">
            <div className="size-9 rounded bg-slate-800/80 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
              <span className="material-symbols-outlined text-lg">trending_up</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Growth Plan</span>
              <span className="text-[11px] text-slate-400">$50/mo (5,000 docs)</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 flex items-center gap-3">
            <div className="size-9 rounded bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
              <span className="material-symbols-outlined text-lg">domain</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Scale Plan</span>
              <span className="text-[11px] text-slate-400">$200/mo (25,000 docs)</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 flex items-center gap-3">
            <div className="size-9 rounded bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
              <span className="material-symbols-outlined text-lg">corporate_fare</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Enterprise</span>
              <span className="text-[11px] text-slate-400">$500/mo (50,000 docs)</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
