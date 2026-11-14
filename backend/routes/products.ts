import type { Express, Request, Response } from 'express';
import type { Product, StockMovement } from '../../shared/types';
import { S, saveState } from '../context';
import { broadcast } from '../realtime';
import { localDay } from '../day';
import { getAccounts } from '../accounts';
import { loadShopState } from '../shopState';

interface BarcodeCatalogEntry {
  name: string;
  category: string;
  unit: string;
  suggestedSalePrice?: number;
}

// Yaygın Türkiye Bakkal & Market EAN-13 Barkod Sözlüğü
const TR_BARCODE_CATALOG: Record<string, BarcodeCatalogEntry> = {
  '5449000000996': { name: 'Coca-Cola 330 ml Kutu', category: 'İçecekler', unit: 'Adet', suggestedSalePrice: 35 },
  '5449000054227': { name: 'Coca-Cola 1 Litre Pet', category: 'İçecekler', unit: 'Adet', suggestedSalePrice: 55 },
  '5449000131805': { name: 'Coca-Cola Zero 330 ml', category: 'İçecekler', unit: 'Adet', suggestedSalePrice: 35 },
  '8690504016212': { name: 'Ülker Çikolatalı Gofret 36 gr', category: 'Atıştırmalık', unit: 'Adet', suggestedSalePrice: 12 },
  '8690504012054': { name: 'Ülker Pötibör Bisküvi 175 gr', category: 'Atıştırmalık', unit: 'Paket', suggestedSalePrice: 25 },
  '8690526014418': { name: 'Eti Cin Çilekli 114 gr', category: 'Atıştırmalık', unit: 'Paket', suggestedSalePrice: 22 },
  '8690526029214': { name: 'Eti Browni Intense 50 gr', category: 'Atıştırmalık', unit: 'Adet', suggestedSalePrice: 18 },
  '8690105000015': { name: 'Çaykur Rize Turist Çayı 1000 gr', category: 'Çay & Kahve', unit: 'Paket', suggestedSalePrice: 215 },
  '8690105000121': { name: 'Çaykur Tiryaki Çayı 1000 gr', category: 'Çay & Kahve', unit: 'Paket', suggestedSalePrice: 225 },
  '8690565000014': { name: 'Sütaş Tam Yağlı Süt 1 L', category: 'Süt & Kahvaltılık', unit: 'Litre', suggestedSalePrice: 42 },
  '8690565001202': { name: 'Sütaş Yayık Ayran 1 L', category: 'İçecekler', unit: 'Litre', suggestedSalePrice: 38 },
  '8690624000012': { name: 'Pınar Süt 1 L', category: 'Süt & Kahvaltılık', unit: 'Litre', suggestedSalePrice: 44 },
  '8690624010103': { name: 'Pınar Labne 180 gr', category: 'Süt & Kahvaltılık', unit: 'Adet', suggestedSalePrice: 52 },
  '8690767210105': { name: 'Erikli Doğal Kaynak Suyu 500 ml', category: 'İçecekler', unit: 'Adet', suggestedSalePrice: 10 },
  '8690767210150': { name: 'Erikli Doğal Kaynak Suyu 1.5 L', category: 'İçecekler', unit: 'Adet', suggestedSalePrice: 18 },
  '8690530001015': { name: 'Hayat Su 500 ml', category: 'İçecekler', unit: 'Adet', suggestedSalePrice: 10 },
  '8690632000127': { name: 'Nescafe 3ü1 Arada Tek İçimlik', category: 'Çay & Kahve', unit: 'Paket', suggestedSalePrice: 10 },
  '8690637000115': { name: 'Fairy Bulaşık Deterjanı 650 ml', category: 'Temizlik', unit: 'Adet', suggestedSalePrice: 75 },
  '8690637800104': { name: 'Domestos Çamaşır Suyu 750 ml', category: 'Temizlik', unit: 'Adet', suggestedSalePrice: 68 },
  '8690506478100': { name: 'Lay\'s Klasik Patates Cipsi Süper Boy', category: 'Atıştırmalık', unit: 'Paket', suggestedSalePrice: 45 },
  '8690506478209': { name: 'Doritos Taco Süper Boy', category: 'Atıştırmalık', unit: 'Paket', suggestedSalePrice: 45 },
  '8690710001019': { name: 'Torku Tam Yağlı Süt 1 L', category: 'Süt & Kahvaltılık', unit: 'Litre', suggestedSalePrice: 39 },
  '8690572000113': { name: 'İçim Kaşar Peyniri 400 gr', category: 'Süt & Kahvaltılık', unit: 'Paket', suggestedSalePrice: 135 },
  '8690500001014': { name: 'Komili Riviera Zeytinyağı 1 L', category: 'Temel Gıda', unit: 'Litre', suggestedSalePrice: 320 },
  '8690685001010': { name: 'Tadım Kavrulmuş Ayçekirdeği 180 gr', category: 'Kuruyemiş', unit: 'Paket', suggestedSalePrice: 48 },
};

