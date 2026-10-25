# Origin Hotel

React, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Framer Motion, lucide-react va i18next asosidagi mehmonxona sayti hamda rollar bo‘yicha boshqaruv paneli demo-loyihasi.

## Ishga tushirish

```bash
npm install
npm run dev
```

Lokal ishlab chiqish serveri `3000` portida ishlaydi. Ishlab chiqarish yig‘masi uchun `npm run build`, TypeScript tekshiruvi uchun `npm run typecheck` buyrug‘ini ishga tushiring. Yig‘ilgan fayllar `dist/` papkasiga yoziladi.

## Demo hisoblari

| Rol | Email | Parol | Maxsus kod |
| --- | --- | --- | --- |
| Admin | `admin@admin.com` | `Admin2026!` | `admin1234` |
| Manager | `manager@manager.com` | `Manager2026!` | `manager1234` |
| Mehmon | `user@origin.uz` | `User2026!` | — |

Email `@admin.com` yoki `@manager.com` bilan tugaganda maxsus kod maydoni paydo bo‘ladi. Ro‘yxatdan o‘tish formasida lokal demo hisob yaratish ham mumkin.

## Demo cheklovlari

Loyiha server yoki ma’lumotlar bazasi o‘rniga brauzer `localStorage`’idan foydalanadi. Ma’lumotlar joriy brauzer profilida saqlanadi va qurilmalar o‘rtasida sinxronlanmaydi. “Google bilan kirish” Google Identity Services orqali ishlaydi va faqat `VITE_GOOGLE_CLIENT_ID` berilganda faollashadi (quyida “Google bilan kirish” bo‘limiga qarang); client ID berilmasa tugma buning sababini ko‘rsatadi va email orqali kirish ishlashda davom etadi. Email/push bildirishnomalari, ikki bosqichli himoya va faol sessiyalar haqidagi boshqaruvlar namoyish uchun berilgan. Valyuta kurslari taxminiy. Demo muhitiga haqiqiy parol yoki shaxsiy ma’lumot kiritmang.

Mehmonxonaning haqiqiy manzili berilmagani uchun sahifada Toshkentdagi taxminiy demo joylashuvi ko‘rsatiladi. Joylashuv bo‘limidagi yengil xarita sxemasi taxminiy; “Xaritani ochish” havolasi OpenStreetMap’ning interaktiv xaritasiga olib boradi. Foto manbalari [ASSET_SOURCES.md](./ASSET_SOURCES.md) faylida keltirilgan.

Til tanlagichi o‘zbek, rus, ingliz, turk, arab va xitoy tillarini almashtiradi va tanlovni saqlaydi. Navigatsiya, landing/kirish sahifalari va ayrim sozlama sarlavhalari tarjima qilingan; boshqaruv bo‘limlarining chuqur matnlari hamda jadvallarining bir qismi hozircha o‘zbekcha.

## Telefon va yuklanish tezligi

Hero ichidagi bron paneli telefon, planshet va desktop’da to‘liq ko‘rinadi. Landing, kirish va mehmon uchun xona rasmlari ekran kengligiga mos `srcset`/`sizes` variantlarini tanlaydi; xona va galereya rasmlari sahifaga yaqinlashganda yuklanadi. Sarlavha shriftlari sahifa matnining ilk ko‘rinishini to‘smasdan yuklanadi. Sahifalar yo‘nalish (route) bo‘yicha alohida bo‘laklarda; hisobot va eksport kodlari esa faqat zarur bo‘lganda yuklanadi.


Dashboard’dagi daromad grafigi ham viewport’ga yaqinlashgandagina alohida kod bo‘lagi sifatida yuklanadi; undan oldin yengil skeleton ko‘rsatiladi.

## Google bilan kirish

Google kirish Firebase Authentication orqali `signInWithPopup` va `GoogleAuthProvider` bilan ishlaydi. Firebase web konfiguratsiyasi `src/services/googleAuth.ts` ichida saqlangan; Client Secret kerak emas. `VITE_GOOGLE_CLIENT_ID` endi ishlatilmaydi.

1. Firebase Console → origin-hotel → Authentication → Sign-in method → Google → Enable. Support email tanlab, saqlang.
2. Authentication → Settings → Authorized domains ro‘yxatiga `localhost` va haqiqiy sayt domenini kiriting (protokol, port va yo‘lsiz). Yangi Firebase loyihalarida localhost avtomatik qo‘shilmasligi mumkin.
3. O‘zgartirishlardan so‘ng saytni yangilang. Popup bloklangan bo‘lsa, shu sayt uchun popup’ga ruxsat bering.

