import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  type AppCheck,
} from 'firebase/app-check';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  type ConfirmationResult,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyAU2Zx5J6Df1VSUEdbEvNSfpFxio1pULCQ",
  authDomain: "dukkanim-yanimda.firebaseapp.com",
  projectId: "dukkanim-yanimda",
  storageBucket: "dukkanim-yanimda.firebasestorage.app",
  messagingSenderId: "403857948982",
  appId: "1:403857948982:web:43381cfd3bd8ce39f17397",
  measurementId: "G-D0M0XT9PC5"
};

// Uygulama yeniden render edildiğinde çift initialize olmasını önle
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// SMS ve e-posta onay mesajlarının Türkçe gitmesi için varsayılan dili ayarla
auth.languageCode = 'tr';

let appCheckInstance: AppCheck | null = null;
let appCheckInitPromise: Promise<AppCheck | null> | null = null;

/**
 * Firebase App Check (reCAPTCHA v3) korumasını başlatır.
 * Site key önce Vite env'den, yoksa backend `/api/auth/firebase-status` ucundan alınır.
 * Site key tanımlı değilse uygulama çökmeden sessizce hazır modda bekler.
 */
export async function initFirebaseAppCheck(): Promise<AppCheck | null> {
  if (typeof window === 'undefined') return null;
  if (appCheckInstance) return appCheckInstance;
  if (appCheckInitPromise) return appCheckInitPromise;

  appCheckInitPromise = (async () => {
    try {
      let siteKey = String((import.meta as any).env?.VITE_FIREBASE_APP_CHECK_SITE_KEY || '').trim();
      if (!siteKey) {
        const res = await fetch('/api/auth/firebase-status').catch(() => null);
        if (res && res.ok) {
          const json = await res.json().catch(() => null);
          siteKey = String(json?.appCheckSiteKey || '').trim();
        }
      }

      if (!siteKey) {
        appCheckInitPromise = null;
        return null;
      }

      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      return appCheckInstance;
    } catch {
      appCheckInitPromise = null;
      return null;
    }
  })();

  return appCheckInitPromise;
}

export async function getFirebaseAppCheckToken(forceRefresh = false): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const instance = appCheckInstance || (await initFirebaseAppCheck());
    if (!instance) return null;
    const res = await getToken(instance, forceRefresh);
    return res?.token || null;
  } catch {
    return null;
  }
}

export async function fetchWithAppCheck(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = await getFirebaseAppCheckToken(false).catch(() => null);
  const headers = new Headers(init?.headers || undefined);
  if (token && !headers.has('X-Firebase-AppCheck')) {
    headers.set('X-Firebase-AppCheck', token);
  }
  return fetch(input, {
    ...init,
    headers,
  });
}

const recaptchaRegistry = new Map<string, RecaptchaVerifier>();

export function formatTurkishE164Phone(rawPhone: string): string {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('905')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('05')) return `+90${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('5')) return `+90${digits}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

export function translateFirebaseError(err: any): string {
  const code = String(err?.code || '');
  const msg = String(err?.message || '');

  if (code === 'auth/billing-not-enabled' || msg.includes('BILLING_NOT_ENABLED')) {
    return 'Firebase projenizde henüz Blaze (Harcadıkça Öde) faturalandırması aktif değil. Firebase Console üzerinden Blaze paketine geçince gerçek SMS gönderimi otomatik açılır.';
  }
  if (code === 'auth/unauthorized-domain' || msg.includes('UNAUTHORIZED_DOMAIN')) {
    return 'Bu alan adı Firebase Console -> Authentication -> Settings -> Authorized Domains listesinde tanımlı değil.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Bu doğrulama yöntemi Firebase Authentication Sign-in Providers ekranında henüz etkinleştirilmemiş.';
  }
  if (code === 'auth/quota-exceeded') {
    return 'Günlük Firebase SMS kotası aşıldı. WhatsApp veya e-posta doğrulamasını kullanabilirsiniz.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Çok fazla deneme yapıldı. Güvenliğiniz için kısa bir süre bekleyip tekrar deneyiniz.';
  }
  if (code === 'auth/invalid-phone-number') {
    return 'Geçersiz telefon numarası formatı (Örn: 05XXXXXXXXX).';
  }
  if (code === 'auth/captcha-check-failed') {
    return 'Güvenlik doğrulaması (reCAPTCHA) tamamlanamadı. Lütfen sayfayı yenileyip tekrar deneyiniz.';
  }
  if (code === 'auth/invalid-verification-code') {
    return 'Girdiğiniz 6 haneli SMS onay kodu hatalı.';
  }
  if (code === 'auth/code-expired') {
    return 'SMS onay kodunun süresi dolmuş. Lütfen yeni kod isteyiniz.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Firebase sunucularına bağlanırken ağ hatası oluştu. İnternet bağlantınızı kontrol ediniz.';
  }
  return msg || 'Firebase doğrulama işlemi tamamlanamadı.';
}

