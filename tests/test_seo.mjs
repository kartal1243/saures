import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  findShopForSeo,
  getSeoMetadata,
  renderSeoHtml,
  generateSitemapXml,
  getRobotsTxt,
  getDynamicSeoFreshness,
  SEO_GUIDE_ARTICLES,
  isValidGuideRoute,
  BLOG_ARTICLES,
  isValidBlogRoute,
  SEO_LANDING_PAGES,
  SEO_PERMANENT_REDIRECTS,
  addAccount,
  removeAccount,
  setAccountClosed,
  hashPassword,
  loadShopState,
  setShopState,
  SHOPS_DIR,
} = require('../dist/server.cjs');

console.log('🧪 SEO ve Sosyal Paylaşım Önizleme Testleri Başlatılıyor...\n');

const seoSuffix = Date.now();
const barberSlug = `altin-makas-${seoSuffix}`;
const cafeSlug = `liman-restoran-${seoSuffix}`;
const closedSlug = `kapali-salon-${seoSuffix}`;
const barberAccId = `acc_seo_barber_${seoSuffix}`;
const cafeAccId = `acc_seo_cafe_${seoSuffix}`;
const closedAccId = `acc_seo_closed_${seoSuffix}`;

addAccount({
  id: barberAccId,
  shopName: 'Altın Makas Erkek Kuaförü',
  ownerName: 'Ahmet Usta',
  phone: '05324445566',
  passwordHash: hashPassword('Test123456!'),
  createdAt: new Date().toISOString(),
});
const bState = loadShopState(barberAccId);
bState.shopProfile = {
  storeName: 'Altın Makas Erkek Kuaförü',
  ownerName: 'Ahmet Usta',
  businessField: 'Berber / Kuaför / Güzellik',
  sectorKey: 'berber_kuafor',
  employeeCount: '3',
  phone: '05324445566',
  cityDistrict: 'İstanbul / Kadıköy',
  dailyTarget: 4500,
  slogan: 'Usta ellerde tarzına değer kat',
  slug: barberSlug,
  logoUrl: '/brand/phone_mockup_retina.png',
  isConfigured: true,
  isVip: true,
};
bState.barberServices = [
  { id: 'srv_1', name: 'Saç Kesimi', price: 250, durationMinutes: 30, active: true },
  { id: 'srv_2', name: 'Sakal Tıraşı', price: 150, durationMinutes: 20, active: true },
];
bState.barberReviews = [
  {
    id: 'rev_1',
    customerName: 'Mehmet K.',
    staffName: 'Ahmet Usta',
    rating: 5,
    comment: 'Çok temiz ve profesyonel hizmet, tam saatinde sıram geldi.',
    approved: true,
    createdAt: new Date().toISOString(),
  },
];
setShopState(barberAccId, bState);

addAccount({
  id: cafeAccId,
  shopName: 'Liman Restoran & Bistro',
  ownerName: 'Hasan Şef',
  phone: '05334445566',
  passwordHash: hashPassword('Test123456!'),
  createdAt: new Date().toISOString(),
});
const cState = loadShopState(cafeAccId);
cState.shopProfile = {
  storeName: 'Liman Restoran & Bistro',
  ownerName: 'Hasan Şef',
  businessField: 'Kafe & Restoran',
  sectorKey: 'kafe_restoran',
  employeeCount: '4',
  phone: '05334445566',
  cityDistrict: 'Karaköy, İstanbul',
  dailyTarget: 6500,
  slogan: 'Geleneksel lezzetler ve hızlı servis',
  slug: cafeSlug,
  logoUrl: '/brand/phone_mockup_retina.png',
  isConfigured: true,
  isVip: true,
};
cState.menuItems = [
  { id: 'm_1', name: 'Izgara Köfte', price: 240, category: 'Ana Yemekler', description: 'Özel baharatlı ızgara köfte', isAvailable: true },
  { id: 'm_2', name: 'Türk Kahvesi', price: 65, category: 'İçecekler', description: 'Közde Türk kahvesi', isAvailable: true },
];
setShopState(cafeAccId, cState);

addAccount({
  id: closedAccId,
  shopName: 'Kapatılan Kuaför Salonu',
  ownerName: 'Veli Usta',
  phone: '05344445566',
  passwordHash: hashPassword('Test123456!'),
  createdAt: new Date().toISOString(),
});
const closedState = loadShopState(closedAccId);
closedState.shopProfile = {
  storeName: 'Kapatılan Kuaför Salonu',
  ownerName: 'Veli Usta',
  businessField: 'Berber / Kuaför',
  sectorKey: 'berber_kuafor',
  employeeCount: '1',
  phone: '05344445566',
  cityDistrict: 'Ankara / Çankaya',
  dailyTarget: 2000,
  slug: closedSlug,
  isConfigured: true,
  isVip: true,
};
setShopState(closedAccId, closedState);
setAccountClosed(closedAccId, true, 'Test kapatma');

function cleanupSeoFixtures() {
  removeAccount(barberAccId);
  removeAccount(cafeAccId);
  removeAccount(closedAccId);
  for (const id of [barberAccId, cafeAccId, closedAccId]) {
    try { fs.unlinkSync(path.join(SHOPS_DIR, `${id}.json`)); } catch {}
  }
}

let total = 0;
let passed = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
  }
}

// 1. Dükkan Çözümleme (findShopForSeo)
it('findShopForSeo gerçek dükkanı çözer, demo ve kapalı dükkan için null döner', () => {
  assert.strictEqual(findShopForSeo('demo'), null, 'Demo dükkan kaldırılmış olmalı');
  assert.strictEqual(findShopForSeo('demo', 'menu'), null, 'Demo menü kaldırılmış olmalı');
  assert.strictEqual(findShopForSeo(closedSlug), null, 'Kapalı dükkan gizlenmeli');

  const shop = findShopForSeo(barberSlug);
  assert.ok(shop, 'Gerçek dükkan bulunmalı');
  assert.strictEqual(shop.exists, true);
  assert.strictEqual(shop.name, 'Altın Makas Erkek Kuaförü');
});

it('findShopForSeo var olmayan dükkan için null döner', () => {
  const shop = findShopForSeo('bu-isimde-bir-dukkan-asla-yok-123456');
  assert.strictEqual(shop, null);
});

