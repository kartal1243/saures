// business_type'e göre şekillenen sol menü.
// Desktop: sabit sidebar. Mobil: PWA tarzı alt sekme barı.

import { Store } from 'lucide-react';
import type { BusinessType } from '../../sector/businessTypes';
import { getSectorConfig } from '../../sector/registry';

interface DynamicSidebarProps {
  businessType: BusinessType;
  activePath: string;
  storeName: string;
  onNavigate: (path: string) => void;
}

const linkCls = (active: boolean) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
    active
      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
  }`;

export function DynamicSidebar({ businessType, activePath, storeName, onNavigate }: DynamicSidebarProps) {
  const config = getSectorConfig(businessType);
  const primary = config.nav.filter((n) => !n.secondary);
  const secondary = config.nav.filter((n) => n.secondary);
  const mobileTabs = primary.slice(0, 5);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col gap-1 border-r border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="mb-2 flex items-center gap-2.5 rounded-xl px-2 py-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Store className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-stone-900 dark:text-white">{storeName}</span>
            <span className="block truncate text-[11px] font-semibold text-stone-400">{config.label}</span>
          </span>
        </div>

        {primary.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key + item.path} type="button" onClick={() => onNavigate(item.path)} className={linkCls(activePath === item.path)}>
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </button>
          );
        })}

        {secondary.length > 0 && (
          <>
            <p className="mt-3 px-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">Diğer</p>
            {secondary.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.key + item.path} type="button" onClick={() => onNavigate(item.path)} className={linkCls(activePath === item.path)}>
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </>
        )}
      </aside>

      {/* Mobil alt bar (PWA hissi) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-900/95">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${mobileTabs.length}, minmax(0,1fr))` }}>
          {mobileTabs.map((item) => {
            const Icon = item.icon;
            const active = activePath === item.path;
            return (
              <button
                key={item.key + item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 text-[10px] font-bold transition-colors cursor-pointer ${
                  active ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate px-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
