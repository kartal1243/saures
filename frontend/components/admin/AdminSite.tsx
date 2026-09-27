import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { AdminPanel } from './AdminPanel';

type Tab = 'panel' | 'shops' | 'events' | 'logs';

interface AuthEvent {
  at: string;
  type: 'register' | 'login_ok' | 'login_fail' | 'locked';
  phone: string;
  ip: string;
}

interface Overview {
  shops: number;
  online: number;
  customers: number;
  transactions: number;
  eventsTotal: number;
  eventsToday: number;
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

// ---------------- Gösterge paneli (koyu dashboard) ----------------

function StatCard({ icon: Icon, value, label, tint }: {
  icon: React.ComponentType<{ className?: string }>;
  value: React.ReactNode;
  label: string;
  tint: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 text-center ${tint}`}>
      <Icon className="w-5 h-5 mx-auto" />
      <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] font-bold opacity-70">{label}</p>
    </div>
  );
}

function OverviewTab({ data, loading }: { data: Overview | null; loading: boolean }) {
  if (loading && !data) {
    return <p className="text-sm font-bold text-slate-400">Yükleniyor...</p>;
  }
  if (!data) {
    return <p className="text-sm font-bold text-rose-400">Özet alınamadı. Yenile'ye bas.</p>;
  }
  const maxBar = Math.max(1, ...data.week.map((w) => Math.max(w.registers, w.logins)));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={Radio} value={data.online} label="Çevrimiçi" tint="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" />
        <StatCard icon={Store} value={data.shops} label="Toplam Dükkan" tint="bg-blue-500/10 border-blue-500/20 text-blue-400" />
        <StatCard icon={Users} value={data.customers} label="Toplam Müşteri" tint="bg-violet-500/10 border-violet-500/20 text-violet-400" />
        <StatCard icon={ReceiptText} value={data.transactions} label="Toplam İşlem" tint="bg-amber-500/10 border-amber-500/20 text-amber-400" />
        <StatCard icon={Activity} value={data.eventsToday} label="Bugünkü Olay" tint="bg-rose-500/10 border-rose-500/20 text-rose-400" />
        <StatCard icon={Globe} value={data.uniqueIps} label="Benzersiz IP" tint="bg-orange-500/10 border-orange-500/20 text-orange-400" />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-2xl bg-[#12172b] border border-white/5 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">Haftalık Aktivite</h3>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> CANLI
            </span>
          </div>
          <div className="mt-4 flex items-end gap-2 sm:gap-3 h-32">
            {data.week.map((w) => (
              <div key={w.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-24">
                  <div
                    className="w-2.5 sm:w-3.5 rounded-t bg-amber-500/80"
                    style={{ height: `${Math.max(4, (w.registers / maxBar) * 100)}%` }}
                    title={`${w.label}: ${w.registers} kayıt`}
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
            <span className="ml-auto">Son 7 gün</span>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-[#12172b] border border-white/5 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">Canlı Akış</h3>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> FEED
            </span>
          </div>
          <div className="mt-3 space-y-2 max-h-56 overflow-auto">
            {data.recentLogins.length === 0 && (
              <p className="text-xs font-semibold text-slate-500 text-center py-6">Henüz giriş yok.</p>
            )}
            {data.recentLogins.map((l, i) => (
              <div key={`${l.at}-${i}`} className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5 text-center">
                <p className="text-xs font-black text-white truncate">{l.shopName}</p>
                <p className="text-[10px] font-mono text-slate-400 truncate">{l.ip}</p>
                <p className="text-[10px] font-semibold text-slate-500">{fmtShort(l.at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4 text-center">
          <p className="text-xl font-black text-pink-400">{data.eventsTotal}</p>
          <p className="text-[11px] font-bold text-slate-400">Toplam Olay</p>
        </div>
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4 text-center">
          <p className="text-xl font-black text-sky-400">{data.eventsToday}</p>
          <p className="text-[11px] font-bold text-slate-400">Bugünkü Olay</p>
        </div>
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4 text-center">
          <p className="text-xl font-black text-amber-400">{data.uniqueIps}</p>
          <p className="text-[11px] font-bold text-slate-400">Benzersiz IP</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4 sm:p-5">
          <h3 className="text-sm font-black text-white text-center">Son Kayıtlar</h3>
          <div className="mt-3 divide-y divide-white/5">
            {data.recentRegisters.length === 0 && (
              <p className="text-xs font-semibold text-slate-500 text-center py-6">Kayıt yok.</p>
            )}
            {data.recentRegisters.map((r) => (
              <div key={r.phone} className="py-2.5 text-center">
                <p className="text-xs font-black text-white">{r.shopName}</p>
                <p className="text-[11px] font-semibold text-slate-400">{r.ownerName} · {r.phone}</p>
                <p className="text-[10px] font-mono text-slate-500">{fmtShort(r.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-[#12172b] border border-white/5 p-4 sm:p-5">
          <h3 className="text-sm font-black text-white text-center">Son Girişler</h3>
          <div className="mt-3 divide-y divide-white/5">
            {data.recentLogins.length === 0 && (
              <p className="text-xs font-semibold text-slate-500 text-center py-6">Giriş yok.</p>
            )}
            {data.recentLogins.map((l, i) => (
              <div key={`${l.at}-${i}`} className="py-2.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0 text-center">
                  <p className="text-xs font-black text-white truncate">{l.shopName}</p>
                  <p className="text-[10px] font-mono text-slate-400">{l.ip}</p>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 shrink-0">{fmtShort(l.at)}</span>
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
        <p className="text-xs font-bold text-stone-500 dark:text-stone-400">Son {events.length} kimlik olayı (kayıt · giriş · hatalı deneme · kilit)</p>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-black hover:opacity-90 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </div>
      {loading && <p className="text-sm font-bold text-stone-500 dark:text-stone-400">Yükleniyor...</p>}
      {!loading && events.length === 0 && (
        <p className="text-sm font-bold text-stone-500 dark:text-stone-400 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-6 text-center">
          Henüz olay yok. Yeni kayıt ve girişler buraya düşer.
        </p>
      )}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
        {events.map((e, i) => {
          const meta = EVENT_LABEL[e.type] || EVENT_LABEL.login_fail;
          return (
            <div key={`${e.at}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-black ${meta.cls}`}>{meta.text}</span>
              <span className="font-black text-stone-800 dark:text-stone-100">{e.phone}</span>
              <span className="font-mono text-stone-500 dark:text-stone-400">{e.ip}</span>
              <span className="text-stone-400 dark:text-stone-500 ml-auto font-semibold">{fmtDate(e.at)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Loglar sekmesi ----------------

const LOG_TABS = [
  { key: 'nginx', label: 'Site trafiği (nginx)' },
  { key: 'app', label: 'Uygulama (app)' },
  { key: 'app-error', label: 'Uygulama hataları' },
];

function LogsTab() {
  const [name, setName] = useState('nginx');
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (n: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/logs/${n}?lines=200`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLines(Array.isArray(data.lines) ? data.lines : []);
    } catch {
      setError('Log okunamadı.');
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(name);
  }, [name]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {LOG_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setName(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
              name === t.key ? 'bg-stone-900 text-white dark:bg-amber-500' : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-400'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => load(name)}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </div>
      {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
      <pre className="rounded-2xl bg-stone-950 text-stone-200 text-[11px] leading-relaxed p-4 overflow-auto max-h-[60vh] whitespace-pre-wrap break-all font-mono">
        {loading ? 'Yükleniyor...' : lines.length > 0 ? lines.join('\n') : 'Kayıt yok.'}
      </pre>
    </div>
  );
}

// ---------------- Ana sayfa ----------------

export const AdminSite: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'out' | 'in'>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('panel');
  const [ov, setOv] = useState<Overview | null>(null);
  const [ovLoading, setOvLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [shopQuery, setShopQuery] = useState('');
  const [headerQuery, setHeaderQuery] = useState('');
  // Admin temasi varsayilan koyu; secim tarayicida saklanir (ana uygulamadan bagimsiz)
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('admin-theme');
      if (saved) return saved === 'dark';
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      if (dark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('admin-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('admin-theme', 'light');
      }
    } catch {
      /* sessiz */
    }
  }, [dark]);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => setStatus(r.ok ? 'in' : 'out'))
      .catch(() => setStatus('out'));
  }, []);

  useEffect(() => {
    if (status !== 'in') return;
    setOvLoading(true);
    fetch('/api/admin/overview')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOv(d))
      .catch(() => setOv(null))
      .finally(() => setOvLoading(false));
  }, [status, refreshToken]);

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
      setError('Bağlanılamadı. Tekrar dene.');
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
        <p className="text-sm font-bold text-slate-400">Kontrol ediliyor...</p>
      </div>
    );
  }

  if (status === 'out') {
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center px-4 font-sans">
        <div className="w-full max-w-sm rounded-3xl bg-[#12172b] border border-white/10 p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="mt-4 text-xl font-black">Admin Panel</h1>
          <p className="mt-1 text-xs font-semibold text-slate-400">Dükkanım Yanımda · sadece site yöneticisi. Dükkan girişinden ayrıdır.</p>
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
              className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Giriliyor...' : 'Giriş Yap'}
            </button>
          </form>
          <a href="/" className="mt-5 block text-center text-xs font-bold text-slate-500 hover:text-slate-300">
            ← Siteye dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 font-sans">
      <header className="sticky top-0 z-40 bg-[#0a0f1e]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 sm:gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </span>
          <div className="min-w-0 hidden xs:block sm:block">
            <p className="text-sm font-black leading-tight text-white">Admin Panel</p>
            <p className="text-[11px] font-semibold text-slate-500 leading-tight">Dükkanım Yanımda</p>
          </div>
          <div className="hidden md:flex flex-1 max-w-xs relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={headerQuery}
              onChange={(e) => setHeaderQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') goShops(headerQuery); }}
              placeholder="Dükkan adı, telefon..."
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex-1 md:hidden" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black">
            <Radio className="w-3 h-3 text-emerald-400" /> {ov?.online ?? 0} çevrimiçi
          </span>
          <button
            type="button"
            onClick={() => setRefreshToken((t) => t + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-black text-slate-200 hover:bg-white/10 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Yenile</span>
          </button>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 cursor-pointer"
            aria-label="Tema değiştir"
          >
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <a href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-black text-slate-200 hover:bg-white/10">
            <Home className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Site</span>
          </a>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-black text-slate-200 hover:bg-white/10 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
        <nav className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {(
            [
              { key: 'panel', label: 'Gösterge Paneli', Icon: LayoutDashboard },
              { key: 'shops', label: `Dükkanlar${ov ? ` (${ov.shops})` : ''}`, Icon: Store },
              { key: 'events', label: 'Olaylar', Icon: Activity },
              { key: 'logs', label: 'Loglar', Icon: ScrollText },
            ] as { key: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[]
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
                tab === key ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-5">
        {tab === 'panel' && <OverviewTab data={ov} loading={ovLoading} />}
        {tab === 'shops' && <AdminPanel initialQuery={shopQuery} />}
        {tab === 'events' && <EventsTab />}
        {tab === 'logs' && <LogsTab />}
      </main>
    </div>
  );
};