// 2. Randevu Rotaları Metadata (/r/:slug)
it('/r/:slug rotası için dükkan adıyla dinamik title, HairSalon şeması ve ReserveAction üretir', () => {
  const meta = getSeoMetadata(`/r/${barberSlug}`);
  assert.ok(meta.title.includes('Online Randevu Al | Dükkanım Yanımda'), 'Title randevu içermeli');
  assert.ok(meta.ogTitle.includes('Kolay Online Randevu'), 'og:title randevu içermeli');
  assert.ok(meta.ogDescription.includes('sıra beklemeden online randevunuzu hemen oluşturun'), 'og:description uygun olmalı');
  assert.ok(meta.canonical.includes(`/${barberSlug}/randevu`), 'canonical URL tekil temiz randevu ucu olmalı');
  assert.ok(meta.ogImage.startsWith('https://'), 'og:image tam URL olmalı');
  assert.ok(meta.schemaJson, 'schema.org JSON-LD verisi olmalı');
  assert.ok(
    meta.schemaJson['@type'].includes('HairSalon') && meta.schemaJson['@type'].includes('HealthAndBeautyBusiness'),
    'HairSalon ve HealthAndBeautyBusiness tipleri olmalı'
  );
  assert.ok(meta.schemaJson.hasOfferCatalog, 'hasOfferCatalog hizmet listesi bulunmalı');
  assert.ok(meta.schemaJson.potentialAction, 'ReserveAction Google rezervasyon aksiyonu bulunmalı');
  assert.ok(meta.schemaJson.openingHoursSpecification && meta.schemaJson.openingHoursSpecification.length > 0, 'Dinamik çalışma saatleri bulunmalı');
});

// 3. QR Menü Rotaları Metadata (/m/:slug)
it('/m/:slug rotası için dükkan adıyla dinamik menü title ve og etiketleri üretir', () => {
  const meta = getSeoMetadata(`/m/${cafeSlug}`);
  assert.ok(meta.title.includes('Dijital QR Menü & Fiyatlar | Dükkanım Yanımda'), 'Title menü içermeli');
  assert.ok(meta.ogTitle.includes('Dijital Menü'), 'og:title menü içermeli');
  assert.ok(meta.ogDescription.includes('masadan garson çağırma'), 'og:description garson çağırma içermeli');
  assert.ok(meta.canonical.includes(`/m/${cafeSlug}`), 'canonical URL menü ucu olmalı');
  assert.ok(meta.schemaJson, 'schema.org JSON-LD verisi olmalı');
  assert.strictEqual(meta.schemaJson['@type'], 'Restaurant');
});

// 4. Sektör Açılış Rotaları
it('/berber ve /kuafor esnafa özel randevu ve yönetim SEO etiketleri üretir', () => {
  const metaBerber = getSeoMetadata('/berber');
  const metaKuafor = getSeoMetadata('/kuafor');
  assert.ok(metaBerber.title.includes('Berber Randevu'));
  assert.ok(metaKuafor.title.includes('Kuaför Randevu'));
  assert.ok(metaBerber.ogDescription.includes('Koltuk sırası, online randevu'));
  assert.ok(metaKuafor.ogDescription.includes('Kuaför salonları'));
});

it('/kafe-restoran ve /kafe masalar & adisyon & QR menü SEO etiketleri üretir', () => {
  const meta = getSeoMetadata('/kafe-restoran');
  assert.ok(meta.title.includes('Kafe & Restoran Masalar, Adisyon ve QR Menü Yazılımı'));
  assert.ok(meta.ogDescription.includes('garson çağrı sistemli'));
});

it('/bakkal ve /market hızlı POS ve veresiye defteri SEO etiketleri üretir', () => {
  const metaBakkal = getSeoMetadata('/bakkal');
  const metaMarket = getSeoMetadata('/market');
  assert.ok(metaBakkal.title.includes('Bakkal & Market Hızlı POS Barkodlu Terazi ve Veresiye Takip Sistemi'));
  assert.ok(metaMarket.title.includes('Bakkal & Market Hızlı POS Barkodlu Terazi ve Veresiye Takip Sistemi'));
  assert.ok(metaBakkal.ogDescription.includes('Mahallenin veresiye defteri'));
});

it('/guzellik-salonu ve seans/paket takibi için zengin Google SEO & FAQ etiketleri üretir', () => {
  const meta = getSeoMetadata('/guzellik-salonu');
  assert.ok(meta.title.includes('Güzellik Salonu ve Merkez Yönetim Sistemi'));
  assert.ok(meta.title.includes('Seans & Paket Takibi'));
  assert.ok(meta.description.includes('lazer epilasyon'));
  assert.ok(meta.faqJson && meta.faqJson.length > 0, 'FAQPage verisi bulunmalı');
  assert.ok(meta.schemaJson, 'SoftwareApplication şeması bulunmalı');
});

it('getDynamicSeoFreshness dinamik yıl, ay ve mevsim üretir', () => {
  const fresh = getDynamicSeoFreshness();
  assert.strictEqual(typeof fresh.year, 'number');
  assert.ok(fresh.year >= 2026);
  assert.ok(fresh.month.length > 0);
  assert.ok(fresh.season.length > 0);
});

// 5. HTML Enjeksiyon ve Memory Caching (renderSeoHtml)
it('renderSeoHtml şablondaki <title>, og ve twitter etiketlerini eksiksiz değiştirir', () => {
  const mockTemplate = `<!doctype html><html><head>
    <title>Eski Başlık</title>
    <meta name="description" content="Eski açıklama" />
    <meta property="og:title" content="Eski og title" />
    <meta property="og:description" content="Eski og desc" />
    <meta property="og:url" content="https://dukkanimyanimda.com.tr/" />
    <meta property="og:image" content="https://dukkanimyanimda.com.tr/eski.png" />
    <link rel="canonical" href="https://dukkanimyanimda.com.tr/" />
    <meta name="twitter:title" content="Eski twitter" />
    <meta name="twitter:description" content="Eski twitter desc" />
    <meta name="twitter:image" content="https://dukkanimyanimda.com.tr/eski.png" />
  </head><body><div id="root"></div></body></html>`;

  const html = renderSeoHtml(`/r/${barberSlug}`, 'dukkanimyanimda.com.tr', mockTemplate);

  assert.ok(html.includes('Online Randevu Al | Dükkanım Yanımda'), 'Yeni başlık enjekte edilmeli');
  assert.ok(!html.includes('Eski Başlık'), 'Eski başlık kalmamalı');
  assert.ok(html.includes('Kolay Online Randevu'), 'Yeni og:title olmalı');
  assert.ok(html.includes('schema.org'), 'schema.org JSON-LD enjekte edilmeli');
  assert.ok(html.includes('HealthAndBeautyBusiness'), 'HealthAndBeautyBusiness tipi olmalı');
});

