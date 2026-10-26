import { API_BASE_URL } from '../../../../config/environment';
// Deep statistics section of the event statistics page: cross-tab matrices such as ksar x sex.
import React, { useState, useEffect, useContext } from 'react';
import { Download } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Button, StatStrip, LoadingState, Panel, ChipGroup, EmptyState, cx } from '../../../../Components/ui';
import { CHART, ChartLegend, ErrorState, HBarChart, ResponsiveTable, downloadCsv, pct, toNum } from '../../../../Components/ui/StatsKit';

const MODES = [
  { value: 'count', label: 'العدد' },
  { value: 'row', label: '% من السطر' },
  { value: 'col', label: '% من العمود' },
  { value: 'resid', label: 'أين الفروق؟ (z)' },
];

const MATRIX_ORDER = [
  'ksar_sex', 'ksar_age', 'sex_age', 'ksar_outcome', 'sex_outcome', 'ksar_specialty', 'sex_specialty',
];

const formatP = (p) => (p < 0.001 ? '< 0.001' : p.toFixed(3));

const strength = (v) => (v < 0.1 ? 'ضعيفة جداً' : v < 0.2 ? 'ضعيفة' : v < 0.4 ? 'متوسطة' : 'قوية');

/** One-line reading of the chi-square test, in plain Arabic. */
function TestNote({ test, unit }) {
  if (!test) return <p className="text-xs text-muted mt-3">لا يكفي التنوع في البيانات لإجراء اختبار الارتباط.</p>;
  const significant = test.p_value < 0.05;
  return (
    <div className="mt-3 text-xs text-muted space-y-1">
      <p>
        اختبار كاي تربيع: χ² = {test.chi_square} ، درجات الحرية = {test.df} ، p = {formatP(test.p_value)}
        {' · '}معامل كرامر V = {test.cramers_v} ({strength(test.cramers_v)})
      </p>
      <p className={cx('font-semibold', significant ? 'text-ink' : 'text-muted')}>
        {significant
          ? 'يوجد ارتباط ذو دلالة إحصائية بين المتغيرين (p < 0.05).'
          : 'لا يوجد دليل كافٍ على ارتباط بين المتغيرين (p ≥ 0.05).'}
      </p>
      {test.small_expected_share > 20 && (
        <p>تنبيه: {test.small_expected_share}% من الخلايا قيمتها المتوقعة أقل من 5، فالنتيجة تقريبية.</p>
      )}
      <p>الوحدة المعدودة: {unit === 'patients' ? 'مريض واحد لكل شخص' : 'موعد (قد يملك المريض عدة مواعيد)'}.</p>
    </div>
  );
}

const SEX_LEGEND = [
  { label: 'ذكور', color: CHART.ink },
  { label: 'إناث', color: CHART.rose },
];

