import React, { useState, useEffect } from 'react';
import { Store, Users, Phone, MapPin, Target, Sparkles, Check, X, ShieldAlert, Award, ArrowRight, ArrowLeft, Download, Upload, DatabaseBackup } from 'lucide-react';
import { ShopProfile, BusinessSector } from '../types';

interface ShopProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile?: ShopProfile;
  onSaveProfile: (profile: ShopProfile) => Promise<void>;
  isFirstTime?: boolean;
  onRestoreBackup?: (f: File) => void;
}

const BUSINESS_FIELDS = [
  'Bakkal / Market / Büfe',
  'Kafe / Çay Ocağı / Restoran',
  'Kuaför / Berber / Güzellik Salonu',
  'Avukat / Danışmanlık / Hukuk',
  'Oto Tamir / Yıkama / Yedek Parça',
  'Terzi / Kuru Temizleme / Giyim',
  'Kırtasiye / Kitap / Fotokopi',
  'Teknoloji / Telefon Tamiri & Aksesuar',
  'Manav / Kasap / Şarküteri',
  'Çiçekçi / Hediyelik Eşya',
  'Diğer Mahalle Hizmeti & Ticaret',
];

const EMPLOYEE_OPTIONS = [
  { id: '1', label: '1 Kişi (Tek başıma çalışıyorum)' },
  { id: '2-3', label: '2 - 3 Kişi (Küçük ekip / Aile)' },
  { id: '4-5', label: '4 - 5 Kişi (Genişleyen işletme)' },
  { id: '6+', label: '6+ Kişi (Orta ölçekli dükkan)' },
];

