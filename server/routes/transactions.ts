import type { Express, Request, Response } from 'express';
import type { Customer, Transaction } from '../../src/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';

export function registerTransactionRoutes(app: Express): void {
  // 5. Create Transaction (Veresiye ekle, Tahsilat al, Kasa çıkışı yap)
  app.post('/api/transactions', (req: Request, res: Response) => {
    const { customerId, type, amount, paymentMethod, description, category } = req.body;
    const parsedAmount = Number(amount);

    if (!type || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Geçerli bir işlem türü ve tutar giriniz.' });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    let customer: Customer | undefined;
    let customerName = 'Genel Kasa Hareketi';

    if (customerId) {
      customer = S().customers.find((c) => c.id === customerId);
      if (customer) {
        customerName = customer.name;
        if (type === 'veresiye') {
          // Add to debt
          customer.balance += parsedAmount;
        } else if (type === 'tahsilat') {
          // Pay off debt
          customer.balance -= parsedAmount;
          customer.lastPaymentDate = todayStr;

          // If this customer has an active subscription and paid their subscription amount, auto-advance nextDueDate
          if (customer.subscriptionPlan?.enabled && customer.subscriptionPlan.nextDueDate) {
            const currentDue = new Date(customer.subscriptionPlan.nextDueDate);
            if (customer.subscriptionPlan.interval === 'aylik') {
              currentDue.setMonth(currentDue.getMonth() + 1);
            } else if (customer.subscriptionPlan.interval === 'haftalik') {
              currentDue.setDate(currentDue.getDate() + 7);
            } else if (customer.subscriptionPlan.interval === '3_aylik') {
              currentDue.setMonth(currentDue.getMonth() + 3);
            } else if (customer.subscriptionPlan.interval === 'yillik') {
              currentDue.setFullYear(currentDue.getFullYear() + 1);
            } else if (customer.subscriptionPlan.interval === 'periyodik_bakim') {
              currentDue.setMonth(currentDue.getMonth() + 6);
            }
            customer.subscriptionPlan.nextDueDate = currentDue.toISOString().split('T')[0];
          }
        }
        customer.updatedAt = now.toISOString();
      }
    }

    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      customerId: customerId || '',
      customerName,
      type,
      amount: parsedAmount,
      paymentMethod: paymentMethod || 'nakit',
      description: description || (type === 'veresiye' ? 'Veresiye Borç Yazıldı' : type === 'tahsilat' ? 'Ödeme Alındı' : 'Dükkan Masrafı'),
      category: typeof category === 'string' && category.trim() ? category.trim() : undefined,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };

    S().transactions.unshift(transaction);
    saveState();

    const cash = calculateCashRegister();
    broadcast({
      type: 'TRANSACTION_CREATED',
      payload: { transaction, customer: customer || undefined, cash },
    });

    res.json({ success: true, transaction, customer, cash });
  });
}