it('renderSeoHtml disk yerine bellek önbelleğinden ultra hızlı çalışır (< 2ms)', () => {
  const t0 = performance.now();
  for (let i = 0; i < 100; i++) {
    renderSeoHtml(`/r/${barberSlug}`);
  }
  const elapsed = performance.now() - t0;
  const avg = elapsed / 100;
  assert.ok(avg < 2, `100 istek ortalama ${avg.toFixed(3)}ms sürdü, 2ms altında olmalı`);
});

// 6. Dinamik Sitemap.xml Testi
it('generateSitemapXml geçerli, demosuz ve sadece açık gerçek dükkanları içeren sitemap üretir', () => {
  const xml = generateSitemapXml('dukkanimyanimda.com.tr');
  assert.ok(xml.startsWith('<?xml'), 'XML beyanı ile başlamalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/</loc>'), 'Ana sayfa loc olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/berber</loc>'), 'Berber rotası olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/kafe-restoran</loc>'), 'Kafe rotası olmalı');
  assert.ok(!xml.includes('<loc>https://dukkanimyanimda.com.tr/bakkal-market</loc>'), 'Kapatılan /bakkal-market sitemapte olmamalı');
  assert.ok(!xml.includes('<loc>https://dukkanimyanimda.com.tr/teknik-servis</loc>'), 'Kapatılan /teknik-servis sitemapte olmamalı');
  assert.ok(!xml.includes('<loc>https://dukkanimyanimda.com.tr/hukuk</loc>'), 'Kapatılan /hukuk sitemapte olmamalı');
  assert.ok(!xml.includes('<loc>https://dukkanimyanimda.com.tr/terzi</loc>'), 'Kapatılan /terzi sitemapte olmamalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/guzellik-salonu</loc>'), 'Güzellik salonu rotası olmalı');
  assert.ok(xml.includes('sitemap-image'), 'Google image sitemap namespace olmalı');
  assert.ok(!xml.includes('/r/demo'), 'Demo randevu loc kaldırılmış olmalı');
  assert.ok(!xml.includes('/m/demo'), 'Demo menü loc kaldırılmış olmalı');
  assert.ok(xml.includes(`/${barberSlug}/randevu`), 'Gerçek açık kuaför tekil temiz randevu linkiyle sitemape girmeli');
  assert.ok(!xml.includes(`/r/${barberSlug}`), 'Aynı kuaför için çift /r/ linki sitemapte olmamalı');
  assert.ok(xml.includes(`/m/${cafeSlug}`), 'Gerçek açık restoran sitemape girmeli');
  assert.ok(!xml.includes(closedSlug), 'Kapalı dükkan sitemapte olmamalı');

  assert.ok(!xml.includes('<loc>https://dukkanimyanimda.com.tr/kuafor-randevu</loc>'), 'Alias rotası sitemapte olmamalı');
  assert.ok(!xml.includes('<loc>https://dukkanimyanimda.com.tr/adisyon</loc>'), 'Alias rotası sitemapte olmamalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/veresiye-defteri</loc>'), 'Bağımsız /veresiye-defteri canonical rotası sitemapte olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/kasa-programi</loc>'), 'Bağımsız /kasa-programi rotası sitemapte olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/gun-sonu-raporu</loc>'), 'Bağımsız /gun-sonu-raporu rotası sitemapte olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/qr-menu</loc>'), 'Bağımsız /qr-menu rotası sitemapte olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/blog</loc>'), 'Blog hub rotası sitemapte olmalı');
});

// 7. Robots.txt Testi
it('getRobotsTxt arama motorları için doğru kuralları döner', () => {
  const robots = getRobotsTxt('dukkanimyanimda.com.tr');
  assert.ok(robots.includes('User-agent: *'));
  assert.ok(robots.includes('Allow: /'));
  assert.ok(robots.includes('Allow: /api/public/'), 'Googlebot WRS için Allow: /api/public/ olmalı');
  assert.ok(robots.includes('Allow: /media/'), 'Googlebot için Allow: /media/ olmalı');
  assert.ok(robots.includes('Disallow: /api/'));
  assert.ok(robots.includes('Disallow: /admin'));
  assert.ok(robots.includes('Sitemap: https://dukkanimyanimda.com.tr/sitemap.xml'));
});

// 8. Soft 404 & Noindex Koruması
it('Var olmayan randevu veya menü slugı için noindex döner (Soft 404 engelleme)', () => {
  const metaRandevu = getSeoMetadata('/r/olmayan-bir-berber-xyz');
  assert.strictEqual(metaRandevu.robots, 'noindex, follow');
  assert.strictEqual(metaRandevu.canonical, 'https://dukkanimyanimda.com.tr/randevu-sistemi');

  const metaMenu = getSeoMetadata('/m/olmayan-bir-kafe-xyz');
  assert.strictEqual(metaMenu.robots, 'noindex, follow');
  assert.strictEqual(metaMenu.canonical, 'https://dukkanimyanimda.com.tr/kafe-restoran');

  const metaBilinmeyen = getSeoMetadata('/bu-sayfa-kesinlikle-yok-xyz');
  assert.strictEqual(metaBilinmeyen.robots, 'noindex, nofollow');
  assert.ok(metaBilinmeyen.title.includes('404'), 'Bilinmeyen rota 404 başlığı taşımalı');
});

