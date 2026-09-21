import React, { useState } from 'react';
import { CashRegister, DailyClosing, ShopProfile } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  Moon,
  Banknote,
  CreditCard,
  Send,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Printer,
  Share2,
  X,
  History,
  Check,
  Calendar,
} from 'lucide-react';

interface DailyClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  cash: CashRegister;
  shopProfile?: ShopProfile;
  closings: DailyClosing[];
  onSaveClosing: (data: { actualCashCount: number; note: string; closedBy?: string }) => Promise<void>;
}

export const DailyClosingModal: React.FC<DailyClosingModalProps> = ({
  isOpen,
  onClose,
  cash,
  shopProfile,
  closings,
  onSaveClosing,
}) => {
  const [activeTab, setActiveTab] = useState<'close_today' | 'history'>('close_today');
  const [actualCashInput, setActualCashInput] = useState<string>(String(Math.max(0, cash.netTodayCash)));
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const expectedCash = cash.netTodayCash;
  const actualCash = Number(actualCashInput) || 0;
  const diff = actualCash - expectedCash;
  const todayFormatted = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSaveClosing({
        actualCashCount: actualCash,
        note: note.trim(),
        closedBy: shopProfile?.ownerName || 'Dükkan Sahibi',
      });
      setSuccessMessage('Gün sonu başarıyla kapatıldı ve Z Raporu arşivlendi!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Gün sonu kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareSummary = () => {
    const text = `🏪 ${shopProfile?.storeName || 'Dükkan'} Gün Sonu Kasa Raporu
📅 ${todayFormatted}
-----------------------------
💵 Toplam Satış / Ciro: ${formatCurrency(cash.todayTotalIncome)}
   • Nakit: ${formatCurrency(cash.todayCash)}
   • Kart / POS: ${formatCurrency(cash.todayCard)}
   • IBAN: ${formatCurrency(cash.todayBank)}
🔴 Toplam Masraf / Gider: ${formatCurrency(cash.todayExpense)}
💰 Net Kasa Kârı: ${formatCurrency(cash.todayTotalIncome - cash.todayExpense)}
-----------------------------
🗄️ Kasada Beklenen Nakit: ${formatCurrency(expectedCash)}
🖐️ Fiili Sayılan Nakit: ${formatCurrency(actualCash)}
${diff === 0 ? '✅ KASA TAM DENK' : diff > 0 ? `✨ KASA FAZLASI: +${formatCurrency(diff)}` : `⚠️ KASA AÇIĞI: -${formatCurrency(Math.abs(diff))}`}
${note ? `📝 Not: ${note}` : ''}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('Gün sonu kasa raporu panoya kopyalandı! WhatsApp veya SMS ile paylaşabilirsiniz.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-5 bg-linear-to-r from-slate-900 via-stone-900 to-indigo-950 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">Gün Sonu Kasa Kapatma (Z Raporu)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Esnaf Kapanış
                </span>
              </div>
              <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{todayFormatted}</span>
                <span className="opacity-50">•</span>
                <span>{shopProfile?.storeName || 'Bereket Mahalle Esnafı'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Bugünkü Kapanış / Geçmiş Kapanışlar */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('close_today')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'close_today'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-stone-900 rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Bugünkü Kasa Kapanışı</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-stone-900 rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Geçmiş Z Raporları ({closings.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {successMessage && (
            <div className="p-4 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-4 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'close_today' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Daily Financial Overview Bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Bugün Toplam Ciro</p>
                  <p className="text-lg font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {formatCurrency(cash.todayTotalIncome)}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                    Nakit: {formatCurrency(cash.todayCash)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
                  <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">POS & Kartlı Satış</p>
                  <p className="text-lg font-black text-indigo-900 dark:text-indigo-200 mt-0.5">
                    {formatCurrency(cash.todayCard)}
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">Banka hesabına geçer</p>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
                  <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase">Toplam Masraf</p>
                  <p className="text-lg font-black text-rose-900 dark:text-rose-200 mt-0.5">
                    {formatCurrency(cash.todayExpense)}
                  </p>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">Toptancı / Fatura</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase">Günün Net Kârı</p>
                  <p className="text-lg font-black text-amber-950 dark:text-amber-200 mt-0.5">
                    {formatCurrency(cash.todayTotalIncome - cash.todayExpense)}
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">Ciro - Masraflar</p>
                </div>
              </div>

              {/* Physical Cash Count Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border-2 border-stone-200 dark:border-stone-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <label className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
                      Kasada Fiili Nakit Sayımı
                    </label>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Çekmecedeki nakiti sayıp tam tutarı giriniz
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-500 dark:text-stone-400">Kasada Beklenen Nakit: </span>
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      {formatCurrency(expectedCash)}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-amber-500">
                    ₺
                  </span>
                  <input
                    id="input-actual-cash-count"
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 text-2xl font-black rounded-xl border-2 border-amber-500/60 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                </div>

                {/* Diff Result Badge */}
                <div className="mt-3">
                  {diff === 0 ? (
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Kasa Kuruşu Kuruşuna Denk! Hiçbir açık veya fazla yok.</span>
                    </div>
                  ) : diff > 0 ? (
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span>Kasa Fazlası Tespit Edildi</span>
                      </div>
                      <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                        +{formatCurrency(diff)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                        <span>Kasa Açığı Var (Eksik Para)</span>
                      </div>
                      <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                        -{formatCurrency(Math.abs(diff))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Günün Notu */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Günün Kapanış Notu (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Örn: Yağmurlu sakin bir gündü, toptancıya nakit ödendi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handleShareSummary}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 transition-colors cursor-pointer"
                  title="WhatsApp veya SMS için kopyala"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fişi Kopyala / Paylaş</span>
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    id="btn-confirm-daily-closing"
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isSubmitting ? 'Kapatılıyor...' : 'Günü Kapat & Z Raporunu Onayla'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Geçmiş Z Raporları Tab */
            <div className="space-y-3">
              {closings.length === 0 ? (
                <div className="p-8 text-center text-stone-500 dark:text-stone-400">
                  <History className="w-10 h-10 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                  <p className="text-sm font-semibold">Henüz arşivlenmiş gün sonu kapanışı yok.</p>
                  <p className="text-xs mt-1">Bugün ilk gün sonunuzu kapatarak başlayabilirsiniz.</p>
                </div>
              ) : (
                closings.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-black text-stone-900 dark:text-white">{c.date}</span>
                        <span className="text-xs text-stone-400">({c.closedBy || 'Kasiyer'})</span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          c.diffAmount === 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : c.diffAmount > 0
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {c.diffAmount === 0
                          ? 'Denk Kasa'
                          : c.diffAmount > 0
                          ? `+${formatCurrency(c.diffAmount)} Fazla`
                          : `-${formatCurrency(Math.abs(c.diffAmount))} Açık`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400 text-[10px] block">Ciro</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(c.totalIncomeToday)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Gider</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(c.todayExpense)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Beklenen Nakit</span>
                        <span className="font-bold text-stone-700 dark:text-stone-300">
                          {formatCurrency(c.expectedCash)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 text-[10px] block">Fiili Sayılan</span>
                        <span className="font-bold text-stone-900 dark:text-white">
                          {formatCurrency(c.actualCashCount)}
                        </span>
                      </div>
                    </div>

                    {c.note && (
                      <p className="text-xs italic text-stone-500 dark:text-stone-400 border-t border-stone-200 dark:border-stone-700/60 pt-2">
                        "{c.note}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
