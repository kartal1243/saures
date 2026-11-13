import type { Express, Request, Response } from 'express';
import type {
  Appointment,
  AppointmentStep,
  BarberDiscountSlot,
  BarberReview,
  BarberSalonSettings,
  BarberService,
  BarberStaff,
  BarberTimeBlock,
  CustomerPackage,
  Transaction,
} from '../../shared/types';
import { S, saveState } from '../context';
import { calculateCashRegister } from '../cash';
import { broadcast, broadcastToAccount } from '../realtime';
import { localDay } from '../day';
import { getAccounts, clientIp, isValidTurkishPhone, normalizePhone } from '../accounts';
import { loadShopState, persistShopState, defaultBarberSettings, defaultBarberStaff, defaultBarberServices, demoBarberReviews } from '../shopState';
import { checkAndUpdateVipStatus, getTierLimits } from './profile';
import { FREE_ONLINE_BOOKING_QUOTA } from '../config';
import { publicActionRateLimit } from '../guards';
import { DEMO_ACCOUNT_ID, DEMO_PHONE } from '../demoSeed';

function slugify(text: string): string {
  const trMap: Record<string, string> = {
    ç: 'c', Ç: 'c',
    ğ: 'g', Ğ: 'g',
    ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o',
    ş: 's', Ş: 's',
    ü: 'u', Ü: 'u',
  };
  return text
    .split('')
    .map((char) => trMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

function resolveBarberShop(identifier: string) {
  const rawId = identifier.toLowerCase().trim();
  const accounts = getAccounts();

  let targetAcc = accounts.find(
    (a) =>
      a.id.toLowerCase() === rawId ||
      a.phone === rawId ||
      slugify(a.shopName) === rawId
  );

  let shopState = targetAcc ? loadShopState(targetAcc.id) : null;

  if (!shopState) {
    for (const a of accounts) {
      const st = loadShopState(a.id);
      const shopSlug = st.shopProfile?.slug || slugify(st.shopProfile?.storeName || a.shopName);
      if (shopSlug === rawId) {
        targetAcc = a;
        shopState = st;
        break;
      }
    }
  }

  // Yalnızca rawId 'demo' ise demoya düş; var olmayan diğer sluglar 404 dönmelidir!
  if (!shopState && rawId === 'demo') {
    const fallbackAcc = accounts.find(
      (a) => a.id === DEMO_ACCOUNT_ID || a.phone === DEMO_PHONE || a.phone === '05550000000'
    );
    if (fallbackAcc) {
      targetAcc = fallbackAcc;
      shopState = loadShopState(fallbackAcc.id);
    }
  }

  // VIP geçerlilik kontrolü
  if (shopState && shopState.shopProfile) {
    const wasVip = shopState.shopProfile.isVip;
    checkAndUpdateVipStatus(shopState.shopProfile);
    if (targetAcc && wasVip !== shopState.shopProfile.isVip) {
      persistShopState(targetAcc.id, shopState);
    }
  }

  return { account: targetAcc, shopState };
}

function timeToMinutes(timeStr: string): number {
  const [hh, mm] = timeStr.split(':').map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

function minutesToTime(totalMinutes: number): string {
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// Ustanın belirli bir tarih ve zaman aralığında müsait olup olmadığını kontrol eden yardımcı
function isStaffAvailable(
  staffId: string,
  date: string,
  startMin: number,
  endMin: number,
  appointments: Appointment[],
  timeBlocks: BarberTimeBlock[],
  staffOrList?: BarberStaff | BarberStaff[] | null,
  excludeAppointmentId?: string
): boolean {
  // Personel nesnesini çözümle
  const staffObj: BarberStaff | undefined = Array.isArray(staffOrList)
    ? staffOrList.find((s) => s.id === staffId)
    : (staffOrList || undefined);

  // 1. Personel aktiflik kontrolü
  if (staffObj && staffObj.active === false) {
    return false;
  }

  // 2. Personel haftalık izin günü (offDays) kontrolü (0: Pazar, 1: Pazartesi, ..., 6: Cumartesi)
  if (staffObj?.offDays && Array.isArray(staffObj.offDays) && staffObj.offDays.length > 0) {
    const [y, m, d] = date.split('-').map(Number);
    const targetDateObj = new Date(y, m - 1, d);
    const dayOfWeek = targetDateObj.getDay();
    if (staffObj.offDays.includes(dayOfWeek)) {
      return false; // Personel bugün izinli
    }
  }

  // 3. Personel şahsi mesai saatleri (workingHours / workStart-workEnd) kontrolü
  const staffStartStr = staffObj?.workingHours?.start || staffObj?.workStart;
  const staffEndStr = staffObj?.workingHours?.end || staffObj?.workEnd;
  if (staffStartStr && staffEndStr) {
    const sStartMin = timeToMinutes(staffStartStr);
    const sEndMin = timeToMinutes(staffEndStr);
    if (startMin < sStartMin || endMin > sEndMin) {
      return false; // Randevu personelin mesai saatleri dışında
    }
  }

  // 4. Mola / Kapatma saati çakışma kontrolü
  const hasBlock = timeBlocks.some((b) => {
    if (b.date !== date) return false;
    const matchesStaff = !b.staffId || b.staffId === 'all' || b.staffId === staffId;
    if (!matchesStaff) return false;
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);
    return startMin < bEnd && endMin > bStart;
  });
  if (hasBlock) return false;

  // 5. Çakışan aktif randevu kontrolü
  const hasApt = appointments.some((a) => {
    if (excludeAppointmentId && a.id === excludeAppointmentId) return false;
    if (a.appointmentDate !== date) return false;
    if (a.status === 'iptal' || a.status === 'arsiv' || a.status === 'gelmedi') return false;

    // Eğer randevunun adımları (steps) varsa adım bazlı kontrol
    if (Array.isArray(a.steps) && a.steps.length > 0) {
      return a.steps.some((st) => {
        if (st.staffId !== staffId) return false;
        const stStart = timeToMinutes(st.startTime);
        const stEnd = timeToMinutes(st.endTime);
        return startMin < stEnd && endMin > stStart;
      });
    }

    // Klasik tek adımlı randevu
    if (a.staffId && a.staffId !== staffId) return false;
    const aStart = timeToMinutes(a.timeSlot);
    const aEnd = aStart + (a.durationMinutes || 30);
    return startMin < aEnd && endMin > aStart;
  });

  return !hasApt;
}

// In-memory OTP Store (5 dakika TTL, brute-force korumalı)
interface StoredOtp {
  code: string;
  expiresAt: number;
  attempts?: number;
}
const otpStore = new Map<string, StoredOtp>();

// IP bazlı genel randevu bot spam engelleyici (dakikada max 5 randevu isteği)
const bookingIpLimiter = new Map<string, { count: number; resetAt: number }>();
function publicBookingRateLimit(req: Request, res: Response, next: () => void) {
  const ip = clientIp(req);
  const now = Date.now();
  let entry = bookingIpLimiter.get(ip);
  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + 60000 };
    bookingIpLimiter.set(ip, entry);
    return next();
  }
  entry.count++;
  if (entry.count > 5) {
    return res.status(429).json({ error: 'Çok fazla randevu denemesi yapıldı. Güvenlik gereği lütfen 1 dakika bekleyiniz.' });
  }
  next();
}

// KVKK Uyumluluğu: Müşteri Adı ve Soyadı Maskeleme (Örn: "Ahmet Yılmaz" -> "Ah*** Yıl***")
export function maskCustomerName(name?: string): string {
  if (!name || typeof name !== 'string') return '***';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => {
      if (p.length <= 2) return p[0] ? p[0] + '*' : '*';
      return p.slice(0, 2) + '*'.repeat(Math.max(1, p.length - 2));
    })
    .join(' ');
}

