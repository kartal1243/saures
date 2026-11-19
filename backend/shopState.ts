import path from 'path';
import { SHOPS_DIR } from './config';
import { localDay } from './day';
import { readJsonFile, writeJsonFile } from './fsdb';
import { findAccountById, getAccounts } from './accounts';
import { loadFirebaseServiceAccount, syncShopSnapshotToFirestore } from './services/firebaseService';
import type { AppState, BarberSalonSettings, BarberStaff, BarberService } from '../shared/types';

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

// Boş state — GERÇEK HESAPLAR İÇİN demo/seed veri YOKTUR, tertemiz başlar!
export function emptyState(seed?: { storeName: string; ownerName: string; phone: string }): AppState {
  const storeSlug = seed?.storeName ? slugify(seed.storeName) : 'yeni-dukkan';

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
      onboardingCompleted: false,
      isVip: true, // 14 Gün Ücretsiz VIP Kampanyası
      vipTier: 'patron',
      vipPlan: '14_gun_deneme',
      vipUntil: trialExpiry,
      vipExpiresAt: trialExpiry,
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
    maintenanceAssets: [],
    suppliers: [],
    services: [],
    cases: [],
    custody: [],
    menuItems: [],
    barberStaff: [],
    barberServices: [],
    barberTimeBlocks: [],
    customerPackages: [],
    barberReviews: [],
    staffCommissionPayouts: [],
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
  const safeId = String(accountId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(SHOPS_DIR, safeId + '.json');
}

export function loadShopState(accountId: string): AppState {
  const cached = shopStateCache.get(accountId);
  if (cached) return cached;
  let st: AppState | null = null;
  const file = shopStateFile(accountId);
  st = readJsonFile<AppState | null>(file, null);

  const acc = findAccountById(accountId);

  if (!st || !Array.isArray(st.customers) || !Array.isArray(st.transactions)) {
    st = emptyState(acc ? { storeName: acc.shopName, ownerName: acc.ownerName, phone: acc.phone } : undefined);
    writeJsonFile(file, st);
  }
  if (!st) st = emptyState({ storeName: acc?.shopName || '', ownerName: acc?.ownerName || '', phone: acc?.phone || '' });
  if (!st.shopProfile) st.shopProfile = emptyState().shopProfile;
  
  // Her işletme için benzersiz slug garantisi
  if (!st.shopProfile.slug) {
    st.shopProfile.slug = allocateUniqueSlug(
      st.shopProfile.storeName || acc?.shopName || 'dukkan',
      accountId
    );
    if (st.barberSettings) {
      st.barberSettings.slug = st.shopProfile.slug;
    }
  }

  if (!Array.isArray(st.dailyClosings)) st.dailyClosings = [];
  if (!Array.isArray(st.products)) st.products = [];
  if (!Array.isArray(st.stockMovements)) st.stockMovements = [];
  if (!Array.isArray(st.appointments)) st.appointments = [];
  if (!Array.isArray(st.tables)) st.tables = [];
  if (!Array.isArray(st.repairTickets)) st.repairTickets = [];
  if (!Array.isArray(st.maintenanceAssets)) st.maintenanceAssets = [];
  if (!Array.isArray((st as any).suppliers)) (st as any).suppliers = [];
  if (!Array.isArray((st as any).services)) (st as any).services = [];
  if (!Array.isArray((st as any).cases)) (st as any).cases = [];
  if (!Array.isArray((st as any).custody)) (st as any).custody = [];
  if (!Array.isArray((st as any).menuItems)) (st as any).menuItems = [];
  if (!Array.isArray((st as any).barberStaff)) {
    (st as any).barberStaff = [];
  }
  if (!Array.isArray((st as any).barberServices)) {
    (st as any).barberServices = [];
  }
  if (!Array.isArray((st as any).barberTimeBlocks)) (st as any).barberTimeBlocks = [];
  if (!Array.isArray((st as any).customerPackages)) (st as any).customerPackages = [];
  if (!Array.isArray((st as any).staffCommissionPayouts)) (st as any).staffCommissionPayouts = [];
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

const firestoreSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleFirestoreShopSync(accountId: string): void {
  if (!accountId || process.env.NODE_ENV === 'test') return;
  if (!loadFirebaseServiceAccount()) return;

  const existing = firestoreSyncTimers.get(accountId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    firestoreSyncTimers.delete(accountId);
    const latestState = shopStateCache.get(accountId);
    if (!latestState) return;
    syncShopSnapshotToFirestore(accountId, latestState).catch((err) => {
      console.warn(`[FirestoreSync] Dükkan (${accountId}) eşleme atlandı:`, err?.message || err);
    });
  }, 5000);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }
  firestoreSyncTimers.set(accountId, timer);
}

export function persistShopState(accountId: string, st: AppState): void {
  st.lastUpdated = new Date().toISOString();
  writeJsonFile(shopStateFile(accountId), st);
  scheduleFirestoreShopSync(accountId);
}

export function setShopState(accountId: string, st: AppState): void {
  shopStateCache.set(accountId, st);
  persistShopState(accountId, st);
}

export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'assets',
  'panel',
  'giris',
  'kayit',
  'fiyat',
  'demo',
  'gizlilik',
  'kullanim-kosullari',
  'randevu',
  'menu',
  'berber',
  'kafe-restoran',
  'bakkal-market',
  'teknik-servis',
  'hukuk',
  'terzi',
  'guzellik-salonu',
  'health',
  'webhook',
  'static',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slugify(slug));
}

export function isSlugTaken(slug: string, excludeAccountId?: string): boolean {
  const clean = slugify(slug);
  if (!clean) return true;
  if (isReservedSlug(clean)) return true;
  const owners = getAccounts().filter((a) => (a.role || 'owner') === 'owner');
  for (const acc of owners) {
    if (excludeAccountId && acc.id === excludeAccountId) continue;
    const st = shopStateCache.get(acc.id) ?? readJsonFile<AppState | null>(shopStateFile(acc.id), null);
    const existingSlug = st?.shopProfile?.slug || slugify(st?.shopProfile?.storeName || acc.shopName);
    if (existingSlug === clean) return true;
  }
  return false;
}

/**
 * İstenilen işletme/dükkan adından benzersiz bir URL slug üretir.
 * Çakışma veya ayrılmış kelime varsa sırayla `-salon`, `-2`, `-3`... soneklerini dener.
 */
export function allocateUniqueSlug(desiredText: string, excludeAccountId?: string): string {
  const base = slugify(desiredText || '') || 'dukkan';
  if (!isReservedSlug(base) && !isSlugTaken(base, excludeAccountId)) {
    return base;
  }

  const prefix = base.slice(0, 42).replace(/-+$/, '') || 'dukkan';
  const salonCandidate = `${prefix}-salon`;
  if (!isReservedSlug(salonCandidate) && !isSlugTaken(salonCandidate, excludeAccountId)) {
    return salonCandidate;
  }

  let counter = 2;
  while (counter < 10000) {
    const candidate = `${prefix}-${counter}`;
    if (!isReservedSlug(candidate) && !isSlugTaken(candidate, excludeAccountId)) {
      return candidate;
    }
    counter++;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

/**
 * İsteğe bağlı Google Maps konum bağlantısını doğrular ve güvenli http(s) URL döndürür.
 */
export function sanitizeGoogleMapsUrl(raw: unknown): string {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed) return '';
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProto);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return withProto.slice(0, 500);
  } catch {
    return '';
  }
}
