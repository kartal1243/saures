// Ana dashboard: 3 dev özet kartı. 1 ve 3 her sektörde aynı,
// 2. kart config.statusWidget'e göre sektörleşir.

import { Banknote, CalendarDays, Gavel, Package, Wrench, LayoutDashboard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { BusinessType } from '../../sector/businessTypes';
import { getSectorConfig } from '../../sector/registry';
import type { StatusWidget } from '../../sector/sectorConfig';

export interface CashSummaryData {
  revenue: number;
  expense: number;
  net: number;
}

export interface StatusData {
  value: string;
  hint?: string;
  alert?: boolean;
}

export interface MovementItem {
  id: string;
  title: string;
  detail?: string;
  amount?: number;
  time: string;
}

interface SectorDashboardProps {
  businessType: BusinessType;
  cash: CashSummaryData;
  status: StatusData;
  movements: MovementItem[];
  formatMoney?: (n: number) => number | string;
}

const STATUS_META: Record<StatusWidget, { icon: typeof Package; tone: string }> = {
  appointments: { icon: CalendarDays, tone: 'bg-indigo-500' },
  hearings: { icon: Gavel, tone: 'bg-violet-500' },
  stock: { icon: Package, tone: 'bg-emerald-500' },
  tickets: { icon: Wrench, tone: 'bg-blue-500' },
  generic: { icon: LayoutDashboard, tone: 'bg-amber-500' },
};

const cardCls =
  'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900';

export function SectorDashboard({ businessType, cash, status, movements, formatMoney }: SectorDashboardProps) {
  const config = getSectorConfig(businessType);
  const meta = STATUS_META[config.statusWidget];
  const StatusIcon = meta.icon;
  const fmt = formatMoney ?? ((n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* 1. Bugünün Kasası */}
      <section className={cardCls}>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Banknote className="h-5 w-5" />
          </span>
          <h2 className="text-sm font-black text-stone-900 dark:text-white">Bugünün Kasası</h2>
        </div>
        <p className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">{fmt(cash.net)}</p>
        <p className="mt-0.5 text-xs font-semibold text-stone-400">Net kar / zarar</p>
        <div className="mt-4 space-y-1.5 text-sm font-bold">
          <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="h-4 w-4" /> Ciro: {fmt(cash.revenue)}
          </p>
          <p className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <ArrowDownLeft className="h-4 w-4" /> Gider: {fmt(cash.expense)}
          </p>
        </div>
      </section>

      {/* 2. İş / Stok Durumu (sektöre göre) */}
      <section className={cardCls}>
        <div className="mb-3 flex items-center gap-2.5">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${meta.tone}`}>
            <StatusIcon className="h-5 w-5" />
          </span>
          <h2 className="text-sm font-black text-stone-900 dark:text-white">{config.statusLabel}</h2>
        </div>
        <p className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">{status.value}</p>
        {status.hint && <p className="mt-0.5 text-xs font-semibold text-stone-400">{status.hint}</p>}
        {status.alert && (
          <p className="mt-3 inline-block rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
            Dikkat istiyor
          </p>
        )}
      </section>

      {/* 3. Son Hareketler */}
      <section className={cardCls}>
        <h2 className="mb-3 text-sm font-black text-stone-900 dark:text-white">Son Hareketler</h2>
        {movements.length === 0 && <p className="text-xs font-semibold text-stone-400">Henüz hareket yok.</p>}
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {movements.slice(0, 5).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-stone-800 dark:text-stone-100">{m.title}</span>
                <span className="block truncate text-[11px] font-semibold text-stone-400">
                  {[m.detail, m.time].filter(Boolean).join(' • ')}
                </span>
              </span>
              {typeof m.amount === 'number' && (
                <span className={`shrink-0 text-sm font-black ${m.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {m.amount >= 0 ? '+' : ''}
                  {fmt(m.amount)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
