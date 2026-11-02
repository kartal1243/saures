import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck,
  LogOut,
  Store,
  Activity,
  ScrollText,
  RefreshCw,
  Lock,
  Sun,
  Moon,
  Search,
  Radio,
  Users,
  ReceiptText,
  Globe,
  UserPlus,
  LogIn,
  LayoutDashboard,
  Home,
  Sparkles,
  Trash2,
  MessageSquare,
  Monitor,
  Smartphone,
  Tablet,
  CalendarClock,
  UtensilsCrossed,
  Clock,
  Wifi,
  WifiOff,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { AdminPanel } from './AdminPanel';

type Tab = 'panel' | 'shops' | 'requests' | 'events' | 'logs';

interface AuthEvent {
  at: string;
  type: 'register' | 'login_ok' | 'login_fail' | 'locked' | 'admin_kick' | 'admin_delete';
  phone: string;
  ip: string;
}

interface LiveVisitor {
  accountId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  ip: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browserInfo: string;
  connectedAt: string;
  connectionType: 'websocket' | 'http_recent';
}

interface LiveActivityItem {
  id: string;
  at: string;
  accountId: string;
  shopName: string;
  type: 'sale' | 'appointment' | 'table' | 'cash' | 'customer' | 'closing' | 'product' | 'repair' | 'system' | 'vip';
  title: string;
  description: string;
  amount?: number;
  device?: string;
  ip?: string;
}

interface FunnelMetrics {
  totalShops: number;
  configuredShops: number;
  firstTransactionShops: number;
  activeLast7DaysShops: number;
  trialVipShops: number;
  paidVipShops: number;
  ustaVipCount: number;
  patronVipCount: number;
  cirakCount: number;
}

interface Overview {
  shops: number;
  online: number;
  wsOnline?: number;
  recentOnline?: number;
  liveVisitors?: LiveVisitor[];
  liveActivities?: LiveActivityItem[];
  customers: number;
  transactions: number;
  funnel?: FunnelMetrics;
  eventsTotal: number;
  eventsToday: number;
  failedToday?: number;
  lockedCount?: number;
  uniqueIps: number;
  week: { day: string; label: string; registers: number; logins: number }[];
  recentRegisters: { shopName: string; ownerName: string; phone: string; createdAt: string; createdIp: string | null }[];
  recentLogins: { shopName: string; phone: string; ip: string; at: string }[];
}

