import crypto from 'crypto';
import path from 'path';
import type { Express, Request, Response } from 'express';
import { DATA_DIR } from '../config';
import { readJsonFile, writeJsonFile } from '../fsdb';
import { als } from '../context';
import { accountFromRequest } from '../accounts';
import {
  FIREBASE_PROJECT_ID,
  getFirebaseIntegrationStatus,
  sendFcmPushMessages,
} from '../services/firebaseService';

export interface DeviceTokenEntry {
  id: string;
  accountId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  deviceName?: string;
  createdAt: string;
  updatedAt: string;
}

const DEVICE_TOKENS_FILE = path.join(DATA_DIR, 'device_tokens.json');

function loadDeviceTokens(): DeviceTokenEntry[] {
  const list = readJsonFile<DeviceTokenEntry[]>(DEVICE_TOKENS_FILE, []);
  return Array.isArray(list) ? list : [];
}

function saveDeviceTokens(list: DeviceTokenEntry[]): void {
  writeJsonFile(DEVICE_TOKENS_FILE, list);
}

function resolveAccountId(req: Request): string | null {
  const storeAcc = als.getStore()?.accountId;
  if (storeAcc) return storeAcc;
  return accountFromRequest(req)?.id || null;
}

export function registerDeviceRoutes(app: Express): void {
  app.get('/api/devices/push-config', (req: Request, res: Response) => {
    const accountId = resolveAccountId(req);
    if (!accountId) return res.status(401).json({ error: 'Oturum gerekli.' });

    const fb = getFirebaseIntegrationStatus();
    res.json({
      success: true,
      vapidPublicKey: (process.env.VITE_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY || '').trim(),
      ...fb,
    });
  });

  app.get('/api/devices/list', (req: Request, res: Response) => {
    const accountId = resolveAccountId(req);
    if (!accountId) return res.status(401).json({ error: 'Oturum gerekli.' });

    const devices = loadDeviceTokens()
      .filter((d) => d.accountId === accountId)
      .map((d) => ({
        id: d.id,
        platform: d.platform,
        deviceName: d.deviceName || 'Cihaz',
        tokenPreview: d.token.length > 16 ? `${d.token.slice(0, 8)}...${d.token.slice(-6)}` : '***',
        updatedAt: d.updatedAt,
      }));

    res.json({ success: true, devices, count: devices.length });
  });

  app.post('/api/devices/register', (req: Request, res: Response) => {
    const accountId = resolveAccountId(req);
    if (!accountId) return res.status(401).json({ error: 'Oturum gerekli.' });

    const body = req.body || {};
    const token = String(body.token || '').trim();
    const rawPlatform = String(body.platform || 'android').trim().toLowerCase();
    const platform: 'android' | 'ios' | 'web' =
      rawPlatform === 'ios' ? 'ios' : rawPlatform === 'web' ? 'web' : 'android';
    const deviceName = body.deviceName ? String(body.deviceName).trim().slice(0, 100) : undefined;

    if (!token || token.length < 10 || token.length > 512) {
      return res.status(400).json({ error: 'Geçerli bir bildirim cihaz jetonu (token) gereklidir.' });
    }

    const nowIso = new Date().toISOString();
    // Aynı cihazda hesap değiştirildiğinde eski hesabın push token eşleşmesini temizle (cross-account leak önlemi)
    let list = loadDeviceTokens().filter((d) => !(d.token === token && d.accountId !== accountId));
    const existing = list.find((d) => d.accountId === accountId && d.token === token);

    let saved: DeviceTokenEntry;
    if (existing) {
      existing.platform = platform;
      if (deviceName) existing.deviceName = deviceName;
      existing.updatedAt = nowIso;
      saved = existing;
    } else {
      saved = {
        id: 'dev_' + crypto.randomBytes(6).toString('hex'),
        accountId,
        token,
        platform,
        deviceName,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      list.unshift(saved);
      // Hesap başına en fazla 20 cihaz tut
      const accCount = list.filter((d) => d.accountId === accountId).length;
      if (accCount > 20) {
        let kept = 0;
        list = list.filter((d) => {
          if (d.accountId !== accountId) return true;
          kept += 1;
          return kept <= 20;
        });
      }
    }

    saveDeviceTokens(list);
    const count = list.filter((d) => d.accountId === accountId).length;
    res.json({ success: true, deviceId: saved.id, count });
  });

  app.delete('/api/devices/unregister', (req: Request, res: Response) => {
    const accountId = resolveAccountId(req);
    if (!accountId) return res.status(401).json({ error: 'Oturum gerekli.' });

    const token = String((req.body && req.body.token) || req.query.token || '').trim();
    if (!token) {
      return res.status(400).json({ error: 'Kaldırılacak cihaz token bilgisi gereklidir.' });
    }

    const list = loadDeviceTokens();
    const next = list.filter((d) => !(d.accountId === accountId && d.token === token));
    const removed = next.length !== list.length;
    if (removed) saveDeviceTokens(next);

    const count = next.filter((d) => d.accountId === accountId).length;
    res.json({ success: true, removed, count });
  });
}

export async function sendPushToAccount(
  accountId: string,
  notification: { title: string; body: string; url?: string; tag?: string }
): Promise<{ sent: number; failed: number; simulated: boolean; transport?: string }> {
  const list = loadDeviceTokens();
  const targets = list.filter((d) => d.accountId === accountId);
  if (targets.length === 0) {
    return { sent: 0, failed: 0, simulated: true, transport: 'no_registered_devices' };
  }

  const pushRes = await sendFcmPushMessages(
    targets.map((d) => d.token),
    notification
  );

  if (pushRes.invalidTokens.length > 0) {
    const invalidSet = new Set(pushRes.invalidTokens);
    const cleaned = list.filter((d) => !(d.accountId === accountId && invalidSet.has(d.token)));
    saveDeviceTokens(cleaned);
  }

  return {
    sent: pushRes.sent,
    failed: pushRes.failed,
    simulated: pushRes.simulated,
    transport: pushRes.transport,
  };
}
