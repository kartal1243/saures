import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Customer,
  Transaction,
  ReminderLog,
  CashRegister,
  WSEvent,
  TransactionType,
  PaymentMethod,
  ShopProfile,
  DailyClosing,
  Product,
  StockMovement,
} from './types';
import { Header } from './components/Header';
import { RevenueVsExpensesChart } from './components/RevenueVsExpensesChart';
import { CashSummary } from './components/CashSummary';
import { QuickActionBar } from './components/QuickActionBar';
import { UpcomingReminders } from './components/UpcomingReminders';
import { CustomerList } from './components/CustomerList';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { NewCustomerModal } from './components/NewCustomerModal';
import { ShopProfileModal } from './components/ShopProfileModal';
import { MoneyInModal } from './components/MoneyInModal';
import { MoneyOutModal } from './components/MoneyOutModal';
import { DailyClosingModal } from './components/DailyClosingModal';
import { VipAiConsultantModal } from './components/VipAiConsultantModal';
import { StockManagementView } from './components/StockManagementView';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { ProductFormModal } from './components/ProductFormModal';
import { formatCurrency } from './utils/formatters';
import { Activity, Clock, ArrowUpRight, ArrowDownLeft, Banknote, CreditCard, Send, Store, Moon, Crown, CheckCircle2, Package, AlertTriangle } from 'lucide-react';

