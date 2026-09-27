import type { Express, Request, Response } from 'express';
import {
  findAccountByPhone,
  getAccounts,
  addAccount,
  removeAccount,
  createSession,
  removeSessionByToken,
  keepOnlySession,
  tokenFromRequest,
  accountFromRequest,
  sessionCookie,
  hashPassword,
  verifyPassword,
  publicAccount,
  isLoginLocked,
  registerFailedLogin,
  clearLoginAttempts,
  loginAttemptsLeft,
  persistAccounts,
  type Account,
} from '../accounts';
import { loadShopState } from '../shopState';
import { requireOwner } from '../guards';

export function registerAuthRoutes(app: Express): void {
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const body = req.body || {};
    const shopName = String(body.shopName || '').trim();
    const ownerName = String(body.ownerName || '').trim();
    const phone = String(body.phone || '').replace(/\s+/g, '');
    const password = String(body.password || '');
    if (!shopName || !ownerName || !phone || password.length < 4) {
      return res.status(400).json({ error: 'Dukkan adi, yetkili adi, telefon ve en az 4 haneli sifre gerekli.' });
    }
    if (findAccountByPhone(phone)) {
      return res.status(409).json({ error: 'Bu telefon ile kayitli bir hesap var. Giris yapmayi deneyin.' });
    }
    const acc: Account = {
      id: 'acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      shopName,
      ownerName,
      phone,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    addAccount(acc);
    loadShopState(acc.id);
    const session = createSession(acc.id);
    res.setHeader('Set-Cookie', sessionCookie(session.token));
    res.json({ success: true, account: publicAccount(acc) });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const body = req.body || {};
    const phone = String(body.phone || '').replace(/\s+/g, '');
    const password = String(body.password || '');
    const lockedMs = isLoginLocked(phone);
    if (lockedMs > 0) {
      return res.status(429).json({
        error: 'Cok fazla hatali deneme. ' + Math.ceil(lockedMs / 60000) + ' dakika sonra tekrar deneyin.',
      });
    }
    const acc = findAccountByPhone(phone);
    if (!acc || !verifyPassword(password, acc.passwordHash)) {
      registerFailedLogin(phone);
      const left = loginAttemptsLeft(phone);
      return res.status(401).json({
        error: 'Telefon veya sifre hatali.' + (left > 0 && left <= 2 ? ` (${left} deneme hakkiniz kaldi)` : ''),
      });
    }
    clearLoginAttempts(phone);
    const session = createSession(acc.id);
    res.setHeader('Set-Cookie', sessionCookie(session.token));
    res.json({ success: true, account: publicAccount(acc) });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = tokenFromRequest(req);
    if (token) {
      removeSessionByToken(token);
    }
    res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; Max-Age=0');
    res.json({ success: true });
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

  // Personel (kasiyer) ekle
  app.post('/api/auth/add-staff', (req: Request, res: Response) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    const body = req.body || {};
    const phone = String(body.phone || '').replace(/\s+/g, '');
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    if (!phone || password.length < 4 || !name) {
      return res.status(400).json({ error: 'Ad, telefon ve en az 4 haneli sifre gerekli.' });
    }
    if (findAccountByPhone(phone)) {
      return res.status(409).json({ error: 'Bu telefon ile kayitli bir hesap var.' });
    }
    const staff: Account = {
      id: 'acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      shopName: owner.shopName,
      ownerName: name,
      phone,
      passwordHash: hashPassword(password),
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

  // Personel listesi
  app.get('/api/auth/staff', (req: Request, res: Response) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    const list = getAccounts()
      .filter((a) => a.parentAccountId === owner.id)
      .map((a) => ({ ...publicAccount(a), createdAt: a.createdAt }));
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
