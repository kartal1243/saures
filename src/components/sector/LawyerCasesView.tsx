import React, { useMemo, useState } from 'react';
import {
  Scale,
  Gavel,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Clock,
  User,
} from 'lucide-react';
import type { CaseFile, Customer, Hearing } from '../../types';
import { formatCurrency } from '../../utils/formatters';

export type LawyerTab = 'cases' | 'hearings';

interface LawyerCasesViewProps {
  cases: CaseFile[];
  customers: Customer[];
  initialTab: LawyerTab;
  onTabChange: (tab: LawyerTab) => void;
  onSaveCase: (data: Partial<CaseFile>) => Promise<void>;
  onDeleteCase: (id: string) => Promise<void>;
}

function newHearingId(): string {
  return `hr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
}

export const LawyerCasesView: React.FC<LawyerCasesViewProps> = ({
  cases,
  customers,
  initialTab,
  onTabChange,
  onSaveCase,
  onDeleteCase,
}) => {
  const [tab, setTab] = useState<LawyerTab>(initialTab);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CaseFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fileNo, setFileNo] = useState('');
  const [clientName, setClientName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [court, setCourt] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [hours, setHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [status, setStatus] = useState<'acik' | 'kapali'>('acik');
  const [notes, setNotes] = useState('');
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [newHearingDate, setNewHearingDate] = useState('');
  const [newHearingNote, setNewHearingNote] = useState('');

  const switchTab = (t: LawyerTab) => {
    setTab(t);
    onTabChange(t);
  };

  const openNew = () => {
    setEditing(null);
    setFileNo('');
    setClientName('');
    setCustomerId('');
    setCourt('');
    setHearingDate('');
    setHours('');
    setHourlyRate('');
    setStatus('acik');
    setNotes('');
    setHearings([]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (c: CaseFile) => {
    setEditing(c);
    setFileNo(c.fileNo);
    setClientName(c.clientName);
    setCustomerId(c.customerId || '');
    setCourt(c.court || '');
    setHearingDate(c.hearingDate || '');
    setHours(String(c.consultancyHours || ''));
    setHourlyRate(c.hourlyRate ? String(c.hourlyRate) : '');
    setStatus(c.status);
    setNotes(c.notes || '');
    setHearings(c.hearings || []);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileNo.trim() || !clientName.trim()) {
      setError('Dosya No ve müvekkil adı zorunludur.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSaveCase({
        id: editing?.id,
        fileNo: fileNo.trim(),
        clientName: clientName.trim(),
        customerId: customerId || undefined,
        court: court.trim() || undefined,
        hearingDate: hearingDate || undefined,
        hearings,
        consultancyHours: Number(hours) || 0,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        status,
        notes: notes.trim() || undefined,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const openCases = useMemo(() => cases.filter((c) => c.status === 'acik'), [cases]);
  const totalHours = useMemo(() => cases.reduce((s, c) => s + (c.consultancyHours || 0), 0), [cases]);

  const upcomingHearings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return cases
      .flatMap((c) =>
        (c.hearings || []).map((h) => ({ ...h, fileNo: c.fileNo, clientName: c.clientName, caseId: c.id }))
      )
      .filter((h) => h.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 20);
  }, [cases]);

  const nextHearingDate = upcomingHearings.length > 0 ? upcomingHearings[0].date : null;

  const customerBalance = (id?: string) => {
    if (!id) return null;
    const c = customers.find((x) => x.id === id);
    return c ? c.balance : null;
  };

  return (
    <div className="space-y-4">
      {/* Özet başlık */}
      <div className="bg-linear-to-br from-violet-900 to-stone-900 text-white p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Scale className="w-5 h-5 text-violet-200" />
            </span>
            <div>
              <h3 className="text-sm font-black">Dava & Müvekkil Dosyaları</h3>
              <p className="text-[11px] text-violet-200">
                {openCases.length} açık dosya · {totalHours} saat takip
                {nextHearingDate ? ` · Sıradaki duruşma: ${nextHearingDate}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yeni Dosya
          </button>
        </div>
        <div className="mt-3 flex gap-1.5">
          {(
            [
              { key: 'cases', label: 'Dosyalar' },
              { key: 'hearings', label: 'Duruşma Takvimi' },
            ] as { key: LawyerTab; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTab(t.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                tab === t.key ? 'bg-white text-violet-900' : 'bg-white/10 text-violet-100 hover:bg-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'cases' ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {cases.length === 0 && (
            <div className="col-span-full rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 text-center">
              <FolderOpen className="w-8 h-8 mx-auto text-stone-300" />
              <p className="mt-2 text-sm font-bold text-stone-500">Henüz dosya yok. İlk dava dosyanı açarak başla.</p>
            </div>
          )}
          {cases.map((c) => {
            const bal = customerBalance(c.customerId);
            return (
              <div
                key={c.id}
                className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-violet-600 dark:text-violet-400">#{c.fileNo}</p>
                    <p className="text-sm font-black text-stone-900 dark:text-white truncate flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-400 shrink-0" /> {c.clientName}
                    </p>
                    {c.court && <p className="text-[11px] font-semibold text-stone-400 mt-0.5">{c.court}</p>}
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      c.status === 'acik'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}
                  >
                    {c.status === 'acik' ? 'Açık' : 'Kapalı'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 px-2 py-1.5">
                    <p className="text-[10px] font-bold text-stone-400 flex items-center justify-center gap-1">
                      <Gavel className="w-3 h-3" /> Duruşma
                    </p>
                    <p className="text-xs font-black text-stone-800 dark:text-stone-100">{c.hearingDate || '—'}</p>
                  </div>
                  <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 px-2 py-1.5">
                    <p className="text-[10px] font-bold text-stone-400 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" /> Danış. Saat
                    </p>
                    <p className="text-xs font-black text-stone-800 dark:text-stone-100">
                      {c.consultancyHours || 0}s{c.hourlyRate ? ` × ${formatCurrency(c.hourlyRate)}` : ''}
                    </p>
                  </div>
                  <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 px-2 py-1.5">
                    <p className="text-[10px] font-bold text-stone-400">Müvekkil Cari</p>
                    <p className={`text-xs font-black ${bal !== null && bal > 0 ? 'text-emerald-500' : 'text-stone-400'}`}>
                      {bal !== null ? formatCurrency(bal) : '—'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" /> Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCase(c.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
          <p className="text-xs font-black text-stone-900 dark:text-white">Yaklaşan Duruşmalar</p>
          {upcomingHearings.length === 0 && (
            <p className="mt-2 text-xs font-semibold text-stone-400">Planlı duruşma yok.</p>
          )}
          <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
            {upcomingHearings.map((h) => (
              <li key={h.id} className="py-2.5 flex items-center gap-3">
                <span className="w-11 shrink-0 rounded-lg bg-violet-600/10 text-violet-600 dark:text-violet-300 text-center px-1 py-1.5">
                  <span className="block text-sm font-black leading-none">{h.date.slice(8, 10)}</span>
                  <span className="block text-[10px] font-bold">{h.date.slice(5, 7)}.{h.date.slice(0, 4)}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-stone-800 dark:text-stone-100 truncate">
                    #{h.fileNo} · {h.clientName}
                  </span>
                  {h.note && (
                    <span className="block text-[11px] font-semibold text-stone-400 truncate">{h.note}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dosya modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-lg border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
            <div className="p-5 bg-linear-to-r from-violet-700 to-purple-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{editing ? 'Dosyayı Düzenle' : 'Yeni Dava Dosyası'}</h2>
                  <p className="text-xs text-violet-100">Dosya No, müvekkil, duruşma ve saat takibi</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer" title="Kapat">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Dosya No *</label>
                  <input type="text" value={fileNo} onChange={(e) => setFileNo(e.target.value)} placeholder="2026/1234" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Müvekkil *</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ad Soyad" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Müşteri Defteri Bağlantısı (Cari için)</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer">
                  <option value="">Bağlantı yok</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Mahkeme / Kurum</label>
                  <input type="text" value={court} onChange={(e) => setCourt(e.target.value)} placeholder="Asliye Hukuk" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Sonraki Duruşma</label>
                  <input type="date" value={hearingDate} onChange={(e) => setHearingDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Danış. Saat</label>
                  <input type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Saatlik Ücret ₺</label>
                  <input type="number" min="0" step="any" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="—" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Durum</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as 'acik' | 'kapali')} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer">
                    <option value="acik">Açık</option>
                    <option value="kapali">Kapalı</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Duruşma Geçmişi</label>
                <div className="flex gap-2">
                  <input type="date" value={newHearingDate} onChange={(e) => setNewHearingDate(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500" />
                  <input type="text" value={newHearingNote} onChange={(e) => setNewHearingNote(e.target.value)} placeholder="Not" className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500" />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newHearingDate) return;
                      setHearings((prev) => [...prev, { id: newHearingId(), date: newHearingDate, note: newHearingNote.trim() || undefined }]);
                      setNewHearingDate('');
                      setNewHearingNote('');
                    }}
                    className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Ekle
                  </button>
                </div>
                {hearings.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {hearings.map((h) => (
                      <li key={h.id} className="flex items-center justify-between gap-2 text-xs font-semibold bg-stone-50 dark:bg-stone-800/60 rounded-lg px-2.5 py-1.5">
                        <span className="text-stone-700 dark:text-stone-200">{h.date}{h.note ? ` · ${h.note}` : ''}</span>
                        <button type="button" onClick={() => setHearings((prev) => prev.filter((x) => x.id !== h.id))} className="text-rose-500 hover:text-rose-600 cursor-pointer" title="Sil">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Notlar</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dosya notu..." className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-200 dark:border-stone-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors cursor-pointer">
                  Vazgeç
                </button>
                <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50">
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>{saving ? 'Kaydediliyor...' : 'Dosyayı Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
