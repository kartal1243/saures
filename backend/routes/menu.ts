import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import type { MenuItem } from '../../shared/types';
import { S, saveState, als } from '../context';
import { broadcast, broadcastToAccount } from '../realtime';
import { getAccounts } from '../accounts';
import { loadShopState, persistShopState } from '../shopState';
import { checkAndUpdateVipStatus } from './profile';

const SAMPLE_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm_1',
    name: 'Kelle Paça / Mercimek Çorbası',
    price: 65,
    category: 'Çorbalar',
    description: 'Kıtır ekmek, tereyağı ve sarımsaklı özel sos eşliğinde.',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm_2',
    name: 'Izgara Köfte Porsiyon',
    price: 190,
    category: 'Ana Yemekler',
    description: 'Özel baharatlı kasap köftesi, közlenmiş biber, domates ve pilav ile.',
    imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm_3',
    name: 'Et Döner Dürüm Menü',
    price: 175,
    category: 'Ana Yemekler',
    description: 'Lavaş ekmeğinde ince kesim dana döner, patates kızartması ve içecek ile.',
    imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm_4',
    name: 'Kaşarlı Karışık Tost',
    price: 75,
    category: 'Aperatif & Tost',
    description: 'Bol sucuk ve eriyen kaşar peyniri, domates dilimleri ile.',
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm_5',
    name: 'Fırın Sütlaç',
    price: 75,
    category: 'Tatlılar',
    description: 'Üstü nar gibi kızarmış, taze fındık parçacıklı geleneksel lezzet.',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm_6',
    name: 'Köy Yayık Ayranı',
    price: 30,
    category: 'İçecekler',
    description: 'Geleneksel yayık yoğurdundan bol köpüklü soğuk servis.',
    imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
  {
    id: 'm_7',
    name: 'Közde Türk Kahvesi',
    price: 45,
    category: 'İçecekler',
    description: 'Lokum ve su ikramı ile ağır ateşte pişmiş köpüklü kahve.',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
];

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Herkese Açık QR Menü Rotaları (Guard Öncesi Çağrılır - Şifresiz) */
export function registerPublicMenuRoutes(app: Express): void {
  app.get('/api/public/menu/:identifier', (req: Request, res: Response) => {
    const rawId = req.params.identifier.toLowerCase().trim();
    const accounts = getAccounts();

    // 1. Slug veya Account ID veya Telefon ile dükkan bul
    let targetAcc = accounts.find(
      (a) =>
        a.id.toLowerCase() === rawId ||
        a.phone === rawId ||
        slugify(a.shopName) === rawId
    );

    // Eğer bulunamazsa shopState dosyalarını tara (slug kontrolü)
    let shopState = targetAcc ? loadShopState(targetAcc.id) : null;

    if (!shopState) {
      for (const a of accounts) {
        const st = loadShopState(a.id);
        const shopSlug = st.shopProfile?.slug || slugify(st.shopProfile?.storeName || a.shopName);
        if (shopSlug === rawId) {
          targetAcc = a;
          shopState = st;
          break;
        }
      }
    }

    // Yalnızca rawId 'demo' ise demo hesabına düş; var olmayan diğer sluglar 404 dönmelidir!
    if (!shopState && rawId === 'demo') {
      const fallbackAcc = accounts.find((a) => a.phone === '05550000000');
      if (fallbackAcc) {
        targetAcc = fallbackAcc;
        shopState = loadShopState(fallbackAcc.id);
      }
    }

    if (!shopState) {
      return res.status(404).json({ error: 'İşletme menüsü bulunamadı.' });
    }

    // VIP geçerlilik kontrolü (Süresi biten dükkanların açık kalması engellenir)
    if (shopState.shopProfile) {
      const wasVip = shopState.shopProfile.isVip;
      checkAndUpdateVipStatus(shopState.shopProfile);
      if (targetAcc && wasVip !== shopState.shopProfile.isVip) {
        persistShopState(targetAcc.id, shopState);
      }
    }

    // QR Menü yalnızca VIP üyelere açıktır (demo hariç)
    if (!shopState.shopProfile?.isVip && rawId !== 'demo') {
      return res.status(403).json({
        error: 'Bu işletmenin Dijital QR Menü servisi aktif değildir (VIP işletme paketi gereklidir).',
        code: 'VIP_REQUIRED',
        isVip: false,
      });
    }

    const items =
      Array.isArray(shopState.menuItems) && shopState.menuItems.length > 0
        ? shopState.menuItems
        : SAMPLE_MENU_ITEMS;

    const slug =
      shopState.shopProfile?.slug ||
      slugify(shopState.shopProfile?.storeName || targetAcc?.shopName || 'restoran');

    res.json({
      success: true,
      shopName: shopState.shopProfile?.storeName || targetAcc?.shopName || 'Restoran & Kafe',
      slogan: shopState.shopProfile?.slogan || 'Afiyet Olsun',
      phone: shopState.shopProfile?.phone || targetAcc?.phone || '',
      cityDistrict: shopState.shopProfile?.cityDistrict || '',
      slug,
      menuItems: items,
      tables: (shopState.tables || []).map((t) => ({ id: t.id, name: t.name })),
    });
  });
}

