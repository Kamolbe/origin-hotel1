# origin-hotel1-1.onrender.com → strix-user.vercel.app

Bu repositorydagi Vercel sozlamasi **`/hotel-api/...`ni `https://origin-hotel1-1.onrender.com/hotel-api/...`ga proxy qiladi.** Brauzer bir xil Vercel origin’ida ishlaydi; server sessiya/CSRF cookie’lari shu proxy orqali o‘tadi. API, ma’lumotlar va birinchi admin tayyor bo‘lmaguncha `build:vercel` to‘xtaydi; ishlayotgan eski Vercel deployment almashtirilmaydi.

Ushbu hujjat Render/Vercel dashboard sozlamalari amalga oshirilganini anglatmaydi. Chatdagi vositalarda bu hosting hisoblarini boshqarish huquqi yo‘q; quyidagi sozlamalar Render panelida bajariladi. Parol, DATABASE_URL yoki secret key’ni chatga/GitHub’ga yozmang.

## 1. Render → mavjud origin-hotel1 xizmati → Settings

- Repository: `Kamolbe/origin-hotel1`, branch `main`.
- Runtime: Python 3; Root Directory: bo‘sh (repository ildizi).
- Build Command: `bash scripts/render-build.sh`
- Start Command: `bash scripts/render-start.sh`
- Health Check Path: `/hotel-api/live/`

`live/` birinchi admin yaratilmasidan ham ishlaydi. `health/` esa Vercel uchun readiness tekshiruvi: baza/migration, doimiy storage, faol admin va ishonchli frontend origin’i kerak. Gunicorn Render bergan `$PORT`da `0.0.0.0`ga bog‘lanadi. WhiteNoise yig‘ilgan Django admin statikalarini beradi. Render faqat backend bo‘lsa, uning root manzili Vercel saytiga yo‘naltiradi; React build’ni Render’da qayta yig‘ish shart emas.

## 2. Render → Environment

| Nom | Qiymat |
|---|---|
| `DJANGO_DEBUG` | `0` |
| `DJANGO_SECRET_KEY` | Render’da yangi kuchli tasodifiy maxfiy qiymat yarating; oshkor qilmang |
| `DJANGO_ALLOWED_HOSTS` | `origin-hotel1-1.onrender.com,strix-user.vercel.app` |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | `https://strix-user.vercel.app,https://origin-hotel1-1.onrender.com` |
| `DJANGO_TRUST_PROXY` | `1` |
| `HOTEL_FRONTEND_URL` | `https://strix-user.vercel.app` |
| `FIREBASE_PROJECT_ID` | `origin-hotel` (Google login ishlatilsa) |

Environment o‘zgartirilgach xizmatni qayta deploy qiling. `DJANGO_SECRET_KEY`ni har deployda almashtirmang: sessionlar shu kalit bilan tekshiriladi. Server default Render muhitida production rejimini tanlaydi va maxfiy kalit bo‘lmasa ishga tushmaydi.

## 3. Doimiy saqlash — ikkita variantdan bittasi

**PostgreSQL (disk talab qilmaydi):** tanlagan doimiy PostgreSQL bazangizning maxfiy connection URL qiymatini Render Environment’dagi `DATABASE_URL`ga qo‘ying. Misol format: `postgresql://USER:PASSWORD@HOST:5432/DBNAME` — bu yerga haqiqiy qiymatlarni yozmang. Psycopg drayver va migration qo‘llovi repositoryda bor. TLS sukut bo‘yicha talab qilinadi. DATABASE_URL bo‘lsa u SQLite’dan ustun turadi.

**SQLite + Render Persistent Disk:** mavjud xizmatda haqiqiy persistent diskni `/var/data`ga ulang va `DJANGO_DB_PATH=/var/data/origin-hotel.sqlite3` qo‘ying; DATABASE_URL’ni ishlatmang. Faqat environment path yozishning o‘zi disk ajratmaydi. Render’dagi diskning plan/tarif talabini hosting panelida tekshiring; bu kod hech qanday pullik disk yoki bazani avtomatik yaratmaydi.

