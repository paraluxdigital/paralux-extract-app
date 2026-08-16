import React from 'react';

export const FeaturesShowcase: React.FC = () => {
  return (
    <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold font-mono text-[#dd6b20] uppercase tracking-widest block mb-2">
            Engine Capabilities & Intelligence Modes
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-[#f7fafc]">
            Designed for Modern Automated Data Pipelines
          </h2>
          <p className="text-sm text-[#a0aec0] mt-3 leading-relaxed">
            Eliminate hours of manual transcription. Feed any PDF, receipt, invoice, or complex contract into Paralux Extract and receive strongly-typed JSON data instantly.
          </p>
        </div>

        {/* Intelligence Modes Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Mode 1 */}
          <div className="bg-[#202734] border border-[#4a5568] hover:border-[#dd6b20] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl bg-[#dd6b20]/15 border-l border-b border-[#dd6b20]/30 text-[#dd6b20] text-xs font-mono font-bold uppercase">
              1 Credit / Doc
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#dd6b20]/20 text-[#dd6b20] flex items-center justify-center border border-[#dd6b20]/40 mb-5">
                <span className="material-symbols-outlined text-2xl">bolt</span>
              </div>

              <span className="text-xs font-mono text-[#dd6b20] font-bold uppercase">Extraction Mode 1</span>
              <h3 className="text-2xl font-bold font-display text-[#f7fafc] mt-1 mb-3">Standard Extraction</h3>
              <p className="text-xs text-[#a0aec0] leading-relaxed mb-6">
                Ultra-fast, sub-second extraction optimized for structured documents with predictable formatting.
              </p>

              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-mono text-[#f7fafc] uppercase tracking-wider font-bold">Best For:</span>
                <div className="flex flex-col gap-2 text-xs text-[#a0aec0]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                    <span>Standard PDF & Email Invoices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                    <span>Point-of-Sale (POS) & Retail Receipts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                    <span>High-volume straightforward billing items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                    <span>Sub-second API response time (~500-700ms)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#4a5568] flex items-center justify-between text-xs font-mono text-[#a0aec0]">
              <span>Throughput: Up to 300 req/min</span>
              <span className="text-[#dd6b20] font-bold">Cost: 1 Credit</span>
            </div>
          </div>

          {/* Mode 2 */}
          <div className="bg-[#202734] border border-[#dd6b20]/60 hover:border-[#dd6b20] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl bg-[#dd6b20] text-white text-xs font-mono font-bold uppercase">
              2 Credits / Doc
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#dd6b20] text-white flex items-center justify-center border border-[#dd6b20] mb-5 shadow-lg shadow-[#dd6b20]/30">
                <span className="material-symbols-outlined text-2xl">visibility</span>
              </div>

              <span className="text-xs font-mono text-[#dd6b20] font-bold uppercase">Extraction Mode 2</span>
              <h3 className="text-2xl font-bold font-display text-[#f7fafc] mt-1 mb-3">Advanced Multimodal</h3>
              <p className="text-xs text-[#a0aec0] leading-relaxed mb-6">
                Deep visual reasoning for complex layouts, dense financial tables, low-resolution scans, and multi-page agreements.
              </p>

              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-mono text-[#f7fafc] uppercase tracking-wider font-bold">Best For:</span>
                <div className="flex flex-col gap-2 text-xs text-[#a0aec0]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                    <span>Multi-Page Legal & Commercial Contracts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                    <span>Dense Financial Statements & Multi-column Tables</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                    <span>Scanned, Skewed, or Low-Resolution Images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                    <span>High-precision nested JSON schemas</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#4a5568] flex items-center justify-between text-xs font-mono text-[#a0aec0]">
              <span>Multimodal Vision Reasoning</span>
              <span className="text-[#dd6b20] font-bold">Cost: 2 Credits</span>
            </div>
          </div>

        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#2d3748] p-5 rounded-2xl border border-[#4a5568] flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#202734] border border-[#4a5568] flex items-center justify-center text-[#dd6b20]">
              <span className="material-symbols-outlined text-xl">schema</span>
            </div>
            <h4 className="text-sm font-bold text-[#f7fafc]">Custom JSON Schemas</h4>
            <p className="text-xs text-[#a0aec0] leading-relaxed">
              Define your expected keys, nested objects, and arrays. The output strictly conforms to your target structure.
            </p>
          </div>

          <div className="bg-[#2d3748] p-5 rounded-2xl border border-[#4a5568] flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#202734] border border-[#4a5568] flex items-center justify-center text-[#dd6b20]">
              <span className="material-symbols-outlined text-xl">security</span>
            </div>
            <h4 className="text-sm font-bold text-[#f7fafc]">Zero-Data Retention</h4>
            <p className="text-xs text-[#a0aec0] leading-relaxed">
              Customer document payloads are processed ephemerally and automatically purged after extraction.
            </p>
          </div>

          <div className="bg-[#2d3748] p-5 rounded-2xl border border-[#4a5568] flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#202734] border border-[#4a5568] flex items-center justify-center text-[#dd6b20]">
              <span className="material-symbols-outlined text-xl">api</span>
            </div>
            <h4 className="text-sm font-bold text-[#f7fafc]">Simple REST & SDKs</h4>
            <p className="text-xs text-[#a0aec0] leading-relaxed">
              Integrate in minutes using cURL, Python, Node.js, or Go with simple `x-api-key` header authorization.
            </p>
          </div>

          <div className="bg-[#2d3748] p-5 rounded-2xl border border-[#4a5568] flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#202734] border border-[#4a5568] flex items-center justify-center text-[#dd6b20]">
              <span className="material-symbols-outlined text-xl">savings</span>
            </div>
            <h4 className="text-sm font-bold text-[#f7fafc]">Transparent Credits</h4>
            <p className="text-xs text-[#a0aec0] leading-relaxed">
              No surprise token bills. Pay flat predictable rates per document starting at only $0.005 to $0.020 per doc.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
