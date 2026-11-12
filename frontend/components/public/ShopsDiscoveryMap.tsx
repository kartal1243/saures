import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin,
  Search,
  Scissors,
  UtensilsCrossed,
  Sparkles,
  Calendar,
  Store,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Navigation,
  QrCode,
  Star,
  RefreshCw,
  Phone,
  Layers,
} from 'lucide-react';
import type { PublicShopMapItem } from '../../../shared/types';

interface ShopsDiscoveryMapProps {
  className?: string;
  initialCity?: string;
  initialSector?: string;
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  istanbul: [41.0082, 28.9784],
  ankara: [39.9334, 32.8597],
  izmir: [38.4237, 27.1428],
  bursa: [40.1885, 29.061],
  antalya: [36.8969, 30.7133],
};

const SECTORS = [
  { key: 'all', label: 'Tüm Sektörler', icon: Layers },
  { key: 'berber_kuafor', label: 'Berber & Kuaför', icon: Scissors },
  { key: 'kafe_restoran', label: 'Kafe & Restoran', icon: UtensilsCrossed },
  { key: 'guzellik_salonu', label: 'Güzellik & Bakım', icon: Sparkles },
  { key: 'market_bufe', label: 'Bakkal & Market', icon: Store },
  { key: 'teknik_servis', label: 'Teknik Servis', icon: Store },
];

const CITIES = [
  { key: 'all', label: 'Tüm Şehirler' },
  { key: 'istanbul', label: 'İstanbul' },
  { key: 'ankara', label: 'Ankara' },
  { key: 'izmir', label: 'İzmir' },
  { key: 'bursa', label: 'Bursa' },
  { key: 'antalya', label: 'Antalya' },
];

