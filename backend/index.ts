import 'dotenv/config';
import { startServer } from './app';

export * from './seo';
export * from './app';
export * from './accounts';
export * from './config';
export { loadShopState, setShopState, persistShopState, allocateUniqueSlug } from './shopState';
export { registerAuthRoutes } from './routes/auth';
export { registerProfileRoutes } from './routes/profile';
export { registerPublicBarberRoutes } from './routes/appointments';
export { apiGuard } from './guards';
export { als } from './context';

// Sunucuyu başlat
if (process.env.SKIP_SERVER_AUTOSTART !== 'true') {
  startServer().catch((err) => {
    console.error('Sunucu başlatılamadı:', err);
    process.exit(1);
  });
}
