import React, { useEffect, useState } from 'react';
import {
  Wrench,
  Shirt,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Search,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PublicTicketData {
  code: string;
  kind: 'repair' | 'custody';
  shopName: string;
  shopPhone: string;
  shopCityDistrict: string;
  shopLogoUrl?: string;
  customerMasked: string;
  itemTitle: string;
  complaintOrDetails: string;
  status: string;
  statusLabel: string;
  stepIndex: number;
  steps: { key: string; label: string }[];
  estimatedCost: number;
  advance: number;
  remainingAmount: number;
  createdAt: string;
  promisedOrCompletedAt?: string;
}

interface PublicTicketTrackerViewProps {
  initialCode?: string;
}

export const PublicTicketTrackerView: React.FC<PublicTicketTrackerViewProps> = ({ initialCode }) => {
  const getInitialCode = () => {
    if (initialCode) return initialCode;
    const match = window.location.pathname.match(/^\/t\/(.+)/i);
    if (match && match[1]) return decodeURIComponent(match[1]).replace(/\/+$/, '');
    return 'demo';
  };

  const [code, setCode] = useState<string>(getInitialCode);
  const [searchInput, setSearchInput] = useState<string>(getInitialCode);
  const [ticket, setTicket] = useState<PublicTicketData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = async (targetCode: string) => {
    const clean = targetCode.trim();
    if (!clean) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/ticket/${encodeURIComponent(clean)}`);
      const json = await res.json();
      if (!res.ok || !json?.ticket) {
        throw new Error(json?.error || 'Bu takip koduna ait kayıt bulunamadı.');
      }
      setTicket(json.ticket);
      setCode(clean);
    } catch (err: any) {
      setTicket(null);
      setError(err.message || 'Fiş durumu sorgulanamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket(code);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const next = searchInput.trim();
    window.history.replaceState(null, '', `/t/${encodeURIComponent(next)}`);
    fetchTicket(next);
  };

  const cleanWaPhone = ticket?.shopPhone
    ? (() => {
        const d = ticket.shopPhone.replace(/\D/g, '');
        if (d.startsWith('0')) return `90${d.slice(1)}`;
        if (d.startsWith('90')) return d;
        return d.length === 10 ? `90${d}` : d;
      })()
    : '';

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Üst Başlık */}
      <header className="border-b border-stone-800/80 bg-stone-900/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shadow-lg shadow-orange-600/20">
              {ticket?.kind === 'custody' ? <Shirt className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-tight">Canlı Fiş &amp; İşlem Takibi</h1>
              <p className="text-[11px] text-stone-400">Dükkânım Yanımda Müşteri Takip Ekranı</p>
            </div>
          </div>

          <a
            href="/"
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <span>Ana Sayfa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-5">
        {/* Kod Sorgulama Çubuğu */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Fiş / Takip Kodunuzu Giriniz (örn: demo veya rep_...)"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-900 border border-stone-800 text-xs sm:text-sm font-mono text-white placeholder:text-stone-500 focus:outline-hidden focus:border-orange-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm cursor-pointer shrink-0"
          >
            Sorgula
          </button>
        </form>

        {loading ? (
          <div className="p-12 rounded-3xl bg-stone-900 border border-stone-800 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-xs font-bold text-stone-400">Kayıt durumu getiriliyor...</p>
          </div>
        ) : error || !ticket ? (
          <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-white">Kayıt Bulunamadı</h2>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              {error || 'Lütfen fiş üzerindeki kodu eksiksiz girdiğinizden emin olun.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* İşletme Kartı */}
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {ticket.shopLogoUrl ? (
                  <img
                    src={ticket.shopLogoUrl}
                    alt={ticket.shopName}
                    className="w-14 h-14 rounded-2xl object-cover border border-stone-700 bg-white shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/30 text-orange-400 flex items-center justify-center font-black text-xl shrink-0">
                    {ticket.shopName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                    {ticket.kind === 'custody' ? 'Terzi / Kuru Temizleme Emanet Fişi' : 'Teknik Servis İş Emri'}
                  </span>
                  <h2 className="text-lg font-black text-white truncate">{ticket.shopName}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400 mt-0.5">
                    {ticket.shopCityDistrict && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-400" />
                        {ticket.shopCityDistrict}
                      </span>
                    )}
                    {ticket.shopPhone && (
                      <a href={`tel:${ticket.shopPhone}`} className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <Phone className="w-3 h-3" />
                        {ticket.shopPhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-stone-500 font-bold">Takip Kodu</div>
                <div className="text-xs font-mono font-black text-orange-400">#{ticket.code.slice(-8).toUpperCase()}</div>
              </div>
            </div>

            {/* Aşama Takip Çubuğu */}
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-stone-400 font-bold">Güncel Durum</span>
                  <h3 className="text-lg font-black text-emerald-400">{ticket.statusLabel}</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black">
                  Adım {ticket.stepIndex + 1} / {ticket.steps.length}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ticket.steps.map((st, idx) => {
                  const done = idx <= ticket.stepIndex;
                  const current = idx === ticket.stepIndex;
                  return (
                    <div
                      key={st.key}
                      className={`p-3 rounded-2xl border text-xs transition-all ${
                        current
                          ? 'bg-orange-600/20 border-orange-500 text-white font-black'
                          : done
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold'
                          : 'bg-stone-950/60 border-stone-800 text-stone-500'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                        )}
                        <span className="text-[10px]">Adım {idx + 1}</span>
                      </div>
                      <div className="truncate">{st.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cihaz / Eşya & Ücret Özeti */}
            <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
                  <div className="text-[10px] font-bold text-stone-500 uppercase">Müşteri (KVKK Maskeli)</div>
                  <div className="font-black text-white mt-0.5">{ticket.customerMasked}</div>
                </div>
                <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
                  <div className="text-[10px] font-bold text-stone-500 uppercase">Kabul Tarihi</div>
                  <div className="font-black text-white mt-0.5">{ticket.createdAt}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-1.5">
                <div className="text-[10px] font-bold text-stone-500 uppercase">
                  {ticket.kind === 'custody' ? 'Bırakılan Eşya' : 'Cihaz / Araç'}
                </div>
                <div className="text-sm font-black text-white">{ticket.itemTitle}</div>
                {ticket.complaintOrDetails && (
                  <p className="text-xs text-stone-400">{ticket.complaintOrDetails}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800">
                  <div className="text-[10px] text-stone-500 font-bold">Toplam Tutar</div>
                  <div className="text-sm font-black text-white mt-0.5">{formatCurrency(ticket.estimatedCost)}</div>
                </div>
                <div className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800">
                  <div className="text-[10px] text-stone-500 font-bold">Kapora / Ön Ödeme</div>
                  <div className="text-sm font-black text-emerald-400 mt-0.5">{formatCurrency(ticket.advance)}</div>
                </div>
                <div className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800">
                  <div className="text-[10px] text-stone-500 font-bold">Kalan Ödeme</div>
                  <div className="text-sm font-black text-orange-400 mt-0.5">{formatCurrency(ticket.remainingAmount)}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-stone-500">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Kişisel veriler KVKK gereği maskelenmiştir.
                </span>
                {cleanWaPhone && (
                  <a
                    href={`https://wa.me/${cleanWaPhone}?text=${encodeURIComponent(`Merhaba, #${ticket.code} numaralı kaydım hakkında bilgi almak istiyorum.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs"
                  >
                    WhatsApp ile İletişime Geç
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
