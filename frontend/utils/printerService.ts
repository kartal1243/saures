// 58mm / 80mm Termal Yazıcı (ESC/POS + Türkçe CP857 + Web Bluetooth & Capacitor Native Köprü)

export type PaperWidth = '58mm' | '80mm';

export interface ReceiptPrintItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  isGift?: boolean;
  isWeighed?: boolean;
}

export interface ReceiptPrintData {
  receiptNo?: string;
  storeName?: string;
  title?: string;
  tableName?: string;
  date?: string;
  paymentMethod?: string;
  customerName?: string;
  note?: string;
  items: ReceiptPrintItem[];
  total: number;
  cashReceived?: number;
  changeAmount?: number;
  footerMessage?: string;
}

export interface ThermalPrintOptions {
  paperWidth?: PaperWidth;
  deviceAddress?: string;
  useWebBluetooth?: boolean;
  serviceUuid?: string;
  characteristicUuid?: string;
}

export interface ThermalPrintResult {
  printed: boolean;
  mode: 'capacitor_native' | 'web_bluetooth' | 'browser_fallback';
  bytes: Uint8Array;
  error?: string;
}

interface CapacitorEscPosPlugin {
  printBytes?: (opts: { bytes: number[]; address?: string; paperWidth?: PaperWidth }) => Promise<void>;
  printRaw?: (opts: { base64: string; address?: string; paperWidth?: PaperWidth }) => Promise<void>;
}

const ESC = 0x1b;
const GS = 0x1d;

// Yaygın BLE termal yazıcı GATT UUID'leri
const DEFAULT_BLE_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const DEFAULT_BLE_CHAR_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

/**
 * IBM Code Page 857 (Türkçe DOS) karakter tablosu.
 * Termal ESC/POS yazıcılarda Türkçe harflerin bozulmadan basılmasını sağlar.
 */
export const TURKISH_CP857_MAP: Record<string, number> = {
  'Ç': 0x80,
  'ü': 0x81,
  'é': 0x82,
  'â': 0x83,
  'ä': 0x84,
  'à': 0x85,
  'å': 0x86,
  'ç': 0x87,
  'ê': 0x88,
  'ë': 0x89,
  'è': 0x8a,
  'ï': 0x8b,
  'î': 0x8c,
  'ı': 0x8d,
  'Ä': 0x8e,
  'Å': 0x8f,
  'É': 0x90,
  'æ': 0x91,
  'Æ': 0x92,
  'ô': 0x93,
  'ö': 0x94,
  'ò': 0x95,
  'û': 0x96,
  'ù': 0x97,
  'İ': 0x98,
  'Ö': 0x99,
  'Ü': 0x9a,
  'ø': 0x9b,
  '£': 0x9c,
  'Ø': 0x9d,
  'Ş': 0x9e,
  'ş': 0x9f,
  'á': 0xa0,
  'í': 0xa1,
  'ó': 0xa2,
  'ú': 0xa3,
  'ñ': 0xa4,
  'Ñ': 0xa5,
  'Ğ': 0xa6,
  'ğ': 0xa7,
  '¿': 0xa8,
  '®': 0xa9,
  '½': 0xab,
  '¼': 0xac,
  '¡': 0xad,
  '«': 0xae,
  '»': 0xaf,
  '°': 0xf8,
  '·': 0xfa,
};

/**
 * Verilen metni CP857 bayt dizisine çevirir.
 * CP857'de yer almayan '₺' sembolünü güvenli şekilde 'TL' olarak yazar.
 */
export function encodeTurkishCp857(text: string): Uint8Array {
  const normalized = (text || '').replace(/₺/g, 'TL').replace(/•/g, '-');
  const bytes: number[] = [];

  for (const ch of normalized) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) {
      bytes.push(code);
    } else if (ch === '\n' || ch === '\r' || ch === '\t') {
      bytes.push(code);
    } else if (TURKISH_CP857_MAP[ch] !== undefined) {
      bytes.push(TURKISH_CP857_MAP[ch]);
    } else {
      bytes.push(0x3f); // '?'
    }
  }

  return new Uint8Array(bytes);
}

function getColumnWidth(paperWidth: PaperWidth): number {
  return paperWidth === '80mm' ? 48 : 32;
}

function formatColumns(left: string, right: string, width: number): string {
  const cleanLeft = (left || '').trim();
  const cleanRight = (right || '').trim();
  if (cleanLeft.length + cleanRight.length + 1 <= width) {
    const spaces = width - cleanLeft.length - cleanRight.length;
    return `${cleanLeft}${' '.repeat(spaces)}${cleanRight}`;
  }
  const maxLeft = Math.max(4, width - cleanRight.length - 1);
  return `${cleanLeft.slice(0, maxLeft)} ${cleanRight}`;
}

