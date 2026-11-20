import React, { useState, useEffect } from 'react';
import {
  Star,
  Check,
  ShieldCheck,
  Sparkles,
  Smartphone,
  ChevronDown,
  ArrowRight,
  MessageCircle,
  Calendar,
  Clock,
  ExternalLink,
  Users,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  Calculator,
  QrCode,
  Copy,
  BookOpen,
  MapPin,
  ChevronRight,
  Search,
  Clock as ClockIcon,
  FileWarning,
  Home,
  ArrowLeft,
  CheckCheck,
  Tag,
} from 'lucide-react';
import logoRaw from '../../public/brand/logo-dukkanim.svg?raw';
import { trackCtaClick, trackPageView } from '../../utils/analytics';
import {
  SEO_LANDING_PAGES,
  resolveLandingContentKey,
  type LandingPageKey,
} from '../../../shared/seoLandingContent.ts';
import {
  BLOG_ARTICLES,
  findBlogArticle,
  type BlogArticle,
} from '../../../shared/blogArticles.ts';

// İletişim e-postası tek noktada. Değişirse sadece burası güncellenir.
export const CONTACT_EMAIL = 'support@dukkanimyanimda.com.tr';
const CONTACT_MAILTO = 'mailto:support@dukkanimyanimda.com.tr';

export type PublicRouteKey =
  | 'gizlilik'
  | 'iletisim'
  | 'kayit'
  | 'fiyat'
  | 'berber'
  | 'guzellik-salonu'
  | 'kafe-restoran'
  | 'bakkal-market'
  | 'veresiye-defteri'
  | 'kasa-programi'
  | 'gun-sonu-raporu'
  | 'qr-menu'
  | 'teknik-servis'
  | 'hukuk'
  | 'terzi'
  | 'rehber'
  | 'blog';

/** URL yolunu herkese açık sayfa anahtarına çevirir. Eşleşmezse null. */
export function matchPublicRoute(pathname: string): PublicRouteKey | null {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const key = clean.startsWith('/') ? clean.slice(1) : clean;
  if (key === 'rehber' || key.startsWith('rehber/')) {
    return 'rehber';
  }
  if (key === 'blog' || key.startsWith('blog/')) {
    return 'blog';
  }
  switch (key) {
    case 'gizlilik':
    case 'gizlilik-politikasi':
      return 'gizlilik';
    case 'iletisim':
      return 'iletisim';
    case 'kayit':
      return 'kayit';
    case 'fiyat':
    case 'fiyatlandirma':
      return 'fiyat';
    case 'berber':
    case 'berber-randevu-programi':
    case 'berber-randevu':
    case 'erkek-kuafor':
    case 'kuafor':
    case 'kuafor-randevu':
    case 'kadin-kuafor':
    case 'kuafor-programi':
    case 'randevu-sistemi':
    case 'online-randevu':
    case 'randevu-programi':
    case 'izmit-berber-randevu':
    case 'izmit-berber':
    case 'kocaeli-berber':
    case 'kocaeli-berber-randevu':
    case 'zonguldak-berber-randevu':
    case 'zonguldak-berber':
    case 'eregli-berber':
    case 'kdz-eregli-berber':
    case 'eregli-berber-randevu':
      return 'berber';
    case 'guzellik-salonu':
    case 'guzellik-merkezi':
    case 'guzellik':
    case 'lazer-epilasyon':
    case 'guzellik-salonu-programi':
      return 'guzellik-salonu';
    case 'kafe-restoran':
    case 'kafe':
    case 'restoran':
    case 'adisyon':
    case 'adisyon-programi':
      return 'kafe-restoran';
    case 'bakkal-market':
    case 'bakkal':
    case 'market':
    case 'pos-sistemi':
    case 'barkod-pos':
      return 'bakkal-market';
    case 'veresiye-defteri':
    case 'veresiye':
    case 'dijital-veresiye':
    case 'veresiye-programi':
      return 'veresiye-defteri';
    case 'kasa-programi':
    case 'kasa-takibi':
    case 'esnaf-kasa':
      return 'kasa-programi';
    case 'gun-sonu-raporu':
    case 'gun-sonu':
    case 'z-raporu':
      return 'gun-sonu-raporu';
    case 'qr-menu':
    case 'dijital-menu':
    case 'karekod-menu':
    case 'ucretsiz-qr-menu':
      return 'qr-menu';
    case 'teknik-servis':
    case 'servis':
      return 'teknik-servis';
    case 'hukuk':
    case 'avukat':
      return 'hukuk';
    case 'terzi':
      return 'terzi';
    default:
      return null;
  }
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ShellProps {
  title: string;
  breadcrumbTitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  onHome: () => void;
  onLogin: () => void;
  onRegister: () => void;
  children: React.ReactNode;
  ctaTitle?: string;
  ctaText?: string;
  ctaButton?: string;
  ctaHref?: string;
}

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/berber', label: 'Berber' },
  { href: '/veresiye-defteri', label: 'Veresiye' },
  { href: '/kasa-programi', label: 'Kasa' },
  { href: '/qr-menu', label: 'QR Menü' },
  { href: '/blog', label: 'Blog' },
  { href: '/rehber', label: 'Rehber' },
  { href: '/fiyat', label: 'Fiyatlar' },
];

const FOOTER_HUB_GROUPS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: 'Randevu & Salon',
    links: [
      { href: '/berber', label: 'Berber Randevu Sistemi' },
      { href: '/kuafor', label: 'Kuaför Salonu Programı' },
      { href: '/guzellik-salonu', label: 'Güzellik Salonu Seans Takibi' },
      { href: '/randevu-sistemi', label: 'Online Randevu Sistemi' },
    ],
  },
  {
    heading: 'Kafe, Restoran & Kasa',
    links: [
      { href: '/kafe-restoran', label: 'Kafe & Restoran Adisyon' },
      { href: '/qr-menu', label: 'Ücretsiz QR Menü' },
      { href: '/kasa-programi', label: 'Kasa Programı' },
      { href: '/gun-sonu-raporu', label: 'Gün Sonu Raporu' },
      { href: '/veresiye-defteri', label: 'Veresiye Defteri' },
    ],
  },
  {
    heading: 'Yerel & Bilgi Merkezi',
    links: [
      { href: '/izmit-berber-randevu', label: 'İzmit Berber Randevu' },
      { href: '/zonguldak-berber-randevu', label: 'Zonguldak Berber Randevu' },
      { href: '/blog', label: 'Esnaf Blogu (15 Rehber)' },
      { href: '/rehber', label: 'Ücretsiz Prim & QR Araçları' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { href: '/fiyat', label: 'Fiyatlar & VIP' },
      { href: '/kayit', label: 'Ücretsiz Kayıt' },
      { href: '/iletisim', label: 'İletişim' },
      { href: '/gizlilik', label: 'Gizlilik & KVKK' },
    ],
  },
];

const linkCls =
  'hover:text-amber-600 transition-colors';

