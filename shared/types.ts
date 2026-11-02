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
  | 'avukat_danisman'
  | 'terzi_kurutemizleme'
  | 'diger_esnaf'
  | 'diger';

export type BusinessType =
  | 'bakkal_market'
  | 'berber_kuafor'
  | 'kafe_restoran'
  | 'giyim_butik'
  | 'teknik_servis'
  | 'avukat_danisman'
  | 'terzi_kurutemizleme'
  | 'oto_servis'
  | 'spor_salonu'
  | 'apartman_yonetimi'
  | 'kres_kurs'
  | 'ozel_egitim'
  | 'genel_esnaf'
  | 'diger_esnaf'
  | 'diger'
  | string;

export type SubscriptionInterval = 'aylik' | 'haftalik' | '3_aylik' | 'yillik' | 'periyodik_bakim';

export interface SubscriptionPlan {
  enabled: boolean;
  active?: boolean;
  title: string;
  amount: number;
  interval: SubscriptionInterval;
  nextDueDate: string; // YYYY-MM-DD
  description?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // Güncel veresiye borcu / bakiye
  totalDebt?: number;
  businessCategory: BusinessType;
  subscriptionPlan?: SubscriptionPlan;
  lastPaymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  riskScore?: 'dusuk' | 'orta' | 'yuksek';
}

export type TransactionType = 'veresiye' | 'tahsilat' | 'gider' | 'masraf';
export type PaymentMethod = 'nakit' | 'kart' | 'havale' | 'veresiye' | 'diger';

export interface Transaction {
  id: string;
  customerId: string; // nakit_satis / gider için boş olabilir
  customerName: string;
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  category?: string;
  date: string; // "2026-10-21 14:30"
  dueDate?: string; // Veresiye vade tarihi (opsiyonel)
  createdAt: string;
}

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  category?: string;
  buyPrice?: number;
  sellPrice?: number;
  purchasePrice?: number;
  salePrice?: number;
  stock?: number;
  currentStock: number;
  criticalLevel?: number;
  criticalThreshold: number;
  unit: 'adet' | 'kg' | 'paket' | 'koli' | 'metre' | 'litre' | 'Adet' | 'Kg' | 'Koli' | 'Paket' | 'Litre' | string;
  notes?: string;
  createdAt?: string;
  updatedAt: string;
}

export interface TableOrderItem {
  id: string;
  name: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  price?: number;
  total: number;
  time?: string;
}

// Sektöre Özel: Restoran & Kafe Masa Modeli
export interface RestaurantTable {
  id: string;
  name: string; // "Masa 1", "Bahçe 3", "Teras 2"
  section?: 'Salon' | 'Bahçe' | 'Teras' | 'VIP' | string;
  capacity?: number;
  status?: 'bos' | 'dolu' | 'hesap_istendi' | 'rezerve';
  isOccupied: boolean;
  totalAmount: number;
  activeBillTotal?: number;
  openedAt?: string;
  guestCount?: number;
  note?: string;
  activeCall?: 'waiter' | 'bill' | null;
  customerName?: string;
  orders: TableOrderItem[];
}

// Sektöre Özel: Teknik Servis & Tamir Kayıt Modeli
export type RepairStatus =
  | 'kabul_edildi'
  | 'parca_bekleniyor'
  | 'tamirde'
  | 'teslime_hazir'
  | 'teslim_edildi';

export interface RepairTicket {
  id: string;
  customerName: string;
  phone: string;
  customerId?: string;
  deviceOrVehicle: string;
  deviceModel?: string;
  complaint: string;
  issueDesc?: string;
  estimatedCost: number;
  partCost: number;
  advance?: number;
  status: RepairStatus;
  notes?: string;
  technicianNotes?: string;
  createdAt: string;
  completedAt?: string;
}

// Sektöre Özel: Terzi / Kuru Temizleme Emanet (bırakılan eşya) Takibi
export interface CustodyTicket {
  id: string;
  customerName: string;
  phone: string;
  customerId?: string;
  itemDesc: string;
  promisedDate?: string;
  price: number;
  advance: number;
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
  todayCash: number;
  todayCard: number;
  todayBank: number;
  todayTotalIncome: number;
  todayExpense: number;
  netTodayCash: number;
  inPocketToday: number;
  totalReceivables: number;
  overdueCount: number;
  dueTodayCount: number;
}

export interface ShopProfile {
  storeName: string;
  ownerName: string;
  businessField: string;
  sectorKey?: BusinessSector;
  employeeCount: string;
  phone: string;
  cityDistrict: string;
  dailyTarget: number;
  slogan?: string;
  isConfigured: boolean;
  isVip?: boolean;
  vipTier?: 'cirak' | 'usta' | 'patron';
  vipExpiresAt?: string;
  vipUntil?: string;
  vipPlan?: 'monthly' | 'yearly' | 'lifetime' | 'patron' | 'usta' | '14_gun_deneme' | 'deneme_14_gun';
  iban?: string;
  receiptFooter?: string;
  slug?: string;
  aiOcrScansUsed?: number;
}

