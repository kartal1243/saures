import React from 'react';
import { Customer } from '../../types';
import { formatCurrency, formatPhoneNumber, getCategoryColor, getCategoryLabel } from '../../utils/formatters';
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
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-base font-bold text-stone-900 dark:text-white">Günü Gelen Düzenli Ödemeler &amp; Bakımlar</h2>
          </div>
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
            Hepsi Güncel
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Şu an günü geçen veya hatırlatılması gereken periyodik aidat, kurs ödemesi ya da servis bakımı bulunmuyor.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border border-amber-200/80 dark:border-amber-900/50 shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-base font-bold text-stone-900 dark:text-white">
            Günü Gelen Düzenli Ödemeler &amp; Bakımlar
          </h2>
          <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full">
            {dueCustomers.length} Müşteri
          </span>
        </div>
        <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">
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
                  ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                  : isToday
                  ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                  : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                  {getCategoryLabel(cust.businessCategory)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">{cust.name}</h3>
                    <span className="text-xs text-stone-500 dark:text-stone-400">{formatPhoneNumber(cust.phone)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs">
                    <span className="font-medium text-stone-700 dark:text-stone-300">{sub.title}</span>
                    <span className="text-stone-300 dark:text-stone-600">•</span>
                    <span className="font-bold text-stone-900 dark:text-white">{formatCurrency(sub.amount)}</span>
                    <span className="text-stone-300 dark:text-stone-600">•</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isOverdue
                          ? 'text-rose-600 dark:text-rose-400'
                          : isToday
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-stone-500 dark:text-stone-400'
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
                  className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-stone-300 dark:border-stone-700 hover:border-emerald-300 dark:hover:border-emerald-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
