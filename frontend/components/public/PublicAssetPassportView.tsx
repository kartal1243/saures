import React, { useEffect, useState } from 'react';
import {
  Wrench,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Phone,
  MessageCircle,
  Send,
  History,
  Factory,
  QrCode,
  Loader2,
} from 'lucide-react';
import type { MaintenanceLogEntry } from '../../../shared/types';
import { initFirebaseAppCheck, fetchWithAppCheck } from '../../firebase';

interface PublicAssetData {
  code: string;
  shopName: string;
  shopPhone: string;
  shopCityDistrict: string;
  shopLogoUrl?: string;
  clientName: string;
  locationArea?: string;
  deviceName: string;
  brandModel?: string;
  serialNumberMasked?: string;
  intervalDays: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  warrantyUntil?: string;
  daysRemaining: number;
  statusBadge: 'guncel' | 'yaklasiyor' | 'gecikmis';
  statusLabel: string;
  logs: MaintenanceLogEntry[];
}

export const PublicAssetPassportView: React.FC<{ initialCode?: string }> = ({ initialCode }) => {
  const code = (initialCode || '').trim();
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<PublicAssetData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Arıza Bildir / Bakım Talep Formu
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [urgency, setUrgency] = useState<'Normal' | 'Acil — Hat Durdu'>('Normal');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    initFirebaseAppCheck().catch(() => {});
    setLoading(true);
    setError(null);
    fetch(`/api/public/asset/${encodeURIComponent(code)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.asset) {
          throw new Error(data?.error || 'Bu QR koduna kayıtlı makine veya cihaz bulunamadı.');
        }
        setAsset(data.asset);
      })
      .catch((err: any) => {
        setError(err?.message || 'Cihaz pasaportu yüklenemedi.');
      })
      .finally(() => setLoading(false));
  }, [code]);

  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!reporterName.trim() || !issueDescription.trim()) {
      setSubmitError('Lütfen adınızı ve arıza / bakım talebinizi yazınız.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithAppCheck(`/api/public/asset/${encodeURIComponent(code)}/request-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterName: reporterName.trim(),
          reporterPhone: reporterPhone.trim(),
          issueDescription: issueDescription.trim(),
          urgency,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Talep gönderilemedi.');
      setSubmitSuccess(
        `Talebiniz teknik servise canlı iş emri (#${String(data.ticket?.id || '').slice(-6).toUpperCase()}) olarak iletildi!`
      );
      setIssueDescription('');
    } catch (err: any) {
      setSubmitError(err?.message || 'Bağlantı hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-sm font-bold text-stone-300">QR Makine Bakım Pasaportu Yükleniyor...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 space-y-4">
          <QrCode className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-black">Cihaz Pasaportu Bulunamadı</h1>
          <p className="text-sm text-stone-400">{error}</p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  const badgeStyle =
    asset.statusBadge === 'gecikmis'
      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
      : asset.statusBadge === 'yaklasiyor'
      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';

  const cleanWaPhone = (asset.shopPhone || '').replace(/\D/g, '').replace(/^0/, '90');

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Teknik Servis Üst Bar */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {asset.shopLogoUrl ? (
              <img
                src={asset.shopLogoUrl}
                alt={asset.shopName}
                className="w-12 h-12 rounded-2xl object-cover border border-stone-700 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black text-lg shrink-0">
                <Wrench className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-orange-400">
                Yetkili Servis &amp; Bakım Pasaportu
              </p>
              <h2 className="text-base sm:text-lg font-black text-white truncate">{asset.shopName}</h2>
              {asset.shopCityDistrict && (
                <p className="text-xs text-stone-400 truncate">{asset.shopCityDistrict}</p>
              )}
            </div>
          </div>

          {cleanWaPhone && (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${asset.shopPhone}`}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
                title="Servisi Ara"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${cleanWaPhone}?text=${encodeURIComponent(
                  `Merhaba ${asset.shopName}, ${asset.deviceName} (${asset.code}) cihazı için yazıyorum.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        {/* Makine Kimlik & Bakım Durum Kartı */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg mb-2">
                <QrCode className="w-3.5 h-3.5" />
                {asset.code}
              </div>
              <h1 className="text-2xl font-black text-white">{asset.deviceName}</h1>
              <p className="text-sm text-stone-300 font-semibold mt-1 flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-stone-400" />
                {asset.clientName}
                {asset.locationArea ? ` • ${asset.locationArea}` : ''}
              </p>
            </div>

            <div className={`px-3.5 py-2 rounded-2xl border text-xs font-black flex items-center gap-2 shrink-0 ${badgeStyle}`}>
              {asset.statusBadge === 'gecikmis' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{asset.statusLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800">
              <p className="text-[10px] font-bold uppercase text-stone-400">Son Bakım</p>
              <p className="text-sm font-black text-white mt-1">{asset.lastMaintenanceDate}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800">
              <p className="text-[10px] font-bold uppercase text-stone-400">Sonraki Bakım</p>
              <p className="text-sm font-black text-orange-400 mt-1">{asset.nextMaintenanceDate}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800">
              <p className="text-[10px] font-bold uppercase text-stone-400">Periyot</p>
              <p className="text-sm font-black text-white mt-1">Her {asset.intervalDays} Gün</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800">
              <p className="text-[10px] font-bold uppercase text-stone-400">Garanti / Seri</p>
              <p className="text-xs font-black text-stone-200 mt-1">
                {asset.warrantyUntil || 'Standart'}
                {asset.serialNumberMasked ? ` • ${asset.serialNumberMasked}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Tek Tıkla Arıza Bildir / Bakım Talep Et */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-black text-white">Arıza Bildir / Bakım Randevusu İste</h3>
          </div>
          <p className="text-xs text-stone-400">
            Operatör veya yetkili olarak arıza kaydınızı doğrudan teknik servisin canlı ekranına iletebilirsiniz.
          </p>

          {submitSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold">
              ⚠️ {submitError}
            </div>
          )}

          <form onSubmit={handleRequestService} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Bildiren Ad Soyad / Operatör *"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-white outline-none focus:border-orange-500"
              />
              <input
                type="tel"
                placeholder="İrtibat Telefonu (05XX...)"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-white outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['Normal', 'Acil — Hat Durdu'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className={`py-2 px-3 rounded-xl text-xs font-black border cursor-pointer transition-colors ${
                    urgency === u
                      ? u.startsWith('Acil')
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-orange-600 border-orange-500 text-white'
                      : 'bg-stone-950 border-stone-800 text-stone-400'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              required
              placeholder="Görülen arıza, hata kodu veya talep edilen bakım detayını yazınız *"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-white outline-none focus:border-orange-500 resize-none"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{submitting ? 'Gönderiliyor...' : 'Teknik Servise Canlı Talep Gönder'}</span>
            </button>
          </form>
        </div>

        {/* Bakım Geçmişi Zaman Çizelgesi */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-black text-white">Bakım &amp; Onarım Geçmişi ({asset.logs.length})</h3>
          </div>

          {asset.logs.length === 0 ? (
            <p className="text-xs text-stone-400">Henüz kayıtlı bakım geçmişi bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {asset.logs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black text-orange-400">{log.date}</span>
                    {log.technician && (
                      <span className="text-[11px] font-bold text-stone-300 bg-stone-800 px-2 py-0.5 rounded-md">
                        Teknisyen: {log.technician}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white">{log.summary}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-stone-400 pt-1">
                    {log.partsChanged && <span>Parça: {log.partsChanged}</span>}
                    {log.meterReading && <span>Sayaç/Saat: {log.meterReading}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-stone-500 pt-2">
          ⚡ Bu QR Bakım Pasaportu{' '}
          <a
            href="https://dukkanimyanimda.com.tr/teknik-servis?utm_source=qr_asset&utm_medium=viral_footer"
            className="text-orange-400 font-bold hover:underline"
          >
            Dükkânım Yanımda Teknik Servis Sistemi
          </a>{' '}
          ile çalışır.
        </p>
      </div>
    </div>
  );
};
