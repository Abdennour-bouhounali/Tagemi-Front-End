import { API_BASE_URL } from '../../../config/environment';
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { Sheet } from "../../../Components/ui";
import { statusLabel } from "../../../utils/visitStatus";
import { ROLE_NAMES } from "../../../utils/staffNav";

const ACTION_LABELS = {
  status_changed: 'تغيّرت الحالة',
  rescheduled: 'غيّر وقت الموعد',
  deleted: 'حذف الموعد',
  specialty_added: 'أضاف تخصصاً',
  moved_to_front: 'قدّمه إلى المركز 3',
  specialty_switched: 'بدّل التخصص',
  merged: 'دمج تسجيلاً مكرراً',
};

const slot = (s) => s && [s.specialty, s.day, s.hour && s.hour.slice(0, 5)].filter(Boolean).join('، ');

function describe(log) {
  const d = log.details || {};
  if (log.action === 'rescheduled') return `من ${slot(d.from) || '-'} إلى ${slot(d.to) || '-'}${d.over_capacity ? ' (فوق السعة)' : ''}`;
  if (log.action === 'moved_to_front') return d.specialty || '';
  if (log.action === 'specialty_switched') return `من ${d.from || '-'} إلى ${d.to || '-'}`;
  if (log.action === 'status_changed') {
    const change = d.from ? `${statusLabel(d.from)} ← ${statusLabel(d.to)}` : statusLabel(d.to);
    return [d.specialty, change].filter(Boolean).join(': ') + (d.via ? ` (${d.via})` : '');
  }
  if (log.action === 'merged') return `من الرقم #${d.from_patient_id}: ${slot(d) || '-'}`;
  return slot(d) + (d.over_capacity ? ' (فوق السعة)' : '');
}

/**
 * A patient's history, newest first: status changes and manual changes,
 * what, by whom, when. Reloads when `version` changes.
 */
export default function PatientLog({ eventId, patientId, token, version, showEmpty = false }) {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/events/${eventId}/patients/${patientId}/log`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : { logs: [] }))
      .then((data) => !cancelled && setLogs(data.logs || []))
      .catch(() => !cancelled && setLogs([]));
    return () => { cancelled = true; };
  }, [eventId, patientId, token, version]);

  if (!logs) return showEmpty ? <p className="text-sm text-muted">جاري التحميل...</p> : null;
  if (logs.length === 0) return showEmpty ? <p className="text-sm text-muted">لا توجد تغييرات بعد.</p> : null;

  return (
    <section>
      <h3 className="font-semibold text-ink mb-2 flex items-center gap-1.5">
        <History className="w-4 h-4 text-ink-soft" /> سجل التعديلات
      </h3>
      <ul className="space-y-2 text-sm">
        {logs.map((log) => (
          <li key={log.id} className="rounded-xl border border-line p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{log.action === 'status_changed' ? statusLabel(log.details?.to) : (ACTION_LABELS[log.action] || log.action)}</span>
              <time className="text-xs text-muted" dir="ltr" dateTime={log.at}>
                {log.at ? new Date(log.at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
              </time>
            </div>
            {describe(log) && <p className="text-xs text-muted mt-1">{describe(log)}</p>}
            <p className="text-xs text-ink-soft mt-1">
              بواسطة {log.user || 'النظام'}{log.user_role && ROLE_NAMES[log.user_role] ? ` (${ROLE_NAMES[log.user_role]})` : ''}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** «سجل الزائر» in a window, for any screen that shows a patient card. */
export function PatientHistorySheet({ patient, eventId, token, onClose }) {
  return (
    <Sheet open={!!patient} onClose={onClose} title={patient ? `سجل #${patient.patient_id} ${patient.full_name || ''}` : ''}>
      {patient && <PatientLog eventId={eventId} patientId={patient.patient_id} token={token} showEmpty />}
    </Sheet>
  );
}
