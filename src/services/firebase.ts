import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  type User,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import type { UserProfile, ApiKeyItem, CreatedKeySecret } from '../types/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAjzfG07rUtI8W54jq68w_NFv_p6wccYis',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'paralux-extract.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'paralux-extract',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'paralux-extract.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '897687440263',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:897687440263:web:0d0a0d455407e777a16122',
};

// Initialize Firebase App singleton
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Ensures a user profile exists in Firestore. Allocates 50 free credits on first sign-up.
 */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  const initialProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Developer',
    photoURL: user.photoURL || undefined,
    tier: 'free',
    creditsRemaining: 50,
    creditsTotalAllocated: 50,
    totalExtractionsCount: 0,
    monthlyExtractionsCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(userRef, initialProfile);
  return initialProfile;
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  return await ensureUserProfile(result.user);
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return await ensureUserProfile(result.user);
}

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(email: string, pass: string, displayName: string): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return await ensureUserProfile(result.user);
}

/**
 * Sign out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to realtime user profile changes (e.g. credit balance deductions)
 */
export function subscribeToUserProfile(
  uid: string,
  onUpdate: (profile: UserProfile | null) => void
): Unsubscribe {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error('Failed to subscribe to user profile:', err);
      onUpdate(null);
    }
  );
}

/**
 * Computes a SHA-256 hex string using browser Web Crypto API
 */
export async function computeSha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a random cryptographic API key string
 */
function generateRandomKeyToken(environment: 'test' | 'live'): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  const randomStr = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `px_${environment}_${randomStr}`;
}

/**
 * Creates a new API key, stores SHA-256 hash in Firestore, and returns the raw secret once.
 */
export async function createApiKey(params: {
  userId: string;
  name: string;
  environment: 'test' | 'live';
  rateLimitRpm?: number;
}): Promise<CreatedKeySecret> {
  const rawKey = generateRandomKeyToken(params.environment);
  const hashedKey = await computeSha256Hex(rawKey);
  const keyPrefix = `${rawKey.slice(0, 12)}••••••••`;

  const keyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();

  const keyRecord = {
    id: keyId,
    userId: params.userId,
    name: params.name || `${params.environment === 'live' ? 'Production' : 'Test'} API Key`,
    keyPrefix,
    hashedKey,
    environment: params.environment,
    status: 'active',
    rateLimitRpm: params.rateLimitRpm || (params.environment === 'live' ? 30 : 5),
    createdAt: now,
    lastUsedAt: null,
    revokedAt: null,
  };

  await setDoc(doc(db, 'api_keys', keyId), keyRecord);

  return {
    id: keyId,
    name: keyRecord.name,
    rawKey,
    keyPrefix,
    environment: params.environment,
    createdAt: now,
  };
}

/**
 * Subscribes to realtime API keys for a specific user
 */
export function subscribeToUserApiKeys(
  userId: string,
  onUpdate: (keys: ApiKeyItem[]) => void
): Unsubscribe {
  const keysCol = collection(db, 'api_keys');
  const q = query(keysCol, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const keys: ApiKeyItem[] = [];
      snapshot.forEach((docSnap) => {
        keys.push(docSnap.data() as ApiKeyItem);
      });
      // Sort in-memory to avoid compound index requirements
      keys.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(keys);
    },
    (err) => {
      console.error('Failed to subscribe to API keys:', err);
      onUpdate([]);
    }
  );
}

/**
 * Revokes an active API key
 */
export async function revokeApiKey(keyId: string): Promise<void> {
  const keyRef = doc(db, 'api_keys', keyId);
  await updateDoc(keyRef, {
    status: 'revoked',
    revokedAt: Date.now(),
  });
}
