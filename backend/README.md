# Django + SQLite hotel demo

PDFdagi Python/Django/SQLite/HTML/Bootstrap talablari uchun ishlaydigan server demo. Mavjud React/Vite sayt qayta yozilmadi; ikkala interfeys bitta repoda. **Bu bazani React `localStorage` yoki Firebase snapshotlari bilan avtomatik sinxronlamaydi.** Serverdagi CRUD, login va check-in/outni `/management/` orqali ishlating. Vercel static deploy Python serverni avtomatik yoqmaydi.

## Windows PowerShell

Loyiha ildizidan Python 3.12+ bilan:

```powershell
py -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe backend\manage.py migrate
backend\.venv\Scripts\python.exe backend\manage.py createsuperuser
backend\.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

`http://127.0.0.1:8000/management/` ni oching. `createsuperuser`dagi hisob bilan kiring. Parol hash ko‘rinishida saqlanadi, browserga berilmaydi. `/django-admin/` orqali foydalanuvchi va guruh ruxsatlari boshqariladi.

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
backend/.venv/bin/python backend/manage.py createsuperuser
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
