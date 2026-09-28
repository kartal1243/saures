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
    case 'fiyatlandirma':
    case 'berber':
    case 'kafe-restoran':
    case 'bakkal-market':
    case 'teknik-servis':
    case 'hukuk':
    case 'avukat':
      return 'hukuk';
    case 'terzi':
      return key;
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

function Shell({ title, onHome, onLogin, onRegister, children }: ShellProps) {
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
          <h2 className="relative text-2xl sm:text-3xl font-black tracking-tight">Bugün başla, yarın rahat et.</h2>
          <p className="relative mt-3 text-sm sm:text-base text-stone-300 font-medium">Kurulum yok. Kredi kartı gerekmez. 2 dakikada hazır.</p>
          <button
            type="button"
            onClick={onRegister}
            className="relative mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 text-white text-[15px] font-black shadow-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Ücretsiz Hesap Oluştur
          </button>
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
    <Shell title="İletişim" {...props}>
      <H1>İletişim</H1>
      <Lead>
        Sorunuz, öneriniz veya bir sorun bildiriminiz mi var? Bize e-posta ile ulaşın,
        genelde aynı gün içinde dönüş yaparız.
      </Lead>
      <div className="mt-8 rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-stone-400">E-posta</p>
        <a
          href={CONTACT_MAILTO}
          className="mt-2 inline-block text-lg sm:text-xl font-black text-amber-700 hover:text-amber-800 break-all"
        >
          {CONTACT_EMAIL}
        </a>
        <p className="mt-4 text-sm text-stone-500 font-medium">
          Yazarken dükkan adınızı eklemeyi unutmayın, size daha hızlı yardımcı olalım.
        </p>
      </div>
      <H2>Sık sorulanlar</H2>
      <P>
        Kayıt, veri güvenliği ve telefonda kullanım hakkında hızlı cevaplar için ana
        sayfadaki sık sorulan sorular bölümüne göz atın. Hesabınızla ilgili işlemleri
        (şifre değiştirme, çalışan yetkisi, yedek indirme) uygulama içinden yapabilirsiniz.
      </P>
    </Shell>
  );
}

