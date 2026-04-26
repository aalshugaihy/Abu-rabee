/**
 * Lightweight "PDF export" via the browser's built-in Print → Save as PDF
 * dialog. This avoids pulling a multi-MB PDF library into the bundle while
 * still producing a proper PDF that respects our @media print stylesheet.
 *
 * Strategy: open a new window, copy the current document's <head> (so the
 * Tailwind stylesheet is loaded), inject just the target element's HTML, and
 * invoke print().
 */
export function printElementAsPdf(el: HTMLElement, title: string): void {
  const popup = window.open('', '_blank', 'noopener,width=900,height=1100');
  if (!popup) return;
  const styles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');
  const dir = document.documentElement.dir || 'ltr';
  const lang = document.documentElement.lang || 'en';
  popup.document.open();
  popup.document.write(`<!doctype html>
<html lang="${lang}" dir="${dir}">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    ${styles}
    <style>
      body { padding: 24px; background: #fff; }
      .card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
      .print\\:hidden, button, header > nav, aside { display: none !important; }
    </style>
  </head>
  <body>
    <h1 style="font-weight: 800; font-size: 22px; margin: 0 0 16px 0;">${escapeHtml(title)}</h1>
    ${el.outerHTML}
  </body>
</html>`);
  popup.document.close();
  // Give the popup a tick to load CSS and lay out, then trigger print.
  popup.onload = () => {
    popup.focus();
    popup.print();
  };
  // Fallback for browsers that don't fire onload reliably for about:blank docs.
  setTimeout(() => {
    try {
      popup.focus();
      popup.print();
    } catch {
      /* noop */
    }
  }, 800);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
