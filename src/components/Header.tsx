import React from 'react';
import {
  Store,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  RotateCcw,
  Calendar,
  ShieldCheck,
  Sun,
  Moon,
  Crown,
  Users,
  Building2,
  Sparkles,
} from 'lucide-react';
import { ShopProfile } from '../types';

interface HeaderProps {
  storeName: string;
  shopProfile?: ShopProfile;
  connected: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenShopProfile: () => void;
  onOpenVip: () => void;
  onResetDemo: () => void;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storeName,
  shopProfile,
  connected,
  darkMode,
  onToggleDarkMode,
  onOpenShopProfile,
  onOpenVip,
  onResetDemo,
  onExportCsv,
}) => {
  const todayFormatted = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Shop Info & Profile Clickable */}
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
                {shopProfile?.storeName || storeName}
              </button>

              {/* Sektör & Çalışan Rozetleri */}
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
                <Calendar className="w-3 h-3 text-stone-400" />
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

        {/* Right side: VIP Club, Dark Mode Toggle & Tools */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-wrap">
          {/* VIP AI Club Button */}
          <button
            id="btn-open-vip-club"
            type="button"
            onClick={onOpenVip}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
            title="VIP Esnaf Kulübü & Canlı Yapay Zeka Danışmanı"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>VIP Danışman</span>
            <span className="bg-white/20 px-1 py-0.2 rounded-sm text-[10px]">AI</span>
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
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>

          {/* Realtime WebSocket Pulse */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
              connected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse'
            }`}
            title={connected ? 'Canlı Kasa Aktif (Anlık Senkronize)' : 'Bağlantı kesildi, yeniden bağlanılıyor...'}
          >
            {connected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Canlı Kasa</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Bağlanıyor</span>
              </>
            )}
          </div>

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

          {/* Reset Demo Data Button */}
          <button
            id="btn-reset-demo"
            onClick={onResetDemo}
            type="button"
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition-colors cursor-pointer"
            title="Örnek verileri varsayılana sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
