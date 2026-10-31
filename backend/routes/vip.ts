import type { Express, Request, Response } from 'express';
import path from 'path';
import { S, saveState } from '../context';
import { broadcast } from '../realtime';
import { DATA_DIR } from '../config';
import { readJsonFile, writeJsonFile } from '../fsdb';
import { isAdminSession } from './admin';

export interface CustomPanelLead {
  id: string;
  storeName: string;
  ownerName: string;
  phone: string;
  sector: string;
  requestedFeatures: string;
  notes: string;
  createdAt: string;
  status: 'beklemede' | 'arandi' | 'tamamlandi' | 'red';
}

export const CUSTOM_PANEL_LEADS_FILE = path.join(DATA_DIR, 'custom_panel_leads.json');

export function getCustomPanelLeads(): CustomPanelLead[] {
  return readJsonFile<CustomPanelLead[]>(CUSTOM_PANEL_LEADS_FILE, []);
}

export function saveCustomPanelLeads(leads: CustomPanelLead[]): void {
  writeJsonFile(CUSTOM_PANEL_LEADS_FILE, leads);
}

async function dispatchLeadNotification(lead: CustomPanelLead) {
  const text = `🚨 YENİ ÖZEL PANEL TALEBİ 🚨\n\n🏪 Dükkan: ${lead.storeName}\n👤 Esnaf: ${lead.ownerName}\n📞 Tel: ${lead.phone}\n🏢 Sektör: ${lead.sector}\n✨ İstenen Özellikler: ${lead.requestedFeatures}\n📝 Notlar: ${lead.notes}\n📅 Tarih: ${lead.createdAt}`;

  // 1. Telegram bildirimi (TELEGRAM_BOT_TOKEN ve TELEGRAM_CHAT_ID varsa)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    try {
      await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChat, text }),
      });
    } catch (e) {
      console.error('[Notification] Telegram gönderilemedi:', e);
    }
  }

  // 2. Webhook bildirimi
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
    } catch (e) {
      console.error('[Notification] Webhook gönderilemedi:', e);
    }
  }
}

