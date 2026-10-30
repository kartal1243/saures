import React, { useState, useEffect } from 'react';
import { ShopProfile } from '../../../shared/types.ts';
import {
  Crown,
  X,
  LifeBuoy,
  ShieldCheck,
  LayoutGrid,
  Sliders,
  CheckCircle2,
  CreditCard,
  QrCode,
  Flame,
  Loader2,
  Wrench,
  Send,
  Sparkles,
  PhoneCall,
  Laptop,
  Check,
  ArrowRight,
} from 'lucide-react';

interface VipAiConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopProfile?: ShopProfile;
  cash?: any;
  onApplyProfileTip?: (newSlogan: string) => Promise<void>;
  onVipStatusChanged?: (isVip: boolean) => void;
}

const CUSTOM_PANEL_PERKS = [
  {
    Icon: LayoutGrid,
    title: 'Dükkanınıza Özel Yazılım Ekibi',
    desc: 'Standart kalıplara sıkışmayın. Dükkanınızın tam ihtiyaç duyduğu butonları, özel fişleri ve ekranları doğrudan size özel kodluyoruz.',
    badge: 'Birebir Kodlama',
  },
  {
    Icon: Sparkles,
    title: 'Sesli Asistan & AI Tarife Okuma',
    desc: 'Türkçe sesli randevu kaydı ("Ahmet Usta\'ya saat 3\'e saç traşı yaz") ve fotoğrafını çektiğiniz fiyat panosunu 3 saniyede menüye çeviren AI OCR.',
    badge: 'Yapay Zeka',
  },
  {
    Icon: Sliders,
    title: 'Çoklu Usta & Otomatik Prim',
    desc: 'Dilediğiniz kadar personel ve usta ekleyin. Koltuk bazlı kâr, usta primi ve randevu takvimi kuruşu kuruşuna hesaplansın.',
    badge: 'Sınırsız Koltuk',
  },
  {
    Icon: ShieldCheck,
    title: 'Termal Fiş, Terazi & Donanım',
    desc: 'Barkodlu terazi, 58/80mm termal fiş yazıcıları ve karekodlu tezgah standı desteğiyle tam teşekküllü işletme istasyonuna dönüşün.',
    badge: 'Donanım Entegre',
  },
];

const SHOPIER_LINKS = {
  aylik: 'https://www.shopier.com/yamanyazilim/52387477',
  yillik: 'https://www.shopier.com/yamanyazilim/52387553',
};

