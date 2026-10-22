import { useState, useContext, useEffect } from 'react';
import { Copy, Printer, Link as LinkIcon, Monitor, Ticket, Droplets } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import { AppContext } from '../../../../Context/AppContext';
import { escapeHtml, writePrintDocument } from '../../../../utils/safeHtml';
import { Sheet, StatStrip, LoadingState, IconButton, Button, useToast } from '../../../../Components/ui';

const apiUrl = import.meta.env.VITE_API_URL;

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('ar-DZ');
};

// Unique days (by date), sorted
const uniqueDays = (days = []) => {
  const map = new Map();
  days.forEach((day) => {
    if (day.day_date && !map.has(day.day_date)) map.set(day.day_date, day);
  });
  return [...map.values()].sort((a, b) => new Date(a.day_date) - new Date(b.day_date));
};

/** Event details and public links, in a sheet. */
const EventDetails = ({ event, onClose }) => {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/events/${event.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setEventDetails(data.event);
        } else {
          toast('تعذر تحميل تفاصيل الحدث', 'error');
        }
      } catch {
        toast('تعذر الاتصال بالخادم', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [event.id, token, toast]);

  const appointmentLink = `${window.location.origin}/appointment/${event.id}`;
  const waitingListLink = `${window.location.origin}/waiting-list/${event.id}`;
  const myTurnLink = `${window.location.origin}/my-turn/${event.id}`;

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`نُسخ ${label}`);
    } catch {
      toast('تعذر النسخ، انسخ الرابط يدويًا', 'error');
    }
  };

  // Printable A4 poster with a QR code pointing to the public "my turn" page
  const printMyTurnPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast('اسمح بالنوافذ المنبثقة في المتصفح ثم أعد طباعة الملصق', 'error');
      return;
    }

    const qrSvg = renderToStaticMarkup(<QRCodeSVG value={myTurnLink} size={512} level="M" />);
    const eventName = eventDetails?.name || event?.name || '';

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>اعرف دورك - ${escapeHtml(eventName)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; }
    body {
      font-family: 'Droid Arabic Kufi', 'Noto Kufi Arabic', Tahoma, Arial, sans-serif;
      color: #101E58;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .poster {
      min-height: 270mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      border: 3px solid #101E58;
      border-radius: 8mm;
      padding: 10mm 10mm 8mm;
    }
    h1 { font-size: 44pt; font-weight: 800; color: #101E58; line-height: 1.2; }
    .event { font-size: 18pt; color: #5E6987; margin-top: 3mm; }
    .qr { width: 120mm; height: 120mm; margin: 6mm auto 2mm; }
    .qr svg { width: 100%; height: 100%; display: block; }
    .url { font-family: monospace; font-size: 10pt; color: #5E6987; direction: ltr; word-break: break-all; }
    ol { list-style: none; text-align: right; font-size: 18pt; line-height: 1.9; margin-top: 6mm; }
    ol li span.n {
      display: inline-block; width: 11mm; height: 11mm; line-height: 11mm;
      border-radius: 50%; background: #101E58; color: #fff; text-align: center;
      font-weight: 700; margin-left: 4mm; font-size: 15pt;
    }
  </style>
</head>
<body>
  <div class="poster">
    <div>
      <h1>اعرف دورك</h1>
      <div class="event">${escapeHtml(eventName)}</div>
    </div>
    <div>
      <div class="qr">${qrSvg}</div>
      <div class="url">${escapeHtml(myTurnLink)}</div>
    </div>
    <ol>
      <li><span class="n">1</span>امسح الرمز بهاتفك</li>
      <li><span class="n">2</span>أدخل رقم المريض ورقم هاتفك</li>
      <li><span class="n">3</span>تابع دورك مباشرة</li>
    </ol>
  </div>
</body>
</html>`;

    writePrintDocument(printWindow, html);
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const ev = eventDetails;
  const specs = ev?.event_specialties || [];
  const allDays = uniqueDays(specs.flatMap((es) => es.days || []));
  const totalAppointments = specs.reduce((sum, es) => sum + (es.appointments_count ?? es.appointments?.length ?? 0), 0);
  const totalHours = specs.reduce((sum, es) => sum + (es.days || []).reduce((a, d) => a + (d.hours?.length || 0), 0), 0);
  const status = ev?.is_archived ? 'مؤرشف' : ev?.is_active ? 'نشط' : 'غير نشط';

  const links = [
    { icon: LinkIcon, title: 'رابط الحجز', hint: 'شاركه مع المرضى ليحجزوا موعدًا', url: appointmentLink, label: 'رابط الحجز' },
    { icon: Monitor, title: 'شاشة قاعة الانتظار', hint: 'افتحه على شاشة العرض في القاعة', url: waitingListLink, label: 'رابط شاشة الانتظار' },
    { icon: Ticket, title: 'صفحة «اعرف دورك»', hint: 'يمسح المريض رمز QR ليعرف عدد من أمامه', url: myTurnLink, label: 'رابط «اعرف دورك»' },
  ];

  return (
    <Sheet open onClose={onClose} title={ev?.name || event.name} size="lg">
      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-muted -mt-1">
            {status}، {formatDate(ev?.date || event.date)}
            {(ev?.city || ev?.state) && `، ${[ev?.city, ev?.state].filter(Boolean).join('، ')}`}
          </p>

          <StatStrip
            items={[
              { label: 'التخصصات', value: specs.length },
              { label: 'المواعيد', value: totalAppointments },
              { label: 'الأيام', value: allDays.length },
              { label: 'الساعات', value: totalHours },
            ]}
          />

          <section>
            <h3 className="font-semibold text-ink mb-1">الروابط العامة</h3>
            <ul className="divide-y divide-line">
              {links.map((link) => (
                <li key={link.url} className="flex items-center gap-3 py-2">
                  <link.icon className="w-5 h-5 text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-sm">{link.title}</p>
                    <p className="text-xs text-muted truncate">{link.hint}</p>
                    <p className="text-xs text-ink-soft truncate font-mono" dir="ltr">{link.url}</p>
                  </div>
                  <IconButton icon={Copy} label={`انسخ ${link.label}`} onClick={() => copy(link.url, link.label)} />
                </li>
              ))}
            </ul>
            <Button variant="secondary" icon={Printer} block className="mt-2" onClick={printMyTurnPoster}>
              اطبع ملصق «اعرف دورك»
            </Button>
          </section>

          {ev?.description && (
            <section>
              <h3 className="font-semibold text-ink mb-1">الوصف</h3>
              <p className="text-sm text-ink bg-paper rounded-xl p-3 whitespace-pre-line">{ev.description}</p>
            </section>
          )}

          {specs.length > 0 && (
            <section>
              <h3 className="font-semibold text-ink mb-1">التخصصات</h3>
              <ul className="divide-y divide-line">
                {specs.map((es, index) => {
                  const days = uniqueDays(es.days);
                  return (
                    <li key={es.id ?? index} className="py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink flex items-center gap-2">
                            {es.specialty?.name || 'تخصص بلا اسم'}
                            {!!es.has_dilatation && <Droplets className="w-4 h-4 text-st-dil" aria-label="قاعة تمدد" />}
                          </p>
                          {es.description && <p className="text-xs text-muted mt-0.5">{es.description}</p>}
                        </div>
                        <div className="text-center shrink-0">
                          <p className="font-display text-xl text-ink leading-none">{es.appointments_count ?? es.appointments?.length ?? 0}</p>
                          <p className="text-[11px] text-muted mt-1">موعد</p>
                        </div>
                      </div>
                      {days.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {days.map((day) => (
                            <span key={day.day_date} className="inline-flex items-center h-7 px-2 rounded-md bg-paper text-xs text-ink">
                              {formatDate(day.day_date)}
                              <span className="text-muted ms-1">({day.hours?.length || 0} ساعة)</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-paper rounded-xl p-3">
              <dt className="text-xs text-muted">نوع الحدث</dt>
              <dd className="font-semibold text-ink">{ev?.type || 'غير محدد'}</dd>
            </div>
            <div className="bg-paper rounded-xl p-3">
              <dt className="text-xs text-muted">تاريخ الإنشاء</dt>
              <dd className="font-semibold text-ink">{formatDate(ev?.created_at)}</dd>
            </div>
          </dl>
        </div>
      )}
    </Sheet>
  );
};

export default EventDetails;
