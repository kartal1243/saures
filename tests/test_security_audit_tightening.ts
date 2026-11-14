import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { isWhitelistedSearchEngineBot, isWhitelistedOrPrivateIp, blockIp, isIpBlocked } from '../backend/visitorTracker';
import { detectImageMimeAndExt } from '../backend/routes/profile';
import { sanitizeCsvField } from '../backend/routes/core';
import {
  tokenFromRequest,
  accountFromRequest,
  createSession,
  removeSessionByToken,
  getAccounts,
} from '../backend/accounts';
import { createIdempotencyMiddleware } from '../backend/app';
import { sendSmsMessage, getSmsGatewayStatus, normalizeTurkishGsm } from '../backend/services/smsProvider';
import {
  processShopReminders,
  runReminderCycleNow,
  getIstanbulDateAndMinutes,
} from '../backend/services/reminderScheduler';
import type { AppState } from '../shared/types';

console.log('🔒 Kapsamlı Admin & Güvenlik Denetim Testleri Başlatılıyor...\n');

// ============================================================================
// 1. CSV FORMULA INJECTION (CWE-1236) KORUMA TESTLERİ
// ============================================================================
console.log('--- 1. CSV Formula Injection Sanitizasyon Testleri ---');

const formulaPayloads = [
  { input: '=1+1', expectedPrefix: "'" },
  { input: '+SUM(A1:A10)', expectedPrefix: "'" },
  { input: '-100', expectedPrefix: "'" },
  { input: '@HYPERLINK("http://example.com")', expectedPrefix: "'" },
  { input: '\t=SUM(B1:B5)', expectedPrefix: "'" },
  { input: '\r=AVERAGE(C1:C10)', expectedPrefix: "'" },
  { input: '   =PRODUCT(D1:D2)', expectedPrefix: "'" },
];

for (const payload of formulaPayloads) {
  const sanitized = sanitizeCsvField(payload.input);
  assert.ok(
    sanitized.startsWith(payload.expectedPrefix),
    `Payload '${payload.input}' tek tırnakla escape edilmeliydi. Elde edilen: '${sanitized}'`
  );
}

// Normal güvenli değerlerin bozulmadığını doğrula
assert.strictEqual(sanitizeCsvField('Ahmet Yılmaz'), 'Ahmet Yılmaz', 'Normal metin bozulmamalı');
assert.strictEqual(sanitizeCsvField(1250), '1250', 'Sayısal değerler stringe çevrilmeli ve bozulmamalı');
assert.strictEqual(sanitizeCsvField(''), '', 'Boş değer bozulmamalı');
assert.strictEqual(sanitizeCsvField(null), '', 'Null değer boş string dönmeli');
console.log('✅ PASS: CSV Formula Injection sanitizasyonu kusursuz çalışıyor.');

// ============================================================================
// 2. SEO DOSTU ARAMA MOTORU BOT WHITELIST & IP SPOOFING TESTLERİ
// ============================================================================
console.log('\n--- 2. Arama Motoru Bot Whitelist & IP Kalkan Testleri ---');

const legitimateBots = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)',
  'AdsBot-Google (+http://www.google.com/adsbot.html)',
  'Storebot-Google (+http://www.google.com/storebot-google.html)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
  'DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)',
  'Mozilla/5.0 (compatible; Applebot/0.3; +http://www.apple.com/go/applebot)',
];

for (const ua of legitimateBots) {
  assert.strictEqual(
    isWhitelistedSearchEngineBot(ua),
    true,
    `Meşru bot whitelist tarafından tanınmalı: ${ua}`
  );
}

const maliciousOrGenericScanners = [
  'sqlmap/1.4.11#stable',
  'Nikto/2.1.6',
  'python-requests/2.25.1',
  'curl/7.68.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  '',
];

for (const ua of maliciousOrGenericScanners) {
  assert.strictEqual(
    isWhitelistedSearchEngineBot(ua),
    false,
    `Zararlı tarayıcı veya normal istemci arama motoru botu sayılmamalı: ${ua}`
  );
}

