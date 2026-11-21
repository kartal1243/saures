export type LandingPageKey =
  | '/'
  | '/berber'
  | '/kuafor'
  | '/guzellik-salonu'
  | '/randevu-sistemi'
  | '/veresiye-defteri'
  | '/kasa-programi'
  | '/gun-sonu-raporu'
  | '/qr-menu'
  | '/kafe-restoran'
  | '/bakkal-market'
  | '/izmit-berber-randevu'
  | '/izmit-kuafor-randevu'
  | '/zonguldak-berber-randevu';

export interface LandingPageContent {
  key: LandingPageKey;
  primaryKeyword: string;
  badge: string;
  h1: string;
  subtitle: string;
  ogImage: string;
  introParagraphs: string[];
  howItWorks: { step: string; title: string; description: string }[];
  featureSections: { heading: string; paragraphs: string[]; bullets: string[] }[];
  comparisonPoints?: { title: string; oldWay: string; newWay: string }[];
  testimonials: { name: string; shopAndCity: string; quote: string; rating: string }[];
  faq: { q: string; a: string }[];
  relatedLinks: { label: string; href: string; description: string }[];
  cityDetails?: {
    city: string;
    region: string;
    districts: string[];
    neighborhoods: string[];
    caseStudyTitle: string;
    caseStudySummary: string;
    localStats: { label: string; value: string }[];
    b2cCategories?: { title: string; services: string[]; badge: string }[];
    districtDirectory?: { name: string; highlight: string; searchIntent: string }[];
  };
}

