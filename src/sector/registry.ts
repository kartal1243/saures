// Config okuma katmanı: UI ve API bu fonksiyonlar üzerinden konuşur,
// SECTOR_CONFIG objesine doğrudan gömülü varsayım yazılmaz.

import { isBusinessType, type BusinessType } from './businessTypes';
import { SECTOR_CONFIG, legacySectorToBusinessType, type ModuleKey, type NavItem } from './sectorConfig';

export function getSectorConfig(businessType?: unknown): (typeof SECTOR_CONFIG)[BusinessType] {
  if (isBusinessType(businessType)) return SECTOR_CONFIG[businessType];
  return SECTOR_CONFIG.common;
}

/** Eski profil (sectorKey) veya yeni profil (businessType) -> tek config */
export function getSectorConfigForProfile(profile?: {
  businessType?: unknown;
  sectorKey?: string;
}): (typeof SECTOR_CONFIG)[BusinessType] {
  if (isBusinessType(profile?.businessType)) return SECTOR_CONFIG[profile.businessType];
  return SECTOR_CONFIG[legacySectorToBusinessType(profile?.sectorKey)];
}

export function isModuleEnabled(businessType: unknown, module: ModuleKey): boolean {
  return getSectorConfig(businessType).modules[module] ?? false;
}

export interface SidebarGroups {
  primary: NavItem[];
  secondary: NavItem[];
}

export function getSidebarNav(businessType: unknown): SidebarGroups {
  const { nav } = getSectorConfig(businessType);
  return {
    primary: nav.filter((n) => !n.secondary),
    secondary: nav.filter((n) => n.secondary),
  };
}

/** Multi-tenancy guard: shop kapsamı olmayan sorguyu en başta patlatır. */
export function requireShopScope<T extends { shopId?: unknown }>(filter: T, shopId: unknown): T & { shopId: string } {
  if (typeof shopId !== 'string' || shopId.length === 0) {
    throw new Error('shopId zorunlu (tenant izolasyonu)');
  }
  return { ...filter, shopId };
}
