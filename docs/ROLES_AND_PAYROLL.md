# Admin, manager va ishchilar

## Rollar

- **Admin `/app`**: mehmonxona nazorati, joriy/kelgan mehmonlar va bekor qilingan bronlar statistikasi, bandlik, moliyaviy kuzatuv, faoliyat tarixi. `/app/employees`: ishchilar, ish haqi, to‘lov muddati, manager hisobini yaratish.
- **Manager**: avvalgi kundalik panel: xona qo‘shish/tahrirlash/o‘chirish, mehmonlar, bronlar va statuslar, moliya/hisobotlar, foydalanuvchi hisoblari, sayt matni/rasmi/logo va qolgan sozlamalar. Admin hisobini tahrirlay olmaydi yoki yangi admin yarata olmaydi. Ishchi shaxsiy ma’lumotlari va ish haqi API kolleksiyalari unga yuborilmaydi. Moliya yozuvlarida ish haqi chiqimlari ko‘rinadi.
- **Mehmon**: faqat o‘z hisobi va bronlari. Kirishdagi rol tanlash huquq bermaydi: server real rolni tekshiradi.

Admin superuser hisobining favqulodda backend/Django admin huquqlari saqlanadi; kundalik xona/mehmon amallari managerda, admin React menyusida esa barcha bo‘limlar kuzatuvi ham ochiq. Eski `Employee` guruhi cheklangan server ruxsatlarini saqlaydi; `Manager` guruhining ruxsatlari migrate tugaganda yangilanadi.

## Jonli saytga chiqarish

1. Render’da **Deploy latest commit**. `render-start.sh` yangi `0003_staffmember_salarypayment` migratsiyasini avtomatik qo‘llaydi. Eski bazani o‘chirmaydi.
2. Health javobida `features` ichida `manager-operations`, `staff-payroll`, `google-profile` chiqadi. Vercel shu yangi backend tayyorligini tekshiradi; eski API bilan yangi frontend nashr qilinmaydi. Agar Vercel Render’dan avval qurilib xato bersa, Render Live bo‘lgach Vercel’da yangi commitni Redeploy qiling.
3. Mavjud admin email/parol bilan kiring → **Ishchilar va oyliklar → Manager qo‘shish**. Haqiqiy manager emaili va kamida 12 belgili yangi parol kiriting. Demo parollar jonli bazaga avtomatik yozilmaydi.
4. Manager **Kirish → Manager** orqali o‘z email/paroli bilan kiradi. Google login staff huquqini avtomatik bermaydi.

### Render environment orqali ixtiyoriy birinchi manager

- `HOTEL_BOOTSTRAP_MANAGER_EMAIL`: haqiqiy manager emaili (default `manager@manager.com`).
- `HOTEL_BOOTSTRAP_MANAGER_PASSWORD`: kamida 12 belgili maxfiy parol, faqat Render Environment’da.

Start script mavjud faol Manager bo‘lsa hech narsani almashtirmaydi. Mavjud oddiy hisobni avtomatik yuqori rolga ko‘tarmaydi. Birinchi yaratilishdan keyin bootstrap paroli environment’dan olib tashlanishi mumkin. Maxfiy parol/DB URL’ni GitHub yoki chatga joylamang.

## Ish haqi

- Ism/familiya, vazifa, telefon, ixtiyoriy email, boshlanish sanasi, oylik, to‘lov kuni (1–31), izoh, faol/arxiv holati saqlanadi.
- Qisqa oyda payday oxirgi kunga tushadi. Boshlanish sanasidan oldingi davr hisoblanmaydi; boshlanish sanasi payday’dan keyin bo‘lsa birinchi eslatma keyingi oyda. Hozircha to‘liq oylik ishlatiladi, kunbay/pro-rata hisoblash yo‘q.
- Muddati kelgan va o‘tgan barcha to‘lanmagan oylar alohida ko‘rsatiladi. Panel/notification eslatmalari sayt ochilganda va sessiya yangilanganda hisoblanadi. Background email, push yoki SMS yetkazib berish ulangan emas.
- **To‘lovni qayd etish → Ha, to‘landi** — bajarilgan to‘lovni hisobga olish; bu tugma bankdan pul jo‘natmaydi.
- Server summani employee.monthly_salary’dan oladi, mijoz yuborgan summaga ishonmaydi. Bir oy/ishchi uchun unique constraint + atomik tranzaksiya takror to‘lovdan himoya qiladi. To‘lov va `payroll` moliya chiqimi birga saqlanadi.
- To‘lov tarixi o‘zgarmaydi/o‘chirilmaydi. Ish haqi moliya yozuvi ham API va model validation orqali himoyalangan.
- To‘lov tarixi bor ishchi o‘chirishda arxivlanadi. Tarixi yo‘q ishchini o‘chirish mumkin. Barchasini belgilash va tasdiqlash sahifaning o‘zida, modal yo‘q.
- Bir nechta xodim uchun turli valyutada hisoblash yo‘q; summa saytning umumiy valyutasida ko‘rsatiladi. Oldingi to‘lanmagan davrlarga joriy oylik stavkasi qo‘llanadi, to‘langan davrlarning summasi esa saqlanadi.

