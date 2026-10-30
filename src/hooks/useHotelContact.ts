import { useAppData } from '../context/AppDataContext';
import { HOTEL } from '../data/marketing';

/** `https://t.me/origin_bot` → `@origin_bot` for display. */
export function channelHandle(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('@')) return trimmed;
  const slug = trimmed.replace(/\/+$/, '').split('/').pop() ?? '';
  return slug ? `@${slug}` : trimmed;
}

/**
 * Live hotel contact details for the public site. Falls back to the bundled
 * defaults when the administrator has not filled a field in yet.
 */
export function useHotelContact() {
  const { data } = useAppData();
  const contact = data.settings.contact;
  return {
    ...HOTEL,
    name: data.settings.hotelName,
    phone: contact.phone || HOTEL.phone,
    phoneHref: `tel:${(contact.phone || HOTEL.phone).replace(/[^+\d]/g, '')}`,
    email: contact.email || HOTEL.email,
    addressLineOne: contact.address,
    addressLineTwo: contact.city,
    mapUrl: contact.mapUrl,
    mapEmbedUrl: contact.mapEmbedUrl,
    telegram: contact.telegram,
    telegramHandle: channelHandle(contact.telegram),
    instagram: contact.instagram,
    instagramHandle: channelHandle(contact.instagram),
    facebook: contact.facebook,
    facebookHandle: channelHandle(contact.facebook),
    checkInTime: data.settings.checkInTime,
    checkOutTime: data.settings.checkOutTime,
  };
}
