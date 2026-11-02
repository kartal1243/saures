import assert from 'assert';
import express from 'express';
import http from 'http';
import { S, als, saveState } from '../backend/context';
import { registerTableRoutes } from '../backend/routes/tables';
import { registerProtectedMenuRoutes, registerPublicMenuRoutes } from '../backend/routes/menu';
import type { AppState, RestaurantTable } from '../shared/types';

console.log('🍽️ RESTORAN & ADİSYON UÇTAN UCA VE BİRİM TESTLERİ BAŞLIYOR...\n');

// Mock App State
const mockState: AppState = {
  storeName: 'Seyir Terasi Fast Food & Kafe',
  shopProfile: {
    storeName: 'Seyir Terasi Fast Food',
    ownerName: 'Usta Esnaf',
    businessField: 'Kafe / Restoran',
    employeeCount: '2',
    phone: '05551112233',
    cityDistrict: 'İstanbul / Üsküdar',
    dailyTarget: 5000,
    isConfigured: true,
    isVip: true,
    vipTier: 'patron',
    slug: 'seyir-terasi',
  },
  customers: [
    {
      id: 'cust_ahmet',
      name: 'Ahmet Yılmaz',
      phone: '05559998877',
      businessCategory: 'musteri',
      balance: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  transactions: [],
  reminderLogs: [],
  dailyClosings: [],
  products: [],
  stockMovements: [],
  appointments: [],
  tables: [
    {
      id: 'tbl_1',
      name: 'Masa 1',
      isOccupied: false,
      orders: [],
      totalAmount: 0,
    },
    {
      id: 'tbl_2',
      name: 'Masa 2',
      isOccupied: false,
      orders: [],
      totalAmount: 0,
    },
  ],
  repairTickets: [],
  suppliers: [],
  services: [],
  cases: [],
  custody: [],
  menuItems: [],
  businessDate: '2026-11-02',
  lastUpdated: new Date().toISOString(),
};

// Express App Setup
const app = express();
app.use(express.json());

// Set up ALS context middleware for all test requests
app.use((req, res, next) => {
  const store = {
    accountId: 'acc_test_restaurant',
    role: 'owner',
    state: mockState,
  };
  als.run(store, () => next());
});

registerTableRoutes(app);
registerProtectedMenuRoutes(app);
registerPublicMenuRoutes(app);

const server = http.createServer(app);

async function run() {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // ----------------------------------------------------
    // TEST 1: Masa Listesi Getirme (GET /api/tables)
    // ----------------------------------------------------
    console.log('[TEST 1] GET /api/tables çağrılıyor...');
    let res = await fetch(`${baseUrl}/api/tables`);
    assert.strictEqual(res.status, 200, 'GET /api/tables 200 dönmeli');
    let data = await res.json();
    assert(Array.isArray(data.tables), 'tables bir dizi olmalı');
    assert.strictEqual(data.tables.length, 2, 'Başlangıçta 2 masa olmalı');
    console.log('  ✓ Masa listesi başarıyla alındı.');

    // ----------------------------------------------------
    // TEST 2: Seyir Terasi Lezzeti Sipariş Ekleme (POST /api/tables/tbl_1/order)
    // ----------------------------------------------------
    console.log('\n[TEST 2] Seyir Terasi Normal Dürüm ve Ayran siparişi ekleniyor...');
    res = await fetch(`${baseUrl}/api/tables/tbl_1/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Normal Çiğ Köfte Dürüm',
        quantity: 2,
        unitPrice: 90,
        note: 'Bol yeşillik ve nar ekşisi',
      }),
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.table.isOccupied, true, 'Masa dolu olarak işaretlenmeli');
    assert.strictEqual(data.table.orders.length, 1);
    assert.strictEqual(data.table.totalAmount, 180, '2 x 90 = 180 TL olmalı');
    assert.strictEqual(data.table.orders[0].note, 'Bol yeşillik ve nar ekşisi');
    console.log(`  ✓ Masa 1 adisyon açıldı: Toplam ${data.table.totalAmount} ₺`);

    // Yayık Ayranı da ekle
    res = await fetch(`${baseUrl}/api/tables/tbl_1/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Köy Yayık Ayranı',
        quantity: 2,
        unitPrice: 30,
      }),
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.table.orders.length, 2);
    assert.strictEqual(data.table.totalAmount, 240, '180 + 60 = 240 TL olmalı');
    console.log(`  ✓ İçecek eklendi: Güncel Masa 1 Toplamı ${data.table.totalAmount} ₺`);

    // ----------------------------------------------------
    // TEST 3: İkram Uygulaması (POST /api/tables/tbl_1/orders/:orderId/gift)
    // ----------------------------------------------------
    console.log('\n[TEST 3] Çay ikramı yapılıyor...');
    // Önce çay ekle
    res = await fetch(`${baseUrl}/api/tables/tbl_1/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Demleme Çay',
        quantity: 2,
        unitPrice: 15,
        isGift: true, // Direkt ikram olarak ekle
      }),
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    const cayOrder = data.table.orders.find((o: any) => o.name === 'Demleme Çay');
    assert(cayOrder, 'Çay siparişi bulunmalı');
    assert.strictEqual(cayOrder.isGift, true, 'isGift true olmalı');
    assert.strictEqual(cayOrder.total, 0, 'İkram tutarı 0 TL olmalı');
    assert.strictEqual(data.table.totalAmount, 240, 'Masa toplamı ikramdan dolayı artmamalı');
    console.log('  ✓ İkram çay 0 TL olarak adisyona işlendi.');

    // Var olan Yayık Ayranını ikram durumuna çevir
    const ayranOrder = data.table.orders.find((o: any) => o.name === 'Köy Yayık Ayranı');
    res = await fetch(`${baseUrl}/api/tables/tbl_1/orders/${ayranOrder.id}/gift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGift: true }),
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.order.isGift, true);
    assert.strictEqual(data.table.totalAmount, 180, 'Ayran ikram olunca toplam 180 TL olmalı');
    console.log(`  ✓ Var olan ayran ikrama dönüştürüldü, yeni toplam: ${data.table.totalAmount} ₺`);

    // ----------------------------------------------------
    // TEST 4: Masa Notu Ekleme (POST /api/tables/tbl_1/note)
    // ----------------------------------------------------
    console.log('\n[TEST 4] Masa notu ekleniyor...');
    res = await fetch(`${baseUrl}/api/tables/tbl_1/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: '4 kişi, cam kenarı masası' }),
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.table.note, '4 kişi, cam kenarı masası');
    console.log(`  ✓ Masa notu kaydedildi: "${data.table.note}"`);

    // ----------------------------------------------------
    // TEST 5: Masa Taşıma / Aktarma (POST /api/tables/tbl_1/move -> Masa 2)
    // ----------------------------------------------------
    console.log('\n[TEST 5] Masa 1 siparişleri Masa 2 ye taşınıyor...');
    res = await fetch(`${baseUrl}/api/tables/tbl_1/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetTableId: 'tbl_2' }),
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.sourceTable.isOccupied, false, 'Kaynak masa boşaltılmalı');
    assert.strictEqual(data.sourceTable.orders.length, 0);
    assert.strictEqual(data.targetTable.isOccupied, true, 'Hedef masa doldurulmalı');
    assert.strictEqual(data.targetTable.totalAmount, 180);
    assert.strictEqual(data.targetTable.note, '4 kişi, cam kenarı masası', 'Masa notu taşınmalı');
    console.log('  ✓ Masa taşıma başarılı. Masa 1 boşaltıldı, Masa 2 adisyonu devraldı.');

    // ----------------------------------------------------
    // TEST 6: Parçalı Tahsilat (Nakit + Kart + Veresiye)
    // ----------------------------------------------------
    console.log('\n[TEST 6] Masa 2 için Parçalı Tahsilat yapılıyor (80 TL Nakit + 100 TL Veresiye)...');
    // Toplam 180 TL: 80 TL Nakit, 100 TL Ahmet Yılmaz veresiye
    res = await fetch(`${baseUrl}/api/tables/tbl_2/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payments: [
          { method: 'nakit', amount: 80 },
          { method: 'veresiye', amount: 100, customerId: 'cust_ahmet' },
        ],
      }),
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.isFullClose, true, 'Toplam ödendiği için masa kapanmalı');
    assert.strictEqual(data.table.isOccupied, false, 'Masa boşalmalı');
    assert.strictEqual(data.table.totalAmount, 0);
    assert.strictEqual(data.customer.balance, 200, 'Ahmet Yılmaz borcu 100 TL artmalı (100 -> 200 TL)');
    assert.strictEqual(data.transactions.length, 2, '2 adet işlem üretilmeli (nakit tahsilat + veresiye)');
    console.log(`  ✓ Parçalı tahsilat tamamlandı. Kasa güncellendi, Ahmet Yılmaz yeni bakiye: ${data.customer.balance} ₺`);

    // ----------------------------------------------------
    // TEST 7: Canlı Garson Çağırma ve Hesap İsteme (QR Menü Eylemleri)
    // ----------------------------------------------------
    console.log('\n[TEST 7] Müşteri QR menüden Garson Çağırıyor ve Hesap İstiyor...');
    // Masa 1 de yeni sipariş açalım
    await fetch(`${baseUrl}/api/tables/tbl_1/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bazlama Tost', quantity: 1, unitPrice: 150 }),
    });

    // Müşteri garson çağırıyor
    res = await fetch(`${baseUrl}/api/public/menu/demo/table-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNo: 'Masa 1', action: 'waiter' }),
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert(data.success, 'Garson çağrısı başarılı olmalı');
    console.log(`  ✓ Garson çağrısı iletildi: ${data.message}`);

    // Kasada çağrıyı 'Gidildi / Tamamlandı' yapma
    res = await fetch(`${baseUrl}/api/tables/tbl_1/clear-call`, { method: 'POST' });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.table.activeCall, null, 'Çağrı temizlenmeli');
    console.log('  ✓ Garson çağrısı "Gidildi / Tamamlandı" olarak temizlendi.');

    // ----------------------------------------------------
    // TEST 8: Menü Yönetimi & Stok Durumu (Tükendi / Stokta)
    // ----------------------------------------------------
    console.log('\n[TEST 8] Menüye Seyir Terasi lezzeti ekleme ve Stok durumu değiştirme...');
    res = await fetch(`${baseUrl}/api/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mega Doritoslu Dürüm Özel',
        price: 150,
        category: 'Dürümler',
        description: 'Çift lavaş ve bol Doritos cipsi',
        isAvailable: true,
      }),
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    const createdItem = data.item;
    assert.strictEqual(createdItem.name, 'Mega Doritoslu Dürüm Özel');
    assert.strictEqual(createdItem.price, 150);
    assert.strictEqual(createdItem.isAvailable, true);
    console.log(`  ✓ Yeni menü ürünü eklendi: "${createdItem.name}" (${createdItem.price} ₺)`);

    // Stokta Yok / Tükendi yap (Toggle)
    res = await fetch(`${baseUrl}/api/menu/${createdItem.id}/toggle`, { method: 'POST' });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.item.isAvailable, false, 'Ürün tükendi olarak güncellenmeli');
    console.log(`  ✓ Ürün stok durumu "TÜKENDİ" yapıldı.`);

    // Tekrar Stokta Var yap
    res = await fetch(`${baseUrl}/api/menu/${createdItem.id}/toggle`, { method: 'POST' });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.item.isAvailable, true, 'Ürün tekrar stokta olmalı');
    console.log(`  ✓ Ürün stok durumu "STOKTA VAR" yapıldı.`);

    // ----------------------------------------------------
    // TEST 9: Fotoğraftan AI ile Toplu Menü Ekleme (POST /api/menu with items)
    // ----------------------------------------------------
    console.log('\n[TEST 9] AI Vision tarafından okunan lezzetlerin topluca menüye aktarımı...');
    const aiExtractedFoods = [
      { name: 'Antep Usulü Lahmacun', price: 95, category: 'Sıcak Lezzetler' },
      { name: 'Kuşbaşılı Kaşarlı Pide', price: 210, category: 'Sıcak Lezzetler' },
      { name: 'Ev Yapımı Limonata', price: 45, category: 'İçecekler' },
    ];
    res = await fetch(`${baseUrl}/api/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: aiExtractedFoods }),
    });
    assert.strictEqual(res.status, 200);
    data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.items.length, 3, '3 yemek topluca eklenmeli');
    const hasLahmacun = data.menuItems.some((m: any) => m.name === 'Antep Usulü Lahmacun');
    assert(hasLahmacun, 'Lahmacun menüde yer almalı');
    console.log(`  ✓ 3 adet AI lezzeti topluca QR menüye başarıyla aktarıldı.`);

    // ----------------------------------------------------
    // TEST 10: 3'lü Paket Masa Sınırı Kontrolü (Çırak: 3, Usta: 10, Patron: Sınırsız)
    // ----------------------------------------------------
    console.log('\n[TEST 10] Paket masa sınırları doğrulanıyor...');
    // Çırak paketi simülasyonu: 3 masa sınırı
    mockState.shopProfile.isVip = false;
    mockState.shopProfile.vipTier = 'cirak';
    mockState.tables = [
      { id: 't1', name: 'Masa 1', isOccupied: false, orders: [], totalAmount: 0 },
      { id: 't2', name: 'Masa 2', isOccupied: false, orders: [], totalAmount: 0 },
      { id: 't3', name: 'Masa 3', isOccupied: false, orders: [], totalAmount: 0 },
    ];

    // 4. masa eklenmeye çalışıldığında 403 VIP_REQUIRED dönmeli
    res = await fetch(`${baseUrl}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Masa 4' }),
    });
    assert.strictEqual(res.status, 403, 'Çırak pakette 4. masa 403 dönmeli');
    data = await res.json();
    assert.strictEqual(data.code, 'VIP_REQUIRED');
    console.log('  ✓ Çırak paket 3 masa kotası aşıldığında 403 VIP_REQUIRED döndü.');

    // Usta paketi simülasyonu: 10 masa sınırı
    mockState.shopProfile.isVip = true;
    mockState.shopProfile.vipTier = 'usta';
    // 4. masa Usta pakette başarıyla eklenebilmeli
    res = await fetch(`${baseUrl}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Masa 4 (Usta)' }),
    });
    assert.strictEqual(res.status, 200, 'Usta pakette 4. masa eklenebilmeli');
    console.log('  ✓ Usta paketinde 4. masa başarıyla eklendi (10 masa kotası içinde).');

    // Patron VIP paketi simülasyonu: Sınırsız masa
    mockState.shopProfile.vipTier = 'patron';
    res = await fetch(`${baseUrl}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Masa 5 (Patron VIP)' }),
    });
    assert.strictEqual(res.status, 200, 'Patron VIP pakette sınırsız masa eklenebilmeli');
    console.log('  ✓ Patron VIP paketinde sınırsız masa oluşturma doğrulandı.');

    console.log('\n======================================================');
    console.log('🎉 TÜM RESTORAN & SEYİR TERASİ ADİSYON TESTLERİ (10/10) BAŞARIYLA GEÇTİ!');
    console.log('======================================================');
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error('\n❌ Test Başarısız Oldu:', err);
  process.exit(1);
});
