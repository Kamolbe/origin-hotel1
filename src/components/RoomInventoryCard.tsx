import { BedDouble, Building2, Check, Edit3, Trash2, UserRoundPlus, Users } from 'lucide-react';
import type { Currency, Room } from '../types';
import { formatMoney } from '../services/hotelUtils';
import { optimizedUnsplashUrl, unsplashSrcSet } from '../services/imageUtils';
import { PortalImage } from './PortalImage';
import { StatusPill } from './StatusPill';

const statusLabel = { available: 'Bo‘sh', occupied: 'Band', cleaning: 'Tozalanmoqda', maintenance: 'Ta’mirda' };

export function RoomInventoryCard({ room, image, guestCount, currency, canManage, onAssign, onEdit, onDelete }: {
  room: Room; image: string; guestCount: number; currency: Currency; canManage: boolean;
  onAssign: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return <article aria-label={`${room.number}-xona`} className="inventory-room-card">
    <div className="inventory-room-photo">
      <PortalImage src={optimizedUnsplashUrl(image, 640, 78)} srcSet={unsplashSrcSet(image, [360, 480, 640, 900], 78)} sizes="(min-width: 1280px) 30vw, (min-width: 768px) 44vw, 100vw" width={900} height={600} alt={`${room.number}-xona · ${room.type}`} loading="lazy" decoding="async" />
      <div className="inventory-room-shade" />
      <div className="inventory-room-photo-top"><span className="inventory-room-category"><BedDouble size={13} />{room.type}</span><StatusPill status={room.status}>{statusLabel[room.status]}</StatusPill></div>
      <div className="inventory-room-photo-bottom"><h3><span>XONA</span>{room.number}</h3><span className="inventory-room-floor"><Building2 size={14} />{room.floor}-qavat</span></div>
    </div>
    <div className="inventory-room-body">
      <div className="inventory-room-facts">
        <div><Users size={16} /><span>Sig‘im<strong>{room.capacity} kishi</strong></span></div>
        <div><BedDouble size={16} /><span>Hozirgi mehmonlar<strong>{guestCount} kishi</strong></span></div>
      </div>
      <div className="inventory-room-amenities" aria-label="Xona qulayliklari">
        {room.amenities.slice(0, 3).map((amenity, index) => <span key={`${amenity}-${index}`}><Check size={12} />{amenity}</span>)}
        {room.amenities.length > 3 && <details><summary>+{room.amenities.length - 3} qulaylik</summary><p>{room.amenities.slice(3).join(' · ')}</p></details>}
      </div>
      <div className="inventory-room-price"><span>Bir kecha uchun<strong>{formatMoney(room.pricePerNight, currency)}</strong></span><span className="inventory-room-night">/ tun</span></div>
      {canManage && <div className="inventory-room-actions">
        <button onClick={onAssign} aria-label={`${room.number}-xonaga mehmon joylashtirish`} className="inventory-room-assign"><UserRoundPlus size={16} />Joylashtirish</button>
        <button onClick={onEdit} aria-label={`${room.number}-xonani tahrirlash`} title="Tahrirlash" className="inventory-room-edit"><Edit3 size={16} /></button>
        <button onClick={onDelete} aria-label={`${room.number}-xonani o‘chirish`} title="O‘chirish" className="inventory-room-delete"><Trash2 size={16} /></button>
      </div>}
    </div>
  </article>;
}
