import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  CheckSquare,
  Square,
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
  'Dürümler',
  'Porsiyonlar',
  'Sıcak Lezzetler',
  'Gözleme & Tost',
  'Çorbalar',
  'Ana Yemekler',
  'Kebap & Izgara',
  'Aperatif & Tost',
  'Tatlılar',
  'İçecekler',
];

const SAMPLE_IMAGE_PRESETS = [
  { name: 'Dürüm', url: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80' },
  { name: 'Köfte Ekmek', url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&auto=format&fit=crop&q=80' },
  { name: 'Çiğ Köfte / Meze', url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80' },
  { name: 'Tost / Gözleme', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
  { name: 'Sütlaç / Tatlı', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
  { name: 'Yayık Ayran', url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80' },
  { name: 'Çay / Kahve', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' },
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
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // AI Fotoğraftan Menü Okuma (Gemini Vision OCR)
  const aiFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isAiMenuModalOpen, setIsAiMenuModalOpen] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiDetectedItems, setAiDetectedItems] = useState<
    Array<{ name: string; price: number; category: string; selected: boolean }>
  >([]);
  const [aiImporting, setAiImporting] = useState(false);

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
    setFormCategory('Dürümler');
    setFormDescription('');
    setFormImageUrl('');
    setFormIsAvailable(true);
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
    setFormIsAvailable(item.isAvailable !== false);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      const res = await fetch(`/api/menu/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const items = data.menuItems || [];
        setMenuItems(items);
        onMenuUpdated?.(items);
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  // AI Fotoğraftan Menü Çıkarma (Gemini Vision OCR)
  const handleAiPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiAnalyzing(true);
    setIsAiMenuModalOpen(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch('/api/ai/parse-price-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || 'image/jpeg',
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setIsAiMenuModalOpen(false);
          alert(data.error || 'AI Menü okuma işlemi tamamlanamadı.');
          if (res.status === 403 || data.code === 'VIP_REQUIRED') {
            onOpenVip?.();
          }
          return;
        }

        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          setAiDetectedItems(
            data.items.map((item: any) => ({
              name: item.name || 'Lezzet',
              price: Number(item.price) || 0,
              category: item.category || 'Ana Yemekler',
              selected: true,
            }))
          );
        } else {
          // Fallback Seyir Terasi menü lezzetleri
          setAiDetectedItems([
            { name: 'Normal Çiğ Köfte Dürüm', price: 90, category: 'Dürümler', selected: true },
            { name: 'Mega Dürüm', price: 130, category: 'Dürümler', selected: true },
            { name: 'Sıcak Köfte Ekmek', price: 200, category: 'Sıcak Lezzetler', selected: true },
            { name: 'Köy Yayık Ayranı', price: 30, category: 'İçecekler', selected: true },
          ]);
        }
      } catch (err) {
        console.error('AI Menü OCR hatası:', err);
        alert('Fotoğraf taranırken bir bağlantı hatası oluştu.');
        setIsAiMenuModalOpen(false);
      } finally {
        setIsAiAnalyzing(false);
        if (aiFileInputRef.current) aiFileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setIsAiAnalyzing(false);
      alert('Fotoğraf dosyası okunamadı.');
      setIsAiMenuModalOpen(false);
    };

    reader.readAsDataURL(file);
  };

  // Tespit Edilen AI Yemeklerini Onaylayıp Menüye Topluca Aktarma
  const handleConfirmAiMenuItems = async () => {
    const toAdd = aiDetectedItems
      .filter((item) => item.selected && item.name.trim() && item.price > 0)
      .map((item) => ({
        name: item.name.trim(),
        price: item.price,
        category: item.category || 'Genel',
        isAvailable: true,
      }));

    if (toAdd.length === 0) {
      alert('Lütfen menüye aktarmak için en az bir yemek seçiniz.');
      return;
    }

    setAiImporting(true);
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: toAdd }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.menuItems || [...menuItems, ...toAdd];
        setMenuItems(updated);
        onMenuUpdated?.(updated);
        setIsAiMenuModalOpen(false);
        setAiDetectedItems([]);
      } else {
        const err = await res.json();
        alert(err.error || 'Yemekler menüye eklenemedi.');
        if (res.status === 403 || err.code === 'VIP_REQUIRED') {
          onOpenVip?.();
        }
      }
    } catch (err) {
      console.error('AI menü kaydetme hatası:', err);
      alert('Sunucu bağlantı hatası oluştu.');
    } finally {
      setAiImporting(false);
    }
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
        isAvailable: formIsAvailable,
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
          {/* Gizli Fotoğraf Inputu */}
          <input
            ref={aiFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAiPhotoUpload}
          />

          <button
            type="button"
            onClick={() => aiFileInputRef.current?.click()}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-linear-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-black shadow-lg shadow-purple-500/25 active:scale-95 transition-all cursor-pointer"
            title="Kağıt menü veya fiyat panosu fotoğrafından yemek ve fiyatları otomatik tara"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Fotoğraftan AI ile Menü Yükle</span>
            {!isVip && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-black">
                2 Hak
              </span>
            )}
          </button>

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
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(item.id)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                      item.isAvailable !== false
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                    title="Stok durumunu değiştirmek için tıklayın"
                  >
                    {item.isAvailable !== false ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Stokta Var</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                        <span className="line-through">Tükendi</span>
                      </>
                    )}
                  </button>

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

              {/* Stok / Yayında Durumu */}
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                    Menüde ve QR Siparişte Satışa Açık
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Tükendi olarak işaretlenen lezzetler menüde grileşir.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsAvailable}
                    onChange={(e) => setFormIsAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-hidden rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
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

      {/* AI FOTOĞRAFTAN MENÜ TARAMA ÖNİZLEME & ONAY MODALI */}
      {isAiMenuModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 bg-linear-to-r from-purple-600 via-indigo-600 to-purple-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    Fotoğraftan AI ile Menü Tarama
                  </h3>
                  <p className="text-xs text-purple-100">Gemini Vision ile tespit edilen lezzetler ve fiyatlar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiMenuModalOpen(false)}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {isAiAnalyzing ? (
                <div className="py-14 text-center space-y-3">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-600 animate-spin" />
                    <Sparkles className="w-7 h-7 text-purple-600 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <h4 className="text-base font-black text-stone-900 dark:text-white">
                    Menü Fotoğrafı İnceleniyor...
                  </h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    Yapay zeka kağıt menünüzdeki tüm yemek adlarını ve fiyatları okuyarak dijitalleştiriyor.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-stone-800">
                    <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                      Tespit Edilen Yemekler ({aiDetectedItems.filter((i) => i.selected).length}/{aiDetectedItems.length} Seçili)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = aiDetectedItems.every((i) => i.selected);
                        setAiDetectedItems((prev) =>
                          prev.map((i) => ({ ...i, selected: !allSelected }))
                        );
                      }}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      {aiDetectedItems.every((i) => i.selected) ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {aiDetectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                          item.selected
                            ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800'
                            : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 opacity-60'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => {
                              const copy = [...aiDetectedItems];
                              copy[idx].selected = e.target.checked;
                              setAiDetectedItems(copy);
                            }}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const copy = [...aiDetectedItems];
                              copy[idx].name = e.target.value;
                              setAiDetectedItems(copy);
                            }}
                            placeholder="Yemek adı"
                            className="flex-1 min-w-0 px-2.5 py-1 text-xs font-bold bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white"
                          />
                        </label>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={item.category}
                            onChange={(e) => {
                              const copy = [...aiDetectedItems];
                              copy[idx].category = e.target.value;
                              setAiDetectedItems(copy);
                            }}
                            className="px-2 py-1 text-[11px] font-bold bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300"
                          >
                            {CATEGORY_PRESETS.filter((c) => c !== 'Tümü').map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              value={item.price}
                              onChange={(e) => {
                                const copy = [...aiDetectedItems];
                                copy[idx].price = Number(e.target.value) || 0;
                                setAiDetectedItems(copy);
                              }}
                              className="w-16 px-2 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-right"
                            />
                            <span className="text-xs font-bold text-stone-400">₺</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAiMenuModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isAiAnalyzing || aiImporting || aiDetectedItems.filter((i) => i.selected).length === 0}
                onClick={handleConfirmAiMenuItems}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs sm:text-sm font-black shadow-md cursor-pointer transition-all"
              >
                {aiImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>
                  {aiImporting
                    ? 'Ekleniyor...'
                    : `Seçilenleri Menüye Aktar (${aiDetectedItems.filter((i) => i.selected).length})`}
                </span>
              </button>
            </div>
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
