import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  findShopForSeo,
  getSeoMetadata,
  renderSeoHtml,
  generateSitemapXml,
  getRobotsTxt,
  getDynamicSeoFreshness,
} = require('../dist/server.cjs');

console.log('🧪 SEO ve Sosyal Paylaşım Önizleme Testleri Başlatılıyor...\n');

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
it('findShopForSeo demo dükkanı doğru çözer', () => {
  const shop = findShopForSeo('demo');
  assert.ok(shop, 'Demo dükkan bulunmalı');
  assert.strictEqual(shop.exists, true);
  assert.ok(shop.name.length > 0, 'Dükkan adı olmalı');
});

it('findShopForSeo var olmayan dükkan için null döner', () => {
  const shop = findShopForSeo('bu-isimde-bir-dukkan-asla-yok-123456');
  assert.strictEqual(shop, null);
});

// 2. Randevu Rotaları Metadata (/r/:slug)
it('/r/:slug rotası için dükkan adıyla dinamik title, HairSalon şeması ve ReserveAction üretir', () => {
  const meta = getSeoMetadata('/r/demo');
  assert.ok(meta.title.includes('Online Randevu Al | Dükkanım Yanımda'), 'Title randevu içermeli');
  assert.ok(meta.ogTitle.includes('Kolay Online Randevu'), 'og:title randevu içermeli');
  assert.ok(meta.ogDescription.includes('sıra beklemeden online randevunuzu hemen oluşturun'), 'og:description uygun olmalı');
  assert.ok(meta.canonical.includes('/r/'), 'canonical URL randevu ucu olmalı');
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
  const meta = getSeoMetadata('/m/demo');
  assert.ok(meta.title.includes('Dijital QR Menü & Fiyatlar | Dükkanım Yanımda'), 'Title menü içermeli');
  assert.ok(meta.ogTitle.includes('Dijital Menü'), 'og:title menü içermeli');
  assert.ok(meta.ogDescription.includes('masadan garson çağırma'), 'og:description garson çağırma içermeli');
  assert.ok(meta.canonical.includes('/m/'), 'canonical URL menü ucu olmalı');
  assert.ok(meta.schemaJson, 'schema.org JSON-LD verisi olmalı');
  assert.strictEqual(meta.schemaJson['@type'], 'Restaurant');
});

// 4. Sektör Açılış Rotaları
it('/berber ve /kuafor esnafa özel randevu ve yönetim SEO etiketleri üretir', () => {
  const metaBerber = getSeoMetadata('/berber');
  const metaKuafor = getSeoMetadata('/kuafor');
  assert.ok(metaBerber.title.includes('Berber & Kuaför Randevu ve Dükkan Yönetim Sistemi'));
  assert.ok(metaKuafor.title.includes('Berber & Kuaför Randevu ve Dükkan Yönetim Sistemi'));
  assert.ok(metaBerber.ogDescription.includes('Koltuk sırası, online randevu'));
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

  const html = renderSeoHtml('/r/demo', 'dukkanimyanimda.com.tr', mockTemplate);

  assert.ok(html.includes('Online Randevu Al | Dükkanım Yanımda'), 'Yeni başlık enjekte edilmeli');
  assert.ok(!html.includes('Eski Başlık'), 'Eski başlık kalmamalı');
  assert.ok(html.includes('Kolay Online Randevu'), 'Yeni og:title olmalı');
  assert.ok(html.includes('schema.org'), 'schema.org JSON-LD enjekte edilmeli');
  assert.ok(html.includes('HealthAndBeautyBusiness'), 'HealthAndBeautyBusiness tipi olmalı');
});

it('renderSeoHtml disk yerine bellek önbelleğinden ultra hızlı çalışır (< 2ms)', () => {
  const t0 = performance.now();
  for (let i = 0; i < 100; i++) {
    renderSeoHtml('/r/demo');
  }
  const elapsed = performance.now() - t0;
  const avg = elapsed / 100;
  assert.ok(avg < 2, `100 istek ortalama ${avg.toFixed(3)}ms sürdü, 2ms altında olmalı`);
});

// 6. Dinamik Sitemap.xml Testi
it('generateSitemapXml geçerli ve zengin bir sitemap üretir', () => {
  const xml = generateSitemapXml('dukkanimyanimda.com.tr');
  assert.ok(xml.startsWith('<?xml'), 'XML beyanı ile başlamalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/</loc>'), 'Ana sayfa loc olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/berber</loc>'), 'Berber rotası olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/kafe-restoran</loc>'), 'Kafe rotası olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/bakkal-market</loc>'), 'Bakkal rotası olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/guzellik-salonu</loc>'), 'Güzellik salonu rotası olmalı');
  assert.ok(xml.includes('sitemap-image'), 'Google image sitemap namespace olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/r/demo</loc>'), 'Demo randevu loc olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/m/demo</loc>'), 'Demo menü loc olmalı');

  // Alias ve başka sayfalara canonical veren linkler sitemap'te yer almamalı (Google Search Console uyarısı önleme)
  assert.ok(!xml.includes('<loc>https://dukkanimyanimda.com.tr/kuafor-randevu</loc>'), 'Alias rotası sitemapte olmamalı');
  assert.ok(!xml.includes('<loc>https://dukkanimyanimda.com.tr/adisyon</loc>'), 'Alias rotası sitemapte olmamalı');
  assert.ok(!xml.includes('<loc>https://dukkanimyanimda.com.tr/veresiye-defteri</loc>'), 'Alias rotası sitemapte olmamalı');
});

// 7. Robots.txt Testi
it('getRobotsTxt arama motorları için doğru kuralları döner', () => {
  const robots = getRobotsTxt('dukkanimyanimda.com.tr');
  assert.ok(robots.includes('User-agent: *'));
  assert.ok(robots.includes('Allow: /'));
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

console.log(`\n========================================`);
console.log(`SEO TESTLERİ SONUCU: ${passed} / ${total} BAŞARILI`);
console.log(`========================================\n`);

if (passed !== total) {
  process.exit(1);
}

process.exit(0);
