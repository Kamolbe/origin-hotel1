# Origin Hotel — amalga oshirish rejasi

## Maqsad va doira
Origin Hotel uchun o‘zbek tilidagi, telefon, planshet va kompyuterga mos mehmonxona sayti hamda boshqaruv paneli quriladi. Ommaviy landing sahifasi mehmonxona, xona turlari, qulayliklar, sharhlar, galereya, aloqa va bron so‘rovini ko‘rsatadi. Kirgandan keyingi ilova foydalanuvchi, manager va admin rollari uchun alohida ruxsatlar bilan xonalar, mehmonlar, bronlar, moliya, hisobotlar hamda sozlamalarni boshqaradi.

## Arxitektura va ishlash usuli
- React + Vite + TypeScript, React Router, Tailwind CSS v4 (`@tailwindcss/vite`), lucide-react, Recharts va Framer Motion ishlatiladi. Tailwind dizayn tokenlari CSS-first usulida `src/styles.css` faylida saqlanadi; alohida v3 `tailwind.config.ts` yoki PostCSS konfiguratsiyasi kerak emas.
- Sahifalar React Router bilan route darajasida lazy-load qilinadi. Hisobotlarning ExcelJS paketi faqat foydalanuvchi Excel eksportini tanlaganda yuklanadi.
- Tarjimalar i18n orqali; hisobotlar XLSX va PDF formatlarida eksport qilinadi.
- Backend va ma’lumotlar bazasi ishlatilmaydi: `src/services/` qatlamidagi saqlash xizmatlari brauzer `localStorage` bilan ishlaydi; boshlang‘ich demo ma’lumotlar birinchi ochilishda yaratiladi. Keyinchalik APIga almashtirish oson bo‘lishi uchun komponentlar saqlash qatlamidan ajratiladi.
- Login demo rejimida ishlaydi. Admin va manager uchun maxsus kod talab qilinadi; har bir rolga ruxsat route guard bilan tekshiriladi. Google tugmasi OAuth sozlamalari bo‘lmagani uchun demo foydalanuvchi sifatida kirishni bajaradi, haqiqiy Google autentifikatsiyasi emas. Brauzer/localStorage’dagi rol tekshiruvi faqat prototip/demo uchun; haqiqiy ishlab chiqarish tizimida ishonchli autentifikatsiya o‘rnini bosa olmaydi.
- Haqiqiy email/push jo‘natish, qurilmalararo real-time sinxronlash va Google OAuth server hamda tashqi xizmat sozlamalarini talab qiladi. Hozirgi localStorage-first doirada bildirishnoma va sozlamalar ishlaydigan demo interfeysi bo‘ladi.
- Boshlang‘ich ma’lumotlar: kamida 40 xona, 5 qavat, 30 mehmon, 50 bron va moliya yozuvlari. CRUD amallaridan keyin ma’lumotlar localStorage’da saqlanadi.
- Demo kirishlar: admin — `admin@admin.com`, parol `Admin2026!`, maxsus kod `admin1234`; manager — `manager@manager.com`, parol `Manager2026!`, maxsus kod `manager1234`; foydalanuvchi — `user@origin.uz`, parol `User2026!`.
- Rasmlar uchun Unsplash’ning bevosita CDN manzillaridan premium lobby, xona va basseyn fotosuratlari tanlanadi; tegishli Unsplash sahifalariga havolalar qo‘shiladi. Mehmonxonaning haqiqiy manzili berilmagani sababli xaritada Toshkent shahri uchun demo joylashuvi ko‘rsatiladi va manzilni keyin almashtirish mumkin bo‘ladi.
- Ommaga nashr etish va backendga ulash bu bosqichga kiritilmaydi. Birinchi topshiruv — Preview’da ochiladigan, localStorage’da saqlaydigan to‘liq frontend demo.

## Sahifalar va xatti-harakatlar
1. `/` — ommaviy landing: 4 kadrli avtomatik hero slayderi, bron formasi, 5 xona turi, qulayliklar, animatsiyali ko‘rsatkichlar, sharhlar, galereya, joylashuv va aloqa.
2. `/login` — split-screen kirish/ro‘yxatdan o‘tish, forma tekshiruvi, email domeniga qarab avtomatik ko‘rinadigan maxsus kod maydoni va demo Google tugmasi.
3. `/app` hamda `/app/rooms`, `/app/guests`, `/app/bookings`, `/app/finance`, `/app/reports`, `/app/settings`, `/app/profile`, `/app/users` — himoyalangan boshqaruv sahifalari. Role guard va yon menyu faqat tegishli rolga ruxsat etilgan qismlarni ochadi.
4. Bo‘sh xonalarni ko‘rish va filtrlash, bron muddatlari to‘qnashuvini tekshirish, bron so‘rovi yuborish, admin tasdiqlashi yoki rad etishi hamda foydalanuvchi bekor qilishi mumkin. Xona topilmasa “Bizda bo‘sh o‘rinlar qolmagan” xabari chiqadi.
5. Xona, mehmon, bron, moliya va foydalanuvchi ma’lumotlari uchun ishlaydigan demo CRUD; admin uchun xonaga joylashtirish tafsilotlarini ham saqlaydigan audit jurnali. Manager moliya va hisobotlarni boshqaradi, ammo bron so‘rovlarini tasdiqlay olmaydi.
6. Dashboard’da bandlik va daromad grafigi, qavatlar bo‘yicha xona xaritasi, bugungi check-in/check-out, Ctrl+K qidiruv, bildirishnoma/toast va tasdiqlash oynasi.
7. Hisobotlarda sana oralig‘i, xona turlari taqqoslanishi, eng ko‘p daromad keltirgan xonalar, chop etish hamda XLSX/PDF eksport.
8. 6 til: o‘zbek, rus, ingliz, turk, arab va xitoy. Til tanlovi localStorage’da saqlanadi; arab tili RTL yo‘nalishidan foydalanadi. Hozir tarjimalar navbar, landing/auth va sozlamalarning ayrim sarlavhalarini qamrab oladi; chuqur dashboard va jadval matnlarining bir qismi o‘zbekcha qolgan. UZS/USD/EUR valyutasi, dark/light mavzu, profil/hisob/bildirishnoma/backup sozlamalari ham bo‘ladi.

## Dizayn yo‘nalishi
- **Dizayn oqimi:** zamonaviy butik-mehmonxonaning sokin hashamati; arxitektura shakllari, iliq materiallar va nafis tipografiyaga tayangan muharrirlik uslubi.
- **Asosiy tamoyillar:** sokin premium kayfiyat; ma’lumotlarning aniq darajalanishi; yirik suratlarni kam va maqsadli ishlatish; boshqaruv panelida kundalik ishlarni tez bajarish.
- **Ranglar:** tungi to‘q ko‘k/ko‘mir rang (`#111B22`), champagne gold (`#B99A68`) va iliq fil suyagi/qum rang (`#F3EFE7`). Oltin rang CTA, faol holat va ingichka chiziqlarda ishlatiladi. Haddan tashqari gradient va standart binafsha-ko‘k ranglardan foydalanilmaydi.
- **Joylashuv:** landing sahifada assimetrik surat-matn kompozitsiyasi, hero ustidagi ixcham bron bloki va keng bo‘shliqlar. Dashboard’da doimiy yon menyu, foydali jadvallar/xona xaritasi va bir-biridan farqli statistik ko‘rsatkichlar bo‘ladi; barcha ma’lumotlar bir xil kartalarga aylantirilmaydi.
- **O‘ziga xos elementlar:** oltin ingichka chiziqli me’moriy ravoq; qavatlardagi xonalar holatini ixcham rangli belgilar bilan ko‘rsatish; iliq ivory sirtlarda nozik ajratuvchi chiziqlar.
- **O‘zaro ta’sir va animatsiya:** 180–260 ms yumshoq o‘tishlar, hover’da yengil ko‘tarilish, sahifa almashganda qisqa fade, ko‘rsatkichlar uchun ixcham o‘sish animatsiyasi va yuklanishda skeleton. Tizimning reduced-motion tanlovi hurmat qilinadi; og‘ir parallax yoki ko‘zni charchatuvchi effektlar yo‘q.
- **Tipografiya:** sarlavhalar uchun Playfair Display, asosiy matn uchun Manrope. Katta serif sarlavhalar, qisqa bo‘lim belgilari va o‘qilishi oson mayda matn.
- **Brend mohiyati:** “Shahar ichidagi sokin dam va puxta boshqariladigan mehmondo‘stlik.” Fe’l-atvor: nafis, sokin, ishonchli.
- **Brend ohangi:** aniq, samimiy va ortiqcha reklamasiz. Namuna: “Shahar shovqinidan bir qadam narida.” / “Siz uchun tayyorlangan xonadan boshlanadi.”
- **Logotip:** oltin ravoq ichida “O” monogrammasi, yonida harflari keng ajratilgan ORIGIN HOTEL yozuvi.
- **Brendning o‘ziga xos rangi:** champagne gold `#B99A68`.