export const VipAiConsultantModal: React.FC<VipAiConsultantModalProps> = ({
  isOpen,
  onClose,
  shopProfile,
  onVipStatusChanged,
}) => {
  const isAlreadyVip = Boolean(shopProfile?.isVip);
  const [activeTab, setActiveTab] = useState<'request' | 'pricing'>(isAlreadyVip ? 'request' : 'pricing');
  const [selectedPlan, setSelectedPlan] = useState<'aylik' | 'yillik'>('aylik');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [paymentRedirected, setPaymentRedirected] = useState(false);

  useEffect(() => {
    if (!isAlreadyVip) {
      setActiveTab('pricing');
    } else {
      setActiveTab('request');
    }
  }, [isAlreadyVip, isOpen]);

  // Talep formu alanları
  const [requestedFeatures, setRequestedFeatures] = useState('');
  const [contactPhone, setContactPhone] = useState(shopProfile?.phone || '');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    const targetUrl = selectedPlan === 'yillik'
      ? SHOPIER_LINKS.yillik
      : SHOPIER_LINKS.aylik;

    setPaymentRedirected(true);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedFeatures.trim()) return;

    setRequestSubmitting(true);
    try {
      const res = await fetch('/api/vip/request-custom-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: shopProfile?.businessField,
          requestedFeatures,
          phone: contactPhone,
          notes: requestNotes,
        }),
      });
      if (res.ok) {
        setRequestSubmitted(true);
      }
    } catch (err) {
      console.error('Custom request error:', err);
    } finally {
      setRequestSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-all flex flex-col max-h-[92vh]">
        {/* VIP Başlık */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-orange-500 via-orange-600 to-orange-700 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="flex items-center gap-3.5 relative">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner shrink-0">
              <Crown className="w-6 h-6 text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">İşletmenize Özel VIP Panel</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-orange-800 uppercase tracking-wider shadow-xs">
                  {isAlreadyVip ? 'VIP ÜYESİ' : 'ÖZEL GELİŞTİRME'}
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5 font-medium">
                {shopProfile?.storeName || 'Dükkanınız'} için ne gerekiyorsa birebir panelinize ekleyelim
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer shrink-0"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sekmeler - SADECE VIP olanlara açılır; VIP olmayanlar doğrudan satın alma sayfasını görür */}
        {isAlreadyVip && (
          <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-2 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'request'
                  ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Özel Panel İstiyorum
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'pricing'
                  ? 'bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              VIP Paket Bilgileri
            </button>
          </div>
        )}

        {/* Gövde */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'request' && (
            <div className="space-y-4">
              {/* Bilgilendirme Kartları */}
              <div className="grid sm:grid-cols-2 gap-3">
                {CUSTOM_PANEL_PERKS.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <div
                      key={item.title}
                      className="p-3.5 rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-800/40 flex items-start gap-3"
                    >
                      <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-stone-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                            {item.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 font-medium leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Panel Talep Formu */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">
                    Panelinize Hangi Özelliklerin Eklenmesini İstersiniz?
                  </h4>
                </div>

                {requestSubmitted ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-1">
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Özel Panel Talebiniz Alındı!
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Yazılım mühendisimiz en geç 24 saat içinde dükkanınız için prototip hazırlayıp sizinle iletişime geçecektir.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendCustomRequest} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                        İstediğiniz Özel Özellikler &amp; Ekranlar *
                      </label>
                      <textarea
                        rows={3}
                        value={requestedFeatures}
                        onChange={(e) => setRequestedFeatures(e.target.value)}
                        placeholder="Örn: Masalarımıza QR menü bağlayalım, tartıdan ağırlığı otomatik alsın, teknik serviste cihaz fotoğrafı çekelim, toptancıya otomatik WhatsApp siparişi versin..."
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        required
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                          İletişim Telefonunuz
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="05XX XXX XX XX"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                          Ek Açıklama / Not
                        </label>
                        <input
                          type="text"
                          value={requestNotes}
                          onChange={(e) => setRequestNotes(e.target.value)}
                          placeholder="Örn: Hafta içi saat 14:00'ten sonra arayabilirsiniz"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={requestSubmitting || !requestedFeatures.trim()}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-98"
                    >
                      {requestSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Talebiniz İletiliyor…
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Özel Panel Talebini Yazılım Ekibine Gönder
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-4">
              {/* Dönem Seçici Toggle */}
              <div className="flex items-center justify-center">
                <div className="p-1 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('aylik')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedPlan === 'aylik'
                        ? 'bg-white dark:bg-stone-700 text-orange-600 dark:text-orange-400 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Aylık (₺500 / ay)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('yillik')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedPlan === 'yillik'
                        ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <span>Yıllık (₺4.990 / yıl)</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white">
                      2 AY HEDİYE
                    </span>
                  </button>
                </div>
              </div>

              {/* ANA SAYFADAKİ VIP KARTININ BİREBİR AYNI TASARIMI */}
              <div className="relative p-6 sm:p-7 rounded-3xl bg-linear-to-b from-orange-500/5 via-white to-orange-500/10 dark:from-stone-900 dark:via-stone-900 dark:to-orange-950/20 border-2 border-orange-500/80 shadow-xl flex flex-col justify-between transition-all">
                {/* Üst Rozet */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-orange-500 to-orange-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-orange-500/30 flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5" />
                  ★ EN ÇOK TERCİH EDİLEN · GÜNDE SADECE 16 ₺
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      İşletmenizin Sağ Kolu
                    </span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-orange-500/15 text-orange-800 dark:text-orange-300 border border-orange-500/30">
                      Özel Yazılımcı Dahil
                    </span>
                  </div>
                  <h3 className="mt-3 text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                    İşletmeye Özel VIP Panel
                    <Crown className="w-5 h-5 text-orange-500" />
                  </h3>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-medium">
                    Günde 16 ₺'ye çırak bile tutamazsınız! Ayda 1 saç kesimi parasına tüm dükkanınız cebinizde.
                  </p>

                  <div className="mt-5 pb-5 border-b border-orange-200/60 dark:border-orange-800/40">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-white">
                        {selectedPlan === 'yillik' ? '₺4.990' : '₺500'}
                      </span>
                      <span className="text-xs font-bold text-stone-500">
                        {selectedPlan === 'yillik' ? '/ yıl' : '/ ay'}
                      </span>
                      {selectedPlan === 'yillik' ? (
                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          2 Ay Hediye (Net ₺1.010 Kazanç)
                        </span>
                      ) : (
                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                          Taahhütsüz Aylık
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] font-bold text-orange-700 dark:text-orange-400">
                      ✓ Günde sadece {selectedPlan === 'yillik' ? '13' : '16'} TL · 1 bardak çay parasına dükkana özel yazılım mühendisi
                    </p>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <p className="text-[11px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                      Sınırsız VIP Ayrıcalıkları
                    </p>
                    {[
                      'SINIRSIZ Müşteri, Veresiye ve Cari Takibi (25 limiti kalkar)',
                      'Online Randevu Takvimi, Randevu Linki & Tezgah QR Standı',
                      'SINIRSIZ Personel / Usta ve Otomatik Koltuk Prim Dağılımı',
                      'Türkçe Sesli Randevu & Kasa Asistanı (Web Speech AI)',
                      'Fotoğraftan Fiyat Tarifesi & Menü Okuyucu (AI OCR)',
                      'Termal Fiş Yazıcısı (58/80mm), Barkodlu Terazi Entegrasyonu',
                      'DÜKKANINIZA ÖZEL YAZILIM: İstediğiniz her form ve buton size özel kodlanır',
                      '7/24 Öncelikli Telefon & Canlı WhatsApp Yazılımcı Destek Hattı',
                    ].map((feat, idx) => (
                      <div
                        key={feat}
                        className={`flex items-center gap-2.5 text-xs sm:text-sm font-bold ${
                          idx === 6 ? 'text-orange-900 dark:text-orange-200' : 'text-stone-800 dark:text-stone-100'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-orange-200/60 dark:border-orange-800/40">
                  {paymentRedirected ? (
                    <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 text-center space-y-2.5">
                      <div className="w-10 h-10 mx-auto rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-orange-900 dark:text-orange-200">
                          Shopier Güvenli Ödeme Sayfası Açıldı
                        </p>
                        <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                          Ödemeniz tamamlandıktan sonra VIP üyeliğiniz en geç 15 dakika içinde aktif edilir.
                          Sipariş notuna dükkan adınızı veya kayıtlı telefonunuzu eklemeniz yeterlidir.
                        </p>
                      </div>
                      <div className="pt-1 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={handleUpgrade}
                          className="flex-1 py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition-colors"
                        >
                          Ödeme Sayfasını Tekrar Aç
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentRedirected(false)}
                          className="py-2 px-3 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold hover:bg-stone-300 transition-colors"
                        >
                          Planı Değiştir
                        </button>
                      </div>
                    </div>
                  ) : upgradeSuccess ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-1">
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> VIP Üyeliğiniz Aktif Edildi!
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        Dilediğiniz zaman "Özel Panel İstiyorum" sekmesinden yeni ekran veya özellik talep edebilirsiniz.
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="w-full py-3.5 px-4 rounded-xl text-sm font-black text-white bg-linear-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:to-orange-800 shadow-lg shadow-orange-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Tanımlanıyor…
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4 text-yellow-200" />
                          {selectedPlan === 'yillik'
                            ? 'Yıllık Avantajlı VIP Paketini Başlat (₺4.990)'
                            : 'Aylık VIP Paketini Başlat (₺500)'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                  <p className="mt-2 text-center text-[10px] text-stone-400 font-medium">
                    Taahhüt Yok · İstediğin Zaman İptal Et · Kredi Kartı Şartı Yok
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