function FiyatPage(props: PageProps) {
  const { onRegister } = props;
  const items = [
    'Kasa ve gün sonu (nakit, kart, havale)',
    'Veresiye defteri ve müşteri cari kartları',
    'Stok takibi ve kritik stok uyarısı',
    'Sektör paneli (randevu, masa, servis fişi, dava, emanet)',
    'Kasiyer modu ve çalışan yetkisi',
    'WhatsApp hatırlatma mesajı',
    'Tek dosya yedekleme ve geri yükleme',
  ];
  return (
    <Shell title="Fiyatlandırma" {...props}>
      <H1>Fiyatlandırma</H1>
      <Lead>
        Lansman döneminde tüm temel özellikler ücretsiz. Kredi kartı istemeyiz,
        sözleşme yoktur. İleride ekip ve çok şubeli kullanım için uygun fiyatlı
        planlar gelecek; erken katılanlar avantajlı olacak.
      </Lead>
      <div className="mt-8 rounded-3xl bg-white border border-stone-200 p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-amber-600">Başlangıç</p>
        <p className="mt-2 text-4xl font-black tracking-tight">₺0 <span className="text-base font-bold text-stone-400">/ ücretsiz</span></p>
        <Bullets items={items} />
        <button
          type="button"
          onClick={onRegister}
          className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 text-white text-base font-black shadow-lg hover:bg-amber-600 transition-colors cursor-pointer"
        >
          Hemen Ücretsiz Başla
        </button>
      </div>
      <H2>İleride ne olacak?</H2>
      <P>
        Tek dükkan kullanımı ücretsiz kalacak şekilde planlıyoruz. Çok şubeli yapı,
        toplu SMS/e-posta ve muhasebe entegrasyonları ücretli eklenti olabilir.
        Fiyat değişmeden önce mevcut kullanıcılara önceden haber verilir.
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
  closing: string;
}

const SECTORS: Record<string, SectorDef> = {
  berber: {
    title: 'Berber ve Kuaför Programı',
    intro:
      'Randevu defteri, koltuk sırası ve gün sonu kasası tek ekranda. Kağıt ajandayı bırak: müşteri aradığında boş saati anında gör, koltuğa oturt, çıkarken ücreti kasaya işle.',
    bullets: [
      'Randevu takvimi: günün randevuları, bekleyenler ve koltuktakiler ayrı listede',
      'Müşteri kartı: telefon, not ve geçmiş işlemler tek dokunuşla önde',
      'Veresiye takibi: “sonra verir” diyen müşterinin borcu deftere işlenir',
      'Gün sonu özeti: ciro, gider ve net kazanç akşam tek bakışta',
    ],
    closing:
      'Tek koltuklu dükkandan çok ustalı salona kadar aynı panel çalışır. Çalışanına kasiyer yetkisi ver, ayarlara dokunamasın.',
  },
  'kafe-restoran': {
    title: 'Kafe ve Restoran Adisyon Takibi',
    intro:
      'Masa adisyonları, açık hesaplar ve hızlı kapatma. Garson masayı açar, ürünleri ekler; kasa tek tuşla kapatır. Gecenin sonunda hangi masa ne bıraktı, hepsi kayıtlı.',
    bullets: [
      'Masa görünümü: dolu, boş ve hesabı açık masalar renkleriyle belli',
      'Hızlı ürün ekleme ve tek tuşla adisyon kapatma',
      'Veresiye ve abonman (öğretmen, esnaf öğle yemeği) takibi',
      'Gün sonu: masa cirosu, gider ve kasa farkı otomatik hesaplanır',
    ],
    closing:
      'Yoğun saatte tek elle kullanılacak kadar sade; telefondan da kasadan da aynı defter görünür.',
  },
  'bakkal-market': {
    title: 'Bakkal ve Market Veresiye Defteri',
    intro:
      'Mahallenin veresiye defteri artık cebinde. Kim ne aldı, ne ödedi, kalan borç ne — tartışma biter. Barkodlu ürünlerde stok da kendiliğinden düşer.',
    bullets: [
      'Müşteri cari kartı: borç, ödeme geçmişi ve tek tuşla tahsilat',
      'Barkod ve kategori ile hızlı ürün bulma',
      'Kritik stok uyarısı: biten ürün gözünden kaçmaz',
      'WhatsApp hatırlatma: geciken ödemeye kibar mesaj tek dokunuşla',
    ],
    closing:
      'Eski borçları açılış bakiyesi olarak gir, bugünden itibaren her işlem deftere işlensin. Ay sonunda kim ne kadar borçlu, tek liste.',
  },
  'teknik-servis': {
    title: 'Teknik Servis Takip Programı',
    intro:
      'Cihaz kabul fişinden teslimata kadar her iş kayıt altında. “Benim telefon ne oldu?” sorusuna cevap aramakla uğraşma; fiş numarasından durumu anında söyle.',
    bullets: [
      'Servis fişi: müşteri, cihaz, arıza notu ve durum takibi',
      'Durum adımları: bekliyor, işlemde, teslime hazır, teslim edildi',
      'Parça ve işçilik maliyetini fişe işle, karı gör',
      'Teslimde tek tuşla tahsilat ve gün sonu cirosuna otomatik ekleme',
    ],
    closing:
      'Telefoncu, bilgisayarcı, beyaz eşya servisi: cihazı al, fişi kes, durumu güncelle, teslim et. Hepsi 2 dakikada.',
  },
  hukuk: {
    title: 'Avukat ve Hukuk Bürosu Programı',
    intro:
      'Dava dosyaları, müvekkil cari hesapları ve duruşma hatırlatmaları tek panelde. Klasör karışıklığı bitsin: dosya numarasından davayı, müvekkilden alacağı anında gör.',
    bullets: [
      'Dava dosyası: müvekkil, karşı taraf, mahkeme ve duruşma tarihi takibi',
      'Müvekkil cari kartı: alınan avans, kalan alacak ve tahsilat kaydı',
      'Yaklaşan duruşma ve iş hatırlatmaları otomatik listede',
      'Vekalet ücreti ve masraf kalemleri dosya bazında kayıtlı',
    ],
    closing:
      'Tek avukatlık bürodan çok ortaklı ofise kadar aynı defter çalışır. Müvekkil aradığında dosyayı saniyede aç, duruşmayı kaçırma.',
  },
  terzi: {
    title: 'Terzi Emanet ve Sipariş Takibi',
    intro:
      'Emanet fişinden teslimata kadar her iş kayıt altında. “Benim pantolon ne oldu?” sorusu tarih olur; fişten durumu ve teslim gününü anında söyle.',
    bullets: [
      'Emanet fişi: müşteri, ürün, tadilat notu ve teslim tarihi',
      'Durum takibi: bekliyor, işlemde, hazır, teslim edildi',
      'Ölçü ve model notları müşteri kartında saklı',
      'Teslimde tek tuşla tahsilat, gün sonu cirosuna otomatik eklenir',
    ],
    closing:
      'Tadilat ve dikim işleri karışmaz: al, fişi kes, durumu güncelle, gününde teslim et. Mahallenin terzisi dijitale geçer.',
  },
};

function SectorPage({ route, ...props }: PageProps & { route: 'berber' | 'kafe-restoran' | 'bakkal-market' | 'teknik-servis' | 'hukuk' | 'terzi' }) {
  const s = SECTORS[route];
  return (
    <Shell title={s.title} {...props}>
      <H1>{s.title}</H1>
      <Lead>{s.intro}</Lead>
      <Bullets items={s.bullets} />
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
