import React from 'react';
import { Customer } from '../types';
import { formatCurrency, formatPhoneNumber, getCategoryColor, getCategoryLabel } from '../utils/formatters';
import { MessageSquare, CheckCircle2, Clock, BellRing } from 'lucide-react';

interface UpcomingRemindersProps {
  customers: Customer[];
  onOpenWhatsApp: (customer: Customer, reminderType?: 'aidat' | 'bakim' | 'veresiye') => void;
  onOpenPayment: (customer: Customer) => void;
}

export const UpcomingReminders: React.FC<UpcomingRemindersProps> = ({
  customers,
  onOpenWhatsApp,
  onOpenPayment,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter customers with subscriptions or due dates that are overdue, due today, or due in the next 3 days
  const dueCustomers = customers.filter((c) => {
    if (!c.subscriptionPlan?.enabled || !c.subscriptionPlan.nextDueDate) return false;
    // Check if overdue, due today, or due within 3 days
    const dueDate = c.subscriptionPlan.nextDueDate;
    const diffDays = Math.ceil((new Date(dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24));
    return diffDays <= 3;
  }).sort((a, b) => {
    const dueA = a.subscriptionPlan?.nextDueDate || '';
    const dueB = b.subscriptionPlan?.nextDueDate || '';
    return dueA.localeCompare(dueB);
  });

  if (dueCustomers.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-base font-bold text-stone-900">Günü Gelen Tahsilat &amp; Bakımlar</h2>
          </div>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            Hepsi Güncel
          </span>
        </div>
        <p className="text-xs text-stone-500">
          Şu an günü geçen veya acil hatırlatılması gereken periyodik ödeme ya da teknik servis bakımı bulunmuyor.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-bold text-stone-900">
            Günü Gelen Tahsilat &amp; Bakımlar
          </h2>
          <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 rounded-full">
            {dueCustomers.length} Müşteri
          </span>
        </div>
        <span className="text-xs text-stone-500 hidden sm:inline">
          Otomatik WhatsApp &amp; SMS Hatırlatması
        </span>
      </div>

      <div className="space-y-2.5">
        {dueCustomers.map((cust) => {
          const sub = cust.subscriptionPlan!;
          const isOverdue = sub.nextDueDate < todayStr;
          const isToday = sub.nextDueDate === todayStr;
          const catColor = getCategoryColor(cust.businessCategory);

          return (
            <div
              key={cust.id}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isOverdue
                  ? 'bg-rose-50/60 border-rose-200'
                  : isToday
                  ? 'bg-amber-50/60 border-amber-200'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                  {getCategoryLabel(cust.businessCategory)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-stone-900">{cust.name}</h3>
                    <span className="text-xs text-stone-500">{formatPhoneNumber(cust.phone)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs">
                    <span className="font-medium text-stone-700">{sub.title}</span>
                    <span className="text-stone-300">•</span>
                    <span className="font-bold text-stone-900">{formatCurrency(sub.amount)}</span>
                    <span className="text-stone-300">•</span>
                    {isOverdue ? (
                      <span className="text-rose-700 font-bold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Gecikti ({sub.nextDueDate})
                      </span>
                    ) : isToday ? (
                      <span className="text-amber-800 font-bold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Bugün Ödenecek
                      </span>
                    ) : (
                      <span className="text-stone-500">Vade: {sub.nextDueDate}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  id={`btn-remind-${cust.id}`}
                  type="button"
                  onClick={() => onOpenWhatsApp(cust, cust.businessCategory === 'teknik_servis' ? 'bakim' : 'aidat')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Hatırlat</span>
                </button>

                <button
                  id={`btn-pay-${cust.id}`}
                  type="button"
                  onClick={() => onOpenPayment(cust)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tahsil Et</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
