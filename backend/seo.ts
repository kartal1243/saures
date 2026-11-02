import fs from 'fs';
import path from 'path';
import { getAccounts } from './accounts';
import { loadShopState, slugify } from './shopState';
import { DEMO_ACCOUNT_ID, DEMO_PHONE } from './demoSeed';

export interface SeoMetadata {
  title: string;
  ogTitle: string;
  description: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  schemaJson?: object;
}

export interface ResolvedShop {
  name: string;
  slug: string;
  phone?: string;
  cityDistrict?: string;
  slogan?: string;
  businessField?: string;
  sectorKey?: string;
  isVip?: boolean;
  exists: boolean;
}

const DEFAULT_HOST = 'dukkanimyanimda.com.tr';
const DEFAULT_ORIGIN = `https://${DEFAULT_HOST}`;

/**
 * Identifier (slug, telefon veya accountId) ile dükkanı accounts ve shopState'den bulur.
 */
export function findShopForSeo(identifier: string): ResolvedShop | null {
  const rawId = (identifier || '').toLowerCase().trim();
  if (!rawId) return null;

  const accounts = getAccounts();

  // 1. Hesaplar içinde ID, telefon veya dükkan adı eşleşmesi
  let targetAcc = accounts.find(
    (a) =>
      a.id.toLowerCase() === rawId ||
      a.phone === rawId ||
      slugify(a.shopName) === rawId
  );

  let targetState = targetAcc ? loadShopState(targetAcc.id) : null;

  // 2. State içinde slug veya storeName eşleşmesi
  if (!targetState) {
    for (const a of accounts) {
      const st = loadShopState(a.id);
      const shopSlug = st.shopProfile?.slug || slugify(st.shopProfile?.storeName || a.shopName);
      if (shopSlug === rawId) {
        targetAcc = a;
        targetState = st;
        break;
      }
    }
  }

  // 3. 'demo' fallback'i
  if (!targetState && rawId === 'demo') {
    const fallbackAcc = accounts.find(
      (a) => a.id === DEMO_ACCOUNT_ID || a.phone === DEMO_PHONE || a.phone === '05550000000'
    );
    if (fallbackAcc) {
      targetAcc = fallbackAcc;
      targetState = loadShopState(fallbackAcc.id);
    }
  }

  if (!targetAcc && !targetState) {
    return null;
  }

  const storeName = targetState?.shopProfile?.storeName || targetAcc?.shopName || 'İşletme';
  const computedSlug = targetState?.shopProfile?.slug || slugify(storeName) || rawId;

  return {
    name: storeName,
    slug: computedSlug,
    phone: targetState?.shopProfile?.phone || targetAcc?.phone,
    cityDistrict: targetState?.shopProfile?.cityDistrict,
    slogan: targetState?.shopProfile?.slogan,
    businessField: targetState?.shopProfile?.businessField,
    sectorKey: targetState?.shopProfile?.sectorKey,
    isVip: targetState?.shopProfile?.isVip || false,
    exists: true,
  };
}

/**
 * Verilen rota ve host bilgisine göre en zengin SEO ve Open Graph başlıklarını üretir.
 */
