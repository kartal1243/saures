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

// ---------------- Hesaplar (dÃ¼kkan kayÄ±t) & Oturumlar ----------------
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

// BoÅŸ state â€” demo/seed/fake veri YOK, her yeni dÃ¼kkan tertemiz baÅŸlar
function emptyState(seed?: { storeName: string; ownerName: string; phone: string }): AppState {
  return {
    storeName: seed?.storeName || 'Yeni DÃ¼kkan',
    shopProfile: {
      storeName: seed?.storeName || '',
      ownerName: seed?.ownerName || '',
      businessField: 'Bakkal / Market / BÃ¼fe',
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

  // ---------------- Auth: dÃ¼kkan kayit / giris / cikis ----------------
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

  // Koruma: /api/* icin giris zorunlu (auth ve health haric)
  app.use('/api', (req: Request, res: Response, next) => {
    const p = req.path;
    if (p === '/health' || p.startsWith('/auth/')) return next();
    const acc = accountFromRequest(req);
    if (!acc) return res.status(401).json({ error: 'Lutfen giris yapin.' });
    als.run({ accountId: acc.id, role: acc.role || 'owner', state: loadShopState(acc.id) }, next);
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
      return res.status(400).json({ error: 'MÃ¼ÅŸteri adÄ± ve telefon numarasÄ± zorunludur.' });
    }

    let customer: Customer;
    const now = new Date().toISOString();

    if (data.id) {
      // Update
      const index = S().customers.findIndex((c) => c.id === data.id);
      if (index === -1) {
        return res.status(404).json({ error: 'MÃ¼ÅŸteri bulunamadÄ±.' });
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
          description: 'AÃ§Ä±lÄ±ÅŸ veresiye devir bakiyesi',
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

  // 5. Create Transaction (Veresiye ekle, Tahsilat al, Kasa Ã§Ä±kÄ±ÅŸÄ± yap)
  app.post('/api/transactions', (req: Request, res: Response) => {
    const { customerId, type, amount, paymentMethod, description } = req.body;
    const parsedAmount = Number(amount);

    if (!type || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'GeÃ§erli bir iÅŸlem tÃ¼rÃ¼ ve tutar giriniz.' });
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
      description: description || (type === 'veresiye' ? 'Veresiye BorÃ§ YazÄ±ldÄ±' : type === 'tahsilat' ? 'Ã–deme AlÄ±ndÄ±' : 'DÃ¼kkan MasrafÄ±'),
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
      customerName: customer ? customer.name : 'MÃ¼ÅŸteri',
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
        return `Ä°yi gÃ¼nler ${customerName}, ${nextDueDate ? `${nextDueDate} tarihli ` : ''}Ã¼yelik aidat dÃ¶nemi gelmiÅŸtir. Kalan tutar: ${balance} TL'dir. KolaylÄ±klar dileriz.`;
      } else if (reminderType === 'bakim') {
        return `Merhaba ${customerName}, periyodik cihaz bakÄ±m ve kontrol zamanÄ±nÄ±z gelmiÅŸtir. Randevu iÃ§in bize bu numaradan ulaÅŸabilirsiniz. HayÄ±rlÄ± gÃ¼nler dileriz.`;
      }
      if (t === 'esnaf') {
        return `Selamlar ${customerName}, dÃ¼kkan hesabÄ±nÄ±zda ${balance} TL bakiyeniz bulunmaktadÄ±r. MÃ¼sait olduÄŸunuzda uÄŸrarsanÄ±z seviniriz, hayÄ±rlÄ± iÅŸler, bereketli gÃ¼nler.`;
      } else if (t === 'resmi') {
        return `SayÄ±n ${customerName}, iÅŸletmemizde kayÄ±tlÄ± ${balance} TL tutarÄ±ndaki cari bakiyenizi bilginize sunar, iyi Ã§alÄ±ÅŸmalar dileriz.`;
      }
      return `Merhaba ${customerName}, hesabÄ±nÄ±zda kalan ${balance} TL bakiyeyi hatÄ±rlatmak istedik. GÃ¶sterdiÄŸiniz ilgiye teÅŸekkÃ¼r eder, hayÄ±rlÄ± gÃ¼nler dileriz.`;
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

      const prompt = `Sen TÃ¼rkiye'deki samimi, saygÄ±lÄ± ve dÃ¼rÃ¼st bir mahalle esnafÄ± veya KOBÄ° iÅŸletmecisisin.
AÅŸaÄŸÄ±daki mÃ¼ÅŸteri iÃ§in WhatsApp veya SMS Ã¼zerinden gÃ¶nderilecek, kaba olmayan, mÃ¼ÅŸteriyi kÄ±rmayacak ama borcunu veya periyodik Ã¶demesini/bakÄ±mÄ±nÄ± hatÄ±rlatacak bir mesaj hazÄ±rla.

Bilgiler:
- MÃ¼ÅŸteri AdÄ±: ${customerName}
- Kalan Bakiye: ${balance} TL
- Ä°ÅŸletme TÃ¼rÃ¼: ${businessType || 'Mahalle Ä°ÅŸletmesi'}
- HatÄ±rlatma Konusu: ${reminderType || 'Veresiye / Bakiye'}
- Ä°stenen Ãœslup / Ton: ${tone || 'Kibar & Samimi'} (seÃ§enekler: esnaf_samimiyeti, kibar, resmi)
- Ã–zel Not / Detay: ${customNote || 'Yok'}
${nextDueDate ? `- Son Ã–deme / Randevu Tarihi: ${nextDueDate}` : ''}

Kurallar:
1. Sadece doÄŸrudan gÃ¶nderilecek TÃ¼rkÃ§e mesaj metnini Ã¼ret. TÄ±rnak iÅŸareti, baÅŸlÄ±k veya aÃ§Ä±klama ekleme.
2. Mesaj 2-3 cÃ¼mleyi geÃ§mesin, WhatsApp'ta kolay okunabilir ve sÄ±cak olsun.
3. Kaba, icra dili gibi soÄŸuk ifadeler ASLA kullanma; esnaf nezaketiyle yaz.`;

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
    let csv = 'MÃ¼ÅŸteri AdÄ±;Telefon;Ä°ÅŸletme Kategorisi;GÃ¼ncel Bakiye (TL);Abonelik/Periyot;Son Ã–deme Tarihi;Notlar\r\n';
    for (const c of S().customers) {
      const sub = c.subscriptionPlan?.enabled ? `${c.subscriptionPlan.title} (${c.subscriptionPlan.interval})` : '-';
      csv += `"${c.name}";"${c.phone}";"${c.businessCategory}";"${c.balance}";"${sub}";"${c.lastPaymentDate || '-'}";"${(c.notes || '').replace(/"/g, '""')}"\r\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="veresiye_ve_musteri_listesi.csv"');
    // UTF-8 BOM so Excel opens Turkish characters correctly
    res.send('\uFEFF' + csv);
  });

  // 9. Shop Profile Routes (DÃ¼kkan KayÄ±t & Profil Bilgileri)
  app.get('/api/shop-profile', (_req, res) => {
    res.json({ profile: S().shopProfile });
  });

  app.post('/api/shop-profile', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.storeName) {
      return res.status(400).json({ error: 'DÃ¼kkan adÄ± zorunludur.' });
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

  // 10. Daily Closings Routes (GÃ¼n Sonu Z RaporlarÄ±)
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

  // 11. VIP AI Shop Consultant & Live Support (Yapay Zeka Esnaf DanÄ±ÅŸmanÄ±)
  app.post('/api/vip/ai-consultant', async (req: Request, res: Response) => {
    const { message, topic } = req.body;
    const profile = S().shopProfile;
    const cash = calculateCashRegister();

    // Context for AI
    const shopContext = `
DÃ¼kkan AdÄ±: ${profile?.storeName || 'Mahalle EsnafÄ±'}
Faaliyet AlanÄ± / SektÃ¶r: ${profile?.businessField || 'KÃ¼Ã§Ã¼k Ä°ÅŸletme'}
DÃ¼kkan Sahibi: ${profile?.ownerName || 'Esnaf'}
Ã‡alÄ±ÅŸan SayÄ±sÄ±: ${profile?.employeeCount || '1'} kiÅŸi
Åehir / Semt: ${profile?.cityDistrict || 'TÃ¼rkiye'}
BugÃ¼nkÃ¼ Toplam Gelir: ${cash.todayTotalIncome} TL (Nakit: ${cash.todayCash} TL, Kart: ${cash.todayCard} TL, IBAN: ${cash.todayBank} TL)
BugÃ¼nkÃ¼ DÃ¼kkan HarcamalarÄ± / Masraf: ${cash.todayExpense} TL
BugÃ¼nkÃ¼ Net Kasa KÃ¢rÄ±: ${cash.todayTotalIncome - cash.todayExpense} TL
GÃ¼nlÃ¼k Ciro Hedefi: ${profile?.dailyTarget || 2500} TL
`;

    // High quality intelligent fallback if Gemini API key not present
    const getSmartFallback = (t: string, userMsg?: string) => {
      if (t === 'profile') {
        return {
          title: 'DÃ¼kkan Profil & Vitrin Ä°yileÅŸtirme Tavsiyeleri',
          advice: `SayÄ±n ${profile?.ownerName || 'Esnaf'}, ${profile?.storeName || 'DÃ¼kkanÄ±nÄ±z'} iÃ§in mahallede mÃ¼ÅŸteri Ã§ekim gÃ¼cÃ¼nÃ¼ artÄ±racak 3 Ã¶ncelikli adÄ±m:
1. **Google Haritalar & Tabela:** DÃ¼kkan tabelanÄ±zda ve Google Haritalar profilinizde "${profile?.businessField}" anahtar kelimesini ve Ã§alÄ±ÅŸma saatlerinizi gÃ¼ncelleyin. FotoÄŸraflÄ± profiller %45 daha Ã§ok mÃ¼ÅŸteri Ã§eker.
2. **Kasa Ã–nÃ¼ HÄ±zlÄ± ÃœrÃ¼n AlanÄ±:** Kasa yanÄ±na sakÄ±z, atÄ±ÅŸtÄ±rmalÄ±k, kolonya gibi anlÄ±k satÄ±n alÄ±nan 10-50 TL'lik sepet geniÅŸletici Ã¼rÃ¼nler yerleÅŸtirin.
3. **MÃ¼ÅŸteri Hitap SloganÄ±:** Vitrininize "${profile?.slogan || 'GÃ¼ler yÃ¼zlÃ¼ hizmet, bereketli alÄ±ÅŸveriÅŸ'}" afiÅŸi asarak samimiyeti Ã¶n plana Ã§Ä±karÄ±n.`,
          suggestions: [
            'Google Haritalar aÃ§Ä±klamasÄ±nÄ± optimize et',
            'Fiyat etiketlerini ve vitrini yenile',
            'Kasa Ã¶nÃ¼ sepet kampanyasÄ± yap',
          ],
        };
      }
      if (t === 'expenses') {
        return {
          title: 'Giderleri Azaltma & ToptancÄ± Tasarrufu',
          advice: `Mevcut finansal durumunuza gÃ¶re bugÃ¼n ${cash.todayExpense} TL dÃ¼kkan masrafÄ±nÄ±z oldu. KÃ¢rlÄ±lÄ±ÄŸÄ± artÄ±rmak iÃ§in:
1. **ToptancÄ± ile PeÅŸin Ä°ndirimi:** ToptancÄ± alÄ±mlarÄ±nda nakit veya 3 gÃ¼n iÃ§inde Ã¶deme taahhÃ¼dÃ¼yle %4 ila %8 iskonto talep edin.
2. **POS Komisyon YÃ¶netimi:** KartlÄ± satÄ±ÅŸ oranÄ±nÄ±z (${cash.todayCard} TL) arttÄ±kÃ§a bankanÄ±zla gÃ¶rÃ¼ÅŸÃ¼p bloke sÃ¼resini ertesi gÃ¼ne Ã§ekerek komisyonu %1.99 altÄ±na dÃ¼ÅŸÃ¼rÃ¼n ya da FAST/IBAN karekodunu Ã¶ne Ã§Ä±karÄ±n.
3. **Fatura & Sarf Malzeme KontrolÃ¼:** DÃ¼kkan aydÄ±nlatmalarÄ±nÄ± LED'e Ã§evirin, poÅŸet ve ambalajÄ± toptan kilo ile alÄ±n.`,
          suggestions: [
            'POS komisyonunu bankayla pazarlÄ±k et',
            'ToptancÄ± peÅŸin iskontosu iste',
            'Karekod / IBAN ile komisyonsuz tahsilat yap',
          ],
        };
      }

      // Default or custom question
      return {
        title: 'VIP Esnaf DanÄ±ÅŸmanÄ± YanÄ±tÄ±',
        advice: userMsg
          ? `SayÄ±n ${profile?.ownerName || 'Esnaf'}, sorunuz iÃ§in esnaf tecrÃ¼bemizle Ã¶nerimiz: KÃ¼Ã§Ã¼k iÅŸletmelerde en Ã¶nemli kural gÃ¼nlÃ¼k nakit akÄ±ÅŸÄ±nÄ± sÄ±kÄ± tutmak ve gereksiz masrafÄ± Ã¶nlemektir. BugÃ¼nkÃ¼ ${cash.todayTotalIncome} TL cironuz hedefinize (${profile?.dailyTarget} TL) oranla aktif bir gÃ¼n geÃ§irdiÄŸinizi gÃ¶steriyor. MÃ¼ÅŸterilerinize gÃ¼ler yÃ¼zle yaklaÅŸÄ±n ve Ã¶demeleri gÃ¼nÃ¼ gÃ¼nÃ¼ne kasaya iÅŸleyin.`
          : `SayÄ±n ${profile?.ownerName || 'Esnaf'}, ${profile?.storeName || 'DÃ¼kkanÄ±nÄ±z'} bugÃ¼n ${cash.todayTotalIncome} TL ciro yaptÄ±. Net kasa kÃ¢rÄ±nÄ±z ${cash.todayTotalIncome - cash.todayExpense} TL seviyesinde. DÃ¼kkanÄ±nÄ±zÄ±n sektÃ¶rÃ¼ne (${profile?.businessField}) Ã¶zel VIP optimizasyonlar aktif.`,
        suggestions: [
          'GÃ¼nlÃ¼k ciro hedefimi nasÄ±l artÄ±rÄ±rÄ±m?',
          'ToptancÄ±ya borÃ§lanmadan nasÄ±l mal Ã§ekerim?',
          'SadÄ±k mahalle mÃ¼ÅŸterisi nasÄ±l kazanÄ±lÄ±r?',
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

      const systemPrompt = `Sen TÃ¼rkiye'de 30 yÄ±llÄ±k tecrÃ¼beye sahip, modern dijital araÃ§larÄ± iyi bilen, Ã§ok samimi, babacan, esnaf dostu bir "VIP Esnaf DanÄ±ÅŸmanÄ±"sÄ±n.
DÃ¼kkan Bilgileri:
${shopContext}

KullanÄ±cÄ± Konusu / Talebi:
Konu: ${topic || 'Genel DanÄ±ÅŸmanlÄ±k'}
EsnafÄ±n Sorusu / Notu: ${message || 'DÃ¼kkanÄ±mÄ± bÃ¼yÃ¼tmek ve profili iyileÅŸtirmek iÃ§in Ã¶neriler ver.'}

Kurallar:
1. TÃ¼rkÃ§e olarak, esnafÄ±n dilinden konuÅŸ; samimi, motive edici, pratik ve hemen uygulanabilir 3-4 somut tavsiye ver.
2. DÃ¼kkan adÄ± (${profile?.storeName}) ve sektÃ¶rÃ¼ne (${profile?.businessField}) doÄŸrudan atÄ±f yap.
3. Gereksiz akademik laflar etme; toptancÄ±, kasa, ciro, mÃ¼ÅŸteri iletiÅŸimi, vitrin gibi gerÃ§ek hayata dokunan ÅŸeyler sÃ¶yle.
4. Ã‡Ä±ktÄ±nÄ± temiz ve maddeli hazÄ±rla.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
      });

      const adviceText = response.text ? response.text.trim() : getSmartFallback(topic || 'chat', message).advice;

      res.json({
        success: true,
        title: topic === 'profile' ? 'Profil & Vitrin Tavsiyeleri' : topic === 'expenses' ? 'Gider & Tasarruf PlanÄ±' : 'VIP DanÄ±ÅŸman YanÄ±tÄ±',
        advice: adviceText,
        suggestions: [
          'DÃ¼kkan vitrin ve tabelasÄ±nÄ± nasÄ±l yenilerim?',
          'Giderleri %15 kÄ±smak iÃ§in ne yapayÄ±m?',
          'MÃ¼ÅŸteriyi veresiyeden nakite nasÄ±l alÄ±ÅŸtÄ±rÄ±rÄ±m?',
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
      return res.status(400).json({ error: 'ÃœrÃ¼n adÄ± zorunludur.' });
    }

    if (!S().products) S().products = [];

    const now = new Date().toISOString();
    let product: Product;

    if (data.id) {
      // Update existing
      const idx = S().products.findIndex((p) => p.id === data.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'ÃœrÃ¼n bulunamadÄ±.' });
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

  // Stock Movement: GiriÅŸ veya Ã‡Ä±kÄ±ÅŸ
  app.post('/api/products/:id/movement', (req: Request, res: Response) => {
    const productId = req.params.id;
    const { type, quantity, reason } = req.body;
    const parsedQty = Math.abs(Number(quantity));

    if (!type || (type !== 'giris' && type !== 'cikis') || isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: 'GeÃ§erli bir hareket tÃ¼rÃ¼ (giris/cikis) ve adet giriniz.' });
    }

    if (!S().products) S().products = [];
    const product = S().products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'ÃœrÃ¼n bulunamadÄ±.' });
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
      reason: reason || (type === 'giris' ? 'Stok GiriÅŸi (ToptancÄ±/Ä°kmal)' : 'Stok Ã‡Ä±kÄ±ÅŸÄ± (SatÄ±ÅŸ/Fire)'),
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
  // 14. SEKTÃ–RE Ã–ZEL: BERBER & KUAFÃ–R (RANDEVU & KOLTUK TAKÄ°BÄ°)
  // ==========================================
  app.get('/api/appointments', (_req, res) => {
    res.json({ appointments: S().appointments || [] });
  });

  app.post('/api/appointments', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.customerName || !data.customerName.trim()) {
      return res.status(400).json({ error: 'MÃ¼ÅŸteri adÄ± zorunludur.' });
    }
    if (!S().appointments) S().appointments = [];

    let apt: Appointment;
    if (data.id) {
      const idx = S().appointments.findIndex((a) => a.id === data.id);
      if (idx === -1) return res.status(404).json({ error: 'Randevu bulunamadÄ±.' });
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
        serviceName: data.serviceName?.trim() || 'SaÃ§ & Sakal TÄ±raÅŸÄ±',
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
    if (!apt) return res.status(404).json({ error: 'Randevu bulunamadÄ±.' });

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
    if (!apt) return res.status(404).json({ error: 'Randevu bulunamadÄ±.' });

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
      description: `KuafÃ¶r/Berber TahsilatÄ±: ${apt.serviceName} (${apt.staffName})`,
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
  // 15. SEKTÃ–RE Ã–ZEL: RESTORAN & KAFE (MASA & ADÄ°SYON YÃ–NETÄ°MÄ°)
  // ==========================================
  app.get('/api/tables', (_req, res) => {
    res.json({ tables: S().tables || [] });
  });

  app.post('/api/tables/:id/order', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, quantity, unitPrice } = req.body;
    if (!name || !quantity) {
      return res.status(400).json({ error: 'ÃœrÃ¼n adÄ± ve adet zorunludur.' });
    }
    if (!S().tables) S().tables = [];
    const table = S().tables.find((t) => t.id === id);
    if (!table) return res.status(404).json({ error: 'Masa bulunamadÄ±.' });

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
    if (!table) return res.status(404).json({ error: 'Masa bulunamadÄ±.' });

    if (table.totalAmount <= 0 && table.orders.length === 0) {
      return res.status(400).json({ error: 'Masada aÃ§Ä±k hesap bulunmuyor.' });
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
      description: `Masa HesabÄ±: ${table.name} (${orderSummary})`,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };

    S().transactions.unshift(transaction);

    // MasayÄ± sÄ±fÄ±rla ve boÅŸalt
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
    if (!table) return res.status(404).json({ error: 'Masa bulunamadÄ±.' });

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
    if (!name || !name.trim()) return res.status(400).json({ error: 'Masa adÄ± zorunludur.' });
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
  // 16. SEKTÃ–RE Ã–ZEL: TEKNÄ°K SERVÄ°S & TAMÄ°R (Ä°Å EMRÄ° & FÄ°Å)
  // ==========================================
  app.get('/api/repair-tickets', (_req, res) => {
    res.json({ repairTickets: S().repairTickets || [] });
  });

  app.post('/api/repair-tickets', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.customerName || !data.deviceOrVehicle) {
      return res.status(400).json({ error: 'MÃ¼ÅŸteri adÄ± ve cihaz/araÃ§ bilgisi zorunludur.' });
    }
    if (!S().repairTickets) S().repairTickets = [];

    let ticket: RepairTicket;
    if (data.id) {
      const idx = S().repairTickets.findIndex((t) => t.id === data.id);
      if (idx === -1) return res.status(404).json({ error: 'Servis fiÅŸi bulunamadÄ±.' });
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
        complaint: data.complaint?.trim() || 'ArÄ±za tespiti ve bakÄ±m',
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
    if (!ticket) return res.status(404).json({ error: 'Servis fiÅŸi bulunamadÄ±.' });

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
    if (!ticket) return res.status(404).json({ error: 'Servis fiÅŸi bulunamadÄ±.' });

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
      description: `Servis TeslimatÄ±: ${ticket.deviceOrVehicle} (${ticket.complaint})`,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };
    S().transactions.unshift(incomeTx);

    // Ä°steÄŸe baÄŸlÄ±: ParÃ§a maliyetini Gider olarak kaydet
    if (deductPartCost && ticket.partCost > 0) {
      const expenseTx: Transaction = {
        id: `tx_rep_exp_${Date.now()}`,
        customerId: '',
        customerName: 'Yedek ParÃ§a Maliyeti',
        type: 'gider',
        amount: ticket.partCost,
        paymentMethod: 'nakit',
        description: `Yedek ParÃ§a: ${ticket.deviceOrVehicle} parÃ§asÄ±`,
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
  // 17. SEKTÃ–RE Ã–ZEL: BAKKAL & MARKET HIZLI TEZGÃ‚H / KASA SATIÅI
  // ==========================================
  app.post('/api/quick-pos-sale', (req: Request, res: Response) => {
    const { items, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Sepette Ã¼rÃ¼n bulunmalÄ±dÄ±r.' });
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
      customerName: 'HÄ±zlÄ± TezgÃ¢h SatÄ±ÅŸÄ±',
      type: 'tahsilat',
      amount: totalAmount,
      paymentMethod: paymentMethod || 'nakit',
      description: `Perakende SatÄ±ÅŸ: ${summaryStr}`,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };
    S().transactions.unshift(transaction);

    // 2. Varsa Stoktan DÃ¼ÅŸ & Hareket Kaydet
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
              reason: 'HÄ±zlÄ± TezgÃ¢h SatÄ±ÅŸÄ±',
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
    console.log(`Bereket Esnaf PortalÄ± running at http://localhost:${PORT}`);
  });
}

startServer();
