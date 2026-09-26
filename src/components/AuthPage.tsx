import React, { useState } from 'react';
import { Phone, Lock, Store, User, ArrowRight, LogIn, UserPlus, Loader2, ShieldCheck, Wallet, Smartphone, BellRing } from 'lucide-react';
import logoRaw from '../../public/brand/logo-dukkanim.svg?raw';
import { useForceLightTheme } from '../hooks/useForceLightTheme';

interface AuthPageProps {
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
  onBack?: () => void;
}

const LEFT_FEATURES = [
  { icon: Wallet, title: 'Kasa Takibi', text: 'Anlık bakiye' },
  { icon: Smartphone, title: 'Her Cihazda', text: 'Bulut yedek' },
  { icon: BellRing, title: 'WhatsApp', text: 'Hatırlatma mesajı' },
  { icon: ShieldCheck, title: 'Güvenli', text: 'Şifreli saklama' },
];

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, initialMode, onBack }) => {
  useForceLightTheme();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode ?? 'login');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { phone, password }
          : { shopName, ownerName, phone, password };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız oldu.');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-100 font-sans lg:grid lg:grid-cols-[1fr_460px]">
      {/* Sol tanıtım paneli (desktop) */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-linear-to-br from-amber-500 via-orange-500 to-orange-600 text-white p-10 xl:p-14">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(600px 320px at 20% 0%, rgba(255,255,255,0.22), transparent 60%), radial-gradient(500px 400px at 100% 100%, rgba(124,45,18,0.35), transparent 60%)' }}
        />
        <div className="relative">
          <span className="inline-block bg-white rounded-2xl px-5 py-3 shadow-lg">
            <span
              className="block w-[190px] select-none [&>svg]:w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: logoRaw }}
            />
          </span>
        </div>

        <div className="relative max-w-lg">
          <div className="rounded-3xl bg-white/15 border border-white/25 backdrop-blur-sm p-5 mb-8">
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-100">Bugünün Kasası</p>
            <p className="text-4xl font-black tracking-tight mt-1">₺12.450</p>
            <div className="mt-3 space-y-1.5 text-xs font-bold">
              <div className="flex justify-between bg-white/10 rounded-lg px-3 py-1.5">
                <span className="text-amber-50">Nakit giriş</span><span>+₺6.300</span>
              </div>
              <div className="flex justify-between bg-white/10 rounded-lg px-3 py-1.5">
                <span className="text-amber-50">Kart giriş</span><span>+₺4.150</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl xl:text-5xl font-black leading-[1.08] tracking-tight">
            Dükkanını<br />Cebinden Yönet
          </h1>
          <p className="mt-4 text-amber-50 font-medium max-w-md">
            Kasa, veresiye ve gün sonu tek panelde. Kağıt defteri kapat,
            dükkanını 2 dakikada dijitale taşı.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-3 max-w-lg">
          {LEFT_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
                <p className="text-sm font-black flex items-center gap-2">
                  <Icon className="w-4 h-4" /> {f.title}
                </p>
                <p className="text-xs text-amber-100 mt-0.5 font-semibold">{f.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sağ giriş kartı */}
      <div className="flex flex-col items-center justify-center px-4 py-8 sm:px-8 bg-stone-100">
        {/* Mobil mini vitrin */}
        <div className="lg:hidden w-full max-w-md mb-5 rounded-3xl bg-linear-to-br from-amber-500 to-orange-600 text-white p-6 text-center">
          <span className="inline-block bg-white rounded-2xl px-4 py-2.5 shadow">
            <span
              className="block w-[150px] select-none [&>svg]:w-full [&>svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: logoRaw }}
            />
          </span>
          <p className="mt-3 text-xl font-black">Dükkanını Cebinden Yönet</p>
          <p className="text-xs text-amber-100 font-semibold mt-1">Kasa, veresiye ve gün sonu tek panelde</p>
        </div>

        <div className="w-full max-w-md animate-fade-up">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-orange-600 transition-colors cursor-pointer"
            >
              ← Tanıtıma dön
            </button>
          )}

          <div className="bg-white rounded-3xl border border-stone-200 shadow-[0_24px_60px_-18px_rgba(28,25,23,0.25)] overflow-hidden">
            {/* Kart başlık bandı */}
            <div className="bg-linear-to-r from-amber-500 to-orange-600 px-6 py-5 text-white relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-white/15 pointer-events-none"
              />
              <h2 className="text-lg font-black">
                {mode === 'login' ? 'Hesabınıza Giriş Yapın' : 'Dükkanınızı Açın'}
              </h2>
              <p className="text-xs text-amber-100 font-semibold mt-0.5">
                {mode === 'login' ? 'Dükkanınızı her yerden yönetin' : '2 dakikada kurulum, kredi kartı gerekmez'}
              </p>
            </div>

            <div className="p-6">
              {/* Sekmeler */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 mb-5 bg-stone-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <LogIn className="w-4 h-4" /> Giriş Yap
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <UserPlus className="w-4 h-4" /> Yeni Dükkan
                </button>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2 animate-pop">
                    <span className="mt-px shrink-0">⚠️</span> {error}
                  </div>
                )}

                {mode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Dükkan Adı *</label>
                      <div className="relative">
                        <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          required
                          autoComplete="organization"
                          placeholder="Bereket Market"
                          className="field-input pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="field-label">Yetkili Adı *</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          required
                          autoComplete="name"
                          placeholder="Ahmet Usta"
                          className="field-input pl-10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="field-label">Telefon *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      autoComplete="tel"
                      placeholder="05XX XXX XX XX"
                      className="field-input pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">
                    Şifre *{mode === 'register' && <span className="text-stone-400 normal-case font-semibold tracking-normal ml-1">(en az 4 hane)</span>}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={mode === 'register' ? 4 : 1}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      placeholder="••••••"
                      className="field-input pl-10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-[15px] shadow-lg shadow-orange-600/30 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Lütfen bekleyin…</>
                  ) : mode === 'login' ? (
                    <>Giriş Yap <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>Dükkanı Aç <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <div className="flex items-center gap-3 text-[11px] font-bold text-stone-400">
                  <span className="flex-1 h-px bg-stone-200" />
                  veya
                  <span className="flex-1 h-px bg-stone-200" />
                </div>

                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-stone-200 hover:border-orange-500 hover:text-orange-700 text-stone-600 font-extrabold text-sm transition-colors cursor-pointer"
                >
                  {mode === 'login' ? (
                    <><UserPlus className="w-4 h-4" /> Ücretsiz dükkan oluştur</>
                  ) : (
                    <><LogIn className="w-4 h-4" /> Zaten hesabım var, giriş yap</>
                  )}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-semibold pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Şifren şifreli saklanır · Ücretsiz · 2 dakikada kurulum
                </p>
              </form>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-stone-400 font-semibold">
            Dükkanım Yanımda © 2026
          </p>
        </div>
      </div>
    </div>
  );
};
