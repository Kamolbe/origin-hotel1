import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, TriangleAlert, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: ToastKind; message: string };
type ToastApi = { push: (message: string, kind?: ToastKind) => void; success: (message: string) => void; error: (message: string) => void; info: (message: string) => void };
const ToastContext = createContext<ToastApi | null>(null);
let toastSequence = 0;

const tones: Record<ToastKind, { icon: typeof Check; className: string }> = {
  success: { icon: Check, className: 'border-emerald-200/80 bg-emerald-50 text-emerald-900' },
  error: { icon: TriangleAlert, className: 'border-rose-200/80 bg-rose-50 text-rose-900' },
  info: { icon: Info, className: 'border-stone-200 bg-white text-stone-800' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++toastSequence;
    setItems((current) => [...current.slice(-3), { id, kind, message }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);
  const value = useMemo<ToastApi>(() => ({ push, success: (message) => push(message, 'success'), error: (message) => push(message, 'error'), info: (message) => push(message, 'info') }), [push]);

  return <ToastContext.Provider value={value}>
    {children}
    <div className="fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-atomic="false">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const tone = tones[item.kind];
          const Icon = tone.icon;
          return <motion.div key={item.id} initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 20 }} className={`flex items-start gap-3 rounded-2xl border p-4 shadow-soft ${tone.className}`}>
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-sm leading-5">{item.message}</p>
            <button aria-label="Yopish" onClick={() => dismiss(item.id)} className="rounded-full p-1 opacity-70 hover:bg-black/5 hover:opacity-100"><X size={15} /></button>
          </motion.div>;
        })}
      </AnimatePresence>
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}