const EVENT_LABEL: Record<AuthEvent['type'], { text: string; cls: string }> = {
  register: { text: 'Kayıt', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  login_ok: { text: 'Giriş', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  login_fail: { text: 'Hatalı giriş', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  locked: { text: 'Kilit', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  admin_kick: { text: 'Oturum kapatma', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  admin_delete: { text: 'Silme', cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtShort(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtTimeOnly(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtCurrency(val?: number): string {
  if (typeof val !== 'number') return '';
  return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

// ---------------- Canlı Gösterge Paneli ----------------

function StatCard({
  icon: Icon,
  value,
  label,
  subtitle,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: React.ReactNode;
  label: string;
  subtitle?: React.ReactNode;
  tint: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 text-center transition-all ${tint}`}>
      <Icon className="w-5 h-5 mx-auto" />
      <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] font-bold opacity-80">{label}</p>
      {subtitle && <p className="mt-0.5 text-[10px] font-semibold opacity-60">{subtitle}</p>}
    </div>
  );
}

function OverviewTab({
  data,
  loading,
  liveActivities,
  onGoShops,
}: {
  data: Overview | null;
  loading: boolean;
  liveActivities: LiveActivityItem[];
  onGoShops: (q: string) => void;
}) {
  if (loading && !data) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-400">Canlı Kokpit Verileri Yükleniyor...</p>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm font-bold text-rose-400 py-12 text-center">Özet alınamadı. Lütfen yenileyin.</p>;
  }

  const maxBar = Math.max(1, ...data.week.map((w) => Math.max(w.registers, w.logins)));
  const alert = (data.failedToday || 0) >= 10 || (data.lockedCount || 0) > 0;
  const visitors = data.liveVisitors || [];
  const activities = liveActivities.length > 0 ? liveActivities : (data.liveActivities || []);

  return (
    <div className="space-y-5">
      {alert && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            Güvenlik Uyarısı: Bugün <strong>{data.failedToday || 0}</strong> başarısız giriş denemesi yapıldı.
            {(data.lockedCount || 0) > 0 ? ` (${data.lockedCount} hesap kilitlendi)` : ''}.
          </span>
        </div>
      )}

      {/* 1. Üst Metrik Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          icon={Radio}
          value={data.online}
          label="Gerçek Çevrimiçi"
          subtitle={`${data.wsOnline ?? 0} WS · ${data.recentOnline ?? 0} Son 5 dk`}
          tint="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-sm"
        />
        <StatCard
          icon={Store}
          value={data.shops}
          label="Toplam Dükkan"
          subtitle="Kayıtlı Esnaf"
          tint="bg-blue-500/10 border-blue-500/20 text-blue-400"
        />
        <StatCard
          icon={Users}
          value={data.customers}
          label="Toplam Müşteri"
          subtitle="Veritabanı"
          tint="bg-violet-500/10 border-violet-500/20 text-violet-400"
        />
        <StatCard
          icon={ReceiptText}
          value={data.transactions}
          label="Toplam İşlem"
          subtitle="Satış / Tahsilat"
          tint="bg-amber-500/10 border-amber-500/20 text-amber-400"
        />
        <StatCard
          icon={Activity}
          value={data.eventsToday}
          label="Bugünkü Olay"
          subtitle="Giriş & İşlem"
          tint="bg-rose-500/10 border-rose-500/20 text-rose-400"
        />
        <StatCard
          icon={Globe}
          value={data.uniqueIps}
          label="Benzersiz IP"
          subtitle="Trafik Kaynağı"
          tint="bg-orange-500/10 border-orange-500/20 text-orange-400"
        />
      </div>

      {/* BÜYÜME & DÖNÜŞÜM HUNİSİ (PRODUCT & GROWTH FUNNEL) */}
      {data.funnel && (
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" /> Büyüme & Dönüşüm Hunisi
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Kayıttan North Star aktif esnafa ve ücretli VIP aboneye kadar dönüşüm basamakları
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-black">
                North Star: {data.funnel.activeLast7DaysShops} Aktif Esnaf
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Toplam Kayıtlı Dükkan */}
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3.5 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Toplam Kayıt</p>
              <p className="text-2xl font-black text-white mt-1.5">{data.funnel.totalShops}</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Dükkan Girişi (%100)</p>
            </div>

            {/* 2. Kurulumu Tamamlayan Dükkan */}
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3.5 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-400">2. Kurulum Tamam</p>
              <p className="text-2xl font-black text-blue-300 mt-1.5">{data.funnel.configuredShops}</p>
              <p className="text-[10px] font-bold text-blue-400/80 mt-1">
                %{Math.round((data.funnel.configuredShops / Math.max(1, data.funnel.totalShops)) * 100)} Kurulum Oranı
              </p>
            </div>

            {/* 3. İlk İşlemini Giren Dükkan */}
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3.5 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-violet-400">3. İlk İşlem</p>
              <p className="text-2xl font-black text-violet-300 mt-1.5">{data.funnel.firstTransactionShops}</p>
              <p className="text-[10px] font-bold text-violet-400/80 mt-1">
                %{Math.round((data.funnel.firstTransactionShops / Math.max(1, data.funnel.totalShops)) * 100)} İlk Satış/İşlem
              </p>
            </div>

            {/* 4. Son 7 Günde 3+ İşlem (North Star) */}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-center shadow-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">4. North Star (7G 3+ İşlem)</p>
              <p className="text-2xl font-black text-emerald-300 mt-1.5">{data.funnel.activeLast7DaysShops}</p>
              <p className="text-[10px] font-bold text-emerald-400 mt-1">
                %{Math.round((data.funnel.activeLast7DaysShops / Math.max(1, data.funnel.totalShops)) * 100)} Aktif Esnaf
              </p>
            </div>

            {/* 5. 14 Gün Deneme Süresinde Olanlar */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">5. 14G Denemede</p>
              <p className="text-2xl font-black text-amber-300 mt-1.5">{data.funnel.trialVipShops}</p>
              <p className="text-[10px] font-bold text-amber-400/80 mt-1">Test Eden Dükkan</p>
            </div>

            {/* 6. Ücretli Usta / Patron VIP Aboneler */}
            <div className="rounded-xl bg-linear-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 p-3.5 text-center shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">6. Ücretli VIP</p>
              <p className="text-2xl font-black text-amber-200 mt-1.5">{data.funnel.paidVipShops}</p>
              <p className="text-[10px] font-bold text-amber-300/80 mt-1">
                {data.funnel.patronVipCount} Patron · {data.funnel.ustaVipCount} Usta
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. ANA CANLI TAKİP BÖLÜMÜ: CANLI ZİYARETÇİLER & CANLI HAREKET AKIŞI */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Sol Kolon (7 Birim): Kim, Nereden, Hangi Cihazla, Hangi IP'den Girdi? */}
        <div className="lg:col-span-7 rounded-2xl bg-[#12172b] border border-white/5 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-400" /> Canlı Ziyaretçiler & Cihaz Radarı
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  Kim, nereden, hangi cihazla (Masaüstü/Mobil), hangi IP'den ve ne zaman girdi?
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {visitors.length} Aktif Giriş
              </span>
            </div>

            {visitors.length === 0 ? (
              <div className="py-12 text-center">
                <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p className="text-xs font-semibold text-slate-400">Şu anda aktif veya bağlı bir kullanıcı bulunmuyor.</p>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-white/5 max-h-[380px] overflow-y-auto pr-1">
                {visitors.map((v, i) => (
                  <div key={`${v.accountId}-${i}`} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          v.deviceType === 'mobile'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {v.deviceType === 'mobile' ? (
                          <Smartphone className="w-4 h-4" />
                        ) : v.deviceType === 'tablet' ? (
                          <Tablet className="w-4 h-4" />
                        ) : (
                          <Monitor className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            onClick={() => onGoShops(v.shopName)}
                            className="text-xs font-black text-white hover:text-amber-400 cursor-pointer truncate"
                          >
                            {v.shopName}
                          </p>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              v.connectionType === 'websocket'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-sky-500/20 text-sky-300'
                            }`}
                          >
                            {v.connectionType === 'websocket' ? 'WS CANLI' : 'HTTP AKTİF'}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400">
                          {v.ownerName} · <span className="text-slate-300">{v.browserInfo}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-[10px] font-mono text-amber-400">{v.ip}</p>
                      <p className="text-[9px] font-semibold text-slate-500 flex items-center sm:justify-end gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {fmtShort(v.connectedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-white/5 text-[10px] font-semibold text-slate-500 flex items-center justify-between">
            <span>WebSocket bağlantıları anlık güncellenir</span>
            <button
              type="button"
              onClick={() => onGoShops('')}
              className="text-amber-400 font-bold hover:underline cursor-pointer"
            >
              Tüm Dükkanları İncele →
            </button>
          </div>
        </div>

        {/* Sağ Kolon (5 Birim): Canlı Hareket Akışı (Live Activity Stream) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#12172b] border border-white/5 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" /> Canlı Hareket Akışı
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  Randevu, masa, satış, tahsilat ve fişler
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                STREAM
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">Canlı hareket akışında henüz yeni bir işlem yok.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {activities.map((act) => {
                  let badgeCls = 'bg-slate-800 text-slate-300';
                  let icon = <Activity className="w-3.5 h-3.5" />;

                  if (act.type === 'sale') {
                    badgeCls = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                    icon = <ReceiptText className="w-3.5 h-3.5 text-emerald-400" />;
                  } else if (act.type === 'appointment') {
                    badgeCls = 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
                    icon = <CalendarClock className="w-3.5 h-3.5 text-sky-400" />;
                  } else if (act.type === 'table') {
                    badgeCls = 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
                    icon = <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" />;
                  } else if (act.type === 'customer') {
                    badgeCls = 'bg-pink-500/20 text-pink-400 border border-pink-500/30';
                    icon = <UserPlus className="w-3.5 h-3.5 text-pink-400" />;
                  } else if (act.type === 'closing') {
                    badgeCls = 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
                    icon = <TrendingUp className="w-3.5 h-3.5 text-purple-400" />;
                  }

                  return (
                    <div
                      key={act.id}
                      className="rounded-xl bg-white/[0.03] border border-white/5 p-2.5 text-xs transition-all hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {icon}
                          <span className="font-black text-white truncate">{act.shopName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {fmtTimeOnly(act.at)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between gap-2">
                        <p className="text-[11px] font-semibold text-slate-300 truncate">
                          {act.title} · <span className="text-slate-400">{act.description}</span>
                        </p>
                        {typeof act.amount === 'number' && act.amount > 0 && (
                          <span className="font-black text-emerald-400 text-xs shrink-0">
                            {fmtCurrency(act.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-white/5 text-[10px] font-semibold text-slate-500">
            Dükkanlardaki randevu, masa açılışı ve satışlar anlık olarak bu akışa düşer.
          </div>
        </div>
      </div>

      {/* 3. Haftalık Aktivite Grafiği & Son Girişler */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-2xl bg-[#12172b] border border-white/5 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">Haftalık Kayıt ve Giriş Trendi</h3>
            <span className="text-[10px] font-black text-slate-400">Son 7 Gün</span>
          </div>
          <div className="mt-4 flex items-end gap-2 sm:gap-3 h-32">
            {data.week.map((w) => (
              <div key={w.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-24">
                  <div
                    className="w-2.5 sm:w-3.5 rounded-t bg-amber-500/80"
                    style={{ height: `${Math.max(4, (w.registers / maxBar) * 100)}%` }}
                    title={`${w.label}: ${w.registers} yeni kayıt`}
                  />
                  <div
                    className="w-2.5 sm:w-3.5 rounded-t bg-violet-500/80"
                    style={{ height: `${Math.max(4, (w.logins / maxBar) * 100)}%` }}
                    title={`${w.label}: ${w.logins} giriş`}
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-500">{w.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] font-bold text-slate-400">
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500/80" /> Kayıt</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-violet-500/80" /> Giriş</span>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-[#12172b] border border-white/5 p-4 sm:p-5">
          <h3 className="text-sm font-black text-white mb-3">Son Kayıt Olan Dükkanlar</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.recentRegisters.length === 0 && (
              <p className="text-xs font-semibold text-slate-500 py-6 text-center">Kayıt yok.</p>
            )}
            {data.recentRegisters.map((r) => (
              <div key={r.phone} className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-black text-white">{r.shopName}</p>
                  <span className="text-[10px] font-mono text-slate-500">{fmtShort(r.createdAt)}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{r.ownerName} · {r.phone}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Olaylar sekmesi ----------------

function EventsTab() {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/events?limit=150');
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data.events) ? data.events : []);
      }
    } catch {
      /* sessiz */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-400">Son {events.length} kimlik ve oturum olayı (kayıt · giriş · hatalı deneme · kilit)</p>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-black cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </div>

      <div className="rounded-2xl bg-[#12172b] border border-white/5 overflow-hidden divide-y divide-white/5">
        {events.length === 0 && !loading && (
          <p className="text-xs text-slate-500 p-6 text-center font-semibold">Henüz olay kaydı bulunmuyor.</p>
        )}
        {events.map((e, i) => {
          const meta = EVENT_LABEL[e.type] || EVENT_LABEL.login_fail;
          return (
            <div key={`${e.at}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-black ${meta.cls}`}>{meta.text}</span>
              <span className="font-black text-white">{e.phone}</span>
              <span className="font-mono text-amber-400">{e.ip}</span>
              <span className="text-slate-500 ml-auto font-semibold">{fmtDate(e.at)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Özel Panel Talepleri sekmesi ----------------

interface CustomPanelLead {
  id: string;
  storeName: string;
  ownerName: string;
  phone: string;
  sector: string;
  requestedFeatures: string;
  notes: string;
  createdAt: string;
  status: 'beklemede' | 'arandi' | 'tamamlandi' | 'red';
}

function CustomPanelRequestsTab() {
  const [leads, setLeads] = useState<CustomPanelLead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/panel-requests');
      if (res.ok) {
        const data = await res.json();
        setLeads(Array.isArray(data.requests) ? data.requests : []);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/panel-requests/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: status as any } : l)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/panel-requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Esnaftan Gelen Özel Panel ve Yazılım Talepleri
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Sektörel özel panel talebinde bulunan dükkan sahiplerinin iletişim ve istek formu.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-black cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </div>

      <div className="space-y-3">
        {leads.length === 0 && !loading && (
          <div className="py-12 text-center rounded-2xl bg-[#12172b] border border-white/5 text-slate-400 text-xs font-semibold">
            Henüz özel panel talebi bulunmuyor.
          </div>
        )}
        {leads.map((lead) => (
          <div key={lead.id} className="rounded-2xl bg-[#12172b] border border-white/5 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <h4 className="text-sm font-black text-white">{lead.storeName}</h4>
                <p className="text-xs text-slate-400 font-semibold">
                  {lead.ownerName} · <a href={`tel:${lead.phone}`} className="text-amber-400 font-bold hover:underline">{lead.phone}</a>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-slate-300">
                  {lead.sector || 'Genel'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{fmtDate(lead.createdAt)}</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <p className="text-slate-400 font-semibold">
                <strong className="text-white">İstenen Özellikler:</strong> {lead.requestedFeatures || '—'}
              </p>
              {lead.notes && (
                <p className="text-slate-400 font-semibold">
                  <strong className="text-white">Esnaf Notu:</strong> {lead.notes}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-bold">Durum:</span>
                {(['beklemede', 'arandi', 'tamamlandi', 'red'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateStatus(lead.id, st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      lead.status === st
                        ? st === 'tamamlandi'
                          ? 'bg-emerald-500 text-white'
                          : st === 'arandi'
                          ? 'bg-sky-500 text-white'
                          : st === 'red'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-white'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => deleteLead(lead.id)}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Loglar sekmesi ----------------

function LogsTab() {
  const [logName, setLogName] = useState<'nginx' | 'app' | 'app-error'>('app');
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs/${logName}?lines=150`);
      if (res.ok) {
        const data = await res.json();
        setLines(Array.isArray(data.lines) ? data.lines : []);
      } else {
        setLines(['Log okunamadı veya sunucuda bu dosya bulunamadı.']);
      }
    } catch {
      setLines(['Bağlantı hatası.']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [logName]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
          {(['app', 'app-error', 'nginx'] as const).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setLogName(name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                logName === name ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {name === 'app' ? 'Node.js Log' : name === 'app-error' ? 'Hata Logları' : 'Nginx Erişim'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-black cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </div>

      <div className="rounded-2xl bg-black border border-white/10 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[600px] overflow-y-auto leading-relaxed">
        {lines.length === 0 && <p className="text-slate-500">Log içeriği boş.</p>}
        {lines.map((l, i) => (
          <div key={i} className="hover:bg-white/5 py-0.5 px-1 rounded whitespace-pre-wrap break-all">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- AdminSite Ana Bileşen ----------------

export const AdminSite: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'in' | 'out'>('checking');
  const [tab, setTab] = useState<Tab>('panel');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shopQuery, setShopQuery] = useState('');
  const [headerQuery, setHeaderQuery] = useState('');
  const [dark, setDark] = useState<boolean>(true);
  const [refreshToken, setRefreshToken] = useState(0);

  const [ov, setOv] = useState<Overview | null>(null);
  const [ovLoading, setOvLoading] = useState(false);
  const [liveActivities, setLiveActivities] = useState<LiveActivityItem[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => setStatus(r.ok ? 'in' : 'out'))
      .catch(() => setStatus('out'));
  }, []);

  // Canlı Veri Polling & Overview
  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setOv(data);
        if (data.liveActivities && data.liveActivities.length > 0) {
          setLiveActivities((prev) => {
            const map = new Map<string, LiveActivityItem>();
            for (const item of prev) map.set(item.id, item);
            for (const item of data.liveActivities) map.set(item.id, item);
            return Array.from(map.values()).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
          });
        }
      }
    } catch {
      // sessiz
    }
  };

  useEffect(() => {
    if (status !== 'in') return;
    setOvLoading(true);
    fetchOverview().finally(() => setOvLoading(false));

    // Her 15 saniyede bir otomatik senkronizasyon
    const timer = setInterval(fetchOverview, 15000);
    return () => clearInterval(timer);
  }, [status, refreshToken]);

  // Admin Paneli İçin Gerçek Zamanlı Canlı WebSocket Dinleyicisi
  useEffect(() => {
    if (status !== 'in') return;

    let isUnmounted = false;
    let ws: WebSocket | null = null;

    const connectWs = () => {
      try {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${proto}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Bağlandı
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'ADMIN_LIVE_ACTIVITY') {
              const act: LiveActivityItem = msg.payload;
              setLiveActivities((prev) => [act, ...prev.filter((x) => x.id !== act.id)].slice(0, 50));
            } else if (msg.type === 'ADMIN_STATS_UPDATE') {
              const stats = msg.payload;
              setOv((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  online: stats.wsUniqueShopsCount,
                  wsOnline: stats.wsUniqueShopsCount,
                };
              });
            } else if (msg.type === 'ADMIN_INIT') {
              if (msg.payload.activities) {
                setLiveActivities(msg.payload.activities);
              }
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            setTimeout(connectWs, 5000);
          }
        };
      } catch {
        // ignore
      }
    };

    connectWs();

    return () => {
      isUnmounted = true;
      if (ws) {
        ws.close();
      }
    };
  }, [status]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword('');
        setStatus('in');
      } else if (res.status === 503) {
        setError('Admin girişi henüz tanımlanmamış. Sunucuda ADMIN_PASSWORD ayarlanmalı.');
      } else {
        setError('Şifre hatalı.');
      }
    } catch {
      setError('Bağlanılamadı. Tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      /* sessiz */
    }
    setStatus('out');
    setTab('panel');
    setOv(null);
  };

  const goShops = (q: string) => {
    setShopQuery(q);
    setTab('shops');
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center animate-pulse">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-400">Admin Yetkisi Kontrol Ediliyor...</p>
      </div>
    );
  }

  if (status === 'out') {
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center px-4 font-sans">
        <div className="w-full max-w-sm rounded-3xl bg-[#12172b] border border-white/10 p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="mt-4 text-xl font-black">Admin Giriş Kokpiti</h1>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Dükkânım Yanımda · Ana Sistem Yönetim Portalı.
          </p>
          <form onSubmit={login} className="mt-6 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin şifresi"
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {error && <p className="text-xs font-bold text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={busy || !password}
              className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
            >
              {busy ? 'Doğrulanıyor...' : 'Panele Giriş Yap'}
            </button>
          </form>
          <a href="/" className="mt-5 block text-center text-xs font-bold text-slate-500 hover:text-slate-300">
            ← Platforma dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 font-sans">
      <header className="sticky top-0 z-40 bg-[#0a0f1e]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 sm:gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" />
          </span>
          <div className="min-w-0 hidden xs:block sm:block">
            <p className="text-sm font-black leading-tight text-white">Yönetici Kokpiti</p>
            <p className="text-[11px] font-semibold text-slate-500 leading-tight">Dükkânım Yanımda</p>
          </div>

          <div className="hidden md:flex flex-1 max-w-xs relative ml-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={headerQuery}
              onChange={(e) => setHeaderQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') goShops(headerQuery); }}
              placeholder="Dükkan, telefon ara..."
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex-1 md:hidden" />

          {/* Gerçek Çevrimiçi Rozeti */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {ov?.online ?? 0} Canlı
          </span>

          {/* Veritabanı Yedek İndir Butonu */}
          <a
            href="/api/admin/backup/export"
            download
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-black text-slate-200 hover:bg-white/10"
            title="Tüm veritabanı yedeğini tek tıkla indir"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Yedek Al</span>
          </a>

          <button
            type="button"
            onClick={() => setRefreshToken((t) => t + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-black text-slate-200 hover:bg-white/10 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Yenile</span>
          </button>

          <a href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-black text-slate-200 hover:bg-white/10">
            <Home className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Site</span>
          </a>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-black text-slate-200 hover:bg-rose-500/20 hover:text-rose-300 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>

        <nav className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {(
            [
              { key: 'panel', label: 'Canlı Takip Kokpiti', Icon: LayoutDashboard },
              { key: 'shops', label: `Dükkanlar${ov ? ` (${ov.shops})` : ''}`, Icon: Store },
              { key: 'requests', label: 'Özel Panel Talepleri', Icon: Sparkles },
              { key: 'events', label: 'Olaylar & Girişler', Icon: Activity },
              { key: 'logs', label: 'Sunucu Logları', Icon: ScrollText },
            ] as { key: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[]
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
                tab === key ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5">
        {tab === 'panel' && (
          <OverviewTab
            data={ov}
            loading={ovLoading}
            liveActivities={liveActivities}
            onGoShops={goShops}
          />
        )}
        {tab === 'shops' && <AdminPanel initialQuery={shopQuery} />}
        {tab === 'requests' && <CustomPanelRequestsTab />}
        {tab === 'events' && <EventsTab />}
        {tab === 'logs' && <LogsTab />}
      </main>
    </div>
  );
};
