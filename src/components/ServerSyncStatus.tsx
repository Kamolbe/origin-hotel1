import { useAppData } from '../context/AppDataContext';
import { usesHotelServer } from '../services/hotelServer';
export function ServerSyncStatus() {
  const { serverStatus, serverError, refreshData } = useAppData();
  if (!usesHotelServer()) return null;
  return <div role={serverStatus === 'error' ? 'alert' : 'status'} className={`sticky top-0 z-[200] flex flex-wrap items-center justify-center gap-3 border-b px-4 py-2 text-xs ${serverStatus === 'error' ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-[var(--line)] bg-[var(--surface)] text-muted'}`}>{serverStatus === 'saving' ? 'Serverga saqlanmoqda…' : serverStatus === 'error' ? serverError : 'Server bazasiga ulangan'}<button type="button" onClick={refreshData} disabled={serverStatus === 'saving'} className="underline disabled:opacity-40">Yangilash</button></div>;
}
