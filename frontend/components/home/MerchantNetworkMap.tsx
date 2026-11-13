import React, { useState, useEffect, useMemo } from 'react';
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
  Clock,
  Phone,
} from 'lucide-react';

export interface MapMerchant {
  id: string;
  name: string;
  slug: string;
  sectorKey: string;
  sectorName: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  phone?: string;
  actionUrl: string;
  actionLabel: string;
  badge?: string;
  isOpen?: boolean;
  logoUrl?: string;
}

const INITIAL_PILOT_MERCHANTS: MapMerchant[] = [
  {
    id: 'demo-barber',
    name: 'Berber & Kuaför Demo — Kadıköy Moda',
    slug: 'demo',
    sectorKey: 'berber_kuafor',
    sectorName: 'Erkek Kuaförü & Berber',
    city: 'İstanbul',
    district: 'Kadıköy',
    latitude: 40.9882,
    longitude: 29.0267,
    phone: '0555 000 0000',
    actionUrl: '/r/demo',
    actionLabel: 'Randevu Al',
    badge: 'Canlı Randevu Demo',
    isOpen: true,
  },
  {
    id: 'demo-cafe',
    name: 'Karaköy Kahvecisi & Bistro',
    slug: 'demo',
    sectorKey: 'kafe_restoran',
    sectorName: 'Kafe & Bistro',
    city: 'İstanbul',
    district: 'Beyoğlu',
    latitude: 41.0234,
    longitude: 28.9774,
    phone: '0555 000 0000',
    actionUrl: '/m/demo',
    actionLabel: 'QR Menüyü Gör',
    badge: 'QR Menü Aktif',
    isOpen: true,
  },
  {
    id: 'nisantasi-beauty',
    name: 'Nişantaşı Güzellik & Nail Studio',
    slug: 'nisantasi-guzellik',
    sectorKey: 'guzellik_salonu',
    sectorName: 'Güzellik Salonu & Seans',
    city: 'İstanbul',
    district: 'Şişli',
    latitude: 41.0504,
    longitude: 28.9928,
    phone: '0212 555 0101',
    actionUrl: '/guzellik-salonu',
    actionLabel: 'İncele',
    badge: 'Paket & Seans Takibi',
    isOpen: true,
  },
  {
    id: 'cankaya-hair',
    name: 'Çankaya Premium Kuaför & Saç Tasarım',
    slug: 'cankaya-kuafor',
    sectorKey: 'berber_kuafor',
    sectorName: 'Kadın Kuaförü & Renklendirme',
    city: 'Ankara',
    district: 'Çankaya',
    latitude: 39.8969,
    longitude: 32.8644,
    phone: '0312 555 0102',
    actionUrl: '/kuafor',
    actionLabel: 'Randevu Sistemi',
    badge: 'Online Randevu',
    isOpen: true,
  },
  {
    id: 'alsancak-lounge',
    name: 'Alsancak Kahve & Adisyon Lounge',
    slug: 'alsancak-kahve',
    sectorKey: 'kafe_restoran',
    sectorName: 'Kafe & Adisyon',
    city: 'İzmir',
    district: 'Konak',
    latitude: 38.4382,
    longitude: 27.1428,
    phone: '0232 555 0103',
    actionUrl: '/kafe-restoran',
    actionLabel: 'Adisyon İncele',
    badge: 'Canlı Masa Takibi',
    isOpen: true,
  },
  {
    id: 'bursa-pos',
    name: 'Nilüfer Mahalle Şarküteri & Bakkal',
    slug: 'nilufer-sarkuteri',
    sectorKey: 'bakkal_market',
    sectorName: 'Bakkal & Hızlı POS',
    city: 'Bursa',
    district: 'Nilüfer',
    latitude: 40.2133,
    longitude: 28.9833,
    phone: '0224 555 0104',
    actionUrl: '/bakkal-market',
    actionLabel: 'POS Sistemi',
    badge: 'Veresiye Defteri',
    isOpen: true,
  },
  {
    id: 'antalya-tailor',
    name: 'Muratpaşa Moda Evi & Usta Terzi',
    slug: 'muratpasa-terzi',
    sectorKey: 'terzi',
    sectorName: 'Terzi & Kuru Temizleme',
    city: 'Antalya',
    district: 'Muratpaşa',
    latitude: 36.8841,
    longitude: 30.7056,
    phone: '0242 555 0105',
    actionUrl: '/terzi',
    actionLabel: 'Emanet Takip',
    badge: 'Tadilat Fişi',
    isOpen: true,
  },
  {
    id: 'uskudar-service',
    name: 'Üsküdar Telefon & Teknik Servis',
    slug: 'uskudar-teknik-servis',
    sectorKey: 'teknik_servis',
    sectorName: 'Teknik Servis & Cihaz Takip',
    city: 'İstanbul',
    district: 'Üsküdar',
    latitude: 41.0267,
    longitude: 29.0156,
    phone: '0216 555 0106',
    actionUrl: '/teknik-servis',
    actionLabel: 'Servis Fişi',
    badge: 'Cihaz Sorgula',
    isOpen: true,
  },
];

