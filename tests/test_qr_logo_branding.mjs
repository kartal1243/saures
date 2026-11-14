import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const readSrc = (relPath) => fs.readFileSync(path.join(rootDir, relPath), 'utf8');

console.log('🧪 QR Menü & QR Randevu Dükkan Logosu (PP) Markalama Testleri Başlatılıyor...\n');

// 1. App.tsx -> SectorModuleSwitch prop geçişi
{
  const appSrc = readSrc('frontend/App.tsx');
  assert.match(
    appSrc,
    /<SectorModuleSwitch[\s\S]*shopLogoUrl=\{shopProfile\?\.logoUrl\}/,
    'App.tsx, SectorModuleSwitch bileşenine shopLogoUrl={shopProfile?.logoUrl} propunu geçirmelidir'
  );
  console.log('  ✅ PASS: App.tsx -> SectorModuleSwitch shopLogoUrl prop geçişi doğrulandı.');
}

// 2. SectorModuleSwitch.tsx -> BarberAppointmentsView & RestaurantTablesView prop geçişi
{
  const switchSrc = readSrc('frontend/components/sector/SectorModuleSwitch.tsx');
  assert.match(switchSrc, /shopLogoUrl\?:\s*string;/, 'SectorModuleSwitchProps içinde shopLogoUrl?: string tanımlı olmalı');
  assert.match(
    switchSrc,
    /<BarberAppointmentsView[\s\S]*shopLogoUrl=\{props\.shopLogoUrl\}/,
    'SectorModuleSwitch, BarberAppointmentsView bileşenine shopLogoUrl geçirmeli'
  );
  assert.match(
    switchSrc,
    /<RestaurantTablesView[\s\S]*storeName=\{props\.storeName\}[\s\S]*shopSlug=\{props\.shopSlug\}[\s\S]*shopLogoUrl=\{props\.shopLogoUrl\}/,
    'SectorModuleSwitch, RestaurantTablesView bileşenine storeName, shopSlug ve shopLogoUrl geçirmeli'
  );
  console.log('  ✅ PASS: SectorModuleSwitch prop aktarımları doğrulandı.');
}

