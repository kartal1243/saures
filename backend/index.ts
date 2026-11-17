import 'dotenv/config';
import { startServer } from './app';

export * from './seo';
export * from './app';
export * from './accounts';
export * from './config';
export { loadShopState, setShopState } from './shopState';

// Sunucuyu başlat
startServer().catch((err) => {
  console.error('Sunucu başlatılamadı:', err);
  process.exit(1);
});
