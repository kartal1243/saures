const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps.length) {
  admin.initializeApp();
}

setGlobalOptions({
  region: 'europe-west1',
  maxInstances: 10,
});

const FIRESTORE_DATABASE_ID = (
  process.env.FIREBASE_FIRESTORE_DATABASE_ID ||
  process.env.FIRESTORE_DATABASE_ID ||
  'default'
).trim();

const db = getFirestore(admin.app(), FIRESTORE_DATABASE_ID);

function getNodemailer() {
  try {
    return require('nodemailer');
  } catch {
    return null;
  }
}

function normalizeGsm(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('905')) return digits;
  if (digits.length === 11 && digits.startsWith('05')) return '9' + digits;
  if (digits.length === 10 && digits.startsWith('5')) return '90' + digits;
  return digits;
}

function isAuthorizedSecret(req) {
  const expectedSecret = (process.env.FIREBASE_FUNCTIONS_SECRET || process.env.WEBHOOK_SECRET || '').trim();
  const providedSecret = String(req.headers['x-firebase-secret'] || '').trim();
  return Boolean(expectedSecret && providedSecret === expectedSecret);
}

async function dispatchOutboundSms({ phone, message, category, shopName }) {
  const gsm = normalizeGsm(phone);
  const cleanMessage = String(message || '').trim();
  const provider = (process.env.SMS_PROVIDER || '').trim().toLowerCase();
  const sender = (process.env.SMS_SENDER || 'DUKKANIM').trim();

  if (!gsm || !cleanMessage) {
    return { sent: false, provider: 'invalid_payload', error: 'Telefon ve mesaj zorunludur.' };
  }

  // 1. NetGSM
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

  // 2. İletiMerkezi
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

  // 3. VatanSMS
  if (provider === 'vatansms' && process.env.SMS_USERCODE && process.env.SMS_API_KEY) {
    const resp = await fetch('https://api.vatansms.net/api/v1/1toN', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        api_id: process.env.SMS_USERCODE,
        api_key: process.env.SMS_API_KEY,
        sender,
        message_type: 'turkce',
        message: cleanMessage,
        phones: [gsm],
      }),
    });
    return { sent: resp.ok, provider: 'vatansms', error: resp.ok ? undefined : `HTTP ${resp.status}` };
  }

  // 4. Twilio
  if (
    (provider === 'twilio' || (!provider && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)) &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  ) {
    const sid = process.env.TWILIO_ACCOUNT_SID.trim();
    const token = process.env.TWILIO_AUTH_TOKEN.trim();
    const fromNumber = process.env.TWILIO_FROM_NUMBER.trim();
    const toNumber = gsm.startsWith('+') ? gsm : `+${gsm}`;
    const authHeader = Buffer.from(`${sid}:${token}`).toString('base64');

    const form = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: cleanMessage,
    });

    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(8000),
    });
    const text = await resp.text().catch(() => '');
    return {
      sent: resp.ok,
      provider: 'twilio',
      error: resp.ok ? undefined : `Twilio HTTP ${resp.status}: ${text.slice(0, 120)}`,
    };
  }

  // 5. Özel Webhook
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

