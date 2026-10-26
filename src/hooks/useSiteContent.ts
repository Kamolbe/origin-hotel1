import type { TOptions } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../context/AppDataContext';
import { PHOTOS } from '../data/marketing';

export function useSiteTranslation() {
  const original = useTranslation();
  const { data } = useAppData();
  const language = original.i18n.language.split('-')[0];
  const t = ((key: string, options: TOptions = {}) => {
    const custom = data.settings.website.texts[language]?.[key];
    return typeof custom === 'string' && custom.trim()
      ? original.i18n.services.interpolator.interpolate(custom, options, language, {})
      : original.i18n.t(key, { ...options, defaultValue: key });
  }) as typeof original.t;
  return { ...original, t };
}

export function useSitePhotos(): Record<keyof typeof PHOTOS, string> {
  const { data } = useAppData();
  const photos = { ...PHOTOS } as Record<keyof typeof PHOTOS, string>;
  for (const key of Object.keys(photos) as Array<keyof typeof PHOTOS>) {
    const value = data.settings.website.photos[key];
    if (value) photos[key] = value;
  }
  return photos;
}

export function useRoomPhotos() {
  const photos = useSitePhotos();
  return (room: { type: string; imageUrl?: string }) => room.imageUrl || photos[room.type.toLowerCase() as keyof typeof photos] || photos.standard;
}
