import React from 'react';
import {
  Store,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  Calendar,
  Crown,
  Users,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { ShopProfile } from '../types';

interface HeaderProps {
  storeName: string;
  shopProfile?: ShopProfile;
  connected: boolean;
  darkMode: boolean;
  profileMenuOpen: boolean;
  onToggleDarkMode: () => void;
  onOpenShopProfile: () => void;
  onOpenVip: () => void;
  onToggleProfileMenu: () => void;
  onLogout: () => void;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storeName,
  shopProfile,
  connected,
  darkMode,
  profileMenuOpen,
  onToggleDarkMode,
  onOpenShopProfile,
  onOpenVip,
  onToggleProfileMenu,
  onLogout,
  onExportCsv,
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
    <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-40 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Shop Info */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenShopProfile}
            className="w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xs font-bold text-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            title="Dükkan bilgilerini düzenle"
          >
            <Store className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenShopProfile}
                className="text-base sm:text-lg font-black text-stone-900 dark:text-white tracking-tight hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left truncate cursor-pointer"
                title="Dükkan profilini görüntüle & düzenle"
              >
                {displayName}
              </button>

              {shopProfile && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                    <Building2 className="w-3 h-3" />
                    {shopProfile.businessField.split('/')[0].trim()}
                  </span>

                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    <Users className="w-3 h-3 text-stone-400" />
                    {shopProfile.employeeCount === '1' ? 'Tek Kişi' : `${shopProfile.employeeCount} Kişi`}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{todayFormatted}</span>
              </span>
              {shopProfile?.ownerName && (
                <>
                  <span className="opacity-40">•</span>
                  <span>{shopProfile.ownerName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right side: VIP, Dark Mode, Excel & Profile trigger */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-wrap">
          {/* VIP AI Club Button */}
          <button
            id="btn-open-vip-club"
            type="button"
            onClick={onOpenVip}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
            title="VIP Esnaf Kulübü & Yapay Zeka Danışmanı"
          >
            <Crown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">VIP Danışman</span>
            <span className="sm:hidden">VIP</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="btn-toggle-dark-mode"
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
            title={darkMode ? 'Gündüz Moduna Geç (Açık Tema)' : 'Gece Moduna Geç (Karanlık Tema)'}
          >
            {darkMode ? (
              <span className="block w-4 h-4 text-amber-500">☀️</span>
            ) : (
              <span className="block w-4 h-4">🌙</span>
            )}
          </button>

          {/* Excel / CSV Export Button */}
          <button
            id="btn-export-excel"
            onClick={onExportCsv}
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
            title="Excel uyumlu CSV indir"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden lg:inline">Excel</span>
          </button>

          {/* Profile Menu Trigger (sag ust) */}
          <div className="relative">
            <button
              id="btn-profile-menu"
              type="button"
              onClick={onToggleProfileMenu}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
              title="Profil menüsü"
            >
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-black">
                {avatarChar}
              </span>
              <span className="hidden md:inline text-xs font-bold text-stone-700 dark:text-stone-300 max-w-[110px] truncate">
                {displayName}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
