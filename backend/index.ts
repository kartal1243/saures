import 'dotenv/config';
import { startServer } from './app';

startServer().catch((err) => {
  console.error('Sunucu başlatılamadı:', err);
  process.exit(1);
});
