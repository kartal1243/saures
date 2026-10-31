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
} from 'lucide-react';
import { MenuItem, RestaurantTable, TableOrderItem } from '../../../shared/types.ts';
import { RestaurantMenuManager } from './RestaurantMenuManager';
import { TableQrMenuModal } from './TableQrMenuModal';

interface RestaurantTablesViewProps {
  tables: RestaurantTable[];
  isVip?: boolean;
  onOpenVip?: () => void;
  onAddOrderToTable: (tableId: string, item: { name: string; quantity: number; unitPrice: number }) => Promise<void>;
  onCheckoutTable: (tableId: string, paymentMethod: 'nakit' | 'kart') => Promise<void>;
  onResetTable: (tableId: string) => Promise<void>;
  onAddQuickExpense: (description: string, amount: number) => Promise<void>;
  onAddTable: (name: string) => Promise<void>;
  onDeleteTable: (id: string) => Promise<void>;
}

const DEFAULT_MENU_FALLBACK: MenuItem[] = [
  { id: 'm_cay', name: 'Çaykur Çay', price: 15, category: 'İçecekler', isAvailable: true },
  { id: 'm_kahve', name: 'Türk Kahvesi', price: 45, category: 'İçecekler', isAvailable: true },
  { id: 'm_su', name: 'Cam Şişe Su', price: 15, category: 'İçecekler', isAvailable: true },
  { id: 'm_ayran', name: 'Köy Yayık Ayranı', price: 30, category: 'İçecekler', isAvailable: true },
  { id: 'm_tost', name: 'Kaşarlı Karışık Tost', price: 75, category: 'Aperatif & Tost', isAvailable: true },
  { id: 'm_corba', name: 'Kelle Paça / Mercimek Çorbası', price: 65, category: 'Çorbalar', isAvailable: true },
  { id: 'm_kofte', name: 'Izgara Köfte Porsiyon', price: 190, category: 'Ana Yemekler', isAvailable: true },
  { id: 'm_doner', name: 'Et Döner Dürüm Menü', price: 175, category: 'Ana Yemekler', isAvailable: true },
  { id: 'm_borek', name: 'Gözleme / Börek Porsiyon', price: 85, category: 'Aperatif & Tost', isAvailable: true },
  { id: 'm_sutlac', name: 'Fırın Sütlaç & Tatlı', price: 75, category: 'Tatlılar', isAvailable: true },
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

  // Mobile Adisyon Tab: 'menu' (Add items) or 'orders' (Review bill & checkout)
  const [mobileTab, setMobileTab] = useState<'menu' | 'orders'>('menu');

  // Fetch menu from server on mount
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
    loadMenu();
    return () => {
      active = false;
    };
  }, []);

  // Keep selectedTable updated with latest table from props
  const activeTable = selectedTable
    ? tables.find((t) => t.id === selectedTable.id) || selectedTable
    : null;

  // Overview metrics
  const occupiedCount = tables.filter((t) => t.isOccupied).length;
  const emptyCount = tables.length - occupiedCount;
  const totalOpenAdisyon = tables.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  // Categories list for quick filtering inside the adisyon modal
  const menuCategories = ['Tümü', ...Array.from(new Set(menuItems.map((m) => m.category || 'Genel')))];
  const filteredMenuItems = menuItems.filter(
    (item) => selectedMenuCat === 'Tümü' || item.category === selectedMenuCat
  );

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

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount) return;
    await onAddQuickExpense(expenseDesc.trim(), Number(expenseAmount));
    setIsExpenseModalOpen(false);
    setExpenseDesc('');
    setExpenseAmount('');
  };

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
                  Restoran, Kafe &amp; Lokanta Masaları
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                Görsel masa planı, anlık açık adisyonlar, hızlı menü siparişi ve tek tıkla hesap kapatma.
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
                <span>Hal / Mutfak Masrafı Ekle</span>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">Masalardaki Açık Hesap</span>
                <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">
                  {totalOpenAdisyon} ₺
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Masa ekleme formu */}
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
              className="flex gap-2 p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60"
            >
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder={`Masa adı (örn: Masa ${tables.length + 1})`}
                autoFocus
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                disabled={isAdding}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isAdding ? '...' : 'Ekle'}
              </button>
            </form>
          )}

          {tables.length === 0 && !isAddOpen && (
            <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 text-center">
              <UtensilsCrossed className="w-8 h-8 mx-auto text-stone-300" />
              <p className="mt-2 text-sm font-bold text-stone-500">Henüz masa yok.</p>
              <p className="text-xs text-stone-400 mt-1">Yukarıdaki "Masa Ekle" ile salonunu kurmaya başla.</p>
            </div>
          )}

          {/* Bento Grid: Masalar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => {
              const isOccupied = table.isOccupied;

              return (
                <div
                  key={table.id}
                  onClick={() => {
                    setSelectedTable(table);
                    setMobileTab(table.orders.length > 0 ? 'orders' : 'menu');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative group ${
                    isOccupied
                      ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800 shadow-xs hover:border-orange-400'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-sm text-stone-900 dark:text-white truncate">
                      {table.name}
                    </span>

                    <span className="flex items-center gap-1 shrink-0">
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
                          {table.orders.length} çeşit sipariş açık
                        </p>
                      </div>
                    ) : (
                      <div className="py-2 text-xs text-stone-400 dark:text-stone-500">
                        Sipariş açmak için dokunun
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
                      <span>Masa Temiz</span>
                    )}

                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:underline">
                      Adisyon Aç →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Adisyon Modal / Drawer (Responsive Mobile + Desktop Overhaul) */}
          {activeTable && (
            <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-black/70 sm:p-4 backdrop-blur-xs">
              <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl bg-white dark:bg-stone-900 flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                
                {/* 1. Modal Header (Masa Adı, Durum ve Kapat Butonu) */}
                <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between">
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
                          {activeTable.isOccupied ? 'DOLU MASA' : 'BOŞ MASA'}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {activeTable.isOccupied
                          ? `Açılış Saati: ${activeTable.openedAt || 'Bugün'} • Toplam ${activeTable.orders.length} Kalem`
                          : 'Sipariş ekleyerek adisyonu başlatabilirsiniz'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTable(null)}
                    className="w-9 h-9 rounded-xl bg-stone-200/60 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center font-bold transition-colors cursor-pointer text-base"
                    title="Kapat"
                  >
                    ✕
                  </button>
                </div>

                {/* 2. Mobile Segmented Tab Switcher (Sadece Mobilde Görünür) */}
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
                    <span>Menüden Ekle</span>
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

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTable(null);
                            setMainTab('qr_menu');
                          }}
                          className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Menüyü Düzenle</span>
                        </button>
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
                            className="p-2.5 rounded-xl text-left bg-stone-50 hover:bg-orange-50 dark:bg-stone-800/80 dark:hover:bg-orange-950/40 border border-stone-200 dark:border-stone-700/80 transition-all cursor-pointer active:scale-95 group flex flex-col justify-between"
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

                      {/* Özel Sipariş / Tutar Yazma Formu */}
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
                          <span>Bu lezzeti menüme de kaydet (sonraki siparişlerde görünür)</span>
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

                    {/* SAĞ SÜTUN / AÇIK ADİSYON & HESAP LİSTESİ (Mobilde mobileTab === 'orders' iken açık) */}
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
                                <div className="font-bold text-stone-900 dark:text-white truncate">
                                  {ord.name}
                                </div>
                                <div className="text-[11px] text-stone-400 dark:text-stone-500">
                                  Birim: {ord.unitPrice} ₺
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Adet Azalt / Artır */}
                                <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden bg-white dark:bg-stone-800 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAddOrderToTable(activeTable.id, {
                                        name: ord.name,
                                        quantity: -1,
                                        unitPrice: ord.unitPrice,
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
                                      })
                                    }
                                    className="px-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                                    title="1 Adet Ekle"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <span className="font-black text-stone-900 dark:text-white min-w-14 text-right">
                                  {ord.total} ₺
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    onAddOrderToTable(activeTable.id, {
                                      name: ord.name,
                                      quantity: -ord.quantity,
                                      unitPrice: ord.unitPrice,
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

                      {/* Masa Toplamı */}
                      <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between mt-auto">
                        <span className="text-xs font-bold text-stone-600 dark:text-stone-400">
                          Adisyon Toplamı:
                        </span>
                        <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                          {activeTable.totalAmount} ₺
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Sticky Bottom Action Bar (Telefonda Asla Kesilmez) */}
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

                  {/* Nakit & Kartla Hesap Kapat Butonları */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={activeTable.totalAmount <= 0}
                      onClick={async () => {
                        await onCheckoutTable(activeTable.id, 'nakit');
                        setSelectedTable(null);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Nakit Kapat</span>
                    </button>

                    <button
                      type="button"
                      disabled={activeTable.totalAmount <= 0}
                      onClick={async () => {
                        await onCheckoutTable(activeTable.id, 'kart');
                        setSelectedTable(null);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Kart / POS</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Hal / Mutfak Masrafı Ekleme Modalı */}
          {isExpenseModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-sm p-6 shadow-xl">
                <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">
                  Restoran / Mutfak Harcaması Kaydet
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
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
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
