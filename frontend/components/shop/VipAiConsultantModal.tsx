import React from 'react';
import { ShopProfile, CashRegister } from '../../../shared/types.ts';
import { formatCurrency } from '../../utils/formatters';
import {
  Crown,
  Store,
  TrendingUp,
  MessageSquare,
  LifeBuoy,
  X,
  FileCheck,
  HandCoins,
  CalendarDays,
} from 'lucide-react';

interface VipAiConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopProfile?: ShopProfile;
  cash: CashRegister;
  onApplyProfileTip?: (newSlogan: string) => Promise<void>;
}

export const VipAiConsultantModal: React.FC<VipAiConsultantModalProps> = ({
  isOpen,
  onClose,
  shopProfile,
  cash,
}) => {
  if (!isOpen) return null;

  const goTahsilat = () => {
    onClose();
    setTimeout(() => {
      document.getElementById('vip-tahsilat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-colors">
        {/* VIP başlık */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-amber-500 via-amber-600 to-yellow-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-white shadow-inner">
              <Crown className="w-7 h-7 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">VIP Esnaf Kulübü</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-amber-800 uppercase tracking-wide">
                  VIP Club
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                {shopProfile?.storeName || 'Dükkanınız'} için günlük 10 dakikalık para rutini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Neden VIP */}
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <p className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" /> Günde 10 dakika, defter toparlanır
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-medium">
                Sabah tahsilat turu, pazar patron raporu. Borçlar toplanır, kâr görünür.
              </p>
            </div>
            <button
              type="button"
              onClick={goTahsilat}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md transition-colors cursor-pointer"
            >
              <HandCoins className="w-4 h-4" /> Tahsilat Turunu Aç
            </button>
          </div>

          {/* Bugünkü durum */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 px-3 py-2.5 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Bugünkü tahsilat</p>
              <p className="mt-0.5 text-base font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(cash.todayTotalIncome)}</p>
            </div>
            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 px-3 py-2.5 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Bugünkü gider</p>
              <p className="mt-0.5 text-base font-black text-rose-500">{formatCurrency(cash.todayExpense)}</p>
            </div>
            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 px-3 py-2.5 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Net</p>
              <p className="mt-0.5 text-base font-black text-stone-900 dark:text-white">{formatCurrency(cash.todayTotalIncome - cash.todayExpense)}</p>
            </div>
          </div>

          {/* Neler var */}
          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-stone-400">
              VIP araçların
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {(
                [
                  { Icon: MessageSquare, t: 'Tahsilat Turu', d: 'Borçlular + vadeler + yarınki randevular, toplu WhatsApp', on: true, go: true },
                  { Icon: CalendarDays, t: 'Patron Raporu', d: 'Haftalık tahsilat, kâr, en borçlu 5 ve kritik stok', on: true, go: false },
                  { Icon: FileCheck, t: 'Muhasebeciye Tek Tık', d: 'Defteri müşavire hazır dosya olarak gönder', on: false, go: false },
                  { Icon: LifeBuoy, t: 'Öncelikli Destek', d: 'Sorunda sıra beklemeden yardım', on: false, go: false },
                  { Icon: Store, t: 'Sınırsız Kayıt', d: 'Müşteri, ürün ve fiş limiti yok', on: false, go: false },
                ] as const
              ).map(({ Icon, t, d, on, go }) => (
                <button
                  key={t}
                  type="button"
                  onClick={go ? goTahsilat : undefined}
                  disabled={!go}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                    on
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700'
                  } ${go ? 'cursor-pointer hover:border-emerald-400' : 'cursor-default'}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${on ? 'bg-emerald-500 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-300'}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-xs font-black text-stone-900 dark:text-white">
                      {t}
                      <span className={`px-1.5 py-px rounded-full text-[9px] font-black ${on ? 'bg-emerald-500 text-white' : 'bg-stone-300 dark:bg-stone-600 text-stone-600 dark:text-stone-300'}`}>
                        {on ? 'Aktif' : 'Yakında'}
                      </span>
                    </span>
                    <span className="block text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">{d}</span>
                  </span>
                </button>
              ))}
            </div>
            {/* Mini fiyat */}
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-stone-200 dark:border-stone-700 px-3 py-2.5 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Çırak</p>
                <p className="text-lg font-black text-stone-900 dark:text-white">₺0</p>
                <p className="text-[10px] font-bold text-stone-400">Defter, kasa, stok</p>
              </div>
              <div className="rounded-xl border-2 border-amber-500 px-3 py-2.5 text-center relative">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-px rounded-full text-[9px] font-black bg-amber-500 text-white whitespace-nowrap">
                  LANSMANDA ÜCRETSİZ
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Usta · VIP</p>
                <p className="text-lg font-black text-stone-900 dark:text-white">₺149<span className="text-[11px] font-bold text-stone-400">/ay</span></p>
                <p className="text-[10px] font-bold text-stone-400">Tur + rapor + destek</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-stone-400">
              <TrendingUp className="w-3.5 h-3.5" />
              Kart istenmez — lansman bitmeden ödeme açılacak.
            </div>
          </div>

          {/* Destek */}
          <div className="rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 text-white p-5">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5" />
              <h3 className="text-sm font-black">Takıldığın yerde yaz</h3>
            </div>
            <p className="mt-1 text-xs text-emerald-100 font-medium">
              Kasa, gün sonu ve program kullanımıyla ilgili her şey için e-posta yeterli.
              Yazarken dükkan adını ekle, aynı gün dönelim.
            </p>
            <p className="mt-2 text-sm font-black break-all">omeryaman6@hotmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
