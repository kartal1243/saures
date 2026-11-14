export type PrintPaperWidth = '58mm' | '80mm' | 'A4';

export interface PrintHtmlDocumentOptions {
  title: string;
  bodyHtml: string;
  paperWidth?: PrintPaperWidth;
  extraCss?: string;
}

/**
 * HTML çıktılarında XSS ve bozulmaları önlemek için güvenli kaçış yardımcı fonksiyonu.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Termal fiş (58mm/80mm) veya A4 belgeleri ana DOM'dan izole bir iframe içinde yazdırır.
 * Tüm görsellerin yüklenmesini bekler ve yazdırma penceresi kapandıktan sonra iframe'i temizler.
 */
export function printHtmlDocument({
  title,
  bodyHtml,
  paperWidth = 'A4',
  extraCss = '',
}: PrintHtmlDocumentOptions): void {
  if (typeof document === 'undefined') return;

  const isThermal = paperWidth === '58mm' || paperWidth === '80mm';
  const pageSizeCss = isThermal ? `${paperWidth} auto` : 'A4 portrait';
  const bodyMaxWidth = paperWidth === '58mm' ? '54mm' : paperWidth === '80mm' ? '76mm' : '210mm';
  const pagePadding = isThermal ? '3mm' : '12mm';

  const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: ${pageSizeCss};
      margin: ${isThermal ? '2mm' : '10mm'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: ${isThermal ? "'Courier New', Courier, monospace" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"};
      font-size: ${isThermal ? '11px' : '13px'};
      line-height: 1.45;
    }
    .print-shell {
      width: 100%;
      max-width: ${bodyMaxWidth};
      margin: 0 auto;
      padding: ${pagePadding};
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    img {
      max-width: 100%;
    }
    ${extraCss}
  </style>
</head>
<body>
  <div class="print-shell">${bodyHtml}</div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const cleanup = () => {
    setTimeout(() => {
      try {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      } catch {
        // ignore cleanup error
      }
    }, 1000);
  };

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    cleanup();
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } catch {
      window.print();
    } finally {
      cleanup();
    }
  };

  const images = Array.from(doc.images || []);
  if (images.length === 0) {
    setTimeout(triggerPrint, 80);
    return;
  }

  let settled = 0;
  const onImageSettled = () => {
    settled += 1;
    if (settled >= images.length) {
      setTimeout(triggerPrint, 80);
    }
  };

  for (const img of images) {
    if (img.complete) {
      onImageSettled();
    } else {
      img.addEventListener('load', onImageSettled, { once: true });
      img.addEventListener('error', onImageSettled, { once: true });
    }
  }

  // Harici QR/logo görseli takılırsa yazdırmayı kilitlememek için güvenlik zaman aşımı
  setTimeout(triggerPrint, 2500);
}
