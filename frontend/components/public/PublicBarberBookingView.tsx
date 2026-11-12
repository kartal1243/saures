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
  Crown,
  Search,
  Flame,
  ShoppingBag,
  X,
  MessageSquare,
  ThumbsUp,
  Tag,
} from 'lucide-react';
import type { BarberStaff, BarberService, BarberSalonSettings, BarberReview, BarberDiscountSlot } from '../../../shared/types';

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
  reviews?: BarberReview[];
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

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

function formatTurkishPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  let d = digits;
  if (d.startsWith('90')) d = d.slice(2);
  if (!d.startsWith('0') && d.length > 0) d = '0' + d;
  d = d.slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  if (d.length <= 9) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
}

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
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');

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
  const [otpWhatsappLink, setOtpWhatsappLink] = useState<string | null>(null);

  // Başarılı Randevu Ekranı
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Yorum & Puan Vitrini & Modalı (Kolay Randevu Modülü)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewCustomerName, setReviewCustomerName] = useState('');
  const [reviewPhone, setReviewPhone] = useState('');
  const [reviewStaffId, setReviewStaffId] = useState('');
  const [reviewStaffName, setReviewStaffName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // "Randevum Ne Durumda?" Müşteri Sorgulama ve İptal Ekranı (Kolay Randevu Modülü)
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [queryPhone, setQueryPhone] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // URL'den Yorum İsteme veya Sorgulama Açma Kontrolü
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('review') === 'true' || urlParams.get('review')) {
        setIsReviewModalOpen(true);
        const stName = urlParams.get('staffName') || urlParams.get('staff');
        const stId = urlParams.get('staffId');
        const cust = urlParams.get('customer');
        if (stName) setReviewStaffName(stName);
        if (stId) setReviewStaffId(stId);
        if (cust) setReviewCustomerName(cust);
      }
      if (urlParams.get('sorgula') === 'true' || urlParams.get('sorgu')) {
        setIsMyBookingsOpen(true);
      }
    } catch {}
  }, []);

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

          // İlk müsait günü seç (Canlı Saat ve Kapanış Kontrolü)
          const now = new Date();
          const closedDays = json.settings?.closedDays || [0];
          const closeH = json.settings?.closingTime || json.settings?.closeHour || '21:00';
          const closeMin = timeToMinutes(closeH);
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          // Eğer kapanış saatine 30 dk veya daha az kaldıysa / dükkan kapandıysa, bugünlük randevu alınmaz -> doğrudan yarına geç
          const isTodayPastClosing = nowMinutes >= closeMin - 30;

          let candidate = new Date(now);
          if (isTodayPastClosing) {
            candidate.setDate(candidate.getDate() + 1);
          }

          for (let i = 0; i < 14; i++) {
            if (!closedDays.includes(candidate.getDay())) {
              setSelectedDate(toLocalDateStr(candidate));
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

  // Seçilen Personel
  const selectedStaff = useMemo(() => {
    if (!data || selectedStaffId === 'auto') return null;
    return data.staff.find((s) => s.id === selectedStaffId) || null;
  }, [data, selectedStaffId]);

  // Usta Bazlı Dinamik Fiyat ve Süre Yardımcıları (Kolay Randevu Modülü)
  const getServicePrice = (srv: BarberService): number => {
    if (selectedStaff?.customPricing?.[srv.id]?.price !== undefined) {
      return selectedStaff.customPricing[srv.id].price;
    }
    return srv.price;
  };

  const getServiceDuration = (srv: BarberService): number => {
    if (selectedStaff?.customPricing?.[srv.id]?.duration !== undefined) {
      return selectedStaff.customPricing[srv.id].duration;
    }
    return srv.durationMinutes || srv.duration || 30;
  };

  // Seçilen Hizmetler ve Süre / Tutar Hesabı
  const selectedServices = useMemo(() => {
    if (!data) return [];
    return data.services.filter((s) => selectedServiceIds.includes(s.id));
  }, [data, selectedServiceIds]);

  const rawTotalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + getServicePrice(s), 0);
  }, [selectedServices, selectedStaff]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + getServiceDuration(s), 0);
  }, [selectedServices, selectedStaff]);

  // Kampanyalı Slotlar (Ölü Saat Doldurucu) Kontrolü
  const activeDiscount = useMemo(() => {
    if (!data?.settings?.discountSlots || !selectedDate || !selectedTimeSlot) return null;
    const d = new Date(selectedDate);
    const dayOfWeek = d.getDay();
    return (
      data.settings.discountSlots.find((slot) => {
        if (slot.active === false) return false;
        const matchDay = slot.dayOfWeek === -1 || slot.dayOfWeek === dayOfWeek;
        if (!matchDay) return false;
        return selectedTimeSlot >= slot.startTime && selectedTimeSlot < slot.endTime;
      }) || null
    );
  }, [data?.settings?.discountSlots, selectedDate, selectedTimeSlot]);

  const discountAmount = useMemo(() => {
    if (!activeDiscount || !activeDiscount.discountPercent) return 0;
    return Math.round((rawTotalPrice * activeDiscount.discountPercent) / 100);
  }, [rawTotalPrice, activeDiscount]);

  const totalPrice = useMemo(() => {
    return Math.max(0, rawTotalPrice - discountAmount);
  }, [rawTotalPrice, discountAmount]);

  // Hizmet Paketleri & Kategori Filtreleme (Kolay Randevu Modülü)
  const categories = useMemo(() => {
    if (!data) return ['Tümü'];
    const cats = new Set<string>();
    cats.add('Tümü');
    const hasBundle = data.services.some((s) => s.isBundle || s.category === 'Paket' || s.category === 'VIP');
    if (hasBundle) cats.add('✨ Paketler & Kombinler');
    data.services.forEach((s) => {
      if (s.category && s.category !== 'Paket' && s.category !== 'VIP') {
        cats.add(s.category);
      }
    });
    return Array.from(cats);
  }, [data]);

  const filteredServices = useMemo(() => {
    if (!data) return [];
    if (selectedCategory === 'Tümü') return data.services;
    if (selectedCategory === '✨ Paketler & Kombinler') {
      return data.services.filter((s) => s.isBundle || s.category === 'Paket' || s.category === 'VIP');
    }
    return data.services.filter((s) => s.category === selectedCategory);
  }, [data, selectedCategory]);

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

  // Tarih Seçenekleri (Gelecek 14 Günlük Takvim - Canlı Kapanış Kontrollü)
  const next14Days = useMemo(() => {
    if (!data) return [];
    const list: { dateStr: string; dayName: string; dayNum: number; monthName: string; isClosed: boolean; reason?: string }[] = [];
    const closedDays = data.settings?.closedDays || [0];
    const now = new Date();
    const closeH = data.settings?.closingTime || data.settings?.closeHour || '21:00';
    const closeMin = timeToMinutes(closeH);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isTodayPastClosing = nowMinutes >= closeMin - 30;

    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dateStr = toLocalDateStr(d);
      const dayOfWeek = d.getDay();
      const isDayClosed = closedDays.includes(dayOfWeek);
      const isTodayClosed = i === 0 && isTodayPastClosing;

      list.push({
        dateStr,
        dayName: i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : DAYS_TR[dayOfWeek],
        dayNum: d.getDate(),
        monthName: MONTHS_TR[d.getMonth()],
        isClosed: isDayClosed || isTodayClosed,
        reason: isTodayClosed
          ? 'Bugünlük Kapanış Yapıldı (Yarına Randevu Alınız)'
          : isDayClosed
          ? (data.settings?.closedReason || 'Salon Kapalı')
          : undefined,
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
      const todayStr = toLocalDateStr(now);
      if (selectedDate === todayStr) {
        const currentMinutesNow = now.getHours() * 60 + now.getMinutes();
        if (m <= currentMinutesNow + 15) {
          slots.push({ time: slotTime, available: false, reason: 'Geçmiş saat' });
          continue;
        }
      }

      // 1. Genel Salon Kapatma / Mola kontrolü (Tüm salonu veya tüm personelleri kapsayan mola)
      const isSalonGeneralBlocked = dayBlocks.some((b) => {
        const matchesAll = !b.staffId || b.staffId === 'all';
        if (!matchesAll) return false;
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return m < bEnd && m + neededDuration > bStart;
      });

      if (isSalonGeneralBlocked) {
        slots.push({ time: slotTime, available: false, reason: 'Salon Kapalı / Mola' });
        continue;
      }

      // Personelin o gün ve saat aralığında müsait olup olmadığını kontrol eden yardımcı
      const isStaffMemberAvailable = (st: BarberStaff): boolean => {
        if (st.active === false) return false;

        // Haftalık izin günü kontrolü
        const [sy, sm, sd] = selectedDate.split('-').map(Number);
        const dayOfWeek = new Date(sy, sm - 1, sd).getDay();
        if (st.offDays && Array.isArray(st.offDays) && st.offDays.includes(dayOfWeek)) {
          return false;
        }

        // Şahsi mesai saatleri kontrolü
        const staffStartStr = st.workingHours?.start || st.workStart;
        const staffEndStr = st.workingHours?.end || st.workEnd;
        if (staffStartStr && staffEndStr) {
          const sMin = timeToMinutes(staffStartStr);
          const eMin = timeToMinutes(staffEndStr);
          if (m < sMin || m + neededDuration > eMin) {
            return false;
          }
        }

        // Personelin mola / kapatma saati çakışması
        const hasStaffBlock = dayBlocks.some((b) => {
          if (b.staffId !== st.id) return false;
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
          return m < bEnd && m + neededDuration > bStart;
        });
        if (hasStaffBlock) return false;

        // Personelin randevu çakışması
        const hasApt = dayAppointments.some((a) => {
          if (Array.isArray(a.steps) && a.steps.length > 0) {
            return a.steps.some((step) => {
              if (step.staffId !== st.id) return false;
              const stStart = timeToMinutes(step.startTime);
              const stEnd = timeToMinutes(step.endTime);
              return m < stEnd && m + neededDuration > stStart;
            });
          }
          if (a.staffId && a.staffId !== st.id) return false;
          const aStart = timeToMinutes(a.timeSlot);
          const aEnd = aStart + (a.durationMinutes || 30);
          return m < aEnd && m + neededDuration > aStart;
        });
        if (hasApt) return false;

        return true;
      };

      if (selectedStaffId !== 'auto') {
        // Belirli bir usta seçildiyse: sadece o ustanın müsaitliği kontrol edilir
        const targetStaff = data.staff.find((s) => s.id === selectedStaffId);
        const isFree = targetStaff ? isStaffMemberAvailable(targetStaff) : false;
        slots.push({
          time: slotTime,
          available: isFree,
          reason: !isFree ? 'Dolu / Mola' : undefined,
        });
      } else {
        // "Fark etmez / Otomatik" seçildiyse:
        // Hizmeti yapabilecek ustalar arasından en az 1 tanesi müsaitse slot açıktır.
        // Yalnızca o saatteki TÜM yetkili ustalar molada/doluysa slot kapatılır.
        const candidateStaff = capableStaffList.length > 0 ? capableStaffList : data.staff;
        const availableStaff = candidateStaff.filter((st) => isStaffMemberAvailable(st));
        const isSlotAvailable = availableStaff.length > 0;
        slots.push({
          time: slotTime,
          available: isSlotAvailable,
          reason: !isSlotAvailable ? 'Dolu' : undefined,
        });
      }
    }

    return slots;
  }, [data, selectedDate, selectedStaffId, totalDuration, capableStaffList]);

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
        body: JSON.stringify({ phone: cleanPhone, identifier }),
      });
      const resJson = await res.json();
      if (res.ok) {
        setOtpSent(true);
        if (resJson.whatsappLink) {
          setOtpWhatsappLink(resJson.whatsappLink);
        }
        if (resJson.demoCode) {
          setOtpDemoHint(resJson.demoCode);
          setOtpCode(resJson.demoCode); // Otomatik doldur
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
    if (data?.settings?.requireOtp && (!otpSent || otpCode.trim().length < 4)) {
      alert('Lütfen önce SMS doğrulama kodunu gönderip 4 haneli kodu giriniz.');
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
          otpCode: otpCode.trim(),
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

  // Yorum Gönderimi (Kolay Randevu Modülü)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewCustomerName.trim()) {
      alert('Lütfen adınızı giriniz.');
      return;
    }
    if (!reviewComment.trim()) {
      alert('Lütfen değerlendirmenizi yazınız.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/public/barber/${encodeURIComponent(identifier)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: reviewCustomerName.trim(),
          phone: reviewPhone.trim(),
          rating: reviewRating,
          comment: reviewComment.trim(),
          staffId: reviewStaffId || undefined,
          staffName: reviewStaffName || (data?.staff.find((s) => s.id === reviewStaffId)?.name) || undefined,
        }),
      });
      const resJson = await res.json();
      if (res.ok) {
        setReviewSuccessMsg('Değerlendirmeniz için teşekkür ederiz! ⭐ Yorumunuz kaydedildi.');
        if (data && resJson.review) {
          setData({
            ...data,
            reviews: [resJson.review, ...(data.reviews || [])],
          });
        }
        setTimeout(() => {
          setIsReviewModalOpen(false);
          setReviewSuccessMsg(null);
          setReviewComment('');
        }, 1500);
      } else {
        alert(resJson.error || 'Yorum kaydedilemedi.');
      }
    } catch {
      alert('Sunucuya bağlanılamadı.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Randevumu Sorgula (Kolay Randevu Modülü)
  const handleQueryAppointments = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanP = queryPhone.replace(/\D/g, '');
    if (cleanP.length < 10) {
      setQueryError('Lütfen en az 10 haneli geçerli telefon numaranızı giriniz (05XX XXX XX XX).');
      return;
    }
    setQueryError(null);
    setIsQuerying(true);
    try {
      const res = await fetch(`/api/public/barber/${encodeURIComponent(identifier)}/my-appointments?phone=${cleanP}`);
      const resJson = await res.json();
      if (res.ok) {
        setMyAppointments(resJson.appointments || []);
        if ((resJson.appointments || []).length === 0) {
          setQueryError('Bu telefon numarasına ait aktif veya geçmiş randevu bulunamadı.');
        }
      } else {
        setQueryError(resJson.error || 'Randevular sorgulanamadı.');
      }
    } catch {
      setQueryError('Sunucuya bağlanılamadı.');
    } finally {
      setIsQuerying(false);
    }
  };

  // Randevu İptali (Kolay Randevu Modülü)
  const handleCancelBooking = async (appointmentId: string) => {
    if (!confirm('Bu randevunuzu iptal etmek istediğinize emin misiniz?')) return;
    const cleanP = queryPhone.replace(/\D/g, '');
    setCancellingId(appointmentId);
    try {
      const res = await fetch(`/api/public/barber/${encodeURIComponent(identifier)}/cancel-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          phone: cleanP,
          reason: 'Müşteri sorgu ekranından iptal etti',
        }),
      });
      const resJson = await res.json();
      if (res.ok) {
        alert('Randevunuz başarıyla iptal edildi.');
        setMyAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: 'iptal', canCancel: false } : a))
        );
      } else {
        alert(resJson.error || 'İptal işlemi gerçekleştirilemedi.');
      }
    } catch {
      alert('İptal işlemi sırasında hata oluştu.');
    } finally {
      setCancellingId(null);
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

  // VIP Paketi Olmayan veya Kontenjanı Dolan İşletmeler İçin İletişim Ekranı
  if ((data as any).vipRequired) {
    const rawShopPhone = (data.shop.phone || '').replace(/\D/g, '');
    const cleanShopPhone = rawShopPhone.startsWith('90') ? rawShopPhone.slice(2) : rawShopPhone;
    const formattedPhone = cleanShopPhone.length >= 10 ? (cleanShopPhone.startsWith('0') ? cleanShopPhone : '0' + cleanShopPhone) : (data.shop.phone || '');
    const whatsappShopUrl = `https://wa.me/90${cleanShopPhone.replace(/^0/, '')}?text=${encodeURIComponent(
      `Merhaba ${data.shop.storeName}, online randevu kontenjanı dolduğu için doğrudan yazıyorum. Müsait bir gün ve saat için randevu alabilir miyim?`
    )}`;

    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-stone-900/95 border border-amber-500/30 rounded-3xl p-8 shadow-2xl space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Yoğun Talep · Kontenjan Dolu
            </span>
            <h2 className="text-2xl font-black text-white">{data.shop.storeName}</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Bu salonun bu ayki online randevu kapasitesi dolmuştur. Sıra beklemeden randevunuzu oluşturmak için salonu doğrudan arayabilir veya WhatsApp üzerinden yazabilirsiniz:
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {formattedPhone && (
              <a
                href={`tel:${formattedPhone}`}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Phone className="w-4 h-4 fill-stone-950" />
                <span>Salonu Hemen Ara ({formattedPhone})</span>
              </a>
            )}

            {cleanShopPhone && (
              <a
                href={whatsappShopUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp ile Hızlı Randevu İste</span>
              </a>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 text-left text-xs text-stone-400 space-y-1.5">
            <p className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>👑</span> İşletme Sahibi misiniz?
            </p>
            <p className="text-[11px] text-stone-400">
              Bu salon sizin işletmenizse, online randevu kontenjanınızı sınırsıza yükseltmek için Dükkânım Yanımda panelinizden VIP Pakete geçebilirsiniz.
            </p>
            <a
              href="/"
              className="inline-block text-[11px] font-bold text-amber-400 hover:underline pt-1"
            >
              Yönetim Paneline Giriş Yap →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // BAŞARILI RANDEVU EKRANI
  // ==========================================
  if (bookingSuccess) {
    const apt = bookingSuccess.appointment;
    const startIso = `${apt.appointmentDate.replace(/-/g, '')}T${apt.timeSlot.replace(':', '')}00`;
    const endMinutes = timeToMinutes(apt.timeSlot) + (apt.durationMinutes || 30);
    const endIso = `${apt.appointmentDate.replace(/-/g, '')}T${minutesToTime(endMinutes).replace(':', '')}00`;

    const shopLocation = [data?.shop.storeName, data?.shop.cityDistrict].filter(Boolean).join(', ');

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      (data?.shop.storeName || 'Kuaför') + ' Randevusu'
    )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(
      `Hizmetler: ${apt.serviceName}\nPersonel: ${apt.staffName}\nÜcret: ₺${apt.price}`
    )}&location=${encodeURIComponent(shopLocation)}`;

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      shopLocation || data?.shop.storeName || 'Kuaför'
    )}`;

    const friendShareUrl = `https://wa.me/?text=${encodeURIComponent(
      `Selam! Ben ${data?.shop.storeName} salonundan sıra beklemeden online randevumu aldım, sen de buradan gün ve saatini seçip kolayca randevu alabilirsin: ${window.location.origin}/r/${data?.shop.slug}`
    )}`;

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
          <div className="space-y-2.5 pt-2">
            {/* 1. Google Takvim (1 Tık) & .ics İndir */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-98"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Google Takvime Ekle</span>
              </a>

              <button
                onClick={downloadIcsFile}
                className="py-3 px-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Apple (.ics İndir)</span>
              </button>
            </div>

            {/* 2. WhatsApp'tan Salona Yaz */}
            {bookingSuccess.whatsappUrl && (
              <a
                href={bookingSuccess.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-600/20 active:scale-98"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp'tan Salona Randevuyu Bildir</span>
              </a>
            )}

            {/* 3. Haritada Gör & Arkadaşına Tavsiye Et */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Haritada Konum</span>
              </a>

              <a
                href={friendShareUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Arkadaşa Öner</span>
              </a>
            </div>

            <button
              onClick={() => {
                setBookingSuccess(null);
                setCurrentStep(1);
                setSelectedServiceIds([]);
              }}
              className="w-full py-2 text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
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

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMyBookingsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Randevumu</span>
              <span>Sorgula</span>
            </button>

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

            {/* Kategori & Paket Seçici Filtreler (Kolay Randevu Modülü) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20'
                      : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
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
                {filteredServices.map((srv) => {
                  const isSelected = selectedServiceIds.includes(srv.id);
                  const price = getServicePrice(srv);
                  const duration = getServiceDuration(srv);
                  const hasCustom = selectedStaff?.customPricing?.[srv.id] !== undefined;

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
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white">{srv.name}</h3>
                            {(srv.isBundle || srv.category === 'Paket' || srv.category === 'VIP') && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-950/80 text-purple-300 border border-purple-800/60">
                                ✨ Avantajlı Paket
                              </span>
                            )}
                            {hasCustom && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                {selectedStaff?.name.split(' ')[0]} Özel
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
                        {hasCustom && price !== srv.price && (
                          <span className="text-xs text-stone-500 line-through block">₺{srv.price}</span>
                        )}
                        <span className="text-base font-black text-amber-400">₺{price}</span>
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
                        className="p-3 rounded-2xl bg-stone-900/40 border border-stone-800/40 opacity-50 text-center shrink-0 w-22 flex flex-col items-center justify-center cursor-not-allowed"
                        title={d.reason}
                      >
                        <span className="text-[10px] text-stone-500 font-bold uppercase">{d.dayName}</span>
                        <span className="text-lg font-black text-stone-500">{d.dayNum}</span>
                        <span className="text-[9px] text-rose-400 font-bold mt-1">
                          {d.dayName === 'Bugün' ? 'Kapanış' : 'Kapalı'}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`p-3 rounded-2xl border text-center shrink-0 w-22 flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-lg shadow-amber-500/20 scale-102 ring-2 ring-amber-400/50'
                          : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] uppercase font-black ${isSelected ? 'text-stone-900' : 'text-stone-400'}`}>
                          {d.dayName}
                        </span>
                        {d.dayName === 'Yarın' && <span className="text-[9px]">⭐</span>}
                      </div>
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
                    const slotDayOfWeek = new Date(selectedDate).getDay();
                    const slotDiscount = (data.settings?.discountSlots || []).find((ds) => {
                      if (ds.active === false) return false;
                      const matchDay = ds.dayOfWeek === -1 || ds.dayOfWeek === slotDayOfWeek;
                      if (!matchDay) return false;
                      return slot.time >= ds.startTime && slot.time < ds.endTime;
                    });

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
                        className={`py-2 px-1 rounded-xl border text-xs font-black transition-all cursor-pointer text-center relative flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-md shadow-amber-500/20'
                            : slotDiscount
                            ? 'bg-rose-950/40 border-rose-600/70 text-rose-200 hover:border-rose-400'
                            : 'bg-stone-900 border-stone-800 text-stone-200 hover:border-amber-500/60 hover:text-white'
                        }`}
                      >
                        <span>{slot.time}</span>
                        {slotDiscount && (
                          <span
                            className={`text-[9px] font-black px-1 rounded-full mt-0.5 ${
                              isSelected ? 'bg-stone-900 text-rose-400' : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            🔥 %{slotDiscount.discountPercent}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Kampanya Bilgilendirme Kutusu */}
              {activeDiscount && (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-200 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">
                        {activeDiscount.label || 'Ölü Saat Doldurucu Kampanyası'}
                      </p>
                      <p className="text-[11px] text-rose-300">
                        Bu saat diliminde %{activeDiscount.discountPercent} indirim kazandınız!
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-stone-400 line-through block">₺{rawTotalPrice}</span>
                    <span className="text-sm font-black text-rose-400">₺{totalPrice}</span>
                  </div>
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
                    onChange={(e) => setPhone(formatTurkishPhone(e.target.value))}
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

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6 Haneli Kod"
                      className="w-36 text-center tracking-widest text-lg font-black py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white focus:outline-hidden focus:border-amber-500"
                    />
                    {otpSent && (
                      <div className="flex flex-col text-xs text-emerald-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span>Onay kodu telefonunuza SMS ile iletildi.</span>
                        </div>
                        {otpWhatsappLink && (
                          <a
                            href={otpWhatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-300 underline font-bold hover:text-white mt-1"
                          >
                            WhatsApp ile hızlı doğrulama bağlantısı →
                          </a>
                        )}
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
                  {discountAmount > 0 ? (
                    <div>
                      <span className="text-xs text-stone-500 line-through mr-1.5">₺{rawTotalPrice}</span>
                      <span className="text-xl font-black text-rose-400">₺{totalPrice}</span>
                      <span className="block text-[10px] text-rose-400 font-bold">
                        🔥 %{activeDiscount?.discountPercent} İndirim ({activeDiscount?.label})
                      </span>
                    </div>
                  ) : (
                    <p className="text-xl font-black text-amber-400">₺{totalPrice}</p>
                  )}
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
                  <span className="font-bold text-amber-400">
                    {selectedTimeSlot} (Tahmini Bitiş: {minutesToTime(timeToMinutes(selectedTimeSlot) + totalDuration)})
                  </span>
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
                    {selectedServices.map((srv) => {
                      const srvPrice = getServicePrice(srv);
                      const srvDur = getServiceDuration(srv);
                      return (
                        <div key={srv.id} className="flex justify-between text-xs">
                          <span className="text-stone-200">
                            {srv.name} ({srvDur} dk)
                            {selectedStaff?.customPricing?.[srv.id] && (
                              <span className="text-[10px] text-amber-400 font-bold ml-1">
                                ({selectedStaff.name.split(' ')[0]} Özel)
                              </span>
                            )}
                          </span>
                          <span className="font-bold text-amber-400">₺{srvPrice}</span>
                        </div>
                      );
                    })}
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

        {/* ========================================================= */}
        {/* CANLI SEPET ÇUBUĞU (KOLAY RANDEVU MODÜLÜ 4) */}
        {/* ========================================================= */}
        {selectedServiceIds.length > 0 && currentStep < 4 && (
          <div className="sticky bottom-20 z-30 animate-in slide-in-from-bottom-2 duration-200">
            <div className="bg-stone-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Randevu Sepeti</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-black">
                      {selectedServiceIds.length} Hizmet
                    </span>
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Toplam Süre: <span className="text-stone-200 font-semibold">{totalDuration} Dk</span>
                    {selectedStaff && <span className="text-amber-400 ml-1">({selectedStaff.name.split(' ')[0]})</span>}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                {discountAmount > 0 ? (
                  <div>
                    <span className="text-[11px] text-stone-500 line-through mr-1">₺{rawTotalPrice}</span>
                    <span className="text-base font-black text-rose-400">₺{totalPrice}</span>
                    <span className="block text-[9px] text-rose-400 font-bold">🔥 %{activeDiscount?.discountPercent} İndirim</span>
                  </div>
                ) : (
                  <span className="text-base font-black text-amber-400">₺{totalPrice}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VİTRİN: MÜŞTERİ DEĞERLENDİRMELERİ VE YILDIZLAR (KOLAY RANDEVU MODÜLÜ 2) */}
        {/* ========================================================= */}
        <section className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-white">Müşteri Değerlendirmeleri</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>
                    {(data.reviews && data.reviews.length > 0)
                      ? (data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length).toFixed(1)
                      : '5.0'} / 5
                  </span>
                </span>
                <span className="text-[11px] text-stone-400 font-bold">
                  ({(data.reviews || []).length} Değerlendirme)
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {data.shop.storeName} salonundan hizmet alan onaylı müşterilerimizin deneyimleri.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto shrink-0"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>✍️ Deneyiminizi Puanlayın</span>
            </button>
          </div>

          {(!data.reviews || data.reviews.length === 0) ? (
            <div className="p-6 text-center text-xs text-stone-500 bg-stone-950/40 rounded-2xl border border-stone-800/60">
              Henüz müşteri değerlendirmesi bulunmuyor. Hizmet aldıktan sonra deneyiminizi ilk siz puanlayın!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {data.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center font-bold text-[10px] text-amber-400">
                        {rev.customerName.charAt(0)}
                      </div>
                      <span className="font-bold text-stone-200">{rev.customerName}</span>
                    </div>
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-700'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-stone-300 italic leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>

                  <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-800/60">
                    {rev.staffName && (
                      <span className="text-amber-400/90 font-medium">Usta: {rev.staffName}</span>
                    )}
                    <span>{new Date(rev.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Viral Branding Footer */}
        {(data.shop as any)?.brandingRequired !== false && (
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
        )}
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
                (currentStep === 3 &&
                  (!customerName.trim() ||
                    phone.replace(/\D/g, '').length < 10 ||
                    !kvkkApproved ||
                    (Boolean(data.settings?.requireOtp) && (!otpSent || otpCode.trim().length < 4))))
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

      {/* ========================================================= */}
      {/* MODAL 1: "RANDEVUM NE DURUMDA?" MÜŞTERİ SORGULAMA VE İPTAL EKRANI */}
      {/* ========================================================= */}
      {isMyBookingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Randevumu Sorgula &amp; Yönet</h3>
                  <p className="text-[11px] text-stone-400">Telefon numaranızı girerek yaklaşan randevunuzu görüntüleyin.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMyBookingsOpen(false);
                  setQueryError(null);
                }}
                className="p-1 rounded-xl text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <form onSubmit={handleQueryAppointments} className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={queryPhone}
                    onChange={(e) => setQueryPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-bold focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isQuerying}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black text-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {isQuerying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Sorgula</span>
                </button>
              </form>

              {queryError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
                  {queryError}
                </div>
              )}

              {myAppointments.length > 0 && (
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-black uppercase text-stone-400">Bulunan Randevularınız ({myAppointments.length})</p>
                  {myAppointments.map((apt) => {
                    const isUpcoming = apt.status === 'bekliyor' || apt.status === 'onayli';
                    return (
                      <div
                        key={apt.id}
                        className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                          isUpcoming
                            ? 'bg-stone-950 border-amber-500/40 shadow-md'
                            : 'bg-stone-950/50 border-stone-800 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-amber-400 text-sm">
                            {apt.appointmentDate} • {apt.timeSlot}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              apt.status === 'onayli'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : apt.status === 'tamamlandi'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : apt.status === 'iptal'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-stone-300">
                          <div className="flex justify-between">
                            <span className="text-stone-500">Hizmet:</span>
                            <span className="font-bold text-white text-right">{apt.serviceName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Usta:</span>
                            <span className="font-semibold text-stone-200">{apt.staffName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Tutar:</span>
                            <span className="font-black text-amber-400">
                              {apt.discountAmount ? (
                                <>
                                  <span className="line-through text-stone-500 text-[10px] mr-1">₺{apt.originalPrice}</span>
                                  <span>₺{apt.price}</span>
                                </>
                              ) : (
                                `₺${apt.price}`
                              )}
                            </span>
                          </div>
                        </div>

                        {/* İptal Butonu veya Bilgilendirme */}
                        <div className="pt-2 border-t border-stone-850 flex items-center justify-between gap-2">
                          {apt.canCancel ? (
                            <button
                              type="button"
                              disabled={cancellingId === apt.id}
                              onClick={() => handleCancelBooking(apt.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              {cancellingId === apt.id ? 'İptal Ediliyor...' : 'Randevuyu İptal Et'}
                            </button>
                          ) : apt.cancelReasonNotice ? (
                            <span className="text-[10px] text-stone-500 italic">
                              {apt.cancelReasonNotice}
                            </span>
                          ) : null}

                          {apt.status === 'tamamlandi' && (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewStaffName(apt.staffName || '');
                                setReviewCustomerName(apt.customerName || '');
                                setIsMyBookingsOpen(false);
                                setIsReviewModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ml-auto"
                            >
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>Puan &amp; Yorum Bırak</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: "YORUM & YILDIZ DEĞERLENDİRMESİ BIRAK" EKRANI */}
      {/* ========================================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-base font-black text-white">Deneyiminizi Puanlayın</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setReviewSuccessMsg(null);
                }}
                className="p-1 rounded-xl text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-bold text-center">
                {reviewSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3.5">
                {/* 1-5 Yıldız Seçimi */}
                <div className="text-center py-1">
                  <label className="block text-xs font-bold text-stone-400 mb-1.5">
                    Hizmetten ne kadar memnun kaldınız?
                  </label>
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => setReviewRating(starNum)}
                        className="p-1 cursor-pointer transition-transform hover:scale-115 active:scale-95"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            starNum <= reviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-700 hover:text-stone-500'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-black text-amber-400 mt-1 block">
                    {reviewRating === 5
                      ? '⭐ 5 Yıldız: Mükemmel!'
                      : reviewRating === 4
                      ? '⭐ 4 Yıldız: Çok İyi'
                      : reviewRating === 3
                      ? '⭐ 3 Yıldız: Orta'
                      : reviewRating === 2
                      ? '⭐ 2 Yıldız: Zayıf'
                      : '⭐ 1 Yıldız: Memnun Kalmadım'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">
                    Adınız ve Soyadınız *
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewCustomerName}
                    onChange={(e) => setReviewCustomerName(e.target.value)}
                    placeholder="Örn: Burak Yılmaz"
                    className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">
                    Hizmet Veren Usta
                  </label>
                  <select
                    value={reviewStaffId}
                    onChange={(e) => {
                      setReviewStaffId(e.target.value);
                      const st = data.staff.find((s) => s.id === e.target.value);
                      if (st) setReviewStaffName(st.name);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold"
                  >
                    <option value="">Salon Genel Deneyimi</option>
                    {data.staff.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.title || st.role || 'Usta'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">
                    Değerlendirmeniz / Yorumunuz *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Aldığınız hizmet, saç kesimi ve salon hakkındaki düşünceleriniz..."
                    className="w-full p-3 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs resize-none focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmittingReview ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Değerlendirmeyi Yayınla</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
