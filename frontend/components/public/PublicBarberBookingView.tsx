import React, { useState, useEffect, useMemo } from 'react';
import {
  Scissors,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Share2,
  CalendarPlus,
  ShieldCheck,
  Sparkles,
  Info,
  MapPin,
  Check,
  RefreshCw,
  Send,
  Star,
  Users,
} from 'lucide-react';
import type { BarberStaff, BarberService, BarberSalonSettings } from '../../../shared/types';

interface OccupiedSlot {
  date: string;
  timeSlot: string;
  durationMinutes: number;
  staffId: string;
  steps?: { staffId: string; startTime: string; endTime: string; durationMinutes: number }[];
}

interface TimeBlock {
  date: string;
  startTime: string;
  endTime: string;
  staffId: string;
  reason: string;
}

interface PublicBarberData {
  shop: {
    storeName: string;
    phone: string;
    cityDistrict: string;
    slogan: string;
    slug: string;
  };
  staff: BarberStaff[];
  services: BarberService[];
  settings: BarberSalonSettings;
  occupiedSlots: OccupiedSlot[];
  timeBlocks: TimeBlock[];
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(m: number): string {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export const PublicBarberBookingView: React.FC<{ identifier: string }> = ({ identifier }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicBarberData | null>(null);

  // 4 Adım: 1="Kim Yapsın & Hizmetler", 2="Tarih & Saat", 3="Müşteri Bilgileri", 4="Özet & Onay"
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedStaffId, setSelectedStaffId] = useState<string>('auto'); // 'auto' = fark etmez
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(''); // HH:MM

  // Müşteri Bilgileri
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [kvkkApproved, setKvkkApproved] = useState(false);
  const [allowWhatsApp, setAllowWhatsApp] = useState(true);

  // OTP
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpDemoHint, setOtpDemoHint] = useState<string | null>(null);

