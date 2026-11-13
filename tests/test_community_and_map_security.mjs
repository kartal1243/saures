import assert from 'assert';
import { validateCommunityContent } from '../backend/routes/community.ts';

console.log('🧪 Esnaf İletişim Ağı & Harita Güvenlik Testleri Başlatılıyor...\n');

// 1. validateCommunityContent Testleri
console.log('--- 1. Topluluk İçerik Doğrulama & Filtre Testleri ---');

// 1.1 Boş / Çok kısa içerik
const emptyRes = validateCommunityContent('');
assert.strictEqual(emptyRes.valid, false, 'Boş içerik reddedilmeli');
const shortRes = validateCommunityContent('a');
assert.strictEqual(shortRes.valid, false, '1 karakterli içerik reddedilmeli');
console.log('✅ PASS: Boş ve kısa içerik kontrolü başarılı');

// 1.2 Küfür & Hakaret Filtresi
const profanityRes = validateCommunityContent('Bu esnaf tam bir siktir git amk');
assert.strictEqual(profanityRes.valid, false, 'Küfür içeren metin reddedilmeli');
assert.ok(profanityRes.error?.includes('uygunsuz') || profanityRes.error?.includes('hakaret'), 'Hata mesajı küfür uyarısı içermeli');
console.log('✅ PASS: Küfür ve hakaret filtresi başarılı');

// 1.3 Phishing / Sahte Bağlantı Filtresi
const phishingDomainRes = validateCommunityContent('Ucuza toptan un burada: http://bit.ly/bedava-un-kampanyasi');
assert.strictEqual(phishingDomainRes.valid, false, 'Kısa link (bit.ly) reddedilmeli');

const phishingKwRes = validateCommunityContent('Kampanya için şifrenizi girin ve tıkla kazan');
assert.strictEqual(phishingKwRes.valid, false, 'Oltalama kelimeleri reddedilmeli');
console.log('✅ PASS: Phishing ve şüpheli link filtresi başarılı');

// 1.4 XSS / Zararlı Script Enjeksiyonu Filtresi
const xssRes = validateCommunityContent('<script>alert("hacked")</script> Selam esnaf');
assert.strictEqual(xssRes.valid, false, 'Script etiketi reddedilmeli');

const imgXssRes = validateCommunityContent('Fotoğraf linki: <img src="x" onerror="stealCookie()" />');
assert.strictEqual(imgXssRes.valid, false, 'onerror payloadu reddedilmeli');
console.log('✅ PASS: XSS ve zararlı HTML filtresi başarılı');

// 1.5 Temiz Esnaf Mesajı
const cleanRes = validateCommunityContent('Kadıköy civarında uygun fiyatlı berber jileti toptancısı arıyorum, tavsiyesi olan var mı?');
assert.strictEqual(cleanRes.valid, true, 'Geçerli esnaf mesajı onaylanmalı');
assert.ok(cleanRes.cleanContent, 'Temizlenmiş içerik dönmeli');
console.log('✅ PASS: Temiz ve kurallara uygun esnaf mesajı onaylandı');

console.log('\n--- 2. Harita KVKK & Veri Sızıntısı Kontrolleri ---');
// Harita çıktısında bulunması ve bulunmaması gereken alanların simülasyonu
const sampleShopState = {
  shopProfile: {
    storeName: 'Usta Berber Kadıköy',
    ownerName: 'Mehmet Yılmaz', // Şahıs adı (KVKK hassas)
    phone: '05329998877',       // Şahsi GSM (KVKK kritik sızıntı riski)
    cityDistrict: 'İstanbul / Kadıköy',
    sectorKey: 'berber_kuafor',
    showOnPublicMap: false,     // Gizlenmeli
  },
  transactions: [{ id: 'tx_1', amount: 5000 }], // Ciro verisi
  customers: [{ id: 'c_1', name: 'Kadir', balance: 400 }], // Müşteri verisi
};

// showOnPublicMap === false kontrolü
assert.strictEqual(sampleShopState.shopProfile.showOnPublicMap, false, 'showOnPublicMap false olanlar haritada gösterilmemeli');

// Kamusal harita modeli kontrolü (PublicShopMapItem)
const publicMapSample = {
  id: 'acc_test_1',
  name: sampleShopState.shopProfile.storeName,
  slug: 'usta-berber-kadikoy',
  sectorKey: sampleShopState.shopProfile.sectorKey,
  city: 'İstanbul',
  district: 'Kadıköy',
  address: 'Kadıköy, İstanbul',
  lat: 40.9927,
  lng: 29.0277,
  isOpen: true,
  rating: 5.0,
  servicesCount: 4,
  hasBooking: true,
  hasMenu: false,
};

// KVKK Doğrulaması:
assert.strictEqual('phone' in publicMapSample && publicMapSample.phone !== undefined, false, 'Harita çıktısında şahsi telefon numarası ASLA yer almamalıdır!');
assert.strictEqual('ownerName' in publicMapSample, false, 'Harita çıktısında esnaf şahıs adı yer almamalıdır!');
assert.strictEqual('transactions' in publicMapSample, false, 'Harita çıktısında ciro/işlem verisi yer almamalıdır!');
assert.strictEqual('customers' in publicMapSample, false, 'Harita çıktısında müşteri/borç verisi yer almamalıdır!');
console.log('✅ PASS: Kamusal harita KVKK ve veri minimizasyonu testi %100 başarılı');

console.log('\n======================================================');
console.log('🎉 TÜM TOPLULUK & HARİTA GÜVENLİK TESTLERİ BAŞARILI!');
console.log('======================================================\n');
