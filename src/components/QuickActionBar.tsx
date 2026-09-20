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
        title="Müşterinin defterine yeni borç yaz"
      >
        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
        <span>Veresiye Yaz</span>
      </button>

      {/* 2. Para Aldım / Borç Kapattı */}
      <button
        id="btn-quick-tahsilat"
        type="button"
        onClick={() => onOpenTransaction('tahsilat')}
        className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-transform active:scale-98 cursor-pointer"
        title="Müşteriden ödeme al, borcu düş"
      >
        <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
        <span>Para Aldım / Ödeme</span>
      </button>

      {/* 3. Dükkan Harcaması / Masraf */}
      <button
        id="btn-quick-gider"
        type="button"
        onClick={() => onOpenTransaction('gider')}
        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm border border-rose-200 shadow-xs transition-transform active:scale-98 cursor-pointer"
        title="Toptancı, fatura veya dükkan masrafı yaz"
      >
        <PlusCircle className="w-4 h-4 text-rose-600" />
        <span>Dükkan Harcaması</span>
      </button>

      {/* 4. Yeni Müşteri */}
      <button
        id="btn-new-customer"
        type="button"
        onClick={onOpenNewCustomer}
        className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-semibold text-sm shadow-xs transition-transform active:scale-98 cursor-pointer"
        title="Deftere yeni müşteri veya abone ekle"
      >
        <UserPlus className="w-4 h-4" />
        <span>Yeni Müşteri Ekle</span>
      </button>
    </div>
  );
};
