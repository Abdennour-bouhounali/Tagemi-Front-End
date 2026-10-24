import { API_BASE_URL } from '../../../config/environment';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Footprints, Timer, Undo2, Star, User } from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import useLiveRefresh from '../../../utils/useLiveRefresh';
import { Button, PageHeader, StatStrip, EmptyState, LoadingState, Ticket, useToast, cx } from '../../../Components/ui';

const apiUrl = API_BASE_URL;

// Hidden dilatation station of a specialty (e.g. تصحيح النظر). The specialty
// officer sends patients here; this screen receives them and sends them back,
// with priority, when dilatation is done.
export default function DilatationRoom() {
  const { eventId, eventSpecialtyId } = useParams();
  const { token, user } = useContext(AppContext);
  const toast = useToast();

  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // Server clock minus device clock, so timers don't depend on the phone's clock
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/event-specialties/${eventSpecialtyId}/dilatation-room`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.server_time) setClockOffset(new Date(json.server_time).getTime() - Date.now());
      } else {
        toast(json.message || 'تعذر تحميل قاعة التمدد', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    }
  }, [eventSpecialtyId, token, toast]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(eventId, token, load);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const act = async (patient, url, fallback) => {
    setBusyId(patient.id);
    try {
      const res = await fetch(`${apiUrl}${url}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json().catch(() => ({}));
      toast(json.message || fallback, res.ok ? 'success' : 'error');
      if (res.ok) load();
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const minutesSince = (iso) => (iso ? Math.max(0, Math.floor((now + clockOffset - new Date(iso).getTime()) / 60000)) : 0);

  if (!data) return <LoadingState />;

  const backTo = user?.role_id === 1 ? `/admin/event-tracking/${eventId}` : `/admin/stations/${eventId}`;

  const Who = ({ p }) => (
    <>
      <p className="font-semibold text-ink truncate">{p.full_name}</p>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
        <span className="font-semibold text-ink">#{p.patient_id}</span>
        <User className={cx('w-3.5 h-3.5', String(p.sex) === '1' ? 'text-rose' : 'text-ink-soft')} />
        {p.is_special && <span className="inline-flex items-center gap-1 text-rose"><Star className="w-3.5 h-3.5" />حالة خاصة</span>}
      </div>
    </>
  );

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto">
      <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-muted mb-2 min-h-[2.75rem]">
        <ChevronRight className="w-4 h-4" /> كل الطوابير
      </Link>
      <PageHeader title={`قاعة تمدد ${data.specialty}`} subtitle={`بعد التمدد يعود المريض إلى رأس طابور ${data.specialty}`} />

      <StatStrip
        className="mb-5"
        items={[
          { label: 'في الطريق', value: data.coming.length, tone: 'text-st-pushed' },
          { label: 'في القاعة', value: data.in_room.length, tone: 'text-st-dil' },
        ]}
      />

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
      <section>
      <h2 className="flex items-center gap-2 font-display text-lg text-ink mb-2">
        <Footprints className="w-5 h-5 text-st-pushed" /> في الطريق إلى القاعة
      </h2>
      {data.coming.length === 0 ? (
        <p className="text-sm text-muted bg-white border border-line rounded-2xl px-4 py-5 mb-6 lg:mb-0 text-center">لا أحد في الطريق الآن.</p>
      ) : (
        <ol className="space-y-3 mb-6 lg:mb-0 2xl:grid 2xl:grid-cols-2 2xl:gap-3 2xl:space-y-0">
          {data.coming.map((p) => (
            <li key={p.id}>
              <Ticket position={minutesSince(p.dilatation_sent_at)} stubCaption="دقيقة">
                <Who p={p} />
                <Button variant="primary" size="lg" block className="mt-3" loading={busyId === p.id}
                  onClick={() => act(p, `/api/waitinglist/DilatationArrived/${p.id}`, 'تم تسجيل الوصول')}>
                  وصل إلى القاعة
                </Button>
              </Ticket>
            </li>
          ))}
        </ol>
      )}
      </section>

      <section>
      <h2 className="flex items-center gap-2 font-display text-lg text-ink mb-2">
        <Timer className="w-5 h-5 text-st-dil" /> في التمدد
      </h2>
      {data.in_room.length === 0 ? (
        <EmptyState title="القاعة فارغة">يظهر المرضى هنا بعد تسجيل وصولهم.</EmptyState>
      ) : (
        <ol className="space-y-3 2xl:grid 2xl:grid-cols-2 2xl:gap-3 2xl:space-y-0">
          {data.in_room.map((p) => (
            <li key={p.id}>
              <Ticket position={minutesSince(p.dilatation_started_at)} stubCaption="دقيقة">
                <Who p={p} />
                <Button variant="success" size="lg" block icon={Undo2} className="mt-3" loading={busyId === p.id}
                  onClick={() => act(p, `/api/waitinglist/FinishedDilatation/${p.id}`, 'عاد المريض بأولوية')}>
                  انتهى التمدد، أرجعه إلى {data.specialty}
                </Button>
              </Ticket>
            </li>
          ))}
        </ol>
      )}
      </section>
      </div>
    </div>
  );
}
