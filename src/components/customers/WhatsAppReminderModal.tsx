import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { formatCurrency, formatPhoneNumber, cleanPhoneForWhatsApp } from '../../utils/formatters';
import { X, MessageSquare, Sparkles, Send, Copy, Check } from 'lucide-react';

interface WhatsAppReminderModalProps {
  customer: Customer | null;
  defaultType?: 'veresiye' | 'aidat' | 'bakim';
  onClose: () => void;
  onReminderSent: (log: { customerId: string; channel: 'whatsapp' | 'sms'; message: string; type: string }) => void;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  customer,
  defaultType = 'veresiye',
  onClose,
  onReminderSent,
}) => {
  if (!customer) return null;

  const [reminderType, setReminderType] = useState<'veresiye' | 'aidat' | 'bakim'>(
    defaultType || (customer.businessCategory === 'teknik_servis' ? 'bakim' : customer.subscriptionPlan?.enabled ? 'aidat' : 'veresiye')
  );
  const [tone, setTone] = useState<'kibar' | 'esnaf' | 'resmi'>('esnaf');
  const [message, setMessage] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [sendingApi, setSendingApi] = useState<boolean>(false);

  // Default templates
  const getPresetMessage = (selectedType: string, selectedTone: string) => {
    const name = customer.name;
    const balance = customer.balance;
    const nextDue = customer.subscriptionPlan?.nextDueDate;

    if (selectedType === 'aidat') {
      if (selectedTone === 'esnaf') {
        return `Selamlar ${name}, yeni dönem aidat/üyelik zamanı gelmiştir. Kalan tutar: ${balance} TL. Müsait olduğunuzda hallederiz, hayırlı günler dileriz.`;
      } else if (selectedTone === 'resmi') {
        return `Sayın ${name}, ${nextDue ? `${nextDue} vadeli ` : ''}dönemsel aidat/üyelik bedeliniz ${balance} TL olarak yansımıştır. Bilgilerinize sunarız.`;
      }
      return `Merhaba ${name}, ${customer.subscriptionPlan?.title || 'üyelik'} aidat döneminiz gelmiştir. Bakiye: ${balance} TL. Gösterdiğiniz ilgiye teşekkür ederiz.`;
    }

    if (selectedType === 'bakim') {
      if (selectedTone === 'esnaf') {
        return `Selamlar ${name}, cihazınızın periyodik bakım zamanı geldi. Uygun bir gün için randevulaşalım, kolaylıklar dileriz.`;
      } else if (selectedTone === 'resmi') {
        return `Sayın ${name}, teknik servis periyodik bakım ve kontrol randevunuz yaklaşmaktadır. Randevu oluşturmak için lütfen yanıtlayınız.`;
      }
      return `Merhaba ${name}, periyodik cihaz bakım ve kontrol zamanınız gelmiştir. Detaylı bilgi ve randevu için bize ulaşabilirsiniz.`;
    }

    // veresiye / genel bakiye
    if (selectedTone === 'esnaf') {
      return `Selamlar ${name}, dükkan hesabınızda ${formatCurrency(balance)} veresiye bakiyeniz bulunmaktadır. Müsait olduğunuzda uğrarsanız seviniriz, hayırlı işler, bereketli günler.`;
    } else if (selectedTone === 'resmi') {
      return `Sayın ${name}, işletmemizde adınıza kayıtlı ${formatCurrency(balance)} tutarındaki cari bakiyenizi bilginize sunar, iyi çalışmalar dileriz.`;
    }
    return `Merhaba ${name}, hesabınızda kalan ${formatCurrency(balance)} bakiyeyi hatırlatmak istedik. Gösterdiğiniz anlayış için teşekkür eder, hayırlı günler dileriz.`;
  };

  useEffect(() => {
    setMessage(getPresetMessage(reminderType, tone));
  }, [customer, reminderType, tone]);

  // AI Generator with Gemini
  const handleGenerateWithGemini = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/reminders/gemini-craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name,
          balance: customer.balance,
          businessType: customer.businessCategory,
          reminderType,
          tone,
          customNote: customer.notes,
          nextDueDate: customer.subscriptionPlan?.nextDueDate,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessage(data.message);
      }
    } catch (err) {
      console.error('Gemini generator failed:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Open Direct WhatsApp Link
  const handleOpenWhatsApp = () => {
    const phone = cleanPhoneForWhatsApp(customer.phone);
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encoded}`;

    // Record the reminder log on server
    onReminderSent({
      customerId: customer.id,
      channel: 'whatsapp',
      message,
      type: reminderType,
    });

    window.open(url, '_blank');
    onClose();
  };

  // Simulate or Trigger Server-side SMS / WhatsApp Business API Webhook
  const handleSendViaApi = async () => {
    setSendingApi(true);
    try {
      await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          channel: 'sms',
          message,
          type: reminderType,
        }),
      });

      onReminderSent({
        customerId: customer.id,
        channel: 'sms',
        message,
        type: reminderType,
      });

      onClose();
    } catch (err) {
      console.error('Failed to trigger API reminder:', err);
    } finally {
      setSendingApi(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div
        className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                WhatsApp &amp; SMS Hatırlatma
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {customer.name} ({formatPhoneNumber(customer.phone)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Current Debt or Plan reminder badge */}
          <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
            <div>
              <span className="text-stone-500 dark:text-stone-400 font-medium">Güncel Bakiye:</span>{' '}
              <span className="font-extrabold text-amber-700 dark:text-amber-400 text-sm">{formatCurrency(customer.balance)}</span>
            </div>
            {customer.subscriptionPlan?.enabled && (
              <div>
                <span className="text-stone-500 dark:text-stone-400 font-medium">Vade:</span>{' '}
                <span className="font-bold text-stone-800 dark:text-stone-200">{customer.subscriptionPlan.nextDueDate}</span>
              </div>
            )}
          </div>

          {/* Reminder Subject Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Hatırlatma Konusu
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReminderType('veresiye')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  reminderType === 'veresiye'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                Veresiye Borcu
              </button>
              <button
                type="button"
                onClick={() => setReminderType('aidat')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  reminderType === 'aidat'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                Aidat / Abonelik
              </button>
              <button
                type="button"
                onClick={() => setReminderType('bakim')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  reminderType === 'bakim'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                Servis &amp; Bakım
              </button>
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Üslup / Esnaf Dili
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTone('esnaf')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  tone === 'esnaf'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                Esnaf Samimiyeti
              </button>
              <button
                type="button"
                onClick={() => setTone('kibar')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  tone === 'kibar'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                Kibar &amp; Dostane
              </button>
              <button
                type="button"
                onClick={() => setTone('resmi')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  tone === 'resmi'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                Resmi &amp; Kurumsal
              </button>
            </div>
          </div>

          {/* Message Area & Gemini Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Gönderilecek Mesaj Metni
              </label>
              <button
                type="button"
                onClick={handleGenerateWithGemini}
                disabled={loadingAi}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                title="Gemini AI ile bu müşteriye özel nazik mesaj hazırla"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{loadingAi ? 'Üretiliyor...' : 'Yapay Zeka ile Yaz'}</span>
              </button>
            </div>

            <textarea
              id="textarea-reminder-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
              placeholder="Mesaj metnini buraya yazabilir veya düzenleyebilirsiniz..."
            />

            <div className="flex items-center justify-between mt-1 text-[11px] text-stone-400 dark:text-stone-500">
              <span>{message.length} karakter</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Kopyalandı' : 'Metni Kopyala'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleSendViaApi}
            disabled={sendingApi}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            title="Sisteme kayıt et ve SMS servis simülasyonu çalıştır"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingApi ? 'Kaydediliyor...' : 'Sistemden SMS Olarak Kaydet'}</span>
          </button>

          <button
            id="btn-send-whatsapp-modal"
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp ile Aç ve Gönder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
