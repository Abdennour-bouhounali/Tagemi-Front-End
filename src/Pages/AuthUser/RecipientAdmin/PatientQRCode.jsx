import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '../../../Components/ui';

const PatientQRCode = ({ patientId, patientName, size = 200, showDownload = true }) => {
  const qrValue = `patient_id:${patientId}`;

  const downloadQRCode = () => {
    const svg = document.getElementById(`qr-${patientId}`);
    if (!svg) return;
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
      <div className="p-3 bg-white rounded-2xl border border-line">
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
        <p className="font-semibold text-ink">{patientName}</p>
        <p className="text-sm text-muted">رقم المريض #{patientId}</p>
      </div>
      {showDownload && (
        <Button variant="secondary" icon={Download} onClick={downloadQRCode}>
          حمّل صورة الرمز
        </Button>
      )}
    </div>
  );
};

// Component to add to patient details modal
export const PatientQRSection = ({ appointment }) => {
  return (
    <section className="rounded-2xl border border-line bg-white p-4">
      <PatientQRCode
        patientId={appointment.patient_id}
        patientName={appointment.full_name}
        size={180}
        showDownload={true}
      />
      <p className="mt-3 text-xs text-muted text-center">
        يُمسح هذا الرمز عند الاستقبال لتسجيل الحضور بسرعة.
      </p>
    </section>
  );
};

export default PatientQRCode;
