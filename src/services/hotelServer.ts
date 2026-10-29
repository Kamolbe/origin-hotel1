import { createDemoData } from '../data/seed';
import type { AppData, User } from '../types';

declare global { interface Window { __HOTEL_SERVER__?: string } }
export const usesHotelServer = () => window.__HOTEL_SERVER__ === 'django' || import.meta.env.VITE_HOTEL_SERVER === 'django';
export type ServerReply = { data: AppData; user: User | null; revision: number; csrfToken: string };
export type ServerChange = { collection: string; id: string; after: unknown };
let initial: ServerReply | null = null;
let csrfToken = '';
export function serverInitial() { return initial; }
export function hydrateServerData(data: AppData): AppData {
  const defaults = createDemoData().settings;
  return { ...data, settings: { ...defaults, ...data.settings, website: { ...defaults.website, ...data.settings.website, sections: { ...defaults.website.sections, ...data.settings.website?.sections } }, contact: { ...defaults.contact, ...data.settings.contact }, security: { ...defaults.security, ...data.settings.security }, integrations: { ...defaults.integrations, ...data.settings.integrations }, content: { ...defaults.content, ...data.settings.content }, seo: { ...defaults.seo, ...data.settings.seo }, interface: { ...defaults.interface, ...data.settings.interface }, operations: { ...defaults.operations, ...data.settings.operations } } };
}
export async function hotelRequest(path: string, method = 'GET', body?: unknown): Promise<ServerReply> {
  const sentToken = csrfToken;
  const response = await fetch(`/hotel-api/${path}/`, { method, credentials: 'same-origin', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'X-CSRFToken': csrfToken } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let result;
  try { result = await response.json(); } catch { throw new Error('Mehmonxona serveri bilan bog‘lanib bo‘lmadi.'); }
  if (!response.ok) throw new Error(result.message ?? 'Server so‘rovni qabul qilmadi.');
  if (csrfToken === sentToken || path.startsWith('auth/')) csrfToken = result.csrfToken;
  return { ...result, data: hydrateServerData(result.data) };
}
export async function initializeHotelServer() {
  if (usesHotelServer()) initial = await hotelRequest('session');
}
export function serverChanges(before: AppData, after: AppData): ServerChange[] {
  const changes: ServerChange[] = [];
  for (const collection of ['users', 'guests', 'bookings', 'rooms', 'finance', 'notifications'] as const) {
    const previous = new Map(before[collection].map((item) => [item.id, item]));
    const next = new Map(after[collection].map((item) => [item.id, item]));
    for (const [id, record] of next) if (JSON.stringify(previous.get(id)) !== JSON.stringify(record)) changes.push({ collection, id, after: record });
    for (const id of previous.keys()) if (!next.has(id)) changes.push({ collection, id, after: null });
  }
  if (JSON.stringify(before.settings) !== JSON.stringify(after.settings)) changes.push({ collection: 'settings', id: 'settings', after: after.settings });
  return changes;
}
export function applyServerChanges(data: AppData, changes: ServerChange[]): AppData {
  let next = { ...data };
  for (const change of changes) {
    if (change.collection === 'settings') { next = { ...next, settings: change.after as AppData['settings'] }; continue; }
    const collection = change.collection as 'users';
    const rows = next[collection].filter((item) => item.id !== change.id);
    if (change.after) rows.push(change.after as User);
    next = { ...next, [collection]: rows };
  }
  return next;
}
