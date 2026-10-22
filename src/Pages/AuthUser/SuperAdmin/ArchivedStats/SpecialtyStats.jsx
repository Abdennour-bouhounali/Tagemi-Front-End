// Archived event: appointments per specialty and their final outcome.
import React, { useState, useEffect, useContext } from "react";
import { escapeHtml, csvSafe } from "../../../../utils/safeHtml";
import { useParams } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import { Download, Printer } from "lucide-react";
import { PageHeader, StatStrip, LoadingState, Panel, useToast } from "../../../../Components/ui";
import {
  ActionsMenu, ARCHIVED_OUTCOMES, BackLink, ChartLegend, ErrorState, HBarChart, POPUP_BLOCKED, ResponsiveTable, printHtml,
} from "../../../../Components/ui/StatsKit";

const apiUrl = import.meta.env.VITE_API_URL;

// Outcome of each archived appointment.
const OUTCOME_LABELS = {
  completed: ARCHIVED_OUTCOMES.Completed.label,
  not_examined: ARCHIVED_OUTCOMES.Waiting.label,
  pending: ARCHIVED_OUTCOMES.Pending.label,
};

const OUTCOME_BARS = [
  { key: "completed", name: OUTCOME_LABELS.completed, color: ARCHIVED_OUTCOMES.Completed.color },
  { key: "not_examined", name: OUTCOME_LABELS.not_examined, color: ARCHIVED_OUTCOMES.Waiting.color },
  { key: "pending", name: OUTCOME_LABELS.pending, color: ARCHIVED_OUTCOMES.Pending.color },
];

const num = (value) => parseInt(value, 10) || 0;
const rate = (part, total) => (num(total) > 0 ? ((num(part) / num(total)) * 100).toFixed(1) : "0.0");
const sumOf = (rows, key) => rows.reduce((sum, row) => sum + num(row[key]), 0);

