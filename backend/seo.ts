import fs from 'fs';
import path from 'path';
import { getAccounts, isAccountClosed } from './accounts';
import { loadShopState, slugify } from './shopState';
import { DEMO_ACCOUNT_ID } from './demoSeed';
import {
  BLOG_ARTICLES,
  findBlogArticle,
  isValidBlogRoute,
} from '../shared/blogArticles';
import {
  SEO_LANDING_PAGES,
  resolveLandingContentKey,
  type LandingPageContent,
} from '../shared/seoLandingContent';

export {
  BLOG_ARTICLES,
  findBlogArticle,
  isValidBlogRoute,
  SEO_LANDING_PAGES,
  resolveLandingContentKey,
};

export interface SeoMetadata {
  title: string;
  ogTitle: string;
  description: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  robots?: string;
  schemaJson?: object;
  extraSchemas?: object[];
  breadcrumbs?: { name: string; url: string }[];
  faqJson?: { q: string; a: string }[];
}

export interface ResolvedShop {
  name: string;
  slug: string;
  phone?: string;
  cityDistrict?: string;
  slogan?: string;
  businessField?: string;
  sectorKey?: string;
  isVip?: boolean;
  exists: boolean;
  openingTime?: string;
  closingTime?: string;
  closedDays?: number[];
  services?: { id: string; name: string; price: number; durationMinutes?: number }[];
  menuItems?: { id: string; name: string; price: number; category: string; description?: string; imageUrl?: string }[];
  reviews?: { id: string; customerName: string; staffName?: string; rating: number; comment: string; createdAt: string }[];
  logoUrl?: string;
}

export interface SeoGuideArticle {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  category: string;
  readTime: string;
  updatedAt: string;
  h1: string;
  lead: string;
  sections: { heading: string; body: string; bullets?: string[] }[];
  faq: { q: string; a: string }[];
  ctaHref: string;
  ctaLabel: string;
  noindex?: boolean;
}

export const SEO_GUIDE_ARTICLES: SeoGuideArticle[] = [
  {
    slug: 'berber-no-show-onleme',
    title: 'Berberlerde Gelmeyen Müşteri (No-Show) Nasıl Önlenir?',
    seoTitle: 'Berber ve Kuaförlerde No-Show Önleme Rehberi | Dükkanım Yanımda',
    description: 'Randevusuna gelmeyen müşteriler yüzünden boş kalan koltukları doldurmanın 5 pratik yolu: WhatsApp otomatik hatırlatma, kapora ve online sıra yönetimi.',
    category: 'Berber & Kuaför',
    readTime: '4 dk okuma',
    updatedAt: '2026-11-14',
    h1: 'Berber ve Kuaförlerde Gelmeyen Müşteri (No-Show) Nasıl Önlenir?',
    lead: 'Bir koltuğun 45 dakika boş kalması günde 2-3 müşterilik ciro kaybı demektir. Doğru hatırlatma ve online teyit akışıyla no-show oranını %70’e kadar düşürebilirsiniz.',
    sections: [
      {
        heading: '1. Randevudan 2 Saat Önce Otomatik Hatırlatma Gönderin',
        body: 'Müşterilerin çoğu unutkanlık veya saat karışıklığı nedeniyle gelmez. WhatsApp veya SMS üzerinden giden nazik bir hatırlatma, son dakika iptallerini erken bildirmenizi sağlar.',
        bullets: [
          'Randevu saatinden 2 saat önce otomatik teyit mesajı planlayın',
          'Gelemeyecek müşteriye tek tıkla iptal/erteleme seçeneği sunun',
          'Boşalan saati bekleme listesindeki müşteriye anında açın',
        ],
      },
      {
        heading: '2. VIP İşlemlerde FAST / IBAN Kapora Alın',
        body: 'Gelin başı, damat tıraşı veya uzun süren boya işlemlerinde sembolik kapora almak ciddiyeti artırır ve son dakika firelerini sıfıra indirir.',
      },
    ],
    faq: [
      { q: 'No-show müşterileri takip etmek için ekstra ücret öder miyim?', a: 'Hayır. Dükkânım Yanımda üzerinden gelen randevular tek ekranda izlenir ve WhatsApp hatırlatma şablonları ücretsiz hazırlanır.' },
      { q: 'Boş kalan saatleri nasıl hızlı doldurabilirim?', a: 'Ölü saat / boş slot duyurusuyla müdavimlerinize WhatsApp üzerinden flaş indirim mesajı gönderebilirsiniz.' },
    ],
    ctaHref: '/berber',
    ctaLabel: 'Berber Randevu Panelini İncele',
  },
  {
    slug: 'kuafor-prim-hesaplama',
    title: 'Berber ve Kuaför Usta / Kalfa Prim Hesaplama Rehberi',
    seoTitle: 'Berber ve Kuaför Prim Hesaplama Yöntemleri | Dükkanım Yanımda',
    description: 'Koltuk cirosu, yüzdelik hakediş ve malzeme düşümüyle adil usta/kalfa prim hesaplama yöntemleri ve ücretsiz online prim hesaplayıcı.',
    category: 'Berber & Kuaför',
    readTime: '5 dk okuma',
    updatedAt: '2026-11-14',
    h1: 'Berber ve Kuaför Salonlarında Usta & Kalfa Prim Hesaplama',
    lead: 'Akşam kasa kapatırken defterden tek tek işlem toplamak yerine, her hizmet sonrası personel payını otomatik hesaplamak hem şeffaflık hem de hız kazandırır.',
    sections: [
      {
        heading: 'En Yaygın 3 Prim Modeli',
        body: 'Türkiye’deki berber ve kuaför salonlarında genellikle yüzdelik ciro paylaşımı, sabit koltuk kirası veya maaş + barem prim modeli uygulanır.',
        bullets: [
          'Saf Yüzdelik (%40-%50): Kesim ve sakal gelirinden sabit oran düşülür',
          'Malzeme Düşümlü Prim: Boya/bakım işlemlerinde ürün maliyeti sonrası net ciro paylaşılır',
          'Hedef Baremli Prim: Aylık belirli ciroyu aşan ustaya ekstra %5 bonus verilir',
        ],
      },
    ],
    faq: [
      { q: 'Her personel için farklı prim oranı tanımlanabilir mi?', a: 'Evet, usta, kalfa ve çırak için ayrı komisyon oranları belirlenip akşam kapanışta otomatik raporlanır.' },
      { q: 'Prim ödemeleri kasadan gider olarak düşülür mü?', a: 'Evet, ödenen maaş ve primler tek tıkla kasa gideri olarak işlenir.' },
    ],
    ctaHref: '/kuafor',
    ctaLabel: 'Kuaför Prim & Takip Sistemini Gör',
  },
  {
    slug: 'ucretsiz-qr-menu-olusturma',
    title: 'Kafe ve Restoranlar İçin Ücretsiz QR Menü Nasıl Yapılır?',
    seoTitle: 'Ücretsiz QR Menü Oluşturma ve Masa Sipariş Rehberi | Dükkanım Yanımda',
    description: 'Baskı maliyeti olmadan 2 dakikada karekod QR menü hazırlayın, fiyat güncellemelerini anında yansıtın ve masadan canlı sipariş alın.',
    category: 'Kafe & Restoran',
    readTime: '4 dk okuma',
    updatedAt: '2026-11-14',
    h1: 'Kafe ve Restoranlar İçin Ücretsiz QR Menü Nasıl Yapılır?',
    lead: 'Sürekli değişen ürün fiyatları yüzünden her ay kağıt menü bastırmak yerine telefonunuzdan yönetilen canlı bir dijital QR menüyle masrafı sıfırlayın.',
    sections: [
      {
        heading: '3 Adımda Masaya Özel Karekod Menü',
        body: 'Ürünlerinizi kategorilere ayırın, fiyat ve fotoğrafları girin; sistem her masaya özel QR baskı kartını otomatik üretir.',
        bullets: [
          'Menü linkiniz (/m/dukkan-adiniz) hiç değişmeden ürün fiyatlarını anında güncelleyin',
          'Müşteriler telefonundan sepet oluşturup doğrudan adisyon masasına sipariş göndersin',
          'Tek dokunuşla garson ve hesap çağırma bildirimlerini anında alın',
        ],
      },
    ],
    faq: [
      { q: 'QR menü için aylık ekstra modül ücreti var mı?', a: 'Hayır, rakiplerin aksine QR menü ve masa yönetimi Dükkânım Yanımda içinde ek modül ücreti olmadan sunulur.' },
      { q: 'Müşterinin uygulama indirmesi gerekir mi?', a: 'Hayır, telefon kamerası karekodu okuttuğunda menü doğrudan tarayıcıda açılır.' },
    ],
    ctaHref: '/kafe-restoran',
    ctaLabel: 'Kafe & QR Menü Çözümünü İncele',
  },
  {
    slug: 'dijital-veresiye-defteri-gecis',
    title: 'Kağıt Veresiye Defterinden Dijitale Geçiş Rehberi',
    seoTitle: 'Esnaf Veresiye Programı: Kağıt Defterden Dijitale Geçiş | Dükkanım Yanımda',
    description: 'Bakkal, market ve mahalle esnafı için kayıp alacakları önleyen dijital veresiye defteri, barkodlu satış ve WhatsApp borç hatırlatma rehberi.',
    category: 'Bakkal & Market',
    readTime: '4 dk okuma',
    updatedAt: '2026-11-14',
    h1: 'Kağıt Veresiye Defterinden Dijitale Geçiş ve Alacak Yönetimi',
    lead: 'Yıpranan, sayfaları karışan veya kaybolan veresiye defterleri esnafa her yıl ciddi alacak kaybı yaşatır. Açılış bakiyesiyle 5 dakikada dijitale geçebilirsiniz.',
    sections: [
      {
        heading: 'Eski Borçları Kaybetmeden Geçiş Adımları',
        body: 'Müşterilerinizi ad ve telefon numarasıyla kaydedip mevcut toplam bakiyelerini tek işlemde açılış borcu olarak tanımlayın.',
        bullets: [
          'Her tahsilat ve yeni alışverişte güncel bakiye anlık hesaplanır',
          'WhatsApp üzerinden tek tuşla kibar, kurumsal hesap ekstresi gönderilir',
          'Bulut yedekleme sayesinde telefon kaybolsa bile verileriniz silinmez',
        ],
      },
    ],
    faq: [
      { q: '25 müşteriye kadar ücretsiz kullanabilir miyim?', a: 'Evet, Çırak paketi sonsuza dek ücretsizdir ve kredi kartı gerektirmez.' },
      { q: 'Barkod okuyucu almam şart mı?', a: 'Hayır, telefon kameranızla ürün barkodunu okutup sepete ekleyebilirsiniz.' },
    ],
    ctaHref: '/bakkal-market',
    ctaLabel: 'Bakkal & Veresiye Modülünü Gör',
  },
  {
    slug: 'komisyonsuz-randevu-programi',
    title: 'Komisyonsuz Berber & Güzellik Salonu Randevu Programı Seçimi',
    seoTitle: '%0 Komisyonlu Online Randevu Sistemi Karşılaştırması | Dükkanım Yanımda',
    description: 'Yeni müşteri komisyonu (%20) kesen pazaryeri uygulamalarına karşı dükkanınıza özel %0 komisyonlu online randevu linki kurmanın avantajları.',
    category: 'Karşılaştırma & Strateji',
    readTime: '5 dk okuma',
    updatedAt: '2026-11-14',
    h1: '%0 Komisyonlu Online Randevu Programı Neden Önemli?',
    lead: 'Bazı global randevu platformları ilk randevulardan %20’ye varan komisyon ve mesaj başına yüksek kontör ücreti keser. Kendi müşteri kitlenizi kendi linkinizle büyütmek kârınızı korur.',
    sections: [
      {
        heading: 'Kendi Markanızı ve Müşteri Verinizi Koruyun',
        body: 'Müşterilerinizi rakip salonların da listelendiği bir pazaryerine göndermek yerine doğrudan dükkanınızın logosu ve fiyatlarıyla açılan /r/dukkan-adiniz sayfanıza yönlendirin.',
        bullets: [
          'Randevu başına %0 komisyon — kazancınızın tamamı kasanızda kalır',
          'Instagram bio, Google İşletme Profili ve WhatsApp durumuna tek link ekleyin',
          'Aynı panelde kasa, veresiye, personel primi ve sadakat kartını yönetin',
        ],
      },
    ],
    faq: [
      { q: 'Dükkanım Yanımda randevulardan komisyon alır mı?', a: 'Kesinlikle hayır. Tüm paketlerde randevu komisyonu %0’dır.' },
      { q: 'Mevcut müşteri listemi kolayca aktarabilir miyim?', a: 'Evet, müşterilerinizi hızlıca ekleyip dijital sadakat ve hatırlatma akışına dahil edebilirsiniz.' },
    ],
    ctaHref: '/fiyat',
    ctaLabel: 'Şeffaf Paketleri İncele',
  },
  {
    slug: 'istanbul-berber-kuafor',
    noindex: true,
    title: 'İstanbul Berber & Kuaför Randevu ve Salon Yönetimi',
    seoTitle: 'İstanbul Berber ve Kuaför Randevu Sistemi | Dükkanım Yanımda',
    description: 'Kadıköy, Beşiktaş, Şişli, Üsküdar ve tüm İstanbul berber ile kuaför salonları için 7/24 online randevu, koltuk sırası ve prim takip sistemi.',
    category: 'Yerel Esnaf Rehberi',
    readTime: '3 dk okuma',
    updatedAt: '2026-11-14',
    h1: 'İstanbul Berber & Kuaför Salonları İçin Online Randevu Çözümü',
    lead: 'İstanbul’un yoğun semtlerinde telefon trafiğine boğulmadan koltuklarınızı tam kapasite doldurun; müşterileriniz 15 saniyede uygun saati seçsin.',
    sections: [
      {
        heading: 'İstanbul Esnafına Özel Hızlı Kurulum',
        body: 'Kadıköy’den Bakırköy’e, Nişantaşı’ndan Ümraniye’ye kadar tek veya çok koltuklu tüm salonlar donanım almadan telefon üzerinden çalışır.',
        bullets: [
          'Google Haritalar profilinize /r/dukkan-adiniz randevu linkinizi bağlayın',
          'Trafik kaynaklı gecikmelerde tek tuşla WhatsApp durum bilgilendirmesi yapın',
          'Gün sonu usta-kalfa hakedişini akşam 30 saniyede kapatın',
        ],
      },
    ],
    faq: [
      { q: 'İstanbul’daki çok şubeli veya çok koltuklu salonlar kullanabilir mi?', a: 'Evet, her usta ve koltuk için ayrı takvim ve prim oranı tanımlanabilir.' },
    ],
    ctaHref: '/berber',
    ctaLabel: 'Berber Randevu Sistemini İncele',
  },
  {
    slug: 'ankara-berber-kuafor',
    noindex: true,
    title: 'Ankara Berber & Kuaför Randevu ve Koltuk Yönetim Sistemi',
    seoTitle: 'Ankara Berber ve Kuaför Randevu Programı | Dükkanım Yanımda',
    description: 'Çankaya, Kızılay, Keçiören, Yenimahalle ve tüm Ankara berber/kuaför işletmeleri için online randevu, veresiye ve kasa takip programı.',
    category: 'Yerel Esnaf Rehberi',
    readTime: '3 dk okuma',
    updatedAt: '2026-11-14',
    h1: 'Ankara Berber & Kuaförler İçin Dijital Randevu ve Salon Defteri',
    lead: 'Çankaya’dan Etimesgut’a kadar Ankara’daki berber ve kuaför salonları için özel saat bloklama, personel prim takibi ve WhatsApp hatırlatma tek platformda.',
    sections: [
      {
        heading: 'Memur ve Öğrenci Yoğun Saatlerini Verimli Planlayın',
        body: 'Öğle arası ve akşam çıkışı yoğunluğunda çakışan randevuları engelleyip ölü saatlere özel indirim duyurusu yapabilirsiniz.',
        bullets: [
          'İşlem süresine göre otomatik slot planlama (saç 30 dk, boya 90 dk)',
          'Düzenli gelen müşteriler için 10’lu dijital sadakat kartı',
          'Kredi kartsız ücretsiz başlangıç',
        ],
      },
    ],
    faq: [
      { q: 'Ankara’daki esnaflar için yerinde kurulum gerekiyor mu?', a: 'Hayır, bulut tabanlı olduğu için 2 dakikada telefonunuzdan aktif edersiniz.' },
    ],
    ctaHref: '/berber',
    ctaLabel: 'Berber Sistemini İncele',
  },
  {
    slug: 'izmir-kafe-restoran',
    noindex: true,
    title: 'İzmir Kafe & Restoran QR Menü ve Adisyon Sistemi',
    seoTitle: 'İzmir Kafe ve Restoran Adisyon & QR Menü Programı | Dükkanım Yanımda',
    description: 'Alsancak, Bostanlı, Bornova ve Çeşme kafeleri için canlı masa takibi, temassız QR menü, garson çağırma ve komisyonsuz adisyon yazılımı.',
    category: 'Yerel Esnaf Rehberi',
    readTime: '3 dk okuma',
    updatedAt: '2026-11-14',
    h1: 'İzmir Kafe & Restoranları İçin QR Menü ve Masa Adisyon Sistemi',
    lead: 'Alsancak ve Bostanlı gibi yoğun masa sirkülasyonu olan bölgelerde müşterilerinizin karekod okutup sipariş vermesini ve hesap istemesini hızlandırın.',
    sections: [
      {
        heading: 'Sahil ve Bahçe Masalarında Garson Beklemeye Son',
        body: 'Dükkan logosuyla markalanmış masa QR standları sayesinde müşteriler menüyü görüntüler, sepetten sipariş gönderir ve tek tıkla garson çağırır.',
        bullets: [
          'Bahçe, teras ve salon bölgelerine göre sınırsız masa yerleşimi',
          'Mutfak/kasa ekranına anında sesli bildirimle düşen QR siparişleri',
          'Gün sonu nakit, kredi kartı ve açık adisyon raporu',
        ],
      },
    ],
    faq: [
      { q: 'Sezonluk mekanlarda dondurma veya iptal var mı?', a: 'Taahhüt yoktur; istediğiniz ay paketinizi değiştirebilir veya iptal edebilirsiniz.' },
    ],
    ctaHref: '/kafe-restoran',
    ctaLabel: 'QR Menü & Adisyon Sistemini İncele',
  },
  {
    slug: 'izmit-berber-kuafor-randevu',
    title: 'İzmit & Kocaeli Berber ve Kuaför Online Randevu Rehberi',
    seoTitle: 'İzmit Berber ve Kuaför Randevu Sistemi | Kocaeli Online Randevu',
    description: 'İzmit, Gebze, Körfez ve Kocaeli genelindeki berber ile kuaför salonları için online randevu, koltuk sırası ve usta prim takip yazılımı. Sıra beklemeden randevu alın.',
    category: 'Kocaeli Yerel Rehber',
    readTime: '4 dk okuma',
    updatedAt: '2026-11-16',
    h1: 'İzmit ve Kocaeli Berber & Kuaför Salonları İçin Online Randevu',
    lead: 'İzmit Fethiye Caddesi, Yürüyüş Yolu, Yahya Kaptan, Bekirdere ve Gebze esnafı için telefon trafiğini sıfırlayan, sıra bekletmeyen 7/24 online berber randevu sistemi.',
    sections: [
      {
        heading: 'İzmit Berberlerinde Sıra Bekleme Sorununa Son',
        body: 'Cumartesi ve pazar günleri İzmit çarşısındaki berberlerde saatlerce sıra beklemek yerine, müşterileriniz cep telefonlarından 15 saniyede usta, saç kesimi veya sakal tıraşı hizmetini ve boş saati seçerek randevu alır.',
        bullets: [
          'İzmit berber randevusu: Müşterileriniz dükkana özel linkinizden (r/dukkan-adiniz) anında randevu oluşturur',
          'Kocaeli berber randevu sistemi: Randevu saati yaklaştığında otomatik WhatsApp teyit mesajı gider',
          'Usta ve çırak prim hesabı akşam kasa kapanışında tek ekranda hazır olur',
        ],
      },
      {
        heading: 'İzmit ve Gebze Esnafı İçin 2 Dakikada Kurulum',
        body: 'Pahalı randevu yazılımları veya randevu başına %20 komisyon kesen platformlar yerine, Dükkanım Yanımda ile kendi markanızı koruyun ve komisyonsuz (%0) online randevu toplayın.',
        bullets: [
          'Google Haritalar ve Instagram bio linkinize randevu linkinizi ekleyin',
          'İzmit ve Kocaeli yerel aramalarda salonunuz Google sonuçlarında öne çıksın',
          'Randevu iptallerinde boşalan saat bekleme listesindeki müşteriye anında açılsın',
        ],
      },
    ],
    faq: [
      { q: 'İzmit berber randevusu almak için uygulama indirmek gerekir mi?', a: 'Hayır, müşterileriniz hiçbir uygulama indirmeden doğrudan tarayıcı üzerinden dükkanınızın linkine girerek saniyeler içinde randevu alır.' },
      { q: 'Kocaeli genelindeki salonlar için ekstra kurulum ücreti var mı?', a: 'Hayır, sistem bulut tabanlıdır ve Çırak paketi ile hemen ₺0 ücretle kullanmaya başlayabilirsiniz.' },
      { q: 'İzmit ve Gebze bölgesindeki birden fazla personeli olan salonlara uygun mu?', a: 'Evet, her usta ve koltuk için ayrı randevu takvimi ve prim oranı belirlenebilir.' },
    ],
    ctaHref: '/izmit-berber-randevu',
    ctaLabel: 'İzmit Berber Randevu Sistemini İncele',
  },
  {
    slug: 'zonguldak-berber-kuafor-randevu',
    title: 'Zonguldak & Kdz. Ereğli Berber Kuaför Online Randevu Sistemi',
    seoTitle: 'Zonguldak Berber ve Kuaför Randevu Programı | Kdz Ereğli Online Randevu',
    description: 'Zonguldak Gazipaşa, Soğuksu, Kozlu ve Karadeniz Ereğli berber ile kuaförleri için online randevu alma, koltuk takvimi ve WhatsApp hatırlatma rehberi.',
    category: 'Zonguldak Yerel Rehber',
    readTime: '4 dk okuma',
    updatedAt: '2026-11-16',
    h1: 'Zonguldak & Karadeniz Ereğli Berberleri İçin Online Randevu Çözümü',
    lead: 'Zonguldak Gazipaşa Caddesi, Kozlu, Çaycuma ve Kdz. Ereğli sahil bölgesindeki berber salonlarında koltukları tam kapasite dolduran komisyonsuz online randevu sistemi.',
    sections: [
      {
        heading: 'Zonguldak Berber Randevusu ile Telefon Aramalarını Azaltın',
        body: 'Tıraş yaparken telefon açıp deftere randevu yazmak hem usta için zor hem de müşteri için risklidir. Online rezervasyon linkiyle müşterileriniz 7/24 randevu oluşturur, siz sadece işinize odaklanırsınız.',
        bullets: [
          'Zonguldak berber online randevu: Boş saatleri müşteriniz görsün, çakışma yaşanmasın',
          'Kdz Ereğli kuaför randevu: Saç boyama, fön ve sakal bakımı için işlem süresi bazlı otomatik planlama',
          'Gelmeyen müşteri (no-show) önleme: Randevu öncesi nazik WhatsApp hatırlatma',
        ],
      },
      {
        heading: 'Zonguldak Esnafına Özel Kolay Kasa ve Defter',
        body: 'Sadece randevu değil; günlük kasa, veresiye defteri ve gün sonu z raporu hepsi tek mobil ekranda cebinizde.',
        bullets: [
          'Zonguldak ve Ereğli yerel aramalarında Google SERP görünürlüğü',
          'Kredi kartı bilgisi gerektirmeyen şeffaf esnaf paketleri',
          'Tüm cihazlarla uyumlu — telefon, tablet ve bilgisayarda çalışır',
        ],
      },
    ],
    faq: [
      { q: 'Zonguldak berber randevusu nasıl oluşturulur?', a: 'Dükkanınızın /r/dukkan-adiniz linkini WhatsApp durumunda veya Instagram profilinizde paylaşırsınız. Müşteriler tıkladığında müsait saatleri görerek randevusunu alır.' },
      { q: 'Kdz. Ereğli salonları da sistemi kullanabilir mi?', a: 'Evet, Kdz. Ereğli, Alaplı, Kozlu ve tüm Zonguldak ilçelerindeki salonlar 2 dakikada ücretsiz başlayabilir.' },
      { q: 'Randevu saatleri değiştirildiğinde müşteriye bilgi gider mi?', a: 'Evet, tek tıkla müşterinizin WhatsApp numarasına yeni randevu saati bildirimi gönderilir.' },
    ],
    ctaHref: '/zonguldak-berber-randevu',
    ctaLabel: 'Zonguldak Randevu Sistemini İncele',
  },
  {
    slug: 'kocaeli-esnaf-online-randevu',
    title: 'Kocaeli ve Gebze Berber Randevu Sistemi ve Esnaf Yazılımı',
    seoTitle: 'Kocaeli Berber Randevu Sistemi | Gebze ve Körfez Esnaf Yazılımı',
    description: 'Kocaeli, Gebze, Darıca, Gölcük ve Kartepe bölgesindeki kuaför ve berber esnafı için komisyonsuz online randevu ve dijital veresiye defteri.',
    category: 'Kocaeli Yerel Rehber',
    readTime: '3 dk okuma',
    updatedAt: '2026-11-16',
    h1: 'Kocaeli ve Gebze Berberleri İçin Dijitalleşme Adımları',
    lead: 'Kocaeli sanayi ve üniversite kenti dinamizmine uygun, genç ve müdavim müşterilerin 10 saniyede randevu alabildiği yeni nesil berber programı.',
    sections: [
      {
        heading: 'Kocaeli Genelinde Hızlı Büyüyen Esnaf Ağı',
        body: 'İzmit merkezden Gebze çarşıya, Başiskele’den Karamürsel’e kadar yüzlerce kuaför ve berber tek platformda randevu ve kasasını yönetiyor.',
        bullets: [
          'Kocaeli berber randevusu arayan yerel müşterileri doğrudan dükkanınıza çekin',
          'Müşteri sadakat kartı ile her 10 tıraşta 1 tıraş hediye kampanyası düzenleyin',
          'Gün sonu nakit, kredi kartı ve veresiye bakiyesini akşam 1 dakikada kapatın',
        ],
      },
    ],
    faq: [
      { q: 'Kocaeli esnafı için yerinde teknik destek gerekir mi?', a: 'Hayır, sistem doğrudan tarayıcı üzerinden çalıştığı için kuruluma ihtiyaç yoktur; anında kullanmaya başlarsınız.' },
    ],
    ctaHref: '/izmit-berber-randevu',
    ctaLabel: 'Kocaeli Randevu Panelini Gör',
  },
  {
    slug: 'instagram-biyografi-randevu-linki',
    title: 'Instagram Biyografi Randevu Linki Nasıl Alınır? (Berber & Kuaför)',
    seoTitle: 'Instagram Biyografi Randevu Linki Oluşturma | Dükkanım Yanımda',
    description: 'Berber, kuaför ve güzellik salonları için Instagram profiline ve hikayelere komisyonsuz (%0) online randevu linki ekleme rehberi. 2 dakikada linkinizi alın.',
    category: 'Sosyal Medya & Randevu',
    readTime: '3 dk okuma',
    updatedAt: '2026-11-16',
    h1: 'Instagram Biyografi Randevu Linki Oluşturma (Berber & Kuaför)',
    lead: 'Müşterilerinizin Instagram profilinizdeki "Randevu Al" linkine tıklayarak sıra beklemeden 15 saniyede usta, hizmet ve saat seçmesini sağlayın. DM trafiğine ve kaçan müşterilere son verin.',
    sections: [
      {
        heading: '1. Instagram Profiline Randevu Linki Ekleme Adımları',
        body: 'Dükkânım Yanımda üzerinde dükkanınızı açtığınızda size özel dukkanimyanimda.com.tr/r/dukkan-adiniz web adresi verilir. Bu adresi Instagram uygulamasında Profili Düzenle > Bağlantılar > Harici Bağlantı Ekle bölümüne yapıştırmanız yeterlidir.',
        bullets: [
          'Instagram biyografinize doğrudan tıklanabilir randevu bağlantısı ekleyin',
          'Hikayelerinize (Story) "Bağlantı" çıkartmasıyla tek dokunuşta randevu linki koyun',
          'Müşteri uygulama indirmeden tarayıcıda dükkanınızın logosu ve fiyatlarıyla randevu alsın',
        ],
      },
      {
        heading: '2. %0 Komisyon ile Müşterilerinizi Koruyun',
        body: 'Pazaryeri uygulamaları müşterinizi rakip kuaförlere de gösterir ve her randevudan %20 komisyon keser. Dükkânım Yanımda linkiniz sadece sizin dükkanınızı açar ve randevulardan asla komisyon almaz.',
        bullets: [
          'Randevu başına sıfır komisyon — kazancınızın %100’ü kasanızda',
          'Otomatik WhatsApp teyit mesajıyla son dakika iptallerini önleyin',
          'Akşam usta ve çırak primleri tek tıkla hesaplansın',
        ],
      },
    ],
    faq: [
      { q: 'Instagram’a randevu linki eklemek için ücret öder miyim?', a: 'Hayır, Çırak paketi ile tamamen ücretsizdir. Linkinizi hemen oluşturup profilinize ekleyebilirsiniz.' },
      { q: 'Müşterinin randevu alması için uygulama indirmesi gerekir mi?', a: 'Hayır, Instagram içindeki tarayıcıda doğrudan açılır; müşteri hiçbir şey yüklemeden randevu alır.' },
      { q: 'Randevu alındığında bana bildirim nasıl gelir?', a: 'Panelinizde canlı uyarı sesi çalar ve WhatsApp üzerinden randevu detayı size anında iletilir.' },
    ],
    ctaHref: '/randevu-sistemi',
    ctaLabel: 'Ücretsiz Instagram Randevu Linkini Al',
  },
  {
    slug: 'pazar-gunu-acik-berber-randevu',
    title: 'Pazar Günü Açık Berber ve Nöbetçi Kuaför Randevu Sistemi',
    seoTitle: 'Pazar Günü Açık Berber Randevu Sistemi | Nöbetçi Kuaförler',
    description: 'Pazar günleri açık olan veya nöbetçi berber ve kuaförler için online randevu, çalışma saatleri planlaması ve boş koltukları doldurma rehberi.',
    category: 'Esnaf Çalışma Saatleri',
    readTime: '3 dk okuma',
    updatedAt: '2026-11-16',
    h1: 'Pazar Günü Açık Berberler İçin Online Randevu Yönetimi',
    lead: 'Hafta içi yoğun çalışan müşterilerin en çok aradığı "Pazar günü açık berber" sorgularında öne çıkın; pazar günleri dükkan önünde yığılma olmadan randevulu ve düzenli çalışın.',
    sections: [
      {
        heading: 'Pazar Günleri Kapı Önündeki Sıra Kargaşasına Son Verin',
        body: 'Pazar günleri açık olan berberlerde genellikle aşırı yoğunluk oluşur. Online randevu takvimi sayesinde müşterileriniz hangi saatin boş olduğunu önceden görür, koltuklar düzenli dolar ve kimse kapıda 1 saat beklemez.',
        bullets: [
          'Pazar gününe özel açılış ve kapanış saatleri tanımlayın',
          'Dolu saatler takvimde otomatik kapansın, çakışma yaşanmasın',
          'WhatsApp hatırlatması ile müşteriniz randevu saatinde dükkanda olsun',
        ],
      },
    ],
    faq: [
      { q: 'Pazar günü çalışma saatleri diğer günlerden farklı ayarlanabilir mi?', a: 'Evet, panelinizdeki Çalışma Saatleri ayarından Pazar gününü açık işaretleyip özel saat aralığı (örneğin 10:00 - 19:00) belirleyebilirsiniz.' },
      { q: 'Pazar günü açık berber aramalarında Google’da nasıl öne çıkarım?', a: 'Dükkânım Yanımda profilinizdeki dinamik openingHoursSpecification şeması Google Haritalar’a pazar günleri açık olduğunuzu otomatik bildirir.' },
    ],
    ctaHref: '/berber',
    ctaLabel: 'Berber Randevu Panelini Gör',
  },
];

