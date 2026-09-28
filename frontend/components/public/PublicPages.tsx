import React, { useEffect } from 'react';
import logoRaw from '../../public/brand/logo-dukkanim.svg?raw';

// İletişim e-postası tek noktada. Değişirse sadece burası güncellenir.
export const CONTACT_EMAIL = 'omeryaman6@hotmail.com';
const CONTACT_MAILTO = 'mailto:omeryaman6@hotmail.com';

export type PublicRouteKey =
  | 'gizlilik'
  | 'iletisim'
  | 'kayit'
  | 'fiyat'
  | 'berber'
  | 'kafe-restoran'
  | 'bakkal-market'
  | 'teknik-servis'
  | 'hukuk'
  | 'terzi';

/** URL yolunu herkese açık sayfa anahtarına çevirir. Eşleşmezse null. */
export function matchPublicRoute(pathname: string): PublicRouteKey | null {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const key = clean.startsWith('/') ? clean.slice(1) : clean;
  switch (key) {
    case 'gizlilik':
    case 'gizlilik-politikasi':
      return 'gizlilik';
    case 'iletisim':
    case 'kayit':
    case 'fiyat':
    case 'berber':
    case 'kafe-restoran':
    case 'bakkal-market':
    case 'teknik-servis':
    case 'hukuk':
    case 'terzi':
      return key;
    case 'fiyatlandirma':
      return 'fiyat';
    case 'avukat':
      return 'hukuk';
    default:
      return null;
  }
}

interface ShellProps {
  title: string;
  onHome: () => void;
  onLogin: () => void;
  onRegister: () => void;
  children: React.ReactNode;
  ctaTitle?: string;
  ctaText?: string;
  ctaButton?: string;
  ctaHref?: string;
}

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/fiyat', label: 'Fiyat' },
  { href: '/kayit', label: 'Ücretsiz Kayıt' },
  { href: '/berber', label: 'Berber' },
  { href: '/kafe-restoran', label: 'Kafe & Restoran' },
  { href: '/bakkal-market', label: 'Bakkal & Market' },
  { href: '/teknik-servis', label: 'Teknik Servis' },
  { href: '/hukuk', label: 'Hukuk' },
  { href: '/terzi', label: 'Terzi' },
  { href: '/iletisim', label: 'İletişim' },
  { href: '/gizlilik', label: 'Gizlilik' },
];

const linkCls =
  'hover:text-amber-600 transition-colors';

function Shell({ title, onHome, onLogin, onRegister, children, ctaTitle, ctaText, ctaButton, ctaHref }: ShellProps) {
  useEffect(() => {
    document.title = `${title} · Dükkanım Yanımda`;
  }, [title]);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans scroll-smooth flex flex-col">
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); onHome(); }}
            className="w-[150px] sm:w-[180px] select-none [&>svg]:w-full [&>svg]:h-auto"
            aria-label="Dükkanım Yanımda ana sayfa"
            dangerouslySetInnerHTML={{ __html: logoRaw }}
          />
          <nav className="hidden lg:flex items-center gap-5 text-sm font-bold text-stone-500">
            {NAV_LINKS.slice(1, 6).map((l) => (
              <a key={l.href} href={l.href} className={linkCls}>{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogin}
              className="px-4 py-2 rounded-xl text-sm font-black text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={onRegister}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-black shadow hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Ücretsiz Başla
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {children}

        <div className="mt-12 rounded-3xl bg-stone-900 text-white px-6 sm:px-10 py-10 text-center relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(600px 300px at 50% 0%, rgba(251,191,36,0.35), transparent 65%)' }}
          />
          <h2 className="relative text-2xl sm:text-3xl font-black tracking-tight">{ctaTitle || 'Bugün başla, yarın rahat et.'}</h2>
          <p className="relative mt-3 text-sm sm:text-base text-stone-300 font-medium">{ctaText || 'Kurulum yok. Kredi kartı gerekmez. 2 dakikada hazır.'}</p>
          {ctaHref ? (
            <a
              href={ctaHref}
              className="relative mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 text-white text-[15px] font-black shadow-lg hover:bg-amber-600 transition-colors"
            >
              {ctaButton || 'Ücretsiz Hesap Oluştur'}
            </a>
          ) : (
            <button
              type="button"
              onClick={onRegister}
              className="relative mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 text-white text-[15px] font-black shadow-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              {ctaButton || 'Ücretsiz Hesap Oluştur'}
            </button>
          )}
        </div>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center gap-4">
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-bold text-stone-500">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className={linkCls}>{l.label}</a>
            ))}
          </nav>
          <p className="text-xs text-stone-400 font-semibold">© 2026 Dükkanım Yanımda · Esnaf için yapıldı</p>
        </div>
      </footer>
    </div>
  );
}

