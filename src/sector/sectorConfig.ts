// Hangi sektörde hangi modül açık/kapalı + menü sırası + dashboard kartı.
// Yeni sektör eklemek = bu dosyaya 1 blok eklemek. Başka dosyaya dokunulmaz.

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Wallet,
  Users,
  CalendarDays,
  Scissors,
  Armchair,
  Banknote,
  Scale,
  Gavel,
  Timer,
  ShoppingCart,
  Package,
  Bell,
  Wrench,
  ClipboardList,
} from 'lucide-react';
import type { BusinessType } from './businessTypes';

export type ModuleKey =
  | 'dashboard'
  | 'cashflow'
  | 'customers'
  | 'appointments'
  | 'staffSeats'
  | 'commissions'
  | 'cases'
  | 'hearings'
  | 'hourlyBilling'
  | 'pos'
  | 'stock'
  | 'stockAlerts'
  | 'tickets';

export interface NavItem {
  key: ModuleKey;
  label: string;
  path: string;
  icon: LucideIcon;
  /** true = ana menüde değil, "Diğer" grubunda ikincil gösterilir */
  secondary?: boolean;
}

/** Dashboard'daki 2. dev kartın (İş/Stok Durumu) sektöre göre tipi */
export type StatusWidget = 'appointments' | 'hearings' | 'stock' | 'tickets' | 'generic';

export interface SectorConfig {
  key: BusinessType;
  label: string;
  tagline: string;
  modules: Record<ModuleKey, boolean>;
  nav: NavItem[];
  statusWidget: StatusWidget;
  statusLabel: string;
}

const COMMON_MODULES: Record<ModuleKey, boolean> = {
  dashboard: true,
  cashflow: true,
  customers: true,
  appointments: false,
  staffSeats: false,
  commissions: false,
  cases: false,
  hearings: false,
  hourlyBilling: false,
  pos: false,
  stock: false,
  stockAlerts: false,
  tickets: false,
};

const COMMON_NAV: NavItem[] = [
  { key: 'dashboard', label: 'Kar/Zarar Özeti', path: '/', icon: LayoutDashboard },
  { key: 'cashflow', label: 'Gelir/Gider Takibi', path: '/cashflow', icon: Wallet },
  { key: 'customers', label: 'Cari (Müşteri) Kartı', path: '/customers', icon: Users },
];

export const SECTOR_CONFIG: Record<BusinessType, SectorConfig> = {
  barber: {
    key: 'barber',
    label: 'Berber / Güzellik Salonu',
    tagline: 'Randevu, koltuk ve prim odaklı panel',
    modules: { ...COMMON_MODULES, appointments: true, staffSeats: true, commissions: true },
    nav: [
      { key: 'appointments', label: 'Randevu Takvimi', path: '/appointments', icon: CalendarDays },
      { key: 'staffSeats', label: 'Personel / Koltuk Yönetimi', path: '/seats', icon: Armchair },
      { key: 'commissions', label: 'Hizmet Primleri', path: '/commissions', icon: Banknote },
      ...COMMON_NAV,
      { key: 'stock', label: 'Stok', path: '/stock', icon: Package, secondary: true },
    ],
    statusWidget: 'appointments',
    statusLabel: 'Bugünkü Randevu',
  },
  lawyer: {
    key: 'lawyer',
    label: 'Avukat / Danışman',
    tagline: 'Dosya, duruşma ve saatlik ücret odaklı panel',
    modules: { ...COMMON_MODULES, cases: true, hearings: true, hourlyBilling: true },
    nav: [
      { key: 'cases', label: 'Dava / Müvekkil Dosyaları', path: '/cases', icon: Scale },
      { key: 'hearings', label: 'Duruşma Takvimi', path: '/hearings', icon: Gavel },
      { key: 'hourlyBilling', label: 'Saatlik Danışmanlık Ücretleri', path: '/billing', icon: Timer },
      ...COMMON_NAV,
      // Stok bu sektörde tamamen gizli: nav'a eklenmiyor, modules.stock=false
    ],
    statusWidget: 'hearings',
    statusLabel: 'Yaklaşan Duruşma',
  },
  retail: {
    key: 'retail',
    label: 'Market / Perakende',
    tagline: 'POS, stok ve kritik uyarı odaklı panel',
    modules: { ...COMMON_MODULES, pos: true, stock: true, stockAlerts: true },
    nav: [
      { key: 'pos', label: 'Hızlı POS / Barkodlu Satış', path: '/pos', icon: ShoppingCart },
      { key: 'stock', label: 'Stok Yönetimi', path: '/stock', icon: Package },
      { key: 'stockAlerts', label: 'Kritik Stok Uyarısı', path: '/stock/alerts', icon: Bell },
      ...COMMON_NAV,
    ],
    statusWidget: 'stock',
    statusLabel: 'Kritik Stok',
  },
  service: {
    key: 'service',
    label: 'Teknik Servis',
    tagline: 'Fiş, arıza ve parça maliyeti odaklı panel',
    modules: { ...COMMON_MODULES, tickets: true, stock: true },
    nav: [
      { key: 'tickets', label: 'Servis Fişleri', path: '/tickets', icon: Wrench },
      { key: 'stock', label: 'Parça Stoku', path: '/stock', icon: Package },
      ...COMMON_NAV,
      { key: 'appointments', label: 'Teslim Randevuları', path: '/appointments', icon: ClipboardList, secondary: true },
    ],
    statusWidget: 'tickets',
    statusLabel: 'Açık Servis Fişi',
  },
  common: {
    key: 'common',
    label: 'Genel Esnaf',
    tagline: 'Kasa, müşteri ve günlük özet odaklı panel',
    modules: { ...COMMON_MODULES },
    nav: [...COMMON_NAV],
    statusWidget: 'generic',
    statusLabel: 'Günlük Özet',
  },
};

// Mevcut BusinessSector (bakkal_market vb.) -> yeni BusinessType köprüsü.
// Eski kayıtlar bozulmadan taşınır; bilinmeyen değer common'a düşer.
const LEGACY_SECTOR_MAP: Record<string, BusinessType> = {
  berber_kuafor: 'barber',
  kafe_restoran: 'retail',
  bakkal_market: 'retail',
  teknik_servis: 'service',
  avukat_danisman: 'lawyer',
  diger_esnaf: 'common',
};

export function legacySectorToBusinessType(sectorKey?: string): BusinessType {
  if (!sectorKey) return 'common';
  return LEGACY_SECTOR_MAP[sectorKey] ?? 'common';
}

// Profil rozeti için ikon (Header'da kullanılır)
export const SECTOR_ICONS: Record<BusinessType, LucideIcon> = {
  barber: Scissors,
  lawyer: Scale,
  retail: ShoppingCart,
  service: Wrench,
  common: LayoutDashboard,
};