export function isValidGuideRoute(pathname: string): boolean {
  const clean = (pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
  if (clean === '/rehber') return true;
  return SEO_GUIDE_ARTICLES.some((a) => `/rehber/${a.slug}` === clean);
}

const DEFAULT_HOST = 'dukkanimyanimda.com.tr';
const DEFAULT_ORIGIN = `https://${DEFAULT_HOST}`;

/**
 * Güncel yıl, ay ve mevsimsel esnaf yoğunluğu bağlamını dinamik üretir (Google Freshness).
 */
export function getDynamicSeoFreshness(customDate?: Date) {
  const d = customDate || new Date();
  const year = d.getFullYear();
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  const month = monthNames[d.getMonth()];
  const monthNum = d.getMonth() + 1;

  let season = 'Yeni Sezon';
  let seasonalKeyword = 'Yoğun Randevu ve Koltuk Sezonu';

  if (monthNum >= 3 && monthNum <= 5) {
    season = 'İlkbahar Düğün & Nişan Sezonu';
    seasonalKeyword = 'Gelin Başı ve Damat Tıraşı Randevu Yoğunluğu';
  } else if (monthNum >= 6 && monthNum <= 8) {
    season = 'Yaz & Mezuniyet Sezonu';
    seasonalKeyword = 'Yaz Bakımı ve Tatil Öncesi Randevu Akışı';
  } else if (monthNum >= 9 && monthNum <= 11) {
    season = 'Sonbahar & Kış Hazırlığı';
    seasonalKeyword = 'Okul & İş Sezonu Düzenli Bakım Randevuları';
  } else {
    season = 'Yılbaşı & Kış Sezonu';
    seasonalKeyword = 'Yılbaşı Yoğunluğu ve Yeni Yıl Fiyat Tarifesi';
  }

  const todayIso = d.toISOString().split('T')[0];
  return { year, month, season, seasonalKeyword, todayIso };
}

/**
 * Identifier (slug, telefon veya accountId) ile dükkanı accounts ve shopState'den bulur.
 */
export function findShopForSeo(identifier: string, _mode?: 'barber' | 'menu'): ResolvedShop | null {
  const rawId = (identifier || '').toLowerCase().trim();
  if (!rawId || rawId === 'demo') return null;

  const accounts = getAccounts();

  // 1. Öncelik: Hesap ID veya telefon eşleşmesi (kapalı/demo hesaplar hariç)
  let targetAcc = accounts.find(
    (a) =>
      a.id !== DEMO_ACCOUNT_ID &&
      !isAccountClosed(a) &&
      (a.id.toLowerCase() === rawId || a.phone === rawId)
  );

  let targetState = targetAcc ? loadShopState(targetAcc.id) : null;

  // 2. Öncelik: State içindeki benzersiz slug eşleşmesi
  if (!targetState) {
    for (const a of accounts) {
      if (a.id === DEMO_ACCOUNT_ID || isAccountClosed(a)) continue;
      const st = loadShopState(a.id);
      const profileSlug = (st.shopProfile?.slug || '').toLowerCase();
      if (profileSlug && profileSlug === rawId) {
        targetAcc = a;
        targetState = st;
        break;
      }
    }
  }

  // 3. Yedek: Dükkan adından türetilen slugify eşleşmesi
  if (!targetState) {
    for (const a of accounts) {
      if (a.id === DEMO_ACCOUNT_ID || isAccountClosed(a)) continue;
      const st = loadShopState(a.id);
      const shopSlug = st.shopProfile?.slug || slugify(st.shopProfile?.storeName || a.shopName);
      if (shopSlug === rawId) {
        targetAcc = a;
        targetState = st;
        break;
      }
    }
  }

  if (!targetAcc || !targetState) {
    return null;
  }

  const storeName = targetState?.shopProfile?.storeName || targetAcc?.shopName || 'İşletme';
  const computedSlug = targetState?.shopProfile?.slug || slugify(storeName) || rawId;

  const rawServices = Array.isArray(targetState?.barberServices) ? targetState.barberServices : [];

  const services = rawServices.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    durationMinutes: s.durationMinutes,
  }));

  const rawMenuItems = Array.isArray((targetState as any)?.menuItems) ? (targetState as any).menuItems : [];

  const menuItems = rawMenuItems.map((m: any) => ({
    id: m.id,
    name: m.name,
    price: m.price,
    category: m.category || 'Genel',
    description: m.description,
    imageUrl: m.imageUrl,
  }));

  const rawReviews = Array.isArray(targetState?.barberReviews) ? targetState.barberReviews : [];

  const reviews = rawReviews
    .filter((r) => r.approved !== false && typeof r.rating === 'number' && r.comment)
    .map((r) => ({
      id: r.id,
      customerName: r.customerName,
      staffName: r.staffName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

  const logoUrl = targetState?.shopProfile?.logoUrl;

  return {
    name: storeName,
    slug: computedSlug,
    phone: targetState?.shopProfile?.phone || targetAcc?.phone,
    cityDistrict: targetState?.shopProfile?.cityDistrict,
    slogan: targetState?.shopProfile?.slogan,
    businessField: targetState?.shopProfile?.businessField,
    sectorKey: targetState?.shopProfile?.sectorKey,
    isVip: targetState?.shopProfile?.isVip || false,
    exists: true,
    openingTime: targetState?.barberSettings?.openingTime || '09:00',
    closingTime: targetState?.barberSettings?.closingTime || '21:00',
    closedDays: targetState?.barberSettings?.closedDays || [0],
    services,
    menuItems,
    reviews,
    logoUrl,
  };
}

export interface SeoMapShop {
  id: string;
  name: string;
  slug: string;
  type: string;
  sectorName: string;
  cityDistrict: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  phone?: string;
  url: string;
  badge?: string;
}

/**
 * Haritada listelenecek onaylı ve açık gerçek esnaf işletmelerini döner.
 * Google Haritalar & Yerel SEO (LocalBusiness / Place GeoCoordinates) için ana sayfada zenginleştirilir.
 */
export function getFeaturedMapShops(origin: string = DEFAULT_ORIGIN): SeoMapShop[] {
  const realShops: SeoMapShop[] = [];

  try {
    const accounts = getAccounts();
    for (const acc of accounts) {
      if ((acc.role || 'owner') !== 'owner') continue;
      if (acc.id === DEMO_ACCOUNT_ID || isAccountClosed(acc)) continue;
      if (isExcludedAccount(acc)) continue;

      const st = loadShopState(acc.id);
      if (st.shopProfile?.showOnPublicMap === false) continue;

      const storeName = st.shopProfile?.storeName || acc.shopName;
      if (!storeName || storeName.trim().length < 2) continue;

      const cityDistrict = st.shopProfile?.cityDistrict || 'İstanbul';
      const sectorKey = st.shopProfile?.sectorKey || 'diger';
      const slug = st.shopProfile?.slug || slugify(storeName);

      let type = 'LocalBusiness';
      let sectorName = 'Esnaf & İşletme';
      let url = `${origin}/r/${slug}`;

      if (sectorKey.includes('berber') || sectorKey.includes('kuafor')) {
        type = 'HairSalon';
        sectorName = 'Kuaför & Berber';
      } else if (sectorKey.includes('guzellik')) {
        type = 'BeautySalon';
        sectorName = 'Güzellik Salonu';
      } else if (sectorKey.includes('kafe') || sectorKey.includes('restoran')) {
        type = 'Restaurant';
        sectorName = 'Kafe & Restoran';
        url = `${origin}/m/${slug}`;
      }

      realShops.push({
        id: acc.id,
        name: storeName,
        slug,
        type,
        sectorName,
        cityDistrict,
        city: cityDistrict.split(/[\/,]/)[0]?.trim() || 'İstanbul',
        district: cityDistrict.split(/[\/,]/)[1]?.trim() || '',
        latitude: st.shopProfile?.coordinates?.lat ?? (41.0082 + (Math.sin(acc.id.length) * 0.05)),
        longitude: st.shopProfile?.coordinates?.lng ?? (28.9784 + (Math.cos(acc.id.length) * 0.05)),
        phone: st.shopProfile?.phone || acc.phone,
        url,
        badge: 'Aktif Esnaf',
      });
    }
  } catch {
    // accounts yüklenemezse boş dizi döner
  }

  return realShops;
}

const RESERVED_BARBER_PATH_PREFIXES = new Set([
  'api',
  'admin',
  'assets',
  'rehber',
  'blog',
  'og',
  'media',
  'r',
  'm',
  't',
  'bakim',
]);

export function extractBarberSlugFromPath(cleanPath: string): { slug: string; isCleanFormat: boolean } | null {
  const clean = (cleanPath || '').toLowerCase().replace(/\/+$/, '') || '/';
  const safeDecode = (val: string) => {
    try {
      return decodeURIComponent(val);
    } catch {
      return val;
    }
  };
  if (clean.startsWith('/r/') || clean.startsWith('/randevu/')) {
    const slug = clean.replace(/^\/(r|randevu)\/?/, '').split('/')[0];
    return slug ? { slug: safeDecode(slug), isCleanFormat: false } : null;
  }
  const m = clean.match(/^\/([^/]+)\/randevu$/i);
  if (m && !RESERVED_BARBER_PATH_PREFIXES.has(m[1].toLowerCase())) {
    return { slug: safeDecode(m[1]), isCleanFormat: true };
  }
  return null;
}

function buildSoftwareOffersSchema() {
  return {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '499',
    priceCurrency: 'TRY',
    offerCount: 3,
    offers: [
      { '@type': 'Offer', name: 'Çırak Paketi', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
      { '@type': 'Offer', name: 'Usta Paketi', price: '249', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
      { '@type': 'Offer', name: 'Patron VIP', price: '499', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
    ],
  };
}

/**
 * Verilen rota ve host bilgisine göre en zengin SEO ve Open Graph başlıklarını üretir.
 */
export function getSeoMetadata(pathname: string, rawHost?: string): SeoMetadata {
  const host = rawHost && !rawHost.includes('localhost') && !rawHost.includes('127.0.0.1')
    ? rawHost
    : DEFAULT_HOST;
  const origin = `https://${host}`;

  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const fresh = getDynamicSeoFreshness();

  // 1. Randevu rotaları: /r/:slug, /randevu/:slug veya /:slug/randevu
  const barberPath = extractBarberSlugFromPath(clean);
  if (barberPath) {
    const shop = findShopForSeo(barberPath.slug, 'barber');
    if (shop) {
      const title = `${shop.name} - Online Randevu Al | Dükkanım Yanımda`;
      const ogTitle = `${shop.name} - Kolay Online Randevu`;
      const description = `${shop.name} için sıra beklemeden online randevunuzu hemen oluşturun. Güncel hizmetler, müsait saatler ve anında onay.`;
      const ogDescription = `${shop.name} için sıra beklemeden online randevunuzu hemen oluşturun.`;
      const canonical = barberPath.isCleanFormat
        ? `${origin}/${shop.slug}/randevu`
        : `${origin}/r/${shop.slug}`;
      const shopLogo = shop.logoUrl
        ? (shop.logoUrl.startsWith('http') ? shop.logoUrl : `${origin}${shop.logoUrl}`)
        : `${origin}/og/randevu-sistemi.png`;
      const ogImage = shopLogo;

      // Sektöre göre dinamik Schema.org LocalBusiness tipi (HairSalon veya BeautySalon)
      const sector = (shop.sectorKey || '').toLowerCase();
      const field = (shop.businessField || '').toLowerCase();
      let primaryType = 'HairSalon';
      if (sector.includes('berber') || sector.includes('kuafor')) {
        primaryType = 'HairSalon';
      } else if (sector.includes('guzellik') || field.includes('güzellik')) {
        primaryType = 'BeautySalon';
      } else if (field.includes('berber') || field.includes('kuaför')) {
        primaryType = 'HairSalon';
      }

      // Dinamik çalışma saatleri (shop.closedDays bazlı)
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const closedSet = new Set(shop.closedDays ?? [0]);
      const openDayNames = dayNames.filter((_, idx) => !closedSet.has(idx));

      // Berber / Kuaför Hizmet ve Fiyat Listesi (hasOfferCatalog)
      const offerCatalog = (shop.services && shop.services.length > 0) ? {
        '@type': 'OfferCatalog',
        name: `${shop.name} Hizmet ve Fiyat Tarifesi`,
        itemListElement: shop.services.map((svc) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: svc.name,
            description: svc.durationMinutes ? `${svc.durationMinutes} dakika profesyonel hizmet` : undefined,
          },
          price: svc.price,
          priceCurrency: 'TRY',
        })),
      } : undefined;

      // Google Rezervasyon Aksiyonu (ReserveAction)
      const potentialAction = {
        '@type': 'ReserveAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: canonical,
          inLanguage: 'tr-TR',
          actionPlatform: [
            'http://schema.org/DesktopWebPlatform',
            'http://schema.org/MobileWebPlatform',
            'http://schema.org/IOSPlatform',
            'http://schema.org/AndroidPlatform',
          ],
        },
        result: {
          '@type': 'Reservation',
          name: `${shop.name} Online Randevu`,
        },
      };

      const shopReviews = shop.reviews && shop.reviews.length > 0 ? shop.reviews : [];
      const reviewSchemaBlock = shopReviews.length > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: (
                shopReviews.reduce((acc, r) => acc + Math.max(1, Math.min(5, r.rating || 5)), 0) /
                shopReviews.length
              ).toFixed(1),
              reviewCount: shopReviews.length,
              bestRating: '5',
              worstRating: '1',
            },
            review: shopReviews.map((r) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.customerName },
              datePublished: (r.createdAt || fresh.todayIso).split('T')[0],
              reviewBody: r.comment,
              reviewRating: {
                '@type': 'Rating',
                ratingValue: Math.max(1, Math.min(5, r.rating || 5)),
                bestRating: 5,
                worstRating: 1,
              },
            })),
          }
        : {};

      const schemaJson = {
        '@context': 'https://schema.org',
        '@type': [primaryType, 'HealthAndBeautyBusiness'],
        name: shop.name,
        url: canonical,
        telephone: shop.phone || undefined,
        description,
        image: shopLogo,
        logo: shopLogo,
        priceRange: '₺₺',
        currenciesAccepted: 'TRY',
        paymentAccepted: 'Nakit, Kredi Kartı',
        acceptsReservations: 'True',
        address: {
          '@type': 'PostalAddress',
          addressLocality: shop.cityDistrict || 'Türkiye',
          addressCountry: 'TR',
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: openDayNames.length > 0 ? openDayNames : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: shop.openingTime || '09:00',
            closes: shop.closingTime || '21:00',
          },
        ],
        ...(offerCatalog ? { hasOfferCatalog: offerCatalog } : {}),
        ...reviewSchemaBlock,
        potentialAction,
      };

      const breadcrumbs = [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Online Randevu', url: `${origin}/berber` },
        { name: shop.name, url: canonical },
      ];

      return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs };
    }

    return {
      title: 'Online Randevu Sistemi | Dükkanım Yanımda',
      ogTitle: 'Online Randevu Sistemi — Dükkanım Yanımda',
      description: 'Berber, kuaför ve güzellik salonları için kolay online randevu ve dükkan yönetim sistemi.',
      ogDescription: 'Sıra beklemeden online randevu alın.',
      ogImage: `${origin}/og/randevu-sistemi.png`,
      canonical: `${origin}/randevu-sistemi`,
      robots: 'noindex, follow',
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Online Randevu', url: `${origin}/randevu-sistemi` },
      ],
    };
  }

  // 2. QR Menü rotaları: /m/:slug veya /menu/:slug veya /menu
  if (clean.startsWith('/m/') || clean.startsWith('/menu/') || clean === '/menu') {
    const slug = clean === '/menu' ? '' : clean.replace(/^\/(m|menu)\/?/, '');
    const shop = findShopForSeo(slug, 'menu');
    if (shop) {
      const title = `${shop.name} - Dijital QR Menü & Fiyatlar | Dükkanım Yanımda`;
      const ogTitle = `${shop.name} - Dijital Menü`;
      const description = `${shop.name} güncel menü, fiyat listesi ve temassız garson çağırma. Canlı QR menü ile hızlı ve temassız sipariş verin.`;
      const ogDescription = 'Güncel menü, fiyatlar ve masadan garson çağırma.';
      const canonical = `${origin}/m/${shop.slug}`;
      const shopLogo = shop.logoUrl
        ? (shop.logoUrl.startsWith('http') ? shop.logoUrl : `${origin}${shop.logoUrl}`)
        : `${origin}/og/qr-menu.png`;
      const ogImage = shopLogo;

      // Dinamik çalışma saatleri (shop.closedDays bazlı)
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const closedSet = new Set(shop.closedDays ?? [0]);
      const openDayNames = dayNames.filter((_, idx) => !closedSet.has(idx));

      // Kategorilere göre menü kalemlerini grupla (Schema.org Restaurant hasMenu)
      const categoriesMap = new Map<string, typeof shop.menuItems>();
      for (const item of (shop.menuItems || [])) {
        const cat = item.category || 'Öne Çıkanlar';
        if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
        categoriesMap.get(cat)!.push(item);
      }

      const menuSections = Array.from(categoriesMap.entries()).map(([catName, items]) => ({
        '@type': 'MenuSection',
        name: catName,
        hasMenuItem: (items || []).map((it) => ({
          '@type': 'MenuItem',
          name: it.name,
          description: it.description || undefined,
          image: it.imageUrl ? (it.imageUrl.startsWith('http') ? it.imageUrl : `${origin}${it.imageUrl}`) : undefined,
          offers: {
            '@type': 'Offer',
            price: it.price,
            priceCurrency: 'TRY',
            availability: 'https://schema.org/InStock',
          },
        })),
      }));

      const hasMenuSchema = menuSections.length > 0 ? {
        '@type': 'Menu',
        name: `${shop.name} Dijital QR Menü`,
        url: canonical,
        hasMenuSection: menuSections,
      } : canonical;

      const schemaJson = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: shop.name,
        url: canonical,
        telephone: shop.phone || undefined,
        hasMenu: hasMenuSchema,
        servesCuisine: shop.businessField || 'Kafe & Restoran',
        description,
        image: shopLogo,
        logo: shopLogo,
        priceRange: '₺₺',
        currenciesAccepted: 'TRY',
        paymentAccepted: 'Nakit, Kredi Kartı',
        acceptsReservations: 'True',
        address: {
          '@type': 'PostalAddress',
          addressLocality: shop.cityDistrict || 'Türkiye',
          addressCountry: 'TR',
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: openDayNames.length > 0 ? openDayNames : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: shop.openingTime || '09:00',
            closes: shop.closingTime || '22:00',
          },
        ],
      };

      const breadcrumbs = [
        { name: 'Ana Sayfa', url: origin },
        { name: 'QR Menü', url: `${origin}/kafe-restoran` },
        { name: shop.name, url: canonical },
      ];

      return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs };
    }

    return {
      title: 'Canlı Dijital QR Menü & Fiyatlar | Dükkanım Yanımda',
      ogTitle: 'Dijital QR Menü & Garson Çağırma',
      description: 'Kafe ve restoranlar için anlık fiyat güncellemeli, temassız garson çağırmalı canlı dijital QR menü.',
      ogDescription: 'Güncel menü, fiyatlar ve masadan garson çağırma.',
      ogImage: `${origin}/og/qr-menu.png`,
      canonical: `${origin}/kafe-restoran`,
      robots: 'noindex, follow',
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'QR Menü', url: `${origin}/kafe-restoran` },
      ],
    };
  }

  // 3. Berber Açılış Sayfası (Kopya Sayfa İzolasyonu)
  if (
    clean === '/berber' ||
    clean === '/berber-randevu-programi' ||
    clean === '/berber-randevu' ||
    clean === '/erkek-kuafor'
  ) {
    const canonical = `${origin}/berber`;
    const title = `Berber Randevu & Koltuk Yönetim Sistemi (${fresh.year}) | Dükkanım Yanımda`;
    const ogTitle = `Berber Randevu ve Koltuk Takip Sistemi (${fresh.year})`;
    const description = `Koltuk sırası, online randevu takvimi, çırak/usta prim hesabı ve anlık kasa takibi tek ekranda. ${fresh.month} ${fresh.year} güncel sürüm. ${fresh.seasonalKeyword} için hazır. Berber esnafı için 2 dakikada hazır.`;
    const ogDescription = 'Koltuk sırası, online randevu takvimi, çırak/usta prim hesabı ve anlık kasa takibi tek ekranda.';
    const ogImage = `${origin}/og/berber.png`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Dükkanım Yanımda - Berber Randevu Sistemi',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: buildSoftwareOffersSchema(),
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '1480',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Koltuk Sırası & Randevu Takvimi',
        'Usta ve Çırak Prim Dağılımı',
        'Canlı Online Müşteri Randevusu',
        'WhatsApp Otomatik Hatırlatma',
        'Hızlı Kasa & Veresiye Takibi',
      ],
    };

    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Berber Randevu Sistemi', url: canonical },
    ];

    const faqJson = SEO_LANDING_PAGES['/berber'].faq;

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs, faqJson };
  }

  // 4. Kuaför Salonu Açılış Sayfası (Kopya Sayfa İzolasyonu)
  if (
    clean === '/kuafor' ||
    clean === '/kuafor-randevu' ||
    clean === '/kadin-kuafor' ||
    clean === '/kuafor-programi'
  ) {
    const canonical = `${origin}/kuafor`;
    const title = `Kuaför Randevu ve Salon Takip Programı (${fresh.year}) | Dükkanım Yanımda`;
    const ogTitle = `Kuaför Randevu ve Salon Yönetim Programı (${fresh.year})`;
    const description = `Kadın ve erkek kuaförleri için saç renklendirme, kesim, bakım randevuları, personel primleri ve randevu çakışma önleme sistemi. ${fresh.month} ${fresh.year} güncel sürüm.`;
    const ogDescription = 'Kuaför salonları için randevu takvimi, personel primleri ve randevu çakışma önleme sistemi.';
    const ogImage = `${origin}/og/kuafor.png`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Dükkanım Yanımda - Kuaför Salon Yönetim Programı',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: buildSoftwareOffersSchema(),
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '1320',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Kuaför Randevu Takvimi',
        'Personel Prim ve Hakediş Dağılımı',
        'İşlem Süresi Bazlı Akıllı Planlama',
        'Online Instagram/WhatsApp Randevu Linki',
        'Gelin Başı ve Özel Gün Rezervasyonları',
      ],
    };

    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Kuaför Randevu Programı', url: canonical },
    ];

    const faqJson = SEO_LANDING_PAGES['/kuafor'].faq;

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs, faqJson };
  }

  // 4.1. İzmit & Kocaeli Yerel Berber ve Kuaför Randevu Açılış Sayfası
  if (
    clean === '/izmit-berber-randevu' ||
    clean === '/izmit-berber' ||
    clean === '/kocaeli-berber' ||
    clean === '/kocaeli-berber-randevu'
  ) {
    const canonical = `${origin}/izmit-berber-randevu`;
    const title = `İzmit Berber Randevu ve Kuaför Sistemi (${fresh.year}) | Kocaeli Online Randevu`;
    const ogTitle = `İzmit Berber Randevu ve Kocaeli Koltuk Yönetim Sistemi (${fresh.year})`;
    const description = `İzmit berber randevusu, Kocaeli berber ve kuaför salonları için online randevu alma ve koltuk takip programı. Fethiye Caddesi, Yahya Kaptan ve Gebze salonlarında sıra beklemeden 7/24 randevu al.`;
    const ogDescription = 'İzmit ve Kocaeli berberleri için sıra beklemeden 7/24 online randevu alma ve koltuk takibi.';
    const ogImage = `${origin}/og/izmit.png`;

    const areaServed = [
      { '@type': 'City', name: 'İzmit' },
      { '@type': 'AdministrativeArea', name: 'Kocaeli' },
      { '@type': 'City', name: 'Gebze' },
      { '@type': 'City', name: 'Körfez' },
      { '@type': 'City', name: 'Gölcük' },
    ];

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Dükkanım Yanımda — İzmit Berber & Kuaför Randevu Sistemi',
      description: 'İzmit ve Kocaeli bölgesindeki berber ve kuaförler için online randevu, koltuk sırası ve usta prim takip yazılımı.',
      url: canonical,
      image: ogImage,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'İzmit',
        addressRegion: 'Kocaeli',
        addressCountry: 'TR',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 40.7654,
        longitude: 29.9408,
      },
      areaServed,
      priceRange: '₺₺',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '520',
        bestRating: '5',
        worstRating: '1',
      },
    };

    const extraSchemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'İzmit & Kocaeli Online Berber Randevu Sistemi',
        serviceType: 'Online Berber ve Kuaför Randevu Yazılımı',
        provider: {
          '@type': 'Organization',
          name: 'Dükkanım Yanımda',
          url: `${origin}/`,
        },
        areaServed,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'TRY',
          availability: 'https://schema.org/InStock',
        },
      },
    ];

    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'İzmit Berber Randevu', url: canonical },
    ];

    const faqJson = SEO_LANDING_PAGES['/izmit-berber-randevu'].faq;

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, extraSchemas, breadcrumbs, faqJson };
  }

  // 4.2. Zonguldak & Kdz. Ereğli Yerel Berber ve Kuaför Randevu Açılış Sayfası
  if (
    clean === '/zonguldak-berber-randevu' ||
    clean === '/zonguldak-berber' ||
    clean === '/eregli-berber' ||
    clean === '/kdz-eregli-berber' ||
    clean === '/eregli-berber-randevu'
  ) {
    const canonical = `${origin}/zonguldak-berber-randevu`;
    const title = `Zonguldak Berber Randevu ve Kuaför Programı (${fresh.year}) | Kdz. Ereğli Online Randevu`;
    const ogTitle = `Zonguldak Berber Randevu ve Kdz Ereğli Kuaför Sistemi (${fresh.year})`;
    const description = `Zonguldak berber randevusu, Gazipaşa Caddesi ve Kdz. Ereğli kuaförleri için online randevu sistemi. Sıra beklemeden randevu al, usta ve hizmetini seç.`;
    const ogDescription = 'Zonguldak ve Kdz. Ereğli berberleri için sıra beklemeden online randevu alma.';
    const ogImage = `${origin}/og/zonguldak.png`;

    const areaServed = [
      { '@type': 'City', name: 'Zonguldak' },
      { '@type': 'City', name: 'Karadeniz Ereğli' },
      { '@type': 'City', name: 'Kozlu' },
      { '@type': 'City', name: 'Çaycuma' },
      { '@type': 'City', name: 'Kilimli' },
    ];

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Dükkanım Yanımda — Zonguldak & Kdz. Ereğli Berber Randevu Sistemi',
      description: 'Zonguldak Merkez, Gazipaşa ve Karadeniz Ereğli kuaför ve berberleri için 7/24 online randevu alma ve koltuk yönetimi.',
      url: canonical,
      image: ogImage,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Merkez',
        addressRegion: 'Zonguldak',
        addressCountry: 'TR',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 41.4564,
        longitude: 31.7987,
      },
      areaServed,
      priceRange: '₺₺',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '380',
        bestRating: '5',
        worstRating: '1',
      },
    };

    const extraSchemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Zonguldak & Kdz. Ereğli Online Berber Randevu Sistemi',
        serviceType: 'Online Berber ve Kuaför Randevu Yazılımı',
        provider: {
          '@type': 'Organization',
          name: 'Dükkanım Yanımda',
          url: `${origin}/`,
        },
        areaServed,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'TRY',
          availability: 'https://schema.org/InStock',
        },
      },
    ];

    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Zonguldak Berber Randevu', url: canonical },
    ];

    const faqJson = SEO_LANDING_PAGES['/zonguldak-berber-randevu'].faq;

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, extraSchemas, breadcrumbs, faqJson };
  }

  if (
    clean === '/guzellik-salonu' ||
    clean === '/guzellik-merkezi' ||
    clean === '/guzellik' ||
    clean === '/lazer-epilasyon' ||
    clean === '/guzellik-salonu-programi'
  ) {
    const title = `Güzellik Salonu ve Merkez Yönetim Sistemi — Seans & Paket Takibi (${fresh.year}) | Dükkanım Yanımda`;
    const ogTitle = `Güzellik Salonu ve Seans Takip Sistemi (${fresh.year})`;
    const description = `Güzellik merkezleri için seans ve paket takibi, lazer epilasyon randevu defteri, estetisyen kabin planlaması ve otomatik WhatsApp hatırlatma. ${fresh.month} ${fresh.year} güncel sürüm. 2 dakikada ücretsiz başlayın.`;
    const ogDescription = 'Seans ve paket takibi, estetisyen randevu defteri, kabin planlaması ve WhatsApp hatırlatma tek ekranda.';
    const canonical = `${origin}/guzellik-salonu`;
    const ogImage = `${origin}/og/guzellik-salonu.png`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Dükkanım Yanımda - Güzellik Salonu ve Seans Takip Sistemi',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: buildSoftwareOffersSchema(),
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '980',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Seans ve Paket Sayacı (6-8 Seans)',
        'Estetisyen ve Kabin/Cihaz Takvimi',
        'Canlı Online Randevu Linki',
        'WhatsApp Otomatik Seans Hatırlatma',
        'Kasa & Personel Prim Hesabı',
      ],
    };

    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Güzellik Salonu ve Seans Takip', url: canonical },
    ];

    const faqJson = SEO_LANDING_PAGES['/guzellik-salonu'].faq;

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs, faqJson };
  }

  if (clean === '/randevu-sistemi' || clean === '/online-randevu' || clean === '/randevu-programi') {
    const canonical = `${origin}/randevu-sistemi`;
    const title = `7/24 Online Randevu ve Rezervasyon Sistemi (${fresh.year}) | Dükkanım Yanımda`;
    const ogTitle = `Canlı Online Randevu ve Müşteri Rezervasyon Motoru (${fresh.year})`;
    const description = `İşletmenize özel web linkiyle 7/24 online randevu toplama ve müşteri takip sistemi. Berber, kuaför ve güzellik salonları için ücretsiz. ${fresh.month} ${fresh.year} güncel.`;
    const ogDescription = 'İşletmenize özel web linkiyle sıra beklemeden 7/24 online randevu alma.';
    const ogImage = `${origin}/og/randevu-sistemi.png`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Dükkanım Yanımda - 7/24 Online Randevu Motoru',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: buildSoftwareOffersSchema(),
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '1540',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Kişiselleştirilmiş Randevu Linki (/r/:slug)',
        'WhatsApp Teyit ve Hatırlatma Entegrasyonu',
        'Müsait Saat ve Personel Seçimi',
        'Sıfır No-Show (Gelmeyen Müşteri) Önleme',
        'Mobil Uyumlu Hızlı Rezervasyon Ekranı',
      ],
    };

    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Online Randevu Sistemi', url: canonical },
    ];

    const faqJson = SEO_LANDING_PAGES['/randevu-sistemi'].faq;

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs, faqJson };
  }

  if (
    clean === '/qr-menu' ||
    clean === '/dijital-menu' ||
    clean === '/karekod-menu' ||
    clean === '/ucretsiz-qr-menu'
  ) {
    const canonical = `${origin}/qr-menu`;
    return {
      title: `Ücretsiz QR Menü Sistemi & Masadan Sipariş (${fresh.year}) | Dükkanım Yanımda`,
      ogTitle: `Ücretsiz QR Menü Sistemi & Masadan Sipariş (${fresh.year})`,
      description: 'Baskı maliyeti olmadan 2 dakikada ücretsiz dijital QR menü oluşturun. Anlık fiyat güncelleme, fotoğraflı kategori ve masadan garson çağırma tek panelde.',
      ogDescription: 'Baskı maliyeti olmadan 2 dakikada ücretsiz dijital QR menü ve masadan sipariş sistemi.',
      ogImage: `${origin}/og/qr-menu.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Ücretsiz QR Menü Sistemi', url: canonical },
      ],
      faqJson: SEO_LANDING_PAGES['/qr-menu'].faq,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Ücretsiz QR Menü Sistemi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: buildSoftwareOffersSchema(),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '910',
          bestRating: '5',
          worstRating: '1',
        },
        featureList: [
          'Masaya Özel Karekod (QR) Üretici',
          'Anlık Fiyat ve Stok Güncelleme',
          'Masadan Garson & Hesap Çağırma',
          'Doğrudan Adisyona Düşen Sipariş',
        ],
      },
    };
  }

  if (
    clean === '/kafe-restoran' ||
    clean === '/kafe' ||
    clean === '/restoran' ||
    clean === '/adisyon' ||
    clean === '/adisyon-programi'
  ) {
    const canonical = `${origin}/kafe-restoran`;
    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Kafe & Restoran Adisyon Sistemi', url: canonical },
    ];
    const faqJson = SEO_LANDING_PAGES['/kafe-restoran'].faq;

    return {
      title: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Sistemi',
      description: 'Canlı masa takibi, garson çağrı sistemli temassız QR menü, adisyon kapatma ve gün sonu ciro raporları. Kurulumsuz, hemen kullanın.',
      ogDescription: 'Canlı masa takibi, garson çağrı sistemli temassız QR menü, adisyon kapatma ve gün sonu ciro raporları.',
      ogImage: `${origin}/og/kafe-restoran.png`,
      canonical,
      breadcrumbs,
      faqJson,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Kafe & Restoran Adisyon Sistemi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: buildSoftwareOffersSchema(),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '870',
          bestRating: '5',
          worstRating: '1',
        },
      },
    };
  }

  if (
    clean === '/veresiye-defteri' ||
    clean === '/veresiye' ||
    clean === '/dijital-veresiye' ||
    clean === '/veresiye-programi'
  ) {
    const canonical = `${origin}/veresiye-defteri`;
    return {
      title: `Veresiye Defteri Uygulaması & Dijital Alacak Takibi (${fresh.year}) | Dükkanım Yanımda`,
      ogTitle: 'Veresiye Defteri Uygulaması & Dijital Alacak Takibi',
      description: 'Kağıt veresiye defterine son! Açılış bakiyesiyle 5 dakikada dijitale geçin, müşteri borçlarını tarih damgasıyla izleyin ve WhatsApp üzerinden tek tıkla hatırlatın.',
      ogDescription: 'Açılış bakiyesiyle dijitale geçin, WhatsApp tahsilat hatırlatmasıyla unutulan alacakları toplayın.',
      ogImage: `${origin}/og/veresiye-defteri.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Veresiye Defteri Uygulaması', url: canonical },
      ],
      faqJson: SEO_LANDING_PAGES['/veresiye-defteri'].faq,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Dijital Veresiye Defteri Uygulaması',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: buildSoftwareOffersSchema(),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '1240',
          bestRating: '5',
          worstRating: '1',
        },
        featureList: [
          'Açılış Bakiyesi ile 5 Dakikada Geçiş',
          'Tahsilat Turu ve Vade Önceliklendirme',
          'WhatsApp Tek Tıkla Borç Ekstresi',
          'Bulut Yedekli Cari Hesap Defteri',
        ],
      },
    };
  }

  if (
    clean === '/kasa-programi' ||
    clean === '/kasa-takibi' ||
    clean === '/esnaf-kasa'
  ) {
    const canonical = `${origin}/kasa-programi`;
    return {
      title: `Esnaf Kasa Takip Programı — Nakit, POS & Gider Yönetimi (${fresh.year}) | Dükkanım Yanımda`,
      ogTitle: 'Esnaf Kasa Takip Programı — Nakit, POS & Gider Yönetimi',
      description: 'Esnaf ve KOBİ’ler için nakit, kredi kartı POS, IBAN havale ve gün içi gider takibini tek ekranda birleştiren ücretsiz bulut tabanlı kasa takip programı.',
      ogDescription: 'Nakit, POS, havale ve gün içi giderlerinizi tek kasada kuruşu kuruşuna takip edin.',
      ogImage: `${origin}/og/kasa-programi.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Esnaf Kasa Programı', url: canonical },
      ],
      faqJson: SEO_LANDING_PAGES['/kasa-programi'].faq,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Esnaf Kasa Takip Programı',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: buildSoftwareOffersSchema(),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '1090',
          bestRating: '5',
          worstRating: '1',
        },
        featureList: [
          'Nakit, POS ve IBAN Kanal Ayrımı',
          'Gün İçi Masraf ve Toptancı Gider Takibi',
          'Açılış Avansı ve Net Kâr Hesabı',
          'Cepten Anlık Kasa Kontrolü',
        ],
      },
    };
  }

  if (
    clean === '/gun-sonu-raporu' ||
    clean === '/gun-sonu' ||
    clean === '/z-raporu'
  ) {
    const canonical = `${origin}/gun-sonu-raporu`;
    return {
      title: `Gün Sonu Raporu & Z Raporu Programı — 30 Saniyede Kasa Sayımı (${fresh.year}) | Dükkanım Yanımda`,
      ogTitle: 'Gün Sonu Raporu & Z Raporu Programı — 30 Saniyede Kasa Sayımı',
      description: 'Akşam kepenk indirirken nakit, POS, veresiye tahsilatı ve masraf mutabakatını 30 saniyede tamamlayan bulut tabanlı gün sonu raporu programı.',
      ogDescription: 'Akşam kepenk kapatırken 30 saniyede kasa sayımı, POS eşleştirme ve net kâr raporu.',
      ogImage: `${origin}/og/gun-sonu-raporu.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Gün Sonu Raporu Programı', url: canonical },
      ],
      faqJson: SEO_LANDING_PAGES['/gun-sonu-raporu'].faq,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Gün Sonu & Z Raporu Programı',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: buildSoftwareOffersSchema(),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '960',
          bestRating: '5',
          worstRating: '1',
        },
        featureList: [
          '30 Saniyede Akşam Kasa Kapatma',
          'Nakit, POS ve Veresiye Mutabakatı',
          'Silinmeyen Bulut Gün Sonu Arşivi',
          'Haftalık ve Aylık Kârlılık Analizi',
        ],
      },
    };
  }

  if (
    clean === '/bakkal' ||
    clean === '/market' ||
    clean === '/bakkal-market' ||
    clean === '/pos-sistemi' ||
    clean === '/barkod-pos'
  ) {
    const canonical = `${origin}/bakkal-market`;
    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Bakkal & Market POS Sistemi', url: canonical },
    ];
    const faqJson = SEO_LANDING_PAGES['/bakkal-market'].faq;

    return {
      title: 'Bakkal & Market Hızlı POS Barkodlu Terazi ve Veresiye Takip Sistemi | Dükkanım Yanımda',
      ogTitle: 'Bakkal & Market Hızlı POS ve Veresiye Takip Sistemi',
      description: 'Mahallenin veresiye defteri cebinde! Barkodlu hızlı satış, kritik stok uyarıları, WhatsApp ile tek tıkla borç hatırlatma.',
      ogDescription: 'Mahallenin veresiye defteri cebinde! Barkodlu hızlı satış, kritik stok ve WhatsApp hatırlatma.',
      ogImage: `${origin}/og/bakkal-market.png`,
      canonical,
      breadcrumbs,
      faqJson,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Bakkal & Market POS Sistemi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: buildSoftwareOffersSchema(),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '1120',
          bestRating: '5',
          worstRating: '1',
        },
      },
    };
  }

  if (clean === '/teknik-servis' || clean === '/servis') {
    const canonical = `${origin}/teknik-servis`;
    return {
      title: 'Teknik Servis Cihaz Takip ve Tamir Fişi Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Teknik Servis Cihaz ve Müşteri Takip Sistemi',
      description: 'Cihaz kabul fişi, parça ve işçilik maliyeti, teslimat takibi ve kasa yönetimi tek panelde. 2 dakikada ücretsiz başla.',
      ogDescription: 'Cihaz kabul fişi, parça ve işçilik maliyeti, teslimat takibi ve kasa yönetimi.',
      ogImage: `${origin}/og/teknik-servis.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Teknik Servis Takip Programı', url: canonical },
      ],
      faqJson: [
        {
          q: 'Teknik servis cihaz kabul fişi ve durum takibi nasıl yapılır?',
          a: 'Gelen her cihaza otomatik fiş numarası açılır. Arıza notu ve müşteri bilgisi kaydedilir; müşteri aradığında numaradan anında durumu görürsünüz.',
        },
        {
          q: 'Yedek parça ve işçilik maliyeti hesaplanıyor mu?',
          a: 'Evet, takılan ekran, batarya vb. parçaların maliyetini ve işçilik bedelini fişe işleyerek net kârınızı görebilirsiniz.',
        },
        {
          q: 'Cihaz hazır olduğunda müşteriye WhatsApp bildirimi gider mi?',
          a: 'Evet, teslim durumu "Hazır" olduğunda tek tıkla müşterinize cihazın hazır olduğunu belirten WhatsApp mesajı gönderebilirsiniz.',
        },
      ],
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Teknik Servis Takip Programı',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: buildSoftwareOffersSchema(),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '620',
          bestRating: '5',
          worstRating: '1',
        },
      },
    };
  }

  if (clean === '/hukuk' || clean === '/avukat') {
    const canonical = `${origin}/hukuk`;
    return {
      title: 'Avukat ve Hukuk Bürosu Dava Takip ve Masraf Yönetim Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Avukat & Hukuk Bürosu Dava ve Müvekkil Cari Takip Sistemi',
      description: 'Duruşma takvimi, dava dosyaları, müvekkil masraf ve avans takibi tek ekranda. 2 dakikada ücretsiz başla.',
      ogDescription: 'Duruşma takvimi, dava dosyaları, müvekkil masraf ve avans takibi tek ekranda.',
      ogImage: `${origin}/og/hukuk.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Avukat & Hukuk Bürosu Programı', url: canonical },
      ],
      faqJson: [
        {
          q: 'Dava dosyaları ve duruşma takvimi nasıl takip edilir?',
          a: 'Müvekkil, mahkeme ve duruşma tarihini dosyaya kaydedersiniz. Yaklaşan celseler takvimde gün gün listelenir.',
        },
        {
          q: 'Müvekkil avans ve masraf takibi nasıl yapılır?',
          a: 'Alınan vekalet ücreti, masraflar ve kalan bakiye müvekkil cari kartında kuruşu kuruşuna kayıt altında tutulur.',
        },
        {
          q: 'Müvekkil gizliliği ve veriler nasıl korunuyor?',
          a: 'Tüm bağlantı uçtan uca HTTPS ile şifrelenir; kayıtlarınıza yalnızca siz erişebilirsiniz.',
        },
      ],
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Avukat ve Hukuk Bürosu Programı',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: buildSoftwareOffersSchema(),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '450',
          bestRating: '5',
          worstRating: '1',
        },
      },
    };
  }

  if (clean === '/terzi') {
    const canonical = `${origin}/terzi`;
    return {
      title: 'Terzi & Kuru Temizleme Emanet Takip ve Kasa Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Terzi & Kuru Temizleme Emanet Takip Sistemi',
      description: 'Bırakılan kıyafet emanet fişleri, prova tarihleri ve anlık kasa yönetimi tek ekranda. 2 dakikada ücretsiz başla.',
      ogDescription: 'Bırakılan kıyafet emanet fişleri, prova tarihleri ve anlık kasa yönetimi.',
      ogImage: `${origin}/og/terzi.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Terzi Emanet ve Sipariş Takibi', url: canonical },
      ],
      faqJson: [
        {
          q: 'Kıyafet emanet fişi ve teslim takibi nasıl yapılır?',
          a: 'Tadilat veya dikim için bırakılan ürünün teslim tarihini ve ücretini fişe işlersiniz; geciken teslimler hemen listenin başında görünür.',
        },
        {
          q: 'Müşteri ölçüleri ve prova notları saklanır mı?',
          a: 'Evet, müşterinin beden ölçüleri kartına bir kez kaydedilir; her siparişte yeniden sormanıza gerek kalmaz.',
        },
        {
          q: 'Teslimatta ücret tahsilatı kasaya otomatik işlenir mi?',
          a: 'Evet, ürün teslim edildiğinde tek tuşla tahsilat yapılır ve gün sonu nakit/POS cirosuna anında eklenir.',
        },
      ],
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Terzi Emanet ve Sipariş Takibi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: buildSoftwareOffersSchema(),
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '380',
          bestRating: '5',
          worstRating: '1',
        },
      },
    };
  }

  // 3.5. Kamusal Servis & Emanet Durum Takip Ekranı (/t/:code ve /bakim/:code)
  if (clean.startsWith('/t/') || clean.startsWith('/bakim/')) {
    const isMaintenance = clean.startsWith('/bakim/');
    return {
      title: isMaintenance
        ? 'QR Makine & Cihaz Bakım Pasaportu | Dükkanım Yanımda'
        : 'Canlı Servis & Emanet Durum Takibi | Dükkanım Yanımda',
      ogTitle: isMaintenance
        ? 'Makine & Cihaz Periyodik Bakım Geçmişi — Dükkanım Yanımda'
        : 'Cihaz & Emanet Fişi Durum Sorgulama — Dükkanım Yanımda',
      description: isMaintenance
        ? 'Fabrika makineleri ve teknik servis cihazlarının son bakım tarihini, gelecek bakım takvimini görüntüleyin ve arıza bildirin.'
        : 'Teknik servis cihaz tamir durumu veya terzi emanet teslimat takibini fiş kodunuzla anlık görüntüleyin.',
      ogDescription: isMaintenance
        ? 'QR Makine & Cihaz Bakım Pasaportu.'
        : 'Servis ve emanet fişi canlı durum sorgulama.',
      ogImage: `${origin}/og/teknik-servis.png`,
      canonical: `${origin}${clean}`,
      robots: 'noindex, follow',
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Teknik Servis & Takip', url: `${origin}/teknik-servis` },
      ],
    };
  }

  // 3.6. Esnaf Rehberi & İçerik Kümeleri (/rehber ve /rehber/:slug)
  if (clean === '/rehber') {
    const canonical = `${origin}/rehber`;
    return {
      title: `Esnaf Rehberi, Prim Hesaplayıcı & Ücretsiz QR Araçları (${fresh.year}) | Dükkanım Yanımda`,
      ogTitle: 'Esnaf Rehberi ve Ücretsiz İşletme Araçları — Dükkanım Yanımda',
      description: 'Berber no-show önleme, kuaför prim hesaplayıcı, ücretsiz QR menü karekod oluşturucu, dijital veresiye geçişi ve şehir bazlı esnaf rehberleri.',
      ogDescription: 'Esnaf rehberleri, ücretsiz prim hesaplayıcı ve karekod oluşturucu.',
      ogImage: `${origin}/og/rehber.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Esnaf Rehberi', url: canonical },
      ],
      faqJson: [
        {
          q: 'Esnaf rehberindeki prim hesaplayıcı ve QR kod oluşturucu ücretsiz mi?',
          a: 'Evet, üye olmadan doğrudan tarayıcınızdan sınırsız şekilde kullanabilirsiniz.',
        },
        {
          q: 'Buradaki şablonları WhatsApp işletme hesabımda kullanabilir miyim?',
          a: 'Evet, tüm veresiye ve randevu hatırlatma şablonlarını tek tıkla kopyalayıp gönderebilirsiniz.',
        },
      ],
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Dükkânım Yanımda Esnaf Rehberi ve İçerik Kümeleri',
        numberOfItems: SEO_GUIDE_ARTICLES.filter((art) => !art.noindex).length,
        itemListElement: SEO_GUIDE_ARTICLES.filter((art) => !art.noindex).map((art, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: art.title,
          url: `${origin}/rehber/${art.slug}`,
        })),
      },
    };
  }

  if (clean.startsWith('/rehber/')) {
    const slug = clean.replace(/^\/rehber\//, '');
    const article = SEO_GUIDE_ARTICLES.find((a) => a.slug === slug);
    if (article) {
      const canonical = `${origin}/rehber/${article.slug}`;
      return {
        title: article.seoTitle,
        ogTitle: article.title,
        description: article.description,
        ogDescription: article.description,
        ogImage: `${origin}/og/rehber.png`,
        canonical,
        ...(article.noindex ? { robots: 'noindex, follow' } : {}),
        breadcrumbs: [
          { name: 'Ana Sayfa', url: origin },
          { name: 'Esnaf Rehberi', url: `${origin}/rehber` },
          { name: article.title, url: canonical },
        ],
        faqJson: article.faq,
        schemaJson: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.h1,
          description: article.description,
          image: `${origin}/og/rehber.png`,
          datePublished: article.updatedAt,
          dateModified: article.updatedAt,
          inLanguage: 'tr-TR',
          author: {
            '@type': 'Organization',
            name: 'Dükkanım Yanımda',
            url: `${origin}/`,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Dükkanım Yanımda',
            logo: {
              '@type': 'ImageObject',
              url: `${origin}/icon-512.png`,
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonical,
          },
        },
      };
    }
    return {
      title: 'Esnaf Rehberi | Dükkanım Yanımda',
      ogTitle: 'Esnaf Rehberi — Dükkanım Yanımda',
      description: 'Aradığınız rehber yazısı bulunamadı; tüm esnaf rehberlerini inceleyin.',
      ogDescription: 'Tüm esnaf rehberlerini ve ücretsiz araçları inceleyin.',
      ogImage: `${origin}/og/rehber.png`,
      canonical: `${origin}/rehber`,
      robots: 'noindex, follow',
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Esnaf Rehberi', url: `${origin}/rehber` },
      ],
    };
  }

  // 3.7. Esnaf Blogu (/blog ve /blog/:slug)
  if (clean === '/blog') {
    const canonical = `${origin}/blog`;
    return {
      title: 'Esnaf Blogu — Veresiye, Randevu, Kasa ve QR Menü Rehberleri | Dükkanım Yanımda',
      ogTitle: 'Esnaf Blogu — Veresiye, Randevu, Kasa ve QR Menü Rehberleri',
      description: 'Berber randevu yönetimi, dijital veresiye defteri, kasa takibi, gün sonu Z raporu, QR menü ve e-arşiv vergi dönemleri üzerine esnafa özel rehber makaleler.',
      ogDescription: 'Veresiye, online randevu, kasa takibi ve QR menü üzerine pratik esnaf rehberleri.',
      ogImage: `${origin}/og/blog.png`,
      canonical,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Blog', url: canonical },
      ],
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Dükkanım Yanımda Esnaf Blogu',
        description: 'Türkiye esnafı ve KOBİ işletmeleri için randevu, veresiye, kasa, gün sonu ve QR menü rehberleri.',
        url: canonical,
        inLanguage: 'tr-TR',
        publisher: {
          '@type': 'Organization',
          name: 'Dükkanım Yanımda',
          url: `${origin}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${origin}/icon-512.png`,
          },
        },
        blogPost: BLOG_ARTICLES.map((art) => ({
          '@type': 'BlogPosting',
          headline: art.h1,
          description: art.description,
          url: `${origin}/blog/${art.slug}`,
          image: `${origin}${art.ogImage}`,
          datePublished: art.publishedAt,
          dateModified: art.updatedAt,
          author: {
            '@type': 'Person',
            name: art.author,
            jobTitle: art.authorRole,
          },
        })),
      },
    };
  }

  if (clean.startsWith('/blog/')) {
    const article = findBlogArticle(clean);
    if (article) {
      const canonical = `${origin}/blog/${article.slug}`;
      const ogImage = article.ogImage.startsWith('http')
        ? article.ogImage
        : `${origin}${article.ogImage}`;
      return {
        title: article.seoTitle,
        ogTitle: article.title,
        description: article.description,
        ogDescription: article.description,
        ogImage,
        canonical,
        breadcrumbs: [
          { name: 'Ana Sayfa', url: origin },
          { name: 'Blog', url: `${origin}/blog` },
          { name: article.title, url: canonical },
        ],
        faqJson: article.faq,
        schemaJson: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.h1,
          description: article.description,
          image: ogImage,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          keywords: article.primaryKeyword,
          articleSection: article.category,
          inLanguage: 'tr-TR',
          author: {
            '@type': 'Person',
            name: article.author,
            jobTitle: article.authorRole,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Dükkanım Yanımda',
            url: `${origin}/`,
            logo: {
              '@type': 'ImageObject',
              url: `${origin}/icon-512.png`,
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonical,
          },
        },
      };
    }

    return {
      title: 'Blog Yazısı Bulunamadı | Dükkanım Yanımda',
      ogTitle: 'Esnaf Blogu — Dükkanım Yanımda',
      description: 'Aradığınız blog yazısı bulunamadı; tüm güncel esnaf rehberlerini inceleyin.',
      ogDescription: 'Tüm esnaf rehberlerini ve pratik işletme yazılarını inceleyin.',
      ogImage: `${origin}/og/blog.png`,
      canonical: `${origin}/blog`,
      robots: 'noindex, follow',
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Blog', url: `${origin}/blog` },
      ],
    };
  }

  // 4. Sabit Bilgi ve İşlem Sayfaları
  const pricingSchemaJson = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Dükkanım Yanımda',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: buildSoftwareOffersSchema(),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1860',
      bestRating: '5',
      worstRating: '1',
    },
  };

  if (clean === '/fiyat' || clean === '/fiyatlandirma') {
    const canonical = `${origin}/fiyat`;
    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Fiyatlandırma & Esnaf Paketleri', url: canonical },
    ];
    const faqJson = [
      {
        q: 'Dükkânım Yanımda uygulamasını ücretsiz kullanabilir miyim?',
        a: 'Evet! Çırak paketi ₺0 olup kredi kartı istemez; 25 müşteri, 3 masa ve ayda 20 ücretsiz online randevu ile hemen kullanmaya başlayabilirsiniz.',
      },
      {
        q: 'Usta ve Patron VIP paketleri neleri içerir?',
        a: 'Usta paketi tek koltuk çalışan esnaflar için sınırsız müşteri ve sınırsız randevu sunar. Patron VIP ise çoklu personel primi, canlı QR menü, garson çağrı ve aylık 500 otomatik WhatsApp bildirimi sunar.',
      },
      {
        q: 'İstediğim zaman paketimi iptal edebilir miyim?',
        a: 'Evet, taahhüt veya sözleşme yoktur. Dilediğiniz an üyeliğinizi sonlandırabilirsiniz.',
      },
    ];

    return {
      title: 'Fiyatlandırma & Esnaf Paketleri | Dükkanım Yanımda',
      ogTitle: 'Esnaf İçin En Uygun Yönetim Paketleri',
      description: 'Ücretsiz başlangıç, Çırak, Usta ve Patron VIP paketleri. Kredi kartsız hemen deneyin.',
      ogDescription: 'Esnaf için en uygun yönetim paketleri. Ücretsiz başlayın.',
      ogImage: `${origin}/og/fiyat.png`,
      canonical,
      breadcrumbs,
      faqJson,
      schemaJson: pricingSchemaJson,
    };
  }

  if (clean === '/kayit') {
    return {
      title: 'Ücretsiz Dükkanını Kur — 2 Dakikada Başla | Dükkanım Yanımda',
      ogTitle: 'Dükkanını 2 Dakikada Kur — Ücretsiz Başla',
      description: 'Kredi kartı yok, kurulum yok. Telefon numaranla kaydol, kasanı ve veresiye defterini hemen yönetmeye başla.',
      ogDescription: 'Kredi kartı gerekmez. Dükkanını 2 dakikada ücretsiz kur.',
      ogImage: `${origin}/og/kayit.png`,
      canonical: `${origin}/kayit`,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Ücretsiz Kayıt', url: `${origin}/kayit` },
      ],
      schemaJson: pricingSchemaJson,
    };
  }

  if (clean === '/iletisim') {
    return {
      title: 'İletişim & Destek | Dükkanım Yanımda',
      ogTitle: 'İletişim & Destek — Dükkanım Yanımda',
      description: 'Dükkânım Yanımda iletişim ve esnaf destek hattı. Sorularınız ve önerileriniz için bize ulaşın.',
      ogDescription: 'Esnaf destek ve iletişim hattı.',
      ogImage: `${origin}/og/iletisim.png`,
      canonical: `${origin}/iletisim`,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'İletişim', url: `${origin}/iletisim` },
      ],
    };
  }

  if (clean === '/gizlilik' || clean === '/gizlilik-politikasi') {
    return {
      title: 'Gizlilik Politikası & KVKK | Dükkanım Yanımda',
      ogTitle: 'Gizlilik Politikası & KVKK Güvencesi',
      description: 'Verileriniz güvende. Dükkan defteriniz ve müşteri bilgileriniz şifreli saklanır ve sadece size aittir.',
      ogDescription: 'Kişisel verileriniz ve dükkan kayıtlarınız %100 güvende.',
      ogImage: `${origin}/og/gizlilik.png`,
      canonical: `${origin}/gizlilik`,
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Gizlilik & KVKK', url: `${origin}/gizlilik` },
      ],
    };
  }

  // 5. Bilinmeyen Rota (404 Not Found)
  if (clean !== '/') {
    return {
      title: 'Sayfa Bulunamadı (404) | Dükkanım Yanımda',
      ogTitle: 'Sayfa Bulunamadı (404) — Dükkanım Yanımda',
      description: 'Aradığınız sayfa bulunamadı, adresi değişmiş veya yayından kaldırılmış olabilir.',
      ogDescription: 'Aradığınız sayfa bulunamadı.',
      ogImage: `${origin}/og/home.png`,
      canonical: `${origin}/`,
      robots: 'noindex, nofollow',
    };
  }

  // 6. Genel Ana Sayfa (Default /)
  const mapShops = getFeaturedMapShops(origin);

  return {
    title: 'Dükkânım Yanımda — Kasa, Veresiye, Randevu ve Gün Sonu Sistemi',
    ogTitle: 'Dükkânım Yanımda — Esnaf Yönetim Sistemi',
    description: 'Dükkanının kasa, veresiye defteri, randevu takvimi, QR menüsü ve gün sonu defteri — hepsi tek yerde cebinizde.',
    ogDescription: 'Dükkanının kasa, veresiye, stok ve gün sonu defteri — hepsi tek yerde.',
    ogImage: `${origin}/og/home.png`,
    canonical: `${origin}/`,
    faqJson: SEO_LANDING_PAGES['/'].faq,
    schemaJson: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'Dükkanım Yanımda',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All',
          offers: buildSoftwareOffersSchema(),
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: '1860',
            bestRating: '5',
            worstRating: '1',
          },
          description: 'Esnaf için online randevu, QR menü, kasa, veresiye defteri ve gün sonu takip sistemi.',
        },
        {
          '@type': 'Organization',
          name: 'Dükkanım Yanımda',
          url: `${origin}/`,
          logo: `${origin}/icon-512.png`,
          email: 'support@dukkanimyanimda.com.tr',
          description: 'Esnaf için kasa, veresiye defteri, stok ve gün sonu yönetim paneli.',
        },
        {
          '@type': 'ItemList',
          name: 'Dükkânım Yanımda Anlaşmalı ve Aktif Esnaf Ağı',
          description: 'Türkiye genelinde Dükkânım Yanımda kullanan berber, kuaför, güzellik salonu ve kafe esnafları haritası.',
          numberOfItems: mapShops.length,
          itemListElement: mapShops.map((s, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            item: {
              '@type': s.type,
              name: s.name,
              url: s.url,
              ...(s.phone ? { telephone: s.phone } : {}),
              address: {
                '@type': 'PostalAddress',
                addressLocality: s.cityDistrict,
                addressCountry: 'TR',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: s.latitude,
                longitude: s.longitude,
              },
            },
          })),
        },
      ],
    },
  };
}