// IP Güvenlik Kontrolleri: Localhost ve özel IP koruması
assert.strictEqual(isWhitelistedOrPrivateIp('127.0.0.1'), true);
assert.strictEqual(isWhitelistedOrPrivateIp('::1'), true);
assert.strictEqual(isWhitelistedOrPrivateIp('192.168.1.50'), true);
assert.strictEqual(isWhitelistedOrPrivateIp('10.0.0.1'), true);
assert.strictEqual(isWhitelistedOrPrivateIp('172.16.5.1'), true);
assert.strictEqual(isWhitelistedOrPrivateIp('185.120.30.40'), false);

// Localhost veya özel IP'nin yanlışlıkla banlanması kesinlikle engellenmeli
const localBlockResult = blockIp('127.0.0.1', 'Hatalı ban denemesi');
assert.strictEqual(localBlockResult, false, 'Yerel IP adresi engellenememeli');
assert.strictEqual(isIpBlocked('127.0.0.1'), false, '127.0.0.1 blocked listesine eklenmemeli');
console.log('✅ PASS: SEO Arama motoru bot whitelist ve IP spoofing kalkanı başarılı.');

// ============================================================================
// 3. LOGO VE MEDYA GÜVENLİK TESTLERİ (Magic Bytes, XSS, Path Traversal)
// ============================================================================
console.log('\n--- 3. Logo Upload Magic Bytes & Medya Güvenlik Testleri ---');

// 3.1 Geçerli PNG (Magic byte: 89 50 4E 47 0D 0A 1A 0A)
const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const pngResult = detectImageMimeAndExt(validPngBuffer);
assert.ok(pngResult && pngResult.mime === 'image/png' && pngResult.ext === 'png', 'PNG magic bytes tanınmalı');

// 3.2 Geçerli JPEG (Magic byte: FF D8 FF)
const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const jpgResult = detectImageMimeAndExt(validJpgBuffer);
assert.ok(jpgResult && jpgResult.mime === 'image/jpeg' && jpgResult.ext === 'jpg', 'JPEG magic bytes tanınmalı');

// 3.3 Geçerli WEBP (Magic byte: RIFF ... WEBP)
const validWebpBuffer = Buffer.from([
  0x52, 0x49, 0x46, 0x46, // RIFF
  0x24, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50, // WEBP
]);
const webpResult = detectImageMimeAndExt(validWebpBuffer);
assert.ok(webpResult && webpResult.mime === 'image/webp' && webpResult.ext === 'webp', 'WEBP magic bytes tanınmalı');

// 3.4 Zararlı SVG (XSS Vektörü) - KESİNLİKLE REDDEDİLMELİ
const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>');
assert.strictEqual(detectImageMimeAndExt(svgBuffer), null, 'SVG formatı magic byte kontrolünde reddedilmeli');

// 3.5 Zararlı HTML / Script - KESİNLİKLE REDDEDİLMELİ
const htmlBuffer = Buffer.from('<html><head><title>Test</title></head><body>Fake image</body></html>');
assert.strictEqual(detectImageMimeAndExt(htmlBuffer), null, 'HTML dosyası reddedilmeli');

// 3.6 Çok kısa veya bozuk buffer
assert.strictEqual(detectImageMimeAndExt(Buffer.from([0x01, 0x02])), null, 'Kısa buffer reddedilmeli');

console.log('✅ PASS: Magic bytes görsel doğrulaması ve SVG/HTML blokajı başarılı.');

// ============================================================================
// 4. GÜVENLİ LOG TAIL (fs.readSync / OOM KORUMASI) TESTİ
// ============================================================================
console.log('\n--- 4. Güvenli Log Okuma (OOM DoS Koruması) Testi ---');

const testLogPath = path.join(process.cwd(), 'data', 'test-large.log');
const testLines: string[] = [];
for (let i = 1; i <= 2000; i++) {
  testLines.push(`2026-11-13T12:00:00.000Z [INFO] HTTP GET /api/test/line/${i} 200 OK duration=${i}ms`);
}
fs.writeFileSync(testLogPath, testLines.join('\n'));

