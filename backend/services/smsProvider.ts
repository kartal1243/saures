import { normalizePhone, isValidTurkishPhone } from '../accounts';

export interface SmsSendResult {
  sent: boolean;
  simulated: boolean;
  provider: string;
  whatsappLink: string;
  error?: string;
  statusCode?: number;
}

export interface SmsGatewayStatus {
  configured: boolean;
  provider: string;
  sender: string;
  mode: 'live' | 'fallback_whatsapp';
}

export function normalizeTurkishGsm(phone: string): string {
  const norm = normalizePhone(String(phone || ''));
  if (!norm || !isValidTurkishPhone(norm)) return '';
  // 05xxxxxxxxx -> 905xxxxxxxxx
  return '9' + norm;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const gsm = normalizeTurkishGsm(phone);
  const fallbackDigits = String(phone || '').replace(/\D/g, '');
  const target = gsm || (fallbackDigits.startsWith('05') ? '9' + fallbackDigits : fallbackDigits);
  const text = encodeURIComponent(String(message || ''));
  return target ? `https://wa.me/${target}?text=${text}` : `https://wa.me/?text=${text}`;
}

function resolveProviderConfig(): {
  configured: boolean;
  provider: string;
  apiKey: string;
  apiSecret: string;
  usercode: string;
  sender: string;
  webhookUrl: string;
} {
  const provider = (process.env.SMS_PROVIDER || '').trim().toLowerCase();
  const apiKey = (process.env.SMS_API_KEY || '').trim();
  const apiSecret = (process.env.SMS_API_SECRET || '').trim();
  const usercode = (process.env.SMS_USERCODE || '').trim();
  const sender = (process.env.SMS_SENDER || 'DUKKANIM').trim();
  const webhookUrl = (process.env.SMS_WEBHOOK_URL || '').trim();

  let configured = false;
  if (provider === 'netgsm') {
    configured = Boolean(usercode && (apiSecret || apiKey));
  } else if (provider === 'iletimerkezi') {
    configured = Boolean(apiKey && apiSecret);
  } else if (provider === 'vatansms') {
    configured = Boolean(apiKey && apiSecret && usercode);
  } else if (provider === 'webhook') {
    configured = Boolean(webhookUrl);
  }

  return {
    configured,
    provider: configured ? provider : 'fallback_whatsapp',
    apiKey,
    apiSecret,
    usercode,
    sender,
    webhookUrl,
  };
}

export function getSmsGatewayStatus(): SmsGatewayStatus {
  const cfg = resolveProviderConfig();
  return {
    configured: cfg.configured,
    provider: cfg.provider,
    sender: cfg.sender,
    mode: cfg.configured ? 'live' : 'fallback_whatsapp',
  };
}

export async function sendSmsMessage(
  phone: string,
  message: string,
  options?: { category?: string }
): Promise<SmsSendResult> {
  const gsm = normalizeTurkishGsm(phone);
  const cleanMessage = String(message || '').trim();
  const whatsappLink = buildWhatsAppLink(phone, cleanMessage);

  if (!gsm) {
    return {
      sent: false,
      simulated: true,
      provider: 'fallback_whatsapp',
      whatsappLink,
      error: 'Geçersiz Türkiye GSM numarası.',
    };
  }

  if (!cleanMessage) {
    return {
      sent: false,
      simulated: true,
      provider: 'fallback_whatsapp',
      whatsappLink,
      error: 'SMS mesaj metni boş olamaz.',
    };
  }

  const cfg = resolveProviderConfig();
  if (!cfg.configured) {
    return {
      sent: false,
      simulated: true,
      provider: 'fallback_whatsapp',
      whatsappLink,
    };
  }

  try {
    const signal = AbortSignal.timeout(8000);

    if (cfg.provider === 'netgsm') {
      const body = new URLSearchParams({
        usercode: cfg.usercode,
        password: cfg.apiSecret || cfg.apiKey,
        gsmno: gsm,
        message: cleanMessage,
        msgheader: cfg.sender,
        dil: 'TR',
      });
      const resp = await fetch('https://api.netgsm.com.tr/sms/send/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal,
      });
      const text = (await resp.text()).trim();
      const ok = resp.ok && /^(00|01|02)\b/.test(text);
      return {
        sent: ok,
        simulated: false,
        provider: 'netgsm',
        whatsappLink,
        statusCode: resp.status,
        error: ok ? undefined : `NetGSM yanıtı: ${text.slice(0, 120)}`,
      };
    }

    if (cfg.provider === 'iletimerkezi') {
      const payload = {
        request: {
          authentication: {
            key: cfg.apiKey,
            hash: cfg.apiSecret,
          },
          order: {
            sender: cfg.sender,
            sendDateTime: [],
            iys: '1',
            iysList: 'BIREYSEL',
            message: {
              text: cleanMessage,
              receipents: {
                number: [gsm],
              },
            },
          },
        },
      };
      const resp = await fetch('https://api.iletimerkezi.com/v1/send-sms/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });
      const ok = resp.ok;
      return {
        sent: ok,
        simulated: false,
        provider: 'iletimerkezi',
        whatsappLink,
        statusCode: resp.status,
        error: ok ? undefined : `İletiMerkezi HTTP ${resp.status}`,
      };
    }

    if (cfg.provider === 'vatansms') {
      const payload = {
        api_id: cfg.usercode,
        api_key: cfg.apiKey,
        sender: cfg.sender,
        message_type: 'turkce',
        message: cleanMessage,
        phones: [gsm],
      };
      const resp = await fetch('https://api.vatansms.net/api/v1/1toN', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });
      return {
        sent: resp.ok,
        simulated: false,
        provider: 'vatansms',
        whatsappLink,
        statusCode: resp.status,
        error: resp.ok ? undefined : `VatanSMS HTTP ${resp.status}`,
      };
    }

    if (cfg.provider === 'webhook') {
      const resp = await fetch(cfg.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
        },
        body: JSON.stringify({
          phone: gsm,
          message: cleanMessage,
          sender: cfg.sender,
          category: options?.category || 'general',
        }),
        signal,
      });
      return {
        sent: resp.ok,
        simulated: false,
        provider: 'webhook',
        whatsappLink,
        statusCode: resp.status,
        error: resp.ok ? undefined : `Webhook HTTP ${resp.status}`,
      };
    }
  } catch (err: any) {
    return {
      sent: false,
      simulated: false,
      provider: cfg.provider,
      whatsappLink,
      error: err?.message || 'SMS sağlayıcısına bağlanılamadı.',
    };
  }

  return {
    sent: false,
    simulated: true,
    provider: 'fallback_whatsapp',
    whatsappLink,
  };
}
