import React, { useEffect, useState } from 'react';
import {
  QrCode,
  Printer,
  X,
  ExternalLink,
  Wifi,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  CheckCircle2,
  Copy,
  BellRing,
} from 'lucide-react';
import { MenuItem, RestaurantTable } from '../../../shared/types.ts';

interface TableQrMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: RestaurantTable[];
  selectedTable?: RestaurantTable | null;
  restaurantName?: string;
  shopSlug?: string;
  shopLogoUrl?: string;
  menuItems?: MenuItem[];
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getShopInitials(name: string): string {
  const parts = String(name || 'DY')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'DY';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function resolveSafeMediaUrl(rawUrl?: string, makeAbsolute = false): string {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) {
    if (makeAbsolute && typeof window !== 'undefined') {
      return `${window.location.origin}${trimmed}`;
    }
    return trimmed;
  }
  return '';
}

const DEFAULT_MENU_ITEMS: Array<MenuItem & { desc?: string }> = [
  { id: 'def_1', name: 'Çaykur Rize Çay', price: 15, category: 'İçecekler', description: 'Taze demlenmiş geleneksel lezzet', isAvailable: true },
  { id: 'def_2', name: 'Közde Türk Kahvesi', price: 45, category: 'İçecekler', description: 'Lokum ve su ikramı ile', isAvailable: true },
  { id: 'def_3', name: 'Köy Yayık Ayranı', price: 30, category: 'İçecekler', description: 'Bol köpüklü soğuk servis', isAvailable: true },
  { id: 'def_4', name: 'Kaşarlı Karışık Tost', price: 75, category: 'Aperatif & Tost', description: 'Karaköy simit ekmeğinde bol kaşar ve sucuk', isAvailable: true },
  { id: 'def_5', name: 'Gözleme Porsiyon', price: 85, category: 'Aperatif & Tost', description: 'Patatesli, peynirli veya kıymalı el açması', isAvailable: true },
  { id: 'def_6', name: 'Izgara Köfte Porsiyon', price: 190, category: 'Ana Yemekler', description: 'Garnitür, lavaş ve közlenmiş biber ile', isAvailable: true },
  { id: 'def_7', name: 'Et Döner Dürüm Menü', price: 175, category: 'Ana Yemekler', description: 'Patates kızartması ve içecek ile', isAvailable: true },
  { id: 'def_8', name: 'Günün Çorbası (Mercimek / Kelle Paça)', price: 65, category: 'Çorbalar', description: 'Kıtır ekmek ve taze limonla', isAvailable: true },
  { id: 'def_9', name: 'Fırın Sütlaç', price: 75, category: 'Tatlılar', description: 'Fındık parçacıklı geleneksel lezzet', isAvailable: true },
];

