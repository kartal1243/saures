import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const stateFilePath = path.join(projectRoot, 'data', 'sms-security-state.json');

// Test başlangıcında mevcut state dosyasını yedekle
let originalBackup = null;
if (fs.existsSync(stateFilePath)) {
  originalBackup = fs.readFileSync(stateFilePath, 'utf-8');
}

console.log('🧪 SMS Güvenliği & Harcama Muhafızı Testleri Başlatılıyor...');

async function runTests() {
  try {
    // ES module import (tsx ile derlenmiş veya ts dosyasını dinamik yükleyerek)
    const {
      checkSmsEligibility,
      recordSmsSent,
      loadSmsSecurityState,
      persistSmsSecurityState,
      getSmsSecurityStats,
      getTodayDateStr,
      SMS_LIMITS,
    } = await import('../backend/services/smsSecurity.ts');

    const today = getTodayDateStr();

    // 1. Temiz bir test state'i oluştur
    const testState = {
      globalDate: today,
      globalCountToday: 0,
      isCircuitBreakerTripped: false,
      phones: {},
      ips: {},
    };
    persistSmsSecurityState(testState);

    console.log('  ✓ 1. State sıfırlandı ve başlatıldı.');

    // 2. İlk SMS kontrolü (İzin verilmeli)
    const testPhone = '05321112233';
    const testIp = '127.0.0.1';
    let check = checkSmsEligibility(testPhone, testIp);
    assert.strictEqual(check.allowed, true, 'İlk SMS isteğine izin verilmeliydi');
    console.log('  ✓ 2. İlk SMS isteği onaylandı.');

    // SMS gönderildi olarak kaydet
    recordSmsSent(testPhone, testIp);

    // 3. 1 Dakikalık Cooldown kontrolü (Hemen ardından 2. SMS reddedilmeli)
    check = checkSmsEligibility(testPhone, testIp);
    assert.strictEqual(check.allowed, false, '1 dakika dolmadan 2. SMS reddedilmeliydi');
    assert.strictEqual(check.reason, 'PHONE_COOLDOWN', 'Sebep PHONE_COOLDOWN olmalıydı');
    assert(check.waitSeconds > 0, 'Kalan saniye bilgisi verilmeliydi');
    console.log(`  ✓ 3. Telefon Cooldown koruması çalışıyor (Kalan: ${check.waitSeconds}s).`);

    // 4. Günlük Telefon Limiti Kontrolü (Günde max 3 SMS)
    // Cooldown'u simüle etmek için state'teki lastSentAt'i geçmişe çekelim
    const state4 = loadSmsSecurityState();
    state4.phones['05321112233'].lastSentAt = Date.now() - 70000; // 70 sn önce gönderilmiş
    persistSmsSecurityState(state4);

    // 2. SMS'i gönder
    recordSmsSent(testPhone, testIp);
    const state4_2 = loadSmsSecurityState();
    state4_2.phones['05321112233'].lastSentAt = Date.now() - 70000;
    persistSmsSecurityState(state4_2);

    // 3. SMS'i gönder
    recordSmsSent(testPhone, testIp);
    const state4_3 = loadSmsSecurityState();
    state4_3.phones['05321112233'].lastSentAt = Date.now() - 70000;
    persistSmsSecurityState(state4_3);

    // Şimdi 4. SMS deneniyor -> Reddedilmeli!
    check = checkSmsEligibility(testPhone, testIp);
    assert.strictEqual(check.allowed, false, 'Günde 3 SMS dolduktan sonra 4. SMS engellenmeli');
    assert.strictEqual(check.reason, 'PHONE_DAILY_LIMIT', 'Sebep PHONE_DAILY_LIMIT olmalı');
    assert.strictEqual(check.fallbackToWhatsapp, true, 'WhatsApp yönlendirmesi sunulmalı');
    console.log('  ✓ 4. Telefon Günlük Limiti koruması çalışıyor (Max 3 SMS).');

    // 5. IP Limiti Kontrolü (Saatte max 5, günde max 10)
    const freshPhone = '05339998877';
    const spamIp = '192.168.1.99';
    // 5 kez gönderim kaydet
    for (let i = 0; i < 5; i++) {
      recordSmsSent(`0533000000${i}`, spamIp);
    }
    check = checkSmsEligibility(freshPhone, spamIp);
    assert.strictEqual(check.allowed, false, 'Saatte 5 SMS aşılınca IP engellenmeli');
    assert.strictEqual(check.reason, 'IP_HOURLY_LIMIT', 'Sebep IP_HOURLY_LIMIT olmalı');
    console.log('  ✓ 5. IP Saatlik Limit koruması çalışıyor (Max 5/saat).');

    // 6. Küresel Devre Kesici (Global Circuit Breaker - Günlük 20 SMS)
    const state6 = loadSmsSecurityState();
    state6.globalCountToday = 20; // 20 SMS kotası doldu
    persistSmsSecurityState(state6);

    const innocentPhone = '05355554433';
    const innocentIp = '10.0.0.1';
    check = checkSmsEligibility(innocentPhone, innocentIp);
    assert.strictEqual(check.allowed, false, 'Devre kesici devredeyken SMS gönderilemez');
    assert.strictEqual(check.reason, 'CIRCUIT_BREAKER_ACTIVE', 'Sebep CIRCUIT_BREAKER_ACTIVE olmalı');
    assert.strictEqual(check.fallbackToWhatsapp, true, 'WhatsApp alternatifi zorunlu olmalı');
    assert(check.whatsappLink.includes('wa.me'), 'WhatsApp linki oluşturulmalı');
    console.log('  ✓ 6. Küresel Devre Kesici (Harcama Sigortası) devrede ve WhatsApp fallback üretiyor.');

    console.log('\n🎉 TÜM SMS GÜVENLİK TESTLERİ BAŞARIYLA GEÇTİ!');
  } finally {
    // Orijinal durumu geri yükle
    if (originalBackup) {
      fs.writeFileSync(stateFilePath, originalBackup, 'utf-8');
    } else if (fs.existsSync(stateFilePath)) {
      fs.unlinkSync(stateFilePath);
    }
  }
}

runTests().catch((err) => {
  console.error('❌ Test başarısız:', err);
  process.exit(1);
});
