import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
const appDir = typeof __dirname !== 'undefined'
  ? __dirname
  : process.cwd();
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import { PORT, JSON_BODY_LIMIT } from './config';
import { accountFromRequest, clientIp } from './accounts';
import { loadShopState } from './shopState';
import { als } from './context';
import { addClient, removeClient, buildInitEvent } from './realtime';
import { apiGuard, rateLimit } from './guards';
import { startMaintenance } from './maintenance';
import { ensureDemoAccount, ensureMasterAccount } from './demoSeed';
import { registerAuthRoutes } from './routes/auth';
import { registerCoreRoutes } from './routes/core';
import { registerCustomerRoutes } from './routes/customers';
import { registerTransactionRoutes } from './routes/transactions';
import { registerReminderRoutes } from './routes/reminders';
import { registerProfileRoutes, serveShopLogo } from './routes/profile';
import { registerClosingRoutes } from './routes/closings';
import { registerVipRoutes } from './routes/vip';
import { registerProductRoutes } from './routes/products';
import { registerAppointmentRoutes, registerPublicBarberRoutes } from './routes/appointments';
import { registerTableRoutes } from './routes/tables';
import { registerRepairRoutes } from './routes/repair';
import { registerPosRoutes } from './routes/pos';
import { registerSupplierRoutes } from './routes/suppliers';
import { registerServiceRoutes } from './routes/services';
import { registerCaseRoutes } from './routes/cases';
import { registerCustodyRoutes } from './routes/custody';
import { registerAdminRoutes, isAdminSession } from './routes/admin';
import { registerPublicMenuRoutes, registerProtectedMenuRoutes } from './routes/menu';
import { registerShopierWebhook } from './routes/shopierWebhook';
import { registerPublicShopsMapRoutes } from './routes/publicShopsMap';
import { registerCommunityRoutes } from './routes/community';
import { registerDeviceRoutes } from './routes/devices';
import * as seoModule from './seo';
import { renderSeoHtml, generateSitemapXml, getRobotsTxt, getBaseHtmlTemplate, findShopForSeo } from './seo';
import { visitorTrackerMiddleware } from './visitorTracker';

export const TRUSTED_MOBILE_ORIGINS = new Set([
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'https://app.dukkanimyanimda.local',
]);

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const IDEMPOTENCY_PATH_REGEX = /^\/api\/(quick-pos-sale|transactions|tables\/[^/]+\/orders)\/?$/;

export function createIdempotencyMiddleware() {
  const cache = new Map<string, { statusCode: number; body: any; expiresAt: number }>();

  return function idempotencyMiddleware(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void {
    if (req.method !== 'POST') return next();
    const cleanPath = (req.originalUrl || req.url || req.path || '').split('?')[0];
    if (!IDEMPOTENCY_PATH_REGEX.test(cleanPath)) return next();

    const rawKey = req.headers['x-idempotency-key'];
    const key = Array.isArray(rawKey) ? rawKey[0]?.trim() : String(rawKey || '').trim();
    if (!key) return next();

    const now = Date.now();
    if (cache.size > 1000) {
      for (const [k, v] of cache.entries()) {
        if (v.expiresAt <= now) cache.delete(k);
      }
    }

    const accountId = als.getStore()?.accountId || accountFromRequest(req)?.id || 'anon';
    const cacheKey = `${accountId}:${cleanPath}:${key}`;
    const hit = cache.get(cacheKey);
    if (hit && hit.expiresAt > now) {
      res.setHeader('X-Idempotency-Replayed', 'true');
      res.status(hit.statusCode).json(hit.body);
      return;
    }

    const origJson = res.json.bind(res);
    res.json = ((body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          statusCode: res.statusCode,
          body,
          expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
        });
      }
      return origJson(body);
    }) as typeof res.json;

    next();
  };
}

