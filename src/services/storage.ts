import { createDemoData } from '../data/seed';
import type { AppData } from '../types';

const STORAGE_KEY = 'origin-hotel-app-data-v1';

export function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function loadAppData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as AppData;
  } catch {
    // Demo data remains usable if browser storage is unavailable.
  }
  const data = createDemoData();
  saveAppData(data);
  return data;
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Keep the in-memory application state available.
  }
}