function wrapTextLines(text: string, width: number): string[] {
  const clean = (text || '').trim();
  if (!clean) return [];
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word.slice(0, width);
    } else if (current.length + 1 + word.length <= width) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word.slice(0, width);
    }
  }
  if (current) lines.push(current);
  return lines;
}

function pushBytes(target: number[], chunk: number[] | Uint8Array): void {
  for (let i = 0; i < chunk.length; i += 1) {
    target.push(chunk[i]);
  }
}

function pushLine(target: number[], text: string): void {
  pushBytes(target, encodeTurkishCp857(`${text}\n`));
}

/**
 * 58mm (32 kolon) veya 80mm (48 kolon) termal yazıcılar için tam ESC/POS bayt dizisi üretir.
 */
export function buildEscPosReceiptBytes(
  receipt: ReceiptPrintData,
  paperWidth: PaperWidth = '58mm'
): Uint8Array {
  const width = getColumnWidth(paperWidth);
  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);
  const out: number[] = [];

  // Yazıcıyı sıfırla + Türkçe CP857 codepage seç (ESC t 0x12)
  pushBytes(out, [ESC, 0x40]);
  pushBytes(out, [ESC, 0x74, 0x12]);

  // Başlık (ortalanmış + kalın)
  pushBytes(out, [ESC, 0x61, 0x01]);
  pushBytes(out, [ESC, 0x45, 0x01]);
  const storeTitle = (receipt.storeName || 'DÜKKÂNIM YANIMDA').toUpperCase();
  for (const line of wrapTextLines(storeTitle, width)) {
    pushLine(out, line);
  }
  pushBytes(out, [ESC, 0x45, 0x00]);
  pushLine(out, (receipt.title || 'SATIŞ BİLGİ FİŞİ').toUpperCase());

  // Sol hizalı üst bilgiler
  pushBytes(out, [ESC, 0x61, 0x00]);
  pushLine(out, divider);
  if (receipt.receiptNo) {
    pushLine(out, formatColumns('Fiş No:', receipt.receiptNo, width));
  }
  if (receipt.tableName) {
    pushLine(out, formatColumns('Masa:', receipt.tableName, width));
  }
  pushLine(out, formatColumns('Tarih:', receipt.date || new Date().toLocaleString('tr-TR'), width));
  if (receipt.paymentMethod) {
    pushLine(out, formatColumns('Ödeme:', receipt.paymentMethod, width));
  }
  if (receipt.customerName) {
    pushLine(out, formatColumns('Müşteri:', receipt.customerName, width));
  }
  if (receipt.note) {
    for (const line of wrapTextLines(`Not: ${receipt.note}`, width)) {
      pushLine(out, line);
    }
  }

  pushLine(out, divider);
  pushBytes(out, [ESC, 0x45, 0x01]);
  pushLine(out, formatColumns('ÜRÜN', 'TUTAR', width));
  pushBytes(out, [ESC, 0x45, 0x00]);
  pushLine(out, divider);

  // Kalemler
  for (const item of receipt.items) {
    const itemTotal = item.isGift
      ? 0
      : typeof item.total === 'number'
        ? item.total
        : Number((item.quantity * item.unitPrice).toFixed(2));
    const itemName = item.isGift ? `${item.name} (İKRAM)` : item.name;
    const rightStr = item.isGift ? 'İKRAM' : `${itemTotal.toFixed(2)} TL`;
    const qtyDetail = `  ${item.quantity} x ${item.unitPrice.toFixed(2)} TL`;

    if (itemName.length + rightStr.length + 1 <= width) {
      pushLine(out, formatColumns(itemName, rightStr, width));
      pushLine(out, qtyDetail);
    } else {
      for (const line of wrapTextLines(itemName, width)) {
        pushLine(out, line);
      }
      pushLine(out, formatColumns(qtyDetail, rightStr, width));
    }
  }

  // Toplam
  pushLine(out, doubleDivider);
  pushBytes(out, [ESC, 0x45, 0x01]);
  pushLine(out, formatColumns('GENEL TOPLAM:', `${Number(receipt.total || 0).toFixed(2)} TL`, width));
  pushBytes(out, [ESC, 0x45, 0x00]);

  if (typeof receipt.cashReceived === 'number' && receipt.cashReceived > 0) {
    pushLine(out, formatColumns('Alınan Nakit:', `${receipt.cashReceived.toFixed(2)} TL`, width));
    pushLine(out, formatColumns('Para Üstü:', `${(receipt.changeAmount || 0).toFixed(2)} TL`, width));
  }

  // Alt bilgi (ortalanmış)
  pushLine(out, divider);
  pushBytes(out, [ESC, 0x61, 0x01]);
  const footer = receipt.footerMessage || 'Mali değeri yoktur - Bilgi fişidir.';
  for (const line of wrapTextLines(footer, width)) {
    pushLine(out, line);
  }
  pushLine(out, 'Dükkanım Yanımda');
  pushLine(out, '');
  pushLine(out, '');
  pushLine(out, '');

  // Kağıt kesme (GS V 66 0)
  pushBytes(out, [GS, 0x56, 0x42, 0x00]);

  return new Uint8Array(out);
}

