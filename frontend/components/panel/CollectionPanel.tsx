import React, { useMemo, useState } from 'react';
import { Customer, Appointment } from '../../../shared/types.ts';
import { formatCurrency, formatPhoneNumber, cleanPhoneForWhatsApp } from '../../utils/formatters';
import { dayKey } from '../../utils/dates';
import {
  HandCoins,
  MessageCircle,
  Wallet,
  Play,
  CheckCheck,
  X,
  Crown,
  ChevronRight,
  Phone,
} from 'lucide-react';

interface CollectionPanelProps {
  customers: Customer[];
  appointments?: Appointment[];
  shopName?: string;
  onOpenWhatsApp: (customer: Customer) => void;
  onOpenPayment: (customer: Customer) => void;
}

interface QueueItem {
  customer: Customer;
  done: boolean;
}

/** Esnaf tonunda hazır hatırlatma metni (tekli tur için, modal açmadan direkt gönderim). */
function presetMessage(c: Customer, shopName?: string): string {
  return `Selamlar ${c.name}, ${shopName || 'dükkanımızda'} hesabınızda ${formatCurrency(c.balance)} veresiye bakiyeniz bulunmaktadır. Müsait olduğunuzda uğrarsanız seviniriz, hayırlı işler, bereketli günler.`;
}