const CITIES = ['Tüm Türkiye', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];

const SECTOR_PILLS = [
  { key: 'all', label: 'Tüm Sektörler' },
  { key: 'berber_kuafor', label: 'Berber & Kuaför' },
  { key: 'kafe_restoran', label: 'Kafe & Restoran' },
  { key: 'guzellik_salonu', label: 'Güzellik Salonu' },
  { key: 'bakkal_market', label: 'Bakkal & Market' },
  { key: 'teknik_servis', label: 'Teknik Servis' },
  { key: 'terzi', label: 'Terzi & Moda' },
];

export default function MerchantNetworkMap() {
  const [merchants, setMerchants] = useState<MapMerchant[]>(INITIAL_PILOT_MERCHANTS);
  const [selectedCity, setSelectedCity] = useState<string>('Tüm Türkiye');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMerchantId, setActiveMerchantId] = useState<string>('demo-barber');

  // Backend canlı harita verisini asenkron çek (varsa yeni esnafları ekle)
  useEffect(() => {
    let isMounted = true;
    fetch('/api/public/shops/map')
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((data) => {
        if (!isMounted || !data?.shops || !Array.isArray(data.shops)) return;
        const liveShops: MapMerchant[] = data.shops.map((s: any) => ({
          id: s.id,
          name: s.shopName,
          slug: s.slug || s.id,
          sectorKey: s.sectorKey || 'genel_esnaf',
          sectorName: s.slogan || (s.sectorKey === 'berber_kuafor' ? 'Berber & Kuaför' : 'Esnaf & İşletme'),
          city: s.city || 'İstanbul',
          district: s.district || '',
          latitude: s.coordinates?.lat || 41.0082,
          longitude: s.coordinates?.lng || 28.9784,
          phone: s.phone,
          actionUrl: s.bookingUrl || `/r/${s.slug || s.id}`,
          actionLabel: s.sectorKey === 'kafe_restoran' ? 'Menüyü Gör' : 'Randevu Al',
          badge: s.isVip ? 'VIP Üye' : 'Doğrulanmış Esnaf',
          isOpen: Boolean(s.isOpen),
        }));

        // Initial pilot dükkanlar ile canlı listeyi birleştir, id bazlı tekilleştir
        const map = new Map<string, MapMerchant>();
        INITIAL_PILOT_MERCHANTS.forEach((m) => map.set(m.id, m));
        liveShops.forEach((s) => map.set(s.id, s));
        setMerchants(Array.from(map.values()));
      })
      .catch(() => {
        // Hata durumunda INITIAL_PILOT_MERCHANTS ile sorunsuz devam edilir
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      const matchCity =
        selectedCity === 'Tüm Türkiye' ||
        m.city.toLowerCase() === selectedCity.toLowerCase();

      const matchSector =
        selectedSector === 'all' || m.sectorKey === selectedSector;

      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.district.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.sectorName.toLowerCase().includes(q);

      return matchCity && matchSector && matchQuery;
    });
  }, [merchants, selectedCity, selectedSector, searchQuery]);

  const activeMerchant = useMemo(() => {
    return (
      filteredMerchants.find((m) => m.id === activeMerchantId) ||
      filteredMerchants[0] ||
      merchants[0]
    );
  }, [filteredMerchants, activeMerchantId, merchants]);

  return (
    <section className="relative py-12 sm:py-20 bg-stone-50/80 dark:bg-stone-900/60 border-y border-stone-200/80 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Bölüm Başlığı */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 dark:bg-orange-950/40 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              TÜRKİYE ESNAF İLETİŞİM AĞI & CANLI HARİTA
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
              Dükkânım Yanımda Kullanan <span className="text-orange-600 dark:text-orange-400">Esnafları Keşfedin</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium max-w-2xl">
              Türkiye genelinde randevu takvimi, temassız QR menü ve hızlı kasa sistemiyle çalışan esnaflarımız.
              Randevunuzu hemen online alın veya menüleri inceleyin.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-stone-400 shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-black text-stone-800 dark:text-stone-200">
              {filteredMerchants.length} İşletme
            </span>
            <span>aktif hizmet veriyor</span>
          </div>
        </div>

        {/* Filtre ve Arama Çubuğu */}
        <div className="bg-white dark:bg-stone-800/90 rounded-2xl p-4 border border-stone-200/90 dark:border-stone-700 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Arama Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Dükkan adı, ilçe veya sektör ara (Örn: Kadıköy, Berber, Kafe...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              />
            </div>

            {/* Şehir Seçici */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCity === city
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-700/60 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Sektör Hapları */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 scrollbar-none">
            <span className="text-[11px] font-black uppercase text-stone-400 tracking-wider flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Sektör:
            </span>
            {SECTOR_PILLS.map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => setSelectedSector(pill.key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSector === pill.key
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-black'
                    : 'bg-stone-50 dark:bg-stone-900/50 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ana Harita & İşletme Listesi Izgarası */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[480px]">
          {/* Sol Kolon: İnteraktif Harita Görseli & Pin Sistemi (7 Kolon) */}
          <div className="lg:col-span-7 bg-white dark:bg-stone-800/90 rounded-3xl p-5 border border-stone-200/90 dark:border-stone-700 shadow-sm flex flex-col justify-between relative overflow-hidden">
            {/* Harita Başlığı ve Canlı Gösterge */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-700/60">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-200">
                  Türkiye Canlı Hizmet Lokasyonları
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Aktif Esnaf Ağı
              </span>
            </div>

            {/* Vektörel Türkiye Haritası & Pinler */}
            <div className="relative my-4 flex-1 min-h-[300px] bg-stone-50 dark:bg-stone-900/40 rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-stone-100 dark:border-stone-800">
              <svg
                viewBox="0 0 1000 480"
                className="w-full h-auto max-h-[340px] opacity-75 dark:opacity-60"
                fill="currentColor"
              >
                <path
                  className="text-stone-200 dark:text-stone-700"
                  d="M120,180 Q200,120 350,150 T600,160 T850,190 Q920,220 900,300 T750,380 T500,360 T250,370 T100,280 Z"
                />
                <circle cx="280" cy="210" r="14" className="text-orange-400/30" />
                <circle cx="490" cy="240" r="14" className="text-orange-400/30" />
                <circle cx="210" cy="290" r="14" className="text-orange-400/30" />
                <circle cx="340" cy="230" r="14" className="text-orange-400/30" />
                <circle cx="410" cy="360" r="14" className="text-orange-400/30" />
              </svg>

              {/* Pinler */}
              <div className="absolute inset-0 p-6 pointer-events-none">
                {filteredMerchants.slice(0, 10).map((m, idx) => {
                  // Koordinatlara göre normalize edilmiş harita pin pozisyonları
                  const topPercent = Math.max(
                    15,
                    Math.min(85, (42.5 - m.latitude) * 12 + 10)
                  );
                  const leftPercent = Math.max(
                    15,
                    Math.min(85, (m.longitude - 26) * 4.2 + 8)
                  );

                  const isSelected = activeMerchant?.id === m.id;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveMerchantId(m.id)}
                      style={{
                        top: `${topPercent}%`,
                        left: `${leftPercent}%`,
                      }}
                      className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer group ${
                        isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                      }`}
                      title={`${m.name} (${m.district}, ${m.city})`}
                    >
                      <span className="relative flex items-center justify-center">
                        <span
                          className={`absolute w-7 h-7 rounded-full animate-ping opacity-75 ${
                            isSelected ? 'bg-orange-500' : 'bg-stone-400'
                          }`}
                        />
                        <span
                          className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md border-2 border-white dark:border-stone-800 ${
                            isSelected ? 'bg-orange-600' : 'bg-stone-800'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </span>

                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-stone-900 text-white text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-lg z-30 pointer-events-none">
                        {m.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seçili Dükkan Hızlı Önizleme Kartı */}
            {activeMerchant && (
              <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-stone-900/80 border border-orange-200/80 dark:border-orange-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden border border-orange-200 dark:border-orange-800">
                    {activeMerchant.logoUrl ? (
                      <img src={activeMerchant.logoUrl} alt={activeMerchant.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 dark:text-white line-clamp-1">
                      {activeMerchant.name}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                      {activeMerchant.district}, {activeMerchant.city} · <span className="text-orange-600 dark:text-orange-400 font-bold">{activeMerchant.sectorName}</span>
                    </p>
                  </div>
                </div>

                <a
                  href={activeMerchant.actionUrl}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-xs cursor-pointer shrink-0"
                >
                  {activeMerchant.actionLabel}
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Sağ Kolon: Esnaf Kartları Listesi (5 Kolon) */}
          <div className="lg:col-span-5 flex flex-col gap-3 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredMerchants.length === 0 ? (
              <div className="bg-white dark:bg-stone-800 rounded-3xl p-8 text-center border border-stone-200 dark:border-stone-700 h-full flex flex-col items-center justify-center">
                <Store className="w-10 h-10 text-stone-300 dark:text-stone-600 mb-2" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                  Aramanıza uygun esnaf bulunamadı.
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Şehir veya sektör filtresini değiştirerek tekrar deneyebilirsiniz.
                </p>
              </div>
            ) : (
              filteredMerchants.map((merchant, idx) => {
                const isSelected = activeMerchant?.id === merchant.id;
                return (
                  <div
                    key={merchant.id}
                    onClick={() => setActiveMerchantId(merchant.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-stone-800 border-orange-500 shadow-md ring-2 ring-orange-500/20'
                        : 'bg-white/80 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700/80 hover:border-orange-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                          {merchant.badge || 'Aktif'}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {merchant.isOpen ? 'Açık' : 'Randevu Açık'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {merchant.logoUrl && (
                        <div className="w-8 h-8 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 shrink-0">
                          <img src={merchant.logoUrl} alt={merchant.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-stone-900 dark:text-white truncate">
                          {merchant.name}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium truncate">
                          {merchant.sectorName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-stone-100 dark:border-stone-700/60">
                      <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400 font-medium">
                        <MapPin className="w-3 h-3 text-orange-500" />
                        {merchant.district}, {merchant.city}
                      </span>

                      <a
                        href={merchant.actionUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-black text-orange-600 dark:text-orange-400 hover:underline"
                      >
                        {merchant.actionLabel}
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
}
