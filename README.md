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

Loyiha server yoki ma’lumotlar bazasi o‘rniga brauzer `localStorage`’idan foydalanadi. Ma’lumotlar joriy brauzer profilida saqlanadi va qurilmalar o‘rtasida sinxronlanmaydi. “Google bilan kirish” Firebase Authentication orqali ishlaydi (quyida sozlamalari bor). Email/push bildirishnomalari, ikki bosqichli himoya va faol sessiyalar haqidagi boshqaruvlar namoyish uchun berilgan. Valyuta kurslari taxminiy. Demo muhitiga haqiqiy parol yoki shaxsiy ma’lumot kiritmang.

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

Asosiy sahifadagi bron tugmalari `/app/rooms` manziliga olib boradi. Kirilmagan bo‘lsa login orqali qaytiladi; sanalar, mehmonlar soni va tanlangan xona turi saqlanadi. Tizimga kirgan foydalanuvchi `/login` ochsa kabinetga qaytariladi. Xona kartasidagi “Batafsil” esa kirishni talab qilmaydigan `/rooms/:roomId` sahifasini ochadi.

Admin → Sozlamalar → Mehmonxona va aloqa orqali nom, telefon, email, manzil va xarita havolasini o‘zgartirish mumkin. Bu qiymatlar asosiy sahifa, navigatsiya va footer’da ishlatiladi. Admin → Xonalar’da yaratish/tahrirlash/o‘chirish bor; bron tarixi bor xona o‘chirilmaydi. Admin → Foydalanuvchilar’da lokal hisoblar, oxirgi kirish va faoliyat tarixi ko‘rinadi.

Muhim: mehmonxona ma’lumotlari hozircha `localStorage`da. Boshqa brauzer va qurilmalarga tarqatish, haqiqiy online kuzatuv, markaziy rollar va admin xavfsizligi uchun backend va server ruxsatlari kerak. Firebase Authentication Google foydalanuvchisini tekshiradi, lekin bu o‘zi umumiy mehmonxona ma’lumotlar bazasi emas. Mavjud SMTP/backup/2FA sozlamalari to‘liq server xizmatlarini yoqmaydi.

Kirish sahifasining tashqi qismi ekranga mahkamlangan; kichik ekranda uzun forma ichidan aylantiriladi, maydonlar yashirilmaydi.

## Mobil pastki menyu

767 px va kichik ekranlarda pastki menyu faqat tizimga kirgan foydalanuvchiga ko‘rinadi. Kabinet (`/app/my-stay`) faqat o‘z bronlarini va profilini, Xonalar (`/rooms`) barcha xonalarni, Aloqa (`/contact`) alohida aloqa sahifasini, Bosh sahifa esa `/`ni ochadi. Faol belgi ochilgan route bilan boshqariladi. Mobil aloqa tugmalari modal emas, sahifa ochadi; kompyuterda mavjud aloqa modali va tezkor menyu saqlanadi.

## Admin sayt muharriri

Admin → Sozlamalar → Sayt muharriri:

- Matnlar: olti tilda `landing`, `nav`, `footer` va `amenity` matnlarini alohida tahrirlash. Bo‘sh matn standart tarjimani qaytaradi; `{{count}}` kabi o‘rinbosarlarni saqlang.
- Rasmlar va logo: asosiy va pastki bannerlar, xona turlari, mehmonxona rasmi, logo va 12 tagacha galereya havolasi. Faqat HTTP(S) yoki lokal `/…` manzillar qabul qilinadi; standart rasmga qaytish uchun maydonni bo‘sh qoldiring.
- Sahifa bo‘limlari: bosh sahifa bloklari va bron panelini ko‘rsatish/yashirish.
- Mehmonxona qoidalari: kelish/ketish vaqti, asosiy valyuta va qo‘shimcha xizmatlar. Valyuta almashtirish summalarni konvertatsiya qilmaydi.

Admin → Sozlamalar → Menyu va interfeys: aksent, yorug‘ mavzudagi sahifa/karta/matn ranglari va shrift saytga darhol qo‘llanadi. Standart dizaynni tiklash tugmasi mavjud. SEO sarlavha, description va keywords ham hujjatga qo‘llanadi. Analytics ID, SMTP, server backup va 2FA maydonlari mustaqil server xizmatini avtomatik yoqmaydi.

Admin → Xonalar: har bir xona uchun alohida rasm va tavsif qo‘shish mumkin; bu ro‘yxat, batafsil sahifa, modal va bron preview’da qo‘llanadi.

Server sozlamalari kiritilmasa boshqaruv lokal demo: `localStorage` va shu origin’dagi boshqa tablar bilan ishlaydi. Pastdagi “Firebase orqali doimiy saqlash” adapterini sozlab admin nusxalarini saqlash va ommaviy sayt ma’lumotlarini nashr qilish mumkin. Oddiy mehmonlarning umumiy bron oqimi va email/parol autentifikatsiyasi esa hali lokal demo; to‘liq production uchun ishonchli foydalanuvchi autentifikatsiyasi va bron backend talab qilinadi. Admin paroli va maxsus kodlar client kodida demo sifatida mavjud; haqiqiy himoya hisoblanmaydi.

