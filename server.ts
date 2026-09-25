import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  AppState,
  Customer,
  Transaction,
  ReminderLog,
  CashRegister,
  WSEvent,
  ShopProfile,
  DailyClosing,
  Product,
  StockMovement,
  Appointment,
  RestaurantTable,
  RepairTicket,
  BusinessSector,
} from './src/types';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---------------- Hesaplar (dükkan kayıt) & Oturumlar ----------------
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const SHOPS_DIR = path.join(DATA_DIR, 'shops');
if (!fs.existsSync(SHOPS_DIR)) {
  fs.mkdirSync(SHOPS_DIR, { recursive: true });
}

interface Account {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
  role?: string; // 'owner' | 'cashier' (yok = owner)
  parentAccountId?: string; // kasiyer icin hesap sahibi
}

interface Session {
  token: string;
  accountId: string;
  expiresAt: string;
}

function readJsonFile<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
    }
  } catch (err) {
    console.error('Failed reading', file, err);
  }
  return fallback;
}

function writeJsonFile(file: string, data: unknown) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing', file, err);
  }
}

let accounts: Account[] = readJsonFile<Account[]>(ACCOUNTS_FILE, []);
let sessions: Session[] = readJsonFile<Session[]>(SESSIONS_FILE, []).filter(
  (s) => new Date(s.expiresAt).getTime() > Date.now()
);

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = (stored || '').split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  if (test.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(test, 'hex'), Buffer.from(hash, 'hex'));
}

function publicAccount(a: Account) {
  return { id: a.id, shopName: a.shopName, ownerName: a.ownerName, phone: a.phone, createdAt: a.createdAt, role: a.role || 'owner' };
}

// Boş state — demo/seed/fake veri YOK, her yeni dükkan tertemiz başlar
function emptyState(seed?: { storeName: string; ownerName: string; phone: string }): AppState {
  return {
    storeName: seed?.storeName || 'Yeni Dükkan',
    shopProfile: {
      storeName: seed?.storeName || '',
      ownerName: seed?.ownerName || '',
      businessField: 'Bakkal / Market / Büfe',
      sectorKey: 'bakkal_market',
      employeeCount: '1',
      phone: seed?.phone || '',
      cityDistrict: '',
      dailyTarget: 2500,
      slogan: '',
      isConfigured: false,
      isVip: false,
    },
    customers: [],
    transactions: [],
    reminderLogs: [],
    dailyClosings: [],
    products: [],
    stockMovements: [],
    appointments: [],
    tables: [],
    repairTickets: [],
    lastUpdated: new Date().toISOString(),
  };
}

const shopStateCache = new Map<string, AppState>();

function shopStateFile(accountId: string): string {
  return path.join(SHOPS_DIR, accountId + '.json');
}

function loadShopState(accountId: string): AppState {
  const cached = shopStateCache.get(accountId);
  if (cached) return cached;
  let st: AppState | null = null;
  const file = shopStateFile(accountId);
  if (fs.existsSync(file)) {
    try {
      st = JSON.parse(fs.readFileSync(file, 'utf-8')) as AppState;
    } catch (err) {
      console.error('Shop state okunamadi, yeniden olusturuluyor:', err);
      st = null;
    }
  }
  if (!st || !Array.isArray(st.customers) || !Array.isArray(st.transactions)) {
    const acc = accounts.find((a) => a.id === accountId);
    st = emptyState(acc ? { storeName: acc.shopName, ownerName: acc.ownerName, phone: acc.phone } : undefined);
    writeJsonFile(file, st);
  }
  if (!st) st = emptyState();
  if (!st.shopProfile) st.shopProfile = emptyState().shopProfile;
  if (!Array.isArray(st.dailyClosings)) st.dailyClosings = [];
  if (!Array.isArray(st.products)) st.products = [];
  if (!Array.isArray(st.stockMovements)) st.stockMovements = [];
  if (!Array.isArray(st.appointments)) st.appointments = [];
  if (!Array.isArray(st.tables)) st.tables = [];
  if (!Array.isArray(st.repairTickets)) st.repairTickets = [];
  if (!Array.isArray(st.reminderLogs)) st.reminderLogs = [];
  shopStateCache.set(accountId, st);
  return st;
}

function persistShopState(accountId: string, st: AppState) {
  st.lastUpdated = new Date().toISOString();
  writeJsonFile(shopStateFile(accountId), st);
}

// Istek baglami: her HTTP/ws istegi kendi dukkaninin state'i ile calisir
type ReqCtx = { accountId: string; state: AppState; role: string };
const als = new AsyncLocalStorage<ReqCtx>();

function S(): AppState {
  const ctx = als.getStore();
  if (!ctx) throw new Error('Istek baglami bulunamadi (auth middleware disinda cagri?)');
  return ctx.state;
}

function saveState() {
  const ctx = als.getStore();
  if (!ctx) {
    console.error('saveState cagrisi baglam disinda, yok sayildi.');
    return;
  }
  persistShopState(ctx.accountId, ctx.state);
}

function role(): string {
  return als.getStore()?.role || 'owner';
}

// ---------------- Oturum (cookie) yardimcilari ----------------
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 gun

