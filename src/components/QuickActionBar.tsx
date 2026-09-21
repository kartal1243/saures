import React from 'react';
import { Banknote, ArrowUpRight, Moon, Crown, Users, PlusCircle, ArrowDownLeft, Package, AlertTriangle } from 'lucide-react';

interface QuickActionBarProps {
  onOpenMoneyIn: () => void;
  onOpenMoneyOut: () => void;
  onOpenDailyClosing: () => void;
  onOpenVip: () => void;
  onOpenNewCustomer?: () => void;
  onToggleCustomerView?: () => void;
  showCustomerView?: boolean;
  onOpenStockView?: () => void;
  criticalStockCount?: number;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onOpenMoneyIn,
  onOpenMoneyOut,
  onOpenDailyClosing,
  onOpenVip,
  onOpenNewCustomer,
  onToggleCustomerView,
  showCustomerView = false,
  onOpenStockView,
  criticalStockCount = 0,
}) => {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 sm:p-4 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 transition-colors">
      {/* 1. Hızlı Para Al / Kasa Girişi */}
      <button
        id="btn-quick-money-in"
        type="button"
        onClick={onOpenMoneyIn}
        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-sm transition-transform active:scale-98 cursor-pointer"
        title="Satış veya tahsilat yap, kasaya para ekle (Nakit, POS Kart, IBAN)"
      >
        <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
        <span>Para Al (Satış)</span>
      </button>

      {/* 2. Hızlı Para Ver / Dükkan Masrafı */}
      <button
        id="btn-quick-money-out"
        type="button"
        onClick={onOpenMoneyOut}
        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-sm transition-transform active:scale-98 cursor-pointer"
        title="Toptancı, fatura veya dükkan harcaması yap, kasadan düş"
      >
        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
        <span>Para Ver (Gider)</span>
      </button>

      {/* 3. Gün Sonu Kapat / Z Raporu */}
      <button
        id="btn-quick-daily-closing"
        type="button"
        onClick={onOpenDailyClosing}
        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-black text-sm shadow-sm transition-transform active:scale-98 cursor-pointer border border-transparent dark:border-stone-700"
        title="Günü kapat, fiili kasa sayımını yap ve Z Raporunu al"
      >
        <Moon className="w-5 h-5 text-amber-400" />
        <span>Gün Sonu Kapat</span>
      </button>

      {/* 4. Stok Takibi Hızlı Butonu */}
      {onOpenStockView && (
        <button
          id="btn-quick-stock"
          type="button"
          onClick={onOpenStockView}
          className={`flex-initial relative flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-bold text-xs sm:text-sm border shadow-xs transition-transform active:scale-98 cursor-pointer ${
            criticalStockCount > 0
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-700 ring-2 ring-amber-400/30'
              : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
          }`}
          title="Ürün stok takibi, mal giriş/çıkışları ve kritik stok alarmları"
        >
          <Package className={`w-4 h-4 ${criticalStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500'}`} />
          <span>Stok Takibi</span>
          {criticalStockCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
              {criticalStockCount} Kritik!
            </span>
          )}
        </button>
      )}

      {/* 5. VIP Esnaf & AI Danışman */}
      <button
        id="btn-quick-vip"
        type="button"
        onClick={onOpenVip}
        className="flex-initial flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-bold text-xs sm:text-sm border border-amber-300 dark:border-amber-800/80 shadow-xs transition-transform active:scale-98 cursor-pointer"
        title="Dükkan profili iyileştirme, toptancı tasarrufu ve 7/24 AI danışman"
      >
        <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="hidden sm:inline">VIP Danışman</span>
        <span className="sm:hidden">VIP</span>
      </button>

      {/* 6. Müşteriler & Borç Defteri Toggle */}
      {onToggleCustomerView && (
        <button
          id="btn-toggle-customer-ledger"
          type="button"
          onClick={onToggleCustomerView}
          className={`flex-initial flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
            showCustomerView
              ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-white border-stone-400'
              : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
          }`}
          title="Veresiye & Müşteri defteri görünümünü aç/kapat"
        >
          <Users className="w-4 h-4 text-stone-500" />
          <span className="hidden md:inline">{showCustomerView ? 'Kasaya Dön' : 'Müşteriler'}</span>
        </button>
      )}
    </div>
  );
};
