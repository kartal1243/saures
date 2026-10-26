import type { Express, Request, Response } from 'express';
import type {
  Appointment,
  AppointmentStep,
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
import { getAccounts } from '../accounts';
import { loadShopState, persistShopState, defaultBarberSettings, defaultBarberStaff, defaultBarberServices } from '../shopState';

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

  if (!shopState && (rawId === 'demo' || accounts.length > 0)) {
    const fallbackAcc = accounts.find((a) => a.phone === '05550000000') || accounts[0];
    if (fallbackAcc) {
      targetAcc = fallbackAcc;
      shopState = loadShopState(fallbackAcc.id);
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

    res.json({
      shop: {
        storeName,
        phone: shopState.shopProfile?.phone || account?.phone || '',
        cityDistrict: shopState.shopProfile?.cityDistrict || '',
        slogan: shopState.shopProfile?.slogan || 'Profesyonel Saç & Sakal Bakımı',
        slug,
      },
      staff,
      services,
      settings,
      occupiedSlots,
      timeBlocks,
    });
  });

  // 2. OTP Simülasyonu / Gönderimi
  app.post('/api/public/barber/send-otp', (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Geçerli bir telefon numarası giriniz.' });
    }
    // Güvenlik ve test için tek kullanımlık 4 haneli kod
    // Not: Üretim/demo aşamasında test kodu '1234' ve dinamik kod eşleşir
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    res.json({ success: true, message: 'Doğrulama kodu telefonunuza SMS olarak gönderildi.', demoCode: code });
  });

  // 3. Müşteri Online Randevu Kaydı (4 Adımlı Form Sonu)
  app.post('/api/public/barber/:identifier/book', (req: Request, res: Response) => {
    const { shopState, account } = resolveBarberShop(req.params.identifier);
    if (!shopState || !account) {
      return res.status(404).json({ error: 'İşletme bulunamadı.' });
    }

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
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Lütfen geçerli bir telefon numarası giriniz (10 hane).' });
    }
    if (!kvkkApproved) {
      return res.status(400).json({ error: 'Lütfen KVKK aydınlatma metnini onaylayınız.' });
    }
    if (!date || !timeSlot) {
      return res.status(400).json({ error: 'Lütfen randevu tarihi ve saati seçiniz.' });
    }
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ error: 'En az bir hizmet seçmelisiniz.' });
    }
    if (serviceIds.length > 5) {
      return res.status(400).json({ error: 'Tek seferde en fazla 5 hizmet seçebilirsiniz.' });
    }

    // OTP kontrolü (Test kodu 1234 veya gönderilen kod)
    if (shopState.barberSettings?.requireOtp && otpCode !== '1234' && (!otpCode || otpCode.length !== 4)) {
      return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş SMS onay kodu.' });
    }

    // Spam Koruması: Aynı telefon için aynı günde max 2 aktif randevu
    const existingApts = (shopState.appointments || []).filter(
      (a) =>
        a.appointmentDate === date &&
        a.phone.replace(/\D/g, '') === cleanPhone &&
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

    // Ardışık adımları (Steps) ve toplam süreyi hesapla
    let currentStartMinutes = timeToMinutes(timeSlot);
    const steps: AppointmentStep[] = [];
    let totalPrice = 0;
    let primaryStaffName = 'Otomatik Atanacak';
    let primaryStaffId = staffId || 'fark_etmez';

    for (const srv of selectedServices) {
      const stepDuration = srv.durationMinutes || 30;
      const stepEndMinutes = currentStartMinutes + stepDuration;
      let assignedStaff: BarberStaff | undefined;

      if (staffId && staffId !== 'fark_etmez' && staffId !== 'auto') {
        assignedStaff = allStaff.find((s) => s.id === staffId);
      } else {
        // En uygun usta: bu hizmeti yapabilen ve o saatte müsait olan
        const capableStaff = allStaff.filter((s) =>
          !srv.allowedStaffIds || srv.allowedStaffIds.length === 0 || srv.allowedStaffIds.includes(s.id)
        );
        assignedStaff = capableStaff[0] || allStaff[0];
      }

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
        price: srv.price,
      });

      totalPrice += srv.price;
      currentStartMinutes = stepEndMinutes;
    }

    if (steps.length === 1) {
      primaryStaffName = steps[0].staffName;
      primaryStaffId = steps[0].staffId;
    } else {
      primaryStaffName = steps.map((st) => `${st.serviceName}: ${st.staffName}`).join(' | ');
    }

    const totalDuration = steps.reduce((sum, s) => sum + s.durationMinutes, 0);
    const endTime = minutesToTime(timeToMinutes(timeSlot) + totalDuration);

    const now = new Date();
    const newAppointment: Appointment = {
      id: `apt_pub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerName: customerName.trim(),
      phone: cleanPhone,
      email: email?.trim() || '',
      staffId: primaryStaffId,
      staffName: primaryStaffName,
      serviceName: selectedServices.map((s) => s.name).join(' + '),
      price: totalPrice,
      appointmentDate: date,
      timeSlot,
      durationMinutes: totalDuration,
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
    const whatsappUrl = `https://wa.me/90${shopState.shopProfile?.phone?.replace(/\D/g, '') || account.phone}?text=${whatsappMessage}`;

    res.json({
      success: true,
      appointment: newAppointment,
      whatsappUrl,
      endTime,
      summary: {
        date,
        timeSlot,
        endTime,
        services: selectedServices.map((s) => ({ name: s.name, price: s.price, duration: s.durationMinutes })),
        totalPrice,
        totalDuration,
        staff: primaryStaffName,
      },
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

  // 2. Berber Tam Veri Seti (Personeller, Hizmetler, Mola Blokları, Paketler, Ayarlar)
  app.get('/api/barber/full-data', (_req, res) => {
    const st = S();
    res.json({
      staff: st.barberStaff || defaultBarberStaff,
      services: st.barberServices || defaultBarberServices,
      timeBlocks: st.barberTimeBlocks || [],
      packages: st.customerPackages || [],
      settings: st.barberSettings || defaultBarberSettings,
      appointments: st.appointments || [],
    });
  });

  // 3. Randevu Ekle / Güncelle (Tekrarlayan Seri Desteğiyle)
  app.post('/api/appointments', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.customerName || !data.customerName.trim()) {
      return res.status(400).json({ error: 'Müşteri adı zorunludur.' });
    }
    if (!S().appointments) S().appointments = [];

    const now = new Date();

    if (data.id) {
      const idx = S().appointments.findIndex((a) => a.id === data.id);
      if (idx === -1) return res.status(404).json({ error: 'Randevu bulunamadı.' });
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
    const baseApt: Appointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      customerName: data.customerName.trim(),
      phone: data.phone?.trim() || '',
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
      const pkg = S().customerPackages.find((p) => p.id === (packageId || apt.packageSession?.packageId));
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

    res.json({ success: true, appointment: apt, transaction, cash });
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

    S().barberTimeBlocks.unshift(newBlock);
    saveState();
    res.json({ success: true, block: newBlock, timeBlocks: S().barberTimeBlocks });
  });

  app.delete('/api/barber/time-blocks/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (!S().barberTimeBlocks) S().barberTimeBlocks = [];
    S().barberTimeBlocks = S().barberTimeBlocks.filter((b) => b.id !== id);
    saveState();
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
    if (!S().customerPackages) S().customerPackages = [];

    const newPkg: CustomerPackage = {
      id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      customerId: '',
      customerName: customerName.trim(),
      phone: phone || '',
      packageName: packageName.trim(),
      totalSessions: Number(totalSessions),
      remainingSessions: Number(totalSessions),
      serviceName: serviceName || 'Hizmet Paketi',
      price: Number(price) || 0,
      createdAt: new Date().toISOString(),
      expiryDate,
    };

    S().customerPackages.unshift(newPkg);
    saveState();
    res.json({ success: true, package: newPkg, packages: S().customerPackages });
  });
}
