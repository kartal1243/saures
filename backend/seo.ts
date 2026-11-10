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
  robots?: string;
  schemaJson?: object;
  breadcrumbs?: { name: string; url: string }[];
  faqJson?: { q: string; a: string }[];
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
  openingTime?: string;
  closingTime?: string;
  closedDays?: number[];
}

const DEFAULT_HOST = 'dukkanimyanimda.com.tr';
const DEFAULT_ORIGIN = `https://${DEFAULT_HOST}`;

/**
 * Güncel yıl, ay ve mevsimsel esnaf yoğunluğu bağlamını dinamik üretir (Google Freshness).
 */
export function getDynamicSeoFreshness(customDate?: Date) {
  const d = customDate || new Date();
  const year = d.getFullYear();
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  const month = monthNames[d.getMonth()];
  const monthNum = d.getMonth() + 1;

  let season = 'Yeni Sezon';
  let seasonalKeyword = 'Yoğun Randevu ve Koltuk Sezonu';

  if (monthNum >= 3 && monthNum <= 5) {
    season = 'İlkbahar Düğün & Nişan Sezonu';
    seasonalKeyword = 'Gelin Başı ve Damat Tıraşı Randevu Yoğunluğu';
  } else if (monthNum >= 6 && monthNum <= 8) {
    season = 'Yaz & Mezuniyet Sezonu';
    seasonalKeyword = 'Yaz Bakımı ve Tatil Öncesi Randevu Akışı';
  } else if (monthNum >= 9 && monthNum <= 11) {
    season = 'Sonbahar & Kış Hazırlığı';
    seasonalKeyword = 'Okul & İş Sezonu Düzenli Bakım Randevuları';
  } else {
    season = 'Yılbaşı & Kış Sezonu';
    seasonalKeyword = 'Yılbaşı Yoğunluğu ve Yeni Yıl Fiyat Tarifesi';
  }

  const todayIso = d.toISOString().split('T')[0];
  return { year, month, season, seasonalKeyword, todayIso };
}

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
    openingTime: targetState?.barberSettings?.openingTime || '09:00',
    closingTime: targetState?.barberSettings?.closingTime || '21:00',
    closedDays: targetState?.barberSettings?.closedDays || [0],
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
  const fresh = getDynamicSeoFreshness();

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
        priceRange: '₺₺',
        acceptsReservations: 'True',
        address: {
          '@type': 'PostalAddress',
          addressLocality: shop.cityDistrict || 'Türkiye',
          addressCountry: 'TR',
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: shop.openingTime || '09:00',
            closes: shop.closingTime || '21:00',
          },
        ],
      };

      const breadcrumbs = [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Online Randevu', url: `${origin}/berber` },
        { name: shop.name, url: canonical },
      ];

      return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs };
    }

    const isDemoSlug = slug === 'demo';
    return {
      title: 'Online Randevu Sistemi | Dükkanım Yanımda',
      ogTitle: 'Online Randevu Sistemi — Dükkanım Yanımda',
      description: 'Berber, kuaför ve güzellik salonları için kolay online randevu ve dükkan yönetim sistemi.',
      ogDescription: 'Sıra beklemeden online randevu alın.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical: isDemoSlug ? `${origin}/r/demo` : `${origin}/randevu-sistemi`,
      robots: isDemoSlug ? undefined : 'noindex, follow',
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Online Randevu', url: `${origin}/randevu-sistemi` },
      ],
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
        priceRange: '₺₺',
        acceptsReservations: 'True',
        address: {
          '@type': 'PostalAddress',
          addressLocality: shop.cityDistrict || 'Türkiye',
          addressCountry: 'TR',
        },
      };

      const breadcrumbs = [
        { name: 'Ana Sayfa', url: origin },
        { name: 'QR Menü', url: `${origin}/kafe-restoran` },
        { name: shop.name, url: canonical },
      ];

      return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs };
    }

    const isDemoSlug = slug === 'demo';
    return {
      title: 'Canlı Dijital QR Menü & Fiyatlar | Dükkanım Yanımda',
      ogTitle: 'Dijital QR Menü & Garson Çağırma',
      description: 'Kafe ve restoranlar için anlık fiyat güncellemeli, temassız garson çağırmalı canlı dijital QR menü.',
      ogDescription: 'Güncel menü, fiyatlar ve masadan garson çağırma.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical: isDemoSlug ? `${origin}/m/demo` : `${origin}/kafe-restoran`,
      robots: isDemoSlug ? undefined : 'noindex, follow',
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'QR Menü', url: `${origin}/kafe-restoran` },
      ],
    };
  }

  // 3. Sektör Açılış Sayfaları (B2B Esnaf SEO)
  if (
    clean === '/berber' ||
    clean === '/kuafor' ||
    clean === '/kuafor-randevu' ||
    clean === '/kadin-kuafor' ||
    clean === '/berber-randevu-programi'
  ) {
    const isKuaf = clean.includes('kuafor');
    const title = 'Berber & Kuaför Randevu ve Dükkan Yönetim Sistemi | Dükkanım Yanımda';
    const ogTitle = `Berber & Kuaför Randevu ve Koltuk Takip Sistemi (${fresh.year})`;
    const description = `Koltuk sırası, online randevu takvimi, çırak/usta prim hesabı ve anlık kasa takibi tek ekranda. ${fresh.month} ${fresh.year} güncel sürüm. ${fresh.seasonalKeyword} için hazır. Berber ve kuaför esnafı için 2 dakikada hazır.`;
    const ogDescription = 'Koltuk sırası, online randevu takvimi, çırak/usta prim hesabı ve anlık kasa takibi tek ekranda.';
    const canonical = `${origin}/${isKuaf ? 'kuafor' : 'berber'}`;
    const ogImage = `${origin}/brand/phone_mockup_retina.png`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Dükkanım Yanımda - Berber & Kuaför Randevu Sistemi',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '1480',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Koltuk Sırası & Randevu Takvimi',
        'Usta ve Çırak Prim Dağılımı',
        'Canlı Online Müşteri Randevusu',
        'WhatsApp Otomatik Hatırlatma',
        'Hızlı Kasa & Veresiye Takibi',
      ],
    };

    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Berber & Kuaför Randevu Sistemi', url: canonical },
    ];

    const faqJson = [
      {
        q: 'Berber ve kuaförler için online randevu sistemi nasıl çalışır?',
        a: 'Dükkanınıza özel randevu linkini Instagram profilinize ve WhatsApp hattınıza eklersiniz. Müşterileriniz boş saatleri görerek anında randevu oluşturur, bildirim doğrudan ekranınıza düşer.',
      },
      {
        q: 'Koltuk ve usta primleri otomatik hesaplanır mı?',
        a: 'Evet! Her usta, kalfa ve çırağın komisyon oranına göre gün sonu hakediş ve primler kuruşu kuruşuna otomatik hesaplanır.',
      },
      {
        q: 'Müşterilere randevu öncesi otomatik WhatsApp hatırlatması gider mi?',
        a: 'Evet, gelmeme (no-show) durumlarını engellemek için müşterilerinize tek tıkla WhatsApp randevu hatırlatma mesajı gönderebilirsiniz.',
      },
      {
        q: 'Program telefondan ve tabletten kullanılabilir mi?',
        a: 'Evet, mobil uyumludur; dükkanda tek elle veya kasadaki tabletten kolayca kullanılır.',
      },
    ];

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs, faqJson };
  }

  if (
    clean === '/guzellik-salonu' ||
    clean === '/guzellik-merkezi' ||
    clean === '/guzellik' ||
    clean === '/lazer-epilasyon'
  ) {
    const title = `Güzellik Salonu ve Merkez Yönetim Sistemi — Seans & Paket Takibi (${fresh.year}) | Dükkanım Yanımda`;
    const ogTitle = `Güzellik Salonu ve Seans Takip Sistemi (${fresh.year})`;
    const description = `Güzellik merkezleri için seans ve paket takibi, lazer epilasyon randevu defteri, estetisyen kabin planlaması ve otomatik WhatsApp hatırlatma. ${fresh.month} ${fresh.year} güncel sürüm. 2 dakikada ücretsiz başlayın.`;
    const ogDescription = 'Seans ve paket takibi, estetisyen randevu defteri, kabin planlaması ve WhatsApp hatırlatma tek ekranda.';
    const canonical = `${origin}/guzellik-salonu`;
    const ogImage = `${origin}/brand/phone_mockup_retina.png`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Dükkanım Yanımda - Güzellik Salonu ve Seans Takip Sistemi',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '980',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Seans ve Paket Sayacı (6-8 Seans)',
        'Estetisyen ve Kabin/Cihaz Takvimi',
        'Canlı Online Randevu Linki',
        'WhatsApp Otomatik Seans Hatırlatma',
        'Kasa & Personel Prim Hesabı',
      ],
    };

    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Güzellik Salonu ve Seans Takip', url: canonical },
    ];

    const faqJson = [
      {
        q: 'Güzellik salonlarında seans ve paket takibi nasıl yapılır?',
        a: 'Müşteriye 6 veya 8 seanslık paket tanımlanır. Her randevuda tek tıkla 1 seans düşülür, kalan seans sayısı ve borç durumu anında ekranda görünür.',
      },
      {
        q: 'Estetisyen ve cihaz/kabin çakışması engellenir mi?',
        a: 'Evet, hangi uzmanın hangi odada veya cihazda olduğu canlı takvimde renklerle ayrılır; çakışan randevular sistem tarafından anında önlenir.',
      },
      {
        q: 'Müşteriler randevuyu Instagram veya WhatsApp üzerinden alabilir mi?',
        a: 'Evet, salonunuza özel online randevu linkinizi Instagram biyografinize ekleyebilirsiniz. Müşterileriniz boş saatleri görerek randevusunu hemen oluşturur.',
      },
    ];

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs, faqJson };
  }

  if (clean === '/randevu-sistemi' || clean === '/online-randevu') {
    const title = `Online Randevu Sistemi — Berber, Kuaför ve Güzellik Salonu (${fresh.year}) | Dükkanım Yanımda`;
    const ogTitle = `Canlı Online Randevu ve Salon Takip Sistemi (${fresh.year})`;
    const description = `Sıra beklemeden online randevu alma ve müşteri takip sistemi. Berber, kuaför ve güzellik salonları için ücretsiz canlı randevu motoru. ${fresh.month} ${fresh.year} güncel.`;
    const ogDescription = 'Sıra beklemeden online randevu alma ve müşteri takip sistemi.';
    const canonical = `${origin}/randevu-sistemi`;
    const ogImage = `${origin}/brand/phone_mockup_retina.png`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Dükkanım Yanımda - Online Randevu Sistemi',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '1480',
        bestRating: '5',
        worstRating: '1',
      },
    };

    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Online Randevu Sistemi', url: canonical },
    ];

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs };
  }

  if (
    clean === '/kafe-restoran' ||
    clean === '/kafe' ||
    clean === '/restoran' ||
    clean === '/adisyon' ||
    clean === '/qr-menu'
  ) {
    const canonical = `${origin}/kafe-restoran`;
    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Kafe & Restoran Adisyon Sistemi', url: canonical },
    ];
    const faqJson = [
      {
        q: 'Kafe ve restoranlarda canlı masa ve adisyon takibi nasıl yapılır?',
        a: 'Masalarınızı salona göre yerleştirin. Müşteri oturduğunda tek tıkla adisyon açın, siparişleri ekleyin, kalkarken nakit veya kartla kapatın.',
      },
      {
        q: 'Temassız dijital QR menü ve garson çağırma nasıl çalışır?',
        a: 'Masalarınıza özel karekodları yapıştırın. Müşteri kamerasını okuttuğunda menüyü görür ve tek tıkla garson veya hesap çağırabilir.',
      },
      {
        q: 'Gün sonu ciro ve kasa raporları anlık görünür mü?',
        a: 'Evet, kasanızdaki nakit ve kredi kartı cirosu, açık masalar ve en çok satan ürünler gün sonunda kuruşu kuruşuna tek ekranda raporlanır.',
      },
      {
        q: 'Sistem tablet veya telefondan kurulumsuz çalışır mı?',
        a: 'Evet, hiçbir donanım veya karmaşık POS cihazı gerektirmez; mevcut telefonunuzdan veya tabletinizden tarayıcıyla anında çalışır.',
      },
    ];

    return {
      title: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Sistemi',
      description: 'Canlı masa takibi, garson çağrı sistemli temassız QR menü, adisyon kapatma ve gün sonu ciro raporları. Kurulumsuz, hemen kullanın.',
      ogDescription: 'Canlı masa takibi, garson çağrı sistemli temassız QR menü, adisyon kapatma ve gün sonu ciro raporları.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical,
      breadcrumbs,
      faqJson,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Kafe & Restoran Adisyon Sistemi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '870',
          bestRating: '5',
          worstRating: '1',
        },
      },
    };
  }

  if (
    clean === '/bakkal' ||
    clean === '/market' ||
    clean === '/bakkal-market' ||
    clean === '/veresiye-defteri' ||
    clean === '/pos-sistemi'
  ) {
    const canonical = `${origin}/bakkal-market`;
    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Bakkal & Market POS Sistemi', url: canonical },
    ];
    const faqJson = [
      {
        q: 'Bakkal veresiye defteri telefondan nasıl tutulur?',
        a: 'Müşterinizi bir kez kaydedin. Aldığı ürünleri veya toplam tutarı tek tuşla borcuna yazın. Bakiyesi ve hesap dökümü cebinizde her an hazırdır.',
      },
      {
        q: 'Müşteriye tek tıkla WhatsApp borç özeti nasıl gönderilir?',
        a: 'Müşteri detayından "WhatsApp ile Hatırlat" butonuna bastığınızda, kibar bir dille son işlemler ve kalan borç tutarı otomatik mesaj olarak hazırlanır.',
      },
      {
        q: 'Barkod okuyucu olmadan telefon kamerasıyla satış yapılır mı?',
        a: 'Evet, telefon kamerası barkod okuyucu olarak kullanılır; barkodu okutulan ürün anında sepete eklenir.',
      },
      {
        q: 'Terazili ürünler ve gramajlı satış destekleniyor mu?',
        a: 'Evet, manav ve şarküteri ürünlerinde gramaj preseti veya ondalıklı kilo girişiyle anlık hesaplama yapılır.',
      },
    ];

    return {
      title: 'Bakkal & Market Hızlı POS Barkodlu Terazi ve Veresiye Takip Sistemi | Dükkanım Yanımda',
      ogTitle: 'Bakkal & Market Hızlı POS ve Veresiye Takip Sistemi',
      description: 'Mahallenin veresiye defteri cebinde! Barkodlu hızlı satış, kritik stok uyarıları, WhatsApp ile tek tıkla borç hatırlatma.',
      ogDescription: 'Mahallenin veresiye defteri cebinde! Barkodlu hızlı satış, kritik stok ve WhatsApp hatırlatma.',
      ogImage: `${origin}/brand/logo-horizontal.png`,
      canonical,
      breadcrumbs,
      faqJson,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Bakkal & Market POS Sistemi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '1120',
          bestRating: '5',
          worstRating: '1',
        },
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
    const canonical = `${origin}/fiyat`;
    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Fiyatlandırma & Esnaf Paketleri', url: canonical },
    ];
    const faqJson = [
      {
        q: 'Dükkânım Yanımda uygulamasını ücretsiz kullanabilir miyim?',
        a: 'Evet! Çırak paketi ₺0 olup kredi kartı istemez; 25 müşteri, 3 masa ve ayda 20 ücretsiz online randevu ile hemen kullanmaya başlayabilirsiniz.',
      },
      {
        q: 'Usta ve Patron VIP paketleri neleri içerir?',
        a: 'Usta paketi tek koltuk çalışan esnaflar için sınırsız müşteri ve sınırsız randevu sunar. Patron VIP ise çoklu personel primi, canlı QR menü, garson çağrı ve aylık 500 otomatik WhatsApp bildirimi sunar.',
      },
      {
        q: 'İstediğim zaman paketimi iptal edebilir miyim?',
        a: 'Evet, taahhüt veya sözleşme yoktur. Dilediğiniz an üyeliğinizi sonlandırabilirsiniz.',
      },
    ];

    return {
      title: 'Fiyatlandırma & Esnaf Paketleri | Dükkanım Yanımda',
      ogTitle: 'Esnaf İçin En Uygun Yönetim Paketleri',
      description: 'Ücretsiz başlangıç, Çırak, Usta ve Patron VIP paketleri. Kredi kartsız hemen deneyin.',
      ogDescription: 'Esnaf için en uygun yönetim paketleri. Ücretsiz başlayın.',
      ogImage: `${origin}/brand/logo-horizontal.png`,
      canonical,
      breadcrumbs,
      faqJson,
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
let cachedMtimeMs: number = 0;

/**
 * Bellekteki HTML şablon önbelleğini sıfırlar (dosya güncellendiğinde).
 */
export function invalidateHtmlCache(): void {
  cachedIndexHtml = null;
  cachedMtimeMs = 0;
}

/**
 * dist/index.html dosyasını diskten mtime kontrolüyle okur (dosya değiştiğinde otomatik güncellenir).
 */
export function getBaseHtmlTemplate(): string {
  const candidates = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(process.cwd(), 'dist', 'index.html'),
    '/var/www/dukkanim/dist/index.html',
    path.join(process.cwd(), 'frontend', 'index.html'),
  ];

  let targetPath: string | null = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (targetPath) {
    try {
      const stat = fs.statSync(targetPath);
      if (cachedIndexHtml && stat.mtimeMs === cachedMtimeMs) {
        return cachedIndexHtml;
      }
      cachedIndexHtml = fs.readFileSync(targetPath, 'utf-8');
      cachedMtimeMs = stat.mtimeMs;
      return cachedIndexHtml;
    } catch {
      // Fallback below
    }
  }

  if (cachedIndexHtml) {
    return cachedIndexHtml;
  }

  return '<!doctype html><html lang="tr"><head><title>Dükkanım Yanımda</title></head><body><div id="root"></div></body></html>';
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

  // <meta name="robots" ...>
  const robotsContent = meta.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const robotsTag = `<meta name="robots" content="${escapeHtml(robotsContent)}" />`;
  if (/name=["']robots["']/i.test(html)) {
    html = html.replace(/<meta\s+name=["']robots["'][^>]*>/i, robotsTag);
  } else {
    html = html.replace('</head>', `${robotsTag}\n</head>`);
  }

  // JSON-LD Structured Data Injection
  if (meta.schemaJson) {
    const jsonLdTag = `\n    <script type="application/ld+json">\n    ${JSON.stringify(meta.schemaJson, null, 2)}\n    </script>\n`;
    html = html.replace('</head>', `${jsonLdTag}</head>`);
  }

  // Google Search BreadcrumbList JSON-LD Injection
  if (meta.breadcrumbs && meta.breadcrumbs.length > 0) {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: meta.breadcrumbs.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: b.name,
        item: b.url,
      })),
    };
    const breadcrumbTag = `\n    <script type="application/ld+json">\n    ${JSON.stringify(breadcrumbSchema, null, 2)}\n    </script>\n`;
    html = html.replace('</head>', `${breadcrumbTag}</head>`);
  }

  // Google Search FAQPage JSON-LD Injection (Rich Snippet Accordion)
  if (meta.faqJson && meta.faqJson.length > 0) {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: meta.faqJson.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.a,
        },
      })),
    };
    const faqTag = `\n    <script type="application/ld+json">\n    ${JSON.stringify(faqSchema, null, 2)}\n    </script>\n`;
    html = html.replace('</head>', `${faqTag}</head>`);
  }

  return html;
}

