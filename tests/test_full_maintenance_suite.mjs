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

// 1. SEO: /rehber, /rehber/:slug, demosuz /m/demo engeli ve gerçek Kafe Kimliği Ayrıştırması
{
  const { addAccount, removeAccount, hashPassword } = await import('../backend/accounts.ts');
  const { loadShopState, setShopState } = await import('../backend/shopState.ts');
  const { SHOPS_DIR } = await import('../backend/config.ts');

  assert.ok(Array.isArray(SEO_GUIDE_ARTICLES) && SEO_GUIDE_ARTICLES.length >= 8, 'SEO_GUIDE_ARTICLES en az 8 makale içermeli');
  assert.equal(isValidGuideRoute('/rehber'), true, '/rehber geçerli bir rehber rotası olmalı');
  assert.equal(isValidGuideRoute('/rehber/berber-no-show-onleme'), true, '/rehber/berber-no-show-onleme geçerli olmalı');
  assert.equal(isValidGuideRoute('/rehber/istanbul-berber-kuafor'), true, '/rehber/istanbul-berber-kuafor geçerli olmalı');
  assert.equal(isValidGuideRoute('/rehber/olmayan-makale-404'), false, 'Geçersiz rehber rotası false dönmeli');

  assert.equal(findShopForSeo('demo', 'menu'), null, 'Demo menü kaldırılmış olmalı');
  assert.equal(findShopForSeo('demo', 'barber'), null, 'Demo randevu kaldırılmış olmalı');

  const suffix = Date.now();
  const cafeId = `acc_test_maint_cafe_${suffix}`;
  const barberId = `acc_test_maint_barber_${suffix}`;
  try {
    addAccount({
      id: cafeId,
      shopName: 'Boğaz Bistro & Kafe',
      ownerName: 'Ahmet Usta',
      phone: '05326665544',
      passwordHash: hashPassword('Test123456!'),
      createdAt: new Date().toISOString(),
    });
    const cst = loadShopState(cafeId);
    cst.shopProfile = {
      storeName: 'Boğaz Bistro & Kafe',
      ownerName: 'Ahmet Usta',
      businessField: 'Kafe & Restoran',
      sectorKey: 'kafe_restoran',
      employeeCount: '2',
      phone: '05326665544',
      cityDistrict: 'İstanbul / Beşiktaş',
      dailyTarget: 4000,
      slug: `bogaz-bistro-${suffix}`,
      isConfigured: true,
      isVip: true,
    };
    cst.menuItems = [{ id: 'm1', name: 'Türk Kahvesi', price: 65, category: 'İçecekler', isAvailable: true }];
    setShopState(cafeId, cst);

    addAccount({
      id: barberId,
      shopName: 'Makas Atölyesi Kuaför',
      ownerName: 'Mehmet Usta',
      phone: '05336665544',
      passwordHash: hashPassword('Test123456!'),
      createdAt: new Date().toISOString(),
    });
    const bst = loadShopState(barberId);
    bst.shopProfile = {
      storeName: 'Makas Atölyesi Kuaför',
      ownerName: 'Mehmet Usta',
      businessField: 'Berber / Kuaför',
      sectorKey: 'berber_kuafor',
      employeeCount: '2',
      phone: '05336665544',
      cityDistrict: 'İstanbul / Kadıköy',
      dailyTarget: 3500,
      slug: `makas-atolyesi-${suffix}`,
      isConfigured: true,
      isVip: true,
    };
    setShopState(barberId, bst);

    const menuShop = findShopForSeo(`bogaz-bistro-${suffix}`, 'menu');
    assert.ok(menuShop, 'findShopForSeo gerçek restoran sonucunu dönmeli');
    assert.match(menuShop.name, /Boğaz Bistro/i, '/m/:slug gerçek restoran adını dönmeli');
    assert.equal(menuShop.sectorKey, 'kafe_restoran', 'sectorKey kafe_restoran olmalı');

    const barberShop = findShopForSeo(`makas-atolyesi-${suffix}`, 'barber');
    assert.ok(barberShop, 'findShopForSeo gerçek kuaför sonucunu dönmeli');
    assert.notEqual(barberShop.name, menuShop.name, 'Berber ile restoran kimlikleri ayrışmalı');

    const customBaseTpl = '<!DOCTYPE html><html><head><title>Base</title></head><body><div id="root"></div></body></html>';
    const mHtml = renderSeoHtml(`/m/bogaz-bistro-${suffix}`, 'dukkanimyanimda.com.tr', customBaseTpl);
    assert.match(mHtml, /Boğaz Bistro/i, 'SSR /m/:slug HTML içinde gerçek restoran adı geçmeli');
    assert.match(mHtml, /twitter:card/i, 'renderSeoHtml içinde twitter:card meta etiketi bulunmalı');

    const ticketMeta = getSeoMetadata('/t/rep_test_123');
    assert.match(ticketMeta.robots || '', /noindex/i, '/t/:code rotası noindex içermeli');

    console.log('  ✅ PASS 1: /rehber, demo kaldırma ve gerçek dükkan SEO ayrışması doğrulandı.');
  } finally {
    removeAccount(cafeId);
    removeAccount(barberId);
    try { fs.unlinkSync(path.join(SHOPS_DIR, `${cafeId}.json`)); } catch {}
    try { fs.unlinkSync(path.join(SHOPS_DIR, `${barberId}.json`)); } catch {}
  }
}

// 2. Kamusal Takip (/api/public/ticket/:code) ve PublicTicketTrackerView
{
  const { addAccount, removeAccount, hashPassword } = await import('../backend/accounts.ts');
  const { loadShopState, setShopState } = await import('../backend/shopState.ts');
  const { SHOPS_DIR } = await import('../backend/config.ts');

  assert.equal(lookupPublicTicket('demo'), null, 'lookupPublicTicket("demo") artık null dönmeli');
  const accId = `acc_test_maint_tkt_${Date.now()}`;
  try {
    addAccount({
      id: accId,
      shopName: 'TeknoServis Gerçek İşletme',
      ownerName: 'Can Usta',
      phone: '05346665544',
      passwordHash: hashPassword('Test123456!'),
      createdAt: new Date().toISOString(),
    });
    const st = loadShopState(accId);
    st.repairTickets = [
      {
        id: 'rep_real_ticket_1',
        customerName: 'Ahmet Yılmaz',
        phone: '05321112233',
        deviceOrVehicle: 'iPhone 14 Pro',
        complaint: 'Ekran değişimi',
        estimatedCost: 4000,
        partCost: 1500,
        status: 'teslime_hazir',
        createdAt: '2026-11-17 10:00',
      },
    ];
    setShopState(accId, st);

    const realTicket = lookupPublicTicket('rep_real_ticket_1');
    assert.ok(realTicket && realTicket.code === 'rep_real_ticket_1', 'Gerçek fiş lookupPublicTicket ile dönmeli');
    assert.match(realTicket.shopName, /TeknoServis Gerçek/i);
  } finally {
    removeAccount(accId);
    try { fs.unlinkSync(path.join(SHOPS_DIR, `${accId}.json`)); } catch {}
  }

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
