import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DATA_DIR } from '../config';

export const FIREBASE_PROJECT_ID =
  (process.env.FIREBASE_PROJECT_ID || 'dukkanim-yanimda').trim();

export const FIREBASE_WEB_API_KEY =
  (process.env.FIREBASE_API_KEY || 'AIzaSyAU2Zx5J6Df1VSUEdbEvNSfpFxio1pULCQ').trim();

export interface FirebaseServiceAccount {
  project_id?: string;
  client_email: string;
  private_key: string;
}

export interface FirebaseTokenVerifyResult {
  success: boolean;
  uid?: string;
  phoneNumber?: string;
  email?: string;
  emailVerified?: boolean;
  authTimeSec?: number;
  providerIds?: string[];
  error?: string;
}

export interface FcmPushResult {
  sent: number;
  failed: number;
  simulated: boolean;
  invalidTokens: string[];
  transport: 'fcm_v1' | 'fcm_legacy' | 'unconfigured';
}

export interface FirebaseIntegrationStatus {
  projectId: string;
  blazeMode: boolean;
  phoneAuthReady: boolean;
  emailResetReady: boolean;
  serviceAccountConfigured: boolean;
  fcmV1Ready: boolean;
  fcmLegacyReady: boolean;
  pushReady: boolean;
  functionsSmsReady: boolean;
  firestoreReady: boolean;
  vapidKeyConfigured: boolean;
}

let cachedAccessToken: { token: string; expiresAtMs: number; projectId: string } | null = null;

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/**
 * Env veya `data/firebase-service-account.json` üzerinden Google Service Account JSON yükler.
 * Gizli anahtarlar asla loglanmaz veya API yanıtlarına sızdırılmaz.
 */
export function loadFirebaseServiceAccount(): FirebaseServiceAccount | null {
  const inlineRaw = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  if (inlineRaw) {
    try {
      const jsonText = inlineRaw.startsWith('{')
        ? inlineRaw
        : Buffer.from(inlineRaw, 'base64').toString('utf-8');
      const parsed = JSON.parse(jsonText) as Partial<FirebaseServiceAccount>;
      if (parsed.client_email && parsed.private_key) {
        return {
          project_id: parsed.project_id || FIREBASE_PROJECT_ID,
          client_email: parsed.client_email,
          private_key: parsed.private_key.replace(/\\n/g, '\n'),
        };
      }
    } catch {
      // Hatalı JSON durumunda dosya yoluna düş
    }
  }

  const candidatePaths = [
    (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '').trim(),
    (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim(),
    path.join(DATA_DIR, 'firebase-service-account.json'),
  ].filter(Boolean);

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const parsed = JSON.parse(fs.readFileSync(p, 'utf-8')) as Partial<FirebaseServiceAccount>;
        if (parsed.client_email && parsed.private_key) {
          return {
            project_id: parsed.project_id || FIREBASE_PROJECT_ID,
            client_email: parsed.client_email,
            private_key: parsed.private_key.replace(/\\n/g, '\n'),
          };
        }
      }
    } catch {
      // Sonraki yolu dene
    }
  }

  return null;
}

/**
 * Firebase Service Account ile Google OAuth2 Access Token (FCM v1 + Firestore REST) üretir.
 */
