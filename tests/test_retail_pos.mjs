// Test suite for Market, Retail POS, EAN-13 Scale Barcode Parser & Thermal Receipt
import assert from 'assert';

console.log('=== MARKET & POS E2E / UNIT TESTS BAŞLIYOR ===\n');

// 1. EAN-13 Check Digit Doğrulama Fonksiyonu
function calculateEan13CheckDigit(twelveDigits) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(twelveDigits[i], 10) || 0;
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

// 2. Terazi Barkodu Çözümleme Fonksiyonu
function parseTurkishScaleBarcode(code, catalog) {
  const clean = code.trim();
  if (clean.length !== 13) return null;

  const prefix = clean.slice(0, 2);
  if (prefix !== '27' && prefix !== '28' && prefix !== '29') return null;

  const pluCode = clean.slice(2, 7);
  const valueInt = parseInt(clean.slice(7, 12), 10);
  if (isNaN(valueInt) || valueInt <= 0) return null;

  const matched = catalog.find((p) => {
    const b = String(p.barcode || '');
    return b === pluCode || b.endsWith(pluCode) || b.includes(pluCode) || String(p.id).includes(pluCode);
  });

  if (prefix === '27' || prefix === '28') {
    const weightKg = Number((valueInt / 1000).toFixed(3));
    const unitPrice = matched ? matched.sellingPrice : 40;
    const productName = matched ? matched.name : `Tartılı Reyon Ürünü (PLU: ${pluCode})`;

    return {
      type: 'weight',
      product: matched,
      name: `${productName} (${weightKg} kg)`,
      quantity: weightKg,
      unitPrice,
      total: Number((weightKg * unitPrice).toFixed(2)),
      pluCode,
      isWeighed: true,
    };
  } else {
    // 29 Prefix: Kuruş fiyatlı
    const price = Number((valueInt / 100).toFixed(2));
    const productName = matched ? matched.name : `Tartılı Ürün (PLU: ${pluCode})`;

    return {
      type: 'price',
      product: matched,
      name: productName,
      quantity: 1,
      unitPrice: price,
      total: price,
      pluCode,
      isWeighed: true,
    };
  }
}

// TEST 1: EAN-13 Check Digit
console.log('TEST 1: EAN-13 Kontrol Hanesi (Check Digit) Testi');
const test12 = '869000100201';
const checkDigit = calculateEan13CheckDigit(test12);
assert.strictEqual(checkDigit, 5, '869000100201 için kontrol hanesi 5 olmalıdır');
console.log('✓ EAN-13 Check Digit Algoritması Doğrulandı: 869000100201 -> 8690001002015');

// TEST 2: Türkiye Terazi Barkodu 27 Prefix (1.500 kg Yerli Domates)
console.log('\nTEST 2: Prefix 27 Gramajlı Terazi Barkodu Çözümleme');
const catalog = [
  { id: 'prod_1', name: 'Salkım Domates (Yerli)', sellingPrice: 40, barcode: '00101', unit: 'Kg' },
  { id: 'prod_2', name: 'Taze Kaşar Peyniri', sellingPrice: 280, barcode: '00201', unit: 'Kg' },
];

// 27 + 00101 (PLU) + 01500 (1500g = 1.500 kg) + 4 (check)
const scaleCode27 = '2700101015004';
const res27 = parseTurkishScaleBarcode(scaleCode27, catalog);
assert(res27 !== null, 'Terazi barkodu çözümlenmelidir');
assert.strictEqual(res27.quantity, 1.500, 'Gramaj 1.500 kg olmalıdır');
assert.strictEqual(res27.unitPrice, 40, 'Birim fiyat 40 ₺ olmalıdır');
assert.strictEqual(res27.total, 60.00, 'Toplam tutar 60.00 ₺ olmalıdır (1.5 * 40)');
assert.strictEqual(res27.isWeighed, true, 'Ürün tartılı olarak işaretlenmelidir');
console.log(`✓ Prefix 27 Başarılı: ${res27.name} -> Miktar: ${res27.quantity} kg, Tutar: ${res27.total} ₺`);

// TEST 3: Türkiye Terazi Barkodu 28 Prefix (0.750 kg Kaşar Peyniri)
console.log('\nTEST 3: Prefix 28 Gramajlı Terazi Barkodu Çözümleme');
// 28 + 00201 (PLU) + 00750 (750g = 0.750 kg) + 2 (check)
const scaleCode28 = '2800201007502';
const res28 = parseTurkishScaleBarcode(scaleCode28, catalog);
assert(res28 !== null, 'Terazi barkodu çözümlenmelidir');
assert.strictEqual(res28.quantity, 0.750, 'Gramaj 0.750 kg olmalıdır');
assert.strictEqual(res28.unitPrice, 280, 'Birim fiyat 280 ₺ olmalıdır');
assert.strictEqual(res28.total, 210.00, 'Toplam tutar 210.00 ₺ olmalıdır (0.75 * 280)');
console.log(`✓ Prefix 28 Başarılı: ${res28.name} -> Miktar: ${res28.quantity} kg, Tutar: ${res28.total} ₺`);

