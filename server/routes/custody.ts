import type { Express, Request, Response } from 'express';
import type { CustodyTicket, Transaction } from '../../src/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';
import { localDay } from '../day';

export function registerCustodyRoutes(app: Express): void {
  // ==========================================
  // 18d. EMANET TAKİBİ (Terzi / kuru temizleme bırakılan eşya)
  // ==========================================
  app.post('/api/custody', (req: Request, res: Response) => {
    const data = req.body || {};
    if (!data.customerName || !String(data.customerName).trim()) {
      return res.status(400).json({ error: 'Müşteri adı zorunludur.' });
    }
    if (!data.itemDesc || !String(data.itemDesc).trim()) {
      return res.status(400).json({ error: 'Bırakılan eşya yazılmalıdır.' });
    }
    const now = new Date();
    const list = (S() as any).custody as CustodyTicket[];
    let ticket: CustodyTicket;
    if (data.id) {
      const idx = list.findIndex((t) => t.id === data.id);
      if (idx === -1) return res.status(404).json({ error: 'Emanet fişi bulunamadı.' });
      ticket = {
        ...list[idx],
        customerName: String(data.customerName).trim(),
        phone: String(data.phone || ''),
        customerId: data.customerId ? String(data.customerId) : undefined,
        itemDesc: String(data.itemDesc).trim(),
        promisedDate: String(data.promisedDate || ''),
        price: Number(data.price) || 0,
        advance: Number(data.advance) || 0,
        status: ['kabul', 'islemde', 'hazir', 'teslim'].includes(data.status) ? data.status : list[idx].status,
        notes: String(data.notes || ''),
      };
      list[idx] = ticket;
    } else {
      ticket = {
        id: `cus_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        customerName: String(data.customerName).trim(),
        phone: String(data.phone || ''),
        customerId: data.customerId ? String(data.customerId) : undefined,
        itemDesc: String(data.itemDesc).trim(),
        promisedDate: String(data.promisedDate || ''),
        price: Number(data.price) || 0,
        advance: Number(data.advance) || 0,
        status: 'kabul',
        notes: String(data.notes || ''),
        createdAt: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
      };
      list.unshift(ticket);
    }
    saveState();
    broadcast({ type: 'CUSTODY_UPDATED', payload: ticket });
    res.json({ success: true, ticket });
  });

  app.post('/api/custody/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body || {};
    const list = (S() as any).custody as CustodyTicket[];
    const ticket = list.find((t) => t.id === id);
    if (!ticket) return res.status(404).json({ error: 'Emanet fişi bulunamadı.' });
    if (!['kabul', 'islemde', 'hazir', 'teslim'].includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum.' });
    }
    ticket.status = status;
    saveState();
    broadcast({ type: 'CUSTODY_UPDATED', payload: ticket });
    res.json({ success: true, ticket });
  });

  // Teslim + kalan tutarı kasaya tahsilat olarak işle
  app.post('/api/custody/:id/complete', (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentMethod } = req.body || {};
    const list = (S() as any).custody as CustodyTicket[];
    const ticket = list.find((t) => t.id === id);
    if (!ticket) return res.status(404).json({ error: 'Emanet fişi bulunamadı.' });

    ticket.status = 'teslim';
    ticket.completedAt = new Date().toISOString();

    const now = new Date();
    const todayStr = S().businessDate || localDay();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const rest = Math.max(0, (ticket.price || 0) - (ticket.advance || 0));

    let incomeTx: Transaction | null = null;
    if (rest > 0) {
      incomeTx = {
        id: `tx_cus_inc_${Date.now()}`,
        customerId: ticket.customerId || '',
        customerName: ticket.customerName,
        type: 'tahsilat',
        amount: rest,
        paymentMethod: paymentMethod || 'nakit',
        description: `Emanet Teslimi: ${ticket.itemDesc}`,
        date: `${todayStr} ${timeStr}`,
        createdAt: now.toISOString(),
      };
      S().transactions.unshift(incomeTx);
    }

    saveState();
    const cash = calculateCashRegister();
    broadcast({ type: 'CUSTODY_UPDATED', payload: ticket });
    if (incomeTx) {
      broadcast({ type: 'TRANSACTION_CREATED', payload: { transaction: incomeTx, cash } });
    }
    res.json({ success: true, ticket, transaction: incomeTx, cash });
  });

  app.delete('/api/custody/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const list = (S() as any).custody as CustodyTicket[];
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Emanet fişi bulunamadı.' });
    list.splice(idx, 1);
    saveState();
    broadcast({ type: 'CUSTODY_DELETED', payload: { id } });
    res.json({ success: true });
  });
}
