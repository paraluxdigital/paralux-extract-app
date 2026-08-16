import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  auth,
  ensureUserProfile,
  subscribeToUserProfile,
  signInWithGoogle,
  loginWithEmail,
  signUpWithEmail,
  logoutUser,
} from '../services/firebase';
import type { UserProfile } from '../types/auth';
import { AuthContext } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await ensureUserProfile(user);
          setUserProfile(profile);

          if (unsubscribeProfile) {
            unsubscribeProfile();
          }
          unsubscribeProfile = subscribeToUserProfile(user.uid, (updatedProfile) => {
            if (updatedProfile) {
              setUserProfile(updatedProfile);
            }
          });
        } catch (err) {
          console.error('Error initializing user profile:', err);
        }
      } else {
        setUserProfile(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleGoogleLogin = async () => {
    const profile = await signInWithGoogle();
    setUserProfile(profile);
    setIsAuthModalOpen(false);
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    const profile = await loginWithEmail(email, pass);
    setUserProfile(profile);
    setIsAuthModalOpen(false);
  };

  const handleEmailSignup = async (email: string, pass: string, name: string) => {
    const profile = await signUpWithEmail(email, pass, name);
    setUserProfile(profile);
    setIsAuthModalOpen(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUserProfile(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        handleGoogleLogin,
        handleEmailLogin,
        handleEmailSignup,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
