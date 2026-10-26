// Dükkânım Yanımda — Evrensel Veri Modeli
// Her sektör (Bakkal, Berber, Restoran, Terzi, Teknik Servis vb.) bu ortak tipleri kullanır.

export type BusinessSector =
  | 'bakkal_market'
  | 'berber_kuafor'
  | 'kafe_restoran'
  | 'giyim_butik'
  | 'teknik_servis'
  | 'manav_kasap'
  | 'kirtasiye'
  | 'aktar_baharat'
  | 'hirdavat'
  | 'diger';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalDebt: number; // Piyasadaki güncel veresiye borcu
  lastPaymentDate?: string;
  notes?: string;
  createdAt: string;
  riskScore?: 'dusuk' | 'orta' | 'yuksek'; // Geri ödeme performansı
}

export type TransactionType = 'veresiye' | 'tahsilat' | 'gider' | 'nakit_satis';
export type PaymentMethod = 'nakit' | 'kart' | 'havale' | 'diger';

export interface Transaction {
  id: string;
  customerId: string; // nakit_satis / gider için boş olabilir
  customerName: string;
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  date: string; // "2026-10-21 14:30"
  dueDate?: string; // Veresiye vade tarihi (opsiyonel)
  createdAt: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  buyPrice: number; // Alış fiyatı (kâr hesabı için)
  sellPrice: number; // Satış fiyatı
  stock: number; // Mevcut stok adedi/kg
  criticalLevel: number; // Kritik stok uyarısı eşiği (örn: 5)
  unit: 'adet' | 'kg' | 'paket' | 'koli' | 'metre' | 'litre';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Sektöre Özel: Restoran & Kafe Masa Modeli
export interface RestaurantTable {
  id: string;
  name: string; // "Masa 1", "Bahçe 3", "Teras 2"
  section: 'Salon' | 'Bahçe' | 'Teras' | 'VIP';
  capacity: number;
  status: 'bos' | 'dolu' | 'hesap_istendi' | 'rezerve';
  activeBillTotal: number;
  openedAt?: string;
  customerName?: string;
  orders: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    time: string;
  }[];
}

// Sektöre Özel: Teknik Servis & Tamir Kayıt Modeli
export interface RepairTicket {
  id: string;
  customerName: string;
  phone: string;
  customerId?: string; // Müşteri Defteri cari bağlantısı (opsiyonel)
  deviceModel: string; // "iPhone 11", "Bosch Matkap", "Arçelik Süpürge"
  issueDesc: string; // "Ekran kırık, şarj almıyor"
  estimatedCost: number;
  advance: number; // Alınan kapora / avans
  status: 'teslim_alindi' | 'parca_bekliyor' | 'tamirde' | 'hazir' | 'teslim_edildi' | 'iade';
  technicianNotes?: string;
  createdAt: string;
  completedAt?: string;
}

