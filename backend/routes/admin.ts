import fs from 'fs';
import path from 'path';
import type { Express, Request, Response } from 'express';
import {
  getAccounts,
  accountFromRequest,
  isAdminAccount,
  countActiveSessions,
} from '../accounts';
import { loadShopState } from '../shopState';
import { SHOPS_DIR } from '../config';

// Sadece ADMIN_PHONES'taki numaralar. 401 = giris yok, 403 = yetki yok.
function requireAdmin(req: Request, res: Response) {
  const acc = accountFromRequest(req);
  if (!acc) {
    res.status(401).json({ error: 'Oturum bulunamadi.' });
    return null;
  }
  if (!isAdminAccount(acc)) {
    res.status(403).json({ error: 'Bu sayfa sadece site yoneticisine aciktir.' });
    return null;
  }
  return acc;
}

export function registerAdminRoutes(app: Express): void {
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
}
