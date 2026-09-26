import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, ReceiptText } from 'lucide-react';
import type { CashRegister, Customer, Supplier, Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/formatters';
import type { ActiveTab } from '../App';

interface HomeDashboardProps {
  cash: CashRegister;
  transactions: Transaction[];
  customers: Customer[];
  suppliers: Supplier[];
  onNavigate: (tab: ActiveTab) => void;
}

function parseDate(d: string): number {
  const t = new Date(d.includes(' ') && !d.includes('T') ? d.replace(' ', 'T') : d).getTime();
  return isNaN(t) ? 0 : t;
}

// Yerel güne göre kova anahtarı (UTC kayması hatasını önler)
function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}


const ROW_META: Record<TransactionType, { label: string; dot: string; text: string }> = {
  veresiye: { label: 'Alacak Kaydı', dot: 'bg-emerald-500', text: 'text-emerald-500' },
  tahsilat: { label: 'Ödeme Aldım', dot: 'bg-blue-500', text: 'text-blue-400' },
  gider: { label: 'Gider', dot: 'bg-rose-500', text: 'text-rose-500' },
  masraf: { label: 'Masraf', dot: 'bg-orange-500', text: 'text-orange-400' },
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  cash,
  transactions,
  customers,
  suppliers,
  onNavigate,
}) => {
  const alacak = cash.totalReceivables || 0;
  const borc = useMemo(
    () => suppliers.reduce((s, x) => s + Math.max(0, x.balance || 0), 0),
    [suppliers]
  );
  const net = alacak - borc;

  const topDebtors = useMemo(
    () =>
      customers
        .filter((c) => (c.balance || 0) > 0)
        .sort((a, b) => (b.balance || 0) - (a.balance || 0))
        .slice(0, 5),
    [customers]
  );

  const todayStats = useMemo(() => {
    const today = dayKey(Date.now());
    const list = transactions.filter((t) => {
      const ts = parseDate(t.date);
      return ts > 0 && dayKey(ts) === today;
    });
    return {
      count: list.length,
      volume: list.reduce((s, t) => s + Math.abs(t.amount || 0), 0),
    };
  }, [transactions]);

  const debtorCount = useMemo(() => customers.filter((c) => (c.balance || 0) > 0).length, [customers]);

  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);

  return (
    <div className="space-y-4">
      {/* Net durum + en yüksek alacaklar */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800">
          <div className="bg-emerald-500/10 dark:bg-emerald-500/10 px-4 py-2 text-center border-b border-stone-200 dark:border-stone-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Net Durum — {net > 0 ? 'Net Alacaklısınız' : net < 0 ? 'Net Borçlusunuz' : 'Dengede'}
            </p>
            <p className={`text-xl font-black ${net < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net)).replace('₺', '₺')}
            </p>
          </div>
          <div className="grid grid-cols-2 bg-white dark:bg-stone-900">
            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="p-5 text-center border-r border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
            >
              <span className="mx-auto w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </span>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-stone-400">Alacaklarım</p>
              <p className="text-xl font-black text-emerald-500">{formatCurrency(alacak)}</p>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">Listele →</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="p-5 text-center hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
            >
              <span className="mx-auto w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </span>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-stone-400">Borçlarım</p>
              <p className="text-xl font-black text-rose-500">{formatCurrency(borc)}</p>
              <p className="text-[11px] font-bold text-rose-500 mt-1">Listele →</p>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('customers')}
          className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 text-left hover:border-amber-500/50 transition-colors cursor-pointer"
        >
          <p className="text-xs font-black text-stone-900 dark:text-white flex items-center justify-between">
            En Yüksek Alacaklar
            <span className="text-emerald-500">{debtorCount} kişi →</span>
          </p>
          <ul className="mt-3 space-y-2">
            {topDebtors.length === 0 && (
              <li className="text-xs font-semibold text-stone-400">Alacaklı müşteri yok. Tertemiz defter.</li>
            )}
            {topDebtors.map((c, i) => (
              <li key={c.id} className="flex items-center justify-between gap-2 text-xs font-bold">
                <span className="truncate text-stone-600 dark:text-stone-300">
                  <span className="text-stone-400 mr-1.5">{i + 1}.</span>
                  {c.name}
                </span>
                <span className="text-emerald-500 shrink-0">{formatCurrency(c.balance)}</span>
              </li>
            ))}
          </ul>
        </button>
      </div>

      {/* Bugün şeridi */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-3 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
            <ReceiptText className="w-4 h-4" />
          </span>
          <p className="text-xs font-black text-stone-500 dark:text-stone-400">
            BUGÜN <span className="text-stone-900 dark:text-white text-sm mx-1">{todayStats.count} işlem</span> ·
            <span className="text-blue-500 text-sm ml-1">{formatCurrency(todayStats.volume)}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-3 flex items-center justify-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center text-xs font-black">₺</span>
          <span className="text-sm font-black text-rose-500">{debtorCount}</span>
          <span className="text-[11px] font-bold text-stone-400">borçlu</span>
        </div>
      </div>

      {/* Son işlemler */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4">
        <button
          type="button"
          onClick={() => onNavigate('activity')}
          className="w-full flex items-center justify-between text-xs font-black text-stone-900 dark:text-white cursor-pointer"
        >
          Son İşlemler <ArrowRight className="w-4 h-4 text-stone-400" />
        </button>
        <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
          {recent.length === 0 && (
            <li className="py-3 text-xs font-semibold text-stone-400">Henüz işlem yok. İlk satışı girerek başla.</li>
          )}
          {recent.map((t) => {
            const meta = ROW_META[t.type];
            const positive = t.type === 'tahsilat' || t.type === 'veresiye';
            return (
              <li key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-stone-800 dark:text-stone-100 truncate">
                    {t.customerName || meta.label}
                  </span>
                  <span className="block text-[11px] font-semibold text-stone-400 truncate">
                    {meta.label}{t.description ? ` · ${t.description}` : ''}
                  </span>
                </span>
                <span className={`shrink-0 text-[13px] font-black ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {positive ? '+' : '−'}{formatCurrency(Math.abs(t.amount || 0))}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
