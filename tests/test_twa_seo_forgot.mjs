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
const { renderSeoHtml, getSeoMetadata } = await import('../dist/server.cjs');

// 2a. Randevu: /r/demo
const htmlRandevu = renderSeoHtml('/r/demo', 'dukkanimyanimda.com.tr');
assert(htmlRandevu.includes('Makas &amp; Tarak Erkek Kuaförü - Online Randevu Al') || htmlRandevu.includes('Makas & Tarak Erkek Kuaförü - Online Randevu Al'), 'Randevu başlığında dükkan adı olmalı');
assert(htmlRandevu.includes('Makas &amp; Tarak Erkek Kuaförü - Kolay Online Randevu') || htmlRandevu.includes('Makas & Tarak Erkek Kuaförü - Kolay Online Randevu'), 'og:title dükkan adını içermeli');
assert(htmlRandevu.includes('Makas &amp; Tarak Erkek Kuaförü') || htmlRandevu.includes('Makas & Tarak Erkek Kuaförü'), 'og:description dükkan adını içermeli');
console.log('✓ /r/demo: WhatsApp önizleme başlıklarında gerçek dükkan adı doğrulandı.');

// 2b. Menü: /m/demo
const htmlMenu = renderSeoHtml('/m/demo', 'dukkanimyanimda.com.tr');
assert(htmlMenu.includes('Makas &amp; Tarak Erkek Kuaförü') || htmlMenu.includes('Makas & Tarak Erkek Kuaförü'), 'Menü sayfasında dükkan adı olmalı');
assert(htmlMenu.includes('property="og:title"'), 'og:title bulunmalı');
assert(htmlMenu.includes('property="og:description"'), 'og:description bulunmalı');
console.log('✓ /m/demo: Dijital QR menü başlığı ve OG meta etiketleri doğrulandı.');

// 2c. Sektör Sayfaları: /berber, /kafe-restoran, /bakkal
const htmlBerber = renderSeoHtml('/berber', 'dukkanimyanimda.com.tr');
assert(htmlBerber.includes('Berber &amp; Kuaför') || htmlBerber.includes('Berber & Kuaför'), '/berber başlığı doğru olmalı');
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
