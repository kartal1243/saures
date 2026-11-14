import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  findShopForSeo,
  getSeoMetadata,
  renderSeoHtml,
  isValidGuideRoute,
  SEO_GUIDE_ARTICLES,
} from '../backend/seo.ts';
import { sendSmsMessage, getSmsGatewayStatus } from '../backend/services/smsProvider.ts';
import { runReminderCycleNow, startReminderScheduler } from '../backend/services/reminderScheduler.ts';
import { lookupPublicTicket } from '../backend/routes/repair.ts';
import {
  enqueueOfflineMutation,
  flushOfflineOutbox,
  getPendingOfflineCount,
  clearOfflineOutbox,
  initOfflineSyncListener,
} from '../frontend/utils/offlineQueue.ts';
import {
  encodeTurkishCp857,
  buildEscPosReceiptBytes,
  printReceiptThermal,
} from '../frontend/utils/printerService.ts';
import { printHtmlDocument, escapeHtml } from '../frontend/utils/printTemplate.ts';

console.log('🧪 Dükkanım Yanımda — Kapsamlı Bakım & Faz (0–3 / P0–P2) Doğrulama Test Paketi Başlıyor...\n');

const rootDir = process.cwd();
const readSrc = (relPath) => fs.readFileSync(path.join(rootDir, relPath), 'utf8');

// 1. SEO: /rehber, /rehber/:slug ve /m/demo Kafe Kimliği Ayrıştırması
{
  assert.ok(Array.isArray(SEO_GUIDE_ARTICLES) && SEO_GUIDE_ARTICLES.length >= 8, 'SEO_GUIDE_ARTICLES en az 8 makale içermeli');
  assert.equal(isValidGuideRoute('/rehber'), true, '/rehber geçerli bir rehber rotası olmalı');
  assert.equal(isValidGuideRoute('/rehber/berber-no-show-onleme'), true, '/rehber/berber-no-show-onleme geçerli olmalı');
  assert.equal(isValidGuideRoute('/rehber/istanbul-berber-kuafor'), true, '/rehber/istanbul-berber-kuafor geçerli olmalı');
  assert.equal(isValidGuideRoute('/rehber/olmayan-makale-404'), false, 'Geçersiz rehber rotası false dönmeli');

  const menuDemoShop = findShopForSeo('demo', 'menu');
  assert.ok(menuDemoShop, 'findShopForSeo("demo", "menu") sonuç dönmeli');
  assert.match(menuDemoShop.name, /Karaköy Kahvecisi/i, '/m/demo dükkan adı Karaköy Kahvecisi & Bistro olmalı');
  assert.equal(menuDemoShop.sectorKey, 'kafe_restoran', '/m/demo sectorKey kafe_restoran olmalı');

  const barberDemoShop = findShopForSeo('demo', 'barber');
  assert.ok(barberDemoShop, 'findShopForSeo("demo", "barber") sonuç dönmeli');
  assert.notEqual(barberDemoShop.name, menuDemoShop.name, '/r/demo ile /m/demo kimlikleri ayrışmış olmalı');

  const customBaseTpl = '<!DOCTYPE html><html><head><title>Base</title></head><body><div id="root"></div></body></html>';
  const mDemoHtml = renderSeoHtml('/m/demo', 'dukkanimyanimda.com.tr', customBaseTpl);
  assert.match(mDemoHtml, /Karaköy Kahvecisi/i, 'SSR /m/demo HTML içinde Karaköy Kahvecisi geçmeli');
  assert.match(mDemoHtml, /twitter:card/i, 'renderSeoHtml içinde twitter:card meta etiketi bulunmalı');

  const ticketMeta = getSeoMetadata('/t/demo');
  assert.match(ticketMeta.robots || '', /noindex/i, '/t/:code rotası noindex içermeli');

  console.log('  ✅ PASS 1: /rehber içerik kümeleri, /m/demo kafe kimliği ve /t/:code SEO doğrulandı.');
}

