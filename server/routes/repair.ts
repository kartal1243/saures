import type { Express, Request, Response } from 'express';
import type { RepairTicket, Transaction } from '../../src/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';

export function registerRepairRoutes(app: Express): void {
  // ==========================================
  // 16. SEKTÖRE ÖZEL: TEKNİK SERVİS & TAMİR (İŞ EMRİ & FİŞ)
  // ==========================================
  app.get('/api/repair-tickets', (_req, res) => {
    res.json({ repairTickets: S().repairTickets || [] });
  });

  app.post('/api/repair-tickets', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.customerName || !data.deviceOrVehicle) {
      return res.status(400).json({ error: 'Müşteri adı ve cihaz/araç bilgisi zorunludur.' });
    }
    if (!S().repairTickets) S().repairTickets = [];

    let ticket: RepairTicket;
    if (data.id) {
      const idx = S().repairTickets.findIndex((t) => t.id === data.id);
      if (idx === -1) return res.status(404).json({ error: 'Servis fişi bulunamadı.' });
      ticket = {
        ...S().repairTickets[idx],
        ...data,
      };
      S().repairTickets[idx] = ticket;
    } else {
      const now = new Date();
      ticket = {
        id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        customerName: data.customerName.trim(),
        phone: data.phone?.trim() || '',
        deviceOrVehicle: data.deviceOrVehicle.trim(),
        complaint: data.complaint?.trim() || 'Arıza tespiti ve bakım',
        estimatedCost: Number(data.estimatedCost) || 0,
        partCost: Number(data.partCost) || 0,
        status: data.status || 'kabul_edildi',
        notes: data.notes?.trim() || '',
        createdAt: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
      };
      S().repairTickets.unshift(ticket);
    }

    saveState();
    broadcast({ type: 'REPAIR_TICKET_UPDATED', payload: ticket });
    res.json({ success: true, ticket });
  });

  app.post('/api/repair-tickets/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!S().repairTickets) S().repairTickets = [];
    const ticket = S().repairTickets.find((t) => t.id === id);
    if (!ticket) return res.status(404).json({ error: 'Servis fişi bulunamadı.' });

    ticket.status = status;
    saveState();
    broadcast({ type: 'REPAIR_TICKET_UPDATED', payload: ticket });
    res.json({ success: true, ticket });
  });

  app.post('/api/repair-tickets/:id/complete', (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentMethod, deductPartCost } = req.body;
    if (!S().repairTickets) S().repairTickets = [];
    const ticket = S().repairTickets.find((t) => t.id === id);
    if (!ticket) return res.status(404).json({ error: 'Servis fişi bulunamadı.' });

    ticket.status = 'teslim_edildi';
    ticket.completedAt = new Date().toISOString();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // Kasaya Tahsilat
    const incomeTx: Transaction = {
      id: `tx_rep_inc_${Date.now()}`,
      customerId: '',
      customerName: ticket.customerName,
      type: 'tahsilat',
      amount: ticket.estimatedCost,
      paymentMethod: paymentMethod || 'nakit',
      description: `Servis Teslimatı: ${ticket.deviceOrVehicle} (${ticket.complaint})`,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };
    S().transactions.unshift(incomeTx);

    // İsteğe bağlı: Parça maliyetini Gider olarak kaydet
    if (deductPartCost && ticket.partCost > 0) {
      const expenseTx: Transaction = {
        id: `tx_rep_exp_${Date.now()}`,
        customerId: '',
        customerName: 'Yedek Parça Maliyeti',
        type: 'gider',
        amount: ticket.partCost,
        paymentMethod: 'nakit',
        description: `Yedek Parça: ${ticket.deviceOrVehicle} parçası`,
        date: `${todayStr} ${timeStr}`,
        createdAt: now.toISOString(),
      };
      S().transactions.unshift(expenseTx);
    }

    saveState();

    const cash = calculateCashRegister();
    broadcast({ type: 'REPAIR_TICKET_UPDATED', payload: ticket });
    broadcast({
      type: 'TRANSACTION_CREATED',
      payload: { transaction: incomeTx, cash },
    });

    res.json({ success: true, ticket, transaction: incomeTx, cash });
  });

  app.delete('/api/repair-tickets/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!S().repairTickets) S().repairTickets = [];
    S().repairTickets = S().repairTickets.filter((t) => t.id !== id);
    saveState();
    broadcast({ type: 'REPAIR_TICKET_DELETED', payload: { id } });
    res.json({ success: true });
  });
}
