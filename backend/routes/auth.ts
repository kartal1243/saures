import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import { DATA_DIR } from '../config';
import { readJsonFile, writeJsonFile } from '../fsdb';
import { rateLimit, firebaseAppCheckGuard, requireOwner } from '../guards';
import {
  findAccountByPhone,
  findAccountByPhoneOrUsername,
  getAccounts,
  addAccount,
  removeAccount,
  createSession,
  removeSessionByToken,
  keepOnlySession,
  tokenFromRequest,
  accountFromRequest,
  sessionCookie,
  destroySessionCookie,
  hashPassword,
  verifyPassword,
  publicAccount,
  isLoginLocked,
  registerFailedLogin,
  clearLoginAttempts,
  loginAttemptsLeft,
  persistAccounts,
  recordLogin,
  clientIp,
  logAuthEvent,
  normalizePhone,
  isValidTurkishPhone,
  type Account,
} from '../accounts';
import { loadShopState, persistShopState, allocateUniqueSlug, sanitizeGoogleMapsUrl } from '../shopState';
import { DEMO_ACCOUNT_ID } from '../demoSeed';
import { getTierLimits } from './profile';
import {
  checkSmsEligibility,
  recordSmsSent,
  generateWhatsAppVerificationLink,
} from '../services/smsSecurity';
import {
  verifyFirebaseIdToken,
  getFirebaseIntegrationStatus,
  writeFirestoreDocument,
  dispatchBrandedEmail,
  isCustomEmailConfigured,
} from '../services/firebaseService';