function createSession(accountId: string): Session {
  const session: Session = {
    token: crypto.randomBytes(24).toString('hex'),
    accountId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  sessions.push(session);
  writeJsonFile(SESSIONS_FILE, sessions);
  return session;
}

function tokenFromRequest(req: { headers: { cookie?: string } }): string | null {
  const header = req.headers.cookie || '';
  const match = header.match(/(?:^|;\s*)sid=([a-f0-9]+)/);
  return match ? match[1] : null;
}

function accountFromRequest(req: { headers: { cookie?: string } }): Account | null {
  const token = tokenFromRequest(req);
  if (!token) return null;
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  const acc = accounts.find((a) => a.id === session.accountId);
  return acc || null;
}

function sessionCookie(token: string): string {
  return 'sid=' + token + '; HttpOnly; Path=/; Max-Age=' + Math.floor(SESSION_TTL_MS / 1000) + '; SameSite=Lax';
}

// ---------------- Giris denemesi limiti (brute force korumasi) ----------------
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000; // 15 dakika kilit
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function isLoginLocked(phone: string): number {
  const att = loginAttempts.get(phone);
  if (!att) return 0;
  if (att.lockedUntil > Date.now()) return att.lockedUntil - Date.now();
  if (att.lockedUntil > 0) {
    loginAttempts.delete(phone); // kilit suresi dolmus, sifirla
  }
  return 0;
}

function registerFailedLogin(phone: string) {
  const att = loginAttempts.get(phone) || { count: 0, lockedUntil: 0 };
  att.count += 1;
  if (att.count >= MAX_LOGIN_ATTEMPTS) {
    att.lockedUntil = Date.now() + LOGIN_LOCK_MS;
    att.count = 0;
  }
  loginAttempts.set(phone, att);
}

// Calculate Live Cash & Balances
function calculateCashRegister(): CashRegister {
  const todayStr = new Date().toISOString().split('T')[0];
  let todayCash = 0;
  let todayCard = 0;
  let todayBank = 0;
  let todayExpense = 0;

  for (const tx of S().transactions) {
    if (tx.date.startsWith(todayStr)) {
      if (tx.type === 'tahsilat') {
        if (tx.paymentMethod === 'nakit') todayCash += tx.amount;
        else if (tx.paymentMethod === 'kart') todayCard += tx.amount;
        else if (tx.paymentMethod === 'havale') todayBank += tx.amount;
      } else if (tx.type === 'gider' || tx.type === 'masraf') {
        todayExpense += tx.amount;
      }
    }
  }

  const todayTotalIncome = todayCash + todayCard + todayBank;
  const netTodayCash = todayCash - todayExpense;

  let totalReceivables = 0;
  let overdueCount = 0;
  let dueTodayCount = 0;

  for (const c of S().customers) {
    if (c.balance > 0) {
      totalReceivables += c.balance;
    }
    if (c.subscriptionPlan?.enabled && c.subscriptionPlan.nextDueDate) {
      if (c.subscriptionPlan.nextDueDate < todayStr) {
        overdueCount++;
      } else if (c.subscriptionPlan.nextDueDate === todayStr) {
        dueTodayCount++;
      }
    }
  }

  return {
    todayCash,
    todayCard,
    todayBank,
    todayTotalIncome,
    todayExpense,
    netTodayCash,
    totalReceivables,
    overdueCount,
    dueTodayCount,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // ---------------- Otomatik bakim: oturum temizligi + gunluk yedek ----------------
  const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  function cleanupSessions() {
    const now = Date.now();
    const before = sessions.length;
    sessions = sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
    if (sessions.length !== before) writeJsonFile(SESSIONS_FILE, sessions);
  }

  function dailyBackupAll() {
    const date = new Date().toISOString().split('T')[0];
    for (const acc of accounts) {
      try {
        const st = loadShopState(acc.id);
        const dir = path.join(BACKUPS_DIR, acc.id);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        writeJsonFile(path.join(dir, date + '.json'), st);
        // son 30 gun sakla
        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
        for (const f of files.slice(0, Math.max(0, files.length - 30))) {
          fs.unlinkSync(path.join(dir, f));
        }
      } catch (err) {
        console.error('Gunluk yedek alinamadi:', acc.id, err);
      }
    }
  }

  setInterval(cleanupSessions, 60 * 60 * 1000); // saatte bir
  setInterval(dailyBackupAll, 24 * 60 * 60 * 1000); // gunluk
  setTimeout(dailyBackupAll, 15 * 1000); // ilk acilista bugunun yedeği

  // ---------------- Auth: dükkan kayit / giris / cikis ----------------
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const body = req.body || {};
    const shopName = String(body.shopName || '').trim();
    const ownerName = String(body.ownerName || '').trim();
    const phone = String(body.phone || '').replace(/\s+/g, '');
    const password = String(body.password || '');
    if (!shopName || !ownerName || !phone || password.length < 4) {
      return res.status(400).json({ error: 'Dukkan adi, yetkili adi, telefon ve en az 4 haneli sifre gerekli.' });
    }
    if (accounts.some((a) => a.phone === phone)) {
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
    accounts.push(acc);
    writeJsonFile(ACCOUNTS_FILE, accounts);
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
    const acc = accounts.find((a) => a.phone === phone);
    if (!acc || !verifyPassword(password, acc.passwordHash)) {
      registerFailedLogin(phone);
      const att = loginAttempts.get(phone);
      const left = att ? Math.max(0, MAX_LOGIN_ATTEMPTS - att.count) : MAX_LOGIN_ATTEMPTS;
      return res.status(401).json({
        error: 'Telefon veya sifre hatali.' + (left > 0 && left <= 2 ? ` (${left} deneme hakkiniz kaldi)` : ''),
      });
    }
    loginAttempts.delete(phone);
    const session = createSession(acc.id);
    res.setHeader('Set-Cookie', sessionCookie(session.token));
    res.json({ success: true, account: publicAccount(acc) });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = tokenFromRequest(req);
    if (token) {
      sessions = sessions.filter((s) => s.token !== token);
      writeJsonFile(SESSIONS_FILE, sessions);
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
    writeJsonFile(ACCOUNTS_FILE, accounts);
    // Guvenlik: sifre degisince diger tum oturumlari kapat, sadece bu cihaz kalsin
    const keep = tokenFromRequest(req);
    sessions = sessions.filter((s) => s.accountId !== acc.id || s.token === keep);
    writeJsonFile(SESSIONS_FILE, sessions);
    res.json({ success: true });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const acc = accountFromRequest(req);
    if (!acc) return res.status(401).json({ error: 'Oturum bulunamadi.' });
    res.json({ account: publicAccount(acc) });
  });

  // Sadece dukkan sahibi (owner) icin yardimci: oturum yoksa 401, rol degilse 403
  function requireOwner(req: Request, res: Response): Account | null {
    const acc = accountFromRequest(req);
    if (!acc) {
      res.status(401).json({ error: 'Oturum bulunamadi.' });
      return null;
    }
    if ((acc.role || 'owner') !== 'owner') {
      res.status(403).json({ error: 'Bu islem sadece dukkan sahibine aciktir.' });
      return null;
    }
    return acc;
  }

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
    if (accounts.some((a) => a.phone === phone)) {
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
    };
    accounts.push(staff);
    writeJsonFile(ACCOUNTS_FILE, accounts);
    res.json({ success: true, account: publicAccount(staff) });
  });

  // Personel listesi
  app.get('/api/auth/staff', (req: Request, res: Response) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    const list = accounts
      .filter((a) => a.parentAccountId === owner.id)
      .map((a) => ({ ...publicAccount(a), createdAt: a.createdAt }));
    res.json({ staff: list });
  });

  // Personel sil
  app.delete('/api/auth/staff/:id', (req: Request, res: Response) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    const id = req.params.id;
    const target = accounts.find((a) => a.id === id && a.parentAccountId === owner.id);
    if (!target) return res.status(404).json({ error: 'Personel bulunamadi.' });
    accounts = accounts.filter((a) => a.id !== id);
    sessions = sessions.filter((s) => s.accountId !== id);
    writeJsonFile(ACCOUNTS_FILE, accounts);
    writeJsonFile(SESSIONS_FILE, sessions);
    res.json({ success: true });
  });

  // Koruma: /api/* icin giris zorunlu (auth ve health haric) + rol kisitlari
  const CASHIER_FORBIDDEN_ALWAYS = ['/backup'];
  const CASHIER_FORBIDDEN_MUTATION = ['/shop-profile', '/products', '/vip/'];
  app.use('/api', (req: Request, res: Response, next) => {
    const p = req.path;
    if (p === '/health' || p.startsWith('/auth/')) return next();
    const acc = accountFromRequest(req);
    if (!acc) return res.status(401).json({ error: 'Lutfen giris yapin.' });
    const accRole = acc.role || 'owner';
    if (accRole === 'cashier') {
      if (CASHIER_FORBIDDEN_ALWAYS.some((o) => p.startsWith(o))) {
        return res.status(403).json({ error: 'Bu islem sadece dukkan sahibine aciktir.' });
      }
      if (req.method !== 'GET' && CASHIER_FORBIDDEN_MUTATION.some((o) => p.startsWith(o))) {
        return res.status(403).json({ error: 'Bu islem sadece dukkan sahibine aciktir.' });
      }
    }
    als.run({ accountId: acc.id, role: accRole, state: loadShopState(acc.id) }, next);
  });


  const server = http.createServer(app);

  // WebSocket Server setup
  const wss = new WebSocketServer({ server });
  const clients = new Map<WebSocket, string>(); // ws -> accountId

  function broadcast(event: WSEvent) {
    const ctx = als.getStore();
    if (!ctx) return;
    const payload = JSON.stringify(event);
    for (const [client, accountId] of clients) {
      if (accountId !== ctx.accountId) continue;
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (e) {
          console.error('Error sending WS message:', e);
        }
      }
    }
  }

  wss.on('connection', (ws, req) => {
    const acc = accountFromRequest(req);
    if (!acc) {
      ws.close(4001, 'unauthorized');
      return;
    }
    const ctx: ReqCtx = { accountId: acc.id, role: acc.role || 'owner', state: loadShopState(acc.id) };
    clients.set(ws, acc.id);

    als.run(ctx, () => {
      const st = ctx.state;
      const initEvent: WSEvent = {
        type: 'INIT',
        payload: {
          customers: st.customers,
          transactions: st.transactions,
          cash: calculateCashRegister(),
          reminderLogs: st.reminderLogs,
          shopProfile: st.shopProfile,
          dailyClosings: st.dailyClosings,
          products: st.products || [],
          stockMovements: st.stockMovements || [],
          appointments: st.appointments || [],
          tables: st.tables || [],
          repairTickets: st.repairTickets || [],
        },
      };
      ws.send(JSON.stringify(initEvent));
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  // REST API Routes

  // 1. Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), clientsCount: clients.size });
  });

  // 1b. Tam yedek indir (JSON) — sadece owner
  app.get('/api/backup', (_req, res) => {
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Disposition', `attachment; filename="esnaf-yedek-${today}.json"`);
    res.json({ version: 1, exportedAt: new Date().toISOString(), state: S() });
  });

  // 1c. Yedek geri yukle (JSON) — sadece owner, dogrulamali
  app.post('/api/backup/restore', (req: Request, res: Response) => {
    const ns = (req.body || {}).state;
    if (!ns || !Array.isArray(ns.customers) || !Array.isArray(ns.transactions)) {
      return res.status(400).json({ error: 'Gecersiz yedek dosyasi.' });
    }
    const st = S();
    st.customers = ns.customers;
    st.transactions = ns.transactions;
    st.reminderLogs = Array.isArray(ns.reminderLogs) ? ns.reminderLogs : [];
    st.dailyClosings = Array.isArray(ns.dailyClosings) ? ns.dailyClosings : [];
    st.products = Array.isArray(ns.products) ? ns.products : [];
    st.stockMovements = Array.isArray(ns.stockMovements) ? ns.stockMovements : [];
    st.appointments = Array.isArray(ns.appointments) ? ns.appointments : [];
    st.tables = Array.isArray(ns.tables) ? ns.tables : [];
    st.repairTickets = Array.isArray(ns.repairTickets) ? ns.repairTickets : [];
    if (ns.shopProfile && typeof ns.shopProfile === 'object') {
      st.shopProfile = { ...st.shopProfile, ...ns.shopProfile };
      st.storeName = ns.shopProfile.storeName || st.storeName;
    }
    saveState();
    broadcast({
      type: 'INIT',
      payload: {
        customers: st.customers,
        transactions: st.transactions,
        cash: calculateCashRegister(),
        reminderLogs: st.reminderLogs,
        shopProfile: st.shopProfile,
        dailyClosings: st.dailyClosings,
        products: st.products || [],
        stockMovements: st.stockMovements || [],
        appointments: st.appointments || [],
        tables: st.tables || [],
        repairTickets: st.repairTickets || [],
      },
    });
    res.json({ success: true });
  });

  // 2. Full state fetch
  app.get('/api/data', (_req, res) => {
    res.json({
      storeName: S().storeName,
      shopProfile: S().shopProfile,
      dailyClosings: S().dailyClosings,
      customers: S().customers,
      transactions: S().transactions,
      reminderLogs: S().reminderLogs,
      products: S().products || [],
      stockMovements: S().stockMovements || [],
      cash: calculateCashRegister(),
      lastUpdated: S().lastUpdated,
    });
  });

  // 3. Create or update customer
  app.post('/api/customers', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.name || !data.phone) {
      return res.status(400).json({ error: 'Müşteri adı ve telefon numarası zorunludur.' });
    }

    let customer: Customer;
    const now = new Date().toISOString();

    if (data.id) {
      // Update
      const index = S().customers.findIndex((c) => c.id === data.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Müşteri bulunamadı.' });
      }
      customer = {
        ...S().customers[index],
        ...data,
        updatedAt: now,
      };
      S().customers[index] = customer;
    } else {
      // Create
      customer = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: data.name.trim(),
        phone: data.phone.trim(),
        businessCategory: data.businessCategory || 'bakkal_market',
        balance: Number(data.initialBalance || 0),
        notes: data.notes || '',
        subscriptionPlan: data.subscriptionPlan || undefined,
        createdAt: now,
        updatedAt: now,
      };

      // If initial balance > 0, create an initial veresiye transaction
      if (customer.balance > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const initialTx: Transaction = {
          id: `tx_${Date.now()}`,
          customerId: customer.id,
          customerName: customer.name,
          type: 'veresiye',
          amount: customer.balance,
          paymentMethod: 'veresiye',
          description: 'Açılış veresiye devir bakiyesi',
          date: `${todayStr} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
          createdAt: now,
        };
        S().transactions.unshift(initialTx);
      }

      S().customers.unshift(customer);
    }

    saveState();
    const cash = calculateCashRegister();
    broadcast({ type: 'CUSTOMER_UPDATED', payload: { customer, cash } });

    res.json({ success: true, customer, cash });
  });

  // 4. Delete customer
  app.delete('/api/customers/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    S().customers = S().customers.filter((c) => c.id !== id);
    saveState();
    const cash = calculateCashRegister();
    broadcast({ type: 'CUSTOMER_DELETED', payload: { customerId: id, cash } });
    res.json({ success: true, customerId: id, cash });
  });

  // 5. Create Transaction (Veresiye ekle, Tahsilat al, Kasa çıkışı yap)
  app.post('/api/transactions', (req: Request, res: Response) => {
    const { customerId, type, amount, paymentMethod, description } = req.body;
    const parsedAmount = Number(amount);

    if (!type || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Geçerli bir işlem türü ve tutar giriniz.' });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    let customer: Customer | undefined;
    let customerName = 'Genel Kasa Hareketi';

    if (customerId) {
      customer = S().customers.find((c) => c.id === customerId);
      if (customer) {
        customerName = customer.name;
        if (type === 'veresiye') {
          // Add to debt
          customer.balance += parsedAmount;
        } else if (type === 'tahsilat') {
          // Pay off debt
          customer.balance -= parsedAmount;
          customer.lastPaymentDate = todayStr;

          // If this customer has an active subscription and paid their subscription amount, auto-advance nextDueDate
          if (customer.subscriptionPlan?.enabled && customer.subscriptionPlan.nextDueDate) {
            const currentDue = new Date(customer.subscriptionPlan.nextDueDate);
            if (customer.subscriptionPlan.interval === 'aylik') {
              currentDue.setMonth(currentDue.getMonth() + 1);
            } else if (customer.subscriptionPlan.interval === 'haftalik') {
              currentDue.setDate(currentDue.getDate() + 7);
            } else if (customer.subscriptionPlan.interval === '3_aylik') {
              currentDue.setMonth(currentDue.getMonth() + 3);
            } else if (customer.subscriptionPlan.interval === 'yillik') {
              currentDue.setFullYear(currentDue.getFullYear() + 1);
            } else if (customer.subscriptionPlan.interval === 'periyodik_bakim') {
              currentDue.setMonth(currentDue.getMonth() + 6);
            }
            customer.subscriptionPlan.nextDueDate = currentDue.toISOString().split('T')[0];
          }
        }
        customer.updatedAt = now.toISOString();
      }
    }

    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      customerId: customerId || '',
      customerName,
      type,
      amount: parsedAmount,
      paymentMethod: paymentMethod || 'nakit',
      description: description || (type === 'veresiye' ? 'Veresiye Borç Yazıldı' : type === 'tahsilat' ? 'Ödeme Alındı' : 'Dükkan Masrafı'),
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };

    S().transactions.unshift(transaction);
    saveState();

    const cash = calculateCashRegister();
    broadcast({
      type: 'TRANSACTION_CREATED',
      payload: { transaction, customer: customer || undefined, cash },
    });

    res.json({ success: true, transaction, customer, cash });
  });

  // 6. Record Reminder Sent (WhatsApp / SMS)
  app.post('/api/reminders/send', (req: Request, res: Response) => {
    const { customerId, channel, message, type } = req.body;
    const customer = S().customers.find((c) => c.id === customerId);

    const reminderLog: ReminderLog = {
      id: `rem_${Date.now()}`,
      customerId: customerId || '',
      customerName: customer ? customer.name : 'Müşteri',
      phone: customer ? customer.phone : '',
      channel: channel || 'whatsapp',
      message: message || '',
      status: 'gonderildi',
      sentAt: new Date().toLocaleString('tr-TR'),
      type: type || 'veresiye',
    };

    S().reminderLogs.unshift(reminderLog);
    saveState();

    broadcast({ type: 'REMINDER_SENT', payload: reminderLog });
    res.json({ success: true, reminderLog });
  });

  // 7. Gemini AI Smart Reminder Crafter
  app.post('/api/reminders/gemini-craft', async (req: Request, res: Response) => {
    const { customerName, balance, businessType, reminderType, tone, customNote, nextDueDate } = req.body;

    // Fallback template generator if no API key or on error
    const fallbackMessage = (t: string) => {
      if (reminderType === 'aidat') {
        return `İyi günler ${customerName}, ${nextDueDate ? `${nextDueDate} tarihli ` : ''}üyelik aidat dönemi gelmiştir. Kalan tutar: ${balance} TL'dir. Kolaylıklar dileriz.`;
      } else if (reminderType === 'bakim') {
        return `Merhaba ${customerName}, periyodik cihaz bakım ve kontrol zamanınız gelmiştir. Randevu için bize bu numaradan ulaşabilirsiniz. Hayırlı günler dileriz.`;
      }
      if (t === 'esnaf') {
        return `Selamlar ${customerName}, dükkan hesabınızda ${balance} TL bakiyeniz bulunmaktadır. Müsait olduğunuzda uğrarsanız seviniriz, hayırlı işler, bereketli günler.`;
      } else if (t === 'resmi') {
        return `Sayın ${customerName}, işletmemizde kayıtlı ${balance} TL tutarındaki cari bakiyenizi bilginize sunar, iyi çalışmalar dileriz.`;
      }
      return `Merhaba ${customerName}, hesabınızda kalan ${balance} TL bakiyeyi hatırlatmak istedik. Gösterdiğiniz ilgiye teşekkür eder, hayırlı günler dileriz.`;
    };

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ message: fallbackMessage(tone || 'kibar') });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Sen Türkiye'deki samimi, saygılı ve dürüst bir mahalle esnafı veya KOBİ işletmecisisin.
Aşağıdaki müşteri için WhatsApp veya SMS üzerinden gönderilecek, kaba olmayan, müşteriyi kırmayacak ama borcunu veya periyodik ödemesini/bakımını hatırlatacak bir mesaj hazırla.

