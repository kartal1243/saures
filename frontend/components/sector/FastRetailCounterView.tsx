import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  Search,
  Package,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Printer,
  X,
  Barcode,
  Camera,
  Scale,
  Volume2,
  VolumeX,
  MessageCircle,
  Calculator,
  FileSpreadsheet,
  Coins,
  Share2,
} from 'lucide-react';
import { Product, Customer } from '../../../shared/types.ts';
import { cleanPhoneForWhatsApp } from '../../utils/formatters.ts';

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

// Bakkal Dokunmatik Hızlı Satış Ürünleri (Temiz Türkçe Karakterler)
const DEFAULT_QUICK_ITEMS: DisplayProduct[] = [
  { id: 'quick_ekmek', name: 'Somun Ekmek 200g', sellingPrice: 10, currentStock: 80, unit: 'Adet', category: 'Fırın & Temel', barcode: '869000100101' },
  { id: 'quick_su', name: '0.5L Doğal Kaynak Suyu', sellingPrice: 5, currentStock: 120, unit: 'Şişe', category: 'İçecek', barcode: '869000100102' },
  { id: 'quick_yumurta', name: 'Köy Yumurtası (Adet)', sellingPrice: 5, currentStock: 90, unit: 'Adet', category: 'Fırın & Temel', barcode: '869000100104' },
  { id: 'quick_sut', name: 'Tam Yağlı Süt 1L', sellingPrice: 35, currentStock: 40, unit: 'Kutu', category: 'Süt & Kahvaltılık', barcode: '869000100103' },
  { id: 'quick_cay', name: 'Çaykur Rize Çay 1kg', sellingPrice: 180, currentStock: 25, unit: 'Paket', category: 'Fırın & Temel', barcode: '869000100105' },
  { id: 'quick_kola', name: 'Kola 1L Şişe', sellingPrice: 40, currentStock: 30, unit: 'Şişe', category: 'İçecek', barcode: '869000100108' },
  { id: 'quick_gazoz', name: 'Gazoz 250ml', sellingPrice: 18, currentStock: 45, unit: 'Şişe', category: 'İçecek', barcode: '869000100106' },
  { id: 'quick_seker', name: 'Toz Şeker 1kg', sellingPrice: 38, currentStock: 35, unit: 'Paket', category: 'Fırın & Temel', barcode: '869000100107' },
  { id: 'quick_gazete', name: 'Günlük Gazete / Dergi', sellingPrice: 15, currentStock: 20, unit: 'Adet', category: 'Atıştırmalık & Muhtelif', barcode: '869000100109' },
  { id: 'quick_cikolata', name: 'Çikolata / Gofret', sellingPrice: 15, currentStock: 60, unit: 'Adet', category: 'Atıştırmalık & Muhtelif', barcode: '869000100110' },
  { id: 'quick_sakiz', name: 'Damla Sakız / Şekerleme', sellingPrice: 10, currentStock: 100, unit: 'Adet', category: 'Atıştırmalık & Muhtelif', barcode: '869000100111' },
  { id: 'quick_domates', name: 'Salkım Domates (Yerli)', sellingPrice: 35, currentStock: 30, unit: 'Kg', category: 'Manav / Terazi', barcode: '270010100000' },
  { id: 'quick_salatalik', name: 'Çengelköy Salatalık', sellingPrice: 30, currentStock: 25, unit: 'Kg', category: 'Manav / Terazi', barcode: '270010200000' },
  { id: 'quick_kasar', name: 'Taze Kaşar Peyniri', sellingPrice: 280, currentStock: 15, unit: 'Kg', category: 'Süt & Kahvaltılık', barcode: '280020100000' },
  { id: 'quick_peynir', name: 'Ezine Beyaz Peynir', sellingPrice: 240, currentStock: 20, unit: 'Kg', category: 'Süt & Kahvaltılık', barcode: '280020200000' },
];

