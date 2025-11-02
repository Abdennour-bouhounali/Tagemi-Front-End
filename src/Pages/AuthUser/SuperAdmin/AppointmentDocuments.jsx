import React from 'react';
import { FileText, Download, Eye, AlertCircle } from 'lucide-react';

const AppointmentDocuments = ({ appointment }) => {
  const documents = appointment?.medical_document_urls || [];

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 font-droid-arabic-kufi">
          لا توجد مستندات طبية مرفقة
        </p>
      </div>
    );
  }

  // ✅ FIXED: Better download handler
  const handleDownload = (url, index) => {
    try {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or create a default one
      const filename = url.split('/').pop() || `medical_document_${appointment.patient_id}_${index + 1}.pdf`;
      link.download = filename;
      
      // Set attributes to force download
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-bold text-gray-800 font-droid-arabic-kufi flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-500" />
        المستندات الطبية ({documents.length})
      </h4>
      
      <div className="grid gap-2">
        {documents.map((doc, index) => (
          <div 
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 font-droid-arabic-kufi">
                  مستند طبي {index + 1}
                </p>
                <p className="text-xs text-gray-500">
                  {doc.split('.').pop().toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              
              <button
                onClick={() => handleDownload(doc, index)}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                title="تحميل"
              >
                <Download className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentDocuments;