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
    day: 'numeric',
    month: 'long',
  });

  const displayName = shopProfile?.storeName || storeName || 'Dükkanım';
  const ownerName = shopProfile?.ownerName;
  const avatarChar = (ownerName || displayName || 'D').trim().charAt(0).toUpperCase();

  return (
    <header className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Sol Taraf: Dükkan Başlığı & Canlı Gösterge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-stone-800 border border-orange-200/80 dark:border-stone-700/80 flex items-center justify-center p-1 shadow-sm shrink-0">
            <img src="/brand/logo-icon.png" alt="Dükkanım Yanımda" className="w-full h-full object-contain" />
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            {/* 1. Satır: İsim + Canlı Nokta */}
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm sm:text-base font-black text-stone-900 dark:text-white tracking-tight truncate">
                {displayName}
              </h1>

              {/* Canlı Durum Rozeti (Masaüstünde metinli, mobilde şık kompakt nokta) */}
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shrink-0"
                title={connected ? 'Sunucu bağlantısı aktif' : 'Bağlantı kuruluyor'}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">{connected ? 'Canlı Panel' : 'Bağlanıyor'}</span>
              </span>
            </div>

            {/* 2. Satır: Tarih & İşletme Sahibi */}
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5 font-medium">
              <span className="flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>{todayFormatted}</span>
              </span>
              {ownerName && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="truncate text-stone-700 dark:text-stone-300 font-semibold">{ownerName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Tema Butonu & Profil / Ayarlar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Gece / Gündüz Tema Değiştirici */}
          <button
            id="btn-toggle-dark-mode"
            type="button"
            onClick={onToggleDarkMode}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800 transition-all cursor-pointer shadow-xs active:scale-95"
            title={darkMode ? 'Açık Temaya Geç' : 'Karanlık Temaya Geç'}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-orange-500" />
            ) : (
              <Moon className="w-4 h-4 text-stone-700" />
            )}
          </button>

          {/* Mobil Menü Butonu (Tek Nokta) */}
          <div className="relative md:hidden">
            <button
              id="btn-profile-menu"
              type="button"
              onClick={onOpenMenu}
              className="h-9 px-2 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-800 transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span className="w-6 h-6 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xs font-black">
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
