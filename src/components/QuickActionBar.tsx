import React from 'react';
import { PlusCircle, ArrowUpRight, ArrowDownLeft, UserPlus } from 'lucide-react';

interface QuickActionBarProps {
  onOpenTransaction: (type: 'veresiye' | 'tahsilat' | 'gider') => void;
  onOpenNewCustomer: () => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onOpenTransaction,
  onOpenNewCustomer,
}) => {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200/90 shadow-xs flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
      {/* 1. Hızlı Veresiye Yaz */}
      <button
        id="btn-quick-veresiye"
        type="button"
        onClick={() => onOpenTransaction('veresiye')}
        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-xs transition-transform active:scale-98 cursor-pointer"
      >
        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
        <span>Veresiye Yaz</span>
      </button>

      {/* 2. Tahsilat Al */}
      <button
        id="btn-quick-tahsilat"
        type="button"
        onClick={() => onOpenTransaction('tahsilat')}
        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-transform active:scale-98 cursor-pointer"
      >
        <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
        <span>Tahsilat Al</span>
      </button>

      {/* 3. Yeni Müşteri */}
      <button
        id="btn-new-customer"
        type="button"
        onClick={onOpenNewCustomer}
        className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-semibold text-sm shadow-xs transition-transform active:scale-98 cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        <span>Yeni Müşteri</span>
      </button>

      {/* 4. Kasa Çıkışı / Gider */}
      <button
        id="btn-quick-gider"
        type="button"
        onClick={() => onOpenTransaction('gider')}
        className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm border border-stone-200 transition-transform active:scale-98 cursor-pointer"
      >
        <PlusCircle className="w-4 h-4 text-rose-500" />
        <span>Kasa Gideri</span>
      </button>
    </div>
  );
};
