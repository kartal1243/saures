import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Sun,
  Moon,
  ChevronDown,
  Crown,
  Bell,
  CheckCheck,
  Trash2,
  X,
} from 'lucide-react';
import { ShopProfile } from '../../../shared/types.ts';

export interface AppNotificationItem {
  id: string;
  kind: 'booking' | 'booking_cancelled' | 'table_call' | 'reminder' | 'info';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  targetTab?: 'panel' | 'sector_view' | 'customers' | 'stock' | 'activity' | 'community';
}

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
  notifications?: AppNotificationItem[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  onNavigateTab?: (tab: NonNullable<AppNotificationItem['targetTab']>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  storeName,
  shopProfile,
  connected,
  darkMode,
  onToggleDarkMode,
  onOpenMenu,
  onOpenVip,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearNotifications,
  onNavigateTab,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!notifOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [notifOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatNotifTime = (iso: string) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };
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
          <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-stone-800 border border-orange-200/80 dark:border-stone-700/80 flex items-center justify-center p-1 shadow-sm shrink-0 overflow-hidden">
            {shopProfile?.logoUrl ? (
              <img src={shopProfile.logoUrl} alt={displayName} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <img src="/brand/logo-icon.png" alt="Dükkanım Yanımda" className="w-full h-full object-contain" />
            )}
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            {/* 1. Satır: İsim + Canlı Nokta + VIP Rozeti */}
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm sm:text-base font-black text-stone-900 dark:text-white tracking-tight truncate">
                {displayName}
              </h1>

              {shopProfile?.isVip && (
                <button
                  type="button"
                  onClick={onOpenVip}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-stone-950 shadow-sm shadow-amber-500/20 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                  title={`VIP İşletme Aktif (${shopProfile.vipPlan === 'yearly' ? 'Yıllık' : 'Aylık'}${shopProfile.vipUntil ? ` · Bitiş: ${new Date(shopProfile.vipUntil).toLocaleDateString('tr-TR')}` : ''})`}
                >
                  <Crown className="w-3.5 h-3.5 text-stone-950 fill-stone-950" />
                  <span>VIP {shopProfile.vipPlan === 'yearly' ? 'Yıllık' : 'Aylık'}</span>
                </button>
              )}

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

        {/* Sağ Taraf: Bildirimler, Tema Butonu & Profil / Ayarlar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Bildirim Geçmişi Butonu */}
          <div ref={notifContainerRef} className="relative">
            <button
              id="btn-notifications"
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Bildirimler & Geçmiş"
              aria-label="Bildirimler"
            >
              <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-orange-500' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-stone-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-12 w-[calc(100vw-1rem)] max-w-sm sm:w-96 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden z-50 animate-pop">
                <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 bg-stone-50/80 dark:bg-stone-900/80">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-black text-stone-900 dark:text-white">Bildirim Geçmişi</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-[10px] font-black">
                        {unreadCount} yeni
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {notifications.length > 0 && unreadCount > 0 && onMarkAllNotificationsRead && (
                      <button
                        type="button"
                        onClick={onMarkAllNotificationsRead}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1 cursor-pointer"
                        title="Tümünü okundu işaretle"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Okundu</span>
                      </button>
                    )}
                    {notifications.length > 0 && onClearNotifications && (
                      <button
                        type="button"
                        onClick={onClearNotifications}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Geçmişi temizle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                      aria-label="Kapat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/80">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-7 h-7 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
                      <p className="text-xs font-bold text-stone-600 dark:text-stone-400">
                        Henüz kayıtlı bildirim yok
                      </p>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                        Yeni randevular, iptaller, masa çağrıları ve hatırlatmalar burada saklanır.
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => {
                      const badgeCls =
                        item.kind === 'booking'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : item.kind === 'booking_cancelled'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
                      const iconChar =
                        item.kind === 'booking'
                          ? '📅'
                          : item.kind === 'booking_cancelled'
                          ? '❌'
                          : item.kind === 'table_call'
                          ? '🛎️'
                          : '⏰';
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onMarkNotificationRead?.(item.id);
                            if (item.targetTab) {
                              onNavigateTab?.(item.targetTab);
                            }
                            setNotifOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/60 ${
                            !item.read ? 'bg-orange-50/40 dark:bg-orange-950/15' : ''
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 mt-0.5 ${badgeCls}`}
                          >
                            {iconChar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-black text-stone-900 dark:text-white truncate">
                                {item.title}
                              </p>
                              <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                                {formatNotifTime(item.createdAt)}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 leading-snug">
                              {item.body}
                            </p>
                          </div>
                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

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
              <span className="w-6 h-6 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xs font-black overflow-hidden">
                {shopProfile?.logoUrl ? (
                  <img src={shopProfile.logoUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  avatarChar
                )}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
