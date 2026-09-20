export type BusinessType = 'bakkal_market' | 'spor_salonu' | 'ozel_ders' | 'teknik_servis' | 'diger';

export type TransactionType = 'veresiye' | 'tahsilat' | 'gider';

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

export interface AppState {
  storeName: string;
  customers: Customer[];
  transactions: Transaction[];
  reminderLogs: ReminderLog[];
  lastUpdated: string;
}

export type WSEvent =
  | { type: 'INIT'; payload: { customers: Customer[]; transactions: Transaction[]; cash: CashRegister; reminderLogs: ReminderLog[] } }
  | { type: 'TRANSACTION_CREATED'; payload: { transaction: Transaction; customer: Customer; cash: CashRegister } }
  | { type: 'CUSTOMER_UPDATED'; payload: { customer: Customer; cash: CashRegister } }
  | { type: 'CUSTOMER_DELETED'; payload: { customerId: string; cash: CashRegister } }
  | { type: 'REMINDER_SENT'; payload: ReminderLog }
  | { type: 'CASH_UPDATED'; payload: CashRegister };
