import React, { useState, useMemo } from 'react';
import {
  Scissors,
  Calendar,
  Clock,
  User,
  Phone,
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
  Filter,
} from 'lucide-react';
import { Appointment } from '../types';

interface BarberAppointmentsViewProps {
  appointments: Appointment[];
  onAddAppointment: (data: Partial<Appointment>) => Promise<void>;
  onCompleteAppointment: (id: string, paymentMethod: 'nakit' | 'kart') => Promise<void>;
  onUpdateStatus: (id: string, status: Appointment['status']) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onFastWalkinCash: (serviceName: string, price: number, staffName: string) => Promise<void>;
}

const COMMON_SERVICES = [
  { name: 'Saç Kesimi & Yıkama', price: 250 },
  { name: 'Saç & Sakal Tıraşı', price: 350 },
  { name: 'Sakal Düzeltme & Bakım', price: 150 },
  { name: 'Damat Tıraşı & Komple Bakım', price: 750 },
  { name: 'Çocuk Saç Kesimi', price: 180 },
  { name: 'Saç Boyama & Cilt Maskesi', price: 450 },
];

const STAFF_LIST = [
  'Ahmet Usta (Koltuk 1)',
  'Mehmet Kalfa (Koltuk 2)',
  'Ali Çırak (Yıkama & Fön)',
];

