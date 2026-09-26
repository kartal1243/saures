import React, { useState } from 'react';
import { ShopProfile, CashRegister } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  Crown,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  MessageSquare,
  LifeBuoy,
  Send,
  X,
  Check,
  Award,
  ArrowRight,
  Bot,
  Lightbulb,
  FileCheck,
  RefreshCw,
} from 'lucide-react';

interface VipAiConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopProfile?: ShopProfile;
  cash: CashRegister;
  onApplyProfileTip?: (newSlogan: string) => Promise<void>;
}

export const VipAiConsultantModal: React.FC<VipAiConsultantModalProps> = ({
  isOpen,
  onClose,
  shopProfile,
  cash,
  onApplyProfileTip,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'expenses' | 'advisor' | 'support'>('profile');
  const [userQuery, setUserQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [appliedSlogan, setAppliedSlogan] = useState(false);

  if (!isOpen) return null;

  const handleAskAdvisor = async (customMessage?: string, topic?: 'profile' | 'expenses' | 'chat') => {
    const msg = customMessage || userQuery;
    if (!msg.trim() && !topic) return;

    setIsLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch('/api/vip/ai-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          topic: topic || 'chat',
        }),
      });
      const data = await res.json();
      if (data.advice) {
        setAiResponse(data.advice);
      }
    } catch (err) {
      console.error('AI Consultant fetch error:', err);
      setAiResponse('Danışman yanıtı yüklenirken bir bağlantı hatası oluştu, lütfen tekrar deneyiniz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySlogan = async (slogan: string) => {
    if (onApplyProfileTip) {
      await onApplyProfileTip(slogan);
      setAppliedSlogan(true);
      setTimeout(() => setAppliedSlogan(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-colors">
        {/* VIP Golden Banner */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-amber-500 via-amber-600 to-yellow-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-white shadow-inner">
              <Crown className="w-7 h-7 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">VIP Esnaf & Yapay Zeka Danışmanı</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-amber-800 uppercase tracking-wide">
                  VIP Club
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                {shopProfile?.storeName || 'Dükkanınız'} için ayrıcalıklar kulübü — borcunu toplayan, kârını artıran araçlar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIP vitrin: neden VIP + yol haritası (ön yüz only) */}
        <div className="px-5 sm:px-6 pt-5">
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <p className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" /> Neden VIP?
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-medium">
                Esnafın paraya dönüşen 3 şeyi: <b>geciken borcu toplamak</b>, <b>gideri kısmak</b>, <b>ciroyu artırmak</b>. VIP araçlar tam bunun için geliyor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setActiveTab('advisor'); setAiResponse(null); }}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md transition-colors cursor-pointer"
            >
              <Bot className="w-4 h-4" /> AI Danışmanı Dene
            </button>
          </div>

          <p className="mt-4 mb-2 text-[11px] font-black uppercase tracking-widest text-stone-400">
            VIP Yol Haritası
          </p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {(
              [
                { Icon: Bot, t: 'Yapay Zeka Danışman', d: '7/24 ciro, gider ve vitrin önerileri', on: true },
                { Icon: MessageSquare, t: 'Otomatik Hatırlatma Paketi', d: 'Geciken borca toplu WhatsApp takibi', on: false },
                { Icon: TrendingUp, t: 'Patron Raporları', d: 'Haftalık kâr/zarar PDF özeti', on: false },
                { Icon: FileCheck, t: 'Muhasebeciye Tek Tık', d: 'Defteri müşavire hazır dosya olarak gönder', on: false },
                { Icon: LifeBuoy, t: 'Öncelikli Destek', d: 'Sorunda sıra beklemeden yardım', on: false },
                { Icon: Store, t: 'Sınırsız Kayıt', d: 'Müşteri, ürün ve fiş limiti yok', on: false },
              ] as const
            ).map(({ Icon, t, d, on }) => (
              <div
                key={t}
                className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                  on
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${on ? 'bg-emerald-500 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-300'}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-black text-stone-900 dark:text-white">
                    {t}
                    <span className={`px-1.5 py-px rounded-full text-[9px] font-black ${on ? 'bg-emerald-500 text-white' : 'bg-stone-300 dark:bg-stone-600 text-stone-600 dark:text-stone-300'}`}>
                      {on ? 'Aktif' : 'Yakında'}
                    </span>
                  </span>
                  <span className="block text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">{d}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 px-4 pt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setAiResponse(null);
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-white dark:bg-stone-900 rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Store className="w-4 h-4 text-amber-500" />
            <span>Profil & Vitrin İyileştirme</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('expenses');
              setAiResponse(null);
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-white dark:bg-stone-900 rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span>Gider & Toptancı Tasarrufu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('advisor');
              setAiResponse(null);
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'advisor'
                ? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-white dark:bg-stone-900 rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Canlı Yapay Zeka Danışmanı</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'support'
                ? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-white dark:bg-stone-900 rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <LifeBuoy className="w-4 h-4 text-emerald-500" />
            <span>VIP Canlı Destek</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 max-h-[72vh] overflow-y-auto space-y-4">
          {/* TAB 1: Dükkan Profil & Vitrin İyileştirme */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                  <p className="font-bold">Yapay Zeka Dükkan Vitrin Analizi</p>
                  <p className="text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                    <strong>{shopProfile?.storeName}</strong> ({shopProfile?.businessField}) profili incelendi.
                    Müşteri sadakatini ve mahalle bilinirliğinizi artıracak akıllı öneriler aşağıdadır.
                  </p>
                </div>
              </div>

              {/* Suggestions Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Önerilen Vitrin Sloganı
                  </span>
                  <p className="text-sm font-bold text-stone-900 dark:text-white">
                    "Tazelik, Güleryüz ve Bereket: Mahallenizin Samimi Adresi"
                  </p>
                  <button
                    type="button"
                    onClick={() => handleApplySlogan('Tazelik, Güleryüz ve Bereket: Mahallenizin Samimi Adresi')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer pt-1"
                  >
                    {appliedSlogan ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span>{appliedSlogan ? 'Slogan Uygulandı!' : 'Bu Sloganı Dükkana Uygula'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Google Haritalar Profili
                  </span>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    Google Haritalar işletme açıklamanıza <em>"{shopProfile?.cityDistrict || 'Semt'} {shopProfile?.businessField}"</em> anahtar kelimesini ekleyip çalışma saatlerinizi doğrulayın.
                  </p>
                </div>
              </div>

              {/* Generate Custom Profile Tips with AI */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleAskAdvisor('Dükkan vitrinimi, tabelamı ve müşteri karşılama düzenimi nasıl iyileştirebilirim?', 'profile')}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isLoading ? 'Yapay Zeka Analiz Ediyor...' : 'Dükkanım İçin Özel Vitrin ve Tabela Raporu Al'}</span>
                </button>
              </div>

              {aiResponse && (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                  <p className="font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                    <Bot className="w-4 h-4" /> VIP Danışman Tavsiyesi:
                  </p>
                  {aiResponse}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Gider & Toptancı Tasarrufu */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-rose-900 dark:text-rose-200">
                  <p className="font-bold">Finansal Kasa ve Masraf Durumu</p>
                  <p className="text-rose-800/90 dark:text-rose-300/90 mt-0.5">
                    Bugünkü dükkan gideriniz: <strong>{formatCurrency(cash.todayExpense)}</strong>.
                    Bugünkü net kasanız: <strong>{formatCurrency(cash.todayTotalIncome - cash.todayExpense)}</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 text-xs space-y-1">
                  <p className="font-bold text-stone-900 dark:text-white">1. Toptancı Peşin Alım İskontosu</p>
                  <p className="text-stone-600 dark:text-stone-300">
                    Haftalık toptancı siparişlerinde vadeli ödemek yerine nakit kapatarak ortalama %5 iskonto kazanın. Ayda 3.000 - 8.000 TL net tasarruf sağlar.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 text-xs space-y-1">
                  <p className="font-bold text-stone-900 dark:text-white">2. POS Cihazı Komisyon Optimizasyonu</p>
                  <p className="text-stone-600 dark:text-stone-300">
                    Bugünkü kartlı cironuz {formatCurrency(cash.todayCard)}. Bankanızla görüşerek ertesi gün hesap geçişli komisyon oranınızı düşürün veya tezgaha IBAN FAST QR kodunu asın.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAskAdvisor('Dükkanımın gereksiz giderlerini kısmak ve kâr marjımı %15 artırmak için pratik esnaf tüyoları ver.', 'expenses')}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <TrendingDown className="w-4 h-4" />
                <span>{isLoading ? 'Hesaplanıyor...' : 'Gider Azaltma & Tasarruf Raporunu Çalıştır'}</span>
              </button>

              {aiResponse && (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                  <p className="font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                    <Bot className="w-4 h-4" /> Gider Tasarruf Analizi:
                  </p>
                  {aiResponse}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Canlı Yapay Zeka Danışmanı */}
          {activeTab === 'advisor' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3">
                <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-indigo-900 dark:text-indigo-200">
                  <p className="font-bold">Esnaf Yapay Zeka Asistanı (Gemini 3.8 Destekli)</p>
                  <p className="text-indigo-800/90 dark:text-indigo-300/90 mt-0.5">
                    Dükkanınızla ilgili aklınıza takılan her şeyi sorun. Fiyat belirleme, müşteri yönetimi, ciro hedefleri gibi konularda anında yardımcı olur.
                  </p>
                </div>
              </div>

              {/* Ready Query Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Örnek Esnaf Soruları (Tek Tıkla Sor):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Günlük ciro hedefimi nasıl artırırım?',
                    'Müşteriyi veresiye yerine nakite nasıl alıştırırım?',
                    'Toptancı fiyat artışını müşteriye nasıl yansıtmalıyım?',
                    'Çalışan / çırak motivasyonunu nasıl yükseltirim?',
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setUserQuery(q);
                        handleAskAdvisor(q, 'chat');
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-indigo-100 dark:bg-stone-800 dark:hover:bg-indigo-950 text-stone-700 dark:text-stone-300 hover:text-indigo-700 transition-colors border border-stone-200 dark:border-stone-700 cursor-pointer text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAdvisor()}
                  placeholder="Dükkanınızla ilgili dilediğiniz soruyu yazın..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAskAdvisor()}
                  disabled={isLoading || !userQuery.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{isLoading ? 'Cevaplanıyor...' : 'Sor'}</span>
                </button>
              </div>

              {aiResponse && (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Danışman Yanıtı:
                  </p>
                  {aiResponse}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VIP Canlı Destek */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 text-white space-y-2">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-6 h-6" />
                  <h3 className="text-base font-bold">Öncelikli Esnaf Canlı Destek Hattı</h3>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  VIP üyeliğiniz sayesinde kasa, gün sonu ve program kullanımıyla ilgili her an canlı ekibimize danışabilirsiniz.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-1">
                  <p className="font-bold text-stone-900 dark:text-white">WhatsApp Hızlı Destek</p>
                  <p className="text-stone-500 dark:text-stone-400">Hafta içi ve Cumartesi 08:00 - 22:00 arası canlı destek.</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 pt-1">0850 123 45 67</p>
                </div>
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-1">
                  <p className="font-bold text-stone-900 dark:text-white">Dükkan Profil Danışmanı</p>
                  <p className="text-stone-500 dark:text-stone-400">Harita kaydı ve tabela danışmanlığı randevusu oluşturun.</p>
                  <p className="font-bold text-amber-600 dark:text-amber-400 pt-1">vip@esnafportali.com</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
