import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  FIREBASE_PROJECT_ID,
  FIREBASE_PROJECT_NUMBER,
  getFirebaseIntegrationStatus,
  dispatchFirebaseSms,
  sendFcmPushMessages,
  verifyFirebaseAppCheckToken,
  buildSafePublicAssetFirestoreDoc,
  renderBackendBrandedEmail,
} from '../backend/services/firebaseService';
import { firebaseAppCheckGuard } from '../backend/guards';
import { sendSmsMessage, getSmsGatewayStatus } from '../backend/services/smsProvider';
import { getEffectiveSmsLimits } from '../backend/services/smsSecurity';
import { processShopReminders, processDailyMorningForShop } from '../backend/services/reminderScheduler';
import { lookupPublicAsset, requestServiceForPublicAsset } from '../backend/routes/repair';
import type { AppState } from '../shared/types';

console.log('🧪 Firebase Blaze Entegrasyonu, App Check, Cloud Functions & QR Bakım Pasaportu Testleri Başlatılıyor...\n');

// 1. Firebase Proje Konfigürasyonu, Storage Rules & Güvenlik Dosyaları
assert.strictEqual(FIREBASE_PROJECT_ID, 'dukkanim-yanimda');
const projectRoot = process.cwd();
for (const rel of [
  'firebase.json',
  '.firebaserc',
  'firestore.rules',
  'firestore.indexes.json',
  'storage.rules',
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

const storageRulesTxt = fs.readFileSync(path.join(projectRoot, 'storage.rules'), 'utf-8');
assert.ok(storageRulesTxt.includes("rules_version = '2'"), 'storage.rules v2 olmalı');
assert.ok(storageRulesTxt.includes('allow read, write: if false;'), 'storage.rules fail-closed olmalı');

const firebaseJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'firebase.json'), 'utf-8'));
assert.strictEqual(firebaseJson?.storage?.rules, 'storage.rules', 'firebase.json storage.rules tanımlı olmalı');

const fnPkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'functions', 'package.json'), 'utf-8'));
assert.ok(fnPkg.dependencies?.nodemailer, 'functions/package.json nodemailer bağımlılığı içermeli');

const fnTxt = fs.readFileSync(path.join(projectRoot, 'functions', 'index.js'), 'utf-8');
assert.ok(fnTxt.includes('if (!expectedSecret || providedSecret !== expectedSecret)') || fnTxt.includes('isAuthorizedSecret'), 'Cloud Functions HTTP uçları fail-closed olmalı');
assert.ok(fnTxt.includes('AbortSignal.timeout'), 'functions/index.js HTTP çağrıları timeout içermeli');
for (const expectedSymbol of [
  'vatansms',
  'twilio',
  'TWILIO_ACCOUNT_SID',
  'RESEND_API_KEY',
  'SENDGRID_API_KEY',
  'SMTP_HOST',
  'renderBrandedEmailHtml',
  'exports.sendBrandedEmail',
  'exports.processEmailQueueDoc',
  'exports.sendTransactionalNotification',
  'exports.processNotificationQueueDoc',
  'exports.scheduledReminderCron',
  'exports.dailyMorningCron',
  'daily_cron_runs',
]) {
  assert.ok(fnTxt.includes(expectedSymbol), `functions/index.js ${expectedSymbol} içermeli`);
}

const swTxt = fs.readFileSync(path.join(projectRoot, 'frontend', 'public', 'sw.js'), 'utf-8');
assert.ok(swTxt.includes('parsed.notification'), 'sw.js FCM v1 payload biçimini okuyabilmeli');
console.log('✅ PASS 1: Firebase workspace dosyaları, Storage Rules, Cloud Functions v2 (SMS/Email/Cron) ve SW doğrulandı.');

