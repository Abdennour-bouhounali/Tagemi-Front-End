import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, CheckCircle, Zap, ZapOff } from 'lucide-react';

const QRScanner = ({ onScanSuccess, onClose, eventId, actionTitle = "مسح رمز QR" }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const html5QrCodeRef = useRef(null);
  const scannerStartedRef = useRef(false);

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
          setError('لم يتم العثور على كاميرا');
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        setError('فشل في الوصول إلى الكاميرا. يرجى التحقق من الأذونات.');
      });

    return () => {
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
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        selectedCamera,
        config,
        async (decodedText, decodedResult) => {
          // Success callback
          await handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Error callback - called when nothing is detected
          // We don't show these errors as they're just "no QR code found" messages
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
      setError('فشل في بدء المسح. يرجى التحقق من أذونات الكاميرا.');
    }
  };

  const handleScanSuccess = async (decodedText) => {
    try {
      // Parse the QR code data
      let patientId;

      if (decodedText.includes(':')) {
        patientId = decodedText.split(':')[1];
      } else {
        patientId = decodedText;
      }

      // Validate patient ID
      if (!patientId || isNaN(patientId)) {
        setError('رمز QR غير صالح');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Stop scanning temporarily to prevent multiple scans
      if (html5QrCodeRef.current && scannerStartedRef.current) {
        await html5QrCodeRef.current.pause();
      }

      // Call the success callback with patient ID
      await onScanSuccess(patientId);

      setSuccess(`تم مسح المريض رقم #${patientId} بنجاح`);

      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);

    } catch (err) {
      console.error('QR Scan Error:', err);
      setError('حدث خطأ أثناء معالجة رمز QR');
      setTimeout(() => {
        setError('');
        // Resume scanning
        if (html5QrCodeRef.current && scannerStartedRef.current) {
          html5QrCodeRef.current.resume();
        }
      }, 3000);
    }
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !torchSupported) return;

    try {
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Error toggling torch:', err);
    }
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;

    const currentIndex = cameras.findIndex(cam => cam.id === selectedCamera);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white font-droid-arabic-kufi">
              {actionTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="p-4">
          {error && (
            <div className="mb-4 bg-red-50 border-r-4 border-red-500 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 font-droid-arabic-kufi text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border-r-4 border-green-500 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-700 font-droid-arabic-kufi text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Scanner Container */}
          <div className="relative">
            <div
              id="qr-reader"
              className="w-full rounded-lg overflow-hidden bg-gray-900"
              style={{ minHeight: '300px' }}
            />

            {/* Scanning Frame Overlay */}
            {scanning && !success && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-blue-500 rounded-lg shadow-lg">
                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400"></div>

                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse"></div>
                </div>
              </div>
            )}

            {/* Camera Controls */}
            {scanning && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                {torchSupported && (
                  <button
                    onClick={toggleTorch}
                    className={`p-3 rounded-full shadow-lg transition-all ${torchOn
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-white/90 hover:bg-white'
                      }`}
                    title={torchOn ? 'إطفاء الفلاش' : 'تشغيل الفلاش'}
                  >
                    {torchOn ? (
                      <Zap className="w-5 h-5 text-white" />
                    ) : (
                      <ZapOff className="w-5 h-5 text-gray-700" />
                    )}
                  </button>
                )}

                {cameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
                    title="تبديل الكاميرا"
                  >
                    <Camera className="w-5 h-5 text-gray-700" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center space-y-2">
            <p className="text-gray-700 font-droid-arabic-kufi text-sm font-semibold">
              وجّه الكاميرا نحو رمز QR الخاص بالمريض
            </p>
            <p className="text-gray-500 font-droid-arabic-kufi text-xs">
              تأكد من أن الرمز واضح وضمن الإطار الأزرق
            </p>
          </div>
        </div>

        {/* Footer Instructions */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 font-droid-arabic-kufi space-y-1">
              <p>• سيتم تسجيل حضور المريض تلقائياً بعد مسح الرمز</p>
              <p>• احتفظ بالهاتف ثابتاً لبضع ثوانٍ</p>
              {torchSupported && <p>• استخدم الفلاش إذا كانت الإضاءة ضعيفة</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;