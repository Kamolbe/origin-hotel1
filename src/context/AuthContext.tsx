import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEMO_USERS } from '../data/seed';
import { makeId } from '../services/storage';
import type { GoogleProfile } from '../services/googleAuth';
import type { User, UserRole } from '../types';
import { useAppData } from './AppDataContext';

type SessionUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;
type ProfileUpdate = Partial<Pick<User, 'name' | 'email' | 'phone' | 'avatarUrl' | 'password' | 'twoFactorEnabled'>>;
type AuthResult = { ok: boolean; error?: 'credentials' | 'code' | 'duplicate' | 'email' };
type AuthContextValue = {
  user: SessionUser | null;
  login: (input: { email: string; password: string; accessCode?: string; name?: string }) => AuthResult;
  register: (input: { firstName: string; lastName: string; email: string; password: string; accessCode?: string }) => AuthResult;
  signInWithGoogle: (profile: GoogleProfile) => AuthResult;
  updateProfile: (updates: ProfileUpdate) => boolean;
  logout: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = 'origin-hotel-session';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readSession(): SessionUser | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as SessionUser;
    if (!parsed.id || !parsed.email || !['user', 'manager', 'admin'].includes(parsed.role)) return null;
    return parsed;
  } catch { return null; }
}
function persistSession(user: SessionUser) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* In-memory session remains available. */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, updateData } = useAppData();
  const [user, setUser] = useState<SessionUser | null>(readSession);
  const establishSession = useCallback((record: User) => {
    const next: SessionUser = { id: record.id, name: record.name, email: record.email, role: record.role };
    setUser(next); persistSession(next);
  }, []);

  const login = useCallback<AuthContextValue['login']>(({ email, password, accessCode, name }) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail) || !password) return { ok: false, error: 'credentials' };
    const isAdminDomain = normalizedEmail.endsWith('@admin.com');
    const isManagerDomain = normalizedEmail.endsWith('@manager.com');
    const requiredCode = isAdminDomain ? 'admin1234' : isManagerDomain ? 'manager1234' : undefined;
    if (requiredCode && accessCode !== requiredCode) return { ok: false, error: 'code' };

    const account = data.users.find((item) => item.email.toLowerCase() === normalizedEmail);
    if (account) {
      if (!account.isActive || account.password !== password) return { ok: false, error: 'credentials' };
      if ((account.role === 'admin' || account.role === 'manager') && account.accessCode !== accessCode) return { ok: false, error: 'code' };
      establishSession(account); return { ok: true };
    }
    if (requiredCode) return { ok: false, error: 'credentials' };
    const demo = DEMO_USERS.find((item) => item.email.toLowerCase() === normalizedEmail);
    if (demo && demo.password !== password) return { ok: false, error: 'credentials' };
    const displayName = name?.trim() || normalizedEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    const record: User = { id: demo?.id ?? makeId('user'), name: demo?.name ?? displayName, email: normalizedEmail, role: 'user', password, isActive: true, createdAt: new Date().toISOString() };
    updateData((current) => ({ ...current, users: current.users.some((item) => item.email.toLowerCase() === normalizedEmail) ? current.users : [...current.users, record] }));
    establishSession(record); return { ok: true };
  }, [data.users, establishSession, updateData]);

  const register = useCallback<AuthContextValue['register']>(({ firstName, lastName, email, password, accessCode }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!EMAIL_PATTERN.test(normalizedEmail) || !normalizedName || password.length < 6) return { ok: false, error: 'email' };
    if (data.users.some((item) => item.email.toLowerCase() === normalizedEmail)) return { ok: false, error: 'duplicate' };
    let role: UserRole = 'user';
    let expectedCode: string | undefined;
    if (normalizedEmail.endsWith('@admin.com')) { role = 'admin'; expectedCode = 'admin1234'; }
    if (normalizedEmail.endsWith('@manager.com')) { role = 'manager'; expectedCode = 'manager1234'; }
    if (expectedCode && expectedCode !== accessCode) return { ok: false, error: 'code' };
    const record: User = { id: makeId('user'), name: normalizedName, email: normalizedEmail, role, password, accessCode: expectedCode, isActive: true, createdAt: new Date().toISOString() };
    updateData((current) => ({ ...current, users: [...current.users, record] }));
    establishSession(record); return { ok: true };
  }, [data.users, establishSession, updateData]);

  /**
   * Sign in with a verified Google identity. A Google account is a guest
   * account: staff roles stay behind the emailed access code, so an identity
   * alone can never escalate to admin or manager.
   */
  const signInWithGoogle = useCallback<AuthContextValue['signInWithGoogle']>((profile) => {
    const email = profile.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) return { ok: false, error: 'email' };

    const account = data.users.find((item) => item.email.toLowerCase() === email);
    if (account) {
      if (account.role !== 'user') return { ok: false, error: 'code' };
      if (!account.isActive) return { ok: false, error: 'credentials' };
      const linked: User = { ...account, name: account.name || profile.name, avatarUrl: account.avatarUrl ?? profile.picture };
      updateData((current) => ({ ...current, users: current.users.map((item) => item.id === account.id ? linked : item) }));
      establishSession(linked);
      return { ok: true };
    }

    const record: User = {
      id: makeId('user'),
      name: profile.name || email.split('@')[0],
      email,
      role: 'user',
      password: makeId('google'),
      isActive: true,
      createdAt: new Date().toISOString(),
      avatarUrl: profile.picture,
    };
    updateData((current) => ({ ...current, users: [...current.users, record] }));
    establishSession(record);
    return { ok: true };
  }, [data.users, establishSession, updateData]);

  const updateProfile = useCallback((updates: ProfileUpdate) => {
    if (!user) return false;
    const email = updates.email?.trim().toLowerCase();
    if (email && data.users.some((item) => item.id !== user.id && item.email.toLowerCase() === email)) return false;
    const current = data.users.find((item) => item.id === user.id);
    if (!current) return false;
    const nextRecord = { ...current, ...updates, email: email ?? current.email };
    updateData((state) => ({ ...state, users: state.users.map((item) => item.id === user.id ? nextRecord : item) }));
    establishSession(nextRecord);
    return true;
  }, [user, data.users, updateData, establishSession]);

  const logout = useCallback(() => {
    void import('../services/googleAuth').then(({ signOutFirebaseGoogle }) => signOutFirebaseGoogle()).catch(() => { /* Local logout still completes offline. */ });
    setUser(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* Ignore unavailable storage. */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    const account = data.users.find((item) => item.id === user.id);
    if (!account || !account.isActive) { logout(); return; }
    if (account.name !== user.name || account.email !== user.email || account.role !== user.role) establishSession(account);
  }, [data.users, user, logout, establishSession]);

  const value = useMemo(() => ({ user, login, register, signInWithGoogle, updateProfile, logout }), [user, login, register, signInWithGoogle, updateProfile, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