// Sektöre Özel: Terzi / Kuru Temizleme Emanet (bırakılan eşya) Takibi
export interface CustodyTicket {
  id: string;
  customerName: string;
  phone: string;
  customerId?: string; // Müşteri Defteri bağlantısı (cari bilgi için)
  itemDesc: string; // Bırakılan eşya: "2 takım elbise, 1 gömlek"
  promisedDate?: string; // Söz verilen tarih (YYYY-MM-DD)
  price: number; // Toplam ücret
  advance: number; // Alınan kapora
  status: 'kabul' | 'islemde' | 'hazir' | 'teslim';
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

// Tedarikçi cari hesabı: dükkanın toptancı/imalatçıya olan borcu
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  balance: number; // >0 = dükkanın tedarikçiye borcu, <0 = tedarikçide avans
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderLog {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  channel: 'whatsapp' | 'sms';
  message: string;
  status: 'gonderildi' | 'hazirlandi' | 'teslim_edildi';
  sentAt: string;
  type: 'veresiye' | 'aidat' | 'bakim' | 'ozel';
}

export interface CashRegister {
  todayCash: number; // Bugün nakit tahsilat
  todayCard: number; // Bugün kart tahsilat
  todayBank: number; // Bugün havale/EFT
  todayTotalIncome: number; // Bugün toplam tahsilat
  todayExpense: number; // Bugün toplam kasa çıkışı
  netTodayCash: number; // Bugün net nakit (çekmecedeki)
  inPocketToday: number; // Cepte kalan = nakit + POS - gider (havale hariç)
  totalReceivables: number; // Toplam piyasada bekleyen veresiye alacağı
  overdueCount: number; // Günü geçen ödeme sayısı
  dueTodayCount: number; // Bugün günü gelen ödeme sayısı
}

export interface ShopProfile {
  storeName: string;
  ownerName: string;
  businessField: string; // e.g. "Bakkal / Market", "Kuaför / Berber", "Kafe / Restoran", etc.
  sectorKey?: BusinessSector;
  employeeCount: string; // "1" | "2-3" | "4-5" | "6+"
  phone: string;
  cityDistrict: string;
  dailyTarget: number;
  slogan: string;
  isConfigured: boolean;
  isVip?: boolean;
  vipExpiresAt?: string;
  iban?: string;
  receiptFooter?: string;
  slug?: string;
}

export interface DailyClosing {
  date: string;
  closedAt: string;
  cashIncome: number;
  cardIncome: number;
  bankIncome: number;
  totalIncome: number;
  totalExpense: number;
  netCash: number;
  totalReceivablesSnapshot: number;
  closedBy: string;
  note?: string;
}

// Sektöre Özel: Oto Yıkama / Halı Yıkama / Temizlik Hizmet Listesi
export interface ServiceItem {
  id: string;
  name: string; // "İç-Dış Detaylı Yıkama", "Motor Yıkama", "6m² Makine Halısı"
  price: number;
  category?: string;
  durationMinutes?: number;
  description?: string;
  createdAt: string;
}

// Dava / İcra Takip Dosyası (Hukuk Büroları için)
export interface LegalCase {
  id: string;
  caseNumber: string; // "2024/142 E."
  court: string; // "İstanbul 3. Asliye Ticaret"
  clientName: string;
  opposingParty: string;
  caseType: 'dava' | 'icra' | 'arabuluculuk' | 'danismanlik';
  status: 'derdest' | 'karara_cikti' | 'istinafta' | 'kapandi';
  nextHearingDate?: string; // YYYY-MM-DD
  totalFee: number;
  paidFee: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'giris' | 'cikis';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
}

// Sektöre Özel: Berber / Kuaför Randevu & Koltuk & Ekip Modeli
export type AppointmentStatus =
  | 'bekliyor'
  | 'onayli'
  | 'koltukta'
  | 'tamamlandi'
  | 'gelmedi'
  | 'iptal'
  | 'arsiv';

export interface BarberStaff {
  id: string;
  name: string;
  title?: string; // 'Baş Usta', 'Kuaför', 'Cilt & Bakım Uzmanı', 'Kalfa'
  role?: string; // 'master' | 'stylist' | 'apprentice' | 'specialist' | 'Usta' | 'Kalfa' | 'Çırak'
  phone?: string;
  email?: string;
  password?: string;
  commissionRate?: number; // Prim oranı (%)
  offDays: number[]; // 0: Pazar, 1: Pazartesi, ... 6: Cumartesi
  workStart?: string; // "09:00"
  workEnd?: string; // "20:00"
  workingHours?: { start: string; end: string };
  skills: string[]; // Hizmet adları (örn: 'Saç Kesimi', 'Sakal Tıraşı', 'Manikür', 'Cilt Bakımı')
  customPricing?: Record<string, { price: number; duration: number }>;
  color?: string; // Takvimde usta rengi (#3b82f6, #10b981 vb.)
  avatar?: string;
  active?: boolean;
}

export interface BarberService {
  id: string;
  name: string;
  duration?: number; // dakika
  durationMinutes?: number; // dakika
  price: number;
  category: string; // 'Saç', 'Sakal', 'Cilt & Bakım', 'Paketler', 'Çocuk'
  isBundle?: boolean;
  bundleItems?: string[];
  bundleItemNames?: string[];
  allowedStaffIds?: string[]; // Boş ise herkes yapabilir
  description?: string;
  isPopular?: boolean;
}

export interface BarberTimeBlock {
  id: string;
  staffId: string; // Usta ID veya 'all'
  staffName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "14:00"
  endTime: string; // "15:30"
  reason: string; // "Öğle Molası", "Malzeme Alımı", "Eğitim"
  fullDay?: boolean;
  createdAt?: string;
}

export interface CustomerPackage {
  id: string;
  customerId?: string;
  customerName: string;
  phone: string;
  packageName?: string;
  serviceName: string;
  totalSessions: number;
  remainingSessions: number;
  price?: number;
  staffName?: string;
  notes?: string;
  expiryDate?: string;
  createdAt: string;
}

export interface BarberSalonSettings {
  slotIntervalMinutes?: number;
  slotDuration?: number; // 15, 30 dk
  openingTime?: string; // "09:00"
  closingTime?: string; // "21:00"
  openHour?: string; // "09:00"
  closeHour?: string; // "21:00"
  closedDays: number[]; // [0] -> Pazar kapalı
  closedReason?: string; // "Pazar Günleri Salon Kapalı"
  bookingLeadDays?: number; // Kaç gün önceden randevu alınabilir (varsayılan: 14)
  autoAssignStrategy?: 'least_busy' | 'first_available' | 'round_robin';
  requireOtp?: boolean;
  enableWhatsAppReminders?: boolean;
  allowCancellationHoursBefore?: number;
  slug?: string;
  autoConfirm?: boolean;
  notes?: string;
}

export interface AppointmentStep {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  price: number;
}

export interface Appointment {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  staffName: string; // Koltuk / Usta
  staffId?: string;
  serviceName: string; // Saç, Sakal, Damat Tıraşı vb.
  serviceIds?: string[];
  price: number;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // "14:30"
  duration?: number; // dakika
  durationMinutes?: number; // dakika
  status: AppointmentStatus;
  notes?: string;
  isOnlineBooking?: boolean;
  kvkkApproved?: boolean;
  allowWhatsApp?: boolean;
  steps?: AppointmentStep[];
  packageSession?: {
    packageId: string;
    sessionIndex: number;
    totalSessions: number;
  };
  recurring?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    count: number;
    parentAptId?: string;
  };
  createdAt: string;
}

