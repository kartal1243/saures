import path from 'path';
import { SHOPS_DIR } from './config';
import { localDay } from './day';
import { readJsonFile, writeJsonFile } from './fsdb';
import { findAccountById, getAccounts } from './accounts';
import type { AppState, BarberSalonSettings, BarberStaff, BarberService, BarberReview } from '../shared/types';

export function slugify(text: string): string {
  const trMap: Record<string, string> = {
    ç: 'c', Ç: 'c',
    ğ: 'g', Ğ: 'g',
    ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o',
    ş: 's', Ş: 's',
    ü: 'u', Ü: 'u',
  };
  return text
    .split('')
    .map((char) => trMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

export const defaultBarberSettings: BarberSalonSettings = {
  slotIntervalMinutes: 15,
  openingTime: '09:00',
  closingTime: '21:00',
  closedDays: [0], // Pazar kapalı
  closedReason: 'Pazar Günleri Salon Kapalı',
  bookingLeadDays: 14,
  autoAssignStrategy: 'least_busy',
  requireOtp: true,
  enableWhatsAppReminders: true,
  allowCancellationHoursBefore: 2,
  discountSlots: [
    {
      id: 'disc-1',
      dayOfWeek: 2, // Salı
      startTime: '11:00',
      endTime: '15:00',
      discountPercent: 20,
      label: 'Salı Ölü Saat Kampanyası (%20)',
      active: true,
    },
    {
      id: 'disc-2',
      dayOfWeek: 3, // Çarşamba
      startTime: '11:00',
      endTime: '15:00',
      discountPercent: 20,
      label: 'Çarşamba Öğle Fırsatı (%20)',
      active: true,
    },
  ],
};

// Gerçek yeni hesaplar için varsayılan boş listeler
export const defaultBarberStaff: BarberStaff[] = [];
export const defaultBarberServices: BarberService[] = [];

// SADECE DEMO HESAP İÇİN ÖRNEK VERİLER
export const demoBarberStaff: BarberStaff[] = [
  {
    id: 'staff-1',
    name: 'Ahmet Usta (Baş Kuaför)',
    phone: '5551112233',
    role: 'Usta',
    title: 'Baş Kuaför',
    commissionRate: 35,
    skills: ['Saç Kesimi', 'Sakal Tıraşı', 'Saç & Sakal Kombin', 'VIP Damat Paketi'],
    offDays: [0], // Pazar
    workingHours: { start: '09:00', end: '20:30' },
    active: true,
    color: '#3b82f6',
    customPricing: {
      'srv-1': { price: 500, duration: 25 }, // Modern Saç: Baş Usta farkı 500 TL, 25 dk
      'srv-2': { price: 250, duration: 15 }, // Sakal Tıraşı: 250 TL, 15 dk
      'srv-3': { price: 700, duration: 35 }, // Saç & Sakal Kombin: 700 TL, 35 dk
    },
  },
  {
    id: 'staff-2',
    name: 'Mehmet Kalfa',
    phone: '5552223344',
    role: 'Kalfa',
    title: 'Stilist & Kalfa',
    commissionRate: 25,
    skills: ['Saç Kesimi', 'Sakal Tıraşı', 'Saç & Sakal Kombin', 'Cilt Maskesi & Buhar'],
    offDays: [0, 1], // Pazar, Pazartesi
    workingHours: { start: '09:30', end: '21:00' },
    active: true,
    color: '#10b981',
    customPricing: {
      'srv-1': { price: 300, duration: 40 }, // Kalfa: 300 TL, 40 dk
      'srv-2': { price: 180, duration: 25 }, // Sakal: 180 TL, 25 dk
    },
  },
  {
    id: 'staff-3',
    name: 'Eren Usta (Cilt & Bakım)',
    phone: '5553334455',
    role: 'Uzman',
    title: 'Cilt Bakım Uzmanı',
    commissionRate: 30,
    skills: ['Cilt Maskesi & Buhar', 'Saç Yıkama & Fön', 'Ağda & Kaş'],
    offDays: [0, 2], // Pazar, Salı
    workingHours: { start: '10:00', end: '19:30' },
    active: true,
    color: '#8b5cf6',
  },
];

export const demoBarberServices: BarberService[] = [
  {
    id: 'srv-1',
    name: 'Modern Saç Kesimi',
    durationMinutes: 30,
    duration: 30,
    price: 350,
    category: 'Saç',
    allowedStaffIds: ['staff-1', 'staff-2'],
    isPopular: true,
  },
  {
    id: 'srv-2',
    name: 'Sakal Tıraşı & Şekillendirme',
    durationMinutes: 20,
    duration: 20,
    price: 200,
    category: 'Sakal',
    allowedStaffIds: ['staff-1', 'staff-2'],
    isPopular: true,
  },
  {
    id: 'srv-3',
    name: 'Saç & Sakal Kombin (Yıkama Dahil)',
    durationMinutes: 45,
    duration: 45,
    price: 500,
    category: 'Paket',
    allowedStaffIds: ['staff-1', 'staff-2'],
    isPopular: true,
  },
  {
    id: 'srv-4',
    name: 'Cilt Maskesi, Buhar & Peeling',
    durationMinutes: 30,
    duration: 30,
    price: 300,
    category: 'Bakım',
    allowedStaffIds: ['staff-2', 'staff-3'],
  },
  {
    id: 'srv-5',
    name: 'VIP Damat & Özel Bakım Paketi',
    durationMinutes: 90,
    duration: 90,
    price: 1500,
    category: 'VIP',
    isBundle: true,
    bundleItemNames: ['Modern Saç Kesimi', 'Sakal Tıraşı & Şekillendirme', 'Cilt Maskesi, Buhar & Peeling'],
    allowedStaffIds: ['staff-1'],
  },
];

export const demoBarberReviews: BarberReview[] = [
  {
    id: 'rev-1',
    customerName: 'Burak Yılmaz',
    staffName: 'Ahmet Usta (Baş Kuaför)',
    rating: 5,
    comment: 'Ahmet Usta saç kesiminde gerçekten usta! Randevum tam vaktinde başladı, ilgi ve alaka kusursuzdu.',
    createdAt: '2026-11-01T14:30:00.000Z',
    approved: true,
  },
  {
    id: 'rev-2',
    customerName: 'Can Demir',
    staffName: 'Mehmet Kalfa',
    rating: 5,
    comment: 'Sakal tıraşı ve buhar maskesi harikaydı, eline sağlık Mehmet kardeşim. Tertemiz salon.',
    createdAt: '2026-10-30T16:15:00.000Z',
    approved: true,
  },
  {
    id: 'rev-3',
    customerName: 'Serdar K.',
    staffName: 'Ahmet Usta (Baş Kuaför)',
    rating: 5,
    comment: 'VIP Damat Paketi aldım, düğün öncesi tüm stresi aldı. Şiddetle tavsiye ederim.',
    createdAt: '2026-10-28T11:00:00.000Z',
    approved: true,
  },
];

// Boş state — GERÇEK HESAPLAR İÇİN demo/seed veri YOKTUR, tertemiz başlar!
export function emptyState(seed?: { storeName: string; ownerName: string; phone: string; isDemo?: boolean }): AppState {
  const isDemo = Boolean(
    seed?.isDemo || seed?.phone === '05900000011' || seed?.phone === '05550000000'
  );
  const storeSlug = isDemo ? 'demo' : (seed?.storeName ? slugify(seed.storeName) : 'yeni-dukkan');

  // 14 Günlük Ücretsiz VIP Kampanyası (Tüm yeni esnaflara 14 gün tam teşekküllü deneme)
  const trialDays = 14;
  const trialExpiry = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    storeName: seed?.storeName || 'Yeni Dükkan',
    shopProfile: {
      storeName: seed?.storeName || '',
      ownerName: seed?.ownerName || '',
      businessField: 'Kuaför / Berber / Güzellik Salonu',
      sectorKey: 'berber_kuafor',
      employeeCount: '1',
      phone: seed?.phone || '',
      cityDistrict: '',
      dailyTarget: 2500,
      slogan: 'Kaliteli & Güler Yüzlü Hizmet',
      slug: storeSlug,
      isConfigured: false,
      isVip: true, // 14 Gün Ücretsiz VIP Kampanyası
      vipTier: 'patron',
      vipPlan: '14_gun_deneme',
      vipUntil: isDemo ? '2099-01-01T00:00:00.000Z' : trialExpiry,
      vipExpiresAt: isDemo ? '2099-01-01T00:00:00.000Z' : trialExpiry,
    },
    customers: [],
    transactions: [],
    reminderLogs: [],
    dailyClosings: [],
    products: [],
    stockMovements: [],
    appointments: [],
    tables: [],
    repairTickets: [],
    suppliers: [],
    services: [],
    cases: [],
    custody: [],
    menuItems: [],
    // Sadece demo modunda örnek personeller ve hizmetler gelsin, gerçek kullanıcıda boş gelsin!
    barberStaff: isDemo ? demoBarberStaff : [],
    barberServices: isDemo ? demoBarberServices : [],
    barberTimeBlocks: [],
    customerPackages: [],
    barberReviews: isDemo ? demoBarberReviews : [],
    barberSettings: {
      ...defaultBarberSettings,
      slug: storeSlug,
    },
    businessDate: localDay(),
    lastUpdated: new Date().toISOString(),
  };
}

const shopStateCache = new Map<string, AppState>();

function shopStateFile(accountId: string): string {
  return path.join(SHOPS_DIR, accountId + '.json');
}

export function loadShopState(accountId: string): AppState {
  const cached = shopStateCache.get(accountId);
  if (cached) return cached;
  let st: AppState | null = null;
  const file = shopStateFile(accountId);
  st = readJsonFile<AppState | null>(file, null);

  const acc = findAccountById(accountId);
  const isDemoAccount = acc
    ? (acc.id === 'acc_demo_dukkan' || acc.phone === '05900000011' || acc.phone === '05550000000' || acc.id === 'demo')
    : accountId === 'acc_demo_dukkan';

  if (!st || !Array.isArray(st.customers) || !Array.isArray(st.transactions)) {
    st = emptyState(acc ? { storeName: acc.shopName, ownerName: acc.ownerName, phone: acc.phone, isDemo: isDemoAccount } : undefined);
    writeJsonFile(file, st);
  }
  if (!st) st = emptyState({ storeName: acc?.shopName || '', ownerName: acc?.ownerName || '', phone: acc?.phone || '', isDemo: isDemoAccount });
  if (!st.shopProfile) st.shopProfile = emptyState().shopProfile;
  
  // Her işletme için benzersiz slug garantisi
  if (isDemoAccount) {
    st.shopProfile.slug = 'demo';
  } else if (!st.shopProfile.slug) {
    const rawSlug = slugify(st.shopProfile.storeName || acc?.shopName || 'dukkan');
    st.shopProfile.slug = rawSlug ? `${rawSlug}-${accountId.slice(0, 4)}` : accountId;
  }

  if (!Array.isArray(st.dailyClosings)) st.dailyClosings = [];
  if (!Array.isArray(st.products)) st.products = [];
  if (!Array.isArray(st.stockMovements)) st.stockMovements = [];
  if (!Array.isArray(st.appointments)) st.appointments = [];
  if (!Array.isArray(st.tables)) st.tables = [];
  if (!Array.isArray(st.repairTickets)) st.repairTickets = [];
  if (!Array.isArray((st as any).suppliers)) (st as any).suppliers = [];
  if (!Array.isArray((st as any).services)) (st as any).services = [];
  if (!Array.isArray((st as any).cases)) (st as any).cases = [];
  if (!Array.isArray((st as any).custody)) (st as any).custody = [];
  if (!Array.isArray((st as any).menuItems)) (st as any).menuItems = [];
  
  // Sadece demo hesabında dizi boşsa demo verilerini yükle, gerçek hesapta kullanıcı kendi ekler!
  if (!Array.isArray((st as any).barberStaff) || (isDemoAccount && (st as any).barberStaff.length === 0)) {
    (st as any).barberStaff = isDemoAccount ? demoBarberStaff : [];
  }
  if (!Array.isArray((st as any).barberServices) || (isDemoAccount && (st as any).barberServices.length === 0)) {
    (st as any).barberServices = isDemoAccount ? demoBarberServices : [];
  }
  if (!Array.isArray((st as any).barberTimeBlocks)) (st as any).barberTimeBlocks = [];
  if (!Array.isArray((st as any).customerPackages)) (st as any).customerPackages = [];
  if (!st.barberSettings) {
    st.barberSettings = {
      ...defaultBarberSettings,
      slug: st.shopProfile.slug,
    };
  } else if (!st.barberSettings.slug) {
    st.barberSettings.slug = st.shopProfile.slug;
  }

  if (typeof st.businessDate !== 'string' || !st.businessDate) st.businessDate = localDay();
  if (!Array.isArray(st.reminderLogs)) st.reminderLogs = [];
  shopStateCache.set(accountId, st);
  return st;
}

export function persistShopState(accountId: string, st: AppState): void {
  st.lastUpdated = new Date().toISOString();
  writeJsonFile(shopStateFile(accountId), st);
}

export function setShopState(accountId: string, st: AppState): void {
  shopStateCache.set(accountId, st);
  persistShopState(accountId, st);
}

export function isSlugTaken(slug: string, excludeAccountId?: string): boolean {
  const clean = slugify(slug);
  if (!clean) return true;
  if (clean === 'demo' && excludeAccountId !== 'acc_demo_dukkan') return true;
  const owners = getAccounts().filter((a) => (a.role || 'owner') === 'owner');
  for (const acc of owners) {
    if (excludeAccountId && acc.id === excludeAccountId) continue;
    const st = loadShopState(acc.id);
    const existingSlug = st.shopProfile?.slug || slugify(st.shopProfile?.storeName || acc.shopName);
    if (existingSlug === clean) return true;
  }
  return false;
}