// 2. Kamusal Takip (/api/public/ticket/:code) ve PublicTicketTrackerView
{
  const demoTicket = lookupPublicTicket('demo');
  assert.ok(demoTicket && demoTicket.code === 'demo', 'lookupPublicTicket("demo") demo fiş döndürmeli');
  assert.match(demoTicket.shopName, /TeknoFix/i, 'Demo fiş shopName TeknoFix Teknik Servis olmalı');

  const menuRouteSrc = readSrc('backend/routes/menu.ts');
  assert.match(menuRouteSrc, /\/api\/public\/ticket\/:code/, 'backend/routes/menu.ts içinde /api/public/ticket/:code tanımlı olmalı');

  assert.ok(
    fs.existsSync(path.join(rootDir, 'frontend/components/public/PublicTicketTrackerView.tsx')),
    'PublicTicketTrackerView.tsx dosyası mevcut olmalı'
  );
  const appSrc = readSrc('frontend/App.tsx');
  assert.match(appSrc, /PublicTicketTrackerView/, 'frontend/App.tsx içinde PublicTicketTrackerView bağlı olmalı');

  console.log('  ✅ PASS 2: /api/public/ticket/:code ve PublicTicketTrackerView entegrasyonu doğrulandı.');
}

// 3. QR Menüden Canlı Sipariş (/api/public/menu/:identifier/order) ve PublicQrMenuView
{
  const menuRouteSrc = readSrc('backend/routes/menu.ts');
  assert.match(
    menuRouteSrc,
    /\/api\/public\/menu\/:identifier\/order/,
    'backend/routes/menu.ts içinde POST /api/public/menu/:identifier/order tanımlı olmalı'
  );
  assert.match(menuRouteSrc, /TABLE_UPDATED/, 'Canlı QR sipariş sonrası TABLE_UPDATED WS yayını yapılmalı');

  const qrViewSrc = readSrc('frontend/components/public/PublicQrMenuView.tsx');
  assert.match(qrViewSrc, /\/api\/public\/menu\//, 'PublicQrMenuView.tsx sipariş API çağrısı içermeli');
  assert.match(qrViewSrc, /utm_source=qr_menu/, 'PublicQrMenuView.tsx viral UTM rozeti içermeli');

  console.log('  ✅ PASS 3: /api/public/menu/:identifier/order canlı sipariş ve PublicQrMenuView doğrulandı.');
}

// 4. Türkiye Barkod Kataloğu (/api/products/barcode-catalog/:barcode) ve Kamera Barkod
{
  const productsRouteSrc = readSrc('backend/routes/products.ts');
  assert.match(
    productsRouteSrc,
    /\/api\/products\/barcode-catalog\/:barcode/,
    'backend/routes/products.ts içinde /api/products/barcode-catalog/:barcode tanımlı olmalı'
  );
  assert.match(productsRouteSrc, /TR_BARCODE_CATALOG/, 'TR_BARCODE_CATALOG tanımlı olmalı');

  const fastPosSrc = readSrc('frontend/components/sector/FastRetailCounterView.tsx');
  assert.match(fastPosSrc, /BarcodeDetector/, 'FastRetailCounterView.tsx içinde BarcodeDetector entegrasyonu olmalı');

  const productModalSrc = readSrc('frontend/components/stock/ProductFormModal.tsx');
  assert.match(productModalSrc, /barcode-catalog/, 'ProductFormModal.tsx içinde barcode-catalog sorgusu olmalı');

  console.log('  ✅ PASS 4: /api/products/barcode-catalog/:barcode ve kamera barkod okuyucu doğrulandı.');
}

// 5. SMS Sağlayıcı (smsProvider) ve Otomatik Hatırlatıcı (reminderScheduler)
{
  assert.equal(typeof sendSmsMessage, 'function', 'sendSmsMessage fonksiyon olmalı');
  assert.equal(typeof getSmsGatewayStatus, 'function', 'getSmsGatewayStatus fonksiyon olmalı');
  const smsRes = await sendSmsMessage('05551234567', 'Test randevu hatırlatma mesajı');
  assert.ok(smsRes.whatsappLink.includes('905551234567'), 'sendSmsMessage normalize edilmiş WhatsApp fallback linki üretmeli');

  assert.equal(typeof runReminderCycleNow, 'function', 'runReminderCycleNow fonksiyon olmalı');
  assert.equal(typeof startReminderScheduler, 'function', 'startReminderScheduler fonksiyon olmalı');
  const cycleStats = await runReminderCycleNow();
  assert.equal(typeof cycleStats.checkedShops, 'number', 'runReminderCycleNow checkedShops istatistiği dönmeli');

  const maintSrc = readSrc('backend/maintenance.ts');
  assert.match(maintSrc, /startReminderScheduler/, 'backend/maintenance.ts içinde startReminderScheduler çağrılmalı');

  console.log('  ✅ PASS 5: smsProvider ve reminderScheduler modülleri çalışır durumda doğrulandı.');
}

// 6. Offline Outbox Kuyruğu (offlineQueue) ve ESC/POS Termal Yazıcı (printerService)
{
  await clearOfflineOutbox();
  const item = await enqueueOfflineMutation({
    endpoint: '/api/quick-pos-sale',
    method: 'POST',
    payload: { items: [{ name: 'Su', quantity: 1, unitPrice: 10 }], paymentMethod: 'nakit' },
  });
  assert.ok(item.idempotencyKey && item.idempotencyKey.length >= 32, 'enqueueOfflineMutation UUID X-Idempotency-Key üretmeli');
  assert.equal(await getPendingOfflineCount(), 1, 'Kuyrukta 1 kayıt bulunmalı');
  assert.equal(typeof flushOfflineOutbox, 'function', 'flushOfflineOutbox tanımlı olmalı');
  assert.equal(typeof initOfflineSyncListener, 'function', 'initOfflineSyncListener tanımlı olmalı');
  await clearOfflineOutbox();

  const cp857Bytes = encodeTurkishCp857('Şampuan & Tıraş ₺250');
  assert.ok(cp857Bytes instanceof Uint8Array && cp857Bytes.length > 0, 'encodeTurkishCp857 Uint8Array üretmeli');
  const receiptBytes = buildEscPosReceiptBytes({
    storeName: 'Dükkanım Berber',
    paperWidth: '58mm',
    items: [{ name: 'Saç Kesimi', quantity: 1, unitPrice: 250 }],
    totalAmount: 250,
  });
  assert.ok(receiptBytes instanceof Uint8Array && receiptBytes.length > 20, 'buildEscPosReceiptBytes ESC/POS byte dizisi üretmeli');
  assert.equal(typeof printReceiptThermal, 'function', 'printReceiptThermal fonksiyon olmalı');

  console.log('  ✅ PASS 6: offlineQueue ve printerService (CP857 + ESC/POS) modülleri doğrulandı.');
}

// 7. İzole Iframe Yazdırma (printTemplate) ve Sektör Tamamlamaları
{
  assert.equal(typeof printHtmlDocument, 'function', 'printHtmlDocument fonksiyon olmalı');
  assert.equal(escapeHtml('<script>"test"</script>'), '&lt;script&gt;&quot;test&quot;&lt;/script&gt;', 'escapeHtml XSS karakterlerini temizlemeli');

  for (const relFile of [
    'frontend/components/sector/RestaurantTablesView.tsx',
    'frontend/components/sector/FastRetailCounterView.tsx',
    'frontend/components/shop/DailyClosingModal.tsx',
    'frontend/components/panel/PatronReport.tsx',
  ]) {
    const src = readSrc(relFile);
    assert.match(src, /printHtmlDocument/, `${relFile} içinde printHtmlDocument kullanılmalı`);
  }

  const bookingViewSrc = readSrc('frontend/components/public/PublicBarberBookingView.tsx');
  assert.match(bookingViewSrc, /loyalty/i, 'PublicBarberBookingView.tsx dijital sadakat kartı içermeli');
  assert.match(bookingViewSrc, /iban/i, 'PublicBarberBookingView.tsx IBAN/kapora kutusu içermeli');

  console.log('  ✅ PASS 7: printTemplate izole yazdırma ve P0–P2 sektörel bileşen entegrasyonları doğrulandı.');
}

console.log('\n🎉 TÜM BAKIM VE GELİŞTİRME TESTLERİ (7/7 GRUP) BAŞARIYLA GEÇTİ!');