function isExcludedAccount(acc: { id: string; shopName?: string; phone?: string }): boolean {
  const p = (acc.phone || '').replace(/\D/g, '');
  if (['0500', '0501', '0502', '0503', '0504', '0505', '0506', '0507', '0508', '0509', '0512'].some((prefix) => p.startsWith(prefix))) {
    return true;
  }
  const name = (acc.shopName || '').toLowerCase();
  const id = (acc.id || '').toLowerCase();
  if (
    name.includes('test') ||
    name.includes('güvenlik') ||
    name.includes('guvenlik') ||
    name.includes('kilit') ||
    name.includes('izolasyon') ||
    name.includes('ws dukkan')
  ) {
    return true;
  }
  if (id.includes('test') || id.includes('ws_')) return true;
  return false;
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
    { loc: `${origin}/`, priority: '1.0', changefreq: 'weekly', title: 'Dükkânım Yanımda - Esnaf Yönetim Sistemi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/berber`, priority: '1.0', changefreq: 'daily', title: 'Berber & Kuaför Randevu ve Dükkan Yönetim Sistemi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/kuafor`, priority: '0.95', changefreq: 'daily', title: 'Kuaför Randevu ve Salon Takip Yazılımı', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/kuafor-randevu`, priority: '0.9', changefreq: 'daily', title: 'Online Kuaför Randevu Alma ve Koltuk Yönetimi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/berber-randevu-programi`, priority: '0.9', changefreq: 'daily', title: 'Berber Randevu Programı ve Koltuk Sırası Defteri', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/kadin-kuafor`, priority: '0.9', changefreq: 'daily', title: 'Kadın Kuaförü Randevu ve Müşteri Defteri', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/guzellik-salonu`, priority: '1.0', changefreq: 'daily', title: 'Güzellik Salonu ve Merkez Yönetim Sistemi — Seans & Paket Takibi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/guzellik-merkezi`, priority: '0.9', changefreq: 'daily', title: 'Güzellik Merkezi Lazer Epilasyon ve Seans Takip Programı', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/lazer-epilasyon`, priority: '0.9', changefreq: 'daily', title: 'Lazer Epilasyon Seans ve Müşteri Takip Programı', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/randevu-sistemi`, priority: '0.95', changefreq: 'daily', title: 'Online Randevu Sistemi — Berber, Kuaför ve Güzellik Salonu', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/online-randevu`, priority: '0.9', changefreq: 'daily', title: 'Canlı Online Randevu Alma ve Müşteri Toplama Sistemi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/kafe-restoran`, priority: '0.95', changefreq: 'weekly', title: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Yazılımı', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/kafe`, priority: '0.9', changefreq: 'weekly', title: 'Kafe Masa ve Adisyon Takip Programı', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/restoran`, priority: '0.9', changefreq: 'weekly', title: 'Restoran Adisyon ve Garson Çağırma Sistemi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/adisyon`, priority: '0.9', changefreq: 'weekly', title: 'Ücretsiz Kafe Restoran Adisyon Programı', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/qr-menu`, priority: '0.9', changefreq: 'weekly', title: 'Temassız Dijital QR Menü Sistemi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/bakkal-market`, priority: '0.95', changefreq: 'weekly', title: 'Bakkal & Market Hızlı POS Barkodlu Terazi Sistemi', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/bakkal`, priority: '0.85', changefreq: 'weekly', title: 'Bakkal Veresiye Defteri ve Kasa Takip', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/market`, priority: '0.85', changefreq: 'weekly', title: 'Market Barkodlu Hızlı POS Sistemi', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/veresiye-defteri`, priority: '0.9', changefreq: 'weekly', title: 'Dijital Veresiye Defteri ve WhatsApp Borç Hatırlatma Programı', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/pos-sistemi`, priority: '0.85', changefreq: 'weekly', title: 'Hızlı Perakende POS ve Terazi Entegrasyonu', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/fiyat`, priority: '0.9', changefreq: 'weekly', title: 'Fiyatlandırma & Esnaf Paketleri', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/kayit`, priority: '0.9', changefreq: 'monthly', title: 'Ücretsiz Kayıt - Dükkanını 2 Dakikada Kur', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/teknik-servis`, priority: '0.8', changefreq: 'weekly', title: 'Teknik Servis Cihaz Takip ve Tamir Fişi Yazılımı', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/hukuk`, priority: '0.8', changefreq: 'weekly', title: 'Avukat ve Hukuk Bürosu Dava Takip ve Masraf Yazılımı', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/terzi`, priority: '0.8', changefreq: 'weekly', title: 'Terzi & Kuru Temizleme Emanet Takip Sistemi', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/iletisim`, priority: '0.6', changefreq: 'monthly', title: 'İletişim & Destek', img: `${origin}/icon-512.png` },
    { loc: `${origin}/gizlilik`, priority: '0.4', changefreq: 'yearly', title: 'Gizlilik Politikası & KVKK Güvencesi', img: `${origin}/icon-512.png` },
  ];

  // Aktif dükkanların dinamik linkleri
  const shopUrls: { loc: string; priority: string; changefreq: string; title: string; img: string }[] = [];
  const accounts = getAccounts();
  const seenSlugs = new Set<string>();

  // Demo hesap da eklensin
  seenSlugs.add('demo');
  shopUrls.push(
    { loc: `${origin}/r/demo`, priority: '0.85', changefreq: 'daily', title: 'Demo Berber - Online Randevu Al', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/m/demo`, priority: '0.85', changefreq: 'daily', title: 'Demo Kafe - Dijital QR Menü & Fiyatlar', img: `${origin}/brand/phone_mockup_retina.png` }
  );

  for (const acc of accounts) {
    if (isExcludedAccount(acc)) continue;
    try {
      const st = loadShopState(acc.id);
      const storeName = st.shopProfile?.storeName || acc.shopName;
      const slug = st.shopProfile?.slug || slugify(storeName);
      if (!slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      const sector = (st.shopProfile?.sectorKey || '').toLowerCase();
      const isBarberSector = sector === 'berber' || sector === 'kuafor' || sector === 'guzellik-salonu' || !sector;
      const isCafeSector = sector === 'kafe-restoran' || sector === 'kafe' || sector === 'restoran';
      const isVip = !!st.shopProfile?.isVip;

      // Randevu sayfası: Berber/kuaför/güzellik veya aktif randevu servisi olan dükkanlar
      if (isBarberSector || (st.barberServices && st.barberServices.length > 0)) {
        shopUrls.push({
          loc: `${origin}/r/${slug}`,
          priority: '0.75',
          changefreq: 'daily',
          title: `${storeName} - Online Randevu Al`,
          img: `${origin}/brand/phone_mockup_retina.png`,
        });
      }

      // QR Menü sayfası: SADECE VIP veya menü içeriği olan kafe/restoranlar (403 veya boş sayfa dönmeyecek olanlar)
      if ((isCafeSector || isVip) && st.menuItems && st.menuItems.length > 0) {
        shopUrls.push({
          loc: `${origin}/m/${slug}`,
          priority: '0.75',
          changefreq: 'daily',
          title: `${storeName} - Dijital QR Menü & Fiyatlar`,
          img: `${origin}/brand/phone_mockup_retina.png`,
        });
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
    <image:image>
      <image:loc>${u.img}</image:loc>
      <image:title>${escapeHtml(u.title)}</image:title>
    </image:image>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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
