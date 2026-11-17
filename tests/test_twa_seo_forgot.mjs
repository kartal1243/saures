import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('=== GÖREV 1-4 TEST PAKETİ BAŞLIYOR ===\n');

// 1. assetlinks.json varlığı ve format testi
console.log('TEST 1: Google Play TWA assetlinks.json');
const assetlinksPath = path.join(process.cwd(), 'dist', '.well-known', 'assetlinks.json');
assert(fs.existsSync(assetlinksPath), 'dist/.well-known/assetlinks.json mevcut olmalı');
const assetContent = JSON.parse(fs.readFileSync(assetlinksPath, 'utf-8'));
assert(Array.isArray(assetContent), 'assetlinks array olmalı');
assert(assetContent[0].relation.includes('delegate_permission/common.handle_all_urls'), 'handle_all_urls içermeli');
assert(assetContent[0].target.package_name === 'com.dukkanimyanimda.twa', 'package_name com.dukkanimyanimda.twa olmalı');
assert(assetContent[0].target.sha256_cert_fingerprints.length > 0, 'fingerprints listesi dolu olmalı');
console.log('✓ assetlinks.json formatı ve içeriği doğrulandı.\n');

// 2. Dinamik SEO HTML Testleri
console.log('TEST 2: Dinamik SEO HTML ve Open Graph Meta Etiketleri');
const {
  renderSeoHtml,
  findShopForSeo,
  addAccount,
  removeAccount,
  hashPassword,
  loadShopState,
  setShopState,
  SHOPS_DIR,
} = (await import('../dist/server.cjs')).default || (await import('../dist/server.cjs'));

const barberAccId = `acc_test_twa_barber_${Date.now()}`;
const cafeAccId = `acc_test_twa_cafe_${Date.now()}`;

try {
  addAccount({
    id: barberAccId,
    shopName: 'Makas Sanatı Kuaför',
    ownerName: 'Ahmet Usta',
    phone: '05328887766',
    passwordHash: hashPassword('Test123456!'),
    createdAt: new Date().toISOString(),
  });
  const bst = loadShopState(barberAccId);
  bst.shopProfile = {
    storeName: 'Makas Sanatı Kuaför',
    ownerName: 'Ahmet Usta',
    businessField: 'Berber / Kuaför',
    sectorKey: 'berber_kuafor',
    employeeCount: '2',
    phone: '05328887766',
    cityDistrict: 'İstanbul / Kadıköy',
    dailyTarget: 3000,
    slug: 'makas-sanati-twa',
    isConfigured: true,
    isVip: true,
  };
  setShopState(barberAccId, bst);

  addAccount({
    id: cafeAccId,
    shopName: 'Kordon Bistro Kafe',
    ownerName: 'Mehmet Usta',
    phone: '05337776655',
    passwordHash: hashPassword('Test123456!'),
    createdAt: new Date().toISOString(),
  });
  const cst = loadShopState(cafeAccId);
  cst.shopProfile = {
    storeName: 'Kordon Bistro Kafe',
    ownerName: 'Mehmet Usta',
    businessField: 'Kafe & Restoran',
    sectorKey: 'kafe_restoran',
    employeeCount: '3',
    phone: '05337776655',
    cityDistrict: 'İzmir / Konak',
    dailyTarget: 5000,
    slug: 'kordon-bistro-twa',
    isConfigured: true,
    isVip: true,
  };
  cst.menuItems = [
    { id: 'm1', name: 'Türk Kahvesi', price: 60, category: 'İçecekler', isAvailable: true },
  ];
  setShopState(cafeAccId, cst);

  // Demo rotaları artık sahte dükkan dönmemeli
  assert.strictEqual(findShopForSeo('demo'), null, '/r/demo artık null dönmeli');
  assert.strictEqual(findShopForSeo('demo', 'menu'), null, '/m/demo artık null dönmeli');

  // 2a. Randevu: gerçek dükkan
  const htmlRandevu = renderSeoHtml('/r/makas-sanati-twa', 'dukkanimyanimda.com.tr');
  assert(htmlRandevu.includes('Makas Sanatı Kuaför - Online Randevu Al'), 'Randevu başlığında gerçek dükkan adı olmalı');
  assert(htmlRandevu.includes('Makas Sanatı Kuaför - Kolay Online Randevu'), 'og:title dükkan adını içermeli');
  console.log('✓ /r/:slug: WhatsApp önizleme başlıklarında gerçek dükkan adı doğrulandı.');

  // 2b. Menü: gerçek restoran
  const htmlMenu = renderSeoHtml('/m/kordon-bistro-twa', 'dukkanimyanimda.com.tr');
  assert(htmlMenu.includes('Kordon Bistro Kafe'), 'Menü sayfasında gerçek restoran adı olmalı');
  assert(htmlMenu.includes('property="og:title"'), 'og:title bulunmalı');
  assert(htmlMenu.includes('property="og:description"'), 'og:description bulunmalı');
  console.log('✓ /m/:slug: Dijital QR menü başlığı ve OG meta etiketleri doğrulandı.');
} finally {
  removeAccount(barberAccId);
  removeAccount(cafeAccId);
  try { fs.unlinkSync(path.join(SHOPS_DIR, `${barberAccId}.json`)); } catch {}
  try { fs.unlinkSync(path.join(SHOPS_DIR, `${cafeAccId}.json`)); } catch {}
}

// 2c. Sektör Sayfaları: /berber, /kafe-restoran, /bakkal
const htmlBerber = renderSeoHtml('/berber', 'dukkanimyanimda.com.tr');
assert(htmlBerber.includes('Berber Randevu') || htmlBerber.includes('Berber &amp; Kuaför'), '/berber başlığı doğru olmalı');
const htmlKafe = renderSeoHtml('/kafe-restoran', 'dukkanimyanimda.com.tr');
assert(htmlKafe.includes('Kafe &amp; Restoran') || htmlKafe.includes('Kafe & Restoran'), '/kafe-restoran başlığı doğru olmalı');
const htmlBakkal = renderSeoHtml('/bakkal', 'dukkanimyanimda.com.tr');
assert(htmlBakkal.includes('Bakkal &amp; Market') || htmlBakkal.includes('Bakkal & Market'), '/bakkal başlığı doğru olmalı');
console.log('✓ Sektör sayfaları (/berber, /kafe-restoran, /bakkal) dinamik SEO başlıkları doğrulandı.\n');

// 3. Telefon Doğrulama ve normalizePhone
console.log('TEST 3: Telefon Doğrulama & Güvenlik');
const { isValidTurkishPhone, normalizePhone } = await import('../dist/server.cjs');
assert.strictEqual(isValidTurkishPhone('05321112233'), true, 'Geçerli numara true dönmeli');
assert.strictEqual(isValidTurkishPhone('0532abc1234'), false, 'Harf içeren numara false dönmeli');
assert.strictEqual(isValidTurkishPhone('05555555555'), false, 'Sahte numara false dönmeli');
console.log('✓ Telefon doğrulama kuralları doğrulandı.\n');

console.log('==============================================');
console.log('TÜM TESTLER BAŞARIYLA GEÇTİ! SİSTEM HAZIR.');
console.log('==============================================');
process.exit(0);
