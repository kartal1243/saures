import React, { useState } from 'react';
import { Scissors, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import type { ServiceItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

// Dükkanın hizmet listesi boşsa gösterilen hazır tarife (sadece berber)
export const DEFAULT_SERVICES: { name: string; price: number }[] = [
  { name: 'Saç Kesimi', price: 300 },
  { name: 'Sakal Tıraşı', price: 150 },
  { name: 'Saç + Sakal', price: 400 },
  { name: 'Saç Yıkama & Fön', price: 200 },
  { name: 'Cilt Bakımı', price: 500 },
  { name: 'Damat Tıraşı', price: 750 },
];

interface ServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItem[];
  onSave: (data: { id?: string; name: string; price: number }) => Promise<void>;
  onDelete: (id: string) => void;
}

export const ServicesModal: React.FC<ServicesModalProps> = ({
  isOpen,
  onClose,
  services,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const startEdit = (s: ServiceItem) => {
    setEditingId(s.id);
    setName(s.name);
    setPrice(String(s.price));
    setError(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = Number(price);
    if (!name.trim()) {
      setError('Hizmet adı yazınız.');
      return;
    }
    if (!numPrice || numPrice <= 0) {
      setError('Geçerli bir fiyat giriniz.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({ id: editingId || undefined, name: name.trim(), price: numPrice });
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        <div className="p-5 bg-linear-to-r from-indigo-600 to-violet-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Hizmet / Koltuk Tarifeleri</h2>
              <p className="text-xs text-indigo-100">Para Al ekranında tek tıkla satış yapılır</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer" title="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Sakal Tıraşı"
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              min="1"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="₺"
              className="w-24 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title={editingId ? 'Güncelle' : 'Ekle'}
            >
              {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-3 py-2.5 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer shrink-0">
                Vazgeç
              </button>
            )}
          </form>

          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {services.length === 0 && (
              <li className="py-4 text-center text-xs font-semibold text-stone-400">
                Henüz tarife yok — hazır liste Para Al ekranında görünür, buradan kendi fiyatlarını ekleyebilirsin.
              </li>
            )}
            {services.map((s) => (
              <li key={s.id} className="py-2.5 flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-stone-800 dark:text-stone-100 truncate">{s.name}</span>
                  <span className="block text-xs font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(s.price)}</span>
                </span>
                <span className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => startEdit(s)} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors cursor-pointer" title="Düzenle">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => onDelete(s.id)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-colors cursor-pointer" title="Sil">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
