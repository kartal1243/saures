import React, { useState } from 'react';
import { Phone, Lock, Store, User, ArrowRight, LogIn, UserPlus, Loader2, ShieldCheck, Wallet, Smartphone, BellRing, Mail, CheckCircle2 } from 'lucide-react';
import logoRaw from '../../public/brand/logo-dukkanim.svg?raw';
import { useForceLightTheme } from '../../hooks/useForceLightTheme';
import { PhoneMockupHero } from './PhoneMockupHero';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && !kvkkAccepted) {
      setError('Lütfen KVKK Aydınlatma Metni ve Kullanım Koşullarını okuyup onaylayınız.');
      return;
    }

    let identifier = phone.trim();
    if (mode === 'register') {
      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone.startsWith('05') || cleanPhone.length !== 11) {
        setError('Lütfen 05 ile başlayan 11 haneli geçerli bir cep telefonu numarası giriniz (Örn: 05XXXXXXXXX). Harf veya eksik numara kabul edilmez.');
        return;
      }
      identifier = cleanPhone;
    } else {
      if (!identifier) {
        setError('Lütfen telefon numaranızı veya kullanıcı adınızı giriniz.');
        return;
      }
    }
    if (password.length < 6) {
      setError('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { phone: identifier, password }
          : { shopName, ownerName, phone: identifier, email, password, kvkkAccepted: true };
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

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotWhatsappLink, setForgotWhatsappLink] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#fafaf9] font-sans lg:grid lg:grid-cols-[1fr_470px] xl:grid-cols-[1fr_490px]">
      {/* Sol tanıtım paneli (desktop) */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-linear-to-br from-[#ff5a00] via-[#f95a00] to-[#e64a00] text-white p-8 xl:p-12 2xl:p-14">
        {/* Arka plan ışık halkaları */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(750px 420px at 15% 10%, rgba(255,255,255,0.24), transparent 65%), radial-gradient(650px 500px at 90% 90%, rgba(154,52,18,0.4), transparent 60%)',
          }}
        />

        {/* Üst Sol Logo */}
        <div className="relative z-10">
          <span className="inline-block bg-white rounded-2xl px-5 py-3 shadow-xl">
            <img
              src="/brand/logo-horizontal.png"
              alt="Dükkânım Yanımda"
              className="h-10 w-auto max-w-[210px] object-contain block"
            />
          </span>
        </div>

        {/* Orta Alan: Sol Metin & Kart + Ortada 3D Telefon Mockup'ı */}
        <div className="relative z-10 my-auto py-6 flex items-center justify-between gap-6 xl:gap-10">
          {/* Sol Kolon: Kasa Kartı, Başlık, Alt Bilgi */}
          <div className="max-w-[440px] xl:max-w-[480px] shrink-0">
            {/* 3D Glassmorphism "Bugünün Kasası" Kartı (Dalga Grafikli) */}
            <div className="rounded-3xl bg-white/15 border border-white/30 backdrop-blur-md p-6 mb-8 shadow-[0_20px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-100/90">
                    Bugünün Kasası
                  </p>
                  <p className="text-3xl xl:text-4xl font-black tracking-tight mt-0.5 text-white">
                    ₺12.450
                  </p>
                </div>

                {/* Parıltılı Dalga Grafiği */}
                <div className="shrink-0">
                  <svg viewBox="0 0 160 50" className="w-32 xl:w-36 h-12 overflow-visible">
                    <defs>
                      <linearGradient id="heroWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="45%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <filter id="heroGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    {/* Yumuşak kavisli trend eğrisi */}
                    <path
                      d="M 5 34 C 25 34, 30 14, 52 18 C 74 22, 85 40, 108 32 C 128 24, 138 10, 155 12"
                      fill="none"
                      stroke="url(#heroWaveGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#heroGlow)"
                    />
                    {/* Işıltılı bitiş noktası */}
                    <circle cx="155" cy="12" r="3.5" fill="#06b6d4" className="animate-pulse" />
                    <circle cx="155" cy="12" r="7" fill="#06b6d4" opacity="0.35" />
                  </svg>
                </div>
              </div>

              {/* Alt Butonlar: Nakit ve Kart Girişi */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl bg-white/10 border border-white/20 px-3.5 py-2.5 backdrop-blur-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black tracking-tight text-white">+₺6.300</p>
                    <p className="text-[10px] font-semibold text-orange-100">Nakit</p>
                  </div>
                  <span className="text-emerald-300 font-black text-xs">↗</span>
                </div>

                <div className="rounded-xl bg-white/10 border border-white/20 px-3.5 py-2.5 backdrop-blur-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black tracking-tight text-white">+₺4.150</p>
                    <p className="text-[10px] font-semibold text-orange-100">Kart</p>
                  </div>
                  <span className="text-emerald-300 font-black text-xs">↗</span>
                </div>
              </div>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black leading-[1.06] tracking-tight">
              Dükkanını<br />Cebinden Yönet
            </h1>
            <p className="mt-4 text-orange-50 font-medium text-sm xl:text-base leading-relaxed">
              Kasa, veresiye ve gün sonu tek panelde. Kağıt defteri kapat,
              dükkanını 2 dakikada dijitale taşı.
            </p>
          </div>

          {/* 3D Vektörel iPhone Mockup'ı (Görsel 2 Birebir, Ultra HD & Kristal Netliğinde) */}
          <div className="hidden lg:flex items-center justify-center shrink-0 pl-2">
            <PhoneMockupHero />
          </div>
        </div>

        {/* Alt Özellik Kutuları (2x2 Grid) */}
        <div className="relative z-10 grid grid-cols-2 gap-3 max-w-[480px]">
          {LEFT_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 backdrop-blur-xs">
                <p className="text-sm font-black flex items-center gap-2 text-white">
                  <Icon className="w-4 h-4 text-orange-200" /> {f.title}
                </p>
                <p className="text-xs text-orange-100 mt-0.5 font-semibold">{f.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sağ giriş kartı */}
      <div className="flex flex-col items-center justify-center px-4 py-8 sm:px-8 bg-[#fafaf9]">
        {/* Mobil mini vitrin */}
        <div className="lg:hidden w-full max-w-md mb-5 rounded-3xl bg-linear-to-br from-[#ff5a00] to-[#e64a00] text-white p-6 text-center shadow-lg">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-5 py-3 shadow-md">
            <img
              src="/brand/logo-horizontal.png"
              alt="Dükkânım Yanımda"
              className="h-10 w-auto max-w-[190px] object-contain block"
            />
          </div>
          <p className="mt-3.5 text-xl font-black">Dükkanını Cebinden Yönet</p>
          <p className="text-xs text-orange-100 font-semibold mt-1">Kasa, veresiye ve gün sonu tek panelde</p>
        </div>

        <div className="w-full max-w-[430px] animate-fade-up">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-orange-600 transition-colors cursor-pointer"
            >
              ← Tanıtıma dön
            </button>
          )}

          {/* Görsel 2'deki Temiz Beyaz Giriş Kartı (Turuncu Başlık Bandı Kaldırıldı) */}
          <div className="bg-white rounded-[28px] border border-stone-200 shadow-[0_20px_50px_-15px_rgba(28,25,23,0.1)] p-7 sm:p-8">
            {/* Kart Başlığı */}
            <div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                {mode === 'login' ? (
                  <>
                    Hesabınıza <span className="text-orange-600">Giriş Yapın</span>
                  </>
                ) : (
                  <>
                    Dükkanınızı <span className="text-orange-600">Açın</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-stone-500 font-semibold mt-1">
                {mode === 'login'
                  ? 'Dükkanınızı her yerden yönetin'
                  : '2 dakikada kurulum, kredi kartı gerekmez'}
              </p>
            </div>

            {/* Giriş Yap / Yeni Dükkan Sekme Butonları */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 mt-5 mb-5 bg-stone-100 rounded-2xl">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Yeni Dükkan
              </button>
            </div>

            {/* 14 Gün Ücretsiz VIP Kampanyası Rozeti */}
            <div className="mb-5 p-3 rounded-2xl bg-linear-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 text-amber-950 text-xs flex items-center gap-2.5 shadow-xs">
              <span className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-base">
                🎁
              </span>
              <div>
                <div className="font-black text-amber-950 flex items-center gap-1.5">
                  14 Gün Ücretsiz VIP Kampanyası!
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-md bg-orange-600 text-white font-extrabold">HEDİYE</span>
                </div>
                <div className="text-[11px] text-stone-600 font-semibold mt-0.5">
                  Şimdi kayıt olun, sınırsız VIP özellikleri 14 gün sıfır ücretle kullanın.
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2 animate-pop">
                  <span className="mt-px shrink-0">⚠️</span> {error}
                </div>
              )}

              {mode === 'register' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1">
                      Dükkan Adı *
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        required
                        autoComplete="organization"
                        placeholder="Bereket Market"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1">
                      Yetkili Adı *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        required
                        autoComplete="name"
                        placeholder="Ahmet Usta"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1">
                  {mode === 'login' ? 'Telefon veya Kullanıcı Adı *' : 'Telefon *'}
                </label>
                <div className="relative">
                  {mode === 'login' && !/^\d/.test(phone) ? (
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  ) : (
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                  <input
                    type={mode === 'login' ? 'text' : 'tel'}
                    inputMode={mode === 'login' ? 'text' : 'numeric'}
                    value={phone}
                    onChange={(e) => {
                      if (mode === 'login') {
                        setPhone(e.target.value.trim());
                      } else {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setPhone(clean);
                      }
                    }}
                    required
                    maxLength={mode === 'login' ? 32 : 11}
                    autoComplete={mode === 'login' ? 'username' : 'tel'}
                    placeholder={mode === 'login' ? '05XXXXXXXXX veya kullanıcı adı' : '05XXXXXXXXX'}
                    title={mode === 'login' ? '05 ile başlayan telefon veya kullanıcı adı' : '05 ile başlayan 11 haneli cep telefonu numarası (Örn: 05XXXXXXXXX)'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-sans"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1">
                    E-posta Adresi * <span className="text-stone-400 font-normal lowercase tracking-normal">(kurtarma için)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="ahmet@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700">
                    Şifre *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryPhone(phone);
                        setIsForgotPasswordOpen(true);
                      }}
                      className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                      Şifremi Unuttum?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* KVKK ve Kullanım Koşulları Onayı (Kayıt Modunda Zorunlu) */}
              {mode === 'register' && (
                <div className="flex items-start gap-2.5 pt-1 pb-1">
                  <input
                    type="checkbox"
                    id="kvkk-checkbox"
                    checked={kvkkAccepted}
                    onChange={(e) => setKvkkAccepted(e.target.checked)}
                    required
                    className="mt-0.5 w-4 h-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600 shrink-0"
                  />
                  <label htmlFor="kvkk-checkbox" className="text-xs text-stone-600 leading-snug cursor-pointer select-none">
                    <span className="font-bold text-stone-800">KVKK Aydınlatma Metni</span> ve{' '}
                    <span className="font-bold text-stone-800">Kullanım Koşullarını</span> okudum, onaylıyorum. *
                  </label>
                </div>
              )}

              {/* Ana Giriş Butonu */}
              <button
                type="submit"
                disabled={loading || (mode === 'register' && !kvkkAccepted)}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-md shadow-orange-600/25 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Lütfen bekleyin…</>
                ) : mode === 'login' ? (
                  <>Giriş Yap <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Dükkanı Aç <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {/* veya Bölücü */}
              <div className="flex items-center gap-3 text-[11px] font-bold text-stone-400 my-4">
                <span className="flex-1 h-px bg-stone-200" />
                veya
                <span className="flex-1 h-px bg-stone-200" />
              </div>

              {/* Ücretsiz Dükkan Oluştur Butonu */}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-stone-200 hover:border-orange-300 hover:bg-orange-50/50 text-stone-800 font-extrabold text-xs transition-all cursor-pointer shadow-xs"
              >
                {mode === 'login' ? (
                  <><UserPlus className="w-4 h-4 text-orange-600" /> 14 Gün Ücretsiz Dükkan Aç (Kredi Kartsız)</>
                ) : (
                  <><LogIn className="w-4 h-4 text-orange-600" /> Zaten hesabım var, giriş yap</>
                )}
              </button>

              {/* Alt Güvenlik Bildirimi */}
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 font-medium pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Şifreniz şifreli saklanır • 14 Gün Ücretsiz Canlı Deneme • Kredi Kartı İstemez
              </p>
            </form>
          </div>

          <p className="mt-5 text-center text-xs text-stone-400 font-medium">
            Dükkanım Yanımda © 2026
          </p>
        </div>
      </div>

      {/* Şifremi Unuttum Kurtarma Modalı (Gerçek SMS / WhatsApp OTP Sistemi) */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-600" />
                {forgotStep === 1 ? 'Şifremi Unuttum' : 'Yeni Şifre Belirleme'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setForgotStep(1);
                  setForgotSuccess(false);
                  setForgotError(null);
                  setForgotOtpCode('');
                  setNewPassword('');
                  setNewPasswordConfirm('');
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold space-y-3 text-center">
                <div className="text-3xl">🎉</div>
                <div className="font-black text-sm text-emerald-900">Şifreniz Başarıyla Güncellendi!</div>
                <p className="text-emerald-700 font-medium leading-relaxed">
                  Yeni şifreniz başarıyla kaydedildi. Oturumunuz açılıyor, doğrudan panele yönlendiriliyorsunuz...
                </p>
              </div>
            ) : forgotStep === 1 ? (
              <>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Kayıtlı cep telefonu numaranızı giriniz. Numaranıza 6 haneli SMS doğrulama kodu gönderilecektir.
                </p>

                {forgotError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    ⚠️ {forgotError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Dükkan Telefonunuz</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={recoveryPhone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setRecoveryPhone(clean);
                      setForgotError(null);
                    }}
                    placeholder="05XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-orange-500 font-mono tracking-wider font-bold"
                  />
                </div>
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={forgotLoading || !recoveryPhone}
                    onClick={async () => {
                      setForgotError(null);
                      if (!recoveryPhone.startsWith('05') || recoveryPhone.length !== 11) {
                        setForgotError('Lütfen 05 ile başlayan 11 haneli geçerli bir telefon numarası giriniz.');
                        return;
                      }
                      setForgotLoading(true);
                      try {
                        const res = await fetch('/api/auth/forgot-password/send-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phone: recoveryPhone }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data.error || 'Doğrulama kodu gönderilemedi.');
                        if (data.whatsappLink) setForgotWhatsappLink(data.whatsappLink);
                        if (data.demoCode) setForgotOtpCode(data.demoCode);
                        setForgotStep(2);
                      } catch (err: any) {
                        setForgotError(err.message || 'Bağlantı hatası oluştu.');
                      } finally {
                        setForgotLoading(false);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {forgotLoading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Kod Gönderiliyor…</>
                    ) : (
                      'SMS Onay Kodu Gönder'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(false);
                      setForgotError(null);
                    }}
                    className="w-full py-2 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
                  >
                    Vazgeç
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-stone-500 leading-relaxed">
                  <strong className="text-stone-800">{recoveryPhone}</strong> numarasına gönderilen 6 haneli onay kodunu ve yeni şifrenizi giriniz.
                </p>

                {forgotError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    ⚠️ {forgotError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">6 Haneli SMS Kodu *</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtpCode}
                      onChange={(e) => {
                        setForgotOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setForgotError(null);
                      }}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-center text-lg font-mono tracking-widest font-black outline-none focus:border-orange-500"
                    />
                    {forgotWhatsappLink && (
                      <a
                        href={forgotWhatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-[11px] text-emerald-600 font-bold hover:underline mt-1"
                      >
                        Kodu WhatsApp ile doğrula / al →
                      </a>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Yeni Şifre (En az 6 karakter) *</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setForgotError(null);
                      }}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Yeni Şifre Tekrar *</label>
                    <input
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => {
                        setNewPasswordConfirm(e.target.value);
                        setForgotError(null);
                      }}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled={forgotLoading || forgotOtpCode.length < 4 || !newPassword}
                    onClick={async () => {
                      setForgotError(null);
                      if (newPassword.length < 6) {
                        setForgotError('Yeni şifreniz en az 6 karakter olmalıdır.');
                        return;
                      }
                      if (newPassword !== newPasswordConfirm) {
                        setForgotError('Şifreler birbiriyle uyuşmuyor.');
                        return;
                      }
                      setForgotLoading(true);
                      try {
                        const res = await fetch('/api/auth/forgot-password/verify-and-reset', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            phone: recoveryPhone,
                            otpCode: forgotOtpCode,
                            newPassword,
                          }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data.error || 'Şifre güncellenemedi.');
                        setForgotSuccess(true);
                        setTimeout(() => {
                          onSuccess();
                        }, 1200);
                      } catch (err: any) {
                        setForgotError(err.message || 'Bağlantı hatası oluştu.');
                      } finally {
                        setForgotLoading(false);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {forgotLoading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Şifre Yenileniyor…</>
                    ) : (
                      'Şifremi Sıfırla ve Oturum Aç'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-full py-1.5 text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
                  >
                    ← Numarayı Değiştir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
