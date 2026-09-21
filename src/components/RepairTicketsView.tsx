import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Car,
  Smartphone,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  CreditCard,
  Banknote,
  Trash2,
  DollarSign,
  TrendingUp,
  Package,
} from 'lucide-react';
import { RepairTicket } from '../types';

interface RepairTicketsViewProps {
  repairTickets: RepairTicket[];
  onAddTicket: (ticket: Partial<RepairTicket>) => Promise<void>;
  onUpdateStatus: (id: string, status: RepairTicket['status']) => Promise<void>;
  onCompleteTicket: (
    id: string,
    paymentMethod: 'nakit' | 'kart',
    deductPartCost: boolean
  ) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
}

const STATUS_CONFIG: Record<
  RepairTicket['status'],
  { label: string; badgeColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  kabul_edildi: {
    label: 'Kabul Edildi',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    icon: Clock,
  },
  parca_bekleniyor: {
    label: 'Parça Bekleniyor',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    icon: Package,
  },
  tamirde: {
    label: 'Tamir Ediliyor',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    icon: Wrench,
  },
  teslime_hazir: {
    label: 'Teslime Hazır',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-black animate-pulse',
    icon: CheckCircle2,
  },
  teslim_edildi: {
    label: 'Teslim Edildi & Kapandı',
    badgeColor: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    icon: CheckCircle2,
  },
};

