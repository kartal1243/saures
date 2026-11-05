import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { DATA_DIR } from './config';
import { readJsonFile, writeJsonFile } from './fsdb';
import { clientIp } from './accounts';

export const BLOCKED_IPS_FILE = path.join(DATA_DIR, 'blocked-ips.json');
export const VISITOR_HISTORY_FILE = path.join(DATA_DIR, 'visitor-history.json');

export interface BlockedIpEntry {
  ip: string;
  reason: string;
  blockedAt: string;
  country?: string;
}

export interface VisitorRecord {
  id: string;
  ip: string;
  country: string;
  countryName: string;
  countryFlag: string;
  isForeign: boolean;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  referer: string;
  userAgent: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  isBot: boolean;
  botName?: string;
  isSuspicious: boolean;
  category: 'landing' | 'barber' | 'menu' | 'auth' | 'app' | 'admin' | 'api' | 'security_scan' | 'other';
  timestamp: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  TR: 'Türkiye',
  DE: 'Almanya',
  NL: 'Hollanda',
  US: 'ABD',
  GB: 'Birleşik Krallık',
  FR: 'Fransa',
  AZ: 'Azerbaycan',
  RU: 'Rusya',
  UA: 'Ukrayna',
  BE: 'Belçika',
  AT: 'Avusturya',
  CH: 'İsviçre',
  SE: 'İsveç',
  NO: 'Norveç',
  DK: 'Danimarka',
  IT: 'İtalya',
  ES: 'İspanya',
  GR: 'Yunanistan',
  BG: 'Bulgaristan',
  RO: 'Romanya',
  PL: 'Polonya',
  CN: 'Çin',
  SG: 'Singapur',
  CA: 'Kanada',
  AU: 'Avustralya',
  IR: 'İran',
  IQ: 'Irak',
  SY: 'Suriye',
  SA: 'Suudi Arabistan',
  AE: 'BAE',
  UZ: 'Özbekistan',
  KZ: 'Kazakistan',
  TM: 'Türkmenistan',
  KG: 'Kırgızistan',
  CY: 'KKTC / Kıbrıs',
  LOCAL: 'Yerel Ağ (Localhost)',
};

export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode === 'LOCAL' || countryCode === 'XX' || countryCode === 'T1') {
    return '🌐';
  }
  const code = countryCode.toUpperCase();
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) {
    return '🌐';
  }
  return String.fromCodePoint(
    127397 + code.charCodeAt(0),
    127397 + code.charCodeAt(1)
  );
}

export function getCountryName(countryCode: string): string {
  const code = (countryCode || '').toUpperCase();
  return COUNTRY_NAMES[code] || (code ? `Ülke (${code})` : 'Bilinmeyen');
}

// Engellenen IP Listesi
let blockedIps: BlockedIpEntry[] = readJsonFile<BlockedIpEntry[]>(BLOCKED_IPS_FILE, []);

export function getBlockedIps(): BlockedIpEntry[] {
  return blockedIps;
}

export function isIpBlocked(ip: string): boolean {
  return blockedIps.some((b) => b.ip === ip);
}

export function blockIp(ip: string, reason: string = 'Şüpheli aktivite / Manuel admin engeli', country?: string): boolean {
  if (!ip || ip === 'unknown') return false;
  if (blockedIps.some((b) => b.ip === ip)) return true;
  blockedIps.unshift({
    ip,
    reason,
    blockedAt: new Date().toISOString(),
    country,
  });
  if (blockedIps.length > 500) blockedIps = blockedIps.slice(0, 500);
  writeJsonFile(BLOCKED_IPS_FILE, blockedIps);
  return true;
}

export function unblockIp(ip: string): boolean {
  const initialLength = blockedIps.length;
  blockedIps = blockedIps.filter((b) => b.ip !== ip);
  if (blockedIps.length !== initialLength) {
    writeJsonFile(BLOCKED_IPS_FILE, blockedIps);
    return true;
  }
  return false;
}