// Sektöre Özel: Restoran & Kafe Fotoğraflı Menü Modeli
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  prepTimeMinutes?: number;
}

// Kapsamlı Uygulama State'i
export interface AppState {
  storeName: string;
  shopProfile: ShopProfile;
  customers: Customer[];
  transactions: Transaction[];
  reminderLogs: ReminderLog[];
  dailyClosings: DailyClosing[];
  products: Product[];
  stockMovements: StockMovement[];
  appointments: Appointment[];
  tables: RestaurantTable[];
  repairTickets: RepairTicket[];
  suppliers: Supplier[];
  services: ServiceItem[];
  cases: LegalCase[];
  custody: CustodyTicket[];
  menuItems: MenuItem[];
  barberStaff?: BarberStaff[];
  barberServices?: BarberService[];
  barberTimeBlocks?: BarberTimeBlock[];
  customerPackages?: CustomerPackage[];
  barberSettings?: BarberSalonSettings;
  businessDate: string; // YYYY-MM-DD
  lastUpdated: string;
}

// Realtime WebSocket Event Tipleri
export type WSEvent =
  | { type: 'INIT_STATE'; payload: AppState }
  | { type: 'CUSTOMER_CREATED'; payload: Customer }
  | { type: 'CUSTOMER_UPDATED'; payload: Customer }
  | { type: 'CUSTOMER_DELETED'; payload: { id: string } }
  | { type: 'TRANSACTION_CREATED'; payload: { transaction: Transaction; cash: CashRegister } }
  | { type: 'TRANSACTION_DELETED'; payload: { id: string; customerId?: string } }
  | { type: 'CLOSING_COMPLETED'; payload: { closing: DailyClosing; state: AppState } }
  | { type: 'PROFILE_UPDATED'; payload: ShopProfile }
  | { type: 'STATE_RESET'; payload: AppState }
  | { type: 'STOCK_MOVEMENT_CREATED'; payload: StockMovement }
  | { type: 'APPOINTMENT_UPDATED'; payload: Appointment }
  | { type: 'APPOINTMENT_DELETED'; payload: { id: string } }
  | { type: 'TABLE_UPDATED'; payload: RestaurantTable }
  | { type: 'REPAIR_UPDATED'; payload: RepairTicket }
  | { type: 'SUPPLIER_UPDATED'; payload: Supplier }
  | { type: 'SERVICE_UPDATED'; payload: ServiceItem }
  | { type: 'CASE_UPDATED'; payload: LegalCase }
  | { type: 'CUSTODY_UPDATED'; payload: CustodyTicket }
  | { type: 'MENU_ITEM_UPDATED'; payload: MenuItem }
  | { type: 'MENU_ITEM_DELETED'; payload: { id: string } };
