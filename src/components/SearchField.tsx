import { useRef } from 'react';
import { Search, X } from 'lucide-react';

export function SearchField({ value, onChange, placeholder, label = 'Qidiruv', className = '' }: { value: string; onChange: (value: string) => void; placeholder: string; label?: string; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  return <div className={`search-field ${className}`}><Search size={16} aria-hidden="true" /><input ref={input} type="search" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />{value && <button type="button" aria-label="Qidiruvni tozalash" onClick={() => { onChange(''); input.current?.focus(); }}><X size={14} /></button>}</div>;
}
