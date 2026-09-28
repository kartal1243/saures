// Public route eslestirme testi: her URL kendi sayfasina gitmeli.
// matchPublicRoute saf fonksiyon oldugu icin kaynaktan cikarilip dogrudan calistirilir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(
  path.join(__dirname, '..', 'frontend', 'components', 'public', 'PublicPages.tsx'),
  'utf-8',
);

const start = src.indexOf('export function matchPublicRoute');
if (start === -1) {
  console.error('FAIL  matchPublicRoute bulunamadi');
  process.exit(1);
}
// Fonksiyon govdesini suslu parantez dengesiyle cikar
let i = src.indexOf('{', start);
let depth = 0;
let end = -1;
for (let j = i; j < src.length; j++) {
  if (src[j] === '{') depth++;
  else if (src[j] === '}') {
    depth--;
    if (depth === 0) { end = j + 1; break; }
  }
}
if (end === -1) {
  console.error('FAIL  fonksiyon govdesi cikarilamadi');
  process.exit(1);
}
let fnSrc = src.slice(start, end).replace('export function', 'function');
// Tip eklerini kaldir (saf JS kalsin)
fnSrc = fnSrc
  .replace('pathname: string', 'pathname')
  .replace(': PublicRouteKey | null', '');
const matchPublicRoute = new Function(`${fnSrc}; return matchPublicRoute;`)();

const cases = [
  ['/', null],
  ['/berber', 'berber'],
  ['/berber/', 'berber'],
  ['/BERBER', 'berber'],
  ['/kafe-restoran', 'kafe-restoran'],
  ['/bakkal-market', 'bakkal-market'],
  ['/teknik-servis', 'teknik-servis'],
  ['/hukuk', 'hukuk'],
  ['/avukat', 'hukuk'],
  ['/terzi', 'terzi'],
  ['/kayit', 'kayit'],
  ['/fiyat', 'fiyat'],
  ['/fiyatlandirma', 'fiyat'],
  ['/iletisim', 'iletisim'],
  ['/gizlilik', 'gizlilik'],
  ['/gizlilik-politikasi', 'gizlilik'],
  ['/admin', null],
  ['/ufo', null],
];

let fail = 0;
for (const [input, want] of cases) {
  const got = matchPublicRoute(input);
  if (got === want) {
    console.log(`  PASS  ${input} -> ${got}`);
  } else {
    fail++;
    console.log(`  FAIL  ${input} -> ${got} (beklenen: ${want})`);
  }
}
console.log(fail === 0
  ? `\n===== ROUTES SONUC: ${cases.length} PASS / 0 FAIL =====`
  : `\n===== ROUTES SONUC: ${cases.length - fail} PASS / ${fail} FAIL =====`);
process.exit(fail === 0 ? 0 : 1);