// 2. CSP, CORS & Backend Rotaları (App Check, Phone Login, Daily 09 Cron, Admin Firebase)
const appTs = fs.readFileSync(path.join(projectRoot, 'backend', 'app.ts'), 'utf-8');
assert.ok(appTs.includes('https://www.google.com'), 'CSP script-src/frame-src reCAPTCHA google.com içermeli');
assert.ok(appTs.includes('https://www.gstatic.com'), 'CSP gstatic.com içermeli');
assert.ok(appTs.includes('https://recaptcha.google.com'), 'CSP recaptcha.google.com içermeli');
assert.ok(appTs.includes('https://fcm.googleapis.com'), 'CSP FCM domainlerini içermeli');
assert.ok(appTs.includes('https://firebaseappcheck.googleapis.com'), 'CSP App Check domaini içermeli');
assert.ok(appTs.includes('https://content-firebaseappcheck.googleapis.com'), 'CSP App Check content domaini içermeli');
assert.ok(appTs.includes('https://firebasestorage.googleapis.com'), 'CSP Storage domaini içermeli');
assert.ok(appTs.includes('https://storage.googleapis.com'), 'CSP GCS domaini içermeli');
assert.ok(appTs.includes('wss://*.firebaseio.com'), 'CSP RTDB wss domaini içermeli');
assert.ok(appTs.includes('X-Firebase-AppCheck'), 'Mobil CORS headerları X-Firebase-AppCheck içermeli');
assert.ok(appTs.includes("'/bakim/'"), 'isPublicRouteValid /bakim/ rotasını kabul etmeli');
assert.ok(appTs.includes("'/api/cron/firebase-reminders'"), 'Firebase 15 dk cron ucu tanımlı olmalı');
assert.ok(appTs.includes("'/api/cron/firebase-daily-09'"), 'Firebase 09:00 günlük cron ucu tanımlı olmalı');

const authTs = fs.readFileSync(path.join(projectRoot, 'backend', 'routes', 'auth.ts'), 'utf-8');
assert.ok(authTs.includes("'/api/auth/phone-login'"), 'auth.ts /api/auth/phone-login ucu tanımlı olmalı');
assert.ok(authTs.includes('firebaseAppCheckGuard'), 'auth.ts firebaseAppCheckGuard kullanmalı');
assert.ok(authTs.includes('dispatchBrandedEmail'), 'auth.ts hoş geldin / sıfırlama kurumsal maili kullanmalı');
assert.ok(authTs.includes('emailResetToken'), 'auth.ts özel e-posta sıfırlama token doğrulaması içermeli');

const adminTs = fs.readFileSync(path.join(projectRoot, 'backend', 'routes', 'admin.ts'), 'utf-8');
assert.ok(adminTs.includes("'/api/admin/firebase/status'"), 'admin.ts firebase status ucu olmalı');
assert.ok(adminTs.includes("'/api/admin/firebase/sync'"), 'admin.ts firebase sync ucu olmalı');
assert.ok(adminTs.includes("'/api/admin/firebase/test-daily-09'"), 'admin.ts daily 09 test ucu olmalı');
console.log('✅ PASS 2: backend/app.ts CSP/CORS/Cron, auth.ts phone-login/emailReset ve admin.ts Firebase uçları doğrulandı.');

// 3. Frontend App Check, Phone Login, Public Viewlar & AdminSite Blaze Kartı
const fbClient = fs.readFileSync(path.join(projectRoot, 'frontend', 'firebase.ts'), 'utf-8');
for (const sym of [
  'initializeAppCheck',
  'ReCaptchaV3Provider',
  'initFirebaseAppCheck',
  'getFirebaseAppCheckToken',
  'fetchWithAppCheck',
  'sendFirebasePhoneOtp',
  'resetRecaptchaVerifier',
  'sendFirebaseRecoveryEmailLink',
  'registerFirebaseWebPush',
  'translateFirebaseError',
]) {
  assert.ok(fbClient.includes(sym), `frontend/firebase.ts ${sym} içermeli`);
}

const appTsx = fs.readFileSync(path.join(projectRoot, 'frontend', 'App.tsx'), 'utf-8');
assert.ok(appTsx.includes('initFirebaseAppCheck'), 'App.tsx App Check başlatmalı');

const authPage = fs.readFileSync(path.join(projectRoot, 'frontend', 'components', 'auth', 'AuthPage.tsx'), 'utf-8');
for (const sym of [
  'initFirebaseAppCheck',
  'fetchWithAppCheck',
  'sendFirebasePhoneOtp',
  'completeFirebaseRecoveryEmailLink',
  'resendCooldownSec',
  '/api/auth/phone-login',
  'login-sms-recaptcha-container',
  'emailResetToken',
  'customEmailSent',
]) {
  assert.ok(authPage.includes(sym), `AuthPage.tsx ${sym} içermeli`);
}

const bookingView = fs.readFileSync(path.join(projectRoot, 'frontend', 'components', 'public', 'PublicBarberBookingView.tsx'), 'utf-8');
assert.ok(bookingView.includes('initFirebaseAppCheck'), 'PublicBarberBookingView App Check başlatmalı');
assert.ok(bookingView.includes('fetchWithAppCheck'), 'PublicBarberBookingView fetchWithAppCheck kullanmalı');
assert.ok(bookingView.includes('sendFirebasePhoneOtp'), 'Berber randevu OTP akışı Firebase Phone Auth kullanmalı');
assert.ok(bookingView.includes('firebaseIdToken'), 'Randevu POST gövdesi firebaseIdToken göndermeli');

