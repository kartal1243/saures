import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ShieldCheck,
  Store,
  Phone,
  CalendarDays,
  Globe,
  LogIn,
  Users,
  Package,
  ReceiptText,
  CalendarClock,
  UtensilsCrossed,
  Truck,
  UserPlus,
  HardDrive,
  RefreshCw,
  ChevronDown,
  Radio,
  Crown,
  Monitor,
  Smartphone,
  Eye,
  X,
  CreditCard,
  Banknote,
  Wrench,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface StaffRow {
  name: string;
  phone: string;
  position: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
}

interface ShopRow {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  createdAt: string;
  createdIp: string | null;
  lastLoginIp: string | null;
  lastLoginAt: string | null;
  loginCount: number;
  activeSessions: number;
  isWsConnected?: boolean;
  isRecentActive?: boolean;
  liveStatus: 'live_ws' | 'recent_active' | 'offline';
  liveDevice?: 'mobile' | 'desktop' | 'tablet' | null;
  liveBrowser?: string | null;
  isVip?: boolean;
  vipTier?: string | null;
  vipPlan?: string | null;
  vipUntil?: string | null;
  sector: string | null;
  cityDistrict: string | null;
  customers: number;
  products: number;
  transactions: number;
  appointments: number;
  tables: number;
  suppliers: number;
  staffCount: number;
  staff: StaffRow[];
  dataKB: number;
  lastUpdated: string | null;
}

