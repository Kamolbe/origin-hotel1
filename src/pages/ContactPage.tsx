import { ContactCards } from '../components/ContactCards';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useHotelContact } from '../hooks/useHotelContact';
import { MarketingNav } from '../components/MarketingNav';
import { SiteFooter } from '../components/marketing/SiteFooter';

export function ContactPage() {
  const hotel = useHotelContact();
  return <div className="min-h-screen bg-[var(--page)] text-[var(--text)]">
    <MarketingNav />
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted"><ArrowLeft size={15} />Bosh sahifaga</Link>
      <p className="mt-7 text-xs uppercase tracking-[.2em] text-champagne">{hotel.name}</p>
      <h1 className="mt-3 font-display text-4xl">Biz bilan bog‘laning</h1>
      <p className="mt-4 text-sm leading-7 text-muted">Bron, xona va xizmatlar bo‘yicha savollaringiz uchun qabulxonaga murojaat qiling.</p>
      <div className="mt-8"><ContactCards /></div>
    </main>
    <SiteFooter />
  </div>;
}