// 3. BarberAppointmentsView.tsx -> Logo, ecc=H, escapeHtml ve iframe print
{
  const barberSrc = readSrc('frontend/components/sector/BarberAppointmentsView.tsx');
  assert.match(barberSrc, /shopLogoUrl\?:\s*string;/, 'BarberAppointmentsViewProps içinde shopLogoUrl tanımlı olmalı');
  assert.match(barberSrc, /fetch\(['"]\/api\/shop-profile['"]\)/, 'BarberAppointmentsView /api/shop-profile fallback çekmeli');
  assert.match(barberSrc, /function escapeHtml\(/, 'BarberAppointmentsView içinde escapeHtml helperı bulunmalı');
  assert.match(barberSrc, /size=500x500&ecc=H&data=/, 'BarberAppointmentsView QR URLlerinde &ecc=H bulunmalı');
  assert.match(barberSrc, /qr-stand-logo-top/, 'handlePrintStand üst logo rozetini içermeli');
  assert.match(barberSrc, /qr-stand-logo-center/, 'handlePrintStand QR merkez logo rozetini içermeli');
  assert.match(barberSrc, /escapeHtml\(storeName/, 'handlePrintStand storeName için escapeHtml kullanmalı');
  assert.match(barberSrc, /escapeHtml\(bookingUrl\)/, 'handlePrintStand bookingUrl için escapeHtml kullanmalı');
  assert.match(barberSrc, /img\.onload\s*=\s*onImageDone/, 'handlePrintStand tüm görsellerin onload/onerror beklemesini yapmalı');
  console.log('  ✅ PASS: BarberAppointmentsView QR stand logosu, ecc=H, HTML-escape ve iframe baskı doğrulandı.');
}

// 4. RestaurantTablesView.tsx & RestaurantMenuManager.tsx -> TableQrMenuModal prop aktarımları
{
  const tablesSrc = readSrc('frontend/components/sector/RestaurantTablesView.tsx');
  assert.match(tablesSrc, /shopSlug\?:\s*string;/, 'RestaurantTablesViewProps içinde shopSlug tanımlı olmalı');
  assert.match(tablesSrc, /shopLogoUrl\?:\s*string;/, 'RestaurantTablesViewProps içinde shopLogoUrl tanımlı olmalı');
  assert.match(
    tablesSrc,
    /<RestaurantMenuManager[\s\S]*shopName=\{effectiveStoreName\}[\s\S]*shopSlug=\{effectiveShopSlug\}[\s\S]*shopLogoUrl=\{effectiveShopLogoUrl\}/,
    'RestaurantTablesView, RestaurantMenuManager bileşenine shopName, shopSlug ve shopLogoUrl geçirmeli'
  );
  assert.match(
    tablesSrc,
    /<TableQrMenuModal[\s\S]*restaurantName=\{effectiveStoreName\}[\s\S]*shopSlug=\{effectiveShopSlug\}[\s\S]*shopLogoUrl=\{effectiveShopLogoUrl\}[\s\S]*menuItems=\{menuItems\}/,
    'RestaurantTablesView, TableQrMenuModal bileşenine restaurantName, shopSlug, shopLogoUrl ve menuItems geçirmeli'
  );

  const menuMgrSrc = readSrc('frontend/components/sector/RestaurantMenuManager.tsx');
  assert.match(menuMgrSrc, /shopSlug\?:\s*string;/, 'RestaurantMenuManagerProps içinde shopSlug tanımlı olmalı');
  assert.match(menuMgrSrc, /shopLogoUrl\?:\s*string;/, 'RestaurantMenuManagerProps içinde shopLogoUrl tanımlı olmalı');
  assert.match(
    menuMgrSrc,
    /<TableQrMenuModal[\s\S]*restaurantName=\{effectiveShopName\}[\s\S]*shopSlug=\{effectiveSlug\}[\s\S]*shopLogoUrl=\{effectiveLogoUrl\}[\s\S]*menuItems=\{menuItems\}/,
    'RestaurantMenuManager, TableQrMenuModal bileşenine shopSlug, shopLogoUrl ve menuItems geçirmeli'
  );
  console.log('  ✅ PASS: RestaurantTablesView ve RestaurantMenuManager prop aktarımları doğrulandı.');
}

// 5. TableQrMenuModal.tsx -> /m/:slug bağlaması, logo, ecc=H, iframe print ve canlı menü
{
  const modalSrc = readSrc('frontend/components/sector/TableQrMenuModal.tsx');
  assert.match(modalSrc, /shopSlug\?:\s*string;/, 'TableQrMenuModalProps içinde shopSlug olmalı');
  assert.match(modalSrc, /shopLogoUrl\?:\s*string;/, 'TableQrMenuModalProps içinde shopLogoUrl olmalı');
  assert.match(modalSrc, /menuItems\?:\s*MenuItem\[\];/, 'TableQrMenuModalProps içinde menuItems olmalı');
  assert.ok(
    !modalSrc.includes('}/menu?masa='),
    'Eski bozuk /menu?masa= linki tamamen kaldırılmış olmalı'
  );
  assert.match(
    modalSrc,
    /\/m\/\$\{encodeURIComponent\(shopSlug \|\| 'demo'\)\}\?masa=\$\{encodeURIComponent\(tableName\)\}/,
    'QR Menü URLsi gerçek dükkan slugına (/m/:slug?masa=...) gitmeli'
  );
  assert.match(modalSrc, /size=500x500&ecc=H/, 'QR kod URLsi &ecc=H içermeli');
  assert.match(modalSrc, /function escapeHtml\(/, 'TableQrMenuModal içinde escapeHtml helperı bulunmalı');
  assert.match(modalSrc, /document\.createElement\('iframe'\)/, 'handlePrint özel iframe A4/Masa Standı şablonu oluşturmalı');
  assert.match(modalSrc, /qr-menu-logo-top/, 'Yazdırma şablonu üst logo rozetini içermeli');
  assert.match(modalSrc, /qr-menu-logo-center/, 'Yazdırma şablonu QR merkez logo rozetini içermeli');
  assert.match(modalSrc, /menuItems && menuItems\.length > 0 \? menuItems : DEFAULT_MENU_ITEMS/, 'Canlı menü önizlemesi gerçek menuItems propunu kullanmalı');
  assert.match(modalSrc, /Dükkanım Yanımda/, 'Marka ibaresi düzgün Türkçe (Dükkanım Yanımda) olmalı');
  console.log('  ✅ PASS: TableQrMenuModal /m/:slug linki, logo, ecc=H, iframe baskı ve canlı menü doğrulandı.');
}

console.log('\n=======================================================');
console.log('TÜM QR LOGO & MARKALAMA DOĞRULAMA TESTLERİ BAŞARILI! 🎯');
console.log('=======================================================\n');
