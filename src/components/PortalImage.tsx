import type { ImgHTMLAttributes } from 'react';

/** Keep portal cards intact when a remote room photo cannot be loaded. */
export function PortalImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.removeAttribute('srcset'); if (!event.currentTarget.src.endsWith('/images/hotel-room-fallback.svg')) event.currentTarget.src = '/images/hotel-room-fallback.svg'; }} />;
}