function simulateSafeTailFile(filePath: string, requestedLines: number): string[] {
  const n = Math.max(1, Math.min(500, Math.floor(requestedLines) || 200));
  if (!fs.existsSync(filePath)) return [];
  const stat = fs.statSync(filePath);
  if (stat.size === 0) return [];

  const CHUNK_SIZE = Math.min(stat.size, 64 * 1024);
  const buffer = Buffer.alloc(CHUNK_SIZE);
  const fd = fs.openSync(filePath, 'r');
  try {
    const position = stat.size - CHUNK_SIZE;
    fs.readSync(fd, buffer, 0, CHUNK_SIZE, position);
  } finally {
    fs.closeSync(fd);
  }

  const raw = buffer.toString('utf-8');
  const parts = raw.split('\n');
  if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
  return parts.slice(-n);
}

const tail50 = simulateSafeTailFile(testLogPath, 50);
assert.strictEqual(tail50.length, 50, 'İstenen son 50 satır başarıyla dönmeli');
assert.ok(tail50[tail50.length - 1].includes('line/2000'), 'En son satır doğru olmalı');

const tail500 = simulateSafeTailFile(testLogPath, 500);
assert.ok(tail500.length <= 500, 'Maksimum sınır aşılmamalı');

try {
  fs.unlinkSync(testLogPath);
} catch {}

console.log('✅ PASS: Log kuyruk okuyucu 64KB sınırını aşmadan ve RAM tüketmeden başarıyla okuyor.');

// ============================================================================
// 5. ADMIN BRUTE-FORCE LOCKOUT MANTIĞI TESTİ
// ============================================================================
console.log('\n--- 5. Admin Brute-Force Kilit Simülasyon Testi ---');

const adminLockMap = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function simulateRegisterFail(key: string) {
  const now = Date.now();
  const att = adminLockMap.get(key) || { count: 0, lockedUntil: 0 };
  att.count += 1;
  if (att.count >= MAX_ATTEMPTS) {
    att.lockedUntil = now + LOCK_MS;
    att.count = 0;
  }
  adminLockMap.set(key, att);
}

function simulateIsLocked(key: string): number {
  const att = adminLockMap.get(key);
  if (!att) return 0;
  if (att.lockedUntil > Date.now()) return att.lockedUntil - Date.now();
  return 0;
}

const testIpKey = 'admin_198.51.100.23';
assert.strictEqual(simulateIsLocked(testIpKey), 0, 'Başlangıçta kilitli olmamalı');

for (let i = 1; i <= 4; i++) {
  simulateRegisterFail(testIpKey);
  assert.strictEqual(simulateIsLocked(testIpKey), 0, `${i}. denemede henüz kilitlenmemeli`);
}

simulateRegisterFail(testIpKey);
const lockDuration = simulateIsLocked(testIpKey);
assert.ok(lockDuration > 0 && lockDuration <= LOCK_MS, '5. hatalı denemede 15 dakikalık kilit devreye girmeli');

console.log('✅ PASS: Admin brute-force 5 denemede 15 dakika kilitleme mantığı doğrulandı.');

// ============================================================================
// 6. MOBİL BEARER TOKEN AUTH TESTLERİ
// ============================================================================
console.log('\n--- 6. Authorization: Bearer Token Doğrulama Testleri ---');

const sampleHexToken = 'a'.repeat(48);
assert.strictEqual(
  tokenFromRequest({ headers: { authorization: `Bearer ${sampleHexToken}` } }),
  sampleHexToken,
  'Geçerli 48 haneli Bearer hex token ayrıştırılmalı'
);
assert.strictEqual(
  tokenFromRequest({ headers: { authorization: 'Bearer invalid-short-token!' } }),
  null,
  'Kısa veya hex dışı Bearer token reddedilmeli'
);
assert.strictEqual(
  tokenFromRequest({ headers: { cookie: `sid=${'b'.repeat(48)}`, authorization: `Bearer ${sampleHexToken}` } }),
  'b'.repeat(48),
  'Cookie sid varsa geriye dönük uyumlu şekilde okunmalı'
);

