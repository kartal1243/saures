// Yerel gun anahtarlari. Backend islem tarihlerini yerel gune gore yazar
// ("2026-09-27 14:30"). toISOString() UTC dondurur; Turkiye'de (UTC+3) gun
// donumlerinde ve gece yarisi yerel tarihli kovalar 1 gun kayar.
// Grafiklerde gun eslestirme icin DAIMA bunlari kullan, toISOString asla.

/** Yerel YYYY-MM-DD */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** "YYYY-MM-DD" -> yerel gece yarisi Date (new Date(str) UTC parse eder, kullanma) */
export function parseDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

/** Verilen gunun yerel gece yarisi */
export function midnight(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