const assetView = fs.readFileSync(path.join(projectRoot, 'frontend', 'components', 'public', 'PublicAssetPassportView.tsx'), 'utf-8');
assert.ok(assetView.includes('initFirebaseAppCheck'), 'PublicAssetPassportView App Check başlatmalı');
assert.ok(assetView.includes('fetchWithAppCheck'), 'PublicAssetPassportView fetchWithAppCheck kullanmalı');

const menuView = fs.readFileSync(path.join(projectRoot, 'frontend', 'components', 'public', 'PublicQrMenuView.tsx'), 'utf-8');
assert.ok(menuView.includes('initFirebaseAppCheck'), 'PublicQrMenuView App Check başlatmalı');
assert.ok(menuView.includes('fetchWithAppCheck'), 'PublicQrMenuView fetchWithAppCheck kullanmalı');

const adminSite = fs.readFileSync(path.join(projectRoot, 'frontend', 'components', 'admin', 'AdminSite.tsx'), 'utf-8');
assert.ok(adminSite.includes('/api/admin/firebase/status'), 'AdminSite firebase status çekmeli');
assert.ok(adminSite.includes('/api/admin/firebase/sync'), 'AdminSite bulut senkron butonunu bağlamalı');
assert.ok(adminSite.includes('/api/admin/firebase/test-daily-09'), 'AdminSite 09:00 rutin butonunu bağlamalı');
assert.ok(adminSite.includes('Bulut Senkronu Başlat'), 'AdminSite Firebase Blaze kartı buton metnini içermeli');
console.log('✅ PASS 3: Tüm frontend ekranlarında App Check, Phone Auth girişi ve Admin Blaze kartı doğrulandı.');

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

