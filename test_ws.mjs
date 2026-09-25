// WebSocket E2E: INIT + anlik olay + hesap izolasyonu
import WebSocket from 'ws';
import crypto from 'crypto';

const BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;

function check(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}  ${detail}`);
  }
}

async function api(path, method = 'GET', body = null, cookie = null) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data, headers: res.headers };
}

function connectWS(cookie) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000', { headers: { Cookie: cookie } });
    const inbox = [];
    ws.on('message', (raw) => {
      try {
        inbox.push(JSON.parse(raw.toString()));
      } catch (e) {}
    });
    ws.on('open', () => resolve({ ws, inbox }));
    ws.on('error', reject);
    ws.on('close', (code) => reject(new Error('closed ' + code)));
  });
}

function waitFor(inbox, type, ms = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const t = setInterval(() => {
      const ev = inbox.find((e) => e.type === type);
      if (ev) {
        clearInterval(t);
        resolve(ev);
      } else if (Date.now() - start > ms) {
        clearInterval(t);
        resolve(null);
      }
    }, 50);
  });
}

const tag = crypto.randomUUID().slice(0, 6);

async function register(name, phone) {
  const r = await api('/api/auth/register', 'POST', {
    shopName: name,
    ownerName: 'Sahip',
    phone,
    password: '1234',
  });
  const raw = r.headers.get('set-cookie') || '';
  const m = raw.match(/sid=([a-f0-9]+)/);
  return m ? 'sid=' + m[1] : null;
}

async function main() {
  console.log('\n== WS E2E ==');
  const cookieA = await register(`WS Dukkan A ${tag}`, `0511${tag}`);
  const cookieB = await register(`WS Dukkan B ${tag}`, `0512${tag}`);
  check('A ve B kaydi (sid alindi)', Boolean(cookieA && cookieB));

  const a = await connectWS(cookieA);
  const initA = await waitFor(a.inbox, 'INIT');
  check('A INIT aldi', Boolean(initA));
  check('A ilk verisi bos (musteri 0)', Array.isArray(initA?.payload?.customers) && initA.payload.customers.length === 0,
        JSON.stringify(initA?.payload?.customers?.length));

  // A'da islem yap -> A eventi gormeli
  const postPromise = (async () => {
    await new Promise((r) => setTimeout(r, 100));
    return api('/api/transactions', 'POST', { type: 'masraf', amount: 42 }, cookieA);
  })();
  const created = await waitFor(a.inbox, 'TRANSACTION_CREATED');
  check('A TRANSACTION_CREATED eventi aldi', Boolean(created));
  check('event masraf 42', created?.payload?.transaction?.amount === 42,
        JSON.stringify(created?.payload?.transaction));
  await postPromise;

  // B baglanti + izolasyon
  const b = await connectWS(cookieB);
  const initB = await waitFor(b.inbox, 'INIT');
  check('B INIT aldi', Boolean(initB));
  check('B verisi hala bos (izolasyon)', Array.isArray(initB?.payload?.customers) && initB.payload.customers.length === 0);
  const before = b.inbox.length;
  await api('/api/transactions', 'POST', { type: 'masraf', amount: 77 }, cookieA);
  await new Promise((r) => setTimeout(r, 700));
  const leaked = b.inbox.slice(before).find((e) => e.type === 'TRANSACTION_CREATED');
  check("B, A'nin olayini GORMEDI (izolasyon)", !leaked, JSON.stringify(leaked));
  const aLeak = a.inbox.find((e) => e.type === 'TRANSACTION_CREATED' && e.payload?.transaction?.amount === 77);
  check('A, kendi 77 TL olayini gordu', Boolean(aLeak));

  // Giris yokken WS 4001 ile kapanir
  await new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3000');
    ws.on('open', () => {});
    ws.on('close', (code) => {
      check('giris yokken WS 4001 kapanir', code === 4001, String(code));
      resolve();
    });
    ws.on('error', () => {});
    setTimeout(resolve, 3000);
  });

  a.ws.close();
  b.ws.close();

  console.log(`\n===== WS SONUC: ${passed} PASS / ${failed} FAIL =====`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error('WS test hatasi:', e);
  process.exit(1);
});
