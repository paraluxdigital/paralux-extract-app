import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    handleGoogleLogin,
    handleEmailLogin,
    handleEmailSignup,
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const isLogin = authModalMode === 'login';

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError(null);
  };

  const handleToggleMode = (mode: 'login' | 'signup') => {
    resetForm();
    openAuthModal(mode);
  };

  const onGoogleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await handleGoogleLogin();
      resetForm();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await handleEmailLogin(email, password);
      } else {
        await handleEmailSignup(email, password, name);
      }
      resetForm();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#202734] border border-[#4a5568] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-[#dd6b20] rounded-b-full blur-md opacity-60"></div>

        {/* Close Button */}
        <button
          onClick={() => {
            resetForm();
            closeAuthModal();
          }}
          className="absolute top-5 right-5 text-[#a0aec0] hover:text-white transition-colors cursor-pointer p-1"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#dd6b20]/15 text-[#dd6b20] border border-[#dd6b20]/30 mb-3">
            <span className="material-symbols-outlined text-2xl">key</span>
          </div>
          <h3 className="text-2xl font-bold font-display text-[#f7fafc]">
            {isLogin ? 'Welcome Back' : 'Create Developer Account'}
          </h3>
          <p className="text-xs text-[#a0aec0] mt-1">
            {isLogin
              ? 'Access your API keys, usage metrics, and extraction quotas'
              : 'Get 50 Free Document Extraction Credits instantly'}
          </p>
        </div>

        {/* Free Credits Badge */}
        {!isLogin && (
          <div className="bg-[#2d3748] border border-[#dd6b20]/40 rounded-xl p-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#dd6b20] text-xl">stars</span>
            <div className="text-xs text-[#f7fafc]">
              <strong className="text-[#dd6b20] font-bold">50 Free Test Credits</strong> included upon sign up. No credit card required.
            </div>
          </div>
        )}

        {/* Error Box */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-3 text-xs text-red-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-400 text-base shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={onGoogleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#2d3748] hover:bg-[#323f54] text-[#f7fafc] border border-[#4a5568] transition-all font-medium text-xs shadow cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#4a5568]"></div>
          <span className="text-[11px] text-[#a0aec0] font-mono uppercase">Or with email</span>
          <div className="flex-1 h-px bg-[#4a5568]"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={onEmailSubmit} className="flex flex-col gap-3.5">
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-mono text-[#a0aec0] uppercase tracking-wider mb-1">
                Full Name / Organization
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-xl px-3.5 py-2 text-xs text-[#f7fafc] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-[#a0aec0] uppercase tracking-wider mb-1">
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@company.com"
              className="w-full bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-xl px-3.5 py-2 text-xs text-[#f7fafc] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#a0aec0] uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-xl px-3.5 py-2 text-xs text-[#f7fafc] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 px-4 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs transition-all shadow-md shadow-[#dd6b20]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Dashboard' : 'Create Free Account'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Signup */}
        <div className="text-center pt-2 border-t border-[#4a5568] text-xs text-[#a0aec0]">
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleToggleMode('signup')}
                className="text-[#dd6b20] hover:underline font-bold ml-1 cursor-pointer"
              >
                Sign up free
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleToggleMode('login')}
                className="text-[#dd6b20] hover:underline font-bold ml-1 cursor-pointer"
              >
                Sign in
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
