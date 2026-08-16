import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';

interface NavbarProps {
  currentView: 'landing' | 'portal';
  setCurrentView: (view: 'landing' | 'portal') => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, onNavigateSection }) => {
  const { currentUser, userProfile, openAuthModal, handleLogout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNavSection = (sectionId: string) => {
    if (currentView !== 'landing') {
      setCurrentView('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          const offset = 80;
          const pos = el.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: pos, behavior: 'smooth' });
        }
      }, 100);
    } else if (onNavigateSection) {
      onNavigateSection(sectionId);
    }
    setMobileMenuOpen(false);
  };

  const creditsRemaining = userProfile?.creditsRemaining ?? 50;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a202c]/95 backdrop-blur-md border-b border-[#4a5568]/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Authentic Paralux Digital Brand Mark */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => {
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="relative size-9 rounded-xl bg-[#2d3748] border border-[#4a5568] flex items-center justify-center p-1.5 shadow-sm group-hover:border-[#dd6b20] transition-all">
            <img 
              src="/favicon.svg" 
              alt="Paralux Digital" 
              className="size-full object-contain filter drop-shadow-[0_0_6px_rgba(221,107,32,0.4)]" 
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-base tracking-tight text-[#f7fafc] group-hover:text-[#dd6b20] transition-colors">
                Paralux
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#dd6b20]/15 text-[#dd6b20] border border-[#dd6b20]/30 uppercase tracking-wide">
                Extract AI
              </span>
            </div>
            <span className="text-[10px] text-[#a0aec0] font-medium tracking-wider uppercase">Intelligent Document Extraction</span>
          </div>
        </div>

        {/* Navigation Links / View Switcher */}
        {currentView === 'landing' ? (
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#a0aec0]">
            <button
              onClick={() => handleNavSection('features')}
              className="hover:text-[#f7fafc] transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button
              onClick={() => handleNavSection('pricing')}
              className="hover:text-[#f7fafc] transition-colors cursor-pointer"
            >
              Pricing & ROI
            </button>
            <button
              onClick={() => handleNavSection('docs')}
              className="hover:text-[#f7fafc] transition-colors cursor-pointer"
            >
              REST API
            </button>
            <button
              onClick={() => handleNavSection('snippets')}
              className="hover:text-[#f7fafc] transition-colors cursor-pointer"
            >
              SDKs
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setCurrentView('landing')}
              className="px-3 py-1.5 rounded-xl bg-[#202734] border border-[#4a5568] hover:border-[#dd6b20] text-xs font-mono text-[#a0aec0] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Landing Page</span>
            </button>
          </div>
        )}

        {/* Right Action: Portal Launcher / User Profile */}
        <div className="hidden sm:flex items-center gap-3">
          
          {currentView === 'landing' && (
            <button
              onClick={() => setCurrentView('portal')}
              className="px-4 py-2 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs shadow-md shadow-[#dd6b20]/20 transition-all flex items-center gap-1.5 cursor-pointer border border-[#dd6b20] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">terminal</span>
              <span>Launch Portal</span>
            </button>
          )}

          {currentUser && userProfile ? (
            /* Logged-in User Profile Dropdown */
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#202734] border border-[#4a5568] hover:border-[#dd6b20] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#dd6b20]/15 text-[#dd6b20] font-mono text-[11px] font-bold">
                  <span className="material-symbols-outlined text-xs">bolt</span>
                  <span>{creditsRemaining} credits</span>
                </div>

                <div className="w-6 h-6 rounded-full bg-[#dd6b20] text-white flex items-center justify-center font-bold text-xs">
                  {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>

                <span className="material-symbols-outlined text-[#a0aec0] text-sm">
                  {userDropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#202734] border border-[#4a5568] rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 animate-fade-in">
                  <div className="px-3 py-2 border-b border-[#4a5568]">
                    <div className="text-xs font-bold text-[#f7fafc] truncate">{userProfile.displayName}</div>
                    <div className="text-[10px] text-[#a0aec0] font-mono truncate">{userProfile.email}</div>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-[#dd6b20] uppercase font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#dd6b20]"></span>
                      <span>{userProfile.tier} Tier</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentView('portal');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left text-xs text-[#f7fafc] hover:bg-[#2d3748] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm text-[#dd6b20]">terminal</span>
                    <span>Open Workbench Portal</span>
                  </button>

                  <button
                    onClick={() => {
                      handleNavSection('pricing');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left text-xs text-[#f7fafc] hover:bg-[#2d3748] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm text-[#2f9e44]">upgrade</span>
                    <span>Upgrade Plan</span>
                  </button>

                  <div className="h-px bg-[#4a5568] my-1"></div>

                  <button
                    onClick={async () => {
                      setUserDropdownOpen(false);
                      await handleLogout();
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out State */
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#f7fafc] hover:bg-[#202734] transition-colors cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={() => openAuthModal('signup')}
                className="px-3.5 py-1.5 rounded-lg bg-[#2d3748] hover:bg-[#323f54] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border border-[#4a5568]"
              >
                <span className="material-symbols-outlined text-sm text-[#dd6b20]">stars</span>
                <span>Get 50 Credits</span>
              </button>
            </div>
          )}

        </div>

        {/* Mobile Hamburger Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#202734] border border-[#4a5568] text-[#f7fafc] hover:text-[#dd6b20]"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1a202c] border-b border-[#4a5568] px-4 pt-3 pb-6 flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          {currentView === 'landing' ? (
            <>
              <button
                onClick={() => {
                  setCurrentView('portal');
                  setMobileMenuOpen(false);
                }}
                className="p-3 rounded-lg text-xs font-bold bg-[#dd6b20] text-white flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">terminal</span>
                <span>Launch Developer Portal</span>
              </button>
              <button
                onClick={() => handleNavSection('features')}
                className="p-3 rounded-lg text-xs font-semibold text-[#a0aec0] hover:bg-[#2d3748] text-left"
              >
                Capabilities
              </button>
              <button
                onClick={() => handleNavSection('pricing')}
                className="p-3 rounded-lg text-xs font-semibold text-[#a0aec0] hover:bg-[#2d3748] text-left"
              >
                Pricing & ROI
              </button>
              <button
                onClick={() => handleNavSection('docs')}
                className="p-3 rounded-lg text-xs font-semibold text-[#a0aec0] hover:bg-[#2d3748] text-left"
              >
                REST API
              </button>
              <button
                onClick={() => handleNavSection('snippets')}
                className="p-3 rounded-lg text-xs font-semibold text-[#a0aec0] hover:bg-[#2d3748] text-left"
              >
                SDKs
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setCurrentView('landing');
                setMobileMenuOpen(false);
              }}
              className="p-3 rounded-lg text-xs font-bold bg-[#202734] border border-[#4a5568] text-white flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Landing Page</span>
            </button>
          )}

          <div className="pt-3 border-t border-[#4a5568] flex items-center justify-between">
            {currentUser ? (
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await handleLogout();
                }}
                className="text-xs text-red-400 font-bold"
              >
                Sign Out ({currentUser.email})
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="w-full py-2 bg-[#dd6b20] text-white rounded-lg text-xs font-bold"
              >
                Sign In / Get 50 Free Credits
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
