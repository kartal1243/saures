import React from 'react';
import { Store, Wifi, WifiOff, FileSpreadsheet, RotateCcw, Calendar, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  storeName: string;
  connected: boolean;
  onResetDemo: () => void;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storeName,
  connected,
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
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs font-bold text-lg">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                {storeName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                <ShieldCheck className="w-3 h-3" /> Yerel / Local-First
              </span>
            </div>
            <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayFormatted}</span>
            </p>
          </div>
        </div>

        {/* Right side: Realtime WebSocket Badge & Tools */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
          {/* Realtime WebSocket Pulse */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
            }`}
            title={connected ? 'WebSocket Canlı Bağlantı Açık (Tüm cihazlarda anlık senkronize)' : 'Bağlantı kesildi, yeniden bağlanılıyor...'}
          >
            {connected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Canlı Kasa Aktif</span>
                <span className="sm:hidden">Canlı</span>
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
            title="Tüm veresiye ve müşteri listesini Excel'e uyumlu CSV olarak indir"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Excel / CSV İndir</span>
            <span className="md:hidden">Excel</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            id="btn-reset-demo"
            onClick={onResetDemo}
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-700 border border-stone-200 transition-colors cursor-pointer"
            title="Örnek verileri varsayılana döndür"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden lg:inline">Örnek Veri</span>
          </button>
        </div>
      </div>
    </header>
  );
};