// Ziyaretçi Günlüğü (In-Memory Ring Buffer + Başlangıçta Diske Yedekleme)
const MAX_VISITOR_RECORDS = 2000;
let visitorRecords: VisitorRecord[] = readJsonFile<VisitorRecord[]>(VISITOR_HISTORY_FILE, []).slice(0, 1000);

let lastPersistTime = Date.now();
function maybePersistVisitors(): void {
  const now = Date.now();
  // En fazla 3 dakikada bir diske kaydet (I/O tasarrufu)
  if (now - lastPersistTime > 3 * 60 * 1000) {
    lastPersistTime = now;
    writeJsonFile(VISITOR_HISTORY_FILE, visitorRecords.slice(0, 1000));
  }
}

// Bot ve Tarayıcı Tespiti
const BOT_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /googlebot/i, name: 'Googlebot' },
  { pattern: /bingbot|bingpreview|msnbot/i, name: 'Bingbot' },
  { pattern: /yandexbot|yandex/i, name: 'Yandex' },
  { pattern: /ahrefsbot/i, name: 'Ahrefs' },
  { pattern: /semrushbot/i, name: 'Semrush' },
  { pattern: /petalbot/i, name: 'PetalBot' },
  { pattern: /applebot/i, name: 'Applebot' },
  { pattern: /baiduspider/i, name: 'Baidu' },
  { pattern: /duckduckbot/i, name: 'DuckDuckGo' },
  { pattern: /facebookexternalhit/i, name: 'Facebook' },
  { pattern: /twitterbot/i, name: 'Twitter' },
  { pattern: /telegrambot/i, name: 'Telegram' },
  { pattern: /whatsapp/i, name: 'WhatsApp' },
  { pattern: /linkedinbot/i, name: 'LinkedIn' },
  { pattern: /slackbot/i, name: 'Slack' },
  { pattern: /discordbot/i, name: 'Discord' },
  { pattern: /bytespider/i, name: 'ByteDance' },
  { pattern: /gptbot|chatgpt-user/i, name: 'OpenAI GPT' },
  { pattern: /claude-web|anthropic/i, name: 'Anthropic' },
  { pattern: /curl/i, name: 'cURL' },
  { pattern: /python-requests|urllib/i, name: 'Python' },
  { pattern: /postman/i, name: 'Postman' },
  { pattern: /wget/i, name: 'Wget' },
  { pattern: /go-http-client/i, name: 'Go HTTP' },
  { pattern: /zgrab|censys|shodan|masscan|nmap/i, name: 'Güvenlik Tarayıcısı' },
];

const SUSPICIOUS_PATHS = [
  /wp-admin/i,
  /wp-login/i,
  /wp-content/i,
  /xmlrpc\.php/i,
  /\.env/i,
  /\.git/i,
  /phpmyadmin/i,
  /adminer/i,
  /cgi-bin/i,
  /setup\.cgi/i,
  /boaform/i,
  /actuator/i,
  /\.aws/i,
  /config\.json/i,
];

// Statik Dosyaları Filtrele (Log kirliliği önleme)
const STATIC_ASSET_REGEX = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map|webmanifest)$/i;
const IGNORED_PREFIXES = ['/@vite', '/@fs', '/node_modules', '/assets/'];

export function shouldIgnorePath(pathname: string): boolean {
  if (!pathname) return true;
  for (const prefix of IGNORED_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  if (STATIC_ASSET_REGEX.test(pathname.split('?')[0])) return true;
  // HMR veya Vite iç bağlantıları
  if (pathname.includes('hot-update') || pathname === '/favicon.ico') return true;
  return false;
}

export function detectCategory(p: string): VisitorRecord['category'] {
  if (SUSPICIOUS_PATHS.some((regex) => regex.test(p))) return 'security_scan';
  if (p.startsWith('/r/')) return 'barber';
  if (p.startsWith('/m/')) return 'menu';
  if (p.startsWith('/giris') || p.startsWith('/kayit') || p.startsWith('/api/auth')) return 'auth';
  if (p.startsWith('/admin') || p.startsWith('/api/admin')) return 'admin';
  if (p === '/' || p === '/fiyat' || p === '/demo' || p === '/ozellikler' || p === '/gizlilik' || p === '/kullanim-kosullari') return 'landing';
  if (p.startsWith('/panel') || p.startsWith('/randevular') || p.startsWith('/kasa') || p.startsWith('/masalar') || p.startsWith('/tamir')) return 'app';
  if (p.startsWith('/api/')) return 'api';
  return 'other';
}

export function resolveVisitorCountry(req: Request, ip: string): { country: string; isForeign: boolean } {
  // 1. Cloudflare cf-ipcountry başlığı
  const cfCountry = (req.headers['cf-ipcountry'] as string || '').toUpperCase().trim();
  if (cfCountry && cfCountry !== 'XX' && cfCountry !== 'T1') {
    return {
      country: cfCountry,
      isForeign: cfCountry !== 'TR',
    };
  }

  // 2. Yerel IP kontrolü (Localhost / Private Network)
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip === 'localhost' ||
    ip === 'unknown'
  ) {
    return { country: 'TR', isForeign: false };
  }

  // 3. Varsayılan
  return { country: 'TR', isForeign: false };
}

export function visitorTrackerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const urlPath = req.originalUrl || req.url || '';
  const ip = clientIp(req);

  // 1. IP Engelleme Kontrolü (Hemen durdur)
  if (isIpBlocked(ip)) {
    res.status(403).json({ error: 'Erişiminiz sistem yöneticisi tarafından engellendi.' });
    return;
  }

  // 2. Statik dosyalar veya HMR isteklerini filtrele
  if (shouldIgnorePath(urlPath)) {
    next();
    return;
  }

  const startTime = Date.now();
  const ua = (req.headers['user-agent'] as string) || '';
  const referer = (req.headers['referer'] as string) || (req.headers['referrer'] as string) || '';

  // Bot Tespiti
  let isBot = false;
  let botName: string | undefined = undefined;
  for (const bot of BOT_PATTERNS) {
    if (bot.pattern.test(ua)) {
      isBot = true;
      botName = bot.name;
      break;
    }
  }

  // Cihaz ve İşletim Sistemi Tespiti
  const uaLower = ua.toLowerCase();
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(uaLower)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(uaLower)) {
    deviceType = 'mobile';
  }

  let browser = 'Tarayıcı';
  if (uaLower.includes('edg/')) browser = 'Edge';
  else if (uaLower.includes('chrome/') && !uaLower.includes('edg/')) browser = 'Chrome';
  else if (uaLower.includes('safari/') && !uaLower.includes('chrome/')) browser = 'Safari';
  else if (uaLower.includes('firefox/')) browser = 'Firefox';
  else if (uaLower.includes('opera/') || uaLower.includes('opr/')) browser = 'Opera';

  let os = 'Cihaz';
  if (uaLower.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (uaLower.includes('windows')) os = 'Windows';
  else if (uaLower.includes('android')) os = 'Android';
  else if (uaLower.includes('iphone')) os = 'iOS (iPhone)';
  else if (uaLower.includes('ipad')) os = 'iPadOS';
  else if (uaLower.includes('mac os') || uaLower.includes('macintosh')) os = 'macOS';
  else if (uaLower.includes('linux')) os = 'Linux';

  const { country, isForeign } = resolveVisitorCountry(req, ip);
  const countryFlag = getCountryFlag(country);
  const countryName = getCountryName(country);
  const isSuspicious = SUSPICIOUS_PATHS.some((regex) => regex.test(urlPath));
  const category = detectCategory(urlPath);

  // Yanıt tamamlandığında kaydı oluştur
  res.on('finish', () => {
    try {
      const durationMs = Date.now() - startTime;
      const record: VisitorRecord = {
        id: crypto.randomUUID(),
        ip,
        country,
        countryName,
        countryFlag,
        isForeign,
        method: req.method,
        path: urlPath,
        statusCode: res.statusCode,
        durationMs,
        referer,
        userAgent: ua,
        deviceType,
        browser,
        os,
        isBot,
        botName,
        isSuspicious,
        category,
        timestamp: new Date().toISOString(),
      };

      visitorRecords.unshift(record);
      if (visitorRecords.length > MAX_VISITOR_RECORDS) {
        visitorRecords.length = MAX_VISITOR_RECORDS;
      }
      maybePersistVisitors();
    } catch {
      // Hata durumunda akışı bozma
    }
  });

  next();
}

