import type { Express, Request, Response } from 'express';
import type {
  CustodyTicket,
  MaintenanceAsset,
  MaintenanceLogEntry,
  RepairTicket,
  Transaction,
} from '../../shared/types';
import { S, saveState, als } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast, broadcastToAccount } from '../realtime';
import { localDay } from '../day';
import { getAccounts } from '../accounts';
import { loadShopState, persistShopState } from '../shopState';
import { sendPushToAccount } from './devices';
import { dispatchFirebaseSms, syncPublicAssetToFirestore } from '../services/firebaseService';

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

export interface PublicAssetPassportResult {
  code: string;
  shopName: string;
  shopPhone: string;
  shopCityDistrict: string;
  shopLogoUrl?: string;
  clientName: string;
  locationArea?: string;
  deviceName: string;
  brandModel?: string;
  serialNumberMasked?: string;
  intervalDays: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  warrantyUntil?: string;
  daysRemaining: number;
  statusBadge: 'guncel' | 'yaklasiyor' | 'gecikmis';
  statusLabel: string;
  logs: MaintenanceLogEntry[];
}

function addDaysToIsoDate(dateStr: string, days: number): string {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(`${dateStr}T12:00:00Z`) : new Date();
  if (Number.isNaN(base.getTime())) return localDay();
  base.setUTCDate(base.getUTCDate() + Math.max(1, Number(days) || 90));
  return base.toISOString().slice(0, 10);
}

function computeAssetMaintenanceStatus(nextDate: string): {
  daysRemaining: number;
  statusBadge: 'guncel' | 'yaklasiyor' | 'gecikmis';
  statusLabel: string;
} {
  const todayStr = localDay();
  const todayMs = new Date(`${todayStr}T00:00:00Z`).getTime();
  const nextMs = new Date(`${nextDate}T00:00:00Z`).getTime();
  const daysRemaining = Number.isFinite(nextMs) ? Math.round((nextMs - todayMs) / 86400000) : 0;

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      statusBadge: 'gecikmis',
      statusLabel: `Bakım ${Math.abs(daysRemaining)} Gün Gecikti!`,
    };
  }
  if (daysRemaining <= 15) {
    return {
      daysRemaining,
      statusBadge: 'yaklasiyor',
      statusLabel: daysRemaining === 0 ? 'Bakım Bugün!' : `Bakıma ${daysRemaining} Gün Kaldı`,
    };
  }
  return {
    daysRemaining,
    statusBadge: 'guncel',
    statusLabel: `Bakımı Güncel (${daysRemaining} gün var)`,
  };
}

/**
 * KVKK uyumlu kamusal QR Makine / Cihaz Bakım Pasaportu (`/api/public/asset/:code`).
 */
