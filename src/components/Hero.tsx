import React from 'react';
import { useNavigation } from '../context/useNavigation';

export const Hero: React.FC = () => {
  const { navigateToPortal, navigateToLanding } = useNavigation();

  return (
    <section className="relative pt-32 pb-20 border-b border-[#4a5568]/60 bg-[#1a202c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#dd6b20]/15 border border-[#dd6b20]/30 text-[#dd6b20] text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
          <span className="material-symbols-outlined text-sm">auto_awesome</span>
          <span>Paralux Digital Document Extraction Platform</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-[#f7fafc] max-w-4xl mx-auto leading-[1.15] mb-6">
          Transform Unstructured Docs into Structured JSON Starting at{' '}
          <span className="text-[#dd6b20]">
            $20 / Month
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#a0aec0] max-w-2xl mx-auto font-normal leading-relaxed mb-10">
          Extract validated, typed JSON data from PDF invoices, scanned receipts, medical summaries, and contracts with high-speed automated intelligence. Plans starting at <strong className="text-[#f7fafc] font-semibold">$20/mo for 1,000 document credits</strong> or pay-as-you-go.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <button
            onClick={() => navigateToPortal('workbench')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#dd6b20]/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#dd6b20] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-base">terminal</span>
            <span>Launch Developer Portal</span>
          </button>

          <button
            onClick={() => navigateToLanding('pricing')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#2d3748] hover:bg-[#3a4659] text-[#f7fafc] font-bold text-xs uppercase tracking-wider border border-[#4a5568] hover:border-[#dd6b20] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-base text-[#dd6b20]">payments</span>
            <span>Compare Plans & ROI</span>
          </button>
        </div>

        {/* Client Pricing Plan Tier Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          
          <div 
            onClick={() => navigateToLanding('pricing')}
            className="bg-[#2d3748] p-4 rounded-xl border border-[#4a5568] hover:border-[#dd6b20] transition-all flex items-center gap-3 group cursor-pointer"
          >
            <div className="size-10 rounded-lg bg-[#202734] border border-[#4a5568] flex items-center justify-center text-[#dd6b20] shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">bolt</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#f7fafc] group-hover:text-[#dd6b20] transition-colors">Starter Plan</span>
              <span className="text-[11px] text-[#a0aec0] font-mono">$20/mo (1,000 credits)</span>
            </div>
          </div>

          <div 
            onClick={() => navigateToLanding('pricing')}
            className="bg-[#2d3748] p-4 rounded-xl border border-[#dd6b20]/60 hover:border-[#dd6b20] transition-all flex items-center gap-3 group cursor-pointer"
          >
            <div className="size-10 rounded-lg bg-[#dd6b20]/20 border border-[#dd6b20]/40 flex items-center justify-center text-[#dd6b20] shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">trending_up</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#f7fafc] group-hover:text-[#dd6b20] transition-colors">Growth Plan</span>
                <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-[#dd6b20]/20 text-[#dd6b20]">Popular</span>
              </div>
              <span className="text-[11px] text-[#dd6b20] font-mono font-semibold">$50/mo (5,000 credits)</span>
            </div>
          </div>

          <div 
            onClick={() => navigateToLanding('pricing')}
            className="bg-[#2d3748] p-4 rounded-xl border border-[#4a5568] hover:border-[#dd6b20] transition-all flex items-center gap-3 group cursor-pointer"
          >
            <div className="size-10 rounded-lg bg-[#202734] border border-[#4a5568] flex items-center justify-center text-[#dd6b20] shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">domain</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#f7fafc] group-hover:text-[#dd6b20] transition-colors">Scale Plan</span>
              <span className="text-[11px] text-[#a0aec0] font-mono">$200/mo (25,000 credits)</span>
            </div>
          </div>

          <div 
            onClick={() => navigateToLanding('pricing')}
            className="bg-[#2d3748] p-4 rounded-xl border border-[#4a5568] hover:border-[#dd6b20] transition-all flex items-center gap-3 group cursor-pointer"
          >
            <div className="size-10 rounded-lg bg-[#202734] border border-[#4a5568] flex items-center justify-center text-[#dd6b20] shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">corporate_fare</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#f7fafc] group-hover:text-[#dd6b20] transition-colors">Enterprise</span>
              <span className="text-[11px] text-[#a0aec0] font-mono">$500/mo (50,000 credits)</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
