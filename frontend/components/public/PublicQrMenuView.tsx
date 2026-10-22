import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Search,
  BellRing,
  Receipt,
  Phone,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { MenuItem } from '../../../shared/types.ts';

interface PublicMenuData {
  shopName: string;
  slogan: string;
  phone: string;
  cityDistrict: string;
  slug: string;
  menuItems: MenuItem[];
  tables: Array<{ id: string; name: string }>;
}

export const PublicQrMenuView: React.FC = () => {
  const [data, setData] = useState<PublicMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Parse identifier from URL: e.g. /m/bereket-pide or /menu?slug=bereket-pide
  const getIdentifier = (): string => {
    const path = window.location.pathname;
    const match = path.match(/^\/m\/(.+)/i);
    if (match && match[1]) return decodeURIComponent(match[1]);
    const params = new URLSearchParams(window.location.search);
    return params.get('slug') || params.get('shop') || 'demo';
  };

  const getTableFromUrl = (): string => {
    const params = new URLSearchParams(window.location.search);
    return params.get('masa') || params.get('table') || '';
  };

  const tableName = getTableFromUrl();

  useEffect(() => {
    const id = getIdentifier();
    fetch(`/api/public/menu/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Menü bulunamadı veya henüz eklenmedi.');
        return res.json();
      })
      .then((json) => {
        setData(json);
      })
      .catch((err) => {
        setError(err.message || 'Menü yüklenemedi.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-bold text-stone-300">Menü Hazırlanıyor…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black">Menüye Ulaşılamadı</h2>
        <p className="text-xs text-stone-400 mt-2 max-w-xs">
          {error || 'Lütfen masadaki QR kodu tekrar okutunuz.'}
        </p>
        <a
          href="/"
          className="mt-6 px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-black text-xs"
        >
          Ana Sayfaya Git
        </a>
      </div>
    );
  }

  const items = data.menuItems || [];
  const categories = ['Tümü', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesCat =
      selectedCategory === 'Tümü' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0F172A] text-stone-900 dark:text-stone-100 font-sans pb-28">
      {/* Toast Bildirim */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-amber-500 text-white text-xs font-black shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Üst Restoran Başlık Banner */}
      <div className="relative bg-linear-to-b from-stone-900 via-stone-900 to-[#1e293b] text-white px-5 pt-8 pb-10 rounded-b-[2.5rem] shadow-xl overflow-hidden">
        {/* Dekoratif Işık Hüzmesi */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] font-black uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" /> DİJİTAL MENÜ
            </span>

            {tableName && (
              <span className="px-3.5 py-1 rounded-full bg-amber-500 text-stone-950 font-black text-xs shadow-md">
                {tableName.toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{data.shopName}</h1>
            <p className="text-xs sm:text-sm text-stone-300 font-medium mt-1">
              {data.slogan || 'Geleneksel ve taze lezzetler'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-stone-400">
            {data.cityDistrict && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {data.cityDistrict}
              </span>
            )}
            {data.phone && (
              <a
                href={`tel:${data.phone}`}
                className="flex items-center gap-1 text-amber-300 font-bold hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                {data.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-5 space-y-4">
        {/* Arama Çubuğu */}
        <div className="relative shadow-lg rounded-2xl overflow-hidden">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Yemek veya içecek ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-800 border-none text-sm font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Yatay Kategori Çubuğu (Swipeable) */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-105'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700 hover:border-amber-400'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Yemek Kartları */}
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center text-stone-400 space-y-2">
            <UtensilsCrossed className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-xs font-bold">Aradığınız kriterde lezzet bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5"
              >
                {/* Resim */}
                <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-2xl bg-stone-100 dark:bg-stone-800 shrink-0 overflow-hidden relative">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-600">
                      <UtensilsCrossed className="w-8 h-8 stroke-[1.5]" />
                    </div>
                  )}
                </div>

                {/* Bilgiler */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      ₺{item.price}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-stone-900 dark:text-white truncate">
                    {item.name}
                  </h3>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                    {item.description || 'Geleneksel sunum ve taze lezzet.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sabit Alt Çubuk: Garson Çağır & Hesap İste */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 p-3 sm:p-4 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              showToast(
                `${tableName || 'Masanıza'} garson çağrıldı! Ekibimiz geliyor.`
              )
            }
            className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
          >
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>Garson Çağır</span>
          </button>

          <button
            type="button"
            onClick={() =>
              showToast(
                `${tableName || 'Masanız'} için hesap talebi kasaya iletildi.`
              )
            }
            className="flex-1 py-3 px-4 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
          >
            <Receipt className="w-4 h-4" />
            <span>Hesap İste</span>
          </button>
        </div>
      </div>
    </div>
  );
};
