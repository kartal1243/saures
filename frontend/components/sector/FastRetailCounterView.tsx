import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Product, Customer } from '../../../shared/types.ts';

interface FastRetailCounterViewProps {
  products: Product[];
  customers: Customer[];
  onQuickPosSale: (
    items: Array<{ productId?: string; name: string; quantity: number; unitPrice: number; total: number }>,
    paymentMethod: 'nakit' | 'kart'
  ) => Promise<void>;
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
}

const DEFAULT_QUICK_ITEMS = [
  { name: 'Somun Ekmek', price: 10, unit: 'Adet' },
  { name: '0.5L Doğal Kaynak Suyu', price: 8, unit: 'Şişe' },
  { name: 'Tam Yağlı Süt 1L', price: 34, unit: 'Kutu' },
  { name: 'Köy Yumurtası (10lu)', price: 45, unit: 'Paket' },
  { name: 'Çaykur Rize Turist Çay 1kg', price: 175, unit: 'Paket' },
  { name: 'Gazoz 250ml', price: 18, unit: 'Şişe' },
  { name: 'Bisküvi / Çikolata', price: 20, unit: 'Paket' },
  { name: 'Toz Şeker 1kg', price: 38, unit: 'Paket' },
];

export const FastRetailCounterView: React.FC<FastRetailCounterViewProps> = ({
  products,
  customers,
  onQuickPosSale,
  onCreditSaleToCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isVeresiyeModalOpen, setIsVeresiyeModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaleMessage, setLastSaleMessage] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptPaperWidth, setReceiptPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [lastReceiptData, setLastReceiptData] = useState<{
    items: CartItem[];
    total: number;
    paymentMethod: string;
    date: string;
    customerName?: string;
  } | null>(null);

  // Combine products from catalog with quick items
  const displayProducts = useMemo(() => {
    if (!products || products.length === 0) {
      return DEFAULT_QUICK_ITEMS.map((item, idx) => ({
        id: `mock_${idx}`,
        name: item.name,
        barcode: '',
        sellingPrice: item.price,
        currentStock: 50,
        unit: item.unit,
        criticalThreshold: 10,
      }));
    }
    return products.map((p) => ({
      ...p,
      sellingPrice: p.salePrice ?? (p as any).sellingPrice ?? 0,
    }));
  }, [products]);

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return displayProducts;
    const q = searchQuery.toLowerCase();
    return displayProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (Boolean((p as any).barcode) && (p as any).barcode.toLowerCase().includes(q))
    );
  }, [displayProducts, searchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const addToCart = (product: { id?: string; name: string; sellingPrice: number; currentStock?: number }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.name === product.name);
      if (existing) {
        return prev.map((item) =>
          item.name === product.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id?.startsWith('mock_') ? undefined : product.id,
          name: product.name,
          unitPrice: product.sellingPrice,
          quantity: 1,
          currentStock: product.currentStock,
        },
      ];
    });
  };

  const updateQuantity = (name: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.name === name) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // EAN-13 Terazi Barkodu Çözücü (27, 28: Ağırlıklı gram; 29: Kuruş fiyatlı)
  const parseScaleBarcode = (barcode: string) => {
    const code = barcode.trim();
    if (code.length === 13 && (code.startsWith('27') || code.startsWith('28') || code.startsWith('29'))) {
      const prefix = code.slice(0, 2);
      const itemCode = code.slice(2, 7); // 5 haneli ürün PLU kodu
      const val = parseInt(code.slice(7, 12), 10);

      const matched = displayProducts.find((p) => {
        const b = String((p as any).barcode || '');
        return b === itemCode || b.endsWith(itemCode) || String(p.id).includes(itemCode);
      });

      if (matched && !isNaN(val) && val > 0) {
        if (prefix === '27' || prefix === '28') {
          const weightKg = Number((val / 1000).toFixed(3));
          return {
            product: matched,
            quantity: weightKg,
            name: `${matched.name} (${weightKg} kg)`,
            unitPrice: matched.sellingPrice,
          };
        } else {
          const price = Number((val / 100).toFixed(2));
          return {
            product: matched,
            quantity: 1,
            name: matched.name,
            unitPrice: price,
          };
        }
      }
    }
    return null;
  };

  const handleCompleteSale = async (paymentMethod: 'nakit' | 'kart') => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    const saleCart = [...cart];
    const total = cartTotal;

    try {
      const itemsPayload = saleCart.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

      await onQuickPosSale(itemsPayload, paymentMethod);

      setLastReceiptData({
        items: saleCart,
        total,
        paymentMethod: paymentMethod === 'nakit' ? 'Nakit' : 'Kredi Kartı / POS',
        date: new Date().toLocaleString('tr-TR'),
      });

      setLastSaleMessage(`${total} ₺ ${paymentMethod === 'nakit' ? 'Nakit' : 'POS'} satışı başarıyla tamamlandı!`);
      setCart([]);
      setTimeout(() => setLastSaleMessage(null), 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVeresiyeSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || cart.length === 0) return;
    setIsProcessing(true);
    const saleCart = [...cart];
    const total = cartTotal;

    try {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      const desc = `Veresiye Market Satışı: ${saleCart.map((i) => `${i.quantity}x ${i.name}`).join(', ')}`;
      await onCreditSaleToCustomer(selectedCustomerId, total, desc);

      setLastReceiptData({
        items: saleCart,
        total,
        paymentMethod: 'Veresiye',
        customerName: customer?.name,
        date: new Date().toLocaleString('tr-TR'),
      });

      setIsVeresiyeModalOpen(false);
      setLastSaleMessage(`${total} ₺ borç ${customer?.name || 'Müşteri'} defterine işlendi!`);
      setCart([]);
      setTimeout(() => setLastSaleMessage(null), 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
              Bakkal & Market Hızlı Kasa / Tezgâh
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Hızlı sepet barkod satışı, anlık stok düşümü ve tek tıkla veresiye defterine borç yazma.
          </p>
        </div>

        {lastSaleMessage && (
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{lastSaleMessage}</span>
            </div>
            {lastReceiptData && (
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-black flex items-center gap-1.5 shadow-xs hover:bg-stone-800 cursor-pointer"
                title="58mm veya 80mm termal fiş yazdır"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Fiş Bas</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Left Products, Right Shopping Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Product Catalog & Search */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Ürün adı, barkod veya terazi barkodu (27/28/29 ile başlayan 13 hane)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const q = searchQuery.trim();
                if (!q) return;

                // 1. Terazi Barkodu Çözümleme (EAN-13: 27/28 gramaj, 29 fiyat)
                const scaleItem = parseScaleBarcode(q);
                if (scaleItem) {
                  setCart((prev) => {
                    const existing = prev.find((item) => item.name === scaleItem.name);
                    if (existing) {
                      return prev.map((item) =>
                        item.name === scaleItem.name
                          ? { ...item, quantity: item.quantity + scaleItem.quantity }
                          : item
                      );
                    }
                    return [
                      ...prev,
                      {
                        productId: scaleItem.product.id?.startsWith('mock_') ? undefined : scaleItem.product.id,
                        name: scaleItem.name,
                        unitPrice: scaleItem.unitPrice,
                        quantity: scaleItem.quantity,
                        currentStock: scaleItem.product.currentStock,
                      },
                    ];
                  });
                  setSearchQuery('');
                  setLastSaleMessage(`Terazi ürünü sepete eklendi: ${scaleItem.name}`);
                  setTimeout(() => setLastSaleMessage(null), 3000);
                  return;
                }

                // 2. Normal Barkod / İsim Eşleşmesi
                const qLower = q.toLowerCase();
                const exact = displayProducts.find(
                  (p) => Boolean((p as any).barcode) && String((p as any).barcode).toLowerCase() === qLower
                );
                if (exact) {
                  addToCart(exact);
                  setSearchQuery('');
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredCatalog.map((prod) => {
              const isCritical = prod.currentStock <= prod.criticalThreshold;

              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => addToCart(prod)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500 dark:hover:border-emerald-600 transition-all text-left group cursor-pointer shadow-xs active:scale-95 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                      <span>{prod.unit || 'Adet'}</span>
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
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-sm font-black text-stone-900 dark:text-white">
                      {prod.sellingPrice} ₺
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      +
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Active Counter Cart */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col h-[560px]">
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
                className="text-xs text-stone-400 hover:text-rose-600"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 my-2 pr-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <Package className="w-10 h-10 opacity-30 mb-2" />
                <p className="text-xs font-semibold">Sepet boş</p>
                <p className="text-[11px] mt-1">Soldan ürünlere tıklayarak hızlıca sepete ekleyin.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.name} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-stone-900 dark:text-white truncate">
                      {item.name}
                    </h5>
                    <span className="text-[11px] text-stone-500">
                      {item.unitPrice} ₺ x {item.quantity} = <strong className="text-stone-800 dark:text-stone-200">{item.unitPrice * item.quantity} ₺</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.name, -1)}
                      className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center text-xs font-bold hover:bg-stone-200 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.name, 1)}
                      className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center text-xs font-bold hover:bg-stone-200 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Bottom: Total & Actions */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">Ödenecek Tutar:</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {cartTotal} ₺
              </span>
            </div>

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

      {/* Veresiye Defterine Yazma Modalı */}
      {isVeresiyeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 shadow-xl">
            <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">
              Veresiye Defterine Yaz
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
                  className="px-3 py-1.5 text-xs text-stone-500"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={!selectedCustomerId || isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40"
                >
                  Deftere Borç İşle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Termal Fiş Yazdırma Modalı (58mm / 80mm) */}
      {isReceiptModalOpen && lastReceiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 shadow-2xl space-y-4">
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

            {/* Fiş Kağıt Boyutu Seçici */}
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
            <div className="flex justify-center bg-stone-100 dark:bg-stone-950 p-4 rounded-2xl overflow-x-auto">
              <div
                className={`print-target bg-white text-black p-3 font-mono shadow-md border border-dashed border-stone-300 ${
                  receiptPaperWidth === '58mm' ? 'receipt-58mm w-[58mm]' : 'receipt-80mm w-[80mm]'
                }`}
              >
                <div className="text-center font-bold text-sm uppercase tracking-wider mb-1">
                  DÜKKANIM YANIMDA
                </div>
                <div className="text-center text-[10px] text-stone-600 mb-2 border-b border-black pb-1">
                  SATIŞ BİLGİ FİŞİ
                </div>
                <div className="text-[10px] mb-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Tarih:</span>
                    <span>{lastReceiptData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ödeme:</span>
                    <span>{lastReceiptData.paymentMethod}</span>
                  </div>
                  {lastReceiptData.customerName && (
                    <div className="flex justify-between font-bold">
                      <span>Müşteri:</span>
                      <span>{lastReceiptData.customerName}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-b border-black py-1 my-1 text-[10px] font-bold">
                  <div className="flex justify-between">
                    <span>ÜRÜN</span>
                    <span>TUTAR</span>
                  </div>
                </div>

                <div className="space-y-1 text-[10px] my-2">
                  {lastReceiptData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-1">
                      <div className="truncate max-w-[70%]">
                        {item.quantity}x {item.name}
                      </div>
                      <div className="shrink-0 font-bold">
                        {(item.quantity * item.unitPrice).toFixed(2)} ₺
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-black pt-1 mt-2 text-xs font-black flex justify-between">
                  <span>TOPLAM:</span>
                  <span>{lastReceiptData.total.toFixed(2)} ₺</span>
                </div>

                <div className="text-center text-[9px] text-stone-500 mt-4 border-t border-dotted border-stone-400 pt-1">
                  Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz
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
                <span>Yazdır</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
