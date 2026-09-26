import { WebSocket } from 'ws';
import type { AppState, WSEvent } from '../src/types';
import { als } from './context';
import { calculateCashRegister } from './cash';

// ws -> accountId (sadece kendi dükkanına yayın yapılır)
const clients = new Map<WebSocket, string>();

export function addClient(ws: WebSocket, accountId: string): void {
  clients.set(ws, accountId);
}

export function removeClient(ws: WebSocket): void {
  clients.delete(ws);
}

export function clientCount(): number {
  return clients.size;
}

export function broadcast(event: WSEvent): void {
  const ctx = als.getStore();
  if (!ctx) return;
  const payload = JSON.stringify(event);
  for (const [client, accountId] of clients) {
    if (accountId !== ctx.accountId) continue;
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (e) {
        console.error('Error sending WS message:', e);
      }
    }
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
      businessDate: st.businessDate,
    },
  };
}
