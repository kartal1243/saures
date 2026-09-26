import type { Express, Request, Response } from 'express';
import type { ShopProfile } from '../../src/types';
import { S, saveState } from '../context';
import { broadcast } from '../realtime';

export function registerProfileRoutes(app: Express): void {
  // 9. Shop Profile Routes (Dükkan Kayıt & Profil Bilgileri)
  app.get('/api/shop-profile', (_req, res) => {
    res.json({ profile: S().shopProfile });
  });

  app.post('/api/shop-profile', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.storeName) {
      return res.status(400).json({ error: 'Dükkan adı zorunludur.' });
    }

    const updatedProfile: ShopProfile = {
      storeName: data.storeName.trim(),
      ownerName: (data.ownerName || 'Esnaf').trim(),
      businessField: data.businessField || 'Bakkal / Market',
      sectorKey: data.sectorKey || S().shopProfile?.sectorKey || 'bakkal_market',
      employeeCount: data.employeeCount || '1',
      phone: (data.phone || '').trim(),
      cityDistrict: (data.cityDistrict || '').trim(),
      dailyTarget: Number(data.dailyTarget) || 2500,
      slogan: (data.slogan || '').trim(),
      isConfigured: true,
      isVip: data.isVip !== undefined ? Boolean(data.isVip) : (S().shopProfile?.isVip ?? true),
    };

    S().shopProfile = updatedProfile;
    S().storeName = updatedProfile.storeName;
    saveState();

    broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: updatedProfile });
    res.json({ success: true, profile: updatedProfile });
  });
}
