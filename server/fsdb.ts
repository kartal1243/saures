import fs from 'fs';

export function readJsonFile<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
    }
  } catch (err) {
    console.error('Failed reading', file, err);
  }
  return fallback;
}

export function writeJsonFile(file: string, data: unknown): void {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing', file, err);
  }
}