Render xizmatining oddiy vaqtinchalik fayl tizimidagi `backend/db.sqlite3` doimiy baza hisoblanmaydi: qayta deployda yo‘qolishi mumkin. Readiness bunday holatda Vercel nashrini bloklaydi. PostgreSQL providerning muddati, backup va hisob faoliyati ham boshqarilishi kerak; vaqtinchalik/amal qilish muddati bor bazani “butun umr” deb hisoblamang.

Avval biror bazada haqiqiy yozuvlar bo‘lsa, yangi bo‘sh bazaga shunchaki ulab yubormang. Backup va alohida import rejasini tuzing. Frontenddagi eski localStorage yozuvlari avtomatik serverga import qilinmaydi.

## 4. Birinchi admin — Shell talab qilmaydigan usul

Render Environment’da `HOTEL_BOOTSTRAP_ADMIN_EMAIL=admin@admin.com` va `HOTEL_BOOTSTRAP_ADMIN_PASSWORD`ga yangi, kamida 12 belgili maxfiy parol kiriting; keyin qayta deploy qiling. `render-start.sh` birinchi adminni bazada yaratadi. Mavjud faol admin bo‘lsa paroli va roli almashtirilmaydi. Oddiy mavjud hisob avtomatik admin qilinmaydi. Parol chatga, Gitga yoki logga yozilmaydi.

Admin yaratilganidan keyin `HOTEL_BOOTSTRAP_ADMIN_PASSWORD`ni Environment’dan olib tashlang. Keyingi deploylarda hisob bazada qoladi. Eski React demo paroli avtomatik server hisobiga aylanmaydi.

Render Shell mavjud bo‘lsa muqobil usul:

```bash
python backend/manage.py createsuperuser --username admin@admin.com --email admin@admin.com
```

Sinov xonalari kerak bo‘lsa va Shell mavjud bo‘lsa `HOTEL_DEMO_PASSWORD`ni vaqtincha yangi kamida 12 belgili test qiymatiga sozlab, `python backend/manage.py seed_demo` bajaring. Mavjud yozuvlar almashtirilmaydi. Yoki saytga yangi admin bilan kirib, xonalarni o‘zingiz qo‘shing. Haqiqiy guest/passport ma’lumotlarini demo seedga kiritmang.

## 5. Tekshirish va Vercel’ni qayta deploy qilish

1. `https://origin-hotel1-1.onrender.com/hotel-api/live/` JSON qaytarsin.
2. `https://origin-hotel1-1.onrender.com/hotel-api/health/` HTTP 200 bilan `service=origin-hotel`, `apiVersion=1`, `ready=true`, `trustedFrontend=true`, `durableStorage=true` qaytarsin. 503 bo‘lsa avval baza/admin/originni tuzating; frontend himoya tekshiruvini o‘chirmang.
3. Vercel → `strix-user` → Deployments → oxirgi commit → Redeploy. `vercel.json` build command’ni `npm run build:vercel` qiladi va script `VITE_HOTEL_SERVER=django` bilan React’ni yig‘adi; alohida Vite environment flag kiritish talab qilinmaydi.
4. `https://strix-user.vercel.app/hotel-api/session/` HTML emas, JSON qaytarsin. Foydalanuvchi va admin uchun ikkita alohida brauzer sessiyasida bron/izoh → tasdiqlash → check-in/outni tekshiring.
5. Yangi yozuv qo‘shing, Render qayta deploy/restartidan keyin yozuv saqlanganini tekshiring. Bu tekshiruv real doimiy storage’ni tasdiqlash uchun kerak.

Bu ijro muhitining tarmoq proksisi foydalanuvchi bergan ikkala public domenni 403 bilan blokladi. Shu sabab haqiqiy Render/Vercel deployment holati shu sessiyada tasdiqlanmadi; lokal testlar va koddagi preflight buni almashtirmaydi.

## Admin / manager va ish haqi yangilanishi

Yangi rol taqsimoti, Render’da manager yaratish, migratsiyalar, oyliklar va Google profilining chegaralari: [ROLES_AND_PAYROLL.md](../docs/ROLES_AND_PAYROLL.md). Avval Render’ni deploy qiling, keyin Vercel yangi backend xususiyatlari tekshiruvidan o‘tsin.
