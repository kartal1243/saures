import React, { useState } from 'react';
import { ShopProfile, CashRegister } from '../../../shared/types.ts';
import {
  Crown,
  X,
  LifeBuoy,
  ShieldCheck,
  BellRing,
  MessageSquare,
  Boxes,
  Users,
  TrendingUp,
  Sparkles,
  Bot,
  Send,
  Loader2,
  CheckCircle2,
  CreditCard,
  QrCode,
  Flame,
} from 'lucide-react';

interface VipAiConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopProfile?: ShopProfile;
  cash?: CashRegister;
  onApplyProfileTip?: (newSlogan: string) => Promise<void>;
  onVipStatusChanged?: (isVip: boolean) => void;
}

const VIP_FEATURES = [
  {
    Icon: Bot,
    title: '7/24 AI Dükkan Danışmanı',
    desc: 'Ciro hedefleri, toptancı iskontoları ve mahalle pazarlama tavsiyeleri.',
    badge: 'Yapay Zeka',
  },
  {
    Icon: MessageSquare,
    title: 'Toplu WhatsApp Alacak Turu',
    desc: 'Veresiye defterindeki borçlulara tek tıkla nazik hatırlatma gönderimi.',
    badge: 'Hızlı Tahsilat',
  },
  {
    Icon: Boxes,
    title: 'Kritik Stok & Erken Sipariş',
    desc: 'Tükenmeye yaklaşan ürünleri ve tedarikçi maliyetlerini anlık takip edin.',
    badge: 'Stok Kalkanı',
  },
  {
    Icon: TrendingUp,
    title: 'Patron Kâr/Zarar Raporu',
    desc: 'Haftalık net kâr, kasa açığı denkleştirme ve gelir-gider trendleri.',
    badge: 'Finans Raporu',
  },
  {
    Icon: Users,
    title: 'Çoklu Personel & Prim',
    desc: 'Usta, kalfa ve çırakların yaptığı işlemleri ve prim hakedişlerini yönetin.',
    badge: 'Ekip Yönetimi',
  },
  {
    Icon: ShieldCheck,
    title: 'Bulut Yedekleme & Sınırsız Kayıt',
    desc: 'Telefon bozulsa bile tüm müşteri carisi ve kasa hareketleri güvende.',
    badge: 'Banka Güvenliği',
  },
];

