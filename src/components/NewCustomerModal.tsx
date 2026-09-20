import React, { useState } from 'react';
import { Customer, BusinessType, SubscriptionInterval } from '../types';
import { X, UserPlus, Clock } from 'lucide-react';

interface NewCustomerModalProps {
  onClose: () => void;
  onSubmit: (customerData: Partial<Customer> & { initialBalance?: number }) => Promise<void>;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessCategory, setBusinessCategory] = useState<BusinessType>('bakkal_market');
  const [initialBalance, setInitialBalance] = useState('');
  const [notes, setNotes] = useState('');

  // Subscription / Periodic plan
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subInterval, setSubInterval] = useState<SubscriptionInterval>('aylik');
  const [subTitle, setSubTitle] = useState('Aylık Üyelik / Aidat');
  const [subAmount, setSubAmount] = useState('');
  const [subNextDate, setSubNextDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const [submitting, setSubmitting] = useState(false);

  const handleCategoryChange = (cat: BusinessType) => {
    setBusinessCategory(cat);
    if (cat === 'spor_salonu') {
      setHasSubscription(true);
      setSubTitle('Aylık Fitness & Gym Üyeliği');
      setSubInterval('aylik');
    } else if (cat === 'ozel_ders') {
      setHasSubscription(true);
      setSubTitle('Aylık Ders Paketi');
      setSubInterval('aylik');
    } else if (cat === 'teknik_servis') {
      setHasSubscription(true);
      setSubTitle('6 Aylık Periyodik Bakım');
      setSubInterval('periyodik_bakim');
      setSubNextDate(new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]);
    } else {
      setHasSubscription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Lütfen müşteri adı ve telefon numarasını giriniz.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        businessCategory,
        initialBalance: Number(initialBalance) || 0,
        notes: notes.trim(),
        subscriptionPlan: hasSubscription
          ? {
              enabled: true,
              interval: subInterval,
              title: subTitle.trim() || 'Abonelik / Bakım',
              amount: Number(subAmount) || 0,
              nextDueDate: subNextDate,
            }
          : undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to create customer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Yeni Müşteri &amp; Defter Kaydı
              </h3>
              <p className="text-xs text-stone-500">
                Veresiye kartı veya periyodik abonelik tanımlayın
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Business Category */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              İşletme / Müşteri Tipi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleCategoryChange('bakkal_market')}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  businessCategory === 'bakkal_market'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Bakkal &amp; Market
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('spor_salonu')}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  businessCategory === 'spor_salonu'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Spor Salonu
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('ozel_ders')}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  businessCategory === 'ozel_ders'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Özel Ders
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('teknik_servis')}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  businessCategory === 'teknik_servis'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Teknik Servis
              </button>
            </div>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Müşteri Adı - Soyadı <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-customer-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Hasan Yılmaz veya Marangoz Ali"
                className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Telefon Numarası (WhatsApp) <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-customer-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Örn: 0532 123 45 67"
                className="w-full p-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Initial Debt */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Başlangıç Veresiye Devir Bakiyesi (TL)
            </label>
            <div className="relative">
              <input
                id="input-initial-balance"
                type="number"
                min="0"
                step="any"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0 (Borcu varsa yazınız)"
                className="w-full pl-3 pr-8 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                ₺
              </span>
            </div>
          </div>

          {/* Subscription / Periodic Plan Toggle */}
          <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50/70">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSubscription}
                  onChange={(e) => setHasSubscription(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Periyodik Abonelik / Aidat / Bakım Tanımla
                </span>
              </label>
            </div>

            {hasSubscription && (
              <div className="mt-3 space-y-3 pt-3 border-t border-stone-200 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Plan / Hizmet Başlığı
                    </label>
                    <input
                      type="text"
                      value={subTitle}
                      onChange={(e) => setSubTitle(e.target.value)}
                      placeholder="Örn: Aylık Pilates Aidatı"
                      className="w-full p-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Tekrarlama Sıklığı
                    </label>
                    <select
                      value={subInterval}
                      onChange={(e) => setSubInterval(e.target.value as SubscriptionInterval)}
                      className="w-full p-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="haftalik">Haftalık</option>
                      <option value="aylik">Aylık</option>
                      <option value="3_aylik">3 Aylık (Çeyreklik)</option>
                      <option value="yillik">Yıllık</option>
                      <option value="periyodik_bakim">Periyodik Bakım (6 Aylık)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Periyot Tutarı (TL)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={subAmount}
                      onChange={(e) => setSubAmount(e.target.value)}
                      placeholder="Örn: 950"
                      className="w-full p-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Sonraki Ödeme / Bakım Günü
                    </label>
                    <input
                      type="date"
                      value={subNextDate}
                      onChange={(e) => setSubNextDate(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Özel Not / Adres / Cihaz Modeli
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: Her ayın 15'inde kapatır / Apartman no 4 / Arçelik 24000 BTU klima"
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              id="btn-save-new-customer"
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
            >
              {submitting ? 'Kaydediliyor...' : 'Müşteriyi Kaydet ve Defteri Aç'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
