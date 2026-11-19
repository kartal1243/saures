import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  Crown,
  Scissors,
  UtensilsCrossed,
  ShoppingCart,
  Wrench,
  Scale,
  Shirt,
  Store,
  Copy,
  Check,
  ExternalLink,
  Rocket,
  QrCode,
  MessageCircle,
} from 'lucide-react';
import type { BusinessSector, ShopProfile } from '../../../shared/types.ts';
import type { ActiveTab } from '../../App';

export interface OnboardingStats {
  customersCount: number;
  productsCount: number;
  tablesCount: number;
  staffCount: number;
  servicesCount: number;
  appointmentsCount: number;
  transactionsCount: number;
}

export interface OnboardingWizardTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => Promise<void> | void;
  shopProfile: ShopProfile;
  sector: BusinessSector;
  stats: OnboardingStats;
  onNavigate: (tab: ActiveTab) => void;
  onOpenShopProfile: () => void;
  onOpenStaff: () => void;
  onOpenMoneyIn: () => void;
}

export interface OnboardingChecklistCardProps {
  shopProfile: ShopProfile;
  sector: BusinessSector;
  stats: OnboardingStats;
  onOpenWizard: () => void;
  onDismiss: () => void;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenShopProfile?: () => void;
  onOpenStaff?: () => void;
  onOpenMoneyIn?: () => void;
}

interface SectorFeatureCard {
  title: string;
  desc: string;
}

interface SectorGuideInfo {
  label: string;
  badgeText: string;
  tagline: string;
  accentGradient: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
  features: [SectorFeatureCard, SectorFeatureCard, SectorFeatureCard];
  sectorNavId?: string;
  tourSectorTitle: string;
  tourSectorDesc: string;
}

