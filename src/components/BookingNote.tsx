import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import type { Booking } from '../types';
import { bookingNote } from '../services/bookingNotes';
import { Modal } from './Modal';

export function BookingNote({ booking, inline = false }: { booking: Booking; inline?: boolean }) {
  const [open, setOpen] = useState(false);
  const note = bookingNote(booking);
  if (inline) return <section aria-label={`${booking.bookingNumber} izohi`} className="mt-4 rounded-xl bg-[var(--page)] p-3"><h4 className="flex items-center gap-2 text-[10px] font-semibold text-muted"><MessageSquareText size={13} />Bron izohi</h4><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 [overflow-wrap:anywhere]">{note || 'Izoh qoldirilmagan'}</p></section>;
  if (!note) return <span className="text-[10px] text-muted">Izoh qoldirilmagan</span>;
  return <div className="min-w-0 max-w-56"><p className="mb-2 line-clamp-2 break-words text-[10px] leading-5 text-muted [overflow-wrap:anywhere]">{note}</p><button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2 text-[10px] font-semibold hover:border-champagne"><MessageSquareText size={13} />Izohni ko‘rish</button><Modal open={open} onClose={() => setOpen(false)} title="Bron izohi" description={`${booking.bookingNumber} · ${booking.checkIn} — ${booking.checkOut}`}><p className="whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere]">{note}</p></Modal></div>;
}
