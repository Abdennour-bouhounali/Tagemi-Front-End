// Shared parts for the super admin statistics and report screens.
// Built on the kit in ./index.jsx; charts use recharts styled with the app tokens.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, MoreVertical } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Button, EmptyState, IconButton, Sheet, SheetAction, cx } from './index';
import { csvSafe, writePrintDocument } from '../../utils/safeHtml';

// Token values (tailwind.config.js) for places that need raw colours (recharts, inline widths).
export const CHART = {
  ink: '#101E58',
  inkSoft: '#2A3A7A',
  inkFaint: '#E7EAF4',
  line: '#DCE1EC',
  muted: '#5E6987',
  rose: '#E03A6F',
  queue: '#0F8A6C',
  hold: '#4F5FA3',
  pushed: '#B26B00',
  dil: '#0E7490',
  done: '#5F6B7D',
  pending: '#8A93A8',
};

export const toNum = (value) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
};

/** Share of part in total, as a "12.5" string (no % sign). */
export const pct = (part, total) => (toNum(total) > 0 ? ((toNum(part) / toNum(total)) * 100).toFixed(1) : '0.0');

/** Back link to the event tracking page. */
export function BackLink({ to, children = 'متابعة الحدث' }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
      <ChevronRight className="w-4 h-4" /> {children}
    </Link>
  );
}

/** ⋮ button in a page header that opens a sheet of actions (print, exports...). */
export function ActionsMenu({ title = 'طباعة وتصدير', label = 'خيارات', actions }) {
  const [open, setOpen] = useState(false);
  const visible = actions.filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <>
      <IconButton icon={MoreVertical} label={label} onClick={() => setOpen(true)} className="bg-white border border-line" />
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        {visible.map((action) => (
          <SheetAction
            key={action.label}
            icon={action.icon}
            hint={action.hint}
            tone={action.tone}
            disabled={action.disabled}
            onClick={() => {
              setOpen(false);
              action.onClick();
            }}
          >
            {action.label}
          </SheetAction>
        ))}
      </Sheet>
    </>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="تعذر تحميل البيانات"
      action={onRetry && <Button variant="secondary" onClick={onRetry}>أعد المحاولة</Button>}
    >
      {message || 'تحقق من الاتصال ثم أعد المحاولة.'}
    </EmptyState>
  );
}