export function lookupPublicAsset(rawCode: string): PublicAssetPassportResult | null {
  const code = String(rawCode || '').trim();
  if (!code) return null;

  if (code.toLowerCase() === 'demo') {
    const nextDate = addDaysToIsoDate(localDay(), 12);
    const status = computeAssetMaintenanceStatus(nextDate);
    return {
      code: 'demo',
      shopName: 'TeknoFix Endüstriyel Servis',
      shopPhone: '',
      shopCityDistrict: 'İkitelli OSB, İstanbul',
      clientName: 'Yılmaz Metal CNC Fabrika',
      locationArea: 'A Blok — CNC İşleme Hattı 2',
      deviceName: 'Haas VF-2 CNC Dik İşleme Merkezi',
      brandModel: 'Haas VF-2SS / 2024',
      serialNumberMasked: 'SN-***4892',
      intervalDays: 90,
      lastMaintenanceDate: addDaysToIsoDate(localDay(), -78),
      nextMaintenanceDate: nextDate,
      warrantyUntil: addDaysToIsoDate(localDay(), 290),
      ...status,
      logs: [
        {
          id: 'ml_demo_1',
          date: addDaysToIsoDate(localDay(), -78),
          summary: 'Spindle yağ kontrolü, kızak bakımı, filtre değişimi ve eksen kalibrasyonu',
          technician: 'Murat Usta',
          partsChanged: 'Hava Filtresi, Yağ Kartuşu',
          meterReading: '4.280 saat',
        },
        {
          id: 'ml_demo_2',
          date: addDaysToIsoDate(localDay(), -168),
          summary: 'Soğutma pompası revizyonu ve elektrik pano termal kontrolü',
          technician: 'Murat Usta',
          partsChanged: 'Soğutma Keçesi',
          meterReading: '3.610 saat',
        },
      ],
    };
  }

  const normalizedCode = code.toLowerCase();
  const accounts = getAccounts();

  for (const acc of accounts) {
    const st = loadShopState(acc.id);
    const asset = (st.maintenanceAssets || []).find(
      (a: MaintenanceAsset) =>
        a.id.toLowerCase() === normalizedCode ||
        (a.code && a.code.toLowerCase() === normalizedCode)
    );
    if (!asset) continue;

    const status = computeAssetMaintenanceStatus(asset.nextMaintenanceDate);
    const serial = asset.serialNumber || '';
    const serialNumberMasked =
      serial.length > 4 ? `***${serial.slice(-4)}` : serial || undefined;

    return {
      code: asset.code || asset.id,
      shopName: st.shopProfile?.storeName || acc.shopName || 'Teknik Servis',
      shopPhone: st.shopProfile?.phone || acc.phone || '',
      shopCityDistrict: st.shopProfile?.cityDistrict || '',
      shopLogoUrl: st.shopProfile?.logoUrl,
      clientName: asset.clientName,
      locationArea: asset.locationArea,
      deviceName: asset.deviceName,
      brandModel: asset.brandModel,
      serialNumberMasked,
      intervalDays: asset.intervalDays,
      lastMaintenanceDate: asset.lastMaintenanceDate,
      nextMaintenanceDate: asset.nextMaintenanceDate,
      warrantyUntil: asset.warrantyUntil,
      ...status,
      logs: Array.isArray(asset.logs) ? asset.logs.slice(0, 20) : [],
    };
  }

  return null;
}

/**
 * Fabrika / müşteri QR makine sayfasından doğrudan arıza veya bakım talebi açar.
 */
