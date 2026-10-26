import { CalendarDays, Users, ClipboardList, ScanLine, ListOrdered, MoreHorizontal, MessageSquareHeart, UserPlus, Stethoscope } from 'lucide-react';

export const ROLE_NAMES = {
  1: 'المدير العام',
  2: 'مستخدم',
  3: 'مسؤول الحالات الخاصة',
  4: 'مسؤول التخصص',
  5: 'مسؤول الاستقبال',
  6: 'طبيب',
  7: 'مسؤول المحتوى',
  8: 'مسؤول الإنزال',
};

/** Where each role lands after login (and on the app's home tab). */
export function staffHome(user) {
  if (!user) return '/login';
  const event = user.event_id;
  switch (user.role_id) {
    case 1: return '/admin/manage-events';
    case 3:
    case 5: return event ? `/admin/check-presence/${event}` : '/admin/no-event';
    case 4:
    case 6:
    case 8: return event ? `/admin/stations/${event}` : '/admin/no-event';
    default: return '/home';
  }
}

/**
 * Bottom tabs per role (3-4 + "more"). `match` decides which tab is active
 * for the current path. The "more" tab opens a sheet (handled by the shell).
 */
export function staffTabs(user) {
  if (!user) return [];
  const e = user.event_id;
  const more = { key: 'more', label: 'المزيد', icon: MoreHorizontal };

  switch (user.role_id) {
    case 1:
      return [
        { key: 'events', label: 'الأحداث', icon: CalendarDays, to: '/admin/manage-events', match: ['/admin/manage-events', '/admin/event-', '/admin/archived', '/admin/appointment-distribution', '/admin/check-presence', '/admin/stations', '/admin/dilatation', '/admin/big-list'] },
        { key: 'users', label: 'المستخدمون', icon: Users, to: '/admin/users', match: ['/admin/users'] },
        { key: 'evaluations', label: 'التقييمات', icon: MessageSquareHeart, to: '/admin/evaluations', match: ['/admin/evaluation'] },
        more,
      ];
    case 5:
      return [
        { key: 'presence', label: 'الحضور', icon: ClipboardList, to: `/admin/check-presence/${e}`, match: ['/admin/check-presence'] },
        { key: 'scan', label: 'مسح QR', icon: ScanLine, to: `/admin/check-presence/${e}?scan=present`, match: [] },
        more,
      ];
    case 3:
      return [
        { key: 'presence', label: 'الحضور', icon: ClipboardList, to: `/admin/check-presence/${e}`, match: ['/admin/check-presence'] },
        { key: 'queue', label: 'الطوابير', icon: ListOrdered, to: `/admin/big-list-waiting/${e}`, match: ['/admin/big-list'] },
        { key: 'add', label: 'إضافة مواعيد', icon: UserPlus, to: '/admin/add-multiple-appointments', match: ['/admin/add-multiple'] },
        more,
      ];
    case 4:
    case 6:
    case 8:
      return [
        { key: 'stations', label: 'التخصصات', icon: Stethoscope, to: `/admin/stations/${e}`, match: ['/admin/stations', '/admin/event-waiting-lists', '/admin/dilatation'] },
        more,
      ];
    default:
      return [more];
  }
}

/** Extra destinations shown in the "more" sheet. */
export function staffMoreLinks(user) {
  if (user?.role_id !== 1) return [];
  return [
    { label: 'إضافة مواعيد', to: '/admin/add-multiple-appointments' },
    { label: 'التخصصات', to: '/admin/speciality' },
    { label: 'ضوابط الفحوصات', to: '/admin/rules' },
    { label: 'الرسائل', to: '/admin/contacts' },
    { label: 'المتطوعون', to: '/admin/volunteers' },
  ];
}
