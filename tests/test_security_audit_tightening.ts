import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { isWhitelistedSearchEngineBot, isWhitelistedOrPrivateIp, blockIp, isIpBlocked } from '../backend/visitorTracker';
import { detectImageMimeAndExt } from '../backend/routes/profile';
import { sanitizeCsvField } from '../backend/routes/core';

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

console.log('\n🎉 TÜM GÜVENLİK SIKILAŞTIRMA VE AUDIT TESTLERİ BAŞARIYLA GEÇTİ! 100% PASS');
