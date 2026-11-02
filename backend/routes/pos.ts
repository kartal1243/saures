import type { Express, Request, Response } from 'express';
import type { StockMovement, Transaction } from '../../shared/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';
import { localDay } from '../day';

export function registerPosRoutes(app: Express): void {
  // 17. Hızlı POS satışı: kasaya tahsilat + stoktan düşüm
  app.post('/api/quick-pos-sale', (req: Request, res: Response) => {
    const { items, paymentMethod, cashReceived } = req.body;
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

    const receiptNo = `FIS-${Date.now().toString().slice(-6)}`;
    const parsedCashReceived = Number(cashReceived) || totalAmount;
    const changeAmount = parsedCashReceived > totalAmount ? Number((parsedCashReceived - totalAmount).toFixed(2)) : 0;

    const receipt = {
      receiptNo,
      storeName: S().storeName || S().shopProfile?.storeName || 'Dükkânım Yanımda Market',
      date: `${todayStr} ${timeStr}`,
      paymentMethod: paymentMethod === 'nakit' ? 'Nakit' : 'Kredi Kartı / POS',
      items: items.map((it: any) => ({
        productId: it.productId,
        name: it.name,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        total: Number(it.total) || Number((Number(it.unitPrice) * Number(it.quantity)).toFixed(2)),
        isWeighed: Boolean(it.isWeighed),
      })),
      totalAmount,
      cashReceived: parsedCashReceived,
      changeAmount,
      footerMessage: 'Mali değeri yoktur — Bilgi fişidir.',
    };

    res.json({ success: true, transaction, cash, receipt });
  });

  // Test fişi verisi endpoint'i
  app.get('/api/pos/test-receipt', (_req: Request, res: Response) => {
    const now = new Date();
    const todayStr = S().businessDate || localDay();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    res.json({
      receiptNo: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      storeName: S().storeName || S().shopProfile?.storeName || 'Dükkânım Yanımda Market',
      date: `${todayStr} ${timeStr}`,
      paymentMethod: 'Test / Tanıtım',
      items: [
        { name: 'Somun Ekmek 200g', quantity: 2, unitPrice: 10, total: 20 },
        { name: 'Çaykur Rize Çay 1kg', quantity: 1, unitPrice: 175, total: 175 },
        { name: 'Yerli Domates (1.25 kg)', quantity: 1.25, unitPrice: 40, total: 50, isWeighed: true },
      ],
      totalAmount: 245.0,
      cashReceived: 250.0,
      changeAmount: 5.0,
      footerMessage: 'Yazıcı Test Fişi — 58mm / 80mm Uyumlu',
    });
  });
}