// Hafif POS Bip Sesi (Web Audio API)
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
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
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
  // Arama & Minimalist Barkod
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'firin' | 'icecek' | 'kahvalti' | 'manav' | 'muhtelif'>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaleMessage, setLastSaleMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Bakkal Serbest Tutar Girişi (Hızlı Barkodsuz Satış)
  const [freeAmount, setFreeAmount] = useState('');
  const [freeTitle, setFreeTitle] = useState('Muhtelif Bakkaliye');

  // Entegre Veresiye Defteri
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isVeresiyeModalOpen, setIsVeresiyeModalOpen] = useState(false);

  // Hızlı Nakit / Para Üstü Hesaplayıcı
  const [cashTendered, setCashTendered] = useState<number | ''>('');

  // Termal Fiş & Yazıcı
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptPaperWidth, setReceiptPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Gün Sonu Z-Raporu Modalı
  const [isZReportModalOpen, setIsZReportModalOpen] = useState(false);
  const [sessionSales, setSessionSales] = useState<{
    cashTotal: number;
    cardTotal: number;
    creditTotal: number;
    count: number;
  }>({ cashTotal: 0, cardTotal: 0, creditTotal: 0, count: 0 });

  // Tartılı Ürün Gramaj Modalı
  const [weighedModalProduct, setWeighedModalProduct] = useState<DisplayProduct | null>(null);
  const [manualWeightKg, setManualWeightKg] = useState('1.000');

  // Kamera ile Barkod Okuma Modalı
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Ürün Kataloğu
  const displayProducts = useMemo<DisplayProduct[]>(() => {
    if (!products || products.length === 0) {
      return DEFAULT_QUICK_ITEMS;
    }
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      sellingPrice: p.salePrice ?? (p as any).sellingPrice ?? 0,
      currentStock: p.currentStock ?? (p as any).stock ?? 50,
      unit: p.unit || 'Adet',
      criticalThreshold: p.criticalThreshold ?? 5,
      category: p.category || 'Fırın & Temel',
    }));
  }, [products]);

  // Kategori ve Arama Filtresi
  const filteredProducts = useMemo(() => {
    let list = displayProducts;

    if (selectedCategory === 'firin') {
      list = list.filter((p) => p.category?.toLowerCase().includes('fırın') || p.category?.toLowerCase().includes('temel'));
    } else if (selectedCategory === 'icecek') {
      list = list.filter((p) => p.category?.toLowerCase().includes('içecek') || p.category?.toLowerCase().includes('su'));
    } else if (selectedCategory === 'kahvalti') {
      list = list.filter((p) => p.category?.toLowerCase().includes('süt') || p.category?.toLowerCase().includes('kahvaltı'));
    } else if (selectedCategory === 'manav') {
      list = list.filter((p) => p.unit?.toLowerCase() === 'kg' || p.category?.toLowerCase().includes('manav'));
    } else if (selectedCategory === 'muhtelif') {
      list = list.filter((p) => p.category?.toLowerCase().includes('muhtelif') || p.category?.toLowerCase().includes('atıştırmalık'));
    }

    if (!barcodeQuery.trim()) return list;

    const q = barcodeQuery.toLowerCase().trim();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (Boolean(p.barcode) && p.barcode?.toLowerCase().includes(q))
    );
  }, [displayProducts, selectedCategory, barcodeQuery]);

  // Sepet Toplam Tutarı
  const cartTotal = useMemo(() => {
    return Number(cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2));
  }, [cart]);

  // Para Üstü Hesabı
  const changeDue = useMemo(() => {
    if (typeof cashTendered !== 'number' || cashTendered <= 0) return 0;
    return Number(Math.max(0, cashTendered - cartTotal).toFixed(2));
  }, [cashTendered, cartTotal]);

  // Seçili Müşteri Bilgisi
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Filtrelenmiş Müşteri Listesi
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers.slice(0, 8);
    const q = customerSearchQuery.toLowerCase().trim();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 8);
  }, [customers, customerSearchQuery]);

  // Sepete Ürün Ekle
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
          return prev.map((item) => (item.name === product.name ? { ...item, quantity: newQty } : item));
        }
        return [
          ...prev,
          {
            productId: product.id?.startsWith('quick_') || product.id?.startsWith('free_') ? undefined : product.id,
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
      setLastSaleMessage(`+ ${product.name} sepete eklendi`);
      setTimeout(() => setLastSaleMessage(null), 3000);
    },
    [soundEnabled]
  );

  // Miktar Güncelleme (+ / -)
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

  // Doğrudan Gramaj / Miktar Belirleme (250g, 500g, 1kg vb.)
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
  // =========================================================================
  const parseTurkishScaleBarcode = useCallback(
    (code: string) => {
      const clean = code.trim();
      if (clean.length !== 13) return null;

      const prefix = clean.slice(0, 2);
      if (prefix !== '27' && prefix !== '28' && prefix !== '29') return null;

      const pluCode = clean.slice(2, 7);
      const valInt = parseInt(clean.slice(7, 12), 10);
      if (isNaN(valInt) || valInt <= 0) return null;

      const matched = displayProducts.find((p) => {
        const b = String(p.barcode || '');
        return b === pluCode || b.endsWith(pluCode) || b.includes(pluCode) || String(p.id).includes(pluCode);
      });

      if (prefix === '27' || prefix === '28') {
        const weightKg = Number((valInt / 1000).toFixed(3));
        const unitPrice = matched ? matched.sellingPrice : 40;
        const name = matched ? matched.name : `Tartılı Ürün (PLU: ${pluCode})`;

        return {
          product: matched,
          name: `${name} (${weightKg} kg)`,
          quantity: weightKg,
          unitPrice,
          isWeighed: true,
        };
      } else {
        const price = Number((valInt / 100).toFixed(2));
        const name = matched ? matched.name : `Tartılı Ürün (PLU: ${pluCode})`;

        return {
          product: matched,
          name,
          quantity: 1,
          unitPrice: price,
          isWeighed: true,
        };
      }
    },
    [displayProducts]
  );

  // Minimalist Barkod / Arama Enter İşleyicisi (Klavye Esareti Yok)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = barcodeQuery.trim();
    if (!raw) return;

    // 1. EAN-13 Terazi Barkodu mu?
    const scaleItem = parseTurkishScaleBarcode(raw);
    if (scaleItem) {
      addToCart(
        {
          id: scaleItem.product?.id,
          name: scaleItem.name,
          sellingPrice: scaleItem.unitPrice,
          isWeighed: true,
          unit: 'Kg',
        },
        scaleItem.quantity
      );
      setBarcodeQuery('');
      return;
    }

    // 2. Normal Barkod veya İsim Eşleşmesi
    const lower = raw.toLowerCase();
    const matched = displayProducts.find(
      (p) => (p.barcode && p.barcode.toLowerCase() === lower) || p.name.toLowerCase() === lower
    );

    if (matched) {
      if (matched.unit?.toLowerCase() === 'kg') {
        setWeighedModalProduct(matched);
        setManualWeightKg('1.000');
      } else {
        addToCart(matched, 1);
      }
      setBarcodeQuery('');
      return;
    }

    // 3. Eşleşme yoksa bildirim ver
    playPosAudio('alert', soundEnabled);
    setLastSaleMessage(`'${raw}' barkodu bulunamadı. Serbest satıştan tutar girebilirsiniz.`);
    setTimeout(() => setLastSaleMessage(null), 3500);
  };

  // Bakkal Serbest Tutar Girişi (Hızlı Barkodsuz Satış)
  const handleAddFreeAmountSale = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseFloat(freeAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    const title = freeTitle.trim() || 'Muhtelif Bakkaliye';
    addToCart(
      {
        id: `free_${Date.now()}`,
        name: `${title} (${parsed} ₺)`,
        sellingPrice: parsed,
        unit: 'Adet',
      },
      1
    );

    setFreeAmount('');
    playPosAudio('scan', soundEnabled);
  };

  // Tartılı Ürünü Sepete Ekle
  const handleAddWeighedToCart = () => {
    if (!weighedModalProduct) return;
    const kg = parseFloat(manualWeightKg);
    if (isNaN(kg) || kg <= 0) return;

    addToCart(
      {
        id: weighedModalProduct.id,
        name: `${weighedModalProduct.name} (${kg} kg)`,
        sellingPrice: weighedModalProduct.sellingPrice,
        unit: 'Kg',
        isWeighed: true,
      },
      kg
    );

    setWeighedModalProduct(null);
    setManualWeightKg('1.000');
  };

  // Satışı Tamamla (Nakit / Kredi Kartı)
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

      // Z-Raporu sayaçlarını güncelle
      setSessionSales((prev) => ({
        ...prev,
        cashTotal: prev.cashTotal + (paymentMethod === 'nakit' ? total : 0),
        cardTotal: prev.cardTotal + (paymentMethod === 'kart' ? total : 0),
        count: prev.count + 1,
      }));

      playPosAudio('success', soundEnabled);
      setLastSaleMessage(`${total} ₺ ${paymentMethod === 'nakit' ? 'Nakit' : 'POS'} satışı tamamlandı!` + (change > 0 ? ` Para Üstü: ${change} ₺` : ''));

      setCart([]);
      setCashTendered('');
      setTimeout(() => setLastSaleMessage(null), 5000);
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
      const desc = `Veresiye Satışı: ${saleCart.map((i) => `${i.quantity}x ${i.name}`).join(', ')}`;

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

      // Z-Raporu güncelle
      setSessionSales((prev) => ({
        ...prev,
        creditTotal: prev.creditTotal + total,
        count: prev.count + 1,
      }));

      playPosAudio('success', soundEnabled);
      setIsVeresiyeModalOpen(false);
      setLastSaleMessage(`${total} ₺ borç ${customer?.name || 'Müşteri'} defterine işlendi!`);
      setCart([]);
      setCashTendered('');
      setTimeout(() => setLastSaleMessage(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Müşteriye WhatsApp Fişi Gönder
  const handleSendWhatsAppReceipt = (customer: Customer, total: number, items: CartItem[]) => {
    const targetPhone = cleanPhoneForWhatsApp(customer.phone || '');
    if (!targetPhone) {
      alert('Bu müşterinin geçerli bir telefon numarası bulunmuyor.');
      return;
    }
    const itemsText = items.map((i) => `• ${i.quantity}x ${i.name}: ${(i.quantity * i.unitPrice).toFixed(2)} TL`).join('\n');
    const newBal = (customer.balance || 0) + total;
    const msg = `Sayın ${customer.name},\n${storeName || 'Bakkalımızdan'} yapmış olduğunuz alışveriş fişi:\n\n${itemsText}\n\nToplam: ${total.toFixed(2)} TL\nGüncel Kalan Borcunuz: ${newBal.toFixed(2)} TL\n\nTeşekkür eder, hayırlı günler dileriz.`;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Örnek Test Fişi
  const handlePrintTestReceipt = () => {
    const testReceipt: ReceiptData = {
      receiptNo: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      storeName: storeName ? storeName.toUpperCase() : 'DÜKKANIM YANIMDA MARKET',
      items: [
        { name: 'Somun Ekmek 200g', quantity: 2, unitPrice: 10, currentStock: 20 },
        { name: 'Çaykur Rize Çay 1kg', quantity: 1, unitPrice: 180, currentStock: 15 },
        { name: 'Salkım Domates (Yerli)', quantity: 1.25, unitPrice: 35, isWeighed: true, unit: 'Kg' },
      ],
      total: 243.75,
      paymentMethod: 'Yazıcı Test Baskısı',
      date: new Date().toLocaleString('tr-TR'),
      cashReceived: 250.0,
      changeAmount: 6.25,
      footerMessage: receiptFooter || '✦ TERMAL YAZICI BAŞARIYLA BAĞLANDI VE ÇALIŞIYOR ✦',
    };
    setReceiptData(testReceipt);
    setIsReceiptModalOpen(true);
  };

  // Kamera Okuma
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
    } catch (_err) {
      setCameraError('Kamera erişimine izin verilmedi veya kamera bulunamadı.');
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraScannerOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Yazıcı CSS İzolasyonu */}
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
            padding: 6px !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. ÜST BAŞLIK & HIZLI EYLEM ÇUBUĞU */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
              {storeName || 'Bakkal & Market Hızlı Tezgâh'}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                Canlı Kasa
              </span>
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Büyük dokunmatik ürünler, serbest bakkal tutar girişi, tek tıkla veresiye defteri ve termal fiş
          </p>
        </div>

        {/* Eylem Düğmeleri */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Gün Sonu Z-Raporu */}
          <button
            type="button"
            onClick={() => setIsZReportModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="Günün satış özetini ve kasa toplamını görüntüle"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Z-Raporu (Kasa)</span>
          </button>

          {/* Test Fişi Bas */}
          <button
            type="button"
            onClick={handlePrintTestReceipt}
            className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="Termal fiş yazıcısını test et"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>Test Fişi</span>
          </button>

          {/* Son Fiş */}
          {receiptData && (
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black flex items-center gap-1.5 shadow-xs hover:bg-stone-800 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Son Fişi Yazdır</span>
            </button>
          )}

          {/* Ses Aç/Kapat */}
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 cursor-pointer text-xs font-bold"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          </button>
        </div>
      </div>

      {/* Bildirim Çubuğu */}
      {lastSaleMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{lastSaleMessage}</span>
          </div>
          {receiptData && (
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Fiş Bas</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ANA ÇALIŞMA ALANI (SOL: REYON & SERBEST SATIŞ / SAĞ: SEPET & ÖDEME) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SOL 7 KOLON: REYON, ARAMA, SERBEST TUTAR VE DOKUNMATİK KARTLAR */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Minimalist Barkod / Arama Girişi (Klavye Tuzağı Yok) */}
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                placeholder="Barkod okutun veya ürün adı yazıp Enter'a basın..."
                className="w-full pl-9 pr-16 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white shadow-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-bold cursor-pointer"
              >
                Bul
              </button>
            </div>

            <button
              type="button"
              onClick={startCamera}
              className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 text-stone-600 dark:text-stone-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Telefon veya bilgisayar kamerasıyla barkod tara"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Kamera</span>
            </button>
          </form>

          {/* ========================================================================= */}
          {/* BAKKAL SERBEST TUTAR GİRİŞİ (Hızlı Barkodsuz Satış - Sakız, Bisküvi vb.) */}
          {/* ========================================================================= */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-amber-600" />
                Hızlı Serbest Tutar Girişi (Barkodsuz / Açık Satış)
              </span>
              <span className="text-[10px] text-stone-500">Listede olmayan ürünler için</span>
            </div>

            <form onSubmit={handleAddFreeAmountSale} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <input
                type="text"
                value={freeTitle}
                onChange={(e) => setFreeTitle(e.target.value)}
                placeholder="Ürün Adı (örn. Muhtelif, Sakız, Ekmek)"
                className="flex-1 min-w-[140px] px-3 py-2 rounded-xl text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
              />

              <div className="relative w-28 shrink-0">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={freeAmount}
                  onChange={(e) => setFreeAmount(e.target.value)}
                  placeholder="0.00 ₺"
                  className="w-full pl-2 pr-6 py-2 rounded-xl text-xs font-mono font-black text-right bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  ₺
                </span>
              </div>

              <button
                type="submit"
                disabled={!freeAmount || parseFloat(freeAmount) <= 0}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-40 cursor-pointer shadow-xs whitespace-nowrap"
              >
                Sepete Ekle
              </button>
            </form>

            {/* Hızlı Tutar Çipleri */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-stone-500 font-bold mr-1">Hızlı Tutar:</span>
              {[5, 10, 15, 20, 25, 35, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setFreeAmount(amt.toString());
                  }}
                  className="px-2 py-0.5 rounded-lg bg-white dark:bg-stone-800 hover:bg-amber-100 text-stone-700 dark:text-stone-300 text-[11px] font-mono font-bold border border-stone-200 dark:border-stone-700 cursor-pointer transition-colors"
                >
                  +{amt}₺
                </button>
              ))}
            </div>
          </div>

          {/* Kategori Sekmeleri */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'firin', label: 'Fırın & Temel' },
              { id: 'icecek', label: 'İçecek' },
              { id: 'kahvalti', label: 'Süt & Kahvaltılık' },
              { id: 'manav', label: 'Manav / Terazi (Kg)' },
              { id: 'muhtelif', label: 'Atıştırmalık' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* BÜYÜK DOKUNMATİK HIZLI ÜRÜN KARTLARI */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => {
              const isWeighed = prod.unit?.toLowerCase() === 'kg';

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
                  className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500 dark:hover:border-emerald-600 transition-all text-left cursor-pointer shadow-xs active:scale-[0.97] flex flex-col justify-between group min-h-[96px]"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                      <span className="font-bold text-stone-500">
                        {isWeighed ? 'Tartı (Kg)' : prod.unit || 'Adet'}
                      </span>
                      {prod.barcode && (
                        <span className="font-mono text-[9px] text-stone-400 truncate max-w-[65px]">
                          {prod.barcode.slice(-4)}
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-xs text-stone-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {prod.sellingPrice} ₺
                    </span>
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isWeighed
                          ? 'bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white'
                          : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
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
        {/* SAĞ 5 KOLON: TEZGÂH SEPETİ, PARA ÜSTÜ & ENTEGRE VERESİYE DEFTERİ */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col min-h-[580px]">
          {/* Sepet Başlığı */}
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-sm text-stone-900 dark:text-white">
                Tezgâh Sepeti ({cart.length} Kalem)
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Sepet Kalemleri */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 my-2 pr-1 max-h-[260px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400">
                <Package className="w-10 h-10 opacity-30 mb-2" />
                <p className="text-xs font-bold text-stone-500">Sepetiniz Boş</p>
                <p className="text-[11px] mt-0.5">Soldan ürünlere tıklayın veya serbest tutar ekleyin.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.name} className="py-2 space-y-1.5">
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
                        <strong className="text-stone-900 dark:text-white font-bold">
                          {Number((item.unitPrice * item.quantity).toFixed(2))} ₺
                        </strong>
                      </span>
                    </div>

                    {/* Miktar Düzenleme */}
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
                        <span className="text-xs font-mono font-bold w-7 text-center">
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

                  {/* Tartılı Ürün Hızlı Gramaj Seçicisi */}
                  {item.isWeighed && (
                    <div className="flex items-center gap-1 pl-1">
                      <span className="text-[9px] text-stone-400 font-semibold mr-1">Gramaj:</span>
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
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-100'
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

          {/* ========================================================================= */}
          {/* SEPET ALTI: TOPLAM TUTAR, PARA ÜSTÜ & ÖDEME */}
          {/* ========================================================================= */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2.5">
            {/* Toplam Tutar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">Ödenecek Tutar:</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {cartTotal} ₺
              </span>
            </div>

            {/* Hızlı Para Üstü Hesaplayıcı (200₺, 100₺, 50₺, Tam Para) */}
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 dark:text-stone-300">
                <span>Alınan Nakit:</span>
                <div className="flex items-center gap-1">
                  {[cartTotal, 50, 100, 200, 500].filter((v) => v >= cartTotal || v === 200).map((cashVal) => (
                    <button
                      key={cashVal}
                      type="button"
                      onClick={() => setCashTendered(cashVal)}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-[10px] font-bold cursor-pointer"
                    >
                      {cashVal === cartTotal ? 'Tam' : `${cashVal}₺`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="Nakit gir..."
                  className="w-1/2 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />

                {/* Devasa Para Üstü Gösterimi */}
                <div className="text-right flex-1">
                  <span className="text-[10px] text-stone-400 block font-semibold">Para Üstü:</span>
                  <span className={`text-base font-black font-mono ${changeDue > 0 ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-stone-400'}`}>
                    {changeDue} ₺
                  </span>
                </div>
              </div>
            </div>

            {/* Ödeme Düğmeleri: Nakit & Kart */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={cart.length === 0 || isProcessing}
                onClick={() => handleCompleteSale('nakit')}
                className="py-2.5 px-3 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Banknote className="w-4 h-4" />
                <span>Nakit Satış</span>
              </button>

              <button
                type="button"
                disabled={cart.length === 0 || isProcessing}
                onClick={() => handleCompleteSale('kart')}
                className="py-2.5 px-3 rounded-xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Kart / POS</span>
              </button>
            </div>

            {/* ========================================================================= */}
            {/* ENTEGRE VERESİYE DEFTERİ (Bakkalın Can Damarı) */}
            {/* ========================================================================= */}
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  Veresiye Defterine Yaz
                </span>
                {selectedCustomer && (
                  <span className="text-[11px] font-mono font-black text-amber-700 dark:text-amber-300">
                    Borç: {selectedCustomer.balance} ₺
                  </span>
                )}
              </div>

              {/* Müşteri Seçimi */}
              <div className="space-y-1.5">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-700 text-stone-900 dark:text-white"
                >
                  <option value="">-- Müşteri Seçiniz (Borç Yazmak İçin) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Mevcut Borç: {c.balance} ₺)
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <div className="flex items-center justify-between text-[11px] px-2 py-1 bg-white/80 dark:bg-stone-800/80 rounded-lg">
                    <span className="font-bold text-stone-700 dark:text-stone-300">
                      {selectedCustomer.name}
                    </span>
                    <span className="text-amber-700 dark:text-amber-300 font-mono font-bold">
                      Yeni Borç: {(selectedCustomer.balance + cartTotal).toFixed(2)} ₺
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!selectedCustomerId || cart.length === 0 || isProcessing}
                    onClick={handleVeresiyeSale}
                    className="flex-1 py-2 px-3 rounded-lg font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Veresiyeye Borç Yaz</span>
                  </button>

                  {/* Tek Tık WhatsApp Fişi */}
                  {selectedCustomer && selectedCustomer.phone && cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppReceipt(selectedCustomer, cartTotal, cart)}
                      className="py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                      title="Müşteriye WhatsApp borç fişi gönder"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TARTILI ÜRÜN GRAMAJ GİRİŞ MODALI */}
      {/* ========================================================================= */}
      {weighedModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                  Terazi / Tartı Girişi
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

            {/* Hazır Gramaj Seçicileri */}
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
                Ağırlık (Kg):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.005"
                  min="0.01"
                  value={manualWeightKg}
                  onChange={(e) => setManualWeightKg(e.target.value)}
                  className="w-full px-3 py-2 text-center text-lg font-mono font-black rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  KG
                </span>
              </div>
            </div>

            {/* Tutar */}
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
      {/* 4. GÜN SONU Z-RAPORU MODALI (Bakkal Kasa Özeti) */}
      {/* ========================================================================= */}
      {isZReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-stone-900 dark:text-white text-base">
                  Gün Sonu Kasa & Z-Raporu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsZReportModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3 font-mono">
              <div className="text-center font-black text-sm uppercase">
                {storeName || 'DÜKKANIM YANIMDA MARKET'}
              </div>
              <div className="text-center text-[11px] text-stone-500 border-b border-stone-300 dark:border-stone-700 pb-2">
                Z-RAPORU / GÜN SONU KASA CETVELİ
                <div className="text-[10px] mt-0.5">{new Date().toLocaleString('tr-TR')}</div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span>Toplam Fiş / İşlem:</span>
                  <span className="font-bold">{sessionSales.count} adet</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                  <span>Nakit Satışlar:</span>
                  <span className="font-bold">{sessionSales.cashTotal.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-indigo-700 dark:text-indigo-300">
                  <span>Kart / POS Satışlar:</span>
                  <span className="font-bold">{sessionSales.cardTotal.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-300">
                  <span>Veresiye Borç Kaydı:</span>
                  <span className="font-bold">{sessionSales.creditTotal.toFixed(2)} ₺</span>
                </div>
              </div>

              <div className="border-t-2 border-stone-800 dark:border-stone-200 pt-2 flex justify-between text-sm font-black">
                <span>GENEL CİRO TOPLAMI:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {(sessionSales.cashTotal + sessionSales.cardTotal + sessionSales.creditTotal).toFixed(2)} ₺
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsZReportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 cursor-pointer"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Raporu Yazdır</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TERMAL FİŞ YAZDIRMA MODALI (58mm / 80mm) */}
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

            {/* Kağıt Boyutu: 58mm vs 80mm */}
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

            {/* Termal Fiş Önizleme */}
            <div className="flex justify-center bg-stone-100 dark:bg-stone-950 p-4 rounded-2xl overflow-x-auto max-h-[380px]">
              <div
                id="thermal-receipt-printable"
                className={`bg-white text-black p-3.5 font-mono shadow-md border border-dashed border-stone-300 ${
                  receiptPaperWidth === '58mm' ? 'w-[58mm] text-[10px]' : 'w-[80mm] text-[11px]'
                }`}
              >
                {/* Dükkân Adı */}
                <div className="text-center font-black text-sm uppercase tracking-wider mb-0.5">
                  {receiptData.storeName || storeName || 'DÜKKANIM YANIMDA'}
                </div>
                <div className="text-center text-[9px] text-stone-600 mb-2 border-b border-black pb-1 uppercase font-bold">
                  SATIŞ BİLGİ FİŞİ
                </div>

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

                {/* Kalemler */}
                <div className="border-t border-b border-black py-1 my-1 text-[10px] font-black flex justify-between">
                  <span>ÜRÜN</span>
                  <span>TUTAR</span>
                </div>

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

                {/* Toplam */}
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

                {/* Fiş Alt Notu */}
                <div className="text-center text-[9px] text-stone-700 mt-4 border-t border-dotted border-black pt-1.5">
                  <div className="font-bold mb-0.5">
                    {receiptData.footerMessage || receiptFooter || 'Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz'}
                  </div>
                  <div className="text-[8px] text-stone-500">Dükkânım Yanımda Kasa Sistemi</div>
                </div>
              </div>
            </div>

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

      {/* ========================================================================= */}
      {/* 6. KAMERA İLE BARKOD OKUYUCU MODALI */}
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
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse pointer-events-none" />
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 text-[10px] text-stone-300 backdrop-blur-xs">
                    Barkodu kırmızı çizgiye hizalayın
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={stopCamera}
              className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold cursor-pointer"
            >
              Kamerayı Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
