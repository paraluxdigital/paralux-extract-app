import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { CREDIT_PACKS, type CreditPack } from '../types/auth';
import { purchaseCreditPack } from '../services/firebase';

interface CreditTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCreditsNeeded?: number;
  onSuccess?: (addedCredits: number) => void;
}

export const CreditTopupModal: React.FC<CreditTopupModalProps> = ({
  isOpen,
  onClose,
  requiredCreditsNeeded,
  onSuccess,
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const [selectedPackId, setSelectedPackId] = useState<string>('pack_1000');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedPack = CREDIT_PACKS.find((p) => p.id === selectedPackId) || CREDIT_PACKS[1];
  const currentBalance = userProfile?.creditsRemaining ?? 0;

  const handlePurchase = async (pack: CreditPack) => {
    if (!currentUser) {
      onClose();
      openAuthModal('signup');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      await purchaseCreditPack(currentUser.uid, pack.id, pack.credits);
      setIsProcessing(false);
      if (onSuccess) {
        onSuccess(pack.credits);
      }
      onClose();
    } catch (err: any) {
      console.error('Purchase failed:', err);
      setErrorMsg(err.message || 'Failed to complete credit purchase.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="bg-[#202734] border border-[#4a5568] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effect */}
        <div className="absolute top-0 right-1/3 w-64 h-24 bg-[#dd6b20]/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dd6b20]/15 border border-[#dd6b20]/30 text-[#dd6b20] text-xs font-mono font-bold uppercase tracking-widest self-start">
              <span className="material-symbols-outlined text-sm">bolt</span>
              <span>Pay-As-You-Go Credit Packs</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-[#f7fafc] mt-1">
              Top Up Document Credits
            </h2>
            <p className="text-xs text-[#a0aec0]">
              No monthly subscription required. Credits never expire and work across all extraction modes.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-[#a0aec0] hover:text-white p-2 rounded-xl hover:bg-[#2d3748] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Warning if insufficient credits triggered this modal */}
        {requiredCreditsNeeded && requiredCreditsNeeded > currentBalance && (
          <div className="bg-[#dd6b20]/10 border border-[#dd6b20]/30 rounded-2xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#dd6b20] text-xl shrink-0">info</span>
            <div className="text-xs text-[#f7fafc]">
              This extraction requires <strong className="text-[#dd6b20] font-mono">{requiredCreditsNeeded} credits</strong>. Your current balance is <strong className="font-mono text-[#a0aec0]">{currentBalance} credits</strong>.
            </div>
          </div>
        )}

        {/* Balance Status Banner */}
        <div className="bg-[#1a202c] p-4 rounded-2xl border border-[#4a5568] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#dd6b20]/20 border border-[#dd6b20]/40 flex items-center justify-center text-[#dd6b20]">
              <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-[#a0aec0] block">Current Balance</span>
              <span className="text-base font-bold font-mono text-[#f7fafc]">
                ⚡ {currentBalance.toLocaleString()} Credits Available
              </span>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#202734] border border-[#4a5568] text-[#a0aec0] uppercase">
            Tier: {userProfile?.tier || 'Free'}
          </span>
        </div>

        {/* Packs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CREDIT_PACKS.map((pack) => {
            const isSelected = selectedPackId === pack.id;
            return (
              <div
                key={pack.id}
                onClick={() => setSelectedPackId(pack.id)}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#2d3748] border-[#dd6b20] shadow-lg ring-1 ring-[#dd6b20]'
                    : 'bg-[#1a202c] border-[#4a5568] hover:border-[#718096]'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 right-4 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#dd6b20] text-white shadow-sm border border-[#dd6b20]">
                    Best Value
                  </span>
                )}

                <div>
                  <h3 className="text-sm font-bold text-[#f7fafc] font-display">{pack.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1 mb-1">
                    <span className="text-2xl font-black text-[#f7fafc] font-mono">${pack.priceUsd}</span>
                    <span className="text-[10px] text-[#a0aec0]">one-time</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#dd6b20] font-semibold mb-3">
                    ${pack.pricePerCredit.toFixed(3)} / credit
                  </div>
                  <div className="text-xs font-bold text-[#f7fafc] font-mono bg-[#202734] px-2 py-1 rounded-lg border border-[#4a5568] text-center mb-3">
                    ⚡ {pack.credits.toLocaleString()} Credits
                  </div>

                  <ul className="space-y-1.5 text-[11px] text-[#a0aec0]">
                    {pack.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs text-[#dd6b20]">check</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#e53e3e]/15 border border-[#e53e3e]/30 rounded-xl text-xs text-[#fc8181]">
            {errorMsg}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-[#4a5568]">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#a0aec0]">Selected Pack</span>
            <span className="text-sm font-bold text-[#f7fafc]">
              {selectedPack.name} ({selectedPack.credits.toLocaleString()} Credits for ${selectedPack.priceUsd})
            </span>
          </div>

          <button
            onClick={() => handlePurchase(selectedPack)}
            disabled={isProcessing}
            className="px-6 py-3 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#dd6b20]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">bolt</span>
                <span>Instant Top-Up (${selectedPack.priceUsd})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
