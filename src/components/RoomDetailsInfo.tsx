import { Check } from 'lucide-react';
import type { Room } from '../types';

/** Services every room can add on top of its own amenities. */
export const ROOM_EXTRA_SERVICES = [
  'Nonushta (07:00–10:30)',
  'Aeroportdan transfer',
  'Basseyn va spa',
  'Bepul avtoturargoh',
  'Yuvish va dazmollash',
  '24/7 xonaga xizmat',
];

/**
 * The room's own amenities plus the hotel's extra services. Shared by the room
 * page (`card`) and the details dialog (`plain`) so both always list the same
 * things.
 */
export function RoomDetailsInfo({ room, variant = 'card' }: { room: Room; variant?: 'card' | 'plain' }) {
  const block = variant === 'card' ? 'surface rounded-3xl p-6' : 'rounded-2xl border border-[var(--line)] p-5';
  return <>
    <section className={`${block} ${variant === 'card' ? 'mt-6' : ''}`}>
      <h2 className="font-display text-2xl">Xona qulayliklari</h2>
      {room.amenities.length > 0
        ? <ul className="mt-5 grid gap-3 sm:grid-cols-2">{room.amenities.map((item) => <li key={item} className="flex items-center gap-2 text-sm"><Check size={16} className="text-champagne" />{item}</li>)}</ul>
        : <p className="mt-4 text-sm text-muted">Bu xona uchun qulayliklar hali kiritilmagan.</p>}
    </section>
    <section className={`${block} ${variant === 'card' ? 'mt-5' : 'mt-4'}`}>
      <h2 className="font-display text-2xl">Qo‘shimcha xizmatlar</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">{ROOM_EXTRA_SERVICES.map((item) => <li key={item} className="flex items-center gap-2 text-sm"><Check size={16} className="text-champagne" />{item}</li>)}</ul>
      <p className="mt-5 text-xs leading-6 text-muted">Qo‘shimcha xizmatlar narxi qabulxonada aniqlashtiriladi.</p>
    </section>
  </>;
}
