import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Globe,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Search,
  RefreshCw,
  Bot,
  User,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  AlertTriangle,
  Trash2,
  SlidersHorizontal,
  Check,
  Copy,
  ExternalLink,
  Ban,
  Activity,
  Layers,
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

type FilterMode = 'all' | 'foreign' | 'human' | 'bots' | 'customers' | 'suspicious' | 'blocked';

function formatRelativeTime(iso: string): string {
  try {
    const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffSec < 5) return 'Az önce';
    if (diffSec < 60) return `${diffSec} sn önce`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} sa önce`;
    return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export function VisitorsTab() {
  const [records, setRecords] = useState<VisitorRecord[]>([]);
  const [summary, setSummary] = useState<VisitorAnalyticsSummary | null>(null);
  const [blockedIps, setBlockedIps] = useState<BlockedIpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(10); // 10 saniye varsayılan
  const [selectedRecord, setSelectedRecord] = useState<VisitorRecord | null>(null);
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
      if (filterMode === 'suspicious') params.set('suspiciousOnly', '1');
      if (filterMode === 'customers') params.set('customerOnly', '1');
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '250');

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

  // Otomatik yenileme zamanlayıcısı
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      loadData(true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, filterMode, search]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleBlockIp = async (ip: string, country?: string, reason = 'Şüpheli yabancı istek / Admin engeli') => {
    if (!window.confirm(`${ip} IP adresini engellemek istediğinize emin misiniz? Bu IP artık siteye erişemeyecektir.`)) {
      return;
    }
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
    if (!window.confirm(`${ip} üzerindeki engeli kaldırmak istiyor musunuz?`)) return;
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
          reason: manualBlockReason.trim() || 'Manuel IP engeli',
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

  const foreignPercent = summary && summary.totalToday > 0
    ? Math.round((summary.foreignToday / summary.totalToday) * 100)
    : 0;

  return (
    <div className="space-y-5 font-sans">
      {/* 1. ÜST ÖZET KARTLARI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Canlı Ziyaretçi */}
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Canlı (15 Dk)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-white">{summary?.liveLast15Min ?? 0}</p>
            <p className="text-[10px] font-semibold text-emerald-400">Aktif Tekil IP</p>
          </div>
        </div>

        {/* Yabancı IP Trafiği */}
        <div className="rounded-2xl bg-[#12172b] border border-amber-500/20 bg-amber-500/[0.02] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300">Yabancı IP</span>
            <Globe className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-amber-400">{summary?.foreignToday ?? 0}</p>
            <p className="text-[10px] font-semibold text-amber-300/80">%{foreignPercent} yurt dışı</p>
          </div>
        </div>

        {/* Toplam Günlük İstek */}
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Bugün Toplam</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-white">{summary?.totalToday ?? 0}</p>
            <p className="text-[10px] font-semibold text-slate-400">{summary?.uniqueIpsToday ?? 0} Tekil IP</p>
          </div>
        </div>

        {/* Gerçek İnsan */}
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">İnsan Trafiği</span>
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-emerald-400">{summary?.humanToday ?? 0}</p>
            <p className="text-[10px] font-semibold text-slate-400">Kullanıcı & Esnaf</p>
          </div>
        </div>

        {/* Bot & Arama Motoru */}
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Botlar</span>
            <Bot className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-violet-400">{summary?.botToday ?? 0}</p>
            <p className="text-[10px] font-semibold text-slate-400">Google, Yandex vb.</p>
          </div>
        </div>

        {/* Şüpheli / Güvenlik Taramaları */}
        <div className="rounded-2xl bg-[#12172b] border border-rose-500/20 bg-rose-500/[0.02] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-300">Güvenlik</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-rose-400">{summary?.suspiciousToday ?? 0}</p>
            <p className="text-[10px] font-semibold text-rose-300/80">{blockedIps.length} Engelli IP</p>
          </div>
        </div>
      </div>

      {/* 2. ÜLKELER DAĞILIMI VE KATEGORİ DAĞILIMI BİLGİ BANDI */}
      {summary && summary.topCountries && summary.topCountries.length > 0 && (
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-slate-300 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              Ülkelere Göre Ziyaretçi Dağılımı (Cloudflare Anlık Tespiti)
            </h3>
            <span className="text-[10px] font-semibold text-slate-500">Ülkeye tıklayarak anında filtreleyebilirsiniz</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {summary.topCountries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setSearch(c.code);
                  loadData();
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  search.toUpperCase() === c.code
                    ? 'bg-amber-500/20 border-amber-500 text-white'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl leading-none">{c.flag}</span>
                  <span className="text-[10px] font-black font-mono text-slate-400">{c.code}</span>
                </div>
                <p className="mt-1.5 text-xs font-black truncate">{c.name}</p>
                <div className="mt-1 flex items-baseline justify-between text-[10px]">
                  <span className="font-bold text-white">{c.count} hit</span>
                  <span className="text-slate-500">%{c.percentage}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c.code === 'TR' ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min(100, c.percentage)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. FİLTRE VE ARAMA KONTROLLERİ */}
      <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filtre Butonları */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tüm Ziyaretler', count: summary?.totalToday },
              { id: 'foreign', label: '🌍 Yalnızca Yabancı IP', count: summary?.foreignToday, highlight: 'text-amber-400' },
              { id: 'human', label: '👤 İnsan Trafiği', count: summary?.humanToday },
              { id: 'bots', label: '🤖 Bot & Arama Motoru', count: summary?.botToday },
              { id: 'customers', label: '✂️ Randevu & Menü (/r/ & /m/)' },
              { id: 'suspicious', label: '⚠️ Güvenlik Taramaları', count: summary?.suspiciousToday, highlight: 'text-rose-400' },
              { id: 'blocked', label: `🚫 Engellenen IP'ler (${blockedIps.length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterMode(f.id as FilterMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  filterMode === f.id
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{f.label}</span>
                {typeof f.count === 'number' && f.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Yenileme & Otomatik Akış Kontrolleri */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <span className="text-[11px] font-semibold text-slate-400">Oto Yenile:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              aria-label="Otomatik yenileme aralığı"
              className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value={0} className="bg-[#12172b]">Kapalı</option>
              <option value={5} className="bg-[#12172b]">5 saniye</option>
              <option value={10} className="bg-[#12172b]">10 saniye</option>
              <option value={30} className="bg-[#12172b]">30 saniye</option>
            </select>

            <button
              type="button"
              onClick={() => loadData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-black transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* Arama Alanı */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }}
            placeholder="IP adresi, ülke (örn: US, DE), taranan sayfa (/r/..., /wp-login) veya tarayıcı ara..."
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-20 py-2.5 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setTimeout(() => loadData(), 50); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* 4. ENGELLENEN IP'LER YÖNETİM MODU */}
      {filterMode === 'blocked' ? (
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-400" />
                Engellenen Zararlı / Yabancı IP Adresleri
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bu listedeki IP adreslerinin sunucuya yaptığı tüm istekler anında 403 Forbidden ile engellenir.
              </p>
            </div>
          </div>

          {/* Manuel IP Ekleme Formu */}
          <form onSubmit={handleManualBlock} className="flex flex-col sm:flex-row gap-2 pt-2">
            <input
              type="text"
              value={manualBlockIp}
              onChange={(e) => setManualBlockIp(e.target.value)}
              placeholder="Engellenecek IP (örn: 198.51.100.42)"
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <input
              type="text"
              value={manualBlockReason}
              onChange={(e) => setManualBlockReason(e.target.value)}
              placeholder="Engelleme nedeni (örn: Port taraması, Brute-force)"
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={blockBusy || !manualBlockIp.trim()}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>IP'yi Engelle</span>
            </button>
          </form>

          {/* Engelli Liste */}
          <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden mt-3">
            {blockedIps.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-500 font-semibold">
                Henüz engellenmiş bir IP adresi bulunmuyor.
              </p>
            ) : (
              blockedIps.map((b) => (
                <div key={b.ip} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.02]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="font-mono font-black text-rose-300 text-xs">{b.ip}</span>
                    {b.country && (
                      <span className="text-xs px-2 py-0.5 rounded bg-white/5 font-semibold text-slate-300">
                        {b.country}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{b.reason}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">{formatRelativeTime(b.blockedAt)}</span>
                    <button
                      type="button"
                      onClick={() => handleUnblockIp(b.ip)}
                      disabled={blockBusy}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-black transition-colors cursor-pointer"
                    >
                      Engeli Kaldır
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* 5. CANLI ZİYARETÇİ VE YABANCI IP TABLOSU */
        <div className="rounded-2xl bg-[#12172b] border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <p className="text-xs font-black text-slate-300">
              Son Ziyaret Akışı ({records.length} istek gösteriliyor)
            </p>
            <span className="text-[10px] font-semibold text-slate-500">
              Sayfa tıklamaları, yabancı IP'ler ve tarayıcı detayları
            </span>
          </div>

          {records.length === 0 && !loading && (
            <div className="p-12 text-center space-y-2">
              <Globe className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-400">Bu filtrelere uygun ziyaret kaydı bulunamadı.</p>
              <p className="text-[11px] text-slate-500">Filtreleri temizleyerek tüm site trafiğini görebilirsiniz.</p>
            </div>
          )}

          <div className="divide-y divide-white/5">
            {records.map((r) => {
              const blocked = isBlocked(r.ip);
              return (
                <div
                  key={r.id}
                  className={`p-3.5 sm:px-4 text-xs transition-colors hover:bg-white/[0.03] ${
                    r.isSuspicious ? 'bg-rose-500/[0.04]' : r.isForeign ? 'bg-amber-500/[0.02]' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                    {/* Sol Kısım: Ülke, IP, Rozetler */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Ülke Bayrağı ve Kodu */}
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 font-bold shrink-0">
                        <span className="text-base leading-none">{r.countryFlag}</span>
                        <span className="font-mono text-[11px]">{r.country}</span>
                        <span className="text-slate-400 hidden sm:inline">({r.countryName})</span>
                      </span>

                      {/* IP Adresi ve Kopyalama */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(r.ip)}
                        title="IP'yi panoya kopyala"
                        className="inline-flex items-center gap-1 font-mono font-black text-white hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <span>{r.ip}</span>
                        {copiedIp === r.ip ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500 opacity-60" />
                        )}
                      </button>

                      {/* Yabancı IP Rozeti */}
                      {r.isForeign && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Yabancı IP
                        </span>
                      )}

                      {/* Bot / Tarayıcı Rozeti */}
                      {r.isBot ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          <Bot className="w-3 h-3" />
                          <span>{r.botName || 'Bot'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                          {r.deviceType === 'mobile' ? (
                            <Smartphone className="w-3 h-3" />
                          ) : r.deviceType === 'tablet' ? (
                            <Tablet className="w-3 h-3" />
                          ) : (
                            <Monitor className="w-3 h-3" />
                          )}
                          <span>{r.browser}</span>
                        </span>
                      )}

                      {/* Şüpheli / Güvenlik Girişimi Rozeti */}
                      {r.isSuspicious && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Tarama Tehdidi</span>
                        </span>
                      )}

                      {/* Randevu / QR Menü Rozeti */}
                      {r.category === 'barber' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Online Randevu Sayfası
                        </span>
                      )}
                      {r.category === 'menu' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          Müşteri QR Menü
                        </span>
                      )}
                    </div>

                    {/* Sağ Kısım: Zaman, Yanıt Kodu, Aksiyon */}
                    <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
                      {/* Durum Kodu */}
                      <span
                        className={`font-mono text-[11px] font-black px-1.5 py-0.5 rounded ${
                          r.statusCode >= 200 && r.statusCode < 300
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : r.statusCode >= 300 && r.statusCode < 400
                            ? 'bg-sky-500/20 text-sky-300'
                            : r.statusCode === 403
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-zinc-700/50 text-slate-300'
                        }`}
                      >
                        {r.statusCode}
                      </span>

                      <span className="text-[10px] font-mono text-slate-500">
                        {r.durationMs}ms
                      </span>

                      <span className="text-[11px] font-semibold text-slate-400">
                        {formatRelativeTime(r.timestamp)}
                      </span>

                      {/* Engelleme Aksiyonu */}
                      {blocked ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-black">
                          Engellendi
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBlockIp(r.ip, r.country, `Şüpheli yabancı istek: ${r.path}`)}
                          className="px-2 py-0.5 rounded bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-[10px] font-black transition-colors cursor-pointer"
                          title="Bu IP adresinin siteye erişimini engelle"
                        >
                          Engelle
                        </button>
                      )}

                      {/* İncele Butonu */}
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(selectedRecord?.id === r.id ? null : r)}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black transition-colors cursor-pointer"
                      >
                        {selectedRecord?.id === r.id ? 'Kapat' : 'Detay'}
                      </button>
                    </div>
                  </div>

                  {/* İstek Satırı: Metot & Yol */}
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[10px] font-mono font-black text-slate-500 uppercase shrink-0">
                      {r.method}
                    </span>
                    <a
                      href={r.path.startsWith('http') ? r.path : r.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-amber-300/90 hover:text-amber-200 hover:underline truncate max-w-2xl"
                    >
                      {r.path}
                    </a>
                    {r.referer && (
                      <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                        (Ref: {r.referer})
                      </span>
                    )}
                  </div>

                  {/* Detay Açılır Paneli */}
                  {selectedRecord?.id === r.id && (
                    <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-[11px] font-mono">
                      <div className="grid sm:grid-cols-2 gap-2 text-slate-300">
                        <div>
                          <span className="text-slate-500">İşletim Sistemi:</span> {r.os}
                        </div>
                        <div>
                          <span className="text-slate-500">Tarayıcı:</span> {r.browser}
                        </div>
                        <div>
                          <span className="text-slate-500">Zaman Damgası:</span> {new Date(r.timestamp).toLocaleString('tr-TR')}
                        </div>
                        <div>
                          <span className="text-slate-500">Kategori:</span> {r.category}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/5 break-all">
                        <span className="text-slate-500">Tam User-Agent:</span>{' '}
                        <span className="text-slate-300">{r.userAgent || 'Yok'}</span>
                      </div>
                      {r.referer && (
                        <div className="break-all">
                          <span className="text-slate-500">Geliş Kaynağı (Referer):</span>{' '}
                          <span className="text-slate-300">{r.referer}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
