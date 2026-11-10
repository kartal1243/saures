import React, { useEffect, useState, useMemo } from 'react';
import {
  Globe,
  Search,
  RefreshCw,
  User,
  Smartphone,
  Monitor,
  Tablet,
  Check,
  Copy,
  Ban,
  Activity,
  Users,
  Eye,
  ShieldX,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface VisitorRecord {
  id: string;
  ip: string;
  country: string;
  countryName: string;
  countryFlag: string;
  isForeign: boolean;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  referer: string;
  userAgent: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  isBot: boolean;
  botName?: string;
  isSuspicious: boolean;
  category: 'landing' | 'barber' | 'menu' | 'auth' | 'app' | 'admin' | 'api' | 'security_scan' | 'other';
  timestamp: string;
}

export interface VisitorAnalyticsSummary {
  totalToday: number;
  foreignToday: number;
  humanToday: number;
  botToday: number;
  suspiciousToday: number;
  uniqueIpsToday: number;
  liveLast15Min: number;
  topCountries: { code: string; name: string; flag: string; count: number; percentage: number }[];
  categoryBreakdown: { category: string; count: number }[];
  blockedIpsCount: number;
}

export interface BlockedIpEntry {
  ip: string;
  reason: string;
  blockedAt: string;
  country?: string;
}

type FilterMode = 'all' | 'human' | 'foreign' | 'bots' | 'blocked';

function formatTarihSaat(iso: string): { saat: string; tarih: string; goreceli: string } {
  try {
    const d = new Date(iso);
    const saat = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const tarih = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });

    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    let goreceli = 'Az önce';
    if (diffSec >= 60 && diffSec < 3600) goreceli = `${Math.floor(diffSec / 60)} dk önce`;
    else if (diffSec >= 3600 && diffSec < 86400) goreceli = `${Math.floor(diffSec / 3600)} sa önce`;
    else if (diffSec >= 86400) goreceli = `${Math.floor(diffSec / 86400)} gün önce`;

    return { saat, tarih, goreceli };
  } catch {
    return { saat: '', tarih: iso, goreceli: '' };
  }
}

