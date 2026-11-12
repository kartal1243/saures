import type { Express, Request, Response } from 'express';
import type { PublicShopMapItem } from '../../shared/types';
import { getAccounts } from '../accounts';
import { loadShopState } from '../shopState';
import { publicActionRateLimit } from '../guards';

// ============================================================================
// TÜRKİYE ŞEHİR & İLÇE MERKEZ KOORDİNATLARI (Yedek Harita Konumlayıcı)
// ============================================================================
const TURKEY_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  istanbul: { lat: 41.0082, lng: 28.9784 },
  ankara: { lat: 39.9334, lng: 32.8597 },
  izmir: { lat: 38.4237, lng: 27.1428 },
  bursa: { lat: 40.1885, lng: 29.0610 },
  antalya: { lat: 36.8969, lng: 30.7133 },
  adana: { lat: 37.0000, lng: 35.3213 },
  konya: { lat: 37.8746, lng: 32.4932 },
  gaziantep: { lat: 37.0662, lng: 37.3833 },
  sanliurfa: { lat: 37.1674, lng: 38.7955 },
  kocaeli: { lat: 40.7654, lng: 29.9408 },
  mersin: { lat: 36.8121, lng: 34.6415 },
  diyarbakir: { lat: 37.9144, lng: 40.2306 },
  hatay: { lat: 36.2023, lng: 36.1606 },
  manisa: { lat: 38.6191, lng: 27.4289 },
  kayseri: { lat: 38.7205, lng: 35.4826 },
  samsun: { lat: 41.2867, lng: 36.3300 },
  balikesir: { lat: 39.6484, lng: 27.8826 },
  kahramanmaras: { lat: 37.5753, lng: 36.9228 },
  van: { lat: 38.4946, lng: 43.3832 },
  aydin: { lat: 37.8444, lng: 27.8458 },
  denizli: { lat: 37.7765, lng: 29.0864 },
  sakarya: { lat: 40.7569, lng: 30.3783 },
  tekirdag: { lat: 40.9781, lng: 27.5117 },
  mugla: { lat: 37.2153, lng: 28.3636 },
  eskisehir: { lat: 39.7767, lng: 30.5206 },
  trabzon: { lat: 41.0027, lng: 39.7168 },
  erzurum: { lat: 39.9043, lng: 41.2679 },
  malatya: { lat: 38.3552, lng: 38.3095 },
  ordu: { lat: 40.9839, lng: 37.8764 },
  sivas: { lat: 39.7477, lng: 37.0179 },
  kadikoy: { lat: 40.9927, lng: 29.0277 },
  besiktas: { lat: 41.0428, lng: 29.0077 },
  sisli: { lat: 41.0602, lng: 28.9877 },
  uskudar: { lat: 41.0267, lng: 29.0153 },
  fatih: { lat: 41.0182, lng: 28.9497 },
  cankaya: { lat: 39.9080, lng: 32.8597 },
  karsiyaka: { lat: 38.4593, lng: 27.1106 },
  bornova: { lat: 38.4697, lng: 27.2185 },
  muratpasa: { lat: 36.8841, lng: 30.7056 },
};

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

/**
 * Şehir / İlçe metninden yaklaşık harita koordinatı türetir.
 * Çoklu dükkanların üst üste binmemesi için deterministik küçük bir sapma (jitter) ekler.
 */
function resolveFallbackCoordinates(cityDistrict: string, seedId: string): { lat: number; lng: number } {
  const norm = normalizeText(cityDistrict || '');
  let base = TURKEY_CITY_COORDINATES.istanbul;

  for (const [key, coords] of Object.entries(TURKEY_CITY_COORDINATES)) {
    if (norm.includes(key)) {
      base = coords;
      break;
    }
  }

  // Deterministik küçük sapma (+/- 0.015 derece, yaklaşık 1-2 km)
  let hash = 0;
  for (let i = 0; i < seedId.length; i++) {
    hash = (hash << 5) - hash + seedId.charCodeAt(i);
    hash |= 0;
  }
  const jitterLat = ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.02;
  const jitterLng = ((Math.abs(hash >> 3) % 1000) / 1000 - 0.5) * 0.02;

  return {
    lat: Number((base.lat + jitterLat).toFixed(5)),
    lng: Number((base.lng + jitterLng).toFixed(5)),
  };
}

