# Origin Hotel — vazifalar ro‘yxati

## 1. Ommaviy sayt va navigatsiya
- [x] Saytning asosiy tili standart o‘zbek tili bo‘lsin; sahifa telefon, planshet va kompyuter ekranlarida moslashuvchan ishlasin.
- [x] React + Vite + Tailwind CSS asosida, React Router bilan yo‘naltiriladigan, lucide-react ikonlari va Recharts grafiklari ishlatiladigan kod tuzilsin. Kod `components`, `pages`, `context`, `hooks`, `services`, `data`, `i18n` kabi alohida papkalarga bo‘linsin.
- [x] Backend bo‘lmasa ham ma’lumotlar localStorage’da saqlansin; keyinchalik backendga ulash oson bo‘lishi uchun alohida `services/` qatlami bo‘lsin.
- [x] Barcha sahifalarda Origin Hotel logotipi bo‘lgan navbar ko‘rinsin. Mehmon chiqmaganida tizimga kirish tugmasi bo‘lsin; kirgandan so‘ng avatar, ism, rol va chiqish tugmasi ko‘rinsin.
- [x] Navbar’da tanlovi saqlanadigan dark/light mode, bayroqlar bilan til tanlash ro‘yxati va tizimga kirish tugmasi bo‘lsin. Til almashtirish sahifani qayta yuklamasdan ishlaydi; Arabic uchun RTL yoqiladi.
- [ ] Rus, ingliz, turk, arab va xitoy tillariga barcha dashboard, jadval, forma, toast/xato va bo‘sh holat matnlarini to‘liq tarjima qilish. Hozir asosiy menyu, landing/auth va sozlamalarning ayrim sarlavhalari tarjima qilingan; chuqur boshqaruv sahifalaridagi ko‘p matnlar o‘zbekcha qolgan.
- [x] Premium mehmonxona uslubida to‘q ko‘k/qora va oltin yoki iliq bej palitra, sarlavhalar uchun serif, matn uchun o‘qilishi oson sans-serif, aniq spacing, nozik soya, hover va sahifa o‘tish animatsiyalari ishlatilsin. Haddan tashqari gradient va odatiy binafsha-ko‘k palitradan qochilsin.
- [x] Mehmonxona fotosuratlari Unsplash havolalaridan olinsin.

## 2. Landing sahifasi
- [x] Hero bo‘limida katta rasm/slayder, shior va “Bron qilish” tugmasi bo‘lsin.
- [x] Mehmonxona haqida jami xona soni, qavatlar soni, 5 yulduz va qulaylik darajasi ko‘rsatilsin.
- [x] Standart, Deluxe, Suite, Oilaviy va Prezident xona turlarining har biri uchun narx, sig‘im, maydon, qulayliklar va rasm ko‘rsatilsin.
- [x] Qulayliklarda Wi-Fi, basseyn, spa, restoran, parking, fitness, transfer va 24/7 xizmat ko‘rsatilsin.
- [x] Xonalar soni, mamnun mehmonlar soni va reyting uchun animatsiyali statistik hisoblagich bo‘lsin.
- [x] Mehmonlar sharhlari, galereya, joylashuv xaritasi, aloqa ma’lumotlari va footer bo‘lsin.

## 3. Kirish, ro‘yxatdan o‘tish va rolli ruxsatlar
- [x] Kirish sahifasi split-screen ko‘rinishda bo‘lsin: chap tomonda mehmonxona rasmi, qisqa ma’lumot, qulayliklar va sharhlar; o‘ng tomonda kirish/ro‘yxatdan o‘tish formasi.
- [x] “Google bilan kirish” tugmasi, Ism, Familiya, Email, Parol maydonlari, Kirish/Ro‘yxatdan o‘tish tablari, validatsiya va xato xabarlari bo‘lsin. Google oqimi haqiqiy Google Identity Services orqali ishlaydi va `VITE_GOOGLE_CLIENT_ID` bilan sozlanadi.
- [x] Oddiy email yoki Google kirishi Foydalanuvchi (`user`) rolini bersin; admin/manager rollari faqat maxsus kod bilan beriladi.
- [x] Email `@admin.com` bilan tugasa, “Maxsus kod” maydoni avtomatik ko‘rinsin; faqat `admin1234` kodi admin roliga kiritadi. Noto‘g‘ri kodda kirish rad etilib xato ko‘rsatilsin.
- [x] Email `@manager.com` bilan tugasa, “Maxsus kod” maydoni avtomatik ko‘rinsin; faqat `manager1234` kodi manager roliga kiritadi. Noto‘g‘ri kodda kirish rad etilib xato ko‘rsatilsin.
- [x] Ruxsat berilmagan sahifalarga rol asosidagi route guard orqali kirib bo‘lmasin.
- [x] Foydalanuvchi profil va sozlamalarini ko‘ra olsin; sessiyadan chiqish ishlasin.
- [x] Foydalanuvchi bo‘sh xonalarni sana, narx, xona turi va sig‘im bo‘yicha ko‘ra/filtrlay olsin; xona uchun bron/ruxsat so‘rovi yuborsin; admin tasdiqlamaguncha bron “Kutilmoqda” bo‘lib qolsin.
- [x] Foydalanuvchi bron holatlarini “Kutilmoqda / Tasdiqlangan / Rad etilgan / Bekor qilingan” tarzida ko‘rsin, o‘zi yuborgan so‘rovlarni ko‘rsin va bekor qila olsin.