export function registerProductRoutes(app: Express): void {
  // 12. Products & Stock Management Endpoints
  app.get('/api/products', (_req, res) => {
    const products = S().products || [];
    const criticalCount = products.filter((p) => p.currentStock <= p.criticalThreshold).length;
    res.json({ products, criticalCount });
  });

  // Barkod Katalog Arama (Mevcut mağaza + TR EAN-13 sözlük + anonim ağ eşleştirmesi)
  app.get('/api/products/barcode-catalog/:barcode', (req: Request, res: Response) => {
    const rawBarcode = String(req.params.barcode || '').trim();
    const digitsOnly = rawBarcode.replace(/\D/g, '');
    const code = digitsOnly || rawBarcode;

    if (!code || code.length < 4) {
      return res.status(400).json({ error: 'Geçerli bir barkod numarası giriniz.' });
    }

    // 1. Önce mevcut işletmenin kendi ürünlerinde ara
    const ownProducts = S().products || [];
    const ownMatch = ownProducts.find((p) => p.barcode && p.barcode.trim() === code);
    if (ownMatch) {
      return res.json({
        found: true,
        source: 'own_store',
        barcode: code,
        item: {
          name: ownMatch.name,
          category: ownMatch.category || 'Genel',
          unit: ownMatch.unit || 'Adet',
          suggestedSalePrice: ownMatch.salePrice ?? ownMatch.sellPrice,
        },
      });
    }

    // 2. Türk Terazi / Manav Barkodu (13 hane, 27 / 28 / 29 öneki)
    if (code.length === 13 && (code.startsWith('27') || code.startsWith('28') || code.startsWith('29'))) {
      const plu = code.slice(2, 7);
      const grams = parseInt(code.slice(7, 12), 10) || 0;
      const scaleMatch = ownProducts.find((p) => p.barcode && p.barcode.startsWith(code.slice(0, 7)));
      return res.json({
        found: true,
        source: 'scale_barcode',
        barcode: code,
        plu,
        weightKg: grams > 0 ? Number((grams / 1000).toFixed(3)) : undefined,
        item: {
          name: scaleMatch?.name || `Tartılı Ürün (PLU ${plu})`,
          category: scaleMatch?.category || 'Manav & Şarküteri',
          unit: 'Kg',
          suggestedSalePrice: scaleMatch?.salePrice ?? scaleMatch?.sellPrice,
        },
      });
    }

    // 3. Yerleşik TR Bakkal / Market EAN-13 Kataloğu
    const trEntry = TR_BARCODE_CATALOG[code];
    if (trEntry) {
      return res.json({
        found: true,
        source: 'tr_catalog',
        barcode: code,
        item: trEntry,
      });
    }

    // 4. Diğer mağazaların ürünlerindeki anonim eşleştirme (yalnızca ürün adı, kategori ve birim döner)
    try {
      const accounts = getAccounts();
      for (const acc of accounts) {
        const st = loadShopState(acc.id);
        const match = (st.products || []).find((p) => p.barcode && p.barcode.trim() === code);
        if (match) {
          return res.json({
            found: true,
            source: 'community_catalog',
            barcode: code,
            item: {
              name: match.name,
              category: match.category || 'Genel',
              unit: match.unit || 'Adet',
              suggestedSalePrice: match.salePrice ?? match.sellPrice,
            },
          });
        }
      }
    } catch {
      // ignore cross-shop scan error
    }

    return res.json({
      found: false,
      source: 'none',
      barcode: code,
      item: null,
    });
  });

  app.post('/api/products', (req: Request, res: Response) => {
    const data = req.body;
    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ error: 'Ürün adı zorunludur.' });
    }

    if (!S().products) S().products = [];

    const now = new Date().toISOString();
    let product: Product;

    if (data.id) {
      // Update existing
      const idx = S().products.findIndex((p) => p.id === data.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Ürün bulunamadı.' });
      }
      product = {
        ...S().products[idx],
        name: data.name.trim(),
        category: data.category || 'Genel',
        currentStock: Number(data.currentStock) >= 0 ? Number(data.currentStock) : S().products[idx].currentStock,
        unit: data.unit || 'Adet',
        criticalThreshold: Number(data.criticalThreshold) >= 0 ? Number(data.criticalThreshold) : S().products[idx].criticalThreshold,
        purchasePrice: data.purchasePrice !== undefined ? Number(data.purchasePrice) : S().products[idx].purchasePrice,
        salePrice: data.salePrice !== undefined ? Number(data.salePrice) : S().products[idx].salePrice,
        barcode: data.barcode !== undefined ? data.barcode.trim() : S().products[idx].barcode,
        updatedAt: now,
      };
      S().products[idx] = product;
    } else {
      // Create new
      product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: data.name.trim(),
        category: data.category || 'Genel',
        currentStock: Math.max(0, Number(data.currentStock) || 0),
        unit: data.unit || 'Adet',
        criticalThreshold: Math.max(1, Number(data.criticalThreshold) || 5),
        purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
        salePrice: data.salePrice ? Number(data.salePrice) : undefined,
        barcode: data.barcode ? data.barcode.trim() : undefined,
        updatedAt: now,
      };
      S().products.unshift(product);
    }

    saveState();
    broadcast({ type: 'PRODUCT_UPDATED', payload: product });
    res.json({ success: true, product });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    if (!S().products) S().products = [];
    S().products = S().products.filter((p) => p.id !== id);
    saveState();
    broadcast({ type: 'PRODUCT_DELETED', payload: { productId: id } });
    res.json({ success: true, productId: id });
  });

  // Stock Movement: Giriş veya Çıkış
  app.post('/api/products/:id/movement', (req: Request, res: Response) => {
    const productId = req.params.id;
    const { type, quantity, reason } = req.body;
    const parsedQty = Math.abs(Number(quantity));

    if (!type || (type !== 'giris' && type !== 'cikis') || isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: 'Geçerli bir hareket türü (giris/cikis) ve adet giriniz.' });
    }

    if (!S().products) S().products = [];
    const product = S().products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı.' });
    }

    const previousStock = product.currentStock;
    let newStock = previousStock;

    if (type === 'giris') {
      newStock = previousStock + parsedQty;
    } else {
      if (previousStock < parsedQty) {
        // Warning or allow partial/zero
        newStock = Math.max(0, previousStock - parsedQty);
      } else {
        newStock = previousStock - parsedQty;
      }
    }

    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();

    const now = new Date();
    const dateStr = `${S().businessDate || localDay()} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

    const movement: StockMovement = {
      id: `sm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId: product.id,
      productName: product.name,
      type,
      quantity: parsedQty,
      previousStock,
      newStock,
      reason: reason || (type === 'giris' ? 'Stok Girişi (Toptancı/İkmal)' : 'Stok Çıkışı (Satış/Fire)'),
      date: dateStr,
    };

    if (!S().stockMovements) S().stockMovements = [];
    S().stockMovements.unshift(movement);

    saveState();

    broadcast({
      type: 'STOCK_MOVEMENT_CREATED',
      payload: { movement, product },
    });

    const isCritical = product.currentStock <= product.criticalThreshold;

    res.json({
      success: true,
      movement,
      product,
      isCritical,
    });
  });

  app.get('/api/products/movements', (_req, res) => {
    res.json({ movements: S().stockMovements || [] });
  });

  // Otomatik EAN-13 Barkod Üretme ve Atama Endpoints
  app.post('/api/products/:id/generate-barcode', (req: Request, res: Response) => {
    const productId = req.params.id;
    if (!S().products) S().products = [];
    const product = S().products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı.' });
    }

    const existingBarcodes = new Set(
      S().products.map((p) => p.barcode).filter(Boolean) as string[]
    );

    const isScaleProduct = product.unit?.toLowerCase() === 'kg' || product.category?.toLowerCase().includes('manav');
    // Manav/Terazi ürünleri için 27 ile başlayan 5 haneli PLU kodu veya genel ürünler için 869 EAN-13
    const newBarcode = isScaleProduct
      ? `27${Math.floor(10000 + Math.random() * 90000)}00000`
      : generateUniqueEan13(existingBarcodes, '869');

    product.barcode = newBarcode;
    product.updatedAt = new Date().toISOString();

    saveState();
    broadcast({ type: 'PRODUCT_UPDATED', payload: product });

    res.json({ success: true, product, barcode: newBarcode });
  });

  app.post('/api/products/auto-assign-barcodes', (_req: Request, res: Response) => {
    if (!S().products) S().products = [];
    const existingBarcodes = new Set(
      S().products.map((p) => p.barcode).filter(Boolean) as string[]
    );

    let updatedCount = 0;
    const updatedProducts: Product[] = [];

    for (const prod of S().products) {
      if (!prod.barcode || !prod.barcode.trim()) {
        const isScaleProduct = prod.unit?.toLowerCase() === 'kg' || prod.category?.toLowerCase().includes('manav');
        const newBarcode = isScaleProduct
          ? `27${Math.floor(10000 + Math.random() * 90000)}00000`
          : generateUniqueEan13(existingBarcodes, '869');

        prod.barcode = newBarcode;
        prod.updatedAt = new Date().toISOString();
        existingBarcodes.add(newBarcode);
        updatedCount++;
        updatedProducts.push(prod);
      }
    }

    if (updatedCount > 0) {
      saveState();
      for (const p of updatedProducts) {
        broadcast({ type: 'PRODUCT_UPDATED', payload: p });
      }
    }

    res.json({
      success: true,
      updatedCount,
      totalProducts: S().products.length,
    });
  });
}

function calculateEan13CheckDigit(twelveDigits: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(twelveDigits[i], 10) || 0;
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

function generateUniqueEan13(existingBarcodes: Set<string>, prefix: string = '869'): string {
  for (let attempt = 0; attempt < 500; attempt++) {
    const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString(); // 9 haneli
    const raw12 = `${prefix}${randomPart}`.slice(0, 12);
    const check = calculateEan13CheckDigit(raw12);
    const code = `${raw12}${check}`;
    if (!existingBarcodes.has(code)) {
      return code;
    }
  }
  return `${prefix}${Date.now().toString().slice(-9)}0`;
}