export const ShopProfileModal: React.FC<ShopProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
  isFirstTime = false,
  onRestoreBackup,
}) => {
  const [storeName, setStoreName] = useState(currentProfile?.storeName || '');
  const [ownerName, setOwnerName] = useState(currentProfile?.ownerName || '');
  const [businessField, setBusinessField] = useState(currentProfile?.businessField || BUSINESS_FIELDS[0]);
  const [employeeCount, setEmployeeCount] = useState(currentProfile?.employeeCount || '1');
  const [phone, setPhone] = useState(currentProfile?.phone || '');
  const [cityDistrict, setCityDistrict] = useState(currentProfile?.cityDistrict || '');
  const [dailyTarget, setDailyTarget] = useState(currentProfile?.dailyTarget || 2500);
  const [slogan, setSlogan] = useState(currentProfile?.slogan || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) setStep(1);
    if (currentProfile) {
      setStoreName(currentProfile.storeName || '');
      setOwnerName(currentProfile.ownerName || '');
      setBusinessField(currentProfile.businessField || BUSINESS_FIELDS[0]);
      setEmployeeCount(currentProfile.employeeCount || '1');
      setPhone(currentProfile.phone || '');
      setCityDistrict(currentProfile.cityDistrict || '');
      setDailyTarget(currentProfile.dailyTarget || 2500);
      setSlogan(currentProfile.slogan || '');
    }
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  const canNextFromStep1 = storeName.trim().length >= 2;
  const goNext = () => {
    if (step === 1 && !canNextFromStep1) {
      setError('Lütfen dükkan adını yazınız.');
      return;
    }
    setError(null);
    setStep((s) => Math.min(3, s + 1));
  };
  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setError('Lütfen dükkan / işletme adını yazınız.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      let derivedSector: BusinessSector = currentProfile?.sectorKey || 'bakkal_market';
      if (businessField.includes('Berber') || businessField.includes('Kuaför')) {
        derivedSector = 'berber_kuafor';
      } else if (businessField.includes('Kafe') || businessField.includes('Restoran')) {
        derivedSector = 'kafe_restoran';
      } else if (businessField.includes('Tamir') || businessField.includes('Teknik') || businessField.includes('Oto')) {
        derivedSector = 'teknik_servis';
      } else if (businessField.includes('Avukat') || businessField.includes('Danışman') || businessField.includes('Hukuk')) {
        derivedSector = 'avukat_danisman';
      } else if (businessField.includes('Bakkal') || businessField.includes('Market')) {
        derivedSector = 'bakkal_market';
      } else {
        derivedSector = 'diger_esnaf';
      }

      await onSaveProfile({
        storeName: storeName.trim(),
        ownerName: ownerName.trim() || 'Esnaf',
        businessField,
        sectorKey: currentProfile?.sectorKey || derivedSector,
        employeeCount,
        phone: phone.trim(),
        cityDistrict: cityDistrict.trim(),
        dailyTarget: Number(dailyTarget) || 2500,
        slogan: slogan.trim() || 'Mahallenin Güvenilir Esnafı',
        isConfigured: true,
        isVip: currentProfile?.isVip ?? true,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Profil kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-colors">
        {/* Header + Step Progress */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between relative">
          {isFirstTime && (
            <div className="absolute top-0 left-0 right-0 flex gap-1.5 px-4 pt-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`h-1 flex-1 rounded-full transition-colors ${n <= step ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                {isFirstTime ? `Dükkan Kurulumu — Adım ${step}/3` : 'Dükkan Bilgileri & Profil'}
              </h2>
              <p className="text-xs text-amber-100 mt-0.5">
                {isFirstTime
                  ? step === 1
                    ? 'Dükkanınızı ve iş kolunuzu tanıyalım'
                    : step === 2
                    ? 'Ekip ve iletişim bilgilerinizi ekleyin'
                    : 'Hedefinizi belirleyin, dükkanı hazır edelim'
                  : 'Dükkan adı, sektör ve çalışan bilgilerini güncelleyin'}
              </p>
            </div>
          </div>
          {!isFirstTime && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body — wizard when first time */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isFirstTime ? (
            <>
              {/* Adım 1: Dükkan adı + tip + yetkili */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      Dükkan / İşletme Adı *
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-store-name"
                        type="text"
                        required
                        autoFocus
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Örn: Bereket Bakkaliyesi, Yıldız Kuaför..."
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      Hangi Alanda Faaliyet Gösteriyorsunuz? *
                    </label>
                    <select
                      id="select-business-field"
                      value={businessField}
                      onChange={(e) => setBusinessField(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors cursor-pointer"
                    >
                      {BUSINESS_FIELDS.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Buna göre ana panel arkaplanda otomatik ayarlanır (tezgâh / masa / randevu / servis).</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      Dükkan Sahibi / Yetkili
                    </label>
                    <input
                      id="input-owner-name"
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Örn: Ahmet Usta, Merve Hanım"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Adım 2: Çalışan + iletişim */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      Dükkanda Kaç Kişi Çalışıyorsunuz?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EMPLOYEE_OPTIONS.map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            employeeCount === opt.id
                              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-400'
                              : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="employeeCount"
                            value={opt.id}
                            checked={employeeCount === opt.id}
                            onChange={() => setEmployeeCount(opt.id)}
                            className="accent-amber-600"
                          />
                          <Users className="w-4 h-4 text-stone-400 shrink-0" />
                          <span className="text-xs">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                        Şehir / Semt
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-city-district"
                          type="text"
                          value={cityDistrict}
                          onChange={(e) => setCityDistrict(e.target.value)}
                          placeholder="Örn: İstanbul / Kadıköy"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                        WhatsApp Telefonu
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="05XX XXX XX XX"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Adım 3: Hedef + slogan + özet */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      Günlük Hedef Ciro (₺)
                    </label>
                    <div className="relative">
                      <Target className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-daily-target"
                        type="number"
                        min={100}
                        step={50}
                        value={dailyTarget}
                        onChange={(e) => setDailyTarget(Number(e.target.value))}
                        placeholder="2500"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Panel canlı kasayı buna göre yüzdeler.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      Dükkan Sloganı / Vitrin Notu (İsteğe Bağlı)
                    </label>
                    <input
                      id="input-slogan"
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      placeholder="Örn: Mahallenin Güler Yüzlü Esnafı..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
                    <p className="font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-600" /> Özet</p>
                    <p className="text-stone-600 dark:text-stone-400 mt-1">
                      <b>{storeName || '—'}</b> • {businessField} • {employeeCount} çalışan
                      {cityDistrict ? ` • ${cityDistrict}` : ''} — Hedef {dailyTarget}₺/gün
                    </p>
                    <p className="text-stone-500 dark:text-stone-500 mt-1">Kaydedince dükkan tipine göre özel ekran (sektör) ve panel ayarlanır.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold">VIP Esnaf Ayrıcalıkları Aktif</p>
                      <p className="text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                        Dükkan bilgilerinizle 7/24 Yapay Zeka Esnaf Danışmanı vitrin, kâr artırma ve dükkan profili iyileştirme tüyoları sunar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard nav */}
              <div className="pt-3 flex items-center justify-between gap-2.5 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 1}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" /> Geri
                </button>
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
                  >
                    İleri <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="btn-save-shop-profile"
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isSaving ? 'Kaydediliyor...' : 'Dükkanı Başlat'}</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Eski tek sayfa düzenleme modu (profil güncelleme) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Dükkan / İşletme Adı *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-store-name"
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Örn: Bereket Bakkaliyesi, Yıldız Kuaför, Lezzet Çorba..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Hangi Alanda Faaliyet Gösteriyorsunuz? *
                </label>
                <select
                  id="select-business-field"
                  value={businessField}
                  onChange={(e) => setBusinessField(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors cursor-pointer"
                >
                  {BUSINESS_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Dükkanda Kaç Kişi Çalışıyorsunuz?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EMPLOYEE_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        employeeCount === opt.id
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-400'
                          : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="employeeCount"
                        value={opt.id}
                        checked={employeeCount === opt.id}
                        onChange={() => setEmployeeCount(opt.id)}
                        className="accent-amber-600"
                      />
                      <Users className="w-4 h-4 text-stone-400 shrink-0" />
                      <span className="text-xs">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Dükkan Sahibi / Yetkili
                  </label>
                  <input
                    id="input-owner-name"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Örn: Ahmet Usta, Merve Hanım"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    İletişim / WhatsApp Telefonu
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Şehir / Semt
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-city-district"
                      type="text"
                      value={cityDistrict}
                      onChange={(e) => setCityDistrict(e.target.value)}
                      placeholder="Örn: İstanbul / Kadıköy"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Günlük Hedef Ciro (₺)
                  </label>
                  <div className="relative">
                    <Target className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-daily-target"
                      type="number"
                      min={100}
                      step={50}
                      value={dailyTarget}
                      onChange={(e) => setDailyTarget(Number(e.target.value))}
                      placeholder="2500"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Dükkan Sloganı / Vitrin Notu (İsteğe Bağlı)
                </label>
                <input
                  id="input-slogan"
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Örn: Mahallenin Güler Yüzlü Esnafı, Taze ve Kaliteli Lezzet..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                />
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">VIP Esnaf Ayrıcalıkları Aktif</p>
                  <p className="text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                    Dükkan bilgilerinizle 7/24 Yapay Zeka Esnaf Danışmanı vitrin, kâr artırma ve dükkan profili iyileştirme tüyoları sunar.
                  </p>
                </div>
              </div>
              {!isFirstTime && (
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                  <p className="text-xs font-black text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                    <DatabaseBackup className="w-4 h-4 text-emerald-600" /> Defter Yedeği
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    Tüm müşteri, işlem ve stok kayıtlarını tek dosyada indir veya geri yükle.
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <a
                      href="/api/backup"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Yedek İndir
                    </a>
                    {onRestoreBackup && (
                      <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer">
                        <Upload className="w-3.5 h-3.5" /> Yedek Yükle
                        <input
                          type="file"
                          accept="application/json"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files && e.target.files[0];
                            if (f) onRestoreBackup(f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  id="btn-save-shop-profile"
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSaving ? 'Kaydediliyor...' : 'Bilgileri Güncelle'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
