import { registerHooks } from 'node:module';
import { scryptSync } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Firestore network is replaced only in this test process; the API and crypto are real.
const records = new Map();
const snapshot = (path) => ({ exists: records.has(path), data: () => records.get(path) });
const doc = (path) => ({ path, get: async () => snapshot(path), delete: async () => records.delete(path) });
globalThis.__hotelTestDb = {
  doc,
  getAll: async (...refs) => refs.map((ref) => snapshot(ref.path)),
  runTransaction: async (callback) => {
    const pending = [];
    const result = await callback({ get: async (ref) => snapshot(ref.path), set: (ref, value) => pending.push([ref.path, structuredClone(value)]) });
    for (const [path, value] of pending) records.set(path, value);
    return result;
  },
};
registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'firebase-admin/app') return { url: 'test:firebase-app', shortCircuit: true };
  if (specifier === 'firebase-admin/firestore') return { url: 'test:firestore', shortCircuit: true };
  return next(specifier, context);
}, load(url, context, next) {
  if (url === 'test:firebase-app') return { format: 'module', source: "export const getApps=()=>[{name:'hotel-cloud'}];export const cert=x=>x;export const initializeApp=()=>({});", shortCircuit: true };
  if (url === 'test:firestore') return { format: 'module', source: 'export const getFirestore=()=>globalThis.__hotelTestDb;', shortCircuit: true };
  return next(url, context);
} });
const { default: handler } = await import('../api/hotel.mjs');
const { checkPassword } = await import('../api/_lib/hotel-cloud.mjs');
async function call(method, body, token, ip = 'test-client') {
  const result = { statusCode: 200, headers: {} };
  const res = { setHeader(key, value) { result.headers[key] = value; }, status(value) { result.statusCode = value; return this; }, json(value) { result.body = value; return this; } };
  await handler({ method, body, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'x-forwarded-for': ip } }, res);
  return result;
}
const fixture = {
  settings: { hotelName: 'Published hotel', website: {}, contact: { phone: '123' }, seo: {}, interface: {}, security: { blockedIps: ['private-ip'] }, integrations: { smtpUser: 'private-mailbox' } },
  rooms: [{ id: 'room-1', number: '101', pricePerNight: 100 }],
  guests: [{ id: 'guest-1', email: 'private-guest@example.com' }], bookings: [], finance: [],
  users: [{ id: 'admin-1', name: 'Admin', email: 'admin@admin.com', password: 'LOCAL-PASSWORD-MUST-NOT-UPLOAD', accessCode: 'LOCAL-CODE-MUST-NOT-UPLOAD', role: 'admin' }],
  notifications: [], visits: [], auditLog: [],
};
test('cloud API requires configuration, verifies admin, publishes only public data, strips passwords and prevents stale writes', async () => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
  assert.equal((await call('GET')).statusCode, 503);
  process.env.FIREBASE_SERVICE_ACCOUNT = '{}';
  process.env.HOTEL_SESSION_SECRET = 'test-secret-only-not-a-production-key-123456';
  process.env.HOTEL_ADMIN_EMAIL = 'admin@admin.com';
  process.env.HOTEL_ADMIN_PASSWORD_HASH = `test-salt:${scryptSync('test-password-only', 'test-salt', 64).toString('hex')}`;
  assert.equal(checkPassword('wrong', process.env.HOTEL_ADMIN_PASSWORD_HASH), false);
  assert.equal((await call('PUT', { data: fixture })).statusCode, 401);
  assert.equal((await call('POST', { email: 'admin@admin.com', password: 'wrong' })).statusCode, 401);
  const login = await call('POST', { email: 'admin@admin.com', password: 'test-password-only' });
  assert.equal(login.statusCode, 200);
  const token = login.body.token;
  assert.equal((await call('GET', undefined, token + 'tampered')).statusCode, 401);
  assert.equal((await call('GET')).body.data, null);
  const first = await call('PUT', { data: fixture, revision: null }, token);
  assert.equal(first.statusCode, 200);
  const privateData = await call('GET', undefined, token);
  assert.equal(privateData.body.data.guests[0].email, 'private-guest@example.com');
  assert.equal(privateData.body.data.users[0].password, undefined);
  assert.equal(privateData.body.data.users[0].accessCode, undefined);
  const published = await call('GET');
  assert.equal(published.body.data.settings.hotelName, 'Published hotel');
  assert.equal(published.body.data.rooms.length, 1);
  assert.equal(published.body.data.guests, undefined);
  assert.equal(published.body.data.users, undefined);
  assert.equal(published.body.data.settings.security, undefined);
  assert.equal(published.body.data.settings.integrations, undefined);
  assert.equal((await call('PUT', { data: fixture, revision: null }, token)).statusCode, 409);
  const second = await call('PUT', { data: { ...fixture, rooms: [] }, revision: first.body.revision }, token);
  assert.equal(second.statusCode, 200);
  assert.equal((await call('GET')).body.data.rooms.length, 0);
  assert.ok(records.has(`originHotelSnapshots/private_${first.body.revision}_0`), 'earlier backup is retained');
  assert.equal((await call('DELETE')).statusCode, 405);
  for (let i = 0; i < 10; i++) await call('POST', { email: 'admin@admin.com', password: 'wrong' }, undefined, 'rate-test');
  assert.equal((await call('POST', { email: 'admin@admin.com', password: 'wrong' }, undefined, 'rate-test')).statusCode, 429);
});
