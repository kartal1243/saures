import type { Express, Request, Response } from 'express';
import type { StockMovement, Transaction } from '../../src/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';
import { localDay } from '../day';

export function registerPosRoutes(app: Express): void {
  // 17. Hızlı POS satışı: kasaya tahsilat + stoktan düşüm
  app.post('/api/quick-pos-sale', (req: Request, res: Response) => {
    const { items, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Sepette ürün bulunmalıdır.' });
    }

    const totalAmount = items.reduce((sum: number, it: any) => sum + (Number(it.total) || (Number(it.unitPrice) * Number(it.quantity))), 0);
    const summaryStr = items.map((it: any) => `${it.quantity}x ${it.name}`).join(', ');

    const now = new Date();
    const todayStr = S().businessDate || localDay();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // 1. Kasaya Tahsilat Ekle
    const transaction: Transaction = {
      id: `tx_pos_${Date.now()}`,
      customerId: '',
      customerName: 'Hızlı Tezgâh Satışı',
      type: 'tahsilat',
      amount: totalAmount,
      paymentMethod: paymentMethod || 'nakit',
      description: `Perakende Satış: ${summaryStr}`,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };
    S().transactions.unshift(transaction);

    // 2. Varsa Stoktan Düş & Hareket Kaydet
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
              reason: 'Hızlı Tezgâh Satışı',
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
}
