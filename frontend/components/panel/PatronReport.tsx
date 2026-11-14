import React, { useMemo, useState } from 'react';
import type { Transaction, Customer, Product, ShopProfile } from '../../../shared/types.ts';
import { formatCurrency } from '../../utils/formatters';
import { dayKey, midnight } from '../../utils/dates';
import { printHtmlDocument, escapeHtml } from '../../utils/printTemplate';
import {
  Crown,
  Printer,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  HandCoins,
  TriangleAlert,
  CalendarDays,
  FileSpreadsheet,
} from 'lucide-react';

interface PatronReportProps {
  transactions: Transaction[];
  customers: Customer[];
  products: Product[];
  shopProfile: ShopProfile;
}

/** Yerel güne göre son N günü (bugün dahil) YYYY-MM-DD listesi */
function lastDays(n: number): string[] {
  const today = midnight(new Date());
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

export const PatronReport: React.FC<PatronReportProps> = ({
  transactions,
  customers,
  products,
  shopProfile,
}) => {
  const [copied, setCopied] = useState(false);

  const data = useMemo(() => {
    const week = lastDays(7);
    const prev = lastDays(14).slice(0, 7);
    let income = 0;
    let expense = 0;
    let veresiye = 0;
    let prevIncome = 0;
    for (const tx of transactions) {
      const d = (tx.date || '').slice(0, 10);
      const amt = tx.amount || 0;
      if (week.includes(d)) {
        if (tx.type === 'tahsilat') income += amt;
        else if (tx.type === 'gider' || tx.type === 'masraf') expense += amt;
        else if (tx.type === 'veresiye') veresiye += amt;
      } else if (prev.includes(d) && tx.type === 'tahsilat') {
        prevIncome += amt;
      }
    }
    const debtors = customers
      .filter((c) => (c.balance || 0) > 0)
      .sort((a, b) => (b.balance || 0) - (a.balance || 0));
    const totalDebt = debtors.reduce((s, c) => s + (c.balance || 0), 0);
    const critical = products.filter((p) => p.currentStock <= p.criticalThreshold);
    return {
      weekLabel: `${week[0]} → ${week[6]}`,
      income,
      expense,
      net: income - expense,
      veresiye,
      prevIncome,
      debtors: debtors.slice(0, 5),
      debtorCount: debtors.length,
      totalDebt,
      critical,
    };
  }, [transactions, customers, products]);

  const reportText = useMemo(() => {
    const lines = [
      `PATRON RAPORU — ${shopProfile.storeName || 'Dükkanım'} (son 7 gün: ${data.weekLabel})`,
      `Tahsilat: ${formatCurrency(data.income)} | Gider: ${formatCurrency(data.expense)} | Net: ${formatCurrency(data.net)}`,
      `Yazılan veresiye: ${formatCurrency(data.veresiye)}`,
      `Bekleyen alacak: ${formatCurrency(data.totalDebt)} (${data.debtorCount} kişi)`,
    ];
    if (data.debtors.length > 0) {
      lines.push('En borçlu 5:');
      data.debtors.forEach((c, i) =>
        lines.push(`${i + 1}. ${c.name} — ${formatCurrency(c.balance || 0)} (${c.phone})`),
      );
    }
    if (data.critical.length > 0) {
      lines.push(`Kritik stok (${data.critical.length}): ` + data.critical.map((p) => `${p.name} (${p.currentStock} ${p.unit})`).join(', '));
    } else {
      lines.push('Kritik stok yok.');
    }
    return lines.join('\n');
  }, [data, shopProfile.storeName]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = reportText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPatronReport = () => {
    const debtorRows = data.debtors
      .map(
        (c, i) =>
          `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${i + 1}. ${escapeHtml(c.name)}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(c.phone || '-')}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;color:#e11d48;">${escapeHtml(formatCurrency(c.balance || 0))}</td></tr>`
      )
      .join('');
    const criticalRows = data.critical
      .slice(0, 12)
      .map(
        (p) =>
          `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(p.name)}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;color:#e11d48;">${p.currentStock} / ${p.criticalThreshold} ${escapeHtml(p.unit)}</td></tr>`
      )
      .join('');
    printHtmlDocument({
      title: `Patron Raporu — ${shopProfile.storeName || 'Dükkanım'}`,
      paperWidth: 'A4',
      bodyHtml: `
        <div style="border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;">
          <div>
            <div style="font-size:11px;font-weight:800;color:#ea580c;text-transform:uppercase;letter-spacing:1px;">Dükkânım Yanımda • Haftalık Özet</div>
            <h1 style="margin:4px 0 0;font-size:22px;font-weight:900;">${escapeHtml(shopProfile.storeName || 'Dükkanım')} — Patron Raporu</h1>
          </div>
          <div style="font-size:12px;color:#475569;font-weight:700;">Dönem: ${escapeHtml(data.weekLabel)}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
          <div style="border:1px solid #a7f3d0;background:#ecfdf5;border-radius:10px;padding:12px;text-align:center;">
            <div style="font-size:10px;font-weight:800;color:#059669;text-transform:uppercase;">Haftalık Tahsilat</div>
            <div style="font-size:20px;font-weight:900;color:#047857;margin-top:4px;">${escapeHtml(formatCurrency(data.income))}</div>
          </div>
          <div style="border:1px solid #fecdd3;background:#fff1f2;border-radius:10px;padding:12px;text-align:center;">
            <div style="font-size:10px;font-weight:800;color:#e11d48;text-transform:uppercase;">Haftalık Gider</div>
            <div style="font-size:20px;font-weight:900;color:#be123c;margin-top:4px;">${escapeHtml(formatCurrency(data.expense))}</div>
          </div>
          <div style="border:1px solid #bae6fd;background:#f0f9ff;border-radius:10px;padding:12px;text-align:center;">
            <div style="font-size:10px;font-weight:800;color:#0284c7;text-transform:uppercase;">Net Durum</div>
            <div style="font-size:20px;font-weight:900;color:#0369a1;margin-top:4px;">${escapeHtml(formatCurrency(data.net))}</div>
          </div>
        </div>
        <p style="font-size:12px;color:#475569;margin-bottom:18px;">
          Önceki Hafta Tahsilatı: <strong>${escapeHtml(formatCurrency(data.prevIncome))}</strong> · Haftalık Veresiye Satış: <strong>${escapeHtml(formatCurrency(data.veresiye))}</strong> · Toplam Bekleyen Alacak: <strong>${escapeHtml(formatCurrency(data.totalDebt))}</strong> (${data.debtorCount} kişi)
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <h3 style="font-size:13px;font-weight:900;margin:0 0 8px;">En Yüksek Bakiyeli 5 Müşteri</h3>
            ${data.debtors.length === 0 ? '<p style="font-size:12px;color:#059669;">Bekleyen alacak yok.</p>' : `<table style="font-size:12px;">${debtorRows}</table>`}
          </div>
          <div>
            <h3 style="font-size:13px;font-weight:900;margin:0 0 8px;">Kritik Stoktaki Ürünler (${data.critical.length})</h3>
            ${data.critical.length === 0 ? '<p style="font-size:12px;color:#059669;">Tüm stoklar yeterli seviyede.</p>' : `<table style="font-size:12px;">${criticalRows}</table>`}
          </div>
        </div>
      `,
    });
  };

  const handleExportAccountantCsv = () => {
    const csvEscape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Tarih', 'İşlem Türü', 'Müşteri / Cari', 'Ödeme Yöntemi', 'Tutar (TL)', 'Açıklama'].map(csvEscape).join(';');
    const rows = transactions.map((tx) =>
      [
        tx.date || '',
        tx.type === 'tahsilat' ? 'Tahsilat (Gelir)' : tx.type === 'veresiye' ? 'Veresiye Satış' : 'Gider / Masraf',
        tx.customerName || 'Genel',
        tx.paymentMethod || '',
        Number(tx.amount || 0).toFixed(2).replace('.', ','),
        tx.description || '',
      ]
        .map(csvEscape)
        .join(';')
    );
    const summaryRows = [
      '',
      ['ÖZET', `Dönem: ${data.weekLabel}`, `Haftalık Tahsilat: ${data.income.toFixed(2)}`, `Haftalık Gider: ${data.expense.toFixed(2)}`, `Net: ${data.net.toFixed(2)}`, `Toplam Veresiye Alacak: ${data.totalDebt.toFixed(2)}`]
        .map(csvEscape)
        .join(';'),
    ];
    const csvContent = '\uFEFF' + [header, ...rows, ...summaryRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `muhasebe-raporu-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const diff = data.income - data.prevIncome;

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <h2 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </span>
          Patron Raporu
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
            <Crown className="w-3 h-3" /> VIP
          </span>
        </h2>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={handleExportAccountantCsv}
            title="Muhasebeci için CSV/Excel indir"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-black transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Muhasebeci CSV/Excel
          </button>
          <button
            type="button"
            onClick={copy}
            title="Raporu kopyala"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-black transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>
          <button
            type="button"
            onClick={handlePrintPatronReport}
            title="Raporu yazdır"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 dark:bg-white hover:opacity-90 text-white dark:text-stone-900 text-xs font-black transition-opacity cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Yazdır
          </button>
        </div>
      </div>

      <div className="print-target">
        <p className="hidden print:block text-lg font-black">
          Patron Raporu — {shopProfile.storeName || 'Dükkanım'} <span className="text-sm font-bold text-stone-500">(son 7 gün: {data.weekLabel})</span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> Tahsilat
            </p>
            <p className="mt-0.5 text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(data.income)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center justify-center gap-1">
              <TrendingDown className="w-3 h-3" /> Gider
            </p>
            <p className="mt-0.5 text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">{formatCurrency(data.expense)}</p>
          </div>
          <div className={`rounded-xl border px-3 py-2.5 text-center ${data.net >= 0 ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900/50' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/50'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Net</p>
            <p className={`mt-0.5 text-base sm:text-lg font-black ${data.net >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(data.net)}
            </p>
          </div>
        </div>

        <p className="mt-2 text-[11px] font-bold text-stone-500 dark:text-stone-400">
          Geçen hafta tahsilat: {formatCurrency(data.prevIncome)}
          {data.prevIncome > 0 && (
            <span className={diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
              {' '}({diff >= 0 ? '+' : ''}{formatCurrency(diff)})
            </span>
          )}
          {' '}· Yazılan veresiye: {formatCurrency(data.veresiye)}
        </p>

        <div className="mt-3 grid sm:grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 px-3.5 py-3">
            <p className="text-[11px] font-black text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
              <HandCoins className="w-3.5 h-3.5 text-amber-500" />
              En borçlu 5 <span className="text-stone-400 font-bold">· toplam {formatCurrency(data.totalDebt)} ({data.debtorCount} kişi)</span>
            </p>
            {data.debtors.length === 0 ? (
              <p className="mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">Bekleyen alacak yok. 🎉</p>
            ) : (
              <ol className="mt-1.5 space-y-1">
                {data.debtors.map((c, i) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
                    <span className="truncate">{i + 1}. {c.name}</span>
                    <span className="shrink-0 font-black text-rose-500">{formatCurrency(c.balance || 0)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 px-3.5 py-3">
            <p className="text-[11px] font-black text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
              <TriangleAlert className="w-3.5 h-3.5 text-rose-500" />
              Kritik stok ({data.critical.length})
            </p>
            {data.critical.length === 0 ? (
              <p className="mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">Stoklar yeterli. ✅</p>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {data.critical.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 font-black text-rose-500">{p.currentStock} / {p.criticalThreshold} {p.unit}</span>
                  </li>
                ))}
                {data.critical.length > 5 && (
                  <li className="text-[11px] font-bold text-stone-400">+{data.critical.length - 5} ürün daha</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
