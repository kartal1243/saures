import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Search,
  BellRing,
  Receipt,
  Phone,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Share2,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Send,
} from 'lucide-react';
import { MenuItem } from '../../../shared/types.ts';

interface PublicMenuData {
  shopName: string;
  slogan: string;
  phone: string;
  cityDistrict: string;
  slug: string;
  logoUrl?: string;
  menuItems: MenuItem[];
  tables: Array<{ id: string; name: string }>;
}

export const PublicQrMenuView: React.FC = () => {
  const [data, setData] = useState<PublicMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'waiter' | 'bill' | 'order' | null>(null);
  const [cart, setCart] = useState<Array<{ item: MenuItem; quantity: number }>>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [isSendingOrder, setIsSendingOrder] = useState(false);

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = cart.reduce((sum, c) => sum + (Number(c.item.price) || 0) * c.quantity, 0);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id);
      if (idx >= 0) {
        return prev.map((c, i) => (i === idx ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item, quantity: 1 }];
    });
    showToast(`${item.name} sepete eklendi`);
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === itemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const handleSubmitOrder = async (tableOverride?: string) => {
    const activeTable = tableOverride || selectedTable;
    if (!activeTable) {
      setPendingAction('order');
      setIsTableModalOpen(true);
      return;
    }
    if (cart.length === 0) return;

    setIsSendingOrder(true);
    try {
      const res = await fetch(`/api/public/menu/${encodeURIComponent(data?.slug || getIdentifier())}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNo: activeTable,
          customerNote: customerNote.trim() || undefined,
          items: cart.map((c) => ({
            menuItemId: c.item.id,
            name: c.item.name,
            quantity: c.quantity,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Sipariş gönderilemedi.');
      }
      setCart([]);
      setCustomerNote('');
      setIsCartDrawerOpen(false);
      showToast(json.message || `${activeTable} siparişiniz mutfağa iletildi!`);
    } catch (err: any) {
      showToast(err.message || 'Sipariş gönderilirken hata oluştu.');
    } finally {
      setIsSendingOrder(false);
    }
  };

  // Parse identifier from URL: e.g. /m/bereket-pide or /menu?slug=bereket-pide
  const getIdentifier = (): string => {
    const path = window.location.pathname;
    const match = path.match(/^\/m\/(.+)/i);
    if (match && match[1]) return decodeURIComponent(match[1]);
    const params = new URLSearchParams(window.location.search);
    return params.get('slug') || params.get('shop') || 'demo';
  };

  const getTableFromUrl = (): string => {
    const params = new URLSearchParams(window.location.search);
    return params.get('masa') || params.get('table') || '';
  };

  useEffect(() => {
    const urlTable = getTableFromUrl();
    if (urlTable) setSelectedTable(urlTable);

    const id = getIdentifier();
    fetch(`/api/public/menu/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Menü bulunamadı veya henüz eklenmedi.');
        return res.json();
      })
      .then((json) => {
        setData(json);
        if (!urlTable && Array.isArray(json.tables) && json.tables.length === 1) {
          setSelectedTable(json.tables[0].name);
        }
      })
      .catch((err) => {
        setError(err.message || 'Menü yüklenemedi.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleTableAction = async (action: 'waiter' | 'bill', tableToUse?: string) => {
    const activeTable = tableToUse || selectedTable;
    if (!activeTable) {
      setPendingAction(action);
      setIsTableModalOpen(true);
      return;
    }

    const actionText = action === 'waiter' ? 'Garson çağrısı personele iletildi 🔔' : 'Hesap talebi kasaya iletildi 💳';
    showToast(`${activeTable} için ${actionText}`);

    try {
      await fetch(`/api/public/menu/${encodeURIComponent(data?.slug || getIdentifier())}/table-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNo: activeTable, action }),
      });
    } catch (e) {
      console.error('Table action error:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-bold text-stone-300">Menü Hazırlanıyor…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black">Menüye Ulaşılamadı</h2>
        <p className="text-xs text-stone-400 mt-2 max-w-xs">
          {error || 'Lütfen masadaki QR kodu tekrar okutunuz.'}
        </p>
        <a
          href="/"
          className="mt-6 px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-black text-xs"
        >
          Ana Sayfaya Git
        </a>
      </div>
    );
  }

  const items = data.menuItems || [];
  const identifier = data.slug || getIdentifier();
  const categories = ['Tümü', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesCat =
      selectedCategory === 'Tümü' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0F172A] text-stone-900 dark:text-stone-100 font-sans pb-28">
      {/* Toast Bildirim */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-amber-500 text-white text-xs font-black shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Üst Restoran Başlık Banner */}
      <div className="relative bg-linear-to-b from-stone-900 via-stone-900 to-[#1e293b] text-white px-5 pt-8 pb-10 rounded-b-[2.5rem] shadow-xl overflow-hidden">
        {/* Dekoratif Işık Hüzmesi */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] font-black uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" /> DİJİTAL MENÜ
            </span>

            {selectedTable ? (
              <button
                type="button"
                onClick={() => setIsTableModalOpen(true)}
                className="px-3.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1"
                title="Masayı değiştirmek için tıklayın"
              >
                <span>{selectedTable.toUpperCase()}</span>
                <span className="text-[10px] opacity-70">✎</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsTableModalOpen(true)}
                className="px-3.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Masa Seç</span>
                <span className="text-[10px]">▼</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3.5 pt-1">
            {data.logoUrl ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white p-1 border-2 border-amber-500/40 shadow-xl shrink-0">
                <img src={data.logoUrl} alt={data.shopName} className="w-full h-full object-cover rounded-xl" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl shrink-0 shadow-md">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate">{data.shopName}</h1>
              <p className="text-xs sm:text-sm text-stone-300 font-medium mt-0.5 line-clamp-1">
                {data.slogan || 'Geleneksel ve taze lezzetler'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-stone-400">
            {data.cityDistrict && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {data.cityDistrict}
              </span>
            )}
            {data.phone && (
              <a
                href={`tel:${data.phone}`}
                className="flex items-center gap-1 text-amber-300 font-bold hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                {data.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-5 space-y-4">
        {/* Arama Çubuğu */}
        <div className="relative shadow-lg rounded-2xl overflow-hidden">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Yemek veya içecek ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-800 border-none text-sm font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Yatay Kategori Çubuğu (Swipeable) */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-105'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700 hover:border-amber-400'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Yemek Kartları */}
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center text-stone-400 space-y-2">
            <UtensilsCrossed className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-xs font-bold">Aradığınız kriterde lezzet bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isAvailable = item.isAvailable !== false;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 relative ${
                    !isAvailable ? 'opacity-65' : ''
                  }`}
                >
                  {/* Resim */}
                  <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-2xl bg-stone-100 dark:bg-stone-800 shrink-0 overflow-hidden relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-600">
                        <UtensilsCrossed className="w-8 h-8 stroke-[1.5]" />
                      </div>
                    )}
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white">
                          Tükendi
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bilgiler */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                        {item.category}
                      </span>
                      <span className={`text-sm font-black ${isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 line-through'}`}>
                        ₺{item.price}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-stone-900 dark:text-white truncate">
                      {item.name}
                    </h3>

                    <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {item.description || 'Geleneksel sunum ve taze lezzet.'}
                    </p>

                    {isAvailable && (
                      <div className="pt-1.5 flex items-center justify-end">
                        {(() => {
                          const inCart = cart.find((c) => c.item.id === item.id);
                          if (inCart) {
                            return (
                              <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 px-2 py-1">
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(item.id, -1)}
                                  className="w-6 h-6 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-white flex items-center justify-center cursor-pointer shadow-2xs"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs font-black text-amber-700 dark:text-amber-300 min-w-[16px] text-center">
                                  {inCart.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(item.id, 1)}
                                  className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center cursor-pointer shadow-2xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black shadow-xs transition-all cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Sepete Ekle</span>
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Viral Branding Footer */}
        {(data as any).brandingRequired !== false && (
          <div className="py-6 pb-24 text-center">
            <a
              href="https://dukkanimyanimda.com.tr/?utm_source=qr_menu&utm_medium=viral_footer"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs font-bold border border-stone-200 dark:border-stone-700 transition-colors shadow-2xs"
            >
              <span>⚡ Dükkânım Yanımda ile oluşturuldu — Ücretsiz Dene</span>
            </a>
          </div>
        )}
      </div>

      {/* Sabit Alt Çubuk: Canlı Sepet + Garson Çağır & Hesap İste */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 p-3 sm:p-4 shadow-2xl">
        <div className="max-w-xl mx-auto space-y-2">
          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Canlı Sepet ({cartCount} Ürün) • Sipariş Gönder</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-xl bg-white/20 text-white font-black">
                ₺{cartTotal.toLocaleString('tr-TR')}
              </span>
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleTableAction('waiter')}
              className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <BellRing className="w-4 h-4 animate-bounce" />
              <span>Garson Çağır</span>
            </button>

            <button
              type="button"
              onClick={() => handleTableAction('bill')}
              className="flex-1 py-3 px-4 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
            >
              <Receipt className="w-4 h-4" />
              <span>Hesap İste</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canlı Sepet & Sipariş Gönder Çekmecesi */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white">Masa Sipariş Sepeti</h3>
                  <p className="text-[11px] text-stone-500">
                    {selectedTable ? `Seçili Masa: ${selectedTable}` : 'Göndermeden önce masa seçiniz'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {cart.map(({ item, quantity }) => (
                <div key={item.id} className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-stone-900 dark:text-white truncate">{item.name}</div>
                    <div className="text-[11px] text-emerald-600 font-bold">
                      ₺{item.price} x {quantity} = ₺{(Number(item.price) * quantity).toLocaleString('tr-TR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-black w-5 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.id, -quantity)}
                      className="p-1.5 text-stone-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
              {!selectedTable && (data?.tables || []).length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">Masa Seçin *</label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                  >
                    <option value="">Masa seçiniz...</option>
                    {(data?.tables || []).map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <input
                type="text"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Mutfak notu (Örn: Acısız, soğansız, az şekerli)..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
              />
              <div className="flex items-center justify-between text-sm font-black">
                <span>Toplam Tutar:</span>
                <span className="text-emerald-600">₺{cartTotal.toLocaleString('tr-TR')}</span>
              </div>
              <button
                type="button"
                disabled={isSendingOrder || cart.length === 0}
                onClick={() => handleSubmitOrder()}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isSendingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isSendingOrder ? 'Gönderiliyor...' : 'Siparişi Mutfağa Gönder'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Masa Seçim Modalı */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-sm border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-stone-900 dark:text-white">
              Hangi Masadasınız?
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Garson veya hesap talebinizin kasanıza doğru masadan iletilmesi için lütfen masanızı seçin.
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-0.5">
              {(data?.tables || []).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTable(t.name);
                    setIsTableModalOpen(false);
                    if (pendingAction === 'order') {
                      handleSubmitOrder(t.name);
                      setPendingAction(null);
                    } else if (pendingAction) {
                      handleTableAction(pendingAction, t.name);
                      setPendingAction(null);
                    }
                  }}
                  className={`p-3 rounded-2xl font-black text-xs border text-center transition-all cursor-pointer ${
                    selectedTable === t.name
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                      : 'bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsTableModalOpen(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-800"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
