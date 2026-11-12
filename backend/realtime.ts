import { WebSocket } from 'ws';
import crypto from 'crypto';
import type { AppState, WSEvent } from '../shared/types';
import { als } from './context';
import { calculateCashRegister } from './cash';
import { detectDeviceAndBrowser, findAccountById } from './accounts';

export interface ClientMeta {
  accountId: string;
  ip: string;
  userAgent: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browserInfo: string;
  connectedAt: string;
  isAdmin?: boolean;
}

export interface LiveActivityItem {
  id: string;
  at: string;
  accountId: string;
  shopName: string;
  type: 'sale' | 'appointment' | 'table' | 'cash' | 'customer' | 'closing' | 'product' | 'repair' | 'system' | 'vip';
  title: string;
  description: string;
  amount?: number;
  device?: string;
  ip?: string;
}

// ws -> ClientMeta
const clients = new Map<WebSocket, ClientMeta>();

// Admin paneli canlı dinleyicileri (WS)
const adminClients = new Set<WebSocket>();

// Son 100 canlı işlem/hareket akışı tamponu
const activityBuffer: LiveActivityItem[] = [];

export function addClient(
  ws: WebSocket,
  accountId: string,
  extra?: { ip?: string; userAgent?: string; isAdmin?: boolean }
): void {
  const ip = extra?.ip || 'unknown';
  const userAgent = extra?.userAgent || 'unknown';
  const { deviceType, browserInfo } = detectDeviceAndBrowser(userAgent);

  const meta: ClientMeta = {
    accountId,
    ip,
    userAgent,
    deviceType,
    browserInfo,
    connectedAt: new Date().toISOString(),
    isAdmin: Boolean(extra?.isAdmin),
  };

  clients.set(ws, meta);

  if (meta.isAdmin) {
    adminClients.add(ws);
    // Yeni bağlanan admine mevcut son olayları ve canlı metrikleri hemen gönder
    try {
      ws.send(JSON.stringify({
        type: 'ADMIN_INIT',
        payload: {
          activities: getRecentLiveActivities(50),
          liveStats: getLiveMetrics(),
        },
      }));
    } catch {
      // ignore
    }
  } else {
    // Yeni bir dükkan bağlandı, adminlere bildirelim
    broadcastAdminStats();
  }
}

export function removeClient(ws: WebSocket): void {
  const meta = clients.get(ws);
  clients.delete(ws);
  adminClients.delete(ws);
  if (meta && !meta.isAdmin) {
    broadcastAdminStats();
  }
}

export function clientCount(): number {
  return clients.size;
}

// Gerçek açık WebSocket bağlantılarını tekilleştirilmiş dükkan hesabı bazında döndür
export function getConnectedAccounts(): {
  accountId: string;
  shopName: string;
  ip: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browserInfo: string;
  connectedAt: string;
}[] {
  const map = new Map<string, {
    accountId: string;
    shopName: string;
    ip: string;
    deviceType: 'mobile' | 'desktop' | 'tablet';
    browserInfo: string;
    connectedAt: string;
  }>();

  for (const [, meta] of clients.entries()) {
    if (meta.isAdmin) continue;
    if (!map.has(meta.accountId)) {
      const acc = findAccountById(meta.accountId);
      map.set(meta.accountId, {
        accountId: meta.accountId,
        shopName: acc?.shopName || 'Bilinmeyen Dükkan',
        ip: meta.ip,
        deviceType: meta.deviceType,
        browserInfo: meta.browserInfo,
        connectedAt: meta.connectedAt,
      });
    }
  }

  return Array.from(map.values());
}

// Canlı metrikler: WebSocket canlıları + admin sayısı
export function getLiveMetrics() {
  const connected = getConnectedAccounts();
  return {
    wsClientsTotal: clients.size,
    wsUniqueShopsCount: connected.length,
    adminWsCount: adminClients.size,
    connectedShops: connected,
  };
}

// Admin WebSocket'lerine anlık metrik güncellemesi yayınla
export function broadcastAdminStats(): void {
  if (adminClients.size === 0) return;
  const payload = JSON.stringify({
    type: 'ADMIN_STATS_UPDATE',
    payload: getLiveMetrics(),
  });
  for (const ws of adminClients) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
      } catch {
        // ignore
      }
    }
  }
}

// Canlı Hareket Akışına (Live Stream) yeni olay kaydet ve adminlere bas
export function recordLiveActivity(item: Omit<LiveActivityItem, 'id' | 'at'>): LiveActivityItem {
  const fullItem: LiveActivityItem = {
    ...item,
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    at: new Date().toISOString(),
  };

  activityBuffer.unshift(fullItem);
  if (activityBuffer.length > 100) {
    activityBuffer.pop();
  }

  // Admin WebSocket'lerine gerçek zamanlı anında push
  if (adminClients.size > 0) {
    const payload = JSON.stringify({
      type: 'ADMIN_LIVE_ACTIVITY',
      payload: fullItem,
    });
    for (const ws of adminClients) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch {
          // ignore
        }
      }
    }
  }

  return fullItem;
}

export function getRecentLiveActivities(limit = 50): LiveActivityItem[] {
  return activityBuffer.slice(0, Math.max(1, Math.min(100, limit)));
}

export function broadcastToAccount(targetAccountId: string, event: WSEvent): void {
  const payload = JSON.stringify(event);
  for (const [client, meta] of clients) {
    if (meta.accountId === targetAccountId && client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (e) {
        console.error('Error sending WS message to account:', e);
      }
    }
  }
}

export function broadcastToAll(event: WSEvent): void {
  const payload = JSON.stringify(event);
  for (const [client, meta] of clients) {
    if (!meta.isAdmin && client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (e) {
        console.error('Error broadcasting WS message to client:', e);
      }
    }
  }
}