## Loyiha tuzilmasi
```text
originhotel/
├── public/
│   ├── favicon.svg
│   └── manus-routes.json
├── src/
│   ├── app/                 # Layout, route guard va role-based navigation
│   ├── components/          # Navbar, modal, toast, sahifa sarlavhasi, status va statistika qismlari
│   ├── context/             # Auth, hotel data, theme va toast providerlari
│   ├── data/                # Demo seed va boshlang‘ich ma’lumotlar
│   ├── hooks/               # Reduced-motion kabi qayta ishlatiladigan React hooklari
│   ├── i18n/locales/        # 6 til lug‘atlari va i18n sozlamasi
│   ├── pages/               # Landing, login va dashboard sahifalari; router bo‘yicha lazy-load
│   ├── services/            # localStorage repository, biznes qoidalari va XLSX/PDF eksporti
│   ├── types/               # Domen va ruxsat turlari
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css           # Tailwind v4 CSS-first tokenlari va global uslublar
│   └── vite-env.d.ts
├── ASSET_SOURCES.md
├── README.md
├── TODO.md
├── app.config.ts            # Manus loyiha logotipi
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── plan.md
```

## Ishga tushirish
```bash
npm install
npm run dev
```

## Qo‘shimcha: responsivlik va yuklanish tezligi yaxshilanishi
Visual ko‘rikda hero ichidagi bron qidiruv paneli `overflow-hidden` sababli pastdan kesilgani ko‘rindi; kesish faqat fon/surat qatlamiga qo‘llanib, panel to‘liq ko‘rinadigan qilib tuzatiladi. Unsplash rasmlari ekran kengligiga mos `srcset`/`sizes` bilan kichik variantlardan tanlanadi; hero rasmiga yuqori ustuvorlik, xona va galereya rasmlariga lazy-load beriladi. Google Fonts render-blocking bo‘lmagan tarzda chaqiriladi, fallback font paint’ni kechiktirmaydi. Xarita tashqi iframe o‘rniga yengil inline SVG sxema sifatida darhol ko‘rinsin; haqiqiy OpenStreetMap ko‘rinishi alohida havola orqali ochiladi. Yangi kutubxona qo‘shilmasin.

## Mobil boshqaruv paneli va grafik yuklanishi bo‘yicha qo‘shimcha qaror
Tor ekranlarda mobil header ikkilamchi boshqaruvlarni menyuga yig‘adi; yon menyu vertikal scroll qiladi; moliya filtrlari qatorlarga o‘raladi. Baland dialoglarda viewport chegarasi ichida ichki scroll ishlaydi. Dashboard daromad grafigi alohida lazy komponentga ajratilib, `IntersectionObserver` orqali viewport’ga yaqinlashgandagina import qilinadi; ungacha yengil skelet ko‘rinadi. Yangi kutubxona qo‘shilmaydi.
Qisqa mobil ekranlarda modallar dinamik ko‘rinadigan viewport balandligi (`dvh`) bilan chegaralanadi. Bildirishnomalar oynasi telefonda viewport o‘ng chetiga mahkamlanib, mavjud balandlikdan oshmay scroll qiladi; keng ekranda tugmaga nisbatan joylashadi.


## Bron oynasi va Preview hosti bo‘yicha qo‘shimcha qaror
Bron oynasi barcha viewportlarda markazlanadi; modal `dvh` balandligi bilan chegaralanib, ortiqcha tarkibni ichkarida scroll qiladi. Sarlavha/yopish tugmasi va bron amallari ko‘rinishda qoladi. Tanlangan xona mavjud Unsplash media xaritasidan mos surat, raqam, turi, sig‘imi, qulayliklari va tunlik narxi bilan ko‘rsatiladi; telefon tartibida rasm ixcham, katta ekranda media va forma ikki ustunda joylashadi. Xona kartasidan kelgan bo‘sh sanalar ertaga/undan keyingi kun qiymatlariga aylanadi; noto‘g‘ri oraliqda jami hisoblanmaydi va “NaN” hech qachon ko‘rsatilmaydi. Vite ishlab chiqish serveri faqat `.manus.computer` Preview domen qo‘shimchasini ruxsat etilgan hostlarga qo‘shadi; host tekshiruvini umumiy o‘chirib qo‘yilmaydi.