export const SEO_LANDING_PAGES: Record<LandingPageKey, LandingPageContent> = {
  '/': {
    key: '/',
    primaryKeyword: 'esnaf yönetim programı',
    badge: 'Türkiye Esnafının Dijital Dükkân Asistanı',
    h1: 'Esnaf Yönetim Programı: Kasa, Veresiye, Randevu ve QR Menü Tek Ekranda',
    subtitle:
      'Pahalı POS cihazları, kaybolan kareli defterler ve %20 komisyon kesen uygulamalar olmadan dükkanınızı doğrudan telefonunuzdan yönetin. 2 dakikada ücretsiz kurun.',
    ogImage: '/og/home.png',
    introParagraphs: [
      'Mahalle bakkalından çok koltuklu berbere, butik kafeden teknik servise kadar esnafın günlük temposu karmaşık masaüstü yazılımlara izin vermez. Bir elinizde makas varken ya da tezgah önünde müşteri beklerken cep telefonundan tek elle hızlıca kullanılabilen bir esnaf yönetim programı gerekir.',
      'Dükkânım Yanımda, esnafın gerçek dükkan pratiğinden doğmuştur. Kağıt defterde unutulan veresiyeleri, WhatsApp sohbetlerinde kaybolan randevuları, sürekli yeniden basılan menüleri ve akşam kasa sayımlarını tek sade panelde toplar. Sektörünüzü seçtiğinizde ekranınız doğrudan berber, kafe, bakkal, güzellik merkezi, terzi veya servis moduna geçer.',
      'Başlamak için pahalı barkod cihazları, dokunmatik kasalar ya da taahhütler gerekmez. Mevcut telefonunuzdan tarayıcıyla 2 dakikada dükkanınızı kurarsınız. Çırak paketi kredi kartı istemeden süresiz ücretsizdir; işleriniz büyüdüğünde dahi şeffaf sabit paketlerle kazancınızın tamamı sizin kalır.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Sektörünü Seç ve 2 Dakikada Kur',
        description:
          'Telefon numaranla ücretsiz hesabını aç, berber, kafe, bakkal, güzellik salonu veya teknik servis seçeneklerinden sana uygun olanı belirle.',
      },
      {
        step: '2',
        title: 'Müşteri, Ürün veya Hizmetlerini Ekle',
        description:
          'Eski veresiye alacaklarını açılış bakiyesiyle aktar, tarife fotoğrafını çekerek hizmetlerini ekle veya telefon kamerasıyla ürün barkodlarını okut.',
      },
      {
        step: '3',
        title: 'Online Linkini Paylaş ve Kasayı Takip Et',
        description:
          'Özel /r/dukkan-adiniz randevu veya /m/dukkan-adiniz QR menü adresini paylaş, akşam gün sonu raporunu 30 saniyede kapat.',
      },
    ],
    featureSections: [
      {
        heading: 'Kasa Takibi ve 30 Saniyede Gün Sonu Kapatma',
        paragraphs: [
          'Esnafın gün sonunda en çok vakit kaybettiği iş, çekmecedeki nakit parayı POS slipleriyle ve gün içi masraflarla eşleştirmektir. Dükkânım Yanımda kasayı dört net kanalda izler: Nakit, kredi kartı POS, IBAN/havale ve veresiye. Sabah kasaya koyduğunuz bozuk para avansı ayrı tutulur; gün içinde elden ödediğiniz çay, yemek, kurye veya malzeme giderleri tek tıkla işlenir.',
          'Akşam kepenk indirirken hesap makinesiyle tek tek fiş toplamak yerine Gün Sonu ekranını açarsınız. Çekmeceden saydığınız nakdi girdiğinizde sistem beklenen nakit, kart toplamı ve net kârı saniyeler içinde karşılaştırır. Tüm kapanışlar tarih damgalı olarak bulut arşivinde saklanır; geçen ayın aynı günüyle kıyaslama yapabilirsiniz.',
        ],
        bullets: [
          'Nakit, kredi kartı POS, havale/FAST ve veresiye işlemlerini birbirine karıştırmadan ayrı izleme',
          'Gün içi fişsiz küçük masrafları ve toptancı ödemelerini kategori bazlı kaydetme',
          'Sabah kasa açılış avansını akşam net nakit sayımından otomatik ayırma',
          'Patron Raporu ile haftanın en kârlı günlerini ve net kâr marjını tek bakışta görme',
        ],
      },
      {
        heading: 'Kayıpsız Dijital Veresiye Defteri ve Tahsilat Turu',
        paragraphs: [
          'Kareli defterde yıpranan sayfalar, birbirine giren isimler ve "Ben geçen hafta ödemiştim" tartışmaları artık tarih oluyor. Veresiye defteri modülünde her müşterinin kendi dijital cari kartı vardır. Müşteri borç yazdırdığında kalem kalem tarih ve tutar kaydedilir; kısmi ödeme yaptığında kalan bakiye anında güncellenir.',
          'Eski kağıt defterinizdeki borçları tek tek işlemek zorunda değilsiniz; müşteriyi açıp tek satır açılış bakiyesi girmeniz yeterlidir. Ay sonunda veya tahsilat günlerinde Tahsilat Turu özelliğini açtığınızda borçlular büyükten küçüğe sıralanır; tek tıkla WhatsApp üzerinden kibar, kurumsal dükkan ağzıyla hazırlanmış hesap ekstresi göndererek unutulan alacakları hızlıca toplarsınız.',
        ],
        bullets: [
          'Müşteri bazlı tarih damgalı borç, tahsilat ve vade takibi',
          'Kağıt defterden 5 dakikada geçmeyi sağlayan tek kalem açılış bakiyesi girişi',
          'Tahsilat Turu ile geciken veya yüksek tutarlı borçları önceliklendirme',
          'Tek dokunuşla nazik WhatsApp borç hatırlatma mesajı ve IBAN bilgisi paylaşımı',
        ],
      },
      {
        heading: '%0 Komisyonlu 7/24 Online Randevu ve Koltuk Yönetimi',
        paragraphs: [
          'Berber, kuaför, güzellik salonu ve randevu ile çalışan tüm esnaflar için dükkan adına özel rezervasyon bağlantısı (dukkanimyanimda.com.tr/r/dukkan-adiniz) otomatik oluşturulur. Müşterileriniz hiçbir uygulama indirmeden veya şifre oluşturmadan telefon tarayıcısından ustanızı, hizmetinizi ve boş saati 15 saniyede seçip randevu alır.',
          'Pazaryeri platformları gibi her randevudan %15–%20 komisyon kesilmez ve müşterinizin karşısına rakip dükkanlar çıkarılmaz. Randevudan 2 saat önce WhatsApp üzerinden giden nazik teyit mesajları sayesinde no-show (gelmeyen müşteri) kayıpları minimuma iner; akşam kapanışta ise usta ve çırak primleri otomatik hesaplanır.',
        ],
        bullets: [
          'Instagram bio, Google Haritalar ve WhatsApp durumuna tek tıkla eklenen özel randevu linki',
          'Hizmet süresine göre (30 dk kesim, 90 dk boya gibi) çakışmayı önleyen akıllı takvim',
          'Çoklu usta/personel takvimi ve otomatik yüzdelik/baremli prim hesaplama',
          '10’lu dijital sadakat kartı ile düzenli müşterilerin geri dönüşünü hızlandırma',
        ],
      },
      {
        heading: 'Kafe QR Menü, Canlı Masa Adisyonu ve Barkodlu Hızlı Satış',
        paragraphs: [
          'Yeme-içme işletmeleri için Salon, Bahçe ve Teras bölümlerine göre masa yerleşimi kurulur; dolu, boş ve hesap bekleyen masalar renklerle ayrılır. Masalara yapıştırılan karekodları okutan müşteriler her zaman güncel fiyatlı mobil menüyü görür, doğrudan sipariş verir ve tek dokunuşla garson ya da hesap çağırabilir.',
          'Bakkal, market, şarküteri ve perakende dükkanları içinse ek cihaz satın almadan telefon kamerasıyla barkod okutma desteği çalışır. Terazili ürünlerde gramaj ve kilo hesaplaması hızlıca yapılır; kritik seviyeye düşen ürünler alarm vererek toptancı sipariş listenizi erkenden hazırlar.',
        ],
        bullets: [
          'Sabit /m/dukkan-adiniz linkiyle baskı maliyeti olmadan anlık QR menü fiyat güncelleme',
          'Masadan temassız garson çağırma, hesap isteme ve mutfağa sesli sipariş bildirimi',
          'Ek barkod okuyucu donanımı gerektirmeyen telefon kamerasıyla hızlı barkodlu satış',
          'Kritik stok uyarıları ve teknik servis / terzi için QR kodlu emanet-tamir fişi (/t/kod)',
        ],
      },
      {
        heading: 'Bulut Güvencesi, AI Asistan Kolaylıkları ve Şeffaf Esnaf Paketleri',
        paragraphs: [
          'Dükkânım Yanımda, telefonunuz bozulsa ya da kaybolsa bile kayıtlarınızı korur. Tüm verileriniz HTTPS şifreli bağlantıyla iletilir, her gece otomatik yedeklenir ve istediğiniz an tek dosyada yedek indirip kendi cihazınızda saklayabilirsiniz. Fotoğraftan AI tarife okuyucu sayesinde duvarınızdaki hizmet listesini veya menüyü çekip saniyeler içinde sisteme aktarabilirsiniz.',
          'Fiyatlandırma politikamız da tamamen esnaf dostudur: Çırak paketi 25 müşteri ve ayda 20 online randevu kotasıyla süresiz ücretsizdir. Tek çalışan esnaflar için Usta paketi aylık ₺249, çoklu personelli salonlar ve yoğun işletmeler için sınırsız kullanım ile çoklu prim dağılımı sunan Patron VIP paketi ise aylık ₺499’dur.',
        ],
        bullets: [
          'Süresiz ücretsiz Çırak paketi ile kredi kartı vermeden risk almadan başlama',
          'Fotoğraftan yapay zeka ile fiyat listesi/tarife okuma ve sesli hızlı işlem kolaylığı',
          'Taahhüt veya cayma bedeli olmadan aylık esnek paket geçişi',
          'Tam KVKK uyumu: müşteri verileriniz asla rakiplerle paylaşılmaz veya reklam için satılmaz',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'Kurulum ve Donanım Maliyeti',
        oldWay: 'Pahalı dokunmatik POS bilgisayarları, termal yazıcı ve yıllık bakım ücretleri',
        newWay: '₺0 donanım maliyeti — cebinizdeki telefon, tablet ve mevcut bilgisayarla hemen çalışır',
      },
      {
        title: 'Müşteri Randevu Komisyonu',
        oldWay: 'Pazaryeri uygulamalarında yeni müşteriden %20’ye varan komisyon ve rakip önerisi',
        newWay: '%0 komisyon — size özel /r/dukkan-adiniz linkiyle sadece kendi markanızı büyütürsünüz',
      },
      {
        title: 'Veresiye ve Alacak Takibi',
        oldWay: 'Yıpranan kağıt defterler, karışan bakiyeler ve yüz yüze borç isteme mahcubiyeti',
        newWay: 'Bulutta güvende cari kartlar ve WhatsApp üzerinden tek tıkla kibar hesap ekstresi',
      },
      {
        title: 'Akşam Gün Sonu Kapatma',
        oldWay: 'Hesap makinesi ve buruşuk fişlerle 45–60 dakika süren stresli kasa sayımı',
        newWay: 'Nakit, POS, havale ve giderler gün içi otomatik toplanır; 30 saniyede net rapor',
      },
      {
        title: 'Menü ve Fiyat Güncelleme',
        oldWay: 'Her zam veya yeni üründe matbaaya yeniden baskı ücreti ödemek',
        newWay: 'Sabit karekod üzerinden saniyeler içinde sınırsız fiyat, ürün ve stok güncelleme',
      },
    ],
    testimonials: [
      {
        name: 'Kemal D.',
        shopAndCity: '3 Koltuklu Berber Salonu · İzmit / Kocaeli',
        quote:
          'Cumartesi günleri kapıda bekleyenler yüzünden telefon açamıyorduk. Şimdi Instagram’dan randevu linkimizi tıklayıp kendileri saat seçiyor, akşam usta primlerini 20 saniyede çıkarıyoruz.',
        rating: '5.0',
      },
      {
        name: 'Hasan Y.',
        shopAndCity: 'Mahalle Marketi & Şarküteri · Nilüfer / Bursa',
        quote:
          'Eski veresiye defterimizdeki bakiyeleri 10 dakikada açılış borcu olarak aktardım. Tahsilat Turu sayesinde aylardır bekleyen alacaklarımızı kimseyi kırmadan WhatsApp’tan topladık.',
        rating: '4.9',
      },
      {
        name: 'Merve T.',
        shopAndCity: 'Kafe & Bistro · Çankaya / Ankara',
        quote:
          'Her fiyat değişiminde kağıt menü bastırmaktan bıkmıştık. QR menüyü ücretsiz kurduk, bahçe masalarından gelen garson çağrıları ve adisyonlar doğrudan kasaya düşüyor.',
        rating: '5.0',
      },
    ],
    faq: [
      {
        q: 'Dükkânım Yanımda gerçekten ücretsiz mi? Gizli ücret var mı?',
        a: 'Evet. Çırak paketi 14 günlük deneme değil, 25 müşteri cari kartı, 3 masa/tek koltuk ve ayda 20 online randevu sınırları dahilinde süresiz olarak ₺0’dır. Kredi kartı bilgisi istemeyiz ve randevulardan komisyon kesmeyiz.',
      },
      {
        q: 'Telefonda kullanmak için uygulama mağazasından indirmem gerekir mi?',
        a: 'Zorunlu değildir. Tarayıcı üzerinden anında açılır ve telefonunuzda "Ana Ekrana Ekle" seçeneğiyle normal bir mobil uygulama gibi tam ekran çalışır.',
      },
      {
        q: 'Kağıt defterdeki eski veresiye borçlarını nasıl aktarırım?',
        a: 'Eski fişleri tek tek girmeniz gerekmez. Müşteriyi adı ve telefonuyla eklerken güncel toplam borcunu "Açılış Bakiyesi" alanına yazmanız yeterlidir.',
      },
      {
        q: 'Müşterilerim randevu alırken veya QR menüye bakarken uygulama indirmek zorunda mı?',
        a: 'Hayır. Müşterileriniz linke veya karekoda dokunduğunda doğrudan telefon tarayıcılarında saniyeler içinde sayfanız açılır.',
      },
      {
        q: 'Birden fazla cihazdan aynı anda dükkana bağlanabilir miyim?',
        a: 'Evet. Dükkandaki tablet kasa ekranı olarak açıkken siz dışarıdayken kendi cep telefonunuzdan günlük ciroyu ve gelen randevuları canlı takip edebilirsiniz.',
      },
      {
        q: 'Personelime veya çırağıma panel erişimi verirsem kasa verilerimi görür mü?',
        a: 'Güvenlik mimarimiz gereği kasa, veresiye ve kâr bilgileri yalnızca işletme sahibinin giriş yaptığı ana panelde tutulur; personel bilgileri sadece bilgi ve prim dağılımı amacıyla yönetilir.',
      },
      {
        q: 'İnternetim kesilirse veya telefonumu değiştirirsem verilerim kaybolur mu?',
        a: 'Tüm kayıtlarınız şifreli bulut sunucularda tutulur ve her gece otomatik yedeklenir. Telefonunuz değişse bile numaranızla giriş yaptığınızda tüm dükkanınız eksiksiz açılır.',
      },
      {
        q: 'Sektörümü daha sonra değiştirebilir miyim veya karma dükkan yönetebilir miyim?',
        a: 'Evet. Örneğin hem kuaför hizmeti verip hem şampuan/bakım ürünü satan ya da hem kafe adisyonu hem veresiye tutan bir işletmeyseniz aynı hesap içinden ilgili modülleri birlikte kullanabilirsiniz.',
      },
      {
        q: 'Usta (₺249) ve Patron VIP (₺499) paketleri arasında taahhüt var mı?',
        a: 'Hiçbir pakette yıllık taahhüt veya iptal cezası yoktur. İstediğiniz ay paketinizi yükseltebilir, düşürebilir veya durdurabilirsiniz.',
      },
    ],
    relatedLinks: [
      {
        label: 'Berber Randevu Sistemi',
        href: '/berber',
        description: 'Koltuk sırası, 7/24 online randevu ve usta/kalfa prim dağılımı.',
      },
      {
        label: 'Dijital Veresiye Defteri Uygulaması',
        href: '/veresiye-defteri',
        description: 'Açılış bakiyesi, Tahsilat Turu ve tek tık WhatsApp borç hatırlatma.',
      },
      {
        label: 'Ücretsiz QR Menü Sistemi',
        href: '/qr-menu',
        description: 'Baskısız karekod menü, canlı fiyat güncelleme ve masadan garson çağrı.',
      },
      {
        label: 'Esnaf Kasa Takip Programı',
        href: '/kasa-programi',
        description: 'Nakit, POS, havale, giderler ve gün sonu Z raporu mutabakatı.',
      },
      {
        label: 'Küçük İşletmeler İçin Kasa Takibi Rehberi (Blog)',
        href: '/blog/kucuk-isletmeler-icin-kasa-takibi-rehberi',
        description: 'Ciro ile net kârı ayırmanın ve günlük kasa düzeni kurmanın pratik yolları.',
      },
    ],
  },

  '/berber': {
    key: '/berber',
    primaryKeyword: 'berber randevu sistemi',
    badge: 'Berber & Erkek Kuaförü Özel Çözümü',
    h1: 'Berber Randevu Sistemi: Koltuk Sırası, Online Takvim ve Usta Prim Takibi',
    subtitle:
      'Tıraş ortasında telefon trafiğine son verin. Müşterileriniz size özel /r/dukkan-adiniz linkinden 15 saniyede randevu alsın, akşam usta ve çırak primleri tek tıkla hesaplansın.',
    ogImage: '/og/berber.png',
    introParagraphs: [
      'Berber salonunda en değerli sermaye ustanın zamanı ve koltuğun doluluk oranıdır. Gün içinde bir yandan makas ve ustura kullanırken diğer yandan "Usta saat 17:00 boş mu?" diye çalan telefonlara cevap vermek, hem elinizdeki işin akışını bozar hem de koltuktaki müşterinin deneyimini düşürür. Üstelik cuma ve cumartesi yoğunluğunda kapıda biriken kalabalığı gören yeni müşteriler çoğu zaman beklememek için başka dükkana yürür.',
      'Dükkânım Yanımda berber randevu sistemi, mahalle berberinden beş koltuklu modern erkek kuaförlerine kadar her ölçekteki salonun günlük düzenini cebinize taşır. Dükkanınızı kurduğunuz anda size özel bir online rezervasyon sayfası oluşturulur. Instagram biyografinize, WhatsApp durumunuza ve Google Haritalar profilinize eklediğiniz bu link sayesinde müşterileriniz uygulama indirmeden boş saatleri görür, ustasını seçer ve randevusunu oluşturur.',
      'Sistem sadece bir takvimden ibaret değildir; berber esnafının gerçek ihtiyaçları olan koltuk sırası yönetimi, no-show önleyici WhatsApp hatırlatması, 10’lu dijital sadakat kartı, veresiye defteri, usta-kalfa prim dağılımı ve akşam gün sonu kasa sayımını aynı ekranda birleştirir. Pazaryeri uygulamalarının aksine her randevudan %0 komisyon alır ve müşterinizi asla rakiplere göstermez.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Hizmet Tarifeni ve Ustalarını Tanımla',
        description:
          'Saç kesimi, sakal tıraşı, cilt bakımı süre ve fiyatlarını gir; istersen duvar tarifeni fotoğrafla AI okuyucuya okut.',
      },
      {
        step: '2',
        title: 'Özel Randevu Linkini Paylaş',
        description:
          'dukkanimyanimda.com.tr/r/dukkan-adiniz adresini Instagram bio, Google Haritalar ve WhatsApp profiline ekle.',
      },
      {
        step: '3',
        title: 'Koltukları Doldur, Primi Akşam Tek Tıkla Kapat',
        description:
          'Müşteriler boş saati seçip WhatsApp teyitli gelsin; akşam kasa kapanışında her ustanın primi hazır olsun.',
      },
    ],
    featureSections: [
      {
        heading: '7/24 Komisyonsuz Online Randevu Linki (/r/dukkan-adiniz)',
        paragraphs: [
          'Müşterilerinizin randevu için gece yarısı mesaj atıp sabah cevap beklemesine gerek kalmaz. Dükkanınıza özel üretilen online randevu sayfasında yalnızca sizin logonuz, adresiniz, çalışma saatleriniz, hizmet fiyatlarınız ve müsait koltuklarınız görünür. Müşteri dilediği ustayı ve saati seçip telefon numarasını yazdığında rezervasyon 15 saniyede takviminize düşer.',
          'Global randevu platformları ilk gelen müşterilerden %20’ye varan komisyon keserken ve aynı sayfada yan sokaktaki berberlerin reklamını yaparken, Dükkânım Yanımda %0 komisyon politikası uygular. Google İşletme Profilinizdeki randevu butonuna da doğrudan kendi linkinizi bağlayarak semtinizdeki aramalardan ücretsiz müşteri kazanırsınız.',
        ],
        bullets: [
          'Uygulama indirme veya şifre kurma gerektirmeyen hızlı mobil tarayıcı akışı',
          'Her randevudan %0 komisyon — kazancınızın tamamı doğrudan kasanızda kalır',
          'Saç 30 dk, saç+sakal 45 dk, damat tıraşı 90 dk gibi süre bazlı otomatik slot bloklama',
          'Dolu saatleri otomatik kilitleyerek çifte rezervasyon kazalarını tamamen önleme',
        ],
      },
      {
        heading: 'Gelmeme (No-Show) Sorununu Bitiren WhatsApp Hatırlatma ve Bekleme Akışı',
        paragraphs: [
          'En yoğun Cumartesi saatinde bir müşterinin haber vermeden randevusuna gelmemesi, o koltuğun 45 dakika boş kalması ve arayan iki başka müşteriyi de geri çevirmiş olmanız anlamına gelir. Berber esnafı için no-show kaybının büyük bölümü unutkanlıktan kaynaklanır.',
          'Dükkânım Yanımda randevu saati yaklaşan müşterilere tek dokunuşla gönderebileceğiniz hazır WhatsApp teyit şablonları sunar. Müşteri gelemeyecekse erkenden bildirdiği için boşalan saat takvimde yeniden açılır; dilerseniz "Ölü Saat / Son Dakika Boşluk" duyuru mesajıyla o koltuğu dakikalar içinde başka bir müdavimle doldurursunuz.',
        ],
        bullets: [
          'Randevudan 2 saat önce tek tıkla WhatsApp teyit ve adres hatırlatma mesajı',
          'Damat tıraşı ve uzun VIP bakımlarda FAST/IBAN kapora notu ve kalan bakiye takibi',
          'Son dakika iptallerinde açılan saati takvimde anında yeniden rezervasyona açma',
          'Müşteri kartında geçmiş randevulara ve özel kesim notlarına (ör. "yanlar 2 numara") erişim',
        ],
      },
      {
        heading: 'Çoklu Koltuk Sırası ve Usta / Kalfa Prim Hesaplama',
        paragraphs: [
          'Dükkânda iki veya dört usta birlikte çalışıyorsanız akşam hesap kapatırken kağıtlardan "Ahmet Usta bugün kaç saç, kaç sakal kesti?" hesabını toplamak hem zaman alır hem de zaman zaman yanlış anlaşılmalara yol açar. Sistemimizde her koltuk ve personel için ayrı yüzdelik veya sabit prim oranı tanımlanabilir.',
          'Gün içinde bir tıraş tamamlanıp kasaya işlendiğinde hangi ustanın o işlemi yaptığı seçilir. Akşam gün sonu kapatılırken her ustanın toplam cirosu, hak ettiği net prim tutarı ve dükkana kalan net pay tek ekranda kuruşu kuruşuna raporlanır.',
        ],
        bullets: [
          'Her usta, kalfa veya çırak için ayrı komisyon yüzdesi (%40, %45, %50 vb.) tanımlama',
          'Müşterinin randevu ekranından kendi tercih ettiği ustayı seçebilmesi',
          'Pazar veya tatil günlerine özel koltuk ve çalışma saati ayarları',
          'Ödenen personel primlerini kasa giderinden otomatik düşerek net işletme kârını görme',
        ],
      },
      {
        heading: '10’lu Dijital Sadakat Kartı ve Ölü Saat Doldurma Stratejisi',
        paragraphs: [
          'Mahalle rekabetinde fiyatı kırmak yerine müdavimi ödüllendirmek çok daha sağlıklıdır. 10’lu dijital sadakat kartı ile müşterinizin her tıraşını telefon numarasına işlersiniz; 9 veya 10 tıraşa ulaştığında ücretsiz saç yıkama, maske veya tıraş hediyesi vererek müşterinin başka bir berbere gitmesini önlersiniz.',
          'Hafta sonu tüm saatler dolarken Salı veya Çarşamba öğleden sonra koltukların boş kalmasını istemiyorsanız, Patron Raporu’ndan en sakin saatlerinizi görebilir ve son 25 gündür gelmemiş müdavimlerinize nazik bir geri dönüş veya ölü saat avantajı mesajı paylaşabilirsiniz.',
        ],
        bullets: [
          'Kağıt kart gibi kaybolmayan telefon numarasına bağlı dijital sadakat puanı',
          '21 günlük tıraş döngüsünde geri gelmeyen müşterileri tespit edip davet etme',
          'Salı–Çarşamba sakin saatleri canlandıran hazır WhatsApp kampanya şablonları',
          'Fotoğraftan AI tarife okuyucu ile duvarınızdaki oda fiyat listesini saniyede aktarma',
        ],
      },
      {
        heading: 'Veresiye Defteri, Şampuan/Bakım Stokları ve Gün Sonu Kasası',
        paragraphs: [
          '"Abi cüzdanı arabada unutmuşum, yarın uğrayıp vereyim" diyen tanıdık müşteriler her berberde vardır. Bu tutarları kağıt köşelerine yazıp unutmak yerine tek dokunuşla müşterinin veresiye kartına atabilirsiniz. Dükkanda wax, sakal yağı, kolonya veya şampuan satıyorsanız bunların stoğunu ve kritik azalma uyarılarını da aynı ekrandan takip edersiniz.',
          'Akşam dükkandan çıkarken nakit, kredi kartı POS ve IBAN toplamları gün sonu raporunda ayrı ayrı görünür. Kasa ve prim hesabı 30 saniyede tamamlanır; siz eve gittiğinizde aklınız hesapta kalmaz.',
        ],
        bullets: [
          'Tanıdık müşterilerin "sonra öderim" işlemlerini tarihli veresiye cari kartına işleme',
          'Bakım ürünleri (wax, tonik, serum) stok takibi ve hızlı perakende satışı',
          'Nakit, POS ve havale ayrımıyla hatasız akşam kasa mutabakatı',
          'Çırak paketi ile ₺0 başlangıç; tek koltuk için Usta (₺249/ay), çoklu ekip için Patron VIP (₺499/ay)',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'Randevu Alma Yöntemi',
        oldWay: 'Tıraşı yarıda bırakıp telefon açmak ve WhatsApp’ta 6 mesaj yazışmak',
        newWay: 'Müşteri /r/dukkan-adiniz linkinden 15 saniyede kendi boş saatini seçer',
      },
      {
        title: 'Komisyon ve Müşteri Sahipliği',
        oldWay: 'Pazaryeri uygulamalarında %20 komisyon kesintisi ve rakip salon önerileri',
        newWay: '%0 komisyon; müşteriniz sadece sizin salonunuzu ve fiyatlarınızı görür',
      },
      {
        title: 'Usta ve Çırak Prim Hesabı',
        oldWay: 'Akşam adisyon kağıtlarını hesap makinesiyle tek tek toplayıp tartışmak',
        newWay: 'Her tıraş kasaya girildiğinde usta payı ve dükkan neti otomatik hesaplanır',
      },
      {
        title: 'Gelmeyen Müşteri (No-Show)',
        oldWay: 'Unutulan randevular yüzünden 45 dakika boş koltuğa bakmak',
        newWay: 'WhatsApp teyit hatırlatmasıyla no-show oranı düşer, boş saat anında dolur',
      },
    ],
    testimonials: [
      {
        name: 'Serkan K.',
        shopAndCity: 'Erkek Kuaförü (4 Koltuk) · Kadıköy / İstanbul',
        quote:
          'Günde en az 20 telefon araması geliyordu, elimizde makasla koşturuyorduk. Linki Instagram’a koyduğumuzdan beri müşterilerin çoğu gece evde kendi saatini seçiyor.',
        rating: '5.0',
      },
      {
        name: 'Oğuzhan M.',
        shopAndCity: 'Mahalle Berberi · Çankaya / Ankara',
        quote:
          'Tek koltuk çalışıyorum, Usta paketi bütçemi hiç yormuyor. Hem randevularım hem sadakat kartım hem de akşam kasa sayımım telefonumda.',
        rating: '4.9',
      },
      {
        name: 'Burak T.',
        shopAndCity: 'Berber Salonu · İzmit / Kocaeli',
        quote:
          'Pazaryeri uygulamalarına komisyon vermekten kurtulduk. Kendi dükkan linkimizle Google Haritalar’dan her hafta yeni müşteri geliyor ve prim hesabı hiç şaşmıyor.',
        rating: '5.0',
      },
    ],
    faq: [
      {
        q: 'Berber randevu sistemi telefondan uygulama indirmeden çalışır mı?',
        a: 'Evet. Hem sizin yönetim paneliniz hem de müşterilerinizin randevu aldığı ekran tamamen mobil tarayıcıda çalışır; isterseniz kendi telefonunuzun ana ekranına uygulama kısayolu olarak ekleyebilirsiniz.',
      },
      {
        q: 'Her randevudan komisyon veya mesaj ücreti kesiliyor mu?',
        a: 'Hayır. Tüm paketlerde online randevu komisyonu %0’dır. Müşteri WhatsApp hatırlatmalarını doğrudan hazır şablonlarla cihazınız üzerinden ücretsiz iletebilirsiniz.',
      },
      {
        q: 'Tek koltuklu mahalle berberi ile 5 koltuklu salon için aynı sistem mi kullanılıyor?',
        a: 'Evet. Tek çalışan berberler Çırak (₺0) veya Usta (₺249/ay) paketiyle tek koltuk yönetirken; 2 ve üzeri ustası olan salonlar Patron VIP (₺499/ay) ile sınırsız koltuk ve prim dağılımı açar.',
      },
      {
        q: 'Müşteri telefonla arayıp veya kapıdan gelip randevu istediğinde takvim karışır mı?',
        a: 'Hayır. Siz panelden 5 saniyede manuel randevu eklediğinizde o saat online randevu sayfasında otomatik kapanır, asla çakışma yaşanmaz.',
      },
      {
        q: 'Pazar günü açık olduğumuz saatleri diğer günlerden farklı ayarlayabilir miyiz?',
        a: 'Evet. Çalışma saatleri ayarından haftanın her günü için (örneğin Pazar 10:00–18:00 açık ya da kapalı) ayrı açılış-kapanış saati belirleyebilirsiniz.',
      },
      {
        q: 'Duvarımızdaki fiyat tarifesini tek tek elle yazmak zorunda mıyız?',
        a: 'Hayır. Fotoğraftan AI tarife okuyucu özelliğiyle fiyat panonuzun fotoğrafını çekip hizmet isimlerini ve fiyatlarını saniyeler içinde sisteme aktarabilirsiniz.',
      },
      {
        q: 'Düzenli müşteriler için saç kesimi notu tutabilir miyiz?',
        a: 'Evet. Her müşterinin cari kartında "ense doğal, üstler makasla, yanlar 2 numara" gibi kişisel stil notlarını saklayabilirsiniz.',
      },
      {
        q: 'Damat tıraşı veya özel gün randevularında kapora takibi var mı?',
        a: 'Evet. Alınan kapora ödemesini işlem öncesinde müşteri kartına ve kasaya işleyerek kalan bakiyeyi işlem günü net görebilirsiniz.',
      },
      {
        q: 'İstediğim zaman üyeliğimi iptal edebilir miyim?',
        a: 'Evet. Hiçbir taahhüt yoktur; dilediğiniz zaman paketinizi değiştirebilir veya kapatabilirsiniz.',
      },
    ],
    relatedLinks: [
      {
        label: 'Online Randevu Sistemi (Tüm Sektörler)',
        href: '/randevu-sistemi',
        description: 'Instagram, Google Haritalar ve WhatsApp bağlantılı 7/24 rezervasyon altyapısı.',
      },
      {
        label: 'İzmit & Kocaeli Berber Randevu',
        href: '/izmit-berber-randevu',
        description: 'Fethiye Cd., Yahya Kaptan ve Gebze salonları için yerel randevu rehberi.',
      },
      {
        label: 'Zonguldak & Kdz. Ereğli Berber Randevu',
        href: '/zonguldak-berber-randevu',
        description: 'Gazipaşa Cd., Kozlu ve Ereğli berberleri için yerel randevu sayfası.',
      },
      {
        label: 'Berber Randevu Sistemi Neden Gerekli? (Blog)',
        href: '/blog/berber-randevu-sistemi-neden-gerekli',
        description: 'Koltuk doluluğunu artıran ve telefon yükünü azaltan 7 somut fayda.',
      },
      {
        label: 'Berber Dükkanı Açmak: Maliyet & Kontrol Listesi (Blog)',
        href: '/blog/berber-dukkani-acmak-maliyet-kontrol-listesi',
        description: 'Yeni dükkan kurulumunda bütçe, ruhsat ve ilk gün dijital hazırlık listesi.',
      },
    ],
  },

  '/kuafor': {
    key: '/kuafor',
    primaryKeyword: 'kuaför randevu programı',
    badge: 'Kadın & Unisex Kuaför Salonu Çözümü',
    h1: 'Kuaför Randevu Programı: Süre Bazlı Takvim, Gelin Başı ve Personel Primi',
    subtitle:
      'Boya, röfle, fön ve kesim işlemlerini sürelerine göre çakışmasız planlayın. Gelin başı kaporası, malzeme düşümlü uzman primi ve WhatsApp teyitleri tek ekranda.',
    ogImage: '/og/kuafor.png',
    introParagraphs: [
      'Bir kadın kuaföründe veya unisex salonda randevu yönetmek, sadece saat yazmaktan çok daha karmaşıktır. 30 dakikalık bir fön ile 3 saat süren ombre/röfle işlemi aynı koltuk düzeniyle yönetilemez; üstelik boya açılırken bekleme süresinde uzmanın araya hızlı bir kesim alıp alamayacağı gibi hassas bir tempo vardır. Kağıt ajandaya yazılan hatalı bir saat, öğleden sonra salonda tüm müşterilerin birikmesine yol açar.',
      'Dükkânım Yanımda kuaför randevu programı, salonların gerçek iş akışına göre geliştirilmiştir. Hizmet listenizdeki her işleme ayrı süre ve fiyat tanımlarsınız; müşteriniz Instagram biyografinizdeki özel randevu linkinden "Ombre" seçtiğinde takvim 180 dakikayı, "Saç Kesimi + Fön" seçtiğinde ise 60 dakikayı otomatik bloklar. Böylece telefonla tek tek süre hesaplama zahmeti biter.',
      'Randevunun ötesinde salonun nakit sağlığını da korursunuz: Gelin başı ve nişan rezervasyonlarında alınan kapora tutarları müşteri kartında saklanır, uzmanların yaptığı işlemlerden hak ettiği primler malzeme ya da hizmet baremine göre akşam 30 saniyede hesaplanır. WhatsApp hatırlatma şablonlarıyla da uzun süreli koltukların boş kalma (no-show) riski ortadan kalkar.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Hizmet Sürelerini ve Uzmanlarını Ekle',
        description:
          'Kesim, fön, dip boya, ombre, keratin ve gelin başı hizmetlerinin süre ve fiyatlarını belirle; uzmanlarını tanımla.',
      },
      {
        step: '2',
        title: 'Instagram ve WhatsApp Linkini Yayınla',
        description:
          'Salonuna özel /r/salon-adiniz randevu sayfasını Instagram bio, hikaye ve Google İşletme profiline ekle.',
      },
      {
        step: '3',
        title: 'Kapora, No-Show Teyidi ve Primi Tek Ekranda Yönet',
        description:
          'Randevu öncesi WhatsApp hatırlatması gönder, gelin başı kaporalarını işle ve akşam uzman primlerini tek tıkla kapat.',
      },
    ],
    featureSections: [
      {
        heading: 'İşlem Süresine Göre Akıllı Takvim ve Çakışma Önleme',
        paragraphs: [
          'Kuaför salonlarında en büyük kriz, yoğun bir Cumartesi günü saat 13:00’te gelen boya müşterisinin 15:30’daki gelin yakını fönüyle çakışmasıdır. Kağıt defterde saat aralıkları göz kararı yazıldığı için bu tür taşmalar sık yaşanır ve salon içi gerilimi artırır.',
          'Dükkânım Yanımda her hizmetin gerçek dakikasını hesaba katar. Müşteri online randevu ekranında bir veya birden fazla hizmet seçtiğinde toplam süre otomatik hesaplanır ve yalnızca o uzunluktaki kesintisiz boş aralıklar gösterilir. Böylece personeliniz nefes almadan koşturmak yerine planlı ve kaliteli hizmet verir.',
        ],
        bullets: [
          'Hizmet bazlı özel süre ayarı (Fön 30 dk, Kesim 45 dk, Dip Boya 90 dk, Ombre 180 dk)',
          'Aynı anda birden fazla uzman/koltuk için paralel takvim görüntüleme',
          'Çoklu hizmet seçiminde toplam dakika ve tahmini tutarın müşteriye otomatik gösterimi',
          'Dolu veya izinli personel saatlerini online takvimde anında kapatma',
        ],
      },
      {
        heading: 'Gelin Başı, Nişan ve Özel Gün Kapora Yönetimi',
        paragraphs: [
          'Gelin başı, nişan ve kına organizasyonları aylar öncesinden planlanır ve salonun yarım gününü kaplar. Bu özel rezervasyonların sözlü olarak not edilmesi veya küçük bir post-it kağıdına kapora tutarının yazılması ciddi karışıklıklara davetiye çıkarır. Düğün sabahı "Kapora olarak ne kadar vermiştik?" sorusu hem gelini hem salon sahibini strese sokar.',
          'Sistemimizde aylar sonrasına özel gün randevusu açıp alınan kapora tutarını (nakit, kredi kartı veya IBAN olarak) doğrudan müşteri kartına ve o günün kasasına işlersiniz. Düğün günü geldiğinde kalan bakiye ekranınızda net şekilde görünür; ekstra kirpik, makyaj veya gelin yakını fönleri aynı adisyona eklenerek tek kalemde kapatılır.',
        ],
        bullets: [
          'Aylar öncesinden gelin/nişan randevusu oluşturma ve özel gün notları ekleme',
          'Alınan FAST/IBAN veya nakit kaporayı kasaya ve müşteri bakiyesine anında işleme',
          'Gelin ekibi (nedime, anne, kardeş) işlemlerini aynı organizasyon altında toplama',
          'Müşteri kartında daha önceki deneme (prova) saçı ve makyaj tonu notlarını saklama',
        ],
      },
      {
        heading: 'No-Show (Gelmeyen Müşteri) Önleyici WhatsApp Teyit Akışı',
        paragraphs: [
          '2 saatlik bir röfle veya keratin bakımı randevusunun son dakikada boş kalması, salona o gün en az 2–3 müşterilik ciro kaybettirir. Müşterilerin çoğu kötü niyetle değil, yoğunluktan saati unuttuğu için ya da iptal etmek için aramaya çekindiği için gelmez.',
          'Randevudan 24 saat ve 2 saat önce tek dokunuşla hazırlanan WhatsApp teyit mesajları sayesinde müşteriden erken onay alırsınız. Gelelemeyecek olan kişi önceden haber verdiği için boşalan 2 saatlik slot bekleme listenizdeki veya Instagram hikayenizi gören başka bir müşteriye anında doldurulur.',
        ],
        bullets: [
          'Hazır nazik WhatsApp hatırlatma şablonlarıyla tek tıkta teyit alma',
          'Özel renk formülü ve bakım geçmişi tutulan düzenli müşteri kartları',
          'Son dakika iptali olduğunda o saati online linkte anında tekrar açma',
          'Tekrarlayan no-show müşterilerine not düşerek ön ödemeli randevu kuralı uygulama',
        ],
      },
      {
        heading: 'Personel Prim Hesaplama, Koltuk Cirosu ve Ürün Satışı',
        paragraphs: [
          'Kuaförlerde prim modeli genellikle berberlerden daha ayrıntılıdır: Bazı salonlar toplam işlem üzerinden yüzdelik verirken, bazıları boya ve bakım ürünlerinde malzeme maliyetini düştükten sonra uzman payı hesaplar ya da aylık ciro baremine göre bonus uygular. Akşam defterden tek tek işlem ayıklamak saatler sürer.',
          'Dükkânım Yanımda’da her uzmana özel prim oranı tanımlanır ve yapılan her işlem anlık olarak ustanın hanesine yazılır. Ayrıca bakım sonrası müşteriye sattığınız profesyonel şampuan, maske ve serumların stok takibini yapabilir, kritik stok uyarısı sayesinde en çok satan ürünler bitmeden toptancıya sipariş geçebilirsiniz.',
        ],
        bullets: [
          'Her uzman ve kalfa için ayrı prim yüzdesi tanımlama ve günlük hakediş raporu',
          'Hizmet satışı ile perakende bakım ürünü (şampuan, maske, serum) satışını birlikte izleme',
          'Boya ve bakım malzemeleri için stok ve kritik azalma uyarısı',
          'Akşam ödenen prim ve malzeme giderlerini kasadan düşerek net salon kârını görme',
        ],
      },
      {
        heading: 'Instagram’dan Doğrudan Randevu Dönüşümü ve Müdavim Sadakati',
        paragraphs: [
          'Kadın kuaförleri Instagram’da yaptıkları saç tasarımlarını, kesimleri ve renklendirme sonuçlarını paylaşarak ciddi bir ilgi toplar. Ancak fotoğrafı beğenen potansiyel müşteri DM’den "Fiyat nedir, yarın yer var mı?" yazdığında saatlerce yanıt beklerse heyecanı söner ve başka sayfaya geçer.',
          'Profilinizin en üstüne dukkanimyanimda.com.tr/r/salon-adiniz bağlantısını yerleştirdiğinizde fotoğrafı beğenen kişi aynı dakika fiyatlarınızı görür, boya/bakım uzmanını seçer ve yerini ayırtır. 35 günlük dip boya döngüsünde göndereceğiniz nazik geri dönüş hatırlatmaları ve 10’lu dijital sadakat kartıyla da müşterileriniz yıllarca salonunuzdan kopmaz.',
        ],
        bullets: [
          'Instagram biyografisi ve Story bağlantı çıkartması için hazır komisyonsuz randevu linki',
          '30–35 günlük boya ve bakım yenileme periyotlarında geri dönüş hatırlatmaları',
          'Düzenli müşteriler için kağıtsız 10’lu dijital sadakat kartı',
          'Çırak (₺0), Usta (₺249/ay) ve çoklu ekip için Patron VIP (₺499/ay) şeffaf paketleri',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'İşlem Süresi ve Çakışma',
        oldWay: 'Kağıt defterde göz kararı saat yazıp boya ile fön randevularını üst üste bindirmek',
        newWay: 'Kesim, boya ve ombre sürelerine göre otomatik bloklama ve sıfır çakışma',
      },
      {
        title: 'Gelin Başı & Kapora Takibi',
        oldWay: 'Post-it kağıtlarında kaybolan kapora notları ve düğün günü hesap karışıklığı',
        newWay: 'Müşteri kartında tarihli kapora, kalan bakiye ve gelin ekibi toplu hesabı',
      },
      {
        title: 'Instagram Müşteri Dönüşümü',
        oldWay: 'DM kutusunda saatlerce cevap beklerken rakibe kaçan potansiyel müşteriler',
        newWay: 'Biyografideki linkten 15 saniyede %0 komisyonla 7/24 anında randevu alma',
      },
      {
        title: 'Personel Prim Hesaplama',
        oldWay: 'Akşam kapanışta her uzmanın adisyonlarını tek tek hesap makinesiyle toplamak',
        newWay: 'Her işlem sonunda uzman cirosu ve hakedişi canlı güncellenir',
      },
    ],
    testimonials: [
      {
        name: 'Ayşe G.',
        shopAndCity: 'Kadın Kuaförü (5 Uzman) · Beşiktaş / İstanbul',
        quote:
          'Boya ve röfle randevuları sürekli sarkıyordu. İşlem sürelerini dakikasına göre tanımladık, şimdi Instagram’dan gelen randevular bile takvimimizi hiç bozmuyor.',
        rating: '5.0',
      },
      {
        name: 'Derya K.',
        shopAndCity: 'Saç Tasarım & Gelin Stüdyosu · Karşıyaka / İzmir',
        quote:
          'Yaz düğünlerinde 25 gelin başı randevusunun kaporasını ve saatini kağıt ajandadan takip etmek kabustu. Şimdi tek ekrandan hem kaporayı hem gelin ekibini görüyoruz.',
        rating: '5.0',
      },
      {
        name: 'Elif B.',
        shopAndCity: 'Unisex Kuaför · Osmangazi / Bursa',
        quote:
          'No-show yüzünden haftada en az 3 uzun işlemimiz yanıyordu. WhatsApp teyit şablonlarını düzenli kullanmaya başladığımız ilk ayda gelmeyen müşteri neredeyse kalmadı.',
        rating: '4.9',
      },
    ],
    faq: [
      {
        q: 'Farklı işlemler için farklı randevu süreleri tanımlayabilir miyim?',
        a: 'Evet. Fön için 30 dk, saç kesimi için 45 dk, dip boya için 90 dk, ombre için 180 dk gibi her hizmete özel dakika tanımlarsınız; sistem saatleri bu sürelere göre otomatik kapatır.',
      },
      {
        q: 'Boya formüllerini ve müşterinin geçmiş renk tonlarını kaydedebilir miyim?',
        a: 'Evet. Her müşterinin kartında özel not alanı bulunur; kullandığınız boya numarası, oksidan oranı ve alerji/bakım notlarını güvenle saklayabilirsiniz.',
      },
      {
        q: 'Gelin başı kaporası aldığımda kasa ve bakiye nasıl işlenir?',
        a: 'Kaporayı nakit, POS veya IBAN olarak müşteri hesabına işlersiniz; işlem gününde sistem toplam tutardan alınan kaporayı düşerek yalnızca kalan bakiyeyi gösterir.',
      },
      {
        q: 'Kuaför randevularından herhangi bir komisyon kesiliyor mu?',
        a: 'Hayır. Tüm Dükkânım Yanımda paketlerinde online randevu komisyonu %0’dır.',
      },
      {
        q: 'Müşteri aynı randevuda hem kesim hem boya hem manikür seçebilir mi?',
        a: 'Evet. Birden fazla hizmet seçildiğinde sistem toplam süreyi otomatik toplayarak yalnızca kesintisiz müsait olan saatleri gösterir.',
      },
      {
        q: 'Personel prim oranlarını çalışan bazında değiştirebilir miyim?',
        a: 'Evet. Patron VIP paketinde her uzman, kalfa ve stajyer için farklı prim oranları belirleyip gün sonunda tek raporda hakedişleri görebilirsiniz.',
      },
      {
        q: 'Müşterilerin telefonlarına uygulama indirmesi gerekiyor mu?',
        a: 'Hayır. Instagram biyografinizdeki veya WhatsApp’taki linke tıklayan müşteriniz doğrudan tarayıcıda randevusunu oluşturur.',
      },
      {
        q: 'Salonda kullandığımız perakende şampuan ve bakım ürünlerini de takip edebilir miyiz?',
        a: 'Evet. Ürün stoğu ve kritik seviye uyarısı sayesinde sattığınız bakım ürünlerini aynı kasadan geçip stoktan anında düşebilirsiniz.',
      },
    ],
    relatedLinks: [
      {
        label: 'Kuaför İzmit & Kocaeli Randevu Rehberi',
        href: '/izmit-kuafor-randevu',
        description: 'İzmit, Yahya Kaptan ve Gebze kadın & erkek kuaförleri için online randevu vitrini ve Google Haritalar kurulumu.',
      },
      {
        label: 'Kuaförde Müşteri Gelmeme (No-Show) Çözümü (Blog)',
        href: '/blog/kuafor-musteri-gelmeme-no-show-cozumu',
        description: '24 saat + 2 saat teyit kuralı ve kapora ile boş koltukları bitirme rehberi.',
      },
      {
        label: 'Güzellik Salonu ve Seans Takip Programı',
        href: '/guzellik-salonu',
        description: 'Cilt bakımı, tırnak ve lazer epilasyon hizmetleri de veren salonlar için seans sayacı.',
      },
      {
        label: 'Online Randevu Sistemi',
        href: '/randevu-sistemi',
        description: 'Instagram bio ve Google Haritalar’a bağlanan 7/24 rezervasyon linki.',
      },
      {
        label: 'Müşteri Sadakati ve Hatırlatma Rehberi (Blog)',
        href: '/blog/musteri-sadakati-sms-hatirlatma-geri-donus',
        description: '35 günlük boya döngüsünde eski müşterileri geri döndürme yöntemleri.',
      },
    ],
  },

  '/guzellik-salonu': {
    key: '/guzellik-salonu',
    primaryKeyword: 'güzellik salonu programı',
    badge: 'Güzellik Merkezi, Lazer & Estetik Çözümü',
    h1: 'Güzellik Salonu Programı: Seans Paket Sayacı, Kabin Planı ve Taksit Takibi',
    subtitle:
      'Kağıt seans kartlarını ve karışan Excel tablolarını bırakın. 6–8–10 seanslık lazer paketleri, kabin/cihaz çakışma önleme ve taksitli tahsilat takibi tek panelde.',
    ogImage: '/og/guzellik-salonu.png',
    introParagraphs: [
      'Güzellik salonları, lazer epilasyon stüdyoları, cilt bakım merkezleri ve protez tırnak atölyeleri için en büyük operasyonel yük, tek seferlik işlemlerin yanında aylara yayılan çoklu seans paketlerini yönetmektir. Bir müşteri 8 seanslık tüm vücut lazer paketini 3 taksitle satın aldığında; hem kaçıncı seansa geldiğinin, hem hangi tarihte hangi cihazla işlem gördüğünün hem de kalan taksit borcunun kusursuz takip edilmesi gerekir.',
      'Kağıt seans kartları evde unutulur, imzalar atlanır ve bir süre sonra "Benim 4 seansım kalmıştı, sizde neden 3 yazıyor?" tartışması yaşanır. Diğer taraftan uzmanların aynı lazer cihazını veya Hydrafacial kabinini aynı saate randevulaması merkezde bekleme kuyruğu oluşturur. Bu durum hem müşteri memnuniyetini hem de salonun prestijini doğrudan etkiler.',
      'Dükkânım Yanımda güzellik salonu programı, merkezlerin ihtiyaç duyduğu seans & paket sayacını, uzman ve kabin/oda planlamasını, taksit/veresiye alacak takibini, WhatsApp seans hatırlatmalarını ve personel prim hesaplarını tek bir mobil uyumlu panelde buluşturur. Üstelik pahalı kurulum bedelleri veya randevu başı komisyonlar olmadan 2 dakikada ücretsiz başlatılır.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Hizmet, Paket ve Uzmanlarını Kur',
        description:
          'Lazer epilasyon, cilt bakımı, kalıcı makyaj, kirpik ve tırnak hizmetlerini süreleriyle ekle; paket seans sayılarını tanımla.',
      },
      {
        step: '2',
        title: 'Müşteri Kartına Paket Aç ve Kabini Planla',
        description:
          'Müşteriye 6, 8 veya 10 seanslık paketi tanımla; uzman ve oda/cihaz uygunluğuna göre çakışmasız randevuları oluştur.',
      },
      {
        step: '3',
        title: 'Her Gelişte 1 Seans Düş, Taksit ve Primi İzle',
        description:
          'Seans tamamlandığında kalan hak otomatik düşsün; taksit ödemeleri ve uzman primleri akşam gün sonu kasasına işlensin.',
      },
    ],
    featureSections: [
      {
        heading: '6, 8 ve 10 Seanslık Lazer & Bakım Paketlerinde Dijital Sayaç',
        paragraphs: [
          'Müşterinize bir paket tanımladığınızda sistem toplam seans sayısını, kullanılan seansları ve kalan hakkı tarih damgasıyla tutar. Müşteri randevusunu tamamlayıp kabinden çıktığında tek tıkla 1 seans düşülür ve o gün işlemi hangi uzmanın yaptığı otomatik kaydedilir.',
          'Seans notu alanına cilt tipi, cihaz enerji/joule ayarı, hassasiyet veya kullanılan serum bilgilerini yazabilirsiniz. Böylece bir sonraki seansa farklı bir estetisyen girse bile müşterinin önceki işlem geçmişini saniyeler içinde okuyarak standart hizmet kalitesini korur.',
        ],
        bullets: [
          'Lazer epilasyon, bölgesel incelme ve cilt bakımı için esnek seans paket sayacı',
          'Her seans düşümünde tarih, saat, estetisyen ve işlem notlarının kalıcı arşivlenmesi',
          'Hediye kontrol seansları (+2 kontrol) için şeffaf takip imkanı',
          'Kağıt seans kartı kaybı ve "kaç seansım kaldı?" tartışmalarının tamamen bitmesi',
        ],
      },
      {
        heading: 'Estetisyen, Kabin ve Cihaz Çakışmalarını Önleyen Akıllı Takvim',
        paragraphs: [
          'Güzellik merkezlerinde çalışan uzman sayısından bağımsız olarak cihaz ve kabin sayısı gerçek kapasiteyi belirler. İki estetisyeniniz boş olsa bile merkezde tek bir buz lazer ya da tek bir Hydrafacial cihazı varsa aynı saatte iki randevu açıldığında kriz çıkar.',
          'Renk kodlu uzman ve oda planlaması sayesinde hangi uzmanın hangi kabinde veya cihazda çalıştığı tek bakışta görülür. İşlem sürelerine göre (örneğin protez tırnak 90 dk, ipek kirpik 120 dk, tüm vücut lazer 45 dk) takvim otomatik bloklandığı için koridorda bekleyen müşteri kalmaz.',
        ],
        bullets: [
          'Uzman ve kabin/cihaz bazlı çakışmasız randevu planlama',
          'İşlem süresine göre otomatik randevu aralıkları ve tampon süre imkanı',
          'Instagram biyografisine bağlanan /r/salon-adiniz linki ile 7/24 %0 komisyonlu randevu',
          'Tek tıkla manuel randevu ekleme ve saat erteleme kolaylığı',
        ],
      },
      {
        heading: 'Paket Taksitleri, Kapora ve Tahsilat Turu ile Güçlü Nakit Akışı',
        paragraphs: [
          'Güzellik merkezlerinde nakit akışının bozulmasının en sık nedeni, seansları düzenli yapılan ama taksit ödemesi ertelenen paketlerdir. Müşteri 6. seansa geldiğinde ikinci taksidinin hâlâ ödenmemiş olduğunu unutmak doğrudan kâr kaybına dönüşür.',
          'Dükkânım Yanımda her müşteri kartında kalan seans hakkı ile açık borç/taksit bakiyesini yan yana gösterir. Kısmi ödemeler nakit, POS veya IBAN olarak alındığı anda bakiyeden düşer. Vadesi geçen taksitler ise Tahsilat Turu ekranında listelenir; tek dokunuşla kibar WhatsApp hatırlatma mesajı göndererek alacaklarınızı zamanında tahsil edersiniz.',
        ],
        bullets: [
          'Kalan seans sayısı ve kalan paket taksit bakiyesinin tek müşteri kartında gösterimi',
          'Özel bakım ve kalıcı makyaj işlemlerinde kapora kaydı ve kalan tutar takibi',
          'Tahsilat Turu ile geciken paket taksitlerini büyükten küçüğe sıralayıp WhatsApp’tan hatırlatma',
          'Nakit, kredi kartı POS ve havale/FAST kanallarının gün sonu raporunda ayrı izlenmesi',
        ],
      },
      {
        heading: '35 Günlük Seans Döngüsü Hatırlatması ve No-Show Engelleme',
        paragraphs: [
          'Lazer epilasyonda ve profesyonel cilt bakımında doğru sonuç almak için 30–45 günlük periyotlara uyulması şarttır. Müşteri iş yoğunluğundan 2 ay boyunca randevu almadığında hem sonucundan tam memnun kalmaz hem de yeni paket alma ihtimali düşer.',
          'Müşterilerinizin son işlem tarihini takip ederek seans zamanı yaklaşanlara nazik bir hatırlatma mesajı ve doğrudan online randevu linkinizi iletebilirsiniz. Mevcut randevusuna 2 saat kala gönderilen teyit mesajıyla da son dakika gelmeme (no-show) kayıpları ortadan kalkar.',
        ],
        bullets: [
          'Randevu öncesi WhatsApp hatırlatma şablonlarıyla boş kabin kalmasını önleme',
          'Seans arası 35–45 günü aşan müşterileri görüp kontrol seansına davet etme',
          'Son seansı tamamlanan müşterilere idame bakım veya yeni bölge paketi önerme',
          '10’lu dijital sadakat kartı ile tek seanslık bakım müşterilerini müdavime dönüştürme',
        ],
      },
      {
        heading: 'Perakende Kozmetik Stoğu, Estetisyen Primi ve Patron Raporu',
        paragraphs: [
          'Güzellik merkezleri yalnızca hizmetten değil; işlem sonrasında önerilen güneş kremi, leke serumu, tırnak yağı ve bakım maskelerinden de ciddi ek ciro üretir. Bu ürünleri stok modülüne eklediğinizde her satışta stok otomatik düşer ve kritik seviyeye inen ürünlerde uyarı alırsınız.',
          'Akşam kapanışta estetisyenlerin yaptığı işlem adetleri, prim hakedişleri ve ürün satış cirosu tek ekranda toplanır. Patron Raporu size hangi uygulamanın (lazer, tırnak, kirpik ya da cilt bakımı) merkezinize en yüksek net kârı bıraktığını göstererek reklam bütçenizi doğru hizmete yönlendirmenizi sağlar.',
        ],
        bullets: [
          'Estetisyen başına işlem cirosu ve otomatik prim hesaplama',
          'Kabin sarf malzemeleri ve perakende kozmetik ürünleri için kritik stok alarmı',
          'En kârlı bakım hizmetlerini ve sakin günleri analiz eden Patron Raporu',
          'Bulut yedekleme ve şifreli veri koruması ile müşteri mahremiyeti güvencesi',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'Seans & Paket Takibi',
        oldWay: 'Kaybolan kağıt seans kartları, unutulan imzalar ve müşteriyle hak tartışmaları',
        newWay: 'Tarih ve uzman damgalı dijital sayaç; kalan seans ve notlar tek ekranda',
      },
      {
        title: 'Paket Taksit & Veresiye Kontrolü',
        oldWay: 'Ajandaya yazıldığı için unutulan taksitler ve geciken tahsilatlar',
        newWay: 'Seans sayacıyla yan yana görünen bakiye ve tek tık WhatsApp hatırlatma',
      },
      {
        title: 'Cihaz ve Kabin Çakışması',
        oldWay: 'Aynı lazer cihazına iki uzman randevu verince koridorda müşteri bekletmek',
        newWay: 'Süre bazlı ve renk kodlu takvim ile sıfır kabin/cihaz çakışması',
      },
      {
        title: 'Yazılım Maliyeti',
        oldWay: 'Yüksek kurulum ücreti, döviz bazlı abonelik ve SMS kontör zorunluluğu',
        newWay: 'Çırak paketi ₺0 ile başla; büyüdükçe ₺249–₺499 sabit TL paketler, %0 komisyon',
      },
    ],
    testimonials: [
      {
        name: 'Buse A.',
        shopAndCity: 'Güzellik & Lazer Merkezi · Ataşehir / İstanbul',
        quote:
          '8 seanslık paketlerde kağıt kartlar sürekli evde unutuluyordu. Şimdi müşteri kartını açtığımızda hem kalan seansını hem taksit bakiyesini anında görüyoruz.',
        rating: '5.0',
      },
      {
        name: 'Seda N.',
        shopAndCity: 'Cilt Bakımı & Protez Tırnak Stüdyosu · Çukurova / Adana',
        quote:
          'Instagram linkinden gece bile protez tırnak ve kirpik randevusu alınıyor. Estetisyen primlerini akşam hesaplamak 10 saniye sürüyor.',
        rating: '4.9',
      },
      {
        name: 'Tuğba M.',
        shopAndCity: 'Estetik & Güzellik Salonu · İzmit / Kocaeli',
        quote:
          'Kabin çakışmaları tamamen bitti. İptal olan seansların yerine WhatsApp’tan duyuru yapıp aynı gün boş odayı doldurabiliyoruz.',
        rating: '5.0',
      },
    ],
    faq: [
      {
        q: 'Lazer epilasyon için 6, 8 veya 10 seanslık farklı paketler açabilir miyiz?',
        a: 'Evet. Her müşteri için bölge ve hizmete göre dilediğiniz seans sayısında paket oluşturabilir, her gelişte tek dokunuşla 1 seans düşebilirsiniz.',
      },
      {
        q: 'Taksitli paket satan salonlarda ödenmemiş taksitleri nasıl görürüz?',
        a: 'Müşterinin kalan seans sayısıyla açık paket borcu aynı kartta listelenir. Ödeme günü geçenler Tahsilat Turu ekranında en üstte görünür.',
      },
      {
        q: 'Salonumuzda hem cilt bakımı hem tırnak hem de kalıcı makyaj var; hepsi destekleniyor mu?',
        a: 'Evet. Sınırsız kategori ve hizmet ekleyerek her uygulamanın süresini, fiyatını ve uzmanın prim oranını ayrı ayrı tanımlayabilirsiniz.',
      },
      {
        q: 'Müşteri bilgilerinin ve işlem notlarının gizliliği nasıl korunuyor?',
        a: 'Tüm veriler HTTPS şifreli bağlantıyla taşınır, yalnızca işletme sahibinin erişimine açıktır ve her gece otomatik yedeklenir.',
      },
      {
        q: 'Müşterilerimiz Instagram sayfamızdan doğrudan seans randevusu alabilir mi?',
        a: 'Evet. Salonunuza özel /r/salon-adiniz bağlantısını Instagram biyografinize ve hikayelerinize koyduğunuzda müşteriler boş saatleri görerek anında randevu oluşturur.',
      },
      {
        q: 'Estetisyenlerimizin aylık primleri malzeme veya işlem türüne göre takip edilir mi?',
        a: 'Evet. Patron VIP paketinde her uzman için ayrı prim oranı tanımlanır ve yapılan her işlem gün sonunda net hakediş raporuna dönüşür.',
      },
      {
        q: 'Merkezde sattığımız bakım kremlerinin stok takibini ayrı bir yazılımda mı tutmalıyız?',
        a: 'Hayır. Ürün stok ve kritik seviye uyarı modülü aynı panelde bulunur; adisyona eklenen her ürün stoktan otomatik düşer.',
      },
      {
        q: 'Mevcut müşteri ve seans defterimizi taşırken zorlanır mıyız?',
        a: 'Hayır. Aktif müşterilerinizi kalan seans ve bakiye bilgileriyle 5–10 dakika içinde kaydedip aynı gün kullanmaya başlayabilirsiniz.',
      },
      {
        q: 'Ücretsiz başlamak için kredi kartı girmemiz gerekiyor mu?',
        a: 'Hayır. Çırak paketi kredi kartı istemeden ₺0 ücretle açılır; dilediğiniz zaman Usta veya Patron VIP’e geçebilirsiniz.',
      },
    ],
    relatedLinks: [
      {
        label: 'Güzellik Salonunda Paket ve Seans Takibi (Blog)',
        href: '/blog/guzellik-salonunda-paket-seans-takibi',
        description: 'Kağıt seans kartlarını bırakıp dijital sayaç ve kabin planına geçiş rehberi.',
      },
      {
        label: 'Kuaför Randevu Programı',
        href: '/kuafor',
        description: 'Saç tasarımı ve renklendirme hizmetleri de veren karma salonlar için.',
      },
      {
        label: 'Online Randevu Sistemi',
        href: '/randevu-sistemi',
        description: 'Instagram ve Google Haritalar’dan 7/24 komisyonsuz randevu alma altyapısı.',
      },
      {
        label: 'Kuaförde No-Show Önleme Rehberi (Blog)',
        href: '/blog/kuafor-musteri-gelmeme-no-show-cozumu',
        description: 'Kapora ve iki aşamalı WhatsApp hatırlatma ile boş kabinleri bitirin.',
      },
    ],
  },

  '/randevu-sistemi': {
    key: '/randevu-sistemi',
    primaryKeyword: 'online randevu sistemi',
    badge: 'Tüm Randevulu İşletmeler İçin Hub Platform',
    h1: 'Online Randevu Sistemi: %0 Komisyonla 7/24 Kendi Linkinizden Randevu Toplayın',
    subtitle:
      'Berber, kuaför, güzellik salonu, teknik servis, terzi ve danışmanlık ofisleri için kurulumsuz online randevu motoru. Müşterileriniz uygulama indirmeden 15 saniyede randevu alsın.',
    ogImage: '/og/randevu-sistemi.png',
    introParagraphs: [
      'Randevu ile çalışan her işletmede günün en büyük verimlilik kaybı, telefon ve WhatsApp üzerinden yürütülen saat sorma trafiğidir. "Yarın akşam 18:00 boş mu?", "Hafta sonu hangi ustanın yeri var?", "Ücreti ne kadar?" gibi sorulara gün içinde onlarca kez yanıt vermek hem çalışanların odaklanmasını bozar hem de siz yanıt verene kadar müşterinin başka bir işletmeye yönelmesine yol açar.',
      'Dükkânım Yanımda online randevu sistemi, tüm randevulu sektörler için tek bir çatı platform olarak çalışır. Hesabınızı açtığınız anda dükkanınıza özel web adresi (dukkanimyanimda.com.tr/r/dukkan-adiniz) üretilir. Müşterileriniz hiçbir mobil uygulama indirmeden, şifre belirlemeden ve reklam ya da rakip listesi görmeden doğrudan sizin logonuz ve hizmet tarifenizle açılan sayfadan 7/24 randevu alır.',
      'Diğer rezervasyon pazaryerlerinin aksine getirdiğiniz veya zaten sahip olduğunuz müşterilerden %15–%20 komisyon kesilmez. Üstelik aynı platform içinde berber koltuk takibi, kadın kuaförü süre bloklaması, güzellik salonu seans sayacı, terzi prova randevusu veya teknik servis teslimat planlaması tek tıkla sektörünüze göre şekillenir.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Hizmetlerini, Sürelerini ve Saatlerini Belirle',
        description:
          'Sunduğun hizmetlerin adını, fiyatını ve dakikasını gir; haftanın çalışma günlerini ve molalarını tanımla.',
      },
      {
        step: '2',
        title: 'Özel /r/dukkan-adiniz Linkini Her Yere Bağla',
        description:
          'Oluşan randevu sayfanı Instagram biyografine, Google İşletme Profiline, WhatsApp durumuna ve vitrin QR koduna yerleştir.',
      },
      {
        step: '3',
        title: 'Otomatik Teyit Al, Kasayı ve Primi Kapat',
        description:
          'Gelen randevular çakışmasız şekilde takvimine düşsün; WhatsApp hatırlatmasıyla no-show kaybını önle ve akşam kasayı tek tıkla kapat.',
      },
    ],
    featureSections: [
      {
        heading: 'Markanıza Özel Web Randevu Sayfası — Sıfır Komisyon, Sıfır Rakip',
        paragraphs: [
          'Klasik randevu pazaryerlerine girdiğinizde müşteriniz sizin sayfanızın hemen altında "Benzer Yakın Salonlar" başlığıyla rakiplerinizi görür. Üstelik kendi Instagram sayfanızdan yönlendirdiğiniz bir müşteri bile o platform üzerinden randevu aldığında komisyon faturasıyla karşılaşabilirsiniz.',
          'Dükkânım Yanımda’da ise bağlantınız yalnızca sizin dükkanınıza aittir. Sayfanın tepesinde dükkanınızın logosu, konumu, açık saatleri, hizmet listesi ve varsa onaylı müşteri yorumlarınız yer alır. Tüm gelirinizin %100’ü doğrudan sizin kasanızda kalır; hiçbir aracı komisyonu yoktur.',
        ],
        bullets: [
          'Her dükkana özel temiz URL yapısı (/r/dukkan-adiniz ve /dukkan-adiniz/randevu)',
          'Tüm paketlerde %0 online randevu komisyonu ve sıfır gizli kesinti',
          'Müşterinin uygulama indirmeden 15 saniyede randevu oluşturduğu mobil tasarım',
          'Google arama motorlarına uyumlu ReserveAction ve LocalBusiness yapısal veri desteği',
        ],
      },
      {
        heading: 'Instagram, WhatsApp ve Google Haritalar İçin Tek Merkez',
        paragraphs: [
          'Müşterileriniz size artık farklı kanallardan ulaşıyor: Biri Google Haritalar’da "yakınımdaki kuaför" araması yapıyor, diğeri Instagram Reels videonuzdan profilinize geliyor, bir başkası WhatsApp’tan mesaj atıyor. Tüm bu kanalları tek bir linkte topladığınızda dağınıklık tamamen biter.',
          'WhatsApp İşletme hesabınızın otomatik karşılama mesajına randevu linkinizi koyduğunuzda gece 23:45’te mesaj atan müşteri bile siz uyurken boş saati görüp randevusunu kesinleştirir. Google Haritalar profilinizdeki "Randevu Al" alanına da aynı bağlantıyı ekleyerek aramalardan gelen trafiği anında müşteriye çevirirsiniz.',
        ],
        bullets: [
          'Instagram bio ve Story "Bağlantı" çıkartmasına uygun hızlı açılış',
          'Google İşletme Profili randevu butonu entegrasyonuna tam uyum',
          'WhatsApp Business otomatik yanıtı ile 7/24 müşteriyi takvime yönlendirme',
          'Dükkan vitrini veya tezgahı için yüksek hata düzeltmeli ücretsiz QR kod çıktısı',
        ],
      },
      {
        heading: 'Sektörlere Göre Özelleşen Akıllı Takvim ve Çakışma Kalkanı',
        paragraphs: [
          'Her işletmenin randevu mantığı aynı değildir. Bir berberde 30 dakikalık saç kesimi ile 45 dakikalık saç-sakal paketi hızlı dönerken, bir kadın kuaföründe ombre işlemi 180 dakika sürer. Bir güzellik merkezinde ise estetisyenin yanında lazer cihazı veya kabin uygunluğu da önemlidir. Terzi ve avukatlık bürolarında prova ya da danışma saatleri öne çıkar.',
          'Online randevu sistemimiz sektörünüze göre esner: Hizmetlere süre tanımlarsınız, birden fazla personeliniz varsa her çalışana ayrı takvim açarsınız ve bir saat dolduğunda o aralık diğer müşterilere anında kapanır. Telefonla veya yürüyerek gelen müşteriyi de siz 5 saniyede aynı takvime ekleyerek tam senkron sağlarsınız.',
        ],
        bullets: [
          'Berber, kuaför, güzellik salonu, terzi, teknik servis ve danışmanlık için tek altyapı',
          'İşlem süresine göre otomatik saat bloklama ve çifte rezervasyonu engelleme',
          'Çoklu usta/uzman seçimi ve kişiye özel çalışma/izin günü tanımlama',
          'Manuel telefon randevularıyla online randevuların aynı takvimde anlık eşitlenmesi',
        ],
      },
      {
        heading: 'WhatsApp Teyit, Kapora ve No-Show Önleme Araçları',
        paragraphs: [
          'Randevuyu almak işin yarısıdır; müşterinin tam saatinde koltuğa veya masaya gelmesi ise işin diğer yarısıdır. Unutkanlık nedeniyle boş kalan her randevu saati doğrudan ciro kaybıdır. Dükkânım Yanımda, randevusu yaklaşan müşterilere tek dokunuşla gönderebileceğiniz hazır WhatsApp hatırlatma şablonları içerir.',
          'Ayrıca yüksek tutarlı veya uzun süreli işlemlerde (gelin başı, damat tıraşı, cihaz bakım sözleşmesi vb.) alınan FAST/IBAN veya nakit kaporayı müşteri kartına işleyebilirsiniz. Müşteri gelmeyeceğini erken bildirdiğinde boşalan saat anında takvimde yeniden açılır.',
        ],
        bullets: [
          'Randevudan 2 saat önce tek tıkla WhatsApp teyit ve konum hatırlatma mesajı',
          'Ön ödeme ve kapora kayıtlarının müşteri bakiyesinden otomatik düşülmesi',
          'Tekrarlayan no-show müşterileri not etiketiyle kolayca fark etme',
          'Boş kalan ölü saatlere özel flaş duyuru mesajı şablonları',
        ],
      },
      {
        heading: 'Randevudan Kasaya, Sadakat Kartından Prim Hesabına Tek Akış',
        paragraphs: [
          'Birçok randevu yazılımı yalnızca takvim sunar; müşteri dükkandan çıkarken ödemeyi almak, veresiye yazmak veya ustanın primini hesaplamak için başka bir defter açmanız gerekir. Dükkânım Yanımda’da ise tamamlanan her randevu tek tuşla satışa dönüşür: Nakit, kredi kartı, havale veya veresiye olarak kasaya işlenir.',
          'İşlemi yapan personelin primi otomatik hesaplanır, müşterinin 10’lu dijital sadakat kartına 1 damga daha eklenir ve gün sonunda nakit/POS toplamı hazır önünüze gelir. Çırak paketiyle ayda 20 online randevuya kadar ₺0 ücretle başlayıp büyüdükçe Usta (₺249/ay) veya sınırsız Patron VIP (₺499/ay) paketlerine geçebilirsiniz.',
        ],
        bullets: [
          'Tamamlanan randevuyu 1 dokunuşla kasaya veya veresiye defterine aktarma',
          'Otomatik personel prim dağılımı ve 10’lu dijital sadakat kartı',
          'Çırak paketi ile kredi kartsız süresiz ücretsiz başlangıç (ayda 20 online randevu)',
          'Patron VIP ile sınırsız online randevu, çoklu personel ve 500 otomatik bildirim desteği',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'Müşteri Komisyonu',
        oldWay: 'Pazaryeri uygulamalarında %15–%25 arası randevu komisyonu ve reklam baskısı',
        newWay: '%0 komisyon — kendi linkinizden gelen tüm müşteriler %100 sizin',
      },
      {
        title: 'Müşteri Deneyimi',
        oldWay: 'Uygulama indirme, şifre oluşturma veya WhatsApp’ta 6 mesaj cevap bekleme',
        newWay: 'Linke tıkla, hizmet ve saati seç — 15 saniyede tarayıcıdan kesin randevu',
      },
      {
        title: 'Sektörel Derinlik',
        oldWay: 'Sadece takvim gösteren, kasa, prim ve veresiyeden kopuk genel araçlar',
        newWay: 'Randevu + Prim + Veresiye + Sadakat Kartı + Gün Sonu tek panelde',
      },
      {
        title: 'Fiyat Şeffaflığı',
        oldWay: 'Kısa deneme süresi sonrası yüksek kontör ve dolar bazlı sürpriz faturalar',
        newWay: 'Süresiz ücretsiz Çırak (₺0), Usta (₺249/ay) ve Patron VIP (₺499/ay) sabit TL',
      },
    ],
    testimonials: [
      {
        name: 'Tuncay E.',
        shopAndCity: 'Erkek Kuaförü & Bakım Stüdyosu · Bakırköy / İstanbul',
        quote:
          'Google Haritalar profilimize randevu linkimizi ekledik, sadece oradan ayda 40’tan fazla yeni müşteri geliyor ve bir kuruş komisyon ödemiyoruz.',
        rating: '5.0',
      },
      {
        name: 'Melis V.',
        shopAndCity: 'Güzellik & Tırnak Merkezi · Konak / İzmir',
        quote:
          'WhatsApp Business otomatik yanıtına linki koyduğumuz gün akşam DM trafiğimiz bıçak gibi kesildi. Müşteriler saatlerini kendi seçiyor.',
        rating: '5.0',
      },
      {
        name: 'Ahmet Ç.',
        shopAndCity: 'Berber Salonu · Merkez / Zonguldak',
        quote:
          'Çırak paketiyle ücretsiz denedik, 10 gün içinde tüm müşteriler alışınca Patron VIP’e geçtik. İki koltuğun randevusu da primi de artık hiç karışmıyor.',
        rating: '4.9',
      },
    ],
    faq: [
      {
        q: 'Online randevu sistemi hangi sektörler için uygundur?',
        a: 'Berberler, kadın/unisex kuaförler, güzellik ve lazer merkezleri, tırnak stüdyoları, terzi prova randevuları, teknik servis teslimat saatleri ve hukuk/danışmanlık görüşmeleri için uygundur.',
      },
      {
        q: 'Müşterilerin randevu almak için üye olması veya uygulama indirmesi gerekir mi?',
        a: 'Hayır. Müşteriniz hiçbir şey indirmeden telefon tarayıcısı üzerinden adını, telefonunu, hizmeti ve saati seçerek 15 saniyede randevusunu oluşturur.',
      },
      {
        q: 'Kişiye özel randevu linkim nasıl görünür?',
        a: 'Kayıt olduğunuzda işletme adınıza göre dukkanimyanimda.com.tr/r/dukkan-adiniz şeklinde kısa ve akılda kalıcı bir web adresiniz anında hazırlanır.',
      },
      {
        q: 'Online randevulardan komisyon kesiliyor mu?',
        a: 'Kesinlikle hayır. Tüm paketlerimizde randevu komisyonu %0’dır.',
      },
      {
        q: 'Ben dükkandayken telefonla veya kapıdan randevu alırsam online takvim güncellenir mi?',
        a: 'Evet. Panelden eklediğiniz her randevu o saat aralığını online sayfada saniyesinde kapatır, çakışma oluşmaz.',
      },
      {
        q: 'Gelmeyen (no-show) müşterileri azaltmak için sistem nasıl yardımcı olur?',
        a: 'Hazır WhatsApp hatırlatma şablonlarıyla randevu öncesi tek dokunuşla teyit mesajı atabilir, özel işlemlerde kapora kaydı tutabilirsiniz.',
      },
      {
        q: 'Çalışma saatlerimi ve kapalı günlerimi istediğim an değiştirebilir miyim?',
        a: 'Evet. Haftalık çalışma günlerinizi, öğle aralarınızı ve resmi tatil/izin günlerinizi panelden saniyeler içinde güncelleyebilirsiniz.',
      },
      {
        q: 'Ücretsiz pakette kaç online randevu alabilirim?',
        a: 'Çırak paketi ile her ay 20 online randevuya kadar süresiz ücretsiz kullanabilirsiniz. Daha yoğun işletmeler için Usta (ayda 60 randevu, ₺249/ay) ve Patron VIP (sınırsız randevu, ₺499/ay) paketleri mevcuttur.',
      },
      {
        q: 'Instagram veya Google Haritalar’a linki bağlamak zor mu?',
        a: 'Çok kolaydır. Panelinizde hazır "Linki Kopyala" butonu vardır; kopyalayıp Instagram "Web Sitesi/Bağlantılar" veya Google İşletme Profili randevu alanına yapıştırmanız yeterlidir.',
      },
    ],
    relatedLinks: [
      {
        label: 'Berber Randevu Sistemi',
        href: '/berber',
        description: 'Erkek kuaförleri ve berber salonları için koltuk sırası ve usta primi.',
      },
      {
        label: 'Kuaför Randevu Programı',
        href: '/kuafor',
        description: 'Boya, kesim, fön süre bloklaması ve gelin başı kapora yönetimi.',
      },
      {
        label: 'Güzellik Salonu Programı',
        href: '/guzellik-salonu',
        description: '6–8 seanslık paket sayacı, kabin planı ve taksit takibi.',
      },
      {
        label: 'İzmit Berber Randevu',
        href: '/izmit-berber-randevu',
        description: 'İzmit ve Kocaeli bölgesindeki berber salonlarına özel yerel çözüm.',
      },
      {
        label: 'Zonguldak Berber Randevu',
        href: '/zonguldak-berber-randevu',
        description: 'Zonguldak Merkez ve Kdz. Ereğli salonlarına özel yerel çözüm.',
      },
      {
        label: 'Ücretsiz Randevu Uygulamaları Karşılaştırması 2026 (Blog)',
        href: '/blog/ucretsiz-randevu-uygulamalari-karsilastirmasi-2026',
        description: 'Gizli komisyonlar olmadan doğru randevu yazılımını seçme rehberi.',
      },
    ],
  },

  '/veresiye-defteri': {
    key: '/veresiye-defteri',
    primaryKeyword: 'veresiye defteri uygulaması',
    badge: 'Kayıpsız Cari & Tahsilat Yönetimi',
    h1: 'Veresiye Defteri Uygulaması: Açılış Bakiyesiyle Dijitale Geçin, Alacakları Hızlı Toplayın',
    subtitle:
      'Yıpranan kağıt veresiye defterine veda edin. Müşteri borçlarını tarihli kaydedin, Tahsilat Turu ve tek tıkla kibar WhatsApp borç ekstresi ile unutulan alacakları kolayca tahsil edin.',
    ogImage: '/og/veresiye-defteri.png',
    introParagraphs: [
      'Mahalle bakkalından şarküteriye, berberden terziye, nalburdan oto tamircisine kadar Türkiye esnafının önemli bir kısmı güvene dayalı ticaret yapar. "Ay başında maaş yatınca öderim" ya da "Cumartesi uğrayıp bırakırım" diyen komşu müşteriler esnafın sadık kitlesidir. Ancak bu güvenin yazılı ve şeffaf bir düzene oturtulmadığı her dükkanda, yıl sonunda binlerce liralık alacak kaybı sessizce sermayeden erir.',
      'Kağıt veresiye defterleri bir süre sonra yıpranır, sayfaları kopar, aynı isme sahip iki müşterinin hesabı karışır ve kısmi ödemeler üstü çizilerek düşüldüğü için toplam tutar okunmaz hale gelir. Üstelik müşteri borcunun detayını sorduğunda sayfalar arasında 10 dakika arama yapmak zorunda kalırsınız; defter dükkan dışında yanınızda olmadığı için de gelen bir ödemeyi anında düşemezsiniz.',
      'Dükkânım Yanımda veresiye defteri uygulaması, kağıt defterin sadeliğini koruyup tüm risklerini ortadan kaldırır. Eski defterinizdeki bakiyeleri tek işlemde "Açılış Bakiyesi" olarak aktarıp 5 dakikada dijitale geçersiniz. Her yeni veresiye satış ve tahsilat tarih damgasıyla bulutta saklanır; ödeme zamanı geldiğinde ise Tahsilat Turu ekranından tek tıkla WhatsApp üzerinden kibar hesap ekstresi gönderirsiniz.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Müşterileri Ekle ve Açılış Bakiyesini Gir',
        description:
          'Kağıt defterdeki eski fişleri tek tek yazmadan müşterinin güncel toplam borcunu "Açılış Bakiyesi" olarak tanımla.',
      },
      {
        step: '2',
        title: 'Borç Yazdırırken veya Tahsilatta Tek Dokunuş',
        description:
          'Her yeni veresiye tutarını ürün/hizmet notuyla ekle; nakit, kart veya IBAN ile ödeme geldiğinde bakiyeden anında düş.',
      },
      {
        step: '3',
        title: 'Tahsilat Turu ile WhatsApp’tan Hatırlat',
        description:
          'Borçluları büyükten küçüğe sırala; tek tıkla kibar dükkan ağzıyla hazırlanmış borç özetini WhatsApp üzerinden paylaş.',
      },
    ],
    featureSections: [
      {
        heading: 'Kağıt Defterden 5 Dakikada Kayıpsız Dijital Geçiş (Açılış Bakiyesi)',
        paragraphs: [
          'Esnafın dijital veresiye defterine geçerken en çok çekindiği konu "Defterimdeki yüzlerce eski satırı tek tek nasıl geçireceğim?" düşüncesidir. Bunun için geçmiş yılın bütün kalemlerini girmenize gerek yoktur. Her müşteriyi ad, soyad ve telefon numarasıyla ekleyip kağıt defterde yazan net kalan borcunu tek kalemde Açılış Bakiyesi olarak girmeniz yeterlidir.',
          'Böylece onlarca müşteriyi bir çay molasında sisteme aktarır, eski defteri de kenara kaldırırsınız. O günden itibaren yapılan her alışveriş ve her kısmi ödeme tarih ve saat damgasıyla alt alta sıralanır; kimseyle "Ben şunu ödemiştim, neden düşülmemiş?" tartışması yaşamazsınız.',
        ],
        bullets: [
          'Eski fişleri tek tek yazmadan tek işlemde toplam açılış borcu tanımlama',
          'Müşteri adı, lakabı veya telefon numarasıyla 2 saniyede cari kart bulma',
          'Tarih ve saat damgalı şeffaf borç–ödeme işlem geçmişi',
          'Telefon kaybolsa veya bozulsa bile silinmeyen otomatik gece bulut yedeklemesi',
        ],
      },
      {
        heading: 'Tahsilat Turu: Büyükten Küçüğe Borç Sıralama ve Vade Kontrolü',
        paragraphs: [
          'Aylık alacakların %80’i genellikle listenizdeki en yüksek borçlu veya en uzun süredir ödeme yapmamış ilk 10–15 müşteride toplanır. Kağıt defterde ise bu kişiler yüzlerce sayfa arasına dağıldığı için küçük borçlarla uğraşırken asıl büyük alacaklar gözden kaçar.',
          'Tahsilat Turu özelliği tüm borçlu müşterilerinizi tutara ve son ödeme tarihine göre sıralı olarak önünüze getirir. Kimin maaş günü yaklaştı, kim 30 gündür ödeme yapmadı tek ekranda görürsünüz. Böylece tahsilat planınızı tesadüfe değil, net verilere göre yönetirsiniz.',
        ],
        bullets: [
          'Toplam veresiye alacağınızı ve en borçlu müşterileri tek ekranda görme',
          'Vade tarihi ve müşteri notlarıyla ödeme sözü verilen günleri hatırlama',
          'Düzenli ödeyen müşteriler ile geciktirenler için risk/limit notu tutma',
          'Ay sonunda kapı kapı dolaşmadan tahsilat hızını belirgin şekilde artırma',
        ],
      },
      {
        heading: 'Müşteriyi Kırmadan Alacak İsteme: Tek Tık WhatsApp Borç Ekstresi',
        paragraphs: [
          'Mahalle esnafı için komşusuna veya müdavimine yüz yüze "Borcun birikti, ne zaman ödeyeceksin?" demek her zaman zordur. Çoğu zaman mahcubiyetten ertelenen bu konuşmalar yüzünden esnaf kendi toptancısına ödeme yapmakta zorlanır.',
          'Dükkânım Yanımda, müşteri kartından "WhatsApp ile Hatırlat" dediğiniz anda kibar, saygılı ve dükkan adına yazılmış bir hesap özeti mesajı hazırlar. Mesajda güncel bakiye ve son işlem tarihi netçe yazar; dilerseniz IBAN bilginizi de ekleyerek müşteriye dükkana gelmeden FAST ile ödeme kolaylığı sunarsınız.',
        ],
        bullets: [
          'Sert veya kırıcı olmayan, nazik ve kurumsal Türkçe hatırlatma şablonları',
          'Güncel toplam borç ve son işlem tarihinin mesaj içinde otomatik yer alması',
          'Dükkana gelemeyen müşteriler için IBAN/FAST ödeme kolaylığı sunma',
          'Gönderilen hatırlatma geçmişini takip edebilme',
        ],
      },
      {
        heading: 'Veresiye ve Günlük Kasa Dengesini Otomatik Koruma',
        paragraphs: [
          'Bir müşteri tezgahtan 750 TL’lik alışverişi veresiye aldığında ciro yapılmış olur ama kasanızdaki nakit para artmaz. Tam tersi olarak, geçen aydan kalan 2.000 TL veresiye borcunu nakit ödediğinde o gün yeni mal satmasanız bile çekmecenize 2.000 TL nakit girer. Kağıt defterle bu iki hareketi kasa hesabından ayırmak neredeyse imkansızdır.',
          'Sistemimizde veresiye satış tutarları nakit kasa bakiyesini şişirmez; yalnızca müşteriden tahsilat girildiği anda seçilen ödeme yöntemine (Nakit, Kredi Kartı POS veya Havale/IBAN) göre kasa raporuna artı olarak eklenir. Bu sayede akşam kasa sayımınız kuruşu kuruşuna tutar.',
        ],
        bullets: [
          'Veresiye satış ile fiili nakit tahsilatının kasa raporunda doğru ayrıştırılması',
          'Tahsilatın nakit, kart veya havale/FAST kanalıyla kasaya otomatik yansıması',
          'Kısmi ödemelerde kalan net borcun anlık güncellenmesi',
          'Barkodlu hızlı satış sepetini tek dokunuşla müşterinin veresiyesine aktarabilme',
        ],
      },
      {
        heading: 'Tedarikçi Borcu, Stok Bağlantısı ve Güvenli Veri Sahipliği',
        paragraphs: [
          'Veresiye sadece müşterilerden alacaklarınızdan ibaret değildir; esnaf aynı zamanda toptancıya ve tedarikçiye olan kendi borçlarını da yönetmek zorundadır. Aynı panelde tedarikçi cari kartlarını açıp vade günlerini görebilir, yaptığınız ödemeleri kasadan düşerek hem alacağınızı hem borcunuzu tek terazide tutarsınız.',
          'Tüm müşteri borç ve tahsilat kayıtlarınız yalnızca size aittir. Kayıtlar şifreli bağlantıyla saklanır, isterseniz tek tıkla yedek dosyasını indirirsiniz. Üstelik Çırak paketiyle 25 müşteriye kadar ücretsiz başlayabilir; müşteri sayınız arttıkça Usta (100 müşteri — ₺249/ay) veya sınırsız Patron VIP (₺499/ay) planına geçebilirsiniz.',
        ],
        bullets: [
          'Müşteri alacaklarının yanında toptancı/tedarikçi cari borçlarını da tek panelde izleme',
          'Tek dosyada yedek indirme ve geri yükleme özelliği',
          'Çırak paketiyle 25 müşteri kotasına kadar süresiz ₺0 kullanım',
          'Bakkal, berber, kafe, terzi ve teknik servis dahil tüm sektörlerde çalışabilme',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'Kayıt Güvenliği',
        oldWay: 'Kaybolan, ıslanan veya sayfaları yırtılan tek kopya kağıt veresiye defteri',
        newWay: 'Şifreli bulutta saklanan, her gece otomatik yedeklenen kalıcı dijital kayıt',
      },
      {
        title: 'Hesap Tartışmaları',
        oldWay: 'Üstü karalanmış kısmi ödemeler yüzünden müşteriyle bakiye anlaşmazlığı',
        newWay: 'Tarih, saat ve ürün açıklamalı şeffaf işlem satırları',
      },
      {
        title: 'Tahsilat Hızı',
        oldWay: 'Yüz yüze borç istemeye çekindiği için aylarca bekleyen alacaklar',
        newWay: 'Tahsilat Turu ve tek tıkla kibar WhatsApp hesap ekstresi',
      },
      {
        title: 'Kasa Mutabakatı',
        oldWay: 'Veresiyeden gelen tahsilatla günlük nakit satışın kasada birbirine karışması',
        newWay: 'Veresiye tahsilatları ödeme türüne göre (nakit/IBAN/POS) kasaya otomatik işlenir',
      },
    ],
    testimonials: [
      {
        name: 'İsmail K.',
        shopAndCity: 'Mahalle Bakkalı · Yıldırım / Bursa',
        quote:
          '20 yıllık kareli defterden korkarak geçtim ama açılış bakiyesiyle 15 dakikada tüm mahalleyi aktardım. İlk hafta WhatsApp özeti attığım 6 kişiden tahsilat geldi.',
        rating: '5.0',
      },
      {
        name: 'Ramazan Ö.',
        shopAndCity: 'Nalbur & Hırdavat · Gebze / Kocaeli',
        quote:
          'Ustalar malzeme alıp ay sonu ödüyor. Eskiden kimin ne aldığı kağıtlarda kaybolurdu, şimdi telefon numarasından 2 saniyede tüm dökümü çıkarıp WhatsApp’tan atıyorum.',
        rating: '4.9',
      },
      {
        name: 'Funda S.',
        shopAndCity: 'Terzi & Kuru Temizleme · Yenimahalle / Ankara',
        quote:
          'Teslim edip "yarın bırakırım" diyenlerin listesi eskiden unutuluyordu. Şimdi Tahsilat Turu listesi önüme diziyor, kibar mesajla kimse kırılmadan ödüyor.',
        rating: '5.0',
      },
    ],
    faq: [
      {
        q: 'Kağıt veresiye defterindeki eski borçları tek tek ürün bazında girmem şart mı?',
        a: 'Hayır. Eski kağıt defterinizdeki müşterinin o günkü toplam net borcunu tek satırda "Açılış Bakiyesi" olarak tanımlamanız yeterlidir. O andan sonraki tüm yeni alışveriş ve ödemeler detaylı olarak işlenir.',
      },
      {
        q: 'Müşteri borcunun bir kısmını ödediğinde kalan bakiye otomatik güncellenir mi?',
        a: 'Evet. Örneğin 1.800 TL borcu olan müşteri 600 TL nakit veya havale ödediğinde, tahsilatı girdiğiniz an güncel borcu 1.200 TL olarak görünür ve kasaya 600 TL eklenir.',
      },
      {
        q: 'WhatsApp borç hatırlatma mesajı müşteriyi rahatsız edecek sert bir dille mi gidiyor?',
        a: 'Hayır. Şablonlarımız esnaf nezaketine uygun, samimi ve profesyonel bir Türkçe ile hazırlanmıştır; göndermeden önce mesajı WhatsApp ekranınızda görüp isterseniz düzenleyebilirsiniz.',
      },
      {
        q: 'Ücretsiz veresiye defteri paketinde kaç müşteri kaydedebilirim?',
        a: 'Çırak paketi ile 25 müşteriye kadar kredi kartı gerekmeden süresiz ücretsiz kullanabilirsiniz. Daha fazla müşteri için Usta (100 müşteri — ₺249/ay) ve Patron VIP (sınırsız — ₺499/ay) seçenekleri mevcuttur.',
      },
      {
        q: 'Telefonum bozulursa veya değiştirirsem veresiye kayıtlarım gider mi?',
        a: 'Hayır. Kayıtlarınız bulut sunucularda tutulur ve her gece otomatik yedeklenir; yeni telefonunuzdan numaranızla giriş yaptığınızda tüm müşteri borçlarınız eksiksiz açılır.',
      },
      {
        q: 'Müşteri başına veresiye limiti belirleyebilir miyim?',
        a: 'Evet. Müşteri cari kartının notlar bölümüne belirlediğiniz limiti yazabilir, satış sırasında güncel bakiyesini anında görerek kontrollü satış yapabilirsiniz.',
      },
      {
        q: 'Hem bakkal/market barkodlu satış hem veresiye aynı anda kullanılıyor mu?',
        a: 'Evet. Telefon kameranızla barkodu okutup sepeti oluşturduktan sonra "Veresiye Yaz" seçeneğiyle tutarı doğrudan müşterinin cari kartına işleyebilirsiniz.',
      },
      {
        q: 'Müşteriye hesap dökümünü verirken önceki alışveriş tarihleri görünür mü?',
        a: 'Evet. Her borç ekleme ve tahsilat işlemi tarih, saat ve açıklama notuyla kalıcı olarak saklandığı için tam geçmişi her an gösterebilirsiniz.',
      },
      {
        q: 'Kendi dükkan dışı toptancı borçlarımı da takip edebilir miyim?',
        a: 'Evet. Tedarikçi cari defteri modülü sayesinde toptancılara olan borçlarınızı ve ödeme vadelerinizi de aynı panelden takip edebilirsiniz.',
      },
    ],
    relatedLinks: [
      {
        label: 'Veresiye Defteri Nasıl Tutulur? (Blog)',
        href: '/blog/veresiye-defteri-nasil-tutulur',
        description: 'Kağıttan dijitale geçiş, tahsilat psikolojisi ve kasa dengesi rehberi.',
      },
      {
        label: 'Bakkal & Market Barkodlu POS Sistemi',
        href: '/bakkal-market',
        description: 'Kamera ile barkod okutma, kritik stok ve veresiye bağlantısı.',
      },
      {
        label: 'Esnaf Kasa Takip Programı',
        href: '/kasa-programi',
        description: 'Veresiye tahsilatlarını nakit, kart ve havale kasasıyla birleştirin.',
      },
      {
        label: 'Gün Sonu Z Raporu Programı',
        href: '/gun-sonu-raporu',
        description: 'Akşam 30 saniyede kasa sayımı ve günlük ciro kapanışı.',
      },
    ],
  },

  '/kasa-programi': {
    key: '/kasa-programi',
    primaryKeyword: 'esnaf kasa takip programı',
    badge: 'Gelir, Gider & Kârlılık Kontrol Merkezi',
    h1: 'Esnaf Kasa Takip Programı: Nakit, POS, Havale ve Giderler Tek Kasada',
    subtitle:
      'Çok çalışıp ay sonunda "Para nereye gitti?" diye sormayın. Dört ödeme kanalını ayrı izleyin, fişsiz küçük masrafları 3 saniyede işleyin ve gerçek net kârınızı görün.',
    ogImage: '/og/kasa-programi.png',
    introParagraphs: [
      'Bir işletme için gün içinde kasaya para girmesi kadar, o paranın nereden geldiğinin ve nereye gittiğinin bilinmesi de hayati önem taşır. Çekmecede nakit varken, banka hesabına IBAN ödemeleri düşerken, POS cihazı ayrı gün sonu verirken ve kasadan gün içinde çay, temizlik, nakliye ya da malzeme ödemeleri yapılırken tüm bu hareketleri kafadan veya kağıt parçalarından takip etmek imkansızdır.',
      'Dükkânım Yanımda esnaf kasa takip programı, küçük ve orta ölçekli işletmelerin günlük finansını muhasebe terimlerine boğmadan sadeleştirmek için tasarlanmıştır. Satış ya da gider girerken karmaşık hesap kodları aramazsınız; 3 saniyede tutarı, açıklamayı ve ödeme türünü (Nakit, Kredi Kartı POS, Havale/FAST veya Veresiye) seçersiniz.',
      'Sistem şahsi çekimlerinizle dükkan giderlerini ayırmanızı sağlar, tedarikçi vade borçlarını kasaya bağlar ve Patron Raporu ile haftanın hangi günlerinin yüksek kârlı, hangi günlerinin zayıf geçtiğini önünüze koyar. Tek elle mobilde çalıştığı için tezgah arkasında da evde de kasaya tam hakim olursunuz.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Kasa Açılış Bakiyeni Belirle',
        description:
          'Sabah çekmecede bıraktığın bozuk para avansını sabitle ve nakit, POS, banka kanallarını ayırmaya başla.',
      },
      {
        step: '2',
        title: 'Satış ve Masrafları 3 Saniyede İşle',
        description:
          'Nakit, kart, IBAN satışlarını ve dükkan içi küçük harcamaları (malzeme, fatura, yemek, tamir) tek dokunuşla gir.',
      },
      {
        step: '3',
        title: 'Patron Raporu ile Gerçek Kârı Gör',
        description:
          'Akşam gün sonunu kapat, haftalık ve aylık gelir–gider dengeni izleyerek veriye dayalı kararlar al.',
      },
    ],
    featureSections: [
      {
        heading: 'Nakit, Kredi Kartı POS, IBAN ve Veresiye Kanallarını Ayrı İzleme',
        paragraphs: [
          'Küçük esnafta kasa hesabının şaşmasının bir numaralı nedeni tüm ödemelerin tek kalem altında toplanmasıdır. Müşteri 600 TL’yi IBAN üzerinden attığında ya da POS cihazından çektiğinde çekmecedeki fiziksel nakit artmaz. Ancak bunlar birbirinden ayrılmazsa akşam çekmeceyi sayan dükkan sahibi sürekli eksik para gördüğünü sanır.',
          'Dükkânım Yanımda her satış ve tahsilat girişinde ödeme kanalını tek dokunuşla seçtirir. Böylece gün içinde çekmecenizde bulunması gereken nakit miktarı ayrı, POS slip toplamı ayrı, banka hesabınıza düşen IBAN/FAST tutarları ayrı ve veresiye alacaklarınız ayrı sütunlarda anlık toplanır.',
        ],
        bullets: [
          'Nakit Kasa: Çekmece giriş-çıkışı ve fiziksel para sayımıyla birebir takip',
          'Kredi Kartı / POS: Gün sonu slip toplamıyla saniyeler içinde mutabakat',
          'Havale / EFT / FAST: Banka hesabına gelen ticari ödemelerin ayrı listelenmesi',
          'Veresiye Ayrımı: Nakde dönmemiş satışların çekmece bakiyesini yanıltmaması',
        ],
      },
      {
        heading: 'Küçük Masraflar ve Şahsi Çekimleri Kaçırmayan Gider Takibi',
        paragraphs: [
          'Ay sonunda kârın beklenenden düşük çıkmasının arkasında çoğu zaman kayıt altına alınmayan günlük harcamalar vardır. Çırak marketten çay-şeker alır, kuryeye 150 TL ödenir, cam silmeye deterjan alınır veya dükkan sahibi ev ihtiyacı için kasadan 1.000 TL çeker. Bu tutarlar deftere işlenmezse ay sonunda dükkanın gerçek kârlılığı tamamen yanlış okunur.',
          'Kasa programımızda gider eklemek en az satış eklemek kadar hızlıdır. Kira, Elektrik/Su, Malzeme Alımı, Personel/Prim, Kargo/Ulaşım ve Patron Çekimi gibi net kategorilerle her çıkışı saniyeler içinde kaydeder, muhasebecinize ve kendi cebinize karşı tam şeffaflık sağlarsınız.',
        ],
        bullets: [
          'Kategorize edilmiş hızlı gider girişi (malzeme, fatura, kira, personel, bakım)',
          'Patronun şahsi çekimlerini dükkan giderinden ayırarak gerçek işletme kârını ölçme',
          'Ödenen usta/kalfa primlerinin ve avansların kasa çıkışına otomatik işlenmesi',
          'Aylık en yüksek maliyet kalemlerini görerek tasarruf alanlarını tespit etme',
        ],
      },
      {
        heading: 'Tedarikçi Borçları ve Vadeli Ödeme Planlaması',
        paragraphs: [
          'Çekmecede görünen her nakit para kâr değildir; yarın ödemeniz gereken toptancı faturasının parası olabilir. Toptancıdan vadeli mal alan veya sarf malzemesi çeken esnafın nakit akışını koruyabilmesi için kasa ekranının yanında tedarikçi cari borçlarını da görmesi gerekir.',
          'Dükkânım Yanımda tedarikçi defteri ile her toptancıya olan borcunuzu, kısmi ödemelerinizi ve vade tarihlerinizi kaydedersiniz. Ödeme yaptığınızda tutar hem tedarikçi borcundan düşer hem de seçtiğiniz ödeme kanalına (nakit veya banka) gider olarak işlenir.',
        ],
        bullets: [
          'Toptancı ve imalatçı bazlı güncel borç ve avans bakiyesi takibi',
          'Fatura vade tarihleriyle önümüzdeki hafta ödenecek tutarları önceden görme',
          'Kısmi ödemelerde tedarikçi bakiyesi ile kasa çıkışının aynı anda güncellenmesi',
          'Muhasebeciye ay sonunda düzenli gelir–gider özeti hazırlama kolaylığı',
        ],
      },
      {
        heading: 'Patron Raporu: Ciro, Kârlılık ve Ölü Gün Analizi',
        paragraphs: [
          'Çoğu kasa yazılımı sadece toplama çıkarma yapar; karar vermenize yardımcı olmaz. Dükkânım Yanımda’daki Patron Raporu ise günlük verilerinizi anlamlı özetlere dönüştürür. Hangi günlerin yüksek ciro bıraktığını, haftanın hangi saatlerinin veya günlerinin zayıf kaldığını, ürün veya hizmet bazlı kazanç dağılımını kolay anlaşılır kartlarla gösterir.',
          'Böylece örneğin Çarşamba günlerinin sürekli düşük kaldığını gördüğünüzde o güne özel kampanya veya hatırlatma planlayabilir, maliyetleri artan hizmet kalemlerinin fiyatlarını geç kalmadan güncelleyebilirsiniz.',
        ],
        bullets: [
          'Günlük, haftalık ve aylık ciro–gider–net kâr karşılaştırma özeti',
          'Ödeme yöntemlerine göre dağılım oranları (ör. %55 kart, %35 nakit, %10 havale)',
          'Haftanın en verimli ve en sakin günlerinin tespiti',
          'Veresiye alacak toplamı ile kasa mevcudunun tek bakışta kıyaslanması',
        ],
      },
      {
        heading: '2026 Vergi Disiplinine Hazırlık ve Tek Tıkla Yedekleme',
        paragraphs: [
          'Resmi beyannamelerinizi ve e-Arşiv faturalarınızı mali müşavirinizle yürütürken, onların işini kolaylaştıran en önemli unsur temiz bir günlük kasa dökümüdür. İşletme hesabı ve basit usul esnaf için 2026’da kritik önem taşıyan fatura limitlerini aşan satışları ve banka tahsilatlarını kasanızda düzenli izlediğinizde ay sonu sürpriz vergi veya usulsüzlük riskinden uzak kalırsınız.',
          'Tüm kasa kayıtlarınız bulutta şifreli saklanır ve her gece otomatik yedeklenir. Dilediğiniz an tek dosyada yedek indirip bilgisayarınızda veya Google Drive’ınızda ekstra kopya olarak saklayabilirsiniz.',
        ],
        bullets: [
          'HTTPS şifreli bağlantı ve her gece otomatik bulut yedekleme',
          'Tek tıkla tam veri yedeği indirme ve geri yükleme imkanı',
          'Tarayıcı tabanlı yapı sayesinde hem dükkan tabletinde hem evde mobilde çalışma',
          'Çırak paketi ₺0 ile başlangıç; büyüyen ihtiyaçlarda Usta (₺249) ve Patron VIP (₺499)',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'Ödeme Kanalı Ayrımı',
        oldWay: 'Nakit, POS ve IBAN işlemlerinin tek bir defter sayfasında birbirine girmesi',
        newWay: '4 ödeme kanalının (Nakit, Kart, Havale, Veresiye) anlık ve ayrı takibi',
      },
      {
        title: 'Gider ve Şahsi Çekim Kontrolü',
        oldWay: 'Unutulan elden masraflar yüzünden ay sonunda kasanın sürekli eksik çıkması',
        newWay: '3 saniyede kategori seçerek gider girişi ve net kâr hesaplama',
      },
      {
        title: 'Donanım ve Kurulum',
        oldWay: 'Pahalı masaüstü muhasebe programı ve ek bilgisayar yatırımı',
        newWay: 'Mevcut akıllı telefonunuzdan tarayıcıyla 2 dakikada kurulumsuz başlangıç',
      },
      {
        title: 'Kayıt Güvenliği',
        oldWay: 'Kaybolan adisyon defteri veya silinen termal Z raporu kağıtları',
        newWay: 'Silinmeyen bulut arşivi ve tek tıkla indirilebilir yedek dosyası',
      },
    ],
    testimonials: [
      {
        name: 'Orhan B.',
        shopAndCity: 'Teknik Servis & Telefon Tamiri · Kadıköy / İstanbul',
        quote:
          'Parça maliyetlerini gider olarak yazmadığımız için kazandığımızı sanıyorduk. Kasa programıyla her tamirin parça çıkışını girdik, net kârımız ilk aydan şeffaflaştı.',
        rating: '5.0',
      },
      {
        name: 'Ayhan T.',
        shopAndCity: 'Şarküteri & Mandıra · Selçuklu / Konya',
        quote:
          'IBAN’a gelen parayla çekmecedeki nakit sürekli karışıyordu. Şimdi akşam kapıda sadece nakit sütununu sayıyorum, POS da banka da birebir tutuyor.',
        rating: '4.9',
      },
      {
        name: 'Nazan Y.',
        shopAndCity: 'Butik & Terzi Atölyesi · Merkez / Eskişehir',
        quote:
          'Muhasebe terimi olmadan bu kadar sade olması harika. Çayından kirasına her masrafı giriyorum, ay sonunda ne kazandığımı net görüyorum.',
        rating: '5.0',
      },
    ],
    faq: [
      {
        q: 'Esnaf kasa takip programını kullanmak için muhasebe bilmem gerekir mi?',
        a: 'Hayır. Programımız esnafın günlük diline göre sadeleştirilmiştir; sadece tutarı, açıklamayı ve ödeme türünü (Nakit, Kart, Havale, Veresiye) seçersiniz.',
      },
      {
        q: 'IBAN ve FAST ile gelen müşteri ödemelerini nasıl takip ederim?',
        a: 'Satış veya tahsilat sırasında ödeme yöntemi olarak "Havale" seçeneğini işaretlersiniz. Tutar cironuza ve banka kasanıza eklenir ama nakit çekmece sayımını etkilemez.',
      },
      {
        q: 'Dükkandan kendi şahsi harcamam için para aldığımda nasıl kaydetmeliyim?',
        a: 'Gider ekle ekranından bunu şahsi çekim/patron ödemesi olarak kaydettiğinizde hem çekmecedeki nakdin neden azaldığını bilirsiniz hem de işletme kârını doğru görürsünüz.',
      },
      {
        q: 'Dükkânım Yanımda resmi e-Fatura veya yazar kasa yerine geçer mi?',
        a: 'Hayır. Yasal fiş ve fatura kesme yükümlülüğünüzü yeni nesil yazar kasa POS ve GİB e-Arşiv üzerinden sürdürmelisiniz. Dükkânım Yanımda işletmenizin iç kasa, veresiye, stok ve net kâr yönetim panelidir.',
      },
      {
        q: 'Ücretsiz pakette kasa takibi yapabilir miyim?',
        a: 'Evet. Çırak paketi (₺0) temel günlük kasa takibi ve gün sonu özetini süresiz ücretsiz sunar.',
      },
      {
        q: 'Toptancıya yaptığım vadeli ödemeleri de buradan görebilir miyim?',
        a: 'Evet. Tedarikçi cari modülüyle toptancı borçlarınızı kaydedebilir, yaptığınız ödemeleri doğrudan kasadan düşebilirsiniz.',
      },
      {
        q: 'Kayıtlarımı bilgisayarıma veya telefonuma yedek olarak indirebilir miyim?',
        a: 'Evet. Tek tıkla yedek alma özelliğiyle tüm kasa ve müşteri kayıtlarınızı cihazınıza indirebilirsiniz.',
      },
      {
        q: 'Çalışanlarım kasa toplamını veya net kârımı görebilir mi?',
        a: 'Hayır. Ana panel yalnızca işletme sahibinin şifreli hesabıyla açılır; kasa ve net kâr verileri tamamen sizin kontrolünüzdedir.',
      },
    ],
    relatedLinks: [
      {
        label: 'Gün Sonu Z Raporu Programı',
        href: '/gun-sonu-raporu',
        description: 'Akşam 30 saniyede çekmece nakit sayımı ve POS/havale mutabakatı.',
      },
      {
        label: 'Küçük İşletmeler İçin Kasa Takibi Rehberi (Blog)',
        href: '/blog/kucuk-isletmeler-icin-kasa-takibi-rehberi',
        description: 'Kasa ile şahsi cüzdanı ayırma ve fişsiz masrafları kontrol etme rehberi.',
      },
      {
        label: 'Esnaf İçin e-Arşiv ve Vergi Dönemleri Takvimi 2026 (Blog)',
        href: '/blog/esnaf-icin-e-arsiv-vergi-donemleri-takvimi',
        description: '2026 fatura sınırları (12.000 TL / 3.000 TL) ve aylık vergi tarihleri.',
      },
      {
        label: 'Dijital Veresiye Defteri Uygulaması',
        href: '/veresiye-defteri',
        description: 'Veresiye satış ve tahsilatların kasayla tam uyumlu yönetimi.',
      },
    ],
  },

  '/gun-sonu-raporu': {
    key: '/gun-sonu-raporu',
    primaryKeyword: 'gün sonu z raporu programı',
    badge: '30 Saniyede Hatasız Kasa Kapatma',
    h1: 'Gün Sonu Z Raporu Programı: Akşam Kepenk İndirirken 30 Saniyede Kasa Kapatın',
    subtitle:
      'Hesap makinesi ve buruşuk kağıt fişlerle 1 saat uğraşmayın. Nakit, POS, havale, gider ve veresiye tahsilatlarını tek ekranda denkleştirin, kasa farkını anında görün.',
    ogImage: '/og/gun-sonu-raporu.png',
    introParagraphs: [
      'Her esnaf için günün en yorucu anı, kepengi yarıya indirip kasa çekmecesini açtığı akşam saatleridir. Sabah bıraktığınız bozuk para ne kadardı, gün içinde nakit ne kadar satıldı, POS cihazı ne kadar çekti, kaç müşteri IBAN’a attı, kuryeye veya toptancıya elden ne kadar ödendi derken tek tek fişleri toplamak çoğu zaman 45 dakika ile 1 saat arası sürer.',
      'Yazar kasa POS cihazından alınan resmi Z raporu da işletme içi gerçek durumu tam göstermez; çünkü veresiye verilen ürünleri, eski veresiye tahsilatlarını, kasadan yapılan ufak masrafları veya ödenen personel primlerini içermez. Bu nedenle resmi Z raporu tutsa bile çekmecedeki gerçek nakdin neden eksik veya fazla çıktığını anlamak zorlaşır.',
      'Dükkânım Yanımda gün sonu Z raporu programı, tüm gün boyunca yaptığınız işlemleri otomatik olarak arka planda toplar. Akşam Gün Sonu ekranını açtığınızda beklenen nakit, kart, havale, toplam gider ve net gün kazancı zaten hazırdır. Çekmecedeki parayı sayıp girdiğiniz anda fark olup olmadığını 30 saniyede görür ve günü güvenle kapatırsınız.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Gün İçi İşlemler Otomatik Biriksin',
        description:
          'Gün boyu girdiğin satışlar, randevu ödemeleri, masa adisyonları, tahsilatlar ve masraflar anlık olarak gün sonu özetine toplanır.',
      },
      {
        step: '2',
        title: 'Çekmecedeki Nakdi Say ve POS ile Eşleştir',
        description:
          'Sabah bıraktığın açılış avansını ayır, saydığın fiziksel nakdi ve POS gün sonu tutarını ekrana gir.',
      },
      {
        step: '3',
        title: '30 Saniyede Günü Kapat ve Arşivle',
        description:
          'Kasa farkı yoksa tek tıkla günü kilitle; varsa gün içi işlemleri kontrol edip raporu bulut arşivine kaydet.',
      },
    ],
    featureSections: [
      {
        heading: 'Nakit Açılış Avansı ve Net Nakit Mutabakatı',
        paragraphs: [
          'Kasa sayımında yapılan en yaygın hata, sabah bozuk para olarak çekmeceye bırakılan açılış avansının akşamki günlük satışla karıştırılmasıdır. Örneğin sabah kasada 1.000 TL bozuk para bıraktıysanız ve gün içinde 4.500 TL nakit satış yapıp 500 TL masraf ödediyseniz, akşam çekmecede 5.000 TL bulunması gerekir.',
          'Gün Sonu modülümüzde sabah kasa açılış bakiyesini bir kez tanımlarsınız; sistem akşam sayımında bu tutarı hesaba katarak net nakit artışınızı otomatik hesaplar. Böylece "Bugün kasada 5.000 TL var ama bunun 1.000 TL’si zaten sabahtan vardı" hesabını kafadan yapmanıza gerek kalmaz.',
        ],
        bullets: [
          'Sabah kasa açılış avansını net cirodan ayrı izleme',
          'Gün içi nakit satış + nakit veresiye tahsilatı − nakit giderler formülüyle otomatik beklenen nakit',
          'Sayılan tutar ile beklenen tutar arasındaki kuruş farkını anında kırmızı/yeşil uyarı ile gösterme',
          'Ertesi güne bırakılacak bozuk para kasasını tek dokunuşla devretme',
        ],
      },
      {
        heading: 'POS Cihazı, IBAN/Havale ve Açık Hesapların Tek Ekranda Kontrolü',
        paragraphs: [
          'Akşam kapanışta yalnızca çekmeceyi değil, diğer tahsilat kanallarını da doğrulamak gerekir. POS cihazınızdan aldığınız banka gün sonu slibindeki rakam ile sisteminizdeki "Kredi Kartı" toplamını yan yana gördüğünüzde, gün içinde yanlışlıkla kart yerine nakit işlenmiş bir işlem varsa saniyesinde yakalarsınız.',
          'Aynı şekilde kafe ve restoranlarda açık unutulmuş masalar, kuaförde tamamlandı olarak işaretlenmemiş bir randevu veya teknik serviste teslim edilip tutarı girilmemiş bir fiş varsa sistem gün sonu kapatmadan önce size hatırlatma yapar.',
        ],
        bullets: [
          'Nakit, Kredi Kartı POS ve IBAN/FAST toplamlarının ayrı ayrı doğrulanması',
          'Kapatılmamış açık masa, tamamlanmamış randevu veya eksik işlem uyarısı',
          'Yanlış ödeme kanalı seçimlerinden doğan sahte kasa açıklarını anında tespit',
          'Veresiye yazılan tutarların ciroda görünüp nakit kasayı bozmadan ayrıştırılması',
        ],
      },
      {
        heading: 'Personel Primleri, Giderler ve Net Günlük Kazanç Özeti',
        paragraphs: [
          'Özellikle berber, kuaför, güzellik salonu ve kafe gibi birden fazla çalışanın olduğu yerlerde gün sonu yalnızca giren parayı saymak değildir; o gün çalışan ustalara verilecek prim veya yevmiye paylarının da çıkarılması gerekir.',
          'Gün Sonu raporumuz toplam satıştan gün içi masrafları ve personel prim hak edişlerini ayırarak işletmeye kalan gerçek net tutarı gösterir. Böylece 8.000 TL ciro yaptığınız bir günde malzeme ve prim düştükten sonra dükkana gerçekte ne kadar kaldığını o akşam görürsünüz.',
        ],
        bullets: [
          'Brüt ciro, toplam gün içi gider ve net kazanç ayrımı',
          'Usta, kalfa veya estetisyen bazında günlük ciro ve prim dağılım özeti',
          'En çok satan hizmet ve ürünlerin günlük özet sıralaması',
          'Kafe ve marketlerde gün içi stok hareketlerinin ciroyla tutarlılığı',
        ],
      },
      {
        heading: 'Silinmeyen Termal Kağıtlar Yerine Kalıcı Bulut Gün Sonu Arşivi',
        paragraphs: [
          'Yazar kasadan çıkan termal kağıt Z raporları ısı ve güneş yüzünden birkaç ay içinde bembeyaz kağıda dönüşür. Geçen yılın aynı haftasında günde ne kadar iş yaptığınızı görmek istediğinizde eski fişler okunmaz durumdadır.',
          'Dükkânım Yanımda ile kapattığınız her gün sonu raporu tarih damgalı olarak kalıcı dijital arşive kaydedilir. İstediğiniz an 3 ay öncesinin Salı gününü açıp nakit/kart oranını, giderleri ve net kazancı saniyeler içinde inceleyebilirsiniz. Tek tıkla yedek indirerek verilerinizi kendi cihazınızda da saklayabilirsiniz.',
        ],
        bullets: [
          'Zamanla silinmeyen, kaybolmayan tarih bazlı tüm gün sonu kapanış geçmişi',
          'Geçen hafta veya geçen ayın aynı günüyle hızlı performans kıyaslaması',
          'Evden ya da tatilden dükkandaki gün sonu kapanışını anlık takip edebilme',
          'Tek tıkla indirilebilen yedekleme dosyası ile %100 veri güvenliği',
        ],
      },
      {
        heading: '5 Dakikada Başlayan Gün Sonu Disiplini ve Şeffaf Paketler',
        paragraphs: [
          'Gün sonu raporu tutmaya başlamak için yılbaşını veya ay başını beklemenize gerek yoktur. Bugün Dükkânım Yanımda hesabınızı açtığınız anda sade Gün Sonu ekranı aktif gelir. İlk kapanışınızdan itibaren akşamları hesap makinesiyle uğraşma stresiniz ortadan kalkar.',
          'Çırak paketi ile temel kasa ve gün sonu raporunu kredi kartı bilgisi vermeden süresiz ₺0 ücretle kullanabilirsiniz. Çoklu personel prim dağıtımı, kârlılık analizi ve sınırsız kayıtlar için Usta (₺249/ay) veya Patron VIP (₺499/ay) paketleri taahhütsüz olarak hizmetinizdedir.',
        ],
        bullets: [
          'Kurulum gerektirmeden telefon ve bilgisayardan aynı akşam ilk kapanışı yapabilme',
          'Çırak paketi ile ₺0 ücretle temel kasa ve gün sonu özeti',
          'Patron VIP ile haftalık/aylık kârlılık ve ölü gün analizi (Patron Raporu)',
          'Bakkaldan berbere, kafeden terziye tüm sektörlere uyumlu tek ekran',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'Kasa Kapatma Süresi',
        oldWay: 'Fişleri ve defteri hesap makinesiyle toplayarak 45–60 dakika uğraşmak',
        newWay: 'Gün içi işlemler otomatik toplanır; sadece nakit sayımıyla 30 saniyede kapanış',
      },
      {
        title: 'Kasa Açığı Tespiti',
        oldWay: 'Paranın neden eksik çıktığını günlerce düşünmek',
        newWay: 'Nakit, POS, havale ve gider ayrımı sayesinde farkın kaynağı anında bulunur',
      },
      {
        title: 'Arşiv ve Okunabilirlik',
        oldWay: 'Birkaç ayda yazısı silinen termal Z raporu ruloları',
        newWay: 'Yıllar geçse de silinmeyen, tarih bazlı filtrelenebilir bulut arşivi',
      },
      {
        title: 'Net Kâr Görünürlüğü',
        oldWay: 'Sadece toplam ciroyu görüp gider ve primi hesaba katamamak',
        newWay: 'Gider ve personel primleri düşülerek gerçek net kazanç anlık hesaplanır',
      },
    ],
    testimonials: [
      {
        name: 'Levent Ö.',
        shopAndCity: 'Kafe & Kahvaltı Salonu · Bostanlı / İzmir',
        quote:
          'Gece 23:00’te dükkanı kapattıktan sonra yarım saat kasa hesabı yapardık. Şimdi açık masaları kapatıp çekmeceyi saymamız toplam 2 dakika sürüyor.',
        rating: '5.0',
      },
      {
        name: 'Hakan P.',
        shopAndCity: '3 Koltuklu Erkek Kuaförü · İzmit / Kocaeli',
        quote:
          'Çırak ve usta primlerini çıkarıp kalan kasa nakdini hesaplamak eskiden her akşam dertti. Gün Sonu raporu her akşam kimin ne alacağını tek kalemde veriyor.',
        rating: '5.0',
      },
      {
        name: 'Sevgi D.',
        shopAndCity: 'Mahalle Marketi · Mamak / Ankara',
        quote:
          'Eskiden kasadan ekmekçiye verilen para yazılmadığı için akşam hep açık çıkıyordu. Şimdi gider girildiği için çekmece her akşam kuruşu kuruşuna tutuyor.',
        rating: '4.9',
      },
    ],
    faq: [
      {
        q: 'Gün sonu programı resmi yazar kasa Z raporunun yerine geçer mi?',
        a: 'Hayır. Vergi mevzuatı gereği yazar kasa POS cihazınızdan resmi Z raporu almanız zorunludur. Dükkânım Yanımda gün sonu raporu ise yazar kasa fişinde görünmeyen veresiye, havale, masraf, personel primi ve nakit çekmece mutabakatını takip etmenizi sağlayan işletme içi kontrol raporudur.',
      },
      {
        q: 'Akşam çekmece sayımında kasa açığı çıkarsa sistem hatayı bulmama yardımcı olur mu?',
        a: 'Evet. Nakit, POS, IBAN, giderler ve veresiye tahsilatları ayrı satırlarda göründüğü için hangi ödeme kanalında kayma olduğunu saniyeler içinde tespit edersiniz.',
      },
      {
        q: 'Sabah kasada bıraktığım bozuk para avansını her gün yeniden girmem gerekir mi?',
        a: 'Hayır, sabit bir açılış nakit avansı belirleyip akşam sayımında bu tutarı otomatik olarak düşebilirsiniz.',
      },
      {
        q: 'Gün içinde dükkanda değilsem akşam kasa kapanışını evden görebilir miyim?',
        a: 'Evet. Veriler anlık bulutta senkronize edildiği için kapanış raporunu telefonunuzdan veya bilgisayarınızdan istediğiniz yerden inceleyebilirsiniz.',
      },
      {
        q: 'Birden fazla masada hesabı açık kalan kafelerde gün sonu nasıl çalışır?',
        a: 'Sistem kapanış yapmadan önce açık kalan masaları uyarır; masaları kapatıp ödemeyi aldığınızda tutarlar doğru kanala eklenir.',
      },
      {
        q: 'Geçmiş aylardaki gün sonu raporlarına tekrar bakabilir miyim?',
        a: 'Evet. Kapatılan tüm günler tarih sırasıyla arşivlenir; istediğiniz günü veya haftayı seçip geçmiş ciro ve gider detaylarını görebilirsiniz.',
      },
      {
        q: 'Gün sonu raporunu kullanmak için ücretli paket zorunlu mu?',
        a: 'Hayır. Temel günlük kasa ve gün sonu kapanışı Çırak paketinde (₺0) süresiz ücretsizdir. Detaylı kârlılık ve dönem analizleri Patron VIP paketinde sunulur.',
      },
      {
        q: 'Akşam kasadan aldığım şahsi parayı gün sonu nasıl gösterir?',
        a: 'Patron çekimi olarak işlediğiniz tutar kasadan çıkış olarak düşer, ancak dükkan gideriyle karıştırılmaz; böylece hem çekmece tutar hem gerçek kârınız bozulmaz.',
      },
    ],
    relatedLinks: [
      {
        label: 'Esnaf İçin Gün Sonu Raporu Nasıl Hazırlanır? (Blog)',
        href: '/blog/gun-sonu-raporu-nasil-hazirlanir',
        description: '5 dakikalık akşam kasa kapatma rutini ve kasa açığı çözme kontrol listesi.',
      },
      {
        label: 'Esnaf Kasa Takip Programı',
        href: '/kasa-programi',
        description: 'Nakit, POS, havale ve gün içi gider takibiyle kasa yönetimi.',
      },
      {
        label: 'Kafe & Restoran Adisyon Programı',
        href: '/kafe-restoran',
        description: 'Açık masa adisyonlarından gün sonu kapanışına kesintisiz akış.',
      },
      {
        label: 'Dijital Veresiye Defteri Uygulaması',
        href: '/veresiye-defteri',
        description: 'Veresiye tahsilatlarının akşam kasa sayımına hatasız yansıması.',
      },
    ],
  },

  '/qr-menu': {
    key: '/qr-menu',
    primaryKeyword: 'ücretsiz qr menü sistemi',
    badge: 'Baskısız Canlı Karekod Menü Çözümü',
    h1: 'Ücretsiz QR Menü Sistemi: 2 Dakikada Masaya Özel Dijital Menü ve Garson Çağırma',
    subtitle:
      'Her fiyat değişiminde matbaaya baskı ücreti ödemeyin. Sabit /m/dukkan-adiniz adresinden fiyat ve ürün stoklarını anında güncelleyin, masadan temassız sipariş ve garson çağrısı alın.',
    ogImage: '/og/qr-menu.png',
    introParagraphs: [
      'Kahve çekirdeğinden süt ürünlerine, tatlı malzemelerinden et fiyatlarına kadar maliyetlerin sık değiştiği bir dönemde kafe ve restoranlar için kağıt menü bastırmak artık sürdürülebilir değildir. Her zam ya da menü yenilemesinde yüzlerce sayfalık baskı masrafı ödemek ya da yıpranmış menülerin üzerine fiyat etiketi yapıştırmak hem bütçeyi yorar hem de mekanın imajını zedeler.',
      'Pek çok işletme hızlı bir çözüm olarak eski menüsünün PDF dosyasını bir linke yükleyip karekod oluşturur; ancak müşteri masada karekodu okuttuğunda yavaş açılan, parmakla büyütülmesi gereken küçük yazılarla karşılaşır. Üstelik PDF menüde tükenen bir ürünü gizleyemez, doğrudan garson çağıramaz ve masadan sipariş veremezsiniz.',
      'Dükkânım Yanımda ücretsiz QR menü sistemi, kafe, bistro, pastane ve restoranlar için gerçek mobil web menüsü sunar. Müşteri masadaki karekodu okuttuğunda dükkanınızın logosuyla açılan hızlı, fotoğraflı ve kategori filtreli menüyü görür. Fiyatları dilediğiniz an telefonunuzdan güncellersiniz; masalardaki QR kartlar hiç değişmeden anlık güncel kalır ve hiçbir ek modül ücreti ödemezsiniz.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Kategorilerini ve Ürünlerini Gir',
        description:
          'Sıcak İçecekler, Soğuk Kahveler, Kahvaltı, Tatlılar gibi kategorilerini oluştur; istersen mevcut menünün fotoğrafını çekerek AI okuyucuyla aktar.',
      },
      {
        step: '2',
        title: 'Masalara Özel Karekodları İndir',
        description:
          'dukkanimyanimda.com.tr/m/dukkan-adiniz linkine bağlı yüksek hata düzeltmeli (ECC-H) QR kodlarını çıktı alıp masalara yerleştir.',
      },
      {
        step: '3',
        title: 'Fiyatı Anında Güncelle, Masadan Sipariş Al',
        description:
          'Fiyat değiştiğinde tek dokunuşla güncelle; müşteriler telefonundan menüye baksın, sepet oluştursun ve garson/hesap çağırsın.',
      },
    ],
    featureSections: [
      {
        heading: 'Sabit Karekod ile Anlık Fiyat ve Stok Güncelleme',
        paragraphs: [
          'Kafe ve restoranlarda en büyük özgürlük, bir kez bastırıp masaya yapıştırdığınız QR etiketin ömür boyu aynı kalmasıdır. Ürününüze zam geldiğinde, yeni bir mevsimlik içecek eklediğinizde veya kahvaltı kampanyası başlattığınızda telefonunuzdaki panelden fiyatı değiştirmeniz 5 saniye sürer.',
          'Ayrıca akşam saatlerinde tezgahınızdaki son tiramisu ya da san sebastian cheesecake bittiğinde o ürünü menüden tek dokunuşla "Tükendi / Gizle" konumuna alabilirsiniz. Müşteri masada olmayan bir ürünü seçip garsonun "Maalesef o kalmadı" demesiyle hayal kırıklığı yaşamaz.',
        ],
        bullets: [
          'Masadaki karekodu değiştirmeden sınırsız fiyat, açıklama ve fotoğraf güncellemesi',
          'Tükenen ürünleri tek tıkla menüde pasife alarak müşteri memnuniyetini koruma',
          'Mevsimlik veya saatlik menü (kahvaltı, öğle menüsü, akşam atıştırmalıkları) esnekliği',
          'Fotoğraftan AI tarife okuyucu sayesinde kağıt menüden otomatik ürün aktarımı',
        ],
      },
      {
        heading: 'PDF Yerine Hızlı Mobil Arayüz ve İştah Açıcı Sunum',
        paragraphs: [
          'PDF dosyaları akıllı telefonlarda geç yüklenir ve okunması zordur; oysa Dükkânım Yanımda QR menüsü doğrudan mobil ekranlara göre optimize edilmiş kategori sekmeleriyle açılır. Müşteri "Soğuk Kahveler" ya da "Burgerler" başlığına dokunduğunda aradığı ürünü 1 saniyede bulur.',
          'Her ürünün altına yüksek kaliteli fotoğraf, kısa lezzet açıklaması ve varsa içerik/alerjen notu ekleyebilirsiniz. İyi fotoğraflanmış ve iştah açıcı şekilde anlatılmış tatlılar ve yan ürünler, müşterinin yalnızca sade çay veya kahve söyleyip kalkması yerine ek ürün sipariş etmesini teşvik ederek masa ortalamasını yukarı çeker.',
        ],
        bullets: [
          'Uygulama indirme gerektirmeden tüm iOS ve Android kameralarda anında açılış',
          'Kategori çubuğu ile kaybolmadan kolay gezinme ve hızlı ürün arama',
          'Ürün fotoğrafları, lezzet tarifleri ve porsiyon/alerjen bilgileri ekleme',
          'Google aramalarında /m/dukkan-adiniz sayfası üzerinden Restaurant/Menu şemasıyla görünürlük',
        ],
      },
      {
        heading: 'Masadan Garson Çağırma, Hesap İsteme ve Canlı QR Sipariş',
        paragraphs: [
          'İki katlı mekanlarda, bahçede veya yoğun hafta sonu akşamlarında müşterilerin garsona sesini duyurmaya çalışması hem müşteriyi gerer hem de ek çay/tatlı siparişlerinin ertelenmesine yol açar. Dijital menümüz yalnızca pasif bir fiyat listesi değildir; masa ile kasa arasındaki canlı iletişim köprüsüdür.',
          'Müşteri menünün altındaki tek butonla "Garson Çağır" ya da "Hesap İste" sinyali gönderebilir; dilerseniz masadaki telefonundan sepet oluşturup doğrudan mutfak/kasa ekranınıza canlı sipariş düşmesini sağlayabilirsiniz. Gelen çağrılar ve siparişler masa numarasıyla birlikte panelde anında uyarı verir.',
        ],
        bullets: [
          'Tek dokunuşla masadan temassız Garson Çağır ve Hesap İste bildirimleri',
          'Müşterinin sepet oluşturup doğrudan masa adisyonuna sipariş gönderebilmesi',
          'Bahçe, Teras ve Salon masaları için ayrı masa kodlu karekod üretimi',
          'Ekstra komisyon veya işlem başına ücret kesilmeden doğrudan kasa entegrasyonu',
        ],
      },
      {
        heading: 'Ekstra Modül Ücreti Olmadan Şeffaf Esnaf Fiyatlandırması',
        paragraphs: [
          'Piyasadaki birçok QR menü firması yalnızca karekod menü için yüksek yıllık ücretler ister, adisyon ve kasa için de ayrıca yazılım satar. Dükkânım Yanımda’da QR menü, canlı masa takibi ve gün sonu kasası aynı çatıda ek modül ücreti olmadan sunulur.',
          'Yeni açılan butik kafeler ve küçük çay ocakları Çırak paketiyle 3 masaya kadar süresiz ücretsiz başlayabilir. Daha geniş salon, teras ve bahçe düzenine sahip işletmeler ise Usta (₺249/ay) veya sınırsız masa, canlı QR sipariş ve garson çağrı sunan Patron VIP (₺499/ay) paketiyle tüm operasyonunu tek ekrandan yönetir.',
        ],
        bullets: [
          'Rakiplerin aksine QR menü için ayrı abonelik veya yıllık yenileme tuzağı yok',
          'Çırak paketi ile ₺0 ücretle menünüzü kurup karekod çıktısı alabilme',
          'Patron VIP (₺499/ay) ile sınırsız masa, canlı garson çağrı ve marka bandını kaldırma',
          'Kredi kartı bilgisi vermeden 2 dakikada canlı menüyü test etme imkanı',
        ],
      },
      {
        heading: 'Google İşletme Profilinde Menü Linki ile Yeni Müşteri Kazanımı',
        paragraphs: [
          'İnsanlar dışarıda kahve içeceği ya da yemek yiyeceği yeni bir yer ararken Google Haritalar’da mekanın menüsüne ve fiyat aralığına bakmak ister. Menü sayfası olmayan mekanlar belirsizlik yarattığı için tercih sırasının gerisine düşebilir.',
          'Size özel /m/dukkan-adiniz adresini Google İşletme Profilinizdeki "Menü Bağlantısı" alanına ve Instagram biyografinize eklediğinizde, daha kapıdan içeri girmemiş müşteriler güncel çeşitlerinizi görerek güvenle mekanınıza gelir. Tüm ürünler Schema.org Restaurant/Menu veri yapısıyla arama motorlarına da otomatik sunulur.',
        ],
        bullets: [
          'Google Haritalar "Menü" sekmesine doğrudan bağlanabilen canlı web adresi',
          'Instagram Story ve biyografi paylaşımlarında şık menü önizlemesi',
          'Yüksek hata düzeltmeli (ECC-H) karekod sayesinde loş ışıklı ortamlarda bile hızlı okuma',
          'Bulut yedekleme ile menü listenizin ve ürün görsellerinizin her zaman güvende olması',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'Baskı ve Güncelleme Maliyeti',
        oldWay: 'Her zam veya menü değişiminde matbaada yeniden baskı yaptırmak',
        newWay: 'Sabit karekodla 5 saniyede telefondan sınırsız ücretsiz fiyat güncelleme',
      },
      {
        title: 'Müşteri Okuma Deneyimi',
        oldWay: 'Yavaş inen ve parmakla büyütülmesi gereken sıkıcı PDF menüler',
        newWay: 'Anında açılan kategori filtreli, fotoğraflı mobil web menüsü',
      },
      {
        title: 'Garson & Sipariş İletişimi',
        oldWay: 'Bahçeden veya üst kattan garsona el sallayarak sesini duyurmaya çalışmak',
        newWay: 'Masadan tek dokunuşla garson çağırma, hesap isteme ve canlı sepet siparişi',
      },
      {
        title: 'Fiyatlandırma ve Ek Modüller',
        oldWay: 'QR menüye ayrı, adisyon ve kasaya ayrı aylık yüksek lisans ödemek',
        newWay: 'Hepsi tek panelde; ücretsiz Çırak paketiyle hemen başla, ek modül ücreti yok',
      },
    ],
    testimonials: [
      {
        name: 'Berke S.',
        shopAndCity: 'Üçüncü Dalga Kahve Dükkanı · Alsancak / İzmir',
        quote:
          'Mevsimlik soğuk kahveler ve tatlılar sürekli değişiyor. Eskiden PDF yüklüyorduk, müşteriler zorlanıyordu. Şimdi canlı QR menüden anında sipariş bile düşüyor.',
        rating: '5.0',
      },
      {
        name: 'Gülay H.',
        shopAndCity: 'Butik Pastane & Cafe · Kadıköy / İstanbul',
        quote:
          'Akşam kalan son dilim pastaları tek tuşla gizleyebilmek çok büyük rahatlık. Fotoğrafları ekledikten sonra kahve yanına tatlı satışımız gözle görülür şekilde arttı.',
        rating: '5.0',
      },
      {
        name: 'Tarik K.',
        shopAndCity: 'Bahçeli Bistro & Nargile Kafe · İzmit / Kocaeli',
        quote:
          'Bahçe masalarına karekod kartlarını koyduk. Müşteriler "Garson Çağır" butonuna bastığında kasada hangi masa olduğu görünüyor, servis hızımız ikiye katlandı.',
        rating: '4.9',
      },
    ],
    faq: [
      {
        q: 'Ücretsiz QR menü sistemi gerçekten ücretsiz mi? Kaç ürün ekleyebilirim?',
        a: 'Evet. Çırak paketi ₺0 ücretle menünüzü oluşturmanıza ve QR kod almanıza imkan tanır. Sınırsız masa yerleşimi, canlı garson çağrı ve marka kaldırma özellikleri için Usta veya Patron VIP paketlerine geçebilirsiniz.',
      },
      {
        q: 'Müşterilerin QR menüyü açması için uygulama indirmesi gerekiyor mu?',
        a: 'Hayır. Tüm modern telefon kameraları karekodu okuduğunda doğrudan tarayıcıda menünüzü açar; hiçbir uygulama veya üyelik gerekmez.',
      },
      {
        q: 'Ürün fiyatlarını değiştirdiğimde masadaki QR kodları yenilemem gerekir mi?',
        a: 'Kesinlikle hayır. Masadaki karekod sabit dükkan adresinize (/m/dukkan-adiniz) yönlenir; panelde yaptığınız her fiyat ve ürün değişikliği aynı saniye yayına girer.',
      },
      {
        q: 'Mevcut kağıt menümüzdeki onlarca ürünü tek tek yazmadan aktarabilir miyiz?',
        a: 'Evet. Fotoğraftan AI tarife/menü okuyucu özelliğiyle menü sayfalarınızın fotoğrafını çekerek ürün isimlerini ve fiyatlarını hızlıca içeri alabilirsiniz.',
      },
      {
        q: 'QR menü üzerinden müşteri masadan doğrudan sipariş veya garson çağrısı yapabilir mi?',
        a: 'Evet. Patron VIP ve canlı masa modülünde müşteriler menüden sepet oluşturup adisyona sipariş gönderebilir, tek dokunuşla garson ya da hesap çağırabilir.',
      },
      {
        q: 'Biten bir ürünü geçici olarak menüden gizleyebilir miyiz?',
        a: 'Evet. Stokta kalmayan bir yemeği veya tatlıyı silmek yerine tek dokunuşla pasife alabilir, ertesi gün yeniden görünür yapabilirsiniz.',
      },
      {
        q: 'Karekodların tasarımını baskıya hazır şekilde nereden alırım?',
        a: 'Panelinizde her masaya özel veya genel kullanım için yüksek hata düzeltmeli (ECC-H) karekod çıktısı anında hazırlanır; tek tıkla indirip yazdırabilirsiniz.',
      },
      {
        q: 'QR menü linkimi Google Haritalar ve Instagram hesabıma koyabilir miyim?',
        a: 'Evet. Size özel /m/dukkan-adiniz bağlantısını Google İşletme Profilinizin menü alanına ve Instagram biyografinize ekleyerek dışarıdan gelen müşterilere de güncel menünüzü gösterebilirsiniz.',
      },
    ],
    relatedLinks: [
      {
        label: 'QR Menü Nedir, Nasıl Yapılır? (Blog)',
        href: '/blog/qr-menu-nedir-nasil-yapilir',
        description: 'PDF menü hatalarından kaçınarak satış artıran QR menü kurulum rehberi.',
      },
      {
        label: 'Kafe & Restoran Adisyon Programı',
        href: '/kafe-restoran',
        description: 'Salon/Bahçe masa takibi, parçalı hesap kapatma ve mutfak sipariş yönetimi.',
      },
      {
        label: 'Gün Sonu Z Raporu Programı',
        href: '/gun-sonu-raporu',
        description: 'Kafe kapanışında açık masa kontrolü, nakit ve POS mutabakatı.',
      },
      {
        label: 'Esnaf Kasa Takip Programı',
        href: '/kasa-programi',
        description: 'Tedarikçi faturaları, gün içi masraflar ve net kafe kârlılığı.',
      },
    ],
  },

  '/kafe-restoran': {
    key: '/kafe-restoran',
    primaryKeyword: 'kafe restoran adisyon programı',
    badge: 'Canlı Masa, Adisyon & QR Sipariş Sistemi',
    h1: 'Kafe Restoran Adisyon Programı: Canlı Masa Takibi, QR Sipariş ve Hızlı Kasa',
    subtitle:
      'Pahalı dokunmatik POS terminalleri ve yazıcı sözleşmeleri olmadan telefon ve tabletten masa açın, parçalı hesap alın, QR menü siparişlerini doğrudan adisyona düşürün.',
    ogImage: '/og/kafe-restoran.png',
    introParagraphs: [
      'Yoğun bir akşamüstü ya da hafta sonu kahvaltı servisinde kafe ve restoran işletmeciliğinin en kritik noktası masa devir hızı ve hesap doğruluğudur. Garson kağıda sipariş yazarken bir kahvenin unutulması, müşterinin hesabı isterken "Masada iki çay mı vardı üç mü?" diye beklemesi veya kalabalık bir grubun hesabı ayrı ayrı ödemek istemesi tezgahta ciddi kaos yaratır.',
      'Klasik adisyon yazılımları ise küçük ve orta ölçekli işletmelere yüksek donanım maliyetleri, yıllık lisans ücretleri ve ekstra QR menü eklenti faturaları çıkarır. Oysa çoğu butik kafe, pastane, kahvaltı salonu, börekçi ve restoran; mevcut tableti ve personelin telefonlarıyla hızlı çalışan, sade ama güçlü bir kafe restoran adisyon programı arar.',
      'Dükkânım Yanımda, Salon, Bahçe ve Teras bölümlerinize göre masalarınızı renklerle canlı izlemenizi sağlar. Müşterinin masadaki karekoddan verdiği sipariş veya garson çağrısı doğrudan açık adisyona düşer. Üstelik komşu esnafın öğle yemeği abonman hesaplarını, parçalı/Alman usulü hesap kapatmayı, tedarikçi vadelerini ve akşam gün sonu cirosunu tek ekranda yönetirsiniz.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Bölümlerini, Masalarını ve Menünü Kur',
        description:
          'Salon, Bahçe veya Teras alanlarına masalarını ekle; menü kategorilerini ve fiyatlarını 2 dakikada tanımla.',
      },
      {
        step: '2',
        title: 'Adisyon Aç veya Masadan QR Sipariş Al',
        description:
          'Dolu masaya tek dokunuşla sipariş ekle ya da müşterilerin karekod menü üzerinden gönderdiği siparişleri anında onayla.',
      },
      {
        step: '3',
        title: 'Parçalı Hesap Kapat ve Gün Sonunu Tamamla',
        description:
          'Masayı nakit, kart, havale veya veresiye/abonman olarak kapat; akşam 30 saniyede gün sonu ciro ve kârını gör.',
      },
    ],
    featureSections: [
      {
        heading: 'Salon, Bahçe ve Teras İçin Renk Kodlu Canlı Masa Takibi',
        paragraphs: [
          'Kafenizde hangi masanın boş, hangi masanın dolu, hangi masada ise hesap istendiğini kapıdan veya kasadan tek bakışta görmeniz servis hızını doğrudan belirler. Dükkânım Yanımda masa ekranında tüm alanlarınızı Salon, Bahçe, Teras veya VIP şeklinde bölümlere ayırıp her masanın anlık toplam tutarını ve açık kalma süresini canlı izlersiniz.',
          'Masa değiştirmek isteyen bir müşteriyi tek dokunuşla yeni masaya aktarabilir, birleşen arkadaş gruplarının masalarını kolayca yönetebilirsiniz. Yoğun saatte tek elle bile kullanılacak kadar büyük butonlar sayesinde hata payı sıfıra iner.',
        ],
        bullets: [
          'Boş, dolu, hesap istendi ve rezerve masa durumlarının net renk kodlarıyla takibi',
          'Salon, Bahçe ve Teras alanlarına göre sınırsız masa yerleşimi ve adisyon açma',
          'İptal, ikram ve sipariş notu ("az şekerli", "sütlü", "ekstra sos") ekleme kolaylığı',
          'Pahalı POS donanımı almadan mevcut tablet, telefon ve bilgisayardan anında çalışma',
        ],
      },
      {
        heading: 'Entegre Canlı QR Menü, Garson Çağırma ve Masadan Sipariş',
        paragraphs: [
          'Adisyon programınız ile QR menünüzün ayrı yazılımlar olması, her yeni ürün girdiğinizde iki yere birden fiyat yazmanız demektir. Dükkânım Yanımda’da menü kalemini bir kez girdiğinizde hem kasa adisyonunuzda hem de müşterinin okuttuğu dijital QR menüde aynı anda güncellenir.',
          'Masadaki müşteri karekodu okutup "Garson Çağır" ya da "Hesap İste" butonuna bastığında kasa ekranınızda sesli ve görsel uyarı yanar. Müşterinin telefondan oluşturduğu sipariş ise doğrudan o masanın açık adisyonuna düşer; böylece servis personeliniz boşuna masa masa dolaşmadan doğrudan siparişi hazırlar.',
        ],
        bullets: [
          'Tek menü kaynağından hem adisyon ekranını hem canlı QR menüyü (/m/dukkan-adiniz) besleme',
          'Masadan gelen temassız Garson Çağır ve Hesap İste bildirimlerini anlık yakalama',
          'QR siparişlerin doğrudan masa hesabına eklenmesiyle kayıp siparişlerin önlenmesi',
          'Biten ürünleri menüden gizleyerek masada yaşanabilecek sipariş iptallerini engelleme',
        ],
      },
      {
        heading: 'Parçalı Ödeme, Paket Servis ve Gel-Al Hızlı Satış Modu',
        paragraphs: [
          'Kalabalık masalar kalkarken en çok zaman kaybettiren an ödeme bölüşmedir: İki kişi kredi kartıyla kendi kahvesini öderken diğer kişi tüm tatlının nakit ödemesini yapmak isteyebilir. Esnek ödeme alma ekranımız sayesinde bir masanın hesabını parçalı olarak (bir kısmı nakit, bir kısmı kart, bir kısmı havale) tek seferde kapatırsınız.',
          'Öte yandan her müşteri masaya oturmaz; sabah poğaçasını ya da karton bardakta kahvesini alıp çıkan gel-al müşteriler ile telefonla gelen paket siparişler için masa açmadan çalışan Hızlı Satış fişi kesersiniz. Tüm gelirler aynı gün sonu cirosuna hatasız akar.',
        ],
        bullets: [
          'Tek masada nakit + kredi kartı + IBAN parçalı / Alman usulü hesap kapatma',
          'Masa açmayı gerektirmeyen hızlı gel-al ve paket servis satış modu',
          'Adisyon fişi kalemlerini müşteriye şeffaf şekilde gösterip hızlı tahsilat alma',
          'Kapanan masanın anında "Boş" duruma geçerek yeni müşteriye hazır hale gelmesi',
        ],
      },
      {
        heading: 'Öğle Yemeği Abonmanları, Çevre Esnaf Veresiyesi ve Tedarikçi Takibi',
        paragraphs: [
          'Lokanta, esnaf lokantası ve kafelerin çoğu çevredeki banka şubelerine, ofislere veya komşu esnafa günlük çay-kahve ya da öğle yemeği servisi yapar ve hesapları haftalık/aylık kapatır. Kağıt adisyon fişlerini zarfta biriktirmek yerine bu müşteriler için Abonman / Veresiye cari kartı tutarsınız.',
          'Ayrıca kasap, manav, sütçü ve içecek toptancısına olan tedarikçi borçlarınızı ve mal alım faturalarınızı da aynı panelde izlersiniz. Böylece ay ortasında elinizdeki nakdin ne kadarının kâr, ne kadarının tedarikçi ödemesi olduğu netleşir.',
        ],
        bullets: [
          'Komşu esnaf ve düzenli çalışanlar için ayrı abonman ve çay-kahve veresiye defteri',
          'Ay sonu tek tıkla WhatsApp üzerinden kibar hesap ekstresi gönderme',
          'Gıda, içecek ve ambalaj toptancılarına olan vadeli tedarikçi borçlarını izleme',
          'Kritik stok seviyesi uyarısıyla içecek veya kahve çekirdeği bitmeden sipariş verme',
        ],
      },
      {
        heading: 'Gün Sonu Kasa Kapatma ve En Çok Satan Ürün Analizi (Patron Raporu)',
        paragraphs: [
          'Gece servis bitip son misafiri uğurladıktan sonra kasayı kapatmak artık yarım saat sürmez. Gün Sonu ekranı açık masa kalıp kalmadığını kontrol eder; nakit, POS, IBAN, paket servis ve gün içi mutfak harcamalarını tek sayfada özetler.',
          'Patron Raporu ise hangi günlerin daha yoğun geçtiğini, hangi yemek veya içeceğin cironun lokomotifi olduğunu ve hangi saatlerde kampanya (happy-hour) yapmanız gerektiğini verilerle gösterir. Üstelik Çırak paketiyle 3 masaya kadar ücretsiz başlayabilir, büyüdükçe Usta (₺249/ay) veya sınırsız masa ve canlı garson çağrı sunan Patron VIP (₺499/ay) planına geçebilirsiniz.',
        ],
        bullets: [
          'Akşam kapanışta açık masa uyarısı ve 30 saniyede nakit/kart kasa mutabakatı',
          'En çok satan ürünler ve haftanın ölü/yoğun saatlerini gösteren Patron Raporu',
          'Sıfır donanım maliyeti ve sözleşmesiz aylık esnek kullanım',
          'Bulut senkronizasyonuyla mekan dışındayken bile canlı masa doluluğunu izleyebilme',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'Donanım & Kurulum Yatırımı',
        oldWay: 'On binlerce liralık POS terminali, kablolama, kurulum ve yıllık servis sözleşmesi',
        newWay: 'Mevcut tablet veya telefonunuzdan tarayıcıyla 2 dakikada ₺0 kurulum',
      },
      {
        title: 'QR Menü & Masa Entegrasyonu',
        oldWay: 'QR menü için ayrı firma, adisyon için ayrı programa çift abonelik ödemek',
        newWay: 'Aynı panelde canlı QR menü, garson çağrı ve doğrudan adisyona düşen sipariş',
      },
      {
        title: 'Parçalı Hesap ve Abonman',
        oldWay: 'Kalabalık masanın hesabını kağıtta bölerken hata yapmak ve esnaf çay fişlerini kaybetmek',
        newWay: 'Nakit/kart parçalı tahsilat ve tek tuşla esnaf abonman cari kartına aktarma',
      },
      {
        title: 'Akşam Ciro ve Kâr Hesabı',
        oldWay: 'Gece yarısı adisyon koçanlarını tek tek toplayıp mutfak giderini tahmin etmek',
        newWay: 'Canlı kapanışta nakit, POS, gider ve en çok satan ürünler anında önünde',
      },
    ],
    testimonials: [
      {
        name: 'Kaan Y.',
        shopAndCity: 'Kahve & Tatlı Kafe (18 Masa) · Kadıköy / İstanbul',
        quote:
          'Büyük adisyon firmalarından gelen yıllık yenileme faturası yüzünden arayışa girdik. Dükkânım Yanımda ile 2 tablette hem masaları hem QR menüyü sıfır sorunla yönetiyoruz.',
        rating: '5.0',
      },
      {
        name: 'Mustafa A.',
        shopAndCity: 'Esnaf Lokantası & Izgara · Seyhan / Adana',
        quote:
          'Çevre dükkanların öğle yemeği abonman hesapları eskiden koçanlarda kaybolurdu. Şimdi masayı kapatırken abonmana atıyorum, ay başında tek listeyle tahsil ediyorum.',
        rating: '4.9',
      },
      {
        name: 'Pınar E.',
        shopAndCity: 'Sahil Bistro & Kahvaltı · Bodrum / Muğla',
        quote:
          'Taahhüt olmaması sezonluk çalışan işletmemiz için büyük nimet. Bahçe masalarında garson çağırma butonu sayesinde servis aksamaları tamamen bitti.',
        rating: '5.0',
      },
    ],
    faq: [
      {
        q: 'Kafe restoran adisyon programını kullanmak için dokunmatik POS cihazı almam şart mı?',
        a: 'Hayır. İnternet tarayıcısı olan herhangi bir tablet, akıllı telefon veya mevcut bilgisayar üzerinden doğrudan çalışır; hiçbir donanım almanız gerekmez.',
      },
      {
        q: 'Garsonlar ve mutfak aynı anda canlı masaları görebilir mi?',
        a: 'Evet. Bulut tabanlı senkronizasyon sayesinde masalara düşen QR siparişler ve garson çağrıları yetkili ekranda anında görünür.',
      },
      {
        q: 'QR menü ve garson çağrı sistemi için ek modül ücreti öder miyiz?',
        a: 'Hayır. Tüm kafe yönetim araçları ve dijital QR menü aynı paket çatısı altında ek gizli ücret olmadan sunulur.',
      },
      {
        q: 'Bir masadaki müşteri grubunun hesabını ayrı ayrı (parçalı) kapatabilir miyiz?',
        a: 'Evet. Aynı masa adisyonundan bir kısmı nakit, bir kısmı kredi kartı veya IBAN ile kısmi tahsilat alıp kalan tutarı kapatabilirsiniz.',
      },
      {
        q: 'Masaya oturmadan al-götür (gel-al) kahve veya paket alan müşteriler için masa açmak gerekir mi?',
        a: 'Hayır. Hızlı Satış modu üzerinden masa açmadan saniyeler içinde satış girip doğrudan kasaya işleyebilirsiniz.',
      },
      {
        q: 'Salon, bahçe ve teras masalarını ayrı gruplarda görebilir miyiz?',
        a: 'Evet. Mekanınızın yerleşimine göre istediğiniz kadar bölüm ve masa tanımlayıp renk kodlarıyla dolu-boş takibi yapabilirsiniz.',
      },
      {
        q: 'Sezonluk kafelerde kışın kullanmadığımız aylarda taahhüt cezası var mı?',
        a: 'Hayır. Hiçbir paketimizde yıllık taahhüt veya iptal cezası yoktur; istediğiniz ay planınızı değiştirebilir veya durdurabilirsiniz.',
      },
      {
        q: 'Çevre esnafın günlük çay ve öğle yemeği hesaplarını ayrı takip edebilir miyiz?',
        a: 'Evet. Abonman / veresiye cari defteri üzerinden komşu esnafa kart açıp haftalık ya da aylık toplu tahsilat alabilirsiniz.',
      },
      {
        q: 'Ücretsiz pakette kaç masa açabilirim?',
        a: 'Çırak paketi ile 3 masaya kadar süresiz ₺0 ücretle test edip kullanabilirsiniz. Sınırsız masa, canlı QR sipariş ve garson çağrı için Patron VIP (₺499/ay) paketi mevcuttur.',
      },
    ],
    relatedLinks: [
      {
        label: 'Ücretsiz QR Menü Sistemi',
        href: '/qr-menu',
        description: 'Masaya özel karekod menü tasarımı ve anlık fiyat güncelleme detayları.',
      },
      {
        label: 'QR Menü Nedir, Nasıl Yapılır? (Blog)',
        href: '/blog/qr-menu-nedir-nasil-yapilir',
        description: 'Masa ortalamasını artıran menü kurgusu ve PDF tuzağından kaçınma.',
      },
      {
        label: 'Gün Sonu Z Raporu Programı',
        href: '/gun-sonu-raporu',
        description: 'Kapanışta açık masa uyarısı ve nakit/POS/havale mutabakatı.',
      },
      {
        label: 'Esnaf Kasa Takip Programı',
        href: '/kasa-programi',
        description: 'Toptancı vadeleri, mutfak giderleri ve net işletme kârı.',
      },
    ],
  },

  '/bakkal-market': {
    key: '/bakkal-market',
    primaryKeyword: 'bakkal market barkodlu pos sistemi',
    badge: 'Bakkal, Market, Şarküteri & Tekel Çözümü',
    h1: 'Bakkal Market Barkodlu POS Sistemi: Kamera ile Barkod Okutma, Stok ve Veresiye',
    subtitle:
      'Pahalı barkod okuyucu ve kasa bilgisayarı almadan telefon kameranızla ürün okutun. Terazili gramaj satışı, kritik stok uyarısı ve WhatsApp hatırlatmalı veresiye defteri tek ekranda.',
    ogImage: '/og/bakkal-market.png',
    introParagraphs: [
      'Mahalle bakkalı, mini market, şarküteri, manav ve kuruyemiş dükkanları günde yüzlerce küçük kalem ürünün döndüğü hızlı perakende noktalarıdır. Sabah ekmek-süt yoğunluğundan akşam iş çıkışı alışverişine kadar tezgah önünde sıra bekleyen müşteriye hızlı fiyat çıkarabilmek, aynı anda da "Deftere yaz abi" diyen komşunun hesabını aksatmadan tutabilmek gerekir.',
      'Ancak klasik barkodlu POS sistemleri küçük ve orta ölçekli market esnafı için ağır bir yatırım yükü getirir: Dokunmatik terminal, lazer el okuyucu, fiş yazıcı ve yıllık yazılım lisansları on binlerce lira tutar. Üstelik barkodu olmayan manav/şarküteri ürünlerinde hızla kilo-gramaj hesaplamak ve raflarda bitmek üzere olan ürünleri fark etmek her zaman ayrı derttir.',
      'Dükkânım Yanımda bakkal market barkodlu POS sistemi, mevcut akıllı telefonunuzu veya tabletinizi ek donanım gerektirmeyen akıllı bir tezgah kasasına dönüştürür. Telefon kamerasıyla ürün barkodunu okutarak saniyeler içinde sepet oluşturur, tek tıkla nakit/kart/veresiye olarak satışı kapatır ve stoklar kritik seviyenin altına düştüğünde anında uyarı alırsınız.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Ürünlerini Kamera ile Okut veya Hızlı Tuş Ekle',
        description:
          'Telefon kamerasıyla barkodlu ürünlerini fiyat ve kritik stok limitiyle tanımla; ekmek, poşet ve şarküteri için hızlı tuşlar oluştur.',
      },
      {
        step: '2',
        title: 'Tezgahta 3 Saniyede Satış ve Terazili Hesap Yap',
        description:
          'Müşterinin sepetini kamerayla okut veya gramaj girerek anında topla; nakit, kart, IBAN veya veresiye olarak kapat.',
      },
      {
        step: '3',
        title: 'Kritik Stok Listesini ve Veresiyeyi İzle',
        description:
          'Azalan ürünleri toptancı gelmeden gör; veresiye alacaklarını WhatsApp hatırlatma şablonlarıyla zamanında tahsil et.',
      },
    ],
    featureSections: [
      {
        heading: 'Ek Cihaz Almadan Telefon Kamerasıyla Hızlı Barkod Okutma',
        paragraphs: [
          'Yeni bir mahalle marketi açtığınızda ya da kağıt kalemden dijitale geçerken binlerce liralık lazer okuyucu ve kasa bilgisayarı satın almanıza gerek yoktur. Dükkânım Yanımda’nın dahili kamera tarayıcısı, telefonunuzun kamerasını hızlı bir barkod okuyucuya çevirir. Ürünü kameraya gösterdiğiniz anda sepete eklenir ve toplam tutar otomatik hesaplanır.',
          'Dilerseniz USB ya da Bluetooth el barkod okuyucu da bağlayabilirsiniz; sistem her iki yöntemle de sorunsuz çalışır. Ayrıca barkodsuz günlük ürünlerde (ekmek, su, yumurta, poşet) kategori ve hızlı seçim tuşları sayesinde tek dokunuşla satış geçersiniz.',
        ],
        bullets: [
          'Telefon veya tablet kamerasıyla ek donanım maliyeti olmadan anında barkod okuma',
          'Mevcut USB/Bluetooth el tipi barkod okuyucularla da uyumlu çalışma',
          'Barkodsuz sık satılan ürünler (ekmek, su, gazete vb.) için tek dokunuşlu hızlı tuşlar',
          'Alış fiyatı ve satış fiyatı takibiyle ürün başına brüt kâr marjını görebilme',
        ],
      },
      {
        heading: 'Şarküteri, Manav ve Kuruyemiş İçin Terazili / Gramajlı Satış',
        paragraphs: [
          'Bir bakkalda veya şarküteride sadece paketli barkodlu ürünler satılmaz; müşterinin "350 gram beyaz peynir", "1.25 kg domates" ya da "400 gram karışık kuruyemiş" istediği onlarca tartılı satış olur. Bu tutarları kafadan hesaplayıp fiyat yuvarlamak hem hata riski doğurur hem de stok takibini bozar.',
          'Terazili ürün desteği sayesinde ürünün kilogram fiyatını bir kez kaydedersiniz; satış anında 0.350 kg veya hazır gramaj presetlerinden (250g, 500g, 1kg) birini seçtiğinizde tutar kuruşu kuruşuna hesaplanır ve stoktan doğru miktar düşülür.',
        ],
        bullets: [
          'Adet, kilogram, litre, paket ve koli gibi farklı birim türleriyle stok yönetimi',
          'Gramaj presetleri (250 g, 500 g, 1 kg) ve ondalıklı kilo girişiyle hızlı tartılı fiyat hesabı',
          'Manav, kasap ve şarküteri reyonları için saniyelik sepet ekleme kolaylığı',
          'Fiyatı değişen ürünlerde raf etiketine göre saniyeler içinde fiyat güncelleme',
        ],
      },
      {
        heading: 'Kritik Stok Uyarıları ve Toptancı Sipariş Hazırlığı',
        paragraphs: [
          'Müşterinin tam ihtiyacı olan ayçiçek yağı, toz şeker, bebek bezi veya siyah çay rafta kalmadığında yalnızca o günkü satışı değil, müşterinin komşu markete gidip tüm sepeti oradan almasını da kaybetmiş olursunuz. Öte yandan gereksiz fazla stok tutmak da kasanızdaki nakdi rafta kilitlemek demektir.',
          'Her ürün için bir "Kritik Stok Seviyesi" (örneğin çayda 5 paket, yağda 4 şişe) belirlersiniz. Satışlar yapıldıkça stok otomatik azalır; ürün belirlediğiniz sınırın altına düştüğü anda sistem sizi uyarır. Böylece toptancı kapıya geldiğinde rafları tek tek dolaşmadan elinizdeki eksik listesine bakarak doğru sipariş verirsiniz.',
        ],
        bullets: [
          'Her satışta barkodlu ve gramajlı ürünlerin stoktan otomatik düşülmesi',
          'Belirlenen eşiğin altına inen ürünler için anlık Kritik Stok uyarısı',
          'Toptancı/tedarikçi cari kartlarıyla mal alım borçlarını ve vadelerini takip etme',
          'En hızlı dönen ve kasa bırakan ürünleri tespit ederek raf sermayesini verimli kullanma',
        ],
      },
      {
        heading: 'Mahallenin Dijital Veresiye Defteri ve Tek Tık WhatsApp Tahsilat',
        paragraphs: [
          'Bakkal ve marketlerin rekabet gücü büyük zincir marketlerde olmayan mahalle sıcaklığı ve komşuluk veresiyesidir. Ancak bu veresiyenin kağıt defterde kaybolmaması gerekir. Tezgahta sepeti okuttuktan sonra müşteri "Hesaba yazalım" dediğinde tek tuşla tutarı müşterinin cari kartına aktarırsınız.',
          'Eski kareli defterinizdeki bakiyeleri açılış borcu olarak sisteme tek seferde aktarabilirsiniz. Ay başında veya maaş günlerinde Tahsilat Turu listesini açıp geciken alacaklara tek dokunuşla kibar WhatsApp borç ekstresi gönderirsiniz. Tahsilat yapıldığı anda tutar nakit/POS/havale olarak günlük kasaya eklenir.',
        ],
        bullets: [
          'Barkodlu satış sepetini tek tıkla müşterinin veresiye borcuna ekleme',
          'Eski defterden 5 dakikada geçmeyi sağlayan açılış bakiyesi girişi',
          'Tahsilat Turu ile en yüksek veya en eski borçlu müşterileri sıralama',
          'Kibar dükkan ağzıyla hazırlanmış WhatsApp borç özeti ve IBAN paylaşımı',
        ],
      },
      {
        heading: 'Dört Kanallı Kasa Takibi, Gün Sonu ve Esnaf Dostu Bütçe',
        paragraphs: [
          'Akşam kepenk kapatırken hangi ödeme kanalından ne kadar tahsilat yapıldığını bilmek bakkal esnafına büyük huzur verir. Nakit çekmece, POS kredi kartı, banka IBAN/FAST ve veresiye tahsilatları gün sonu ekranında net ayrılır. Ekmekçiye veya sütçüye elden verdiğiniz nakit ödemeleri gider olarak girdiğinizde akşam kasada bir kuruş bile açık çıkmaz.',
          'Çırak paketi ile ₺0 ücretle 25 müşteriye kadar veresiye ve temel POS/stok takibini süresiz ücretsiz kullanabilirsiniz. Müşteri ve ürün hacmi büyüdükçe Usta (₺249/ay) veya sınırsız kayıt, Tahsilat Turu ve Patron Raporu sunan Patron VIP (₺499/ay) paketine geçebilirsiniz.',
        ],
        bullets: [
          'Nakit, POS, havale ve veresiye tahsilatlarının akşam 30 saniyede gün sonu mutabakatı',
          'Ekmekçi, sucu, kargo ve toptancı elden ödemelerinin kasadan anlık düşülmesi',
          'Telefon kaybolsa bile verileri koruyan gece otomatik bulut yedekleme',
          'Taahhüt veya donanım zorunluluğu olmadan ₺0 ile başlama imkanı',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'POS Donanım Maliyeti',
        oldWay: 'Dokunmatik kasa bilgisayarı, barkod okuyucu ve yıllık yazılım lisansına büyük yatırım',
        newWay: 'Mevcut telefon kamerasıyla barkod okutma — ₺0 donanım yatırımı',
      },
      {
        title: 'Veresiye ve Kasa Uyumu',
        oldWay: 'Ayrı kareli defterde tutulan veresiye ve akşam şaşan kasa hesapları',
        newWay: 'Satış sepetinden tek tıkla veresiye kartına işlenen, tahsilatta kasaya eklenen düzen',
      },
      {
        title: 'Stok ve Toptancı Kontrolü',
        oldWay: 'Ürün rafta tamamen bitince fark etmek ve toptancıya eksik sipariş vermek',
        newWay: 'Kritik stok uyarısı ile bitmeden haber alma ve tedarikçi borç takibi',
      },
      {
        title: 'Tartılı ve Barkodsuz Satış',
        oldWay: 'Peynir, zeytin veya domateste el hesap makinesiyle gramaj hesaplamak',
        newWay: 'Kilogram fiyatı üzerinden gramaj presetleri ve ondalıklı anlık tutar hesaplama',
      },
    ],
    testimonials: [
      {
        name: 'Metin K.',
        shopAndCity: 'Mahalle Bakkalı · Keçiören / Ankara',
        quote:
          '25 bin liralık barkod sistemi kuracaktım, önce Dükkânım Yanımda’yı tablete kurdum. Kamera bile barkodları hızlıca okuyor, veresiye defterimiz de tamamen dijitale geçti.',
        rating: '5.0',
      },
      {
        name: 'Serdar U.',
        shopAndCity: 'Şarküteri & Kahvaltılık · İzmit / Kocaeli',
        quote:
          'Peynir ve zeytin gibi gramajlı ürünlerde fiyat hesaplamak ve stoktan düşmek çok pratik. Kritik stok uyarısı sayesinde mandıracıya eksik listemiz hep hazır.',
        rating: '4.9',
      },
      {
        name: 'Zekiye A.',
        shopAndCity: 'Mini Market · Buca / İzmir',
        quote:
          'Sabah sütçüye, öğlen ekmekçiye elden para ödedikçe hemen gider giriyorum. Akşam kepenk kapatırken kasada tek kuruş şaşma olmuyor.',
        rating: '5.0',
      },
    ],
    faq: [
      {
        q: 'El barkod okuyucu almadan telefon kamerasıyla gerçekten barkod okutabilir miyim?',
        a: 'Evet. Telefon veya tabletinizin kamerası standart ürün barkodlarını (EAN-13/EAN-8) doğrudan tarayıcı üzerinden okur ve ürünü sepete ekler. İsterseniz harici USB/Bluetooth okuyucu da kullanabilirsiniz.',
      },
      {
        q: 'Barkodu olmayan ekmek, poşet veya manav ürünlerini nasıl satarım?',
        a: 'Barkodsuz ürünler için hızlı seçim butonları oluşturabilir, şarküteri ve manav ürünlerinde ise kilogram fiyatı üzerinden gramaj girişi yapabilirsiniz.',
      },
      {
        q: 'Eski kağıt veresiye defterindeki borçları sisteme kolayca aktarabilir miyim?',
        a: 'Evet. Müşterinin adını ve telefonunu ekleyip mevcut toplam borcunu "Açılış Bakiyesi" olarak tanımlamanız yeterlidir; tüm mahalleyi dakikalar içinde geçirebilirsiniz.',
      },
      {
        q: 'Kritik stok uyarısı nasıl çalışır?',
        a: 'Her ürün için minimum stok adedi veya kilosu belirlersiniz. Satış yapıldıkça stok düşer ve kritik seviyenin altına inen ürünler ekranda kırmızı uyarıyla listelenir.',
      },
      {
        q: 'Müşteri alışverişin yarısını nakit ödeyip kalanını veresiye yazdırabilir mi?',
        a: 'Evet. Alınan nakit veya kart ödemesini kasaya işleyip kalan bakiyeyi müşterinin veresiye kartına yazabilirsiniz.',
      },
      {
        q: 'Toptancılara olan borçlarımı ve ödediğim faturaları da takip edebilir miyim?',
        a: 'Evet. Tedarikçi cari kartları bölümünden toptancı borçlarınızı, vade tarihlerini ve yaptığınız kısmi ödemeleri izleyebilirsiniz.',
      },
      {
        q: 'İnternet yavaşsa veya elektrik kesilirse satış durur mu?',
        a: 'Sistem telefonunuzda mobil veriyle (4.5G) bile çok hafif ve hızlı çalıştığı için elektrik kesintisinde dahi dükkanınızda satış ve veresiye kaydı almaya devam edersiniz.',
      },
      {
        q: 'Bu sistem resmi yazar kasa veya e-Fatura cihazının yerine geçer mi?',
        a: 'Hayır. Yasal mali fiş/fatura işlemlerinizi yeni nesil yazar kasa POS cihazınızdan kesmeye devam edersiniz. Dükkânım Yanımda stok, hızlı fiyatlandırma, veresiye, tedarikçi ve gün sonu kasa kontrol merkezinizdir.',
      },
      {
        q: 'Ücretsiz başlangıçta kredi kartı veya kurulum ücreti var mı?',
        a: 'Yoktur. Çırak paketi ₺0 ücretle hemen açılır; işiniz büyüdüğünde Usta (₺249/ay) veya sınırsız Patron VIP (₺499/ay) paketine geçebilirsiniz.',
      },
    ],
    relatedLinks: [
      {
        label: 'Dijital Veresiye Defteri Uygulaması',
        href: '/veresiye-defteri',
        description: 'Açılış bakiyesi, Tahsilat Turu ve tek tık WhatsApp borç ekstresi detayları.',
      },
      {
        label: 'Veresiye Defteri Nasıl Tutulur? (Blog)',
        href: '/blog/veresiye-defteri-nasil-tutulur',
        description: 'Kağıttan dijitale geçiş ve komşuyu kırmadan alacak tahsil etme rehberi.',
      },
      {
        label: 'Esnaf Kasa Takip Programı',
        href: '/kasa-programi',
        description: 'Nakit, POS, havale ve toptancı giderlerinin tek kasada yönetimi.',
      },
      {
        label: 'Gün Sonu Z Raporu Programı',
        href: '/gun-sonu-raporu',
        description: 'Bakkal ve marketlerde 30 saniyede akşam çekmece sayımı.',
      },
    ],
  },

  '/izmit-berber-randevu': {
    key: '/izmit-berber-randevu',
    primaryKeyword: 'izmit berber randevu',
    badge: 'İzmit & Kocaeli Canlı Salon Vitrini ve Randevu Sistemi',
    h1: 'İzmit Berber Randevu Sistemi: Fethiye Caddesi’nden Gebze’ye Sıra Beklemeden Randevu',
    subtitle:
      'İzmit Fethiye Caddesi, Yahya Kaptan, Yenişehir, Bekirdere ve Gebze’de online randevu alan açık berber ve erkek kuaförlerinden 15 saniyede yerinizi ayırtın — ya da salonunuzu %0 komisyonla ücretsiz vitrine ekleyin.',
    ogImage: '/og/izmit.png',
    introParagraphs: [
      'Kocaeli, hem yoğun sanayi vardiyalarının hem de Kocaeli Üniversitesi öğrencilerinin ve kalabalık memur/esnaf nüfusunun bir arada yaşadığı dinamik bir şehirdir. İzmit Fethiye Caddesi, Yürüyüş Yolu, Yahya Kaptan, Bekirdere veya Gebze çarşısındaki berber salonlarında özellikle iş çıkışı 17:30 sonrası ve Cumartesi günleri kapı önünde uzun bekleme kuyrukları oluşur.',
      'Vardiyadan çıkan bir fabrika çalışanı ya da Umuttepe’den merkeze inen bir üniversite öğrencisi, tıraş olmak için dükkanda 1 saat beklemek istemez; telefonla tek tek berber aramak yerine Google Haritalar’da ya da Instagram’da gördüğü online randevu linkinden boş koltuğu anında yakalamak ister. Diğer taraftan koltukta ustura ya da makas tutan İzmit esnafı da sürekli çalan telefona yetişmeye çalışırken işinden bölünür.',
      'Dükkânım Yanımda İzmit berber randevu altyapısı, Kocaeli genelindeki tek koltuklu mahalle berberlerinden çok ustalı erkek kuaförlerine kadar tüm salonlara %0 komisyonlu kendi randevu sayfasını sunar. Müşteriler uygulama indirmeden 15 saniyede ustasını ve saatini seçer; akşam ise usta/kalfa primleri ve gün sonu kasası tek tuşla kapanır.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'İzmit / Kocaeli Salonunu 2 Dakikada Kur',
        description:
          'Dükkan adını, semtini, ustalarını ve saç/sakal hizmet tarifeni gir; dilersen mevcut fiyat panonu fotoğrafla okut.',
      },
      {
        step: '2',
        title: 'Özel Randevu Linkini Google ve Instagram’a Ekle',
        description:
          'dukkanimyanimda.com.tr/r/salon-adiniz linkini Google İşletme Profiline, Instagram biyografine ve WhatsApp durumuna koy.',
      },
      {
        step: '3',
        title: 'Sıra Bekletmeden Koltukları Doldur',
        description:
          'Yahya Kaptan’dan Gebze’ye müşterilerin boş saatleri görüp randevu alsın; WhatsApp teyidiyle no-show olmadan günü tamamla.',
      },
    ],
    featureSections: [
      {
        heading: 'Fethiye Caddesi ve Yahya Kaptan Yoğunluğunda Sıra Kargaşasına Son',
        paragraphs: [
          'İzmit merkezde Fethiye Caddesi ve Yürüyüş Yolu çevresindeki berberlerde hafta sonu temposu oldukça yüksektir; Yahya Kaptan ve Yenişehir gibi konut bölgelerinde ise akşam saatleri dakikalar içinde dolar. Kapıda bekleyen müşteriye "40 dakikan var" demek yerine online takvimden net saat vermek hem müşterinin zamanına saygı gösterir hem de koltuğu maksimum verimle çalıştırır.',
          'Müşterileriniz dükkanınızın randevu linkini açtığında hangi ustanın saat kaçta müsait olduğunu doğrudan görür. Yoldan geçerken camdaki QR kodu okutan bir müşteri bile gece kapalı saatlerde ertesi günün öğle randevusunu kendine ayırır.',
        ],
        bullets: [
          'İzmit merkez, Yahya Kaptan, Bekirdere, Alikahya ve Kuruçeşme semtlerine uygun hızlı mobil akış',
          'Müşterinin uygulama indirmeden 15 saniyede usta, hizmet ve saat seçebilmesi',
          'Cumartesi yoğunluğunda çifte rezervasyon ve sıra tartışmalarını sıfıra indirme',
          'Dükkan vitrini veya ayna köşesi için ücretsiz karekod (QR) randevu etiketi çıktısı',
        ],
      },
      {
        heading: 'Kocaeli Sanayi Vardiyalarına ve Öğrenci Saatlerine Göre Esnek Planlama',
        paragraphs: [
          'Kocaeli’de önemli bir kesim 08:00–16:00, 16:00–24:00 veya 24:00–08:00 vardiyalarıyla çalışır; bu nedenle İzmit, Körfez, Derince ve Gölcük’teki berberlerde Salı sabah 10:00 bile yoğun olabilirken akşam 19:00 tamamen doludur. Dükkânım Yanımda çalışma saatleri esnekliği sayesinde vardiya çıkış saatlerinizi ve Pazar açık/nöbetçi günlerinizi serbestçe ayarlarsınız.',
          'Umuttepe ve Kocaeli Üniversitesi öğrencilerinin yoğun olduğu dönemlerde ise hafta içi 11:00–15:00 arasındaki ölü saatlere özel "Öğrenci / Ölü Saat" kampanyası duyurarak hafta sonu yığılmasını hafta içine dengeli biçimde yayabilirsiniz.',
        ],
        bullets: [
          'Haftanın her günü için farklı açılış–kapanış ve öğle molası saati belirleyebilme',
          'Vardiya çalışanları için sabah erken veya akşam geç saat slotlarını açık tutma',
          'Patron Raporu ile haftanın en sakin saatlerini bulup ölü saat duyurusu gönderme',
          'Öğle arasında hızlı kesim isteyen beyaz yakalı ve esnaf müşterilere dakiklik sunma',
        ],
      },
      {
        heading: 'Gebze, Darıca ve Körfez Çok Koltuklu Salonlarında Usta Prim Yönetimi',
        paragraphs: [
          'Gebze, Darıca, Çayırova, Körfez ve Başiskele gibi hızla büyüyen Kocaeli ilçelerinde 3 ila 6 koltuklu modern erkek kuaförlerinin sayısı hızla artıyor. Çok koltuklu salonlarda yalnızca randevu değil, akşam kasa kapatırken her ustanın ve kalfanın hakedişini şeffaf biçimde ayırmak da büyük önem taşır.',
          'Sistemimizde her usta için ayrı takvim açılır ve farklı komisyon/prim oranları tanımlanır. Müşteri randevu alırken kendi alıştığı ustayı seçer; işlem tamamlanıp kasaya işlendiğinde akşam usta primleri ile dükkan net kazancı 20 saniyede hatasız raporlanır.',
        ],
        bullets: [
          'Her koltuk ve usta için ayrı online takvim ve kişiye özel prim yüzdesi',
          'Müşterinin favori ustasını seçip sadece onun boş saatlerini görmesi',
          'No-show önleyici 2 saat kala tek tık WhatsApp hatırlatma şablonu',
          '10’lu dijital sadakat kartıyla üniversite öğrencileri ve semt sakinlerini müdavime çevirme',
        ],
      },
      {
        heading: 'Google’da "İzmit Berber" Aramalarında Öne Çıkan Yerel Görünürlük',
        paragraphs: [
          'İzmit’e iş için gelen bir misafir ya da Başiskele’ye yeni taşınan bir aile, ilk iş Google Haritalar’da en yakın yüksek puanlı berberi arar. Profilinizde sadece adres yazması yerine doğrudan tıklanabilir bir "Online Randevu Al" bağlantısı yer alması, rakiplerinize kıyasla tıklama ve randevu dönüşümünüzü katlar.',
          'Dükkânım Yanımda dükkan sayfaları Kocaeli ve İzmit yerel SEO yapısına uygun LocalBusiness ve HairSalon yapısal verileriyle sunulur. Doğrulanmış müşteri yorumlarınız ve güncel hizmet fiyat tarifeniz arama motorlarında doğrudan indekslenerek organik müşteri trafiği getirir.',
        ],
        bullets: [
          'Google İşletme Profili randevu bağlantısına doğrudan uyumlu /r/dukkan-adiniz linki',
          'HairSalon & LocalBusiness Schema.org yapısal verisiyle arama görünürlüğü',
          'Müşterilerin hizmet ve fiyatları gitmeden görebildiği şeffaf dijital vitrin',
          'Pazaryerleri gibi %20 komisyon kesmeden %0 komisyonla doğrudan müşteri kazanımı',
        ],
      },
      {
        heading: 'Veresiye, Bakım Ürünü Stoğu ve Akşam Kasa Kapanışı Tek Panelde',
        paragraphs: [
          'Kocaeli’deki esnaf kültüründe tanıdık müşterinin "Yarın bırakayım usta" demesi ya da saç şekillendirici wax, sakal serumu satın alması günlük işin parçasıdır. Aynı panel üzerinden veresiye cari kaydını tutar, bakım ürünlerinin stokunu izler ve akşam gün sonu nakit/POS/IBAN sayımını 30 saniyede tamamlarsınız.',
          'Başlangıçta hiçbir risk almazsınız: Çırak paketi ₺0 ve kredi kartsızdır. Tek koltuklu dükkanlar için Usta (₺249/ay), çok ustalı Kocaeli salonları içinse sınırsız randevu ve çoklu prim sunan Patron VIP (₺499/ay) taahhütsüz olarak sunulur.',
        ],
        bullets: [
          'Koltuk randevusu, veresiye defteri ve günlük kasanın tek uygulamada birleşmesi',
          'Wax, pomad, tonik ve kolonya gibi ürünlerin kritik stok takibi',
          'Fotoğraftan AI tarife okuyucu ile Kocaeli Berberler Odası fiyat tarifesini anında aktarma',
          'Çırak (₺0), Usta (₺249/ay) ve Patron VIP (₺499/ay) şeffaf esnaf paketleri',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'İzmit Hafta Sonu Sıra Yönetimi',
        oldWay: 'Fethiye Cd. ve mahalle berberlerinde kapıda 45–60 dakika sıra beklemek',
        newWay: 'Müşteri evden boş saati seçer, tam saatinde gelip koltuğa oturur',
      },
      {
        title: 'Randevu Komisyonu',
        oldWay: 'Büyük uygulamalarda her yeni Kocaeli müşterisinden %20 komisyon kesilmesi',
        newWay: '%0 komisyon — Google ve Instagram’dan gelen tüm ciro kasanızda kalır',
      },
      {
        title: 'Telefon ve DM Yoğunluğu',
        oldWay: 'Tıraş yaparken "Yer var mı?" telefonlarına cevap verip müşteri kaybetmek',
        newWay: '7/24 açık /r/dukkan-adiniz sayfasından otomatik randevu akışı',
      },
      {
        title: 'Usta Prim & Kasa Kapanışı',
        oldWay: 'Akşam yorgunlukla kağıttan kesim sayısı ve kasa hesabı çıkarmak',
        newWay: 'Her ustanın primi ve gün sonu nakit/POS mutabakatı 30 saniyede hazır',
      },
    ],
    testimonials: [
      {
        name: 'Volkan A.',
        shopAndCity: 'Erkek Kuaförü (3 Koltuk) · Fethiye Cd. / İzmit',
        quote:
          'Cumartesi günleri kapı önünde 6 kişi bekliyordu, gelen yeni müşteriler dönüp gidiyordu. Online randevuya geçince sıra stresi bitti, günlük tıraş sayımız %25 arttı.',
        rating: '5.0',
      },
      {
        name: 'Emrah Ş.',
        shopAndCity: 'Berber & Cilt Bakımı · Yahya Kaptan / İzmit',
        quote:
          'Yahya Kaptan’daki müşterilerimizin çoğu çalışan kesim; akşam 22:00’de ertesi güne randevu alıyorlar. WhatsApp hatırlatması sayesinde boş koltuk neredeyse kalmıyor.',
        rating: '5.0',
      },
      {
        name: 'Sinan Ç.',
        shopAndCity: 'Modern Berber Salonu · Gebze / Kocaeli',
        quote:
          'Vardiya çıkışına denk gelen yoğunluğu takvimle çok iyi dengeledik. İki kalfamın primini akşam tek tuşla görüyorum, hiç kafa karışıklığı olmuyor.',
        rating: '4.9',
      },
    ],
    faq: [
      {
        q: 'İzmit berber randevusu müşteriler tarafından uygulama indirmeden alınabilir mi?',
        a: 'Evet. Müşterileriniz dükkanınızın /r/dukkan-adiniz linkine tıkladığında hiçbir uygulama indirmeden telefon tarayıcısından 15 saniyede randevu alabilir.',
      },
      {
        q: 'Sistem sadece İzmit merkezde mi yoksa Gebze, Körfez ve Gölcük’te de kullanılıyor mu?',
        a: 'İzmit merkez (Fethiye Cd., Yürüyüş Yolu, Yahya Kaptan, Bekirdere) başta olmak üzere Gebze, Darıca, Körfez, Gölcük, Kartepe, Başiskele ve Derince’deki tüm salonlar 2 dakikada kurup kullanabilir.',
      },
      {
        q: 'Kocaeli esnafı için randevulardan komisyon kesiliyor mu?',
        a: 'Hayır. Tüm paketlerde randevu komisyonu %0’dır; müşterileriniz doğrudan sizin markalı sayfanızdan randevu alır.',
      },
      {
        q: 'Dükkanda Pazar günü açık olduğumuzda sadece Pazar saatlerini farklı ayarlayabilir miyiz?',
        a: 'Evet. Çalışma saatleri ayarından Pazar gününü açık işaretleyip hafta içinden farklı açılış ve kapanış saatleri tanımlayabilirsiniz.',
      },
      {
        q: 'Birden fazla ustası olan İzmit salonlarında müşteri kendi ustasını seçebilir mi?',
        a: 'Evet. Patron VIP paketinde tüm ustalarınız kendi adları ve müsait saatleriyle randevu ekranında listelenir; müşteri tercih ettiği ustayı seçer.',
      },
      {
        q: 'Yaşça büyük veya online kullanmayan semt müşterilerimizi nasıl ekleriz?',
        a: 'Telefonla arayan veya kapıdan giren müşteriyi siz 5 saniyede panelden takvime eklersiniz; online sayfa o saati anında kapatır ve çakışma olmaz.',
      },
      {
        q: 'Mevcut Kocaeli Berberler Odası fiyat tarifemizi kolayca sisteme girebilir miyiz?',
        a: 'Evet. Duvarınızdaki tarifenin fotoğrafını çekerek AI tarife okuyucu ile tüm hizmet ve fiyatları saniyeler içinde aktarabilirsiniz.',
      },
      {
        q: 'İzmit ve Kocaeli berberleri için ücretsiz başlangıç paketi var mı?',
        a: 'Evet. Çırak paketi kredi kartı istemeden süresiz ₺0’dır; tek veya çoklu koltuk ihtiyacınıza göre dilediğiniz an Usta (₺249/ay) veya Patron VIP (₺499/ay) paketine geçebilirsiniz.',
      },
    ],
    relatedLinks: [
      {
        label: 'Kuaför İzmit: Kadın & Unisex Kuaför Randevu Rehberi',
        href: '/izmit-kuafor-randevu',
        description: 'Yahya Kaptan, Yürüyüş Yolu ve Gebze kuaför salonları online randevu vitrini.',
      },
      {
        label: 'Berber Randevu Sistemi (Genel Özellikler)',
        href: '/berber',
        description: 'Koltuk sırası, sadakat kartı, usta prim hesabı ve kasa detayları.',
      },
      {
        label: 'Online Randevu Sistemi',
        href: '/randevu-sistemi',
        description: 'Google Haritalar ve Instagram bio bağlantısı kurulumu.',
      },
      {
        label: 'Berber Randevu Sistemi Neden Gerekli? (Blog)',
        href: '/blog/berber-randevu-sistemi-neden-gerekli',
        description: 'Tıraş ortasında telefon açmadan koltuk verimliliğini artırmanın 7 yolu.',
      },
      {
        label: 'Müşteri Sadakati & Geri Dönüş Rehberi (Blog)',
        href: '/blog/musteri-sadakati-sms-hatirlatma-geri-donus',
        description: '21 günlük tıraş döngüsünde müşteriyi salona geri çağırma taktikleri.',
      },
    ],
    cityDetails: {
      city: 'İzmit',
      region: 'Kocaeli',
      districts: ['İzmit', 'Gebze', 'Körfez', 'Gölcük', 'Kartepe', 'Darıca', 'Başiskele', 'Derince'],
      neighborhoods: [
        'Fethiye Caddesi',
        'Yürüyüş Yolu',
        'Yahya Kaptan',
        'Bekirdere',
        'Yenişehir',
        'Plajyolu',
        'Alikahya',
        'Kuruçeşme',
      ],
      caseStudyTitle: 'İzmit Fethiye Caddesi’nde 3 Koltuklu Salon Örneği: Bekleme Kuyruğundan Tam Doluluğa',
      caseStudySummary:
        'Fethiye Caddesi’ne paralel sokakta hizmet veren 3 koltuklu bir erkek kuaförü, özellikle Cuma akşamları ve Cumartesi günleri telefon trafiği ve kapıda bekleme nedeniyle günlük ortalama 4–5 yürüyen müşteriyi kaybediyordu. /r/ linkini Google Haritalar ve Instagram biyografisine bağlayıp 2 saat kala WhatsApp teyit mesajı göndermeye başladıktan sonraki 30 günde, haftalık boş koltuk süresi %68 azaldı ve Salı–Çarşamba öğlen saatleri düzenli müdavim randevularıyla doldu.',
      localStats: [
        { label: 'Kapsanan Kocaeli İlçesi', value: '8+ İlçe' },
        { label: 'Ortalama Randevu Alma Süresi', value: '15 Saniye' },
        { label: 'Randevu Başına Komisyon', value: '%0' },
        { label: 'No-Show Azalış Hedefi', value: '%70’e Kadar' },
      ],
      b2cCategories: [
        {
          title: 'Erkek Berberi & Modern Kesim',
          badge: 'En Çok Aranan',
          services: ['Saç Kesimi (30 dk)', 'Sakal Tıraşı & Şekillendirme', 'Saç + Sakal + Yıkama', 'Damat Tıraşı & VIP Bakım'],
        },
        {
          title: 'Kadın & Unisex Kuaför',
          badge: 'İzmit Merkez & Yahya Kaptan',
          services: ['Saç Kesimi & Fön', 'Dip Boya & Ombre / Röfle', 'Keratin & Brezilya Fönü', 'Gelin Başı & Özel Gün'],
        },
        {
          title: 'Güzellik & Kişisel Bakım',
          badge: 'Online Takvim',
          services: ['Cilt Bakımı & Buhar Terapisi', 'Kaş Tasarım & Ağda', 'Lazer Epilasyon Seansları', 'Protez Tırnak & Manikür'],
        },
      ],
      districtDirectory: [
        {
          name: 'Fethiye Caddesi & Yürüyüş Yolu',
          highlight: 'Çarşı Merkez · Hızlı Kesim & VIP',
          searchIntent: 'İş çıkışı ve öğle arası sıra beklemeden online koltuk seçimi.',
        },
        {
          name: 'Yahya Kaptan & Yenişehir',
          highlight: 'Aile & Modern Erkek/Kadın Kuaförleri',
          searchIntent: 'Akşam 18:00–21:30 arası vardiya ve site sakinleri için 7/24 rezervasyon.',
        },
        {
          name: 'Alikahya, Bekirdere & Umuttepe',
          highlight: 'Üniversite & Sanayi Bölgesi',
          searchIntent: 'Pazar günü açık nöbetçi kuaför ve uygun fiyatlı öğrenci randevuları.',
        },
        {
          name: 'Gebze, Körfez, Derince & Başiskele',
          highlight: 'Kocaeli Geneli Çok Koltuklu Salonlar',
          searchIntent: 'Usta seçimi ve vardiya çıkışına göre müsait saat sorgulama.',
        },
      ],
    },
  },

  '/izmit-kuafor-randevu': {
    key: '/izmit-kuafor-randevu',
    primaryKeyword: 'kuaför izmit',
    badge: 'İzmit & Kocaeli Online Kuaför Randevu Rehberi',
    h1: 'Kuaför İzmit: Online Randevu Alan Kadın & Erkek Kuaförleri ve Güzellik Salonları',
    subtitle:
      'İzmit Yahya Kaptan, Yürüyüş Yolu, Fethiye Caddesi, Yenişehir, Alikahya ve Gebze’deki kuaför ile güzellik salonlarından sıra beklemeden 7/24 online randevu alın veya salonunuzu %0 komisyonla ücretsiz vitrine ekleyin.',
    ogImage: '/og/kuafor.png',
    introParagraphs: [
      'İzmit’te iyi bir kadın kuaförü, modern erkek kuaförü ya da güvenilir bir güzellik merkezi bulup tam istediğin saate yer ayırtmak çoğu zaman mesaj trafiğine takılır. Yahya Kaptan’dan Yürüyüş Yolu’na, Yenişehir’den Fethiye Caddesi’ne kadar pek çok müşteri saç kesimi, fön, ombre, dip boya veya gelin başı için DM’den “Yarın yer var mı?” yazıp saatlerce cevap beklemek yerine doğrudan boş saatleri görüp 15 saniyede randevu almak istiyor.',
      'Dükkânım Yanımda Kuaför İzmit Rehberi, Kocaeli genelinde dijital randevuya geçmiş aktif kuaför ve berber salonlarını tek vitrinde buluşturur. Müşteriler hiçbir uygulama indirmeden salonların güncel fiyat tarifesini ve müsait saatlerini görerek doğrudan dükkanın kendi randevu sayfasından yerini ayırtır; araya pazaryeri reklamı veya komisyon girmez.',
      'İzmit, Başiskele, Kartepe, Gölcük, Körfez veya Gebze’de kuaför veya güzellik salonu işletiyorsanız, salonunuzu 2 dakikada ücretsiz kaydedip kendi özel randevu linkinizi (dukkanimyanimda.com.tr/salon-adiniz/randevu) hemen Google Haritalar ve Instagram biyografinize bağlayabilirsiniz. Böylece hem bu İzmit vitrininde yer alır hem de “kuaför izmit” ve “izmit kuaför randevu” aramalarında doğrudan kendi markanızla öne çıkarsınız.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Müşteriysen: Semtini ve Salonunu Seç',
        description:
          'İzmit merkez, Yahya Kaptan, Yenişehir veya Gebze’deki aktif salon kartlarından birini seç; hizmet tarifesini ve boş saatleri anında gör.',
      },
      {
        step: '2',
        title: 'Ustanı ve İşlem Süreni Belirle',
        description:
          'Kesim, fön, dip boya, ombre, keratin ya da lazer seansı için tercih ettiğin uzmanı ve uygun saati uygulama indirmeden 15 saniyede onayla.',
      },
      {
        step: '3',
        title: 'Salon Sahibiysen: Google Haritalar & Vitrine Katıl',
        description:
          '2 dakikada ücretsiz kaydol, randevu linkini Google İşletme Profiline ve Instagram bio’na ekle; her randevudan %0 komisyonla koltuklarını doldur.',
      },
    ],
    featureSections: [
      {
        heading: 'Yahya Kaptan, Yürüyüş Yolu ve Yenişehir Kadın Kuaförlerinde Çakışmasız Planlama',
        paragraphs: [
          'Kadın kuaförlerinde ve unisex saç tasarım merkezlerinde 30 dakikalık bir fön ile 180 dakikalık ombre veya balyaj işlemi aynı takvim düzeniyle yürütülemez. İzmit merkezdeki yoğun salonlarda özellikle Cuma–Cumartesi günleri süresiz yazılan randevular tüm öğleden sonranın aksamasına neden olur.',
          'Dükkânım Yanımda altyapısını kullanan İzmit kuaförleri her işlem için gerçek dakikasını tanımlar. Müşteri online randevuda boya + kesim + fön seçtiğinde toplam süre otomatik toplanır ve yalnızca o uzunluktaki kesintisiz boş aralıklar gösterilir.',
        ],
        bullets: [
          'Fön (30 dk), saç kesimi (45 dk), dip boya (90 dk) ve ombre (180 dk) için otomatik süre blokajı',
          'Yahya Kaptan, Yenişehir, Plajyolu ve Çarşı salonlarında 7/24 telefon bekletmeden randevu',
          'Çoklu hizmet seçiminde tahmini toplam tutar ve sürenin müşteriye şeffaf gösterimi',
          'Müşterinin favori saç tasarımcısını veya boya uzmanını seçebilmesi',
        ],
      },
      {
        heading: 'Gelin Başı, Nişan Saçı ve Özel Gün Kaporası Yönetimi',
        paragraphs: [
          'Kocaeli ve İzmit’te yaz düğün sezonu, mezuniyetler ve nişan organizasyonları aylar öncesinden planlanır. Gelin başı, türban tasarım, profesyonel makyaj ve gelin ekibi randevularının kağıt ajanda köşelerine yazılması düğün sabahı kapora ve saat karışıklığı riski doğurur.',
          'Online sisteme geçen İzmit kuaförleri aylar öncesinden özel gün rezervasyonu açar; nakit, POS veya FAST/IBAN üzerinden alınan kaporayı doğrudan müşteri kartına ve kasaya işler. Düğün günü sadece kalan bakiye ekranda net olarak görünür.',
        ],
        bullets: [
          'Gelin saçı, porselen makyaj ve prova randevularını aylar öncesinden takvime kilitleme',
          'Alınan kapora ödemelerini müşteri bakiyesinden ve akşam kasa kapanışından otomatik düşme',
          'Gelin yakını (anne, kız kardeş, nedime) fön ve topuz saatlerini paralel organize etme',
          'Renk formülü ve saç geçmişini müşteri kartında kalıcı olarak saklama',
        ],
      },
      {
        heading: 'Google Haritalar & Instagram Çarpanı: Salonunu "Kuaför İzmit" Aramalarında Üste Taşı',
        paragraphs: [
          'İzmit’te yeni müşteri kazanmanın en hızlı yolu Google Haritalar’da (Google İşletme Profili) dükkanınızı arayan kişiye tıklanabilir bir randevu linki sunmaktır. Profilinde yalnızca adres yazan rakiplerinize kıyasla, "Web Sitesi" veya "Randevu Bağlantısı" alanında dukkanimyanimda.com.tr/salon-adiniz/randevu adresine yer veren salonlar çok daha yüksek randevu dönüşümü alır.',
          'Aynı linki Instagram biyografinize ve Story bağlantı çıkartmalarınıza eklediğinizde, boya veya kesim videosunu görüp DM atan müşteriler saat beklemeden gecenin bir yarısı bile takviminize randevu bırakır.',
        ],
        bullets: [
          'Google İşletme Profili → Randevu Linki alanına %100 uyumlu özel salon bağlantısı',
          'İzmit yerel SEO için HairSalon, AggregateRating ve ReserveAction Schema.org verileri',
          'Google’dan gelen organik müşterilerden %0 komisyon — aracısız doğrudan kazanç',
          'Her kayıtlı İzmit salonunun ilçe ve şehir bazlı açık haritada otomatik listelenmesi',
        ],
      },
      {
        heading: 'Uzman Prim Hesabı, Boya/Bakım Ürünü Stoğu ve Gün Sonu Kasası',
        paragraphs: [
          'Çok koltuklu kuaför ve güzellik salonlarında akşam kasa kapatırken hangi uzmanın kaç fön, kesim veya boya yaptığını hesaplamak yöneticilerin en çok vaktini alan iştir. Dükkânım Yanımda her işlem tamamlandığında ustanın/uzmanın primini otomatik hesaplar.',
          'Salonda satılan profesyonel şampuan, keratin bakım serumu ve güneş kremi gibi perakende ürünlerin stokları da her satışta otomatik düşer; akşam gün sonu raporu nakit, kredi kartı POS ve IBAN toplamlarını 30 saniyede önünüze getirir.',
        ],
        bullets: [
          'Her kuaför uzmanı, manikürcü ve kalfa için ayrı prim yüzdesi (%35–%50 vb.) tanımlama',
          'Perakende bakım ürünleri ve boya stokları için kritik azalma uyarıları',
          'Güzellik salonu bölümü olan merkezler için 6–8–10 seanslık dijital paket sayacı',
          'No-show (gelmeyen müşteri) kayıplarını azaltan 2 saat kala WhatsApp hatırlatma şablonları',
        ],
      },
      {
        heading: 'Neden İzmit Esnafı Dükkânım Yanımda’yı Tercih Ediyor? (%0 Komisyon & Esnek Paketler)',
        paragraphs: [
          'Büyük şehir pazaryeri uygulamaları yeni gelen her müşteriden %15–%20 komisyon keserken, müşterinizi randevu alırken yan sokaktaki rakip salonlarla aynı sayfada gösterir. Dükkânım Yanımda ise size tamamen kendi logonuz ve fiyat listenizle açılan bağımsız bir randevu vitrini verir.',
          'Tek koltuk çalışan kuaförlerden 8 koltuklu Kocaeli güzellik merkezlerine kadar bütçeniz korunur: Çırak paketi ₺0 ile başlar; Usta paketi aylık ₺249, çoklu uzman primi ve sınırsız randevu sunan Patron VIP paketi ise taahhütsüz aylık ₺499’dur.',
        ],
        bullets: [
          'Randevulardan %0 komisyon — kazancınızın tamamı kendi salonunuzda kalır',
          'Çırak paketi (₺0) ile kredi kartı bilgisi vermeden aynı gün yayına alma',
          'Fotoğraftan AI tarife okuyucu ile salon fiyat panonuzu saniyeler içinde aktarma',
          'Telefon, tablet ve bilgisayardan kurulumsuz tarayıcı erişimi ve gece otomatik yedekleme',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'Müşteri İçin Randevu Deneyimi',
        oldWay: 'DM’den veya telefondan “Saat kaç boş, fiyat ne kadar?” diye sorup saatlerce yanıt beklemek',
        newWay: 'İzmit salon vitrininden fiyatları görüp 15 saniyede %100 şeffaf online randevu almak',
      },
      {
        title: 'Kuaför İçin Komisyon Yükü',
        oldWay: 'Pazaryerlerinde yeni müşteri başına %20 komisyon ve SMS kontör masrafları',
        newWay: '%0 komisyon; kendi /salon-adiniz/randevu linkinle müşterinin sadece senin olması',
      },
      {
        title: 'Uzun İşlemlerde Takvim Yönetimi',
        oldWay: 'Kağıt ajandada boya ve fön sürelerinin taşması, koltukta bekleyen müşteriler',
        newWay: '30 dk fön ile 180 dk ombre sürelerinin takvimde otomatik ve çakışmasız bloklanması',
      },
      {
        title: 'Google Haritalar Görünürlüğü',
        oldWay: 'Google’da randevu linki olmadığı için arayan müşterinin rakip salona tıklaması',
        newWay: 'Google İşletme Profili randevu bağlantısı + yerel HairSalon Schema ile yüksek dönüşüm',
      },
    ],
    testimonials: [
      {
        name: 'Selin Y.',
        shopAndCity: 'Kadın Kuaförü & Saç Tasarım · Yahya Kaptan / İzmit',
        quote:
          'Yahya Kaptan’daki çalışan kadın müşterilerimizin çoğu akşam 21:00’den sonra Instagram linkimizden ertesi güne fön ve bakım randevusu alıyor. Sabah telefonu elimize aldığımızda günümüz planlı oluyor.',
        rating: '5.0',
      },
      {
        name: 'Tuğba M.',
        shopAndCity: 'Güzellik & Saç Stüdyosu · Yenişehir / İzmit',
        quote:
          'Hem protez tırnak hem saç boyama yapıyoruz; işlem sürelerini girince kabin çakışmaları tamamen bitti. Kendi Google Haritalar profilimize randevu linkimizi koyduğumuzdan beri yeni müşteri aramaları arttı.',
        rating: '5.0',
      },
      {
        name: 'Volkan A.',
        shopAndCity: 'Erkek Kuaförü (3 Koltuk) · Fethiye Cd. / İzmit',
        quote:
          'Hafta sonu sıra bekleme yüzünden kaçan müşterileri online randevu ile geri kazandık. Akşam kalfaların primlerini kapatmak 30 saniye sürüyor.',
        rating: '4.9',
      },
    ],
    faq: [
      {
        q: 'İzmit’te online kuaför randevusu almak için uygulama indirmem gerekiyor mu?',
        a: 'Hayır. Yukarıdaki aktif salon kartlarından veya dükkanın paylaştığı randevu linkinden doğrudan telefon tarayıcısı üzerinden saniyeler içinde ücretsiz randevu alabilirsiniz.',
      },
      {
        q: 'Kuaför İzmit vitrinine kendi salonumuzu nasıl ücretsiz ekleriz?',
        a: 'Ücretsiz Kayıt butonundan 2 dakikada hesabınızı açıp şehir/ilçe bilginizi "Kocaeli / İzmit" olarak seçmeniz ve hizmetlerinizi eklemeniz yeterlidir; harita ve vitrin görünürlüğü açıksa salonunuz otomatik listelenir.',
      },
      {
        q: 'Kadın kuaförü boya, ombre, röfle ve gelin başı gibi uzun işlemler destekleniyor mu?',
        a: 'Evet. Her hizmet için ayrı süre (30 dk, 90 dk, 180 dk vb.) tanımlanır; müşteri randevu alırken toplam işlem süresine göre sadece kesintisiz müsait saatler gösterilir.',
      },
      {
        q: 'Google Haritalar profilimize bu randevu linkini ekleyebilir miyiz?',
        a: 'Evet! Google İşletme Profilinizdeki Web Sitesi veya Randevu Bağlantısı kısmına https://dukkanimyanimda.com.tr/salon-adiniz/randevu adresini eklemeniz hem dönüşümü artırır hem de yerel sıralamanızı güçlendirir.',
      },
      {
        q: 'Randevulardan herhangi bir komisyon kesiliyor mu?',
        a: 'Kesinlikle hayır. Tüm Dükkânım Yanımda paketlerinde online randevu komisyonu %0’dır.',
      },
      {
        q: 'Salonumuz hem erkek berberi hem kadın kuaförü / güzellik salonu hizmeti veriyorsa kullanabilir mi?',
        a: 'Evet. Tek panelde farklı koltuk, kabin ve uzmanlar açarak kadın, erkek ve güzellik bakımı kategorilerini bir arada yönetebilirsiniz.',
      },
      {
        q: 'No-show (randevusuna gelmeyen müşteri) sorununu nasıl azaltıyoruz?',
        a: 'Randevudan 2 saat önce hazır WhatsApp teyit mesajı göndererek onay alabilir, özel gün ve gelin başı işlemlerinde alınan kaporaları müşteri kartında takip edebilirsiniz.',
      },
      {
        q: 'İzmit dışında Başiskele, Kartepe, Körfez, Derince ve Gebze salonları da katılabilir mi?',
        a: 'Evet. Kocaeli’nin tüm ilçelerindeki kuaför, berber ve güzellik salonları sistemi aynı şekilde kullanabilir ve yerel dizinde yer alabilir.',
      },
    ],
    relatedLinks: [
      {
        label: 'İzmit & Kocaeli Berber Randevu Sistemi',
        href: '/izmit-berber-randevu',
        description: 'Fethiye Cd., Yahya Kaptan ve Gebze erkek kuaförleri için yerel randevu rehberi.',
      },
      {
        label: 'Kuaför Randevu ve Salon Programı',
        href: '/kuafor',
        description: 'Boya, kesim, gelin başı kaporası ve personel prim takip detayları.',
      },
      {
        label: 'Güzellik Salonu & Seans Takibi',
        href: '/guzellik-salonu',
        description: 'Lazer epilasyon, cilt bakımı ve tırnak salonları için seans sayacı.',
      },
      {
        label: 'Instagram Biyografi Randevu Linki Rehberi',
        href: '/rehber/instagram-biyografi-randevu-linki',
        description: 'Instagram ve Google Haritalar’dan komisyonsuz müşteri toplama kılavuzu.',
      },
    ],
    cityDetails: {
      city: 'İzmit',
      region: 'Kocaeli',
      districts: ['İzmit', 'Yahya Kaptan', 'Gebze', 'Körfez', 'Gölcük', 'Kartepe', 'Başiskele', 'Derince'],
      neighborhoods: [
        'Yürüyüş Yolu',
        'Fethiye Caddesi',
        'Yahya Kaptan',
        'Yenişehir',
        'Alikahya',
        'Bekirdere',
        'Plajyolu',
        'Kuruçeşme',
      ],
      caseStudyTitle: 'İzmit’te Kuaför Salonu Büyüme Modeli: Instagram Bio + Google Haritalar Randevu Linki',
      caseStudySummary:
        'İzmit Yahya Kaptan ve Yürüyüş Yolu bölgesindeki kadın kuaförleri ile erkek berberleri, haftalık boya/kesim görsellerinin altına randevu linklerini ve Google Haritalar işletme profillerine doğrudan online rezervasyon adreslerini eklediğinde; DM yanıt beklemeden gelen randevu oranı ilk ayda 3 katına çıkarken telefon kesintileri %70 azalır.',
      localStats: [
        { label: 'Kocaeli Kapsama Alanı', value: '8+ İlçe' },
        { label: 'Ortalama Rezervasyon', value: '15 Saniye' },
        { label: 'Randevu Komisyonu', value: '%0' },
        { label: 'Gelin Başı & Seans Modülü', value: 'Dahil' },
      ],
      b2cCategories: [
        {
          title: 'Kadın Kuaförü & Saç Tasarım',
          badge: 'En Çok Aranan',
          services: ['Saç Kesimi & Fön (45 dk)', 'Dip Boya & Ombre / Balyaj', 'Keratin Bakım & Brezilya Fönü', 'Gelin Başı & Nişan Tasarımı'],
        },
        {
          title: 'Erkek Kuaförü & Berber',
          badge: 'Hızlı Slotlar',
          services: ['Modern Saç Kesimi (30 dk)', 'Sakal Şekillendirme & Bakım', 'Damat Tıraşı & Cilt Bakımı', 'Pazar Açık Nöbetçi Salonlar'],
        },
        {
          title: 'Güzellik & Estetik Merkezleri',
          badge: 'Paket & Seans Takibi',
          services: ['Lazer Epilasyon (6–10 Seans)', 'Hydrafacial Cilt Bakımı', 'Protez Tırnak & Kalıcı Oje', 'İpek Kirpik & Kaş Laminasyon'],
        },
      ],
      districtDirectory: [
        {
          name: 'Yahya Kaptan & Yenişehir',
          highlight: 'Kadın Kuaförleri & Saç Tasarım Stüdyoları',
          searchIntent: 'Boya, ombre, fön ve akşam çıkışı bakım randevuları.',
        },
        {
          name: 'Yürüyüş Yolu & Fethiye Caddesi',
          highlight: 'İzmit Merkez · Çarşı Kuaför & Berberleri',
          searchIntent: 'Gündüz ve hafta sonu sıra beklemeden online koltuk ayırtma.',
        },
        {
          name: 'Alikahya, Başiskele & Kartepe',
          highlight: 'Yeni Konut & Gelin Hazırlık Merkezleri',
          searchIntent: 'Gelin başı, özel gün saçı ve güzellik paketi randevuları.',
        },
        {
          name: 'Gebze, Körfez, Derince & Gölcük',
          highlight: 'Tüm Kocaeli Online Kuaför Ağı',
          searchIntent: 'Çalışan ve öğrenci saatlerine uygun 7/24 randevu seçimi.',
        },
      ],
    },
  },

  '/zonguldak-berber-randevu': {
    key: '/zonguldak-berber-randevu',
    primaryKeyword: 'zonguldak berber randevu',
    badge: 'Zonguldak & Kdz. Ereğli Yerel Berber Çözümü',
    h1: 'Zonguldak Berber Randevu Sistemi: Merkez’den Kdz. Ereğli’ye Online Koltuk Takvimi',
    subtitle:
      'Gazipaşa Caddesi, Soğuksu, Kozlu ve Karadeniz Ereğli’deki berber ile kuaförler için 7/24 online randevu alma, WhatsApp teyit ve kasa/prim yönetimi tek uygulamada.',
    ogImage: '/og/zonguldak.png',
    introParagraphs: [
      'Zonguldak Merkez’in Gazipaşa Caddesi ve Soğuksu çarşısından Kozlu sahiline, Karadeniz Ereğli sahil bandından Çaycuma ve Devrek ilçelerine kadar Batı Karadeniz esnafı müşteriyle sıcak, samimi ilişkilere dayanır. Ancak şehrin dik coğrafyası, yağışlı Karadeniz havası ve maden/sanayi vardiya saatleri ile Bülent Ecevit Üniversitesi öğrencilerinin yoğunluğu birleştiğinde dükkana gelip sıra beklemek müşteri için büyük zahmete dönüşür.',
      'Özellikle yağmurlu bir Zonguldak akşamında ya da Kdz. Ereğli’de hafta sonu çarşı yoğunluğunda berber kapısından geri dönmek istemeyen müşteriler artık gitmeden önce telefonundan boş saat seçmek istiyor. Diğer yandan ustalar da tıraş yaparken sürekli telefonu açıp deftere saat yazmak yerine işine odaklanmak ve akşam prim/kasa hesabını kolayca kapatmak istiyor.',
      'Dükkânım Yanımda Zonguldak berber randevu sistemi, Merkez, Ereğli, Kozlu, Çaycuma, Devrek, Kilimli ve Alaplı’daki berber ve kuaför salonlarına hiçbir kurulum ücreti ve komisyon olmadan 7/24 online rezervasyon sayfası verir. Müşterileriniz İncivez’den ya da Ereğli sahilden 15 saniyede randevusunu alır; siz de koltuk sıranızı, veresiyenizi ve gün sonu kasanızı cebinizden yönetirsiniz.',
    ],
    howItWorks: [
      {
        step: '1',
        title: 'Zonguldak / Ereğli Salonunu Hemen Kur',
        description:
          'Dükkan adını, ilçeni, hizmet tarifen ile ustalarını 2 dakikada ekle; tarayıcıdan kurulumsuz hemen başla.',
      },
      {
        step: '2',
        title: 'Randevu Linkini Müşterilerinle Paylaş',
        description:
          'dukkanimyanimda.com.tr/r/salon-adiniz linkini Instagram’a, Google Haritalar’a ve WhatsApp durumuna yerleştir.',
      },
      {
        step: '3',
        title: 'Online Randevuları Topla, Kasayı Akşam Kapat',
        description:
          'Müşteriler sıra beklemeden randevu saatinde koltuğa otursun; WhatsApp teyidi ve akşam prim hesabı tek ekrandan aksın.',
      },
    ],
    featureSections: [
      {
        heading: 'Gazipaşa Caddesi, Soğuksu ve Kozlu’da Bekleme Derdi Olmadan Tıraş',
        paragraphs: [
          'Zonguldak Merkez’de özellikle Gazipaşa Caddesi, Soğuksu ve Meşrutiyet Mahallesi çevresinde park yeri kısıtlıdır; müşteri aracıyla veya toplu taşımayla merkeze geldiğinde bir de berberde 45 dakika beklemek istemez. Online randevu sayfanızdan müsait saati önceden seçen müşteri tam vaktinde gelip tıraşını olur ve işine döner.',
          'İncivez ve Kozlu bölgesindeki üniversite öğrencileri ise telefonla konuşmak yerine dijital olarak boş saat görmeye alışıktır. Instagram biyografinizde veya WhatsApp hattınızda hazır duran randevu linkiniz genç müşteri kitlesini doğrudan salonunuza çeker.',
        ],
        bullets: [
          'Gazipaşa Cd., Soğuksu, İncivez, Bahçelievler ve Kozlu Sahil müşterilerine 15 saniyede randevu',
          'Müşterilerin uygulama indirmeden doğrudan telefon tarayıcısından yer ayırtabilmesi',
          'Park ve zaman kaybı olmadan tam saatinde koltuğa oturma konforu',
          'Cam veya ayna köşesine asılan karekod ile yoldan geçenlere 7/24 rezervasyon',
        ],
      },
      {
        heading: 'Karadeniz Ereğli ve Alaplı Salonları İçin Çoklu Koltuk & Vardiya Uyumu',
        paragraphs: [
          'Karadeniz Ereğli, Erdemir ve yan sanayi çalışanlarıyla güçlü bir nüfus dinamiğine sahiptir; Ereğli Sahil, Müftü ve Bağlık mahallelerindeki erkek ve kadın kuaförlerinde vardiya çıkış saatlerine göre yoğunluk dalgaları oluşur. Vardiya değişim günlerinde aynı saate telefon yağmuru yaşanması kaçınılmazdır.',
          'Dükkânım Yanımda ile her koltuk ve usta için ayrı takvim tanımlarsınız. Erken saatte ya da akşam kapanışa yakın saatlerde çalışan ustaların müsaitlikleri canlı olarak görünür. Müşteri dilediği ustayı seçip onay aldığında diğer müşterilere o aralık anında kapanır.',
        ],
        bullets: [
          'Kdz. Ereğli ve Alaplı’daki tek veya çok ustalı salonlara uygun esnek vardiya takvimi',
          'Her usta ve kalfa için ayrı hizmet süresi ve yüzdelik prim hesaplama',
          'Kadın kuaförleri için boya, röfle ve fön işlemlerinde süre bazlı otomatik blokaj',
          'Pazar günü nöbetçi veya özel çalışma saatleri için esnek gün ayarlama',
        ],
      },
      {
        heading: 'Çaycuma, Devrek ve Kilimli İlçelerinde %0 Komisyon ve Yerel Güç',
        paragraphs: [
          'Büyük şehir pazaryeri uygulamaları genellikle küçük ilçe esnafından da yüksek aylık abonelik veya randevu başına komisyon talep eder; üstelik küçük bir ilçede zaten kendi tanıdığınız müşteriniz için aracıya pay ödemek mantıklı değildir. Dükkânım Yanımda tüm Zonguldak ilçelerinde %0 komisyonla çalışır.',
          'Çaycuma’dan Devrek’e, Kilimli’den Gökçebey’e kadar her esnaf kendi dükkan linkiyle kendi markasını büyütür. Çırak paketi ile ₺0 maliyetle hemen başlarsınız; telefon hattınız çektiği her yerde dükkanınızın randevuları cebinizde olur.',
        ],
        bullets: [
          'Tüm paketlerde %0 randevu komisyonu — kazancınızın tamamı kasanızda kalır',
          'Müşterinizin karşısına rakip dükkan önerisi çıkaran pazaryeri karmaşası yok',
          'Süresiz ücretsiz Çırak paketi (₺0); büyüyen ekipler için Usta (₺249) ve Patron VIP (₺499)',
          'Kayıp randevu riskini sıfırlayan bulut senkronizasyonu ve gece yedeklemesi',
        ],
      },
      {
        heading: 'WhatsApp Hatırlatma ve 10’lu Sadakat Kartıyla Sadık Müdavim Ağı',
        paragraphs: [
          'Yağışlı günlerde veya yoğun dönemlerde randevusunu unutup gelemeyen (no-show) müşteriler yüzünden koltuğun boş kalmasını istemiyorsanız, randevudan 2 saat önce hazır WhatsApp teyit şablonuyla nazik hatırlatma gönderebilirsiniz. Gelelemeyecek olan kişi önceden bildirdiği için o saati hemen başka bir müşteriye açarsınız.',
          'Ayrıca 10’lu dijital sadakat kartı ile düzenli tıraş veya bakım yaptıran hemşehrilerinizi ödüllendirirsiniz. Kağıt kart gibi cüzdanda kaybolmadan telefon numarası üzerinden puan biriktiren müşteriler 21 günlük tıraş döngüsünde her seferinde yine sizi tercih eder.',
        ],
        bullets: [
          'Tek dokunuşla giden WhatsApp randevu hatırlatma ve konum paylaşım şablonu',
          'Telefon numarasına bağlı kağıtsız 10’lu dijital sadakat kartı',
          '21 gündür uğramayan müdavimlere geri dönüş hatırlatma imkanı',
          'Özel damat tıraşı ve gelin başı işlemlerinde kapora ve kalan bakiye takibi',
        ],
      },
      {
        heading: 'Esnaf Veresiyesi, Bakım Ürünleri ve 30 Saniyede Gün Sonu Kasası',
        paragraphs: [
          'Zonguldak ve Ereğli esnafının samimi ortamında düzenli gelen komşu müşterinin borcunu yazmak ya da saç bakım ürünleri satmak sık rastlanan bir durumdur. Tek ekrandan veresiye defterinizi yönetir, şampuan/wax/sakal yağı stoklarınızı izlersiniz.',
          'Akşam dükkanı kapatırken nakit, kredi kartı POS, IBAN/havale ve veresiye tahsilatları ayrı ayrı hesaplanır; usta ve çırak primleri düşülerek net kârınız 30 saniyede önünüze gelir.',
        ],
        bullets: [
          'Tanıdık müşteriler için tarihli dijital veresiye cari kartı ve WhatsApp özeti',
          'Nakit, POS, havale ve gider ayrımıyla akşam 30 saniyede kasa kapatma',
          'Fotoğraftan AI tarife okuyucu ile duvarınızdaki fiyat listesini saniyede dijitalleştirme',
          'Telefon, tablet ve bilgisayardan ek donanım olmadan tarayıcıyla tam erişim',
        ],
      },
    ],
    comparisonPoints: [
      {
        title: 'Zonguldak’ta Sıra Bekleme',
        oldWay: 'Gazipaşa veya Ereğli çarşısında boş koltuk kovalamak ve yağmurda beklemek',
        newWay: 'Evden veya iş yerinden 15 saniyede boş saati seçip vaktinde koltuğa oturmak',
      },
      {
        title: 'Telefon & WhatsApp Karmaşası',
        oldWay: 'Tıraşı bırakıp telefondan saat tarif etmek ve deftere yazarken çakışma yaşamak',
        newWay: '7/24 otomatik güncellenen çakışmasız /r/dukkan-adiniz online takvimi',
      },
      {
        title: 'Maliyet ve Komisyon',
        oldWay: 'Yüksek kurulum ücretli yazılımlar veya randevu başı %20 komisyonlar',
        newWay: '%0 komisyon; kredi kartsız ₺0 Çırak paketiyle 2 dakikada başlangıç',
      },
      {
        title: 'Akşam Prim & Gün Sonu',
        oldWay: 'Usta-kalfa paylarını akşam kağıt fişlerden tek tek toplamak',
        newWay: 'Her tıraş sonrası otomatik prim hesabı ve 30 saniyede gün sonu kapanışı',
      },
    ],
    testimonials: [
      {
        name: 'Murat Y.',
        shopAndCity: 'Erkek Kuaförü (2 Koltuk) · Gazipaşa Cd. / Zonguldak',
        quote:
          'Gazipaşa’da müşterinin park derdi var, beklemek istemiyorlar. Şimdi herkes randevusunu linkten alıp tam saatinde geliyor, biz de günümüzü rahat planlıyoruz.',
        rating: '5.0',
      },
      {
        name: 'Cemil K.',
        shopAndCity: 'Berber Salonu (4 Koltuk) · Kdz. Ereğli / Zonguldak',
        quote:
          'Erdemir vardiyasından çıkan müşteriler akşam saatlerini hemen dolduruyor. Kalfaların primini akşam hesaplamak artık 1 dakika bile sürmüyor.',
        rating: '5.0',
      },
      {
        name: 'Eren B.',
        shopAndCity: 'Modern Kuaför · İncivez / Kozlu',
        quote:
          'Üniversite öğrencileri aramayı sevmiyor, Instagram profilimizdeki linkten gece yarısı bile randevu alıyorlar. Sabah dükkanı açınca günümüz hazır oluyor.',
        rating: '4.9',
      },
    ],
    faq: [
      {
        q: 'Zonguldak ve Kdz. Ereğli’de online berber randevusu nasıl alınır?',
        a: 'Salonun paylaştığı /r/dukkan-adiniz linkine tıklayarak saç/sakal hizmetinizi, ustanızı ve müsait saatinizi seçip adınız ile telefonunuzu girerek 15 saniyede randevunuzu onaylatabilirsiniz.',
      },
      {
        q: 'Müşterilerin randevu almak için telefonuna uygulama indirmesi gerekiyor mu?',
        a: 'Hayır. Müşteriler hiçbir uygulama yüklemeden telefon tarayıcısı üzerinden doğrudan randevu oluşturur.',
      },
      {
        q: 'Zonguldak Merkez dışında Ereğli, Kozlu, Çaycuma ve Devrek salonları da kullanabilir mi?',
        a: 'Evet. Zonguldak’ın tüm ilçelerindeki berber, kadın kuaförü ve güzellik salonları 2 dakikada ücretsiz kayıt olarak sistemi hemen kullanabilir.',
      },
      {
        q: 'Gelen online randevulardan komisyon kesiliyor mu?',
        a: 'Hayır. Tüm paketlerimizde online randevu komisyonu %0’dır; kazancınızın tamamı salonunuza kalır.',
      },
      {
        q: 'Randevusuna gelemeyecek müşteriler olduğunda koltuk boş kalmaması için ne yapılabilir?',
        a: 'Randevu öncesi tek tıkla göndereceğiniz WhatsApp teyit mesajıyla müşteriden onay alırsınız; iptal eden olursa boşalan saat takvimde yeniden açılır.',
      },
      {
        q: 'Telefonla arayan eski müşterilerimiz için biz manuel randevu ekleyebilir miyiz?',
        a: 'Evet. Panelinizden 5 saniyede manuel randevu girdiğinizde o saat online sayfada otomatik olarak kapanır, asla çifte rezervasyon olmaz.',
      },
      {
        q: 'Berber fiyat tarifemizi sisteme girmek uzun sürer mi?',
        a: 'Hayır. Fotoğraftan AI tarife okuyucu sayesinde duvarınızdaki fiyat listesinin fotoğrafını çekip hizmetleri otomatik aktarabilirsiniz.',
      },
      {
        q: 'Ücretsiz başlamak için kredi kartı bilgisi vermemiz şart mı?',
        a: 'Hayır. Çırak paketi kredi kartı olmadan ₺0 ücretle açılır; birden fazla koltuk ve sınırsız randevu için dilediğiniz zaman Patron VIP (₺499/ay) paketine geçebilirsiniz.',
      },
    ],
    relatedLinks: [
      {
        label: 'Berber Randevu Sistemi',
        href: '/berber',
        description: 'Koltuk sırası, sadakat kartı ve usta prim hesaplama özellikleri.',
      },
      {
        label: 'İzmit & Kocaeli Berber Randevu',
        href: '/izmit-berber-randevu',
        description: 'Kocaeli bölgesindeki berber salonları için yerel randevu sayfası.',
      },
      {
        label: 'WhatsApp Yerine Online Randevu Avantajları (Blog)',
        href: '/blog/whatsapp-yerine-online-randevu-avantajlari',
        description: 'Mesaj trafiğini azaltıp gece bile randevu yakalamanın 6 yolu.',
      },
      {
        label: 'Berber Dükkanı Açmak: Maliyet & Kontrol Listesi (Blog)',
        href: '/blog/berber-dukkani-acmak-maliyet-kontrol-listesi',
        description: 'Yeni salon kurulumu, ruhsat ve ilk gün dijital hazırlık rehberi.',
      },
    ],
    cityDetails: {
      city: 'Zonguldak',
      region: 'Batı Karadeniz',
      districts: ['Merkez', 'Karadeniz Ereğli', 'Kozlu', 'Çaycuma', 'Devrek', 'Kilimli', 'Alaplı', 'Gökçebey'],
      neighborhoods: [
        'Gazipaşa Caddesi',
        'Soğuksu',
        'Ereğli Sahil',
        'İncivez',
        'Bahçelievler',
        'Kozlu Sahil',
        'Meşrutiyet',
        'Mithatpaşa',
      ],
      caseStudyTitle: 'Zonguldak Gazipaşa & Kdz. Ereğli Pilot Salon Özeti: Bekleme Süresinden Tasarruf',
      caseStudySummary:
        'Zonguldak Gazipaşa Caddesi ve Kdz. Ereğli sahil hattında çalışan çok koltuklu salonlarda vardiya ve üniversite saatlerinin aynı anda yoğunlaşması kapıda uzun beklemelere yol açıyordu. Online randevu bağlantısını Google Haritalar ve WhatsApp üzerinden paylaşan pilot salonlar, 1 ay içinde telefon trafiğini %75 düşürdü, öğle ve hafta içi saatlerindeki koltuk doluluğunu belirgin biçimde artırdı ve akşam kasa-prim kapanışını yarım saatten 2 dakikanın altına indirdi.',
      localStats: [
        { label: 'Aktif Hizmet İlçesi', value: '8 İlçe' },
        { label: 'Müşteri Randevu Süresi', value: '15 Saniye' },
        { label: 'Komisyon Oranı', value: '%0' },
        { label: 'Akşam Kasa & Prim Kapanışı', value: '30 Saniye' },
      ],
      b2cCategories: [
        {
          title: 'Erkek Berberi & Modern Tıraş',
          badge: 'En Çok Aranan',
          services: ['Saç Kesimi (30 dk)', 'Sakal Tıraşı & Buhar', 'Saç + Sakal + Bakım', 'Damat Tıraşı Rezervasyonu'],
        },
        {
          title: 'Kadın Kuaförü & Saç Bakım',
          badge: 'Gazipaşa & Ereğli',
          services: ['Kesim & Fön', 'Dip Boya & Ombre', 'Keratin Bakım', 'Gelin Başı & Özel Gün'],
        },
      ],
      districtDirectory: [
        {
          name: 'Gazipaşa Caddesi & Soğuksu',
          highlight: 'Zonguldak Merkez Çarşı Salonları',
          searchIntent: 'Park stresi yaşamadan tam saatinde koltuğa oturma.',
        },
        {
          name: 'Kdz. Ereğli Sahil, Müftü & Bağlık',
          highlight: 'Erdemir Vardiya & Sahil Kuaförleri',
          searchIntent: 'Vardiya çıkışlarına uygun 7/24 online koltuk ayırtma.',
        },
        {
          name: 'Kozlu Sahil & İncivez',
          highlight: 'BEÜN Öğrenci & Genç Kesim',
          searchIntent: 'Telefon açmadan Instagram linkiyle 15 saniyede randevu.',
        },
        {
          name: 'Çaycuma, Devrek & Alaplı',
          highlight: 'İlçe Esnaf & Komisyonsuz Vitrin',
          searchIntent: 'Tanıdık usta seçimi ve hafta sonu sıra beklememe.',
        },
      ],
    },
  },
};