  // Başarılı Randevu Ekranı
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Veri Çekme
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public/barber/${encodeURIComponent(identifier)}`);
        if (!res.ok) {
          throw new Error('İşletme randevu takvimi yüklenemedi.');
        }
        const json = await res.json();
        if (isMounted) {
          setData(json);

          // İlk müsait günü seç
          const today = new Date();
          const closedDays = json.settings?.closedDays || [0];
          let candidate = new Date(today);
          for (let i = 0; i < 14; i++) {
            if (!closedDays.includes(candidate.getDay())) {
              setSelectedDate(candidate.toISOString().split('T')[0]);
              break;
            }
            candidate.setDate(candidate.getDate() + 1);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Bir hata oluştu.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [identifier]);

  // Seçilen Hizmetler ve Süre / Tutar Hesabı
  const selectedServices = useMemo(() => {
    if (!data) return [];
    return data.services.filter((s) => selectedServiceIds.includes(s.id));
  }, [data, selectedServiceIds]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (s.durationMinutes || s.duration || 30), 0);
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  // Seçilen hizmetlere göre atanabilecek ustalar (Filtreleme)
  // "Listede sadece o hizmeti yapan ustalar çıkar (manikür isteyene boyacı atanmaz)"
  const capableStaffList = useMemo(() => {
    if (!data) return [];
    if (selectedServiceIds.length === 0) return data.staff;

    return data.staff.filter((staff) => {
      // Bu personelin seçilen hizmetlerden en az birini yapabilmesi veya hizmetin kısıtlanmamış olması
      return selectedServices.every((srv) => {
        if (!srv.allowedStaffIds || srv.allowedStaffIds.length === 0) return true;
        return srv.allowedStaffIds.includes(staff.id);
      });
    });
  }, [data, selectedServiceIds, selectedServices]);

  // Hizmet seçimi toggle (en fazla 5)
  const toggleService = (srvId: string) => {
    if (selectedServiceIds.includes(srvId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== srvId));
    } else {
      if (selectedServiceIds.length >= 5) {
        alert('Tek seferde en fazla 5 hizmet seçebilirsiniz.');
        return;
      }
      setSelectedServiceIds([...selectedServiceIds, srvId]);
    }
  };

  // Tarih Seçenekleri (Gelecek 14 Günlük Takvim)
  const next14Days = useMemo(() => {
    if (!data) return [];
    const list: { dateStr: string; dayName: string; dayNum: number; monthName: string; isClosed: boolean; reason?: string }[] = [];
    const closedDays = data.settings?.closedDays || [0];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const isClosed = closedDays.includes(dayOfWeek);

      list.push({
        dateStr,
        dayName: i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : DAYS_TR[dayOfWeek],
        dayNum: d.getDate(),
        monthName: MONTHS_TR[d.getMonth()],
        isClosed,
        reason: isClosed ? data.settings?.closedReason || 'Salon Kapalı' : undefined,
      });
    }
    return list;
  }, [data]);

  // Seçilen Gün için Saat Izgarası ve Müsaitlik Hesabı
  const availableSlots = useMemo(() => {
    if (!data || !selectedDate) return [];
    const openH = data.settings?.openingTime || data.settings?.openHour || '09:00';
    const closeH = data.settings?.closingTime || data.settings?.closeHour || '21:00';
    const interval = data.settings?.slotIntervalMinutes || data.settings?.slotDuration || 15;

    const startMin = timeToMinutes(openH);
    const endMin = timeToMinutes(closeH);
    const neededDuration = Math.max(totalDuration, interval);

    // O günkü kapalı bloklar
    const dayBlocks = data.timeBlocks.filter((b) => b.date === selectedDate);
    // O günkü dolu randevular
    const dayAppointments = data.occupiedSlots.filter((a) => a.date === selectedDate);

    const slots: { time: string; available: boolean; reason?: string }[] = [];

    for (let m = startMin; m + neededDuration <= endMin; m += interval) {
      const slotTime = minutesToTime(m);
      const slotEndTime = minutesToTime(m + neededDuration);

      // Geçmiş saat kontrolü (Eğer seçilen gün bugünse)
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      if (selectedDate === todayStr) {
        const currentMinutesNow = now.getHours() * 60 + now.getMinutes();
        if (m <= currentMinutesNow + 15) {
          slots.push({ time: slotTime, available: false, reason: 'Geçmiş saat' });
          continue;
        }
      }

      // Mola / Saati Kapatma çakışması
      const isBlocked = dayBlocks.some((b) => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        const matchesStaff = !b.staffId || b.staffId === 'all' || selectedStaffId === 'auto' || b.staffId === selectedStaffId;
        return matchesStaff && m < bEnd && m + neededDuration > bStart;
      });

      if (isBlocked) {
        slots.push({ time: slotTime, available: false, reason: 'Mola / Kapalı' });
        continue;
      }

      // Randevu çakışması
      let isBusy = false;
      const isStaffBusy = (targetStaffId: string) => {
        return dayAppointments.some((a) => {
          if (Array.isArray(a.steps) && a.steps.length > 0) {
            return a.steps.some((st) => {
              if (st.staffId !== targetStaffId) return false;
              const stStart = timeToMinutes(st.startTime);
              const stEnd = timeToMinutes(st.endTime);
              return m < stEnd && m + neededDuration > stStart;
            });
          }
          if (a.staffId !== targetStaffId) return false;
          const aStart = timeToMinutes(a.timeSlot);
          const aEnd = aStart + (a.durationMinutes || 30);
          return m < aEnd && m + neededDuration > aStart;
        });
      };

      if (selectedStaffId !== 'auto') {
        // Belirli bir usta seçildiyse: o ustanın randevuları kontrol edilir
        isBusy = isStaffBusy(selectedStaffId);
      } else {
        // "Fark etmez" seçildiyse: Eğer salondaki TÜM yetkili ustalar o saatte doluysa slot kapalıdır
        const availableStaffCount = data.staff.filter((st) => !isStaffBusy(st.id)).length;
        isBusy = availableStaffCount === 0;
      }

      slots.push({
        time: slotTime,
        available: !isBusy,
        reason: isBusy ? 'Dolu' : undefined,
      });
    }

    return slots;
  }, [data, selectedDate, selectedStaffId, totalDuration]);

  // Otomatik boş saat atama
  useEffect(() => {
    if (availableSlots.length > 0 && (!selectedTimeSlot || !availableSlots.find((s) => s.time === selectedTimeSlot && s.available))) {
      const firstAvailable = availableSlots.find((s) => s.available);
      if (firstAvailable) {
        setSelectedTimeSlot(firstAvailable.time);
      }
    }
  }, [availableSlots, selectedTimeSlot]);

  // OTP Gönderimi
  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Lütfen geçerli bir telefon numarası giriniz (en az 10 hane).');
      return;
    }
    setOtpSending(true);
    try {
      const res = await fetch('/api/public/barber/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const resJson = await res.json();
      if (res.ok) {
        setOtpSent(true);
        if (resJson.demoCode) {
          setOtpDemoHint(resJson.demoCode);
          setOtpCode(resJson.demoCode); // Otomatik doldur (kolaylık)
        }
      } else {
        alert(resJson.error || 'SMS kodu gönderilemedi.');
      }
    } catch {
      alert('SMS sunucusuna bağlanılamadı.');
    } finally {
      setOtpSending(false);
    }
  };

  // Randevuyu Onayla ve Gönder
  const handleBookAppointment = async () => {
    if (!customerName.trim()) {
      alert('Lütfen adınızı ve soyadınızı giriniz.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Lütfen telefon numaranızı giriniz.');
      return;
    }
    if (!kvkkApproved) {
      alert('Lütfen KVKK onay kutusunu işaretleyiniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/public/barber/${encodeURIComponent(identifier)}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: cleanPhone,
          email: email.trim(),
          notes: notes.trim(),
          kvkkApproved: true,
          allowWhatsApp,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          serviceIds: selectedServiceIds,
          staffId: selectedStaffId,
          otpCode: otpCode || '1234',
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Randevu oluşturulamadı.');
      }

      setBookingSuccess(resJson);
    } catch (err: any) {
      alert(err.message || 'Randevu oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // .ICS Takvim Dosyası İndirme (Apple / Google / Outlook Takvim Uyumu)
  const downloadIcsFile = () => {
    if (!bookingSuccess || !bookingSuccess.appointment) return;
    const apt = bookingSuccess.appointment;
    const startIso = `${apt.appointmentDate.replace(/-/g, '')}T${apt.timeSlot.replace(':', '')}00`;
    const endMinutes = timeToMinutes(apt.timeSlot) + (apt.durationMinutes || 30);
    const endIso = `${apt.appointmentDate.replace(/-/g, '')}T${minutesToTime(endMinutes).replace(':', '')}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dukkanim Yanimda//Randevu Sistemi//TR',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:${data?.shop.storeName || 'Kuaför'} Randevusu (${apt.serviceName})`,
      `DESCRIPTION:Personel: ${apt.staffName}\\nHizmetler: ${apt.serviceName}\\nÜcret: ₺${apt.price}`,
      `LOCATION:${data?.shop.cityDistrict || 'Salon'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `randevu-${apt.appointmentDate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 animate-pulse">
          <Scissors className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
        <p className="text-sm font-bold text-stone-400">Salon Randevu Takvimi Yükleniyor...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-black mb-1">Randevu Sayfası Bulunamadı</h2>
        <p className="text-sm text-stone-400 max-w-sm mb-6">{error || 'Bu adrese ait aktif bir kuaför veya berber işletmesi bulunmuyor.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-black text-sm cursor-pointer hover:bg-amber-400"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  // ==========================================
  // BAŞARILI RANDEVU EKRANI
  // ==========================================
  if (bookingSuccess) {
    const apt = bookingSuccess.appointment;
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
              Randevunuz Alındı!
            </span>
            <h1 className="text-2xl font-black mt-3 text-white">{data.shop.storeName}</h1>
            <p className="text-xs text-stone-400 mt-1">Randevu detaylarınız kaydedildi ve işletmeye iletildi.</p>
          </div>

          {/* Özet Kartı */}
          <div className="bg-stone-950/70 border border-stone-800/80 rounded-2xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-stone-800 pb-2">
              <span className="text-stone-400">Tarih &amp; Saat:</span>
              <span className="font-bold text-amber-400">{apt.appointmentDate} • {apt.timeSlot}</span>
            </div>
            <div className="flex justify-between border-b border-stone-800 pb-2">
              <span className="text-stone-400">Hizmet(ler):</span>
              <span className="font-bold text-white text-right">{apt.serviceName}</span>
            </div>
            <div className="flex justify-between border-b border-stone-800 pb-2">
              <span className="text-stone-400">Usta / Personel:</span>
              <span className="font-bold text-white">{apt.staffName}</span>
            </div>
            <div className="flex justify-between border-b border-stone-800 pb-2">
              <span className="text-stone-400">Tahmini Süre:</span>
              <span className="font-bold text-stone-200">{apt.durationMinutes || 30} Dakika</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-black">
              <span className="text-stone-300">Toplam Tutar:</span>
              <span className="text-amber-400">₺{apt.price}</span>
            </div>
          </div>

          {/* Eylem Butonları */}
          <div className="space-y-3 pt-2">
            <button
              onClick={downloadIcsFile}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-500/20 active:scale-98"
            >
              <CalendarPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Takvimime Ekle (.ics İndir)</span>
            </button>

            {bookingSuccess.whatsappUrl && (
              <a
                href={bookingSuccess.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-600/20 active:scale-98"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp'tan Salona Yaz / Paylaş</span>
              </a>
            )}

            <button
              onClick={() => {
                setBookingSuccess(null);
                setCurrentStep(1);
                setSelectedServiceIds([]);
              }}
              className="w-full py-2.5 text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              Yeni Bir Randevu Al
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-stone-950">
      {/* Üst Bar */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800/80 px-4 py-3.5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-tight">
                {data.shop.storeName}
              </h1>
              <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {data.shop.cityDistrict || 'Şehir'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-stone-400">Adım {currentStep} / 4</span>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`h-1.5 rounded-full transition-all ${
                    stepNum === currentStep
                      ? 'w-6 bg-amber-500'
                      : stepNum < currentStep
                      ? 'w-3 bg-amber-500/60'
                      : 'w-3 bg-stone-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* ========================================================= */}
        {/* ADIM 1: "KİM YAPSIN?" & HİZMETLER (EN FAZLA 5 SEÇİM) */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in-50">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">1. Adım</span>
              <h2 className="text-2xl font-black text-white mt-1">Kim yapsın &amp; Hangi Hizmetler?</h2>
              <p className="text-xs text-stone-400 mt-1">
                İstediğiniz ustayı seçebilir veya &quot;Fark etmez&quot; diyerek en erken uygun koltuğu yakalayabilirsiniz.
              </p>
            </div>

            {/* Usta Seçimi */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black uppercase tracking-wider text-stone-300">
                Usta Tercihi
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedStaffId('auto')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedStaffId === 'auto'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {selectedStaffId === 'auto' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-black">Fark Etmez</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">En erken uygun usta</p>
                  </div>
                </button>

                {capableStaffList.map((st) => {
                  const isSelected = selectedStaffId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStaffId(st.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                          : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: st.color || '#3b82f6' }}
                        >
                          {st.name.charAt(0)}
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div>
                        <p className="text-xs font-black line-clamp-1">{st.name}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">{st.title || st.role || 'Usta'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hizmet Listesi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-stone-300">
                  Hizmetler (En fazla 5 adet)
                </label>
                <span className="text-[11px] font-bold text-amber-400">
                  {selectedServiceIds.length} / 5 seçildi
                </span>
              </div>

              <div className="space-y-2.5">
                {data.services.map((srv) => {
                  const isSelected = selectedServiceIds.includes(srv.id);
                  const duration = srv.durationMinutes || srv.duration || 30;

                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/5'
                          : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500 text-stone-950'
                              : 'border-stone-700 bg-stone-800/80'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{srv.name}</h3>
                            {srv.isBundle && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-950/80 text-purple-300 border border-purple-800/60">
                                Paket / Fırsat
                              </span>
                            )}
                          </div>
                          {srv.bundleItemNames && srv.bundleItemNames.length > 0 && (
                            <p className="text-[11px] text-stone-400 mt-1">
                              İçerik: {srv.bundleItemNames.join(', ')}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-500/80" /> {duration} dk
                            </span>
                            <span>•</span>
                            <span className="text-stone-300">{srv.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-amber-400">₺{srv.price}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ADIM 2: TARİH & SAAT SEÇİMİ (AYLIK TAKVİM & SLOTS) */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in-50">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">2. Adım</span>
              <h2 className="text-2xl font-black text-white mt-1">Tarih &amp; Saat Seçin</h2>
              <p className="text-xs text-stone-400 mt-1">
                Seçtiğiniz hizmetlerin toplam süresine ({totalDuration} dk) göre uygun saat dilimleri listelenmiştir.
              </p>
            </div>

            {/* 14 Günlük Yatay Tarih Şeridi */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black uppercase tracking-wider text-stone-300">
                Tarih Seçimi
              </label>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {next14Days.map((d) => {
                  const isSelected = selectedDate === d.dateStr;
                  if (d.isClosed) {
                    return (
                      <div
                        key={d.dateStr}
                        className="p-3 rounded-2xl bg-stone-900/40 border border-stone-800/40 opacity-50 text-center shrink-0 w-20 flex flex-col items-center justify-center cursor-not-allowed"
                        title={d.reason}
                      >
                        <span className="text-[10px] text-stone-500 font-bold uppercase">{d.dayName}</span>
                        <span className="text-lg font-black text-stone-500">{d.dayNum}</span>
                        <span className="text-[9px] text-rose-400 font-bold mt-1">Kapalı</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`p-3 rounded-2xl border text-center shrink-0 w-20 flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-lg shadow-amber-500/20 scale-102'
                          : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-stone-900' : 'text-stone-400'}`}>
                        {d.dayName}
                      </span>
                      <span className="text-xl font-black my-0.5">{d.dayNum}</span>
                      <span className={`text-[10px] font-medium ${isSelected ? 'text-stone-800' : 'text-stone-400'}`}>
                        {d.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Saat Dilimleri */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-stone-300">
                  Saat Dilimi ({totalDuration} dk slotu)
                </label>
                {selectedTimeSlot && (
                  <span className="text-xs font-bold text-amber-400">
                    Seçilen: {selectedTimeSlot}
                  </span>
                )}
              </div>

              {availableSlots.length === 0 ? (
                <div className="p-8 rounded-2xl bg-stone-900/60 border border-stone-800 text-center">
                  <p className="text-sm font-bold text-stone-400">Bu tarihte uygun saat dilimi bulunamadı.</p>
                  <p className="text-xs text-stone-500 mt-1">Lütfen başka bir gün seçiniz.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTimeSlot === slot.time;
                    if (!slot.available) {
                      return (
                        <div
                          key={slot.time}
                          className="py-2.5 px-2 rounded-xl bg-stone-900/40 border border-stone-800/40 text-stone-600 text-xs font-bold text-center cursor-not-allowed line-through"
                          title={slot.reason || 'Dolu'}
                        >
                          {slot.time}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-md shadow-amber-500/20'
                            : 'bg-stone-900 border-stone-800 text-stone-200 hover:border-amber-500/60 hover:text-white'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ADIM 3: MÜŞTERİ BİLGİLERİ & DOĞRULAMA (OTP) */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in-50">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">3. Adım</span>
              <h2 className="text-2xl font-black text-white mt-1">İletişim Bilgileri</h2>
              <p className="text-xs text-stone-400 mt-1">
                Randevu onayınız ve hatırlatma bildirimleri için bilgilerinizi giriniz.
              </p>
            </div>

            <div className="space-y-4 bg-stone-900/90 border border-stone-800 p-5 rounded-3xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  Adınız ve Soyadınız *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Örn: Burak Kaya"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-stone-700 bg-stone-950 text-white text-sm font-semibold focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  Telefon Numaranız *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-stone-700 bg-stone-950 text-white text-sm font-semibold focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  E-Posta Adresi (İsteğe Bağlı)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-stone-700 bg-stone-950 text-white text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  Özel Not / İstek (İsteğe Bağlı)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ustaya iletmek istediğiniz özel bir not veya saç kesim modeli..."
                  className="w-full p-3 rounded-xl border border-stone-700 bg-stone-950 text-white text-sm focus:outline-hidden focus:border-amber-500 resize-none"
                />
              </div>

              {/* Güvenlik: Tek Kullanımlık Kod (OTP) */}
              {data.settings.requireOtp && (
                <div className="pt-2 border-t border-stone-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                      SMS Doğrulama Kodu *
                    </label>
                    {!otpSent && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpSending}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        {otpSending ? 'Gönderiliyor...' : 'SMS Kodu Gönder'}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="1234"
                      className="w-32 text-center tracking-widest text-lg font-black py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white focus:outline-hidden focus:border-amber-500"
                    />
                    {otpSent && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Kod telefonunuza iletildi (Demo kodu: 1234)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* İzinler & KVKK */}
              <div className="space-y-3 pt-3 border-t border-stone-800 text-xs text-stone-300">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kvkkApproved}
                    onChange={(e) => setKvkkApproved(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-0 bg-stone-950 cursor-pointer"
                  />
                  <span>
                    Kişisel verilerimin randevu oluşturma ve salon bilgilendirmeleri kapsamında işlenmesine ilişkin KVKK aydınlatma metnini okudum, onaylıyorum. *
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowWhatsApp}
                    onChange={(e) => setAllowWhatsApp(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-0 bg-stone-950 cursor-pointer"
                  />
                  <span>
                    Randevu saatinden önce WhatsApp üzerinden hatırlatma mesajı ve konum bilgisi almayı kabul ediyorum.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ADIM 4: ÖZET & ONAYLA */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in-50">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">4. Adım</span>
              <h2 className="text-2xl font-black text-white mt-1">Randevu Özeti &amp; Onay</h2>
              <p className="text-xs text-stone-400 mt-1">
                Lütfen randevu detaylarınızı kontrol ediniz ve onaylayınız.
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white">{data.shop.storeName}</h3>
                  <p className="text-xs text-stone-400">{data.shop.cityDistrict}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400">Toplam Ücret</span>
                  <p className="text-xl font-black text-amber-400">₺{totalPrice}</p>
                </div>
              </div>

              {/* Detay Tablosu */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-stone-800/60">
                  <span className="text-stone-400">Tarih:</span>
                  <span className="font-bold text-white">{selectedDate}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-800/60">
                  <span className="text-stone-400">Randevu Saati:</span>
                  <span className="font-bold text-amber-400">{selectedTimeSlot} (Tahmini Bitiş: {minutesToTime(timeToMinutes(selectedTimeSlot) + totalDuration)})</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-800/60">
                  <span className="text-stone-400">Usta / Personel:</span>
                  <span className="font-bold text-white">
                    {selectedStaffId === 'auto'
                      ? 'Otomatik Atanacak (En Müsait Usta)'
                      : capableStaffList.find((s) => s.id === selectedStaffId)?.name || 'Usta'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-800/60">
                  <span className="text-stone-400">Müşteri:</span>
                  <span className="font-bold text-white">{customerName} ({phone})</span>
                </div>
                <div className="py-2">
                  <span className="text-stone-400 block mb-1.5 font-bold">Seçilen Hizmetler:</span>
                  <div className="space-y-1.5 pl-2 border-l-2 border-amber-500">
                    {selectedServices.map((srv) => (
                      <div key={srv.id} className="flex justify-between text-xs">
                        <span className="text-stone-200">{srv.name} ({srv.durationMinutes || 30} dk)</span>
                        <span className="font-bold text-amber-400">₺{srv.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bilgilendirme */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Randevunuz onaylandıktan sonra telefon takviminize tek tıkla ekleyebilir ve WhatsApp üzerinden salon ile anında iletişime geçebilirsiniz.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Viral Branding Footer */}
        <div className="py-6 text-center">
          <a
            href="https://dukkanimyanimda.com.tr"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-amber-400 text-[11px] font-bold border border-white/10 transition-colors"
          >
            <span>⚡ Dükkânım Yanımda ile oluşturuldu — Ücretsiz Randevu &amp; Kasa Sistemi</span>
          </a>
        </div>
      </main>

      {/* Alt Navigasyon & Butonlar */}
      <footer className="sticky bottom-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 p-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="px-4 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>
          ) : (
            <div className="text-xs text-stone-400 font-bold">
              Toplam: <span className="text-amber-400 text-sm">₺{totalPrice}</span> ({totalDuration} dk)
            </div>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              disabled={
                (currentStep === 1 && selectedServiceIds.length === 0) ||
                (currentStep === 2 && !selectedTimeSlot) ||
                (currentStep === 3 && (!customerName.trim() || phone.replace(/\D/g, '').length < 10 || !kvkkApproved))
              }
              onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
              className="ml-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-amber-500/20"
            >
              <span>Devam Et</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleBookAppointment}
              className="ml-auto px-7 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-500/25 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Randevu Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Randevuyu Onayla</span>
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
