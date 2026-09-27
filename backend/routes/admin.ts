import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Express, Request, Response } from 'express';
import {
  getAccounts,
  clientIp,
  countActiveSessions,
  getAuthEvents,
} from '../accounts';
import { loadShopState } from '../shopState';
import {
  SHOPS_DIR,
  ADMIN_PASSWORD,
  ADMIN_SESSION_TTL_MS,
  ADMIN_SESSIONS_FILE,
} from '../config';
import { readJsonFile, writeJsonFile } from '../fsdb';
import { rateLimit } from '../guards';

// Admin oturumu dukkan oturumunden ayridir (ayri cookie: aid, 12 saat).
// Sifre .env'deki ADMIN_PASSWORD'dur; tanimli degilse admin girisi kapali kalir.
interface AdminSession {
  token: string;
  expiresAt: string;
  createdIp: string;
}

let adminSessions: AdminSession[] = readJsonFile<AdminSession[]>(ADMIN_SESSIONS_FILE, []).filter(
  (s) => new Date(s.expiresAt).getTime() > Date.now()
);

function persistAdminSessions(): void {
  writeJsonFile(ADMIN_SESSIONS_FILE, adminSessions);
}

function adminTokenFromRequest(req: Request): string | null {
  const header = req.headers.cookie || '';
  const match = header.match(/(?:^|;\s*)aid=([a-f0-9]+)/);
  return match ? match[1] : null;
}

function isAdminSession(req: Request): boolean {
  const token = adminTokenFromRequest(req);
  if (!token) return false;
  const s = adminSessions.find((x) => x.token === token);
  if (!s) return false;
  if (new Date(s.expiresAt).getTime() < Date.now()) return false;
  return true;
}

function requireAdmin(req: Request, res: Response): boolean {
  if (!isAdminSession(req)) {
    res.status(401).json({ error: 'Admin girisi gerekli.' });
    return false;
  }
  return true;
}

