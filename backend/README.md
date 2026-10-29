# Django + SQLite hotel demo

PDFdagi Python/Django/SQLite/HTML/Bootstrap talablari bajarilgan. **Asosiy React sayt ham shu backendga ulangan:** Django serverida `/` va `/app/...` avvalgi React dizayni bilan ochiladi; login, xonalar, mehmonlar, bronlar, moliya va sayt muharriri SQLite bazasiga yozadi. `/management/` qo‘shimcha server interfeysi, `/django-admin/` esa boshqaruvdir. Uchala interfeys bir xil relational bazani ishlatadi.

React interfeysida server rejimi Django tomonidan avtomatik yoqiladi. LocalStorage’dagi demo nusxa server bazasiga avtomatik import qilinmaydi; parollar ham brauzerga yuborilmaydi. Firebase snapshot adapteri server rejimida o‘chadi. **Vercel static hosting o‘z-o‘zidan Python serverni yoqmaydi** — bitta Django hostingdan saytni to‘liq berish yoki Vercel uchun haqiqiy backend domeniga proxy sozlash kerak.

## Bitta saytni ishga tushirish

Frontendni `npm.cmd ci --include=dev` va `npm.cmd run build` bilan yig‘ing. Pastdagi Django setup/migrate/createsuperuser’dan so‘ng `http://127.0.0.1:8000/` oching — shu yerdagi asosiy saytning barcha CRUD amallari serverga yoziladi. Birinchi superuserni o‘zingiz yaratib olasiz; avvalgi React demo paroli server hisobiga avtomatik aylanmaydi.

Windows’da setup/build/migrate/serverni ketma-ket bajaradigan yordamchi: `scripts\start-hotel-server.cmd`. U xato chiqsa keyingi bosqichga o‘tmaydi. Birinchi hisob uchun boshqa terminalda `backend\.venv\Scripts\python.exe backend\manage.py createsuperuser` bajaring. Script Windows muhitida bevosita sinovdan o‘tmagan; uning alohida setup/build/migrate bosqichlari Linuxda tekshirilgan.

Ishlab chiqishda ikki server kerak bo‘lsa, Django’ni 8000 portda, Vite’ni `VITE_HOTEL_SERVER=django` bilan ishga tushiring. Vite `/hotel-api` so‘rovlarini shu lokal serverga proxy qiladi. Oddiy `npm run dev` bu belgisiz eski lokal demo rejimi; asosiy integratsiyalangan saytni ko‘rishning eng oson yo‘li Django manzilidir.

## Windows PowerShell

Loyiha ildizidan Python 3.12+ bilan:

```powershell
py -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe backend\manage.py migrate
backend\.venv\Scripts\python.exe backend\manage.py createsuperuser --username admin@admin.com --email admin@admin.com
backend\.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

`http://127.0.0.1:8000/` ni oching. React yig‘masi oldindan `npm run build` bilan tayyor bo‘lsin. `createsuperuser`dagi hisob bilan kiring. Parol hash ko‘rinishida saqlanadi, browserga berilmaydi. `/django-admin/` orqali foydalanuvchi va guruh ruxsatlari boshqariladi.

Ixtiyoriy sun’iy demo ma’lumotlari uchun terminalda **yangi, haqiqiy hisoblarda ishlatilmaydigan** kamida 12 belgili parolni `HOTEL_DEMO_PASSWORD` environment variable’iga lokal o‘rnating, so‘ng:

```powershell
backend\.venv\Scripts\python.exe backend\manage.py seed_demo
```

Buyruq admin@admin.com, manager@manager.com, employee@origin.test, 12 xona, 32 test mehmon va demo kirim/chiqim yaratadi. Mavjud hisob parolini yoki yozuvni almashtirmaydi. Parolni GitHub yoki chatga yubormang. `createsuperuser` boshqa username bilan ishlatilgan bo‘lsa ham, demo admin yangi alohida hisob bo‘ladi.

## Linux/macOS

```bash
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
backend/.venv/bin/python backend/manage.py migrate
backend/.venv/bin/python backend/manage.py createsuperuser --username admin@admin.com --email admin@admin.com
backend/.venv/bin/python backend/manage.py runserver 127.0.0.1:8000
```

## Ruxsatlar

