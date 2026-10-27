import { createHash } from 'node:crypto';
import { authorized, checkPassword, configured, database, makeToken, readState, writeState } from './_lib/hotel-cloud.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!configured()) return res.status(503).json({ error: 'CLOUD_NOT_CONFIGURED', message: 'Vercel server sozlamalarida Firebase va admin ulanishi hali kiritilmagan.' });
  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const ip = String(req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown').split(',')[0];
      const rate = database().doc(`originHotelLoginAttempts/${createHash('sha256').update(ip).digest('hex')}`);
      const allowed = await database().runTransaction(async (transaction) => {
        const snapshot = await transaction.get(rate);
        const previous = snapshot.data();
        const current = previous && previous.until > Date.now() ? previous : { count: 0, until: Date.now() + 15 * 60 * 1000 };
        if (current.count >= 10) return false;
        transaction.set(rate, { count: current.count + 1, until: current.until });
        return true;
      });
      if (!allowed) return res.status(429).json({ message: 'Urinishlar ko‘p. 15 daqiqadan keyin qayta urinib ko‘ring.' });
      if (body?.email !== (process.env.HOTEL_ADMIN_EMAIL || 'admin@admin.com') || !checkPassword(body?.password, process.env.HOTEL_ADMIN_PASSWORD_HASH)) return res.status(401).json({ message: 'Bulut admin emaili yoki paroli noto‘g‘ri.' });
      await rate.delete();
      return res.status(200).json({ token: makeToken() });
    }
    if (req.method === 'GET') {
      if (req.headers.authorization) {
        if (!authorized(req)) return res.status(401).json({ message: 'Bulut sessiyasi tugagan. Qayta ulaning.' });
        return res.status(200).json(await readState('private'));
      }
      return res.status(200).json(await readState('public'));
    }
    if (req.method === 'PUT') {
      if (!authorized(req)) return res.status(401).json({ message: 'Bulut sessiyasi tugagan. Qayta ulaning.' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      return res.status(200).json(await writeState(body?.data, body?.revision ?? null));
    }
    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).json({ message: 'Usul ruxsat etilmagan.' });
  } catch (error) {
    const conflict = error.message === 'REVISION_CONFLICT';
    return res.status(conflict ? 409 : 500).json({ message: conflict ? 'Boshqa qurilmada yangi o‘zgarish bor. Avval bulutdagi ma’lumotlarni qayta yuklang.' : 'Bulutga saqlab bo‘lmadi. Firebase server sozlamalarini tekshiring.' });
  }
}
