import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  Search,
  Package,
  AlertTriangle,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Printer,
  X,
  Barcode,
  Camera,
  Scale,
  RefreshCw,
  Volume2,
  VolumeX,
  Zap,
  Check,
  Copy,
  FileText,
  Layers,
} from 'lucide-react';
import { Product, Customer } from '../../../shared/types.ts';

interface FastRetailCounterViewProps {
  products: Product[];
  customers: Customer[];
  storeName?: string;
  receiptFooter?: string;
  onQuickPosSale: (
    items: Array<{ productId?: string; name: string; quantity: number; unitPrice: number; total: number; isWeighed?: boolean }>,
    paymentMethod: 'nakit' | 'kart',
    cashReceived?: number
  ) => Promise<void | any>;
  onCreditSaleToCustomer: (
    customerId: string,
    amount: number,
    description: string
  ) => Promise<void>;
}

interface CartItem {
  productId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  currentStock?: number;
  isWeighed?: boolean;
  unit?: string;
}

interface ReceiptData {
  receiptNo: string;
  storeName?: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  date: string;
  customerName?: string;
  cashReceived?: number;
  changeAmount?: number;
  footerMessage?: string;
}

interface DisplayProduct {
  id: string;
  name: string;
  barcode?: string;
  sellingPrice: number;
  currentStock: number;
  unit: string;
  criticalThreshold?: number;
  category?: string;
}

const DEFAULT_QUICK_ITEMS = [
  { name: 'Somun Ekmek 200g', price: 10, unit: 'Adet', category: 'Fırın & Unlu', barcode: '869000100101' },
  { name: '0.5L Doğal Kaynak Suyu', price: 8, unit: 'Şişe', category: 'İçecek', barcode: '869000100102' },
  { name: 'Tam Yağlı Süt 1L', price: 34, unit: 'Kutu', category: 'Süt & Kahvaltılık', barcode: '869000100103' },
  { name: 'Köy Yumurtası (10lu)', price: 45, unit: 'Paket', category: 'Süt & Kahvaltılık', barcode: '869000100104' },
  { name: 'Çaykur Rize Çay 1kg', price: 175, unit: 'Paket', category: 'Gıda', barcode: '869000100105' },
  { name: 'Gazoz 250ml', price: 18, unit: 'Şişe', category: 'İçecek', barcode: '869000100106' },
  { name: 'Toz Şeker 1kg', price: 38, unit: 'Paket', category: 'Gıda', barcode: '869000100107' },
  { name: 'Salkım Domates (Yerli)', price: 40, unit: 'Kg', category: 'Manav & Şarküteri', barcode: '270010100000' },
  { name: 'Çengelköy Salatalık', price: 35, unit: 'Kg', category: 'Manav & Şarküteri', barcode: '270010200000' },
  { name: 'Taze Kaşar Peyniri', price: 280, unit: 'Kg', category: 'Manav & Şarküteri', barcode: '280020100000' },
];

// POS Sesi (Web Audio API)
function playPosAudio(type: 'scan' | 'success' | 'alert' = 'scan', enabled: boolean = true) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'scan') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    }
  } catch (_e) {
    // Ses desteği yoksa sessizce geç
  }
}

