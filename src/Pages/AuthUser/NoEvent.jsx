import React from 'react';
import { CalendarX } from 'lucide-react';
import { EmptyState } from '../../Components/ui';

// Staff account without an event: only the super admin can attach one.
export default function NoEvent() {
  return (
    <EmptyState icon={CalendarX} title="حسابك غير مرتبط بأي حدث">
      اطلب من المدير العام ربط حسابك بالحدث الذي تعمل فيه، ثم أعد تسجيل الدخول.
    </EmptyState>
  );
}
