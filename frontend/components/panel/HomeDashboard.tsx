import React, { useMemo } from 'react';
import { ArrowRight, History, ReceiptText, ArrowDownLeft, ArrowUpRight, HandCoins, AlertCircle } from 'lucide-react';
import type { Transaction, TransactionType } from '../../../shared/types.ts';
import { formatCurrency } from '../../utils/formatters';
import type { ActiveTab } from '../../App';

interface HomeDashboardProps {
  transactions: Transaction[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenMoneyIn?: () => void;
}

const ROW_META: Record<TransactionType, { label: string; badgeBg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  veresiye: { label: 'Veresiye Satış', badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', text: 'text-amber-600 dark:text-amber-400', icon: HandCoins },
  tahsilat: { label: 'Tahsilat (Giriş)', badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', icon: ArrowDownLeft },
  gider: { label: 'Dükkan Masrafı', badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', text: 'text-rose-600 dark:text-rose-400', icon: ArrowUpRight },
  masraf: { label: 'Gider Çıkışı', badgeBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', text: 'text-orange-600 dark:text-orange-400', icon: ArrowUpRight },
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  transactions,
  onNavigate,
  onOpenMoneyIn,
}) => {
  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);

  return (
    <div className="space-y-4">
      {/* Son işlemler Kartı */}
      <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs transition-all">
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-stone-900 dark:text-white">
                Son Kasa &amp; Defter İşlemleri
              </h3>
              <p className="text-[11px] text-stone-400 font-medium">
                Dükkanınızdaki en son nakit akışı ve tahsilatlar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('activity')}
            className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40"
          >
            Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 mx-auto flex items-center justify-center">
              <ReceiptText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Henüz bir işlem kaydedilmedi</p>
              <p className="text-xs text-stone-400 max-w-sm mx-auto mt-0.5">
                Kasaya ilk satışı ekleyin ya da veresiye defterine müşteri kaydı açın.
              </p>
            </div>
            {onOpenMoneyIn && (
              <button
                type="button"
                onClick={onOpenMoneyIn}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shadow-sm transition-transform active:scale-95"
              >
                + İlk Satışı Gir
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800/80">
            {recent.map((t) => {
              const meta = ROW_META[t.type] || ROW_META.tahsilat;
              const positive = t.type === 'tahsilat' || t.type === 'veresiye';
              const Icon = meta.icon;

              return (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.badgeBg}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-[13px] font-black text-stone-900 dark:text-stone-100 truncate">
                          {t.customerName || meta.label}
                        </span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${meta.badgeBg}`}>
                          {t.paymentMethod?.toUpperCase() || 'NAKİT'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 font-medium truncate mt-0.5">
                        {meta.label}{t.description ? ` · ${t.description}` : ''}
                      </p>
                    </div>
                  </div>

                  <span className={`shrink-0 text-sm sm:text-base font-black ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {positive ? '+' : '−'}{formatCurrency(Math.abs(t.amount || 0))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