// Otomatik Olay Yakalama (Event Listener -> Admin Activity Stream)
export function broadcast(event: WSEvent): void {
  const ctx = als.getStore();
  if (!ctx) return;
  broadcastToAccount(ctx.accountId, event);

  // Dükkandaki iş olaylarını canlı hareket akışına dönüştür
  try {
    const acc = findAccountById(ctx.accountId);
    const shopName = acc?.shopName || 'Dükkan';
    const evType = (event as any).type;
    const payload = (event as any).payload;

    if (evType === 'APPOINTMENT_UPDATED') {
      const app = payload;
      recordLiveActivity({
        accountId: ctx.accountId,
        shopName,
        type: 'appointment',
        title: 'Randevu Güncellendi / Alındı',
        description: `${app?.customerName || 'Müşteri'} için ${app?.serviceName || 'Randevu'} (${app?.timeSlot || ''})`,
        amount: app?.price,
      });
    } else if (evType === 'TRANSACTION_CREATED') {
      const tx = payload?.transaction || payload;
      const isIncome = tx?.type === 'tahsilat';
      recordLiveActivity({
        accountId: ctx.accountId,
        shopName,
        type: 'sale',
        title: isIncome ? 'Yeni Satış / Tahsilat' : 'Gider / Masraf Kaydı',
        description: `${tx?.description || tx?.customerName || 'İşlem'} · ${tx?.paymentMethod || 'Nakit'}`,
        amount: tx?.amount,
      });
    } else if (evType === 'TABLE_UPDATED') {
      const table = payload;
      const isOccupied = table?.isOccupied || (table?.orders && table.orders.length > 0);
      recordLiveActivity({
        accountId: ctx.accountId,
        shopName,
        type: 'table',
        title: isOccupied ? `Masa Siparişi: ${table?.name || 'Masa'}` : `Masa Kapatıldı: ${table?.name || 'Masa'}`,
        description: isOccupied ? `${table?.orders?.length || 0} ürün açık sipariş` : 'Masa hesabı kapatıldı ve boşaltıldı',
        amount: table?.totalAmount,
      });
    } else if (evType === 'CUSTOMER_CREATED') {
      const cust = payload;
      recordLiveActivity({
        accountId: ctx.accountId,
        shopName,
        type: 'customer',
        title: 'Yeni Müşteri Kaydı',
        description: `${cust?.name || 'Müşteri'} sisteme eklendi`,
      });
    } else if (evType === 'DAILY_CLOSING_CREATED' || evType === 'CLOSING_COMPLETED') {
      const cl = payload?.closing || payload;
      recordLiveActivity({
        accountId: ctx.accountId,
        shopName,
        type: 'closing',
        title: 'Gün Sonu Raporu Alındı',
        description: `Kasa kapatıldı. Günlük ciro raporu oluşturuldu.`,
        amount: cl?.totalIncome || cl?.totalIncomeToday,
      });
    } else if (evType === 'REPAIR_UPDATED' || evType === 'REPAIR_TICKET_UPDATED') {
      const r = payload;
      recordLiveActivity({
        accountId: ctx.accountId,
        shopName,
        type: 'repair',
        title: 'Teknik Servis / Tamir Fişi',
        description: `${r?.deviceOrVehicle || 'Cihaz'} (${r?.customerName || 'Müşteri'}) güncellendi`,
        amount: r?.estimatedCost,
      });
    } else if (evType === 'BARBER_TIMEBLOCKS_UPDATED') {
      recordLiveActivity({
        accountId: ctx.accountId,
        shopName,
        type: 'system',
        title: 'Mola / Çalışma Saatleri Güncellendi',
        description: 'Berber salonu mola ve kapatılan saat blokları güncellendi',
      });
    } else if (evType === 'COMMUNITY_NEW_POST' || evType === 'COMMUNITY_POST_CREATED') {
      const p = payload;
      recordLiveActivity({
        accountId: ctx.accountId,
        shopName,
        type: 'system',
        title: 'Esnaf Dayanışma Çağrısı',
        description: `${p?.authorShopName || 'Esnaf'}: ${p?.title || p?.content?.slice(0, 40) || ''}`,
      });
    } else if (evType === 'COMMUNITY_NEW_MESSAGE') {
      const m = payload;
      recordLiveActivity({
        accountId: ctx.accountId,
        shopName,
        type: 'system',
        title: 'Esnaf Birebir Mesaj',
        description: `${m?.fromShopName || 'Esnaf'} -> ${m?.toShopName || 'Esnaf'}`,
      });
    }
  } catch (err) {
    // Activity kaydı broadcast'i kesmemeli
  }
}

// INIT olayı (ws açılışı + yedek geri yükleme sonrası aynı şekil)
export function buildInitEvent(st: AppState): WSEvent {
  return {
    type: 'INIT',
    payload: {
      customers: st.customers,
      transactions: st.transactions,
      cash: calculateCashRegister(),
      reminderLogs: st.reminderLogs,
      shopProfile: st.shopProfile,
      dailyClosings: st.dailyClosings,
      products: st.products || [],
      stockMovements: st.stockMovements || [],
      appointments: st.appointments || [],
      tables: st.tables || [],
      repairTickets: st.repairTickets || [],
      suppliers: st.suppliers || [],
      services: (st as any).services || [],
      cases: (st as any).cases || [],
      custody: (st as any).custody || [],
      menuItems: (st as any).menuItems || [],
      barberStaff: st.barberStaff || [],
      barberServices: st.barberServices || [],
      barberTimeBlocks: st.barberTimeBlocks || [],
      barberSettings: st.barberSettings || null,
      customerPackages: st.customerPackages || [],
      businessDate: st.businessDate,
    },
  };
}
