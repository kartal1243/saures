import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {
  addAccount,
  accountFromRequest,
  createSession,
  hashPassword,
  removeAccount,
  setAccountClosed,
  isAccountClosed,
} from '../backend/accounts';
import { setShopState, loadShopState } from '../backend/shopState';
import { SHOPS_DIR } from '../backend/config';
import { registerPublicShopsMapRoutes } from '../backend/routes/publicShopsMap';
import { registerPublicBarberRoutes } from '../backend/routes/appointments';
import { registerPublicMenuRoutes } from '../backend/routes/menu';
import { registerAuthRoutes } from '../backend/routes/auth';

console.log('🧪 Demo Kaldırma & Dükkan Kapatma (isClosed) Entegrasyon Testleri Başlıyor...\n');

const suffix = Date.now();
const barberId = `acc_closure_barber_${suffix}`;
const restoId = `acc_closure_resto_${suffix}`;
const barberSlug = `ozel-kuafor-${suffix}`;
const restoSlug = `ozel-restoran-${suffix}`;

addAccount({
  id: barberId,
  shopName: 'Özel Kuaför Salonu',
  ownerName: 'Ömer Usta',
  phone: '05327001122',
  passwordHash: hashPassword('StrongPass123!'),
  createdAt: new Date().toISOString(),
});
const bSt = loadShopState(barberId);
bSt.shopProfile = {
  storeName: 'Özel Kuaför Salonu',
  ownerName: 'Ömer Usta',
  businessField: 'Berber / Kuaför',
  sectorKey: 'berber_kuafor',
  employeeCount: '2',
  phone: '05327001122',
  cityDistrict: 'İstanbul / Kadıköy',
  dailyTarget: 3000,
  slug: barberSlug,
  isConfigured: true,
  isVip: true,
  showOnPublicMap: true,
};
setShopState(barberId, bSt);

addAccount({
  id: restoId,
  shopName: 'Özel Restoran',
  ownerName: 'Ömer Şef',
  phone: '05337001122',
  passwordHash: hashPassword('StrongPass123!'),
  createdAt: new Date().toISOString(),
});
const rSt = loadShopState(restoId);
rSt.shopProfile = {
  storeName: 'Özel Restoran',
  ownerName: 'Ömer Şef',
  businessField: 'Kafe & Restoran',
  sectorKey: 'kafe_restoran',
  employeeCount: '3',
  phone: '05337001122',
  cityDistrict: 'İstanbul / Beşiktaş',
  dailyTarget: 5000,
  slug: restoSlug,
  isConfigured: true,
  isVip: true,
  showOnPublicMap: true,
};
rSt.menuItems = [
  { id: 'm1', name: 'Adana Kebap', price: 320, category: 'Ana Yemekler', isAvailable: true },
];
setShopState(restoId, rSt);

const app = express();
app.use(express.json());
registerAuthRoutes(app);
registerPublicShopsMapRoutes(app);
registerPublicBarberRoutes(app);
registerPublicMenuRoutes(app);

const server = http.createServer(app);

