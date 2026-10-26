import { useNavigate } from 'react-router-dom';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Camera, Clock, ExternalLink, Mail, MapPin, Phone, Send, Share2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useHotelContact } from '../hooks/useHotelContact';

type ContactDialogValue = { openContact: () => void };
const ContactDialogContext = createContext<ContactDialogValue | null>(null);

/**
 * "Administrator bilan bog'lanish" everywhere on the public site opens this
 * dialog instead of navigating away: the hotel phone, the Telegram bot and the
 * social profiles are all reachable in one tap.
 */
export function ContactDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const openContact = useCallback(() => {
    if (window.matchMedia('(max-width: 767px)').matches) { setOpen(false); navigate('/contact'); }
    else setOpen(true);
  }, [navigate]);
  const value = useMemo(() => ({ openContact }), [openContact]);

  return <ContactDialogContext.Provider value={value}>
    {children}
    <ContactDialog open={open} onClose={() => setOpen(false)} />
  </ContactDialogContext.Provider>;
}

export function useContactDialog() {
  const context = useContext(ContactDialogContext);
  if (!context) throw new Error('useContactDialog must be used inside ContactDialogProvider');
  return context;
}

function ContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hotel = useHotelContact();
  const channels = [
    { key: 'phone', label: 'Telefon', value: hotel.phone, href: hotel.phoneHref, icon: Phone, action: 'Qo‘ng‘iroq qilish' },
    { key: 'telegram', label: 'Telegram bot', value: hotel.telegramHandle || 'Mavjud emas', href: hotel.telegram, icon: Send, action: 'Telegramda yozish' },
    { key: 'email', label: 'Elektron pochta', value: hotel.email, href: `mailto:${hotel.email}`, icon: Mail, action: 'Email yuborish' },
  ].filter((channel) => channel.href);

  const socials = [
    { label: 'Telegram', handle: hotel.telegramHandle, href: hotel.telegram, icon: Send },
    { label: 'Instagram', handle: hotel.instagramHandle, href: hotel.instagram, icon: Camera },
    { label: 'Facebook', handle: hotel.facebookHandle, href: hotel.facebook, icon: Share2 },
  ].filter((social) => social.href);

  return <Modal open={open} onClose={onClose} title="Administrator bilan bog‘lanish" description={`${hotel.name} qabulxonasi kechayu kunduz javob beradi — savolingizni bemalol yozing.`} size="lg">
    <div className="grid gap-3 sm:grid-cols-3">
      {channels.map(({ key, label, value, href, icon: Icon, action }) => <a key={key} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="group flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--page)] p-4 transition hover:border-champagne">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-champagne/15 text-champagne"><Icon size={18} /></span>
        <span className="mt-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted">{label}</span>
        <span className="mt-1 break-words text-sm font-semibold">{value}</span>
        <span className="mt-3 text-[10px] font-semibold text-champagne">{action} →</span>
      </a>)}
    </div>

    <ul className="mt-5 space-y-3 rounded-2xl border border-[var(--line)] p-4 text-sm">
      <li className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-champagne" /><span><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-muted">Manzil</span>{hotel.addressLineOne}<br />{hotel.addressLineTwo}</span></li>
      <li className="flex gap-3"><Clock size={16} className="mt-0.5 shrink-0 text-champagne" /><span><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-muted">Qabulxona va vaqtlar</span>24/7 xizmat · Kelish {hotel.checkInTime} · Ketish {hotel.checkOutTime}</span></li>
      <li className="flex gap-3"><Phone size={16} className="mt-0.5 shrink-0 text-champagne" /><span><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-muted">Bron bo‘yicha</span><a href={hotel.phoneHref} className="font-semibold hover:text-champagne">{hotel.phone}</a></span></li>
    </ul>

    {socials.length > 0 && <div className="mt-5">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">Ijtimoiy tarmoqlar</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {socials.map(({ label, handle, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold transition hover:border-champagne hover:text-champagne"><Icon size={15} />{label} <span className="text-muted">{handle}</span></a>)}
      </div>
    </div>}

    <div className="mt-6 flex flex-wrap gap-2">
      <a href={hotel.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-semibold text-white transition hover:bg-ink-soft">Xaritani ochish<ExternalLink size={14} /></a>
      <button type="button" onClick={onClose} className="secondary-button">Yopish</button>
    </div>
  </Modal>;
}