function escapeHtml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBrandedEmailHtml(payload) {
  const type = payload.type || 'welcome';
  const shopName = payload.shopName || 'Dükkânım Yanımda';
  const recipient = payload.recipientName || payload.ownerName || 'Değerli Esnafımız';
  const actionUrl = payload.resetUrl || payload.actionUrl || 'https://dukkanimyanimda.com.tr/';
  const details = Array.isArray(payload.details) ? payload.details : [];

  let subject = payload.subject || '';
  let headline = payload.headline || '';
  let lines = Array.isArray(payload.bodyLines) && payload.bodyLines.length > 0 ? payload.bodyLines : [];
  let ctaText = payload.ctaText || 'Panele Git';

  if (type === 'welcome') {
    subject = subject || `${shopName} — Dükkânım Yanımda'ya Hoş Geldiniz!`;
    headline = headline || `${shopName} Hesabınız Açıldı`;
    if (lines.length === 0) {
      lines = [
        `Merhaba ${recipient}, Dükkânım Yanımda ailesine hoş geldiniz.`,
        '14 günlük ücretsiz Patron VIP denemeniz aktif edildi. Kasa, veresiye, online randevu ve QR menü özelliklerini hemen kullanabilirsiniz.',
      ];
    }
    ctaText = payload.ctaText || 'Dükkan Paneline Gir';
  } else if (type === 'password_reset') {
    subject = subject || 'Şifre Sıfırlama Talebiniz — Dükkânım Yanımda';
    headline = headline || 'Güvenli Şifre Sıfırlama Bağlantınız';
    if (lines.length === 0) {
      lines = [
        `Merhaba ${recipient}, ${shopName} hesabınız için şifre sıfırlama bağlantısı hazırlandı.`,
        'Bağlantı tek kullanımlıktır. Bu talebi siz oluşturmadıysanız lütfen dikkate almayınız.',
      ];
    }
    ctaText = payload.ctaText || 'Yeni Şifre Belirle';
  } else if (type === 'appointment_confirmed') {
    subject = subject || `${shopName} — Randevunuz Onaylandı`;
    headline = headline || 'Randevunuz Onaylanmıştır';
    if (lines.length === 0) {
      lines = [`Merhaba ${recipient}, ${shopName} işletmesindeki randevunuz onaylandı.`];
    }
    ctaText = payload.ctaText || 'Randevu Detayını Gör';
  } else if (type === 'appointment_reminder') {
    subject = subject || `${shopName} — Randevu Hatırlatması`;
    headline = headline || 'Yaklaşan Randevunuz Var';
    if (lines.length === 0) {
      lines = [`Merhaba ${recipient}, ${shopName} işletmesindeki randevunuzu hatırlatmak isteriz.`];
    }
    ctaText = payload.ctaText || 'Detayları Görüntüle';
  } else if (type === 'daily_summary') {
    subject = subject || `${shopName} — Sabah 09:00 İşletme Özeti`;
    headline = headline || `${shopName} Günlük Özeti`;
    if (lines.length === 0) {
      lines = [`Günaydın ${recipient}! Bugünkü randevu, vade ve bakım takviminizin özeti aşağıdadır.`];
    }
    ctaText = payload.ctaText || 'Günlük Paneli Aç';
  }

  const detailsRows = details
    .map(
      (d) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;font-weight:600;">${escapeHtml(
          d.label
        )}</td><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:700;text-align:right;">${escapeHtml(
          d.value
        )}</td></tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1c1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fafaf9;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e7e5e4;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="background-color:#FF6B00;padding:20px 24px;color:#ffffff;">
              <div style="font-size:18px;font-weight:800;letter-spacing:-0.3px;">Dükkânım Yanımda</div>
              <div style="font-size:12px;opacity:0.92;margin-top:2px;">${escapeHtml(shopName)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;color:#1c1917;">${escapeHtml(headline)}</h1>
              ${lines
                .map(
                  (line) =>
                    `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#44403c;">${escapeHtml(
                      line
                    )}</p>`
                )
                .join('')}
              ${
                detailsRows
                  ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;border:1px solid #e7e5e4;border-radius:10px;border-collapse:collapse;">${detailsRows}</table>`
                  : ''
              }
              <div style="margin:22px 0 8px 0;">
                <a href="${escapeHtml(
                  actionUrl
                )}" style="display:inline-block;background-color:#FF6B00;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;">${escapeHtml(
    ctaText
  )}</a>
              </div>
              <p style="margin:14px 0 0 0;font-size:11px;color:#78716c;word-break:break-all;">
                Bağlantı çalışmazsa kopyalayın: ${escapeHtml(actionUrl)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafaf9;padding:14px 24px;border-top:1px solid #e7e5e4;font-size:11px;color:#78716c;">
              ${
                type === 'appointment_confirmed' || type === 'appointment_reminder'
                  ? 'Bu randevu bilgilendirmesi <strong>Dükkânım Yanımda</strong> üzerinden gönderilmiştir. İletişim: <a href="mailto:randevu@dukkanimyanimda.com.tr" style="color:#ea580c;text-decoration:none;font-weight:600;">randevu@dukkanimyanimda.com.tr</a>'
                  : 'Bu bilgilendirme e-postası <strong>Dükkânım Yanımda</strong> tarafından işlem güvenliği ve günlük işletme bildirimi amacıyla gönderilmiştir. Destek: <a href="mailto:support@dukkanimyanimda.com.tr" style="color:#ea580c;text-decoration:none;font-weight:600;">support@dukkanimyanimda.com.tr</a>'
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const detailsText = details.map((d) => `- ${d.label}: ${d.value}`).join('\n');
  const text = [
    `Dükkânım Yanımda — ${shopName}`,
    '',
    headline,
    '',
    ...lines,
    ...(detailsText ? ['', detailsText] : []),
    '',
    `${ctaText}: ${actionUrl}`,
  ].join('\n');

  return { subject, html, text };
}

async function dispatchOutboundEmail(payload) {
  const to = String(payload.to || '').trim().toLowerCase();
  if (!to || !to.includes('@')) {
    return { sent: false, provider: 'invalid_email', error: 'Geçersiz alıcı e-posta adresi.' };
  }

  let effectivePayload = { ...payload };
  if (effectivePayload.useFirebaseResetLink && !effectivePayload.actionUrl && !effectivePayload.resetUrl) {
    try {
      const link = await admin.auth().generatePasswordResetLink(to);
      effectivePayload.actionUrl = link;
      effectivePayload.resetUrl = link;
    } catch (err) {
      console.warn('[dispatchOutboundEmail] generatePasswordResetLink atlandı:', err?.message || err);
    }
  }

  const { subject, html, text } = renderBrandedEmailHtml(effectivePayload);
  const isAppointmentMail =
    effectivePayload.type === 'appointment_confirmed' || effectivePayload.type === 'appointment_reminder';
  const fromEmail = (
    effectivePayload.fromEmail ||
    (isAppointmentMail
      ? process.env.APPOINTMENT_EMAIL_FROM ||
        process.env.EMAIL_FROM ||
        process.env.SMTP_FROM ||
        'Dükkanım Yanımda Randevu <randevu@dukkanimyanimda.com.tr>'
      : process.env.EMAIL_FROM ||
        process.env.SMTP_FROM ||
        'Dükkanım Yanımda Randevu <randevu@dukkanimyanimda.com.tr>')
  ).trim();

  // 1. Resend API
  if (process.env.RESEND_API_KEY) {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return {
      sent: resp.ok,
      provider: 'resend',
      error: resp.ok ? undefined : `Resend HTTP ${resp.status}`,
    };
  }

  // 2. SendGrid API
  if (process.env.SENDGRID_API_KEY) {
    const cleanFrom = fromEmail.match(/<([^>]+)>/)?.[1] || fromEmail;
    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: cleanFrom, name: 'Dükkânım Yanımda' },
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    return {
      sent: resp.ok,
      provider: 'sendgrid',
      error: resp.ok ? undefined : `SendGrid HTTP ${resp.status}`,
    };
  }

  // 3. SMTP (Nodemailer lazy-load)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = getNodemailer();
    if (nodemailer) {
      const port = Number(process.env.SMTP_PORT || 587);
      const host = process.env.SMTP_HOST.trim();
      const user = process.env.SMTP_USER.trim();
      const rawPass = String(process.env.SMTP_PASS || '');
      const pass =
        host.toLowerCase().includes('gmail.com') || host.toLowerCase().includes('googlemail.com')
          ? rawPass.replace(/\s+/g, '')
          : rawPass;
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      });

      await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        text,
        html,
      });
      return { sent: true, provider: 'smtp' };
    }
  }

  return {
    sent: false,
    queued: true,
    provider: 'email_unconfigured',
    error: 'RESEND_API_KEY, SENDGRID_API_KEY veya SMTP yapılandırılmadı.',
  };
}

