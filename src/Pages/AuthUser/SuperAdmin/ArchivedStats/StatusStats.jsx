import { API_BASE_URL } from '../../../../config/environment';
// Archived event: final outcome of every appointment.
import React, { useState, useEffect, useContext } from "react";
import { escapeHtml, csvSafe } from "../../../../utils/safeHtml";
import { useParams } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import { Download, Printer } from "lucide-react";
import { PageHeader, StatStrip, LoadingState, Panel, useToast } from "../../../../Components/ui";
import {
  ActionsMenu, ARCHIVED_OUTCOMES, BackLink, ErrorState, POPUP_BLOCKED, ResponsiveTable, ShareBar, printHtml,
} from "../../../../Components/ui/StatsKit";

const apiUrl = API_BASE_URL;

// Map all possible backend statuses to the 3 archived outcomes
const STATUS_CONFIG = {
  Completed: ARCHIVED_OUTCOMES.Completed,
  // Pending: booked but never came
  Pending: ARCHIVED_OUTCOMES.Pending,
  // Waiting: came to the visit but was not examined
  Waiting: ARCHIVED_OUTCOMES.Waiting,
  // Backwards compatibility - old status names
  "مكتمل": ARCHIVED_OUTCOMES.Completed,
  "معلق": ARCHIVED_OUTCOMES.Pending,
  "ملغي": ARCHIVED_OUTCOMES.Pending,
  "غائب": ARCHIVED_OUTCOMES.Pending,
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || ARCHIVED_OUTCOMES.Waiting;

const StatusStats = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  const toast = useToast();
  
  const [event, setEvent] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/status-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setEvent(data.event);
        setStatistics(data.statistics);
        setTotalAppointments(data.total_appointments);
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

  const totalSpecialCases = statistics.reduce((sum, stat) => sum + parseInt(stat.special_count || 0), 0);

  const getStatusLabel = (status) => {
    if (status === 'Completed') return 'أنهى الفحص';
    if (status === 'Pending') return 'لم يحضر';
    if (status === 'Waiting') return 'حضر ولم يُفحص';
    return status;
  };

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>إحصائيات الحالات - ${escapeHtml(event?.name)}</title>
      <style>
        @page { size: A4; margin: 2cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Tahoma', sans-serif; line-height: 1.6; color: #333; background: white; }
        
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 3px solid #10b981;
          margin-bottom: 30px;
        }
        .logo { width: 120px; height: auto; margin-bottom: 15px; }
        .header h1 { font-size: 28px; color: #10b981; margin-bottom: 8px; font-weight: bold; }
        .header .event-name { font-size: 18px; color: #666; margin-bottom: 5px; }
        .header .date { font-size: 14px; color: #999; }
        
        .section { margin-bottom: 35px; page-break-inside: avoid; }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #10b981;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
          padding: 20px;
          background: #f0fdf4;
          border-radius: 8px;
        }
        .summary-card { text-align: center; }
        .summary-card .label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #10b981; }
        
        .special-box {
          padding: 20px;
          background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
          border: 2px solid #3b82f6;
          border-radius: 8px;
          margin-bottom: 30px;
          text-align: center;
        }
        .special-box h3 { color: #1e40af; font-size: 18px; margin-bottom: 10px; }
        .special-box .value { font-size: 36px; font-weight: bold; color: #2563eb; }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .data-table th {
          background-color: #10b981;
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
        .data-table tr:nth-child(even) { background-color: #f9fafb; }
        
        .progress-bar {
          width: 100%;
          height: 20px;
          background-color: #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background-color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/tagemi_logo.png" alt="Logo" class="logo" />
        <h1>تقرير إحصائيات الحالات</h1>
        <p class="event-name">${escapeHtml(event?.name)}</p>
        <p class="date">تاريخ الإصدار: ${escapeHtml(currentDate)}</p>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">إجمالي المواعيد</div>
          <div class="value">${escapeHtml(totalAppointments)}</div>
        </div>
        ${statistics.map(stat => {
          const percentage = totalAppointments > 0 
            ? ((parseInt(stat.count) / totalAppointments) * 100).toFixed(1) 
            : 0;
          return `
            <div class="summary-card">
              <div class="label">${escapeHtml(getStatusLabel(stat.status))}</div>
              <div class="value">${escapeHtml(stat.count)}</div>
              <div class="label" style="font-size: 11px; margin-top: 5px;">${percentage}%</div>
            </div>
          `;
        }).join('')}
      </div>

      ${totalSpecialCases > 0 ? `
        <div class="special-box">
          <h3>إجمالي الحالات الخاصة</h3>
          <div class="value">${totalSpecialCases}</div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">
            ${((totalSpecialCases / totalAppointments) * 100).toFixed(1)}% من إجمالي المواعيد
          </p>
        </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">تفاصيل الحالات</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>الحالة</th>
              <th>العدد</th>
              <th>حالات خاصة</th>
              <th>النسبة المئوية</th>
              <th>التمثيل البياني</th>
            </tr>
          </thead>
          <tbody>
            ${statistics.map(stat => {
              const percentage = totalAppointments > 0 
                ? ((parseInt(stat.count) / totalAppointments) * 100).toFixed(1) 
                : 0;
              const specialPercentage = stat.special_count > 0
                ? ((parseInt(stat.special_count) / parseInt(stat.count)) * 100).toFixed(1)
                : 0;
              
              return `
                <tr>
                  <td><strong>${escapeHtml(getStatusLabel(stat.status))}</strong></td>
                  <td><strong>${escapeHtml(stat.count)}</strong></td>
                  <td>${stat.special_count > 0 ? `${escapeHtml(stat.special_count)} (${specialPercentage}%)` : '-'}</td>
                  <td><strong>${percentage}%</strong></td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${percentage}%">
                        ${percentage}%
                      </div>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>هذا التقرير تم إنشاؤه تلقائياً بواسطة نظام إدارة الحملات الطبية</p>
        <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;
};
  const handleExport = () => {
    const csvContent = [
      ["الحالة", "العدد", "حالات خاصة", "النسبة المئوية"],
      ...statistics.map(stat => {
        const percentage = totalAppointments > 0 
          ? ((parseInt(stat.count) / totalAppointments) * 100).toFixed(1) 
          : 0;
        return [
          getStatusConfig(stat.status).label,
          stat.count,
          stat.special_count || 0,
          percentage + "%"
        ];
      })
    ].map(row => row.map(cell => `"${csvSafe(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `status_stats_${eventId}.csv`;
    link.click();
  };

  const backTo = `/admin/event-tracking/${eventId}`;

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="max-w-6xl lg:max-w-none mx-auto">
        <BackLink to={backTo} />
        <PageHeader title="إحصائيات الحالات" />
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  const share = (part, whole) => (parseInt(whole) > 0 ? ((parseInt(part || 0) / parseInt(whole)) * 100).toFixed(1) : "0.0");
  const totalSpecialCases = statistics.reduce((sum, stat) => sum + parseInt(stat.special_count || 0), 0);
  const eventDate = event?.date
    ? new Date(event.date).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" })
    : null;

  // Several backend statuses can share one outcome: add them up for the summary
  const outcomes = [];
  statistics.forEach((stat) => {
    const config = getStatusConfig(stat.status);
    const found = outcomes.find((o) => o.label === config.label);
    if (found) found.value += parseInt(stat.count) || 0;
    else outcomes.push({ label: config.label, color: config.color, value: parseInt(stat.count) || 0 });
  });

  const columns = [
    { key: "status", label: "الحالة", primary: true, render: (row) => getStatusConfig(row.status).label },
    { key: "count", label: "العدد", align: "center", render: (row) => parseInt(row.count) || 0 },
    { key: "share", label: "من المواعيد", align: "center", render: (row) => `${share(row.count, totalAppointments)}%` },
    {
      key: "special_count",
      label: "حالات خاصة",
      align: "center",
      render: (row) => (row.special_count > 0 ? `${row.special_count} (${share(row.special_count, row.count)}%)` : "—"),
    },
  ];

  return (
    <div className="max-w-6xl lg:max-w-none mx-auto">
      <BackLink to={backTo} />
      <PageHeader
        title="إحصائيات الحالات"
        subtitle={[event?.name, eventDate].filter(Boolean).join("، ")}
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
        className="mb-4 lg:grid lg:grid-flow-col lg:auto-cols-fr lg:mx-0 lg:px-0"
        items={[
          { label: "المواعيد", value: totalAppointments },
          ...outcomes.map((o) => ({ label: o.label, value: o.value })),
          totalSpecialCases > 0 && { label: "حالات خاصة", value: totalSpecialCases, tone: "text-rose" },
        ]}
      />

      {statistics.length === 0 ? (
        <Panel>
          <p className="py-6 text-center text-sm text-muted">لا توجد مواعيد مؤرشفة لهذا الحدث.</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="توزيع الحالات">
            <ShareBar
              total={parseInt(totalAppointments) || 0}
              parts={outcomes}
            />
            {totalSpecialCases > 0 && (
              <p className="mt-3 text-sm text-muted">
                منها <span className="font-semibold text-rose">{totalSpecialCases}</span> حالة خاصة، أي {share(totalSpecialCases, totalAppointments)}% من المواعيد.
              </p>
            )}
          </Panel>

          <Panel title="تفاصيل الحالات">
            <ResponsiveTable columns={columns} rows={statistics} rowKey={(row, i) => `${row.status}-${i}`} />
          </Panel>
        </div>
      )}
    </div>
  );
};

export default StatusStats;
