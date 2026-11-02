import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  findShopForSeo,
  getSeoMetadata,
  renderSeoHtml,
  generateSitemapXml,
  getRobotsTxt,
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
it('/r/:slug rotası için dükkan adıyla dinamik title ve og etiketleri üretir', () => {
  const meta = getSeoMetadata('/r/demo');
  assert.ok(meta.title.includes('Online Randevu Al | Dükkanım Yanımda'), 'Title randevu içermeli');
  assert.ok(meta.ogTitle.includes('Kolay Online Randevu'), 'og:title randevu içermeli');
  assert.ok(meta.ogDescription.includes('sıra beklemeden online randevunuzu hemen oluşturun'), 'og:description uygun olmalı');
  assert.ok(meta.canonical.includes('/r/'), 'canonical URL randevu ucu olmalı');
  assert.ok(meta.ogImage.startsWith('https://'), 'og:image tam URL olmalı');
  assert.ok(meta.schemaJson, 'schema.org JSON-LD verisi olmalı');
  assert.strictEqual(meta.schemaJson['@type'], 'HealthAndBeautyBusiness');
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
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/r/demo</loc>'), 'Demo randevu loc olmalı');
  assert.ok(xml.includes('<loc>https://dukkanimyanimda.com.tr/m/demo</loc>'), 'Demo menü loc olmalı');
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

console.log(`\n========================================`);
console.log(`SEO TESTLERİ SONUCU: ${passed} / ${total} BAŞARILI`);
console.log(`========================================\n`);

if (passed !== total) {
  process.exit(1);
}