let cachedIndexHtml: string | null = null;
let cachedMtimeMs: number = 0;

/**
 * Bellekteki HTML şablon önbelleğini sıfırlar (dosya güncellendiğinde).
 */
export function invalidateHtmlCache(): void {
  cachedIndexHtml = null;
  cachedMtimeMs = 0;
}

/**
 * dist/index.html dosyasını diskten mtime kontrolüyle okur (dosya değiştiğinde otomatik güncellenir).
 */
export function getBaseHtmlTemplate(): string {
  const candidates = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(process.cwd(), 'dist', 'index.html'),
    '/var/www/dukkanim/dist/index.html',
    path.join(process.cwd(), 'frontend', 'index.html'),
  ];

  let targetPath: string | null = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (targetPath) {
    try {
      const stat = fs.statSync(targetPath);
      if (cachedIndexHtml && stat.mtimeMs === cachedMtimeMs) {
        return cachedIndexHtml;
      }
      cachedIndexHtml = fs.readFileSync(targetPath, 'utf-8');
      cachedMtimeMs = stat.mtimeMs;
      return cachedIndexHtml;
    } catch {
      // Fallback below
    }
  }

  if (cachedIndexHtml) {
    return cachedIndexHtml;
  }

  return '<!doctype html><html lang="tr"><head><title>Dükkanım Yanımda</title></head><body><div id="root"></div></body></html>';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function filterCityMapShops(origin: string, cityKeywords: string[]): SeoMapShop[] {
  const normalizeTr = (val: string) =>
    (val || '')
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
  const normKeywords = cityKeywords.map(normalizeTr);
  return getFeaturedMapShops(origin).filter((shop) => {
    const haystack = normalizeTr(`${shop.cityDistrict} ${shop.city} ${shop.district}`);
    return normKeywords.some((kw) => haystack.includes(kw));
  });
}

