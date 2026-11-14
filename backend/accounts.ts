import crypto from 'crypto';
import {
  ACCOUNTS_FILE,
  SESSIONS_FILE,
  SESSION_TTL_MS,
  MAX_LOGIN_ATTEMPTS,
  LOGIN_LOCK_MS,
  AUTH_EVENTS_FILE,
} from './config';
import { readJsonFile, writeJsonFile } from './fsdb';

export interface Account {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  username?: string;
  email?: string;
  passwordHash: string;
  createdAt: string;
  role?: string; // 'owner' | 'cashier' (yok = owner)
  parentAccountId?: string; // kasiyer icin hesap sahibi
  position?: string; // personel görevi (örn: Kasiyer, Usta, Çırak)
  salary?: number; // aylık maaş (TL)
  staffNotes?: string; // personel notu
  createdIp?: string; // kayit olunan IP
  lastLoginIp?: string; // son giris IP'si
  lastLoginAt?: string; // son giris zamani (ISO)
  loginCount?: number; // toplam basarili giris sayisi
  loginHistory?: { at: string; ip: string }[]; // son girisler (en fazla 20)
}

export interface Session {
  token: string;
  accountId: string;
  expiresAt: string;
}

let accounts: Account[] = readJsonFile<Account[]>(ACCOUNTS_FILE, []);
let sessions: Session[] = readJsonFile<Session[]>(SESSIONS_FILE, []).filter(
  (s) => new Date(s.expiresAt).getTime() > Date.now()
);

export function normalizePhone(raw: string): string {
  const trimmed = String(raw || '').trim();
  // Harf veya geçersiz sembol varsa kesinlikle geçersiz sayılır
  if (/[a-zA-Z]/.test(trimmed) || /[^\d\s\+\-\(\)]/.test(trimmed)) {
    return '';
  }
  // Sadece rakamları ayıkla
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  // +90 5XX... veya 90 5XX... (12 hane) -> 05XX...
  if (digits.length === 12 && digits.startsWith('90') && digits[2] === '5') {
    return '0' + digits.slice(2);
  }
  // 5XXXXXXXXX (10 hane) -> 05XXXXXXXXX
  if (digits.length === 10 && digits.startsWith('5')) {
    return '0' + digits;
  }
  // 05XXXXXXXXX (11 hane)
  if (digits.length === 11 && digits.startsWith('05')) {
    return digits;
  }
  return '';
}

/**
 * Türkiye GSM Standart Doğrulaması:
 * Sadece gerçek Türkiye GSM numarası (05XXXXXXXXX, 11 hane, 50/53/54/55/59 operatör kodları) kabul edilir.
 * Harf, geçersiz sembol veya sahte rastgele dizilimler (aynı rakamın tekrarı, ardışık geçersiz diziler) kesinlikle engellenir.
 */
export function isValidTurkishPhone(raw: string): boolean {
  if (!raw || typeof raw !== 'string') return false;
  // Harf, özel karakter veya geçersiz sembol kontrolü
  if (/[a-zA-Z]/.test(raw) || /[^\d\s\+\-\(\)]/.test(raw)) {
    return false;
  }

  const norm = normalizePhone(raw);
  // Kesinlikle 11 hane ve 05 ile başlamalı
  if (!/^05\d{9}$/.test(norm)) return false;

  // Operatör kodu kontrolü (50X, 53X, 54X, 55X veya 59X demo)
  const op = norm.slice(1, 3);
  if (!['50', '53', '54', '55', '59'].includes(op)) return false;

  // Demo numarası istisnası (05900000011)
  if (norm === '05900000011') return true;

  // Sahte / Rastgele / Tekrarlayan Geçersiz Dizilim Kontrolleri:
  // 1. Son 8 hanede 6 veya daha fazla aynı rakamın ardışık tekrarı (örn. 05320000000, 05441111111)
  if (/(\d)\1{5,}/.test(norm.slice(3))) return false;

  // 2. Numaranın tamamında 7 veya daha fazla aynı rakamın ardışık tekrarı (örn. 05555555555)
  if (/(\d)\1{6,}/.test(norm)) return false;

  // 3. Sıralı ardışık dizilimler (örn. 05301234567, 05428765432)
  const localPart = norm.slice(3); // 8 hane
  if ('0123456789'.includes(localPart) || '9876543210'.includes(localPart)) {
    return false;
  }

  // 4. Basit 2 haneli tekrar kalıpları (örn. 12121212, 01010101)
  if (localPart === localPart.slice(0, 2).repeat(4)) return false;

  return true;
}

export function getAccounts(): Account[] {
  return accounts;
}

export function findAccountById(id: string): Account | undefined {
  return accounts.find((a) => a.id === id);
}

export function findAccountByPhone(phone: string): Account | undefined {
  const norm = normalizePhone(phone);
  return accounts.find((a) => a.phone === phone || normalizePhone(a.phone) === norm);
}

