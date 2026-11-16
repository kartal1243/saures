import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  FIREBASE_PROJECT_ID,
  getFirebaseIntegrationStatus,
  dispatchFirebaseSms,
  sendFcmPushMessages,
} from '../backend/services/firebaseService';
import { sendSmsMessage, getSmsGatewayStatus } from '../backend/services/smsProvider';
import { getEffectiveSmsLimits } from '../backend/services/smsSecurity';
import { processShopReminders } from '../backend/services/reminderScheduler';
import { lookupPublicAsset, requestServiceForPublicAsset } from '../backend/routes/repair';
import type { AppState } from '../shared/types';

console.log('🧪 Firebase Blaze Entegrasyonu, SMS/Push/Auth & QR Bakım Pasaportu Testleri Başlatılıyor...\n');

// 1. Firebase Proje Konfigürasyonu & Güvenlik Dosyaları
assert.strictEqual(FIREBASE_PROJECT_ID, 'dukkanim-yanimda');
const projectRoot = process.cwd();
for (const rel of [
  'firebase.json',
  '.firebaserc',
  'firestore.rules',
  'firestore.indexes.json',
  'functions/package.json',
  'functions/index.js',
  'frontend/firebase.ts',
  'frontend/public/firebase-messaging-sw.js',
  '.agents/agents/firebase-uzmani/agent.md',
]) {
  assert.ok(fs.existsSync(path.join(projectRoot, rel)), `Beklenen dosya mevcut olmalı: ${rel}`);
}
const rulesTxt = fs.readFileSync(path.join(projectRoot, 'firestore.rules'), 'utf-8');
assert.ok(rulesTxt.includes("rules_version = '2'"), 'firestore.rules v2 olmalı');
assert.ok(!/allow\s+(read|write)\s*:\s*if\s+true\s*;/.test(rulesTxt), 'firestore.rules güvensiz if true kuralı içermemeli');
const fnTxt = fs.readFileSync(path.join(projectRoot, 'functions', 'index.js'), 'utf-8');
assert.ok(fnTxt.includes('if (!expectedSecret || providedSecret !== expectedSecret)'), 'sendReminderSms fail-closed olmalı');
assert.ok(fnTxt.includes('AbortSignal.timeout'), 'functions/index.js HTTP çağrıları timeout içermeli');
const swTxt = fs.readFileSync(path.join(projectRoot, 'frontend', 'public', 'sw.js'), 'utf-8');
assert.ok(swTxt.includes('parsed.notification'), 'sw.js FCM v1 payload biçimini okuyabilmeli');
console.log('✅ PASS 1: Firebase workspace dosyaları, Cloud Functions, Firestore Rules, SW ve firebase-uzmani ajanı doğrulandı.');

// 2. CSP & Backend Rotaları (reCAPTCHA + Google + FCM + /bakim/)
const appTs = fs.readFileSync(path.join(projectRoot, 'backend', 'app.ts'), 'utf-8');
assert.ok(appTs.includes('https://www.google.com'), 'CSP script-src/frame-src reCAPTCHA google.com içermeli');
assert.ok(appTs.includes('https://www.gstatic.com'), 'CSP gstatic.com içermeli');
assert.ok(appTs.includes('https://recaptcha.google.com'), 'CSP recaptcha.google.com içermeli');
assert.ok(appTs.includes('https://fcm.googleapis.com'), 'CSP FCM domainlerini içermeli');
assert.ok(appTs.includes("'/bakim/'"), 'isPublicRouteValid /bakim/ rotasını kabul etmeli');
assert.ok(appTs.includes("'/api/cron/firebase-reminders'"), 'Firebase Cloud Scheduler cron ucu tanımlı olmalı');
console.log('✅ PASS 2: backend/app.ts CSP reCAPTCHA/FCM izinleri ve cron/bakım rotaları doğrulandı.');

// 3. Frontend Firebase Auth (Şifremi Unuttum, Kayıt, Randevu OTP) & Web Push
const fbClient = fs.readFileSync(path.join(projectRoot, 'frontend', 'firebase.ts'), 'utf-8');
assert.ok(fbClient.includes('sendFirebasePhoneOtp'), 'Ortak Firebase Phone OTP yardımcısı olmalı');
assert.ok(fbClient.includes('resetRecaptchaVerifier'), 'reCAPTCHA yeniden deneme sıfırlaması olmalı');
assert.ok(fbClient.includes('sendFirebaseRecoveryEmailLink'), 'E-posta şifre kurtarma yardımcısı olmalı');
assert.ok(fbClient.includes('registerFirebaseWebPush'), 'Web Push FCM kaydı olmalı');
assert.ok(fbClient.includes('translateFirebaseError'), 'Türkçe Firebase hata çeviricisi olmalı');

const authPage = fs.readFileSync(path.join(projectRoot, 'frontend', 'components', 'auth', 'AuthPage.tsx'), 'utf-8');
assert.ok(authPage.includes('sendFirebasePhoneOtp'), 'AuthPage Forgot Password Firebase OTP kullanmalı');
assert.ok(authPage.includes('completeFirebaseRecoveryEmailLink'), 'AuthPage e-posta sıfırlama dönüşünü yakalamalı');
assert.ok(authPage.includes('resendCooldownSec'), 'AuthPage tekrar kod gönderme geri sayımı olmalı');

