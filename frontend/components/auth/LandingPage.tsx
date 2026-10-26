import React, { useState } from 'react';
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
} from 'lucide-react';
import logoRaw from '../../public/brand/logo-dukkanim.svg?raw';
import { useForceLightTheme } from '../../hooks/useForceLightTheme';
import { demoLogin } from '../../utils/demo';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

interface SectorInfo {
  id: string;
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
    icon: Scissors,
    title: 'Berber & Kuaför',
    tagline: 'Koltuk sırası, usta primi ve randevu takibi cebinde',
    description: 'Müşteri randevuları karışmasın, usta ve kalfa primleri kuruşu kuruşuna hesaplansın. Gün sonunda hangi koltuk ne kazandırdı anında gör.',
    badge: 'Koltuk & Randevu',
    highlights: ['Randevu & Koltuk Takvimi', 'Usta & Kalfa Prim Dağılımı', 'Müşteri Saç/Sakal Bakım Notları', 'Hızlı Kasa Tahsilatı'],
  },
  {
    id: 'kafe',
    icon: UtensilsCrossed,
    title: 'Kafe & Restoran',
    tagline: 'Masa adisyonları, açık hesaplar ve hızlı fiş',
    description: 'Açık masaları tek dokunuşla yönet. Masaya sipariş ekle, parçalı ödeme al veya hesabı anında kapat. Karmaşık POS cihazlarına servet ödeme.',
    badge: 'Masa & QR Menü',
    highlights: ['Masalara Özel Fotoğraflı QR Menü', 'Canlı Masa & Adisyon Takibi', 'Nakit / Kart / Açık Hesap Kapatma', 'Garson & Hesap Çağrı Zili'],
  },
  {
    id: 'bakkal',
    icon: ShoppingCart,
    title: 'Bakkal & Market',
    tagline: 'Kamera ile barkod okuma, tezgah satışı ve veresiye',
    description: 'Ekstra barkod okuyucu almana gerek yok, telefon kameranla ürünleri biplet. Mahallelinin veresiye defterini tek dokunuşla kaydet.',
    badge: 'Hızlı Tezgah',
    highlights: ['Kamerayla Anında Barkod Okuma', 'Veresiye Defteri & Cari Hesap', 'Kritik Stok Azalma Uyarısı', 'Sepet Fişi & Para Üstü Hesabı'],
  },
  {
    id: 'servis',
    icon: Wrench,
    title: 'Teknik Servis',
    tagline: 'Cihaz kabul fişi, parça maliyeti ve durum SMS/WhatsApp',
    description: 'Tamire gelen telefonu, bilgisayarı veya beyaz eşyayı kabul fişiyle sisteme işle. Müşteriye tamir bittiğinde tek tuşla hazır mesajı gönder.',
    badge: 'Servis & Arıza Fişi',
    highlights: ['Cihaz Kabul & Takip Numarası', 'Yedek Parça Maliyeti & İşçilik', 'WhatsApp ile Hazır Bildirimi', 'Garanti & Teslimat Takibi'],
  },
  {
    id: 'terzi',
    icon: Shirt,
    title: 'Terzi & Kuru Temizleme',
    tagline: 'Emanet fişi, tadilat durumu ve teslimat tarihi',
    description: 'Paça boyu, daraltma veya kuru temizleme teslim gününü unutma. Müşteri ölçülerini ve alınan kaporaları tek kartta tut.',
    badge: 'Emanet & Tadilat',
    highlights: ['Tadilat Teslimat Tarihi', 'Kapora & Kalan Bakiye Takibi', 'Beden ve Ölçü Notları', 'Teslimat Hazır Bildirimi'],
  },
  {
    id: 'diger',
    icon: Store,
    title: 'Tüm Esnaf & Hizmet',
    tagline: 'Kasa akışı, alacak-borç dengesi ve günlük özet',
    description: 'Nalbur, kırtasiye, manav, çiçekçi veya oto yıkama. Dükkanının büyüklüğü ne olursa olsun paran nerede, ne zaman ödenecek her an cebinde.',
    badge: 'Esnaf İşletim Sistemi',
    highlights: ['Gün Sonu Kasa Denkleştirme', 'Müşteri & Tedarikçi Carisi', 'Mobil Uyumlu PWA', 'Bulut Yedekleme'],
  },
];