// KVKK Uyumluluğu: Telefon Numarası Maskeleme (Örn: "05321234567" -> "0532 *** ** 67")
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '05** *** ** **';
  const norm = normalizePhone(phone);
  if (norm.length === 11) {
    return norm.slice(0, 4) + ' *** ** ' + norm.slice(-2);
  }
  return '05** *** ** **';
}

// ==========================================
// PUBLIC BARBER APPOINTMENT API (HERKESE AÇIK - ŞİFRESİZ)
// ==========================================
export function registerPublicBarberRoutes(app: Express): void {
  // 1. Berber Kamusal Verisi (Müşteri ekranı için)
  app.get('/api/public/barber/:identifier', (req: Request, res: Response) => {
    const { shopState, account } = resolveBarberShop(req.params.identifier);
    if (!shopState) {
      return res.status(404).json({ error: 'Berber / kuaför işletmesi bulunamadı.' });
    }

    const staff: BarberStaff[] = (shopState.barberStaff && shopState.barberStaff.length > 0)
      ? shopState.barberStaff.filter((s) => s.active)
      : defaultBarberStaff;

    const services: BarberService[] = (shopState.barberServices && shopState.barberServices.length > 0)
      ? shopState.barberServices
      : defaultBarberServices;

    const settings: BarberSalonSettings = shopState.barberSettings || defaultBarberSettings;

    // Sonraki 14 günlük dolu slotlar (Hassas müşteri bilgisi İÇERMEZ)
    const occupiedSlots = (shopState.appointments || [])
      .filter((a) => a.status !== 'iptal' && a.status !== 'arsiv' && a.status !== 'gelmedi')
      .map((a) => ({
        date: a.appointmentDate,
        timeSlot: a.timeSlot,
        durationMinutes: a.durationMinutes || 30,
        staffId: a.staffId || '',
        steps: (a.steps || []).map((st) => ({
          staffId: st.staffId,
          startTime: st.startTime,
          endTime: st.endTime,
          durationMinutes: st.durationMinutes,
        })),
      }));

    // Mola ve kapatılan saat blokları
    const timeBlocks = (shopState.barberTimeBlocks || []).map((b) => ({
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      staffId: b.staffId,
      reason: b.reason,
    }));

    const storeName = shopState.shopProfile?.storeName || account?.shopName || 'Berber & Kuaför Salonu';
    const slug = shopState.shopProfile?.slug || slugify(storeName);
    const isDemo = Boolean(account?.id && account.id.includes('demo'));
    const limits = getTierLimits(shopState.shopProfile);
    const isVip = Boolean(shopState.shopProfile?.isVip || isDemo);

    // Aylık randevu kotası kontrolü: Çırak (20), Usta (60), Patron VIP (Sınırsız)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyOnlineApts = (shopState.appointments || []).filter(
      (a) => a.appointmentDate && a.appointmentDate.startsWith(currentMonth) && (a.isOnlineBooking || (a as any).isOnline)
    ).length;
    const effectiveQuota = isDemo ? Infinity : limits.maxMonthlyOnlineBookings;
    const quotaExceeded = monthlyOnlineApts >= effectiveQuota;

    // Çırak ve Usta paketlerinde tek koltuk kuralı
    const allowedStaff = isDemo || limits.maxStaffSeats === Infinity ? staff : staff.slice(0, limits.maxStaffSeats);

    res.json({
      shop: {
        storeName,
        phone: shopState.shopProfile?.phone || account?.phone || '',
        cityDistrict: shopState.shopProfile?.cityDistrict || '',
        slogan: shopState.shopProfile?.slogan || 'Profesyonel Saç & Sakal Bakımı',
        slug,
        logoUrl: shopState.shopProfile?.logoUrl,
        isVip,
        vipTier: limits.tier,
        brandingRequired: !isDemo && !limits.removeBranding,
      },
      isVip,
      vipTier: limits.tier,
      vipRequired: quotaExceeded,
      monthlyQuota: effectiveQuota === Infinity ? 999999 : effectiveQuota,
      monthlyUsed: monthlyOnlineApts,
      staff: allowedStaff,
      services,
      settings,
      occupiedSlots,
      timeBlocks,
      reviews: (shopState.barberReviews && shopState.barberReviews.length > 0)
        ? shopState.barberReviews.filter((r) => r.approved !== false)
        : (isDemo ? demoBarberReviews : []),
    });
  });

  // 2. Randevu SMS / WhatsApp Onay Kodu Gönderimi (Gerçek Doğrulama)
  app.post('/api/public/barber/send-otp', publicActionRateLimit, (req: Request, res: Response) => {
    const rawPhone = String(req.body?.phone || '');
    const cleanPhone = normalizePhone(rawPhone);
    if (!isValidTurkishPhone(rawPhone)) {
      return res.status(400).json({ error: 'Geçerli bir cep telefonu numarası giriniz (05XX XXX XX XX formatında).' });
    }
    // 6 haneli güvenli onay kodu
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(cleanPhone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 dakika geçerli
      attempts: 0,
    });

    const cleanNumber = cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone;
    const whatsappText = encodeURIComponent(`Dükkânım Yanımda Randevu Onay Kodunuz: ${code}`);
    const whatsappLink = `https://wa.me/90${cleanNumber}?text=${whatsappText}`;

    const identifier = String(req.body?.identifier || '').toLowerCase().trim();
    const isDemo = cleanPhone === '05900000011' || cleanPhone === '05550000000' || identifier === 'demo' || process.env.NODE_ENV !== 'production';

    res.json({
      success: true,
      message: 'Onay kodunuz SMS olarak gönderildi.',
      demoCode: isDemo ? code : undefined,
      whatsappLink,
    });
  });

  // 3. Müşteri Online Randevu Kaydı (4 Adımlı Form Sonu - Bot ve Kotaya Karşı Korumalı)
  app.post('/api/public/barber/:identifier/book', publicBookingRateLimit, (req: Request, res: Response) => {
    const { shopState, account } = resolveBarberShop(req.params.identifier);
    if (!shopState || !account) {
      return res.status(404).json({ error: 'İşletme bulunamadı.' });
    }

    const isDemo = Boolean(account?.id && account.id.includes('demo'));
    const limits = getTierLimits(shopState.shopProfile);
    const {
      customerName,
      phone,
      email,
      notes,
      kvkkApproved,
      allowWhatsApp,
      date,
      timeSlot,
      serviceIds,
      staffId,
      otpCode,
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: 'Lütfen adınızı ve soyadınızı giriniz.' });
    }
    const rawPhone = String(phone || '');
    const cleanPhone = normalizePhone(rawPhone);
    if (!isValidTurkishPhone(rawPhone)) {
      return res.status(400).json({ error: 'Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX formatında, 11 hane).' });
    }
    if (!kvkkApproved) {
      return res.status(400).json({ error: 'Lütfen KVKK aydınlatma metnini onaylayınız.' });
    }
    if (!date || !timeSlot) {
      return res.status(400).json({ error: 'Lütfen randevu tarihi ve saati seçiniz.' });
    }

    // Canlı Gerçek Zamanlama Doğrulaması: Geçmiş gün ve saatlere randevu engeli
    // (Örn: Bugün 2 Kasım akşamı ise artık geçmiş saatlere randevu alınamaz, yarın seçilmelidir)
    const now = new Date();
    const trDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' });
    const todayTrStr = trDateFormatter.format(now);
    const trTimeFormatter = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', hour12: false });
    const [nowHour, nowMin] = trTimeFormatter.format(now).split(':').map(Number);
    const nowMinutesTr = (nowHour || 0) * 60 + (nowMin || 0);
    const reqSlotMinutes = timeToMinutes(timeSlot);

    if (date < todayTrStr) {
      return res.status(400).json({ error: 'Geçmiş bir tarihe randevu alınamaz. Lütfen yarın veya sonraki günleri seçiniz.' });
    }
    if (date === todayTrStr && reqSlotMinutes <= nowMinutesTr + 10) {
      return res.status(400).json({ error: 'Bugün için seçtiğiniz saat geçmişte kalmıştır. Lütfen güncel veya yarınki saatleri seçiniz.' });
    }
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ error: 'En az bir hizmet seçmelisiniz.' });
    }
    if (serviceIds.length > 5) {
      return res.status(400).json({ error: 'Tek seferde en fazla 5 hizmet seçebilirsiniz.' });
    }

    // Kota Kontrolü: Çırak (20/ay), Usta (60/ay), Patron VIP (Sınırsız)
    const currentMonth = date.slice(0, 7);
    const monthlyOnlineApts = (shopState.appointments || []).filter(
      (a) => a.appointmentDate && a.appointmentDate.startsWith(currentMonth) && (a.isOnlineBooking || (a as any).isOnline)
    ).length;
    const effectiveQuota = isDemo ? Infinity : limits.maxMonthlyOnlineBookings;

    if (monthlyOnlineApts >= effectiveQuota) {
      return res.status(403).json({
        error: `Bu işletmenin bu ayki ${effectiveQuota} adet online randevu kotası dolmuştur. Randevu için lütfen işletmeyle iletişime geçiniz.`,
        code: 'QUOTA_EXCEEDED',
        quota: effectiveQuota,
        used: monthlyOnlineApts,
        vipRequired: true,
      });
    }

    // Gerçek OTP Doğrulaması ('1234' bypass kaldırıldı)
    if (shopState.barberSettings?.requireOtp) {
      const stored = otpStore.get(cleanPhone);
      const trimmedCode = String(otpCode || '').trim();
      const isValid = Boolean(stored && stored.code === trimmedCode && stored.expiresAt > Date.now());
      if (!isValid) {
        return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş SMS onay kodu. Lütfen önce "SMS Kodu Gönder" butonuna basınız.' });
      }
      otpStore.delete(cleanPhone);
    }

    // Spam Koruması: Aynı telefon için aynı günde max 2 aktif randevu
    const existingApts = (shopState.appointments || []).filter(
      (a) =>
        a.appointmentDate === date &&
        normalizePhone(a.phone) === cleanPhone &&
        a.status !== 'iptal' &&
        a.status !== 'arsiv'
    );
    if (existingApts.length >= 2) {
      return res.status(429).json({ error: 'Aynı gün için en fazla 2 aktif randevu alabilirsiniz.' });
    }

    // Salon Kapalı Gün Kontrolü
    const targetDateObj = new Date(date);
    const dayOfWeek = targetDateObj.getDay(); // 0: Pazar, 1: Pzt...
    const settings = shopState.barberSettings || defaultBarberSettings;
    if (settings.closedDays && settings.closedDays.includes(dayOfWeek)) {
      return res.status(400).json({ error: `Seçilen gün salon kapalıdır (${settings.closedReason || 'Kapalı gün'}).` });
    }

    // Hizmetleri Çözümle
    const allServices: BarberService[] = shopState.barberServices || defaultBarberServices;
    const selectedServices = allServices.filter((s) => serviceIds.includes(s.id));
    if (selectedServices.length === 0) {
      return res.status(400).json({ error: 'Seçilen hizmetler bulunamadı.' });
    }

    const allStaff: BarberStaff[] = (shopState.barberStaff || defaultBarberStaff).filter((s) => s.active);
    const activeAppointments = shopState.appointments || [];
    const timeBlocks = shopState.barberTimeBlocks || [];

    // Seçilen personeli önceden tespit et (eğer belirli bir usta seçildiyse)
    const predefinedStaff = (staffId && staffId !== 'fark_etmez' && staffId !== 'auto')
      ? allStaff.find((s) => s.id === staffId)
      : undefined;

    // Toplam süreyi hesapla (Usta bazlı dinamik süre öncelikli!)
    const totalDuration = selectedServices.reduce((sum, s) => {
      const customDur = predefinedStaff?.customPricing?.[s.id]?.duration;
      return sum + (typeof customDur === 'number' && customDur > 0 ? customDur : (s.durationMinutes || 30));
    }, 0);

    const requestedStartMin = timeToMinutes(timeSlot);
    const requestedEndMin = requestedStartMin + totalDuration;

    const openMin = timeToMinutes(settings.openHour || '09:00');
    const closeMin = timeToMinutes(settings.closeHour || '21:00');
    if (requestedStartMin < openMin || requestedEndMin > closeMin) {
      return res.status(400).json({
        error: `Randevu saati salon çalışma saatleri (${settings.openHour || '09:00'} - ${settings.closeHour || '21:00'}) dışında kalmaktadır.`,
      });
    }

    // Ardışık adımları (Steps) ve usta uygunluğunu hesapla
    let currentStartMinutes = requestedStartMin;
    const steps: AppointmentStep[] = [];
    let totalPrice = 0;
    let primaryStaffName = 'Otomatik Atanacak';
    let primaryStaffId = staffId || 'fark_etmez';

    for (const srv of selectedServices) {
      let assignedStaff: BarberStaff | undefined;

      if (predefinedStaff) {
        assignedStaff = predefinedStaff;
        const customDur = assignedStaff.customPricing?.[srv.id]?.duration;
        const stepDuration = (typeof customDur === 'number' && customDur > 0) ? customDur : (srv.durationMinutes || 30);
        const stepEndMinutes = currentStartMinutes + stepDuration;

        const isFree = isStaffAvailable(
          assignedStaff.id,
          date,
          currentStartMinutes,
          stepEndMinutes,
          activeAppointments,
          timeBlocks,
          assignedStaff
        );
        if (!isFree) {
          const [y, m, d] = date.split('-').map(Number);
          const targetDateObj = new Date(y, m - 1, d);
          const dayOfWeek = targetDateObj.getDay();
          if (assignedStaff.offDays && Array.isArray(assignedStaff.offDays) && assignedStaff.offDays.includes(dayOfWeek)) {
            return res.status(409).json({
              error: `Seçtiğiniz usta (${assignedStaff.name}) ${date} tarihinde haftalık izindedir. Lütfen başka bir gün veya usta seçiniz.`,
            });
          }
          return res.status(409).json({
            error: `Seçtiğiniz usta (${assignedStaff.name}) ${timeSlot} saatinde doludur, mesai dışındadır veya moladadır. Lütfen başka bir saat seçiniz.`,
          });
        }
      } else {
        // "Fark etmez" veya "auto": Bu hizmeti yapabilen VE bu saatte müsait olan ustayı bul
        const capableStaff = allStaff.filter((s) =>
          !srv.allowedStaffIds || srv.allowedStaffIds.length === 0 || srv.allowedStaffIds.includes(s.id)
        );
        const freeCapableStaff = capableStaff.filter((s) => {
          const customDur = s.customPricing?.[srv.id]?.duration;
          const dur = (typeof customDur === 'number' && customDur > 0) ? customDur : (srv.durationMinutes || 30);
          return isStaffAvailable(s.id, date, currentStartMinutes, currentStartMinutes + dur, activeAppointments, timeBlocks, s);
        });

        if (freeCapableStaff.length === 0) {
          return res.status(409).json({
            error: `Seçtiğiniz ${timeSlot} saatinde bu hizmet için müsait usta bulunmuyor. Lütfen başka bir saat seçiniz.`,
          });
        }
        // Adil randevu dağılımı: Müsait olan ustalar arasından seç
        assignedStaff = freeCapableStaff[0];
      }

      // Usta bazlı dinamik fiyat ve süre (customPricing)
      const customP = assignedStaff?.customPricing?.[srv.id];
      const stepDuration = (customP && typeof customP.duration === 'number' && customP.duration > 0)
        ? customP.duration
        : (srv.durationMinutes || 30);
      const stepPrice = (customP && typeof customP.price === 'number')
        ? customP.price
        : srv.price;
      const stepEndMinutes = currentStartMinutes + stepDuration;

      const stName = assignedStaff ? assignedStaff.name : 'Usta';
      const stId = assignedStaff ? assignedStaff.id : '';

      steps.push({
        serviceId: srv.id,
        serviceName: srv.name,
        staffId: stId,
        staffName: stName,
        durationMinutes: stepDuration,
        startTime: minutesToTime(currentStartMinutes),
        endTime: minutesToTime(stepEndMinutes),
        price: stepPrice,
      });

      totalPrice += stepPrice;
      currentStartMinutes = stepEndMinutes;
    }

    if (steps.length === 1) {
      primaryStaffName = steps[0].staffName;
      primaryStaffId = steps[0].staffId;
    } else {
      primaryStaffName = steps.map((st) => `${st.serviceName}: ${st.staffName}`).join(' | ');
    }

    const calculatedTotalDuration = currentStartMinutes - requestedStartMin;
    const endTime = minutesToTime(requestedStartMin + calculatedTotalDuration);

    // Kampanyalı Slotlar (Ölü Saat Doldurucu Kontrolü)
    const discountSlots = settings.discountSlots || [];
    const matchingDiscount = discountSlots.find((d) => {
      if (d.active === false) return false;
      const matchDay = d.dayOfWeek === -1 || d.dayOfWeek === dayOfWeek;
      if (!matchDay) return false;
      const dStart = timeToMinutes(d.startTime);
      const dEnd = timeToMinutes(d.endTime);
      return requestedStartMin >= dStart && requestedStartMin < dEnd;
    });

    let finalPrice = totalPrice;
    let discountAmount = 0;
    let originalPrice = totalPrice;
    let discountNote = '';

    if (matchingDiscount && matchingDiscount.discountPercent > 0) {
      discountAmount = Math.round((totalPrice * matchingDiscount.discountPercent) / 100);
      finalPrice = Math.max(0, totalPrice - discountAmount);
      discountNote = matchingDiscount.label || `%${matchingDiscount.discountPercent} İndirimli Slot`;
    }

    const newAppointment: Appointment = {
      id: `apt_pub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerName: customerName.trim(),
      phone: cleanPhone,
      email: email?.trim() || '',
      staffId: primaryStaffId,
      staffName: primaryStaffName,
      serviceName: selectedServices.map((s) => s.name).join(' + '),
      price: finalPrice,
      originalPrice: discountAmount > 0 ? originalPrice : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      discountNote: discountAmount > 0 ? discountNote : undefined,
      appointmentDate: date,
      timeSlot,
      durationMinutes: calculatedTotalDuration,
      status: 'bekliyor',
      notes: notes?.trim() || '',
      isOnlineBooking: true,
      kvkkApproved: true,
      allowWhatsApp: allowWhatsApp !== false,
      steps,
      createdAt: now.toISOString(),
    };

    if (!shopState.appointments) shopState.appointments = [];
    shopState.appointments.unshift(newAppointment);

    persistShopState(account.id, shopState);

    // Canlı WebSocket bildirimi (Dükkan sahibi paneline anında düşer ve çan çalar)
    try {
      broadcastToAccount(account.id, { type: 'APPOINTMENT_UPDATED', payload: newAppointment });
    } catch {}

    const storeTitle = shopState.shopProfile?.storeName || account.shopName;
    const whatsappMessage = encodeURIComponent(
      `Merhaba ${storeTitle}, ${date} saat ${timeSlot} için "${newAppointment.serviceName}" randevumu oluşturdum. Bilgilerinize sunarım. Ad Soyad: ${newAppointment.customerName}`
    );
    const shopPhone = normalizePhone(shopState.shopProfile?.phone || account.phone);
    const cleanShopPhone = shopPhone ? shopPhone.replace(/^0/, '') : '';
    const whatsappUrl = cleanShopPhone ? `https://wa.me/90${cleanShopPhone}?text=${whatsappMessage}` : undefined;

    res.json({
      success: true,
      appointment: newAppointment,
      whatsappUrl,
      endTime,
      summary: {
        date,
        timeSlot,
        endTime,
        services: steps.map((st) => ({ name: st.serviceName, price: st.price, duration: st.durationMinutes })),
        totalPrice: finalPrice,
        originalPrice: discountAmount > 0 ? originalPrice : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        discountNote: discountAmount > 0 ? discountNote : undefined,
        totalDuration: calculatedTotalDuration,
        staff: primaryStaffName,
      },
    });
  });

  // 4. Müşteri Yorum & Yıldız Değerlendirmesi Ekleme (Kolay Randevu Modülü)
  app.post('/api/public/barber/:identifier/reviews', publicActionRateLimit, (req: Request, res: Response) => {
    const { shopState, account } = resolveBarberShop(req.params.identifier);
    if (!shopState || !account) {
      return res.status(404).json({ error: 'İşletme bulunamadı.' });
    }

    const { customerName, phone, rating, comment, staffId, staffName, appointmentId } = req.body;
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Lütfen 1 ile 5 arasında bir puan veriniz.' });
    }
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: 'Lütfen adınızı giriniz.' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Lütfen deneyiminizle ilgili bir yorum yazınız.' });
    }

    const newReview: BarberReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      appointmentId: appointmentId || undefined,
      customerName: customerName.trim(),
      phone: phone ? normalizePhone(phone) : undefined,
      staffId: staffId || undefined,
      staffName: staffName || undefined,
      rating: numRating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      approved: true,
    };

    if (!shopState.barberReviews) shopState.barberReviews = [];
    shopState.barberReviews.unshift(newReview);

    if (appointmentId && shopState.appointments) {
      const apt = shopState.appointments.find((a) => a.id === appointmentId);
      if (apt) apt.hasReview = true;
    }

    persistShopState(account.id, shopState);

    try {
      broadcastToAccount(account.id, { type: 'STATE_RESET', payload: shopState });
    } catch {}

    res.json({
      success: true,
      review: newReview,
      message: 'Değerlendirmeniz başarıyla kaydedildi, teşekkür ederiz!',
    });
  });

  // 5. Müşteri Yorumlarını Listeleme
  app.get('/api/public/barber/:identifier/reviews', (req: Request, res: Response) => {
    const { shopState, account } = resolveBarberShop(req.params.identifier);
    if (!shopState) {
      return res.status(404).json({ error: 'İşletme bulunamadı.' });
    }

    const isDemo = Boolean(account?.id && account.id.includes('demo'));
    const reviews = (shopState.barberReviews && shopState.barberReviews.length > 0)
      ? shopState.barberReviews.filter((r) => r.approved !== false)
      : (isDemo ? demoBarberReviews : []);
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? Number((totalRating / reviews.length).toFixed(1)) : 5.0;

    res.json({
      reviews,
      count: reviews.length,
      averageRating: avgRating,
    });
  });

  // 6. "Randevum Ne Durumda?" Müşteri Randevu Sorgulama
  app.get('/api/public/barber/:identifier/my-appointments', publicActionRateLimit, (req: Request, res: Response) => {
    const { shopState } = resolveBarberShop(req.params.identifier);
    if (!shopState) {
      return res.status(404).json({ error: 'İşletme bulunamadı.' });
    }

    const rawPhone = String(req.query.phone || '');
    const cleanPhone = normalizePhone(rawPhone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX).' });
    }

    const settings = shopState.barberSettings || defaultBarberSettings;
    const cancelHoursLimit = settings.allowCancellationHoursBefore ?? 2;
    const now = new Date();

    const userAppointments = (shopState.appointments || [])
      .filter((a) => normalizePhone(a.phone) === cleanPhone)
      .sort((a, b) => (b.appointmentDate + b.timeSlot).localeCompare(a.appointmentDate + a.timeSlot))
      .slice(0, 15)
      .map((a) => {
        let canCancel = false;
        let cancelReasonNotice = '';

        if (a.status === 'bekliyor' || a.status === 'onayli') {
          const aptDateTime = new Date(`${a.appointmentDate}T${a.timeSlot}:00`);
          const hoursRemaining = (aptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          if (hoursRemaining >= cancelHoursLimit) {
            canCancel = true;
          } else if (hoursRemaining < 0) {
            cancelReasonNotice = 'Randevu saati geçmiştir.';
          } else {
            cancelReasonNotice = `Randevuya ${cancelHoursLimit} saatten az kaldığı için online iptal edilemez. Lütfen salonu arayınız.`;
          }
        } else {
          cancelReasonNotice = `Randevu durumu "${a.status}" olduğu için iptal edilemez.`;
        }

        return {
          id: a.id,
          customerName: maskCustomerName(a.customerName),
          phone: maskPhoneNumber(a.phone),
          appointmentDate: a.appointmentDate,
          timeSlot: a.timeSlot,
          durationMinutes: a.durationMinutes,
          serviceName: a.serviceName,
          staffName: a.staffName,
          price: a.price,
          originalPrice: a.originalPrice,
          discountAmount: a.discountAmount,
          discountNote: a.discountNote,
          status: a.status,
          canCancel,
          cancelReasonNotice,
          hasReview: Boolean(a.hasReview),
          createdAt: a.createdAt,
        };
      });

    res.json({
      success: true,
      appointments: userAppointments,
    });
  });

  // 7. Müşteri Randevu İptali (Zaman Kısıtlamalı ve Güvenli)
  app.post('/api/public/barber/:identifier/cancel-booking', publicActionRateLimit, (req: Request, res: Response) => {
    const { shopState, account } = resolveBarberShop(req.params.identifier);
    if (!shopState || !account) {
      return res.status(404).json({ error: 'İşletme bulunamadı.' });
    }

    const { appointmentId, phone, reason } = req.body;
    if (!appointmentId || !phone) {
      return res.status(400).json({ error: 'Randevu bilgisi ve telefon numarası zorunludur.' });
    }

    const cleanPhone = normalizePhone(phone);
    const apt = (shopState.appointments || []).find((a) => a.id === appointmentId);
    if (!apt) {
      return res.status(404).json({ error: 'Randevu bulunamadı.' });
    }

    if (normalizePhone(apt.phone) !== cleanPhone) {
      return res.status(403).json({ error: 'Bu randevuyu iptal etme yetkiniz bulunmuyor (Telefon uyuşmuyor).' });
    }

    if (apt.status === 'iptal') {
      return res.status(400).json({ error: 'Bu randevu zaten iptal edilmiştir.' });
    }

    const settings = shopState.barberSettings || defaultBarberSettings;
    const cancelHoursLimit = settings.allowCancellationHoursBefore ?? 2;
    const aptDateTime = new Date(`${apt.appointmentDate}T${apt.timeSlot}:00`);
    const hoursRemaining = (aptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursRemaining < cancelHoursLimit && hoursRemaining >= 0) {
      return res.status(400).json({
        error: `Randevuya ${cancelHoursLimit} saatten az kaldığı için sistemden iptal edilemez. Lütfen doğrudan salon ile iletişime geçiniz.`,
      });
    }

    apt.status = 'iptal';
    apt.notes = `${apt.notes ? apt.notes + ' | ' : ''}Müşteri iptal etti${reason ? ': ' + reason : ''}`;

    persistShopState(account.id, shopState);

    try {
      broadcastToAccount(account.id, { type: 'APPOINTMENT_UPDATED', payload: apt });
    } catch {}

    res.json({
      success: true,
      message: 'Randevunuz başarıyla iptal edildi.',
      appointment: apt,
    });
  });
}