- Superuser: xonalar, mehmonlar, bronlar, moliya, hisob/guruhlar va o‘chirish.
- `Employee`: xona/mezbonlarni ko‘rish, mehmon/bron qo‘shish va tahrirlash, check-in/out. Moliya, rollar, xona narxini almashtirish va o‘chirish taqiqlangan.
- `Manager`: yuqoridagilar va moliya/hisobot. Xonani yoki faol bronni o‘chirish, foydalanuvchi huquqini oshirish taqiqlangan.
- Ruxsatlar backendda tekshiriladi. URLga to‘g‘ridan-to‘g‘ri POST ham ruxsatsiz amalni bajarmaydi.

`seed_demo` guruhlarni yaratadi. Mavjud foydalanuvchini Django admin → Groups orqali guruhga qo‘shing. Bo‘sh/ruxsatsiz hisob dashboardga kira olmaydi.

## Muhim qoidalar

SQLite diskdagi `backend/db.sqlite3`da saqlaydi. Oynani yoki brauzerni yopish ma’lumotni o‘chirmaydi. Bu faylni o‘chirish yoki server diskini almashtirish bazani yo‘qotadi; zaxira nusxasini oling. Ma’lumot/parollar Gitga kiritilmaydi.

- Bron sanalari `[kelish, ketish)`; ketish kuni yangi mehmon kelishi mumkin.
- `pending` va `confirmed` bronlar to‘qnashishi bloklanadi. Yozishlar `IMMEDIATE` SQLite tranzaksiyasi ichida bajariladi: bir vaqtdagi so‘rovlar bazada ketma-ket tekshiriladi.
- Check-in kelish sanasidan ketish sanasigacha faqat tayyor/bo‘sh xonaga bir marta; actual vaqt va band holati yoziladi.
- Check-out avval check-in qilingan bron uchun; actual vaqt, completed va cleaning holatini bir tranzaksiyada yozadi.
- Kirim va chiqimda 5 tadan kategoriya. Summa musbat, sana haqiqiy, kategoriya yozuv turiga mos bo‘lishi shart.
- Bron tarixi bor xona o‘chirilmaydi. Faol bronli mehmon arxivlanmaydi. Qolgan mehmonlar arxivlanadi, tarix saqlanadi. Tugatilgan/bekor bron o‘chirilsa moliya yozuvining summasi saqlanib, bog‘lanishi bo‘shatiladi.
- Tanlash/o‘chirish tasdig‘i ro‘yxat ichida: modal yo‘q. Ro‘yxatlar 15 tadan sahifalanadi.
- Pasport maydoni faqat sun’iy `TEST-...` identifikatorlar uchun; haqiqiy pasport yoki mijoz ma’lumotini kiritmang.
- Bandlik: tanlangan davrdagi noyob xona-tun / (xonalar × kunlar). Davrning oxirgi kuni kiritiladi; ketish kuni xona-tun emas.
- CSV/JSON/chop etish mavjud. Bootstrap CSS repositoryda (5.3.3, MIT); ishga tushganda CDN kerak emas.

## Tekshirish

```powershell
backend\.venv\Scripts\python.exe backend\manage.py check
backend\.venv\Scripts\python.exe backend\manage.py test hotel
backend\.venv\Scripts\python.exe backend\manage.py makemigrations --check --dry-run
```

Linuxda mos ravishda `backend/.venv/bin/python` ishlatiladi. Testlar alohida vaqtinchalik bazada bajariladi; amaldagi demo bazani o‘chirmaydi.

## Serverga chiqarish

`runserver` lokal demo uchun. Ishlab chiqarish serverida WSGI (masalan, Gunicorn), HTTPS, doimiy yoziladigan SQLite disk va backup kerak. Katta parallel yuklama uchun PostgreSQLga o‘tish tavsiya etiladi. `DJANGO_DEBUG=0`, kuchli `DJANGO_SECRET_KEY`, aniq `DJANGO_ALLOWED_HOSTS` va zarur `DJANGO_DB_PATH`ni server environment’da kiriting. `collectstatic`ni bajaring. Noto‘g‘ri hostname, kalit yoki storage bilan tayyor production deb hisoblamang. Bu turn doirasida hosting va haqiqiy hisoblar sozlanmagan.

## React API va ma’lumotlar himoyasi