function getCapacitorEscPosPlugin(): CapacitorEscPosPlugin | null {
  if (typeof globalThis === 'undefined') return null;
  const cap = (globalThis as { Capacitor?: { Plugins?: { EscPosPrinter?: CapacitorEscPosPlugin } } }).Capacitor;
  return cap?.Plugins?.EscPosPrinter || null;
}

export function isNativeThermalPrinterAvailable(): boolean {
  const plugin = getCapacitorEscPosPlugin();
  return Boolean(plugin && (typeof plugin.printBytes === 'function' || typeof plugin.printRaw === 'function'));
}

export function isWebBluetoothAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  return binary;
}

async function sendBytesOverWebBluetooth(
  bytes: Uint8Array,
  serviceUuid: string,
  characteristicUuid: string
): Promise<void> {
  const bt = (navigator as unknown as { bluetooth?: { requestDevice: Function } }).bluetooth;
  if (!bt) {
    throw new Error('Web Bluetooth bu cihazda desteklenmiyor.');
  }

  const device = await bt.requestDevice({
    acceptAllDevices: true,
    optionalServices: [serviceUuid],
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(serviceUuid);
  const characteristic = await service.getCharacteristic(characteristicUuid);

  // BLE paket limiti (20 byte güvenli chunk)
  const chunkSize = 20;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const slice = bytes.slice(offset, offset + chunkSize);
    if (typeof characteristic.writeValueWithoutResponse === 'function') {
      await characteristic.writeValueWithoutResponse(slice);
    } else {
      await characteristic.writeValue(slice);
    }
  }
}

/**
 * Termal yazıcıya doğrudan ESC/POS yazdırma yapar:
 * 1) Capacitor Native `EscPosPrinter` eklentisi varsa onu kullanır
 * 2) İstenmişse Web Bluetooth üzerinden gönderir
 * 3) Hiçbiri yoksa tarayıcı print fallback bilgisini döner
 */
export async function printReceiptThermal(
  receipt: ReceiptPrintData,
  options: ThermalPrintOptions = {}
): Promise<ThermalPrintResult> {
  const paperWidth = options.paperWidth || '58mm';
  const bytes = buildEscPosReceiptBytes(receipt, paperWidth);

  const nativePlugin = getCapacitorEscPosPlugin();
  if (nativePlugin) {
    try {
      if (typeof nativePlugin.printBytes === 'function') {
        await nativePlugin.printBytes({
          bytes: Array.from(bytes),
          address: options.deviceAddress,
          paperWidth,
        });
        return { printed: true, mode: 'capacitor_native', bytes };
      }
      if (typeof nativePlugin.printRaw === 'function') {
        await nativePlugin.printRaw({
          base64: uint8ToBase64(bytes),
          address: options.deviceAddress,
          paperWidth,
        });
        return { printed: true, mode: 'capacitor_native', bytes };
      }
    } catch (err) {
      return {
        printed: false,
        mode: 'capacitor_native',
        bytes,
        error: err instanceof Error ? err.message : 'Native yazıcı hatası',
      };
    }
  }

  if (options.useWebBluetooth && isWebBluetoothAvailable()) {
    try {
      await sendBytesOverWebBluetooth(
        bytes,
        options.serviceUuid || DEFAULT_BLE_SERVICE_UUID,
        options.characteristicUuid || DEFAULT_BLE_CHAR_UUID
      );
      return { printed: true, mode: 'web_bluetooth', bytes };
    } catch (err) {
      return {
        printed: false,
        mode: 'web_bluetooth',
        bytes,
        error: err instanceof Error ? err.message : 'Bluetooth yazıcı bağlantı hatası',
      };
    }
  }

  return {
    printed: false,
    mode: 'browser_fallback',
    bytes,
  };
}
