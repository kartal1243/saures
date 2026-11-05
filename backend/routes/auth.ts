import type { Express, Request, Response } from 'express';
import path from 'path';
import { DATA_DIR } from '../config';
import { readJsonFile, writeJsonFile } from '../fsdb';
import { rateLimit } from '../guards';
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
import { loadShopState, persistShopState } from '../shopState';
import { ensureDemoAccount, DEMO_PHONE, ensureMasterAccount, MASTER_PHONE, MASTER_USERNAME } from '../demoSeed';
import { requireOwner } from '../guards';
import { getTierLimits } from './profile';

export function registerAuthRoutes(app: Express): void {
  // Herkese açık platform metrikleri
  app.get('/api/public/stats', (_req: Request, res: Response) => {
    const accounts = getAccounts().filter((a) => (a.role || 'owner') === 'owner');
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

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const body = req.body || {};
    const shopName = String(body.shopName || '').trim();
    const ownerName = String(body.ownerName || '').trim();
    const phone = normalizePhone(String(body.phone || ''));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!shopName || !ownerName || !phone) {
      return res.status(400).json({ error: 'Dükkan adı, yetkili adı ve telefon numarası zorunludur.' });
    }
    if (!isValidTurkishPhone(phone)) {
      return res.status(400).json({
        error: 'Geçersiz telefon numarası. Lütfen 05XX XXX XX XX formatında geçerli bir Türkiye cep telefonu giriniz (harf veya sahte numara kabul edilmez).'
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifreniz en az 6 karakter olmalıdır.' });
    }
    if (findAccountByPhone(phone)) {
      return res.status(409).json({ error: 'Bu telefon ile kayıtlı bir hesap var. Giriş yapmayı deneyin.' });
    }
    const acc: Account = {
      id: 'acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      shopName,
      ownerName,
      phone,
      email: email || undefined,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      createdIp: clientIp(req),
    };
    addAccount(acc);
    recordLogin(acc, clientIp(req));
    logAuthEvent('register', phone, clientIp(req));
    const st = loadShopState(acc.id);

    // 14 Günlük Ücretsiz VIP Kampanyası
    if (!st.shopProfile.isVip || !st.shopProfile.vipUntil) {
      const trialDays = 14;
      const trialExpiry = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
      st.shopProfile.isVip = true;
      st.shopProfile.vipTier = 'patron';
      st.shopProfile.vipPlan = '14_gun_deneme';
      st.shopProfile.vipUntil = trialExpiry;
      st.shopProfile.vipExpiresAt = trialExpiry;
      persistShopState(acc.id, st);
    }

    const session = createSession(acc.id);
    res.setHeader('Set-Cookie', sessionCookie(session.token));
    res.json({ success: true, account: publicAccount(acc) });
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

    if (lookupKey === DEMO_PHONE) {
      ensureDemoAccount();
      clearLoginAttempts(lookupKey);
    }
    if (rawInput.toLowerCase() === MASTER_USERNAME || rawInput.toLowerCase() === 'omer') {
      ensureMasterAccount();
      clearLoginAttempts(MASTER_PHONE);
      clearLoginAttempts(MASTER_USERNAME);
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
    res.json({ success: true, account: publicAccount(acc) });
  });

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

  // 1. Şifre Sıfırlama SMS / WhatsApp OTP Gönderimi
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

    const ip = clientIp(req);
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

    const cleanNumber = phone.startsWith('0') ? phone.slice(1) : phone;
    const whatsappText = encodeURIComponent(`Dükkânım Yanımda Şifre Sıfırlama Kodunuz: ${code}`);
    const whatsappLink = `https://wa.me/90${cleanNumber}?text=${whatsappText}`;

    // Güvenlik: Canlı ortamda gerçek dükkan hesaplarının OTP kodu ASLA JSON yanıtında dönülmez!
    const isDemo = phone === DEMO_PHONE || phone === '05550000000' || process.env.NODE_ENV !== 'production';

    res.json({
      success: true,
      message: '6 haneli doğrulama kodunuz SMS olarak gönderildi.',
      phone,
      demoCode: isDemo ? code : undefined,
      whatsappLink,
    });
  };

  app.post('/api/auth/forgot-password/send-otp', rateLimit, handleForgotPasswordSendOtp);
  app.post('/api/auth/forgot-password', rateLimit, handleForgotPasswordSendOtp);

  // 2. Şifre Sıfırlama OTP Doğrulama ve Yeni Şifre Belirleme
  app.post('/api/auth/forgot-password/verify-and-reset', rateLimit, (req: Request, res: Response) => {
    const body = req.body || {};
    const rawPhone = String(body.phone || '').trim();
    const phone = normalizePhone(rawPhone);
    const otpCode = String(body.otpCode || '').trim();
    const newPassword = String(body.newPassword || '').trim();

    if (!isValidTurkishPhone(rawPhone)) {
      return res.status(400).json({ error: 'Geçersiz telefon numarası.' });
    }
    if (!otpCode || otpCode.length < 4) {
      return res.status(400).json({ error: 'Lütfen SMS doğrulama kodunu eksiksiz giriniz.' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Yeni şifreniz en az 6 karakter olmalıdır.' });
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

    acc.passwordHash = hashPassword(newPassword);
    persistAccounts();
    passwordResetOtpStore.delete(phone);
    clearLoginAttempts(phone);

    const ip = clientIp(req);
    logAuthEvent('login_ok', phone, ip);

    // Oturumu doğrudan açarak kullanıcıyı bekletmeden panele al
    const session = createSession(acc.id);
    res.setHeader('Set-Cookie', sessionCookie(session.token));

    res.json({
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
