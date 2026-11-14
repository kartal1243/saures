import assert from 'assert';
import {
  buildVisitorSessions,
  getVisitorSessions,
  getVisitorRecords,
  detectBotFromUserAgent,
} from '../backend/visitorTracker';

console.log('🧪 Ziyaretçi Oturum Birleştirme & Bot/Yabancı Ayrıştırma Testleri Başlatılıyor...\n');

const CHROME_TR_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const IPHONE_TR_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

function makeRecord(overrides) {
  return {
    id: Math.random().toString(36).slice(2),
    ip: '85.105.12.34',
    country: 'TR',
    countryName: 'Türkiye',
    countryFlag: '🇹🇷',
    isForeign: false,
    method: 'GET',
    statusCode: 200,
    durationMs: 12,
    referer: 'https://www.google.com/',
    userAgent: CHROME_TR_UA,
    deviceType: 'desktop',
    browser: 'Chrome',
    os: 'Windows 10/11',
    isBot: false,
    isSuspicious: false,
    category: overrides.path.startsWith('/api/') ? 'api' : overrides.path.startsWith('/r/') ? 'barber' : 'landing',
    ...overrides,
  };
}

// ============================================================================
// 1. 50 HTTP/API İSTEĞİNİN TEK OTURUM ALTINDA BİRLEŞTİRİLMESİ
// ============================================================================
console.log('--- 1. 50 HTTP/API İsteği Tek Oturum Birleştirme Testi ---');

const nowMs = Date.now();
const sessionStartMs = nowMs - 3 * 60 * 1000; // 3 dakika önce girdi
const fiftyRequests = [];

// 1. istek: Giriş sayfası /
fiftyRequests.push(
  makeRecord({
    path: '/',
    timestamp: new Date(sessionStartMs).toISOString(),
  })
);
// 2. istek: ardışık tekrar / (temizlenmeli)
fiftyRequests.push(
  makeRecord({
    path: '/',
    timestamp: new Date(sessionStartMs + 1000).toISOString(),
  })
);
// 3..25. istekler: arka plan API istekleri
for (let i = 2; i < 25; i++) {
  fiftyRequests.push(
    makeRecord({
      path: `/api/public/showcase?step=${i}`,
      timestamp: new Date(sessionStartMs + i * 2000).toISOString(),
    })
  );
}
// 26. istek: /fiyat
fiftyRequests.push(
  makeRecord({
    path: '/fiyat',
    timestamp: new Date(sessionStartMs + 60 * 1000).toISOString(),
  })
);
// 27..48. istekler: API istekleri
for (let i = 26; i < 48; i++) {
  fiftyRequests.push(
    makeRecord({
      path: `/api/public/barber/demo?slot=${i}`,
      timestamp: new Date(sessionStartMs + i * 2000).toISOString(),
    })
  );
}
// 49. istek: /r/demo
fiftyRequests.push(
  makeRecord({
    path: '/r/demo',
    timestamp: new Date(sessionStartMs + 110 * 1000).toISOString(),
  })
);
// 50. istek: /api/public/barber/demo/availability (son istek API olsa bile exitPath '/r/demo' kalmalı)
fiftyRequests.push(
  makeRecord({
    path: '/api/public/barber/demo/availability',
    timestamp: new Date(sessionStartMs + 120 * 1000).toISOString(),
  })
);

assert.strictEqual(fiftyRequests.length, 50, 'Test girdisi tam 50 istek olmalı');

// Karışık sırada gönderilse bile kronolojik birleştirmeli
const shuffled50 = [...fiftyRequests].reverse();
const mergedSessions = buildVisitorSessions(shuffled50, { nowMs });

assert.strictEqual(mergedSessions.length, 1, '50 istek tek bir VisitorSession olarak birleştirilmeli');
const s1 = mergedSessions[0];
assert.strictEqual(s1.totalRequests, 50, 'totalRequests 50 olmalı');
assert.strictEqual(s1.entryTime, fiftyRequests[0].timestamp, 'entryTime ilk istek zamanı olmalı');
assert.strictEqual(s1.lastSeenAt, fiftyRequests[49].timestamp, 'lastSeenAt son istek zamanı olmalı');
assert.strictEqual(s1.entryPath, '/', 'entryPath "/" olmalı');
assert.strictEqual(s1.exitPath, '/r/demo', 'exitPath "/r/demo" olmalı');
assert.deepStrictEqual(
  s1.pagePaths,
  ['/', '/fiyat', '/r/demo'],
  'pagePaths sadece /api/ dışı sayfaları ardışık tekrarsız içermeli'
);
assert.strictEqual(s1.isActive, true, 'Son görülme 5 dk içinde olduğu için isActive true olmalı');
assert.strictEqual(s1.durationSeconds, 120, 'durationSeconds 120 sn olmalı');
assert.strictEqual(s1.isBot, false);
assert.strictEqual(s1.isForeign, false);
assert.strictEqual(s1.referer, 'https://www.google.com/');

console.log('✅ PASS: 50 istek kronolojik tek oturumda birleştirildi (entry="/", exit="/r/demo", totalRequests=50).');

