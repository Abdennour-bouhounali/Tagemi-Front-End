// The single definition of appointment statuses on the frontend.
// Mirrors app/Support/VisitStatistics.php on the API: keep both in sync.

export const STATUS_GROUPS = {
  pending: ['Pending'], // booked, not arrived
  waiting: ['Waiting'], // arrived, on hold for this specialty
  in_queue: ['Present', 'Commingsoon'], // in this specialty's queue
  dilatation: ['DilatationSent', 'Dilatation'], // sent to / in the dilatation room
  completed: ['Completed'],
};

export const GROUP_LABELS = {
  pending: 'لم يحضر بعد',
  waiting: 'في الانتظار (تخصص آخر أولاً)',
  in_queue: 'في الطابور',
  dilatation: 'في التمدد',
  completed: 'أنهى الفحص',
};

export const STATUS_LABELS = {
  Pending: 'لم يحضر بعد',
  Waiting: 'في الانتظار',
  Present: 'في الطابور',
  Commingsoon: 'تم إنزاله',
  DilatationSent: 'متجه إلى التمدد',
  Dilatation: 'في التمدد',
  Completed: 'أنهى الفحص',
};

export const statusGroup = (status) => {
  for (const [group, statuses] of Object.entries(STATUS_GROUPS)) {
    if (statuses.includes(status)) return group;
  }
  return 'pending';
};

export const statusLabel = (status) => STATUS_LABELS[status] || status;

// Same keys and meaning as VisitStatistics::summarize() on the API.
export const summarizeVisits = (appointments = []) => {
  const counts = Object.fromEntries(Object.keys(STATUS_GROUPS).map((g) => [g, 0]));
  const byPatient = new Map();

  appointments.forEach((apt) => {
    counts[statusGroup(apt.status)] += 1;
    const rows = byPatient.get(apt.patient_id) || [];
    rows.push(apt);
    byPatient.set(apt.patient_id, rows);
  });

  const patients = [...byPatient.values()];
  return {
    ...counts,
    total: appointments.length,
    patients_total: patients.length,
    patients_arrived: patients.filter((rows) => rows.some((a) => a.status !== 'Pending')).length,
    patients_finished: patients.filter((rows) => rows.every((a) => a.status === 'Completed')).length,
  };
};