export const FastRetailCounterView: React.FC<FastRetailCounterViewProps> = ({
  products,
  customers,
  storeName,
  receiptFooter,
  onQuickPosSale,
  onCreditSaleToCustomer,
}) => {
  // Arama & Barkod girişi
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'scale' | 'quick'>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isVeresiyeModalOpen, setIsVeresiyeModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaleMessage, setLastSaleMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoFocusLock, setAutoFocusLock] = useState(true);

  // Termal Fiş
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptPaperWidth, setReceiptPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Nakit / Para Üstü Hesaplayıcı
  const [cashTendered, setCashTendered] = useState<number | ''>('');

  // Terazi Tartı Modalı / Seçilen Ürün
  const [weighedModalProduct, setWeighedModalProduct] = useState<any | null>(null);
  const [manualWeightKg, setManualWeightKg] = useState<string>('1.000');

  // Kamera ile Barkod Okuma Modalı
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraAnimationRef = useRef<number | null>(null);

  // USB Barkod Okuyucu Input Ref
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Odaklanma kilidi: Ekrandaki tıklamalardan sonra otomatik barkod kutusuna dön
  const focusBarcodeInput = useCallback(() => {
    if (autoFocusLock && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [autoFocusLock]);

  useEffect(() => {
    focusBarcodeInput();
  }, [focusBarcodeInput]);

  // Ürün listesini zenginleştir
  const displayProducts = useMemo<DisplayProduct[]>(() => {
    if (!products || products.length === 0) {
      return DEFAULT_QUICK_ITEMS.map((item, idx) => ({
        id: `mock_${idx}`,
        name: item.name,
        barcode: item.barcode,
        sellingPrice: item.price,
        currentStock: 50,
        unit: item.unit,
        criticalThreshold: 10,
        category: item.category,
      }));
    }
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      sellingPrice: p.salePrice ?? (p as any).sellingPrice ?? 0,
      currentStock: p.currentStock ?? (p as any).stock ?? 0,
      unit: p.unit || 'Adet',
      criticalThreshold: p.criticalThreshold ?? 5,
      category: p.category,
    }));
  }, [products]);

  // Filtrelenmiş liste
  const filteredProducts = useMemo(() => {
    let list = displayProducts;

    if (activeTab === 'scale') {
      list = list.filter(
        (p) =>
          p.unit?.toLowerCase() === 'kg' ||
          p.category?.toLowerCase().includes('manav') ||
          p.category?.toLowerCase().includes('şarküteri') ||
          p.category?.toLowerCase().includes('kasap') ||
          p.barcode?.startsWith('27') ||
          p.barcode?.startsWith('28')
      );
    } else if (activeTab === 'quick') {
      list = list.slice(0, 12);
    }

    if (!barcodeInput.trim()) return list;

    const q = barcodeInput.toLowerCase().trim();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (Boolean(p.barcode) && p.barcode?.toLowerCase().includes(q)) ||
        (Boolean((p as any).category) && (p as any).category.toLowerCase().includes(q))
    );
  }, [displayProducts, activeTab, barcodeInput]);

  // Sepet Toplamı
  const cartTotal = useMemo(() => {
    return Number(
      cart
        .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        .toFixed(2)
    );
  }, [cart]);

  // Para Üstü
  const changeDue = useMemo(() => {
    if (typeof cashTendered !== 'number' || cashTendered <= 0) return 0;
    return Number(Math.max(0, cashTendered - cartTotal).toFixed(2));
  }, [cashTendered, cartTotal]);

  // Sepete Ekleme Fonksiyonu
  const addToCart = useCallback(
    (product: {
      id?: string;
      name: string;
      sellingPrice: number;
      currentStock?: number;
      unit?: string;
      isWeighed?: boolean;
    }, quantity: number = 1) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.name === product.name);
        if (existing) {
          const newQty = Number((existing.quantity + quantity).toFixed(3));
          return prev.map((item) =>
            item.name === product.name ? { ...item, quantity: newQty } : item
          );
        }
        return [
          ...prev,
          {
            productId: product.id?.startsWith('mock_') ? undefined : product.id,
            name: product.name,
            unitPrice: product.sellingPrice,
            quantity: Number(quantity.toFixed(3)),
            currentStock: product.currentStock,
            isWeighed: Boolean(product.isWeighed || product.unit?.toLowerCase() === 'kg'),
            unit: product.unit || 'Adet',
          },
        ];
      });

      playPosAudio('scan', soundEnabled);
      setLastSaleMessage(`Sepete eklendi: ${product.name} (${quantity} ${product.unit || 'Adet'})`);
      setTimeout(() => setLastSaleMessage(null), 3500);

      if (autoFocusLock) {
        setTimeout(focusBarcodeInput, 50);
      }
    },
    [soundEnabled, autoFocusLock, focusBarcodeInput]
  );

  // Miktar güncelleme
  const updateQuantity = (name: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.name === name) {
            const step = item.isWeighed ? (delta > 0 ? 0.25 : -0.25) : delta;
            const newQty = Number((item.quantity + step).toFixed(3));
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Doğrudan gramaj / miktar belirleme (250g, 500g, 1kg, 1.5kg veya ondalıklı değerler)
  const setItemQuantity = (name: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.name === name) {
            const validQty = Math.max(0.001, Number(qty.toFixed(3)));
            return { ...item, quantity: validQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // =========================================================================
  // TÜRKİYE STANDARDI EAN-13 TERAZİ BARKODU ÇÖZÜCÜ (27, 28, 29)
  // 27 PPPPP GGGGG C -> 27 + 5 hane PLU + 5 hane gramaj + 1 hane kontrol
  // 28 PPPPP GGGGG C -> 28 + 5 hane PLU + 5 hane gramaj + 1 hane kontrol
  // 29 PPPPP FFFFF C -> 29 + 5 hane PLU + 5 hane kuruş fiyat + 1 hane kontrol
  // =========================================================================
  const parseTurkishScaleBarcode = useCallback(
    (code: string) => {
      const clean = code.trim();
      if (clean.length !== 13) return null;

      const prefix = clean.slice(0, 2);
      if (prefix !== '27' && prefix !== '28' && prefix !== '29') return null;

      const pluCode = clean.slice(2, 7); // 5 haneli ürün PLU kodu
      const valueInt = parseInt(clean.slice(7, 12), 10);
      if (isNaN(valueInt) || valueInt <= 0) return null;

      // Ürünü PLU veya barkod ile bul
      const matched = displayProducts.find((p) => {
        const b = String(p.barcode || '');
        return (
          b === pluCode ||
          b.endsWith(pluCode) ||
          b.includes(pluCode) ||
          String(p.id).includes(pluCode)
        );
      });

      if (prefix === '27' || prefix === '28') {
        // Gramajlı Tartı Barkodu: Gramı kg'a çevir (örn: 01500 = 1.500 kg)
        const weightKg = Number((valueInt / 1000).toFixed(3));
        const unitPrice = matched ? matched.sellingPrice : 50; // Varsayılan kg fiyatı
        const productName = matched ? matched.name : `Tartılı Reyon Ürünü (PLU: ${pluCode})`;

        return {
          type: 'weight' as const,
          product: matched,
          name: `${productName} (${weightKg} kg)`,
          quantity: weightKg,
          unitPrice,
          total: Number((weightKg * unitPrice).toFixed(2)),
          pluCode,
          isWeighed: true,
        };
      } else {
        // 29: Kuruş Fiyatlı Tartı Barkodu (örn: 04550 = 45.50 ₺)
        const price = Number((valueInt / 100).toFixed(2));
        const productName = matched ? matched.name : `Tartılı Ürün (PLU: ${pluCode})`;

        return {
          type: 'price' as const,
          product: matched,
          name: productName,
          quantity: 1,
          unitPrice: price,
          total: price,
          pluCode,
          isWeighed: true,
        };
      }
    },
    [displayProducts]
  );

  // Barkod Girişi İşleme (USB Barkod Tabancası Enter gönderir)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    // 1. Terazi Barkodu Çözümleme
    const scaleItem = parseTurkishScaleBarcode(raw);
    if (scaleItem) {
      setCart((prev) => {
        const existing = prev.find((item) => item.name === scaleItem.name);
        if (existing) {
          return prev.map((item) =>
            item.name === scaleItem.name
              ? { ...item, quantity: Number((item.quantity + scaleItem.quantity).toFixed(3)) }
              : item
          );
        }
        return [
          ...prev,
          {
            productId: scaleItem.product?.id?.startsWith('mock_') ? undefined : scaleItem.product?.id,
            name: scaleItem.name,
            unitPrice: scaleItem.unitPrice,
            quantity: scaleItem.quantity,
            currentStock: scaleItem.product?.currentStock,
            isWeighed: true,
            unit: 'Kg',
          },
        ];
      });

      playPosAudio('scan', soundEnabled);
      setBarcodeInput('');
      setLastSaleMessage(`Terazi barkodu okundu: ${scaleItem.name} (${scaleItem.quantity} kg / ${scaleItem.total} ₺)`);
      setTimeout(() => setLastSaleMessage(null), 3500);
      focusBarcodeInput();
      return;
    }

    // 2. Normal Barkod veya İsim Tam Eşleşmesi
    const lower = raw.toLowerCase();
    const exactMatch = displayProducts.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === lower) ||
        p.name.toLowerCase() === lower
    );

    if (exactMatch) {
      if (exactMatch.unit?.toLowerCase() === 'kg') {
        // Tartılı ürün ise gramaj modalını aç
        setWeighedModalProduct(exactMatch);
        setManualWeightKg('1.000');
        setBarcodeInput('');
      } else {
        addToCart(exactMatch, 1);
        setBarcodeInput('');
      }
      return;
    }

    // 3. Eşleşme Yoksa Arama Yapılmış Gibi Bırak
    playPosAudio('alert', soundEnabled);
    setLastSaleMessage(`Barkod veya ürün '${raw}' eşleşmedi. Katalog filtrelendi.`);
    setTimeout(() => setLastSaleMessage(null), 3000);
  };

  // Otomatik EAN-13 Barkod Ata
  const handleAutoAssignBarcodes = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/products/auto-assign-barcodes', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLastSaleMessage(`${data.updatedCount} adet barkodsuz ürüne otomatik EAN-13 barkodu atandı!`);
        setTimeout(() => setLastSaleMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Tek Ürüne Barkod Üret
  const handleGenerateSingleBarcode = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/products/${productId}/generate-barcode`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLastSaleMessage(`Ürüne yeni barkod atandı: ${data.barcode}`);
        setTimeout(() => setLastSaleMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manuel Tartı Girişini Sepete Ekle
  const handleAddWeighedToCart = () => {
    if (!weighedModalProduct) return;
    const kg = parseFloat(manualWeightKg);
    if (isNaN(kg) || kg <= 0) return;

    addToCart(
      {
        id: weighedModalProduct.id,
        name: `${weighedModalProduct.name} (${kg} kg)`,
        sellingPrice: weighedModalProduct.sellingPrice,
        currentStock: weighedModalProduct.currentStock,
        unit: 'Kg',
        isWeighed: true,
      },
      kg
    );

    setWeighedModalProduct(null);
    setManualWeightKg('1.000');
  };

  // =========================================================================
  // KAMERA İLE BARKOD OKUYUCU
  // =========================================================================
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraScannerOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // BarcodeDetector API desteği varsa gerçek zamanlı tara
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'qr_code', 'upc_a'],
        });

        const scanLoop = async () => {
          if (!videoRef.current || !cameraStreamRef.current) return;
          try {
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const detectedCode = barcodes[0].rawValue;
                handleScannedBarcodeFromCamera(detectedCode);
                return;
              }
            }
          } catch (_e) {
            // Frame detect hatası
          }
          cameraAnimationRef.current = requestAnimationFrame(scanLoop);
        };

        cameraAnimationRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      console.error('Kamera erişim hatası:', err);
      setCameraError('Kamera açılamadı veya izin verilmedi. Tarayıcı izinlerini kontrol edin.');
    }
  };

  const stopCamera = () => {
    if (cameraAnimationRef.current) {
      cancelAnimationFrame(cameraAnimationRef.current);
      cameraAnimationRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraScannerOpen(false);
    focusBarcodeInput();
  };

  const handleScannedBarcodeFromCamera = (code: string) => {
    stopCamera();
    setBarcodeInput(code);

    // Otomatik sepete at
    const scaleItem = parseTurkishScaleBarcode(code);
    if (scaleItem) {
      setCart((prev) => [
        ...prev,
        {
          productId: scaleItem.product?.id,
          name: scaleItem.name,
          unitPrice: scaleItem.unitPrice,
          quantity: scaleItem.quantity,
          isWeighed: true,
          unit: 'Kg',
        },
      ]);
      playPosAudio('scan', soundEnabled);
      setLastSaleMessage(`Kamera: Terazi barkodu eklendi (${scaleItem.name})`);
      return;
    }

    const exact = displayProducts.find((p) => p.barcode === code);
    if (exact) {
      addToCart(exact, 1);
    } else {
      setLastSaleMessage(`Kamera ile okundu: ${code} (Ürün bulunamadı)`);
    }
  };

  // Satışı Tamamla (Nakit / POS)
  const handleCompleteSale = async (paymentMethod: 'nakit' | 'kart') => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    const saleCart = [...cart];
    const total = cartTotal;
    const tendered = typeof cashTendered === 'number' && cashTendered >= total ? cashTendered : total;
    const change = Number(Math.max(0, tendered - total).toFixed(2));

    try {
      const itemsPayload = saleCart.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: Number((item.quantity * item.unitPrice).toFixed(2)),
        isWeighed: item.isWeighed,
      }));

      await onQuickPosSale(itemsPayload, paymentMethod, tendered);

      const newReceipt: ReceiptData = {
        receiptNo: `FIS-${Date.now().toString().slice(-6)}`,
        storeName: storeName || 'Dükkânım Yanımda Market',
        items: saleCart,
        total,
        paymentMethod: paymentMethod === 'nakit' ? 'Nakit Ödeme' : 'Kredi Kartı / POS',
        date: new Date().toLocaleString('tr-TR'),
        cashReceived: tendered,
        changeAmount: change,
        footerMessage: receiptFooter || 'Mali değeri yoktur — Bilgi fişidir.',
      };

      setReceiptData(newReceipt);
      playPosAudio('success', soundEnabled);
      setLastSaleMessage(
        `${total} ₺ ${paymentMethod === 'nakit' ? 'Nakit' : 'POS'} satışı tamamlandı!` +
          (change > 0 ? ` Para Üstü: ${change} ₺` : '')
      );

      setCart([]);
      setCashTendered('');
      setTimeout(() => setLastSaleMessage(null), 6000);
      focusBarcodeInput();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Veresiye Defterine Borç Yaz
  const handleVeresiyeSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || cart.length === 0) return;
    setIsProcessing(true);
    const saleCart = [...cart];
    const total = cartTotal;

    try {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      const desc = `Veresiye Market Satışı: ${saleCart
        .map((i) => `${i.quantity}x ${i.name}`)
        .join(', ')}`;

      await onCreditSaleToCustomer(selectedCustomerId, total, desc);

      const newReceipt: ReceiptData = {
        receiptNo: `VER-${Date.now().toString().slice(-6)}`,
        storeName: storeName || 'Dükkânım Yanımda Market',
        items: saleCart,
        total,
        paymentMethod: 'Veresiye Borç Kaydı',
        customerName: customer?.name,
        date: new Date().toLocaleString('tr-TR'),
        footerMessage: receiptFooter || 'Veresiye Defterine Borç Olarak İşlenmiştir.',
      };

      setReceiptData(newReceipt);
      playPosAudio('success', soundEnabled);
      setIsVeresiyeModalOpen(false);
      setLastSaleMessage(`${total} ₺ borç ${customer?.name || 'Müşteri'} hesabına yazıldı!`);
      setCart([]);
      setCashTendered('');
      setTimeout(() => setLastSaleMessage(null), 6000);
      focusBarcodeInput();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Yazıcı Test Fişi Oluştur ve Göster
  const handlePrintTestReceipt = () => {
    const testReceipt: ReceiptData = {
      receiptNo: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      storeName: storeName ? storeName.toUpperCase() : 'DÜKKANIM YANIMDA MARKET',
      items: [
        { name: 'Somun Ekmek 200g', quantity: 2, unitPrice: 10, currentStock: 20 },
        { name: 'Çaykur Rize Çay 1kg', quantity: 1, unitPrice: 175, currentStock: 15 },
        { name: 'Salkım Domates (Yerli)', quantity: 1.25, unitPrice: 40, isWeighed: true, unit: 'Kg' },
      ],
      total: 245.0,
      paymentMethod: 'Yazıcı Test Baskısı',
      date: new Date().toLocaleString('tr-TR'),
      cashReceived: 250.0,
      changeAmount: 5.0,
      footerMessage: receiptFooter || '✦ TERMAL YAZICI BAŞARIYLA BAĞLANDI VE ÇALIŞIYOR ✦',
    };
    setReceiptData(testReceipt);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Yazıcı CSS Tanımı */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-printable, #thermal-receipt-printable * {
            visibility: visible !important;
          }
          #thermal-receipt-printable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${receiptPaperWidth === '58mm' ? '58mm' : '80mm'} !important;
            margin: 0 !important;
            padding: 8px !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>

      {/* Üst Bar: Başlık, Durum, Test Fişi ve Otomatik Barkod Butonları */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
              Bakkal & Market Hızlı Kasa / Tezgâh
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                POS Aktif
              </span>
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            USB Barkod Okuyucu Tabanca, EAN-13 Terazi Çözücü, 58mm/80mm Termal Fiş ve Tek Tıkla Veresiye Defteri
          </p>
        </div>

        {/* Eylem Butonları */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Ses Aç/Kapat */}
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? 'POS Sesini Kapat' : 'POS Sesini Aç'}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 cursor-pointer text-xs font-bold flex items-center gap-1"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          </button>

          {/* Test Fişi Bas */}
          <button
            type="button"
            onClick={handlePrintTestReceipt}
            className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="Termal yazıcınızı hemen test etmek için örnek fiş basın"
          >
            <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Test Fişi Bas</span>
          </button>

          {/* Son Satış Fişi */}
          {receiptData && (
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black flex items-center gap-1.5 shadow-xs hover:bg-stone-800 cursor-pointer"
              title="Son yapılan satışın 58mm/80mm termal fişini yazdır"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Son Satış Fişi</span>
            </button>
          )}

          {/* Otomatik Barkod Ata */}
          <button
            type="button"
            onClick={handleAutoAssignBarcodes}
            disabled={isProcessing}
            className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="Barkodu olmayan tüm ürünlere geçerli EAN-13 barkodu ata"
          >
            <Zap className="w-4 h-4 text-indigo-500" />
            <span>Otomatik Barkod Ata</span>
          </button>
        </div>
      </div>

      {/* Başarı Bildirimi */}
      {lastSaleMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{lastSaleMessage}</span>
          </div>
          {receiptData && (
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="ml-3 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Fiş Bas</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARKOD TARAMA BAR (USB TABANCA + KAMERA + TERAZİ DESTEĞİ) */}
      {/* ========================================================================= */}
      <div className="bg-stone-900 text-white p-3.5 rounded-2xl shadow-md border border-stone-800">
        <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* USB Tabanca Durum Rozeti */}
          <div className="flex items-center gap-2 shrink-0 px-2.5 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[11px] text-emerald-400">USB Okuyucu Hazır</span>
          </div>

          {/* Barkod Giriş Kutusu */}
          <div className="relative flex-1">
            <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              autoFocus
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Barkod okutun veya yazın (USB Barkod Tabancası doğrudan okur ve Enter basar)..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl text-sm font-mono bg-stone-800/90 text-white placeholder-stone-400 border border-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Ekle
            </button>
          </div>

          {/* Kamera ile Tara Butonu */}
          <button
            type="button"
            onClick={startCamera}
            className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
            title="Telefon veya bilgisayar kamerası ile barkod okutun"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Kamera ile Barkod Oku</span>
          </button>

          {/* Sürekli Odak Kilidi */}
          <button
            type="button"
            onClick={() => setAutoFocusLock((v) => !v)}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer shrink-0 ${
              autoFocusLock
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
            title="Sürekli odak açıkken her tıklamadan sonra imleç otomatik barkod kutusuna döner."
          >
            {autoFocusLock ? 'Tabanca Modu: Açık' : 'Tabanca Modu: Kapalı'}
          </button>
        </form>

        {/* Hızlı Terazi & EAN-13 Barkod Simülatör Tuşları */}
        <div className="mt-2.5 pt-2 border-t border-stone-800/80 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
          <span className="font-semibold text-stone-300 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            EAN-13 Terazi Desteği:
          </span>
          <button
            type="button"
            onClick={() => {
              setBarcodeInput('2700101015004');
              setTimeout(() => barcodeInputRef.current?.focus(), 50);
            }}
            className="px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-700 text-amber-300 font-mono text-[10px] cursor-pointer"
            title="1.500 kg Yerli Domates (27 Prefix Gramajlı)"
          >
            2700101015004 (1.5kg Domates)
          </button>
          <button
            type="button"
            onClick={() => {
              setBarcodeInput('2800201007502');
              setTimeout(() => barcodeInputRef.current?.focus(), 50);
            }}
            className="px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-700 text-amber-300 font-mono text-[10px] cursor-pointer"
            title="0.750 kg Kaşar Peyniri (28 Prefix Gramajlı)"
          >
            2800201007502 (750g Peynir)
          </button>
          <button
            type="button"
            onClick={() => {
              setBarcodeInput('2900101045508');
              setTimeout(() => barcodeInputRef.current?.focus(), 50);
            }}
            className="px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-700 text-amber-300 font-mono text-[10px] cursor-pointer"
            title="45.50 ₺ Kuruş Fiyatlı Tartı Barkodu (29 Prefix)"
          >
            2900101045508 (45.50 ₺ Kuruşlu)
          </button>
          <span className="text-[10px] text-stone-500 ml-auto hidden md:inline">
            27/28: Gramaj (kg), 29: Kuruş fiyatlı barkod
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ANA IZGARA: SOL KATALOG & ÜRÜNLER / SAĞ AKTİF KASA SEPETİ */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SOL 2 KOLON: ÜRÜN REYONU, SEKMELER VE KARTLAR */}
        <div className="lg:col-span-2 space-y-3">
          {/* Sekmeler: Tümü / Terazi Tartılı / Sık Satılanlar */}
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'all'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Tüm Reyon Ürünleri ({displayProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scale')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'scale'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Terazi / Tartılı Ürünler (Kg)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quick')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'quick'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hızlı / Sık Satılanlar</span>
            </button>
          </div>

          {/* Ürün Kartları Izgarası */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => {
              const isWeighed =
                prod.unit?.toLowerCase() === 'kg' ||
                prod.category?.toLowerCase().includes('manav') ||
                prod.category?.toLowerCase().includes('şarküteri');
              const isCritical = (prod.currentStock || 0) <= (prod.criticalThreshold || 5);

              return (
                <div
                  key={prod.id}
                  onClick={() => {
                    if (isWeighed) {
                      setWeighedModalProduct(prod);
                      setManualWeightKg('1.000');
                    } else {
                      addToCart(prod, 1);
                    }
                  }}
                  className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500 dark:hover:border-emerald-600 transition-all text-left group cursor-pointer shadow-xs active:scale-[0.98] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                      <span className="font-semibold flex items-center gap-1">
                        {isWeighed ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-0.5">
                            <Scale className="w-3 h-3" />
                            Kg / Tartı
                          </span>
                        ) : (
                          prod.unit || 'Adet'
                        )}
                      </span>
                      {isCritical && (
                        <span className="flex items-center gap-0.5 text-rose-600 font-bold" title="Kritik Stok!">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{prod.currentStock}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-stone-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {prod.name}
                    </h4>

                    {/* Barkod Bilgisi / Barkod Üretme Butonu */}
                    <div className="mt-1 flex items-center justify-between">
                      {prod.barcode ? (
                        <span className="font-mono text-[10px] text-stone-400 truncate max-w-[110px]" title={prod.barcode}>
                          {prod.barcode}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleGenerateSingleBarcode(prod.id, e)}
                          className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300 text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                          title="Bu ürüne tek tıkla EAN-13 barkod ata"
                        >
                          <Barcode className="w-2.5 h-2.5 text-indigo-500" />
                          <span>+ Barkod</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-stone-900 dark:text-white">
                        {prod.sellingPrice} ₺
                      </span>
                      {isWeighed && <span className="text-[10px] text-stone-400 ml-0.5">/kg</span>}
                    </div>
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                        isWeighed
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 group-hover:bg-amber-600 group-hover:text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white'
                      }`}
                    >
                      {isWeighed ? <Scale className="w-3.5 h-3.5" /> : '+'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SAĞ 1 KOLON: TEZGÂH SEPETİ, PARA ÜSTÜ & ÖDEME BUTONLARI */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col h-[580px]">
          {/* Sepet Başlığı */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                Tezgâh Sepeti ({cart.length} Kalem)
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Sepeti Boşalt
              </button>
            )}
          </div>

          {/* Sepet Kalemleri */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 my-2 pr-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <Package className="w-12 h-12 opacity-30 mb-2" />
                <p className="text-xs font-bold text-stone-500">Sepetiniz Boş</p>
                <p className="text-[11px] mt-1 max-w-[200px]">
                  Ürün kartlarına tıklayın veya USB Barkod okuyucu ile okutun.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.name} className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-xs font-bold text-stone-900 dark:text-white truncate">
                          {item.name}
                        </h5>
                        {item.isWeighed && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[9px] font-bold shrink-0">
                            Tartı
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 font-mono">
                        {item.unitPrice} ₺ x {item.quantity}{item.isWeighed ? ' kg' : ''} ={' '}
                        <strong className="text-stone-900 dark:text-white">
                          {Number((item.unitPrice * item.quantity).toFixed(2))} ₺
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.name, -1)}
                        className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center text-xs font-bold hover:bg-stone-200 cursor-pointer"
                        title={item.isWeighed ? '-0.25 kg' : '-1 Adet'}
                      >
                        -
                      </button>

                      {item.isWeighed ? (
                        <div className="flex items-center">
                          <input
                            type="number"
                            step="0.005"
                            min="0.001"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                setItemQuantity(item.name, val);
                              }
                            }}
                            className="w-14 text-center text-xs font-mono font-bold py-0.5 px-0.5 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                            title="Ondalıklı miktar / gramaj düzenleme"
                          />
                          <span className="text-[10px] font-bold text-stone-400 ml-0.5">kg</span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono font-bold w-8 text-center">
                          {item.quantity}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.name, 1)}
                        className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center text-xs font-bold hover:bg-stone-200 cursor-pointer"
                        title={item.isWeighed ? '+0.25 kg' : '+1 Adet'}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Tartılı ürünler için Hızlı Gramaj Seçici (250g, 500g, 1kg, 1.5kg) */}
                  {item.isWeighed && (
                    <div className="flex items-center gap-1 pl-1">
                      <span className="text-[9px] text-stone-400 font-semibold mr-1">Hızlı Gramaj:</span>
                      {[
                        { label: '250g', val: 0.25 },
                        { label: '500g', val: 0.5 },
                        { label: '1kg', val: 1.0 },
                        { label: '1.5kg', val: 1.5 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setItemQuantity(item.name, preset.val)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                            item.quantity === preset.val
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-amber-950/60'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Sepet Alt Paneli: Tutar, Para Üstü ve Ödeme */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2.5">
            {/* Toplam Tutar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">Ödenecek Tutar:</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {cartTotal} ₺
              </span>
            </div>

            {/* Hızlı Nakit / Para Üstü Hesaplayıcı */}
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-stone-600 dark:text-stone-300">Alınan Nakit:</span>
                <div className="flex items-center gap-1">
                  {[cartTotal, 50, 100, 200, 500].filter((v) => v >= cartTotal || v === 200).map((cashVal) => (
                    <button
                      key={cashVal}
                      type="button"
                      onClick={() => setCashTendered(cashVal)}
                      className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-[10px] font-bold cursor-pointer"
                    >
                      {cashVal}₺
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="Nakit tutarı giriniz..."
                  className="w-1/2 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />

                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block">Para Üstü:</span>
                  <span
                    className={`text-xs font-black font-mono ${
                      changeDue > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500'
                    }`}
                  >
                    {changeDue} ₺
                  </span>
                </div>
              </div>
            </div>

            {/* Ödeme Butonları: Nakit / Kart */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={cart.length === 0 || isProcessing}
                onClick={() => handleCompleteSale('nakit')}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Banknote className="w-4 h-4" />
                <span>Nakit Bitir</span>
              </button>

              <button
                type="button"
                disabled={cart.length === 0 || isProcessing}
                onClick={() => handleCompleteSale('kart')}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Kart / POS</span>
              </button>
            </div>

            {/* Veresiye Defterine Borç Yaz Butonu */}
            <button
              type="button"
              disabled={cart.length === 0 || isProcessing}
              onClick={() => setIsVeresiyeModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Veresiye Defterine Borç Yaz</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TARTILI ÜRÜN GRAMAJ GİRİŞ MODALI */}
      {/* ========================================================================= */}
      {weighedModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                  Tartı & Gramaj Girişi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWeighedModalProduct(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <h4 className="font-black text-sm text-stone-900 dark:text-white">
                {weighedModalProduct.name}
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-bold mt-0.5">
                Birim Fiyat: {weighedModalProduct.sellingPrice} ₺ / kg
              </p>
            </div>

            {/* Hazır Gramaj Düğmeleri */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1.5">
                Hızlı Gramaj Seçimi:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['0.250', '0.500', '0.750', '1.000', '1.250', '1.500', '2.000', '3.000'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setManualWeightKg(preset)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      manualWeightKg === preset
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {parseFloat(preset) < 1 ? `${parseFloat(preset) * 1000}g` : `${preset}kg`}
                  </button>
                ))}
              </div>
            </div>

            {/* Elle Kg Girişi */}
            <div>
              <label className="block text-[11px] font-bold text-stone-500 mb-1">
                Terazi Ağırlığı (Kg):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.005"
                  min="0.01"
                  autoFocus
                  value={manualWeightKg}
                  onChange={(e) => setManualWeightKg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddWeighedToCart();
                    }
                  }}
                  className="w-full px-3 py-2 text-center text-lg font-mono font-black rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  KG
                </span>
              </div>
            </div>

            {/* Canlı Hesaplanan Tutar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-100 dark:bg-stone-800">
              <span className="text-xs font-bold text-stone-500">Hesaplanan Tutar:</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {Number(((parseFloat(manualWeightKg) || 0) * weighedModalProduct.sellingPrice).toFixed(2))} ₺
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddWeighedToCart}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Tartıyı Sepete Ekle</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KAMERA İLE BARKOD OKUYUCU MODALI */}
      {/* ========================================================================= */}
      {isCameraScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 text-white rounded-3xl border border-stone-800 w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Kamera ile Barkod Oku</h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {cameraError}
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-stone-800">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Kırmızı Lazer Hizalama Çizgisi */}
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse pointer-events-none" />
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 text-[10px] text-stone-300 backdrop-blur-xs">
                    Barkodu kırmızı çizgiye hizalayın
                  </span>
                </div>
              </div>
            )}

            {/* Manuel Barkod Tamamlama Alternatifi */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Veya barkodu buraya yazın..."
                className="flex-1 px-3 py-2 rounded-xl text-xs bg-stone-800 border border-stone-700 text-white font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScannedBarcodeFromCamera((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VERESİYE DEFTERİNE YAZMA MODALI */}
      {/* ========================================================================= */}
      {isVeresiyeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 shadow-xl">
            <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">
              Veresiye Defterine Borç Yaz
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {cartTotal} ₺ tutarındaki sepeti seçilen müşterinin borç bakiyesine ekler.
            </p>

            <form onSubmit={handleVeresiyeSale} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Müşteri Seçiniz *
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                >
                  <option value="">-- Müşteri Seçiniz --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Güncel Borç: {c.balance} ₺)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVeresiyeModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-500 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={!selectedCustomerId || isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  Deftere Borç İşle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TERMAL FİŞ YAZDIRMA MODALI (58mm / 80mm) */}
      {/* ========================================================================= */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-stone-900 dark:text-white text-base">
                  Termal Satış Fişi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fiş Kağıt Boyutu Seçici: 58mm vs 80mm */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setReceiptPaperWidth('58mm')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  receiptPaperWidth === '58mm'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                58 mm (Küçük Rulo)
              </button>
              <button
                type="button"
                onClick={() => setReceiptPaperWidth('80mm')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  receiptPaperWidth === '80mm'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                80 mm (Standart POS)
              </button>
            </div>

            {/* Termal Fiş Önizleme Alanı */}
            <div className="flex justify-center bg-stone-100 dark:bg-stone-950 p-4 rounded-2xl overflow-x-auto max-h-[380px]">
              <div
                id="thermal-receipt-printable"
                className={`bg-white text-black p-3.5 font-mono shadow-md border border-dashed border-stone-300 ${
                  receiptPaperWidth === '58mm' ? 'w-[58mm] text-[10px]' : 'w-[80mm] text-[11px]'
                }`}
              >
                {/* Fiş Başlığı */}
                <div className="text-center font-black text-sm uppercase tracking-wider mb-0.5">
                  {receiptData.storeName || storeName || 'DÜKKANIM YANIMDA'}
                </div>
                <div className="text-center text-[9px] text-stone-600 mb-2 border-b border-black pb-1 uppercase font-bold">
                  PERAKENDE SATIŞ BİLGİ FİŞİ
                </div>

                {/* Üst Bilgiler */}
                <div className="text-[10px] mb-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Fiş No:</span>
                    <span className="font-bold">{receiptData.receiptNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarih:</span>
                    <span>{receiptData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ödeme Türü:</span>
                    <span className="font-bold">{receiptData.paymentMethod}</span>
                  </div>
                  {receiptData.customerName && (
                    <div className="flex justify-between font-bold border-t border-dotted border-black/40 pt-0.5">
                      <span>Müşteri:</span>
                      <span>{receiptData.customerName}</span>
                    </div>
                  )}
                </div>

                {/* Kalem Başlıkları */}
                <div className="border-t border-b border-black py-1 my-1 text-[10px] font-black flex justify-between">
                  <span>ÜRÜN</span>
                  <span>TUTAR</span>
                </div>

                {/* Satış Kalemleri */}
                <div className="space-y-1.5 my-2">
                  {receiptData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-1">
                      <div className="truncate max-w-[70%]">
                        <div>{item.name}</div>
                        <div className="text-[9px] text-stone-600">
                          {item.quantity} x {item.unitPrice.toFixed(2)} ₺
                        </div>
                      </div>
                      <div className="shrink-0 font-bold font-mono">
                        {(item.quantity * item.unitPrice).toFixed(2)} ₺
                      </div>
                    </div>
                  ))}
                </div>

                {/* Toplam ve Ödeme Detayları */}
                <div className="border-t-2 border-black pt-1.5 mt-2 space-y-0.5">
                  <div className="text-xs font-black flex justify-between">
                    <span>GENEL TOPLAM:</span>
                    <span>{receiptData.total.toFixed(2)} ₺</span>
                  </div>

                  {typeof receiptData.cashReceived === 'number' && receiptData.cashReceived > 0 && (
                    <>
                      <div className="flex justify-between text-[10px] text-stone-700 pt-1">
                        <span>Alınan Nakit:</span>
                        <span>{receiptData.cashReceived.toFixed(2)} ₺</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Para Üstü:</span>
                        <span>{(receiptData.changeAmount || 0).toFixed(2)} ₺</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Alt Not ve Barkod Görseli */}
                <div className="text-center text-[9px] text-stone-700 mt-4 border-t border-dotted border-black pt-1.5">
                  <div className="font-bold mb-0.5">
                    {receiptData.footerMessage || receiptFooter || 'Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz'}
                  </div>
                  <div className="text-[8px] text-stone-500">Dükkânım Yanımda Kasa Sistemi</div>
                </div>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 cursor-pointer"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Yazdır (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
