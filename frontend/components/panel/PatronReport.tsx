import React, { useMemo, useState } from 'react';
import type { Transaction, Customer, Product, ShopProfile } from '../../../shared/types.ts';
import { formatCurrency } from '../../utils/formatters';
import { dayKey, midnight } from '../../utils/dates';
import {
  Crown,
  Printer,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  HandCoins,
  TriangleAlert,
  CalendarDays,
} from 'lucide-react';

interface PatronReportProps {
  transactions: Transaction[];
  customers: Customer[];
  products: Product[];
  shopProfile: ShopProfile;
}

/** Yerel güne göre son N günü (bugün dahil) YYYY-MM-DD listesi */
function lastDays(n: number): string[] {
  const today = midnight(new Date());
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

export const PatronReport: React.FC<PatronReportProps> = ({
  transactions,
  customers,
  products,
  shopProfile,
}) => {
  const [copied, setCopied] = useState(false);

  const data = useMemo(() => {
    const week = lastDays(7);
    const prev = lastDays(14).slice(0, 7);
    let income = 0;
    let expense = 0;
    let veresiye = 0;
    let prevIncome = 0;
    for (const tx of transactions) {
      const d = (tx.date || '').slice(0, 10);
      const amt = tx.amount || 0;
      if (week.includes(d)) {
        if (tx.type === 'tahsilat') income += amt;
        else if (tx.type === 'gider' || tx.type === 'masraf') expense += amt;
        else if (tx.type === 'veresiye') veresiye += amt;
      } else if (prev.includes(d) && tx.type === 'tahsilat') {
        prevIncome += amt;
      }
    }
    const debtors = customers
      .filter((c) => (c.balance || 0) > 0)
      .sort((a, b) => (b.balance || 0) - (a.balance || 0));
    const totalDebt = debtors.reduce((s, c) => s + (c.balance || 0), 0);
    const critical = products.filter((p) => p.currentStock <= p.criticalThreshold);
    return {
      weekLabel: `${week[0]} → ${week[6]}`,
      income,
      expense,
      net: income - expense,
      veresiye,
      prevIncome,
      debtors: debtors.slice(0, 5),
      debtorCount: debtors.length,
      totalDebt,
      critical,
    };
  }, [transactions, customers, products]);

  const reportText = useMemo(() => {
    const lines = [
      `PATRON RAPORU — ${shopProfile.storeName || 'Dükkanım'} (son 7 gün: ${data.weekLabel})`,
      `Tahsilat: ${formatCurrency(data.income)} | Gider: ${formatCurrency(data.expense)} | Net: ${formatCurrency(data.net)}`,
      `Yazılan veresiye: ${formatCurrency(data.veresiye)}`,
      `Bekleyen alacak: ${formatCurrency(data.totalDebt)} (${data.debtorCount} kişi)`,
    ];
    if (data.debtors.length > 0) {
      lines.push('En borçlu 5:');
      data.debtors.forEach((c, i) =>
        lines.push(`${i + 1}. ${c.name} — ${formatCurrency(c.balance || 0)} (${c.phone})`),
      );
    }
    if (data.critical.length > 0) {
      lines.push(`Kritik stok (${data.critical.length}): ` + data.critical.map((p) => `${p.name} (${p.currentStock} ${p.unit})`).join(', '));
    } else {
      lines.push('Kritik stok yok.');
    }
    return lines.join('\n');
  }, [data, shopProfile.storeName]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = reportText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diff = data.income - data.prevIncome;

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 no-print">
        <h2 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </span>
          Patron Raporu
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
            <Crown className="w-3 h-3" /> VIP
          </span>
        </h2>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={copy}
            title="Raporu kopyala"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-black transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            title="Raporu yazdır"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 dark:bg-white hover:opacity-90 text-white dark:text-stone-900 text-xs font-black transition-opacity cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Yazdır
          </button>
        </div>
      </div>

      <div className="print-target">
        <p className="hidden print:block text-lg font-black">
          Patron Raporu — {shopProfile.storeName || 'Dükkanım'} <span className="text-sm font-bold text-stone-500">(son 7 gün: {data.weekLabel})</span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> Tahsilat
            </p>
            <p className="mt-0.5 text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(data.income)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center justify-center gap-1">
              <TrendingDown className="w-3 h-3" /> Gider
            </p>
            <p className="mt-0.5 text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">{formatCurrency(data.expense)}</p>
          </div>
          <div className={`rounded-xl border px-3 py-2.5 text-center ${data.net >= 0 ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900/50' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/50'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Net</p>
            <p className={`mt-0.5 text-base sm:text-lg font-black ${data.net >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(data.net)}
            </p>
          </div>
        </div>

        <p className="mt-2 text-[11px] font-bold text-stone-500 dark:text-stone-400">
          Geçen hafta tahsilat: {formatCurrency(data.prevIncome)}
          {data.prevIncome > 0 && (
            <span className={diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
              {' '}({diff >= 0 ? '+' : ''}{formatCurrency(diff)})
            </span>
          )}
          {' '}· Yazılan veresiye: {formatCurrency(data.veresiye)}
        </p>

        <div className="mt-3 grid sm:grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 px-3.5 py-3">
            <p className="text-[11px] font-black text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
              <HandCoins className="w-3.5 h-3.5 text-amber-500" />
              En borçlu 5 <span className="text-stone-400 font-bold">· toplam {formatCurrency(data.totalDebt)} ({data.debtorCount} kişi)</span>
            </p>
            {data.debtors.length === 0 ? (
              <p className="mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">Bekleyen alacak yok. 🎉</p>
            ) : (
              <ol className="mt-1.5 space-y-1">
                {data.debtors.map((c, i) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
                    <span className="truncate">{i + 1}. {c.name}</span>
                    <span className="shrink-0 font-black text-rose-500">{formatCurrency(c.balance || 0)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 px-3.5 py-3">
            <p className="text-[11px] font-black text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
              <TriangleAlert className="w-3.5 h-3.5 text-rose-500" />
              Kritik stok ({data.critical.length})
            </p>
            {data.critical.length === 0 ? (
              <p className="mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">Stoklar yeterli. ✅</p>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {data.critical.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 font-black text-rose-500">{p.currentStock} / {p.criticalThreshold} {p.unit}</span>
                  </li>
                ))}
                {data.critical.length > 5 && (
                  <li className="text-[11px] font-bold text-stone-400">+{data.critical.length - 5} ürün daha</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
