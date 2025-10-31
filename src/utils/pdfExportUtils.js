// Professional PDF Export Utilities - WITH ARABIC FONT SUPPORT
// Install: npm install jspdf jspdf-autotable

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Arabic Font Support - We'll use a workaround for Arabic text
// Since jsPDF has limited Arabic support, we'll use a combination approach

// Helper function to reverse Arabic text for better display
// This is a simple workaround - for production, consider using a proper Arabic font
const reverseArabicText = (text) => {
  // Check if text contains Arabic characters
  const arabicRegex = /[\u0600-\u06FF]/;
  if (arabicRegex.test(text)) {
    // For mixed text (Arabic + numbers), we need to be careful
    return text.split('').reverse().join('');
  }
  return text;
};

// Add professional header
const addHeader = (doc, title, eventName) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add header background
  doc.setFillColor(79, 70, 229); // Indigo color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Add logo placeholder (you can replace with actual logo)
  doc.setFillColor(255, 255, 255);
  doc.circle(20, 20, 12, 'F');
  
  // Add title - using larger font for Arabic
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(reverseArabicText(title), pageWidth - 15, 20, { align: 'right' });
  
  // Add event name
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(reverseArabicText(eventName), pageWidth - 15, 30, { align: 'right' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
};

// Add footer with page numbers
const addFooter = (doc, pageNumber, totalPages) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Footer line
  doc.setDrawColor(200, 200, 200);
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
  
  // Page number
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const footerText = `${totalPages} من ${pageNumber} صفحة`;
  doc.text(reverseArabicText(footerText), pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // Generation date
  const dateText = `${new Date().toLocaleDateString('ar-SA')} :تاريخ الإنشاء`;
  doc.text(reverseArabicText(dateText), pageWidth - 15, pageHeight - 10, { align: 'right' });
};

// Add metadata section
const addMetadata = (doc, metadata, startY) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = startY;
  
  // Metadata box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, currentY, pageWidth - 30, 35, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  let yOffset = currentY + 10;
  Object.entries(metadata).forEach(([key, value]) => {
    const text = `${value} :${key}`;
    doc.text(reverseArabicText(text), pageWidth - 20, yOffset, { align: 'right' });
    yOffset += 7;
  });
  
  return currentY + 40;
};

// Export Demographic Statistics PDF
export const exportDemographicPDF = (event, genderStats, ageStats) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 50;
  
  // Add header
  addHeader(doc, 'إحصائيات ديموغرافية', event.name);
  
  // Add metadata
  const metadata = {
    'اسم الحدث': event.name,
    'تاريخ التقرير': new Date().toLocaleDateString('ar-SA'),
    'الوقت': new Date().toLocaleTimeString('ar-SA'),
  };
  yPosition = addMetadata(doc, metadata, yPosition);
  
  // Summary section
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(reverseArabicText('ملخص تنفيذي'), pageWidth - 15, yPosition, { align: 'right' });
  
  const totalPatients = genderStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
  
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(reverseArabicText(`${totalPatients} :إجمالي عدد المرضى المسجلين`), pageWidth - 20, yPosition, { align: 'right' });
  
  // Gender Statistics Table
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(reverseArabicText('إحصائيات الجنس'), pageWidth - 15, yPosition, { align: 'right' });
  
  const genderTableData = genderStats.map(stat => {
    const genderName = stat.sex === '0' || stat.sex === 'ذكر' ? 'ذكر' : 'أنثى';
    const percentage = ((parseInt(stat.count) / totalPatients) * 100).toFixed(1);
    return [reverseArabicText(genderName), stat.count, `${percentage}%`];
  });
  
  doc.autoTable({
    startY: yPosition + 5,
    head: [[reverseArabicText('الجنس'), reverseArabicText('العدد'), reverseArabicText('النسبة المئوية')]],
    body: genderTableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 11,
      halign: 'center',
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 12,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { right: 15, left: 15 },
  });
  
  yPosition = doc.lastAutoTable.finalY + 15;
  
  // Age Statistics Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(reverseArabicText('إحصائيات الفئات العمرية'), pageWidth - 15, yPosition, { align: 'right' });
  
  const ageTableData = ageStats.map(stat => {
    const percentage = ((parseInt(stat.count) / totalPatients) * 100).toFixed(1);
    return [reverseArabicText(`${stat.age_group} سنة`), stat.count, `${percentage}%`];
  });
  
  doc.autoTable({
    startY: yPosition + 5,
    head: [[reverseArabicText('الفئة العمرية'), reverseArabicText('العدد'), reverseArabicText('النسبة المئوية')]],
    body: ageTableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 11,
      halign: 'center',
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 12,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { right: 15, left: 15 },
  });
  
  // Add footer
  addFooter(doc, 1, 1);
  
  // Save the PDF
  const fileName = `demographic_statistics_${event.name}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Export Specialty Statistics PDF
export const exportSpecialtyPDF = (event, statistics) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 50;
  
  // Add header
  addHeader(doc, 'إحصائيات التخصصات', event.name);
  
  // Add metadata
  const metadata = {
    'اسم الحدث': event.name,
    'تاريخ التقرير': new Date().toLocaleDateString('ar-SA'),
    'عدد التخصصات': statistics.length.toString(),
  };
  yPosition = addMetadata(doc, metadata, yPosition);
  
  // Summary section
  const totalAppointments = statistics.reduce((sum, stat) => sum + parseInt(stat.total_appointments), 0);
  const totalCompleted = statistics.reduce((sum, stat) => sum + parseInt(stat.completed), 0);
  const totalCancelled = statistics.reduce((sum, stat) => sum + parseInt(stat.cancelled), 0);
  const totalNoShow = statistics.reduce((sum, stat) => sum + parseInt(stat.no_show), 0);
  const totalPending = statistics.reduce((sum, stat) => sum + parseInt(stat.pending), 0);
  const overallCompletionRate = ((totalCompleted / totalAppointments) * 100).toFixed(1);
  
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(reverseArabicText('ملخص تنفيذي'), pageWidth - 15, yPosition, { align: 'right' });
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryLine = `معلق: ${totalPending} | غائب: ${totalNoShow} | ملغي: ${totalCancelled} | مكتمل: ${totalCompleted} | إجمالي المواعيد: ${totalAppointments}`;
  doc.text(reverseArabicText(summaryLine), pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 6;
  doc.text(reverseArabicText(`%${overallCompletionRate} :معدل الإكمال الإجمالي`), pageWidth - 20, yPosition, { align: 'right' });
  
  // Specialty Statistics Table
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(reverseArabicText('تفاصيل التخصصات'), pageWidth - 15, yPosition, { align: 'right' });
  
  const specialtyTableData = statistics.map(stat => {
    const completionRate = ((parseInt(stat.completed) / parseInt(stat.total_appointments)) * 100).toFixed(1);
    return [
      reverseArabicText(stat.name),
      stat.total_appointments,
      stat.completed,
      stat.cancelled,
      stat.no_show,
      stat.pending,
      `${completionRate}%`
    ];
  });
  
  doc.autoTable({
    startY: yPosition + 5,
    head: [[
      reverseArabicText('التخصص'),
      reverseArabicText('إجمالي'),
      reverseArabicText('مكتمل'),
      reverseArabicText('ملغي'),
      reverseArabicText('غائب'),
      reverseArabicText('معلق'),
      reverseArabicText('معدل الإكمال')
    ]],
    body: specialtyTableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      halign: 'center',
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'right', cellWidth: 50 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 20, fillColor: [220, 252, 231] },
      3: { halign: 'center', cellWidth: 20, fillColor: [254, 226, 226] },
      4: { halign: 'center', cellWidth: 20, fillColor: [255, 237, 213] },
      5: { halign: 'center', cellWidth: 20, fillColor: [219, 234, 254] },
      6: { halign: 'center', cellWidth: 30, fontStyle: 'bold' },
    },
    margin: { right: 15, left: 15 },
  });
  
  // Add footer
  addFooter(doc, 1, 1);
  
  // Save the PDF
  const fileName = `specialty_statistics_${event.name}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Export Geographic Statistics PDF