## Mehmonning shaxsiy sozlamalari

Oddiy foydalanuvchi/manager → Sozlamalar ichida profil, shaxsiy tanlovlar, ma’lumotlar va yordam bo‘limlari bor. Til, mavzu, kamroq animatsiya, odatiy mehmonlar soni, afzal xona turi va bron izohi hisobning `preferences` maydonida saqlanadi. Mehmonlar soni yangi qidiruv/bron shakliga, xona turi xona ro‘yxati filtriga, izoh esa bron shakliga boshlang‘ich qiymat bo‘lib o‘tadi; aniq tanlangan bron parametrlari ustun turadi. Hisob emaili bu shakldan almashtirilmaydi.

Shaxsiy ma’lumotlarni JSON eksport qilish faqat joriy foydalanuvchining profili, tanlovlari va bronlarini oladi; autentifikatsiya paroli/maxsus kodlarini eksport qilmaydi. Bu sozlamalar ham umumiy backend emas, shu brauzerdagi hisobga tegishli lokal ma’lumotlardir. Xabar/email yuborish yoki boshqa qurilmalarga sinxronlash qo‘shilmagan.

## Firebase orqali doimiy saqlash

Kodda Vercel server API va Firebase Firestore saqlash adapteri bor. **Bu ulanish server environment variables kiritilmaguncha faol emas.** Faqat `npm run dev` Vercel API funksiyalarini ishga tushirmaydi; lokal to‘liq tekshiruv uchun `vercel dev` yoki Vercel deploy kerak. Oddiy lokal sayt API ulanmaganida ishlashda davom etadi.

1. Firebase Console → `origin-hotel` → Firestore Database’da bazani yarating. Ushbu imkoniyat Firebase Authentication’dan alohida. `firestore.rules` server snapshotlarini brauzerdan o‘qish/yozishni taqiqlaydi. Mavjud boshqa collection qoidalarini almashtirmasdan, shu uchta collection uchun qoidalarni qo‘shing va ochiq umumiy wildcard qoida ularga ruxsat bermayotganini tekshiring.
2. Firebase Project settings → Service accounts → Firebase Admin SDK’dan server kaliti yarating. JSON fayl tarkibini Vercel → Project → Settings → Environment Variables’da **`FIREBASE_SERVICE_ACCOUNT`** nomi bilan saqlang. Kalitni GitHub, frontend, chat yoki `VITE_…` o‘zgaruvchisiga kiritmang. Service account’ga Firestore uchun kerakli server huquqi bo‘lsin.
3. Serverdagi **`HOTEL_ADMIN_EMAIL`** ni hozircha `admin@admin.com` qiling. Emailni keyin shu environment variable’dan almashtiring. Ushbu server kirishi Google emailining egasi bo‘lishni talab qilmaydi; u alohida server paroli bilan tekshiriladi.
4. `node scripts/create-cloud-password.mjs` buyrug‘ini ishga tushiring. Kamida 12 belgili yangi bulut parolini kiriting; chiqqan hash’ni **`HOTEL_ADMIN_PASSWORD_HASH`** environment variable’iga qo‘ying. Parolning o‘zini environment variable yoki GitHub’ga yozmang. Bu parol frontenddagi demo admin parolidan mustaqil.
5. `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` bilan tasodifiy qiymat yarating; uni **`HOTEL_SESSION_SECRET`** ga qo‘ying. Uni ham faqat serverda saqlang. Keyin Vercel’da qayta deploy qiling.
6. Admin → Sozlamalar → **Bulutda saqlash**: email va yuqorida tanlangan bulut paroli bilan ulaning. Bulutda avval saqlangan nusxa bo‘lsa yuklanadi; bo‘lmasa joriy nusxa birinchi marta saqlanadi. Keyingi admin o‘zgarishlari avtomatik yuboriladi. **“Bulutga saqlandi”** holatini kuting. Brauzerni saqlanayotgan paytda yopmang. Xato chiqsa mahalliy o‘zgarishni yo‘qotmasdan qayta saqlash yoki bulutdan qayta yuklash mumkin.

API server parolini tekshiradi, 2 soatlik imzolangan sessiya beradi va xato parollar uchun tezlik cheklovini qo‘llaydi. Firestore snapshotlar siqilgan bo‘laklarda, oldingi versiyalar bilan saqlanadi. Bir vaqtda ikki admin nusxasi o‘zgartirilsa eski nusxa yangisini ustidan yozmaydi (`409`); avval bulutdagi nusxani qayta yuklash kerak. Oddiy foydalanuvchilar API orqali faqat e’lon qilingan xona va sayt sozlamalarini oladi; mehmonlar, moliya, foydalanuvchilar va ichki audit ochilmaydi. Saytning boshqa qurilmalari e’lon qilingan ma’lumotni ochilganda va har 30 soniyada oladi.

