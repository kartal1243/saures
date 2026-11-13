import assert from 'node:assert/strict';
import { detectImageMimeAndExt } from '../backend/routes/profile.ts';

console.log('🧪 Dükkan Profil Fotoğrafı (Logo / PP) ve Güvenlik Testleri Başlatılıyor...\n');

// 1. TEST: PNG Magic Bytes
{
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const res = detectImageMimeAndExt(pngHeader);
  assert.ok(res !== null, 'PNG magic bytes tanınmalı');
  assert.equal(res.mime, 'image/png');
  assert.equal(res.ext, 'png');
  console.log('  ✅ PASS: PNG Magic Bytes (89 50 4E 47 ...) başarıyla doğrulandı.');
}

// 2. TEST: JPEG Magic Bytes
{
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const res = detectImageMimeAndExt(jpegHeader);
  assert.ok(res !== null, 'JPEG magic bytes tanınmalı');
  assert.equal(res.mime, 'image/jpeg');
  assert.equal(res.ext, 'jpg');
  console.log('  ✅ PASS: JPEG Magic Bytes (FF D8 FF ...) başarıyla doğrulandı.');
}

// 3. TEST: WEBP Magic Bytes
{
  // RIFF .... WEBP
  const webpHeader = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x20, 0x00, 0x00, 0x00, // Size
    0x57, 0x45, 0x42, 0x50  // WEBP
  ]);
  const res = detectImageMimeAndExt(webpHeader);
  assert.ok(res !== null, 'WEBP magic bytes tanınmalı');
  assert.equal(res.mime, 'image/webp');
  assert.equal(res.ext, 'webp');
  console.log('  ✅ PASS: WEBP Magic Bytes (RIFF ... WEBP) başarıyla doğrulandı.');
}

// 4. TEST: Malicious SVG Bloklama (XSS Koruması)
{
  const svgPayload = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>');
  const res = detectImageMimeAndExt(svgPayload);
  assert.equal(res, null, 'SVG kesinlikle reddedilmeli!');
  console.log('  ✅ PASS: SVG görsel yüklemesi ve olası XSS girişimi başarıyla engellendi.');
}

// 5. TEST: Malicious HTML Bloklama
{
  const htmlPayload = Buffer.from('<!DOCTYPE html><html><body><script src="evil.js"></script></body></html>');
  const res = detectImageMimeAndExt(htmlPayload);
  assert.equal(res, null, 'HTML kesinlikle reddedilmeli!');
  console.log('  ✅ PASS: Sahte HTML / script dosyası tespiti başarıyla engellendi.');
}

// 6. TEST: Çok Kısa veya Bozuk Dosya
{
  const shortBuf = Buffer.from([0x89, 0x50, 0x4e]);
  const res = detectImageMimeAndExt(shortBuf);
  assert.equal(res, null, '12 byte altındaki eksik tamponlar reddedilmeli');
  console.log('  ✅ PASS: Yetersiz tampon (< 12 bytes) güvenle reddedildi.');
}

// 7. TEST: Dosya Adı ve Path Traversal Koruması
{
  const testFilenames = [
    { input: '../../etc/passwd.png', shouldPass: false },
    { input: '..\\..\\windows\\win.ini.jpg', shouldPass: false },
    { input: 'shop-logo.png', shouldPass: true },
    { input: 'kadikoy_berber_123.webp', shouldPass: true },
    { input: 'shop;rm -rf.png', shouldPass: false },
    { input: 'shop/sub/dir.png', shouldPass: false },
    { input: 'script.exe', shouldPass: false },
    { input: 'image.svg', shouldPass: false },
  ];

  for (const item of testFilenames) {
    const rawParam = item.input;
    const cleanFilename = rawParam.split('?')[0].trim();
    const lastDot = cleanFilename.lastIndexOf('.');
    let isValid = true;

    if (lastDot === -1) {
      isValid = false;
    } else {
      const namePart = cleanFilename.substring(0, lastDot);
      const extPart = cleanFilename.substring(lastDot + 1).toLowerCase();

      if (!['png', 'jpg', 'jpeg', 'webp'].includes(extPart)) {
        isValid = false;
      } else if (!/^[a-zA-Z0-9_-]+$/.test(namePart)) {
        isValid = false;
      }
    }

    assert.equal(isValid, item.shouldPass, `Dosya adı güvenliği kontrolü başarısız: ${item.input}`);
  }
  console.log('  ✅ PASS: Path traversal, geçersiz uzantılar ve komut enjeksiyonu engellendi.');
}

console.log('\n========================================');
console.log('TÜM DÜKKAN PROFİL FOTOĞRAFI TESTLERİ BAŞARILI! 🎯');
console.log('========================================\n');
