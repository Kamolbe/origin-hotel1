import { RoomAvailability } from '../components/RoomAvailability';
import { useAuth } from '../context/AuthContext';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useRoomPhotos } from '../hooks/useSiteContent';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { MarketingNav } from '../components/MarketingNav';
import { SiteFooter } from '../components/marketing/SiteFooter';
import { formatMoney } from '../services/hotelUtils';
import { optimizedUnsplashUrl } from '../services/imageUtils';

export function PublicRoomsPage() {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const getRoomPhoto = useRoomPhotos();
  const { data } = useAppData();
  const [type, setType] = useState<string>(preferences.roomType);
  const types = [...new Set(data.rooms.map((room) => room.type))];
  const rooms = data.rooms.filter((room) => type === 'all' || room.type === type);
  return <div className="min-h-screen bg-[var(--page)] text-[var(--text)]"><MarketingNav /><main className="mx-auto max-w-6xl px-5 py-8"><Link to="/" className="inline-flex items-center gap-2 text-xs text-muted"><ArrowLeft size={15} />Bosh sahifaga</Link><h1 className="mt-5 font-display text-4xl">Barcha xonalar</h1><p className="mt-3 text-sm text-muted">Xona turi, narxi va qulayliklarini ko‘ring. Mavjudlik bron sanalariga bog‘liq.</p>{(!user || user.role === 'user') && <div className="mt-5 md:hidden"><RoomAvailability /></div>}<div className="my-6 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap" role="group" aria-label="Xona turi">{['all', ...types].map((item) => <button key={item} type="button" aria-pressed={type === item} onClick={() => setType(item)} className={`min-w-0 !px-2 text-center !text-[11px] sm:!px-5 sm:!text-xs ${type === item ? 'primary-button' : 'secondary-button'}`}>{item === 'all' ? 'Barchasi' : item}</button>)}</div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rooms.map((room) => <article key={room.id} className="surface overflow-hidden rounded-3xl"><img src={optimizedUnsplashUrl(getRoomPhoto(room), 640, 75)} alt={`${room.type} xona namunasi`} loading="lazy" width="640" height="420" className="aspect-[3/2] w-full object-cover" /><div className="p-5"><h2 className="font-display text-2xl">{room.type} · {room.number}</h2><p className="mt-3 flex items-center gap-2 text-xs text-muted"><Users size={14} />{room.capacity} mehmon · {room.floor}-qavat</p><p className="mt-3 text-xs leading-6 text-muted">{room.amenities.join(' · ')}</p><p className="mt-4 font-semibold">{formatMoney(room.pricePerNight, data.settings.currency)} <span className="text-xs font-normal text-muted">/ tun</span></p><Link to={`/rooms/${room.id}`} className="secondary-button mt-4 w-full gap-2">Batafsil<ArrowRight size={14} /></Link></div></article>)}</div>{!rooms.length && <p className="surface rounded-2xl p-8 text-center">Hozircha xona mavjud emas.</p>}</main><SiteFooter /></div>;
}
