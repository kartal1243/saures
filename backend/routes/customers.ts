import type { Express, Request, Response } from 'express';
import type { Customer, Transaction } from '../../shared/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';
import { localDay } from '../day';

export function registerCustomerRoutes(app: Express): void {
  app.post('/api/customers', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.name || !data.phone) {
      return res.status(400).json({ error: 'Müşteri adı ve telefon numarası zorunludur.' });
    }

    let customer: Customer;
    const now = new Date().toISOString();

    if (data.id) {
      // Update
      const index = S().customers.findIndex((c) => c.id === data.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Müşteri bulunamadı.' });
      }
      customer = {
        ...S().customers[index],
        ...data,
        updatedAt: now,
      };
      S().customers[index] = customer;
    } else {
      // 0 TL Standart Plan Koruması: VIP olmayan dükkanlar en fazla 25 müşteri ekleyebilir
      const profile = S().shopProfile;
      const isVip = Boolean(
        profile?.isVip &&
        (!profile.vipUntil || new Date(profile.vipUntil).getTime() > Date.now())
      );

      if (!isVip && Array.isArray(S().customers) && S().customers.length >= 25) {
        return res.status(403).json({
          error: '0 TL Standart planda en fazla 25 müşteri kaydedebilirsiniz. Sınırsız müşteri ve veresiye takibi için VIP Pakete geçin.',
          code: 'VIP_REQUIRED',
          limit: 25,
          current: S().customers.length,
        });
      }

      // Create
      customer = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: data.name.trim(),
        phone: data.phone.trim(),
        businessCategory: data.businessCategory || 'bakkal_market',
        balance: Number(data.initialBalance || 0),
        notes: data.notes || '',
        subscriptionPlan: data.subscriptionPlan || undefined,
        createdAt: now,
        updatedAt: now,
      };

      // If initial balance > 0, create an initial veresiye transaction
      if (customer.balance > 0) {
        const todayStr = S().businessDate || localDay();
        const initialTx: Transaction = {
          id: `tx_${Date.now()}`,
          customerId: customer.id,
          customerName: customer.name,
          type: 'veresiye',
          amount: customer.balance,
          paymentMethod: 'veresiye',
          description: 'Açılış veresiye devir bakiyesi',
          date: `${todayStr} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
          createdAt: now,
        };
        S().transactions.unshift(initialTx);
      }

      S().customers.unshift(customer);
    }

    saveState();
    const cash = calculateCashRegister();
    broadcast({ type: 'CUSTOMER_UPDATED', payload: { customer, cash } });

    res.json({ success: true, customer, cash });
  });

  // 4. Delete customer
  app.delete('/api/customers/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    S().customers = S().customers.filter((c) => c.id !== id);
    saveState();
    const cash = calculateCashRegister();
    broadcast({ type: 'CUSTOMER_DELETED', payload: { customerId: id, cash } });
    res.json({ success: true, customerId: id, cash });
  });
}
