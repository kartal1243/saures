import fs from 'fs';
import path from 'path';

function backupOf(file: string): string {
  return file + '.bak';
}

// Rename'in diskte kalici olmasi icin dizinin fsync'i gerekir (Linux).
function syncDir(dir: string): void {
  let dfd: number | undefined;
  try {
    dfd = fs.openSync(dir, 'r');
    fs.fsyncSync(dfd);
  } catch {
    // Bazi dosya sistemlerinde dizin fsync'i desteklenmez; onemsiz.
  } finally {
    if (dfd !== undefined) {
      try {
        fs.closeSync(dfd);
      } catch {
        /* yoksay */
      }
    }
  }
}

export function readJsonFile<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
    }
  } catch (err) {
    console.error('Failed reading', file, err);
    // Ana dosya bozulmus olabilir: bir onceki iyi surum olan .bak i dene.
    for (const candidate of [backupOf(file)]) {
      try {
        if (fs.existsSync(candidate)) {
          const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8')) as T;
          console.error('Recovered', file, 'from', candidate);
          return parsed;
        }
      } catch (bakErr) {
        console.error('Failed reading backup', candidate, bakErr);
      }
    }
  }
  return fallback;
}

// Atomik yazma: gecici dosyaya yaz -> fsync -> rename.
// Boylece yazma sirasinda olusacak bir cokme ana dosyayi bozamaz,
// okuyucular ya eski ya yeni dosyayi gorur, hicbir zaman yarim icerik.
export function writeJsonFile(file: string, data: unknown): void {
  const dir = path.dirname(file);
  const tmp = path.join(
    dir,
    `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`,
  );
  const payload = JSON.stringify(data, null, 2);
  let fd: number | undefined;
  try {
    fs.mkdirSync(dir, { recursive: true });
    fd = fs.openSync(tmp, 'w');
    fs.writeFileSync(fd, payload, 'utf-8');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;

    // Onceki iyi surumu sakla (bozulan dosyadan kurtarma icin).
    if (fs.existsSync(file)) {
      try {
        fs.copyFileSync(file, backupOf(file));
      } catch (bakErr) {
        console.error('Failed writing backup for', file, bakErr);
      }
    }

    fs.renameSync(tmp, file);
    syncDir(dir);
  } catch (err) {
    console.error('Failed writing', file, err);
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        /* yoksay */
      }
    }
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      /* yoksay */
    }
  }
}
