import React from 'react';
import { ShopProfile, CashRegister } from '../../../shared/types.ts';
import { formatCurrency } from '../../utils/formatters';
import {
  Crown,
  X,
  LifeBuoy,
  ShieldCheck,
  BellRing,
  MessageSquare,
  Boxes,
  Users,
  TrendingUp,
  Lock,
  Sparkles,
} from 'lucide-react';

interface VipAiConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopProfile?: ShopProfile;
  cash: CashRegister;
  onApplyProfileTip?: (newSlogan: string) => Promise<void>;
}

// VIP'in gerçekten fark yaratan özellikleri — kısa, net, dikkat çeken
const TOOLS = [
  {
    Icon: BellRing,
    t: 'Kritik Stok Alarmı',
    d: 'Stok bitmeden haber verir',
    on: true,
  },
  {
    Icon: MessageSquare,
    t: 'Tek Tık WhatsApp',
    d: 'Borçluya hazır mesaj',
    on: true,
  },
  {
    Icon: Boxes,
    t: 'Kritik Stok Raporu',
    d: 'Hangi ürün bitiyor',
    on: true,
  },
  {
    Icon: Users,
    t: 'Veresiye Avı',
    d: 'En borçlu 5 müşteri',
    on: true,
  },
  {
    Icon: TrendingUp,
    t: 'Kâr Takibi',
    d: 'Hangi gün kazandın',
    on: true,
  },
  {
    Icon: ShieldCheck,
    t: 'Sınırsız Kayıt',
    d: 'Müşteri, ürün, fiş limiti yok',
    on: false,
  },
] as const;

export const VipAiConsultantModal: React.FC<VipAiConsultantModalProps> = ({
  isOpen,
  onClose,
  shopProfile,
  cash,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-colors">
        {/* VIP başlık */}
        <div className="p-5 sm:p-6 bg-linear-to-br from-amber-400 via-amber-500 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">VIP Esnaf Kulübü</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-amber-700 uppercase tracking-wide">
                  VIP
                </span>
              </div>
              <p className="text-xs text-amber-50 mt-0.5 font-semibold">
                {shopProfile?.storeName || 'Dükkanınız'} için kazancı koruyan aletler
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/35 text-white transition-colors cursor-pointer shrink-0"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Bugünün özeti — nakit / POS / havale */}
          <div className="rounded-2xl bg-stone-900 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
              Bugün ne kazandın
            </p>
            <p className="text-3xl font-black text-white tracking-tight mt-1">
              {formatCurrency(cash.todayTotalIncome - cash.todayExpense)}
            </p>
            <div className="flex items-center gap-3 flex-wrap mt-2 text-[11px] font-bold">
              <span className="text-emerald-400">Nakit {formatCurrency(cash.todayCash)}</span>
              <span className="text-indigo-400">POS {formatCurrency(cash.todayCard)}</span>
              <span className="text-cyan-400">Havale {formatCurrency(cash.todayBank)}</span>
            </div>
          </div>

          {/* VIP araçları */}
          <div>
            <p className="mb-2.5 text-[11px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Sana ne kazandırır
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {TOOLS.map(({ Icon, t, d, on }) => (
                <div
                  key={t}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                    on
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                      : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      on ? 'bg-amber-500 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-stone-900 dark:text-white">{t}</span>
                    <span className="block text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                      {d}
                    </span>
                  </span>
                  {!on && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-stone-300 dark:bg-stone-600 text-stone-600 dark:text-stone-200">
                      Yakında
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fiyat */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 px-3 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Çırak</p>
              <p className="text-2xl font-black text-stone-900 dark:text-white">₺0</p>
              <p className="text-[10px] font-bold text-stone-400">Defter, kasa, stok</p>
            </div>
            <div className="rounded-xl border-2 border-amber-500 px-3 py-3 text-center relative bg-amber-50/50 dark:bg-amber-950/20">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white whitespace-nowrap">
                LANSMANDA ÜCRETSİZ
              </span>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Usta · VIP
              </p>
              <p className="text-2xl font-black text-stone-900 dark:text-white">
                ₺149<span className="text-[11px] font-bold text-stone-400">/ay</span>
              </p>
              <p className="text-[10px] font-bold text-stone-400">Tüm araçlar açık</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400">
            <Lock className="w-3.5 h-3.5" />
            Kart istenmez — lansman bitmeden ödeme açılacak.
          </div>

          {/* Destek */}
          <div className="rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 text-white p-5">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5" />
              <h3 className="text-sm font-black">Takıldığın yerde yaz</h3>
            </div>
            <p className="mt-1 text-xs text-emerald-100 font-medium">
              Kasa, gün sonu ve program kullanımıyla ilgili her şey için e-posta yeterli.
            </p>
            <p className="mt-2 text-sm font-black break-all">omeryaman6@hotmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
