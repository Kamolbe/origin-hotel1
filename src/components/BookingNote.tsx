import { MessageSquareText } from 'lucide-react';
import type { Booking } from '../types';
import { bookingNote } from '../services/bookingNotes';

export function BookingNote({ booking, inline = false }: { booking: Booking; inline?: boolean }) {
  const note = bookingNote(booking);
  if (inline) return <section aria-label={`${booking.bookingNumber} izohi`} className="mt-4 rounded-xl bg-[var(--page)] p-3"><h4 className="flex items-center gap-2 text-[10px] font-semibold text-muted"><MessageSquareText size={13} />Bron izohi</h4><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 [overflow-wrap:anywhere]">{note || 'Izoh qoldirilmagan'}</p></section>;
  if (!note) return <span className="text-[10px] text-muted">Izoh qoldirilmagan</span>;
  return <p className="min-w-0 max-w-64 whitespace-pre-wrap break-words text-xs leading-6 text-muted [overflow-wrap:anywhere]">{note}</p>;
}
