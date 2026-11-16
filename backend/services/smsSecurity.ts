import path from 'path';
import { DATA_DIR } from '../config';
import { readJsonFile, writeJsonFile } from '../fsdb';

// Güvenlik ve Harcama Muhafızı Limit Sabitleri
export const SMS_LIMITS = {
  GLOBAL_DAILY_LIMIT: 20,       // Spark / varsayılan güvenli tavan (Blaze modunda env ile yükselir)
  PHONE_DAILY_LIMIT: 3,         // Aynı numaraya günde en fazla 3 SMS
  PHONE_COOLDOWN_MS: 60 * 1000, // Aynı numaraya 1 dakika bekleme süresi (SMS flood koruması)
  IP_DAILY_LIMIT: 10,           // Aynı IP adresinden günde en fazla 10 SMS
  IP_HOURLY_LIMIT: 5,           // Aynı IP adresinden saatte en fazla 5 SMS
  HOURLY_WINDOW_MS: 60 * 60 * 1000,
};

export function getEffectiveSmsLimits() {
  const isBlaze = process.env.FIREBASE_BLAZE_ENABLED === 'true';
  const envGlobal = Number(process.env.SMS_GLOBAL_DAILY_LIMIT || 0);
  const envPhoneDaily = Number(process.env.SMS_PHONE_DAILY_LIMIT || 0);
  const envIpDaily = Number(process.env.SMS_IP_DAILY_LIMIT || 0);
  const envIpHourly = Number(process.env.SMS_IP_HOURLY_LIMIT || 0);

  return {
    GLOBAL_DAILY_LIMIT: envGlobal > 0 ? envGlobal : isBlaze ? 5000 : SMS_LIMITS.GLOBAL_DAILY_LIMIT,
    PHONE_DAILY_LIMIT: envPhoneDaily > 0 ? envPhoneDaily : isBlaze ? 5 : SMS_LIMITS.PHONE_DAILY_LIMIT,
    PHONE_COOLDOWN_MS: SMS_LIMITS.PHONE_COOLDOWN_MS,
    IP_DAILY_LIMIT: envIpDaily > 0 ? envIpDaily : isBlaze ? 30 : SMS_LIMITS.IP_DAILY_LIMIT,
    IP_HOURLY_LIMIT: envIpHourly > 0 ? envIpHourly : isBlaze ? 15 : SMS_LIMITS.IP_HOURLY_LIMIT,
    HOURLY_WINDOW_MS: SMS_LIMITS.HOURLY_WINDOW_MS,
    isBlazeMode: isBlaze,
  };
}

// WhatsApp Destek / Manuel Doğrulama Hattı
export const WHATSAPP_SUPPORT_PHONE = (process.env.SUPPORT_WHATSAPP_PHONE || '905550000000').replace(/\D/g, '') || '905550000000'; // Dükkânım Yanımda Destek Hattı

export interface PhoneSmsRecord {
  countToday: number;
  lastSentAt: number;
  dateStr: string;
}

export interface IpSmsRecord {
  countToday: number;
  recentTimestamps: number[]; // Son 1 saat içindeki istek zamanları
  dateStr: string;
}

export interface SmsSecurityState {
  globalDate: string; // YYYY-MM-DD
  globalCountToday: number;
  isCircuitBreakerTripped?: boolean;
  phones: Record<string, PhoneSmsRecord>;
  ips: Record<string, IpSmsRecord>;
}

const STATE_FILE_PATH = path.join(DATA_DIR, 'sms-security-state.json');

// Bugünün tarih dizesini yerel saat dilimine göre döner (YYYY-MM-DD)
export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Güvenlik durumunu JSON dosyasından oku
export function loadSmsSecurityState(): SmsSecurityState {
  const today = getTodayDateStr();
  const defaultState: SmsSecurityState = {
    globalDate: today,
    globalCountToday: 0,
    isCircuitBreakerTripped: false,
    phones: {},
    ips: {},
  };

  try {
    const state = readJsonFile<SmsSecurityState>(STATE_FILE_PATH, defaultState);

    // Yeni güne geçilmişse günlük sayaçları sıfırla
    if (state.globalDate !== today) {
      state.globalDate = today;
      state.globalCountToday = 0;
      state.isCircuitBreakerTripped = false;
      // Eski günün sayaçlarını temizle veya yeni güne aktar
      state.phones = {};
      state.ips = {};
      writeJsonFile(STATE_FILE_PATH, state);
    }

    if (!state.phones) state.phones = {};
    if (!state.ips) state.ips = {};

    return state;
  } catch (err) {
    console.error('[SMS Security] Durum dosyası okunurken hata:', err);
    return defaultState;
  }
}

