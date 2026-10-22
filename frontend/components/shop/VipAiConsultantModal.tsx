import React, { useState } from 'react';
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
    title: 'İşletmenize %100 Özel Panel',
    desc: 'Standart kalıplara sıkışmayın. Dükkanınızın tam ihtiyaç duyduğu ekranları, butonları ve iş akışını size özel tasarlıyoruz.',
    badge: 'Terzi Usulü',
  },
  {
    Icon: Sliders,
    title: 'Özel Fiş, Form ve Hesaplama',
    desc: 'Sektörünüze özel tartı, parça kodu, emanet fişi, randevu saati veya iskonto mantıklarını sisteme ekliyoruz.',
    badge: 'Sınırsız Özelleştirme',
  },
  {
    Icon: Laptop,
    title: 'Doğrudan Yazılımcı Desteği',
    desc: 'Robotlarla veya yapay zekayla uğraşmayın. Doğrudan dükkanınızı anlayan yazılım ekibimizle birebir iletişim kurun.',
    badge: 'Öncelikli Ekip',
  },
  {
    Icon: ShieldCheck,
    title: 'Banka Güvenliği & Özel Bulut',
    desc: 'Tüm kasa ve müşteri defteriniz kesintisiz yedeklenir, telefon değiştirseniz bile hiçbir veriniz kaybolmaz.',
    badge: 'Güvenli Altyapı',
  },
];

export const VipAiConsultantModal: React.FC<VipAiConsultantModalProps> = ({
  isOpen,
  onClose,
  shopProfile,
  onVipStatusChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'pricing'>('request');
  const [selectedPlan, setSelectedPlan] = useState<'aylik' | 'yillik'>('yillik');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Talep formu alanları
  const [requestedFeatures, setRequestedFeatures] = useState('');
  const [contactPhone, setContactPhone] = useState(shopProfile?.phone || '');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  if (!isOpen) return null;

  const isAlreadyVip = Boolean(shopProfile?.isVip);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/vip/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planPeriod: selectedPlan, paymentChannel: 'fast_demo' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUpgradeSuccess(true);
        if (onVipStatusChanged) onVipStatusChanged(true);
      }
    } catch (err) {
      console.error('VIP upgrade error:', err);
    } finally {
      setIsUpgrading(false);
    }
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
        <div className="p-5 sm:p-6 bg-linear-to-r from-amber-500 via-amber-600 to-yellow-600 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="flex items-center gap-3.5 relative">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner shrink-0">
              <Crown className="w-6 h-6 text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">İşletmenize Özel VIP Panel</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-amber-800 uppercase tracking-wider shadow-xs">
                  {isAlreadyVip ? 'VIP ÜYESİ' : 'ÖZEL GELİŞTİRME'}
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5 font-medium">
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

        {/* Sekmeler */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-2 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('request')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'request'
                ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs'
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
                ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Paketler &amp; Fiyat
          </button>
        </div>

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
              <div className="text-center max-w-sm mx-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  ŞEFFAF VE TAAHHÜTSÜZ
                </span>
                <h3 className="mt-1.5 text-base font-black text-stone-900 dark:text-white">
                  İşletmenize Özel VIP Paket Seçenekleri
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Aylık Paket */}
                <div
                  onClick={() => setSelectedPlan('aylik')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedPlan === 'aylik'
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-md'
                      : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/40'
                  }`}
                >
                  <p className="text-xs font-black uppercase text-stone-500 dark:text-stone-400">Aylık VIP</p>
                  <p className="mt-1 text-2xl font-black text-stone-900 dark:text-white">
                    ₺249 <span className="text-xs font-bold text-stone-400">/ ay</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1 font-medium">
                    İstediğiniz zaman iptal edebilirsiniz.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[11px] font-bold text-stone-700 dark:text-stone-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> İşletmeye Özel Panel Modifikasyonu
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sınırsız Müşteri &amp; Kasa Girişi
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Öncelikli Yazılım Desteği
                    </li>
                  </ul>
                </div>

                {/* Yıllık Paket */}
                <div
                  onClick={() => setSelectedPlan('yillik')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    selectedPlan === 'yillik'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/25 shadow-md'
                      : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/40'
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5" /> 2 AY HEDİYE
                  </span>
                  <p className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">Yıllık Avantajlı VIP</p>
                  <p className="mt-1 text-2xl font-black text-stone-900 dark:text-white">
                    ₺2.490 <span className="text-xs font-bold text-stone-400">/ yıl</span>
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                    Net ₺498 kâr, tam yıl kesintisiz panel.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[11px] font-bold text-stone-700 dark:text-stone-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Tüm Özel Panel Düzenlemeleri
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Özel FAST Karekod &amp; IBAN Kurulumu
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Birebir Telefon &amp; WhatsApp Ekip Hattı
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                {upgradeSuccess ? (
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
                    className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-sm shadow-md shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Tanımlanıyor…
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4" />
                        {selectedPlan === 'yillik' ? 'Yıllık VIP Paketini Başlat (₺2.490)' : 'Aylık VIP Paketini Başlat (₺249)'}
                      </>
                    )}
                  </button>
                )}

                <p className="text-[10px] text-stone-400 text-center mt-2 flex items-center justify-center gap-1">
                  <QrCode className="w-3 h-3 text-emerald-500" />
                  Kredi Kartı veya FAST Karekod ile anında güvenli aktivasyon
                </p>
              </div>

              {/* Destek Kutusu */}
              <div className="rounded-2xl bg-linear-to-r from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-5 h-5 text-emerald-200 shrink-0" />
                  <div>
                    <h5 className="text-xs font-black">Yazılım Ekibine Ulaşın</h5>
                    <p className="text-[11px] text-emerald-100">Dükkanınıza özel ek modül ve sorularınız için:</p>
                  </div>
                </div>
                <span className="text-xs font-black bg-white/20 px-3 py-1.5 rounded-xl whitespace-nowrap">
                  omeryaman6@hotmail.com
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
