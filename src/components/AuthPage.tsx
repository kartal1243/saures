import React, { useState } from 'react';
import { Store, Phone, Lock, User, ArrowRight, LogIn, UserPlus, Loader2 } from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
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
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Baslik */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg mb-3">
            <svg viewBox="0 0 32 32" className="w-9 h-9" fill="none"><path d="M6 14 A10 10 0 0 1 26 14 Z" fill="#fff"/><circle cx="8" cy="15" r="2" fill="#f59e0b"/><circle cx="14" cy="15" r="2" fill="#fff"/><circle cx="20" cy="15" r="2" fill="#f59e0b"/><circle cx="25" cy="15" r="1.6" fill="#fff"/><rect x="9" y="17.5" width="14" height="10" rx="2" fill="#fff"/><rect x="11" y="19.5" width="4.5" height="3.5" rx="1" fill="#f59e0b"/><rect x="17" y="21.5" width="4" height="6" rx="1" fill="#f59e0b"/></svg>
          </div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Dükkânım
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Dükkanının kasa, veresiye ve gün sonu defteri
          </p>
        </div>

        {/* Kart */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden">
          {/* Sekmeler */}
          <div className="grid grid-cols-2 border-b border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-3 text-sm font-black flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'text-amber-700 dark:text-amber-400 border-b-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
            >
              <LogIn className="w-4 h-4" /> Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`py-3 text-sm font-black flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'text-amber-700 dark:text-amber-400 border-b-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Dükkan Kaydı
            </button>
          </div>

          <form onSubmit={submit} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Dükkan Adı *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      required
                      autoFocus
                      placeholder="Örn: Bereket Market"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Yetkili Adı *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                      placeholder="Örn: Ahmet Usta"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Telefon *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoFocus={mode === 'login'}
                  placeholder="05XX XXX XX XX"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Şifre * {mode === 'register' && <span className="text-stone-400 normal-case">(en az 4 hane)</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'register' ? 4 : 1}
                  placeholder="••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Lütfen bekleyin...</>
              ) : mode === 'login' ? (
                <>Giriş Yap <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Kaydı Oluştur <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center">
              {mode === 'login'
                ? 'Hesabın yok mu? Yukarıdan "Dükkan Kaydı" sekmesine geç.'
                : 'Kayıt olunca dükkanın kendi özel defteri açılır — veriler yalnızca sana ait.'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