export async function getFirebaseAccessToken(): Promise<{ token: string; projectId: string } | null> {
  const sa = loadFirebaseServiceAccount();
  if (!sa) return null;

  const projectId = sa.project_id || FIREBASE_PROJECT_ID;
  const nowSec = Math.floor(Date.now() / 1000);

  if (
    cachedAccessToken &&
    cachedAccessToken.projectId === projectId &&
    cachedAccessToken.expiresAtMs > Date.now() + 5 * 60 * 1000
  ) {
    return { token: cachedAccessToken.token, projectId };
  }

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSec,
      exp: nowSec + 3600,
      scope: [
        'https://www.googleapis.com/auth/firebase.messaging',
        'https://www.googleapis.com/auth/datastore',
      ].join(' '),
    })
  );

  const unsignedJwt = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  const signature = base64UrlEncode(signer.sign(sa.private_key));
  const assertion = `${unsignedJwt}.${signature}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
    signal: AbortSignal.timeout(8000),
  });

  if (!resp.ok) return null;
  const json = (await resp.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
  } | null;

  if (!json?.access_token) return null;

  const ttlMs = Math.max(60, Number(json.expires_in || 3600)) * 1000;
  cachedAccessToken = {
    token: json.access_token,
    projectId,
    expiresAtMs: Date.now() + ttlMs,
  };
  return { token: json.access_token, projectId };
}

/**
 * Firebase Auth ID Token (Phone Auth SMS OTP / Email / Google) doğrulama.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseTokenVerifyResult> {
  const cleanToken = String(idToken || '').trim();
  if (!cleanToken) {
    return { success: false, error: 'Firebase idToken boş olamaz.' };
  }

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: cleanToken }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const errData: any = await response.json().catch(() => ({}));
      const message = errData?.error?.message || 'Geçersiz veya süresi dolmuş Firebase oturumu.';
      return { success: false, error: message };
    }

    const data: any = await response.json();
    const user = data?.users?.[0];
    if (!user) {
      return { success: false, error: 'Firebase kullanıcı kaydı doğrulanamadı.' };
    }

    const providerIds: string[] = Array.isArray(user.providerUserInfo)
      ? user.providerUserInfo.map((p: any) => String(p?.providerId || '')).filter(Boolean)
      : [];

    let authTimeSec: number | undefined;
    try {
      const parts = cleanToken.split('.');
      if (parts.length === 3) {
        const payloadJson = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'));
        if (typeof payloadJson?.auth_time === 'number') {
          authTimeSec = payloadJson.auth_time;
        }
      }
    } catch {
      // ignore malformed JWT payload decode fallback
    }

    return {
      success: true,
      uid: user.localId,
      phoneNumber: user.phoneNumber || undefined,
      email: user.email || undefined,
      emailVerified: Boolean(user.emailVerified),
      authTimeSec,
      providerIds,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Firebase kimlik doğrulama servisine bağlanılamadı.',
    };
  }
}

/**
 * Firebase Authentication E-posta Şifre Sıfırlama Bağlantısı Gönderimi.
 */
export async function sendFirebaseEmailPasswordReset(
  email: string
): Promise<{ sent: boolean; error?: string }> {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { sent: false, error: 'Geçerli bir e-posta adresi gereklidir.' };
  }

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_WEB_API_KEY}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Firebase-Locale': 'tr',
      },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email: cleanEmail,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      const errData: any = await resp.json().catch(() => ({}));
      return {
        sent: false,
        error: errData?.error?.message || `Firebase e-posta sıfırlama hatası (HTTP ${resp.status})`,
      };
    }

    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message || 'Firebase e-posta servisine ulaşılamadı.' };
  }
}

function toFirestoreValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((item) => toFirestoreValue(item)) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Firestore REST API üzerinden belge yazar (Service Account gerekir).
 */
export async function writeFirestoreDocument(
  collectionPath: string,
  docId: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; docPath?: string; skipped?: boolean; error?: string }> {
  try {
    const auth = await getFirebaseAccessToken();
    if (!auth) {
      return { ok: false, skipped: true, error: 'Firebase Service Account yapılandırılmadı.' };
    }

    const cleanCollection = collectionPath.replace(/^\/+|\/+$/g, '');
    const cleanId = encodeURIComponent(docId);
    const url = `https://firestore.googleapis.com/v1/projects/${auth.projectId}/databases/(default)/documents/${cleanCollection}/${cleanId}`;

    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }

    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ fields }),
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      return { ok: false, error: `Firestore HTTP ${resp.status}: ${txt.slice(0, 120)}` };
    }

    return { ok: true, docPath: `${cleanCollection}/${docId}` };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Firestore yazma hatası' };
  }
}

/**
 * Firebase Cloud Messaging Push (Öncelik: FCM HTTP v1 API -> Yedek: Legacy FCM Server Key).
 */
