import assert from 'node:assert/strict';
import { validateCommunityContent } from '../backend/routes/community.ts';

console.log('🧪 Esnaf İletişim Ağı & Harita Testleri Başlatılıyor...\n');

// TEST 1: İçerik Doğrulama & Güvenlik Filtresi (XSS, Küfür, Phishing)
{
  console.log('--- TEST 1: Güvenlik ve Moderasyon Filtresi ---');
  
  // Normal temiz mesaj
  const cleanResult = validateCommunityContent('Komşular selam, 100 TL bozuk para değişimi lazım.');
  assert.equal(cleanResult.valid, true, 'Temiz mesaj geçerli olmalı');
  console.log('✓ Temiz esnaf mesajı başarıyla onaylandı.');

  // Küfür / Argo tespiti
  const profanityResult = validateCommunityContent('Bu ne biçim iş amk.');
  assert.equal(profanityResult.valid, false, 'Küfür içeren mesaj engellenmeli');
  console.log('✓ Küfür / uygunsuz sözcük engellendi:', profanityResult.error);

  // XSS Script enjeksiyonu
  const xssResult = validateCommunityContent('Bozuk para var <script>alert(1)</script>');
  assert.equal(xssResult.valid, false, 'XSS script enjeksiyonu engellenmeli');
  console.log('✓ XSS enjeksiyonu engellendi:', xssResult.error);

  // Phishing / Zararlı link tespiti
  const phishingResult = validateCommunityContent('Hemen tıkla kazan bit.ly/hediye-paralar');
  assert.equal(phishingResult.valid, false, 'Phishing ve sahte link engellenmeli');
  console.log('✓ Oltalama (Phishing) ve kısaltılmış link engellendi:', phishingResult.error);
}

console.log('\n========================================');
console.log('TÜM TOPLULUK GÜVENLİK TESTLERİ BAŞARILI! 🎯');
console.log('========================================');