export function registerAuthRoutes(app: Express): void {
  app.get('/api/auth/firebase-status', (_req: Request, res: Response) => {
    const fb = getFirebaseIntegrationStatus();
    res.json({ success: true, ...fb });
  });
  // Herkese açık platform metrikleri
  app.get('/api/public/stats', (_req: Request, res: Response) => {
    const accounts = getAccounts().filter(
      (a) => (a.role || 'owner') === 'owner' && !a.isClosed && a.id !== DEMO_ACCOUNT_ID
    );
    const realShops = accounts.length;
    const displayShops = Math.max(25, 20 + realShops);

    res.json({
      success: true,
      shopsCount: displayShops,
      shopsLabel: `${displayShops}+`,
      trackedVolume: '₺850K+',
      setupTime: '2 Dakika',
      price: '0 TL',
    });
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const body = req.body || {};
    const shopName = String(body.shopName || '').trim();
    const ownerName = String(body.ownerName || '').trim();
    const phone = normalizePhone(String(body.phone || ''));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const rawGoogleMapsUrl = sanitizeGoogleMapsUrl(body.googleMapsUrl);
    const firebaseIdToken = String(body.firebaseIdToken || '').trim();

    if (!shopName || !ownerName || !phone) {
      return res.status(400).json({ error: 'Dükkan adı, yetkili adı ve telefon numarası zorunludur.' });
    }
    if (!isValidTurkishPhone(phone)) {
      return res.status(400).json({
        error: 'Geçersiz telefon numarası. Lütfen 05XX XXX XX XX formatında geçerli bir Türkiye cep telefonu giriniz (harf veya sahte numara kabul edilmez).'
      });
    }
    if (
      process.env.SKIP_SERVER_AUTOSTART !== 'true' &&
      (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifreniz en az 6 karakter olmalıdır.' });
    }
    if (findAccountByPhone(phone)) {
      return res.status(409).json({ error: 'Bu telefon ile kayıtlı bir hesap var. Giriş yapmayı deneyin.' });
    }

    let phoneVerified = false;
    let firebaseUid: string | undefined;
    if (firebaseIdToken) {
      const fbRes = await verifyFirebaseIdToken(firebaseIdToken);
      if (!fbRes.success || !fbRes.phoneNumber) {
        return res.status(401).json({ error: fbRes.error || 'Firebase telefon doğrulaması geçersiz.' });
      }
      if (normalizePhone(fbRes.phoneNumber) !== phone) {
        return res.status(403).json({ error: 'Firebase ile doğrulanan telefon numarası formdaki numarayla uyuşmuyor.' });
      }
      phoneVerified = true;
      firebaseUid = fbRes.uid;
    } else if (
      process.env.SKIP_SERVER_AUTOSTART !== 'true' &&
      process.env.REQUIRE_FIREBASE_REGISTER_OTP !== 'false'
    ) {
      return res.status(400).json({ error: 'Kayıt olabilmek için telefon numaranızı SMS ile doğrulamanız zorunludur.' });
    }

    const acc: Account & { phoneVerified?: boolean; firebaseUid?: string } = {
      id: 'acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      shopName,
      ownerName,
      phone,
      email: email || undefined,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      createdIp: clientIp(req),
      ...(phoneVerified ? { phoneVerified: true } : {}),
      ...(firebaseUid ? { firebaseUid } : {}),
    };
    addAccount(acc);
    recordLogin(acc, clientIp(req));
    logAuthEvent('register', phone, clientIp(req));
    const st = loadShopState(acc.id);
    st.storeName = shopName;
    st.shopProfile.storeName = shopName;
    st.shopProfile.ownerName = ownerName;
    st.shopProfile.phone = phone;
    st.shopProfile.slug = allocateUniqueSlug(shopName, acc.id);
    if (rawGoogleMapsUrl) {
      st.shopProfile.googleMapsUrl = rawGoogleMapsUrl;
    }
    if (st.barberSettings) {
      st.barberSettings.slug = st.shopProfile.slug;
    }

    // 14 Günlük Ücretsiz VIP Kampanyası
    if (!st.shopProfile.isVip || !st.shopProfile.vipUntil) {
      const trialDays = 14;
      const trialExpiry = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
      st.shopProfile.isVip = true;
      st.shopProfile.vipTier = 'patron';
      st.shopProfile.vipPlan = '14_gun_deneme';
      st.shopProfile.vipUntil = trialExpiry;
      st.shopProfile.vipExpiresAt = trialExpiry;
    }
    persistShopState(acc.id, st);

    writeFirestoreDocument('shops', acc.id, {
      accountId: acc.id,
      storeName: acc.shopName,
      slug: st.shopProfile.slug,
      ...(st.shopProfile.googleMapsUrl ? { googleMapsUrl: st.shopProfile.googleMapsUrl } : {}),
      businessField: st.shopProfile.businessField || 'Genel Esnaf',
      sectorKey: st.shopProfile.sectorKey || 'bakkal_market',
      ...(st.shopProfile.cityDistrict ? { cityDistrict: st.shopProfile.cityDistrict } : {}),
      vipTier: st.shopProfile.vipTier || 'patron',
      isVip: Boolean(st.shopProfile.isVip),
      updatedAt: acc.createdAt,
    }).catch(() => {});

    if (email && email.includes('@')) {
      const baseUrl = (process.env.APP_BASE_URL || 'https://dukkanimyanimda.com.tr').replace(/\/+$/, '');
      dispatchBrandedEmail({
        to: email,
        subject: `${shopName} — Dükkânım Yanımda'ya Hoş Geldiniz!`,
        type: 'welcome',
        shopName,
        ownerName,
        recipientName: ownerName,
        actionUrl: `${baseUrl}/`,
      }).catch(() => {});
    }

    const session = createSession(acc.id);
    res.setHeader('Set-Cookie', sessionCookie(session.token));
    const returnToken =
      req.headers['x-client-platform'] === 'android-native' ||
      body?.returnToken === true;
    res.json({
      success: true,
      account: publicAccount(acc),
      ...(returnToken ? { sessionToken: session.token } : {}),
    });
  });

  // Demo modu kaldırıldı: Ziyaretçiler 14 günlük ücretsiz canlı hesap açmaya yönlendirilir
  const handleDemoLogin = (req: Request, res: Response) => {
    if (req.method === 'GET') {
      return res.redirect('/kayit');
    }
    return res.status(410).json({
      success: false,
      redirect: '/kayit',
      error: 'Demo modu tamamen canlıya geçiş kapsamında kapatılmıştır. 14 gün ücretsiz deneme hesabı açarak tüm özellikleri canlı deneyebilirsiniz.'
    });
  };

  app.post('/api/auth/demo', handleDemoLogin);
  app.get('/api/auth/demo', handleDemoLogin);

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const body = req.body || {};
    const rawInput = String(body.phone || body.username || '').trim();
    const password = String(body.password || '');

    // Kullanıcı adı mı (örn: 'patron', 'omer') yoksa telefon numarası mı?
    const isUsername = /^[a-zA-Z0-9_.-]+$/.test(rawInput) && !rawInput.startsWith('05') && !/^\d{10,12}$/.test(rawInput.replace(/\D/g, ''));
    let lookupKey = rawInput;

    if (!isUsername) {
      lookupKey = normalizePhone(rawInput);
      if (!isValidTurkishPhone(rawInput)) {
        return res.status(400).json({
          error: 'Geçersiz telefon numarası. Lütfen 05XX XXX XX XX formatında geçerli bir Türkiye cep telefonu giriniz (veya kullanıcı adı ile giriş yapınız).'
        });
      }
    }

    const lockedMs = isLoginLocked(lookupKey);
    if (lockedMs > 0) {
      logAuthEvent('locked', lookupKey, clientIp(req));
      return res.status(429).json({
        error: 'Cok fazla hatali deneme. ' + Math.ceil(lockedMs / 60000) + ' dakika sonra tekrar deneyin.',
      });
    }
    const acc = findAccountByPhoneOrUsername(rawInput);
    if (!acc || !verifyPassword(password, acc.passwordHash)) {
      registerFailedLogin(lookupKey);
      logAuthEvent('login_fail', lookupKey, clientIp(req));
      const left = loginAttemptsLeft(lookupKey);
      return res.status(401).json({
        error: 'Kullanıcı adı/telefon veya şifre hatalı.' + (left > 0 && left <= 2 ? ` (${left} deneme hakkınız kaldı)` : ''),
      });
    }
    if (acc.id === DEMO_ACCOUNT_ID) {
      logAuthEvent('login_fail', lookupKey, clientIp(req));
      return res.status(410).json({
        error: 'Demo modu kaldırılmıştır.',
      });
    }
    if (acc.isClosed) {
      logAuthEvent('login_fail', lookupKey, clientIp(req));
      return res.status(403).json({
        error: 'Bu dükkan hesabı yönetici tarafından kapatılmıştır.',
      });
    }
    // Personel artik giris yapamaz — sadece dukkan sahibi (owner) girer.
    if (acc.role && acc.role !== 'owner') {
      logAuthEvent('login_fail', lookupKey, clientIp(req));
      return res.status(403).json({
        error: 'Personel girisi kapali. Panele sadece dukkan sahibi girer.',
      });
    }
    clearLoginAttempts(lookupKey);
    recordLogin(acc, clientIp(req));
    logAuthEvent('login_ok', lookupKey, clientIp(req));
    const session = createSession(acc.id);
    res.setHeader('Set-Cookie', sessionCookie(session.token));
    const returnToken =
      req.headers['x-client-platform'] === 'android-native' ||
      body?.returnToken === true;
    res.json({
      success: true,
      account: publicAccount(acc),
      ...(returnToken ? { sessionToken: session.token } : {}),
    });
  });

  // Kullanılmış Firebase sıfırlama jetonlarını tekrar kullanıma karşı tut (1 saat TTL)
  const usedFirebaseResetTokens = new Map<string, number>();

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = tokenFromRequest(req);
    if (token) {
      removeSessionByToken(token);
    }
    res.setHeader('Set-Cookie', destroySessionCookie());
    res.json({ success: true });
  });

  // In-Memory Şifre Sıfırlama OTP Deposu (5 dakika TTL, max 5 deneme)
  interface PasswordResetOtp {
    code: string;
    expiresAt: number;
    attempts: number;
  }
  const passwordResetOtpStore = new Map<string, PasswordResetOtp>();

  // Tek kullanımlık özel kurumsal e-posta şifre sıfırlama jetonları (SHA-256 hash -> 15 dk TTL)
  const customEmailResetTokens = new Map<
    string,
    { accountId: string; email: string; expiresAt: number }
  >();

  // 1. Şifre Sıfırlama Ön Uygunluk ve Güvenlik Kontrolü (Devre Kesici, Limit ve Kayıt Sorgulama)
  app.post('/api/auth/forgot-password/check-eligibility', rateLimit, firebaseAppCheckGuard, (req: Request, res: Response) => {
    const body = req.body || {};
    const rawPhone = String(body.phone || body.username || '').trim();
    const phone = normalizePhone(rawPhone);

    if (!isValidTurkishPhone(rawPhone)) {
      return res.status(400).json({
        allowed: false,
        error: 'Geçersiz telefon numarası. Lütfen 05XX XXX XX XX formatında geçerli bir Türkiye cep telefonu giriniz.'
      });
    }

    const matched = findAccountByPhone(phone);
    if (!matched) {
      return res.status(404).json({
        allowed: false,
        error: 'Bu telefon numarasına ait kayıtlı bir dükkan hesabı bulunamadı. Lütfen numaranızı kontrol ediniz.'
      });
    }
    if (matched.isClosed) {
      return res.status(403).json({
        allowed: false,
        error: 'Bu dükkan hesabı yönetici tarafından kapatılmıştır.'
      });
    }

    const ip = clientIp(req);
    const eligibility = checkSmsEligibility(phone, ip);

    if (!eligibility.allowed) {
      return res.status(200).json({
        allowed: false,
        reason: eligibility.reason,
        message: eligibility.message,
        waitSeconds: eligibility.waitSeconds,
        fallbackToWhatsapp: eligibility.fallbackToWhatsapp,
        whatsappLink: eligibility.whatsappLink || generateWhatsAppVerificationLink(phone),
      });
    }

    const maskedEmail = matched.email
      ? (() => {
          const [u, d] = matched.email.split('@');
          if (!u || !d) return undefined;
          return `${u.slice(0, 2)}${'*'.repeat(Math.max(2, u.length - 2))}@${d}`;
        })()
      : undefined;

    return res.json({
      allowed: true,
      phone,
      shopName: matched.shopName,
      ownerName: matched.ownerName,
      hasEmail: Boolean(matched.email),
      maskedEmail,
      email: matched.email || undefined,
      whatsappLink: generateWhatsAppVerificationLink(phone),
    });
  });

  // 1b. E-posta ile Firebase / Kurumsal Şifre Kurtarma Ön Kontrolü & Bağlantı Gönderimi
  app.post('/api/auth/forgot-password/send-email-reset', rateLimit, firebaseAppCheckGuard, async (req: Request, res: Response) => {
    const body = req.body || {};
    const rawPhone = String(body.phone || '').trim();
    const rawEmail = String(body.email || '').trim().toLowerCase();

    const byPhone = rawPhone ? findAccountByPhone(normalizePhone(rawPhone)) : undefined;
    const byEmail = rawEmail
      ? getAccounts().find((a) => String(a.email || '').trim().toLowerCase() === rawEmail)
      : undefined;
    const matched = byEmail || byPhone;

    if (!matched) {
      return res.status(404).json({ error: 'Bu bilgiye ait kayıtlı dükkan hesabı bulunamadı.' });
    }
    if (matched.isClosed) {
      return res.status(403).json({ error: 'Bu dükkan hesabı yönetici tarafından kapatılmıştır.' });
    }
    const targetEmail = String(matched.email || rawEmail || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ error: 'Bu hesaba tanımlı bir kurtarma e-posta adresi bulunmuyor. Lütfen Telefon SMS ile sıfırlamayı deneyiniz.' });
    }

    logAuthEvent('password_reset' as any, matched.phone, clientIp(req));

    // Özel kurumsal e-posta sağlayıcısı (Resend / SendGrid / Cloud Function / Queue) hazırsa tek kullanımlık 15 dk link gönder
    if (isCustomEmailConfigured()) {
      const nowMs = Date.now();
      for (const [k, v] of customEmailResetTokens.entries()) {
        if (v.expiresAt < nowMs) customEmailResetTokens.delete(k);
      }
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      customEmailResetTokens.set(tokenHash, {
        accountId: matched.id,
        email: targetEmail,
        expiresAt: nowMs + 15 * 60 * 1000,
      });

      const baseUrl = (process.env.APP_BASE_URL || 'https://dukkanimyanimda.com.tr').replace(/\/+$/, '');
      const resetUrl = `${baseUrl}/?emailResetToken=${rawToken}&recoveryEmail=${encodeURIComponent(targetEmail)}`;
      const emailRes = await dispatchBrandedEmail({
        to: targetEmail,
        subject: 'Şifre Sıfırlama Bağlantınız — Dükkânım Yanımda',
        type: 'password_reset',
        shopName: matched.shopName,
        ownerName: matched.ownerName,
        recipientName: matched.ownerName,
        resetUrl,
      });

      if (emailRes.sent || emailRes.queued) {
        return res.json({
          success: true,
          customEmailSent: true,
          email: targetEmail,
          provider: emailRes.provider,
          message: 'Özel kurumsal şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
        });
      }
      // Gönderim başarısız olduysa token'ı iptal edip Firebase Email Link yoluna düş
      customEmailResetTokens.delete(tokenHash);
    }

    // Yedek/varsayılan: Frontend Firebase E-posta Doğrulama Linki (Email Link) akışına onay verir
    return res.json({
      success: true,
      customEmailSent: false,
      email: targetEmail,
      message: 'Hesap e-posta doğrulamaya hazır.',
    });
  });

  // 2. Firebase SMS Gönderim Kaydı (Yalnızca kayıtlı telefonlar ve uygunluk geçtiğinde sayacı işler)
  app.post('/api/auth/forgot-password/record-sms', rateLimit, (req: Request, res: Response) => {
    const body = req.body || {};
    const rawPhone = String(body.phone || '').trim();
    const phone = normalizePhone(rawPhone);
    const ip = clientIp(req);

    if (phone && findAccountByPhone(phone)) {
      const eligibility = checkSmsEligibility(phone, ip);
      if (eligibility.allowed) {
        recordSmsSent(phone, ip);
        logAuthEvent('password_reset' as any, phone, ip);
      }
    }

    res.json({ success: true });
  });

  // 3. Şifre Sıfırlama SMS / WhatsApp OTP Gönderimi (Yedek & Geriye Dönük Uyumluluk)
  const handleForgotPasswordSendOtp = (req: Request, res: Response) => {
    const body = req.body || {};
    const rawPhone = String(body.phone || body.username || '').trim();
    const phone = normalizePhone(rawPhone);

    if (!isValidTurkishPhone(rawPhone)) {
      return res.status(400).json({
        error: 'Geçersiz telefon numarası. Lütfen 05XX XXX XX XX formatında geçerli bir Türkiye cep telefonu giriniz.'
      });
    }

    const matched = findAccountByPhone(phone);
    if (!matched) {
      return res.status(404).json({
        error: 'Bu telefon numarasına ait kayıtlı bir dükkan hesabı bulunamadı. Lütfen numaranızı kontrol ediniz.'
      });
    }
    if (matched.isClosed) {
      return res.status(403).json({
        error: 'Bu dükkan hesabı yönetici tarafından kapatılmıştır.'
      });
    }

    const ip = clientIp(req);

    // Güvenlik Kalkanı Kontrolü
    const eligibility = checkSmsEligibility(phone, ip);
    if (!eligibility.allowed) {
      return res.status(429).json({
        error: eligibility.message,
        reason: eligibility.reason,
        fallbackToWhatsapp: eligibility.fallbackToWhatsapp,
        whatsappLink: eligibility.whatsappLink || generateWhatsAppVerificationLink(phone),
      });
    }

    // Sayaçları güncelle
    recordSmsSent(phone, ip);
    logAuthEvent('password_reset' as any, phone, ip);

    // 6 haneli rastgele OTP kodu
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    passwordResetOtpStore.set(phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 dakika geçerli
      attempts: 0,
    });

    // Ayrıca denetim loglarına da kaydet
    try {
      const resetRequestsFile = path.join(DATA_DIR, 'password-resets.json');
      const list = readJsonFile<any[]>(resetRequestsFile, []);
      list.unshift({
        id: 'reset_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        phone,
        shopName: matched.shopName,
        ownerName: matched.ownerName,
        ip,
        createdAt: new Date().toISOString(),
        status: 'otp_sent',
      });
      writeJsonFile(resetRequestsFile, list.slice(0, 500));
    } catch (e) {
      console.error('Şifre sıfırlama talebi kaydedilemedi:', e);
    }

    // Güvenlik (P0): OTP doğrulama kodu ve doğrudan bağlantı ASLA JSON yanıtında dönülmez!
    // Kod yalnızca güvenli backend SMS / WhatsApp sağlayıcısı üzerinden iletilir.
    res.json({
      success: true,
      message: 'Doğrulama kodu telefonunuza iletildi.',
      phone,
      whatsappLink: generateWhatsAppVerificationLink(phone),
    });
  };

  app.post('/api/auth/forgot-password/send-otp', rateLimit, firebaseAppCheckGuard, handleForgotPasswordSendOtp);
  app.post('/api/auth/forgot-password', rateLimit, firebaseAppCheckGuard, handleForgotPasswordSendOtp);

  // 4. Şifre Sıfırlama OTP / Firebase Token / Özel E-posta Token Doğrulama ve Yeni Şifre Belirleme
  app.post('/api/auth/forgot-password/verify-and-reset', rateLimit, firebaseAppCheckGuard, async (req: Request, res: Response) => {
    const body = req.body || {};
    const rawPhone = String(body.phone || '').trim();
    const phone = normalizePhone(rawPhone);
    const idToken = String(body.idToken || '').trim();
    const emailResetToken = String(body.emailResetToken || '').trim();
    const otpCode = String(body.otpCode || '').trim();
    const newPassword = String(body.newPassword || '').trim();

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Yeni şifreniz en az 6 karakter olmalıdır.' });
    }

    // C. Tek Kullanımlık Kurumsal E-posta Sıfırlama Bağlantısı (emailResetToken)
    if (emailResetToken) {
      const nowMs = Date.now();
      for (const [k, v] of customEmailResetTokens.entries()) {
        if (v.expiresAt < nowMs) customEmailResetTokens.delete(k);
      }
      const tokenHash = crypto.createHash('sha256').update(emailResetToken).digest('hex');
      const entry = customEmailResetTokens.get(tokenHash);
      if (!entry || entry.expiresAt < nowMs) {
        return res.status(401).json({
          error: 'Şifre sıfırlama bağlantınız geçersiz veya süresi dolmuş (15 dk). Lütfen yeni bağlantı isteyiniz.',
        });
      }

      const acc = getAccounts().find((a) => a.id === entry.accountId);
      if (!acc) {
        customEmailResetTokens.delete(tokenHash);
        return res.status(404).json({ error: 'Hesap bulunamadı.' });
      }
      if (acc.isClosed) {
        customEmailResetTokens.delete(tokenHash);
        return res.status(403).json({ error: 'Bu dükkan hesabı yönetici tarafından kapatılmıştır.' });
      }

      customEmailResetTokens.delete(tokenHash);
      acc.passwordHash = hashPassword(newPassword);
      persistAccounts();
      passwordResetOtpStore.delete(acc.phone);
      clearLoginAttempts(acc.phone);

      const ip = clientIp(req);
      logAuthEvent('login_ok', acc.phone, ip);
      writeFirestoreDocument('password_resets', `rst_${Date.now()}`, {
        accountId: acc.id,
        method: 'custom_email_reset_token',
        createdAt: new Date().toISOString(),
      }).catch(() => {});

      const session = createSession(acc.id);
      res.setHeader('Set-Cookie', sessionCookie(session.token));

      return res.json({
        success: true,
        message: 'Şifreniz e-posta doğrulamasıyla güvenle güncellendi! Panele yönlendiriliyorsunuz.',
        account: publicAccount(acc),
      });
    }

    // A. Firebase Auth idToken (Phone SMS OTP veya E-posta Doğrulama) ile Güvenli Doğrulama
    if (idToken) {
      const tokenHash = crypto.createHash('sha256').update(idToken).digest('hex');
      const nowMs = Date.now();
      for (const [k, exp] of usedFirebaseResetTokens.entries()) {
        if (exp < nowMs) usedFirebaseResetTokens.delete(k);
      }
      if (usedFirebaseResetTokens.has(tokenHash)) {
        return res.status(401).json({ error: 'Bu doğrulama oturumu daha önce kullanılmış. Lütfen yeniden doğrulama yapınız.' });
      }

      const verifyRes = await verifyFirebaseIdToken(idToken);
      if (!verifyRes.success) {
        return res.status(401).json({
          error: verifyRes.error || 'Firebase oturum doğrulaması başarısız oldu. Lütfen tekrar deneyiniz.'
        });
      }

      // Token tazelik kontrolü (en fazla 20 dakika önce doğrulanmış olmalı)
      if (typeof verifyRes.authTimeSec === 'number') {
        const ageSec = Math.floor(nowMs / 1000) - verifyRes.authTimeSec;
        if (ageSec > 20 * 60) {
          return res.status(401).json({ error: 'Doğrulama oturumunun süresi doldu. Lütfen yeniden kod veya bağlantı isteyiniz.' });
        }
      }

      let acc = phone ? findAccountByPhone(phone) : undefined;
      if (verifyRes.phoneNumber) {
        const verifiedPhone = normalizePhone(verifyRes.phoneNumber);
        if (rawPhone && (!isValidTurkishPhone(rawPhone) || verifiedPhone !== phone)) {
          return res.status(403).json({
            error: 'Doğrulanan telefon numarası ile hesap numarası uyuşmuyor. Lütfen dükkanınıza ait numarayı doğrulayınız.'
          });
        }
        if (!acc) acc = findAccountByPhone(verifiedPhone);
      } else if (verifyRes.email) {
        if (!verifyRes.emailVerified) {
          return res.status(403).json({ error: 'E-posta adresiniz Firebase tarafından henüz doğrulanmamış.' });
        }
        const verifiedEmail = verifyRes.email.trim().toLowerCase();
        if (!acc || String(acc.email || '').trim().toLowerCase() !== verifiedEmail) {
          acc = getAccounts().find((a) => String(a.email || '').trim().toLowerCase() === verifiedEmail);
        }
        if (!acc || String(acc.email || '').trim().toLowerCase() !== verifiedEmail) {
          return res.status(403).json({
            error: 'Doğrulanan e-posta adresi hesap e-postasıyla uyuşmuyor.'
          });
        }
      } else {
        return res.status(401).json({ error: 'Firebase token içinde doğrulanmış telefon veya e-posta bulunamadı.' });
      }

      if (!acc) {
        return res.status(404).json({ error: 'Hesap bulunamadı.' });
      }
      if (acc.isClosed) {
        return res.status(403).json({ error: 'Bu dükkan hesabı yönetici tarafından kapatılmıştır.' });
      }

      usedFirebaseResetTokens.set(tokenHash, nowMs + 60 * 60 * 1000);
      acc.passwordHash = hashPassword(newPassword);
      persistAccounts();
      passwordResetOtpStore.delete(acc.phone);
      clearLoginAttempts(acc.phone);

      const ip = clientIp(req);
      logAuthEvent('login_ok', acc.phone, ip);
      writeFirestoreDocument('password_resets', `rst_${Date.now()}`, {
        accountId: acc.id,
        method: verifyRes.phoneNumber ? 'firebase_phone_otp' : 'firebase_email_link',
        createdAt: new Date().toISOString(),
      }).catch(() => {});

      const session = createSession(acc.id);
      res.setHeader('Set-Cookie', sessionCookie(session.token));

      return res.json({
        success: true,
        message: 'Şifreniz Firebase ile güvenle doğrulandı ve güncellendi! Panele yönlendiriliyorsunuz.',
        account: publicAccount(acc),
      });
    }

    if (!isValidTurkishPhone(rawPhone)) {
      return res.status(400).json({ error: 'Geçersiz telefon numarası.' });
    }

    // B. Klasik In-Memory OTP Doğrulama (Geriye Dönük WhatsApp Uyumluluğu)
    if (!otpCode || otpCode.length < 4) {
      return res.status(400).json({ error: 'Lütfen SMS doğrulama kodunu veya Firebase tokenını iletiniz.' });
    }

    const stored = passwordResetOtpStore.get(phone);
    if (!stored || stored.expiresAt < Date.now()) {
      return res.status(400).json({
        error: 'Doğrulama kodunun süresi dolmuş veya kod talep edilmemiş. Lütfen yeni bir kod isteyiniz.'
      });
    }

    if (stored.attempts >= 5) {
      passwordResetOtpStore.delete(phone);
      return res.status(429).json({
        error: 'Çok fazla hatalı kod denemesi yaptınız. Güvenliğiniz için yeni bir kod talep ediniz.'
      });
    }

    if (stored.code !== otpCode) {
      stored.attempts += 1;
      const remaining = 5 - stored.attempts;
      return res.status(400).json({
        error: `Girdiğiniz doğrulama kodu hatalı. (${remaining} deneme hakkınız kaldı)`
      });
    }

    // Doğrulama başarılı - Şifreyi güncelle
    const acc = findAccountByPhone(phone);
    if (!acc) {
      return res.status(404).json({ error: 'Hesap bulunamadı.' });
    }
    if (acc.isClosed) {
      return res.status(403).json({ error: 'Bu dükkan hesabı yönetici tarafından kapatılmıştır.' });
    }

    acc.passwordHash = hashPassword(newPassword);
    persistAccounts();
    passwordResetOtpStore.delete(phone);
    clearLoginAttempts(phone);

    const ip = clientIp(req);
    logAuthEvent('login_ok', phone, ip);

    // Oturumu doğrudan açarak kullanıcıyı bekletmeden panele al
    const session = createSession(acc.id);
    res.setHeader('Set-Cookie', sessionCookie(session.token));

    return res.json({
      success: true,
      message: 'Şifreniz başarıyla yenilendi! Panele yönlendiriliyorsunuz.',
      account: publicAccount(acc),
    });
  });

  // Sifre degistir: sadece oturum acikken (diger tum cihazlardan cikis yapilir)
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const acc = accountFromRequest(req);
    if (!acc) return res.status(401).json({ error: 'Oturum bulunamadi.' });
    const body = req.body || {};
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Yeni sifre en az 4 hane olmalidir.' });
    }
    if (!verifyPassword(currentPassword, acc.passwordHash)) {
      return res.status(401).json({ error: 'Mevcut sifre hatali.' });
    }
    acc.passwordHash = hashPassword(newPassword);
    persistAccounts();
    // Guvenlik: sifre degisince diger tum oturumlari kapat, sadece bu cihaz kalsin
    const keep = tokenFromRequest(req);
    if (keep) keepOnlySession(acc.id, keep);
    res.json({ success: true });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const acc = accountFromRequest(req);
    if (!acc) return res.status(401).json({ error: 'Oturum bulunamadi.' });
    res.json({ account: publicAccount(acc) });
  });

  // Personel ekle — sadece KAYIT. Personel giremez (sifre alanı yoktur),
  // patron personelin bilgilerini panelden gorur.
  app.post('/api/auth/add-staff', (req: Request, res: Response) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    const ownerState = loadShopState(owner.id);
    const limits = getTierLimits(ownerState.shopProfile);
    const existingStaffCount = getAccounts().filter((a) => a.parentAccountId === owner.id).length;
    if (existingStaffCount + 1 >= limits.maxStaffSeats) {
      return res.status(403).json({
        error: 'Çırak ve Usta paketleri tek koltuk (1 çalışan) içindir. Çoklu personel eklemek için Patron VIP pakete geçin.',
        code: 'VIP_REQUIRED',
      });
    }
    const body = req.body || {};
    const rawPhone = String(body.phone || '');
    const phone = normalizePhone(rawPhone);
    const name = String(body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Personel adı zorunludur.' });
    }
    if (!isValidTurkishPhone(rawPhone)) {
      return res.status(400).json({
        error: 'Geçersiz personel telefon numarası. Lütfen 05XX XXX XX XX formatında geçerli bir Türkiye GSM numarası giriniz (harf veya sahte numara kabul edilmez).'
      });
    }
    // Aynı telefona sahip personel var mı?
    const dupePhone = getAccounts().find(
      (a) => a.parentAccountId === owner.id && normalizePhone(a.phone) === phone
    );
    if (dupePhone) {
      return res.status(409).json({ error: 'Bu telefon numarasına sahip bir personel zaten kayıtlı.' });
    }
    // Ayni isimde kayit var mi?
    const dupe = getAccounts().find(
      (a) => a.parentAccountId === owner.id && a.ownerName.toLowerCase() === name.toLowerCase()
    );
    if (dupe) {
      return res.status(409).json({ error: 'Bu isimde bir personel zaten kayitli.' });
    }
    const staff: Account = {
      id: 'acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      shopName: owner.shopName,
      ownerName: name,
      phone,
      passwordHash: '',
      createdAt: new Date().toISOString(),
      role: 'cashier',
      parentAccountId: owner.id,
      position: String(body.position || 'Kasiyer').trim(),
      salary: body.salary !== undefined && body.salary !== '' ? Number(body.salary) : undefined,
      staffNotes: String(body.staffNotes || '').trim() || undefined,
    };
    addAccount(staff);
    res.json({ success: true, account: publicAccount(staff) });
  });

  // Personel listesi — patron icin detayli kartlar
  app.get('/api/auth/staff', (req: Request, res: Response) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    const list = getAccounts()
      .filter((a) => a.parentAccountId === owner.id)
      .map((a) => {
        const added = new Date(a.createdAt).getTime();
        const days = Number.isFinite(added) ? Math.max(0, Math.floor((Date.now() - added) / 86400000)) : 0;
        return {
          ...publicAccount(a),
          createdAt: a.createdAt,
          daysEmployed: days,
          canLogin: false, // personel giris yapamaz
        };
      });
    res.json({ staff: list });
  });

  // Personel sil
  app.delete('/api/auth/staff/:id', (req: Request, res: Response) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    const id = req.params.id;
    const target = getAccounts().find((a) => a.id === id && a.parentAccountId === owner.id);
    if (!target) return res.status(404).json({ error: 'Personel bulunamadi.' });
    removeAccount(id);
    res.json({ success: true });
  });
}
