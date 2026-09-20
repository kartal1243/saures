import React from 'react';
import { CashRegister } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Wallet, CreditCard, Banknote, ArrowDownRight, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface CashSummaryProps {
  cash: CashRegister;
  onOpenUpcomingModal?: () => void;
}

export const CashSummary: React.FC<CashSummaryProps> = ({ cash, onOpenUpcomingModal }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Bugünkü Toplam Tahsilat */}
      <motion.div
        key={`income-${cash.todayTotalIncome}`}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl p-4 border border-stone-200 shadow-xs relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-stone-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">Bugünkü Tahsilat</span>
          <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            {formatCurrency(cash.todayTotalIncome)}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              <Banknote className="w-3 h-3" /> {formatCurrency(cash.todayCash)}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
              <CreditCard className="w-3 h-3" /> {formatCurrency(cash.todayCard)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. Toplam Bekleyen Veresiye Alacağı */}
      <motion.div
        key={`receivables-${cash.totalReceivables}`}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl p-4 border border-amber-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-stone-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">Bekleyen Veresiye</span>
          <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 tracking-tight">
            {formatCurrency(cash.totalReceivables)}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Piyasada bekleyen toplam esnaf alacağı
          </p>
        </div>
      </motion.div>

      {/* 3. Kasadaki Net Nakit */}
      <motion.div
        key={`net-${cash.netTodayCash}`}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl p-4 border border-stone-200 shadow-xs relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-stone-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">Kasadaki Net Nakit</span>
          <span className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
            <Banknote className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            {formatCurrency(cash.netTodayCash)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            <span>Bugünkü Gider: {formatCurrency(cash.todayExpense)}</span>
          </div>
        </div>
      </motion.div>

      {/* 4. Günü Gelen / Geciken Ödemeler */}
      <motion.div
        key={`due-${cash.dueTodayCount}-${cash.overdueCount}`}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={onOpenUpcomingModal}
        className={`rounded-xl p-4 border shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${
          cash.overdueCount > 0 || cash.dueTodayCount > 0
            ? 'bg-rose-50/50 border-rose-200'
            : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex items-center justify-between text-stone-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">Tahsilat Zamanı</span>
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            cash.overdueCount > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-stone-100 text-stone-600'
          }`}>
            <AlertCircle className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              {cash.dueTodayCount + cash.overdueCount} Müşteri
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            {cash.overdueCount > 0 && (
              <span className="font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                {cash.overdueCount} Gecikmiş
              </span>
            )}
            {cash.dueTodayCount > 0 && (
              <span className="font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                {cash.dueTodayCount} Bugün
              </span>
            )}
            {cash.overdueCount === 0 && cash.dueTodayCount === 0 && (
              <span className="text-stone-500 font-medium">Bugün acil ödeme yok</span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
