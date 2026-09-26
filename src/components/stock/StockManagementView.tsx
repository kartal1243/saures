import React, { useState, useMemo } from 'react';
import { Product, StockMovement } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  History,
  Edit2,
  Trash2,
  CheckCircle2,
  Boxes,
  TrendingUp,
  AlertCircle,
  PackageCheck,
  PackageMinus,
  Sparkles,
  Barcode,
} from 'lucide-react';

interface StockManagementViewProps {
  products: Product[];
  stockMovements: StockMovement[];
  onOpenAdjustment: (product: Product, type: 'giris' | 'cikis') => void;
  onOpenNewProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  initialOnlyCritical?: boolean;
}

export const StockManagementView: React.FC<StockManagementViewProps> = ({
  products,
  stockMovements,
  onOpenAdjustment,
  onOpenNewProduct,
  onOpenEditProduct,
  onDeleteProduct,
  initialOnlyCritical = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyCriticalFilter, setOnlyCriticalFilter] = useState(initialOnlyCritical);
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'movements'>('products');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Critical stock calculation
  const criticalProducts = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.criticalThreshold);
  }, [products]);

  // Total stock stats
  const totalStockCount = useMemo(() => {
    return products.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
  }, [products]);

  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => {
      const price = p.purchasePrice || p.salePrice || 0;
      return acc + (Number(p.currentStock) || 0) * price;
    }, 0);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesCritical = !onlyCriticalFilter || p.currentStock <= p.criticalThreshold;

      return matchesSearch && matchesCategory && matchesCritical;
    });
  }, [products, searchQuery, selectedCategory, onlyCriticalFilter]);

  return (
    <div className="space-y-4">
      {/* 1. Critical Stock Alert Banner (If any item is below critical threshold) */}
      {criticalProducts.length > 0 && (
        <div
          id="banner-critical-stock-alert"
          className="p-4 rounded-2xl bg-linear-to-r from-amber-500/15 via-rose-500/10 to-transparent border border-amber-500/30 dark:border-amber-500/20 shadow-xs animate-in fade-in duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <span>Kritik Stok Uyarısı</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900">
                    {criticalProducts.length} Ürün Azaldı!
                  </span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                  Aşağıdaki ürünler belirlediğiniz kritik eşik seviyesinin altına indi. Toptancı siparişi vermeniz önerilir.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setOnlyCriticalFilter((prev) => !prev);
                setActiveSubTab('products');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs self-start sm:self-center ${
                onlyCriticalFilter
                  ? 'bg-amber-600 text-white'
                  : 'bg-white dark:bg-stone-800 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-stone-700'
              }`}
            >
              {onlyCriticalFilter ? 'Tüm Ürünleri Göster' : 'Sadece Kritik Ürünleri Listele'}
            </button>
          </div>

          {/* Quick chips for critical products */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-amber-500/20 dark:border-amber-500/10">
            {criticalProducts.slice(0, 6).map((cp) => (
              <div
                key={cp.id}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-stone-800/80 border border-amber-200 dark:border-amber-800 text-xs shadow-2xs"
              >
                <span className="font-bold text-stone-900 dark:text-white">{cp.name}</span>
                <span className="px-1.5 py-0.2 rounded font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 text-[11px]">
                  {cp.currentStock} / {cp.criticalThreshold} {cp.unit}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenAdjustment(cp, 'giris')}
                  className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer text-[11px] flex items-center gap-0.5"
                  title="Stok Girişi Yap"
                >
                  <Plus className="w-3 h-3" /> Mal Geldi
                </button>
              </div>
            ))}
            {criticalProducts.length > 6 && (
              <span className="text-xs text-stone-500 dark:text-stone-400 self-center font-medium">
                +{criticalProducts.length - 6} diğer kritik ürün
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Overview Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Toplam Ürün Çeşidi */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-0.5">
              Kayıtlı Çeşit
            </span>
            <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
              {products.length} <span className="text-xs font-semibold text-stone-400">Ürün</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">Aktif dükkan stoğu</p>
          </div>
          <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
            <Boxes className="w-4 h-4" />
          </span>
        </div>

        {/* Metric 2: Kritik Stok Sayısı */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-0.5">
              Kritik Stok
            </span>
            <div
              className={`text-xl sm:text-2xl font-black ${
                criticalProducts.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {criticalProducts.length}{' '}
              <span className="text-xs font-semibold text-stone-400">Ürün</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {criticalProducts.length > 0 ? 'Eşik altında' : 'Tüm stoklar yeterli'}
            </p>
          </div>
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              criticalProducts.length > 0
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>

        {/* Metric 3: Toplam Miktar / Adet */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-0.5">
              Toplam Stok Miktarı
            </span>
            <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
              {totalStockCount} <span className="text-xs font-semibold text-stone-400">Birim</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">Raflardaki toplam ürün</p>
          </div>
          <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
            <Package className="w-4 h-4" />
          </span>
        </div>

        {/* Metric 4: Toplam Stok Değeri */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-0.5">
              Tahmini Stok Değeri
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalStockValue)}
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">Maliyet / Değer karşılığı</p>
          </div>
          <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* 3. Controls & Sub Tabs */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 sm:p-5 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
          {/* Sub Tab Switcher: Ürün Listesi vs Stok Hareket Geçmişi */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('products')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'products'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Ürünler &amp; Stok Durumu ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('movements')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'movements'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Giriş / Çıkış Geçmişi ({stockMovements.length})</span>
            </button>
          </div>

          {/* Action Button: Yeni Ürün Ekle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNewProduct}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Yeni Ürün Ekle</span>
            </button>
          </div>
        </div>

        {activeSubTab === 'products' ? (
          <div className="space-y-4 pt-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ürün adı, barkod veya kategori ile ara..."
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    Temizle
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Tüm Kategoriler ({products.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c} ({products.filter((p) => p.category === c).length})
                    </option>
                  ))}
                </select>

                {/* Only Critical Toggle Button */}
                <button
                  type="button"
                  onClick={() => setOnlyCriticalFilter((prev) => !prev)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    onlyCriticalFilter
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-700'
                  }`}
                  title="Sadece kritik eşik altındaki ürünleri filtrele"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Kritik ({criticalProducts.length})</span>
                </button>
              </div>
            </div>

            {/* Product Table */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                  Arama kriterlerine uygun ürün bulunamadı.
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Filtreleri sıfırlayabilir veya "+ Yeni Ürün Ekle" butonundan ilk stoğunuzu girebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 font-bold text-[11px] uppercase tracking-wider">
                      <th className="pb-3 pl-2">Ürün Adı &amp; Kategori</th>
                      <th className="pb-3 text-center">Mevcut Stok</th>
                      <th className="pb-3 text-center">Kritik Eşik</th>
                      <th className="pb-3 text-right">Alış / Satış</th>
                      <th className="pb-3 text-center">Durum</th>
                      <th className="pb-3 pr-2 text-right">Hızlı Stok Hareketi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                    {filteredProducts.map((product) => {
                      const isOutOfStock = product.currentStock === 0;
                      const isCritical = product.currentStock <= product.criticalThreshold;

                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors group"
                        >
                          {/* Product info */}
                          <td className="py-3 pl-2">
                            <div className="font-bold text-stone-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-[11px] font-medium">
                                {product.category}
                              </span>
                              {product.barcode && (
                                <span className="flex items-center gap-0.5 font-mono text-[10px] text-stone-400">
                                  <Barcode className="w-3 h-3" />
                                  {product.barcode}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Current Stock */}
                          <td className="py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-xl font-black text-sm ${
                                isOutOfStock
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                                  : isCritical
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                                  : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white'
                              }`}
                            >
                              {product.currentStock} {product.unit}
                            </span>
                          </td>

                          {/* Critical Threshold */}
                          <td className="py-3 text-center text-xs text-stone-500 dark:text-stone-400 font-medium">
                            {product.criticalThreshold} {product.unit}
                          </td>

                          {/* Prices */}
                          <td className="py-3 text-right">
                            {product.salePrice ? (
                              <div className="font-bold text-stone-900 dark:text-white">
                                {formatCurrency(product.salePrice)}
                              </div>
                            ) : (
                              <div className="text-stone-400">-</div>
                            )}
                            {product.purchasePrice && (
                              <div className="text-[11px] text-stone-400">
                                Alış: {formatCurrency(product.purchasePrice)}
                              </div>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 text-center">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                <AlertCircle className="w-3 h-3" /> Tükendi!
                              </span>
                            ) : isCritical ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                <AlertTriangle className="w-3 h-3" /> Kritik Stok
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Yeterli
                              </span>
                            )}
                          </td>

                          {/* Quick In/Out Buttons */}
                          <td className="py-3 pr-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenAdjustment(product, 'giris')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                                title="Mal Geldi / Stok Girişi"
                              >
                                <Plus className="w-3 h-3" /> Giriş
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenAdjustment(product, 'cikis')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                                title="Satış / Fire / Stok Çıkışı"
                              >
                                <ArrowUpRight className="w-3 h-3" /> Çıkış
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenEditProduct(product)}
                                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                                title="Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) {
                                    onDeleteProduct(product.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Sub Tab: Stock Movements History */
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                  Stok Giriş &amp; Çıkış Akışı
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Toptancı ikmalleri, fireler ve satış düşüşlerinin kronolojik kaydı
                </p>
              </div>
            </div>

            {stockMovements.length === 0 ? (
              <p className="text-center text-xs text-stone-400 py-10">
                Henüz kaydedilmiş bir stok hareketi bulunmuyor.
              </p>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {stockMovements.map((sm) => (
                  <div
                    key={sm.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-stone-50/50 dark:hover:bg-stone-800/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          sm.type === 'giris'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {sm.type === 'giris' ? (
                          <PackageCheck className="w-4 h-4" />
                        ) : (
                          <PackageMinus className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 dark:text-white">
                          {sm.productName}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {sm.reason}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                          <span>{sm.date}</span>
                          <span>•</span>
                          <span>
                            Önceki: {sm.previousStock} ➜ Sonraki: {sm.newStock}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-black text-sm sm:text-base ${
                          sm.type === 'giris'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {sm.type === 'giris' ? '+' : '-'} {sm.quantity}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        {sm.type === 'giris' ? 'Stok Girişi' : 'Stok Çıkışı'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
