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
  Lock,
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
  'Kuaför / Berber / Güzellik Salonu',
  'Kafe / Çay Ocağı / Restoran',
  'Bakkal / Market / Büfe',
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
  const isLocked = Boolean(currentProfile?.isConfigured && !isFirstTime);

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
        ownerName: isLocked ? (currentProfile?.ownerName || 'Esnaf') : (ownerName.trim() || 'Esnaf'),
        businessField: isLocked ? (currentProfile?.businessField || businessField) : businessField,
        sectorKey: isLocked ? (currentProfile?.sectorKey || deriveSector(businessField)) : deriveSector(businessField),
        employeeCount: isLocked ? (currentProfile?.employeeCount || employeeCount) : employeeCount,
        phone: isLocked ? (currentProfile?.phone || '') : phone.trim(),
        cityDistrict: isLocked ? (currentProfile?.cityDistrict || '') : cityDistrict.trim(),
        dailyTarget: Number(dailyTarget) || 2500,
        slogan: isLocked ? (currentProfile?.slogan || '') : (slogan.trim() || 'Mahallenin Güvenilir Esnafı'),
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
                  ? 'Temel bilgilerinizi girin, paneliniz anında dükkanınıza göre kilitlenip uyarlansın'
                  : 'Dükkan ismi ve günlük ciro hedefinizi güncelleyebilirsiniz'}
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

          {isLocked && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5 font-medium">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Güvenlik ve Veri Bütünlüğü Kilidi:</strong> İşletme türünüz ve kayıtlı iletişim bilgileriniz kilitlidir. Yalnızca <strong>Dükkan İsmi</strong> ve <strong>Günlük Ciro Hedefi</strong> değiştirilebilir.
              </span>
            </div>
          )}

          {/* 1. KART: DÜKKAN & FAALİYET ALANI */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Store className="w-4 h-4" />
              <span>Dükkân Kimliği</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Dükkân / İşletme Adı *
                </label>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                  Düzenlenebilir
                </span>
              </div>
              <div className="relative">
                <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-store-name"
                  type="text"
                  required
                  autoFocus={isFirstTime}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Örn: Asil Erkek Kuaförü, VIP Berber Salonu..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Faaliyet Alanı (Sektör) *
                </label>
                {isLocked && (
                  <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 bg-stone-200 dark:bg-stone-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Değiştirilemez
                  </span>
                )}
              </div>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="select-business-field"
                  disabled={isLocked}
                  value={businessField}
                  onChange={(e) => setBusinessField(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors shadow-xs ${
                    isLocked
                      ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-90'
                      : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-amber-500'
                  }`}
                >
                  {BUSINESS_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Dükkan Sloganı / Fiş Altı Notu
                </label>
                {isLocked && (
                  <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 bg-stone-200 dark:bg-stone-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Sabit
                  </span>
                )}
              </div>
              <div className="relative">
                <Quote className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-slogan"
                  type="text"
                  disabled={isLocked}
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Örn: Profesyonel Saç & Sakal Bakımı..."
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm shadow-xs ${
                    isLocked
                      ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-800 cursor-not-allowed'
                      : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 2. KART: YETKİLİ & İLETİŞİM */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
                <User className="w-4 h-4 text-stone-500" />
                <span>Yetkili &amp; İletişim</span>
              </div>
              {isLocked && (
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 bg-stone-200 dark:bg-stone-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Sabit Bilgiler
                </span>
              )}
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
                    disabled={isLocked}
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Örn: Ahmet Usta"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm shadow-xs ${
                      isLocked
                        ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-800 cursor-not-allowed'
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500'
                    }`}
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
                    disabled={isLocked}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm shadow-xs ${
                      isLocked
                        ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-800 cursor-not-allowed'
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Şehir / İlçe
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-city-district"
                    type="text"
                    disabled={isLocked}
                    value={cityDistrict}
                    onChange={(e) => setCityDistrict(e.target.value)}
                    placeholder="Örn: İstanbul / Kadıköy"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm shadow-xs ${
                      isLocked
                        ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-800 cursor-not-allowed'
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Çalışan Sayısı
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="select-employee-count"
                    disabled={isLocked}
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors shadow-xs ${
                      isLocked
                        ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-800 cursor-not-allowed'
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-amber-500'
                    }`}
                  >
                    {EMPLOYEE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 3. KART: HEDEF VE CİRO */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                <Target className="w-4 h-4" />
                <span>Günlük Ciro Hedefi</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                Düzenlenebilir
              </span>
            </div>

            <div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">
                  ₺
                </span>
                <input
                  id="input-daily-target"
                  type="number"
                  min="0"
                  step="100"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(Number(e.target.value))}
                  placeholder="2500"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-base font-black focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors shadow-xs"
                />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Kasa özetinde ciro hedefinize ne kadar yaklaştığınızı canlı takip etmenizi sağlar.
              </p>
            </div>
          </div>

          {/* Butonlar */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            {!isFirstTime && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isFirstTime ? 'Kurulumu Tamamla ve Başla' : 'Değişiklikleri Kaydet'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