// Güvenlik durumunu JSON dosyasına senkronize et
export function persistSmsSecurityState(state: SmsSecurityState): void {
  try {
    writeJsonFile(STATE_FILE_PATH, state);
  } catch (err) {
    console.error('[SMS Security] Durum dosyası kaydedilirken hata:', err);
  }
}

export interface EligibilityResult {
  allowed: boolean;
  reason?: 'CIRCUIT_BREAKER_ACTIVE' | 'PHONE_COOLDOWN' | 'PHONE_DAILY_LIMIT' | 'IP_HOURLY_LIMIT' | 'IP_DAILY_LIMIT';
  message?: string;
  waitSeconds?: number;
  fallbackToWhatsapp?: boolean;
  whatsappLink?: string;
}

// WhatsApp yönlendirme bağlantısı oluşturucu
export function generateWhatsAppVerificationLink(phone: string): string {
  const message = encodeURIComponent(
    `Merhaba Dükkânım Yanımda Destek Ekibi, şifre sıfırlama güvenliği için WhatsApp üzerinden doğrulama talep ediyorum. Kayıtlı dükkan telefonum: ${phone}`
  );
  return `https://wa.me/${WHATSAPP_SUPPORT_PHONE}?text=${message}`;
}

/**
 * 4 Katmanlı SMS Uygunluk ve Güvenlik Kontrolü:
 * 1. Katman: Global Devre Kesici (Circuit Breaker) - Günlük tavan harcama kontrolü
 * 2. Katman: Telefon 1 dakikalık bekleme (Cooldown / Flood) kontrolü
 * 3. Katman: Telefon günlük limit kontrolü
 * 4. Katman: IP saatlik ve günlük limit kontrolü
 */
export function checkSmsEligibility(rawPhone: string, rawIp: string): EligibilityResult {
  const limits = getEffectiveSmsLimits();
  const phone = rawPhone.replace(/\D/g, '');
  const ip = (rawIp || 'unknown').trim();
  const state = loadSmsSecurityState();
  const now = Date.now();
  const today = getTodayDateStr();

  // 1. Katman: Küresel Devre Kesici (Global Circuit Breaker)
  if (state.isCircuitBreakerTripped || state.globalCountToday >= limits.GLOBAL_DAILY_LIMIT) {
    return {
      allowed: false,
      reason: 'CIRCUIT_BREAKER_ACTIVE',
      message: 'Güvenlik kalkanı devrede: Günlük güvenli SMS kotasına ulaşıldı. Lütfen WhatsApp ile anında doğrulama yapınız.',
      fallbackToWhatsapp: true,
      whatsappLink: generateWhatsAppVerificationLink(phone),
    };
  }

  // 2. ve 3. Katman: Telefon Bazlı Kontroller
  const phoneRecord = state.phones[phone];
  if (phoneRecord) {
    // Aynı gün içindeyse
    if (phoneRecord.dateStr === today) {
      // 2. Katman: Cooldown (1 dakika içinde tekrar SMS istenemez)
      const elapsed = now - (phoneRecord.lastSentAt || 0);
      if (elapsed < limits.PHONE_COOLDOWN_MS) {
        const remainingSec = Math.ceil((limits.PHONE_COOLDOWN_MS - elapsed) / 1000);
        return {
          allowed: false,
          reason: 'PHONE_COOLDOWN',
          message: `Lütfen yeni bir SMS talep etmeden önce ${remainingSec} saniye bekleyiniz.`,
          waitSeconds: remainingSec,
          fallbackToWhatsapp: false,
        };
      }

      // 3. Katman: Günlük Telefon Limiti
      if (phoneRecord.countToday >= limits.PHONE_DAILY_LIMIT) {
        return {
          allowed: false,
          reason: 'PHONE_DAILY_LIMIT',
          message: `Bu telefon numarası için günlük SMS gönderme sınırına (${limits.PHONE_DAILY_LIMIT} SMS) ulaşıldı. WhatsApp veya e-posta ile hemen doğrulayabilirsiniz.`,
          fallbackToWhatsapp: true,
          whatsappLink: generateWhatsAppVerificationLink(phone),
        };
      }
    }
  }

  // 4. Katman: IP Bazlı Kontroller
  const ipRecord = state.ips[ip];
  if (ipRecord && ipRecord.dateStr === today) {
    // 1 saat içindeki istekleri filtrele
    const recentTimestamps = (ipRecord.recentTimestamps || []).filter(
      (ts) => now - ts < limits.HOURLY_WINDOW_MS
    );

    // Saatte max SMS
    if (recentTimestamps.length >= limits.IP_HOURLY_LIMIT) {
      return {
        allowed: false,
        reason: 'IP_HOURLY_LIMIT',
        message: 'Ağınızdan (IP) çok fazla SMS talebi yapıldı. Lütfen daha sonra deneyiniz veya WhatsApp ile doğrulayınız.',
        fallbackToWhatsapp: true,
        whatsappLink: generateWhatsAppVerificationLink(phone),
      };
    }

    // Günde max SMS
    if (ipRecord.countToday >= limits.IP_DAILY_LIMIT) {
      return {
        allowed: false,
        reason: 'IP_DAILY_LIMIT',
        message: 'Ağınız için günlük maksimum SMS sınırına ulaşıldı. WhatsApp ile şifrenizi hemen sıfırlayabilirsiniz.',
        fallbackToWhatsapp: true,
        whatsappLink: generateWhatsAppVerificationLink(phone),
      };
    }
  }

  return { allowed: true };
}

