import React, { useMemo, useState } from 'react';
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

type PeriodKey = '1G' | '7G' | '30G' | '1Y';
const PERIOD_DAYS: Record<PeriodKey, number> = { '1G': 1, '7G': 7, '30G': 30, '1Y': 365 };

function parseDate(d: string): number {
  const t = new Date(d.includes(' ') && !d.includes('T') ? d.replace(' ', 'T') : d).getTime();
  return isNaN(t) ? 0 : t;
}

const DAY_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

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
  const [period, setPeriod] = useState<PeriodKey>('30G');

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
    const today = new Date().toDateString();
    const list = transactions.filter((t) => {
      const ts = parseDate(t.date);
      return ts > 0 && new Date(ts).toDateString() === today;
    });
    return {
      count: list.length,
      volume: list.reduce((s, t) => s + Math.abs(t.amount || 0), 0),
    };
  }, [transactions]);

  const debtorCount = useMemo(() => customers.filter((c) => (c.balance || 0) > 0).length, [customers]);

  const periodStats = useMemo(() => {
    const cutoff = Date.now() - PERIOD_DAYS[period] * 86400000;
    const list = transactions.filter((t) => parseDate(t.date) >= cutoff);
    const byType = (type: TransactionType) => {
      const rows = list.filter((t) => t.type === type);
      return { count: rows.length, total: rows.reduce((s, t) => s + Math.abs(t.amount || 0), 0) };
    };
    const veresiye = byType('veresiye');
    const tahsilat = byType('tahsilat');
    const gider = byType('gider');
    const masraf = byType('masraf');
    const grand = veresiye.total + tahsilat.total + gider.total + masraf.total;
    return { veresiye, tahsilat, gider, masraf, grand, netNakit: tahsilat.total - gider.total - masraf.total };
  }, [transactions, period]);

  const trend = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toDateString();
      let v = 0;
      for (const t of transactions) {
        const ts = parseDate(t.date);
        if (ts > 0 && new Date(ts).toDateString() === key) {
          if (t.type === 'tahsilat') v += Math.abs(t.amount || 0);
          else if (t.type === 'gider' || t.type === 'masraf') v -= Math.abs(t.amount || 0);
        }
      }
      days.push({ label: DAY_SHORT[d.getDay()], value: v });
    }
    return days;
  }, [transactions]);

  const trendMax = Math.max(...trend.map((d) => d.value), 0);
  const W = 300;
  const H = 120;
  const PAD = 8;
  const pts = trend.map((d, i) => {
    const x = PAD + (i * (W - PAD * 2)) / 6;
    const y = trendMax > 0 ? H - PAD - (d.value / trendMax) * (H - PAD * 2) : H - PAD;
    return { x, y };
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[6].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;

  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);

  const periodRows: { type: TransactionType; count: number; total: number }[] = [
    { type: 'veresiye', ...periodStats.veresiye },
    { type: 'tahsilat', ...periodStats.tahsilat },
    { type: 'gider', ...periodStats.gider },
    { type: 'masraf', ...periodStats.masraf },
  ];

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

      {/* Dönem raporu + trend */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Dönem Raporu</p>
            <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
              {(Object.keys(PERIOD_DAYS) as PeriodKey[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-colors cursor-pointer ${
                    period === p
                      ? 'bg-rose-600 text-white'
                      : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-stone-400">Net nakit girişi</p>
          <p className={`text-2xl font-black ${periodStats.netNakit < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {periodStats.netNakit >= 0 ? '+' : '−'}{formatCurrency(Math.abs(periodStats.netNakit))}
          </p>
          <div className="mt-3 space-y-2.5">
            {periodRows.map(({ type, count, total }) => {
              const meta = ROW_META[type];
              const pay = periodStats.grand > 0 ? Math.round((total / periodStats.grand) * 100) : 0;
              return (
                <div key={type} className="flex items-center gap-2.5 text-xs font-bold">
                  <span className={`w-2 h-2 rounded-full ${meta.dot} shrink-0`} />
                  <span className="text-stone-600 dark:text-stone-300 w-24 shrink-0">{meta.label}</span>
                  <span className="text-stone-400 w-8 text-right shrink-0">{count}</span>
                  <span className={`flex-1 text-right ${meta.text}`}>{formatCurrency(total)}</span>
                  <span className="text-stone-400 w-10 text-right shrink-0">{pay}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Son 7 gün trendi</p>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36 mt-2" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1={PAD} x2={W - PAD} y1={H * f} y2={H * f} stroke="currentColor" className="text-stone-200 dark:text-stone-800" strokeWidth="1" />
            ))}
            <path d={area} fill="url(#trendFill)" />
            <path d={line} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
            ))}
          </svg>
          <div className="flex justify-between text-[10px] font-bold text-stone-400 px-1">
            {trend.map((d, i) => (
              <span key={i}>{d.label}</span>
            ))}
          </div>
          <p className="mt-2 text-[10px] font-bold text-stone-400 flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-blue-500 inline-block" /> NET</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-500 inline-block" /> Tahsilat − Gider</span>
          </p>
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
