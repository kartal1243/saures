// Offline-First Kasa & Sipariş Kuyruğu (IndexedDB + localStorage fallback)
// Her çevrimdışı işlem için deterministik bir X-Idempotency-Key UUID üretir ve ağ geldiğinde FIFO sırayla senkronize eder.

export type OfflineHttpMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OfflineMutation {
  id: string;
  endpoint: string;
  method: OfflineHttpMethod;
  payload?: unknown;
  headers?: Record<string, string>;
  idempotencyKey: string;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface EnqueueMutationInput {
  endpoint: string;
  method?: OfflineHttpMethod;
  payload?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}

export interface FlushResult {
  flushed: number;
  remaining: number;
  failed: number;
  skippedOffline?: boolean;
}

export interface FlushOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  authToken?: string;
  onItemError?: (item: OfflineMutation, error: string) => void;
}

const DB_NAME = 'dukkanim_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_outbox';
const LS_FALLBACK_KEY = 'offline_outbox';
const QUEUE_CHANGED_EVENT = 'dukkanim_offline_queue_changed';

// DOM dışı test ortamları (Node/tsx) için bellek içi son çare deposu
let memoryFallbackOutbox: OfflineMutation[] = [];
let activeFlushPromise: Promise<FlushResult> | null = null;

/**
 * RFC 4122 v4 uyumlu deterministik X-Idempotency-Key UUID üretir.
 * Kuyruğa eklendiğinde bir kez üretilir ve tüm tekrar denemelerde aynı anahtar kullanılır.
 */
export function generateIdempotencyKey(): string {
  const c = typeof globalThis !== 'undefined' ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = Math.floor(Math.random() * 16);
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function emitQueueChanged(count: number): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT, { detail: { count } }));
  }
}

function readLocalStorageOutbox(): OfflineMutation[] | null {
  try {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis) || !globalThis.localStorage) {
      return null;
    }
    const raw = globalThis.localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }
}

function writeLocalStorageOutbox(items: OfflineMutation[]): boolean {
  try {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis) || !globalThis.localStorage) {
      return false;
    }
    globalThis.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
}

async function readOutbox(): Promise<OfflineMutation[]> {
  if (typeof indexedDB !== 'undefined') {
    try {
      const db = await openOfflineDb();
      const items = await new Promise<OfflineMutation[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
        req.onerror = () => reject(req.error || new Error('IndexedDB read failed'));
      });
      db.close();
      return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } catch {
      // IndexedDB başarısız olursa localStorage fallback'e düş
    }
  }

  const lsItems = readLocalStorageOutbox();
  if (lsItems !== null) {
    return lsItems.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return [...memoryFallbackOutbox].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function writeOutbox(items: OfflineMutation[]): Promise<void> {
  const sorted = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (typeof indexedDB !== 'undefined') {
    try {
      const db = await openOfflineDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        for (const item of sorted) {
          store.put(item);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
      });
      db.close();
      writeLocalStorageOutbox(sorted);
      emitQueueChanged(sorted.length);
      return;
    } catch {
      // Fallback below
    }
  }

  if (writeLocalStorageOutbox(sorted)) {
    emitQueueChanged(sorted.length);
    return;
  }

  memoryFallbackOutbox = sorted;
  emitQueueChanged(sorted.length);
}

/**
 * Çevrimdışı yazma işlemini kuyruğa ekler ve sabit X-Idempotency-Key atar.
 */