const SECTOR_GUIDE_MAP: Record<string, SectorGuideInfo> = {
  berber_kuafor: {
    label: 'Kuaför & Berber Salonu',
    badgeText: 'Berber & Kuaför Paketi Hazır',
    tagline: 'Randevu takvimi, koltuk sırası ve usta prim hesapları tek ekranda hazır.',
    accentGradient: 'from-indigo-600 via-violet-600 to-orange-500',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    icon: Scissors,
    features: [
      {
        title: 'Online Randevu & Koltuk Takvimi',
        desc: 'Müşterileriniz kendi linkinizden 7/24 saat seçer, bildirim anında panelinize düşer.',
      },
      {
        title: 'Otomatik Usta & Prim Hesabı',
        desc: 'Her işlem tamamlandığında ustanızın prim hak edişi otomatik hesaplanır.',
      },
      {
        title: 'Hizmet Tarifesi & QR Stand',
        desc: 'Dükkân logolu QR randevu kartınızı yazdırıp aynaya veya cama yapıştırın.',
      },
    ],
    sectorNavId: 'nav-tab-appointments',
    tourSectorTitle: 'Randevu Takvimi & Prim Hesabı',
    tourSectorDesc: 'Takvim hızlı butonlarıyla randevu oluşturun, koltuk durumunu ve usta prim hak edişlerini yönetin.',
  },
  kafe_restoran: {
    label: 'Kafe & Restoran & Lokanta',
    badgeText: 'Adisyon & QR Menü Hazır',
    tagline: 'Canlı masa yönetimi, dijital QR menü ve garson çağrıları anında kullanıma hazır.',
    accentGradient: 'from-orange-500 via-amber-500 to-rose-500',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    icon: UtensilsCrossed,
    features: [
      {
        title: 'Canlı Masa & Adisyon Ekranı',
        desc: 'Salon, bahçe ve teras masalarını takip edin; ikram veya parçalı ödeme alın.',
      },
      {
        title: 'Masa QR Menü & Garson Çağrısı',
        desc: 'Müşteriler masadan menüyü görür, tek dokunuşla garson veya hesap isteyebilir.',
      },
      {
        title: 'Mutfak Masrafı & Gün Sonu',
        desc: 'Günlük hal, tedarik giderleri ve nakit/POS cirosu akşam tek raporda toplanır.',
      },
    ],
    sectorNavId: 'nav-tab-tables',
    tourSectorTitle: 'Adisyon & Masalar',
    tourSectorDesc: 'Açık masaları, sipariş eklemelerini, QR menüyü ve canlı masa çağrılarını buradan yönetin.',
  },
  bakkal_market: {
    label: 'Bakkal & Market & Büfe',
    badgeText: 'Hızlı Satış (POS) & Veresiye Hazır',
    tagline: 'Tezgâh önü hızlı satış, kritik stok alarmı ve dijital veresiye defteri aktif.',
    accentGradient: 'from-emerald-600 via-teal-600 to-orange-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    icon: ShoppingCart,
    features: [
      {
        title: 'Hızlı Tezgâh Satışı (POS)',
        desc: 'Ürünleri sepete atın; nakit, kart veya veresiye olarak saniyeler içinde kapatın.',
      },
      {
        title: 'Kritik Stok & Mal Girişi',
        desc: 'Raf azaldığında kırmızı alarm alın, alış-satış kâr marjınızı koruyun.',
      },
      {
        title: 'Veresiye & Toptancı Cari',
        desc: 'Müşteri borçlarını WhatsApp ile hatırlatın, toptancı ödemelerinizi izleyin.',
      },
    ],
    sectorNavId: 'nav-tab-pos',
    tourSectorTitle: 'Hızlı Satış (POS)',
    tourSectorDesc: 'Barkodlu/sepetli tezgâh satışını ve veresiye aktarımlarını bu sekmeden hızla yönetin.',
  },
  teknik_servis: {
    label: 'Teknik Servis & Oto Tamir',
    badgeText: 'Servis Fişi & Bakım Pasaportu Hazır',
    tagline: 'Cihaz kabul fişleri, parça maliyeti ve QR bakım pasaportu kullanıma hazır.',
    accentGradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    icon: Wrench,
    features: [
      {
        title: 'Arıza & Servis Kabul Fişi',
        desc: 'Teslim alınan cihaz veya araçların şikayet, kaparo ve parça maliyetini kaydedin.',
      },
      {
        title: 'QR Bakım Pasaportu',
        desc: 'Müşterileriniz QR kodla işlem durumunu ve geçmiş periyodik bakımları görür.',
      },
      {
        title: 'Net İşçilik Kârı Hesabı',
        desc: 'Teslimatta parça maliyeti düşülerek net kazancınız kasaya otomatik yazılır.',
      },
    ],
    sectorNavId: 'nav-tab-tickets',
    tourSectorTitle: 'Servis & Tamir Fişleri',
    tourSectorDesc: 'Arıza kabul kayıtlarını, tamir aşamalarını ve parça giderlerini buradan yönetin.',
  },
  avukat_danisman: {
    label: 'Avukat & Danışmanlık',
    badgeText: 'Dava & Duruşma Takibi Hazır',
    tagline: 'Dava dosyaları, duruşma takvimi ve müvekkil tahsilatları düzenli şekilde hazır.',
    accentGradient: 'from-violet-600 via-purple-600 to-indigo-600',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    icon: Scale,
    features: [
      {
        title: 'Dava Dosyaları & Mahkeme Notları',
        desc: 'Dosya numarası, mahkeme bilgisi ve danışmanlık saatlerini tek dosyada tutun.',
      },
      {
        title: 'Duruşma Takvimi & Hatırlatma',
        desc: 'Yaklaşan duruşma tarihlerini kaçırmadan ajandanızdan takip edin.',
      },
      {
        title: 'Müvekkil Cari & Tahsilat',
        desc: 'Avans, vekalet ücreti ve düzenli danışmanlık aidatlarını şeffaf yönetin.',
      },
    ],
    sectorNavId: 'nav-tab-cases',
    tourSectorTitle: 'Dava Dosyaları',
    tourSectorDesc: 'Müvekkil dosyalarını, mahkeme duruşmalarını ve danışmanlık saatlerini bu sekmeden yönetin.',
  },
  terzi_kurutemizleme: {
    label: 'Terzi & Kuru Temizleme',
    badgeText: 'Emanet & Teslimat Takibi Hazır',
    tagline: 'Bırakılan eşya fişleri, kaparo hesabı ve hazır bildirimleri kullanıma hazır.',
    accentGradient: 'from-teal-600 via-emerald-600 to-cyan-600',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    icon: Shirt,
    features: [
      {
        title: 'Emanet Fişi & Söz Tarihi',
        desc: 'Alınan kıyafetleri, işlem notlarını ve söz verilen teslim tarihini kaydedin.',
      },
      {
        title: 'Kaparo & Kalan Bakiye',
        desc: 'Teslim sırasında peşinat düşülerek kalan bakiye tek tıkla kasaya işlenir.',
      },
      {
        title: 'Online Takip & WhatsApp Hazır Mesajı',
        desc: 'İşlem tamamlandığında müşteriye tek tıkla "Eşyanız Hazır" mesajı gönderin.',
      },
    ],
    sectorNavId: 'nav-tab-custody',
    tourSectorTitle: 'Emanet Takibi',
    tourSectorDesc: 'Bırakılan eşya fişlerini, işlem durumlarını ve teslimat ödemelerini buradan takip edin.',
  },
  diger_esnaf: {
    label: 'Genel Esnaf & Mağaza',
    badgeText: 'Kasa & Veresiye Sistemi Hazır',
    tagline: 'Günlük kasa akışı, müşteri defteri ve gider takibi hemen kullanıma hazır.',
    accentGradient: 'from-stone-800 via-stone-700 to-orange-600',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    icon: Store,
    features: [
      {
        title: 'Anlık Kasa & Z Raporu',
        desc: 'Nakit, POS kart ve havale tahsilatlarınızı gün sonunda tek tıkla kapatın.',
      },
      {
        title: 'Müşteri & Veresiye Defteri',
        desc: 'Borç/alacak bakiyelerini takip edin, vadesi gelene WhatsApp hatırlatma atın.',
      },
      {
        title: 'Stok & Personel Kontrolü',
        desc: 'Ürün giriş çıkışlarını, masrafları ve personel maaş/prim ödemelerini yönetin.',
      },
    ],
    tourSectorTitle: 'Sektör Modülü',
    tourSectorDesc: 'İşletmenize özel yönetim ekranına buradan ulaşabilirsiniz.',
  },
};

