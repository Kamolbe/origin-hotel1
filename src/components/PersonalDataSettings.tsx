import { Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { usesHotelServer } from '../services/hotelServer';

export function PersonalDataSettings({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const { data, updateData, serverStatus } = useAppData();
  const { success, error } = useToast();
  const { preferences } = useUserPreferences();
  const account = data.users.find((item) => item.id === user?.id);
  function exportData() {
    if (!user) return;
    try {
      const guestIds = new Set(data.guests.filter((guest) => guest.email.toLowerCase() === user.email.toLowerCase()).map((guest) => guest.id));
      const bookings = data.bookings.filter((booking) => booking.userId ? booking.userId === user.id : guestIds.has(booking.guestId));
      const payload = { profile: { name: user.name, email: user.email, phone: account?.phone ?? '', nationality: account?.nationality ?? '', createdAt: account?.createdAt }, preferences, bookings };
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'mening-mehmonxona-malumotlarim.json'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { error('Ma’lumotlarni yuklab olishda xatolik yuz berdi. Qayta urinib ko‘ring.'); }
  }
  return <section aria-label="Ma’lumotlaringiz" className={embedded ? 'min-w-0 space-y-5' : 'surface space-y-5 rounded-3xl p-5 sm:p-7'}>
    <h2 className="font-display text-2xl">Ma’lumotlaringiz</h2>
    <p className="text-sm leading-7 text-muted">{usesHotelServer() ? 'Profil va bron ma’lumotlaringiz server bazasida saqlanadi. Faylga faqat o‘zingizga tegishli profil, bronlar va shaxsiy tanlovlar kiritiladi.' : 'Profil, bron va shaxsiy tanlovlar hozir ushbu brauzerda saqlanadi. Boshqa qurilmaga avtomatik ko‘chmaydi.'} Yuklab olinadigan faylga parol va maxsus kodlar kiritilmaydi.</p>
    <button type="button" onClick={exportData} className="primary-button gap-2"><Download size={16} />Ma’lumotlarimni yuklab olish</button>
    <div className="border-t border-[var(--line)] pt-5"><button type="button" disabled={serverStatus === 'saving'} onClick={() => {
      updateData((state) => ({ ...state, notifications: state.notifications.map((note) => note.userId === user?.id ? { ...note, read: true } : note) }));
      success('Shaxsiy bildirishnomalar o‘qilgan deb belgilandi.');
    }} className="secondary-button">Shaxsiy bildirishnomalarni o‘qilgan qilish</button></div>
  </section>;
}
