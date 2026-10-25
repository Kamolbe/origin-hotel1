import { Select } from '../Select';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatMoney } from '../../services/hotelUtils';

const questions = [
  ['Xonani qanday bron qilaman?', 'Kelish va ketish sanalarini hamda mehmonlar sonini tanlang. Hisobingizga kirgach, xonalarni ko‘rib, mos xonaga bron so‘rovini yuborishingiz mumkin.'],
  ['Bronlarimni qayerdan ko‘raman?', 'Tizimga kirganingizdan so‘ng “Bronlar” bo‘limida o‘z bronlaringiz va ularning holatini kuzatishingiz mumkin.'],
  ['To‘lov shu saytda amalga oshiriladimi?', 'Hozirgi sayt demo rejimida ishlaydi. Haqiqiy onlayn to‘lov olinmaydi. Hisoblagichdagi narx taxminiy: qo‘shimcha xizmatlar va yakuniy shartlarni mehmonxona bilan aniqlashtiring.'],
  ['Google orqali kirish shartmi?', 'Yo‘q. Email orqali kirish ham mavjud. Google orqali kirish mehmonxona tomonidan sozlanganda ishlaydi.'],
  ['Ma’lumotlarim saqlanadimi?', 'Demo ma’lumotlari shu brauzerda saqlanadi. Boshqa qurilmada ko‘rinmaydi va brauzer ma’lumotlari tozalansa o‘chishi mumkin. Haqiqiy shaxsiy yoki to‘lov ma’lumotlarini kiritmang.'],
];

export function StayPlanner() {
  const { data } = useAppData();
  const types = [...new Set(data.rooms.map((room) => room.type))];
  const [type, setType] = useState<string>(types[0] ?? 'Standard');
  const [nights, setNights] = useState('2');
  const [open, setOpen] = useState<number | null>(0);
  const room = data.rooms.filter((item) => item.type === type).sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
  const count = Number(nights);
  const valid = Number.isInteger(count) && count >= 1 && count <= 30;
  const field = 'mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--page)] px-4 py-3 text-sm outline-none focus:border-champagne';

  return <section id="stay-planner" className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 lg:grid-cols-2 lg:gap-20 lg:px-10">
    <div className="surface rounded-3xl p-6 sm:p-9">
      <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-champagne"><Calculator size={16} />Safaringizni rejalashtiring</span>
      <h2 className="mt-4 font-display text-3xl sm:text-4xl">Dam olish budjetingiz</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Xona turini tanlang va turar joy uchun taxminiy xarajatni hisoblang.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold">Xona turi<Select className={field} value={type} onChange={(event) => setType(event.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</Select></label>
        <label className="text-xs font-semibold">Tunlar soni<input className={field} type="number" min="1" max="30" step="1" value={nights} onChange={(event) => setNights(event.target.value)} aria-describedby="planner-hint" /></label>
      </div>
      <div aria-live="polite" aria-atomic="true" className="my-6 rounded-2xl bg-champagne/10 p-5">
        {valid && room ? <><p className="text-xs text-muted">{formatMoney(room.pricePerNight, data.settings.currency)} × {count} tun</p><p className="mt-2 break-words font-display text-3xl">{formatMoney(room.pricePerNight * count, data.settings.currency)}</p><p className="mt-2 text-xs text-muted">Tanlangan turdagi eng arzon xona bo‘yicha. Mavjudlik sanalarga bog‘liq.</p></> : <p className="text-sm">{room ? '1 dan 30 gacha butun tun sonini kiriting.' : 'Hozircha bu turdagi xona mavjud emas.'}</p>}
      </div>
      <p id="planner-hint" className="mb-5 flex gap-2 text-xs leading-5 text-muted"><ShieldCheck size={18} className="shrink-0 text-champagne" />Taxminiy hisob, to‘lov emas. Qo‘shimcha xizmatlar kiritilmagan.</p>
      <Link to="/login" state={{ from: '/app/rooms' }} className="primary-button w-full gap-2">Xonalarni ko‘rish<ArrowRight size={15} /></Link>
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-champagne">Foydali ma’lumotlar</p>
      <h2 className="mt-4 font-display text-3xl sm:text-4xl">Safar oldidan savollar</h2>
      <div className="mt-7 divide-y divide-[var(--line)]">{questions.map(([question, answer], index) => <div key={question}>
        <h3><button type="button" aria-expanded={open === index} aria-controls={`stay-answer-${index}`} id={`stay-question-${index}`} onClick={() => setOpen(open === index ? null : index)} className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold hover:text-champagne"><span>{question}</span><ChevronDown size={17} className={`shrink-0 transition-transform ${open === index ? 'rotate-180' : ''}`} /></button></h3>
        <div id={`stay-answer-${index}`} role="region" aria-labelledby={`stay-question-${index}`} hidden={open !== index}><p className="pb-5 text-sm leading-7 text-muted">{answer}</p></div>
      </div>)}</div>
      <a href="#rooms" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-champagne">Xona turlariga qaytish<ArrowRight size={15} /></a>
    </div>
  </section>;
}
