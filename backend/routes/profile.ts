import type { Express, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import type { ShopProfile } from '../../shared/types';
import { S, saveState, als } from '../context';
import { broadcast } from '../realtime';
import { DEMO_ACCOUNT_ID } from '../demoSeed';
import { isValidTurkishPhone, normalizePhone, getAccounts } from '../accounts';
import { slugify, isReservedSlug, isSlugTaken, loadShopState } from '../shopState';
import { SHOP_LOGOS_DIR } from '../config';

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

// ============================================================================
// GÖRSEL GÜVENLİK KONTROLÜ: Magic Bytes Doğrulaması (SVG ve HTML Asla Geçemez!)
// ============================================================================
export function detectImageMimeAndExt(buffer: Buffer): { mime: string; ext: 'png' | 'jpg' | 'webp' } | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // WEBP: RIFF (bytes 0-3: 52 49 46 46) ... WEBP (bytes 8-11: 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  return null;
}

// ============================================================================
// KAMUSAL MEDYA UCU: Dükkan Profil Fotoğrafı / Logo Sunumu
// robots.txt ve apiGuard dışında /media/shop-logo/:filename olarak çalışır
// ============================================================================
export function serveShopLogo(req: Request, res: Response): void {
  const rawParam = req.params.filename;
  if (!rawParam || typeof rawParam !== 'string') {
    res.status(400).send('Dosya adı geçersiz.');
    return;
  }

  // Path traversal koruması (.. veya slashes engellenir)
  const cleanFilename = path.basename(rawParam).split('?')[0].trim();
  const lastDot = cleanFilename.lastIndexOf('.');
  if (lastDot === -1) {
    res.status(400).send('Geçersiz dosya adı.');
    return;
  }

  const namePart = cleanFilename.substring(0, lastDot);
  const extPart = cleanFilename.substring(lastDot + 1).toLowerCase();

  if (!['png', 'jpg', 'jpeg', 'webp'].includes(extPart)) {
    res.status(400).send('Desteklenmeyen dosya formatı.');
    return;
  }

  // Path traversal ve injection koruması: Sadece alfanümerik, tire ve alt çizgi
  if (!/^[a-zA-Z0-9_-]+$/.test(namePart)) {
    res.status(400).send('Geçersiz dosya adı.');
    return;
  }

  const validExts = extPart === 'jpeg' ? ['jpg', 'jpeg'] : [extPart];

  // 1. Doğrudan dosya adıyla arama (<accountId>.<ext>)
  let targetFilePath: string | null = null;
  for (const ext of validExts) {
    const directPath = path.join(SHOP_LOGOS_DIR, `${namePart}.${ext}`);
    if (fs.existsSync(directPath)) {
      targetFilePath = directPath;
      break;
    }
  }

  // 2. Slug ile arama (<slug>.<ext> veya <accountId>.<ext>)
  if (!targetFilePath) {
    const accounts = getAccounts();
    for (const acc of accounts) {
      const st = loadShopState(acc.id);
      const accSlug = st.shopProfile?.slug || slugify(st.shopProfile?.storeName || acc.shopName);
      if (accSlug === namePart || acc.id === namePart) {
        // Bu hesaba ait mevcut logoyu bul
        for (const candidateExt of ['webp', 'png', 'jpg', 'jpeg']) {
          const accLogoPath = path.join(SHOP_LOGOS_DIR, `${acc.id}.${candidateExt}`);
          if (fs.existsSync(accLogoPath)) {
            targetFilePath = accLogoPath;
            break;
          }
        }
        if (targetFilePath) break;
      }
    }
  }

  if (!targetFilePath || !fs.existsSync(targetFilePath)) {
    res.status(404).send('Logo bulunamadı.');
    return;
  }

  // SHOP_LOGOS_DIR sınırları dışına çıkmayı kesinlikle engelle
  const resolvedTarget = path.resolve(targetFilePath);
  const resolvedDir = path.resolve(SHOP_LOGOS_DIR);
  if (!resolvedTarget.startsWith(resolvedDir)) {
    res.status(403).send('Erişim reddedildi.');
    return;
  }

  // Gerçek dosya formatını ve mime tipini belirle
  const actualExt = path.extname(targetFilePath).replace('.', '').toLowerCase();
  const mimeType = actualExt === 'png' ? 'image/png' : actualExt === 'webp' ? 'image/webp' : 'image/jpeg';

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  res.sendFile(targetFilePath);
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

    let finalSlug = currentProfile?.slug;
    if (data.slug && typeof data.slug === 'string') {
      const cleanSlug = slugify(data.slug);
      if (cleanSlug && cleanSlug !== currentProfile?.slug) {
        if (isReservedSlug(cleanSlug)) {
          return res.status(400).json({ error: 'Bu bağlantı adı sistem tarafından ayrılmıştır. Lütfen işletmenize özel farklı bir isim seçin.' });
        }
        if (isSlugTaken(cleanSlug, ctx?.accountId)) {
          return res.status(409).json({ error: 'Bu bağlantı adı başka bir işletme tarafından kullanılıyor.' });
        }
        finalSlug = cleanSlug;
      }
    }

    const updatedProfile: ShopProfile = {
      storeName: data.storeName.trim(),
      ownerName: (data.ownerName || currentProfile?.ownerName || 'Esnaf').trim(),
      businessField: data.businessField || currentProfile?.businessField || 'Berber / Kuaför',
      sectorKey: data.sectorKey === 'kuafor_berber' ? 'berber_kuafor' : (data.sectorKey || currentProfile?.sectorKey || 'berber_kuafor'),
      employeeCount: data.employeeCount || currentProfile?.employeeCount || '1',
      phone: shopPhone,
      cityDistrict: (data.cityDistrict !== undefined ? data.cityDistrict : (currentProfile?.cityDistrict || '')).trim(),
      dailyTarget: Number(data.dailyTarget) || currentProfile?.dailyTarget || 2500,
      slogan: (data.slogan !== undefined ? data.slogan : (currentProfile?.slogan || '')).trim(),
      logoUrl: data.logoUrl !== undefined ? data.logoUrl : currentProfile?.logoUrl,
      logoUpdatedAt: data.logoUpdatedAt !== undefined ? data.logoUpdatedAt : currentProfile?.logoUpdatedAt,
      slug: finalSlug,
      isConfigured: true,
      isVip: currentProfile?.isVip ?? true,
      vipTier: currentProfile?.vipTier,
      vipUntil: currentProfile?.vipUntil,
      vipExpiresAt: currentProfile?.vipExpiresAt,
      vipPlan: currentProfile?.vipPlan,
      showOnPublicMap: typeof data.showOnPublicMap === 'boolean' ? data.showOnPublicMap : (currentProfile?.showOnPublicMap ?? true),
      coordinates: (data.coordinates && typeof data.coordinates.lat === 'number' && typeof data.coordinates.lng === 'number')
        ? { lat: Number(data.coordinates.lat), lng: Number(data.coordinates.lng) }
        : currentProfile?.coordinates,
      address: typeof data.address === 'string' ? data.address.trim() : currentProfile?.address,
    };

    S().shopProfile = updatedProfile;
    S().storeName = updatedProfile.storeName;
    saveState();

    broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: updatedProfile });
    res.json({ success: true, profile: updatedProfile });
  });

  // ==========================================================================
  // DÜKKAN PROFİL FOTOĞRAFI / LOGO (PP) YÜKLEME
  // ==========================================================================
  app.post('/api/shop-profile/logo', (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (!ctx) return res.status(401).json({ error: 'Oturum gerekli.' });

    if (ctx.accountId === DEMO_ACCOUNT_ID) {
      return res.status(403).json({ error: 'Ortak demo dükkanının logosu değiştirilemez.' });
    }

    const { imageDataUrl } = req.body || {};
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return res.status(400).json({ error: 'Görsel verisi zorunludur.' });
    }

    // Base64 Data URL Ayrıştırma
    const matches = imageDataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches || !matches[2]) {
      return res.status(400).json({ error: 'Geçersiz Data URL formatı.' });
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(matches[2], 'base64');
    } catch {
      return res.status(400).json({ error: 'Base64 çözümlenemedi.' });
    }

    // Maksimum boyut: 2 MB
    if (buffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Görsel boyutu 2 MB üzerinde olamaz. Lütfen görseli küçülterek tekrar deneyin.' });
    }

    // Magic Bytes Doğrulaması (SVG, HTML ve zararlı kodları KESİNLİKLE engeller)
    const detected = detectImageMimeAndExt(buffer);
    if (!detected) {
      return res.status(400).json({
        error: 'Güvenlik ihlali: Yalnızca geçerli PNG, JPEG ve WEBP formatları desteklenmektedir (SVG veya HTML kabul edilmez).'
      });
    }

    // Eski logo dosyalarını temizle
    try {
      if (fs.existsSync(SHOP_LOGOS_DIR)) {
        const files = fs.readdirSync(SHOP_LOGOS_DIR);
        for (const f of files) {
          if (f.startsWith(`${ctx.accountId}.`)) {
            try {
              fs.unlinkSync(path.join(SHOP_LOGOS_DIR, f));
            } catch {}
          }
        }
      }
    } catch {}

    // Yeni dosyayı kaydet (<accountId>.<ext>)
    const newFilename = `${ctx.accountId}.${detected.ext}`;
    const targetFilePath = path.join(SHOP_LOGOS_DIR, newFilename);
    fs.writeFileSync(targetFilePath, buffer);

    const currentProfile = S().shopProfile || ({} as ShopProfile);
    const slugOrId = currentProfile.slug || ctx.accountId;
    const logoUrl = `/media/shop-logo/${slugOrId}.${detected.ext}?v=${Date.now()}`;

    currentProfile.logoUrl = logoUrl;
    currentProfile.logoUpdatedAt = new Date().toISOString();
    S().shopProfile = currentProfile;
    saveState();

    broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: currentProfile });

    res.json({
      success: true,
      logoUrl,
      profile: currentProfile,
      message: 'Dükkan logosu başarıyla yüklendi ve güncellendi.',
    });
  });

  // ==========================================================================
  // DÜKKAN PROFİL FOTOĞRAFI / LOGO (PP) SİLME
  // ==========================================================================
  app.delete('/api/shop-profile/logo', (req: Request, res: Response) => {
    const ctx = als.getStore();
    if (!ctx) return res.status(401).json({ error: 'Oturum gerekli.' });

    if (ctx.accountId === DEMO_ACCOUNT_ID) {
      return res.status(403).json({ error: 'Ortak demo dükkanının logosu silinemez.' });
    }

    try {
      if (fs.existsSync(SHOP_LOGOS_DIR)) {
        const files = fs.readdirSync(SHOP_LOGOS_DIR);
        for (const f of files) {
          if (f.startsWith(`${ctx.accountId}.`)) {
            try {
              fs.unlinkSync(path.join(SHOP_LOGOS_DIR, f));
            } catch {}
          }
        }
      }
    } catch {}

    const currentProfile = S().shopProfile;
    if (currentProfile) {
      currentProfile.logoUrl = undefined;
      currentProfile.logoUpdatedAt = undefined;
      S().shopProfile = currentProfile;
      saveState();
      broadcast({ type: 'SHOP_PROFILE_UPDATED', payload: currentProfile });
    }

    res.json({
      success: true,
      profile: currentProfile,
      message: 'Dükkan logosu başarıyla kaldırıldı.',
    });
  });
}
