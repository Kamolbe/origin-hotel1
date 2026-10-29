import { usesHotelServer } from '../services/hotelServer';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAppData } from './AppDataContext';
import { useAuth } from './AuthContext';
import type { AppData } from '../types';

type CloudStatus = 'local' | 'loading' | 'saving' | 'synced' | 'error';
type CloudContext = { status: CloudStatus; message: string; savedAt: string; connected: boolean; connect: (email: string, password: string) => Promise<void>; reload: () => Promise<void>; retry: () => Promise<void>; disconnect: () => void };
const Context = createContext<CloudContext | null>(null);
const TOKEN_KEY = 'origin-hotel-cloud-session';
const serialize = (data: AppData) => JSON.stringify({ ...data, users: data.users.map(({ password, accessCode, ...user }) => user) });
function restore(remote: AppData, current: AppData): AppData {
  return { ...remote, users: remote.users.map((item) => { const previous = current.users.find((user) => user.id === item.id || user.email === item.email); return { ...item, password: previous?.password ?? '', accessCode: previous?.accessCode ?? '' }; }) };
}
async function request(method: string, token?: string, body?: unknown) {
  const response = await fetch('/api/hotel', { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let result;
  try { result = await response.json(); } catch { throw new Error('Bulut API ishlamayapti. Vercel va Firebase server sozlamalarini kiriting.'); }
  if (!response.ok) throw new Error(result.message ?? 'Bulut bilan bog‘lanib bo‘lmadi.');
  return result;
}

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const current = useRef(data); current.current = data;
  const token = useRef('');
  const revision = useRef<string | null>(null);
  const saved = useRef('');
  const busy = useRef(false);
  const generation = useRef(0);
  const [status, setStatus] = useState<CloudStatus>('local');
  const [message, setMessage] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const [connected, setConnected] = useState(false);

  const save = useCallback(async () => {
    if (!token.current || busy.current) return;
    const serialized = serialize(current.current);
    if (serialized === saved.current) return;
    if (new Blob([serialized]).size > 3500000) { setStatus('error'); setMessage('Ma’lumot hajmi katta. Rasmlarni kichraytiring yoki ayrimlarini havola orqali kiriting.'); return; }
    busy.current = true;
    const session = generation.current;
    setStatus('saving');
    try {
      const result = await request('PUT', token.current, { data: JSON.parse(serialized), revision: revision.current });
      if (session !== generation.current) return;
      revision.current = result.revision; saved.current = serialized;
      setSavedAt(result.savedAt); setMessage(''); setStatus('synced');
    } catch (cause) { if (session === generation.current) { setStatus('error'); setMessage(cause instanceof Error ? cause.message : 'Saqlashda xato.'); } }
    finally { busy.current = false; }
  }, []);

  const reload = useCallback(async () => {
    if (!token.current || busy.current) return;
    const session = generation.current;
    setStatus('loading');
    try {
      const result = await request('GET', token.current);
      if (session !== generation.current) return;
      revision.current = result.revision;
      if (result.data) {
        const restored = restore(result.data, current.current);
        saved.current = serialize(restored);
        updateData(() => restored);
        setSavedAt(result.savedAt ?? '');
      } else { saved.current = ''; }
      setConnected(true); setMessage(''); setStatus(result.data ? 'synced' : 'local');
    } catch (cause) { setStatus('error'); setMessage(cause instanceof Error ? cause.message : 'Yuklashda xato.'); throw cause; }
  }, [updateData]);

  const connect = useCallback(async (email: string, password: string) => {
    if (user?.role !== 'admin') return;
    generation.current++;
    setStatus('loading');
    try {
      const result = await request('POST', undefined, { email, password });
      token.current = result.token; sessionStorage.setItem(TOKEN_KEY, result.token);
      await reload();
    } catch (cause) { token.current = ''; sessionStorage.removeItem(TOKEN_KEY); setConnected(false); setStatus('error'); setMessage(cause instanceof Error ? cause.message : 'Ulanishda xato.'); }
  }, [user?.role, reload]);

  const disconnect = useCallback(() => {
    generation.current++; token.current = ''; sessionStorage.removeItem(TOKEN_KEY); setConnected(false); setStatus('local'); setMessage('');
  }, []);

  useEffect(() => {
    if (usesHotelServer()) return;
    let cancelled = false;
    generation.current++;
    if (user?.role === 'admin') {
      const stored = sessionStorage.getItem(TOKEN_KEY);
      if (stored) { token.current = stored; void reload().catch(() => {}); return () => { cancelled = true; }; }
    } else { token.current = ''; sessionStorage.removeItem(TOKEN_KEY); setConnected(false); setStatus('local'); }
    const loadPublic = async () => {
      try {
        const result = await request('GET');
        if (cancelled || !result.data || token.current) return;
        updateData((previous) => ({ ...previous, rooms: result.data.rooms, settings: { ...previous.settings, ...result.data.settings } }));
      } catch { /* Local version stays available until cloud is configured. */ }
    };
    void loadPublic();
    const timer = user?.role !== 'admin' ? window.setInterval(() => { if (document.visibilityState === 'visible') void loadPublic(); }, 30000) : undefined;
    return () => { cancelled = true; if (timer) window.clearInterval(timer); };
  }, [user?.id, user?.role, reload, updateData]);

  useEffect(() => {
    if (usesHotelServer() || user?.role !== 'admin' || !connected || status === 'error' || status === 'loading') return;
    if (serialize(data) === saved.current) return;
    const timer = window.setTimeout(() => void save(), 1000);
    return () => window.clearTimeout(timer);
  }, [data, user?.role, connected, status, save]);

  return <Context.Provider value={{ status, message, savedAt, connected, connect, reload, retry: save, disconnect }}>{children}</Context.Provider>;
}
export function useCloudSync() { const context = useContext(Context); if (!context) throw new Error('CloudSyncProvider topilmadi'); return context; }