export function findAccountByPhoneOrUsername(identifier: string): Account | undefined {
  const clean = (identifier || '').trim();
  const lower = clean.toLowerCase();
  const norm = normalizePhone(clean);

  return accounts.find((a) =>
    (a.username && a.username.toLowerCase() === lower) ||
    a.phone === clean ||
    normalizePhone(a.phone) === norm ||
    (lower === 'patron' && (a.username === 'patron' || a.id === 'acc_master_patron')) ||
    (lower === 'omer' && (a.username === 'patron' || a.id === 'acc_master_patron')) ||
    (lower === 'omeryaman' && (a.username === 'patron' || a.id === 'acc_master_patron'))
  );
}

export function addAccount(acc: Account): void {
  accounts.push(acc);
  writeJsonFile(ACCOUNTS_FILE, accounts);
}

export function persistAccounts(): void {
  writeJsonFile(ACCOUNTS_FILE, accounts);
}

export function removeAccount(id: string): void {
  accounts = accounts.filter((a) => a.id !== id);
  writeJsonFile(ACCOUNTS_FILE, accounts);
  removeSessionsForAccount(id);
}

function persistSessions(): void {
  writeJsonFile(SESSIONS_FILE, sessions);
}

export function createSession(accountId: string): Session {
  const session: Session = {
    token: crypto.randomBytes(24).toString('hex'),
    accountId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  sessions.push(session);
  persistSessions();
  return session;
}

export function removeSessionByToken(token: string): void {
  sessions = sessions.filter((s) => s.token !== token);
  persistSessions();
}
export function removeSessionsForAccount(accountId: string): void {
  sessions = sessions.filter((s) => s.accountId !== accountId);
  persistSessions();
}

export function countActiveSessions(accountId: string): number {
  const now = Date.now();
  return sessions.filter(
    (s) => s.accountId === accountId && new Date(s.expiresAt).getTime() > now
  ).length;
}

export function keepOnlySession(accountId: string, token: string): void {
  sessions = sessions.filter((s) => s.accountId !== accountId || s.token === token);
  persistSessions();
}

export function pruneExpiredSessions(): number {
  const before = sessions.length;
  sessions = sessions.filter((s) => new Date(s.expiresAt).getTime() > Date.now());
  if (sessions.length !== before) persistSessions();
  return before - sessions.length;
}

export function tokenFromRequest(req: {
  headers: { cookie?: string; authorization?: string | string[] };
}): string | null {
  const header = req.headers.cookie || '';
  const match = header.match(/(?:^|;\s*)sid=([a-f0-9]+)/);
  if (match) return match[1];

  const rawAuth = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  if (typeof rawAuth === 'string') {
    const bearer = rawAuth.trim().match(/^Bearer\s+([a-f0-9]{32,64})$/i);
    if (bearer) return bearer[1].toLowerCase();
  }
  return null;
}

export function accountFromRequest(req: {
  headers: { cookie?: string; authorization?: string | string[] };
}): Account | null {
  const token = tokenFromRequest(req);
  if (!token) return null;
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  const acc = accounts.find((a) => a.id === session.accountId);
  return acc || null;
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return (
    'sid=' +
    token +
    '; HttpOnly; Path=/; Max-Age=' +
    Math.floor(SESSION_TTL_MS / 1000) +
    '; SameSite=Lax' +
    secure
  );
}

export function destroySessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return 'sid=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax' + secure;
}

// Gercek istemci IP'si: Cloudflare -> nginx -> node zincirinde en guvenilir baslik
// CF-Connecting-IP'dir. Dogrudan erisimde X-Real-IP / X-Forwarded-For'a dusulur.
// IP başlık enjeksiyonlarına karşı sadece geçerli IP karakterleri kabul edilir.
export function clientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const h = req.headers || {};
  const first = (v: string | string[] | undefined): string => {
    if (Array.isArray(v)) return (v[0] || '').trim();
    return String(v || '').split(',')[0].trim();
  };
  const raw =
    first(h['cf-connecting-ip']) ||
    first(h['x-real-ip']) ||
    first(h['x-forwarded-for']) ||
    (req.ip || '') ||
    (req.socket?.remoteAddress || '') ||
    'unknown';
  const sanitized = raw.replace(/[^\w.:-]/g, '').slice(0, 45);
  return sanitized || 'unknown';
}

// ---------------- Cihaz ve Tarayıcı Çözümleyici (User-Agent tespiti) ----------------
export function detectDeviceAndBrowser(userAgent: string): {
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browserInfo: string;
} {
  const ua = (userAgent || '').toLowerCase();
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';

  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    deviceType = 'mobile';
  }

  let browser = 'Modern Tarayıcı';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('opera/') || ua.includes('opr/')) browser = 'Opera';

  let os = 'Cihaz';
  if (ua.includes('windows nt 10.0')) os = 'Win 10/11';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone')) os = 'iPhone';
  else if (ua.includes('ipad')) os = 'iPad';
  else if (ua.includes('mac os') || ua.includes('macintosh')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  return {
    deviceType,
    browserInfo: `${browser} · ${os}`,
  };
}

