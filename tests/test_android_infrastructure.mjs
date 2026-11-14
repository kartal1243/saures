import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('=== ANDROID & PWA ALTYAPI TEST PAKETİ BAŞLIYOR ===\n');

const rootDir = process.cwd();

// 1. manifest.json doğrulaması
console.log('TEST 1: frontend/public/manifest.json');
const manifestPath = path.join(rootDir, 'frontend', 'public', 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json mevcut olmalı');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
assert.strictEqual(manifest.id, '/', 'manifest.id "/" olmalı');
assert.strictEqual(manifest.theme_color, '#f95700', 'manifest.theme_color "#f95700" olmalı');
assert(Array.isArray(manifest.categories), 'categories dizisi olmalı');
for (const cat of ['business', 'finance', 'productivity']) {
  assert(manifest.categories.includes(cat), `categories "${cat}" içermeli`);
}
assert(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length === 4, '4 adet shortcut olmalı');
const shortcutNames = manifest.shortcuts.map((s) => s.name);
for (const expectedName of ['Hızlı Kasa', 'Randevular', 'Masalar', 'Veresiye']) {
  assert(shortcutNames.includes(expectedName), `Shortcut "${expectedName}" bulunmalı`);
}
console.log('✓ manifest.json güncellemeleri ve 4 shortcut doğrulandı.\n');

// 2. sw.js doğrulaması
console.log('TEST 2: frontend/public/sw.js');
const swPath = path.join(rootDir, 'frontend', 'public', 'sw.js');
assert(fs.existsSync(swPath), 'sw.js mevcut olmalı');
const swCode = fs.readFileSync(swPath, 'utf-8');
assert(swCode.includes("const CACHE = 'esnaf-v2'"), 'CACHE adı esnaf-v2 olmalı');
assert(swCode.includes("url.pathname.startsWith('/api/')"), '/api/ istekleri cache dışı kalmalı');
assert(swCode.includes("addEventListener('push'"), 'push dinleyicisi olmalı');
assert(swCode.includes('[200, 100, 200, 100, 300]'), 'titreşim paterni tanımlı olmalı');
assert(swCode.includes('/icon-192.png'), 'bildirim ikonu /icon-192.png olmalı');
assert(swCode.includes("addEventListener('notificationclick'"), 'notificationclick dinleyicisi olmalı');
console.log('✓ sw.js esnaf-v2 ve push/notificationclick dinleyicileri doğrulandı.\n');

// 3. capacitor.config.json & twa-manifest.json doğrulaması
console.log('TEST 3: capacitor.config.json & twa-manifest.json');
const capPath = path.join(rootDir, 'capacitor.config.json');
const twaPath = path.join(rootDir, 'twa-manifest.json');
assert(fs.existsSync(capPath), 'capacitor.config.json mevcut olmalı');
assert(fs.existsSync(twaPath), 'twa-manifest.json mevcut olmalı');
const capCfg = JSON.parse(fs.readFileSync(capPath, 'utf-8'));
const twaCfg = JSON.parse(fs.readFileSync(twaPath, 'utf-8'));
assert.strictEqual(capCfg.appId, 'com.dukkanimyanimda.twa', 'Capacitor appId assetlinks ile uyumlu olmalı');
assert.strictEqual(capCfg.webDir, 'dist', 'Capacitor webDir dist olmalı');
assert.strictEqual(twaCfg.packageId, 'com.dukkanimyanimda.twa', 'TWA packageId assetlinks ile uyumlu olmalı');
assert.strictEqual(twaCfg.host, 'dukkanimyanimda.com.tr', 'TWA host dukkanimyanimda.com.tr olmalı');
assert.strictEqual(twaCfg.themeColor, '#f95700', 'TWA themeColor #f95700 olmalı');
console.log('✓ capacitor.config.json ve twa-manifest.json doğrulandı.\n');

// 4. offlineQueue.ts çalışma testi
console.log('TEST 4: frontend/utils/offlineQueue.ts');
const {
  enqueueOfflineMutation,
  flushOfflineOutbox,
  getPendingOfflineCount,
  getOfflineOutbox,
  clearOfflineOutbox,
  initOfflineSyncListener,
} = await import('../frontend/utils/offlineQueue.ts');

await clearOfflineOutbox();
assert.strictEqual(await getPendingOfflineCount(), 0, 'Başlangıçta kuyruk boş olmalı');

const m1 = await enqueueOfflineMutation({
  endpoint: '/api/quick-pos-sale',
  method: 'POST',
  payload: { items: [{ name: 'Ekmek', quantity: 2, unitPrice: 10 }], paymentMethod: 'nakit' },
});
const m2 = await enqueueOfflineMutation({
  endpoint: '/api/transactions',
  method: 'POST',
  payload: { customerId: 'c1', type: 'veresiye', amount: 150 },
});

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
assert(uuidV4Regex.test(m1.idempotencyKey), 'm1 X-Idempotency-Key geçerli UUID v4 olmalı');
assert(uuidV4Regex.test(m2.idempotencyKey), 'm2 X-Idempotency-Key geçerli UUID v4 olmalı');
assert.notStrictEqual(m1.idempotencyKey, m2.idempotencyKey, 'Her mutasyon benzersiz key almalı');
assert.strictEqual(await getPendingOfflineCount(), 2, 'Kuyrukta 2 bekleyen işlem olmalı');

// Aynı idempotencyKey tekrar eklenirse tekilleştirilmeli
const m1Dup = await enqueueOfflineMutation({
  endpoint: '/api/quick-pos-sale',
  method: 'POST',
  idempotencyKey: m1.idempotencyKey,
  payload: {},
});
assert.strictEqual(m1Dup.id, m1.id, 'Aynı idempotencyKey tekrar eklenmemeli');
assert.strictEqual(await getPendingOfflineCount(), 2, 'Tekilleştirme sonrası sayı 2 kalmalı');

// İlk flush: m1 başarılı (200), m2 geçici sunucu hatası (500) -> m2 aynı idempotencyKey ile kuyrukta kalmalı
const seenCalls = [];
const mockFetchPartial = async (url, init) => {
  seenCalls.push({ url, headers: init.headers });
  if (url.includes('/api/quick-pos-sale')) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: 'Server busy' }), { status: 500 });
};

