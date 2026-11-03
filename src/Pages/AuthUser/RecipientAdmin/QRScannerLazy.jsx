import { lazy, Suspense } from 'react';

// The camera library (html5-qrcode, ~100 KB gzip) is downloaded only when a
// scanner opens, not with every queue / presence page
const QRScanner = lazy(() => import('./QRScanner'));

export default function QRScannerLazy(props) {
  return (
    <Suspense
      fallback={(
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/60 text-white font-semibold" role="status">
          جاري فتح الكاميرا…
        </div>
      )}
    >
      <QRScanner {...props} />
    </Suspense>
  );
}
