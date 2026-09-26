import type { Express, Request, Response } from 'express';
import type { ServiceItem } from '../../src/types';
import { S, saveState } from '../context';
import { broadcast } from '../realtime';

export function registerServiceRoutes(app: Express): void {
  // ==========================================
  // 18b. HİZMET TARİFESİ (Berber/güzellik salonu fiyat listesi)
  // ==========================================
  app.post('/api/services', (req: Request, res: Response) => {
    const data = req.body || {};
    if (!data.name || !String(data.name).trim()) {
      return res.status(400).json({ error: 'Hizmet adı zorunludur.' });
    }
    const price = Number(data.price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Geçerli bir fiyat giriniz.' });
    }
    const now = new Date().toISOString();
    const list = (S() as any).services as ServiceItem[];
    let service: ServiceItem;
    if (data.id) {
      const idx = list.findIndex((s) => s.id === data.id);
      if (idx === -1) return res.status(404).json({ error: 'Hizmet bulunamadı.' });
      service = { ...list[idx], name: String(data.name).trim(), price, updatedAt: now };
      list[idx] = service;
    } else {
      service = {
        id: `srv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: String(data.name).trim(),
        price,
        createdAt: now,
        updatedAt: now,
      };
      list.unshift(service);
    }
    saveState();
    broadcast({ type: 'SERVICE_UPDATED', payload: service });
    res.json({ success: true, service });
  });

  app.delete('/api/services/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const list = (S() as any).services as ServiceItem[];
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Hizmet bulunamadı.' });
    list.splice(idx, 1);
    saveState();
    broadcast({ type: 'SERVICE_DELETED', payload: { id } });
    res.json({ success: true });
  });
}
