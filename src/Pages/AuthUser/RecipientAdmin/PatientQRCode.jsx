import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';

const PatientQRCode = ({ patientId, patientName, size = 200, showDownload = true }) => {
  const qrValue = `patient_id:${patientId}`;

  const downloadQRCode = () => {
    const svg = document.getElementById(`qr-${patientId}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size + 40;
      canvas.height = size + 40;
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code
      ctx.drawImage(img, 20, 20, size, size);
      
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_Patient_${patientId}_${patientName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
        <QRCodeSVG
          id={`qr-${patientId}`}
          value={qrValue}
          size={size}
          level="H"
          includeMargin={true}
          imageSettings={{
            excavate: true,
          }}
        />
      </div>
      <div className="text-center">
        <p className="font-bold text-gray-900 font-droid-arabic-kufi text-sm">
          {patientName}
        </p>
        <p className="text-xs text-gray-600">
          رقم المريض: #{patientId}
        </p>
      </div>
      {showDownload && (
        <button
          onClick={downloadQRCode}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors font-droid-arabic-kufi text-sm"
        >
          <Download className="w-4 h-4" />
          تحميل QR
        </button>
      )}
    </div>
  );
};

// Component to add to patient details modal
export const PatientQRSection = ({ appointment }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-4 border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="w-5 h-5 text-blue-600" />
        <h4 className="text-lg font-bold text-gray-900 font-droid-arabic-kufi">
          رمز QR للحضور السريع
        </h4>
      </div>
      
      <div className="flex flex-col items-center">
        <PatientQRCode
          patientId={appointment.patient_id}
          patientName={appointment.full_name}
          size={180}
          showDownload={true}
        />
        
        <div className="mt-4 bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-blue-200 w-full">
          <p className="text-xs text-gray-600 font-droid-arabic-kufi text-center">
            💡 يمكن استخدام هذا الرمز لتسجيل الحضور بسرعة عبر المسح بالكاميرا
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientQRCode;