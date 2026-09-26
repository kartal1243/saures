import path from 'path';
import fs from 'fs';

export const PORT = 3000;
// Testler izole klasörde çalışsın diye (DATA_DIR=data_test) — gerçek dükkan verisine dokunulmaz
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

export const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
export const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
export const SHOPS_DIR = path.join(DATA_DIR, 'shops');
export const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 gun
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_MS = 15 * 60 * 1000; // 15 dakika kilit

export const JSON_BODY_LIMIT = '1mb';
// Auth uçları için kaba hız limiti (IP başına pencere)
export const AUTH_RATE_LIMIT = { windowMs: 60 * 1000, max: 40 };

// Klasörler hazır olsun (uygulama açılışındaki davranışla aynı)
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SHOPS_DIR)) {
  fs.mkdirSync(SHOPS_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}
