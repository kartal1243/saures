import React, { useState } from 'react';
import { Customer, PaymentMethod, ServiceItem } from '../../types';
import { Banknote, CreditCard, Send, X, Check, ShoppingBag, Store, User, Sparkles } from 'lucide-react';

interface MoneyInModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  services?: ServiceItem[];
  showServices?: boolean;
  onSubmit: (data: {
    amount: number;
    paymentMethod: PaymentMethod;
    category: string;
    customerId?: string;
    description: string;
  }) => Promise<void>;
}

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];

const INCOME_CATEGORIES = [
  'Tezgâh / Reyon Satışı',
  'Hizmet & İşçilik Bedeli',
  'Paket / Sipariş Satışı',
  'Müşteri Cari / Borç Tahsilatı',
  'Toplu Satış & Toptan',
  'Diğer Kasa Girişi',
];

export const MoneyInModal: React.FC<MoneyInModalProps> = ({
  isOpen,
  onClose,
  customers,
  services = [],
  showServices = false,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('nakit');
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
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
      setError('Lütfen geçerli bir tutar giriniz.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const autoDesc = description.trim() || `${category} (${paymentMethod.toUpperCase()})`;
      await onSubmit({
        amount: numAmount,
        paymentMethod,
        category,
        customerId: selectedCustomerId || undefined,
        description: autoDesc,
      });
      // reset
      setAmount('');
      setDescription('');
      setSelectedCustomerId('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'İşlem kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-lg border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-5 bg-linear-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Para Al / Kasa Girişi</h2>
              <p className="text-xs text-emerald-100">Satış, tahsilat veya dükkana giren nakit/kart</p>
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

          {/* Amount input with Big Display */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Alınan Tutar (₺) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-stone-400 dark:text-stone-500">
                ₺
              </span>
              <input
                id="input-money-in-amount"
                type="number"
                step="any"
                min="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 text-2xl sm:text-3xl font-black rounded-xl border-2 border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20 text-stone-900 dark:text-white focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 transition-all"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-100 dark:bg-stone-800 dark:hover:bg-emerald-900/40 text-stone-800 dark:text-stone-200 hover:text-emerald-700 text-xs font-bold border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
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

          {/* Hizmet hızlı seçim (berber modu): tek tıkla tutar + kategori dolar */}
          {showServices && services.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Hizmet Seç (Tek Tıkla Satış)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setAmount(String(s.price));
                      setCategory('Hizmet & İşçilik Bedeli');
                      setDescription(s.name);
                    }}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-left ${
                      description === s.name && Number(amount) === s.price
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-stone-100 hover:bg-emerald-100 dark:bg-stone-800 dark:hover:bg-emerald-900/40 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <span className="block truncate">{s.name}</span>
                    <span className={`block font-black ${description === s.name && Number(amount) === s.price ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {s.price} ₺
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method Radio Group */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Ödeme Nasıl Alındı? *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Nakit */}
              <button
                type="button"
                onClick={() => setPaymentMethod('nakit')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'nakit'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
                <span className="text-xs font-bold">Nakit</span>
                <span className="text-[10px] opacity-75">Kasaya</span>
              </button>

              {/* POS / Kart */}
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
                <span className="text-xs font-bold">POS / Kart</span>
                <span className="text-[10px] opacity-75">Banka</span>
              </button>

              {/* IBAN / FAST */}
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
                <span className="text-xs font-bold">IBAN / FAST</span>
                <span className="text-[10px] opacity-75">Havale</span>
              </button>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Giriş Türü / Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer"
            >
              {INCOME_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Customer */}
          {customers.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Müşteri (İsteğe Bağlı - Borçtan Düşer)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="">Genel Müşteri / Tezgâh Satışı (Cari Yok)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.balance > 0 ? `(Borcu: ${c.balance} ₺)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Açıklama / Fiş Notu
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: 2 ekmek 1 peynir, 1 saç tıraşı, klima kontrolü..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors"
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
              id="btn-confirm-money-in"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>{isSubmitting ? 'Kasaya İşleniyor...' : 'Kasaya Ekle (Satışı Tamamla)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
