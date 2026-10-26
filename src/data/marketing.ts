/**
 * Content for the public marketing pages.
 *
 * Structure only: photo ids, icons, numbers and proper nouns live here so the
 * components stay readable, while every piece of human-readable copy comes from
 * the translation files (`src/i18n/locales/*`).
 */
import { roomPhotoForType } from '../services/imageUtils';

/** Unsplash CDN photos used across the marketing site (all checked to resolve). */
export const PHOTOS = {
  deluxe: 'https://images.unsplash.com/photo-1590490360182-c33d57733427',
  exterior: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791',
  lobby: 'https://images.unsplash.com/photo-1660557989695-14fac79c086d',
  suite: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
  presidential: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
  standard: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32',
  family: 'https://images.unsplash.com/photo-1564078516393-cf04bd966897',
} as const;

export const HOTEL = {
  phone: '+998 71 200 20 20',
  phoneHref: 'tel:+998712002020',
  email: 'reservations@originhotel.uz',
  addressLineOne: 'Amir Temur shoh ko‘chasi 15',
  addressLineTwo: 'Yunusobod tumani, Toshkent 100000',
  mapUrl: 'https://www.openstreetmap.org/?mlat=41.3111&mlon=69.2797#map=14/41.3111/69.2797',
  rating: '4.9',
  satisfaction: 98,
} as const;

/** Gallery mosaic — `wide` tiles span two columns on desktop. */
export const GALLERY = [
  { photo: PHOTOS.exterior, wide: true },
  { photo: PHOTOS.lobby, wide: false },
  { photo: roomPhotoForType('Suite'), wide: false },
  { photo: roomPhotoForType('Deluxe'), wide: true },
  { photo: PHOTOS.presidential, wide: false },
  { photo: roomPhotoForType('Family'), wide: false },
] as const;

/** Guest reviews. `quoteKey` resolves to a translated quote. */
export const REVIEWS = [
  { name: 'Madina R.', origin: 'Toshkent', rating: 5, quoteKey: 'landing.reviews.first' },
  { name: 'Daniel M.', origin: 'London', rating: 5, quoteKey: 'landing.reviews.second' },
  { name: 'Elena P.', origin: 'Moskva', rating: 4, quoteKey: 'landing.reviews.third' },
] as const;

export type GalleryItem = (typeof GALLERY)[number];
export type Review = (typeof REVIEWS)[number];