export const VipAiConsultantModal: React.FC<VipAiConsultantModalProps> = ({
  isOpen,
  onClose,
  shopProfile,
  onVipStatusChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'benefits' | 'ai_chat' | 'payment'>('benefits');
  const [selectedPlan, setSelectedPlan] = useState<'aylik' | 'yillik'>('yillik');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // AI Chat States
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; title?: string }>>([
    {
      sender: 'ai',
      title: 'Hoş Geldiniz Ahmet Usta!',
      text: 'Ben Dükkanım Yanımda VIP Esnaf Danışmanınız. Dükkanınızın cirosunu artırmak, toptancı giderlerini düşürmek veya veresiyeleri hızla toplamak için bana istediğinizi sorabilirsiniz.',
    },
  ]);

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
        setTimeout(() => {
          setActiveTab('ai_chat');
        }, 1500);
      }
    } catch (err) {
      console.error('VIP upgrade error:', err);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSendAiMessage = async (customText?: string, topic?: string) => {
    const textToSend = customText || chatMessage;
    if (!textToSend.trim()) return;

    const newHistory = [...chatHistory, { sender: 'user' as const, text: textToSend }];
    setChatHistory(newHistory);
    if (!customText) setChatMessage('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/vip/ai-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, topic: topic || 'general' }),
      });
      const data = await res.json();
      if (data && data.advice) {
        setChatHistory([
          ...newHistory,
          { sender: 'ai' as const, text: data.advice, title: data.title },
        ]);
      }
    } catch {
      setChatHistory([
        ...newHistory,
        {
          sender: 'ai' as const,
          text: 'Bağlantı sırasında bir aksaklık oldu ancak esnaf tavsiyemiz hazır: Günlük kasanızı sıkı tutun ve müşterilerinizle güler yüzlü iletişimi elden bırakmayın.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-all flex flex-col max-h-[90vh]">
        {/* VIP Başlık */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-amber-500 via-amber-600 to-yellow-600 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner shrink-0">
              <Crown className="w-6 h-6 text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">VIP Esnaf Kulübü</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-amber-800 uppercase tracking-wider shadow-xs">
                  {isAlreadyVip ? 'AKTİF ÜYE' : 'ÖZEL AYRICALIK'}
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5 font-medium">
                {shopProfile?.storeName || 'Dükkanınız'} için kâr artıran ve zaman kazandıran dijital güç
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

        {/* Sekme Butonları */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-2 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('benefits')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'benefits'
                ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ayrıcalıklar &amp; Özellikler
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_chat')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'ai_chat'
                ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Yapay Zeka Danışmanı
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'payment'
                ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Paket &amp; Ödeme Planı
          </button>
        </div>

        {/* Gövde İçeriği */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* SEKME 1: AYRICALIKLAR */}
          {activeTab === 'benefits' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {VIP_FEATURES.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <div
                      key={item.title}
                      className="p-3.5 rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-800/40 hover:border-amber-300 transition-all flex items-start gap-3"
                    >
                      <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-stone-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 whitespace-nowrap">
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

              {/* Alt Hızlı Eylem Banner'ı */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-amber-50 via-yellow-50 to-amber-50/50 dark:from-stone-800 dark:to-stone-800/70 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-amber-950 dark:text-amber-200">
                    VIP Üyeliğiyle Dükkanınızın Kazancını Katlayın
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-medium mt-0.5">
                    Ayda sadece 1 bardak çay parasına tüm profesyonel modüller açık.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('payment')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  Paketleri İncele
                </button>
              </div>
            </div>
          )}

          {/* SEKME 2: 7/24 AI DANIŞMAN SOHBETİ */}
          {activeTab === 'ai_chat' && (
            <div className="space-y-3 flex flex-col h-full min-h-[340px]">
              {/* Hızlı Tavsiye Butonları */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSendAiMessage('Dükkanımın vitrinini ve tabelasını nasıl daha çekici yapabilirim?', 'profile')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-stone-700 dark:text-stone-300 transition-colors"
                >
                  💡 Vitrin &amp; Tabela Tüyosu
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAiMessage('Aylık toptancı ve dükkan giderlerini nasıl %15 düşürürüm?', 'expenses')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-stone-700 dark:text-stone-300 transition-colors"
                >
                  📉 Toptancı Masraf Tasarrufu
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAiMessage('Müşterileri veresiye yerine nakit veya FAST karekoda nasıl alıştırırım?', 'general')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-stone-700 dark:text-stone-300 transition-colors"
                >
                  💳 Hızlı Tahsilat Taktikleri
                </button>
              </div>

              {/* Sohbet Akışı */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 max-h-[300px]">
                {chatHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                        item.sender === 'user'
                          ? 'bg-amber-500 text-white font-bold rounded-tr-none'
                          : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200/70 dark:border-stone-700 rounded-tl-none font-medium'
                      }`}
                    >
                      {item.title && (
                        <p className="font-black text-amber-600 dark:text-amber-400 mb-1 border-b border-stone-100 dark:border-stone-700 pb-1">
                          {item.title}
                        </p>
                      )}
                      <p className="whitespace-pre-line leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-400 p-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    Ahmet Usta için tavsiyeler hazırlanıyor…
                  </div>
                )}
              </div>

              {/* Giriş Alanı */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendAiMessage();
                  }}
                  placeholder="Danışmana sor: Ciro nasıl artar, toptancı indirimi nasıl istenir..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleSendAiMessage()}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gönder
                </button>
              </div>
            </div>
          )}

          {/* SEKME 3: PAKETLER & ÖDEME PLANI */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div className="text-center max-w-sm mx-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  ESNAFA ÖZEL ŞEFFAF FİYATLANDIRMA
                </span>
                <h3 className="mt-1.5 text-base font-black text-stone-900 dark:text-white">
                  Size En Uygun VIP Paketini Seçin
                </h3>
              </div>

              {/* Paket Karşılaştırma Kartları */}
              <div className="grid sm:grid-cols-2 gap-3">
                {/* Aylık Paket */}
                <div
                  onClick={() => setSelectedPlan('aylik')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    selectedPlan === 'aylik'
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-md'
                      : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/40'
                  }`}
                >
                  <p className="text-xs font-black uppercase text-stone-500 dark:text-stone-400">Aylık VIP</p>
                  <p className="mt-1 text-2xl font-black text-stone-900 dark:text-white">
                    ₺149 <span className="text-xs font-bold text-stone-400">/ ay</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1 font-medium">
                    Taahhüt yok, dilediğiniz ay iptal edilebilir.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[11px] font-bold text-stone-700 dark:text-stone-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 7/24 AI Dükkan Danışmanı
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sınırsız Veresiye Defteri
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Toplu Hatırlatma
                    </li>
                  </ul>
                </div>

                {/* Yıllık Paket (Avantajlı) */}
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
                    ₺1.490 <span className="text-xs font-bold text-stone-400">/ yıl</span>
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                    Aylık ₺124'ye gelir, net ₺298 tasarruf.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[11px] font-bold text-stone-700 dark:text-stone-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Tüm Aylık Özellikler
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Öncelikli VIP Telefon &amp; WhatsApp Destek
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Özel FAST Karekod Entegrasyonu
                    </li>
                  </ul>
                </div>
              </div>

              {/* Ödeme / Aktivasyon Eylemi */}
              <div className="pt-2">
                {upgradeSuccess ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-1">
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> VIP Üyeliğiniz Aktif Edildi!
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Tüm modüller açıldı, danışman sohbetine yönlendiriliyorsunuz.
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
                        Üyelik Tanımlanıyor…
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4" />
                        {selectedPlan === 'yillik' ? 'Yıllık VIP Paketini Başlat (₺1.490)' : 'Aylık VIP Paketini Başlat (₺149)'}
                      </>
                    )}
                  </button>
                )}

                <p className="text-[10px] text-stone-400 text-center mt-2 flex items-center justify-center gap-1">
                  <QrCode className="w-3 h-3 text-emerald-500" />
                  Kredi Kartı veya TR-Karekod (FAST) ile anında güvenli aktivasyon
                </p>
              </div>

              {/* Destek Kutusu */}
              <div className="rounded-2xl bg-linear-to-r from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <LifeBuoy className="w-5 h-5 text-emerald-200 shrink-0" />
                  <div>
                    <h5 className="text-xs font-black">Sorunuz mu var?</h5>
                    <p className="text-[11px] text-emerald-100">Kasa, yedekleme veya fatura için direkt esnaf hattımız:</p>
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
