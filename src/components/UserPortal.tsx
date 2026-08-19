import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigation } from '../context/useNavigation';
import { Playground } from './Playground';
import { ApiKeysManager } from './ApiKeysManager';
import { CodeExporter } from './CodeExporter';
import { ApiDocs } from './ApiDocs';
import { CreditTopupModal } from './CreditTopupModal';

const TAB_TITLES: Record<string, string> = {
  workbench: 'Schema Workbench',
  keys: 'API Keys & Limits',
  docs: 'REST API Specs',
  snippets: 'SDK Code Snippets',
};

export const UserPortal: React.FC = () => {
  const { userProfile, openAuthModal, currentUser, loading } = useAuth();
  const { portalTab, navigateToPortal, navigateToLanding } = useNavigation();
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const creditsRemaining = userProfile?.creditsRemaining ?? 50;
  const creditsTotal = userProfile?.creditsTotalAllocated ?? 50;
  const alertThreshold = userProfile?.alertThreshold || 50;
  const dailyBurnRate = userProfile?.dailyBurnRate || Math.max(5, Math.round((userProfile?.totalExtractionsCount || 14) / 7));
  const runwayDays = (creditsRemaining / Math.max(1, dailyBurnRate)).toFixed(1);
  const isLowBalance = creditsRemaining <= alertThreshold;
  const isLowRunway = Number(runwayDays) <= 2.0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Loading state while Firebase auth initializes
  if (loading) {
    return (
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <span className="material-symbols-outlined text-[#dd6b20] text-4xl animate-spin">
          progress_activity
        </span>
        <span className="text-xs font-mono text-[#a0aec0] tracking-wider uppercase">
          Loading Developer Session...
        </span>
      </div>
    );
  }

  // Authentication Gate Screen for unauthenticated visitors
  if (!currentUser) {
    return (
      <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8 animate-fade-in">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#a0aec0]">
          <button
            onClick={() => navigateToLanding()}
            className="hover:text-[#f7fafc] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            <span>Home</span>
          </button>
          <span className="text-[#4a5568]">/</span>
          <span className="text-[#dd6b20] font-bold">Developer Portal</span>
          <span className="text-[#4a5568]">/</span>
          <span className="text-[#f7fafc]">Authentication Required</span>
        </div>

        {/* Central Auth Gate Card */}
        <div className="bg-[#202734] border border-[#4a5568] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-[#dd6b20]/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Icon Badge */}
          <div className="size-16 rounded-2xl bg-[#dd6b20]/15 text-[#dd6b20] border border-[#dd6b20]/30 flex items-center justify-center mb-6 shadow-md shadow-[#dd6b20]/10">
            <span className="material-symbols-outlined text-3xl">terminal</span>
          </div>

          <span className="text-xs font-bold font-mono text-[#dd6b20] uppercase tracking-widest block mb-2">
            Developer Sandbox & Production Portal
          </span>

          <h2 className="text-3xl sm:text-4xl font-display font-black text-[#f7fafc] max-w-xl leading-tight mb-4">
            Sign in to access your Developer Portal & Workbench
          </h2>

          <p className="text-sm text-[#a0aec0] max-w-lg leading-relaxed mb-8">
            Create your account to get <strong className="text-[#f7fafc]">50 free document extraction credits</strong>, generate secret API keys, and test custom document extractions in real-time.
          </p>

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl text-left mb-10">
            
            <div className="bg-[#1a202c] p-4 rounded-2xl border border-[#4a5568]/80 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#dd6b20] text-xl shrink-0 mt-0.5">stars</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[#f7fafc]">50 Free Extraction Credits</span>
                <span className="text-[11px] text-[#a0aec0] leading-snug">
                  Automatically loaded upon sign up. No credit card required.
                </span>
              </div>
            </div>

            <div className="bg-[#1a202c] p-4 rounded-2xl border border-[#4a5568]/80 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#dd6b20] text-xl shrink-0 mt-0.5">vpn_key</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[#f7fafc]">Secret API Key Generator</span>
                <span className="text-[11px] text-[#a0aec0] leading-snug">
                  Provision live keys for Node.js, Python, and cURL integrations.
                </span>
              </div>
            </div>

            <div className="bg-[#1a202c] p-4 rounded-2xl border border-[#4a5568]/80 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#dd6b20] text-xl shrink-0 mt-0.5">verified_user</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[#f7fafc]">24-Hour Ephemeral Retention</span>
                <span className="text-[11px] text-[#a0aec0] leading-snug">
                  Zero storage fees. Documents are auto-purged from cloud storage.
                </span>
              </div>
            </div>

            <div className="bg-[#1a202c] p-4 rounded-2xl border border-[#4a5568]/80 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#dd6b20] text-xl shrink-0 mt-0.5">analytics</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[#f7fafc]">Live Extraction Inspector</span>
                <span className="text-[11px] text-[#a0aec0] leading-snug">
                  Test custom JSON schemas with real-time preflight cost estimation.
                </span>
              </div>
            </div>

          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <button
              onClick={() => openAuthModal('signup')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#dd6b20]/25 transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#dd6b20] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">stars</span>
              <span>Create Free Account (50 Credits)</span>
            </button>

            <button
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#2d3748] hover:bg-[#3a4659] text-[#f7fafc] font-bold text-xs uppercase tracking-wider border border-[#4a5568] hover:border-[#dd6b20] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Sign In</span>
            </button>
          </div>

          {/* Back link */}
          <button
            onClick={() => navigateToLanding()}
            className="mt-6 text-xs text-[#a0aec0] hover:text-[#f7fafc] flex items-center gap-1 font-mono transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Return to Landing Page</span>
          </button>

        </div>

      </div>
    );
  }

  // Authenticated Developer Portal
  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8 animate-fade-in">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2f9e44] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce border border-white/20">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Portal Top Bar */}
      <div className="bg-[#202734] border border-[#4a5568] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-[#dd6b20]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col gap-1 z-10">
          {/* Breadcrumbs with URL Navigation */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#a0aec0] flex-wrap">
            <button
              onClick={() => navigateToLanding()}
              className="hover:text-[#f7fafc] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              <span>Home</span>
            </button>
            <span className="text-[#4a5568]">/</span>
            <button
              onClick={() => navigateToPortal('workbench')}
              className="hover:text-[#f7fafc] transition-colors cursor-pointer font-bold text-[#dd6b20]"
            >
              Developer Portal
            </button>
            <span className="text-[#4a5568]">/</span>
            <span className="text-[#f7fafc] font-semibold">
              {TAB_TITLES[portalTab] || 'Workbench'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-black text-[#f7fafc] mt-1">
            Welcome, {userProfile?.displayName || currentUser.email?.split('@')[0] || 'Developer'}
          </h1>
          <p className="text-xs text-[#a0aec0]">
            Build custom schemas, generate secret API keys, and test document extractions in real-time.
          </p>
        </div>

        {/* Portal Stats & Plan Overview */}
        <div className="flex items-center gap-4 z-10 flex-wrap">
          <div className="flex items-center gap-3 bg-[#1a202c] p-2.5 sm:p-3 rounded-2xl border border-[#4a5568]">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-[#a0aec0] uppercase">Balance</span>
              <span className="text-sm font-bold font-mono text-[#dd6b20]">
                ⚡ {creditsRemaining} / {creditsTotal} credits
              </span>
            </div>

            <button
              onClick={() => setIsTopupModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-[10px] uppercase font-mono transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              title="Top up credits"
            >
              <span className="material-symbols-outlined text-xs">add</span>
              <span>Top Up</span>
            </button>

            <div className="h-8 w-px bg-[#4a5568]"></div>

            {/* Predictive Runway Stats Chip */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-[#a0aec0] uppercase">Est. Runway</span>
              <span className={`text-xs font-bold font-mono ${isLowRunway ? 'text-[#ff6b6b]' : 'text-[#38d9a9]'}`}>
                {runwayDays} Days <span className="text-[10px] text-[#a0aec0] font-normal">(~{dailyBurnRate}/day)</span>
              </span>
            </div>

            <div className="h-8 w-px bg-[#4a5568]"></div>

            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-[#a0aec0] uppercase">Plan Tier</span>
              <span className="text-xs font-bold font-mono text-[#f7fafc] uppercase">
                {userProfile?.tier || 'free'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Low Balance / Low Runway Warning Banner */}
      {isLowBalance && (
        <div className="bg-[#e03131]/15 border border-[#e03131]/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#e03131]/20 text-[#ff6b6b] shrink-0">
              <span className="material-symbols-outlined text-xl">warning</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#f7fafc]">
                Low Credit Balance Alert ({creditsRemaining} Credits Remaining)
              </h4>
              <p className="text-[11px] text-[#a0aec0] mt-0.5">
                Your remaining credit balance is at or below your alert threshold ({alertThreshold} credits). Automated ingestion pipelines may pause once depleted.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTopupModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs font-mono uppercase transition-all shrink-0 cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span>Add Credits Now</span>
          </button>
        </div>
      )}

      {/* Portal Tabs Bar (Synchronized with URL) */}
      <div className="flex items-center gap-2 bg-[#202734] p-1.5 rounded-2xl border border-[#4a5568] overflow-x-auto max-w-full shadow-inner">
        <button
          onClick={() => navigateToPortal('workbench')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            portalTab === 'workbench'
              ? 'bg-[#dd6b20] text-white shadow-md'
              : 'text-[#a0aec0] hover:text-[#f7fafc] hover:bg-[#2d3748]'
          }`}
        >
          <span className="material-symbols-outlined text-base">tune</span>
          <span>Schema Workbench</span>
        </button>

        <button
          onClick={() => navigateToPortal('keys')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            portalTab === 'keys'
              ? 'bg-[#dd6b20] text-white shadow-md'
              : 'text-[#a0aec0] hover:text-[#f7fafc] hover:bg-[#2d3748]'
          }`}
        >
          <span className="material-symbols-outlined text-base">vpn_key</span>
          <span>API Keys & Limits</span>
        </button>

        <button
          onClick={() => navigateToPortal('docs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            portalTab === 'docs'
              ? 'bg-[#dd6b20] text-white shadow-md'
              : 'text-[#a0aec0] hover:text-[#f7fafc] hover:bg-[#2d3748]'
          }`}
        >
          <span className="material-symbols-outlined text-base">api</span>
          <span>REST API Specs</span>
        </button>

        <button
          onClick={() => navigateToPortal('snippets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            portalTab === 'snippets'
              ? 'bg-[#dd6b20] text-white shadow-md'
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

      {/* Topup Modal */}
      <CreditTopupModal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        onSuccess={(added) => showToast(`Added ${added.toLocaleString()} credits to your account!`)}
      />

    </div>
  );
};