/** Colour key shown above a chart. items: [{ label, color }] */
export function ChartLegend({ items, className }) {
  return (
    <ul className={cx('flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted', className)}>
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

const truncate = (text, max) => {
  const str = String(text ?? '');
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
};

/**
 * Horizontal bar chart for category lists (specialties, wilayas, cities...).
 * One row per category, so it stays readable at 360px.
 * bars: [{ key, name, color }]; more than one bar = stacked.
 */
export function HBarChart({ data, bars, nameKey = 'name', labelWidth = 104, rowHeight = 34, fontSize = 12, maxBarSize = 22 }) {
  if (!data.length) return null;
  const height = Math.max(140, data.length * rowHeight + 36);
  const stacked = bars.length > 1;
  return (
    <div dir="ltr" className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 4, bottom: 4, left: 4 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={CHART.line} />
          <XAxis
            type="number"
            reversed
            allowDecimals={false}
            tick={{ fill: CHART.muted, fontSize }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey={nameKey}
            orientation="right"
            width={labelWidth}
            interval={0}
            tickFormatter={(v) => truncate(v, Math.floor(labelWidth / (fontSize * 0.6)))}
            tick={{ fill: CHART.ink, fontSize }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: CHART.inkFaint }}
            contentStyle={{ direction: 'rtl', borderRadius: 12, border: `1px solid ${CHART.line}`, fontSize: 13, fontFamily: 'inherit' }}
            labelStyle={{ color: CHART.ink, fontWeight: 600 }}
          />
          {bars.map((bar, i) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color}
              stackId={stacked ? 'a' : undefined}
              radius={!stacked || i === bars.length - 1 ? [4, 0, 0, 4] : 0}
              maxBarSize={maxBarSize}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Split of a whole into a few parts (gender, outcome): one proportion bar plus a
 * list with counts and shares. Replaces pie charts, which are unreadable on phones.
 * parts: [{ label, value, color }]
 */
export function ShareBar({ parts, total: totalProp }) {
  const total = totalProp ?? parts.reduce((sum, p) => sum + toNum(p.value), 0);
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-ink-faint" aria-hidden="true">
        {total > 0 &&
          parts.map((p) => (
            <span key={p.label} style={{ width: `${(toNum(p.value) / total) * 100}%`, backgroundColor: p.color }} />
          ))}
      </div>
      <ul className="mt-3 divide-y divide-line">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-3 py-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} aria-hidden="true" />
            <span className="flex-1 min-w-0 text-sm text-ink">{p.label}</span>
            <span className="font-display text-lg text-ink">{toNum(p.value)}</span>
            <span className="w-14 text-end text-xs text-muted">{pct(p.value, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Tabular data: stacked rows on phones, a real table from lg up.
 * columns: [{ key, label, render?(row), primary?, align? }]
 * The primary column is the row title on phones.
 */
export function ResponsiveTable({ columns, rows, rowKey, footer, empty = 'لا توجد بيانات.' }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  const cell = (col, row) => (col.render ? col.render(row) : row[col.key] ?? '—');
  const primary = columns.find((c) => c.primary) || columns[0];
  const rest = columns.filter((c) => c !== primary);
  const all = footer ? [...rows, { ...footer, __footer: true }] : rows;

  return (
    <>
      <ul className="lg:hidden divide-y divide-line -mx-4">
        {all.map((row, i) => (
          <li key={row.__footer ? '__footer' : rowKey(row, i)} className={cx('px-4 py-3', row.__footer && 'bg-paper')}>
            <p className="font-semibold text-ink">{cell(primary, row)}</p>
            <dl className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
              {rest.map((col) => (
                <div key={col.key} className="flex items-baseline justify-between gap-2 min-w-0">
                  <dt className="text-xs text-muted truncate">{col.label}</dt>
                  <dd className="text-sm font-semibold text-ink whitespace-nowrap">{cell(col, row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden lg:block overflow-x-auto -mx-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line bg-paper text-muted">
              {columns.map((col) => (
                <th key={col.key} className={cx('px-3 py-2.5 font-semibold align-bottom leading-snug', col.align === 'center' ? 'text-center' : 'text-start')}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {all.map((row, i) => (
              <tr key={row.__footer ? '__footer' : rowKey(row, i)} className={cx(row.__footer && 'bg-paper font-semibold')}>
                {columns.map((col) => (
                  <td key={col.key} className={cx('px-3 py-2.5 text-ink', col.align === 'center' ? 'text-center' : 'text-start', col === primary && 'font-semibold')}>
                    {cell(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Ranked list with a thin proportion bar per row; good for long category lists. */
export function RankList({ items, total, color = CHART.inkSoft, max }) {
  const list = max ? items.slice(0, max) : items;
  const top = Math.max(1, ...list.map((i) => toNum(i.value)));
  return (
    <ol className="divide-y divide-line">
      {list.map((item, index) => (
        <li key={`${item.label}-${index}`} className="py-2.5">
          <div className="flex items-baseline gap-3">
            <span className="w-6 text-xs text-muted">{index + 1}</span>
            <span className="flex-1 min-w-0 truncate text-sm text-ink">
              {item.label}
              {item.sub && <span className="text-muted"> ({item.sub})</span>}
            </span>
            <span className="font-semibold text-ink">{toNum(item.value)}</span>
            {total !== undefined && <span className="w-12 text-end text-xs text-muted">{pct(item.value, total)}%</span>}
          </div>
          <div className="ms-9 mt-1 h-1.5 rounded-full bg-ink-faint overflow-hidden" aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${(toNum(item.value) / top) * 100}%`, backgroundColor: color }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Downloads rows (array of arrays) as a UTF-8 CSV with BOM for Excel. Every cell goes through csvSafe. */
export const downloadCsv = (rows, filename) => {
  const csv = rows.map((row) => row.map((cell) => `"${csvSafe(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

/**
 * Opens a print popup with the given HTML (built with escapeHtml on every value).
 * Returns false when the browser blocked the popup.
 */
export const printHtml = (html) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  writePrintDocument(printWindow, html);
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
  return true;
};

export const POPUP_BLOCKED = 'منع المتصفح نافذة الطباعة. اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة.';

// Final outcome of an archived appointment (same as VisitStatistics::outcomeOf on the API)
export const ARCHIVED_OUTCOMES = {
  Completed: { label: 'أنهى الفحص', color: CHART.queue },
  Waiting: { label: 'حضر ولم يُفحص', color: CHART.pushed },
  Pending: { label: 'لم يحضر', color: CHART.pending },
};
