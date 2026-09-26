import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { X, ArrowDownLeft, ArrowUpRight, AlertTriangle, CheckCircle2, PackageCheck, PackageMinus } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  products: Product[];
  initialType?: 'giris' | 'cikis';
  onSubmit: (productId: string, type: 'giris' | 'cikis', quantity: number, reason: string) => Promise<void>;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  products,
  initialType = 'giris',
  onSubmit,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [type, setType] = useState<'giris' | 'cikis'>(initialType);
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedProductId(product.id);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
    setType(initialType);
    setQuantity('1');
    setReason('');
    setError(null);
  }, [product, products, initialType, isOpen]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId) || product;

  const numQuantity = Math.max(0, Number(quantity) || 0);
  const prevStock = currentProduct ? currentProduct.currentStock : 0;
  const newStock =
    type === 'giris'
      ? prevStock + numQuantity
      : Math.max(0, prevStock - numQuantity);

  const threshold = currentProduct ? currentProduct.criticalThreshold : 5;
  const willBeCritical = newStock <= threshold;

  const quickReasonsGiris = [
    'Toptancı İkmal Alımı',
    'Merkez Depo Transferi',
    'Sayım Fazlası Düzeltme',
    'İade Alındı',
  ];

  const quickReasonsCikis = [
    'Tezgâh / Reyon Satışı',
    'Fire / Hasar / Son Kullanma',
    'Dükkan İçi Kullanım / İkram',
    'Sayım Eksiği Düzeltme',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) {
      setError('Lütfen bir ürün seçin.');
      return;
    }

    if (numQuantity <= 0) {
      setError('Lütfen 0\'dan büyük geçerli bir miktar girin.');
      return;
    }

    if (type === 'cikis' && prevStock < numQuantity) {
      if (!confirm(`Mevcut stok (${prevStock} ${currentProduct.unit}) girilen miktardan (${numQuantity}) az. Stok sıfırlanacaktır. Onaylıyor musunuz?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedReason = reason.trim() || (type === 'giris' ? 'Toptancı Stok Girişi' : 'Perakende Stok Çıkışı');
      await onSubmit(currentProduct.id, type, numQuantity, selectedReason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Stok hareketi işlenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                type === 'giris'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              }`}
            >
              {type === 'giris' ? <PackageCheck className="w-5 h-5" /> : <PackageMinus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                {type === 'giris' ? 'Stok Girişi Yap (+)' : 'Stok Çıkışı Yap (-)'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {currentProduct ? currentProduct.name : 'Ürün Seçiniz'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-800 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => setType('giris')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'giris'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Giriş (+) Mal Geldi</span>
            </button>
            <button
              type="button"
              onClick={() => setType('cikis')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'cikis'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Çıkış (-) Satış/Fire</span>
            </button>
          </div>

          {/* Product Selector (if not locked to a specific product) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Ürün
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Mevcut: {p.currentStock} {p.unit}) {p.currentStock <= p.criticalThreshold ? '⚠️ KRİTİK' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Unit */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              İşlem Miktarı ({currentProduct?.unit || 'Adet'})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.1"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Örn. 5"
                className="flex-1 px-3 py-2 text-base font-bold bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <span className="px-3 py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-sm font-bold rounded-xl border border-stone-200 dark:border-stone-700">
                {currentProduct?.unit || 'Adet'}
              </span>
            </div>
          </div>

          {/* Live Calculation Preview */}
          {currentProduct && (
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                <span>Mevcut Stok:</span>
                <span className="font-bold text-stone-900 dark:text-white">
                  {prevStock} {currentProduct.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                <span>İşlem:</span>
                <span className={`font-bold ${type === 'giris' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {type === 'giris' ? '+' : '-'} {numQuantity} {currentProduct.unit}
                </span>
              </div>
              <div className="border-t border-stone-200 dark:border-stone-700 pt-2 flex items-center justify-between font-black text-sm">
                <span className="text-stone-900 dark:text-white">Yeni Kalan Stok:</span>
                <span
                  className={
                    willBeCritical
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }
                >
                  {newStock} {currentProduct.unit}
                </span>
              </div>

              {/* Critical Alert Preview */}
              {willBeCritical && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 flex items-center gap-2 text-[11px] font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    ⚠️ Kritik Stok Eşiği: Bu ürünün eşik sınırı {threshold} {currentProduct.unit}. İşlem sonrası kritik seviyede olacaktır!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reason / Note & Quick Chips */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              İşlem Nedeni / Açıklama
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={type === 'giris' ? 'Örn. Bereket Gıda Toptan İkmal' : 'Örn. Müşteri Tezgâh Satışı'}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(type === 'giris' ? quickReasonsGiris : quickReasonsCikis).map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className="text-[11px] px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                type === 'giris'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                'Kaydediliyor...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Stok {type === 'giris' ? 'Girişini' : 'Çıkışını'} Onayla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
