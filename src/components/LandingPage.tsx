import React from 'react';
import {
  Store,
  ArrowRight,
  LogIn,
  Wallet,
  BookUser,
  Package,
  Scissors,
  UtensilsCrossed,
  ShoppingCart,
  Wrench,
  LayoutDashboard,
  BellRing,
  ShieldCheck,
  DatabaseBackup,
  Users,
  ChartColumn,
  Smartphone,
  BadgeCheck,
  Zap,
  ChevronDown,
  Check,
} from 'lucide-react';
import logoRaw from '../../public/brand/logo-dukkanim.svg?raw';
import { useForceLightTheme } from '../hooks/useForceLightTheme';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const FEATURES: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }[] = [
  { icon: Wallet, title: 'Kasa & Gün Sonu', text: 'Nakit, kart, havale giriş-çıkış tek ekranda. Akşam kasayı say, farkı gör, günü kapat.' },
  { icon: BookUser, title: 'Veresiye Defteri', text: 'Müşteri cari kartları, borç-alacak takibi ve tek tuşla tahsilat kaydı.' },
  { icon: Package, title: 'Stok & Kritik Uyarı', text: 'Ürün, barkod ve kritik stok seviyesi. Biten ürün gözünden kaçmaz.' },
  { icon: LayoutDashboard, title: 'Sektörüne Özel Panel', text: 'Berber randevusu, kafe masası, tezgah satışı, servis fişi — dükkanına göre açılır.' },
  { icon: BellRing, title: 'WhatsApp Hatırlatma', text: 'Ödemesi geciken müşteriye tek dokunuşla kibar hatırlatma mesajı gönder.' },
  { icon: ChartColumn, title: 'Kar/Zarar Özeti', text: 'Ciro, gider ve net karı günlük-haftalık grafiklerle anında gör.' },
  { icon: Users, title: 'Kasiyer Modu', text: 'Çalışanına kısıtlı yetki ver: satış yapar, ayarlara ve yedeğe dokunamaz.' },
  { icon: DatabaseBackup, title: 'Yedekleme', text: 'Tüm defterin tek dosyada yedeklenir, istediğinde geri yüklenir.' },
];

const SECTORS: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }[] = [
  { icon: Scissors, title: 'Berber & Kuaför', text: 'Randevu takvimi, koltuk sırası ve usta takibi.' },
  { icon: UtensilsCrossed, title: 'Kafe & Restoran', text: 'Masa adisyonları, açık hesaplar ve hızlı kapatma.' },
  { icon: ShoppingCart, title: 'Bakkal & Market', text: 'Hızlı tezgah satışı, sepet fişi ve stok uyarısı.' },
  { icon: Wrench, title: 'Teknik Servis', text: 'Cihaz kabul fişi, arıza durumu ve parça maliyeti.' },
  { icon: Store, title: 'Genel Esnaf', text: 'Kasa akışı, veresiye defteri ve günlük özet.' },
];