export async function requestServiceForPublicAsset(
  rawCode: string,
  payload: { reporterName?: string; reporterPhone?: string; issueDescription?: string; urgency?: string }
): Promise<{ ok: boolean; statusCode: number; error?: string; ticket?: RepairTicket }> {
  const code = String(rawCode || '').trim();
  if (!code) return { ok: false, statusCode: 400, error: 'Geçersiz cihaz kodu.' };

  const description = String(payload.issueDescription || '').trim();
  const reporterName = String(payload.reporterName || '').trim();
  const reporterPhone = String(payload.reporterPhone || '').trim();
  if (!description || !reporterName) {
    return { ok: false, statusCode: 400, error: 'Bildiren kişi adı ve arıza/bakım açıklaması zorunludur.' };
  }

  if (code.toLowerCase() === 'demo') {
    const now = new Date();
    return {
      ok: true,
      statusCode: 200,
      ticket: {
        id: `rep_demo_${Date.now()}`,
        customerName: `${reporterName} (Yılmaz Metal Demo)`,
        phone: reporterPhone,
        deviceOrVehicle: 'Haas VF-2 CNC Dik İşleme Merkezi [QR Demo]',
        complaint: description,
        estimatedCost: 0,
        partCost: 0,
        status: 'kabul_edildi',
        notes: `Aciliyet: ${payload.urgency || 'Normal'}`,
        createdAt: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
      },
    };
  }

  const normalizedCode = code.toLowerCase();
  const accounts = getAccounts();
  for (const acc of accounts) {
    const st = loadShopState(acc.id);
    const asset = (st.maintenanceAssets || []).find(
      (a: MaintenanceAsset) =>
        a.id.toLowerCase() === normalizedCode ||
        (a.code && a.code.toLowerCase() === normalizedCode)
    );
    if (!asset) continue;

    const now = new Date();
    const newTicket: RepairTicket = {
      id: `rep_qr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      customerName: `${asset.clientName} — ${reporterName}`,
      phone: reporterPhone || asset.clientPhone || '',
      deviceOrVehicle: `${asset.deviceName}${asset.locationArea ? ` (${asset.locationArea})` : ''}`,
      deviceModel: asset.brandModel,
      complaint: `[QR Pasaport: ${asset.code}] ${description}`,
      estimatedCost: 0,
      partCost: 0,
      status: 'kabul_edildi',
      notes: `Öncelik: ${payload.urgency || 'Normal'} | Seri: ${asset.serialNumber || '-'}`,
      createdAt: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
    };

    if (!Array.isArray(st.repairTickets)) st.repairTickets = [];
    st.repairTickets.unshift(newTicket);
    persistShopState(acc.id, st);

    try {
      broadcastToAccount(acc.id, { type: 'REPAIR_TICKET_UPDATED', payload: newTicket });
    } catch {}

    sendPushToAccount(acc.id, {
      title: `🚨 QR Arıza Bildirimi: ${asset.deviceName}`,
      body: `${asset.clientName} (${reporterName}): ${description.slice(0, 120)}`,
      url: '/',
      tag: `asset_alert_${asset.id}`,
    }).catch(() => {});

    const shopPhone = st.shopProfile?.phone || acc.phone || '';
    const shopTitle = st.shopProfile?.storeName || acc.shopName || 'Teknik Servis';
    if (shopPhone) {
      dispatchFirebaseSms({
        phone: shopPhone,
        message: `QR Arıza Talebi (${asset.code} - ${asset.deviceName}): ${reporterName} (${payload.urgency || 'Normal'}) - ${description.slice(0, 90)}`,
        category: 'qr_asset_alert',
        shopName: shopTitle,
      }).catch(() => {});
    }

    syncPublicAssetToFirestore(acc.id, shopTitle, asset, {
      shopSlug: st.shopProfile?.slug,
      shopCityDistrict: st.shopProfile?.cityDistrict,
    }).catch(() => {});

    return { ok: true, statusCode: 200, ticket: newTicket };
  }

  return { ok: false, statusCode: 404, error: 'Bu QR koduna kayıtlı cihaz bulunamadı.' };
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

  // ==========================================
  // 16b. FABRİKA & TEKNİK SERVİS QR MAKİNE BAKIM PASAPORTU
  // ==========================================
  app.get('/api/maintenance-assets', (_req: Request, res: Response) => {
    res.json({ maintenanceAssets: S().maintenanceAssets || [] });
  });

  app.post('/api/maintenance-assets', (req: Request, res: Response) => {
    const body = req.body || {};
    const clientName = String(body.clientName || '').trim();
    const deviceName = String(body.deviceName || '').trim();
    if (!clientName || !deviceName) {
      return res.status(400).json({ error: 'Firma/Müşteri adı ve cihaz/makine adı zorunludur.' });
    }

    if (!Array.isArray(S().maintenanceAssets)) S().maintenanceAssets = [];
    const intervalDays = Math.max(1, Number(body.intervalDays) || 90);
    const lastDate = String(body.lastMaintenanceDate || localDay()).trim();
    const nextDate = String(body.nextMaintenanceDate || addDaysToIsoDate(lastDate, intervalDays)).trim();

    let asset: MaintenanceAsset;
    if (body.id) {
      const idx = S().maintenanceAssets!.findIndex((a) => a.id === body.id);
      if (idx === -1) return res.status(404).json({ error: 'Cihaz kaydı bulunamadı.' });
      asset = {
        ...S().maintenanceAssets![idx],
        clientName,
        clientPhone: body.clientPhone !== undefined ? String(body.clientPhone).trim() : S().maintenanceAssets![idx].clientPhone,
        locationArea: body.locationArea !== undefined ? String(body.locationArea).trim() : S().maintenanceAssets![idx].locationArea,
        deviceName,
        brandModel: body.brandModel !== undefined ? String(body.brandModel).trim() : S().maintenanceAssets![idx].brandModel,
        serialNumber: body.serialNumber !== undefined ? String(body.serialNumber).trim() : S().maintenanceAssets![idx].serialNumber,
        intervalDays,
        lastMaintenanceDate: lastDate,
        nextMaintenanceDate: nextDate,
        warrantyUntil: body.warrantyUntil !== undefined ? String(body.warrantyUntil).trim() : S().maintenanceAssets![idx].warrantyUntil,
        notes: body.notes !== undefined ? String(body.notes).trim() : S().maintenanceAssets![idx].notes,
      };
      S().maintenanceAssets![idx] = asset;
    } else {
      const shortCode = `MKN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      asset = {
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        code: String(body.code || shortCode).trim().toUpperCase(),
        clientName,
        clientPhone: String(body.clientPhone || '').trim() || undefined,
        locationArea: String(body.locationArea || '').trim() || undefined,
        deviceName,
        brandModel: String(body.brandModel || '').trim() || undefined,
        serialNumber: String(body.serialNumber || '').trim() || undefined,
        intervalDays,
        lastMaintenanceDate: lastDate,
        nextMaintenanceDate: nextDate,
        warrantyUntil: String(body.warrantyUntil || '').trim() || undefined,
        notes: String(body.notes || '').trim() || undefined,
        logs: [],
        createdAt: new Date().toISOString(),
      };
      S().maintenanceAssets!.unshift(asset);
    }

    saveState();
    broadcast({ type: 'MAINTENANCE_ASSET_UPDATED', payload: asset });
    const ctxAccId = als.getStore()?.accountId || '';
    if (ctxAccId) {
      syncPublicAssetToFirestore(
        ctxAccId,
        S().shopProfile?.storeName || S().storeName || 'Teknik Servis',
        asset,
        {
          shopSlug: S().shopProfile?.slug,
          shopCityDistrict: S().shopProfile?.cityDistrict,
        }
      ).catch(() => {});
    }
    res.json({ success: true, asset });
  });

  app.post('/api/maintenance-assets/:id/record-maintenance', (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};
    if (!Array.isArray(S().maintenanceAssets)) S().maintenanceAssets = [];
    const asset = S().maintenanceAssets!.find((a) => a.id === id);
    if (!asset) return res.status(404).json({ error: 'Cihaz kaydı bulunamadı.' });

    const maintenanceDate = String(body.maintenanceDate || localDay()).trim();
    const summary = String(body.summary || 'Periyodik bakım ve genel kontrol yapıldı').trim();
    const cost = Number(body.cost) || 0;

    const entry: MaintenanceLogEntry = {
      id: `ml_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      date: maintenanceDate,
      summary,
      technician: String(body.technician || '').trim() || undefined,
      partsChanged: String(body.partsChanged || '').trim() || undefined,
      cost: cost > 0 ? cost : undefined,
      meterReading: String(body.meterReading || '').trim() || undefined,
    };

    if (!Array.isArray(asset.logs)) asset.logs = [];
    asset.logs.unshift(entry);
    asset.lastMaintenanceDate = maintenanceDate;
    asset.nextMaintenanceDate = addDaysToIsoDate(maintenanceDate, asset.intervalDays);

    let incomeTx: Transaction | undefined;
    let cash;
    if (body.addToCash && cost > 0) {
      const now = new Date();
      const todayStr = S().businessDate || localDay();
      const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      incomeTx = {
        id: `tx_mnt_${Date.now()}`,
        customerId: '',
        customerName: asset.clientName,
        type: 'tahsilat',
        amount: cost,
        paymentMethod: body.paymentMethod === 'kart' ? 'kart' : 'nakit',
        description: `Periyodik Bakım (${asset.code}): ${asset.deviceName}`,
        date: `${todayStr} ${timeStr}`,
        createdAt: now.toISOString(),
      };
      S().transactions.unshift(incomeTx);
      cash = calculateCashRegister();
    }

    saveState();
    broadcast({ type: 'MAINTENANCE_ASSET_UPDATED', payload: asset });
    const ctxAccId = als.getStore()?.accountId || '';
    if (ctxAccId) {
      syncPublicAssetToFirestore(
        ctxAccId,
        S().shopProfile?.storeName || S().storeName || 'Teknik Servis',
        asset,
        {
          shopSlug: S().shopProfile?.slug,
          shopCityDistrict: S().shopProfile?.cityDistrict,
        }
      ).catch(() => {});
    }
    if (incomeTx && cash) {
      broadcast({ type: 'TRANSACTION_CREATED', payload: { transaction: incomeTx, cash } });
    }
    res.json({ success: true, asset, transaction: incomeTx, cash });
  });

  app.delete('/api/maintenance-assets/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Array.isArray(S().maintenanceAssets)) S().maintenanceAssets = [];
    S().maintenanceAssets = S().maintenanceAssets!.filter((a) => a.id !== id);
    saveState();
    broadcast({ type: 'MAINTENANCE_ASSET_DELETED', payload: { id } });
    res.json({ success: true });
  });
}
