import { ArrowUpRight, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useHotelContact } from '../hooks/useHotelContact';

export function ContactCards() {
  const hotel = useHotelContact();
  const channels = [
    { label: 'Qo‘ng‘iroq qilish', value: hotel.phone, href: hotel.phoneHref, icon: Phone, action: 'Qo‘ng‘iroq qilish' },
    { label: 'Email yuborish', value: hotel.email, href: `mailto:${hotel.email}`, icon: Mail, action: 'Xat yozish' },
    ...(hotel.telegram ? [{ label: 'Telegramda yozish', value: hotel.telegramHandle, href: hotel.telegram, icon: Send, action: 'Telegramni ochish' }] : []),
    { label: 'Manzilimiz', value: `${hotel.addressLineOne}\n${hotel.addressLineTwo}`, href: hotel.mapUrl, icon: MapPin, action: 'Xaritada ochish' },
  ];
  return (
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
        {channels.map(({ label, value, href, icon: Icon, action }) => <section key={label} className="contact-channel-card surface flex min-w-0 flex-col rounded-3xl p-6 sm:p-7">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-champagne/10 text-champagne"><Icon size={23} /></span>
          <h2 className="mt-5 text-lg font-semibold">{label}</h2>
          <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-muted [overflow-wrap:anywhere]">{value}</p>
          {href && <div className="mt-auto pt-5"><a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold transition hover:border-champagne hover:bg-champagne/10">{action}<ArrowUpRight size={14} /></a></div>}
        </section>)}
      </div>
  );
}
