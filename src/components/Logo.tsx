import { useAppData } from '../context/AppDataContext';
import { Link } from 'react-router-dom';

type LogoProps = { light?: boolean; compact?: boolean; to?: string };

export function Logo({ light = false, compact = false, to = '/' }: LogoProps) {
  const { data } = useAppData();
  const color = light ? 'text-white' : 'text-[var(--text)]';
  return (
    <Link to={to} aria-label={`${data.settings.hotelName} — bosh sahifa`} className={`group inline-flex items-center gap-3 ${color}`}>
      {data.settings.website.logoUrl ? <img src={data.settings.website.logoUrl} alt="" className="h-10 w-10 rounded-xl object-contain" /> : <span className="arch-mark flex h-10 w-9 items-center justify-center text-champagne transition-transform duration-300 group-hover:-translate-y-0.5">
        <svg viewBox="0 0 28 34" className="h-7 w-6" fill="none" aria-hidden="true">
          <path d="M4 29V15a10 10 0 0 1 20 0v14" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="14" cy="17" rx="4.5" ry="7" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 31h12" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </span>}
      {!compact && <span className="leading-none">
        <span className="block text-[13px] font-semibold tracking-[.23em]">{data.settings.hotelName.replace(/\s+hotel$/i, '')}</span>
        <span className={`mt-1 block text-[9px] tracking-[.38em] ${light ? 'text-white/60' : 'text-muted'}`}>HOTEL</span>
      </span>}
    </Link>
  );
}
