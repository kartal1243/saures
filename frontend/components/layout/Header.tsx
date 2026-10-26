import React from 'react';
import {
  Store,
  Calendar,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ShopProfile } from '../../../shared/types.ts';

interface HeaderProps {
  storeName: string;
  shopProfile?: ShopProfile;
  connected: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMenu: () => void;
  onOpenVip?: () => void;
  onToggleProfileMenu?: () => void;
  onLogout: () => void;
  onExportCsv?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storeName,
  shopProfile,
  connected,
  darkMode,
  onToggleDarkMode,
  onOpenMenu,
}) => {
  const todayFormatted = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const displayName = shopProfile?.storeName || storeName || 'Dükkanım';
  const avatarChar = (displayName || 'D').trim().charAt(0).toUpperCase();

  return (
    <header className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Sol Taraf: Dükkan İsmi ve Bilgileri */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-amber-400 via-amber-500 to-amber-600 text-stone-950 flex items-center justify-center shadow-md shadow-amber-500/20 font-black text-lg shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-stone-900 dark:text-white tracking-tight truncate">
                {displayName}
              </h1>

              {/* Canlı Bağlantı / Durum Rozeti */}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{connected ? 'Canlı Panel' : 'Bağlanıyor'}</span>
              </span>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>{todayFormatted}</span>
              </span>
              {shopProfile?.ownerName && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="font-semibold text-stone-700 dark:text-stone-300">{shopProfile.ownerName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Sağ Taraf: Sadece Şık Tema Değiştirici ve Mobil Menü */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Gece / Gündüz Tema Değiştirici */}
          <button
            id="btn-toggle-dark-mode"
            type="button"
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-2xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80 border border-stone-200 dark:border-stone-800 transition-all cursor-pointer shadow-xs active:scale-95"
            title={darkMode ? 'Açık Temaya Geç' : 'Karanlık Temaya Geç'}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-700" />
            )}
          </button>

          {/* Mobil Menü Butonu */}
          <div className="relative md:hidden">
            <button
              id="btn-profile-menu"
              type="button"
              onClick={onOpenMenu}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-800 transition-colors cursor-pointer"
            >
              <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-black">
                {avatarChar}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
