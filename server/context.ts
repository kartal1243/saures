import { AsyncLocalStorage } from 'async_hooks';
import type { AppState } from '../src/types';
import { persistShopState } from './shopState';

// Istek baglami: her HTTP/ws istegi kendi dukkaninin state'i ile calisir
export type ReqCtx = { accountId: string; state: AppState; role: string };

export const als = new AsyncLocalStorage<ReqCtx>();

export function S(): AppState {
  const ctx = als.getStore();
  if (!ctx) throw new Error('Istek baglami bulunamadi (auth middleware disinda cagri?)');
  return ctx.state;
}

export function saveState(): void {
  const ctx = als.getStore();
  if (!ctx) {
    console.error('saveState cagrisi baglam disinda, yok sayildi.');
    return;
  }
  persistShopState(ctx.accountId, ctx.state);
}
