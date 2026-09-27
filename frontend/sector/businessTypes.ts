// Sektörel Bukalemun — işletme tipi tanımı.
// Profildeki `business_type` alanının tek doğruluk kaynağı budur.

export const BUSINESS_TYPES = ['barber', 'lawyer', 'retail', 'service', 'common'] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  barber: 'Berber / Güzellik Salonu',
  lawyer: 'Avukat / Danışman',
  retail: 'Market / Perakende',
  service: 'Teknik Servis',
  common: 'Genel Esnaf',
};

export function isBusinessType(v: unknown): v is BusinessType {
  return typeof v === 'string' && (BUSINESS_TYPES as readonly string[]).includes(v);
}
