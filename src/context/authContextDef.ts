import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types/auth';

export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  handleGoogleLogin: () => Promise<void>;
  handleEmailLogin: (email: string, pass: string) => Promise<void>;
  handleEmailSignup: (email: string, pass: string, name: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