export async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  // nginx + Cloudflare arkasindayiz: gercek istemci IP'si basliklardan okunsun
  app.set('trust proxy', 1);

  // Güvenlik başlıkları ve HTTPS / HSTS koruması
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=(self)');

    // Uyumlu & Güçlü Content Security Policy (Harita, Font, Firebase, Analytics ve WebSockets uyumlu)
    const cspPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com https://unpkg.com https://cdnjs.cloudflare.com https://www.googletagmanager.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https: *.openstreetmap.org images.unsplash.com https://www.google-analytics.com",
      "connect-src 'self' ws: wss: https://*.googleapis.com https://*.firebaseio.com https://*.identitytoolkit.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.telegram.org https://*.tile.openstreetmap.org https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://cloudflareinsights.com",
      "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ');
    res.setHeader('Content-Security-Policy', cspPolicy);

    // Güvenilir Mobil Uygulama Origin CORS İzinleri (Capacitor / TWA / Native)
    const reqOrigin = String(req.headers.origin || '').trim();
    const isTrustedMobileOrigin = Boolean(reqOrigin && TRUSTED_MOBILE_ORIGINS.has(reqOrigin.toLowerCase()));
    if (isTrustedMobileOrigin) {
      res.setHeader('Access-Control-Allow-Origin', reqOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Client-Platform, X-Idempotency-Key'
      );
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
    }

    // CSRF Koruması: Çapraz kaynaklı (cross-origin) izinsiz POST/PUT/DELETE isteklerini engelle
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const origin = req.headers.origin;
      const host = req.headers.host;
      if (origin && host && !req.path.startsWith('/api/webhook/') && !isTrustedMobileOrigin) {
        const originHost = origin.replace(/^https?:\/\//, '').split('/')[0];
        if (originHost !== host && !originHost.startsWith('localhost') && !originHost.startsWith('127.0.0.1')) {
          return res.status(403).json({ error: 'CSRF engellendi: Geçersiz kaynak isteği.' });
        }
      }
    }

    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      const host = req.headers.host || '';
      const proto = req.headers['x-forwarded-proto'];

      // 1. www -> non-www 301 yönlendirmesi (Google SEO Canonical Bütünlüğü & PageRank Birleştirme)
      if (host.toLowerCase().startsWith('www.')) {
        const cleanHost = host.replace(/^www\./i, '');
        return res.redirect(301, `https://${cleanHost}${req.url}`);
      }

      // 2. HTTP -> HTTPS 301 yönlendirmesi
      if (proto && proto === 'http') {
        return res.redirect(301, `https://${host}${req.url}`);
      }
    }

    next();
  });

  // Gelen tüm site trafiğini, yabancı IP'leri ve bot taramalarını kaydet & zararlı IP'leri engelle
  app.use(visitorTrackerMiddleware);

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
      console.error('[EXPRESS JSON ERROR]:', err.message, err.status, err.type);
      return res.status(400).json({ error: 'Geçersiz JSON formatı: ' + err.message });
    }
    next();
  });
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // ---------------- Otomatik bakim: oturum temizligi + gunluk yedek ----------------
  startMaintenance();
  ensureDemoAccount();
  ensureMasterAccount();

  const server = http.createServer(app);

  // WebSocket Server setup
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws, req) => {
    // CSWSH Koruması (Cross-Site WebSocket Hijacking): Origin başlığı doğrulaması
    const origin = req.headers.origin;
    const host = req.headers.host;
    if (origin) {
      const originLower = origin.trim().toLowerCase();
      const originHost = originLower.replace(/^https?:\/\//, '').split('/')[0];
      const cleanHost = (host || '').split('/')[0].toLowerCase();
      const isAllowed =
        TRUSTED_MOBILE_ORIGINS.has(originLower) ||
        originHost === cleanHost ||
        originHost === 'dukkanimyanimda.com.tr' ||
        originHost === 'www.dukkanimyanimda.com.tr' ||
        originHost.endsWith('.dukkanimyanimda.com.tr') ||
        originHost.startsWith('localhost') ||
        originHost.startsWith('127.0.0.1');

      if (!isAllowed) {
        ws.close(4003, 'Unauthorized Origin');
        return;
      }
    }

    // Admin Paneli bağlantısı kontrolü
    if (isAdminSession(req as any)) {
      addClient(ws, 'ADMIN', {
        ip: clientIp(req as any),
        userAgent: (req.headers['user-agent'] as string) || '',
        isAdmin: true,
      });
      ws.on('close', () => removeClient(ws));
      ws.on('error', () => removeClient(ws));
      return;
    }

    // Dükkan bağlantısı kontrolü (Cookie, Bearer Header veya ?token= query desteği)
    let wsQueryToken: string | null = null;
    try {
      const parsedUrl = new URL(req.url || '/', 'http://localhost');
      const qTok = parsedUrl.searchParams.get('token');
      if (qTok && /^[a-f0-9]{32,64}$/i.test(qTok.trim())) {
        wsQueryToken = qTok.trim();
      }
    } catch {
      // ignore invalid URL
    }

    const acc = accountFromRequest({
      headers: {
        cookie: req.headers.cookie,
        authorization:
          req.headers.authorization || (wsQueryToken ? `Bearer ${wsQueryToken}` : undefined),
      },
    });
    if (!acc) {
      ws.close(4001, 'unauthorized');
      return;
    }
    const ctx = { accountId: acc.id, role: acc.role || 'owner', state: loadShopState(acc.id) };
    addClient(ws, acc.id, {
      ip: clientIp(req as any),
      userAgent: (req.headers['user-agent'] as string) || '',
      isAdmin: false,
    });

    als.run(ctx, () => {
      ws.send(JSON.stringify(buildInitEvent(ctx.state)));
    });

    ws.on('close', () => {
      removeClient(ws);
    });

    ws.on('error', () => {
      removeClient(ws);
    });
  });

  // ---------------- Auth: herkese açık uçlar önce (kayıt/giriş) ----------------
  app.use('/api/auth', rateLimit);
  registerAuthRoutes(app);

  // ---------------- Admin: kendi sifreli oturumu var, guard'dan once ----------------
  registerAdminRoutes(app);

  // ---------------- Herkese açık menü ucu (QR okutan müşteriler şifresiz girer) ----------------
  registerPublicMenuRoutes(app);

  // ---------------- Herkese açık berber randevu ucu (Müşteriler şifresiz randevu alır) ----------------
  registerPublicBarberRoutes(app);

  // ---------------- Shopier OSB (Otomatik Sipariş Bildirimi / Webhook) ----------------
  registerShopierWebhook(app);

  // ---------------- Herkese açık esnaf haritası (KVKK Uyumlu) ----------------
  registerPublicShopsMapRoutes(app);

  // ---------------- Kamusal Medya Ucu: Dükkan Profil Fotoğrafları / Logoları ----------------
  app.get('/media/shop-logo/:filename', serveShopLogo);

  // ---------------- Koruma: sonrası için giriş + rol zorunlu ----------------
  app.use('/api', apiGuard);
  app.use(createIdempotencyMiddleware());

  registerCoreRoutes(app);
  registerCustomerRoutes(app);
  registerTransactionRoutes(app);
  registerReminderRoutes(app);
  registerProfileRoutes(app);
  registerClosingRoutes(app);
  registerVipRoutes(app);
  registerProductRoutes(app);
  registerAppointmentRoutes(app);
  registerTableRoutes(app);
  registerRepairRoutes(app);
  registerPosRoutes(app);
  registerSupplierRoutes(app);
  registerServiceRoutes(app);
  registerCaseRoutes(app);
  registerCustodyRoutes(app);
  registerProtectedMenuRoutes(app);
  registerCommunityRoutes(app);
  registerDeviceRoutes(app);

  // ---------------- Google Play TWA Doğrulaması (Digital Asset Links) ----------------
  app.get('/.well-known/assetlinks.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const distAssetLinksPath = path.join(process.cwd(), 'dist', '.well-known', 'assetlinks.json');
    const staticAssetLinksPath = path.join(process.cwd(), 'frontend', 'public', '.well-known', 'assetlinks.json');

    if (fs.existsSync(distAssetLinksPath)) {
      return res.send(fs.readFileSync(distAssetLinksPath, 'utf-8'));
    }
    if (fs.existsSync(staticAssetLinksPath)) {
      return res.send(fs.readFileSync(staticAssetLinksPath, 'utf-8'));
    }

    const packageName = process.env.TWA_PACKAGE_NAME || 'com.dukkanimyanimda.twa';
    const rawFingerprints =
      process.env.TWA_SHA256_FINGERPRINTS ||
      '14:6D:E9:7D:0F:52:AB:E0:41:F5:27:1F:B1:03:7E:DE:36:CF:BE:62:EE:9E:D0:6B:43:83:A2:E9:9D:C3:7B:64';
    const fingerprints = rawFingerprints.split(',').map((f) => f.trim()).filter(Boolean);

    res.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: packageName,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ]);
  });

  // ---------------- Dinamik SEO & Tarayıcı Dosyaları (Sitemap & Robots) ----------------
  app.get('/sitemap.xml', (req, res) => {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(generateSitemapXml(req.get('host')));
  });

  app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, must-revalidate');
    res.send(getRobotsTxt(req.get('host')));
  });

  // Vite geliştirme sunucusu yalnızca açıkça development modunda ve dist/index.html yokken çalışır
  const VALID_PUBLIC_ROUTES = new Set([
    '/',
    '/admin',
    '/berber',
    '/kuafor',
    '/kuafor-randevu',
    '/kadin-kuafor',
    '/berber-randevu-programi',
    '/randevu-sistemi',
    '/online-randevu',
    '/guzellik-salonu',
    '/guzellik-merkezi',
    '/guzellik',
    '/lazer-epilasyon',
    '/kafe-restoran',
    '/kafe',
    '/restoran',
    '/adisyon',
    '/qr-menu',
    '/bakkal',
    '/market',
    '/bakkal-market',
    '/veresiye-defteri',
    '/pos-sistemi',
    '/fiyat',
    '/fiyatlandirma',
    '/kayit',
    '/teknik-servis',
    '/servis',
    '/hukuk',
    '/avukat',
    '/terzi',
    '/iletisim',
    '/gizlilik',
    '/gizlilik-politikasi',
    '/rehber',
  ]);

  const GUIDE_FALLBACK_ROUTES = new Set([
    '/rehber',
    '/rehber/berber-no-show-onleme',
    '/rehber/kuafor-prim-hesaplama',
    '/rehber/ucretsiz-qr-menu-olusturma',
    '/rehber/dijital-veresiye-defteri-gecis',
    '/rehber/komisyonsuz-randevu-programi',
    '/rehber/istanbul-berber-kuafor',
    '/rehber/ankara-berber-kuafor',
    '/rehber/izmir-kafe-restoran',
  ]);

  function isPublicRouteValid(pathname: string): boolean {
    const clean = (pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
    if (VALID_PUBLIC_ROUTES.has(clean)) return true;
    if (clean === '/rehber' || clean.startsWith('/rehber/')) {
      const seoGuideValidator = (seoModule as { isValidGuideRoute?: (p: string) => boolean }).isValidGuideRoute;
      return typeof seoGuideValidator === 'function' ? seoGuideValidator(clean) : GUIDE_FALLBACK_ROUTES.has(clean);
    }
    if (clean.startsWith('/t/')) {
      const code = clean.slice(3).split('/')[0];
      return Boolean(code);
    }
    const isShop = clean.startsWith('/r/') || clean.startsWith('/randevu/') || clean.startsWith('/m/') || clean.startsWith('/menu/');
    if (isShop) {
      const slug = clean.replace(/^\/(r|randevu|m|menu)\/?/, '').split('/')[0];
      return slug === 'demo' || !!findShopForSeo(slug);
    }
    return false;
  }

  const isDev = process.env.NODE_ENV === 'development' || (!process.env.NODE_ENV && !fs.existsSync(path.join(process.cwd(), 'dist', 'index.html')));
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      // API uçlarını, Vite dahili dosyalarını veya uzantılı varlıkları atla
      if (req.path.startsWith('/api') || req.path.startsWith('/@') || req.path.includes('.')) {
        return next();
      }
      try {
        const isNotFound = !isPublicRouteValid(req.path);
        const rawTemplate = getBaseHtmlTemplate();
        const transformed = await vite.transformIndexHtml(req.url, rawTemplate);
        const html = renderSeoHtml(req.path, req.get('host'), transformed);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        if (isNotFound) {
          res.setHeader('Cache-Control', 'no-cache, no-store');
          return res.status(404).send(html);
        }
        res.send(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distPathCandidates = [
      path.join(appDir),
      path.join(appDir, '..', 'dist'),
      path.join(process.cwd(), 'dist'),
      '/var/www/dukkanim/dist',
    ];
    const distPath = distPathCandidates.find((p) => fs.existsSync(path.join(p, 'index.html'))) || path.join(process.cwd(), 'dist');
    // Statik varlıklar (JS/CSS/görseller) sunulur; ancak HTML rotalarını dinamik SEO motoru karşılar
    app.use(express.static(distPath, { index: false }));

    // Production HTML sunumunda (/r/:slug, /m/:slug, /berber, /kafe-restoran, /bakkal vb.)
    // dist/index.html içindeki <title> ve og:title / og:description meta etiketlerini dinamik değiştirerek gönder
    app.get('*', (req, res, next) => {
      // Statik varlıklar (JS, CSS, PNG vb.) veya API rotaları bulunamadıysa 404 dönmeli; kesinlikle index.html dönmemeli!
      if (req.path.startsWith('/api') || req.path.startsWith('/assets') || req.path.includes('.')) {
        return res.status(404).send('Not Found');
      }

      const isNotFound = !isPublicRouteValid(req.path);
      const html = renderSeoHtml(req.path, req.get('host'));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      if (isNotFound) {
        res.setHeader('Cache-Control', 'no-cache, no-store');
        return res.status(404).send(html);
      }
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.send(html);
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Dükkânım Yanımda running at http://localhost:${PORT}`);
  });
}