// 9. Zengin FAQPage JSON-LD Testi
it('/kafe-restoran, /bakkal-market, /fiyat, /teknik-servis, /hukuk ve /terzi zengin Google FAQPage schema içerir', () => {
  const metaKafe = getSeoMetadata('/kafe-restoran');
  assert.ok(metaKafe.faqJson && metaKafe.faqJson.length >= 3, 'Kafe FAQPage olmalı');

  const metaBakkal = getSeoMetadata('/bakkal-market');
  assert.ok(metaBakkal.faqJson && metaBakkal.faqJson.length >= 3, 'Bakkal FAQPage olmalı');

  const metaFiyat = getSeoMetadata('/fiyat');
  assert.ok(metaFiyat.faqJson && metaFiyat.faqJson.length >= 3, 'Fiyat FAQPage olmalı');

  const metaServis = getSeoMetadata('/teknik-servis');
  assert.ok(metaServis.faqJson && metaServis.faqJson.length >= 3, 'Teknik servis FAQPage olmalı');
  assert.ok(metaServis.schemaJson, 'Teknik servis SoftwareApplication şeması olmalı');

  const metaHukuk = getSeoMetadata('/hukuk');
  assert.ok(metaHukuk.faqJson && metaHukuk.faqJson.length >= 3, 'Hukuk FAQPage olmalı');

  const metaTerzi = getSeoMetadata('/terzi');
  assert.ok(metaTerzi.faqJson && metaTerzi.faqJson.length >= 3, 'Terzi FAQPage olmalı');
});

// 10. Sitemap Test Hesapları İzolasyonu
it('generateSitemapXml test veya şüpheli hesapları hariç tutar, temiz linkler üretir', () => {
  const xml = generateSitemapXml('dukkanimyanimda.com.tr');
  assert.ok(!xml.includes('test-market'), 'Test marketleri sitemape sızmamalı');
  assert.ok(!xml.includes('guvenlik-testi'), 'Güvenlik test hesapları sitemape sızmamalı');
  assert.ok(!xml.includes('ws-dukkan'), 'WS dükkan testleri sitemape sızmamalı');
});

// 11. Google Search Console Doğrulama Meta Etiketi
it('renderSeoHtml Google Search Console doğrulama meta etiketini korur', () => {
  const html = renderSeoHtml('/');
  assert.ok(html.includes('google-site-verification'), 'Google doğrulama meta etiketi bulunmalı');
  assert.ok(html.includes('googlef0e9499536bdd56a'), 'Doğrulama anahtarı eksiksiz olmalı');
});

// 12. Esnaf İletişim Ağı ve Ana Sayfa Harita Schema.org Testi (Local SEO & GeoCoordinates)
it('Ana sayfa (/) Schema.org JSON-LD harita esnaf ağı ItemList ve GeoCoordinates içerir', () => {
  const meta = getSeoMetadata('/');
  assert.ok(meta.schemaJson, 'Ana sayfa schemaJson içermeli');
  assert.ok(Array.isArray(meta.schemaJson['@graph']), '@graph array formatında olmalı');

  const itemList = meta.schemaJson['@graph'].find((item) => item['@type'] === 'ItemList');
  assert.ok(itemList, 'ItemList tipi bulunmalı');
  assert.ok(itemList.numberOfItems > 0, 'Harita dükkan sayısı > 0 olmalı');
  assert.ok(Array.isArray(itemList.itemListElement), 'itemListElement array olmalı');

  const firstShop = itemList.itemListElement[0].item;
  assert.ok(firstShop.name, 'Harita dükkanının adı olmalı');
  assert.ok(firstShop.geo, 'geo GeoCoordinates nesnesi bulunmalı');
  assert.strictEqual(firstShop.geo['@type'], 'GeoCoordinates');
  assert.strictEqual(typeof firstShop.geo.latitude, 'number');
  assert.strictEqual(typeof firstShop.geo.longitude, 'number');
  assert.ok(firstShop.address && firstShop.address.addressCountry === 'TR', 'Türkiye adres formatı olmalı');
});

// 13. Semantik SSR HTML Gövdesi Testi (Boş root div olmamalı)
it('renderSeoHtml <div id="root"> içine rotaya özel semantik SSR HTML (<header>, <main>, <h1>, <footer>) enjekte eder', () => {
  const html = renderSeoHtml('/berber');
  assert.ok(!html.includes('<div id="root"></div>'), 'Boş <div id="root"> kalmamalı');
  assert.ok(html.includes('<main id="main-content"'), 'Semantik main etiketi bulunmalı');
  assert.ok(html.includes('Berber Randevu'), 'SSR gövdesinde H1 veya başlık olmalı');
  assert.ok(html.includes('Sıkça Sorulan Sorular'), 'SSR gövdesinde FAQ bölümü bulunmalı');
  assert.ok(html.includes('<footer'), 'SSR gövdesinde footer bulunmalı');
});

// 14. SERP Thumbnail & Shop Logo / Menu Rich Snippet Testi
it('/r/:slug ve /m/:slug dükkan logosu SERP thumbnail ve Restaurant Menu schema içerir', () => {
  const metaMenu = getSeoMetadata(`/m/${cafeSlug}`);
  assert.ok(metaMenu.ogImage, 'ogImage bulunmalı');
  assert.ok(metaMenu.schemaJson.logo, 'Restaurant Schema logo içermeli');
  assert.ok(metaMenu.schemaJson.hasMenu, 'hasMenu bulunmalı');
  assert.strictEqual(metaMenu.schemaJson.hasMenu['@type'], 'Menu');
  assert.ok(Array.isArray(metaMenu.schemaJson.hasMenu.hasMenuSection), 'hasMenuSection array olmalı');

  const html = renderSeoHtml(`/m/${cafeSlug}`);
  assert.ok(html.includes('name="thumbnail"'), 'SERP thumbnail meta etiketi bulunmalı');
  assert.ok(html.includes('rel="image_src"'), 'image_src link etiketi bulunmalı');
  assert.ok(html.includes('Menü ve Lezzetler'), 'SSR gövdesinde menü ürünleri listelenmeli');
});

// 15. Sitemap Sektör Filtresi Testi
it('generateSitemapXml sektör eşleşmelerini, demosuz yapıyı ve kapalı dükkan hariç tutmayı doğrular', () => {
  const xml = generateSitemapXml('dukkanimyanimda.com.tr');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/berber</loc>'));
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/kuafor</loc>'));
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/randevu-sistemi</loc>'));
  assert.ok(!xml.includes('/r/demo'));
  assert.ok(!xml.includes('/m/demo'));
  assert.ok(xml.includes(`<loc>https://dukkanimyanimda.com.tr/${barberSlug}/randevu</loc>`));
  assert.ok(!xml.includes(`<loc>https://dukkanimyanimda.com.tr/r/${barberSlug}</loc>`));
  assert.ok(xml.includes(`<loc>https://dukkanimyanimda.com.tr/m/${cafeSlug}</loc>`));
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/rehber</loc>'));
});