function getSectorGuide(sector: BusinessSector): SectorGuideInfo {
  if (SECTOR_GUIDE_MAP[sector]) return SECTOR_GUIDE_MAP[sector];
  if (['manav_kasap', 'kirtasiye', 'aktar_baharat', 'hirdavat', 'giyim_butik'].includes(sector)) {
    return SECTOR_GUIDE_MAP.bakkal_market;
  }
  return SECTOR_GUIDE_MAP.diger_esnaf;
}

function slugifyTr(text: string): string {
  const trMap: Record<string, string> = {
    ç: 'c', Ç: 'c',
    ğ: 'g', Ğ: 'g',
    ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o',
    ş: 's', Ş: 's',
    ü: 'u', Ü: 'u',
  };
  return String(text || '')
    .split('')
    .map((ch) => trMap[ch] || ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'dukkan';
}

function copyTextFallback(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve(ok);
  } catch {
    return Promise.resolve(false);
  }
}

interface TourStepDef {
  id: string;
  targetIds: string[];
  title: string;
  description: string;
  badge: string;
}

function findVisibleTarget(targetIds: string[]): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  for (const id of targetIds) {
    const matches = document.querySelectorAll<HTMLElement>(`[id="${id}"]`);
    for (const el of matches) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          return el;
        }
      }
    }
  }
  return null;
}

