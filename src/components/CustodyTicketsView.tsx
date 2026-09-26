import React, { useMemo, useState } from 'react';
import {
  Shirt,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Clock,
  User,
  Banknote,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import type { CustodyTicket, Customer } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CustodyTicketsViewProps {
  tickets: CustodyTicket[];
  customers: Customer[];
  onSaveTicket: (data: Partial<CustodyTicket>) => Promise<void>;
  onUpdateStatus: (id: string, status: CustodyTicket['status']) => Promise<void>;
  onCompleteTicket: (id: string, paymentMethod: 'nakit' | 'kart') => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
}

type FilterKey = 'all' | CustodyTicket['status'];

const STATUS_META: Record<CustodyTicket['status'], { label: string; badge: string; next?: CustodyTicket['status']; nextLabel?: string }> = {
  kabul: { label: 'Kabul Edildi', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300', next: 'islemde', nextLabel: 'İşleme Al' },
  islemde: { label: 'İşlemde', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300', next: 'hazir', nextLabel: 'Hazır Et' },
  hazir: { label: 'Teslime Hazır', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  teslim: { label: 'Teslim Edildi', badge: 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400' },
};

export const CustodyTicketsView: React.FC<CustodyTicketsViewProps> = ({
  tickets,
  customers,
  onSaveTicket,
  onUpdateStatus,
  onCompleteTicket,
  onDeleteTicket,
}) => {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustodyTicket | null>(null);
  const [completing, setCompleting] = useState<CustodyTicket | null>(null);
  const [payMethod, setPayMethod] = useState<'nakit' | 'kart'>('nakit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [promisedDate, setPromisedDate] = useState('');
  const [price, setPrice] = useState('');
  const [advance, setAdvance] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(
    () => (filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)),
    [tickets, filter]
  );
  const waiting = useMemo(() => tickets.filter((t) => t.status !== 'teslim').length, [tickets]);
  const ready = useMemo(() => tickets.filter((t) => t.status === 'hazir').length, [tickets]);
  const today = new Date().toISOString().split('T')[0];

  const openNew = () => {
    setEditing(null);
    setCustomerName('');
    setPhone('');
    setCustomerId('');
    setItemDesc('');
    setPromisedDate('');
    setPrice('');
    setAdvance('');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (t: CustodyTicket) => {
    setEditing(t);
    setCustomerName(t.customerName);
    setPhone(t.phone || '');
    setCustomerId(t.customerId || '');
    setItemDesc(t.itemDesc);
    setPromisedDate(t.promisedDate || '');
    setPrice(String(t.price || ''));
    setAdvance(String(t.advance || ''));
    setNotes(t.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !itemDesc.trim()) {
      setError('Müşteri adı ve bırakılan eşya zorunludur.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSaveTicket({
        id: editing?.id,
        customerName: customerName.trim(),
        phone: phone.trim(),
        customerId: customerId || undefined,
        itemDesc: itemDesc.trim(),
        promisedDate: promisedDate || undefined,
        price: Number(price) || 0,
        advance: Number(advance) || 0,
        notes: notes.trim() || undefined,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!completing) return;
    setSaving(true);
    try {
      await onCompleteTicket(completing.id, payMethod);
      setCompleting(null);
    } finally {
      setSaving(false);
    }
  };

  const restOf = (t: CustodyTicket) => Math.max(0, (t.price || 0) - (t.advance || 0));

  return (
    <div className="space-y-4">
      <div className="bg-linear-to-br from-teal-800 to-stone-900 text-white p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Shirt className="w-5 h-5 text-teal-200" />
            </span>
            <div>
              <h3 className="text-sm font-black">Emanet Takibi</h3>
              <p className="text-[11px] text-teal-100">
                {waiting} bekleyen eşya · {ready} teslimata hazır
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yeni Emanet
          </button>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {(
            [
              { key: 'all', label: `Tümü (${tickets.length})` },
              { key: 'kabul', label: 'Kabul' },
              { key: 'islemde', label: 'İşlemde' },
              { key: 'hazir', label: 'Hazır' },
              { key: 'teslim', label: 'Teslim' },
            ] as { key: FilterKey; label: string }[]
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filter === f.key ? 'bg-white text-teal-900' : 'bg-white/10 text-teal-100 hover:bg-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 text-center">
            <Shirt className="w-8 h-8 mx-auto text-stone-300" />
            <p className="mt-2 text-sm font-bold text-stone-500">Bu rafta eşya yok. İlk emaneti alarak başla.</p>
          </div>
        )}
        {filtered.map((t) => {
          const meta = STATUS_META[t.status];
          const overdue = t.promisedDate && t.promisedDate < today && t.status !== 'teslim';
          const linked = t.customerId ? customers.find((c) => c.id === t.customerId) : null;
          return (
            <div key={t.id} className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-black text-stone-900 dark:text-white truncate flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-400 shrink-0" /> {t.customerName}
                  </p>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">{t.itemDesc}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black ${meta.badge}`}>
                  {meta.label}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 px-2 py-1.5">
                  <p className="text-[10px] font-bold text-stone-400 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> Söz Tarihi
                  </p>
                  <p className={`text-xs font-black ${overdue ? 'text-rose-500' : 'text-stone-800 dark:text-stone-100'}`}>
                    {t.promisedDate || '—'}{overdue ? ' (geçti!)' : ''}
                  </p>
                </div>
                <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 px-2 py-1.5">
                  <p className="text-[10px] font-bold text-stone-400">Ücret / Kapora</p>
                  <p className="text-xs font-black text-stone-800 dark:text-stone-100">
                    {formatCurrency(t.price || 0)} <span className="text-stone-400 font-bold">/ {formatCurrency(t.advance || 0)}</span>
                  </p>
                </div>
                <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 px-2 py-1.5">
                  <p className="text-[10px] font-bold text-stone-400">Kalan / Cari</p>
                  <p className={`text-xs font-black ${restOf(t) > 0 ? 'text-amber-600' : 'text-emerald-500'}`}>
                    {formatCurrency(restOf(t))}
                    {linked && linked.balance > 0 ? ` · Cari ${formatCurrency(linked.balance)}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-1.5 flex-wrap">
                {meta.next && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(t.id, meta.next!)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer"
                  >
                    {meta.nextLabel} <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                {t.status !== 'teslim' && (
                  <button
                    type="button"
                    onClick={() => { setCompleting(t); setPayMethod('nakit'); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Teslim + Tahsilat
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(t)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" /> Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTicket(t.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emanet formu */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-lg border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
            <div className="p-5 bg-linear-to-r from-teal-700 to-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{editing ? 'Emaneti Düzenle' : 'Yeni Emanet Fişi'}</h2>
                  <p className="text-xs text-teal-100">Müşteri, eşya, söz tarihi ve ücret</p>
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
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Müşteri *</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ad Soyad" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Telefon</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX..." className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Müşteri Defteri Bağlantısı</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer">
                  <option value="">Bağlantı yok</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Bırakılan Eşya *</label>
                <input type="text" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Örn: 2 takım elbise, 1 gömlek, 1 perde" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Söz Tarihi</label>
                  <input type="date" value={promisedDate} onChange={(e) => setPromisedDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Ücret ₺</label>
                  <input type="number" min="0" step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Kapora ₺</label>
                  <input type="number" min="0" step="any" value={advance} onChange={(e) => setAdvance(e.target.value)} placeholder="0" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">Not (leke, sökük...)</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Teslim alırken dikkat..." className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-200 dark:border-stone-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors cursor-pointer">
                  Vazgeç
                </button>
                <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm shadow-md transition-transform active:scale-98 cursor-pointer disabled:opacity-50">
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>{saving ? 'Kaydediliyor...' : 'Emaneti Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teslim + tahsilat */}
      {completing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden p-5">
            <h3 className="text-sm font-black text-stone-900 dark:text-white">Teslimatı Tamamla</h3>
            <p className="text-xs text-stone-500 mt-1">
              {completing.customerName} · {completing.itemDesc}
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-500">{formatCurrency(restOf(completing))}</p>
            <p className="text-[11px] font-bold text-stone-400">kalan tutar kasaya tahsilat olarak işlenir</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  { key: 'nakit', label: 'Nakit', Icon: Banknote },
                  { key: 'kart', label: 'Kart', Icon: CreditCard },
                ] as const
              ).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPayMethod(key)}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-black transition-colors cursor-pointer ${
                    payMethod === key
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-stone-200 dark:border-stone-700 text-stone-500'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setCompleting(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? 'İşleniyor...' : 'Teslim Et'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
