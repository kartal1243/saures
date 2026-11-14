import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../../shared/types.ts';
import { X, Package, AlertTriangle, CheckCircle2, Tag, Barcode, DollarSign, Camera, Search, Loader2 } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSubmit: (productData: Partial<Product>) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Gıda & Bakliyat');
  const [currentStock, setCurrentStock] = useState('10');
  const [unit, setUnit] = useState('Adet');
  const [criticalThreshold, setCriticalThreshold] = useState('5');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogMsg, setCatalogMsg] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isCamOpen, setIsCamOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const categories = [
    'Gıda & Bakliyat',
    'Süt & Kahvaltılık',
    'İçecek & Meşrubat',
    'Unlu Mamül & Ekmek',
    'Atıştırmalık & Şekerleme',
    'Temizlik & Hijyen',
    'Kozmetik & Kişisel Bakım',
    'Sarf Malzeme & Ambalaj',
    'Tekel & Tütün',
    'Hırdavat & Çeşitli',
  ];

  const units = ['Adet', 'Kg', 'Paket', 'Koli', 'Litre', 'Teneke', 'Torba', 'Kutu', 'Porsiyon'];

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category || 'Gıda & Bakliyat');
      setCurrentStock(String(productToEdit.currentStock));
      setUnit(productToEdit.unit || 'Adet');
      setCriticalThreshold(String(productToEdit.criticalThreshold || 5));
      setPurchasePrice(productToEdit.purchasePrice !== undefined ? String(productToEdit.purchasePrice) : '');
      setSalePrice(productToEdit.salePrice !== undefined ? String(productToEdit.salePrice) : '');
      setBarcode(productToEdit.barcode || '');
    } else {
      setName('');
      setCategory('Gıda & Bakliyat');
      setCurrentStock('10');
      setUnit('Adet');
      setCriticalThreshold('5');
      setPurchasePrice('');
      setSalePrice('');
      setBarcode('');
    }
    setError(null);
  }, [productToEdit, isOpen]);

  const stopBarcodeCamera = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCamOpen(false);
  };

  const lookupBarcodeCatalog = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;
    setIsLookingUp(true);
    setCatalogMsg(null);
    try {
      const res = await fetch(`/api/products/barcode-catalog/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (res.ok && data?.found && data?.item) {
        if (!name.trim() && data.item.name) setName(data.item.name);
        if (data.item.category && categories.includes(data.item.category)) {
          setCategory(data.item.category);
        }
        if (data.item.unit && units.includes(data.item.unit)) {
          setUnit(data.item.unit);
        }
        if (!salePrice && data.item.suggestedSalePrice) {
          setSalePrice(String(data.item.suggestedSalePrice));
        }
        setCatalogMsg(`Katalogdan bulundu: ${data.item.name}`);
      } else {
        setCatalogMsg('Bu barkod katalogda bulunamadı; bilgilerini elle girebilirsiniz.');
      }
    } catch {
      setCatalogMsg('Katalog sorgulanamadı.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const startBarcodeCamera = async () => {
    if (isCamOpen) {
      stopBarcodeCamera();
      return;
    }
    setCatalogMsg(null);
    setIsCamOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if ('BarcodeDetector' in window) {
        const DetectorCtor = (window as any).BarcodeDetector;
        const detector = new DetectorCtor({ formats: ['ean_13', 'ean_8', 'upc_a', 'code_128', 'qr_code'] });
        timerRef.current = window.setInterval(async () => {
          const videoEl = videoRef.current;
          if (!videoEl || videoEl.readyState < 2) return;
          try {
            const found = await detector.detect(videoEl);
            const raw = String(found?.[0]?.rawValue || '').trim();
            if (raw) {
              setBarcode(raw);
              stopBarcodeCamera();
              await lookupBarcodeCatalog(raw);
            }
          } catch {
            // ignore frame detection error
          }
        }, 250);
      } else {
        setCatalogMsg('Tarayıcınız otomatik kamera barkod okuyucuyu desteklemiyor; barkodu yazıp "Katalogdan Bul"a tıklayın.');
      }
    } catch {
      setIsCamOpen(false);
      setCatalogMsg('Kamera açılamadı. Barkodu yazıp "Katalogdan Bul"a basabilirsiniz.');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopBarcodeCamera();
      setCatalogMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lütfen ürün adını yazınız.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data: Partial<Product> = {
        id: productToEdit ? productToEdit.id : undefined,
        name: name.trim(),
        category,
        currentStock: Math.max(0, Number(currentStock) || 0),
        unit,
        criticalThreshold: Math.max(1, Number(criticalThreshold) || 5),
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        salePrice: salePrice ? Number(salePrice) : undefined,
        barcode: barcode.trim() || undefined,
      };

      await onSubmit(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ürün kaydedilirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                {productToEdit ? 'Ürünü Düzenle' : 'Yeni Ürün Kaydet'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Stok takibi ve kritik eşik bildirimleri için ürün detayları
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-800 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Ürün Adı &amp; Markası *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Çaykur Tiryaki Çay 1 Kg"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Category & Unit in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                <span>Kategori</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Ölçü / Sayım Birimi
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Stock & Critical Threshold in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                Mevcut Stok Miktarı ({unit})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 text-sm font-bold bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Dükkandaki fiili sayım
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Kritik Stok Uyarısı Eşiği ({unit}) *</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(e.target.value)}
                placeholder="5"
                className="w-full px-3 py-2 text-sm font-bold bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-800 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium">
                Stok bu sayının altına inince kırmızı alarm verir
              </p>
            </div>
          </div>

          {/* Pricing: Purchase & Sale Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-stone-400" />
                <span>Alış Fiyatı (TL)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Örn. 140"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Satış Fiyatı (TL)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Örn. 175"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Barcode (optional) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
              <Barcode className="w-3.5 h-3.5 text-stone-400" />
              <span>Barkod / Stok Kodu (İsteğe Bağlı)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Örn. 8690504016212"
                className="flex-1 min-w-[160px] px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={startBarcodeCamera}
                className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                <span>{isCamOpen ? 'Kamerayı Kapat' : 'Kamerayla Oku'}</span>
              </button>
              <button
                type="button"
                disabled={!barcode.trim() || isLookingUp}
                onClick={() => lookupBarcodeCatalog(barcode)}
                className="px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLookingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Katalogdan Bul</span>
              </button>
            </div>
            {isCamOpen && (
              <div className="mt-2 relative rounded-xl overflow-hidden bg-black aspect-video border border-stone-700">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500" />
              </div>
            )}
            {catalogMsg && (
              <p className="mt-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                {catalogMsg}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                'Kaydediliyor...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{productToEdit ? 'Değişiklikleri Kaydet' : 'Ürünü Kaydet'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
