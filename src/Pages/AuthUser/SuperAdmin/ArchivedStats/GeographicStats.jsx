import { API_BASE_URL } from '../../../../config/environment';
// Archived event: patients by wilaya and city.
import React, { useState, useEffect, useContext } from "react";
import { escapeHtml, csvSafe } from "../../../../utils/safeHtml";
import { useParams } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import { Download, Printer } from "lucide-react";
import { PageHeader, StatStrip, LoadingState, Panel, useToast } from "../../../../Components/ui";
import {
  ActionsMenu, BackLink, CHART, ErrorState, HBarChart, POPUP_BLOCKED, RankList, ResponsiveTable, pct, printHtml,
} from "../../../../Components/ui/StatsKit";

const apiUrl = API_BASE_URL;

const GeographicStats = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  const toast = useToast();
  
  const [event, setEvent] = useState(null);
  const [stateStats, setStateStats] = useState([]);
  const [cityStats, setCityStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPatients = stateStats.reduce((sum, stat) => sum + (parseInt(stat.count) || 0), 0);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/geographic-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setEvent(data.event);
        setStateStats(data.state_statistics);
        setCityStats(data.city_statistics);
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

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>إحصائيات جغرافية - ${escapeHtml(event?.name)}</title>
      <style>
        @page { size: A4; margin: 2cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Tahoma', sans-serif; line-height: 1.6; color: #333; }
        
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 3px solid #f59e0b;
          margin-bottom: 30px;
        }
        .logo { width: 120px; height: auto; margin-bottom: 15px; }
        .header h1 { font-size: 28px; color: #f59e0b; margin-bottom: 8px; font-weight: bold; }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .data-table th {
          background-color: #f59e0b;
          color: white;
          padding: 12px;
          text-align: center;
        }
        .data-table td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          text-align: center;
        }
        
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/tagemi_logo.png" alt="Logo" class="logo" />
        <h1>تقرير الإحصائيات الجغرافية</h1>
        <p>${escapeHtml(event?.name)}</p>
        <p>تاريخ الإصدار: ${escapeHtml(currentDate)}</p>
      </div>

      <h2>إحصائيات الولايات</h2>
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
          ${stateStats.map((stat, index) => {
            const percentage = ((parseInt(stat.count) / totalPatients) * 100).toFixed(1);
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

      <h2>أعلى 20 مدينة</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>الترتيب</th>
            <th>المدينة</th>
            <th>الولاية</th>
            <th>العدد</th>
          </tr>
        </thead>
        <tbody>
          ${cityStats.map((stat, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(stat.city)}</td>
              <td>${escapeHtml(stat.state)}</td>
              <td>${escapeHtml(stat.count)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
};
  const handleExport = () => {
    const csvContent = [
      ["=== إحصائيات الولايات ==="],
      ["الولاية", "العدد"],
      ...stateStats.map(stat => [stat.state, stat.count]),
      [""],
      ["=== إحصائيات المدن (أعلى 20) ==="],
      ["المدينة", "الولاية", "العدد"],
      ...cityStats.map(stat => [stat.city, stat.state, stat.count])
    ].map(row => row.map(cell => `"${csvSafe(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `geographic_stats_${eventId}.csv`;
    link.click();
  };

  const backTo = `/admin/event-tracking/${eventId}`;

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="max-w-6xl lg:max-w-none mx-auto">
        <BackLink to={backTo} />
        <PageHeader title="إحصائيات جغرافية" />
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  const stateChartData = stateStats.slice(0, 10).map((stat) => ({ name: stat.state, value: parseInt(stat.count) || 0 }));
  const cityChartData = cityStats.slice(0, 15).map((stat) => ({ name: stat.city, value: parseInt(stat.count) || 0 }));

  const cityColumns = [
    { key: "rank", label: "الترتيب", align: "center", render: (row) => row.rank },
    { key: "city", label: "المدينة", primary: true },
    { key: "state", label: "الولاية" },
    { key: "count", label: "العدد", align: "center", render: (row) => parseInt(row.count) || 0 },
    { key: "share", label: "النسبة", align: "center", render: (row) => `${pct(row.count, totalPatients)}%` },
  ];

  const average = (count) => (count > 0 ? Math.round(totalPatients / count) : 0);

  return (
    <div className="max-w-6xl lg:max-w-none mx-auto">
      <BackLink to={backTo} />
      <PageHeader
        title="إحصائيات جغرافية"
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
        className="mb-4 lg:grid lg:grid-flow-col lg:auto-cols-fr lg:mx-0 lg:px-0"
        items={[
          { label: "المرضى", value: totalPatients },
          { label: "الولايات", value: stateStats.length },
          { label: "المدن", value: cityStats.length },
          { label: "متوسط المرضى لكل ولاية", value: average(stateStats.length) },
          { label: "متوسط المرضى لكل مدينة", value: average(cityStats.length) },
        ]}
      />

      {stateStats.length === 0 && cityStats.length === 0 ? (
        <Panel>
          <p className="py-6 text-center text-sm text-muted">لا توجد بيانات عناوين مؤرشفة لهذا الحدث.</p>
        </Panel>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="أعلى 10 ولايات">
              <HBarChart data={stateChartData} bars={[{ key: "value", name: "المرضى", color: CHART.inkSoft }]} />
            </Panel>

            <Panel title={`كل الولايات (${stateStats.length})`}>
              <div className="max-h-[26rem] overflow-y-auto">
                <RankList total={totalPatients} items={stateStats.map((stat) => ({ label: stat.state, value: stat.count }))} />
              </div>
            </Panel>
          </div>

          <Panel title="أعلى المدن" bodyClassName="xl:grid xl:grid-cols-2 xl:gap-6 xl:items-start">
            <HBarChart data={cityChartData} bars={[{ key: "value", name: "المرضى", color: CHART.inkSoft }]} />
            <div className="mt-4 xl:mt-0">
              <ResponsiveTable
                columns={cityColumns}
                rows={cityStats.map((stat, index) => ({ ...stat, rank: index + 1 }))}
                rowKey={(row) => `${row.city}-${row.state}-${row.rank}`}
              />
            </div>
          </Panel>

          {(stateStats[0] || cityStats[0]) && (
            <Panel title="ملاحظات">
              <ul className="space-y-1.5 text-sm text-ink">
                {stateStats[0] && (
                  <li>أكثر ولاية تمثيلاً: <strong>{stateStats[0].state}</strong> بـ {stateStats[0].count} مريض.</li>
                )}
                {cityStats[0] && (
                  <li>أكثر مدينة تمثيلاً: <strong>{cityStats[0].city}</strong> بـ {cityStats[0].count} مريض.</li>
                )}
                <li>التغطية: {stateStats.length} ولاية و{cityStats.length} مدينة.</li>
              </ul>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
};

export default GeographicStats;
