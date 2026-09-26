import type { Express, Request, Response } from 'express';
import type { RestaurantTable, Transaction } from '../../src/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';
import { localDay } from '../day';

export function registerTableRoutes(app: Express): void {
  // ==========================================
  // 15. SEKTÖRE ÖZEL: RESTORAN & KAFE (MASA & ADİSYON YÖNETİMİ)
  // ==========================================
  app.get('/api/tables', (_req, res) => {
    res.json({ tables: S().tables || [] });
  });

  // Not: eski ön yüzler /orders (çoğul) çağırır — ikisini de karşıla
  const handleTableOrder = (req: Request, res: Response) => {
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
  };

  app.post('/api/tables/:id/order', handleTableOrder);
  app.post('/api/tables/:id/orders', handleTableOrder);

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
    const todayStr = S().businessDate || localDay();
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

  app.delete('/api/tables/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!S().tables) S().tables = [];
    const table = S().tables.find((t) => t.id === id);
    if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });
    if (table.isOccupied && table.orders.length > 0) {
      return res.status(400).json({ error: 'Açık adisyonu olan masa silinemez. Önce hesabı kapatın.' });
    }
    S().tables = S().tables.filter((t) => t.id !== id);
    saveState();
    broadcast({ type: 'TABLE_DELETED', payload: { id } });
    res.json({ success: true });
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
}
