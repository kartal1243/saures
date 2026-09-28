import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  X,
  Users,
  Trash2,
  Phone,
  Banknote,
  Briefcase,
  StickyNote,
  CalendarDays,
  ShieldOff,
  Plus,
  Check,
} from 'lucide-react';

interface StaffMember {
  id: string;
  ownerName: string;
  phone: string;
  role: string;
  createdAt: string;
  position?: string;
  salary?: number;
  staffNotes?: string;
  daysEmployed?: number;
  canLogin?: boolean;
}

const POSITIONS = ['Kasiyer', 'Usta', 'Kalfa', 'Çırak', 'Garson', 'Tezgahtar', 'Kurye', 'Temizlik', 'Muhasebe'];

const isRealPhone = (p: string) => /^0\d{10}$/.test(p);

export const StaffModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('Kasiyer');
  const [salary, setSalary] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
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
        body: JSON.stringify({ name, phone, position, salary, staffNotes }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data.error || 'Personel eklenemedi.');
      setName('');
      setPhone('');
      setPosition('Kasiyer');
      setSalary('');
      setStaffNotes('');
      setShowForm(false);
      loadStaff();
    } catch (err: any) {
      setError(err.message || 'Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const removeStaff = async (id: string) => {
    if (!confirm('Bu personeli silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/auth/staff/${id}`, { method: 'DELETE' });
      if (res.ok) loadStaff();
    } catch (e) {
      console.error('Personel silinemedi:', e);
    }
  };

  const totalSalary = staff.reduce((s, m) => s + (m.salary || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Başlık */}
        <div className="p-5 bg-linear-to-r from-slate-900 via-stone-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Personel Menüsü</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                {staff.length} kişi · Panele sadece patron girer
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer shrink-0" title="Kapat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Personel girişi yok bilgisi */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
            <ShieldOff className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 leading-relaxed">
              Personel bilgileri burada sadece <strong>siz</strong> görürsünüz. Personelin giriş şifresi yoktur —
              panele yalnızca dükkan sahibi girer. Kasa, stok ve müşteri kayıtları tek elden yürür.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Ekleme düğmesi / formu */}
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md transition-transform active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Personel Ekle
            </button>
          ) : (
            <form onSubmit={addStaff} className="space-y-3.5 p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
              <p className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-amber-500" /> Yeni Personel
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ad Soyad *"
                  className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefon (isteğe bağlı)"
                  className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="Aylık maaş ₺"
                    className="w-full px-3 py-2.5 pr-8 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">₺</span>
                </div>
              </div>
              <input
                type="text"
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                placeholder="Not (örn: haftasonu çalışır)"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {loading ? 'Ekleniyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          )}

          {/* Maaş özeti */}
          {staff.length > 0 && totalSalary > 0 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Banknote className="w-4 h-4" /> Aylık toplam maaş
              </span>
              <span className="text-base font-black text-emerald-900 dark:text-emerald-200">
                {totalSalary.toLocaleString('tr-TR')} ₺
              </span>
            </div>
          )}

          {/* Personel listesi */}
          <div className="space-y-2.5">
            <p className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              Kayıtlı Personel ({staff.length})
            </p>
            {staff.length === 0 ? (
              <p className="text-xs text-stone-500 dark:text-stone-400 text-center py-6">
                Henüz personel eklenmedi. Yukarıdan ilk personelinizi ekleyebilirsiniz.
              </p>
            ) : (
              staff.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-11 h-11 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-base font-black shrink-0">
                      {s.ownerName.charAt(0).toUpperCase()}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-stone-900 dark:text-white truncate">
                          {s.ownerName}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          <Briefcase className="w-3 h-3" /> {s.position || 'Kasiyer'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap mt-1.5">
                        {isRealPhone(s.phone) ? (
                          <a
                            href={`tel:${s.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <Phone className="w-3 h-3" /> {s.phone}
                          </a>
                        ) : (
                          s.phone && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                              <Phone className="w-3 h-3" /> {s.phone}
                            </span>
                          )
                        )}

                        {typeof s.salary === 'number' && s.salary > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                            <Banknote className="w-3 h-3" /> {s.salary.toLocaleString('tr-TR')} ₺/ay
                          </span>
                        )}

                        {typeof s.daysEmployed === 'number' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                            <CalendarDays className="w-3 h-3" /> {s.daysEmployed} gündür
                          </span>
                        )}
                      </div>

                      {s.staffNotes && (
                        <p className="mt-1.5 inline-flex items-start gap-1 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                          <StickyNote className="w-3 h-3 shrink-0 mt-0.5" /> {s.staffNotes}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeStaff(s.id)}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
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