interface LiveSnapshotData {
  shop: {
    id: string;
    shopName: string;
    ownerName: string;
    phone: string;
    createdAt: string;
    isVip: boolean;
    vipTier: string;
    vipUntil: string | null;
    businessField: string;
    cityDistrict: string;
  };
  liveStatus: {
    isWsConnected: boolean;
    isRecentActive: boolean;
    status: 'online_ws' | 'online_http' | 'offline';
    ip: string;
    deviceType: 'mobile' | 'desktop' | 'tablet';
    browserInfo: string;
    connectedAt: string | null;
  };
  finance: {
    todayIncomeTotal: number;
    todayExpenseTotal: number;
    netTotal: number;
    txCount: number;
    cashTotal: number;
    cardTotal: number;
    creditTotal: number;
    totalCashRegister: number;
    recentTransactions: any[];
  };
  tables: {
    total: number;
    occupiedCount: number;
    tablesOpenTotal: number;
    occupiedList: {
      id: string;
      name: string;
      orderCount: number;
      totalAmount: number;
      openedAt: string | null;
    }[];
  };
  appointments: {
    totalToday: number;
    list: {
      id: string;
      time: string;
      customerName: string;
      serviceName: string;
      price?: number;
      status: string;
    }[];
  };
  repairTickets: {
    totalActive: number;
    list: any[];
  };
  customers: {
    total: number;
    debtCount: number;
    totalReceivable: number;
  };
  products: {
    total: number;
  };
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtCurrency(val: number): string {
  return (val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

function getPackageBadge(s: ShopRow) {
  const isVipActive = Boolean(s.isVip && (!s.vipUntil || new Date(s.vipUntil).getTime() > Date.now()));
  if (!isVipActive) {
    return {
      label: 'Çırak (Ücretsiz)',
      cls: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700',
      isVip: false,
      tier: 'cirak',
    };
  }
  const isTrial = s.vipPlan === 'deneme_14_gun' || s.vipPlan === '14_gun_deneme';
  if (isTrial) {
    return {
      label: '14 Gün Deneme',
      cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      isVip: true,
      tier: 'deneme',
    };
  }
  if (s.vipTier === 'usta') {
    return {
      label: `Usta VIP (${s.vipPlan === 'yearly' ? 'Yıllık' : 'Aylık'})`,
      cls: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
      isVip: true,
      tier: 'usta',
    };
  }
  return {
    label: `Patron VIP (${s.vipPlan === 'yearly' ? 'Yıllık' : 'Aylık'})`,
    cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    isVip: true,
    tier: 'patron',
  };
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 px-3 py-2">
      <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{label}</p>
        <p className="text-sm font-black text-stone-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

export const AdminPanel: React.FC<{ initialQuery?: string }> = ({ initialQuery }) => {
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(initialQuery || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'vip'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  // Canlı Röntgen Modalı
  const [inspectShopId, setInspectShopId] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotData, setSnapshotData] = useState<LiveSnapshotData | null>(null);

  useEffect(() => {
    if (initialQuery !== undefined) setQuery(initialQuery);
  }, [initialQuery]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/shops');
      if (res.status === 401 || res.status === 403) {
        setError('Bu sayfa sadece admin girişiyle açılır. /admin adresinden giriş yap.');
        setShops([]);
        return;
      }
      if (!res.ok) throw new Error('Liste alınamadı.');
      const data = await res.json();
      setShops(Array.isArray(data.shops) ? data.shops : []);
    } catch (e) {
      setError('Liste yüklenemedi. Bağlantını kontrol et.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000); // 20 saniyede bir otomatik tazele
    return () => clearInterval(interval);
  }, []);

  const openSnapshotModal = async (shopId: string) => {
    setInspectShopId(shopId);
    setSnapshotLoading(true);
    setSnapshotData(null);
    try {
      const res = await fetch(`/api/admin/shops/${shopId}/live-snapshot`);
      if (res.ok) {
        const data = await res.json();
        setSnapshotData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleSetVip = async (
    shop: ShopRow,
    options: { days?: number; plan?: string; tier?: 'usta' | 'patron'; action: 'grant' | 'revoke' }
  ) => {
    if (options.action === 'revoke') {
      if (!confirm(`${shop.shopName} VIP üyeliği sonlandırılsın ve Çırak seviyesine düşürülsün mü?`)) return;
    } else {
      const tierLabel = options.tier === 'usta' ? 'Usta VIP' : 'Patron VIP';
      const durationLabel = options.days === 14 ? '14 Gün Deneme' : options.days === 365 ? '1 Yıl (365 Gün)' : `${options.days} Gün`;
      if (!confirm(`${shop.shopName} için ${durationLabel} süreli ${tierLabel} paketi tanımlansın mı?`)) return;
    }

    try {
      const res = await fetch(`/api/admin/shops/${shop.id}/toggle-vip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!res.ok) {
        alert('VIP durumu güncellenemedi.');
        return;
      }
      load();
    } catch {
      alert('Bağlantı hatası.');
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLocaleLowerCase('tr-TR').trim();
    return shops.filter((s) => {
      // Metin arama
      if (q) {
        const match =
          s.shopName.toLocaleLowerCase('tr-TR').includes(q) ||
          s.ownerName.toLocaleLowerCase('tr-TR').includes(q) ||
          s.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
          (s.sector || '').toLocaleLowerCase('tr-TR').includes(q);
        if (!match) return false;
      }
      // Durum filtresi
      if (statusFilter === 'live') {
        return s.liveStatus !== 'offline';
      }
      if (statusFilter === 'vip') {
        return Boolean(s.isVip);
      }
      return true;
    });
  }, [shops, query, statusFilter]);

  const totals = useMemo(() => {
    const liveCount = shops.filter((s) => s.liveStatus !== 'offline').length;
    const wsCount = shops.filter((s) => s.liveStatus === 'live_ws').length;
    const vipCount = shops.filter((s) => s.isVip).length;
    return {
      shops: shops.length,
      liveCount,
      wsCount,
      vipCount,
      customers: shops.reduce((t, s) => t + s.customers, 0),
      transactions: shops.reduce((t, s) => t + s.transactions, 0),
    };
  }, [shops]);

  return (
    <div className="space-y-4">
      {/* Üst Bilgi Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" /> Dükkânım Yanımda · Kayıtlı Dükkanlar
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400 font-semibold mt-1">
            <span>Toplam: <strong className="text-stone-900 dark:text-white">{totals.shops}</strong> dükkan</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {totals.liveCount} Canlı ({totals.wsCount} WebSocket)
            </span>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{totals.vipCount} VIP</span>
            <span>·</span>
            <span>{totals.customers} müşteri</span>
            <span>·</span>
            <span>{totals.transactions} işlem</span>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-black hover:opacity-90 transition-opacity cursor-pointer self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Listeyi Yenile
        </button>
      </div>

      {/* Arama ve Filtreler */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dükkan adı, esnaf adı, telefon veya sektör ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm font-semibold text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusFilter === 'all'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Tümü ({shops.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('live')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusFilter === 'live'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Canlılar ({totals.liveCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('vip')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusFilter === 'vip'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            VIP ({totals.vipCount})
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-600 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Dükkan Kartları Listesi */}
      <div className="space-y-3">
        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-400 text-sm font-semibold">
            Kriterlere uygun dükkan bulunamadı.
          </div>
        )}

        {filtered.map((s) => {
          const isOpen = openId === s.id;
          const isLiveWs = s.liveStatus === 'live_ws';
          const isRecent = s.liveStatus === 'recent_active';

          return (
            <div
              key={s.id}
              className={`rounded-2xl border transition-all ${
                isLiveWs
                  ? 'bg-emerald-500/[0.02] border-emerald-500/30 dark:border-emerald-500/20 shadow-xs'
                  : isOpen
                  ? 'bg-white dark:bg-stone-900 border-amber-500/40 shadow-md'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              {/* Başlık Satırı */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isLiveWs
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isRecent
                        ? 'bg-amber-500 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    <Store className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-stone-900 dark:text-white truncate">
                        {s.shopName}
                      </h3>
                      {/* Paket Seviyesi Rozeti (Çırak / 14 Gün Deneme / Usta / Patron VIP) */}
                      {(() => {
                        const badge = getPackageBadge(s);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badge.cls}`}
                            title={s.vipUntil ? `Bitiş: ${fmtDate(s.vipUntil)}` : undefined}
                          >
                            {badge.isVip && <Crown className="w-3 h-3 shrink-0" />}
                            {badge.label}
                          </span>
                        );
                      })()}
                      {s.sector && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {s.sector}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-0.5">
                      {s.ownerName} · <a href={`tel:${s.phone.replace(/\s+/g, '')}`} className="text-amber-600 dark:text-amber-400 font-bold hover:underline">{s.phone}</a>
                      {s.cityDistrict ? ` · ${s.cityDistrict}` : ''}
                    </p>
                  </div>
                </div>

                {/* Sağ Taraf: Canlı Durum Rozeti ve Butonlar */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                  {/* Canlı Bağlantı Rozeti */}
                  {isLiveWs ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Canlı (WebSocket)
                      {s.liveDevice === 'mobile' ? (
                        <span title="Mobil Cihaz"><Smartphone className="w-3.5 h-3.5 ml-0.5 opacity-80" /></span>
                      ) : (
                        <span title="Masaüstü"><Monitor className="w-3.5 h-3.5 ml-0.5 opacity-80" /></span>
                      )}
                    </span>
                  ) : isRecent ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Son 5 dk Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-500">
                      Çevrimdışı
                    </span>
                  )}

                  {/* Canlı Röntgen Butonu */}
                  <button
                    type="button"
                    onClick={() => openSnapshotModal(s.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-black transition-colors cursor-pointer"
                    title="Dükkanın anlık röntgenini (ciro, masalar, randevular, kasa) incele"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Canlı Durum
                  </button>

                  {/* Detay Aç/Kapa Butonu */}
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : s.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-black hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                  >
                    Yönet
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Açılır Yönetim ve İstatistik Detayı */}
              {isOpen && (
                <div className="border-t border-stone-100 dark:border-stone-800 p-4 space-y-4 bg-stone-50/50 dark:bg-stone-900/50 rounded-b-2xl">
                  {/* Temel Metrikler */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    <Stat icon={Users} label="Müşteri" value={s.customers} />
                    <Stat icon={Package} label="Ürün / Stok" value={s.products} />
                    <Stat icon={ReceiptText} label="İşlem" value={s.transactions} />
                    <Stat icon={CalendarClock} label="Randevu" value={s.appointments} />
                    <Stat icon={UtensilsCrossed} label="Masa" value={s.tables} />
                    <Stat icon={HardDrive} label="Veri Boyutu" value={`${s.dataKB} KB`} />
                  </div>

                  {/* Güvenlik & Oturum Bilgileri */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    <Stat icon={CalendarDays} label="Kayıt Tarihi" value={fmtDate(s.createdAt)} />
                    <Stat icon={Globe} label="Kayıt IP" value={s.createdIp || '—'} />
                    <Stat icon={LogIn} label="Son Giriş" value={fmtDate(s.lastLoginAt)} />
                    <Stat icon={Globe} label="Son IP" value={s.lastLoginIp || '—'} />
                  </div>

                  {/* Manuel VIP & Paket Yönetim Bölümü */}
                  <div className="rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/15 pb-2.5">
                      <div>
                        <p className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <Crown className="w-4 h-4 text-amber-500" /> Manuel VIP & Paket Tanımlama
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold mt-0.5">
                          Mevcut Seviye: <strong className="text-stone-800 dark:text-stone-100">{getPackageBadge(s).label}</strong>
                          {s.vipUntil && ` · Bitiş Tarihi: ${fmtDate(s.vipUntil)}`}
                        </p>
                      </div>
                      {s.isVip && (
                        <button
                          type="button"
                          onClick={() => handleSetVip(s, { action: 'revoke' })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer self-start sm:self-auto"
                        >
                          <X className="w-3.5 h-3.5" /> VIP İptal Et (Çırak'a Düşür)
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-800/70 dark:text-amber-300/70">
                        Hızlı Paket & Süre Tanımla:
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 14 Gün Deneme */}
                        <button
                          type="button"
                          onClick={() => handleSetVip(s, { days: 14, plan: 'deneme_14_gun', tier: 'usta', action: 'grant' })}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> +14 Gün Deneme (Usta)
                        </button>

                        {/* 30 Gün Usta VIP */}
                        <button
                          type="button"
                          onClick={() => handleSetVip(s, { days: 30, plan: 'monthly', tier: 'usta', action: 'grant' })}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25 border border-blue-500/30 cursor-pointer transition-colors"
                        >
                          <Crown className="w-3.5 h-3.5 text-blue-500" /> +30 Gün Usta VIP
                        </button>

                        {/* 30 Gün Patron VIP */}
                        <button
                          type="button"
                          onClick={() => handleSetVip(s, { days: 30, plan: 'monthly', tier: 'patron', action: 'grant' })}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-amber-500/15 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 border border-amber-500/30 cursor-pointer transition-colors"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-500" /> +30 Gün Patron VIP
                        </button>

                        {/* 365 Gün Patron VIP */}
                        <button
                          type="button"
                          onClick={() => handleSetVip(s, { days: 365, plan: 'yearly', tier: 'patron', action: 'grant' })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-95 shadow-xs cursor-pointer transition-opacity"
                        >
                          <Crown className="w-3.5 h-3.5" /> +365 Gün (1 Yıl) Patron VIP
                        </button>

                        {/* 365 Gün Usta VIP */}
                        <button
                          type="button"
                          onClick={() => handleSetVip(s, { days: 365, plan: 'yearly', tier: 'usta', action: 'grant' })}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer transition-colors"
                        >
                          <Crown className="w-3.5 h-3.5" /> +365 Gün Usta VIP
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Diğer Güvenlik ve Silme İşlemleri */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`${s.shopName} oturumları sonlandırılsın mı? Dükkan tüm cihazlardan atılacak.`)) return;
                        const res = await fetch(`/api/admin/shops/${s.id}/kick`, { method: 'POST' });
                        if (!res.ok) { alert('Oturum kapatılamadı.'); return; }
                        load();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black hover:bg-amber-500/25 transition-colors cursor-pointer"
                    >
                      Oturumları Kapat (Kick)
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`${s.shopName} dükkanı ve tüm veritabanı dosyaları kalıcı olarak silinsin mi?\n\nBu işlem geri alınamaz!`)) return;
                        const res = await fetch(`/api/admin/shops/${s.id}`, { method: 'DELETE' });
                        if (!res.ok) { alert('Silinemedi.'); return; }
                        setOpenId(null);
                        load();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs font-black hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      Dükkanı Kalıcı Sil
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dükkan İçi Canlı Röntgen (Live Snapshot) Modalı */}
      {inspectShopId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-5 sm:p-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Başlığı */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-stone-900 dark:text-white">
                    {snapshotData?.shop.shopName || 'Dükkan Canlı Röntgeni'}
                  </h3>
                  {snapshotData?.liveStatus.isWsConnected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      CANLI BAĞLI (WebSocket)
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">
                  Yetkili: {snapshotData?.shop.ownerName} · Tel: {snapshotData?.shop.phone} · Sektör: {snapshotData?.shop.businessField}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectShopId(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {snapshotLoading && (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-500">Dükkanın canlı verileri çekiliyor...</p>
              </div>
            )}

            {snapshotData && !snapshotLoading && (
              <div className="space-y-6 pt-4">
                {/* 1. Finans & Kasa Özeti */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Bugünkü Canlı Ciro ve Kasa Durumu
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Bugünkü Ciro (Gelir)</p>
                      <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                        {fmtCurrency(snapshotData.finance.todayIncomeTotal)}
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-600/70 mt-0.5">
                        {snapshotData.finance.txCount} işlem yapıldı
                      </p>
                    </div>

                    <div className="rounded-2xl p-4 bg-sky-500/10 border border-sky-500/20">
                      <p className="text-[11px] font-bold text-sky-600 dark:text-sky-400">Nakit / Kasa Tahsilat</p>
                      <p className="text-xl sm:text-2xl font-black text-sky-700 dark:text-sky-300 mt-1">
                        {fmtCurrency(snapshotData.finance.cashTotal)}
                      </p>
                      <p className="text-[10px] font-semibold text-sky-600/70 mt-0.5">Kasa Nakdi</p>
                    </div>

                    <div className="rounded-2xl p-4 bg-violet-500/10 border border-violet-500/20">
                      <p className="text-[11px] font-bold text-violet-600 dark:text-violet-400">Kredi Kartı / POS</p>
                      <p className="text-xl sm:text-2xl font-black text-violet-700 dark:text-violet-300 mt-1">
                        {fmtCurrency(snapshotData.finance.cardTotal)}
                      </p>
                      <p className="text-[10px] font-semibold text-violet-600/70 mt-0.5">POS Satışları</p>
                    </div>

                    <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/20">
                      <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Toplam Veresiye Alacağı</p>
                      <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                        {fmtCurrency(snapshotData.customers.totalReceivable)}
                      </p>
                      <p className="text-[10px] font-semibold text-amber-600/70 mt-0.5">
                        {snapshotData.customers.debtCount} borçlu müşteri
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Sektörel Canlı Durum (Masalar & Randevular) */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Masaların Durumu (Kafe / Restoran) */}
                  <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <UtensilsCrossed className="w-4 h-4 text-orange-500" /> Masaların Canlı Durumu
                      </h4>
                      <span className="text-xs font-black text-stone-700 dark:text-stone-300">
                        {snapshotData.tables.occupiedCount} / {snapshotData.tables.total} Dolu
                      </span>
                    </div>

                    {snapshotData.tables.occupiedList.length === 0 ? (
                      <p className="text-xs text-stone-400 py-4 text-center font-semibold">
                        Şu anda açık / sipariş bekleyen masa yok.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {snapshotData.tables.occupiedList.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                          >
                            <div>
                              <p className="font-black text-stone-900 dark:text-white">{t.name}</p>
                              <p className="text-[10px] text-stone-400 font-semibold">{t.orderCount} ürün siparişi</p>
                            </div>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              {fmtCurrency(t.totalAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bugünkü Randevular (Berber / Kuaför) */}
                  <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <CalendarClock className="w-4 h-4 text-sky-500" /> Bugünün Randevuları
                      </h4>
                      <span className="text-xs font-black text-stone-700 dark:text-stone-300">
                        Toplam {snapshotData.appointments.totalToday} Randevu
                      </span>
                    </div>

                    {snapshotData.appointments.list.length === 0 ? (
                      <p className="text-xs text-stone-400 py-4 text-center font-semibold">
                        Bugün için kayıtlı randevu bulunmuyor.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {snapshotData.appointments.list.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                          >
                            <div>
                              <p className="font-black text-stone-900 dark:text-white">
                                {a.time} · {a.customerName}
                              </p>
                              <p className="text-[10px] text-stone-400 font-semibold">{a.serviceName}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                              {a.status === 'completed' ? 'Tamamlandı' : a.status === 'cancelled' ? 'İptal' : 'Bekliyor'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Canlı Bağlantı ve Cihaz Röntgeni */}
                <div className="p-4 rounded-2xl bg-stone-900 text-white">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-amber-400" /> İstemci & Donanım Röntgeni
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">Bağlantı Türü</p>
                      <p className="font-black text-emerald-400 mt-0.5">
                        {snapshotData.liveStatus.isWsConnected ? 'WebSocket Açık (Realtime)' : 'REST HTTP'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">Cihaz Türü</p>
                      <p className="font-bold text-white mt-0.5">
                        {snapshotData.liveStatus.deviceType === 'mobile' ? 'Mobil Telefon' : 'Masaüstü Bilgisayar'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">Tarayıcı & OS</p>
                      <p className="font-mono text-stone-300 truncate mt-0.5" title={snapshotData.liveStatus.browserInfo}>
                        {snapshotData.liveStatus.browserInfo}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">İstemci IP Adresi</p>
                      <p className="font-mono text-amber-300 mt-0.5">{snapshotData.liveStatus.ip}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