export interface DailyClosing {
  id: string;
  date: string;
  closedAt: string;
  cashIncome?: number;
  cardIncome?: number;
  bankIncome?: number;
  totalIncome?: number;
  totalExpense?: number;
  netCash?: number;
  totalReceivablesSnapshot?: number;
  closedBy?: string;
  note?: string;
  notes?: string;
  todayCash: number;
  todayCard: number;
  todayBank: number;
  todayExpense: number;
  totalIncomeToday: number;
  netProfitToday: number;
  expectedCash: number;
  actualCashCount: number;
  diffAmount: number;
  expectedCard?: number;
  actualCardCount?: number;
  cardDiff?: number;
  expectedBank?: number;
  actualBankCount?: number;
  bankDiff?: number;
  expectedTotalIncome?: number;
  actualTotalIncome?: number;
  totalDiff?: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  durationMinutes?: number;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Hearing {
  id: string;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface CaseFile {
  id: string;
  fileNo: string;
  clientName: string;
  customerId?: string;
  court?: string;
  hearingDate?: string;
  consultancyHours?: number;
  hourlyRate?: number;
  status: 'acik' | 'kapali';
  notes?: string;
  hearings?: Hearing[];
  createdAt: string;
  updatedAt: string;
}

export type LegalCase = CaseFile;

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'giris' | 'cikis';
  quantity: number;
  previousStock?: number;
  newStock?: number;
  reason?: string;
  note?: string;
  date: string;
  createdAt?: string;
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
  title?: string;
  role?: string;
  phone?: string;
  email?: string;
  password?: string;
  commissionRate?: number;
  offDays: number[];
  workStart?: string;
  workEnd?: string;
  workingHours?: { start: string; end: string };
  skills: string[];
  customPricing?: Record<string, { price: number; duration: number }>;
  color?: string;
  avatar?: string;
  active?: boolean;
}

export interface BarberService {
  id: string;
  name: string;
  duration?: number;
  durationMinutes?: number;
  price: number;
  category: string;
  isBundle?: boolean;
  bundleItems?: string[];
  bundleItemNames?: string[];
  allowedStaffIds?: string[];
  description?: string;
  isPopular?: boolean;
}

export interface BarberTimeBlock {
  id: string;
  staffId: string;
  staffName?: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
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
  slotDuration?: number;
  openingTime?: string;
  closingTime?: string;
  openHour?: string;
  closeHour?: string;
  closedDays: number[];
  closedReason?: string;
  bookingLeadDays?: number;
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
  staffName: string;
  staffId?: string;
  serviceName: string;
  serviceIds?: string[];
  price: number;
  appointmentDate: string;
  timeSlot: string;
  duration?: number;
  durationMinutes?: number;
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
  cases: CaseFile[];
  custody: CustodyTicket[];
  menuItems?: MenuItem[];
  barberStaff?: BarberStaff[];
  barberServices?: BarberService[];
  barberTimeBlocks?: BarberTimeBlock[];
  customerPackages?: CustomerPackage[];
  barberSettings?: BarberSalonSettings;
  businessDate: string;
  lastUpdated: string;
}

export type WSEvent =
  | { type: 'INIT'; payload: any }
  | { type: 'INIT_STATE'; payload: AppState }
  | { type: 'CUSTOMER_CREATED'; payload: Customer }
  | { type: 'CUSTOMER_UPDATED'; payload: { customer: Customer; cash: CashRegister } }
  | { type: 'CUSTOMER_DELETED'; payload: { customerId: string; cash: CashRegister } }
  | { type: 'TRANSACTION_CREATED'; payload: { transaction: Transaction; customer?: Customer; cash: CashRegister } }
  | { type: 'TRANSACTION_DELETED'; payload: { id: string; customerId?: string } }
  | { type: 'DAILY_CLOSING_CREATED'; payload: DailyClosing }
  | { type: 'CLOSING_COMPLETED'; payload: { closing: DailyClosing; state: AppState } }
  | { type: 'CASH_UPDATED'; payload: CashRegister }
  | { type: 'REMINDER_SENT'; payload: ReminderLog }
  | { type: 'PROFILE_UPDATED'; payload: ShopProfile }
  | { type: 'SHOP_PROFILE_UPDATED'; payload: ShopProfile }
  | { type: 'STATE_RESET'; payload: AppState }
  | { type: 'PRODUCT_UPDATED'; payload: Product }
  | { type: 'PRODUCT_DELETED'; payload: { productId: string } }
  | { type: 'STOCK_MOVEMENT_CREATED'; payload: { movement: StockMovement; product: Product } }
  | { type: 'APPOINTMENT_UPDATED'; payload: Appointment }
  | { type: 'APPOINTMENT_DELETED'; payload: { id: string } }
  | { type: 'TABLE_UPDATED'; payload: RestaurantTable }
  | { type: 'TABLE_DELETED'; payload: { id: string } }
  | { type: 'TABLE_CALL'; payload: { id?: string; tableNo?: string; tableName?: string; tableId?: string; action: string; time?: string; createdAt?: string } }
  | { type: 'TABLE_CALL_ALERT'; payload: { tableNo: string; tableId?: string; action: string; time: string } }
  | { type: 'REPAIR_UPDATED'; payload: RepairTicket }
  | { type: 'REPAIR_TICKET_UPDATED'; payload: RepairTicket }
  | { type: 'REPAIR_TICKET_DELETED'; payload: { id: string } }
  | { type: 'SUPPLIER_UPDATED'; payload: Supplier }
  | { type: 'SUPPLIER_DELETED'; payload: { id: string } }
  | { type: 'SERVICE_UPDATED'; payload: ServiceItem }
  | { type: 'SERVICE_DELETED'; payload: { id: string } }
  | { type: 'CASE_UPDATED'; payload: CaseFile }
  | { type: 'CASE_UPSERTED'; payload: CaseFile }
  | { type: 'CASE_DELETED'; payload: { id: string } }
  | { type: 'CUSTODY_UPDATED'; payload: CustodyTicket }
  | { type: 'CUSTODY_DELETED'; payload: { id: string } }
  | { type: 'MENU_ITEM_UPDATED'; payload: MenuItem }
  | { type: 'MENU_ITEM_DELETED'; payload: { id: string } }
  | { type: 'MENU_UPDATED'; payload: MenuItem[] };
