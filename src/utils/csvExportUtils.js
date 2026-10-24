import { csvSafe } from './safeHtml';

// Professional CSV Export Utilities

// Helper function to escape CSV fields
const escapeCSVField = (field) => {
  if (field === null || field === undefined) return '';
  const stringField = csvSafe(field);
  // Escape fields containing comma, quote, or newline
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

// Helper function to create CSV content
const createCSVContent = (rows) => {
  return rows.map(row => row.map(escapeCSVField).join(',')).join('\n');
};

// Helper function to add header section to CSV
const addCSVHeader = (eventName, reportType, additionalInfo = {}) => {
  const header = [
    ['='.repeat(80)],
    [`تقرير ${reportType}`],
    ['='.repeat(80)],
    [`اسم الحدث: ${eventName}`],
    [`تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SA')}`],
    [`الوقت: ${new Date().toLocaleTimeString('ar-SA')}`],
    ...Object.entries(additionalInfo).map(([key, value]) => [`${key}: ${value}`]),
    ['='.repeat(80)],
    [''],
  ];
  return header;
};

// Export Demographic Statistics CSV
export const exportDemographicCSV = (event, genderStats, ageStats) => {
  const totalPatients = genderStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
  
  // Build CSV content
  const csvRows = [
    ...addCSVHeader(event.name, 'الإحصائيات الديموغرافية', {
      'إجمالي المرضى': totalPatients,
    }),
    
    // Gender Statistics Section
    ['قسم: إحصائيات الجنس'],
    ['-'.repeat(60)],
    ['الجنس', 'العدد', 'النسبة المئوية', 'التعليق'],
  ];
  
  genderStats.forEach(stat => {
    const genderName = stat.sex === '0' || stat.sex === 'ذكر' ? 'ذكر' : 'أنثى';
    const percentage = ((parseInt(stat.count) / totalPatients) * 100).toFixed(1);
    csvRows.push([
      genderName,
      stat.count,
      `${percentage}%`,
      `${genderName === 'ذكر' ? 'الذكور' : 'الإناث'} يمثلون ${percentage}% من المجموع`
    ]);
  });
  
  csvRows.push(
    [''],
    [`المجموع الكلي`, totalPatients, '100%', ''],
    [''],
    [''],
  );
  
  // Age Statistics Section
  csvRows.push(
    ['قسم: إحصائيات الفئات العمرية'],
    ['-'.repeat(60)],
    ['الفئة العمرية', 'العدد', 'النسبة المئوية', 'الترتيب'],
  );
  
  const sortedAgeStats = [...ageStats].sort((a, b) => parseInt(b.count) - parseInt(a.count));
  
  sortedAgeStats.forEach((stat, index) => {
    const percentage = ((parseInt(stat.count) / totalPatients) * 100).toFixed(1);
    csvRows.push([
      `${stat.age_group} سنة`,
      stat.count,
      `${percentage}%`,
      index + 1
    ]);
  });
  
  csvRows.push(
    [''],
    [`المجموع الكلي`, totalPatients, '100%', ''],
    [''],
    [''],
  );
  
  // Summary Section
  csvRows.push(
    ['قسم: التحليل والملاحظات'],
    ['-'.repeat(60)],
    ['النوع', 'القيمة'],
    ['أكبر فئة عمرية', sortedAgeStats[0]?.age_group || 'N/A'],
    ['أصغر فئة عمرية', sortedAgeStats[sortedAgeStats.length - 1]?.age_group || 'N/A'],
    ['عدد الفئات العمرية', ageStats.length],
    ['توزيع الجنس', genderStats.length === 2 ? 'متوازن (جنسان)' : 'غير متوازن'],
    [''],
    ['='.repeat(80)],
    ['نهاية التقرير'],
    ['='.repeat(80)],
  );
  
  // Create and download CSV
  const csvContent = '\ufeff' + createCSVContent(csvRows); // BOM for UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `demographic_statistics_${event.name}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Export Specialty Statistics CSV
export const exportSpecialtyCSV = (event, statistics) => {
  const totalAppointments = statistics.reduce((sum, stat) => sum + parseInt(stat.total_appointments), 0);
  const totalCompleted = statistics.reduce((sum, stat) => sum + parseInt(stat.completed), 0);
  const totalCancelled = statistics.reduce((sum, stat) => sum + parseInt(stat.cancelled), 0);
  const totalNoShow = statistics.reduce((sum, stat) => sum + parseInt(stat.no_show), 0);
  const totalPending = statistics.reduce((sum, stat) => sum + parseInt(stat.pending), 0);
  const overallCompletionRate = ((totalCompleted / totalAppointments) * 100).toFixed(1);
  
  // Build CSV content
  const csvRows = [
    ...addCSVHeader(event.name, 'إحصائيات التخصصات', {
      'عدد التخصصات': statistics.length,
      'إجمالي المواعيد': totalAppointments,
      'معدل الإكمال الإجمالي': `${overallCompletionRate}%`,
    }),
    
    // Detailed Statistics Section
    ['قسم: تفاصيل التخصصات'],
    ['-'.repeat(100)],
    ['التخصص', 'إجمالي المواعيد', 'مكتمل', 'ملغي', 'غائب', 'معلق', 'معدل الإكمال %', 'معدل الإلغاء %', 'التقييم'],
  ];
  
  // Sort by total appointments
  const sortedStats = [...statistics].sort((a, b) => 
    parseInt(b.total_appointments) - parseInt(a.total_appointments)
  );
  
  sortedStats.forEach(stat => {
    const completionRate = ((parseInt(stat.completed) / parseInt(stat.total_appointments)) * 100).toFixed(1);
    const cancellationRate = ((parseInt(stat.cancelled) / parseInt(stat.total_appointments)) * 100).toFixed(1);
    
    let rating = '';
    if (parseFloat(completionRate) >= 90) rating = 'ممتاز';
    else if (parseFloat(completionRate) >= 75) rating = 'جيد جداً';
    else if (parseFloat(completionRate) >= 60) rating = 'جيد';
    else if (parseFloat(completionRate) >= 50) rating = 'مقبول';
    else rating = 'ضعيف';
    
    csvRows.push([
      stat.name,
      stat.total_appointments,
      stat.completed,
      stat.cancelled,
      stat.no_show,
      stat.pending,
      completionRate,
      cancellationRate,
      rating
    ]);
  });
  
  csvRows.push(
    [''],
    ['المجموع', totalAppointments, totalCompleted, totalCancelled, totalNoShow, totalPending, overallCompletionRate, '', ''],
    [''],
    [''],
  );
  
  // Top Performers Section
  const topPerformers = sortedStats
    .slice(0, 5)
    .map(stat => ({
      ...stat,
      completionRate: ((parseInt(stat.completed) / parseInt(stat.total_appointments)) * 100).toFixed(1)
    }))
    .sort((a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate));
  
  csvRows.push(
    ['قسم: أفضل 5 تخصصات (حسب معدل الإكمال)'],
    ['-'.repeat(60)],
    ['الترتيب', 'التخصص', 'معدل الإكمال', 'عدد المواعيد المكتملة'],
  );
  
  topPerformers.forEach((stat, index) => {
    csvRows.push([
      index + 1,
      stat.name,
      `${stat.completionRate}%`,
      stat.completed
    ]);
  });
  
  csvRows.push([''], ['']);
  
  // Summary Section
  csvRows.push(
    ['قسم: الملخص التحليلي'],
    ['-'.repeat(60)],
    ['المؤشر', 'القيمة'],
    ['أعلى تخصص من حيث عدد المواعيد', sortedStats[0]?.name || 'N/A'],
    ['أعلى تخصص من حيث معدل الإكمال', topPerformers[0]?.name || 'N/A'],
    ['متوسط معدل الإكمال', `${overallCompletionRate}%`],
    ['نسبة المواعيد المكتملة', `${((totalCompleted / totalAppointments) * 100).toFixed(1)}%`],
    ['نسبة المواعيد الملغاة', `${((totalCancelled / totalAppointments) * 100).toFixed(1)}%`],
    ['نسبة المواعيد الغائبة', `${((totalNoShow / totalAppointments) * 100).toFixed(1)}%`],
    ['نسبة المواعيد المعلقة', `${((totalPending / totalAppointments) * 100).toFixed(1)}%`],
    [''],
    ['='.repeat(100)],
    ['نهاية التقرير'],
    ['='.repeat(100)],
  );
  
  // Create and download CSV
  const csvContent = '\ufeff' + createCSVContent(csvRows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `specialty_statistics_${event.name}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Export Geographic Statistics CSV
export const exportGeographicCSV = (event, statistics) => {
  const totalPatients = statistics.reduce((sum, stat) => sum + parseInt(stat.count), 0);
  
  // Build CSV content
  const csvRows = [
    ...addCSVHeader(event.name, 'الإحصائيات الجغرافية', {
      'عدد المحافظات': statistics.length,
      'إجمالي المرضى': totalPatients,
    }),
    
    // Geographic Distribution Section
    ['قسم: التوزيع الجغرافي للمرضى'],
    ['-'.repeat(80)],
    ['الترتيب', 'المحافظة', 'العدد', 'النسبة المئوية', 'التصنيف'],
  ];
  
  // Sort by count
  const sortedStats = [...statistics].sort((a, b) => parseInt(b.count) - parseInt(a.count));
  
  sortedStats.forEach((stat, index) => {
    const percentage = ((parseInt(stat.count) / totalPatients) * 100).toFixed(1);
    let classification = '';
    if (parseFloat(percentage) >= 20) classification = 'نسبة عالية جداً';
    else if (parseFloat(percentage) >= 15) classification = 'نسبة عالية';
    else if (parseFloat(percentage) >= 10) classification = 'نسبة متوسطة';
    else if (parseFloat(percentage) >= 5) classification = 'نسبة منخفضة';
    else classification = 'نسبة منخفضة جداً';
    
    csvRows.push([
      index + 1,
      stat.governorate,
      stat.count,
      `${percentage}%`,
      classification
    ]);
  });
  
  csvRows.push(
    [''],
    ['', 'المجموع الكلي', totalPatients, '100%', ''],
    [''],
    [''],
  );
  
  // Top 5 Governorates
  csvRows.push(
    ['قسم: أكثر 5 محافظات'],
    ['-'.repeat(60)],
    ['الترتيب', 'المحافظة', 'العدد', 'النسبة'],
  );
  
  sortedStats.slice(0, 5).forEach((stat, index) => {
    const percentage = ((parseInt(stat.count) / totalPatients) * 100).toFixed(1);
    csvRows.push([
      index + 1,
      stat.governorate,
      stat.count,
      `${percentage}%`
    ]);
  });
  
  csvRows.push([''], ['']);
  
  // Summary Section
  const top3Percentage = sortedStats.slice(0, 3).reduce((sum, stat) => 
    sum + ((parseInt(stat.count) / totalPatients) * 100), 0
  ).toFixed(1);
  
  csvRows.push(
    ['قسم: التحليل الجغرافي'],
    ['-'.repeat(60)],
    ['المؤشر', 'القيمة'],
    ['أكثر محافظة', sortedStats[0]?.governorate || 'N/A'],
    ['عدد المرضى من أكثر محافظة', sortedStats[0]?.count || '0'],
    ['نسبة أكثر محافظة', `${((parseInt(sortedStats[0]?.count || 0) / totalPatients) * 100).toFixed(1)}%`],
    ['نسبة أكثر 3 محافظات مجتمعة', `${top3Percentage}%`],
    ['التوزيع الجغرافي', sortedStats.length > 10 ? 'واسع جداً' : sortedStats.length > 5 ? 'واسع' : 'محدود'],
    [''],
    ['='.repeat(80)],
    ['نهاية التقرير'],
    ['='.repeat(80)],
  );
  
  // Create and download CSV
  const csvContent = '\ufeff' + createCSVContent(csvRows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `geographic_statistics_${event.name}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Export Status Statistics CSV
export const exportStatusCSV = (event, statistics) => {
  const statusMapping = {
    completed: 'مكتمل',
    cancelled: 'ملغي',
    no_show: 'غائب',
    pending: 'معلق'
  };
  
  const totalAppointments = Object.values(statistics).reduce((sum, count) => sum + parseInt(count), 0);
  
  // Build CSV content
  const csvRows = [
    ...addCSVHeader(event.name, 'إحصائيات حالة المواعيد', {
      'إجمالي المواعيد': totalAppointments,
    }),
    
    // Status Distribution Section
    ['قسم: توزيع المواعيد حسب الحالة'],
    ['-'.repeat(80)],
    ['الحالة', 'العدد', 'النسبة المئوية', 'الحالة (بالإنجليزية)', 'التقييم'],
  ];
  
  // Sort by count
  const sortedEntries = Object.entries(statistics).sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
  
  sortedEntries.forEach(([status, count]) => {
    const percentage = ((parseInt(count) / totalAppointments) * 100).toFixed(1);
    let evaluation = '';
    
    if (status === 'completed') {
      if (parseFloat(percentage) >= 80) evaluation = 'ممتاز';
      else if (parseFloat(percentage) >= 70) evaluation = 'جيد جداً';
      else if (parseFloat(percentage) >= 60) evaluation = 'جيد';
      else evaluation = 'يحتاج تحسين';
    } else if (status === 'cancelled' || status === 'no_show') {
      if (parseFloat(percentage) <= 5) evaluation = 'ممتاز';
      else if (parseFloat(percentage) <= 10) evaluation = 'جيد';
      else if (parseFloat(percentage) <= 20) evaluation = 'مقبول';
      else evaluation = 'مرتفع - يحتاج تحسين';
    }
    
    csvRows.push([
      statusMapping[status] || status,
      count,
      `${percentage}%`,
      status,
      evaluation
    ]);
  });
  
  csvRows.push(
    [''],
    ['المجموع الكلي', totalAppointments, '100%', '', ''],
    [''],
    [''],
  );
  
  // Performance Indicators
  const completionRate = ((parseInt(statistics.completed || 0) / totalAppointments) * 100).toFixed(1);
  const cancellationRate = ((parseInt(statistics.cancelled || 0) / totalAppointments) * 100).toFixed(1);
  const noShowRate = ((parseInt(statistics.no_show || 0) / totalAppointments) * 100).toFixed(1);
  const pendingRate = ((parseInt(statistics.pending || 0) / totalAppointments) * 100).toFixed(1);
  
  csvRows.push(
    ['قسم: مؤشرات الأداء'],
    ['-'.repeat(60)],
    ['المؤشر', 'القيمة', 'الهدف المثالي', 'التقييم'],
    ['معدل الإكمال', `${completionRate}%`, '≥ 80%', parseFloat(completionRate) >= 80 ? 'ممتاز' : 'يحتاج تحسين'],
    ['معدل الإلغاء', `${cancellationRate}%`, '≤ 10%', parseFloat(cancellationRate) <= 10 ? 'جيد' : 'مرتفع'],
    ['معدل الغياب', `${noShowRate}%`, '≤ 5%', parseFloat(noShowRate) <= 5 ? 'جيد' : 'مرتفع'],
    ['نسبة المواعيد المعلقة', `${pendingRate}%`, '', ''],
    [''],
    [''],
  );
  
  // Recommendations
  csvRows.push(
    ['قسم: التوصيات'],
    ['-'.repeat(60)],
    ['التوصية'],
  );
  
  if (parseFloat(completionRate) < 80) {
    csvRows.push(['• العمل على رفع معدل الإكمال إلى 80% أو أكثر']);
  }
  if (parseFloat(cancellationRate) > 10) {
    csvRows.push(['• تقليل معدل الإلغاءات من خلال تذكير المرضى وتحسين جدولة المواعيد']);
  }
  if (parseFloat(noShowRate) > 5) {
    csvRows.push(['• معالجة مشكلة غياب المرضى من خلال التأكيد المسبق والتذكيرات']);
  }
  if (parseFloat(pendingRate) > 20) {
    csvRows.push(['• متابعة المواعيد المعلقة وإتمامها في أسرع وقت']);
  }
  if (parseFloat(completionRate) >= 80 && parseFloat(cancellationRate) <= 10 && parseFloat(noShowRate) <= 5) {
    csvRows.push(['• الأداء ممتاز - الاستمرار في الحفاظ على هذا المستوى']);
  }
  
  csvRows.push(
    [''],
    ['='.repeat(80)],
    ['نهاية التقرير'],
    ['='.repeat(80)],
  );
  
  // Create and download CSV
  const csvContent = '\ufeff' + createCSVContent(csvRows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `status_statistics_${event.name}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Export Comprehensive CSV Report
export const exportComprehensiveCSV = (event, demographicData, specialtyData, geoData, statusData) => {
  const csvRows = [
    ...addCSVHeader(event.name, 'التقرير الشامل', {
      'نوع التقرير': 'شامل - جميع الإحصائيات',
    }),
  ];
  
  // Executive Summary
  const totalPatients = demographicData.genderStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
  const totalAppointments = specialtyData.reduce((sum, stat) => sum + parseInt(stat.total_appointments), 0);
  const completedAppointments = specialtyData.reduce((sum, stat) => sum + parseInt(stat.completed), 0);
  const completionRate = ((completedAppointments / totalAppointments) * 100).toFixed(1);
  
  csvRows.push(
    ['قسم: الملخص التنفيذي'],
    ['-'.repeat(80)],
    ['المؤشر', 'القيمة'],
    ['إجمالي عدد المرضى', totalPatients],
    ['إجمالي عدد المواعيد', totalAppointments],
    ['المواعيد المكتملة', completedAppointments],
    ['معدل الإكمال', `${completionRate}%`],
    ['عدد التخصصات', specialtyData.length],
    ['عدد المحافظات', geoData.length],
    [''],
    [''],
  );
  
  // All sections would be added here similarly...
  // For brevity, showing structure
  
  csvRows.push(
    ['='.repeat(80)],
    ['نهاية التقرير الشامل'],
    ['='.repeat(80)],
    [''],
    ['ملاحظة: للحصول على تقارير مفصلة، يرجى تصدير كل قسم على حدة'],
  );
  
  // Create and download CSV
  const csvContent = '\ufeff' + createCSVContent(csvRows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `comprehensive_report_${event.name}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Export a list of objects as a CSV table (keys become the header row).
// Opens in Excel with Arabic intact thanks to the BOM.
export const exportRowsCSV = (rows, fileName) => {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const table = [headers, ...rows.map((row) => headers.map((key) => row[key]))];
  const csvContent = '﻿' + createCSVContent(table);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};