// ---------------- Gerçek Zamanlı Canlı Oturum Takibi (Son 5 dk aktifler) ----------------
export interface ActiveSessionHeartbeat {
  accountId: string;
  ip: string;
  userAgent: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browserInfo: string;
  lastSeenAt: string;
  lastSeenMs: number;
}

const activeHeartbeats = new Map<string, ActiveSessionHeartbeat>();

export function touchActiveSession(accountId: string, ip: string, userAgent: string): void {
  const now = Date.now();
  const { deviceType, browserInfo } = detectDeviceAndBrowser(userAgent);
  activeHeartbeats.set(accountId, {
    accountId,
    ip: ip || 'unknown',
    userAgent: userAgent || 'unknown',
    deviceType,
    browserInfo,
    lastSeenAt: new Date(now).toISOString(),
    lastSeenMs: now,
  });
}

export function getRecentActiveSessions(windowMs = 5 * 60 * 1000): ActiveSessionHeartbeat[] {
  const now = Date.now();
  const result: ActiveSessionHeartbeat[] = [];
  for (const [accId, hb] of activeHeartbeats.entries()) {
    if (now - hb.lastSeenMs <= windowMs) {
      result.push(hb);
    } else {
      activeHeartbeats.delete(accId);
    }
  }
  return result;
}

export function isAccountRecentlyActive(accountId: string, windowMs = 5 * 60 * 1000): boolean {
  const hb = activeHeartbeats.get(accountId);
  if (!hb) return false;
  return Date.now() - hb.lastSeenMs <= windowMs;
}

// Basarili giris/kayit kaydi: IP + zaman + sayac + gecmis (en fazla 20)
export function recordLogin(acc: Account, ip: string): void {
  const at = new Date().toISOString();
  acc.lastLoginIp = ip;
  acc.lastLoginAt = at;
  acc.loginCount = (acc.loginCount || 0) + 1;
  const hist = acc.loginHistory || [];
  hist.unshift({ at, ip });
  acc.loginHistory = hist.slice(0, 20);
  persistAccounts();
}

// ---------------- Kimlik olay gunlugu (admin paneli "Olaylar" sekmesi) ----------------
export interface AuthEvent {
  at: string;
  type: 'register' | 'login_ok' | 'login_fail' | 'locked' | 'admin_kick' | 'admin_delete';
  phone: string;
  ip: string;
}

export function logAuthEvent(type: AuthEvent['type'], phone: string, ip: string): void {
  try {
    const list = readJsonFile<AuthEvent[]>(AUTH_EVENTS_FILE, []);
    list.unshift({ at: new Date().toISOString(), type, phone, ip });
    writeJsonFile(AUTH_EVENTS_FILE, list.slice(0, 500));
  } catch {
    // log yazilamazsa girisi engelleme
  }
}

export function getAuthEvents(limit: number): AuthEvent[] {
  const n = Math.max(1, Math.min(500, Math.floor(limit) || 100));
  return readJsonFile<AuthEvent[]>(AUTH_EVENTS_FILE, []).slice(0, n);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = (stored || '').split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  if (test.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(test, 'hex'), Buffer.from(hash, 'hex'));
}

export function publicAccount(a: Account): {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  createdAt: string;
  role: string;
  position?: string;
  salary?: number;
  staffNotes?: string;
} {
  return {
    id: a.id,
    shopName: a.shopName,
    ownerName: a.ownerName,
    phone: a.phone,
    createdAt: a.createdAt,
    role: a.role || 'owner',
    position: a.position || undefined,
    salary: typeof a.salary === 'number' ? a.salary : undefined,
    staffNotes: a.staffNotes || undefined,
  };
}

// ---------------- Giris denemesi limiti (brute force korumasi) ----------------
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function isLoginLocked(phone: string): number {
  const att = loginAttempts.get(phone);
  if (!att) return 0;
  if (att.lockedUntil > Date.now()) return att.lockedUntil - Date.now();
  if (att.lockedUntil > 0) {
    loginAttempts.delete(phone); // kilit suresi dolmus, sifirla
  }
  return 0;
}

export function registerFailedLogin(phone: string): void {
  // DoS / Bellek şişmesini önle: harita çok büyürse süresi dolmuş kilitleri temizle
  if (loginAttempts.size > 1000) {
    const now = Date.now();
    for (const [k, v] of loginAttempts.entries()) {
      if (v.lockedUntil <= now && v.count === 0) loginAttempts.delete(k);
    }
  }
  const att = loginAttempts.get(phone) || { count: 0, lockedUntil: 0 };
  att.count += 1;
  if (att.count >= MAX_LOGIN_ATTEMPTS) {
    att.lockedUntil = Date.now() + LOGIN_LOCK_MS;
    att.count = 0;
  }
  loginAttempts.set(phone, att);
}

export function clearLoginAttempts(phone: string): void {
  loginAttempts.delete(phone);
}

export function loginAttemptsLeft(phone: string): number {
  const att = loginAttempts.get(phone);
  return att ? Math.max(0, MAX_LOGIN_ATTEMPTS - att.count) : MAX_LOGIN_ATTEMPTS;
}