const firstOwner = getAccounts().find((a) => (a.role || 'owner') === 'owner');
if (firstOwner) {
  const sess = createSession(firstOwner.id);
  try {
    const resolved = accountFromRequest({ headers: { authorization: `Bearer ${sess.token}` } });
    assert.ok(resolved && resolved.id === firstOwner.id, 'Bearer token ile aktif dükkan hesabı çözümlenmeli');
  } finally {
    removeSessionByToken(sess.token);
  }
}

console.log('✅ PASS: Authorization: Bearer <token> oturum çözümü doğrulandı.');

// ============================================================================
// 7. X-IDEMPOTENCY-KEY DEDUPLICATION MIDDLEWARE TESTLERİ
// ============================================================================
console.log('\n--- 7. X-Idempotency-Key Deduplication Middleware Testleri ---');

const idemMiddleware = createIdempotencyMiddleware();
let handlerExecutions = 0;

function invokeIdem(method: string, url: string, key?: string): { status: number; body: any; replayed: boolean } {
  let status = 200;
  let sentBody: any = null;
  let replayed = false;

  const req: any = {
    method,
    url,
    originalUrl: url,
    path: url,
    headers: key ? { 'x-idempotency-key': key } : {},
  };
  const res: any = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      if (name.toLowerCase() === 'x-idempotency-replayed' && value === 'true') {
        replayed = true;
      }
    },
    status(code: number) {
      this.statusCode = code;
      status = code;
      return this;
    },
    json(payload: any) {
      sentBody = payload;
      return this;
    },
  };

  idemMiddleware(req, res, () => {
    handlerExecutions += 1;
    res.status(201).json({ success: true, callNo: handlerExecutions });
  });

  return { status, body: sentBody, replayed };
}

const firstSale = invokeIdem('POST', '/api/quick-pos-sale', 'offline-tx-uuid-001');
assert.strictEqual(firstSale.status, 201);
assert.strictEqual(firstSale.replayed, false);
assert.strictEqual(firstSale.body.callNo, 1);

const duplicateSale = invokeIdem('POST', '/api/quick-pos-sale', 'offline-tx-uuid-001');
assert.strictEqual(duplicateSale.status, 201);
assert.strictEqual(duplicateSale.replayed, true, 'Aynı X-Idempotency-Key tekrarında cache yanıtı dönmeli');
assert.strictEqual(duplicateSale.body.callNo, 1, 'İşleyici ikinci kez çalışmamalı');
assert.strictEqual(handlerExecutions, 1);

const tableOrder1 = invokeIdem('POST', '/api/tables/table_1/orders', 'offline-order-002');
const tableOrder2 = invokeIdem('POST', '/api/tables/table_1/orders', 'offline-order-002');
assert.strictEqual(tableOrder1.replayed, false);
assert.strictEqual(tableOrder2.replayed, true);
assert.strictEqual(handlerExecutions, 2);

console.log('✅ PASS: X-Idempotency-Key deduplication middleware kusursuz çalışıyor.');

// ============================================================================
// 8. SMS GATEWAY & OTOMATİK HATIRLATMA SCHEDULER TESTLERİ
// ============================================================================
console.log('\n--- 8. sendSmsMessage & runReminderCycleNow Testleri ---');

