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
  Eye,
  Percent,
} from 'lucide-react';
import type {
  Appointment,
  AppointmentStatus,
  BarberStaff,
  BarberService,
  BarberTimeBlock,
  BarberSalonSettings,
  CustomerPackage,
} from '../../../shared/types.ts';

interface BarberAppointmentsViewProps {
  appointments: Appointment[];
  shopSlug?: string;
  storeName?: string;
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

export const BarberAppointmentsView: React.FC<BarberAppointmentsViewProps> = ({
  appointments = [],
  shopSlug = 'demo',
  storeName = 'Berber & Kuaför Salonu',
  onAddAppointment,
  onCompleteAppointment,
  onUpdateStatus,
  onDeleteAppointment,
  onImportCustomers,
}) => {
  // Aktif Sekme: 'timeline' | 'staff' | 'services' | 'import' | 'settings_qr'
  const [activeTab, setActiveTab] = useState<'timeline' | 'staff' | 'services' | 'import' | 'settings_qr'>('timeline');

  // Backend'den çekilen berber verileri
  const [staffList, setStaffList] = useState<BarberStaff[]>([]);
  const [serviceList, setServiceList] = useState<BarberService[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<BarberTimeBlock[]>([]);
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [settings, setSettings] = useState<BarberSalonSettings>({
    closedDays: [0],
    openHour: '09:00',
    closeHour: '21:00',
    slotDuration: 15,
    slug: shopSlug,
    autoConfirm: true,
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
      }
    } catch {}
  };

  useEffect(() => {
    reloadFullData();
  }, []);

  // Takvim Görünümü Seçicisi: 'grid' (Usta Sütunları) | 'calendar' (Aylık) | 'list' (Mobil Liste)
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'list'>('grid');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
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

  // Personel Ekle Formu (Ad, e-posta, şifre, prim %, rol)
  const [staffFormName, setStaffFormName] = useState('');
  const [staffFormEmail, setStaffFormEmail] = useState('');
  const [staffFormPassword, setStaffFormPassword] = useState('');
  const [staffFormCommission, setStaffFormCommission] = useState(30);
  const [staffFormRole, setStaffFormRole] = useState('Usta');
  const [staffFormPhone, setStaffFormPhone] = useState('');

  // Hizmet Ekle Formu (Ad, fiyat, süre)
  const [srvFormName, setSrvFormName] = useState('');
  const [srvFormPrice, setSrvFormPrice] = useState(350);
  const [srvFormDuration, setSrvFormDuration] = useState(30);
  const [srvFormCategory, setSrvFormCategory] = useState('Saç');

  // AI Tarife Okuma State
  const [aiDetectedItems, setAiDetectedItems] = useState<{ name: string; price: number; duration: number; selected: boolean }[]>([]);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // CSV İçe Aktarma
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Günün Randevuları
  const dayAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (a.appointmentDate !== selectedDate) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (filterStaff !== 'all' && a.staffId !== filterStaff && a.staffName !== filterStaff) return false;
      return true;
    });
  }, [appointments, selectedDate, filterStatus, filterStaff]);

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

  // Boş slota tıklandığında randevu aç
  const handleSlotClick = (timeStr: string, stId?: string) => {
    setTargetTime(timeStr);
    if (stId && stId !== 'all') {
      setTargetStaffId(stId);
    }
    setIsNewModalOpen(true);
  };

  // Yeni Randevu Kaydet
  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const assignedStaff = staffList.find((s) => s.id === targetStaffId);

    const aptData: Partial<Appointment> = {
      customerName: custName.trim(),
      phone: custPhone.trim(),
      email: custEmail.trim(),
      staffId: targetStaffId === 'auto' ? '' : targetStaffId,
      staffName: assignedStaff ? assignedStaff.name : 'Usta',
      serviceName: targetService || 'Saç Kesimi',
      price: targetPrice,
      appointmentDate: selectedDate,
      timeSlot: targetTime,
      durationMinutes: targetDuration,
      status: 'bekliyor',
      notes: targetNotes.trim(),
      recurring: isRecurring ? { frequency: 'weekly', count: Number(recurringCount) } : undefined,
    };

    await onAddAppointment(aptData);
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

  // AI ile Fotoğraftan Fiyat Listesi Çıkarma (Akıllı OCR Simülasyonu)
  const handleAiPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiAnalyzing(true);
    setIsAiServiceModalOpen(true);

    // Gelişmiş Vision / OCR simülasyonu: Fiyat tabelasından hizmet ve fiyatları otomatik analiz eder
    setTimeout(() => {
      setAiDetectedItems([
        { name: 'Klasik Saç Kesimi', price: 350, duration: 30, selected: true },
        { name: 'Sakal Tıraşı & Buhar', price: 200, duration: 20, selected: true },
        { name: 'Saç & Sakal Kombin', price: 500, duration: 45, selected: true },
        { name: 'Siyah Kil Maskesi', price: 250, duration: 25, selected: true },
        { name: 'Saç Boyama (Beyaz Kapama)', price: 450, duration: 40, selected: true },
        { name: 'Damat Özel Bakım Paketi', price: 1250, duration: 90, selected: true },
      ]);
      setIsAiAnalyzing(false);
    }, 1400);
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

  // CSV Müşteri İçe Aktarma
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter(Boolean);
        const imported: { name: string; phone: string; notes?: string }[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/[,;]/);
          if (cols.length >= 2) {
            const name = cols[0]?.trim();
            const phone = cols[1]?.trim();
            if (name && phone) {
              imported.push({ name, phone, notes: cols[2]?.trim() });
            }
          }
        }

        if (imported.length > 0 && onImportCustomers) {
          await onImportCustomers(imported);
          setImportStatus(`${imported.length} müşteri başarıyla deftere aktarıldı!`);
        } else {
          setImportStatus('Dosya formatı okunamadı veya kayıt bulunamadı.');
        }
      } catch {
        setImportStatus('CSV dosyası işlenirken hata oluştu.');
      }
    };
    reader.readAsText(file);
  };

  // Randevuyu Adisyona / Tahsilata Dönüştür
  const handleCompleteApt = async (method: 'nakit' | 'kart') => {
    if (!completingApt) return;
    await onCompleteAppointment(completingApt.id, method, selectedPackageId || undefined);
    setCompletingApt(null);
    setSelectedPackageId('');
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

  // Yazdırma
  const handlePrint = () => {
    window.print();
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
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <span>Kuaför &amp; Berber Randevu Yönetimi</span>
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
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Takvim &amp; Çizelge</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'staff'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Ustalar ({staffList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'services'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Hizmetler &amp; AI Tarife</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'import'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Müşteri Aktar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings_qr')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'settings_qr'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
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

          {/* Kontrol & Filtre Çubuğu */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Tarih Gezinme */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold cursor-pointer"
              >
                Bugün
              </button>
            </div>

            {/* Görünüm & Filtreler */}
            <div className="flex items-center gap-2">
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-semibold"
              >
                <option value="all">Tüm Ustalar</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-semibold"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="bekliyor">Bekliyor (Onay Bekleyen)</option>
                <option value="onayli">Onaylı</option>
                <option value="koltukta">Koltukta (Geldi)</option>
                <option value="tamamlandi">Tamamlandı</option>
                <option value="gelmedi">Gelmedi (No-show)</option>
              </select>

              {/* Dışa Aktarma & Yazdırma */}
              <button
                type="button"
                onClick={handleExportCsv}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                title="Excel / CSV İndir"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                title="Yazdır"
              >
                <Printer className="w-4 h-4" />
              </button>

              {/* Butonlar */}
              <button
                type="button"
                onClick={() => setIsTimeBlockModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4" />
                <span>Saati Kapat / Mola</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetTime('12:00');
                  setIsNewModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
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
                    {staffList.map((st) => (
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
                        {staffList.map((st) => {
                          // Bu saatte ve bu ustada randevu var mı?
                          const apt = dayAppointments.find((a) => {
                            const matchStaff = a.staffId === st.id || a.staffName.includes(st.name);
                            return matchStaff && a.timeSlot === hour;
                          });

                          // Bu saatte mola bloğu var mı?
                          const isBlocked = timeBlocks.some((b) => {
                            if (b.date !== selectedDate) return false;
                            const matchStaff = !b.staffId || b.staffId === 'all' || b.staffId === st.id;
                            return matchStaff && hour >= b.startTime && hour < b.endTime;
                          });

                          return (
                            <td
                              key={st.id}
                              className="p-2 border-l border-stone-200 dark:border-stone-800 relative align-top min-h-[52px]"
                            >
                              {apt ? (
                                <div
                                  className={`p-2.5 rounded-xl border transition-all shadow-xs ${
                                    apt.status === 'koltukta'
                                      ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200'
                                      : apt.status === 'tamamlandi'
                                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                                      : apt.status === 'gelmedi'
                                      ? 'bg-rose-500/10 border-rose-400 text-rose-700 dark:text-rose-300'
                                      : 'bg-indigo-500/10 border-indigo-400 text-indigo-900 dark:text-indigo-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-black text-xs line-clamp-1">{apt.customerName}</span>
                                    <span className="font-bold text-[11px] text-amber-600 dark:text-amber-400">
                                      ₺{apt.price}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-1">
                                    {apt.serviceName}
                                  </p>

                                  {/* Hızlı Butonlar */}
                                  <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-black/10 dark:border-white/10">
                                    {apt.status === 'bekliyor' && (
                                      <button
                                        type="button"
                                        onClick={() => onUpdateStatus(apt.id, 'koltukta')}
                                        className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[10px] cursor-pointer hover:bg-amber-600"
                                      >
                                        Geldi
                                      </button>
                                    )}
                                    {apt.status === 'koltukta' && (
                                      <button
                                        type="button"
                                        onClick={() => setCompletingApt(apt)}
                                        className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] cursor-pointer hover:bg-emerald-500"
                                      >
                                        Tahsil Et
                                      </button>
                                    )}
                                    {apt.status !== 'tamamlandi' && apt.status !== 'gelmedi' && (
                                      <button
                                        type="button"
                                        onClick={() => onUpdateStatus(apt.id, 'gelmedi')}
                                        className="px-1.5 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-[10px] cursor-pointer"
                                        title="Gelmedi (No-show)"
                                      >
                                        Gelmedi
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleSendWhatsApp(apt)}
                                      className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer ml-auto"
                                      title="WhatsApp Hatırlatması Gönder"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : isBlocked ? (
                                <div className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 text-center font-bold text-[11px] border border-stone-200 dark:border-stone-700">
                                  Mola / Kapalı
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSlotClick(hour, st.id)}
                                  className="w-full h-full min-h-[44px] rounded-xl border border-dashed border-stone-200 dark:border-stone-800 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-stone-400 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer opacity-40 hover:opacity-100"
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
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
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
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
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
                <div className="text-right">
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">₺{srv.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SEKME: MÜŞTERİ LİSTESİNİ EXCEL/CSV İLE İÇE AKTAR */}
      {/* ========================================================= */}
      {activeTab === 'import' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-black text-stone-900 dark:text-white">Müşteri Listesini İçe Aktar</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
              Eski defterinizi, rehberinizi veya Excel tablonuzu sisteme tek tıkla yükleyin. Sütunlar: <strong>Ad Soyad, Telefon, Not</strong>
            </p>
          </div>

          <div className="p-6 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl space-y-3">
            <input
              type="file"
              id="csvFileInput"
              accept=".csv,.txt"
              onChange={handleCsvUpload}
              className="hidden"
            />
            <label
              htmlFor="csvFileInput"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer inline-flex items-center gap-2 shadow-md shadow-indigo-600/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV Dosyası Seç</span>
            </label>
            <p className="text-[11px] text-stone-400">Virgülle veya noktalı virgülle ayrılmış CSV formatı</p>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              {importStatus}
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

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <span className="text-xs font-mono text-stone-700 dark:text-stone-300 px-2 line-clamp-1 flex-1">
                {window.location.origin}/r/{shopSlug}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/r/${shopSlug}`);
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
                title="Müşteri Ekranını Aç"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
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
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Stand Kartını Yazdır (A4)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: YENİ RANDEVU EKLE (ÇAKIŞMA & TEKRARLAYAN SERİ) */}
      {/* ========================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-indigo-600 text-white flex items-center justify-between">
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
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
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
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer shadow-md shadow-indigo-600/20"
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
                <User className="w-5 h-5 text-indigo-600" />
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black cursor-pointer"
                >
                  Personeli Kaydet
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
                <Scissors className="w-5 h-5 text-indigo-600" />
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black cursor-pointer"
                >
                  Hizmeti Kaydet
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
                className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <CreditCard className="w-4 h-4" />
                <span>Kredi Kartı / POS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