// 16. Demo Kimliğinin Kaldırılması & Gerçek Berber/Restoran Kimliği Ayrıştırması
it('findShopForSeo demo rotalarını artık null döner, gerçek restoran ve kuaför kimliklerini ayırır', () => {
  assert.strictEqual(findShopForSeo('demo', 'menu'), null);
  assert.strictEqual(findShopForSeo('demo'), null);

  const cafeShop = findShopForSeo(cafeSlug, 'menu');
  assert.ok(cafeShop);
  assert.strictEqual(cafeShop.name, 'Liman Restoran & Bistro');
  assert.strictEqual(cafeShop.sectorKey, 'kafe_restoran');
  assert.ok(cafeShop.menuItems && cafeShop.menuItems.length > 0);

  const barberShop = findShopForSeo(barberSlug);
  assert.ok(barberShop);
  assert.strictEqual(barberShop.name, 'Altın Makas Erkek Kuaförü');

  const metaMenu = getSeoMetadata(`/m/${cafeSlug}`);
  assert.ok(metaMenu.title.includes('Liman Restoran & Bistro'));
  const htmlMenu = renderSeoHtml(`/m/${cafeSlug}`);
  assert.ok(htmlMenu.includes('Liman Restoran &amp; Bistro') || htmlMenu.includes('Liman Restoran & Bistro'));
});

// 17. Gerçek Salon Onaylı Yorumlar & AggregateRating
it('/r/:slug HairSalon şeması onaylı yorumlar varsa dinamik aggregateRating ve review içerir', () => {
  const meta = getSeoMetadata(`/r/${barberSlug}`);
  assert.ok(meta.schemaJson.aggregateRating, 'aggregateRating olmalı');
  assert.ok(Array.isArray(meta.schemaJson.review) && meta.schemaJson.review.length > 0, 'review dizisi olmalı');
  const html = renderSeoHtml(`/r/${barberSlug}`);
  assert.ok(html.includes('Doğrulanmış Müşteri Yorumları'), 'SSR gövdesinde görünür yorumlar olmalı');
});

// 18. /fiyat ve /kayit AggregateOffer + twitter:card + /t/:code
it('/fiyat ve /kayit AggregateOffer şeması, tüm sayfalar twitter:card ve /t/:code noindex döner', () => {
  for (const r of ['/fiyat', '/fiyatlandirma', '/kayit']) {
    const m = getSeoMetadata(r);
    assert.ok(m.schemaJson, `${r} schemaJson içermeli`);
    assert.strictEqual(m.schemaJson['@type'], 'SoftwareApplication');
    assert.strictEqual(m.schemaJson.offers['@type'], 'AggregateOffer');
    assert.strictEqual(m.schemaJson.offers.lowPrice, '0');
    assert.strictEqual(m.schemaJson.offers.highPrice, '499');
  }

  const minimalHtml = renderSeoHtml('/berber', 'dukkanimyanimda.com.tr', '<!doctype html><html><head><title>x</title></head><body><div id="root"></div></body></html>');
  assert.ok(minimalHtml.includes('name="twitter:card" content="summary_large_image"'), 'twitter:card enjekte edilmeli');

  const ticketMeta = getSeoMetadata('/t/rep_test_99');
  assert.strictEqual(ticketMeta.robots, 'noindex, follow');
  assert.ok(ticketMeta.title.includes('Servis'));
});

// 19. İnce SSR Sayfaları Zenginleştirme, Demosuz CTA'lar & Temiz Şemalar
it('/teknik-servis, /hukuk, /terzi zengin SSR gövdesi sunar ve sahte demo/telefon linkleri içermez', () => {
  const servisHtml = renderSeoHtml('/teknik-servis');
  assert.ok(!servisHtml.includes('/t/demo'), 'Teknik servis SSR içinde /t/demo linki olmamalı');
  assert.ok(servisHtml.includes('Esnaf Yorumları ve Kullanıcı Deneyimleri'), 'Görünür esnaf yorumları olmalı');

  const terziHtml = renderSeoHtml('/terzi');
  assert.ok(!terziHtml.includes('/t/demo'), 'Terzi SSR içinde /t/demo linki olmamalı');

  const hukukHtml = renderSeoHtml('/hukuk');
  assert.ok(hukukHtml.includes('Yaklaşan Duruşma Uyarıları'), 'Hukuk SSR kartları zengin olmalı');

  const homeMeta = getSeoMetadata('/');
  const homeJson = JSON.stringify(homeMeta.schemaJson);
  assert.ok(!homeJson.includes('555 0101'), 'Sahte pilot telefon numarası temizlenmiş olmalı');
  assert.ok(!homeJson.includes('Karaköy Kahvecisi'), 'Sahte Karaköy Kahvecisi şemadan kaldırılmış olmalı');
});