## Google’dan keyingi profil

Firebase ID tokeni backend’da imzo, issuer, audience, email_verified bo‘yicha tekshiriladi. Birinchi Google kirishdan so‘ng `/complete-profile` ism, familiya, telefon va ma’lumotlarning to‘g‘riligini tasdiqlashni talab qiladi. Reload bilan chetlab o‘tilmaydi, tasdiqlanmaguncha PATCH amallari serverda ham bloklanadi. Asosiy ruxsatni oddiy profil PATCH orqali olib tashlab bo‘lmaydi.

**Telefon egasi SMS orqali tasdiqlanmagan.** Hozir faqat 9–15 raqamli telefon formati va foydalanuvchining tasdig‘i tekshiriladi. Haqiqiy OTP uchun provider, maxfiy kalitlar, jo‘natish xarajati va rate limitlar alohida sozlanishi kerak. Google’ning haqiqiy tashqi popup oqimi Firebase Authorized Domains/Google provider sozlamalariga bog‘liq.

## Nazorat statistikasi chegarasi

Alohida check-in/out tugmalari foydalanuvchi so‘roviga ko‘ra olib tashlangan. Shu sabab adminning “kelgan” va “hozirgi” sonlari tasdiqlangan/yakunlangan bronlar va sana oralig‘iga asoslangan; haqiqiy jismoniy kelishni mustaqil tasdiqlamaydi. Takroriy safarlar alohida tashrif hisoblanadi.


## Admin nazorati va moliya/hisobotlar ruxsati

- Admin navigatsiyasida barcha xonalar, mehmonlar, bronlar, hisoblar/tashriflar, moliya, hisobotlar va ishchilar nazorati ochiq. Xona/mehmonlar ro‘yxatida managerning tahrirlash/o‘chirish tugmalari admin kuzatuviga qo‘shilmaydi.
- Admin nazorat markazida bo‘limlar sonlari, xonalar holati bo‘yicha filtrlar, sayt kontaktlari/bo‘limlarining holati, galereya va faoliyat qaydlari bor. Faoliyat/tashrif sonlari API’dagi so‘nggi qaydlar doirasida ko‘rsatiladi.
- Manager moliya yozuvini qo‘shishi va tahrirlashi mumkin, lekin **o‘chira olmaydi**. `delete_financeentry` Manager guruhidan migrate paytida olinadi. API, Django HTML bulk handler va Django admin ham faqat superuserga o‘chirishga ruxsat beradi; hatto eski direct permission qolgan bo‘lsa ham manager API orqali o‘chira olmaydi.
- Adminning moliya sahifasida barcha vaqtni ko‘rish, bitta va belgilangan yozuvlarni inline tasdiqlab o‘chirish bor. Payroll bilan bog‘langan moliya yozuvlarining himoyalangan tarixi avvalgidek o‘chirilmaydi/tahrirlanmaydi; tugmalar ham ko‘rsatilmaydi.
- Hisobotlar sahifasidagi **Hisobotni saqlash** joriy davr natijasini `ReportSnapshot` jadvaliga saqlaydi. Server sana va summalarni tekshiradi; mijoz yuborgan jami summaga ishonmaydi. Manager va admin yangi hisobot qo‘sha oladi, faqat admin o‘chiradi. Nusxalar qayta yozilmaydi, yangi nusxa yaratish kerak.
- Saqlangan hisobotni o‘chirish manba moliya yoki bronlarni o‘chirmaydi. Manba yozuvlari keyin o‘zgarsa ham avval saqlangan natija o‘zgarmaydi. Hisobot kartasidan nusxani JSON sifatida yuklab olish mumkin; joriy davrning PDF/Excel eksporti ham saqlangan.
- Yangi migratsiya: `0004_reportsnapshot`. Readiness `features` ichida `owner-finance-control` paydo bo‘ladi. **Avval Render deploy**, undan keyin Vercel. Vercel yangi imkoniyat tayyor bo‘lmaguncha yangi frontendni nashr qilmaydi.

