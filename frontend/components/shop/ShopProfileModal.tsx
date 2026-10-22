import React, { useState, useEffect } from 'react';
import {
  Store,
  Briefcase,
  User,
  Phone,
  MapPin,
  Target,
  Users,
  Check,
  X,
  ShieldAlert,
  Loader2,
  Quote,
} from 'lucide-react';
import { ShopProfile } from '../../../shared/types.ts';
import { deriveSector } from '../../utils/sector';

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
  { id: '1', label: '1 Kişi (Tek Başımayım)' },
  { id: '2-3', label: '2 - 3 Kişi' },
  { id: '4-5', label: '4 - 5 Kişi' },
  { id: '6+', label: '6+ Kişi' },
];

export const ShopProfileModal: React.FC<ShopProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
  isFirstTime = false,
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

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setError('Lütfen dükkan / işletme adını yazınız.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSaveProfile({
        storeName: storeName.trim(),
        ownerName: ownerName.trim() || 'Esnaf',
        businessField,
        sectorKey: deriveSector(businessField),
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-all flex flex-col max-h-[90vh]">
        {/* Üst Başlık */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-amber-500 via-amber-500 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner shrink-0">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                {isFirstTime ? 'Dükkânınızı Tanımlayın' : 'Dükkân Bilgileri'}
              </h2>
              <p className="text-xs text-amber-100 mt-0.5 font-medium">
                {isFirstTime
                  ? 'Temel bilgilerinizi girin, paneliniz anında dükkanınıza göre uyarlansın'
                  : 'İşletme adı, sektör ve iletişim ayarlarınızı güncelleyin'}
              </p>
            </div>
          </div>

          {!isFirstTime && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer shrink-0"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Alanları */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. KART: DÜKKAN & FAALİYET ALANI */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Store className="w-4 h-4" />
              <span>Dükkân Kimliği</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Dükkân / İşletme Adı *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-store-name"
                  type="text"
                  required
                  autoFocus={isFirstTime}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Örn: Bereket Bakkaliyesi, Yıldız Kuaför..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Faaliyet Alanı (Sektör) *
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="select-business-field"
                  value={businessField}
                  onChange={(e) => setBusinessField(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors cursor-pointer shadow-xs"
                >
                  {BUSINESS_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Panel menüleri ve işlemler seçtiğiniz dükkan türüne göre anında uyarlanır.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Dükkan Sloganı / Fiş Altı Notu (İsteğe Bağlı)
              </label>
              <div className="relative">
                <Quote className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-slogan"
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Örn: Mahallenin Güler Yüzlü Esnafı..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* 2. KART: YETKİLİ & İLETİŞİM */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
              <User className="w-4 h-4 text-stone-500" />
              <span>Yetkili &amp; İletişim</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Dükkan Sahibi / Yetkili
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-owner-name"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Örn: Ahmet Usta"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  WhatsApp / Telefon
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors shadow-xs"
                  />
                </div>
              </div>
            </div>

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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* 3. KART: KADRO & HEDEF */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
              <Target className="w-4 h-4 text-stone-500" />
              <span>Ekip &amp; Hedef</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Dükkanda Kaç Kişi Çalışıyorsunuz?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EMPLOYEE_OPTIONS.map((opt) => {
                  const isSelected = employeeCount === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEmployeeCount(opt.id)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/50'
                          : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-amber-400'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Günlük Ciro Hedefi (₺)
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-black focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors shadow-xs"
                />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Kasa durum çubuğunuz bu hedefe göre canlı yüzdelenir.
              </p>
            </div>
          </div>
        </form>

        {/* Alt Aksiyon Çubuğu */}
        <div className="p-4 sm:p-5 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5 shrink-0">
          {!isFirstTime && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
          )}

          <button
            id="btn-save-shop-profile"
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )}
            <span>
              {isSaving
                ? 'Kaydediliyor...'
                : isFirstTime
                ? 'Dükkânı Başlat'
                : 'Bilgileri Kaydet'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
