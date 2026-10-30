# Admin, manager va ishchilar

## Rollar

- **Admin `/app`**: mehmonxona nazorati, joriy/kelgan mehmonlar va bekor qilingan bronlar statistikasi, bandlik, moliyaviy kuzatuv, faoliyat tarixi. `/app/employees`: ishchilar, ish haqi, to‘lov muddati, manager hisobini yaratish.
- **Manager**: avvalgi kundalik panel: xona qo‘shish/tahrirlash/o‘chirish, mehmonlar, bronlar va statuslar, moliya/hisobotlar, foydalanuvchi hisoblari, sayt matni/rasmi/logo va qolgan sozlamalar. Admin hisobini tahrirlay olmaydi yoki yangi admin yarata olmaydi. Ishchi shaxsiy ma’lumotlari va ish haqi API kolleksiyalari unga yuborilmaydi. Moliya yozuvlarida ish haqi chiqimlari ko‘rinadi.
- **Mehmon**: faqat o‘z hisobi va bronlari. Kirishdagi rol tanlash huquq bermaydi: server real rolni tekshiradi.

Admin superuser hisobining favqulodda backend/Django admin huquqlari saqlanadi; kundalik operatsiyalar uning React menyusidan olib tashlangan. Eski `Employee` guruhi cheklangan server ruxsatlarini saqlaydi; `Manager` guruhining ruxsatlari migrate tugaganda yangilanadi.

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
