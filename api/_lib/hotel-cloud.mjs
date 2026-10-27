import { createHmac, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function configured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT && process.env.HOTEL_ADMIN_PASSWORD_HASH && process.env.HOTEL_SESSION_SECRET?.length >= 32);
}
export function database() {
  const existing = getApps().find((app) => app.name === 'hotel-cloud');
  const app = existing ?? initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) }, 'hotel-cloud');
  return getFirestore(app);
}
export function checkPassword(password, stored) {
  const [salt, hex] = (stored ?? '').split(':');
  if (!salt || !/^[a-f0-9]{128}$/i.test(hex ?? '') || typeof password !== 'string' || password.length > 256) return false;
  const expected = Buffer.from(hex, 'hex');
  return timingSafeEqual(scryptSync(password, salt, 64), expected);
}
export function makeToken() {
  const payload = Buffer.from(JSON.stringify({ email: process.env.HOTEL_ADMIN_EMAIL || 'admin@admin.com', exp: Date.now() + 2 * 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${createHmac('sha256', process.env.HOTEL_SESSION_SECRET).update(payload).digest('base64url')}`;
}
export function authorized(req) {
  try {
    const [payload, signature] = (req.headers.authorization ?? '').replace(/^Bearer /, '').split('.');
    const expected = createHmac('sha256', process.env.HOTEL_SESSION_SECRET).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return session.exp > Date.now() && session.email === (process.env.HOTEL_ADMIN_EMAIL || 'admin@admin.com');
  } catch { return false; }
}
export function sanitizedState(data) {
  if (!data || !data.settings || !['rooms', 'guests', 'bookings', 'finance', 'users', 'notifications', 'visits', 'auditLog'].every((key) => Array.isArray(data[key]))) throw new Error('INVALID_DATA');
  // Local demo passwords and access codes must never become cloud account records.
  return { ...data, users: data.users.map(({ password, accessCode, ...user }) => user) };
}
export function publicState(data) {
  const { website, hotelName, contact, currency, timeZone, dateFormat, checkInTime, checkOutTime, taxRate, serviceFeeRate, seo, interface: appearance } = data.settings;
  return { rooms: data.rooms, settings: { website, hotelName, contact, currency, timeZone, dateFormat, checkInTime, checkOutTime, taxRate, serviceFeeRate, seo, interface: appearance } };
}
function chunks(data) {
  const encoded = gzipSync(JSON.stringify(data)).toString('base64');
  return Array.from({ length: Math.ceil(encoded.length / 400000) }, (_, index) => encoded.slice(index * 400000, (index + 1) * 400000));
}
export async function readState(scope) {
  const db = database();
  const metadata = await db.doc(`originHotel/${scope}`).get();
  if (!metadata.exists) return { data: null, revision: null };
  const { version, count, savedAt } = metadata.data();
  const records = await db.getAll(...Array.from({ length: count }, (_, index) => db.doc(`originHotelSnapshots/${scope}_${version}_${index}`)));
  const encoded = records.map((record) => { if (!record.exists) throw new Error('INCOMPLETE_SNAPSHOT'); return record.data().value; }).join('');
  return { data: JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')).toString()), revision: version, savedAt };
}
export async function writeState(raw, revision) {
  const data = sanitizedState(raw);
  const db = database();
  const version = randomUUID();
  const savedAt = new Date().toISOString();
  const privateChunks = chunks(data), publicChunks = chunks(publicState(data));
  if (privateChunks.length + publicChunks.length > 100) throw new Error('DATA_TOO_LARGE');
  await db.runTransaction(async (transaction) => {
    const metadata = db.doc('originHotel/private');
    const previous = await transaction.get(metadata);
    if ((previous.exists ? previous.data().version : null) !== revision) throw new Error('REVISION_CONFLICT');
    for (const [scope, values] of [['private', privateChunks], ['public', publicChunks]]) {
      values.forEach((value, index) => transaction.set(db.doc(`originHotelSnapshots/${scope}_${version}_${index}`), { value, savedAt }));
      transaction.set(db.doc(`originHotel/${scope}`), { version, count: values.length, savedAt });
    }
  });
  return { revision: version, savedAt };
}