const LANDING_ROUTE_ALIASES: Record<string, LandingPageKey> = {
  '/': '/',
  '/berber': '/berber',
  '/berber-randevu-programi': '/berber',
  '/berber-randevu': '/berber',
  '/erkek-kuafor': '/berber',
  '/kuafor': '/kuafor',
  '/kuafor-randevu': '/kuafor',
  '/kadin-kuafor': '/kuafor',
  '/kuafor-programi': '/kuafor',
  '/guzellik-salonu': '/guzellik-salonu',
  '/guzellik-merkezi': '/guzellik-salonu',
  '/guzellik': '/guzellik-salonu',
  '/lazer-epilasyon': '/guzellik-salonu',
  '/guzellik-salonu-programi': '/guzellik-salonu',
  '/randevu-sistemi': '/randevu-sistemi',
  '/online-randevu': '/randevu-sistemi',
  '/randevu-programi': '/randevu-sistemi',
  '/veresiye-defteri': '/veresiye-defteri',
  '/veresiye': '/veresiye-defteri',
  '/dijital-veresiye': '/veresiye-defteri',
  '/veresiye-programi': '/veresiye-defteri',
  '/kasa-programi': '/kasa-programi',
  '/kasa-takibi': '/kasa-programi',
  '/esnaf-kasa': '/kasa-programi',
  '/gun-sonu-raporu': '/gun-sonu-raporu',
  '/gun-sonu': '/gun-sonu-raporu',
  '/z-raporu': '/gun-sonu-raporu',
  '/qr-menu': '/qr-menu',
  '/dijital-menu': '/qr-menu',
  '/karekod-menu': '/qr-menu',
  '/ucretsiz-qr-menu': '/qr-menu',
  '/kafe-restoran': '/kafe-restoran',
  '/kafe': '/kafe-restoran',
  '/restoran': '/kafe-restoran',
  '/adisyon': '/kafe-restoran',
  '/adisyon-programi': '/kafe-restoran',
  '/bakkal-market': '/bakkal-market',
  '/bakkal': '/bakkal-market',
  '/market': '/bakkal-market',
  '/pos-sistemi': '/bakkal-market',
  '/barkod-pos': '/bakkal-market',
  '/izmit-berber-randevu': '/izmit-berber-randevu',
  '/izmit-berber': '/izmit-berber-randevu',
  '/kocaeli-berber': '/izmit-berber-randevu',
  '/kocaeli-berber-randevu': '/izmit-berber-randevu',
  '/izmit-kuafor-randevu': '/izmit-kuafor-randevu',
  '/izmit-kuafor': '/izmit-kuafor-randevu',
  '/kocaeli-kuafor': '/izmit-kuafor-randevu',
  '/kocaeli-kuafor-randevu': '/izmit-kuafor-randevu',
  '/izmit-guzellik-salonu': '/izmit-kuafor-randevu',
  '/zonguldak-berber-randevu': '/zonguldak-berber-randevu',
  '/zonguldak-berber': '/zonguldak-berber-randevu',
  '/eregli-berber': '/zonguldak-berber-randevu',
  '/kdz-eregli-berber': '/zonguldak-berber-randevu',
  '/eregli-berber-randevu': '/zonguldak-berber-randevu',
};

export function resolveLandingContentKey(cleanPath: string): LandingPageKey | null {
  const withoutQuery = (cleanPath || '').split('?')[0].split('#')[0].toLowerCase().trim();
  const normalized =
    withoutQuery === '' || withoutQuery === '/'
      ? '/'
      : (withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`).replace(/\/+$/, '');
  return LANDING_ROUTE_ALIASES[normalized] || null;
}
