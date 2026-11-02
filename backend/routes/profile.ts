import type { Express, Request, Response } from 'express';
import type { ShopProfile } from '../../shared/types';
import { S, saveState, als } from '../context';
import { broadcast } from '../realtime';
import { DEMO_ACCOUNT_ID } from '../demoSeed';
import { isValidTurkishPhone, normalizePhone } from '../accounts';

export type VipTier = 'cirak' | 'usta' | 'patron';

export interface VipTierLimits {
  tier: VipTier;
  maxCustomers: number;
  maxMonthlyOnlineBookings: number;
  maxStaffSeats: number;
  maxTables: number;
  qrMenuEnabled: boolean;
  removeBranding: boolean;
}

export function checkAndUpdateVipStatus(profile?: ShopProfile): boolean {
  if (!profile || !profile.isVip) return false;
  if (profile.vipUntil) {
    const expires = new Date(profile.vipUntil).getTime();
    if (!isNaN(expires) && expires < Date.now()) {
      profile.isVip = false;
      profile.vipPlan = undefined;
      profile.vipTier = 'cirak';
      return false;
    }
  }
  return true;
}

export function getEffectiveVipTier(profile?: ShopProfile): VipTier {
  if (!checkAndUpdateVipStatus(profile) || !profile) {
    return 'cirak';
  }
  if (profile.vipTier === 'usta') {
    return 'usta';
  }
  if (profile.vipTier === 'patron' || (profile.vipPlan as string) === 'patron') {
    return 'patron';
  }
  // Geriye dönük uyumluluk: isVip true olup vipTier alanı henüz yazılmamış mevcut aboneler Patron VIP kabul edilir
  return 'patron';
}

export function getTierLimits(profile?: ShopProfile): VipTierLimits {
  const tier = getEffectiveVipTier(profile);
  if (tier === 'patron') {
    return {
      tier: 'patron',
      maxCustomers: Infinity,
      maxMonthlyOnlineBookings: Infinity,
      maxStaffSeats: Infinity,
      maxTables: Infinity,
      qrMenuEnabled: true,
      removeBranding: true,
    };
  }
  if (tier === 'usta') {
    return {
      tier: 'usta',
      maxCustomers: 100,
      maxMonthlyOnlineBookings: 60,
      maxStaffSeats: 1,
      maxTables: 10,
      qrMenuEnabled: false,
      removeBranding: false,
    };
  }
  return {
    tier: 'cirak',
    maxCustomers: 25,
    maxMonthlyOnlineBookings: 20,
    maxStaffSeats: 1,
    maxTables: 3,
    qrMenuEnabled: false,
    removeBranding: false,
  };
}

export function registerProfileRoutes(app: Express): void {
  // 9. Shop Profile Routes (Dükkan Kayıt & Profil Bilgileri)
  app.get('/api/shop-profile', (_req, res) => {
    const prof = S().shopProfile;
    if (prof) {
      const wasVip = prof.isVip;
      checkAndUpdateVipStatus(prof);
      if (wasVip !== prof.isVip) {
        saveState();
      }
    }
    res.json({ profile: prof });
  });

  app.post('/api/shop-profile', (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (ctx?.accountId === DEMO_ACCOUNT_ID) {
      return res.status(403).json({ error: 'Ortak demo dükkanının adı ve profil bilgileri değiştirilemez.' });
    }

    const data = req.body;
    if (!data.storeName || !data.storeName.trim()) {
      return res.status(400).json({ error: 'Dükkan adı zorunludur.' });
    }

    const currentProfile = S().shopProfile;
    const isAlreadyConfigured = currentProfile && currentProfile.isConfigured;

    let updatedProfile: ShopProfile;

    if (isAlreadyConfigured) {
      // Kural: İlk kurulumdan sonra SADECE dükkan adı ve günlük ciro hedefi değiştirilebilir!
      // Sektör, sahip adı, telefon, şehir, çalışan sayısı, isVip kilitlidir.
      checkAndUpdateVipStatus(currentProfile);
      updatedProfile = {
        ...currentProfile,
        storeName: data.storeName.trim(),
        dailyTarget: Number(data.dailyTarget) || currentProfile.dailyTarget || 2500,
        sectorKey: data.sectorKey === 'kuafor_berber' ? 'berber_kuafor' : (data.sectorKey || currentProfile.sectorKey),
        // isVip, vipUntil, vipPlan gibi alanlar asla istemciden değiştirilemez
      };
    } else {
      // İlk kurulum aşaması: isVip istemciden ASLA alınmaz, ancak 14 günlük deneme süresi varsa korunur
      checkAndUpdateVipStatus(currentProfile);
      let shopPhone = (data.phone || '').trim();
      if (shopPhone) {
        if (!isValidTurkishPhone(shopPhone)) {
          return res.status(400).json({
            error: 'Geçersiz dükkan telefon numarası. Lütfen 05XX XXX XX XX formatında geçerli bir Türkiye GSM numarası giriniz (harf veya sahte numara kabul edilmez).'
          });
        }
        shopPhone = normalizePhone(shopPhone);
      } else if (currentProfile?.phone) {
        shopPhone = currentProfile.phone;
      }

      updatedProfile = {
        storeName: data.storeName.trim(),
        ownerName: (data.ownerName || 'Esnaf').trim(),
        businessField: data.businessField || 'Berber / Kuaför',
        sectorKey: data.sectorKey || 'berber_kuafor',
        employeeCount: data.employeeCount || '1',
        phone: shopPhone,
        cityDistrict: (data.cityDistrict || '').trim(),
        dailyTarget: Number(data.dailyTarget) || 2500,
        slogan: (data.slogan || '').trim(),
        slug: data.slug || currentProfile?.slug,
        isConfigured: true,
        isVip: currentProfile?.isVip ?? false,
        vipTier: currentProfile?.vipTier,
        vipUntil: currentProfile?.vipUntil,
        vipExpiresAt: currentProfile?.vipExpiresAt,
        vipPlan: currentProfile?.vipPlan,
      };
    }

    S().shopProfile = updatedProfile;
    S().storeName = updatedProfile.storeName;
    saveState();

    broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: updatedProfile });
    res.json({ success: true, profile: updatedProfile });
  });
}
