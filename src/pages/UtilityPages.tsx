import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return <main className="grid min-h-[70vh] place-items-center px-5"><div className="max-w-md text-center"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-champagne">403</p><h1 className="mt-3 font-display text-4xl">Ruxsat yo‘q</h1><p className="mt-3 text-sm leading-6 text-muted">Bu sahifaga kirish uchun sizda tegishli rol mavjud emas.</p><Link to="/app" className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white">Boshqaruv paneliga qaytish</Link></div></main>;
}

export function NotFoundPage() {
  return <main className="grid min-h-[70vh] place-items-center px-5"><div className="max-w-md text-center"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-champagne">404</p><h1 className="mt-3 font-display text-4xl">Sahifa topilmadi</h1><Link to="/" className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white">Bosh sahifaga qaytish</Link></div></main>;
}