async function dispatchMultiChannelNotification(payload) {
  const results = {
    sms: null,
    email: null,
    push: null,
  };

  if (payload.phone && payload.message) {
    results.sms = await dispatchOutboundSms({
      phone: payload.phone,
      message: payload.message,
      category: payload.category || 'event_notification',
      shopName: payload.shopName || 'Dükkanım Yanımda',
    }).catch((err) => ({ sent: false, provider: 'sms_error', error: err.message }));
  }

  if (payload.email) {
    results.email = await dispatchOutboundEmail({
      to: payload.email,
      subject: payload.emailSubject || payload.title || 'Dükkânım Yanımda Bildirimi',
      type: payload.emailType || 'appointment_confirmed',
      shopName: payload.shopName || 'Dükkanım Yanımda',
      recipientName: payload.recipientName,
      bodyLines: payload.message ? [payload.message] : undefined,
      actionUrl: payload.actionUrl,
      details: payload.details,
    }).catch((err) => ({ sent: false, provider: 'email_error', error: err.message }));
  }

  if (payload.fcmToken && (payload.title || payload.message)) {
    try {
      await admin.messaging().send({
        token: String(payload.fcmToken),
        notification: {
          title: String(payload.title || payload.shopName || 'Dükkânım Yanımda'),
          body: String(payload.message || '').slice(0, 180),
        },
        data: {
          category: String(payload.category || 'notification'),
          url: String(payload.url || '/'),
        },
      });
      results.push = { sent: true, provider: 'fcm_admin' };
    } catch (err) {
      results.push = { sent: false, provider: 'fcm_admin', error: err?.message || 'Push gönderilemedi' };
    }
  }

  await db.collection('notification_logs').add({
    accountId: payload.accountId || null,
    category: payload.category || 'event_notification',
    shopName: payload.shopName || 'Dükkanım Yanımda',
    channels: {
      sms: results.sms ? Boolean(results.sms.sent) : false,
      email: results.email ? Boolean(results.email.sent) : false,
      push: results.push ? Boolean(results.push.sent) : false,
    },
    results,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }).catch(() => {});

  return results;
}