export async function sendFcmPushMessages(
  tokens: string[],
  notification: { title: string; body: string; url?: string; tag?: string }
): Promise<FcmPushResult> {
  if (!tokens || tokens.length === 0) {
    return { sent: 0, failed: 0, simulated: true, invalidTokens: [], transport: 'unconfigured' };
  }

  let sent = 0;
  let failed = 0;
  const invalidTokens: string[] = [];

  // 1. Modern FCM HTTP v1 API (Service Account OAuth2 JWT)
  const oauth = await getFirebaseAccessToken().catch(() => null);
  if (oauth) {
    const endpoint = `https://fcm.googleapis.com/v1/projects/${oauth.projectId}/messages:send`;
    for (const token of tokens) {
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${oauth.token}`,
          },
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title: notification.title,
                body: notification.body,
              },
              data: {
                url: notification.url || '/',
                tag: notification.tag || 'dukkanim',
                title: notification.title,
                body: notification.body,
              },
              android: {
                priority: 'HIGH',
                notification: {
                  tag: notification.tag || 'dukkanim',
                  icon: 'ic_notification',
                  color: '#f95700',
                },
              },
              webpush: {
                fcm_options: {
                  link: notification.url || '/',
                },
                notification: {
                  icon: '/icon-192.png',
                  badge: '/icon-192.png',
                  tag: notification.tag || 'dukkanim',
                },
              },
            },
          }),
          signal: AbortSignal.timeout(7000),
        });

        if (resp.ok) {
          sent += 1;
        } else {
          failed += 1;
          const errJson: any = await resp.json().catch(() => null);
          const fcmErr = errJson?.error?.details?.[0]?.errorCode || errJson?.error?.status || '';
          if (fcmErr === 'UNREGISTERED' || fcmErr === 'INVALID_ARGUMENT') {
            invalidTokens.push(token);
          }
        }
      } catch {
        failed += 1;
      }
    }
    return { sent, failed, simulated: false, invalidTokens, transport: 'fcm_v1' };
  }

  // 2. Yedek: Legacy FCM API (yalnızca FCM_SERVER_KEY tanımlıysa)
  const fcmServerKey = (process.env.FCM_SERVER_KEY || '').trim();
  if (!fcmServerKey) {
    return { sent: 0, failed: 0, simulated: true, invalidTokens: [], transport: 'unconfigured' };
  }

  for (const token of tokens) {
    try {
      const resp = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${fcmServerKey}`,
        },
        body: JSON.stringify({
          to: token,
          priority: 'high',
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/icon-192.png',
            click_action: notification.url || '/',
            tag: notification.tag || 'dukkanim',
          },
          data: {
            url: notification.url || '/',
            tag: notification.tag || 'dukkanim',
          },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (resp.ok) {
        const json: any = await resp.json().catch(() => null);
        if (json && json.failure === 1 && Array.isArray(json.results)) {
          failed += 1;
          const errCode = json.results[0]?.error;
          if (errCode === 'NotRegistered' || errCode === 'InvalidRegistration') {
            invalidTokens.push(token);
          }
        } else {
          sent += 1;
        }
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return { sent, failed, simulated: false, invalidTokens, transport: 'fcm_legacy' };
}

/**
 * Firebase Blaze Cloud Functions (HTTPS) veya Firestore `sms_queue` üzerinden SMS/bildirim tetikler.
 */
export async function dispatchFirebaseSms(payload: {
  phone: string;
  message: string;
  category?: string;
  shopName?: string;
}): Promise<{
  sent: boolean;
  queued: boolean;
  provider: string;
  error?: string;
  statusCode?: number;
}> {
  const functionUrl = (
    process.env.FIREBASE_SMS_FUNCTION_URL ||
    process.env.FIREBASE_FUNCTIONS_URL ||
    ''
  ).trim();
  const fnSecret = (
    process.env.FIREBASE_FUNCTIONS_SECRET ||
    process.env.WEBHOOK_SECRET ||
    ''
  ).trim();

  if (functionUrl) {
    try {
      const targetUrl = functionUrl.endsWith('/sendReminderSms') || functionUrl.includes('sendReminderSms')
        ? functionUrl
        : `${functionUrl.replace(/\/+$/, '')}/sendReminderSms`;

      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fnSecret ? { 'x-firebase-secret': fnSecret } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      const json: any = await resp.json().catch(() => ({}));
      const ok = resp.ok && json?.sent !== false;
      return {
        sent: Boolean(ok),
        queued: Boolean(json?.queued),
        provider: 'firebase_functions',
        statusCode: resp.status,
        error: ok ? undefined : json?.error || `Firebase Function HTTP ${resp.status}`,
      };
    } catch (err: any) {
      return {
        sent: false,
        queued: false,
        provider: 'firebase_functions',
        error: err?.message || 'Firebase Functions bağlantısı kurulamadı.',
      };
    }
  }

  // Firestore `sms_queue` köprüsü (Blaze onDocumentCreated tetikleyicisi için)
  const sa = loadFirebaseServiceAccount();
  if (sa) {
    const docId = `sms_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const res = await writeFirestoreDocument('sms_queue', docId, {
      phone: payload.phone,
      message: payload.message,
      category: payload.category || 'reminder',
      shopName: payload.shopName || 'Dükkanım Yanımda',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    if (res.ok) {
      const autoActive = process.env.FIREBASE_SMS_QUEUE_ACTIVE === 'true';
      return {
        sent: autoActive,
        queued: true,
        provider: 'firebase_firestore_queue',
      };
    }
    return {
      sent: false,
      queued: false,
      provider: 'firebase_firestore_queue',
      error: res.error,
    };
  }

  return {
    sent: false,
    queued: false,
    provider: 'firebase_unconfigured',
    error: 'Firebase Blaze Function URL veya Service Account yapılandırılmadı.',
  };
}

export function getFirebaseIntegrationStatus(): FirebaseIntegrationStatus {
  const sa = loadFirebaseServiceAccount();
  const fcmLegacyReady = Boolean((process.env.FCM_SERVER_KEY || '').trim());
  const fnUrl = Boolean((process.env.FIREBASE_SMS_FUNCTION_URL || process.env.FIREBASE_FUNCTIONS_URL || '').trim());
  const vapidConfigured = Boolean((process.env.VITE_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY || '').trim());

  return {
    projectId: FIREBASE_PROJECT_ID,
    blazeMode: process.env.FIREBASE_BLAZE_ENABLED === 'true' || fnUrl || Boolean(sa),
    phoneAuthReady: Boolean(FIREBASE_WEB_API_KEY),
    emailResetReady: Boolean(FIREBASE_WEB_API_KEY),
    serviceAccountConfigured: Boolean(sa),
    fcmV1Ready: Boolean(sa),
    fcmLegacyReady,
    pushReady: Boolean(sa || fcmLegacyReady),
    functionsSmsReady: fnUrl || (Boolean(sa) && process.env.FIREBASE_SMS_QUEUE_ACTIVE === 'true'),
    firestoreReady: Boolean(sa),
    vapidKeyConfigured: vapidConfigured,
  };
}
