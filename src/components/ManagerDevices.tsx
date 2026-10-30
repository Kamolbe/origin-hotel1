import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, Monitor, RefreshCw } from 'lucide-react';
import { managerDeviceRequest, usesHotelServer, type ManagerDeviceSession } from '../services/hotelServer';
import { useToast } from '../context/ToastContext';

export function useManagerDevices(enabled: boolean) {
  const [sessions, setSessions] = useState<ManagerDeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!enabled || !usesHotelServer()) { setLoading(false); return; }
    const version = ++generation.current;
    try { const reply = await managerDeviceRequest(); if (version === generation.current) { setSessions(reply.sessions); setMessage(''); } }
    catch (cause) { if (version === generation.current) setMessage(cause instanceof Error ? cause.message : 'Qurilmalar yuklanmadi.'); }
    finally { if (version === generation.current) setLoading(false); }
  }, [enabled]);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 10000);
    const focus = () => void refresh(); window.addEventListener('focus', focus);
    return () => { generation.current++; window.clearInterval(timer); window.removeEventListener('focus', focus); };
  }, [refresh]);
  async function revoke(managerId: string, sessionId?: string) {
    setBusy(true); generation.current++;
    try { const reply = await managerDeviceRequest({ managerId, ...(sessionId ? { sessionId } : { all: true }) }); generation.current++; setSessions(reply.sessions); setMessage(''); return reply.revoked; }
    finally { setBusy(false); }
  }
  return { sessions, loading, message, busy, refresh, revoke };
}

type DeviceControl = ReturnType<typeof useManagerDevices>;
export function ManagerDevices({ managerId, control }: { managerId: string; control: DeviceControl }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const { success, error } = useToast();
  const sessions = control.sessions.filter((item) => item.managerId === managerId);
  async function remove(sessionId?: string) {
    try { const count = await control.revoke(managerId, sessionId); setConfirm(null); success(`${count} ta sessiya tizimdan chiqarildi.`); }
    catch (cause) { error(cause instanceof Error ? cause.message : 'Sessiyani tugatib bo‘lmadi.'); }
  }
  return <div className="mt-4 border-t border-[var(--line)] pt-4">
    <button type="button" aria-expanded={open} onClick={() => { setOpen(!open); if (!open) void control.refresh(); }} className="secondary-button w-full gap-2"><Monitor size={15} />Qurilmalar ({control.loading ? '…' : control.message ? '—' : sessions.length})</button>
    {open && <section aria-label="Manager qurilmalari" className="mt-3 space-y-3 text-xs">
      <p className="leading-5 text-muted">Har bir kirilgan brauzer alohida sessiya hisoblanadi. Bir brauzerdagi tablar bitta hisoblanadi. Chiqargandan so‘ng parol bilan yana kirish mumkin; kirishni taqiqlash uchun hisobni bloklang.</p>
      {!usesHotelServer() && <p>Qurilmalar nazorati serverga ulangan saytda ishlaydi.</p>}
      {control.message && <p role="alert" className="text-danger">{control.message}</p>}
      <button type="button" disabled={control.busy} onClick={() => void control.refresh()} className="portal-text-link inline-flex items-center gap-1"><RefreshCw size={12} />Yangilash</button>
      {sessions.map((item) => <article key={item.id} className="min-w-0 space-y-2 rounded-xl bg-[var(--page)] p-3"><h4 className="break-words font-semibold">{item.device}</h4><p className="leading-5 text-muted">Sessiya qaydi: {new Date(item.createdAt).toLocaleString('uz-UZ')}<br />Oxirgi faollik: {item.legacy ? 'Hali aniqlanmagan' : new Date(item.lastSeenAt).toLocaleString('uz-UZ')}</p>{item.legacy && <p className="leading-5 text-muted">Oldingi sessiya: qurilma haqidagi ma’lumot keyingi so‘rovda aniqlanadi.</p>}<button type="button" disabled={control.busy} onClick={() => setConfirm(item.id)} className="secondary-button gap-1 text-danger"><LogOut size={13} />Shu qurilmani chiqarish</button></article>)}
      {!control.loading && !control.message && !sessions.length && <p className="rounded-xl bg-[var(--page)] p-3">Kirilgan qurilmalar yo‘q.</p>}
      {sessions.length > 0 && <button type="button" disabled={control.busy} className="secondary-button w-full gap-1 text-danger" onClick={() => setConfirm('all')}><LogOut size={13} />Barcha qurilmalardan chiqarish</button>}
      {confirm && <div className="space-y-3 rounded-xl border border-[var(--line)] p-3"><p>{confirm === 'all' ? 'Shu managerning barcha ochiq sessiyalari tugatilsinmi?' : 'Tanlangan qurilma tizimdan chiqarilsinmi?'}</p><div className="flex flex-wrap gap-2"><button type="button" disabled={control.busy} className="primary-button" onClick={() => void remove(confirm === 'all' ? undefined : confirm)}>{control.busy ? 'Chiqarilmoqda…' : 'Ha, chiqarish'}</button><button type="button" disabled={control.busy} className="secondary-button" onClick={() => setConfirm(null)}>Bekor qilish</button></div></div>}
    </section>}
  </div>;
}