export interface VisitorAnalyticsSummary {
  totalToday: number;
  foreignToday: number;
  humanToday: number;
  botToday: number;
  suspiciousToday: number;
  uniqueIpsToday: number;
  liveLast15Min: number;
  topCountries: { code: string; name: string; flag: string; count: number; percentage: number }[];
  categoryBreakdown: { category: string; count: number }[];
  blockedIpsCount: number;
}

export function getVisitorRecords(filters?: {
  foreignOnly?: boolean;
  botsOnly?: boolean;
  humanOnly?: boolean;
  suspiciousOnly?: boolean;
  customerOnly?: boolean;
  search?: string;
  limit?: number;
}): { records: VisitorRecord[]; summary: VisitorAnalyticsSummary } {
  const limit = Math.min(filters?.limit || 150, 500);
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayMs = startOfDay.getTime();
  const fifteenMinAgoMs = now - 15 * 60 * 1000;

  // Analitik Sayaçları
  let totalToday = 0;
  let foreignToday = 0;
  let humanToday = 0;
  let botToday = 0;
  let suspiciousToday = 0;
  const uniqueIpsTodaySet = new Set<string>();
  const liveLast15MinIps = new Set<string>();
  const countryCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  for (const r of visitorRecords) {
    const t = new Date(r.timestamp).getTime();
    if (t >= startOfDayMs) {
      totalToday++;
      if (r.isForeign) foreignToday++;
      if (r.isBot) botToday++;
      else humanToday++;
      if (r.isSuspicious) suspiciousToday++;
      uniqueIpsTodaySet.add(r.ip);

      countryCounts[r.country] = (countryCounts[r.country] || 0) + 1;
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    }
    if (t >= fifteenMinAgoMs) {
      liveLast15MinIps.add(r.ip);
    }
  }

  // Filtreleme
  let filtered = visitorRecords;

  if (filters?.foreignOnly) {
    filtered = filtered.filter((r) => r.isForeign);
  }
  if (filters?.botsOnly) {
    filtered = filtered.filter((r) => r.isBot);
  }
  if (filters?.humanOnly) {
    filtered = filtered.filter((r) => !r.isBot);
  }
  if (filters?.suspiciousOnly) {
    filtered = filtered.filter((r) => r.isSuspicious);
  }
  if (filters?.customerOnly) {
    filtered = filtered.filter((r) => r.category === 'barber' || r.category === 'menu');
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.ip.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.countryName.toLowerCase().includes(q) ||
        r.path.toLowerCase().includes(q) ||
        (r.botName && r.botName.toLowerCase().includes(q)) ||
        r.userAgent.toLowerCase().includes(q)
    );
  }

  // Ülke sıralaması
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([code, count]) => ({
      code,
      name: getCountryName(code),
      flag: getCountryFlag(code),
      count,
      percentage: totalToday > 0 ? Math.round((count / totalToday) * 100) : 0,
    }));

  const categoryBreakdown = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));

  const summary: VisitorAnalyticsSummary = {
    totalToday,
    foreignToday,
    humanToday,
    botToday,
    suspiciousToday,
    uniqueIpsToday: uniqueIpsTodaySet.size,
    liveLast15Min: liveLast15MinIps.size,
    topCountries,
    categoryBreakdown,
    blockedIpsCount: blockedIps.length,
  };

  return {
    records: filtered.slice(0, limit),
    summary,
  };
}
