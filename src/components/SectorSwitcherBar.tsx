import React from 'react';
import {
  Scissors,
  UtensilsCrossed,
  ShoppingCart,
  Wrench,
  Store,
  Scale,
  Shirt,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';
import { BusinessSector, ShopProfile } from '../types';

interface SectorSwitcherBarProps {
  currentSector: BusinessSector;
  onSelectSector: (sector: BusinessSector) => void;
  shopProfile?: ShopProfile;
}

export const SECTORS: {
  key: BusinessSector;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badgeColor: string;
  activeColor: string;
  specialTabName: string;
}[] = [
  {
    key: 'berber_kuafor',
    label: 'Kuaför & Berber Salonu',
    shortLabel: 'Berber & Kuaför',
    icon: Scissors,
    description: 'Randevu saatleri, koltuk sırası ve usta/kalfa takibi',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
    activeColor: 'bg-indigo-600 text-white shadow-indigo-500/25',
    specialTabName: '✂️ Randevu & Koltuklar',
  },
  {
    key: 'kafe_restoran',
    label: 'Kafe & Restoran & Lokanta',
    shortLabel: 'Kafe & Restoran',
    icon: UtensilsCrossed,
    description: 'Masa siparişleri, açık adisyonlar ve mutfak/hal masrafları',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
    activeColor: 'bg-orange-600 text-white shadow-orange-500/25',
    specialTabName: '🍽️ Masalar & Adisyon',
  },
  {
    key: 'bakkal_market',
    label: 'Bakkal & Market & Büfe',
    shortLabel: 'Bakkal & Market',
    icon: ShoppingCart,
    description: 'Hızlı tezgâh satışı, sepet fişi ve kritik stok uyarıları',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    activeColor: 'bg-emerald-600 text-white shadow-emerald-500/25',
    specialTabName: '🛒 Hızlı Tezgâh Kasa',
  },
  {
    key: 'teknik_servis',
    label: 'Teknik Servis & Oto Tamir',
    shortLabel: 'Servis & Tamir',
    icon: Wrench,
    description: 'Cihaz/araç kabul fişi, arıza takibi ve parça maliyeti',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    activeColor: 'bg-blue-600 text-white shadow-blue-500/25',
    specialTabName: '🔧 Servis & Tamir Fişleri',
  },
  {
    key: 'avukat_danisman',
    label: 'Avukat & Danışmanlık',
    shortLabel: 'Avukat & Danışman',
    icon: Scale,
    description: 'Dava dosyaları, duruşma takvimi ve danışmanlık saati',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800',
    activeColor: 'bg-violet-600 text-white shadow-violet-500/25',
    specialTabName: '⚖️ Dava Dosyaları',
  },
  {
    key: 'terzi_kurutemizleme',
    label: 'Terzi & Kuru Temizleme',
    shortLabel: 'Terzi & Kuru Tem.',
    icon: Shirt,
    description: 'Bırakılan eşya (emanet) takibi, söz tarihi ve teslimat',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    activeColor: 'bg-teal-600 text-white shadow-teal-500/25',
    specialTabName: '👔 Emanet Takibi',
  },
  {
    key: 'diger_esnaf',
    label: 'Genel Esnaf & Mağaza',
    shortLabel: 'Genel Esnaf',
    icon: Store,
    description: 'Kasa akışı, müşteri veresiye defteri ve stok yönetimi',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    activeColor: 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 shadow-stone-500/25',
    specialTabName: '🏪 Esnaf Özeti',
  },
];

export const SectorSwitcherBar: React.FC<SectorSwitcherBarProps> = ({
  currentSector,
  onSelectSector,
  shopProfile,
}) => {
  const currentSectorData = SECTORS.find((s) => s.key === currentSector) || SECTORS[0];

  return (
    <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          {/* Active Sector Summary Note */}
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-stone-900 dark:text-white">İşletme Tipi:</span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${currentSectorData.badgeColor}`}>
              {currentSectorData.label}
            </span>
            <span className="hidden md:inline text-stone-400 dark:text-stone-500">
              — {currentSectorData.description}
            </span>
          </div>

          {/* Quick Sector Switching Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 whitespace-nowrap mr-1 hidden lg:inline">
              Dükkan Değiştir:
            </span>
            {SECTORS.map((sec) => {
              const Icon = sec.icon;
              const isActive = currentSector === sec.key;

              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => onSelectSector(sec.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? `${sec.activeColor} shadow-xs scale-102`
                      : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80'
                  }`}
                  title={`${sec.label} moduna geç (${sec.description})`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{sec.shortLabel}</span>
                  {isActive && <Check className="w-3 h-3 ml-0.5 opacity-90" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
