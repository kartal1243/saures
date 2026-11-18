import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Clock,
  Receipt,
  Sparkles,
  TrendingDown,
  X,
  QrCode,
  Crown,
  Search,
  Gift,
  ArrowRightLeft,
  Printer,
  FileText,
  Bell,
  DollarSign,
  UserCheck,
  Zap,
  RefreshCw,
  ArrowLeft,
  SlidersHorizontal,
  User,
  Ban,
  Landmark,
  Maximize2,
  Minimize2,
  Coins,
  LayoutGrid,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import type { CashRegister, Customer, MenuItem, RestaurantTable, Transaction } from '../../../shared/types.ts';
import { RestaurantMenuManager } from './RestaurantMenuManager';
import { TableQrMenuModal } from './TableQrMenuModal';
import { printHtmlDocument, escapeHtml } from '../../utils/printTemplate';

interface RestaurantTablesViewProps {
  tables: RestaurantTable[];
  storeName?: string;
  shopSlug?: string;
  shopLogoUrl?: string;
  isVip?: boolean;
  vipTier?: 'cirak' | 'usta' | 'patron';
  cash?: CashRegister;
  transactions?: Transaction[];
  onOpenVip?: () => void;
  onAddOrderToTable: (tableId: string, item: { name: string; quantity: number; unitPrice: number; isGift?: boolean; note?: string }) => Promise<void>;
  onCheckoutTable: (tableId: string, paymentMethod: 'nakit' | 'kart') => Promise<void>;
  onResetTable: (tableId: string) => Promise<void>;
  onAddQuickExpense: (description: string, amount: number) => Promise<void>;
  onAddTable: (name: string) => Promise<void>;
  onDeleteTable: (id: string) => Promise<void>;
  onTableStateChange?: (table: RestaurantTable) => void;
  onCheckoutComplete?: (payload: {
    table?: RestaurantTable;
    cash?: CashRegister;
    transaction?: Transaction;
    transactions?: Transaction[];
    customer?: Customer;
  }) => void;
  onRefreshData?: () => Promise<void> | void;
}

const SEYIR_DEFAULT_MENU: MenuItem[] = [
  { id: 'st_1', name: 'Normal Dürüm', price: 90, category: 'Dürüm', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_2', name: 'Mega Dürüm', price: 130, category: 'Dürüm', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_3', name: 'Doritos Dürüm', price: 120, category: 'Dürüm', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_4', name: 'Mega Doritos Dürüm', price: 150, category: 'Dürüm', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_5', name: 'Yarım Porsiyon Çiğ Köfte', price: 200, category: 'Porsiyon', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_6', name: 'Tam Porsiyon Çiğ Köfte', price: 280, category: 'Porsiyon', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_7', name: 'Aile Boyu (800gr)', price: 450, category: 'Porsiyon', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_8', name: '1 Kilo Çiğ Köfte', price: 560, category: 'Porsiyon', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_9', name: 'Köfte Ekmek', price: 200, category: 'Sıcak', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_10', name: 'Gözleme', price: 150, category: 'Gözleme & Tost', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_11', name: 'Bazlama Tost', price: 150, category: 'Gözleme & Tost', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_12', name: 'Gözleme Menüsü', price: 200, category: 'Gözleme & Tost', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_13', name: 'Bazlama Tost Menüsü', price: 200, category: 'Gözleme & Tost', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_14', name: 'Serpme Kahvaltı Tabağı', price: 250, category: 'Kahvaltı', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_15', name: 'Küçük Ayran', price: 20, category: 'İçecek', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_16', name: 'Büyük Ayran', price: 30, category: 'İçecek', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_17', name: '1L Ayran', price: 80, category: 'İçecek', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_18', name: 'Kola', price: 50, category: 'İçecek', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_19', name: '1L Kola', price: 90, category: 'İçecek', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_20', name: 'Fanta', price: 50, category: 'İçecek', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_21', name: 'Ice Tea', price: 50, category: 'İçecek', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_22', name: 'Fuse Tea', price: 50, category: 'İçecek', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_23', name: 'Su', price: 15, category: 'İçecek', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_24', name: 'Gazoz', price: 40, category: 'İçecek', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=240&auto=format&fit=crop&q=70' },
  { id: 'st_25', name: 'Ekstra Lavaş (Adet)', price: 5, category: 'Ekstralar', isAvailable: true },
  { id: 'st_26', name: 'Burger Sos', price: 10, category: 'Ekstralar', isAvailable: true },
];

type MainPosTab = 'tables' | 'pos' | 'z_report' | 'settings';
type ZoneFilter = 'Tümü' | 'Dolu' | 'Teras' | 'Bahçe / Seyir' | 'Salon' | 'Paket & Gel-Al';

function formatTrMoney(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function inferTableSection(table: RestaurantTable): string {
  if (table.section && table.section.trim()) return table.section.trim();
  const n = table.name.toLowerCase();
  if (n.includes('tezgah') || n.includes('gel-al') || n.includes('paket')) return 'Paket & Gel-Al';
  if (n.includes('teras')) return 'Teras';
  if (n.includes('bahçe') || n.includes('bahce') || n.includes('seyir')) return 'Bahçe / Seyir';
  return 'Salon';
}

function getCategoryEmoji(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('dürüm') || c.includes('durum')) return '🌯';
  if (c.includes('porsiyon')) return '🍽️';
  if (c.includes('sıcak') || c.includes('sicak') || c.includes('köfte')) return '🍔';
  if (c.includes('gözleme') || c.includes('tost')) return '🥪';
  if (c.includes('kahvalt')) return '🍳';
  if (c.includes('içecek') || c.includes('icecek')) return '🥤';
  if (c.includes('ekstra') || c.includes('sos')) return '🧀';
  if (c.includes('tatlı')) return '🍮';
  return '🍴';
}

function getCategoryColor(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('dürüm')) return 'bg-amber-100 text-amber-800';
  if (c.includes('porsiyon')) return 'bg-orange-100 text-orange-800';
  if (c.includes('sıcak')) return 'bg-rose-100 text-rose-800';
  if (c.includes('gözleme') || c.includes('tost')) return 'bg-yellow-100 text-yellow-800';
  if (c.includes('kahvalt')) return 'bg-lime-100 text-lime-800';
  if (c.includes('içecek')) return 'bg-sky-100 text-sky-800';
  return 'bg-stone-100 text-stone-700';
}