// ============================================================================
// 2. 30 DAKİKA İNAKTİVİTE PENCERESİ & AKTİF/ÇIKTI DURUMU TESTİ
// ============================================================================
console.log('\n--- 2. 30 Dakika İnaktivite Penceresi & Aktif/Çıktı Testi ---');

const oldStart = nowMs - 90 * 60 * 1000; // 90 dk önce
const oldEnd = nowMs - 85 * 60 * 1000; // 85 dk önce (kapandı, inaktif)
const newStart = nowMs - 2 * 60 * 1000; // 2 dk önce (30 dk'dan fazla boşluk var -> yeni oturum, aktif)

const splitRecords = [
  makeRecord({ ip: '78.180.10.20', path: '/', timestamp: new Date(oldStart).toISOString() }),
  makeRecord({ ip: '78.180.10.20', path: '/demo', timestamp: new Date(oldEnd).toISOString() }),
  makeRecord({ ip: '78.180.10.20', path: '/r/berber-ali', timestamp: new Date(newStart).toISOString() }),
];

const splitSessions = buildVisitorSessions(splitRecords, { nowMs });
assert.strictEqual(splitSessions.length, 2, '30 dk üzeri boşluk 2 ayrı oturum oluşturmalı');
assert.strictEqual(splitSessions[0].isActive, true, 'En yeni oturum aktif olmalı');
assert.strictEqual(splitSessions[0].entryPath, '/r/berber-ali');
assert.strictEqual(splitSessions[1].isActive, false, '85 dk önceki oturum çıkış yapmış (isActive=false) olmalı');
assert.strictEqual(splitSessions[1].durationSeconds, 300);

console.log('✅ PASS: 30 dakikalık inaktivite penceresi ve 5 dakikalık aktiflik eşiği doğrulandı.');

// ============================================================================
// 3. TÜRKİYE GERÇEK ZİYARETÇİLERİ İLE BOT / YABANCI TRAFİK AYRIŞTIRMASI
// ============================================================================
console.log('\n--- 3. Gerçek Ziyaretçiler vs Bot/Yabancı Ayrıştırma Testi ---');

const mixedTraffic = [
  // Gerçek Türkiye ziyaretçisi 1 (Desktop)
  makeRecord({
    ip: '88.230.11.22',
    country: 'TR',
    countryName: 'Türkiye',
    countryFlag: '🇹🇷',
    isForeign: false,
    userAgent: CHROME_TR_UA,
    path: '/',
    timestamp: new Date(nowMs - 60_000).toISOString(),
  }),
  // Gerçek Türkiye ziyaretçisi 2 (iPhone)
  makeRecord({
    ip: '176.240.55.66',
    country: 'TR',
    countryName: 'Türkiye',
    countryFlag: '🇹🇷',
    isForeign: false,
    deviceType: 'mobile',
    browser: 'Safari',
    os: 'iOS (iPhone)',
    userAgent: IPHONE_TR_UA,
    path: '/m/lezzet-kafe',
    timestamp: new Date(nowMs - 30_000).toISOString(),
  }),
  // Yabancı US ziyaretçisi
  makeRecord({
    ip: '54.210.10.1',
    country: 'US',
    countryName: 'ABD',
    countryFlag: '🇺🇸',
    isForeign: true,
    userAgent: CHROME_TR_UA,
    path: '/',
    timestamp: new Date(nowMs - 25_000).toISOString(),
  }),
  // Yabancı DE ziyaretçisi
  makeRecord({
    ip: '49.12.44.99',
    country: 'DE',
    countryName: 'Almanya',
    countryFlag: '🇩🇪',
    isForeign: true,
    userAgent: CHROME_TR_UA,
    path: '/fiyat',
    timestamp: new Date(nowMs - 20_000).toISOString(),
  }),
  // Googlebot (TR veya US)
  makeRecord({
    ip: '66.249.66.1',
    country: 'US',
    countryName: 'ABD',
    countryFlag: '🇺🇸',
    isForeign: true,
    isBot: true,
    botName: 'Googlebot',
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    path: '/r/makas-sanati',
    timestamp: new Date(nowMs - 15_000).toISOString(),
  }),
  // python-requests (TR IP'den gelse bile bot olarak ayrıştırılmalı!)
  makeRecord({
    ip: '95.10.20.30',
    country: 'TR',
    countryName: 'Türkiye',
    countryFlag: '🇹🇷',
    isForeign: false,
    isBot: false, // Eski kayıtta false bile olsa UA üzerinden yakalanmalı
    userAgent: 'python-requests/2.31.0',
    path: '/api/public/showcase',
    timestamp: new Date(nowMs - 10_000).toISOString(),
  }),
  // Admin paneli isteği (gerçek ziyaretçi akışını kirletmemeli!)
  makeRecord({
    ip: '88.230.11.22',
    country: 'TR',
    isForeign: false,
    category: 'admin',
    path: '/api/admin/visitors',
    timestamp: new Date(nowMs - 5_000).toISOString(),
  }),
];

