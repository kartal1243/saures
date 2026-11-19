import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import express from 'express';

// Testlerin gerçek ./data klasörüne dokunmaması için static importlardan ÖNCE izole tmpdir ve test env ayarla
const tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dukkanim-cal-comm-onb-'));
process.env.DATA_DIR = tmpDataDir;
process.env.NODE_ENV = 'test';
process.env.SKIP_SERVER_AUTOSTART = 'true';

const { als } = await import('../backend/context');
const { addAccount, hashPassword, createSession } = await import('../backend/accounts');
const { loadShopState, setShopState, emptyState } = await import('../backend/shopState');
const { localDay } = await import('../backend/day');
const { registerAuthRoutes } = await import('../backend/routes/auth');
const { registerProfileRoutes } = await import('../backend/routes/profile');
const { registerAppointmentRoutes } = await import('../backend/routes/appointments');
const { registerCoreRoutes } = await import('../backend/routes/core');

console.log('🧪 Takvim Hızlı Aksiyonları, Personel Prim/Hakediş & Onboarding Testleri Başlıyor...\n');

const ownerId = `acc_test_barber_${Date.now()}`;
const ownerPhone = '05328887766';
const shopState = emptyState({
  storeName: 'Karizma Erkek Kuaförü',
  ownerName: 'Ömer Berber',
  phone: ownerPhone,
});
// Başlangıçta onboardingCompleted: false olmalı (yeni kayıt senaryosu)
assert.strictEqual(shopState.shopProfile.onboardingCompleted, false, 'Yeni dükkânda onboardingCompleted başlangıçta false olmalı');

addAccount({
  id: ownerId,
  shopName: 'Karizma Erkek Kuaförü',
  ownerName: 'Ömer Berber',
  phone: ownerPhone,
  passwordHash: hashPassword('StrongPass123!'),
  role: 'owner',
  createdAt: new Date().toISOString(),
});
setShopState(ownerId, shopState);
const session = createSession(ownerId);

const app = express();
app.use(express.json());
// Korumalı rotalarda AsyncLocalStorage bağlamı
app.use((req, _res, next) => {
  const ctx = {
    accountId: ownerId,
    role: 'owner',
    state: loadShopState(ownerId),
  };
  als.run(ctx, () => next());
});
registerAuthRoutes(app);
registerProfileRoutes(app);
registerAppointmentRoutes(app);
registerCoreRoutes(app);

const server = http.createServer(app);
await new Promise<void>((resolve) => server.listen(0, resolve));
const port = (server.address() as any).port;
const baseUrl = `http://127.0.0.1:${port}`;
const authHeaders = {
  'Content-Type': 'application/json',
  Cookie: `sid=${session.token}`,
};

