import fs from 'fs';
import path from 'path';
import { BACKUPS_DIR } from './config';
import { writeJsonFile } from './fsdb';
import { getAccounts, pruneExpiredSessions } from './accounts';
import { loadShopState } from './shopState';

function dailyBackupAll(): void {
  const date = new Date().toISOString().split('T')[0];
  for (const acc of getAccounts()) {
    try {
      const st = loadShopState(acc.id);
      const dir = path.join(BACKUPS_DIR, acc.id);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      writeJsonFile(path.join(dir, date + '.json'), st);
      // son 30 gun sakla
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
      for (const f of files.slice(0, Math.max(0, files.length - 30))) {
        fs.unlinkSync(path.join(dir, f));
      }
    } catch (err) {
      console.error('Gunluk yedek alinamadi:', acc.id, err);
    }
  }
}

export function startMaintenance(): void {
  setInterval(pruneExpiredSessions, 60 * 60 * 1000); // saatte bir
  setInterval(dailyBackupAll, 24 * 60 * 60 * 1000); // gunluk
  setTimeout(dailyBackupAll, 15 * 1000); // ilk acilista bugunun yedeği
}
