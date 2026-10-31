import type { Express, Request, Response } from 'express';
import type { ShopProfile } from '../../shared/types';
import { S, saveState } from '../context';
import { broadcast } from '../realtime';

export function checkAndUpdateVipStatus(profile?: ShopProfile): boolean {
  if (!profile || !profile.isVip) return false;
  if (profile.vipUntil) {
    const expires = new Date(profile.vipUntil).getTime();
    if (!isNaN(expires) && expires < Date.now()) {
      profile.isVip = false;
      profile.vipPlan = undefined;
      return false;
    }
  }
  return true;
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
        // isVip, vipUntil, vipPlan gibi alanlar asla istemciden değiştirilemez
      };
    } else {
      // İlk kurulum aşaması: isVip istemciden ASLA alınmaz, her zaman false başlar
      updatedProfile = {
        storeName: data.storeName.trim(),
        ownerName: (data.ownerName || 'Esnaf').trim(),
        businessField: data.businessField || 'Berber / Kuaför',
        sectorKey: data.sectorKey || 'berber_kuafor',
        employeeCount: data.employeeCount || '1',
        phone: (data.phone || '').trim(),
        cityDistrict: (data.cityDistrict || '').trim(),
        dailyTarget: Number(data.dailyTarget) || 2500,
        slogan: (data.slogan || '').trim(),
        isConfigured: true,
        isVip: false, // İlk kurulumda daima Standart (0 TL) olarak başlar
        vipUntil: undefined,
        vipPlan: undefined,
      };
    }

    S().shopProfile = updatedProfile;
    S().storeName = updatedProfile.storeName;
    saveState();

    broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: updatedProfile });
    res.json({ success: true, profile: updatedProfile });
  });
}
