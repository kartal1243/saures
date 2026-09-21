export type BusinessType = 'bakkal_market' | 'spor_salonu' | 'ozel_ders' | 'teknik_servis' | 'diger';

export type TransactionType = 'veresiye' | 'tahsilat' | 'gider' | 'masraf';

export type PaymentMethod = 'nakit' | 'kart' | 'havale' | 'veresiye';

export type SubscriptionInterval = 'none' | 'aylik' | 'haftalik' | '3_aylik' | 'yillik' | 'periyodik_bakim';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  businessCategory: BusinessType;
  balance: number; // Positive = customer owes money (alacak/veresiye), Negative = customer has credit
  notes?: string;
  subscriptionPlan?: {
    enabled: boolean;
    interval: SubscriptionInterval;
    amount: number;
    nextDueDate: string; // YYYY-MM-DD
    title: string; // e.g. "Aylık Fitness Üyeliği" or "Kombi Bakım Periyodu"
  };
  createdAt: string;
  updatedAt: string;
  lastPaymentDate?: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  date: string; // ISO string or YYYY-MM-DD HH:mm
  createdAt: string;
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
  netTodayCash: number; // Bugün net nakit
  totalReceivables: number; // Toplam piyasada bekleyen veresiye alacağı
  overdueCount: number; // Günü geçen ödeme sayısı
  dueTodayCount: number; // Bugün günü gelen ödeme sayısı
}

export interface ShopProfile {
  storeName: string;
  ownerName: string;
  businessField: string; // e.g. "Bakkal / Market", "Kuaför / Berber", "Kafe / Restoran", etc.
  employeeCount: string; // "1" | "2-3" | "4-5" | "6+"
  phone: string;
  cityDistrict: string;
  dailyTarget: number;
  slogan?: string;
  isConfigured: boolean;
  isVip: boolean;
}

export interface DailyClosing {
  id: string;
  date: string; // YYYY-MM-DD
  closedAt: string; // ISO string
  expectedCash: number;
  actualCashCount: number;
  diffAmount: number; // actualCashCount - expectedCash (0: exact, >0: surplus, <0: deficit)
  totalIncomeToday: number;
  todayCash: number;
  todayCard: number;
  todayBank: number;
  todayExpense: number;
  netProfitToday: number;
  note?: string;
  closedBy?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  criticalThreshold: number;
  purchasePrice?: number;
  salePrice?: number;
  barcode?: string;
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

export interface AppState {
  storeName: string;
  shopProfile?: ShopProfile;
  dailyClosings?: DailyClosing[];
  customers: Customer[];
  transactions: Transaction[];
  reminderLogs: ReminderLog[];
  products?: Product[];
  stockMovements?: StockMovement[];
  lastUpdated: string;
}

export type WSEvent =
  | { type: 'INIT'; payload: { customers: Customer[]; transactions: Transaction[]; cash: CashRegister; reminderLogs: ReminderLog[]; shopProfile?: ShopProfile; dailyClosings?: DailyClosing[]; products?: Product[]; stockMovements?: StockMovement[] } }
  | { type: 'TRANSACTION_CREATED'; payload: { transaction: Transaction; customer: Customer; cash: CashRegister } }
  | { type: 'CUSTOMER_UPDATED'; payload: { customer: Customer; cash: CashRegister } }
  | { type: 'CUSTOMER_DELETED'; payload: { customerId: string; cash: CashRegister } }
  | { type: 'REMINDER_SENT'; payload: ReminderLog }
  | { type: 'CASH_UPDATED'; payload: CashRegister }
  | { type: 'SHOP_PROFILE_UPDATED'; payload: ShopProfile }
  | { type: 'DAILY_CLOSING_CREATED'; payload: DailyClosing }
  | { type: 'PRODUCT_UPDATED'; payload: Product }
  | { type: 'PRODUCT_DELETED'; payload: { productId: string } }
  | { type: 'STOCK_MOVEMENT_CREATED'; payload: { movement: StockMovement; product: Product } };
