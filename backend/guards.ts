import type { Request, Response, NextFunction } from 'express';
import { accountFromRequest, type Account } from './accounts';
import { loadShopState } from './shopState';
import { als } from './context';
import { AUTH_RATE_LIMIT } from './config';

// Koruma: /api/* icin giris zorunlu (auth ve health haric) + rol kisitlari
const CASHIER_FORBIDDEN_ALWAYS = ['/backup'];
const CASHIER_FORBIDDEN_MUTATION = ['/shop-profile', '/products', '/vip/', '/cases'];

export function apiGuard(req: Request, res: Response, next: NextFunction): void {
  const p = req.path;
  if (p === '/health' || p.startsWith('/auth/')) return next();
  const acc = accountFromRequest(req);
  if (!acc) {
    res.status(401).json({ error: 'Lutfen giris yapin.' });
    return;
  }
  const accRole = acc.role || 'owner';
  if (accRole === 'cashier') {
    if (CASHIER_FORBIDDEN_ALWAYS.some((o) => p.startsWith(o))) {
      res.status(403).json({ error: 'Bu islem sadece dukkan sahibine aciktir.' });
      return;
    }
    if (req.method !== 'GET' && CASHIER_FORBIDDEN_MUTATION.some((o) => p.startsWith(o))) {
      res.status(403).json({ error: 'Bu islem sadece dukkan sahibine aciktir.' });
      return;
    }
  }
  als.run({ accountId: acc.id, role: accRole, state: loadShopState(acc.id) }, next);
}

// Sadece dukkan sahibi (owner) icin yardimci: oturum yoksa 401, rol degilse 403
export function requireOwner(req: Request, res: Response): Account | null {
  const acc = accountFromRequest(req);
  if (!acc) {
    res.status(401).json({ error: 'Oturum bulunamadi.' });
    return null;
  }
  if ((acc.role || 'owner') !== 'owner') {
    res.status(403).json({ error: 'Bu islem sadece dukkan sahibine aciktir.' });
    return null;
  }
  return acc;
}

// Kaba hız limiti (bellek içi, tek instance): pencere başına en fazla N istek
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const slot = hits.get(key);
  if (!slot || slot.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + AUTH_RATE_LIMIT.windowMs });
    return next();
  }
  slot.count += 1;
  if (slot.count > AUTH_RATE_LIMIT.max) {
    res.status(429).json({ error: 'Cok fazla istek. Biraz bekleyip tekrar deneyin.' });
    return;
  }
  return next();
}
