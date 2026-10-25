import { Children, isValidElement, useEffect, useId, useRef, useState, type ReactNode, type SelectHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

type Option = { value: string; label: string; disabled: boolean };
function text(node: ReactNode): string {
  return Children.toArray(node).map((child) => isValidElement<{ children?: ReactNode }>(child) ? text(child.props.children) : String(child)).join('');
}
function collect(node: ReactNode): Option[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)) return [];
    if (child.type !== 'option') return collect(child.props.children);
    const label = text(child.props.children);
    return [{ value: String(child.props.value ?? label), label, disabled: Boolean(child.props.disabled) }];
  });
}

/** Shared themed select. Native form submission and validation stay intact. */
export function Select({ children, className = '', value, defaultValue, onChange, disabled, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const options = collect(children);
  const [internal, setInternal] = useState(String(defaultValue ?? options[0]?.value ?? ''));
  const selected = String(value ?? internal);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 260 });
  const trigger = useRef<HTMLButtonElement>(null);
  const native = useRef<HTMLSelectElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef({ value: '', time: 0 });
  const uid = useId();
  const listId = `select-list-${uid}`;

  function place() {
    if (!trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const below = innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const height = Math.min(260, Math.max(below, above));
    const upward = below < 180 && above > below;
    const width = Math.min(Math.max(rect.width, 180), innerWidth - 24);
    setPosition({ top: upward ? Math.max(12, rect.top - Math.min(height, options.length * 44 + 12) - 6) : rect.bottom + 6, left: Math.max(12, Math.min(rect.left, innerWidth - width - 12)), width, maxHeight: Math.max(80, upward ? height : below) });
  }
  function show() {
    if (disabled) return;
    place();
    setActive(Math.max(0, options.findIndex((option) => option.value === selected && !option.disabled)));
    setOpen(true);
  }
  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    setInternal(option.value);
    if (native.current) {
      native.current.value = option.value;
      native.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
    setOpen(false);
    trigger.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !list.current?.contains(event.target as Node)) setOpen(false);
    };
    const reposition = (event: Event) => { if (!list.current?.contains(event.target as Node)) place(); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', reposition); window.removeEventListener('scroll', reposition, true); };
  }, [open]);
  useEffect(() => { if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' }); }, [open, active, listId]);

  return <span className="hotel-select-root">
    <select {...props} disabled={disabled} ref={native} value={selected} onChange={(event) => { setInternal(event.target.value); onChange?.(event); }} tabIndex={-1} aria-hidden="true" className="hotel-select-native" onInvalid={(event) => { event.preventDefault(); trigger.current?.focus(); show(); }}>{children}</select>
    <button ref={trigger} type="button" disabled={disabled} aria-label={props['aria-label']} aria-labelledby={props['aria-labelledby']} aria-describedby={props['aria-describedby']} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-activedescendant={open ? `${listId}-${active}` : undefined} className={`hotel-select-trigger ${className}`} onClick={() => open ? setOpen(false) : show()} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); return; }
      if (event.key === 'Tab') { setOpen(false); return; }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        if (!open) { show(); return; }
        if (event.key === 'Enter' || event.key === ' ') { choose(active); return; }
        const enabled = options.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0);
        const current = enabled.indexOf(active);
        setActive(event.key === 'Home' ? enabled[0] ?? 0 : event.key === 'End' ? enabled.at(-1) ?? 0 : enabled[(current + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length] ?? 0);
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        const now = Date.now(); search.current = { value: (now - search.current.time > 700 ? '' : search.current.value) + event.key.toLocaleLowerCase(), time: now };
        if (!open) show();
        const index = options.findIndex((option) => !option.disabled && option.label.toLocaleLowerCase().startsWith(search.current.value));
        if (index >= 0) setActive(index);
      }
    }}><span className="min-w-0 truncate">{options.find((option) => option.value === selected)?.label ?? 'Tanlang'}</span><ChevronDown size={15} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
    {open && createPortal(<div ref={list} id={listId} role="listbox" aria-label={props['aria-label'] ?? 'Variantlar'} className="hotel-select-list" style={position} onPointerDown={(event) => event.preventDefault()}>{options.map((option, index) => <div key={`${option.value}-${index}`} id={`${listId}-${index}`} role="option" aria-selected={option.value === selected} aria-disabled={option.disabled} className={`hotel-select-option ${active === index ? 'is-active' : ''}`} onPointerMove={() => !option.disabled && setActive(index)} onClick={() => choose(index)}><span>{option.label}</span>{option.value === selected && <Check size={15} className="shrink-0" />}</div>)}{!options.length && <p className="p-3 text-xs text-muted">Variant mavjud emas</p>}</div>, document.body)}
  </span>;
}
