import React, { useState } from 'react';
import { Customer, TransactionType, PaymentMethod } from '../types';
import { formatCurrency } from '../utils/formatters';
import { X, ArrowUpRight, ArrowDownLeft, Banknote, CreditCard, Send, ShoppingBag } from 'lucide-react';

interface QuickTransactionModalProps {
  initialType?: TransactionType;
  selectedCustomer?: Customer | null;
  customers: Customer[];
  onClose: () => void;
  onSubmit: (data: {
    customerId?: string;
    type: TransactionType;
    amount: number;
    paymentMethod: PaymentMethod;
    description: string;
  }) => Promise<void>;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  initialType = 'veresiye',
  selectedCustomer = null,
  customers,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [customerId, setCustomerId] = useState<string>(selectedCustomer?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialType === 'veresiye' ? 'veresiye' : 'nakit'
  );
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const activeCustomer = customers.find((c) => c.id === customerId);

  // Quick amount buttons
  const addAmount = (val: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
  };

  const handlePayFullDebt = () => {
    if (activeCustomer && activeCustomer.balance > 0) {
      setAmount(String(activeCustomer.balance));
    }
  };

  // Quick expense tags for small shops
  const setExpenseQuick = (tag: string) => {
    setDescription(tag);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      alert('Lütfen geçerli bir tutar giriniz.');
      return;
    }

    if (type !== 'gider' && !customerId) {
      alert('Lütfen işlem yapılacak müşteriyi seçiniz.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        customerId: type === 'gider' ? undefined : customerId,
        type,
        amount: num,
        paymentMethod: type === 'veresiye' ? 'veresiye' : paymentMethod,
        description:
          description.trim() ||
          (type === 'veresiye'
            ? 'Veresiye Alışveriş'
            : type === 'tahsilat'
            ? 'Borç Ödemesi'
            : 'Dükkan Masrafı'),
      });
      onClose();
    } catch (err) {
      console.error('Transaction submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Tabs */}
        <div className="p-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-stone-900">
              {type === 'veresiye'
                ? 'Deftere Borç Yaz'
                : type === 'tahsilat'
                ? 'Müşteriden Para Al / Borç Düş'
                : 'Dükkan Harcaması / Masraf Yaz'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Tabs */}
          <div className="grid grid-cols-3 gap-1.5 bg-stone-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              id="tab-veresiye"
              type="button"
              onClick={() => {
                setType('veresiye');
                setPaymentMethod('veresiye');
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                type === 'veresiye'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Veresiye Yaz</span>
            </button>

            <button
              id="tab-tahsilat"
              type="button"
              onClick={() => {
                setType('tahsilat');
                setPaymentMethod('nakit');
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                type === 'tahsilat'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Para Aldım</span>
            </button>

            <button
              id="tab-gider"
              type="button"
              onClick={() => {
                setType('gider');
                setPaymentMethod('nakit');
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                type === 'gider'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Harcama</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Customer Selector (for Veresiye & Tahsilat/Para Geldi) */}
          {type !== 'gider' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Müşteri Seçimi <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-transaction-customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
              >
                <option value="">-- Müşteri Seçiniz --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Borç: {formatCurrency(c.balance)})
                  </option>
                ))}
              </select>

              {activeCustomer && (
                <div className="mt-1.5 flex items-center justify-between text-xs px-2.5 py-1.5 bg-stone-100 rounded-lg text-stone-600">
                  <span>Defterdeki Güncel Borç:</span>
                  <span className="font-bold text-amber-700 text-sm">
                    {formatCurrency(activeCustomer.balance)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick Expense Tags if "Dükkan Harcaması" */}
          {type === 'gider' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Hızlı Masraf Türü
              </label>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setExpenseQuick('Toptancı Ödemesi (Mal Alımı)')}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg border border-rose-200 font-medium cursor-pointer"
                >
                  🚚 Toptancı
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseQuick('Dükkan Faturası (Elektrik/Su/İnternet)')}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg border border-stone-200 font-medium cursor-pointer"
                >
                  🧾 Fatura / Kira
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseQuick('Çay, Yemek ve Mutfak Masrafı')}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg border border-stone-200 font-medium cursor-pointer"
                >
                  ☕ Çay &amp; Yemek
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseQuick('Usta / Eleman Günlük Yevmiye')}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg border border-stone-200 font-medium cursor-pointer"
                >
                  🛠️ Yevmiye
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseQuick('Poşet, Koli ve Sarf Malzeme')}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg border border-stone-200 font-medium cursor-pointer"
                >
                  📦 Poşet &amp; Malzeme
                </button>
              </div>
            </div>
          )}

          {/* Amount Input & Quick Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700">
                {type === 'veresiye'
                  ? 'Veresiye Yazılacak Tutar (TL)'
                  : type === 'tahsilat'
                  ? 'Alınan Ödeme Tutarı (TL)'
                  : 'Harcama Tutarı (TL)'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              {type === 'tahsilat' && activeCustomer && activeCustomer.balance > 0 && (
                <button
                  type="button"
                  onClick={handlePayFullDebt}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  Tüm Borcu Sıfırla ({formatCurrency(activeCustomer.balance)})
                </button>
              )}
            </div>

            <div className="relative">
              <input
                id="input-transaction-amount"
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-4 pr-12 py-3 text-xl font-black bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-lg">
                ₺
              </span>
            </div>

            {/* Quick Amount Pills */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => addAmount(50)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer"
              >
                +50 ₺
              </button>
              <button
                type="button"
                onClick={() => addAmount(100)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer"
              >
                +100 ₺
              </button>
              <button
                type="button"
                onClick={() => addAmount(250)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer"
              >
                +250 ₺
              </button>
              <button
                type="button"
                onClick={() => addAmount(500)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer"
              >
                +500 ₺
              </button>
              <button
                type="button"
                onClick={() => addAmount(1000)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer"
              >
                +1000 ₺
              </button>
            </div>
          </div>

          {/* Payment Method (for Tahsilat/Para Geldi & Gider) */}
          {type !== 'veresiye' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {type === 'tahsilat' ? 'Müşteri Nasıl Ödedi?' : 'Parayı Nereden Çıktık?'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('nakit')}
                  className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    paymentMethod === 'nakit'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nakit Elden</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('kart')}
                  className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    paymentMethod === 'kart'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-800 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Kredi Kartı / Pos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('havale')}
                  className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    paymentMethod === 'havale'
                      ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>Havale / IBAN</span>
                </button>
              </div>
            </div>
          )}

          {/* Description / Note */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              İşlem Notu / Ne Alındı veya Ne Ödendi?
            </label>
            <input
              id="input-transaction-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'veresiye'
                  ? 'Örn: 2 ekmek, beyaz peynir, çay'
                  : type === 'tahsilat'
                  ? 'Örn: Kısmi elden ödeme veya Aylık aidat'
                  : 'Örn: Ekmek fırını toptancısı'
              }
              className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Submit Button */}
          <button
            id="btn-submit-transaction"
            type="submit"
            disabled={submitting}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-xs transition-all active:scale-98 cursor-pointer ${
              type === 'veresiye'
                ? 'bg-amber-500 hover:bg-amber-600'
                : type === 'tahsilat'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {submitting
              ? 'Kaydediliyor...'
              : type === 'veresiye'
              ? 'Veresiye Borcunu Deftere Yaz'
              : type === 'tahsilat'
              ? 'Ödemeyi Kasaya Al ve Borcu Düş'
              : 'Dükkan Masrafını Kasadan Düş'}
          </button>
        </form>
      </div>
    </div>
  );
};
