import path from 'path';
import { SHOPS_DIR } from './config';
import { localDay } from './day';
import { readJsonFile, writeJsonFile } from './fsdb';
import { findAccountById } from './accounts';
import type { AppState } from '../src/types';

// Boş state — demo/seed/fake veri YOK, her yeni dükkan tertemiz başlar
export function emptyState(seed?: { storeName: string; ownerName: string; phone: string }): AppState {
  return {
    storeName: seed?.storeName || 'Yeni Dükkan',
    shopProfile: {
      storeName: seed?.storeName || '',
      ownerName: seed?.ownerName || '',
      businessField: 'Bakkal / Market / Büfe',
      sectorKey: 'bakkal_market',
      employeeCount: '1',
      phone: seed?.phone || '',
      cityDistrict: '',
      dailyTarget: 2500,
      slogan: '',
      isConfigured: false,
      isVip: false,
    },
    customers: [],
    transactions: [],
    reminderLogs: [],
    dailyClosings: [],
    products: [],
    stockMovements: [],
    appointments: [],
    tables: [],
    repairTickets: [],
    suppliers: [],
    services: [],
    cases: [],
    custody: [],
    businessDate: localDay(),
    lastUpdated: new Date().toISOString(),
  };
}

const shopStateCache = new Map<string, AppState>();

function shopStateFile(accountId: string): string {
  return path.join(SHOPS_DIR, accountId + '.json');
}

export function loadShopState(accountId: string): AppState {
  const cached = shopStateCache.get(accountId);
  if (cached) return cached;
  let st: AppState | null = null;
  const file = shopStateFile(accountId);
  st = readJsonFile<AppState | null>(file, null);
  if (!st || !Array.isArray(st.customers) || !Array.isArray(st.transactions)) {
    const acc = findAccountById(accountId);
    st = emptyState(acc ? { storeName: acc.shopName, ownerName: acc.ownerName, phone: acc.phone } : undefined);
    writeJsonFile(file, st);
  }
  if (!st) st = emptyState();
  if (!st.shopProfile) st.shopProfile = emptyState().shopProfile;
  if (!Array.isArray(st.dailyClosings)) st.dailyClosings = [];
  if (!Array.isArray(st.products)) st.products = [];
  if (!Array.isArray(st.stockMovements)) st.stockMovements = [];
  if (!Array.isArray(st.appointments)) st.appointments = [];
  if (!Array.isArray(st.tables)) st.tables = [];
  if (!Array.isArray(st.repairTickets)) st.repairTickets = [];
  if (!Array.isArray((st as any).suppliers)) (st as any).suppliers = [];
  if (!Array.isArray((st as any).services)) (st as any).services = [];
  if (!Array.isArray((st as any).cases)) (st as any).cases = [];
  if (!Array.isArray((st as any).custody)) (st as any).custody = [];
  if (typeof st.businessDate !== 'string' || !st.businessDate) st.businessDate = localDay();
  if (!Array.isArray(st.reminderLogs)) st.reminderLogs = [];
  shopStateCache.set(accountId, st);
  return st;
}

export function persistShopState(accountId: string, st: AppState): void {
  st.lastUpdated = new Date().toISOString();
  writeJsonFile(shopStateFile(accountId), st);
}
