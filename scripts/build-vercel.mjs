import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const BACKEND_URL = 'https://origin-hotel1-1.onrender.com';
export async function verifyHotelBackend({ fetchImpl = fetch, attempts = 3, wait = (ms) => new Promise((done) => setTimeout(done, ms)), timeoutMs = 20000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetchImpl(`${BACKEND_URL}/hotel-api/health/`, { redirect: 'error', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) throw new Error(`Render readiness HTTP ${response.status}`);
      const result = await response.json();
      if (result.service !== 'origin-hotel' || result.apiVersion !== 1 || result.ready !== true || result.trustedFrontend !== true || result.durableStorage !== true) throw new Error('Render API, doimiy baza, admin hisobi yoki CSRF origin sozlamasi tayyor emas.');
      if (!['manager-operations','staff-payroll','google-profile','owner-finance-control','manager-team-sync'].every((feature) => result.features?.includes(feature))) throw new Error('Render’da yangi nazorat, moliya va hisobot API hali deploy qilinmagan. Avval Render deploy tugashini kuting.');
      return;
    } catch (error) { lastError = error; }
    if (attempt + 1 < attempts) await wait(1000);
  }
  throw new Error(`Render backend tasdiqlanmadi: ${lastError?.message ?? 'Ulanish xatosi'}. Avval backend/RENDER_DEPLOY.md bo‘yicha serverni tayyorlang, keyin Vercel deploy’ni qaytaring. Ishlamaydigan frontend versiyasi nashr qilinmadi.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    console.log(`Render API tekshirilmoqda: ${BACKEND_URL}`);
    await verifyHotelBackend();
    const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', env: { ...process.env, VITE_HOTEL_SERVER: 'django' } });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
