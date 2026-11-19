export type PublicRouteKey =
  | 'gizlilik'
  | 'iletisim'
  | 'kayit'
  | 'fiyat'
  | 'berber'
  | 'guzellik-salonu'
  | 'kafe-restoran'
  | 'bakkal-market'
  | 'veresiye-defteri'
  | 'kasa-programi'
  | 'gun-sonu-raporu'
  | 'qr-menu'
  | 'teknik-servis'
  | 'hukuk'
  | 'terzi'
  | 'rehber'
  | 'blog';

/** URL yolunu herkese açık sayfa anahtarına çevirir. Eşleşmezse null. */
export function matchPublicRoute(pathname: string): PublicRouteKey | null {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const key = clean.startsWith('/') ? clean.slice(1) : clean;
  if (key === 'rehber' || key.startsWith('rehber/')) {
    return 'rehber';
  }
  if (key === 'blog' || key.startsWith('blog/')) {
    return 'blog';
  }
  switch (key) {
    case 'gizlilik':
    case 'gizlilik-politikasi':
      return 'gizlilik';
    case 'iletisim':
      return 'iletisim';
    case 'kayit':
      return 'kayit';
    case 'fiyat':
    case 'fiyatlandirma':
      return 'fiyat';
    case 'berber':
    case 'berber-randevu-programi':
    case 'berber-randevu':
    case 'erkek-kuafor':
    case 'kuafor':
    case 'kuafor-randevu':
    case 'kadin-kuafor':
    case 'kuafor-programi':
    case 'randevu-sistemi':
    case 'online-randevu':
    case 'randevu-programi':
    case 'izmit-berber-randevu':
    case 'izmit-berber':
    case 'kocaeli-berber':
    case 'kocaeli-berber-randevu':
    case 'zonguldak-berber-randevu':
    case 'zonguldak-berber':
    case 'eregli-berber':
    case 'kdz-eregli-berber':
    case 'eregli-berber-randevu':
      return 'berber';
    case 'guzellik-salonu':
    case 'guzellik-merkezi':
    case 'guzellik':
    case 'lazer-epilasyon':
    case 'guzellik-salonu-programi':
      return 'guzellik-salonu';
    case 'kafe-restoran':
    case 'kafe':
    case 'restoran':
    case 'adisyon':
    case 'adisyon-programi':
      return 'kafe-restoran';
    case 'bakkal-market':
    case 'bakkal':
    case 'market':
    case 'pos-sistemi':
    case 'barkod-pos':
      return 'bakkal-market';
    case 'veresiye-defteri':
    case 'veresiye':
    case 'dijital-veresiye':
    case 'veresiye-programi':
      return 'veresiye-defteri';
    case 'kasa-programi':
    case 'kasa-takibi':
    case 'esnaf-kasa':
      return 'kasa-programi';
    case 'gun-sonu-raporu':
    case 'gun-sonu':
    case 'z-raporu':
      return 'gun-sonu-raporu';
    case 'qr-menu':
    case 'dijital-menu':
    case 'karekod-menu':
    case 'ucretsiz-qr-menu':
      return 'qr-menu';
    case 'teknik-servis':
    case 'servis':
      return 'teknik-servis';
    case 'hukuk':
    case 'avukat':
      return 'hukuk';
    case 'terzi':
      return 'terzi';
    default:
      return null;
  }
}