export const RepairTicketsView: React.FC<RepairTicketsViewProps> = ({
  repairTickets,
  onAddTicket,
  onUpdateStatus,
  onCompleteTicket,
  onDeleteTicket,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [completingTicket, setCompletingTicket] = useState<RepairTicket | null>(null);
  const [deductPartCostCheck, setDeductPartCostCheck] = useState(true);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceOrVehicle, setDeviceOrVehicle] = useState('');
  const [complaint, setComplaint] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | ''>('');
  const [partCost, setPartCost] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTickets = useMemo(() => {
    return repairTickets.filter((t) => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'active') return t.status !== 'teslim_edildi';
      return t.status === filterStatus;
    });
  }, [repairTickets, filterStatus]);

  // Metrics
  const activeCount = repairTickets.filter((t) => t.status !== 'teslim_edildi').length;
  const readyCount = repairTickets.filter((t) => t.status === 'teslime_hazir').length;
  const inRepairCount = repairTickets.filter((t) => t.status === 'tamirde').length;
  const totalEstimated = repairTickets
    .filter((t) => t.status !== 'teslim_edildi')
    .reduce((sum, t) => sum + (t.estimatedCost || 0), 0);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !deviceOrVehicle.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddTicket({
        customerName: customerName.trim(),
        phone: phone.trim(),
        deviceOrVehicle: deviceOrVehicle.trim(),
        complaint: complaint.trim(),
        estimatedCost: Number(estimatedCost) || 0,
        partCost: Number(partCost) || 0,
        status: 'kabul_edildi',
        notes: notes.trim(),
      });
      setIsNewModalOpen(false);
      setCustomerName('');
      setPhone('');
      setDeviceOrVehicle('');
      setComplaint('');
      setEstimatedCost('');
      setPartCost('');
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsAppReady = (ticket: RepairTicket) => {
    const cleanPhone = ticket.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('90')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `90${cleanPhone.substring(1)}`
      : `90${cleanPhone}`;

    const text = `Merhaba ${ticket.customerName}, servisimize bıraktığınız ${ticket.deviceOrVehicle} cihazınız/aracınızın onarımı tamamlanmış olup teslime hazırdır. Ödenecek tutar: ${ticket.estimatedCost} ₺. Dilediğiniz zaman teslim alabilirsiniz.`;
    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Wrench className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
              Teknik Servis & Tamirhane İş Emirleri
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Cihaz / araç kabul fişleri, arıza takibi, parça maliyeti ve teslimde otomatik kasa tahsilatı.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Servis Fişi Aç</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <span className="text-xs text-stone-500 font-semibold">Atölyedeki İşler</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
            {activeCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <span className="text-xs text-stone-500 font-semibold">Teslime Hazır Olanlar</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {readyCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <span className="text-xs text-stone-500 font-semibold">Tamirdeki Cihazlar</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
            {inRepairCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <span className="text-xs text-stone-500 font-semibold">Beklenen Toplam Hasılat</span>
          <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">
            {totalEstimated} ₺
          </div>
        </div>
      </div>

      {/* Ticket List & Filter Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        {/* Filters */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              Tümü ({repairTickets.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              Atölyede Açık ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('teslime_hazir')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === 'teslime_hazir'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              Teslime Hazır ({readyCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('teslim_edildi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === 'teslim_edildi'
                  ? 'bg-stone-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              Tamamlanmış
            </button>
          </div>
        </div>

        {/* Tickets */}
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-stone-400">
            <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-semibold">Kayıtlı servis fişi bulunamadı.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredTickets.map((ticket) => {
              const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.kabul_edildi;
              const netProfit = ticket.estimatedCost - (ticket.partCost || 0);

              return (
                <div
                  key={ticket.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                        #{ticket.id.slice(-6).toUpperCase()}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                        {ticket.deviceOrVehicle}
                      </h4>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusCfg.badgeColor}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                      <strong>Müşteri:</strong> {ticket.customerName} {ticket.phone && `(${ticket.phone})`}
                    </p>

                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      <strong>Arıza:</strong> {ticket.complaint}
                    </p>

                    {ticket.notes && (
                      <p className="text-[11px] text-stone-400 italic">
                        Not: {ticket.notes}
                      </p>
                    )}
                  </div>

                  {/* Financial Details */}
                  <div className="flex items-center gap-4 text-xs shrink-0 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                    <div>
                      <span className="text-stone-400 block text-[10px]">İşçilik + Parça</span>
                      <span className="font-black text-sm text-stone-900 dark:text-white">
                        {ticket.estimatedCost} ₺
                      </span>
                    </div>

                    {ticket.partCost > 0 && (
                      <>
                        <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
                        <div>
                          <span className="text-stone-400 block text-[10px]">Yedek Parça</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            -{ticket.partCost} ₺
                          </span>
                        </div>
                        <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
                        <div>
                          <span className="text-stone-400 block text-[10px]">Net Kâr</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            +{netProfit} ₺
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Status Dropdown */}
                    {ticket.status !== 'teslim_edildi' && (
                      <select
                        value={ticket.status}
                        onChange={(e) => onUpdateStatus(ticket.id, e.target.value as RepairTicket['status'])}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                      >
                        <option value="kabul_edildi">Kabul Edildi</option>
                        <option value="parca_bekleniyor">Parça Bekleniyor</option>
                        <option value="tamirde">Tamirde</option>
                        <option value="teslime_hazir">Teslime Hazır</option>
                      </select>
                    )}

                    {/* WhatsApp Ready Message */}
                    {ticket.phone && ticket.status !== 'teslim_edildi' && (
                      <button
                        type="button"
                        onClick={() => openWhatsAppReady(ticket)}
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-stone-200 dark:border-stone-700"
                        title="Müşteriye 'Cihazınız Hazır' WhatsApp mesajı gönder"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}

                    {/* Complete & Cash In */}
                    {ticket.status !== 'teslim_edildi' && (
                      <button
                        type="button"
                        onClick={() => setCompletingTicket(ticket)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Teslim Et & Tahsil Et</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteTicket(ticket.id)}
                      className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Fişi sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Yeni Servis Fişi Aç */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">
              Yeni Servis / Araç Kabul Fişi
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Müşteri ve arızalı cihaz/araç bilgilerini işleyerek iş emri oluşturun.
            </p>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Müşteri Adı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Hasan Yılmaz"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Telefon (WhatsApp Bildirimi için)
                  </label>
                  <input
                    type="tel"
                    placeholder="0542..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Cihaz / Araç Modeli *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: iPhone 13 Pro Max VEYA 34 ABC 123 Fiat Egea"
                  value={deviceOrVehicle}
                  onChange={(e) => setDeviceOrVehicle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Müşteri Şikayeti / Arıza Tanımı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ekran kırık, açılmıyor / Yağ ve filtre bakımı"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Müşteriye Verilen Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="1500"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm font-bold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Yedek Parça Maliyeti (₺)
                  </label>
                  <input
                    type="number"
                    placeholder="650"
                    value={partCost}
                    onChange={(e) => setPartCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Atölye İçi Özel Not
                </label>
                <input
                  type="text"
                  placeholder="Örn: Müşteri acil istiyor, kasa köşesi çizik"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-500"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Fişi Aç & Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Teslim Et & Tahsil Et */}
      {completingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-sm p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Banknote className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              Cihazı Teslim Et & Tahsil Et
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {completingTicket.deviceOrVehicle} - {completingTicket.customerName}
            </p>

            <div className="my-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-left space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Alınacak Ücret:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-base">
                  {completingTicket.estimatedCost} ₺
                </strong>
              </div>
              {completingTicket.partCost > 0 && (
                <div className="flex justify-between text-stone-400">
                  <span>Yedek Parça Harcaması:</span>
                  <span>{completingTicket.partCost} ₺</span>
                </div>
              )}
            </div>

            {completingTicket.partCost > 0 && (
              <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300 text-left mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deductPartCostCheck}
                  onChange={(e) => setDeductPartCostCheck(e.target.checked)}
                  className="rounded-sm"
                />
                <span>Parça maliyetini ({completingTicket.partCost} ₺) kasadan GİDER olarak düş</span>
              </label>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={async () => {
                  await onCompleteTicket(completingTicket.id, 'nakit', deductPartCostCheck);
                  setCompletingTicket(null);
                }}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex flex-col items-center gap-1"
              >
                <Banknote className="w-4 h-4" />
                <span>Nakit Tahsil Et</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await onCompleteTicket(completingTicket.id, 'kart', deductPartCostCheck);
                  setCompletingTicket(null);
                }}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex flex-col items-center gap-1"
              >
                <CreditCard className="w-4 h-4" />
                <span>Kredi Kartı / POS</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCompletingTicket(null)}
              className="mt-4 text-xs font-semibold text-stone-400 hover:text-stone-600"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