// ==========================================
// YÖNETİCİ KORUMALI BERBER API (PANEL İÇİN)
// ==========================================
export function registerAppointmentRoutes(app: Express): void {
  // 1. Randevuları Listele
  app.get('/api/appointments', (_req, res) => {
    res.json({ appointments: S().appointments || [] });
  });

  // 2. Berber Tam Veri Seti (Personeller, Hizmetler, Mola Blokları, Paketler, Ayarlar, Yorumlar)
  app.get('/api/barber/full-data', (_req, res) => {
    const st = S();
    res.json({
      staff: st.barberStaff || defaultBarberStaff,
      services: st.barberServices || defaultBarberServices,
      timeBlocks: st.barberTimeBlocks || [],
      packages: st.customerPackages || [],
      settings: st.barberSettings || defaultBarberSettings,
      appointments: st.appointments || [],
      reviews: st.barberReviews || [],
    });
  });

  // 3. Randevu Ekle / Güncelle (Tekrarlayan Seri Desteğiyle)
  app.post('/api/appointments', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.customerName || !data.customerName.trim()) {
      return res.status(400).json({ error: 'Müşteri adı zorunludur.' });
    }
    if (!S().appointments) S().appointments = [];

    const st = S();
    const staffList: BarberStaff[] = st.barberStaff && st.barberStaff.length > 0 ? st.barberStaff : defaultBarberStaff;
    const timeBlocks: BarberTimeBlock[] = st.barberTimeBlocks || [];
    const settings: BarberSalonSettings = st.barberSettings || defaultBarberSettings;

    const existingIdx = data.id ? st.appointments.findIndex((a) => a.id === data.id) : -1;
    if (data.id && existingIdx === -1) {
      return res.status(404).json({ error: 'Randevu bulunamadı.' });
    }

    const aptDate = data.appointmentDate || (existingIdx !== -1 ? st.appointments[existingIdx].appointmentDate : localDay()) || localDay();
    const aptTime = data.timeSlot || (existingIdx !== -1 ? st.appointments[existingIdx].timeSlot : '10:00') || '10:00';
    const aptDur = Number(data.durationMinutes) || (existingIdx !== -1 ? st.appointments[existingIdx].durationMinutes : 30) || 30;
    const aptStaffId = (data.staffId !== undefined) ? data.staffId : (existingIdx !== -1 ? st.appointments[existingIdx].staffId : '') || '';

    const [ay, am, ad] = aptDate.split('-').map(Number);
    const aptDateObj = new Date(ay, am - 1, ad);
    const dayOfWeek = aptDateObj.getDay();

    // 1. Salon Kapalı Gün Kontrolü
    if (settings.closedDays && settings.closedDays.includes(dayOfWeek)) {
      return res.status(400).json({
        error: `Seçilen tarihte (${aptDate}) salon kapalıdır (${settings.closedReason || 'Kapalı gün'}).`,
        code: 'SALON_CLOSED',
      });
    }

    // 2. Salon Çalışma Saatleri Kontrolü
    const startMin = timeToMinutes(aptTime);
    const endMin = startMin + aptDur;
    const openMin = timeToMinutes(settings.openHour || settings.openingTime || '09:00');
    const closeMin = timeToMinutes(settings.closeHour || settings.closingTime || '21:00');
    if (startMin < openMin || endMin > closeMin) {
      return res.status(400).json({
        error: `Randevu saati salon çalışma saatleri (${settings.openHour || '09:00'} - ${settings.closeHour || '21:00'}) dışında kalmaktadır.`,
        code: 'OUT_OF_HOURS',
      });
    }

    // 3. Personel Çakışma, İzin ve Mola Kontrolü
    if (aptStaffId && aptStaffId !== 'auto' && aptStaffId !== 'fark_etmez' && aptStaffId !== 'all') {
      const targetStaff = staffList.find((s) => s.id === aptStaffId);
      const isFree = isStaffAvailable(
        aptStaffId,
        aptDate,
        startMin,
        endMin,
        st.appointments,
        timeBlocks,
        targetStaff,
        data.id
      );
      if (!isFree) {
        if (targetStaff?.offDays && targetStaff.offDays.includes(dayOfWeek)) {
          return res.status(409).json({
            error: `Seçtiğiniz personel (${targetStaff.name}) ${aptDate} tarihinde haftalık izindedir.`,
            code: 'STAFF_OFF_DAY',
          });
        }
        return res.status(409).json({
          error: `Seçtiğiniz personel (${targetStaff?.name || 'Usta'}) ${aptTime} saatinde doludur, mesai dışındadır veya moladadır.`,
          code: 'SLOT_CONFLICT',
        });
      }
    } else {
      // Genel salon kapatma kontrolü
      const hasGeneralBlock = timeBlocks.some((b) => {
        if (b.date !== aptDate) return false;
        if (b.staffId && b.staffId !== 'all') return false;
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return startMin < bEnd && endMin > bStart;
      });
      if (hasGeneralBlock) {
        return res.status(409).json({
          error: `Seçilen ${aptTime} saatinde salon kapatılmıştır / genel mola bulunmaktadır.`,
          code: 'TIMEBLOCK_CONFLICT',
        });
      }
    }

    const now = new Date();

    if (data.id) {
      const idx = existingIdx;
      if (data.phone) {
        const rawP = String(data.phone || '');
        if (!isValidTurkishPhone(rawP)) {
          return res.status(400).json({ error: 'Geçersiz telefon numarası. Lütfen 05XX XXX XX XX formatında geçerli bir Türkiye GSM numarası giriniz.' });
        }
        data.phone = normalizePhone(rawP);
      }
      const updated: Appointment = {
        ...S().appointments[idx],
        ...data,
      };
      S().appointments[idx] = updated;
      saveState();
      broadcast({ type: 'APPOINTMENT_UPDATED', payload: updated });
      return res.json({ success: true, appointment: updated });
    }

    // Yeni randevu
    let aptPhone = '';
    if (data.phone) {
      const rawP = String(data.phone || '');
      if (!isValidTurkishPhone(rawP)) {
        return res.status(400).json({ error: 'Geçersiz randevu telefon numarası. Lütfen 05XX XXX XX XX formatında geçerli bir Türkiye GSM numarası giriniz (harf veya sahte numara kabul edilmez).' });
      }
      aptPhone = normalizePhone(rawP);
    }

    const baseApt: Appointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      customerName: data.customerName.trim(),
      phone: aptPhone,
      email: data.email?.trim() || '',
      staffId: data.staffId || '',
      staffName: data.staffName?.trim() || 'Usta',
      serviceName: data.serviceName?.trim() || 'Saç Kesimi',
      price: Number(data.price) || 350,
      appointmentDate: data.appointmentDate || localDay(),
      timeSlot: data.timeSlot || '10:00',
      durationMinutes: Number(data.durationMinutes) || 30,
      status: data.status || 'bekliyor',
      notes: data.notes?.trim() || '',
      packageSession: data.packageSession,
      recurring: data.recurring,
      steps: data.steps || [],
      createdAt: now.toISOString(),
    };

    const createdList: Appointment[] = [baseApt];

    // Tekrarlayan Seri (Recurring): örn haftalık 4 seans
    if (data.recurring && data.recurring.count && data.recurring.count > 1) {
      const count = Math.min(Number(data.recurring.count), 12);
      const intervalDays = data.recurring.frequency === 'biweekly' ? 14 : data.recurring.frequency === 'monthly' ? 28 : 7;
      let currentDateObj = new Date(baseApt.appointmentDate);

      for (let i = 1; i < count; i++) {
        currentDateObj.setDate(currentDateObj.getDate() + intervalDays);
        const recurringDateStr = currentDateObj.toISOString().split('T')[0];
        const [ry, rm, rd] = recurringDateStr.split('-').map(Number);
        const rDayOfWeek = new Date(ry, rm - 1, rd).getDay();

        // Salon kapalı günleri atla
        if (settings.closedDays && settings.closedDays.includes(rDayOfWeek)) {
          continue;
        }

        // Personel dolu veya izinliyse çakışan tekrarlayan seansı atla
        if (baseApt.staffId && baseApt.staffId !== 'auto' && baseApt.staffId !== 'fark_etmez') {
          const targetStaff = staffList.find((s) => s.id === baseApt.staffId);
          const isFree = isStaffAvailable(
            baseApt.staffId,
            recurringDateStr,
            startMin,
            endMin,
            st.appointments,
            timeBlocks,
            targetStaff
          );
          if (!isFree) continue;
        }

        const recApt: Appointment = {
          ...baseApt,
          id: `apt_rec_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
          appointmentDate: recurringDateStr,
          status: 'onayli',
          createdAt: new Date().toISOString(),
        };
        createdList.push(recApt);
      }
    }

    for (const apt of createdList) {
      S().appointments.unshift(apt);
      broadcast({ type: 'APPOINTMENT_UPDATED', payload: apt });
    }

    saveState();
    res.json({ success: true, appointments: createdList, appointment: baseApt });
  });

  // 4. Randevu Durumu Güncelle (Bekliyor, Onaylı, Koltukta, Tamamlandı, Gelmedi, İptal, Arşiv)
  const handleStatusUpdate = (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!S().appointments) S().appointments = [];
    const apt = S().appointments.find((a) => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Randevu bulunamadı.' });

    apt.status = status;
    saveState();
    broadcast({ type: 'APPOINTMENT_UPDATED', payload: apt });
    res.json({ success: true, appointment: apt });
  };

  app.post('/api/appointments/:id/status', handleStatusUpdate);
  app.patch('/api/appointments/:id/status', handleStatusUpdate);

  // 5. Fark Etmez / Otomatik Gelen Randevuya Usta Ata
  app.post('/api/appointments/:id/assign-staff', (req: Request, res: Response) => {
    const { id } = req.params;
    const { staffId, staffName } = req.body;
    if (!S().appointments) S().appointments = [];
    const apt = S().appointments.find((a) => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Randevu bulunamadı.' });

    if (staffId && staffId !== 'auto' && staffId !== 'fark_etmez') {
      const st = S();
      const staffList: BarberStaff[] = st.barberStaff && st.barberStaff.length > 0 ? st.barberStaff : defaultBarberStaff;
      const targetStaff = staffList.find((s) => s.id === staffId);
      const startMin = timeToMinutes(apt.timeSlot);
      const endMin = startMin + (apt.durationMinutes || 30);
      const isFree = isStaffAvailable(
        staffId,
        apt.appointmentDate,
        startMin,
        endMin,
        st.appointments,
        st.barberTimeBlocks || [],
        targetStaff,
        apt.id
      );
      if (!isFree) {
        return res.status(409).json({
          error: `Atanmak istenen personel (${staffName || targetStaff?.name || 'Usta'}) ${apt.timeSlot} saatinde doludur, izinlidir veya moladadır.`,
          code: 'STAFF_BUSY',
        });
      }
    }

    apt.staffId = staffId;
    apt.staffName = staffName;
    if (apt.status === 'bekliyor') {
      apt.status = 'onayli';
    }
    saveState();
    broadcast({ type: 'APPOINTMENT_UPDATED', payload: apt });
    res.json({ success: true, appointment: apt });
  });

  // 6. Satır İçi Not Güncelleme
  app.post('/api/appointments/:id/notes', (req: Request, res: Response) => {
    const { id } = req.params;
    const { notes } = req.body;
    if (!S().appointments) S().appointments = [];
    const apt = S().appointments.find((a) => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Randevu bulunamadı.' });

    apt.notes = notes || '';
    saveState();
    broadcast({ type: 'APPOINTMENT_UPDATED', payload: apt });
    res.json({ success: true, appointment: apt });
  });

  // 7. Randevudan Adisyona / Tahsilata Dönüştür + Paket Seansı Düş
  app.post('/api/appointments/:id/complete', (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentMethod, packageId } = req.body;
    if (!S().appointments) S().appointments = [];
    const apt = S().appointments.find((a) => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Randevu bulunamadı.' });

    apt.status = 'tamamlandi';

    // Paket seansı düşme
    let remainingSessionsText = '';
    if (packageId || apt.packageSession) {
      if (!S().customerPackages) S().customerPackages = [];
      const pkg = (S().customerPackages || []).find((p) => p.id === (packageId || apt.packageSession?.packageId));
      if (pkg && pkg.remainingSessions > 0) {
        pkg.remainingSessions -= 1;
        remainingSessionsText = ` (Paketten düşüldü: ${pkg.remainingSessions}/${pkg.totalSessions} seans kaldı)`;
        apt.packageSession = {
          packageId: pkg.id,
          sessionIndex: pkg.totalSessions - pkg.remainingSessions,
          totalSessions: pkg.totalSessions,
        };
      }
    }

    // Otomatik Kasaya Tahsilat Ekle (Eğer paket dahilinde değilse veya ücretliyse)
    const now = new Date();
    const todayStr = S().businessDate || localDay();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const finalAmount = apt.packageSession ? 0 : apt.price;

    const transaction: Transaction = {
      id: `tx_apt_${Date.now()}`,
      customerId: '',
      customerName: apt.customerName,
      type: 'tahsilat',
      amount: finalAmount,
      paymentMethod: paymentMethod || 'nakit',
      description: `Kuaför/Berber Tahsilatı: ${apt.serviceName} (${apt.staffName})${remainingSessionsText}`,
      date: `${todayStr} ${timeStr}`,
      createdAt: now.toISOString(),
    };

    if (finalAmount > 0) {
      S().transactions.unshift(transaction);
    }

    saveState();

    const cash = calculateCashRegister();
    broadcast({ type: 'APPOINTMENT_UPDATED', payload: apt });
    if (finalAmount > 0) {
      broadcast({
        type: 'TRANSACTION_CREATED',
        payload: { transaction, cash },
      });
    }

    const shopSlug = S().shopProfile?.slug || slugify(S().shopProfile?.storeName || 'berber');
    const storeName = S().shopProfile?.storeName || 'Berber Salonumuz';
    const reviewUrl = `/berber/${shopSlug}?review=true&staffId=${encodeURIComponent(apt.staffId || '')}&staffName=${encodeURIComponent(apt.staffName || '')}&aptId=${apt.id}&customer=${encodeURIComponent(apt.customerName)}`;
    const reviewText = encodeURIComponent(
      `Merhaba ${apt.customerName}, ${storeName}'nda ${apt.staffName} tarafından aldığınız "${apt.serviceName}" hizmetimizi nasıl buldunuz? 1-5 arası yıldızla puanlayıp yorum yapmak için tıklayın: ${reviewUrl}`
    );
    const cleanCustomerPhone = normalizePhone(apt.phone || '').replace(/^0/, '');
    const whatsappReviewLink = cleanCustomerPhone ? `https://wa.me/90${cleanCustomerPhone}?text=${reviewText}` : undefined;

    res.json({
      success: true,
      appointment: apt,
      transaction,
      cash,
      whatsappReviewLink,
      reviewUrl,
      reviewText: decodeURIComponent(reviewText),
    });
  });

  // 8. Randevu Sil
  app.delete('/api/appointments/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!S().appointments) S().appointments = [];
    S().appointments = S().appointments.filter((a) => a.id !== id);
    saveState();
    broadcast({ type: 'APPOINTMENT_DELETED', payload: { id } });
    res.json({ success: true });
  });

  // 9. Berber Personel Yönetimi
  app.post('/api/barber/staff', (req: Request, res: Response) => {
    const { staff } = req.body;
    if (!Array.isArray(staff)) return res.status(400).json({ error: 'Geçersiz personel listesi.' });
    const limits = getTierLimits(S().shopProfile);
    if (staff.length > limits.maxStaffSeats) {
      return res.status(403).json({
        error: 'Çırak ve Usta paketlerinde tek koltuk (1 personel) takvimi kullanılabilir. Çoklu usta ve otomatik prim dağılımı için Patron VIP pakete geçin.',
        code: 'VIP_REQUIRED',
      });
    }
    S().barberStaff = staff;
    saveState();
    res.json({ success: true, staff: S().barberStaff });
  });

  // 10. Berber Hizmet Yönetimi (ve Paketler)
  app.post('/api/barber/services', (req: Request, res: Response) => {
    const { services } = req.body;
    if (!Array.isArray(services)) return res.status(400).json({ error: 'Geçersiz hizmet listesi.' });
    S().barberServices = services;
    saveState();
    res.json({ success: true, services: S().barberServices });
  });

  // 11. Mola / Saati Kapatma Blokları
  app.post('/api/barber/time-blocks', (req: Request, res: Response) => {
    const { date, startTime, endTime, staffId, reason } = req.body;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Tarih, başlangıç ve bitiş saatleri zorunludur.' });
    }
    if (!S().barberTimeBlocks) S().barberTimeBlocks = [];

    const newBlock: BarberTimeBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date,
      startTime,
      endTime,
      staffId: staffId || 'all',
      reason: reason || 'Mola / Özel Kapatma',
      createdAt: new Date().toISOString(),
    };

    S().barberTimeBlocks!.unshift(newBlock);
    saveState();
    broadcast({ type: 'BARBER_TIMEBLOCKS_UPDATED', payload: S().barberTimeBlocks || [] });
    res.json({ success: true, block: newBlock, timeBlocks: S().barberTimeBlocks });
  });

  app.delete('/api/barber/time-blocks/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!S().barberTimeBlocks) S().barberTimeBlocks = [];
    S().barberTimeBlocks = (S().barberTimeBlocks || []).filter((b) => b.id !== id);
    saveState();
    broadcast({ type: 'BARBER_TIMEBLOCKS_UPDATED', payload: S().barberTimeBlocks || [] });
    res.json({ success: true, timeBlocks: S().barberTimeBlocks });
  });

  // 12. Salon Ayarları
  app.post('/api/barber/settings', (req: Request, res: Response) => {
    const settings = req.body;
    S().barberSettings = {
      ...defaultBarberSettings,
      ...settings,
    };
    saveState();
    res.json({ success: true, settings: S().barberSettings });
  });

  // 13. Müşteri Paket Tanımlama
  app.post('/api/barber/packages', (req: Request, res: Response) => {
    const { customerName, phone, packageName, totalSessions, serviceName, price, expiryDate } = req.body;
    if (!customerName || !packageName || !totalSessions) {
      return res.status(400).json({ error: 'Paket bilgileri eksik.' });
    }
    let pkgPhone = '';
    if (phone) {
      const rawP = String(phone || '');
      if (!isValidTurkishPhone(rawP)) {
        return res.status(400).json({ error: 'Geçersiz telefon numarası. Lütfen 05XX XXX XX XX formatında geçerli bir Türkiye GSM numarası giriniz.' });
      }
      pkgPhone = normalizePhone(rawP);
    }
    if (!S().customerPackages) S().customerPackages = [];

    const newPkg: CustomerPackage = {
      id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      customerId: '',
      customerName: customerName.trim(),
      phone: pkgPhone,
      packageName: packageName.trim(),
      totalSessions: Number(totalSessions),
      remainingSessions: Number(totalSessions),
      serviceName: serviceName || 'Hizmet Paketi',
      price: Number(price) || 0,
      createdAt: new Date().toISOString(),
      expiryDate,
    };

    S().customerPackages!.unshift(newPkg);
    saveState();
    res.json({ success: true, package: newPkg, packages: S().customerPackages });
  });

  // 14. Berber Yorum Yönetimi (Silme / Listeleme)
  app.get('/api/barber/reviews', (_req, res) => {
    res.json({ reviews: S().barberReviews || [] });
  });

  app.delete('/api/barber/reviews/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!S().barberReviews) S().barberReviews = [];
    S().barberReviews = (S().barberReviews || []).filter((r) => r.id !== id);
    saveState();
    res.json({ success: true, reviews: S().barberReviews });
  });

  // 15. İndirimli Slotlar (Ölü Saat Kampanyaları) Yönetimi
  app.post('/api/barber/discount-slots', (req: Request, res: Response) => {
    const { slots } = req.body;
    if (!Array.isArray(slots)) return res.status(400).json({ error: 'Geçersiz indirimli slot listesi.' });
    if (!S().barberSettings) S().barberSettings = { ...defaultBarberSettings };
    S().barberSettings!.discountSlots = slots;
    saveState();
    res.json({ success: true, discountSlots: S().barberSettings!.discountSlots });
  });
}