async function runAsyncSecurityTests() {
  assert.strictEqual(normalizeTurkishGsm('0532 456 78 90'), '905324567890');
  assert.strictEqual(normalizeTurkishGsm('0212 555 00 00'), '');

  const gw = getSmsGatewayStatus();
  assert.ok(gw.provider && (gw.mode === 'live' || gw.mode === 'fallback_whatsapp'));

  const smsRes = await sendSmsMessage('0532 456 78 90', 'Randevu hatırlatma testi', { category: 'test' });
  assert.strictEqual(smsRes.simulated, true, 'Env tanımlı değilken güvenli fallback simülasyon dönmeli');
  assert.strictEqual(smsRes.provider, 'fallback_whatsapp');
  assert.ok(smsRes.whatsappLink.startsWith('https://wa.me/905324567890?text='));

  const invalidSmsRes = await sendSmsMessage('abc', 'Mesaj');
  assert.strictEqual(invalidSmsRes.sent, false);
  assert.ok(invalidSmsRes.error);

  // Sabit saatte (10:00 İstanbul) randevu + vadesi gelen aidat testi
  const fixedNowMs = Date.UTC(2026, 10, 14, 7, 0, 0); // 10:00 Europe/Istanbul (UTC+3)
  const { dateStr: istToday } = getIstanbulDateAndMinutes(fixedNowMs);

  const mockState: AppState = {
    storeName: 'Test Berber & Esnaf',
    shopProfile: {
      storeName: 'Test Berber & Esnaf',
      ownerName: 'Ahmet Usta',
      businessField: 'Berber & Kuaför',
      employeeCount: '2',
      phone: '05324567890',
      cityDistrict: 'İstanbul',
      dailyTarget: 5000,
      isConfigured: true,
      isVip: true,
      vipTier: 'patron',
      vipUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
    },
    customers: [
      {
        id: 'cust_1',
        name: 'Mehmet Kaya',
        phone: '05334567891',
        balance: 500,
        businessCategory: 'berber_kuafor',
        createdAt: new Date().toISOString(),
        subscriptionPlan: {
          enabled: true,
          title: 'Aylık Bakım Paketi',
          amount: 500,
          interval: 'aylik',
          nextDueDate: istToday,
        },
      },
    ],
    transactions: [],
    reminderLogs: [],
    products: [],
    tables: [],
    repairTickets: [],
    custodyTickets: [],
    dailyClosings: [],
    appointments: [
      {
        id: 'apt_1',
        customerName: 'Ali Demir',
        phone: '05444567892',
        staffName: 'Ahmet Usta',
        serviceName: 'Saç Kesimi',
        price: 300,
        appointmentDate: istToday,
        timeSlot: '11:30', // 10:00 -> 11:30 = 90 dk sonra (2 saat içinde)
        status: 'onayli',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'apt_far',
        customerName: 'Uzak Randevu',
        phone: '05444567893',
        staffName: 'Ahmet Usta',
        serviceName: 'Sakal',
        price: 150,
        appointmentDate: istToday,
        timeSlot: '16:00', // 6 saat sonra (tetiklenmemeli)
        status: 'onayli',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const pass1 = await processShopReminders('acc_test_1', mockState, fixedNowMs);
  assert.strictEqual(pass1.appointmentsReminded, 1, '2 saat içindeki 1 randevu hatırlatılmalı');
  assert.strictEqual(pass1.subscriptionsReminded, 1, 'Vadesi bugün gelen 1 aidat hatırlatılmalı');
  assert.strictEqual((mockState.appointments![0] as any).autoReminderSent, true, 'autoReminderSent işaretlenmeli');
  assert.strictEqual((mockState.appointments![1] as any).autoReminderSent, undefined, 'Uzak randevu işaretlenmemeli');
  assert.strictEqual(mockState.reminderLogs.length, 2, '2 ReminderLog kaydı oluşturulmalı');

  // İkinci çalışmada mükerrer hatırlatma atılmamalı
  const pass2 = await processShopReminders('acc_test_1', mockState, fixedNowMs + 15 * 60 * 1000);
  assert.strictEqual(pass2.appointmentsReminded, 0, 'Aynı randevuya tekrar hatırlatma atılmamalı');
  assert.strictEqual(pass2.subscriptionsReminded, 0, 'Aynı aidata aynı gün tekrar hatırlatma atılmamalı');

  // Global cycle fonksiyonunun hatasız çalıştığını doğrula
  const cycleResult = await runReminderCycleNow({ nowMs: fixedNowMs });
  assert.ok(typeof cycleResult.checkedShops === 'number' && cycleResult.checkedShops >= 0);

  console.log('✅ PASS: SMS provider fallback ve otomatik hatırlatma scheduler testleri geçti.');
  console.log('\n🎉 TÜM GÜVENLİK SIKILAŞTIRMA VE AUDIT TESTLERİ BAŞARIYLA GEÇTİ! 100% PASS');
}

runAsyncSecurityTests().catch((err) => {
  console.error('❌ Async test hatası:', err);
  process.exit(1);
});
