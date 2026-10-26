import type { Express, Request, Response } from 'express';
import { S, saveState } from '../context';
import { broadcast } from '../realtime';

export function registerVipRoutes(app: Express): void {
  // 1. VIP Durumu & Paket Bilgisi Sorgulama
  app.get('/api/vip/status', (_req: Request, res: Response) => {
    const profile = S().shopProfile;
    res.json({
      success: true,
      isVip: Boolean(profile?.isVip),
      plan: profile?.isVip ? 'isletmeye_ozel_vip' : 'standart_esnaf',
      features: [
        { id: 'custom_panel', name: 'İşletmenize Özel Birebir Panel Tasarımı', active: true },
        { id: 'custom_fields', name: 'Sektörünüze Özel Form, Fiş ve Alan Ekleme', active: true },
        { id: 'priority_dev', name: 'Öncelikli Yazılım Ekibi & Canlı Destek', active: true },
        { id: 'fast_qr', name: 'Özel FAST / TR-Karekod ile Komisyonsuz Tahsilat', active: true },
        { id: 'cloud_backup', name: 'Kesintisiz Bulut Senkronizasyon & Yedekleme', active: true },
        { id: 'multi_branch', name: 'Çoklu Kasa ve Personel Yetkilendirme', active: true },
      ],
      pricing: {
        monthly: 249,
        yearly: 2490, // 2 ay hediye
        currency: 'TRY',
      },
    });
  });

  // 2. VIP Üyelik Başlatma / Yükseltme
  app.post('/api/vip/upgrade', (req: Request, res: Response) => {
    const { planPeriod = 'aylik', paymentChannel = 'fast_demo' } = req.body || {};
    const profile = S().shopProfile;

    if (!profile) {
      return res.status(400).json({ error: 'Dükkan profili bulunamadı.' });
    }

    profile.isVip = true;
    saveState();

    broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: profile });

    res.json({
      success: true,
      message: 'Tebrikler! İşletmenize Özel VIP üyeliğiniz başarıyla aktif edildi. Mühendis ekibimiz dükkan taleplerinizi öncelikle işleme alacaktır.',
      profile,
      membership: {
        status: 'active',
        plan: 'isletmeye_ozel_vip',
        period: planPeriod,
        activatedAt: new Date().toISOString(),
        channel: paymentChannel,
      },
    });
  });

  // 3. İşletmeye Özel Panel Talep Formu Gönderme (Müşteri ne istiyorsa özel geliştirme talebi)
  app.post('/api/vip/request-custom-panel', (req: Request, res: Response) => {
    const { sector, requestedFeatures, notes, phone } = req.body || {};
    const profile = S().shopProfile;

    if (!requestedFeatures && !notes) {
      return res.status(400).json({ error: 'Lütfen dükkanınız için istediğiniz panel özelliklerini belirtin.' });
    }

    const customRequest = {
      id: `vip-req-${Date.now()}`,
      storeName: profile?.storeName || 'Bilinmeyen İşletme',
      ownerName: profile?.ownerName || 'Esnaf',
      phone: phone || profile?.phone || '',
      sector: sector || profile?.businessField || 'Genel Esnaf',
      requestedFeatures: String(requestedFeatures || ''),
      notes: String(notes || ''),
      createdAt: new Date().toISOString(),
      status: 'alindi',
    };

    console.log('[VIP Custom Panel Request Received]:', customRequest);

    res.json({
      success: true,
      message: 'Talebiniz yazılım ekibimize iletildi. 24 saat içinde dükkanınıza özel panelinizi hazırlamak için sizinle iletişime geçeceğiz.',
      request: customRequest,
    });
  });
}