export const ShopsDiscoveryMap: React.FC<ShopsDiscoveryMapProps> = ({
  className = '',
  initialCity = 'all',
  initialSector = 'all',
}) => {
  const [shops, setShops] = useState<PublicShopMapItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSector, setSelectedSector] = useState<string>(initialSector);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  // 1. Kamusal Harita Verisini API'den Çek
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch('/api/public/shops-map')
      .then((res) => {
        if (!res.ok) throw new Error('Harita verisi alınamadı');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data && Array.isArray(data.shops)) {
          setShops(data.shops);
        } else if (Array.isArray(data)) {
          setShops(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Harita yükleme hatası:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Leaflet CDN Kütüphanesini Dinamik Olarak Enjekte Et
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Leaflet CSS ekle
    if (!document.getElementById('leaflet-cdn-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-cdn-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Leaflet JS ekle
    if (!document.getElementById('leaflet-cdn-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-cdn-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      script.onerror = () => {
        console.warn('Leaflet CDN yüklenemedi, SVG harita moduna geçiliyor.');
      };
      document.body.appendChild(script);
    }
  }, []);

  // 3. Filtrelenmiş Dükkanlar
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      if (selectedSector !== 'all' && shop.sectorKey !== selectedSector) {
        return false;
      }
      if (selectedCity !== 'all') {
        const normCity = (shop.city || '').toLowerCase();
        if (!normCity.includes(selectedCity.toLowerCase())) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = shop.name.toLowerCase().includes(q);
        const matchesDistrict = (shop.district || '').toLowerCase().includes(q);
        const matchesCity = (shop.city || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDistrict && !matchesCity) {
          return false;
        }
      }
      return true;
    });
  }, [shops, selectedSector, selectedCity, searchTerm]);

  const activeShop = useMemo(() => {
    if (!activeShopId) return filteredShops[0] || null;
    return filteredShops.find((s) => s.id === activeShopId) || filteredShops[0] || null;
  }, [activeShopId, filteredShops]);

  // 4. Leaflet Haritasını Başlat ve Güncelle
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      // Türkiye ortası
      const defaultCenter: [number, number] = [39.0, 35.2];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Önceki pinleri temizle
    Object.values(markersRef.current).forEach((marker: any) => {
      try {
        map.removeLayer(marker);
      } catch {
        // ignore
      }
    });
    markersRef.current = {};

    // Pinleri ekle
    filteredShops.forEach((shop, index) => {
      if (!shop.lat || !shop.lng) return;

      const isSelected = activeShopId === shop.id;
      const markerHtml = `
        <div style="
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: ${isSelected ? '#ea580c' : '#1c1917'};
          color: white;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          ${index + 1}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: markerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([shop.lat, shop.lng], { icon: customIcon }).addTo(map);

      // Popup içeriği
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-stone-900';
      popupContent.innerHTML = `
        <div style="min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; background: #ffedd5; color: #c2410c; border-radius: 4px;">
              ${shop.district || shop.city}
            </span>
            <span style="font-size: 11px; font-weight: 700; color: #16a34a;">
              ● ${shop.isOpen ? 'Açık' : 'Randevu Açık'}
            </span>
          </div>
          <h4 style="font-size: 14px; font-weight: 900; margin: 0 0 4px 0; color: #1c1917;">
            ${shop.name}
          </h4>
          <p style="font-size: 11px; color: #78716c; margin: 0 0 10px 0;">
            ${shop.address || `${shop.district}, ${shop.city}`}
          </p>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${
              shop.hasBooking
                ? `<a href="/r/${shop.slug}" style="display: block; text-align: center; background: #ea580c; color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; text-decoration: none;">
                    📅 Online Randevu Al
                  </a>`
                : ''
            }
            ${
              shop.hasMenu
                ? `<a href="/m/${shop.slug}" style="display: block; text-align: center; background: #0284c7; color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; text-decoration: none;">
                    📋 QR Menüyü İncele
                  </a>`
                : ''
            }
            <a href="https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: #f5f5f4; color: #44403c; border: 1px solid #d6d3d1; padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none;">
              📍 Yol Tarifi Al
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setActiveShopId(shop.id);
      });

      markersRef.current[shop.id] = marker;
    });

    // Harita merkezini ayarla
    if (selectedCity !== 'all' && CITY_COORDINATES[selectedCity]) {
      map.setView(CITY_COORDINATES[selectedCity], 12);
    } else if (filteredShops.length > 0) {
      const validCoords = filteredShops.filter((s) => s.lat && s.lng);
      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords.map((s) => [s.lat, s.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [leafletLoaded, filteredShops, selectedCity, activeShopId]);

  // Bir dükkan tıklandığında haritayı oraya kaydır ve popup aç
  const handleSelectShop = (shop: PublicShopMapItem) => {
    setActiveShopId(shop.id);
    if (mapInstanceRef.current && shop.lat && shop.lng) {
      mapInstanceRef.current.flyTo([shop.lat, shop.lng], 15, { duration: 1 });
      const marker = markersRef.current[shop.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <section className={`w-full py-12 ${className}`} id="esnaf-haritasi">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Üst Başlık & Açıklama */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-xs font-black uppercase tracking-wider mb-3">
            <MapPin className="w-4 h-4 text-orange-600" />
            Canlı Mahalle Ağı
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            Bizimle Çalışan Mahalle Esnafları
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
            Mahallenizdeki güvenilir berberlerden kafe ve butiklere kadar tüm esnaflarımızı canlı haritadan keşfedin; tek tıkla online randevu alın veya QR menüyü inceleyin.
          </p>
        </div>

        {/* Filtre Barı (Sektörler, Şehir & Arama) */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 border border-stone-200/80 dark:border-stone-800 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Arama Kutusu */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Dükkan adı veya semt ara (örn. Kadıköy, Alsancak, Çankaya)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 text-xs sm:text-sm font-medium border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900 dark:text-white"
              />
            </div>

            {/* Şehir Seçimi Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 whitespace-nowrap">
                Şehir:
              </span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {CITIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sektör Butonları */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SECTORS.map((s) => {
              const Icon = s.icon;
              const isSelected = selectedSector === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSelectedSector(s.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-500/20'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ana Harita & Dükkan Listesi Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sol Kolon: İnteraktif Harita (7 Kolon) */}
          <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-3xl p-3 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-3">
            <div className="relative w-full h-[420px] sm:h-[480px] rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60">
              {/* Leaflet Harita Kapsayıcısı */}
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Yükleniyor Göstergesi */}
              {loading && (
                <div className="absolute inset-0 bg-stone-50/80 dark:bg-stone-900/80 flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 rounded-2xl shadow-md border border-stone-200 dark:border-stone-700">
                    <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
                    <span className="text-xs font-black text-stone-800 dark:text-stone-200">
                      Esnaf haritası yükleniyor...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Seçili Dükkan Hızlı Aksiyon Kartı */}
            {activeShop && (
              <div className="p-3.5 rounded-2xl bg-orange-50/80 dark:bg-stone-800/80 border border-orange-200 dark:border-orange-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-sm font-black text-stone-900 dark:text-white truncate">
                      {activeShop.name}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                      {activeShop.district ? `${activeShop.district}, ` : ''}
                      {activeShop.city} · <span className="text-emerald-600 font-bold">● Açık</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {activeShop.hasBooking && (
                    <a
                      href={`/r/${activeShop.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Randevu Al
                    </a>
                  )}
                  {activeShop.hasMenu && (
                    <a
                      href={`/m/${activeShop.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Menü
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeShop.lat},${activeShop.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:bg-stone-100 transition-colors"
                    title="Google Haritalar ile Yol Tarifi Al"
                  >
                    <Navigation className="w-3 h-3 text-orange-600" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Sağ Kolon: Esnaf Kartları Listesi (5 Kolon) */}
          <div className="lg:col-span-5 flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between pb-1 px-1">
              <span className="text-xs font-black text-stone-500 uppercase tracking-wider">
                Listelenen Esnaflar ({filteredShops.length})
              </span>
              <span className="text-xs font-bold text-orange-600">Haritada Tıkla & İncele</span>
            </div>

            {filteredShops.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 text-center border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center">
                <Store className="w-10 h-10 text-stone-300 dark:text-stone-600 mb-2" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                  Aramanıza uygun esnaf bulunamadı.
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Şehir veya sektör filtresini değiştirerek tekrar deneyebilirsiniz.
                </p>
              </div>
            ) : (
              filteredShops.map((shop, idx) => {
                const isSelected = activeShop?.id === shop.id;
                return (
                  <div
                    key={shop.id}
                    onClick={() => handleSelectShop(shop)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-stone-800 border-orange-500 shadow-md ring-2 ring-orange-500/20'
                        : 'bg-white/90 dark:bg-stone-900/90 border-stone-200 dark:border-stone-800 hover:border-orange-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                          {shop.district || shop.city}
                        </span>
                        {shop.rating && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {shop.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {shop.isOpen ? 'Açık' : 'Randevu Açık'}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-black text-stone-900 dark:text-white">
                      {shop.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      {shop.address || `${shop.district}, ${shop.city}`}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span className="text-stone-600 dark:text-stone-400 text-[11px] font-semibold truncate max-w-[150px]">
                          {shop.district ? `${shop.district}, ` : ''}
                          {shop.city}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {shop.hasBooking && (
                          <a
                            href={`/r/${shop.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-black text-orange-600 dark:text-orange-400 hover:underline"
                          >
                            Randevu
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {shop.hasMenu && (
                          <a
                            href={`/m/${shop.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-black text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            Menü
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopsDiscoveryMap;
