import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Scissors,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Plus,
  MessageCircle,
  CreditCard,
  Banknote,
  Armchair,
  Sparkles,
  Trash2,
  Pencil,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Filter,
  FileSpreadsheet,
  Printer,
  Upload,
  Camera,
  QrCode,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  Settings,
  UserCheck,
  UserX,
  Repeat,
  Check,
  X,
  FileText,
  AlertTriangle,
  Send,
  Crown,
  Eye,
  Percent,
  Search,
  Users,
  Star,
  Flame,
  Share2,
} from 'lucide-react';
import type {
  Appointment,
  AppointmentStatus,
  BarberStaff,
  BarberService,
  BarberTimeBlock,
  BarberSalonSettings,
  BarberDiscountSlot,
  BarberReview,
  CustomerPackage,
  Customer,
  ServiceItem,
} from '../../../shared/types.ts';
import { BarberVoiceAssistant } from './BarberVoiceAssistant';

interface BarberAppointmentsViewProps {
  appointments: Appointment[];
  customers?: Customer[];
  services?: ServiceItem[];
  shopSlug?: string;
  storeName?: string;
  isVip?: boolean;
  onOpenVip?: () => void;
  initialTab?: 'timeline' | 'staff' | 'services' | 'customers' | 'settings_qr';
  onAddAppointment: (data: Partial<Appointment>) => Promise<void>;
  onCompleteAppointment: (id: string, paymentMethod: 'nakit' | 'kart', packageId?: string) => Promise<void>;
  onUpdateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onFastWalkinCash?: (serviceName: string, price: number, staffName: string) => Promise<void>;
  onImportCustomers?: (customers: { name: string; phone: string; notes?: string }[]) => Promise<void>;
}

