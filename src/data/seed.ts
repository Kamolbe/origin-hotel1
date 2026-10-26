import type {
  AppData,
  Booking,
  BookingStatus,
  DemoUserCredentials,
  FinanceEntry,
  Guest,
  Room,
  User,
} from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

function dateOffset(days: number, hour = 12): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function dateOnlyOffset(days: number): string {
  return dateOffset(days).slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  return Math.max(1, Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / DAY_MS));
}

export const DEMO_USERS: readonly DemoUserCredentials[] = [
  {
    id: "user-admin",
    name: "Hotel Administrator",
    email: "admin@admin.com",
    password: "Admin2026!",
    role: "admin",
    accessCode: "admin1234",
  },
  {
    id: "user-manager",
    name: "Hotel Manager",
    email: "manager@manager.com",
    password: "Manager2026!",
    role: "manager",
    accessCode: "manager1234",
  },
  {
    id: "user-frontdesk",
    name: "Front Desk",
    email: "user@origin.uz",
    password: "User2026!",
    role: "user",
  },
] as const;

const GUEST_NAMES: Array<[string, string, string]> = [
  ["Aziz", "Karimov", "Uzbekistan"],
  ["Madina", "Rakhimova", "Uzbekistan"],
  ["Daniel", "Morgan", "United Kingdom"],
  ["Laylo", "Tursunova", "Uzbekistan"],
  ["Michael", "Chen", "Singapore"],
  ["Nilufar", "Saidova", "Uzbekistan"],
  ["Elena", "Petrova", "Russia"],
  ["Jasur", "Abdullayev", "Uzbekistan"],
  ["Sofia", "Garcia", "Spain"],
  ["Bekzod", "Yusupov", "Uzbekistan"],
  ["Aisha", "Rahman", "Malaysia"],
  ["Timur", "Nazarov", "Uzbekistan"],
  ["Olga", "Smirnova", "Russia"],
  ["James", "Wilson", "United States"],
  ["Shahnoza", "Ismoilova", "Uzbekistan"],
  ["Artem", "Volkov", "Russia"],
  ["Maria", "Rossi", "Italy"],
  ["Sardor", "Khasanov", "Uzbekistan"],
  ["Emily", "Brown", "Australia"],
  ["Kamila", "Usmanova", "Uzbekistan"],
  ["Yusuf", "Demir", "Türkiye"],
  ["Anna", "Muller", "Germany"],
  ["Diyor", "Mamatov", "Uzbekistan"],
  ["Nargiza", "Tashpulatova", "Uzbekistan"],
  ["Lucas", "Martin", "France"],
  ["Malika", "Nurmukhamedova", "Uzbekistan"],
  ["Ivan", "Sokolov", "Russia"],
  ["Priya", "Sharma", "India"],
  ["Otabek", "Ergashev", "Uzbekistan"],
  ["Grace", "Kim", "South Korea"],
  ["Farida", "Alimova", "Uzbekistan"],
  ["Noah", "Taylor", "Canada"],
  ["Rustam", "Sattarov", "Uzbekistan"],
  ["Zarina", "Abbasova", "Azerbaijan"],
  ["Hiroshi", "Tanaka", "Japan"],
  ["Mansur", "Qodirov", "Uzbekistan"],
];

const ROOM_BLUEPRINTS = [
  { type: "Standard", capacity: 2, price: 480_000, amenities: ["Wi-Fi", "Air conditioning", "Work desk"] },
  { type: "Deluxe", capacity: 2, price: 720_000, amenities: ["Wi-Fi", "Air conditioning", "Work desk", "City view"] },
  { type: "Suite", capacity: 3, price: 1_250_000, amenities: ["Wi-Fi", "Living area", "Minibar", "City view"] },
  { type: "Family", capacity: 4, price: 980_000, amenities: ["Wi-Fi", "Two beds", "Air conditioning", "Work desk"] },
  { type: "Presidential", capacity: 4, price: 2_850_000, amenities: ["Wi-Fi", "Separate lounge", "Minibar", "Panoramic view"] },
] as const;

const STATUSES: BookingStatus[] = [
  ...Array<BookingStatus>(10).fill("completed"),
  ...Array<BookingStatus>(12).fill("confirmed"),
  ...Array<BookingStatus>(6).fill("pending"),
  ...Array<BookingStatus>(5).fill("rejected"),
  ...Array<BookingStatus>(7).fill("cancelled"),
  ...Array<BookingStatus>(6).fill("completed"),
  ...Array<BookingStatus>(8).fill("confirmed"),
  ...Array<BookingStatus>(4).fill("pending"),
  ...Array<BookingStatus>(2).fill("rejected"),
];

