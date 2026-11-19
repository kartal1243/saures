export interface BlogArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  tip?: string;
}

export interface BlogFaqItem {
  q: string;
  a: string;
}

export interface BlogArticle {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  category: 'Randevu & Salon' | 'Veresiye & Kasa' | 'QR Menü & Kafe' | 'İşletme & Vergi';
  author: string;
  authorRole: string;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
  ogImage: string;
  primaryKeyword: string;
  h1: string;
  lead: string;
  keyTakeaways: string[];
  sections: BlogArticleSection[];
  faq: BlogFaqItem[];
  relatedProductHref: string;
  relatedProductLabel: string;
  relatedSlugs: string[];
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'veresiye-defteri-nasil-tutulur',
    title: 'Veresiye Defteri Nasıl Tutulur? (Dijital vs Kağıt)',
    seoTitle: 'Veresiye Defteri Nasıl Tutulur? Dijital vs Kağıt Rehberi | Dükkanım Yanımda',
    description:
      'Bakkal, market, berber ve mahalle esnafı için veresiye defteri nasıl tutulur? Kağıt defterden dijitale kayıpsız geçiş, açılış bakiyesi ve WhatsApp tahsilat yöntemleri.',
    category: 'Veresiye & Kasa',
    author: 'Murat Karahan',
    authorRole: 'Esnaf Operasyon & Finans Editörü',
    publishedAt: '2026-09-12',
    updatedAt: '2026-10-18',
    readTime: '7 dk okuma',
    ogImage: '/og/veresiye-defteri.png',
    primaryKeyword: 'veresiye defteri nasıl tutulur',
    h1: 'Veresiye Defteri Nasıl Tutulur? Kağıt Defterden Dijitale Sağlıklı Geçiş Rehberi',
    lead:
      'Türkiye’de mahalle esnafının müşteriyle kurduğu en güçlü bağlardan biri güvendir; ancak plansız tutulan bir veresiye defteri yıl sonunda ciddi sermaye kaybına dönüşür. Bu rehberde hem kağıt defterin disiplinini hem de dijital veresiye uygulamasına kayıpsız geçişin tüm adımlarını bulacaksınız.',
    keyTakeaways: [
      'Her veresiye işleminde tarih, müşteri adı, ürün/hizmet detayı ve net tutar mutlaka birlikte kaydedilmelidir.',
      'Kağıt defterdeki yıpranma, sayfa karışması ve "ben ödemiştim" tartışmalarının önüne geçmenin tek yolu tarih damgalı dijital cari karttır.',
      'Eski alacakları tek tek geriye dönük girmek yerine müşteri kartına tek kalemde "açılış bakiyesi" yazarak 5 dakikada dijitale geçebilirsiniz.',
      'Veresiye satışın nakit kasadan ayrı tutulması, tahsilat yapıldığı gün kasaya eklenmesi akşam hesap şaşmasını önler.',
      'Nazik ve standart bir WhatsApp borç özeti, yüz yüze isteme mahcubiyetini ortadan kaldırarak tahsilat süresini yarıya indirir.',
    ],
    sections: [
      {
        heading: '1. Veresiye Defteri Neden Hâlâ Kritik ve Kağıt Defter Nerede Tıkanır?',
        paragraphs: [
          'Bakkaldan berbere, nalburdan terziye kadar pek çok işletmede veresiye satış, düzenli gelen komşu müşteriyi elde tutmanın doğal bir parçasıdır. Maaş gününe kadar idare eden mahalle sakinleri veya haftalık ödeme yapan kurumsal komşu esnaflar nakit akışını canlı tutar. Sorun veresiye vermekte değil, verilen tutarların ve tahsilat tarihlerinin şeffaf biçimde izlenememesindedir.',
          'Klasik kareli defterlerde birkaç ay içinde sayfalar yıpranır, aynı isimdeki iki müşterinin borcu birbirine karışır ve kısmi ödemeler üstü çizilerek düşüldüğü için güncel bakiye okunmaz hale gelir. Üstelik dükkan dışında olduğunuzda müşterinin ne kadar borcu kaldığını göremezsiniz; defter kaybolduğunda veya üzerine çay döküldüğünde aylardır biriken alacaklar tamamen belirsizleşir.',
        ],
        bullets: [
          'Aynı soyadı veya lakapla açılan sayfalarda mükerrer borç yazımı yaşanır.',
          'Kısmi ödeme (örneğin 1.450 TL borçtan 500 TL ödeme) yapıldığında eski toplamın karalanması hesap hatası doğurur.',
          'Vade tarihi tutulmadığı için 3 aydır bekleyen alacak ile dün yazılan borç aynı rafta unutulur.',
        ],
        tip: 'Kağıt defterde en büyük gizli kayıp, yazmayı unuttuğunuz küçük tutarlardır. Tezgahta "sonra yazarım" dediğiniz her işlem ay sonunda doğrudan sermayenizden eksilir.',
      },
      {
        heading: '2. Sağlıklı Bir Veresiye Kaydında Mutlaka Bulunması Gereken 5 Bilgi',
        paragraphs: [
          'İster ajanda ister dijital veresiye defteri uygulaması kullanın, bir alacağın tartışmasız tahsil edilebilmesi için standart bir kayıt formatı şarttır. Sadece isim ve rakam yazmak, üzerinden iki hafta geçtiğinde müşterinin "Ben o gün ekmek ve süt almıştım, bu rakam nasıl bu kadar çıktı?" sorusuna yanıt vermenizi zorlaştırır.',
          'Müşteri bazlı cari kart mantığında her işlem satırı zaman damgasıyla saklanmalı ve ödeme yapıldığında toplam bakiyeden otomatik düşülmelidir. Ayrıca müşterinin telefon numarasının baştan alınması, ödeme günü yaklaştığında kibar bir bilgilendirme mesajı gönderebilmek için olmazsa olmazdır.',
        ],
        bullets: [
          'Müşterinin tam adı soyadı ve aktif kullandığı cep telefonu numarası',
          'İşlem tarihi ve saati (örneğin 14 Ekim 18:20)',
          'Alınan ürün veya yapılan hizmet açıklaması (örneğin 2 kg şeker, 1 çay veya saç-sakal tıraşı)',
          'Borç ekleme / tahsilat ayrımı ve ödeme türü (nakit, havale/FAST, kredi kartı)',
          'Belirlenen ödeme sözü veya vade tarihi notu',
        ],
      },
      {
        heading: '3. Kağıt Defterden Dijital Veresiye Defterine 5 Dakikada Kayıpsız Geçiş',
        paragraphs: [
          'Birçok esnafın dijital uygulamaya geçmeyi ertelemesinin sebebi "Defterdeki yüzlerce eski satırı tek tek nasıl gireceğim?" endişesidir. Oysa geçmişteki tüm alışveriş fişlerini tek tek yazmanıza hiç gerek yoktur. Yapmanız gereken tek şey, o gün itibarıyla müşterinin net kalan borcunu hesaplayıp yeni sisteme tek satır "Açılış Bakiyesi" olarak tanımlamaktır.',
          'Dükkânım Yanımda üzerinden bir müşteriyi adı ve telefon numarasıyla eklediğinizde, o ana kadar birikmiş toplam borcunu açılış bakiyesi olarak girersiniz. Eski kareli defteri ise son sayfanın altına "Dijital sisteme aktarıldı" notu düşüp arşiv olarak kenara kaldırırsınız. O günden sonraki her veresiye satış ve tahsilat saniyeler içinde telefona işlenir.',
        ],
        bullets: [
          'Adım 1: Aktif alacaklı olduğunuz müşterileri telefon rehberinizden seçerek veya yazarak kart açın.',
          'Adım 2: Kağıt defterdeki güncel toplam borcu "Açılış Bakiyesi" olarak kaydedin.',
          'Adım 3: Eski defterdeki sayfanın üzerine "Dijitale devredildi" yazıp tarih atın.',
          'Adım 4: Aynı akşam müşterilere yeni dijital hesap özetini WhatsApp üzerinden paylaşarak şeffaflık sağlayın.',
        ],
        tip: 'Çırak paketi ile 25 müşteriye kadar ücretsiz başlayıp mahallenizin en sık veresiye yazdıran isimleriyle sistemi hemen test edebilirsiniz.',
      },
      {
        heading: '4. Müşteriyi Kırmadan Tahsilat Yapmanın Yolu: Standart Hatırlatma Dili',
        paragraphs: [
          'Esnaf için en zor an, kapı komşusundan veya yıllardır tanıdığı müşterisinden gecikmiş alacağı istemektir. Sözlü hatırlatmalar çoğu zaman ertelenir ya da yanlış anlaşılmalara yol açar. Oysa yazılı, net kalemlerden oluşan ve nazik bir dille hazırlanmış WhatsApp hesap özeti hem profesyonel görünür hem de müşteriye ödeme planı yapma kolaylığı tanır.',
          'Ödeme hatırlatmasını akşam dükkan kapanmadan hemen önce veya maaş dönemleri olan ayın 1’i ile 15’i öncesinde yapmak geri dönüş oranını ciddi biçimde yükseltir. Dükkânım Yanımda içindeki Tahsilat Turu özelliği, en yüksek veya en eski borçlu müşterileri sıralayarak tek dokunuşla kibar mesaj şablonunu hazırlar.',
        ],
        bullets: [
          'Kişisel sitem veya sert üslup yerine kurumsal dükkan ağzıyla yazın.',
          'Mesajda toplam güncel bakiyeyi ve son işlem tarihini mutlaka belirtin.',
          'Dükkana uğrayamayan müşteriler için IBAN veya FAST bilginizi mesajın altına ekleyin.',
        ],
      },
      {
        heading: '5. Veresiye Satışı Kasayla Karıştırmamak İçin Gün Sonu Dengesi',
        paragraphs: [
          'Kasa ile veresiye arasındaki ilişki sıkça karıştırılır. Tezgahtan 500 TL’lik ürün veresiye verildiğinde o gün kasanıza nakit girmez; yani fiili kasa mevcudunuz artmaz ama stokunuz azalır ve alacağınız doğar. Tam tersi durumda, müşteri gelip 2 haftalık 1.200 TL’lik borcunu nakit ödediğinde, o günkü satışınız artmasa da kasanıza nakit girişi olur.',
          'İyi bir dijital veresiye defteri, veresiye satışları günlük nakit kasasından ayrı gösterir ve yalnızca tahsilat yapıldığı anda kasaya artı bakiye olarak işler. Böylece akşam kasa sayarken çekmecedeki parayla sistemdeki nakit tutarı kuruşu kuruşuna tutar.',
        ],
        tip: 'Haftada bir kez Tahsilat Turu listesine bakarak 30 günü aşan alacakları ayırın; düzenli ödeyenlerle geciktirenlere farklı veresiye limiti uygulayın.',
      },
    ],
    faq: [
      {
        q: 'Eski kağıt defterdeki tüm ürünleri tek tek sisteme yazmak zorunda mıyım?',
        a: 'Hayır. Müşterinin kağıt defterdeki son güncel borç toplamını tek işlemle "Açılış Bakiyesi" olarak tanımlamanız yeterlidir. Yeni işlemler o andan itibaren tarihli olarak eklenir.',
      },
      {
        q: 'Telefonum bozulursa veya kaybolursa veresiye kayıtlarım silinir mi?',
        a: 'Hayır. Dükkânım Yanımda bulut tabanlı çalışır ve kayıtlarınız düzenli yedeklenir. Yeni bir telefondan veya bilgisayardan numaranızla giriş yaptığınızda tüm defteriniz karşınıza gelir.',
      },
      {
        q: 'Müşteriye WhatsApp üzerinden borç ekstresi gönderince otomatik mi gidiyor?',
        a: 'Tek tıkla müşterinin adı, son işlem detayı ve güncel borcuyla hazırlanmış kibar mesaj şablonu WhatsApp ekranınızda açılır; onaylayıp gönderirsiniz.',
      },
      {
        q: 'Ücretsiz pakette veresiye defteri kullanabilir miyim?',
        a: 'Evet. Çırak paketi ₺0 ücretle 25 müşteriye kadar veresiye cari takibi ve günlük kasa yönetimi sunar; kredi kartı bilgisi istemez.',
      },
    ],
    relatedProductHref: '/veresiye-defteri',
    relatedProductLabel: 'Dijital Veresiye Defteri Uygulamasını İncele',
    relatedSlugs: [
      'kucuk-isletmeler-icin-kasa-takibi-rehberi',
      'gun-sonu-raporu-nasil-hazirlanir',
      'musteri-sadakati-sms-hatirlatma-geri-donus',
    ],
  },
  {
    slug: 'berber-randevu-sistemi-neden-gerekli',
    title: 'Berber Randevu Sistemi Neden Gerekli? 7 Somut Fayda',
    seoTitle: 'Berber Randevu Sistemi Neden Gerekli? 7 Somut Fayda | Dükkanım Yanımda',
    description:
      'Koltuk sırası bekleyen müşterileri kaybetmemek, telefon trafiğini azaltmak ve usta-çırak primini hatasız hesaplamak için berber randevu sisteminin 7 somut faydası.',
    category: 'Randevu & Salon',
    author: 'Emre Aksoy',
    authorRole: 'Berber & Salon Danışmanı',
    publishedAt: '2026-09-18',
    updatedAt: '2026-10-25',
    readTime: '6 dk okuma',
    ogImage: '/og/berber.png',
    primaryKeyword: 'berber randevu sistemi neden gerekli',
    h1: 'Berber Randevu Sistemi Neden Gerekli? Dükkânınıza Katacağı 7 Somut Fayda',
    lead:
      'Eskiden müşteri kapıdan kafasını uzatıp "Sıra var mı usta?" diye sorar, koltuk doluysa beklerdi. Bugün çalışan kesim de gençler de vaktini planlamak istiyor; kapıda 45 dakika beklemek yerine telefondan 15 saniyede randevu veren salona gidiyor. Berber randevu sisteminin günlük kazancınıza doğrudan etki eden 7 faydasını inceleyelim.',
    keyTakeaways: [
      'Tıraş sırasında makası bırakıp telefona bakmak hem mevcut müşteriyi rahatsız eder hem de günde ortalama 40 dakika vakit kaybettirir.',
      'Online randevu linki ile müşteriler gece yarısı veya sabah erken saatte bile dükkanınız kapalıyken yerini ayırtabilir.',
      'Çakışmasız koltuk takvimi sayesinde cumartesi yoğunluğunda iki kişinin aynı saate yazılması gibi tatsızlıklar tamamen biter.',
      'Randevudan 2 saat önce giden WhatsApp hatırlatması gelmeyen müşteri (no-show) kaybını %70’e kadar azaltır.',
      'Usta ve kalfa primleri akşam kağıttan toplanmaz; kesilen her hizmet sonrası hakediş otomatik hesaplanır.',
    ],
    sections: [
      {
        heading: '1. Tıraş Ortasında Çalan Telefonun Görünmeyen Maliyeti',
        paragraphs: [
          'Koltukta sakal düzeltirken veya makasla ince geçiş yaparken cebinizde ya da tezgahta durmadan çalan telefon, berber esnafının en büyük stres kaynağıdır. Açmazsanız arayan müşteri başka berbere gider; açarsanız koltuktaki müşteri beklemek zorunda kalır ve "Abi şu saate yer var mı?" konuşması en az 2-3 dakika sürer.',
          'Günde sadece 12 telefon araması alsanız, eldiven çıkarıp takvim defterine bakmakla günde 35-45 dakika kaybedersiniz. Bu süre neredeyse fazladan bir tam saç-sakal tıraşına eşittir. Online randevu sistemi müşterinin aramadan doğrudan boş saatleri görüp randevu almasını sağlar.',
        ],
        bullets: [
          'Müşteri dükkanınızın web linkinden (/r/dukkan-adiniz) hangi ustanın hangi saatte boş olduğunu görür.',
          'Tıraş kaliteniz bölünmez, koltuktaki müşteriye odaklanırsınız.',
          'Dükkân kapalıyken bile gece 23:00’te ertesi günün randevuları dolmaya devam eder.',
        ],
        tip: 'Telefonla arayan eski müşterilerinize de "Abi WhatsApp’tan şu linki attım, oradan her zaman boş saatleri görüp tek tıkla yer kapabilirsin" diyerek 2 haftada alışkanlığı değiştirebilirsiniz.',
      },
      {
        heading: '2. Kapıda Yığılmayı ve Sıra Kaybını Ortadan Kaldırmak',
        paragraphs: [
          'Özellikle Cuma akşamları ve Cumartesi günleri dükkan önünde üç-dört kişinin beklemesi dışarıdan "işler çok iyi" gibi görünse de gerçekte ciro kaybıdır. İçeri bakıp 3 kişi beklediğini gören yeni bir müşteri çoğu zaman içeri girmeden yoluna devam eder. Bekleyenlerin bir kısmı ise aceleyle kesim yaptırıp memnuniyetsiz ayrılır.',
          'Randevulu düzene geçen berberlerde koltuklar saatlik planlandığı için kapıda gereksiz yığılma oluşmaz. Üstelik müşteri yalnızca 5 dakika önce gelip doğrudan koltuğa oturduğu için bekleme koltukları değil, tıraş koltukları sürekli döner.',
        ],
        bullets: [
          'Saat 14:00, 14:45, 15:30 gibi hizmet süresine göre otomatik aralıklar tanımlanır.',
          'Koltuk başına günlük 2 ila 3 müşteri daha fazla ağırlamak mümkün hale gelir.',
          'Düzenli gelen müşteriler beklemeyeceğini bildiği için sadakati artar.',
        ],
      },
      {
        heading: '3. Randevu Çakışması ve No-Show Firelerine Karşı Otomatik Kalkan',
        paragraphs: [
          'WhatsApp yazışmalarından veya duvardaki kağıt bloknottan randevu tutulduğunda, yoğun bir anda aynı saate iki farklı müşteri yazılması sık rastlanan bir kazadır. İki düzenli müşterinin aynı anda kapıda buluşması salonun itibarını zedeler. Dijital takvimde bir saat dolduğu anda otomatik kapanır ve ikinci bir kayıt açılmasına izin vermez.',
          'Diğer taraftan randevu alıp unutan müşteriler de önemli bir gelir kaybıdır. Randevudan 2 saat önce WhatsApp üzerinden gönderilen nazik hatırlatma mesajı, müşterinin hem saati unutmamasını sağlar hem de gelemeyecekse erkenden haber vermesine olanak tanır.',
        ],
        bullets: [
          'Dolu saatler müşteri ekranında görünmez; çift rezervasyon riski sıfıra iner.',
          'İptal edilen bir randevu anında takvimde boşa düşer ve bekleyen müşteriye açılır.',
          'Sık sık randevusuna gelmeyen müşteriler müşteri kartındaki notlarla kolayca tanınır.',
        ],
      },
      {
        heading: '4. Ölü Saatleri Doldurmak, Prim Hesaplamak ve Sadakat Kurmak',
        paragraphs: [
          'Hafta sonu tüm koltuklar dolarken Salı veya Çarşamba öğleden sonraları genellikle sakin geçer. Kağıt defterle çalışırken kimin ne sıklıkla geldiğini ölçemezsiniz. Dijital sistem ise son 30 gündür uğramayan müdavimleri ve haftanın boş saatlerini tek raporda önünüze getirir; boş saatlere özel kampanya mesajı atarak koltuğu doldurabilirsiniz.',
          'Ayrıca birden fazla usta veya kalfanın çalıştığı berberlerde akşam "Bugün kim ne kadar tıraş yaptı?" hesabı tek tıkla çıkar. Hizmet tarifesinden kesilen her işlem ustanın prim oranıyla çarpılır, akşam kasa kapatırken hiçbir tartışma yaşanmaz. 10’lu dijital sadakat kartı özelliği ile de her 10 tıraşta 1 bakım ya da kesim hediye ederek müşteriyi rakiplere kaptırmazsınız.',
        ],
        bullets: [
          'Salı-Çarşamba ölü saatleri için seçili müşterilere hızlı duyuru gönderebilirsiniz.',
          'Usta ve çırak hakedişleri akşam 10 saniyede netleşir.',
          '10’lu sadakat kartı ile düzenli müşterilerin geri dönüş periyodu kısalır.',
        ],
        tip: 'Pazaryeri uygulamaları ilk randevulardan %20 komisyon keserken, kendi randevu linkinizle (/r/dukkan-adiniz) her randevudan %0 komisyon ödersiniz.',
      },
      {
        heading: '5. Google Haritalar ve Instagram’dan Doğrudan Randevu Akışı',
        paragraphs: [
          'Yeni taşınan veya semtte berber arayan müşterilerin ilk baktığı yer Google Haritalar ve Instagram profilidir. Sadece telefon numarası yazan bir profilde müşteri aramaya çekinebilir; ancak biyografide ve Google profilinde "Online Randevu Al" linki gören müşteri tek dokunuşla fiyat listenizi inceler ve boş saati seçer.',
          'Dükkânım Yanımda ile 2 dakikada ücretsiz hesap açtığınızda işletmenize özel randevu sayfanız otomatik oluşur. Hizmetlerinizi ve sürelerini tanımlayıp linki Instagram biyografinize koyduğunuz anda dükkanınız 7/24 açık bir rezervasyon masasına dönüşür.',
        ],
        bullets: [
          'Uygulama indirme zorunluluğu yok: Müşteri doğrudan tarayıcıda 15 saniyede randevu alır.',
          'Google İşletme Profilinizdeki "Randevu" alanına doğrudan web linkinizi bağlayabilirsiniz.',
          'Fotoğraftan AI tarife okuyucu ile duvarınızdaki fiyat listesini çekip hizmetleri otomatik aktarabilirsiniz.',
        ],
      },
    ],
    faq: [
      {
        q: 'Mahalledeki yaşça büyük müşterilerim online randevu kullanamazsa ne olur?',
        a: 'Hiç sorun değil. Siz yine dükkan panelinden tek tıkla 5 saniyede onlar adına takvime randevu ekleyebilirsiniz; sistem hem telefonla gelen hem online gelen tüm randevuları aynı koltuk takviminde birleştirir.',
      },
      {
        q: 'Müşterilerimin randevu alması için telefona uygulama indirmesi gerekiyor mu?',
        a: 'Hayır. Dükkanınızın /r/dukkan-adiniz linkine tıkladıklarında uygulama indirmeden veya şifre oluşturmadan doğrudan telefon tarayıcısından randevu alırlar.',
      },
      {
        q: 'Gelen online randevulardan komisyon kesiliyor mu?',
        a: 'Kesinlikle hayır. Dükkânım Yanımda tüm paketlerde %0 randevu komisyonu uygular; kazancınızın tamamı kasanızda kalır.',
      },
      {
        q: 'Birden fazla berber koltuğumuz varsa her usta ayrı seçilebiliyor mu?',
        a: 'Evet. Patron VIP paketinde her usta için ayrı takvim, çalışma günü ve prim oranı tanımlayabilirsiniz; müşteri randevu alırken kendi ustasını seçebilir.',
      },
    ],
    relatedProductHref: '/berber',
    relatedProductLabel: 'Berber Randevu ve Koltuk Sistemini Gör',
    relatedSlugs: [
      'kuafor-musteri-gelmeme-no-show-cozumu',
      'whatsapp-yerine-online-randevu-avantajlari',
      'berber-dukkani-acmak-maliyet-kontrol-listesi',
    ],
  },
  {
    slug: 'gun-sonu-raporu-nasil-hazirlanir',
    title: 'Esnaf İçin Gün Sonu Raporu Nasıl Hazırlanır?',
    seoTitle: 'Esnaf İçin Gün Sonu Raporu Nasıl Hazırlanır? Kasa Kapatma Rehberi',
    description:
      'Akşam kepenk kapatırken kasa açığı vermemek için gün sonu raporu nasıl hazırlanır? Nakit, POS, havale, veresiye ve gider mutabakatı için pratik 5 adımlı kontrol listesi.',
    category: 'Veresiye & Kasa',
    author: 'Selin Demirtaş',
    authorRole: 'KOBİ Kasa & Maliyet Uzmanı',
    publishedAt: '2026-09-24',
    updatedAt: '2026-11-02',
    readTime: '7 dk okuma',
    ogImage: '/og/gun-sonu-raporu.png',
    primaryKeyword: 'gün sonu raporu nasıl hazırlanır',
    h1: 'Esnaf İçin Gün Sonu Raporu Nasıl Hazırlanır? 5 Dakikada Hatasız Kasa Kapatma',
    lead:
      'Gün boyu yorulmuşken akşam kasayı açıp kağıt paraları saymak ve POS slipleriyle eşleştirmek esnafın en çok ertelediği iştir. Oysa gün sonu raporu alınmayan bir dükkanda kayıp veya yanlış para üstü fark edilmez, ciro ile kâr birbirine karışır. İşte 5 dakikada biten sade ve eksiksiz gün sonu kapatma sistemi.',
    keyTakeaways: [
      'Gün sonu raporu sadece yazar kasa Z raporu almak değildir; nakit, POS, IBAN/havale, veresiye ve kasa giderlerinin tam mutabakatıdır.',
      'Sabah kasaya bırakılan bozuk para avansı (kasa açılış bakiyesi) akşam toplam nakitten mutlaka düşülmelidir.',
      'Gider fişleri (su, çay, kurye, malzeme alımı) kasadan ödendiyse sisteme girilmezse akşam kasada sürekli "açık" görünür.',
      'IBAN veya FAST ile alınan ödemelerin ayrı satırda izlenmesi, kasanın nakit sayımını karıştırmaz.',
      'Dijital gün sonu programı tüm kanalları tek ekranda toplayarak 1 saatlik hesap makinesi mesaisini 30 saniyeye indirir.',
    ],
    sections: [
      {
        heading: '1. Yazar Kasa Z Raporu Neden Tek Başına Yeterli Değildir?',
        paragraphs: [
          'Pek çok işletme sahibi akşam yazar kasadan Z raporu alıp çekmeceyi kilitleyerek gün sonunu tamamladığını düşünür. Ancak resmi Z raporu size yalnızca fiş kesilen satış toplamını verir; veresiye satışları, önceki günlerin borç tahsilatlarını, kasadan çıkarılıp ödenen toptancı giderlerini veya dükkan sahibinin şahsi çektiği tutarları açıklamaz.',
          'Gerçek bir işletme gün sonu raporu iki soruya net yanıt vermelidir: "Bugün toplam kaç liralık iş yaptık?" ve "Çekmecedeki nakit ile banka/POS hesabımdaki tutar kuruşu kuruşuna tutuyor mu?" Bu iki soruyu ayırdığınız anda dükkanın gerçek nakit sağlığını görmeye başlarsınız.',
        ],
        bullets: [
          'Ciro: O gün yapılan tüm satışların toplamı (nakit + kart + havale + veresiye).',
          'Fiili Kasa Girişi: Çekmeceye giren nakit satışlar + o gün tahsil edilen eski veresiyeler.',
          'Net Kasa Farkı: Beklenen nakit ile çekmecede sayılan fiziksel para arasındaki fark.',
        ],
      },
      {
        heading: '2. Eksiksiz Bir Gün Sonu Raporunun 5 Temel Sütunu',
        paragraphs: [
          'Gün sonunda karmaşa yaşamamak için hesap tablonuzu veya dijital panelinizi beş net bölüme ayırmanız gerekir. Bu yapıyı oturttuğunuzda hem günlük gidişatı hem de ay sonu net kazancınızı çok rahat okursunuz.',
          'Özellikle küçük esnafta gün içi yapılan ödemeler — örneğin kapıdaki temizlikçiye verilen 300 TL veya sütçüye elden verilen 850 TL — kaydedilmezse akşam çekmecede 1.150 TL eksik çıkar ve tüm gece bu paranın nereye gittiği düşünülür.',
        ],
        bullets: [
          '1. Kasa Açılış Avansı: Sabah çekmecede bozuk para olarak bırakılan sabit tutar (ör. 1.000 TL).',
          '2. Ödeme Kanalı Dağılımı: Nakit satış, kredi kartı POS toplamı ve IBAN/FAST havaleleri.',
          '3. Veresiye Hareketleri: Bugün yazılan yeni borçlar ile kasaya nakit/kart olarak giren borç tahsilatları.',
          '4. Gün İçi Masraf ve Giderler: Kasadan ödenen fatura, malzeme, yemek, kurye ve personel avansları.',
          '5. Personel Prim / Pay Dağılımı (varsa): Berber, kuaför veya garson hakediş toplamları.',
        ],
        tip: 'Sabah açılış avansını her gün sabit bir rakamda (örneğin tam 1.000 TL veya 1.500 TL) bırakmak, akşam net ciroyu saymayı inanılmaz kolaylaştırır.',
      },
      {
        heading: '3. Adım Adım 5 Dakikalık Akşam Kasa Kapatma Rutini',
        paragraphs: [
          'Kepenk indirdikten sonra kasanızı kapatmak için karmaşık muhasebe bilgisine ihtiyacınız yoktur. İlk adımda çekmecedeki tüm banknot ve madeni paraları sayıp açılış avansını kenara ayırırsınız. Kalan tutar sizin gün içindeki fiili nakit artışınızdır.',
          'İkinci adımda POS cihazından gün sonu raporu alıp kart toplamını kontrol edersiniz. Son adımda ise banka uygulamasından o gün gelen FAST/havale tutarlarını toplarsınız. Dükkânım Yanımda kullandığınızda sistem bu rakamları gün içinde siz satış girdikçe zaten otomatik toplar; size sadece saydığınız nakdi yazıp "Fark var mı?" diye onaylamak kalır.',
        ],
        bullets: [
          'Adım 1: POS cihazından gün sonu (Z/End of Day) alıp toplam kart tutarını teyit edin.',
          'Adım 2: Çekmecedeki nakdi sayın, sabah bıraktığınız sabit avansı ayırıp zarfa koyun.',
          'Adım 3: Gün içinde kasadan yaptığınız tüm nakit masrafların girildiğinden emin olun.',
          'Adım 4: Açık kalan adisyonları veya yarım kalan randevuları yarınki veya veresiye listesine aktarın.',
          'Adım 5: Günü kapat butonuna basarak raporu bulut arşivine kilitleyin.',
        ],
      },
      {
        heading: '4. Kasa Açığı veya Fazlası Çıktığında Bakılacak 4 Kritik Nokta',
        paragraphs: [
          'Zaman zaman sistemdeki tutarla çekmecedeki para arasında 100 TL ya da 500 TL fark çıkabilir. Hemen panik yapmak yerine sorunun kaynağını hızlıca bulmak için dört klasik hatayı sırayla kontrol etmelisiniz. Çoğu kasa açığı çalınmadan değil, ödeme yönteminin yanlış işaretlenmesinden kaynaklanır.',
          'Örneğin müşteri ödemeyi IBAN üzerinden gönderdiği halde tezgahta hızlıca "Nakit" seçeneğine basılmışsa çekmecede para eksik görünür, oysa para banka hesabınızdadır. Benzer şekilde kasadan alınan bir toptancı faturasının gider olarak düşülmemesi de sahte kasa açığı yaratır.',
        ],
        bullets: [
          'Ödeme türü karışıklığı: IBAN veya POS ile alınan bir işlem yanlışlıkla nakit işlenmiş olabilir.',
          'Unutulan gider fişi: Gün içinde elden verilen yemek, kargo veya malzeme ödemesi girilmemiş olabilir.',
          'Kayıtsız veresiye tahsilatı: Müşteri eski borcunu nakit ödediğinde tahsilat kaydı unutulmuşsa kasada "fazla" çıkar.',
          'Yanlış para üstü veya açık kalmış masa/randevu işlemi.',
        ],
        tip: 'Kasa farkını haftaya bırakmak yerine aynı akşam bulmak her zaman 10 kat kolaydır; çünkü günün müşterileri ve olayları hâlâ hafızanızda tazedir.',
      },
      {
        heading: '5. Kağıt Z Raporu Rulosundan Bulut Gün Sonu Arşivine Geçiş',
        paragraphs: [
          'Termal Z raporu kağıtları birkaç ay içinde güneş ışığı ve ısı nedeniyle silinir; geçen yılın Ekim ayında günde ortalama kaç lira nakit çevirdiğinizi anlamak istediğinizde elinizde okunaksız beyaz kağıtlar kalır. Oysa bulutta saklanan gün sonu raporlarıyla dilediğiniz günün, haftanın veya ayın ciro-gider-kâr karşılaştırmasını saniyeler içinde açabilirsiniz.',
          'Dükkânım Yanımda Patron Raporu ve Gün Sonu ekranları, haftanın hangi günlerinin en verimli geçtiğini, nakit/kart oranlarınızı ve net kâr marjınızı grafiklerle gösterir. Tek tıkla yedek alarak muhasebecinize ya da kendi arşivinize düzenli veri aktarabilirsiniz.',
        ],
        bullets: [
          'Silinmeyen, kaybolmayan tarih bazlı dijital gün sonu arşivi',
          'Nakit, kart ve havale oranlarının haftalık ve aylık trend analizi',
          'Akşam kepenk kapatırken 30 saniyede telefon üzerinden hızlı onay imkanı',
        ],
      },
    ],
    faq: [
      {
        q: 'Gün sonu raporu resmi mali yazar kasa Z raporunun yerine geçer mi?',
        a: 'Hayır. Vergi mevzuatı gereği yazar kasa POS cihazınızdan resmi Z raporu almaya devam etmelisiniz. Dükkânım Yanımda gün sonu raporu ise yazar kasa fişlerinin gösteremediği veresiye, havale, gider ve personel primi dahil tüm işletme nakit dengesini yönetmenizi sağlar.',
      },
      {
        q: 'Gün içinde birden fazla vardiya varsa vardiya bazlı kapanış yapılabilir mi?',
        a: 'Evet. İşlemler saat damgalı tutulduğu için gün içindeki toplamı kontrol edebilir ve akşam ana kapanışta tüm günü tek raporda birleştirebilirsiniz.',
      },
      {
        q: 'Kasadan şahsi harcama veya ev ihtiyacı için para aldığımda bunu nasıl göstermeliyim?',
        a: 'Mutlaka "İşletme Sahibi Çekimi / Şahsi Ödeme" kategorisinde gider veya çıkış olarak kaydedin. Aksi halde dükkanınızın gerçek kârını düşük veya kasayı sürekli açık görürsünüz.',
      },
      {
        q: 'Gün sonu raporunu ücretsiz pakette de görebilir miyim?',
        a: 'Evet. Çırak paketinde temel günlük kasa ve gün sonu özeti ücretsiz sunulur; Patron VIP paketinde ise kârlılık ve dönem karşılaştırma analizleri eklenir.',
      },
    ],
    relatedProductHref: '/gun-sonu-raporu',
    relatedProductLabel: 'Gün Sonu Z Raporu Programını İncele',
    relatedSlugs: [
      'kucuk-isletmeler-icin-kasa-takibi-rehberi',
      'veresiye-defteri-nasil-tutulur',
      'esnaf-icin-e-arsiv-vergi-donemleri-takvimi',
    ],
  },
  {
    slug: 'kuafor-musteri-gelmeme-no-show-cozumu',
    title: 'Kuaförde Müşteri Gelmeme (No-Show) Sorunu Nasıl Çözülür?',
    seoTitle: 'Kuaförde Müşteri Gelmeme (No-Show) Sorunu Nasıl Çözülür? | Dükkanım Yanımda',
    description:
      'Randevusuna haber vermeden gelmeyen müşteriler yüzünden boş kalan koltukları doldurmanın 5 kanıtlanmış yöntemi: WhatsApp teyit, kapora ve bekleme listesi.',
    category: 'Randevu & Salon',
    author: 'Zeynep Çelik',
    authorRole: 'Kuaför & Güzellik İşletme Koçu',
    publishedAt: '2026-09-29',
    updatedAt: '2026-11-06',
    readTime: '7 dk okuma',
    ogImage: '/og/kuafor.png',
    primaryKeyword: 'kuaförde müşteri gelmeme no-show çözümü',
    h1: 'Kuaförde Müşteri Gelmeme (No-Show) Sorunu Nasıl Çözülür? Koltuk Kaybını %70 Azaltın',
    lead:
      'Özellikle kadın kuaförlerinde ve unisex salonlarda bir röfle, ombre veya keratin bakımı 2-3 saatlik koltuk blokajı demektir. Müşterinin son dakikada haber vermeden gelmemesi hem günün en değerli saatini çöpe atar hem de başka bir müşteriyi geri çevirdiğiniz için çifte ciro kaybı yaratır. İşte sahada test edilmiş net çözüm adımları.',
    keyTakeaways: [
      'No-show vakalarının yaklaşık %65’i kötü niyetten değil, unutkanlık ve son dakika iptalini telefonla söylemeye çekinmekten kaynaklanır.',
      '24 saat önce ve 2 saat önce gönderilen iki aşamalı WhatsApp teyidi gelmeme oranını ilk ayda yarıdan fazla düşürür.',
      'Boya, gelin başı ve 90+ dakikalık işlemlerde %20–%30 oranında FAST/IBAN kapora almak ciddiyeti garanti altına alır.',
      'İptal durumunda boşalan saati müdavimlerin bulunduğu bekleme listesine duyurmak kaybı anında telafi eder.',
      'Müşteri kartında "önceki no-show" notu tutmak, tekrarlayan müşterilerde peşin teyit istemenizi sağlar.',
    ],
    sections: [
      {
        heading: '1. Boş Kalan Tek Bir Koltuğun Kuaföre Aylık Gerçek Faturası',
        paragraphs: [
          'Birçok salon sahibi randevusuna gelmeyen müşteriye kızıp "Canı sağ olsun, biraz dinlenmiş olduk" diyerek geçer; ancak hesap ortadadır. Ortalama 1.500 TL’lik bir işlem için ayrılan 2 saatlik slot haftada sadece 2 kez boş kalsa, ayda 12.000 TL’nin üzerinde doğrudan ciro kaybı demektir. Üstelik o saat için personeliniz maaş ve prim beklentisiyle dükkanda hazır beklemektedir.',
          'Dahası, aynı saat dilimini isteyen iki başka müşteriye "Dolu" cevabı verdiğiniz için o müşteriler de rakip salona yönelmiş olur. Bu nedenle no-show sorunu bir görgü meselesi değil, doğrudan salon kârlılığını koruyan bir süreç yönetimi meselesidir.',
        ],
        bullets: [
          'Haftada 2 boş randevu = yılda neredeyse 1 tam aylık dükkan kirası kaybı.',
          'Personelin motivasyonunu düşürür, özellikle primle çalışan ustaların gelirini azaltır.',
          'Günü düzensizleştirir ve öğleden sonraki randevu temposunu bozar.',
        ],
      },
      {
        heading: '2. Çift Aşamalı WhatsApp Teyit Sistemi (24 Saat + 2 Saat Kuralı)',
        paragraphs: [
          'Müşteriler yoğun iş veya aile temposu içinde 4 gün önce aldığı fön veya kesim randevusunu gerçekten unutabilir. Daha sık karşılaşılan durum ise müşterinin gelemediği halde ustanın yüzüne karşı telefonda "İptal ediyorum" demeye çekinip sessiz kalmasıdır. Yazılı bir teyit mesajı bu psikolojik engeli tamamen kaldırır.',
          'En verimli yöntem iki aşamalı hatırlatmadır: İlk mesaj bir gün önce akşamüstü gider ve "Yarın saat 14:00’teki randevunuzu onaylıyorsanız 1 yazmanız yeterli" der. İkinci mesaj ise randevudan 2 saat önce dükkan konumuyla birlikte hatırlatma yapar. Böylece iptal edecek kişi en az bir gün önceden bildirir.',
        ],
        bullets: [
          '1. Mesaj (1 gün önce): Saat teyidi ve gelemeyecekse erkenden bildirme daveti.',
          '2. Mesaj (2 saat önce): Nazik hatırlatma ve konum/adres hatırlatması.',
          'Dükkânım Yanımda üzerinden hazır şablonla tek dokunuşta WhatsApp mesajı oluşturma.',
        ],
        tip: 'Mesajın sonuna "Gelemeyecekseniz sadece İPTAL yazmanız yeterli, yeni uygun saati hemen planlayalım" cümlesini eklemek müşterinin kaçmak yerine yanıt vermesini %80 artırır.',
      },
      {
        heading: '3. Uzun Süreli İşlemler ve Gelin Başında Kapora Standardı',
        paragraphs: [
          '30 dakikalık fön veya kesim randevusunda kapora istemek müşteriye ağır gelebilir; fakat gelin başı, nişan paketi, komple röfle, ombre veya kalıcı makyaj gibi 2-4 saat boyunca bir koltuğu ve uzmanı tamamen kapatan işlemlerde kapora almak artık profesyonel salon standardıdır.',
          'Müşterinin IBAN veya FAST ile işlem bedelinin %20’si kadar ön ödeme yapması psikolojik olarak randevuya bağlılığı neredeyse %100’e çıkarır. Dükkânım Yanımda müşteri ve randevu kartına alınan kaporayı tek tıkla işleyip kalan bakiyeyi işlem günü otomatik düşebilirsiniz.',
        ],
        bullets: [
          '90 dakikanın üzerindeki tüm renklendirme ve özel gün işlemlerinde kapora kuralı koyun.',
          'Ön ödemeyi müşteri kartında kayıt altına alın ki gün sonunda kasayla karışmasın.',
          'İptal koşulunu (örneğin 24 saat öncesine kadar tarih değişikliği hakkı) baştan netleştirin.',
        ],
      },
      {
        heading: '4. Son Dakika İptallerini 10 Dakikada Dolduran Bekleme Listesi Taktiği',
        paragraphs: [
          'Her önleme rağmen hastalık veya acil iş nedeniyle son dakika iptalleri mutlaka yaşanacaktır. Önemli olan boşalan o 90 dakikayı boş geçirmemektir. Bunun için dükkanınızda telefon açıp yer bulamayan veya "Bugün erken boşalırsa bana haber verin" diyen müşterileri küçük bir bekleme listesinde tutmalısınız.',
          'Bir müşteri randevusunu iptal ettiğinde online randevu takviminiz o saati anında yeniden açar. Ayrıca WhatsApp üzerinden bekleme listenize veya mahalle müdavimlerinize "Bugün 15:00’te beklenmedik bir boşluğumuz açıldı, ilk yazan randevuyu kapar" mesajı attığınızda koltuk çoğunlukla 15 dakika içinde dolar.',
        ],
        bullets: [
          'Gün içinde arayıp yer bulamayan müşterilerin telefonunu mutlaka not edin.',
          'Boşalan saati Instagram hikayenizde doğrudan randevu linkinizle (/r/dukkan-adiniz) paylaşın.',
          'Ölü saat veya son dakika dolumlarına küçük bir bakım (örneğin saç maskesi) ikramı ekleyebilirsiniz.',
        ],
      },
      {
        heading: '5. Tekrarlayan No-Show Müşterilerini Zarafetle Yönetmek',
        paragraphs: [
          'Bazı müşteriler alışkanlık haline getirip ikinci veya üçüncü kez haber vermeden randevusuna gelmeyebilir. Kağıt defterde bunu fark etmek zordur; ancak dijital müşteri kartında kişinin geçmiş randevuları ve "gelmedi" etiketleri açıkça görünür.',
          'İkinci kez habersiz gelmeyen bir müşteri yeniden randevu istediğinde tartışmak yerine kibar bir kural uygulayabilirsiniz: "Yoğunluğumuz sebebiyle yeni randevularda ön teyit/kapora ile yer ayırtabiliyoruz." Bu yaklaşım hem salonunuzun değerini korur hem de gerçekten gelecek müşterilere yer açar.',
        ],
        tip: 'Gelmeme sorunu olan müşterileri silmek yerine kartına etiket düşün; böylece hafta sonu en yoğun saati onlara değil, sadık müdavimlerinize ayırırsınız.',
      },
    ],
    faq: [
      {
        q: 'Kuaförde randevu hatırlatma mesajlarını hangi kanaldan göndermek daha etkilidir?',
        a: 'Türkiye’de açılma ve görülme oranı %95’in üzerinde olduğu için WhatsApp hatırlatmaları en hızlı yanıtı alır. Dükkânım Yanımda şablonlarıyla tek tıkla gönderebilirsiniz.',
      },
      {
        q: 'Kapora istemek müşterilerimi kaçırır mı?',
        a: 'Sadece uzun ve maliyetli işlemlerde (gelin başı, röfle, kaynak vb.) istendiğinde müşteriler bunu kurumsallık ve ciddiyet göstergesi olarak görür. Ayrıca ödedikleri tutar işlem ücretinden düşülür.',
      },
      {
        q: 'Müşteri randevusunu iptal etmek isterse ne kadar kolay yapabilir?',
        a: 'Erken haber vermeyi teşvik etmek için WhatsApp üzerinden tek mesajla saat değişikliği yapma imkanı sunmalısınız; ceza değil iletişim kolaylığı no-show’u bitirir.',
      },
      {
        q: 'Kuaför randevu süresini boya ve fön için ayrı ayrı ayarlayabilir miyim?',
        a: 'Evet. Dükkânım Yanımda hizmet tarifesinde kesim için 45 dk, dip boya için 90 dk, ombre için 180 dk tanımlayıp takvimin çakışmasız bloklanmasını sağlarsınız.',
      },
    ],
    relatedProductHref: '/kuafor',
    relatedProductLabel: 'Kuaför Randevu Programını İncele',
    relatedSlugs: [
      'berber-randevu-sistemi-neden-gerekli',
      'musteri-sadakati-sms-hatirlatma-geri-donus',
      'whatsapp-yerine-online-randevu-avantajlari',
    ],
  },
  {
    slug: 'qr-menu-nedir-nasil-yapilir',
    title: 'QR Menü Nedir, Nasıl Yapılır? (Kafe & Restoran)',
    seoTitle: 'QR Menü Nedir, Nasıl Yapılır? Ücretsiz Kafe & Restoran Rehberi',
    description:
      'Kafe ve restoranlar için baskı masrafı olmadan QR menü nedir, nasıl yapılır? PDF hatasından kaçınarak canlı mobil menü ve masadan garson çağırma kurulumu.',
    category: 'QR Menü & Kafe',
    author: 'Caner Yılmaz',
    authorRole: 'Yeme-İçme Dijitalleşme Uzmanı',
    publishedAt: '2026-10-03',
    updatedAt: '2026-11-08',
    readTime: '6 dk okuma',
    ogImage: '/og/qr-menu.png',
    primaryKeyword: 'qr menü nedir nasıl yapılır',
    h1: 'QR Menü Nedir, Nasıl Yapılır? Kafe ve Restoranlar İçin Masrafsız Kurulum Rehberi',
    lead:
      'Girdi maliyetlerinin ve ürün fiyatlarının sık güncellendiği bir dönemde her fiyat değişikliğinde yüzlerce sayfalık kağıt menü bastırmak hem ciddi bütçe yükü hem de operasyonel eziyettir. Dijital QR menü ile müşteriniz telefon kamerasını okutur, saniyeler içinde güncel fiyatları görür ve hatta masadan garson çağırabilir.',
    keyTakeaways: [
      'QR menü, masadaki sabit karekodun değişmeden içerideki fiyat, fotoğraf ve ürün stoklarının anlık güncellenebildiği mobil menü sistemidir.',
      'Karekodun içine PDF dosyası yüklemek büyük hatadır; telefonda yakınlaştırma gerektiren PDF’ler müşteriyi yorar ve siparişi düşürür.',
      'Canlı QR menüde biten bir tatlıyı veya yemeği tek dokunuşla gizleyerek masada "O ürünümüz kalmadı" mahcubiyetini önlersiniz.',
      'İştah açıcı fotoğraf, kısa lezzet açıklaması ve önerilen yan ürün kurgusu masa başı ortalama adisyon tutarını %15–%20 artırabilir.',
      'Dükkânım Yanımda üzerinden ücretsiz aldığınız /m/dukkan-adiniz adresiyle masaya özel QR baskı kartınızı 2 dakikada hazırlayabilirsiniz.',
    ],
    sections: [
      {
        heading: '1. QR Menü Nedir ve Kağıt Menüye Göre Neden Avantajlıdır?',
        paragraphs: [
          'QR menü (karekod menü), müşterinin masadaki küçük bir kart ya da masa üstü pleksi üzerindeki karekodu akıllı telefonunun kamerasıyla okutarak doğrudan mekanın dijital menüsüne ulaşmasını sağlayan sistemdir. Müşterinin herhangi bir uygulama indirmesine gerek yoktur; telefon kamerası linki otomatik algılar ve tarayıcıda menüyü açar.',
          'Kağıt menüler birkaç hafta içinde kahve lekesi alır, köşeleri yırtılır ve bir ürüne zam ya da indirim geldiğinde üzerine etiket yapıştırmak zorunda kalırsınız. Üstelik etiket yapıştırılmış bir menü mekanın kalite algısını ciddi biçimde düşürür. Dijital QR menüde ise fiyat değiştiğinde telefondan tek rakam güncellersiniz; masadaki karekod hiç değişmeden yeni fiyat anında görünür.',
        ],
        bullets: [
          'Her fiyat güncellemesinde yeniden matbaa ve baskı ücreti ödeme derdi tamamen biter.',
          'Hijyeniktir: Gün boyu onlarca kişinin elinden geçen yıpranmış kağıt menü yerine herkes kendi telefonundan bakar.',
          'Anlık stok kontrolü sağlar: Akşam 20:00’de tükenen fırın sütlacı veya cheesecaki menüden gizleyebilirsiniz.',
        ],
      },
      {
        heading: '2. PDF Menü Tuzağı vs. Gerçek Mobil QR Menü Farkı',
        paragraphs: [
          'QR menü yapmaya karar veren pek çok işletmenin ilk yaptığı hata, matbaaya verdikleri A4 menü tasarımını PDF olarak Google Drive’a yükleyip linkini karekoda çevirmektir. Müşteri karekodu okuttuğunda 10 megabaytlık ağır bir dosya inmeye başlar; açıldığında ise minicik yazıları okumak için iki parmakla sürekli ekranı büyütüp sağa sola kaydırmak zorunda kalır.',
          'Gerçek bir mobil QR menü ise telefon ekranına göre tasarlanmış kategori sekmeleriyle açılır. Müşteri "Soğuk Kahveler" ya da "Tatlılar" sekmesine dokunduğunda büyük, net fotoğraflar, alerjen notları ve güncel fiyatları bir bakışta görür. Bu sayede karar verme süresi kısalır ve garson masaya geldiğinde sipariş çoktan hazır olur.',
        ],
        bullets: [
          'PDF menü mobilde yavaş açılır ve arama motorları tarafından okunamaz.',
          'Canlı web QR menüsü 1 saniyenin altında yüklenir, kategori filtreleme sunar.',
          'Müşteriler doğrudan telefonundan sepet oluşturabilir veya tek dokunuşla garson/hesap çağırabilir.',
        ],
        tip: 'Google’da mekanınızı arayan yeni müşteriler de menü linkinizi (/m/dukkan-adiniz) önceden açıp fiyatlarınıza bakabildiği için kapıdan içeri girmeden güven duyar.',
      },
      {
        heading: '3. 3 Adımda Ücretsiz QR Menü Nasıl Yapılır?',
        paragraphs: [
          'Karekod menü kurmak için yazılımcıya ya da pahalı ajanslara binlerce lira ödemeniz gerekmez. Dükkânım Yanımda hesabınızı açtığınız anda dükkan adınıza özel bir menü adresi oluşturulur. Ürünlerinizi tek tek ekleyebileceğiniz gibi mevcut kağıt menünüzün fotoğrafını çekip AI tarife okuyucuyla kategorileri otomatik de aktarabilirsiniz.',
          'Menünüz hazır olduğunda sistem size yüksek çözünürlüklü karekod çıktısı verir. İster her masaya ayrı numara içeren karekod kartları yazdırın ister kasa önüne tek bir genel menü QR kodu yerleştirin; baskı maliyeti yalnızca birkaç adet kalın kuşe kağıt veya küçük masa standından ibarettir.',
        ],
        bullets: [
          'Adım 1: Menü kategorilerinizi oluşturun (Sıcak İçecekler, Kahvaltı, Tatlılar, Ana Yemekler).',
          'Adım 2: Ürün adı, güncel fiyat, kısa açıklama ve varsa iştah açıcı fotoğrafı ekleyin.',
          'Adım 3: Oluşturulan yüksek hata düzeltmeli (ECC-H) karekodu indirip masa etiketlerine basın.',
        ],
      },
      {
        heading: '4. Adisyon Ortalamasını %18 Artıran QR Menü Düzeni Tüyoları',
        paragraphs: [
          'Dijital menü yalnızca fiyat gösteren bir liste değildir; doğru kurgulandığında mekanınızın en sessiz ve en verimli satış danışmanı olur. Müşteriler görseli olmayan kuru bir listede genellikle en ucuz ve tanıdık ürünü seçerken, fotoğrafı ve içeriği özenle yazılmış bir menüde imza içeceklere veya tatlı eklemelerine daha kolay yönelir.',
          'Örneğin filtre kahvenin altında "Yanında taze günün kekiyle birlikte" notunu göstermek veya burgerin yanına patates/sos seçeneklerini net şekilde eklemek sipariş tutarını doğal biçimde yukarı taşır. Ayrıca en kârlı 3-4 ürününüzü "Şefin Önerisi" ya da "Çok Tercih Edilenler" başlığında en üstte konumlandırmanız satış dağılımını iyileştirir.',
        ],
        bullets: [
          'Kategorileri 6-7 ana başlıkta tutun; müşteriyi sonsuz listede boğmayın.',
          'İmza ürünlerin kısa lezzet tarifini (örn. "Kavrulmuş fındık ve yoğun espresso uyumu") ekleyin.',
          'Fiyatları sade ve net yazın; para birimi ve kuruş kalabalığını azaltın.',
        ],
        tip: 'Karekodların masanın güneş almayan köşesinde ve en az 4x4 cm boyutunda basılması, düşük ışıkta bile tüm telefon kameralarının 1 saniyede okumasını sağlar.',
      },
      {
        heading: '5. Temassız Garson Çağırma ve Canlı Masa Entegrasyonu',
        paragraphs: [
          'Özellikle bahçe, teras veya iki katlı kafelerde müşterilerin en sık yaşadığı sorun, "Bir kahve daha isteyeceğiz ama garsona sesimizi duyuramıyoruz" durumudur. Müşterinin göz teması ararken geçen her dakikası ek siparişin iptal olması demektir.',
          'Dükkânım Yanımda QR menü sisteminde müşteri aynı ekrandan tek dokunuşla "Garson Çağır" veya "Hesap İste" butonuna basabilir; hatta masadan doğrudan sepet oluşturup adisyona sipariş gönderebilir. Bildirim kasa ve mutfak ekranına anında sesli uyarıyla düştüğü için masa devir hızı artar, personel koşturmacası azalır.',
        ],
        bullets: [
          'Masadan gelen "Garson Çağır" ve "Hesap İste" bildirimleri masa numarasıyla ekranda yanar.',
          'Müşterinin gönderdiği QR sipariş anında o masanın açık adisyonuna eklenir.',
          'Akşam gün sonu kapatılırken hangi menü kaleminin en çok sattığı otomatik raporlanır.',
        ],
      },
    ],
    faq: [
      {
        q: 'Müşterilerin QR menüyü açmak için uygulama indirmesi gerekiyor mu?',
        a: 'Hayır. Telefon kamerasını karekoda tutmak yeterlidir; menü doğrudan tarayıcıda saniyeler içinde açılır.',
      },
      {
        q: 'Fiyatları değiştirdiğimde masadaki QR kodları yeniden bastırmam gerekir mi?',
        a: 'Hayır! Masadaki karekod sabit dükkan linkinize (/m/dukkan-adiniz) bağlıdır. Panelden fiyatı güncellediğiniz anda masadaki müşteri güncel fiyatı görür.',
      },
      {
        q: 'QR menü oluşturmak için ekstra modül ücreti öder miyim?',
        a: 'Hayır. Dükkânım Yanımda paketlerinde QR menü ek modül ücreti olmadan gelir; temel masa ve menü kullanımı Çırak paketiyle ücretsiz başlayabilir.',
      },
      {
        q: 'Mekanda interneti çekmeyen müşteriler için ne yapmalıyım?',
        a: 'Karekod kartının altına mekanın Wi-Fi adını ve şifresini küçük bir not olarak eklemeniz hem müşteri memnuniyetini artırır hem de menünün her köşede hızlı açılmasını sağlar.',
      },
    ],
    relatedProductHref: '/qr-menu',
    relatedProductLabel: 'Ücretsiz QR Menü Sistemini Dene',
    relatedSlugs: [
      'kucuk-isletmeler-icin-kasa-takibi-rehberi',
      'gun-sonu-raporu-nasil-hazirlanir',
      'musteri-sadakati-sms-hatirlatma-geri-donus',
    ],
  },
  {
    slug: 'kucuk-isletmeler-icin-kasa-takibi-rehberi',
    title: 'Küçük İşletmeler İçin Kasa Takibi Rehberi',
    seoTitle: 'Küçük İşletmeler İçin Kasa Takibi Rehberi | Esnaf Finans Kontrolü',
    description:
      'Küçük işletmelerde kasa takibi nasıl yapılır? Nakit, kredi kartı POS, IBAN, veresiye ve fişsiz giderlerin tek kasada hatasız yönetimi için pratik rehber.',
    category: 'Veresiye & Kasa',
    author: 'Murat Karahan',
    authorRole: 'Esnaf Operasyon & Finans Editörü',
    publishedAt: '2026-10-08',
    updatedAt: '2026-11-10',
    readTime: '7 dk okuma',
    ogImage: '/og/kasa-programi.png',
    primaryKeyword: 'küçük işletmeler için kasa takibi',
    h1: 'Küçük İşletmeler İçin Kasa Takibi Rehberi: Ciro Değil Net Kazancı Görme Sanatı',
    lead:
      'Bir dükkan gün boyu kalabalık olup akşam çekmecesi dolabilir ama ay sonunda toptancı ödemesi geldiğinde para yetmeyebilir. Bunun temel sebebi satış ile nakit akışını ayrı izlememektir. Küçük işletmeler için yorucu olmayan, günde sadece birkaç dakika alan sağlıklı kasa takibi yöntemini adım adım anlatıyoruz.',
    keyTakeaways: [
      'Kasa takibinin altın kuralı, şahsi cep harçlığı ile dükkan kasasını birbirinden kesin çizgilerle ayırmaktır.',
      'Nakit, kredi kartı POS, havale/FAST ve veresiye kanallarını tek torbaya atmak gün sonu sayımını imkansız hale getirir.',
      'Su, çay, temizlik, nakliye gibi küçük elden masraflar girilmezse aylık gerçek kâr en az %15–%20 yanlış hesaplanır.',
      'Toptancı ve tedarikçi ödemelerini vade tarihleriyle takip etmek, beklenmedik nakit sıkışıklıklarını önceden gösterir.',
      'Esnaf kasa takip programı kullanmak her işlemin 3 saniyede kaydedilmesini ve muhasebeciye hazır özet çıkmasını sağlar.',
    ],
    sections: [
      {
        heading: '1. Cep Harçlığı ile Dükkan Kasasını Karıştırmanın Sessiz Tehlikesi',
        paragraphs: [
          'Küçük işletmelerde en yaygın mali hata, kasayı patronun kendi cüzdanı gibi görmektir. Öğlen market alışverişine çekmeceden 600 TL alınır, akşam çocuğun okul servisine 1.200 TL verilir ve bunların hiçbiri kağıda yazılmaz. Ay sonuna gelindiğinde "Bu ay çok çalıştık ama para nerede?" sorusu kaçınılmaz olur.',
          'Profesyonel olmasa bile düzenli bir kasada dükkan ayrı bir varlık, dükkan sahibi ayrı bir kişidir. Kendi şahsi harcamanız için kasadan para aldığınızda bile bunu "Patron Çekimi" olarak kaydetmelisiniz. Böylece dükkanın gerçekte ne kadar kazandırdığını ve sizin ayda ne kadar çektiğinizi net görürsünüz.',
        ],
        bullets: [
          'Kendinize haftalık veya aylık sabit bir ödeme günü belirleyin; her gün çekmeceden parça parça para almayın.',
          'Zorunlu şahsi çekimleri bile mutlaka tarih ve tutarla kasa çıkışına işleyin.',
          'Aile bireyleri veya ortaklar kasadan ödeme yapıyorsa tek ortak ekranda görünmesini sağlayın.',
        ],
      },
      {
        heading: '2. Dört Ödeme Kanalını Ayrı İzlemek: Nakit, POS, IBAN ve Veresiye',
        paragraphs: [
          'Eskiden sadece nakit ve veresiye vardı; bugün bir mahalle berberinde veya bakkalında bile dört farklı ödeme kanalı çalışıyor: Nakit, kredi kartı POS, IBAN/FAST transferi ve veresiye. Müşteri 400 TL’yi IBAN’dan attığında sizin fiziksel çekmecenize para girmez; 2 gün sonra banka komisyonu kesilen POS satışları da aynı gün nakit gibi harcanamaz.',
          'Sağlıklı bir esnaf kasa programında her satış kaydedilirken ödeme tipi tek dokunuşla seçilir. Böylece akşam kasanızı sayarken yalnızca "Nakit" sütununun çekmecedeki parayla eşit olmasını beklersiniz; POS toplamını sliple, havale toplamını ise telefonunuzdaki banka uygulamasıyla 10 saniyede karşılaştırırsınız.',
        ],
        bullets: [
          'Nakit Kasa: Çekmece giriş-çıkışını ve fiili para sayımını temsil eder.',
          'Kredi Kartı / POS: Gün sonu slip toplamıyla karşılaştırılır, komisyon ve valör planlamasına yardımcı olur.',
          'Havale / IBAN / FAST: Doğrudan banka hesabına düşen ödemeleri nakitten ayırır.',
          'Veresiye: Ciroya yazılır ama kasaya nakit olarak eklenmez; yalnızca tahsilat anında kasaya girer.',
        ],
        tip: 'POS cihazından kaynaklı banka komisyon oranını (%2–%3,5 bandı) aylık giderlerinize eklemeyi unutmayın; yüksek kartlı satış yapan dükkanlarda bu tutar ciddi bir kalemdir.',
      },
      {
        heading: '3. Fişsiz Küçük Masrafların Kasa Üzerindeki Gizli Etkisi',
        paragraphs: [
          'Kira, elektrik ve personel maaşı gibi büyük giderleri herkes hatırlar; fakat dükkanın kârını sessizce eriten asıl kalemler "ufak tefek" diye önemsenmeyen günlük masraflardır. Günde ortalama 250 TL tutan çay, su, poşet, temizlik deterjanı, kurye bahşişi veya küçük tamir giderleri ayda 6.500–7.500 TL’ye ulaşır.',
          'Bu giderler anında kaydedilmediğinde kasa hem sürekli eksik verir hem de ürün/hizmet fiyatlarınıza zam yaparken gerçek maliyetinizi eksik hesaplarsınız. Dükkânım Yanımda üzerinden 3 saniyede kategori seçip (Fatura, Malzeme, Kira, Yemek, Bakım) gider eklemek bu kör noktayı tamamen ortadan kaldırır.',
        ],
        bullets: [
          'Her nakit masrafı harcadığınız dakika içinde telefonunuzdan gider olarak girin.',
          'Giderleri sabit (kira, internet, aidat) ve değişken (malzeme, poşet, elektrik) olarak gruplayın.',
          'Ay sonunda en yüksek gider kalemini görerek gereksiz sızıntıları tespit edin.',
        ],
      },
      {
        heading: '4. Toptancı Ödemeleri ve Vadeli Borçları Kasaya Bağlamak',
        paragraphs: [
          'Toptancıdan malı vadeli alıp nakit sattığınızda ilk hafta kasanızda bol para varmış gibi hissedebilirsiniz. Ancak toptancı faturasının vadesi geldiğinde o paranın aslında toptancının mal bedeli olduğu ortaya çıkar. Nakit akışı yönetimi, kasadaki paranın ne kadarının sizin kârınız, ne kadarının ödenecek borç olduğunu bilmektir.',
          'Tedarikçi cari kartı tuttuğunuzda hangi toptancıya ne kadar borcunuz kaldığını ve ödeme gününü tek ekranda görürsünüz. Kısmi ödeme yaptığınızda hem kasadan nakit/havale düşer hem de toptancı borcunuz güncellenir.',
        ],
        bullets: [
          'Her toptancı için ayrı cari kart açın ve fatura tutarını vadesiyle kaydedin.',
          'Önümüzdeki 7 gün içinde ödenecek toplam tedarikçi tutarını kasadaki mevcut nakitle kıyaslayın.',
          'Yüksek stok tutup kasayı kurutmak yerine hızlı dönen ürünlere öncelik verin.',
        ],
        tip: 'Dükkânım Yanımda’da hem müşteri alacaklarını (veresiye) hem tedarikçi borçlarını tek panelden izlediğiniz için ay ortasında sürpriz ödeme krizi yaşamazsınız.',
      },
      {
        heading: '5. Haftalık Patron Raporu ile Kârlılık Analizi',
        paragraphs: [
          'Kasa takibinin asıl ödülü sadece çekmecedeki parayı tutturmak değil, işletmenizi büyütecek kararları verilere dayanarak almaktır. Haftalık kasa özetine baktığınızda Salı günlerinin neden düşük kaldığını, hangi ürünün veya hizmetin en yüksek kârı getirdiğini ve ayın hangi haftasında giderlerin şiştiğini görürsünüz.',
          'Aylık düzenli kasa raporu aynı zamanda muhasebecinizle ilişkilerinizi de rahatlatır. Fatura, POS ve nakit hareketleri düzene girdiği için vergi dönemlerinde sürpriz hesaplarla karşılaşmazsınız.',
        ],
      },
    ],
    faq: [
      {
        q: 'Kasa takibi yapmak için muhasebe bilmem gerekiyor mu?',
        a: 'Hayır. Dükkan esnafı için tasarlanmış sade bir kasa programında sadece "Giren para", "Çıkan gider" ve "Ödeme yöntemi (Nakit/Kart/Havale)" seçersiniz; karmaşık hesap kodları yoktur.',
      },
      {
        q: 'Birden fazla telefon veya bilgisayardan aynı kasayı görebilir miyim?',
        a: 'Evet. Kayıtlar bulutta tutulduğu için dükkandaki tabletten yapılan satışı akşam evdeki telefonunuzdan veya bilgisayarınızdan anlık izleyebilirsiniz.',
      },
      {
        q: 'Kredi kartıyla yapılan satış hemen kasama nakit olarak eklenmeli mi?',
        a: 'POS satışları ciroya ve kart kasasına eklenir ancak nakit çekmece bakiyesini artırmaz. Sistem bunları ayrı tuttuğu için akşam para sayımınız asla şaşmaz.',
      },
      {
        q: 'Verilerimi Excel veya yedek dosyası olarak dışa aktarabilir miyim?',
        a: 'Evet. Dükkânım Yanımda üzerinden dilediğiniz zaman tek tıkla yedek indirebilir ve verilerinizi kendi cihazınızda da saklayabilirsiniz.',
      },
    ],
    relatedProductHref: '/kasa-programi',
    relatedProductLabel: 'Esnaf Kasa Takip Programını Gör',
    relatedSlugs: [
      'gun-sonu-raporu-nasil-hazirlanir',
      'veresiye-defteri-nasil-tutulur',
      'esnaf-icin-e-arsiv-vergi-donemleri-takvimi',
    ],
  },
  {
    slug: 'ucretsiz-randevu-uygulamalari-karsilastirmasi-2026',
    title: 'Ücretsiz Randevu Uygulamaları Karşılaştırması 2026',
    seoTitle: 'Ücretsiz Randevu Uygulamaları Karşılaştırması 2026 | Komisyonsuz Seçim',
    description:
      '2026 yılında berber, kuaför ve güzellik salonları için ücretsiz randevu uygulamaları karşılaştırması. Gizli komisyonlar, SMS maliyetleri ve esnafa en uygun model.',
    category: 'Randevu & Salon',
    author: 'Emre Aksoy',
    authorRole: 'Berber & Salon Danışmanı',
    publishedAt: '2026-10-14',
    updatedAt: '2026-11-12',
    readTime: '8 dk okuma',
    ogImage: '/og/randevu-sistemi.png',
    primaryKeyword: 'ücretsiz randevu uygulamaları 2026',
    h1: 'Ücretsiz Randevu Uygulamaları Karşılaştırması 2026: Gizli Komisyonlara Dikkat',
    lead:
      'İnternette "ücretsiz randevu programı" aradığınızda karşınıza onlarca seçenek çıkar; ancak çoğu uygulama ilk ayın ardından yüksek SMS kontörü, randevu başı %15–%20 pazaryeri komisyonu veya kredi kartı zorunluluğu getirir. 2026’da berber, kuaför ve küçük işletmeler için seçenekleri artıları ve eksileriyle karşılaştırdık.',
    keyTakeaways: [
      'Pazaryeri tarzı randevu uygulamaları "yeni müşteri getirme" vaadiyle ilk randevudan %20’ye varan komisyon keser ve müşterinizi rakiplerle yan yana listeler.',
      'Google Takvim veya genel form araçları ücretsizdir ancak koltuk sırası, hizmet süresi, usta seçimi, prim ve kasa bağlantısı sunmaz.',
      'Gerçek bir esnaf randevu sisteminde kurulum 0 TL olmalı, müşteriye özel web linki (/r/dukkan-adiniz) verilmelidir.',
      'Randevu takibinin veresiye, WhatsApp hatırlatma ve gün sonu kasasıyla aynı ekranda olması ayrı iki uygulama kullanma yükünü ortadan kaldırır.',
      'Dükkânım Yanımda Çırak paketi sonsuza dek ₺0 ve %0 komisyon sunar; işletme büyüdüğünde dahi şeffaf ₺249 / ₺499 sabit planlarla devam eder.',
    ],
    sections: [
      {
        heading: '1. "Ücretsiz" Etiketinin Arkasındaki 4 Gizli Maliyet',
        paragraphs: [
          'Esnaf bir randevu uygulamasına başlarken genellikle sadece "İlk giriş ücretsiz mi?" sorusunu sorar. Oysa birkaç hafta müşteri alıştıktan sonra karşılaşılan sürpriz ücretler yüzünden program değiştirmek çok daha maliyetli hale gelir. Özellikle global rezervasyon platformları ilk bakışta ücretsiz görünse de gelir modellerini esnafın cirosu üzerinden kurgular.',
          'Seçim yaparken mutlaka şu dört noktayı sorgulamalısınız: Her online randevudan komisyon kesiliyor mu? Müşterim linke tıkladığında rakip dükkanlar da öneriliyor mu? WhatsApp veya SMS hatırlatma için zorunlu kontör paketi satılıyor mu? Kasa ve veresiye için ayrı bir programa daha para ödemek zorunda kalıyor musunuz?',
        ],
        bullets: [
          'Pazaryeri Komisyonu: İlk randevudan %15–%25 kesinti yapılan modellerde kârınız erir.',
          'Müşteri Kaçırma Riski: Müşterinizi genel pazaryeri uygulamasına yönlendirdiğinizde yan salondaki indirimi görüp rakibe gidebilir.',
          'Zorunlu Donanım veya Yıllık Taahhüt: "Ücretsiz deneme" sonunda 12 aylık peşin sözleşme şartı.',
          'Parçalı Sistem Yükü: Randevu ayrı, kasa ayrı, QR menü veya veresiye ayrı yazılımda tutulunca veri kopyalamak zorunda kalırsınız.',
        ],
      },
      {
        heading: '2. Pazaryeri Uygulamaları vs. Kendi Markalı Randevu Linkiniz',
        paragraphs: [
          'Büyük şehirlerde popüler olan pazaryeri uygulamaları, haritada yüzlerce kuaförü alt alta sıralar. Bir berber dükkanı Instagram’dan kazandığı kendi müdavimini bile bu uygulamaya yönlendirdiğinde sistem bunu "platform müşterisi" sayıp komisyon talep edebiliyor ya da müşteriye başka salonların reklamlarını gösterebiliyor.',
          'Buna karşılık doğrudan işletmenize ait bir online randevu sayfasında (örneğin dukkanimyanimda.com.tr/r/salon-adiniz) yalnızca sizin logonuz, sizin hizmet fiyatlarınız, sizin ustalarınız ve sizin çalışma saatleriniz yer alır. Müşteri başka rakip görmez ve her randevudan %0 komisyon ödersiniz.',
        ],
        bullets: [
          'Pazaryeri Modeli: Yüksek komisyon + rakip görünürlüğü + müşteri verisinin platforma ait olması.',
          'Özel Link Modeli: %0 komisyon + kendi markanız + tam müşteri veri sahipliği.',
          'Google Haritalar’a doğrudan kendi randevu linkinizi ekleyerek organik müşteri kazanımı.',
        ],
        tip: 'Google İşletme Profilinizdeki "Randevu Bağlantısı" bölümüne kendi özel /r/dukkan-adiniz adresinizi koyduğunuzda, Google’dan gelen müşteriler için hiçbir aracıya komisyon ödemezsiniz.',
      },
      {
        heading: '3. Genel Takvim Araçları (Google Takvim / WhatsApp Form) Neden Yetmez?',
        paragraphs: [
          'Bazı işletmeler maliyetten kaçmak için Google Takvim veya basit form linkleri kullanmayı dener. İlk bir hafta idare etse de gerçek salon pratiğinde hemen tıkanır. Çünkü genel takvim araçları "saç kesimi 30 dakika, boya 120 dakika" gibi hizmet süresine göre otomatik slot bölmez.',
          'Ayrıca müşteri genel takvimde ustanızı seçemez, hizmet fiyatını göremez, randevu geldiğinde akşam o ustanın prim hesabına düşmez ve kasa defterine aktarılmaz. Yani takvimi ücretsiz çözseniz bile akşam yine kağıt kalemle tek tek hesap toplamak zorunda kalırsınız.',
        ],
        bullets: [
          'Hizmet bazlı süre blokajı (30 dk, 45 dk, 90 dk) genel takvimlerde otomatik çalışmaz.',
          'Çoklu koltuk / usta takvimi müşteri seçim ekranına çevrilemez.',
          'Kasa, veresiye, sadakat kartı ve gün sonu kapanışıyla bağlantısı yoktur.',
        ],
      },
      {
        heading: '4. 2026’da Bir Randevu Programında Aranması Gereken 6 Temel Kriter',
        paragraphs: [
          'İhtiyacınıza uygun doğru ücretsiz randevu uygulamasını seçerken yalnızca bugünkü iki koltuğu değil, altı ay sonraki yoğunluğunuzu da düşünmelisiniz. Türkiye’deki esnaf alışkanlıklarına uygun bir sistemin hızlı, sade ve tamamen Türkçe destekli olması şarttır.',
          'Ayrıca müşterilerinizin telefonuna yeni bir uygulama indirmesini şart koşan yazılımlardan mutlaka uzak durun. Türkiye’de müşterilerin büyük çoğunluğu randevu için App Store veya Google Play’den yeni uygulama indirmek istemez; tek tıkla tarayıcıdan işini bitirmek ister.',
        ],
        bullets: [
          '1. Uygulama indirmesiz, tarayıcı üzerinden 15 saniyede müşteri randevu akışı',
          '2. Randevudan 2 saat önce tek dokunuşla WhatsApp hatırlatma şablonu',
          '3. Hizmet süresine göre çakışma engelleyen akıllı takvim',
          '4. %0 randevu komisyonu ve kredi kartsız ücretsiz başlangıç planı',
          '5. Personel prim hesabı, veresiye defteri ve kasa takibiyle aynı panelde birleşim',
          '6. Fotoğraftan AI tarife okuyucu gibi hızlı kurulum kolaylıkları',
        ],
      },
      {
        heading: '5. Şeffaf Ölçeklenme: Çırak (₺0) → Usta (₺249) → Patron VIP (₺499)',
        paragraphs: [
          'Dükkânım Yanımda’nın yaklaşımı Türkiye esnafının gerçek bütçesine göre şekillendirilmiştir. İlk gün hiçbir kart bilgisi vermeden **Çırak** paketiyle ₺0’a başlarsınız; ayda 20 online randevu, 25 müşteri cari kartı ve temel kasa takibini süresiz ücretsiz kullanırsınız.',
          'İşler büyüyüp tek koltukta ayda 60 randevuya kadar çıktığınızda **Usta** paketi (₺249/ay), birden fazla usta çalıştıran salonlar veya yoğun kafeler için ise sınırsız randevu, çoklu personel prim hesabı ve 500 otomatik bildirim sunan **Patron VIP** (₺499/ay) devreye girer. Üstelik hiçbirinde taahhüt yoktur ve komisyon her zaman %0’dır.',
        ],
        tip: 'Seçim yaparken sadece "ücretsiz" kelimesine değil, 100 müşteri veya 200 randevuya ulaştığınızda ödeyeceğiniz aylık sabit tutarın netliğine bakın.',
      },
    ],
    faq: [
      {
        q: 'Dükkânım Yanımda Çırak paketi gerçekten süresiz ücretsiz mi?',
        a: 'Evet. 14 günlük deneme değil; 25 müşteri, tek koltuk ve ayda 20 online randevu sınırları içinde süresiz olarak ₺0 ücretle kullanabilirsiniz.',
      },
      {
        q: 'Ücretsiz plandan ücretli plana geçerken eski randevu ve müşteri verilerim silinir mi?',
        a: 'Hayır. Tüm müşteri kartlarınız, geçmiş işlemleriniz ve aynı randevu linkiniz kesintisiz şekilde korunur.',
      },
      {
        q: 'Diğer uygulamalardaki müşteri listemi kolayca taşıyabilir miyim?',
        a: 'Evet. Müşterilerinizi hızlıca ekleyebilir, fiyat listenizi ise fotoğrafını çekerek AI tarife okuyucu sayesinde dakikalar içinde sisteme aktarabilirsiniz.',
      },
      {
        q: 'Sadece berber ve kuaförler mi kullanabiliyor?',
        a: 'Hayır. Güzellik salonları, lazer merkezleri, terzi prova randevuları, teknik servis ve hukuk danışmanlığı randevuları da aynı altyapıyı kullanabilir.',
      },
    ],
    relatedProductHref: '/randevu-sistemi',
    relatedProductLabel: 'Komisyonsuz Online Randevu Sistemini Gör',
    relatedSlugs: [
      'whatsapp-yerine-online-randevu-avantajlari',
      'berber-randevu-sistemi-neden-gerekli',
      'guzellik-salonunda-paket-seans-takibi',
    ],
  },
  {
    slug: 'whatsapp-yerine-online-randevu-avantajlari',
    title: 'WhatsApp Yerine Online Randevu: Avantajlar',
    seoTitle: 'WhatsApp Yerine Online Randevu Kullanmanın 6 Avantajı | Dükkanım Yanımda',
    description:
      'WhatsApp üzerinden tek tek saat sorup randevu yazma dönemini bitirin. Online randevu linkiyle 7/24 rezervasyon toplamanın esnafa sağladığı 6 somut avantaj.',
    category: 'Randevu & Salon',
    author: 'Zeynep Çelik',
    authorRole: 'Kuaför & Güzellik İşletme Koçu',
    publishedAt: '2026-10-19',
    updatedAt: '2026-11-14',
    readTime: '6 dk okuma',
    ogImage: '/og/randevu-sistemi.png',
    primaryKeyword: 'whatsapp yerine online randevu',
    h1: 'WhatsApp Yerine Online Randevu Sistemi: Esnaf İçin 6 Kritik Avantaj',
    lead:
      'WhatsApp üzerinden randevu vermek başta pratik görünür: "Saat 16:00 boş mu?" sorusuna cevap yazarsınız ve iş biter. Ta ki müşteri sayısı artıp mesajlar birbirine karışana, akşam 23:30’da gelen mesajı sabah görüp müşteriyi kaybedene kadar. WhatsApp sohbet kalabalığı yerine online randevu linkine geçmenin günlük işinizi nasıl hafiflettiğini inceleyelim.',
    keyTakeaways: [
      'Tek bir randevu için WhatsApp’ta ortalama 5–7 karşılıklı mesaj yazılır; online randevuda müşteri bunu 15 saniyede kendi başına halleder.',
      'Dükkân kapandıktan sonra gece gelen talepler sabah cevap beklerken kaybolmaz; müşteri o an boş saati seçip onay alır.',
      'WhatsApp sohbetinde yukarıda kalan bir saatin unutulması sonucu oluşan çift rezervasyon kazaları tamamen ortadan kalkar.',
      'WhatsApp’ı tamamen terk etmenize gerek yoktur: WhatsApp İşletme otomatik yanıtına /r/dukkan-adiniz linkini koymak en hızlı köprüdür.',
      'Online randevu verisi doğrudan müşteri kartına, hatırlatma akışına ve akşam kasa/prim raporuna bağlanır.',
    ],
    sections: [
      {
        heading: '1. "Saat Kaçın Boş Usta?" Mesajlarının Çaldığı Zaman',
        paragraphs: [
          'WhatsApp üzerinden randevu almanın en yorucu tarafı pinpon oyunu gibi uzayan yazışmalardır. Müşteri "Yarın öğleden sonra boş yerin var mı?" diye yazar; siz yarım saat sonra görüp "14:30 ve 17:00 boş" dersiniz. Müşteri bir saat sonra "14:30 olmaz, 16:00 olur mu?" diye döner; ama siz o arada telefonla başka birine 16:00’yı vermişsinizdir. Yeniden yazış, yeniden saat öner derken tek bir tıraş için yedi mesaj harcanır.',
          'Online randevu linkinde ise müşteri canlı takviminizi görür. Hangi saatin dolu, hangi saatin boş olduğunu anlık gördüğü için kararını 15 saniyede verir ve işlemi tamamlar. Sizin ekranınıza yalnızca onaylı yeni randevu bildirimi düşer.',
        ],
        bullets: [
          'Ortalama 5–7 mesajlık yazışma süresi sıfıra iner.',
          'Hizmet fiyatlarını tek tek yazma yükü biter; tarife zaten seçim ekranındadır.',
          'Elleriniz ıslakken, boya sürerken veya tıraş yaparken telefon açmak zorunda kalmazsınız.',
        ],
      },
      {
        heading: '2. Gece Yarısı Gelen Müşteriyi Sabah Uyanmadan Yakalamak',
        paragraphs: [
          'İstatistikler gösteriyor ki çalışan kesimin ve gençlerin randevu aradığı en yoğun saatler akşam 20:30 ile 23:45 arasıdır. Yani siz dükkanı kapatıp evinizde dinlendiğiniz saatlerde insanlar ertesi günün veya hafta sonunun planını yapmaktadır.',
          'WhatsApp’ta gece 23:00’te gelen mesaja ertesi sabah 09:30’da döndüğünüzde müşteri çoktan internetten açık saat bulduğu başka bir salondan randevusunu almış olabilir. 7/24 açık online randevu sayfanız ise siz uyurken bile müşterinizi karşılar, uygun saati rezerve eder ve sabah dükkanı açtığınızda gününüzü hazır önüne koyar.',
        ],
        bullets: [
          'Mesai dışı saatlerde gelen taleplerin kaçma oranı sıfırlanır.',
          'Sabah dükkana geldiğinizde o günün saat planı zaten ekranınızda hazırdır.',
          'Acil tatil veya kapalı gün güncellemelerinde takvim otomatik olarak o günü kapatır.',
        ],
        tip: 'WhatsApp Business "Karşılama Mesajı" ve "Uzakta Mesajı" ayarlarına "Hızlı ve sıra beklemeden randevu almak için linke tıklayabilirsiniz: dukkanimyanimda.com.tr/r/dukkan-adiniz" metnini ekleyin; mesaj atanlar saniyede online takvime yönlenir.',
      },
      {
        heading: '3. Sohbet Kalabalığında Çift Rezervasyon Kazalarını Önlemek',
        paragraphs: [
          'WhatsApp’ta aynı gün on farklı kişiden mesaj gelirken arada bir de arkadaş gruplarından ve toptancılardan bildirimler akar. Çarşamba günü için 15:00 saatini yazıştığınız bir müşteriyi kağıda geçirmeyi unuttuğunuzda, Perşembe öğlen başka birine aynı saati vermeniz işten bile değildir.',
          'Online randevu sisteminde ise her saat dilimi tek bir veritabanı kaydına bağlıdır. Saat 15:00 onaylandığı saniye sistem o aralığı diğer tüm müşterilere ve hatta manuel eklemeye karşı kilitler. Hem dükkan içi huzurunuz hem de müşteri gözündeki profesyonelliğiniz korunur.',
        ],
        bullets: [
          'Aynı koltuğa ve aynı ustaya iki kişinin yazılması teknik olarak engellenir.',
          'İptal edilen saat manuel silme beklemeden anında yeniden rezervasyona açılır.',
          'Müşteri hizmet süresine göre (örneğin 30 dk kesim veya 90 dk boya) otomatik aralık ayrılır.',
        ],
      },
      {
        heading: '4. Sosyal Medya, Google Haritalar ve WhatsApp’ı Tek Linkte Birleştirmek',
        paragraphs: [
          'Bugün müşteriler size tek bir yerden ulaşmıyor: Biri Instagram Reels videonuzdan DM atıyor, diğeri Google Haritalar’dan yol tarifi alıp arıyor, bir başkası ise WhatsApp durumunuzu görüp yazıyor. Her kanaldan farklı deftere kayıt düşmek büyük dağınıklık yaratır.',
          'Tek bir kişiselleştirilmiş randevu linkiniz olduğunda bunu Instagram biyografinize, WhatsApp profilinize, Google İşletme profilinize ve hatta dükkan camındaki QR etikete yapıştırırsınız. Nereden gelirse gelsin tüm müşteriler tek bir merkezde, çakışmasız şekilde randevu alır.',
        ],
        bullets: [
          'Instagram DM üzerinden saat sorma trafiği %80 oranında azalır.',
          'Dükkan vitrinine asılan QR kodu okutan yoldan geçen müşteri kapalı saatte bile randevu alır.',
          'Tüm kanallardan gelen müşteriler tek bir dijital müşteri rehberinde birikir.',
        ],
      },
      {
        heading: '5. WhatsApp’ı Tamamen Bırakmıyoruz: Doğru Yerde Hatırlatma Aracı Olarak Kullanıyoruz',
        paragraphs: [
          'Online randevu sistemine geçmek WhatsApp ile iletişimi kesmek demek değildir; aksine WhatsApp’ı doğru görevde kullanmaktır. Saat sorma ve boş yer arama işini online takvime devredip, WhatsApp’ı randevudan 2 saat önce giden kibar teyit mesajları ve ölü saat kampanyaları için kullandığınızda her iki aracın en güçlü yanını birleştirmiş olursunuz.',
          'Dükkânım Yanımda, online alınan randevular için tek tıkla gönderilen hazır WhatsApp hatırlatma şablonlarıyla bu döngüyü kusursuz biçimde tamamlar. Böylece telefonla uğraşmadan tam dolulukta çalışan bir dükkan düzenine kavuşursunuz.',
        ],
        tip: 'Müşterilerinize ilk ay her randevu sonrası "Bir dahaki sefere yazışmadan hızlıca buradan seçebilirsin" diyerek linki bırakın; 3 hafta içinde müdavimlerin %90’ı kendi randevusunu kendi alır.',
      },
    ],
    faq: [
      {
        q: 'Müşterilerim WhatsApp’tan mesaj atmaya devam ederse ne yapmalıyım?',
        a: 'WhatsApp Business otomatik yanıtına online randevu linkinizi ekleyin. Ayrıca çok yakın veya teknolojiye uzak müşterileriniz için siz 5 saniyede panelden manuel randevu girip takvimi güncel tutabilirsiniz.',
      },
      {
        q: 'Online randevu linki açıldığında müşteriden üyelik isteniyor mu?',
        a: 'Hayır. Müşteri sadece adını, telefon numarasını, istediği hizmeti ve boş saati seçer; şifre veya uygulama kurulumu olmadan 15 saniyede randevusu oluşur.',
      },
      {
        q: 'WhatsApp durumuma koyduğumda randevu linki tıklanabilir olur mu?',
        a: 'Evet. WhatsApp durumunuzda bağlantı paylaşımı yaptığınızda veya profil bio alanına eklediğinizde müşteriler tek dokunuşla doğrudan randevu sayfanıza geçer.',
      },
      {
        q: 'Kişiye özel randevu linki oluşturmanın maliyeti nedir?',
        a: 'Dükkânım Yanımda Çırak paketiyle tamamen ücretsizdir; dükkan adınıza özel linkiniz kayıt olur olmaz hemen üretilir.',
      },
    ],
    relatedProductHref: '/randevu-sistemi',
    relatedProductLabel: 'Online Randevu Linkini Oluştur',
    relatedSlugs: [
      'ucretsiz-randevu-uygulamalari-karsilastirmasi-2026',
      'kuafor-musteri-gelmeme-no-show-cozumu',
      'musteri-sadakati-sms-hatirlatma-geri-donus',
    ],
  },
  {
    slug: 'guzellik-salonunda-paket-seans-takibi',
    title: 'Güzellik Salonunda Paket ve Seans Takibi Nasıl Yapılır?',
    seoTitle: 'Güzellik Salonunda Paket ve Seans Takibi Nasıl Yapılır? | Dükkanım Yanımda',
    description:
      'Lazer epilasyon, cilt bakımı ve bölgesel incelme merkezleri için paket ve seans takibi nasıl yapılır? Kalan seans sayacı, taksitli tahsilat ve kabin çakışmasını önleme.',
    category: 'Randevu & Salon',
    author: 'Zeynep Çelik',
    authorRole: 'Kuaför & Güzellik İşletme Koçu',
    publishedAt: '2026-10-24',
    updatedAt: '2026-11-15',
    readTime: '7 dk okuma',
    ogImage: '/og/guzellik-salonu.png',
    primaryKeyword: 'güzellik salonunda paket ve seans takibi',
    h1: 'Güzellik Salonunda Paket ve Seans Takibi Nasıl Yapılır? Karışıklığı Sıfırlayın',
    lead:
      'Güzellik merkezlerinde tek seanslık işlemler kadar 6, 8 veya 10 seanslık lazer epilasyon, bölgesel incelme ve cilt bakımı paketleri de büyük yer tutar. Ancak kağıt seans kartları kaybolduğunda, müşteriyle "Benim 3 seansım kalmıştı, sizde neden 2 yazıyor?" tartışması kaçınılmaz olur. İşte paket ve seans takibini sorunsuz yürütmenin pratik sistemi.',
    keyTakeaways: [
      'Kağıt seans kartlarında imza unutulması ve kartın evde bırakılması salon ile müşteri arasında en sık yaşanan güven sorunudur.',
      'Her müşteriye dijital paket tanımı (örneğin 8 seans tüm vücut lazer) yapılıp işlem sonrası tek tıkla 1 seans düşülmelidir.',
      'Kalan seans hakkı ile taksitli paket ödemesi ayrı izlenmeli; borcu geciken müşteriler Tahsilat Turu listesinde takip edilmelidir.',
      'Aynı lazer cihazı veya bakım kabininin iki uzmana aynı saatte yazılmasını önlemek için kabin bazlı renk kodlu takvim şarttır.',
      'Seans aralığı gelen (örneğin 30 gün sonra kontrol seansı gereken) müşterilere WhatsApp hatırlatması atmak paket kopmalarını önler.',
    ],
    sections: [
      {
        heading: '1. Kağıt Seans Kartları ve Excel Tablolarının 4 Kronik Sorunu',
        paragraphs: [
          'Birçok güzellik salonu başlangıçta müşterinin çantasına küçük karton seans kartları koyarak ya da bilgisayarda Excel dosyası açarak paketleri izlemeye çalışır. İlk 30 müşteride sorun yokmuş gibi görünür; fakat aktif paket sayısı 150’yi geçtiğinde kartların biri kaybolur, bir diğerinde estetisyen seansı işaretlemeyi unutur.',
          'Excel dosyası ise yoğun cumartesi gününde resepsiyondaki tek bilgisayara bağımlı kalır. İki farklı kabinde çalışan estetisyenler birbirinin odasını görmeden randevu sözü verdiğinde hem cihaz çakışması yaşanır hem de müşteri kartındaki son durum güncellenmez.',
        ],
        bullets: [
          'Kayıp kart krizi: Müşteri "Kartımı evde unuttum" dediğinde salonun elindeki kayıtla uyuşmazlık çıkabilir.',
          'Tarihsiz seans düşümü: Seansın ne zaman yapıldığı bilinmeyince lazer döngüsünde 3 hafta mı 5 hafta mı geçtiği anlaşılmaz.',
          'Taksit ve kalan seans karışması: Paket ücretinin yarısını ödeyip 6 seansa da gelen müşteride bakiye gözden kaçar.',
          'Cihaz ve oda çakışması: Aynı anda iki müşteriye tek lazer cihazının verildiği saatler kriz yaratır.',
        ],
      },
      {
        heading: '2. 6, 8 ve 10 Seanslık Paketlerde Dijital Sayaç Kurgusu',
        paragraphs: [
          'Sağlıklı bir güzellik salonu programında paket açma işlemi 10 saniye sürmelidir. Müşteri kartına girip örneğin "8 Seans Buz Lazer Paketi" veya "6 Seans Hydrafacial Cilt Bakımı" tanımladığınızda sistem başlangıç sayacını 8/8 olarak kurar. Müşteri salona geldiğinde randevu tamamlandı butonuna bastığınız an sayaç otomatik olarak 7/8’e düşer ve tarih-uzman bilgisiyle kayda geçer.',
          'Böylece hem siz hem de uzmanınız müşterinin bugüne kadar hangi tarihlerde, hangi estetisyenle, hangi bölge veya doz notlarıyla işlem gördüğünü tek bakışta okuyabilirsiniz. Tartışma ihtimali tamamen ortadan kalkar.',
        ],
        bullets: [
          'Her seans düşümünde tarih, saat ve işlemi yapan estetisyen otomatik kaydedilir.',
          'Seans notu alanına cihaz ayarları (örneğin cilt tipi veya enerji seviyesi) eklenerek uzman değişse bile kalite korunur.',
          'Hediyeli kontrol seansları (+2 kontrol) ayrı alt sayaçla şeffaf şekilde izlenebilir.',
        ],
        tip: 'Müşteri randevudan kalkarken kalan seans sayısını ve bir sonraki ideal randevu tarihini o anda WhatsApp’tan özet olarak paylaşmak hem güveni artırır hem de bir sonraki seansı garantiler.',
      },
      {
        heading: '3. Paket Taksitleri, Kapora ve Tahsilat Turu Yönetimi',
        paragraphs: [
          'Güzellik salonlarında paketlerin tamamı peşin ödenmeyebilir; müşteriler çoğunlukla 2 veya 3 taksit halinde ödeme yapar. Burada dikkat edilmesi gereken kritik nokta, hizmetin seans sayacı ile paranın alacak bakiyesini aynı anda görebilmektir. 8 seanslık paketin 5. seansına gelmiş bir müşterinin hâlâ ödenmemiş taksidi varsa bu bilgi işlem öncesi resepsiyonda görünmelidir.',
          'Dükkânım Yanımda’da müşterinin kalan seans hakkıyla birlikte açık veresiye/taksit bakiyesi aynı kartta gösterilir. Ödeme günü gelen ama henüz uğramayan müşteriler için Tahsilat Turu ekranından kibar bir hatırlatma mesajı hazırlayarak geciken paket taksitlerini nakde çevirebilirsiniz.',
        ],
        bullets: [
          'Peşinat veya kapora alındığında aynı dakika kasa ve müşteri cari kartına işlenir.',
          'Kalan taksit tutarları vade tarihiyle veresiye/cari listesinde takip edilir.',
          'Nakit, kredi kartı veya IBAN ile alınan her taksit gün sonu raporuna otomatik yansır.',
        ],
      },
      {
        heading: '4. Estetisyen, Kabin ve Cihaz Çakışmasını Önleyen Takvim Planlaması',
        paragraphs: [
          'Berberlerde koltuk sayısı ne ise güzellik merkezlerinde de oda (kabin) ve cihaz sayısı odur. Üç estetisyeniniz olsa bile tek bir cilt bakım üniteniz veya iki adet lazer cihazınız varsa, takvimi sadece kişiye göre değil cihaz/kabin uygunluğuna göre de renklerle ayırmanız gerekir.',
          'Randevular işlem süresine göre (cilt bakımı 60 dk, protez tırnak 90 dk, tüm vücut lazer 45 dk) takvime oturduğunda kabin kapısında müşteri beklemez, cihaz boş yere soğumaz veya ısınmaz. Uzmanların hangi işlemden yüzde kaç prim alacağı da akşam kapanışta otomatik hesaplanır.',
        ],
        bullets: [
          'Uzman ve oda bazlı renkli takvim görünümüyle çifte rezervasyonu önleyin.',
          'Bakım kremleri ve serumlar gibi perakende ürün satışlarını aynı adisyondan düşün.',
          'Estetisyenlerin günlük işlem sayısı ve prim hakedişini şeffaf şekilde raporlayın.',
        ],
      },
      {
        heading: '5. Paketleri Yarım Bırakanları ve Biten Paketleri Yeniden Kazandırmak',
        paragraphs: [
          'Güzellik merkezlerinin en büyük gizli ciro potansiyeli, paketinin 4. seansından sonra aylarca randevu almayan ya da 8. seansını bitirip bir daha uğramayan müşterilerdir. Oysa lazerde 30–45 günlük döngüyü kaçırmak hem sonucun verimini düşürür hem de müşterinin salondan soğumasına yol açar.',
          'Düzenli müşteri takibi yaptığınızda seansı üzerinden 35 gün geçtiği halde randevu almamış müşterileri kolayca süzüp "Kontrol ve yeni seans döneminiz yaklaştı, uygun saatlerimizi inceleyebilirsiniz" mesajıyla randevu linkinizi iletebilirsiniz. Son seansı biten müşterilere ise idame bakım veya farklı bir cilt bakımı paketi önermek satış maliyetini sıfıra indirir.',
        ],
        tip: 'Yeni müşteri reklamına bütçe harcamadan önce son 60 gündür seansa gelmeyen aktif paket sahiplerine hatırlatma göndermek, salon doluluğunu bir hafta içinde görünür biçimde yükseltir.',
      },
    ],
    faq: [
      {
        q: 'Farklı müşterilere 6, 8 veya 12 seanslık farklı paketler tanımlayabilir miyim?',
        a: 'Evet. Her müşteri kartına işlem türüne göre istediğiniz seans sayısını tanımlayabilir ve her gelişte tek tıkla 1 seans düşebilirsiniz.',
      },
      {
        q: 'Estetisyenler kendi telefonlarından randevuları görüp primlerini takip edebilir mi?',
        a: 'Personel ve uzman bilgileri dükkan sahibi kontrolündeki panelden yönetilir; kasa ve müşteri verileri tamamen işletme sahibinin yetkisinde korunur.',
      },
      {
        q: 'Müşteri paket taksidini havale ile ödediğinde kasa raporu karışır mı?',
        a: 'Hayır. Tahsilat girerken ödeme türünü "Havale/IBAN" seçtiğinizde müşteri borcundan düşer ve banka/havale kasasına işlenir; nakit çekmecenizi etkilemez.',
      },
      {
        q: 'Güzellik salonu programı ücretsiz denenebiliyor mu?',
        a: 'Evet. Dükkânım Yanımda Çırak paketiyle kredi kartı vermeden 2 dakikada salonunuzu açıp seans ve randevu takibini hemen test edebilirsiniz.',
      },
    ],
    relatedProductHref: '/guzellik-salonu',
    relatedProductLabel: 'Güzellik Salonu Programını İncele',
    relatedSlugs: [
      'kuafor-musteri-gelmeme-no-show-cozumu',
      'musteri-sadakati-sms-hatirlatma-geri-donus',
      'ucretsiz-randevu-uygulamalari-karsilastirmasi-2026',
    ],
  },
  {
    slug: 'esnaf-icin-e-arsiv-vergi-donemleri-takvimi',
    title: 'Esnaf İçin e-Arşiv ve Vergi Dönemleri Takvimi 2026',
    seoTitle: 'Esnaf İçin 2026 e-Arşiv Fatura Sınırları ve Vergi Takvimi | Dükkanım Yanımda',
    description:
      '2026 yılı esnaf fatura kesme sınırı (12.000 TL), işletme hesabı ve basit usul 3.000 TL e-Arşiv kuralı, KDV, Muhtasar ve Geçici Vergi dönemleri takvimi.',
    category: 'İşletme & Vergi',
    author: 'Selin Demirtaş',
    authorRole: 'KOBİ Kasa & Maliyet Uzmanı',
    publishedAt: '2026-10-30',
    updatedAt: '2026-11-17',
    readTime: '8 dk okuma',
    ogImage: '/og/kasa-programi.png',
    primaryKeyword: 'esnaf e-arşiv ve vergi dönemleri 2026',
    h1: 'Esnaf İçin e-Arşiv Sınırları ve Vergi Dönemleri Takvimi (2026 Rehberi)',
    lead:
      'İyi ticaret sadece çok satış yapmak değil, dönem sonunda sürpriz vergi cezası veya unutulmuş beyanname ödememek demektir. 2026 yılında güncellenen fatura kesme ve e-Arşiv sınırlarını, aylık ve 3 aylık vergi takvimini ve günlük kasa düzeninin muhasebe süreçlerinizi nasıl kolaylaştıracağını sade bir dille özetledik.',
    keyTakeaways: [
      '2026 yılı itibarıyla Vergi Usul Kanunu (VUK 232) kapsamında genel fatura düzenleme sınırı 12.000 TL olarak uygulanmaktadır.',
      'İşletme hesabı esasına göre defter tutanlar ve basit usul esnaf için 2026 boyunca 3.000 TL üzeri faturaların e-Arşiv Portal üzerinden kesilmesi kritik geçiş kuralıdır.',
      'Bilanço esasına tabi mükellefler için 1 Ocak 2026 itibarıyla tutara bakılmaksızın tüm faturalar elektronik (e-Fatura / e-Arşiv) düzenlenmektedir.',
      'KDV beyannamesi her ayın 28’ine, Muhtasar ve SGK prim bildirgesi ise ayın 26’sına kadar takip edilir.',
      'Günlük nakit, POS ve gider kayıtlarını düzenli tutmak hem vergi hazırlığını kolaylaştırır hem olası usulsüzlük risklerini azaltır.',
    ],
    sections: [
      {
        heading: '1. 2026 Yılında Esnafı İlgilendiren Fatura ve e-Arşiv Sınırları',
        paragraphs: [
          'Esnafın tezgah başında en sık tereddüt ettiği konu "Hangi tutardan sonra kağıt fiş yerine fatura ve e-Arşiv kesmem gerekiyor?" sorusudur. 1 Ocak 2026 itibarıyla Vergi Usul Kanunu (VUK) 232. maddesi kapsamında genel fatura düzenleme sınırı 12.000 TL olarak ilan edilmiştir. Yani 12.000 TL’yi aşan tek seferlik satışlarda yazar kasa fişi yerine fatura düzenlenmesi zorunludur; ayrıca tutar kaç lira olursa olsun müşteri fatura talep ettiğinde fatura kesmek mecburidir.',
          'Elektronik belge tarafında ise defter türüne göre ayrım vardır: Bilanço esasına göre defter tutanlar için 2026 yılıyla birlikte tutara bakılmaksızın tüm faturalar elektronik ortamda kesilirken; işletme hesabı defteri tutanlar ve basit usul esnaf için 31 Aralık 2026’ya kadar süren geçiş döneminde 3.000 TL’yi aşan faturaların GİB e-Arşiv Portalı üzerinden kesilmesi gerekmektedir. 1 Ocak 2027’den itibaren ise tüm faturaların e-Arşiv olması planlanmaktadır.',
        ],
        bullets: [
          '2026 Genel Fatura Düzenleme Sınırı (VUK 232): Vergiler dahil 12.000 TL.',
          'İşletme Hesabı ve Basit Usul (2026 Geçiş Dönemi): 3.000 TL üzeri faturalar e-Arşiv Portal’dan kesilir.',
          'e-Arşiv dışı standart mükellefler için GİB Portal limitleri: Vergi mükelleflerine (B2B) 12.000 TL, nihai tüketicilere (B2C) 30.000 TL üzeri.',
          'Özel usulsüzlük cezaları 2026’da ilk tespitlerde 17.000 TL bandından başladığı için sınır aşımı mutlaka kontrol edilmelidir.',
        ],
        tip: 'Mevzuat hadleri yıllık tebliğlerle ve mükellefiyet statünüze göre değişebildiği için kendi defter türünüzü yıl başında mali müşavirinizle mutlaka teyit edin.',
      },
      {
        heading: '2. Aylık Vergi ve SGK Prim Takvimi (Ayın 26’sı ve 28’i)',
        paragraphs: [
          'Gerçek usulde vergilendirilen ve yanında personel (kalfa, çırak, garson veya kasiyer) çalıştıran her esnafın her ay düzenli takip ettiği iki ana tarih vardır. Birincisi ayın 26’sına kadar verilen ve ödenen Muhtasar ve Prim Hizmet Beyannamesi (stopaj ve çalışan SGK bildirimi), ikincisi ise ayın 28’ine kadar verilen Katma Değer Vergisi (KDV) beyannamesidir.',
          'Bu iki tarihin resmi tatile veya hafta sonuna denk gelmesi halinde son gün ilk iş gününe uzar. Esnafların en sık yaşadığı nakit sürprizi, yüksek POS satışı yapılan bir ayın ardından KDV ve kira stopajı ödemesinin aynı haftaya denk gelmesine hazırlıksız yakalanmaktır.',
        ],
        bullets: [
          'Her ayın 26’sı: Muhtasar ve Prim Hizmet Beyannamesi (işyeri kira stopajı ve personel gelir vergisi/SGK beyanı).',
          'Her ayın 28’i: KDV Beyannamesi (bir önceki ayın satış KDV’si ile alış faturalarının KDV mahsubu).',
          'Her ayın son iş günü: SGK işveren prim ödemeleri ve varsa BA/BS kontrolleri (muhasebeci takibinde).',
        ],
      },
      {
        heading: '3. 3 Aylık Geçici Vergi ve Yıllık Gelir Vergisi Dönemleri',
        paragraphs: [
          'Aylık beyanların dışında yılın dört çeyreğinde bir kez kâr-zarar hesabı yapılarak Geçici Vergi beyannamesi verilir. Üçer aylık kazanç dönemleri (Ocak-Mart, Nisan-Haziran, Temmuz-Eylül, Ekim-Aralık) takip eden ikinci ayın 17’sinde beyan edilip ödenir: yani Mayıs, Ağustos, Kasım ve Şubat aylarının 17’si işletmenin çeyreklik vergi kontrol tarihleridir.',
          'Yıllık Gelir Vergisi beyannamesi ise bir önceki yılın tüm kazancı için Mart ayında verilir (taksitleri Mart ve Temmuz aylarında ödenir). Basit usulde vergilendirilen berber, terzi veya küçük esnafta ise kazanç istisnası ve yıllık beyan kuralları mali müşavir/oda kayıtları çerçevesinde Şubat ayında netleştirilir.',
        ],
        bullets: [
          'Mayıs 17: 1. Dönem (Ocak–Mart) Geçici Vergi beyan ve ödeme günü.',
          'Ağustos 17: 2. Dönem (Nisan–Haziran) Geçici Vergi beyan ve ödeme günü.',
          'Kasım 17: 3. Dönem (Temmuz–Eylül) Geçici Vergi beyan ve ödeme günü.',
          'Şubat 17 ve Mart ayı: 4. Dönem Geçici Vergi ile Yıllık Gelir Vergisi beyan dönemi.',
        ],
      },
      {
        heading: '4. Muhasebeciye Buruşuk Fiş Poşeti Yerine Düzenli Kasa Kaydı Götürmek',
        paragraphs: [
          'Esnafın çoğu ay boyunca faturaları yazar kasanın yanındaki kutuya ya da bir poşete atar; ayın 20’sinde muhasebeci aradığında eksik faturaları ve banka dekontlarını aramaya başlar. Bu acele yüzünden mal alım veya elektrik/internet faturası gider olarak işlenemeyebilir; gider düşülemediği için de esnaf hak ettiğinden daha yüksek KDV ve gelir vergisi öder.',
          'Dükkânım Yanımda kasa ve gider modülünde her malzeme alımını, fatura ödemesini ve POS/IBAN tahsilatını gününde kaydettiğinizde, ay sonunda kasadaki toplam tutar ile banka hareketleriniz birbirini tutar. Muhasebecinize elinizdeki fatura dosyasıyla birlikte net bir aylık özet sunarsınız.',
        ],
        bullets: [
          'Gider faturalarınızı ödediğiniz gün dijital kasa paneline işleyip fiziksel nüshayı tarih sırasıyla dosyaya koyun.',
          'IBAN üzerinden yapılan ticari tahsilatların açıklama kısmına hizmet/ürün bilgisi yazılmasını isteyin.',
          'Vergi ödemeleri için her haftalık nakit fazlasından küçük bir "Vergi Yedeği" payı ayırın.',
        ],
        tip: 'Her Cuma akşamı haftalık ciro içinden ortalama %5–%8’lik bir tutarı vergi ve SGK ödemeleri için kenara not etmek, ayın 26-28’inde nakit sıkışıklığı yaşamanızı tamamen önler.',
      },
      {
        heading: '5. Dijital Ön Takip ile Sürpriz Vergi Şoklarını Önlemek',
        paragraphs: [
          'Dükkânım Yanımda bir resmi e-Fatura entegratörü değil, esnafın gün içi nakit, POS, veresiye ve gider disiplinini sağlayan pratik ön yönetim defteridir. Ancak resmi beyannamenizi hazırlayan mali müşavirinizin en çok ihtiyaç duyduğu şey, işletmenizin günlük satış ve harcama doğruluğudur.',
          'Gün sonu raporlarınızı düzenli kapattığınızda yazar kasa Z raporları, POS gün sonları ve elden ödenen giderler arasında kopukluk kalmaz. Böylece 2026 yılı vergi takvimindeki hiçbir döneme hazırlıksız girmezsiniz.',
        ],
      },
    ],
    faq: [
      {
        q: '2026 yılında müşteri 500 TL’lik alışverişte fatura isterse kesmek zorunda mıyım?',
        a: 'Evet. 12.000 TL fatura düzenleme sınırı altındaki satışlarda normalde fiş yeterlidir ancak müşteri talep ederse tutar ne olursa olsun fatura düzenlemek zorunludur.',
      },
      {
        q: 'İşletme defterine tabi bir berber veya kuaför 4.000 TL’lik toplu gelin paketi faturasını nasıl keser?',
        a: '2026 geçiş döneminde işletme hesabı esasına tabi esnaflar 3.000 TL’yi aşan faturalarını GİB e-Arşiv Portal üzerinden e-Arşiv Fatura olarak düzenlemelidir.',
      },
      {
        q: 'Dükkânım Yanımda üzerinden resmi e-Arşiv fatura kesiliyor mu?',
        a: 'Hayır, Dükkânım Yanımda kasa, randevu, adisyon, veresiye ve gün sonu yönetim panelidir; resmi faturalarınızı GİB e-Arşiv Portal veya mali müşavirinizin önerdiği entegratör üzerinden kesip tutarları kasanıza işlersiniz.',
      },
      {
        q: 'KDV ve Muhtasar tarihleri hafta sonuna gelirse ne olur?',
        a: 'Resmi tatil veya hafta sonuna denk gelen beyanname ve ödeme son günleri takip eden ilk iş gününün sonuna kadar uzar. Yine de ödemeleri bir gün önceden planlamak güvenlidir.',
      },
    ],
    relatedProductHref: '/kasa-programi',
    relatedProductLabel: 'Kasa ve Gelir-Gider Takibini İncele',
    relatedSlugs: [
      'kucuk-isletmeler-icin-kasa-takibi-rehberi',
      'gun-sonu-raporu-nasil-hazirlanir',
      'berber-dukkani-acmak-maliyet-kontrol-listesi',
    ],
  },
  {
    slug: 'musteri-sadakati-sms-hatirlatma-geri-donus',
    title: 'Müşteri Sadakati: SMS ve E-posta Hatırlatma ile Geri Dönüş',
    seoTitle: 'Müşteri Sadakati: SMS ve Hatırlatma ile Geri Dönüş Stratejileri',
    description:
      'Berber, kuaför ve yerel işletmelerde eski müşterileri geri döndürmenin yolları: 21 günlük tıraş hatırlatması, 10’lu dijital sadakat kartı ve ölü saat duyuruları.',
    category: 'Randevu & Salon',
    author: 'Emre Aksoy',
    authorRole: 'Berber & Salon Danışmanı',
    publishedAt: '2026-11-05',
    updatedAt: '2026-11-18',
    readTime: '6 dk okuma',
    ogImage: '/og/berber.png',
    primaryKeyword: 'müşteri sadakati sms hatırlatma',
    h1: 'Müşteri Sadakati: Akıllı Hatırlatma ve Dijital Kartlarla Eski Müşteriyi Geri Kazanın',
    lead:
      'Pek çok esnaf yeni müşteri çekmek için sosyal medya reklamlarına bütçe ayırırken, son 45 gündür dükkana uğramamış yüzlerce eski müşterisini unutur. Oysa sizi zaten tanıyan ve işçiliğinizi bilen bir müşteriyi geri çağırmak, sıfırdan yeni müşteri ikna etmekten hem 5 kat daha ucuz hem de çok daha kârlıdır.',
    keyTakeaways: [
      'Düzenli hizmet alan bir müşterinin iki ziyaret arasındaki ideal süresi berberlerde 18–25 gün, kuaför ve bakımlarda 30–40 gündür.',
      'Doğru zamanda atılan nazik bir WhatsApp, SMS veya e-posta hatırlatması unutulan geri dönüşleri %30’a varan oranda tekrar randevuya çevirir.',
      'Dijital 10’lu sadakat kartı (9 tıraş + 10. hediye gibi) müşterinin sırf puanı yanmasın diye başka dükkana gitmesini önler.',
      'Sürekli indirim yapmak yerine Salı–Çarşamba ölü saatlere özel seçili müşteri duyurusu kâr marjınızı korur.',
      'Hatırlatma mesajlarının içinde mutlaka doğrudan tek tıkla randevu linkiniz (/r/dukkan-adiniz) yer almalıdır.',
    ],
    sections: [
      {
        heading: '1. Eski Müşteriyi Elde Tutmak Neden Yeni Müşteriden 5 Kat Değerlidir?',
        paragraphs: [
          'Yeni bir müşterinin kapınızdan içeri girmesi için tabela, harita konumu, Instagram paylaşımı, tavsiye ve çoğu zaman ilk geliş indirimi gerekir. Üstelik yeni gelen kişinin sürekli müdavim olup olmayacağı belirsizdir. Buna karşılık dükkanınızda daha önce iki kez memnun kalmış bir müşteri sizin fiyatınızı, sohbetinizi ve elinizin ayarını zaten biliyordur.',
          'Müşterilerin önemli bir kısmı memnuniyetsizlikten değil, yoğunluktan ve ertelemeden dolayı 3 hafta yerine 6 haftada bir gelmeye başlar. Eğer bir müşteri yılda 16 kez yerine 10 kez geliyorsa, sadece ziyaret sıklığındaki bu sessiz düşüş yıllık cironuzun %35’ini götürür.',
        ],
        bullets: [
          'Yılda 12 yerine 16 ziyaret = tek müşteriden %33 daha fazla yıllık ciro.',
          'Sadık müşteriler arkadaş çevresine en güçlü ücretsiz tavsiyeyi (kulaktan kulağa reklam) yapar.',
          'Tanıdık müşterilerin no-show (randevuya gelmeme) oranı yeni müşterilere göre yarı yarıyadır.',
        ],
      },
      {
        heading: '2. 21 Günlük Tıraş ve 35 Günlük Bakım Döngüsünde Geri Dönüş Mesajı',
        paragraphs: [
          'Her sektörün doğal bir yenilenme takvimi vardır. Erkek berberinde saç ve sakal formunu 3 haftada (21 günde) bir kaybeder; kadın kuaföründe dip boya ve bakım 30–35 günde bir yenilenir; güzellik salonunda ise lazer döngüsü 30–45 gün sürer. Bu gün geldiğinde müşteriye küçük bir hatırlatma yapmak "satış baskısı" değil, aksine müşteri açısından düşünceli bir hizmettir.',
          'Örneğin son ziyaretinin üzerinden 24 gün geçmiş bir müşteriye "Merhaba Ahmet Bey, son ziyaretinizin üzerinden yaklaşık 3 hafta geçti. Hafta sonu sıkışıklığına kalmadan uygun saatinizi buradan seçebilirsiniz" mesajıyla birlikte online randevu linkinizi atmanız yeterli olur.',
        ],
        bullets: [
          'Berber & Erkek Kuaförü: 21–25 gün arası "Bakım zamanınız geldi" nazik hatırlatması.',
          'Kadın Kuaförü: 30–35 gün arası dip boya ve saç bakım kontrol daveti.',
          'Teknik Servis / Bakım: 6 aylık veya yıllık periyodik cihaz kontrol hatırlatması.',
        ],
        tip: 'Geri dönüş mesajını asla hafta sonu sabahı göndermeyin; Perşembe öğleden sonra veya Pazartesi akşamüstü göndermek hafta içi boş saatlerin dolmasını sağlar.',
      },
      {
        heading: '3. Sıkmadan Dönüşüm Getiren WhatsApp, SMS ve E-posta Mesaj Dili',
        paragraphs: [
          'Müşteriler telefonlarına gelen her günkü "BÜYÜK İNDİRİM! KAÇIRMAYIN!" şeklindeki toplu reklam SMS’lerinden bıkmış durumdadır. Bu tür robotik ve büyük harfli mesajlar markanıza olan saygıyı azaltır ve müşterinin sizi engellemesine yol açar.',
          'Esnaf samimiyeti ile profesyonelliği birleştiren mesajlarda mutlaka müşterinin adı geçmeli, kısa tutulmalı ve net bir fayda sunmalıdır. E-posta kanalı daha çok aylık bakım bülteni veya randevu özeti/fatura bilgilendirmesi için idealken, SMS ve WhatsApp anlık randevu aksiyonu almak için en hızlı sonucu verir.',
        ],
        bullets: [
          'Kısa ve kişisel olun: "Merhaba Selin Hanım" ile başlamak okunma oranını ikiye katlar.',
          'Tek bir net eylem verin: Mesajın sonunda doğrudan /r/dukkan-adiniz randevu linkiniz olsun.',
          'Ayda 1–2 defadan fazla kampanya mesajı atarak müşteriyi yormayın.',
        ],
      },
      {
        heading: '4. Dijital 10’lu Sadakat Kartı ile Rakibe Gitmeyi Engellemek',
        paragraphs: [
          'Eskiden kahvecilerde ve berberlerde cüzdana konulan kağıt damga kartları vardı; müşteri 9 damga topladığında 10. kahve veya tıraş hediye olurdu. Ancak o kağıt kartlar ya yıkanınca erir ya da evde unutulurdu. Dijital sadakat kartında ise müşteri telefon numarasını söylediği anda puanı otomatik işlenir.',
          'Örneğin 6 veya 7 tıraş biriktirmiş bir müşteri, bir akşam başka bir sokağın berberinin önünden geçerken bile "Benim kendi ustamda 3 hakkım kaldı, zaten bedava tıraşım geliyor" diyerek randevusunu yine sizden alır. Bu küçük psikolojik bağ, mahalle rekabetinde fiyat kırmadan müşteri tutmanın en güçlü yoludur.',
        ],
        bullets: [
          'Her tamamlanan randevu veya satışta dijital sadakat damgası otomatik artar.',
          '10. işlemde ücretsiz saç yıkama, sakal şekillendirme, maske veya tek kesim hediyesi tanımlanabilir.',
          'Müşteriye kaç damgasının kaldığını hatırlatmak ek ziyaret motivasyonu yaratır.',
        ],
      },
      {
        heading: '5. Hafta İçi Ölü Saatleri Hedefli Duyurularla Doldurmak',
        paragraphs: [
          'Cumartesi 14:00 zaten her berberde doludur; asıl ustalık Salı günü saat 11:30 ile 15:30 arasındaki boş koltuğu doldurmaktır. Hafta sonu indirim yapmak kârınızı düşürür ama normalde boş geçecek Salı öğlenine özel bir avantaj sunmak sıfır liradan artı ciro üretmektir.',
          'Dükkânım Yanımda’daki Patron Raporu sayesinde haftanın en sakin saatlerini net biçimde tespit edebilir, hazır "Ölü Saat Flaş İndirimi" WhatsApp şablonuyla yalnızca esnek çalışanlara veya öğrencilere haber verip o günün kasasını doldurabilirsiniz.',
        ],
        tip: 'Öğrenci müşterilere ve esnek saatli çalışanlara Salı–Çarşamba 11:00–15:00 arası için küçük bir ek bakım ikramı sunmak hafta sonu yığılmasını da sağlıklı biçimde dağıtır.',
      },
    ],
    faq: [
      {
        q: 'Hatırlatma mesajları göndermek için ekstra SMS paketi satın almam zorunlu mu?',
        a: 'Hayır. Çırak ve Usta paketlerinde dahi cihazınızdan tek dokunuşla hazırlanan WhatsApp ve SMS hatırlatma şablonlarını ücretsiz kullanabilirsiniz; Patron VIP’de ek otomatik bildirim kotası da dahildir.',
      },
      {
        q: 'Dijital sadakat kartı müşterinin telefonuna bir uygulama yüklemesini gerektirir mi?',
        a: 'Hayır. Sadakat puanları sizin panelinizdeki müşteri kartında telefon numarasına bağlı olarak tutulur; müşterinin hiçbir şey indirmesine gerek yoktur.',
      },
      {
        q: 'Uzun süredir gelmeyen müşterileri panelden kolayca görebilir miyim?',
        a: 'Evet. Müşteri listesinde son ziyaret tarihlerini görerek 30 veya 45 gündür uğramayan müdavimlerinizi tek bakışta listeleyebilirsiniz.',
      },
      {
        q: 'Müşteri istemezse hatırlatma mesajlarını durdurabilir miyim?',
        a: 'Elbette. İzinli iletişim ve KVKK hassasiyeti gereği yalnızca onay veren müşterilerinize hatırlatma göndermenizi öneririz; müşteri kartından notla kolayca hariç tutabilirsiniz.',
      },
    ],
    relatedProductHref: '/berber',
    relatedProductLabel: 'Berber Sadakat ve Hatırlatma Araçlarını Gör',
    relatedSlugs: [
      'kuafor-musteri-gelmeme-no-show-cozumu',
      'berber-randevu-sistemi-neden-gerekli',
      'guzellik-salonunda-paket-seans-takibi',
    ],
  },
  {
    slug: 'berber-dukkani-acmak-maliyet-kontrol-listesi',
    title: 'Berber Dükkanı Açmak: Maliyet ve Kontrol Listesi',
    seoTitle: 'Berber Dükkanı Açmak: 2026 Maliyet Kalemleri ve Kontrol Listesi',
    description:
      '2026 yılında berber dükkanı açmak için gereken sermaye, koltuk ve tadilat maliyetleri, belediye ruhsatı, ustalık belgesi ve ilk gün dijital sistem kontrol listesi.',
    category: 'İşletme & Vergi',
    author: 'Murat Karahan',
    authorRole: 'Esnaf Operasyon & Finans Editörü',
    publishedAt: '2026-11-12',
    updatedAt: '2026-11-19',
    readTime: '8 dk okuma',
    ogImage: '/og/berber.png',
    primaryKeyword: 'berber dükkanı açmak maliyeti',
    h1: 'Berber Dükkanı Açmak: 2026 Maliyet Kalemleri ve Adım Adım Kontrol Listesi',
    lead:
      'Kendi berber dükkanını açmak her ustanın hayalidir; ancak sadece makas ve koltuk alıp kapıyı açmak ilk altı ayda nakit sıkıntısı yaşamanıza neden olabilir. Dükkan seçiminden belediye ruhsatına, ekipman bütçesinden ilk gün dijital randevu kurulumuna kadar eksiksiz bir açılış kontrol listesi hazırladık.',
    keyTakeaways: [
      'Dükkan kirası, dükkanın aylık beklenen cirosunun maksimum %12–%15’ini geçmeyecek şekilde lokasyon seçilmelidir.',
      'Açılış bütçesinde demirbaş ve tadilat kadar ilk 3 aylık kira, fatura ve Bağ-Kur için işletme sermayesi de mutlaka ayrılmalıdır.',
      'Belediye işyeri açma ruhsatı, vergi levhası, ustalık belgesi ve ilgili Berberler Odası kaydı açılıştan önce tamamlanmalıdır.',
      'Başlangıçta 2 veya 3 koltukla başlamak, koltuk başı doluluğu oturttuktan sonra yeni usta almak nakit akışını korur.',
      'İlk günden Google Haritalar kaydı ve komisyonsuz online randevu linki açmak yeni dükkanın müşteri toplama süresini yarıya indirir.',
    ],
    sections: [
      {
        heading: '1. Lokasyon Seçimi ve Kira / Ciro Dengesi Hesabı',
        paragraphs: [
          'Yeni açılan berber salonlarının en büyük hatası, çok işlek bir ana caddede yüksek kira ödeyip içindeki dekorasyona tüm sermayeyi gömmektir. Oysa berberlik tekrar ziyaret (müdavim) işidir; ana caddenin bir paralel sokağındaki görünür, ulaşımı kolay ve park sorunu az bir dükkan, çok daha düşük kirayla aynı müşteri potansiyelini yakalayabilir.',
          'Lokasyon seçerken çevredeki konut yoğunluğunu, yakın iş yerlerini veya öğrenci nüfusunu analiz edin. Kabaca bir kural olarak, aylık dükkan kiranızı ortalama tek saç-sakal tıraşı fiyatınıza böldüğünüzde, sadece kira giderini karşılamak için ayda kaç tıraş yapmanız gerektiği hemen ortaya çıkar. Eğer kiranız aylık toplam iş hacminizin üçte birini yutuyorsa o lokasyon başlangıç için risklidir.',
        ],
        bullets: [
          'Apartman girişi, köşe başı görünürlük ve akşam aydınlatması yaya dikkatini artırır.',
          'Dükkan su tesisatı (lavabo giderleri) ve sıcak su altyapısının hazır olması tadilat masrafını ciddi oranda düşürür.',
          'Kontrat öncesi dükkanın iskan ve yönetim planı açısından berber faaliyetine uygunluğunu teyit edin.',
        ],
      },
      {
        heading: '2. 2026 Berber Dükkanı Açılış Maliyet Kalemleri',
        paragraphs: [
          '2026 yılında sıfırdan 2–3 koltuklu modern bir erkek kuaförü / berber dükkanı açmanın bütçesi, şehre ve seçilen dekorasyon seviyesine göre değişmekle birlikte temelde beş ana kalemden oluşur. Bütçeyi yazarken en pahalı İtalyan koltuğa odaklanmak yerine sağlam hidrolikli, müşteri konforu yüksek ve temizliği kolay ekipmanlara öncelik vermek akıllıca olur.',
          'Tadilat sırasında duvar çıtası, sıcak gün ışığı aydınlatma, tezgah önü yıkama ünitesi ve iyi bir havalandırma (özellikle fön ve sprey kokusu için) müşteri memnuniyetinde mermer kaplamadan çok daha etkili sonuç verir.',
        ],
        bullets: [
          'Kira Peşinatı, Depozito ve Emlakçı Bedeli: Genellikle 1 kira + 1 veya 2 kira depozito.',
          'Tadilat, Zemin, Aydınlatma, Tabela ve Tezgah: Dükkanın mevcut durumuna göre değişen temel kurulum.',
          'Koltuk, Yıkama Seti, Ayna ve Bekleme Alanı: 2–3 hidrolikli berber koltuğu, servis arabaları ve şofben/kombi.',
          'El Aletleri ve Sarf Malzemeleri: Tıraş makineleri, makaslar, jilet/ustura, UV sterilizasyon dolabı, havlular, önlük ve kozmetikler.',
          'Resmi Kuruluş, Mali Müşavir ve Yeni Nesil Yazar Kasa POS: Şahıs işletmesi açılışı, ruhsat harçları ve POS cihazı.',
        ],
        tip: 'Teknolojik yazılım tarafına başlangıçta büyük bütçe ayırmanıza gerek yoktur; Dükkânım Yanımda Çırak paketiyle ₺0 maliyetle randevu, kasa ve müşteri sisteminizi ilk günden kurabilirsiniz.',
      },
      {
        heading: '3. Resmi Evraklar, Ustalık Belgesi ve Ruhsat Kontrol Listesi',
        paragraphs: [
          'Dükkan kontratını imzalamadan önce resmi belgelerin sırasını bilmek açılış sürecini haftalarca hızlandırır. Berberlik ustalık gerektiren bir meslek kolu olduğu için belediye ruhsat aşamasında Ustalık Belgesi (veya ustalık belgesine sahip bir sorumlu müdür/ortak) talep edilir.',
          'Mali müşaviriniz aracılığıyla vergi dairesi açılışı (genellikle basit usul şartları sağlanıyorsa basit usul veya işletme hesabı) yapıldıktan sonra ilgili Esnaf ve Sanatkarlar / Berberler Odası kaydı ve belediye işyeri açma ve çalışma ruhsatı tamamlanır. Pazar günü tatil veya nöbetçi çalışma düzenlemeleri için bağlı bulunduğunuz odanın güncel ilçe kararlarını kontrol etmeyi unutmayın.',
        ],
        bullets: [
          'Ustalık Belgesi (MEB / Çıraklık Eğitim onaylı)',
          'Kira kontratı ve vergi levhası (mali müşavir üzerinden açılış)',
          'Esnaf ve Sanatkarlar Odası / Berberler Odası kaydı ve fiyat tarifesi onayı',
          'Belediye İşyeri Açma ve Çalışma Ruhsatı + itfaiye/hijyen uygunluğu',
          'Yeni nesil yazar kasa POS cihazı ve GİB kaydı',
        ],
      },
      {
        heading: '4. İlk 90 Günü Kurtaran İşletme Sermayesi ve Fiyatlandırma',
        paragraphs: [
          'Yeni açılan bir berberde ilk günden tüm koltukların dolması nadirdir. Çevre esnafın sizi tanıması, ilk gelenlerin saç stilinize alışıp arkadaşlarını getirmesi genellikle 60 ila 90 gün sürer. Bu yüzden elinizdeki paranın %100’ünü dekorasyona harcamak yerine en az 3 aylık kira, elektrik, su, Bağ-Kur ve temel malzeme giderini kenarda nakit yedek olarak bırakmalısınız.',
          'Fiyat tarifesini belirlerken ise sadece yan sokaktaki berberin fiyatına bakmayın; kendi kira, malzeme ve saatlik emeğinizin maliyetini hesaplayın. Açılışta kısa süreli "tanışma bakımı" gibi ek değerler (örneğin kesim yanında ücretsiz saç yıkama ve şekillendirme) sunmak, fiyatı ucuzlatmaktan çok daha kaliteli bir müşteri kitlesi getirir.',
        ],
        bullets: [
          'En az 3 aylık sabit gider kadar yedek nakit sermaye ayırın.',
          'Fiyatı kırmak yerine hizmet deneyimini (ikram, temizlik, randevu dakiliği) yükseltin.',
          'İlk günden itibaren kasa giriş-çıkışını ve gün sonu raporunu aksatmadan tutun.',
        ],
      },
      {
        heading: '5. Açılış Günü Dijital Vitrin: Google Haritalar ve Online Randevu',
        paragraphs: [
          'Tabelayı astığınız gün dijital kepenginizi de açın. Mahallenize yeni taşınan veya "yakınımdaki açık berber" diye arama yapan insanların %80’i ilk olarak Google Haritalar’a bakar. Dükkanınızın net iç-dış fotoğraflarını, çalışma saatlerinizi ve doğrudan online randevu linkinizi Google İşletme Profilinize ilk günden ekleyin.',
          'Ayrıca aynanın köşesine ve giriş camına yerleştireceğiniz küçük bir "Sıra Beklemeden Online Randevu Al" karekodu, önünüzden yürüyüp geçen insanların gece bile telefonundan randevu almasını sağlar. İlk haftadan itibaren her müşterinizi telefon numarasıyla sisteme kaydederek 21 gün sonra nazik geri dönüş hatırlatmalarıyla sadık müdavim ağınızı kurarsınız.',
        ],
        tip: 'İlk müşterilerinizden memnun kalanlara dükkandan çıkarken Google Haritalar yorum linkinizi paylaşmak, ilk 30 günde semt aramalarında üst sıralara çıkmanızı sağlar.',
      },
    ],
    faq: [
      {
        q: 'Berber dükkanı açmak için ustalık belgesi şart mı?',
        a: 'Evet. Belediyeden işyeri açma ve çalışma ruhsatı alabilmek için işletme sahibinin veya dükkan bünyesinde sigortalı sorumlu ustanın Ustalık Belgesi bulunmalıdır.',
      },
      {
        q: 'Başlangıçta kaç koltukla başlamak daha mantıklıdır?',
        a: 'Tek başınıza başlayacaksanız 2 koltuk (biri aktif tıraş, diğeri yoğun anlar veya gelecek kalfa için hazırlık) ideal başlangıçtır; kira ve dekorasyon bütçesini gereksiz şişirmez.',
      },
      {
        q: 'Yeni açılan berberde randevu ve kasa sistemine hemen geçmek erken değil mi?',
        a: 'Tam aksine, ilk günden dijital düzenle başlamak en kolay dönemdir. Daha ilk 10 müşterinizden itibaren telefon numaralarını kaydeder, online linkinizi verir ve defter karmaşasını hiç yaşamazsınız.',
      },
      {
        q: 'Dükkânım Yanımda’yı yeni açtığım dükkanda ücretsiz kullanabilir miyim?',
        a: 'Evet. Çırak paketi ile kredi kartı olmadan ₺0 ücretle başlayabilir; randevu linkinizi, hizmet tarifenizi ve günlük kasanızı ilk günden ücretsiz yönetebilirsiniz.',
      },
    ],
    relatedProductHref: '/berber',
    relatedProductLabel: 'Yeni Dükkanın İçin Berber Sistemini Başlat',
    relatedSlugs: [
      'berber-randevu-sistemi-neden-gerekli',
      'esnaf-icin-e-arsiv-vergi-donemleri-takvimi',
      'kucuk-isletmeler-icin-kasa-takibi-rehberi',
    ],
  },
];

export function findBlogArticle(slugOrPath: string): BlogArticle | undefined {
  const clean = (slugOrPath || '')
    .split('?')[0]
    .split('#')[0]
    .toLowerCase()
    .trim()
    .replace(/\/+$/, '')
    .replace(/^\/?(blog\/)?/, '');
  if (!clean) return undefined;
  return BLOG_ARTICLES.find((a) => a.slug === clean);
}

export function isValidBlogRoute(pathname: string): boolean {
  const clean =
    (pathname || '')
      .split('?')[0]
      .split('#')[0]
      .toLowerCase()
      .trim()
      .replace(/\/+$/, '') || '/';
  if (clean === '/blog') return true;
  if (!clean.startsWith('/blog/')) return false;
  const slug = clean.slice('/blog/'.length);
  return BLOG_ARTICLES.some((a) => a.slug === slug);
}