### Bron va mehmonlar bo‘yicha yakuniy taqsimot

Adminning desktop/mobil menyusi, tezkor qidiruvi va nazorat havolalaridan **Bronlar** hamda **Mehmonlar** olib tashlangan; ushbu `/app` sahifalariga bevosita kirish adminni umumiy nazoratga qaytaradi. Adminning umumiy statistika, xona kuzatuvi, moliya/hisobotlar va ishchilar huquqlari qolgan.

Yangi bron va bron holati o‘zgarishi (jumladan, foydalanuvchi bekor qilishi) managerning tizim ichidagi bildirishnomalariga tushadi. Foydalanuvchiga o‘z bronining natijasi alohida yuboriladi. Admin bron bildirishnomasini olmaydi va uni manager o‘rniga o‘qilgan deb belgilay olmaydi. Oylik va moliyaviy nazorat bildirishnomalari admin uchun saqlangan. Bu yo‘naltirish email/SMS jo‘natish emas, sayt ichidagi inbox uchun.

## Managerlar nazorati va umumiy bron holati

Adminning **Managerlar** (`/app/managers`) sahifasida hisoblar, oxirgi kirish va amal, barcha server qaydlari bo‘yicha amallar/tasdiqlashlar soni, so‘nggi 1000 qayddan saralangan faoliyat bor. Ishchilar sahifasidagi manager yaratish ham shu komponentdan foydalanadi. Managerlar bir-birining hisobini qo‘sha/bloklay/o‘chira olmaydi; buni admin bajaradi.

**Limit — jami 3 ta Manager guruhi hisobi**, bloklangan hisoblar ham sanaladi. Faqat o‘chirish slotni bo‘shatadi. Eski cheklangan Employee guruhi manager hisoblari soniga qo‘shilmaydi. Agar eski bazada allaqachon 3 tadan ko‘p bo‘lsa, yangi hisoblar bloklanadi; mavjud hisoblar avtomatik o‘chirilmaydi. API global state lock + transaction ichida tekshiradi; User.groups m2m signal ham oddiy/reverse guruh qo‘shishlarida limitni tekshiradi. Render bootstrap mavjud bloklangan managerlarni qayta yaratmaydi/faollashtirmaydi.

Yangi bron haqidagi xabar va tasdiqlash/holat natijasi barcha faol managerlarga **alohida bildirishnoma** sifatida yoziladi. Biri o‘qishi boshqasining read holatini o‘zgartirmaydi. Tasdiqlash xabari va bron qatorida amalni bajargan managerning ismi, vaqt ko‘rsatiladi. Foydalanuvchi o‘z natijasini ko‘rishda davom etadi; adminning bron inboxi ochilmaydi.

Ochiq/ko‘rinib turgan sahifa har **3 soniyada** yengil `/hotel-api/revision/` endpointini tekshiradi, revision o‘zgargandagina to‘liq ma’lumot oladi. Focus/visibility qaytganda ham yangilanadi; sessiya har 30 soniyada tekshiriladi. Bu polling, WebSocket emas: tarmoq yoki Render cold-start vaqtida kechikish bo‘lishi mumkin. Saqlanayotgan o‘zgarishlar yoki eskirgan javoblar yangi holatni bosib ketmasligi uchun generation/revision tekshiruvlari saqlangan.

Bir vaqtning o‘zida kelgan manager amallari transaction/global revision orqali tartiblanadi. Bron holatiga qo‘shimcha `expectedStatus` tekshiruvi qo‘yilgan. Eski pending holatini qayta tasdiqlash 409/400 bilan rad etiladi, ikkinchi tasdiqlash yoki ikki marta tasdiqlash auditi yaratilmaydi.

Faoliyat `AuditEntry.details` ichida canonical actor ismi/emaili/roli, yozuv va bron oldingi/yangi holati bilan yoziladi. Manager o‘chirilganda FK null bo‘lsa ham saqlangan actor ma’lumotlari qoladi. Eski mavjud actorli qaydlar `0005_auditentry_details` migratsiyasida to‘ldiriladi; oldin o‘chirilgan hisoblardagi yo‘qolgan ismni qayta tiklab bo‘lmaydi. Readiness yangi `manager-team-sync` xususiyatini tekshiradi: avval Render migratsiyasi/deployi, keyin Vercel.


