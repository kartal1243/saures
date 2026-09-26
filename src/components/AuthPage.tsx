import React, { useState } from 'react';
import { Phone, Lock, Store, User, ArrowRight, LogIn, UserPlus, Loader2, ShieldCheck, Zap, BadgeCheck } from 'lucide-react';
import logoRaw from '../../public/brand/logo-dukkanim.svg?raw';

interface AuthPageProps {
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
  onBack?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, initialMode, onBack }) => {
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

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-stone-100 dark:bg-stone-950">
      {/* Zemin: yumuşak amber ışık + ağ nokta dokusu */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(900px 480px at 50% -8%, rgba(251,191,36,0.28), transparent 62%), radial-gradient(700px 420px at 110% 105%, rgba(245,158,11,0.14), transparent 60%), radial-gradient(700px 420px at -10% 100%, rgba(245,158,11,0.10), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(120,113,108,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(120,113,108,0.10) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 40%, black, transparent)',
        }}
      />

      <div className="relative w-full max-w-md animate-fade-up">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            ← Tanıtıma dön
          </button>
        )}
        {/* Logo & Baslik */}
        <div className="text-center mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-black tracking-wide border border-amber-200 dark:border-amber-800/60 mb-3">
            <Store className="w-3 h-3" /> ESNAFIN DİJİTAL DEFTERİ
          </span>
          <div
            className="mx-auto w-[230px] sm:w-[276px] select-none [&>svg]:w-full [&>svg]:h-auto [&>svg]:drop-shadow-sm"
            dangerouslySetInnerHTML={{ __html: logoRaw }}
          />
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2.5 font-medium">
            Dükkanının kasa, veresiye ve gün sonu defteri
          </p>
        </div>

        {/* Kart */}
        <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm rounded-3xl border border-white/70 dark:border-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-18px_rgba(28,25,23,0.35)] overflow-hidden">
          {/* Sekmeler: pill segment control */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 m-5 mb-0 bg-stone-100/80 dark:bg-stone-800/60 rounded-2xl">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              <LogIn className="w-4 h-4" /> Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Yeni Dükkan
            </button>
          </div>

          <form onSubmit={submit} className="p-5 sm:p-6 pt-4 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-2 animate-pop">
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
                      autoFocus
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
                  autoFocus={mode === 'login'}
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
              className="btn-primary w-full py-3 text-[15px]"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Lütfen bekleyin…</>
              ) : mode === 'login' ? (
                <>Giriş Yap <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Kaydı Oluştur <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="flex items-center justify-between pt-0.5 text-[11.5px]">
              <p className="text-stone-400 dark:text-stone-500">
                {mode === 'login' ? (
                  <>Hesabın yok mu?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('register'); setError(null); }}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Dükkanını kaydet
                    </button>
                  </>
                ) : (
                  <>Zaten hesabın var mı?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(null); }}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Giriş yap
                    </button>
                  </>
                )}
              </p>
            </div>
          </form>

          {/* Güvenlik notu */}
          <div className="px-5 sm:px-6 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 flex items-center justify-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Şifren şifreli saklanır · Dükkan verilerin yalnızca sana ait
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5 text-[11px] text-stone-500 dark:text-stone-400 font-bold">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" /> Ücretsiz
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Şifreli
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> 2 dakikada kurulum
          </span>
        </div>
      </div>
    </div>
  );
};