## 4. Rollar va boshqaruv ruxsatlari
- [x] Foydalanuvchi bo‘sh xonalarni qidirish, bron so‘rovi yuborish/bekor qilish, bron holatini ko‘rish, profil va sozlamalarni boshqarish imkoniga ega bo‘lsin.
- [x] Manager’da Dashboard, Xonalar, Mehmonlar, Bronlar, Moliya, Hisobotlar va Sozlamalar bo‘lsin; manager bronlarni ko‘rsin va yangi bron yarata olsin, moliya/hisobot va daromad statistikasini to‘liq boshqarsin, ammo kelgan bronlarni tasdiqlay olmasin.
- [x] Admin manager imkoniyatlarining barchasiga ega bo‘lsin; kelgan bronlarni tasdiqlashi/rad etishi; xonalarni qo‘shishi, tahrirlashi, o‘chirishi, narx va holatini o‘zgartirishi; mehmonlarni qo‘shishi, o‘chirishi, tahrirlashi; foydalanuvchi va managerlarni boshqarishi mumkin bo‘lsin.
- [x] Admin uchun har bir xonaning kimga berilgani, muddati va o‘zgarishlar tarixini audit log’da ko‘rish mumkin bo‘lsin.
- [x] Xona bo‘lmasa avtomatik “Bizda bo‘sh o‘rinlar qolmagan” xabari ko‘rsatilsin.

## 5. Dashboard, xonalar va mehmonlar
- [x] Kirgandan keyingi dashboard’da rolga qarab Dashboard, Xonalar, Mehmonlar, Bronlar, Moliya, Hisobotlar, Sozlamalar yon menyusi ko‘rinsin.
- [x] Tezkor amallar: “Xona bron qilish”, “Yangi mehmon qo‘shish”, “Kirim/Chiqim qo‘shish”.
- [x] Dashboard statistikasi: jami xonalar, band xonalar, bo‘sh xonalar, mehmonlar soni, bugungi check-in/check-out va bandlik foizi.
- [x] Admin/manager uchun kunlik, oylik, yillik daromad grafiklari; oxirgi bronlar jadvali; admin uchun kelgan so‘rovlar; qavatlar bo‘yicha xona holati xaritasi bo‘lsin.
- [x] Xonalar sahifasida qavatlar bo‘yicha joylashuv, har xonadagi mehmonlar soni/sig‘imi, qavat, bo‘sh/band/tozalanmoqda/ta’mirda holati, xonaga bevosita mehmon qo‘shish, qidiruv va filtr bo‘lsin.
- [x] Mehmonlar sahifasida mehmonlar soni statistikasi, qidiruv, mehmon tarixi va VIP belgisi bo‘lsin; admin mehmon qo‘shishi/o‘chirishi/tahrirlashi mumkin bo‘lsin.

## 6. Bronlar va moliya
- [x] Bronlar sahifasida yashayotganlar, tasdiqlangan, kutilmoqda, tugatilgan, bekor qilingan bronlar uchun statistik kartalar, yangi bron formasi va holat filtri bo‘lsin.
- [x] Admin uchun bronni “Tasdiqlash / Rad etish” amallari bo‘lsin; manager tasdiqlay olmasin.
- [x] Bron muddatlari va xona bandligi tekshirilsin; qarama-qarshi davrga bo‘sh bo‘lmagan xonani band qilishning oldi olinsin.
- [x] Moliya sahifasida kirim/chiqim qo‘shish va o‘chirish, kategoriyalar, kunlik/oylik/yillik ko‘rinish, oylik jami kirim, chiqim va sof foyda ko‘rsatilsin; grafiklar bo‘lsin.

