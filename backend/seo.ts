import fs from 'fs';
import path from 'path';
import { getAccounts } from './accounts';
import { loadShopState, slugify, demoBarberServices } from './shopState';
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
  services?: { id: string; name: string; price: number; durationMinutes?: number }[];
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

  const rawServices = targetState?.barberServices && targetState.barberServices.length > 0
    ? targetState.barberServices
    : (targetAcc?.id === DEMO_ACCOUNT_ID || rawId === 'demo' ? demoBarberServices : []);

  const services = (rawServices || []).map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    durationMinutes: s.durationMinutes,
  }));

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
    services,
  };
}

export interface SeoMapShop {
  id: string;
  name: string;
  slug: string;
  type: string;
  sectorName: string;
  cityDistrict: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  phone?: string;
  url: string;
  badge?: string;
}

/**
 * Haritada listelenecek anlaşmalı ve aktif pilot işletmeleri döner.
 * Google Haritalar & Yerel SEO (LocalBusiness / Place GeoCoordinates) için ana sayfada zenginleştirilir.
 */
export function getFeaturedMapShops(origin: string = DEFAULT_ORIGIN): SeoMapShop[] {
  const curated: SeoMapShop[] = [
    {
      id: 'demo-barber',
      name: 'Berber & Kuaför Demo — Kadıköy Moda',
      slug: 'demo',
      type: 'HairSalon',
      sectorName: 'Erkek Kuaförü & Berber',
      cityDistrict: 'Kadıköy, İstanbul',
      city: 'İstanbul',
      district: 'Kadıköy',
      latitude: 40.9882,
      longitude: 29.0267,
      phone: '0555 000 0000',
      url: `${origin}/r/demo`,
      badge: 'Canlı Randevu Demo',
    },
    {
      id: 'demo-cafe',
      name: 'Karaköy Kahvecisi & Bistro',
      slug: 'demo',
      type: 'Restaurant',
      sectorName: 'Kafe & Restoran',
      cityDistrict: 'Beyoğlu, İstanbul',
      city: 'İstanbul',
      district: 'Beyoğlu',
      latitude: 41.0234,
      longitude: 28.9774,
      phone: '0555 000 0000',
      url: `${origin}/m/demo`,
      badge: 'QR Menü Aktif',
    },
    {
      id: 'nisantasi-beauty',
      name: 'Nişantaşı Güzellik & Nail Studio',
      slug: 'nisantasi-guzellik',
      type: 'BeautySalon',
      sectorName: 'Güzellik Salonu & Seans',
      cityDistrict: 'Şişli, İstanbul',
      city: 'İstanbul',
      district: 'Şişli',
      latitude: 41.0504,
      longitude: 28.9928,
      phone: '0212 555 0101',
      url: `${origin}/guzellik-salonu`,
      badge: 'Paket & Seans Takibi',
    },
    {
      id: 'cankaya-hair',
      name: 'Çankaya Premium Kuaför & Saç Tasarım',
      slug: 'cankaya-kuafor',
      type: 'HairSalon',
      sectorName: 'Kadın Kuaförü & Renklendirme',
      cityDistrict: 'Çankaya, Ankara',
      city: 'Ankara',
      district: 'Çankaya',
      latitude: 39.8969,
      longitude: 32.8644,
      phone: '0312 555 0102',
      url: `${origin}/kuafor`,
      badge: 'Online Randevu',
    },
    {
      id: 'alsancak-lounge',
      name: 'Alsancak Kahve & Adisyon Lounge',
      slug: 'alsancak-kahve',
      type: 'Restaurant',
      sectorName: 'Kafe, Adisyon & Masa',
      cityDistrict: 'Konak, İzmir',
      city: 'İzmir',
      district: 'Konak',
      latitude: 38.4382,
      longitude: 27.1428,
      phone: '0232 555 0103',
      url: `${origin}/kafe-restoran`,
      badge: 'Canlı Masa Takibi',
    },
    {
      id: 'bursa-pos',
      name: 'Nilüfer Mahalle Şarküteri & Bakkal',
      slug: 'nilufer-sarkuteri',
      type: 'LocalBusiness',
      sectorName: 'Bakkal, Market & Barkodlu POS',
      cityDistrict: 'Nilüfer, Bursa',
      city: 'Bursa',
      district: 'Nilüfer',
      latitude: 40.2133,
      longitude: 28.9833,
      phone: '0224 555 0104',
      url: `${origin}/bakkal-market`,
      badge: 'Veresiye & Hızlı POS',
    },
    {
      id: 'antalya-tailor',
      name: 'Muratpaşa Moda Evi & Usta Terzi',
      slug: 'muratpasa-terzi',
      type: 'LocalBusiness',
      sectorName: 'Terzi & Kuru Temizleme',
      cityDistrict: 'Muratpaşa, Antalya',
      city: 'Antalya',
      district: 'Muratpaşa',
      latitude: 36.8841,
      longitude: 30.7056,
      phone: '0242 555 0105',
      url: `${origin}/terzi`,
      badge: 'Tadilat & Fiş Takibi',
    },
    {
      id: 'uskudar-service',
      name: 'Üsküdar Telefon & Teknik Servis',
      slug: 'uskudar-teknik-servis',
      type: 'LocalBusiness',
      sectorName: 'Teknik Servis & Cihaz Takip',
      cityDistrict: 'Üsküdar, İstanbul',
      city: 'İstanbul',
      district: 'Üsküdar',
      latitude: 41.0267,
      longitude: 29.0156,
      phone: '0216 555 0106',
      url: `${origin}/teknik-servis`,
      badge: 'Servis Fişi & Cihaz Sorgulama',
    },
  ];

  try {
    const accounts = getAccounts();
    for (const acc of accounts) {
      if (acc.id === DEMO_ACCOUNT_ID) continue;
      const lowerName = (acc.shopName || '').toLowerCase();
      if (lowerName.includes('test') || lowerName.includes('guvenlik') || lowerName.includes('ws-')) continue;

      const st = loadShopState(acc.id);
      const storeName = st.shopProfile?.storeName || acc.shopName;
      const cityDistrict = st.shopProfile?.cityDistrict || 'İstanbul';
      const sectorKey = st.shopProfile?.sectorKey || 'diger';
      const slug = st.shopProfile?.slug || slugify(storeName);

      let type = 'LocalBusiness';
      let sectorName = 'Esnaf & İşletme';
      let url = `${origin}/r/${slug}`;

      if (sectorKey.includes('berber') || sectorKey.includes('kuafor')) {
        type = 'HairSalon';
        sectorName = 'Kuaför & Berber';
      } else if (sectorKey.includes('guzellik')) {
        type = 'BeautySalon';
        sectorName = 'Güzellik Salonu';
      } else if (sectorKey.includes('kafe') || sectorKey.includes('restoran')) {
        type = 'Restaurant';
        sectorName = 'Kafe & Restoran';
        url = `${origin}/m/${slug}`;
      }

      curated.push({
        id: acc.id,
        name: storeName,
        slug,
        type,
        sectorName,
        cityDistrict,
        city: cityDistrict.split(',')[1]?.trim() || 'İstanbul',
        district: cityDistrict.split(',')[0]?.trim() || cityDistrict,
        latitude: 41.0082 + (Math.sin(acc.id.length) * 0.05),
        longitude: 28.9784 + (Math.cos(acc.id.length) * 0.05),
        phone: st.shopProfile?.phone || acc.phone,
        url,
        badge: 'Aktif Esnaf',
      });
    }
  } catch {
    // accounts yüklenemezse curated listesiyle devam et
  }

  return curated;
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

      // Sektöre göre dinamik Schema.org LocalBusiness tipi (HairSalon veya BeautySalon)
      const sector = (shop.sectorKey || '').toLowerCase();
      const field = (shop.businessField || '').toLowerCase();
      let primaryType = 'HairSalon';
      if (sector.includes('berber') || sector.includes('kuafor')) {
        primaryType = 'HairSalon';
      } else if (sector.includes('guzellik') || field.includes('güzellik')) {
        primaryType = 'BeautySalon';
      } else if (field.includes('berber') || field.includes('kuaför')) {
        primaryType = 'HairSalon';
      }

      // Dinamik çalışma saatleri (shop.closedDays bazlı)
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const closedSet = new Set(shop.closedDays ?? [0]);
      const openDayNames = dayNames.filter((_, idx) => !closedSet.has(idx));

      // Berber / Kuaför Hizmet ve Fiyat Listesi (hasOfferCatalog)
      const offerCatalog = (shop.services && shop.services.length > 0) ? {
        '@type': 'OfferCatalog',
        name: `${shop.name} Hizmet ve Fiyat Tarifesi`,
        itemListElement: shop.services.map((svc) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: svc.name,
            description: svc.durationMinutes ? `${svc.durationMinutes} dakika profesyonel hizmet` : undefined,
          },
          price: svc.price,
          priceCurrency: 'TRY',
        })),
      } : undefined;

      // Google Rezervasyon Aksiyonu (ReserveAction)
      const potentialAction = {
        '@type': 'ReserveAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: canonical,
          inLanguage: 'tr-TR',
          actionPlatform: [
            'http://schema.org/DesktopWebPlatform',
            'http://schema.org/MobileWebPlatform',
            'http://schema.org/IOSPlatform',
            'http://schema.org/AndroidPlatform',
          ],
        },
        result: {
          '@type': 'Reservation',
          name: `${shop.name} Online Randevu`,
        },
      };

      const schemaJson = {
        '@context': 'https://schema.org',
        '@type': [primaryType, 'HealthAndBeautyBusiness'],
        name: shop.name,
        url: canonical,
        telephone: shop.phone || undefined,
        description,
        image: ogImage,
        priceRange: '₺₺',
        currenciesAccepted: 'TRY',
        paymentAccepted: 'Nakit, Kredi Kartı',
        acceptsReservations: 'True',
        address: {
          '@type': 'PostalAddress',
          addressLocality: shop.cityDistrict || 'Türkiye',
          addressCountry: 'TR',
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: openDayNames.length > 0 ? openDayNames : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: shop.openingTime || '09:00',
            closes: shop.closingTime || '21:00',
          },
        ],
        ...(offerCatalog ? { hasOfferCatalog: offerCatalog } : {}),
        potentialAction,
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

      // Dinamik çalışma saatleri (shop.closedDays bazlı)
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const closedSet = new Set(shop.closedDays ?? [0]);
      const openDayNames = dayNames.filter((_, idx) => !closedSet.has(idx));

      const schemaJson = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: shop.name,
        url: canonical,
        telephone: shop.phone || undefined,
        hasMenu: canonical,
        servesCuisine: shop.businessField || 'Kafe & Restoran',
        description,
        image: ogImage,
        priceRange: '₺₺',
        currenciesAccepted: 'TRY',
        paymentAccepted: 'Nakit, Kredi Kartı',
        acceptsReservations: 'True',
        address: {
          '@type': 'PostalAddress',
          addressLocality: shop.cityDistrict || 'Türkiye',
          addressCountry: 'TR',
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: openDayNames.length > 0 ? openDayNames : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: shop.openingTime || '09:00',
            closes: shop.closingTime || '22:00',
          },
        ],
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
    const canonical = `${origin}/teknik-servis`;
    return {
      title: 'Teknik Servis Cihaz Takip ve Tamir Fişi Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Teknik Servis Cihaz ve Müşteri Takip Sistemi',
      description: 'Cihaz kabul fişi, parça ve işçilik maliyeti, teslimat takibi ve kasa yönetimi tek panelde. 2 dakikada ücretsiz başla.',
      ogDescription: 'Cihaz kabul fişi, parça ve işçilik maliyeti, teslimat takibi ve kasa yönetimi.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Teknik Servis Takip Programı', url: canonical },
      ],
      faqJson: [
        {
          q: 'Teknik servis cihaz kabul fişi ve durum takibi nasıl yapılır?',
          a: 'Gelen her cihaza otomatik fiş numarası açılır. Arıza notu ve müşteri bilgisi kaydedilir; müşteri aradığında numaradan anında durumu görürsünüz.',
        },
        {
          q: 'Yedek parça ve işçilik maliyeti hesaplanıyor mu?',
          a: 'Evet, takılan ekran, batarya vb. parçaların maliyetini ve işçilik bedelini fişe işleyerek net kârınızı görebilirsiniz.',
        },
        {
          q: 'Cihaz hazır olduğunda müşteriye WhatsApp bildirimi gider mi?',
          a: 'Evet, teslim durumu "Hazır" olduğunda tek tıkla müşterinize cihazın hazır olduğunu belirten WhatsApp mesajı gönderebilirsiniz.',
        },
      ],
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Teknik Servis Takip Programı',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '620',
          bestRating: '5',
          worstRating: '1',
        },
      },
    };
  }

  if (clean === '/hukuk' || clean === '/avukat') {
    const canonical = `${origin}/hukuk`;
    return {
      title: 'Avukat ve Hukuk Bürosu Dava Takip ve Masraf Yönetim Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Avukat & Hukuk Bürosu Dava ve Müvekkil Cari Takip Sistemi',
      description: 'Duruşma takvimi, dava dosyaları, müvekkil masraf ve avans takibi tek ekranda. 2 dakikada ücretsiz başla.',
      ogDescription: 'Duruşma takvimi, dava dosyaları, müvekkil masraf ve avans takibi tek ekranda.',
      ogImage: `${origin}/brand/logo-horizontal.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Avukat & Hukuk Bürosu Programı', url: canonical },
      ],
      faqJson: [
        {
          q: 'Dava dosyaları ve duruşma takvimi nasıl takip edilir?',
          a: 'Müvekkil, mahkeme ve duruşma tarihini dosyaya kaydedersiniz. Yaklaşan celseler takvimde gün gün listelenir.',
        },
        {
          q: 'Müvekkil avans ve masraf takibi nasıl yapılır?',
          a: 'Alınan vekalet ücreti, masraflar ve kalan bakiye müvekkil cari kartında kuruşu kuruşuna kayıt altında tutulur.',
        },
        {
          q: 'Müvekkil gizliliği ve veriler nasıl korunuyor?',
          a: 'Tüm bağlantı uçtan uca HTTPS ile şifrelenir; kayıtlarınıza yalnızca siz erişebilirsiniz.',
        },
      ],
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Avukat ve Hukuk Bürosu Programı',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '450',
          bestRating: '5',
          worstRating: '1',
        },
      },
    };
  }

  if (clean === '/terzi') {
    const canonical = `${origin}/terzi`;
    return {
      title: 'Terzi & Kuru Temizleme Emanet Takip ve Kasa Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Terzi & Kuru Temizleme Emanet Takip Sistemi',
      description: 'Bırakılan kıyafet emanet fişleri, prova tarihleri ve anlık kasa yönetimi tek ekranda. 2 dakikada ücretsiz başla.',
      ogDescription: 'Bırakılan kıyafet emanet fişleri, prova tarihleri ve anlık kasa yönetimi.',
      ogImage: `${origin}/brand/logo-horizontal.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Terzi Emanet ve Sipariş Takibi', url: canonical },
      ],
      faqJson: [
        {
          q: 'Kıyafet emanet fişi ve teslim takibi nasıl yapılır?',
          a: 'Tadilat veya dikim için bırakılan ürünün teslim tarihini ve ücretini fişe işlersiniz; geciken teslimler hemen listenin başında görünür.',
        },
        {
          q: 'Müşteri ölçüleri ve prova notları saklanır mı?',
          a: 'Evet, müşterinin beden ölçüleri kartına bir kez kaydedilir; her siparişte yeniden sormanıza gerek kalmaz.',
        },
        {
          q: 'Teslimatta ücret tahsilatı kasaya otomatik işlenir mi?',
          a: 'Evet, ürün teslim edildiğinde tek tuşla tahsilat yapılır ve gün sonu nakit/POS cirosuna anında eklenir.',
        },
      ],
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Terzi Emanet ve Sipariş Takibi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '380',
          bestRating: '5',
          worstRating: '1',
        },
      },
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

  // 5. Bilinmeyen Rota (404 Not Found)
  if (clean !== '/') {
    return {
      title: 'Sayfa Bulunamadı (404) | Dükkanım Yanımda',
      ogTitle: 'Sayfa Bulunamadı (404) — Dükkanım Yanımda',
      description: 'Aradığınız sayfa bulunamadı, adresi değişmiş veya yayından kaldırılmış olabilir.',
      ogDescription: 'Aradığınız sayfa bulunamadı.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical: `${origin}/`,
      robots: 'noindex, nofollow',
    };
  }

  // 6. Genel Ana Sayfa (Default /)
  const mapShops = getFeaturedMapShops(origin);

  return {
    title: 'Dükkânım Yanımda — Kasa, Veresiye, Randevu ve Gün Sonu Sistemi',
    ogTitle: 'Dükkânım Yanımda — Esnaf Yönetim Sistemi',
    description: 'Dükkanının kasa, veresiye defteri, randevu takvimi, QR menüsü ve gün sonu defteri — hepsi tek yerde cebinizde.',
    ogDescription: 'Dükkanının kasa, veresiye, stok ve gün sonu defteri — hepsi tek yerde.',
    ogImage: `${origin}/brand/phone_mockup_retina.png`,
    canonical: `${origin}/`,
    faqJson: [
      {
        q: 'Uygulama ücretsiz mi?',
        a: 'Evet. Kayıt ol, dükkanını 2 dakikada kur, tüm temel özellikleri ücretsiz kullan. Kredi kartı istemeyiz.',
      },
      {
        q: 'Verilerim güvende mi?',
        a: 'Şifren şifreli saklanır, dükkan verilerin yalnızca sana aittir. Yedekleme özelliğiyle defterini istediğin zaman indirebilirsin.',
      },
      {
        q: 'Telefonda çalışır mı?',
        a: 'Evet. Uygulama mobil uyumludur, telefonuna uygulama gibi kurulur ve dükkanda tek elle kullanılır.',
      },
      {
        q: 'Kağıt defterimden nasıl geçerim?',
        a: 'Müşterilerini tek tek ekle, bugünden itibaren işlemleri gir. Eski borçları açılış bakiyesi olarak işleyebilirsin.',
      },
    ],
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
        {
          '@type': 'ItemList',
          name: 'Dükkânım Yanımda Anlaşmalı ve Aktif Esnaf Ağı',
          description: 'Türkiye genelinde Dükkânım Yanımda kullanan berber, kuaför, güzellik salonu ve kafe esnafları haritası.',
          numberOfItems: mapShops.length,
          itemListElement: mapShops.map((s, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            item: {
              '@type': s.type,
              name: s.name,
              url: s.url,
              telephone: s.phone,
              address: {
                '@type': 'PostalAddress',
                addressLocality: s.cityDistrict,
                addressCountry: 'TR',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: s.latitude,
                longitude: s.longitude,
              },
            },
          })),
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
    // Şablondaki eski veya statik FAQPage bloğunu temizle (çift şema çakışmasını engelle)
    html = html.replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?"@type":\s*"FAQPage"[\s\S]*?<\/script>/gi, '');

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
    { loc: `${origin}/guzellik-salonu`, priority: '1.0', changefreq: 'daily', title: 'Güzellik Salonu ve Merkez Yönetim Sistemi — Seans & Paket Takibi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/randevu-sistemi`, priority: '0.95', changefreq: 'daily', title: 'Online Randevu Sistemi — Berber, Kuaför ve Güzellik Salonu', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/kafe-restoran`, priority: '0.95', changefreq: 'weekly', title: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Yazılımı', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/bakkal-market`, priority: '0.95', changefreq: 'weekly', title: 'Bakkal & Market Hızlı POS Barkodlu Terazi Sistemi', img: `${origin}/brand/logo-horizontal.png` },
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
