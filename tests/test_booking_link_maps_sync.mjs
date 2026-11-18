import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import express from 'express';

// İzole geçici DATA_DIR kullan ve port 3000 otomatik başlatmayı atla
const tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dukkanim-sync-test-'));
process.env.DATA_DIR = tmpDataDir;
process.env.SKIP_SERVER_AUTOSTART = 'true';

const require = createRequire(import.meta.url);
const {
  allocateUniqueSlug,
  loadShopState,
  persistShopState,
  registerAuthRoutes,
  registerProfileRoutes,
  registerPublicBarberRoutes,
  apiGuard,
  isPublicRouteValid,
  renderSeoHtml,
  getSeoMetadata,
  findShopForSeo,
  getAccounts,
} = require('../dist/server.cjs');

console.log('🧪 Temiz Randevu Linki, Dinamik Slug, Google Maps & Canlı Senkron Testleri Başlatılıyor...\n');

const app = express();
app.use(express.json());
registerAuthRoutes(app);
registerPublicBarberRoutes(app);
app.use('/api', apiGuard);
registerProfileRoutes(app);

const server = http.createServer(app);

try {
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  // 1. Kayıt + allocateUniqueSlug + POST /api/shop-profile ile dükkan adı & slug dinamik güncellemesi
  console.log('TEST 1: Kayıt, allocateUniqueSlug ve dükkan adı değişiminde dinamik slug güncellemesi');
  const reg1Res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopName: 'Yıldız Berber',
      ownerName: 'Ahmet Usta',
      phone: '05321112233',
      email: 'ahmet@example.com',
      password: 'Password123!',
      googleMapsUrl: 'https://maps.app.goo.gl/yildizBerber123',
      returnToken: true,
    }),
  });
  assert.strictEqual(reg1Res.status, 200, 'İlk kayıt 200 dönmeli');
  const reg1Json = await reg1Res.json();
  const acc1Id = reg1Json.account.id;
  const token1 = reg1Json.sessionToken;
  assert.ok(token1, 'Oturum tokeni dönmeli');

  const st1 = loadShopState(acc1Id);
  assert.strictEqual(st1.shopProfile.slug, 'yildiz-berber');
  assert.strictEqual(st1.shopProfile.googleMapsUrl, 'https://maps.app.goo.gl/yildizBerber123');

  // Aynı isimle ikinci dükkan kaydında çakışmayan benzersiz slug atanmalı (-salon)
  const reg2Res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopName: 'Yıldız Berber',
      ownerName: 'Mehmet Usta',
      phone: '05331112233',
      email: 'mehmet@example.com',
      password: 'Password123!',
      returnToken: true,
    }),
  });
  assert.strictEqual(reg2Res.status, 200, 'İkinci kayıt 200 dönmeli');
  const reg2Json = await reg2Res.json();
  const acc2Id = reg2Json.account.id;
  const st2 = loadShopState(acc2Id);
  assert.strictEqual(st2.shopProfile.slug, 'yildiz-berber-salon', 'Çakışan isimde -salon soneki üretilmeli');

  // Ayrılmış kelime ('berber') için allocateUniqueSlug çakışma koruması
  assert.strictEqual(allocateUniqueSlug('berber'), 'berber-salon');
  assert.strictEqual(allocateUniqueSlug('Yıldız Berber'), 'yildiz-berber-2');

  // 1. dükkan adını 'Altın Makas Kuaför' yaptığında slug dinamik olarak güncellenmeli ve eski slug çakışmadan serbest kalmalı
  const updRes = await fetch(`${baseUrl}/api/shop-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      storeName: 'Altın Makas Kuaför',
      ownerName: 'Ahmet Usta',
      businessField: 'Kuaför / Berber / Güzellik Salonu',
      phone: '05321112233',
      cityDistrict: 'İstanbul / Kadıköy',
      googleMapsUrl: 'https://maps.app.goo.gl/altinMakasUpdated',
    }),
  });
  assert.strictEqual(updRes.status, 200, 'Profil güncellemesi 200 dönmeli');
  const updJson = await updRes.json();
  assert.strictEqual(updJson.profile.slug, 'altin-makas-kuafor', 'Dükkan adı değişince slug otomatik güncellenmeli');
  assert.strictEqual(updJson.profile.googleMapsUrl, 'https://maps.app.goo.gl/altinMakasUpdated');

  const updatedAcc1 = getAccounts().find((a) => a.id === acc1Id);
  assert.strictEqual(updatedAcc1.shopName, 'Altın Makas Kuaför', 'accounts listesi shopName senkronize edilmeli');

  // Eski slug ('yildiz-berber') artık serbest olduğu için yeni isim olarak seçilebilmeli
  assert.strictEqual(allocateUniqueSlug('Yıldız Berber'), 'yildiz-berber');
  console.log('  ✅ PASS 1: Kayıt, allocateUniqueSlug ve dükkan adı değişiminde dinamik slug/accounts güncellemesi doğrulandı.');

  // 2. renderSeoHtml('/<slug>/randevu') ve renderSeoHtml('/berber') gizli sarmalayıcı + HairSalon JSON-LD
  console.log('TEST 2: Temiz /<slug>/randevu SEO HTML, gizli ssr-seo-fallback sarmalayıcısı ve HairSalon JSON-LD');
  const cleanBookingRoute = '/altin-makas-kuafor/randevu';
  const seoMeta = getSeoMetadata(cleanBookingRoute, 'dukkanimyanimda.com.tr');
  assert.ok(seoMeta.title.includes('Altın Makas Kuaför'), 'Title güncellenen dükkan adını içermeli');
  assert.strictEqual(
    seoMeta.canonical,
    'https://dukkanimyanimda.com.tr/altin-makas-kuafor/randevu',
    'Canonical temiz /<slug>/randevu olmalı'
  );
  assert.ok(seoMeta.schemaJson && seoMeta.schemaJson['@type'].includes('HairSalon'), 'HairSalon JSON-LD üretilmeli');

  const htmlClean = renderSeoHtml(cleanBookingRoute, 'dukkanimyanimda.com.tr');
  assert.ok(htmlClean.includes('<div id="ssr-seo-fallback"'), '/<slug>/randevu çıktısında gizli ssr-seo-fallback sarmalayıcısı olmalı');
  assert.ok(htmlClean.includes('position:absolute;width:1px;height:1px'), 'SSR sarmalayıcısı visually-hidden stiline sahip olmalı');
  assert.ok(htmlClean.includes('<title>Altın Makas Kuaför'), '<title> dükkan adını taşımalı');
  assert.ok(htmlClean.includes('HairSalon'), 'HTML çıktısı HairSalon JSON-LD içermeli');

  const htmlBerber = renderSeoHtml('/berber', 'dukkanimyanimda.com.tr');
  assert.ok(htmlBerber.includes('<div id="ssr-seo-fallback"'), '/berber çıktısında gizli ssr-seo-fallback sarmalayıcısı olmalı');
  assert.ok(htmlBerber.includes('Berber Randevu'), '/berber SSR içeriği korunmalı');
  console.log('  ✅ PASS 2: renderSeoHtml gizli sarmalayıcısı, <title> ve HairSalon JSON-LD doğrulandı.');

  // 3. isPublicRouteValid('/<slug>/randevu') doğrulaması
  console.log('TEST 3: isPublicRouteValid("/<slug>/randevu") rota doğrulaması');
  assert.strictEqual(isPublicRouteValid('/altin-makas-kuafor/randevu'), true, 'Geçerli dükkan /<slug>/randevu rotası true dönmeli');
  assert.strictEqual(isPublicRouteValid('/yildiz-berber-salon/randevu'), true, '2. dükkan /<slug>/randevu rotası true dönmeli');
  assert.strictEqual(isPublicRouteValid('/olmayan-bir-berber-xyz/randevu'), false, 'Var olmayan dükkan false dönmeli');
  assert.strictEqual(isPublicRouteValid('/api/randevu'), false, 'Ayrılmış önekler false dönmeli');
  assert.ok(findShopForSeo('altin-makas-kuafor', 'barber'), 'findShopForSeo yeni slug ile bulmalı');
  console.log('  ✅ PASS 3: isPublicRouteValid temiz randevu linklerini doğru doğruluyor.');

  // 4. ShopProfile.googleMapsUrl kamusal randevu API'sinde desteklenmesi ve temizlenebilmesi
  console.log('TEST 4: ShopProfile.googleMapsUrl API yanıtı ve temizleme kontrolü');
  const pubRes1 = await fetch(`${baseUrl}/api/public/barber/altin-makas-kuafor`);
  assert.strictEqual(pubRes1.status, 200);
  const pubJson1 = await pubRes1.json();
  assert.strictEqual(
    pubJson1.shop.googleMapsUrl,
    'https://maps.app.goo.gl/altinMakasUpdated',
    'Kamusal API güncel googleMapsUrl döndürmeli'
  );

  // Boş string gönderilince googleMapsUrl temizlenmeli
  const clearRes = await fetch(`${baseUrl}/api/shop-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      storeName: 'Altın Makas Kuaför',
      businessField: 'Kafe / Çay Ocağı / Restoran',
      sectorKey: 'kafe_restoran',
      googleMapsUrl: '',
    }),
  });
  assert.strictEqual(clearRes.status, 200);
  const clearJson = await clearRes.json();
  assert.strictEqual(
    clearJson.profile.businessField,
    'Kuaför / Berber / Güzellik Salonu',
    'Kurulum sonrası dükkan türü (businessField) değiştirilememeli'
  );
  assert.strictEqual(
    clearJson.profile.sectorKey,
    'berber_kuafor',
    'Kurulum sonrası sektör anahtarı (sectorKey) kilitli kalmalı'
  );
  const pubRes2 = await fetch(`${baseUrl}/api/public/barber/altin-makas-kuafor`);
  const pubJson2 = await pubRes2.json();
  assert.strictEqual(pubJson2.shop.googleMapsUrl, '', 'Boş gönderildiğinde googleMapsUrl temizlenmeli');
  console.log('  ✅ PASS 4: ShopProfile.googleMapsUrl temizleme ve kurulum sonrası dükkan türü kilidi doğrulandı.');

  // 4b. Randevu oluşturmada zorunlu e-posta kontrolü
  console.log('TEST 4b: Online randevu oluşturmada zorunlu e-posta doğrulaması');
  const bookingState = loadShopState(acc1Id);
  bookingState.barberSettings = {
    ...(bookingState.barberSettings || {}),
    requireOtp: false,
    closedDays: [],
    openHour: '09:00',
    closeHour: '21:00',
  };
  bookingState.barberStaff = [
    {
      id: 'st_test_1',
      name: 'Ahmet Usta',
      active: true,
      specialty: 'Saç Kesimi',
      commissionPercent: 50,
      workingHours: { start: '09:00', end: '21:00' },
      offDays: [],
    },
  ];
  bookingState.barberServices = [
    {
      id: 'srv_test_1',
      name: 'Saç Kesimi',
      price: 300,
      durationMinutes: 30,
    },
  ];
  persistShopState(acc1Id, bookingState);

  const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const bookNoEmailRes = await fetch(`${baseUrl}/api/public/barber/altin-makas-kuafor/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Deneme Müşteri',
      phone: '05351112233',
      email: '',
      kvkkApproved: true,
      date: tomorrowDate,
      timeSlot: '11:00',
      serviceIds: ['srv_test_1'],
      staffId: 'st_test_1',
    }),
  });
  assert.strictEqual(bookNoEmailRes.status, 400, 'E-posta olmadan randevu isteği 400 ile reddedilmeli');

  const bookValidRes = await fetch(`${baseUrl}/api/public/barber/altin-makas-kuafor/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Deneme Müşteri',
      phone: '05351112233',
      email: 'Musteri@Example.com',
      kvkkApproved: true,
      date: tomorrowDate,
      timeSlot: '11:00',
      serviceIds: ['srv_test_1'],
      staffId: 'st_test_1',
    }),
  });
  assert.strictEqual(bookValidRes.status, 200, 'Geçerli e-posta ile randevu 200 dönmeli');
  const bookValidJson = await bookValidRes.json();
  assert.strictEqual(bookValidJson.appointment.email, 'musteri@example.com');
  console.log('  ✅ PASS 4b: Online randevuda zorunlu e-posta kontrolü ve kaydı doğrulandı.');

  // 5. Frontend dosya kontrolleri
  console.log('TEST 5: Frontend bileşen doğrulamaları (BarberAppointmentsView, AuthPage, PublicBarberBookingView, ShopProfileModal, App)');
  const rootDir = process.cwd();
  const barberViewSrc = fs.readFileSync(
    path.join(rootDir, 'frontend/components/sector/BarberAppointmentsView.tsx'),
    'utf8'
  );
  assert.ok(
    barberViewSrc.includes('/${encodeURIComponent(effectiveSlug)}/randevu'),
    'BarberAppointmentsView.tsx içinde /${encodeURIComponent(effectiveSlug)}/randevu kullanılmalı'
  );
  assert.ok(
    !barberViewSrc.includes('/r/${shopSlug}') && !barberViewSrc.includes('/r/${encodeURIComponent('),
    'BarberAppointmentsView.tsx içinde eski /r/ linki kalmamalı'
  );

  const authPageSrc = fs.readFileSync(
    path.join(rootDir, 'frontend/components/auth/AuthPage.tsx'),
    'utf8'
  );
  assert.ok(
    !authPageSrc.includes('Şifremi Unuttum (Firebase)'),
    'AuthPage.tsx içinde "Şifremi Unuttum (Firebase)" metni bulunmamalı'
  );
  assert.ok(
    !authPageSrc.includes('Telefonu Firebase SMS ile Doğrula (İsteğe Bağlı)'),
    'AuthPage.tsx içinde SMS doğrulamanın isteğe bağlı olduğunu söyleyen eski metin bulunmamalı'
  );
  assert.ok(
    authPageSrc.includes('Telefonu SMS ile Doğrula (Zorunlu)'),
    'AuthPage.tsx içinde zorunlu SMS doğrulama metni olmalı'
  );
  assert.ok(
    authPageSrc.includes('effectiveRegToken'),
    'AuthPage.tsx kayıt gönderiminde SMS doğrulama tokenını zorunlu kontrol etmeli'
  );
  assert.ok(authPageSrc.includes('googleMapsUrl'), 'AuthPage.tsx kayıt formunda googleMapsUrl alanı olmalı');

  const bookingViewSrc = fs.readFileSync(
    path.join(rootDir, 'frontend/components/public/PublicBarberBookingView.tsx'),
    'utf8'
  );
  assert.ok(bookingViewSrc.includes('isSafeCustomMapsUrl'), 'PublicBarberBookingView özel googleMapsUrl kontrolü içermeli');
  assert.ok(bookingViewSrc.includes('10000'), 'PublicBarberBookingView 10 saniyelik arka plan yenileme içermeli');
  assert.ok(
    !bookingViewSrc.includes('E-Posta Adresi (İsteğe Bağlı)'),
    'PublicBarberBookingView içinde E-Posta Adresi artık isteğe bağlı olmamalı'
  );
  assert.ok(
    bookingViewSrc.includes('E-Posta Adresi *'),
    'PublicBarberBookingView içinde E-Posta Adresi * zorunlu etiketi bulunmalı'
  );

  const shopProfileModalSrc = fs.readFileSync(
    path.join(rootDir, 'frontend/components/shop/ShopProfileModal.tsx'),
    'utf8'
  );
  assert.ok(shopProfileModalSrc.includes('isSectorLocked'), 'ShopProfileModal isSectorLocked kilidini içermeli');
  assert.ok(shopProfileModalSrc.includes('disabled={isSectorLocked}'), 'ShopProfileModal sektör seçimini kurulum sonrası kilitlemeli');

  const appTsxSrc = fs.readFileSync(path.join(rootDir, 'frontend/App.tsx'), 'utf8');
  assert.ok(appTsxSrc.includes('playBookingNotificationSound'), 'App.tsx playBookingNotificationSound yardımcısını içermeli');
  assert.ok(appTsxSrc.includes('7000'), 'App.tsx 7 saniyelik yedek randevu polling içermeli');
  console.log('  ✅ PASS 5: Tüm frontend bileşen doğrulamaları başarıyla geçti.');

  console.log('\n==============================================================');
  console.log('TÜM TEMİZ LİNK, GOOGLE MAPS VE CANLI SENKRON TESTLERİ BAŞARILI! 🎯');
  console.log('==============================================================\n');
} finally {
  server.close();
  try {
    fs.rmSync(tmpDataDir, { recursive: true, force: true });
  } catch {}
}

process.exit(0);