## Sayt muharriri ruxsati

Admin doim sayt sozlamalari, matnlar, rasmlar, aloqa va dizaynni tahrirlay oladi.
Admin Managerlar nazorati kartasida faqat bitta managerga sayt tahrirlash huquqini beradi.
Boshqa manager tanlansa, oldingisidan huquq atomik ravishda olinadi; huquqni butunlay olish ham mumkin.
Yangi manager avtomatik ruxsat olmaydi. Boshqa managerlar kundalik bron, xona va moliya ishlarini davom ettiradi.
Ruxsat server bazasidagi SiteState ichida saqlanadi; manager o‘ziga ruxsat bera olmaydi.
Managerlar nazorati alohida /app/managers sahifasida joylashgan. Ishchilar sahifasi faqat ishchilar va oyliklar uchun.
Deploy: avval Render latest commit (health features: site-editor-access), keyin Vercel redeploy.


## Google Maps ko‘rinishi

Mehmonxona va aloqa sozlamalaridagi joylashuv havolasi saytda Google Maps iframe ichida ko‘rsatiladi.
Google Maps qisqa havolalari saqlash paytida faqat ruxsat etilgan Google domenlari orqali ochiladi; boshqa xostga yo‘naltirish rad etiladi.
To‘liq joylashuv, koordinata, qidiruv yoki Google Maps embed havolalari ishlatiladi. Google bo‘lmagan xarita havolalari uchun manzil bo‘yicha Google ko‘rinishi beriladi, asl havola saqlanadi.
Mavjud qisqa havola uchun sozlamalarni bir marta qayta saqlang. Avval Render (map-preview feature), keyin Vercel deploy qiling. API kaliti kerak emas; iframe Google serveridan yuklanadi.


## Manager qurilmalari va sessiyalarini tugatish

Admin → Managerlar → kerakli managerdagi Qurilmalar tugmasi sessiyalar soni va ro‘yxatini ochadi.
Har bir brauzer sessiyasi alohida; bir brauzerning tablari alohida qurilma hisoblanmaydi. Fizik qurilmaning aniq identifikatsiyasi berilmaydi.
Qurilma/brauzer turi User-Agent’dan olinadi, faollik 30 soniyadan tez yozilmaydi. Admin ro‘yxati 10 soniyada va oyna faollashganda yangilanadi.
Eski, hali muddati tugamagan sessiyalar ham import qilinadi. Eski sessiyada qurilma turi keyingi so‘rovgacha noma’lum bo‘lishi mumkin.
Faqat admin bitta sessiyani yoki tanlangan managerning barcha sessiyalarini inline tasdiq bilan tugata oladi. Sessiya kalitlari brauzerga yuborilmaydi. Boshqa managerlarning sessiyalari saqlanadi.
Chiqarilgan sessiya keyingi server so‘rovida ruxsatsiz bo‘ladi; ochiq va internetga ulangan panel odatda navbatdagi 3 soniyalik tekshiruvda kirish sahifasiga qaytadi. Offline qurilma qayta ulanganda chiqadi.
Tizimdan chiqarish parolni almashtirmaydi va hisobni bloklamaydi: parol bilan qayta kirish mumkin. Qayta kirishni to‘xtatish uchun manager hisobini bloklang.
Server bazasiga 0006_managerdevicesession migratsiyasi qo‘shildi. Avval Render latest commit deploy (health features: manager-device-sessions), keyin Vercel redeploy.


## O‘chirishni tasdiqlash

Yangi talabga muvofiq yakka va guruhlab o‘chirish amali tasdiqlash modalidan keyin bajariladi. Barchasini belgilash va yozuvlarni tanlash sahifaning o‘zida qoladi.
Bekor qilish, Esc va modalni yopish yozuvlarni o‘chirmaydi. Xonalar, mehmonlar, bronlar, moliya, foydalanuvchilar, managerlar, ishchilar, saqlangan hisobotlar va rasm olib tashlash amallari tasdiqlanadi.
Serverdagi ruxsatlar va himoyalangan yozuvlarni o‘chirish cheklovlari saqlanadi.