## 7. Hisobot, sozlamalar va eksport
- [x] Hisobotlar sahifasida sana oralig‘i tanlagich bo‘lsin; tanlangan davr uchun bandlik (occupancy), daromad, mehmonlar va bronlar hisoboti chiqarilsin.
- [x] Xona turlari bo‘yicha taqqoslash grafigi va eng ko‘p daromad keltirgan xonalar ro‘yxati ko‘rsatilsin.
- [x] Hisobotni PDF va Excel formatiga eksport qilish hamda chop etish mumkin bo‘lsin.
- [x] Sozlamalarda 4 bo‘lim bo‘lsin: Profil (ism, rasm, telefon); Hisob (parol o‘zgartirish, ikki bosqichli himoya, faol sessiyalar); Ko‘rinish (dark/light, asosiy rang, shrift o‘lchami, til); Bildirishnomalar (yangi bron, tasdiqlash, email/push sozlamalarini yoqish/o‘chirish).
- [x] Qo‘shimcha sozlamalar: UZS/USD/EUR valyuta tanlash, vaqt zonasi va ma’lumotlarni backup qilish.

## 8. Umumiy interaktivlik, demo ma’lumot va ishga tushirish
- [x] Qo‘ng‘iroqcha belgili bildirishnomalar, Ctrl+K global qidiruv, toast xabarlar, tasdiqlash modallari, empty-state dizaynlari, skeleton loading va Framer Motion sahifa animatsiyalari bo‘lsin.
- [x] Birinchi ishga tushishda kamida 40 xona, 5 qavat, 30 mehmon, 50 bron va moliya yozuvlari yaratiladi.
- [x] Tanlangan til va tema, tizim holati va CRUD ma’lumotlari kerakli joylarda localStorage’da saqlansin.
- [x] Loyiha papkalari tuzilmasi va fayllar alohida saqlansin; to‘liq kod bo‘lsin, qisqartirish yoki `... davomi` ishlatilmasin.
- [x] Ishga tushirish yo‘riqnomasi `npm install` va `npm run dev` buyruqlarini ko‘rsatsin; demo admin, manager va user kirish ma’lumotlari berilsin.

## 9.1 Professional ko‘rinish, xatoliklarni tuzatish va media

- [x] Yetishmayotgan CSS sinflari (`skeleton`, `shadow-soft`, `animate-rise-in`, `arch-mark`) qo‘shildi; `bg-ink/50`, `from-ink/95`, `hover:text-champagne`, `focus:border-champagne` kabi variantlar `@theme inline` orqali haqiqiy Tailwind utilitlariga aylandi. Shu tufayli hero pardasi, modal foni, dropdown soyasi va hover holatlari endi chindan ham ko‘rinadi.
- [x] Dark mavzuda `bg-ink text-white` tugmalari oq matn bilan oqish fon ustida qolib, o‘qilmas edi — `--ink` endi har ikki mavzuda to‘q brand yuzasi bo‘lib qoladi.
- [x] Landing sahifasi to‘liq qayta qurildi: hero va bron qidiruvi, animatsiyalangan statistika, 5 ta xona turi (foto, narx, sig‘im), qulayliklar, lightbox bilan galereya, mehmon sharhlari, joylashuv (inline xarita sxemasi), CTA chizig‘i va ko‘p ustunli footer.
- [x] Navigatsiyadagi `#reviews` va `#contact` havolalari mavjud bo‘lmagan bo‘limlarga olib borardi; bo‘limlar qo‘shildi va `scroll-padding-top` bilan sarlavha ostida qolmasligi ta’minlandi.
- [x] Media va SEO: rasmlar uchun `srcset`/`sizes`, `width`/`height`, `loading`/`decoding`, OG va Twitter meta teglari hamda JSON-LD (Hotel) sxemasi.
- [x] Yangi marketing matnlari olti tilga (uz, ru, en, tr, ar, zh) qo‘shildi — nav, hero, statistika, xona kartalari, galereya, sharhlar, joylashuv, CTA va footer.

