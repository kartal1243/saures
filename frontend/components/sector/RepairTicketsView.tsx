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
  Printer,
  Copy,
  Check,
  QrCode,
  Factory,
  CalendarClock,
  ExternalLink,
} from 'lucide-react';
import type { MaintenanceAsset, RepairTicket } from '../../../shared/types.ts';
import { printHtmlDocument, escapeHtml } from '../../utils/printTemplate';

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
  maintenanceAssets?: MaintenanceAsset[];
  onSaveMaintenanceAsset?: (data: Partial<MaintenanceAsset>) => Promise<void>;
  onRecordAssetMaintenance?: (
    id: string,
    payload: {
      summary: string;
      technician?: string;
      partsChanged?: string;
      cost?: number;
      meterReading?: string;
      addToCash?: boolean;
      paymentMethod?: 'nakit' | 'kart';
    }
  ) => Promise<void>;
  onDeleteMaintenanceAsset?: (id: string) => Promise<void>;
  storeName?: string;
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
  maintenanceAssets = [],
  onSaveMaintenanceAsset,
  onRecordAssetMaintenance,
  onDeleteMaintenanceAsset,
  storeName,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tickets' | 'assets'>('tickets');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [completingTicket, setCompletingTicket] = useState<RepairTicket | null>(null);
  const [deductPartCostCheck, setDeductPartCostCheck] = useState(true);

  // Makine / Cihaz Bakım Pasaportu Modal States
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetClientName, setAssetClientName] = useState('');
  const [assetClientPhone, setAssetClientPhone] = useState('');
  const [assetLocationArea, setAssetLocationArea] = useState('');
  const [assetDeviceName, setAssetDeviceName] = useState('');
  const [assetBrandModel, setAssetBrandModel] = useState('');
  const [assetSerialNumber, setAssetSerialNumber] = useState('');
  const [assetIntervalDays, setAssetIntervalDays] = useState<number>(90);
  const [assetLastDate, setAssetLastDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [assetWarrantyUntil, setAssetWarrantyUntil] = useState<string>('');
  const [assetSaving, setAssetSaving] = useState(false);

  const [recordingAsset, setRecordingAsset] = useState<MaintenanceAsset | null>(null);
  const [mntSummary, setMntSummary] = useState('Periyodik bakım, temizlik ve kalibrasyon yapıldı');
  const [mntTechnician, setMntTechnician] = useState('');
  const [mntPartsChanged, setMntPartsChanged] = useState('');
  const [mntMeterReading, setMntMeterReading] = useState('');
  const [mntCost, setMntCost] = useState<number | ''>('');
  const [mntAddToCash, setMntAddToCash] = useState(true);
  const [mntPayMethod, setMntPayMethod] = useState<'nakit' | 'kart'>('nakit');
  const [mntSaving, setMntSaving] = useState(false);

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

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getTrackUrl = (ticketId: string) => `${window.location.origin}/t/${encodeURIComponent(ticketId)}`;

  const handleCopyTrackLink = async (ticketId: string) => {
    const url = getTrackUrl(ticketId);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(ticketId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrintAcceptanceSlip = (ticket: RepairTicket) => {
    const trackUrl = getTrackUrl(ticket.id);
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&ecc=H&data=${encodeURIComponent(trackUrl)}`;
    printHtmlDocument({
      title: `Servis Kabul Fişi #${ticket.id.slice(-6).toUpperCase()}`,
      paperWidth: '80mm',
      bodyHtml: `
        <div style="text-align:center;border-bottom:1px dashed #111;padding-bottom:8px;margin-bottom:8px;">
          <div style="font-size:14px;font-weight:900;">TEKNİK SERVİS KABUL FİŞİ</div>
          <div style="font-size:11px;font-weight:800;margin-top:2px;">Fiş No: #${escapeHtml(ticket.id.slice(-6).toUpperCase())}</div>
          <div style="font-size:10px;color:#555;">${escapeHtml(ticket.createdAt)}</div>
        </div>
        <div style="font-size:11px;line-height:1.55;margin-bottom:8px;">
          <div><strong>Müşteri:</strong> ${escapeHtml(ticket.customerName)}</div>
          ${ticket.phone ? `<div><strong>Telefon:</strong> ${escapeHtml(ticket.phone)}</div>` : ''}
          <div><strong>Cihaz / Araç:</strong> ${escapeHtml(ticket.deviceOrVehicle)}</div>
          <div><strong>Arıza / İşlem:</strong> ${escapeHtml(ticket.complaint)}</div>
          <div><strong>Tahmini Tutar:</strong> ${ticket.estimatedCost} ₺</div>
          ${ticket.notes ? `<div><strong>Not:</strong> ${escapeHtml(ticket.notes)}</div>` : ''}
        </div>
        <div style="text-align:center;border-top:1px dashed #111;padding-top:8px;">
          <img src="${qrSrc}" alt="QR Takip" style="width:120px;height:120px;margin:0 auto 4px;display:block;" />
          <div style="font-size:10px;font-weight:700;">Cihaz Durumunu Canlı Takip Et</div>
          <div style="font-size:9px;color:#555;word-break:break-all;">${escapeHtml(trackUrl)}</div>
        </div>
      `,
    });
  };

  const openWhatsAppReady = (ticket: RepairTicket) => {
    const cleanPhone = ticket.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('90')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `90${cleanPhone.substring(1)}`
      : `90${cleanPhone}`;

    const trackUrl = getTrackUrl(ticket.id);
    const text = `Merhaba ${ticket.customerName}, servisimize bıraktığınız ${ticket.deviceOrVehicle} cihazınız/aracınızın durumu güncellendi. Ödenecek tutar: ${ticket.estimatedCost} ₺. Canlı takip: ${trackUrl}`;
    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const getAssetUrl = (assetCode: string) => `${window.location.origin}/bakim/${encodeURIComponent(assetCode)}`;

  const todayIso = new Date().toISOString().slice(0, 10);
  const getDaysDiff = (targetDate: string) => {
    const a = new Date(`${todayIso}T00:00:00Z`).getTime();
    const b = new Date(`${targetDate}T00:00:00Z`).getTime();
    return Number.isFinite(b) ? Math.round((b - a) / 86400000) : 0;
  };
  const overdueAssetsCount = maintenanceAssets.filter((a) => getDaysDiff(a.nextMaintenanceDate) < 0).length;
  const dueSoonAssetsCount = maintenanceAssets.filter((a) => {
    const d = getDaysDiff(a.nextMaintenanceDate);
    return d >= 0 && d <= 15;
  }).length;

  const handlePrintAssetQrSticker = (asset: MaintenanceAsset) => {
    const assetUrl = getAssetUrl(asset.code || asset.id);
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&ecc=H&data=${encodeURIComponent(assetUrl)}`;
    printHtmlDocument({
      title: `QR Bakım Etiketi — ${asset.code}`,
      paperWidth: '80mm',
      bodyHtml: `
        <div style="border:2px solid #111;border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.6px;color:#ea580c;">
            ${escapeHtml(storeName || 'TEKNİK SERVİS BAKIM PASAPORTU')}
          </div>
          <div style="font-size:15px;font-weight:900;margin:4px 0 2px;">${escapeHtml(asset.deviceName)}</div>
          <div style="font-size:11px;font-weight:700;color:#333;">${escapeHtml(asset.clientName)}${asset.locationArea ? ` • ${escapeHtml(asset.locationArea)}` : ''}</div>
          <img src="${qrSrc}" alt="QR Bakım" style="width:140px;height:140px;margin:8px auto;display:block;" />
          <div style="font-size:12px;font-weight:900;background:#111;color:#fff;padding:4px 8px;border-radius:6px;display:inline-block;">
            KOD: ${escapeHtml(asset.code)}
          </div>
          <div style="font-size:10px;margin-top:6px;line-height:1.5;">
            <div><strong>Son Bakım:</strong> ${escapeHtml(asset.lastMaintenanceDate)}</div>
            <div><strong>Sonraki Bakım:</strong> ${escapeHtml(asset.nextMaintenanceDate)} (Her ${asset.intervalDays} gün)</div>
            ${asset.serialNumber ? `<div><strong>Seri No:</strong> ${escapeHtml(asset.serialNumber)}</div>` : ''}
          </div>
          <div style="font-size:9px;color:#555;margin-top:6px;border-top:1px dashed #999;padding-top:4px;">
            Bakım geçmişini görmek ve arıza bildirmek için okutunuz
          </div>
        </div>
      `,
    });
  };

  const openAssetWhatsAppReminder = (asset: MaintenanceAsset) => {
    const cleanPhone = (asset.clientPhone || '').replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('90')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `90${cleanPhone.substring(1)}`
      : `90${cleanPhone}`;
    const url = getAssetUrl(asset.code || asset.id);
    const text = `Sayın ${asset.clientName}, "${asset.deviceName}" (${asset.code}) ekipmanınızın periyodik bakım tarihi (${asset.nextMaintenanceDate}) gelmektedir. Bakım geçmişi ve talep pasaportu: ${url}`;
    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveMaintenanceAsset || !assetClientName.trim() || !assetDeviceName.trim()) return;
    setAssetSaving(true);
    try {
      await onSaveMaintenanceAsset({
        clientName: assetClientName.trim(),
        clientPhone: assetClientPhone.trim(),
        locationArea: assetLocationArea.trim(),
        deviceName: assetDeviceName.trim(),
        brandModel: assetBrandModel.trim(),
        serialNumber: assetSerialNumber.trim(),
        intervalDays: assetIntervalDays,
        lastMaintenanceDate: assetLastDate,
        warrantyUntil: assetWarrantyUntil.trim() || undefined,
      });
      setIsAssetModalOpen(false);
      setAssetClientName('');
      setAssetClientPhone('');
      setAssetLocationArea('');
      setAssetDeviceName('');
      setAssetBrandModel('');
      setAssetSerialNumber('');
      setAssetWarrantyUntil('');
    } finally {
      setAssetSaving(false);
    }
  };

  const handleRecordMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingAsset || !onRecordAssetMaintenance || !mntSummary.trim()) return;
    setMntSaving(true);
    try {
      await onRecordAssetMaintenance(recordingAsset.id, {
        summary: mntSummary.trim(),
        technician: mntTechnician.trim() || undefined,
        partsChanged: mntPartsChanged.trim() || undefined,
        meterReading: mntMeterReading.trim() || undefined,
        cost: Number(mntCost) || 0,
        addToCash: mntAddToCash && (Number(mntCost) || 0) > 0,
        paymentMethod: mntPayMethod,
      });
      setRecordingAsset(null);
      setMntPartsChanged('');
      setMntMeterReading('');
      setMntCost('');
    } finally {
      setMntSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alt Sekmeler: Aktif Arıza Fişleri vs QR Makine & Fabrika Bakım Pasaportu */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('tickets')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSubTab === 'tickets'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Arıza &amp; Servis Fişleri ({repairTickets.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('assets')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSubTab === 'assets'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>QR Makine &amp; Bakım Takibi ({maintenanceAssets.length})</span>
          {overdueAssetsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
              {overdueAssetsCount}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'assets' ? (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                  <Factory className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
                  Fabrika &amp; Kurumsal Cihaz QR Bakım Takibi
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                Makine/cihaz üzerine QR bakım etiketi yapıştırın; fabrika çalışanları bakım tarihini görüp tek tıkla arıza bildirsin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAssetModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Makine / Cihaz Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <span className="text-xs text-stone-500 font-semibold">Kayıtlı Makine / Cihaz</span>
              <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">{maintenanceAssets.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-900/50">
              <span className="text-xs text-rose-600 font-semibold">Bakımı Geciken</span>
              <div className="text-2xl font-black text-rose-600 mt-0.5">{overdueAssetsCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-900/50">
              <span className="text-xs text-amber-600 font-semibold">15 Gün İçinde Bakımı Gelen</span>
              <div className="text-2xl font-black text-amber-600 mt-0.5">{dueSoonAssetsCount}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            {maintenanceAssets.length === 0 ? (
              <div className="p-12 text-center text-stone-400 space-y-3">
                <QrCode className="w-10 h-10 mx-auto opacity-40 text-orange-500" />
                <p className="font-bold text-stone-700 dark:text-stone-200">Henüz QR Bakım Pasaportlu Cihaz Eklenmedi</p>
                <p className="text-xs max-w-md mx-auto">
                  Fabrika CNC makineleri, kompresörler, kombi/klima veya medikal cihazlar ekleyip üzerlerine QR bakım etiketi basabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {maintenanceAssets.map((asset) => {
                  const diff = getDaysDiff(asset.nextMaintenanceDate);
                  const badgeCls =
                    diff < 0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : diff <= 15
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
                  const badgeLabel =
                    diff < 0 ? `${Math.abs(diff)} gün gecikti!` : diff === 0 ? 'Bugün bakım!' : `${diff} gün kaldı`;

                  return (
                    <div key={asset.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-black text-orange-600 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded-md">
                            {asset.code}
                          </span>
                          <h4 className="text-sm font-black text-stone-900 dark:text-white">{asset.deviceName}</h4>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{badgeLabel}</span>
                        </div>
                        <p className="text-xs text-stone-700 dark:text-stone-300 font-semibold">
                          <strong>Firma / Fabrika:</strong> {asset.clientName}
                          {asset.locationArea ? ` • ${asset.locationArea}` : ''}
                          {asset.clientPhone ? ` (${asset.clientPhone})` : ''}
                        </p>
                        <p className="text-xs text-stone-500 flex items-center gap-3 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="w-3.5 h-3.5 text-orange-500" />
                            Son Bakım: <strong>{asset.lastMaintenanceDate}</strong>
                          </span>
                          <span>→</span>
                          <span>
                            Sonraki Bakım: <strong className="text-stone-900 dark:text-white">{asset.nextMaintenanceDate}</strong> (Her {asset.intervalDays} gün)
                          </span>
                          <span>• {asset.logs?.length || 0} Geçmiş İşlem</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePrintAssetQrSticker(asset)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>QR Sticker Yazdır</span>
                        </button>
                        <a
                          href={`/bakim/${encodeURIComponent(asset.code || asset.id)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Pasaport</span>
                        </a>
                        {asset.clientPhone && (
                          <button
                            type="button"
                            onClick={() => openAssetWhatsAppReminder(asset)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Hatırlat</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setRecordingAsset(asset);
                            setMntSummary('Periyodik bakım, temizlik ve kalibrasyon yapıldı');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Bakım Yapıldı</span>
                        </button>
                        {onDeleteMaintenanceAsset && (
                          <button
                            type="button"
                            onClick={() => onDeleteMaintenanceAsset(asset.id)}
                            className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Cihazı sil"
                          >
                            <Trash2 className="w-4 h-4" />
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
      ) : (
        <>
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

                    {/* Kabul Fişi Yazdır (QR'lı) & Takip Linki Kopyala */}
                    <button
                      type="button"
                      onClick={() => handlePrintAcceptanceSlip(ticket)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 flex items-center gap-1 cursor-pointer"
                      title="Kabul Fişi Yazdır (QR'lı)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Kabul Fişi (QR)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyTrackLink(ticket.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 flex items-center gap-1 cursor-pointer"
                      title="Canlı takip linkini kopyala"
                    >
                      {copiedId === ticket.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === ticket.id ? 'Kopyalandı' : 'Takip Linki'}</span>
                    </button>

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
        </>
      )}

      {/* Modal: Yeni Makine / Cihaz Ekle (QR Bakım Pasaportu) */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">
              Yeni QR Bakım Pasaportlu Makine / Cihaz
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Fabrika, atölye veya işletmedeki cihazı kaydedin; QR etiket basıp bakım dönemlerini otomatik takip edin.
            </p>
            <form onSubmit={handleSaveAssetSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Firma / Fabrika Adı *"
                  value={assetClientName}
                  onChange={(e) => setAssetClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
                <input
                  type="tel"
                  placeholder="Yetkili GSM (05XX...)"
                  value={assetClientPhone}
                  onChange={(e) => setAssetClientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Makine / Cihaz Adı * (Örn: Atlas Copco Kompresör)"
                value={assetDeviceName}
                onChange={(e) => setAssetDeviceName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Bölüm / Hat (A Blok)"
                  value={assetLocationArea}
                  onChange={(e) => setAssetLocationArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Marka / Model"
                  value={assetBrandModel}
                  onChange={(e) => setAssetBrandModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Seri No"
                  value={assetSerialNumber}
                  onChange={(e) => setAssetSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 mb-1">Bakım Periyodu</label>
                  <select
                    value={assetIntervalDays}
                    onChange={(e) => setAssetIntervalDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  >
                    <option value={30}>Aylık (30 Gün)</option>
                    <option value={60}>2 Ayda Bir (60 Gün)</option>
                    <option value={90}>3 Ayda Bir (90 Gün)</option>
                    <option value={180}>6 Ayda Bir (180 Gün)</option>
                    <option value={365}>Yıllık (365 Gün)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 mb-1">Son Bakım Tarihi</label>
                  <input
                    type="date"
                    value={assetLastDate}
                    onChange={(e) => setAssetLastDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 mb-1">Garanti Bitiş</label>
                  <input
                    type="date"
                    value={assetWarrantyUntil}
                    onChange={(e) => setAssetWarrantyUntil(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-500 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={assetSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                >
                  {assetSaving ? 'Kaydediliyor...' : 'Kaydet & QR Üret'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Periyodik Bakım Yapıldı İşaretle */}
      {recordingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 shadow-xl">
            <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">
              Bakım Kaydı İşle ({recordingAsset.code})
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {recordingAsset.deviceName} — sonraki bakım tarihi otomatik +{recordingAsset.intervalDays} gün ileri alınacaktır.
            </p>
            <form onSubmit={handleRecordMaintenanceSubmit} className="space-y-3">
              <textarea
                rows={2}
                required
                placeholder="Yapılan bakım / kontrol özeti *"
                value={mntSummary}
                onChange={(e) => setMntSummary(e.target.value)}
                className="w-full p-2.5 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Teknisyen Adı"
                  value={mntTechnician}
                  onChange={(e) => setMntTechnician(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Çalışma Saati / Sayaç"
                  value={mntMeterReading}
                  onChange={(e) => setMntMeterReading(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Değişen Parçalar / Sarf Malzeme"
                value={mntPartsChanged}
                onChange={(e) => setMntPartsChanged(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-3 items-center">
                <input
                  type="number"
                  placeholder="Bakım Ücreti (₺)"
                  value={mntCost}
                  onChange={(e) => setMntCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-sm font-bold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
                <select
                  value={mntPayMethod}
                  onChange={(e) => setMntPayMethod(e.target.value as 'nakit' | 'kart')}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                >
                  <option value="nakit">Nakit Tahsilat</option>
                  <option value="kart">Kart / Havale</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mntAddToCash}
                  onChange={(e) => setMntAddToCash(e.target.checked)}
                />
                <span>Ücret girildiyse bugünün kasasına otomatik GELİR işle</span>
              </label>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRecordingAsset(null)}
                  className="px-3 py-1.5 text-xs text-stone-500 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={mntSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  {mntSaving ? 'Kaydediliyor...' : 'Bakımı Tamamla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