const flush1 = await flushOfflineOutbox({ fetchImpl: mockFetchPartial });
assert.strictEqual(flush1.flushed, 1, '1 işlem senkronize edilmeli');
assert.strictEqual(flush1.remaining, 1, '1 işlem kuyrukta kalmalı');
assert.strictEqual(flush1.failed, 1, '1 işlem başarısız sayılmalı');
assert.strictEqual(seenCalls[0].headers['X-Idempotency-Key'], m1.idempotencyKey, 'm1 header doğru olmalı');
assert.strictEqual(seenCalls[1].headers['X-Idempotency-Key'], m2.idempotencyKey, 'm2 header doğru olmalı');

const remainingList = await getOfflineOutbox();
assert.strictEqual(remainingList.length, 1);
assert.strictEqual(remainingList[0].idempotencyKey, m2.idempotencyKey, 'Deterministik key korunmalı');
assert.strictEqual(remainingList[0].retryCount, 1, 'retryCount 1 olmalı');

// İkinci flush: m2 başarılı -> aynı idempotencyKey tekrar gönderilmeli ve kuyruk sıfırlanmalı
const secondCallKeys = [];
const flush2 = await flushOfflineOutbox({
  fetchImpl: async (_url, init) => {
    secondCallKeys.push(init.headers['X-Idempotency-Key']);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  },
});
assert.strictEqual(flush2.flushed, 1);
assert.strictEqual(flush2.remaining, 0);
assert.strictEqual(secondCallKeys[0], m2.idempotencyKey, 'Retry sırasında aynı X-Idempotency-Key gönderilmeli');