// ============================================================================
// KAMUSAL HARİTA UCU (STRICT KVKK & PRIVACY COMPLIANT)
// ============================================================================
export function registerPublicShopsMapRoutes(app: Express): void {
  /**
   * GET /api/public/shops-map
   * Kamusal haritada listelenecek onaylı esnafları döner.
   *
   * 🛡️ KESİN KVKK VE GİZLİLİK KURALLARI:
   * 1. Esnafın şahsi telefon numarası (GSM), T.C. kimlik veya evrakları ASLA DÖNÜLMEZ.
   * 2. Esnafın cirosu, kasa bakiyesi, günlük gelir/giderleri ASLA DÖNÜLMEZ.
   * 3. Müşteri listesi, randevu kayıtları ve borç/veresiye defteri ASLA DÖNÜLMEZ.
   * 4. Esnafın şahıs adı (ownerName) DÖNÜLMEZ; yalnızca işletme adı (name) döner.
   * 5. 'showOnPublicMap === false' olan esnaflar haritada tamamen gizlenir.
   */
  app.get('/api/public/shops-map', publicActionRateLimit, (req: Request, res: Response) => {
    const sectorFilter = req.query.sector as string;
    const cityFilter = req.query.city as string;
    const searchFilter = (req.query.search as string || '').toLowerCase().trim();

    const accounts = getAccounts();
    const mapShops: PublicShopMapItem[] = [];

    for (const acc of accounts) {
      // 1. Sadece ana dükkan sahipleri haritada yer alabilir (Kasiyer/personel hesapları atlanır)
      if ((acc.role || 'owner') !== 'owner') continue;

      const st = loadShopState(acc.id);
      const prof = st.shopProfile;

      // 2. Profil yapılandırılmamış veya adı boşsa haritaya ekleme
      const shopName = prof?.storeName || acc.shopName;
      if (!shopName || shopName.trim().length < 2) continue;

      // 3. KVKK KONTROLÜ: showOnPublicMap === false ise esnafı haritada GİZLE!
      if (prof?.showOnPublicMap === false) {
        continue;
      }

      // 4. Şehir ve İlçe ayrıştırma
      const cityDistrict = (prof?.cityDistrict || '').trim();
      const parts = cityDistrict.split(/[\/\-,]/).map((p) => p.trim());
      const city = parts[0] || 'İstanbul';
      const district = parts[1] || '';

      // 5. Filtreleme kontrolleri
      const sectorKey = prof?.sectorKey || 'genel_esnaf';
      if (sectorFilter && sectorFilter !== 'all' && sectorFilter !== 'tum') {
        if (sectorKey !== sectorFilter) continue;
      }

      if (cityFilter && cityFilter !== 'all') {
        if (!normalizeText(city).includes(normalizeText(cityFilter))) continue;
      }

      if (searchFilter) {
        const matchesName = shopName.toLowerCase().includes(searchFilter);
        const matchesCity = city.toLowerCase().includes(searchFilter);
        const matchesDistrict = district.toLowerCase().includes(searchFilter);
        const matchesSector = (prof?.businessField || '').toLowerCase().includes(searchFilter);
        if (!matchesName && !matchesCity && !matchesDistrict && !matchesSector) {
          continue;
        }
      }

      // 6. Koordinat Belirleme:
      // Esnaf şahsi koordinat kaydettiyse ve Türkiye sınırları içindeyse kullan;
      // Yoksa şehir/ilçe merkezinden güvenli fallback üret.
      let coordinates: { lat: number; lng: number };
      if (
        prof?.coordinates &&
        typeof prof.coordinates.lat === 'number' &&
        typeof prof.coordinates.lng === 'number' &&
        prof.coordinates.lat >= 35.0 &&
        prof.coordinates.lat <= 42.5 &&
        prof.coordinates.lng >= 25.5 &&
        prof.coordinates.lng <= 45.0
      ) {
        coordinates = {
          lat: Number(prof.coordinates.lat.toFixed(5)),
          lng: Number(prof.coordinates.lng.toFixed(5)),
        };
      } else {
        coordinates = resolveFallbackCoordinates(cityDistrict, acc.id);
      }

      const slug = prof?.slug || acc.id;

      // 7. Yönlendirme ve yetenek kontrolü (Randevu var mı? Menü var mı?)
      const hasBooking = sectorKey === 'berber_kuafor' || sectorKey === 'teknik_servis';
      const hasMenu = sectorKey === 'kafe_restoran';

      const servicesCount = Array.isArray(st.barberServices)
        ? st.barberServices.length
        : Array.isArray((st as any).services)
        ? (st as any).services.length
        : Array.isArray(st.menuItems)
        ? st.menuItems.length
        : (st.products || []).length;

      // 8. KATI KVKK VE VERİ MİNİMİZASYONU:
      // Esnafın şahsi telefonu (phone), cirosu, müşterileri ASLA DÖNÜLMEZ.
      const publicShopItem: PublicShopMapItem = {
        id: acc.id,
        name: shopName.trim(),
        slug,
        sectorKey,
        city,
        district,
        address: prof?.address || `${district ? district + ', ' : ''}${city}`,
        lat: coordinates.lat,
        lng: coordinates.lng,
        isOpen: true,
        rating: 5.0,
        servicesCount: Math.max(1, servicesCount),
        hasBooking,
        hasMenu,
        slogan: prof?.slogan ? prof.slogan.slice(0, 80) : undefined,
        isVip: Boolean(prof?.isVip),
        // KVKK: phone alanı kasten boş bırakılır (esnaf şahsi cep telefonu gizlidir)
      };

      mapShops.push(publicShopItem);
    }

    // Haritanın Türkiye geneli canlı ve zengin görünmesi için örnek vitrin dükkanları
    const demoShops: PublicShopMapItem[] = [
      {
        id: 'seed_shop_1',
        name: 'Ahmet Barber Club & Kuaför',
        slug: 'demo',
        sectorKey: 'berber_kuafor',
        city: 'İstanbul',
        district: 'Kadıköy',
        address: 'Moda Cd. No: 42, Caferağa, Kadıköy',
        lat: 40.9875,
        lng: 29.0265,
        isOpen: true,
        rating: 4.9,
        servicesCount: 9,
        hasBooking: true,
        hasMenu: false,
        slogan: 'Kişiye Özel Tasarım Saç & Sakal Tıraşı',
        isVip: true,
      },
      {
        id: 'seed_shop_2',
        name: 'Kalamış Gurme Fırın & Kafe',
        slug: 'kalamis-gurme-kafe',
        sectorKey: 'kafe_restoran',
        city: 'İstanbul',
        district: 'Kadıköy',
        address: 'Fenerbahçe Mh., Münir Nurettin Selçuk Cd., Kadıköy',
        lat: 40.9765,
        lng: 29.0385,
        isOpen: true,
        rating: 4.8,
        servicesCount: 24,
        hasBooking: false,
        hasMenu: true,
        slogan: 'Ekşi Mayalı Ekmekler & Dijital QR Menü',
        isVip: true,
      },
      {
        id: 'seed_shop_3',
        name: 'Beşiktaş Çarşı Bakkaliyesi',
        slug: 'besiktas-carsi-bakkal',
        sectorKey: 'bakkal_market',
        city: 'İstanbul',
        district: 'Beşiktaş',
        address: 'Köyiçi Meydan Sk. No: 15, Beşiktaş',
        lat: 41.0435,
        lng: 29.0062,
        isOpen: true,
        rating: 4.7,
        servicesCount: 150,
        hasBooking: false,
        hasMenu: false,
        slogan: 'Mahallenin 30 Yıllık Güler Yüzlü Bakkalı',
        isVip: false,
      },
      {
        id: 'seed_shop_4',
        name: 'Akaretler Saç Tasarım & Spa',
        slug: 'akaretler-sac-tasarim',
        sectorKey: 'berber_kuafor',
        city: 'İstanbul',
        district: 'Beşiktaş',
        address: 'Süleyman Seba Cd. No: 64, Akaretler, Beşiktaş',
        lat: 41.0392,
        lng: 29.0005,
        isOpen: true,
        rating: 4.9,
        servicesCount: 14,
        hasBooking: true,
        hasMenu: false,
        slogan: 'VIP Salon Hizmeti & Keratin Bakımı',
        isVip: true,
      },
      {
        id: 'seed_shop_5',
        name: 'Bomonti Kahvecisi & Bistro',
        slug: 'bomonti-kahvecisi',
        sectorKey: 'kafe_restoran',
        city: 'İstanbul',
        district: 'Şişli',
        address: 'Cumhuriyet Mh., Silahşör Cd. No: 38, Şişli',
        lat: 41.0588,
        lng: 28.9835,
        isOpen: true,
        rating: 4.8,
        servicesCount: 32,
        hasBooking: false,
        hasMenu: true,
        slogan: '3. Nesil Nitelikli Kahve & Taş Fırın Kruvasan',
        isVip: true,
      },
      {
        id: 'seed_shop_7',
        name: 'Tunalı Klas Kuaför & Bakım',
        slug: 'tunali-klas-kuafor',
        sectorKey: 'berber_kuafor',
        city: 'Ankara',
        district: 'Çankaya',
        address: 'Tunalı Hilmi Cd. No: 88, Kavaklıdere, Çankaya',
        lat: 39.9075,
        lng: 32.8615,
        isOpen: true,
        rating: 4.9,
        servicesCount: 11,
        hasBooking: true,
        hasMenu: false,
        slogan: 'Başkentte Kusursuz İmaj & Profesyonel Saç Kesimi',
        isVip: true,
      },
      {
        id: 'seed_shop_9',
        name: 'Alsancak Kordon Barber & Lounge',
        slug: 'kordon-barber-lounge',
        sectorKey: 'berber_kuafor',
        city: 'İzmir',
        district: 'Konak',
        address: 'Atatürk Cd. (Kordon) No: 182, Alsancak, Konak',
        lat: 38.4365,
        lng: 27.1425,
        isOpen: true,
        rating: 4.9,
        servicesCount: 12,
        hasBooking: true,
        hasMenu: false,
        slogan: 'Deniz Manzaralı Tıraş & Damat Bakım Paketleri',
        isVip: true,
      },
      {
        id: 'seed_shop_11',
        name: 'FSM Nilüfer Espresso & Bakery',
        slug: 'nilufer-espresso-bakery',
        sectorKey: 'kafe_restoran',
        city: 'Bursa',
        district: 'Nilüfer',
        address: 'Fethiye Mh., Fatih Sultan Mehmet Blv. No: 112, Nilüfer',
        lat: 40.2175,
        lng: 28.9772,
        isOpen: true,
        rating: 4.8,
        servicesCount: 22,
        hasBooking: false,
        hasMenu: true,
        slogan: 'Taze Kahve, Tatlılar & Masaya QR Sipariş',
        isVip: true,
      },
      {
        id: 'seed_shop_12',
        name: 'Kaleiçi Antik Kafe & Dondurma',
        slug: 'kaleici-antik-kafe',
        sectorKey: 'kafe_restoran',
        city: 'Antalya',
        district: 'Muratpaşa',
        address: 'Kılınçarslan Mh., Hesapçı Sk. No: 28, Kaleiçi',
        lat: 36.8835,
        lng: 30.7065,
        isOpen: true,
        rating: 4.9,
        servicesCount: 26,
        hasBooking: false,
        hasMenu: true,
        slogan: 'Tarihi Konakta Kahve Molası & QR Adisyon',
        isVip: true,
      },
    ];

    const seenSlugs = new Set(mapShops.map((s) => s.slug));
    for (const d of demoShops) {
      if (!seenSlugs.has(d.slug)) {
        if (sectorFilter && sectorFilter !== 'all' && sectorFilter !== 'tum') {
          if (d.sectorKey !== sectorFilter) continue;
        }
        if (cityFilter && cityFilter !== 'all') {
          if (d.city.toLowerCase() !== cityFilter.toLowerCase()) continue;
        }
        if (searchFilter) {
          const match =
            d.name.toLowerCase().includes(searchFilter) ||
            d.city.toLowerCase().includes(searchFilter) ||
            d.district.toLowerCase().includes(searchFilter);
          if (!match) continue;
        }
        mapShops.push(d);
        seenSlugs.add(d.slug);
      }
    }

    res.json({
      success: true,
      count: mapShops.length,
      shops: mapShops,
    });
  });
}

export const registerPublicShopsMap = registerPublicShopsMapRoutes;