function bookingDates(index: number, status: BookingStatus): { checkIn: string; checkOut: string } {
  const repeatedRoom = index >= 40;
  const withinGroup = repeatedRoom ? index - 40 : index;
  let startOffset: number;
  let nights = 2 + (index % 3);

  if (status === "completed") {
    startOffset = repeatedRoom ? -100 - (withinGroup % 15) : -35 - (withinGroup % 18);
  } else if (status === "confirmed" && !repeatedRoom && withinGroup >= 10 && withinGroup <= 12) {
    startOffset = withinGroup - 11;
    nights = 3;
  } else if (status === "confirmed") {
    startOffset = repeatedRoom ? 24 + (withinGroup % 14) : 3 + (withinGroup % 9);
  } else if (status === "pending") {
    startOffset = repeatedRoom ? 45 + (withinGroup % 12) : 15 + (withinGroup % 11);
  } else {
    startOffset = repeatedRoom ? 18 + (withinGroup % 17) : 22 + (withinGroup % 13);
  }

  const checkIn = dateOnlyOffset(startOffset);
  return { checkIn, checkOut: dateOnlyOffset(startOffset + nights) };
}

function makeRooms(): Room[] {
  return Array.from({ length: 40 }, (_, index) => {
    const floor = Math.floor(index / 8) + 1;
    const roomOnFloor = (index % 8) + 1;
    const blueprint = ROOM_BLUEPRINTS[index % ROOM_BLUEPRINTS.length];
    const status: Room["status"] = index === 10 || index === 11 || index === 12
      ? "occupied"
      : index === 13
        ? "cleaning"
        : index === 14
          ? "maintenance"
          : "available";
    return {
      id: `room-${floor}${String(roomOnFloor).padStart(2, "0")}`,
      number: `${floor}${String(roomOnFloor).padStart(2, "0")}`,
      floor,
      type: blueprint.type,
      status,
      capacity: blueprint.capacity,
      pricePerNight: blueprint.price,
      amenities: [...blueprint.amenities],
    };
  });
}

function makeGuests(): Guest[] {
  return GUEST_NAMES.map(([firstName, lastName, nationality], index) => ({
    id: `guest-${String(index + 1).padStart(3, "0")}`,
    firstName,
    lastName,
    email: `${firstName}.${lastName}${index + 1}@example.com`.toLowerCase(),
    phone: `+998 ${90 + (index % 9)} ${String(100 + index).padStart(3, "0")} ${String(10 + index).padStart(2, "0")} ${String(20 + index).padStart(2, "0")}`,
    nationality,
    createdAt: dateOffset(-180 + index * 3, 9),
  }));
}

function makeBookings(rooms: Room[], guests: Guest[]): Booking[] {
  return STATUSES.map((status, index) => {
    const roomIndex = index < 40 ? index : index - 40;
    const room = rooms[roomIndex];
    const guest = guests[index % guests.length];
    const dates = bookingDates(index, status);
    const totalAmount = room.pricePerNight * daysBetween(dates.checkIn, dates.checkOut);
    const paidAmount = status === "completed"
      ? totalAmount
      : status === "confirmed"
        ? Math.round(totalAmount * (index % 3 === 0 ? 1 : 0.5))
        : 0;

    return {
      id: `booking-${String(index + 1).padStart(3, "0")}`,
      bookingNumber: `OR-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`,
      guestId: guest.id,
      roomId: room.id,
      checkIn: dates.checkIn,
      checkOut: dates.checkOut,
      status,
      adults: room.capacity > 2 && index % 4 === 0 ? 2 : 1 + (index % 2),
      children: room.capacity > 2 && index % 4 === 0 ? 1 : 0,
      totalAmount,
      paidAmount,
      source: (["website", "phone", "walk_in", "travel_partner"] as const)[index % 4],
      createdAt: dateOffset(status === "completed" ? -50 - (index % 30) : -20 + (index % 19), 10),
    };
  });
}

