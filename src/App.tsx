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
  BusinessSector,
  Appointment,
  RestaurantTable,
  RepairTicket,
  Supplier,
} from './types';
import { Header } from './components/Header';
import { SectorSwitcherBar, SECTORS } from './components/SectorSwitcherBar';
import { BarberAppointmentsView } from './components/BarberAppointmentsView';
import { RestaurantTablesView } from './components/RestaurantTablesView';
import { FastRetailCounterView } from './components/FastRetailCounterView';
import { RepairTicketsView } from './components/RepairTicketsView';
import { RevenueVsExpensesChart } from './components/RevenueVsExpensesChart';
import { WeeklyTrendCard } from './components/WeeklyTrendCard';
import { CashSummary } from './components/CashSummary';
import { QuickActionBar } from './components/QuickActionBar';
import { UpcomingReminders } from './components/UpcomingReminders';
import { CustomerList } from './components/CustomerList';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { NewCustomerModal } from './components/NewCustomerModal';
import { ShopProfileModal } from './components/ShopProfileModal';
import { AuthPage } from './components/AuthPage';
import { MoneyInModal } from './components/MoneyInModal';
import { MoneyOutModal } from './components/MoneyOutModal';
import { DailyClosingModal } from './components/DailyClosingModal';
import { VipAiConsultantModal } from './components/VipAiConsultantModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { StaffModal } from './components/StaffModal';
import { StockManagementView } from './components/StockManagementView';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { ProductFormModal } from './components/ProductFormModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SupplierModal, SupplierModalMode } from './components/SupplierModal';
import { formatCurrency } from './utils/formatters';
import {
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  CreditCard,
  Send,
  Store,
  Moon,
  Crown,
  CheckCircle2,
  Package,
  AlertTriangle,
  LayoutDashboard,
  Users,
  Scissors,
  UtensilsCrossed,
  ShoppingCart,
  Wrench,
  FileCheck,
  LogOut,
  ChevronDown,
  Wifi,
  WifiOff,
  KeyRound,
  UserPlus,
  Download,
  Upload,
  Truck,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';

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
  const [storeName, setStoreName] = useState('Dükkanım');
  const [shopProfile, setShopProfile] = useState<ShopProfile>({
    storeName: '',
    ownerName: '',
    businessField: 'Bakkal / Market / Büfe',
    sectorKey: 'bakkal_market',
    employeeCount: '1',
    phone: '',
    cityDistrict: '',
    dailyTarget: 2500,
    slogan: '',
    isConfigured: false,
    isVip: false,
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
  const [activeTab, setActiveTab] = useState<'panel' | 'sector_view' | 'activity' | 'customers' | 'stock'>('panel');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Profil menüsü açıkken dışarı tıklayınca kapansın (menü nav'ın altından açılır)
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t && t.closest('#btn-profile-menu, .profile-menu')) return;
      setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileMenuOpen]);

  // Faz 1 sade: stok geri geldi, sadece sektör gizli
  useEffect(() => {
    if (activeTab === 'sector_view') setActiveTab('panel');
  }, [activeTab]);

  // Sector Specific States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [repairTickets, setRepairTickets] = useState<RepairTicket[]>([]);

  // Tedarikçi cari hesap + modal durumu
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierModalMode, setSupplierModalMode] = useState<SupplierModalMode>('form');
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);

  const currentSector: BusinessSector = shopProfile.sectorKey || 'bakkal_market';
  const currentSectorInfo = useMemo(() => {
    return SECTORS.find((s) => s.key === currentSector) || SECTORS[2];
  }, [currentSector]);

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
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

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

  // Auth durumu: kontrol ediliyor / kapalı / açık
  const [authStatus, setAuthStatus] = useState<'checking' | 'out' | 'in'>('checking');
  const authedRef = useRef(false);

  const handleLogout = async () => {
    authedRef.current = false;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    socketRef.current?.close();
    socketRef.current = null;
    setAuthStatus('out');
  };

  const bootstrapSession = async () => {
    try {
      const me = await fetch('/api/auth/me');
      if (!me.ok) {
        authedRef.current = false;
        setAuthStatus('out');
        return;
      }
      authedRef.current = true;
      setAuthStatus('in');
      fetchInitialData();
      connectWebSocket();
    } catch (e) {
      console.error('Auth check failed:', e);
      authedRef.current = false;
      setAuthStatus('out');
    }
  };

  // Initial HTTP data fetch
  const fetchInitialData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) {
        authedRef.current = false;
        setAuthStatus('out');
        return;
      }
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
        if (data.appointments) setAppointments(data.appointments);
        if (data.tables) setTables(data.tables);
        if (data.repairTickets) setRepairTickets(data.repairTickets);
        if (data.suppliers) setSuppliers(data.suppliers);
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
            if (wsEvent.payload.appointments) {
              setAppointments(wsEvent.payload.appointments);
            }
            if (wsEvent.payload.tables) {
              setTables(wsEvent.payload.tables);
            }
            if (wsEvent.payload.repairTickets) {
              setRepairTickets(wsEvent.payload.repairTickets);
            }
            if (wsEvent.payload.suppliers) {
              setSuppliers(wsEvent.payload.suppliers);
            }
          } else if (wsEvent.type === 'APPOINTMENT_UPDATED') {
            setAppointments((prev) => {
              const exists = prev.some((a) => a.id === wsEvent.payload.id);
              if (exists) {
                return prev.map((a) => (a.id === wsEvent.payload.id ? wsEvent.payload : a));
              }
              return [wsEvent.payload, ...prev];
            });
          } else if (wsEvent.type === 'APPOINTMENT_DELETED') {
            setAppointments((prev) => prev.filter((a) => a.id !== wsEvent.payload.id));
          } else if (wsEvent.type === 'TABLE_UPDATED') {
            setTables((prev) => {
              const exists = prev.some((t) => t.id === wsEvent.payload.id);
              if (exists) {
                return prev.map((t) => (t.id === wsEvent.payload.id ? wsEvent.payload : t));
              }
              return [...prev, wsEvent.payload];
            });
          } else if (wsEvent.type === 'REPAIR_TICKET_UPDATED') {
            setRepairTickets((prev) => {
              const exists = prev.some((t) => t.id === wsEvent.payload.id);
              if (exists) {
                return prev.map((t) => (t.id === wsEvent.payload.id ? wsEvent.payload : t));
              }
              return [wsEvent.payload, ...prev];
            });
          } else if (wsEvent.type === 'REPAIR_TICKET_DELETED') {
            setRepairTickets((prev) => prev.filter((t) => t.id !== wsEvent.payload.id));
          } else if (wsEvent.type === 'TRANSACTION_CREATED') {
            setTransactions((prev) => {
              if (prev.some((t) => t.id === wsEvent.payload.transaction.id)) return prev;
              return [wsEvent.payload.transaction, ...prev];
            });
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
          } else if (wsEvent.type === 'SUPPLIER_UPDATED') {
            setSuppliers((prev) => {
              const exists = prev.some((s) => s.id === wsEvent.payload.id);
              if (exists) {
                return prev.map((s) => (s.id === wsEvent.payload.id ? wsEvent.payload : s));
              }
              return [wsEvent.payload, ...prev];
            });
          } else if (wsEvent.type === 'SUPPLIER_DELETED') {
            setSuppliers((prev) => prev.filter((s) => s.id !== wsEvent.payload.id));
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!authedRef.current) return;
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
    bootstrapSession();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // API { success, profile } döner — yanlışlıkla sarmalayıcıyı profile yazma (Header crash yapar)
    const profile: ShopProfile = saved.profile || saved;
    setShopProfile(profile);
    setStoreName(profile.storeName);
    // İlk kurulum sonrası direkt panele dön (restoran/berber özel ekran ana sayfada gözükmesin)
    setActiveTab('panel');
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
    const result = await res.json();
    if (result.transaction) {
      setTransactions((prev) => {
        if (prev.some((t) => t.id === result.transaction.id)) return prev;
        return [result.transaction, ...prev];
      });
    }
    if (result.cash) setCash(result.cash);
    if (result.customer) {
      setCustomers((prev) => prev.map((c) => (c.id === result.customer.id ? result.customer : c)));
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
        category: data.category,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Masraf işlemi kaydedilemedi.');
    }
    const result = await res.json();
    if (result.transaction) {
      setTransactions((prev) => {
        if (prev.some((t) => t.id === result.transaction.id)) return prev;
        return [result.transaction, ...prev];
      });
    }
    if (result.cash) setCash(result.cash);
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

  // Tedarikçi cari hesap handler'ları
  const openSupplierModal = (mode: SupplierModalMode, supplier: Supplier | null = null) => {
    setSupplierModalMode(mode);
    setActiveSupplier(supplier);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (data: { id?: string; name: string; phone: string; notes: string }) => {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Tedarikçi kaydedilemedi.');
    }
    const result = await res.json();
    if (result.supplier) {
      setSuppliers((prev) => {
        const exists = prev.some((s) => s.id === result.supplier.id);
        if (exists) return prev.map((s) => (s.id === result.supplier.id ? result.supplier : s));
        return [result.supplier, ...prev];
      });
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Bu tedarikçi kaydını silmek istediğinize emin misiniz? (Borç bakiyesi de silinir)')) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Tedarikçi silinemedi.');
    } else {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSupplierPurchase = async (id: string, amount: number) => {
    const res = await fetch(`/api/suppliers/${id}/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Alım yazılamadı.');
    }
    const result = await res.json();
    if (result.supplier) {
      setSuppliers((prev) => prev.map((s) => (s.id === result.supplier.id ? result.supplier : s)));
    }
  };

  const handleSupplierPay = async (id: string, amount: number, paymentMethod: PaymentMethod) => {
    const res = await fetch(`/api/suppliers/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, paymentMethod }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Ödeme kaydedilemedi.');
    }
    const result = await res.json();
    if (result.supplier) {
      setSuppliers((prev) => prev.map((s) => (s.id === result.supplier.id ? result.supplier : s)));
    }
    if (result.transaction) {
      setTransactions((prev) => {
        if (prev.some((t) => t.id === result.transaction.id)) return prev;
        return [result.transaction, ...prev];
      });
    }
    if (result.cash) setCash(result.cash);
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

  const handleRestoreBackup = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json || !json.state) {
        alert('Geçersiz yedek dosyası.');
        return;
      }
      if (!confirm('Mevcut tüm veriler bu yedekle değiştirilecek. Emin misiniz?')) return;
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: json.state }),
      });
      const data = await res.json().catch(() => ({}) as any);
      if (!res.ok) throw new Error(data.error || 'Geri yükleme başarısız oldu.');
      alert('Yedek başarıyla geri yüklendi.');
      fetchInitialData();
    } catch (err: any) {
      alert('Hata: ' + (err.message || 'Dosya okunamadı.'));
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

  // Sector Switching Handler
  const handleSelectSector = async (sector: BusinessSector) => {
    let updatedStoreName = storeName;
    let updatedBusinessField = shopProfile.businessField;

    const isGenericName =
      storeName === 'Dıkkânım' ||
      storeName === 'Bereket Mahalle Esnafı' ||
      storeName === 'Bereket Mahalle Bakkalı' ||
      storeName === 'Usta Eller Berber & Kuaför' ||
      storeName === 'Bereket Kafe & Lokanta' ||
      storeName === 'Usta Teknik Servis & Oto' ||
      storeName === 'Bereket Esnaf Dükkanı';

    if (isGenericName) {
      if (sector === 'berber_kuafor') {
        updatedStoreName = 'Usta Eller Berber & Kuaför';
        updatedBusinessField = 'Kuaför / Berber / Güzellik Salonu';
      } else if (sector === 'kafe_restoran') {
        updatedStoreName = 'Bereket Kafe & Lokanta';
        updatedBusinessField = 'Kafe / Restoran / Çay Ocağı';
      } else if (sector === 'bakkal_market') {
        updatedStoreName = 'Bereket Mahalle Bakkalı';
        updatedBusinessField = 'Bakkal / Market / Büfe';
      } else if (sector === 'teknik_servis') {
        updatedStoreName = 'Usta Teknik Servis & Oto';
        updatedBusinessField = 'Tamir / Teknik Servis / Atölye';
      } else {
        updatedStoreName = 'Bereket Esnaf Dükkanı';
        updatedBusinessField = 'Giyim / Züccaciye / Diğer';
      }
    }

    const newProfile: ShopProfile = {
      ...shopProfile,
      storeName: updatedStoreName,
      businessField: updatedBusinessField,
      sectorKey: sector,
    };

    setShopProfile(newProfile);
    setStoreName(updatedStoreName);
    setActiveTab(sector === 'diger_esnaf' ? 'activity' : 'sector_view');

    try {
      await fetch('/api/shop-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });
    } catch (err) {
      console.error('Error saving sector change:', err);
    }
  };

  // 1. Barber & Hairdresser Handlers
  const handleAddAppointment = async (apptData: Partial<Appointment>) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apptData),
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments((prev) => [data.appointment, ...prev.filter((a) => a.id !== data.appointment.id)]);
      }
    } catch (err) {
      console.error('Error adding appointment:', err);
    }
  };

  const handleCompleteAppointment = async (id: string, paymentMethod: 'nakit' | 'kart') => {
    try {
      const res = await fetch(`/api/appointments/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.appointment) {
          setAppointments((prev) => prev.map((a) => (a.id === id ? data.appointment : a)));
        }
        if (data.cash) setCash(data.cash);
        if (data.transaction) setTransactions((prev) => [data.transaction, ...prev]);
      }
    } catch (err) {
      console.error('Error completing appointment:', err);
    }
  };

  const handleUpdateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.appointment) {
          setAppointments((prev) => prev.map((a) => (a.id === id ? data.appointment : a)));
        }
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
    }
  };

  const handleFastWalkinCash = async (serviceName: string, price: number, staffName: string) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tahsilat',
          amount: price,
          paymentMethod: 'nakit',
          description: `Ayaktan Berber Müşterisi (${staffName}) - ${serviceName}`,
          customerName: `Ayaktan Müşteri (${staffName || 'Usta'})`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions((prev) => [data.transaction, ...prev]);
        setCash(data.cash);
      }
    } catch (err) {
      console.error('Error recording fast walk-in cash:', err);
    }
  };

  // 2. Restaurant & Cafe Handlers
  const handleAddOrderToTable = async (
    tableId: string,
    item: { name: string; quantity: number; unitPrice: number }
  ) => {
    try {
      const res = await fetch(`/api/tables/${tableId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const data = await res.json();
        setTables((prev) => prev.map((t) => (t.id === tableId ? data.table : t)));
      }
    } catch (err) {
      console.error('Error adding order to table:', err);
    }
  };

  const handleCheckoutTable = async (
    tableId: string,
    paymentMethod: 'nakit' | 'kart'
  ) => {
    try {
      const res = await fetch(`/api/tables/${tableId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });
      if (res.ok) {
        const data = await res.json();
        setTables((prev) => prev.map((t) => (t.id === tableId ? data.table : t)));
        if (data.cash) setCash(data.cash);
        if (data.transaction) setTransactions((prev) => [data.transaction, ...prev]);
        if (data.customer) {
          setCustomers((prev) => prev.map((c) => (c.id === data.customer.id ? data.customer : c)));
        }
      }
    } catch (err) {
      console.error('Error checking out table:', err);
    }
  };

  const handleResetTable = async (tableId: string) => {
    try {
      const res = await fetch(`/api/tables/${tableId}/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTables((prev) => prev.map((t) => (t.id === tableId ? data.table : t)));
      }
    } catch (err) {
      console.error('Error resetting table:', err);
    }
  };

  const handleAddQuickExpense = async (
    description: string,
    amount: number
  ) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'masraf',
          amount,
          paymentMethod: 'nakit',
          description,
          customerName: 'Mutfak / Hal / Tedarik',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions((prev) => [data.transaction, ...prev]);
        setCash(data.cash);
      }
    } catch (err) {
      console.error('Error adding quick expense:', err);
    }
  };

  // 3. Fast Retail POS Handlers (Bakkal & Market)
  const handleQuickPosSale = async (
    items: { productId?: string; name: string; quantity: number; unitPrice: number; total: number }[],
    paymentMethod: 'nakit' | 'kart'
  ) => {
    try {
      const res = await fetch('/api/quick-pos-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, paymentMethod }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transaction) setTransactions((prev) => [data.transaction, ...prev]);
        if (data.cash) setCash(data.cash);
        fetchInitialData();
      }
    } catch (err) {
      console.error('Error in quick POS sale:', err);
    }
  };

  const handleCreditSaleToCustomer = async (
    customerId: string,
    amount: number,
    description: string
  ) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          type: 'veresiye',
          amount,
          paymentMethod: 'veresiye',
          description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions((prev) => [data.transaction, ...prev]);
        if (data.customer) {
          setCustomers((prev) => prev.map((c) => (c.id === customerId ? data.customer : c)));
        }
        setCash(data.cash);
      }
    } catch (err) {
      console.error('Error recording credit sale:', err);
    }
  };

  // 4. Technical Service & Repair Tickets Handlers
  const handleAddRepairTicket = async (
    ticketData: Partial<RepairTicket>
  ) => {
    try {
      const res = await fetch('/api/repair-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });
      if (res.ok) {
        const data = await res.json();
        setRepairTickets((prev) => [data.ticket, ...prev.filter((t) => t.id !== data.ticket.id)]);
      }
    } catch (err) {
      console.error('Error adding repair ticket:', err);
    }
  };

  const handleUpdateRepairStatus = async (id: string, status: RepairTicket['status']) => {
    try {
      const res = await fetch(`/api/repair-tickets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          setRepairTickets((prev) => prev.map((t) => (t.id === id ? data.ticket : t)));
        }
      }
    } catch (err) {
      console.error('Error updating repair status:', err);
    }
  };

  const handleCompleteRepairTicket = async (
    id: string,
    paymentMethod: 'nakit' | 'kart',
    deductPartCost: boolean
  ) => {
    try {
      const res = await fetch(`/api/repair-tickets/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod, deductPartCost }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          setRepairTickets((prev) => prev.map((t) => (t.id === id ? data.ticket : t)));
        }
        if (data.cash) setCash(data.cash);
        if (data.transaction) setTransactions((prev) => [data.transaction, ...prev]);
      }
    } catch (err) {
      console.error('Error completing repair ticket:', err);
    }
  };

  const handleDeleteRepairTicket = async (id: string) => {
    try {
      const res = await fetch(`/api/repair-tickets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRepairTickets((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Error deleting repair ticket:', err);
    }
  };

  // ---- Auth gate: giris yoksa sadece AuthPage goster ----
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center animate-pulse">
          <Store className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-stone-500 dark:text-stone-400">Yükleniyor...</p>
      </div>
    );
  }
  if (authStatus === 'out') {
    return (
      <AuthPage
        onSuccess={() => {
          authedRef.current = true;
          setAuthStatus('in');
          fetchInitialData();
          connectWebSocket();
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
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
        profileMenuOpen={profileMenuOpen}
        onToggleProfileMenu={() => setProfileMenuOpen((v) => !v)}
        onLogout={handleLogout}
        onExportCsv={handleExportCsv}
      />

      {/* Sector switcher sadece sektör ekranındayken gözüksün — ana panel tertemiz kalsın */}
      {activeTab === 'sector_view' && (
        <SectorSwitcherBar
          currentSector={currentSector}
          onSelectSector={handleSelectSector}
          shopProfile={shopProfile}
        />
      )}

      {/* Güncel nav: Panel | Gün Sonu & Ciro | Müşteriler | Stok (patron akışı) */}
      <nav className="sticky top-0 z-30 bg-stone-100/90 dark:bg-stone-950/90 backdrop-blur border-b border-stone-200 dark:border-stone-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-1.5 overflow-x-auto">
          <button
            id="nav-tab-panel"
            type="button"
            onClick={() => setActiveTab('panel')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'panel'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Panel</span>
          </button>

          <button
            id="nav-tab-activity"
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'activity'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Gün Sonu</span>
          </button>

          <button
            id="nav-tab-customers"
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'customers'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Müşteriler ({customers.length})</span>
          </button>

          <button
            id="nav-tab-stock"
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stock'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Stok ({products.length})</span>
            {criticalStockCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                {criticalStockCount}
              </span>
            )}
          </button>
        </div>

        {/* Profil menüsü: nav satırının ALTINDAN açılır, sekmeleri örtmez */}
        {profileMenuOpen && (
          <div className="profile-menu absolute right-4 top-full mt-1 w-60 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden z-50">
            <div className="p-4 border-b border-stone-100 dark:border-stone-800">
              <p className="text-sm font-black text-stone-900 dark:text-white truncate">
                {shopProfile?.storeName || storeName}
              </p>
              {shopProfile?.ownerName && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{shopProfile.ownerName}</p>
              )}
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 flex items-center gap-1">
                {connected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <Wifi className="w-3 h-3" /> Bağlı
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
                    <WifiOff className="w-3 h-3" /> Bağlanıyor...
                  </>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                setIsShopProfileModalOpen(true);
              }}
              className="w-full text-left px-4 py-3 text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-amber-500" />
              Dükkan Bilgileri
            </button>

            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                setIsChangePasswordOpen(true);
              }}
              className="w-full text-left px-4 py-3 text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-amber-500" />
              Şifre Değiştir
            </button>

            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                setIsStaffModalOpen(true);
              }}
              className="w-full text-left px-4 py-3 text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-amber-500" />
              Personel (Kasiyer)
            </button>

            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                setIsVipModalOpen(true);
              }}
              className="w-full text-left px-4 py-3 text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-500" />
              VIP Danışman
            </button>

            <a
              href="/api/backup"
              onClick={() => setProfileMenuOpen(false)}
              className="w-full text-left px-4 py-3 text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Yedek İndir (JSON)
            </a>

            <label className="w-full text-left px-4 py-3 text-sm font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              Yedek Geri Yükle
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files && e.target.files[0];
                  setProfileMenuOpen(false);
                  if (f) handleRestoreBackup(f);
                  e.target.value = '';
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-4 py-3 text-sm font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-t border-stone-100 dark:border-stone-800 transition-colors cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 flex-1 w-full animate-fade-in">
        {activeTab === 'panel' && (
        <>
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
            </div>
          </div>
        )}

        {/* PANEL V4 - SADE KASA MODU */}

        {/* 2. Primary Action Bar — Faz 1 sade: sadece Giren/Çıkan */}
        <QuickActionBar
          onOpenMoneyIn={() => setIsMoneyInModalOpen(true)}
          onOpenMoneyOut={() => setIsMoneyOutModalOpen(true)}
          onOpenDailyClosing={() => setIsDailyClosingModalOpen(true)}
          onOpenVip={() => {}}
          criticalStockCount={criticalStockCount}
        />
        <style>{`#btn-quick-vip, #btn-quick-stock, #btn-quick-sector-view, #btn-toggle-customer-ledger { display: none !important; }`}</style>

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

        {/* 4b. Haftalık Kazanç & Harcama Trendi */}
        <WeeklyTrendCard transactions={transactions} />
        </>
        )}

        {/* 6. Bölüm başlığı + bağlamsal aksiyonlar */}
        {activeTab !== 'panel' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2 gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
              {activeTab === 'sector_view' ? (
                <>
                  {currentSector === 'berber_kuafor' ? (
                    <Scissors className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  ) : currentSector === 'kafe_restoran' ? (
                    <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  ) : currentSector === 'bakkal_market' ? (
                    <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                  <span>{currentSectorInfo.specialTabName}</span>
                </>
              ) : activeTab === 'activity' ? (
                <>
                  <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Gün Sonu ({transactions.length})</span>
                </>
              ) : activeTab === 'stock' ? (
                <>
                  <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>Stok ({products.length})</span>
                  {criticalStockCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                      {criticalStockCount} Kritik!
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                  <span>Müşteriler ({customers.length})</span>
                </>
              )}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {activeTab === 'sector_view'
                ? currentSectorInfo.description
                : activeTab === 'activity'
                ? 'Kapanış arşivi, kâr/zarar ve fişler'
                : activeTab === 'stock'
                ? 'Ürünler, mal giriş/çıkışları ve kritik stok alarmları'
                : 'Veresiye kartları, borç takibi ve WhatsApp hatırlatmaları'}
            </p>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span>Kasa Kapat &amp; Z Raporu</span>
            </button>
          </div>
        </div>
        )}

        {/* 7. View Content: Sector Specific View OR Activity Feed OR Stock Management OR Customers Ledger */}
        {activeTab === 'sector_view' && currentSector === 'berber_kuafor' ? (
          <BarberAppointmentsView
            appointments={appointments}
            onAddAppointment={handleAddAppointment}
            onCompleteAppointment={handleCompleteAppointment}
            onUpdateStatus={handleUpdateAppointmentStatus}
            onDeleteAppointment={handleDeleteAppointment}
            onFastWalkinCash={handleFastWalkinCash}
          />
        ) : activeTab === 'sector_view' && currentSector === 'kafe_restoran' ? (
          <RestaurantTablesView
            tables={tables}
            onAddOrderToTable={handleAddOrderToTable}
            onCheckoutTable={handleCheckoutTable}
            onResetTable={handleResetTable}
            onAddQuickExpense={handleAddQuickExpense}
          />
        ) : activeTab === 'sector_view' && currentSector === 'bakkal_market' ? (
          <FastRetailCounterView
            products={products}
            customers={customers}
            onQuickPosSale={handleQuickPosSale}
            onCreditSaleToCustomer={handleCreditSaleToCustomer}
          />
        ) : activeTab === 'sector_view' && currentSector === 'teknik_servis' ? (
          <RepairTicketsView
            repairTickets={repairTickets}
            onAddTicket={handleAddRepairTicket}
            onUpdateStatus={handleUpdateRepairStatus}
            onCompleteTicket={handleCompleteRepairTicket}
            onDeleteTicket={handleDeleteRepairTicket}
          />
        ) : activeTab === 'activity' ? (
          <div className="space-y-4">
            {/* Patron akışı: Gün Sonu özet kartı */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <Moon className="w-4 h-4 text-amber-500" /> Gün Sonu & Ciro
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Akşam kapanışı burada</p>
                {dailyClosings.length > 0 && (
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mt-1">
                    Son kapanış: {dailyClosings[0].date} — Net {formatCurrency(dailyClosings[0].netProfitToday || 0)} {dailyClosings[0].diffAmount !== 0 ? `(fark ${formatCurrency(dailyClosings[0].diffAmount)})` : '✓ denk'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsDailyClosingModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md shadow-amber-500/30 transition-colors cursor-pointer"
              >
                <Moon className="w-4 h-4 text-amber-400" /> Gün Sonu Kapat
              </button>
            </div>

            {/* Geçmiş gün sonu kapanışları — patron arşivi */}
            {dailyClosings.length > 0 && (
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-amber-500" /> Geçmiş Gün Sonu Kapanışları
                  </h3>
                  <span className="text-xs text-stone-400">{dailyClosings.length} kayıt</span>
                </div>
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {dailyClosings.slice(0, 14).map((c) => (
                    <div key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-stone-900 dark:text-white">{c.date}</span>
                        <span className="text-stone-400">({c.closedBy || 'Kasiyer'})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            c.diffAmount === 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : c.diffAmount > 0
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {c.diffAmount === 0 ? 'Denk' : c.diffAmount > 0 ? `+${formatCurrency(c.diffAmount)} Fazla` : `-${formatCurrency(Math.abs(c.diffAmount))} Açık`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-stone-400">Ciro <b className="text-emerald-600 dark:text-emerald-400">{formatCurrency(c.totalIncomeToday)}</b></span>
                        <span className="text-stone-400">Gider <b className="text-rose-600 dark:text-rose-400">{formatCurrency(c.todayExpense)}</b></span>
                        <span className="text-stone-400">Net <b className="text-amber-700 dark:text-amber-400">{formatCurrency(c.netProfitToday)}</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kasa farkları özeti: açık / fazla takibi */}
            {dailyClosings.length > 0 && (() => {
              const surplus = dailyClosings.filter((c) => c.diffAmount > 0).reduce((s, c) => s + c.diffAmount, 0);
              const deficit = dailyClosings.filter((c) => c.diffAmount < 0).reduce((s, c) => s + Math.abs(c.diffAmount), 0);
              const denk = dailyClosings.filter((c) => c.diffAmount === 0).length;
              return (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 sm:p-5">
                  <h3 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2 mb-3">
                    <Wallet className="w-4 h-4 text-amber-500" /> Kasa Farkları Takibi
                    <span className="text-[11px] font-semibold text-stone-400">({dailyClosings.length} kapanış)</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
                      <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase">Toplam Açık</p>
                      <p className="text-base font-black text-rose-700 dark:text-rose-300">{formatCurrency(deficit)}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
                      <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase">Toplam Fazla</p>
                      <p className="text-base font-black text-blue-700 dark:text-blue-300">{formatCurrency(surplus)}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Denk Kapanış</p>
                      <p className="text-base font-black text-emerald-700 dark:text-emerald-300">{denk} gün</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tedarikçi borçları: toptancı cari hesabı */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-500" /> Tedarikçi Borçları
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {suppliers.length === 0
                      ? 'Veresiye aldığın toptancıyı ekle'
                      : `Toplam ${formatCurrency(suppliers.filter((s) => s.balance > 0).reduce((sum, s) => sum + s.balance, 0))} borç`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openSupplierModal('form')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Tedarikçi
                </button>
              </div>
              {suppliers.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-3">
                  "Tedarikçi" butonuyla ilk hesabı aç.
                </p>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {suppliers.map((s) => (
                    <div key={s.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openSupplierModal('form', s)}
                          className="text-xs font-black text-stone-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 truncate cursor-pointer"
                          title="Düzenle"
                        >
                          {s.name}
                        </button>
                        <p className="text-[11px] text-stone-400 truncate">{s.phone || s.notes || '—'}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-black ${
                            s.balance > 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : s.balance < 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                          }`}
                        >
                          {s.balance > 0
                            ? `${formatCurrency(s.balance)} borç`
                            : s.balance < 0
                            ? `${formatCurrency(Math.abs(s.balance))} avans`
                            : 'Sıfır'}
                        </span>
                        <button
                          type="button"
                          onClick={() => openSupplierModal('purchase', s)}
                          className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-300 text-[11px] font-bold transition-colors cursor-pointer"
                          title="Veresiye mal alımı yaz (borcu artırır)"
                        >
                          Alım Yaz
                        </button>
                        <button
                          type="button"
                          onClick={() => openSupplierModal('pay', s)}
                          className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer"
                          title="Tedarikçiye ödeme yap (kasadan düşer)"
                        >
                          Öde
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(s.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Tedarikçiyi sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gider dağılımı: kalem kalem masraf özeti */}
            {(() => {
              const agg = new Map<string, number>();
              transactions
                .filter((tx) => tx.type === 'gider' || tx.type === 'masraf')
                .forEach((tx) => {
                  const k = (tx.category || 'Diğer').split('/')[0].trim() || 'Diğer';
                  agg.set(k, (agg.get(k) || 0) + tx.amount);
                });
              const rows = [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
              if (rows.length === 0) return null;
              const total = rows.reduce((s, [, v]) => s + v, 0) || 1;
              return (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 sm:p-5">
                  <h3 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2 mb-3">
                    <Banknote className="w-4 h-4 text-rose-500" /> Gider Dağılımı
                    <span className="text-[11px] font-semibold text-stone-400">({formatCurrency(total)} toplam)</span>
                  </h3>
                  <div className="space-y-2">
                    {rows.map(([label, val]) => (
                      <div key={label} className="flex items-center gap-2 text-xs">
                        <span className="w-32 sm:w-40 truncate font-bold text-stone-700 dark:text-stone-300">{label}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-rose-500 to-orange-400"
                            style={{ width: `${Math.max(4, Math.round((val / total) * 100))}%` }}
                          />
                        </div>
                        <span className="w-20 text-right font-black text-stone-800 dark:text-stone-200">{formatCurrency(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 sm:p-5 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-white">
                    Dükkan Kasa Hareketleri
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Tek tek fişler
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
                  "Para Al" veya "Para Ver" ile başlayın.
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
                          {(tx.type === 'gider' || tx.type === 'masraf') && tx.category && (
                            <>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold truncate max-w-[140px]">
                                {(tx.category || '').split('/')[0].trim()}
                              </span>
                            </>
                          )}
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
        ) : activeTab === 'customers' ? (
          <div className="space-y-4">
            {/* Müşteri sekmesine taşındı: günü gelen ödemeler */}
            {(cash.overdueCount > 0 || cash.dueTodayCount > 0) && (
              <UpcomingReminders
                customers={customers}
                onOpenWhatsApp={(cust, type) => openWhatsAppForCustomer(cust, type)}
                onOpenPayment={(cust) => openTransactionForCustomer(cust, 'tahsilat')}
              />
            )}
            <CustomerList
              customers={customers}
              onSelectCustomer={(cust) => {
                setSelectedCustomer(cust);
                setIsDetailModalOpen(true);
              }}
              onOpenTransaction={(cust, type) => openTransactionForCustomer(cust, type)}
              onOpenWhatsApp={(cust) => openWhatsAppForCustomer(cust)}
            />
          </div>
        ) : null}
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

      {/* 3b. Tedarikçi cari hesap Modal */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        mode={supplierModalMode}
        supplier={activeSupplier}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setActiveSupplier(null);
        }}
        onSave={handleSaveSupplier}
        onPurchase={handleSupplierPurchase}
        onPay={handleSupplierPay}
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

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
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
    </ErrorBoundary>
  );
}