// 20. /rehber & /rehber/:slug İçerik Kümeleri + Çakışma/Doorway Noindex Koruması + Sitemap
it('SEO_GUIDE_ARTICLES çakışan/doorway 9 rehber noindex, benzersiz 4 aktif rehber SSR/Schema/Sitemap içinde eksiksizdir', () => {
  const noindexSlugs = new Set([
    'berber-no-show-onleme',
    'ucretsiz-qr-menu-olusturma',
    'dijital-veresiye-defteri-gecis',
    'komisyonsuz-randevu-programi',
    'istanbul-berber-kuafor',
    'ankara-berber-kuafor',
    'izmir-kafe-restoran',
    'izmit-berber-kuafor-randevu',
    'zonguldak-berber-kuafor-randevu',
  ]);
  const expectedSlugs = [
    'berber-no-show-onleme',
    'kuafor-prim-hesaplama',
    'ucretsiz-qr-menu-olusturma',
    'dijital-veresiye-defteri-gecis',
    'komisyonsuz-randevu-programi',
    'istanbul-berber-kuafor',
    'ankara-berber-kuafor',
    'izmir-kafe-restoran',
    'izmit-berber-kuafor-randevu',
    'zonguldak-berber-kuafor-randevu',
    'kocaeli-esnaf-online-randevu',
    'instagram-biyografi-randevu-linki',
    'pazar-gunu-acik-berber-randevu',
  ];
  assert.ok(Array.isArray(SEO_GUIDE_ARTICLES) && SEO_GUIDE_ARTICLES.length >= 13);
  assert.strictEqual(isValidGuideRoute('/rehber'), true);
  assert.strictEqual(isValidGuideRoute('/rehber/olmayan-yazi'), false);

  const xml = generateSitemapXml('dukkanimyanimda.com.tr');
  let activeCount = 0;
  for (const slug of expectedSlugs) {
    const route = `/rehber/${slug}`;
    assert.strictEqual(isValidGuideRoute(route), true, `${route} geçerli rehber rotası olmalı`);
    const meta = getSeoMetadata(route);
    assert.strictEqual(meta.schemaJson['@type'], 'Article', `${route} Article şeması içermeli`);
    assert.ok(meta.faqJson && meta.faqJson.length >= 1, `${route} FAQ içermeli`);
    const html = renderSeoHtml(route);
    assert.ok(html.includes('<h1'), `${route} SSR H1 içermeli`);
    if (noindexSlugs.has(slug)) {
      assert.strictEqual(meta.robots, 'noindex, follow', `${route} çakışma/doorway koruması için noindex, follow dönmeli`);
      assert.ok(!xml.includes(`<loc>https://dukkanimyanimda.com.tr${route}</loc>`), `${route} sitemap dışında tutulmalı`);
    } else {
      activeCount++;
      assert.ok(!meta.robots || !meta.robots.includes('noindex'), `${route} indekslenebilir olmalı`);
      assert.ok(xml.includes(`<loc>https://dukkanimyanimda.com.tr${route}</loc>`), `${route} sitemapte olmalı`);
    }
  }
  assert.strictEqual(activeCount, 4, '4 benzersiz aktif rehber rotası indekslenebilir ve sitemapte olmalı');
});

// 21. İzmit ve Zonguldak Yerel SEO Landing Sayfaları (LocalBusiness + Service & SSR & GeoCoordinates)
it('İzmit ve Zonguldak landing sayfaları doğru LocalBusiness/Service Geo şeması, H1 ve sitemap içerir', () => {
  const izmitMeta = getSeoMetadata('/izmit-berber-randevu');
  assert.ok(izmitMeta.title.includes('İzmit Berber Randevu'));
  assert.ok(izmitMeta.description.includes('Kocaeli'));
  assert.strictEqual(izmitMeta.schemaJson['@type'], 'LocalBusiness');
  assert.strictEqual(izmitMeta.schemaJson.geo.latitude, 40.7654);
  assert.strictEqual(izmitMeta.schemaJson.geo.longitude, 29.9408);
  assert.ok(Array.isArray(izmitMeta.extraSchemas) && izmitMeta.extraSchemas.some((s) => s['@type'] === 'Service' && Array.isArray(s.areaServed) && s.areaServed.length > 0), 'İzmit için Service + areaServed şeması olmalı');
  assert.ok(izmitMeta.faqJson && izmitMeta.faqJson.length >= 8, 'İzmit sayfasında en az 8 SSS olmalı');

  const izmitHtml = renderSeoHtml('/izmit-berber-randevu');
  assert.ok(izmitHtml.includes('İzmit ve Kocaeli Berber Randevu Sistemi'));
  assert.ok(izmitHtml.includes('Fethiye Caddesi'));
  assert.ok(izmitHtml.includes('"@type": "Service"'), 'İzmit HTML içine Service JSON-LD enjekte edilmeli');
  assert.ok(izmitHtml.includes('areaServed'), 'İzmit HTML içinde areaServed olmalı');
  assert.ok(!izmitHtml.includes('850-000-0000'), 'Sahte 0850-000-0000 numarası olmamalı');

  const zonguldakMeta = getSeoMetadata('/zonguldak-berber-randevu');
  assert.ok(zonguldakMeta.title.includes('Zonguldak Berber'));
  assert.ok(zonguldakMeta.description.includes('Ereğli'));
  assert.strictEqual(zonguldakMeta.schemaJson['@type'], 'LocalBusiness');
  assert.strictEqual(zonguldakMeta.schemaJson.geo.latitude, 41.4564);
  assert.strictEqual(zonguldakMeta.schemaJson.geo.longitude, 31.7987);
  assert.ok(Array.isArray(zonguldakMeta.extraSchemas) && zonguldakMeta.extraSchemas.some((s) => s['@type'] === 'Service' && Array.isArray(s.areaServed) && s.areaServed.length > 0), 'Zonguldak için Service + areaServed şeması olmalı');
  assert.ok(zonguldakMeta.faqJson && zonguldakMeta.faqJson.length >= 8, 'Zonguldak sayfasında en az 8 SSS olmalı');

  const zonguldakHtml = renderSeoHtml('/zonguldak-berber-randevu');
  assert.ok(zonguldakHtml.includes('Zonguldak ve Karadeniz Ereğli Berber Randevu'));
  assert.ok(zonguldakHtml.includes('Gazipaşa'));
  assert.ok(zonguldakHtml.includes('"@type": "Service"'), 'Zonguldak HTML içine Service JSON-LD enjekte edilmeli');
  assert.ok(zonguldakHtml.includes('areaServed'), 'Zonguldak HTML içinde areaServed olmalı');
  assert.ok(!zonguldakHtml.includes('850-000-0000'), 'Sahte 0850-000-0000 numarası olmamalı');

  const xml = generateSitemapXml('dukkanimyanimda.com.tr');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/izmit-berber-randevu</loc>'));
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/zonguldak-berber-randevu</loc>'));
});

