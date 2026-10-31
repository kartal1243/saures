import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import { DATA_DIR } from '../config';
import { readJsonFile, writeJsonFile } from '../fsdb';
import { getAccounts } from '../accounts';
import { loadShopState, persistShopState } from '../shopState';
import { broadcast } from '../realtime';

export interface ShopierOrderRecord {
  orderId: string;
  price: number;
  currency: string;
  productId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  matchedShopId?: string;
  matchedShopName?: string;
  plan: 'monthly' | 'yearly';
  vipUntil: string;
  receivedAt: string;
}

const SHOPIER_ORDERS_FILE = path.join(DATA_DIR, 'shopier_orders.json');

// Shopier OSB (Otomatik Sipariş Bildirimi) Bilgileri
const SHOPIER_OSB_USER = process.env.SHOPIER_OSB_USER || '4d714557aa2b56125bf3f641b5831caa';
const SHOPIER_OSB_KEY = process.env.SHOPIER_OSB_KEY || 'efb7d21c5a859bfaeb491225df98eeeb';

function cleanPhone(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10); // Son 10 hane: 5xxxxxxxxx
  }
  return digits;
}

export function registerShopierWebhook(app: Express): void {
  // Shopier OSB test kontrolleri (GET veya HEAD ile URL doğrulama)
  app.get('/api/webhook/shopier', (_req: Request, res: Response) => {
    res.status(200).send('success');
  });

  // Shopier Otomatik Sipariş Bildirimi (POST)
  app.post('/api/webhook/shopier', async (req: Request, res: Response) => {
    const { res: postRes, hash: postHash } = req.body || {};

    console.log('[Shopier OSB Callback Received]:', {
      hasRes: Boolean(postRes),
      hasHash: Boolean(postHash),
      bodyKeys: Object.keys(req.body || {}),
    });

    // Shopier panelindeki "Bildirim Testi" butonu için hızlı yanıt
    if (!postRes && !postHash) {
      return res.status(200).send('success');
    }

    if (!postRes || !postHash) {
      console.warn('[Shopier OSB]: Eksik parametre');
      return res.status(400).send('Eksik parametre');
    }

    try {
      // 1. HMAC-SHA256 İmza Doğrulaması
      const hmac = crypto.createHmac('sha256', SHOPIER_OSB_KEY);
      hmac.update(postRes + SHOPIER_OSB_USER);
      const calculatedHash = hmac.digest('hex');

      let signatureValid = false;
      try {
        const hashBuf = Buffer.from(postHash, 'utf-8');
        const calcBuf = Buffer.from(calculatedHash, 'utf-8');
        if (hashBuf.length === calcBuf.length && crypto.timingSafeEqual(hashBuf, calcBuf)) {
          signatureValid = true;
        }
      } catch (err) {
        console.error('[Shopier OSB]: Hash doğrulama hatası:', err);
      }

      if (!signatureValid) {
        console.warn('[Shopier OSB]: Geçersiz imza! Gönderilen hash eşleşmedi.');
        return res.status(401).send('Geçersiz imza');
      }

      // 2. Base64 JSON Sipariş Detaylarını Çözümle
      const jsonString = Buffer.from(postRes, 'base64').toString('utf8');
      const orderData = JSON.parse(jsonString);

      console.log('[Shopier OSB Verified Order Data]:', orderData);

      const orderId = String(orderData.orderid || orderData.order_id || Date.now());
      const price = Number(orderData.price || orderData.total_order_value || 0);
      const buyerEmail = String(orderData.email || orderData.buyer_email || '').trim().toLowerCase();
      const buyerPhone = String(
        orderData.phone || orderData.buyerphone || orderData.buyer_phone || orderData.tel || ''
      ).trim();
      const buyerName = `${orderData.buyername || ''} ${orderData.buyersurname || ''}`.trim();
      const productId = String(orderData.productid || orderData.product_id || '');

      // 3. Mükerrer Sipariş Kontrolü
      const existingOrders = readJsonFile<ShopierOrderRecord[]>(SHOPIER_ORDERS_FILE, []);
      const alreadyProcessed = existingOrders.some((o) => o.orderId === orderId);
      if (alreadyProcessed) {
        console.log(`[Shopier OSB]: Sipariş ${orderId} daha önce işlenmiş. Tekrar başarı dönülüyor.`);
        return res.status(200).send('success');
      }

      // 4. Dükkan Eşleştirme (Telefon veya E-posta)
      const accounts = getAccounts().filter((a) => (a.role || 'owner') === 'owner');
      const normalizedBuyerPhone = cleanPhone(buyerPhone);

      let matchedAccount = accounts.find((a) => {
        if (normalizedBuyerPhone && cleanPhone(a.phone) === normalizedBuyerPhone) {
          return true;
        }
        if (buyerEmail && a.email && a.email.toLowerCase() === buyerEmail) {
          return true;
        }
        return false;
      });

      // 5. VIP Süresi Belirleme (52387553 veya >= 4000 ₺ ise 1 Yıl, aksi halde 1 Ay)
      const isYearly = price >= 4000 || productId === '52387553';
      const days = isYearly ? 365 : 30;
      const until = new Date();
      until.setDate(until.getDate() + days);
      const vipUntilIso = until.toISOString();
      const vipPlan = isYearly ? 'yearly' : 'monthly';

      if (matchedAccount) {
        // Dükkan bulundu: VIP'yi hemen aktif et!
        const st = loadShopState(matchedAccount.id);
        if (!st.shopProfile) {
          st.shopProfile = {
            storeName: matchedAccount.shopName,
            ownerName: matchedAccount.ownerName,
            phone: matchedAccount.phone,
            isVip: true,
          } as any;
        }
        st.shopProfile.isVip = true;
        st.shopProfile.vipPlan = vipPlan;
        st.shopProfile.vipUntil = vipUntilIso;
        st.shopProfile.vipExpiresAt = vipUntilIso;
        st.lastUpdated = new Date().toISOString();
        persistShopState(matchedAccount.id, st);

        broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: st.shopProfile });
        console.log(`[Shopier OSB]: ${matchedAccount.shopName} (${matchedAccount.phone}) başarıyla ${vipPlan} VIP yapıldı! Bitiş: ${vipUntilIso}`);
      } else {
        console.warn(`[Shopier OSB]: Ödeme yapan ${buyerName} (${buyerPhone} / ${buyerEmail}) için kayıtlı dükkan hesabı bulunamadı. Sipariş kaydedildi.`);
      }

      // 6. Siparişi Dosyaya Kaydet
      const record: ShopierOrderRecord = {
        orderId,
        price,
        currency: String(orderData.currency || 'TRY'),
        productId,
        buyerName,
        buyerEmail,
        buyerPhone,
        matchedShopId: matchedAccount?.id,
        matchedShopName: matchedAccount?.shopName,
        plan: vipPlan,
        vipUntil: vipUntilIso,
        receivedAt: new Date().toISOString(),
      };
      existingOrders.unshift(record);
      writeJsonFile(SHOPIER_ORDERS_FILE, existingOrders);

      // 7. Telegram Bildirimi (Varsa)
      const tgToken = process.env.TELEGRAM_BOT_TOKEN;
      const tgChat = process.env.TELEGRAM_CHAT_ID;
      if (tgToken && tgChat) {
        const text = `💰 YENİ SHOPIER ÖDEMESİ ALINDI! 💰\n\n🆔 Sipariş No: ${orderId}\n💵 Tutar: ${price} ₺ (${vipPlan === 'yearly' ? 'YILLIK' : 'AYLIK'})\n👤 Alıcı: ${buyerName}\n📞 Tel: ${buyerPhone}\n🏪 Eşleşen Dükkan: ${matchedAccount ? `${matchedAccount.shopName} (VIP AKTİF)` : '⚠️ Eşleşmedi'}\n📅 VIP Bitiş: ${vipUntilIso}`;
        fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChat, text }),
        }).catch(() => {});
      }

      // 8. Shopier sisteminin bildirimi onaylaması için ekrana MUTLAKA "success" yazdırılır
      return res.status(200).send('success');
    } catch (error) {
      console.error('[Shopier OSB Error]:', error);
      return res.status(500).send('Sunucu hatası');
    }
  });
}