function Shell({
  title,
  breadcrumbTitle,
  breadcrumbs,
  onHome,
  onLogin,
  onRegister,
  children,
  ctaTitle,
  ctaText,
  ctaButton,
  ctaHref,
}: ShellProps) {
  useEffect(() => {
    document.title =
      title.includes('Dükkanım Yanımda') || title.includes('Dükkânım Yanımda')
        ? title
        : `${title} · Dükkanım Yanımda`;
    if (typeof window !== 'undefined') {
      trackPageView(window.location.pathname, document.title);
    }
  }, [title]);

  const crumbs: BreadcrumbItem[] = breadcrumbs && breadcrumbs.length > 0
    ? breadcrumbs
    : [
        { label: 'Ana Sayfa', href: '/' },
        { label: breadcrumbTitle || title },
      ];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans scroll-smooth flex flex-col">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-6">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); onHome(); }}
            className="flex items-center select-none shrink-0"
            aria-label="Dükkanım Yanımda ana sayfa"
          >
            <picture>
              <source srcSet="/brand/logo-horizontal.webp" type="image/webp" />
              <img
                src="/brand/logo-horizontal.png"
                alt="Dükkânım Yanımda — Esnaf Yönetim Programı logosu"
                width={160}
                height={40}
                decoding="async"
                className="h-9 sm:h-10 w-auto object-contain block"
              />
            </picture>
          </a>
          <nav
            aria-label="Üst Menü"
            className="hidden lg:flex items-center justify-center gap-5 xl:gap-6 text-sm font-bold text-stone-600"
          >
            {NAV_LINKS.slice(1).map((l) => (
              <a key={l.href} href={l.href} className={`${linkCls} whitespace-nowrap shrink-0`}>{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                trackCtaClick('Giriş Yap', 'public_header');
                onLogin();
              }}
              className="whitespace-nowrap shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80 transition-colors cursor-pointer"
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => {
                trackCtaClick('Ücretsiz Başla', 'public_header');
                onRegister();
              }}
              className="whitespace-nowrap shrink-0 px-4 sm:px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs sm:text-sm font-black shadow-md shadow-orange-500/20 hover:bg-orange-600 transition-colors cursor-pointer"
            >
              Ücretsiz Başla
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-bold text-stone-500">
          {crumbs.map((c, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <React.Fragment key={`${c.label}-${idx}`}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />}
                {c.href && !isLast ? (
                  <a
                    href={c.href}
                    onClick={c.href === '/' ? (e) => { e.preventDefault(); onHome(); } : undefined}
                    className="hover:text-orange-600 transition-colors"
                  >
                    {c.label}
                  </a>
                ) : (
                  <span className={isLast ? 'text-stone-900 font-black' : ''}>{c.label}</span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {children}

        <div className="mt-12 rounded-3xl bg-stone-900 text-white px-6 sm:px-10 py-10 text-center relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(600px 300px at 50% 0%, rgba(251,191,36,0.35), transparent 65%)' }}
          />
          <h2 className="relative text-2xl sm:text-3xl font-black tracking-tight">{ctaTitle || 'Bugün başla, yarın rahat et.'}</h2>
          <p className="relative mt-3 text-sm sm:text-base text-stone-300 font-medium">{ctaText || 'Kurulum yok. Kredi kartı gerekmez. 2 dakikada hazır.'}</p>
          {ctaHref ? (
            <a
              href={ctaHref}
              onClick={() => trackCtaClick(ctaButton || 'Ücretsiz Hesap Oluştur', 'public_footer_cta')}
              className="relative mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 text-white text-[15px] font-black shadow-lg hover:bg-amber-600 transition-colors"
            >
              {ctaButton || 'Ücretsiz Hesap Oluştur'}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                trackCtaClick(ctaButton || 'Ücretsiz Hesap Oluştur', 'public_footer_cta');
                onRegister();
              }}
              className="relative mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 text-white text-[15px] font-black shadow-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              {ctaButton || 'Ücretsiz Hesap Oluştur'}
            </button>
          )}
        </div>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-stone-100">
            {FOOTER_HUB_GROUPS.map((group) => (
              <div key={group.heading}>
                <p className="text-[11px] font-black uppercase tracking-wider text-stone-400 mb-3">
                  {group.heading}
                </p>
                <ul className="space-y-2 text-xs font-bold text-stone-600">
                  {group.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className={linkCls}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <picture>
              <source srcSet="/brand/logo-horizontal.webp" type="image/webp" />
              <img
                src="/brand/logo-horizontal.png"
                alt="Dükkânım Yanımda"
                width={160}
                height={40}
                loading="lazy"
                decoding="async"
                className="h-8 w-auto object-contain opacity-90"
              />
            </picture>
            <p className="text-xs text-stone-400 font-semibold">© 2026 Dükkanım Yanımda · Esnaf için yapıldı</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{children}</h1>;
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[15px] leading-relaxed text-stone-600 font-medium">{children}</p>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xl sm:text-2xl font-black tracking-tight">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-stone-600 font-medium">{children}</p>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2 text-sm text-stone-700 font-semibold">
          <span aria-hidden className="mt-1 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          {t}
        </li>
      ))}
    </ul>
  );
}

interface PageProps {
  onHome: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

function GizlilikPage(props: PageProps) {
  return (
    <Shell title="Gizlilik Politikası" {...props}>
      <H1>Gizlilik Politikası</H1>
      <Lead>
        Dükkanım Yanımda, esnafın kasa, veresiye, stok ve gün sonu kayıtlarını tuttuğu bir
        yönetim panelidir. Bu sayfa hangi verileri topladığımızı ve nasıl koruduğumuzu açıklar.
        Son güncelleme: 27 Eylül 2026.
      </Lead>
      <H2>Topladığımız veriler</H2>
      <P>
        Kayıt olurken dükkan adı, adınız ve telefon numaranızı alırız. Şifreniz asla açık
        şekilde saklanmaz; güvenli özet (scrypt) olarak tutulur. Uygulama içinde girdiğiniz
        müşteri, ürün, işlem ve randevu kayıtları yalnızca sizin dükkanınıza aittir.
      </P>
      <H2>Verilerin kullanımı</H2>
      <P>
        Verileriniz yalnızca size hizmet sunmak için kullanılır: giriş yapmanız, kayıtlarınızı
        tüm cihazlarınızda görmeniz ve yedek almanız. Verilerinizi üçüncü kişilerle paylaşmıyor,
        satmıyor ve reklam için kullanmıyoruz.
      </P>
      <H2>Güvenlik ve yedekleme</H2>
      <P>
        Bağlantı şifreli (HTTPS) sunulur. Oturumlar 30 gün geçerlidir, dilediğinizde çıkış
        yapabilirsiniz. Kayıtlarınız her gece otomatik yedeklenir; ayrıca tek dosyada yedek
        indirip saklayabilirsiniz.
      </P>
      <H2>Çerezler</H2>
      <P>
        Giriş oturumunuzu hatırlamak ve tema tercihinizi saklamak için tarayıcınızda küçük
        veriler tutarız. Reklam veya takip çerezi kullanmıyoruz.
      </P>
      <H2>Haklarınız</H2>
      <P>
        Verilerinizi görme, düzeltme ve hesabınızı silme hakkına sahipsiniz. Talepleriniz için
        bize yazmanız yeterli: <a className="text-amber-700 font-bold" href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>
      </P>
    </Shell>
  );
}

function IletisimPage(props: PageProps) {
  return (
    <Shell
      title="İletişim"
      ctaTitle="Konuşalım, dükkanını birlikte dijitale taşıyalım."
      ctaText="Önce e-postayla yaz, aynı gün dönelim. Hesabın varsa dükkan adını ekle."
      ctaButton="E-postayla Yaz"
      ctaHref={CONTACT_MAILTO}
      {...props}
    >
      <H1>İletişim</H1>
      <Lead>
        Sorun bildirimi, özellik önerisi veya VIP hakkında soru — hepsi için tek adres
        var. Yaz, genelde aynı gün içinde dönelim.
      </Lead>
      <div className="mt-8 rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-stone-400">E-posta ile yaz</p>
        <a
          href={CONTACT_MAILTO}
          className="mt-2 inline-block text-lg sm:text-xl font-black text-amber-700 hover:text-amber-800 break-all"
        >
          {CONTACT_EMAIL}
        </a>
        <div className="mt-5">
          <a
            href={`${CONTACT_MAILTO}?subject=${encodeURIComponent('Dükkanım Yanımda — destek talebi')}&body=${encodeURIComponent('Dükkan adı:\nTelefon:\nSorun/öneri:\n')}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white text-sm font-black shadow hover:bg-amber-600 transition-colors"
          >
            E-postayı Şimdi Aç
          </a>
        </div>
        <p className="mt-4 text-sm text-stone-500 font-medium">
          Konu ve dükkan adın hazır gelir — sen sadece sorunu yazarsın.
        </p>
      </div>
      <H2>Yazmadan önce hızlı cevaplar</H2>
      <div className="mt-4 space-y-3">
        {[
          { q: 'Şifremi unuttum, ne yapmalıyım?', a: 'Şu an şifre sıfırlama e-postayla yapılıyor: kayıtlı telefon numaranı yaz, hesabını doğrulayıp yeni şifre oluşturalım.' },
          { q: 'Verilerim silinir mi?', a: 'Hayır. Kayıtların her gece otomatik yedeklenir, ayrıca tek dosyada yedek indirip saklayabilirsin. Hesabını silmemizi istersen e-postayla bildirmen yeterli.' },
          { q: 'VIP ücreti ne zaman başlıyor?', a: 'Lansman bitmeden duyurulacak. Şimdiden katılanlar lansman boyunca ücret ödemez, fiyat sayfasındaki ₺149/ay bilgisi şimdiden belli olsun diye yazıyor.' },
          { q: 'Hangi telefonda çalışır?', a: 'Tarayıcısı olan her telefonda: Android, iPhone fark etmez. Ana ekrana ekleyince uygulama gibi açılır.' },
        ].map((f) => (
          <div key={f.q} className="rounded-2xl bg-white border border-stone-200 p-5">
            <p className="text-sm font-black">{f.q}</p>
            <p className="mt-1.5 text-sm text-stone-600 font-medium leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

const VIP_FREE = [
  'Kasa: nakit, POS ve havale ayrı ayrı',
  'Veresiye defteri ve müşteri cari kartları',
  'Tahsilat Turu ve Patron Raporu',
  'Stok takibi ve kritik stok uyarısı',
  'Sektör paneli (randevu, masa, servis fişi, dava, emanet)',
  'Yedekleme ve geri yükleme',
];

const VIP_PAID = [
  'Kritik stok alarmı — stok bitmeden haber',
  'Tek tık WhatsApp — borçluya hazır mesaj',
  'Veresiye avı — en borçlu 5 müşteri bir bakışta',
  'Kâr takibi — hangi gün ne kazandın',
  'Sınırsız kayıt — müşteri, ürün ve fiş limiti yok',
  'Öncelikli destek — sıra beklemeden yardım',
];

function FiyatPage(props: PageProps) {
  const { onRegister } = props;
  return (
    <Shell title="VIP Paketler" {...props}>
      <H1>Dükkanına göre paket seç</H1>
      <Lead>
        Defter, kasa ve stok hep ücretsiz. Paraya dönüşen işler — borcu toplamak,
        kârı görmek — VIP'de. Lansman bitmeden ücret ödemezsin.
      </Lead>

      <div className="mt-8 grid gap-4 sm:grid-cols-3 items-stretch">
        {/* Çırak */}
        <div className="rounded-3xl bg-white border border-stone-200 p-6 shadow-sm flex flex-col">
          <p className="text-xs font-black uppercase tracking-widest text-stone-400">Çırak</p>
          <p className="mt-2 text-4xl font-black tracking-tight">₺0 <span className="text-sm font-bold text-stone-400">/ hep ücretsiz</span></p>
          <p className="mt-2 text-[13px] font-semibold text-stone-500">Yeni tanışan esnaf için temel dijital defter.</p>
          <ul className="mt-4 space-y-2 flex-1 text-sm text-stone-700 font-semibold">
            <li>• 25 müşteri &amp; veresiye cari kotası</li>
            <li>• 3 masa / tek koltuk takibi</li>
            <li>• Ayda 20 online randevu hakkı</li>
            <li>• Temel kasa ve günlük ciro</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              trackCtaClick('Çırak - Ücretsiz Başla', 'fiyat_page');
              onRegister();
            }}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-stone-200 hover:border-amber-500 hover:text-amber-700 text-stone-700 text-sm font-black transition-colors cursor-pointer"
          >
            Ücretsiz Başla
          </button>
        </div>

        {/* Usta */}
        <div className="rounded-3xl bg-white border-2 border-amber-400 p-6 shadow-md flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-amber-600">Usta (Tek Koltuk)</p>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">BÜTÇE DOSTU</span>
          </div>
          <p className="mt-2 text-4xl font-black tracking-tight">
            ₺249 <span className="text-sm font-bold text-stone-400">/ ay</span>
          </p>
          <p className="mt-2 text-[13px] font-semibold text-stone-500">
            Tek çalışan mahalle berberi, terzi ve tamirciler için.
          </p>
          <ul className="mt-4 space-y-2 flex-1 text-sm text-stone-800 font-semibold">
            <li>✓ 100 müşteri &amp; cari kayıt kotası</li>
            <li>✓ Ayda 60 online randevu hakkı</li>
            <li>✓ Tek koltuk dijital randevu takvimi</li>
            <li>✓ Fotoğraftan AI tarife okuyucu</li>
            <li>✓ Cihazdan hızlı SMS &amp; WhatsApp</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              trackCtaClick('Usta Paketine Geç', 'fiyat_page');
              onRegister();
            }}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 text-white text-sm font-black shadow-md hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Usta Paketine Geç
          </button>
        </div>

        {/* Patron VIP */}
        <div className="relative rounded-3xl bg-stone-900 text-white p-6 shadow-xl overflow-hidden flex flex-col">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(500px 260px at 50% 0%, rgba(251,191,36,0.35), transparent 65%)' }}
          />
          <div className="relative flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-amber-400">Patron VIP</p>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-stone-900">EN ÇOK TERCİH EDİLEN</span>
          </div>
          <p className="relative mt-2 text-4xl font-black tracking-tight">
            ₺499 <span className="text-sm font-bold text-stone-400">/ ay</span>
          </p>
          <p className="relative mt-2 text-[13px] font-semibold text-stone-300">
            2+ personelli salonlar, kafeler ve büyüyen işletmeler için.
          </p>
          <ul className="relative mt-4 space-y-2 flex-1 text-sm text-stone-100 font-semibold">
            <li>✓ Sınırsız müşteri &amp; online randevu</li>
            <li>✓ Çoklu usta &amp; otomatik prim dağılımı</li>
            <li>✓ QR Menü + canlı garson çağrı</li>
            <li>✓ Marka bandını kaldırma</li>
            <li>✓ Dükkanınıza özel yazılım paneli</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              trackCtaClick('Patron VIP Başlat', 'fiyat_page');
              onRegister();
            }}
            className="relative mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 text-stone-950 text-sm font-black shadow-lg hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Patron VIP Başlat
          </button>
        </div>
      </div>

      <H2>Sektörüne göre VIP ne kazandırır?</H2>
      <P>
        Her dükkanın parası farklı yerde takılıyor. VIP, senin sektöründeki
        tıkanıklığı çözen araçları öne çıkarır:
      </P>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { h: '/berber', t: 'Berber & Erkek Kuaförü', d: '%0 komisyonlu 7/24 online randevu, otomatik usta/kalfa prim hesabı ve WhatsApp hatırlatma.' },
          { h: '/kuafor', t: 'Kuaför & Güzellik Salonu', d: 'İşlem süresi planlama, seans/paket sayacı, kapora takibi ve uzman bazlı takvim.' },
          { h: '/kafe-restoran', t: 'Kafe & Restoran Adisyon', d: 'Canlı masa planı, logolu QR menü, garson çağrı zili ve nakit/POS/havale parçalı tahsilat.' },
          { h: '/kasa-programi', t: 'Ortak Kasa & Gün Sonu', d: 'Kapanan randevu ve adisyonları anlık kasaya işleyin, akşam 30 saniyede gün sonu Z raporu alın.' },
        ].map((c) => (
          <a key={c.h} href={c.h} className="rounded-2xl bg-white border border-stone-200 p-5 hover:border-amber-400 hover:shadow-md transition-all">
            <p className="text-sm font-black text-amber-700">{c.t}</p>
            <p className="mt-1.5 text-[13px] text-stone-600 font-medium leading-relaxed">{c.d}</p>
          </a>
        ))}
      </div>

      <H2>Neden VIP?</H2>
      <P>
        Defterini tutarsan veri durur; ama para kaçar. Stok bitince kaçırsın,
        borçlu kaçınca geri gelmezsin, kârı görmeyen kârı da tutmaz. VIP bu üçünü
        kapatır: stok bitmeden haber verir, borçluya tek dokunuşla mesaj gönderir,
        kârı gün gün gösterir.
      </P>
      <H2>Ödeme nasıl olacak?</H2>
      <P>
        Lansman bitmeden online ödeme açılacak. Şimdiden katılanlar ilk aydan
        yararlanır, kart bilgisi alınmaz. Soruların için{' '}
        <a className="text-amber-700 font-bold" href="/iletisim">iletişim</a> sayfasından yazman yeterli.
      </P>
    </Shell>
  );
}

function KayitPage(props: PageProps) {
  const { onRegister } = props;
  return (
    <Shell title="Ücretsiz Kayıt" {...props}>
      <H1>2 dakikada dükkanını kur</H1>
      <Lead>
        Kredi kartı yok, kurulum yok, sözleşme yok. Telefon numaranla kaydol, dükkan adını
        yaz, defterin açılsın. Kasa, veresiye ve stok temel özellikleri ücretsiz.
      </Lead>
      <Bullets
        items={[
          '1. Telefon numaran ve şifrenle hesap oluştur',
          '2. Dükkan adını yaz, sektörünü seç (berber, kafe, bakkal, servis...)',
          '3. İlk müşterini veya ürününü ekle, bugünden işlemeye başla',
        ]}
      />
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => {
            trackCtaClick('Hemen Ücretsiz Kaydol', 'kayit_page');
            onRegister();
          }}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 text-white text-base font-black shadow-lg hover:bg-amber-600 transition-colors cursor-pointer"
        >
          Hemen Ücretsiz Kaydol
        </button>
        <p className="mt-3 text-xs text-stone-400 font-semibold">Zaten hesabın var mı? Yukarıdan giriş yap.</p>
      </div>
      <H2>Kağıt defterden geçenler için</H2>
      <P>
        Eski borçları tek tek işlemene gerek yok; her müşteriye açılış bakiyesi olarak
        girebilirsin. Bugünden sonraki her satış, tahsilat ve gider otomatik işlenir.
        Gün sonunda kasayı say, farkı gör, günü kapat.
      </P>
    </Shell>
  );
}

interface SectorDef {
  title: string;
  intro: string;
  bullets: string[];
  modules: string[];
  vip: string;
  faq: { q: string; a: string }[];
  closing: string;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
}

const SECTORS: Record<string, SectorDef> = {
  berber: {
    title: 'Berber ve Kuaför Programı',
    intro:
      'Randevu defteri, koltuk sırası ve gün sonu kasası tek ekranda. Kağıt ajandayı bırak: müşteri aradığında boş saati anında gör, koltuğa oturt, çıkarken ücreti kasaya işle. No-show yüzünden boş kalan koltuk tarihe karışır.',
    bullets: [
      'Randevu takvimi: günün randevuları, bekleyenler ve koltuktakiler ayrı listede',
      'Hizmet tarifesi: saç, sakal, cilt bakımı fiyatları tek tıkla satışa dönüşür',
      'Müşteri kartı: telefon, tıraş notu ve geçmiş işlemler tek dokunuşla önde',
      '“Sonra verir” diyenin borcu veresiye defterine işlenir, ay sonunda tek liste',
      'Usta/çırak ayrımı: personelin bilgileri panelde görünür, panele yalnızca sen girersin',
      'Gün sonu özeti: koltuk başına ciro, gider ve net kazanç akşam tek bakışta',
    ],
    modules: ['Randevu Takvimi', 'Hizmet Tarifesi', 'Veresiye Defteri', 'Tahsilat Turu', 'Personel Menüsü', 'Gün Sonu'],
    vip:
      'Koltuk boş kalmasın: Tahsilat Turu “abi yarın uğrarım” diyenlerin listesini önüne koyar, toplu turla hepsine WhatsApp hatırlatması gönderirsin. Patron Raporu hangi günlerin ölü geçtiğini gösterir.',
    faq: [
      {
        q: 'Randevuyu müşteri kendisi online alabiliyor mu?',
        a: 'Evet! İşletmenize özel "dukkanimyanimda.com.tr/r/dukkan-adiniz" web rezervasyon linki üretilir. Müşterileriniz bu link üzerinden sıra beklemeden usta, hizmet ve boş saat seçip anında online randevu alabilir. Randevular panelinize anında düşer ve WhatsApp teyit mesajı gönderilir.',
      },
      { q: 'Birden fazla koltuk/usta var, olur mu?', a: 'Olur. Usta, kalfa ve çırakları Personel Menüsü’nden tanımlarsın; kasa, müşteri ve stok kayıtları sadece senin gözünde kalır.' },
    ],
    closing:
      'Tek koltuklu dükkandan çok ustalı salona kadar aynı panel çalışır. Akşam kasayı say, farkı gör, günü kapat.',
    ctaTitle: 'Koltukların dolsun, defterin kendiliğinden tutulsun.',
    ctaText: 'İlk randevunu 2 dakikada gir. Kredi kartı gerekmez.',
    ctaButton: 'Berber Panelini Aç',
  },
  'guzellik-salonu': {
    title: 'Güzellik Salonu ve Merkez Yönetim Sistemi',
    intro:
      'Seans paketleri, estetisyen randevu takvimi, uzman primleri ve kapora takibi tek ekranda. Cilt bakımı, lazer epilasyon, kalıcı makyaj ve tırnak işlemlerinde seans kaçırma, çakışan randevu ve kayıp ödemeler son bulur.',
    bullets: [
      'Seans & Paket Takibi: 6-8 seanslık lazer veya cilt bakımı paketleri, kalan seans sayacı ve geçmiş işlemler',
      'Uzman & Kabin Planlaması: Hangi estetisyen/uzman hangi odada çalışıyor, anlık çakışmasız takvim',
      'Online Randevu & WhatsApp: Müşteri Instagram veya WhatsApp linkinden boş saatleri seçer, randevu anında düşer',
      'Otomatik Hatırlatma: Seansı yaklaşan müşteriye hatırlatma mesajı, no-show ve boş kabin kaybı son bulur',
      'Hizmet & Ürün Satışı: Bakım kremleri, serumlar ve ek seanslar tek tıkla adisyona ve kasaya işlenir',
      'Personel Prim Hesabı: Uzman başına ciro, yapılan işlem sayısı ve hakediş anında hesaplanır',
    ],
    modules: ['Seans & Paket Takibi', 'Uzman Takvimi', 'Online Randevu', 'Kabin & Cihaz Yönetimi', 'WhatsApp Hatırlatma', 'Kasa & Gün Sonu'],
    vip:
      'Seanslar yarım kalmasın: Tahsilat Turu kalan seans borcu olan müşterileri tek listede toplar, tek dokunuşla kibar hatırlatma gönderirsin. Patron Raporu en kârlı bakım hizmetlerini gösterir.',
    faq: [
      { q: 'Lazer epilasyon ve cilt bakımı seans takibi var mı?', a: 'Evet. Müşteriye 6 seanslık veya 8 seanslık paket tanımlarsınız; her geldiğinde tek tıkla 1 seans düşer, kalan seansı ve borcu net görürsünüz.' },
      { q: 'Müşteriler randevuyu online alabilir mi?', a: 'Evet! Size özel online randevu linkinizi Instagram biyografinize ve WhatsApp hattınıza ekleyin; müşteriler boş saatleri görüp anında randevu alsın.' },
    ],
    closing:
      'Güzellik merkezi, lazer stüdyosu, nail art veya cilt bakım salonunuzu tek ekrandan yönetin. Akşam kasayı say, günü kapat.',
    ctaTitle: 'Seanslar dolsun, randevular kendiliğinden işlensin.',
    ctaText: 'İlk randevunu 2 dakikada gir. Kredi kartı gerekmez.',
    ctaButton: 'Güzellik Salonu Panelini Aç',
  },
  'kafe-restoran': {
    title: 'Kafe ve Restoran Adisyon Takibi',
    intro:
      'Masa adisyonları, açık hesaplar ve hızlı kapatma tek panelde. Garson masayı açar, ürünleri ekler; kasa tek tuşla kapatır. Yoğun saatte “o masa ödedi mi?” kaosu biter, gecenin sonunda hangi masa ne bıraktı hepsi kayıtlı.',
    bullets: [
      'Masa görünümü: dolu, boş ve hesabı açık masalar renkleriyle belli',
      'Adisyona hızlı ürün ekleme, tek tuşla kapatma ve tahsilat',
      'Abonman takibi: öğretmen/esnaf öğle yemeği hesapları ayrı defterde',
      'Personel satışları ve açıklar Personel Menüsü’nden anında görünür',
      'Tedarikçi borcu (et, süt, içecek toptancısı) vadeleriyle kayıtlı',
      'Gün sonu: masa cirosu, gider ve kasa farkı otomatik hesaplanır',
    ],
    modules: ['Masa Adisyon', 'Hızlı Satış', 'Abonman Defteri', 'Tedarikçi Borcu', 'Personel Zimmeti', 'Gün Sonu'],
    vip:
      'Açık hesaplar birikmesin: Tahsilat Turu abonman ve açık masa bakiyelerini en büyükten dizer, toplu turla tahsilata çıkarsın. Patron Raporu haftanın kârını ve yavaş günleri önüne koyar.',
    faq: [
      { q: 'Garson telefondan kullanabilir mi?', a: 'Telefonun kendisinde evet — panel mobil uyumlu, adisyon ve sipariş her ekranda düzgün. Ama kasa ve müşteri bilgileri sadece senin; garson panele giremez, sen girip satışı işlersin.' },
      { q: 'Paket servis ve gel-al ayrı mı?', a: 'Masadan bağımsız hızlı satış fişi kesersin; hepsi aynı gün sonu cirosuna akar.' },
    ],
    closing:
      'Yoğun saatte tek elle kullanılacak kadar sade; telefondan da kasadan da aynı defter görünür.',
    ctaTitle: 'Masalar dönsün, hesaplar şaşmasın.',
    ctaText: 'İlk masanı şimdi aç, adisyonu dijitale taşı.',
    ctaButton: 'Kafe Panelini Aç',
  },
  'bakkal-market': {
    title: 'Bakkal ve Market Veresiye Defteri',
    intro:
      'Mahallenin veresiye defteri artık cebinde. Kim ne aldı, ne ödedi, kalan borç ne — tartışma biter. Barkodlu üründe stok kendiliğinden düşer, biten ürün (un, şeker, çay) kritik uyarıyla önüne gelir.',
    bullets: [
      'Müşteri cari kartı: borç, ödeme geçmişi ve tek tuşla tahsilat',
      'Barkod ve kategori ile tezgahta 3 saniyede ürün bulma',
      'Kritik stok uyarısı: biten ürün gözünden kaçmaz, toptancıya liste hazır',
      'Veresiye satış kasadan düşer, tahsilat günü kasaya eklenir — kasa hep tutar',
      'WhatsApp hatırlatma: geciken ödemeye kibar mesaj tek dokunuşla',
      'Ay sonu tek liste: kim ne kadar borçlu, kim düzenli ödüyor',
    ],
    modules: ['Veresiye Defteri', 'Barkod & Stok', 'Kritik Stok Uyarısı', 'Tahsilat Turu', 'WhatsApp Hatırlatma', 'Gün Sonu'],
    vip:
      'Ay sonu kapı kapı dolaşma: Tahsilat Turu mahallenin borcunu büyükten küçüğe dizer, toplu turla herkese kibar hatırlatma gider. Düzenli ödeyenleri görür, veresiye limitini ona göre açarsın.',
    faq: [
      { q: 'Eski defterdeki borçları nasıl aktarırım?', a: 'Her müşteriye açılış bakiyesi olarak girersin, 5 dakika sürer. Bugünden sonraki her işlem otomatik işlenir.' },
      { q: 'Borç limiti koyabiliyor muyum?', a: 'Müşteri notuna limiti yazıp takip edersin; limit aşım uyarısı yol haritasında, önce Tahsilat Turu ile tahsilatı hızlandırırsın.' },
    ],
    closing:
      'Eski borçları açılış bakiyesi olarak gir, bugünden itibaren her işlem deftere işlensin.',
    ctaTitle: 'Veresiye defterin artık kavga çıkarmasın.',
    ctaText: 'Mahalleni kaydet, ilk borcu şimdi işle.',
    ctaButton: 'Bakkal Panelini Aç',
  },
  'teknik-servis': {
    title: 'Teknik Servis Takip Programı',
    intro:
      'Cihaz kabul fişinden teslimata kadar her iş kayıt altında. “Benim telefon ne oldu?” sorusuna cevap aramakla uğraşma; fiş numarasından durumu anında söyle. Parça maliyeti fişe işlenir, her işin kârı net görünür.',
    bullets: [
      'Servis fişi: müşteri, cihaz, arıza notu ve durum takibi (bekliyor → işlemde → hazır → teslim)',
      'Parça + işçilik maliyetini fişe işle, iş başına kârı gör',
      'Teslimde tek tuşla tahsilat, tutar gün sonu cirosuna otomatik eklenir',
      'Bekleyen cihaz listesi: rafta unutulan iş kalmaz',
      'Müşteri kartı: eski arızalar ve “kronik sorunlu” notları önde',
      'Garanti/söz takibi notlarla fişe bağlı',
    ],
    modules: ['Servis Fişi', 'Durum Takibi', 'Parça Maliyeti', 'Veresiye Defteri', 'Tahsilat Turu', 'Gün Sonu'],
    vip:
      'Alacaklar rafta beklemesin: teslim edip ödemesini almadıkların Tahsilat Turu listesinde birikir, toplu turla “cihazınız hazır, ücreti bekliyoruz” mesajı gider. Patron Raporu haftanın tahsilatını ve bekleyenleri listeler.',
    faq: [
      { q: 'Fiş numarası otomatik mi?', a: 'Evet, her kabul fişi numaralı açılır; müşteri sorduğunda numaradan 5 saniyede bulursun.' },
      { q: 'Parça stoğu tutuyor mu?', a: 'Ürün stoğuna ekran, batarya gibi parçaları eklersin; kritik seviyeye düşünce uyarı alırsın.' },
    ],
    closing:
      'Telefoncu, bilgisayarcı, beyaz eşya servisi: cihazı al, fişi kes, durumu güncelle, teslim et. Hepsi 2 dakikada.',
    ctaTitle: 'Raftaki her cihazın durumu cebinde olsun.',
    ctaText: 'İlk kabul fişini şimdi kes.',
    ctaButton: 'Servis Panelini Aç',
  },
  hukuk: {
    title: 'Avukat ve Hukuk Bürosu Programı',
    intro:
      'Dava dosyaları, müvekkil cari hesapları ve duruşma hatırlatmaları tek panelde. Klasör karışıklığı bitsin: dosya numarasından davayı, müvekkilden alacağı anında gör. Duruşma günü sürprizi tarihe karışır.',
    bullets: [
      'Dava dosyası: müvekkil, karşı taraf, mahkeme ve duruşma tarihi takibi',
      'Duruşma takvimi: yaklaşan celseler otomatik listede, kaçırma yok',
      'Müvekkil cari kartı: alınan avans, kalan alacak ve tahsilat kaydı',
      'Vekalet ücreti + masraf kalemleri dosya bazında kayıtlı',
      'Danışmanlık saati takibi: saatlik işlerin karşılığı defterde',
      'Dosya notları: her celse çıkışı 1 dakikada not düş',
    ],
    modules: ['Dava Dosyası', 'Duruşma Takvimi', 'Müvekkil Cari Hesabı', 'Tahsilat Turu', 'Hatırlatmalar', 'Gün Sonu'],
    vip:
      'Vekalet ücreti peşinde koşma: ödenmemiş müvekkil alacakları Tahsilat Turu\'nda birikir, toplu turla resmi tonda hatırlatma gönderirsin. Patron Raporu ödenmemiş alacakları her hafta önüne dizer.',
    faq: [
      { q: 'Baro/e-imza entegrasyonu var mı?', a: 'Henüz yok; burası büronun iç defteri: dosya, duruşma ve para takibi. UYAP işlerin aynen orada yürür.' },
      { q: 'Müvekkil gizliliği nasıl korunuyor?', a: 'Veriler şifreli bağlantıyla taşınır, şifren özet olarak saklanır. Panele sadece sen girersin; personel kaydı sadece bilgi olarak tutulur, giriş yetkisi verilmez.' },
    ],
    closing:
      'Tek avukatlık bürodan çok ortaklı ofise kadar aynı defter çalışır. Müvekkil aradığında dosyayı saniyede aç.',
    ctaTitle: 'Dosyan da alacağın da tek ekranda olsun.',
    ctaText: 'İlk dava dosyanı şimdi aç.',
    ctaButton: 'Hukuk Panelini Aç',
  },
  terzi: {
    title: 'Terzi Emanet ve Sipariş Takibi',
    intro:
      'Emanet fişinden teslimata kadar her iş kayıt altında. “Benim pantolon ne oldu?” sorusu tarih olur; fişten durumu ve teslim gününü anında söyle. Teslim günü gelen müşteri kasaya ücret bırakır, defter kendiliğinden tutulur.',
    bullets: [
      'Emanet fişi: müşteri, ürün, tadilat notu ve teslim tarihi',
      'Durum takibi: bekliyor → işlemde → hazır → teslim edildi',
      'Ölçü ve model notları müşteri kartında saklı, her seferinde yeniden alma',
      'Teslimde tek tuşla tahsilat, gün sonu cirosuna otomatik eklenir',
      'Geciken teslimler ayrı listede: “yarın düğünü var” acelesi kaçmaz',
      'Sezon işleri (perde, ütü paketi) toplu fişle hızlı giriş',
    ],
    modules: ['Emanet Fişi', 'Teslim Takvimi', 'Ölçü Kartı', 'Veresiye Defteri', 'Tahsilat Turu', 'Gün Sonu'],
    vip:
      '"Sonra öderim"ler birikmesin: teslim edip ücreti alınmamış işler Tahsilat Turu listesine düşer, toplu turla kibar hatırlatma gider. Patron Raporu haftanın kârını ve yoğun günleri gösterir.',
    faq: [
      { q: 'Ölçüleri her seferinde mi gireceğim?', a: 'Hayır. Ölçü bir kez müşteri kartına yazılır, sonraki fişlerde otomatik önünde olur.' },
      { q: 'Kuru temizleme fişleri de olur mu?', a: 'Olur, aynı emanet mantığı: al, fişi kes, hazır olunca teslim et ve tahsilatı işle.' },
    ],
    closing:
      'Tadilat ve dikim işleri karışmaz: al, fişi kes, durumu güncelle, gününde teslim et.',
    ctaTitle: 'Emanetler karışmasın, teslim günü şaşmasın.',
    ctaText: 'İlk emanet fişini şimdi kes.',
    ctaButton: 'Terzi Panelini Aç',
  },
};

function SectorPage({ route, ...props }: PageProps & { route: 'berber' | 'guzellik-salonu' | 'kafe-restoran' | 'bakkal-market' | 'teknik-servis' | 'hukuk' | 'terzi' }) {
  const s = SECTORS[route];
  return (
    <Shell
      title={s.title}
      ctaTitle={s.ctaTitle}
      ctaText={s.ctaText}
      ctaButton={s.ctaButton}
      {...props}
    >
      <H1>{s.title}</H1>
      <Lead>{s.intro}</Lead>

      <div className="mt-6 flex flex-wrap gap-2">
        {s.modules.map((m) => (
          <span key={m} className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
            {m}
          </span>
        ))}
      </div>

      <H2>Bu panelde neler var?</H2>
      <Bullets items={s.bullets} />

      <div className="mt-8 rounded-2xl bg-stone-900 text-white p-6 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(500px 240px at 50% 0%, rgba(251,191,36,0.3), transparent 65%)' }}
        />
        <p className="relative text-xs font-black uppercase tracking-widest text-amber-400">VIP ile ne kazanırsın?</p>
        <p className="relative mt-2 text-sm leading-relaxed text-stone-200 font-medium">{s.vip}</p>
        <a href="/fiyat" className="relative mt-4 inline-block px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 transition-colors">
          VIP Paketlere Bak
        </a>
      </div>

      <H2>Geleneksel Yöntemler ve Rakiplere Göre Farkımız</H2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-700">
            <tr>
              <th className="p-3.5 sm:p-4 font-black">Özellik / Karşılaştırma</th>
              <th className="p-3.5 sm:p-4 font-black text-rose-600 bg-rose-50/50">Kağıt Defter / Klasik POS</th>
              <th className="p-3.5 sm:p-4 font-black text-amber-700 bg-amber-50/70">Dükkânım Yanımda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            <tr>
              <td className="p-3.5 sm:p-4 font-bold text-stone-900">Donanım & Kurulum Maliyeti</td>
              <td className="p-3.5 sm:p-4 text-stone-500">Pahalı POS cihazı, termal rulo ve servis ücreti</td>
              <td className="p-3.5 sm:p-4 font-bold text-emerald-600 bg-amber-50/30">₺0 — Mevcut telefon ve tabletinizden hemen çalışır</td>
            </tr>
            <tr>
              <td className="p-3.5 sm:p-4 font-bold text-stone-900">Online Randevu & QR Menü</td>
              <td className="p-3.5 sm:p-4 text-stone-500">Yok veya pahalı üçüncü parti yazılımlar</td>
              <td className="p-3.5 sm:p-4 font-bold text-emerald-600 bg-amber-50/30">7/24 dükkanınıza özel web linki (/r/:slug ve /m/:slug)</td>
            </tr>
            <tr>
              <td className="p-3.5 sm:p-4 font-bold text-stone-900">Veresiye ve Alacak Hatırlatma</td>
              <td className="p-3.5 sm:p-4 text-stone-500">Unutulan borçlar, sayfalar arası hesap arama</td>
              <td className="p-3.5 sm:p-4 font-bold text-emerald-600 bg-amber-50/30">WhatsApp ile tek tıkla nazik borç ekstresi bildirimi</td>
            </tr>
            <tr>
              <td className="p-3.5 sm:p-4 font-bold text-stone-900">Akşam Kasa & Gün Sonu</td>
              <td className="p-3.5 sm:p-4 text-stone-500">1 saat hesap makinesiyle fiş toplama stresi</td>
              <td className="p-3.5 sm:p-4 font-bold text-emerald-600 bg-amber-50/30">30 saniyede nakit, kart ve net kâr dökümü</td>
            </tr>
            <tr>
              <td className="p-3.5 sm:p-4 font-bold text-stone-900">Veri Güvenliği ve Yedekleme</td>
              <td className="p-3.5 sm:p-4 text-stone-500">Defter kaybolur veya ıslanırsa kayıtlar silinir</td>
              <td className="p-3.5 sm:p-4 font-bold text-emerald-600 bg-amber-50/30">%100 şifreli bulut + tek tıkla Excel/PDF yedekleme</td>
            </tr>
          </tbody>
        </table>
      </div>

      <H2>Merak edilenler</H2>
      {s.faq.map((f) => (
        <div key={f.q} className="mt-4 rounded-2xl bg-white border border-stone-200 p-5">
          <p className="text-sm font-black">{f.q}</p>
          <p className="mt-1.5 text-sm text-stone-600 font-medium leading-relaxed">{f.a}</p>
        </div>
      ))}

      <H2>Neden Dükkanım Yanımda?</H2>
      <P>{s.closing}</P>
      <P>
        Diğer çözümlerimizi de inceleyin: <a className="text-amber-700 font-bold" href="/berber">berber randevu</a>,{' '}
        <a className="text-amber-700 font-bold" href="/kuafor">kuaför</a>,{' '}
        <a className="text-amber-700 font-bold" href="/guzellik-salonu">güzellik salonu</a>,{' '}
        <a className="text-amber-700 font-bold" href="/kafe-restoran">kafe &amp; restoran adisyon</a>,{' '}
        <a className="text-amber-700 font-bold" href="/qr-menu">QR menü</a>,{' '}
        <a className="text-amber-700 font-bold" href="/kasa-programi">kasa &amp; gün sonu</a> — hepsi tek hesapta.
      </P>
    </Shell>
  );
}

interface RehberArticleItem {
  slug: string;
  category: string;
  readTime: string;
  title: string;
  summary: string;
  steps: string[];
  ctaHref: string;
  ctaLabel: string;
}

const REHBER_ARTICLES: RehberArticleItem[] = [
  {
    slug: 'berber-no-show-onleme',
    category: 'Berber & Kuaför',
    readTime: '4 dk',
    title: 'Berberlerde Gelmeyen Müşteri (No-Show) Nasıl Önlenir?',
    summary: 'Boş kalan koltukları doldurmanın 5 pratik yolu: 2 saat kala otomatik hatırlatma, FAST/IBAN kapora ve ölü saat duyuruları.',
    steps: [
      'Randevudan 2 saat önce otomatik WhatsApp/SMS hatırlatma gönderin.',
      'Uzun süren VIP veya gelin başı işlemlerinde FAST/IBAN kapora isteyin.',
      'Boş kalan ölü saatleri tek tıkla müdavimlere flaş indirim olarak duyurun.',
    ],
    ctaHref: '/berber',
    ctaLabel: 'Berber Randevu Panelini İncele',
  },
  {
    slug: 'kuafor-prim-hesaplama',
    category: 'Berber & Kuaför',
    readTime: '5 dk',
    title: 'Berber & Kuaför Usta / Kalfa Prim Hesaplama Rehberi',
    summary: 'Koltuk cirosu, yüzdelik hakediş ve malzeme düşümüyle şeffaf ve hatasız akşam prim hesaplama yöntemleri.',
    steps: [
      'Saf yüzdelik (%40-%50) veya hedef baremli prim oranını personel kartına tanımlayın.',
      'Boya/bakım ürünlerinde malzeme maliyetini düşerek net tutar üzerinden pay hesaplayın.',
      'Ödenen primleri kasa gideri olarak işleyip akşam kapanışı 30 saniyede yapın.',
    ],
    ctaHref: '/kuafor',
    ctaLabel: 'Kuaför Salon Sistemini Gör',
  },
  {
    slug: 'ucretsiz-qr-menu-olusturma',
    category: 'Kafe & Restoran',
    readTime: '4 dk',
    title: 'Kafe & Restoranlar İçin Ücretsiz QR Menü Nasıl Yapılır?',
    summary: 'Baskı maliyeti olmadan 2 dakikada masaya özel karekod menü oluşturun ve telefonla doğrudan masadan sipariş alın.',
    steps: [
      'Ürünlerinizi kategori, açıklama ve güncel fiyatlarıyla tek ekrandan girin.',
      'Aşağıdaki ücretsiz QR oluşturucu veya panel içinden masa karekodlarını yazdırın.',
      'Fiyat değiştiğinde karekodu değiştirmeden menüyü saniyeler içinde güncelleyin.',
    ],
    ctaHref: '/kafe-restoran',
    ctaLabel: 'Kafe & QR Menü Modülünü İncele',
  },
  {
    slug: 'dijital-veresiye-defteri-gecis',
    category: 'Bakkal & Market',
    readTime: '4 dk',
    title: 'Kağıt Veresiye Defterinden Dijitale Geçiş Rehberi',
    summary: 'Kayıp alacakları önlemek için müşterileri açılış bakiyesiyle aktarın ve tek tıkla WhatsApp borç ekstresi gönderin.',
    steps: [
      'Mevcut defterdeki toplam bakiyeleri müşteri kartına açılış borcu olarak girin.',
      'Her veresiye ve tahsilatta güncel borcu bulutta otomatik hesaplatın.',
      'Nazik WhatsApp hatırlatma şablonlarıyla alacak tahsilatını hızlandırın.',
    ],
    ctaHref: '/bakkal-market',
    ctaLabel: 'Veresiye & POS Modülünü Gör',
  },
  {
    slug: 'komisyonsuz-randevu-programi',
    category: 'Karşılaştırma',
    readTime: '5 dk',
    title: '%0 Komisyonlu Online Randevu Programı Neden Önemli?',
    summary: 'İlk randevudan %20 komisyon kesen pazaryeri uygulamaları yerine dükkanınıza özel web linkiyle tüm kazancı kasanızda tutun.',
    steps: [
      'Müşterilerinizi rakip salonların da listelendiği pazaryerleri yerine /r/dukkaniniz linkine çekin.',
      'Instagram bio ve Google Haritalar profilinize doğrudan randevu linki ekleyin.',
      'Komisyon ve mesaj kontörü ödemeden dijital sadakat kartıyla müdavim kitlesi kurun.',
    ],
    ctaHref: '/fiyat',
    ctaLabel: 'Paketleri İncele',
  },
  {
    slug: 'istanbul-berber-kuafor',
    category: 'Yerel Dizin',
    readTime: '3 dk',
    title: 'İstanbul Berber & Kuaför Randevu ve Salon Yönetimi',
    summary: 'Kadıköy, Beşiktaş, Şişli ve Üsküdar salonları için 7/24 online randevu, koltuk sırası ve usta primi yönetimi.',
    steps: [
      'Yoğun saatlerde telefon trafiğini azaltmak için WhatsApp ve Instagram randevu linki paylaşın.',
      'Çoklu koltuk ve personel takvimini tek ekranda çakışmasız yönetin.',
    ],
    ctaHref: '/berber',
    ctaLabel: 'Berber Sistemini İncele',
  },
  {
    slug: 'ankara-berber-kuafor',
    category: 'Yerel Dizin',
    readTime: '3 dk',
    title: 'Ankara Berber & Kuaför Randevu ve Koltuk Sistemi',
    summary: 'Çankaya, Kızılay, Yenimahalle ve Keçiören berber/kuaförleri için akıllı slot planlama ve 10’lu sadakat kartı.',
    steps: [
      'İşlem süresine göre otomatik randevu aralıkları oluşturun.',
      'Akşam yoğunluğu dışındaki saatler için ölü saat kampanyası başlatın.',
    ],
    ctaHref: '/berber',
    ctaLabel: 'Berber Sistemini İncele',
  },
  {
    slug: 'izmir-kafe-restoran',
    category: 'Yerel Dizin',
    readTime: '3 dk',
    title: 'İzmir Kafe & Restoran QR Menü ve Adisyon Sistemi',
    summary: 'Alsancak, Bostanlı ve Bornova kafeleri için bahçe/teras masa yerleşimi, canlı QR sipariş ve garson çağırma.',
    steps: [
      'Masa QR standlarını dükkan logonuzla yazdırıp masalara yerleştirin.',
      'Müşteri siparişleri ve garson çağrılarını kasa/mutfak ekranında anında görün.',
    ],
    ctaHref: '/kafe-restoran',
    ctaLabel: 'QR Menü Sistemini İncele',
  },
];

const WHATSAPP_TEMPLATES: { id: string; title: string; badge: string; text: string }[] = [
  {
    id: 'veresiye',
    title: 'Nazik Veresiye Borç Hatırlatma',
    badge: 'Bakkal / Genel Esnaf',
    text: 'Merhaba {MusteriAdi}, {DukkanAdi} olarak hayırlı günler dileriz. Hesabınızda güncel {Tutar} TL açık bakiye bulunmaktadır. Müsait olduğunuzda uğrayabilir veya havale/FAST ile kapatabilirsiniz. Teşekkür ederiz.',
  },
  {
    id: 'randevu',
    title: 'Randevu 2 Saat Kala Teyit Mesajı',
    badge: 'Berber / Kuaför / Güzellik',
    text: 'Merhaba {MusteriAdi}, bugün saat {Saat} için {DukkanAdi} randevunuzu hatırlatmak isteriz. Planınızda bir değişiklik olursa lütfen önceden bilgi veriniz. Sizi bekliyoruz!',
  },
  {
    id: 'olusaat',
    title: 'Ölü Saat Flaş İndirim Duyurusu',
    badge: 'Koltuk Doldurma',
    text: 'Merhaba! {DukkanAdi} olarak bugün 13:00–16:00 saatleri arasındaki boş randevulara özel %20 indirim tanımladık. Yer ayırtmak için hemen online randevu linkimizden saatinizi seçebilirsiniz.',
  },
  {
    id: 'hazir',
    title: 'Cihaz / Emanet Teslime Hazır',
    badge: 'Teknik Servis / Terzi',
    text: 'Merhaba {MusteriAdi}, {FisKodu} numaralı işleminiz tamamlandı ve teslimata hazırdır. Çalışma saatlerimiz içinde {DukkanAdi} şubemizden teslim alabilirsiniz.',
  },
];

function slugifyTurkishText(val: string): string {
  return (val || '')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'dukkanim';
}

function RehberPage(props: PageProps) {
  const initialSlug = typeof window !== 'undefined'
    ? window.location.pathname.toLowerCase().replace(/^\/rehber\/?/, '').replace(/\/+$/, '')
    : '';
  const [activeSlug, setActiveSlug] = useState<string>(
    REHBER_ARTICLES.some((a) => a.slug === initialSlug) ? initialSlug : REHBER_ARTICLES[0].slug
  );

  // Prim hesaplayıcı state
  const [dailyTurnover, setDailyTurnover] = useState<string>('4500');
  const [commissionPct, setCommissionPct] = useState<string>('45');
  const [workDays, setWorkDays] = useState<string>('26');
  const [staffCount, setStaffCount] = useState<string>('2');

  // QR kod oluşturucu state
  const [qrMode, setQrMode] = useState<'m' | 'r'>('m');
  const [qrShopName, setQrShopName] = useState<string>('İşletmem');
  const [qrCopied, setQrCopied] = useState(false);

  // Şablon kopyalama state
  const [copiedTplId, setCopiedTplId] = useState<string | null>(null);

  const activeArticle = REHBER_ARTICLES.find((a) => a.slug === activeSlug) || REHBER_ARTICLES[0];
  const turnoverNum = Math.max(0, Number(dailyTurnover) || 0);
  const pctNum = Math.min(100, Math.max(0, Number(commissionPct) || 0));
  const daysNum = Math.min(31, Math.max(1, Number(workDays) || 1));
  const staffNum = Math.max(1, Number(staffCount) || 1);

  const dailyStaffPool = Math.round((turnoverNum * pctNum) / 100);
  const dailyShopShare = Math.max(0, turnoverNum - dailyStaffPool);
  const monthlyPerStaff = Math.round((dailyStaffPool * daysNum) / staffNum);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dukkanimyanimda.com.tr';
  const generatedSlug = slugifyTurkishText(qrShopName);
  const generatedQrTargetUrl = `${originUrl}/${qrMode}/${generatedSlug}`;
  const generatedQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&ecc=H&data=${encodeURIComponent(generatedQrTargetUrl)}`;

  const handleCopy = (text: string, onDone: () => void) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(onDone).catch(onDone);
    } else {
      onDone();
    }
  };

  return (
    <Shell
      title="Esnaf Rehberi & Ücretsiz İşletme Araçları"
      ctaTitle="Rehberde okuduklarını 2 dakikada dükkanına uygula."
      ctaText="Komisyon %0, kurulum yok. Online randevu, QR menü ve veresiye defterini hemen başlat."
      ctaButton="Ücretsiz Dükkanını Kur"
      {...props}
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
        <BookOpen className="w-3.5 h-3.5" />
        Esnaf Bilgi Merkezi · Ücretsiz Araçlar &amp; Şablonlar
      </div>
      <H1>Esnaf Rehberi, Prim Hesaplayıcı ve Ücretsiz QR Araçları</H1>
      <Lead>
        Berber, kuaför, kafe ve mahalle esnafı için hazırlanmış pratik büyüme rehberleri, şehir bazlı yerel dizinler ve üye olmadan hemen kullanabileceğiniz ücretsiz işletme araçları.
      </Lead>

      {/* Aktif Rehber Makalesi & Makale Seçici */}
      <section className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-2.5">
          <h2 className="text-sm font-black uppercase tracking-wider text-stone-500">Rehber &amp; Yerel SEO Yazıları</h2>
          {REHBER_ARTICLES.map((art) => {
            const isActive = art.slug === activeArticle.slug;
            return (
              <a
                key={art.slug}
                href={`/rehber/${art.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSlug(art.slug);
                  if (typeof window !== 'undefined' && window.history?.replaceState) {
                    window.history.replaceState(null, '', `/rehber/${art.slug}`);
                  }
                }}
                className={`block rounded-2xl border p-4 transition-all ${
                  isActive
                    ? 'bg-orange-50 border-orange-400 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-black text-amber-700 uppercase">
                  <span>{art.category}</span>
                  <span>{art.readTime}</span>
                </div>
                <p className="mt-1 text-sm font-black text-stone-900">{art.title}</p>
              </a>
            );
          })}
        </div>

        <article className="lg:col-span-7 rounded-3xl bg-white border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-black">
              {activeArticle.category} · {activeArticle.readTime} okuma
            </span>
            <h2 className="mt-3 text-2xl font-black text-stone-900 leading-snug">{activeArticle.title}</h2>
            <p className="mt-3 text-sm text-stone-600 font-medium leading-relaxed">{activeArticle.summary}</p>
            <h3 className="mt-6 text-sm font-black text-stone-900 uppercase tracking-wide">Uygulama Adımları</h3>
            <Bullets items={activeArticle.steps} />
          </div>
          <div className="mt-8 pt-5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <a
              href={activeArticle.ctaHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-black hover:bg-orange-600 transition-colors"
            >
              {activeArticle.ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </a>
            <span className="text-xs font-bold text-stone-400">Komisyon %0 · Kredi Kartı Gerekmez</span>
          </div>
        </article>
      </section>

      {/* Şehir × Sektör Yerel Dizin Özeti */}
      <section className="mt-12 rounded-3xl bg-white border border-stone-200 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase">
          <MapPin className="w-4 h-4" />
          Şehir × Sektör Yerel Esnaf Dizinleri
        </div>
        <h2 className="mt-2 text-xl font-black text-stone-900">Bölgenizdeki Dijital Esnaf Ağı</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <a href="/izmit-berber-randevu" className="rounded-2xl border border-stone-200 p-4 hover:border-orange-400 transition-colors">
            <p className="text-sm font-black text-stone-900">İzmit &amp; Kocaeli Berber Randevu</p>
            <p className="mt-1 text-xs text-stone-600 font-medium">İzmit, Gebze, Körfez ve Gölcük salonları için online koltuk ve randevu sistemi.</p>
          </a>
          <a href="/zonguldak-berber-randevu" className="rounded-2xl border border-stone-200 p-4 hover:border-orange-400 transition-colors">
            <p className="text-sm font-black text-stone-900">Zonguldak &amp; Ereğli Berber Randevu</p>
            <p className="mt-1 text-xs text-stone-600 font-medium">Gazipaşa, Kozlu ve Kdz. Ereğli berber/kuaför salon yönetimi ve usta primi.</p>
          </a>
          <a href="/kafe-restoran" className="rounded-2xl border border-stone-200 p-4 hover:border-orange-400 transition-colors">
            <p className="text-sm font-black text-stone-900">Kafe &amp; Restoran QR Adisyon</p>
            <p className="mt-1 text-xs text-stone-600 font-medium">Salon ve bahçe masa takibi, logolu QR menü ve anlık garson çağırma.</p>
          </a>
        </div>
      </section>

      {/* Etkileşimli Araçlar */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* Araç 1: Berber Usta/Kalfa Prim Hesaplayıcı */}
        <div className="rounded-3xl bg-white border border-stone-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 text-orange-600 text-xs font-black uppercase">
            <Calculator className="w-4 h-4" />
            Ücretsiz Araç 1
          </div>
          <h2 className="mt-1 text-xl font-black text-stone-900">Berber Usta / Kalfa Prim Hesaplayıcı</h2>
          <p className="mt-1 text-xs text-stone-500 font-medium">Günlük salon cirosuna göre usta payını ve dükkan netini anında hesaplayın.</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-xs font-bold text-stone-700">
              Günlük Toplam Ciro (₺)
              <input
                type="number"
                min={0}
                value={dailyTurnover}
                onChange={(e) => setDailyTurnover(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-bold text-stone-900"
              />
            </label>
            <label className="text-xs font-bold text-stone-700">
              Prim Oranı (%)
              <input
                type="number"
                min={0}
                max={100}
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-bold text-stone-900"
              />
            </label>
            <label className="text-xs font-bold text-stone-700">
              Aylık Çalışma Günü
              <input
                type="number"
                min={1}
                max={31}
                value={workDays}
                onChange={(e) => setWorkDays(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-bold text-stone-900"
              />
            </label>
            <label className="text-xs font-bold text-stone-700">
              Usta / Kalfa Sayısı
              <input
                type="number"
                min={1}
                max={30}
                value={staffCount}
                onChange={(e) => setStaffCount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-bold text-stone-900"
              />
            </label>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-stone-900 text-white p-4 text-center">
            <div>
              <p className="text-[11px] text-stone-400 font-bold">Günlük Prim Havuzu</p>
              <p className="mt-0.5 text-lg font-black text-amber-400">₺{dailyStaffPool.toLocaleString('tr-TR')}</p>
            </div>
            <div>
              <p className="text-[11px] text-stone-400 font-bold">Günlük Dükkan Payı</p>
              <p className="mt-0.5 text-lg font-black text-emerald-400">₺{dailyShopShare.toLocaleString('tr-TR')}</p>
            </div>
            <div>
              <p className="text-[11px] text-stone-400 font-bold">Kişi Başı Aylık</p>
              <p className="mt-0.5 text-lg font-black text-white">₺{monthlyPerStaff.toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </div>

        {/* Araç 2: Ücretsiz QR Menü & Randevu Karekod Oluşturucu */}
        <div className="rounded-3xl bg-white border border-stone-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 text-orange-600 text-xs font-black uppercase">
            <QrCode className="w-4 h-4" />
            Ücretsiz Araç 2
          </div>
          <h2 className="mt-1 text-xl font-black text-stone-900">QR Menü &amp; Randevu Karekod Oluşturucu</h2>
          <p className="mt-1 text-xs text-stone-500 font-medium">Dükkan adınızı yazın, yüksek hata düzeltmeli (ECC-H) karekodunuzu anında oluşturun.</p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setQrMode('m')}
              className={`flex-1 py-2 rounded-xl text-xs font-black border cursor-pointer ${
                qrMode === 'm' ? 'bg-orange-500 text-white border-orange-500' : 'bg-stone-50 text-stone-700 border-stone-200'
              }`}
            >
              QR Menü (/m/)
            </button>
            <button
              type="button"
              onClick={() => setQrMode('r')}
              className={`flex-1 py-2 rounded-xl text-xs font-black border cursor-pointer ${
                qrMode === 'r' ? 'bg-orange-500 text-white border-orange-500' : 'bg-stone-50 text-stone-700 border-stone-200'
              }`}
            >
              Online Randevu (/r/)
            </button>
          </div>

          <input
            type="text"
            value={qrShopName}
            onChange={(e) => setQrShopName(e.target.value)}
            placeholder="Dükkan adınız (örn. Altın Makas Berber)"
            className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-bold text-stone-900"
          />

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-stone-50 border border-stone-200 p-4">
            <img
              src={generatedQrImageUrl}
              alt={`${qrShopName || 'Dükkan'} QR Kodu`}
              width={112}
              height={112}
              loading="lazy"
              decoding="async"
              className="w-28 h-28 rounded-xl border border-stone-200 bg-white p-1.5 shrink-0"
            />
            <div className="flex-1 min-w-0 w-full">
              <p className="text-[11px] font-black text-stone-500 uppercase">Hedef Bağlantı</p>
              <p className="mt-0.5 text-xs font-bold text-stone-800 break-all">{generatedQrTargetUrl}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(generatedQrTargetUrl, () => {
                    setQrCopied(true);
                    setTimeout(() => setQrCopied(false), 1800);
                  })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-black cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {qrCopied ? 'Kopyalandı!' : 'Linki Kopyala'}
                </button>
                <a
                  href={generatedQrImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-black"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Görseli Aç / İndir
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Araç 3: Kopyalanabilir WhatsApp Hatırlatma Şablonları */}
      <section className="mt-10 rounded-3xl bg-white border border-stone-200 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-black uppercase">
          <MessageCircle className="w-4 h-4" />
          Ücretsiz Araç 3 · Hazır Mesaj Şablonları
        </div>
        <h2 className="mt-1 text-xl font-black text-stone-900">Kopyalanabilir WhatsApp Veresiye &amp; Randevu Şablonları</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {WHATSAPP_TEMPLATES.map((tpl) => {
            const isCopied = copiedTplId === tpl.id;
            return (
              <div key={tpl.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">{tpl.badge}</span>
                  <h3 className="mt-0.5 text-sm font-black text-stone-900">{tpl.title}</h3>
                  <p className="mt-2 text-xs text-stone-600 font-medium leading-relaxed">{tpl.text}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(tpl.text, () => {
                      setCopiedTplId(tpl.id);
                      setTimeout(() => setCopiedTplId(null), 1800);
                    })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-black cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {isCopied ? 'Panoya Kopyalandı!' : 'Mesajı Kopyala'}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(tpl.text)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-black"
                  >
                    WhatsApp'ta Aç
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}

type DeepLandingRoute =
  | 'berber'
  | 'guzellik-salonu'
  | 'kafe-restoran'
  | 'bakkal-market'
  | 'veresiye-defteri'
  | 'kasa-programi'
  | 'gun-sonu-raporu'
  | 'qr-menu';

const ROUTE_DEFAULT_CONTENT_KEY: Record<DeepLandingRoute, LandingPageKey> = {
  berber: '/berber',
  'guzellik-salonu': '/guzellik-salonu',
  'kafe-restoran': '/kafe-restoran',
  'bakkal-market': '/bakkal-market',
  'veresiye-defteri': '/veresiye-defteri',
  'kasa-programi': '/kasa-programi',
  'gun-sonu-raporu': '/gun-sonu-raporu',
  'qr-menu': '/qr-menu',
};

function DeepLandingPage({
  route,
  ...props
}: PageProps & { route: DeepLandingRoute }) {
  const { onRegister } = props;
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const resolved = resolveLandingContentKey(pathname);
  const contentKey: LandingPageKey =
    route === 'berber'
      ? resolved && resolved !== '/'
        ? resolved
        : '/berber'
      : ROUTE_DEFAULT_CONTENT_KEY[route] || '/berber';

  const content = SEO_LANDING_PAGES[contentKey] || SEO_LANDING_PAGES['/berber'];
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const breadcrumbs: BreadcrumbItem[] = content.cityDetails
    ? [
        { label: 'Ana Sayfa', href: '/' },
        { label: 'Berber Randevu', href: '/berber' },
        { label: `${content.cityDetails.city} Berber Randevu` },
      ]
    : [
        { label: 'Ana Sayfa', href: '/' },
        { label: content.badge },
      ];

  return (
    <Shell
      title={content.h1}
      breadcrumbs={breadcrumbs}
      ctaTitle="Dükkanını 2 dakikada dijitale taşı, kasanı ve müşterini cebinden yönet."
      ctaText="Çırak paketi kredi kartı istemeden ₺0 başlar. İhtiyacına göre dilediğin zaman Usta veya Patron VIP’e geç."
      ctaButton="Ücretsiz Hesap Oluştur"
      {...props}
    >
      {/* Hero */}
      <section className="grid md:grid-cols-12 gap-8 items-center rounded-3xl bg-white border border-stone-200 p-6 sm:p-10 shadow-xs">
        <div className="md:col-span-7 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            {content.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 leading-tight">
            {content.h1}
          </h1>
          <p className="text-sm sm:text-base text-stone-600 font-medium leading-relaxed">
            {content.subtitle}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                trackCtaClick(`Ücretsiz Başla: ${content.key}`, `landing_${content.key}`);
                onRegister();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black shadow-md shadow-orange-500/25 cursor-pointer transition-colors"
            >
              <span>Ücretsiz Başla (2 Dk)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="/fiyat"
              onClick={() => trackCtaClick('Paketleri İncele', `landing_${content.key}`)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-200 hover:border-orange-400 text-stone-800 text-sm font-black transition-colors"
            >
              Paketleri İncele
            </a>
          </div>
          <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold text-stone-500">
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Kredi Kartı Gerekmez</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> %0 Randevu Komisyonu</span>
            <span className="inline-flex items-center gap-1"><Smartphone className="w-3.5 h-3.5 text-orange-500" /> Mobil &amp; Masaüstü</span>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col items-center justify-center rounded-2xl bg-linear-to-br from-orange-50 via-amber-50/70 to-stone-50 border border-orange-100 p-5">
          <picture>
            <source srcSet="/brand/phone_mockup_retina.webp" type="image/webp" />
            <img
              src="/brand/phone_mockup_retina.png"
              alt={`${content.h1} — Dükkânım Yanımda mobil ekran görünümü`}
              width={580}
              height={900}
              fetchPriority="high"
              decoding="async"
              className="w-48 sm:w-56 h-auto object-contain drop-shadow-xl"
            />
          </picture>
          <p className="mt-3 text-[11px] font-black text-orange-800 uppercase tracking-wider text-center">
            Telefonda &amp; Tablette Anlık Yönetim
          </p>
        </div>
      </section>

      {/* Şehir × Yerel SEO Kutusu (İzmit & Zonguldak vb.) */}
      {content.cityDetails && (
        <section className="mt-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {content.cityDetails.localStats.map((st) => (
              <div key={st.label} className="rounded-2xl bg-white border border-stone-200 p-4 text-center shadow-2xs">
                <p className="text-xl sm:text-2xl font-black text-orange-600">{st.value}</p>
                <p className="mt-1 text-[11px] font-bold text-stone-500">{st.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white border border-stone-200 p-6 sm:p-7 space-y-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-600">
                <MapPin className="w-4 h-4" />
                {content.cityDetails.city} &amp; {content.cityDetails.region} Hizmet Kapsamı
              </div>
              <h2 className="mt-1 text-xl font-black text-stone-900">
                Hizmet Verilen İlçeler ve Öne Çıkan Semtler
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {content.cityDetails.districts.map((d) => (
                  <span key={d} className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-black">
                    {d}
                  </span>
                ))}
                {content.cityDetails.neighborhoods.map((n) => (
                  <span key={n} className="px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-5">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                Yerel Vaka Çalışması
              </p>
              <h3 className="mt-1 text-base font-black text-stone-900">
                {content.cityDetails.caseStudyTitle}
              </h3>
              <p className="mt-2 text-sm text-stone-700 font-medium leading-relaxed">
                {content.cityDetails.caseStudySummary}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Giriş Paragrafları */}
      <section className="mt-8 rounded-3xl bg-white border border-stone-200 p-6 sm:p-8 space-y-4">
        {content.introParagraphs.map((p, idx) => (
          <p key={idx} className="text-sm sm:text-[15px] text-stone-700 font-medium leading-relaxed">
            {p}
          </p>
        ))}
      </section>

      {/* Nasıl Çalışır (3 Adım) */}
      <section className="mt-10">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-600">
          <Zap className="w-4 h-4" />
          3 Adımda Kurulum
        </div>
        <h2 className="mt-1 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          Nasıl Çalışır?
        </h2>
        <div className="mt-5 grid sm:grid-cols-3 gap-4">
          {content.howItWorks.map((item) => (
            <div key={item.step} className="rounded-2xl bg-white border border-stone-200 p-5 shadow-2xs">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-500 text-white text-sm font-black">
                {item.step}
              </span>
              <h3 className="mt-3 text-base font-black text-stone-900">{item.title}</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Detaylı Özellik Bölümleri */}
      <section className="mt-10 space-y-6">
        {content.featureSections.map((sec) => (
          <article key={sec.heading} className="rounded-3xl bg-white border border-stone-200 p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              {sec.heading}
            </h2>
            {sec.paragraphs.map((p, i) => (
              <p key={i} className="text-sm sm:text-[15px] text-stone-700 font-medium leading-relaxed">
                {p}
              </p>
            ))}
            {sec.bullets && sec.bullets.length > 0 && (
              <ul className="pt-2 grid sm:grid-cols-2 gap-2.5">
                {sec.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs sm:text-sm font-bold text-stone-800 bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      {/* Karşılaştırma Tablosu */}
      {content.comparisonPoints && content.comparisonPoints.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Geleneksel Yönteme Göre Farkımız
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-700">
                <tr>
                  <th className="p-3.5 sm:p-4 font-black">Karşılaştırma Başlığı</th>
                  <th className="p-3.5 sm:p-4 font-black text-rose-600 bg-rose-50/50">Eski Yöntem / Kağıt Defter</th>
                  <th className="p-3.5 sm:p-4 font-black text-amber-800 bg-amber-50/70">Dükkânım Yanımda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {content.comparisonPoints.map((cp) => (
                  <tr key={cp.title}>
                    <td className="p-3.5 sm:p-4 font-bold text-stone-900">{cp.title}</td>
                    <td className="p-3.5 sm:p-4 text-stone-500">{cp.oldWay}</td>
                    <td className="p-3.5 sm:p-4 font-bold text-emerald-700 bg-amber-50/30">{cp.newWay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Fiyat Özeti Kartı */}
      <section className="mt-10 rounded-3xl bg-white border border-stone-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-orange-600">Şeffaf Fiyatlandırma</p>
            <h2 className="mt-0.5 text-xl sm:text-2xl font-black text-stone-900">Dükkânına Uygun Paketle Hemen Başla</h2>
          </div>
          <a href="/fiyat" className="text-xs font-black text-orange-600 hover:underline">
            Tüm Paket Detayları →
          </a>
        </div>
        <div className="mt-5 grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-stone-200 p-4 flex flex-col justify-between">
            <div>
              <p className="text-xs font-black uppercase text-stone-400">Çırak</p>
              <p className="mt-1 text-2xl font-black text-stone-900">₺0 <span className="text-xs font-bold text-stone-400">/ hep ücretsiz</span></p>
              <p className="mt-1.5 text-xs text-stone-600 font-medium">25 müşteri cari kotası, temel kasa ve ayda 20 online randevu.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                trackCtaClick('Çırak Ücretsiz Başla', `landing_pricing_${content.key}`);
                onRegister();
              }}
              className="mt-4 w-full py-2 rounded-xl border border-stone-300 hover:border-orange-500 text-xs font-black text-stone-800 cursor-pointer"
            >
              Ücretsiz Başla
            </button>
          </div>
          <div className="rounded-2xl border-2 border-amber-400 p-4 flex flex-col justify-between bg-amber-50/20">
            <div>
              <p className="text-xs font-black uppercase text-amber-700">Usta (Tek Koltuk)</p>
              <p className="mt-1 text-2xl font-black text-stone-900">₺249 <span className="text-xs font-bold text-stone-400">/ ay</span></p>
              <p className="mt-1.5 text-xs text-stone-600 font-medium">100 müşteri kotası, ayda 60 randevu, AI tarife okuyucu ve gün sonu.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                trackCtaClick('Usta Paketi Seç', `landing_pricing_${content.key}`);
                onRegister();
              }}
              className="mt-4 w-full py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-black cursor-pointer"
            >
              Usta Paketini Seç
            </button>
          </div>
          <div className="rounded-2xl bg-stone-900 text-white p-4 flex flex-col justify-between">
            <div>
              <p className="text-xs font-black uppercase text-amber-400">Patron VIP</p>
              <p className="mt-1 text-2xl font-black">₺499 <span className="text-xs font-bold text-stone-400">/ ay</span></p>
              <p className="mt-1.5 text-xs text-stone-300 font-medium">Sınırsız müşteri, çoklu usta primi, QR menü ve özel yazılım desteği.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                trackCtaClick('Patron VIP Başlat', `landing_pricing_${content.key}`);
                onRegister();
              }}
              className="mt-4 w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black cursor-pointer"
            >
              Patron VIP Başlat
            </button>
          </div>
        </div>
      </section>

      {/* Müşteri Yorumları */}
      {content.testimonials && content.testimonials.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Kullanan Esnaf Ne Diyor?
          </h2>
          <div className="mt-4 grid sm:grid-cols-3 gap-4">
            {content.testimonials.map((t) => (
              <div key={t.name + t.shopAndCity} className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{t.rating} / 5.0</span>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-stone-700 font-medium leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <p className="text-xs font-black text-stone-900">{t.name}</p>
                  <p className="text-[11px] font-semibold text-stone-500">{t.shopAndCity}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Etkileşimli SSS Akordeonu */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
          Sıkça Sorulan Sorular
        </h2>
        <div className="mt-4 space-y-2.5">
          {content.faq.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={item.q} className="rounded-2xl bg-white border border-stone-200 overflow-hidden">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-stone-50/70 transition-colors"
                >
                  <span className="text-sm font-black text-stone-900">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-stone-600 font-medium leading-relaxed border-t border-stone-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* İlgili Sayfa ve Blog İç Linkleri */}
      {content.relatedLinks && content.relatedLinks.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
            İlgili Sayfalar &amp; Rehber Yazıları
          </h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-3.5">
            {content.relatedLinks.map((lnk) => (
              <a
                key={lnk.href}
                href={lnk.href}
                className="group rounded-2xl bg-white border border-stone-200 p-4 hover:border-orange-400 hover:shadow-md transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-black text-stone-900 group-hover:text-orange-600 transition-colors">
                    {lnk.label}
                  </p>
                  <p className="mt-1 text-xs text-stone-500 font-medium">{lnk.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-orange-600 shrink-0" />
              </a>
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}

const BLOG_CATEGORIES: Array<'Tümü' | BlogArticle['category']> = [
  'Tümü',
  'Randevu & Salon',
  'Veresiye & Kasa',
  'QR Menü & Kafe',
  'İşletme & Vergi',
];

function BlogPage(props: PageProps) {
  const { onRegister } = props;
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/blog';
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/blog';
  const isDetailRoute = cleanPath !== '/blog' && cleanPath.startsWith('/blog/');
  const article = isDetailRoute ? findBlogArticle(cleanPath) : undefined;

  const [selectedCategory, setSelectedCategory] = useState<'Tümü' | BlogArticle['category']>('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  if (isDetailRoute && !article) {
    return (
      <Shell
        title="Blog Yazısı Bulunamadı"
        breadcrumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Esnaf Blogu', href: '/blog' },
          { label: 'Yazı Bulunamadı' },
        ]}
        {...props}
      >
        <div className="rounded-3xl bg-white border border-stone-200 p-8 text-center space-y-4">
          <FileWarning className="w-10 h-10 text-orange-500 mx-auto" />
          <h1 className="text-2xl font-black text-stone-900">Aradığınız Blog Yazısı Bulunamadı</h1>
          <p className="text-sm text-stone-600 font-medium max-w-md mx-auto">
            Bağlantı güncellenmiş olabilir. Tüm esnaf rehberlerimize blog ana sayfasından ulaşabilirsiniz.
          </p>
          <a
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-black hover:bg-orange-600"
          >
            <ArrowLeft className="w-4 h-4" /> Tüm Blog Yazılarına Dön
          </a>
        </div>
      </Shell>
    );
  }

  if (article) {
    const relatedArticles = article.relatedSlugs
      .map((slug) => BLOG_ARTICLES.find((b) => b.slug === slug))
      .filter((b): b is BlogArticle => Boolean(b));
    while (relatedArticles.length < 3) {
      const next = BLOG_ARTICLES.find(
        (b) => b.slug !== article.slug && !relatedArticles.some((r) => r.slug === b.slug)
      );
      if (!next) break;
      relatedArticles.push(next);
    }

    return (
      <Shell
        title={article.seoTitle}
        breadcrumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Esnaf Blogu', href: '/blog' },
          { label: article.title },
        ]}
        ctaTitle={article.relatedProductLabel}
        ctaText="Yazıda okuduklarınızı 2 dakikada dükkanınızda uygulamaya başlayın."
        ctaButton="Ücretsiz Hesap Oluştur"
        {...props}
      >
        <div className="mb-4">
          <a
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Tüm Blog Yazılarına Dön
          </a>
        </div>

        <article className="rounded-3xl bg-white border border-stone-200 overflow-hidden shadow-xs">
          <div className="aspect-[1200/630] max-h-[340px] w-full bg-stone-100 overflow-hidden">
            <img
              src={article.ogImage}
              alt={`${article.h1} — Dükkânım Yanımda Esnaf Blogu`}
              width={1200}
              height={630}
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-10 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-black">
                {article.category}
              </span>
              <span className="inline-flex items-center gap-1 text-stone-500">
                <ClockIcon className="w-3.5 h-3.5" /> {article.readTime}
              </span>
              <span className="text-stone-400">•</span>
              <span className="text-stone-600">
                {article.author} ({article.authorRole})
              </span>
              <span className="text-stone-400">•</span>
              <span className="text-stone-500">Güncelleme: {article.updatedAt}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-stone-900 leading-tight">
              {article.h1}
            </h1>

            <p className="text-base text-stone-700 font-medium leading-relaxed">
              {article.lead}
            </p>

            {/* Kilit Çıkarımlar */}
            <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-5 space-y-2.5">
              <p className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4" /> Kilit Çıkarımlar
              </p>
              <ul className="space-y-2">
                {article.keyTakeaways.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs sm:text-sm font-bold text-stone-800">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Makale Bölümleri */}
            <div className="space-y-8 pt-2">
              {article.sections.map((sec) => (
                <section key={sec.heading} className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                    {sec.heading}
                  </h2>
                  {sec.paragraphs.map((p, i) => (
                    <p key={i} className="text-sm sm:text-[15px] text-stone-700 font-medium leading-relaxed">
                      {p}
                    </p>
                  ))}
                  {sec.bullets && sec.bullets.length > 0 && (
                    <ul className="space-y-2 pt-1">
                      {sec.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-stone-800 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {sec.tip && (
                    <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 text-xs sm:text-sm font-bold text-orange-950">
                      <span className="text-orange-700 uppercase text-[11px] font-black block mb-1">Pratik Esnaf İpucu</span>
                      {sec.tip}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* İlgili Ürün CTA Kartı */}
            <div className="rounded-2xl bg-stone-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  İlgili Dükkânım Yanımda Çözümü
                </p>
                <p className="mt-1 text-lg font-black">{article.relatedProductLabel}</p>
                <p className="mt-1 text-xs text-stone-300 font-medium">
                  Kurulum yok, kredi kartı gerekmez. 2 dakikada ücretsiz deneyin.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 shrink-0">
                <a
                  href={article.relatedProductHref}
                  onClick={() => trackCtaClick(article.relatedProductLabel, `blog_article_${article.slug}`)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition-colors"
                >
                  Sayfayı İncele →
                </a>
                <button
                  type="button"
                  onClick={() => {
                    trackCtaClick('Ücretsiz Dene', `blog_article_${article.slug}`);
                    onRegister();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black cursor-pointer transition-colors"
                >
                  Hemen Başla
                </button>
              </div>
            </div>

            {/* Makale SSS */}
            {article.faq && article.faq.length > 0 && (
              <section className="pt-4">
                <h2 className="text-xl font-black text-stone-900 mb-3">Sıkça Sorulan Sorular</h2>
                <div className="space-y-2.5">
                  {article.faq.map((f, idx) => {
                    const isOpen = openFaqIdx === idx;
                    return (
                      <div key={f.q} className="rounded-2xl border border-stone-200 overflow-hidden">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                          className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-stone-50"
                        >
                          <span className="text-sm font-black text-stone-900">{f.q}</span>
                          <ChevronDown className={`w-4 h-4 text-stone-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 text-sm text-stone-600 font-medium leading-relaxed border-t border-stone-100 pt-3">
                            {f.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </article>

        {/* 3 İlgili Yazı */}
        <section className="mt-10">
          <h2 className="text-xl font-black text-stone-900 mb-4">İlgili Yazılar</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {relatedArticles.slice(0, 3).map((rel) => (
              <a
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                className="group rounded-2xl bg-white border border-stone-200 overflow-hidden hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <img
                    src={rel.ogImage}
                    alt={rel.title}
                    width={1200}
                    height={630}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-4">
                    <span className="text-[10px] font-black uppercase text-orange-600">{rel.category}</span>
                    <p className="mt-1 text-sm font-black text-stone-900 group-hover:text-orange-600 leading-snug">
                      {rel.title}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-3 text-xs font-bold text-orange-600">Devamını Oku →</div>
              </a>
            ))}
          </div>
        </section>
      </Shell>
    );
  }

  // Blog Dizin Sayfası (/blog)
  const filteredArticles = BLOG_ARTICLES.filter((art) => {
    const matchesCat = selectedCategory === 'Tümü' || art.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      art.title.toLowerCase().includes(q) ||
      art.description.toLowerCase().includes(q) ||
      art.primaryKeyword.toLowerCase().includes(q) ||
      art.lead.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <Shell
      title="Esnaf Blogu: Kasa, Veresiye, Randevu & QR Menü Rehberleri"
      breadcrumbs={[
        { label: 'Ana Sayfa', href: '/' },
        { label: 'Esnaf Blogu' },
      ]}
      ctaTitle="Okuduklarını 2 dakikada dükkanında uygula."
      ctaText="Veresiye defteri, online randevu, QR menü ve kasa programını ücretsiz başlat."
      ctaButton="Ücretsiz Dükkanını Aç"
      {...props}
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-black">
        <BookOpen className="w-3.5 h-3.5" />
        Esnaf Blogu · {BLOG_ARTICLES.length} Kapsamlı Rehber
      </div>
      <H1>Esnaf Blogu: Kasa, Veresiye, Randevu ve Büyüme Rehberleri</H1>
      <Lead>
        Mahalle esnafı, berber, kuaför, güzellik merkezi ve kafe işletmecileri için hazırlanmış sahadan pratik kılavuzlar ve işletme yönetimi ipuçları.
      </Lead>

      {/* Arama ve Kategori Filtreleri */}
      <div className="mt-7 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Yazı ara... (örn. veresiye, berber randevu, gün sonu, QR menü, vergi)"
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-stone-200 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-orange-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {BLOG_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  active
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-orange-400'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 12 Yazı Kartı */}
      {filteredArticles.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white border border-stone-200 p-10 text-center text-sm font-bold text-stone-500">
          Aradığınız kritere uygun blog yazısı bulunamadı.
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((art) => (
            <a
              key={art.slug}
              href={`/blog/${art.slug}`}
              className="group rounded-3xl bg-white border border-stone-200 overflow-hidden shadow-2xs hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[1200/630] bg-stone-100 overflow-hidden">
                  <img
                    src={art.ogImage}
                    alt={`${art.title} — Dükkânım Yanımda Blog`}
                    width={1200}
                    height={630}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between text-[11px] font-black text-orange-600 uppercase">
                    <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" /> {art.category}</span>
                    <span className="text-stone-400 font-bold">{art.readTime}</span>
                  </div>
                  <h2 className="mt-2 text-base font-black text-stone-900 group-hover:text-orange-600 leading-snug">
                    {art.title}
                  </h2>
                  <p className="mt-2 text-xs text-stone-600 font-medium line-clamp-3 leading-relaxed">
                    {art.description}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-4 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-stone-500">
                <span>{art.author}</span>
                <span className="text-orange-600 font-black">Oku →</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Popüler Açılış Sayfaları */}
      <section className="mt-12 rounded-3xl bg-white border border-stone-200 p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-wider text-orange-600">Popüler Ürün &amp; Sektör Sayfaları</p>
        <h2 className="mt-1 text-xl font-black text-stone-900">Dükkânım Yanımda Çözümlerini İnceleyin</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {[
            { href: '/veresiye-defteri', label: 'Veresiye Defteri' },
            { href: '/kasa-programi', label: 'Kasa Programı' },
            { href: '/gun-sonu-raporu', label: 'Gün Sonu Raporu' },
            { href: '/qr-menu', label: 'Ücretsiz QR Menü' },
            { href: '/berber', label: 'Berber Randevu' },
            { href: '/kuafor', label: 'Kuaför Programı' },
            { href: '/guzellik-salonu', label: 'Güzellik Salonu' },
            { href: '/randevu-sistemi', label: 'Online Randevu Sistemi' },
            { href: '/izmit-berber-randevu', label: 'İzmit Berber Randevu' },
            { href: '/zonguldak-berber-randevu', label: 'Zonguldak Berber Randevu' },
            { href: '/rehber', label: 'Prim & QR Araçları' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3.5 py-2 rounded-xl bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-xs font-black text-stone-800 hover:text-orange-700 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>
    </Shell>
  );
}

export function NotFoundPage({ onHome, onLogin, onRegister }: PageProps) {
  return (
    <Shell
      title="404 — Sayfa Bulunamadı"
      breadcrumbs={[
        { label: 'Ana Sayfa', href: '/' },
        { label: '404 — Sayfa Bulunamadı' },
      ]}
      onHome={onHome}
      onLogin={onLogin}
      onRegister={onRegister}
    >
      <div className="rounded-3xl bg-white border border-stone-200 p-8 sm:p-12 text-center shadow-xs space-y-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-black">
          <FileWarning className="w-3.5 h-3.5" /> 404 — Sayfa Bulunamadı
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
          Aradığınız Sayfaya Ulaşılamadı
        </h1>
        <p className="text-sm sm:text-base text-stone-600 font-medium max-w-lg mx-auto leading-relaxed">
          Ziyaret etmek istediğiniz adres taşınmış, silinmiş veya hatalı yazılmış olabilir. Aşağıdaki popüler sayfalardan dilediğinize devam edebilirsiniz.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onHome}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-black cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4" /> Ana Sayfaya Dön
          </button>
          <button
            type="button"
            onClick={() => {
              trackCtaClick('404 Ücretsiz Dükkan Aç', 'not_found_page');
              onRegister();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black cursor-pointer transition-colors"
          >
            Ücretsiz Dükkan Aç <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-6 border-t border-stone-100">
          <p className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">
            Popüler Sayfalar
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { href: '/berber', label: 'Berber Randevu' },
              { href: '/kuafor', label: 'Kuaför Programı' },
              { href: '/veresiye-defteri', label: 'Veresiye Defteri' },
              { href: '/kasa-programi', label: 'Kasa Programı' },
              { href: '/gun-sonu-raporu', label: 'Gün Sonu Raporu' },
              { href: '/qr-menu', label: 'QR Menü' },
              { href: '/blog', label: 'Esnaf Blogu' },
              { href: '/rehber', label: 'Esnaf Rehberi' },
              { href: '/fiyat', label: 'Fiyatlar' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3.5 py-2 rounded-xl bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-xs font-bold text-stone-700 hover:text-orange-700 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function PublicPage({
  route,
  onHome,
  onLogin,
  onRegister,
}: {
  route: PublicRouteKey;
  onHome: () => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  const props = { onHome, onLogin, onRegister };
  switch (route) {
    case 'gizlilik':
      return <GizlilikPage {...props} />;
    case 'iletisim':
      return <IletisimPage {...props} />;
    case 'kayit':
      return <KayitPage {...props} />;
    case 'fiyat':
      return <FiyatPage {...props} />;
    case 'rehber':
      return <RehberPage {...props} />;
    case 'blog':
      return <BlogPage {...props} />;
    case 'berber':
    case 'guzellik-salonu':
    case 'kafe-restoran':
    case 'bakkal-market':
    case 'veresiye-defteri':
    case 'kasa-programi':
    case 'gun-sonu-raporu':
    case 'qr-menu':
      return <DeepLandingPage route={route} {...props} />;
    case 'teknik-servis':
    case 'hukuk':
    case 'terzi':
      return <SectorPage route={route} {...props} />;
  }
}
