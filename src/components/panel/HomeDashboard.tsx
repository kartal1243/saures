import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Transaction, TransactionType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import type { ActiveTab } from '../../App';

interface HomeDashboardProps {
  transactions: Transaction[];
  onNavigate: (tab: ActiveTab) => void;
}

const ROW_META: Record<TransactionType, { label: string; dot: string; text: string }> = {
  veresiye: { label: 'Alacak Kaydı', dot: 'bg-emerald-500', text: 'text-emerald-500' },
  tahsilat: { label: 'Ödeme Aldım', dot: 'bg-blue-500', text: 'text-blue-400' },
  gider: { label: 'Gider', dot: 'bg-rose-500', text: 'text-rose-500' },
  masraf: { label: 'Masraf', dot: 'bg-orange-500', text: 'text-orange-400' },
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  transactions,
  onNavigate,
}) => {
  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);

  return (
    <div className="space-y-4">
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