/** Population pyramid: males to the left, females to the right of the age labels. */
function Pyramid({ bands }) {
  const max = Math.max(1, ...bands.flatMap((b) => [b.males, b.females]));
  return (
    <div dir="ltr" className="space-y-1">
      {[...bands].reverse().map((b) => (
        <div key={b.band} className="grid grid-cols-[1fr_4.5rem_1fr] items-center gap-2 text-sm">
          <div className="flex items-center justify-end gap-1.5">
            <span className="tabular-nums text-ink">{b.males}</span>
            <div className="h-5 rounded-s" style={{ width: `${(b.males / max) * 85}%`, backgroundColor: CHART.ink }} />
          </div>
          <span className="text-center text-muted">{b.band}</span>
          <div className="flex items-center gap-1.5">
            <div className="h-5 rounded-e" style={{ width: `${(b.females / max) * 85}%`, backgroundColor: CHART.rose }} />
            <span className="tabular-nums text-ink">{b.females}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Timeline({ days }) {
  const data = days.map((d) => ({ ...d, label: d.day.slice(5) }));
  return (
    <div dir="ltr" className="w-full" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke={CHART.line} />
          <XAxis dataKey="label" tick={{ fill: CHART.muted, fontSize: 14 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} width={36} tick={{ fill: CHART.muted, fontSize: 14 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: CHART.inkFaint }}
            contentStyle={{ direction: 'rtl', borderRadius: 12, border: `1px solid ${CHART.line}`, fontSize: 13 }}
          />
          <Bar dataKey="males" name="ذكور" stackId="a" fill={CHART.ink} isAnimationActive={false} />
          <Bar dataKey="females" name="إناث" stackId="a" fill={CHART.rose} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Matrix({ matrix }) {
  const [mode, setMode] = useState('count');
  const { rows, cols, cells } = matrix;
  const rowTotals = cells.map((r) => r.reduce((a, b) => a + toNum(b), 0));
  const colTotals = cols.map((_, c) => cells.reduce((a, r) => a + toNum(r[c]), 0));
  const grand = rowTotals.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...cells.flat().map((n, i) => {
    const r = Math.floor(i / cols.length);
    const c = i % cols.length;
    if (mode === 'row') return rowTotals[r] ? n / rowTotals[r] : 0;
    if (mode === 'col') return colTotals[c] ? n / colTotals[c] : 0;
    return n;
  }));

  const z = (r, c) => matrix.residuals?.[r]?.[c];
  const show = (n, r, c) => {
    if (mode === 'resid') return z(r, c) == null ? '—' : `${z(r, c) > 0 ? '+' : ''}${z(r, c)}`;
    if (mode === 'row') return `${pct(n, rowTotals[r])}%`;
    if (mode === 'col') return `${pct(n, colTotals[c])}%`;
    return n;
  };
  const shade = (n, r, c) => {
    if (mode === 'resid') {
      const v = z(r, c) ?? 0;
      const strength = Math.min(Math.abs(v) / 3, 1);
      return { backgroundColor: v >= 0 ? `rgba(224, 58, 111, ${0.85 * strength})` : `rgba(42, 58, 122, ${0.85 * strength})` };
    }
    const value = mode === 'row' ? (rowTotals[r] ? n / rowTotals[r] : 0) : mode === 'col' ? (colTotals[c] ? n / colTotals[c] : 0) : n;
    return { backgroundColor: `rgba(42, 58, 122, ${(0.55 * value) / max})` };
  };
  const light = (n, r, c) => {
    if (mode === 'resid') return Math.abs(z(r, c) ?? 0) > 1.6;
    const value = mode === 'row' ? (rowTotals[r] ? n / rowTotals[r] : 0) : mode === 'col' ? (colTotals[c] ? n / colTotals[c] : 0) : n;
    return value / max > 0.6;
  };

  return (
    <Panel title={matrix.title}>
      <ChipGroup label="طريقة العرض" value={mode} onChange={setMode} options={MODES} className="mb-3" />
      {mode === 'resid' && (
        <p className="text-xs text-muted mb-2">
          الأحمر: أكثر من المتوقع، الأزرق: أقل من المتوقع. القيمة خارج ‎±1.96‎ تعني فرقاً ذا دلالة إحصائية (5%) في تلك الخلية.
        </p>
      )}
      {/* Fixed layout: the columns share the full width and their titles wrap, so no scrolling */}
      <div className="w-full">
        <table className="w-full table-fixed text-xs sm:text-sm lg:text-base border-separate border-spacing-0.5">
          <colgroup>
            <col style={{ width: '18%' }} />
            {cols.map((col) => <col key={col} />)}
            <col style={{ width: '9%' }} />
          </colgroup>
          <thead>
            <tr className="text-muted align-bottom">
              <th className="text-start px-1.5 py-1.5 font-semibold" />
              {cols.map((col) => (
                <th key={col} className="px-1 py-1.5 font-semibold text-center leading-snug break-words">{col}</th>
              ))}
              <th className="px-1 py-1.5 font-semibold text-center">المجموع</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row}>
                <th className="text-start px-1.5 py-1.5 font-semibold text-ink leading-snug break-words">{row}</th>
                {cols.map((col, c) => (
                  <td
                    key={col}
                    style={shade(cells[r][c], r, c)}
                    className={cx('text-center px-1 py-2 rounded-md tabular-nums', light(cells[r][c], r, c) ? 'text-white' : 'text-ink')}
                  >
                    {show(cells[r][c], r, c)}
                    {mode === 'resid' && Math.abs(z(r, c) ?? 0) >= 1.96 && <span aria-label="دال إحصائياً"> *</span>}
                  </td>
                ))}
                <td className="text-center px-2 py-1.5 font-semibold text-ink tabular-nums">{rowTotals[r]}</td>
              </tr>
            ))}
            <tr className="border-t border-line">
              <th className="text-start px-2 py-1.5 font-semibold text-muted">المجموع</th>
              {colTotals.map((total, c) => (
                <td key={cols[c]} className="text-center px-2 py-1.5 font-semibold text-ink tabular-nums">{total}</td>
              ))}
              <td className="text-center px-2 py-1.5 font-bold text-ink tabular-nums">{grand}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <TestNote test={matrix.test} unit={matrix.unit} />
    </Panel>
  );
}

const DeepStatsSection = ({ eventId }) => {
  const { token } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/deep-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setData(json);
      else setError(json.message || 'فشل في تحميل البيانات');
    } catch (err) {
      setError('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [eventId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const { statistics: s } = data;
  const males = s.sex_summary.find((x) => x.sex === 'ذكر');
  const females = s.sex_summary.find((x) => x.sex === 'أنثى');
  const minors = s.sex_summary.reduce((a, x) => a + x.minors, 0);

  const exportCsv = () => {
    const out = [
      ['القصر', 'المرضى', 'ذكور', 'إناث', 'القصّر', 'متوسط العمر', 'وسيط العمر', 'نسبة الحضور %', 'نسبة إنهاء الفحص %'],
      ...s.ksar_summary.map((k) => [k.ksar, k.count, k.males, k.females, k.minors, k.mean_age, k.median_age, k.attendance_rate, k.completion_rate]),
      [],
    ];
    MATRIX_ORDER.forEach((key) => {
      const m = s.matrices[key];
      out.push([m.title], ['', ...m.cols, 'المجموع']);
      m.cells.forEach((row, r) => out.push([m.rows[r], ...row, row.reduce((a, b) => a + toNum(b), 0)]));
      if (m.test) out.push(['χ²', m.test.chi_square, 'df', m.test.df, 'p', m.test.p_value, 'V', m.test.cramers_v]);
      out.push([]);
    });
    downloadCsv(out, `deep_stats_${eventId}.csv`);
  };

  const ksarColumns = [
    { key: 'ksar', label: 'القصر', primary: true },
    { key: 'count', label: 'المرضى', align: 'center' },
    { key: 'males', label: 'ذكور', align: 'center' },
    { key: 'females', label: 'إناث', align: 'center' },
    { key: 'ratio', label: 'ذكور لكل 100 أنثى', align: 'center', render: (r) => r.males_per_100_females ?? '—' },
    { key: 'minors', label: 'القصّر (أقل من 18)', align: 'center', render: (r) => `${r.minors} (${pct(r.minors, r.count)}%)` },
    { key: 'mean', label: 'متوسط العمر', align: 'center', render: (r) => r.mean_age ?? '—' },
    { key: 'median', label: 'وسيط العمر', align: 'center', render: (r) => r.median_age ?? '—' },
    { key: 'attendance', label: 'نسبة الحضور', align: 'center', render: (r) => (r.attendance_rate == null ? '—' : `${r.attendance_rate}%`) },
    { key: 'completion', label: 'نسبة إنهاء الفحص', align: 'center', render: (r) => (r.completion_rate == null ? '—' : `${r.completion_rate}%`) },
    { key: 'per_patient', label: 'مواعيد لكل مريض', align: 'center', render: (r) => r.per_patient ?? '—' },
  ];

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-display text-lg text-ink">إحصائيات معمّقة ومصفوفات</h2>
        <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>CSV</Button>
      </div>

      {s.totals.appointments === 0 ? (
        <Panel><EmptyState title="لا توجد مواعيد في هذا الحدث">ستظهر الإحصائيات بعد تسجيل المرضى.</EmptyState></Panel>
      ) : (
        <>
          <StatStrip
            className="mb-4 lg:grid lg:grid-flow-col lg:auto-cols-fr lg:mx-0 lg:px-0"
            items={[
              { label: 'المرضى', value: s.totals.patients },
              { label: 'المواعيد', value: s.totals.appointments },
              { label: 'القصور', value: s.totals.ksars },
              { label: 'ذكور', value: `${males?.count ?? 0} (${pct(males?.count, s.totals.patients)}%)` },
              { label: 'إناث', value: `${females?.count ?? 0} (${pct(females?.count, s.totals.patients)}%)` },
              { label: 'القصّر (أقل من 18)', value: `${minors} (${pct(minors, s.totals.patients)}%)` },
            ]}
          />

          <div className="space-y-4">
            {s.insights.length > 0 && (
              <Panel title="أهم الملاحظات">
                <ul className="space-y-1.5 text-sm text-ink list-disc ps-5">
                  {s.insights.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </Panel>
            )}

            <div className="grid grid-cols-1 gap-4">
              <Panel title="الجنس حسب القصر">
                <ChartLegend className="mb-2" items={SEX_LEGEND} />
                <HBarChart
                  data={s.ksar_summary.map((k) => ({ name: k.ksar, males: k.males, females: k.females }))}
                  bars={[
                    { key: 'males', name: 'ذكور', color: CHART.ink },
                    { key: 'females', name: 'إناث', color: CHART.rose },
                  ]}
                  labelWidth={190}
                  rowHeight={44}
                  fontSize={14}
                  maxBarSize={30}
                />
              </Panel>
              <Panel title="هرم الأعمار">
                <ChartLegend className="mb-3" items={SEX_LEGEND} />
                <Pyramid bands={s.pyramid} />
              </Panel>
            </div>

            {s.timeline.length > 1 && (
              <Panel title="التسجيلات حسب اليوم">
                <ChartLegend className="mb-2" items={SEX_LEGEND} />
                <Timeline days={s.timeline} />
              </Panel>
            )}

            <Panel title="ملخص حسب القصر">
              <ResponsiveTable columns={ksarColumns} rows={s.ksar_summary} rowKey={(r) => r.ksar} />
            </Panel>

            <Panel title="ملخص حسب الجنس">
              <ResponsiveTable
                columns={[
                  { key: 'sex', label: 'الجنس', primary: true },
                  { key: 'count', label: 'المرضى', align: 'center' },
                  { key: 'minors', label: 'القصّر', align: 'center' },
                  { key: 'mean_age', label: 'متوسط العمر', align: 'center', render: (r) => r.mean_age ?? '—' },
                  { key: 'median_age', label: 'وسيط العمر', align: 'center', render: (r) => r.median_age ?? '—' },
                  { key: 'attendance', label: 'نسبة الحضور', align: 'center', render: (r) => (r.attendance_rate == null ? '—' : `${r.attendance_rate}%`) },
                  { key: 'completion', label: 'نسبة إنهاء الفحص', align: 'center', render: (r) => (r.completion_rate == null ? '—' : `${r.completion_rate}%`) },
                ]}
                rows={s.sex_summary}
                rowKey={(r) => r.sex}
              />
            </Panel>

            <div className="grid grid-cols-1 gap-4">
              {MATRIX_ORDER.map((key) => <Matrix key={key} matrix={s.matrices[key]} />)}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default DeepStatsSection;
