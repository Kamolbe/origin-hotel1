import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, description, children, size = 'md', presentation = 'dialog' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'md' | 'lg';
  presentation?: 'dialog' | 'sheet';
}) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => panel.current?.focus());
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]') ?? []).filter((item) => item.tabIndex >= 0 && item.getClientRects().length > 0);
      const first = items[0]; const last = items.at(-1);
      if (!first) { event.preventDefault(); panel.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', keyboard);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', keyboard); document.body.style.overflow = previousOverflow; if (previous?.isConnected) previous.focus(); };
  }, [open]);

  if (!open) return null;
  return createPortal(<div className={`hotel-modal-backdrop ${presentation === 'sheet' ? 'hotel-more-backdrop' : ''}`} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className={`hotel-modal-panel ${presentation === 'sheet' ? 'hotel-more-panel' : ''} ${size === 'lg' ? 'max-w-3xl' : 'max-w-xl'}`}>
      <header className="hotel-modal-heading">
        <div className="min-w-0"><p className="mb-2 text-[9px] font-bold uppercase tracking-[.24em] text-champagne">Origin Hotel</p><h2 id={titleId} className="font-display text-2xl sm:text-3xl">{title}</h2>{description && <p id={descriptionId} className="mt-2 text-xs leading-6 text-muted">{description}</p>}</div>
        <button type="button" onClick={onClose} aria-label="Yopish" className="hotel-modal-close"><X size={18} /></button>
      </header>
      <div className="hotel-modal-body">{children}</div>
    </section>
  </div>, document.body);
}
