import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, description, children, size = 'md' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  const panelSize = size === 'lg' ? 'max-w-3xl' : 'max-w-xl';
  if (!open) return null;
  return createPortal(<div style={{ position: 'fixed', inset: 0, top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', maxHeight: '100dvh', alignItems: 'flex-start' }} className="z-[80] flex items-start justify-center overflow-hidden bg-ink/45 p-3 backdrop-blur-[3px] sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="dialog-title" style={{ marginTop: 0, maxHeight: 'calc(100dvh - 24px)' }} className={`surface mt-0 max-h-[calc(100dvh-24px)] w-full shrink-0 overflow-y-auto rounded-2xl p-5 shadow-lift sm:max-h-[calc(100dvh-32px)] sm:p-7 ${panelSize}`}>

      <div className="sticky top-0 z-20 -mx-5 -mt-5 mb-5 flex items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-5 pb-4 pt-5 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pt-7">
        <div><h2 id="dialog-title" className="font-display text-2xl">{title}</h2>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div>
        <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-full p-2 text-muted hover:bg-[var(--page)]"><X size={18} /></button>
      </div>
      {children}
    </section>
  </div>, document.body);
}
