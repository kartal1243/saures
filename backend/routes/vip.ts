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
        { id: 'unlimited_customers', name: 'Sınırsız Müşteri, Cari ve Veresiye Kaydı (0 TL planda 25 ile sınırlı)', active: true },
        { id: 'unlimited_staff', name: 'Sınırsız Personel/Usta & Otomatik Koltuk Prim Dağılımı', active: true },
        { id: 'voice_ai_assistant', name: 'Türkçe Sesli Randevu & Kasa Asistanı (Web Speech AI)', active: true },
        { id: 'ai_tariff_ocr', name: 'Fotoğraftan Fiyat Tarifesi & Menü Okuyucu (AI OCR)', active: true },
        { id: 'smart_groom_lock', name: '90 Dk Damat Tıraşı & Randevu Akıllı Çakışma Kilidi', active: true },
        { id: 'hardware_support', name: 'Termal Fiş (58/80mm), Barkod Okuyucu ve Barkodlu Terazi Entegrasyonu', active: true },
        { id: 'unlimited_analytics', name: 'Sınırsız Geçmiş Kasa, Ciro ve Kâr-Zarar Analitiği (0 TL planda 14 gün)', active: true },
        { id: 'custom_panel_dev', name: 'Dükkanınıza Özel Yazılım Ekibi (İstediğiniz Buton ve Ekranı Kodluyoruz)', active: true },
        { id: 'priority_support', name: 'Öncelikli WhatsApp & Telefon Canlı Mühendis Destek Hattı', active: true },
        { id: 'counter_qr_stand', name: 'Özel Tezgah QR Randevu ve FAST Tahsilat Standı Tasarımı', active: true },
      ],
      pricing: {
        monthly: 500,
        yearly: 4990, // ~2 ay avantajlı
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
