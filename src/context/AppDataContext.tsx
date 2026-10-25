import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppData } from '../types';
import { loadAppData, saveAppData } from '../services/storage';

type Updater = (current: AppData) => AppData;
type AppDataContextValue = { data: AppData; updateData: (updater: Updater) => AppData; refreshData: () => void };
const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const dataRef = useRef(data);
  dataRef.current = data;

  const updateData = useCallback((updater: Updater) => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    setData(next);
    saveAppData(next);
    return next;
  }, []);
  const refreshData = useCallback(() => {
    const latest = loadAppData();
    dataRef.current = latest;
    setData(latest);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'origin-hotel-app-data-v1') refreshData();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshData]);

  return <AppDataContext.Provider value={{ data, updateData, refreshData }}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}
