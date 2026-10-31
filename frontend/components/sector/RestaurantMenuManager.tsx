import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Check,
  X,
  ExternalLink,
  QrCode,
  Sparkles,
  Search,
  Filter,
  Eye,
  Loader2,
  DollarSign,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import { MenuItem, RestaurantTable } from '../../../shared/types.ts';
import { TableQrMenuModal } from './TableQrMenuModal';

interface RestaurantMenuManagerProps {
  tables?: RestaurantTable[];
  shopName?: string;
  slogan?: string;
  isVip?: boolean;
  onOpenVip?: () => void;
  onMenuUpdated?: (items: MenuItem[]) => void;
}

const CATEGORY_PRESETS = [
  'Tümü',
  'Çorbalar',
  'Ana Yemekler',
  'Kebap & Izgara',
  'Pide & Lahmacun',
  'Aperatif & Tost',
  'Salatalar',
  'Tatlılar',
  'Sıcak İçecekler',
  'Soğuk İçecekler',
];

const SAMPLE_IMAGE_PRESETS = [
  { name: 'Çorba', url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80' },
  { name: 'Köfte', url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&auto=format&fit=crop&q=80' },
  { name: 'Döner / Burger', url: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80' },
  { name: 'Tost', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
  { name: 'Tatlı', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
  { name: 'Kahve', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' },
  { name: 'Ayran / İçecek', url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80' },
];

export const RestaurantMenuManager: React.FC<RestaurantMenuManagerProps> = ({
  tables = [],
  shopName = 'Dükkânım Kafe & Restoran',
  slogan = 'Afiyet olsun',
  isVip = false,
  onOpenVip,
  onMenuUpdated,
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formCategory, setFormCategory] = useState('Ana Yemekler');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Fetch initial menu
  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        const items = data.menuItems || [];
        setMenuItems(items);
        setSlug(data.slug || '');
        onMenuUpdated?.(items);
      }
    } catch (err) {
      console.error('Menu load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const openAddForm = () => {
    setEditingItem(null);
    setFormName('');
    setFormPrice('');
    setFormCategory('Ana Yemekler');
    setFormDescription('');
    setFormImageUrl('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPrice(item.price);
    setFormCategory(item.category);
    setFormDescription(item.description || '');
    setFormImageUrl(item.imageUrl || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formPrice === '') {
      setFormError('Lütfen yemek adı ve fiyatını yazınız.');
      return;
    }

    setFormSaving(true);
    setFormError(null);
    try {
      const payload = {
        id: editingItem ? editingItem.id : undefined,
        name: formName.trim(),
        price: Number(formPrice),
        category: formCategory.trim(),
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
      };

      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const items = data.menuItems || [];
        setMenuItems(items);
        onMenuUpdated?.(items);
        setIsFormOpen(false);
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'Kaydedilemedi.');
      }
    } catch (err) {
      setFormError('Sunucu bağlantı hatası.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`"${name}" menüden silinsin mi?`)) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        const items = data.menuItems || [];
        setMenuItems(items);
        onMenuUpdated?.(items);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCat =
      selectedCategory === 'Tümü' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/m/${slug || 'restoran'}`
      : `/m/${slug || 'restoran'}`;

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Kartı & QR Bağlantı Çubuğu */}
      <div className="p-5 sm:p-6 bg-linear-to-r from-stone-900 via-stone-900 to-amber-950 text-white rounded-3xl border border-stone-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30">
            <QrCode className="w-3.5 h-3.5" /> DİJİTAL QR MENÜ SİSTEMİ
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            {shopName} Menü Yönetimi
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 font-medium">
            Yemeklerinizi ekleyin, resim ve fiyat belirleyin. Masalarınıza özel QR kod anında hazır!
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-stone-400">İşletmenizin Canlı QR Linki:</span>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 font-mono font-bold border border-white/15 transition-colors"
            >
              <span>{publicUrl}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              if (!isVip) {
                onOpenVip?.();
                return;
              }
              setIsQrModalOpen(true);
            }}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Masa QR Standı Çıkar</span>
            {!isVip && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black">
                <Crown className="w-3 h-3 text-yellow-200" /> VIP
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openAddForm}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Yeni Yemek Ekle
          </button>
        </div>
      </div>

      {/* Standart Plan / VIP Bilgilendirme Kartı */}
      {!isVip && (
        <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-yellow-100" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                  Ücretsiz Menü &amp; Adisyon: Fiyatları ve Yemekleri Sınırsız Yönetin
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-black">
                  Aktif
                </span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 font-medium mt-0.5">
                Burada eklediğiniz veya güncellediğiniz tüm yemekler ve fiyatlar masa adisyon sisteminizde anında görünür. Masalara özel karekodlu stand basmak için VIP Pakete geçebilirsiniz.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenVip}
            className="px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer shrink-0 inline-flex items-center gap-1.5 justify-center"
          >
            <Crown className="w-3.5 h-3.5 text-yellow-200" />
            Masa Standı İçin VIP'ye Geç
          </button>
        </div>
      )}

      {/* Arama ve Kategori Filtresi */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Arama */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Menüde yemek veya içecek ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm font-semibold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-colors shadow-xs"
          />
        </div>

        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 text-right">
          Toplam <b>{menuItems.length}</b> çeşit lezzet yayında
        </span>
      </div>

      {/* Kategori Barı */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_PRESETS.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-amber-400'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Yemek Listesi (Kart Grid) */}
      {loading ? (
        <div className="p-12 text-center text-stone-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          <span>Menü yükleniyor...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-800 text-center space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Bu kategoride henüz yemek yok.</p>
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-black shadow-xs"
          >
            <Plus className="w-4 h-4" /> İlk Yemeği Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Resim & Kategori */}
              <div className="relative h-44 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-600 bg-linear-to-br from-amber-50 to-stone-100 dark:from-stone-900 dark:to-stone-800">
                    <UtensilsCrossed className="w-12 h-12 stroke-[1.5]" />
                  </div>
                )}

                {/* Kategori Rozeti */}
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                  {item.category}
                </span>

                {/* Fiyat Rozeti */}
                <span className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-2xl bg-amber-500 text-white text-sm font-black shadow-lg shadow-amber-500/30">
                  ₺{item.price}
                </span>
              </div>

              {/* Bilgiler & Butonlar */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description || 'Porsiyon lezzet detayları.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Yayında
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      className="p-2 rounded-xl text-stone-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* YEMEK EKLE / DÜZENLE MODALI */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-lg border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 bg-linear-to-r from-orange-500 to-amber-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingItem ? 'Yemeği / İçeceği Düzenle' : 'Menüye Yeni Yemek Ekle'}
                  </h3>
                  <p className="text-xs text-amber-100">QR menüde müşterinin göreceği detaylar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Yemek Adı & Fiyat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Yemek / İçecek Adı *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Örn: İskender Kebap, Mercimek Çorbası..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    placeholder="190"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Kategori Seçimi */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Kategori *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {CATEGORY_PRESETS.filter((c) => c !== 'Tümü').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Açıklama / İçindekiler */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Porsiyon Notu / İçindekiler
                </label>
                <textarea
                  rows={2}
                  placeholder="Örn: Tereyağlı pide, domates sosu ve tava yoğurdu ile..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Resim URL & Hazır Şablonlar */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Yemek Görseli (URL)
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://... (veya aşağıdaki hazır resimlerden seçin)"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                {/* Hızlı Görsel Seçiciler */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-stone-400 font-medium">Hızlı hazır resimler:</span>
                  {SAMPLE_IMAGE_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setFormImageUrl(p.url)}
                      className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100 hover:text-amber-800 transition-colors text-[10px] font-bold"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Canlı Resim Önizleme */}
                {formImageUrl && (
                  <div className="mt-3 relative h-28 w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700">
                    <img
                      src={formImageUrl}
                      alt="Önizleme"
                      className="w-full h-full object-cover"
                      onError={() => {}}
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                      Canlı Önizleme
                    </span>
                  </div>
                )}
              </div>

              {/* Butonlar */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {formSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{formSaving ? 'Kaydediliyor...' : 'Yemeği Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      <TableQrMenuModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        tables={tables}
        restaurantName={shopName}
      />
    </div>
  );
};