const BENTO_FEATURES = [
  {
    icon: BookUser,
    tag: 'VERESİYE & CARİ',
    title: 'Defterdeki Sayfalar Yırtılmaz, Borçlar Asla Unutulmaz',
    description: 'Müşterilerine tek dokunuşla cari kart aç. Kim ne zaman ne aldı, kaç para borcu kaldı anlık gör. Tek tıkla WhatsApp’tan kibar bakiye hatırlatması yolla.',
    badgeText: 'Tahsilat Hızı +%40',
    color: 'from-amber-500/10 to-amber-500/5',
    accent: 'text-amber-600',
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
    a: 'Evet! Hemen 1 dakikada telefon numaranızla kayıt olarak Kasa, Veresiye, Stok ve Müşteri Defteri gibi tüm temel özellikleri ücretsiz kullanabilirsiniz. Dükkanınıza özel terzi usulü ekran ve modül isterseniz de çok uygun fiyatlı VIP Özel Panel paketimizden faydalanabilirsiniz.',
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
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('berber');

  const handleDemo = async () => {
    setDemoLoading(true);
    setDemoError(null);
    const err = await demoLogin();
    if (err) {
      setDemoError(err);
      setDemoLoading(false);
    }
  };

  const currentSector = SECTOR_DATA.find((s) => s.id === selectedSector) || SECTOR_DATA[0];

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0B0F17] text-[#0F172A] dark:text-[#F8FAFC] font-sans scroll-smooth selection:bg-amber-500/25 selection:text-amber-900 transition-colors">
      {/* Üst Navigasyon Çubuğu */}
      <header className="sticky top-0 z-50 border-b border-stone-200/80 dark:border-stone-800/80 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-[165px] sm:w-[190px] select-none cursor-pointer transition-transform hover:scale-[1.02] [&>svg]:w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: logoRaw }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="Dükkânım Yanımda - Esnaf Portalı"
            />
          </div>

          {/* Menü Linkleri */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-bold text-stone-600 dark:text-stone-300">
            <a href="#ozellikler" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Özellikler</a>
            <a href="#sektorler" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Sektörler</a>
            <a href="#nasil-calisir" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Nasıl Çalışır</a>
            <a href="#vip" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-all">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>VIP Panel &amp; Fiyatlar</span>
            </a>
            <a href="#sss" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">SSS</a>
          </nav>

          {/* Aksiyon Butonları */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDemo}
              disabled={demoLoading}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100/70 hover:bg-amber-200/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 transition-all border border-amber-300/40 cursor-pointer"
              title="Şifresiz doğrudan demo hesaba gir"
            >
              {demoLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
              )}
              Hızlı Demo
            </button>

            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-stone-700"
            >
              <LogIn className="w-4 h-4 text-stone-500" /> Giriş
            </button>

            <button
              type="button"
              onClick={onRegister}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-linear-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              Ücretsiz Başla
              <ArrowRight className="w-4 h-4" />
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-stone-900 border border-amber-300/80 dark:border-amber-700/50 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-[11px] sm:text-xs font-black tracking-wide text-amber-800 dark:text-amber-300 uppercase">
                TÜRKİYE'NİN İLK YENİ NESİL ESNAF İŞLETİM SİSTEMİ
              </span>
            </div>

            {/* Ana Başlık */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-[#0F172A] dark:text-white">
              Defteri Kapat,<br />
              <span className="bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 bg-clip-text text-transparent">
                Dükkânını Cebine Al.
              </span>
            </h1>

            {/* Açıklama */}
            <p className="text-base sm:text-xl text-stone-600 dark:text-stone-300 font-medium leading-relaxed max-w-2xl">
              Kasa, veresiye, stok ve gün sonu tek ekranda. Kağıt defteri tarihe gömün;
              WhatsApp alacak hatırlatması ve akıllı kasa denkleştirmeyle dükkanınızı
              <strong className="text-stone-900 dark:text-white font-black"> 2 dakikada </strong>
              dijitale taşıyın.
            </p>

            {/* Aksiyon Grubu */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                type="button"
                onClick={onRegister}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-black text-white bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/40 active:scale-98 transition-all cursor-pointer"
              >
                Hemen Ücretsiz Başla
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleDemo}
                disabled={demoLoading}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-bold text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                {demoLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                ) : (
                  <PlayCircle className="w-5 h-5 text-amber-500" />
                )}
                {demoLoading ? 'Demo Hazırlanıyor…' : 'Canlı Demoyu Aç (Şifresiz)'}
              </button>
            </div>

            {demoError && (
              <p className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                ⚠️ {demoError}
              </p>
            )}

            {/* Güven Rozetleri */}
            <div className="pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-500" /> Kredi Kartı İstemez
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> 2 Dakikada Kurulum
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> %100 Şifreli Bulut
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-500" /> Telefona & Tablete Uyumlu
              </span>
            </div>
          </div>

          {/* Sağ Kolon: Modern SaaS Dashboard Mockup */}
          <div className="lg:col-span-5 relative">
            {/* Arka plan ambient halo */}
            <div className="absolute -inset-2 bg-linear-to-r from-amber-400/20 to-amber-600/20 rounded-3xl blur-2xl opacity-70 pointer-events-none" />

            <div className="relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-2xl p-5 sm:p-6 transition-all">
              {/* Sahte Pencere Başlığı */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-black text-stone-400">dukkanim-yanimda-panel</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Kasa Açık
                </span>
              </div>

              {/* Günün Kasası Kartı */}
              <div className="mt-4 p-4 rounded-2xl bg-linear-to-br from-amber-50 via-white to-amber-50/40 dark:from-stone-800/80 dark:to-stone-800/40 border border-amber-200/80 dark:border-amber-800/40">
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
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center font-black">
                      <BookUser className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-black text-stone-800 dark:text-stone-100">Mehmet Bey (Veresiye Kapama)</p>
                      <p className="text-[10px] text-stone-400">FAST / Havale ile ödendi</p>
                    </div>
                  </div>
                  <span className="font-black text-emerald-600">+₺1.200</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black">!</span>
                    <div>
                      <p className="font-black text-amber-900 dark:text-amber-200">Kritik Stok Uyarısı</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">2 ürün azaldı (Çay, Şampuan)</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Sipariş Ver</span>
                </div>
              </div>

              {/* Hızlı Demo Giriş Butonu */}
              <button
                type="button"
                onClick={handleDemo}
                disabled={demoLoading}
                className="mt-4 w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <PlayCircle className="w-4 h-4 text-amber-400" />
                Bu Paneli Canlı Test Et (Ahmet Usta Hesabı)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* METRİK ŞERİDİ */}
      <section className="border-y border-stone-200/70 dark:border-stone-800/80 bg-white/70 dark:bg-stone-900/50 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">180+</p>
            <p className="mt-1 text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">Aktif Esnaf & Dükkan</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#0F172A] dark:text-white">₺850K+</p>
            <p className="mt-1 text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">Aylık Takip Edilen Ciro</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">0 TL</p>
            <p className="mt-1 text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">Kurulum & Donanım Ücreti</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">2 Dakika</p>
            <p className="mt-1 text-xs sm:text-sm font-bold text-stone-500 dark:text-stone-400">Hazır Olma Süresi</p>
          </div>
        </div>
      </section>

      {/* BENTO GRID ÖZELLİKLER */}
      <section id="ozellikler" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
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
                  <span className="text-[11px] font-black tracking-wider uppercase text-amber-600 dark:text-amber-400">
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
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
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
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-amber-400'
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-black">
                {currentSector.badge}
              </span>
              <h3 className="mt-3 text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
                {currentSector.title} Modülü
              </h3>
              <p className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                {currentSector.tagline}
              </p>
              <p className="mt-3 text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                {currentSector.description}
              </p>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={onRegister}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  Bu Sektörle Başla <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 bg-stone-50 dark:bg-stone-800/50 p-6 rounded-2xl border border-stone-200/60 dark:border-stone-700/60">
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
      </section>

      {/* NASIL ÇALIŞIR (3 ADIM) */}
      <section id="nasil-calisir" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
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
              desc: 'Kuaför, kafe, bakkal veya tamirci. Panel otomatik sana göre ayarlansın.',
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
              <span className="text-5xl font-black text-amber-500/20 dark:text-amber-500/30 block mb-2">
                {item.step}
              </span>
              <h3 className="text-lg font-black text-stone-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* İŞLETMEYE ÖZEL VIP PANEL & ŞEFFAF FİYATLANDIRMA */}
      <section id="vip" className="bg-stone-100/70 dark:bg-stone-900/40 border-y border-stone-200/80 dark:border-stone-800/80 py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-black uppercase tracking-widest border border-amber-500/20">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              TERZİ USULÜ GELİŞTİRME &amp; VIP
            </span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-white">
              İşletmenize Özel Panel Üretimi
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium max-w-2xl mx-auto">
              Standart kalıplara sıkışmayın. Dükkanınızın tam ihtiyacı olan ekranları, butonları, özel fişleri ve donanım bağlantılarını <strong className="text-stone-900 dark:text-white font-black">birebir size özel kodluyoruz</strong>.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
            {/* 1. KART: STANDART ESNAF PAKETİ (ÜCRETSİZ) */}
            <div className="p-7 sm:p-9 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-400">Temel Sürüm</span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    Sonsuza Dek
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-black text-stone-900 dark:text-white">Standart Esnaf</h3>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-medium">
                  Hemen dükkanını cebine alıp kağıt defteri çöpe atmak isteyenler için.
                </p>

                <div className="mt-6 pb-6 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-white">₺0</span>
                    <span className="text-xs font-bold text-stone-500">/ sonsuza kadar ücretsiz</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Kredi kartı veya taahhüt gerekmez
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Neler Dahil?</p>
                  {[
                    'Kasa & Gün Sonu Denkleştirme (Nakit/Kart/Gider)',
                    'Sınırsız Veresiye Defteri & Müşteri Carisi',
                    'WhatsApp ile Tek Tıkla Kibar Borç Hatırlatması',
                    'Telefon Kamerası ile Otomatik Barkod Okutma',
                    'Temel Sektör Şablonları (Berber, Kafe, Bakkal vb.)',
                    'Mobil Uyumlu PWA & Şifreli Bulut Yedekleme',
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-200">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={onRegister}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-black text-stone-800 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Ücretsiz Başla
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. KART: İŞLETMEYE ÖZEL VIP PANEL */}
            <div className="relative p-7 sm:p-9 rounded-3xl bg-linear-to-b from-amber-500/5 via-white to-amber-500/10 dark:from-stone-900 dark:via-stone-900 dark:to-amber-950/20 border-2 border-amber-500/80 shadow-xl flex flex-col justify-between transition-all">
              {/* Üst Rozet */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-amber-500 to-amber-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-amber-500/30 flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5" />
                Dükkanınıza Özel Kodlanır
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">VIP Avantajı</span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    Öncelikli Yazılım Ekibi
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                  İşletmeye Özel Panel
                  <Crown className="w-5 h-5 text-amber-500" />
                </h3>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-medium">
                  "Şu düğme de olsun, şu fiş böyle çıksın" dediğiniz her şeyi doğrudan panelinize ekliyoruz.
                </p>

                <div className="mt-6 pb-6 border-b border-amber-200/60 dark:border-amber-800/40">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-white">₺249</span>
                    <span className="text-xs font-bold text-stone-500">/ ay</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Yıllıkta 2 Ay Hediye (₺2.490)
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    ✓ Yapay zeka botu değil, doğrudan gerçek yazılım mühendisi desteği
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">VIP Ekstra Ayrıcalıkları</p>
                  {[
                    'Standart paketteki tüm özellikler eksiksiz dahil',
                    'Dükkanınıza Özel Ekran & Modül Geliştirme (Terzi Usulü)',
                    'Özel Fiş, Servis Kabul Formu veya Fatura Tasarımı',
                    'Barkodlu Terazi, Termal Fiş Yazıcısı Entegrasyonu',
                    'Doğrudan Yazılımcı & Telefonla Öncelikli Destek Hattı',
                    'İstediğiniz Zaman Yeni Buton & Fonksiyon Talep Edebilme',
                  ].map((feat, idx) => (
                    <div key={feat} className={`flex items-center gap-2.5 text-xs sm:text-sm font-bold ${idx === 1 ? 'text-amber-900 dark:text-amber-200' : 'text-stone-800 dark:text-stone-100'}`}>
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-amber-200/60 dark:border-amber-800/40">
                <button
                  type="button"
                  onClick={onRegister}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-black text-white bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 shadow-lg shadow-amber-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4 text-yellow-200" />
                  VIP Özel Panelimi İstiyorum
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="mt-2 text-center text-[10px] text-stone-400 font-medium">
                  Kayıt sonrası panelinizdeki VIP sekmesinden dilediğiniz özellikleri iletebilirsiniz
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIKÇA SORULAN SORULAR */}
      <section id="sss" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" /> 2 DAKİKADA BAŞLA
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Bugün Başla,<br />
              <span className="text-amber-400">Yarın Akşam Rahat Uyu.</span>
            </h2>
            <p className="text-stone-300 text-sm sm:text-base font-medium">
              Eski kağıt defterin sayfaları arasında kaybolmayın. Dükkanınızı hemen ücretsiz olarak dijitale taşıyın.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={onRegister}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-black text-[#0F172A] bg-amber-400 hover:bg-amber-300 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Ücretsiz Hesap Aç
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleDemo}
                disabled={demoLoading}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-white bg-white/10 hover:bg-white/20 transition-colors border border-white/20 cursor-pointer"
              >
                {demoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5 text-amber-400" />}
                Canlı Demoyu Aç
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 flex flex-col items-center gap-6 text-xs text-stone-500 dark:text-stone-400 font-semibold">
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="/kayit" className="hover:text-amber-600 transition-colors">Ücretsiz Kayıt</a>
            <a href="/berber" className="hover:text-amber-600 transition-colors">Berber &amp; Kuaför</a>
            <a href="/kafe-restoran" className="hover:text-amber-600 transition-colors">Kafe &amp; Restoran</a>
            <a href="/bakkal-market" className="hover:text-amber-600 transition-colors">Bakkal &amp; Market</a>
            <a href="/teknik-servis" className="hover:text-amber-600 transition-colors">Teknik Servis</a>
            <a href="/iletisim" className="hover:text-amber-600 transition-colors">İletişim</a>
            <a href="/gizlilik" className="hover:text-amber-600 transition-colors">Gizlilik &amp; KVKK</a>
          </nav>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-6 border-t border-stone-200/70 dark:border-stone-800">
            <div
              className="w-[140px] select-none opacity-85 hover:opacity-100 transition-opacity [&>svg]:w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: logoRaw }}
            />
            <p>© 2026 Dükkânım Yanımda · Türkiye Esnaf ve KOBİ'leri İçin Özel Geliştirildi</p>
          </div>
        </footer>
      </section>
    </div>
  );
};