// 22. Bağımsız Özellik Açılış Sayfaları (/veresiye-defteri, /kasa-programi, /gun-sonu-raporu, /qr-menu)
it('Yeni bağımsız özellik sayfaları özgün canonical, OG görseli, SoftwareApplication/AggregateOffer ve >=8 SSS içerir', () => {
  const xml = generateSitemapXml('dukkanimyanimda.com.tr');
  const featurePages = [
    { path: '/veresiye-defteri', og: '/og/veresiye-defteri.png' },
    { path: '/kasa-programi', og: '/og/kasa-programi.png' },
    { path: '/gun-sonu-raporu', og: '/og/gun-sonu-raporu.png' },
    { path: '/qr-menu', og: '/og/qr-menu.png' },
  ];

  const seenOg = new Set();
  for (const fp of featurePages) {
    const meta = getSeoMetadata(fp.path);
    assert.strictEqual(meta.canonical, `https://dukkanimyanimda.com.tr${fp.path}`, `${fp.path} bağımsız canonical olmalı`);
    assert.ok(meta.ogImage.endsWith(fp.og), `${fp.path} için özgün OG görseli (${fp.og}) atanmalı, gelen: ${meta.ogImage}`);
    seenOg.add(meta.ogImage);
    assert.strictEqual(meta.schemaJson['@type'], 'SoftwareApplication', `${fp.path} SoftwareApplication şemasına sahip olmalı`);
    assert.strictEqual(meta.schemaJson.offers['@type'], 'AggregateOffer', `${fp.path} AggregateOffer fiyatlandırmasına sahip olmalı`);
    assert.ok(Array.isArray(meta.faqJson) && meta.faqJson.length >= 8, `${fp.path} için en az 8 SSS olmalı`);
    assert.ok(SEO_LANDING_PAGES[fp.path], `${fp.path} derin landing içeriği tanımlı olmalı`);

    const html = renderSeoHtml(fp.path);
    assert.ok(html.includes('<h1'), `${fp.path} SSR HTML içinde <h1> bulunmalı`);
    assert.ok(xml.includes(`<loc>https://dukkanimyanimda.com.tr${fp.path}</loc>`), `${fp.path} sitemapte yer almalı`);
  }
  assert.strictEqual(seenOg.size, 4, 'Tüm özellik sayfalarının OG görselleri birbirinden benzersiz olmalı');
});

// 23. Blog Hub ve 15 Blog Yazısı SSR / Schema / Sitemap
it('/blog hub ve 15 makale sayfası Article + FAQPage + BreadcrumbList + sitemap entegrasyonuna sahiptir', () => {
  assert.strictEqual(BLOG_ARTICLES.length, 15, '15 adet blog makalesi tanımlı olmalı');
  const xml = generateSitemapXml('dukkanimyanimda.com.tr');

  const hubMeta = getSeoMetadata('/blog');
  assert.strictEqual(hubMeta.canonical, 'https://dukkanimyanimda.com.tr/blog');
  assert.strictEqual(hubMeta.schemaJson['@type'], 'Blog');
  assert.ok(hubMeta.ogImage.endsWith('/og/blog.png'));
  const hubHtml = renderSeoHtml('/blog');
  assert.ok(hubHtml.includes('<h1'), '/blog SSR H1 içermeli');

  for (const art of BLOG_ARTICLES) {
    const route = `/blog/${art.slug}`;
    assert.strictEqual(isValidBlogRoute(route), true, `${route} geçerli blog rotası olmalı`);
    const meta = getSeoMetadata(route);
    assert.strictEqual(meta.canonical, `https://dukkanimyanimda.com.tr${route}`);
    assert.strictEqual(meta.schemaJson['@type'], 'Article', `${route} Article şeması vermeli`);
    assert.ok(meta.ogImage.includes('/og/'), `${route} /og/ görseli kullanmalı`);
    assert.ok(Array.isArray(meta.faqJson) && meta.faqJson.length >= 3, `${route} FAQ şeması içermeli`);
    assert.ok(Array.isArray(meta.breadcrumbs) && meta.breadcrumbs.length >= 3, `${route} BreadcrumbList içermeli`);

    const html = renderSeoHtml(route);
    assert.ok(html.includes('<h1'), `${route} SSR H1 içermeli`);
    assert.ok(xml.includes(`<loc>https://dukkanimyanimda.com.tr${route}</loc>`), `${route} sitemapte bulunmalı`);
  }

  const missingMeta = getSeoMetadata('/blog/var-olmayan-yazi-slug');
  assert.strictEqual(missingMeta.robots, 'noindex, follow', 'Bilinmeyen blog slug noindex, follow vermeli');
});

