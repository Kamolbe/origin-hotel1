import { createDemoData } from '../data/seed';
import type { AppData } from '../types';

const STORAGE_KEY = 'origin-hotel-app-data-v1';

export function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function loadAppData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const stored = JSON.parse(saved) as Partial<AppData>;
      const defaults = createDemoData();
      if (!stored.settings) return { ...defaults, ...stored, settings: defaults.settings } as AppData;
      const settings = {
        ...defaults.settings,
        ...stored.settings,
        security: { ...defaults.settings.security, ...stored.settings.security },
        roles: stored.settings.roles?.length ? stored.settings.roles : defaults.settings.roles,
        integrations: { ...defaults.settings.integrations, ...stored.settings.integrations },
        content: { ...defaults.settings.content, ...stored.settings.content },
        seo: { ...defaults.settings.seo, ...stored.settings.seo },
        interface: { ...defaults.settings.interface, ...stored.settings.interface },
        operations: { ...defaults.settings.operations, ...stored.settings.operations },
      };
      const migrated = { ...defaults, ...stored, settings } as AppData;
      saveAppData(migrated);
      return migrated;
    }
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
