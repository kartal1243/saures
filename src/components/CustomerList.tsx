import React, { useState, useMemo } from 'react';
import { Customer, BusinessType } from '../types';
import { formatCurrency, formatPhoneNumber, getCategoryColor, getCategoryLabel } from '../utils/formatters';
import { Search, UserCheck, MessageSquare, ArrowUpRight, ArrowDownLeft, BookOpen, Clock } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onOpenTransaction: (customer: Customer, type: 'veresiye' | 'tahsilat') => void;
  onOpenWhatsApp: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onSelectCustomer,
  onOpenTransaction,
  onOpenWhatsApp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'has_debt' | 'zero_debt'>('all');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // 1. Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (c.notes && c.notes.toLowerCase().includes(q));

      // 2. Category filter
      const matchesCategory =
        selectedCategory === 'all' || c.businessCategory === selectedCategory;

      // 3. Balance filter
      let matchesBalance = true;
      if (balanceFilter === 'has_debt') matchesBalance = c.balance > 0;
      if (balanceFilter === 'zero_debt') matchesBalance = c.balance <= 0;

      return matchesSearch && matchesCategory && matchesBalance;
    });
  }, [customers, searchQuery, selectedCategory, balanceFilter]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-4 sm:p-5 border-b border-stone-200 space-y-3.5 bg-stone-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Müşteri &amp; Veresiye Kartları
            </h2>
            <p className="text-xs text-stone-500">
              Kayıtlı {customers.length} müşteriden {filteredCustomers.length} tanesi listeleniyor
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-customer-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İsim, telefon veya not ara..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category & Status Filter Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Categories */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="filter-cat-all"
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              Tümü ({customers.length})
            </button>
            <button
              id="filter-cat-bakkal"
              type="button"
              onClick={() => setSelectedCategory('bakkal_market')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'bakkal_market'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              Bakkal / Market
            </button>
            <button
              id="filter-cat-spor"
              type="button"
              onClick={() => setSelectedCategory('spor_salonu')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'spor_salonu'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              Spor Salonu
            </button>
            <button
              id="filter-cat-ders"
              type="button"
              onClick={() => setSelectedCategory('ozel_ders')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'ozel_ders'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              Özel Ders
            </button>
            <button
              id="filter-cat-servis"
              type="button"
              onClick={() => setSelectedCategory('teknik_servis')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'teknik_servis'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              Teknik Servis
            </button>
          </div>

          {/* Balance Filter Toggle */}
          <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setBalanceFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                balanceFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Hepsi
            </button>
            <button
              type="button"
              onClick={() => setBalanceFilter('has_debt')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                balanceFilter === 'has_debt' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Veresiyeli
            </button>
            <button
              type="button"
              onClick={() => setBalanceFilter('zero_debt')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                balanceFilter === 'zero_debt' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Bakiyesiz
            </button>
          </div>
        </div>
      </div>

      {/* Customer List Content */}
      <div className="divide-y divide-stone-100">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-stone-700">Arama kriterinize uygun müşteri bulunamadı.</p>
            <p className="text-xs text-stone-400 mt-1">Filtreleri temizleyebilir veya yeni müşteri ekleyebilirsiniz.</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const catColor = getCategoryColor(cust.businessCategory);
            const initials = cust.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={cust.id}
                className="p-3.5 sm:p-4 hover:bg-stone-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                {/* Left info & category */}
                <div
                  className="flex items-start gap-3 cursor-pointer flex-1"
                  onClick={() => onSelectCustomer(cust)}
                >
                  {/* Initials avatar */}
                  <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 font-bold text-sm flex items-center justify-center border border-stone-200 shrink-0">
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-stone-900 truncate hover:text-amber-600 transition-colors">
                        {cust.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                        {getCategoryLabel(cust.businessCategory)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 flex-wrap">
                      <span className="font-medium text-stone-600">{formatPhoneNumber(cust.phone)}</span>
                      {cust.notes && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="text-stone-500 truncate max-w-xs">{cust.notes}</span>
                        </>
                      )}
                    </div>

                    {/* Subscription / Recurring badge if any */}
                    {cust.subscriptionPlan?.enabled && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[11px] text-stone-700">
                        <Clock className="w-3 h-3 text-stone-500" />
                        <span className="font-semibold">{cust.subscriptionPlan.title}</span>
                        <span className="text-stone-400">|</span>
                        <span>Vade: {cust.subscriptionPlan.nextDueDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Balance & Quick Buttons */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                  {/* Balance Display */}
                  <div
                    className="text-left md:text-right cursor-pointer"
                    onClick={() => onSelectCustomer(cust)}
                  >
                    <div className="text-xs text-stone-400 font-medium">Bakiye</div>
                    <div
                      className={`text-base sm:text-lg font-extrabold tracking-tight ${
                        cust.balance > 0
                          ? 'text-amber-700'
                          : cust.balance === 0
                          ? 'text-emerald-700'
                          : 'text-indigo-700'
                      }`}
                    >
                      {formatCurrency(cust.balance)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Veresiye Ekle */}
                    <button
                      id={`btn-add-debt-${cust.id}`}
                      type="button"
                      onClick={() => onOpenTransaction(cust, 'veresiye')}
                      className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                      title="Veresiye Borç Yaz"
                    >
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    {/* Tahsilat Al */}
                    <button
                      id={`btn-add-payment-${cust.id}`}
                      type="button"
                      onClick={() => onOpenTransaction(cust, 'tahsilat')}
                      className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                      title="Tahsilat Al"
                    >
                      <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    {/* WhatsApp */}
                    <button
                      id={`btn-whatsapp-${cust.id}`}
                      type="button"
                      onClick={() => onOpenWhatsApp(cust)}
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                      title="WhatsApp ile Hatırlat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    {/* Defter / Detay */}
                    <button
                      id={`btn-ledger-${cust.id}`}
                      type="button"
                      onClick={() => onSelectCustomer(cust)}
                      className="px-2.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-200 transition-colors cursor-pointer flex items-center gap-1"
                      title="Hesap Defteri"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Defter</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