export const BarberAppointmentsView: React.FC<BarberAppointmentsViewProps> = ({
  appointments,
  onAddAppointment,
  onCompleteAppointment,
  onUpdateStatus,
  onDeleteAppointment,
  onFastWalkinCash,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'bekliyor' | 'koltukta' | 'tamamlandi'>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);

  // New Appointment Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [staffName, setStaffName] = useState(STAFF_LIST[0]);
  const [serviceName, setServiceName] = useState(COMMON_SERVICES[0].name);
  const [price, setPrice] = useState(COMMON_SERVICES[0].price);
  const [timeSlot, setTimeSlot] = useState('14:00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (filterStatus === 'all') return true;
      return apt.status === filterStatus;
    });
  }, [appointments, filterStatus]);

  // Koltuk (Chair) Statuses
  const chairs = useMemo(() => {
    return STAFF_LIST.map((staff, idx) => {
      const activeOccupant = appointments.find(
        (a) => a.staffName === staff && a.status === 'koltukta'
      );
      const nextAppointment = appointments.find(
        (a) => a.staffName === staff && a.status === 'bekliyor'
      );

      return {
        id: `chair_${idx + 1}`,
        name: `Koltuk ${idx + 1}`,
        staff,
        isOccupied: !!activeOccupant,
        occupant: activeOccupant,
        next: nextAppointment,
      };
    });
  }, [appointments]);

  // Metrics
  const todayTotal = appointments.length;
  const inChairCount = appointments.filter((a) => a.status === 'koltukta').length;
  const completedCount = appointments.filter((a) => a.status === 'tamamlandi').length;
  const totalRevenue = appointments
    .filter((a) => a.status === 'tamamlandi')
    .reduce((sum, a) => sum + (a.price || 0), 0);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddAppointment({
        customerName: customerName.trim(),
        phone: phone.trim(),
        staffName,
        serviceName,
        price: Number(price) || 250,
        timeSlot,
        status: 'bekliyor',
        notes: notes.trim(),
      });
      setIsNewModalOpen(false);
      setCustomerName('');
      setPhone('');
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsAppReminder = (apt: Appointment) => {
    const cleanPhone = apt.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('90')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `90${cleanPhone.substring(1)}`
      : `90${cleanPhone}`;

    const text = `Merhaba ${apt.customerName}, kuaför/berber randevunuz bugün saat ${apt.timeSlot} için planlanmıştır (${apt.serviceName} - ${apt.staffName}). Görüşmek üzere, hayırlı günler dileriz!`;
    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Scissors className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
              Kuaför & Berber Randevu Panosu
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Koltuk durumları, müşteri randevu sırası ve tek tıkla kasaya tahsilat aktarımı.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Randevu Yaz</span>
          </button>
        </div>
      </div>

      {/* Canlı Koltuk Takibi (Chairs Live Status) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {chairs.map((chair) => (
          <div
            key={chair.id}
            className={`p-4 rounded-2xl border transition-all ${
              chair.isOccupied
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-xs'
                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    chair.isOccupied
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  <Armchair className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">{chair.name}</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{chair.staff}</p>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  chair.isOccupied
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {chair.isOccupied ? 'Koltuk Dolu' : 'Koltuk Boş'}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800/60">
              {chair.isOccupied && chair.occupant ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {chair.occupant.customerName}
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {chair.occupant.price} ₺
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                    {chair.occupant.serviceName}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCompletingApt(chair.occupant!)}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Tıraş Bitti, Tahsil Et</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-stone-400 dark:text-stone-500 py-1">
                  {chair.next ? (
                    <span className="flex items-center gap-1 text-stone-600 dark:text-stone-300 font-medium">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      Sıradaki: {chair.next.timeSlot} - {chair.next.customerName}
                    </span>
                  ) : (
                    <span>Şu anda bekleyen randevu yok. Boşta.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hızlı Ayaküstü Tıraş / Tezgâh Tahsilatı (Walk-in quick cash) */}
      <div className="bg-linear-to-br from-indigo-900 to-stone-900 text-white p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold">Ayaküstü / Randevusuz Hızlı Tıraş Tahsilatı</h3>
          </div>
          <span className="text-[11px] text-indigo-200">Tek tıkla kasaya anında işler</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {COMMON_SERVICES.map((srv) => (
            <button
              key={srv.name}
              type="button"
              onClick={() => onFastWalkinCash(srv.name, srv.price, 'Hızlı Tezgâh')}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between"
            >
              <span className="text-xs font-medium text-stone-200 line-clamp-1">{srv.name}</span>
              <span className="text-sm font-black text-amber-300 mt-1">{srv.price} ₺</span>
            </button>
          ))}
        </div>
      </div>

      {/* Randevular Tablosu & Filtreler */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        {/* Tab & Filter Bar */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              Tümü ({appointments.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('koltukta')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === 'koltukta'
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              Koltukta Olanlar ({inChairCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('bekliyor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === 'bekliyor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              Bekleyenler ({appointments.filter((a) => a.status === 'bekliyor').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('tamamlandi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === 'tamamlandi'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              Tamamlananlar ({completedCount})
            </button>
          </div>

          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            Bugünkü Ciro: <span className="font-black text-emerald-600 dark:text-emerald-400">{totalRevenue} ₺</span>
          </div>
        </div>

        {/* Appointment List */}
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-stone-400 dark:text-stone-500">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold">Bu filtrede randevu bulunamadı.</p>
            <p className="text-xs mt-1">Yeni bir randevu eklemek için yukarıdaki butonu kullanabilirsiniz.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex flex-col items-center justify-center font-bold shrink-0 border border-indigo-100 dark:border-indigo-900/60">
                    <Clock className="w-3.5 h-3.5 opacity-70 mb-0.5" />
                    <span className="text-xs leading-none">{apt.timeSlot}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 dark:text-white text-sm">
                        {apt.customerName}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'koltukta'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : apt.status === 'tamamlandi'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : apt.status === 'iptal'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {apt.status === 'koltukta'
                          ? 'Koltukta'
                          : apt.status === 'tamamlandi'
                          ? 'Tahsil Edildi'
                          : apt.status === 'iptal'
                          ? 'İptal'
                          : 'Sıra Bekliyor'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                      <span className="font-medium text-stone-900 dark:text-stone-100">{apt.serviceName}</span>
                      <span className="mx-1.5 opacity-40">•</span>
                      <span>{apt.staffName}</span>
                    </p>

                    {apt.notes && (
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 italic">
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions & Price */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-stone-100 dark:border-stone-800">
                  <div className="text-right sm:mr-2">
                    <span className="text-base font-black text-stone-900 dark:text-white">
                      {apt.price} ₺
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Status Triggers */}
                    {apt.status === 'bekliyor' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(apt.id, 'koltukta')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
                        title="Müşteriyi koltuğa al"
                      >
                        Koltuğa Al
                      </button>
                    )}

                    {apt.status !== 'tamamlandi' && (
                      <button
                        type="button"
                        onClick={() => setCompletingApt(apt)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1"
                        title="İşlemi tamamla ve kasaya tahsilat olarak işle"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Tahsil Et</span>
                      </button>
                    )}

                    {apt.phone && (
                      <button
                        type="button"
                        onClick={() => openWhatsAppReminder(apt)}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                        title="WhatsApp randevu hatırlatması gönder"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteAppointment(apt.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Randevuyu sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Yeni Randevu Al */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-stone-900 dark:text-white">Yeni Randevu Kaydı</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Müşteri Adı Soyadı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ali Kaya"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Telefon (WhatsApp için)
                  </label>
                  <input
                    type="tel"
                    placeholder="0532..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Randevu Saati
                  </label>
                  <input
                    type="time"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Koltuk / Personel
                </label>
                <select
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {STAFF_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    İşlem / Hizmet
                  </label>
                  <select
                    value={serviceName}
                    onChange={(e) => {
                      setServiceName(e.target.value);
                      const matched = COMMON_SERVICES.find((s) => s.name === e.target.value);
                      if (matched) setPrice(matched.price);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {COMMON_SERVICES.map((srv) => (
                      <option key={srv.name} value={srv.name}>
                        {srv.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Ücret (₺)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm font-bold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Özel İstek / Not
                </label>
                <input
                  type="text"
                  placeholder="Örn: Yanlar kısa, sıcak havlu istiyor"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Randevuyu Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Randevu Tahsilat & Kasaya Aktar */}
      {completingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-sm p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Banknote className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              Tıraş Ücretini Kasaya Aktar
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {completingApt.customerName} - {completingApt.serviceName}
            </p>

            <div className="my-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
              <span className="text-xs text-stone-500">Tahsil Edilecek Tutar:</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {completingApt.price} ₺
              </div>
            </div>

            <p className="text-xs font-semibold text-stone-600 dark:text-stone-300 mb-3">
              Ödeme Yöntemini Seçiniz:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onCompleteAppointment(completingApt.id, 'nakit');
                  setCompletingApt(null);
                }}
                className="py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer flex flex-col items-center gap-1"
              >
                <Banknote className="w-5 h-5" />
                <span>Nakit Alındı</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onCompleteAppointment(completingApt.id, 'kart');
                  setCompletingApt(null);
                }}
                className="py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer flex flex-col items-center gap-1"
              >
                <CreditCard className="w-5 h-5" />
                <span>Kredi Kartı / POS</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCompletingApt(null)}
              className="mt-4 text-xs font-semibold text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