/** Korumalı Menü Rotaları (Guard Sonrası Çağrılır - Dükkan Sahibi Paneli) */
export function registerProtectedMenuRoutes(app: Express): void {
  // Menü Listele
  app.get('/api/menu', (_req: Request, res: Response) => {
    const st = S();
    let items = st.menuItems;
    if (!Array.isArray(items) || items.length === 0) {
      items = [...SAMPLE_MENU_ITEMS];
      st.menuItems = items;
      saveState();
    }

    const slug = st.shopProfile?.slug || slugify(st.storeName || 'restoran');
    res.json({
      success: true,
      menuItems: items,
      slug,
      shopName: st.storeName,
    });
  });

  // Yemek / İçecek Ekle veya Güncelle
  app.post('/api/menu', (req: Request, res: Response) => {
    const { id, name, price, category, description, imageUrl, isAvailable } = req.body;
    if (!name || typeof price !== 'number') {
      return res.status(400).json({ error: 'Yemek adı ve fiyatı zorunludur.' });
    }

    const st = S();
    if (!Array.isArray(st.menuItems)) {
      st.menuItems = [];
    }

    let item: MenuItem;
    if (id) {
      // Güncelle
      const idx = st.menuItems.findIndex((m) => m.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Yemek bulunamadı.' });
      }
      item = {
        ...st.menuItems[idx],
        name: name.trim(),
        price: Number(price),
        category: (category || 'Genel').trim(),
        description: description ? description.trim() : '',
        imageUrl: imageUrl ? imageUrl.trim() : undefined,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      };
      st.menuItems[idx] = item;
    } else {
      // Yeni Ekle
      item = {
        id: 'm_' + crypto.randomUUID().slice(0, 8),
        name: name.trim(),
        price: Number(price),
        category: (category || 'Ana Yemekler').trim(),
        description: description ? description.trim() : '',
        imageUrl: imageUrl ? imageUrl.trim() : undefined,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      };
      st.menuItems.push(item);
    }

    saveState();
    broadcast({ type: 'MENU_UPDATED', payload: st.menuItems });
    res.json({ success: true, item, menuItems: st.menuItems });
  });

  // Yemek Sil
  app.delete('/api/menu/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const st = S();
    if (!Array.isArray(st.menuItems)) {
      return res.status(404).json({ error: 'Menü boş.' });
    }

    st.menuItems = st.menuItems.filter((m) => m.id !== id);
    saveState();
    broadcast({ type: 'MENU_UPDATED', payload: st.menuItems });
    res.json({ success: true, menuItems: st.menuItems });
  });

  // Özel Slug Güncelle (Örn: bereket-pide)
  app.put('/api/menu/slug', (req: Request, res: Response) => {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: 'Slug zorunludur.' });

    const cleanSlug = slugify(slug);
    const ctx = als.getStore();
    const currentId = ctx?.accountId;

    // Slug benzersizlik (uniqueness) doğrulaması — Başka dükkanın slug'ını çalmayı engelle
    const accounts = getAccounts();
    const isTaken = accounts.some((a) => {
      if (a.id === currentId) return false;
      const st = loadShopState(a.id);
      const otherSlug = st.shopProfile?.slug || slugify(st.shopProfile?.storeName || a.shopName);
      return otherSlug === cleanSlug;
    });

    if (isTaken) {
      return res.status(409).json({ error: 'Bu dükkan bağlantı adı (slug) başka bir işletme tarafından kullanılıyor. Lütfen farklı bir isim seçin.' });
    }

    const st = S();
    if (!st.shopProfile) {
      st.shopProfile = {
        storeName: st.storeName,
        ownerName: 'Esnaf',
        businessField: 'Kafe / Restoran',
        employeeCount: '1',
        phone: '',
        cityDistrict: '',
        dailyTarget: 2500,
        isConfigured: true,
        isVip: false, // GÜVENLİK: Asla varsayılan true olamaz!
      };
    }
    st.shopProfile.slug = cleanSlug;
    saveState();
    res.json({ success: true, slug: cleanSlug });
  });

  // Masadan Canlı Garson Çağır & Hesap İste (QR Menü Müşteri Butonları)
  app.post('/api/public/menu/:identifier/table-action', (req: Request, res: Response) => {
    const rawId = (req.params.identifier || '').toLowerCase();
    const accounts = getAccounts();
    let targetAcc = accounts.find(
      (a) =>
        a.id.toLowerCase() === rawId ||
        a.phone === rawId ||
        slugify(a.shopName) === rawId
    );

    if (!targetAcc) {
      for (const a of accounts) {
        const st = loadShopState(a.id);
        const shopSlug = st.shopProfile?.slug || slugify(st.shopProfile?.storeName || a.shopName);
        if (shopSlug === rawId) {
          targetAcc = a;
          break;
        }
      }
    }

    if (!targetAcc && rawId === 'demo') {
      targetAcc = accounts.find((a) => a.phone === '05550000000');
    }

    if (!targetAcc) {
      return res.status(404).json({ error: 'İşletme bulunamadı.' });
    }

    const { tableNo, action } = req.body || {}; // action: 'waiter' | 'bill'
    const st = loadShopState(targetAcc.id);
    const table = (st.tables || []).find((t) => t.id === tableNo || t.name === tableNo);

    if (table) {
      table.activeCall = action === 'bill' ? 'bill' : 'waiter';
      st.lastUpdated = new Date().toISOString();
      persistShopState(targetAcc.id, st);
    }

    const actionText = action === 'bill' ? 'Hesap İstiyor 💳' : 'Garson Çağırıyor 🔔';
    const displayTable = table ? table.name : (tableNo || 'Masa');

    // Restoran ekranına canlı sesli bildirim ve masa kartı yanıp sönme sinyali gönder
    broadcastToAccount(targetAcc.id, {
      type: 'TABLE_CALL_ALERT' as any,
      payload: {
        tableNo: displayTable,
        tableId: table ? table.id : undefined,
        action: actionText,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      },
    });

    res.json({
      success: true,
      message: action === 'bill' ? `${displayTable} için hesap talebi kasaya iletildi.` : `${displayTable} için garson çağrısı personele iletildi.`,
    });
  });
}
