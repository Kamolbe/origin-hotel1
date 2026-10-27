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

export const isSupportedImage = (value: string) => !value || /^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value) || /^data:image\/(?:webp|png|jpeg);base64,[a-z0-9+/=]+$/i.test(value);

/** Resize local images before storing them in the browser. */
export async function prepareImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPG, PNG yoki WebP rasm tanlang.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Rasm hajmi 10 MB dan oshmasin.');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    const ratio = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const context = canvas.getContext('2d'); if (!context) throw new Error('Rasmni qayta ishlash imkoni bo‘lmadi.');
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [.8, .65, .5, .35]) { const value = canvas.toDataURL('image/webp', quality); if (value.length <= 180000) return value; }
    throw new Error('Rasm juda katta. Kichikroq rasm tanlang.');
  } finally { URL.revokeObjectURL(url); }
}
