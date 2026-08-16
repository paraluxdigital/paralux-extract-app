import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { createApiKey, subscribeToUserApiKeys, revokeApiKey } from '../services/firebase';
import type { ApiKeyItem, CreatedKeySecret } from '../types/auth';

export const ApiKeysManager: React.FC = () => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [environment, setEnvironment] = useState<'test' | 'live'>('test');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<CreatedKeySecret | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setKeys([]);
      return;
    }

    const unsubscribe = subscribeToUserApiKeys(currentUser.uid, (userKeys) => {
      setKeys(userKeys);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleOpenCreateModal = () => {
    if (!currentUser) {
      openAuthModal('signup');
      return;
    }
    setKeyName('');
    setEnvironment(userProfile?.tier === 'free' ? 'test' : 'live');
    setCreatedSecret(null);
    setCopiedKey(false);
    setIsCreateModalOpen(true);
  };

  const handleCreateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;

    setIsSubmitting(true);
    try {
      const rateLimit = userProfile.tier === 'free' ? 5 : environment === 'live' ? 30 : 10;
      const result = await createApiKey({
        userId: currentUser.uid,
        name: keyName.trim() || `${environment === 'live' ? 'Production' : 'Sandbox'} Key`,
        environment,
        rateLimitRpm: rateLimit,
      });
      setCreatedSecret(result);
    } catch (err) {
      console.error('Failed to create API key:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySecret = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret.rawKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await revokeApiKey(keyId);
      setRevokeConfirmId(null);
    } catch (err) {
      console.error('Failed to revoke API key:', err);
    }
  };

  const creditsRemaining = userProfile?.creditsRemaining ?? 50;
  const creditsTotal = userProfile?.creditsTotalAllocated ?? 50;
  const percentUsed = Math.min(100, Math.max(0, Math.round(((creditsTotal - creditsRemaining) / creditsTotal) * 100)));

  return (
    <section id="keys" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#4a5568]">
          <div>
            <span className="text-xs font-bold font-mono text-[#dd6b20] uppercase tracking-widest block mb-1">
              Developer Credentials & Access
            </span>
            <h2 className="text-3xl font-display font-black text-[#f7fafc]">API Keys & Quota Management</h2>
            <p className="text-xs sm:text-sm text-[#a0aec0] mt-1">
              Generate secret keys for programmatic document extraction via REST API, Python SDK, and cURL.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs transition-all shadow-md shadow-[#dd6b20]/20 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Create New API Key</span>
          </button>
        </div>

        {/* Quota & Plan Overview Cards */}
        {currentUser && userProfile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Free / Active Plan Status */}
            <div className="bg-[#202734] border border-[#4a5568] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#a0aec0] uppercase tracking-wider">Active Plan</span>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                  userProfile.tier === 'free'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {userProfile.tier.toUpperCase()} TIER
                </span>
              </div>

              <div className="my-3">
                <div className="text-2xl font-bold font-display text-[#f7fafc] capitalize">
                  {userProfile.tier === 'free' ? 'Developer Sandbox' : `${userProfile.tier} Plan`}
                </div>
                <div className="text-xs text-[#a0aec0] mt-0.5">
                  {userProfile.tier === 'free'
                    ? 'Includes 50 free lifetime extraction credits for evaluation'
                    : 'Active monthly subscription'}
                </div>
              </div>

              <a
                href="#pricing"
                className="text-xs text-[#dd6b20] hover:text-[#f7fafc] flex items-center gap-1 font-bold transition-colors pt-2 border-t border-[#4a5568]"
              >
                <span>Upgrade plan for higher volume</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>

            {/* Credit Quota Progress */}
            <div className="bg-[#202734] border border-[#4a5568] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#a0aec0] uppercase tracking-wider">Credits Remaining</span>
                <span className="text-xs font-mono text-[#dd6b20] font-bold">
                  {creditsRemaining} / {creditsTotal} Left
                </span>
              </div>

              <div className="my-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-[#f7fafc]">{creditsRemaining}</span>
                  <span className="text-xs text-[#a0aec0] font-mono">docs remaining</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#1a202c] rounded-full h-2 mt-3 overflow-hidden border border-[#4a5568]/50">
                  <div
                    className="h-full bg-[#dd6b20] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, 100 - percentUsed)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#a0aec0] font-mono pt-2 border-t border-[#4a5568]">
                <span>Lifetime Used: {userProfile.totalExtractionsCount} docs</span>
                <span>{percentUsed}% Consumed</span>
              </div>
            </div>

            {/* Rate Limits & Engine Access */}
            <div className="bg-[#202734] border border-[#4a5568] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#a0aec0] uppercase tracking-wider">Rate Limit Policy</span>
                <span className="material-symbols-outlined text-[#a0aec0] text-base">speed</span>
              </div>

              <div className="my-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a0aec0]">Throughput Cap:</span>
                  <span className="font-mono text-[#f7fafc] font-bold">
                    {userProfile.tier === 'free' ? '5 req / min' : '30 req / min'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a0aec0]">Default AI Engine:</span>
                  <span className="font-mono text-[#dd6b20] font-bold">Gemini 3.1 Flash-Lite</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a0aec0]">Max Document Size:</span>
                  <span className="font-mono text-[#f7fafc] font-bold">
                    {userProfile.tier === 'free' ? '2 MB / 3 pages' : '20 MB / 50 pages'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-[#a0aec0] pt-2 border-t border-[#4a5568] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#2f9e44] text-xs">verified</span>
                <span>Zero downtime SLA & automatic retry headers</span>
              </div>
            </div>

          </div>
        ) : (
          /* Logged-out Banner */
          <div className="bg-gradient-to-r from-[#202734] to-[#2d3748] border border-[#dd6b20]/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#dd6b20]/20 text-[#dd6b20] flex items-center justify-center border border-[#dd6b20]/40 shrink-0">
                <span className="material-symbols-outlined text-2xl">lock_open</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#f7fafc]">Sign in to generate live API keys & claim 50 free credits</h3>
                <p className="text-xs text-[#a0aec0] mt-0.5">
                  Instant access to the REST extraction API, SDK tokens, and usage metrics dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 rounded-xl bg-[#202734] hover:bg-[#2d3748] text-[#f7fafc] border border-[#4a5568] text-xs font-bold transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white text-xs font-bold transition-all shadow-md shadow-[#dd6b20]/20 cursor-pointer"
              >
                Create Account (50 Free Credits)
              </button>
            </div>
          </div>
        )}

        {/* API Keys Table */}
        <div className="bg-[#202734] border border-[#4a5568] rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 sm:p-5 border-b border-[#4a5568] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#f7fafc] uppercase tracking-wider flex items-center gap-2 font-display">
              <span className="material-symbols-outlined text-[#dd6b20] text-base">vpn_key</span>
              Active API Keys ({keys.length})
            </h3>
            <span className="text-[11px] text-[#a0aec0] font-mono">
              Keys are securely stored with SHA-256 hashing
            </span>
          </div>

          {keys.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center gap-3 text-[#a0aec0]">
              <div className="w-12 h-12 rounded-full bg-[#1a202c] border border-[#4a5568] flex items-center justify-center text-[#a0aec0]">
                <span className="material-symbols-outlined text-2xl">key_off</span>
              </div>
              <p className="text-xs font-medium">No API keys generated yet.</p>
              <button
                onClick={handleOpenCreateModal}
                className="text-xs text-[#dd6b20] hover:underline font-bold cursor-pointer"
              >
                + Create your first API key
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#1a202c] border-b border-[#4a5568] text-[#a0aec0] font-mono uppercase text-[10px]">
                    <th className="py-3 px-4">Name / Label</th>
                    <th className="py-3 px-4">Key Token</th>
                    <th className="py-3 px-4">Environment</th>
                    <th className="py-3 px-4">Rate Limit</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4a5568]/50">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-[#2d3748]/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#f7fafc]">{k.name}</td>
                      <td className="py-3.5 px-4 font-mono text-[#dd6b20]">{k.keyPrefix}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          k.environment === 'live'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {k.environment}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#a0aec0]">{k.rateLimitRpm} RPM</td>
                      <td className="py-3.5 px-4 text-[#a0aec0] font-mono">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          k.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {k.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {k.status === 'active' ? (
                          revokeConfirmId === k.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[11px] text-red-400">Sure?</span>
                              <button
                                onClick={() => handleRevoke(k.id)}
                                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Yes, Revoke
                              </button>
                              <button
                                onClick={() => setRevokeConfirmId(null)}
                                className="px-2 py-0.5 rounded bg-[#4a5568] hover:bg-[#718096] text-white text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRevokeConfirmId(k.id)}
                              className="text-red-400 hover:text-red-300 font-mono text-[11px] underline hover:no-underline cursor-pointer"
                            >
                              Revoke
                            </button>
                          )
                        ) : (
                          <span className="text-[#a0aec0] text-[11px] italic">Revoked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* CREATE KEY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#202734] border border-[#4a5568] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#dd6b20]/20 text-[#dd6b20] flex items-center justify-center border border-[#dd6b20]/30">
                  <span className="material-symbols-outlined text-xl">key</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-[#f7fafc]">
                    {createdSecret ? 'API Key Generated' : 'Create New API Key'}
                  </h3>
                  <p className="text-xs text-[#a0aec0]">
                    {createdSecret
                      ? 'Copy and securely store this secret now'
                      : 'Configure credentials for your application'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#a0aec0] hover:text-white transition-colors cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {createdSecret ? (
              /* REVEAL SECRET SCREEN */
              <div className="flex flex-col gap-5">
                
                {/* Warning Alert */}
                <div className="bg-amber-900/30 border border-amber-500/50 rounded-xl p-3.5 flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-400 text-lg shrink-0 mt-0.5">warning</span>
                  <div className="text-xs text-amber-200 leading-relaxed">
                    <strong>Save this key immediately!</strong> For security reasons, Paralux does not store the plaintext key and you will <strong>never</strong> be able to view it again.
                  </div>
                </div>

                {/* Key Secret Code Box */}
                <div>
                  <label className="block text-[11px] font-mono text-[#a0aec0] uppercase tracking-wider mb-1.5">
                    Your Secret API Key
                  </label>
                  <div className="flex items-center gap-2 bg-[#1a202c] border border-[#dd6b20]/50 rounded-xl p-3 shadow-inner">
                    <code className="text-xs text-[#dd6b20] font-mono font-bold flex-1 break-all select-all">
                      {createdSecret.rawKey}
                    </code>
                    <button
                      onClick={handleCopySecret}
                      className="px-3 py-1.5 rounded-lg bg-[#dd6b20] hover:bg-[#c05621] text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {copiedKey ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedKey ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Usage Snippet */}
                <div className="bg-[#1a202c] border border-[#4a5568] rounded-xl p-3 flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono text-[#a0aec0] uppercase">Header Integration:</span>
                  <code className="text-xs font-mono text-[#2f9e44]">
                    x-api-key: {createdSecret.rawKey}
                  </code>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#2d3748] hover:bg-[#323f54] text-[#f7fafc] border border-[#4a5568] text-xs font-bold transition-all cursor-pointer"
                >
                  I have saved my API Key safely
                </button>
              </div>
            ) : (
              /* KEY CREATION FORM */
              <form onSubmit={handleCreateKeySubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#a0aec0] uppercase tracking-wider mb-1">
                    Key Name / Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. Backend Production Server, Zapier Hook"
                    className="w-full bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-xl px-3.5 py-2 text-xs text-[#f7fafc] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#a0aec0] uppercase tracking-wider mb-1">
                    Environment
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEnvironment('test')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        environment === 'test'
                          ? 'bg-[#dd6b20]/15 border-[#dd6b20] text-[#f7fafc]'
                          : 'bg-[#1a202c] border-[#4a5568] text-[#a0aec0] hover:border-[#718096]'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono">SANDBOX / TEST</div>
                      <div className="text-[11px] text-[#a0aec0] mt-0.5">Rate limit: 5 req/min</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnvironment('live')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        environment === 'live'
                          ? 'bg-[#dd6b20]/15 border-[#dd6b20] text-[#f7fafc]'
                          : 'bg-[#1a202c] border-[#4a5568] text-[#a0aec0] hover:border-[#718096]'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono">LIVE / PRODUCTION</div>
                      <div className="text-[11px] text-[#a0aec0] mt-0.5">Rate limit: 30 req/min</div>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#4a5568]">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs transition-all shadow-md shadow-[#dd6b20]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    ) : (
                      <>
                        <span>Generate Secret Key</span>
                        <span className="material-symbols-outlined text-sm">key</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </section>
  );
};