export default function App() {
  // Dark Mode State with LocalStorage & system preference
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (err) {
      console.error('Error syncing dark mode', err);
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Shop & Core Business States
  const [storeName, setStoreName] = useState('Bereket Mahalle Esnafı');
  const [shopProfile, setShopProfile] = useState<ShopProfile>({
    storeName: 'Bereket Mahalle Esnafı',
    ownerName: 'Ahmet Usta',
    businessField: 'Bakkal / Market / Büfe',
    employeeCount: '1',
    phone: '',
    cityDistrict: '',
    dailyTarget: 3000,
    slogan: 'Mahallenin Güler Yüzlü ve Güvenilir Esnafı',
    isConfigured: false,
    isVip: true,
  });
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>([]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [cash, setCash] = useState<CashRegister>({
    todayCash: 0,
    todayCard: 0,
    todayBank: 0,
    todayTotalIncome: 0,
    todayExpense: 0,
    netTodayCash: 0,
    totalReceivables: 0,
    overdueCount: 0,
    dueTodayCount: 0,
  });
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'customers' | 'stock'>('activity');

  // Stock Management States
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isStockAdjustmentModalOpen, setIsStockAdjustmentModalOpen] = useState(false);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'giris' | 'cikis'>('giris');
  const [isProductFormModalOpen, setIsProductFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const criticalStockCount = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.criticalThreshold).length;
  }, [products]);

  // Modals state
  const [isShopProfileModalOpen, setIsShopProfileModalOpen] = useState(false);
  const [isMoneyInModalOpen, setIsMoneyInModalOpen] = useState(false);
  const [isMoneyOutModalOpen, setIsMoneyOutModalOpen] = useState(false);
  const [isDailyClosingModalOpen, setIsDailyClosingModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);

  // Veresiye / Customers Modals
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>('veresiye');
  const [transactionTargetCustomer, setTransactionTargetCustomer] = useState<Customer | null>(null);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTargetCustomer, setWhatsAppTargetCustomer] = useState<Customer | null>(null);
  const [whatsAppReminderType, setWhatsAppReminderType] = useState<'veresiye' | 'aidat' | 'bakim'>('veresiye');

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Initial HTTP data fetch
  const fetchInitialData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data.storeName) setStoreName(data.storeName);
        if (data.shopProfile) {
          setShopProfile(data.shopProfile);
          // If shop profile has never been configured by user, auto-prompt onboarding modal
          if (!data.shopProfile.isConfigured) {
            setIsShopProfileModalOpen(true);
          }
        }
        if (data.dailyClosings) setDailyClosings(data.dailyClosings);
        if (data.products) setProducts(data.products);
        if (data.stockMovements) setStockMovements(data.stockMovements);
        setCustomers(data.customers || []);
        setTransactions(data.transactions || []);
        setReminderLogs(data.reminderLogs || []);
        if (data.cash) setCash(data.cash);
      }
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  };

  // WebSocket Connection with Auto-reconnect
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const wsEvent: WSEvent = JSON.parse(event.data);
          if (wsEvent.type === 'INIT') {
            setCustomers(wsEvent.payload.customers);
            setTransactions(wsEvent.payload.transactions);
            setCash(wsEvent.payload.cash);
            setReminderLogs(wsEvent.payload.reminderLogs);
            if (wsEvent.payload.products) {
              setProducts(wsEvent.payload.products);
            }
            if (wsEvent.payload.stockMovements) {
              setStockMovements(wsEvent.payload.stockMovements);
            }
            if (wsEvent.payload.shopProfile) {
              setShopProfile(wsEvent.payload.shopProfile);
              setStoreName(wsEvent.payload.shopProfile.storeName);
              if (!wsEvent.payload.shopProfile.isConfigured) {
                setIsShopProfileModalOpen(true);
              }
            }
            if (wsEvent.payload.dailyClosings) {
              setDailyClosings(wsEvent.payload.dailyClosings);
            }
          } else if (wsEvent.type === 'TRANSACTION_CREATED') {
            setTransactions((prev) => [wsEvent.payload.transaction, ...prev]);
            if (wsEvent.payload.customer) {
              setCustomers((prev) =>
                prev.map((c) => (c.id === wsEvent.payload.customer!.id ? wsEvent.payload.customer! : c))
              );
            }
            setCash(wsEvent.payload.cash);
          } else if (wsEvent.type === 'CUSTOMER_UPDATED') {
            setCustomers((prev) => {
              const exists = prev.some((c) => c.id === wsEvent.payload.customer.id);
              if (exists) {
                return prev.map((c) => (c.id === wsEvent.payload.customer.id ? wsEvent.payload.customer : c));
              }
              return [wsEvent.payload.customer, ...prev];
            });
            setCash(wsEvent.payload.cash);
          } else if (wsEvent.type === 'CUSTOMER_DELETED') {
            setCustomers((prev) => prev.filter((c) => c.id !== wsEvent.payload.customerId));
            setCash(wsEvent.payload.cash);
          } else if (wsEvent.type === 'REMINDER_SENT') {
            setReminderLogs((prev) => [wsEvent.payload, ...prev]);
          } else if (wsEvent.type === 'CASH_UPDATED') {
            setCash(wsEvent.payload);
          } else if (wsEvent.type === 'SHOP_PROFILE_UPDATED') {
            setShopProfile(wsEvent.payload);
            setStoreName(wsEvent.payload.storeName);
          } else if (wsEvent.type === 'DAILY_CLOSING_CREATED') {
            setDailyClosings((prev) => [wsEvent.payload, ...prev]);
          } else if (wsEvent.type === 'PRODUCT_UPDATED') {
            setProducts((prev) => {
              const exists = prev.some((p) => p.id === wsEvent.payload.id);
              if (exists) {
                return prev.map((p) => (p.id === wsEvent.payload.id ? wsEvent.payload : p));
              }
              return [wsEvent.payload, ...prev];
            });
          } else if (wsEvent.type === 'PRODUCT_DELETED') {
            setProducts((prev) => prev.filter((p) => p.id !== wsEvent.payload.productId));
          } else if (wsEvent.type === 'STOCK_MOVEMENT_CREATED') {
            setStockMovements((prev) => [wsEvent.payload.movement, ...prev]);
            setProducts((prev) =>
              prev.map((p) => (p.id === wsEvent.payload.product.id ? wsEvent.payload.product : p))
            );
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      setConnected(false);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Handler: Save Shop Profile
  const handleSaveShopProfile = async (newProfile: ShopProfile) => {
    const res = await fetch('/api/shop-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProfile),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Dükkan profili kaydedilemedi.');
    }
    const saved = await res.json();
    setShopProfile(saved);
    setStoreName(saved.storeName);
  };

  // Handler: Hızlı Para Al (Kasa Girişi / Satış)
  const handleMoneyIn = async (data: {
    amount: number;
    paymentMethod: PaymentMethod;
    category: string;
    customerId?: string;
    description: string;
  }) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: data.customerId,
        type: 'tahsilat',
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        description: data.description,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Para alma işlemi kaydedilemedi.');
    }
  };

  // Handler: Hızlı Para Ver (Dükkan Masrafı / Gider)
  const handleMoneyOut = async (data: {
    amount: number;
    paymentMethod: PaymentMethod;
    category: string;
    description: string;
  }) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'masraf',
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        description: data.description,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Masraf işlemi kaydedilemedi.');
    }
  };

  // Handler: Gün Sonu Kapatma (Z Raporu)
  const handleSaveDailyClosing = async (data: {
    actualCashCount: number;
    note: string;
    closedBy?: string;
  }) => {
    const res = await fetch('/api/daily-closings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gün sonu kaydedilemedi.');
    }
    const saved = await res.json();
    setDailyClosings((prev) => [saved, ...prev]);
  };

  // Handler: Slogan / Vitrin AI Uygulama
  const handleApplySlogan = async (slogan: string) => {
    const updated = { ...shopProfile, slogan };
    await handleSaveShopProfile(updated);
  };

  // Customer Management Handlers
  const handleCreateCustomer = async (data: Partial<Customer> & { initialBalance?: number }) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Müşteri kaydedilemedi.');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      alert('Müşteri silinemedi.');
    }
  };

  const handleReminderSent = (log: {
    customerId: string;
    channel: 'whatsapp' | 'sms';
    message: string;
    type: string;
  }) => {
    fetch('/api/reminders/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    }).catch((e) => console.error('Error logging reminder:', e));
  };

  const handleExportCsv = () => {
    window.location.href = '/api/export/csv';
  };

  const handleResetDemo = async () => {
    if (confirm('Tüm verileri varsayılan örnek verilere sıfırlamak istiyor musunuz?')) {
      try {
        await fetch('/api/reset-demo', { method: 'POST' });
      } catch (e) {
        console.error('Reset error:', e);
      }
    }
  };

  const openTransactionForCustomer = (cust: Customer, type: TransactionType) => {
    setTransactionTargetCustomer(cust);
    setTransactionModalType(type);
    setIsTransactionModalOpen(true);
  };

  const openWhatsAppForCustomer = (cust: Customer, type?: 'aidat' | 'bakim' | 'veresiye') => {
    setWhatsAppTargetCustomer(cust);
    setWhatsAppReminderType(
      type || (cust.businessCategory === 'teknik_servis' ? 'bakim' : cust.subscriptionPlan?.enabled ? 'aidat' : 'veresiye')
    );
    setIsWhatsAppModalOpen(true);
  };

  // Stock Management Handlers
  const handleStockAdjustment = async (
    productId: string,
    type: 'giris' | 'cikis',
    quantity: number,
    reason: string
  ) => {
    const res = await fetch(`/api/products/${productId}/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, quantity, reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Stok hareketi işlenemedi.');
    }
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Ürün kaydedilemedi.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bu ürünü ve stok geçmişini silmek istediğinize emin misiniz?')) {
      return;
    }
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Ürün silinemedi.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans pb-16 transition-colors">
      {/* 1. Header with Store Profile Badge, Dark Mode Switch & VIP Button */}
      <Header
        storeName={storeName}
        shopProfile={shopProfile}
        connected={connected}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenShopProfile={() => setIsShopProfileModalOpen(true)}
        onOpenVip={() => setIsVipModalOpen(true)}
        onResetDemo={handleResetDemo}
        onExportCsv={handleExportCsv}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 flex-1 w-full">
        {/* Top Banner: Esnaf Sloganı & Hoş Geldin Notu */}
        {shopProfile.isConfigured && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <span>{shopProfile.storeName}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {shopProfile.businessField}
                  </span>
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400 italic mt-0.5">
                  "{shopProfile.slogan || 'Hayırlı ve bereketli işler dileriz.'}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setIsShopProfileModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition-colors cursor-pointer shadow-xs"
              >
                Dükkan Bilgileri
              </button>
              <button
                type="button"
                onClick={() => setIsVipModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Yapay Zeka Vitrin &amp; Kâr Danışmanı</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Primary Action Bar: Para Al (Satış), Para Ver (Gider), Gün Sonu Kapat (Z Raporu), Stok Takibi */}
        <QuickActionBar
          onOpenMoneyIn={() => setIsMoneyInModalOpen(true)}
          onOpenMoneyOut={() => setIsMoneyOutModalOpen(true)}
          onOpenDailyClosing={() => setIsDailyClosingModalOpen(true)}
          onOpenVip={() => setIsVipModalOpen(true)}
          onOpenStockView={() => setActiveTab('stock')}
          criticalStockCount={criticalStockCount}
          onToggleCustomerView={() => setActiveTab((prev) => (prev === 'customers' ? 'activity' : 'customers'))}
          showCustomerView={activeTab === 'customers'}
        />

        {/* 3. Live Cash Registers & Daily Target Tracker */}
        <CashSummary
          cash={cash}
          onOpenUpcomingModal={() => {
            const el = document.getElementById('section-upcoming-reminders');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 4. Profitability & Revenue vs Expenses Comparison Chart */}
        <RevenueVsExpensesChart transactions={transactions} />

        {/* 5. Upcoming Reminders for subscriptions/debts (collapsible if any exist) */}
        {cash.overdueCount > 0 || cash.dueTodayCount > 0 ? (
          <div id="section-upcoming-reminders">
            <UpcomingReminders
              customers={customers}
              onOpenWhatsApp={(cust, type) => openWhatsAppForCustomer(cust, type)}
              onOpenPayment={(cust) => openTransactionForCustomer(cust, 'tahsilat')}
            />
          </div>
        ) : null}

        {/* 6. Tabs: Canlı Kasa Akışı vs Stok & Ürün Takibi vs Müşteri & Veresiye Defteri */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="tab-view-activity"
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs border border-stone-200 dark:border-stone-800 ring-1 ring-stone-900/5'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Dükkan Kasa Akışı ({transactions.length})</span>
            </button>

            <button
              id="tab-view-stock"
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'stock'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs border border-stone-200 dark:border-stone-800 ring-1 ring-stone-900/5'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
              }`}
            >
              <Package className="w-4 h-4 text-amber-500" />
              <span>Stok &amp; Ürün Takibi ({products.length})</span>
              {criticalStockCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                  {criticalStockCount} Kritik!
                </span>
              )}
            </button>

            <button
              id="tab-view-customers"
              type="button"
              onClick={() => setActiveTab('customers')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'customers'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs border border-stone-200 dark:border-stone-800 ring-1 ring-stone-900/5'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
              }`}
            >
              <span>Müşteri &amp; Defter ({customers.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeTab === 'stock' && (
              <button
                type="button"
                onClick={() => {
                  setProductToEdit(null);
                  setIsProductFormModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                + Yeni Ürün Ekle
              </button>
            )}
            {activeTab === 'customers' && (
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                + Yeni Müşteri Ekle
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDailyClosingModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-black dark:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span>Kasa Kapat &amp; Z Raporu</span>
            </button>
          </div>
        </div>

        {/* 7. View Content: Activity Feed OR Stock Management OR Customers Ledger */}
        {activeTab === 'activity' ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 sm:p-5 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  Dükkan Kasa Hareketleri
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Satış tahsilatları, toptancı ödemeleri ve dükkan giderleri
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                Canlı Eşzamanlı
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Store className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                  Henüz kaydedilmiş bir kasa hareketi bulunmuyor.
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Yukarıdaki "Para Al" veya "Para Ver" butonlarıyla dükkan hareketlerini girmeye başlayın.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3 sm:py-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-stone-50/50 dark:hover:bg-stone-800/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          tx.type === 'veresiye'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : tx.type === 'tahsilat'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {tx.type === 'veresiye' ? (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        ) : tx.type === 'tahsilat' ? (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <Banknote className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 dark:text-white">
                          {tx.customerName || (tx.type === 'masraf' ? 'Dükkan Masrafı' : 'Genel Tezgâh Satışı')}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {tx.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {tx.date}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-stone-600 dark:text-stone-300 capitalize">
                            {tx.paymentMethod === 'nakit'
                              ? '💵 Nakit'
                              : tx.paymentMethod === 'kart'
                              ? '💳 Kart / POS'
                              : tx.paymentMethod === 'havale'
                              ? '📲 Havale / FAST'
                              : '📝 Deftere Yazıldı'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-black text-sm sm:text-base ${
                          tx.type === 'veresiye'
                            ? 'text-amber-600 dark:text-amber-400'
                            : tx.type === 'tahsilat'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'veresiye' ? '+' : tx.type === 'tahsilat' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        {tx.type === 'veresiye'
                          ? 'Veresiye Borç'
                          : tx.type === 'tahsilat'
                          ? 'Kasa Girişi'
                          : 'Dükkan Gideri'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'stock' ? (
          <StockManagementView
            products={products}
            stockMovements={stockMovements}
            onOpenAdjustment={(prod, type) => {
              setSelectedProductForAdjustment(prod);
              setAdjustmentType(type);
              setIsStockAdjustmentModalOpen(true);
            }}
            onOpenNewProduct={() => {
              setProductToEdit(null);
              setIsProductFormModalOpen(true);
            }}
            onOpenEditProduct={(prod) => {
              setProductToEdit(prod);
              setIsProductFormModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
          />
        ) : (
          <CustomerList
            customers={customers}
            onSelectCustomer={(cust) => {
              setSelectedCustomer(cust);
              setIsDetailModalOpen(true);
            }}
            onOpenTransaction={(cust, type) => openTransactionForCustomer(cust, type)}
            onOpenWhatsApp={(cust) => openWhatsAppForCustomer(cust)}
          />
        )}
      </main>

      {/* MODALS */}

      {/* 1. Dükkan Kayıt & Profil Modal (Onboarding & Settings) */}
      <ShopProfileModal
        isOpen={isShopProfileModalOpen}
        onClose={() => setIsShopProfileModalOpen(false)}
        currentProfile={shopProfile}
        onSaveProfile={handleSaveShopProfile}
        isFirstTime={!shopProfile.isConfigured}
      />

      {/* 2. Para Al (Satış / Kasa Girişi) Modal */}
      <MoneyInModal
        isOpen={isMoneyInModalOpen}
        onClose={() => setIsMoneyInModalOpen(false)}
        customers={customers}
        onSubmit={handleMoneyIn}
      />

      {/* 3. Para Ver (Dükkan Masrafı / Gider) Modal */}
      <MoneyOutModal
        isOpen={isMoneyOutModalOpen}
        onClose={() => setIsMoneyOutModalOpen(false)}
        onSubmit={handleMoneyOut}
      />

      {/* 4. Gün Sonu Kasa Kapatma & Z Raporu Modal */}
      <DailyClosingModal
        isOpen={isDailyClosingModalOpen}
        onClose={() => setIsDailyClosingModalOpen(false)}
        cash={cash}
        shopProfile={shopProfile}
        closings={dailyClosings}
        onSaveClosing={handleSaveDailyClosing}
      />

      {/* 5. VIP Esnaf Kulübü & AI Dükkan Danışmanı Modal */}
      <VipAiConsultantModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        shopProfile={shopProfile}
        cash={cash}
        onApplyProfileTip={handleApplySlogan}
      />

      {/* 6. Customer Detail Modal */}
      {isDetailModalOpen && selectedCustomer && (
        <CustomerDetailModal
          customer={customers.find((c) => c.id === selectedCustomer.id) || selectedCustomer}
          transactions={transactions}
          reminderLogs={reminderLogs}
          onClose={() => setIsDetailModalOpen(false)}
          onOpenTransaction={(cust, type) => {
            setIsDetailModalOpen(false);
            openTransactionForCustomer(cust, type);
          }}
          onOpenWhatsApp={(cust) => {
            setIsDetailModalOpen(false);
            openWhatsAppForCustomer(cust);
          }}
          onDeleteCustomer={handleDeleteCustomer}
        />
      )}

      {/* 7. Quick Transaction (Veresiye/Tahsilat for Customer) */}
      {isTransactionModalOpen && (
        <QuickTransactionModal
          initialType={transactionModalType}
          selectedCustomer={transactionTargetCustomer}
          customers={customers}
          onClose={() => {
            setIsTransactionModalOpen(false);
            setTransactionTargetCustomer(null);
          }}
          onSubmit={async (data) => {
            const res = await fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            if (!res.ok) {
              const err = await res.json();
              alert(err.error || 'İşlem kaydedilemedi.');
            }
          }}
        />
      )}

      {/* 8. New Customer Modal */}
      {isNewCustomerModalOpen && (
        <NewCustomerModal
          onClose={() => setIsNewCustomerModalOpen(false)}
          onSubmit={handleCreateCustomer}
        />
      )}

      {/* 9. WhatsApp Reminder Modal */}
      {isWhatsAppModalOpen && whatsAppTargetCustomer && (
        <WhatsAppReminderModal
          customer={whatsAppTargetCustomer}
          defaultType={whatsAppReminderType}
          onClose={() => {
            setIsWhatsAppModalOpen(false);
            setWhatsAppTargetCustomer(null);
          }}
          onReminderSent={handleReminderSent}
        />
      )}

      {/* 10. Stok Giriş / Çıkış Hareketi Modal */}
      <StockAdjustmentModal
        isOpen={isStockAdjustmentModalOpen}
        onClose={() => setIsStockAdjustmentModalOpen(false)}
        product={selectedProductForAdjustment}
        products={products}
        initialType={adjustmentType}
        onSubmit={handleStockAdjustment}
      />

      {/* 11. Yeni Ürün Ekleme / Düzenleme Modal */}
      <ProductFormModal
        isOpen={isProductFormModalOpen}
        onClose={() => setIsProductFormModalOpen(false)}
        productToEdit={productToEdit}
        onSubmit={handleSaveProduct}
      />
    </div>
  );
}
