import React, { useState, useEffect } from 'react';
import {
  Store,
  ArrowRight,
  LogIn,
  Wallet,
  BookUser,
  Package,
  Scissors,
  UtensilsCrossed,
  ShoppingCart,
  Wrench,
  Shirt,
  Scale,
  LayoutDashboard,
  BellRing,
  ShieldCheck,
  DatabaseBackup,
  Users,
  ChartColumn,
  Smartphone,
  BadgeCheck,
  Zap,
  ChevronDown,
  Check,
  Loader2,
  PlayCircle,
  Sparkles,
  QrCode,
  MessageCircle,
  TrendingUp,
  Receipt,
  Layers,
  CheckCircle2,
  Crown,
  Instagram,
  BookOpen,
  MapPin,
  Calendar,
} from 'lucide-react';
import logoRaw from '../../public/brand/logo-dukkanim.svg?raw';
import { useForceLightTheme } from '../../hooks/useForceLightTheme';
import { trackCtaClick, trackDemoStart } from '../../utils/analytics';
import { BLOG_ARTICLES } from '../../../shared/blogArticles.ts';

const LazyShopsDiscoveryMap = React.lazy(() => import('../public/ShopsDiscoveryMap'));

function LazyMapSection() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldLoad) return;
    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={containerRef} className="min-h-[520px]">
      {shouldLoad ? (
        <React.Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
              <div className="h-[480px] rounded-3xl bg-stone-100 dark:bg-stone-800 animate-pulse border border-stone-200 dark:border-stone-700" />
            </div>
          }
        >
          <LazyShopsDiscoveryMap />
        </React.Suspense>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="h-[480px] rounded-3xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800" />
        </div>
      )}
    </div>
  );
}

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

interface SectorInfo {
  id: string;
  href: string;
  image: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  highlights: string[];
}

const SECTOR_DATA: SectorInfo[] = [
  {
    id: 'berber',
    href: '/berber',
    image: '/og/berber.png',
    icon: Scissors,
    title: 'Berber & Erkek Kuaförü',
    tagline: '7/24 online randevu, koltuk sırası ve usta primi cebinde',
    description: 'Müşteri randevuları karışmasın, usta ve kalfa primleri kuruşu kuruşuna hesaplansın. %0 komisyonlu randevu linkinle koltuklarını tam kapasite doldur.',
    badge: 'Koltuk & Randevu',
    highlights: ['%0 Komisyonlu Online Randevu Linki', 'Otomatik Usta & Kalfa Prim Hesabı', 'WhatsApp & SMS Randevu Hatırlatma', 'Tek Tıkla Kasa & Gün Sonu'],
  },
  {
    id: 'kuafor',
    href: '/kuafor',
    image: '/og/guzellik-salonu.png',
    icon: Sparkles,
    title: 'Kuaför & Güzellik Salonu',
    tagline: 'İşlem süresi planlama, seans/paket takibi ve kapora yönetimi',
    description: 'Boya, keratin, lazer epilasyon ve cilt bakımı gibi çok seanslı işlemleri kabin ve uzman takvimine göre planla; gelmeme (no-show) kaybını önle.',
    badge: 'Salon & Seans Takibi',
    highlights: ['Uzman & Kabin Bazlı Takvim', 'Seans / Paket Kalan Hak Sayacı', 'Gelin Başı & İşlem Kapora Takibi', 'Müşteri Bakım Notları & Sadakat'],
  },
  {
    id: 'kafe',
    href: '/kafe-restoran',
    image: '/og/kafe-restoran.png',
    icon: UtensilsCrossed,
    title: 'Kafe & Restoran Adisyon',
    tagline: 'Canlı masa planı, fotoğraflı QR menü ve hızlı adisyon',
    description: 'Salon, bahçe ve teras masalarını tek ekrandan yönet. Masadan QR sipariş al, garson çağrılarını anında gör, parçalı ödeme alıp hesabı saniyeler içinde kapat.',
    badge: 'Masa & QR Menü',
    highlights: ['Masalara Özel Logolu QR Menü', 'Canlı Masa, İkram & Adisyon Takibi', 'Nakit / POS / Havale Parçalı Tahsilat', 'Anlık Garson & Hesap Çağrı Zili'],
  },
  {
    id: 'kasa',
    href: '/kasa-programi',
    image: '/og/gun-sonu-raporu.png',
    icon: Wallet,
    title: 'Ortak Kasa, Veresiye & Gün Sonu',
    tagline: 'Her iki sektör için nakit, POS, cari ve 30 saniyede Z raporu',
    description: 'Hem salonlarda hem kafe/restoranlarda kapanan her randevu ve adisyon kasaya otomatik işlenir. Gider, personel primi ve açık hesaplarla akşam hesabın birebir tutar.',
    badge: 'Kasa & Gün Sonu',
    highlights: ['Nakit, POS & Havale Canlı Kasa', '30 Saniyede Gün Sonu Z Raporu', 'Dijital Veresiye & WhatsApp Ekstresi', 'Bulut Yedekleme & Mobil PWA'],
  },
];

