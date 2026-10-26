import path from 'path';
import { SHOPS_DIR } from './config';
import { localDay } from './day';
import { readJsonFile, writeJsonFile } from './fsdb';
import { findAccountById } from './accounts';
import type { AppState, BarberSalonSettings, BarberStaff, BarberService } from '../shared/types';

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
};

export const defaultBarberStaff: BarberStaff[] = [
  {
    id: 'staff-1',
    name: 'Ahmet Usta (Baş Kuaför)',
    phone: '5551112233',
    role: 'master',
    skills: ['Saç Kesimi', 'Sakal Tıraşı', 'Saç & Sakal Kombin', 'VIP Damat Paketi'],
    offDays: [0], // Pazar
    workingHours: { start: '09:00', end: '20:30' },
    active: true,
    color: '#3b82f6',
  },
  {
    id: 'staff-2',
    name: 'Mehmet Usta',
    phone: '5552223344',
    role: 'stylist',
    skills: ['Saç Kesimi', 'Sakal Tıraşı', 'Saç & Sakal Kombin', 'Cilt Maskesi & Buhar'],
    offDays: [0, 1], // Pazar, Pazartesi
    workingHours: { start: '09:30', end: '21:00' },
    active: true,
    color: '#10b981',
  },
  {
    id: 'staff-3',
    name: 'Eren Usta (Cilt & Bakım)',
    phone: '5553334455',
    role: 'specialist',
    skills: ['Cilt Maskesi & Buhar', 'Saç Yıkama & Fön', 'Ağda & Kaş'],
    offDays: [0, 2], // Pazar, Salı
    workingHours: { start: '10:00', end: '19:30' },
    active: true,
    color: '#8b5cf6',
  },
];

export const defaultBarberServices: BarberService[] = [
  {
    id: 'srv-1',
    name: 'Modern Saç Kesimi',
    durationMinutes: 30,
    price: 350,
    category: 'Saç',
    allowedStaffIds: ['staff-1', 'staff-2'],
    isPopular: true,
  },
  {
    id: 'srv-2',
    name: 'Sakal Tıraşı & Şekillendirme',
    durationMinutes: 20,
    price: 200,
    category: 'Sakal',
    allowedStaffIds: ['staff-1', 'staff-2'],
    isPopular: true,
  },
  {
    id: 'srv-3',
    name: 'Saç & Sakal Kombin (Yıkama Dahil)',
    durationMinutes: 45,
    price: 500,
    category: 'Paket',
    allowedStaffIds: ['staff-1', 'staff-2'],
    isPopular: true,
  },
  {
    id: 'srv-4',
    name: 'Cilt Maskesi, Buhar & Peeling',
    durationMinutes: 30,
    price: 300,
    category: 'Bakım',
    allowedStaffIds: ['staff-2', 'staff-3'],
  },
  {
    id: 'srv-5',
    name: 'VIP Damat & Özel Bakım Paketi',
    durationMinutes: 90,
    price: 1500,
    category: 'VIP',
    isBundle: true,
    bundleItemNames: ['Modern Saç Kesimi', 'Sakal Tıraşı & Şekillendirme', 'Cilt Maskesi, Buhar & Peeling'],
    allowedStaffIds: ['staff-1'],
  },
];

// Boş state — demo/seed/fake veri YOK, her yeni dükkan tertemiz başlar
export function emptyState(seed?: { storeName: string; ownerName: string; phone: string }): AppState {
  return {
    storeName: seed?.storeName || 'Yeni Dükkan',
    shopProfile: {
      storeName: seed?.storeName || '',
      ownerName: seed?.ownerName || '',
      businessField: 'Bakkal / Market / Büfe',
      sectorKey: 'bakkal_market',
      employeeCount: '1',
      phone: seed?.phone || '',
      cityDistrict: '',
      dailyTarget: 2500,
      slogan: '',
      isConfigured: false,
      isVip: false,
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
    barberStaff: defaultBarberStaff,
    barberServices: defaultBarberServices,
    barberTimeBlocks: [],
    customerPackages: [],
    barberSettings: defaultBarberSettings,
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
  if (!st || !Array.isArray(st.customers) || !Array.isArray(st.transactions)) {
    const acc = findAccountById(accountId);
    st = emptyState(acc ? { storeName: acc.shopName, ownerName: acc.ownerName, phone: acc.phone } : undefined);
    writeJsonFile(file, st);
  }
  if (!st) st = emptyState();
  if (!st.shopProfile) st.shopProfile = emptyState().shopProfile;
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
  if (!Array.isArray((st as any).barberStaff) || (st as any).barberStaff.length === 0) {
    (st as any).barberStaff = defaultBarberStaff;
  }
  if (!Array.isArray((st as any).barberServices) || (st as any).barberServices.length === 0) {
    (st as any).barberServices = defaultBarberServices;
  }
  if (!Array.isArray((st as any).barberTimeBlocks)) (st as any).barberTimeBlocks = [];
  if (!Array.isArray((st as any).customerPackages)) (st as any).customerPackages = [];
  if (!st.barberSettings) st.barberSettings = defaultBarberSettings;

  if (typeof st.businessDate !== 'string' || !st.businessDate) st.businessDate = localDay();
  if (!Array.isArray(st.reminderLogs)) st.reminderLogs = [];
  shopStateCache.set(accountId, st);
  return st;
}

export function persistShopState(accountId: string, st: AppState): void {
  st.lastUpdated = new Date().toISOString();
  writeJsonFile(shopStateFile(accountId), st);
}
