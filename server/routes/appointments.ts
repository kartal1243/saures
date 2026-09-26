import type { Express, Request, Response } from 'express';
import type { Appointment, Transaction } from '../../src/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';

export function registerAppointmentRoutes(app: Express): void {
  // ==========================================
  // 14. SEKTÖRE ÖZEL: BERBER & KUAFÖR (RANDEVU & KOLTUK TAKİBİ)
  // ==========================================
  app.get('/api/appointments', (_req, res) => {
    res.json({ appointments: S().appointments || [] });
  });

  app.post('/api/appointments', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.customerName || !data.customerName.trim()) {
      return res.status(400).json({ error: 'Müşteri adı zorunludur.' });
    }
    if (!S().appointments) S().appointments = [];

    let apt: Appointment;
    if (data.id) {
      const idx = S().appointments.findIndex((a) => a.id === data.id);
      if (idx === -1) return res.status(404).json({ error: 'Randevu bulunamadı.' });
      apt = {
        ...S().appointments[idx],
        ...data,
      };
      S().appointments[idx] = apt;
    } else {
      const now = new Date();
      apt = {
        id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        customerName: data.customerName.trim(),
        phone: data.phone?.trim() || '',
        staffName: data.staffName?.trim() || 'Koltuk 1 (Usta)',
        serviceName: data.serviceName?.trim() || 'Saç & Sakal Tıraşı',
        price: Number(data.price) || 250,
        appointmentDate: data.appointmentDate || now.toISOString().split('T')[0],
        timeSlot: data.timeSlot || '14:00',
        status: data.status || 'bekliyor',
        notes: data.notes?.trim() || '',
        createdAt: now.toISOString(),
      };
      S().appointments.unshift(apt);
    }

    saveState();
    broadcast({ type: 'APPOINTMENT_UPDATED', payload: apt });
    res.json({ success: true, appointment: apt });
  });

  app.post('/api/appointments/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!S().appointments) S().appointments = [];
    const apt = S().appointments.find((a) => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Randevu bulunamadı.' });

    apt.status = status;
    saveState();
    broadcast({ type: 'APPOINTMENT_UPDATED', payload: apt });
    res.json({ success: true, appointment: apt });
  });

  app.post('/api/appointments/:id/complete', (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    if (!S().appointments) S().appointments = [];
    const apt = S().appointments.find((a) => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Randevu bulunamadı.' });

    apt.status = 'tamamlandi';

    // Otomatik Kasaya Tahsilat Ekle
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const transaction: Transaction = {
      id: `tx_apt_${Date.now()}`,
      customerId: '',
      customerName: apt.customerName,
      type: 'tahsilat',
      amount: apt.price,
      paymentMethod: paymentMethod || 'nakit',
      description: `Kuaför/Berber Tahsilatı: ${apt.serviceName} (${apt.staffName})`,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };

    S().transactions.unshift(transaction);
    saveState();

    const cash = calculateCashRegister();
    broadcast({ type: 'APPOINTMENT_UPDATED', payload: apt });
    broadcast({
      type: 'TRANSACTION_CREATED',
      payload: { transaction, cash },
    });

    res.json({ success: true, appointment: apt, transaction, cash });
  });

  app.delete('/api/appointments/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!S().appointments) S().appointments = [];
    S().appointments = S().appointments.filter((a) => a.id !== id);
    saveState();
    broadcast({ type: 'APPOINTMENT_DELETED', payload: { id } });
    res.json({ success: true });
  });
}