export const OnboardingWizardTour: React.FC<OnboardingWizardTourProps> = ({
  isOpen,
  onClose,
  onComplete,
  shopProfile,
  sector,
  stats,
  onNavigate,
  onOpenShopProfile,
  onOpenStaff,
  onOpenMoneyIn,
}) => {
  const [phase, setPhase] = useState<'wizard' | 'tour'>('wizard');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [tourIndex, setTourIndex] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [visibleTourSteps, setVisibleTourSteps] = useState<TourStepDef[]>([]);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [cardSize, setCardSize] = useState<{ width: number; height: number }>({ width: 340, height: 220 });
  const tourCardRef = useRef<HTMLDivElement | null>(null);

  const guide = useMemo(() => getSectorGuide(sector), [sector]);
  const SectorIcon = guide.icon;

  // Açılışta durumu sıfırla
  useEffect(() => {
    if (isOpen) {
      setPhase('wizard');
      setWizardStep(1);
      setTourIndex(0);
      setCopiedUrl(false);
      setCompleting(false);
    }
  }, [isOpen]);

  // Tüm aday Spotlight tur adımları
  const candidateTourSteps = useMemo<TourStepDef[]>(() => {
    const steps: TourStepDef[] = [
      {
        id: 'quick_money_in',
        targetIds: ['btn-quick-money-in'],
        badge: 'Kasa Girişi',
        title: 'Hızlı Para Al (Satış)',
        description: 'Nakit, POS kart ve havale tahsilatlarını tek tıkla kasaya işleyin; isterseniz müşteri bakiyesinden düşün.',
      },
      {
        id: 'quick_daily_closing',
        targetIds: ['btn-quick-daily-closing'],
        badge: 'Akşam Kapanış',
        title: 'Gün Sonu & Z Raporu',
        description: 'Akşam fiili kasa sayımınızı yapın, açık veya fazla farkını anında görün ve günü güvenle kapatın.',
      },
      {
        id: 'sector_module',
        targetIds: [
          ...(guide.sectorNavId ? [guide.sectorNavId] : []),
          'nav-tab-appointments',
          'nav-tab-tables',
          'nav-tab-pos',
          'nav-tab-tickets',
          'nav-tab-cases',
          'nav-tab-custody',
        ],
        badge: 'Sektör Modülü',
        title: guide.tourSectorTitle,
        description: guide.tourSectorDesc,
      },
      {
        id: 'customers',
        targetIds: ['nav-tab-customers'],
        badge: 'Müşteri & Veresiye',
        title: 'Müşteriler & Veresiye',
        description: 'Müşteri geçmişini ve borç bakiyelerini görüntüleyin; tek tıkla WhatsApp ödeme hatırlatması gönderin.',
      },
      {
        id: 'notifications',
        targetIds: ['btn-notifications'],
        badge: 'Anlık Takip',
        title: 'Bildirim Merkezi',
        description: 'Gelen online randevular, iptaller, masa garson çağrıları ve hatırlatma geçmişi burada toplanır.',
      },
      {
        id: 'staff_menu',
        targetIds: ['nav-menu-staff'],
        badge: 'Ekip Yönetimi',
        title: 'Personel & Maaş / Prim',
        description: 'Ekibinizi ekleyin, prim oranlarını tanımlayın; maaş, avans ve prim ödemelerini doğrudan kasaya gider yazın.',
      },
    ];
    return steps;
  }, [guide]);

  // Sadece görünür hedefleri filtrele
  const refreshVisibleSteps = useCallback(() => {
    const filtered = candidateTourSteps.filter((step) => findVisibleTarget(step.targetIds) !== null);
    setVisibleTourSteps(filtered);
    return filtered;
  }, [candidateTourSteps]);

  const activeTourStep = visibleTourSteps[tourIndex] || null;

  const measureCurrentTarget = useCallback(() => {
    if (!activeTourStep) {
      setTargetRect(null);
      return;
    }
    const el = findVisibleTarget(activeTourStep.targetIds);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [activeTourStep]);

  // Tur başladığında görünür hedefleri çöz
  useEffect(() => {
    if (!isOpen || phase !== 'tour') return;
    let cancelled = false;

    const resolve = () => {
      if (cancelled) return;
      const list = refreshVisibleSteps();
      if (tourIndex >= list.length && list.length > 0) {
        setTourIndex(0);
      }
    };

    const raf = window.requestAnimationFrame(resolve);
    const t = window.setTimeout(resolve, 90);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [isOpen, phase, refreshVisibleSteps, tourIndex]);

  // Seçili hedefe scroll et ve koordinatları dinle
  useEffect(() => {
    if (!isOpen || phase !== 'tour' || !activeTourStep) return;

    const el = findVisibleTarget(activeTourStep.targetIds);
    if (el) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      } catch {}
    }

    measureCurrentTarget();
    const t1 = window.setTimeout(measureCurrentTarget, 160);
    const t2 = window.setTimeout(measureCurrentTarget, 380);

    const onViewportChange = () => {
      refreshVisibleSteps();
      measureCurrentTarget();
    };

    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [isOpen, phase, activeTourStep, measureCurrentTarget, refreshVisibleSteps]);

  // Tur kartının yüksekliğini ölç (ekran sınırlarından taşmaması için)
  useEffect(() => {
    if (!isOpen || phase !== 'tour' || !tourCardRef.current) return;
    const rect = tourCardRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setCardSize({ width: rect.width, height: rect.height });
    }
  }, [isOpen, phase, tourIndex, targetRect]);

  const handleFinishComplete = useCallback(async () => {
    if (completing) return;
    setCompleting(true);
    try {
      await onComplete();
    } finally {
      setCompleting(false);
    }
  }, [completing, onComplete]);

  // Klavye desteği (Escape / ArrowRight / ArrowLeft)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (phase === 'tour') {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (tourIndex < visibleTourSteps.length - 1) {
            setTourIndex((prev) => prev + 1);
          } else {
            handleFinishComplete();
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (tourIndex > 0) {
            setTourIndex((prev) => prev - 1);
          }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, phase, tourIndex, visibleTourSteps.length, onClose, handleFinishComplete]);

  const startSpotlightTour = () => {
    onNavigate('panel');
    setTourIndex(0);
    setPhase('tour');
  };

  // Adım 2 kontrol listesi (sektöre özel)
  const step2Tasks = useMemo(() => {
    const commonLogoTask = {
      key: 'logo',
      title: 'Dükkân Logonuzu (PP) Yükleyin',
      subtitle: 'QR menü, randevu linki ve fişlerde markanızla gözükün.',
      done: Boolean(shopProfile.logoUrl),
      ctaLabel: 'Şimdi Git & Ekle',
      onAction: () => {
        onClose();
        onOpenShopProfile();
      },
    };

    if (sector === 'berber_kuafor') {
      return [
        {
          key: 'barber_staff',
          title: 'Usta & Prim Oranı Tanımlayın',
          subtitle: 'Her usta için % prim oranı belirleyip otomatik hak ediş hesaplatın.',
          done: stats.staffCount > 0,
          ctaLabel: 'Şimdi Git & Ekle',
          onAction: () => {
            onClose();
            onNavigate('sector_view');
          },
        },
        {
          key: 'barber_services',
          title: 'Hizmet Tarifesi Ekleyin',
          subtitle: 'Saç, sakal ve bakım süreleriyle fiyat listenizi oluşturun.',
          done: stats.servicesCount > 0,
          ctaLabel: 'Şimdi Git & Ekle',
          onAction: () => {
            onClose();
            onNavigate('sector_view');
          },
        },
        {
          key: 'barber_first_apt',
          title: 'İlk Randevu veya Kasa Satışı',
          subtitle: 'Takvimden ilk randevuyu açın veya hızlı satış girin.',
          done: stats.appointmentsCount > 0 || stats.transactionsCount > 0,
          ctaLabel: 'Şimdi Git & Ekle',
          onAction: () => {
            onClose();
            onNavigate('sector_view');
          },
        },
        commonLogoTask,
      ];
    }

    if (sector === 'kafe_restoran') {
      return [
        {
          key: 'cafe_tables',
          title: 'İlk Masalarınızı Oluşturun',
          subtitle: 'Salon, bahçe veya teras masalarını ekleyin, adisyon açın.',
          done: stats.tablesCount > 0,
          ctaLabel: 'Şimdi Git & Ekle',
          onAction: () => {
            onClose();
            onNavigate('sector_view');
          },
        },
        {
          key: 'cafe_menu',
          title: 'QR Menü & Ürünleri Tanımlayın',
          subtitle: 'Müşterilerin masadaki QR kodla göreceği dijital menünüzü hazırlayın.',
          done: stats.tablesCount > 0 && stats.transactionsCount > 0,
          ctaLabel: 'Şimdi Git & Ekle',
          onAction: () => {
            onClose();
            onNavigate('sector_view');
          },
        },
        {
          key: 'cafe_first_tx',
          title: 'İlk Hesap veya Kasa Girişi',
          subtitle: 'Adisyon kapatarak veya Hızlı Para Al ile ilk cironuzu işleyin.',
          done: stats.transactionsCount > 0,
          ctaLabel: 'Şimdi Git & Ekle',
          onAction: () => {
            onClose();
            onOpenMoneyIn();
          },
        },
        commonLogoTask,
      ];
    }

    if (sector === 'bakkal_market' || ['manav_kasap', 'kirtasiye', 'aktar_baharat', 'hirdavat', 'giyim_butik'].includes(sector)) {
      return [
        {
          key: 'retail_products',
          title: 'İlk Ürün & Stok Kartlarını Ekleyin',
          subtitle: 'Barkod, alış-satış fiyatı ve kritik stok eşiğini tanımlayın.',
          done: stats.productsCount > 0,
          ctaLabel: 'Şimdi Git & Ekle',
          onAction: () => {
            onClose();
            onNavigate('stock');
          },
        },
        {
          key: 'retail_customers',
          title: 'İlk Müşteri / Veresiye Kartını Açın',
          subtitle: 'Düzenli müşterilerinizi kaydedin, tek tıkla veresiye yazın.',
          done: stats.customersCount > 0,
          ctaLabel: 'Şimdi Git & Ekle',
          onAction: () => {
            onClose();
            onNavigate('customers');
          },
        },
        {
          key: 'retail_first_sale',
          title: 'İlk Hızlı Satış (POS) İşlemini Yapın',
          subtitle: 'Tezgâh kasasından ilk satışınızı kaydedin.',
          done: stats.transactionsCount > 0,
          ctaLabel: 'Şimdi Git & Ekle',
          onAction: () => {
            onClose();
            onNavigate('sector_view');
          },
        },
        commonLogoTask,
      ];
    }

    // Teknik Servis, Avukat, Terzi ve Genel Esnaf
    const sectorRecordTask =
      sector === 'teknik_servis'
        ? {
            title: 'İlk Servis Kabul Fişini Açın',
            subtitle: 'Cihaz/araç kabul bilgisi ve tahmini tutarı kaydedin.',
            onAction: () => {
              onClose();
              onNavigate('sector_view');
            },
          }
        : sector === 'avukat_danisman'
        ? {
            title: 'İlk Dava Dosyasını Oluşturun',
            subtitle: 'Müvekkil dosya numarası ve yaklaşan duruşma tarihini ekleyin.',
            onAction: () => {
              onClose();
              onNavigate('sector_view');
            },
          }
        : sector === 'terzi_kurutemizleme'
        ? {
            title: 'İlk Emanet Fişini Kaydedin',
            subtitle: 'Teslim alınan ürünü, kaparoyu ve söz tarihini girin.',
            onAction: () => {
              onClose();
              onNavigate('sector_view');
            },
          }
        : {
            title: 'Personel veya Ekip Tanımlayın',
            subtitle: 'Çalışanlarınızın görev, maaş ve prim oranlarını kaydedin.',
            onAction: () => {
              onClose();
              onOpenStaff();
            },
          };

    return [
      {
        key: 'other_customer',
        title: 'İlk Müşteri / Cari Kaydını Ekleyin',
        subtitle: 'Müşteri bilgilerini kaydedin, bakiye ve hatırlatmaları başlatın.',
        done: stats.customersCount > 0,
        ctaLabel: 'Şimdi Git & Ekle',
        onAction: () => {
          onClose();
          onNavigate('customers');
        },
      },
      {
        key: 'other_sector',
        title: sectorRecordTask.title,
        subtitle: sectorRecordTask.subtitle,
        done: stats.transactionsCount > 0 || stats.customersCount > 1,
        ctaLabel: 'Şimdi Git & Ekle',
        onAction: sectorRecordTask.onAction,
      },
      {
        key: 'other_tx',
        title: 'İlk Kasa Tahsilatını Girin',
        subtitle: 'Nakit, POS kart veya havale satışıyla kasayı başlatın.',
        done: stats.transactionsCount > 0,
        ctaLabel: 'Şimdi Git & Ekle',
        onAction: () => {
          onClose();
          onOpenMoneyIn();
        },
      },
      commonLogoTask,
    ];
  }, [sector, shopProfile.logoUrl, stats, onClose, onNavigate, onOpenMoneyIn, onOpenShopProfile, onOpenStaff]);

  const completedTasksCount = step2Tasks.filter((t) => t.done).length;

  // Adım 3 paylaşım bağlantısı
  const shareInfo = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dukkanimyanimda.com.tr';
    const rawSlug = (shopProfile.slug || '').trim() || slugifyTr(shopProfile.storeName || 'dukkan');
    if (sector === 'berber_kuafor') {
      return {
        mode: 'link' as const,
        title: 'Online Randevu Linkiniz Hazır!',
        subtitle: 'Bu bağlantıyı Instagram biyografinize ekleyin veya müşterilerinize WhatsApp üzerinden gönderin; 7/24 online randevu alın.',
        url: `${origin}/${encodeURIComponent(rawSlug)}/randevu`,
        tip: 'İpucu: Randevu Takvimi > Ayarlar & QR sekmesinden dükkan logolu masa/ayna QR kartını tek tıkla yazdırabilirsiniz.',
      };
    }
    if (sector === 'kafe_restoran') {
      return {
        mode: 'link' as const,
        title: 'Dijital QR Menü Linkiniz Hazır!',
        subtitle: 'Müşterileriniz masalardaki QR kodu okutarak güncel menünüzü görür, tek tıkla garson veya hesap çağrısı yapar.',
        url: `${origin}/m/${encodeURIComponent(rawSlug)}`,
        tip: 'İpucu: Masalar ekranındaki QR Menü butonundan her masa için özel logolu QR standı yazdırabilirsiniz.',
      };
    }
    return {
      mode: 'summary' as const,
      title: 'WhatsApp Hatırlatma & Akıllı Kasa Hazır!',
      subtitle: 'Müşterilerinize vadesi gelen borçları, bakım tarihlerini veya hazır teslimatları tek tıkla WhatsApp üzerinden iletin.',
      url: '',
      tip: 'İpucu: Akşam dükkanı kapatırken "Gün Sonu Kapat" butonuyla 30 saniyede kasa sayımınızı tamamlayıp Z Raporu alabilirsiniz.',
    };
  }, [sector, shopProfile.slug, shopProfile.storeName]);

  const handleCopyShareUrl = async () => {
    if (!shareInfo.url) return;
    const ok = await copyTextFallback(shareInfo.url);
    if (ok) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  // Kalan deneme günü
  const trialRemainingDays = useMemo(() => {
    if (!shopProfile.vipUntil) return 14;
    const diff = new Date(shopProfile.vipUntil).getTime() - Date.now();
    if (Number.isNaN(diff)) return 14;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [shopProfile.vipUntil]);

  if (!isOpen) return null;

  // =========================================================================
  // MOD 2: İNTERAKTİF SPOTLİGHT DOM TURU
  // =========================================================================
  if (phase === 'tour') {
    const pad = 6;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
    const maxCardW = Math.min(360, vw - 24);
    const estH = cardSize.height || 225;

    let cardLeft = Math.max(12, Math.round((vw - maxCardW) / 2));
    let cardTop = Math.max(12, Math.round((vh - estH) / 2));

    if (targetRect) {
      const idealLeft = targetRect.left + targetRect.width / 2 - maxCardW / 2;
      cardLeft = Math.min(Math.max(12, idealLeft), Math.max(12, vw - maxCardW - 12));

      const spaceBelow = vh - (targetRect.top + targetRect.height + pad + 12);
      const spaceAbove = targetRect.top - pad - 12;

      if (spaceBelow >= estH + 8) {
        cardTop = targetRect.top + targetRect.height + pad + 12;
      } else if (spaceAbove >= estH + 8) {
        cardTop = targetRect.top - pad - 12 - estH;
      } else {
        const fallbackTop = spaceBelow >= spaceAbove
          ? targetRect.top + targetRect.height + pad + 10
          : targetRect.top - pad - 10 - estH;
        cardTop = Math.min(Math.max(12, fallbackTop), Math.max(12, vh - estH - 12));
      }
    }

    const totalSteps = visibleTourSteps.length;
    const isLast = totalSteps === 0 || tourIndex >= totalSteps - 1;

    return (
      <div className="fixed inset-0 z-[89]" role="dialog" aria-modal="true" aria-label="İnteraktif Arayüz Turu">
        {/* Arka plan karartma + hedef etrafı Spotlight nabız çerçevesi */}
        {targetRect ? (
          <div
            className="fixed z-[90] pointer-events-none rounded-2xl transition-all duration-200 ease-out ring-4 ring-orange-500 shadow-[0_0_24px_rgba(249,115,22,0.55)]"
            style={{
              top: Math.max(0, targetRect.top - pad),
              left: Math.max(0, targetRect.left - pad),
              width: targetRect.width + pad * 2,
              height: targetRect.height + pad * 2,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            }}
          >
            <span className="absolute inset-0 rounded-2xl ring-2 ring-amber-300/80 animate-pulse" />
          </div>
        ) : (
          <div className="fixed inset-0 z-[90] bg-black/70 pointer-events-none" />
        )}

        {/* Konumlandırılmış Tur Açıklama Kartı */}
        <div
          ref={tourCardRef}
          style={{
            top: cardTop,
            left: cardLeft,
            width: maxCardW,
          }}
          className="fixed z-[95] bg-white dark:bg-stone-900 rounded-2xl border border-orange-300 dark:border-orange-700/70 shadow-2xl p-4 sm:p-5 transition-all duration-200 ease-out"
        >
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 text-[11px] font-black">
              <Compass className="w-3.5 h-3.5" />
              {totalSteps > 0 ? `Adım ${tourIndex + 1} / ${totalSteps}` : 'Rehber'}
              {activeTourStep?.badge ? ` · ${activeTourStep.badge}` : ''}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Turu Kapat (Esc)"
              aria-label="Turu Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-base font-black text-stone-900 dark:text-white tracking-tight">
            {activeTourStep?.title || 'Paneliniz Kullanıma Hazır'}
          </h4>
          <p className="text-xs sm:text-[13px] text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed font-medium">
            {activeTourStep?.description || 'Artık tüm kasa ve müşteri işlemlerinizi tek panelden yönetebilirsiniz.'}
          </p>

          {/* Adım noktaları */}
          {totalSteps > 1 && (
            <div className="flex items-center gap-1.5 mt-3.5">
              {visibleTourSteps.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setTourIndex(idx)}
                  aria-label={`Adım ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === tourIndex
                      ? 'w-6 bg-orange-500'
                      : idx < tourIndex
                      ? 'w-2.5 bg-orange-300 dark:bg-orange-700'
                      : 'w-2 bg-stone-200 dark:bg-stone-700'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Alt kontrol butonları */}
          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Atla
              </button>
              {tourIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setTourIndex((prev) => Math.max(0, prev - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Önceki</span>
                </button>
              )}
            </div>

            {isLast ? (
              <button
                type="button"
                disabled={completing}
                onClick={handleFinishComplete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{completing ? 'Kaydediliyor...' : 'Turu Tamamla'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTourIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-md shadow-orange-500/25 transition-transform active:scale-98 cursor-pointer"
              >
                <span>Sonraki</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MOD 1: ÇOK ADIMLI KURULUM & TANITIM SİHİRBAZI (3 ADIM)
  // =========================================================================
  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Hoş Geldiniz ve Kurulum Sihirbazı"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Üst Başlık & Adım Çubuğu */}
        <div className={`p-5 sm:p-6 bg-linear-to-r ${guide.accentGradient} text-white shrink-0`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider text-white/85">
                  Dükkânım Yanımda · Başlangıç Rehberi
                </p>
                <h2 className="text-lg sm:text-xl font-black tracking-tight truncate">
                  {wizardStep === 1
                    ? 'Hoş Geldiniz & Sektörünüz Hazır'
                    : wizardStep === 2
                    ? 'Sektörünüze Özel İlk Adımlar'
                    : 'Müşteri Paylaşımı & Canlı Tur'}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer shrink-0"
              title="Kapat"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3 Adım Göstergesi */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { step: 1 as const, label: '1. Tanıtım' },
              { step: 2 as const, label: '2. İlk Adımlar' },
              { step: 3 as const, label: '3. Paylaşım & Tur' },
            ].map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => setWizardStep(item.step)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer text-center truncate ${
                  wizardStep === item.step
                    ? 'bg-white text-stone-900 shadow-sm'
                    : wizardStep > item.step
                    ? 'bg-white/30 text-white hover:bg-white/40'
                    : 'bg-black/20 text-white/75 hover:bg-black/30'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gövde */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {wizardStep === 1 && (
            <>
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${guide.badgeClass}`}>
                    <SectorIcon className="w-3.5 h-3.5" />
                    <span>{guide.label}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>14 Gün Ücretsiz Patron VIP</span>
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                  Hoş geldiniz {shopProfile.ownerName || shopProfile.storeName || 'Değerli Esnafımız'}!
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  <strong>{shopProfile.storeName || 'İşletmeniz'}</strong> için {guide.tagline}
                </p>
              </div>

              {/* 14 Gün Patron VIP Kartı */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border border-amber-200 dark:border-amber-800/70 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Crown className="w-5 h-5 fill-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200">
                    14 Gün Ücretsiz Patron VIP Denemeniz Aktif!
                    {shopProfile.vipPlan === '14_gun_deneme' ? ` (${trialRemainingDays} gün kaldı)` : ''}
                  </p>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                    Sınırsız müşteri, sınırsız personel ve masa, QR menü, online randevu ve 7/24 AI esnaf danışmanı şu an tüm özellikleriyle açık.
                  </p>
                </div>
              </div>

              {/* Sektöre Özel 3 Özellik Kartı */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
                  İşinizi Uçuracak 3 Temel Özellik
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {guide.features.map((feat, idx) => (
                    <div
                      key={feat.title}
                      className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/70 flex flex-col gap-2"
                    >
                      <span className="w-7 h-7 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-stone-900 dark:text-white leading-snug">
                        {feat.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {wizardStep === 2 && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                    {guide.label} İçin İlk Kurulum Adımları
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Aşağıdaki adımlardan eksikleri hemen tamamlayabilir veya doğrudan tura geçebilirsiniz.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-black shrink-0">
                  {completedTasksCount} / {step2Tasks.length} Hazır
                </span>
              </div>

              <div className="space-y-2.5">
                {step2Tasks.map((task) => (
                  <div
                    key={task.key}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      task.done
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700/80'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {task.done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-black ${
                            task.done
                              ? 'text-emerald-900 dark:text-emerald-200'
                              : 'text-stone-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {task.subtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={task.onAction}
                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                        task.done
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs'
                      }`}
                    >
                      <span>{task.done ? 'Görüntüle' : task.ctaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {wizardStep === 3 && (
            <>
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                    {shareInfo.mode === 'link' ? (
                      <QrCode className="w-5 h-5" />
                    ) : (
                      <MessageCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900 dark:text-white">
                      {shareInfo.title}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                      {shareInfo.subtitle}
                    </p>
                  </div>
                </div>

                {shareInfo.mode === 'link' && shareInfo.url && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 truncate select-all">
                      {shareInfo.url}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyShareUrl}
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          copiedUrl
                            ? 'bg-emerald-600 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs'
                        }`}
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUrl ? 'Kopyalandı!' : 'Linki Kopyala'}</span>
                      </button>
                      <a
                        href={shareInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 transition-colors"
                        title="Yeni sekmede aç"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs font-semibold text-amber-900 dark:text-amber-300">
                  {shareInfo.tip}
                </div>
              </div>

              {/* Canlı Spotlight Tur Daveti */}
              <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-orange-500/10 via-amber-500/10 to-indigo-500/10 border border-orange-300/70 dark:border-orange-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-stone-900 dark:text-white">
                      30 Saniyede İnteraktif Ekran Turu
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                      Kasa butonlarını, sektör modülünüzü, bildirim zilini ve personel menüsünü canlı ekran üzerinde tek tek tanıtalım.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startSpotlightTour}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-950 text-xs font-black shadow-md transition-transform active:scale-98 cursor-pointer shrink-0"
                >
                  <Compass className="w-4 h-4 text-orange-400 dark:text-orange-600" />
                  <span>İnteraktif Arayüz Turunu Başlat (Spotlight)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Alt Bar */}
        <div className="px-5 py-4 bg-stone-50 dark:bg-stone-950/60 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            {wizardStep > 1 ? (
              <button
                type="button"
                onClick={() => setWizardStep((s) => (s === 3 ? 2 : 1))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Geri</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-500 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Sonra Bakacağım
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {wizardStep < 3 ? (
              <button
                type="button"
                onClick={() => setWizardStep((s) => (s === 1 ? 2 : 3))}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-black shadow-md shadow-orange-500/25 transition-transform active:scale-98 cursor-pointer"
              >
                <span>Devam Et</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startSpotlightTour}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 hover:bg-orange-200 dark:hover:bg-orange-900/60 text-orange-800 dark:text-orange-300 text-xs font-black transition-colors cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Turu Başlat</span>
                </button>
                <button
                  type="button"
                  disabled={completing}
                  onClick={handleFinishComplete}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{completing ? 'Kaydediliyor...' : 'Kurulumu Tamamla'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// ANASAYFA BAŞLANGIÇ KONTROL KARTI (OnboardingChecklistCard)
// =========================================================================
export const OnboardingChecklistCard: React.FC<OnboardingChecklistCardProps> = ({
  shopProfile,
  sector,
  stats,
  onOpenWizard,
  onDismiss,
  onNavigate,
  onOpenShopProfile,
  onOpenMoneyIn,
}) => {
  if (!shopProfile?.isConfigured || shopProfile.onboardingCompleted !== false) {
    return null;
  }

  const sectorStepDone =
    sector === 'berber_kuafor'
      ? stats.staffCount > 0 || stats.servicesCount > 0
      : sector === 'kafe_restoran'
      ? stats.tablesCount > 0
      : sector === 'bakkal_market'
      ? stats.productsCount > 0
      : stats.customersCount > 0 || stats.productsCount > 0;

  const sectorStepLabel =
    sector === 'berber_kuafor'
      ? 'Usta / Hizmet Kurulumu'
      : sector === 'kafe_restoran'
      ? 'Masa & Menü Kurulumu'
      : sector === 'bakkal_market'
      ? 'Ürün / Stok Kurulumu'
      : 'Müşteri / Kayıt Kurulumu';

  const firstTxDone = stats.transactionsCount > 0 || stats.appointmentsCount > 0;

  const steps = [
    {
      id: 'profile',
      label: 'Profil Tamam',
      done: Boolean(shopProfile.isConfigured && shopProfile.storeName?.trim()),
      onClick: () => onOpenShopProfile?.(),
    },
    {
      id: 'logo',
      label: 'Dükkân Logosu',
      done: Boolean(shopProfile.logoUrl),
      onClick: () => onOpenShopProfile?.(),
    },
    {
      id: 'sector',
      label: sectorStepLabel,
      done: sectorStepDone,
      onClick: () => {
        if (sector === 'bakkal_market') {
          onNavigate?.('stock');
        } else if (['berber_kuafor', 'kafe_restoran', 'teknik_servis', 'avukat_danisman', 'terzi_kurutemizleme'].includes(sector)) {
          onNavigate?.('sector_view');
        } else {
          onNavigate?.('customers');
        }
      },
    },
    {
      id: 'first_action',
      label: 'İlk İşlem / Randevu',
      done: firstTxDone,
      onClick: () => {
        if (sector === 'berber_kuafor') {
          onNavigate?.('sector_view');
        } else {
          onOpenMoneyIn?.();
        }
      },
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const percent = Math.max(25, Math.round((doneCount / steps.length) * 100));

  return (
    <div className="bg-linear-to-r from-orange-50 via-amber-50/80 to-white dark:from-stone-900 dark:via-stone-900 dark:to-orange-950/20 rounded-2xl p-4 sm:p-5 border border-orange-200/90 dark:border-orange-800/50 shadow-xs space-y-3.5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/25">
            <Rocket className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-stone-900 dark:text-white tracking-tight">
                Dükkân Kurulum Rehberi
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[11px] font-black">
                %{percent}
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              {doneCount === steps.length
                ? 'Tebrikler! Tüm başlangıç adımlarınız hazır.'
                : `${steps.length - doneCount} kısa adım kaldı — sihirbazla 1 dakikada tamamlayın.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenWizard}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-xs transition-transform active:scale-98 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Sihirbazı Aç</span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Kapat / Tamamlandı</span>
          </button>
        </div>
      </div>

      {/* İlerleme Çubuğu */}
      <div className="w-full h-2 rounded-full bg-orange-100 dark:bg-stone-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-linear-to-r from-orange-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* 4 Adım Rozetleri */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={step.onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
              step.done
                ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-white dark:bg-stone-800/70 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-orange-400'
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-stone-400 shrink-0" />
            )}
            <span className="truncate">{step.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
