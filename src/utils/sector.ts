import type { BusinessSector } from '../types';

/** Dükkan alanı metninden sektör anahtarı türet (tek doğruluk kaynağı). */
export function deriveSector(businessField?: string): BusinessSector {
  const f = businessField || '';
  if (f.includes('Berber') || f.includes('Kuaför')) return 'berber_kuafor';
  if (f.includes('Kafe') || f.includes('Restoran')) return 'kafe_restoran';
  if (f.includes('Tamir') || f.includes('Teknik') || f.includes('Oto')) return 'teknik_servis';
  if (f.includes('Avukat') || f.includes('Danışman') || f.includes('Hukuk')) return 'avukat_danisman';
  if (f.includes('Bakkal') || f.includes('Market')) return 'bakkal_market';
  return 'diger_esnaf';
}