export const TableQrMenuModal: React.FC<TableQrMenuModalProps> = ({
  isOpen,
  onClose,
  tables,
  selectedTable,
  restaurantName = 'Dükkanım Kafe & Restoran',
  shopSlug,
  shopLogoUrl,
  menuItems,
}) => {
  const [activeTableId, setActiveTableId] = useState<string>(
    selectedTable ? selectedTable.id : tables[0]?.id || 'genel'
  );
  const [activeTab, setActiveTab] = useState<'stand' | 'preview'>('stand');
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTableId(selectedTable ? selectedTable.id : tables[0]?.id || 'genel');
    }
  }, [isOpen, selectedTable, tables]);

  if (!isOpen) return null;

  const currentTable = tables.find((t) => t.id === activeTableId);
  const tableName = currentTable ? currentTable.name : 'Tüm Salon & Paket';
  const effectiveLogoUrl = resolveSafeMediaUrl(shopLogoUrl);
  const initials = getShopInitials(restaurantName);

  const menuUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/m/${encodeURIComponent(shopSlug || 'demo')}?masa=${encodeURIComponent(tableName)}`
      : `/m/${encodeURIComponent(shopSlug || 'demo')}?masa=${encodeURIComponent(tableName)}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&ecc=H&margin=8&data=${encodeURIComponent(
    menuUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const safeRestaurantName = escapeHtml(restaurantName || 'Dükkanım Kafe & Restoran');
    const safeTableName = escapeHtml(tableName);
    const safeMenuUrl = escapeHtml(menuUrl);
    const safeQrUrl = escapeHtml(qrImageUrl);
    const safeWifiName = escapeHtml(wifiName.trim());
    const safeWifiPassword = escapeHtml(wifiPassword.trim());
    const absoluteLogoUrl = resolveSafeMediaUrl(effectiveLogoUrl, true);
    const safeLogoUrl = absoluteLogoUrl ? escapeHtml(absoluteLogoUrl) : '';
    const safeInitials = escapeHtml(initials);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const topLogoHtml = safeLogoUrl
      ? `<div class="logo-wrap"><img id="qr-menu-logo-top" src="${safeLogoUrl}" alt="${safeRestaurantName}" /></div>`
      : `<div class="logo-fallback">${safeInitials}</div>`;

    const centerLogoHtml = safeLogoUrl
      ? `<div class="qr-center-badge"><img id="qr-menu-logo-center" src="${safeLogoUrl}" alt="${safeRestaurantName}" /></div>`
      : `<div class="qr-center-badge qr-center-initials">${safeInitials}</div>`;

    const wifiBlockHtml =
      safeWifiName || safeWifiPassword
        ? `
          <div class="wifi-box">
            ${safeWifiName ? `<span><strong>📶 Wi-Fi:</strong> ${safeWifiName}</span>` : ''}
            ${safeWifiPassword ? `<span><strong>🔑 Şifre:</strong> ${safeWifiPassword}</span>` : ''}
          </div>
        `
        : '';

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>${safeRestaurantName} - ${safeTableName} QR Menü Standı</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            body {
              background: #ffffff;
              color: #1c1917;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 95vh;
              padding: 12px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .cut-sheet {
              padding: 16px;
              border: 2px dashed #cbd5e1;
              border-radius: 36px;
              max-width: 560px;
              width: 100%;
              position: relative;
            }
            .cut-label {
              text-align: center;
              font-size: 10px;
              font-weight: 700;
              color: #94a3b8;
              letter-spacing: 0.8px;
              text-transform: uppercase;
              margin-bottom: 10px;
            }
            .stand-card {
              background: linear-gradient(180deg, #1c1917 0%, #292524 65%, #451a03 100%);
              color: #ffffff;
              border: 3px solid #f59e0b;
              border-radius: 28px;
              padding: 32px 28px 26px 28px;
              text-align: center;
            }
            .logo-wrap {
              width: 82px;
              height: 82px;
              margin: 0 auto 14px auto;
              border-radius: 22px;
              overflow: hidden;
              border: 3px solid #f59e0b;
              background: #ffffff;
              box-shadow: 0 8px 22px rgba(0,0,0,0.32);
            }
            .logo-wrap img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            }
            .logo-fallback {
              width: 78px;
              height: 78px;
              margin: 0 auto 14px auto;
              border-radius: 22px;
              background: linear-gradient(135deg, #f59e0b, #ea580c);
              color: #ffffff;
              font-size: 28px;
              font-weight: 900;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid rgba(255,255,255,0.28);
            }
            .badge {
              display: inline-block;
              padding: 6px 18px;
              border-radius: 9999px;
              background: rgba(245, 158, 11, 0.22);
              border: 1px solid rgba(245, 158, 11, 0.45);
              color: #fcd34d;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 1.6px;
              text-transform: uppercase;
              margin-bottom: 12px;
            }
            .title {
              font-size: 28px;
              font-weight: 900;
              color: #ffffff;
              line-height: 1.2;
              margin-bottom: 10px;
            }
            .table-pill {
              display: inline-block;
              background: #ffffff;
              color: #0c0a09;
              font-size: 14px;
              font-weight: 900;
              padding: 7px 20px;
              border-radius: 14px;
              margin-bottom: 20px;
              letter-spacing: 0.6px;
            }
            .qr-frame {
              position: relative;
              width: 248px;
              height: 248px;
              margin: 0 auto 18px auto;
              padding: 14px;
              background: #ffffff;
              border-radius: 24px;
              border: 3px solid #f59e0b;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-frame > img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              display: block;
            }
            .qr-center-badge {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 50px;
              height: 50px;
              border-radius: 14px;
              background: #ffffff;
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(0,0,0,0.28);
              overflow: hidden;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-center-badge img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
              border-radius: 10px;
            }
            .qr-center-initials {
              background: #1c1917;
              color: #f59e0b;
              font-size: 15px;
              font-weight: 900;
            }
            .scan-hint {
              font-size: 15px;
              font-weight: 800;
              color: #fde68a;
              margin-bottom: 4px;
            }
            .scan-sub {
              font-size: 12px;
              color: #d6d3d1;
              margin-bottom: 16px;
            }
            .wifi-box {
              display: flex;
              justify-content: center;
              gap: 18px;
              flex-wrap: wrap;
              background: rgba(255,255,255,0.08);
              border: 1px solid rgba(255,255,255,0.16);
              border-radius: 14px;
              padding: 10px 14px;
              font-size: 12px;
              color: #fcd34d;
              margin-bottom: 14px;
            }
            .link-box {
              background: rgba(0,0,0,0.28);
              border: 1px dashed rgba(255,255,255,0.24);
              border-radius: 12px;
              padding: 10px 12px;
              margin-bottom: 14px;
            }
            .link-label {
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #a8a29e;
              margin-bottom: 2px;
            }
            .link-url {
              font-size: 11px;
              font-weight: 700;
              color: #fde68a;
              word-break: break-all;
            }
            .brand-footer {
              font-size: 11px;
              font-weight: 700;
              color: #a8a29e;
              padding-top: 10px;
              border-top: 1px solid rgba(255,255,255,0.12);
            }
            .cut-bottom {
              margin-top: 10px;
              text-align: center;
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="cut-sheet">
            <div class="cut-label">✂️ Kesim Çizgisi · A4 / Masaüstü Akrilik Stand Çıktısı</div>
            <div class="stand-card">
              ${topLogoHtml}
              <div class="badge">✨ TEMASSIZ DİJİTAL MENÜ</div>
              <h1 class="title">${safeRestaurantName}</h1>
              <div class="table-pill">${safeTableName.toUpperCase()}</div>

              <div class="qr-frame">
                <img id="qr-menu-stand-image" src="${safeQrUrl}" alt="${safeTableName} QR Menü" />
                ${centerLogoHtml}
              </div>

              <p class="scan-hint">📷 Telefonunuzun kamerasını QR koda tutun</p>
              <p class="scan-sub">Fiyatları, tatlıları ve içecekleri menümüzden hemen inceleyin</p>

              ${wifiBlockHtml}

              <div class="link-box">
                <div class="link-label">Doğrudan Menü Bağlantısı</div>
                <div class="link-url">${safeMenuUrl}</div>
              </div>

              <div class="brand-footer">
                Dükkanım Yanımda · Akıllı Esnaf İşletim Sistemi
              </div>
            </div>
            <div class="cut-bottom">
              ✂️ Kesikli çizgiden kesip masa üstü akrilik standa yerleştirebilirsiniz.
            </div>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    let printed = false;
    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error('QR Menü yazdırma hatası:', err);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 250);
    };

    const images = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
    const pendingImages = images.filter((img) => !img.complete);
    if (pendingImages.length === 0) {
      triggerPrint();
      return;
    }

    let remaining = pendingImages.length;
    const onImageDone = () => {
      remaining -= 1;
      if (remaining <= 0) {
        triggerPrint();
      }
    };
    pendingImages.forEach((img) => {
      img.onload = onImageDone;
      img.onerror = onImageDone;
    });
    setTimeout(triggerPrint, 4500);
  };

  const previewItems: Array<MenuItem & { desc?: string }> =
    menuItems && menuItems.length > 0 ? menuItems : DEFAULT_MENU_ITEMS;
  const categories = Array.from(new Set(previewItems.map((item) => item.category || 'Genel')));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Üst Bar */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-orange-500 via-amber-500 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Masalara Özel QR Menü &amp; Standı
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                Müşterileriniz telefon kamerasıyla okutup dijital menünüzü anında incelesin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tablar */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('stand')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'stand'
                ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Masa Standı &amp; QR Yazdır
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Müşteri Gözünden Canlı Menü
          </button>
        </div>

        {/* İçerik */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'stand' ? (
            <div className="space-y-5">
              {/* Masa Seçici & Wi-Fi Bilgisi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/60 text-xs">
                <div>
                  <label className="block font-black text-stone-700 dark:text-stone-300 mb-1">
                    Hangi Masa İçin?
                  </label>
                  <select
                    value={activeTableId}
                    onChange={(e) => setActiveTableId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="genel">Tüm Salon &amp; Genel Menü</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-stone-400" /> Wi-Fi Adı (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    value={wifiName}
                    onChange={(e) => setWifiName(e.target.value)}
                    placeholder="Örn: Kafe_Misafir"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-700 dark:text-stone-300 mb-1">
                    Wi-Fi Şifresi
                  </label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="Örn: 12345678"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Baskıya Hazır Masa Standı Kartı */}
              <div className="flex justify-center">
                <div
                  id="printable-table-qr-card"
                  className="w-full max-w-sm rounded-3xl p-6 bg-linear-to-b from-stone-900 via-stone-900 to-amber-950 text-white text-center shadow-2xl border-2 border-amber-500/50 space-y-4 relative overflow-hidden"
                >
                  {/* Dekoratif Işık */}
                  <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

                  {/* Restoran Logosu & Başlığı */}
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      {effectiveLogoUrl ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400/70 bg-white shadow-lg">
                          <img
                            src={effectiveLogoUrl}
                            alt={restaurantName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-500 to-orange-600 text-white font-black text-lg flex items-center justify-center shadow-lg border border-amber-300/40">
                          {initials}
                        </div>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/30">
                      <Sparkles className="w-3 h-3" /> TEMASSIZ DİJİTAL MENÜ
                    </div>
                    <h3 className="text-lg font-black tracking-tight">{restaurantName}</h3>
                    <div className="inline-block px-3 py-1 rounded-xl bg-white text-stone-950 text-xs font-black shadow-sm mt-1">
                      {tableName.toUpperCase()}
                    </div>
                  </div>

                  {/* QR Kod Çerçevesi (Merkez Logolu &ecc=H) */}
                  <div className="relative p-3 bg-white rounded-2xl shadow-xl inline-block mx-auto">
                    <img
                      src={qrImageUrl}
                      alt={`${tableName} QR Menü`}
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                    />
                    {effectiveLogoUrl ? (
                      <div className="absolute inset-0 m-auto w-11 h-11 rounded-xl bg-white p-0.5 shadow-lg border-2 border-white overflow-hidden">
                        <img
                          src={effectiveLogoUrl}
                          alt={restaurantName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 m-auto w-10 h-10 rounded-xl bg-stone-900 text-amber-400 font-black text-xs flex items-center justify-center shadow-lg border-2 border-white">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Açıklama */}
                  <div className="space-y-1 text-xs text-stone-300 font-medium">
                    <p className="font-bold text-amber-200">
                      📷 Telefonunuzun kamerasını QR koda tutun
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Fiyatları, tatlıları ve içecekleri menümüzden hemen inceleyin
                    </p>
                  </div>

                  {/* Wi-Fi Bilgisi (varsa) */}
                  {(wifiName || wifiPassword) && (
                    <div className="pt-2 border-t border-white/10 text-[11px] flex items-center justify-around font-bold text-amber-300 bg-white/5 py-1.5 rounded-xl">
                      {wifiName && <span>📶 Wi-Fi: {wifiName}</span>}
                      {wifiPassword && <span>🔑 Şifre: {wifiPassword}</span>}
                    </div>
                  )}

                  <div className="text-[9px] text-stone-400 font-medium">
                    Dükkanım Yanımda · Akıllı Esnaf İşletim Sistemi
                  </div>
                </div>
              </div>

              {/* Hızlı Aksiyon Butonları */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-amber-500 hover:bg-amber-600 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  Masa Kartını Yazdır (A4 / Stand)
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all border border-stone-200 dark:border-stone-700 cursor-pointer"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? 'Bağlantı Kopyalandı!' : 'Menü Linkini Kopyala'}
                </button>
              </div>
            </div>
          ) : (
            /* Canlı Menü Müşteri Önizlemesi */
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                <span>📱 Müşterinin telefonunda açılacak canlı menü görünümü:</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[10px]">
                  {tableName}
                </span>
              </div>

              {/* Garson Çağır Butonu */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900 text-white shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                    <BellRing className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black">Masaya Garson Çağır</p>
                    <p className="text-[10px] text-stone-400">Tek dokunuşla ekibe bildirim gider</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWaiterCalled(true);
                    setTimeout(() => setWaiterCalled(false), 3000);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all cursor-pointer"
                >
                  {waiterCalled ? '✓ Çağrıldı!' : 'Zile Bas'}
                </button>
              </div>

              {/* Kategoriler ve Ürün Listesi */}
              <div className="space-y-4">
                {categories.map((cat) => (
                  <div key={cat} className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b border-stone-200 dark:border-stone-800 pb-1 flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5" />
                      {cat}
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {previewItems
                        .filter((i) => (i.category || 'Genel') === cat)
                        .map((item) => (
                          <div
                            key={item.id || item.name}
                            className={`p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/60 flex items-center justify-between ${
                              item.isAvailable === false ? 'opacity-60' : ''
                            }`}
                          >
                            <div>
                              <p className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                                <span>{item.name}</span>
                                {item.isAvailable === false && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                                    Tükendi
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                                {item.description || item.desc || 'Taze ve günlük lezzet'}
                              </p>
                            </div>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 ml-2 shrink-0">
                              ₺{item.price}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alt Kapat */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-stone-400 font-medium">
            Masa akrilik standına veya menü kapağına yapıştırılabilir
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-black hover:opacity-90 transition-opacity cursor-pointer"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
