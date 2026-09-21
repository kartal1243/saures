import { BusinessType, SubscriptionInterval } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9, 11)}`;
  }
  if (cleaned.length === 10) {
    return `0${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }
  return phone;
}

export function cleanPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '90' + cleaned.slice(1);
  } else if (!cleaned.startsWith('90') && cleaned.length === 10) {
    cleaned = '90' + cleaned;
  }
  return cleaned;
}

export function getCategoryLabel(category: BusinessType): string {
  switch (category) {
    case 'bakkal_market':
      return 'Bakkal & Market';
    case 'spor_salonu':
      return 'Spor Salonu / Fitness';
    case 'ozel_ders':
      return 'Özel Ders / Kurs';
    case 'teknik_servis':
      return 'Teknik Servis / Bakım';
    case 'diger':
    default:
      return 'Diğer Esnaf';
  }
}

export function getCategoryColor(category: BusinessType): { bg: string; text: string; border: string } {
  switch (category) {
    case 'bakkal_market':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    case 'spor_salonu':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' };
    case 'ozel_ders':
      return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' };
    case 'teknik_servis':
      return { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' };
    case 'diger':
    default:
      return { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-200' };
  }
}

export function getIntervalLabel(interval: SubscriptionInterval): string {
  switch (interval) {
    case 'haftalik':
      return 'Haftalık';
    case 'aylik':
      return 'Aylık';
    case '3_aylik':
      return '3 Aylık';
    case 'yillik':
      return 'Yıllık';
    case 'periyodik_bakim':
      return 'Periyodik Bakım';
    default:
      return 'Yok';
  }
}

export function formatDateTurkish(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
