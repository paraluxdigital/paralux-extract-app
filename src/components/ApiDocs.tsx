import React, { useState } from 'react';

export const ApiDocs: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeResponseTab, setActiveResponseTab] = useState<'200' | '202' | '402'>('200');

  const sampleSuccessJson = JSON.stringify(
    {
      status: 'success',
      extractionId: 'px_9f82kd019x',
      extractionMode: 2,
      data: {
        invoiceNumber: 'INV-2026-889',
        date: '2026-07-22',
        clientName: 'Acme Software Inc.',
        totalAmount: 11000.0,
        taxAmount: 1000.0,
        lineItems: [
          { description: 'Web Application Development (50 hrs @ $120/hr)', amount: 6000.0 },
          { description: 'Cloud Architecture & Security Audit (1 unit)', amount: 1500.0 },
          { description: 'Document Extraction Pipeline Integration', amount: 2500.0 }
        ]
      },
      creditsUsed: 2,
      creditsRemaining: 48,
      executionTimeMs: 640,
      timestamp: 1787184000000
    },
    null,
    2
  );

  const sampleQueuedJson = JSON.stringify(
    {
      status: 'queued',
      jobId: 'job_88a91c7x2',
      jobStatus: 'paused_insufficient_credits',
      message: 'Job registered and held in queue. Extraction will automatically process as soon as credits are added to your account.',
      creditsRequired: 2,
      creditsAvailable: 0,
      pollUrl: '/api/jobs/job_88a91c7x2',
      topupUrl: 'https://extract.paralux.digital/pricing'
    },
    null,
    2
  );

  const sampleInsufficientCreditsJson = JSON.stringify(
    {
      status: 'error',
      code: 'INSUFFICIENT_CREDITS',
      error: 'Insufficient credit balance. This extraction requires 2 credits, but your account has 0.',
      creditsRequired: 2,
      creditsAvailable: 0,
      topupUrl: 'https://extract.paralux.digital/pricing'
    },
    null,
    2
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getActiveResponseCode = () => {
    if (activeResponseTab === '200') return sampleSuccessJson;
    if (activeResponseTab === '202') return sampleQueuedJson;
    return sampleInsufficientCreditsJson;
  };

  return (
    <section id="docs" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-[#2d3748] p-6 sm:p-8 rounded-3xl border border-[#4a5568] flex flex-col gap-8 shadow-lg">
        
        {/* Header */}
        <div className="pb-6 border-b border-[#4a5568] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold font-mono text-[#dd6b20] uppercase tracking-widest block mb-1">
              REST API Specification
            </span>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-[#dd6b20]/20 text-[#dd6b20] border border-[#dd6b20]/40 text-xs font-mono font-bold uppercase">
                POST
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-[#f7fafc] font-mono">/api/extract</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#a0aec0] font-mono">Base URL:</span>
            <code className="text-xs text-[#dd6b20] font-mono bg-[#202734] px-2.5 py-1 rounded-lg border border-[#4a5568]">
              https://extract.paralux.digital
            </code>
          </div>
        </div>

        {/* Request Specification & Response */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Request Headers & Payload Parameters */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-[#f7fafc] uppercase tracking-wider flex items-center gap-2 font-display">
              <span className="material-symbols-outlined text-[#dd6b20] text-base">input</span>
              Request Headers & Authorization
            </h3>

            <div className="bg-[#202734] p-4 rounded-xl border border-[#4a5568] flex flex-col gap-3 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-[#4a5568]">
                <span className="text-xs font-bold text-[#f7fafc] font-mono">Content-Type</span>
                <span className="text-xs text-[#dd6b20] font-mono">application/json</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#4a5568]">
                <span className="text-xs font-bold text-[#f7fafc] font-mono">x-api-key</span>
                <span className="text-xs text-[#a0aec0] font-mono">px_live_... (Secret API key)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#f7fafc] font-mono">x-user-id</span>
                <span className="text-xs text-[#a0aec0] font-mono">User / Tenant identifier (optional)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-[#a0aec0] uppercase tracking-wider font-mono">
                JSON Body Payload Parameters
              </span>
              
              <div className="bg-[#202734] p-4 rounded-xl border border-[#4a5568] flex flex-col gap-3.5 text-xs shadow-inner">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-[#dd6b20] font-mono text-xs">schema</strong>
                    <span className="text-[10px] font-bold text-[#e53e3e] uppercase font-mono">required</span>
                    <span className="text-[10px] text-[#a0aec0] font-mono">object</span>
                  </div>
                  <p className="text-[#a0aec0] mt-1 leading-relaxed">
                    JSON schema mapping target keys to type definitions and field descriptions.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#4a5568]">
                  <div className="flex items-center gap-2">
                    <strong className="text-[#dd6b20] font-mono text-xs">document | storagePath</strong>
                    <span className="text-[10px] font-bold text-[#e53e3e] uppercase font-mono">required (one of)</span>
                    <span className="text-[10px] text-[#a0aec0] font-mono">string | object</span>
                  </div>
                  <p className="text-[#a0aec0] mt-1 leading-relaxed">
                    Either raw text / base64 object (<code>document</code>) or a direct Cloud Storage path reference (<code>storagePath: "ephemeral/user123/invoice.pdf"</code>).
                  </p>
                </div>

                <div className="pt-3 border-t border-[#4a5568]">
                  <div className="flex items-center gap-2">
                    <strong className="text-[#dd6b20] font-mono text-xs">extractionMode</strong>
                    <span className="text-[10px] font-bold text-[#a0aec0] uppercase font-mono">optional (default: 1)</span>
                    <span className="text-[10px] text-[#a0aec0] font-mono">integer (1 | 2)</span>
                  </div>
                  <p className="text-[#a0aec0] mt-1 leading-relaxed">
                    <code>1</code> = <strong>Standard Extraction</strong> (1 Credit / 5 pages), <code>2</code> = <strong>Advanced Multimodal</strong> (2 Credits / 5 pages for complex tables and dense contracts).
                  </p>
                </div>

                <div className="pt-3 border-t border-[#4a5568]">
                  <div className="flex items-center gap-2">
                    <strong className="text-[#dd6b20] font-mono text-xs">webhookUrl</strong>
                    <span className="text-[10px] font-bold text-[#a0aec0] uppercase font-mono">optional</span>
                    <span className="text-[10px] text-[#a0aec0] font-mono">string (URL)</span>
                  </div>
                  <p className="text-[#a0aec0] mt-1 leading-relaxed">
                    Webhook endpoint URL. When supplied, extraction payloads are dispatched via HTTP POST asynchronously.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#4a5568]">
                  <div className="flex items-center gap-2">
                    <strong className="text-[#dd6b20] font-mono text-xs">queueIfInsufficient</strong>
                    <span className="text-[10px] font-bold text-[#a0aec0] uppercase font-mono">optional</span>
                    <span className="text-[10px] text-[#a0aec0] font-mono">boolean</span>
                  </div>
                  <p className="text-[#a0aec0] mt-1 leading-relaxed">
                    If <code>true</code>, requests with zero credits are held in the 24h queue (HTTP 202) and will auto-resume as soon as credits are added.
                  </p>
                </div>
              </div>
            </div>

            {/* Reliability & Zero Charge Guarantees */}
            <div className="bg-[#202734] p-4 rounded-xl border border-[#2f9e44]/40 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2f9e44]">
                <span className="material-symbols-outlined text-base">verified_user</span>
                <span>Zero-Charge on Failure & Ephemeral Privacy</span>
              </div>
              <p className="text-[11px] text-[#a0aec0] leading-relaxed">
                Credits are only permanently deducted after successful schema validation. If extraction fails, 0 credits are billed. Uploaded documents auto-purge after 24 hours.
              </p>
            </div>
          </div>

          {/* Response Inspector */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Response Code Tabs */}
              <div className="flex items-center gap-1 bg-[#202734] p-1 rounded-xl border border-[#4a5568]">
                <button
                  onClick={() => setActiveResponseTab('200')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeResponseTab === '200'
                      ? 'bg-[#2f9e44] text-white shadow'
                      : 'text-[#a0aec0] hover:text-[#f7fafc]'
                  }`}
                >
                  200 OK
                </button>
                <button
                  onClick={() => setActiveResponseTab('202')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeResponseTab === '202'
                      ? 'bg-[#dd6b20] text-white shadow'
                      : 'text-[#a0aec0] hover:text-[#f7fafc]'
                  }`}
                >
                  202 Queued
                </button>
                <button
                  onClick={() => setActiveResponseTab('402')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeResponseTab === '402'
                      ? 'bg-[#e53e3e] text-white shadow'
                      : 'text-[#a0aec0] hover:text-[#f7fafc]'
                  }`}
                >
                  402 Error
                </button>
              </div>

              <button
                onClick={() => handleCopy(getActiveResponseCode())}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#202734] border border-[#4a5568] text-[11px] font-medium text-[#a0aec0] hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs text-[#dd6b20]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="bg-[#1a202c] p-4 rounded-xl border border-[#4a5568] overflow-x-auto shadow-inner max-h-[460px]">
              <pre className={`text-xs font-mono leading-relaxed m-0 ${
                activeResponseTab === '200' ? 'text-[#2f9e44]' : activeResponseTab === '202' ? 'text-[#dd6b20]' : 'text-[#ff6b6b]'
              }`}>
                <code>{getActiveResponseCode()}</code>
              </pre>
            </div>

            {/* Error Codes Reference Table */}
            <div className="bg-[#202734] p-4 rounded-xl border border-[#4a5568] flex flex-col gap-2">
              <span className="text-[11px] font-mono font-bold text-[#a0aec0] uppercase tracking-wider">
                Standard Error Codes:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="text-[#ff6b6b]">INVALID_SCHEMA (400)</div>
                <div className="text-[#a0aec0]">Malformed schema object</div>
                <div className="text-[#ff6b6b]">INVALID_API_KEY (401)</div>
                <div className="text-[#a0aec0]">Missing/revoked secret key</div>
                <div className="text-[#ff6b6b]">INSUFFICIENT_CREDITS (402)</div>
                <div className="text-[#a0aec0]">Balance exhausted</div>
                <div className="text-[#ff6b6b]">RATE_LIMIT_EXCEEDED (429)</div>
                <div className="text-[#a0aec0]">Exceeded tier rate limit</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
