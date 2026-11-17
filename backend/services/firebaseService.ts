import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DATA_DIR } from '../config';
import type { AppState, MaintenanceAsset } from '../../shared/types';

export const FIREBASE_PROJECT_ID =
  (process.env.FIREBASE_PROJECT_ID || 'dukkanim-yanimda').trim();

export const FIREBASE_PROJECT_NUMBER =
  (process.env.FIREBASE_PROJECT_NUMBER || '403857948982').trim();

export const FIREBASE_WEB_API_KEY =
  (process.env.FIREBASE_API_KEY || 'AIzaSyAU2Zx5J6Df1VSUEdbEvNSfpFxio1pULCQ').trim();

export const APP_CHECK_JWKS_URL = 'https://firebaseappcheck.googleapis.com/v1/jwks';
const APP_CHECK_JWKS_TTL_MS = 60 * 60 * 1000; // 1 saat

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

export interface FirebaseAppCheckVerifyResult {
  valid: boolean;
  appId?: string;
  exp?: number;
  iss?: string;
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
  firestoreDatabaseId: string;
  vapidKeyConfigured: boolean;
  appCheckConfigured: boolean;
  appCheckEnforced: boolean;
  appCheckSiteKey: string;
  appCheckProvider: 'enterprise' | 'v3';
  storageReady: boolean;
  storageBucket: string;
  customEmailReady: boolean;
  realtimeDbReady: boolean;
}

let cachedAccessToken: { token: string; expiresAtMs: number; projectId: string } | null = null;
let cachedAppCheckJwks: { keys: Array<Record<string, any>>; fetchedAtMs: number } | null = null;

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLen), 'base64');
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
        'https://www.googleapis.com/auth/devstorage.read_write',
        'https://www.googleapis.com/auth/firebase.database',
        'https://www.googleapis.com/auth/userinfo.email',
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

export function getFirestoreDatabaseId(): string {
  return (process.env.FIREBASE_FIRESTORE_DATABASE_ID || 'default').trim();
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
    const dbId = encodeURIComponent(getFirestoreDatabaseId());
    const url = `https://firestore.googleapis.com/v1/projects/${auth.projectId}/databases/${dbId}/documents/${cleanCollection}/${cleanId}`;

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

// ==============================================================================
// 1. FIREBASE APP CHECK (reCAPTCHA v3) — GERÇEK RS256 JWKS DOĞRULAMA
// ==============================================================================

async function getAppCheckJwks(forceRefresh = false): Promise<Array<Record<string, any>>> {
  const now = Date.now();
  if (
    !forceRefresh &&
    cachedAppCheckJwks &&
    now - cachedAppCheckJwks.fetchedAtMs < APP_CHECK_JWKS_TTL_MS &&
    cachedAppCheckJwks.keys.length > 0
  ) {
    return cachedAppCheckJwks.keys;
  }

  const resp = await fetch(APP_CHECK_JWKS_URL, {
    method: 'GET',
    signal: AbortSignal.timeout(8000),
  });
  if (!resp.ok) {
    throw new Error(`App Check JWKS HTTP ${resp.status}`);
  }
  const json = (await resp.json().catch(() => null)) as { keys?: Array<Record<string, any>> } | null;
  const keys = Array.isArray(json?.keys) ? json!.keys : [];
  if (keys.length === 0) {
    throw new Error('App Check JWKS anahtar listesi boş.');
  }
  cachedAppCheckJwks = { keys, fetchedAtMs: now };
  return keys;
}

/**
 * Firebase App Check JWT jetonunu Google'ın resmi JWKS uç noktası üzerinden
 * RS256 imza ve iss / aud / exp alanlarıyla doğrular.
 */
export async function verifyFirebaseAppCheckToken(
  token: string,
  options?: { jwksOverride?: Array<Record<string, any>>; nowSec?: number }
): Promise<FirebaseAppCheckVerifyResult> {
  const clean = String(token || '').trim();
  if (!clean) {
    return { valid: false, error: 'App Check jetonu boş.' };
  }

  const parts = clean.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return { valid: false, error: 'Geçersiz App Check JWT biçimi.' };
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]).toString('utf-8')) as {
      alg?: string;
      kid?: string;
      typ?: string;
    };
    if (header.alg !== 'RS256' || !header.kid) {
      return { valid: false, error: 'Desteklenmeyen App Check imzalama algoritması veya eksik kid.' };
    }

    let keys = options?.jwksOverride;
    if (!keys) {
      keys = await getAppCheckJwks(false);
    }
    let jwk = keys.find((k) => k?.kid === header.kid);
    if (!jwk && !options?.jwksOverride) {
      keys = await getAppCheckJwks(true);
      jwk = keys.find((k) => k?.kid === header.kid);
    }
    if (!jwk) {
      return { valid: false, error: 'Eşleşen App Check genel anahtarı (JWK) bulunamadı.' };
    }

    const publicKey = crypto.createPublicKey({
      key: jwk as unknown as crypto.JsonWebKey,
      format: 'jwk',
    });
    const signedContent = Buffer.from(`${parts[0]}.${parts[1]}`, 'utf-8');
    const signatureBytes = base64UrlDecode(parts[2]);
    const sigOk = crypto.verify('RSA-SHA256', signedContent, publicKey, signatureBytes);
    if (!sigOk) {
      return { valid: false, error: 'App Check RS256 imzası doğrulanamadı.' };
    }

    const payload = JSON.parse(base64UrlDecode(parts[1]).toString('utf-8')) as {
      iss?: string;
      aud?: string | string[];
      exp?: number;
      sub?: string;
      app_id?: string;
    };

    const expectedIss = `https://firebaseappcheck.googleapis.com/${FIREBASE_PROJECT_NUMBER}`;
    if (payload.iss !== expectedIss) {
      return { valid: false, error: 'App Check token yayıncısı (iss) bu proje ile eşleşmiyor.' };
    }

    const expectedAud = `projects/${FIREBASE_PROJECT_NUMBER}`;
    const audList = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
    if (!audList.includes(expectedAud)) {
      return { valid: false, error: 'App Check token hedef kitlesi (aud) geçersiz.' };
    }

    const nowSec = typeof options?.nowSec === 'number' ? options.nowSec : Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
      return { valid: false, error: 'App Check jetonunun süresi dolmuş.' };
    }

    return {
      valid: true,
      appId: payload.sub || payload.app_id,
      exp: payload.exp,
      iss: payload.iss,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err?.message || 'App Check doğrulaması başarısız.',
    };
  }
}

