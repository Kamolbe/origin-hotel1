import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useHotelContact } from '../hooks/useHotelContact';
import { MarketingNav } from '../components/MarketingNav';
import { SiteFooter } from '../components/marketing/SiteFooter';

export function ContactPage() {
  const hotel = useHotelContact();
  const channels = [
    { label: 'Qo‘ng‘iroq qilish', value: hotel.phone, href: hotel.phoneHref, icon: Phone },
    { label: 'Email yuborish', value: hotel.email, href: `mailto:${hotel.email}`, icon: Mail },
    ...(hotel.telegram ? [{ label: 'Telegramda yozish', value: hotel.telegramHandle, href: hotel.telegram, icon: Send }] : []),
  ];
  return <div className="min-h-screen bg-[var(--page)] text-[var(--text)]"><MarketingNav /><main className="mx-auto max-w-5xl px-5 py-8 sm:py-12"><Link to="/" className="inline-flex items-center gap-2 text-xs text-muted"><ArrowLeft size={15} />Bosh sahifaga</Link><p className="mt-7 text-xs uppercase tracking-[.2em] text-champagne">{hotel.name}</p><h1 className="mt-3 font-display text-4xl">Biz bilan bog‘laning</h1><p className="mt-4 text-sm leading-7 text-muted">Bron, xona va xizmatlar bo‘yicha savollaringiz uchun qabulxonaga murojaat qiling.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{channels.map(({ label, value, href, icon: Icon }) => <a key={label} href={href} className="surface rounded-3xl p-6 transition hover:border-champagne"><Icon size={24} className="text-champagne" /><h2 className="mt-4 text-lg font-semibold">{label}</h2><p className="mt-2 break-words text-sm text-muted">{value}</p></a>)}</div><section className="surface mt-6 rounded-3xl p-6"><MapPin size={24} className="text-champagne" /><h2 className="mt-4 font-display text-2xl">Manzilimiz</h2><p className="mt-3 text-sm leading-7">{hotel.addressLineOne}<br />{hotel.addressLineTwo}</p>{hotel.mapUrl && <a href={hotel.mapUrl} target="_blank" rel="noreferrer" className="secondary-button mt-5 gap-2">Xaritada ochish<ExternalLink size={14} /></a>}</section></main><SiteFooter /></div>;
}
