import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { SwitchCamera, X, AlertTriangle, CheckCircle2, Zap, ZapOff, Loader2 } from 'lucide-react';
import { cx } from '../../../Components/ui';

/**
 * Full-screen camera on phones (centered panel from sm up). Reads a patient QR
 * ("patient_id:123" or "123") or a number typed by hand, then calls
 * onScanSuccess(patientId). If onScanSuccess returns exactly `false`, the
 * scanner stays open for another try; otherwise it closes after a moment.
 * Props: onScanSuccess, onClose, eventId, actionTitle.
 */
const QRScanner = ({ onScanSuccess, onClose, eventId, actionTitle = 'امسح رمز QR' }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualId, setManualId] = useState('');

  const html5QrCodeRef = useRef(null);
  const scannerStartedRef = useRef(false);
  const busyRef = useRef(false);
  const closeTimer = useRef(null);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back camera (environment-facing)
          const backCamera = devices.find(
            (device) =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        } else {
          setError('لم نجد كاميرا على هذا الجهاز. أدخل رقم المريض يدوياً في الأسفل.');
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        setError('لا يمكن فتح الكاميرا. اسمح للمتصفح باستعمالها، أو أدخل الرقم يدوياً في الأسفل.');
      });

    return () => {
      clearTimeout(closeTimer.current);
      // Cleanup scanner on unmount
      if (html5QrCodeRef.current && scannerStartedRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current.clear();
          })
          .catch((err) => console.error('Error stopping scanner:', err));
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCamera && !scanning) {
      startScanning();
    }
  }, [selectedCamera]);

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        selectedCamera,
        config,
        async (decodedText) => {
          await handleScanSuccess(decodedText);
        },
        () => {
          // Called on every frame without a QR code: nothing to show
        }
      );

      scannerStartedRef.current = true;
      setScanning(true);

      // Check if torch is supported
      const capabilities = await html5QrCode.getRunningTrackCameraCapabilities();
      if (capabilities && capabilities.torch) {
        setTorchSupported(true);
      }
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('تعذر تشغيل الكاميرا. تحقق من الإذن، أو أدخل الرقم يدوياً في الأسفل.');
    }
  };

  const pauseCamera = () => {
    try {
      if (html5QrCodeRef.current && scannerStartedRef.current) html5QrCodeRef.current.pause();
    } catch {
      // Already paused
    }
  };

  const resumeCamera = () => {
    try {
      if (html5QrCodeRef.current && scannerStartedRef.current) html5QrCodeRef.current.resume();
    } catch {
      // Not paused
    }
  };

  /** Shared by the camera and the manual field. */
  const submitPatientId = async (patientId) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setProcessing(true);
    setError('');
    pauseCamera();

    try {
      const result = await onScanSuccess(patientId);
      if (result === false) {
        // The page reported a failure (shown as a toast): let the user try again
        resumeCamera();
        return;
      }
      setSuccess(`تمت قراءة رقم المريض #${patientId}`);
      setManualId('');
      closeTimer.current = setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('QR Scan Error:', err);
      setError('حدث خطأ أثناء معالجة الرمز. حاول مرة أخرى.');
      resumeCamera();
    } finally {
      busyRef.current = false;
      setProcessing(false);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    // Parse the QR code data
    const patientId = decodedText.includes(':') ? decodedText.split(':')[1] : decodedText;

    // Validate patient ID
    if (!patientId || isNaN(patientId)) {
      setError('هذا ليس رمز مريض. امسح الرمز المطبوع على بطاقة المريض.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    await submitPatientId(String(patientId).trim());
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const id = manualId.trim();
    if (!/^\d+$/.test(id)) {
      setError('أدخل رقم المريض بالأرقام فقط.');
      return;
    }
    submitPatientId(id);
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !torchSupported) return;

    try {
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Error toggling torch:', err);
    }
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;

    const currentIndex = cameras.findIndex((cam) => cam.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    // Stop current scanner
    if (html5QrCodeRef.current && scannerStartedRef.current) {
      await html5QrCodeRef.current.stop();
      scannerStartedRef.current = false;
    }

    setScanning(false);
    setSelectedCamera(nextCamera.id);
  };

  // z-[65]: above sheets, below toasts (z-70), so check-in results stay visible
  return (
    <div className="fixed inset-0 z-[65] flex items-stretch sm:items-center justify-center bg-ink sm:bg-ink/80 sm:p-4" dir="rtl" role="dialog" aria-modal="true" aria-label={actionTitle}>
      <div className="relative flex w-full flex-col bg-ink text-white sm:max-w-md sm:rounded-3xl sm:overflow-hidden safe-bottom">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 pt-4 pb-3">
          <h2 className="flex-1 font-display text-xl leading-snug">{actionTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الكاميرا"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        {/* Camera */}
        <div className="relative flex-1 sm:flex-none min-h-[300px] bg-black">
          <div id="qr-reader" className="h-full w-full overflow-hidden" style={{ minHeight: '300px' }} />

          {scanning && !success && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div className="h-56 w-56 rounded-3xl border-4 border-white/85" />
            </div>
          )}

          {(processing || success) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/70 text-center px-6" role="status">
              {success ? <CheckCircle2 className="h-12 w-12 text-white" /> : <Loader2 className="h-10 w-10 animate-spin" />}
              <p className="font-semibold">{success || 'جاري المعالجة...'}</p>
            </div>
          )}

          {scanning && (torchSupported || cameras.length > 1) && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3">
              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  aria-label={torchOn ? 'أطفئ الضوء' : 'شغّل الضوء'}
                  aria-pressed={torchOn}
                  className={cx('inline-flex h-12 w-12 items-center justify-center rounded-full', torchOn ? 'bg-white text-ink' : 'bg-ink/70 text-white')}
                >
                  {torchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
                </button>
              )}
              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={switchCamera}
                  aria-label="بدّل الكاميرا"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink/70 text-white"
                >
                  <SwitchCamera className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hints, errors and the manual fallback */}
        <div className="px-4 pt-3 pb-4 space-y-3">
          {error ? (
            <p className="flex items-start gap-2 rounded-xl bg-red-700 px-3 py-2 text-sm" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : (
            <p className="text-sm text-white/75 text-center">
              ضع رمز المريض داخل الإطار وثبّت الهاتف لحظة.{torchSupported ? ' شغّل الضوء إن كانت الإضاءة ضعيفة.' : ''}
            </p>
          )}

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <label htmlFor="qr-manual-id" className="sr-only">أدخل الرقم يدوياً</label>
            <input
              id="qr-manual-id"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={manualId}
              onChange={(e) => setManualId(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="أدخل الرقم يدوياً"
              className="h-12 min-w-0 flex-1 rounded-xl border border-white/25 bg-white/10 px-3 text-base text-white placeholder:text-white/60 focus:border-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!manualId || processing}
              className="h-12 shrink-0 rounded-xl bg-white px-4 text-sm font-semibold text-ink disabled:opacity-50"
            >
              تابع بهذا الرقم
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