// ==============================================================================
// 2. FIREBASE CLOUD STORAGE & REALTIME DATABASE YARDIMCILARI
// ==============================================================================

export function getFirebaseStorageBucket(): string {
  return (process.env.FIREBASE_STORAGE_BUCKET || `${FIREBASE_PROJECT_ID}.firebasestorage.app`).trim();
}

export async function uploadToFirebaseStorage(
  objectPath: string,
  buffer: Buffer,
  contentType: string
): Promise<{ ok: boolean; skipped?: boolean; bucket?: string; objectPath?: string; error?: string }> {
  try {
    const auth = await getFirebaseAccessToken();
    if (!auth) {
      return { ok: false, skipped: true, error: 'Firebase Service Account yapılandırılmadı.' };
    }

    const bucket = getFirebaseStorageBucket();
    const cleanPath = objectPath.replace(/^\/+/, '');
    const url = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(
      bucket
    )}/o?uploadType=media&name=${encodeURIComponent(cleanPath)}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': contentType || 'application/octet-stream',
      },
      body: new Uint8Array(buffer),
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      return { ok: false, error: `Storage upload HTTP ${resp.status}: ${txt.slice(0, 120)}` };
    }
    return { ok: true, bucket, objectPath: cleanPath };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Firebase Storage yükleme hatası.' };
  }
}