export function getSeoMetadata(pathname: string, rawHost?: string): SeoMetadata {
  const host = rawHost && !rawHost.includes('localhost') && !rawHost.includes('127.0.0.1')
    ? rawHost
    : DEFAULT_HOST;
  const origin = `https://${host}`;

  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  // 1. Randevu rotaları: /r/:slug veya /randevu/:slug
  if (clean.startsWith('/r/') || clean.startsWith('/randevu/')) {
    const slug = clean.replace(/^\/(r|randevu)\/?/, '');
    const shop = findShopForSeo(slug);
    if (shop) {
      const title = `${shop.name} - Online Randevu Al | Dükkanım Yanımda`;
      const ogTitle = `${shop.name} - Kolay Online Randevu`;
      const description = `${shop.name} için sıra beklemeden online randevunuzu hemen oluşturun. Güncel hizmetler, müsait saatler ve anında onay.`;
      const ogDescription = `${shop.name} için sıra beklemeden online randevunuzu hemen oluşturun.`;
      const canonical = `${origin}/r/${shop.slug}`;
      const ogImage = `${origin}/brand/phone_mockup_retina.png`;

      const schemaJson = {
        '@context': 'https://schema.org',
        '@type': 'HealthAndBeautyBusiness',
        name: shop.name,
        url: canonical,
        telephone: shop.phone || undefined,
        description,
        image: ogImage,
        address: shop.cityDistrict
          ? {
              '@type': 'PostalAddress',
              addressLocality: shop.cityDistrict,
              addressCountry: 'TR',
            }
          : undefined,
        priceRange: '₺₺',
      };

      return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson };
    }

    return {
      title: 'Online Randevu Sistemi | Dükkanım Yanımda',
      ogTitle: 'Online Randevu Sistemi — Dükkanım Yanımda',
      description: 'Berber, kuaför ve güzellik salonları için kolay online randevu ve dükkan yönetim sistemi.',
      ogDescription: 'Sıra beklemeden online randevu alın.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical: `${origin}/r/demo`,
    };
  }

  // 2. QR Menü rotaları: /m/:slug veya /menu/:slug veya /menu
  if (clean.startsWith('/m/') || clean.startsWith('/menu/') || clean === '/menu') {
    const slug = clean === '/menu' ? 'demo' : clean.replace(/^\/(m|menu)\/?/, '');
    const shop = findShopForSeo(slug);
    if (shop) {
      const title = `${shop.name} - Dijital QR Menü & Fiyatlar | Dükkanım Yanımda`;
      const ogTitle = `${shop.name} - Dijital Menü`;
      const description = `${shop.name} güncel menü, fiyat listesi ve temassız garson çağırma. Canlı QR menü ile hızlı ve temassız sipariş verin.`;
      const ogDescription = 'Güncel menü, fiyatlar ve masadan garson çağırma.';
      const canonical = `${origin}/m/${shop.slug}`;
      const ogImage = `${origin}/brand/phone_mockup_retina.png`;

      const schemaJson = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: shop.name,
        url: canonical,
        telephone: shop.phone || undefined,
        hasMenu: canonical,
        servesCuisine: 'Türk Mutfağı',
        description,
        image: ogImage,
      };

      return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson };
    }

    return {
      title: 'Canlı Dijital QR Menü & Fiyatlar | Dükkanım Yanımda',
      ogTitle: 'Dijital QR Menü & Garson Çağırma',
      description: 'Kafe ve restoranlar için anlık fiyat güncellemeli, temassız garson çağırmalı canlı dijital QR menü.',
      ogDescription: 'Güncel menü, fiyatlar ve masadan garson çağırma.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical: `${origin}/m/demo`,
    };
  }

  // 3. Sektör Açılış Sayfaları (B2B Esnaf SEO)
  if (clean === '/berber' || clean === '/kuafor') {
    return {
      title: 'Berber & Kuaför Randevu ve Dükkan Yönetim Sistemi | Dükkanım Yanımda',
      ogTitle: 'Berber & Kuaför Randevu ve Dükkan Yönetim Sistemi',
      description: 'Koltuk sırası, online randevu takvimi, çırak/usta prim hesabı ve anlık kasa takibi tek ekranda. Berber ve kuaför esnafı için 2 dakikada hazır.',
      ogDescription: 'Koltuk sırası, online randevu takvimi, çırak/usta prim hesabı ve anlık kasa takibi tek ekranda.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical: `${origin}/berber`,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Berber & Kuaför Randevu Sistemi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
      },
    };
  }

  if (clean === '/kafe-restoran' || clean === '/kafe' || clean === '/restoran') {
    return {
      title: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Sistemi',
      description: 'Canlı masa takibi, garson çağrı sistemli temassız QR menü, adisyon kapatma ve gün sonu ciro raporları. Kurulumsuz, hemen kullanın.',
      ogDescription: 'Canlı masa takibi, garson çağrı sistemli temassız QR menü, adisyon kapatma ve gün sonu ciro raporları.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical: `${origin}/kafe-restoran`,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Kafe & Restoran Adisyon Sistemi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
      },
    };
  }

  if (clean === '/bakkal' || clean === '/market' || clean === '/bakkal-market') {
    return {
      title: 'Bakkal & Market Hızlı POS Barkodlu Terazi ve Veresiye Takip Sistemi | Dükkanım Yanımda',
      ogTitle: 'Bakkal & Market Hızlı POS ve Veresiye Takip Sistemi',
      description: 'Mahallenin veresiye defteri cebinde! Barkodlu hızlı satış, kritik stok uyarıları, WhatsApp ile tek tıkla borç hatırlatma.',
      ogDescription: 'Mahallenin veresiye defteri cebinde! Barkodlu hızlı satış, kritik stok ve WhatsApp hatırlatma.',
      ogImage: `${origin}/brand/logo-horizontal.png`,
      canonical: `${origin}/bakkal-market`,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Bakkal & Market POS Sistemi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
      },
    };
  }

  if (clean === '/teknik-servis' || clean === '/servis') {
    return {
      title: 'Teknik Servis Cihaz Takip ve Tamir Fişi Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Teknik Servis Cihaz ve Müşteri Takip Sistemi',
      description: 'Cihaz kabul fişi, parça ve işçilik maliyeti, teslimat takibi ve kasa yönetimi tek panelde.',
      ogDescription: 'Cihaz kabul fişi, parça ve işçilik maliyeti, teslimat takibi ve kasa yönetimi.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical: `${origin}/teknik-servis`,
    };
  }

  if (clean === '/hukuk' || clean === '/avukat') {
    return {
      title: 'Avukat ve Hukuk Bürosu Dava Takip ve Masraf Yönetim Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Avukat & Hukuk Bürosu Dava ve Müvekkil Cari Takip Sistemi',
      description: 'Duruşma takvimi, dava dosyaları, müvekkil masraf ve avans takibi tek ekranda.',
      ogDescription: 'Duruşma takvimi, dava dosyaları, müvekkil masraf ve avans takibi tek ekranda.',
      ogImage: `${origin}/brand/logo-horizontal.png`,
      canonical: `${origin}/hukuk`,
    };
  }

  if (clean === '/terzi') {
    return {
      title: 'Terzi & Kuru Temizleme Emanet Takip ve Kasa Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Terzi & Kuru Temizleme Emanet Takip Sistemi',
      description: 'Bırakılan kıyafet emanet fişleri, prova tarihleri ve anlık kasa yönetimi tek ekranda.',
      ogDescription: 'Bırakılan kıyafet emanet fişleri, prova tarihleri ve anlık kasa yönetimi.',
      ogImage: `${origin}/brand/logo-horizontal.png`,
      canonical: `${origin}/terzi`,
    };
  }

  // 4. Sabit Bilgi ve İşlem Sayfaları
  if (clean === '/fiyat' || clean === '/fiyatlandirma') {
    return {
      title: 'Fiyatlandırma & Esnaf Paketleri | Dükkanım Yanımda',
      ogTitle: 'Esnaf İçin En Uygun Yönetim Paketleri',
      description: 'Ücretsiz başlangıç, Çırak, Usta ve Patron VIP paketleri. Kredi kartsız hemen deneyin.',
      ogDescription: 'Esnaf için en uygun yönetim paketleri. Ücretsiz başlayın.',
      ogImage: `${origin}/brand/logo-horizontal.png`,
      canonical: `${origin}/fiyat`,
    };
  }

  if (clean === '/kayit') {
    return {
      title: 'Ücretsiz Dükkanını Kur — 2 Dakikada Başla | Dükkanım Yanımda',
      ogTitle: 'Dükkanını 2 Dakikada Kur — Ücretsiz Başla',
      description: 'Kredi kartı yok, kurulum yok. Telefon numaranla kaydol, kasanı ve veresiye defterini hemen yönetmeye başla.',
      ogDescription: 'Kredi kartı gerekmez. Dükkanını 2 dakikada ücretsiz kur.',
      ogImage: `${origin}/brand/logo-horizontal.png`,
      canonical: `${origin}/kayit`,
    };
  }

  if (clean === '/iletisim') {
    return {
      title: 'İletişim & Destek | Dükkanım Yanımda',
      ogTitle: 'İletişim & Destek — Dükkanım Yanımda',
      description: 'Dükkânım Yanımda iletişim ve esnaf destek hattı. Sorularınız ve önerileriniz için bize ulaşın.',
      ogDescription: 'Esnaf destek ve iletişim hattı.',
      ogImage: `${origin}/icon-512.png`,
      canonical: `${origin}/iletisim`,
    };
  }

  if (clean === '/gizlilik' || clean === '/gizlilik-politikasi') {
    return {
      title: 'Gizlilik Politikası & KVKK | Dükkanım Yanımda',
      ogTitle: 'Gizlilik Politikası & KVKK Güvencesi',
      description: 'Verileriniz güvende. Dükkan defteriniz ve müşteri bilgileriniz şifreli saklanır ve sadece size aittir.',
      ogDescription: 'Kişisel verileriniz ve dükkan kayıtlarınız %100 güvende.',
      ogImage: `${origin}/icon-512.png`,
      canonical: `${origin}/gizlilik`,
    };
  }

  // 5. Genel Ana Sayfa (Default /)
  return {
    title: 'Dükkânım Yanımda — Kasa, Veresiye, Randevu ve Gün Sonu Sistemi',
    ogTitle: 'Dükkânım Yanımda — Esnaf Yönetim Sistemi',
    description: 'Dükkanının kasa, veresiye defteri, randevu takvimi, QR menüsü ve gün sonu defteri — hepsi tek yerde cebinizde.',
    ogDescription: 'Dükkanının kasa, veresiye, stok ve gün sonu defteri — hepsi tek yerde.',
    ogImage: `${origin}/brand/phone_mockup_retina.png`,
    canonical: `${origin}/`,
    schemaJson: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'Dükkanım Yanımda',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
          description: 'Esnaf için online randevu, QR menü, kasa, veresiye defteri ve gün sonu takip sistemi.',
        },
        {
          '@type': 'Organization',
          name: 'Dükkanım Yanımda',
          url: `${origin}/`,
          logo: `${origin}/icon-512.png`,
          description: 'Esnaf için kasa, veresiye defteri, stok ve gün sonu yönetim paneli.',
        },
      ],
    },
  };
}