export function resetRecaptchaVerifier(containerId?: string): void {
  if (containerId) {
    const existing = recaptchaRegistry.get(containerId);
    if (existing) {
      try {
        existing.clear();
      } catch {
        // ignore clear error
      }
      recaptchaRegistry.delete(containerId);
    }
    const el = typeof document !== 'undefined' ? document.getElementById(containerId) : null;
    if (el) el.innerHTML = '';
    return;
  }

  for (const [id, verifier] of recaptchaRegistry.entries()) {
    try {
      verifier.clear();
    } catch {
      // ignore
    }
    const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (el) el.innerHTML = '';
  }
  recaptchaRegistry.clear();
}

/**
 * Her denemede temiz reCAPTCHA yaşam döngüsü ile Firebase Phone Auth SMS OTP gönderir.
 */
export async function sendFirebasePhoneOtp(
  rawPhone: string,
  containerId: string,
  onExpired?: () => void
): Promise<{ confirmationResult: ConfirmationResult; e164Phone: string }> {
  const e164Phone = formatTurkishE164Phone(rawPhone);
  resetRecaptchaVerifier(containerId);

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      resetRecaptchaVerifier(containerId);
      onExpired?.();
    },
  });
  recaptchaRegistry.set(containerId, verifier);

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, e164Phone, verifier);
    return { confirmationResult, e164Phone };
  } catch (err) {
    resetRecaptchaVerifier(containerId);
    throw err;
  }
}

export async function confirmFirebasePhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<{ idToken: string; uid: string; phoneNumber: string | null }> {
  const credential = await confirmationResult.confirm(String(code || '').trim());
  const idToken = await credential.user.getIdToken();
  return {
    idToken,
    uid: credential.user.uid,
    phoneNumber: credential.user.phoneNumber,
  };
}

/**
 * Şifre sıfırlama için Firebase E-posta Doğrulama Bağlantısı (Email Link) gönderir.
 */
export async function sendFirebaseRecoveryEmailLink(email: string, phone?: string): Promise<void> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dukkanimyanimda.com.tr';
  const cleanEmail = String(email || '').trim().toLowerCase();
  const redirectUrl = `${origin}/?recoveryEmail=${encodeURIComponent(cleanEmail)}${phone ? `&recoveryPhone=${encodeURIComponent(phone)}` : ''}`;

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dukkanim_email_recovery_pending', JSON.stringify({ email: cleanEmail, phone: phone || '' }));
    }
  } catch {
    // ignore storage quota errors
  }

  await sendSignInLinkToEmail(auth, cleanEmail, {
    url: redirectUrl,
    handleCodeInApp: true,
  });
}

export async function completeFirebaseRecoveryEmailLink(): Promise<{
  matched: boolean;
  email?: string;
  phone?: string;
  idToken?: string;
}> {
  if (typeof window === 'undefined') return { matched: false };
  const href = window.location.href;
  if (!isSignInWithEmailLink(auth, href)) return { matched: false };

  const params = new URLSearchParams(window.location.search);
  let storedEmail = params.get('recoveryEmail') || '';
  let storedPhone = params.get('recoveryPhone') || '';
  try {
    const raw = localStorage.getItem('dukkanim_email_recovery_pending');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!storedEmail) storedEmail = parsed.email || '';
      if (!storedPhone) storedPhone = parsed.phone || '';
    }
  } catch {
    // ignore
  }

  if (!storedEmail) return { matched: false };
  const result = await signInWithEmailLink(auth, storedEmail, href);
  const idToken = await result.user.getIdToken();
  try {
    localStorage.removeItem('dukkanim_email_recovery_pending');
  } catch {}
  return {
    matched: true,
    email: result.user.email || storedEmail,
    phone: storedPhone || undefined,
    idToken,
  };
}