function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{children}</h1>;
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[15px] leading-relaxed text-stone-600 font-medium">{children}</p>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xl sm:text-2xl font-black tracking-tight">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-stone-600 font-medium">{children}</p>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2 text-sm text-stone-700 font-semibold">
          <span aria-hidden className="mt-1 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          {t}
        </li>
      ))}
    </ul>
  );
}

interface PageProps {
  onHome: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

function GizlilikPage(props: PageProps) {
  return (
    <Shell title="Gizlilik Politikası" {...props}>
      <H1>Gizlilik Politikası</H1>
      <Lead>
        Dükkanım Yanımda, esnafın kasa, veresiye, stok ve gün sonu kayıtlarını tuttuğu bir
        yönetim panelidir. Bu sayfa hangi verileri topladığımızı ve nasıl koruduğumuzu açıklar.
        Son güncelleme: 27 Eylül 2026.
      </Lead>
      <H2>Topladığımız veriler</H2>
      <P>
        Kayıt olurken dükkan adı, adınız ve telefon numaranızı alırız. Şifreniz asla açık
        şekilde saklanmaz; güvenli özet (scrypt) olarak tutulur. Uygulama içinde girdiğiniz
        müşteri, ürün, işlem ve randevu kayıtları yalnızca sizin dükkanınıza aittir.
      </P>
      <H2>Verilerin kullanımı</H2>
      <P>
        Verileriniz yalnızca size hizmet sunmak için kullanılır: giriş yapmanız, kayıtlarınızı
        tüm cihazlarınızda görmeniz ve yedek almanız. Verilerinizi üçüncü kişilerle paylaşmıyor,
        satmıyor ve reklam için kullanmıyoruz.
      </P>
      <H2>Güvenlik ve yedekleme</H2>
      <P>
        Bağlantı şifreli (HTTPS) sunulur. Oturumlar 30 gün geçerlidir, dilediğinizde çıkış
        yapabilirsiniz. Kayıtlarınız her gece otomatik yedeklenir; ayrıca tek dosyada yedek
        indirip saklayabilirsiniz.
      </P>
      <H2>Çerezler</H2>
      <P>
        Giriş oturumunuzu hatırlamak ve tema tercihinizi saklamak için tarayıcınızda küçük
        veriler tutarız. Reklam veya takip çerezi kullanmıyoruz.
      </P>
      <H2>Haklarınız</H2>
      <P>
        Verilerinizi görme, düzeltme ve hesabınızı silme hakkına sahipsiniz. Talepleriniz için
        bize yazmanız yeterli: <a className="text-amber-700 font-bold" href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>
      </P>
    </Shell>
  );
}

function IletisimPage(props: PageProps) {
  return (
    <Shell
      title="İletişim"
      ctaTitle="Konuşalım, dükkanını birlikte dijitale taşıyalım."
      ctaText="Önce e-postayla yaz, aynı gün dönelim. Hesabın varsa dükkan adını ekle."
      ctaButton="E-postayla Yaz"
      ctaHref={CONTACT_MAILTO}
      {...props}
    >
      <H1>İletişim</H1>
      <Lead>
        Sorun bildirimi, özellik önerisi veya VIP hakkında soru — hepsi için tek adres
        var. Yaz, genelde aynı gün içinde dönelim.
      </Lead>
      <div className="mt-8 rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-stone-400">E-posta ile yaz</p>
        <a
          href={CONTACT_MAILTO}
          className="mt-2 inline-block text-lg sm:text-xl font-black text-amber-700 hover:text-amber-800 break-all"
        >
          {CONTACT_EMAIL}
        </a>
        <div className="mt-5">
          <a
            href={`${CONTACT_MAILTO}?subject=${encodeURIComponent('Dükkanım Yanımda — destek talebi')}&body=${encodeURIComponent('Dükkan adı:\nTelefon:\nSorun/öneri:\n')}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white text-sm font-black shadow hover:bg-amber-600 transition-colors"
          >
            E-postayı Şimdi Aç
          </a>
        </div>
        <p className="mt-4 text-sm text-stone-500 font-medium">
          Konu ve dükkan adın hazır gelir — sen sadece sorunu yazarsın.
        </p>
      </div>
      <H2>Yazmadan önce hızlı cevaplar</H2>
      <div className="mt-4 space-y-3">
        {[
          { q: 'Şifremi unuttum, ne yapmalıyım?', a: 'Şu an şifre sıfırlama e-postayla yapılıyor: kayıtlı telefon numaranı yaz, hesabını doğrulayıp yeni şifre oluşturalım.' },
          { q: 'Verilerim silinir mi?', a: 'Hayır. Kayıtların her gece otomatik yedeklenir, ayrıca tek dosyada yedek indirip saklayabilirsin. Hesabını silmemizi istersen e-postayla bildirmen yeterli.' },
          { q: 'VIP ücreti ne zaman başlıyor?', a: 'Lansman bitmeden duyurulacak. Şimdiden katılanlar lansman boyunca ücret ödemez, fiyat sayfasındaki ₺149/ay bilgisi şimdiden belli olsun diye yazıyor.' },
          { q: 'Hangi telefonda çalışır?', a: 'Tarayıcısı olan her telefonda: Android, iPhone fark etmez. Ana ekrana ekleyince uygulama gibi açılır.' },
        ].map((f) => (
          <div key={f.q} className="rounded-2xl bg-white border border-stone-200 p-5">
            <p className="text-sm font-black">{f.q}</p>
            <p className="mt-1.5 text-sm text-stone-600 font-medium leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

const VIP_FREE = [
  'Kasa ve gün sonu (nakit, kart, havale)',
  'Veresiye defteri ve müşteri cari kartları',
  'Stok takibi ve kritik stok uyarısı',
  'Sektör paneli (randevu, masa, servis fişi, dava, emanet)',
  'Kasiyer modu ve çalışan yetkisi',
  'Tek dosya yedekleme ve geri yükleme',
];

const VIP_PAID = [
  'Borç Toplama ekranı: bekleyen alacağı tek listede gör, toplu WhatsApp turuyla sırayla gönder',
  'Yapay Zeka Danışman: ciro, gider ve vitrin için dükkanına özel tavsiyeler',
  'AI hatırlatma metinleri: her müşteriye uygun tonda hazır mesaj',
  'Öncelikli destek: sorunda sıra beklemeden yardım',
  'Yakında: haftalık Patron Raporu (PDF) ve muhasebeciye tek tık dosya',
];

function FiyatPage(props: PageProps) {
  const { onRegister } = props;
  return (
    <Shell title="VIP Paketler" {...props}>
      <H1>Dükkanına göre paket seç</H1>
      <Lead>
        Temel defter her zaman ücretsiz. Paraya dönüşen işler — borcu toplamak,
        gideri kısmak, ciroyu artırmak — VIP'de. Lansman döneminde VIP de ücretsiz,
        kart istemeyiz.
      </Lead>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 items-stretch">
        {/* Çırak */}
        <div className="rounded-3xl bg-white border border-stone-200 p-6 sm:p-7 shadow-sm flex flex-col">
          <p className="text-xs font-black uppercase tracking-widest text-stone-400">Çırak</p>
          <p className="mt-2 text-4xl font-black tracking-tight">₺0 <span className="text-base font-bold text-stone-400">/ hep ücretsiz</span></p>
          <p className="mt-2 text-[13px] font-semibold text-stone-500">Kağıt defteri dijitale taşıyan temel panel.</p>
          <ul className="mt-4 space-y-2 flex-1">
            {VIP_FREE.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-stone-700 font-semibold">
                <span aria-hidden className="mt-1.5 w-2 h-2 rounded-full bg-stone-300 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onRegister}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-stone-200 hover:border-amber-500 hover:text-amber-700 text-stone-700 text-[15px] font-black transition-colors cursor-pointer"
          >
            Ücretsiz Başla
          </button>
        </div>

        {/* Usta VIP */}
        <div className="relative rounded-3xl bg-stone-900 text-white p-6 sm:p-7 shadow-xl overflow-hidden flex flex-col">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(500px 260px at 50% 0%, rgba(251,191,36,0.35), transparent 65%)' }}
          />
          <div className="relative flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-amber-400">Usta · VIP</p>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-stone-900">LANSMANDA ÜCRETSİZ</span>
          </div>
          <p className="relative mt-2 text-4xl font-black tracking-tight">
            ₺149 <span className="text-base font-bold text-stone-400">/ ay</span>
          </p>
          <p className="relative mt-2 text-[13px] font-semibold text-stone-300">
            Borcunu toplayan, kârını artıran araçlar. Şimdi katıl, lansman boyunca ücret ödeme.
          </p>
          <ul className="relative mt-4 space-y-2 flex-1">
            {VIP_PAID.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-stone-100 font-semibold">
                <span aria-hidden className="mt-1 w-4 h-4 rounded-full bg-amber-500 text-stone-900 text-[10px] font-black flex items-center justify-center shrink-0">✓</span>
                {t}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onRegister}
            className="relative mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 text-white text-[15px] font-black shadow-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            VIP ile Başla
          </button>
          <p className="relative mt-2.5 text-center text-[11px] font-semibold text-stone-400">
            Kredi kartı gerekmez · İstediğinde tek tıkla çık
          </p>
        </div>
      </div>

      <H2>Sektörüne göre VIP ne kazandırır?</H2>
      <P>
        Her dükkanın parası farklı yerde takılıyor. VIP, senin sektöründeki
        tıkanıklığı çözen araçları öne çıkarır:
      </P>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { h: '/berber', t: 'Berber & Kuaför', d: '“Yarın uğrarım” diyenlerin borcunu toplu turla topla, ölü günlere AI ile kampanya günü koy.' },
          { h: '/kafe-restoran', t: 'Kafe & Restoran', d: 'Açık masa ve abonman bakiyelerini büyükten küçüğe diz, happy-hour saatlerini AI ile bul.' },
          { h: '/bakkal-market', t: 'Bakkal & Market', d: 'Mahallenin veresiyesini tek listede gör, kapı kapı dolaşmadan kibar hatırlatmayla tahsil et.' },
          { h: '/teknik-servis', t: 'Teknik Servis', d: 'Teslim edip ücreti alınmamış işleri biriktirme; en kârlı iş tipini AI raporunda gör.' },
          { h: '/hukuk', t: 'Hukuk & Avukat', d: 'Ödenmemiş müvekkil alacaklarını resmi tonda hatırlat, avans politikanı AI ile düzenle.' },
          { h: '/terzi', t: 'Terzi', d: 'Teslim edip ücreti kalmış emanetleri toplu turla kapat, yoğun günlere randevu yay.' },
        ].map((c) => (
          <a key={c.h} href={c.h} className="rounded-2xl bg-white border border-stone-200 p-5 hover:border-amber-400 hover:shadow-md transition-all">
            <p className="text-sm font-black text-amber-700">{c.t}</p>
            <p className="mt-1.5 text-[13px] text-stone-600 font-medium leading-relaxed">{c.d}</p>
          </a>
        ))}
      </div>

      <H2>Neden VIP?</H2>
      <P>
        Esnafın paraya dönüşen 3 şeyi var: geciken borcu toplamak, gideri kısmak,
        ciroyu artırmak. Borç Toplama ekranı en büyük alacağı en üste koyar,
        toplu turla tek tek WhatsApp'tan gönderirsin. Yapay Zeka Danışman da
        dükkanının cirosuna ve giderine bakıp sana özel tavsiye verir.
      </P>
      <H2>Ödeme nasıl olacak?</H2>
      <P>
        Lansman bitmeden online ödeme açılacak. Şimdiden katılanlar ilk aydan
        yararlanır, kart bilgisi alınmaz. Soruların için{' '}
        <a className="text-amber-700 font-bold" href="/iletisim">iletişim</a> sayfasından yazman yeterli.
      </P>
    </Shell>
  );
}

function KayitPage(props: PageProps) {
  const { onRegister } = props;
  return (
    <Shell title="Ücretsiz Kayıt" {...props}>
      <H1>2 dakikada dükkanını kur</H1>
      <Lead>
        Kredi kartı yok, kurulum yok, sözleşme yok. Telefon numaranla kaydol, dükkan adını
        yaz, defterin açılsın. Kasa, veresiye ve stok temel özellikleri ücretsiz.
      </Lead>
      <Bullets
        items={[
          '1. Telefon numaran ve şifrenle hesap oluştur',
          '2. Dükkan adını yaz, sektörünü seç (berber, kafe, bakkal, servis...)',
          '3. İlk müşterini veya ürününü ekle, bugünden işlemeye başla',
        ]}
      />
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onRegister}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 text-white text-base font-black shadow-lg hover:bg-amber-600 transition-colors cursor-pointer"
        >
          Hemen Ücretsiz Kaydol
        </button>
        <p className="mt-3 text-xs text-stone-400 font-semibold">Zaten hesabın var mı? Yukarıdan giriş yap.</p>
      </div>
      <H2>Kağıt defterden geçenler için</H2>
      <P>
        Eski borçları tek tek işlemene gerek yok; her müşteriye açılış bakiyesi olarak
        girebilirsin. Bugünden sonraki her satış, tahsilat ve gider otomatik işlenir.
        Gün sonunda kasayı say, farkı gör, günü kapat.
      </P>
    </Shell>
  );
}

interface SectorDef {
  title: string;
  intro: string;
  bullets: string[];
  modules: string[];
  vip: string;
  faq: { q: string; a: string }[];
  closing: string;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
}

const SECTORS: Record<string, SectorDef> = {
  berber: {
    title: 'Berber ve Kuaför Programı',
    intro:
      'Randevu defteri, koltuk sırası ve gün sonu kasası tek ekranda. Kağıt ajandayı bırak: müşteri aradığında boş saati anında gör, koltuğa oturt, çıkarken ücreti kasaya işle. No-show yüzünden boş kalan koltuk tarihe karışır.',
    bullets: [
      'Randevu takvimi: günün randevuları, bekleyenler ve koltuktakiler ayrı listede',
      'Hizmet tarifesi: saç, sakal, cilt bakımı fiyatları tek tıkla satışa dönüşür',
      'Müşteri kartı: telefon, tıraş notu ve geçmiş işlemler tek dokunuşla önde',
      '“Sonra verir” diyenin borcu veresiye defterine işlenir, ay sonunda tek liste',
      'Usta/çırak ayrımı: kasiyere kısıtlı yetki, ayarlara dokunamaz',
      'Gün sonu özeti: koltuk başına ciro, gider ve net kazanç akşam tek bakışta',
    ],
    modules: ['Randevu Takvimi', 'Hizmet Tarifesi', 'Veresiye Defteri', 'Borç Toplama', 'Kasiyer Modu', 'Gün Sonu'],
    vip:
      'Koltuk boş kalmasın: Borç Toplama ekranı “abi yarın uğrarım” diyenlerin listesini önüne koyar, toplu turla hepsine WhatsApp hatırlatması gönderirsin. AI Danışman hangi günlerin ölü geçtiğini görüp kampanya günü önerir.',
    faq: [
      { q: 'Randevuyu müşteri kendisi alabiliyor mu?', a: 'Şimdilik randevuyu sen giriyorsun; telefonla arayan müşteriyi 10 saniyede takvime işlersin. Online müşteri randevusu yol haritasında.' },
      { q: 'Birden fazla koltuk/usta var, olur mu?', a: 'Olur. Her ustaya kasiyer hesabı açarsın, kendi satışını girer; kasanın tamamını sadece sen görürsün.' },
    ],
    closing:
      'Tek koltuklu dükkandan çok ustalı salona kadar aynı panel çalışır. Akşam kasayı say, farkı gör, günü kapat.',
    ctaTitle: 'Koltukların dolsun, defterin kendiliğinden tutulsun.',
    ctaText: 'İlk randevunu 2 dakikada gir. Kredi kartı gerekmez.',
    ctaButton: 'Berber Panelini Aç',
  },
  'kafe-restoran': {
    title: 'Kafe ve Restoran Adisyon Takibi',
    intro:
      'Masa adisyonları, açık hesaplar ve hızlı kapatma tek panelde. Garson masayı açar, ürünleri ekler; kasa tek tuşla kapatır. Yoğun saatte “o masa ödedi mi?” kaosu biter, gecenin sonunda hangi masa ne bıraktı hepsi kayıtlı.',
    bullets: [
      'Masa görünümü: dolu, boş ve hesabı açık masalar renkleriyle belli',
      'Adisyona hızlı ürün ekleme, tek tuşla kapatma ve tahsilat',
      'Abonman takibi: öğretmen/esnaf öğle yemeği hesapları ayrı defterde',
      'Personel satışları kasiyere zimmetli, açıklar anında görünür',
      'Tedarikçi borcu (et, süt, içecek toptancısı) vadeleriyle kayıtlı',
      'Gün sonu: masa cirosu, gider ve kasa farkı otomatik hesaplanır',
    ],
    modules: ['Masa Adisyon', 'Hızlı Satış', 'Abonman Defteri', 'Tedarikçi Borcu', 'Personel Zimmeti', 'Gün Sonu'],
    vip:
      'Açık hesaplar birikmesin: Borç Toplama ekranı abonman ve açık masa bakiyelerini en büyükten dizer, toplu turla tahsilata çıkarsın. AI Danışman ölü saatlere happy-hour, yavaş ürünlere menü önerisi verir.',
    faq: [
      { q: 'Garson telefondan kullanabilir mi?', a: 'Evet. Panel mobil uyumlu; garsona kasiyer yetkisi verirsin, sadece satış ve adisyon açar, ayarları göremez.' },
      { q: 'Paket servis ve gel-al ayrı mı?', a: 'Masadan bağımsız hızlı satış fişi kesersin; hepsi aynı gün sonu cirosuna akar.' },
    ],
    closing:
      'Yoğun saatte tek elle kullanılacak kadar sade; telefondan da kasadan da aynı defter görünür.',
    ctaTitle: 'Masalar dönsün, hesaplar şaşmasın.',
    ctaText: 'İlk masanı şimdi aç, adisyonu dijitale taşı.',
    ctaButton: 'Kafe Panelini Aç',
  },
  'bakkal-market': {
    title: 'Bakkal ve Market Veresiye Defteri',
    intro:
      'Mahallenin veresiye defteri artık cebinde. Kim ne aldı, ne ödedi, kalan borç ne — tartışma biter. Barkodlu üründe stok kendiliğinden düşer, biten ürün (un, şeker, çay) kritik uyarıyla önüne gelir.',
    bullets: [
      'Müşteri cari kartı: borç, ödeme geçmişi ve tek tuşla tahsilat',
      'Barkod ve kategori ile tezgahta 3 saniyede ürün bulma',
      'Kritik stok uyarısı: biten ürün gözünden kaçmaz, toptancıya liste hazır',
      'Veresiye satış kasadan düşer, tahsilat günü kasaya eklenir — kasa hep tutar',
      'WhatsApp hatırlatma: geciken ödemeye kibar mesaj tek dokunuşla',
      'Ay sonu tek liste: kim ne kadar borçlu, kim düzenli ödüyor',
    ],
    modules: ['Veresiye Defteri', 'Barkod & Stok', 'Kritik Stok Uyarısı', 'Borç Toplama', 'WhatsApp Hatırlatma', 'Gün Sonu'],
    vip:
      'Ay sonu kapı kapı dolaşma: Borç Toplama ekranı mahallenin borcunu büyükten küçüğe dizer, toplu turla herkese kibar hatırlatma gider. Düzenli ödeyenleri görür, veresiye limitini ona göre açarsın.',
    faq: [
      { q: 'Eski defterdeki borçları nasıl aktarırım?', a: 'Her müşteriye açılış bakiyesi olarak girersin, 5 dakika sürer. Bugünden sonraki her işlem otomatik işlenir.' },
      { q: 'Borç limiti koyabiliyor muyum?', a: 'Müşteri notuna limiti yazıp takip edersin; limit aşım uyarısı yol haritasında, önce Borç Toplama ile tahsilatı hızlandırırsın.' },
    ],
    closing:
      'Eski borçları açılış bakiyesi olarak gir, bugünden itibaren her işlem deftere işlensin.',
    ctaTitle: 'Veresiye defterin artık kavga çıkarmasın.',
    ctaText: 'Mahalleni kaydet, ilk borcu şimdi işle.',
    ctaButton: 'Bakkal Panelini Aç',
  },
  'teknik-servis': {
    title: 'Teknik Servis Takip Programı',
    intro:
      'Cihaz kabul fişinden teslimata kadar her iş kayıt altında. “Benim telefon ne oldu?” sorusuna cevap aramakla uğraşma; fiş numarasından durumu anında söyle. Parça maliyeti fişe işlenir, her işin kârı net görünür.',
    bullets: [
      'Servis fişi: müşteri, cihaz, arıza notu ve durum takibi (bekliyor → işlemde → hazır → teslim)',
      'Parça + işçilik maliyetini fişe işle, iş başına kârı gör',
      'Teslimde tek tuşla tahsilat, tutar gün sonu cirosuna otomatik eklenir',
      'Bekleyen cihaz listesi: rafta unutulan iş kalmaz',
      'Müşteri kartı: eski arızalar ve “kronik sorunlu” notları önde',
      'Garanti/söz takibi notlarla fişe bağlı',
    ],
    modules: ['Servis Fişi', 'Durum Takibi', 'Parça Maliyeti', 'Veresiye Defteri', 'Borç Toplama', 'Gün Sonu'],
    vip:
      'Alacaklar rafta beklemesin: teslim edip ödemesini almadıkların Borç Toplama listesinde birikir, toplu turla “cihazınız hazır, ücreti bekliyoruz” mesajı gider. AI Danışman en kârlı iş tipini (ekran mı, batarya mı?) gösterir.',
    faq: [
      { q: 'Fiş numarası otomatik mi?', a: 'Evet, her kabul fişi numaralı açılır; müşteri sorduğunda numaradan 5 saniyede bulursun.' },
      { q: 'Parça stoğu tutuyor mu?', a: 'Ürün stoğuna ekran, batarya gibi parçaları eklersin; kritik seviyeye düşünce uyarı alırsın.' },
    ],
    closing:
      'Telefoncu, bilgisayarcı, beyaz eşya servisi: cihazı al, fişi kes, durumu güncelle, teslim et. Hepsi 2 dakikada.',
    ctaTitle: 'Raftaki her cihazın durumu cebinde olsun.',
    ctaText: 'İlk kabul fişini şimdi kes.',
    ctaButton: 'Servis Panelini Aç',
  },
  hukuk: {
    title: 'Avukat ve Hukuk Bürosu Programı',
    intro:
      'Dava dosyaları, müvekkil cari hesapları ve duruşma hatırlatmaları tek panelde. Klasör karışıklığı bitsin: dosya numarasından davayı, müvekkilden alacağı anında gör. Duruşma günü sürprizi tarihe karışır.',
    bullets: [
      'Dava dosyası: müvekkil, karşı taraf, mahkeme ve duruşma tarihi takibi',
      'Duruşma takvimi: yaklaşan celseler otomatik listede, kaçırma yok',
      'Müvekkil cari kartı: alınan avans, kalan alacak ve tahsilat kaydı',
      'Vekalet ücreti + masraf kalemleri dosya bazında kayıtlı',
      'Danışmanlık saati takibi: saatlik işlerin karşılığı defterde',
      'Dosya notları: her celse çıkışı 1 dakikada not düş',
    ],
    modules: ['Dava Dosyası', 'Duruşma Takvimi', 'Müvekkil Cari Hesabı', 'Borç Toplama', 'Hatırlatmalar', 'Gün Sonu'],
    vip:
      'Vekalet ücreti peşinde koşma: ödenmemiş müvekkil alacakları Borç Toplama ekranında birikir, toplu turla resmi tonda hatırlatma gönderirsin. AI Danışman tahsilat sırası ve avans politikası önerir.',
    faq: [
      { q: 'Baro/e-imza entegrasyonu var mı?', a: 'Henüz yok; burası büronun iç defteri: dosya, duruşma ve para takibi. UYAP işlerin aynen orada yürür.' },
      { q: 'Müvekkil gizliliği nasıl korunuyor?', a: 'Veriler şifreli bağlantıyla taşınır, şifren özet olarak saklanır. Hesabını kimseyle paylaşma, kasiyere gerek yoksa açma.' },
    ],
    closing:
      'Tek avukatlık bürodan çok ortaklı ofise kadar aynı defter çalışır. Müvekkil aradığında dosyayı saniyede aç.',
    ctaTitle: 'Dosyan da alacağın da tek ekranda olsun.',
    ctaText: 'İlk dava dosyanı şimdi aç.',
    ctaButton: 'Hukuk Panelini Aç',
  },
  terzi: {
    title: 'Terzi Emanet ve Sipariş Takibi',
    intro:
      'Emanet fişinden teslimata kadar her iş kayıt altında. “Benim pantolon ne oldu?” sorusu tarih olur; fişten durumu ve teslim gününü anında söyle. Teslim günü gelen müşteri kasaya ücret bırakır, defter kendiliğinden tutulur.',
    bullets: [
      'Emanet fişi: müşteri, ürün, tadilat notu ve teslim tarihi',
      'Durum takibi: bekliyor → işlemde → hazır → teslim edildi',
      'Ölçü ve model notları müşteri kartında saklı, her seferinde yeniden alma',
      'Teslimde tek tuşla tahsilat, gün sonu cirosuna otomatik eklenir',
      'Geciken teslimler ayrı listede: “yarın düğünü var” acelesi kaçmaz',
      'Sezon işleri (perde, ütü paketi) toplu fişle hızlı giriş',
    ],
    modules: ['Emanet Fişi', 'Teslim Takvimi', 'Ölçü Kartı', 'Veresiye Defteri', 'Borç Toplama', 'Gün Sonu'],
    vip:
      '“Sonra öderim”ler birikmesin: teslim edip ücreti alınmamış işler Borç Toplama listesine düşer, toplu turla kibar hatırlatma gider. AI Danışman yoğun günlere randevu yayma ve fiyat güncelleme önerir.',
    faq: [
      { q: 'Ölçüleri her seferinde mi gireceğim?', a: 'Hayır. Ölçü bir kez müşteri kartına yazılır, sonraki fişlerde otomatik önünde olur.' },
      { q: 'Kuru temizleme fişleri de olur mu?', a: 'Olur, aynı emanet mantığı: al, fişi kes, hazır olunca teslim et ve tahsilatı işle.' },
    ],
    closing:
      'Tadilat ve dikim işleri karışmaz: al, fişi kes, durumu güncelle, gününde teslim et.',
    ctaTitle: 'Emanetler karışmasın, teslim günü şaşmasın.',
    ctaText: 'İlk emanet fişini şimdi kes.',
    ctaButton: 'Terzi Panelini Aç',
  },
};

function SectorPage({ route, ...props }: PageProps & { route: 'berber' | 'kafe-restoran' | 'bakkal-market' | 'teknik-servis' | 'hukuk' | 'terzi' }) {
  const s = SECTORS[route];
  return (
    <Shell
      title={s.title}
      ctaTitle={s.ctaTitle}
      ctaText={s.ctaText}
      ctaButton={s.ctaButton}
      {...props}
    >
      <H1>{s.title}</H1>
      <Lead>{s.intro}</Lead>

      <div className="mt-6 flex flex-wrap gap-2">
        {s.modules.map((m) => (
          <span key={m} className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
            {m}
          </span>
        ))}
      </div>

      <H2>Bu panelde neler var?</H2>
      <Bullets items={s.bullets} />

      <div className="mt-8 rounded-2xl bg-stone-900 text-white p-6 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(500px 240px at 50% 0%, rgba(251,191,36,0.3), transparent 65%)' }}
        />
        <p className="relative text-xs font-black uppercase tracking-widest text-amber-400">VIP ile ne kazanırsın?</p>
        <p className="relative mt-2 text-sm leading-relaxed text-stone-200 font-medium">{s.vip}</p>
        <a href="/fiyat" className="relative mt-4 inline-block px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 transition-colors">
          VIP Paketlere Bak
        </a>
      </div>

      <H2>Merak edilenler</H2>
      {s.faq.map((f) => (
        <div key={f.q} className="mt-4 rounded-2xl bg-white border border-stone-200 p-5">
          <p className="text-sm font-black">{f.q}</p>
          <p className="mt-1.5 text-sm text-stone-600 font-medium leading-relaxed">{f.a}</p>
        </div>
      ))}

      <H2>Neden Dükkanım Yanımda?</H2>
      <P>{s.closing}</P>
      <P>
        Diğer sektörlerde de çalışır: <a className="text-amber-700 font-bold" href="/berber">berber</a>,{' '}
        <a className="text-amber-700 font-bold" href="/kafe-restoran">kafe &amp; restoran</a>,{' '}
        <a className="text-amber-700 font-bold" href="/bakkal-market">bakkal &amp; market</a>,{' '}
        <a className="text-amber-700 font-bold" href="/teknik-servis">teknik servis</a>,{' '}
        <a className="text-amber-700 font-bold" href="/hukuk">hukuk</a>,{' '}
        <a className="text-amber-700 font-bold" href="/terzi">terzi</a> — hepsi aynı hesapta,
        sektörünü dilediğinde değiştirebilirsin.
      </P>
    </Shell>
  );
}

export function PublicPage({
  route,
  onHome,
  onLogin,
  onRegister,
}: {
  route: PublicRouteKey;
  onHome: () => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  const props = { onHome, onLogin, onRegister };
  switch (route) {
    case 'gizlilik':
      return <GizlilikPage {...props} />;
    case 'iletisim':
      return <IletisimPage {...props} />;
    case 'kayit':
      return <KayitPage {...props} />;
    case 'fiyat':
      return <FiyatPage {...props} />;
    case 'berber':
    case 'kafe-restoran':
    case 'bakkal-market':
    case 'teknik-servis':
    case 'hukuk':
    case 'terzi':
      return <SectorPage route={route} {...props} />;
  }
}
