import React, { useState } from 'react';
import { Supplier, PaymentMethod } from '../types';
import { Truck, X, Check, Banknote, CreditCard, Send, ShoppingCart, Wallet } from 'lucide-react';

export type SupplierModalMode = 'form' | 'purchase' | 'pay';

interface SupplierModalProps {
  isOpen: boolean;
  mode: SupplierModalMode;
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; phone: string; notes: string }) => Promise<void>;
  onPurchase: (id: string, amount: number) => Promise<void>;
  onPay: (id: string, amount: number, paymentMethod: PaymentMethod) => Promise<void>;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  mode,
  supplier,
  onClose,
  onSave,
  onPurchase,
  onPay,
}) => {
  const [name, setName] = useState(supplier?.name || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [notes, setNotes] = useState(supplier?.notes || '');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('nakit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numAmount = Number(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'form' && !name.trim()) {
      setError('Tedarikçi adı zorunludur.');
      return;
    }
    if (mode !== 'form' && (!numAmount || numAmount <= 0)) {
      setError('Geçerli bir tutar giriniz.');
      return;
    }
    if (mode !== 'form' && !supplier) {
      setError('Tedarikçi seçilemedi.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === 'form') {
        await onSave({ id: supplier?.id, name: name.trim(), phone: phone.trim(), notes: notes.trim() });
      } else if (mode === 'purchase' && supplier) {
        await onPurchase(supplier.id, numAmount);
      } else if (mode === 'pay' && supplier) {
        await onPay(supplier.id, numAmount, paymentMethod);
      }
      setName('');
      setPhone('');
      setNotes('');
      setAmount('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'İşlem kaydedilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const titles: Record<SupplierModalMode, { title: string; sub: string; icon: React.ReactNode; gradient: string; cta: string }> = {
    form: {
      title: supplier ? 'Tedarikçiyi Düzenle' : 'Yeni Tedarikçi',
      sub: 'Toptancı / fırın / hal cari hesabı aç',
      icon: <Truck className="w-5 h-5 text-white" />,
      gradient: 'from-amber-500 to-orange-600',
      cta: supplier ? 'Değişiklikleri Kaydet' : 'Tedarikçiyi Kaydet',
    },
    purchase: {
      title: 'Veresiye Mal Alımı',
      sub: supplier ? `${supplier.name} — kasaya dokunmaz, borca yazar` : '',
      icon: <ShoppingCart className="w-5 h-5 text-white" />,
      gradient: 'from-blue-600 to-indigo-700',
      cta: 'Borcu Artır (Alımı Yaz)',
    },
    pay: {
      title: 'Tedarikçiye Ödeme',
      sub: supplier ? `${supplier.name} — kasadan düşer, borcu kapatır` : '',
      icon: <Wallet className="w-5 h-5 text-white" />,
      gradient: 'from-emerald-600 to-teal-700',
      cta: 'Ödemeyi Yap (Kasadan Düş)',
    },
  };
  const t = titles[mode];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        <div className={`p-5 bg-linear-to-r ${t.gradient} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">{t.icon}</div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{t.title}</h2>
              <p className="text-xs opacity-85">{t.sub}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {mode === 'form' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Tedarikçi Adı *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Örn: Ekmekçi Fırın, Halci Ahmet, Sütçü..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Not
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: Her sabah ekmek getirir, Salı ödeme..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                />
              </div>
            </>
          ) : (
            <>
              {supplier && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700 dark:text-stone-300">{supplier.name}</span>
                  <span className={`font-black ${supplier.balance > 0 ? 'text-rose-600 dark:text-rose-400' : supplier.balance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`}>
                    {supplier.balance > 0
                      ? `${supplier.balance.toLocaleString('tr-TR')} ₺ borç`
                      : supplier.balance < 0
                      ? `${Math.abs(supplier.balance).toLocaleString('tr-TR')} ₺ avans`
                      : 'Borç yok'}
                  </span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Tutar (₺) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-stone-400">₺</span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-3 text-2xl font-black rounded-xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>
              {mode === 'pay' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Ödeme Nereden?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'nakit' as PaymentMethod, label: 'Nakit Kasa', icon: Banknote },
                      { id: 'kart' as PaymentMethod, label: 'Şirket Kartı', icon: CreditCard },
                      { id: 'havale' as PaymentMethod, label: 'Havale', icon: Send },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                            : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        <m.icon className="w-4 h-4 mb-1" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-black text-sm shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>{isSubmitting ? 'Kaydediliyor...' : t.cta}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
