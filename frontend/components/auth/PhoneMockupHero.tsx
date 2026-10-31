import React from 'react';
import {
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Banknote,
  BookOpen,
  Store,
  BarChart3,
  User,
  ArrowLeftRight,
  Wifi,
} from 'lucide-react';

export const PhoneMockupHero: React.FC = () => {
  return (
    <div className="relative select-none pointer-events-none">
      {/* Telefon Gövdesi (Gerçekçi 3D Açılı Titanyum Kasa) */}
      <div
        className="relative w-[280px] sm:w-[300px] xl:w-[325px] 2xl:w-[340px] rounded-[48px] p-[10px] bg-linear-to-b from-stone-700 via-stone-800 to-stone-950 shadow-[28px_40px_70px_-10px_rgba(0,0,0,0.55),12px_18px_30px_-5px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.8)] border border-stone-600/50 transform perspective-1000 -rotate-y-8 rotate-x-3 -rotate-z-2 hover:rotate-0 transition-transform duration-700"
      >
        {/* Yan Butonlar (Ses & Güç Tuşları Çıkıntıları) */}
        <div className="absolute -left-[3px] top-[100px] w-[3px] h-[28px] bg-stone-600 rounded-l-xs shadow-xs" />
        <div className="absolute -left-[3px] top-[140px] w-[3px] h-[48px] bg-stone-600 rounded-l-xs shadow-xs" />
        <div className="absolute -left-[3px] top-[198px] w-[3px] h-[48px] bg-stone-600 rounded-l-xs shadow-xs" />
        <div className="absolute -right-[3px] top-[135px] w-[3px] h-[65px] bg-stone-600 rounded-r-xs shadow-xs" />

        {/* Ekran Çerçevesi (Siyah Bezel) */}
        <div className="relative rounded-[40px] bg-black p-[3px] overflow-hidden">
          {/* Ekran İçi Alanı */}
          <div className="relative rounded-[37px] overflow-hidden bg-[#fafafa] flex flex-col font-sans text-stone-900">
            {/* Ekran Camı Işık Yansıması */}
            <div
              className="absolute inset-0 z-40 pointer-events-none opacity-40 bg-linear-to-br from-white/35 via-white/5 to-transparent"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 35% 100%, 0% 100%)',
              }}
            />

            {/* Üst Durum Çubuğu (Status Bar) + Dinamik Ada */}
            <div className="relative z-30 pt-3 px-6 pb-1 bg-linear-to-b from-[#ff5a00] to-[#f95a00] text-white flex items-center justify-between">
              <span className="text-[11px] font-black tracking-tight">9:41</span>

              {/* Dynamic Island */}
              <div className="w-[88px] h-[22px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-[#1c2d44]" />
                </div>
                <div className="w-2 h-2 rounded-full bg-stone-900/80" />
              </div>

              {/* Pil / Wifi Simgeleri */}
              <div className="flex items-center gap-1.5 text-white/95">
                <Wifi className="w-3 h-3" />
                <div className="w-4 h-2 border border-white/90 rounded-[3px] p-[1px] flex items-center">
                  <div className="h-full w-full bg-white rounded-xs" />
                </div>
              </div>
            </div>

            {/* Uygulama Üst Başlığı (Turuncu Arka Plan) */}
            <div className="relative z-20 px-4 pt-1.5 pb-3 bg-linear-to-b from-[#f95a00] to-[#e64a00] text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white p-1 shadow-md flex items-center justify-center">
                    <img
                      src="/brand/logo-icon.png"
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-black leading-tight tracking-tight">dükkânım</p>
                    <p className="text-[8px] font-medium text-orange-200 leading-none">yanımda</p>
                  </div>
                </div>

                <div className="relative p-1.5 rounded-full bg-white/15 text-white hover:bg-white/20 transition-colors">
                  <Bell className="w-3.5 h-3.5" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-300 ring-2 ring-orange-600" />
                </div>
              </div>

              {/* Telefon Ekranındaki 3D Glass Kasa Kartı */}
              <div className="mt-3 rounded-2xl bg-white/20 border border-white/35 backdrop-blur-md p-3.5 shadow-lg relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-orange-100">
                      Bugünün Kasası
                    </p>
                    <p className="text-2xl font-black text-white tracking-tight mt-0.5">
                      ₺12.450
                    </p>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black text-white backdrop-blur-xs">
                    +₺6.300
                  </span>
                </div>

                {/* Dalgalı Trend Grafiği (SVG) */}
                <div className="mt-2 h-10 w-full relative">
                  <svg viewBox="0 0 200 45" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="phoneWave1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <linearGradient id="phoneWave2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="60%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    {/* Arka Dalga */}
                    <path
                      d="M 5 32 C 30 32, 45 15, 75 22 C 105 29, 130 10, 160 25 C 175 32, 185 18, 195 20"
                      fill="none"
                      stroke="url(#phoneWave2)"
                      strokeWidth="2.5"
                      strokeOpacity="0.75"
                      strokeLinecap="round"
                    />
                    {/* Ön Parlak Dalga */}
                    <path
                      d="M 5 24 C 35 24, 50 38, 80 28 C 110 18, 135 34, 165 14 C 180 8, 190 12, 195 14"
                      fill="none"
                      stroke="url(#phoneWave1)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="195" cy="14" r="3" fill="#06b6d4" />
                    <circle cx="195" cy="14" r="5.5" fill="#06b6d4" opacity="0.4" />
                  </svg>
                </div>

                {/* Gün İsimleri */}
                <div className="flex justify-between text-[7px] font-black text-white/80 px-1 mt-1 uppercase">
                  <span>Pzt</span>
                  <span>Sal</span>
                  <span>Çar</span>
                  <span>Per</span>
                  <span>Cum</span>
                  <span>Cmt</span>
                  <span>Paz</span>
                </div>
              </div>
            </div>

            {/* İçerik Gövdesi: Filtre Pilleri + İşlem Listesi */}
            <div className="p-3.5 space-y-3 bg-white flex-1">
              {/* Sekme / Filtre Pilleri */}
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="px-2.5 py-1 rounded-full bg-stone-900 text-white text-[9px] font-black shadow-xs">
                  Kasa Giriş
                </span>
                <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[9px] font-bold">
                  Gün Sonu
                </span>
                <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[9px] font-bold">
                  Kâğıt Defteri
                </span>
              </div>

              {/* İşlem Listesi (4 Adet Net & Okunaklı Satır) */}
              <div className="space-y-2 pt-0.5">
                {/* Satır 1: Nakit Giriş */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-stone-900 leading-tight">
                        Nakit giriş
                      </p>
                      <p className="text-[8px] font-semibold text-stone-400">
                        Nakit satış
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-emerald-600 tracking-tight">
                    +₺6.300
                  </span>
                </div>

                {/* Satır 2: Kasa Veresiye */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-stone-900 leading-tight">
                        Kasa veresiye
                      </p>
                      <p className="text-[8px] font-semibold text-stone-400">
                        Deftere yazıldı
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-rose-600 tracking-tight">
                    -₺6.300
                  </span>
                </div>

                {/* Satır 3: Kart Giriş */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-stone-900 leading-tight">
                        Kart giriş
                      </p>
                      <p className="text-[8px] font-semibold text-stone-400">
                        POS tahsilat
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-emerald-600 tracking-tight">
                    +₺4.150
                  </span>
                </div>

                {/* Satır 4: Kart Giriş (İkinci) */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-stone-900 leading-tight">
                        Kart giriş
                      </p>
                      <p className="text-[8px] font-semibold text-stone-400">
                        Kredi kartı
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-emerald-600 tracking-tight">
                    +₺4.150
                  </span>
                </div>
              </div>
            </div>

            {/* Alt Gezinme Çubuğu (Bottom Navigation Bar) */}
            <div className="relative pt-2 pb-5 px-3 bg-white border-t border-stone-100 flex items-center justify-around">
              <div className="flex flex-col items-center gap-0.5 text-orange-600">
                <Store className="w-3.5 h-3.5" />
                <span className="text-[7.5px] font-black">Kasa</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 text-stone-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-[7.5px] font-bold">Dükkân</span>
              </div>

              {/* Ortada Turuncu Eylem Butonu */}
              <div className="w-9 h-9 rounded-full bg-linear-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-600/40 -mt-4 border-2 border-white">
                <ArrowLeftRight className="w-4 h-4" />
              </div>

              <div className="flex flex-col items-center gap-0.5 text-stone-400">
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="text-[7.5px] font-bold">Rapor</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 text-stone-400">
                <User className="w-3.5 h-3.5" />
                <span className="text-[7.5px] font-bold">Profil</span>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-stone-900/60 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
