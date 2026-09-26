import React, { useState, useEffect } from 'react';
import { CashRegister } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  Wallet,
  CreditCard,
  Banknote,
  ArrowDownRight,
  AlertCircle,
  TrendingUp,
  ShoppingBag,
  Target,
  Pencil,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';

interface CashSummaryProps {
  cash: CashRegister;
  onOpenUpcomingModal?: () => void;
  profileTarget?: number;
}

export const CashSummary: React.FC<CashSummaryProps> = ({ cash, onOpenUpcomingModal, profileTarget }) => {
  // Hedef ciro tek kaynaktan: Dükkan Bilgileri'ndeki hedef (yoksa eski yerel değer)
  const [dailyTarget, setDailyTarget] = useState<number>(() => {
    if (profileTarget && profileTarget > 0) return profileTarget;
    try {
      const saved = localStorage.getItem('esnaf_daily_earnings_target');
      return saved ? Number(saved) : 3000;
    } catch {
      return 3000;
    }
  });

  // Profilde hedef değişince aşağıdaki bar da artsın
  useEffect(() => {
    if (profileTarget && profileTarget > 0) {
      setDailyTarget(profileTarget);
      setTempTarget(String(profileTarget));
    }
  }, [profileTarget]);

  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);
  const [tempTarget, setTempTarget] = useState<string>(String(dailyTarget));

  // Compute progress
  const currentEarnings = cash.todayTotalIncome;
  const progressPercent = dailyTarget > 0 ? Math.round((currentEarnings / dailyTarget) * 100) : 0;
  const cappedPercent = Math.min(100, Math.max(0, progressPercent));
  const isTargetReached = currentEarnings >= dailyTarget;
  const remaining = Math.max(0, dailyTarget - currentEarnings);

  const handleSaveTarget = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = Number(tempTarget);
    if (val && val > 0) {
      setDailyTarget(val);
      try {
        localStorage.setItem('esnaf_daily_earnings_target', String(val));
      } catch (err) {
        console.error('Failed to save target to localStorage', err);
      }
      setIsEditingTarget(false);
    }
  };

  const handleSetPreset = (presetVal: number) => {
    setTempTarget(String(presetVal));
    setDailyTarget(presetVal);
    try {
      localStorage.setItem('esnaf_daily_earnings_target', String(presetVal));
    } catch (err) {
      console.error('Failed to save target to localStorage', err);
    }
    setIsEditingTarget(false);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 4 Core Cash Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Bugünkü Ciro (Kasaya Giren Toplam) */}
        <motion.div
          key={`income-${cash.todayTotalIncome}`}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/90 dark:border-stone-800 shadow-xs relative overflow-hidden flex flex-col justify-between transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <div>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-200">Bugünkü Ciro</span>
              <span className="block text-[11px] text-stone-400 dark:text-stone-500">Kasaya giren para</span>
            </div>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              {formatCurrency(cash.todayTotalIncome)}
            </div>

            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-600 dark:text-stone-300 flex-wrap">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                <Banknote className="w-3 h-3" /> Nakit: {formatCurrency(cash.todayCash)}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md">
                <CreditCard className="w-3 h-3" /> Kart: {formatCurrency(cash.todayCard)}
              </span>
            </div>

            {/* Mini target progress meter attached to Ciro card */}
            <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-stone-400 font-medium">Hedef: {formatCurrency(dailyTarget)}</span>
                <span
                  className={`font-bold ${
                    isTargetReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  %{progressPercent}
                </span>
              </div>
              <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTargetReached ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${cappedPercent}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. Dışarıdaki Veresiye (Toplam Müşteri Borcu) */}
        <motion.div
          key={`receivables-${cash.totalReceivables}`}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-amber-200/90 dark:border-amber-900/50 shadow-xs relative overflow-hidden flex flex-col justify-between transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Dışarıdaki Veresiye</span>
              <span className="block text-[11px] text-stone-400 dark:text-stone-500">Müşterilerin toplam borcu</span>
            </div>
            <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {formatCurrency(cash.totalReceivables)}
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2">
              Defterde yazılı toplanacak para
            </p>
          </div>
        </motion.div>

        {/* 3. Cepte Kalan Net Para (Ciro - Harcama) */}
        <motion.div
          key={`net-${cash.netTodayCash}`}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/90 dark:border-stone-800 shadow-xs relative overflow-hidden flex flex-col justify-between transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <div>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-200">Cepte Kalan Net</span>
              <span className="block text-[11px] text-stone-400 dark:text-stone-500">Cirodan masraf düşünce</span>
            </div>
            <span className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                cash.netTodayCash >= 0 ? 'text-stone-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(cash.netTodayCash)}
            </div>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-stone-500 dark:text-stone-400">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>
                Bugünkü Masraf: <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(cash.todayExpense)}</strong>
              </span>
            </div>
          </div>
        </motion.div>

        {/* 4. Günü Gelen Düzenli Ödemeler & Aidatlar */}
        <motion.div
          key={`due-${cash.dueTodayCount}-${cash.overdueCount}`}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          onClick={onOpenUpcomingModal}
          className={`rounded-2xl p-4 border shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${
            cash.overdueCount > 0 || cash.dueTodayCount > 0
              ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
              : 'bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <div>
              <span className="text-xs font-bold text-rose-900 dark:text-rose-300">Düzenli Ödeme Günü</span>
              <span className="block text-[11px] text-stone-400 dark:text-stone-500">Aidat &amp; bakım takvimi</span>
            </div>
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                cash.overdueCount > 0
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 animate-pulse'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                {cash.dueTodayCount + cash.overdueCount} Müşteri
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px]">
              {cash.overdueCount > 0 && (
                <span className="font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                  {cash.overdueCount} geciken
                </span>
              )}
              {cash.dueTodayCount > 0 && (
                <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                  {cash.dueTodayCount} bugün vadesi
                </span>
              )}
              {cash.dueTodayCount === 0 && cash.overdueCount === 0 && (
                <span className="text-stone-400">Bugün vadesi gelen yok</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Daily Earnings Target Tracker Banner with Progress Bar */}
      <div
        id="card-daily-target-tracker"
        className="bg-white dark:bg-stone-900 rounded-2xl p-3.5 sm:p-4 border border-stone-200/90 dark:border-stone-800 shadow-xs transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isTargetReached
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
              }`}
            >
              <Target className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                  Günlük Ciro &amp; Kazanç Hedefi
                </span>
                {isTargetReached ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Hedefe Ulaşıldı!
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                    Kalan: {formatCurrency(remaining)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Target info & Edit toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-end">
            <div className="text-right">
              <span className="text-xs font-bold text-stone-900 dark:text-white block sm:inline">
                {formatCurrency(currentEarnings)}{' '}
                <span className="text-stone-400 font-normal">/ {formatCurrency(dailyTarget)}</span>
              </span>
              <span
                id="text-daily-target-percentage"
                className={`ml-2 inline-flex items-center text-xs sm:text-sm font-black px-2 py-0.5 rounded-md ${
                  isTargetReached
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200'
                }`}
              >
                %{progressPercent}
              </span>
            </div>

            {!isEditingTarget ? (
              <button
                id="btn-edit-daily-target"
                type="button"
                onClick={() => {
                  setTempTarget(String(dailyTarget));
                  setIsEditingTarget(true);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
                title="Günlük Hedefi Belirle / Değiştir"
              >
                <Pencil className="w-3 h-3" />
                <span>Hedef Belirle</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTarget(false)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-3.5 h-3.5" />
                <span>Kapat</span>
              </button>
            )}
          </div>
        </div>

        {/* Small Sleek Progress Bar */}
        <div className="relative w-full">
          <div className="w-full h-2.5 sm:h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden p-0.5 border border-stone-200/60 dark:border-stone-700">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isTargetReached
                  ? 'bg-linear-to-r from-emerald-500 to-emerald-600'
                  : 'bg-linear-to-r from-amber-400 to-amber-500'
              }`}
              style={{ width: `${cappedPercent}%` }}
            />
          </div>

          {/* Progress Markers */}
          <div className="flex items-center justify-between text-[10px] text-stone-400 font-semibold mt-1 px-1">
            <span>0₺ (%0)</span>
            <span>{formatCurrency(dailyTarget * 0.5)} (%50)</span>
            <span className={isTargetReached ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
              {formatCurrency(dailyTarget)} (%100)
            </span>
          </div>
        </div>

        {/* Inline Target Setting Form when editing */}
        {isEditingTarget && (
          <form
            onSubmit={handleSaveTarget}
            className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">
                  Yeni Günlük Ciro Hedefi:
                </label>
                <div className="relative w-36">
                  <input
                    id="input-daily-target"
                    type="number"
                    step="50"
                    min="100"
                    required
                    value={tempTarget}
                    onChange={(e) => setTempTarget(e.target.value)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">
                    ₺
                  </span>
                </div>
                <button
                  id="btn-save-daily-target"
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Kaydet</span>
                </button>
              </div>

              {/* Quick Preset Pills */}
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <span className="text-[11px] text-stone-400 mr-1">Hızlı Seçim:</span>
                {[1500, 2500, 3500, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSetPreset(preset)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                      dailyTarget === preset
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-bold'
                        : 'bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {formatCurrency(preset)}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
