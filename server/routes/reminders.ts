import type { Express, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import type { ReminderLog } from '../../src/types';
import { S, saveState } from '../context';
import { broadcast } from '../realtime';

export function registerReminderRoutes(app: Express): void {
  // 6. Record Reminder Sent (WhatsApp / SMS)
  app.post('/api/reminders/send', (req: Request, res: Response) => {
    const { customerId, channel, message, type } = req.body;
    const customer = S().customers.find((c) => c.id === customerId);

    const reminderLog: ReminderLog = {
      id: `rem_${Date.now()}`,
      customerId: customerId || '',
      customerName: customer ? customer.name : 'Müşteri',
      phone: customer ? customer.phone : '',
      channel: channel || 'whatsapp',
      message: message || '',
      status: 'gonderildi',
      sentAt: new Date().toLocaleString('tr-TR'),
      type: type || 'veresiye',
    };

    S().reminderLogs.unshift(reminderLog);
    saveState();

    broadcast({ type: 'REMINDER_SENT', payload: reminderLog });
    res.json({ success: true, reminderLog });
  });

  // 7. Gemini AI Smart Reminder Crafter
  app.post('/api/reminders/gemini-craft', async (req: Request, res: Response) => {
    const { customerName, balance, businessType, reminderType, tone, customNote, nextDueDate } = req.body;

    // Fallback template generator if no API key or on error
    const fallbackMessage = (t: string) => {
      if (reminderType === 'aidat') {
        return `İyi günler ${customerName}, ${nextDueDate ? `${nextDueDate} tarihli ` : ''}üyelik aidat dönemi gelmiştir. Kalan tutar: ${balance} TL'dir. Kolaylıklar dileriz.`;
      } else if (reminderType === 'bakim') {
        return `Merhaba ${customerName}, periyodik cihaz bakım ve kontrol zamanınız gelmiştir. Randevu için bize bu numaradan ulaşabilirsiniz. Hayırlı günler dileriz.`;
      }
      if (t === 'esnaf') {
        return `Selamlar ${customerName}, dükkan hesabınızda ${balance} TL bakiyeniz bulunmaktadır. Müsait olduğunuzda uğrarsanız seviniriz, hayırlı işler, bereketli günler.`;
      } else if (t === 'resmi') {
        return `Sayın ${customerName}, işletmemizde kayıtlı ${balance} TL tutarındaki cari bakiyenizi bilginize sunar, iyi çalışmalar dileriz.`;
      }
      return `Merhaba ${customerName}, hesabınızda kalan ${balance} TL bakiyeyi hatırlatmak istedik. Gösterdiğiniz ilgiye teşekkür eder, hayırlı günler dileriz.`;
    };

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ message: fallbackMessage(tone || 'kibar') });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Sen Türkiye'deki samimi, saygılı ve dürüst bir mahalle esnafı veya KOBİ işletmecisisin.
Aşağıdaki müşteri için WhatsApp veya SMS üzerinden gönderilecek, kaba olmayan, müşteriyi kırmayacak ama borcunu veya periyodik ödemesini/bakımını hatırlatacak bir mesaj hazırla.

Bilgiler:
- Müşteri Adı: ${customerName}
- Kalan Bakiye: ${balance} TL
- İşletme Türü: ${businessType || 'Mahalle İşletmesi'}
- Hatırlatma Konusu: ${reminderType || 'Veresiye / Bakiye'}
- İstenen Üslup / Ton: ${tone || 'Kibar & Samimi'} (seçenekler: esnaf_samimiyeti, kibar, resmi)
- Özel Not / Detay: ${customNote || 'Yok'}
${nextDueDate ? `- Son Ödeme / Randevu Tarihi: ${nextDueDate}` : ''}

Kurallar:
1. Sadece doğrudan gönderilecek Türkçe mesaj metnini üret. Tırnak işareti, başlık veya açıklama ekleme.
2. Mesaj 2-3 cümleyi geçmesin, WhatsApp'ta kolay okunabilir ve sıcak olsun.
3. Kaba, icra dili gibi soğuk ifadeler ASLA kullanma; esnaf nezaketiyle yaz.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const generated = response.text ? response.text.trim() : fallbackMessage(tone);
      res.json({ message: generated });
    } catch (err) {
      console.error('Gemini crafting error, using fallback:', err);
      res.json({ message: fallbackMessage(tone || 'kibar') });
    }
  });
}