/**
 * 1. HTTP Function: VPS backend veya panel hatırlatma SMS/Push gönderimi
 */
exports.sendReminderSms = onRequest({ cors: false }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAuthorizedSecret(req)) {
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
exports.processSmsQueueDoc = onDocumentCreated(
  { document: 'sms_queue/{docId}', database: FIRESTORE_DATABASE_ID },
  async (event) => {
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
 * 3. HTTP Function: Özelleştirilmiş Kurumsal HTML E-posta Gönderimi (Resend / SendGrid / SMTP)
 */
exports.sendBrandedEmail = onRequest({ cors: false }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAuthorizedSecret(req)) {
    res.status(403).json({ error: 'Yetkisiz Firebase E-posta Functions çağrısı.' });
    return;
  }

  try {
    const result = await dispatchOutboundEmail(req.body || {});
    await db.collection('email_logs').add({
      to: String(req.body?.to || '').toLowerCase(),
      type: req.body?.type || 'welcome',
      shopName: req.body?.shopName || 'Dükkanım Yanımda',
      provider: result.provider,
      sent: Boolean(result.sent),
      error: result.error || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});

    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[sendBrandedEmail] Hata:', err);
    res.status(500).json({ sent: false, error: err.message || 'E-posta gönderim hatası' });
  }
});

/**
 * 4. Firestore Trigger: `email_queue/{docId}` belgesi eklendiğinde kurumsal HTML e-posta gönderir
 */
exports.processEmailQueueDoc = onDocumentCreated(
  { document: 'email_queue/{docId}', database: FIRESTORE_DATABASE_ID },
  async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data() || {};
  if (data.status && data.status !== 'pending') return;

  try {
    const result = await dispatchOutboundEmail(data);
    await snap.ref.update({
      status: result.sent ? 'sent' : 'logged_only',
      provider: result.provider,
      error: result.error || null,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[processEmailQueueDoc] Hata:', err);
    await snap.ref.update({
      status: 'failed',
      error: err?.message || 'E-posta kuyruk hatası',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
  }
});

/**
 * 5. HTTP Function: Çoklu Kanal İşlem/Olay Bildirimi (SMS + Email + FCM Push + notification_logs)
 */
exports.sendTransactionalNotification = onRequest({ cors: false }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAuthorizedSecret(req)) {
    res.status(403).json({ error: 'Yetkisiz bildirim fonksiyonu çağrısı.' });
    return;
  }

  try {
    const results = await dispatchMultiChannelNotification(req.body || {});
    res.status(200).json({ success: true, results });
  } catch (err) {
    console.error('[sendTransactionalNotification] Hata:', err);
    res.status(500).json({ success: false, error: err.message || 'Bildirim hatası' });
  }
});

/**
 * 6. Firestore Trigger: `notification_queue/{docId}` çoklu kanal kuyruğu
 */
exports.processNotificationQueueDoc = onDocumentCreated(
  { document: 'notification_queue/{docId}', database: FIRESTORE_DATABASE_ID },
  async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data() || {};
  if (data.status && data.status !== 'pending') return;

  try {
    const results = await dispatchMultiChannelNotification(data);
    await snap.ref.update({
      status: 'processed',
      results,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[processNotificationQueueDoc] Hata:', err);
    await snap.ref.update({
      status: 'failed',
      error: err?.message || 'Bildirim kuyruğu hatası',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
  }
});

/**
 * 7. Zamanlanmış Tarayıcı: Her 15 dakikada bir VPS hatırlatma döngüsünü tetikler (Blaze Cloud Scheduler)
 */
exports.scheduledReminderCron = onSchedule(
  { schedule: 'every 15 minutes', timeZone: 'Europe/Istanbul' },
  async () => {
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
  }
);

/**
 * 8. Günlük Sabah 09:00 Cron: Randevu, Vade & Makine Bakım Hatırlatma Özeti
 */
exports.dailyMorningCron = onSchedule(
  { schedule: '0 9 * * *', timeZone: 'Europe/Istanbul' },
  async () => {
    const baseUrl = (process.env.APP_BASE_URL || 'https://dukkanimyanimda.com.tr').replace(/\/+$/, '');
    const secret = (process.env.FIREBASE_FUNCTIONS_SECRET || process.env.WEBHOOK_SECRET || '').trim();

    let ok = false;
    let statusCode = 0;
    let payload = null;
    let errorMsg = null;

    try {
      const resp = await fetch(`${baseUrl}/api/cron/firebase-daily-09`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'x-firebase-secret': secret } : {}),
        },
        body: JSON.stringify({ source: 'firebase_daily_morning_cron' }),
        signal: AbortSignal.timeout(15000),
      });
      statusCode = resp.status;
      ok = resp.ok;
      payload = await resp.json().catch(() => null);
      if (!resp.ok) {
        errorMsg = `HTTP ${resp.status}`;
        console.error(`[dailyMorningCron] Sunucu HTTP ${resp.status} döndü`);
      }
    } catch (err) {
      errorMsg = err?.message || 'Tetikleme hatası';
      console.error('[dailyMorningCron] Tetikleme hatası:', err);
    }

    await db.collection('daily_cron_runs').add({
      job: 'dailyMorningCron',
      ok,
      statusCode,
      payload,
      error: errorMsg,
      ranAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
  }
);