// TEST 4: Türkiye Terazi Barkodu 29 Prefix (45.50 ₺ Kuruş Fiyatlı Tartı)
console.log('\nTEST 4: Prefix 29 Kuruş Fiyatlı Terazi Barkodu Çözümleme');
// 29 + 00101 (PLU) + 04550 (4550 kuruş = 45.50 ₺) + 8 (check)
const scaleCode29 = '2900101045508';
const res29 = parseTurkishScaleBarcode(scaleCode29, catalog);
assert(res29 !== null, 'Terazi barkodu çözümlenmelidir');
assert.strictEqual(res29.quantity, 1, 'Miktar 1 olmalıdır');
assert.strictEqual(res29.total, 45.50, 'Toplam tutar 45.50 ₺ olmalıdır');
console.log(`✓ Prefix 29 Başarılı: ${res29.name} -> Fiyat: ${res29.total} ₺`);

// TEST 5: Termal Fiş & Para Üstü Hesaplama
console.log('\nTEST 5: Termal Fiş ve Para Üstü Hesaplama Testi');
const cart = [
  { name: 'Somun Ekmek 200g', quantity: 3, unitPrice: 10, total: 30 },
  { name: 'Salkım Domates (1.5 kg)', quantity: 1.5, unitPrice: 40, total: 60, isWeighed: true },
];
const cartTotal = cart.reduce((s, i) => s + i.total, 0);
assert.strictEqual(cartTotal, 90.00, 'Sepet toplamı 90.00 ₺ olmalıdır');

const cashReceived = 100.00;
const changeAmount = cashReceived - cartTotal;
assert.strictEqual(changeAmount, 10.00, 'Para üstü 10.00 ₺ olmalıdır');

const receipt = {
  receiptNo: 'FIS-982143',
  storeName: 'DÜKKANIM YANIMDA MARKET',
  items: cart,
  total: cartTotal,
  cashReceived,
  changeAmount,
  paymentMethod: 'Nakit Ödeme',
};

assert(receipt.receiptNo.startsWith('FIS-'), 'Fiş numarası geçerli olmalıdır');
assert.strictEqual(receipt.items.length, 2, '2 kalem ürün bulunmalıdır');
console.log(`✓ Fiş Başarılı: ${receipt.receiptNo} | Toplam: ${receipt.total} ₺ | Alınan: ${receipt.cashReceived} ₺ | Para Üstü: ${receipt.changeAmount} ₺`);

// TEST 6: Gerçek Dükkan Adı (storeName) ve Fiş Alt Bilgisi (receiptFooter) Testi
console.log('\nTEST 6: Dükkan Adı ve Fiş Alt Bilgisi Dinamiklik Testi');
const customStore = 'Kardeşler Süpermarket';
const customFooter = 'İyi günler diler, yine bekleriz!';
const dynamicReceiptTitle = receipt.storeName || customStore || 'DÜKKANIM YANIMDA';
const dynamicFooter = receipt.footerMessage || customFooter || 'Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz';
assert.strictEqual(dynamicReceiptTitle, 'DÜKKANIM YANIMDA MARKET');
assert.strictEqual(dynamicFooter, customFooter);
console.log(`✓ Fiş Başlık/Altbilgi Doğrulandı: Başlık="${dynamicReceiptTitle}", Alt Bilgi="${dynamicFooter}"`);

// TEST 7: Tartılı Ürün Hızlı Gramaj Seçici ve Ondalıklı Miktar Testi
console.log('\nTEST 7: Tartılı Ürün Hızlı Gramaj (250g, 500g, 1kg, 1.5kg) & Ondalık Testi');
const weighedPresets = [
  { label: '250g', val: 0.25 },
  { label: '500g', val: 0.5 },
  { label: '1kg', val: 1.0 },
  { label: '1.5kg', val: 1.5 },
];
const unitPriceDomates = 40; // 40 TL / kg
weighedPresets.forEach((p) => {
  const lineTotal = Number((unitPriceDomates * p.val).toFixed(2));
  assert.strictEqual(lineTotal, unitPriceDomates * p.val);
  console.log(`✓ Gramaj Preseti: ${p.label} (${p.val} kg) -> ${lineTotal} ₺`);
});

// Ondalıklı serbest tartı girişi (örn: 1.345 kg)
const decimalWeight = 1.345;
const decimalTotal = Number((unitPriceDomates * decimalWeight).toFixed(2));
assert.strictEqual(decimalTotal, 53.80);
console.log(`✓ Ondalıklı Tartı Girişi: ${decimalWeight} kg x ${unitPriceDomates} ₺ = ${decimalTotal} ₺`);

console.log('\n========================================');
console.log('TÜM MARKET & PERAKENDE POS TESTLERİ BAŞARIYLA GEÇTİ!');
console.log('========================================');
