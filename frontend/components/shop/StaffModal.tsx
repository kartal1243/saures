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
  Pencil,
  Percent,
} from 'lucide-react';

interface StaffMember {
  id: string;
  ownerName: string;
  phone: string;
  role: string;
  createdAt: string;
  position?: string;
  salary?: number;
  commissionRate?: number;
  staffNotes?: string;
  daysEmployed?: number;
  canLogin?: boolean;
}

type PaymentCategory = 'Personel Maaş' | 'Personel Avans' | 'Personel Primi';
type StaffPayMethod = 'nakit' | 'kart' | 'havale';

const POSITIONS = ['Kasiyer', 'Usta', 'Kalfa', 'Çırak', 'Garson', 'Tezgahtar', 'Kurye', 'Temizlik', 'Muhasebe'];
const PAYMENT_CATEGORIES: { value: PaymentCategory; label: string }[] = [
  { value: 'Personel Maaş', label: 'Maaş' },
  { value: 'Personel Avans', label: 'Avans' },
  { value: 'Personel Primi', label: 'Prim' },
];
const PAYMENT_METHODS: { value: StaffPayMethod; label: string }[] = [
  { value: 'nakit', label: 'Nakit' },
  { value: 'kart', label: 'Kart / POS' },
  { value: 'havale', label: 'Havale / FAST' },
];

const isRealPhone = (p: string) => /^0\d{10}$/.test(String(p || '').replace(/\D/g, ''));

function clampCommission(val: string): number | undefined {
  if (val.trim() === '') return undefined;
  const num = Number(val);
  if (Number.isNaN(num)) return undefined;
  return Math.min(100, Math.max(0, num));
}