function makeFinance(bookings: Booking[]): FinanceEntry[] {
  const income: FinanceEntry[] = bookings
    .filter((booking) => booking.paidAmount > 0)
    .map((booking, index) => ({
      id: `finance-income-${String(index + 1).padStart(3, "0")}`,
      type: "income",
      category: "room_revenue",
      amount: booking.paidAmount,
      date: `${booking.status === "completed" ? booking.checkOut : booking.createdAt.slice(0, 10)}T11:00:00.000Z`,
      description: `Room payment ${booking.bookingNumber}`,
      paymentMethod: (["card", "cash", "bank_transfer", "online"] as const)[index % 4],
      bookingId: booking.id,
    }));

  const expenses: FinanceEntry[] = [
    { id: "finance-expense-001", type: "expense", category: "utilities", amount: 18_400_000, date: dateOffset(-25, 14), description: "Electricity and water services", paymentMethod: "bank_transfer" },
    { id: "finance-expense-002", type: "expense", category: "payroll", amount: 46_000_000, date: dateOffset(-23, 14), description: "Monthly staff payroll", paymentMethod: "bank_transfer" },
    { id: "finance-expense-003", type: "expense", category: "housekeeping", amount: 4_750_000, date: dateOffset(-20, 14), description: "Laundry and housekeeping supplies", paymentMethod: "card" },
    { id: "finance-expense-004", type: "expense", category: "maintenance", amount: 6_200_000, date: dateOffset(-17, 14), description: "Preventive equipment maintenance", paymentMethod: "bank_transfer" },
    { id: "finance-expense-005", type: "expense", category: "supplies", amount: 3_850_000, date: dateOffset(-14, 14), description: "Guest room amenities restock", paymentMethod: "card" },
    { id: "finance-expense-006", type: "expense", category: "food_and_beverage", amount: 9_600_000, date: dateOffset(-12, 14), description: "Restaurant and breakfast inventory", paymentMethod: "bank_transfer" },
    { id: "finance-expense-007", type: "expense", category: "marketing", amount: 2_400_000, date: dateOffset(-8, 14), description: "Travel partner campaign", paymentMethod: "online" },
    { id: "finance-expense-008", type: "expense", category: "utilities", amount: 17_900_000, date: dateOffset(-3, 14), description: "Monthly utilities settlement", paymentMethod: "bank_transfer" },
  ];
  return [...income, ...expenses];
}

function makeUsers(): User[] {
  return DEMO_USERS.map((demoUser, index) => ({
    ...demoUser,
    isActive: true,
    createdAt: dateOffset(-240 + index * 30, 9),
  }));
}

export function createDemoData(): AppData {
  const rooms = makeRooms();
  const guests = makeGuests();
  const bookings = makeBookings(rooms, guests);
  return {
    rooms,
    guests,
    bookings,
    finance: makeFinance(bookings),
    users: makeUsers(),
    notifications: [],
    visits: [],
    auditLog: [],
    settings: {
      hotelName: "Origin Hotel",
      contact: {
        phone: '+998 71 200 20 20',
        email: 'reservations@originhotel.uz',
        address: 'Amir Temur shoh ko‘chasi 15',
        city: 'Yunusobod tumani, Toshkent 100000',
        mapUrl: 'https://www.openstreetmap.org/?mlat=41.3111&mlon=69.2797#map=14/41.3111/69.2797',
        telegram: 'https://t.me/originhotel_bot',
        instagram: 'https://instagram.com/originhotel.uz',
        facebook: 'https://facebook.com/originhotel.uz',
      },
      currency: "UZS",
      timeZone: "Asia/Tashkent",
      dateFormat: "DD.MM.YYYY",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      taxRate: 0.12,
      serviceFeeRate: 0.05,
      security: { requireStrongPasswords: true, sessionTimeoutMinutes: 30, twoFactorEnabled: false, sslHttps: true, blockedIps: [] },
      roles: [
        { role: 'admin', permissions: ['Barcha boshqaruv', 'Foydalanuvchilar', 'Tizim sozlamalari'] },
        { role: 'moderator', permissions: ['Sharhlar', 'Bronlar', 'Mehmonlar'] },
        { role: 'editor', permissions: ['Kontent', 'Media', 'Sharhlar'] },
        { role: 'user', permissions: ['Xona bron qilish', 'Profil'] },
      ],
      integrations: { smtpEnabled: false, smtpHost: '', smtpPort: 587, smtpUser: '', smsEnabled: false, smsProvider: '' },
      content: { commentsEnabled: true, commentsModeration: 'manual', maxUploadMb: 10, allowedFormats: ['JPG', 'PNG', 'WEBP', 'PDF'] },
      seo: { title: 'Origin Hotel', description: 'Toshkentdagi zamonaviy mehmonxona.', keywords: 'mehmonxona, Toshkent, bron', googleAnalyticsId: '', yandexMetrikaId: '', facebookPixelId: '', sitemapEnabled: true, robotsDirectives: 'User-agent: *\nAllow: /\nDisallow: /app/' },
      interface: { accentColor: '#b99a68', font: 'Manrope', headerMenu: ['Bosh sahifa', 'Xonalar', 'Qulayliklar', 'Aloqa'], footerMenu: ['Biz haqimizda', 'Shartlar', 'Maxfiylik', 'Aloqa'] , widgets: ['Bron paneli', 'Mehmonlar sharhlari', 'Joylashuv'] },
      operations: { backupEnabled: true, backupFrequency: 'daily', backupTime: '02:00', maintenanceMode: false },
    },
  };
}
