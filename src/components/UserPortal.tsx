import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { Playground } from './Playground';
import { ApiKeysManager } from './ApiKeysManager';
import { CodeExporter } from './CodeExporter';
import { ApiDocs } from './ApiDocs';

interface UserPortalProps {
  onBackToLanding: () => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({ onBackToLanding }) => {
  const { userProfile, openAuthModal, currentUser } = useAuth();
  const [portalTab, setPortalTab] = useState<'workbench' | 'keys' | 'docs' | 'snippets'>('workbench');

  const creditsRemaining = userProfile?.creditsRemaining ?? 50;
  const creditsTotal = userProfile?.creditsTotalAllocated ?? 50;

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
      
      {/* Portal Top Bar */}
      <div className="bg-[#202734] border border-[#4a5568] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-[#dd6b20]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToLanding}
              className="text-xs font-mono text-[#a0aec0] hover:text-[#f7fafc] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Landing Page</span>
            </button>
            <span className="text-[#4a5568]">/</span>
            <span className="text-xs font-mono text-[#dd6b20] font-bold uppercase">Developer Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-black text-[#f7fafc] mt-1">
            {currentUser ? `Welcome, ${userProfile?.displayName || 'Developer'}` : 'Developer Sandbox Portal'}
          </h1>
          <p className="text-xs text-[#a0aec0]">
            Build custom schemas, generate secret API keys, and test document extractions in real-time.
          </p>
        </div>

        {/* Portal Stats & Plan Overview */}
        <div className="flex items-center gap-4 z-10">
          {currentUser && userProfile ? (
            <div className="flex items-center gap-3 bg-[#1a202c] p-3 rounded-2xl border border-[#4a5568]">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#a0aec0] uppercase">Balance</span>
                <span className="text-sm font-bold font-mono text-[#dd6b20]">
                  ⚡ {creditsRemaining} / {creditsTotal} credits
                </span>
              </div>

              <div className="h-8 w-px bg-[#4a5568]"></div>

              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#a0aec0] uppercase">Plan Tier</span>
                <span className="text-xs font-bold font-mono text-[#f7fafc] uppercase">
                  {userProfile.tier}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('signup')}
              className="px-5 py-2.5 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs transition-all shadow-md shadow-[#dd6b20]/20 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">stars</span>
              <span>Claim 50 Free Credits</span>
            </button>
          )}
        </div>
      </div>

      {/* Portal Tabs Bar */}
      <div className="flex items-center gap-2 bg-[#202734] p-1.5 rounded-2xl border border-[#4a5568] overflow-x-auto max-w-full shadow-inner">
        <button
          onClick={() => setPortalTab('workbench')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            portalTab === 'workbench'
              ? 'bg-[#dd6b20] text-white shadow-sm'
              : 'text-[#a0aec0] hover:text-[#f7fafc] hover:bg-[#2d3748]'
          }`}
        >
          <span className="material-symbols-outlined text-base">tune</span>
          <span>Schema Workbench</span>
        </button>

        <button
          onClick={() => setPortalTab('keys')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            portalTab === 'keys'
              ? 'bg-[#dd6b20] text-white shadow-sm'
              : 'text-[#a0aec0] hover:text-[#f7fafc] hover:bg-[#2d3748]'
          }`}
        >
          <span className="material-symbols-outlined text-base">vpn_key</span>
          <span>API Keys & Limits</span>
        </button>

        <button
          onClick={() => setPortalTab('docs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            portalTab === 'docs'
              ? 'bg-[#dd6b20] text-white shadow-sm'
              : 'text-[#a0aec0] hover:text-[#f7fafc] hover:bg-[#2d3748]'
          }`}
        >
          <span className="material-symbols-outlined text-base">api</span>
          <span>REST API Specs</span>
        </button>

        <button
          onClick={() => setPortalTab('snippets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            portalTab === 'snippets'
              ? 'bg-[#dd6b20] text-white shadow-sm'
              : 'text-[#a0aec0] hover:text-[#f7fafc] hover:bg-[#2d3748]'
          }`}
        >
          <span className="material-symbols-outlined text-base">code</span>
          <span>SDK Code Snippets</span>
        </button>
      </div>

      {/* Active Tab View */}
      <div>
        {portalTab === 'workbench' && <Playground />}
        {portalTab === 'keys' && <ApiKeysManager />}
        {portalTab === 'docs' && <ApiDocs />}
        {portalTab === 'snippets' && <CodeExporter />}
      </div>

    </div>
  );
};