function passwordOk(input: string): boolean {
  if (!ADMIN_PASSWORD || !input) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function adminCookie(token: string): string {
  return (
    'aid=' + token + '; HttpOnly; Path=/; Max-Age=' + Math.floor(ADMIN_SESSION_TTL_MS / 1000) + '; SameSite=Lax'
  );
}

// Sunucu log dosyalari (salt-okunur). couple-meeting loglarina DOKUNULMAZ.
const LOG_FILES: Record<string, string> = {
  nginx: '/var/log/nginx/access.log',
  app: '/root/.pm2/logs/dukkanim-out.log',
  'app-error': '/root/.pm2/logs/dukkanim-error.log',
};

function tailFile(file: string, lines: number): string[] {
  const n = Math.max(1, Math.min(500, Math.floor(lines) || 200));
  const raw = fs.readFileSync(file, 'utf-8');
  const parts = raw.split('\n');
  if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
  return parts.slice(-n);
}

export function registerAdminRoutes(app: Express): void {
  // Admin girisi (hiz limitli). NOT: bu route apiGuard'dan ONCE kaydedilir.
  app.post('/api/admin/login', rateLimit, (req: Request, res: Response) => {
    if (!ADMIN_PASSWORD) {
      return res.status(503).json({ error: 'Admin girisi henuz tanimlanmamis.' });
    }
    const password = String((req.body || {}).password || '');
    if (!passwordOk(password)) {
      return res.status(401).json({ error: 'Sifre hatali.' });
    }
    const session: AdminSession = {
      token: crypto.randomBytes(24).toString('hex'),
      expiresAt: new Date(Date.now() + ADMIN_SESSION_TTL_MS).toISOString(),
      createdIp: clientIp(req),
    };
    adminSessions.push(session);
    persistAdminSessions();
    res.setHeader('Set-Cookie', adminCookie(session.token));
    res.json({ success: true });
  });

  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const token = adminTokenFromRequest(req);
    if (token) {
      adminSessions = adminSessions.filter((s) => s.token !== token);
      persistAdminSessions();
    }
    res.setHeader('Set-Cookie', 'aid=; HttpOnly; Path=/; Max-Age=0');
    res.json({ success: true });
  });

  app.get('/api/admin/me', (req: Request, res: Response) => {
    if (!isAdminSession(req)) return res.status(401).json({ error: 'Admin girisi gerekli.' });
    res.json({ admin: true });
  });

  // Tum dukkanlar: iletisim + IP + kullanim detayi. Sifre ozeti ASLA disari cikmaz.
  app.get('/api/admin/shops', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const shops = getAccounts()
      .filter((a) => (a.role || 'owner') === 'owner')
      .map((a) => {
        const st = loadShopState(a.id);
        let dataKB = 0;
        try {
          dataKB = Math.round(fs.statSync(path.join(SHOPS_DIR, a.id + '.json')).size / 1024);
        } catch {
          dataKB = 0;
        }
        const staff = getAccounts().filter((s) => s.parentAccountId === a.id);
        return {
          id: a.id,
          shopName: a.shopName,
          ownerName: a.ownerName,
          phone: a.phone,
          createdAt: a.createdAt,
          createdIp: a.createdIp || null,
          lastLoginIp: a.lastLoginIp || null,
          lastLoginAt: a.lastLoginAt || null,
          loginCount: a.loginCount || 0,
          loginHistory: (a.loginHistory || []).slice(0, 10),
          activeSessions: countActiveSessions(a.id),
          sector: st.shopProfile?.businessField || null,
          cityDistrict: st.shopProfile?.cityDistrict || null,
          customers: st.customers.length,
          products: st.products.length,
          transactions: st.transactions.length,
          appointments: st.appointments.length,
          tables: st.tables.length,
          suppliers: Array.isArray((st as unknown as { suppliers?: unknown[] }).suppliers)
            ? (st as unknown as { suppliers: unknown[] }).suppliers.length
            : 0,
          staffCount: staff.length,
          staff: staff.map((s) => ({
            name: s.ownerName,
            phone: s.phone,
            position: s.position || 'Kasiyer',
            lastLoginAt: s.lastLoginAt || null,
            lastLoginIp: s.lastLoginIp || null,
          })),
          dataKB,
          lastUpdated: st.lastUpdated || null,
        };
      })
      .sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    res.json({ shops, total: shops.length });
  });

  // Kimlik olaylari: kayit / basarili-hatali giris / kilit (en yeniden eskiye)
  app.get('/api/admin/events', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const limit = Number(req.query.limit) || 100;
    res.json({ events: getAuthEvents(limit) });
  });

  // Gosterge paneli: tek istekte tum ozet (kartlar + 7 gunluk grafik + son kayit/giris)
  app.get('/api/admin/overview', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const owners = getAccounts().filter((a) => (a.role || 'owner') === 'owner');
    let customers = 0;
    let transactions = 0;
    let online = 0;
    for (const o of owners) {
      const st = loadShopState(o.id);
      customers += st.customers.length;
      transactions += st.transactions.length;
      online += countActiveSessions(o.id);
    }
    const events = getAuthEvents(500);
    const today = new Date().toISOString().slice(0, 10);
    const ipSet = new Set<string>();
    for (const e of events) if (e.ip && e.ip !== 'unknown') ipSet.add(e.ip);
    for (const o of owners) {
      if (o.createdIp && o.createdIp !== 'unknown') ipSet.add(o.createdIp);
      if (o.lastLoginIp && o.lastLoginIp !== 'unknown') ipSet.add(o.lastLoginIp);
    }
    const week: { day: string; label: string; registers: number; logins: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const day = d.toISOString().slice(0, 10);
      week.push({
        day,
        label: d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
        registers: owners.filter((o) => (o.createdAt || '').slice(0, 10) === day).length,
        logins: events.filter((e) => e.type === 'login_ok' && e.at.slice(0, 10) === day).length,
      });
    }
    const recentRegisters = owners
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8)
      .map((o) => ({
        shopName: o.shopName,
        ownerName: o.ownerName,
        phone: o.phone,
        createdAt: o.createdAt,
        createdIp: o.createdIp || null,
      }));
    const phoneToShop = new Map(owners.map((o) => [o.phone, o.shopName]));
    const recentLogins = events
      .filter((e) => e.type === 'login_ok')
      .slice(0, 10)
      .map((e) => ({
        shopName: phoneToShop.get(e.phone) || e.phone,
        phone: e.phone,
        ip: e.ip,
        at: e.at,
      }));
    res.json({
      shops: owners.length,
      online,
      customers,
      transactions,
      eventsTotal: events.length,
      eventsToday: events.filter((e) => e.at.slice(0, 10) === today).length,
      uniqueIps: ipSet.size,
      week,
      recentRegisters,
      recentLogins,
    });
  });

  // Sunucu loglari: nginx | app | app-error (son N satir)
  app.get('/api/admin/logs/:name', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const file = LOG_FILES[req.params.name];
    if (!file) return res.status(404).json({ error: 'Bilinmeyen log.' });
    const lines = Number(req.query.lines) || 200;
    try {
      res.json({ name: req.params.name, lines: tailFile(file, lines) });
    } catch {
      res.status(404).json({ error: 'Log dosyasi okunamadi.' });
    }
  });
}