/**
 * SMS başarıyla fırlatıldığında (veya gönderim başladığında) sayaçları günceller ve
 * data/sms-security-state.json dosyasına anında yazar.
 */
export function recordSmsSent(rawPhone: string, rawIp: string): void {
  const limits = getEffectiveSmsLimits();
  const phone = rawPhone.replace(/\D/g, '');
  const ip = (rawIp || 'unknown').trim();
  const state = loadSmsSecurityState();
  const now = Date.now();
  const today = getTodayDateStr();

  // Global sayaç artır
  state.globalCountToday = (state.globalCountToday || 0) + 1;
  if (state.globalCountToday >= limits.GLOBAL_DAILY_LIMIT) {
    state.isCircuitBreakerTripped = true;
    console.warn(`[SMS Security] ⚠️ KÜRESEL DEVRE KESİCİ DEVREYE GİRDİ! Günlük kota (${limits.GLOBAL_DAILY_LIMIT}) doldu.`);
  }

  // Telefon sayacı
  if (!state.phones[phone] || state.phones[phone].dateStr !== today) {
    state.phones[phone] = {
      countToday: 1,
      lastSentAt: now,
      dateStr: today,
    };
  } else {
    state.phones[phone].countToday += 1;
    state.phones[phone].lastSentAt = now;
  }

  // IP sayacı
  if (!state.ips[ip] || state.ips[ip].dateStr !== today) {
    state.ips[ip] = {
      countToday: 1,
      recentTimestamps: [now],
      dateStr: today,
    };
  } else {
    const recent = (state.ips[ip].recentTimestamps || []).filter(
      (ts) => now - ts < limits.HOURLY_WINDOW_MS
    );
    recent.push(now);
    state.ips[ip].recentTimestamps = recent;
    state.ips[ip].countToday += 1;
  }

  persistSmsSecurityState(state);
}

/**
 * Admin veya sistem izleme için mevcut SMS durumunu döner
 */
export function getSmsSecurityStats(): {
  today: string;
  globalCountToday: number;
  globalLimit: number;
  isCircuitBreakerTripped: boolean;
  totalTrackedPhones: number;
  totalTrackedIps: number;
} {
  const limits = getEffectiveSmsLimits();
  const state = loadSmsSecurityState();
  return {
    today: state.globalDate,
    globalCountToday: state.globalCountToday || 0,
    globalLimit: limits.GLOBAL_DAILY_LIMIT,
    isCircuitBreakerTripped: !!state.isCircuitBreakerTripped,
    totalTrackedPhones: Object.keys(state.phones || {}).length,
    totalTrackedIps: Object.keys(state.ips || {}).length,
  };
}
