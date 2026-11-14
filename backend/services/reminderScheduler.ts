import type { AppState, ReminderLog, ShopProfile } from '../../shared/types';
import { getAccounts } from '../accounts';
import { loadShopState, persistShopState } from '../shopState';
import { broadcastToAccount } from '../realtime';
import { getEffectiveVipTier } from '../routes/profile';
import { sendSmsMessage } from './smsProvider';

export interface ReminderCycleStats {
  ranAt: string;
  checkedShops: number;
  appointmentsReminded: number;
  subscriptionsReminded: number;
  smsSent: number;
  simulated: number;
}

const SCHEDULER_INTERVAL_MS = 15 * 60 * 1000; // 15 dakika

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let lastCycleStats: ReminderCycleStats | null = null;
let cycleRunning = false;

export function getIstanbulDateAndMinutes(nowMs: number = Date.now()): {
  dateStr: string;
  monthStr: string;
  minutesOfDay: number;
} {
  const d = new Date(nowMs);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = parseInt(get('hour'), 10) % 24;
  const minute = parseInt(get('minute'), 10);

  return {
    dateStr: `${year}-${month}-${day}`,
    monthStr: `${year}-${month}`,
    minutesOfDay: hour * 60 + minute,
  };
}

function parseTimeSlotMinutes(timeSlot?: string): number | null {
  if (!timeSlot || typeof timeSlot !== 'string') return null;
  const match = timeSlot.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hh = parseInt(match[1], 10);
  const mm = parseInt(match[2], 10);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

export function getMonthlyAutoReminderLimit(profile?: ShopProfile): number {
  const tier = getEffectiveVipTier(profile);
  if (tier === 'patron') return 500;
  if (tier === 'usta') return 50;
  return 0;
}

export function countUsedAutoRemindersThisMonth(logs: ReminderLog[], monthStr: string): number {
  let count = 0;
  for (const log of logs || []) {
    if (!log || typeof log.id !== 'string' || !log.id.startsWith('rem_auto_')) continue;
    const tsPart = Number(log.id.split('_')[2]);
    if (Number.isFinite(tsPart) && tsPart > 0) {
      const logMonth = getIstanbulDateAndMinutes(tsPart).monthStr;
      if (logMonth === monthStr) count++;
    } else {
      count++;
    }
  }
  return count;
}

export function getShopAutoReminderQuota(state: AppState, nowMs: number = Date.now()): {
  tier: string;
  monthlyLimit: number;
  usedThisMonth: number;
  remainingThisMonth: number;
} {
  const { monthStr } = getIstanbulDateAndMinutes(nowMs);
  const tier = getEffectiveVipTier(state.shopProfile);
  const monthlyLimit = getMonthlyAutoReminderLimit(state.shopProfile);
  const usedThisMonth = countUsedAutoRemindersThisMonth(state.reminderLogs || [], monthStr);
  return {
    tier,
    monthlyLimit,
    usedThisMonth,
    remainingThisMonth: Math.max(0, monthlyLimit - usedThisMonth),
  };
}

export async function processShopReminders(
  accountId: string,
  state: AppState,
  nowMs: number = Date.now()
): Promise<{
  changed: boolean;
  appointmentsReminded: number;
  subscriptionsReminded: number;
  smsSent: number;
  simulated: number;
}> {
  const { dateStr: today, monthStr, minutesOfDay: nowMinutes } = getIstanbulDateAndMinutes(nowMs);
  const monthlyLimit = getMonthlyAutoReminderLimit(state.shopProfile);
  if (monthlyLimit <= 0) {
    return { changed: false, appointmentsReminded: 0, subscriptionsReminded: 0, smsSent: 0, simulated: 0 };
  }

  if (!Array.isArray(state.reminderLogs)) state.reminderLogs = [];
  let usedThisMonth = countUsedAutoRemindersThisMonth(state.reminderLogs, monthStr);

  const shopName = state.shopProfile?.storeName || state.storeName || 'İşletmemiz';
  let changed = false;
  let appointmentsReminded = 0;
  let subscriptionsReminded = 0;
  let smsSent = 0;
  let simulated = 0;

  // 1. Bugünkü 2 saat içindeki onaylı/bekleyen randevular
  for (const apt of state.appointments || []) {
    if (usedThisMonth >= monthlyLimit) break;
    if (!apt || apt.appointmentDate !== today) continue;
    if (apt.status !== 'onayli' && apt.status !== 'bekliyor') continue;
    if ((apt as any).autoReminderSent) continue;
    if (apt.allowWhatsApp === false) continue;
    if (!apt.phone) continue;

    const aptMinutes = parseTimeSlotMinutes(apt.timeSlot);
    if (aptMinutes === null) continue;
    if (aptMinutes < nowMinutes || aptMinutes > nowMinutes + 120) continue;

    const message = `Merhaba ${apt.customerName}, ${shopName} işletmesindeki bugün saat ${apt.timeSlot} (${apt.serviceName}) randevunuzu hatırlatırız. Görüşmek üzere!`;
    const result = await sendSmsMessage(apt.phone, message, { category: 'appointment_reminder' });

    const reminderLog: ReminderLog = {
      id: `rem_auto_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
      customerId: '',
      customerName: apt.customerName,
      phone: apt.phone,
      channel: result.sent ? 'sms' : 'whatsapp',
      message,
      status: result.sent ? 'gonderildi' : 'hazirlandi',
      sentAt: new Date(nowMs).toLocaleString('tr-TR'),
      type: 'ozel',
    };

    state.reminderLogs.unshift(reminderLog);
    (apt as any).autoReminderSent = true;
    usedThisMonth += 1;
    appointmentsReminded += 1;
    if (result.sent) smsSent += 1;
    else simulated += 1;
    changed = true;

    try {
      broadcastToAccount(accountId, { type: 'REMINDER_SENT', payload: reminderLog });
    } catch {
      // ignore broadcast errors outside server
    }
  }

  // 2. Vadesi bugün gelen abonelik / periyodik aidat kayıtları
  for (const cust of state.customers || []) {
    if (usedThisMonth >= monthlyLimit) break;
    if (!cust || !cust.subscriptionPlan?.enabled) continue;
    if (cust.subscriptionPlan.nextDueDate !== today) continue;
    if (!cust.phone) continue;
    if ((cust as any).lastAutoAidatReminderDate === today) continue;

    const alreadySentToday = state.reminderLogs.some(
      (l) =>
        l.id.startsWith('rem_auto_') &&
        l.customerId === cust.id &&
        l.type === 'aidat' &&
        getIstanbulDateAndMinutes(Number(l.id.split('_')[2]) || 0).dateStr === today
    );
    if (alreadySentToday) continue;

    const message = `Merhaba ${cust.name}, ${shopName} nezdindeki "${cust.subscriptionPlan.title}" (${cust.subscriptionPlan.amount} TL) ödemenizin vadesi bugün gelmiştir. Hayırlı günler dileriz.`;
    const result = await sendSmsMessage(cust.phone, message, { category: 'subscription_due' });

    const reminderLog: ReminderLog = {
      id: `rem_auto_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
      customerId: cust.id,
      customerName: cust.name,
      phone: cust.phone,
      channel: result.sent ? 'sms' : 'whatsapp',
      message,
      status: result.sent ? 'gonderildi' : 'hazirlandi',
      sentAt: new Date(nowMs).toLocaleString('tr-TR'),
      type: 'aidat',
    };

    state.reminderLogs.unshift(reminderLog);
    (cust as any).lastAutoAidatReminderDate = today;
    usedThisMonth += 1;
    subscriptionsReminded += 1;
    if (result.sent) smsSent += 1;
    else simulated += 1;
    changed = true;

    try {
      broadcastToAccount(accountId, { type: 'REMINDER_SENT', payload: reminderLog });
    } catch {
      // ignore broadcast errors outside server
    }
  }

  if (state.reminderLogs.length > 500) {
    state.reminderLogs = state.reminderLogs.slice(0, 500);
  }

  return { changed, appointmentsReminded, subscriptionsReminded, smsSent, simulated };
}

export async function runReminderCycleNow(options?: { nowMs?: number }): Promise<ReminderCycleStats> {
  const nowMs = options?.nowMs ?? Date.now();
  if (cycleRunning) {
    return (
      lastCycleStats || {
        ranAt: new Date(nowMs).toISOString(),
        checkedShops: 0,
        appointmentsReminded: 0,
        subscriptionsReminded: 0,
        smsSent: 0,
        simulated: 0,
      }
    );
  }

  cycleRunning = true;
  let checkedShops = 0;
  let appointmentsReminded = 0;
  let subscriptionsReminded = 0;
  let smsSent = 0;
  let simulated = 0;

  try {
    const owners = getAccounts().filter((a) => (a.role || 'owner') === 'owner');
    for (const acc of owners) {
      checkedShops += 1;
      try {
        const state = loadShopState(acc.id);
        const res = await processShopReminders(acc.id, state, nowMs);
        appointmentsReminded += res.appointmentsReminded;
        subscriptionsReminded += res.subscriptionsReminded;
        smsSent += res.smsSent;
        simulated += res.simulated;
        if (res.changed) {
          persistShopState(acc.id, state);
        }
      } catch (err) {
        console.error(`[ReminderScheduler] Dükkan işlenirken hata (${acc.id}):`, err);
      }
    }

    lastCycleStats = {
      ranAt: new Date(nowMs).toISOString(),
      checkedShops,
      appointmentsReminded,
      subscriptionsReminded,
      smsSent,
      simulated,
    };
    return lastCycleStats;
  } finally {
    cycleRunning = false;
  }
}

export function getReminderSchedulerStatus(): {
  active: boolean;
  intervalMinutes: number;
  lastRun: ReminderCycleStats | null;
} {
  return {
    active: Boolean(schedulerTimer),
    intervalMinutes: Math.round(SCHEDULER_INTERVAL_MS / 60000),
    lastRun: lastCycleStats,
  };
}

export function startReminderScheduler(): void {
  if (schedulerTimer) return;
  schedulerTimer = setInterval(() => {
    runReminderCycleNow().catch((err) => console.error('[ReminderScheduler] Periyodik hata:', err));
  }, SCHEDULER_INTERVAL_MS);
  // Node.js test süreçlerinin çıkışını engellemesin
  if (typeof schedulerTimer.unref === 'function') {
    schedulerTimer.unref();
  }
}
