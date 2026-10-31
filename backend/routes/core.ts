import type { Express, Request, Response } from 'express';
import { S, saveState, als } from '../context';
import { calculateCashRegister } from '../cash';
import { buildInitEvent, broadcast, clientCount } from '../realtime';
import { DEMO_ACCOUNT_ID } from '../demoSeed';
import { FREE_CUSTOMER_LIMIT, FREE_TABLE_LIMIT } from '../config';
import { checkAndUpdateVipStatus } from './profile';

export function registerCoreRoutes(app: Express): void {
  // 1. Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), clientsCount: clientCount() });
  });

  // 1b. Tam yedek indir (JSON) — sadece owner
  app.get('/api/backup', (_req, res) => {
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Disposition', `attachment; filename="esnaf-yedek-${today}.json"`);
    res.json({ version: 1, exportedAt: new Date().toISOString(), state: S() });
  });

  // 1c. Yedek geri yukle (JSON) — sadece owner, VIP ve kota kurallarini koruyarak dogrulamali
  app.post('/api/backup/restore', (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (ctx?.accountId === DEMO_ACCOUNT_ID) {
      return res.status(403).json({ error: 'Ortak demo hesabına yedek geri yüklenemez.' });
    }
    const ns = (req.body || {}).state;
    if (!ns || !Array.isArray(ns.customers) || !Array.isArray(ns.transactions)) {
      return res.status(400).json({ error: 'Gecersiz yedek dosyasi.' });
    }
    const st = S();
    const isActiveVip = checkAndUpdateVipStatus(st.shopProfile);

    // VIP olmayan hesaplar yedek yükleyerek 25 müşteri / 3 masa limitini delemez
    st.customers = isActiveVip ? ns.customers : ns.customers.slice(0, FREE_CUSTOMER_LIMIT);
    st.transactions = ns.transactions;
    st.reminderLogs = Array.isArray(ns.reminderLogs) ? ns.reminderLogs : [];
    st.dailyClosings = Array.isArray(ns.dailyClosings) ? ns.dailyClosings : [];
    st.products = Array.isArray(ns.products) ? ns.products : [];
    st.stockMovements = Array.isArray(ns.stockMovements) ? ns.stockMovements : [];
    st.appointments = Array.isArray(ns.appointments) ? ns.appointments : [];
    st.tables = isActiveVip
      ? (Array.isArray(ns.tables) ? ns.tables : [])
      : (Array.isArray(ns.tables) ? ns.tables.slice(0, FREE_TABLE_LIMIT) : []);
    st.repairTickets = Array.isArray(ns.repairTickets) ? ns.repairTickets : [];
    st.suppliers = Array.isArray(ns.suppliers) ? ns.suppliers : [];
    (st as any).services = Array.isArray(ns.services) ? ns.services : [];
    (st as any).cases = Array.isArray(ns.cases) ? ns.cases : [];
    (st as any).custody = Array.isArray(ns.custody) ? ns.custody : [];
    if (ns.shopProfile && typeof ns.shopProfile === 'object') {
      // GÜVENLİK: isVip, vipPlan, vipUntil, vipExpiresAt, aiOcrScansUsed ASLA istemci yedeğinden alınmaz!
      const preservedVip = {
        isVip: Boolean(st.shopProfile?.isVip),
        vipPlan: st.shopProfile?.vipPlan,
        vipUntil: st.shopProfile?.vipUntil,
        vipExpiresAt: st.shopProfile?.vipExpiresAt,
        aiOcrScansUsed: st.shopProfile?.aiOcrScansUsed || 0,
      };
      st.shopProfile = {
        ...st.shopProfile,
        ...ns.shopProfile,
        ...preservedVip,
      };
      st.storeName = ns.shopProfile.storeName || st.storeName;
    }
    saveState();
    broadcast(buildInitEvent(st));
    res.json({ success: true });
  });

  // 2. Full state fetch
  app.get('/api/data', (_req, res) => {
    const prof = S().shopProfile;
    if (prof && prof.isVip && prof.vipUntil) {
      const expires = new Date(prof.vipUntil).getTime();
      if (!isNaN(expires) && expires < Date.now()) {
        prof.isVip = false;
        prof.vipPlan = undefined;
        prof.vipUntil = undefined;
        prof.vipExpiresAt = undefined;
        saveState();
      }
    }

    res.json({
      storeName: S().storeName,
      shopProfile: S().shopProfile,
      dailyClosings: S().dailyClosings,
      customers: S().customers,
      transactions: S().transactions,
      reminderLogs: S().reminderLogs,
      products: S().products || [],
      stockMovements: S().stockMovements || [],
      appointments: S().appointments || [],
      tables: S().tables || [],
      repairTickets: S().repairTickets || [],
      suppliers: S().suppliers || [],
      services: (S() as any).services || [],
      cases: (S() as any).cases || [],
      custody: (S() as any).custody || [],
      businessDate: S().businessDate,
      cash: calculateCashRegister(),
      lastUpdated: S().lastUpdated,
    });
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
}