const BENTO_FEATURES = [
  {
    icon: BookUser,
    tag: 'VERESİYE & CARİ',
    title: 'Defterdeki Sayfalar Yırtılmaz, Borçlar Asla Unutulmaz',
    description: 'Müşterilerine tek dokunuşla cari kart aç. Kim ne zaman ne aldı, kaç para borcu kaldı anlık gör. Tek tıkla WhatsApp’tan kibar bakiye hatırlatması yolla.',
    badgeText: 'Tahsilat Hızı +%40',
    color: 'from-orange-500/10 to-orange-500/5',
    accent: 'text-orange-600',
  },
  {
    icon: Wallet,
    tag: 'KASA & GÜN SONU',
    title: 'Akşam Kasayı 3 Dakikada Say, Farkı Gör, Kafan Rahat Uyu',
    description: 'Nakit, kredi kartı, IBAN havale ve giderler tek ekranda. Akşam olunca kasadaki parayı gir; sistem hesaplananla uyuşuyor mu söylesin.',
    badgeText: '0 Kasa Açığı',
    color: 'from-emerald-500/10 to-emerald-500/5',
    accent: 'text-emerald-600',
  },
  {
    icon: Package,
    tag: 'AKILLI STOK & BARKOD',
    title: 'Kamera ile Barkod Okut, Biten Ürünü Anında Yakala',
    description: 'Pahalı POS cihazı veya el terminali yok. Telefonunun kamerasıyla ürün barkodunu oku, kritik seviyeye inen mallar için anında uyarı al.',
    badgeText: 'Cihaz Maliyeti 0 ₺',
    color: 'from-blue-500/10 to-blue-500/5',
    accent: 'text-blue-600',
  },
  {
    icon: Smartphone,
    tag: 'HER CİHAZDA ÇALIŞIR',
    title: 'Tezgahta Tablet, Cebinde Telefon, Evde Bilgisayar',
    description: 'Kurulum veya teknik bilgi gerekmez. Telefonuna tek tıkla uygulama gibi (PWA) yükle; internet olan her yerden dükkanını canlı izle.',
    badgeText: 'Bulut Senkron',
    color: 'from-purple-500/10 to-purple-500/5',
    accent: 'text-purple-600',
  },
];

