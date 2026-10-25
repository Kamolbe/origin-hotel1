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

“Google bilan kirish” haqiqiy Google Identity Services (GIS) oqimidan foydalanadi va `VITE_GOOGLE_CLIENT_ID` muhit o‘zgaruvchisi bilan sozlanadi:

1. Google Cloud Console’da OAuth 2.0 turidagi “Web application” client yarating.
2. **Authorized JavaScript origins** ro‘yxatiga har bir manzilni alohida qo‘shing: mahalliy ishlab chiqish uchun `http://localhost:3000`, preview uchun `https://3000-$BASE44_PUBLIC_HOST_SUFFIX` (joriy qiymatni ilova muhitidan oling) va ishlab chiqarish domeningiz.
3. Client ID’ni ilovaning **Secrets** bo‘limiga `VITE_GOOGLE_CLIENT_ID` nomi bilan kiriting. Qiymat konteynerga `/run/base44/app.env` orqali uzatiladi; Vite muhit o‘zgaruvchilarini ishga tushishda o‘qiganligi uchun servis qayta ishga tushiriladi.

Client ID berilmasa ilova ishlashda davom etadi: tugma “Google orqali kirish hozircha sozlanmagan” deb xabar beradi.

Google hisobi bilan kirgan foydalanuvchi har doim **mehmon (`user`)** rolini oladi. Admin va manager rollari faqat email + maxsus kod orqali beriladi, shu tariqa Google identifikatori o‘zi bilan yuqori huquq olib kelmaydi. ID token `accounts.google.com` tomonidan imzolanadi; uni serverda qo‘shimcha tekshirish faqat backend qo‘shilganda talab qilinadi.

## Bron oynasi va Preview

Xona kartasidan bron so‘ralganda dialog tanlangan xona rasmi, turi/raqami, sig‘imi, qulayliklari va narxini ko‘rsatadi; desktop’da rasm va forma yonma-yon, telefonda esa ixcham rasm kartasi yuqorida turadi. Dialog ekran markazida ochiladi, uzun formalar ichida scroll bo‘ladi, sarlavha va yuborish/bekor qilish amallari ko‘rinishda qoladi. Bron sanalari bo‘sh kelsa, kelish ertaga va ketish keyingi kunga qo‘yiladi; yaroqsiz sanalarda jami narx ko‘rsatilmaydi va bron yuborilmaydi. Vite Preview serveri `.manus.computer` domeniga ruxsat beradi, qolgan noma’lum hostlarni ochiq qoldirmaydi.
