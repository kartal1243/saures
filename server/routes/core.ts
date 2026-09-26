import type { Express, Request, Response } from 'express';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { buildInitEvent, broadcast, clientCount } from '../realtime';

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
    st.suppliers = Array.isArray(ns.suppliers) ? ns.suppliers : [];
    (st as any).services = Array.isArray(ns.services) ? ns.services : [];
    (st as any).cases = Array.isArray(ns.cases) ? ns.cases : [];
    (st as any).custody = Array.isArray(ns.custody) ? ns.custody : [];
    if (ns.shopProfile && typeof ns.shopProfile === 'object') {
      st.shopProfile = { ...st.shopProfile, ...ns.shopProfile };
      st.storeName = ns.shopProfile.storeName || st.storeName;
    }
    saveState();
    broadcast(buildInitEvent(st));
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
      suppliers: S().suppliers || [],
      services: (S() as any).services || [],
      cases: (S() as any).cases || [],
      custody: (S() as any).custody || [],
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
