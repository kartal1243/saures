import React, { useState, useEffect } from 'react';
import { Phone, Lock, Store, User, ArrowRight, LogIn, UserPlus, Loader2, ShieldCheck, Wallet, Smartphone, BellRing, Mail, CheckCircle2, MapPin } from 'lucide-react';
import { useForceLightTheme } from '../../hooks/useForceLightTheme';
import { PhoneMockupHero } from './PhoneMockupHero';
import {
  sendFirebasePhoneOtp,
  confirmFirebasePhoneOtp,
  resetRecaptchaVerifier,
  translateFirebaseError,
  sendFirebaseRecoveryEmailLink,
  completeFirebaseRecoveryEmailLink,
  initFirebaseAppCheck,
  fetchWithAppCheck,
} from '../../firebase';
import type { ConfirmationResult } from 'firebase/auth';

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
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [password, setPassword] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Opsiyonel Kayıt Firebase SMS Doğrulama
  const [regConfirmResult, setRegConfirmResult] = useState<ConfirmationResult | null>(null);
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regOtpBusy, setRegOtpBusy] = useState(false);
  const [regFirebaseIdToken, setRegFirebaseIdToken] = useState<string | null>(null);
  const [regOtpMsg, setRegOtpMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && !kvkkAccepted) {
      setError('Lütfen KVKK Aydınlatma Metni ve Kullanım Koşullarını okuyup onaylayınız.');
      return;
    }

    let identifier = phone.trim();
    let effectiveRegToken = regFirebaseIdToken;
    if (mode === 'register') {
      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone.startsWith('05') || cleanPhone.length !== 11) {
        setError('Lütfen 05 ile başlayan 11 haneli geçerli bir cep telefonu numarası giriniz (Örn: 05XXXXXXXXX). Harf veya eksik numara kabul edilmez.');
        return;
      }
      identifier = cleanPhone;

      const cleanEmail = email.trim();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setError('Lütfen bildirimler ve şifre kurtarma için geçerli bir e-posta adresi giriniz.');
        return;
      }

      if (!effectiveRegToken) {
        if (regOtpSent && regConfirmResult && regOtpCode.trim().length === 6) {
          setRegOtpBusy(true);
          try {
            const verified = await confirmFirebasePhoneOtp(regConfirmResult, regOtpCode.trim());
            effectiveRegToken = verified.idToken;
            setRegFirebaseIdToken(verified.idToken);
            setRegOtpMsg('Telefon numarası SMS ile doğrulandı!');
          } catch (fbErr: any) {
            setError(translateFirebaseError(fbErr));
            return;
          } finally {
            setRegOtpBusy(false);
          }
        } else {
          setError('Kayıt olabilmek için lütfen önce telefon numaranızı SMS kodu ile doğrulayınız.');
          return;
        }
      }
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
          : {
              shopName,
              ownerName,
              phone: identifier,
              email: email.trim(),
              password,
              kvkkAccepted: true,
              ...(googleMapsUrl.trim() ? { googleMapsUrl: googleMapsUrl.trim() } : {}),
              ...(effectiveRegToken ? { firebaseIdToken: effectiveRegToken } : {}),
            };
      const res = await fetchWithAppCheck(url, {
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
  const [forgotMethod, setForgotMethod] = useState<'sms' | 'email'>('sms');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryEmailIdToken, setRecoveryEmailIdToken] = useState<string | null>(null);
  const [customEmailResetToken, setCustomEmailResetToken] = useState<string | null>(null);
  const [forgotEmailSentMsg, setForgotEmailSentMsg] = useState<string | null>(null);
  const [matchedShopPreview, setMatchedShopPreview] = useState<{ shopName: string; maskedEmail?: string } | null>(null);
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotWhatsappLink, setForgotWhatsappLink] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);
  const [resendCooldownSec, setResendCooldownSec] = useState(0);

  useEffect(() => {
    if (resendCooldownSec <= 0) return;
    const t = setTimeout(() => setResendCooldownSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldownSec]);

  useEffect(() => {
    initFirebaseAppCheck().catch(() => {});

    // Özel kurumsal e-posta sıfırlama bağlantısından (?emailResetToken=...) dönüldüyse Adım 2'yi aç
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = (params.get('emailResetToken') || '').trim();
      const emailParam = (params.get('recoveryEmail') || '').trim();
      if (tokenParam) {
        setCustomEmailResetToken(tokenParam);
        if (emailParam) setRecoveryEmail(emailParam);
        setForgotMethod('email');
        setForgotStep(2);
        setIsForgotPasswordOpen(true);
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
    } catch {
      // ignore URL parsing errors
    }

    // Firebase E-posta sıfırlama linkinden dönüldüyse modalı doğrudan Adım 2'ye aç
    completeFirebaseRecoveryEmailLink()
      .then((res) => {
        if (res.matched && res.idToken) {
          setRecoveryEmail(res.email || '');
          if (res.phone) setRecoveryPhone(res.phone);
          setRecoveryEmailIdToken(res.idToken);
          setForgotMethod('email');
          setForgotStep(2);
          setIsForgotPasswordOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  const closeForgotPasswordModal = () => {
    setIsForgotPasswordOpen(false);
    setForgotMethod('sms');
    setForgotStep(1);
    setForgotSuccess(false);
    setForgotError(null);
    setForgotOtpCode('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setConfirmationResult(null);
    setRecoveryEmailIdToken(null);
    setCustomEmailResetToken(null);
    setForgotEmailSentMsg(null);
    setMatchedShopPreview(null);
    setCircuitBreakerActive(false);
    setForgotWhatsappLink(null);
    setResendCooldownSec(0);
    resetRecaptchaVerifier('recaptcha-container');
  };

  const triggerForgotPhoneSms = async () => {
    setForgotError(null);
    setCircuitBreakerActive(false);
    const cleanDigits = recoveryPhone.replace(/\D/g, '');
    if (!cleanDigits.startsWith('05') || cleanDigits.length !== 11) {
      setForgotError('Lütfen 05 ile başlayan 11 haneli geçerli bir telefon numarası giriniz.');
      return;
    }

    setForgotLoading(true);
    try {
      const checkRes = await fetchWithAppCheck('/api/auth/forgot-password/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: recoveryPhone }),
      });
      const checkData = await checkRes.json().catch(() => ({}));

      if (checkData.shopName) {
        setMatchedShopPreview({ shopName: checkData.shopName, maskedEmail: checkData.maskedEmail });
      }
      if (checkData.whatsappLink) {
        setForgotWhatsappLink(checkData.whatsappLink);
      }

      if (!checkRes.ok || checkData.allowed === false) {
        if (checkData.fallbackToWhatsapp) {
          setCircuitBreakerActive(true);
          setForgotError(checkData.message || 'SMS kotası koruma altında. WhatsApp veya E-posta ile anında doğrulayabilirsiniz.');
        } else {
          setForgotError(checkData.error || checkData.message || 'SMS kodu gönderilemiyor.');
        }
        return;
      }

      const { confirmationResult: conf } = await sendFirebasePhoneOtp(
        cleanDigits,
        'recaptcha-container',
        () => setForgotError('Güvenlik doğrulaması zaman aşımına uğradı. Lütfen tekrar deneyiniz.')
      );

      setConfirmationResult(conf);
      setResendCooldownSec(60);

      fetchWithAppCheck('/api/auth/forgot-password/record-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: recoveryPhone }),
      }).catch(() => {});

      setForgotStep(2);
    } catch (err: any) {
      console.error('Firebase SMS Gönderim Hatası:', err);
      const errCode = String(err?.code || '');
      if (errCode === 'auth/quota-exceeded' || errCode === 'auth/too-many-requests' || err?.message?.includes('quota')) {
        setCircuitBreakerActive(true);
      }
      setForgotError(translateFirebaseError(err));
    } finally {
      setForgotLoading(false);
    }
  };

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
                        if (clean !== phone) {
                          setRegFirebaseIdToken(null);
                          setRegConfirmResult(null);
                          setRegOtpSent(false);
                          setRegOtpCode('');
                          setRegOtpMsg(null);
                        }
                        setPhone(clean);
                      }
                    }}
                    required
                    maxLength={mode === 'login' ? 32 : 11}
                    autoComplete={mode === 'login' ? 'username' : 'tel'}
                    placeholder={mode === 'login' ? '05XXXXXXXXX veya kullanıcı adı' : '05XXXXXXXXX'}
                    title={
                      mode === 'login'
                        ? '05 ile başlayan telefon veya kullanıcı adı'
                        : '05 ile başlayan 11 haneli cep telefonu numarası (Örn: 05XXXXXXXXX)'
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-sans"
                  />
                </div>
                {mode === 'register' && (
                  <div className="mt-2">
                    <div id="register-recaptcha-container" />
                    {regFirebaseIdToken ? (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Telefon numarası SMS ile doğrulandı
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            disabled={regOtpBusy || phone.replace(/\D/g, '').length !== 11}
                            onClick={async () => {
                              setRegOtpBusy(true);
                              setRegOtpMsg(null);
                              try {
                                const res = await sendFirebasePhoneOtp(phone, 'register-recaptcha-container');
                                setRegConfirmResult(res.confirmationResult);
                                setRegOtpSent(true);
                                setRegOtpMsg('6 haneli doğrulama kodu SMS ile gönderildi.');
                              } catch (err: any) {
                                setRegOtpMsg(translateFirebaseError(err));
                              } finally {
                                setRegOtpBusy(false);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1.5 rounded-lg disabled:opacity-45 cursor-pointer transition-colors"
                          >
                            {regOtpBusy
                              ? 'SMS doğrulama kodu gönderiliyor...'
                              : regOtpSent
                              ? '📱 SMS Doğrulama Kodunu Tekrar Gönder'
                              : '📱 Telefonu SMS ile Doğrula (Zorunlu) *'}
                          </button>
                        </div>
                        {regOtpSent && regConfirmResult && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={regOtpCode}
                              onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="6 haneli kod"
                              className="w-32 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-mono font-bold text-center"
                            />
                            <button
                              type="button"
                              disabled={regOtpBusy || regOtpCode.length < 6}
                              onClick={async () => {
                                if (!regConfirmResult) return;
                                setRegOtpBusy(true);
                                try {
                                  const verified = await confirmFirebasePhoneOtp(regConfirmResult, regOtpCode);
                                  setRegFirebaseIdToken(verified.idToken);
                                  setRegOtpMsg('Telefon numarası SMS ile doğrulandı!');
                                } catch (err: any) {
                                  setRegOtpMsg(translateFirebaseError(err));
                                } finally {
                                  setRegOtpBusy(false);
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                            >
                              Onayla
                            </button>
                          </div>
                        )}
                        {regOtpMsg && <p className="text-[11px] font-semibold text-stone-600">{regOtpMsg}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1">
                    E-posta Adresi * <span className="text-stone-400 font-normal lowercase tracking-normal">(randevu bildirimleri ve kurtarma için)</span>
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

              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1">
                    Google Maps Konum Linki <span className="text-stone-400 font-normal lowercase tracking-normal">(isteğe bağlı)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="url"
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      placeholder="https://maps.app.goo.gl/... (İsteğe bağlı)"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Randevu onaylandıktan sonra müşterilere haritada yol tarifi göstermek için.
                  </p>
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

      {/* Şifremi Unuttum Kurtarma Modalı (Firebase Phone Auth + E-posta + WhatsApp Koruma Kalkanı) */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Invisible reCAPTCHA Container */}
            <div id="recaptcha-container" />

            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-600" />
                {forgotStep === 1 ? 'Şifremi Unuttum' : 'Yeni Şifre Belirleme'}
              </h3>
              <button
                type="button"
                onClick={closeForgotPasswordModal}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotStep === 1 && !forgotSuccess && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMethod('sms');
                    setForgotError(null);
                    setForgotEmailSentMsg(null);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    forgotMethod === 'sms' ? 'bg-white text-orange-600 shadow-xs' : 'text-stone-500'
                  }`}
                >
                  📱 Telefon SMS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMethod('email');
                    setForgotError(null);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    forgotMethod === 'email' ? 'bg-white text-orange-600 shadow-xs' : 'text-stone-500'
                  }`}
                >
                  ✉️ E-posta Linki
                </button>
              </div>
            )}

            {forgotSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold space-y-3 text-center">
                <div className="text-3xl">🎉</div>
                <div className="font-black text-sm text-emerald-900">Şifreniz Başarıyla Güncellendi!</div>
                <p className="text-emerald-700 font-medium leading-relaxed">
                  Yeni şifreniz Firebase ile güvenle doğrulandı ve kaydedildi. Oturumunuz açılıyor, doğrudan panele yönlendiriliyorsunuz...
                </p>
              </div>
            ) : forgotStep === 1 ? (
              forgotMethod === 'sms' ? (
                <>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Kayıtlı cep telefonu numaranızı giriniz. Firebase Blaze güvenlik doğrulamasıyla telefonunuza SMS ile 6 haneli onay kodu gönderilecektir.
                  </p>

                  {forgotError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">⚠️</span>
                      <span>{forgotError}</span>
                    </div>
                  )}

                  {circuitBreakerActive && forgotWhatsappLink && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2.5 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 font-black text-xs text-emerald-950">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                          💬
                        </span>
                        WhatsApp ile Hızlı Doğrulama
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                        Platform SMS limiti veya harcama koruması devrededir. WhatsApp hattımızdan veya E-posta sekmesinden şifrenizi yenileyebilirsiniz.
                      </p>
                      <a
                        href={forgotWhatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer text-center"
                      >
                        WhatsApp Yetkili Hattına Bağlan →
                      </a>
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
                    {!circuitBreakerActive && (
                      <button
                        type="button"
                        disabled={forgotLoading || !recoveryPhone}
                        onClick={triggerForgotPhoneSms}
                        className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {forgotLoading ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> SMS Gönderiliyor…</>
                        ) : (
                          'Firebase SMS Onay Kodu Gönder'
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={closeForgotPasswordModal}
                      className="w-full py-2 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
                    >
                      Vazgeç
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Kayıt sırasında tanımladığınız dükkan e-posta adresinize veya telefon numaranıza bağlı kurtarma adresine tek tıkla Firebase doğrulama bağlantısı gönderin.
                  </p>

                  {forgotError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">⚠️</span>
                      <span>{forgotError}</span>
                    </div>
                  )}

                  {forgotEmailSentMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      ✅ {forgotEmailSentMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">Kayıtlı E-posta Adresiniz</label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => {
                        setRecoveryEmail(e.target.value);
                        setForgotError(null);
                      }}
                      placeholder="ornek@dukkanim.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={forgotLoading || (!recoveryEmail.trim() && !recoveryPhone.trim())}
                      onClick={async () => {
                        setForgotError(null);
                        setForgotEmailSentMsg(null);
                        setForgotLoading(true);
                        try {
                          const res = await fetchWithAppCheck('/api/auth/forgot-password/send-email-reset', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: recoveryEmail.trim(),
                              phone: recoveryPhone.trim(),
                            }),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) throw new Error(data.error || 'E-posta adresi doğrulanamadı.');
                          const targetEmail = data.email || recoveryEmail.trim();
                          if (data.customEmailSent) {
                            setForgotEmailSentMsg(
                              `${targetEmail} adresine kurumsal şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzdaki bağlantıya tıkladığınızda yeni şifre ekranı otomatik açılacaktır.`
                            );
                          } else {
                            await sendFirebaseRecoveryEmailLink(targetEmail, recoveryPhone.trim());
                            setForgotEmailSentMsg(
                              `${targetEmail} adresine doğrulama bağlantısı gönderildi. Gelen kutunuzdaki bağlantıya tıkladığınızda yeni şifre ekranı otomatik açılacaktır.`
                            );
                          }
                        } catch (err: any) {
                          setForgotError(translateFirebaseError(err));
                        } finally {
                          setForgotLoading(false);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gönderiliyor…</>
                      ) : (
                        'E-posta Doğrulama Linki Gönder'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={closeForgotPasswordModal}
                      className="w-full py-2 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
                    >
                      Vazgeç
                    </button>
                  </div>
                </>
              )
            ) : (
              <>
                {recoveryEmailIdToken || customEmailResetToken ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 font-semibold">
                    ✅ <strong className="text-emerald-900">{recoveryEmail || 'E-posta'}</strong> hesabınız doğrulandı. Şimdi yeni şifrenizi belirleyin.
                  </p>
                ) : (
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {matchedShopPreview?.shopName ? <strong className="text-orange-600">{matchedShopPreview.shopName} — </strong> : null}
                    <strong className="text-stone-800">{recoveryPhone}</strong> numarasına gönderilen 6 haneli onay kodunu ve yeni şifrenizi giriniz.
                  </p>
                )}

                {forgotError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {!(recoveryEmailIdToken || customEmailResetToken) && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-stone-700">6 Haneli SMS Kodu *</label>
                        <button
                          type="button"
                          disabled={forgotLoading || resendCooldownSec > 0}
                          onClick={triggerForgotPhoneSms}
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 disabled:text-stone-400 cursor-pointer"
                        >
                          {resendCooldownSec > 0 ? `Tekrar Gönder (${resendCooldownSec}s)` : 'Kodu Tekrar Gönder'}
                        </button>
                      </div>
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
                  )}

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
                    disabled={
                      forgotLoading ||
                      (!(recoveryEmailIdToken || customEmailResetToken) && forgotOtpCode.length < 4) ||
                      !newPassword
                    }
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
                        let idToken: string | undefined = recoveryEmailIdToken || undefined;

                        if (!idToken && !customEmailResetToken && confirmationResult) {
                          const verified = await confirmFirebasePhoneOtp(confirmationResult, forgotOtpCode);
                          idToken = verified.idToken;
                        }

                        const res = await fetchWithAppCheck('/api/auth/forgot-password/verify-and-reset', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            phone: recoveryPhone || '',
                            idToken,
                            emailResetToken: customEmailResetToken || undefined,
                            otpCode: forgotOtpCode,
                            newPassword,
                          }),
                        });

                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data.error || 'Şifre güncellenemedi.');

                        setForgotSuccess(true);
                        setTimeout(() => {
                          closeForgotPasswordModal();
                          onSuccess();
                        }, 1200);
                      } catch (err: any) {
                        console.error('Şifre Doğrulama Hatası:', err);
                        setForgotError(translateFirebaseError(err));
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

                  {!(recoveryEmailIdToken || customEmailResetToken) && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(1);
                        setConfirmationResult(null);
                        setForgotError(null);
                      }}
                      className="w-full py-1.5 text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
                    >
                      ← Numarayı Değiştir
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
