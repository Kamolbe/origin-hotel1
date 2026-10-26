export function optimizedUnsplashUrl(url: string, width: number, quality = 76): string {
  if (!url.startsWith('https://images.unsplash.com/')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}auto=format&fit=crop&w=${width}&q=${quality}`;
}

export function unsplashSrcSet(url: string, widths: number[], quality = 76): string {
  return widths.map((width) => `${optimizedUnsplashUrl(url, width, quality)} ${width}w`).join(', ');
}

const roomPhotos: Record<string, string> = {
  Standard: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32',
  Deluxe: 'https://images.unsplash.com/photo-1590490360182-c33d57733427',
  Suite: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
  Family: 'https://images.unsplash.com/photo-1564078516393-cf04bd966897',
  Presidential: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
};

export function roomPhotoForType(type: string): string {
  return roomPhotos[type] ?? roomPhotos.Standard;
}
