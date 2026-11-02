import type { Express, Request, Response } from 'express';
import type { Customer, RestaurantTable, TableOrderItem, Transaction } from '../../shared/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';
import { localDay } from '../day';
import { getTierLimits } from './profile';

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
    const { name, quantity, unitPrice, isGift, note } = req.body;
    if (!name || quantity === undefined) {
      return res.status(400).json({ error: 'Ürün adı ve adet zorunludur.' });
    }
    if (!S().tables) S().tables = [];
    const table = S().tables.find((t) => t.id === id);
    if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

    const qty = Number(quantity) || 1;
    const price = Number(unitPrice) || 0;
    const isGiftItem = Boolean(isGift);
    const itemTotal = isGiftItem ? 0 : qty * price;

    const existingItem = table.orders.find(
      (o) => o.name.toLowerCase() === name.trim().toLowerCase() && Boolean(o.isGift) === isGiftItem
    );

    if (existingItem) {
      existingItem.quantity += qty;
      if (note !== undefined) existingItem.note = note ? note.trim() : undefined;
      if (existingItem.quantity <= 0) {
        table.orders = table.orders.filter((o) => o.id !== existingItem.id);
      } else {
        existingItem.total = existingItem.isGift ? 0 : existingItem.quantity * existingItem.unitPrice;
      }
    } else if (qty > 0) {
      table.orders.push({
        id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
        name: name.trim(),
        quantity: qty,
        unitPrice: price,
        total: itemTotal,
        isGift: isGiftItem,
        note: note ? note.trim() : undefined,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      });
    }

    table.totalAmount = table.orders.reduce((sum, o) => sum + (o.isGift ? 0 : o.total), 0);
    if (table.orders.length === 0) {
      table.isOccupied = false;
      table.openedAt = undefined;
    } else {
      table.isOccupied = true;
      if (!table.openedAt) {
        table.openedAt = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      }
    }

    saveState();
    broadcast({ type: 'TABLE_UPDATED', payload: table });
    res.json({ success: true, table });
  };

  app.post('/api/tables/:id/order', handleTableOrder);
  app.post('/api/tables/:id/orders', handleTableOrder);

  // İkram Durumu Değiştirme (İkram Yap / İkramı Kaldır)
  app.post('/api/tables/:id/orders/:orderId/gift', (req: Request, res: Response) => {
    const { id, orderId } = req.params;
    const { isGift } = req.body;
    if (!S().tables) S().tables = [];
    const table = S().tables.find((t) => t.id === id);
    if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

    const order = table.orders.find((o) => o.id === orderId);
    if (!order) return res.status(404).json({ error: 'Sipariş kalemi bulunamadı.' });

    order.isGift = isGift !== undefined ? Boolean(isGift) : !order.isGift;
    order.total = order.isGift ? 0 : order.quantity * order.unitPrice;

    table.totalAmount = table.orders.reduce((sum, o) => sum + (o.isGift ? 0 : o.total), 0);
    saveState();
    broadcast({ type: 'TABLE_UPDATED', payload: table });
    res.json({ success: true, table, order });
  });

  // Sipariş kalemi silme / iptal
  app.delete('/api/tables/:id/orders/:orderId', (req: Request, res: Response) => {
    const { id, orderId } = req.params;
    if (!S().tables) S().tables = [];
    const table = S().tables.find((t) => t.id === id);
    if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

    table.orders = table.orders.filter((o) => o.id !== orderId);
    table.totalAmount = table.orders.reduce((sum, o) => sum + (o.isGift ? 0 : o.total), 0);
    if (table.orders.length === 0) {
      table.isOccupied = false;
      table.openedAt = undefined;
    }

    saveState();
    broadcast({ type: 'TABLE_UPDATED', payload: table });
    res.json({ success: true, table });
  });

  // Masa Notu Ekleme / Güncelleme
  app.post('/api/tables/:id/note', (req: Request, res: Response) => {
    const { id } = req.params;
    const { note } = req.body;
    if (!S().tables) S().tables = [];
    const table = S().tables.find((t) => t.id === id);
    if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

    table.note = typeof note === 'string' ? note.trim() : undefined;
    saveState();
    broadcast({ type: 'TABLE_UPDATED', payload: table });
    res.json({ success: true, table });
  });

  // Masa Taşıma / Aktarma / Birleştirme
  app.post('/api/tables/:id/move', (req: Request, res: Response) => {
    const { id } = req.params;
    const { targetTableId } = req.body;
    if (!targetTableId || targetTableId === id) {
      return res.status(400).json({ error: 'Geçerli bir hedef masa seçiniz.' });
    }

    if (!S().tables) S().tables = [];
    const sourceTable = S().tables.find((t) => t.id === id);
    const targetTable = S().tables.find((t) => t.id === targetTableId);

    if (!sourceTable || !targetTable) {
      return res.status(404).json({ error: 'Kaynak veya hedef masa bulunamadı.' });
    }

    if (!sourceTable.isOccupied && sourceTable.orders.length === 0) {
      return res.status(400).json({ error: 'Taşınacak masada açık sipariş yok.' });
    }

    // Hedef masaya siparişleri aktar / birleştir
    for (const sOrd of sourceTable.orders) {
      const existing = targetTable.orders.find(
        (tOrd) => tOrd.name.toLowerCase() === sOrd.name.toLowerCase() && Boolean(tOrd.isGift) === Boolean(sOrd.isGift)
      );
      if (existing) {
        existing.quantity += sOrd.quantity;
        existing.total = existing.isGift ? 0 : existing.quantity * existing.unitPrice;
      } else {
        targetTable.orders.push({ ...sOrd });
      }
    }

    targetTable.totalAmount = targetTable.orders.reduce((sum, o) => sum + (o.isGift ? 0 : o.total), 0);
    targetTable.isOccupied = true;
    if (!targetTable.openedAt) {
      targetTable.openedAt = sourceTable.openedAt || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    // Masa notunu birleştir
    if (sourceTable.note) {
      targetTable.note = targetTable.note ? `${targetTable.note} | ${sourceTable.note}` : sourceTable.note;
    }

    // Kaynak masayı sıfırla
    sourceTable.isOccupied = false;
    sourceTable.orders = [];
    sourceTable.totalAmount = 0;
    sourceTable.openedAt = undefined;
    sourceTable.guestCount = undefined;
    sourceTable.note = undefined;
    sourceTable.activeCall = null;

    saveState();
    broadcast({ type: 'TABLE_UPDATED', payload: sourceTable });
    broadcast({ type: 'TABLE_UPDATED', payload: targetTable });

    res.json({ success: true, sourceTable, targetTable });
  });

  // Hızlı & Parçalı Hesap Kapatma (Nakit / Kredi Kartı / Veresiye)
  app.post('/api/tables/:id/checkout', (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentMethod, amount, customerId, payments, closeTable } = req.body;
    if (!S().tables) S().tables = [];
    const table = S().tables.find((t) => t.id === id);
    if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

    if (table.totalAmount <= 0 && table.orders.length === 0) {
      return res.status(400).json({ error: 'Masada açık hesap bulunmuyor.' });
    }

    const orderSummary = table.orders.map((o) => `${o.quantity}x ${o.name}${o.isGift ? ' (İkram)' : ''}`).join(', ');
    const now = new Date();
    const todayStr = S().businessDate || localDay();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // Ödeme parçalarını derle
    type PaymentItem = {
      method: 'nakit' | 'kart' | 'veresiye';
      amount: number;
      customerId?: string;
      customerName?: string;
    };

    let paymentList: PaymentItem[] = [];
    if (Array.isArray(payments) && payments.length > 0) {
      paymentList = payments
        .map((p) => ({
          method: (p.method === 'kart' || p.method === 'veresiye' ? p.method : 'nakit') as 'nakit' | 'kart' | 'veresiye',
          amount: Number(p.amount) || 0,
          customerId: p.customerId,
          customerName: p.customerName,
        }))
        .filter((p) => p.amount > 0);
    } else {
      const pMethod = (paymentMethod === 'kart' || paymentMethod === 'veresiye' ? paymentMethod : 'nakit') as 'nakit' | 'kart' | 'veresiye';
      const pAmount = Number(amount) > 0 ? Number(amount) : table.totalAmount;
      paymentList = [{
        method: pMethod,
        amount: pAmount,
        customerId,
      }];
    }

    if (paymentList.length === 0) {
      return res.status(400).json({ error: 'Geçerli bir ödeme tutarı belirtilmedi.' });
    }

    const totalPaid = paymentList.reduce((sum, p) => sum + p.amount, 0);
    const createdTransactions: Transaction[] = [];
    let updatedCustomer: Customer | undefined;

    for (const p of paymentList) {
      if (p.method === 'veresiye') {
        let cust: Customer | undefined;
        if (p.customerId) {
          cust = S().customers.find((c) => c.id === p.customerId);
        }
        if (!cust && p.customerName) {
          cust = S().customers.find((c) => c.name.toLowerCase() === p.customerName!.trim().toLowerCase());
        }

        const custName = cust ? cust.name : (p.customerName || `Masa Müşterisi (${table.name})`);
        if (cust) {
          cust.balance += p.amount;
          cust.updatedAt = now.toISOString();
          updatedCustomer = cust;
        }

        const tx: Transaction = {
          id: `tx_tbl_v_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
          customerId: cust ? cust.id : '',
          customerName: custName,
          type: 'veresiye',
          amount: p.amount,
          paymentMethod: 'veresiye',
          description: `Masa Hesabı (Veresiye): ${table.name} (${orderSummary})`,
          date: `${todayStr} ${timeStr}`,
          createdAt: now.toISOString(),
        };
        S().transactions.unshift(tx);
        createdTransactions.push(tx);
      } else {
        const tx: Transaction = {
          id: `tx_tbl_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
          customerId: '',
          customerName: table.name,
          type: 'tahsilat',
          amount: p.amount,
          paymentMethod: p.method === 'kart' ? 'kart' : 'nakit',
          description: `Masa Hesabı: ${table.name} (${orderSummary})`,
          date: `${todayStr} ${timeStr}`,
          createdAt: now.toISOString(),
        };
        S().transactions.unshift(tx);
        createdTransactions.push(tx);
      }
    }

    // Masa hesabı tamamen kapatılıyor mu, yoksa kalan bakiye mi var?
    const isFullClose = closeTable === true || totalPaid >= table.totalAmount;

    if (isFullClose) {
      table.isOccupied = false;
      table.orders = [];
      table.totalAmount = 0;
      table.openedAt = undefined;
      table.guestCount = undefined;
      table.note = undefined;
      table.activeCall = null;
    } else {
      // Parçalı tahsilat: kalan tutarı düş
      table.totalAmount = Math.max(0, table.totalAmount - totalPaid);
    }

    saveState();

    const cash = calculateCashRegister();
    broadcast({ type: 'TABLE_UPDATED', payload: table });
    for (const tx of createdTransactions) {
      broadcast({
        type: 'TRANSACTION_CREATED',
        payload: { transaction: tx, cash, customer: updatedCustomer },
      });
    }

    if (updatedCustomer) {
      broadcast({
        type: 'CUSTOMER_UPDATED',
        payload: { customer: updatedCustomer, cash },
      });
    }

    res.json({
      success: true,
      table,
      transactions: createdTransactions,
      transaction: createdTransactions[0],
      customer: updatedCustomer,
      cash,
      isFullClose,
      remainingAmount: table.totalAmount,
    });
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
    table.activeCall = null;

    saveState();
    broadcast({ type: 'TABLE_UPDATED', payload: table });
    res.json({ success: true, table });
  });

  app.post('/api/tables/:id/clear-call', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!S().tables) S().tables = [];
    const table = S().tables.find((t) => t.id === id);
    if (!table) return res.status(404).json({ error: 'Masa bulunamadı.' });

    table.activeCall = null;
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

    const limits = getTierLimits(S().shopProfile);
    if (S().tables.length >= limits.maxTables) {
      return res.status(403).json({
        error: `Mevcut paketinizde en fazla ${limits.maxTables} masa ekleyebilirsiniz. Sınırsız masa ve QR menü için Patron VIP Pakete geçin.`,
        code: 'VIP_REQUIRED',
      });
    }

    const newTable: RestaurantTable = {
      id: `tbl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
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

