import React, { useState } from 'react';
import { PaymentMethod } from '../types';
import { ArrowUpRight, Banknote, CreditCard, Send, X, Check, Truck, Zap, Home, Coffee, Users, Package, Wrench, FileText } from 'lucide-react';

interface MoneyOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    paymentMethod: PaymentMethod;
    category: string;
    description: string;
  }) => Promise<void>;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2500];

const EXPENSE_CATEGORIES = [
  { id: 'toptanci', label: 'Toptancı Ödemesi / Mal Alımı', icon: Truck },
  { id: 'fatura', label: 'Fatura (Elektrik/Su/İnternet)', icon: Zap },
  { id: 'kira', label: 'Dükkan Kirası / Aidat', icon: Home },
  { id: 'erzak_cay', label: 'Dükkan Çay / Şeker / Temizlik', icon: Coffee },
  { id: 'yevmiye', label: 'Personel Yevmiye / Günlük Avans', icon: Users },
  { id: 'sarf', label: 'Poşet / Kutu / Sarf Malzeme', icon: Package },
  { id: 'tamir', label: 'Tamir / Bakım / Arıza Masrafı', icon: Wrench },
  { id: 'diger', label: 'Diğer Dükkan Masrafı', icon: FileText },
];

export const MoneyOutModal: React.FC<MoneyOutModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('nakit');
  const [selectedCategory, setSelectedCategory] = useState<string>(EXPENSE_CATEGORIES[0].label);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddAmount = (val: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Lütfen geçerli bir harcama tutarı giriniz.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const fullDesc = description.trim()
        ? `${selectedCategory}: ${description.trim()}`
        : `${selectedCategory} (${paymentMethod === 'nakit' ? 'Nakit Kasa Çıkışı' : paymentMethod.toUpperCase()})`;

      await onSubmit({
        amount: numAmount,
        paymentMethod,
        category: selectedCategory,
        description: fullDesc,
      });

      setAmount('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gider kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-lg border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-5 bg-linear-to-r from-rose-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Para Ver / Dükkan Gideri</h2>
              <p className="text-xs text-rose-100">Toptancı, fatura veya dükkan masrafı yaz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Ödenen Masraf Tutarı (₺) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-rose-500">
                ₺
              </span>
              <input
                id="input-money-out-amount"
                type="number"
                step="any"
                min="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 text-2xl sm:text-3xl font-black rounded-xl border-2 border-rose-500/50 bg-rose-50/30 dark:bg-rose-950/20 text-stone-900 dark:text-white focus:outline-hidden focus:border-rose-600 focus:ring-2 focus:ring-rose-500/30 transition-all"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-rose-100 dark:bg-stone-800 dark:hover:bg-rose-900/40 text-stone-800 dark:text-stone-200 hover:text-rose-700 text-xs font-bold border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                >
                  +{val} ₺
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 text-xs font-semibold transition-colors cursor-pointer ml-auto"
              >
                Sıfırla
              </button>
            </div>
          </div>

          {/* Payment Method / Source */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Ödeme Nereden Yapıldı? *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('nakit')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'nakit'
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1 text-rose-600" />
                <span className="text-xs font-bold">Nakit Kasa</span>
                <span className="text-[10px] opacity-75">Çekmeceden</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('kart')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'kart'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-indigo-600" />
                <span className="text-xs font-bold">Şirket Kartı</span>
                <span className="text-[10px] opacity-75">Banka Kartı</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('havale')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'havale'
                    ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 font-bold shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Send className="w-5 h-5 mb-1 text-cyan-600" />
                <span className="text-xs font-bold">Havale / FAST</span>
                <span className="text-[10px] opacity-75">Hesaptan</span>
              </button>
            </div>
          </div>

          {/* Category Selector Grid */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Harcama Nedir? (Masraf Kalemi)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.label;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.label)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold ring-1 ring-rose-400'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-rose-600' : 'text-stone-400'}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description / To Whom */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Kime Verildi / Detay Açıklama
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Ekmekçi fırıncıya verildi, elektrik faturası, çırak yevmiyesi..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-colors"
            />
          </div>

          {/* Footer Submit Button */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              id="btn-confirm-money-out"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>{isSubmitting ? 'Düşülüyor...' : 'Kasadan Düş (Gideri Kaydet)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