const { sessions, realSessions, botOrForeignSessions } = getVisitorSessions(
  { mode: 'real_sessions' },
  mixedTraffic
);

assert.strictEqual(realSessions.length, 2, 'realSessions içinde yalnızca 2 Türkiye insan ziyaretçisi olmalı');
assert.strictEqual(sessions.length, 2, 'mode=real_sessions için sessions sadece realSessions döndürmeli');
assert.ok(
  realSessions.every((s) => s.country === 'TR' && !s.isForeign && !s.isBot && !s.isSuspicious),
  'realSessions içinde asla yabancı veya bot olmamalı'
);
assert.ok(
  realSessions.every((s) => !s.pagePaths.includes('/api/admin/visitors') && s.exitPath !== '/api/admin/visitors'),
  '/api/admin istekleri gerçek ziyaretçi oturumunu kirletmemeli'
);

assert.strictEqual(botOrForeignSessions.length, 4, 'US, DE, Googlebot ve python-requests botOrForeignSessions içinde olmalı');
assert.ok(
  botOrForeignSessions.some((s) => s.country === 'US'),
  'US isteği botOrForeignSessions içinde olmalı'
);
assert.ok(
  botOrForeignSessions.some((s) => s.country === 'DE'),
  'DE isteği botOrForeignSessions içinde olmalı'
);
assert.ok(
  botOrForeignSessions.some((s) => s.isBot && s.botName === 'Googlebot'),
  'Googlebot botOrForeignSessions içinde olmalı'
);
assert.ok(
  botOrForeignSessions.some((s) => s.isBot && s.botName === 'Python'),
  'python-requests botOrForeignSessions içinde yakalanmalı'
);

console.log('✅ PASS: Türkiye gerçek ziyaretçileri ile US/DE/Googlebot/python-requests tamamen ayrıştırıldı.');

// ============================================================================
// 4. GÜÇLENDİRİLMİŞ BOT USER-AGENT TESPİTİ TESTLERİ
// ============================================================================
console.log('\n--- 4. Güçlendirilmiş Bot & Otomasyon UA Tespiti Testleri ---');

const botUserAgents = [
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 Puppeteer/21.0',
  'Playwright/1.44.0',
  'Selenium/4.18.1 (python windows)',
  'axios/1.7.2',
  'node-fetch/3.3.2',
  'undici',
  'Apache-HttpClient/4.5.14',
  'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
  'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)',
  'Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)',
  'Mozilla/5.0 (compatible; DotBot/1.2; +https://opensiteexplorer.org/dotbot)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (Linux; Android 5.0) Bytespider',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ClaudeBot/1.0',
  'curl/8.4.0',
  'python-requests/2.31.0',
  'Wget/1.21.4',
  'PostmanRuntime/7.37.3',
  'Go-http-client/2.0',
  'Mozilla/5.0 zgrab/0.x',
  'CensysInspect/1.1',
  'Shodan',
  'masscan/1.3',
  'Mozilla/5.0 (compatible; Nmap Scripting Engine)',
  '',
  'short',
];

for (const ua of botUserAgents) {
  const res = detectBotFromUserAgent(ua);
  assert.strictEqual(res.isBot, true, `Bot olarak tespit edilmeliydi: '${ua}'`);
}

for (const humanUa of [CHROME_TR_UA, IPHONE_TR_UA]) {
  const res = detectBotFromUserAgent(humanUa);
  assert.strictEqual(res.isBot, false, `Gerçek tarayıcı bot sayılmamalıydı: '${humanUa}'`);
}

console.log('✅ PASS: Tüm bot/otomasyon/tarayıcı/boş UA kalıpları doğru tespit edildi, gerçek tarayıcılar korunuyor.');

// ============================================================================
// 5. getVisitorRecords() API DÖNÜŞ YAPISI KONTROLÜ
// ============================================================================
console.log('\n--- 5. getVisitorRecords() Dönüş Yapısı & Summary Alanları ---');

const apiRes = getVisitorRecords({ mode: 'real_sessions', limit: 50 });
assert.ok(Array.isArray(apiRes.sessions), 'sessions dizisi dönmeli');
assert.ok(Array.isArray(apiRes.realSessions), 'realSessions dizisi dönmeli');
assert.ok(Array.isArray(apiRes.botOrForeignSessions), 'botOrForeignSessions dizisi dönmeli');
assert.ok(Array.isArray(apiRes.records), 'records dizisi dönmeli');
assert.strictEqual(typeof apiRes.summary.realHumanSessionsToday, 'number');
assert.strictEqual(typeof apiRes.summary.activeHumanSessionsNow, 'number');
assert.strictEqual(typeof apiRes.summary.foreignOrBotSessionsToday, 'number');

console.log('✅ PASS: getVisitorRecords() geriye dönük uyumlu ve yeni oturum alanlarıyla eksiksiz dönüyor.');
console.log('\n🎉 TÜM ZİYARETÇİ OTURUM & AYRIŞTIRMA TESTLERİ BAŞARIYLA GEÇTİ! 100% PASS');