export async function enqueueOfflineMutation(input: EnqueueMutationInput): Promise<OfflineMutation> {
  const idempotencyKey = input.idempotencyKey || generateIdempotencyKey();
  const mutation: OfflineMutation = {
    id: `mut_${Date.now().toString(36)}_${idempotencyKey.slice(0, 8)}`,
    endpoint: input.endpoint,
    method: input.method || 'POST',
    payload: input.payload,
    headers: input.headers,
    idempotencyKey,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  const current = await readOutbox();
  // Aynı idempotencyKey varsa çift kayıt ekleme
  const existing = current.find((m) => m.idempotencyKey === idempotencyKey);
  if (existing) {
    return existing;
  }

  current.push(mutation);
  await writeOutbox(current);
  return mutation;
}

/**
 * Kuyruktaki bekleyen tüm çevrimdışı işlemleri döndürür (FIFO sıralı).
 */
export async function getOfflineOutbox(): Promise<OfflineMutation[]> {
  return readOutbox();
}

/**
 * Kuyrukta bekleyen işlem sayısını döndürür.
 */
export async function getPendingOfflineCount(): Promise<number> {
  const items = await readOutbox();
  return items.length;
}

/**
 * Kuyruğu tamamen temizler (oturum kapatma veya test sıfırlama için).
 */
export async function clearOfflineOutbox(): Promise<void> {
  memoryFallbackOutbox = [];
  await writeOutbox([]);
}

/**
 * Bekleyen işlemleri FIFO sırasıyla sunucuya gönderir.
 * Aynı anda birden fazla flush çağrısını tek promise üzerinde birleştirir.
 */
export function flushOfflineOutbox(options: FlushOptions = {}): Promise<FlushResult> {
  if (activeFlushPromise) {
    return activeFlushPromise;
  }

  activeFlushPromise = (async () => {
    const items = await readOutbox();
    if (items.length === 0) {
      return { flushed: 0, remaining: 0, failed: 0 };
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { flushed: 0, remaining: items.length, failed: 0, skippedOffline: true };
    }

    const fetchFn = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch : undefined);
    if (!fetchFn) {
      return { flushed: 0, remaining: items.length, failed: items.length };
    }

    const base = (options.baseUrl || '').replace(/\/+$/, '');
    let flushed = 0;
    let failed = 0;
    const remainingItems: OfflineMutation[] = [];

    for (const item of items) {
      const targetUrl = item.endpoint.startsWith('http') ? item.endpoint : `${base}${item.endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': item.idempotencyKey,
        ...(item.headers || {}),
      };
      if (options.authToken && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${options.authToken}`;
      }

      try {
        const res = await fetchFn(targetUrl, {
          method: item.method,
          headers,
          credentials: 'include',
          body: item.payload !== undefined ? JSON.stringify(item.payload) : undefined,
        });

        if (res.ok) {
          flushed += 1;
          continue;
        }

        // Kalıcı istemci hatası (400/404/409/422): tekrar denenemez, kuyruktan düş ve bildir
        if ([400, 404, 409, 422].includes(res.status)) {
          failed += 1;
          options.onItemError?.(item, `HTTP ${res.status}`);
          continue;
        }

        // 401/403/408/429/5xx -> kuyrukta tut, retry artır
        failed += 1;
        remainingItems.push({
          ...item,
          retryCount: item.retryCount + 1,
          lastError: `HTTP ${res.status}`,
        });
        options.onItemError?.(item, `HTTP ${res.status}`);
      } catch (err) {
        failed += 1;
        const msg = err instanceof Error ? err.message : 'Network error';
        remainingItems.push({
          ...item,
          retryCount: item.retryCount + 1,
          lastError: msg,
        });
        options.onItemError?.(item, msg);
      }
    }

    await writeOutbox(remainingItems);
    return {
      flushed,
      remaining: remainingItems.length,
      failed,
    };
  })().finally(() => {
    activeFlushPromise = null;
  });

  return activeFlushPromise;
}

/**
 * İnternet bağlantısı geri geldiğinde offline kuyruğunu otomatik senkronize eden dinleyiciyi başlatır.
 */
export function initOfflineSyncListener(
  onSync?: (result: FlushResult) => void,
  flushOptions?: FlushOptions
): () => void {
  const triggerSync = () => {
    flushOfflineOutbox(flushOptions)
      .then((res) => {
        if (onSync && (res.flushed > 0 || res.failed > 0)) {
          onSync(res);
        }
      })
      .catch(() => {});
  };

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('online', triggerSync);
  }

  // Capacitor Network eklentisi mevcutsa onun değişimlerini de dinle
  let capRemove: (() => void) | undefined;
  const capNetwork =
    typeof globalThis !== 'undefined'
      ? (globalThis as { Capacitor?: { Plugins?: { Network?: { addListener?: Function } } } }).Capacitor?.Plugins?.Network
      : undefined;

  if (capNetwork && typeof capNetwork.addListener === 'function') {
    try {
      const handle = capNetwork.addListener('networkStatusChange', (status: { connected?: boolean }) => {
        if (status?.connected) {
          triggerSync();
        }
      });
      if (handle && typeof handle.remove === 'function') {
        capRemove = () => handle.remove();
      }
    } catch {
      // Capacitor Network eklentisi opsiyonel
    }
  }

  // Başlangıçta çevrimiçiyse bekleyen kayıtları hemen gönder
  if (typeof navigator === 'undefined' || navigator.onLine !== false) {
    triggerSync();
  }

  return () => {
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('online', triggerSync);
    }
    if (capRemove) {
      capRemove();
    }
  };
}
