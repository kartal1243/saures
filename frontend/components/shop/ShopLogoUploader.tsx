import React, { useState, useRef } from 'react';
import { Camera, Trash2, Loader2, Upload, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface ShopLogoUploaderProps {
  currentLogoUrl?: string;
  storeName?: string;
  onLogoUpdated?: (logoUrl?: string) => void;
  className?: string;
}

/**
 * İstemci tarafında görseli otomatik kare (1:1) 512x512 çözünürlükte kırpar ve sıkıştırır.
 * Bu sayede hem Googlebot SERP küçük resmi hem de mobil hızlı yükleme için en ideal formata getirilir.
 */
function cropAndResizeToSquare(file: File, targetSize: number = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel yüklenemedi.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas bağlamı alınamadı.'));
          return;
        }

        // Merkezden kare kırpma
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        // Arka planı temizle ve çiz
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetSize, targetSize);
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);

        // WebP desteği varsa WebP, yoksa PNG
        try {
          const webpData = canvas.toDataURL('image/webp', 0.92);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // fallback to png
        }
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ShopLogoUploader: React.FC<ShopLogoUploaderProps> = ({
  currentLogoUrl,
  storeName = 'Dükkan',
  onLogoUpdated,
  className = '',
}) => {
  const [logoUrl, setLogoUrl] = useState<string | undefined>(currentLogoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialChar = (storeName || 'D').trim().charAt(0).toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Format kontrolü (PNG, JPEG, WEBP)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setStatusMessage({
        text: 'Lütfen geçerli bir PNG, JPEG veya WEBP formatında görsel seçiniz.',
        type: 'error',
      });
      return;
    }

    // Maksimum dosya boyutu kontrolü: 5 MB ham dosya
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        text: 'Seçilen görsel boyutu 5 MB üzerinde olamaz.',
        type: 'error',
      });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      // Otomatik 512x512 kare kırpma
      const squareDataUrl = await cropAndResizeToSquare(file, 512);

      const res = await fetch('/api/shop-profile/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: squareDataUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Logo yüklenemedi.');
      }

      setLogoUrl(data.logoUrl);
      if (onLogoUpdated) onLogoUpdated(data.logoUrl);
      setStatusMessage({ text: 'Dükkan logosu başarıyla güncellendi!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Logo yükleme hatası:', err);
      setStatusMessage({ text: err.message || 'Görsel yüklenirken bir hata oluştu.', type: 'error' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Dükkan profil fotoğrafını / logosunu kaldırmak istediğinize emin misiniz?')) {
      return;
    }

    setIsDeleting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/shop-profile/logo', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Logo silinemedi.');
      }

      setLogoUrl(undefined);
      if (onLogoUpdated) onLogoUpdated(undefined);
      setStatusMessage({ text: 'Logo kaldırıldı.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Silme işlemi başarısız.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Logo Önizleme Avtarı */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 flex items-center justify-center shadow-md shadow-stone-950/5 relative">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className="w-full h-full object-cover"
                onError={() => setLogoUrl(undefined)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-amber-500 to-orange-600 text-white font-black text-2xl sm:text-3xl shadow-inner">
                {initialChar}
              </div>
            )}

            {/* Yükleniyor Karartması */}
            {(isUploading || isDeleting) && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Kamera Butonu Rozeti */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-md border-2 border-white dark:border-stone-800 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            title="Fotoğraf Yükle"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bilgilendirme ve İşlem Butonları */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h4 className="text-sm font-black text-stone-900 dark:text-white">
              Dükkân Profil Fotoğrafı / Logo (PP)
            </h4>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
              Kare (1:1)
            </span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
            Yüklediğiniz logo online randevu sayfanızda (`/r/dükkan`), QR menünüzde (`/m/dükkan`) ve esnaf haritasında müşterilerinize vitrin olarak gösterilir.
          </p>

          {/* Butonlar */}
          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-black hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {logoUrl ? 'Logoyu Değiştir' : 'Fotoğraf / Logo Seç'}
            </button>

            {logoUrl && (
              <button
                type="button"
                onClick={handleDeleteLogo}
                disabled={isUploading || isDeleting}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Logoyu Kaldır
              </button>
            )}
          </div>

          {/* Durum Mesajı */}
          {statusMessage && (
            <div
              className={`mt-2.5 p-2 rounded-xl text-xs font-bold flex items-center justify-center sm:justify-start gap-1.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopLogoUploader;
