import { Link } from 'react-router-dom';
import { BedDouble, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { MarketingNav } from '../components/MarketingNav';
import { useAppData } from '../context/AppDataContext';
import { formatMoney } from '../services/hotelUtils';

const heroPhoto = 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1800&q=88';

export function LandingPage() {
  const { data } = useAppData();
  const types = ['Standard', 'Deluxe', 'Suite', 'Family', 'Presidential'] as const;
  return <div className="min-h-screen">
    <MarketingNav />
    <main>
      <section className="relative isolate min-h-[680px] overflow-hidden bg-ink text-white">
        <img src={heroPhoto} alt="Origin Hotel mehmonxonasi" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/65 to-ink/15" />
        <div className="relative mx-auto flex min-h-[680px] max-w-[1440px] items-center px-5 py-16 lg:px-10">
          <div className="max-w-2xl"><p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.24em] text-[#dfc798]"><span className="h-px w-10 bg-champagne" />Shahar ichidagi sokin dam</p><h1 className="mt-6 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">Har lahza, puxta mehmondo‘stlik.</h1><p className="mt-6 max-w-xl text-sm leading-7 text-white/75 sm:text-base">Origin Hotel’da zamonaviy qulaylik, iliq xushmuomalalik va shahardan bir qadam naridagi tinchlik birlashadi.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/login" className="rounded-full bg-champagne px-6 py-3 text-xs font-bold text-ink">Bron qilish</Link><Link to="/app/rooms" className="rounded-full border border-white/30 px-6 py-3 text-xs font-bold text-white">Xonalarni ko‘rish</Link></div></div>
        </div>
      </section>
      <section id="rooms" className="mx-auto max-w-[1440px] px-5 py-16 lg:px-10"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-champagne">Xona turlari</p><h2 className="mt-2 font-display text-4xl">Kutilganingizdan yaqinroq qulaylik</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{types.map((type) => { const room = data.rooms.find((item) => item.type === type); return <article key={type} className="surface rounded-3xl p-5"><BedDouble className="text-champagne" /><h3 className="mt-5 font-display text-xl">{type}</h3><p className="mt-2 text-xs text-muted">{room?.capacity ?? 2} kishigacha · {room?.amenities.slice(0, 2).join(' · ')}</p><p className="mt-5 text-sm font-semibold">{room ? formatMoney(room.pricePerNight, data.settings.currency) : ''}</p></article>; })}</div></section>
      <section id="about" className="border-y border-[var(--line)] bg-[var(--surface)]"><div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-16 md:grid-cols-3 lg:px-10"><Feature icon={Sparkles} title="24/7 xizmat" text="Har soatda e’tiborli mehmonxona jamoasi." /><Feature icon={ShieldCheck} title="Ishonchli xavfsizlik" text="Sizning damingiz va yotoqxonangiz har doim himoyalangan." /><Feature icon={MapPin} title="Markaziy joylashuv" text="Toshkent markazining asosiy manzillariga yaqin." /></div></section>
    </main>
  </div>;
}

function Feature({ icon: Icon, title, text }: { icon: typeof Sparkles; title: string; text: string }) {
  return <div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-champagne/15 text-champagne"><Icon size={20} /></span><div><h3 className="font-display text-xl">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></div></div>;
}