- `/hotel-api/session/` server sessiyasi, CSRF token, role va shu hisobga tegishli ma’lumotlarni beradi.
- `/hotel-api/auth/login|register|logout|google/` session cookie bilan ishlaydi. Ro‘yxatdan o‘tishda hech qanday email domeni admin huquqini bermaydi. Google tokeni serverda imzo/audience/email_verified bo‘yicha tekshiriladi; `FIREBASE_PROJECT_ID` mos bo‘lsin. Haqiqiy Google hisobi bilan sinov hosting/Firebase sozlamalari tayyorligini talab qiladi.
- `/hotel-api/state/` PATCH: ruxsatlar, majburiy maydonlar, bron to‘qnashuvi, real check-in/out, narxlar va optimistik revision serverda tekshiriladi. Bir o‘zgarish rad etilsa butun tranzaksiya qaytariladi.
- Mehmon faqat o‘z profili va bronlarini oladi. Umumiy mavjudlik uchun faqat xona va band sanalar beriladi, boshqa mehmonning ismi/emaili berilmaydi. Moliya va audit public javobda yo‘q.
- Xona/bron/guest/finance relational modellarda; sayt rasmlari, matn va shaxsiy tanlovlar SiteState’da. Eski `/management/` yoki Django admin o‘zgarishi React revision’ini ham yangilaydi.
- React saqlash navbatini serverga yuboradi. 409 yoki ruxsat/validatsiya xatosida server nusxasi qaytadi va ko‘rinadigan “saqlanmadi” holati chiqadi. Server yo‘q bo‘lsa jim localStorage rejimiga o‘tmaydi. Boshqa qurilma yangiliklari 15 soniyada yoki “Yangilash” orqali olinadi.

Haqiqiy deploy uchun server domeni/hosting va doimiy disk kerak; bular repositorydagi kod bilan avtomatik ajratilmaydi. Domen bo‘lmasa ishlaydigan production integratsiya deb hisoblanmaydi.

## Mavjud Python hosting (Vercel bilan birlashtirish)

Hosting turiga mos WSGI entry point: `config.wsgi:application` (Gunicorn) yoki `backend/passenger_wsgi.py` (cPanel/Passenger). Gunicorn namunasi, loyiha ildizidan:

```bash
backend/.venv/bin/gunicorn --chdir backend --config backend/gunicorn.conf.py config.wsgi:application
```

Server environment: `DJANGO_DEBUG=0`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` (aniq hostlar), doimiy `DJANGO_DB_PATH`; keyin `migrate` va `collectstatic --noinput`. Server reverse proxy orqali kelsa, proxy haqiqiy HTTPS holatini belgilashiga mos `DJANGO_TRUST_PROXY=1` qo‘llanadi. cPanel’da virtualenv/entry point/env hosting paneli orqali tanlanadi. Maxfiy qiymatlar Gitga yozilmaydi.

Vercel frontend alohida qolsa: `VITE_HOTEL_SERVER=django` build environment, `/hotel-api/:path*` uchun haqiqiy Python backendning `/hotel-api/:path*` manziliga rewrite, SPA fallbackdan oldin. Django’da `DJANGO_CSRF_TRUSTED_ORIGINS=https://haqiqiy-vercel-domen` va kerakli ALLOWED_HOSTS bo‘lishi kerak. API cookie’lari frontendning bir xil origin’i orqali olinishi uchun proxy ishlatiladi; frontend API’ni brauzerdan to‘g‘ridan-to‘g‘ri boshqa origin’ga yubormaydi. Haqiqiy domenlar ma’lum bo‘lmaguncha soxta production URL yozilmadi.

## origin-hotel1-1.onrender.com va strix-user.vercel.app uchun tayyor sozlama

[RENDER_DEPLOY.md](./RENDER_DEPLOY.md) aniq build/start buyruqlari, Environment, doimiy baza, birinchi admin va Vercel redeploy tartibini beradi. Vercel API’ni Render’ga rewrite qiladi va server readiness tekshiruvisiz yangi frontendni nashr qilmaydi. Render’da disk borligi tasdiqlanmagan: DATABASE_URL orqali doimiy PostgreSQL varianti ham qo‘shilgan. SQLite lokal demo va haqiqiy Render persistent disk uchun saqlangan. PostgreSQL bilan ham barcha hotel yozishlari umumiy tranzaksiya/row lock ostida ketma-ket tekshiriladi; Django admin/formalar va API bir xil qoidani ishlatadi.

Render’da Shell bo‘lmasa `HOTEL_BOOTSTRAP_ADMIN_EMAIL` / `HOTEL_BOOTSTRAP_ADMIN_PASSWORD` orqali birinchi admin yaratish mavjud; mavjud hisobga avtomatik admin berilmaydi va parol qayta yozilmaydi. Maxfiy qiymatlar Render Environment’da kiritiladi.
