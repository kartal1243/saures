import type { Request, Response, NextFunction } from 'express';
import { accountFromRequest, clientIp, touchActiveSession, type Account } from './accounts';
import { loadShopState } from './shopState';
import { als } from './context';
import { AUTH_RATE_LIMIT } from './config';

// Koruma: /api/* icin giris zorunlu (auth ve health haric) + rol kisitlari
// NOT: Personel girisi kaldirildi — panelde sadece dukkan sahibi (owner) olur.
// Personel kaydi olan hesaplar API'ye erisemez (eski oturumlar da gecersiz).
export function apiGuard(req: Request, res: Response, next: NextFunction): void {
  const p = req.path;
  if (p === '/health' || p.startsWith('/auth/')) return next();
  const acc = accountFromRequest(req);
  if (!acc) {
    res.status(401).json({ error: 'Lutfen giris yapin.' });
    return;
  }
  const accRole = acc.role || 'owner';
  if (accRole !== 'owner') {
    res.status(403).json({ error: 'Personel girisi kapali. Bu panel sadece dukkan sahibine aciktir.' });
    return;
  }
  // Canlı hareket takibi: son 5 dakikalık aktiflik heartbeat'i
  touchActiveSession(acc.id, clientIp(req), (req.headers['user-agent'] as string) || '');

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
export function createRateLimiter(windowMs: number, max: number) {
  const bucket = new Map<string, { count: number; resetAt: number }>();
  let calls = 0;

  return function limiter(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    calls += 1;
    // Bellek şişmesini önlemek için her 500 istekte süresi dolmuş kayıtları temizle
    if (calls % 500 === 0) {
      for (const [k, v] of bucket.entries()) {
        if (v.resetAt <= now) bucket.delete(k);
      }
    }

    const key = clientIp(req);
    const slot = bucket.get(key);
    if (!slot || slot.resetAt <= now) {
      bucket.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    slot.count += 1;
    if (slot.count > max) {
      res.status(429).json({ error: 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.' });
      return;
    }
    return next();
  };
}

export const rateLimit = createRateLimiter(AUTH_RATE_LIMIT.windowMs, AUTH_RATE_LIMIT.max);
export const publicActionRateLimit = createRateLimiter(60 * 1000, 12);
export const aiRateLimit = createRateLimiter(60 * 1000, 8);
