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
} from 'lucide-react';
import { AdminPanel } from './AdminPanel';

type Tab = 'shops' | 'events' | 'logs';

interface AuthEvent {
  at: string;
  type: 'register' | 'login_ok' | 'login_fail' | 'locked';
  phone: string;
  ip: string;
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
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

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

export const AdminSite: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'out' | 'in'>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('shops');
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
    setTab('shops');
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center animate-pulse">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-stone-400">Kontrol ediliyor...</p>
      </div>
    );
  }

  if (status === 'out') {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center px-4 font-sans">
        <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-800 p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="mt-4 text-xl font-black">Site Yönetimi</h1>
          <p className="mt-1 text-xs font-semibold text-stone-400">Bu alan sadece site yöneticisine açık. Dükkan girişinden ayrıdır.</p>
          <form onSubmit={login} className="mt-6 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin şifresi"
              autoComplete="current-password"
              className="w-full rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 text-sm font-semibold text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
          <a href="/" className="mt-5 block text-center text-xs font-bold text-stone-500 hover:text-stone-300">
            ← Siteye dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans transition-colors">
      <header className="sticky top-0 z-40 bg-stone-950 text-white border-b border-stone-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black leading-tight">Site Yönetimi</p>
            <p className="text-[11px] font-semibold text-stone-400 leading-tight">Dükkanım Yanımda · admin</p>
          </div>
          <a href="/" className="text-xs font-bold text-stone-400 hover:text-white px-2 py-1">Site</a>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-black hover:bg-white/20 cursor-pointer"
            aria-label="Tema değiştir"
          >
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-black hover:bg-white/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Çıkış
          </button>
        </div>
        <nav className="max-w-5xl mx-auto px-4 pb-3 flex gap-2">
          {(
            [
              { key: 'shops', label: 'Dükkanlar', Icon: Store },
              { key: 'events', label: 'Olaylar', Icon: Activity },
              { key: 'logs', label: 'Loglar', Icon: ScrollText },
            ] as { key: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[]
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                tab === key ? 'bg-amber-500 text-white' : 'bg-white/10 text-stone-300 hover:bg-white/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'shops' && <AdminPanel />}
        {tab === 'events' && <EventsTab />}
        {tab === 'logs' && <LogsTab />}
      </main>
    </div>
  );
};
