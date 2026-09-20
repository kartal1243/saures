import React from 'react';
import { Customer } from '../types';
import { formatCurrency, formatPhoneNumber, getCategoryColor, getCategoryLabel } from '../utils/formatters';
import { MessageSquare, CheckCircle2, Clock, BellRing, ArrowDownLeft } from 'lucide-react';

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
            <h2 className="text-base font-bold text-stone-900">Günü Gelen Düzenli Ödemeler &amp; Bakımlar</h2>
          </div>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            Hepsi Güncel
          </span>
        </div>
        <p className="text-xs text-stone-500">
          Şu an günü geçen veya hatırlatılması gereken periyodik aidat, kurs ödemesi ya da servis bakımı bulunmuyor.
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
            Günü Gelen Düzenli Ödemeler &amp; Bakımlar
          </h2>
          <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 rounded-full">
            {dueCustomers.length} Müşteri
          </span>
        </div>
        <span className="text-xs text-stone-500 hidden sm:inline">
          Tek tıkla WhatsApp hatırlatması veya ödeme girişi
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
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isOverdue
                          ? 'text-rose-600'
                          : isToday
                          ? 'text-amber-600'
                          : 'text-stone-500'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {isOverdue
                        ? `Gecikmiş (${sub.nextDueDate})`
                        : isToday
                        ? 'Bugün Vadesi!'
                        : `Vade: ${sub.nextDueDate}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {/* Ödeme Geldi */}
                <button
                  type="button"
                  onClick={() => onOpenPayment(cust)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Ödeme Geldi</span>
                </button>

                {/* WhatsApp Hatırlat */}
                <button
                  type="button"
                  onClick={() => {
                    const reminderType =
                      cust.businessCategory === 'teknik_servis' ? 'bakim' : 'aidat';
                    onOpenWhatsApp(cust, reminderType);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-300 hover:border-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Hatırlat</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
