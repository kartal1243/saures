const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

setGlobalOptions({
  region: 'europe-west1',
  maxInstances: 10,
});

const db = admin.firestore();

function normalizeGsm(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('905')) return digits;
  if (digits.length === 11 && digits.startsWith('05')) return '9' + digits;
  if (digits.length === 10 && digits.startsWith('5')) return '90' + digits;
  return digits;
}

async function dispatchOutboundSms({ phone, message, category, shopName }) {
  const gsm = normalizeGsm(phone);
  const cleanMessage = String(message || '').trim();
  const provider = (process.env.SMS_PROVIDER || '').trim().toLowerCase();
  const sender = (process.env.SMS_SENDER || 'DUKKANIM').trim();

  if (!gsm || !cleanMessage) {
    return { sent: false, provider: 'invalid_payload', error: 'Telefon ve mesaj zorunludur.' };
  }

  // Firebase Blaze harici ağ erişimi ile Türk SMS ağ geçitleri veya özel webhook
  if (provider === 'netgsm' && process.env.SMS_USERCODE && (process.env.SMS_API_SECRET || process.env.SMS_API_KEY)) {
    const body = new URLSearchParams({
      usercode: process.env.SMS_USERCODE,
      password: process.env.SMS_API_SECRET || process.env.SMS_API_KEY,
      gsmno: gsm,
      message: cleanMessage,
      msgheader: sender,
      dil: 'TR',
    });
    const resp = await fetch('https://api.netgsm.com.tr/sms/send/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(8000),
    });
    const text = (await resp.text()).trim();
    const ok = resp.ok && /^(00|01|02)\b/.test(text);
    return { sent: ok, provider: 'netgsm', error: ok ? undefined : text.slice(0, 120) };
  }

  if (provider === 'iletimerkezi' && process.env.SMS_API_KEY && process.env.SMS_API_SECRET) {
    const resp = await fetch('https://api.iletimerkezi.com/v1/send-sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        request: {
          authentication: { key: process.env.SMS_API_KEY, hash: process.env.SMS_API_SECRET },
          order: {
            sender,
            sendDateTime: [],
            iys: '1',
            iysList: 'BIREYSEL',
            message: { text: cleanMessage, receipents: { number: [gsm] } },
          },
        },
      }),
    });
    return { sent: resp.ok, provider: 'iletimerkezi', error: resp.ok ? undefined : `HTTP ${resp.status}` };
  }

  if (provider === 'webhook' || process.env.SMS_WEBHOOK_URL) {
    const webhookUrl = process.env.SMS_WEBHOOK_URL;
    if (webhookUrl) {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.SMS_API_KEY ? { Authorization: `Bearer ${process.env.SMS_API_KEY}` } : {}),
        },
        body: JSON.stringify({ phone: gsm, message: cleanMessage, category, shopName, sender }),
        signal: AbortSignal.timeout(8000),
      });
      return { sent: resp.ok, provider: 'webhook', error: resp.ok ? undefined : `HTTP ${resp.status}` };
    }
  }

  return {
    sent: false,
    queued: true,
    provider: 'firestore_queue',
    error: 'Harici SMS sağlayıcısı tanımlı değil; kayıt Firestore sms_logs altına işlendi.',
  };
}

/**
 * 1. HTTP Function: VPS backend veya panel hatırlatma SMS/Push gönderimi
 */
exports.sendReminderSms = onRequest({ cors: false }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const expectedSecret = (process.env.FIREBASE_FUNCTIONS_SECRET || process.env.WEBHOOK_SECRET || '').trim();
  const providedSecret = String(req.headers['x-firebase-secret'] || '').trim();
  if (!expectedSecret || providedSecret !== expectedSecret) {
    res.status(403).json({ error: 'Yetkisiz Firebase Functions çağrısı.' });
    return;
  }

  const { phone, message, category = 'reminder', shopName = 'Dükkanım Yanımda', fcmToken } = req.body || {};

  try {
    const smsResult = await dispatchOutboundSms({ phone, message, category, shopName });

    if (fcmToken) {
      await admin.messaging().send({
        token: String(fcmToken),
        notification: {
          title: shopName,
          body: String(message || '').slice(0, 180),
        },
        data: { category: String(category), url: '/' },
      }).catch(() => {});
    }

    await db.collection('sms_logs').add({
      phone: normalizeGsm(phone),
      category,
      shopName,
      provider: smsResult.provider,
      sent: Boolean(smsResult.sent),
      error: smsResult.error || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true, ...smsResult });
  } catch (err) {
    console.error('[sendReminderSms] Hata:', err);
    res.status(500).json({ sent: false, error: err.message || 'Sunucu hatası' });
  }
});

/**
 * 2. Firestore Trigger: `sms_queue/{docId}` belgesi açıldığında otomatik SMS + log işler
 */
exports.processSmsQueueDoc = onDocumentCreated('sms_queue/{docId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data() || {};
  if (data.status && data.status !== 'pending') return;

  try {
    const result = await dispatchOutboundSms({
      phone: data.phone,
      message: data.message,
      category: data.category,
      shopName: data.shopName,
    });

    await snap.ref.update({
      status: result.sent ? 'sent' : 'logged_only',
      provider: result.provider,
      error: result.error || null,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[processSmsQueueDoc] Hata:', err);
    await snap.ref.update({
      status: 'failed',
      error: err?.message || 'Beklenmeyen kuyruk işleme hatası',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
  }
});

/**
 * 3. Zamanlanmış Tarayıcı: Her 15 dakikada bir VPS hatırlatma döngüsünü tetikler (Blaze Cloud Scheduler)
 */
exports.scheduledReminderCron = onSchedule('every 15 minutes', async () => {
  const baseUrl = (process.env.APP_BASE_URL || 'https://dukkanimyanimda.com.tr').replace(/\/+$/, '');
  const secret = (process.env.FIREBASE_FUNCTIONS_SECRET || process.env.WEBHOOK_SECRET || '').trim();

  try {
    const resp = await fetch(`${baseUrl}/api/cron/firebase-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-firebase-secret': secret } : {}),
      },
      body: JSON.stringify({ source: 'firebase_cloud_scheduler' }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) {
      console.error(`[scheduledReminderCron] Sunucu HTTP ${resp.status} döndü`);
    }
  } catch (err) {
    console.error('[scheduledReminderCron] Tetikleme hatası:', err);
  }
});