try {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  // 1. Demo uçları kapalı ve haritada sahte seed_shop_* yok
  const demoBarberRes = await fetch(`${baseUrl}/api/public/barber/demo`);
  assert.strictEqual(demoBarberRes.status, 404, '/api/public/barber/demo 404 dönmeli');

  const demoMenuRes = await fetch(`${baseUrl}/api/public/menu/demo`);
  assert.strictEqual(demoMenuRes.status, 404, '/api/public/menu/demo 404 dönmeli');

  const demoTicketRes = await fetch(`${baseUrl}/api/public/ticket/demo`);
  assert.strictEqual(demoTicketRes.status, 404, '/api/public/ticket/demo 404 dönmeli');

  const demoAssetRes = await fetch(`${baseUrl}/api/public/asset/demo`);
  assert.strictEqual(demoAssetRes.status, 404, '/api/public/asset/demo 404 dönmeli');

  const demoAuthRes = await fetch(`${baseUrl}/api/auth/demo`, { method: 'POST' });
  assert.strictEqual(demoAuthRes.status, 410, 'POST /api/auth/demo 410 dönmeli');

  const mapRes = await fetch(`${baseUrl}/api/public/shops-map`);
  assert.strictEqual(mapRes.status, 200);
  const mapJson: any = await mapRes.json();
  const hasSeedShop = (mapJson.shops || []).some((s: any) => String(s.id).startsWith('seed_shop_'));
  assert.strictEqual(hasSeedShop, false, 'Haritada sahte seed_shop_* dükkanları olmamalı');
  assert.ok((mapJson.shops || []).some((s: any) => s.id === barberId), 'Açık kuaför haritada görünmeli');
  assert.ok((mapJson.shops || []).some((s: any) => s.id === restoId), 'Açık restoran haritada görünmeli');
  console.log('  ✅ PASS 1: Tüm demo uçları 404/410 döndü, haritada sahte vitrin dükkanı yok.');

  // 2. Açık restoran oturum açabiliyor ve menü sunuyor
  const session = createSession(restoId);
  assert.ok(accountFromRequest({ headers: { authorization: `Bearer ${session.token}` } }), 'Açık hesabın oturumu geçerli olmalı');

  const openMenuRes = await fetch(`${baseUrl}/api/public/menu/${restoSlug}`);
  assert.strictEqual(openMenuRes.status, 200);

  // 3. Kapatılan dükkan haritadan, randevudan, menüden ve oturumdan tamamen düşer
  setAccountClosed(restoId, true, 'Yönetici tarafından kapatıldı');
  assert.strictEqual(isAccountClosed({ id: restoId, isClosed: true } as any), true);

  assert.strictEqual(
    accountFromRequest({ headers: { authorization: `Bearer ${session.token}` } }),
    null,
    'Kapalı dükkanın mevcut oturumu reddedilmeli'
  );

  const closedLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '05337001122', password: 'StrongPass123!' }),
  });
  assert.strictEqual(closedLoginRes.status, 403, 'Kapalı dükkan girişi 403 reddedilmeli');

  const closedMenuRes = await fetch(`${baseUrl}/api/public/menu/${restoSlug}`);
  assert.strictEqual(closedMenuRes.status, 404, 'Kapalı dükkanın QR menüsü 404 dönmeli');

  const mapAfterClose: any = await (await fetch(`${baseUrl}/api/public/shops-map`)).json();
  assert.strictEqual(
    (mapAfterClose.shops || []).some((s: any) => s.id === restoId),
    false,
    'Kapalı dükkan haritadan kaldırılmış olmalı'
  );
  assert.ok(
    (mapAfterClose.shops || []).some((s: any) => s.id === barberId),
    'Diğer açık dükkan haritada kalmaya devam etmeli'
  );
  console.log('  ✅ PASS 2: Dükkan kapatma girişi, oturumu, menüyü ve haritayı anında kapattı.');

  // 4. Tekrar açma (reopen)
  setAccountClosed(restoId, false);
  const reopenedMenuRes = await fetch(`${baseUrl}/api/public/menu/${restoSlug}`);
  assert.strictEqual(reopenedMenuRes.status, 200, 'Tekrar açılan dükkanın menüsü 200 dönmeli');
  console.log('  ✅ PASS 3: Yeniden açılan dükkan sorunsuz aktif oldu.');

  console.log('\n🎉 DEMO TEMİZLİĞİ VE DÜKKAN KAPATMA ENTEGRASYON TESTLERİ TAMAMLANDI! 100% PASS');
} finally {
  server.close();
  removeAccount(barberId);
  removeAccount(restoId);
  for (const id of [barberId, restoId]) {
    try { fs.unlinkSync(path.join(SHOPS_DIR, `${id}.json`)); } catch {}
  }
}