export function registerVipRoutes(app: Express): void {
  // 1. VIP Durumu & Paket Bilgisi Sorgulama
  app.get('/api/vip/status', (_req: Request, res: Response) => {
    const profile = S().shopProfile;
    // Bitiş tarihi kontrolü
    let isVip = Boolean(profile?.isVip);
    if (isVip && profile?.vipUntil) {
      const exp = new Date(profile.vipUntil).getTime();
      if (!isNaN(exp) && exp < Date.now()) {
        isVip = false;
        profile.isVip = false;
        profile.vipPlan = undefined;
        saveState();
      }
    }

    res.json({
      success: true,
      isVip,
      plan: isVip ? (profile?.vipPlan || 'isletmeye_ozel_vip') : 'standart_esnaf',
      vipUntil: profile?.vipUntil,
      features: [
        { id: 'unlimited_customers', name: 'Sınırsız Müşteri, Cari ve Veresiye Kaydı (0 TL planda 25 ile sınırlı)', active: true },
        { id: 'unlimited_staff', name: 'Sınırsız Personel/Usta & Otomatik Koltuk Prim Dağılımı', active: true },
        { id: 'voice_ai_assistant', name: 'Türkçe Sesli Randevu & Kasa Asistanı (Web Speech AI)', active: true },
        { id: 'ai_tariff_ocr', name: 'Fotoğraftan Fiyat Tarifesi & Menü Okuyucu (AI OCR)', active: true },
        { id: 'appointment_calendar', name: 'Online Randevu Takvimi & Müşteri Randevu Linki (0 TL planda yer almaz)', active: true },
        { id: 'hardware_support', name: 'Termal Fiş (58/80mm), Barkod Okuyucu ve Barkodlu Terazi Entegrasyonu', active: true },
        { id: 'unlimited_analytics', name: 'Sınırsız Geçmiş Kasa, Ciro ve Kâr-Zarar Analitiği (0 TL planda 14 gün)', active: true },
        { id: 'custom_panel_dev', name: 'Dükkanınıza Özel Yazılım Ekibi (İstediğiniz Buton ve Ekranı Kodluyoruz)', active: true },
        { id: 'priority_support', name: 'Öncelikli WhatsApp & Telefon Canlı Mühendis Destek Hattı', active: true },
        { id: 'counter_qr_stand', name: 'Özel Tezgah QR Randevu ve FAST Tahsilat Standı Tasarımı', active: true },
      ],
      pricing: {
        cirak: { monthly: 0, yearly: 0 },
        usta: { monthly: 249, yearly: 2490 },
        patron: { monthly: 499, yearly: 4990 },
        currency: 'TRY',
      },
      packages: [
        {
          id: 'cirak',
          name: 'Çırak (Ücretsiz)',
          priceMonthly: 0,
          priceYearly: 0,
          forWho: 'Yeni tanışan esnaf',
          badge: '0 TL / Süresiz',
          features: [
            '25 Müşteri & Veresiye Kaydı',
            '3 Masa / Adisyon Takibi',
            'Ayda 20 Online Randevu Kotası',
            'Dükkânım Yanımda Alt Bandı',
          ],
        },
        {
          id: 'usta',
          name: 'Usta (Tek Koltuk)',
          priceMonthly: 249,
          priceYearly: 2490,
          forWho: 'Tek çalışan mahalle berberi / kuaför / terzi / tamirci',
          badge: 'Popüler',
          features: [
            'Sınırsız Müşteri & Cari Defter',
            'Sınırsız 7/24 Online Randevu',
            'Sınırsız Geçmiş & Kasa Analitiği',
            'Fotoğraftan Fiyat Tarifesi & Menü AI OCR',
            'Tezgâh QR Standı',
          ],
        },
        {
          id: 'patron',
          name: 'Patron VIP',
          priceMonthly: 499,
          priceYearly: 4990,
          forWho: '2+ personelli salon, restoran ve kafeler',
          badge: 'Tam Teşekküllü',
          features: [
            'Çoklu Usta / Personel & Otomatik Prim',
            'QR Menü + Masadan Canlı Garson Çağır & Hesap İste',
            'Aylık 500 Otomatik WhatsApp & SMS Randevu Bildirimi',
            'Marka Bandı Kaldırma (Özel Markalama)',
            'Dükkanınıza Özel Yazılım Ekibi & Özel Panel Talebi',
            'Öncelikli Canlı Telefon & WhatsApp Destek',
          ],
        },
      ],
    });
  });

  // 2. VIP Üyelik Başlatma / Yükseltme (SADECE Admin Veya Doğrulanmış Webhook İle Çağrılabilir!)
  app.post('/api/vip/upgrade', (req: Request, res: Response) => {
    const webhookSecret = (req.headers['x-webhook-secret'] as string) || (req.query.secret as string);
    const hasValidSecret = Boolean(
      webhookSecret &&
      process.env.WEBHOOK_SECRET &&
      webhookSecret === process.env.WEBHOOK_SECRET
    );
    const isAdmin = isAdminSession(req);

    if (!hasValidSecret && !isAdmin) {
      return res.status(403).json({
        error: 'Yetkisiz erişim. VIP aktivasyonu yalnızca resmi Shopier ödeme doğrulaması veya sistem yöneticisi tarafından yapılabilir.',
        code: 'FORBIDDEN',
      });
    }

    const { planPeriod = 'aylik', paymentChannel = 'shopier' } = req.body || {};
    const profile = S().shopProfile;

    if (!profile) {
      return res.status(400).json({ error: 'Dükkan profili bulunamadı.' });
    }

    const isYearly = planPeriod === 'yillik' || planPeriod === 'yearly';
    const days = isYearly ? 365 : 30;
    const until = new Date();
    until.setDate(until.getDate() + days);

    profile.isVip = true;
    profile.vipPlan = isYearly ? 'yearly' : 'monthly';
    profile.vipUntil = until.toISOString();
    profile.vipExpiresAt = until.toISOString();
    saveState();

    broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: profile });

    res.json({
      success: true,
      message: 'Tebrikler! İşletmenize Özel VIP üyeliğiniz başarıyla aktif edildi.',
      profile,
      membership: {
        status: 'active',
        plan: profile.vipPlan,
        period: planPeriod,
        vipUntil: profile.vipUntil,
        activatedAt: new Date().toISOString(),
        channel: paymentChannel,
      },
    });
  });

  // 3. İşletmeye Özel Panel Talep Formu Gönderme (Dosyaya Kaydedilir + Bildirim Gönderilir)
  app.post('/api/vip/request-custom-panel', async (req: Request, res: Response) => {
    const { sector, requestedFeatures, notes, phone } = req.body || {};
    const profile = S().shopProfile;

    if (!requestedFeatures && !notes) {
      return res.status(400).json({ error: 'Lütfen dükkanınız için istediğiniz panel özelliklerini belirtin.' });
    }

    const customRequest: CustomPanelLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      storeName: profile?.storeName || 'Bilinmeyen İşletme',
      ownerName: profile?.ownerName || 'Esnaf',
      phone: phone || profile?.phone || '',
      sector: sector || profile?.businessField || 'Genel Esnaf',
      requestedFeatures: String(requestedFeatures || '').trim(),
      notes: String(notes || '').trim(),
      createdAt: new Date().toISOString(),
      status: 'beklemede',
    };

    // Dosyaya kaydet
    const leads = getCustomPanelLeads();
    leads.unshift(customRequest);
    saveCustomPanelLeads(leads);

    console.log('[VIP Custom Panel Lead Saved]:', customRequest);

    // Telegram / Webhook bildirimi tetikle
    dispatchLeadNotification(customRequest).catch((err) =>
      console.error('[Notification Error]:', err)
    );

    res.json({
      success: true,
      message: 'Talebiniz yazılım ekibimize iletildi. 24 saat içinde dükkanınıza özel panelinizi hazırlamak için sizinle iletişime geçeceğiz.',
      request: customRequest,
    });
  });

  // 4. Fotoğraftan Fiyat Tarifesi & Menü AI Okuyucu (Gemini Vision Multimodal)
  app.post('/api/ai/parse-price-list', async (req: Request, res: Response) => {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'Lütfen bir fotoğraf yükleyiniz.' });
    }

    const st = S();
    const isVip = Boolean(st.shopProfile?.isVip);
    const used = (st.shopProfile as any)?.aiOcrScansUsed || 0;

    // Ücretsiz kotası: Çırak paketi 2 deneme hakkına sahiptir
    if (!isVip && used >= 2) {
      return res.status(403).json({
        error: 'Ücretsiz AI Menü/Tarife okuma deneme kotanız (2 adet) dolmuştur. Sınırsız tarife okuma için Usta veya Patron VIP pakete geçin.',
        code: 'VIP_REQUIRED',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        items: [
          { name: 'Klasik Saç Kesimi', price: 350, duration: 30 },
          { name: 'Sakal Tıraşı & Buhar', price: 200, duration: 20 },
          { name: 'Saç & Sakal Kombin', price: 500, duration: 45 },
          { name: 'Kil Maskesi & Cilt Bakımı', price: 250, duration: 25 },
        ],
        fallback: true,
      });
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const cleanBase64 = String(imageBase64).replace(/^data:image\/[a-z]+;base64,/, '');

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: `Bu görsel bir berber, kuaför, güzellik merkezi veya kafe/restoran fiyat listesi/menü panosudur.
Görseldeki tüm hizmet/ürün adlarını, fiyatlarını ve tahmini sürelerini (kuaför/berber için dakika cinsinden) tespit et.
Yanıtı SADECE aşağıdaki geçerli JSON formatında döndür, markdown veya başka açıklama metni yazma:
[
  { "name": "Saç Kesimi", "price": 350, "duration": 30 },
  { "name": "Sakal Tıraşı", "price": 200, "duration": 20 }
]`
              }
            ],
          },
        ],
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (!st.shopProfile) (st.shopProfile as any) = {};
        (st.shopProfile as any).aiOcrScansUsed = used + 1;
        saveState();
        return res.json({ success: true, items: parsed });
      } else {
        throw new Error('JSON formatı ayrıştırılamadı');
      }
    } catch (err: any) {
      console.error('Gemini Vision OCR hatası:', err?.message || err);
      return res.json({
        success: true,
        items: [
          { name: 'Klasik Saç Kesimi', price: 350, duration: 30 },
          { name: 'Sakal Tasarımı', price: 200, duration: 20 },
          { name: 'Saç & Sakal Bakım', price: 500, duration: 45 },
          { name: 'Cilt Bakım Maskesi', price: 250, duration: 25 },
        ],
        fallback: true,
      });
    }
  });
}