// 5. Async Testler: App Check RS256 Doğrulama, Branded Email, QR Pasaport, 09:00 Cron & Sıfır-PII Firestore
async function runAsync() {
  // 5a. Gerçek RS256 App Check JWT imza & claim doğrulaması
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' }) as Record<string, any>;
  jwk.kid = 'test-appcheck-kid-1';
  jwk.alg = 'RS256';
  jwk.use = 'sig';

  function b64u(objOrBuf: unknown): string {
    const buf = Buffer.isBuffer(objOrBuf) ? objOrBuf : Buffer.from(JSON.stringify(objOrBuf), 'utf-8');
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function signAppCheckJwt(payload: Record<string, unknown>, customKey = privateKey): string {
    const hdr = b64u({ alg: 'RS256', typ: 'JWT', kid: 'test-appcheck-kid-1' });
    const pld = b64u(payload);
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${hdr}.${pld}`);
    const sig = b64u(signer.sign(customKey));
    return `${hdr}.${pld}.${sig}`;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const validJwt = signAppCheckJwt({
    iss: `https://firebaseappcheck.googleapis.com/${FIREBASE_PROJECT_NUMBER}`,
    aud: [`projects/${FIREBASE_PROJECT_NUMBER}`],
    sub: '1:403857948982:web:43381cfd3bd8ce39f17397',
    iat: nowSec - 10,
    exp: nowSec + 600,
  });

  const validVerify = await verifyFirebaseAppCheckToken(validJwt, { jwksOverride: [jwk], nowSec });
  assert.strictEqual(validVerify.valid, true, 'Geçerli RS256 App Check token doğrulanmalı');
  assert.strictEqual(validVerify.appId, '1:403857948982:web:43381cfd3bd8ce39f17397');

  const expiredJwt = signAppCheckJwt({
    iss: `https://firebaseappcheck.googleapis.com/${FIREBASE_PROJECT_NUMBER}`,
    aud: [`projects/${FIREBASE_PROJECT_NUMBER}`],
    exp: nowSec - 5,
  });
  const expiredVerify = await verifyFirebaseAppCheckToken(expiredJwt, { jwksOverride: [jwk], nowSec });
  assert.strictEqual(expiredVerify.valid, false, 'Süresi dolmuş App Check token reddedilmeli');

  const wrongIssJwt = signAppCheckJwt({
    iss: 'https://firebaseappcheck.googleapis.com/999999999',
    aud: [`projects/${FIREBASE_PROJECT_NUMBER}`],
    exp: nowSec + 600,
  });
  const wrongIssVerify = await verifyFirebaseAppCheckToken(wrongIssJwt, { jwksOverride: [jwk], nowSec });
  assert.strictEqual(wrongIssVerify.valid, false, 'Yanlış projeden gelen App Check token reddedilmeli');

  const { privateKey: otherPriv } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const tamperedJwt = signAppCheckJwt(
    {
      iss: `https://firebaseappcheck.googleapis.com/${FIREBASE_PROJECT_NUMBER}`,
      aud: [`projects/${FIREBASE_PROJECT_NUMBER}`],
      exp: nowSec + 600,
    },
    otherPriv
  );
  const tamperedVerify = await verifyFirebaseAppCheckToken(tamperedJwt, { jwksOverride: [jwk], nowSec });
  assert.strictEqual(tamperedVerify.valid, false, 'Hatalı imzalı App Check token reddedilmeli');

  // 5b. firebaseAppCheckGuard enforce=false / enforce=true davranışı
  const prevEnforce = process.env.FIREBASE_APP_CHECK_ENFORCE;
  const prevSiteKey = process.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;
  process.env.VITE_FIREBASE_APP_CHECK_SITE_KEY = '6LeTestSiteKey123';

  delete process.env.FIREBASE_APP_CHECK_ENFORCE;
  const statusNoEnforce = getFirebaseIntegrationStatus();
  assert.strictEqual(statusNoEnforce.appCheckConfigured, true);
  assert.strictEqual(statusNoEnforce.appCheckSiteKey, '6LeTestSiteKey123');
  assert.strictEqual(statusNoEnforce.appCheckEnforced, false);

  let nextCalled = false;
  await firebaseAppCheckGuard({ headers: {} } as any, { status: () => ({ json: () => {} }) } as any, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true, 'Enforce kapalıyken App Check header eksikse geçişe izin verilmeli');

  process.env.FIREBASE_APP_CHECK_ENFORCE = 'true';
  let blockedStatus = 0;
  let blockedBody: any = null;
  await firebaseAppCheckGuard(
    { headers: {} } as any,
    {
      status(code: number) {
        blockedStatus = code;
        return {
          json(b: any) {
            blockedBody = b;
          },
        };
      },
    } as any,
    () => {
      throw new Error('Enforce açıkken tokensız geçiş olmamalı');
    }
  );
  assert.strictEqual(blockedStatus, 401, 'Enforce açıkken tokensız istek 401 almalı');
  assert.strictEqual(blockedBody?.code, 'APP_CHECK_REQUIRED');

  if (prevEnforce === undefined) delete process.env.FIREBASE_APP_CHECK_ENFORCE;
  else process.env.FIREBASE_APP_CHECK_ENFORCE = prevEnforce;
  if (prevSiteKey === undefined) delete process.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;
  else process.env.VITE_FIREBASE_APP_CHECK_SITE_KEY = prevSiteKey;

  // 5c. Kurumsal HTML E-posta render doğrulaması & XSS kaçışı
  const emailRendered = renderBackendBrandedEmail({
    to: 'test@dukkanim.com',
    subject: 'Hoş Geldiniz',
    type: 'welcome',
    shopName: 'Yıldız <script>alert(1)</script> Berber',
    ownerName: 'Ahmet Usta',
  });
  assert.ok(emailRendered.html.includes('#FF6B00'), 'E-posta şablonu #FF6B00 kurumsal rengini içermeli');
  assert.ok(!emailRendered.html.includes('<script>'), 'E-posta HTML XSS karakterlerini escape etmeli');
  assert.ok(emailRendered.text.includes('Ahmet Usta'), 'E-posta düz metin alternatifi üretmeli');

  // 5d. public_assets sıfır-PII Firestore şeması kontrolü
  const safeAsset = buildSafePublicAssetFirestoreDoc('TeknoFix Servis', {
    id: 'asset_pii_1',
    code: 'MKN-9001',
    clientName: 'GİZLİ MÜŞTERİ FABRİKASI',
    clientPhone: '05321112233',
    locationArea: 'Gizli Kat 2',
    deviceName: 'CNC Torna X5',
    brandModel: 'Mazak 2025',
    serialNumber: 'SECRET-SN-9999',
    intervalDays: 90,
    lastMaintenanceDate: '2026-10-01',
    nextMaintenanceDate: '2026-12-30',
    notes: 'Özel müşteri notu',
    logs: [{ id: 'l1', date: '2026-10-01', summary: 'Bakım' }],
    createdAt: new Date().toISOString(),
  });
  assert.ok(safeAsset, 'Geçerli cihaz kodu eşlenebilmeli');
  assert.strictEqual(safeAsset.doc.isPublic, true);
  assert.strictEqual(safeAsset.doc.logsCount, 1);
  for (const piiKey of [
    'clientName',
    'clientPhone',
    'phone',
    'serialNumber',
    'locationArea',
    'notes',
    'logs',
    'accountId',
  ]) {
    assert.strictEqual(safeAsset.doc[piiKey], undefined, `public_assets içine ${piiKey} yazılmamalı!`);
  }

  // 5e. QR Pasaport & Mevcut Firebase yardımcıları
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

  const fbStatus = getFirebaseIntegrationStatus();
  assert.strictEqual(fbStatus.projectId, 'dukkanim-yanimda');
  assert.strictEqual(fbStatus.phoneAuthReady, true);
  assert.ok(fbStatus.storageBucket.includes('dukkanim-yanimda'));

  const gw = getSmsGatewayStatus();
  assert.ok(gw.provider);
  const unconfFn = await dispatchFirebaseSms({ phone: '905321112233', message: 'Test' });
  assert.strictEqual(typeof unconfFn.sent, 'boolean');

  const unconfPush = await sendFcmPushMessages([], { title: 'Test', body: 'Body' });
  assert.strictEqual(unconfPush.simulated, true);

  const fallbackSms = await sendSmsMessage('05321112233', 'Firebase bakım testi', { category: 'test' });
  assert.ok(fallbackSms.whatsappLink.includes('wa.me/905321112233'));

  // 5f. Zamanlayıcı (processShopReminders) & Sabah 09:00 Günlük Cron (processDailyMorningForShop)
  const nowMs = Date.now();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date(nowMs));
  const tomorrowStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(
    new Date(nowMs + 2 * 86400000)
  );
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
    customers: [
      {
        id: 'cust_morning_1',
        name: 'Hasan Kaya',
        phone: '05331112233',
        balance: -400,
        businessCategory: 'teknik_servis',
        subscriptionPlan: {
          enabled: true,
          title: 'Aylık Bakım Sözleşmesi',
          amount: 400,
          interval: 'aylik',
          nextDueDate: todayStr,
        },
        createdAt: new Date(nowMs).toISOString(),
      },
    ],
    transactions: [],
    reminderLogs: [],
    dailyClosings: [],
    products: [],
    stockMovements: [],
    appointments: [
      {
        id: 'apt_morning_1',
        customerName: 'Mehmet Öz',
        phone: '05441112233',
        staffName: 'Ahmet Usta',
        serviceName: 'Saç & Sakal',
        price: 350,
        appointmentDate: todayStr,
        timeSlot: '14:00',
        status: 'onayli',
        createdAt: new Date(nowMs).toISOString(),
      },
    ],
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
      {
        id: 'asset_test_2',
        code: 'MKN-UPCOMING',
        clientName: 'Beta Atölye',
        clientPhone: '05328887766',
        deviceName: 'Kompresör',
        intervalDays: 90,
        lastMaintenanceDate: '2026-01-01',
        nextMaintenanceDate: tomorrowStr,
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
  assert.strictEqual(mockState.reminderLogs[0].type, 'bakim');

  const morning1 = await processDailyMorningForShop('acc_test_firebase', mockState, {
    nowMs,
    ownerName: 'Ahmet Usta',
  });
  assert.strictEqual(morning1.skipped, false, 'İlk sabah 09:00 taraması çalışmalı');
  assert.strictEqual(morning1.appointmentsCount, 1, 'Bugünkü 1 randevuyu görmeli');
  assert.strictEqual(morning1.duesCount, 1, 'Vadesi gelen 1 aboneliği görmeli');
  assert.strictEqual(morning1.maintenanceCount, 2, '0-3 gün kalan 2 bakımı tespit etmeli');

  const morningDup = await processDailyMorningForShop('acc_test_firebase', mockState, { nowMs });
  assert.strictEqual(morningDup.skipped, true, 'Aynı gün 2. kez duplicate atlanmalı');

  const morningForce = await processDailyMorningForShop('acc_test_firebase', mockState, { nowMs, force: true });
  assert.strictEqual(morningForce.skipped, false, 'force=true ile yeniden çalıştırılabilmeli');

  console.log('✅ PASS 5: App Check RS256, kurumsal HTML mail, sıfır-PII public_assets, QR bakım ve 09:00 günlük cron testleri geçti!');
  console.log('\n🎉 TÜM FIREBASE BLAZE & APP CHECK TESTLERİ 100% PASS!');
}

runAsync().catch((err) => {
  console.error('❌ Test başarısız:', err);
  process.exit(1);
});