Google hisobi faqat mehmon rolini oladi; mavjud admin yoki manager hisobiga shu yo‘l bilan kirilmaydi. Firebase foydalanuvchini tekshiradi, lekin mehmonxona ma’lumotlari va ilova sessiyasi hozircha lokal demo: bu o‘zgarish backend avtorizatsiyasini qo‘shmaydi. Haqiqiy hisob bilan kirish Firebase provider va domen sozlamalari tayyor bo‘lgach tekshiriladi.

## Bron oynasi va Preview

Xona kartasidan bron so‘ralganda dialog tanlangan xona rasmi, turi/raqami, sig‘imi, qulayliklari va narxini ko‘rsatadi; desktop’da rasm va forma yonma-yon, telefonda esa ixcham rasm kartasi yuqorida turadi. Dialog ekran markazida ochiladi, uzun formalar ichida scroll bo‘ladi, sarlavha va yuborish/bekor qilish amallari ko‘rinishda qoladi. Bron sanalari bo‘sh kelsa, kelish ertaga va ketish keyingi kunga qo‘yiladi; yaroqsiz sanalarda jami narx ko‘rsatilmaydi va bron yuborilmaydi. Vite Preview serveri `.manus.computer` domeniga ruxsat beradi, qolgan noma’lum hostlarni ochiq qoldirmaydi.

## Windows: yetishmayotgan paket fayllari

`firebase/app` topilmasa yoki `node_modules/tailwindcss/index.css` uchun ENOENT chiqsa, avval shu loyihaning ishlayotgan Vite serverini barcha terminallarda Ctrl+C bilan to‘xtating. Node.js 22.12+ talab qilinadi. Loyiha papkasidan PowerShell yoki CMD’da:

```powershell
.\scripts\repair-windows.cmd
```

Bu buyruq lockfile bo‘yicha `npm.cmd ci` qiladi, Firebase/Tailwind fayllarini tekshiradi va build bajaradi. Faqat muvaffaqiyatli tugagach `npm.cmd run dev` qiling. EPERM chiqsa faylni ishlatayotgan loyiha serverini yoping; zarur bo‘lsa Windows’ni qayta ishga tushirib, serverni ochishdan oldin scriptni bajaring. `package-lock.json`ni o‘chirmang. PowerShell execution policy’ni o‘zgartirish talab qilinmaydi. Scriptning Windows’dagi bajarilishi bulutdagi Linux muhitida tekshirilmagan.

## Kabinet, bron havolalari va admin boshqaruvi

Asosiy sahifadagi bron tugmalari `/app/rooms` manziliga olib boradi. Kirilmagan bo‘lsa login orqali qaytiladi; sanalar, mehmonlar soni va tanlangan xona turi saqlanadi. Tizimga kirgan foydalanuvchi `/login` ochsa kabinetga qaytariladi. Xona kartasidagi “Batafsil” esa kirishni talab qilmaydigan modalni ochadi.

Admin → Sozlamalar → Mehmonxona va aloqa orqali nom, telefon, email, manzil va xarita havolasini o‘zgartirish mumkin. Bu qiymatlar asosiy sahifa, navigatsiya va footer’da ishlatiladi. Admin → Xonalar’da yaratish/tahrirlash/o‘chirish bor; bron tarixi bor xona o‘chirilmaydi. Admin → Foydalanuvchilar’da lokal hisoblar, oxirgi kirish va faoliyat tarixi ko‘rinadi.

Muhim: mehmonxona ma’lumotlari hozircha `localStorage`da. Boshqa brauzer va qurilmalarga tarqatish, haqiqiy online kuzatuv, markaziy rollar va admin xavfsizligi uchun backend va server ruxsatlari kerak. Firebase Authentication Google foydalanuvchisini tekshiradi, lekin bu o‘zi umumiy mehmonxona ma’lumotlar bazasi emas. Mavjud SMTP/backup/2FA sozlamalari to‘liq server xizmatlarini yoqmaydi.

Kirish sahifasining tashqi qismi ekranga mahkamlangan; kichik ekranda uzun forma ichidan aylantiriladi, maydonlar yashirilmaydi.
