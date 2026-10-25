import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';

export function HotelContactSettings() {
  const { data, updateData } = useAppData();
  const { success, error } = useToast();
  const contact = data.settings.contact;
  return <section className="surface rounded-2xl p-5 sm:p-7"><h2 className="font-display text-2xl">Mehmonxona va aloqa ma’lumotlari</h2><p className="mt-2 text-xs leading-6 text-muted">Saqlangan telefon, email va manzil asosiy sahifa, menyu va footer’da qo‘llanadi. Hozircha o‘zgarishlar shu brauzerda saqlanadi.</p>
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const value = (key: string) => String(form.get(key) ?? '').trim();
      if (!/^https?:\/\//i.test(value('mapUrl'))) { error('Xarita uchun http yoki https havola kiriting.'); return; }
      updateData((current) => ({ ...current, settings: { ...current.settings, hotelName: value('hotelName'), contact: { phone: value('phone'), email: value('email'), address: value('address'), city: value('city'), mapUrl: value('mapUrl') } } }));
      success('Aloqa ma’lumotlari saqlandi va saytga qo‘llandi.');
    }}>
      {[
        ['hotelName', 'Mehmonxona nomi', data.settings.hotelName, 'text'], ['phone', 'Bog‘lanish telefoni', contact.phone, 'tel'], ['email', 'Aloqa emaili', contact.email, 'email'], ['address', 'Ko‘cha va uy raqami', contact.address, 'text'], ['city', 'Shahar va hudud', contact.city, 'text'], ['mapUrl', 'Xarita havolasi', contact.mapUrl, 'url'],
      ].map(([name, label, value, type]) => <label key={name} className="text-xs font-semibold">{label}<input name={name} type={type} required defaultValue={value} className="field mt-2" /></label>)}
      <div className="sm:col-span-2 flex justify-end"><button className="primary-button">Aloqani saqlash</button></div>
    </form>
  </section>;
}
