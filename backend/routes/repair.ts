import type { Express, Request, Response } from 'express';
import type { CustodyTicket, RepairTicket, Transaction } from '../../shared/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast } from '../realtime';
import { localDay } from '../day';
import { getAccounts } from '../accounts';
import { loadShopState } from '../shopState';

export interface PublicTicketLookupResult {
  code: string;
  kind: 'repair' | 'custody';
  shopName: string;
  shopPhone: string;
  shopCityDistrict: string;
  shopLogoUrl?: string;
  customerMasked: string;
  itemTitle: string;
  complaintOrDetails: string;
  status: string;
  statusLabel: string;
  stepIndex: number;
  steps: { key: string; label: string }[];
  estimatedCost: number;
  advance: number;
  remainingAmount: number;
  createdAt: string;
  promisedOrCompletedAt?: string;
}

function maskCustomerName(fullName?: string): string {
  const parts = String(fullName || 'Müşteri').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Müşteri';
  if (parts.length === 1) {
    const p = parts[0];
    return p.length <= 2 ? `${p[0]}***` : `${p.slice(0, 2)}${'*'.repeat(Math.min(4, p.length - 2))}`;
  }
  return parts
    .map((p, idx) => (idx === 0 ? p : `${p[0]}.`))
    .join(' ');
}

const REPAIR_STEPS = [
  { key: 'kabul_edildi', label: 'Kabul Edildi' },
  { key: 'parca_bekleniyor', label: 'Parça / İnceleme' },
  { key: 'tamirde', label: 'İşlemde' },
  { key: 'teslime_hazir', label: 'Teslime Hazır' },
  { key: 'teslim_edildi', label: 'Teslim Edildi' },
];

const CUSTODY_STEPS = [
  { key: 'kabul', label: 'Teslim Alındı' },
  { key: 'islemde', label: 'İşlemde' },
  { key: 'hazir', label: 'Teslime Hazır' },
  { key: 'teslim', label: 'Teslim Edildi' },
];

/**
 * KVKK uyumlu kamusal servis/emanet fişi sorgulama yardımcısı (`/api/public/ticket/:code`).
 */
export function lookupPublicTicket(rawCode: string): PublicTicketLookupResult | null {
  const code = String(rawCode || '').trim();
  if (!code) return null;

  if (code.toLowerCase() === 'demo') {
    return {
      code: 'demo',
      kind: 'repair',
      shopName: 'TeknoFix Teknik Servis',
      shopPhone: '',
      shopCityDistrict: 'Kadıköy, İstanbul',
      customerMasked: 'Ahmet Y.',
      itemTitle: 'iPhone 14 Pro — Ekran & Batarya Değişimi',
      complaintOrDetails: 'Orijinal ekran yenileme, batarya sağlığı kontrolü ve kasa temizliği',
      status: 'teslime_hazir',
      statusLabel: 'Teslime Hazır',
      stepIndex: 3,
      steps: REPAIR_STEPS,
      estimatedCost: 4250,
      advance: 1000,
      remainingAmount: 3250,
      createdAt: new Date(Date.now() - 86400000).toISOString().slice(0, 10) + ' 11:20',
      promisedOrCompletedAt: new Date().toISOString().slice(0, 10) + ' 16:00',
    };
  }

  const normalizedCode = code.toLowerCase();
  const accounts = getAccounts();

  for (const acc of accounts) {
    const st = loadShopState(acc.id);
    const shopName = st.shopProfile?.storeName || acc.shopName || 'Esnaf İşletmesi';
    const shopPhone = st.shopProfile?.phone || acc.phone || '';
    const shopCityDistrict = st.shopProfile?.cityDistrict || '';
    const shopLogoUrl = st.shopProfile?.logoUrl;

    const repair = (st.repairTickets || []).find(
      (t: RepairTicket) => t.id.toLowerCase() === normalizedCode
    );
    if (repair) {
      const idx = REPAIR_STEPS.findIndex((s) => s.key === repair.status);
      const stepIndex = idx >= 0 ? idx : 0;
      const estimatedCost = Number(repair.estimatedCost) || 0;
      const advance = Number(repair.advance) || 0;
      return {
        code: repair.id,
        kind: 'repair',
        shopName,
        shopPhone,
        shopCityDistrict,
        shopLogoUrl,
        customerMasked: maskCustomerName(repair.customerName),
        itemTitle: repair.deviceOrVehicle || repair.deviceModel || 'Servis Cihazı',
        complaintOrDetails: repair.complaint || repair.issueDesc || 'Teknik servis bakımı',
        status: repair.status,
        statusLabel: REPAIR_STEPS[stepIndex]?.label || repair.status,
        stepIndex,
        steps: REPAIR_STEPS,
        estimatedCost,
        advance,
        remainingAmount: Math.max(0, estimatedCost - advance),
        createdAt: repair.createdAt,
        promisedOrCompletedAt: repair.completedAt,
      };
    }

    const custody = ((st as any).custody || []).find(
      (t: CustodyTicket) => t.id.toLowerCase() === normalizedCode
    ) as CustodyTicket | undefined;
    if (custody) {
      const idx = CUSTODY_STEPS.findIndex((s) => s.key === custody.status);
      const stepIndex = idx >= 0 ? idx : 0;
      const price = Number(custody.price) || 0;
      const advance = Number(custody.advance) || 0;
      return {
        code: custody.id,
        kind: 'custody',
        shopName,
        shopPhone,
        shopCityDistrict,
        shopLogoUrl,
        customerMasked: maskCustomerName(custody.customerName),
        itemTitle: custody.itemDesc || 'Emanet Eşya',
        complaintOrDetails: custody.notes || 'Terzi / Kuru temizleme işlemi',
        status: custody.status,
        statusLabel: CUSTODY_STEPS[stepIndex]?.label || custody.status,
        stepIndex,
        steps: CUSTODY_STEPS,
        estimatedCost: price,
        advance,
        remainingAmount: Math.max(0, price - advance),
        createdAt: custody.createdAt,
        promisedOrCompletedAt: custody.completedAt || custody.promisedDate,
      };
    }
  }

  return null;
}

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
    const todayStr = S().businessDate || localDay();
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
