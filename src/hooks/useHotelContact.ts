import { useAppData } from '../context/AppDataContext';
import { HOTEL } from '../data/marketing';

export function useHotelContact() {
  const { data } = useAppData();
  const contact = data.settings.contact;
  return { ...HOTEL, name: data.settings.hotelName, phone: contact.phone, phoneHref: `tel:${contact.phone.replace(/[^+\d]/g, '')}`, email: contact.email, addressLineOne: contact.address, addressLineTwo: contact.city, mapUrl: contact.mapUrl };
}
