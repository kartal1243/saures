import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Express, Request, Response } from 'express';
import {
  getAccounts,
  findAccountById,
  removeAccount,
  removeSessionsForAccount,
  clientIp,
  countActiveSessions,
  getAuthEvents,
  logAuthEvent,
  isLoginLocked,
  getRecentActiveSessions,
  isAccountRecentlyActive,
  detectDeviceAndBrowser,
} from '../accounts';
import { loadShopState, persistShopState } from '../shopState';
import {
  SHOPS_DIR,
  ADMIN_PASSWORD,
  ADMIN_SESSION_TTL_MS,
  ADMIN_SESSIONS_FILE,
} from '../config';
import { readJsonFile, writeJsonFile } from '../fsdb';
import { rateLimit } from '../guards';
import { getCustomPanelLeads, saveCustomPanelLeads } from './vip';
import {
  getConnectedAccounts,
  getRecentLiveActivities,
  getLiveMetrics,
} from '../realtime';
import {
  getVisitorRecords,
  getBlockedIps,
  blockIp,
  unblockIp,
} from '../visitorTracker';

// Admin oturumu dukkan oturumundan ayridir (ayri cookie: aid, 12 saat).
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
  const header = (req.headers && req.headers.cookie) || '';
  const match = header.match(/(?:^|;\s*)aid=([a-f0-9]+)/);
  return match ? match[1] : null;
}

export function isAdminSession(req: Request): boolean {
  const token = adminTokenFromRequest(req);
  if (!token) return false;
  const s = adminSessions.find((x) => x.token === token);
  if (!s) return false;
  if (new Date(s.expiresAt).getTime() < Date.now()) return false;
  return true;
}

export function requireAdmin(req: Request, res: Response): boolean {
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
  const isProd = process.env.NODE_ENV === 'production';
  return (
    'aid=' +
    token +
    '; HttpOnly; Path=/; Max-Age=' +
    Math.floor(ADMIN_SESSION_TTL_MS / 1000) +
    '; SameSite=Lax' +
    (isProd ? '; Secure' : '')
  );
}

