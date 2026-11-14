import React, { useEffect, useState, useMemo } from 'react';
import {
  Globe,
  Search,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Check,
  Copy,
  Ban,
  Activity,
  Users,
  ShieldX,
  ChevronDown,
  ChevronUp,
  Bot,
  Clock,
  ArrowRight,
  FileText,
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

export interface VisitorSession {
  sessionId: string;
  ip: string;
  country: string;
  countryName: string;
  countryFlag: string;
  isForeign: boolean;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  isBot: boolean;
  botName?: string;
  isSuspicious: boolean;
  referer: string;
  entryTime: string;
  lastSeenAt: string;
  isActive: boolean;
  durationSeconds: number;
  entryPath: string;
  exitPath: string;
  pagePaths: string[];
  totalRequests: number;
}

export interface VisitorAnalyticsSummary {
  totalToday: number;
  foreignToday: number;
  humanToday: number;
  botToday: number;
  suspiciousToday: number;
  uniqueIpsToday: number;
  liveLast15Min: number;
  realHumanSessionsToday: number;
  activeHumanSessionsNow: number;
  foreignOrBotSessionsToday: number;
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

type FilterMode = 'real_sessions' | 'bots_foreign' | 'raw_logs' | 'blocked';
type BotForeignSubFilter = 'all' | 'bots' | 'foreign' | 'suspicious';

function formatTarihSaat(iso: string): { saat: string; saniyeliSaat: string; tarih: string; goreceli: string } {
  try {
    const d = new Date(iso);
    const saat = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const saniyeliSaat = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tarih = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });

    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    let goreceli = 'Az önce';
    if (diffSec >= 60 && diffSec < 3600) goreceli = `${Math.floor(diffSec / 60)} dk önce`;
    else if (diffSec >= 3600 && diffSec < 86400) goreceli = `${Math.floor(diffSec / 3600)} sa önce`;
    else if (diffSec >= 86400) goreceli = `${Math.floor(diffSec / 86400)} gün önce`;

    return { saat, saniyeliSaat, tarih, goreceli };
  } catch {
    return { saat: '', saniyeliSaat: '', tarih: iso, goreceli: '' };
  }
}

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s === 0) return 'Anlık';
  if (s < 60) return `${s} sn`;
  const mins = Math.floor(s / 60);
  const remSec = s % 60;
  if (mins < 60) {
    return remSec > 0 ? `${mins} dk ${remSec} sn` : `${mins} dk`;
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs} sa ${remMins} dk` : `${hrs} sa`;
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
  if (path.startsWith('/fiyat')) return { baslik: 'Fiyatlandırma', altYol: path };
  if (path.startsWith('/demo')) return { baslik: 'Canlı Demo', altYol: path };
  if (path.startsWith('/ozellikler')) return { baslik: 'Özellikler', altYol: path };
  if (path.startsWith('/giris') || path.startsWith('/login')) return { baslik: 'Giriş Sayfası', altYol: path };
  if (path.startsWith('/kayit') || path.startsWith('/register')) return { baslik: 'Kayıt Sayfası', altYol: path };
  if (path.startsWith('/panel')) return { baslik: 'Esnaf Paneli', altYol: path };
  if (path.startsWith('/admin')) return { baslik: '🛡️ Yönetim Paneli', altYol: path };
  if (path.startsWith('/api/')) return { baslik: 'API Çağrısı', altYol: path };

  return { baslik: path.length > 32 ? path.slice(0, 32) + '...' : path, altYol: path };
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

function DeviceIcon({ deviceType }: { deviceType: VisitorSession['deviceType'] }) {
  if (deviceType === 'mobile') return <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  if (deviceType === 'tablet') return <Tablet className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  return <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

export function VisitorsTab() {
  const [realSessions, setRealSessions] = useState<VisitorSession[]>([]);
  const [botOrForeignSessions, setBotOrForeignSessions] = useState<VisitorSession[]>([]);
  const [records, setRecords] = useState<VisitorRecord[]>([]);
  const [summary, setSummary] = useState<VisitorAnalyticsSummary | null>(null);
  const [blockedIps, setBlockedIps] = useState<BlockedIpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>('real_sessions');
  const [botForeignSubFilter, setBotForeignSubFilter] = useState<BotForeignSubFilter>('all');
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
      if (filterMode !== 'blocked') {
        params.set('mode', filterMode);
      }
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '200');

      const [resVisitors, resBlocked] = await Promise.all([
        fetch(`/api/admin/visitors?${params.toString()}`),
        fetch('/api/admin/visitors/blocked'),
      ]);

      if (resVisitors.ok) {
        const data = await resVisitors.json();
        // Savunmacı ayrıştırma: gerçek sekmede asla bot/yabancı/şüpheli gösterme
        const cleanReal: VisitorSession[] = (data.realSessions || []).filter(
          (s: VisitorSession) => !s.isBot && !s.isForeign && !s.isSuspicious
        );
        const botForeign: VisitorSession[] = data.botOrForeignSessions || [];
        setRealSessions(cleanReal);
        setBotOrForeignSessions(botForeign);
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

  const filteredBotOrForeignSessions = useMemo(() => {
    if (botForeignSubFilter === 'bots') return botOrForeignSessions.filter((s) => s.isBot);
    if (botForeignSubFilter === 'foreign') return botOrForeignSessions.filter((s) => s.isForeign);
    if (botForeignSubFilter === 'suspicious') return botOrForeignSessions.filter((s) => s.isSuspicious);
    return botOrForeignSessions;
  }, [botOrForeignSessions, botForeignSubFilter]);

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {/* 1. ÜST İSTATİSTİK KARTLARI (Gerçek Oturum Odaklı) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Gerçek Ziyaretçi Oturumu */}
        <div className="bg-[#12172b] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <b className="text-2xl font-black text-white block leading-none">
              {summary?.realHumanSessionsToday ?? realSessions.length}
            </b>
            <span className="text-xs font-semibold text-slate-400">Gerçek Ziyaretçi Oturumu</span>
          </div>
        </div>

        {/* Şu An Sitede (Aktif) */}
        <div className="bg-[#12172b] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <b className="text-2xl font-black text-white block leading-none">
                {summary?.activeHumanSessionsNow ?? 0}
              </b>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Canlı
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400">Şu An Sitede (Aktif)</span>
          </div>
        </div>

        {/* Bot & Yabancı (Ayrıştırıldı) */}
        <div className="bg-[#12172b] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <b className="text-2xl font-black text-white block leading-none">
              {summary?.foreignOrBotSessionsToday ?? botOrForeignSessions.length}
            </b>
            <span className="text-xs font-semibold text-slate-400">Bot & Yabancı (Ayrıştırıldı)</span>
          </div>
        </div>

        {/* Engelli Zararlı IP */}
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

      {/* 2. SEKME VE ARAMA KONTROL ÇUBUĞU */}
      <div className="bg-[#12172b] border border-white/5 rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setExpandedRowId(null);
              setFilterMode('real_sessions');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'real_sessions'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🇹🇷 Gerçek Ziyaretçiler — Giriş & Çıkış ({realSessions.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setExpandedRowId(null);
              setFilterMode('bots_foreign');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'bots_foreign'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🤖 Botlar & Yabancı Trafik ({botOrForeignSessions.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setExpandedRowId(null);
              setFilterMode('raw_logs');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'raw_logs'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            📋 Ham İstek Günlüğü ({summary?.totalToday ?? records.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setExpandedRowId(null);
              setFilterMode('blocked');
            }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadData();
              }}
              placeholder="IP, ülke, tarayıcı veya sayfa ara..."
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
                      <td className="py-2.5 px-3 text-slate-400">
                        {formatTarihSaat(b.blockedAt).tarih} {formatTarihSaat(b.blockedAt).saat}
                      </td>
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
      ) : filterMode === 'real_sessions' ? (
        /* 4. VARSAYILAN SEKME: TÜRKİYE GERÇEK ZİYARETÇİ OTURUMLARI (GİRİŞ -> ÇIKIŞ) */
        <div className="bg-[#12172b] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-3.5 sm:px-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-white/[0.01]">
            <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>🇹🇷 Gerçek İnsan Ziyaretçileri — Tek Oturum Özeti ({realSessions.length} oturum)</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Botlar ve yabancı ülke trafiği hariç • 50+ istek tek satırda birleştirildi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-white/[0.02] text-slate-400 text-[11px] font-bold border-b border-white/5">
                  <th className="py-2.5 px-3.5 w-32">Durum</th>
                  <th className="py-2.5 px-3.5 w-48">Giriş → Çıkış / Süre</th>
                  <th className="py-2.5 px-3.5 w-56">Ziyaretçi (IP & Cihaz)</th>
                  <th className="py-2.5 px-3.5">Gezdiği Sayfalar</th>
                  <th className="py-2.5 px-3.5 w-36">Kaynak</th>
                  <th className="py-2.5 px-3.5 w-28 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {realSessions.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      Henüz Türkiye'den gerçek ziyaretçi oturumu kaydedilmedi.
                    </td>
                  </tr>
                ) : (
                  realSessions.map((s) => {
                    const blocked = isBlocked(s.ip);
                    const isExpanded = expandedRowId === s.sessionId;
                    const entryFmt = formatTarihSaat(s.entryTime);
                    const exitFmt = formatTarihSaat(s.lastSeenAt);
                    const entryPage = formatSayfaAdi(s.entryPath);
                    const exitPage = formatSayfaAdi(s.exitPath);
                    const refererLabel = formatReferrer(s.referer);
                    const visitedCount = s.pagePaths.length || 1;

                    return (
                      <React.Fragment key={s.sessionId}>
                        <tr
                          onClick={() => setExpandedRowId(isExpanded ? null : s.sessionId)}
                          className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                            s.isActive ? 'bg-emerald-500/[0.03]' : ''
                          }`}
                        >
                          {/* 1. Durum */}
                          <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                            {s.isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                🟢 Sitede
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[11px] font-semibold">
                                ⚪ Çıkış Yaptı
                              </span>
                            )}
                          </td>

                          {/* 2. Giriş -> Çıkış / Son Görülme & Süre */}
                          <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              <span>{entryFmt.saat}</span>
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                              <span className={s.isActive ? 'text-emerald-300' : 'text-slate-300'}>
                                {exitFmt.saat}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                              <Clock className="w-3 h-3 text-amber-400/80" />
                              <span className="font-semibold text-amber-300/90">
                                {formatDuration(s.durationSeconds)}
                              </span>
                              <span>•</span>
                              <span>{s.isActive ? 'Şimdi aktif' : `${exitFmt.tarih} (${exitFmt.goreceli})`}</span>
                            </div>
                          </td>

                          {/* 3. Ziyaretçi (IP, TR Bayrağı, Cihaz/Tarayıcı/OS) */}
                          <td className="py-3 px-3.5 align-middle">
                            <div className="flex items-center gap-2">
                              <span className="text-base leading-none" title={s.countryName}>
                                {s.countryFlag || '🇹🇷'}
                              </span>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(s.ip);
                                  }}
                                  title="IP'yi kopyala"
                                  className="font-mono font-bold text-white hover:text-amber-400 transition-colors inline-flex items-center gap-1"
                                >
                                  <span>{s.ip}</span>
                                  {copiedIp === s.ip ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5 text-slate-500 opacity-60" />
                                  )}
                                </button>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                                  <DeviceIcon deviceType={s.deviceType} />
                                  <span>
                                    {s.browser} • {s.os}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 4. Gezdiği Sayfalar */}
                          <td className="py-3 px-3.5 align-middle">
                            <div className="max-w-md space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="text-slate-400 text-[11px]">Giriş:</span>
                                <span className="font-bold text-amber-300 truncate max-w-[170px]" title={s.entryPath}>
                                  {entryPage.baslik}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="text-slate-400 text-[11px]">Son:</span>
                                <span className="font-bold text-emerald-300 truncate max-w-[170px]" title={s.exitPath}>
                                  {exitPage.baslik}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-semibold">
                                  {visitedCount} sayfa gezdi
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 font-semibold">
                                  {s.totalRequests} istek birleştirildi
                                </span>
                                <span className="text-slate-500 hidden sm:inline">
                                  (Detay için tıklayın)
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 5. Kaynak (Referrer) */}
                          <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                            <span className="text-slate-300 font-medium block truncate max-w-[130px]" title={s.referer}>
                              {refererLabel}
                            </span>
                          </td>

                          {/* 6. İşlem */}
                          <td className="py-3 px-3.5 align-middle text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {blocked ? (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                                  Engelli
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleBlockIp(s.ip, s.country, `Admin engeli: ${s.entryPath}`)}
                                  disabled={blockBusy}
                                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-[10px] font-bold transition-colors cursor-pointer"
                                  title="Bu IP'yi engelle"
                                >
                                  Engelle
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setExpandedRowId(isExpanded ? null : s.sessionId)}
                                className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                                title="Gezdiği sayfaları göster"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Açılır Kronolojik Sayfa Akışı */}
                        {isExpanded && (
                          <tr className="bg-black/30 border-b border-white/5">
                            <td colSpan={6} className="py-3 px-4 text-[11px] text-slate-300">
                              <div className="space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                                  <span className="font-bold text-white">
                                    Kronolojik Sayfa Akışı ({s.pagePaths.length > 0 ? s.pagePaths.length : 1} sayfa • {s.totalRequests} HTTP/API isteği)
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    İlk Giriş: {entryFmt.saniyeliSaat} — Son Görülme: {exitFmt.saniyeliSaat} ({formatDuration(s.durationSeconds)})
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {(s.pagePaths.length > 0 ? s.pagePaths : [s.entryPath]).map((p, idx, arr) => {
                                    const info = formatSayfaAdi(p);
                                    return (
                                      <React.Fragment key={`${s.sessionId}-path-${idx}`}>
                                        <span
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 font-mono text-[11px]"
                                          title={p}
                                        >
                                          <span className="text-amber-400 font-bold">{idx + 1}.</span>
                                          <span>{info.baslik}</span>
                                          <span className="text-slate-500 text-[10px]">({p})</span>
                                        </span>
                                        {idx < arr.length - 1 && (
                                          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </div>

                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-slate-400 pt-1">
                                  <div>
                                    <b className="text-slate-500">Cihaz / Tarayıcı / OS:</b> {s.deviceType} • {s.browser} • {s.os}
                                  </div>
                                  {s.referer && (
                                    <div>
                                      <b className="text-slate-500">Tam Referer:</b> <span className="font-mono">{s.referer}</span>
                                    </div>
                                  )}
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
      ) : filterMode === 'bots_foreign' ? (
        /* 5. BOTLAR & YABANCI ÜLKE TRAFİĞİ SEKMESİ */
        <div className="bg-[#12172b] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-3.5 sm:px-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/[0.01]">
            <div>
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>🤖 Botlar & Yabancı Ülke Trafiği ({filteredBotOrForeignSessions.length} oturum)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Gerçek ziyaretçi akışından tamamen ayrıştırılmış arama motoru botları, scriptler, tarayıcılar ve yurt dışı IP'ler.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: 'all', label: 'Tümü' },
                  { id: 'bots', label: '🤖 Botlar' },
                  { id: 'foreign', label: '🌍 Yabancı IP' },
                  { id: 'suspicious', label: '⚠️ Şüpheli Tarama' },
                ] as { id: BotForeignSubFilter; label: string }[]
              ).map((sf) => (
                <button
                  key={sf.id}
                  type="button"
                  onClick={() => setBotForeignSubFilter(sf.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    botForeignSubFilter === sf.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {sf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-white/[0.02] text-slate-400 text-[11px] font-bold border-b border-white/5">
                  <th className="py-2.5 px-3.5 w-40">İlk / Son Görülme</th>
                  <th className="py-2.5 px-3.5 w-56">IP & Ülke</th>
                  <th className="py-2.5 px-3.5 w-44">Sınıflandırma / Bot</th>
                  <th className="py-2.5 px-3.5">Hedef Sayfalar & İstek</th>
                  <th className="py-2.5 px-3.5 w-28 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBotOrForeignSessions.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      Bu filtreye uygun bot veya yabancı trafik oturumu yok.
                    </td>
                  </tr>
                ) : (
                  filteredBotOrForeignSessions.map((s) => {
                    const blocked = isBlocked(s.ip);
                    const isExpanded = expandedRowId === s.sessionId;
                    const entryFmt = formatTarihSaat(s.entryTime);
                    const exitFmt = formatTarihSaat(s.lastSeenAt);

                    return (
                      <React.Fragment key={s.sessionId}>
                        <tr
                          onClick={() => setExpandedRowId(isExpanded ? null : s.sessionId)}
                          className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                            s.isSuspicious ? 'bg-rose-500/[0.04]' : 'bg-amber-500/[0.015]'
                          }`}
                        >
                          <td className="py-2.5 px-3.5 align-middle whitespace-nowrap">
                            <span className="font-bold text-white block leading-tight">
                              {entryFmt.saat} → {exitFmt.saat}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {exitFmt.tarih} ({exitFmt.goreceli})
                            </span>
                          </td>

                          <td className="py-2.5 px-3.5 align-middle">
                            <div className="flex items-center gap-2">
                              <span className="text-base leading-none" title={s.countryName}>
                                {s.countryFlag}
                              </span>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(s.ip);
                                  }}
                                  className="font-mono font-bold text-white hover:text-amber-400 transition-colors inline-flex items-center gap-1"
                                >
                                  <span>{s.ip}</span>
                                  {copiedIp === s.ip ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5 text-slate-500 opacity-60" />
                                  )}
                                </button>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {s.countryName || s.country}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-3.5 align-middle">
                            <div className="flex flex-wrap gap-1">
                              {s.isBot && (
                                <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[10px] font-bold">
                                  🤖 {s.botName || 'Bot'}
                                </span>
                              )}
                              {s.isForeign && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                  🌍 Yabancı ({s.country})
                                </span>
                              )}
                              {s.isSuspicious && (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                                  ⚠️ Tarama
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3.5 align-middle">
                            <div className="max-w-md">
                              <span className="font-mono text-slate-200 text-[11px] block truncate">
                                {s.entryPath}
                                {s.exitPath && s.exitPath !== s.entryPath ? ` → ${s.exitPath}` : ''}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {s.totalRequests} istek birleştirildi • {formatDuration(s.durationSeconds)}
                              </span>
                            </div>
                          </td>

                          <td className="py-2.5 px-3.5 align-middle text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {blocked ? (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                                  Engelli
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleBlockIp(s.ip, s.country, `Bot/Yabancı IP engeli: ${s.botName || s.country}`)}
                                  disabled={blockBusy}
                                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  Engelle
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setExpandedRowId(isExpanded ? null : s.sessionId)}
                                className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-black/30 border-b border-white/5">
                            <td colSpan={5} className="py-2.5 px-4 text-[11px] font-mono text-slate-400">
                              <div className="flex flex-wrap gap-2">
                                <span className="text-slate-500 font-bold">Gezilen Yollar:</span>
                                {(s.pagePaths.length > 0 ? s.pagePaths : [s.entryPath]).map((p, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-200">
                                    {p}
                                  </span>
                                ))}
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
      ) : (
        /* 6. HAM İSTEK GÜNLÜĞÜ SEKMESİ (RAW LOGS) */
        <div className="bg-[#12172b] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-3.5 sm:px-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Ham HTTP İstek Günlüğü ({records.length} istek)</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Teknik inceleme için tekil istek kayıtları
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-white/[0.02] text-slate-400 text-[11px] font-bold border-b border-white/5">
                  <th className="py-2.5 px-3.5 w-32">Tarih / Saat</th>
                  <th className="py-2.5 px-3.5 w-56">Kim / Nereden (IP & Ülke)</th>
                  <th className="py-2.5 px-3.5">İstek Yolu</th>
                  <th className="py-2.5 px-3.5 w-40">Nereden Geldi</th>
                  <th className="py-2.5 px-3.5 w-36">Cihaz / Bot</th>
                  <th className="py-2.5 px-3.5 w-28 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      Bu filtreye uygun ham istek kaydı bulunamadı.
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
                          <td className="py-2.5 px-3.5 align-middle whitespace-nowrap">
                            <span className="font-bold text-white block leading-tight">
                              {zaman.saniyeliSaat}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {zaman.tarih} ({zaman.goreceli})
                            </span>
                          </td>

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

                          <td className="py-2.5 px-3.5 align-middle whitespace-nowrap">
                            <span className="text-slate-300 block truncate font-medium">
                              {nereden}
                            </span>
                          </td>

                          <td className="py-2.5 px-3.5 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              {r.isBot ? (
                                <span className="text-violet-400 font-bold text-[11px]">
                                  🤖 {r.botName || 'Bot'}
                                </span>
                              ) : (
                                <>
                                  <DeviceIcon deviceType={r.deviceType} />
                                  <span className="text-[11px]">
                                    {r.browser || 'Web'}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

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
                                >
                                  Engelle
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setExpandedRowId(isExpanded ? null : r.id)}
                                className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                        </tr>

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
