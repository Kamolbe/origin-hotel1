import { useEffect, type ReactNode } from 'react';
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

  if (!open) return null;
  return <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-ink/55 p-3 backdrop-blur-sm sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className={`surface max-h-[calc(100dvh-24px)] w-full overflow-y-auto rounded-3xl p-5 sm:p-7 ${size === 'lg' ? 'max-w-3xl' : 'max-w-xl'}`}>
      <div className="sticky top-0 z-20 -mx-5 -mt-5 mb-5 flex items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-5 pb-4 pt-5 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pt-7">
        <div><h2 id="dialog-title" className="font-display text-2xl">{title}</h2>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div>
        <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-full p-2 text-muted hover:bg-[var(--page)]"><X size={18} /></button>
      </div>
      {children}
    </section>
  </div>;
}
