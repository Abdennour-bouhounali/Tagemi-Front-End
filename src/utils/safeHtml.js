import DOMPurify from 'dompurify';

// Helpers for the print/export popups that build HTML strings by hand.
// Patient fields come from the public booking form, so every value that is
// interpolated into such a string MUST go through escapeHtml().

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

export const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`]/g, (ch) => HTML_ESCAPES[ch]);
};

// Blocks any script (inline, event handlers, external) in the popup. The popup
// shares the app's origin, so a script there could read the auth token.
const PRINT_CSP =
  `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src * data: blob:; style-src 'unsafe-inline' https:; font-src https: data:">`;

export const writePrintDocument = (printWindow, html) => {
  if (!printWindow) return;
  const withCsp = /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (head) => `${head}${PRINT_CSP}`)
    : `${PRINT_CSP}${html}`;
  printWindow.document.open();
  printWindow.document.write(withCsp);
  printWindow.document.close();
};

// Prevents CSV/Excel formula injection (=, +, -, @, tab, CR at cell start).
export const csvSafe = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
};

// Rich text written in the content editor (activities, projects) is shown to
// every visitor, so it is cleaned of scripts, event handlers and the like first.
export const sanitizeHtml = (html) => DOMPurify.sanitize(html ?? '', { USE_PROFILES: { html: true } });