export const exportGeographicPDF = (event, statistics) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 50;
  
  // Add header
  addHeader(doc, 'إحصائيات جغرافية', event.name);
  
  // Add metadata
  const totalPatients = statistics.reduce((sum, stat) => sum + parseInt(stat.count), 0);
  const metadata = {
    'اسم الحدث': event.name,
    'تاريخ التقرير': new Date().toLocaleDateString('ar-SA'),
    'إجمالي المرضى': totalPatients.toString(),
  };
  yPosition = addMetadata(doc, metadata, yPosition);
  
  // Geographic Statistics Table
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(reverseArabicText('التوزيع الجغرافي للمرضى'), pageWidth - 15, yPosition, { align: 'right' });
  
  const geoTableData = statistics.map(stat => {
    const percentage = ((parseInt(stat.count) / totalPatients) * 100).toFixed(1);
    return [reverseArabicText(stat.governorate), stat.count, `${percentage}%`];
  });
  
  doc.autoTable({
    startY: yPosition + 5,
    head: [[reverseArabicText('المحافظة'), reverseArabicText('العدد'), reverseArabicText('النسبة المئوية')]],
    body: geoTableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 11,
      halign: 'center',
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 12,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'right', cellWidth: 80 },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'center', cellWidth: 40 },
    },
    margin: { right: 15, left: 15 },
  });
  
  // Add footer
  addFooter(doc, 1, 1);
  
  // Save the PDF
  const fileName = `geographic_statistics_${event.name}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Export Status Statistics PDF
export const exportStatusPDF = (event, statistics) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 50;
  
  // Add header
  addHeader(doc, 'إحصائيات حالة المواعيد', event.name);
  
  // Calculate totals
  const totalAppointments = Object.values(statistics).reduce((sum, count) => sum + parseInt(count), 0);
  
  // Add metadata
  const metadata = {
    'اسم الحدث': event.name,
    'تاريخ التقرير': new Date().toLocaleDateString('ar-SA'),
    'إجمالي المواعيد': totalAppointments.toString(),
  };
  yPosition = addMetadata(doc, metadata, yPosition);
  
  // Status Statistics Table
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(reverseArabicText('توزيع المواعيد حسب الحالة'), pageWidth - 15, yPosition, { align: 'right' });
  
  const statusMapping = {
    completed: 'مكتمل',
    cancelled: 'ملغي',
    no_show: 'غائب',
    pending: 'معلق'
  };
  
  const statusTableData = Object.entries(statistics).map(([status, count]) => {
    const percentage = ((parseInt(count) / totalAppointments) * 100).toFixed(1);
    return [reverseArabicText(statusMapping[status] || status), count, `${percentage}%`];
  });
  
  doc.autoTable({
    startY: yPosition + 5,
    head: [[reverseArabicText('الحالة'), reverseArabicText('العدد'), reverseArabicText('النسبة المئوية')]],
    body: statusTableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 11,
      halign: 'center',
      cellPadding: 6,
    },
    headStyles: {
      fillColor: [239, 68, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 12,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'right', cellWidth: 70 },
      1: { halign: 'center', cellWidth: 50 },
      2: { halign: 'center', cellWidth: 50 },
    },
    margin: { right: 15, left: 15 },
  });
  
  // Add footer
  addFooter(doc, 1, 1);
  
  // Save the PDF
  const fileName = `status_statistics_${event.name}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};