/**
 * Tarayıcıda Firebase Analytics başlatır (desteklenmiyorsa sessizce atlar).
 */
export async function initFirebaseAnalytics(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const { isSupported, getAnalytics } = await import('firebase/analytics');
    if (await isSupported()) {
      getAnalytics(app);
    }
  } catch {
    // analytics engelliyse uygulamayı bozma
  }
}

let lastRegisteredFcmToken: string | null = null;
let messagingListenerAttached = false;

/**
 * Firebase Cloud Messaging (Web Push) jetonu alır ve backend `/api/devices/register` ucuyla kaydeder.
 * Scope çakışmasını önlemek için mevcut kök `/sw.js` Service Worker kaydını kullanır.
 */
export async function registerFirebaseWebPush(options?: {
  askPermission?: boolean;
  onForegroundMessage?: (payload: { title?: string; body?: string; url?: string }) => void;
}): Promise<{ ok: boolean; permission: string; token?: string; reason?: string }> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return { ok: false, permission: 'unsupported', reason: 'Tarayıcı Web Push desteklemiyor.' };
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default' && options?.askPermission) {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      return { ok: false, permission, reason: 'Bildirim izni henüz verilmedi.' };
    }

    const { isSupported, getMessaging, getToken: getFcmToken, onMessage } = await import('firebase/messaging');
    if (!(await isSupported())) {
      return { ok: false, permission, reason: 'Tarayıcı FCM Push API desteklemiyor.' };
    }

    let vapidKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY || '';
    if (!vapidKey) {
      const cfgRes = await fetch('/api/devices/push-config').catch(() => null);
      if (cfgRes && cfgRes.ok) {
        const cfg = await cfgRes.json().catch(() => null);
        vapidKey = cfg?.vapidPublicKey || '';
      }
    }

    if (!vapidKey) {
      return {
        ok: false,
        permission,
        reason: 'Firebase Console Web Push VAPID anahtarı (.env VITE_FIREBASE_VAPID_KEY) henüz tanımlanmadı.',
      };
    }

    let swReg: ServiceWorkerRegistration | undefined;
    try {
      swReg = (await navigator.serviceWorker.getRegistration('/')) || (await navigator.serviceWorker.register('/sw.js'));
    } catch {
      swReg = await navigator.serviceWorker.ready.catch(() => undefined);
    }

    const messaging = getMessaging(app);
    if (options?.onForegroundMessage && !messagingListenerAttached) {
      messagingListenerAttached = true;
      onMessage(messaging, (payload) => {
        options.onForegroundMessage?.({
          title: payload.notification?.title || payload.data?.title || 'Dükkânım Yanımda',
          body: payload.notification?.body || payload.data?.body || '',
          url: payload.data?.url || '/',
        });
      });
    }

    const fcmToken = await getFcmToken(messaging, {
      vapidKey,
      ...(swReg ? { serviceWorkerRegistration: swReg } : {}),
    });

    if (!fcmToken) {
      return { ok: false, permission, reason: 'FCM bildirim jetonu alınamadı.' };
    }

    const regRes = await fetch('/api/devices/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: fcmToken,
        platform: 'web',
        deviceName: navigator.userAgent.slice(0, 80),
      }),
    });

    if (!regRes.ok) {
      return { ok: false, permission, reason: `Cihaz sunucuya kaydedilemedi (HTTP ${regRes.status}).` };
    }

    lastRegisteredFcmToken = fcmToken;
    return { ok: true, permission, token: fcmToken };
  } catch (err: any) {
    return {
      ok: false,
      permission: Notification.permission,
      reason: err?.message || 'Push kaydı başarısız.',
    };
  }
}

export async function unregisterFirebaseWebPush(): Promise<void> {
  const token = lastRegisteredFcmToken;
  lastRegisteredFcmToken = null;
  if (!token) return;
  try {
    await fetch('/api/devices/unregister', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch {
    // ignore cleanup error on logout
  }
}
