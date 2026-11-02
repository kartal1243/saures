import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import { PORT, JSON_BODY_LIMIT } from './config';
import { accountFromRequest, clientIp } from './accounts';
import { loadShopState } from './shopState';
import { als } from './context';
import { addClient, removeClient, buildInitEvent } from './realtime';
import { apiGuard, rateLimit } from './guards';
import { startMaintenance } from './maintenance';
import { ensureDemoAccount } from './demoSeed';
import { registerAuthRoutes } from './routes/auth';
import { registerCoreRoutes } from './routes/core';
import { registerCustomerRoutes } from './routes/customers';
import { registerTransactionRoutes } from './routes/transactions';
import { registerReminderRoutes } from './routes/reminders';
import { registerProfileRoutes } from './routes/profile';
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
import { renderSeoHtml, generateSitemapXml, getRobotsTxt, getBaseHtmlTemplate } from './seo';

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
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=()');

    // CSRF Koruması: Çapraz kaynaklı (cross-origin) izinsiz POST/PUT/DELETE isteklerini engelle
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const origin = req.headers.origin;
      const host = req.headers.host;
      if (origin && host && !req.path.startsWith('/api/webhook/')) {
        const originHost = origin.replace(/^https?:\/\//, '').split('/')[0];
        if (originHost !== host && !originHost.startsWith('localhost') && !originHost.startsWith('127.0.0.1')) {
          return res.status(403).json({ error: 'CSRF engellendi: Geçersiz kaynak isteği.' });
        }
      }
    }

    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      const proto = req.headers['x-forwarded-proto'];
      if (proto && proto === 'http') {
        const host = req.headers.host;
        return res.redirect(301, `https://${host}${req.url}`);
      }
    }

    next();
  });

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // ---------------- Otomatik bakim: oturum temizligi + gunluk yedek ----------------
  startMaintenance();
  ensureDemoAccount();

  const server = http.createServer(app);

  // WebSocket Server setup
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws, req) => {
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

    // Dükkan bağlantısı kontrolü
    const acc = accountFromRequest(req);
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

  // ---------------- Koruma: sonrası için giriş + rol zorunlu ----------------
  app.use('/api', apiGuard);

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

  // ---------------- Dinamik SEO & Tarayıcı Dosyaları (Sitemap & Robots) ----------------
  app.get('/sitemap.xml', (req, res) => {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(generateSitemapXml(req.get('host')));
  });

  app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(getRobotsTxt(req.get('host')));
  });

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== 'production') {
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
        const rawTemplate = getBaseHtmlTemplate();
        const transformed = await vite.transformIndexHtml(req.url, rawTemplate);
        const html = renderSeoHtml(req.path, req.get('host'), transformed);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Statik varlıklar (JS/CSS/görseller) sunulur; ancak HTML rotalarını dinamik SEO motoru karşılar
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      const html = renderSeoHtml(req.path, req.get('host'));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Dükkânım Yanımda running at http://localhost:${PORT}`);
  });
}
