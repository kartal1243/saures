import type { Express, Request, Response } from 'express';
import type { ShopProfile } from '../../shared/types';
import { S, saveState } from '../context';
import { broadcast } from '../realtime';

export function registerProfileRoutes(app: Express): void {
  // 9. Shop Profile Routes (Dükkan Kayıt & Profil Bilgileri)
  app.get('/api/shop-profile', (_req, res) => {
    res.json({ profile: S().shopProfile });
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
      // Sektör, sahip adı, telefon, şehir, çalışan sayısı kilitlidir.
      updatedProfile = {
        ...currentProfile,
        storeName: data.storeName.trim(),
        dailyTarget: Number(data.dailyTarget) || currentProfile.dailyTarget || 2500,
        // Diğer alanlar kilitli ve korunur
      };
    } else {
      // İlk kurulum aşaması: Tüm bilgiler ilk kez belirlenir ve kilitlenir
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
        isVip: data.isVip !== undefined ? Boolean(data.isVip) : true,
      };
    }

    S().shopProfile = updatedProfile;
    S().storeName = updatedProfile.storeName;
    saveState();

    broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: updatedProfile });
    res.json({ success: true, profile: updatedProfile });
  });
}