const SpecialtyStats = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  const toast = useToast();
  
  const [event, setEvent] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalAppointments = sumOf(statistics, 'total_appointments');

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/specialty-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setEvent(data.event);
        setStatistics(data.statistics);
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

  const totalCompleted = sumOf(statistics, 'completed');
  const totalNotExamined = sumOf(statistics, 'not_examined');
  const totalPending = sumOf(statistics, 'pending');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>إحصائيات التخصصات - ${escapeHtml(event?.name)}</title>
      <style>
        @page { size: A4; margin: 2cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Tahoma', sans-serif; line-height: 1.6; color: #333; background: white; }
        
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 3px solid #3b82f6;
          margin-bottom: 30px;
        }
        .logo { width: 120px; height: auto; margin-bottom: 15px; }
        .header h1 { font-size: 28px; color: #3b82f6; margin-bottom: 8px; font-weight: bold; }
        .header .event-name { font-size: 18px; color: #666; margin-bottom: 5px; }
        .header .date { font-size: 14px; color: #999; }
        
        .section { margin-bottom: 35px; page-break-inside: avoid; }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 15px;
          margin-bottom: 30px;
          padding: 20px;
          background: #eff6ff;
          border-radius: 8px;
        }
        .summary-card { text-align: center; }
        .summary-card .label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #3b82f6; }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .data-table th {
          background-color: #3b82f6;
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
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-completed { background-color: #dcfce7; color: #16a34a; }
        .status-not-examined { background-color: #fef3c7; color: #d97706; }
        .status-pending { background-color: #fee2e2; color: #dc2626; }
        
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
        <h1>تقرير إحصائيات التخصصات الطبية</h1>
        <p class="event-name">${escapeHtml(event?.name)}</p>
        <p class="date">تاريخ الإصدار: ${escapeHtml(currentDate)}</p>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">إجمالي المواعيد</div>
          <div class="value">${totalAppointments}</div>
        </div>
        <div class="summary-card">
          <div class="label">عدد التخصصات</div>
          <div class="value">${statistics.length}</div>
        </div>
        <div class="summary-card">
          <div class="label">${OUTCOME_LABELS.completed}</div>
          <div class="value" style="color: #10b981;">${totalCompleted}</div>
        </div>
        <div class="summary-card">
          <div class="label">${OUTCOME_LABELS.not_examined}</div>
          <div class="value" style="color: #f59e0b;">${totalNotExamined}</div>
        </div>
        <div class="summary-card">
          <div class="label">${OUTCOME_LABELS.pending}</div>
          <div class="value" style="color: #ef4444;">${totalPending}</div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">تفاصيل التخصصات</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>التخصص</th>
              <th>إجمالي المواعيد</th>
              <th>${OUTCOME_LABELS.completed}</th>
              <th>${OUTCOME_LABELS.not_examined}</th>
              <th>${OUTCOME_LABELS.pending}</th>
              <th>معدل الإكمال</th>
            </tr>
          </thead>
          <tbody>
            ${statistics.map(stat => {
              const completionRate = rate(stat.completed, stat.total_appointments);
              return `
                <tr>
                  <td><strong>${escapeHtml(stat.name)}</strong></td>
                  <td>${num(stat.total_appointments)}</td>
                  <td><span class="status-badge status-completed">${num(stat.completed)}</span></td>
                  <td><span class="status-badge status-not-examined">${num(stat.not_examined)}</span></td>
                  <td><span class="status-badge status-pending">${num(stat.pending)}</span></td>
                  <td><strong>${completionRate}%</strong></td>
                </tr>
              `;
            }).join('')}
            <tr style="background-color: #f3f4f6; font-weight: bold;">
              <td>الإجمالي</td>
              <td>${totalAppointments}</td>
              <td>${totalCompleted}</td>
              <td>${totalNotExamined}</td>
              <td>${totalPending}</td>
              <td>${rate(totalCompleted, totalAppointments)}%</td>
            </tr>
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
      ["التخصص", "إجمالي المواعيد", OUTCOME_LABELS.completed, OUTCOME_LABELS.not_examined, OUTCOME_LABELS.pending],
      ...statistics.map(stat => [
        stat.name,
        num(stat.total_appointments),
        num(stat.completed),
        num(stat.not_examined),
        num(stat.pending)
      ])
    ].map(row => row.map(cell => `"${csvSafe(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `specialty_stats_${eventId}.csv`;
    link.click();
  };

  const backTo = `/admin/event-tracking/${eventId}`;

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackLink to={backTo} />
        <PageHeader title="إحصائيات التخصصات" />
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  const columns = [
    { key: "name", label: "التخصص", primary: true },
    { key: "total_appointments", label: "المواعيد", align: "center", render: (row) => num(row.total_appointments) },
    { key: "completed", label: OUTCOME_LABELS.completed, align: "center", render: (row) => num(row.completed) },
    { key: "not_examined", label: OUTCOME_LABELS.not_examined, align: "center", render: (row) => num(row.not_examined) },
    { key: "pending", label: OUTCOME_LABELS.pending, align: "center", render: (row) => num(row.pending) },
    { key: "rate", label: "نسبة الإكمال", align: "center", render: (row) => `${rate(row.completed, row.total_appointments)}%` },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <BackLink to={backTo} />
      <PageHeader
        title="إحصائيات التخصصات"
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
          { label: "المواعيد", value: totalAppointments },
          { label: "التخصصات", value: statistics.length },
          { label: OUTCOME_LABELS.completed, value: sumOf(statistics, "completed"), tone: "text-st-queue" },
          { label: OUTCOME_LABELS.not_examined, value: sumOf(statistics, "not_examined"), tone: "text-st-pushed" },
          { label: OUTCOME_LABELS.pending, value: sumOf(statistics, "pending"), tone: "text-st-pending" },
        ]}
      />

      {statistics.length === 0 ? (
        <Panel>
          <p className="py-6 text-center text-sm text-muted">لا توجد مواعيد مؤرشفة لهذا الحدث.</p>
        </Panel>
      ) : (
        <div className="space-y-4">
          <Panel title="المواعيد حسب التخصص">
            <ChartLegend className="mb-2" items={OUTCOME_BARS.map((b) => ({ label: b.name, color: b.color }))} />
            <HBarChart
              data={statistics.map((stat) => ({
                name: stat.name,
                completed: num(stat.completed),
                not_examined: num(stat.not_examined),
                pending: num(stat.pending),
              }))}
              bars={OUTCOME_BARS}
            />
          </Panel>

          <Panel title="تفاصيل التخصصات">
            <ResponsiveTable
              columns={columns}
              rows={statistics}
              rowKey={(row, i) => row.id ?? i}
              footer={{
                name: "المجموع",
                total_appointments: totalAppointments,
                completed: sumOf(statistics, "completed"),
                not_examined: sumOf(statistics, "not_examined"),
                pending: sumOf(statistics, "pending"),
              }}
            />
          </Panel>
        </div>
      )}
    </div>
  );
};

export default SpecialtyStats;
