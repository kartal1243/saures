import type { Express, Request, Response } from 'express';
import type { Customer, Transaction } from '../../shared/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';
import { localDay } from '../day';
import { getTierLimits } from './profile';
import { isValidTurkishPhone, normalizePhone } from '../accounts';

export function registerCustomerRoutes(app: Express): void {
  app.post('/api/customers', (req: Request, res: Response) => {
    const data = req.body || {};
    if (!data.name || !data.phone) {
      return res.status(400).json({ error: 'Müşteri adı ve telefon numarası zorunludur.' });
    }

    const rawPhone = String(data.phone || '');
    if (!isValidTurkishPhone(rawPhone)) {
      return res.status(400).json({
        error: 'Geçersiz müşteri telefon numarası. Lütfen 05XX XXX XX XX formatında geçerli bir Türkiye GSM numarası giriniz (harf veya sahte numara kabul edilmez).'
      });
    }
    const cleanPhone = normalizePhone(rawPhone);

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
        name: String(data.name).trim(),
        phone: cleanPhone,
        updatedAt: now,
      };
      S().customers[index] = customer;
    } else {
      // Paket Kotası Koruması: Çırak (25), Usta (100), Patron VIP (Sınırsız)
      const limits = getTierLimits(S().shopProfile);

      if (Array.isArray(S().customers) && S().customers.length >= limits.maxCustomers) {
        return res.status(403).json({
          error: `Mevcut paketinizde en fazla ${limits.maxCustomers} müşteri kaydedebilirsiniz. Kapasitenizi artırmak için Usta veya Patron VIP Pakete geçin.`,
          code: 'VIP_REQUIRED',
          limit: limits.maxCustomers,
          current: S().customers.length,
        });
      }

      // Create
      customer = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: data.name.trim(),
        phone: cleanPhone,
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
