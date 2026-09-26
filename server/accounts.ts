import crypto from 'crypto';
import {
  ACCOUNTS_FILE,
  SESSIONS_FILE,
  SESSION_TTL_MS,
  MAX_LOGIN_ATTEMPTS,
  LOGIN_LOCK_MS,
} from './config';
import { readJsonFile, writeJsonFile } from './fsdb';

export interface Account {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
  role?: string; // 'owner' | 'cashier' (yok = owner)
  parentAccountId?: string; // kasiyer icin hesap sahibi
  position?: string; // personel görevi (örn: Kasiyer, Usta, Çırak)
  salary?: number; // aylık maaş (TL)
  staffNotes?: string; // personel notu
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

export function getAccounts(): Account[] {
  return accounts;
}

export function findAccountById(id: string): Account | undefined {
  return accounts.find((a) => a.id === id);
}

export function findAccountByPhone(phone: string): Account | undefined {
  return accounts.find((a) => a.phone === phone);
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

export function tokenFromRequest(req: { headers: { cookie?: string } }): string | null {
  const header = req.headers.cookie || '';
  const match = header.match(/(?:^|;\s*)sid=([a-f0-9]+)/);
  return match ? match[1] : null;
}

export function accountFromRequest(req: { headers: { cookie?: string } }): Account | null {
  const token = tokenFromRequest(req);
  if (!token) return null;
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  const acc = accounts.find((a) => a.id === session.accountId);
  return acc || null;
}

export function sessionCookie(token: string): string {
  return 'sid=' + token + '; HttpOnly; Path=/; Max-Age=' + Math.floor(SESSION_TTL_MS / 1000) + '; SameSite=Lax';
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
