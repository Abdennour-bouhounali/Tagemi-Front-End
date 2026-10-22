import React, { useContext } from 'react';
import { AppContext } from '../../../Context/AppContext';
import { downloadProtectedFile, openProtectedFile } from '../../../utils/protectedFile';
import { FileText, Download, Eye } from 'lucide-react';
import { IconButton } from '../../../Components/ui';

/**
 * Medical documents attached to an appointment. Files are served by an
 * authenticated endpoint, so they are opened/downloaded with the token.
 * allowDownload (optional, default true) hides the download button.
 */
const AppointmentDocuments = ({ appointment, allowDownload = true }) => {
  const { token } = useContext(AppContext);
  const documents = appointment?.medical_document_urls || [];

  if (!documents || documents.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-paper px-3 py-3 text-sm text-muted">
        <FileText className="w-4 h-4 shrink-0" />
        لم يرفق المريض أي مستند طبي.
      </p>
    );
  }

  const handleDownload = (url, index) => {
    downloadProtectedFile(url, token, `medical_document_${appointment.patient_id}_${index + 1}`);
  };

  return (
    <section>
      <h3 className="font-semibold text-ink mb-2">المستندات الطبية ({documents.length})</h3>
      <ul className="divide-y divide-line rounded-xl border border-line bg-white">
        {documents.map((doc, index) => (
          <li key={index} className="flex items-center gap-2 ps-3 pe-1 py-1">
            <FileText className="w-5 h-5 shrink-0 text-ink-soft" />
            <span className="flex-1 text-sm font-medium text-ink">مستند طبي {index + 1}</span>
            <IconButton icon={Eye} label={`عرض المستند ${index + 1}`} onClick={() => openProtectedFile(doc, token)} />
            {allowDownload && (
              <IconButton icon={Download} label={`تحميل المستند ${index + 1}`} onClick={() => handleDownload(doc, index)} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AppointmentDocuments;