const bookingView = fs.readFileSync(path.join(projectRoot, 'frontend', 'components', 'public', 'PublicBarberBookingView.tsx'), 'utf-8');
assert.ok(bookingView.includes('sendFirebasePhoneOtp'), 'Berber randevu OTP akışı Firebase Phone Auth kullanmalı');
assert.ok(bookingView.includes('firebaseIdToken'), 'Randevu POST gövdesi firebaseIdToken göndermeli');
console.log('✅ PASS 3: Şifremi Unuttum, Kayıt, Berber OTP ve Web Push frontend Firebase entegrasyonu doğrulandı.');

// 4. SmsSecurity Blaze Ölçekleme & Varsayılan Spark Koruma Dengesi
const prevBlaze = process.env.FIREBASE_BLAZE_ENABLED;
delete process.env.FIREBASE_BLAZE_ENABLED;
const defaultLimits = getEffectiveSmsLimits();
assert.strictEqual(defaultLimits.GLOBAL_DAILY_LIMIT, 20, 'Varsayılan Spark testi uyumu 20 korunmalı');
process.env.FIREBASE_BLAZE_ENABLED = 'true';
const blazeLimits = getEffectiveSmsLimits();
assert.ok(blazeLimits.GLOBAL_DAILY_LIMIT >= 5000, 'FIREBASE_BLAZE_ENABLED=true iken kota yükselmeli');
if (prevBlaze === undefined) delete process.env.FIREBASE_BLAZE_ENABLED;
else process.env.FIREBASE_BLAZE_ENABLED = prevBlaze;
console.log('✅ PASS 4: smsSecurity Blaze dinamik limitleri doğrulandı.');

// 5. QR Makine & Fabrika Bakım Pasaportu (/bakim/demo) ve ReminderScheduler Bakım Desteği
async function runAsync() {
  const demoAsset = lookupPublicAsset('demo');
  assert.ok(demoAsset, 'Demo bakım pasaportu dönmeli');
  assert.strictEqual(demoAsset.code, 'demo');
  assert.ok(demoAsset.logs.length >= 2, 'Demo bakım geçmişi dolu olmalı');

  const ticketReq = await requestServiceForPublicAsset('demo', {
    reporterName: 'Vardiya Amiri Ali',
    reporterPhone: '05321112233',
    issueDescription: 'Spindle rulman sesi kontrolü',
    urgency: 'Acil — Hat Durdu',
  });
  assert.strictEqual(ticketReq.ok, true, 'Demo QR arıza bildirimi başarılı olmalı');
  assert.ok(ticketReq.ticket?.id);

  // Firebase status & fallback doğrulamaları
  const fbStatus = getFirebaseIntegrationStatus();
  assert.strictEqual(fbStatus.projectId, 'dukkanim-yanimda');
  assert.strictEqual(fbStatus.phoneAuthReady, true);

  const gw = getSmsGatewayStatus();
  assert.ok(gw.provider);
  const unconfFn = await dispatchFirebaseSms({ phone: '905321112233', message: 'Test' });
  assert.strictEqual(typeof unconfFn.sent, 'boolean');

  const unconfPush = await sendFcmPushMessages([], { title: 'Test', body: 'Body' });
  assert.strictEqual(unconfPush.simulated, true);

  const fallbackSms = await sendSmsMessage('05321112233', 'Firebase bakım testi', { category: 'test' });
  assert.ok(fallbackSms.whatsappLink.includes('wa.me/905321112233'));

  // Bakım zamanlayıcısı maintenanceAssets testi
  const nowMs = Date.now();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date(nowMs));
  const mockState: AppState = {
    storeName: 'Endüstriyel Teknik Servis',
    shopProfile: {
      storeName: 'Endüstriyel Teknik Servis',
      ownerName: 'Ahmet Usta',
      businessField: 'Teknik Servis',
      employeeCount: '3',
      phone: '05321110000',
      cityDistrict: 'İstanbul',
      dailyTarget: 5000,
      isConfigured: true,
      isVip: true,
      vipTier: 'patron',
      vipUntil: new Date(nowMs + 86400000 * 30).toISOString(),
    },
    customers: [],
    transactions: [],
    reminderLogs: [],
    dailyClosings: [],
    products: [],
    stockMovements: [],
    appointments: [],
    tables: [],
    repairTickets: [],
    maintenanceAssets: [
      {
        id: 'asset_test_1',
        code: 'MKN-TEST',
        clientName: 'Örnek Fabrika',
        clientPhone: '05329998877',
        deviceName: 'CNC Torna',
        intervalDays: 90,
        lastMaintenanceDate: '2026-01-01',
        nextMaintenanceDate: todayStr,
        logs: [],
        createdAt: new Date(nowMs).toISOString(),
      },
    ],
    suppliers: [],
    services: [],
    cases: [],
    custody: [],
    businessDate: todayStr,
    lastUpdated: new Date(nowMs).toISOString(),
  };

  const remRes = await processShopReminders('acc_test_firebase', mockState, nowMs);
  assert.strictEqual(remRes.maintenanceReminded, 1, 'Bugün bakımı gelen cihaz için 1 hatırlatma oluşturulmalı');
  assert.strictEqual(mockState.reminderLogs.length, 1);
  assert.strictEqual(mockState.reminderLogs[0].type, 'bakim');

  console.log('✅ PASS 5: QR Makine Bakım Pasaportu, Firebase hizmet modülü ve zamanlayıcı testleri geçti!');
  console.log('\n🎉 TÜM FIREBASE BLAZE & TEKNİK SERVİS QR BAKIM TESTLERİ 100% PASS!');
}

runAsync().catch((err) => {
  console.error('❌ Test başarısız:', err);
  process.exit(1);
});