const FAQS = [
  {
    q: 'Dükkanım Yanımda tamamen ücretsiz mi?',
    a: 'Evet! Hemen 1 dakikada telefon numaranızla Standart Esnaf (0 TL) olarak kayıt olabilir; 25 müşteriye kadar veresiye/cari defterinizi ve günlük kasanızı ücretsiz kullanabilirsiniz. Online Randevu Takvimi, sınırsız müşteri, Türkçe sesli asistan, termal fiş ve dükkanınıza özel kodlama istediğinizde ayda ₺249\'dan başlayan Usta ve Patron VIP paketlerimize dilediğiniz an geçebilirsiniz.',
  },
  {
    q: 'İşletmeme özel VIP panel üretimini nasıl talep ederim?',
    a: 'Çok kolay! Giriş yaptıktan sonra VIP sekmesinden veya doğrudan bize ulaşarak işletmenizin ihtiyacı olan ekranları (özel fiş, adisyon, usta primi veya tartı entegrasyonu) iletmeniz yeterlidir. Mühendis ekibimiz doğrudan sizin dükkanınıza özel ekranları hızla kodlar ve yayına alır.',
  },
  {
    q: 'Telefonumda uygulama gibi çalışır mı?',
    a: 'Evet! Gelişmiş PWA (Progressive Web App) teknolojisi sayesinde Safari veya Chrome üzerinden "Ana Ekrana Ekle" diyerek herhangi bir mobil uygulama gibi tek dokunuşla açıp kullanabilirsiniz.',
  },
  {
    q: 'Eski kağıt defterimdeki borçları nasıl aktarırım?',
    a: 'Çok kolay! Müşterinizi eklerken eski toplam borcunu "Açılış Bakiyesi" olarak girmeniz yeterlidir. Bugünden itibaren yapacağı tüm alışveriş ve ödemeler bu tutarın üzerine otomatik işlenir.',
  },
  {
    q: 'Verilerim güvende mi? Telefonumu kaybedersem ne olur?',
    a: 'Tüm kayıtlarınız banka standartlarında şifrelenmiş sunucularda güvenle saklanır. Telefonunuz bozulsa veya kaybolsa dahi yeni cihazınızdan giriş yaptığınızda tüm dükkan defteriniz eksiksiz karşınızdadır.',
  },
  {
    q: 'Ödemesi geciken müşteriye WhatsApp’tan mesaj atabilir miyim?',
    a: 'Evet! Müşteri cari kartında bulunan "WhatsApp ile Hatırlat" butonuna bastığınızda, sistem otomatik olarak kibar ve kurumsal bir bakiye hatırlatma mesajını WhatsApp’ınızda hazırlar, size sadece göndermek kalır.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  useForceLightTheme();
  const [selectedSector, setSelectedSector] = useState<string>('berber');
  const [stats, setStats] = useState({
    shopsLabel: '50+',
    trackedVolume: '₺850K+',
    setupTime: '2 Dakika',
    price: '0 TL',
  });

  useEffect(() => {
    fetch('/api/public/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.shopsLabel) {
          setStats({
            shopsLabel: data.shopsLabel,
            trackedVolume: data.trackedVolume || '₺850K+',
            setupTime: data.setupTime || '2 Dakika',
            price: data.price || '0 TL',
          });
        }
      })
      .catch(() => {});
  }, []);

  const currentSector = SECTOR_DATA.find((s) => s.id === selectedSector) || SECTOR_DATA[0];

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0B0F17] text-[#0F172A] dark:text-[#F8FAFC] font-sans scroll-smooth selection:bg-orange-500/25 selection:text-orange-900 transition-colors">
      {/* Üst Navigasyon Çubuğu */}
      <header className="sticky top-0 z-50 border-b border-stone-200/80 dark:border-stone-800/80 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-2 select-none cursor-pointer transition-transform hover:scale-[1.02] shrink-0"
              title="Dükkânım Yanımda - Esnaf Portalı"
            >
              <picture>
                <source srcSet="/brand/logo-horizontal.webp" type="image/webp" />
                <img
                  src="/brand/logo-horizontal.png"
                  alt="Dükkânım Yanımda — Esnaf Yönetim Programı logosu"
                  width={160}
                  height={53}
                  fetchPriority="high"
                  decoding="async"
                  className="h-9 sm:h-10 w-auto object-contain block"
                />
              </picture>
            </a>
          </div>

          {/* Menü Linkleri */}
          <nav
            aria-label="Ana Menü"
            className="hidden lg:flex items-center justify-center gap-5 xl:gap-7 text-sm font-bold text-stone-600 dark:text-stone-300"
          >
            <a href="#ozellikler" className="whitespace-nowrap shrink-0 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Özellikler</a>
            <a href="#sektorler" className="whitespace-nowrap shrink-0 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Sektörler</a>
            <a href="/blog" className="whitespace-nowrap shrink-0 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Blog</a>
            <a href="/rehber" className="whitespace-nowrap shrink-0 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Rehber</a>
            <a
              href="#vip"
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 px-3 py-1.5 rounded-xl text-orange-700 dark:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>Fiyatlar</span>
            </a>
            <a href="#sss" className="whitespace-nowrap shrink-0 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">SSS</a>
          </nav>

          {/* Aksiyon Butonları */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="https://www.instagram.com/dukkanimyanimdatr/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center justify-center p-2 rounded-xl text-stone-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors shrink-0"
              title="Instagram: @dukkanimyanimdatr"
              aria-label="Instagram @dukkanimyanimdatr"
            >
              <Instagram className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => {
                trackCtaClick('Giriş', 'landing_header');
                onLogin();
              }}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer border border-stone-200/80 dark:border-stone-700/80"
            >
              <LogIn className="w-4 h-4 text-stone-500 shrink-0" />
              <span>Giriş Yap</span>
            </button>

            <button
              type="button"
              onClick={() => {
                trackCtaClick('Ücretsiz Başla', 'landing_header');
                trackDemoStart('landing_header_primary');
                onRegister();
              }}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-linear-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
              title="14 Gün Ücretsiz Başla (Kredi Kartsız)"
            >
              <span>Ücretsiz Başla</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 lg:pb-24">
        {/* Lüks Kehribar Arka Plan Işıltısı */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(1100px 550px at 50% -5%, rgba(251,191,36,0.22), transparent 70%), radial-gradient(750px 420px at 90% 60%, rgba(245,158,11,0.10), transparent 60%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Sol Kolon: Başlık, Mesaj & CTA */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Üst Rozet */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-stone-900 border border-orange-300/80 dark:border-orange-700/50 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping" />
              <span className="text-[11px] sm:text-xs font-black tracking-wide text-orange-800 dark:text-orange-300 uppercase">
                KUAFÖR &amp; BERBER RANDEVU · KAFE &amp; RESTORAN QR ADİSYON
              </span>
            </div>

            {/* Ana Başlık */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-[#0F172A] dark:text-white">
              Defteri Kapat,<br />
              <span className="bg-linear-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent">
                Dükkânını Cebine Al.
              </span>
            </h1>

            {/* Açıklama */}
            <p className="text-base sm:text-xl text-stone-600 dark:text-stone-300 font-medium leading-relaxed max-w-2xl">
              Berber, kuaför ve güzellik salonları için <strong className="text-stone-900 dark:text-white font-black">%0 komisyonlu online randevu &amp; usta primi</strong>; kafe ve restoranlar için <strong className="text-stone-900 dark:text-white font-black">ücretsiz QR menü, masa adisyonu</strong>, kasa ve gün sonu tek ekranda.
            </p>

            {/* Aksiyon Grubu */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  trackCtaClick('14 Gün Ücretsiz Başla', 'landing_hero');
                  trackDemoStart('landing_hero');
                  onRegister();
                }}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-black text-white bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/40 active:scale-98 transition-all cursor-pointer"
              >
                14 Gün Ücretsiz Başla
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  trackCtaClick('Giriş Yap', 'landing_hero');
                  onLogin();
                }}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-bold text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-orange-400 dark:hover:border-orange-600 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <LogIn className="w-5 h-5 text-orange-500" />
                Giriş Yap
              </button>
            </div>

            {/* Güven Rozetleri */}
            <div className="pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-500" /> Kredi Kartı İstemez
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-500" /> 2 Dakikada Kurulum
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> %100 Şifreli Bulut
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-orange-500" /> Telefona & Tablete Uyumlu
              </span>
            </div>
          </div>

          {/* Sağ Kolon: Modern SaaS Dashboard Mockup */}
          <div className="lg:col-span-5 relative">
            {/* Arka plan ambient halo */}
            <div className="absolute -inset-2 bg-linear-to-r from-orange-400/20 to-orange-600/20 rounded-3xl blur-2xl opacity-70 pointer-events-none" />

            <div className="relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xl p-5 sm:p-6 transition-all">
              {/* Sahte Pencere Başlığı */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400" />
                  <span className="w-3 h-3 rounded-full bg-orange-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-black text-stone-400">dukkanim-yanimda-panel</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Kasa Açık
                </span>
              </div>

              {/* Günün Kasası Kartı */}
              <div className="mt-4 p-4 rounded-2xl bg-linear-to-br from-orange-50 via-white to-orange-50/40 dark:from-stone-800/80 dark:to-stone-800/40 border border-orange-200/80 dark:border-orange-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">Bugünkü Kasa</span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    + %18 Dünden Fazla
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">₺14.850</span>
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400">Net Kâr: <strong className="text-emerald-600 font-black">₺9.420</strong></span>
                </div>
                
                {/* Dağılım Çubukları */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-bold text-center">
                  <div className="bg-white/90 dark:bg-stone-900/80 rounded-xl p-2 border border-stone-200/60 dark:border-stone-700/60">
                    <span className="text-stone-400 block text-[10px]">Nakit</span>
                    <span className="text-emerald-600 font-black">₺7.200</span>
                  </div>
                  <div className="bg-white/90 dark:bg-stone-900/80 rounded-xl p-2 border border-stone-200/60 dark:border-stone-700/60">
                    <span className="text-stone-400 block text-[10px]">POS Kart</span>
                    <span className="text-emerald-600 font-black">₺5.650</span>
                  </div>
                  <div className="bg-white/90 dark:bg-stone-900/80 rounded-xl p-2 border border-stone-200/60 dark:border-stone-700/60">
                    <span className="text-stone-400 block text-[10px]">Gider</span>
                    <span className="text-rose-500 font-black">-₺2.000</span>
                  </div>
                </div>
              </div>

              {/* Canlı İşlem Akışı */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black text-stone-400 uppercase tracking-wider px-1">
                  <span>Son Hareketler</span>
                  <span>Şimdi</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700/50 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center font-black">₺</span>
                    <div>
                      <p className="font-black text-stone-800 dark:text-stone-100">Ahmet Usta (Tezgah Satışı)</p>
                      <p className="text-[10px] text-stone-400">Nakit Tahsil Edildi · Fiş #104</p>
                    </div>
                  </div>
                  <span className="font-black text-emerald-600">+₺450</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700/50 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/70 text-orange-600 flex items-center justify-center font-black">
                      <BookUser className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-black text-stone-800 dark:text-stone-100">Mehmet Bey (Veresiye Kapama)</p>
                      <p className="text-[10px] text-stone-400">FAST / Havale ile ödendi</p>
                    </div>
                  </div>
                  <span className="font-black text-emerald-600">+₺1.200</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-800/40 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black">!</span>
                    <div>
                      <p className="font-black text-orange-900 dark:text-orange-200">Kritik Stok Uyarısı</p>
                      <p className="text-[10px] text-orange-700 dark:text-orange-400">2 ürün azaldı (Çay, Şampuan)</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300">Sipariş Ver</span>
                </div>
              </div>

              {/* Hızlı Başlangıç Butonu */}
              <button
                type="button"
                onClick={() => {
                  trackCtaClick('14 Gün Ücretsiz Canlı Dene', 'landing_hero_mockup');
                  trackDemoStart('landing_hero_mockup');
                  onRegister();
                }}
                className="mt-4 w-full py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-white" />
                14 Gün Ücretsiz Canlı Dene (Kredi Kartsız)
              </button>
            </div>

            {/* Mobil Uygulama Görsel Önizlemesi (LCP WebP Preload ile Eşleşir) */}
            <div className="mt-4 flex items-center gap-3.5 rounded-2xl bg-white/95 dark:bg-stone-900/95 border border-stone-200/90 dark:border-stone-800 p-3 shadow-lg">
              <picture className="shrink-0">
                <source srcSet="/brand/phone_mockup_retina.webp" type="image/webp" />
                <img
                  src="/brand/phone_mockup_retina.png"
                  alt="Dükkânım Yanımda mobil esnaf kasa, veresiye defteri ve randevu uygulaması ekranı"
                  width={580}
                  height={900}
                  fetchPriority="high"
                  decoding="async"
                  className="w-16 h-24 sm:w-20 sm:h-28 object-contain rounded-xl bg-stone-50 dark:bg-stone-800 p-1"
                />
              </picture>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  CEPTE TAM KONTROL
                </p>
                <p className="text-xs sm:text-sm font-black text-stone-900 dark:text-white leading-snug mt-0.5">
                  Android, iPhone ve Masaüstünde Anlık Senkronizasyon
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-1">
                  Tezgahta tablet, cebinizde telefon: tüm veresiye ve kasa hareketleri aynı saniyede güncellenir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRİK ŞERİDİ (Gerçek Veriden Beslenir) */}
      <section className="border-y border-stone-200/70 dark:border-stone-800/80 bg-white/70 dark:bg-stone-900/50 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-black text-orange-600 dark:text-orange-400">{stats.shopsLabel}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">Aktif Esnaf &amp; Dükkan</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#0F172A] dark:text-white">{stats.trackedVolume}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">Aylık Takip Edilen Kasa / Ciro</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">{stats.price}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">Kurulum &amp; Donanım Ücreti</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-orange-600 dark:text-orange-400">{stats.setupTime}</p>
            <p className="mt-1 text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">Hazır Olma Süresi</p>
          </div>
        </div>
      </section>

      {/* BENTO GRID ÖZELLİKLER */}
      <section id="ozellikler" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            HER ŞEY TEK YERDE
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
            Esnafın İhtiyacı Olan Her Şey, Fazlası Yok.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-500 dark:text-stone-400 font-medium">
            Karmaşık muhasebe programlarını unutun. Esnaf diliyle, tek elle kullanılabilecek sadelikte tasarlandı.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {BENTO_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.tag}
                className="group relative p-7 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-48 h-48 bg-linear-to-br ${feat.color} rounded-bl-full pointer-events-none transition-transform group-hover:scale-110`} />

                <div className="flex items-center justify-between">
                  <span className={`w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 ${feat.accent} flex items-center justify-center shadow-xs`}>
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700">
                    {feat.badgeText}
                  </span>
                </div>

                <div className="mt-6">
                  <span className="text-[11px] font-black tracking-wider uppercase text-orange-600 dark:text-orange-400">
                    {feat.tag}
                  </span>
                  <h3 className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="mt-3 text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SEKTÖREL ÇÖZÜMLER (İNTERAKTİF TABLAR) */}
      <section id="sektorler" className="bg-stone-100/70 dark:bg-stone-900/40 border-y border-stone-200/80 dark:border-stone-800/80 py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              SEKTÖRE ÖZEL UYARLANABİLİR
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
              Dükkanınızın Türüne Göre Şekillenir
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-500 dark:text-stone-400 font-medium">
              Sektörünüzü seçin; panel o işin gerektirdiği ekranlarla açılsın.
            </p>
          </div>

          {/* Sektör Butonları */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {SECTOR_DATA.map((s) => {
              const Icon = s.icon;
              const isSelected = selectedSector === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSector(s.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-orange-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {s.title}
                </button>
              );
            })}
          </div>

          {/* Seçili Sektör Detay Kartı */}
          <div className="mt-10 max-w-4xl mx-auto bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-7 sm:p-10 shadow-xl grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 text-xs font-black">
                {currentSector.badge}
              </span>
              <h3 className="mt-3 text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
                {currentSector.title} Modülü
              </h3>
              <p className="mt-1 text-sm font-bold text-orange-600 dark:text-orange-400">
                {currentSector.tagline}
              </p>
              <p className="mt-3 text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                {currentSector.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    trackCtaClick(`Bu Sektörle Başla: ${currentSector.title}`, 'landing_sectors');
                    trackDemoStart(`sector_${currentSector.id}`);
                    onRegister();
                  }}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  Bu Sektörle Başla <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href={currentSector.href}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 border border-orange-200/80 dark:border-orange-800/50 transition-colors"
                >
                  Sayfasını İncele <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-700/70 bg-stone-100 dark:bg-stone-800">
                <img
                  src={currentSector.image}
                  alt={`${currentSector.title} dijital yönetim ve kasa modülü önizlemesi — Dükkânım Yanımda`}
                  width={1200}
                  height={630}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-40 object-cover"
                />
              </div>
              <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-5 rounded-2xl border border-stone-200/60 dark:border-stone-700/60">
                <p className="text-xs font-black uppercase tracking-wider text-stone-400">Öne Çıkan Özellikler</p>
                {currentSector.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-3 text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    {h}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NASIL ÇALIŞIR (3 ADIM) */}
      <section id="nasil-calisir" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            KOLAY VE HIZLI
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
            3 Kolay Adımda Dükkanını Aç
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-500 dark:text-stone-400 font-medium">
            Eğitim, kılavuz veya teknik kurulum yok. Anneye anlatır gibi sade.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Telefonunla Kaydol',
              desc: 'Telefon numaranı gir, şifreni belirle. Kredi kartı veya evrak yok.',
            },
            {
              step: '02',
              title: 'Dükkan Türünü Seç',
              desc: 'Kuaför, berber, güzellik salonu veya kafe/restoran. Panel otomatik sana göre ayarlansın.',
            },
            {
              step: '03',
              title: 'İşlemleri Gir, Akşam Rahat Et',
              desc: 'Müşterini ekle, satışı kaydet, akşam tek tuşla gün sonunu kapat.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs text-center"
            >
              <span className="text-5xl font-black text-orange-500/20 dark:text-orange-500/30 block mb-2">
                {item.step}
              </span>
              <h3 className="text-lg font-black text-stone-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TÜRKİYE ESNAF İLETİŞİM AĞI & CANLI HARİTA (LAZY LOADED - ZERO CLS & FCP KORUMA) */}
      <LazyMapSection />

      {/* İŞLETMEYE ÖZEL VIP PANEL & ŞEFFAF FİYATLANDIRMA */}
      <section id="vip" className="bg-stone-100/70 dark:bg-stone-900/40 border-y border-stone-200/80 dark:border-stone-800/80 py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 text-[11px] font-black uppercase tracking-widest border border-orange-500/20">
              <Crown className="w-3.5 h-3.5 text-orange-500" />
              İŞLETMEYE ÖZEL GELİŞTİRME &amp; VIP
            </span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-white">
              İşletmenize Özel Panel Üretimi
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium max-w-2xl mx-auto">
              Standart kalıplara sıkışmayın. Dükkanınızın tam ihtiyacı olan ekranları, butonları, özel fişleri ve donanım bağlantılarını <strong className="text-stone-900 dark:text-white font-black">birebir size özel kodluyoruz</strong>.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {/* 1. KART: ÇIRAK PAKETİ (0 TL) */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-400">Başlangıç</span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    Sonsuza Dek ₺0
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-black text-stone-900 dark:text-white">Çırak Paketi</h3>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-medium">
                  Yeni tanışan esnaf için temel dijital defter ve kasa.
                </p>

                <div className="mt-5 pb-5 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-stone-900 dark:text-white">₺0</span>
                    <span className="text-xs font-bold text-stone-500">/ sonsuza dek</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Kredi kartı veya taahhüt gerekmez
                  </p>
                </div>

                <div className="mt-5 space-y-2.5">
                  {[
                    '25 Müşteri & Veresiye Cari Kotası',
                    '3 Masa / Tek Koltuk Takibi',
                    'Ayda 20 Online Randevu Hakkı',
                    'WhatsApp ile Kibar Borç Hatırlatma',
                    'Temel Kasa & Günlük Ciro Takibi',
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-200">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    trackCtaClick('Çırak Paketi - Ücretsiz Başla', 'landing_pricing');
                    trackDemoStart('pricing_cirak');
                    onRegister();
                  }}
                  className="w-full py-3 px-4 rounded-xl text-sm font-black text-stone-800 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Ücretsiz Başla
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. KART: USTA PAKETİ (₺249 / AY) */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-stone-900 border-2 border-amber-400/80 dark:border-amber-700 shadow-md flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Tek Koltuk</span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    Bütçe Dostu Profesyonel
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-black text-stone-900 dark:text-white">Usta Paketi</h3>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-medium">
                  Tek koltuklu berber, kuaför, güzellik uzmanı ve butik kafeler için.
                </p>

                <div className="mt-5 pb-5 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-4xl font-black text-stone-900 dark:text-white">₺249</span>
                    <span className="text-xs font-bold text-stone-500">/ ay</span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      Yıllık ₺2.490
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    ✓ Tek çalışan işletmeler için tam dijital otomasyon
                  </p>
                </div>

                <div className="mt-5 space-y-2.5">
                  {[
                    '100 Müşteri & Veresiye Cari Kotası',
                    'Ayda 60 Online Randevu Hakkı',
                    'Tek Koltuk Dijital Randevu Takvimi',
                    'Fotoğraftan Fiyat Tarifesi Okuyucu (AI OCR)',
                    'Gelir, Gider ve Günlük Kasa Takibi',
                    'Cihazdan Hızlı SMS & WhatsApp Şablonları',
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-100">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    trackCtaClick('Usta Paketine Geç', 'landing_pricing');
                    onRegister();
                  }}
                  className="w-full py-3 px-4 rounded-xl text-sm font-black text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Usta Paketine Geç
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3. KART: PATRON VIP PANEL (₺499 / AY) */}
            <div className="relative p-6 sm:p-7 rounded-3xl bg-linear-to-b from-orange-500/5 via-white to-orange-500/10 dark:from-stone-900 dark:via-stone-900 dark:to-orange-950/20 border-2 border-orange-500/80 shadow-xl flex flex-col justify-between transition-all">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-orange-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-orange-500/30 flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5" />
                ★ EN ÇOK TERCİH EDİLEN KURUMSAL PAKET
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Ekip &amp; Salon</span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-orange-500/15 text-orange-800 dark:text-orange-300 border border-orange-500/30">
                    Özel Yazılımcı Dahil
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                  Patron VIP
                  <Crown className="w-5 h-5 text-orange-500" />
                </h3>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-medium">
                  2+ personelli salonlar, kafeler ve büyüyen işletmeler için.
                </p>

                <div className="mt-5 pb-5 border-b border-orange-200/60 dark:border-orange-800/40">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-4xl font-black text-stone-900 dark:text-white">₺499</span>
                    <span className="text-xs font-bold text-stone-500">/ ay</span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Yıllık ₺4.990 (2 Ay Hediye)
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-orange-700 dark:text-orange-400">
                    ✓ Çoklu personel yönetimi &amp; işletmeye özel yazılım desteği
                  </p>
                </div>

                <div className="mt-5 space-y-2.5">
                  {[
                    'SINIRSIZ Müşteri, Cari ve Online Randevu',
                    'Çoklu Usta & Otomatik Koltuk Prim Dağılımı',
                    'QR Menü + Canlı Garson Çağır & Hesap İste',
                    'Termal Fiş (58/80mm) & Barkodlu Terazi Desteği',
                    '"Dükkânım Yanımda" Marka Bandını Kaldırma',
                    'DÜKKANINIZA ÖZEL YAZILIM PANELİ KODLAMA',
                    '7/24 Öncelikli Telefon & Mühendis Destek Hattı',
                  ].map((feat, idx) => (
                    <div key={feat} className={`flex items-center gap-2 text-xs font-bold ${idx === 5 ? 'text-orange-900 dark:text-orange-200' : 'text-stone-800 dark:text-stone-100'}`}>
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-orange-200/60 dark:border-orange-800/40">
                <button
                  type="button"
                  onClick={() => {
                    trackCtaClick('Patron VIP Başlat — ₺499', 'landing_pricing');
                    onRegister();
                  }}
                  className="w-full py-3 px-4 rounded-xl text-sm font-black text-white bg-linear-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:to-orange-800 shadow-lg shadow-orange-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4 text-yellow-200" />
                  Patron VIP Başlat — ₺499
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIKÇA SORULAN SORULAR */}
      <section id="sss" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            MERAK EDİLENLER
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
            Sıkça Sorulan Sorular
          </h2>
        </div>

        <div className="mt-10 space-y-3.5">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs open:shadow-md transition-all"
            >
              <summary className="flex items-center justify-between gap-3 text-sm sm:text-base font-black text-stone-900 dark:text-white cursor-pointer list-none">
                <span>{faq.q}</span>
                <ChevronDown className="w-5 h-5 text-stone-400 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ESNAF BLOGU'NDAN ÖNE ÇIKAN REHBERLER */}
      <section id="blog-vitrin" className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-14 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              <BookOpen className="w-3.5 h-3.5" /> ESNAF BİLGİ MERKEZİ
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
              Esnaf Blogu&apos;ndan Öne Çıkan Rehberler
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 font-medium max-w-2xl">
              Veresiye tahsilatından berber randevu düzenine, gün sonu kasa kapatmadan QR menü kurulumuna kadar sahadan pratik yazılar.
            </p>
          </div>
          <a
            href="/blog"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs sm:text-sm font-black hover:opacity-90 transition-opacity shrink-0 self-start sm:self-auto"
          >
            Tüm Yazıları Gör ({BLOG_ARTICLES.length}) <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_ARTICLES.slice(0, 6).map((article) => (
            <a
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[1200/630] bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <img
                    src={article.ogImage}
                    alt={`${article.title} — Dükkânım Yanımda Esnaf Blogu`}
                    width={1200}
                    height={630}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                    <span>{article.category}</span>
                    <span className="text-stone-400 font-bold">{article.readTime}</span>
                  </div>
                  <h3 className="mt-2 text-base font-black text-stone-900 dark:text-white group-hover:text-orange-600 transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 font-medium line-clamp-2 leading-relaxed">
                    {article.description}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-4 pt-1 flex items-center gap-1.5 text-xs font-black text-orange-600 dark:text-orange-400">
                <span>Rehberi Oku</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* HIZLI KEŞİF: ÇÖZÜMLER, SEKTÖRLER & YEREL REHBERLER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-100 dark:border-stone-800">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                HIZLI KEŞİF &amp; ÇÖZÜMLER
              </span>
              <h2 className="mt-1 text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                İşletmenize Uygun Modülü ve Şehir Rehberini Seçin
              </h2>
            </div>
            <a
              href="/rehber"
              className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:text-orange-700"
            >
              Ücretsiz Prim &amp; QR Araçları <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-6 text-xs">
            <div>
              <p className="font-black uppercase tracking-wider text-stone-400 mb-3">Kuaför, Berber &amp; Güzellik</p>
              <ul className="space-y-2 font-bold text-stone-700 dark:text-stone-300">
                <li><a href="/berber" className="hover:text-orange-600 transition-colors">Berber Randevu ve Koltuk Sistemi</a></li>
                <li><a href="/kuafor" className="hover:text-orange-600 transition-colors">Kuaför Salonu &amp; Prim Programı</a></li>
                <li><a href="/guzellik-salonu" className="hover:text-orange-600 transition-colors">Güzellik Salonu Seans &amp; Paket Takibi</a></li>
                <li><a href="/randevu-sistemi" className="hover:text-orange-600 transition-colors">%0 Komisyonlu Online Randevu Sistemi</a></li>
              </ul>
            </div>

            <div>
              <p className="font-black uppercase tracking-wider text-stone-400 mb-3">Kafe, Restoran &amp; Ortak Kasa</p>
              <ul className="space-y-2 font-bold text-stone-700 dark:text-stone-300">
                <li><a href="/kafe-restoran" className="hover:text-orange-600 transition-colors">Kafe &amp; Restoran Masa Adisyonu</a></li>
                <li><a href="/qr-menu" className="hover:text-orange-600 transition-colors">Ücretsiz Fotoğraflı QR Menü Sistemi</a></li>
                <li><a href="/kasa-programi" className="hover:text-orange-600 transition-colors">Kasa Programı (Nakit, POS, Havale)</a></li>
                <li><a href="/gun-sonu-raporu" className="hover:text-orange-600 transition-colors">30 Saniyede Gün Sonu Raporu</a></li>
                <li><a href="/veresiye-defteri" className="hover:text-orange-600 transition-colors">Dijital Veresiye Defteri &amp; Cari Takip</a></li>
              </ul>
            </div>

            <div>
              <p className="font-black uppercase tracking-wider text-stone-400 mb-3">Yerel Çözümler &amp; Bilgi Merkezi</p>
              <ul className="space-y-2 font-bold text-stone-700 dark:text-stone-300">
                <li><a href="/izmit-berber-randevu" className="inline-flex items-center gap-1 hover:text-orange-600 transition-colors"><MapPin className="w-3.5 h-3.5 text-orange-500" /> İzmit &amp; Kocaeli Berber Randevu</a></li>
                <li><a href="/zonguldak-berber-randevu" className="inline-flex items-center gap-1 hover:text-orange-600 transition-colors"><MapPin className="w-3.5 h-3.5 text-orange-500" /> Zonguldak &amp; Ereğli Berber Randevu</a></li>
                <li><a href="/rehber" className="inline-flex items-center gap-1 hover:text-orange-600 transition-colors"><Calendar className="w-3.5 h-3.5 text-orange-500" /> Ücretsiz Prim &amp; QR Araçları</a></li>
                <li><a href="/blog" className="inline-flex items-center gap-1 hover:text-orange-600 transition-colors"><BookOpen className="w-3.5 h-3.5 text-orange-500" /> Esnaf Blogu ({BLOG_ARTICLES.length} Kapsamlı Rehber)</a></li>
                <li><a href="/fiyat" className="hover:text-orange-600 transition-colors">Şeffaf Paketler &amp; VIP Fiyatlandırma</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL DÖNÜŞÜM ÇAĞRISI (CTA) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative rounded-3xl bg-[#0F172A] text-white p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          {/* Altın Işık Hüzmesi */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(800px 350px at 50% 0%, rgba(245,158,11,0.30), transparent 70%)',
            }}
          />

          <div className="relative max-w-2xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-black border border-orange-500/30">
              <Sparkles className="w-3.5 h-3.5" /> 2 DAKİKADA BAŞLA
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Bugün Başla,<br />
              <span className="text-orange-400">Yarın Akşam Rahat Uyu.</span>
            </h2>
            <p className="text-stone-300 text-sm sm:text-base font-medium">
              Eski kağıt defterin sayfaları arasında kaybolmayın. Dükkanınızı hemen ücretsiz olarak dijitale taşıyın.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  trackCtaClick('14 Gün Ücretsiz Başla', 'landing_final_cta');
                  trackDemoStart('landing_final_cta');
                  onRegister();
                }}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-black text-[#0F172A] bg-orange-400 hover:bg-orange-300 transition-colors shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                14 Gün Ücretsiz Başla
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  trackCtaClick('Dükkanıma Giriş Yap', 'landing_final_cta');
                  onLogin();
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-white bg-white/10 hover:bg-white/20 transition-colors border border-white/20 cursor-pointer"
              >
                <LogIn className="w-5 h-5 text-orange-400" />
                Dükkanıma Giriş Yap
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 flex flex-col items-center gap-6 text-xs text-stone-500 dark:text-stone-400 font-semibold">
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 max-w-5xl">
            <a href="/kayit" className="hover:text-orange-600 transition-colors">Ücretsiz Kayıt</a>
            <a href="/fiyat" className="hover:text-orange-600 transition-colors">Fiyatlar</a>
            <a href="/blog" className="hover:text-orange-600 transition-colors">Blog</a>
            <a href="/rehber" className="hover:text-orange-600 transition-colors">Esnaf Rehberi</a>
            <a href="/veresiye-defteri" className="hover:text-orange-600 transition-colors">Veresiye Defteri</a>
            <a href="/kasa-programi" className="hover:text-orange-600 transition-colors">Kasa Programı</a>
            <a href="/gun-sonu-raporu" className="hover:text-orange-600 transition-colors">Gün Sonu Raporu</a>
            <a href="/qr-menu" className="hover:text-orange-600 transition-colors">QR Menü</a>
            <a href="/randevu-sistemi" className="hover:text-orange-600 transition-colors">Randevu Sistemi</a>
            <a href="/berber" className="hover:text-orange-600 transition-colors">Berber</a>
            <a href="/kuafor" className="hover:text-orange-600 transition-colors">Kuaför</a>
            <a href="/guzellik-salonu" className="hover:text-orange-600 transition-colors">Güzellik Salonu</a>
            <a href="/kafe-restoran" className="hover:text-orange-600 transition-colors">Kafe &amp; Restoran</a>
            <a href="/izmit-berber-randevu" className="hover:text-orange-600 transition-colors">İzmit Berber</a>
            <a href="/zonguldak-berber-randevu" className="hover:text-orange-600 transition-colors">Zonguldak Berber</a>
            <a href="/iletisim" className="hover:text-orange-600 transition-colors">İletişim</a>
            <a href="/gizlilik" className="hover:text-orange-600 transition-colors">Gizlilik &amp; KVKK</a>
          </nav>

          <a
            href="https://www.instagram.com/dukkanimyanimdatr/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/25 text-xs font-bold transition-all shadow-xs"
          >
            <Instagram className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>@dukkanimyanimdatr</span>
          </a>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-6 border-t border-stone-200/70 dark:border-stone-800">
            <picture>
              <source srcSet="/brand/logo-horizontal.webp" type="image/webp" />
              <img
                src="/brand/logo-horizontal.png"
                alt="Dükkânım Yanımda — Türkiye Esnaf ve KOBİ Yönetim Platformu logosu"
                width={160}
                height={53}
                loading="lazy"
                decoding="async"
                className="h-9 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </picture>
            <p>© 2026 Dükkânım Yanımda · Türkiye Esnaf ve KOBİ'leri İçin Özel Geliştirildi</p>
          </div>
        </footer>
      </section>
    </div>
  );
};
