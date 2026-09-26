import type { Express, Request, Response } from 'express';
import type { Product, StockMovement } from '../../src/types';
import { S, saveState } from '../context';
import { broadcast } from '../realtime';

export function registerProductRoutes(app: Express): void {
  // 12. Products & Stock Management Endpoints
  app.get('/api/products', (_req, res) => {
    const products = S().products || [];
    const criticalCount = products.filter((p) => p.currentStock <= p.criticalThreshold).length;
    res.json({ products, criticalCount });
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
    const dateStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

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
}