let cachedIndexHtml: string | null = null;

/**
 * Bellekteki HTML şablon önbelleğini sıfırlar (dosya güncellendiğinde).
 */
export function invalidateHtmlCache(): void {
  cachedIndexHtml = null;
}

/**
 * dist/index.html dosyasını diskten yalnızca ilk seferde okur (memory cache).
 */
export function getBaseHtmlTemplate(): string {
  if (cachedIndexHtml) {
    return cachedIndexHtml;
  }

  const distPath = path.join(process.cwd(), 'dist', 'index.html');
  const frontendPath = path.join(process.cwd(), 'frontend', 'index.html');

  if (fs.existsSync(distPath)) {
    cachedIndexHtml = fs.readFileSync(distPath, 'utf-8');
  } else if (fs.existsSync(frontendPath)) {
    cachedIndexHtml = fs.readFileSync(frontendPath, 'utf-8');
  } else {
    cachedIndexHtml = '<!doctype html><html lang="tr"><head><title>Dükkanım Yanımda</title></head><body><div id="root"></div></body></html>';
  }

  return cachedIndexHtml;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Verilen rota için dinamik meta ve Open Graph etiketlerini HTML'e enjekte eder.
 */
export function renderSeoHtml(pathname: string, host?: string, customTemplate?: string): string {
  const baseHtml = customTemplate || getBaseHtmlTemplate();
  const meta = getSeoMetadata(pathname, host);

  let html = baseHtml;

  // <title>
  if (html.includes('<title>')) {
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  } else {
    html = html.replace('</head>', `<title>${escapeHtml(meta.title)}</title></head>`);
  }

  // <meta name="description" ...>
  const descTag = `<meta name="description" content="${escapeHtml(meta.description)}" />`;
  if (/name="description"/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, descTag);
  } else {
    html = html.replace('</head>', `${descTag}\n</head>`);
  }

  // <meta property="og:title" ...>
  const ogTitleTag = `<meta property="og:title" content="${escapeHtml(meta.ogTitle || meta.title)}" />`;
  if (/property="og:title"/i.test(html)) {
    html = html.replace(/<meta\s+property=["']og:title["'][^>]*>/i, ogTitleTag);
  } else {
    html = html.replace('</head>', `${ogTitleTag}\n</head>`);
  }

  // <meta property="og:description" ...>
  const ogDescTag = `<meta property="og:description" content="${escapeHtml(meta.ogDescription || meta.description)}" />`;
  if (/property="og:description"/i.test(html)) {
    html = html.replace(/<meta\s+property=["']og:description["'][^>]*>/i, ogDescTag);
  } else {
    html = html.replace('</head>', `${ogDescTag}\n</head>`);
  }

  // <meta property="og:url" ...>
  const ogUrlTag = `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`;
  if (/property="og:url"/i.test(html)) {
    html = html.replace(/<meta\s+property=["']og:url["'][^>]*>/i, ogUrlTag);
  } else {
    html = html.replace('</head>', `${ogUrlTag}\n</head>`);
  }

  // <link rel="canonical" ...>
  const canonicalTag = `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`;
  if (/rel="canonical"/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `${canonicalTag}\n</head>`);
  }

  // <meta property="og:image" ...>
  const ogImageTag = `<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`;
  if (/property="og:image"/i.test(html)) {
    html = html.replace(/<meta\s+property=["']og:image["'][^>]*>/i, ogImageTag);
  } else {
    html = html.replace('</head>', `${ogImageTag}\n</head>`);
  }

  // <meta name="twitter:title" ...>
  const twitterTitleTag = `<meta name="twitter:title" content="${escapeHtml(meta.ogTitle || meta.title)}" />`;
  if (/name="twitter:title"/i.test(html)) {
    html = html.replace(/<meta\s+name=["']twitter:title["'][^>]*>/i, twitterTitleTag);
  } else {
    html = html.replace('</head>', `${twitterTitleTag}\n</head>`);
  }

  // <meta name="twitter:description" ...>
  const twitterDescTag = `<meta name="twitter:description" content="${escapeHtml(meta.ogDescription || meta.description)}" />`;
  if (/name="twitter:description"/i.test(html)) {
    html = html.replace(/<meta\s+name=["']twitter:description["'][^>]*>/i, twitterDescTag);
  } else {
    html = html.replace('</head>', `${twitterDescTag}\n</head>`);
  }

  // <meta name="twitter:image" ...>
  const twitterImageTag = `<meta name="twitter:image" content="${escapeHtml(meta.ogImage)}" />`;
  if (/name="twitter:image"/i.test(html)) {
    html = html.replace(/<meta\s+name=["']twitter:image["'][^>]*>/i, twitterImageTag);
  } else {
    html = html.replace('</head>', `${twitterImageTag}\n</head>`);
  }

  // JSON-LD Structured Data Injection
  if (meta.schemaJson) {
    const jsonLdTag = `\n    <script type="application/ld+json">\n    ${JSON.stringify(meta.schemaJson, null, 2)}\n    </script>\n`;
    html = html.replace('</head>', `${jsonLdTag}</head>`);
  }

  return html;
}

/**
 * Dinamik ve taranabilir sitemap.xml üretir.
 * Sistemdeki tüm kayıtlı dükkanların randevu ve menü sayfalarını Google Bot'a bildirir.
 */
export function generateSitemapXml(rawHost?: string): string {
  const host = rawHost && !rawHost.includes('localhost') && !rawHost.includes('127.0.0.1')
    ? rawHost
    : DEFAULT_HOST;
  const origin = `https://${host}`;
  const today = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: `${origin}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${origin}/fiyat`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${origin}/kayit`, priority: '0.9', changefreq: 'monthly' },
    { loc: `${origin}/berber`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${origin}/kuafor`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${origin}/kafe-restoran`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${origin}/bakkal-market`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${origin}/bakkal`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${origin}/market`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${origin}/teknik-servis`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${origin}/hukuk`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${origin}/terzi`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${origin}/iletisim`, priority: '0.6', changefreq: 'monthly' },
    { loc: `${origin}/gizlilik`, priority: '0.4', changefreq: 'yearly' },
  ];

  // Aktif dükkanların dinamik linkleri
  const shopUrls: { loc: string; priority: string; changefreq: string }[] = [];
  const accounts = getAccounts();
  const seenSlugs = new Set<string>();

  // Demo hesap da eklensin
  seenSlugs.add('demo');
  shopUrls.push(
    { loc: `${origin}/r/demo`, priority: '0.8', changefreq: 'daily' },
    { loc: `${origin}/m/demo`, priority: '0.8', changefreq: 'daily' }
  );

  for (const acc of accounts) {
    try {
      const st = loadShopState(acc.id);
      const slug = st.shopProfile?.slug || slugify(st.shopProfile?.storeName || acc.shopName);
      if (slug && !seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        shopUrls.push(
          { loc: `${origin}/r/${slug}`, priority: '0.7', changefreq: 'daily' },
          { loc: `${origin}/m/${slug}`, priority: '0.7', changefreq: 'daily' }
        );
      }
    } catch {
      // Hata durumunda atla
    }
  }

  const allUrls = [...staticUrls, ...shopUrls];

  const xmlEntries = allUrls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;
}

/**
 * Temiz ve arama motorları dostu robots.txt içeriği döner.
 */
export function getRobotsTxt(rawHost?: string): string {
  const host = rawHost && !rawHost.includes('localhost') && !rawHost.includes('127.0.0.1')
    ? rawHost
    : DEFAULT_HOST;
  const origin = `https://${host}`;

  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /data/

Sitemap: ${origin}/sitemap.xml
`;
}
