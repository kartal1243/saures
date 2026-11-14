import fs from 'fs';
import path from 'path';
import { getAccounts } from './accounts';
import { loadShopState, slugify, demoBarberServices, demoBarberReviews } from './shopState';
import { DEMO_ACCOUNT_ID, DEMO_PHONE } from './demoSeed';

export interface SeoMetadata {
  title: string;
  ogTitle: string;
  description: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  robots?: string;
  schemaJson?: object;
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
    ctaHref: '/r/demo',
    ctaLabel: 'Canlı Berber Randevu Demosunu Gör',
  },
  {
    slug: 'ankara-berber-kuafor',
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
    ctaHref: '/m/demo',
    ctaLabel: 'Canlı QR Menü Demosunu Gör',
  },
];

export function isValidGuideRoute(pathname: string): boolean {
  const clean = (pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
  if (clean === '/rehber') return true;
  return SEO_GUIDE_ARTICLES.some((a) => `/rehber/${a.slug}` === clean);
}

export const demoCafeMenuItems = [
  { id: 'm_1', name: 'Normal Çiğ Köfte Dürüm', price: 90, category: 'Dürümler', description: '100gr özel yoğrulmuş çiğ köfte, taze marul, nar ekşisi ve limon eşliğinde.', imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80' },
  { id: 'm_2', name: 'Mega Çiğ Köfte Dürüm', price: 130, category: 'Dürümler', description: '150gr çiğ köfte, çift lavaş, bol yeşillik ve özel acı sos.', imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80' },
  { id: 'm_3', name: 'Doritoslu Çıtır Dürüm', price: 120, category: 'Dürümler', description: 'Çıtır Doritos cipsi ve çiğ köfte uyumu, taze nane ve nar ekşisi ile.', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
  { id: 'm_4', name: 'Yarım Porsiyon Çiğ Köfte (250gr)', price: 200, category: 'Porsiyonlar', description: '250gr çiğ köfte, 3 lavaş, yeşillik buketi, acı sos ve 2 nar ekşisi ile.', imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80' },
  { id: 'm_5', name: 'Tam Porsiyon Çiğ Köfte (500gr)', price: 280, category: 'Porsiyonlar', description: '500gr çiğ köfte, 5 lavaş, zengin yeşillik tabağı ve özel soslar.', imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80' },
  { id: 'm_6', name: 'Sıcak Köfte Ekmek', price: 200, category: 'Sıcak Lezzetler', description: '100gr ızgara kasap köfte, çıtır ekmek arası közlenmiş domates ve biber ile.', imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&auto=format&fit=crop&q=80' },
  { id: 'm_7', name: 'Yayık Ayran (300ml)', price: 35, category: 'İçecekler', description: 'Köpüklü soğuk yayık ayranı.', imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80' },
  { id: 'm_8', name: 'Taze Demleme Çay', price: 20, category: 'İçecekler', description: 'İnce belli bardakta taze Rize çayı.', imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80' },
];

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
export function findShopForSeo(identifier: string, mode?: 'barber' | 'menu'): ResolvedShop | null {
  const rawId = (identifier || '').toLowerCase().trim();
  if (!rawId) return null;

  if (rawId === 'demo' && mode === 'menu') {
    return {
      name: 'Karaköy Kahvecisi & Bistro',
      slug: 'demo',
      phone: '0555 000 0000',
      cityDistrict: 'Karaköy, İstanbul',
      slogan: 'Geleneksel lezzetler, taze kahve ve hızlı servis',
      businessField: 'Kafe & Restoran',
      sectorKey: 'kafe_restoran',
      isVip: true,
      exists: true,
      openingTime: '08:30',
      closingTime: '23:30',
      closedDays: [],
      services: [],
      menuItems: demoCafeMenuItems.map((m) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        category: m.category,
        description: m.description,
        imageUrl: m.imageUrl,
      })),
      reviews: [],
      logoUrl: '/brand/phone_mockup_retina.png',
    };
  }

  const accounts = getAccounts();

  // 1. Hesaplar içinde ID, telefon veya dükkan adı eşleşmesi
  let targetAcc = accounts.find(
    (a) =>
      a.id.toLowerCase() === rawId ||
      a.phone === rawId ||
      slugify(a.shopName) === rawId
  );

  let targetState = targetAcc ? loadShopState(targetAcc.id) : null;

  // 2. State içinde slug veya storeName eşleşmesi
  if (!targetState) {
    for (const a of accounts) {
      const st = loadShopState(a.id);
      const shopSlug = st.shopProfile?.slug || slugify(st.shopProfile?.storeName || a.shopName);
      if (shopSlug === rawId) {
        targetAcc = a;
        targetState = st;
        break;
      }
    }
  }

  // 3. 'demo' fallback'i
  if (!targetState && rawId === 'demo') {
    const fallbackAcc = accounts.find(
      (a) => a.id === DEMO_ACCOUNT_ID || a.phone === DEMO_PHONE || a.phone === '05550000000'
    );
    if (fallbackAcc) {
      targetAcc = fallbackAcc;
      targetState = loadShopState(fallbackAcc.id);
    }
  }

  if (!targetAcc && !targetState) {
    return null;
  }

  const storeName = targetState?.shopProfile?.storeName || targetAcc?.shopName || 'İşletme';
  const computedSlug = targetState?.shopProfile?.slug || slugify(storeName) || rawId;

  const rawServices = targetState?.barberServices && targetState.barberServices.length > 0
    ? targetState.barberServices
    : (targetAcc?.id === DEMO_ACCOUNT_ID || rawId === 'demo' ? demoBarberServices : []);

  const services = (rawServices || []).map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    durationMinutes: s.durationMinutes,
  }));

  const rawMenuItems = (targetState as any)?.menuItems && (targetState as any).menuItems.length > 0
    ? (targetState as any).menuItems
    : (targetAcc?.id === DEMO_ACCOUNT_ID || rawId === 'demo' ? demoCafeMenuItems : []);

  const menuItems = (rawMenuItems || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    price: m.price,
    category: m.category || 'Genel',
    description: m.description,
    imageUrl: m.imageUrl,
  }));

  const rawReviews = targetState?.barberReviews && targetState.barberReviews.length > 0
    ? targetState.barberReviews
    : (targetAcc?.id === DEMO_ACCOUNT_ID || rawId === 'demo' ? demoBarberReviews : []);

  const reviews = (rawReviews || [])
    .filter((r) => r.approved !== false && typeof r.rating === 'number' && r.comment)
    .map((r) => ({
      id: r.id,
      customerName: r.customerName,
      staffName: r.staffName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

  const logoUrl = targetState?.shopProfile?.logoUrl || (rawId === 'demo' ? '/brand/phone_mockup_retina.png' : undefined);

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
 * Haritada listelenecek anlaşmalı ve aktif pilot işletmeleri döner.
 * Google Haritalar & Yerel SEO (LocalBusiness / Place GeoCoordinates) için ana sayfada zenginleştirilir.
 */
export function getFeaturedMapShops(origin: string = DEFAULT_ORIGIN): SeoMapShop[] {
  const curated: SeoMapShop[] = [
    {
      id: 'demo-barber',
      name: 'Berber & Kuaför Demo — Kadıköy Moda',
      slug: 'demo',
      type: 'HairSalon',
      sectorName: 'Erkek Kuaförü & Berber',
      cityDistrict: 'Kadıköy, İstanbul',
      city: 'İstanbul',
      district: 'Kadıköy',
      latitude: 40.9882,
      longitude: 29.0267,
      phone: '0555 000 0000',
      url: `${origin}/r/demo`,
      badge: 'Canlı Randevu Demo',
    },
    {
      id: 'demo-cafe',
      name: 'Karaköy Kahvecisi & Bistro',
      slug: 'demo',
      type: 'Restaurant',
      sectorName: 'Kafe & Restoran',
      cityDistrict: 'Beyoğlu, İstanbul',
      city: 'İstanbul',
      district: 'Beyoğlu',
      latitude: 41.0234,
      longitude: 28.9774,
      phone: '0555 000 0000',
      url: `${origin}/m/demo`,
      badge: 'QR Menü Aktif',
    },
    {
      id: 'nisantasi-beauty',
      name: 'Nişantaşı Güzellik & Nail Studio',
      slug: 'nisantasi-guzellik',
      type: 'BeautySalon',
      sectorName: 'Güzellik Salonu & Seans',
      cityDistrict: 'Şişli, İstanbul',
      city: 'İstanbul',
      district: 'Şişli',
      latitude: 41.0504,
      longitude: 28.9928,
      url: `${origin}/guzellik-salonu`,
      badge: 'Paket & Seans Takibi',
    },
    {
      id: 'cankaya-hair',
      name: 'Çankaya Premium Kuaför & Saç Tasarım',
      slug: 'cankaya-kuafor',
      type: 'HairSalon',
      sectorName: 'Kadın Kuaförü & Renklendirme',
      cityDistrict: 'Çankaya, Ankara',
      city: 'Ankara',
      district: 'Çankaya',
      latitude: 39.8969,
      longitude: 32.8644,
      url: `${origin}/rehber/ankara-berber-kuafor`,
      badge: 'Online Randevu',
    },
    {
      id: 'alsancak-lounge',
      name: 'Alsancak Kahve & Adisyon Lounge',
      slug: 'alsancak-kahve',
      type: 'Restaurant',
      sectorName: 'Kafe, Adisyon & Masa',
      cityDistrict: 'Konak, İzmir',
      city: 'İzmir',
      district: 'Konak',
      latitude: 38.4382,
      longitude: 27.1428,
      url: `${origin}/rehber/izmir-kafe-restoran`,
      badge: 'Canlı Masa Takibi',
    },
    {
      id: 'bursa-pos',
      name: 'Nilüfer Mahalle Şarküteri & Bakkal',
      slug: 'nilufer-sarkuteri',
      type: 'LocalBusiness',
      sectorName: 'Bakkal, Market & Barkodlu POS',
      cityDistrict: 'Nilüfer, Bursa',
      city: 'Bursa',
      district: 'Nilüfer',
      latitude: 40.2133,
      longitude: 28.9833,
      url: `${origin}/bakkal-market`,
      badge: 'Veresiye & Hızlı POS',
    },
    {
      id: 'antalya-tailor',
      name: 'Muratpaşa Moda Evi & Usta Terzi',
      slug: 'muratpasa-terzi',
      type: 'LocalBusiness',
      sectorName: 'Terzi & Kuru Temizleme',
      cityDistrict: 'Muratpaşa, Antalya',
      city: 'Antalya',
      district: 'Muratpaşa',
      latitude: 36.8841,
      longitude: 30.7056,
      url: `${origin}/terzi`,
      badge: 'Tadilat & Fiş Takibi',
    },
    {
      id: 'uskudar-service',
      name: 'Üsküdar Telefon & Teknik Servis',
      slug: 'uskudar-teknik-servis',
      type: 'LocalBusiness',
      sectorName: 'Teknik Servis & Cihaz Takip',
      cityDistrict: 'Üsküdar, İstanbul',
      city: 'İstanbul',
      district: 'Üsküdar',
      latitude: 41.0267,
      longitude: 29.0156,
      url: `${origin}/teknik-servis`,
      badge: 'Servis Fişi & Cihaz Sorgulama',
    },
  ];

  try {
    const accounts = getAccounts();
    for (const acc of accounts) {
      if (acc.id === DEMO_ACCOUNT_ID) continue;
      const lowerName = (acc.shopName || '').toLowerCase();
      if (lowerName.includes('test') || lowerName.includes('guvenlik') || lowerName.includes('ws-')) continue;

      const st = loadShopState(acc.id);
      const storeName = st.shopProfile?.storeName || acc.shopName;
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

      curated.push({
        id: acc.id,
        name: storeName,
        slug,
        type,
        sectorName,
        cityDistrict,
        city: cityDistrict.split(',')[1]?.trim() || 'İstanbul',
        district: cityDistrict.split(',')[0]?.trim() || cityDistrict,
        latitude: 41.0082 + (Math.sin(acc.id.length) * 0.05),
        longitude: 28.9784 + (Math.cos(acc.id.length) * 0.05),
        phone: st.shopProfile?.phone || acc.phone,
        url,
        badge: 'Aktif Esnaf',
      });
    }
  } catch {
    // accounts yüklenemezse curated listesiyle devam et
  }

  return curated;
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

  // 1. Randevu rotaları: /r/:slug veya /randevu/:slug
  if (clean.startsWith('/r/') || clean.startsWith('/randevu/')) {
    const slug = clean.replace(/^\/(r|randevu)\/?/, '');
    const shop = findShopForSeo(slug, 'barber');
    if (shop) {
      const title = `${shop.name} - Online Randevu Al | Dükkanım Yanımda`;
      const ogTitle = `${shop.name} - Kolay Online Randevu`;
      const description = `${shop.name} için sıra beklemeden online randevunuzu hemen oluşturun. Güncel hizmetler, müsait saatler ve anında onay.`;
      const ogDescription = `${shop.name} için sıra beklemeden online randevunuzu hemen oluşturun.`;
      const canonical = `${origin}/r/${shop.slug}`;
      const shopLogo = shop.logoUrl
        ? (shop.logoUrl.startsWith('http') ? shop.logoUrl : `${origin}${shop.logoUrl}`)
        : `${origin}/brand/phone_mockup_retina.png`;
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

    const isDemoSlug = slug === 'demo';
    return {
      title: 'Online Randevu Sistemi | Dükkanım Yanımda',
      ogTitle: 'Online Randevu Sistemi — Dükkanım Yanımda',
      description: 'Berber, kuaför ve güzellik salonları için kolay online randevu ve dükkan yönetim sistemi.',
      ogDescription: 'Sıra beklemeden online randevu alın.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical: isDemoSlug ? `${origin}/r/demo` : `${origin}/randevu-sistemi`,
      robots: isDemoSlug ? undefined : 'noindex, follow',
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Online Randevu', url: `${origin}/randevu-sistemi` },
      ],
    };
  }

  // 2. QR Menü rotaları: /m/:slug veya /menu/:slug veya /menu
  if (clean.startsWith('/m/') || clean.startsWith('/menu/') || clean === '/menu') {
    const slug = clean === '/menu' ? 'demo' : clean.replace(/^\/(m|menu)\/?/, '');
    const shop = findShopForSeo(slug, 'menu');
    if (shop) {
      const title = `${shop.name} - Dijital QR Menü & Fiyatlar | Dükkanım Yanımda`;
      const ogTitle = `${shop.name} - Dijital Menü`;
      const description = `${shop.name} güncel menü, fiyat listesi ve temassız garson çağırma. Canlı QR menü ile hızlı ve temassız sipariş verin.`;
      const ogDescription = 'Güncel menü, fiyatlar ve masadan garson çağırma.';
      const canonical = `${origin}/m/${shop.slug}`;
      const shopLogo = shop.logoUrl
        ? (shop.logoUrl.startsWith('http') ? shop.logoUrl : `${origin}${shop.logoUrl}`)
        : `${origin}/brand/phone_mockup_retina.png`;
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

    const isDemoSlug = slug === 'demo';
    return {
      title: 'Canlı Dijital QR Menü & Fiyatlar | Dükkanım Yanımda',
      ogTitle: 'Dijital QR Menü & Garson Çağırma',
      description: 'Kafe ve restoranlar için anlık fiyat güncellemeli, temassız garson çağırmalı canlı dijital QR menü.',
      ogDescription: 'Güncel menü, fiyatlar ve masadan garson çağırma.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical: isDemoSlug ? `${origin}/m/demo` : `${origin}/kafe-restoran`,
      robots: isDemoSlug ? undefined : 'noindex, follow',
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'QR Menü', url: `${origin}/kafe-restoran` },
      ],
    };
  }

  // 3. Berber Açılış Sayfası (Kopya Sayfa İzolasyonu)
  if (clean === '/berber' || clean === '/berber-randevu-programi') {
    const canonical = `${origin}/berber`;
    const title = `Berber Randevu & Koltuk Yönetim Sistemi (${fresh.year}) | Dükkanım Yanımda`;
    const ogTitle = `Berber Randevu ve Koltuk Takip Sistemi (${fresh.year})`;
    const description = `Koltuk sırası, online randevu takvimi, çırak/usta prim hesabı ve anlık kasa takibi tek ekranda. ${fresh.month} ${fresh.year} güncel sürüm. ${fresh.seasonalKeyword} için hazır. Berber esnafı için 2 dakikada hazır.`;
    const ogDescription = 'Koltuk sırası, online randevu takvimi, çırak/usta prim hesabı ve anlık kasa takibi tek ekranda.';
    const ogImage = `${origin}/brand/phone_mockup_retina.png`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Dükkanım Yanımda - Berber Randevu Sistemi',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
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

    const faqJson = [
      {
        q: 'Berber randevu sistemi telefonda veya tablette kurulumsuz çalışır mı?',
        a: 'Evet, hiçbir donanım veya uygulama indirmeden telefon, tablet veya bilgisayarınızdan tarayıcıyla anında çalışır.',
      },
      {
        q: 'Usta ve çırak prim hesabı nasıl yapılır?',
        a: 'Her koltuk ve çalışan için hizmet başı veya yüzdelik prim oranı tanımlanır. Gün sonunda kimin ne kadar kazandığı tek ekranda listelenir.',
      },
      {
        q: 'Müşteriler randevularını online kendileri alabilir mi?',
        a: 'Evet, her dükkana özel "dukkanimyanimda.com.tr/r/dukkan-adiniz" web linki üretilir. Müşteri boş saatleri görerek randevusunu alır.',
      },
      {
        q: 'Gelmeyen (no-show) müşteriler nasıl önlenir?',
        a: 'Randevu saati yaklaştığında sistem üzerinden tek dokunuşla WhatsApp hatırlatma mesajı gönderilir, koltuklar boş kalmaz.',
      },
    ];

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs, faqJson };
  }

  // 4. Kuaför Salonu Açılış Sayfası (Kopya Sayfa İzolasyonu)
  if (clean === '/kuafor' || clean === '/kuafor-randevu' || clean === '/kadin-kuafor') {
    const canonical = `${origin}/kuafor`;
    const title = `Kuaför Randevu ve Salon Takip Programı (${fresh.year}) | Dükkanım Yanımda`;
    const ogTitle = `Kuaför Randevu ve Salon Yönetim Programı (${fresh.year})`;
    const description = `Kadın ve erkek kuaförleri için saç renklendirme, kesim, bakım randevuları, personel primleri ve randevu çakışma önleme sistemi. ${fresh.month} ${fresh.year} güncel sürüm.`;
    const ogDescription = 'Kuaför salonları için randevu takvimi, personel primleri ve randevu çakışma önleme sistemi.';
    const ogImage = `${origin}/brand/phone_mockup_retina.png`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Dükkanım Yanımda - Kuaför Salon Yönetim Programı',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
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

    const faqJson = [
      {
        q: 'Boya, fön ve kesim gibi farklı işlem süreleri nasıl planlanır?',
        a: 'Her hizmete özel süre (ör. boya 90 dk, kesim 45 dk) tanımlanır; takvim randevuları bu sürelere göre otomatik bloklar ve çakışmayı önler.',
      },
      {
        q: 'Gelin başı ve nişan randevularında kapora takibi var mı?',
        a: 'Evet, aylar öncesinden randevu kaydı açabilir, alınan kaporayı ve kalan bakiyeyi müşteri kartında saklayabilirsiniz.',
      },
      {
        q: 'Kuaför salonunda birden fazla personelin cirosu ayrı görünür mü?',
        a: 'Evet, hangi personelin kaç işlem yaptığı, ne kadar ciro getirdiği ve alacağı prim akşam tek raporda listelenir.',
      },
    ];

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs, faqJson };
  }

  if (
    clean === '/guzellik-salonu' ||
    clean === '/guzellik-merkezi' ||
    clean === '/guzellik' ||
    clean === '/lazer-epilasyon'
  ) {
    const title = `Güzellik Salonu ve Merkez Yönetim Sistemi — Seans & Paket Takibi (${fresh.year}) | Dükkanım Yanımda`;
    const ogTitle = `Güzellik Salonu ve Seans Takip Sistemi (${fresh.year})`;
    const description = `Güzellik merkezleri için seans ve paket takibi, lazer epilasyon randevu defteri, estetisyen kabin planlaması ve otomatik WhatsApp hatırlatma. ${fresh.month} ${fresh.year} güncel sürüm. 2 dakikada ücretsiz başlayın.`;
    const ogDescription = 'Seans ve paket takibi, estetisyen randevu defteri, kabin planlaması ve WhatsApp hatırlatma tek ekranda.';
    const canonical = `${origin}/guzellik-salonu`;
    const ogImage = `${origin}/brand/phone_mockup_retina.png`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Dükkanım Yanımda - Güzellik Salonu ve Seans Takip Sistemi',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
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

    const faqJson = [
      {
        q: 'Güzellik salonlarında seans ve paket takibi nasıl yapılır?',
        a: 'Müşteriye 6 veya 8 seanslık paket tanımlanır. Her randevuda tek tıkla 1 seans düşülür, kalan seans sayısı ve borç durumu anında ekranda görünür.',
      },
      {
        q: 'Estetisyen ve cihaz/kabin çakışması engellenir mi?',
        a: 'Evet, hangi uzmanın hangi odada veya cihazda olduğu canlı takvimde renklerle ayrılır; çakışan randevular sistem tarafından anında önlenir.',
      },
      {
        q: 'Müşteriler randevuyu Instagram veya WhatsApp üzerinden alabilir mi?',
        a: 'Evet, salonunuza özel online randevu linkinizi Instagram biyografinize ekleyebilirsiniz. Müşterileriniz boş saatleri görerek randevusunu hemen oluşturur.',
      },
    ];

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs, faqJson };
  }

  if (clean === '/randevu-sistemi' || clean === '/online-randevu') {
    const canonical = `${origin}/randevu-sistemi`;
    const title = `7/24 Online Randevu ve Rezervasyon Sistemi (${fresh.year}) | Dükkanım Yanımda`;
    const ogTitle = `Canlı Online Randevu ve Müşteri Rezervasyon Motoru (${fresh.year})`;
    const description = `İşletmenize özel web linkiyle 7/24 online randevu toplama ve müşteri takip sistemi. Berber, kuaför ve güzellik salonları için ücretsiz. ${fresh.month} ${fresh.year} güncel.`;
    const ogDescription = 'İşletmenize özel web linkiyle sıra beklemeden 7/24 online randevu alma.';
    const ogImage = `${origin}/brand/phone_mockup_retina.png`;

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Dükkanım Yanımda - 7/24 Online Randevu Motoru',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
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

    const faqJson = [
      {
        q: 'Online randevu linkini nereden paylaşabilirim?',
        a: 'Dükkanınıza özel oluşturulan web linkini Instagram biyografinize, WhatsApp işletme profiline veya Google Haritalar profilinize "Randevu Al" butonu olarak ekleyebilirsiniz.',
      },
      {
        q: 'Müşteri randevu alırken üye olmak veya uygulama indirmek zorunda mı?',
        a: 'Hayır! Müşterileriniz hiçbir uygulama indirmeden tarayıcı üzerinden 15 saniyede adını, telefonunu ve saatini seçerek randevu alabilir.',
      },
      {
        q: 'Randevular doğrudan panele düşer mi?',
        a: 'Evet, randevu anında panelinize ve takviminize işlenir; çakışma riski olmadan koltuk rezerve edilir.',
      },
    ];

    return { title, ogTitle, description, ogDescription, ogImage, canonical, schemaJson, breadcrumbs, faqJson };
  }

  if (
    clean === '/kafe-restoran' ||
    clean === '/kafe' ||
    clean === '/restoran' ||
    clean === '/adisyon' ||
    clean === '/qr-menu'
  ) {
    const canonical = `${origin}/kafe-restoran`;
    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Kafe & Restoran Adisyon Sistemi', url: canonical },
    ];
    const faqJson = [
      {
        q: 'Kafe ve restoranlarda canlı masa ve adisyon takibi nasıl yapılır?',
        a: 'Masalarınızı salona göre yerleştirin. Müşteri oturduğunda tek tıkla adisyon açın, siparişleri ekleyin, kalkarken nakit veya kartla kapatın.',
      },
      {
        q: 'Temassız dijital QR menü ve garson çağırma nasıl çalışır?',
        a: 'Masalarınıza özel karekodları yapıştırın. Müşteri kamerasını okuttuğunda menüyü görür ve tek tıkla garson veya hesap çağırabilir.',
      },
      {
        q: 'Gün sonu ciro ve kasa raporları anlık görünür mü?',
        a: 'Evet, kasanızdaki nakit ve kredi kartı cirosu, açık masalar ve en çok satan ürünler gün sonunda kuruşu kuruşuna tek ekranda raporlanır.',
      },
      {
        q: 'Sistem tablet veya telefondan kurulumsuz çalışır mı?',
        a: 'Evet, hiçbir donanım veya karmaşık POS cihazı gerektirmez; mevcut telefonunuzdan veya tabletinizden tarayıcıyla anında çalışır.',
      },
    ];

    return {
      title: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Yazılımı | Dükkanım Yanımda',
      ogTitle: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Sistemi',
      description: 'Canlı masa takibi, garson çağrı sistemli temassız QR menü, adisyon kapatma ve gün sonu ciro raporları. Kurulumsuz, hemen kullanın.',
      ogDescription: 'Canlı masa takibi, garson çağrı sistemli temassız QR menü, adisyon kapatma ve gün sonu ciro raporları.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical,
      breadcrumbs,
      faqJson,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Kafe & Restoran Adisyon Sistemi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
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
    clean === '/bakkal' ||
    clean === '/market' ||
    clean === '/bakkal-market' ||
    clean === '/veresiye-defteri' ||
    clean === '/pos-sistemi'
  ) {
    const canonical = `${origin}/bakkal-market`;
    const breadcrumbs = [
      { name: 'Ana Sayfa', url: origin },
      { name: 'Bakkal & Market POS Sistemi', url: canonical },
    ];
    const faqJson = [
      {
        q: 'Bakkal veresiye defteri telefondan nasıl tutulur?',
        a: 'Müşterinizi bir kez kaydedin. Aldığı ürünleri veya toplam tutarı tek tuşla borcuna yazın. Bakiyesi ve hesap dökümü cebinizde her an hazırdır.',
      },
      {
        q: 'Müşteriye tek tıkla WhatsApp borç özeti nasıl gönderilir?',
        a: 'Müşteri detayından "WhatsApp ile Hatırlat" butonuna bastığınızda, kibar bir dille son işlemler ve kalan borç tutarı otomatik mesaj olarak hazırlanır.',
      },
      {
        q: 'Barkod okuyucu olmadan telefon kamerasıyla satış yapılır mı?',
        a: 'Evet, telefon kamerası barkod okuyucu olarak kullanılır; barkodu okutulan ürün anında sepete eklenir.',
      },
      {
        q: 'Terazili ürünler ve gramajlı satış destekleniyor mu?',
        a: 'Evet, manav ve şarküteri ürünlerinde gramaj preseti veya ondalıklı kilo girişiyle anlık hesaplama yapılır.',
      },
    ];

    return {
      title: 'Bakkal & Market Hızlı POS Barkodlu Terazi ve Veresiye Takip Sistemi | Dükkanım Yanımda',
      ogTitle: 'Bakkal & Market Hızlı POS ve Veresiye Takip Sistemi',
      description: 'Mahallenin veresiye defteri cebinde! Barkodlu hızlı satış, kritik stok uyarıları, WhatsApp ile tek tıkla borç hatırlatma.',
      ogDescription: 'Mahallenin veresiye defteri cebinde! Barkodlu hızlı satış, kritik stok ve WhatsApp hatırlatma.',
      ogImage: `${origin}/brand/logo-horizontal.png`,
      canonical,
      breadcrumbs,
      faqJson,
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dükkanım Yanımda - Bakkal & Market POS Sistemi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
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
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
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
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
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
      ogImage: `${origin}/brand/logo-horizontal.png`,
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
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
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
      ogImage: `${origin}/brand/logo-horizontal.png`,
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
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
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

  // 3.5. Kamusal Servis & Emanet Durum Takip Ekranı (/t/:code)
  if (clean.startsWith('/t/')) {
    return {
      title: 'Canlı Servis & Emanet Durum Takibi | Dükkanım Yanımda',
      ogTitle: 'Cihaz & Emanet Fişi Durum Sorgulama — Dükkanım Yanımda',
      description: 'Teknik servis cihaz tamir durumu veya terzi emanet teslimat takibini fiş kodunuzla anlık görüntüleyin.',
      ogDescription: 'Servis ve emanet fişi canlı durum sorgulama.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
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
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
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
        numberOfItems: SEO_GUIDE_ARTICLES.length,
        itemListElement: SEO_GUIDE_ARTICLES.map((art, idx) => ({
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
        ogImage: `${origin}/brand/phone_mockup_retina.png`,
        canonical,
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
          datePublished: article.updatedAt,
          dateModified: fresh.todayIso,
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
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
      canonical: `${origin}/rehber`,
      robots: 'noindex, follow',
      breadcrumbs: [
        { name: 'Ana Sayfa', url: origin },
        { name: 'Esnaf Rehberi', url: `${origin}/rehber` },
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
    offers: {
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
      ogImage: `${origin}/brand/logo-horizontal.png`,
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
      ogImage: `${origin}/brand/logo-horizontal.png`,
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
      ogImage: `${origin}/icon-512.png`,
      canonical: `${origin}/iletisim`,
    };
  }

  if (clean === '/gizlilik' || clean === '/gizlilik-politikasi') {
    return {
      title: 'Gizlilik Politikası & KVKK | Dükkanım Yanımda',
      ogTitle: 'Gizlilik Politikası & KVKK Güvencesi',
      description: 'Verileriniz güvende. Dükkan defteriniz ve müşteri bilgileriniz şifreli saklanır ve sadece size aittir.',
      ogDescription: 'Kişisel verileriniz ve dükkan kayıtlarınız %100 güvende.',
      ogImage: `${origin}/icon-512.png`,
      canonical: `${origin}/gizlilik`,
    };
  }

  // 5. Bilinmeyen Rota (404 Not Found)
  if (clean !== '/') {
    return {
      title: 'Sayfa Bulunamadı (404) | Dükkanım Yanımda',
      ogTitle: 'Sayfa Bulunamadı (404) — Dükkanım Yanımda',
      description: 'Aradığınız sayfa bulunamadı, adresi değişmiş veya yayından kaldırılmış olabilir.',
      ogDescription: 'Aradığınız sayfa bulunamadı.',
      ogImage: `${origin}/brand/phone_mockup_retina.png`,
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
    ogImage: `${origin}/brand/phone_mockup_retina.png`,
    canonical: `${origin}/`,
    faqJson: [
      {
        q: 'Uygulama ücretsiz mi?',
        a: 'Evet. Kayıt ol, dükkanını 2 dakikada kur, tüm temel özellikleri ücretsiz kullan. Kredi kartı istemeyiz.',
      },
      {
        q: 'Verilerim güvende mi?',
        a: 'Şifren şifreli saklanır, dükkan verilerin yalnızca sana aittir. Yedekleme özelliğiyle defterini istediğin zaman indirebilirsin.',
      },
      {
        q: 'Telefonda çalışır mı?',
        a: 'Evet. Uygulama mobil uyumludur, telefonuna uygulama gibi kurulur ve dükkanda tek elle kullanılır.',
      },
      {
        q: 'Kağıt defterimden nasıl geçerim?',
        a: 'Müşterilerini tek tek ekle, bugünden itibaren işlemleri gir. Eski borçları açılış bakiyesi olarak işleyebilirsin.',
      },
    ],
    schemaJson: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'Dükkanım Yanımda',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
          description: 'Esnaf için online randevu, QR menü, kasa, veresiye defteri ve gün sonu takip sistemi.',
        },
        {
          '@type': 'Organization',
          name: 'Dükkanım Yanımda',
          url: `${origin}/`,
          logo: `${origin}/icon-512.png`,
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
              telephone: s.phone,
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
        <a href="/kafe-restoran" style="color:#cbd5e1;text-decoration:none;">Kafe &amp; QR Menü</a>
        <a href="/bakkal-market" style="color:#cbd5e1;text-decoration:none;">Bakkal &amp; POS</a>
        <a href="/teknik-servis" style="color:#cbd5e1;text-decoration:none;">Teknik Servis</a>
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
        <a href="/kafe-restoran" style="color:#cbd5e1;text-decoration:none;">Kafe &amp; Restoran</a>
        <a href="/bakkal-market" style="color:#cbd5e1;text-decoration:none;">Bakkal &amp; Market</a>
        <a href="/teknik-servis" style="color:#cbd5e1;text-decoration:none;">Teknik Servis</a>
        <a href="/hukuk" style="color:#cbd5e1;text-decoration:none;">Hukuk Bürosu</a>
        <a href="/terzi" style="color:#cbd5e1;text-decoration:none;">Terzi &amp; Kuru Temizleme</a>
        <a href="/rehber" style="color:#cbd5e1;text-decoration:none;">Esnaf Rehberi</a>
        <a href="/fiyat" style="color:#cbd5e1;text-decoration:none;">Fiyatlar</a>
        <a href="/iletisim" style="color:#cbd5e1;text-decoration:none;">İletişim</a>
        <a href="/gizlilik" style="color:#cbd5e1;text-decoration:none;">Gizlilik &amp; KVKK</a>
      </nav>
      <p style="margin:0;color:#64748b;">© ${fresh.year} Dükkânım Yanımda — Türkiye Esnaf ve KOBİ'leri İçin Geliştirildi.</p>
    </div>
  </footer>`;

  let mainBodyContent = '';

  // 1. Randevu Rotaları: /r/:slug veya /randevu/:slug
  if (clean.startsWith('/r/') || clean.startsWith('/randevu/')) {
    const slug = clean.replace(/^\/(r|randevu)\/?/, '');
    const shop = findShopForSeo(slug, 'barber');
    if (shop) {
      const shopLogo = shop.logoUrl
        ? (shop.logoUrl.startsWith('http') ? shop.logoUrl : `${origin}${shop.logoUrl}`)
        : `${origin}/brand/phone_mockup_retina.png`;

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
            <p style="font-size:14px;color:#64748b;margin:0;">📍 ${escapeHtml(shop.cityDistrict || 'Türkiye')} &nbsp;·&nbsp; 📞 ${escapeHtml(shop.phone || '0555 000 0000')} &nbsp;·&nbsp; 🕒 ${escapeHtml(shop.openingTime || '09:00')} - ${escapeHtml(shop.closingTime || '21:00')}</p>
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
          <a href="/r/${escapeHtml(shop.slug)}" style="display:inline-block;background:#ea580c;color:#ffffff;font-size:14px;font-weight:800;padding:10px 24px;border-radius:10px;text-decoration:none;box-shadow:0 4px 12px rgba(234,88,12,0.25);">Randevu Saatini Seç</a>
        </div>
      </article>`;
    }
  }

  // 2. QR Menü Rotaları: /m/:slug veya /menu/:slug veya /menu
  else if (clean.startsWith('/m/') || clean.startsWith('/menu/') || clean === '/menu') {
    const slug = clean === '/menu' ? 'demo' : clean.replace(/^\/(m|menu)\/?/, '');
    const shop = findShopForSeo(slug, 'menu');
    if (shop) {
      const shopLogo = shop.logoUrl
        ? (shop.logoUrl.startsWith('http') ? shop.logoUrl : `${origin}${shop.logoUrl}`)
        : `${origin}/brand/phone_mockup_retina.png`;

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
            <p style="font-size:14px;color:#64748b;margin:0;">📍 ${escapeHtml(shop.cityDistrict || 'Türkiye')} &nbsp;·&nbsp; 📞 ${escapeHtml(shop.phone || 'İletişim')} &nbsp;·&nbsp; 🕒 ${escapeHtml(shop.openingTime || '09:00')} - ${escapeHtml(shop.closingTime || '22:00')}</p>
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
      </article>`;
    }
  }

  // 3. Berber Sayfası
  else if (clean === '/berber' || clean === '/berber-randevu-programi') {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;line-height:1.2;">Berber Randevu &amp; Koltuk Yönetim Sistemi</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:24px;">Koltuk sırası, online randevu takvimi, usta ve kalfa prim hesabı, anlık kasa takibi tek ekranda. Kağıt defteri tarihe gömün; dükkanınızı cebinizden yönetin.</p>

      <section style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:32px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Koltuk Sırası &amp; Randevu Takvimi</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Günün randevuları, bekleyen müşteriler ve koltuktaki işlemler tek ekranda; no-show yüzünden koltuklar boş kalmaz.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Usta ve Kalfa Prim Dağılımı</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Hangi koltuk ne kazandırdı, usta ve çırak primleri kuruşu kuruşuna akşam tek tıkla hesaplanır.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">WhatsApp Randevu Hatırlatma</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Randevu saati öncesi müşteriye tek dokunuşla otomatik WhatsApp hatırlatması gönderilir.</p>
        </div>
      </section>

      <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
        <h2 style="font-size:22px;font-weight:900;margin:0 0 8px 0;">Berber Dükkanınızı 2 Dakikada Kurun</h2>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 18px 0;">Kredi kartı gerekmez. Hemen ücretsiz kayıt olun, dükkanınızı cebinize alın.</p>
        <a href="/kayit" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">Ücretsiz Başla</a>
      </div>
    </article>`;
  }

  // 4. Kuaför Salonu Sayfası
  else if (clean === '/kuafor' || clean === '/kuafor-randevu' || clean === '/kadin-kuafor') {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;line-height:1.2;">Kuaför Randevu ve Salon Takip Programı</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:24px;">Kadın ve erkek kuaför salonları için saç renklendirme, kesim, bakım randevuları, personel primleri ve randevu çakışma önleme sistemi.</p>

      <section style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:32px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">İşlem Süresi Bazlı Akıllı Takvim</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Boya, röfle, fön ve saç kesimi gibi farklı sürelerdeki işlemler için çakışmasız randevu planlaması.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Gelin Başı &amp; Özel Gün Rezervasyonları</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Aylar öncesinden özel gün blokajları, kapora ve kalan bakiye takibi tek kartta tutulur.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Personel Hakediş &amp; Koltuk Cirosu</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Hangi uzmanın ne kadar ciro getirdiği ve prim hak edişleri akşam tek tıkla önünüzde.</p>
        </div>
      </section>

      <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
        <h2 style="font-size:22px;font-weight:900;margin:0 0 8px 0;">Kuaför Salonunuzu Hemen Dijitale Taşıyın</h2>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 18px 0;">Online müşteri randevu linkiniz 2 dakikada hazır. Kredi kartı istemeyiz.</p>
        <a href="/kayit" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">Kuaför Panelini Başlat</a>
      </div>
    </article>`;
  }

  // 5. Online Randevu Sistemi Genel Sayfası
  else if (clean === '/randevu-sistemi' || clean === '/online-randevu') {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;line-height:1.2;">7/24 Canlı Online Randevu ve Rezervasyon Sistemi</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:24px;">İşletmenize özel web linkiyle müşterileriniz sıra beklemeden usta, hizmet ve müsait saat seçer. Randevular panelinize anında düşer, koltuklar asla boş kalmaz.</p>

      <section style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:32px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Kişiselleştirilmiş Randevu Linki</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">dukkanimyanimda.com.tr/r/dukkan-adiniz linkini Instagram veya WhatsApp bio'nuza ekleyin, 7/24 randevu kabul edin.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Sıfır No-Show (Gelmeyen Müşteri)</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Otomatik WhatsApp teyit ve saat öncesi nazik hatırlatmalar ile randevu fire oranı sıfıra yaklaşır.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Kurulumsuz &amp; Mobil Uyumlu</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Müşteri hiçbir uygulama indirmeden tarayıcıdan randevu alır; işletme sahibi tek elle cepten onaylar.</p>
        </div>
      </section>

      <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
        <h2 style="font-size:22px;font-weight:900;margin:0 0 8px 0;">Kendi Randevu Linkinizi Hemen Alın</h2>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 18px 0;">2 dakikada ücretsiz kurun, müşterileriniz online randevu almaya başlasın.</p>
        <a href="/kayit" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">Ücretsiz Randevu Linkini Oluştur</a>
      </div>
    </article>`;
  }

  // 6. Güzellik Salonu
  else if (clean === '/guzellik-salonu' || clean === '/guzellik-merkezi' || clean === '/guzellik' || clean === '/lazer-epilasyon') {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;line-height:1.2;">Güzellik Salonu ve Merkez Yönetim Sistemi — Seans &amp; Paket Takibi</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:24px;">Seans paketleri, estetisyen takvimi, uzman primleri ve kapora takibi tek ekranda. Cilt bakımı, lazer epilasyon, kalıcı makyaj ve tırnak işlemlerinde seans kaçırma son bulur.</p>

      <section style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:32px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Seans &amp; Paket Sayacı</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">6-8 seanslık lazer paketlerinde kalan seans sayısı ve borç durumu her randevuda anında güncellenir.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Oda ve Kabin Planlaması</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Hangi uzmanın hangi odada çalıştığı takvimde renklerle ayrılır, çift rezervasyon riski önlenir.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Instagram Randevu Linki</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Instagram biyografinize ekleyeceğiniz bağlantıyla müşterileriniz 7/24 seans randevusu oluşturabilir.</p>
        </div>
      </section>

      <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
        <h2 style="font-size:22px;font-weight:900;margin:0 0 8px 0;">Güzellik Merkezinizi Hemen Kolaylaştırın</h2>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 18px 0;">Müşteri takibi ve seans defterinizi hemen ücretsiz başlatın.</p>
        <a href="/kayit" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">Ücretsiz Başla</a>
      </div>
    </article>`;
  }

  // 7. Kafe & Restoran
  else if (clean === '/kafe-restoran' || clean === '/kafe' || clean === '/restoran' || clean === '/adisyon' || clean === '/qr-menu') {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;line-height:1.2;">Kafe &amp; Restoran Masalar, Adisyon ve QR Menü Yazılımı</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:24px;">Canlı masa takibi, garson çağrı sistemli temassız QR menü, adisyon kapatma ve gün sonu ciro raporları. Pahalı POS donanımları olmadan hemen cepten kullanın.</p>

      <section style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:32px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Canlı Masalar &amp; Adisyon Takibi</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Masalarınıza tek dokunuşla sipariş ekleyin, açık hesapları takip edin veya nakit/kartla anında kapatın.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Temassız Dijital Karekod Menü</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Müşteri kamerasını okuttuğunda fotoğraflı menüyü görür, masadan garson çağırabilir veya hesap isteyebilir.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Gün Sonu Kasa Raporu</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Nakit, kredi kartı cirosu ve açık adisyonlar akşam kuruşu kuruşuna tek ekranda denkleştirilir.</p>
        </div>
      </section>

      <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
        <h2 style="font-size:22px;font-weight:900;margin:0 0 8px 0;">Kafe Masalarınızı ve Menünüzü Şimdi Oluşturun</h2>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 18px 0;">2 dakikada masalarınızı ekleyin, QR menünüzü masalara yapıştırın.</p>
        <a href="/kayit" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">Kafe Panelini Başlat</a>
      </div>
    </article>`;
  }

  // 8. Bakkal & Market
  else if (clean === '/bakkal-market' || clean === '/bakkal' || clean === '/market' || clean === '/veresiye-defteri' || clean === '/pos-sistemi') {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <h1 style="font-size:32px;font-weight:900;color:#0f172a;margin-bottom:12px;line-height:1.2;">Bakkal &amp; Market Hızlı POS Barkodlu Terazi ve Veresiye Takip Sistemi</h1>
      <p style="font-size:16px;color:#475569;line-height:1.6;margin-bottom:24px;">Mahallenin veresiye defteri cebinde! Telefon kamerasıyla barkod okuma, kritik stok uyarıları ve WhatsApp tek tıkla borç hatırlatma.</p>

      <section style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:32px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Kamera ile Hızlı Barkod Okuma</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Pahalı barkod okuyucu almadan telefon kamerasıyla anında barkod okutun, sepeti saniyede oluşturun.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Dijital Veresiye Defteri</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Müşteri borçları asla kaybolmaz; WhatsApp üzerinden tek tıkla nazik borç ekstresi gönderin.</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="font-size:17px;font-weight:800;color:#ea580c;margin:0 0 8px 0;">Kritik Stok Uyarıları</h2>
          <p style="font-size:14px;color:#64748b;margin:0;line-height:1.5;">Tükenmek üzere olan ürünler için anında uyarı alın, toptancı siparişinizi geciktirmeyin.</p>
        </div>
      </section>

      <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
        <h2 style="font-size:22px;font-weight:900;margin:0 0 8px 0;">Veresiye Defterinizi Hemen Güvene Alın</h2>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 18px 0;">Kayıp borçlara son verin. Ücretsiz kayıt olun.</p>
        <a href="/kayit" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">Ücretsiz Başla</a>
      </div>
    </article>`;
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
        <span style="font-size:14px;font-weight:700;color:#9a3412;">Müşterinizin göreceği canlı tamir durumu ekranını test edin:</span>
        <a href="/t/demo" style="color:#ea580c;font-weight:900;font-size:14px;text-decoration:none;">Canlı Fiş Takip Demosu (/t/demo) →</a>
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
        <span style="font-size:14px;font-weight:700;color:#9a3412;">Müşterinizin fiş durumu sorgulayacağı ekranı inceleyin:</span>
        <a href="/t/demo" style="color:#ea580c;font-weight:900;font-size:14px;text-decoration:none;">Canlı Emanet Fişi Takip Demosu (/t/demo) →</a>
      </div>

      <div style="background:#0f172a;color:#ffffff;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
        <h2 style="font-size:22px;font-weight:900;margin:0 0 8px 0;">Terzi ve Kuru Temizleme Fişlerinizi Dijitalleştirin</h2>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 18px 0;">2 dakikada ücretsiz kayıt olun, kayıp fiş sorununu bitirin.</p>
        <a href="/kayit" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">Terzi Panelini Başlat</a>
      </div>
    </article>`;
  }

  // 11.5. Canlı Servis & Emanet Fişi Takibi (/t/:code)
  else if (clean.startsWith('/t/')) {
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

  // 14. Ana Sayfa (Default /)
  else {
    mainBodyContent = `
    <article style="max-width:960px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:40px;">
        <span style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#ea580c;background:#fff7ed;padding:4px 12px;border-radius:20px;border:1px solid #fed7aa;">Türkiye'nin Yeni Nesil Esnaf İşletim Sistemi</span>
        <h1 style="font-size:36px;font-weight:900;color:#0f172a;margin:14px 0 12px 0;line-height:1.15;">Defteri Kapat, Dükkânını Cebine Al</h1>
        <p style="font-size:17px;color:#475569;max-width:680px;margin:0 auto 24px auto;line-height:1.6;">Dükkanının kasa, veresiye defteri, randevu takvimi, QR menüsü ve gün sonu defteri — hepsi tek yerde cebinizde.</p>
        <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
          <a href="/kayit" style="background:#ea580c;color:#ffffff;font-size:15px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">14 Gün Ücretsiz Başla</a>
          <a href="/berber" style="background:#f1f5f9;color:#0f172a;font-size:15px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;border:1px solid #cbd5e1;">Berber Panelini İncele</a>
        </div>
      </div>

      <section style="margin-bottom:40px;">
        <h2 style="font-size:22px;font-weight:900;color:#0f172a;margin-bottom:16px;text-align:center;">Sektörünüze Özel Dijital Çözümler</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;">
          <a href="/berber" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;display:block;">
            <h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">Berber &amp; Kuaför</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Koltuk sırası, online randevu takvimi ve usta primleri tek ekranda.</p>
          </a>
          <a href="/kuafor" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;display:block;">
            <h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">Kuaför Salonu</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">İşlem bazlı süre planlaması, boya/kesim takvimi ve personel primleri.</p>
          </a>
          <a href="/randevu-sistemi" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;display:block;">
            <h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">7/24 Online Randevu</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Web linkiyle Instagram ve WhatsApp üzerinden sıra beklemeden rezervasyon.</p>
          </a>
          <a href="/kafe-restoran" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;display:block;">
            <h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">Kafe &amp; Restoran</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Canlı masa takibi, temassız karekod QR menü ve anlık adisyon kapatma.</p>
          </a>
          <a href="/bakkal-market" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;display:block;">
            <h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">Bakkal &amp; Market</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Telefon kamerasıyla barkodlu hızlı POS satış ve veresiye defteri.</p>
          </a>
          <a href="/guzellik-salonu" style="text-decoration:none;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;display:block;">
            <h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">Güzellik Salonu</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Lazer epilasyon paketleri, seans sayacı ve estetisyen kabin planı.</p>
          </a>
        </div>
      </section>

      <section style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;margin-bottom:40px;">
        <h2 style="font-size:20px;font-weight:900;color:#0f172a;margin:0 0 10px 0;">Türkiye Esnaf İletişim Ağı &amp; Canlı Esnaf Haritası</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 16px 0;">Kadıköy, Nişantaşı, Çankaya, Alsancak ve Türkiye genelindeki yüzlerce işletme Dükkânım Yanımda ile çalışıyor.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <a href="/r/demo" style="color:#ea580c;font-weight:800;font-size:14px;text-decoration:none;">Berber Demo Randevu →</a>
          <a href="/m/demo" style="color:#ea580c;font-weight:800;font-size:14px;text-decoration:none;">Kafe Demo QR Menü →</a>
        </div>
      </section>
    </article>`;
  }

  const isSectorLanding = [
    '/berber', '/berber-randevu-programi',
    '/kuafor', '/kuafor-randevu', '/kadin-kuafor',
    '/randevu-sistemi', '/online-randevu',
    '/guzellik-salonu', '/guzellik-merkezi', '/guzellik', '/lazer-epilasyon',
    '/kafe-restoran', '/kafe', '/restoran', '/adisyon', '/qr-menu',
    '/bakkal-market', '/bakkal', '/market', '/veresiye-defteri', '/pos-sistemi',
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

  // Semantik SSR HTML Gövdesi Enjeksiyonu (Boş <div id="root"> Sorununu Kökten Çözer)
  const ssrBodyHtml = generateSsrBodyHtml(pathname, meta, host);
  html = html.replace(/<div\s+id=["']root["']>\s*<\/div>/i, `<div id="root">${ssrBodyHtml}</div>`);

  return html;
}

function isExcludedAccount(acc: { id: string; shopName?: string; phone?: string }): boolean {
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
  const today = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: `${origin}/`, priority: '1.0', changefreq: 'weekly', title: 'Dükkânım Yanımda - Esnaf Yönetim Sistemi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/berber`, priority: '1.0', changefreq: 'daily', title: 'Berber Randevu & Koltuk Yönetim Sistemi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/kuafor`, priority: '0.95', changefreq: 'daily', title: 'Kuaför Randevu ve Salon Takip Programı', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/guzellik-salonu`, priority: '1.0', changefreq: 'daily', title: 'Güzellik Salonu ve Merkez Yönetim Sistemi — Seans & Paket Takibi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/randevu-sistemi`, priority: '0.95', changefreq: 'daily', title: '7/24 Online Randevu ve Rezervasyon Sistemi', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/kafe-restoran`, priority: '0.95', changefreq: 'weekly', title: 'Kafe & Restoran Masalar, Adisyon ve QR Menü Yazılımı', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/bakkal-market`, priority: '0.95', changefreq: 'weekly', title: 'Bakkal & Market Hızlı POS Barkodlu Terazi Sistemi', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/fiyat`, priority: '0.9', changefreq: 'weekly', title: 'Fiyatlandırma & Esnaf Paketleri', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/kayit`, priority: '0.9', changefreq: 'monthly', title: 'Ücretsiz Kayıt - Dükkanını 2 Dakikada Kur', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/teknik-servis`, priority: '0.8', changefreq: 'weekly', title: 'Teknik Servis Cihaz Takip ve Tamir Fişi Yazılımı', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/hukuk`, priority: '0.8', changefreq: 'weekly', title: 'Avukat ve Hukuk Bürosu Dava Takip ve Masraf Yazılımı', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/terzi`, priority: '0.8', changefreq: 'weekly', title: 'Terzi & Kuru Temizleme Emanet Takip Sistemi', img: `${origin}/brand/logo-horizontal.png` },
    { loc: `${origin}/iletisim`, priority: '0.6', changefreq: 'monthly', title: 'İletişim & Destek', img: `${origin}/icon-512.png` },
    { loc: `${origin}/gizlilik`, priority: '0.4', changefreq: 'yearly', title: 'Gizlilik Politikası & KVKK Güvencesi', img: `${origin}/icon-512.png` },
    { loc: `${origin}/rehber`, priority: '0.9', changefreq: 'weekly', title: 'Esnaf Rehberi, Prim Hesaplayıcı & Ücretsiz QR Araçları', img: `${origin}/brand/phone_mockup_retina.png` },
    ...SEO_GUIDE_ARTICLES.map((art) => ({
      loc: `${origin}/rehber/${art.slug}`,
      priority: '0.85',
      changefreq: 'weekly',
      title: art.title,
      img: `${origin}/brand/phone_mockup_retina.png`,
    })),
  ];

  // Aktif dükkanların dinamik linkleri
  const shopUrls: { loc: string; priority: string; changefreq: string; title: string; img: string }[] = [];
  const accounts = getAccounts();
  const seenSlugs = new Set<string>();

  // Demo hesap da eklensin
  seenSlugs.add('demo');
  shopUrls.push(
    { loc: `${origin}/r/demo`, priority: '0.85', changefreq: 'daily', title: 'Demo Berber - Online Randevu Al', img: `${origin}/brand/phone_mockup_retina.png` },
    { loc: `${origin}/m/demo`, priority: '0.85', changefreq: 'daily', title: 'Demo Kafe - Dijital QR Menü & Fiyatlar', img: `${origin}/brand/phone_mockup_retina.png` }
  );

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

      const shopLogo = st.shopProfile?.logoUrl
        ? (st.shopProfile.logoUrl.startsWith('http') ? st.shopProfile.logoUrl : `${origin}${st.shopProfile.logoUrl}`)
        : `${origin}/brand/phone_mockup_retina.png`;

      // Randevu sayfası: Yalnızca berber/kuaför/güzellik veya randevu servisi tanımlanmış dükkanlar
      if ((isBarberSector && isConfigured) || hasBarberServices) {
        shopUrls.push({
          loc: `${origin}/r/${slug}`,
          priority: '0.8',
          changefreq: 'daily',
          title: `${storeName} - Online Randevu Al`,
          img: shopLogo,
        });
      }

      // QR Menü sayfası: SADECE kafe/restoran sektöründeki ve gerçekten menü ürünleri girilmiş dükkanlar
      if (isCafeSector && hasMenuItems) {
        shopUrls.push({
          loc: `${origin}/m/${slug}`,
          priority: '0.8',
          changefreq: 'daily',
          title: `${storeName} - Dijital QR Menü & Fiyatlar`,
          img: shopLogo,
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
    <lastmod>${today}</lastmod>
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
