export type UserRole = 'user' | 'manager' | 'admin';
export type RoomType = 'Standard' | 'Deluxe' | 'Suite' | 'Family' | 'Presidential';
export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export type FinanceType = 'income' | 'expense';
export type FinanceCategory = 'room_revenue' | 'additional_services' | 'rental' | 'food_and_beverage' | 'housekeeping' | 'utilities' | 'maintenance' | 'payroll' | 'supplies' | 'marketing' | 'other';
export type FinancePaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'online';
export type Currency = 'UZS' | 'USD' | 'EUR';

export interface DemoUserCredentials {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  accessCode?: string;
}

export interface UserPreferences {
  language?: string;
  theme?: 'light' | 'dark';
  reducedMotion: boolean;
  defaultGuests: number;
  roomType: RoomType | 'all';
  bookingNote: string;
}

export interface User extends DemoUserCredentials {
  isActive: boolean;
  createdAt: string;
  phone?: string;
  nationality?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  twoFactorEnabled?: boolean;
  preferences?: Partial<UserPreferences>;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  /** Synthetic demo identifiers only; never collect real passport data in this demo. */
  passportNumber?: string;
  createdAt: string;
  notes?: string;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  imageUrl?: string;
  description?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  userId?: string;
  guestId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  adults: number;
  children: number;
  totalAmount: number;
  paidAmount: number;
  source: 'website' | 'phone' | 'walk_in' | 'travel_partner';
  createdAt: string;
  notes?: string;
  guestNote?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface FinanceEntry {
  id: string;
  type: FinanceType;
  category: FinanceCategory;
  amount: number;
  date: string;
  description: string;
  paymentMethod: FinancePaymentMethod;
  bookingId?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  type: 'booking' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: 'room' | 'guest' | 'booking' | 'finance' | 'user';
  entityId: string;
  userId?: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface SystemRolePermission {
  role: 'admin' | 'moderator' | 'editor' | 'user';
  permissions: string[];
}

/** Public hotel contact channels. Every field drives the website: header, footer,
 *  the "Administrator bilan bog'lanish" dialog and the room details page. */
export interface HotelContact {
  phone: string;
  email: string;
  address: string;
  city: string;
  mapUrl: string;
  telegram: string;
  instagram: string;
  facebook: string;
}

/** One visit to the public website, recorded so staff can see site activity. */
export interface Visit {
  id: string;
  at: string;
  path: string;
  device: 'Mobil' | 'Planshet' | 'Desktop';
  browser: string;
  userId?: string;
  userName?: string;
  userRole?: UserRole;
}

export type HomeSectionId = 'stats' | 'rooms' | 'about' | 'gallery' | 'reviews' | 'contact' | 'planner' | 'cta' | 'bookingSearch';
export interface WebsiteSettings {
  texts: Record<string, Record<string, string>>;
  photos: Partial<Record<'exterior' | 'lobby' | 'deluxe' | 'standard' | 'suite' | 'presidential' | 'family', string>>;
  sections: Record<HomeSectionId, boolean>;
  gallery: string[];
  logoUrl: string;
  services: string[];
}

export interface AppSettings {
  website: WebsiteSettings;
  hotelName: string;
  contact: HotelContact;
  currency: Currency;
  timeZone: string;
  dateFormat: string;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
  serviceFeeRate: number;
  security: {
    requireStrongPasswords: boolean;
    sessionTimeoutMinutes: number;
    twoFactorEnabled: boolean;
    sslHttps: boolean;
    blockedIps: string[];
  };
  roles: SystemRolePermission[];
  integrations: {
    smtpEnabled: boolean;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smsEnabled: boolean;
    smsProvider: string;
  };
  content: {
    commentsEnabled: boolean;
    commentsModeration: 'auto' | 'manual';
    maxUploadMb: number;
    allowedFormats: string[];
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
    googleAnalyticsId: string;
    yandexMetrikaId: string;
    facebookPixelId: string;
    sitemapEnabled: boolean;
    robotsDirectives: string;
  };
  interface: {
    accentColor: string;
    pageColor?: string;
    surfaceColor?: string;
    textColor?: string;
    font: 'Manrope' | 'Inter' | 'Georgia';
    headerMenu: string[];
    footerMenu: string[];
    widgets: string[];
  };
  operations: {
    backupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly';
    backupTime: string;
    maintenanceMode: boolean;
  };
}

export interface AppData {
  rooms: Room[];
  guests: Guest[];
  bookings: Booking[];
  finance: FinanceEntry[];
  users: User[];
  notifications: NotificationItem[];
  visits: Visit[];
  auditLog: AuditEntry[];
  settings: AppSettings;
}
