import React, { useState, useEffect } from 'react';
import { UserPlus, X, Users, Trash2, ShieldCheck } from 'lucide-react';

interface StaffMember {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({ isOpen, onClose }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStaff = async () => {
    try {
      const res = await fetch('/api/auth/staff');
      if (!res.ok) return;
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (e) {
      console.error('Personel listesi yüklenemedi:', e);
    }
  };

  useEffect(() => {
    if (isOpen) loadStaff();
  }, [isOpen]);

  if (!isOpen) return null;

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/add-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = await res.json().catch(() => ({}) as any);
      if (!res.ok) throw new Error(data.error || 'Personel eklenemedi.');
      setName('');
      setPhone('');
      setPassword('');
      loadStaff();
    } catch (err: any) {
      setError(err.message || 'Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const removeStaff = async (id: string) => {
    if (!confirm('Bu personeli ve oturumlarını silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/auth/staff/${id}`, { method: 'DELETE' });
      if (res.ok) loadStaff();
    } catch (e) {
      console.error('Personel silinemedi:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-lg border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        <div className="p-5 bg-linear-to-r from-slate-900 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Personel (Kasiyer) Yönetimi</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Kasiyerler satış ve gün sonu yapabilir; dükkan ayarları size özeldir
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer" title="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={addStaff} className="space-y-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
            <p className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-amber-500" /> Yeni Kasiyer Ekle
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ad Soyad"
                className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="Telefon"
                className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
                placeholder="Şifre (4+)"
                className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Ekleniyor...' : 'Kasiyer Ekle'}
            </button>
          </form>

          <div className="space-y-2">
            <p className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              Kayıtlı Personel ({staff.length})
            </p>
            {staff.length === 0 ? (
              <p className="text-xs text-stone-500 dark:text-stone-400 text-center py-4">
                Henüz kasiyer eklenmedi. Yukarıdan ilk personelinizi ekleyebilirsiniz.
              </p>
            ) : (
              staff.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-amber-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                      {s.ownerName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900 dark:text-white truncate">{s.ownerName}</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">{s.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                      <ShieldCheck className="w-3 h-3" /> Kasiyer
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStaff(s.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Personeli sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