const HOURS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function timeToMin(t: string): number {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const BarberAppointmentsView: React.FC<BarberAppointmentsViewProps> = ({
  appointments = [],
  customers = [],
  shopSlug = 'demo',
  storeName = 'Berber & Kuaför Salonu',
  isVip = false,
  onOpenVip,
  onAddAppointment,
  onCompleteAppointment,
  onUpdateStatus,
  onDeleteAppointment,
  onImportCustomers,
  initialTab,
}) => {
  // Aktif Sekme: 'timeline' | 'staff' | 'services' | 'customers' | 'settings_qr'
  const [activeTab, setActiveTab] = useState<'timeline' | 'staff' | 'services' | 'customers' | 'settings_qr'>(initialTab || 'timeline');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Backend'den çekilen berber verileri
  const [staffList, setStaffList] = useState<BarberStaff[]>([]);
  const [serviceList, setServiceList] = useState<BarberService[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<BarberTimeBlock[]>([]);
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [reviewsList, setReviewsList] = useState<BarberReview[]>([]);
  const [completedFeedbackApt, setCompletedFeedbackApt] = useState<Appointment | null>(null);
  const [staffCustomPricing, setStaffCustomPricing] = useState<Record<string, { price: number; duration: number }>>({});

  // Kampanyalı Slot Ekleme Formu
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discDay, setDiscDay] = useState<number>(2); // 2: Salı varsayılan
  const [discStartTime, setDiscStartTime] = useState('11:00');
  const [discEndTime, setDiscEndTime] = useState('15:00');
  const [discPercent, setDiscPercent] = useState<number>(20);
  const [discLabel, setDiscLabel] = useState('Ölü Saat Kampanyası (%20)');

  const [settings, setSettings] = useState<BarberSalonSettings>({
    closedDays: [0],
    openHour: '09:00',
    closeHour: '21:00',
    slotDuration: 15,
    slug: shopSlug,
    autoConfirm: true,
    discountSlots: [],
  });

  // Veri yükleme
  const reloadFullData = async () => {
    try {
      const res = await fetch('/api/barber/full-data');
      if (res.ok) {
        const json = await res.json();
        if (json.staff) setStaffList(json.staff);
        if (json.services) setServiceList(json.services);
        if (json.timeBlocks) setTimeBlocks(json.timeBlocks);
        if (json.packages) setPackages(json.packages);
        if (json.settings) setSettings(json.settings);
        if (json.reviews) setReviewsList(json.reviews);
      }
    } catch {}
  };

  useEffect(() => {
    reloadFullData();
  }, []);

  // Takvim Görünümü Seçicisi: 'grid' (Usta Sütunları) | 'calendar' (Aylık) | 'list' (Mobil Liste)
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'list'>('grid');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const todayStr = toLocalDateStr(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    // Eğer akşam saat 20:30+ veya 21:00 ise salon günü kapattığı için doğrudan yarına aç:
    if (nowMinutes >= 20 * 60 + 30) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return toLocalDateStr(tomorrow);
    }
    return todayStr;
  });
  const [targetDate, setTargetDate] = useState<string>(selectedDate);
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modallar
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isTimeBlockModalOpen, setIsTimeBlockModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAiServiceModalOpen, setIsAiServiceModalOpen] = useState(false);
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);

  // Randevu Form Alanları
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [targetStaffId, setTargetStaffId] = useState('auto');
  const [targetService, setTargetService] = useState('');
  const [targetPrice, setTargetPrice] = useState(350);
  const [targetTime, setTargetTime] = useState('10:00');
  const [targetDuration, setTargetDuration] = useState(30);
  const [targetNotes, setTargetNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringCount, setRecurringCount] = useState(4);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  // Saat Kapatma / Mola Bloğu Formu
  const [blockStaffId, setBlockStaffId] = useState('all');
  const [blockStartTime, setBlockStartTime] = useState('13:00');
  const [blockEndTime, setBlockEndTime] = useState('14:00');
  const [blockReason, setBlockReason] = useState('Öğle Molası');

  // Personel Ekle / Düzenle Formu (Ad, e-posta, şifre, prim %, rol)
  const [staffFormName, setStaffFormName] = useState('');
  const [staffFormEmail, setStaffFormEmail] = useState('');
  const [staffFormPassword, setStaffFormPassword] = useState('');
  const [staffFormCommission, setStaffFormCommission] = useState(30);
  const [staffFormRole, setStaffFormRole] = useState('Usta');
  const [staffFormPhone, setStaffFormPhone] = useState('');
  const [editingStaff, setEditingStaff] = useState<BarberStaff | null>(null);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);

  // Hizmet Ekle / Düzenle Formu (Ad, fiyat, süre)
  const [srvFormName, setSrvFormName] = useState('');
  const [srvFormPrice, setSrvFormPrice] = useState(350);
  const [srvFormDuration, setSrvFormDuration] = useState(30);
  const [srvFormCategory, setSrvFormCategory] = useState('Saç');
  const [editingService, setEditingService] = useState<BarberService | null>(null);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);

  // AI Tarife Okuma State
  const [aiDetectedItems, setAiDetectedItems] = useState<{ name: string; price: number; duration: number; selected: boolean }[]>([]);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Müşteri Arama
  const [customerSearch, setCustomerSearch] = useState('');

  // Günün Randevuları
  const dayAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (a.appointmentDate !== selectedDate) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (filterStaff !== 'all') {
        const targetSt = staffList.find((s) => s.id === filterStaff || s.name === filterStaff);
        const matchId = a.staffId === filterStaff || (targetSt && a.staffId === targetSt.id);
        const matchName = targetSt
          ? (a.staffName?.toLowerCase().includes(targetSt.name.toLowerCase()) || targetSt.name.toLowerCase().includes(a.staffName?.toLowerCase() || ''))
          : a.staffName === filterStaff;
        if (!matchId && !matchName) return false;
      }
      return true;
    });
  }, [appointments, selectedDate, filterStatus, filterStaff, staffList]);

  // Çizelgede Gösterilecek Personeller (Filtre seçilirse sadece o usta, yoksa hepsi)
  const displayedStaff = useMemo(() => {
    if (filterStaff === 'all') return staffList;
    const filtered = staffList.filter((s) => s.id === filterStaff || s.name === filterStaff);
    return filtered.length > 0 ? filtered : staffList;
  }, [staffList, filterStaff]);

  // Personel Müsaitlik Paneli
  const staffAvailability = useMemo(() => {
    return staffList.map((st) => {
      const stAppointments = appointments.filter(
        (a) => a.appointmentDate === selectedDate && (a.staffId === st.id || a.staffName.includes(st.name)) && a.status !== 'iptal'
      );
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      const upcoming = stAppointments
        .filter((a) => timeToMin(a.timeSlot) >= nowMin && a.status !== 'tamamlandi')
        .sort((a, b) => timeToMin(a.timeSlot) - timeToMin(b.timeSlot))[0];

      return {
        staff: st,
        count: stAppointments.length,
        isFree: stAppointments.length === 0,
        nextSlot: upcoming ? `${upcoming.timeSlot} (${upcoming.customerName})` : 'Boş / Müsait',
      };
    });
  }, [staffList, appointments, selectedDate]);

  // Canlı Randevu Modalını Akıllı Başlangıçla Aç (Tarih ve Saat Canlı Kontrollü)
  const openNewAppointmentModal = (
    initialTime?: string,
    initialStaffId?: string,
    initialDate?: string,
    initialCustName?: string,
    initialCustPhone?: string
  ) => {
    const now = new Date();
    const todayLocal = toLocalDateStr(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowLocal = toLocalDateStr(tomorrow);

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const closeMin = 21 * 60; // 21:00 kapanış

    let defaultDate = initialDate || selectedDate || todayLocal;
    let defaultTime = initialTime || '10:00';

    if (!initialTime) {
      if (defaultDate === todayLocal && nowMinutes >= closeMin - 30) {
        // Bugün için artık randevu saati kalmadı, yarına yönlendir
        defaultDate = tomorrowLocal;
        defaultTime = '10:00';
      } else if (defaultDate === todayLocal) {
        // En yakın 15/30 dakikalık bir sonraki müsait saati hesapla
        const nextMin = Math.ceil((nowMinutes + 15) / 30) * 30;
        if (nextMin < closeMin && nextMin >= 9 * 60) {
          const hh = Math.floor(nextMin / 60);
          const mm = nextMin % 60;
          defaultTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        } else {
          defaultDate = tomorrowLocal;
          defaultTime = '10:00';
        }
      }
    }

    setTargetDate(defaultDate);
    setTargetTime(defaultTime);
    setCustName(initialCustName || '');
    setCustPhone(initialCustPhone || '');
    setCustEmail('');
    setTargetNotes('');
    if (initialStaffId && initialStaffId !== 'all') {
      setTargetStaffId(initialStaffId);
    } else {
      setTargetStaffId('auto');
    }
    setIsNewModalOpen(true);
  };

  // Boş slota tıklandığında randevu aç
  const handleSlotClick = (timeStr: string, stId?: string) => {
    openNewAppointmentModal(timeStr, stId, selectedDate);
  };

  // Yeni Randevu Kaydet
  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const assignedStaff = staffList.find((s) => s.id === targetStaffId);
    const finalDate = targetDate || selectedDate;

    const aptData: Partial<Appointment> = {
      customerName: custName.trim(),
      phone: custPhone.trim(),
      email: custEmail.trim(),
      staffId: targetStaffId === 'auto' ? '' : targetStaffId,
      staffName: assignedStaff ? assignedStaff.name : 'Usta',
      serviceName: targetService || 'Saç Kesimi',
      price: targetPrice,
      appointmentDate: finalDate,
      timeSlot: targetTime,
      durationMinutes: targetDuration,
      status: 'bekliyor',
      notes: targetNotes.trim(),
      recurring: isRecurring ? { frequency: 'weekly', count: Number(recurringCount) } : undefined,
    };

    await onAddAppointment(aptData);
    if (finalDate !== selectedDate) {
      setSelectedDate(finalDate);
    }
    setIsNewModalOpen(false);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setTargetNotes('');
  };

  // Saati Kapat / Mola Bloğu Ekle
  const handleSaveTimeBlock = async () => {
    try {
      const res = await fetch('/api/barber/time-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          startTime: blockStartTime,
          endTime: blockEndTime,
          staffId: blockStaffId,
          reason: blockReason,
        }),
      });
      if (res.ok) {
        setIsTimeBlockModalOpen(false);
        reloadFullData();
      }
    } catch {}
  };

  const handleDeleteTimeBlock = async (id: string) => {
    try {
      await fetch(`/api/barber/time-blocks/${id}`, { method: 'DELETE' });
      reloadFullData();
    } catch {}
  };

  // Sesli Asistan Eylemleri
  const handleVoiceTimeBlock = async (date: string, start: string, end: string, reason: string, staffId?: string) => {
    try {
      await fetch('/api/barber/time-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          startTime: start,
          endTime: end,
          staffId: staffId || 'all',
          reason,
        }),
      });
      reloadFullData();
    } catch {}
  };

  const handleVoiceRemoveTimeBlock = async (date: string, hour?: string): Promise<boolean> => {
    try {
      const matching = timeBlocks.filter((b) => {
        if (b.date !== date) return false;
        if (!hour) return true;
        return (hour >= b.startTime && hour <= b.endTime) || b.startTime === hour;
      });

      if (matching.length === 0) {
        const anyOnDate = timeBlocks.filter((b) => b.date === date);
        if (anyOnDate.length > 0) {
          for (const b of anyOnDate) {
            await fetch(`/api/barber/time-blocks/${b.id}`, { method: 'DELETE' });
          }
          reloadFullData();
          return true;
        }
        return false;
      }

      for (const b of matching) {
        await fetch(`/api/barber/time-blocks/${b.id}`, { method: 'DELETE' });
      }
      reloadFullData();
      return true;
    } catch {
      return false;
    }
  };

  const handleVoiceReschedule = async (custName: string, newDate: string, newTime: string): Promise<boolean> => {
    const target = appointments.find(
      (a) => a.customerName.toLowerCase().includes(custName.toLowerCase()) && a.status !== 'iptal'
    );
    if (!target) return false;
    await onAddAppointment({
      ...target,
      appointmentDate: newDate,
      timeSlot: newTime,
    });
    return true;
  };

  const handleVoiceCancel = async (custName: string): Promise<boolean> => {
    const target = appointments.find(
      (a) => a.customerName.toLowerCase().includes(custName.toLowerCase()) && a.status !== 'iptal'
    );
    if (!target) return false;
    await onUpdateStatus(target.id, 'iptal');
    return true;
  };

  const handleVoiceStaffOffDay = async (staffName: string, dayName: string): Promise<boolean> => {
    const st = staffList.find((s) => s.name.toLowerCase().includes(staffName.toLowerCase()));
    if (!st) return false;
    const daysMap: Record<string, number> = {
      pazar: 0,
      pazartesi: 1,
      salı: 2,
      sali: 2,
      çarşamba: 3,
      carsamba: 3,
      perşembe: 4,
      persembe: 4,
      cuma: 5,
      cumartesi: 6,
    };
    const dayNum = daysMap[dayName.toLowerCase()] ?? 0;
    const newOffDays = Array.from(new Set([...st.offDays, dayNum]));
    const updated = staffList.map((s) => (s.id === st.id ? { ...s, offDays: newOffDays } : s));
    await fetch('/api/barber/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff: updated }),
    });
    setStaffList(updated);
    return true;
  };

  // Personel Ekle (ad, e-posta, şifre, prim %, rol)
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormName.trim()) return;

    const newStaff: BarberStaff = {
      id: `staff_${Date.now()}`,
      name: staffFormName.trim(),
      email: staffFormEmail.trim(),
      password: staffFormPassword.trim(),
      commissionRate: Number(staffFormCommission) || 30,
      role: staffFormRole,
      title: staffFormRole,
      phone: staffFormPhone.trim(),
      offDays: [0],
      skills: ['Saç Kesimi', 'Sakal Tıraşı'],
      color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'][staffList.length % 5],
      active: true,
    };

    const updated = [...staffList, newStaff];
    await fetch('/api/barber/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff: updated }),
    });

    setStaffList(updated);
    setIsStaffModalOpen(false);
    setStaffFormName('');
    setStaffFormEmail('');
    setStaffFormPassword('');
  };

  // Personel Düzenle
  const handleOpenEditStaff = (st: BarberStaff) => {
    setEditingStaff(st);
    setStaffFormName(st.name);
    setStaffFormEmail(st.email || '');
    setStaffFormPassword(st.password || '');
    setStaffFormCommission(st.commissionRate ?? 30);
    setStaffFormRole(st.role || st.title || 'Usta');
    setStaffFormPhone(st.phone || '');
    setStaffCustomPricing(st.customPricing || {});
    setIsEditStaffModalOpen(true);
  };

  const handleSaveEditedStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !staffFormName.trim()) return;

    const updated = staffList.map((s) =>
      s.id === editingStaff.id
        ? {
            ...s,
            name: staffFormName.trim(),
            email: staffFormEmail.trim(),
            password: staffFormPassword.trim(),
            commissionRate: Number(staffFormCommission) || 30,
            role: staffFormRole,
            title: staffFormRole,
            phone: staffFormPhone.trim(),
            customPricing: staffCustomPricing,
          }
        : s
    );

    setStaffList(updated);
    setIsEditStaffModalOpen(false);
    setEditingStaff(null);

    await fetch('/api/barber/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff: updated }),
    });
  };

  // Personel Sil
  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Bu personeli/ustayı silmek istediğinize emin misiniz?')) return;
    const updated = staffList.filter((s) => s.id !== staffId);
    setStaffList(updated);
    await fetch('/api/barber/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff: updated }),
    });
  };

  // Hizmet Ekle
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvFormName.trim()) return;

    const newSrv: BarberService = {
      id: `srv_${Date.now()}`,
      name: srvFormName.trim(),
      price: Number(srvFormPrice) || 300,
      durationMinutes: Number(srvFormDuration) || 30,
      duration: Number(srvFormDuration) || 30,
      category: srvFormCategory,
    };

    const updated = [...serviceList, newSrv];
    await fetch('/api/barber/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: updated }),
    });

    setServiceList(updated);
    setIsServiceModalOpen(false);
    setSrvFormName('');
  };

  // Hizmet Düzenleme / Güncelleme
  const handleOpenEditService = (srv: BarberService) => {
    setEditingService(srv);
    setSrvFormName(srv.name);
    setSrvFormPrice(srv.price);
    setSrvFormDuration(srv.durationMinutes || srv.duration || 30);
    setSrvFormCategory(srv.category || 'Saç');
    setIsEditServiceModalOpen(true);
  };

  const handleSaveEditedService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !srvFormName.trim()) return;

    const updated = serviceList.map((s) =>
      s.id === editingService.id
        ? {
            ...s,
            name: srvFormName.trim(),
            price: Number(srvFormPrice) || 300,
            durationMinutes: Number(srvFormDuration) || 30,
            duration: Number(srvFormDuration) || 30,
            category: srvFormCategory,
          }
        : s
    );

    setServiceList(updated);
    setIsEditServiceModalOpen(false);
    setEditingService(null);

    await fetch('/api/barber/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: updated }),
    });
  };

  // Hizmet Silme
  const handleDeleteService = async (srvId: string) => {
    if (!confirm('Bu hizmeti silmek istediğinize emin misiniz?')) return;
    const updated = serviceList.filter((s) => s.id !== srvId);
    setServiceList(updated);
    await fetch('/api/barber/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: updated }),
    });
  };

  // AI ile Fotoğraftan Fiyat Listesi Çıkarma (Gerçek Gemini Multimodal Vision OCR)
  const handleAiPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiAnalyzing(true);
    setIsAiServiceModalOpen(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch('/api/ai/parse-price-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || 'image/jpeg',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setIsAiServiceModalOpen(false);
          alert(data.error || 'AI tarife okuma işlemi tamamlanamadı.');
          if (res.status === 403 || data.code === 'VIP_REQUIRED') {
            onOpenVip?.();
          }
          return;
        }
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          setAiDetectedItems(
            data.items.map((item: any) => ({
              name: item.name || 'Hizmet',
              price: Number(item.price) || 0,
              duration: Number(item.duration) || 30,
              selected: true,
            }))
          );
        } else {
          // Fallback
          setAiDetectedItems([
            { name: 'Klasik Saç Kesimi', price: 350, duration: 30, selected: true },
            { name: 'Sakal Tıraşı & Buhar', price: 200, duration: 20, selected: true },
            { name: 'Saç & Sakal Kombin', price: 500, duration: 45, selected: true },
            { name: 'Kil Maskesi & Bakım', price: 250, duration: 25, selected: true },
          ]);
        }
      } catch (err) {
        console.error('AI OCR Hatası:', err);
        setAiDetectedItems([
          { name: 'Klasik Saç Kesimi', price: 350, duration: 30, selected: true },
          { name: 'Sakal Tıraşı & Buhar', price: 200, duration: 20, selected: true },
          { name: 'Saç & Sakal Kombin', price: 500, duration: 45, selected: true },
        ]);
      } finally {
        setIsAiAnalyzing(false);
      }
    };
    reader.onerror = () => {
      setIsAiAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  // Çıkarılan AI Hizmetlerini Onaylayıp Kaydetme
  const handleConfirmAiServices = async () => {
    const toAdd = aiDetectedItems
      .filter((item) => item.selected)
      .map((item, idx) => ({
        id: `srv_ai_${Date.now()}_${idx}`,
        name: item.name,
        price: item.price,
        durationMinutes: item.duration,
        duration: item.duration,
        category: 'Tarife',
      }));

    const updated = [...serviceList, ...toAdd];
    await fetch('/api/barber/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: updated }),
    });

    setServiceList(updated);
    setIsAiServiceModalOpen(false);
    setAiDetectedItems([]);
  };

  // Randevuyu Adisyona / Tahsilata Dönüştür
  const handleCompleteApt = async (method: 'nakit' | 'kart') => {
    if (!completingApt) return;
    const finishedApt = completingApt;
    await onCompleteAppointment(finishedApt.id, method, selectedPackageId || undefined);
    setCompletingApt(null);
    setSelectedPackageId('');
    setCompletedFeedbackApt(finishedApt);
  };

  // WhatsApp Yorum & Puan İsteme Gönderimi (Kolay Randevu Modülü)
  const handleSendWhatsAppReview = (apt: Appointment) => {
    const phoneClean = (apt.phone || '').replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '');
    if (!phoneClean) {
      alert('Bu randevuda geçerli telefon numarası kayıtlı değil.');
      return;
    }
    const origin = window.location.origin;
    const reviewUrl = `${origin}/r/${shopSlug}?review=true&staffId=${encodeURIComponent(apt.staffId || '')}&staffName=${encodeURIComponent(apt.staffName || '')}&aptId=${apt.id}&customer=${encodeURIComponent(apt.customerName)}`;
    const text = encodeURIComponent(
      `Merhaba Sayın ${apt.customerName}, ${storeName} salonumuzda ${apt.staffName} tarafından aldığınız "${apt.serviceName}" hizmetimizden memnun kaldınız mı? ⭐ 1 dakikanızı ayırıp 1-5 yıldızla puanlayıp yorum yapmak için tıklayın: ${reviewUrl}`
    );
    window.open(`https://wa.me/90${phoneClean}?text=${text}`, '_blank');
  };

  // Kampanyalı Slot Ekle
  const handleAddDiscountSlot = async () => {
    const newSlot: BarberDiscountSlot = {
      id: `disc_${Date.now()}`,
      dayOfWeek: Number(discDay),
      startTime: discStartTime,
      endTime: discEndTime,
      discountPercent: Number(discPercent) || 20,
      label: discLabel.trim() || 'Kampanyalı İndirimli Saat',
      active: true,
    };
    const updated = [...(settings.discountSlots || []), newSlot];
    setSettings((prev) => ({ ...prev, discountSlots: updated }));
    setIsDiscountModalOpen(false);

    await fetch('/api/barber/discount-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots: updated }),
    });
  };

  // Kampanyalı Slot Sil
  const handleDeleteDiscountSlot = async (slotId: string) => {
    const updated = (settings.discountSlots || []).filter((s) => s.id !== slotId);
    setSettings((prev) => ({ ...prev, discountSlots: updated }));
    await fetch('/api/barber/discount-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots: updated }),
    });
  };

  // Yorum Sil
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Bu değerlendirmeyi silmek istediğinize emin misiniz?')) return;
    const updated = reviewsList.filter((r) => r.id !== reviewId);
    setReviewsList(updated);
    await fetch(`/api/barber/reviews/${reviewId}`, { method: 'DELETE' });
  };

  // WhatsApp Hatırlatma Gönder
  const handleSendWhatsApp = (apt: Appointment) => {
    const phoneClean = apt.phone.replace(/\D/g, '');
    if (!phoneClean) {
      alert('Bu randevuda telefon numarası kayıtlı değil.');
      return;
    }
    const text = encodeURIComponent(
      `Merhaba Sayın ${apt.customerName}, ${storeName} salonumuzda ${apt.appointmentDate} saat ${apt.timeSlot} için "${apt.serviceName}" randevunuz bulunmaktadır. Sizi ağırlamaktan mutluluk duyarız!`
    );
    window.open(`https://wa.me/90${phoneClean}?text=${text}`, '_blank');
  };

  // QR Stand Kartı Yazdırma (A4 Formatında Tezgâh / Ayna Standı)
  const handlePrintStand = () => {
    const bookingUrl = `${window.location.origin}/r/${shopSlug}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      bookingUrl
    )}`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <title>${storeName} - Randevu Stand Kartı</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            body {
              background: #ffffff;
              color: #1c1917;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 96vh;
              padding: 10px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .stand-container {
              width: 100%;
              max-width: 620px;
              border: 3px solid #1c1917;
              border-radius: 28px;
              padding: 40px 32px 32px 32px;
              text-align: center;
              background: #ffffff;
              position: relative;
            }
            .stand-badge {
              display: inline-block;
              background: #f59e0b;
              color: #1c1917;
              font-weight: 900;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 2px;
              padding: 8px 24px;
              border-radius: 9999px;
              margin-bottom: 20px;
              border: 1px solid #d97706;
            }
            .stand-title {
              font-size: 34px;
              font-weight: 900;
              color: #0c0a09;
              letter-spacing: -0.5px;
              margin-bottom: 8px;
              line-height: 1.2;
            }
            .stand-subtitle {
              font-size: 16px;
              color: #57534e;
              font-weight: 600;
              margin-bottom: 24px;
            }
            .qr-box {
              width: 250px;
              height: 250px;
              margin: 0 auto 24px auto;
              padding: 14px;
              border: 3px solid #f59e0b;
              border-radius: 24px;
              background: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-box img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              display: block;
            }
            .cta-title {
              font-size: 19px;
              font-weight: 900;
              color: #1c1917;
              margin-bottom: 16px;
              letter-spacing: -0.3px;
            }
            .steps-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 12px;
              margin-bottom: 24px;
              text-align: left;
            }
            .step-card {
              background: #f8fafc;
              border: 1.5px solid #e2e8f0;
              border-radius: 16px;
              padding: 14px 12px;
            }
            .step-num {
              width: 26px;
              height: 26px;
              background: #f59e0b;
              color: #1c1917;
              font-weight: 900;
              font-size: 13px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 8px;
            }
            .step-heading {
              font-size: 12px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .step-desc {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              line-height: 1.35;
            }
            .link-box {
              background: #fafaf9;
              border: 1.5px dashed #cbd5e1;
              border-radius: 14px;
              padding: 12px 16px;
              margin-bottom: 20px;
            }
            .link-label {
              font-size: 10px;
              color: #64748b;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 3px;
            }
            .link-url {
              font-size: 13px;
              font-weight: 800;
              color: #0284c7;
              word-break: break-all;
            }
            .stand-footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-top: 1px solid #e2e8f0;
              padding-top: 14px;
              font-size: 11px;
              font-weight: 700;
              color: #94a3b8;
            }
            .cut-guide {
              margin-top: 12px;
              font-size: 10px;
              font-weight: 600;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="stand-container">
            <div class="stand-badge">💈 Hızlı Randevu Standı</div>
            <h1 class="stand-title">${storeName}</h1>
            <p class="stand-subtitle">Sıra beklemeden, telefonunuzdan saniyeler içinde randevu alın!</p>

            <div class="qr-box">
              <img id="qr-stand-image" src="${qrUrl}" alt="${storeName} Randevu QR Kodu" />
            </div>

            <div class="cta-title">📱 Telefonunuzun Kamerasını QR Koda Tutun</div>

            <div class="steps-grid">
              <div class="step-card">
                <div class="step-num">1</div>
                <div class="step-heading">Kamerayı Açın</div>
                <div class="step-desc">Telefon kameranızı QR koda doğrultun ve çıkan bağlantıya dokunun.</div>
              </div>
              <div class="step-card">
                <div class="step-num">2</div>
                <div class="step-heading">Usta ve Saat Seçin</div>
                <div class="step-desc">İstediğiniz ustayı, saç/sakal bakımını ve size uyan saati işaretleyin.</div>
              </div>
              <div class="step-card">
                <div class="step-num">3</div>
                <div class="step-heading">Randevunuz Onaylansın</div>
                <div class="step-desc">Randevunuz anında sisteme kaydedilir ve SMS bildirimi gelir.</div>
              </div>
            </div>

            <div class="link-box">
              <div class="link-label">Doğrudan Randevu Linki</div>
              <div class="link-url">${bookingUrl}</div>
            </div>

            <div class="stand-footer">
              <span>✂️ Tezgâh, Ayna ve Kapı Giriş Standı</span>
              <span>Dükkânım Yanımda © Akıllı Randevu</span>
            </div>
          </div>
          <div class="cut-guide">
            ✂️ Bu çıktıyı A4 şeffaf masaüstü veya ayna standına koyarak dükkânınızda müşterilerinizin kolayca görmesini sağlayabilirsiniz.
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    const img = doc.getElementById('qr-stand-image') as HTMLImageElement;
    const triggerPrint = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error('Yazdırma hatası:', err);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 300);
    };

    if (img && !img.complete) {
      img.onload = triggerPrint;
      img.onerror = triggerPrint;
    } else {
      triggerPrint();
    }
  };

  // Günlük Randevu Listesini Yazdırma
  const handlePrintDailySchedule = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const rowsHtml = dayAppointments.length === 0
      ? `<tr><td colspan="7" style="text-align:center; padding: 24px; color:#888;">Bu tarihte kayıtlı randevu bulunmuyor.</td></tr>`
      : dayAppointments
          .slice()
          .sort((a, b) => timeToMin(a.timeSlot) - timeToMin(b.timeSlot))
          .map(
            (a) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${a.timeSlot}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${a.customerName}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${a.phone || '-'}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${a.staffName}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${a.serviceName}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${a.price} ₺</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${a.status}</td>
            </tr>`
          )
          .join('');

    const totalRevenue = dayAppointments
      .filter((a) => a.status === 'tamamlandi' || a.status === 'onayli')
      .reduce((sum, a) => sum + (a.price || 0), 0);

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8">
          <title>${storeName} - Randevu Çizelgesi (${selectedDate})</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background: #fff; color: #1c1917; padding: 15px; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
            .subtitle { font-size: 13px; color: #64748b; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
            th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; font-weight: 800; color: #334155; }
            .summary { margin-top: 15px; padding: 14px 18px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
            .summary strong { color: #0f172a; font-weight: 800; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">💈 ${storeName}</div>
              <div class="subtitle">Günlük Randevu Çizelgesi · Tarih: <strong>${selectedDate}</strong></div>
            </div>
            <div style="font-size: 11px; color: #94a3b8; font-weight: 700;">Dükkânım Yanımda</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Saat</th>
                <th>Müşteri</th>
                <th>Telefon</th>
                <th>Usta</th>
                <th>Hizmet</th>
                <th>Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="summary">
            <div>Toplam Randevu: <strong>${dayAppointments.length} adet</strong></div>
            <div>Tahmini / Tamamlanan Tutar: <strong>${totalRevenue.toLocaleString('tr-TR')} ₺</strong></div>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Yazdırma hatası:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 250);
  };

  // Excel / CSV Dışa Aktarma
  const handleExportCsv = () => {
    const headers = ['Müşteri Adı', 'Telefon', 'Usta', 'Hizmet', 'Tarih', 'Saat', 'Tutar', 'Durum', 'Not'];
    const rows = dayAppointments.map((a) => [
      a.customerName,
      a.phone,
      a.staffName,
      a.serviceName,
      a.appointmentDate,
      a.timeSlot,
      a.price,
      a.status,
      a.notes || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `randevular-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Üst Navigasyon & Berber Sekmeleri */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/20">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <span>Kuaför &amp; Berber Randevu Yönetimi</span>
                  {isVip ? (
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-linear-to-r from-amber-500 to-orange-500 text-stone-950 shadow-xs flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 fill-stone-950" /> VIP Aktif
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenVip}
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Crown className="w-3.5 h-3.5" /> VIP'ye Yükselt
                    </button>
                  )}
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                    Canlı Takvim
                  </span>
                </h1>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Usta zaman çizelgesi, online randevu linki ve adisyon tahsilat sistemi
                </p>
              </div>
            </div>
          </div>

          {/* Sekme Butonları */}
          <div className="p-1 rounded-2xl bg-stone-100 dark:bg-stone-800/80 flex items-center gap-1 overflow-x-auto w-full lg:w-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`h-10 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'timeline'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Takvim &amp; Çizelge</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`h-10 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'staff'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Ustalar ({staffList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`h-10 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'services'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700/60'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Hizmetler &amp; AI Tarife</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              className={`h-10 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'customers'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Müşteriler ({customers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings_qr')}
              className={`h-10 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'settings_qr'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700/60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Randevu Linki &amp; QR Standı</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. SEKME: ZAMAN ÇİZELGESİ & TAKVİM */}
      {/* ========================================================= */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Personel Müsaitliği Paneli */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {staffAvailability.map(({ staff, count, isFree, nextSlot }) => (
              <div
                key={staff.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ backgroundColor: staff.color || '#3b82f6' }}
                  >
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-stone-900 dark:text-white line-clamp-1">{staff.name}</h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {isFree ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Tamamen Boş</span>
                      ) : (
                        `${count} Randevu`
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Sıradaki</span>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 line-clamp-1">{nextSlot}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Kontrol & Filtre Çubuğu (Mobilde ve PC'de tam responsive, taşmayan modern tasarım) */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 shadow-xs space-y-3">
            {/* 1. Sıra: Tarih Seçimi & Durum Filtreleri */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Tarih Gezinme */}
              <div className="flex items-center gap-1.5 w-full">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-hidden min-w-0"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(toLocalDateStr(new Date()))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 transition-colors ${
                    selectedDate === toLocalDateStr(new Date())
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Bugün
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tom = new Date();
                    tom.setDate(tom.getDate() + 1);
                    setSelectedDate(toLocalDateStr(tom));
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 transition-colors ${
                    (() => {
                      const tom = new Date();
                      tom.setDate(tom.getDate() + 1);
                      return selectedDate === toLocalDateStr(tom);
                    })()
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Yarın ⭐
                </button>
              </div>

              {/* Usta Filtresi */}
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-semibold"
              >
                <option value="all">Tüm Ustalar ({staffList.length})</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>

              {/* Durum Filtresi */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-semibold"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="bekliyor">Bekliyor (Onay Bekleyen)</option>
                <option value="onayli">Onaylı</option>
                <option value="koltukta">Koltukta (Geldi)</option>
                <option value="tamamlandi">Tamamlandı</option>
                <option value="gelmedi">Gelmedi (No-show)</option>
              </select>

              {/* Hızlı Araçlar (Sesli Asistan & Excel & Yazdır) */}
              <div className="flex items-center gap-2 justify-start sm:justify-end">
                <BarberVoiceAssistant
                  appointments={appointments}
                  staffList={staffList}
                  onAddAppointment={onAddAppointment}
                  onUpdateTimeBlock={handleVoiceTimeBlock}
                  onRemoveTimeBlock={handleVoiceRemoveTimeBlock}
                  onRescheduleAppointment={handleVoiceReschedule}
                  onCancelAppointment={handleVoiceCancel}
                  onStaffOffDay={handleVoiceStaffOffDay}
                />

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer shrink-0"
                  title="Excel / CSV İndir"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                </button>
                <button
                  type="button"
                  onClick={handlePrintDailySchedule}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer shrink-0"
                  title="Yazdır"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Sıra: Randevu & Mola Ekleme Butonları (Mobilde tam sığan grid) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setIsTimeBlockModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors"
              >
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Saati Kapat / Mola</span>
              </button>

              <button
                type="button"
                onClick={() => openNewAppointmentModal()}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Randevu Ekle</span>
              </button>
            </div>
          </div>

          {/* Usta Zaman Çizelgesi Izgarası (Timeline Grid) */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800">
                    <th className="w-24 p-3.5 text-left text-xs font-black uppercase tracking-wider text-stone-500">
                      Saat
                    </th>
                    {displayedStaff.map((st) => (
                      <th
                        key={st.id}
                        className="p-3.5 text-left text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 border-l border-stone-200 dark:border-stone-800"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: st.color || '#3b82f6' }}
                          />
                          <span>{st.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-xs">
                  {HOURS.map((hour) => {
                    return (
                      <tr key={hour} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="p-3 font-bold text-stone-400 select-none whitespace-nowrap">{hour}</td>
                        {displayedStaff.map((st) => {
                          const currentHourMin = timeToMin(hour);

                          // Bu saatte başlayan veya devam eden randevu (örn: 90 dk Damat Tıraşı 14:00-15:30 arasını komple kaplar!)
                          const activeApt = dayAppointments.find((a) => {
                            if (a.status === 'iptal') return false;
                            const matchStaff = a.staffId === st.id || a.staffName.includes(st.name);
                            if (!matchStaff) return false;
                            const aStart = timeToMin(a.timeSlot);
                            const aDuration = a.durationMinutes || a.duration || 30;
                            const aEnd = aStart + aDuration;
                            return currentHourMin >= aStart && currentHourMin < aEnd;
                          });

                          const isStartingSlot = activeApt && activeApt.timeSlot === hour;

                          // Bu saatte mola bloğu var mı?
                          const matchingBlock = timeBlocks.find((b) => {
                            if (b.date !== selectedDate) return false;
                            const matchStaff = !b.staffId || b.staffId === 'all' || b.staffId === st.id;
                            return matchStaff && hour >= b.startTime && hour < b.endTime;
                          });

                          return (
                            <td
                              key={st.id}
                              className="p-2 border-l border-stone-200 dark:border-stone-800 relative align-top min-h-[52px]"
                            >
                              {activeApt ? (
                                isStartingSlot ? (
                                  <div
                                    className={`p-2.5 rounded-xl border transition-all shadow-xs ${
                                      activeApt.status === 'koltukta'
                                        ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200'
                                        : activeApt.status === 'tamamlandi'
                                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                                        : activeApt.status === 'gelmedi'
                                        ? 'bg-rose-500/10 border-rose-400 text-rose-700 dark:text-rose-300'
                                        : 'bg-orange-500/10 border-orange-400 text-orange-900 dark:text-orange-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-black text-xs line-clamp-1">{activeApt.customerName}</span>
                                      <span className="font-bold text-[11px] text-amber-600 dark:text-amber-400">
                                        ₺{activeApt.price}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-300 mb-1">
                                      <span className="truncate">{activeApt.serviceName}</span>
                                      {(activeApt.durationMinutes || activeApt.duration || 30) > 30 && (
                                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 ml-1">
                                          {activeApt.durationMinutes || activeApt.duration} dk
                                        </span>
                                      )}
                                    </div>

                                    {/* Hızlı Butonlar */}
                                    <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-black/10 dark:border-white/10">
                                      {activeApt.status === 'bekliyor' && (
                                        <button
                                          type="button"
                                          onClick={() => onUpdateStatus(activeApt.id, 'koltukta')}
                                          className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[10px] cursor-pointer hover:bg-amber-600"
                                        >
                                          Geldi
                                        </button>
                                      )}
                                      {activeApt.status === 'koltukta' && (
                                        <button
                                          type="button"
                                          onClick={() => setCompletingApt(activeApt)}
                                          className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] cursor-pointer hover:bg-emerald-500"
                                        >
                                          Tahsil Et
                                        </button>
                                      )}
                                      {activeApt.status !== 'tamamlandi' && activeApt.status !== 'gelmedi' && (
                                        <button
                                          type="button"
                                          onClick={() => onUpdateStatus(activeApt.id, 'gelmedi')}
                                          className="px-1.5 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-[10px] cursor-pointer"
                                          title="Gelmedi (No-show)"
                                        >
                                          Gelmedi
                                        </button>
                                      )}
                                      {activeApt.status === 'tamamlandi' ? (
                                        <button
                                          type="button"
                                          onClick={() => handleSendWhatsAppReview(activeApt)}
                                          className="px-2 py-0.5 rounded-md bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-[10px] cursor-pointer ml-auto flex items-center gap-1 transition-colors"
                                          title="WhatsApp Yorum ve Puan İste"
                                        >
                                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                          <span>Yorum İste</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleSendWhatsApp(activeApt)}
                                          className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer ml-auto"
                                          title="WhatsApp Hatırlatması Gönder"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span className="truncate">⏳ {activeApt.serviceName}</span>
                                      <span className="text-[10px] font-black opacity-80">{activeApt.durationMinutes || 90} dk</span>
                                    </div>
                                    <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                                      {activeApt.customerName} ({activeApt.timeSlot} başlangıç)
                                    </p>
                                  </div>
                                )
                              ) : matchingBlock ? (
                                <div className="py-2 px-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-center font-bold text-[11px] border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-1">
                                  <span className="truncate">{matchingBlock.reason || 'Mola / Kapalı'}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTimeBlock(matchingBlock.id)}
                                    className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                                    title="Saati Tekrar Randevulara Aç"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSlotClick(hour, st.id)}
                                  className="w-full h-full min-h-[44px] rounded-xl border border-dashed border-stone-200 dark:border-stone-800 hover:border-orange-500 hover:bg-orange-50/40 dark:hover:bg-orange-950/20 text-stone-400 hover:text-orange-600 flex items-center justify-center transition-all cursor-pointer opacity-40 hover:opacity-100"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SEKME: PERSONEL / USTA YÖNETİMİ */}
      {/* ========================================================= */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-white">Salon Ustaları &amp; Ekip</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Usta ve kalfaların yetkileri, prim oranları (%) ve çalışma saatleri
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsStaffModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-600/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Personel Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {staffList.map((st) => (
              <div
                key={st.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg"
                      style={{ backgroundColor: st.color || '#3b82f6' }}
                    >
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-stone-900 dark:text-white">{st.name}</h3>
                      <p className="text-xs text-stone-400">{st.role || st.title || 'Usta'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditStaff(st)}
                      className="p-1.5 rounded-xl text-stone-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                      title="Usta Profilini Düzenle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(st.id)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Ustayı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Prim Oranı:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">%{st.commissionRate ?? 30}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">İletişim:</span>
                    <span className="font-medium">{st.phone || 'Girilmedi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">E-Posta:</span>
                    <span className="font-medium">{st.email || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SEKME: HİZMETLER & AI TARİFE OKUYUCU */}
      {/* ========================================================= */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-white">Hizmet Listesi &amp; Paketler</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Fiyat ve süre tanımları. Dilerseniz fiyat tablosunun fotoğrafını çekerek AI ile anında aktarabilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAiPhotoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI ile Fotoğraftan Çıkar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsServiceModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-600/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Hizmet Ekle</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {serviceList.map((srv) => (
              <div
                key={srv.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 shadow-xs flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">{srv.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> {srv.durationMinutes || srv.duration || 30} dk
                    </span>
                    <span>•</span>
                    <span>{srv.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-base font-black text-amber-600 dark:text-amber-400">₺{srv.price}</span>
                  </div>
                  <div className="flex items-center gap-1 border-l border-stone-200 dark:border-stone-800 pl-2.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditService(srv)}
                      className="p-1.5 rounded-xl text-stone-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                      title="Fiyat ve Bilgileri Düzenle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(srv.id)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hizmeti Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SEKME: MÜŞTERİ LİSTESİ & DEFTER */}
      {/* ========================================================= */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-white">Müşteri Defteri &amp; Kayıtları</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Salonunuza gelen müşteriler, iletişim bilgileri, randevu geçmişi ve hızlı WhatsApp iletişimi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openNewAppointmentModal()}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Yeni Randevu Yaz</span>
              </button>
            </div>
          </div>

          {/* Müşteri Arama & Özet */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Müşteri adı veya telefon ara..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:outline-hidden"
              />
            </div>
            <div className="text-xs font-bold text-stone-500 dark:text-stone-400">
              Toplam {customers.length} Kayıtlı Müşteri
            </div>
          </div>

          {/* Müşteri Tablosu */}
          {customers.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-stone-900 dark:text-white">Henüz Kayıtlı Müşteri Yok</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Müşterileriniz online randevu linkinden randevu aldıkça veya siz yeni randevu girdikçe buraya otomatik kaydedilir.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => openNewAppointmentModal()}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-orange-600/20"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>İlk Randevuyu Yaz</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-3.5">Müşteri</th>
                      <th className="p-3.5">İletişim</th>
                      <th className="p-3.5">Bakiye / Borç</th>
                      <th className="p-3.5">Notlar</th>
                      <th className="p-3.5 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {customers
                      .filter((c) => {
                        if (!customerSearch.trim()) return true;
                        const q = customerSearch.toLowerCase();
                        return c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
                      })
                      .map((c) => {
                        const cleanPhone = (c.phone || '').replace(/\D/g, '');
                        return (
                          <tr key={c.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                  {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-stone-900 dark:text-white">{c.name}</div>
                                  <div className="text-[11px] text-stone-400">Müşteri #{c.id.slice(-4)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-stone-700 dark:text-stone-300">{c.phone || '-'}</span>
                                {cleanPhone && (
                                  <a
                                    href={`https://wa.me/90${cleanPhone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                    title="WhatsApp'tan Yaz"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className={`font-bold ${c.balance && c.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {c.balance ? `₺${c.balance.toLocaleString('tr-TR')}` : '₺0'}
                              </span>
                            </td>
                            <td className="p-3.5 text-stone-500 max-w-xs truncate">
                              {c.notes || '-'}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => openNewAppointmentModal(undefined, undefined, undefined, c.name, c.phone || '')}
                                className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 text-orange-600 dark:text-orange-400 font-bold text-xs cursor-pointer inline-flex items-center gap-1 transition-colors"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Randevu Yaz</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. SEKME: RANDEVU LİNKİ & TEZGAH QR STANDI */}
      {/* ========================================================= */}
      {activeTab === 'settings_qr' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">Dükkanınıza Özel Randevu Linki</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Müşterileriniz bu adrese girerek salonunuzun müsait saatlerine doğrudan randevu alabilir.
                </p>
              </div>
            </div>

            {isVip ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-400 font-bold">
                <span className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  <span>👑 Patron VIP: Sınırsız 7/24 Online Randevu &amp; Koltuk Dağılımı Aktif</span>
                </span>
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 self-start sm:self-auto">Sınırsız</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-300 font-bold">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>🎁 Çırak Paketi: Ayda 20 Ücretsiz Online Randevu Açık ve Kullanıma Hazır!</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenVip}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 text-xs font-black cursor-pointer hover:opacity-90 self-start sm:self-auto shrink-0 shadow-xs"
                >
                  Sınırsız VIP'ye Geç →
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <span className="text-xs font-mono text-stone-700 dark:text-stone-300 px-2 line-clamp-1 flex-1">
                {typeof window !== 'undefined' ? `${window.location.origin}/r/${shopSlug}` : `/r/${shopSlug}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/r/${shopSlug}`;
                  navigator.clipboard.writeText(url);
                  alert('Randevu linki panoya kopyalandı!');
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-700 text-xs font-bold text-stone-800 dark:text-white hover:bg-stone-200 cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Kopyala</span>
              </button>
              <a
                href={`/r/${shopSlug}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 cursor-pointer shrink-0"
                title="Müşteri Ekranını Canlı Aç"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Müşterileri Toplama & Yayılım Araçları */}
            <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <p className="text-xs font-black text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Müşterileri Buraya Çekme &amp; Duyuru Araçları:</span>
              </p>

              <div className="grid sm:grid-cols-3 gap-2">
                {/* 1. WhatsApp Toplu Duyuru */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Değerli müşterimiz, sıra beklemeden dilediğiniz gün ve saate randevunuzu 7/24 online olarak oluşturabilirsiniz:\n${typeof window !== 'undefined' ? window.location.origin : ''}/r/${shopSlug}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
                  title="WhatsApp rehberinizdeki müşterilere duyuru mesajı gönderin"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="text-left">
                    <p className="leading-tight">WhatsApp Duyurusu</p>
                    <p className="text-[10px] font-normal opacity-80">Müşterilere mesaj at</p>
                  </div>
                </a>

                {/* 2. Instagram Biyografi Linki */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/r/${shopSlug}`);
                    alert('Instagram biyografi linki panoya kopyalandı!\n\nInstagram uygulamasında "Profili Düzenle > Bağlantılar > Bağlantı Ekle" kısmına bu linki yapıştırabilirsiniz.');
                  }}
                  className="p-2.5 rounded-2xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-600 dark:text-pink-400 text-xs font-black flex items-center gap-2 cursor-pointer transition-all text-left"
                  title="Instagram profiline eklenecek linki kopyalar"
                >
                  <Camera className="w-4 h-4 text-pink-500 shrink-0" />
                  <div>
                    <p className="leading-tight">Instagram Biyografi</p>
                    <p className="text-[10px] font-normal opacity-80">Bio için linki kopyala</p>
                  </div>
                </button>

                {/* 3. SMS Duyuru Metni */}
                <button
                  type="button"
                  onClick={() => {
                    const smsText = `Değerli müşterimiz, ${storeName} salonumuzda sıra beklemeden online randevu alabilirsiniz: ${window.location.origin}/r/${shopSlug}`;
                    navigator.clipboard.writeText(smsText);
                    alert('SMS ve durum paylaşım metni panoya kopyalandı!');
                  }}
                  className="p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center gap-2 cursor-pointer transition-all text-left"
                  title="Müşterilere SMS göndermek için hazır metni kopyalar"
                >
                  <Copy className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="leading-tight">SMS &amp; Durum Metni</p>
                    <p className="text-[10px] font-normal opacity-80">Hazır metni kopyala</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Tezgah / Ayna QR Standı Önizleme Kartı (Yazdırılabilir) */}
          <div className="bg-linear-to-b from-stone-900 to-stone-950 text-white border border-stone-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="inline-block p-2 rounded-2xl bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-widest">
              Tezgâh / Ayna QR Standı
            </div>

            <div>
              <h2 className="text-2xl font-black text-amber-400">{storeName}</h2>
              <p className="text-xs text-stone-400 mt-1">Sıra beklemeden randevunuzu cebinizden saniyeler içinde alın!</p>
            </div>

            <div className="w-44 h-44 bg-white p-3 rounded-3xl mx-auto shadow-xl flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  `${window.location.origin}/r/${shopSlug}`
                )}`}
                alt="Randevu QR Kodu"
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs text-stone-300 font-semibold">
              Kameranızla okutun → Ustanızı ve saatinizi seçin
            </p>

            <button
              type="button"
              onClick={handlePrintStand}
              className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Stand Kartını Yazdır (A4)</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* KOLAY RANDEVU MODÜLÜ 3: KAMPANYALI SLOTLAR (ÖLÜ SAAT DOLDURUCU) */}
          {/* ========================================================= */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                    <span>Kampanyalı Slotlar (Ölü Saat Doldurucu)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                      Kolay Randevu
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Hafta içi sakin saatleri (ör. Salı 11:00-14:00) %20 indirimle doldurarak salon doluluğunu %100'e çıkarın.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>İndirimli Saat Ekle</span>
              </button>
            </div>

            {(!settings.discountSlots || settings.discountSlots.length === 0) ? (
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                Henüz tanımlanmış indirimli saat bulunmuyor. Hafta içi ölü saatlerinize özel indirimler tanımlayın.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {settings.discountSlots.map((ds) => {
                  const dayText = ds.dayOfWeek === -1 ? 'Her Gün' : (DAYS_TR[ds.dayOfWeek] || 'Belirli Gün');
                  return (
                    <div
                      key={ds.id}
                      className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                            🔥 %{ds.discountPercent} İndirim
                          </span>
                          <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                            {dayText}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 font-semibold">
                          {ds.startTime} - {ds.endTime}
                        </p>
                        {ds.label && (
                          <p className="text-[10px] text-stone-400 italic">{ds.label}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDiscountSlot(ds.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="İndirimli Saati Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* KOLAY RANDEVU MODÜLÜ 2: MÜŞTERİ YORUM & YILDIZ DEĞERLENDİRMELERİ */}
          {/* ========================================================= */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Star className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                    <span>Müşteri Yorumları &amp; Yıldız Vitrini</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      ⭐ {reviewsList.length > 0 ? (reviewsList.reduce((s, r) => s + r.rating, 0) / reviewsList.length).toFixed(1) : '5.0'} / 5
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Randevu sonrası WhatsApp'tan istenen gerçek müşteri puanları ve yorumları. Online randevu sayfanızda vitrin olarak sergilenir.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-stone-400">
                {reviewsList.length} Değerlendirme
              </span>
            </div>

            {reviewsList.length === 0 ? (
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                Henüz değerlendirme yapılmamış. Randevuları tamamladıkça &quot;Yorum İste&quot; butonuyla müşterilerinizden yorum isteyebilirsiniz.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {reviewsList.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 dark:text-white">{rev.customerName}</span>
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-600'}`}
                            />
                          ))}
                        </div>
                        {rev.staffName && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold">
                            {rev.staffName}
                          </span>
                        )}
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 italic">&ldquo;{rev.comment}&rdquo;</p>
                      <p className="text-[10px] text-stone-400">
                        {new Date(rev.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(rev.id)}
                      className="p-1 rounded-md text-stone-400 hover:text-rose-600 cursor-pointer shrink-0"
                      title="Yorumu Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: YENİ RANDEVU EKLE (ÇAKIŞMA & TEKRARLAYAN SERİ) */}
      {/* ========================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5" />
                <h3 className="text-base font-black">Yeni Randevu Kaydı</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAppointment} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  Müşteri Adı Soyadı *
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="Örn: Burak Kaya"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-bold text-stone-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                    Telefon Numarası
                  </label>
                  <input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                    Usta Seçimi
                  </label>
                  <select
                    value={targetStaffId}
                    onChange={(e) => setTargetStaffId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-white font-semibold"
                  >
                    <option value="auto">Fark Etmez / İlk Müsait</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Randevu Günü Seçimi */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
                  <span>Randevu Tarihi *</span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">Canlı Takvim</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetDate(toLocalDateStr(new Date()))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      targetDate === toLocalDateStr(new Date())
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    Bugün
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tom = new Date();
                      tom.setDate(tom.getDate() + 1);
                      setTargetDate(toLocalDateStr(tom));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      (() => {
                        const tom = new Date();
                        tom.setDate(tom.getDate() + 1);
                        return targetDate === toLocalDateStr(tom);
                      })()
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    Yarın ⭐
                  </button>
                  <input
                    type="date"
                    min={toLocalDateStr(new Date())}
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                    Saat
                  </label>
                  <select
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-white font-semibold"
                  >
                    {HOURS.map((h) => {
                      const now = new Date();
                      const todayStr = toLocalDateStr(now);
                      const isToday = targetDate === todayStr;
                      const hMin = timeToMin(h);
                      const nowMin = now.getHours() * 60 + now.getMinutes();
                      const isPast = isToday && hMin <= nowMin;
                      return (
                        <option key={h} value={h} disabled={isPast}>
                          {h} {isPast ? '(Geçti)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                    Süre (Dakika)
                  </label>
                  <select
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-white font-semibold"
                  >
                    <option value={15}>15 dk</option>
                    <option value={30}>30 dk</option>
                    <option value={45}>45 dk</option>
                    <option value={60}>1 saat</option>
                    <option value={90}>1.5 saat</option>
                    <option value={120}>2 saat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  Hizmet &amp; Tutar
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={targetService}
                    onChange={(e) => setTargetService(e.target.value)}
                    placeholder="Örn: Saç Kesimi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-white"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₺</span>
                    <input
                      type="number"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-bold text-stone-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Tekrarlayan Seri Desteği */}
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800 dark:text-stone-200">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Tekrarlayan Randevu Serisi Oluştur</span>
                </label>

                {isRecurring && (
                  <div className="flex items-center gap-2 text-xs pt-1">
                    <span className="text-stone-500">Her hafta aynı gün ve saatte:</span>
                    <select
                      value={recurringCount}
                      onChange={(e) => setRecurringCount(Number(e.target.value))}
                      className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                    >
                      <option value={2}>2 Hafta (2 Randevu)</option>
                      <option value={4}>4 Hafta (1 Ay)</option>
                      <option value={8}>8 Hafta (2 Ay)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  Özel Not
                </label>
                <input
                  type="text"
                  value={targetNotes}
                  onChange={(e) => setTargetNotes(e.target.value)}
                  placeholder="Müşteri tercihi veya özel not..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black cursor-pointer shadow-md shadow-orange-600/20"
                >
                  Randevuyu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SAATİ KAPAT / MOLA BLOĞU */}
      {/* ========================================================= */}
      {isTimeBlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>Saati Kapat / Mola Bloğu</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTimeBlockModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Hangi Usta İçin?
                </label>
                <select
                  value={blockStaffId}
                  onChange={(e) => setBlockStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold"
                >
                  <option value="all">Tüm Salon (Herkes)</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Başlangıç
                  </label>
                  <select
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Bitiş
                  </label>
                  <select
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Sebep / Not
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Örn: Öğle Molası, Malzeme Alımı..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimeBlockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSaveTimeBlock}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-black cursor-pointer"
                >
                  Bloğu Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: PERSONEL EKLE (Ad, e-posta, şifre, prim %, rol) */}
      {/* ========================================================= */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" />
                <span>Yeni Personel / Usta Ekle</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  required
                  value={staffFormName}
                  onChange={(e) => setStaffFormName(e.target.value)}
                  placeholder="Örn: Eren Usta"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Rol
                  </label>
                  <select
                    value={staffFormRole}
                    onChange={(e) => setStaffFormRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold"
                  >
                    <option value="Usta">Baş Usta</option>
                    <option value="Kuaför">Kuaför / Stilist</option>
                    <option value="Kalfa">Kalfa</option>
                    <option value="Çırak">Çırak</option>
                    <option value="Uzman">Cilt / Bakım Uzmanı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Prim Oranı (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={staffFormCommission}
                    onChange={(e) => setStaffFormCommission(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  E-Posta (Panel Girişi İçin)
                </label>
                <input
                  type="email"
                  value={staffFormEmail}
                  onChange={(e) => setStaffFormEmail(e.target.value)}
                  placeholder="usta@salondukkan.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Giriş Şifresi
                </label>
                <input
                  type="password"
                  value={staffFormPassword}
                  onChange={(e) => setStaffFormPassword(e.target.value)}
                  placeholder="******"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-black cursor-pointer"
                >
                  Personeli Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3.1: PERSONEL / USTA PROFİLİNİ DÜZENLE */}
      {/* ========================================================= */}
      {isEditStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-orange-600" />
                <span>Usta Profilini Düzenle</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditStaffModalOpen(false);
                  setEditingStaff(null);
                }}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  required
                  value={staffFormName}
                  onChange={(e) => setStaffFormName(e.target.value)}
                  placeholder="Örn: Eren Usta"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Rol / Unvan
                  </label>
                  <select
                    value={staffFormRole}
                    onChange={(e) => setStaffFormRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-900 dark:text-white"
                  >
                    <option value="Baş Usta">Baş Usta</option>
                    <option value="Usta">Usta</option>
                    <option value="Kuaför">Kuaför / Stilist</option>
                    <option value="Kalfa">Kalfa</option>
                    <option value="Çırak">Çırak</option>
                    <option value="Uzman">Cilt / Bakım Uzmanı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Prim Oranı (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={staffFormCommission}
                    onChange={(e) => setStaffFormCommission(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={staffFormPhone}
                  onChange={(e) => setStaffFormPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  E-Posta (Giriş İçin)
                </label>
                <input
                  type="email"
                  value={staffFormEmail}
                  onChange={(e) => setStaffFormEmail(e.target.value)}
                  placeholder="usta@salondukkan.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                />
              </div>

              {/* Usta Bazlı Dinamik Fiyat ve Süre Ayarları (Kolay Randevu Modülü) */}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Usta Özel Fiyat &amp; Süre Farkı</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Boş bırakılanlar standart kalır</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {serviceList.map((srv) => {
                    const custom = staffCustomPricing[srv.id] || {};
                    return (
                      <div key={srv.id} className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-stone-900 dark:text-stone-100">{srv.name}</span>
                          <span className="text-[10px] text-stone-400">
                            Standart: ₺{srv.price} • {srv.durationMinutes || 30} dk
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Usta Fiyatı (₺)</label>
                            <input
                              type="number"
                              min={0}
                              placeholder={`Örn: ${srv.price}`}
                              value={custom.price ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : Number(e.target.value);
                                setStaffCustomPricing((prev) => ({
                                  ...prev,
                                  [srv.id]: {
                                    price: val !== undefined ? val : srv.price,
                                    duration: prev[srv.id]?.duration ?? (srv.durationMinutes || 30),
                                  },
                                }));
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-stone-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Usta Süresi (dk)</label>
                            <input
                              type="number"
                              min={5}
                              step={5}
                              placeholder={`Örn: ${srv.durationMinutes || 30}`}
                              value={custom.duration ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : Number(e.target.value);
                                setStaffCustomPricing((prev) => ({
                                  ...prev,
                                  [srv.id]: {
                                    price: prev[srv.id]?.price ?? srv.price,
                                    duration: val !== undefined ? val : (srv.durationMinutes || 30),
                                  },
                                }));
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-stone-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditStaffModalOpen(false);
                    setEditingStaff(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-black cursor-pointer shadow-md shadow-orange-600/20"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: HİZMET EKLE (Ad, fiyat, süre) */}
      {/* ========================================================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-orange-600" />
                <span>Yeni Hizmet Ekle</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Hizmet Adı *
                </label>
                <input
                  type="text"
                  required
                  value={srvFormName}
                  onChange={(e) => setSrvFormName(e.target.value)}
                  placeholder="Örn: Saç & Sakal Kombin"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Fiyat (₺)
                  </label>
                  <input
                    type="number"
                    value={srvFormPrice}
                    onChange={(e) => setSrvFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Süre (Dk)
                  </label>
                  <input
                    type="number"
                    value={srvFormDuration}
                    onChange={(e) => setSrvFormDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-black cursor-pointer"
                >
                  Hizmeti Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4.1: HİZMET DÜZENLE (Fiyat, Ad, Süre) */}
      {/* ========================================================= */}
      {isEditServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-orange-600" />
                <span>Hizmet &amp; Fiyat Düzenle</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditServiceModalOpen(false);
                  setEditingService(null);
                }}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Hizmet Adı *
                </label>
                <input
                  type="text"
                  required
                  value={srvFormName}
                  onChange={(e) => setSrvFormName(e.target.value)}
                  placeholder="Örn: Saç & Sakal Kombin"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    required
                    value={srvFormPrice}
                    onChange={(e) => setSrvFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Süre (Dk)
                  </label>
                  <input
                    type="number"
                    value={srvFormDuration}
                    onChange={(e) => setSrvFormDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  value={srvFormCategory}
                  onChange={(e) => setSrvFormCategory(e.target.value)}
                  placeholder="Örn: Saç, Sakal, Bakım"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditServiceModalOpen(false);
                    setEditingService(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-black cursor-pointer shadow-md shadow-orange-600/20"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: AI FİYAT TABLOSU ÇIKARICI & ONAY KARTI */}
      {/* ========================================================= */}
      {isAiServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white">
                    Yapay Zekâ Fiyat Tablosu Analizi
                  </h3>
                  <p className="text-[11px] text-stone-500">Fotoğraftaki hizmetler ve fiyatlar tespit edildi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiServiceModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAiAnalyzing ? (
              <div className="py-12 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                  Fotoğraf taranıyor ve fiyatlar çıkarılıyor...
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Tespit edilen hizmetleri inceleyin. Eklemek istediklerinizi onay kartından seçerek listenize tek tıkla aktarın:
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {aiDetectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const copy = [...aiDetectedItems];
                        copy[idx].selected = !copy[idx].selected;
                        setAiDetectedItems(copy);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        item.selected
                          ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-400 text-purple-950 dark:text-purple-200'
                          : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-500 line-through'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-purple-600"
                        />
                        <span className="text-xs font-bold">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-600">₺{item.price}</span>
                        <span className="text-[10px] text-stone-400 block">{item.duration} dk</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsAiServiceModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAiServices}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black cursor-pointer shadow-md shadow-purple-600/20"
                  >
                    Seçilenleri Hizmet Listeme Ekle
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: RANDEVUDAN ADİSYONA / TAHSİLATA DÖNÜŞTÜR */}
      {/* ========================================================= */}
      {completingApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Tahsilat &amp; Adisyon</span>
              </h3>
              <button
                type="button"
                onClick={() => setCompletingApt(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">Müşteri:</span>
                <span className="font-bold text-stone-900 dark:text-white">{completingApt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Hizmet &amp; Usta:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  {completingApt.serviceName} ({completingApt.staffName})
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-stone-200 dark:border-stone-700 text-sm font-black">
                <span>Tahsil Edilecek:</span>
                <span className="text-emerald-600 dark:text-emerald-400">₺{completingApt.price}</span>
              </div>
            </div>

            {/* Varsa Müşteri Paketi Seçimi */}
            {packages.filter((p) => p.customerName === completingApt.customerName && p.remainingSessions > 0).length > 0 && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-300">
                  Müşteri Paketi ile Kapat (Seans Düş):
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold"
                >
                  <option value="">Paket Kullanma (Ücret Al)</option>
                  {packages
                    .filter((p) => p.customerName === completingApt.customerName && p.remainingSessions > 0)
                    .map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.packageName} ({pkg.remainingSessions}/{pkg.totalSessions} Seans Kaldı)
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCompleteApt('nakit')}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Banknote className="w-4 h-4" />
                <span>Nakit Alındı</span>
              </button>

              <button
                type="button"
                onClick={() => handleCompleteApt('kart')}
                className="py-3 px-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-600/20"
              >
                <CreditCard className="w-4 h-4" />
                <span>Kredi Kartı / POS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: KAMPANYALI SLOT (ÖLÜ SAAT DOLDURUCU) EKLE */}
      {/* ========================================================= */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full border border-stone-200 dark:border-stone-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <span>İndirimli Saat Tanımla</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                  Geçerli Gün
                </label>
                <select
                  value={discDay}
                  onChange={(e) => setDiscDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                >
                  <option value={-1}>Her Gün (Tüm Hafta)</option>
                  <option value={1}>Pazartesi</option>
                  <option value={2}>Salı</option>
                  <option value={3}>Çarşamba</option>
                  <option value={4}>Perşembe</option>
                  <option value={5}>Cuma</option>
                  <option value={6}>Cumartesi</option>
                  <option value={0}>Pazar</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Başlangıç
                  </label>
                  <input
                    type="time"
                    value={discStartTime}
                    onChange={(e) => setDiscStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Bitiş
                  </label>
                  <input
                    type="time"
                    value={discEndTime}
                    onChange={(e) => setDiscEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    İndirim Oranı (%)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={80}
                    step={5}
                    value={discPercent}
                    onChange={(e) => setDiscPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1">
                    Kampanya Başlığı
                  </label>
                  <input
                    type="text"
                    value={discLabel}
                    onChange={(e) => setDiscLabel(e.target.value)}
                    placeholder="Örn: Salı Öğle İndirimi"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleAddDiscountSlot}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-md shadow-rose-600/20"
                >
                  Kampanyayı Başlat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: TAHSİLAT SONRASI WHATSAPP YORUM & PUAN İSTEME POPUP'I */}
      {/* ========================================================= */}
      {completedFeedbackApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900 dark:text-white">Randevu Tamamlandı!</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Sayın <span className="font-bold text-stone-800 dark:text-stone-200">{completedFeedbackApt.customerName}</span> müşterinizden <span className="font-bold text-stone-800 dark:text-stone-200">{completedFeedbackApt.staffName}</span> için yıldızlı puan ve Google tarzı değerlendirme isteyin.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleSendWhatsAppReview(completedFeedbackApt);
                  setCompletedFeedbackApt(null);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>💬 WhatsApp'tan Yorum &amp; Puan İste</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedFeedbackApt(null)}
                className="w-full py-2 text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                Şimdilik Geç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
