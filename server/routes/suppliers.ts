import type { Express, Request, Response } from 'express';
import type { Supplier, Transaction } from '../../src/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';
import { localDay } from '../day';

export function registerSupplierRoutes(app: Express): void {
  // ==========================================
  // 18. TEDARİKÇİ CARİ HESABI (Toptancı borcu takibi)
  // ==========================================
  app.post('/api/suppliers', (req: Request, res: Response) => {
    const data = req.body || {};
    if (!data.name || !String(data.name).trim()) {
      return res.status(400).json({ error: 'Tedarikçi adı zorunludur.' });
    }
    const now = new Date().toISOString();
    let supplier: Supplier;
    if (data.id) {
      const idx = S().suppliers.findIndex((s) => s.id === data.id);
      if (idx === -1) return res.status(404).json({ error: 'Tedarikçi bulunamadı.' });
      supplier = {
        ...S().suppliers[idx],
        name: String(data.name).trim(),
        phone: String(data.phone || '').trim(),
        notes: String(data.notes || ''),
        updatedAt: now,
      };
      S().suppliers[idx] = supplier;
    } else {
      supplier = {
        id: `sup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: String(data.name).trim(),
        phone: String(data.phone || '').trim(),
        balance: 0,
        notes: String(data.notes || ''),
        createdAt: now,
        updatedAt: now,
      };
      S().suppliers.unshift(supplier);
    }
    saveState();
    broadcast({ type: 'SUPPLIER_UPDATED', payload: supplier });
    res.json({ success: true, supplier });
  });

  app.delete('/api/suppliers/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = S().suppliers.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Tedarikçi bulunamadı.' });
    S().suppliers.splice(idx, 1);
    saveState();
    broadcast({ type: 'SUPPLIER_DELETED', payload: { id } });
    res.json({ success: true });
  });

  // Veresiye mal alımı: kasaya dokunmaz, borcu artırır
  app.post('/api/suppliers/:id/purchase', (req: Request, res: Response) => {
    const { id } = req.params;
    const amount = Number((req.body || {}).amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Geçerli bir alım tutarı giriniz.' });
    }
    const supplier = S().suppliers.find((s) => s.id === id);
    if (!supplier) return res.status(404).json({ error: 'Tedarikçi bulunamadı.' });
    supplier.balance = Math.round((supplier.balance + amount) * 100) / 100;
    supplier.updatedAt = new Date().toISOString();
    saveState();
    broadcast({ type: 'SUPPLIER_UPDATED', payload: supplier });
    res.json({ success: true, supplier });
  });

  // Tedarikçiye ödeme: borcu düşürür + kasadan gider işler
  app.post('/api/suppliers/:id/pay', (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};
    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Geçerli bir ödeme tutarı giriniz.' });
    }
    const supplier = S().suppliers.find((s) => s.id === id);
    if (!supplier) return res.status(404).json({ error: 'Tedarikçi bulunamadı.' });
    const now = new Date();
    const todayStr = S().businessDate || localDay();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    supplier.balance = Math.round((supplier.balance - amount) * 100) / 100;
    supplier.updatedAt = now.toISOString();

    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      customerId: '',
      customerName: `Tedarikçi: ${supplier.name}`,
      type: 'gider',
      amount,
      paymentMethod: body.paymentMethod || 'nakit',
      description: `Tedarikçi Ödemesi: ${supplier.name}`,
      category: 'Toptancı Ödemesi / Mal Alımı',
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };
    S().transactions.unshift(transaction);
    saveState();
    const cash = calculateCashRegister();
    broadcast({ type: 'SUPPLIER_UPDATED', payload: supplier });
    broadcast({ type: 'TRANSACTION_CREATED', payload: { transaction, cash } });
    res.json({ success: true, supplier, transaction, cash });
  });
}