function renderLandingContentSsr(content: LandingPageContent, origin: string): string {
  const isHome = content.key === '/';
  const isIzmit = content.key === '/izmit-berber-randevu';
  const isZonguldak = content.key === '/zonguldak-berber-randevu';

  const heroHeadingHtml = isHome
    ? `<h1 style="font-size:36px;font-weight:900;color:#0f172a;margin:14px 0 12px 0;line-height:1.15;">Defteri Kapat, Dükkânını Cebine Al</h1>
       <h2 style="font-size:24px;font-weight:900;color:#ea580c;margin:0 0 14px 0;line-height:1.25;">${escapeHtml(content.h1)}</h2>`
    : `<h1 style="font-size:32px;font-weight:900;color:#0f172a;margin:12px 0 12px 0;line-height:1.2;">${escapeHtml(content.h1)}</h1>`;

  const introHtml = content.introParagraphs
    .map(
      (p) =>
        `<p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 14px 0;">${escapeHtml(p)}</p>`
    )
    .join('\n');

  const howItWorksHtml = `
    <section aria-label="Nasıl Çalışır" style="margin:32px 0;">
      <h2 style="font-size:22px;font-weight:900;color:#0f172a;margin:0 0 16px 0;">3 Adımda Hızlı Kurulum ve Kullanım</h2>
      <ol style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:16px;">
        ${content.howItWorks
          .map(
            (step) => `
          <li style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;">
            <span style="display:inline-block;font-size:12px;font-weight:900;color:#ffffff;background:#ea580c;padding:3px 10px;border-radius:999px;margin-bottom:10px;">Adım ${escapeHtml(step.step)}</span>
            <h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 8px 0;">${escapeHtml(step.title)}</h3>
            <p style="font-size:14px;color:#475569;margin:0;line-height:1.6;">${escapeHtml(step.description)}</p>
          </li>`
          )
          .join('')}
      </ol>
    </section>`;

  const featureSectionsHtml = content.featureSections
    .map(
      (sec) => `
    <section style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:22px;margin-bottom:18px;">
      <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 12px 0;">${escapeHtml(sec.heading)}</h2>
      ${sec.paragraphs
        .map(
          (p) =>
            `<p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 10px 0;">${escapeHtml(p)}</p>`
        )
        .join('')}
      ${
        sec.bullets && sec.bullets.length > 0
          ? `<ul style="margin:10px 0 0 0;padding-left:20px;color:#334155;font-size:14px;line-height:1.7;">
              ${sec.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
            </ul>`
          : ''
      }
    </section>`
    )
    .join('\n');

  const comparisonHtml =
    content.comparisonPoints && content.comparisonPoints.length > 0
      ? `
    <section aria-label="Karşılaştırma" style="margin:32px 0;">
      <h2 style="font-size:22px;font-weight:900;color:#0f172a;margin:0 0 14px 0;">Klasik Yöntem vs. Dükkânım Yanımda</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:14px;">
        ${content.comparisonPoints
          .map(
            (cp) => `
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
            <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 8px 0;">${escapeHtml(cp.title)}</h3>
            <p style="font-size:13px;color:#991b1b;margin:0 0 6px 0;"><strong>Eski Yöntem:</strong> ${escapeHtml(cp.oldWay)}</p>
            <p style="font-size:13px;color:#166534;margin:0;"><strong>Dijital Çözüm:</strong> ${escapeHtml(cp.newWay)}</p>
          </div>`
          )
          .join('')}
      </div>
    </section>`
      : '';

  let citySectionHtml = '';
  if (content.cityDetails) {
    const cd = content.cityDetails;
    const cityKeywords = isIzmit
      ? ['izmit', 'kocaeli', 'gebze', 'körfez', 'gölcük', 'kartepe', 'darıca', 'başiskele', 'derince']
      : ['zonguldak', 'ereğli', 'kozlu', 'çaycuma', 'devrek', 'kilimli', 'alaplı', 'gökçebey'];
    const localShops = filterCityMapShops(origin, cityKeywords);
    const contractTitle = isIzmit
      ? 'İzmit ve Kocaeli Berber Randevu Sistemi — İlçe ve Mahalle Kapsamı'
      : isZonguldak
      ? 'Zonguldak ve Karadeniz Ereğli Berber Randevu — İlçe ve Mahalle Kapsamı'
      : `${cd.city} (${cd.region}) Yerel Berber Kapsamı`;

    citySectionHtml = `
    <section aria-label="${escapeHtml(cd.city)} Yerel Hizmet Bölgesi" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;padding:24px;margin:28px 0;">
      <h2 style="font-size:21px;font-weight:900;color:#9a3412;margin:0 0 12px 0;">${escapeHtml(contractTitle)}</h2>
      <p style="font-size:14px;color:#7c2d12;margin:0 0 14px 0;">
        <strong>Aktif Kayıtlı Açık Salon Sayısı:</strong> ${localShops.length} işletme · <strong>Bölge:</strong> ${escapeHtml(cd.region)}
      </p>
      ${
        localShops.length > 0
          ? `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;margin-bottom:16px;">
              ${localShops
                .slice(0, 6)
                .map(
                  (ls) => `
                <a href="${escapeHtml(ls.url)}" style="background:#ffffff;border:1px solid #fed7aa;border-radius:10px;padding:12px;text-decoration:none;display:block;">
                  <strong style="color:#0f172a;font-size:14px;display:block;">${escapeHtml(ls.name)}</strong>
                  <span style="color:#64748b;font-size:12px;">📍 ${escapeHtml(ls.cityDistrict)} · ${escapeHtml(ls.sectorName)}</span>
                </a>`
                )
                .join('')}
            </div>`
          : ''
      }
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;margin-bottom:16px;">
        <div style="background:#ffffff;border-radius:12px;padding:14px;border:1px solid #fed7aa;">
          <h3 style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 8px 0;">Kapsanan İlçeler</h3>
          <p style="font-size:13px;color:#475569;margin:0;">${escapeHtml(cd.districts.join(', '))}</p>
        </div>
        <div style="background:#ffffff;border-radius:12px;padding:14px;border:1px solid #fed7aa;">
          <h3 style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 8px 0;">Öne Çıkan Semt ve Caddeler</h3>
          <p style="font-size:13px;color:#475569;margin:0;">${escapeHtml(cd.neighborhoods.join(', '))}</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:10px;margin-bottom:16px;">
        ${cd.localStats
          .map(
            (st) => `
          <div style="background:#ffffff;border-radius:10px;padding:12px;text-align:center;border:1px solid #fed7aa;">
            <strong style="display:block;font-size:17px;color:#ea580c;">${escapeHtml(st.value)}</strong>
            <span style="font-size:12px;color:#475569;">${escapeHtml(st.label)}</span>
          </div>`
          )
          .join('')}
      </div>
      <div style="background:#ffffff;border-radius:12px;padding:16px;border:1px solid #fed7aa;">
        <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">${escapeHtml(cd.caseStudyTitle)}</h3>
        <p style="font-size:14px;color:#475569;margin:0;line-height:1.6;">${escapeHtml(cd.caseStudySummary)}</p>
      </div>
    </section>`;
  }

  const homeExtraHtml = isHome
    ? (() => {
        const activeShops = getFeaturedMapShops(origin);
        return `
      <section style="margin:36px 0;">
        <h2 style="font-size:22px;font-weight:900;color:#0f172a;margin-bottom:16px;text-align:center;">Sektörünüze Özel Dijital Çözümler</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:14px;">
          <a href="/berber" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;display:block;">
            <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">Berber &amp; Kuaför</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Koltuk sırası, online randevu takvimi ve usta primleri tek ekranda.</p>
          </a>
          <a href="/kuafor" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;display:block;">
            <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">Kuaför Salonu</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">İşlem bazlı süre planlaması, boya/kesim takvimi ve personel primleri.</p>
          </a>
          <a href="/guzellik-salonu" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;display:block;">
            <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">Güzellik Salonu</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Lazer epilasyon paketleri, seans sayacı ve estetisyen kabin planı.</p>
          </a>
          <a href="/veresiye-defteri" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;display:block;">
            <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">Veresiye Defteri</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Açılış bakiyesiyle hızlı geçiş, Tahsilat Turu ve WhatsApp hatırlatma.</p>
          </a>
          <a href="/kasa-programi" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;display:block;">
            <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">Kasa &amp; Gün Sonu</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Nakit, POS, havale ve gider takibi; 30 saniyede gün sonu kapanışı.</p>
          </a>
          <a href="/qr-menu" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;display:block;">
            <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">QR Menü &amp; Kafe POS</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Canlı masa takibi, temassız karekod QR menü ve garson çağırma.</p>
          </a>
        </div>
      </section>

      <section style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:32px;">
        <h2 style="font-size:20px;font-weight:900;color:#0f172a;margin:0 0 10px 0;">Türkiye Esnaf İletişim Ağı &amp; Canlı Esnaf Haritası</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 14px 0;">Türkiye genelinde aktif ${activeShops.length} açık işletme Dükkânım Yanımda ile çalışıyor.</p>
        ${
          activeShops.length > 0
            ? `<ul style="list-style:none;padding:0;margin:0 0 16px 0;display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;">
                ${activeShops
                  .slice(0, 6)
                  .map(
                    (s) => `
                  <li style="border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;">
                    <a href="${escapeHtml(s.url)}" style="font-weight:800;color:#0f172a;text-decoration:none;display:block;">${escapeHtml(s.name)}</a>
                    <span style="font-size:12px;color:#64748b;">${escapeHtml(s.sectorName)} · ${escapeHtml(s.cityDistrict)}</span>
                  </li>`
                  )
                  .join('')}
              </ul>`
            : ''
        }
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <a href="/berber" style="color:#ea580c;font-weight:800;font-size:14px;text-decoration:none;">Berber &amp; Kuaför Sistemi →</a>
          <a href="/kafe-restoran" style="color:#ea580c;font-weight:800;font-size:14px;text-decoration:none;">Kafe &amp; Restoran Adisyon →</a>
          <a href="/bakkal-market" style="color:#ea580c;font-weight:800;font-size:14px;text-decoration:none;">Bakkal &amp; Market POS →</a>
          <a href="/blog" style="color:#ea580c;font-weight:800;font-size:14px;text-decoration:none;">Esnaf Blogu (12 Rehber) →</a>
        </div>
      </section>`;
      })()
    : '';

  const testimonialsHtml =
    content.testimonials && content.testimonials.length > 0
      ? `
    <section aria-label="Esnaf Yorumları ve Kullanıcı Deneyimleri" style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;">
      <h2 style="font-size:22px;font-weight:900;color:#0f172a;margin:0 0 14px 0;">Esnaf Yorumları ve Kullanıcı Deneyimleri</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:14px;">
        ${content.testimonials
          .map(
            (t) => `
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
            <p style="font-size:13px;color:#ea580c;font-weight:800;margin:0 0 6px 0;">★★★★★ ${escapeHtml(t.rating)} · ${escapeHtml(t.shopAndCity)}</p>
            <p style="font-size:13px;color:#475569;margin:0 0 8px 0;line-height:1.5;">“${escapeHtml(t.quote)}”</p>
            <strong style="font-size:12px;color:#0f172a;">${escapeHtml(t.name)}</strong>
          </div>`
          )
          .join('')}
      </div>
    </section>`
      : '';

  const relatedLinksHtml =
    content.relatedLinks && content.relatedLinks.length > 0
      ? `
    <nav aria-label="İlgili Ürün ve Rehber Sayfaları" style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;">
      <h2 style="font-size:20px;font-weight:900;color:#0f172a;margin:0 0 14px 0;">İlgili Çözümler ve Rehberler</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;">
        ${content.relatedLinks
          .map(
            (rl) => `
          <a href="${escapeHtml(rl.href)}" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-decoration:none;display:block;">
            <strong style="font-size:14px;color:#ea580c;display:block;margin-bottom:4px;">${escapeHtml(rl.label)} →</strong>
            <span style="font-size:13px;color:#475569;line-height:1.45;">${escapeHtml(rl.description)}</span>
          </a>`
          )
          .join('')}
      </div>
    </nav>`
      : '';

  return `
  <article style="max-width:960px;margin:0 auto;">
    <div style="margin-bottom:28px;">
      <span style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#ea580c;background:#fff7ed;padding:4px 12px;border-radius:999px;border:1px solid #fed7aa;">${escapeHtml(content.badge)}</span>
      ${heroHeadingHtml}
      <p style="font-size:16px;color:#475569;line-height:1.65;margin:0 0 20px 0;">${escapeHtml(content.subtitle)}</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
        <a href="/kayit" style="background:#ea580c;color:#ffffff;font-size:15px;font-weight:800;padding:12px 26px;border-radius:10px;text-decoration:none;">2 Dakikada Ücretsiz Başla</a>
        <a href="/fiyat" style="background:#f1f5f9;color:#0f172a;font-size:15px;font-weight:700;padding:12px 22px;border-radius:10px;text-decoration:none;border:1px solid #cbd5e1;">Paketleri İncele</a>
      </div>
      <div>${introHtml}</div>
    </div>

    ${howItWorksHtml}
    ${citySectionHtml}
    ${featureSectionsHtml}
    ${comparisonHtml}
    ${homeExtraHtml}

    <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:28px;text-align:center;margin:28px 0;">
      <h2 style="font-size:22px;font-weight:900;margin:0 0 8px 0;">Dükkânınızı Bugün Dijitale Taşıyın</h2>
      <p style="font-size:14px;color:#94a3b8;margin:0 0 18px 0;">Kredi kartı gerekmez, komisyon %0. Çırak paketiyle hemen ücretsiz başlayın.</p>
      <a href="/kayit" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">Ücretsiz Hesap Oluştur</a>
    </div>

    ${testimonialsHtml}
    ${relatedLinksHtml}
  </article>`;
}

/**
 * Arama motorları (Googlebot vb.) ve JavaScript kapalı istemciler için rotaya özel
 * zengin, semantik SSR HTML gövdesi üretir (<div id="root"> içine enjekte edilir).
 */
export function generateSsrBodyHtml(pathname: string, meta: SeoMetadata, rawHost?: string): string {
  const host = rawHost && !rawHost.includes('localhost') && !rawHost.includes('127.0.0.1')
    ? rawHost
    : DEFAULT_HOST;
  const origin = `https://${host}`;
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const fresh = getDynamicSeoFreshness();

  // Ortak Header & Navigasyon (Googlebot İç Linkleme Ağı)
  const headerHtml = `
  <header style="background:#0f172a;color:#ffffff;padding:14px 20px;border-bottom:1px solid #1e293b;">
    <div style="max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
      <a href="/" aria-label="Dükkânım Yanımda Ana Sayfa" style="display:inline-flex;align-items:center;text-decoration:none;">
        <img src="/brand/logo-horizontal.png" alt="Dükkânım Yanımda - Esnaf Yönetim Sistemi" width="168" height="38" style="height:34px;width:auto;object-fit:contain;" />
      </a>
      <nav aria-label="Ana Menü" style="display:flex;flex-wrap:wrap;gap:14px;font-size:13px;font-weight:700;">
        <a href="/berber" style="color:#cbd5e1;text-decoration:none;">Berber Randevu</a>
        <a href="/kuafor" style="color:#cbd5e1;text-decoration:none;">Kuaför Salonu</a>
        <a href="/randevu-sistemi" style="color:#cbd5e1;text-decoration:none;">Online Randevu</a>
        <a href="/guzellik-salonu" style="color:#cbd5e1;text-decoration:none;">Güzellik Salonu</a>
        <a href="/veresiye-defteri" style="color:#cbd5e1;text-decoration:none;">Veresiye Defteri</a>
        <a href="/kasa-programi" style="color:#cbd5e1;text-decoration:none;">Kasa Programı</a>
        <a href="/qr-menu" style="color:#cbd5e1;text-decoration:none;">QR Menü</a>
        <a href="/kafe-restoran" style="color:#cbd5e1;text-decoration:none;">Kafe &amp; Adisyon</a>
        <a href="/bakkal-market" style="color:#cbd5e1;text-decoration:none;">Bakkal &amp; POS</a>
        <a href="/blog" style="color:#cbd5e1;text-decoration:none;">Blog</a>
        <a href="/rehber" style="color:#cbd5e1;text-decoration:none;">Esnaf Rehberi</a>
        <a href="/fiyat" style="color:#cbd5e1;text-decoration:none;">Fiyatlar</a>
        <a href="/kayit" style="background:#f97316;color:#ffffff;padding:6px 14px;border-radius:8px;text-decoration:none;">Ücretsiz Kayıt</a>
      </nav>
    </div>
  </header>`;

  // Breadcrumbs HTML
  let breadcrumbHtml = '';
  if (meta.breadcrumbs && meta.breadcrumbs.length > 0) {
    breadcrumbHtml = `
    <nav aria-label="Sayfa Yolu" style="margin-bottom:20px;font-size:12px;color:#64748b;">
      <ol style="display:flex;flex-wrap:wrap;list-style:none;padding:0;margin:0;gap:8px;">
        ${meta.breadcrumbs.map((b, idx) => `
          <li>
            ${idx > 0 ? '<span style="margin-right:8px;color:#94a3b8;">/</span>' : ''}
            <a href="${escapeHtml(b.url)}" style="color:${idx === meta.breadcrumbs!.length - 1 ? '#0f172a' : '#ea580c'};font-weight:${idx === meta.breadcrumbs!.length - 1 ? '700' : '600'};text-decoration:none;">${escapeHtml(b.name)}</a>
          </li>
        `).join('')}
      </ol>
    </nav>`;
  }

  // FAQ Bölümü HTML
  let faqSectionHtml = '';
  if (meta.faqJson && meta.faqJson.length > 0) {
    faqSectionHtml = `
    <section class="ssr-faq" style="margin-top:40px;padding-top:30px;border-top:1px solid #e2e8f0;">
      <h2 style="font-size:22px;font-weight:900;color:#0f172a;margin-bottom:16px;">Sıkça Sorulan Sorular</h2>
      <dl style="display:grid;gap:16px;">
        ${meta.faqJson.map((f) => `
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
            <dt style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:6px;">${escapeHtml(f.q)}</dt>
            <dd style="font-size:14px;color:#475569;margin:0;line-height:1.6;">${escapeHtml(f.a)}</dd>
          </div>
        `).join('')}
      </dl>
    </section>`;
  }

  // Ortak Footer
  const footerHtml = `
  <footer style="background:#0f172a;color:#94a3b8;padding:36px 20px;margin-top:60px;font-size:12px;border-top:1px solid #1e293b;">
    <div style="max-width:1200px;margin:0 auto;text-align:center;">
      <nav aria-label="Alt Bilgi Menüsü" style="margin-bottom:16px;display:flex;flex-wrap:wrap;justify-content:center;gap:14px;">
        <a href="/" style="color:#cbd5e1;text-decoration:none;">Ana Sayfa</a>
        <a href="/berber" style="color:#cbd5e1;text-decoration:none;">Berber Randevu</a>
        <a href="/kuafor" style="color:#cbd5e1;text-decoration:none;">Kuaför Salonu</a>
        <a href="/randevu-sistemi" style="color:#cbd5e1;text-decoration:none;">Online Randevu</a>
        <a href="/guzellik-salonu" style="color:#cbd5e1;text-decoration:none;">Güzellik Salonu</a>
        <a href="/veresiye-defteri" style="color:#cbd5e1;text-decoration:none;">Veresiye Defteri</a>
        <a href="/kasa-programi" style="color:#cbd5e1;text-decoration:none;">Kasa Programı</a>
        <a href="/gun-sonu-raporu" style="color:#cbd5e1;text-decoration:none;">Gün Sonu Raporu</a>
        <a href="/qr-menu" style="color:#cbd5e1;text-decoration:none;">QR Menü</a>
        <a href="/kafe-restoran" style="color:#cbd5e1;text-decoration:none;">Kafe &amp; Restoran</a>
        <a href="/bakkal-market" style="color:#cbd5e1;text-decoration:none;">Bakkal &amp; Market</a>
        <a href="/izmit-berber-randevu" style="color:#cbd5e1;text-decoration:none;">İzmit Berber Randevu</a>
        <a href="/zonguldak-berber-randevu" style="color:#cbd5e1;text-decoration:none;">Zonguldak Berber Randevu</a>
        <a href="/teknik-servis" style="color:#cbd5e1;text-decoration:none;">Teknik Servis</a>
        <a href="/hukuk" style="color:#cbd5e1;text-decoration:none;">Hukuk Bürosu</a>
        <a href="/terzi" style="color:#cbd5e1;text-decoration:none;">Terzi &amp; Kuru Temizleme</a>
        <a href="/blog" style="color:#cbd5e1;text-decoration:none;">Blog</a>
        <a href="/rehber" style="color:#cbd5e1;text-decoration:none;">Esnaf Rehberi</a>
        <a href="/fiyat" style="color:#cbd5e1;text-decoration:none;">Fiyatlar</a>
        <a href="/iletisim" style="color:#cbd5e1;text-decoration:none;">İletişim</a>
        <a href="/gizlilik" style="color:#cbd5e1;text-decoration:none;">Gizlilik &amp; KVKK</a>
      </nav>
      <p style="margin:0;color:#64748b;">© ${fresh.year} Dükkânım Yanımda — Türkiye Esnaf ve KOBİ'leri İçin Geliştirildi.</p>
    </div>
  </footer>`;

  let mainBodyContent = '';

  // 1. Randevu Rotaları: /r/:slug, /randevu/:slug veya /:slug/randevu
  const barberPath = extractBarberSlugFromPath(clean);
  if (barberPath) {
    const shop = findShopForSeo(barberPath.slug, 'barber');
    if (shop) {
      const shopLogo = shop.logoUrl
        ? (shop.logoUrl.startsWith('http') ? shop.logoUrl : `${origin}${shop.logoUrl}`)
        : `${origin}/og/randevu-sistemi.png`;

      const shopReviewsHtml = (shop.reviews && shop.reviews.length > 0)
        ? `
        <section aria-label="Müşteri Yorumları" style="margin-top:28px;margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin-bottom:12px;">Doğrulanmış Müşteri Yorumları</h2>
          <div style="display:grid;gap:10px;">
            ${shop.reviews.map((rev) => `
              <div style="background:#ffffff;padding:14px 18px;border-radius:10px;border:1px solid #e2e8f0;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <strong style="color:#0f172a;font-size:14px;">${escapeHtml(rev.customerName)}</strong>
                  <span style="color:#ea580c;font-weight:800;font-size:13px;">★ ${rev.rating}/5</span>
                </div>
                <p style="margin:0;color:#475569;font-size:13px;line-height:1.5;">${escapeHtml(rev.comment)}</p>
              </div>
            `).join('')}
          </div>
        </section>`
        : '';

      mainBodyContent = `
      <article style="max-width:860px;margin:0 auto;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:20px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e2e8f0;">
          <img src="${escapeHtml(shopLogo)}" alt="${escapeHtml(shop.name)} Logosu" width="112" height="112" style="width:112px;height:112px;border-radius:18px;object-fit:cover;border:2px solid #ea580c;box-shadow:0 4px 12px rgba(234,88,12,0.15);" />
          <div style="flex:1;min-width:240px;">
            <span style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#ea580c;background:#fff7ed;padding:4px 10px;border-radius:6px;border:1px solid #fed7aa;">Canlı Randevu Açık</span>
            <h1 style="font-size:28px;font-weight:900;color:#0f172a;margin:8px 0 6px 0;">${escapeHtml(shop.name)} — Online Randevu Al</h1>
            <p style="font-size:14px;color:#64748b;margin:0;">📍 ${escapeHtml(shop.cityDistrict || 'Türkiye')}${shop.phone ? ` &nbsp;·&nbsp; 📞 ${escapeHtml(shop.phone)}` : ''} &nbsp;·&nbsp; 🕒 ${escapeHtml(shop.openingTime || '09:00')} - ${escapeHtml(shop.closingTime || '21:00')}</p>
          </div>
        </div>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin-bottom:12px;">Hizmetler ve Güncel Fiyat Tarifesi</h2>
          <ul style="list-style:none;padding:0;margin:0;display:grid;gap:10px;">
            ${(shop.services && shop.services.length > 0)
              ? shop.services.map((svc) => `
                <li style="display:flex;justify-content:space-between;align-items:center;background:#ffffff;padding:12px 18px;border-radius:10px;border:1px solid #e2e8f0;">
                  <div>
                    <strong style="color:#0f172a;font-size:15px;">${escapeHtml(svc.name)}</strong>
                    ${svc.durationMinutes ? `<span style="font-size:12px;color:#64748b;display:block;">${svc.durationMinutes} dakika profesyonel işlem</span>` : ''}
                  </div>
                  <span style="font-size:16px;font-weight:900;color:#16a34a;">₺${svc.price}</span>
                </li>
              `).join('')
              : '<li style="background:#ffffff;padding:12px 18px;border-radius:10px;border:1px solid #e2e8f0;color:#64748b;">Hizmet tarifesi hazırlanıyor.</li>'}
          </ul>
        </section>

        ${shopReviewsHtml}

        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:20px;text-align:center;">
          <h3 style="font-size:17px;font-weight:800;color:#9a3412;margin:0 0 6px 0;">Sıra Beklemeden Rezervasyon Yapın</h3>
          <p style="font-size:13px;color:#7c2d12;margin:0 0 14px 0;">İstediğiniz ustayı, hizmeti ve müsait saati seçerek randevunuzu hemen oluşturabilirsiniz.</p>
          <a href="${barberPath.isCleanFormat ? `/${escapeHtml(shop.slug)}/randevu` : `/r/${escapeHtml(shop.slug)}`}" style="display:inline-block;background:#ea580c;color:#ffffff;font-size:14px;font-weight:800;padding:10px 24px;border-radius:10px;text-decoration:none;box-shadow:0 4px 12px rgba(234,88,12,0.25);">Randevu Saatini Seç</a>
        </div>
        <p style="margin-top:18px;text-align:center;font-size:12px;color:#64748b;"><a href="${origin}/berber" style="color:#ea580c;font-weight:700;text-decoration:none;">Powered by Dükkanım Yanımda — Online Randevu Sistemi</a></p>
      </article>`;
    } else {
      mainBodyContent = `
      <article style="max-width:760px;margin:0 auto;text-align:center;">
        <h1 style="font-size:28px;font-weight:900;color:#0f172a;margin:0 0 12px 0;">İşletme Randevu Sayfası Bulunamadı</h1>
        <p style="font-size:15px;color:#475569;margin:0 0 20px 0;">Aradığınız işletme bağlantısı geçersiz olabilir veya aktif olmayabilir.</p>
        <a href="/randevu-sistemi" style="display:inline-block;background:#ea580c;color:#ffffff;font-size:14px;font-weight:800;padding:10px 24px;border-radius:10px;text-decoration:none;">Online Randevu Sistemini İncele</a>
      </article>`;
    }
  }

  // 2. QR Menü Rotaları: /m/:slug veya /menu/:slug veya /menu
  else if (clean.startsWith('/m/') || clean.startsWith('/menu/') || clean === '/menu') {
    const slug = clean === '/menu' ? '' : clean.replace(/^\/(m|menu)\/?/, '');
    const shop = findShopForSeo(slug, 'menu');
    if (shop) {
      const shopLogo = shop.logoUrl
        ? (shop.logoUrl.startsWith('http') ? shop.logoUrl : `${origin}${shop.logoUrl}`)
        : `${origin}/og/qr-menu.png`;

      // Kategorilere göre grupla
      const categoriesMap = new Map<string, typeof shop.menuItems>();
      for (const item of (shop.menuItems || [])) {
        const cat = item.category || 'Öne Çıkanlar';
        if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
        categoriesMap.get(cat)!.push(item);
      }

      mainBodyContent = `
      <article style="max-width:860px;margin:0 auto;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:20px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e2e8f0;">
          <img src="${escapeHtml(shopLogo)}" alt="${escapeHtml(shop.name)} Menü Logosu" width="112" height="112" style="width:112px;height:112px;border-radius:18px;object-fit:cover;border:2px solid #ea580c;box-shadow:0 4px 12px rgba(234,88,12,0.15);" />
          <div style="flex:1;min-width:240px;">
            <span style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#ea580c;background:#fff7ed;padding:4px 10px;border-radius:6px;border:1px solid #fed7aa;">Canlı QR Menü &amp; Garson Çağırma</span>
            <h1 style="font-size:28px;font-weight:900;color:#0f172a;margin:8px 0 6px 0;">${escapeHtml(shop.name)} — Dijital Menü &amp; Fiyat Listesi</h1>
            <p style="font-size:14px;color:#64748b;margin:0;">📍 ${escapeHtml(shop.cityDistrict || 'Türkiye')}${shop.phone ? ` &nbsp;·&nbsp; 📞 ${escapeHtml(shop.phone)}` : ''} &nbsp;·&nbsp; 🕒 ${escapeHtml(shop.openingTime || '09:00')} - ${escapeHtml(shop.closingTime || '22:00')}</p>
          </div>
        </div>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin-bottom:16px;">Menü ve Lezzetler</h2>
          <div style="display:grid;gap:20px;">
            ${Array.from(categoriesMap.entries()).map(([catName, items]) => `
              <div>
                <h3 style="font-size:17px;font-weight:900;color:#ea580c;margin:0 0 10px 0;padding-bottom:6px;border-bottom:2px solid #ffedd5;">${escapeHtml(catName)}</h3>
                <ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px;">
                  ${(items || []).map((it) => `
                    <li style="display:flex;justify-content:space-between;align-items:center;background:#ffffff;padding:12px 18px;border-radius:10px;border:1px solid #e2e8f0;">
                      <div style="max-width:75%;">
                        <strong style="color:#0f172a;font-size:15px;">${escapeHtml(it.name)}</strong>
                        ${it.description ? `<p style="margin:3px 0 0 0;font-size:12px;color:#64748b;line-height:1.4;">${escapeHtml(it.description)}</p>` : ''}
                      </div>
                      <span style="font-size:16px;font-weight:900;color:#16a34a;white-space:nowrap;">₺${it.price}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </section>

        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:20px;text-align:center;">
          <h3 style="font-size:17px;font-weight:800;color:#9a3412;margin:0 0 6px 0;">Masadan Temassız Garson &amp; Hesap Çağırın</h3>
          <p style="font-size:13px;color:#7c2d12;margin:0 0 14px 0;">Karekod menüyü açarak garson çağırabilir veya siparişinizi anında iletebilirsiniz.</p>
          <a href="/m/${escapeHtml(shop.slug)}" style="display:inline-block;background:#ea580c;color:#ffffff;font-size:14px;font-weight:800;padding:10px 24px;border-radius:10px;text-decoration:none;box-shadow:0 4px 12px rgba(234,88,12,0.25);">Dijital Menüyü Aç</a>
        </div>
        <p style="margin-top:18px;text-align:center;font-size:12px;color:#64748b;"><a href="${origin}/qr-menu" style="color:#ea580c;font-weight:700;text-decoration:none;">Powered by Dükkanım Yanımda — Ücretsiz QR Menü Sistemi</a></p>
      </article>`;
    } else {
      mainBodyContent = `
      <article style="max-width:760px;margin:0 auto;text-align:center;">
        <h1 style="font-size:28px;font-weight:900;color:#0f172a;margin:0 0 12px 0;">Dijital QR Menü Bulunamadı</h1>
        <p style="font-size:15px;color:#475569;margin:0 0 20px 0;">Aradığınız restoran veya kafe menü bağlantısı aktif değil.</p>
        <a href="/qr-menu" style="display:inline-block;background:#ea580c;color:#ffffff;font-size:14px;font-weight:800;padding:10px 24px;border-radius:10px;text-decoration:none;">Ücretsiz QR Menü Sistemini Gör</a>
      </article>`;
    }
  }

  // 2.5. Esnaf Blogu (/blog)
  else if (clean === '/blog') {
    const categories = Array.from(new Set(BLOG_ARTICLES.map((a) => a.category)));
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <span style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#ea580c;background:#fff7ed;padding:4px 12px;border-radius:999px;border:1px solid #fed7aa;">Esnaf Blogu · Pratik İşletme Rehberleri</span>
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin:12px 0 12px 0;line-height:1.2;">Esnaf Blogu — Veresiye, Randevu, Kasa ve QR Menü Rehberleri</h1>
      <p style="font-size:16px;color:#475569;line-height:1.65;margin:0 0 22px 0;">Berberden kafeye, bakkaldan güzellik salonuna Türkiye esnafı için sahadan denenmiş kasa kapatma, dijital veresiye, online randevu ve vergi takvimi rehberleri.</p>

      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">
        ${categories
          .map(
            (cat) =>
              `<span style="background:#ffffff;border:1px solid #e2e8f0;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700;color:#334155;">${escapeHtml(cat)}</span>`
          )
          .join('')}
      </div>

      <section aria-label="Blog Makaleleri">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;">
          ${BLOG_ARTICLES.map(
            (art) => `
            <a href="/blog/${escapeHtml(art.slug)}" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <img src="${escapeHtml(art.ogImage)}" alt="${escapeHtml(art.title)}" width="400" height="210" style="width:100%;height:auto;border-radius:10px;margin-bottom:12px;object-fit:cover;" />
                <span style="font-size:11px;font-weight:800;color:#ea580c;text-transform:uppercase;">${escapeHtml(art.category)} · ${escapeHtml(art.readTime)}</span>
                <h2 style="font-size:17px;font-weight:800;color:#0f172a;margin:6px 0 8px 0;line-height:1.35;">${escapeHtml(art.title)}</h2>
                <p style="font-size:13px;color:#475569;margin:0 0 12px 0;line-height:1.55;">${escapeHtml(art.description)}</p>
              </div>
              <div style="font-size:12px;color:#64748b;border-top:1px solid #f1f5f9;padding-top:10px;display:flex;justify-content:space-between;">
                <span>${escapeHtml(art.author)}</span>
                <span>${escapeHtml(art.updatedAt)}</span>
              </div>
            </a>`
          ).join('')}
        </div>
      </section>
    </article>`;
  }

  // 2.6. Esnaf Blog Makalesi (/blog/:slug)
  else if (clean.startsWith('/blog/')) {
    const article = findBlogArticle(clean);
    if (article) {
      const relatedArticles = BLOG_ARTICLES.filter((a) => article.relatedSlugs.includes(a.slug));
      mainBodyContent = `
      <article style="max-width:860px;margin:0 auto;">
        <span style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#ea580c;background:#fff7ed;padding:4px 12px;border-radius:999px;border:1px solid #fed7aa;">${escapeHtml(article.category)} · ${escapeHtml(article.readTime)}</span>
        <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin:12px 0 10px 0;line-height:1.2;">${escapeHtml(article.h1)}</h1>
        <p style="font-size:13px;color:#64748b;margin:0 0 20px 0;">
          Yazar: <strong>${escapeHtml(article.author)}</strong> (${escapeHtml(article.authorRole)}) · Yayın: ${escapeHtml(article.publishedAt)} · Güncelleme: ${escapeHtml(article.updatedAt)}
        </p>
        <img src="${escapeHtml(article.ogImage)}" alt="${escapeHtml(article.h1)}" width="860" height="450" style="width:100%;height:auto;border-radius:16px;margin-bottom:22px;border:1px solid #e2e8f0;" />
        <p style="font-size:16px;color:#334155;line-height:1.7;margin:0 0 24px 0;">${escapeHtml(article.lead)}</p>

        ${
          article.keyTakeaways && article.keyTakeaways.length > 0
            ? `<section aria-label="Öne Çıkanlar" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:20px;margin-bottom:24px;">
                <h2 style="font-size:18px;font-weight:900;color:#9a3412;margin:0 0 10px 0;">Yazıdan Öne Çıkanlar</h2>
                <ul style="margin:0;padding-left:20px;color:#7c2d12;font-size:14px;line-height:1.7;">
                  ${article.keyTakeaways.map((kt) => `<li>${escapeHtml(kt)}</li>`).join('')}
                </ul>
              </section>`
            : ''
        }

        ${article.sections
          .map(
            (sec) => `
          <section style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:22px;margin-bottom:18px;">
            <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 12px 0;">${escapeHtml(sec.heading)}</h2>
            ${sec.paragraphs
              .map(
                (p) =>
                  `<p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 12px 0;">${escapeHtml(p)}</p>`
              )
              .join('')}
            ${
              sec.bullets && sec.bullets.length > 0
                ? `<ul style="margin:10px 0 0 0;padding-left:20px;color:#334155;font-size:14px;line-height:1.7;">
                    ${sec.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
                  </ul>`
                : ''
            }
            ${
              sec.tip
                ? `<p style="margin:14px 0 0 0;padding:12px 14px;background:#f8fafc;border-left:4px solid #ea580c;border-radius:6px;font-size:13px;color:#334155;"><strong>Esnaf İpucu:</strong> ${escapeHtml(sec.tip)}</p>`
                : ''
            }
          </section>`
          )
          .join('')}

        <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:26px;text-align:center;margin:28px 0;">
          <h2 style="font-size:21px;font-weight:900;margin:0 0 8px 0;">Dükkânım Yanımda ile Hemen Uygulamaya Geçin</h2>
          <p style="font-size:14px;color:#94a3b8;margin:0 0 16px 0;">Kurulum yok, komisyon %0. Çırak paketiyle 2 dakikada ücretsiz başlayın.</p>
          <a href="${escapeHtml(article.relatedProductHref)}" style="display:inline-block;background:#f97316;color:#ffffff;font-size:14px;font-weight:800;padding:12px 26px;border-radius:10px;text-decoration:none;">${escapeHtml(article.relatedProductLabel)} →</a>
        </div>

        ${
          relatedArticles.length > 0
            ? `<section aria-label="İlgili Blog Yazıları" style="margin-top:28px;">
                <h2 style="font-size:19px;font-weight:900;color:#0f172a;margin:0 0 12px 0;">İlgili Esnaf Rehberleri</h2>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px;">
                  ${relatedArticles
                    .map(
                      (ra) => `
                    <a href="/blog/${escapeHtml(ra.slug)}" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-decoration:none;display:block;">
                      <span style="font-size:11px;font-weight:800;color:#ea580c;">${escapeHtml(ra.category)} · ${escapeHtml(ra.readTime)}</span>
                      <strong style="display:block;font-size:14px;color:#0f172a;margin-top:4px;">${escapeHtml(ra.title)}</strong>
                    </a>`
                    )
                    .join('')}
                </div>
              </section>`
            : ''
        }
      </article>`;
    } else {
      mainBodyContent = `
      <article style="max-width:760px;margin:0 auto;text-align:center;">
        <h1 style="font-size:28px;font-weight:900;color:#0f172a;margin:0 0 12px 0;">Blog Yazısı Bulunamadı</h1>
        <p style="font-size:15px;color:#475569;margin:0 0 20px 0;">Aradığınız makale adresi değişmiş olabilir. Tüm güncel esnaf rehberlerini incelemek için blog ana sayfasına dönebilirsiniz.</p>
        <a href="/blog" style="display:inline-block;background:#ea580c;color:#ffffff;font-size:14px;font-weight:800;padding:10px 24px;border-radius:10px;text-decoration:none;">Tüm Blog Yazılarını Gör</a>
      </article>`;
    }
  }

  // 3. SEO Landing Sayfaları (/, /berber, /kuafor, /guzellik-salonu, /randevu-sistemi, /veresiye-defteri, /kasa-programi, /gun-sonu-raporu, /qr-menu, /kafe-restoran, /bakkal-market, /izmit-berber-randevu, /zonguldak-berber-randevu)
  else if (resolveLandingContentKey(clean)) {
    const landingKey = resolveLandingContentKey(clean)!;
    mainBodyContent = renderLandingContentSsr(SEO_LANDING_PAGES[landingKey], origin);
  }

  // 9. Teknik Servis
  else if (clean === '/teknik-servis' || clean === '/servis') {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;line-height:1.2;">Teknik Servis Cihaz Takip ve Tamir Fişi Yazılımı</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:24px;">Cihaz kabul fişi, parça maliyeti ve işçilik hesabı, QR kodlu canlı durum takibi ve müşteriye tek tıkla 'Cihazınız Hazır' WhatsApp bildirimi tek ekranda.</p>

      <section style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:28px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">QR Kodlu Cihaz Kabul Fişi</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Her cihaz için benzersiz fiş numarası ve müşteri takip linki üretilir; müşteri telefonundan tamir aşamasını canlı izler.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Parça Maliyeti &amp; Net Kâr</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Ekran, batarya veya yedek parça giderlerini işçilikle birlikte fişe işleyin, gün sonu net kazancınızı görün.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Tek Tıkla WhatsApp Hazır Bildirimi</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Tamir bittiğinde müşteriye cihaz durumu, tutar ve takip bağlantısıyla otomatik WhatsApp mesajı hazırlayın.</p>
        </div>
      </section>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
        <span style="font-size:14px;font-weight:700;color:#9a3412;">Müşterileriniz kendi tamir takip koduyla 7/24 online sorgulama yapabilir:</span>
        <a href="/kayit" style="color:#ea580c;font-weight:900;font-size:14px;text-decoration:none;">Ücretsiz Teknik Servis Paneli Aç →</a>
      </div>

      <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
        <h2 style="font-size:22px;font-weight:900;margin:0 0 8px 0;">Teknik Servisinizi 2 Dakikada Dijitale Taşıyın</h2>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 18px 0;">Donanım gerekmez. Hemen ücretsiz kayıt olun, ilk kabul fişinizi kesin.</p>
        <a href="/kayit" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">Servis Panelini Başlat</a>
      </div>
    </article>`;
  }

  // 10. Hukuk Bürosu
  else if (clean === '/hukuk' || clean === '/avukat') {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;line-height:1.2;">Avukat ve Hukuk Bürosu Dava Takip ve Masraf Yazılımı</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:24px;">Müvekkil cari hesabı, yaklaşan duruşma takvimi, vekalet ücreti ve masraf kalemleri tek güvenli ekranda.</p>

      <section style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:28px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Yaklaşan Duruşma Uyarıları</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Mahkeme, dosya numarası ve celse tarihleri kronolojik dizilir; 3 gün içindeki duruşmalar üstte vurgulanır.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Müvekkil Avans &amp; Masraf Cari Kartı</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Vekalet ücreti, harç/tebligat masrafları ve danışmanlık tahsilatları tek tuşla büro kasasına işlenir.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Şifreli ve İzole Büro Defteri</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Tüm dosyalar HTTPS üzerinden taşınır; büro kayıtlarınıza yalnızca yetkili hesap sahibi erişir.</p>
        </div>
      </section>

      <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
        <h2 style="font-size:22px;font-weight:900;margin:0 0 8px 0;">Hukuk Büronuz İçin Düzenli Dosya &amp; Tahsilat Takibi</h2>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 18px 0;">Kredi kartı gerekmez. 2 dakikada ücretsiz hesabınızı oluşturun.</p>
        <a href="/kayit" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">Hukuk Panelini Başlat</a>
      </div>
    </article>`;
  }

  // 11. Terzi
  else if (clean === '/terzi') {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;line-height:1.2;">Terzi &amp; Kuru Temizleme Emanet Takip Sistemi</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:24px;">Emanet fişi, tadilat durumu, teslimat tarihi, QR askı fişi ve müşteri ölçü notları cebinizde.</p>

      <section style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:28px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Askı &amp; Emanet Fişi Yazdırma</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Bırakılan kıyafetlere QR kodlu emanet fişi kesin; geciken teslimatlar listenin en üstünde uyarı verir.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Müşteri Ölçü &amp; Prova Arşivi</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Beden ve paça ölçülerini bir kez kaydedin, tekrar gelen müşteride tek dokunuşla görüntüleyin.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Hazır WhatsApp Bildirimi &amp; Kasa</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Tadilat bittiğinde müşteriye tek tuşla WhatsApp'tan haber verin, teslimatta tahsilatı kasaya işleyin.</p>
        </div>
      </section>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
        <span style="font-size:14px;font-weight:700;color:#9a3412;">Müşterileriniz kendi fiş takip koduyla anlık durum sorgulayabilir:</span>
        <a href="/kayit" style="color:#ea580c;font-weight:900;font-size:14px;text-decoration:none;">Ücretsiz Terzi Panelini Başlat →</a>
      </div>

      <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
        <h2 style="font-size:22px;font-weight:900;margin:0 0 8px 0;">Terzi ve Kuru Temizleme Fişlerinizi Dijitalleştirin</h2>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 18px 0;">2 dakikada ücretsiz kayıt olun, kayıp fiş sorununu bitirin.</p>
        <a href="/kayit" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">Terzi Panelini Başlat</a>
      </div>
    </article>`;
  }

  // 11.5. Canlı Servis & Emanet Fişi Takibi (/t/:code ve /bakim/:code)
  else if (clean.startsWith('/t/') || clean.startsWith('/bakim/')) {
    mainBodyContent = `
    <article style="max-width:760px;margin:0 auto;">
      <h1 style="font-size:30px;font-weight:900;color:#0f172a;margin-bottom:10px;">Canlı Servis &amp; Emanet Durum Takibi</h1>
      <p style="font-size:15px;color:#475569;line-height:1.6;margin-bottom:24px;">Cihaz tamir veya terzi emanet fişinizin güncel durumunu, tahmini teslimat bilgisini ve işletme iletişim detaylarını bu ekrandan takip edebilirsiniz.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <a href="/teknik-servis" style="color:#ea580c;font-weight:800;font-size:14px;text-decoration:none;">Teknik Servis Sistemi →</a>
        <a href="/terzi" style="color:#ea580c;font-weight:800;font-size:14px;text-decoration:none;">Terzi Emanet Sistemi →</a>
      </div>
    </article>`;
  }

  // 11.6. Esnaf Rehberi Ana Merkezi (/rehber)
  else if (clean === '/rehber') {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;line-height:1.2;">Esnaf Rehberi, Prim Hesaplayıcı &amp; Ücretsiz QR Araçları</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:28px;">Berber no-show önleme, kuaför prim hesaplama, ücretsiz QR menü karekod oluşturucu, dijital veresiye geçişi ve şehir bazlı esnaf rehberleri tek merkezde.</p>

      <section style="margin-bottom:32px;">
        <h2 style="font-size:20px;font-weight:900;color:#0f172a;margin-bottom:14px;">Ücretsiz İşletme Araçları</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
            <h3 style="font-size:16px;font-weight:800;color:#ea580c;margin:0 0 6px 0;">Berber Usta / Kalfa Prim Hesaplayıcı</h3>
            <p style="font-size:13px;color:#64748b;margin:0;">Ciro, yüzdelik oran ve koltuk sayısına göre günlük ve aylık usta hakedişini anında hesaplayın.</p>
          </div>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
            <h3 style="font-size:16px;font-weight:800;color:#ea580c;margin:0 0 6px 0;">Ücretsiz QR Menü &amp; Randevu Karekod Oluşturucu</h3>
            <p style="font-size:13px;color:#64748b;margin:0;">Dükkan linkiniz için yüksek çözünürlüklü karekodu saniyeler içinde üretip yazdırın.</p>
          </div>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
            <h3 style="font-size:16px;font-weight:800;color:#ea580c;margin:0 0 6px 0;">WhatsApp Hatırlatma Şablonları</h3>
            <p style="font-size:13px;color:#64748b;margin:0;">Veresiye borç ve randevu teyit mesajlarını tek tıkla kopyalayıp müşterinize gönderin.</p>
          </div>
        </div>
      </section>

      <section style="margin-bottom:32px;">
        <h2 style="font-size:20px;font-weight:900;color:#0f172a;margin-bottom:14px;">Tüm Sektör ve Şehir Rehberleri</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;">
          ${SEO_GUIDE_ARTICLES.map((art) => `
            <a href="/rehber/${escapeHtml(art.slug)}" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;display:block;">
              <span style="font-size:11px;font-weight:800;color:#ea580c;text-transform:uppercase;">${escapeHtml(art.category)} · ${escapeHtml(art.readTime)}</span>
              <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin:6px 0 6px 0;">${escapeHtml(art.title)}</h3>
              <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">${escapeHtml(art.description)}</p>
            </a>
          `).join('')}
        </div>
      </section>
    </article>`;
  }

  // 11.7. Esnaf Rehberi Makale & Yerel SEO Sayfası (/rehber/:slug)
  else if (clean.startsWith('/rehber/')) {
    const slug = clean.replace(/^\/rehber\//, '');
    const article = SEO_GUIDE_ARTICLES.find((a) => a.slug === slug);
    if (article) {
      mainBodyContent = `
      <article style="max-width:860px;margin:0 auto;">
        <span style="font-size:11px;font-weight:900;text-transform:uppercase;color:#ea580c;background:#fff7ed;padding:4px 10px;border-radius:6px;border:1px solid #fed7aa;">${escapeHtml(article.category)} · ${escapeHtml(article.readTime)}</span>
        <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin:12px 0 12px 0;line-height:1.2;">${escapeHtml(article.h1)}</h1>
        <p style="font-size:16px;color:#475569;line-height:1.65;margin-bottom:28px;">${escapeHtml(article.lead)}</p>

        ${article.sections.map((sec) => `
          <section style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:22px;margin-bottom:18px;">
            <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 10px 0;">${escapeHtml(sec.heading)}</h2>
            <p style="font-size:14px;color:#475569;line-height:1.65;margin:0;">${escapeHtml(sec.body)}</p>
            ${sec.bullets && sec.bullets.length > 0 ? `
              <ul style="margin:12px 0 0 0;padding-left:18px;color:#334155;font-size:14px;line-height:1.7;">
                ${sec.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
              </ul>
            ` : ''}
          </section>
        `).join('')}

        <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:26px;text-align:center;margin:28px 0;">
          <h2 style="font-size:20px;font-weight:900;margin:0 0 8px 0;">Dükkanınızı 2 Dakikada Dijitale Alın</h2>
          <p style="font-size:14px;color:#94a3b8;margin:0 0 16px 0;">Kurulum yok, komisyon %0. Hemen ücretsiz deneyin.</p>
          <a href="${escapeHtml(article.ctaHref)}" style="display:inline-block;background:#f97316;color:#ffffff;font-size:14px;font-weight:800;padding:11px 24px;border-radius:10px;text-decoration:none;">${escapeHtml(article.ctaLabel)}</a>
        </div>

        <section style="margin-top:24px;">
          <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:10px;">Diğer Esnaf Rehberleri</h3>
          <div style="display:flex;flex-wrap:wrap;gap:10px;">
            ${SEO_GUIDE_ARTICLES.filter((x) => x.slug !== article.slug).slice(0, 4).map((x) => `
              <a href="/rehber/${escapeHtml(x.slug)}" style="background:#ffffff;border:1px solid #e2e8f0;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:700;color:#ea580c;text-decoration:none;">${escapeHtml(x.title)}</a>
            `).join('')}
          </div>
        </section>
      </article>`;
    }
  }

  // 12. Fiyatlandırma
  else if (clean === '/fiyat' || clean === '/fiyatlandirma') {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;line-height:1.2;">Şeffaf Esnaf Paketleri ve Fiyatlandırma</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:28px;">Gizli ücret yok, yıllık taahhüt yok. Dükkanınızın ihtiyacına göre paket seçin.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:20px;margin-bottom:32px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:24px;">
          <h2 style="font-size:18px;font-weight:900;color:#0f172a;margin:0 0 6px 0;">Çırak Paketi</h2>
          <div style="font-size:28px;font-weight:900;color:#0f172a;margin-bottom:12px;">₺0 <span style="font-size:13px;color:#64748b;">/ sonsuza dek</span></div>
          <p style="font-size:13px;color:#64748b;margin:0 0 16px 0;">25 Müşteri &amp; Veresiye kotası, temel kasa ve randevu takibi.</p>
          <a href="/kayit" style="display:block;text-align:center;background:#0f172a;color:#ffffff;padding:10px;border-radius:8px;text-decoration:none;font-weight:700;">Ücretsiz Başla</a>
        </div>
        <div style="background:#ffffff;border:2px solid #ea580c;border-radius:14px;padding:24px;">
          <h2 style="font-size:18px;font-weight:900;color:#ea580c;margin:0 0 6px 0;">Usta Paketi</h2>
          <div style="font-size:28px;font-weight:900;color:#0f172a;margin-bottom:12px;">₺249 <span style="font-size:13px;color:#64748b;">/ ay</span></div>
          <p style="font-size:13px;color:#64748b;margin:0 0 16px 0;">100 Müşteri &amp; Veresiye, tek koltuk tam takvim, fotoğraf tarifesi.</p>
          <a href="/kayit" style="display:block;text-align:center;background:#ea580c;color:#ffffff;padding:10px;border-radius:8px;text-decoration:none;font-weight:700;">Usta Paketine Geç</a>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:24px;">
          <h2 style="font-size:18px;font-weight:900;color:#0f172a;margin:0 0 6px 0;">Patron VIP</h2>
          <div style="font-size:28px;font-weight:900;color:#0f172a;margin-bottom:12px;">₺499 <span style="font-size:13px;color:#64748b;">/ ay</span></div>
          <p style="font-size:13px;color:#64748b;margin:0 0 16px 0;">Sınırsız müşteri, çoklu usta prim takibi, işletmeye özel yazılım desteği.</p>
          <a href="/kayit" style="display:block;text-align:center;background:#0f172a;color:#ffffff;padding:10px;border-radius:8px;text-decoration:none;font-weight:700;">VIP Başlat</a>
        </div>
      </div>
    </article>`;
  }

  // 13. Ücretsiz Kayıt
  else if (clean === '/kayit') {
    mainBodyContent = `
    <article style="max-width:700px;margin:0 auto;text-align:center;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;">Dükkânım Yanımda Ücretsiz Kayıt</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:28px;">Dükkanınızı 2 dakikada kurun. Kasa, veresiye defteri, randevu ve QR menünüzü hemen kullanmaya başlayın. Kredi kartı istemeyiz.</p>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;text-align:left;">
        <h2 style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 16px 0;">Hemen Başlayın</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 20px 0;">Telefon numaranızı girin ve şifrenizi belirleyin; dükkan defteriniz anında açılsın.</p>
        <a href="/kayit" style="display:block;text-align:center;background:#ea580c;color:#ffffff;font-size:15px;font-weight:800;padding:12px;border-radius:10px;text-decoration:none;">Kayıt Ekranına Git</a>
      </div>
    </article>`;
  }

  // 14. İletişim
  else if (clean === '/iletisim') {
    mainBodyContent = `
    <article style="max-width:760px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;">İletişim ve Esnaf Destek Hattı</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:24px;">Dükkânım Yanımda hakkında sorularınız, kurulum talepleriniz ve önerileriniz için support@dukkanimyanimda.com.tr üzerinden ekibimize ulaşabilirsiniz.</p>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:24px;">
        <h2 style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 10px 0;">Hızlı Destek Kanalları</h2>
        <p style="font-size:14px;color:#475569;margin:0 0 14px 0;">E-posta: <strong>support@dukkanimyanimda.com.tr</strong></p>
        <a href="/kayit" style="display:inline-block;background:#ea580c;color:#ffffff;font-size:14px;font-weight:800;padding:10px 22px;border-radius:10px;text-decoration:none;">Ücretsiz Hesap Oluştur</a>
      </div>
    </article>`;
  }

  // 15. Gizlilik & KVKK
  else if (clean === '/gizlilik' || clean === '/gizlilik-politikasi') {
    mainBodyContent = `
    <article style="max-width:860px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;">Gizlilik Politikası ve KVKK Güvencesi</h1>
      <p style="font-size:16px;color:#475569;line-height:1.65;margin-bottom:24px;">Dükkânım Yanımda üzerinde tuttuğunuz kasa hareketleri, veresiye bakiyeleri, randevular ve müşteri kayıtları yalnızca size aittir; şifreli bağlantılar ve düzenli yedeklemelerle korunur.</p>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:22px;">
        <h2 style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 10px 0;">Veri Güvenliği İlkelerimiz</h2>
        <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.7;">
          <li>Tüm veri iletişimi uçtan uca HTTPS/TLS şifrelemesiyle taşınır.</li>
          <li>İşletme verileriniz üçüncü taraf reklam ağlarıyla veya rakiplerle paylaşılmaz.</li>
          <li>Dilediğiniz zaman dükkan yedeklerinizi indirip hesabınızı sonlandırabilirsiniz.</li>
        </ul>
      </div>
    </article>`;
  }

  // 16. 404 Bilinmeyen Rota
  else {
    mainBodyContent = `
    <article style="max-width:760px;margin:0 auto;text-align:center;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;">Sayfa Bulunamadı (404)</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:24px;">Aradığınız sayfa kaldırılmış veya bağlantısı değişmiş olabilir.</p>
      <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
        <a href="/" style="background:#ea580c;color:#ffffff;font-size:14px;font-weight:800;padding:11px 24px;border-radius:10px;text-decoration:none;">Ana Sayfaya Dön</a>
        <a href="/blog" style="background:#f1f5f9;color:#0f172a;font-size:14px;font-weight:700;padding:11px 22px;border-radius:10px;text-decoration:none;border:1px solid #cbd5e1;">Esnaf Blogu</a>
      </div>
    </article>`;
  }

  const isSectorLanding = [
    '/teknik-servis', '/servis', '/hukuk', '/avukat', '/terzi',
  ].includes(clean);

  const sectorTestimonialsHtml = isSectorLanding
    ? `
    <section aria-label="Esnaf Yorumları ve Kullanıcı Deneyimleri" style="margin-top:36px;padding-top:28px;border-top:1px solid #e2e8f0;">
      <h2 style="font-size:22px;font-weight:900;color:#0f172a;margin-bottom:14px;">Esnaf Yorumları ve Kullanıcı Deneyimleri</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:14px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
          <p style="font-size:13px;color:#ea580c;font-weight:800;margin:0 0 6px 0;">★★★★★ 5.0 · Kadıköy / Berber Esnafı</p>
          <p style="font-size:13px;color:#475569;margin:0 0 8px 0;line-height:1.5;">“Koltuk sırası ve usta primleri yüzünden akşamları 1 saat hesap yapıyorduk, şimdi 30 saniyede kasayı kapatıyoruz.”</p>
          <strong style="font-size:12px;color:#0f172a;">Ahmet K. — Erkek Kuaförü</strong>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
          <p style="font-size:13px;color:#ea580c;font-weight:800;margin:0 0 6px 0;">★★★★★ 5.0 · Çankaya / Kafe İşletmesi</p>
          <p style="font-size:13px;color:#475569;margin:0 0 8px 0;line-height:1.5;">“QR menüden gelen siparişler anında adisyona düşüyor, fiyat değişince yeniden menü bastırma derdi bitti.”</p>
          <strong style="font-size:12px;color:#0f172a;">Merve T. — Kafe &amp; Bistro</strong>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
          <p style="font-size:13px;color:#ea580c;font-weight:800;margin:0 0 6px 0;">★★★★★ 4.9 · Nilüfer / Mahalle Marketi</p>
          <p style="font-size:13px;color:#475569;margin:0 0 8px 0;line-height:1.5;">“Veresiye defteri kaybolma korkusu kalmadı, WhatsApp hatırlatma ile unutulan alacaklarımızı topladık.”</p>
          <strong style="font-size:12px;color:#0f172a;">Hasan Y. — Şarküteri &amp; Bakkal</strong>
        </div>
      </div>
    </section>`
    : '';

  return `
  ${headerHtml}
  <main id="main-content" style="max-width:1200px;margin:30px auto;padding:0 20px;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif;">
    ${breadcrumbHtml}
    ${mainBodyContent}
    ${sectorTestimonialsHtml}
    ${faqSectionHtml}
  </main>
  ${footerHtml}`;
}

/**
 * Verilen rota için dinamik meta ve Open Graph etiketlerini HTML'e enjekte eder.
 */
export function renderSeoHtml(pathname: string, host?: string, customTemplate?: string): string {
  const baseHtml = customTemplate || getBaseHtmlTemplate();
  const meta = getSeoMetadata(pathname, host);

  let html = baseHtml;

  // <title>
  if (html.includes('<title>')) {
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  } else {
    html = html.replace('</head>', `<title>${escapeHtml(meta.title)}</title></head>`);
  }

  // <meta name="description" ...>
  const descTag = `<meta name="description" content="${escapeHtml(meta.description)}" />`;
  if (/name="description"/i.test(html)) {
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, descTag);
  } else {
    html = html.replace('</head>', `${descTag}\n</head>`);
  }

  // <meta property="og:title" ...>
  const ogTitleTag = `<meta property="og:title" content="${escapeHtml(meta.ogTitle || meta.title)}" />`;
  if (/property="og:title"/i.test(html)) {
    html = html.replace(/<meta\s+property=["']og:title["'][^>]*>/i, ogTitleTag);
  } else {
    html = html.replace('</head>', `${ogTitleTag}\n</head>`);
  }

  // <meta property="og:description" ...>
  const ogDescTag = `<meta property="og:description" content="${escapeHtml(meta.ogDescription || meta.description)}" />`;
  if (/property="og:description"/i.test(html)) {
    html = html.replace(/<meta\s+property=["']og:description["'][^>]*>/i, ogDescTag);
  } else {
    html = html.replace('</head>', `${ogDescTag}\n</head>`);
  }

  // <meta property="og:url" ...>
  const ogUrlTag = `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`;
  if (/property="og:url"/i.test(html)) {
    html = html.replace(/<meta\s+property=["']og:url["'][^>]*>/i, ogUrlTag);
  } else {
    html = html.replace('</head>', `${ogUrlTag}\n</head>`);
  }

  // <link rel="canonical" ...>
  const canonicalTag = `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`;
  if (/rel="canonical"/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `${canonicalTag}\n</head>`);
  }

  // <meta property="og:image" ...>
  const ogImageTag = `<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`;
  if (/property="og:image"/i.test(html)) {
    html = html.replace(/<meta\s+property=["']og:image["'][^>]*>/i, ogImageTag);
  } else {
    html = html.replace('</head>', `${ogImageTag}\n</head>`);
  }

  // <meta name="twitter:card" ...>
  const twitterCardTag = '<meta name="twitter:card" content="summary_large_image" />';
  if (/name=["']twitter:card["']/i.test(html)) {
    html = html.replace(/<meta\s+name=["']twitter:card["'][^>]*>/i, twitterCardTag);
  } else {
    html = html.replace('</head>', `${twitterCardTag}\n</head>`);
  }

  // <meta name="twitter:title" ...>
  const twitterTitleTag = `<meta name="twitter:title" content="${escapeHtml(meta.ogTitle || meta.title)}" />`;
  if (/name="twitter:title"/i.test(html)) {
    html = html.replace(/<meta\s+name=["']twitter:title["'][^>]*>/i, twitterTitleTag);
  } else {
    html = html.replace('</head>', `${twitterTitleTag}\n</head>`);
  }

  // <meta name="twitter:description" ...>
  const twitterDescTag = `<meta name="twitter:description" content="${escapeHtml(meta.ogDescription || meta.description)}" />`;
  if (/name="twitter:description"/i.test(html)) {
    html = html.replace(/<meta\s+name=["']twitter:description["'][^>]*>/i, twitterDescTag);
  } else {
    html = html.replace('</head>', `${twitterDescTag}\n</head>`);
  }

  // <meta name="twitter:image" ...>
  const twitterImageTag = `<meta name="twitter:image" content="${escapeHtml(meta.ogImage)}" />`;
  if (/name="twitter:image"/i.test(html)) {
    html = html.replace(/<meta\s+name=["']twitter:image["'][^>]*>/i, twitterImageTag);
  } else {
    html = html.replace('</head>', `${twitterImageTag}\n</head>`);
  }

  // <meta name="robots" ...>
  const robotsContent = meta.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const robotsTag = `<meta name="robots" content="${escapeHtml(robotsContent)}" />`;
  if (/name=["']robots["']/i.test(html)) {
    html = html.replace(/<meta\s+name=["']robots["'][^>]*>/i, robotsTag);
  } else {
    html = html.replace('</head>', `${robotsTag}\n</head>`);
  }

  // JSON-LD Structured Data Injection
  if (meta.schemaJson) {
    const jsonLdTag = `\n    <script type="application/ld+json">\n    ${JSON.stringify(meta.schemaJson, null, 2)}\n    </script>\n`;
    html = html.replace('</head>', `${jsonLdTag}</head>`);
  }

  // Extra JSON-LD Schemas Injection (e.g., Service schema on local landing pages)
  if (meta.extraSchemas && meta.extraSchemas.length > 0) {
    for (const extraSchema of meta.extraSchemas) {
      const extraTag = `\n    <script type="application/ld+json">\n    ${JSON.stringify(extraSchema, null, 2)}\n    </script>\n`;
      html = html.replace('</head>', `${extraTag}</head>`);
    }
  }

  // Google Search BreadcrumbList JSON-LD Injection
  if (meta.breadcrumbs && meta.breadcrumbs.length > 0) {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: meta.breadcrumbs.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: b.name,
        item: b.url,
      })),
    };
    const breadcrumbTag = `\n    <script type="application/ld+json">\n    ${JSON.stringify(breadcrumbSchema, null, 2)}\n    </script>\n`;
    html = html.replace('</head>', `${breadcrumbTag}</head>`);
  }

  // Google Search FAQPage JSON-LD Injection (Rich Snippet Accordion)
  if (meta.faqJson && meta.faqJson.length > 0) {
    // Şablondaki eski veya statik FAQPage bloğunu temizle (çift şema çakışmasını engelle)
    html = html.replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?"@type":\s*"FAQPage"[\s\S]*?<\/script>/gi, '');

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: meta.faqJson.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.a,
        },
      })),
    };
    const faqTag = `\n    <script type="application/ld+json">\n    ${JSON.stringify(faqSchema, null, 2)}\n    </script>\n`;
    html = html.replace('</head>', `${faqTag}</head>`);
  }

  // Google Analytics 4 (gtag.js) Enjeksiyonu (Opsiyonel GA_MEASUREMENT_ID ortam değişkeni varsa)
  const gaId = process.env.GA_MEASUREMENT_ID;
  if (gaId && !html.includes('googletagmanager.com/gtag/js')) {
    const gaTag = `\n    <!-- Google tag (gtag.js) -->\n    <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(gaId)}"></script>\n    <script>\n      window.dataLayer = window.dataLayer || [];\n      function gtag(){dataLayer.push(arguments);}\n      gtag('js', new Date());\n      gtag('config', '${escapeHtml(gaId)}');\n    </script>\n`;
    html = html.replace('</head>', `${gaTag}</head>`);
  }

  // Google SERP Thumbnail & image_src Enjeksiyonu (Rakip SERP Görsel Eşleşmesi)
  const thumbUrl = escapeHtml(meta.ogImage);
  const thumbnailTag = `<meta name="thumbnail" content="${thumbUrl}" />`;
  if (/name=["']thumbnail["']/i.test(html)) {
    html = html.replace(/<meta\s+name=["']thumbnail["'][^>]*>/i, thumbnailTag);
  } else {
    html = html.replace('</head>', `${thumbnailTag}\n</head>`);
  }

  const imageSrcTag = `<link rel="image_src" href="${thumbUrl}" />`;
  if (/rel=["']image_src["']/i.test(html)) {
    html = html.replace(/<link\s+rel=["']image_src["'][^>]*>/i, imageSrcTag);
  } else {
    html = html.replace('</head>', `${imageSrcTag}\n</head>`);
  }

  // Semantik SSR HTML Gövdesi Enjeksiyonu (Boş <div id="root"> Sorununu Kökten Çözer, Görünür Flaş Oluşturmaz)
  const ssrBodyHtml = generateSsrBodyHtml(pathname, meta, host);
  const hiddenSsrWrapper = `<div id="ssr-seo-fallback" aria-hidden="true" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none;">${ssrBodyHtml}</div>`;
  html = html.replace(/<div\s+id=["']root["']>\s*<\/div>/i, `<div id="root">${hiddenSsrWrapper}</div>`);

  return html;
}

function isExcludedAccount(acc: { id: string; shopName?: string; phone?: string; isClosed?: boolean; parentAccountId?: string }): boolean {
  if (acc.id === DEMO_ACCOUNT_ID || isAccountClosed(acc as any)) {
    return true;
  }
  const p = (acc.phone || '').replace(/\D/g, '');
  if (['0500', '0501', '0502', '0503', '0504', '0505', '0506', '0507', '0508', '0509', '0512'].some((prefix) => p.startsWith(prefix))) {
    return true;
  }
  const name = (acc.shopName || '').toLowerCase();
  const id = (acc.id || '').toLowerCase();
  if (
    name.includes('test') ||
    name.includes('güvenlik') ||
    name.includes('guvenlik') ||
    name.includes('kilit') ||
    name.includes('izolasyon') ||
    name.includes('ws dukkan')
  ) {
    return true;
  }
  if (id.includes('test') || id.includes('ws_')) return true;
  return false;
}

/**
 * Dinamik ve taranabilir sitemap.xml üretir.
 * Sistemdeki tüm kayıtlı dükkanların randevu ve menü sayfalarını Google Bot'a bildirir.
 */
export function generateSitemapXml(rawHost?: string): string {
  const host = rawHost && !rawHost.includes('localhost') && !rawHost.includes('127.0.0.1')
    ? rawHost
    : DEFAULT_HOST;
  const origin = `https://${host}`;

  interface SitemapUrlEntry {
    loc: string;
    priority: string;
    changefreq: string;
    lastmod: string;
    title: string;
    img: string;
  }

  const staticUrls: SitemapUrlEntry[] = [
    { loc: `${origin}/`, priority: '1.0', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Dükkânım Yanımda - Esnaf Yönetim Sistemi', img: `${origin}/og/home.png` },
    { loc: `${origin}/berber`, priority: '1.0', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Berber Randevu & Koltuk Yönetim Sistemi', img: `${origin}/og/berber.png` },
    { loc: `${origin}/kuafor`, priority: '0.95', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Kuaför Randevu ve Salon Takip Programı', img: `${origin}/og/kuafor.png` },
    { loc: `${origin}/guzellik-salonu`, priority: '1.0', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Güzellik Salonu ve Merkez Yönetim Sistemi — Seans & Paket Takibi', img: `${origin}/og/guzellik-salonu.png` },
    { loc: `${origin}/randevu-sistemi`, priority: '0.95', changefreq: 'weekly', lastmod: '2026-11-19', title: '7/24 Online Randevu ve Rezervasyon Sistemi', img: `${origin}/og/randevu-sistemi.png` },
    { loc: `${origin}/veresiye-defteri`, priority: '0.95', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Veresiye Defteri Uygulaması & Dijital Alacak Takibi', img: `${origin}/og/veresiye-defteri.png` },
    { loc: `${origin}/kasa-programi`, priority: '0.9', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Esnaf Kasa Takip Programı — Nakit, POS & Gider Yönetimi', img: `${origin}/og/kasa-programi.png` },
    { loc: `${origin}/gun-sonu-raporu`, priority: '0.9', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Gün Sonu Raporu & Z Raporu Programı', img: `${origin}/og/gun-sonu-raporu.png` },
    { loc: `${origin}/qr-menu`, priority: '0.95', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Ücretsiz QR Menü Sistemi & Masadan Sipariş', img: `${origin}/og/qr-menu.png` },
    { loc: `${origin}/izmit-berber-randevu`, priority: '0.92', changefreq: 'weekly', lastmod: '2026-11-19', title: 'İzmit Berber Randevu ve Kuaför Sistemi', img: `${origin}/og/izmit.png` },
    { loc: `${origin}/zonguldak-berber-randevu`, priority: '0.92', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Zonguldak Berber Randevu ve Kuaför Programı', img: `${origin}/og/zonguldak.png` },
    { loc: `${origin}/kafe-restoran`, priority: '0.95', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Yazılımı', img: `${origin}/og/kafe-restoran.png` },
    { loc: `${origin}/bakkal-market`, priority: '0.95', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Bakkal & Market Hızlı POS Barkodlu Terazi Sistemi', img: `${origin}/og/bakkal-market.png` },
    { loc: `${origin}/fiyat`, priority: '0.9', changefreq: 'monthly', lastmod: '2026-11-10', title: 'Fiyatlandırma & Esnaf Paketleri', img: `${origin}/og/fiyat.png` },
    { loc: `${origin}/kayit`, priority: '0.9', changefreq: 'monthly', lastmod: '2026-11-10', title: 'Ücretsiz Kayıt - Dükkanını 2 Dakikada Kur', img: `${origin}/og/kayit.png` },
    { loc: `${origin}/teknik-servis`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-11-16', title: 'Teknik Servis Cihaz Takip ve Tamir Fişi Yazılımı', img: `${origin}/og/teknik-servis.png` },
    { loc: `${origin}/hukuk`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-11-16', title: 'Avukat ve Hukuk Bürosu Dava Takip ve Masraf Yazılımı', img: `${origin}/og/hukuk.png` },
    { loc: `${origin}/terzi`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-11-16', title: 'Terzi & Kuru Temizleme Emanet Takip Sistemi', img: `${origin}/og/terzi.png` },
    { loc: `${origin}/iletisim`, priority: '0.6', changefreq: 'yearly', lastmod: '2026-10-15', title: 'İletişim & Destek', img: `${origin}/og/iletisim.png` },
    { loc: `${origin}/gizlilik`, priority: '0.4', changefreq: 'yearly', lastmod: '2026-10-15', title: 'Gizlilik Politikası & KVKK Güvencesi', img: `${origin}/og/gizlilik.png` },
    { loc: `${origin}/blog`, priority: '0.9', changefreq: 'weekly', lastmod: '2026-11-19', title: 'Esnaf Blogu — Veresiye, Randevu, Kasa ve QR Menü Rehberleri', img: `${origin}/og/blog.png` },
    ...BLOG_ARTICLES.map((art) => ({
      loc: `${origin}/blog/${art.slug}`,
      priority: '0.85',
      changefreq: 'monthly',
      lastmod: art.updatedAt,
      title: art.title,
      img: art.ogImage.startsWith('http') ? art.ogImage : `${origin}${art.ogImage}`,
    })),
    { loc: `${origin}/rehber`, priority: '0.85', changefreq: 'weekly', lastmod: '2026-11-16', title: 'Esnaf Rehberi, Prim Hesaplayıcı & Ücretsiz QR Araçları', img: `${origin}/og/rehber.png` },
    ...SEO_GUIDE_ARTICLES.filter((art) => !art.noindex).map((art) => ({
      loc: `${origin}/rehber/${art.slug}`,
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: art.updatedAt || '2026-11-16',
      title: art.title,
      img: `${origin}/og/rehber.png`,
    })),
  ];

  // Aktif dükkanların dinamik linkleri
  const shopUrls: SitemapUrlEntry[] = [];
  const accounts = getAccounts();
  const seenSlugs = new Set<string>();

  for (const acc of accounts) {
    if (isExcludedAccount(acc)) continue;
    try {
      const st = loadShopState(acc.id);
      const storeName = st.shopProfile?.storeName || acc.shopName;
      const slug = st.shopProfile?.slug || slugify(storeName);
      if (!slug || seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      const normSector = (st.shopProfile?.sectorKey || '').toLowerCase().replace(/_/g, '-');
      const isBarberSector = normSector.includes('berber') || normSector.includes('kuafor') || normSector.includes('guzellik');
      const isCafeSector = normSector.includes('kafe') || normSector.includes('restoran') || normSector.includes('adisyon');
      const hasBarberServices = Array.isArray(st.barberServices) && st.barberServices.length > 0;
      const hasMenuItems = Array.isArray(st.menuItems) && st.menuItems.length > 0;
      const isConfigured = Boolean(st.shopProfile?.isConfigured);
      const shopLastmod = (st.lastUpdated || '').slice(0, 10) || '2026-11-16';

      const shopLogo = st.shopProfile?.logoUrl
        ? (st.shopProfile.logoUrl.startsWith('http') ? st.shopProfile.logoUrl : `${origin}${st.shopProfile.logoUrl}`)
        : `${origin}/og/randevu-sistemi.png`;

      // Randevu sayfası: Yalnızca berber/kuaför/güzellik veya randevu servisi tanımlanmış dükkanlar
      if ((isBarberSector && isConfigured) || hasBarberServices) {
        shopUrls.push({
          loc: `${origin}/${slug}/randevu`,
          priority: '0.85',
          changefreq: 'weekly',
          lastmod: shopLastmod,
          title: `${storeName} - Online Randevu Al`,
          img: shopLogo,
        });
        shopUrls.push({
          loc: `${origin}/r/${slug}`,
          priority: '0.8',
          changefreq: 'weekly',
          lastmod: shopLastmod,
          title: `${storeName} - Online Randevu Al`,
          img: shopLogo,
        });
      }

      // QR Menü sayfası: SADECE kafe/restoran sektöründeki ve gerçekten menü ürünleri girilmiş dükkanlar
      if (isCafeSector && hasMenuItems) {
        shopUrls.push({
          loc: `${origin}/m/${slug}`,
          priority: '0.8',
          changefreq: 'weekly',
          lastmod: shopLastmod,
          title: `${storeName} - Dijital QR Menü & Fiyatlar`,
          img: st.shopProfile?.logoUrl
            ? (st.shopProfile.logoUrl.startsWith('http') ? st.shopProfile.logoUrl : `${origin}${st.shopProfile.logoUrl}`)
            : `${origin}/og/qr-menu.png`,
        });
      }
    } catch {
      // Hata durumunda atla
    }
  }

  const allUrls = [...staticUrls, ...shopUrls];

  const xmlEntries = allUrls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    <image:image>
      <image:loc>${u.img}</image:loc>
      <image:title>${escapeHtml(u.title)}</image:title>
    </image:image>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlEntries}
</urlset>
`;
}

/**
 * Temiz ve arama motorları dostu robots.txt içeriği döner.
 */
export function getRobotsTxt(rawHost?: string): string {
  const host = rawHost && !rawHost.includes('localhost') && !rawHost.includes('127.0.0.1')
    ? rawHost
    : DEFAULT_HOST;
  const origin = `https://${host}`;

  return `User-agent: *
Allow: /
Allow: /api/public/
Allow: /media/
Disallow: /api/
Disallow: /admin
Disallow: /data/

Sitemap: ${origin}/sitemap.xml
`;
}
