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

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

export const AdminPanel: React.FC = () => {
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

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
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLocaleLowerCase('tr-TR').trim();
    if (!q) return shops;
    return shops.filter(
      (s) =>
        s.shopName.toLocaleLowerCase('tr-TR').includes(q) ||
        s.ownerName.toLocaleLowerCase('tr-TR').includes(q) ||
        s.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')),
    );
  }, [shops, query]);

  const totals = useMemo(
    () => ({
      shops: shops.length,
      customers: shops.reduce((t, s) => t + s.customers, 0),
      transactions: shops.reduce((t, s) => t + s.transactions, 0),
      online: shops.reduce((t, s) => t + s.activeSessions, 0),
    }),
    [shops],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" /> Admin · Kayıtlı Dükkanlar
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold mt-0.5">
            {totals.shops} dükkan · {totals.customers} müşteri · {totals.transactions} işlem · {totals.online} aktif oturum
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-black hover:opacity-90 transition-opacity cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Dükkan, yetkili veya telefon ara..."
          className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 pl-10 pr-10 py-2.5 text-sm font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-lg leading-none cursor-pointer"
            aria-label="Aramayı temizle"
          >
            ×
          </button>
        )}
      </div>

      {loading && <p className="text-sm font-bold text-stone-500">Yükleniyor...</p>}
      {error && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-4 py-3 text-sm font-bold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-8 text-center">
          <Store className="w-8 h-8 mx-auto text-stone-300" />
          <p className="mt-2 text-sm font-black text-stone-700 dark:text-stone-300">
            {query ? 'Aramaya uyan dükkan yok.' : 'Henüz kayıtlı dükkan yok.'}
          </p>
        </div>
      )}

      {filtered.map((s) => {
        const open = openId === s.id;
        return (
          <div key={s.id} className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : s.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
            >
              <span className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center text-base font-black shrink-0">
                {(s.shopName || '?').trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-stone-900 dark:text-white truncate">{s.shopName}</span>
                <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 truncate">
                  {s.ownerName} · {s.phone}
                </span>
              </span>
              {s.activeSessions > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                  <Radio className="w-3 h-3" /> {s.activeSessions} çevrimiçi
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="px-4 pb-4 pt-1 border-t border-stone-100 dark:border-stone-800 space-y-3">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-3">
                  <Stat icon={Phone} label="Telefon" value={<a className="text-amber-700 dark:text-amber-400" href={`tel:${s.phone.replace(/\s+/g, '')}`}>{s.phone}</a>} />
                  <Stat icon={CalendarDays} label="Kayıt" value={fmtDate(s.createdAt)} />
                  <Stat icon={Globe} label="Kayıt IP" value={<span className="font-mono text-xs">{s.createdIp || '—'}</span>} />
                  <Stat icon={LogIn} label="Son giriş" value={fmtDate(s.lastLoginAt)} />
                  <Stat icon={Globe} label="Son giriş IP" value={<span className="font-mono text-xs">{s.lastLoginIp || '—'}</span>} />
                  <Stat icon={LogIn} label="Giriş sayısı" value={s.loginCount} />
                  <Stat icon={Radio} label="Aktif oturum" value={s.activeSessions} />
                  <Stat icon={HardDrive} label="Veri boyutu" value={`${s.dataKB} KB`} />
                  <Stat icon={Users} label="Müşteri" value={s.customers} />
                  <Stat icon={Package} label="Ürün" value={s.products} />
                  <Stat icon={ReceiptText} label="İşlem" value={s.transactions} />
                  <Stat icon={RefreshCw} label="Son güncelleme" value={fmtDate(s.lastUpdated)} />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <Stat icon={Store} label="Sektör" value={s.sector || '—'} />
                  <Stat icon={Store} label="İl / İlçe" value={s.cityDistrict || '—'} />
                  <Stat icon={CalendarClock} label="Randevu" value={s.appointments} />
                  <Stat icon={UtensilsCrossed} label="Masa" value={s.tables} />
                  <Stat icon={Truck} label="Tedarikçi" value={s.suppliers} />
                  <Stat icon={UserPlus} label="Personel" value={s.staffCount} />
                </div>

                {s.staff.length > 0 && (
                  <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 px-3 py-2.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Personel ({s.staff.length})</p>
                    <div className="space-y-1.5">
                      {s.staff.map((p) => (
                        <div key={p.phone} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
                          <span className="font-black text-stone-800 dark:text-stone-100">{p.name}</span>
                          <a className="text-amber-700 dark:text-amber-400" href={`tel:${p.phone.replace(/\s+/g, '')}`}>{p.phone}</a>
                          <span className="text-stone-400">{p.position}</span>
                          <span className="text-stone-400 ml-auto">son: {fmtDate(p.lastLoginAt)} · <span className="font-mono">{p.lastLoginIp || '—'}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[10px] font-mono text-stone-400 break-all">ID: {s.id}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