// Sunucu log dosyalari (salt-okunur).
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
  // Admin girisi (hiz limitli).
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
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', 'aid=; HttpOnly; Path=/; Max-Age=0' + (isProd ? '; Secure' : ''));
    res.json({ success: true });
  });

  app.get('/api/admin/me', (req: Request, res: Response) => {
    if (!isAdminSession(req)) return res.status(401).json({ error: 'Admin girisi gerekli.' });
    res.json({ admin: true });
  });

  // Tum dukkanlar: iletisim + anlik baglanti durumu + IP + kullanim detayi
  app.get('/api/admin/shops', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;

    const wsAccounts = getConnectedAccounts();
    const wsIds = new Set(wsAccounts.map((w) => w.accountId));

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
        const isWsConnected = wsIds.has(a.id);
        const isRecentActive = isAccountRecentlyActive(a.id, 5 * 60 * 1000);

        let liveStatus: 'live_ws' | 'recent_active' | 'offline' = 'offline';
        if (isWsConnected) liveStatus = 'live_ws';
        else if (isRecentActive) liveStatus = 'recent_active';

        const wsInfo = wsAccounts.find((w) => w.accountId === a.id);

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
          // Canlı Bağlantı Bilgisi (Gerçek WS + Son 5 dk aktiflik)
          isWsConnected,
          isRecentActive,
          liveStatus,
          liveDevice: wsInfo?.deviceType || null,
          liveBrowser: wsInfo?.browserInfo || null,
          isVip: Boolean(st.shopProfile?.isVip),
          vipTier: st.shopProfile?.vipTier || null,
          vipPlan: st.shopProfile?.vipPlan || null,
          vipUntil: st.shopProfile?.vipUntil || null,
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
      .sort((x, y) => {
        // Canlı olanlar en başta listelensin
        if (x.liveStatus !== 'offline' && y.liveStatus === 'offline') return -1;
        if (x.liveStatus === 'offline' && y.liveStatus !== 'offline') return 1;
        return y.createdAt.localeCompare(x.createdAt);
      });

    res.json({ shops, total: shops.length });
  });

  // Kimlik olaylari: kayit / basarili-hatali giris / kilit (en yeniden eskiye)
  app.get('/api/admin/events', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const limit = Number(req.query.limit) || 100;
    res.json({ events: getAuthEvents(limit) });
  });

  // Canlı Takip Akışı ve Canlı Ziyaretçiler Endpoint'i
  app.get('/api/admin/live-stream', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;

    const wsConnected = getConnectedAccounts();
    const recentHeartbeats = getRecentActiveSessions(5 * 60 * 1000);
    const wsShopIds = new Set(wsConnected.map((s) => s.accountId));
    const recentShopIds = new Set(recentHeartbeats.map((h) => h.accountId));
    const allLiveShopIds = new Set([...wsShopIds, ...recentShopIds]);

    const visitors = Array.from(allLiveShopIds).map((accId) => {
      const acc = findAccountById(accId);
      const ws = wsConnected.find((w) => w.accountId === accId);
      const hb = recentHeartbeats.find((h) => h.accountId === accId);
      return {
        accountId: accId,
        shopName: acc?.shopName || 'Bilinmeyen Dükkan',
        ownerName: acc?.ownerName || 'Bilinmiyor',
        phone: acc?.phone || '',
        ip: ws?.ip || hb?.ip || acc?.lastLoginIp || 'unknown',
        deviceType: ws?.deviceType || hb?.deviceType || 'desktop',
        browserInfo: ws?.browserInfo || hb?.browserInfo || 'Bilinmiyor',
        connectedAt: ws?.connectedAt || hb?.lastSeenAt || acc?.lastLoginAt || new Date().toISOString(),
        isWs: Boolean(ws),
        isRecent: Boolean(hb),
      };
    }).sort((a, b) => b.connectedAt.localeCompare(a.connectedAt));

    res.json({
      activities: getRecentLiveActivities(50),
      liveStats: getLiveMetrics(),
      visitors,
      onlineCount: allLiveShopIds.size,
      wsCount: wsConnected.length,
      recentCount: recentHeartbeats.length,
    });
  });

  // Gösterge paneli: Tek istekte tüm özet + GERÇEK CANLI KULLANICI SAYILARI
  app.get('/api/admin/overview', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const owners = getAccounts().filter((a) => (a.role || 'owner') === 'owner');

    let customers = 0;
    let transactions = 0;

    // Büyüme & Dönüşüm Hunisi (Funnel) Metrikleri
    let configuredShops = 0;
    let firstTransactionShops = 0;
    let activeLast7DaysShops = 0;
    let trialVipShops = 0;
    let paidVipShops = 0;
    let ustaVipCount = 0;
    let patronVipCount = 0;
    let cirakCount = 0;

    const sevenDaysAgoMs = Date.now() - 7 * 86400000;

    for (const o of owners) {
      const st = loadShopState(o.id);
      customers += st.customers.length;
      transactions += st.transactions.length;

      // 1. Kurulumu tamamlayan dükkan
      const isConf = Boolean(st.shopProfile?.isConfigured || (st.shopProfile?.storeName && st.shopProfile?.businessField));
      if (isConf) configuredShops++;

      // 2. İlk işlemini giren dükkan
      if (st.transactions.length > 0) firstTransactionShops++;

      // 3. Son 7 günde 3+ işlem giren dükkan (North Star)
      const recentTxs = st.transactions.filter((tx) => {
        const t = new Date(tx.date || tx.createdAt).getTime();
        return !isNaN(t) && t >= sevenDaysAgoMs;
      });
      if (recentTxs.length >= 3) activeLast7DaysShops++;

      // 4. VIP Seviyeleri ve Dönüşüm
      const isVipActive = Boolean(st.shopProfile?.isVip && (!st.shopProfile.vipUntil || new Date(st.shopProfile.vipUntil).getTime() > Date.now()));
      const plan = st.shopProfile?.vipPlan;
      const tier = st.shopProfile?.vipTier;

      if (isVipActive) {
        if (plan === 'deneme_14_gun' || plan === '14_gun_deneme') {
          trialVipShops++;
        } else if (tier === 'usta' || tier === 'patron') {
          paidVipShops++;
          if (tier === 'usta') ustaVipCount++;
          if (tier === 'patron') patronVipCount++;
        } else {
          paidVipShops++;
          patronVipCount++;
        }
      } else {
        cirakCount++;
      }
    }

    // Gerçek Anlık Canlı Ziyaretçiler Hesabı (WebSocket bağlı + son 5 dk aktifler)
    const wsConnectedShops = getConnectedAccounts();
    const wsShopIds = new Set(wsConnectedShops.map((s) => s.accountId));
    const recentHeartbeats = getRecentActiveSessions(5 * 60 * 1000);
    const recentShopIds = new Set(recentHeartbeats.map((h) => h.accountId));
    const allLiveShopIds = new Set([...wsShopIds, ...recentShopIds]);
    const online = allLiveShopIds.size;

    // Canlı Ziyaretçi Tablosu: Kim, nereden, hangi cihazla, ne zaman girdi?
    const liveVisitors = Array.from(allLiveShopIds).map((accId) => {
      const acc = findAccountById(accId);
      const wsInfo = wsConnectedShops.find((w) => w.accountId === accId);
      const hbInfo = recentHeartbeats.find((h) => h.accountId === accId);

      const ip = wsInfo?.ip || hbInfo?.ip || acc?.lastLoginIp || 'unknown';
      const deviceType = wsInfo?.deviceType || hbInfo?.deviceType || 'desktop';
      const browserInfo = wsInfo?.browserInfo || hbInfo?.browserInfo || 'Bilinmiyor';
      const connectedAt = wsInfo?.connectedAt || hbInfo?.lastSeenAt || acc?.lastLoginAt || new Date().toISOString();
      const connectionType = wsInfo ? 'websocket' : 'http_recent';

      return {
        accountId: accId,
        shopName: acc?.shopName || 'Bilinmeyen Dükkan',
        ownerName: acc?.ownerName || 'Bilinmiyor',
        phone: acc?.phone || '',
        ip,
        deviceType,
        browserInfo,
        connectedAt,
        connectionType,
      };
    }).sort((a, b) => b.connectedAt.localeCompare(a.connectedAt));

    const events = getAuthEvents(500);
    const today = new Date().toISOString().slice(0, 10);
    const ipSet = new Set<string>();
    for (const e of events) if (e.ip && e.ip !== 'unknown') ipSet.add(e.ip);
    for (const o of owners) {
      if (o.createdIp && o.createdIp !== 'unknown') ipSet.add(o.createdIp);
      if (o.lastLoginIp && o.lastLoginIp !== 'unknown') ipSet.add(o.lastLoginIp);
    }
    for (const v of liveVisitors) if (v.ip && v.ip !== 'unknown') ipSet.add(v.ip);

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

    const failedToday = events.filter(
      (e) => (e.type === 'login_fail' || e.type === 'locked') && e.at.slice(0, 10) === today
    ).length;
    const lockedPhones = owners.filter((o) => isLoginLocked(o.phone) > 0).map((o) => o.phone);

    res.json({
      shops: owners.length,
      online, // Gerçek canlı tekil dükkan sayısı
      wsOnline: wsConnectedShops.length,
      recentOnline: recentHeartbeats.length,
      liveVisitors, // Gerçek canlı ziyaretçilerin cihaz ve IP tablosu
      liveActivities: getRecentLiveActivities(20), // Canlı hareket akışı
      customers,
      transactions,
      // Büyüme & Dönüşüm Hunisi (Funnel)
      funnel: {
        totalShops: owners.length,
        configuredShops,
        firstTransactionShops,
        activeLast7DaysShops,
        trialVipShops,
        paidVipShops,
        ustaVipCount,
        patronVipCount,
        cirakCount,
      },
      eventsTotal: events.length,
      eventsToday: events.filter((e) => e.at.slice(0, 10) === today).length,
      failedToday,
      lockedCount: lockedPhones.length,
      lockedPhones: lockedPhones.slice(0, 10),
      uniqueIps: ipSet.size,
      week,
      recentRegisters,
      recentLogins,
    });
  });

  // Dükkan İçi Detaylı Canlı Röntgensel İnceleme (Live Snapshot Modal)
  app.get('/api/admin/shops/:id/live-snapshot', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const acc = findAccountById(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Dükkan bulunamadı.' });

    const st = loadShopState(acc.id);
    const todayStr = new Date().toISOString().slice(0, 10);

    // Canlı bağlantı durumu
    const wsConnected = getConnectedAccounts().find((w) => w.accountId === acc.id);
    const isRecent = isAccountRecentlyActive(acc.id, 5 * 60 * 1000);

    // Bugünkü İşlemler
    const todayTxs = (st.transactions || []).filter((tx) => (tx.date || tx.createdAt || '').slice(0, 10) === todayStr);
    const todaySales = todayTxs.filter((tx) => tx.type === 'tahsilat');
    const todayIncomeTotal = todaySales.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const todayExpenseTotal = todayTxs.filter((tx) => tx.type === 'gider' || tx.type === 'masraf').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    // Ödeme yöntemi kırılımı
    const cashTotal = todaySales.filter((t) => t.paymentMethod === 'nakit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const cardTotal = todaySales.filter((t) => t.paymentMethod === 'kart').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const creditTotal = todayTxs.filter((t) => t.paymentMethod === 'veresiye' || t.type === 'veresiye').reduce((s, t) => s + (Number(t.amount) || 0), 0);

    // Masalar (Restoran / Kafe sektörü)
    const tables = st.tables || [];
    const occupiedTables = tables.filter((t) => t.isOccupied || (t.orders && t.orders.length > 0));
    const tablesOpenTotal = occupiedTables.reduce((sum, t) => sum + (Number((t as any).totalAmount) || 0), 0);

    // Randevular (Berber / Kuaför sektörü)
    const appointments = st.appointments || [];
    const todayAppointments = appointments.filter((a) => (a.appointmentDate || (a as any).date || '').slice(0, 10) === todayStr);

    // Tamir fişleri (Teknik Servis)
    const repairTickets = st.repairTickets || [];
    const activeRepairs = repairTickets.filter((r) => r.status !== 'teslim_edildi');

    // Müşteriler & Borçlar
    const customers = st.customers || [];
    const debtCustomers = customers.filter((c) => (c.balance || 0) < 0);
    const totalReceivable = Math.abs(debtCustomers.reduce((sum, c) => sum + (c.balance || 0), 0));

    // Kasa hesaplaması
    let totalCashRegister = 0;
    try {
      const { calculateCashRegister } = require('../cash');
      const cashObj = calculateCashRegister();
      totalCashRegister = cashObj?.currentBalance || 0;
    } catch {
      totalCashRegister = todayIncomeTotal - todayExpenseTotal;
    }

    res.json({
      shop: {
        id: acc.id,
        shopName: acc.shopName,
        ownerName: acc.ownerName,
        phone: acc.phone,
        createdAt: acc.createdAt,
        isVip: Boolean(st.shopProfile?.isVip),
        vipTier: st.shopProfile?.vipTier || 'cirak',
        vipPlan: st.shopProfile?.vipPlan || null,
        vipUntil: st.shopProfile?.vipUntil || null,
        businessField: st.shopProfile?.businessField || 'Genel',
        cityDistrict: st.shopProfile?.cityDistrict || '',
      },
      liveStatus: {
        isWsConnected: Boolean(wsConnected),
        isRecentActive: isRecent,
        status: wsConnected ? 'online_ws' : isRecent ? 'online_http' : 'offline',
        ip: wsConnected?.ip || acc.lastLoginIp || 'unknown',
        deviceType: wsConnected?.deviceType || 'desktop',
        browserInfo: wsConnected?.browserInfo || 'Bilinmiyor',
        connectedAt: wsConnected?.connectedAt || acc.lastLoginAt || null,
      },
      finance: {
        todayIncomeTotal,
        todayExpenseTotal,
        netTotal: todayIncomeTotal - todayExpenseTotal,
        txCount: todayTxs.length,
        cashTotal,
        cardTotal,
        creditTotal,
        totalCashRegister,
        recentTransactions: todayTxs.slice(-8).reverse(),
      },
      tables: {
        total: tables.length,
        occupiedCount: occupiedTables.length,
        tablesOpenTotal,
        occupiedList: occupiedTables.map((t) => ({
          id: t.id,
          name: t.name,
          orderCount: t.orders?.length || 0,
          totalAmount: (t as any).totalAmount || 0,
          openedAt: (t as any).openedAt || null,
        })),
      },
      appointments: {
        totalToday: todayAppointments.length,
        list: todayAppointments.slice(0, 10).map((a) => ({
          id: a.id,
          time: a.timeSlot || (a as any).time || '—',
          customerName: a.customerName,
          serviceName: a.serviceName,
          price: a.price,
          status: a.status,
        })),
      },
      repairTickets: {
        totalActive: activeRepairs.length,
        list: activeRepairs.slice(0, 5),
      },
      customers: {
        total: customers.length,
        debtCount: debtCustomers.length,
        totalReceivable,
      },
      products: {
        total: (st.products || []).length,
      },
    });
  });

  // Dükkan oturumlarını kapat (uzaktan at)
  app.post('/api/admin/shops/:id/kick', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const acc = findAccountById(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Dükkan bulunamadı.' });
    removeSessionsForAccount(acc.id);
    for (const s of getAccounts().filter((x) => x.parentAccountId === acc.id)) {
      removeSessionsForAccount(s.id);
    }
    logAuthEvent('admin_kick', acc.phone, clientIp(req));
    res.json({ success: true, shopName: acc.shopName });
  });

  // Dükkanın VIP durumunu aç / kapat (+14 deneme / +30 / +365 gün süreli, usta / patron)
  app.post('/api/admin/shops/:id/toggle-vip', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const acc = findAccountById(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Dükkan bulunamadı.' });

    const { days = 30, plan, action, tier } = req.body || {};
    const st = loadShopState(acc.id);
    if (!st.shopProfile) {
      st.shopProfile = {
        storeName: acc.shopName,
        ownerName: acc.ownerName,
        phone: acc.phone,
        isVip: false,
      } as any;
    }

    let nextVip: boolean;
    if (action === 'grant') {
      nextVip = true;
    } else if (action === 'revoke') {
      nextVip = false;
    } else if (typeof req.body?.isVip === 'boolean') {
      nextVip = req.body.isVip;
    } else {
      nextVip = !st.shopProfile.isVip;
    }

    st.shopProfile.isVip = nextVip;

    if (nextVip) {
      const numDays = Number(days);
      const isTrial = numDays === 14 || plan === 'deneme_14_gun' || plan === '14_gun_deneme';
      const assignedTier = tier === 'usta' ? 'usta' : tier === 'patron' ? 'patron' : isTrial ? 'usta' : 'patron';
      const assignedPlan = isTrial
        ? 'deneme_14_gun'
        : plan === 'yearly' || numDays === 365
        ? 'yearly'
        : 'monthly';

      st.shopProfile.vipPlan = assignedPlan;
      st.shopProfile.vipTier = assignedTier;

      const existingExpiry = st.shopProfile.vipUntil ? new Date(st.shopProfile.vipUntil).getTime() : 0;
      const baseMs = Number.isFinite(existingExpiry) && existingExpiry > Date.now()
        ? existingExpiry
        : Date.now();
      const until = new Date(baseMs + numDays * 86400000);
      st.shopProfile.vipUntil = until.toISOString();
      st.shopProfile.vipExpiresAt = until.toISOString();
    } else {
      st.shopProfile.vipPlan = undefined;
      st.shopProfile.vipTier = 'cirak';
      st.shopProfile.vipUntil = undefined;
      st.shopProfile.vipExpiresAt = undefined;
    }

    st.lastUpdated = new Date().toISOString();
    persistShopState(acc.id, st);

    // Canlı WebSocket bildirimi: Açık olan istemci ekranına anında VIP durumunu ilet
    try {
      const { broadcastToAccount } = require('../realtime');
      broadcastToAccount(acc.id, {
        type: 'SHOP_PROFILE_UPDATED',
        payload: st.shopProfile,
      });
    } catch (e) {
      console.error('Failed to broadcast VIP update:', e);
    }

    res.json({
      success: true,
      shopName: acc.shopName,
      isVip: nextVip,
      vipTier: st.shopProfile.vipTier,
      vipPlan: st.shopProfile.vipPlan,
      vipUntil: st.shopProfile.vipUntil,
    });
  });

  // Özel Panel Talepleri Listesi
  app.get('/api/admin/panel-requests', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    res.json({ success: true, requests: getCustomPanelLeads() });
  });

  // Özel Panel Talebi Durum Güncelle ('beklemede' | 'arandi' | 'tamamlandi' | 'red')
  app.post('/api/admin/panel-requests/:id/status', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const { status } = req.body;
    const leads = getCustomPanelLeads();
    const lead = leads.find((l) => l.id === req.params.id);
    if (!lead) return res.status(404).json({ error: 'Talep bulunamadı.' });
    lead.status = status || lead.status;
    saveCustomPanelLeads(leads);
    res.json({ success: true, lead });
  });

  // Özel Panel Talebi Sil
  app.delete('/api/admin/panel-requests/:id', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    let leads = getCustomPanelLeads();
    leads = leads.filter((l) => l.id !== req.params.id);
    saveCustomPanelLeads(leads);
    res.json({ success: true });
  });

  // Dükkanı tamamen sil (hesap + personel + veri dosyası)
  app.delete('/api/admin/shops/:id', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const acc = findAccountById(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Dükkan bulunamadı.' });
    if ((acc.role || 'owner') !== 'owner') {
      return res.status(400).json({ error: 'Sadece ana dükkan hesabı silinebilir.' });
    }
    for (const s of getAccounts().filter((x) => x.parentAccountId === acc.id)) {
      removeAccount(s.id);
    }
    removeAccount(acc.id);
    try {
      fs.unlinkSync(path.join(SHOPS_DIR, acc.id + '.json'));
    } catch { /* dosya yoksa sorun değil */ }
    logAuthEvent('admin_delete', acc.phone, clientIp(req));
    res.json({ success: true, shopName: acc.shopName });
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

  // Tüm veritabanının yedeğini tek tıkla JSON arşivi olarak indirme
  app.get('/api/admin/backup/export', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const accounts = getAccounts();
    const shops: Record<string, any> = {};
    for (const a of accounts) {
      try {
        shops[a.id] = loadShopState(a.id);
      } catch (e) {}
    }
    const backupData = {
      exportedAt: new Date().toISOString(),
      accounts,
      shops,
    };
    const filename = `dukkanim_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backupData, null, 2));
  });

  // ---------------- Ziyaretçi & Yabancı IP Takibi API Uçları ----------------
  app.get('/api/admin/visitors', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const foreignOnly = req.query.foreignOnly === '1' || req.query.foreignOnly === 'true';
    const botsOnly = req.query.botsOnly === '1' || req.query.botsOnly === 'true';
    const humanOnly = req.query.humanOnly === '1' || req.query.humanOnly === 'true';
    const suspiciousOnly = req.query.suspiciousOnly === '1' || req.query.suspiciousOnly === 'true';
    const customerOnly = req.query.customerOnly === '1' || req.query.customerOnly === 'true';
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 150;

    const data = getVisitorRecords({
      foreignOnly,
      botsOnly,
      humanOnly,
      suspiciousOnly,
      customerOnly,
      search,
      limit,
    });
    res.json(data);
  });

  // Engellenen IP Listesi
  app.get('/api/admin/visitors/blocked', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    res.json({ blockedIps: getBlockedIps() });
  });

  // Manuel veya Şüpheli IP Engelleme
  app.post('/api/admin/visitors/block', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const { ip, reason, country } = req.body || {};
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Geçerli bir IP adresi gereklidir.' });
    }
    const success = blockIp(ip, reason, country);
    res.json({ success, blockedIps: getBlockedIps() });
  });

  // IP Engelini Kaldırma
  app.delete('/api/admin/visitors/block/:ip', (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const ip = req.params.ip;
    if (!ip) {
      return res.status(400).json({ error: 'IP parametresi eksik.' });
    }
    const success = unblockIp(ip);
    res.json({ success, blockedIps: getBlockedIps() });
  });
}
