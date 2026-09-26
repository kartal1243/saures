import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import { PORT, JSON_BODY_LIMIT } from './config';
import { accountFromRequest } from './accounts';
import { loadShopState } from './shopState';
import { als } from './context';
import { addClient, removeClient, buildInitEvent } from './realtime';
import { apiGuard, rateLimit } from './guards';
import { startMaintenance } from './maintenance';
import { registerAuthRoutes } from './routes/auth';
import { registerCoreRoutes } from './routes/core';
import { registerCustomerRoutes } from './routes/customers';
import { registerTransactionRoutes } from './routes/transactions';
import { registerReminderRoutes } from './routes/reminders';
import { registerProfileRoutes } from './routes/profile';
import { registerClosingRoutes } from './routes/closings';
import { registerVipRoutes } from './routes/vip';
import { registerProductRoutes } from './routes/products';
import { registerAppointmentRoutes } from './routes/appointments';
import { registerTableRoutes } from './routes/tables';
import { registerRepairRoutes } from './routes/repair';
import { registerPosRoutes } from './routes/pos';
import { registerSupplierRoutes } from './routes/suppliers';
import { registerServiceRoutes } from './routes/services';
import { registerCaseRoutes } from './routes/cases';
import { registerCustodyRoutes } from './routes/custody';

export async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');

  // Güvenlik başlıkları (yayın kilidi)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  // ---------------- Otomatik bakim: oturum temizligi + gunluk yedek ----------------
  startMaintenance();

  const server = http.createServer(app);

  // WebSocket Server setup
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws, req) => {
    const acc = accountFromRequest(req);
    if (!acc) {
      ws.close(4001, 'unauthorized');
      return;
    }
    const ctx = { accountId: acc.id, role: acc.role || 'owner', state: loadShopState(acc.id) };
    addClient(ws, acc.id);

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

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Dükkânım Yanımda running at http://localhost:${PORT}`);
  });
}