// 24. Sitemap Realistic Lastmod ve Changefreq Çeşitliliği
it('Sitemap tüm sayfalara aynı lastmod basmaz ve gerçekçi changefreq/og görseli üretir', () => {
  const xml = generateSitemapXml('dukkanimyanimda.com.tr');
  const lastmodMatches = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  const distinctLastmods = new Set(lastmodMatches);
  assert.ok(distinctLastmods.size >= 4, `Sitemapte en az 4 farklı lastmod tarihi olmalı, bulunan: ${distinctLastmods.size}`);

  const changefreqMatches = [...xml.matchAll(/<changefreq>([^<]+)<\/changefreq>/g)].map((m) => m[1]);
  assert.ok(changefreqMatches.includes('weekly'), 'Sitemap weekly changefreq içermeli');
  assert.ok(changefreqMatches.includes('monthly'), 'Sitemap monthly changefreq içermeli');
  assert.ok(changefreqMatches.includes('yearly'), 'Sitemap yearly changefreq içermeli');
  assert.ok(!changefreqMatches.every((c) => c === 'daily'), 'Tüm sayfalar daily olmamalı');

  const imageLocs = [...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((m) => m[1]);
  assert.ok(imageLocs.some((loc) => loc.includes('/og/veresiye-defteri.png')), 'Sitemap /og/veresiye-defteri.png içermeli');
  assert.ok(imageLocs.some((loc) => loc.includes('/og/blog.png')), 'Sitemap /og/blog.png içermeli');
  assert.ok(imageLocs.some((loc) => loc.includes('/og/iletisim.png')), 'Sitemap /og/iletisim.png içermeli');
  assert.ok(imageLocs.some((loc) => loc.includes('/og/gizlilik.png')), 'Sitemap /og/gizlilik.png içermeli');
});

// 25. SSR "Powered by Dükkanım Yanımda" Linkleri & İletişim/Gizlilik Özgün OG Görselleri
it('/r/:slug ve /m/:slug SSR çıktıları Powered by bağlantısı, /iletisim ve /gizlilik özgün OG görseli içerir', () => {
  const barberHtml = renderSeoHtml(`/r/${barberSlug}`);
  assert.ok(barberHtml.includes('Powered by Dükkanım Yanımda'), '/r/:slug SSR Powered by linki içermeli');
  assert.ok(barberHtml.includes('/berber'), '/r/:slug Powered by linki /berber sayfasına bağlanmalı');

  const menuHtml = renderSeoHtml(`/m/${cafeSlug}`);
  assert.ok(menuHtml.includes('Powered by Dükkanım Yanımda'), '/m/:slug SSR Powered by linki içermeli');
  assert.ok(menuHtml.includes('/qr-menu'), '/m/:slug Powered by linki /qr-menu sayfasına bağlanmalı');

  const iletisimMeta = getSeoMetadata('/iletisim');
  assert.ok(iletisimMeta.ogImage.endsWith('/og/iletisim.png'), '/iletisim özgün OG görseline sahip olmalı');
  const gizlilikMeta = getSeoMetadata('/gizlilik');
  assert.ok(gizlilikMeta.ogImage.endsWith('/og/gizlilik.png'), '/gizlilik özgün OG görseline sahip olmalı');
});

// 26. 2 Sektör Sadeleştirme 301 Yönlendirmeleri & IDN Domain Canonical Koruması
it('Kapatılan sektörler + çakışan rehberler 301 haritasında tanımlıdır ve IDN host ana domaine normalize edilir', () => {
  assert.strictEqual(SEO_PERMANENT_REDIRECTS['/bakkal-market'], '/kasa-programi');
  assert.strictEqual(SEO_PERMANENT_REDIRECTS['/teknik-servis'], '/');
  assert.strictEqual(SEO_PERMANENT_REDIRECTS['/hukuk'], '/');
  assert.strictEqual(SEO_PERMANENT_REDIRECTS['/terzi'], '/');
  assert.strictEqual(SEO_PERMANENT_REDIRECTS['/rehber/berber-no-show-onleme'], '/blog/kuafor-musteri-gelmeme-no-show-cozumu');
  assert.strictEqual(SEO_PERMANENT_REDIRECTS['/rehber/izmit-berber-kuafor-randevu'], '/izmit-berber-randevu');
  assert.strictEqual(SEO_PERMANENT_REDIRECTS['/rehber/zonguldak-berber-kuafor-randevu'], '/zonguldak-berber-randevu');

  const idnMeta = getSeoMetadata('/berber', 'xn--dkkanmyanmda-dlb06eea.com.tr');
  assert.strictEqual(idnMeta.canonical, 'https://dukkanimyanimda.com.tr/berber', 'IDN host canonical olarak ana domaine dönmeli');
  const wwwSitemap = generateSitemapXml('www.dukkanimyanimda.com.tr');
  assert.ok(!wwwSitemap.includes('https://www.dukkanimyanimda.com.tr'), 'www host sitemapte olmamalı');
});

// 27. Kuaför İzmit Hibrit Sayfası (/izmit-kuafor-randevu), Yerel ItemList ve BreadcrumbList.name Koruması
it('/izmit-kuafor-randevu B2C+B2B hibrit vitrin, HairSalon+ItemList şeması, named BreadcrumbList ve sitemap kaydı içerir', () => {
  const kuaforIzmitMeta = getSeoMetadata('/izmit-kuafor-randevu');
  assert.strictEqual(kuaforIzmitMeta.canonical, 'https://dukkanimyanimda.com.tr/izmit-kuafor-randevu');
  assert.ok(kuaforIzmitMeta.title.includes('Kuaför İzmit'), 'Başlık Kuaför İzmit anahtar kelimesini taşımalı');
  assert.strictEqual(kuaforIzmitMeta.schemaJson['@type'], 'HairSalon');
  assert.strictEqual(kuaforIzmitMeta.schemaJson.geo.latitude, 40.7654);
  assert.ok(
    Array.isArray(kuaforIzmitMeta.extraSchemas) &&
      kuaforIzmitMeta.extraSchemas.some((s) => s['@type'] === 'ItemList' && s.numberOfItems > 0) &&
      kuaforIzmitMeta.extraSchemas.some((s) => s['@type'] === 'Service'),
    '/izmit-kuafor-randevu hem ItemList hem Service şeması içermeli'
  );
  assert.ok(kuaforIzmitMeta.faqJson && kuaforIzmitMeta.faqJson.length >= 8);

  const izmitBerberMeta = getSeoMetadata('/izmit-berber-randevu');
  assert.ok(
    Array.isArray(izmitBerberMeta.extraSchemas) && izmitBerberMeta.extraSchemas.some((s) => s['@type'] === 'ItemList'),
    '/izmit-berber-randevu da B2C ItemList şeması içermeli'
  );

  const html = renderSeoHtml('/izmit-kuafor-randevu');
  assert.ok(html.includes('Kuaför İzmit'), 'SSR gövdesinde Kuaför İzmit H1 bulunmalı');
  assert.ok(html.includes('Google Haritalar'), 'SSR gövdesinde Google Haritalar çarpanı bölümü bulunmalı');

  const ldJsonBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const breadcrumbParsed = ldJsonBlocks.find((b) => b['@type'] === 'BreadcrumbList');
  assert.ok(breadcrumbParsed, 'BreadcrumbList JSON-LD enjekte edilmeli');
  assert.ok(
    typeof breadcrumbParsed.name === 'string' && breadcrumbParsed.name.includes('Ana Sayfa >'),
    `BreadcrumbList üst seviye name alanı tanımlı olmalı (Adsız öğe olmamalı), gelen: ${breadcrumbParsed.name}`
  );

  const xml = generateSitemapXml('dukkanimyanimda.com.tr');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/izmit-kuafor-randevu</loc>'), 'Sitemap /izmit-kuafor-randevu içermeli');

  const homeMeta = getSeoMetadata('/');
  const homeItemList = homeMeta.schemaJson['@graph'].find((g) => g['@type'] === 'ItemList');
  const barberItem = homeItemList.itemListElement.find((el) => el.item && el.item.url && el.item.url.includes(barberSlug));
  assert.ok(barberItem && barberItem.item.url.endsWith(`/${barberSlug}/randevu`), 'Harita şeması salonları canonical /:slug/randevu ucuna bağlamalı');
});

cleanupSeoFixtures();

console.log(`\n========================================`);
console.log(`SEO TESTLERİ SONUCU: ${passed} / ${total} BAŞARILI`);
console.log(`========================================\n`);

if (passed !== total) {
  process.exit(1);
}

process.exit(0);