function formatSayfaAdi(path: string): { baslik: string; altYol: string } {
  if (!path || path === '/') return { baslik: 'Ana Sayfa', altYol: '/' };
  if (path.startsWith('/r/')) {
    const slug = path.replace('/r/', '').split(/[?#]/)[0];
    return { baslik: `✂️ Randevu (${slug})`, altYol: path };
  }
  if (path.startsWith('/m/')) {
    const slug = path.replace('/m/', '').split(/[?#]/)[0];
    return { baslik: `🍽️ Menü (${slug})`, altYol: path };
  }
  if (path.startsWith('/giris') || path.startsWith('/login')) return { baslik: 'Giriş Sayfası', altYol: path };
  if (path.startsWith('/kayit') || path.startsWith('/register')) return { baslik: 'Kayıt Sayfası', altYol: path };
  if (path.startsWith('/admin')) return { baslik: '🛡️ Yönetim Paneli', altYol: path };
  if (path.startsWith('/api/')) return { baslik: 'API Çağrısı', altYol: path };

  return { baslik: path.length > 28 ? path.slice(0, 28) + '...' : path, altYol: path };
}

function formatReferrer(ref: string): string {
  if (!ref || ref === 'direct' || ref === '-') return 'Direkt Ziyaret';
  try {
    if (ref.includes('google.')) return 'Google Arama';
    if (ref.includes('instagram.')) return 'Instagram';
    if (ref.includes('facebook.')) return 'Facebook';
    if (ref.includes('t.co') || ref.includes('twitter') || ref.includes('x.com')) return 'X / Twitter';
    if (ref.includes('whatsapp')) return 'WhatsApp';
    const u = new URL(ref);
    return u.hostname.replace('www.', '');
  } catch {
    return ref.length > 25 ? ref.slice(0, 25) + '...' : ref;
  }
}

export function VisitorsTab() {
  const [records, setRecords] = useState<VisitorRecord[]>([]);
  const [summary, setSummary] = useState<VisitorAnalyticsSummary | null>(null);
  const [blockedIps, setBlockedIps] = useState<BlockedIpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [manualBlockIp, setManualBlockIp] = useState('');
  const [manualBlockReason, setManualBlockReason] = useState('');
  const [blockBusy, setBlockBusy] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMode === 'foreign') params.set('foreignOnly', '1');
      if (filterMode === 'human') params.set('humanOnly', '1');
      if (filterMode === 'bots') params.set('botsOnly', '1');
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '200');

      const [resVisitors, resBlocked] = await Promise.all([
        fetch(`/api/admin/visitors?${params.toString()}`),
        fetch('/api/admin/visitors/blocked'),
      ]);

      if (resVisitors.ok) {
        const data = await resVisitors.json();
        setRecords(data.records || []);
        setSummary(data.summary || null);
      }
      if (resBlocked.ok) {
        const data = await resBlocked.json();
        setBlockedIps(data.blockedIps || []);
      }
    } catch (e) {
      console.error('Ziyaretçi verisi yüklenemedi:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterMode]);

  // Otomatik yenileme (10 saniye)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, filterMode, search]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleBlockIp = async (ip: string, country?: string, reason = 'Manuel admin engeli') => {
    if (!window.confirm(`${ip} IP adresini engellemek istiyor musunuz?`)) return;
    setBlockBusy(true);
    try {
      const res = await fetch('/api/admin/visitors/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, reason, country }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedIps(data.blockedIps || []);
        loadData(true);
      }
    } finally {
      setBlockBusy(false);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    if (!window.confirm(`${ip} engelini kaldırmak istiyor musunuz?`)) return;
    setBlockBusy(true);
    try {
      const res = await fetch(`/api/admin/visitors/block/${encodeURIComponent(ip)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedIps(data.blockedIps || []);
        loadData(true);
      }
    } finally {
      setBlockBusy(false);
    }
  };

  const handleManualBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBlockIp.trim()) return;
    setBlockBusy(true);
    try {
      const res = await fetch('/api/admin/visitors/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: manualBlockIp.trim(),
          reason: manualBlockReason.trim() || 'Manuel engelleme',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedIps(data.blockedIps || []);
        setManualBlockIp('');
        setManualBlockReason('');
        loadData(true);
      }
    } finally {
      setBlockBusy(false);
    }
  };

  const isBlocked = (ip: string) => blockedIps.some((b) => b.ip === ip);

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {/* 1. ÜST İSTATİSTİK KARTLARI (Seyir Terası Sade Kart Stili) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Bugünkü Ziyaret */}
        <div className="bg-[#12172b] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <b className="text-2xl font-black text-white block leading-none">
              {summary?.totalToday ?? 0}
            </b>
            <span className="text-xs font-semibold text-slate-400">Bugünkü Ziyaret</span>
          </div>
        </div>

        {/* Tekil Ziyaretçi */}
        <div className="bg-[#12172b] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <b className="text-2xl font-black text-white block leading-none">
              {summary?.uniqueIpsToday ?? 0}
            </b>
            <span className="text-xs font-semibold text-slate-400">Tekil Kişi / IP</span>
          </div>
        </div>

        {/* Canlı & Gerçek İnsan */}
        <div className="bg-[#12172b] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <b className="text-2xl font-black text-white block leading-none">
                {summary?.humanToday ?? 0}
              </b>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {summary?.liveLast15Min ?? 0} aktif
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400">Gerçek Müşteri / Esnaf</span>
          </div>
        </div>

        {/* Engellenen IP'ler */}
        <div className="bg-[#12172b] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <ShieldX className="w-5 h-5" />
          </div>
          <div>
            <b className="text-2xl font-black text-white block leading-none">
              {blockedIps.length}
            </b>
            <span className="text-xs font-semibold text-slate-400">Engelli Zararlı IP</span>
          </div>
        </div>
      </div>

      {/* 2. SADE KONTROL VE FİLTRE ÇUBUĞU */}
      <div className="bg-[#12172b] border border-white/5 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sekme Butonları */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Tüm Ziyaretler ({summary?.totalToday ?? 0})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('human')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'human'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            👤 Gerçek Kişiler ({summary?.humanToday ?? 0})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('foreign')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'foreign'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🌍 Yabancı IP ({summary?.foreignToday ?? 0})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('blocked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'blocked'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🚫 Engellenenler ({blockedIps.length})
          </button>
        </div>

        {/* Arama ve Yenile */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }}
              placeholder="IP, ülke veya sayfa ara..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Canlı akış açık (10 sn)' : 'Canlı akış duraklatıldı'}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="hidden sm:inline">Canlı</span>
          </button>

          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </button>
        </div>
      </div>

      {/* 3. ENGELLENEN IP'LER MODU */}
      {filterMode === 'blocked' ? (
        <div className="bg-[#12172b] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-400" />
                Engellenen IP Adresleri ({blockedIps.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bu IP'ler siteye erişemez, istekleri anında 403 Forbidden ile kesilir.
              </p>
            </div>
          </div>

          {/* Manuel IP Engelleme Formu */}
          <form onSubmit={handleManualBlock} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={manualBlockIp}
              onChange={(e) => setManualBlockIp(e.target.value)}
              placeholder="Engellenecek IP (örn: 169.40.142.177)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
            <input
              type="text"
              value={manualBlockReason}
              onChange={(e) => setManualBlockReason(e.target.value)}
              placeholder="Engelleme sebebi (örn: Güvenlik taraması)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              disabled={blockBusy || !manualBlockIp.trim()}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              IP'yi Engelle
            </button>
          </form>

          {/* Engelli IP Tablosu */}
          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/[0.03] text-slate-400 font-bold border-b border-white/5">
                  <th className="py-2.5 px-3">IP Adresi</th>
                  <th className="py-2.5 px-3">Ülke</th>
                  <th className="py-2.5 px-3">Engelleme Sebebi</th>
                  <th className="py-2.5 px-3">Tarih</th>
                  <th className="py-2.5 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {blockedIps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Henüz engellenmiş bir IP adresi yok.
                    </td>
                  </tr>
                ) : (
                  blockedIps.map((b) => (
                    <tr key={b.ip} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-300">{b.ip}</td>
                      <td className="py-2.5 px-3">{b.country || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{b.reason}</td>
                      <td className="py-2.5 px-3 text-slate-400">{formatTarihSaat(b.blockedAt).tarih} {formatTarihSaat(b.blockedAt).saat}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleUnblockIp(b.ip)}
                          disabled={blockBusy}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Engeli Kaldır
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 4. SEYİR TERASI STİLİ SADE ZİYARETÇİ TABLOSU */
        <div className="bg-[#12172b] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-3.5 sm:px-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Son Ziyaretler ({records.length} kayıt)</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Kim, nereden, hangi sayfayı ziyaret etti
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-white/[0.02] text-slate-400 text-[11px] font-bold border-b border-white/5">
                  <th className="py-2.5 px-3.5 w-32">Tarih / Saat</th>
                  <th className="py-2.5 px-3.5 w-56">Kim / Nereden (IP & Ülke)</th>
                  <th className="py-2.5 px-3.5">Ziyaret Edilen Sayfa</th>
                  <th className="py-2.5 px-3.5 w-40">Nereden Geldi</th>
                  <th className="py-2.5 px-3.5 w-36">Cihaz / Tarayıcı</th>
                  <th className="py-2.5 px-3.5 w-28 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      Bu filtreye uygun ziyaret kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const blocked = isBlocked(r.ip);
                    const isExpanded = expandedRowId === r.id;
                    const zaman = formatTarihSaat(r.timestamp);
                    const sayfa = formatSayfaAdi(r.path);
                    const nereden = formatReferrer(r.referer);

                    return (
                      <React.Fragment key={r.id}>
                        <tr
                          onClick={() => setExpandedRowId(isExpanded ? null : r.id)}
                          className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                            r.isSuspicious
                              ? 'bg-rose-500/[0.03]'
                              : r.isForeign
                              ? 'bg-amber-500/[0.015]'
                              : ''
                          }`}
                        >
                          {/* 1. Tarih / Saat */}
                          <td className="py-2.5 px-3.5 align-middle whitespace-nowrap">
                            <span className="font-bold text-white block leading-tight">
                              {zaman.saat}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {zaman.tarih} ({zaman.goreceli})
                            </span>
                          </td>

                          {/* 2. Kim / Nereden (IP & Ülke) */}
                          <td className="py-2.5 px-3.5 align-middle">
                            <div className="flex items-center gap-2">
                              <span className="text-base leading-none" title={r.countryName}>
                                {r.countryFlag}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(r.ip);
                                    }}
                                    title="IP'yi kopyala"
                                    className="font-mono font-bold text-white hover:text-amber-400 transition-colors inline-flex items-center gap-1"
                                  >
                                    <span>{r.ip}</span>
                                    {copiedIp === r.ip ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5 text-slate-500 opacity-60" />
                                    )}
                                  </button>
                                  {r.isForeign && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300">
                                      Yabancı
                                    </span>
                                  )}
                                  {r.isSuspicious && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/20 text-rose-300">
                                      Tarama
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {r.countryName || r.country}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Ziyaret Edilen Sayfa */}
                          <td className="py-2.5 px-3.5 align-middle">
                            <div className="max-w-md">
                              <span className="font-bold text-amber-300/90 block truncate leading-tight">
                                {sayfa.baslik}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 truncate block">
                                {r.method} {sayfa.altYol}
                              </span>
                            </div>
                          </td>

                          {/* 4. Nereden Geldi (Kaynak / Referrer) */}
                          <td className="py-2.5 px-3.5 align-middle whitespace-nowrap">
                            <span className="text-slate-300 block truncate font-medium">
                              {nereden}
                            </span>
                          </td>

                          {/* 5. Cihaz / Tarayıcı */}
                          <td className="py-2.5 px-3.5 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              {r.isBot ? (
                                <span className="text-violet-400 font-bold text-[11px]">
                                  🤖 {r.botName || 'Bot'}
                                </span>
                              ) : (
                                <>
                                  {r.deviceType === 'mobile' ? (
                                    <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  ) : r.deviceType === 'tablet' ? (
                                    <Tablet className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  ) : (
                                    <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span className="text-[11px]">
                                    {r.browser || 'Web'}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* 6. İşlem & Durum */}
                          <td className="py-2.5 px-3.5 align-middle text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  r.statusCode >= 200 && r.statusCode < 300
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : r.statusCode === 403
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-white/10 text-slate-400'
                                }`}
                              >
                                {r.statusCode}
                              </span>

                              {blocked ? (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                                  Engelli
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleBlockIp(r.ip, r.country, `Admin engeli: ${r.path}`)}
                                  disabled={blockBusy}
                                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-[10px] font-bold transition-colors cursor-pointer"
                                  title="Bu IP'yi engelle"
                                >
                                  Engelle
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setExpandedRowId(isExpanded ? null : r.id)}
                                className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                                title="Detayları Göster"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Açılır Ayrıntı Satırı */}
                        {isExpanded && (
                          <tr className="bg-black/30 border-b border-white/5">
                            <td colSpan={6} className="py-2.5 px-4 text-[11px] font-mono text-slate-400">
                              <div className="flex flex-wrap gap-x-6 gap-y-1">
                                <div><b className="text-slate-500">Tam Yol:</b> <span className="text-white">{r.path}</span></div>
                                <div><b className="text-slate-500">İşletim Sistemi:</b> <span className="text-slate-300">{r.os}</span></div>
                                <div><b className="text-slate-500">Yanıt Süresi:</b> <span className="text-slate-300">{r.durationMs}ms</span></div>
                                {r.referer && <div><b className="text-slate-500">Tam Referer:</b> <span className="text-slate-300">{r.referer}</span></div>}
                                <div className="w-full text-[10px] text-slate-500 truncate pt-1">
                                  <b>User-Agent:</b> {r.userAgent}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
