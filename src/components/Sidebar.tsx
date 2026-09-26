import React from 'react';
import {
  Store,
  LayoutDashboard,
  Users,
  Package,
  Activity,
  CalendarDays,
  Scissors,
  Scale,
  Gavel,
  ShoppingCart,
  AlertTriangle,
  KeyRound,
  UserPlus,
  Crown,
  LogOut,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { ActiveTab } from '../App';
import type { LawyerTab } from './LawyerCasesView';

interface SidebarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  customersCount: number;
  productsCount: number;
  criticalStockCount: number;
  storeName: string;
  ownerName?: string;
  connected: boolean;
  isBarber: boolean;
  isLawyer: boolean;
  isRetail: boolean;
  onOpenShopProfile: () => void;
  onOpenStaff: () => void;
  onChangePassword: () => void;
  onOpenVip: () => void;
  onOpenServices: () => void;
  onOpenLawyer: (sub: LawyerTab) => void;
  onOpenStock: (criticalOnly: boolean) => void;
  onLogout: () => void;
}

const tabBtn = (active: boolean) =>
  `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
    active
      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
      : 'text-stone-400 hover:text-white hover:bg-white/5'
  }`;

const menuBtn =
  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold text-stone-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left';

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  customersCount,
  productsCount,
  criticalStockCount,
  storeName,
  ownerName,
  connected,
  isBarber,
  isLawyer,
  isRetail,
  onOpenShopProfile,
  onOpenStaff,
  onChangePassword,
  onOpenVip,
  onOpenServices,
  onOpenLawyer,
  onOpenStock,
  onLogout,
}) => {
  const avatarChar = (storeName || 'D').trim().charAt(0).toUpperCase();

  const mainTabs = (
    <>
      <button id="nav-tab-panel" type="button" onClick={() => onNavigate('panel')} className={tabBtn(activeTab === 'panel')}>
        <LayoutDashboard className="w-4 h-4 shrink-0" />
        <span>Anasayfa</span>
      </button>
      {isBarber && (
        <>
          <button id="nav-tab-appointments" type="button" onClick={() => onNavigate('sector_view')} className={tabBtn(activeTab === 'sector_view')}>
            <CalendarDays className="w-4 h-4 shrink-0" />
            <span>Randevu Takvimi</span>
          </button>
          <button type="button" onClick={onOpenServices} className={tabBtn(false)}>
            <Scissors className="w-4 h-4 shrink-0" />
            <span>Hizmetler</span>
          </button>
        </>
      )}
      {isLawyer && (
        <>
          <button id="nav-tab-cases" type="button" onClick={() => onOpenLawyer('cases')} className={tabBtn(activeTab === 'sector_view')}>
            <Scale className="w-4 h-4 shrink-0" />
            <span>Dava Dosyaları</span>
          </button>
          <button id="nav-tab-hearings" type="button" onClick={() => onOpenLawyer('hearings')} className={tabBtn(false)}>
            <Gavel className="w-4 h-4 shrink-0" />
            <span>Duruşma Takvimi</span>
          </button>
        </>
      )}
      {isRetail && (
        <>
          <button id="nav-tab-pos" type="button" onClick={() => onNavigate('sector_view')} className={tabBtn(activeTab === 'sector_view')}>
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>Hızlı Satış (POS)</span>
          </button>
          <button id="nav-tab-critical-stock" type="button" onClick={() => onOpenStock(true)} className={tabBtn(false)}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Kritik Stok</span>
            {criticalStockCount > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                {criticalStockCount}
              </span>
            )}
          </button>
        </>
      )}
      <button id="nav-tab-customers" type="button" onClick={() => onNavigate('customers')} className={tabBtn(activeTab === 'customers')}>
        <Users className="w-4 h-4 shrink-0" />
        <span>Müşteriler ({customersCount})</span>
      </button>
      {!isLawyer && !isBarber && (
        <button id="nav-tab-stock" type="button" onClick={() => onOpenStock(false)} className={tabBtn(activeTab === 'stock')}>
          <Package className="w-4 h-4 shrink-0" />
          <span>Stok ({productsCount})</span>
          {criticalStockCount > 0 && (
            <span className="ml-auto px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
              {criticalStockCount}
            </span>
          )}
        </button>
      )}
      <button id="nav-tab-activity" type="button" onClick={() => onNavigate('activity')} className={tabBtn(activeTab === 'activity')}>
        <Activity className="w-4 h-4 shrink-0" />
        <span>Gün Sonu</span>
      </button>
    </>
  );

  const menuItems = (
    <>
      <p className="px-3 mt-4 mb-1 text-[10px] font-black uppercase tracking-widest text-stone-600">Menü</p>
      <button type="button" onClick={onOpenShopProfile} className={menuBtn}>
        <Store className="w-4 h-4 shrink-0 text-stone-500" /> Dükkan Bilgileri
      </button>
      <button type="button" onClick={onOpenStaff} className={menuBtn}>
        <UserPlus className="w-4 h-4 shrink-0 text-stone-500" /> Personel (Kasiyer)
      </button>
      <button type="button" onClick={onChangePassword} className={menuBtn}>
        <KeyRound className="w-4 h-4 shrink-0 text-stone-500" /> Şifre Değiştir
      </button>
      <button type="button" onClick={onOpenVip} className={menuBtn}>
        <Crown className="w-4 h-4 shrink-0 text-stone-500" /> VIP Danışman
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-black text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
      >
        <LogOut className="w-4 h-4 shrink-0" /> Çıkış Yap
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sol menü */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-stone-950 dark:bg-black border-r border-stone-800 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 pb-2 flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-[0_2px_10px_rgba(245,158,11,0.45)] shrink-0">
            <Store className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-white truncate">
              Dükkanım <span className="text-amber-500">Yanımda</span>
            </span>
            <span className="block text-[10px] font-bold text-stone-500 truncate">Esnafın dijital defteri</span>
          </span>
        </div>

        <nav className="px-3 py-2 space-y-1">{mainTabs}</nav>
        <nav className="px-3 pb-3">{menuItems}</nav>

        <div className="mt-auto p-3 border-t border-stone-800/80">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm font-black shrink-0">
              {avatarChar}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-black text-white truncate">{storeName}</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-stone-500">
                {connected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <Wifi className="w-3 h-3" /> Bağlı
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />
                    <WifiOff className="w-3 h-3" /> Bağlanıyor
                  </>
                )}
                {ownerName && <span className="truncate"> · {ownerName}</span>}
              </span>
            </span>
          </div>
        </div>
      </aside>

      {/* Mobil alt bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-stone-950/95 backdrop-blur border-t border-stone-800">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${
              3 +
              (isBarber ? 1 : 0) +
              (isLawyer ? 1 : 0) +
              (isRetail ? 2 : 0) +
              (!isLawyer && !isBarber ? 1 : 0)
            }, minmax(0,1fr))`,
          }}
        >
          {(
            [
              { id: 'nav-tab-panel', label: 'Anasayfa', Icon: LayoutDashboard, badge: 0, active: activeTab === 'panel', onClick: () => onNavigate('panel') },
              ...(isBarber
                ? [{ id: 'nav-tab-appointments', label: 'Randevu', Icon: CalendarDays, badge: 0, active: activeTab === 'sector_view', onClick: () => onNavigate('sector_view') }]
                : []),
              ...(isLawyer
                ? [{ id: 'nav-tab-cases', label: 'Dosyalar', Icon: Scale, badge: 0, active: activeTab === 'sector_view', onClick: () => onOpenLawyer('cases') }]
                : []),
              ...(isRetail
                ? [
                    { id: 'nav-tab-pos', label: 'POS', Icon: ShoppingCart, badge: 0, active: activeTab === 'sector_view', onClick: () => onNavigate('sector_view') },
                    { id: 'nav-tab-critical-stock', label: 'Kritik', Icon: AlertTriangle, badge: criticalStockCount, active: false, onClick: () => onOpenStock(true) },
                  ]
                : []),
              { id: 'nav-tab-customers', label: 'Müşteriler', Icon: Users, badge: 0, active: activeTab === 'customers', onClick: () => onNavigate('customers') },
              ...(!isLawyer && !isBarber
                ? [{ id: 'nav-tab-stock', label: 'Stok', Icon: Package, badge: criticalStockCount, active: activeTab === 'stock', onClick: () => onOpenStock(false) }]
                : []),
              { id: 'nav-tab-activity', label: 'Gün Sonu', Icon: Activity, badge: 0, active: activeTab === 'activity', onClick: () => onNavigate('activity') },
            ]
          ).map(({ id, label, Icon, badge, active, onClick }) => {
            return (
              <button
                key={id}
                id={id}
                type="button"
                onClick={onClick}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-black transition-colors cursor-pointer ${
                  active ? 'text-amber-500' : 'text-stone-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
                {badge > 0 && (
                  <span className="absolute top-1 right-1/2 translate-x-4 px-1.5 py-px rounded-full bg-rose-600 text-white text-[9px] font-black animate-pulse">
                    {badge}
                  </span>
                )}
                {active && <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-amber-500" />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
