import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Coffee,
  Plus,
  Minus,
  CheckCircle2,
  Trash2,
  CreditCard,
  Banknote,
  Clock,
  Users,
  Receipt,
  Sparkles,
  ShoppingBag,
  TrendingDown,
  X,
  QrCode,
  Crown,
  Lock,
  Edit3,
  Search,
  Check,
  Gift,
  ArrowRightLeft,
  Printer,
  FileText,
  Bell,
  AlertCircle,
  Phone,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Customer, MenuItem, RestaurantTable, TableOrderItem } from '../../../shared/types.ts';
import { RestaurantMenuManager } from './RestaurantMenuManager';
import { TableQrMenuModal } from './TableQrMenuModal';

interface RestaurantTablesViewProps {
  tables: RestaurantTable[];
  isVip?: boolean;
  onOpenVip?: () => void;
  onAddOrderToTable: (tableId: string, item: { name: string; quantity: number; unitPrice: number; isGift?: boolean; note?: string }) => Promise<void>;
  onCheckoutTable: (tableId: string, paymentMethod: 'nakit' | 'kart') => Promise<void>;
  onResetTable: (tableId: string) => Promise<void>;
  onAddQuickExpense: (description: string, amount: number) => Promise<void>;
  onAddTable: (name: string) => Promise<void>;
  onDeleteTable: (id: string) => Promise<void>;
}

const DEFAULT_MENU_FALLBACK: MenuItem[] = [
  { id: 'm_durum', name: 'Normal Çiğ Köfte Dürüm', price: 90, category: 'Dürümler', isAvailable: true },
  { id: 'm_mega', name: 'Mega Çiğ Köfte Dürüm', price: 130, category: 'Dürümler', isAvailable: true },
  { id: 'm_doritos', name: 'Doritoslu Çıtır Dürüm', price: 120, category: 'Dürümler', isAvailable: true },
  { id: 'm_kofte_ekmek', name: 'Sıcak Köfte Ekmek', price: 200, category: 'Sıcak Lezzetler', isAvailable: true },
  { id: 'm_gozleme', name: 'El Açması Kaşarlı Gözleme', price: 150, category: 'Gözleme & Tost', isAvailable: true },
  { id: 'm_bazlama', name: 'Bazlama Karışık Tost', price: 150, category: 'Gözleme & Tost', isAvailable: true },
  { id: 'm_corba', name: 'Günün Sıcak Çorbası', price: 65, category: 'Çorbalar', isAvailable: true },
  { id: 'm_porsiyon', name: 'Çiğ Köfte Porsiyon (250gr)', price: 200, category: 'Porsiyonlar', isAvailable: true },
  { id: 'm_sutlac', name: 'Fırın Sütlaç & Tatlı', price: 75, category: 'Tatlılar', isAvailable: true },
  { id: 'm_ayran', name: 'Köy Yayık Ayranı', price: 30, category: 'İçecekler', isAvailable: true },
  { id: 'm_cay', name: 'Demleme Çay', price: 15, category: 'İçecekler', isAvailable: true },
  { id: 'm_kahve', name: 'Közde Türk Kahvesi', price: 45, category: 'İçecekler', isAvailable: true },
];