Bu adapter **admin qilgan o‘zgarishlarni** va uning ichki holatini saqlaydi. Oddiy foydalanuvchilarning email/parol autentifikatsiyasi hamda yangi bron so‘rovlarini qurilmalararo uzatish hali lokal demo oqimidir. Demo foydalanuvchi parollari va accessCode bulutga yuborilmaydi; boshqa qurilmada mahalliy parol bilan yangi hisobga kirish alohida ishonchli auth backend talab qiladi. Yuboriladigan snapshot 3.5 MB dan oshsa UI xato ko‘rsatadi; ko‘p rasmlar uchun tashqi rasm havolalaridan foydalaning yoki alohida media storage ulang.

Firebase loyihasi, hisob va billing faol bo‘lishi hamda zaxira nusxalar yuritilishi kerak. “Butun umr” kafolati berilmaydi; brauzerni tozalash e’lon qilingan server nusxasini o‘chirmaydi. “Ulanishni uzish” server ma’lumotini o‘chirmaydi. Server environment variables va ishlaydigan Firestore ulanmaguncha faqat lokal saqlash mavjud.

Server/API testlari: `node --test tests/cloud-api.test.mjs` (Node 24 tavsiya etiladi). Testda Firestore tarmoq adapteri xotiradagi baza bilan almashtirilgan; production Firebase credentials sinovdan o‘tganini anglatmaydi.

## Guruhlab o‘chirish

Xonalar, mehmonlar, moliya, foydalanuvchilar va galereyada “Barchasini belgilash” / “Belgilab o‘chirish” oynasi bor. Tanlash joriy qidiruv/filtrga tegishli; o‘chirish alohida tasdiqlanadi. Bron tarixi bor xonalar, faol bronli mehmonlar, o‘z hisobingiz va adminlar guruhlab o‘chirilmaydi. Tugatilgan bronlarning avvalgi guruhlab o‘chirish amali saqlangan.

## 20 ish kunlik PDF talablariga qo‘shimchalar

Talablarning to‘liq bandma-band xaritasi, model sxemasi, QA va demo ssenariysi: [docs/HOTEL_DEMO_REQUIREMENTS.md](./docs/HOTEL_DEMO_REQUIREMENTS.md).

Reactda: alohida Check-in/Check-out, haqiqiy kirish/chiqish vaqtlari, check-outda tozalash holati, moliya tahriri, 5 tadan kirim/chiqim kategoriyasi, ixtiyoriy sun’iy test pasport maydoni va dashboardda sana oralig‘i qo‘shildi. Hisobotning oxirgi kuni va checkout xona-tun hisobi tuzatildi. Guruhlab tanlash va tasdiqlash endi sahifa ichida, modal emas.

PDFdagi **Python + Django + SQLite + HTML/CSS + Bootstrap** uchun [backend/](./backend/README.md) server demo qo‘shildi: bazada saqlanadigan Room/Guest/Booking/Finance, server login/rollar/CSRF, admin, CRUD, qidiruv, 15 tadan ro‘yxatlar, transactional check-in/out va hisobot. Django ishga tushganda asosiy `/` va `/app/...` sahifalari shu React interfeysini server sessiyasi va SQLite bazasi bilan ishlatadi. `/management/` qo‘shimcha interfeys, bazasi bir xil. Vite/static demo rejimi alohida qoladi; eski localStorage nusxasi serverga avtomatik ko‘chirilmaydi. Vercelga `git push` qilish Django serverni ishga tushirmaydi; backend README bo‘yicha Python server kerak. Buni tayyor production integratsiyasi deb hisoblamang.

## Asosiy sayt + server bazasi (PDFdagi to‘liq oqim)

Avval `npm.cmd ci --include=dev`, `npm.cmd run build`; so‘ng [backend README](./backend/README.md) bo‘yicha Python venv, requirements, `migrate`, `createsuperuser`, `runserver`. **Asosiy sayt: http://127.0.0.1:8000/**. Aynan shu interfeysda mehmon bronlari boshqa admin sessiyasiga keladi, admin o‘zgarishlari SQLite’da saqlanadi, check-in/out va moliya bir backend bilan ishlaydi. Windows yordamchisi: `scripts\start-hotel-server.cmd`.

Bu rejimda parollar browserga yuborilmaydi, server ruxsatlari/CSRF tekshiriladi va saqlash xatolari ko‘rinadi. Brauzerdagi demo admin paroli serverga avtomatik o‘tmaydi; birinchi hisob `createsuperuser` bilan yaratiladi. Faqat `npm run dev` yoki Vercel static deploy backendni avtomatik ishga tushirmaydi. Haqiqiy Vercel saytga ulash uchun deploy qilingan Python server domeni va proxy/env sozlamalari kerak.
