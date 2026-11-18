import type { AppState, ReminderLog, ShopProfile } from '../../shared/types';
import { getAccounts } from '../accounts';
import { loadShopState, persistShopState } from '../shopState';
import { broadcastToAccount } from '../realtime';
import { getEffectiveVipTier } from '../routes/profile';
import { sendPushToAccount } from '../routes/devices';
import { writeFirestoreDocument, dispatchBrandedEmail } from './firebaseService';
import { sendSmsMessage } from './smsProvider';

export interface ReminderCycleStats {
  ranAt: string;
  checkedShops: number;
  appointmentsReminded: number;
  subscriptionsReminded: number;
  maintenanceReminded?: number;
  smsSent: number;
  emailsSent?: number;
  simulated: number;
}

export interface DailyMorningDispatchStats {
  ranAt: string;
  date: string;
  checkedShops: number;
  skippedDuplicates: number;
  appointmentsCount: number;
  duesCount: number;
  maintenanceCount: number;
  smsSent: number;
  emailsSent: number;
  pushesSent: number;
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
  maintenanceReminded: number;
  smsSent: number;
  emailsSent: number;
  simulated: number;
}> {
  const { dateStr: today, monthStr, minutesOfDay: nowMinutes } = getIstanbulDateAndMinutes(nowMs);
  const monthlyLimit = getMonthlyAutoReminderLimit(state.shopProfile);
  if (monthlyLimit <= 0) {
    return { changed: false, appointmentsReminded: 0, subscriptionsReminded: 0, maintenanceReminded: 0, smsSent: 0, emailsSent: 0, simulated: 0 };
  }

  if (!Array.isArray(state.reminderLogs)) state.reminderLogs = [];
  let usedThisMonth = countUsedAutoRemindersThisMonth(state.reminderLogs, monthStr);

  const shopName = state.shopProfile?.storeName || state.storeName || 'İşletmemiz';
  const baseUrl = (process.env.APP_BASE_URL || 'https://dukkanimyanimda.com.tr').replace(/\/+$/, '');
  const slugForLink = encodeURIComponent(state.shopProfile?.slug || state.barberSettings?.slug || accountId);
  const bookingQueryUrl = `${baseUrl}/${slugForLink}/randevu?sorgula=true`;

  let changed = false;
  let appointmentsReminded = 0;
  let subscriptionsReminded = 0;
  let maintenanceReminded = 0;
  let smsSent = 0;
  let emailsSent = 0;
  let simulated = 0;

  // 1. Bugünkü 2 saat içindeki onaylı/bekleyen randevular (Müşteriye 2 saat kala E-Posta + SMS/WA)
  for (const apt of state.appointments || []) {
    if (usedThisMonth >= monthlyLimit) break;
    if (!apt || apt.appointmentDate !== today) continue;
    if (apt.status !== 'onayli' && apt.status !== 'bekliyor') continue;
    if ((apt as any).autoReminderSent) continue;

    const aptEmail = String(apt.email || '').trim().toLowerCase();
    const hasValidEmail = Boolean(aptEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(aptEmail));
    const canSendSmsOrWa = Boolean(apt.phone && apt.allowWhatsApp !== false);
    if (!hasValidEmail && !canSendSmsOrWa) continue;

    const aptMinutes = parseTimeSlotMinutes(apt.timeSlot);
    if (aptMinutes === null) continue;
    if (aptMinutes < nowMinutes || aptMinutes > nowMinutes + 120) continue;

    const diffMinutes = Math.max(1, aptMinutes - nowMinutes);
    const remainingText =
      diffMinutes >= 60
        ? `${Math.floor(diffMinutes / 60)} saat${diffMinutes % 60 > 0 ? ` ${diffMinutes % 60} dk` : ''}`
        : `${diffMinutes} dakika`;

    const message = `Merhaba ${apt.customerName}, ${shopName} işletmesindeki bugün saat ${apt.timeSlot} (${apt.serviceName}) randevunuzu hatırlatırız. Görüşmek üzere!`;

    const [result, emailRes] = await Promise.all([
      canSendSmsOrWa
        ? sendSmsMessage(apt.phone, message, { category: 'appointment_reminder', shopName })
        : Promise.resolve({ sent: false, simulated: true, provider: 'skipped', whatsappLink: '' }),
      hasValidEmail
        ? dispatchBrandedEmail({
            to: aptEmail,
            type: 'appointment_reminder',
            shopName,
            recipientName: apt.customerName,
            subject: `${shopName} — Randevunuza ${remainingText} Kaldı! (${apt.timeSlot})`,
            headline: 'Randevunuz Yaklaşıyor!',
            bodyLines: [
              `Merhaba ${apt.customerName}, ${shopName} işletmesindeki bugün saat ${apt.timeSlot} randevunuza yaklaşık ${remainingText} kaldı.`,
              'Randevu bilgilerinizi aşağıda bulabilir, değişiklik gerekirse alttaki bağlantıdan randevunuzu görüntüleyebilirsiniz.',
            ],
            details: [
              { label: 'İşletme', value: shopName },
              { label: 'Tarih & Saat', value: `${apt.appointmentDate} • ${apt.timeSlot}` },
              { label: 'Hizmet', value: apt.serviceName },
              { label: 'Usta / Personel', value: apt.staffName || 'Usta' },
              ...(state.shopProfile?.phone ? [{ label: 'İşletme Telefonu', value: String(state.shopProfile.phone) }] : []),
              ...(state.shopProfile?.googleMapsUrl ? [{ label: 'Konum / Yol Tarifi', value: state.shopProfile.googleMapsUrl }] : []),
            ],
            ctaText: 'Randevumu Görüntüle',
            actionUrl: bookingQueryUrl,
          }).catch(() => ({ sent: false, queued: false, provider: 'error' }))
        : Promise.resolve({ sent: false, queued: false, provider: 'skipped' }),
    ]);

    const reminderLog: ReminderLog = {
      id: `rem_auto_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
      customerId: '',
      customerName: apt.customerName,
      phone: apt.phone || aptEmail,
      channel: result.sent ? 'sms' : emailRes.sent ? 'email' : 'whatsapp',
      message,
      status: result.sent || emailRes.sent ? 'gonderildi' : 'hazirlandi',
      sentAt: new Date(nowMs).toLocaleString('tr-TR'),
      type: 'ozel',
    };

    state.reminderLogs.unshift(reminderLog);
    (apt as any).autoReminderSent = true;
    usedThisMonth += 1;
    appointmentsReminded += 1;
    if (result.sent) smsSent += 1;
    if (emailRes.sent) emailsSent += 1;
    if (!result.sent && !emailRes.sent) simulated += 1;
    changed = true;

    try {
      broadcastToAccount(accountId, { type: 'REMINDER_SENT', payload: reminderLog });
    } catch {
      // ignore broadcast errors outside server
    }
    sendPushToAccount(accountId, {
      title: `2 Saat Kala Hatırlatma (${apt.timeSlot})`,
      body: `${apt.customerName} için ${emailRes.sent ? 'E-posta gönderildi' : result.sent ? 'SMS gönderildi' : 'hatırlatma hazırlandı'}.`,
      url: '/',
      tag: `rem_apt_${apt.id}`,
    }).catch(() => {});
    writeFirestoreDocument(`shops/${accountId}/reminder_logs`, reminderLog.id, {
      ...reminderLog,
      emailSent: Boolean(emailRes.sent),
      accountId,
      createdAtIso: new Date(nowMs).toISOString(),
    }).catch(() => {});
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
    const result = await sendSmsMessage(cust.phone, message, { category: 'subscription_due', shopName });

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
    sendPushToAccount(accountId, {
      title: `Vade Hatırlatması: ${cust.name}`,
      body: `${cust.subscriptionPlan.title} (${cust.subscriptionPlan.amount} TL) hatırlatması işlendi.`,
      url: '/',
      tag: `rem_sub_${cust.id}`,
    }).catch(() => {});
    writeFirestoreDocument(`shops/${accountId}/reminder_logs`, reminderLog.id, {
      ...reminderLog,
      accountId,
      createdAtIso: new Date(nowMs).toISOString(),
    }).catch(() => {});
  }

  // 3. Periyodik Bakım Zamanı Gelen Makine / Cihazlar (Teknik Servis QR Bakım Pasaportu)
  for (const asset of state.maintenanceAssets || []) {
    if (usedThisMonth >= monthlyLimit) break;
    if (!asset || !asset.nextMaintenanceDate || !asset.clientPhone) continue;
    if (asset.nextMaintenanceDate > today) continue;
    if ((asset as any).lastAutoMaintenanceReminderDate === today) continue;

    const message = `Sayın ${asset.clientName}, "${asset.deviceName}" (${asset.code}) ekipmanının periyodik bakım tarihi (${asset.nextMaintenanceDate}) gelmiştir. QR Pasaport: https://dukkanimyanimda.com.tr/bakim/${asset.code}`;
    const result = await sendSmsMessage(asset.clientPhone, message, { category: 'maintenance_due', shopName });

    const reminderLog: ReminderLog = {
      id: `rem_auto_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
      customerId: asset.id,
      customerName: `${asset.clientName} (${asset.deviceName})`,
      phone: asset.clientPhone,
      channel: result.sent ? 'sms' : 'whatsapp',
      message,
      status: result.sent ? 'gonderildi' : 'hazirlandi',
      sentAt: new Date(nowMs).toLocaleString('tr-TR'),
      type: 'bakim',
    };

    state.reminderLogs.unshift(reminderLog);
    (asset as any).lastAutoMaintenanceReminderDate = today;
    usedThisMonth += 1;
    maintenanceReminded += 1;
    if (result.sent) smsSent += 1;
    else simulated += 1;
    changed = true;

    try {
      broadcastToAccount(accountId, { type: 'REMINDER_SENT', payload: reminderLog });
    } catch {
      // ignore
    }
    sendPushToAccount(accountId, {
      title: `Bakım Zamanı: ${asset.deviceName}`,
      body: `${asset.clientName} cihazı için bakım hatırlatması gönderildi.`,
      url: `/bakim/${asset.code}`,
      tag: `rem_asset_${asset.id}`,
    }).catch(() => {});
    writeFirestoreDocument(`shops/${accountId}/reminder_logs`, reminderLog.id, {
      ...reminderLog,
      accountId,
      createdAtIso: new Date(nowMs).toISOString(),
    }).catch(() => {});
  }

  if (state.reminderLogs.length > 500) {
    state.reminderLogs = state.reminderLogs.slice(0, 500);
  }

  return { changed, appointmentsReminded, subscriptionsReminded, maintenanceReminded, smsSent, emailsSent, simulated };
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
        emailsSent: 0,
        simulated: 0,
      }
    );
  }

  cycleRunning = true;
  let checkedShops = 0;
  let appointmentsReminded = 0;
  let subscriptionsReminded = 0;
  let maintenanceReminded = 0;
  let smsSent = 0;
  let emailsSent = 0;
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
        maintenanceReminded += res.maintenanceReminded;
        smsSent += res.smsSent;
        emailsSent += res.emailsSent;
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
      maintenanceReminded,
      smsSent,
      emailsSent,
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

function diffDaysIso(targetDateStr: string, baseDateStr: string): number {
  const t = new Date(`${targetDateStr}T00:00:00Z`).getTime();
  const b = new Date(`${baseDateStr}T00:00:00Z`).getTime();
  if (!Number.isFinite(t) || !Number.isFinite(b)) return NaN;
  return Math.round((t - b) / 86400000);
}

export async function processDailyMorningForShop(
  accountId: string,
  state: AppState,
  options?: { nowMs?: number; force?: boolean; ownerEmail?: string; ownerName?: string }
): Promise<{
  skipped: boolean;
  changed: boolean;
  appointmentsCount: number;
  duesCount: number;
  maintenanceCount: number;
  smsSent: number;
  emailSent: boolean;
  pushSent: boolean;
}> {
  const nowMs = options?.nowMs ?? Date.now();
  const { dateStr: today, monthStr } = getIstanbulDateAndMinutes(nowMs);

  if ((state as any).lastDailyMorningDispatchDate === today && !options?.force) {
    return {
      skipped: true,
      changed: false,
      appointmentsCount: 0,
      duesCount: 0,
      maintenanceCount: 0,
      smsSent: 0,
      emailSent: false,
      pushSent: false,
    };
  }

  if (!Array.isArray(state.reminderLogs)) state.reminderLogs = [];
  const monthlyLimit = getMonthlyAutoReminderLimit(state.shopProfile);
  let usedThisMonth = countUsedAutoRemindersThisMonth(state.reminderLogs, monthStr);
  const shopName = state.shopProfile?.storeName || state.storeName || 'İşletmemiz';
  const ownerName = options?.ownerName || state.shopProfile?.ownerName || 'İşletme Yetkilisi';

  let changed = false;
  let smsSent = 0;

  // 1. Bugünkü aktif randevular
  const todayAppointments = (state.appointments || []).filter(
    (a) => a && a.appointmentDate === today && (a.status === 'onayli' || a.status === 'bekliyor')
  );
  for (const apt of todayAppointments) {
    if (usedThisMonth >= monthlyLimit) break;
    if ((apt as any).morningReminderSent || (apt as any).autoReminderSent) continue;
    if (apt.allowWhatsApp === false || !apt.phone) continue;

    const msg = `Günaydın ${apt.customerName}, ${shopName} işletmesinde bugün saat ${apt.timeSlot} (${apt.serviceName}) randevunuz bulunmaktadır. Görüşmek üzere!`;
    const res = await sendSmsMessage(apt.phone, msg, { category: 'morning_appointment', shopName });
    const logEntry: ReminderLog = {
      id: `rem_auto_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
      customerId: '',
      customerName: apt.customerName,
      phone: apt.phone,
      channel: res.sent ? 'sms' : 'whatsapp',
      message: msg,
      status: res.sent ? 'gonderildi' : 'hazirlandi',
      sentAt: new Date(nowMs).toLocaleString('tr-TR'),
      type: 'ozel',
    };
    state.reminderLogs.unshift(logEntry);
    (apt as any).morningReminderSent = true;
    usedThisMonth += 1;
    if (res.sent) smsSent += 1;
    changed = true;

    writeFirestoreDocument(`shops/${accountId}/reminder_logs`, logEntry.id, {
      ...logEntry,
      accountId,
      createdAtIso: new Date(nowMs).toISOString(),
    }).catch(() => {});
  }

  // 2. Vadesi gelmiş / bugün olan abonelikler ve veresiyeler
  const customerDueMap = new Map<
    string,
    { customerId: string; name: string; phone: string; label: string; amount: number }
  >();

  for (const cust of state.customers || []) {
    if (!cust) continue;
    if (cust.subscriptionPlan?.enabled && cust.subscriptionPlan.nextDueDate && cust.subscriptionPlan.nextDueDate <= today) {
      customerDueMap.set(cust.id, {
        customerId: cust.id,
        name: cust.name,
        phone: cust.phone,
        label: cust.subscriptionPlan.title || 'Abonelik / Aidat',
        amount: Number(cust.subscriptionPlan.amount) || 0,
      });
      continue;
    }

    const custDueDate = (cust as any).dueDate as string | undefined;
    const hasDebt = Number(cust.balance) < 0 || Number(cust.totalDebt) > 0;
    if (custDueDate && custDueDate <= today && hasDebt) {
      customerDueMap.set(cust.id, {
        customerId: cust.id,
        name: cust.name,
        phone: cust.phone,
        label: 'Veresiye Ödeme Vadesi',
        amount: Math.abs(Number(cust.balance) || Number(cust.totalDebt) || 0),
      });
    }
  }

  for (const tx of state.transactions || []) {
    if (!tx || tx.type !== 'veresiye' || !tx.dueDate || tx.dueDate > today) continue;
    if (!tx.customerId || customerDueMap.has(tx.customerId)) continue;
    const cust = (state.customers || []).find((c) => c.id === tx.customerId);
    if (!cust || !cust.phone) continue;
    if (Number(cust.balance) >= 0 && !(Number(cust.totalDebt) > 0)) continue;
    customerDueMap.set(cust.id, {
      customerId: cust.id,
      name: cust.name,
      phone: cust.phone,
      label: tx.description || 'Veresiye Ödemesi',
      amount: Math.abs(Number(cust.balance) || Number(tx.amount) || 0),
    });
  }

  const dueItems = Array.from(customerDueMap.values());
  for (const due of dueItems) {
    if (usedThisMonth >= monthlyLimit) break;
    if (!due.phone) continue;
    const custObj = (state.customers || []).find((c) => c.id === due.customerId);
    if ((custObj as any)?.lastMorningDueReminderDate === today) continue;

    const msg = `Sayın ${due.name}, ${shopName} nezdindeki "${due.label}" (${due.amount} TL) ödemenizin vadesi gelmiştir. Bilginize sunar, hayırlı günler dileriz.`;
    const res = await sendSmsMessage(due.phone, msg, { category: 'morning_due', shopName });
    const logEntry: ReminderLog = {
      id: `rem_auto_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
      customerId: due.customerId,
      customerName: due.name,
      phone: due.phone,
      channel: res.sent ? 'sms' : 'whatsapp',
      message: msg,
      status: res.sent ? 'gonderildi' : 'hazirlandi',
      sentAt: new Date(nowMs).toLocaleString('tr-TR'),
      type: 'veresiye',
    };
    state.reminderLogs.unshift(logEntry);
    if (custObj) (custObj as any).lastMorningDueReminderDate = today;
    usedThisMonth += 1;
    if (res.sent) smsSent += 1;
    changed = true;
  }

  // 3. 0–3 gün kalan makine bakımları
  const upcomingMaint = (state.maintenanceAssets || []).filter((asset) => {
    if (!asset || !asset.nextMaintenanceDate) return false;
    const diff = diffDaysIso(asset.nextMaintenanceDate, today);
    return Number.isFinite(diff) && diff >= 0 && diff <= 3;
  });

  for (const asset of upcomingMaint) {
    if (usedThisMonth >= monthlyLimit) break;
    if (!asset.clientPhone) continue;
    if ((asset as any).lastMorningMaintReminderDate === today) continue;

    const diff = diffDaysIso(asset.nextMaintenanceDate, today);
    const whenText = diff === 0 ? 'bugün' : `${diff} gün sonra (${asset.nextMaintenanceDate})`;
    const msg = `Sayın ${asset.clientName}, "${asset.deviceName}" (${asset.code}) ekipmanınızın periyodik bakım zamanı ${whenText} gelmektedir. QR Pasaport: https://dukkanimyanimda.com.tr/bakim/${asset.code}`;
    const res = await sendSmsMessage(asset.clientPhone, msg, { category: 'morning_maintenance', shopName });
    const logEntry: ReminderLog = {
      id: `rem_auto_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
      customerId: asset.id,
      customerName: `${asset.clientName} (${asset.deviceName})`,
      phone: asset.clientPhone,
      channel: res.sent ? 'sms' : 'whatsapp',
      message: msg,
      status: res.sent ? 'gonderildi' : 'hazirlandi',
      sentAt: new Date(nowMs).toLocaleString('tr-TR'),
      type: 'bakim',
    };
    state.reminderLogs.unshift(logEntry);
    (asset as any).lastMorningMaintReminderDate = today;
    usedThisMonth += 1;
    if (res.sent) smsSent += 1;
    changed = true;
  }

  if (state.reminderLogs.length > 500) {
    state.reminderLogs = state.reminderLogs.slice(0, 500);
  }

  // Duplicate engel işareti
  (state as any).lastDailyMorningDispatchDate = today;
  changed = true;

  const hasAnyEvent = todayAppointments.length > 0 || dueItems.length > 0 || upcomingMaint.length > 0;
  let pushSent = false;
  let emailSent = false;

  if (hasAnyEvent) {
    const summaryText = `Bugün ${todayAppointments.length} randevu, ${dueItems.length} vadesi gelen ödeme ve ${upcomingMaint.length} yaklaşan bakım bulunuyor.`;
    try {
      const pushRes = await sendPushToAccount(accountId, {
        title: `Günaydın! ${shopName} 09:00 Özeti`,
        body: summaryText,
        url: '/',
        tag: `daily_09_${today}`,
      });
      pushSent = pushRes.sent > 0;
    } catch {
      // push hatası akışı kesmez
    }

    if (options?.ownerEmail && options.ownerEmail.includes('@')) {
      try {
        const mailRes = await dispatchBrandedEmail({
          to: options.ownerEmail,
          subject: `${shopName} — Sabah 09:00 Günlük İşletme Özeti (${today})`,
          type: 'daily_summary',
          shopName,
          ownerName,
          recipientName: ownerName,
          bodyLines: [
            `Günaydın ${ownerName}, ${today} tarihli sabah 09:00 otomatik tarama özeti hazırdır.`,
            summaryText,
          ],
          details: [
            { label: 'Bugünkü Randevular', value: String(todayAppointments.length) },
            { label: 'Vadesi Gelen Abonelik / Veresiye', value: String(dueItems.length) },
            { label: '0-3 Gün Kalan Makine Bakımları', value: String(upcomingMaint.length) },
            { label: 'Gönderilen Hatırlatma SMS', value: String(smsSent) },
          ],
        });
        emailSent = Boolean(mailRes.sent);
      } catch {
        // email hatası akışı kesmez
      }
    }
  }

  return {
    skipped: false,
    changed,
    appointmentsCount: todayAppointments.length,
    duesCount: dueItems.length,
    maintenanceCount: upcomingMaint.length,
    smsSent,
    emailSent,
    pushSent,
  };
}

export async function runDailyMorningDispatch(options?: {
  nowMs?: number;
  force?: boolean;
}): Promise<DailyMorningDispatchStats> {
  const nowMs = options?.nowMs ?? Date.now();
  const { dateStr: today } = getIstanbulDateAndMinutes(nowMs);
  const owners = getAccounts().filter((a) => (a.role || 'owner') === 'owner');

  let checkedShops = 0;
  let skippedDuplicates = 0;
  let appointmentsCount = 0;
  let duesCount = 0;
  let maintenanceCount = 0;
  let smsSent = 0;
  let emailsSent = 0;
  let pushesSent = 0;

  for (const acc of owners) {
    checkedShops += 1;
    try {
      const state = loadShopState(acc.id);
      const res = await processDailyMorningForShop(acc.id, state, {
        nowMs,
        force: options?.force,
        ownerEmail: acc.email,
        ownerName: acc.ownerName,
      });

      if (res.skipped) {
        skippedDuplicates += 1;
        continue;
      }

      appointmentsCount += res.appointmentsCount;
      duesCount += res.duesCount;
      maintenanceCount += res.maintenanceCount;
      smsSent += res.smsSent;
      if (res.emailSent) emailsSent += 1;
      if (res.pushSent) pushesSent += 1;
      if (res.changed) {
        persistShopState(acc.id, state);
      }
    } catch (err) {
      console.error(`[DailyMorning09] Dükkan işlenirken hata (${acc.id}):`, err);
    }
  }

  return {
    ranAt: new Date(nowMs).toISOString(),
    date: today,
    checkedShops,
    skippedDuplicates,
    appointmentsCount,
    duesCount,
    maintenanceCount,
    smsSent,
    emailsSent,
    pushesSent,
  };
}