## 9. Responsive ko‘rinish va yuklanish tezligi bo‘yicha tuzatishlar
- [x] Hero ostidagi bron qidiruvi 390 px, 768 px va desktop kengliklarda to‘liq ko‘rinsin; ota blok uni kesib qo‘ymasin va bo‘limlar bilan ustma-ust tushmasin.
- [x] Sahifalarda telefon/planshet/desktop kengliklarida muhim boshqaruvlar, navigatsiya, kartalar, jadvallar va modallar kesilmasin; telefonda keraksiz gorizontal scroll bo‘lmasin.
- [x] Katta rasm fayllarini kerakli ekran kengligiga mos `srcset`/`sizes` orqali yuklash; birinchi hero rasmiga yuqori ustuvorlik berish, pastdagi xona/galereya rasmlarini kechiktirib yuklash.
- [x] Tashqi shriftlar sahifaning birinchi ko‘rinishini to‘smasin; tizim fallback shriftlari va swap ishlasin.
- [x] Xarita qismi tashqi tarmoq sekin bo‘lsa ham bo‘sh qolmasin; yengil SVG sxema darhol ko‘rinsin, to‘liq OpenStreetMap xaritasi alohida havola orqali ochilsin; sahifa ostidagi rasmlar lazy-load qilinsin va joy oldindan band qilinsin.
- [x] Yangilangan manba arxivi to‘liq source, lockfile, konfiguratsiya va yo‘riqnomalarni o‘z ichiga oladi; `node_modules` va `dist` arxivga qo‘shilmaydi.

- [x] 320 px kabi tor ekranda boshqaruv headeri ikkinchi darajali boshqaruvlarni menyuga yig‘sin; hech bir tugma yoki profil boshqaruvi kesilmasin.
- [x] Mobil yon menyu balandligi kichik telefonda ham vertikal aylantirilsin; pastdagi navigatsiya havolalari va hisob amallari ochiq bo‘lsin.
- [x] Moliya sahifasidagi qidiruv va filtrlar kichik ekranda qatorlarga o‘ralsin; qidiruv maydoni va select’lar kartadan tashqariga chiqmasin.
- [x] Baland modal dialoglar telefon viewport’iga sig‘sin; zarur bo‘lsa modal sarlavhasi/harakatlari saqlangan holda ichki kontenti aylantirilsin.
- [x] Dashboard daromad grafigining Recharts kodi birinchi dashboard ko‘rinishida yuklanmasin; grafik viewport’ga yaqinlashganda lazy import orqali yuklansin va orada skelet ko‘rsatilsin.
- [x] Qisqa ekranlarda modal o‘lchami dinamik ko‘rinadigan viewport (`dvh`) bo‘yicha chegaralansin; bildirishnoma popover’i mobil ekranda chetidan tashqariga chiqmasin va sig‘masa ichida scroll qilsin.

## 10. Xona bron qilish oynasi va Preview hosti
- [x] Xona kartasidagi “Bron so‘rash” bosilganda oldindan tanlangan xona bron oynasida tanlangan holda ko‘rinsin; xonani keyin o‘zgartirish mumkin bo‘lsin.
- [x] Oyna telefon va desktop ko‘rinadigan viewport’ining markazida joylashsin; uzun tarkib ichki scroll qilinsin, sarlavha/yopish tugmasi hamda yuborish/bekor qilish amallari topilishi oson bo‘lsin.
- [x] Tanlangan xona uchun xona rasmi, raqami/turi, sig‘imi, qulayliklari, tunlik narxi va hisoblangan jami narx ko‘rsatilsin; rasm telefon ekranida ixcham, desktopda ikki ustunli tartibda bo‘lsin.
- [x] Sana, kattalar/bolalar soni va bo‘sh xona tanlovi foto/narx xulosasi bilan birga yangilansin; rasm yuklanmasa fallback dizayni ko‘rinsin.
- [x] Cloud Preview’ning ruxsat etilgan `.manus.computer` hostida sayt bloklangan host xabari emas, Origin Hotel ilovasini ochsin; Vite host tekshiruvi o‘chirib qo‘yilmasin.

## 11. Bron sanalari va narx xulosasining to‘g‘riligi
- [x] Xona kartasidan bron bosilganda sana qiymatlari bo‘sh qolmasin: kelish sanasi ertaga, ketish sanasi undan keyingi kun bo‘lsin; foydalanuvchi kelish sanasini o‘zgartirsa, ketish sanasi undan oldin qolmasin.
- [x] Noto‘g‘ri yoki to‘liq bo‘lmagan sanalarda “NaN” jami yoki tunlar soni ko‘rsatilmasin; narx faqat yaroqli tunlar sonida hisoblansin va yaroqsiz sana bilan bron yuborilmasin.