export async function downloadFromFirebaseStorage(
  objectPath: string
): Promise<{ ok: boolean; skipped?: boolean; buffer?: Buffer; contentType?: string; error?: string }> {
  try {
    const auth = await getFirebaseAccessToken();
    if (!auth) {
      return { ok: false, skipped: true, error: 'Firebase Service Account yapılandırılmadı.' };
    }

    const bucket = getFirebaseStorageBucket();
    const cleanPath = objectPath.replace(/^\/+/, '');
    const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(
      bucket
    )}/o/${encodeURIComponent(cleanPath)}?alt=media`;

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!resp.ok) {
      return { ok: false, error: `Storage download HTTP ${resp.status}` };
    }

    const arrayBuf = await resp.arrayBuffer();
    return {
      ok: true,
      buffer: Buffer.from(arrayBuf),
      contentType: resp.headers.get('content-type') || undefined,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Firebase Storage indirme hatası.' };
  }
}

export async function deleteFromFirebaseStorage(
  objectPath: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  try {
    const auth = await getFirebaseAccessToken();
    if (!auth) {
      return { ok: false, skipped: true, error: 'Firebase Service Account yapılandırılmadı.' };
    }

    const bucket = getFirebaseStorageBucket();
    const cleanPath = objectPath.replace(/^\/+/, '');
    const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(
      bucket
    )}/o/${encodeURIComponent(cleanPath)}`;

    const resp = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok && resp.status !== 404) {
      return { ok: false, error: `Storage delete HTTP ${resp.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Firebase Storage silme hatası.' };
  }
}

export async function writeRealtimeDbPulse(
  rtdbPath: string,
  payload: unknown
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  try {
    const dbUrl = (process.env.FIREBASE_DATABASE_URL || '').trim().replace(/\/+$/, '');
    if (!dbUrl) {
      return { ok: false, skipped: true, error: 'FIREBASE_DATABASE_URL tanımlı değil.' };
    }

    const auth = await getFirebaseAccessToken();
    if (!auth) {
      return { ok: false, skipped: true, error: 'Firebase Service Account yapılandırılmadı.' };
    }

    const cleanPath = rtdbPath.replace(/^\/+|\/+$/g, '').replace(/\.json$/i, '');
    const url = `${dbUrl}/${cleanPath}.json`;
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    if (!resp.ok) {
      return { ok: false, error: `RTDB HTTP ${resp.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Realtime Database yazma hatası.' };
  }
}

// ==============================================================================
// 3. YÜKSEK KAPASİTELİ FIRESTORE BULUT SENKRONU (SHOPS & SIFIR-PII PUBLIC ASSETS)
// ==============================================================================

function clampText(val: unknown, maxLen: number): string | undefined {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

function normalizeIsoDateOnly(val: unknown): string | undefined {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed.slice(0, 10);
  return undefined;
}

export async function syncShopSnapshotToFirestore(
  accountId: string,
  shopState: AppState
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!accountId || !loadFirebaseServiceAccount()) {
    return { ok: false, skipped: true, error: 'Service Account tanımlı değil.' };
  }

  const profile = shopState.shopProfile;
  const rawTier = profile?.vipTier;
  const vipTier: 'cirak' | 'usta' | 'patron' =
    rawTier === 'usta' ? 'usta' : rawTier === 'cirak' ? 'cirak' : profile?.isVip ? 'patron' : 'cirak';

  const updatedAt = new Date().toISOString();
  const summaryDoc: Record<string, unknown> = {
    accountId: accountId.slice(0, 128),
    storeName: clampText(profile?.storeName || shopState.storeName, 120) || 'Dükkanım İşletmesi',
    vipTier,
    isVip: Boolean(profile?.isVip),
    updatedAt,
  };

  const bf = clampText(profile?.businessField, 80);
  if (bf) summaryDoc.businessField = bf;
  const sk = clampText(profile?.sectorKey, 60);
  if (sk) summaryDoc.sectorKey = sk;
  const cd = clampText(profile?.cityDistrict, 120);
  if (cd) summaryDoc.cityDistrict = cd;

  const summaryRes = await writeFirestoreDocument('shops', accountId, summaryDoc);
  if (!summaryRes.ok) return summaryRes;

  const serialized = JSON.stringify(shopState);
  const backupDoc: Record<string, unknown> = {
    accountId,
    storeName: summaryDoc.storeName,
    updatedAt,
    customersCount: Array.isArray(shopState.customers) ? shopState.customers.length : 0,
    transactionsCount: Array.isArray(shopState.transactions) ? shopState.transactions.length : 0,
    appointmentsCount: Array.isArray(shopState.appointments) ? shopState.appointments.length : 0,
    maintenanceAssetsCount: Array.isArray(shopState.maintenanceAssets) ? shopState.maintenanceAssets.length : 0,
    ...(serialized.length <= 850_000 ? { snapshotJson: serialized } : { truncated: true }),
  };

  return writeFirestoreDocument(`shops/${accountId}/cloud_backups`, 'latest', backupDoc);
}

/**
 * `public_assets/{code}` belgesini firestore.rules içindeki katı sıfır-PII beyaz listesiyle eşler.
 * Müşteri adı, telefon numarası, seri numarası, adres, accountId veya notlar ASLA yazılmaz.
 */
export function buildSafePublicAssetFirestoreDoc(
  shopName: string,
  asset: MaintenanceAsset,
  extras?: { shopSlug?: string; shopCityDistrict?: string }
): { code: string; doc: Record<string, unknown> } | null {
  const rawCode = String(asset.code || asset.id || '')
    .trim()
    .replace(/[^A-Za-z0-9._-]/g, '');
  if (rawCode.length < 3 || rawCode.length > 64 || !/^[A-Za-z0-9]/.test(rawCode)) {
    return null;
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
  const nextDate = normalizeIsoDateOnly(asset.nextMaintenanceDate);
  let status: 'aktif' | 'bakim_yaklasiyor' | 'bakim_gecikti' = 'aktif';
  if (nextDate) {
    const todayMs = new Date(`${today}T00:00:00Z`).getTime();
    const nextMs = new Date(`${nextDate}T00:00:00Z`).getTime();
    const diffDays = Math.round((nextMs - todayMs) / 86400000);
    if (diffDays < 0) status = 'bakim_gecikti';
    else if (diffDays <= 15) status = 'bakim_yaklasiyor';
  }

  const intervalDays = Math.min(3650, Math.max(1, Math.round(Number(asset.intervalDays) || 90)));
  const logsCount = Math.min(10000, Math.max(0, Array.isArray(asset.logs) ? asset.logs.length : 0));

  const doc: Record<string, unknown> = {
    code: rawCode,
    shopName: clampText(shopName, 120) || 'Teknik Servis',
    deviceName: clampText(asset.deviceName, 120) || 'Cihaz',
    intervalDays,
    status,
    logsCount,
    isPublic: true,
    updatedAt: new Date().toISOString(),
  };

  const shopSlug = clampText(extras?.shopSlug, 120);
  if (shopSlug) doc.shopSlug = shopSlug;
  const shopCityDistrict = clampText(extras?.shopCityDistrict, 120);
  if (shopCityDistrict) doc.shopCityDistrict = shopCityDistrict;
  const brandModel = clampText(asset.brandModel, 120);
  if (brandModel) doc.brandModel = brandModel;

  const lastDate = normalizeIsoDateOnly(asset.lastMaintenanceDate);
  if (lastDate) doc.lastMaintenanceDate = lastDate;
  if (nextDate) doc.nextMaintenanceDate = nextDate;
  const warrantyUntil = normalizeIsoDateOnly(asset.warrantyUntil);
  if (warrantyUntil) doc.warrantyUntil = warrantyUntil;

  return { code: rawCode, doc };
}

export async function syncPublicAssetToFirestore(
  _accountId: string,
  shopName: string,
  asset: MaintenanceAsset,
  extras?: { shopSlug?: string; shopCityDistrict?: string }
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!loadFirebaseServiceAccount()) {
    return { ok: false, skipped: true, error: 'Service Account tanımlı değil.' };
  }
  const built = buildSafePublicAssetFirestoreDoc(shopName, asset, extras);
  if (!built) {
    return { ok: false, error: 'Cihaz kodu Firestore public_assets şemasına uygun değil.' };
  }
  return writeFirestoreDocument('public_assets', built.code, built.doc);
}

// ==============================================================================
// 4. ÖZELLEŞTİRİLMİŞ KURUMSAL E-POSTA GÖNDERİMİ (RESEND / SENDGRID / CLOUD FN)
// ==============================================================================

export type BrandedEmailType =
  | 'welcome'
  | 'password_reset'
  | 'appointment_confirmed'
  | 'appointment_reminder'
  | 'daily_summary';

export interface BrandedEmailPayload {
  to: string;
  subject: string;
  type: BrandedEmailType;
  shopName?: string;
  ownerName?: string;
  recipientName?: string;
  resetUrl?: string;
  actionUrl?: string;
  headline?: string;
  bodyLines?: string[];
  details?: Array<{ label: string; value: string }>;
  ctaText?: string;
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderBackendBrandedEmail(payload: BrandedEmailPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const shopName = payload.shopName || 'Dükkânım Yanımda';
  const recipient = payload.recipientName || payload.ownerName || 'Değerli Esnafımız';
  const actionUrl = payload.resetUrl || payload.actionUrl || 'https://dukkanimyanimda.com.tr/';

  let headline = payload.headline || '';
  let lines = Array.isArray(payload.bodyLines) && payload.bodyLines.length > 0 ? payload.bodyLines : [];
  let ctaText = payload.ctaText || 'Panele Git';

  if (payload.type === 'welcome') {
    headline = headline || `${shopName} Hesabınız Hazır!`;
    if (lines.length === 0) {
      lines = [
        `Merhaba ${recipient}, Dükkânım Yanımda ailesine hoş geldiniz.`,
        '14 günlük ücretsiz Patron VIP denemeniz aktif edildi. Kasa, veresiye, online randevu ve QR menü araçlarınızı hemen kullanmaya başlayabilirsiniz.',
      ];
    }
    ctaText = payload.ctaText || 'Dükkan Panelini Aç';
  } else if (payload.type === 'password_reset') {
    headline = headline || 'Şifre Sıfırlama Talebiniz';
    if (lines.length === 0) {
      lines = [
        `Merhaba ${recipient}, ${shopName} hesabınız için tek kullanımlık şifre sıfırlama bağlantısı oluşturuldu.`,
        'Bu bağlantı güvenlik gereği 15 dakika geçerlidir. Eğer bu işlemi siz başlatmadıysanız bu e-postayı görmezden gelebilirsiniz.',
      ];
    }
    ctaText = payload.ctaText || 'Şifremi Güvenle Yenile';
  } else if (payload.type === 'appointment_confirmed') {
    headline = headline || 'Randevunuz Onaylandı';
    if (lines.length === 0) {
      lines = [`Merhaba ${recipient}, ${shopName} işletmesindeki randevunuz onaylanmıştır.`];
    }
  } else if (payload.type === 'appointment_reminder') {
    headline = headline || 'Randevu Hatırlatması';
    if (lines.length === 0) {
      lines = [`Merhaba ${recipient}, ${shopName} işletmesindeki randevunuzu hatırlatmak isteriz.`];
    }
  } else if (payload.type === 'daily_summary') {
    headline = headline || `${shopName} — Sabah 09:00 İşletme Özeti`;
    if (lines.length === 0) {
      lines = [
        `Günaydın ${recipient}! Bugünkü randevu, vade ve bakım hatırlatmalarınızın sabah özeti aşağıdadır.`,
      ];
    }
    ctaText = payload.ctaText || 'Günlük Paneli Aç';
  }

  const detailsRowsHtml = (payload.details || [])
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
                detailsRowsHtml
                  ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;border:1px solid #e7e5e4;border-radius:10px;border-collapse:collapse;">${detailsRowsHtml}</table>`
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
                Bağlantı açılmazsa tarayıcınıza yapıştırın: ${escapeHtml(actionUrl)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafaf9;padding:14px 24px;border-top:1px solid #e7e5e4;font-size:11px;color:#78716c;">
              Bu bilgilendirme e-postası <strong>Dükkânım Yanımda</strong> platformu tarafından işlem güvenliği ve işletme bildirimi amacıyla gönderilmiştir.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const detailsText = (payload.details || []).map((d) => `- ${d.label}: ${d.value}`).join('\n');
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

  return { subject: payload.subject, html, text };
}

export function isCustomEmailConfigured(): boolean {
  const sa = loadFirebaseServiceAccount();
  return Boolean(
    (process.env.FIREBASE_EMAIL_FUNCTION_URL || '').trim() ||
      (process.env.RESEND_API_KEY || '').trim() ||
      (process.env.SENDGRID_API_KEY || '').trim() ||
      (Boolean(sa) && process.env.FIREBASE_EMAIL_QUEUE_ACTIVE === 'true')
  );
}

export async function dispatchBrandedEmail(payload: BrandedEmailPayload): Promise<{
  sent: boolean;
  queued: boolean;
  provider: string;
  error?: string;
}> {
  const to = String(payload.to || '').trim().toLowerCase();
  if (!to || !to.includes('@')) {
    return { sent: false, queued: false, provider: 'invalid_email', error: 'Geçersiz e-posta adresi.' };
  }

  const fromEmail = (process.env.EMAIL_FROM || 'Dükkanım Yanımda <bilgi@dukkanimyanimda.com.tr>').trim();
  const fnUrl = (process.env.FIREBASE_EMAIL_FUNCTION_URL || '').trim();
  const fnSecret = (process.env.FIREBASE_FUNCTIONS_SECRET || process.env.WEBHOOK_SECRET || '').trim();

  if (fnUrl) {
    try {
      const targetUrl = fnUrl.includes('sendBrandedEmail')
        ? fnUrl
        : `${fnUrl.replace(/\/+$/, '')}/sendBrandedEmail`;
      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fnSecret ? { 'x-firebase-secret': fnSecret } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(9000),
      });
      const json: any = await resp.json().catch(() => ({}));
      const ok = resp.ok && json?.sent !== false;
      return {
        sent: Boolean(ok),
        queued: Boolean(json?.queued),
        provider: json?.provider || 'firebase_email_function',
        error: ok ? undefined : json?.error || `Email Function HTTP ${resp.status}`,
      };
    } catch (err: any) {
      return {
        sent: false,
        queued: false,
        provider: 'firebase_email_function',
        error: err?.message || 'Firebase E-posta Function bağlantısı kurulamadı.',
      };
    }
  }

  const rendered = renderBackendBrandedEmail(payload);

  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        return { sent: true, queued: false, provider: 'resend' };
      }
      const errTxt = await resp.text().catch(() => '');
      return { sent: false, queued: false, provider: 'resend', error: `Resend HTTP ${resp.status}: ${errTxt.slice(0, 120)}` };
    } catch (err: any) {
      return { sent: false, queued: false, provider: 'resend', error: err?.message || 'Resend bağlantı hatası' };
    }
  }

  const sendgridKey = (process.env.SENDGRID_API_KEY || '').trim();
  if (sendgridKey) {
    try {
      const cleanFromAddress = fromEmail.match(/<([^>]+)>/)?.[1] || fromEmail;
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: cleanFromAddress, name: 'Dükkânım Yanımda' },
          subject: rendered.subject,
          content: [
            { type: 'text/plain', value: rendered.text },
            { type: 'text/html', value: rendered.html },
          ],
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        return { sent: true, queued: false, provider: 'sendgrid' };
      }
      return { sent: false, queued: false, provider: 'sendgrid', error: `SendGrid HTTP ${resp.status}` };
    } catch (err: any) {
      return { sent: false, queued: false, provider: 'sendgrid', error: err?.message || 'SendGrid bağlantı hatası' };
    }
  }

  const sa = loadFirebaseServiceAccount();
  if (sa && process.env.FIREBASE_EMAIL_QUEUE_ACTIVE === 'true') {
    const docId = `mail_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const res = await writeFirestoreDocument('email_queue', docId, {
      ...payload,
      to,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    if (res.ok) {
      return { sent: true, queued: true, provider: 'firebase_email_queue' };
    }
    return { sent: false, queued: false, provider: 'firebase_email_queue', error: res.error };
  }

  return {
    sent: false,
    queued: false,
    provider: 'unconfigured',
    error: 'Özel e-posta sağlayıcısı yapılandırılmadı.',
  };
}

export function getFirebaseIntegrationStatus(): FirebaseIntegrationStatus {
  const sa = loadFirebaseServiceAccount();
  const fcmLegacyReady = Boolean((process.env.FCM_SERVER_KEY || '').trim());
  const fnUrl = Boolean((process.env.FIREBASE_SMS_FUNCTION_URL || process.env.FIREBASE_FUNCTIONS_URL || '').trim());
  const vapidConfigured = Boolean((process.env.VITE_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY || '').trim());
  const appCheckSiteKey = (
    process.env.VITE_FIREBASE_APP_CHECK_SITE_KEY ||
    process.env.FIREBASE_APP_CHECK_SITE_KEY ||
    ''
  ).trim();
  const rawAppCheckProvider = (
    process.env.VITE_FIREBASE_APP_CHECK_PROVIDER ||
    process.env.FIREBASE_APP_CHECK_PROVIDER ||
    ''
  )
    .trim()
    .toLowerCase();
  const appCheckProvider: 'enterprise' | 'v3' =
    rawAppCheckProvider === 'v3' ? 'v3' : 'enterprise';
  const rtdbConfigured = Boolean((process.env.FIREBASE_DATABASE_URL || '').trim());

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
    firestoreDatabaseId: getFirestoreDatabaseId(),
    vapidKeyConfigured: vapidConfigured,
    appCheckConfigured: Boolean(appCheckSiteKey),
    appCheckEnforced: process.env.FIREBASE_APP_CHECK_ENFORCE === 'true',
    appCheckSiteKey,
    appCheckProvider,
    storageReady: Boolean(sa),
    storageBucket: getFirebaseStorageBucket(),
    customEmailReady: isCustomEmailConfigured(),
    realtimeDbReady: Boolean(sa && rtdbConfigured),
  };
}