export const RestaurantTablesView: React.FC<RestaurantTablesViewProps> = ({
  tables,
  isVip = false,
  onOpenVip,
  onAddOrderToTable,
  onCheckoutTable,
  onResetTable,
  onAddQuickExpense,
  onAddTable,
  onDeleteTable,
}) => {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number | ''>('');
  const [saveCustomToMenu, setSaveCustomToMenu] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [mainTab, setMainTab] = useState<'tables' | 'qr_menu'>('tables');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrTargetTable, setQrTargetTable] = useState<RestaurantTable | null>(null);

  // Dynamic Menu Items (fetched from /api/menu and shared with RestaurantMenuManager)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_FALLBACK);
  const [selectedMenuCat, setSelectedMenuCat] = useState<string>('Tümü');
  const [menuSearchFilter, setMenuSearchFilter] = useState('');

  // Mobile Adisyon Tab: 'menu' (Add items) or 'orders' (Review bill & checkout)
  const [mobileTab, setMobileTab] = useState<'menu' | 'orders'>('menu');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Seyir Terasi Fast Adisyon: Extra Modals & States
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTargetTableId, setMoveTargetTableId] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitCash, setSplitCash] = useState<number | ''>('');
  const [splitCard, setSplitCard] = useState<number | ''>('');
  const [splitCredit, setSplitCredit] = useState<number | ''>('');
  const [splitCustomerId, setSplitCustomerId] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [tableNoteInput, setTableNoteInput] = useState('');

  // Table filter search
  const [tableFilterQuery, setTableFilterQuery] = useState('');

  // Fetch menu and customers from server on mount
  useEffect(() => {
    let active = true;
    const loadMenu = async () => {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.menuItems) && data.menuItems.length > 0) {
            setMenuItems(data.menuItems);
          }
        }
      } catch (err) {
        console.error('Menu load error:', err);
      }
    };

    const loadCustomers = async () => {
      try {
        const res = await fetch('/api/customers');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.customers)) {
            setCustomers(data.customers);
          }
        }
      } catch (err) {
        console.error('Customers load error:', err);
      }
    };

    loadMenu();
    loadCustomers();
    return () => {
      active = false;
    };
  }, []);

  // Keep selectedTable updated with latest table from props
  const activeTable = selectedTable
    ? tables.find((t) => t.id === selectedTable.id) || selectedTable
    : null;

  useEffect(() => {
    if (activeTable) {
      setTableNoteInput(activeTable.note || '');
    }
  }, [activeTable?.id, activeTable?.note]);

  // Overview metrics
  const occupiedCount = tables.filter((t) => t.isOccupied).length;
  const emptyCount = tables.length - occupiedCount;
  const totalOpenAdisyon = tables.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const activeCallCount = tables.filter((t) => Boolean(t.activeCall)).length;

  // Filtered tables by search query
  const displayedTables = tables.filter((t) =>
    tableFilterQuery.trim() === '' ? true : t.name.toLowerCase().includes(tableFilterQuery.toLowerCase())
  );

  // Categories list for quick filtering inside the adisyon modal
  const menuCategories = ['Tümü', ...Array.from(new Set(menuItems.map((m) => m.category || 'Genel')))];
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCat = selectedMenuCat === 'Tümü' || item.category === selectedMenuCat;
    const matchesSearch =
      menuSearchFilter.trim() === '' ||
      item.name.toLowerCase().includes(menuSearchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleQuickAdd = async (name: string, price: number) => {
    if (!activeTable) return;
    await onAddOrderToTable(activeTable.id, {
      name,
      quantity: 1,
      unitPrice: price,
    });
  };

  const handleCustomItemAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTable || !customItemName.trim() || !customItemPrice) return;
    const priceNum = Number(customItemPrice);
    const nameTrim = customItemName.trim();

    await onAddOrderToTable(activeTable.id, {
      name: nameTrim,
      quantity: 1,
      unitPrice: priceNum,
    });

    if (saveCustomToMenu) {
      try {
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameTrim,
            price: priceNum,
            category: 'Genel',
            isAvailable: true,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.menuItems)) {
            setMenuItems(data.menuItems);
          }
        }
      } catch (err) {
        console.error('Failed to save to menu:', err);
      }
    }

    setCustomItemName('');
    setCustomItemPrice('');
    setSaveCustomToMenu(false);
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
        if (data.table) {
          setSelectedTable(data.table);
        }
      }
    } catch (err) {
      console.error('Toggle gift error:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!activeTable) return;
    try {
      const res = await fetch(`/api/tables/${encodeURIComponent(activeTable.id)}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: tableNoteInput }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.table) setSelectedTable(data.table);
        setEditingNote(false);
      }
    } catch (err) {
      console.error('Save note error:', err);
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
      if (res.ok) {
        const data = await res.json();
        setIsMoveModalOpen(false);
        setMoveTargetTableId('');
        if (data.targetTable) {
          setSelectedTable(data.targetTable);
        } else {
          setSelectedTable(null);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Masa aktarılamadı.');
      }
    } catch (err) {
      console.error('Move table error:', err);
    } finally {
      setIsMoving(false);
    }
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
          closeTable: totalSubmit >= activeTable.totalAmount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsSplitModalOpen(false);
        setSplitCash('');
        setSplitCard('');
        setSplitCredit('');
        setSplitCustomerId('');
        if (data.isFullClose) {
          setSelectedTable(null);
        } else if (data.table) {
          setSelectedTable(data.table);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Tahsilat gerçekleştirilemedi.');
      }
    } catch (err) {
      console.error('Split checkout error:', err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount) return;
    await onAddQuickExpense(expenseDesc.trim(), Number(expenseAmount));
    setIsExpenseModalOpen(false);
    setExpenseDesc('');
    setExpenseAmount('');
  };

  const handleClearCall = async (tableId: string) => {
    try {
      await fetch(`/api/tables/${encodeURIComponent(tableId)}/clear-call`, {
        method: 'POST',
      });
    } catch (e) {
      console.error('Clear call error:', e);
    }
  };

  // Calculations for active adisyon
  const adisyonSubtotal = activeTable
    ? activeTable.orders.reduce((sum, o) => sum + o.quantity * o.unitPrice, 0)
    : 0;
  const adisyonGiftsTotal = activeTable
    ? activeTable.orders
        .filter((o) => o.isGift)
        .reduce((sum, o) => sum + o.quantity * o.unitPrice, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* 2 Temel Sekme: Masalar & Adisyonlar VS. Menü & QR Yönetimi */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-1.5 rounded-2xl gap-2 shadow-xs">
        <button
          type="button"
          onClick={() => setMainTab('tables')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            mainTab === 'tables'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Masalar &amp; Canlı Adisyonlar ({occupiedCount} Dolu)</span>
          {activeCallCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
              {activeCallCount} Çağrı
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setMainTab('qr_menu')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 relative ${
            mainTab === 'qr_menu'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Menü &amp; Fiyat Listesi ({menuItems.length} Çeşit)</span>
          {!isVip ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-linear-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black shadow-xs">
              <Crown className="w-3 h-3 text-yellow-200" /> QR VIP
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
              VIP Aktif
            </span>
          )}
        </button>
      </div>

      {mainTab === 'qr_menu' ? (
        <RestaurantMenuManager
          tables={tables}
          isVip={isVip}
          onOpenVip={onOpenVip}
          onMenuUpdated={(items) => setMenuItems(items)}
        />
      ) : (
        <>
          {/* Header & Metrics */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                  <UtensilsCrossed className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
                  Seyir Terasi Hızlı Masa &amp; Adisyon Terminali
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                Görsel salon planı, canlı garson/hesap çağrısı, ikram/not ekleme, parçalı tahsilat ve 80mm fiş basımı.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setMainTab('qr_menu')}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                title="Yemekleri ve fiyatları düzenle"
              >
                <Edit3 className="w-4 h-4" />
                <span>Menüyü Düzenle</span>
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
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  !isVip
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                }`}
                title={!isVip ? 'VIP Özelliği - Stand çıkarmak için VIP gerekir' : 'Masalar için yazdırılabilir QR standı çıkar'}
              >
                <QrCode className="w-4 h-4" />
                <span>Masa QR Standları</span>
                {!isVip && <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isVip && tables.length >= 3) {
                    onOpenVip?.();
                    return;
                  }
                  setIsAddOpen((v) => !v);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Masa Ekle</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <TrendingDown className="w-4 h-4" />
                <span>Hal / Mutfak Masrafı</span>
              </button>
            </div>
          </div>

          {/* Standart Plan 3 Masa Sınırı Uyarısı */}
          {!isVip && (
            <div className="p-4 rounded-2xl bg-linear-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200 dark:border-orange-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Crown className="w-5 h-5 text-yellow-200" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-orange-950 dark:text-orange-200">
                      Standart Plan: 3 Masa ile Sınırlıdır
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-800 dark:text-orange-300 text-[10px] font-black">
                      {tables.length}/3 Masa
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 font-medium mt-0.5">
                    Sınırsız masa, kat/bölüm planı ve QR menü standları VIP işletmelere özeldir. Menü ve adisyonu ücretsiz kullanabilirsiniz.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenVip}
                className="px-4 py-2 rounded-xl bg-linear-to-r from-orange-500 to-orange-600 text-white text-xs font-black shadow-xs hover:from-orange-600 hover:to-orange-700 transition-all cursor-pointer shrink-0 inline-flex items-center gap-1.5 justify-center"
              >
                <Crown className="w-3.5 h-3.5 text-yellow-200" />
                VIP'ye Yükselt (Sınırsız Masa Aç)
              </button>
            </div>
          )}

          {/* Summary KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">Dolu Masalar</span>
                <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-0.5">
                  {occupiedCount} <span className="text-xs font-medium text-stone-400">/ {tables.length}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">Boş Masalar</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {emptyCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">Açık Adisyon Toplamı</span>
                <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">
                  {totalOpenAdisyon} ₺
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              activeCallCount > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
            }`}>
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">Canlı QR Çağrıları</span>
                <div className={`text-2xl font-black mt-0.5 ${activeCallCount > 0 ? 'text-rose-600 animate-pulse' : 'text-stone-700 dark:text-stone-300'}`}>
                  {activeCallCount} Bekleyen
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                activeCallCount > 0 ? 'bg-rose-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
              }`}>
                <Bell className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Masa ekleme ve Arama Çubuğu */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Masa ara (örn: Masa 1, Teras, Bahçe)..."
                value={tableFilterQuery}
                onChange={(e) => setTableFilterQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {isAddOpen && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newTableName.trim() || isAdding) return;
                  if (!isVip && tables.length >= 3) {
                    onOpenVip?.();
                    return;
                  }
                  setIsAdding(true);
                  try {
                    await onAddTable(newTableName.trim());
                    setNewTableName('');
                    setIsAddOpen(false);
                  } finally {
                    setIsAdding(false);
                  }
                }}
                className="flex gap-2 p-1.5 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60"
              >
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder={`Masa adı (örn: Masa ${tables.length + 1})`}
                  autoFocus
                  className="w-48 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isAdding ? '...' : 'Ekle'}
                </button>
              </form>
            )}
          </div>

          {tables.length === 0 && !isAddOpen && (
            <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 text-center">
              <UtensilsCrossed className="w-8 h-8 mx-auto text-stone-300" />
              <p className="mt-2 text-sm font-bold text-stone-500">Henüz masa eklenmedi.</p>
              <p className="text-xs text-stone-400 mt-1">Yukarıdaki "Masa Ekle" ile salonunuzu kurmaya başlayın.</p>
            </div>
          )}

          {/* Bento Grid: Masalar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedTables.map((table) => {
              const isOccupied = table.isOccupied;
              const hasCall = Boolean(table.activeCall);

              return (
                <div
                  key={table.id}
                  onClick={() => {
                    setSelectedTable(table);
                    setMobileTab(table.orders.length > 0 ? 'orders' : 'menu');
                  }}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer text-left relative group ${
                    hasCall
                      ? table.activeCall === 'bill'
                        ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-400/50 shadow-lg'
                        : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-400/50 shadow-lg'
                      : isOccupied
                      ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800 shadow-xs hover:border-orange-400'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-black text-sm text-stone-900 dark:text-white truncate">
                      {table.name}
                    </span>

                    <span className="flex items-center gap-1 shrink-0">
                      {table.activeCall && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearCall(table.id);
                          }}
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white animate-pulse shadow-xs cursor-pointer flex items-center gap-1 ${
                            table.activeCall === 'bill' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                          }`}
                          title="Çağrıyı tamamlamak için tıklayın"
                        >
                          <span>{table.activeCall === 'bill' ? '💳 HESAP' : '🔔 GARSON'}</span>
                          <span className="text-[9px] bg-black/20 px-1 rounded-sm">✓ Gidildi</span>
                        </button>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOccupied
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {isOccupied ? 'DOLU' : 'BOŞ'}
                      </span>

                      {!isOccupied && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`"${table.name}" silinsin mi?`)) onDeleteTable(table.id);
                          }}
                          className="p-1 rounded-md text-stone-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Masayı sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  </div>

                  <div className="my-3 py-2 border-y border-stone-100 dark:border-stone-800/80">
                    {isOccupied ? (
                      <div>
                        <div className="text-xl font-black text-orange-600 dark:text-orange-400">
                          {table.totalAmount} ₺
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                          {table.orders.length} sipariş kalemi açık
                        </p>
                      </div>
                    ) : (
                      <div className="py-2 text-xs text-stone-400 dark:text-stone-500">
                        Sipariş açmak için dokunun
                      </div>
                    )}

                    {table.note && (
                      <div className="mt-1.5 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-[10px] font-bold text-amber-800 dark:text-amber-300 line-clamp-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span>{table.note}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                    {isOccupied && table.openedAt ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {table.openedAt}
                      </span>
                    ) : (
                      <span>Masa Boş</span>
                    )}

                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:underline">
                      Adisyon →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SEYİR TERASİ ADİSYON MODAL / TERMINAL (Responsive Drawer & Desktop) */}
          {activeTable && (
            <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-black/75 sm:p-4 backdrop-blur-xs">
              <div className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-3xl bg-white dark:bg-stone-900 flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                
                {/* 1. Modal Header (Masa Adı, Çağrı, Masa Notu, Fiş Bas, Taşı ve Kapat) */}
                <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
                      <Receipt className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-stone-900 dark:text-white text-base sm:text-lg">
                          {activeTable.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeTable.isOccupied
                              ? 'bg-orange-500 text-white'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {activeTable.isOccupied ? 'AÇIK HESAP' : 'BOŞ MASA'}
                        </span>
                        {activeTable.activeCall && (
                          <button
                            type="button"
                            onClick={() => handleClearCall(activeTable.id)}
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white cursor-pointer ${
                              activeTable.activeCall === 'bill' ? 'bg-rose-600' : 'bg-amber-600'
                            }`}
                          >
                            {activeTable.activeCall === 'bill' ? '💳 HESAP İSTİYOR (Gidildi ✓)' : '🔔 GARSON ÇAĞIRIYOR (Gidildi ✓)'}
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {activeTable.isOccupied
                          ? `Açılış Saati: ${activeTable.openedAt || 'Bugün'} • ${activeTable.orders.length} Kalem Sipariş`
                          : 'Ürün seçerek adisyonu başlatın'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 80mm Adisyon Fişi Bas */}
                    {activeTable.orders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsReceiptModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        title="80mm Termal Adisyon Fişi Yazdır"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Adisyon Fişi</span>
                      </button>
                    )}

                    {/* Masa Taşı / Aktar */}
                    {activeTable.orders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsMoveModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        title="Masayı Başka Masaya Aktar / Birleştir"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-orange-600" />
                        <span className="hidden sm:inline">Masa Taşı</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedTable(null)}
                      className="w-9 h-9 rounded-xl bg-stone-200/60 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center font-bold transition-colors cursor-pointer text-base"
                      title="Kapat"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Masa Notu Satırı */}
                <div className="px-4 sm:px-6 py-2 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/40 dark:border-amber-900/40 flex items-center justify-between gap-3 text-xs">
                  {editingNote ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        autoFocus
                        value={tableNoteInput}
                        onChange={(e) => setTableNoteInput(e.target.value)}
                        placeholder="Masa notu (örn: 4 kişi, cam kenarı, garson: Ahmet)..."
                        className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleSaveNote}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs cursor-pointer"
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNote(false)}
                        className="px-2 py-1.5 text-stone-500 text-xs cursor-pointer"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-stone-600 dark:text-stone-300 font-medium flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        {activeTable.note ? (
                          <span className="font-bold text-stone-900 dark:text-white">
                            Not: {activeTable.note}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">Masa notu yok (eklemek için tıklayın)</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingNote(true)}
                        className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer shrink-0 ml-2"
                      >
                        {activeTable.note ? 'Düzenle' : '+ Not Ekle'}
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Mobile Segmented Tab Switcher */}
                <div className="flex md:hidden shrink-0 border-b border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800/80 p-1.5 mx-3 mt-3 rounded-2xl gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMobileTab('menu')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      mobileTab === 'menu'
                        ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Hızlı Menü</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileTab('orders')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      mobileTab === 'orders'
                        ? 'bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Masa Hesabı</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-black">
                      {activeTable.totalAmount} ₺
                    </span>
                  </button>
                </div>

                {/* 3. Modal Body: Desktopta 2 Sütun Yan Yana, Mobilde Seçili Tab */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full">
                    
                    {/* SOL SÜTUN / MENÜ SEÇİMİ (Mobilde mobileTab === 'menu' iken açık) */}
                    <div
                      className={`flex flex-col space-y-3.5 ${
                        mobileTab === 'menu' ? 'block' : 'hidden md:flex'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Hızlı Menü ({filteredMenuItems.length})</span>
                        </h4>

                        <div className="relative w-36">
                          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            placeholder="Yemek ara..."
                            value={menuSearchFilter}
                            onChange={(e) => setMenuSearchFilter(e.target.value)}
                            className="w-full pl-7 pr-2 py-1 rounded-lg text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Kategori Filtre Çipleri */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {menuCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedMenuCat(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                              selectedMenuCat === cat
                                ? 'bg-orange-500 text-white shadow-xs'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Hızlı Menü Butonları Grid */}
                      <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-60 sm:max-h-72 p-0.5">
                        {filteredMenuItems.map((item) => (
                          <button
                            key={item.id || item.name}
                            type="button"
                            onClick={() => handleQuickAdd(item.name, item.price)}
                            className="p-2.5 rounded-2xl text-left bg-stone-50 hover:bg-orange-50 dark:bg-stone-800/80 dark:hover:bg-orange-950/40 border border-stone-200 dark:border-stone-700/80 transition-all cursor-pointer active:scale-95 group flex flex-col justify-between"
                          >
                            <span className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                              {item.name}
                            </span>
                            <div className="mt-1.5 flex items-center justify-between">
                              <span className="text-[10px] text-stone-400 dark:text-stone-500 truncate max-w-[65px]">
                                {item.category || 'Genel'}
                              </span>
                              <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                                +{item.price} ₺
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Özel Sipariş / Fiyat Yazma Formu */}
                      <form
                        onSubmit={handleCustomItemAdd}
                        className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-2 mt-auto"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
                            Özel Sipariş / Fiyat Yaz:
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Ürün adı (örn: Karışık Meze)"
                            value={customItemName}
                            onChange={(e) => setCustomItemName(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="₺"
                            value={customItemPrice}
                            onChange={(e) =>
                              setCustomItemPrice(e.target.value === '' ? '' : Number(e.target.value))
                            }
                            className="w-18 px-2.5 py-2 rounded-xl text-xs font-black border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white text-center focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="submit"
                            className="p-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs active:scale-95"
                            title="Masaya Ekle"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <label className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 font-semibold cursor-pointer pt-0.5">
                          <input
                            type="checkbox"
                            checked={saveCustomToMenu}
                            onChange={(e) => setSaveCustomToMenu(e.target.checked)}
                            className="rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span>Bu lezzeti menüme de kaydet</span>
                        </label>
                      </form>

                      {/* Mobilde masada sipariş varsa adisyona geçiş butonu */}
                      {activeTable.orders.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setMobileTab('orders')}
                          className="md:hidden w-full py-2.5 px-3 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-700 dark:text-orange-300 font-black text-xs flex items-center justify-between transition-colors"
                        >
                          <span>Masada {activeTable.orders.length} sipariş var</span>
                          <span>Hesabı İncele ({activeTable.totalAmount} ₺) →</span>
                        </button>
                      )}
                    </div>

                    {/* SAĞ SÜTUN / AÇIK ADİSYON & HESAP LİSTESİ */}
                    <div
                      className={`flex flex-col h-full bg-stone-50/90 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 ${
                        mobileTab === 'orders' ? 'block' : 'hidden md:flex'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-700">
                        <span className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                          <Receipt className="w-4 h-4 text-orange-500" />
                          <span>Masa Adisyonu</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[10px] font-black">
                          {activeTable.orders.length} Kalem
                        </span>
                      </div>

                      {/* Sipariş Kalemleri Listesi */}
                      <div className="flex-1 overflow-y-auto divide-y divide-stone-200/70 dark:divide-stone-700/70 my-2 min-h-48 max-h-72 sm:max-h-80">
                        {activeTable.orders.length === 0 ? (
                          <div className="py-12 px-4 text-center space-y-2">
                            <UtensilsCrossed className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600" />
                            <p className="text-xs font-bold text-stone-500 dark:text-stone-400">
                              Masada henüz sipariş bulunmuyor.
                            </p>
                            <p className="text-[11px] text-stone-400">
                              {mobileTab === 'orders' ? (
                                <button
                                  type="button"
                                  onClick={() => setMobileTab('menu')}
                                  className="text-orange-600 dark:text-orange-400 font-black underline mt-1"
                                >
                                  Menüden Ürün Seçmeye Başla →
                                </button>
                              ) : (
                                'Sol taraftaki menüden lezzetleri ekleyebilirsiniz.'
                              )}
                            </p>
                          </div>
                        ) : (
                          activeTable.orders.map((ord) => (
                            <div key={ord.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                              <div className="flex-1 min-w-0 pr-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-bold text-stone-900 dark:text-white truncate ${ord.isGift ? 'line-through text-stone-400' : ''}`}>
                                    {ord.name}
                                  </span>
                                  {ord.isGift && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-white text-[9px] font-black">
                                      İKRAM
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-stone-400 dark:text-stone-500">
                                  Birim: {ord.unitPrice} ₺ {ord.note ? `• ${ord.note}` : ''}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* İkram Butonu */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleGift(ord.id, ord.isGift)}
                                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                    ord.isGift
                                      ? 'bg-emerald-500 text-white shadow-2xs'
                                      : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                  }`}
                                  title={ord.isGift ? 'İkramı İptal Et (Ücretli Yap)' : 'Bu Kalemi İkram Yap (0 TL)'}
                                >
                                  <Gift className="w-3.5 h-3.5" />
                                </button>

                                {/* Adet Azalt / Artır */}
                                <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden bg-white dark:bg-stone-800 shadow-2xs">
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
                                    className="px-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                                    title="1 Adet Azalt"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="px-2 font-black text-stone-900 dark:text-white min-w-[20px] text-center text-xs">
                                    {ord.quantity}
                                  </span>
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
                                    className="px-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                                    title="1 Adet Ekle"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <span className={`font-black min-w-14 text-right ${ord.isGift ? 'text-emerald-600' : 'text-stone-900 dark:text-white'}`}>
                                  {ord.total} ₺
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
                                  className="p-1 rounded-md text-stone-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Siparişi İptal Et"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Masa Toplamı & İkram Detayı */}
                      <div className="pt-3 border-t border-stone-200 dark:border-stone-700 space-y-1 mt-auto">
                        {adisyonGiftsTotal > 0 && (
                          <div className="flex items-center justify-between text-xs text-stone-400">
                            <span>İkram İndirimi:</span>
                            <span className="font-bold text-emerald-600">-{adisyonGiftsTotal} ₺</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-600 dark:text-stone-400">
                            Ödenecek Tutar:
                          </span>
                          <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                            {activeTable.totalAmount} ₺
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Sticky Bottom Action Bar (Parçalı Tahsilat, Nakit, Kart, Veresiye, Sıfırla) */}
                <div className="shrink-0 p-3 sm:p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block sm:hidden">
                        Ödenecek Tutar
                      </span>
                      <div className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
                        Toplam: <span className="text-orange-600 dark:text-orange-400">{activeTable.totalAmount} ₺</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Bu masanın siparişlerini iptal etmek ve boşaltmak istediğinize emin misiniz?')) {
                          await onResetTable(activeTable.id);
                          setSelectedTable(null);
                        }
                      }}
                      className="text-xs font-semibold text-stone-400 hover:text-rose-600 cursor-pointer underline sm:no-underline"
                    >
                      Masayı Sıfırla
                    </button>
                  </div>

                  {/* Hızlı Kapatma Butonları */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Parçalı Tahsilat Modalı Aç */}
                    <button
                      type="button"
                      disabled={activeTable.totalAmount <= 0 || isCheckingOut}
                      onClick={() => {
                        setSplitCash(activeTable.totalAmount);
                        setSplitCard('');
                        setSplitCredit('');
                        setIsSplitModalOpen(true);
                      }}
                      className="px-3.5 py-2.5 rounded-xl font-black text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Parçalı Tahsilat</span>
                    </button>

                    <button
                      type="button"
                      disabled={activeTable.totalAmount <= 0 || isCheckingOut}
                      onClick={async () => {
                        if (isCheckingOut) return;
                        setIsCheckingOut(true);
                        try {
                          await onCheckoutTable(activeTable.id, 'nakit');
                          setSelectedTable(null);
                        } finally {
                          setIsCheckingOut(false);
                        }
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>{isCheckingOut ? '...' : 'Nakit Kapat'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={activeTable.totalAmount <= 0 || isCheckingOut}
                      onClick={async () => {
                        if (isCheckingOut) return;
                        setIsCheckingOut(true);
                        try {
                          await onCheckoutTable(activeTable.id, 'kart');
                          setSelectedTable(null);
                        } finally {
                          setIsCheckingOut(false);
                        }
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{isCheckingOut ? '...' : 'Kart / POS'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* PARÇALI TAHSİLAT MODALI */}
          {isSplitModalOpen && activeTable && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 font-bold">
                      <DollarSign className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-black text-stone-900 dark:text-white text-base">
                        Parçalı Tahsilat &amp; Hesap Kapatma
                      </h3>
                      <p className="text-xs text-stone-500">
                        {activeTable.name} • Toplam Hesap: {activeTable.totalAmount} ₺
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSplitModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSplitPaymentSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nakit Ödenen (₺)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={splitCash}
                      onChange={(e) => setSplitCash(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl font-black text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-orange-600" />
                      <span>Kredi Kartı / POS (₺)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={splitCard}
                      onChange={(e) => setSplitCard(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl font-black text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Veresiye / Açık Hesap (₺)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={splitCredit}
                      onChange={(e) => setSplitCredit(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl font-black text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    />

                    {Number(splitCredit) > 0 && (
                      <div className="mt-2">
                        <label className="block text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                          Veresiyenin Yazılacağı Müşteri *
                        </label>
                        <select
                          required
                          value={splitCustomerId}
                          onChange={(e) => setSplitCustomerId(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl text-xs font-bold border border-indigo-300 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                        >
                          <option value="">-- Müşteri Seçin --</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.phone}) - Bakiye: {c.balance} ₺
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Özet ve Kalan Bakiye Bilgisi */}
                  <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                      <span>Masa Hesabı:</span>
                      <span className="font-bold">{activeTable.totalAmount} ₺</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                      <span>Tahsil Edilecek Toplam:</span>
                      <span className="font-bold text-emerald-600">
                        {(Number(splitCash) || 0) + (Number(splitCard) || 0) + (Number(splitCredit) || 0)} ₺
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-black text-stone-900 dark:text-white pt-1 border-t border-stone-200 dark:border-stone-700">
                      <span>Masa Kalan Borç:</span>
                      <span className={
                        activeTable.totalAmount - ((Number(splitCash) || 0) + (Number(splitCard) || 0) + (Number(splitCredit) || 0)) <= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }>
                        {Math.max(0, activeTable.totalAmount - ((Number(splitCash) || 0) + (Number(splitCard) || 0) + (Number(splitCredit) || 0)))} ₺
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSplitModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-800"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      disabled={isCheckingOut}
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isCheckingOut ? 'Tahsil Ediliyor...' : 'Tahsilatı Tamamla'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MASA TAŞIMA / BİRLEŞTİRME MODALI */}
          {isMoveModalOpen && activeTable && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-sm p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950 text-orange-600 font-bold">
                      <ArrowRightLeft className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-black text-stone-900 dark:text-white text-base">
                        Masa Taşı / Aktar
                      </h3>
                      <p className="text-xs text-stone-500">
                        {activeTable.name} siparişlerini başka masaya taşıyın.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMoveModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    Hedef Masa Seçin:
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                    {tables
                      .filter((t) => t.id !== activeTable.id)
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setMoveTargetTableId(t.id)}
                          className={`p-3 rounded-2xl font-black text-xs border text-center transition-all cursor-pointer ${
                            moveTargetTableId === t.id
                              ? 'bg-orange-600 text-white border-orange-700 shadow-md'
                              : 'bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-orange-50'
                          }`}
                        >
                          <div>{t.name}</div>
                          <span className="text-[10px] font-normal opacity-70">
                            {t.isOccupied ? `Dolu (${t.totalAmount} ₺)` : 'Boş'}
                          </span>
                        </button>
                      ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsMoveModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-stone-500"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      disabled={!moveTargetTableId || isMoving}
                      onClick={handleMoveTable}
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs cursor-pointer disabled:opacity-50 shadow-md"
                    >
                      {isMoving ? 'Aktarılıyor...' : 'Masayı Aktar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 80mm ADİSYON FİŞİ YAZDIRMA MODALI */}
          {isReceiptModalOpen && activeTable && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white text-black rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh] overflow-y-auto print:max-h-none print:w-full print:p-0 print:shadow-none">
                
                {/* 80mm Fiş Görsel Alanı */}
                <div id="thermal-receipt-80mm" className="border-2 border-dashed border-stone-300 p-4 rounded-2xl font-mono text-xs space-y-3 bg-stone-50">
                  <div className="text-center space-y-1 pb-2 border-b border-stone-300">
                    <h2 className="text-base font-black tracking-wider uppercase">DÜKKÂNIM RESTORAN</h2>
                    <p className="text-[10px] text-stone-600">Seyir Terasi Hızlı Adisyon</p>
                    <div className="text-[11px] font-bold mt-1">
                      {activeTable.name.toUpperCase()}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {new Date().toLocaleDateString('tr-TR')} • {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {activeTable.note && (
                    <div className="text-[10px] bg-white p-1.5 rounded-sm border border-stone-200">
                      <strong>Not:</strong> {activeTable.note}
                    </div>
                  )}

                  <div className="space-y-1.5 py-1 border-b border-stone-300">
                    <div className="flex justify-between font-bold text-[10px] text-stone-500">
                      <span>ÜRÜN</span>
                      <span>ADET x FİYAT</span>
                      <span>TUTAR</span>
                    </div>
                    {activeTable.orders.map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between text-[11px]">
                        <span className="truncate max-w-[140px]">
                          {ord.name} {ord.isGift && '(İKRAM)'}
                        </span>
                        <span>{ord.quantity} x {ord.unitPrice}</span>
                        <span className="font-bold">{ord.total} ₺</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 pt-1 text-xs">
                    {adisyonGiftsTotal > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>İkram İndirimi:</span>
                        <span>-{adisyonGiftsTotal} ₺</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black border-t border-stone-400 pt-1">
                      <span>GENEL TOPLAM:</span>
                      <span>{activeTable.totalAmount} ₺</span>
                    </div>
                  </div>

                  <div className="text-center pt-3 border-t border-dashed border-stone-300 text-[10px] text-stone-500 space-y-0.5">
                    <p>Mali değeri yoktur — Bilgi Fişidir</p>
                    <p className="font-bold">AFİYET OLSUN!</p>
                  </div>
                </div>

                {/* Butonlar */}
                <div className="flex items-center justify-end gap-2 pt-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => setIsReceiptModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-800"
                  >
                    Kapat
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>80mm Yazdır</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hal / Mutfak Masrafı Ekleme Modalı */}
          {isExpenseModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-sm p-6 shadow-xl">
                <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">
                  Restoran / Mutfak Masrafı Kaydet
                </h3>
                <p className="text-xs text-stone-500 mb-4">
                  Halden sebze, et alımı, ekmek veya tüp masrafını kasadan düşer.
                </p>

                <form onSubmit={handleExpenseSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Masraf Açıklaması *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Hal sebze alışverişi & et faturası"
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Ödenen Tutar (₺) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl text-sm font-bold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsExpenseModalOpen(false)}
                      className="px-3 py-1.5 text-xs text-stone-500"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    >
                      Kasadan Masraf Düş
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
          />
        </>
      )}
    </div>
  );
};