const FAQS: { q: string; a: string }[] = [
  { q: 'Uygulama ücretsiz mi?', a: 'Evet. Kayıt ol, dükkanını 2 dakikada kur, tüm temel özellikleri ücretsiz kullan. Kredi kartı istemeyiz.' },
  { q: 'Verilerim güvende mi?', a: 'Şifren şifreli saklanır, dükkan verilerin yalnızca sana aittir. Yedekleme özelliğiyle defterini istediğin zaman indirebilirsin.' },
  { q: 'Telefonda çalışır mı?', a: 'Evet. Uygulama mobil uyumludur, telefonuna uygulama gibi kurulur (PWA) ve dükkanda tek elle kullanılır.' },
  { q: 'İnternet gerekir mi?', a: 'Evet, verilerin tüm cihazlarında güncel görünmesi için internet bağlantısı gerekir.' },
  { q: 'Kağıt defterimden nasıl geçerim?', a: 'Müşterilerini tek tek ekle, bugünden itibaren işlemleri gir. Eski borçları açılış bakiyesi olarak işleyebilirsin.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  useForceLightTheme();
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans scroll-smooth transition-colors">
      {/* Üst bar */}
      <header className="sticky top-0 z-40 border-b border-stone-200/70 dark:border-stone-800/70 bg-white/85 dark:bg-stone-950/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div
            className="w-[150px] sm:w-[180px] select-none [&>svg]:w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: logoRaw }}
          />
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-stone-500 dark:text-stone-400">
            <a href="#ozellikler" className="hover:text-amber-600 dark:hover:text-amber-400">Özellikler</a>
            <a href="#sektorler" className="hover:text-amber-600 dark:hover:text-amber-400">Sektörler</a>
            <a href="#nasil-calisir" className="hover:text-amber-600 dark:hover:text-amber-400">Nasıl Çalışır</a>
            <a href="#sss" className="hover:text-amber-600 dark:hover:text-amber-400">SSS</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-sm font-extrabold text-stone-700 dark:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Giriş Yap
            </button>
            <button
              type="button"
              onClick={onRegister}
              className="btn-primary px-3.5 sm:px-4 py-2 text-sm"
            >
              Ücretsiz Başla
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(900px 480px at 50% -8%, rgba(251,191,36,0.28), transparent 62%), radial-gradient(700px 420px at 110% 105%, rgba(245,158,11,0.14), transparent 60%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10 grid lg:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-black tracking-wide border border-amber-200 dark:border-amber-800/60">
              <Store className="w-3 h-3" /> ESNAFIN DİJİTAL DEFTERİ
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-[1.08] tracking-tight">
              Dükkanın cebinde,<br />
              <span className="text-amber-500">hesabın net.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-stone-500 dark:text-stone-400 font-medium max-w-lg">
              Kasa, veresiye, stok ve gün sonu tek panelde. Kağıt defteri kapat,
              dükkanını 2 dakikada dijitale taşı.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={onRegister} className="btn-primary px-6 py-3 text-[15px]">
                Ücretsiz Başla <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#ozellikler" className="btn px-6 py-3 text-[15px]">
                Özellikleri Gör
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-bold text-stone-500 dark:text-stone-400">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" /> Ücretsiz
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Şifreli
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> 2 dakikada kurulum
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
                <Smartphone className="w-3.5 h-3.5 text-amber-500" /> Telefona kurulur
              </span>
            </div>
          </div>

          {/* Hero görseli: panel önizlemesi (CSS mock) */}
          <div className="relative animate-fade-up" aria-hidden>
            <div className="card p-5 max-w-sm mx-auto rotate-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-stone-400">Bugünün Kasası</p>
              <p className="text-4xl font-black tracking-tight mt-1">₺12.450</p>
              <p className="text-xs font-bold text-emerald-600 mt-0.5">Net kar: ₺8.200</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs font-bold bg-stone-50 dark:bg-stone-800/60 rounded-lg px-3 py-2">
                  <span className="text-stone-500">Nakit giriş</span><span className="text-emerald-600">+₺6.300</span>
                </div>
                <div className="flex justify-between text-xs font-bold bg-stone-50 dark:bg-stone-800/60 rounded-lg px-3 py-2">
                  <span className="text-stone-500">Kart giriş</span><span className="text-emerald-600">+₺4.150</span>
                </div>
                <div className="flex justify-between text-xs font-bold bg-stone-50 dark:bg-stone-800/60 rounded-lg px-3 py-2">
                  <span className="text-stone-500">Gider</span><span className="text-rose-500">−₺2.000</span>
                </div>
              </div>
            </div>
            <div className="card px-4 py-3 absolute -left-1 sm:left-2 -bottom-5 -rotate-2 flex items-center gap-2.5 shadow-lg">
              <span className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center text-xs font-black">14:30</span>
              <span>
                <span className="block text-xs font-black">Randevu: Hasan Bey</span>
                <span className="block text-[11px] text-stone-400 font-bold">Saç + Sakal · Koltuk 2</span>
              </span>
            </div>
            <div className="card px-4 py-3 absolute -right-1 sm:right-2 -top-5 rotate-2 flex items-center gap-2.5 shadow-lg">
              <span className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black">!</span>
              <span>
                <span className="block text-xs font-black">Kritik stok: 3 ürün</span>
                <span className="block text-[11px] text-stone-400 font-bold">Un, şeker, çay bitiyor</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Nedir */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="card p-6 sm:p-10 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Dükkanım Yanımda nedir?</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">Kağıt defterin dijital karşılığı</h2>
            <p className="mt-3 text-sm sm:text-base text-stone-500 dark:text-stone-400 font-medium leading-relaxed">
              Küçük ve orta ölçekli dükkanların kasa hareketlerini, müşteri veresiyelerini,
              stoklarını ve gün sonu kapanışlarını takip etmesi için yapıldı. Her müşteri
              için ayrı hesap açılır, her işlem tarihiyle kaydedilir, bakiye anlık güncellenir.
              Akşam olunca kasayı sayarsın, farkı görürsün, günü kapatırsın.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm font-bold">
              {['Kurulum ya da teknik bilgi gerekmez', 'Telefon numaranla saniyeler içinde kayıt', 'Verilerin yalnızca sana ait, dilediğinde yedekle'].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { n: '5', t: 'Sektör paneli' },
              { n: '8', t: 'Ana modül' },
              { n: '3', t: 'Adımda kurulum' },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 p-4 sm:p-6">
                <p className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">{s.n}</p>
                <p className="mt-1 text-[11px] sm:text-xs font-bold text-stone-500 dark:text-stone-400">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section id="ozellikler" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 scroll-mt-20">
        <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 text-center">Özellikler</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-center">Esnafın ihtiyacı olan her şey</h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 font-medium text-center">Defter yerine telefon. Kalem yerine tek dokunuş.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card p-5">
                <span className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="mt-3 text-[15px] font-black">{f.title}</h3>
                <p className="mt-1.5 text-[13px] text-stone-500 dark:text-stone-400 font-medium leading-relaxed">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sektörler */}
      <section id="sektorler" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 scroll-mt-20">
        <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 text-center">Sektörel panel</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-center">Dükkanına göre şekillenir</h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 font-medium text-center">Dükkan tipini seç, panel o işe göre açılsın.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {SECTORS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="card p-5 text-center">
                <span className="mx-auto w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="mt-3 text-sm font-black">{s.title}</h3>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-medium">{s.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section id="nasil-calisir" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 scroll-mt-20">
        <div className="card p-6 sm:p-10">
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 text-center">Kullanım</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-center">3 adımda başla</h2>
          <div className="mt-8 grid sm:grid-cols-3 gap-6">
            {[
              { n: '1', t: 'Dükkanını kaydet', d: 'Telefon numaranla ücretsiz kayıt ol. Kredi kartı gerekmez.' },
              { n: '2', t: 'Dükkan tipini seç', d: 'Berber, kafe, bakkal, servis... Panel işine göre açılsın.' },
              { n: '3', t: 'İşi gir, günü kapat', d: 'Satışı ve gideri işle, akşam kasayı sayıp günü kapat.' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <span className="mx-auto w-11 h-11 rounded-full bg-amber-500 text-white text-lg font-black flex items-center justify-center">{s.n}</span>
                <h3 className="mt-3 text-[15px] font-black">{s.t}</h3>
                <p className="mt-1 text-[13px] text-stone-500 dark:text-stone-400 font-medium">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button type="button" onClick={onRegister} className="btn-primary px-8 py-3 text-[15px]">
              Hemen Dükkanını Aç <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 scroll-mt-20">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center">Sık sorulan sorular</h2>
        <div className="mt-6 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="card px-5 py-4 group">
              <summary className="flex items-center justify-between gap-3 text-sm font-black cursor-pointer list-none">
                {f.q}
                <ChevronDown className="w-4 h-4 shrink-0 text-stone-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-[13px] text-stone-500 dark:text-stone-400 font-medium leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA + footer */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <div className="rounded-3xl bg-stone-900 dark:bg-amber-500 text-white px-6 sm:px-10 py-10 sm:py-14 text-center relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(600px 300px at 50% 0%, rgba(251,191,36,0.35), transparent 65%)' }}
          />
          <h2 className="relative text-2xl sm:text-4xl font-black tracking-tight">Bugün başla,<br />yarın rahat et.</h2>
          <p className="relative mt-3 text-sm sm:text-base text-stone-300 dark:text-white/85 font-medium">Kurulum yok. Kredi kartı gerekmez. 2 dakikada hazır.</p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onRegister}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 dark:bg-stone-900 text-white text-[15px] font-black shadow-lg hover:bg-amber-600 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Ücretsiz Hesap Oluştur <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white/10 dark:bg-white/15 text-white text-[15px] font-black hover:bg-white/20 transition-colors cursor-pointer"
            >
              Giriş Yap
            </button>
          </div>
        </div>
        <footer className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400 dark:text-stone-500 font-semibold">
          <div
            className="w-[130px] select-none opacity-80 [&>svg]:w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: logoRaw }}
          />
          <p>© 2026 Dükkanım Yanımda · Esnaf için yapıldı</p>
        </footer>
      </section>
    </div>
  );
};
