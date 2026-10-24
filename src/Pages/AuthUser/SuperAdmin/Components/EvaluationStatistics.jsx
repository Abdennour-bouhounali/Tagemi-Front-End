import { API_BASE_URL } from '../../../../config/environment';
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, BarChart3 } from "lucide-react";
import { AppContext } from "../../../../Context/AppContext";
import { PageHeader, StatStrip, EmptyState, LoadingState, Panel, useToast } from "../../../../Components/ui";

const apiUrl = API_BASE_URL;

/** One labelled horizontal bar. `max` is the full-width value. */
function BarRow({ label, value, max, display }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (Number(value) / max) * 100)) : 0;
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-2 text-sm mb-1">
        <span className="text-ink">{label}</span>
        <span className="font-semibold text-ink tabular-nums">{display ?? value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-ink-faint overflow-hidden" aria-hidden="true">
        <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

function Distribution({ title, entries }) {
  const total = entries.reduce((sum, [, v]) => sum + Number(v || 0), 0);
  return (
    <Panel title={title}>
      {entries.length === 0 ? (
        <p className="text-sm text-muted">لا توجد بيانات.</p>
      ) : (
        <ul>
          {entries.map(([name, value]) => (
            <BarRow
              key={name}
              label={name}
              value={value}
              max={total}
              display={`${value} (${total ? Math.round((value / total) * 100) : 0}%)`}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Evaluation statistics of one event (super admin). */
const EvaluationStatistics = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [statistics, setStatistics] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/evaluations/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
        setStatistics(data.statistics);
      } else {
        toast(data.message || "تعذر تحميل الإحصائيات", "error");
      }
    } catch {
      toast("تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة", "error");
    } finally {
      setLoading(false);
    }
  }, [eventId, token, toast]);

  useEffect(() => { fetchStatistics(); }, [fetchStatistics]);

  const back = (
    <Link to="/admin/evaluations" className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
      <ChevronRight className="w-4 h-4" /> كل التقييمات
    </Link>
  );

  if (loading) return <LoadingState />;

  if (!statistics || !statistics.total_evaluations) {
    return (
      <div className="max-w-2xl lg:max-w-none mx-auto">
        {back}
        <PageHeader title="إحصائيات التقييمات" subtitle={event?.name} />
        <EmptyState icon={BarChart3} title="لا توجد إحصائيات لهذا الحدث">
          تظهر الإحصائيات بعد أن يرسل المرضى أول تقييم لهذا الحدث.
        </EmptyState>
      </div>
    );
  }

  const avg = statistics.average_ratings || {};
  const ratings = [
    ["التنظيم العام", avg.overall_organization],
    ["الجودة الطبية", avg.medical_quality],
    ["أداء الطاقم", avg.staff_performance],
    ["سهولة التسجيل", avg.registration_ease],
    ["تنظيم المنصة", avg.platform_organization],
  ];
  const processedPct = statistics.total_evaluations
    ? Math.round((statistics.processed_count / statistics.total_evaluations) * 100)
    : 0;

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto">
      {back}
      <PageHeader title="إحصائيات التقييمات" subtitle={event?.name} />

      <StatStrip
        className="mb-4 lg:grid lg:grid-flow-col lg:auto-cols-fr lg:mx-0 lg:px-0"
        items={[
          { label: "تقييم", value: statistics.total_evaluations },
          { label: "متوسط من 5", value: avg.overall_average },
          { label: "ينصحون بها", value: `${statistics.recommendation_percentage}%`, tone: "text-st-queue" },
          { label: "تمت معالجتها", value: `${processedPct}%` },
        ]}
      />

      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
        <Panel title="متوسط التقييم حسب المعيار">
          <ul>
            {ratings.map(([label, value]) => (
              <BarRow key={label} label={label} value={value || 0} max={5} display={value != null ? `${value} من 5` : "—"} />
            ))}
          </ul>
        </Panel>

        <Distribution
          title="هل ينصحون بالحملة؟"
          entries={[["نعم", statistics.would_recommend || 0], ["لا", statistics.would_not_recommend || 0]]}
        />
        <Distribution title="الفئات العمرية" entries={Object.entries(statistics.age_distribution || {})} />
        <Distribution title="الجنس" entries={Object.entries(statistics.gender_distribution || {})} />
      </div>
    </div>
  );
};

export default EvaluationStatistics;
