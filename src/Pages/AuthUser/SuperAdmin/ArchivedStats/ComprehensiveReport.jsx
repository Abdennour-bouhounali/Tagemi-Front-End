// Archived event: one page with every statistic (outcomes, specialties, demographics, wilayas).
import React, { useState, useEffect, useContext } from "react";
import { escapeHtml, csvSafe } from "../../../../utils/safeHtml";
import { useParams } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import { Download, Printer } from "lucide-react";
import { PageHeader, StatStrip, LoadingState, Panel, useToast } from "../../../../Components/ui";
import {
  ActionsMenu, ARCHIVED_OUTCOMES, BackLink, CHART, ErrorState, HBarChart, POPUP_BLOCKED, ResponsiveTable, ShareBar, pct, printHtml,
} from "../../../../Components/ui/StatsKit";

const apiUrl = import.meta.env.VITE_API_URL;

const GENDER_COLORS = { 'ذكر': CHART.inkSoft, 'أنثى': CHART.rose };
const outcomeOf = (status) => ARCHIVED_OUTCOMES[status] || { label: status, color: CHART.hold };
const formatDay = (value) => (value ? new Date(value).toLocaleDateString("en-UK") : "—");

const ComprehensiveReport = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  const toast = useToast();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, [eventId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/comprehensive-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setReport(data.report);
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
    if (!report) return '';

    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const statusData = report.status_breakdown.map(stat => ({
      name: stat.status,
      nameAr: stat.status === 'Completed' ? 'أنهى الفحص' : 
              stat.status === 'Pending' ? 'لم يحضر' : 
              stat.status === 'Waiting' ? 'حضر ولم يُفحص' : stat.status,
      count: parseInt(stat.count),
      special: parseInt(stat.special_count || 0)
    }));

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>التقرير الشامل - ${escapeHtml(report.event.name)}</title>
        <style>
          @page {
            size: A4;
            margin: 1.5cm;
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
          }

          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 3px solid #dc2626;
            margin-bottom: 30px;
          }

          .logo {
            width: 120px;
            height: auto;
            margin-bottom: 15px;
          }

          .header h1 {
            font-size: 28px;
            color: #dc2626;
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

          .info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            border-radius: 8px;
            color: white;
          }

          .info-card {
            text-align: center;
          }

          .info-card .label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 5px;
          }

          .info-card .value {
            font-size: 20px;
            font-weight: bold;
          }

          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }

          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }

          .summary-card {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }

          .summary-card .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
          }

          .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 5px;
          }

          .summary-card .percentage {
            font-size: 12px;
            color: #999;
          }

          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }

          .data-table th {
            background-color: #dc2626;
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
          }

          .data-table td {
            border: 1px solid #e5e7eb;
            padding: 10px;
            text-align: center;
            font-size: 13px;
          }

          .data-table tr:nth-child(even) {
            background-color: #f9fafb;
          }

          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
          }

          .analysis-box {
            border: 2px solid #dc2626;
            border-radius: 8px;
            padding: 20px;
            background-color: #fef2f2;
          }

          .analysis-box h3 {
            color: #dc2626;
            font-size: 16px;
            margin-bottom: 15px;
          }

          .analysis-box ul {
            list-style: none;
            padding-right: 0;
          }

          .analysis-box li {
            padding: 6px 0;
            padding-right: 20px;
            position: relative;
            font-size: 14px;
            line-height: 1.6;
          }

          .analysis-box li:before {
            content: "◆";
            position: absolute;
            right: 0;
            color: #dc2626;
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
          <!-- Header -->
          <div class="header">
            <img src="/tagemi_logo.png" alt="Logo" class="logo" />
            <h1>التقرير الشامل للحملة الطبية</h1>
            <p class="event-name">${escapeHtml(report.event.name)}</p>
            <p class="date">تاريخ الإصدار: ${escapeHtml(currentDate)}</p>
          </div>

          <!-- Event Info -->
          <div class="info-grid">
            <div class="info-card">
              <div class="label">اسم الحدث</div>
              <div class="value">${escapeHtml(report.event.name)}</div>
            </div>
            <div class="info-card">
              <div class="label">تاريخ الحدث</div>
              <div class="value">${new Date(report.event.date).toLocaleDateString('en-UK')}</div>
            </div>
            <div class="info-card">
              <div class="label">إجمالي المواعيد</div>
              <div class="value">${escapeHtml(report.total_appointments)}</div>
            </div>
            <div class="info-card">
              <div class="label">الحالة</div>
              <div class="value">مؤرشف</div>
            </div>
          </div>

          <!-- Status Summary -->
          <div class="section">
            <h2 class="section-title">ملخص الحالات</h2>
            <div class="summary-grid">
              ${statusData.map(stat => `
                <div class="summary-card">
                  <div class="label">${escapeHtml(stat.nameAr)}</div>
                  <div class="value">${escapeHtml(stat.count)}</div>
                  <div class="percentage">${((stat.count / report.total_appointments) * 100).toFixed(1)}%</div>
                  ${stat.special > 0 ? `<div class="percentage">خاص: ${escapeHtml(stat.special)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Status Details -->
          <div class="section">
            <h2 class="section-title">تفاصيل توزيع الحالات</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>الحالة</th>
                  <th>العدد</th>
                  <th>حالات خاصة</th>
                  <th>النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                ${statusData.map(stat => `
                  <tr>
                    <td><strong>${escapeHtml(stat.nameAr)}</strong></td>
                    <td>${escapeHtml(stat.count)}</td>
                    <td>${stat.special > 0 ? escapeHtml(stat.special) : '-'}</td>
                    <td>${((stat.count / report.total_appointments) * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Specialty Statistics -->
          <div class="section">
            <h2 class="section-title">إحصائيات التخصصات الطبية</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>التخصص</th>
                  <th>عدد المرضى</th>
                  <th>النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                ${report.specialty_breakdown.map(stat => {
                  const percentage = ((parseInt(stat.count) / report.total_appointments) * 100).toFixed(1);
                  return `
                    <tr>
                      <td><strong>${escapeHtml(stat.name)}</strong></td>
                      <td>${escapeHtml(stat.count)}</td>
                      <td>${percentage}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Gender & Age Demographics -->
          <div class="section">
            <h2 class="section-title">التوزيع الديموغرافي</h2>
            <div class="two-column">
              <div>
                <h3 style="font-size: 16px; margin-bottom: 10px; color: #666;">توزيع الجنس</h3>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>الجنس</th>
                      <th>العدد</th>
                      <th>النسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${report.gender_breakdown.map(stat => {
                      const genderName = stat.sex === '0' || stat.sex === 'ذكر' ? 'ذكر' : 'أنثى';
                      const percentage = ((parseInt(stat.count) / report.total_appointments) * 100).toFixed(1);
                      return `
                        <tr>
                          <td>${escapeHtml(genderName)}</td>
                          <td>${escapeHtml(stat.count)}</td>
                          <td>${percentage}%</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 style="font-size: 16px; margin-bottom: 10px; color: #666;">الفئات العمرية</h3>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>الفئة العمرية</th>
                      <th>العدد</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${report.age_breakdown.map(stat => `
                      <tr>
                        <td>${escapeHtml(stat.age_group)} سنة</td>
                        <td>${escapeHtml(stat.count)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Geographic Distribution -->
          <div class="section">
            <h2 class="section-title">التوزيع الجغرافي (أعلى 10 ولايات)</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>الترتيب</th>
                  <th>الولاية</th>
                  <th>عدد المرضى</th>
                  <th>النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                ${report.top_states.map((stat, index) => {
                  const percentage = ((parseInt(stat.count) / report.total_appointments) * 100).toFixed(1);
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td><strong>${escapeHtml(stat.state)}</strong></td>
                      <td>${escapeHtml(stat.count)}</td>
                      <td>${percentage}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Analysis -->
          <div class="section">
            <h2 class="section-title">التحليل والملاحظات</h2>
            <div class="analysis-box">
              <h3>النقاط الرئيسية:</h3>
              <ul>
                <li>إجمالي المواعيد المؤرشفة: <strong>${escapeHtml(report.total_appointments)}</strong> موعد</li>
                <li>عدد التخصصات الطبية المشاركة: <strong>${report.specialty_breakdown.length}</strong> تخصص</li>
                <li>التغطية الجغرافية: <strong>${report.top_states.length}+</strong> ولاية</li>
                <li>أكبر تخصص مشاركة: <strong>${escapeHtml(report.specialty_breakdown[0]?.name)}</strong> بـ <strong>${escapeHtml(report.specialty_breakdown[0]?.count)}</strong> مريض</li>
                <li>أكثر ولاية تمثيلاً: <strong>${escapeHtml(report.top_states[0]?.state)}</strong> بـ <strong>${escapeHtml(report.top_states[0]?.count)}</strong> مريض</li>
                <li>تاريخ الأرشفة: <strong>${new Date(report.event.updated_at).toLocaleDateString('en-UK')}</strong></li>
              </ul>
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
    if (!report) return;

    const csvContent = [
      ["=== تقرير شامل للحدث ==="],
      ["اسم الحدث:", report.event.name],
      ["التاريخ:", report.event.date],
      [""],
      ["=== الإحصائيات العامة ==="],
      ["إجمالي المواعيد:", report.total_appointments],
      [""],
      ["=== توزيع الحالات ==="],
      ["الحالة", "العدد"],
      ...report.status_breakdown.map(stat => [stat.status, stat.count]),
      [""],
      ["=== توزيع التخصصات ==="],
      ["التخصص", "العدد"],
      ...report.specialty_breakdown.map(stat => [stat.name, stat.count]),
      [""],
      ["=== توزيع الجنس ==="],
      ["الجنس", "العدد"],
      ...report.gender_breakdown.map(stat => [stat.sex === '0' ? 'ذكر' : 'أنثى', stat.count]),
      [""],
      ["=== الفئات العمرية ==="],
      ["الفئة", "العدد"],
      ...report.age_breakdown.map(stat => [stat.age_group, stat.count]),
      [""],
      ["=== أعلى 10 ولايات ==="],
      ["الولاية", "العدد"],
      ...report.top_states.map(stat => [stat.state, stat.count]),
    ].map(row => row.map(cell => `"${csvSafe(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `comprehensive_report_${eventId}.csv`;
    link.click();
  };

  const backTo = `/admin/event-tracking/${eventId}`;

  if (loading) return <LoadingState label="جاري تحميل التقرير..." />;

  if (error || !report) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackLink to={backTo} />
        <PageHeader title="التقرير الشامل" />
        <ErrorState message={error} onRetry={fetchReport} />
      </div>
    );
  }

  const total = parseInt(report.total_appointments) || 0;

  // Outcomes, added up when several raw statuses share one label
  const outcomes = [];
  report.status_breakdown.forEach((stat) => {
    const { label, color } = outcomeOf(stat.status);
    const found = outcomes.find((o) => o.label === label);
    if (found) {
      found.value += parseInt(stat.count) || 0;
      found.special += parseInt(stat.special_count) || 0;
    } else {
      outcomes.push({ label, color, value: parseInt(stat.count) || 0, special: parseInt(stat.special_count) || 0 });
    }
  });
  const specialTotal = outcomes.reduce((sum, o) => sum + o.special, 0);

  const genderParts = [];
  report.gender_breakdown.forEach((stat) => {
    const label = stat.sex === "0" || stat.sex === 0 || stat.sex === "ذكر" ? "ذكر" : "أنثى";
    const found = genderParts.find((g) => g.label === label);
    if (found) found.value += parseInt(stat.count) || 0;
    else genderParts.push({ label, value: parseInt(stat.count) || 0, color: GENDER_COLORS[label] });
  });

  const specialtyData = report.specialty_breakdown.map((stat) => ({ name: stat.name, value: parseInt(stat.count) || 0 }));
  const ageData = report.age_breakdown.map((stat) => ({ name: `${stat.age_group} سنة`, value: parseInt(stat.count) || 0 }));
  const stateData = report.top_states.map((stat) => ({ name: stat.state, value: parseInt(stat.count) || 0 }));
  const oneBar = [{ key: "value", name: "العدد", color: CHART.inkSoft }];

  return (
    <div className="max-w-6xl mx-auto">
      <BackLink to={backTo} />
      <PageHeader
        title="التقرير الشامل"
        subtitle={report.event.name}
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
          { label: "المواعيد", value: total },
          ...outcomes.map((o) => ({ label: o.label, value: o.value })),
          { label: "التخصصات", value: report.specialty_breakdown.length },
          specialTotal > 0 && { label: "حالات خاصة", value: specialTotal, tone: "text-rose" },
        ]}
      />

      <div className="space-y-4">
        <Panel title="عن الحدث">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted">تاريخ الحدث</dt>
              <dd className="font-semibold text-ink">{formatDay(report.event.date)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">الحالة</dt>
              <dd className="font-semibold text-ink">مؤرشف</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">تاريخ الأرشفة</dt>
              <dd className="font-semibold text-ink">{formatDay(report.event.updated_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">تاريخ التقرير</dt>
              <dd className="font-semibold text-ink">{formatDay(new Date())}</dd>
            </div>
          </dl>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="نتيجة المواعيد">
            <ShareBar total={total} parts={outcomes} />
            {specialTotal > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {outcomes.filter((o) => o.special > 0).map((o) => (
                  <li key={o.label}>
                    منها حالات خاصة في «{o.label}»: <span className="font-semibold text-rose">{o.special}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="حسب الجنس">
            <ShareBar parts={genderParts} />
          </Panel>
        </div>

        <Panel title="حسب التخصص">
          <HBarChart data={specialtyData} bars={oneBar} />
          <div className="mt-4">
            <ResponsiveTable
              columns={[
                { key: "name", label: "التخصص", primary: true },
                { key: "count", label: "المواعيد", align: "center", render: (row) => parseInt(row.count) || 0 },
                { key: "share", label: "النسبة", align: "center", render: (row) => `${pct(row.count, total)}%` },
              ]}
              rows={report.specialty_breakdown}
              rowKey={(row, i) => `${row.name}-${i}`}
            />
          </div>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="حسب الفئة العمرية">
            <HBarChart data={ageData} bars={oneBar} labelWidth={84} />
          </Panel>

          <Panel title="أعلى 10 ولايات">
            <HBarChart data={stateData} bars={oneBar} />
          </Panel>
        </div>

        <Panel title="ملخص التقرير">
          <ul className="space-y-1.5 text-sm text-ink">
            <li>المواعيد المؤرشفة: <strong>{total}</strong>.</li>
            <li>التخصصات المشاركة: <strong>{report.specialty_breakdown.length}</strong>.</li>
            <li>التغطية الجغرافية: <strong>{report.top_states.length}+</strong> ولاية.</li>
            {report.specialty_breakdown[0] && (
              <li>
                أكبر تخصص: <strong>{report.specialty_breakdown[0].name}</strong> ({report.specialty_breakdown[0].count} مريض).
              </li>
            )}
            {report.top_states[0] && (
              <li>
                أكثر ولاية تمثيلاً: <strong>{report.top_states[0].state}</strong> ({report.top_states[0].count} مريض).
              </li>
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
};

export default ComprehensiveReport;