Bilgiler:
- Müşteri Adı: ${customerName}
- Kalan Bakiye: ${balance} TL
- İşletme Türü: ${businessType || 'Mahalle İşletmesi'}
- Hatırlatma Konusu: ${reminderType || 'Veresiye / Bakiye'}
- İstenen Üslup / Ton: ${tone || 'Kibar & Samimi'} (seçenekler: esnaf_samimiyeti, kibar, resmi)
- Özel Not / Detay: ${customNote || 'Yok'}
${nextDueDate ? `- Son Ödeme / Randevu Tarihi: ${nextDueDate}` : ''}

Kurallar:
1. Sadece doğrudan gönderilecek Türkçe mesaj metnini üret. Tırnak işareti, başlık veya açıklama ekleme.
2. Mesaj 2-3 cümleyi geçmesin, WhatsApp'ta kolay okunabilir ve sıcak olsun.
3. Kaba, icra dili gibi soğuk ifadeler ASLA kullanma; esnaf nezaketiyle yaz.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const generated = response.text ? response.text.trim() : fallbackMessage(tone);
      res.json({ message: generated });
    } catch (err) {
      console.error('Gemini crafting error, using fallback:', err);
      res.json({ message: fallbackMessage(tone || 'kibar') });
    }
  });

  // 8. Excel / CSV Export
  app.get('/api/export/csv', (_req, res) => {
    let csv = 'Müşteri Adı;Telefon;İşletme Kategorisi;Güncel Bakiye (TL);Abonelik/Periyot;Son Ödeme Tarihi;Notlar\r\n';
    for (const c of S().customers) {
      const sub = c.subscriptionPlan?.enabled ? `${c.subscriptionPlan.title} (${c.subscriptionPlan.interval})` : '-';
      csv += `"${c.name}";"${c.phone}";"${c.businessCategory}";"${c.balance}";"${sub}";"${c.lastPaymentDate || '-'}";"${(c.notes || '').replace(/"/g, '""')}"\r\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="veresiye_ve_musteri_listesi.csv"');
    // UTF-8 BOM so Excel opens Turkish characters correctly
    res.send('\uFEFF' + csv);
  });

  // 9. Shop Profile Routes (Dükkan Kayıt & Profil Bilgileri)
  app.get('/api/shop-profile', (_req, res) => {
    res.json({ profile: S().shopProfile });
  });

  app.post('/api/shop-profile', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.storeName) {
      return res.status(400).json({ error: 'Dükkan adı zorunludur.' });
    }

    const updatedProfile: ShopProfile = {
      storeName: data.storeName.trim(),
      ownerName: (data.ownerName || 'Esnaf').trim(),
      businessField: data.businessField || 'Bakkal / Market',
      sectorKey: data.sectorKey || S().shopProfile?.sectorKey || 'bakkal_market',
      employeeCount: data.employeeCount || '1',
      phone: (data.phone || '').trim(),
      cityDistrict: (data.cityDistrict || '').trim(),
      dailyTarget: Number(data.dailyTarget) || 2500,
      slogan: (data.slogan || '').trim(),
      isConfigured: true,
      isVip: data.isVip !== undefined ? Boolean(data.isVip) : (S().shopProfile?.isVip ?? true),
    };

    S().shopProfile = updatedProfile;
    S().storeName = updatedProfile.storeName;
    saveState();

    broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: updatedProfile });
    res.json({ success: true, profile: updatedProfile });
  });

  // 10. Daily Closings Routes (Gün Sonu Z Raporları)
  app.get('/api/daily-closings', (_req, res) => {
    res.json({ closings: S().dailyClosings || [] });
  });

  app.post('/api/daily-closings', (req: Request, res: Response) => {
    const { actualCashCount, note, closedBy } = req.body;
    const cash = calculateCashRegister();

    const expectedCash = cash.netTodayCash;
    const actual = Number(actualCashCount) || 0;
    const diff = actual - expectedCash;

    const todayStr = new Date().toISOString().split('T')[0];
    const newClosing: DailyClosing = {
      id: `close_${Date.now()}`,
      date: todayStr,
      closedAt: new Date().toISOString(),
      expectedCash,
      actualCashCount: actual,
      diffAmount: diff,
      totalIncomeToday: cash.todayTotalIncome,
      todayCash: cash.todayCash,
      todayCard: cash.todayCard,
      todayBank: cash.todayBank,
      todayExpense: cash.todayExpense,
      netProfitToday: cash.todayTotalIncome - cash.todayExpense,
      note: note || '',
      closedBy: closedBy || S().shopProfile?.ownerName || 'Kasiyer / Esnaf',
    };

    if (!S().dailyClosings) {
      S().dailyClosings = [];
    }

    // Replace if closing already exists for today or unshift
    const existingIdx = S().dailyClosings.findIndex((c) => c.date === todayStr);
    if (existingIdx !== -1) {
      S().dailyClosings[existingIdx] = newClosing;
    } else {
      S().dailyClosings.unshift(newClosing);
    }

    saveState();
    broadcast({ type: 'DAILY_CLOSING_CREATED', payload: newClosing });
    res.json({ success: true, closing: newClosing });
  });

  // 11. VIP AI Shop Consultant & Live Support (Yapay Zeka Esnaf Danışmanı)
  app.post('/api/vip/ai-consultant', async (req: Request, res: Response) => {
    const { message, topic } = req.body;
    const profile = S().shopProfile;
    const cash = calculateCashRegister();

    // Context for AI
    const shopContext = `
Dükkan Adı: ${profile?.storeName || 'Mahalle Esnafı'}
Faaliyet Alanı / Sektör: ${profile?.businessField || 'Küçük İşletme'}
Dükkan Sahibi: ${profile?.ownerName || 'Esnaf'}
Çalışan Sayısı: ${profile?.employeeCount || '1'} kişi
Şehir / Semt: ${profile?.cityDistrict || 'Türkiye'}
Bugünkü Toplam Gelir: ${cash.todayTotalIncome} TL (Nakit: ${cash.todayCash} TL, Kart: ${cash.todayCard} TL, IBAN: ${cash.todayBank} TL)
Bugünkü Dükkan Harcamaları / Masraf: ${cash.todayExpense} TL
Bugünkü Net Kasa Kârı: ${cash.todayTotalIncome - cash.todayExpense} TL
Günlük Ciro Hedefi: ${profile?.dailyTarget || 2500} TL
`;

    // High quality intelligent fallback if Gemini API key not present
    const getSmartFallback = (t: string, userMsg?: string) => {
      if (t === 'profile') {
        return {
          title: 'Dükkan Profil & Vitrin İyileştirme Tavsiyeleri',
          advice: `Sayın ${profile?.ownerName || 'Esnaf'}, ${profile?.storeName || 'Dükkanınız'} için mahallede müşteri çekim gücünü artıracak 3 öncelikli adım:
1. **Google Haritalar & Tabela:** Dükkan tabelanızda ve Google Haritalar profilinizde "${profile?.businessField}" anahtar kelimesini ve çalışma saatlerinizi güncelleyin. Fotoğraflı profiller %45 daha çok müşteri çeker.
2. **Kasa Önü Hızlı Ürün Alanı:** Kasa yanına sakız, atıştırmalık, kolonya gibi anlık satın alınan 10-50 TL'lik sepet genişletici ürünler yerleştirin.
3. **Müşteri Hitap Sloganı:** Vitrininize "${profile?.slogan || 'Güler yüzlü hizmet, bereketli alışveriş'}" afişi asarak samimiyeti ön plana çıkarın.`,
          suggestions: [
            'Google Haritalar açıklamasını optimize et',
            'Fiyat etiketlerini ve vitrini yenile',
            'Kasa önü sepet kampanyası yap',
          ],
        };
      }
      if (t === 'expenses') {
        return {
          title: 'Giderleri Azaltma & Toptancı Tasarrufu',
          advice: `Mevcut finansal durumunuza göre bugün ${cash.todayExpense} TL dükkan masrafınız oldu. Kârlılığı artırmak için:
1. **Toptancı ile Peşin İndirimi:** Toptancı alımlarında nakit veya 3 gün içinde ödeme taahhüdüyle %4 ila %8 iskonto talep edin.
2. **POS Komisyon Yönetimi:** Kartlı satış oranınız (${cash.todayCard} TL) arttıkça bankanızla görüşüp bloke süresini ertesi güne çekerek komisyonu %1.99 altına düşürün ya da FAST/IBAN karekodunu öne çıkarın.
3. **Fatura & Sarf Malzeme Kontrolü:** Dükkan aydınlatmalarını LED'e çevirin, poşet ve ambalajı toptan kilo ile alın.`,
          suggestions: [
            'POS komisyonunu bankayla pazarlık et',
            'Toptancı peşin iskontosu iste',
            'Karekod / IBAN ile komisyonsuz tahsilat yap',
          ],
        };
      }

      // Default or custom question
      return {
        title: 'VIP Esnaf Danışmanı Yanıtı',
        advice: userMsg
          ? `Sayın ${profile?.ownerName || 'Esnaf'}, sorunuz için esnaf tecrübemizle önerimiz: Küçük işletmelerde en önemli kural günlük nakit akışını sıkı tutmak ve gereksiz masrafı önlemektir. Bugünkü ${cash.todayTotalIncome} TL cironuz hedefinize (${profile?.dailyTarget} TL) oranla aktif bir gün geçirdiğinizi gösteriyor. Müşterilerinize güler yüzle yaklaşın ve ödemeleri günü gününe kasaya işleyin.`
          : `Sayın ${profile?.ownerName || 'Esnaf'}, ${profile?.storeName || 'Dükkanınız'} bugün ${cash.todayTotalIncome} TL ciro yaptı. Net kasa kârınız ${cash.todayTotalIncome - cash.todayExpense} TL seviyesinde. Dükkanınızın sektörüne (${profile?.businessField}) özel VIP optimizasyonlar aktif.`,
        suggestions: [
          'Günlük ciro hedefimi nasıl artırırım?',
          'Toptancıya borçlanmadan nasıl mal çekerim?',
          'Sadık mahalle müşterisi nasıl kazanılır?',
        ],
      };
    };

    if (!process.env.GEMINI_API_KEY) {
      const fallback = getSmartFallback(topic || 'chat', message);
      return res.json({ success: true, ...fallback, source: 'smart_advisor' });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemPrompt = `Sen Türkiye'de 30 yıllık tecrübeye sahip, modern dijital araçları iyi bilen, çok samimi, babacan, esnaf dostu bir "VIP Esnaf Danışmanı"sın.
Dükkan Bilgileri:
${shopContext}

Kullanıcı Konusu / Talebi:
Konu: ${topic || 'Genel Danışmanlık'}
Esnafın Sorusu / Notu: ${message || 'Dükkanımı büyütmek ve profili iyileştirmek için öneriler ver.'}

Kurallar:
1. Türkçe olarak, esnafın dilinden konuş; samimi, motive edici, pratik ve hemen uygulanabilir 3-4 somut tavsiye ver.
2. Dükkan adı (${profile?.storeName}) ve sektörüne (${profile?.businessField}) doğrudan atıf yap.
3. Gereksiz akademik laflar etme; toptancı, kasa, ciro, müşteri iletişimi, vitrin gibi gerçek hayata dokunan şeyler söyle.
4. Çıktını temiz ve maddeli hazırla.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
      });

      const adviceText = response.text ? response.text.trim() : getSmartFallback(topic || 'chat', message).advice;

      res.json({
        success: true,
        title: topic === 'profile' ? 'Profil & Vitrin Tavsiyeleri' : topic === 'expenses' ? 'Gider & Tasarruf Planı' : 'VIP Danışman Yanıtı',
        advice: adviceText,
        suggestions: [
          'Dükkan vitrin ve tabelasını nasıl yenilerim?',
          'Giderleri %15 kısmak için ne yapayım?',
          'Müşteriyi veresiyeden nakite nasıl alıştırırım?',
        ],
        source: 'gemini-2.5-flash',
      });
    } catch (err) {
      console.error('VIP AI Consultant error:', err);
      const fallback = getSmartFallback(topic || 'chat', message);
      res.json({ success: true, ...fallback, source: 'smart_fallback' });
    }
  });

  // 12. Products & Stock Management Endpoints
  app.get('/api/products', (_req, res) => {
    const products = S().products || [];
    const criticalCount = products.filter((p) => p.currentStock <= p.criticalThreshold).length;
    res.json({ products, criticalCount });
  });

  app.post('/api/products', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ error: 'Ürün adı zorunludur.' });
    }

    if (!S().products) S().products = [];

    const now = new Date().toISOString();
    let product: Product;

    if (data.id) {
      // Update existing
      const idx = S().products.findIndex((p) => p.id === data.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Ürün bulunamadı.' });
      }
      product = {
        ...S().products[idx],
        name: data.name.trim(),
        category: data.category || 'Genel',
        currentStock: Number(data.currentStock) >= 0 ? Number(data.currentStock) : S().products[idx].currentStock,
        unit: data.unit || 'Adet',
        criticalThreshold: Number(data.criticalThreshold) >= 0 ? Number(data.criticalThreshold) : S().products[idx].criticalThreshold,
        purchasePrice: data.purchasePrice !== undefined ? Number(data.purchasePrice) : S().products[idx].purchasePrice,
        salePrice: data.salePrice !== undefined ? Number(data.salePrice) : S().products[idx].salePrice,
        barcode: data.barcode !== undefined ? data.barcode.trim() : S().products[idx].barcode,
        updatedAt: now,
      };
      S().products[idx] = product;
    } else {
      // Create new
      product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: data.name.trim(),
        category: data.category || 'Genel',
        currentStock: Math.max(0, Number(data.currentStock) || 0),
        unit: data.unit || 'Adet',
        criticalThreshold: Math.max(1, Number(data.criticalThreshold) || 5),
        purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
        salePrice: data.salePrice ? Number(data.salePrice) : undefined,
        barcode: data.barcode ? data.barcode.trim() : undefined,
        updatedAt: now,
      };
      S().products.unshift(product);
    }

    saveState();
    broadcast({ type: 'PRODUCT_UPDATED', payload: product });
    res.json({ success: true, product });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    if (!S().products) S().products = [];
    S().products = S().products.filter((p) => p.id !== id);
    saveState();
    broadcast({ type: 'PRODUCT_DELETED', payload: { productId: id } });
    res.json({ success: true, productId: id });
  });

  // Stock Movement: Giriş veya Çıkış
  app.post('/api/products/:id/movement', (req: Request, res: Response) => {
    const productId = req.params.id;
    const { type, quantity, reason } = req.body;
    const parsedQty = Math.abs(Number(quantity));

    if (!type || (type !== 'giris' && type !== 'cikis') || isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: 'Geçerli bir hareket türü (giris/cikis) ve adet giriniz.' });
    }

    if (!S().products) S().products = [];
    const product = S().products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı.' });
    }

    const previousStock = product.currentStock;
    let newStock = previousStock;

    if (type === 'giris') {
      newStock = previousStock + parsedQty;
    } else {
      if (previousStock < parsedQty) {
        // Warning or allow partial/zero
        newStock = Math.max(0, previousStock - parsedQty);
      } else {
        newStock = previousStock - parsedQty;
      }
    }

    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();

    const now = new Date();
    const dateStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

    const movement: StockMovement = {
      id: `sm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId: product.id,
      productName: product.name,
      type,
      quantity: parsedQty,
      previousStock,
      newStock,
      reason: reason || (type === 'giris' ? 'Stok Girişi (Toptancı/İkmal)' : 'Stok Çıkışı (Satış/Fire)'),
      date: dateStr,
    };

    if (!S().stockMovements) S().stockMovements = [];
    S().stockMovements.unshift(movement);

    saveState();

    broadcast({
      type: 'STOCK_MOVEMENT_CREATED',
      payload: { movement, product },
    });

    const isCritical = product.currentStock <= product.criticalThreshold;

    res.json({
      success: true,
      movement,
      product,
      isCritical,
    });
  });

  app.get('/api/products/movements', (_req, res) => {
    res.json({ movements: S().stockMovements || [] });
  });

  // ==========================================
  // 14. SEKTÖRE ÖZEL: BERBER & KUAFÖR (RANDEVU & KOLTUK TAKİBİ)
  // ==========================================
  app.get('/api/appointments', (_req, res) => {
    res.json({ appointments: S().appointments || [] });
  });

  app.post('/api/appointments', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.customerName || !data.customerName.trim()) {
      return res.status(400).json({ error: 'Müşteri adı zorunludur.' });
    }
    if (!S().appointments) S().appointments = [];

    let apt: Appointment;
    if (data.id) {
      const idx = S().appointments.findIndex((a) => a.id === data.id);
      if (idx === -1) return res.status(404).json({ error: 'Randevu bulunamadı.' });
      apt = {
        ...S().appointments[idx],
        ...data,
      };
      S().appointments[idx] = apt;
    } else {
      const now = new Date();
      apt = {
        id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        customerName: data.customerName.trim(),
        phone: data.phone?.trim() || '',
        staffName: data.staffName?.trim() || 'Koltuk 1 (Usta)',
        serviceName: data.serviceName?.trim() || 'Saç & Sakal Tıraşı',
        price: Number(data.price) || 250,
        appointmentDate: data.appointmentDate || now.toISOString().split('T')[0],
        timeSlot: data.timeSlot || '14:00',
        status: data.status || 'bekliyor',
        notes: data.notes?.trim() || '',
        createdAt: now.toISOString(),
      };
      S().appointments.unshift(apt);
    }

    saveState();
    broadcast({ type: 'APPOINTMENT_UPDATED', payload: apt });
    res.json({ success: true, appointment: apt });
  });

  app.post('/api/appointments/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!S().appointments) S().appointments = [];
    const apt = S().appointments.find((a) => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Randevu bulunamadı.' });

    apt.status = status;
    saveState();
    broadcast({ type: 'APPOINTMENT_UPDATED', payload: apt });
    res.json({ success: true, appointment: apt });
  });

  app.post('/api/appointments/:id/complete', (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    if (!S().appointments) S().appointments = [];
    const apt = S().appointments.find((a) => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Randevu bulunamadı.' });

    apt.status = 'tamamlandi';

    // Otomatik Kasaya Tahsilat Ekle
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const transaction: Transaction = {
      id: `tx_apt_${Date.now()}`,
      customerId: '',
      customerName: apt.customerName,
      type: 'tahsilat',
      amount: apt.price,
      paymentMethod: paymentMethod || 'nakit',
      description: `Kuaför/Berber Tahsilatı: ${apt.serviceName} (${apt.staffName})`,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };

    S().transactions.unshift(transaction);
    saveState();

    const cash = calculateCashRegister();
    broadcast({ type: 'APPOINTMENT_UPDATED', payload: apt });
    broadcast({
      type: 'TRANSACTION_CREATED',
      payload: { transaction, cash },
    });

    res.json({ success: true, appointment: apt, transaction, cash });
  });

  app.delete('/api/appointments/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!S().appointments) S().appointments = [];
    S().appointments = S().appointments.filter((a) => a.id !== id);
    saveState();
    broadcast({ type: 'APPOINTMENT_DELETED', payload: { id } });
    res.json({ success: true });
  });

  // ==========================================
  // 15. SEKTÖRE ÖZEL: RESTORAN & KAFE (MASA & ADİSYON YÖNETİMİ)
  // ==========================================
  app.get('/api/tables', (_req, res) => {
    res.json({ tables: S().tables || [] });
  });

  app.post('/api/tables/:id/order', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, quantity, unitPrice } = req.body;
    if (!name || !quantity) {
      return res.status(400).json({ error: 'Ürün adı ve adet zorunludur.' });
    }
    if (!S().tables) S().tables = [];
    const table = S().tables.find((t) => t.id === id);
    if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

    const qty = Number(quantity) || 1;
    const price = Number(unitPrice) || 0;
    const total = qty * price;

    const existingItem = table.orders.find((o) => o.name.toLowerCase() === name.trim().toLowerCase());
    if (existingItem) {
      existingItem.quantity += qty;
      existingItem.total = existingItem.quantity * existingItem.unitPrice;
    } else {
      table.orders.push({
        id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
        name: name.trim(),
        quantity: qty,
        unitPrice: price,
        total,
      });
    }

    table.isOccupied = true;
    if (!table.openedAt) {
      table.openedAt = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    table.totalAmount = table.orders.reduce((sum, o) => sum + o.total, 0);

    saveState();
    broadcast({ type: 'TABLE_UPDATED', payload: table });
    res.json({ success: true, table });
  });

  app.post('/api/tables/:id/checkout', (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    if (!S().tables) S().tables = [];
    const table = S().tables.find((t) => t.id === id);
    if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

    if (table.totalAmount <= 0 && table.orders.length === 0) {
      return res.status(400).json({ error: 'Masada açık hesap bulunmuyor.' });
    }

    const orderSummary = table.orders.map((o) => `${o.quantity}x ${o.name}`).join(', ');
    const checkoutAmount = table.totalAmount;

    // Otomatik Kasaya Gelir Yaz
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const transaction: Transaction = {
      id: `tx_tbl_${Date.now()}`,
      customerId: '',
      customerName: table.name,
      type: 'tahsilat',
      amount: checkoutAmount,
      paymentMethod: paymentMethod || 'nakit',
      description: `Masa Hesabı: ${table.name} (${orderSummary})`,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };

    S().transactions.unshift(transaction);

    // Masayı sıfırla ve boşalt
    table.isOccupied = false;
    table.orders = [];
    table.totalAmount = 0;
    table.openedAt = undefined;
    table.guestCount = undefined;
    table.note = undefined;

    saveState();

    const cash = calculateCashRegister();
    broadcast({ type: 'TABLE_UPDATED', payload: table });
    broadcast({
      type: 'TRANSACTION_CREATED',
      payload: { transaction, cash },
    });

    res.json({ success: true, table, transaction, cash });
  });

  app.post('/api/tables/:id/reset', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!S().tables) S().tables = [];
    const table = S().tables.find((t) => t.id === id);
    if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

    table.isOccupied = false;
    table.orders = [];
    table.totalAmount = 0;
    table.openedAt = undefined;
    table.guestCount = undefined;
    table.note = undefined;

    saveState();
    broadcast({ type: 'TABLE_UPDATED', payload: table });
    res.json({ success: true, table });
  });

  app.post('/api/tables', (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Masa adı zorunludur.' });
    if (!S().tables) S().tables = [];

    const newTable: RestaurantTable = {
      id: `tbl_${Date.now()}`,
      name: name.trim(),
      isOccupied: false,
      orders: [],
      totalAmount: 0,
    };
    S().tables.push(newTable);
    saveState();
    broadcast({ type: 'TABLE_UPDATED', payload: newTable });
    res.json({ success: true, table: newTable });
  });

  // ==========================================
  // 16. SEKTÖRE ÖZEL: TEKNİK SERVİS & TAMİR (İŞ EMRİ & FİŞ)
  // ==========================================
  app.get('/api/repair-tickets', (_req, res) => {
    res.json({ repairTickets: S().repairTickets || [] });
  });

  app.post('/api/repair-tickets', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.customerName || !data.deviceOrVehicle) {
      return res.status(400).json({ error: 'Müşteri adı ve cihaz/araç bilgisi zorunludur.' });
    }
    if (!S().repairTickets) S().repairTickets = [];

    let ticket: RepairTicket;
    if (data.id) {
      const idx = S().repairTickets.findIndex((t) => t.id === data.id);
      if (idx === -1) return res.status(404).json({ error: 'Servis fişi bulunamadı.' });
      ticket = {
        ...S().repairTickets[idx],
        ...data,
      };
      S().repairTickets[idx] = ticket;
    } else {
      const now = new Date();
      ticket = {
        id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        customerName: data.customerName.trim(),
        phone: data.phone?.trim() || '',
        deviceOrVehicle: data.deviceOrVehicle.trim(),
        complaint: data.complaint?.trim() || 'Arıza tespiti ve bakım',
        estimatedCost: Number(data.estimatedCost) || 0,
        partCost: Number(data.partCost) || 0,
        status: data.status || 'kabul_edildi',
        notes: data.notes?.trim() || '',
        createdAt: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
      };
      S().repairTickets.unshift(ticket);
    }

    saveState();
    broadcast({ type: 'REPAIR_TICKET_UPDATED', payload: ticket });
    res.json({ success: true, ticket });
  });

  app.post('/api/repair-tickets/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!S().repairTickets) S().repairTickets = [];
    const ticket = S().repairTickets.find((t) => t.id === id);
    if (!ticket) return res.status(404).json({ error: 'Servis fişi bulunamadı.' });

    ticket.status = status;
    saveState();
    broadcast({ type: 'REPAIR_TICKET_UPDATED', payload: ticket });
    res.json({ success: true, ticket });
  });

  app.post('/api/repair-tickets/:id/complete', (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentMethod, deductPartCost } = req.body;
    if (!S().repairTickets) S().repairTickets = [];
    const ticket = S().repairTickets.find((t) => t.id === id);
    if (!ticket) return res.status(404).json({ error: 'Servis fişi bulunamadı.' });

    ticket.status = 'teslim_edildi';
    ticket.completedAt = new Date().toISOString();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // Kasaya Tahsilat
    const incomeTx: Transaction = {
      id: `tx_rep_inc_${Date.now()}`,
      customerId: '',
      customerName: ticket.customerName,
      type: 'tahsilat',
      amount: ticket.estimatedCost,
      paymentMethod: paymentMethod || 'nakit',
      description: `Servis Teslimatı: ${ticket.deviceOrVehicle} (${ticket.complaint})`,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };
    S().transactions.unshift(incomeTx);

    // İsteğe bağlı: Parça maliyetini Gider olarak kaydet
    if (deductPartCost && ticket.partCost > 0) {
      const expenseTx: Transaction = {
        id: `tx_rep_exp_${Date.now()}`,
        customerId: '',
        customerName: 'Yedek Parça Maliyeti',
        type: 'gider',
        amount: ticket.partCost,
        paymentMethod: 'nakit',
        description: `Yedek Parça: ${ticket.deviceOrVehicle} parçası`,
        date: `${todayStr} ${timeStr}`,
        createdAt: now.toISOString(),
      };
      S().transactions.unshift(expenseTx);
    }

    saveState();

    const cash = calculateCashRegister();
    broadcast({ type: 'REPAIR_TICKET_UPDATED', payload: ticket });
    broadcast({
      type: 'TRANSACTION_CREATED',
      payload: { transaction: incomeTx, cash },
    });

    res.json({ success: true, ticket, transaction: incomeTx, cash });
  });

  app.delete('/api/repair-tickets/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!S().repairTickets) S().repairTickets = [];
    S().repairTickets = S().repairTickets.filter((t) => t.id !== id);
    saveState();
    broadcast({ type: 'REPAIR_TICKET_DELETED', payload: { id } });
    res.json({ success: true });
  });

  // ==========================================
  // 17. SEKTÖRE ÖZEL: BAKKAL & MARKET HIZLI TEZGÂH / KASA SATIŞI
  // ==========================================
  app.post('/api/quick-pos-sale', (req: Request, res: Response) => {
    const { items, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Sepette ürün bulunmalıdır.' });
    }

    const totalAmount = items.reduce((sum: number, it: any) => sum + (Number(it.total) || (Number(it.unitPrice) * Number(it.quantity))), 0);
    const summaryStr = items.map((it: any) => `${it.quantity}x ${it.name}`).join(', ');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // 1. Kasaya Tahsilat Ekle
    const transaction: Transaction = {
      id: `tx_pos_${Date.now()}`,
      customerId: '',
      customerName: 'Hızlı Tezgâh Satışı',
      type: 'tahsilat',
      amount: totalAmount,
      paymentMethod: paymentMethod || 'nakit',
      description: `Perakende Satış: ${summaryStr}`,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };
    S().transactions.unshift(transaction);

    // 2. Varsa Stoktan Düş & Hareket Kaydet
    if (S().products) {
      for (const item of items) {
        if (item.productId) {
          const prod = S().products.find((p) => p.id === item.productId);
          if (prod) {
            const prevStock = prod.currentStock;
            const newStock = Math.max(0, prevStock - Number(item.quantity));
            prod.currentStock = newStock;
            prod.updatedAt = now.toISOString();

            const movement: StockMovement = {
              id: `sm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              productId: prod.id,
              productName: prod.name,
              type: 'cikis',
              quantity: Number(item.quantity),
              previousStock: prevStock,
              newStock,
              reason: 'Hızlı Tezgâh Satışı',
              date: `${todayStr} ${timeStr}`,
            };

            if (!S().stockMovements) S().stockMovements = [];
            S().stockMovements.unshift(movement);

            broadcast({
              type: 'STOCK_MOVEMENT_CREATED',
              payload: { movement, product: prod },
            });
          }
        }
      }
    }

    saveState();
    const cash = calculateCashRegister();

    broadcast({
      type: 'TRANSACTION_CREATED',
      payload: { transaction, cash },
    });

    res.json({ success: true, transaction, cash });
  });

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Dükkânım running at http://localhost:${PORT}`);
  });
}

startServer();
