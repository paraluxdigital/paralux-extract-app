import React from 'react';

export const ApiDocs: React.FC = () => {
  const sampleSuccessJson = JSON.stringify(
    {
      status: 'success',
      data: {
        invoiceNumber: 'INV-2026-001',
        clientName: 'Acme Global Enterprises Inc.',
        totalAmount: 13562.5,
      },
      usage: {
        promptTokens: 700,
        candidatesTokens: 48,
        totalTokens: 748,
        executionTimeMs: 1761,
        model: 'gemini-3.1-flash-lite',
        providerCostUsd: 0.000282,
        clientPriceUsd: 0.000846,
      },
      extractionId: 'q8A9dK01Xy',
    },
    null,
    2
  );

  return (
    <section id="docs" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col gap-8">
        
        <div className="pb-6 border-b border-slate-800">
          <span className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest block mb-1">
            REST API Specification
          </span>
          <h2 className="text-3xl font-extrabold text-white">Endpoint Reference: POST /api/extract</h2>
        </div>

        {/* Request Specification */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-6 flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-base">input</span>
              Request Headers & Parameters
            </h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white font-mono">Content-Type</span>
                <span className="text-xs text-indigo-400 font-mono">application/json</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white font-mono">x-api-key</span>
                <span className="text-xs text-slate-400 font-mono">px_live_... (API Key token)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">x-user-id</span>
                <span className="text-xs text-slate-400 font-mono">User / Tenant Identifier</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-300 uppercase">JSON Body Parameters</span>
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 text-xs">
                <div>
                  <strong className="text-indigo-400 font-mono">schema (required)</strong>
                  <p className="text-slate-400 mt-0.5">Zod or JSON schema object mapping requested keys to type & description properties.</p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <strong className="text-indigo-400 font-mono">document (required)</strong>
                  <p className="text-slate-400 mt-0.5">Plain text string, Markdown, or Object containing base64 string and mimeType for binary PDF/PNG files.</p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <strong className="text-indigo-400 font-mono">model (optional)</strong>
                  <p className="text-slate-400 mt-0.5">Choice of <code>gemini-3.1-flash-lite</code> (default), <code>gemini-3.5-flash-lite</code>, or <code>gemini-3.6-flash</code>.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-base">task_alt</span>
              Success Response (HTTP 200 OK)
            </h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
              <pre className="text-xs text-emerald-400 font-mono leading-relaxed m-0"><code>{sampleSuccessJson}</code></pre>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
