import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';

const FIELDS: Array<[name: string, label: string, type: string]> = [
  ['hotelName', 'Mehmonxona nomi', 'text'],
  ['phone', 'Bog‘lanish telefoni', 'tel'],
  ['email', 'Aloqa emaili', 'email'],
  ['address', 'Ko‘cha va uy raqami', 'text'],
  ['city', 'Shahar va hudud', 'text'],
  ['mapUrl', 'Xarita havolasi', 'url'],
  ['telegram', 'Telegram bot havolasi', 'url'],
  ['instagram', 'Instagram sahifasi', 'url'],
  ['facebook', 'Facebook sahifasi', 'url'],
];

/**
 * Hotel identity and contact channels. Everything saved here is pushed to the
 * public site immediately: header, footer, the contact dialog, the room pages
 * and the "Administrator bilan bog'lanish" buttons.
 */
export function HotelContactSettings() {
  const { data, updateData } = useAppData();
  const { success, error } = useToast();
  const contact = data.settings.contact;

  const values: Record<string, string> = {
    hotelName: data.settings.hotelName,
    phone: contact.phone,
    email: contact.email,
    address: contact.address,
    city: contact.city,
    mapUrl: contact.mapUrl,
    telegram: contact.telegram,
    instagram: contact.instagram,
    facebook: contact.facebook,
  };

  return <section className="surface rounded-2xl p-5 sm:p-7">
    <h2 className="font-display text-2xl">Mehmonxona va aloqa ma’lumotlari</h2>
    <p className="mt-2 text-xs leading-6 text-muted">Telefon, email, manzil, Telegram bot va ijtimoiy tarmoqlar asosiy sahifa, menyu, footer va “Administrator bilan bog‘lanish” oynasida ko‘rsatiladi. O‘zgarishlar shu brauzerda saqlanadi.</p>
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const value = (key: string) => String(form.get(key) ?? '').trim();
      if (!/^https?:\/\//i.test(value('mapUrl'))) { error('Xarita uchun http yoki https havola kiriting.'); return; }
      const links = ['telegram', 'instagram', 'facebook'].filter((key) => value(key) && !/^https?:\/\//i.test(value(key)));
      if (links.length) { error('Telegram, Instagram va Facebook uchun to‘liq havola (https://…) kiriting.'); return; }
      updateData((current) => ({
        ...current,
        settings: {
          ...current.settings,
          hotelName: value('hotelName'),
          contact: {
            phone: value('phone'),
            email: value('email'),
            address: value('address'),
            city: value('city'),
            mapUrl: value('mapUrl'),
            telegram: value('telegram'),
            instagram: value('instagram'),
            facebook: value('facebook'),
          },
        },
      }));
      success('Aloqa ma’lumotlari saqlandi va saytga qo‘llandi.');
    }}>
      {FIELDS.map(([name, label, type]) => <label key={name} className={`text-xs font-semibold ${name === 'hotelName' ? 'sm:col-span-2' : ''}`}>{label}<input name={name} type={type} required={name !== 'telegram' && name !== 'instagram' && name !== 'facebook'} defaultValue={values[name]} placeholder={type === 'url' ? 'https://…' : undefined} className="field mt-2" /></label>)}
      <p className="text-[10px] leading-5 text-muted sm:col-span-2">Telegram bot: <span className="font-mono">https://t.me/your_bot</span> · bo‘sh qoldirilgan ijtimoiy havola saytda ko‘rinmaydi.</p>
      <div className="flex justify-end sm:col-span-2"><button className="primary-button">Aloqani saqlash</button></div>
    </form>
  </section>;
}