export const CollectionPanel: React.FC<CollectionPanelProps> = ({
  customers,
  appointments,
  shopName,
  onOpenWhatsApp,
  onOpenPayment,
}) => {
  const [tab, setTab] = useState<'debt' | 'due' | 'appt'>(() => {
    try {
      return (localStorage.getItem('collection-tab') as 'debt' | 'due' | 'appt') || 'debt';
    } catch {
      return 'debt';
    }
  });
  const switchTab = (t: 'debt' | 'due' | 'appt') => {
    setTab(t);
    setQueue(null);
    setQueueIdx(0);
    try {
      localStorage.setItem('collection-tab', t);
    } catch { /* yoksay */ }
  };
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [queueIdx, setQueueIdx] = useState(0);

  const debtors = useMemo(
    () =>
      customers
        .filter((c) => (c.balance || 0) > 0)
        .sort((a, b) => (b.balance || 0) - (a.balance || 0)),
    [customers],
  );

  const totalDebt = useMemo(
    () => debtors.reduce((s, c) => s + (c.balance || 0), 0),
    [debtors],
  );

  // Vadesi gelenler: abonelik/bakım günü bugünden 3 gün sonrasına kadar olanlar
  const dueList = useMemo(() => {
    const todayStr = dayKey(new Date());
    return customers
      .filter((c) => {
        if (!c.subscriptionPlan?.enabled || !c.subscriptionPlan.nextDueDate) return false;
        const diffDays = Math.ceil(
          (new Date(c.subscriptionPlan.nextDueDate).getTime() - new Date(todayStr).getTime()) / 86400000,
        );
        return diffDays <= 3;
      })
      .sort((a, b) => (a.subscriptionPlan?.nextDueDate || '').localeCompare(b.subscriptionPlan?.nextDueDate || ''));
  }, [customers]);

  // Yarınki randevular: no-show'u önlemek için önceki gün onayı
  const tomorrowAppts = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    const tomorrow = dayKey(t);
    return (appointments || [])
      .filter((a) => a.appointmentDate === tomorrow && a.status === 'bekliyor')
      .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  }, [appointments]);

  const startQueue = () => {
    if (debtors.length === 0) return;
    setQueue(debtors.map((customer) => ({ customer, done: false })));
    setQueueIdx(0);
  };

  const openCurrent = () => {
    if (!queue || queueIdx >= queue.length) return;
    const item = queue[queueIdx];
    const phone = cleanPhoneForWhatsApp(item.customer.phone);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(presetMessage(item.customer, shopName))}`;
    fetch('/api/reminders/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: item.customer.id,
        channel: 'whatsapp',
        message: presetMessage(item.customer, shopName),
        type: 'veresiye',
      }),
    }).catch(() => {});
    window.open(url, '_blank');
  };

  const markDoneNext = () => {
    if (!queue) return;
    setQueue(queue.map((q, i) => (i === queueIdx ? { ...q, done: true } : q)));
    if (queueIdx + 1 >= queue.length) {
      setQueueIdx(queueIdx + 1);
    } else {
      setQueueIdx(queueIdx + 1);
    }
  };

  const doneCount = queue ? queue.filter((q) => q.done).length : 0;
  const queueFinished = queue !== null && queueIdx >= queue.length;
  const current = queue && !queueFinished ? queue[queueIdx] : null;

  return (
    <div id="vip-tahsilat" className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-xs scroll-mt-20">
      {/* Başlık */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
            <HandCoins className="w-4 h-4" />
          </span>
          Tahsilat Turu
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
            <Crown className="w-3 h-3" /> VIP
          </span>
        </h2>
        {tab === 'debt' && debtors.length > 0 && !queue && (
          <button
            type="button"
            onClick={startQueue}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" /> Toplu Tur
          </button>
        )}
      </div>

      {/* Sekmeler */}
      <div className="mt-3 grid grid-cols-3 gap-1.5 p-1.5 bg-stone-100 dark:bg-stone-800/70 rounded-xl">
        {(
          [
            { k: 'debt', t: `Borçlular (${debtors.length})` },
            { k: 'due', t: `Vade (${dueList.length})` },
            { k: 'appt', t: `Yarın (${tomorrowAppts.length})` },
          ] as const
        ).map((s) => (
          <button
            key={s.k}
            type="button"
            onClick={() => switchTab(s.k)}
            className={`py-2 px-1 rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
              tab === s.k
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            {s.t}
          </button>
        ))}
      </div>

      {/* Özet */}
      {tab === 'debt' && (
      <>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 px-3.5 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Bekleyen alacak</p>
          <p className="mt-0.5 text-xl font-black text-rose-600 dark:text-rose-400">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 px-3.5 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Borçlu kişi</p>
          <p className="mt-0.5 text-xl font-black text-stone-900 dark:text-white">{debtors.length}</p>
        </div>
      </div>

      {debtors.length === 0 && (
        <p className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl px-3.5 py-3">
          Bekleyen alacak yok — kasa rahat. 🎉
        </p>
      )}
      </>
      )}

      {/* Toplu tur modu */}
      {tab === 'debt' && queue && !queueFinished && current && (
        <div className="mt-3 rounded-xl border-2 border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5">
          <div className="flex items-center justify-between text-[11px] font-black text-emerald-700 dark:text-emerald-300">
            <span>Toplu tur: {queueIdx + 1}/{queue.length}</span>
            <span>{doneCount} gönderildi</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(doneCount / queue.length) * 100}%` }}
            />
          </div>
          <p className="mt-2.5 text-sm font-black text-stone-900 dark:text-white">
            {current.customer.name} · {formatCurrency(current.customer.balance)}
          </p>
          <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            {formatPhoneNumber(current.customer.phone)}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 px-2.5 py-2">
            “{presetMessage(current.customer, shopName)}”
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={openCurrent}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp'ta Aç
            </button>
            <button
              type="button"
              onClick={markDoneNext}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-900 dark:bg-white hover:opacity-90 text-white dark:text-stone-900 text-xs font-black transition-opacity cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" /> Gönderildi, Sonraki
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setQueue(null); setQueueIdx(0); }}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Turu bitir
          </button>
        </div>
      )}

      {tab === 'debt' && queueFinished && (
        <div className="mt-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-3 flex items-center justify-between gap-2">
          <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">
            Tur bitti: {doneCount}/{queue?.length || 0} kişiye hatırlatma gönderildi. 👏
          </p>
          <button
            type="button"
            onClick={() => { setQueue(null); setQueueIdx(0); }}
            className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 underline cursor-pointer"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Borçlu listesi */}
      {tab === 'debt' && (!queue || queueFinished) && debtors.length > 0 && (
        <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
          {debtors.slice(0, 8).map((c) => (
            <li key={c.id} className="py-2.5 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-sm font-black shrink-0">
                {(c.name || '?').trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-stone-800 dark:text-stone-100 truncate">
                  {c.name}
                </span>
                <span className="block text-[11px] font-semibold text-stone-400 truncate">
                  {formatPhoneNumber(c.phone)}
                  {c.lastPaymentDate ? ` · son ödeme ${c.lastPaymentDate}` : ''}
                </span>
              </span>
              <span className="shrink-0 text-[13px] font-black text-rose-500">
                {formatCurrency(c.balance || 0)}
              </span>
              <span className="shrink-0 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenWhatsApp(c)}
                  title="WhatsApp ile hatırlat"
                  className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPayment(c)}
                  title="Tahsilat gir"
                  className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center hover:bg-amber-500/25 transition-colors cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {tab === 'debt' && (!queue || queueFinished) && debtors.length > 8 && (
        <p className="mt-1 text-[11px] font-bold text-stone-400 flex items-center gap-1">
          +{debtors.length - 8} borçlu daha var — tamamını Veresiye sekmesinde gör
          <ChevronRight className="w-3.5 h-3.5" />
        </p>
      )}

      {/* Vadesi gelenler */}
      {tab === 'due' && (
        dueList.length === 0 ? (
          <p className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl px-3.5 py-3">
            Yaklaşan vade yok — aidat ve bakımlar güncel. ✅
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
            {dueList.slice(0, 8).map((c) => (
              <li key={c.id} className="py-2.5 flex items-center gap-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-stone-800 dark:text-stone-100 truncate">
                    {c.name}
                  </span>
                  <span className="block text-[11px] font-semibold text-stone-400 truncate">
                    {c.subscriptionPlan?.title || 'Aidat'} · vade {c.subscriptionPlan?.nextDueDate} · {formatCurrency(c.subscriptionPlan?.amount || 0)}
                  </span>
                </span>
                <span className="shrink-0 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp(c)}
                    title="WhatsApp ile hatırlat"
                    className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPayment(c)}
                    title="Tahsilat gir"
                    className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center hover:bg-amber-500/25 transition-colors cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )
      )}

      {/* Yarınki randevular */}
      {tab === 'appt' && (
        tomorrowAppts.length === 0 ? (
          <p className="mt-3 text-xs font-bold text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-3">
            Yarın bekleyen randevu yok. Randevular sektör panelinden girilir.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
            {tomorrowAppts.slice(0, 8).map((a) => (
              <li key={a.id} className="py-2.5 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-[11px] font-black shrink-0">
                  {a.timeSlot || '--:--'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-stone-800 dark:text-stone-100 truncate">
                    {a.customerName} · {a.serviceName}
                  </span>
                  <span className="block text-[11px] font-semibold text-stone-400 truncate">
                    {formatPhoneNumber(a.phone)}{a.staffName ? ` · ${a.staffName}` : ''}
                  </span>
                </span>
                <span className="shrink-0 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Selamlar ${a.customerName}, yarın saat ${a.timeSlot} ${shopName || 'dükkanımızda'} ${a.serviceName} randevunuz bulunmaktadır. Onaylıyor musunuz? Hayırlı günler.`;
                      window.open(`https://wa.me/${cleanPhoneForWhatsApp(a.phone)}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    title="Randevu onayı iste"
                    className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <a
                    href={`tel:${a.phone.replace(/\s+/g, '')}`}
                    title="Ara"
                    className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center hover:bg-sky-500/20 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )
      )}

      <p className="mt-2 text-[10px] font-semibold text-stone-400">
        Bugün {dayKey(new Date())} · en yüksek borçtan sıralı
      </p>
    </div>
  );
};
