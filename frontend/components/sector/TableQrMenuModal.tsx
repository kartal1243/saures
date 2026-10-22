import React, { useState } from 'react';
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
import { RestaurantTable } from '../../../shared/types.ts';

interface TableQrMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: RestaurantTable[];
  selectedTable?: RestaurantTable | null;
  restaurantName?: string;
}

const DEFAULT_MENU_ITEMS = [
  { name: 'Çaykur Rize Çay', price: 15, category: 'İçecekler', desc: 'Taze demlenmiş geleneksel lezzet' },
  { name: 'Közde Türk Kahvesi', price: 45, category: 'İçecekler', desc: 'Lokum ve su ikramı ile' },
  { name: 'Köy Yayık Ayranı', price: 30, category: 'İçecekler', desc: 'Bol köpüklü soğuk servis' },
  { name: 'Kaşarlı Karışık Tost', price: 75, category: 'Aperatif & Tost', desc: 'Karaköy simit ekmeğinde bol kaşar ve sucuk' },
  { name: 'Gözleme Porsiyon', price: 85, category: 'Aperatif & Tost', desc: 'Patatesli, peynirli veya kıymalı el açması' },
  { name: 'Izgara Köfte Porsiyon', price: 190, category: 'Ana Yemekler', desc: 'Garnitür, lavaş ve közlenmiş biber ile' },
  { name: 'Et Döner Dürüm Menü', price: 175, category: 'Ana Yemekler', desc: 'Patates kızartması ve içecek ile' },
  { name: 'Günün Çorbası (Mercimek / Kelle Paça)', price: 65, category: 'Çorbalar', desc: 'Kıtır ekmek ve taze limonla' },
  { name: 'Fırın Sütlaç', price: 75, category: 'Tatlılar', desc: 'Fındık parçacıklı geleneksel lezzet' },
];

export const TableQrMenuModal: React.FC<TableQrMenuModalProps> = ({
  isOpen,
  onClose,
  tables,
  selectedTable,
  restaurantName = 'Dükkânım Kafe & Restoran',
}) => {
  const [activeTableId, setActiveTableId] = useState<string>(
    selectedTable ? selectedTable.id : tables[0]?.id || 'genel'
  );
  const [activeTab, setActiveTab] = useState<'stand' | 'preview'>('stand');
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);

  if (!isOpen) return null;

  const currentTable = tables.find((t) => t.id === activeTableId);
  const tableName = currentTable ? currentTable.name : 'Tüm Salon & Paket';

  const menuUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/menu?masa=${encodeURIComponent(tableName)}`
      : `/menu?masa=${encodeURIComponent(tableName)}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(
    menuUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const categories = Array.from(new Set(DEFAULT_MENU_ITEMS.map((item) => item.category)));

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

                  {/* Restoran Başlığı */}
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/30">
                      <Sparkles className="w-3 h-3" /> TEMASSIZ DİJİTAL MENÜ
                    </div>
                    <h3 className="text-lg font-black tracking-tight">{restaurantName}</h3>
                    <div className="inline-block px-3 py-1 rounded-xl bg-white text-stone-950 text-xs font-black shadow-sm mt-1">
                      {tableName.toUpperCase()}
                    </div>
                  </div>

                  {/* QR Kod Çerçevesi */}
                  <div className="p-3 bg-white rounded-2xl shadow-xl inline-block mx-auto">
                    <img
                      src={qrImageUrl}
                      alt={`${tableName} QR Menü`}
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                    />
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
                    dükkanımyanımda.com.tr · Akıllı Esnaf İşletim Sistemi
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
                      {DEFAULT_MENU_ITEMS.filter((i) => i.category === cat).map((item) => (
                        <div
                          key={item.name}
                          className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/60 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-black text-stone-900 dark:text-white">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                              {item.desc}
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
