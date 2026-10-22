// Archived event: patients by gender and age group.
import React, { useState, useEffect, useContext } from "react";
import { escapeHtml, csvSafe } from "../../../../utils/safeHtml";
import { useParams } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import { Download, Printer } from "lucide-react";
import { PageHeader, StatStrip, LoadingState, Panel, useToast } from "../../../../Components/ui";
import {
  ActionsMenu, BackLink, CHART, ErrorState, HBarChart, POPUP_BLOCKED, ShareBar, printHtml,
} from "../../../../Components/ui/StatsKit";

const apiUrl = import.meta.env.VITE_API_URL;

// Same convention as the queue screens: women in rose, men in ink
const GENDER_COLORS = {
  'ذكر': CHART.inkSoft,
  'أنثى': CHART.rose,
};

const genderName = (sex) => (sex === '0' || sex === 0 || sex === 'ذكر' ? 'ذكر' : 'أنثى');

const DemographicStats = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  const toast = useToast();
  
  const [event, setEvent] = useState(null);
  const [genderStats, setGenderStats] = useState([]);
  const [ageStats, setAgeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/demographic-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setEvent(data.event);
        setGenderStats(data.gender_statistics);
        setAgeStats(data.age_statistics);
      } else {
        setError(data.message || "فشل في تحميل البيانات");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printHtml(generatePrintDocument())) toast(POPUP_BLOCKED, "error");
  };

  const generatePrintDocument = () => {
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const totalPatients = genderStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);

    const genderChartData = genderStats.map(stat => ({
      name: stat.sex === '0' || stat.sex === 'ذكر' ? 'ذكر' : 'أنثى',
      value: parseInt(stat.count),
      percentage: ((parseInt(stat.count) / totalPatients) * 100).toFixed(1)
    }));

    const ageChartData = ageStats.map(stat => ({
      name: stat.age_group,
      value: parseInt(stat.count)
    }));
    // Age group with the most patients (the API order is by age, not by count)
    const topAge = ageChartData.reduce((best, item) => (!best || item.value > best.value ? item : best), null);

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إحصائيات ديموغرافية - ${escapeHtml(event?.name)}</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }

          .document {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            background: white;
          }

          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 3px solid #7c3aed;
            margin-bottom: 30px;
          }

          .logo {
            width: 120px;
            height: auto;
            margin-bottom: 15px;
          }

          .header h1 {
            font-size: 28px;
            color: #7c3aed;
            margin-bottom: 8px;
            font-weight: bold;
          }

          .header .event-name {
            font-size: 18px;
            color: #666;
            margin-bottom: 5px;
          }

          .header .date {
            font-size: 14px;
            color: #999;
          }

          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }

          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #7c3aed;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }

          .summary-card {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }

          .summary-card .label {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
          }

          .summary-card .value {
            font-size: 32px;
            font-weight: bold;
            color: #7c3aed;
            margin-bottom: 5px;
          }

          .summary-card .percentage {
            font-size: 14px;
            color: #999;
          }

          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }

          .data-table th {
            background-color: #7c3aed;
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
          }

          .data-table td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: center;
            font-size: 15px;
          }

          .data-table tr:nth-child(even) {
            background-color: #f9fafb;
          }

          .stats-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            margin-bottom: 10px;
            background-color: #f9fafb;
          }

          .stats-row .label {
            font-size: 15px;
            color: #333;
            font-weight: 600;
          }

          .stats-row .value {
            font-size: 18px;
            color: #7c3aed;
            font-weight: bold;
          }

          .analysis-box {
            border: 2px solid #7c3aed;
            border-radius: 8px;
            padding: 20px;
            background-color: #f5f3ff;
            margin-top: 20px;
          }

          .analysis-box h3 {
            color: #7c3aed;
            font-size: 18px;
            margin-bottom: 15px;
          }

          .analysis-box ul {
            list-style: none;
            padding-right: 0;
          }

          .analysis-box li {
            padding: 8px 0;
            padding-right: 20px;
            position: relative;
            font-size: 15px;
            line-height: 1.8;
          }

          .analysis-box li:before {
            content: "◆";
            position: absolute;
            right: 0;
            color: #7c3aed;
            font-weight: bold;
          }

          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #999;
            font-size: 12px;
          }

          .two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="document">
          <!-- Header with Logo -->
          <div class="header">
            <img src="/tagemi_logo.png" alt="Logo" class="logo" />
            <h1>تقرير الإحصائيات الديموغرافية</h1>
            <p class="event-name">${escapeHtml(event?.name || 'الحملة الطبية')}</p>
            <p class="date">تاريخ الإصدار: ${escapeHtml(currentDate)}</p>
          </div>

          <!-- Summary Section -->
          <div class="section">
            <h2 class="section-title">الملخص التنفيذي</h2>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="label">إجمالي المرضى</div>
                <div class="value">${totalPatients}</div>
              </div>
              ${genderChartData.map(stat => `
                <div class="summary-card">
                  <div class="label">${escapeHtml(stat.name)}</div>
                  <div class="value">${stat.value}</div>
                  <div class="percentage">${stat.percentage}%</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Gender Statistics -->
          <div class="section">
            <h2 class="section-title">إحصائيات توزيع المرضى حسب الجنس</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>الجنس</th>
                  <th>العدد</th>
                  <th>النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                ${genderChartData.map(stat => `
                  <tr>
                    <td><strong>${escapeHtml(stat.name)}</strong></td>
                    <td>${stat.value}</td>
                    <td>${stat.percentage}%</td>
                  </tr>
                `).join('')}
                <tr style="background-color: #f3f4f6; font-weight: bold;">
                  <td>الإجمالي</td>
                  <td>${totalPatients}</td>
                  <td>100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Age Statistics -->
          <div class="section">
            <h2 class="section-title">إحصائيات توزيع المرضى حسب الفئة العمرية</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>الفئة العمرية</th>
                  <th>عدد المرضى</th>
                  <th>النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                ${ageChartData.map(stat => {
                  const percentage = ((stat.value / totalPatients) * 100).toFixed(1);
                  return `
                    <tr>
                      <td><strong>${escapeHtml(stat.name)} سنة</strong></td>
                      <td>${stat.value}</td>
                      <td>${percentage}%</td>
                    </tr>
                  `;
                }).join('')}
                <tr style="background-color: #f3f4f6; font-weight: bold;">
                  <td>الإجمالي</td>
                  <td>${totalPatients}</td>
                  <td>100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Analysis Section -->
          <div class="section">
            <h2 class="section-title">التحليل والملاحظات</h2>
            <div class="analysis-box">
              <h3>الملاحظات الرئيسية:</h3>
              <ul>
                <li>إجمالي عدد المرضى المسجلين في الحملة: <strong>${totalPatients}</strong> مريض</li>
                <li>الفئة العمرية الأكثر حضوراً: <strong>${escapeHtml(topAge?.name)} سنة</strong> بعدد <strong>${escapeHtml(topAge?.value)}</strong> مريض</li>
                <li>التوزيع بين الجنسين: ${genderChartData.map(s => `${escapeHtml(s.name)} (${escapeHtml(s.percentage)}%)`).join(' و ')}</li>
                <li>عدد الفئات العمرية المشمولة: <strong>${ageStats.length}</strong> فئات عمرية</li>
              </ul>
            </div>

            <div style="margin-top: 30px;">
              <h3 style="color: #7c3aed; font-size: 18px; margin-bottom: 15px;">إحصائيات تفصيلية:</h3>
              <div class="stats-row">
                <span class="label">الفئة العمرية الأكثر حضوراً</span>
                <span class="value">${escapeHtml(topAge?.name || '-')} سنة</span>
              </div>
              <div class="stats-row">
                <span class="label">عدد الفئات العمرية المسجلة</span>
                <span class="value">${ageStats.length}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>هذا التقرير تم إنشاؤه تلقائياً بواسطة نظام إدارة الحملات الطبية</p>
            <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleExport = () => {
    const csvContent = [
      ["=== إحصائيات الجنس ==="],
      ["الجنس", "العدد"],
      ...genderStats.map(stat => [
        stat.sex === '0' || stat.sex === 'ذكر' ? 'ذكر' : 'أنثى',
        stat.count
      ]),
      [""],
      ["=== إحصائيات الفئات العمرية ==="],
      ["الفئة العمرية", "العدد"],
      ...ageStats.map(stat => [stat.age_group, stat.count])
    ].map(row => row.map(cell => `"${csvSafe(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `demographic_stats_${eventId}.csv`;
    link.click();
  };

  const backTo = `/admin/event-tracking/${eventId}`;

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackLink to={backTo} />
        <PageHeader title="إحصائيات ديموغرافية" />
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  const totalPatients = genderStats.reduce((sum, stat) => sum + (parseInt(stat.count) || 0), 0);

  // Several raw values can mean the same gender ('0' and 'ذكر'): add them up
  const genderParts = [];
  genderStats.forEach((stat) => {
    const name = genderName(stat.sex);
    const found = genderParts.find((g) => g.label === name);
    if (found) found.value += parseInt(stat.count) || 0;
    else genderParts.push({ label: name, value: parseInt(stat.count) || 0, color: GENDER_COLORS[name] });
  });

  const ageChartData = ageStats.map((stat) => ({
    name: `${stat.age_group} سنة`,
    value: parseInt(stat.count) || 0,
  }));
  const topAge = ageChartData.reduce((best, item) => (!best || item.value > best.value ? item : best), null);

  return (
    <div className="max-w-6xl mx-auto">
      <BackLink to={backTo} />
      <PageHeader
        title="إحصائيات ديموغرافية"
        subtitle={event?.name}
        actions={
          <ActionsMenu
            actions={[
              { icon: Printer, label: "اطبع التقرير", onClick: handlePrint },
              { icon: Download, label: "نزّل ملف CSV", onClick: handleExport },
            ]}
          />
        }
      />

      <StatStrip
        className="mb-4"
        items={[
          { label: "المرضى", value: totalPatients },
          ...genderParts.map((g) => ({ label: g.label, value: g.value })),
          topAge && { label: "الفئة الأكثر حضوراً", value: topAge.name.replace(" سنة", "") },
        ]}
      />

      {totalPatients === 0 && ageChartData.length === 0 ? (
        <Panel>
          <p className="py-6 text-center text-sm text-muted">لا توجد بيانات مرضى مؤرشفة لهذا الحدث.</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="حسب الجنس">
            <ShareBar total={totalPatients} parts={genderParts} />
          </Panel>

          <Panel title="حسب الفئة العمرية">
            <HBarChart data={ageChartData} bars={[{ key: "value", name: "المرضى", color: CHART.inkSoft }]} labelWidth={84} />
            <p className="mt-3 text-sm text-muted">
              {ageStats.length} فئات عمرية
              {topAge && <>، أكثرها حضوراً {topAge.name} بعدد {topAge.value} مريض</>}.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
};

export default DemographicStats;