try {
  const today = localDay();

  // 1. Profil kurulumu sonrası onboardingCompleted: false korunumu + sektör kilidi
  let res = await fetch(`${baseUrl}/api/shop-profile`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      storeName: 'Karizma Erkek Kuaförü',
      ownerName: 'Ömer Berber',
      phone: ownerPhone,
      businessField: 'Kuaför / Berber / Güzellik Salonu',
      sectorKey: 'berber_kuafor',
      cityDistrict: 'İzmit / Kocaeli',
      dailyTarget: 5000,
    }),
  });
  assert.strictEqual(res.status, 200);
  let json: any = await res.json();
  assert.strictEqual(json.profile.isConfigured, true);
  assert.strictEqual(json.profile.onboardingCompleted, false, 'İlk profil kaydı sonrası onboardingCompleted henüz false kalmalı');

  // 2. Onboarding tamamlama ucu & kilitli sectorKey koruması
  res = await fetch(`${baseUrl}/api/shop-profile/onboarding`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ completed: true, dismissedSteps: ['welcome', 'setup'] }),
  });
  assert.strictEqual(res.status, 200);
  json = await res.json();
  assert.strictEqual(json.profile.onboardingCompleted, true);
  assert.strictEqual(json.profile.sectorKey, 'berber_kuafor', 'Onboarding endpointi sectorKey kilidini bozmamalı');
  assert.ok(Array.isArray(json.profile.onboardingDismissedSteps) && json.profile.onboardingDismissedSteps.includes('welcome'));
  console.log('  ✅ PASS 1: Yeni dükkân onboardingCompleted akışı ve sektör kilidi doğrulandı.');

  // 3. 2 Berber Usta tanımlama (%40 ve %25 prim)
  const staff1 = {
    id: 'st_omer',
    name: 'Ömer Usta',
    role: 'Baş Usta',
    phone: '05321112233',
    commissionRate: 40,
    offDays: [0],
    skills: ['Saç Kesimi'],
    workStart: '09:00',
    workEnd: '21:00',
    active: true,
  };
  const staff2 = {
    id: 'st_ali',
    name: 'Ali Kalfa',
    role: 'Kalfa',
    phone: '05334445566',
    commissionRate: 25,
    offDays: [0],
    skills: ['Sakal Tıraşı'],
    workStart: '09:00',
    workEnd: '21:00',
    active: true,
  };
  res = await fetch(`${baseUrl}/api/barber/staff`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ staff: [staff1, staff2] }),
  });
  assert.strictEqual(res.status, 200);

  // 4. Randevular oluştur (çeyrek saat 16:15 dahil, çok adımlı & gelmedi/sil senaryoları)
  res = await fetch(`${baseUrl}/api/appointments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customerName: 'Ahsen Elçarpar',
      phone: '05327778899',
      email: 'test@example.com',
      staffId: 'st_omer',
      staffName: 'Ömer Usta',
      serviceName: 'Kil Maskesi & Cilt Bakımı',
      price: 400,
      appointmentDate: today,
      timeSlot: '16:15',
      durationMinutes: 45,
      status: 'bekliyor',
    }),
  });
  assert.strictEqual(res.status, 200);
  const apt1 = ((await res.json()) as any).appointment;
  assert.strictEqual(apt1.timeSlot, '16:15');

  // Çok adımlı randevu (steps[])
  res = await fetch(`${baseUrl}/api/appointments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customerName: 'Kemal Kaya',
      phone: '05326665544',
      staffId: 'st_omer',
      staffName: 'Ömer Usta',
      serviceName: 'Saç + Sakal Paket',
      price: 600,
      appointmentDate: today,
      timeSlot: '11:00',
      durationMinutes: 60,
      status: 'onayli',
      steps: [
        {
          serviceId: 'srv1',
          serviceName: 'Saç Kesimi',
          staffId: 'st_omer',
          staffName: 'Ömer Usta',
          durationMinutes: 30,
          startTime: '11:00',
          endTime: '11:30',
          price: 400,
        },
        {
          serviceId: 'srv2',
          serviceName: 'Sakal Tıraşı',
          staffId: 'st_ali',
          staffName: 'Ali Kalfa',
          durationMinutes: 30,
          startTime: '11:30',
          endTime: '12:00',
          price: 200,
        },
      ],
    }),
  });
  assert.strictEqual(res.status, 200);
  const aptMulti = ((await res.json()) as any).appointment;

  // Gelmedi & Sil senaryoları için 2 randevu daha
  res = await fetch(`${baseUrl}/api/appointments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customerName: 'NoShow Müşteri',
      phone: '05321231212',
      staffId: 'st_ali',
      staffName: 'Ali Kalfa',
      serviceName: 'Sakal Tıraşı',
      price: 200,
      appointmentDate: today,
      timeSlot: '13:00',
      durationMinutes: 30,
      status: 'bekliyor',
    }),
  });
  const aptNoShow = ((await res.json()) as any).appointment;

  res = await fetch(`${baseUrl}/api/appointments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customerName: 'Silinecek Müşteri',
      phone: '05329990011',
      staffId: 'st_omer',
      staffName: 'Ömer Usta',
      serviceName: 'Fön',
      price: 150,
      appointmentDate: today,
      timeSlot: '14:30',
      durationMinutes: 30,
      status: 'bekliyor',
    }),
  });
  const aptToDelete = ((await res.json()) as any).appointment;

  // 5. Takvim Hızlı Aksiyonları: Geldi -> koltukta, Gelmedi -> gelmedi, Sil -> DELETE
  res = await fetch(`${baseUrl}/api/appointments/${apt1.id}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'koltukta' }),
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(((await res.json()) as any).appointment.status, 'koltukta', 'Geldi aksiyonu koltukta yapmalı');

  res = await fetch(`${baseUrl}/api/appointments/${aptNoShow.id}/status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ status: 'gelmedi' }),
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(((await res.json()) as any).appointment.status, 'gelmedi', 'Gelmedi aksiyonu gelmedi yapmalı');

  res = await fetch(`${baseUrl}/api/appointments/${aptToDelete.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  assert.strictEqual(res.status, 200);
  assert.ok(!loadShopState(ownerId).appointments.some((a) => a.id === aptToDelete.id), 'Silinen randevu state içinde olmamalı');
  console.log('  ✅ PASS 2: Takvim hızlı aksiyonları (Geldi/koltukta, Gelmedi/gelmedi, Sil/DELETE) ve 16:15 slotu doğrulandı.');

  // 6. Randevu tamamlama ve komisyon hesaplama (tek usta + çift tahsilat koruması + çok adımlı steps[])
  res = await fetch(`${baseUrl}/api/appointments/${apt1.id}/complete`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ paymentMethod: 'nakit' }),
  });
  assert.strictEqual(res.status, 200);
  const comp1: any = await res.json();
  assert.strictEqual(comp1.appointment.commissionRate, 40);
  assert.strictEqual(comp1.appointment.commissionAmount, 160, '400 TL * %40 = 160 TL prim olmalı');

  // Çift çağrı koruması
  res = await fetch(`${baseUrl}/api/appointments/${apt1.id}/complete`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ paymentMethod: 'nakit' }),
  });
  const comp1Replay: any = await res.json();
  assert.strictEqual(comp1Replay.alreadyCompleted, true, 'İkinci complete çağrısı çift tahsilat yapmamalı');

  // Çok adımlı randevu complete -> Ömer (400 * %40 = 160) + Ali (200 * %25 = 50) = 210 TL
  res = await fetch(`${baseUrl}/api/appointments/${aptMulti.id}/complete`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ paymentMethod: 'kart' }),
  });
  assert.strictEqual(res.status, 200);
  const compMulti: any = await res.json();
  assert.strictEqual(compMulti.appointment.commissionAmount, 210, 'Çok adımlı randevuda toplam prim 160+50 = 210 TL olmalı');
  assert.strictEqual(compMulti.appointment.commissionBreakdown.length, 2);
  console.log('  ✅ PASS 3: Tekil ve çok adımlı randevu prim hesaplama + çift tahsilat koruması doğrulandı.');

  // 7. GET /api/barber/commissions ve POST /api/barber/staff/:id/pay-commission + DELETE payout
  res = await fetch(`${baseUrl}/api/barber/commissions?period=month`, { headers: authHeaders });
  assert.strictEqual(res.status, 200);
  const commReport: any = await res.json();
  const omerStats = commReport.staffStats.find((s: any) => s.id === 'st_omer');
  const aliStats = commReport.staffStats.find((s: any) => s.id === 'st_ali');
  assert.ok(omerStats && aliStats, 'Her iki usta raporda yer almalı');
  assert.strictEqual(omerStats.earnedCommission, 320, 'Ömer toplam hakedişi 160+160 = 320 TL olmalı');
  assert.strictEqual(omerStats.payableBalance, 320);
  assert.strictEqual(aliStats.earnedCommission, 50, 'Ali toplam hakedişi 50 TL olmalı');
  assert.strictEqual(aliStats.noShowCount, 1, 'Ali no-show sayısı 1 olmalı');

  // Kısmi prim ödemesi (Ömer'e 200 TL Nakit) -> Kasadan gider düşmeli, kalan 120 TL olmalı
  res = await fetch(`${baseUrl}/api/barber/staff/st_omer/pay-commission`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      amount: 200,
      paymentMethod: 'nakit',
      note: 'Haftalık avans prim',
      periodLabel: 'Bu Ay',
    }),
  });
  assert.strictEqual(res.status, 200);
  const payRes: any = await res.json();
  assert.strictEqual(payRes.payout.amount, 200);
  assert.strictEqual(payRes.transaction.type, 'gider');
  assert.strictEqual(payRes.transaction.category, 'Personel Primi');
  assert.strictEqual(payRes.cash.todayExpense, 200, 'Prim ödemesi kasa giderine eklenmeli');

  res = await fetch(`${baseUrl}/api/barber/commissions?period=month`, { headers: authHeaders });
  const afterPayReport: any = await res.json();
  const omerAfter = afterPayReport.staffStats.find((s: any) => s.id === 'st_omer');
  assert.strictEqual(omerAfter.paidCommission, 200);
  assert.strictEqual(omerAfter.payableBalance, 120, 'Ödeme sonrası kalan bakiye 320-200 = 120 TL olmalı');

  // Prim ödemesi geri alma (DELETE)
  res = await fetch(`${baseUrl}/api/barber/commissions/payout/${payRes.payout.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  assert.strictEqual(res.status, 200);
  const delRes: any = await res.json();
  assert.strictEqual(delRes.cash.todayExpense, 0, 'İptal edilen prim ödemesi kasa giderini sıfırlamalı');
  console.log('  ✅ PASS 4: Prim raporu, kısmi prim ödemesi, kasa gideri ve geri alma doğrulandı.');

  // 8. Genel Personel ekleme + PUT /api/auth/staff/:id ile güncelleme (commissionRate dahil)
  res = await fetch(`${baseUrl}/api/auth/add-staff`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Hasan Kasiyer',
      phone: '05351112233',
      position: 'Kasiyer',
      salary: 22000,
      commissionRate: 15,
      staffNotes: 'Sabah vardiyası',
    }),
  });
  assert.strictEqual(res.status, 200);
  const addedGenStaff: any = await res.json();
  assert.strictEqual(addedGenStaff.account.commissionRate, 15);

  res = await fetch(`${baseUrl}/api/auth/staff/${addedGenStaff.account.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Hasan Kıdemli',
      phone: '05351112233',
      position: 'Usta',
      salary: 26000,
      commissionRate: 25,
      staffNotes: 'Tam gün',
    }),
  });
  assert.strictEqual(res.status, 200);
  const updatedGenStaff: any = await res.json();
  assert.strictEqual(updatedGenStaff.account.ownerName, 'Hasan Kıdemli');
  assert.strictEqual(updatedGenStaff.account.commissionRate, 25);
  assert.strictEqual(updatedGenStaff.account.salary, 26000);
  console.log('  ✅ PASS 5: Genel personel ekleme & PUT /api/auth/staff/:id güncelleme doğrulandı.');

  // 9. Frontend bileşen entegrasyon kontrolleri
  const barberUi = fs.readFileSync(
    path.join(process.cwd(), 'frontend', 'components', 'sector', 'BarberAppointmentsView.tsx'),
    'utf8'
  );
  const commDashUi = fs.readFileSync(
    path.join(process.cwd(), 'frontend', 'components', 'sector', 'StaffCommissionDashboard.tsx'),
    'utf8'
  );
  const onboardingUi = fs.readFileSync(
    path.join(process.cwd(), 'frontend', 'components', 'onboarding', 'OnboardingWizardTour.tsx'),
    'utf8'
  );
  const sidebarUi = fs.readFileSync(
    path.join(process.cwd(), 'frontend', 'components', 'layout', 'Sidebar.tsx'),
    'utf8'
  );
  const appUi = fs.readFileSync(path.join(process.cwd(), 'frontend', 'App.tsx'), 'utf8');

  assert.ok(barberUi.includes('StaffCommissionDashboard'), 'BarberAppointmentsView StaffCommissionDashboard kullanmalı');
  assert.ok(barberUi.includes('tel:'), 'Takvimde doğrudan arama tel: linki olmalı');
  assert.ok(barberUi.includes('onDeleteAppointment'), 'Takvimde silme aksiyonu bağlı olmalı');
  assert.ok(commDashUi.includes('/api/barber/staff/${'), 'StaffCommissionDashboard prim ödeme ucunu çağırmalı');
  assert.ok(commDashUi.includes('Pusula Yazdır') || commDashUi.includes('Pusula'), 'Pusula yazdırma bulunmalı');
  assert.ok(onboardingUi.includes('OnboardingWizardTour') && onboardingUi.includes('OnboardingChecklistCard'), 'Onboarding bileşenleri export edilmeli');
  assert.ok(sidebarUi.includes('nav-menu-onboarding'), 'Sidebar Tanıtım Sihirbazı butonu içermeli');
  assert.ok(appUi.includes('OnboardingWizardTour'), 'App.tsx OnboardingWizardTour render etmeli');
  console.log('  ✅ PASS 6: Frontend bileşen ve hızlı aksiyon bağlamaları doğrulandı.');
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  fs.rmSync(tmpDataDir, { recursive: true, force: true });
}

console.log('\n=======================================================');
console.log('TAKVİM, PERSONEL PRİMİ & ONBOARDİNG TESTLERİ BAŞARILI! 🎉');
console.log('=======================================================\n');
