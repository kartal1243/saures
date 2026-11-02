import 'dotenv/config';
import { startServer } from './app';

export * from './seo';
export * from './app';
export * from './accounts';
export * from './config';

// Yalnızca doğrudan çalıştırıldığında sunucuyu başlat (testlerde import edildiğinde başlatmaz)
if (process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('server.cjs'))) {
  startServer().catch((err) => {
    console.error('Sunucu başlatılamadı:', err);
    process.exit(1);
  });
}
