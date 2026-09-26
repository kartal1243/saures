import React from 'react';
import { Customer, Transaction, ReminderLog } from '../types';
import { formatCurrency, formatPhoneNumber, getCategoryColor, getCategoryLabel, cleanPhoneForWhatsApp } from '../utils/formatters';
import { X, ArrowUpRight, ArrowDownLeft, MessageSquare, Phone, Clock, Trash2, Calendar, FileText } from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  transactions: Transaction[];
  reminderLogs: ReminderLog[];
  onClose: () => void;
  onOpenTransaction: (customer: Customer, type: 'veresiye' | 'tahsilat') => void;
  onOpenWhatsApp: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  transactions,
  reminderLogs,
  onClose,
  onOpenTransaction,
  onOpenWhatsApp,
  onDeleteCustomer,
}) => {
  if (!customer) return null;

  const catColor = getCategoryColor(customer.businessCategory);

  // Filter transactions for this customer
  const customerTx = transactions.filter((t) => t.customerId === customer.id);
  const customerLogs = reminderLogs.filter((l) => l.customerId === customer.id);

  // Generate a friendly esnaf-style WhatsApp statement
  const handleShareStatement = () => {
    let text = `Selamlar ${customer.name},\n\nDükkanımızdaki güncel veresiye hesap özetiniz:\n`;
    text += `*Kalan Borç Tutarı: ${formatCurrency(customer.balance)}*\n`;
    if (customer.subscriptionPlan?.enabled) {
      text += `Düzenli Plan: ${customer.subscriptionPlan.title} (Sonraki Vade: ${customer.subscriptionPlan.nextDueDate})\n`;
    }
    text += `\nSon Defter Hareketleri:\n`;
    customerTx.slice(0, 5).forEach((tx) => {
      text += `• ${tx.date}: ${tx.type === 'veresiye' ? '+' : '-'}${tx.amount} TL (${tx.description})\n`;
    });
    text += `\nHayırlı ve bereketli günler dileriz.`;

    const encoded = encodeURIComponent(text);
    const phone = cleanPhoneForWhatsApp(customer.phone);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div
        className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
                {customer.name}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                {getCategoryLabel(customer.businessCategory)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1 flex-wrap">
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-1 text-stone-700 dark:text-stone-300 font-medium hover:text-amber-600 dark:hover:text-amber-400"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{formatPhoneNumber(customer.phone)}</span>
              </a>
              <span>•</span>
              <span>Defter Kaydı: {customer.createdAt}</span>
            </div>
          </div>

          <button
            id="btn-close-customer-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance & Recurring Plan Card */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Balance */}
          <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">Defterdeki Borç Tutarı</span>
              <div
                className={`text-xl sm:text-2xl font-black mt-0.5 ${
                  customer.balance > 0
                    ? 'text-amber-700 dark:text-amber-400'
                    : customer.balance === 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-indigo-700 dark:text-indigo-400'
                }`}
              >
                {formatCurrency(customer.balance)}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                {customer.balance > 0
                  ? 'Müşterinin dükkana olan veresiye borcu'
                  : 'Hesap kapalı, borcu bulunmuyor'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => onOpenTransaction(customer, 'veresiye')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Borç Yaz</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenTransaction(customer, 'tahsilat')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Para Aldım</span>
              </button>
            </div>
          </div>

          {/* Subscription / Recurring Plan Info */}
          <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400">Düzenli Ödeme / Aidat / Bakım</span>
                {customer.subscriptionPlan?.enabled && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                    Aktif
                  </span>
                )}
              </div>
              {customer.subscriptionPlan?.enabled ? (
                <div className="mt-1">
                  <div className="text-sm font-bold text-stone-900 dark:text-white">
                    {customer.subscriptionPlan.title}
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2 mt-0.5">
                    <span className="font-semibold">{formatCurrency(customer.subscriptionPlan.amount)}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-400 font-medium">
                      <Clock className="w-3 h-3" /> Sonraki: {customer.subscriptionPlan.nextDueDate}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                  Tanımlı aylık aidat veya periyodik ödeme planı yok.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => onOpenWhatsApp(customer)}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Hatırlat</span>
              </button>
              <button
                type="button"
                onClick={handleShareStatement}
                className="py-1.5 px-2.5 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                title="WhatsApp ile özet hesap dökümü paylaş"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hesap Özeti Gönder</span>
              </button>
            </div>
          </div>
        </div>

        {/* Customer Notes if present */}
        {customer.notes && (
          <div className="px-4 sm:px-5 py-2.5 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <span className="font-bold">Not:</span>
            <span>{customer.notes}</span>
          </div>
        )}

        {/* Ledger & Transactions History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-3 flex items-center justify-between">
            <span>Veresiye Defteri Hareketleri ({customerTx.length})</span>
            <span className="text-xs font-normal text-stone-500 dark:text-stone-400">Tarihe göre sıralı</span>
          </h3>

          {customerTx.length === 0 ? (
            <div className="text-center py-8 text-stone-400 dark:text-stone-500 text-xs">
              Henüz bu müşteriye ait defter kaydı bulunmuyor.
            </div>
          ) : (
            <div className="space-y-2">
              {customerTx.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-800/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold mt-0.5 ${
                        tx.type === 'veresiye'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {tx.type === 'veresiye' ? '+' : '-'}
                    </span>
                    <div>
                      <div className="font-semibold text-stone-900 dark:text-white text-sm">{tx.description}</div>
                      <div className="text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {tx.date}
                        </span>
                        <span>•</span>
                        <span className="capitalize font-medium text-stone-700 dark:text-stone-300">
                          {tx.paymentMethod === 'nakit'
                            ? 'Nakit Elden'
                            : tx.paymentMethod === 'kart'
                            ? 'Kredi Kartı Pos'
                            : tx.paymentMethod === 'havale'
                            ? 'Havale/IBAN'
                            : 'Veresiye Yazıldı'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black text-sm sm:text-base ${
                        tx.type === 'veresiye' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {tx.type === 'veresiye' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-semibold">
                      {tx.type === 'veresiye' ? 'Borç Yazıldı' : 'Ödeme Alındı'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past WhatsApp reminders sent */}
          {customerLogs.length > 0 && (
            <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800">
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gönderilen WhatsApp &amp; SMS Hatırlatmaları ({customerLogs.length})</span>
              </h4>
              <div className="space-y-1.5">
                {customerLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-stone-700 dark:text-stone-300">
                    <div className="flex items-center justify-between font-semibold text-emerald-900 dark:text-emerald-300 mb-0.5">
                      <span>WhatsApp Hatırlatması</span>
                      <span className="text-stone-500 dark:text-stone-400 font-normal">{log.sentAt}</span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-300 italic">"{log.message}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm(`"${customer.name}" adlı müşteriyi ve defterdeki tüm kayıtlarını silmek istediğinize emin misiniz?`)) {
                onDeleteCustomer(customer.id);
                onClose();
              }
            }}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Müşteriyi Defterden Sil</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
