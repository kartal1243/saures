import React, { useState } from 'react';
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
} from 'lucide-react';
import { RestaurantTable, TableOrderItem } from '../types';

interface RestaurantTablesViewProps {
  tables: RestaurantTable[];
  onAddOrderToTable: (tableId: string, item: { name: string; quantity: number; unitPrice: number }) => Promise<void>;
  onCheckoutTable: (tableId: string, paymentMethod: 'nakit' | 'kart') => Promise<void>;
  onResetTable: (tableId: string) => Promise<void>;
  onAddQuickExpense: (description: string, amount: number) => Promise<void>;
}

const MENU_SHORTCUTS = [
  { name: 'Çaykur Çay', price: 15, category: 'İçecek' },
  { name: 'Türk Kahvesi', price: 45, category: 'İçecek' },
  { name: 'Cam Şişe Su', price: 15, category: 'İçecek' },
  { name: 'Köy Yayık Ayranı', price: 30, category: 'İçecek' },
  { name: 'Kaşarlı Karışık Tost', price: 75, category: 'Yiyecek' },
  { name: 'Kelle Paça / Mercimek Çorbası', price: 65, category: 'Yiyecek' },
  { name: 'Izgara Köfte Porsiyon', price: 190, category: 'Yiyecek' },
  { name: 'Et Döner Dürüm Menü', price: 175, category: 'Yiyecek' },
  { name: 'Gözleme / Börek Porsiyon', price: 85, category: 'Yiyecek' },
  { name: 'Fırın Sütlaç & Tatlı', price: 75, category: 'Tatlı' },
];

export const RestaurantTablesView: React.FC<RestaurantTablesViewProps> = ({
  tables,
  onAddOrderToTable,
  onCheckoutTable,
  onResetTable,
  onAddQuickExpense,
}) => {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number | ''>('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');

  // Keep selectedTable updated with latest table from props
  const activeTable = selectedTable
    ? tables.find((t) => t.id === selectedTable.id) || selectedTable
    : null;

  // Overview metrics
  const occupiedCount = tables.filter((t) => t.isOccupied).length;
  const emptyCount = tables.length - occupiedCount;
  const totalOpenAdisyon = tables.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

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
    await onAddOrderToTable(activeTable.id, {
      name: customItemName.trim(),
      quantity: 1,
      unitPrice: Number(customItemPrice),
    });
    setCustomItemName('');
    setCustomItemPrice('');
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
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <UtensilsCrossed className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
              Restoran, Kafe & Lokanta Masaları
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Görsel masa planı, anlık açık adisyonlar, sipariş ekleme ve tek tıkla hesap kapatma.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <TrendingDown className="w-4 h-4" />
            <span>Hal / Mutfak Masrafı Ekle</span>
          </button>
        </div>
      </div>

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

      {/* Bento Grid: Masalar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const isOccupied = table.isOccupied;

          return (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative group ${
                isOccupied
                  ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800 shadow-xs hover:border-orange-400'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-stone-900 dark:text-white">
                  {table.name}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isOccupied
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {isOccupied ? 'DOLU' : 'BOŞ'}
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
                    Sipariş açmak için tıklayınız
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

      {/* Adisyon Modal / Drawer */}
      {activeTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-xl p-6 shadow-xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white text-base">
                    {activeTable.name} — Adisyon & Sipariş
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {activeTable.isOccupied ? `Açılış: ${activeTable.openedAt || 'Bugün'}` : 'Şu anda boş masa'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Two columns (Quick Menu & Current Bill) */}
            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Quick Menu Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Hızlı Menüden Masaya Ekle</span>
                </h4>

                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {MENU_SHORTCUTS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleQuickAdd(item.name, item.price)}
                      className="p-2 rounded-xl text-left bg-stone-50 hover:bg-orange-50 dark:bg-stone-800/70 dark:hover:bg-orange-950/40 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer active:scale-95"
                    >
                      <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 line-clamp-1">
                        {item.name}
                      </span>
                      <span className="text-xs font-black text-orange-600 dark:text-orange-400 mt-1 block">
                        +{item.price} ₺
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Item Form */}
                <form onSubmit={handleCustomItemAdd} className="pt-2 border-t border-stone-100 dark:border-stone-800">
                  <span className="text-[11px] font-semibold text-stone-500 block mb-1">
                    Özel Sipariş / Tutar Yaz:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ürün adı (örn: Karışık Meze)"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-xs border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="₺"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-16 px-2.5 py-1.5 rounded-lg text-xs border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-bold"
                    />
                    <button
                      type="submit"
                      className="p-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
                      title="Ekle"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Active Table Adisyon Items */}
              <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-xl border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300">
                  <span>Masa Adisyonu</span>
                  <span>{activeTable.orders.length} Kalem</span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-stone-200/60 dark:divide-stone-700/60 my-2">
                  {activeTable.orders.length === 0 ? (
                    <div className="p-6 text-center text-stone-400 text-xs">
                      Masada henüz sipariş bulunmuyor. Sol taraftan ürün ekleyebilirsiniz.
                    </div>
                  ) : (
                    activeTable.orders.map((ord) => (
                      <div key={ord.id} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-stone-900 dark:text-white">
                            {ord.quantity}x {ord.name}
                          </span>
                          <span className="text-[11px] text-stone-400 ml-1.5">
                            ({ord.unitPrice} ₺)
                          </span>
                        </div>
                        <span className="font-black text-stone-900 dark:text-white">
                          {ord.total} ₺
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Total */}
                <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-300">Toplam Hesap:</span>
                  <span className="text-xl font-black text-orange-600 dark:text-orange-400">
                    {activeTable.totalAmount} ₺
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer: Settle Bill (Nakit / POS) or Clear */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Bu masanın siparişlerini iptal etmek ve boşaltmak istediğinize emin misiniz?')) {
                    await onResetTable(activeTable.id);
                    setSelectedTable(null);
                  }
                }}
                className="text-xs font-semibold text-stone-400 hover:text-rose-600 cursor-pointer"
              >
                Masayı İptal Et / Sıfırla
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={activeTable.totalAmount <= 0}
                  onClick={async () => {
                    await onCheckoutTable(activeTable.id, 'nakit');
                    setSelectedTable(null);
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Nakit Hesabı Kapat</span>
                </button>

                <button
                  type="button"
                  disabled={activeTable.totalAmount <= 0}
                  onClick={async () => {
                    await onCheckoutTable(activeTable.id, 'kart');
                    setSelectedTable(null);
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Kart / POS Hesabı Kapat</span>
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
    </div>
  );
};