export const StaffModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Yeni personel ekleme formu
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('Kasiyer');
  const [salary, setSalary] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [staffNotes, setStaffNotes] = useState('');

  // Satır içi düzenleme durumu
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPosition, setEditPosition] = useState('Kasiyer');
  const [editSalary, setEditSalary] = useState('');
  const [editCommissionRate, setEditCommissionRate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  // Satır içi gelişmiş ödeme kutusu (Maaş / Avans / Prim)
  const [payBoxStaffId, setPayBoxStaffId] = useState<string | null>(null);
  const [payCategory, setPayCategory] = useState<PaymentCategory>('Personel Maaş');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<StaffPayMethod>('nakit');
  const [payNote, setPayNote] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [salaryMsg, setSalaryMsg] = useState<string | null>(null);
  const [payingStaffId, setPayingStaffId] = useState<string | null>(null);
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
    if (isOpen) {
      setError(null);
      setEditingId(null);
      setPayBoxStaffId(null);
      loadStaff();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const parsedCommission = clampCommission(commissionRate);
      const res = await fetch('/api/auth/add-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          position,
          salary,
          commissionRate: parsedCommission,
          staffNotes,
        }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data.error || 'Personel eklenemedi.');
      setName('');
      setPhone('');
      setPosition('Kasiyer');
      setSalary('');
      setCommissionRate('');
      setStaffNotes('');
      setShowForm(false);
      setSalaryMsg(`✅ ${data.account?.ownerName || name} personel listesine eklendi.`);
      setTimeout(() => setSalaryMsg(null), 4000);
      loadStaff();
    } catch (err: any) {
      setError(err.message || 'Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const openEditStaff = (member: StaffMember) => {
    setError(null);
    setPayBoxStaffId(null);
    setEditingId(member.id);
    setEditName(member.ownerName || '');
    setEditPhone(member.phone || '');
    setEditPosition(member.position || 'Kasiyer');
    setEditSalary(typeof member.salary === 'number' && member.salary > 0 ? String(member.salary) : '');
    setEditCommissionRate(typeof member.commissionRate === 'number' ? String(member.commissionRate) : '');
    setEditNotes(member.staffNotes || '');
  };

  const saveEditStaff = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setError(null);
    setSavingEditId(id);
    try {
      const parsedSalary = editSalary.trim() === '' ? null : Math.max(0, Number(editSalary));
      const parsedCommission = editCommissionRate.trim() === '' ? null : (clampCommission(editCommissionRate) ?? null);
      const res = await fetch(`/api/auth/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          position: editPosition,
          salary: parsedSalary,
          commissionRate: parsedCommission,
          staffNotes: editNotes.trim(),
        }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data.error || 'Personel bilgileri güncellenemedi.');
      setEditingId(null);
      setSalaryMsg(`✅ ${editName.trim()} bilgileri güncellendi.`);
      setTimeout(() => setSalaryMsg(null), 4000);
      loadStaff();
    } catch (err: any) {
      setError(err.message || 'Personel güncellenirken hata oluştu.');
    } finally {
      setSavingEditId(null);
    }
  };

  const removeStaff = async (id: string) => {
    if (!confirm('Bu personeli silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/auth/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (editingId === id) setEditingId(null);
        if (payBoxStaffId === id) setPayBoxStaffId(null);
        loadStaff();
      }
    } catch (e) {
      console.error('Personel silinemedi:', e);
    }
  };

  const togglePayBox = (member: StaffMember) => {
    setError(null);
    setEditingId(null);
    if (payBoxStaffId === member.id) {
      setPayBoxStaffId(null);
      return;
    }
    const defaultCategory: PaymentCategory =
      typeof member.salary === 'number' && member.salary > 0
        ? 'Personel Maaş'
        : typeof member.commissionRate === 'number' && member.commissionRate > 0
        ? 'Personel Primi'
        : 'Personel Avans';

    setPayBoxStaffId(member.id);
    setPayCategory(defaultCategory);
    setPayAmount(typeof member.salary === 'number' && member.salary > 0 ? String(member.salary) : '');
    setPayMethod('nakit');
    setPayNote('');
  };

  const submitStaffPayment = async (e: React.FormEvent, member: StaffMember) => {
    e.preventDefault();
    const amount = Number(payAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Lütfen 0’dan büyük geçerli bir ödeme tutarı giriniz.');
      return;
    }
    setPayingStaffId(member.id);
    setError(null);
    setSalaryMsg(null);
    try {
      const trimmedNote = payNote.trim();
      const description = `${payCategory}: ${member.ownerName}${member.position ? ` (${member.position})` : ''}${
        trimmedNote ? ` — ${trimmedNote}` : ''
      }`;
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: '',
          customerName: member.ownerName,
          type: 'gider',
          amount,
          paymentMethod: payMethod,
          category: payCategory,
          description,
        }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data.error || 'Ödeme gideri kaydedilemedi.');
      setPayBoxStaffId(null);
      setPayNote('');
      setSalaryMsg(
        `✅ ${member.ownerName} için ${amount.toLocaleString('tr-TR')} ₺ (${payCategory} · ${payMethod.toUpperCase()}) kasaya gider yazıldı.`
      );
      setTimeout(() => setSalaryMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Ödeme gideri işlenemedi.');
    } finally {
      setPayingStaffId(null);
    }
  };

  const totalSalary = staff.reduce((s, m) => s + (Number(m.salary) || 0), 0);
  const commissionMembers = staff.filter((m) => typeof m.commissionRate === 'number' && m.commissionRate > 0);
  const avgCommissionRate =
    commissionMembers.length > 0
      ? Math.round(
          (commissionMembers.reduce((s, m) => s + (m.commissionRate || 0), 0) / commissionMembers.length) * 10
        ) / 10
      : null;

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
              <h2 className="text-lg font-black tracking-tight">Personel &amp; Prim Yönetimi</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                {staff.length} kişi · Panele sadece patron girer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer shrink-0"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Personel girişi yok bilgisi */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
            <ShieldOff className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 leading-relaxed">
              Personel bilgileri burada sadece <strong>siz</strong> görürsünüz. Personelin giriş şifresi yoktur —
              panele yalnızca dükkan sahibi girer. Maaş, avans ve prim ödemeleri doğrudan kasa giderine yazılır.
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
              onClick={() => {
                setError(null);
                setShowForm(true);
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md transition-transform active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Personel Ekle
            </button>
          ) : (
            <form
              onSubmit={addStaff}
              className="space-y-3.5 p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700"
            >
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
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="Telefon (05XX...) *"
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
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="Prim Oranı (%)"
                    className="w-full px-3 py-2.5 pr-8 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">%</span>
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

          {/* Başarı / Maaş özeti */}
          {salaryMsg && (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-black text-emerald-700 dark:text-emerald-300">
              {salaryMsg}
            </div>
          )}

          {staff.length > 0 && (totalSalary > 0 || avgCommissionRate !== null) && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Aylık toplam maaş:
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-900 dark:text-emerald-200">
                  {totalSalary.toLocaleString('tr-TR')} ₺
                </span>
              </div>
              {avgCommissionRate !== null && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300/70 dark:border-amber-800 text-xs font-black text-amber-800 dark:text-amber-300">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Ortalama Prim: %{avgCommissionRate}</span>
                </div>
              )}
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
              staff.map((s) => {
                const isEditing = editingId === s.id;
                const isPaying = payBoxStaffId === s.id;
                const positionOptions = POSITIONS.includes(s.position || 'Kasiyer')
                  ? POSITIONS
                  : [s.position!, ...POSITIONS];

                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
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
                            {typeof s.commissionRate === 'number' && s.commissionRate > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                                <Percent className="w-2.5 h-2.5" />%{s.commissionRate} Prim
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 flex-wrap mt-1.5">
                            {isRealPhone(s.phone) ? (
                              <a
                                href={`tel:${s.phone.replace(/\s+/g, '')}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                title="Personeli Ara"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{s.phone}</span>
                                <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-[10px] font-black">
                                  Ara
                                </span>
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
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                        <button
                          type="button"
                          onClick={() => togglePayBox(s)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors ${
                            isPaying
                              ? 'bg-emerald-700 text-white ring-2 ring-emerald-400/50'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                          title="Maaş, Avans veya Prim Öde"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Maaş / Avans / Prim</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => (isEditing ? setEditingId(null) : openEditStaff(s))}
                          className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                            isEditing
                              ? 'bg-amber-500 text-white'
                              : 'text-stone-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          }`}
                          title="Personeli düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
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

                    {/* Satır İçi Düzenleme Formu */}
                    {isEditing && (
                      <form
                        onSubmit={(e) => saveEditStaff(e, s.id)}
                        className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800/70 space-y-2.5"
                      >
                        <p className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Pencil className="w-3 h-3" /> Personel Bilgilerini Düzenle
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Ad Soyad *"
                            className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                          />
                          <select
                            value={editPosition}
                            onChange={(e) => setEditPosition(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                          >
                            {positionOptions.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="Telefon (05XX...)"
                            className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                          />
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={editSalary}
                              onChange={(e) => setEditSalary(e.target.value)}
                              placeholder="Aylık maaş ₺"
                              className="w-full px-3 py-2 pr-7 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">
                              ₺
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={editCommissionRate}
                              onChange={(e) => setEditCommissionRate(e.target.value)}
                              placeholder="Prim %"
                              className="w-full px-3 py-2 pr-7 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">
                              %
                            </span>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Not (isteğe bağlı)"
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                          >
                            Vazgeç
                          </button>
                          <button
                            type="submit"
                            disabled={savingEditId === s.id}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-black cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{savingEditId === s.id ? 'Kaydediliyor...' : 'Güncelle'}</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Kompakt Satır İçi Ödeme Kutusu (Maaş / Avans / Prim) */}
                    {isPaying && (
                      <form
                        onSubmit={(e) => submitStaffPayment(e, s)}
                        className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-300 dark:border-emerald-800/70 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5" /> Ödeme Yap (Kasaya Gider Yaz)
                          </p>
                          <button
                            type="button"
                            onClick={() => setPayBoxStaffId(null)}
                            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                            title="Kapat"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                              Ödeme Tipi
                            </label>
                            <select
                              value={payCategory}
                              onChange={(e) => {
                                const nextCat = e.target.value as PaymentCategory;
                                setPayCategory(nextCat);
                                if (
                                  nextCat === 'Personel Maaş' &&
                                  payAmount.trim() === '' &&
                                  typeof s.salary === 'number' &&
                                  s.salary > 0
                                ) {
                                  setPayAmount(String(s.salary));
                                }
                              }}
                              className="w-full px-2.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            >
                              {PAYMENT_CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label} ({c.value})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                              Ödenecek Tutar (₺)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                step="0.01"
                                required
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                placeholder="Tutar giriniz"
                                className="w-full px-2.5 py-2 pr-7 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-black text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">
                                ₺
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                              Ödeme Yöntemi
                            </label>
                            <select
                              value={payMethod}
                              onChange={(e) => setPayMethod(e.target.value as StaffPayMethod)}
                              className="w-full px-2.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            >
                              {PAYMENT_METHODS.map((m) => (
                                <option key={m.value} value={m.value}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={payNote}
                            onChange={(e) => setPayNote(e.target.value)}
                            placeholder="İsteğe bağlı not (örn: Haftalık avans, Ekim primi)"
                            className="flex-1 px-2.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-medium text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="submit"
                            disabled={payingStaffId === s.id}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{payingStaffId === s.id ? 'İşleniyor...' : 'Ödemeyi Kaydet'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
