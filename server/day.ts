// İş günü (business day) yardımcısı: yazar kasa mantığı.
// Gün, duvar saatine göre değil "Gün Sonu Kapat" ile devrer;
// tarih damgaları yerel güne göre atılır (UTC kayması yok).

export function localDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return localDay(dt);
}

export function localTimeStr(d: Date = new Date()): string {
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