export const RestaurantTablesView: React.FC<RestaurantTablesViewProps> = ({
  tables,
  storeName,
  shopSlug,
  shopLogoUrl,
  isVip = false,
  vipTier,
  cash,
  transactions = [],
  onOpenVip,
  onAddOrderToTable,
  onCheckoutTable,
  onResetTable,
  onAddQuickExpense,
  onAddTable,
  onDeleteTable,
  onTableStateChange,
  onCheckoutComplete,
  onRefreshData,
}) => {
  const [tier, setTier] = useState<'cirak' | 'usta' | 'patron'>(
    vipTier || (isVip ? 'patron' : 'cirak')
  );
  const [profileFallback, setProfileFallback] = useState<{
    storeName?: string;
    slug?: string;
    logoUrl?: string;
  }>({});

  useEffect(() => {
    if (vipTier) {
      setTier(vipTier);
    } else if (isVip) {
      setTier('patron');
    }
  }, [vipTier, isVip]);

  useEffect(() => {
    let active = true;
    fetch('/api/shop-profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const prof = data?.profile || data?.shopProfile;
        if (active && prof) {
          const profileTier = prof.vipTier || (prof.isVip ? 'patron' : 'cirak');
          setTier(profileTier);
          setProfileFallback({
            storeName: prof.storeName,
            slug: prof.slug,
            logoUrl: prof.logoUrl,
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const effectiveStoreName = storeName || profileFallback.storeName || 'Dükkanım Kafe & Restoran';
  const effectiveShopSlug = shopSlug || profileFallback.slug || '';
  const effectiveShopLogoUrl = shopLogoUrl || profileFallback.logoUrl || '';
  const maxTables = tier === 'patron' ? Infinity : tier === 'usta' ? 10 : 3;

  // Ana Görünüm ve Tam Ekran Durumu
  const [mainTab, setMainTab] = useState<MainPosTab>('tables');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('Tümü');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Menü & Katalog
  const [menuItems, setMenuItems] = useState<MenuItem[]>(SEYIR_DEFAULT_MENU);
  const [hasCustomServerMenu, setHasCustomServerMenu] = useState(false);
  const [selectedMenuCat, setSelectedMenuCat] = useState<string>('Tümü');
  const [menuSearchFilter, setMenuSearchFilter] = useState('');

  // Adisyon Sağ Panel İndirim, Parçalı / Alınan Tutar ve Müşteri/Not
  const [discountType, setDiscountType] = useState<'none' | 'p10' | 'p20' | 'custom'>('none');
  const [customDiscountTry, setCustomDiscountTry] = useState<string>('');
  const [receivedAmountInput, setReceivedAmountInput] = useState<string>('');
  const [customerNoteInput, setCustomerNoteInput] = useState<string>('');
  const [adisyonNoteInput, setAdisyonNoteInput] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Alt Modallar & Yardımcı Dialoglar
  const [detailModalItem, setDetailModalItem] = useState<MenuItem | null>(null);
  const [detailQty, setDetailQty] = useState<number>(1);
  const [detailNote, setDetailNote] = useState<string>('');
  const [detailIsGift, setDetailIsGift] = useState<boolean>(false);

  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<string>('');
  const [customItemNote, setCustomItemNote] = useState('');
  const [saveCustomToMenu, setSaveCustomToMenu] = useState(false);

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTargetTableId, setMoveTargetTableId] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');
  const [splitCredit, setSplitCredit] = useState<string>('');
  const [splitCustomerId, setSplitCustomerId] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrTargetTable, setQrTargetTable] = useState<RestaurantTable | null>(null);

  const [newTableName, setNewTableName] = useState('');
  const [newTableSection, setNewTableSection] = useState('Salon');
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const loadPosDependencies = async () => {
    try {
      const [menuRes, custRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/customers'),
      ]);
      if (menuRes.ok) {
        const data = await menuRes.json();
        if (Array.isArray(data.menuItems) && data.menuItems.length > 0) {
          setMenuItems(data.menuItems);
          setHasCustomServerMenu(true);
        } else {
          setHasCustomServerMenu(false);
          setMenuItems(SEYIR_DEFAULT_MENU);
        }
      }
      if (custRes.ok) {
        const data = await custRes.json();
        if (Array.isArray(data.customers)) {
          setCustomers(data.customers);
        }
      }
    } catch (err) {
      console.error('POS data load error:', err);
    }
  };

  useEffect(() => {
    loadPosDependencies();
  }, []);

  // ESC ile tam ekrandan çıkış
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  // Seçili masa (yoksa ilk tezgah veya ilk masa)
  const activeTable: RestaurantTable | null = useMemo(() => {
    if (selectedTableId) {
      const found = tables.find((t) => t.id === selectedTableId);
      if (found) return found;
    }
    const tezgah = tables.find((t) => t.name.toLowerCase().includes('tezgah'));
    return tezgah || tables[0] || null;
  }, [tables, selectedTableId]);

  useEffect(() => {
    if (activeTable) {
      setCustomerNoteInput(activeTable.customerName || '');
      setAdisyonNoteInput(activeTable.note || '');
      setDiscountType('none');
      setCustomDiscountTry('');
      setReceivedAmountInput('');
    }
  }, [activeTable?.id]);

  // Kasa ve Ciro Özetleri
  const occupiedCount = tables.filter((t) => t.isOccupied).length;
  const totalOpenAdisyon = tables.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const activeCallCount = tables.filter((t) => Boolean(t.activeCall)).length;

  const todayPrefix = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const todayIncomeTxs = useMemo(() => {
    return transactions.filter((tx) => tx.type === 'tahsilat' && tx.date?.startsWith(todayPrefix));
  }, [transactions, todayPrefix]);

  const todayTotalIncome = cash?.todayTotalIncome ?? todayIncomeTxs.reduce((s, t) => s + t.amount, 0);
  const todayCash = cash?.todayCash ?? todayIncomeTxs.filter((t) => t.paymentMethod === 'nakit').reduce((s, t) => s + t.amount, 0);
  const todayCard = cash?.todayCard ?? todayIncomeTxs.filter((t) => t.paymentMethod === 'kart').reduce((s, t) => s + t.amount, 0);
  const todayBank = cash?.todayBank ?? todayIncomeTxs.filter((t) => t.paymentMethod === 'havale').reduce((s, t) => s + t.amount, 0);
  const todayReceiptCount = todayIncomeTxs.length;

  // Bölge filtrelenmiş masalar
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (zoneFilter === 'Tümü') return true;
      if (zoneFilter === 'Dolu') return t.isOccupied || Boolean(t.activeCall);
      return inferTableSection(t) === zoneFilter;
    });
  }, [tables, zoneFilter]);

  // Menü kategorileri ve filtreleme
  const menuCategories = useMemo(() => {
    return ['Tümü', ...Array.from(new Set(menuItems.map((m) => m.category || 'Genel')))];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    const q = menuSearchFilter.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCat = selectedMenuCat === 'Tümü' || item.category === selectedMenuCat;
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedMenuCat, menuSearchFilter]);

  // Adisyon Tutar & İndirim Hesapları
  const subtotalAmount = activeTable ? activeTable.totalAmount : 0;
  const computedDiscount = useMemo(() => {
    if (subtotalAmount <= 0) return 0;
    if (discountType === 'p10') return Math.round(subtotalAmount * 0.1 * 100) / 100;
    if (discountType === 'p20') return Math.round(subtotalAmount * 0.2 * 100) / 100;
    if (discountType === 'custom') {
      const val = Number(customDiscountTry) || 0;
      return Math.min(subtotalAmount, Math.max(0, val));
    }
    return 0;
  }, [subtotalAmount, discountType, customDiscountTry]);

  const payableAmount = Math.max(0, subtotalAmount - computedDiscount);
  const receivedNum = Number(receivedAmountInput) || 0;
  const changeDue = receivedNum > payableAmount ? receivedNum - payableAmount : 0;

  const adisyonGiftsTotal = activeTable
    ? activeTable.orders.filter((o) => o.isGift).reduce((sum, o) => sum + o.quantity * o.unitPrice, 0)
    : 0;

  // İşlemler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadPosDependencies(), Promise.resolve(onRefreshData?.())]);
      showToast('Masalar ve kasa verileri yenilendi');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenQuickSale = async () => {
    const tezgah = tables.find((t) => t.name.toLowerCase().includes('tezgah')) || tables[0];
    if (tezgah) {
      setSelectedTableId(tezgah.id);
      setMainTab('pos');
      return;
    }
    // Henüz hiç masa yoksa otomatik Tezgah (Hızlı Satış) aç
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Tezgah (Hızlı Satış)', section: 'Paket & Gel-Al' }),
      });
      if (res.status === 403) {
        onOpenVip?.();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.table) {
          onTableStateChange?.(data.table);
          setSelectedTableId(data.table.id);
          setMainTab('pos');
        }
      }
    } catch {
      await onAddTable('Tezgah (Hızlı Satış)');
      setMainTab('pos');
    }
  };

  const handleSetupSeyirPreset = async () => {
    setIsLoadingPreset(true);
    try {
      const res = await fetch('/api/tables/setup-seyir-preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (Array.isArray(data.tables)) {
          data.tables.forEach((t: RestaurantTable) => onTableStateChange?.(t));
        }
        await onRefreshData?.();
        showToast(
          data.createdCount > 0
            ? `${data.createdCount} adet Seyir Terası masası oluşturuldu`
            : 'Tüm hazır masalar zaten ekli'
        );
      } else {
        alert(data.error || 'Masalar yüklenemedi.');
      }
    } finally {
      setIsLoadingPreset(false);
    }
  };

  const handleQuickAdd = async (name: string, price: number, qty = 1, note?: string, isGift?: boolean) => {
    if (!activeTable) {
      showToast('Lütfen önce bir masa veya Hızlı Satış seçin');
      return;
    }
    await onAddOrderToTable(activeTable.id, {
      name,
      quantity: qty,
      unitPrice: price,
      ...(note ? { note } : {}),
      ...(isGift ? { isGift: true } : {}),
    });
  };

  const handleSaveNoteAndCustomer = async (nextCust?: string, nextNote?: string) => {
    if (!activeTable) return;
    try {
      const res = await fetch(`/api/tables/${encodeURIComponent(activeTable.id)}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: nextCust !== undefined ? nextCust : customerNoteInput,
          note: nextNote !== undefined ? nextNote : adisyonNoteInput,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.table) onTableStateChange?.(data.table);
      }
    } catch (err) {
      console.error('Note save error:', err);
    }
  };

  const handleToggleGift = async (orderId: string, currentGiftStatus?: boolean) => {
    if (!activeTable) return;
    try {
      const res = await fetch(`/api/tables/${encodeURIComponent(activeTable.id)}/orders/${encodeURIComponent(orderId)}/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isGift: !currentGiftStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.table) onTableStateChange?.(data.table);
      }
    } catch (err) {
      console.error('Toggle gift error:', err);
    }
  };

  const handleClearCall = async (tableId: string) => {
    try {
      const res = await fetch(`/api/tables/${encodeURIComponent(tableId)}/clear-call`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.table) onTableStateChange?.(data.table);
      }
    } catch (e) {
      console.error('Clear call error:', e);
    }
  };

  const handleDirectCheckout = async (method: 'nakit' | 'kart' | 'havale', partialAmount?: number) => {
    if (!activeTable || activeTable.totalAmount <= 0 || isCheckingOut) return;

    // Eski prop callback üzerinden sade nakit/kart ve indirim yoksa geriye dönük uyumu koru
    if (!partialAmount && computedDiscount === 0 && method !== 'havale') {
      setIsCheckingOut(true);
      try {
        await onCheckoutTable(activeTable.id, method);
        setDiscountType('none');
        setCustomDiscountTry('');
        setReceivedAmountInput('');
        setMainTab('tables');
        showToast(`${activeTable.name} hesabı ${method === 'kart' ? 'Kart' : 'Nakit'} ile kapatıldı`);
      } finally {
        setIsCheckingOut(false);
      }
      return;
    }

    setIsCheckingOut(true);
    try {
      const payAmt = partialAmount && partialAmount > 0 ? Math.min(payableAmount, partialAmount) : payableAmount;
      const isFull = payAmt >= payableAmount;
      const res = await fetch(`/api/tables/${encodeURIComponent(activeTable.id)}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: method,
          amount: payAmt,
          discountAmount: computedDiscount,
          closeTable: isFull,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Hesap kapatılamadı.');
        return;
      }
      onCheckoutComplete?.(data);
      setDiscountType('none');
      setCustomDiscountTry('');
      setReceivedAmountInput('');
      if (data.isFullClose) {
        setMainTab('tables');
        showToast(`${activeTable.name} hesabı kapatıldı (${formatTrMoney(payAmt)} ₺)`);
      } else {
        showToast(`Parçalı ödeme alındı: ${formatTrMoney(payAmt)} ₺`);
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePartialButton = (method: 'nakit' | 'kart') => {
    if (!activeTable || activeTable.totalAmount <= 0) return;
    if (receivedNum > 0 && receivedNum < payableAmount) {
      handleDirectCheckout(method, receivedNum);
      return;
    }
    if (method === 'nakit') {
      setSplitCash(String(payableAmount));
      setSplitCard('');
    } else {
      setSplitCard(String(payableAmount));
      setSplitCash('');
    }
    setSplitCredit('');
    setIsSplitModalOpen(true);
  };

  const handleSplitPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTable) return;

    const cashNum = Number(splitCash) || 0;
    const cardNum = Number(splitCard) || 0;
    const creditNum = Number(splitCredit) || 0;
    const totalSubmit = cashNum + cardNum + creditNum;

    if (totalSubmit <= 0) {
      alert('Lütfen en az bir ödeme tutarı giriniz.');
      return;
    }
    if (creditNum > 0 && !splitCustomerId) {
      alert('Veresiye ödeme için lütfen bir müşteri seçiniz.');
      return;
    }

    const payments: Array<{ method: 'nakit' | 'kart' | 'veresiye'; amount: number; customerId?: string }> = [];
    if (cashNum > 0) payments.push({ method: 'nakit', amount: cashNum });
    if (cardNum > 0) payments.push({ method: 'kart', amount: cardNum });
    if (creditNum > 0) payments.push({ method: 'veresiye', amount: creditNum, customerId: splitCustomerId });

    setIsCheckingOut(true);
    try {
      const res = await fetch(`/api/tables/${encodeURIComponent(activeTable.id)}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments,
          discountAmount: computedDiscount,
          closeTable: totalSubmit >= payableAmount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onCheckoutComplete?.(data);
        setIsSplitModalOpen(false);
        setSplitCash('');
        setSplitCard('');
        setSplitCredit('');
        setSplitCustomerId('');
        setDiscountType('none');
        setCustomDiscountTry('');
        if (data.isFullClose) {
          setMainTab('tables');
        }
        showToast('Parçalı tahsilat kaydedildi');
      } else {
        alert(data.error || 'Tahsilat gerçekleştirilemedi.');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleMoveTable = async () => {
    if (!activeTable || !moveTargetTableId || isMoving) return;
    setIsMoving(true);
    try {
      const res = await fetch(`/api/tables/${encodeURIComponent(activeTable.id)}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTableId: moveTargetTableId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.sourceTable) onTableStateChange?.(data.sourceTable);
        if (data.targetTable) {
          onTableStateChange?.(data.targetTable);
          setSelectedTableId(data.targetTable.id);
        }
        setIsMoveModalOpen(false);
        setMoveTargetTableId('');
        showToast('Masa siparişleri taşındı');
      } else {
        alert(data.error || 'Masa aktarılamadı.');
      }
    } finally {
      setIsMoving(false);
    }
  };

  const handleCustomItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTable || !customItemName.trim() || !customItemPrice) return;
    const priceNum = Number(customItemPrice);
    const nameTrim = customItemName.trim();
    if (priceNum <= 0) return;

    await onAddOrderToTable(activeTable.id, {
      name: nameTrim,
      quantity: 1,
      unitPrice: priceNum,
      ...(customItemNote.trim() ? { note: customItemNote.trim() } : {}),
    });

    if (saveCustomToMenu) {
      try {
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameTrim,
            price: priceNum,
            category: 'Ekstralar',
            isAvailable: true,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.menuItems)) {
            setMenuItems(data.menuItems);
            setHasCustomServerMenu(true);
          }
        }
      } catch {}
    }

    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemNote('');
    setSaveCustomToMenu(false);
    setIsCustomItemModalOpen(false);
  };

  const handleAddTableWithSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim() || isAddingTable) return;
    if (tables.length >= maxTables) {
      onOpenVip?.();
      return;
    }
    setIsAddingTable(true);
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTableName.trim(), section: newTableSection }),
      });
      if (res.status === 403) {
        onOpenVip?.();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.table) onTableStateChange?.(data.table);
        setNewTableName('');
        showToast(`"${newTableName.trim()}" eklendi`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Masa eklenemedi.');
      }
    } finally {
      setIsAddingTable(false);
    }
  };

  const handleSaveDefaultCatalogToServer = async () => {
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: SEYIR_DEFAULT_MENU.map(({ name, price, category, imageUrl }) => ({
          name,
          price,
          category,
          imageUrl,
          isAvailable: true,
        })),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.menuItems)) {
        setMenuItems(data.menuItems);
        setHasCustomServerMenu(true);
        showToast('Seyir Terası menüsü işletme menünüze kaydedildi');
      }
    }
  };

  const shortActiveTableLabel = activeTable
    ? activeTable.name.split(' ')[0]
    : 'Tezgah';

  return (
    <div
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 overflow-y-auto p-3 sm:p-5'
          : 'min-h-screen p-3 sm:p-5'
      } bg-[#f6f2e8] text-stone-900 font-sans transition-all flex flex-col gap-3.5`}
    >
      {/* Canlı Toast Bildirimi */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-70 px-4 py-2.5 rounded-xl bg-[#14532d] text-white text-xs font-black shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ÜST BAŞLIK + SAĞ KONTROLLER */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-[#14532d] tracking-tight">
            Adisyon &amp; Kasa
          </h1>
          <span className="hidden sm:inline-block text-xs font-bold text-stone-500 bg-[#ece6d8] px-2.5 py-1 rounded-full">
            {effectiveStoreName}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {activeCallCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setZoneFilter('Dolu');
                setMainTab('tables');
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black flex items-center gap-1.5 animate-pulse cursor-pointer shadow-xs"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{activeCallCount} Çağrı</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenQuickSale}
            className="px-4 py-2 rounded-xl bg-[#f5be35] hover:bg-[#eab020] text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform active:scale-97"
          >
            <Zap className="w-3.5 h-3.5 fill-stone-950" />
            <span>Hızlı Satış</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 border border-[#e3dccb] text-stone-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title={isFullscreen ? 'Tam Ekrandan Çık (ESC)' : 'Tam Ekran Adisyon Modu'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Küçült' : 'Tam Ekran'}</span>
          </button>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 pl-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>canlı</span>
          </span>
        </div>
      </header>

      {/* 5 ÖZET KARTI (Açık Masa, Bugün Ciro, Nakit, Kredi Kartı, IBAN / Havale) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <div className="bg-white rounded-2xl border border-[#ebe4d3] border-l-4 border-l-rose-600 px-3.5 py-2.5 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black text-stone-900 leading-tight">
              {occupiedCount} Masa
            </div>
            <div className="text-[11px] font-semibold text-stone-500 truncate">
              Açık (₺{formatTrMoney(totalOpenAdisyon)})
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#ebe4d3] border-l-4 border-l-amber-400 px-3.5 py-2.5 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black text-stone-900 leading-tight">
              ₺{formatTrMoney(todayTotalIncome)}
            </div>
            <div className="text-[11px] font-semibold text-stone-500 truncate">
              Bugün Ciro ({todayReceiptCount} fiş)
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#ebe4d3] border-l-4 border-l-emerald-600 px-3.5 py-2.5 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Banknote className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black text-stone-900 leading-tight">
              ₺{formatTrMoney(todayCash)}
            </div>
            <div className="text-[11px] font-semibold text-stone-500 truncate">Nakit</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#ebe4d3] border-l-4 border-l-blue-600 px-3.5 py-2.5 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black text-stone-900 leading-tight">
              ₺{formatTrMoney(todayCard)}
            </div>
            <div className="text-[11px] font-semibold text-stone-500 truncate">Kredi Kartı</div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-[#ebe4d3] border-l-4 border-l-purple-700 px-3.5 py-2.5 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black text-stone-900 leading-tight">
              ₺{formatTrMoney(todayBank)}
            </div>
            <div className="text-[11px] font-semibold text-stone-500 truncate">IBAN / Havale</div>
          </div>
        </div>
      </section>

      {/* 4 ANA SEKME ÇUBUĞU + YENİLE */}
      <nav className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="bg-[#e8e1d1] p-1 rounded-2xl inline-flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setMainTab('tables')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
              mainTab === 'tables'
                ? 'bg-[#14532d] text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-950 hover:bg-white/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Masalar</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('pos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
              mainTab === 'pos'
                ? 'bg-[#14532d] text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-950 hover:bg-white/50'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Kasa / Adisyon</span>
            <span className="px-2 py-0.5 rounded-md bg-[#f5be35] text-stone-950 text-[10px] font-black">
              {shortActiveTableLabel}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('z_report')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
              mainTab === 'z_report'
                ? 'bg-[#14532d] text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-950 hover:bg-white/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Z Raporu &amp; Geçmiş</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
              mainTab === 'settings'
                ? 'bg-[#14532d] text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-950 hover:bg-white/50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Masa &amp; Menü Ayarı</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 rounded-xl bg-[#14532d] hover:bg-[#0f4022] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </nav>

      {/* ========================================================= */}
      {/* SEKME 1: MASALAR EKRANI (SEYİR TERASI 8 SÜTUNLU PLAN)     */}
      {/* ========================================================= */}
      {mainTab === 'tables' && (
        <div className="space-y-3.5 flex-1">
          {/* Bölge Filtre Hapları */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: 'Tümü', label: 'Tümü' },
                { key: 'Dolu', label: '🔥 Dolu Masalar' },
                { key: 'Teras', label: '🌅 Teras' },
                { key: 'Bahçe / Seyir', label: '🌳 Bahçe / Seyir' },
                { key: 'Salon', label: '🏠 Salon' },
                { key: 'Paket & Gel-Al', label: '🛵 Paket & Gel-Al' },
              ] as const
            ).map((f) => {
              const isActive = zoneFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setZoneFilter(f.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#b91c1c] text-white border-[#991b1b] shadow-xs'
                      : 'bg-white text-stone-700 border-[#e2dac8] hover:border-stone-400'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {tables.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-[#ded6c4] p-8 sm:p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#f6f2e8] text-[#14532d] flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-black text-stone-900">Henüz Masa Tanımlı Değil</h2>
                <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                  Tek tıkla Tezgah, Gel-Al, Paket Servis, Teras, Bahçe ve Salon masalarından oluşan hazır düzeni yükleyebilir veya Masa Ayarı sekmesinden tek tek ekleyebilirsiniz.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isLoadingPreset}
                  onClick={handleSetupSeyirPreset}
                  className="px-5 py-2.5 rounded-xl bg-[#14532d] hover:bg-[#0f4022] text-white text-xs font-black cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {isLoadingPreset ? 'Yükleniyor...' : '✨ Hazır Masa Düzenini Yükle (Tezgah, Teras, Salon)'}
                </button>
                <button
                  type="button"
                  onClick={() => setMainTab('settings')}
                  className="px-4 py-2.5 rounded-xl bg-[#f5be35] text-stone-950 text-xs font-black cursor-pointer"
                >
                  + Manuel Masa Ekle
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3">
              {filteredTables.map((table) => {
                const section = inferTableSection(table);
                const isOccupied = table.isOccupied;
                const hasCall = Boolean(table.activeCall);
                return (
                  <div
                    key={table.id}
                    onClick={() => {
                      setSelectedTableId(table.id);
                      setMainTab('pos');
                    }}
                    className={`rounded-2xl border p-3.5 flex flex-col justify-between min-h-[126px] cursor-pointer transition-all shadow-2xs hover:shadow-md ${
                      hasCall
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400/50'
                        : isOccupied
                        ? 'bg-[#fff7ed] border-[#ea580c] hover:border-[#c2410c]'
                        : 'bg-white border-[#e6dfd0] hover:border-[#14532d]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-stone-400 truncate">
                          {section}
                        </span>

                        {hasCall ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearCall(table.id);
                            }}
                            className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black animate-pulse shrink-0 cursor-pointer"
                            title="Çağrıyı kapat"
                          >
                            {table.activeCall === 'bill' ? '💳 Hesap' : '🔔 Garson'}
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                              isOccupied
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isOccupied ? 'Dolu' : 'Müsait'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-black text-stone-900 mt-1.5 leading-snug line-clamp-2">
                        {table.name}
                      </h3>
                      <p className="text-[10px] text-stone-400 mt-0.5 truncate">
                        {isOccupied
                          ? `${table.orders.length} kalem${table.openedAt ? ` • ${table.openedAt}` : ''}`
                          : 'Sipariş açmak için dokun'}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-dashed border-[#e8e1d1] flex items-center justify-between text-[11px]">
                      {isOccupied ? (
                        <>
                          <span className="font-black text-[#b91c1c]">
                            ₺{formatTrMoney(table.totalAmount)}
                          </span>
                          <span className="font-black text-[#14532d]">Aç →</span>
                        </>
                      ) : (
                        <>
                          <span className="text-stone-400 font-semibold">Boş Masa</span>
                          <span className="font-black text-[#14532d]">+ Aç</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SEKME 2: KASA / ADİSYON (2 SÜTUNLU TAM EKRAN POS)          */}
      {/* ========================================================= */}
      {mainTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] xl:grid-cols-[1.45fr_1fr] gap-4 flex-1 items-start">
          {/* SOL SÜTUN: ÜRÜN ARAMA, KATEGORİLER VE 5 SÜTUNLU ÜRÜN KATALOĞU */}
          <div className="bg-white rounded-3xl border border-[#e6dfd0] p-4 shadow-2xs space-y-3.5">
            {/* Arama + Özel Tutar */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={menuSearchFilter}
                  onChange={(e) => setMenuSearchFilter(e.target.value)}
                  placeholder="Ürün ara (Dürüm, Porsiyon, Ayran)..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#e2dac8] bg-[#faf8f3] text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#14532d]/30"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsCustomItemModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#f5be35] hover:bg-[#eab020] text-stone-950 text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Özel Tutar</span>
              </button>
            </div>

            {/* Kategori Filtreleri */}
            <div className="flex flex-wrap items-center gap-1.5">
              {menuCategories.map((cat) => {
                const active = selectedMenuCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedMenuCat(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black border cursor-pointer transition-all flex items-center gap-1 ${
                      active
                        ? 'bg-[#14532d] text-white border-[#14532d]'
                        : 'bg-white text-stone-700 border-[#e2dac8] hover:border-stone-400'
                    }`}
                  >
                    {cat !== 'Tümü' && <span>{getCategoryEmoji(cat)}</span>}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            {/* Ürün Kartları Izgarası */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 max-h-[62vh] overflow-y-auto pr-0.5">
              {filteredMenuItems.map((item) => {
                const disabled = item.isAvailable === false;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-2.5 flex flex-col justify-between transition-all ${
                      disabled
                        ? 'bg-stone-100 border-stone-200 opacity-50'
                        : 'bg-[#fdfcf9] border-[#ebe4d3] hover:border-[#14532d]/40 hover:shadow-xs'
                    }`}
                  >
                    <div
                      onClick={() => !disabled && handleQuickAdd(item.name, item.price)}
                      className="flex items-start gap-2 cursor-pointer"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-stone-200"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-base ${getCategoryColor(item.category || '')}`}>
                          {getCategoryEmoji(item.category || '')}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[11px] font-black text-stone-900 leading-tight line-clamp-2">
                          {item.name}
                        </h4>
                        <div className="text-xs font-black text-[#b91c1c] mt-1">
                          ₺{formatTrMoney(item.price)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-[#f0eadc]">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleQuickAdd(item.name, item.price)}
                        className="py-1 rounded-lg bg-[#f3f0e6] hover:bg-[#14532d] hover:text-white text-[#14532d] text-[10px] font-black cursor-pointer transition-colors disabled:cursor-not-allowed"
                      >
                        + Ekle
                      </button>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setDetailModalItem(item);
                          setDetailQty(1);
                          setDetailNote('');
                          setDetailIsGift(false);
                        }}
                        className="py-1 rounded-lg bg-[#faf7ee] hover:bg-amber-100 text-stone-700 text-[10px] font-bold cursor-pointer transition-colors disabled:cursor-not-allowed"
                      >
                        ⚙ Detay
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SAĞ SÜTUN: AKTİF MASA ADİSYONU & HIZLI HESAP KAPATMA TERMİNALİ */}
          <div className="bg-white rounded-3xl border border-[#e6dfd0] p-4 shadow-2xs flex flex-col gap-3">
            {!activeTable ? (
              <div className="py-12 text-center space-y-3">
                <Receipt className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-sm font-black text-stone-700">Seçili Masa Yok</p>
                <button
                  type="button"
                  onClick={handleOpenQuickSale}
                  className="px-4 py-2 rounded-xl bg-[#f5be35] text-stone-950 text-xs font-black cursor-pointer"
                >
                  ⚡ Tezgah (Hızlı Satış) Aç
                </button>
              </div>
            ) : (
              <>
                {/* Sağ Üst Başlık: Geri, Masa Adı, + Ürün Ekle, Taşı, Fiş */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#efe9da]">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setMainTab('tables')}
                      className="w-8 h-8 rounded-full border border-[#e2dac8] hover:bg-stone-100 flex items-center justify-center text-stone-700 cursor-pointer shrink-0"
                      title="Masalar Ekranına Dön"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-stone-900 truncate">
                        {activeTable.name} ({inferTableSection(activeTable)})
                      </h3>
                      <p className="text-[11px] font-semibold text-stone-500">
                        {activeTable.isOccupied
                          ? `Açılış ${activeTable.openedAt || 'Bugün'} • ${activeTable.orders.length} Kalem`
                          : 'Yeni Adisyon'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCustomItemModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#f5be35] hover:bg-[#eab020] text-stone-950 text-[11px] font-black cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ürün Ekle</span>
                    </button>

                    <button
                      type="button"
                      disabled={activeTable.orders.length === 0}
                      onClick={() => setIsMoveModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#e2dac8] hover:bg-stone-50 text-stone-700 text-[11px] font-bold cursor-pointer flex items-center gap-1 disabled:opacity-40"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Taşı</span>
                    </button>

                    <button
                      type="button"
                      disabled={activeTable.orders.length === 0}
                      onClick={() => setIsReceiptModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#14532d] hover:bg-[#0f4022] text-white text-[11px] font-black cursor-pointer flex items-center gap-1 disabled:opacity-40"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Fiş</span>
                    </button>
                  </div>
                </div>

                {/* Müşteri Adı / Tel ve Adisyon / Adres Notu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerNoteInput}
                      onChange={(e) => setCustomerNoteInput(e.target.value)}
                      onBlur={() => handleSaveNoteAndCustomer(customerNoteInput, adisyonNoteInput)}
                      placeholder="Müşteri adı / Tel"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#e2dac8] bg-[#faf8f3] text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-[#14532d]"
                    />
                  </div>
                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adisyonNoteInput}
                      onChange={(e) => setAdisyonNoteInput(e.target.value)}
                      onBlur={() => handleSaveNoteAndCustomer(customerNoteInput, adisyonNoteInput)}
                      placeholder="Adisyon / adres notu"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#e2dac8] bg-[#faf8f3] text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-[#14532d]"
                    />
                  </div>
                </div>

                {/* Sipariş Kalemleri */}
                <div className="min-h-[160px] max-h-[240px] overflow-y-auto divide-y divide-[#f0eadc] border-y border-[#f0eadc] py-1">
                  {activeTable.orders.length === 0 ? (
                    <div className="py-10 text-center space-y-1.5 text-stone-400">
                      <Receipt className="w-8 h-8 mx-auto text-stone-300" />
                      <p className="text-xs font-bold text-stone-500">Bu masada henüz ürün yok.</p>
                      <p className="text-[11px]">Ürün eklemek için sol menüden seçim yapın.</p>
                    </div>
                  ) : (
                    activeTable.orders.map((ord) => (
                      <div key={ord.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-black text-stone-900 truncate ${ord.isGift ? 'line-through text-stone-400' : ''}`}>
                              {ord.name}
                            </span>
                            {ord.isGift && (
                              <span className="px-1.5 py-0.5 rounded-sm bg-emerald-600 text-white text-[9px] font-black">
                                İKRAM
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-500">
                            ₺{formatTrMoney(ord.unitPrice)} {ord.note ? `• ${ord.note}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleGift(ord.id, ord.isGift)}
                            className={`p-1 rounded-lg cursor-pointer ${
                              ord.isGift ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={ord.isGift ? 'İkramı Kaldır' : 'İkram Yap'}
                          >
                            <Gift className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center border border-[#e2dac8] rounded-lg bg-[#faf8f3]">
                            <button
                              type="button"
                              onClick={() =>
                                onAddOrderToTable(activeTable.id, {
                                  name: ord.name,
                                  quantity: -1,
                                  unitPrice: ord.unitPrice,
                                  isGift: ord.isGift,
                                })
                              }
                              className="px-2 py-1 text-stone-700 hover:bg-stone-200 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-black text-stone-900">{ord.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                onAddOrderToTable(activeTable.id, {
                                  name: ord.name,
                                  quantity: 1,
                                  unitPrice: ord.unitPrice,
                                  isGift: ord.isGift,
                                })
                              }
                              className="px-2 py-1 text-stone-700 hover:bg-stone-200 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className={`font-black min-w-[58px] text-right ${ord.isGift ? 'text-emerald-700' : 'text-stone-900'}`}>
                            ₺{formatTrMoney(ord.total)}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              onAddOrderToTable(activeTable.id, {
                                name: ord.name,
                                quantity: -ord.quantity,
                                unitPrice: ord.unitPrice,
                                isGift: ord.isGift,
                              })
                            }
                            className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                            title="Kalemi sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* İndirim Çubuğu */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-bold text-stone-600 mr-1">İndirim:</span>
                  <button
                    type="button"
                    onClick={() => setDiscountType(discountType === 'p10' ? 'none' : 'p10')}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                      discountType === 'p10'
                        ? 'bg-[#14532d] text-white border-[#14532d]'
                        : 'bg-white text-stone-700 border-[#e2dac8]'
                    }`}
                  >
                    %10
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType(discountType === 'p20' ? 'none' : 'p20')}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                      discountType === 'p20'
                        ? 'bg-[#14532d] text-white border-[#14532d]'
                        : 'bg-white text-stone-700 border-[#e2dac8]'
                    }`}
                  >
                    %20
                  </button>
                  <input
                    type="number"
                    min="0"
                    placeholder="₺ İndirim"
                    value={discountType === 'custom' ? customDiscountTry : ''}
                    onChange={(e) => {
                      setDiscountType(e.target.value ? 'custom' : 'none');
                      setCustomDiscountTry(e.target.value);
                    }}
                    className="w-24 px-2.5 py-1 rounded-lg border border-[#e2dac8] bg-white text-xs font-bold text-stone-900"
                  />
                  {discountType !== 'none' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('none');
                        setCustomDiscountTry('');
                      }}
                      className="px-2 py-1 rounded-lg border border-[#e2dac8] text-stone-600 hover:bg-stone-100 cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Ara Toplam & Ödenecek Tutar Kutusu */}
                <div className="rounded-2xl bg-[#f7f3ea] border border-[#e9e1cf] px-3.5 py-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-stone-600 font-semibold">
                    <span>Ara Toplam</span>
                    <span>₺{formatTrMoney(subtotalAmount)}</span>
                  </div>
                  {computedDiscount > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                      <span>İndirim</span>
                      <span>-₺{formatTrMoney(computedDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-[#e7dfcd]">
                    <span className="text-xs font-black text-stone-900 uppercase tracking-wide">
                      ÖDENECEK TUTAR
                    </span>
                    <span className="text-xl font-black text-[#b91c1c]">
                      ₺{formatTrMoney(payableAmount)}
                    </span>
                  </div>
                </div>

                {/* Alınan / Parçalı ₺ + Banknot Butonları */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-bold text-stone-600">Alınan / Parçalı ₺:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Tutar..."
                    value={receivedAmountInput}
                    onChange={(e) => setReceivedAmountInput(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-xl border border-[#e2dac8] bg-white text-xs font-black text-stone-900"
                  />
                  {[100, 200, 500, 1000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setReceivedAmountInput(String(val))}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-[#e2dac8] font-bold text-stone-800 cursor-pointer"
                    >
                      {val}
                    </button>
                  ))}
                  {changeDue > 0 && (
                    <span className="ml-auto text-[11px] font-black text-emerald-700">
                      Para Üstü: ₺{formatTrMoney(changeDue)}
                    </span>
                  )}
                </div>

                {/* 3 Büyük Hesap Kapatma Butonu (Nakit / Kart / IBAN) */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={payableAmount <= 0 || isCheckingOut}
                    onClick={() => handleDirectCheckout('nakit')}
                    className="py-4 px-2 rounded-2xl bg-[#15803d] hover:bg-[#166534] text-white font-black text-xs flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm transition-all active:scale-97 disabled:opacity-45"
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Nakit Kapat</span>
                  </button>

                  <button
                    type="button"
                    disabled={payableAmount <= 0 || isCheckingOut}
                    onClick={() => handleDirectCheckout('kart')}
                    className="py-4 px-2 rounded-2xl bg-[#1d6be1] hover:bg-[#1e5bc0] text-white font-black text-xs flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm transition-all active:scale-97 disabled:opacity-45"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Kart ile Kapat</span>
                  </button>

                  <button
                    type="button"
                    disabled={payableAmount <= 0 || isCheckingOut}
                    onClick={() => handleDirectCheckout('havale')}
                    className="py-4 px-2 rounded-2xl bg-[#6b159e] hover:bg-[#581185] text-white font-black text-xs flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm transition-all active:scale-97 disabled:opacity-45"
                  >
                    <Landmark className="w-5 h-5" />
                    <span>IBAN Kapat</span>
                  </button>
                </div>

                {/* Alt 3 Buton: Parçalı Nakit, Parçalı Kart, İptal Et */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={payableAmount <= 0 || isCheckingOut}
                    onClick={() => handlePartialButton('nakit')}
                    className="py-2.5 px-2 rounded-xl bg-[#f5be35] hover:bg-[#eab020] text-stone-950 font-black text-[11px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-45"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Parçalı Nakit</span>
                  </button>

                  <button
                    type="button"
                    disabled={payableAmount <= 0 || isCheckingOut}
                    onClick={() => handlePartialButton('kart')}
                    className="py-2.5 px-2 rounded-xl bg-[#f5be35] hover:bg-[#eab020] text-stone-950 font-black text-[11px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-45"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Parçalı Kart</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!activeTable.isOccupied && activeTable.orders.length === 0) {
                        setMainTab('tables');
                        return;
                      }
                      if (confirm(`"${activeTable.name}" adisyonunu iptal edip masayı sıfırlamak istediğinize emin misiniz?`)) {
                        await onResetTable(activeTable.id);
                        setMainTab('tables');
                        showToast('Masa sıfırlandı');
                      }
                    }}
                    className="py-2.5 px-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-black text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>İptal Et</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SEKME 3: Z RAPORU & GEÇMİŞ FİŞLER                         */}
      {/* ========================================================= */}
      {mainTab === 'z_report' && (
        <div className="bg-white rounded-3xl border border-[#e6dfd0] p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#efe9da]">
            <div>
              <h2 className="text-lg font-black text-[#14532d]">Z Raporu &amp; Bugünün Adisyon Fişleri</h2>
              <p className="text-xs text-stone-500">
                Bugün kapatılan adisyonlar, ödeme yöntemi dağılımı ve mutfak gideri kaydı.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Mutfak / Hal Gideri Yaz</span>
            </button>
          </div>

          {todayIncomeTxs.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500">
              Bugün kapatılmış adisyon tahsilatı henüz bulunmuyor.
            </div>
          ) : (
            <div className="divide-y divide-[#f0eadc]">
              {todayIncomeTxs.map((tx) => (
                <div key={tx.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-black text-stone-900">{tx.customerName || 'Masa Tahsilatı'}</div>
                    <div className="text-stone-500 text-[11px]">{tx.description}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{tx.date}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        tx.paymentMethod === 'kart'
                          ? 'bg-blue-50 text-blue-700'
                          : tx.paymentMethod === 'havale'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {tx.paymentMethod === 'havale' ? 'IBAN / Havale' : tx.paymentMethod === 'kart' ? 'Kart' : 'Nakit'}
                    </span>
                    <span className="text-sm font-black text-[#14532d]">+₺{formatTrMoney(tx.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SEKME 4: MASA & MENÜ AYARI + QR STANDLAR                 */}
      {/* ========================================================= */}
      {mainTab === 'settings' && (
        <div className="space-y-5">
          {/* Masa Ekleme & Hazır Düzen Yükleme Kartı */}
          <div className="bg-white rounded-3xl border border-[#e6dfd0] p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-[#14532d]">Masa Düzeni &amp; QR Ayarları</h2>
                <p className="text-xs text-stone-500">
                  Bölgelere göre yeni masa ekleyin, hazır 15 masalı Seyir Terası düzenini yükleyin veya masalara QR stand çıkarın.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!hasCustomServerMenu && (
                  <button
                    type="button"
                    onClick={handleSaveDefaultCatalogToServer}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black cursor-pointer"
                  >
                    Seyir Terası Hazır Menüyü Menüme Aktar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSetupSeyirPreset}
                  disabled={isLoadingPreset}
                  className="px-3.5 py-2 rounded-xl bg-[#f5be35] hover:bg-[#eab020] text-stone-950 text-xs font-black cursor-pointer"
                >
                  {isLoadingPreset ? 'Ekleniyor...' : '✨ Hazır Masa Düzeni Yükle'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isVip) {
                      onOpenVip?.();
                      return;
                    }
                    setQrTargetTable(null);
                    setIsQrModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#14532d] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Masa QR Standları</span>
                  {!isVip && <Crown className="w-3.5 h-3.5 text-amber-300" />}
                </button>
              </div>
            </div>

            <form onSubmit={handleAddTableWithSection} className="grid grid-cols-1 sm:grid-cols-[1fr_200px_auto] gap-2.5 pt-2 border-t border-[#efe9da]">
              <input
                type="text"
                required
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Masa adı (örn: Teras 4, Salon 5, VIP Köşe)"
                className="px-3.5 py-2.5 rounded-xl border border-[#e2dac8] bg-[#faf8f3] text-xs font-bold text-stone-900"
              />
              <select
                value={newTableSection}
                onChange={(e) => setNewTableSection(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#e2dac8] bg-[#faf8f3] text-xs font-bold text-stone-900"
              >
                <option value="Salon">🏠 Salon</option>
                <option value="Teras">🌅 Teras</option>
                <option value="Bahçe / Seyir">🌳 Bahçe / Seyir</option>
                <option value="Paket & Gel-Al">🛵 Paket &amp; Gel-Al</option>
              </select>
              <button
                type="submit"
                disabled={isAddingTable}
                className="px-5 py-2.5 rounded-xl bg-[#14532d] hover:bg-[#0f4022] text-white text-xs font-black cursor-pointer"
              >
                {isAddingTable ? 'Ekleniyor...' : '+ Masa Ekle'}
              </button>
            </form>

            {tables.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2">
                {tables.map((t) => (
                  <div
                    key={t.id}
                    className="px-3 py-2 rounded-xl border border-[#e6dfd0] bg-[#faf8f3] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-black text-stone-900 truncate">{t.name}</div>
                      <div className="text-[10px] text-stone-500 truncate">{inferTableSection(t)}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isVip) {
                            onOpenVip?.();
                            return;
                          }
                          setQrTargetTable(t);
                          setIsQrModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-[#14532d] hover:bg-emerald-50 cursor-pointer"
                        title="Masa QR Kodu"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      {!t.isOccupied && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`"${t.name}" silinsin mi?`)) onDeleteTable(t.id);
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 cursor-pointer"
                          title="Masayı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <RestaurantMenuManager
            tables={tables}
            shopName={effectiveStoreName}
            shopSlug={effectiveShopSlug}
            shopLogoUrl={effectiveShopLogoUrl}
            isVip={isVip}
            onOpenVip={onOpenVip}
            onMenuUpdated={(items) => {
              setMenuItems(items);
              setHasCustomServerMenu(true);
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* YARDIMCI MODALLAR (Detay Ekle, Özel Tutar, Taşı, Parçalı)  */}
      {/* ========================================================= */}
      {detailModalItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#e6dfd0] w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-stone-900">{detailModalItem.name}</h3>
                <p className="text-xs font-black text-[#b91c1c]">₺{formatTrMoney(detailModalItem.price)}</p>
              </div>
              <button type="button" onClick={() => setDetailModalItem(null)} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Adet</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setDetailQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5 rounded-xl border border-stone-300 font-black cursor-pointer">-</button>
                  <span className="px-4 font-black text-base">{detailQty}</span>
                  <button type="button" onClick={() => setDetailQty((q) => q + 1)} className="px-3 py-1.5 rounded-xl border border-stone-300 font-black cursor-pointer">+</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Hazırlama / Sipariş Notu</label>
                <input
                  type="text"
                  value={detailNote}
                  onChange={(e) => setDetailNote(e.target.value)}
                  placeholder="Örn: Acısız, bol nar ekşili, buzsuz..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={detailIsGift}
                  onChange={(e) => setDetailIsGift(e.target.checked)}
                />
                <span>İkram olarak ekle (₺0)</span>
              </label>
            </div>

            <button
              type="button"
              onClick={async () => {
                await handleQuickAdd(detailModalItem.name, detailModalItem.price, detailQty, detailNote, detailIsGift);
                setDetailModalItem(null);
              }}
              className="w-full py-2.5 rounded-xl bg-[#14532d] hover:bg-[#0f4022] text-white text-xs font-black cursor-pointer"
            >
              Adisyona Ekle
            </button>
          </div>
        </div>
      )}

      {isCustomItemModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleCustomItemSubmit} className="bg-white rounded-3xl border border-[#e6dfd0] w-full max-w-sm p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900">Özel Ürün / Tutar Ekle</h3>
              <button type="button" onClick={() => setIsCustomItemModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              required
              autoFocus
              value={customItemName}
              onChange={(e) => setCustomItemName(e.target.value)}
              placeholder="Ürün veya servis adı (örn: Özel Menü)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold"
            />
            <input
              type="number"
              required
              min="1"
              value={customItemPrice}
              onChange={(e) => setCustomItemPrice(e.target.value)}
              placeholder="Fiyat (₺)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-black"
            />
            <input
              type="text"
              value={customItemNote}
              onChange={(e) => setCustomItemNote(e.target.value)}
              placeholder="Not (isteğe bağlı)"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
            />
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer">
              <input type="checkbox" checked={saveCustomToMenu} onChange={(e) => setSaveCustomToMenu(e.target.checked)} />
              <span>Bu ürünü kalıcı menüye de kaydet</span>
            </label>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#f5be35] hover:bg-[#eab020] text-stone-950 text-xs font-black cursor-pointer"
            >
              Masaya Ekle
            </button>
          </form>
        </div>
      )}

      {isMoveModalOpen && activeTable && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#e6dfd0] w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900">Masa Taşı / Birleştir</h3>
              <button type="button" onClick={() => setIsMoveModalOpen(false)} className="p-1 text-stone-400 cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {tables
                .filter((t) => t.id !== activeTable.id)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMoveTargetTableId(t.id)}
                    className={`p-3 rounded-xl border text-xs font-black cursor-pointer ${
                      moveTargetTableId === t.id
                        ? 'bg-[#14532d] text-white border-[#14532d]'
                        : 'bg-[#faf8f3] text-stone-800 border-[#e2dac8]'
                    }`}
                  >
                    <div>{t.name}</div>
                    <div className="text-[10px] font-semibold opacity-75">
                      {t.isOccupied ? `₺${formatTrMoney(t.totalAmount)}` : 'Müsait'}
                    </div>
                  </button>
                ))}
            </div>
            <button
              type="button"
              disabled={!moveTargetTableId || isMoving}
              onClick={handleMoveTable}
              className="w-full py-2.5 rounded-xl bg-[#14532d] text-white text-xs font-black cursor-pointer disabled:opacity-50"
            >
              {isMoving ? 'Taşınıyor...' : 'Seçili Masaya Aktar'}
            </button>
          </div>
        </div>
      )}

      {isSplitModalOpen && activeTable && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#e6dfd0] w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h3 className="font-black text-stone-900 text-base">Parçalı Tahsilat</h3>
                <p className="text-xs text-stone-500">
                  {activeTable.name} • Ödenecek: ₺{formatTrMoney(payableAmount)}
                </p>
              </div>
              <button type="button" onClick={() => setIsSplitModalOpen(false)} className="p-1 text-stone-400 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSplitPaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nakit (₺)</label>
                <input
                  type="number"
                  min={0}
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Kredi Kartı / POS (₺)</label>
                <input
                  type="number"
                  min={0}
                  value={splitCard}
                  onChange={(e) => setSplitCard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Veresiye (₺)</label>
                <input
                  type="number"
                  min={0}
                  value={splitCredit}
                  onChange={(e) => setSplitCredit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-black"
                />
                {Number(splitCredit) > 0 && (
                  <select
                    required
                    value={splitCustomerId}
                    onChange={(e) => setSplitCustomerId(e.target.value)}
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-indigo-300 text-xs font-bold"
                  >
                    <option value="">-- Müşteri Seçin --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - Bakiye: ₺{c.balance}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={isCheckingOut}
                className="w-full py-2.5 rounded-xl bg-[#14532d] text-white text-xs font-black cursor-pointer disabled:opacity-50"
              >
                {isCheckingOut ? 'Kaydediliyor...' : 'Parçalı Tahsilatı Tamamla'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isReceiptModalOpen && activeTable && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="border-2 border-dashed border-stone-300 p-4 rounded-2xl font-mono text-xs space-y-2.5 bg-stone-50">
              <div className="text-center border-b border-stone-300 pb-2">
                <h4 className="font-black text-sm uppercase">{effectiveStoreName}</h4>
                <p className="text-[11px] font-bold">{activeTable.name}</p>
              </div>
              {activeTable.orders.map((ord) => (
                <div key={ord.id} className="flex justify-between text-[11px]">
                  <span className="truncate max-w-[150px]">{ord.name}{ord.isGift ? ' (İKRAM)' : ''}</span>
                  <span>{ord.quantity}x{ord.unitPrice}</span>
                  <span className="font-bold">₺{formatTrMoney(ord.total)}</span>
                </div>
              ))}
              {computedDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold border-t border-stone-200 pt-1">
                  <span>İndirim:</span>
                  <span>-₺{formatTrMoney(computedDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm border-t border-stone-400 pt-1.5">
                <span>GENEL TOPLAM:</span>
                <span>₺{formatTrMoney(payableAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setIsReceiptModalOpen(false)} className="px-3 py-2 text-xs font-bold text-stone-500 cursor-pointer">
                Kapat
              </button>
              <button
                type="button"
                onClick={() => {
                  const rows = activeTable.orders
                    .map(
                      (ord) => `
                        <tr>
                          <td style="padding:3px 0;">${escapeHtml(ord.name)}${ord.isGift ? ' (İKRAM)' : ''}</td>
                          <td style="text-align:center;padding:3px 0;">${ord.quantity} x ${ord.unitPrice}</td>
                          <td style="text-align:right;font-weight:700;padding:3px 0;">${formatTrMoney(ord.total)} ₺</td>
                        </tr>`
                    )
                    .join('');
                  printHtmlDocument({
                    title: `${effectiveStoreName} — ${activeTable.name} Adisyon`,
                    paperWidth: '80mm',
                    bodyHtml: `
                      <div style="text-align:center;border-bottom:1px dashed #111;padding-bottom:8px;margin-bottom:8px;">
                        <div style="font-size:15px;font-weight:900;text-transform:uppercase;">${escapeHtml(effectiveStoreName)}</div>
                        <div style="font-size:12px;font-weight:900;margin-top:4px;">${escapeHtml(activeTable.name.toUpperCase())}</div>
                      </div>
                      <table style="width:100%;font-size:11px;border-bottom:1px dashed #111;"><tbody>${rows}</tbody></table>
                      <div style="margin-top:8px;font-size:11px;">
                        ${adisyonGiftsTotal > 0 ? `<div style="display:flex;justify-content:space-between;"><span>İkram:</span><span>-${formatTrMoney(adisyonGiftsTotal)} ₺</span></div>` : ''}
                        ${computedDiscount > 0 ? `<div style="display:flex;justify-content:space-between;"><span>İndirim:</span><span>-${formatTrMoney(computedDiscount)} ₺</span></div>` : ''}
                        <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:900;border-top:2px solid #111;padding-top:6px;margin-top:4px;">
                          <span>TOPLAM:</span><span>${formatTrMoney(payableAmount)} ₺</span>
                        </div>
                      </div>
                    `,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>80mm Yazdır</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#e6dfd0] w-full max-w-sm p-5 shadow-xl space-y-3">
            <h3 className="font-black text-stone-900 text-base">Restoran / Mutfak Gideri Yaz</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!expenseDesc.trim() || !expenseAmount) return;
                await onAddQuickExpense(expenseDesc.trim(), Number(expenseAmount));
                setIsExpenseModalOpen(false);
                setExpenseDesc('');
                setExpenseAmount('');
                showToast('Mutfak gideri kasadan düşüldü');
              }}
              className="space-y-3"
            >
              <input
                type="text"
                required
                placeholder="Açıklama (örn: Hal / Ekmek / Lavaş)"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
              />
              <input
                type="number"
                required
                min="1"
                placeholder="Tutar (₺)"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-black"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-3 py-1.5 text-xs text-stone-500 cursor-pointer">
                  Vazgeç
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black cursor-pointer">
                  Masraf Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      <TableQrMenuModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        tables={tables}
        selectedTable={qrTargetTable}
        restaurantName={effectiveStoreName}
        shopSlug={effectiveShopSlug}
        shopLogoUrl={effectiveShopLogoUrl}
        menuItems={menuItems}
      />
    </div>
  );
};