const stopListener = initOfflineSyncListener();
assert.strictEqual(typeof stopListener, 'function', 'initOfflineSyncListener cleanup fonksiyonu dönmeli');
stopListener();
console.log('✓ offlineQueue.ts FIFO senkronizasyon, retry ve deterministik UUID doğrulandı.\n');

// 5. printerService.ts çalışma testi
console.log('TEST 5: frontend/utils/printerService.ts');
const {
  encodeTurkishCp857,
  buildEscPosReceiptBytes,
  printReceiptThermal,
  TURKISH_CP857_MAP,
} = await import('../frontend/utils/printerService.ts');

const cpBytes = encodeTurkishCp857('Şeker ĞÜİÇÖ ₺10');
assert(cpBytes.includes(TURKISH_CP857_MAP['Ş']), 'CP857 Ş içermeli');
assert(cpBytes.includes(TURKISH_CP857_MAP['Ğ']), 'CP857 Ğ içermeli');
assert(cpBytes.includes(TURKISH_CP857_MAP['İ']), 'CP857 İ içermeli');
assert(cpBytes.includes(0x54) && cpBytes.includes(0x4c), '₺ sembolü TL olarak dönüştürülmeli');

const sampleReceipt = {
  receiptNo: 'FIS-1001',
  storeName: 'Güneş Bakkal',
  paymentMethod: 'Nakit',
  items: [
    { name: 'Çay 1 Kg', quantity: 1, unitPrice: 160 },
    { name: 'Somun Ekmek', quantity: 2, unitPrice: 10 },
  ],
  total: 180,
  cashReceived: 200,
  changeAmount: 20,
};

const bytes58 = buildEscPosReceiptBytes(sampleReceipt, '58mm');
const bytes80 = buildEscPosReceiptBytes(sampleReceipt, '80mm');

// ESC @ (0x1B 0x40) ve ESC t 0x12 (0x1B 0x74 0x12) başlangıç kontrolü
assert.strictEqual(bytes58[0], 0x1b);
assert.strictEqual(bytes58[1], 0x40);
assert.strictEqual(bytes58[2], 0x1b);
assert.strictEqual(bytes58[3], 0x74);
assert.strictEqual(bytes58[4], 0x12);

// Kağıt kesme komutu (GS V 66 0 = 0x1D 0x56 0x42 0x00) bitiş kontrolü
const len58 = bytes58.length;
assert.deepStrictEqual(
  Array.from(bytes58.slice(len58 - 4)),
  [0x1d, 0x56, 0x42, 0x00],
  '58mm fiş kesme komutuyla bitmeli'
);
assert(bytes80.length > bytes58.length, '80mm (48 kolon) fiş 58mm (32 kolon) fişten daha fazla dolgu/karakter içermeli');

// Fallback mod testi (Capacitor yokken)
const fallbackRes = await printReceiptThermal(sampleReceipt, { paperWidth: '58mm' });
assert.strictEqual(fallbackRes.printed, false);
assert.strictEqual(fallbackRes.mode, 'browser_fallback');

// Capacitor native köprü testi
let nativePayload = null;
globalThis.Capacitor = {
  Plugins: {
    EscPosPrinter: {
      printBytes: async (opts) => {
        nativePayload = opts;
      },
    },
  },
};
const nativeRes = await printReceiptThermal(sampleReceipt, {
  paperWidth: '80mm',
  deviceAddress: 'AA:BB:CC:11:22:33',
});
delete globalThis.Capacitor;

assert.strictEqual(nativeRes.printed, true);
assert.strictEqual(nativeRes.mode, 'capacitor_native');
assert.strictEqual(nativePayload.paperWidth, '80mm');
assert.strictEqual(nativePayload.address, 'AA:BB:CC:11:22:33');
assert(Array.isArray(nativePayload.bytes) && nativePayload.bytes.length === bytes80.length);
console.log('✓ printerService.ts CP857, 58mm/80mm ESC/POS ve Capacitor köprüsü doğrulandı.\n');

console.log('==============================================');
console.log('TÜM ANDROID & OFFLINE ALTYAPI TESTLERİ BAŞARILI!');
console.log('==============================================');
